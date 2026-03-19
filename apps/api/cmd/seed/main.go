package main

import (
	"fmt"
	"log"
	"math/rand"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/joho/godotenv"
	"github.com/user/umrah-hub-aggregator/apps/api/internal/crm"
	"github.com/user/umrah-hub-aggregator/apps/api/internal/iam"
	pkgModel "github.com/user/umrah-hub-aggregator/apps/api/internal/package"
	vendorModel "github.com/user/umrah-hub-aggregator/apps/api/internal/provider"
	"github.com/user/umrah-hub-aggregator/apps/api/pkg/db"
)

// Local models for tables without global structs yet
type Campaign struct {
	ID        uuid.UUID `gorm:"type:uuid;primary_key"`
	Name      string    `gorm:"size:100"`
	Provider  string    `gorm:"size:50"`
	Status    string    `gorm:"size:20"`
	CreatedAt time.Time
}

type CampaignCost struct {
	ID         uuid.UUID `gorm:"type:uuid;primary_key"`
	CampaignID uuid.UUID `gorm:"type:uuid"`
	Amount     float64   `gorm:"type:decimal(15,2)"`
	Currency   string    `gorm:"size:10"`
	CostDate   time.Time
	CreatedAt  time.Time
}

type LeadAttribution struct {
	ID          uuid.UUID `gorm:"type:uuid;primary_key"`
	LeadID      uuid.UUID `gorm:"type:uuid"`
	UTMSource   string    `gorm:"size:100"`
	UTMMedium   string    `gorm:"size:100"`
	UTMCampaign string    `gorm:"size:100"`
	UTMContent  string    `gorm:"size:100"`
	FBClid      string    `gorm:"size:255"`
	IPAddress   string    `gorm:"size:45"`
	CreatedAt   time.Time
}

type Booking struct {
	ID            uuid.UUID `gorm:"type:uuid;primary_key"`
	LeadID        uuid.UUID `gorm:"type:uuid"`
	PackageID     uuid.UUID `gorm:"type:uuid"`
	VendorID      uuid.UUID `gorm:"type:uuid"`
	VendorPrice   float64   `gorm:"type:decimal(15,2)"`
	CustomerPrice float64   `gorm:"type:decimal(15,2)"`
	PlatformFee   float64   `gorm:"type:decimal(15,2)"`
	Status        string    `gorm:"size:50"`
	CreatedAt     time.Time
}

func main() {
	if err := godotenv.Load(".env"); err != nil {
		log.Println("No .env file found, using system environment variables")
	}

	db.InitDB()
	
	fmt.Println("🚀 Sycnronizing Universal Schema...")
	db.DB.AutoMigrate(
		&iam.Role{}, &iam.User{}, &crm.Agent{}, &crm.Lead{}, 
		&crm.UTMLog{}, &crm.LeadAssignment{}, &crm.LeadActivity{},
		&vendorModel.Vendor{}, &pkgModel.Package{}, &crm.LandingPage{},
		&Campaign{}, &CampaignCost{}, &LeadAttribution{}, &Booking{},
	)

	fmt.Println("🧹 Purging Legacy Simulation Data...")
	db.DB.Exec("DELETE FROM bookings")
	db.DB.Exec("DELETE FROM lead_attribution")
	db.DB.Exec("DELETE FROM campaign_costs")
	db.DB.Exec("DELETE FROM campaigns")
	db.DB.Exec("DELETE FROM lead_activities")
	db.DB.Exec("DELETE FROM lead_assignments")
	db.DB.Exec("DELETE FROM utm_logs")
	db.DB.Exec("DELETE FROM leads")
	db.DB.Exec("DELETE FROM agents")
	db.DB.Exec("DELETE FROM users")
	db.DB.Exec("DELETE FROM roles")
	db.DB.Exec("DELETE FROM landing_pages")
	db.DB.Exec("DELETE FROM packages")
	db.DB.Exec("DELETE FROM vendors")

	r := rand.New(rand.NewSource(time.Now().UnixNano()))
	now := time.Now()

	// 1. Roles
	roleNames := []string{"super_admin", "admin", "agent"}
	roleMap := make(map[string]uuid.UUID)
	for _, rn := range roleNames {
		role := iam.Role{ID: uuid.New(), Name: rn}
		db.DB.Create(&role)
		roleMap[rn] = role.ID
	}

	// 2. Campaigns
	campData := []struct{Name, Provider string}{
		{"Ramadhan Blessing 2026", "meta"},
		{"Syawal Berkah Promo", "google"},
		{"Summer Umrah Turkish", "tiktok"},
		{"Flash Sale 12.12", "meta"},
	}
	var createdCampaigns []Campaign
	for _, cd := range campData {
		c := Campaign{ID: uuid.New(), Name: cd.Name, Provider: cd.Provider, Status: "active", CreatedAt: now.AddDate(0, -3, 0)}
		db.DB.Create(&c)
		createdCampaigns = append(createdCampaigns, c)
		
		// Seed Costs for last 30 days
		for d := 0; d < 30; d++ {
			cost := CampaignCost{
				ID: uuid.New(), CampaignID: c.ID,
				Amount: 200000 + float64(r.Intn(800000)),
				Currency: "IDR", CostDate: now.AddDate(0, 0, -d),
				CreatedAt: now,
			}
			db.DB.Create(&cost)
		}
	}

	// 3. Vendors
	vendorData := []struct{Name, Company, License string}{
		{"Al-Fath Travel", "PT Al-Fath Global Wisata", "UM-102/2023"},
		{"Mabrur Hajj Services", "PT Mabrur Berkah Jaya", "HJ-442/2022"},
		{"Rabbani Umrah", "PT Rabbani Semesta", "UM-990/2024"},
	}
	var createdVendors []vendorModel.Vendor
	for _, vd := range vendorData {
		v := vendorModel.Vendor{ID: uuid.New(), VendorName: vd.Name, CompanyName: vd.Company, LicenseNumber: vd.License, Status: "active"}
		db.DB.Create(&v)
		createdVendors = append(createdVendors, v)
	}

	// 4. Packages
	packageData := []struct{Name, Slug string; Price, Fee float64}{
		{"Umrah Ekonomi 9 Hari", "umrah-ekonomi", 24500000, 2000000},
		{"VIP Syawal Swissotel", "vip-syawal", 38500000, 4500000},
		{"Haji Furoda Platinum", "haji-furoda", 280000000, 25000000},
		{"Plus Turki & Cappadocia", "umrah-turki", 42000000, 5000000},
		{"Umrah Milenial Backpacker", "umrah-milenial", 19900000, 1500000},
	}
	var createdPackages []pkgModel.Package
	for i, pd := range packageData {
		p := pkgModel.Package{
			ID: uuid.New(), VendorID: createdVendors[i%len(createdVendors)].ID, 
			Name: pd.Name, Slug: pd.Slug, VendorPrice: pd.Price, 
			PlatformFee: pd.Fee, Status: "active",
		}
		db.DB.Create(&p)
		createdPackages = append(createdPackages, p)
	}

	// 5. Agents
	agentNames := []string{"Faisal", "Aisyah", "Rizky", "Meida", "Bram"}
	var createdAgents []crm.Agent
	for _, name := range agentNames {
		user := iam.User{ID: uuid.New(), Email: strings.ToLower(name) + "@umrahhub.id", Status: "active", RoleID: roleMap["agent"]}
		db.DB.Create(&user)
		agent := crm.Agent{
			ID: uuid.New(), UserID: user.ID, 
			DailyCapacity: 25, CurrentLoad: 0, Status: "available",
		}
		db.DB.Create(&agent)
		createdAgents = append(createdAgents, agent)
	}

	// 6. Detailed Leads (Super High Fidelity)
	leadNames := []string{"Ahmad Fauzi", "Siti Mariam", "Budi Raharjo", "Indah Permata", "Taufik Hidayat", "Dewi Sartika", "Eko Prasetyo", "Rina Marlina", "Hendra Wijaya", "Lani Astuti", "Farhan Rizky", "Maya Indah", "Guntur Pratama", "Sari Dewi", "Rizki Fauzi", "Nina Kartika", "Doni Setiawan", "Wati Kurnia", "Andi Saputra", "Yuni Lestari"}
	cities := []string{"Bogor", "Jakarta Selatan", "Depok", "Bekasi", "Tangerang", "Bandung", "Surabaya"}
	statuses := []string{"new", "contacted", "qualified", "prospect", "closing", "booked", "lost"}
	
	fmt.Printf("💎 Generating High-Fidelity Intelligence Data for 50 Leads...\n")
	for i := 0; i < 50; i++ {
		leadID := uuid.New()
		creationTime := now.AddDate(0, 0, -r.Intn(30)).Add(time.Duration(r.Intn(24)) * time.Hour)
		pkg := createdPackages[r.Intn(len(createdPackages))]
		agent := createdAgents[r.Intn(len(createdAgents))]
		finalStatus := statuses[r.Intn(len(statuses))]
		
		score := 30 + r.Intn(65)
		if finalStatus == "booked" || finalStatus == "closing" {
			score = 85 + r.Intn(15)
		}

		// CREATE LEAD
		lead := crm.Lead{
			ID: leadID, Name: leadNames[r.Intn(len(leadNames))],
			Phone: fmt.Sprintf("081%d%d", 1+r.Intn(2), 10000000+r.Intn(89999999)),
			City: cities[r.Intn(len(cities))],
			Message: fmt.Sprintf("[Paket: %s] [Budget: Rp%vjt] Saya ingin berkonsultasi mengenai rencana umrah keluarga saya.", pkg.Name, 25+r.Intn(15)),
			Status: finalStatus, LeadScore: score,
			LeadPriority: score / 20, 
			PackageID: pkg.ID, VendorID: pkg.VendorID,
			CreatedAt: creationTime,
		}
		db.DB.Create(&lead)

		// UTM LOGS (MANDATORY FOR GRAPHS)
		camp := createdCampaigns[r.Intn(len(createdCampaigns))]
		db.DB.Create(&crm.UTMLog{
			ID: uuid.New(), LeadID: leadID,
			UTMSource: camp.Provider, UTMMedium: "cpc",
			UTMCampaign: camp.Name, UTMContent: "video_ads_creative",
			FBClid: "fb.1.171058" + uuid.New().String()[:8],
			CreatedAt: creationTime,
		})

		// ASSIGNMENT
		db.DB.Create(&crm.LeadAssignment{
			ID: uuid.New(), LeadID: leadID, AgentID: agent.ID,
			AssignedAt: creationTime.Add(time.Minute * time.Duration(2+r.Intn(15))),
			OwnershipStatus: "active",
		})

		// ACTIVITY & LOG HISTORY
		// Simulate status progression: new -> contacted -> ... -> finalStatus
		currentPath := []string{"new"}
		if finalStatus != "new" {
			currentPath = append(currentPath, "contacted")
			if finalStatus != "contacted" {
				currentPath = append(currentPath, finalStatus)
			}
		}

		lastStepTime := creationTime
		for stepIdx, stage := range currentPath {
			stepTime := lastStepTime.Add(time.Hour * time.Duration(1+r.Intn(48)))
			if stepTime.After(now) { break }

			// Log Status Change
			db.DB.Create(&crm.LeadActivity{
				ID: uuid.New(), LeadID: leadID,
				Type: "status_change",
				Content: fmt.Sprintf("Status updated to %s (Automatic Pipeline)", strings.ToUpper(stage)),
				AgentName: agentNames[r.Intn(len(agentNames))],
				CreatedAt: stepTime,
			})

			// Add random interaction logs
			if stage == "contacted" {
				db.DB.Create(&crm.LeadActivity{
					ID: uuid.New(), LeadID: leadID,
					Type: "wa_sent",
					Content: "Diberikan penawaran brosur digital paket " + pkg.Name,
					AgentName: agentNames[r.Intn(len(agentNames))], CreatedAt: stepTime.Add(time.Minute * 10),
				})
			}
			
			if stepIdx == 0 && score > 80 {
				db.DB.Create(&crm.LeadActivity{
					ID: uuid.New(), LeadID: leadID,
					Type: "ai_analysis",
					Content: fmt.Sprintf("AI Score Alert: Lead detected with high intent (%d). Immediate contact recommended.", score),
					AgentName: "AI Auditor", CreatedAt: stepTime.Add(time.Minute * 1),
				})
			}

			lastStepTime = stepTime
		}

		// IF BOOKED, CREATE BOOKING
		if finalStatus == "booked" {
			db.DB.Create(&Booking{
				ID: uuid.New(), LeadID: leadID, PackageID: pkg.ID, VendorID: pkg.VendorID,
				VendorPrice: pkg.VendorPrice, CustomerPrice: pkg.VendorPrice + pkg.PlatformFee,
				PlatformFee: pkg.PlatformFee, Status: "confirmed",
				CreatedAt: lastStepTime,
			})
		}
	}

	fmt.Println("✨ High-Performance Intelligence Matrix Successfully Injected.")
}
