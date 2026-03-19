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

	fmt.Println("🚀 Synchronizing Universal Schema (Including Pricing Engine)...")
	db.DB.AutoMigrate(
		&iam.Role{}, &iam.User{}, &crm.Agent{}, &crm.Lead{},
		&crm.UTMLog{}, &crm.LeadAssignment{}, &crm.LeadActivity{},
		&vendorModel.Vendor{}, &pkgModel.Package{}, &crm.LandingPage{},
		&Campaign{}, &CampaignCost{}, &LeadAttribution{}, &Booking{},
		&crm.TripPackage{}, &crm.PackageTier{}, &crm.TierRoomPrice{}, &crm.LeadTransaction{},
	)

	fmt.Println("🧹 Purging Legacy Simulation Data...")
	db.DB.Exec("DELETE FROM lead_transactions")
	db.DB.Exec("DELETE FROM tier_room_prices")
	db.DB.Exec("DELETE FROM package_tiers")
	db.DB.Exec("DELETE FROM trip_packages")

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
	campData := []struct {
		Name, Provider string
	}{
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

		for d := 0; d < 30; d++ {
			cost := CampaignCost{
				ID: uuid.New(), CampaignID: c.ID,
				Amount:    200000 + float64(r.Intn(800000)),
				Currency:  "IDR", CostDate: now.AddDate(0, 0, -d),
				CreatedAt: now,
			}
			db.DB.Create(&cost)
		}
	}

	// 3. Vendors
	vendorData := []struct {
		Name, Company, License string
	}{
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

	// 4. OLD Packages (for backward compatibility if needed)
	packageData := []struct {
		Name, Slug  string
		Price, Fee float64
	}{
		{"Umrah Ekonomi 9 Hari", "umrah-ekonomi", 24500000, 2000000},
		{"VIP Syawal Swissotel", "vip-syawal", 38500000, 4500000},
	}
	var createdPackages []pkgModel.Package
	for i, pd := range packageData {
		p := pkgModel.Package{
			ID: uuid.New(), VendorID: createdVendors[i].ID,
			Name: pd.Name, Slug: pd.Slug, VendorPrice: pd.Price,
			PlatformFee: pd.Fee, Status: "active",
		}
		db.DB.Create(&p)
		createdPackages = append(createdPackages, p)
	}

	// 5. NEW Pricing Engine - Trip Packages
	tripPkgData := []struct {
		Name, Dest, Ccy string
		Dur              int
	}{
		{"VIP Syawal Swissotel", "Makkah - Madinah", "IDR", 9},
		{"Plus Turki & Cappadocia", "Makkah - Madinah - Istanbul", "IDR", 12},
		{"Haji Furoda Platinum", "Makkah - Madinah VIP", "USD", 25},
		{"Umrah Backpacker Akhir Tahun", "Makkah - Madinah", "IDR", 10},
	}

	var tripPkgs []crm.TripPackage
	for _, td := range tripPkgData {
		tp := crm.TripPackage{
			ID:             uuid.New(),
			Name:           td.Name,
			Description:    "Paket spektakuler " + td.Name + " dengan fasilitas kelas dunia terbaik.",
			Destination:    td.Dest,
			DurationNights: td.Dur,
			Currency:       td.Ccy,
			Status:         "active",
			CreatedAt:      now.AddDate(0, -1, 0),
		}
		db.DB.Create(&tp)
		tripPkgs = append(tripPkgs, tp)

		// Create Tiers for this package
		tiers := []struct {
			Name, Label, Color string
			BasePrice          float64
		}{
			{"VVIP", "Premium Full Private", "#f59e0b", 45000000},
			{"Gold", "Standard Bintang 5", "#10b981", 35000000},
			{"Silver", "Reguler Ekonomi", "#94a3b8", 25000000},
		}

		if td.Ccy == "USD" {
			tiers[0].BasePrice = 12000
			tiers[1].BasePrice = 9000
			tiers[2].BasePrice = 7500
		}

		for idx, tr := range tiers {
			// Randomly omit Silver for some packages
			if idx == 2 && r.Intn(2) == 0 {
				continue
			}

			tier := crm.PackageTier{
				ID:            uuid.New(),
				TripPackageID: tp.ID,
				TierName:      tr.Name,
				TierLabel:     tr.Label,
				SortOrder:     idx + 1,
				ColorCode:     tr.Color,
				IncludesItems: "Tiket Pesawat, Hotel, Visa, Makan 3x, Mutawwif",
				CreatedAt:     now.AddDate(0, 0, -10),
			}
			db.DB.Create(&tier)

			// Room Prices
			roomTypes := []string{"quad", "triple", "double"}
			basePrice := tr.BasePrice

			for rip, rt := range roomTypes {
				// Premium for double/triple
				priceVariant := basePrice + float64(rip*2000000)
				if td.Ccy == "USD" {
					priceVariant = basePrice + float64(rip*500)
				}

				rp := crm.TierRoomPrice{
					ID:        uuid.New(),
					TierID:    tier.ID,
					RoomType:  rt,
					Price:     priceVariant,
					Quota:     10 + r.Intn(30),
					CreatedAt: now,
				}
				db.DB.Create(&rp)
			}
		}
	}

	// 6. Agents
	agentNames := []string{"Ahmad Faisal", "Aisyah", "Rizky", "Meida", "Bram"}
	var createdAgents []crm.Agent
	for _, name := range agentNames {
		user := iam.User{ID: uuid.New(), Email: strings.ToLower(strings.ReplaceAll(name, " ", "")) + "@umrahhub.id", Status: "active", RoleID: roleMap["agent"]}
		db.DB.Create(&user)
		agent := crm.Agent{
			ID: uuid.New(), UserID: user.ID,
			DailyCapacity: 25, CurrentLoad: 0, Status: "available",
		}
		db.DB.Create(&agent)
		createdAgents = append(createdAgents, agent)
	}

	// 7. 50 Highly Varied Leads with Transactions
	leadNames := []string{
		"Budi Santoso", "Siti Aminah", "Rudi Kurniawan", "Dewi Lestari", "Andi Pratama",
		"Wahyu Saputra", "Tuti Indriani", "Agus Setiawan", "Rini Mulyani", "Iwan Fals",
		"Nita Kusuma", "Hendra Wijaya", "Anita Carolina", "Doni Salman", "Rika Yuliana",
		"Eko Prasetyo", "Linda Permatasari", "Faisal Rachman", "Dina Oktavia", "Taufiq Hidayat",
		"Yudi Antoro", "Santi Novita", "Arif Rahman", "Dian Sastrowardoyo", "Reza Rahadian",
		"Intan Nuraini", "Bayu Skak", "Gita Gutawa", "Indra Bekti", "Maudy Ayunda",
		"Ariel Noah", "Luna Maya", "Deddy Corbuzier", "Raffi Ahmad", "Nagita Slavina",
		"Iqbaal Ramadhan", "Vanesha Prescilla", "Adipati Dolken", "Chelsea Islan", "Chicco Jerikho",
		"Rio Dewanto", "Atiqah Hasiholan", "Vino G. Bastian", "Marsha Timothy", "Joe Taslim",
		"Iko Uwais", "Yayan Ruhian", "Julie Estelle", "Ario Bayu", "Tara Basro",
	}
	cities := []string{"Bogor", "Jakarta Selatan", "Depok", "Bekasi", "Tangerang", "Bandung", "Surabaya", "Malang", "Medan", "Makassar"}
	statuses := []string{"new", "contacted", "qualified", "prospect", "dp", "closing", "lost"}

	fmt.Printf("💎 Injecting 50 High-Fidelity Leads & Revenue Pipeline...\n")

	for i := 0; i < 50; i++ {
		leadID := uuid.New()
		creationTime := now.AddDate(0, 0, -r.Intn(45)).Add(time.Duration(r.Intn(24)) * time.Hour)
		
		tp := tripPkgs[r.Intn(len(tripPkgs))] // Associated TripPackage
		agent := createdAgents[r.Intn(len(createdAgents))]
		finalStatus := statuses[r.Intn(len(statuses))]

		// Lead Score Logic
		score := 20 + r.Intn(60)
		if finalStatus == "dp" || finalStatus == "closing" {
			score = 85 + r.Intn(15)
		}

		pkg := createdPackages[r.Intn(len(createdPackages))]

		// CREATE LEAD
		lead := crm.Lead{
			ID:           leadID,
			Name:         leadNames[i%len(leadNames)],
			Phone:        fmt.Sprintf("081%d%d", 1+r.Intn(2), 10000000+r.Intn(89999999)),
			City:         cities[r.Intn(len(cities))],
			Message:      fmt.Sprintf("[Paket: %s] Saya sangat tertarik mendaftar untuk keluarga. Total pendaftar %d orang.", tp.Name, 1+r.Intn(5)),
			Status:       finalStatus,
			LeadScore:    score,
			LeadPriority: score / 20,
			PackageID:    pkg.ID,
			VendorID:     pkg.VendorID,
			CreatedAt:    creationTime,
		}
		db.DB.Create(&lead)

		// LEAD TRAFFIC ATTRIBUTION (UTM)
		camp := createdCampaigns[r.Intn(len(createdCampaigns))]
		db.DB.Create(&crm.UTMLog{
			ID:          uuid.New(),
			LeadID:      leadID,
			UTMSource:   camp.Provider,
			UTMMedium:   "cpc",
			UTMCampaign: camp.Name,
			UTMContent:  "ad_variant_" + fmt.Sprintf("%d", r.Intn(5)),
			FBClid:      "fb.1.171058" + uuid.New().String()[:8],
			CreatedAt:   creationTime,
		})

		// AGENT ASSIGNMENT
		db.DB.Create(&crm.LeadAssignment{
			ID:              uuid.New(),
			LeadID:          leadID,
			AgentID:         agent.ID,
			AssignedAt:      creationTime.Add(time.Minute * time.Duration(1+r.Intn(30))),
			OwnershipStatus: "active",
		})

		// PROGRESSION TIMELINE (AI Analysis, WhatsApp, Calls, etc)
		currentPath := []string{"new"}
		if finalStatus != "new" {
			currentPath = append(currentPath, "contacted")
			if finalStatus == "dp" || finalStatus == "closing" || finalStatus == "prospect" || finalStatus == "qualified" {
				currentPath = append(currentPath, "qualified")
				if finalStatus != "qualified" {
					currentPath = append(currentPath, "prospect")
					if finalStatus == "dp" || finalStatus == "closing" {
						currentPath = append(currentPath, finalStatus)
					}
				}
			}
			if finalStatus == "lost" {
				currentPath = append(currentPath, "lost")
			}
		}

		lastStepTime := creationTime
		for stepIdx, stage := range currentPath {
			stepTime := lastStepTime.Add(time.Hour * time.Duration(2+r.Intn(48)))
			if stepTime.After(now) {
				stepTime = now.Add(-time.Minute * time.Duration(1+r.Intn(60)))
			}

			db.DB.Create(&crm.LeadActivity{
				ID:        uuid.New(),
				LeadID:    leadID,
				Type:      "status_change",
				Content:   fmt.Sprintf("Status updated to %s", strings.ToUpper(stage)),
				AgentName: agentNames[r.Intn(len(agentNames))],
				CreatedAt: stepTime,
			})

			if stage == "contacted" {
				db.DB.Create(&crm.LeadActivity{
					ID:        uuid.New(),
					LeadID:    leadID,
					Type:      "wa_sent",
					Content:   fmt.Sprintf("Sent PDF itinerary for %s. Lead seems responsive.", tp.Name),
					AgentName: agentNames[r.Intn(len(agentNames))],
					CreatedAt: stepTime.Add(time.Minute * 10),
				})
			}

			if stepIdx == 0 && score > 80 {
				db.DB.Create(&crm.LeadActivity{
					ID:        uuid.New(),
					LeadID:    leadID,
					Type:      "ai_analysis",
					Content:   fmt.Sprintf("AI Alert: Extremely high conversion intent (%d/100). Suggesting premium up-sell.", score),
					AgentName: "System AI",
					CreatedAt: stepTime.Add(time.Minute * 1),
				})
			}

			lastStepTime = stepTime
		}

		// ─── REVENUE INJECTION (DP or Closing) ───
		if finalStatus == "dp" || finalStatus == "closing" {
			// Find a random tier and room price for this package!
			var tiers []crm.PackageTier
			db.DB.Where("trip_package_id = ?", tp.ID).Find(&tiers)

			if len(tiers) > 0 {
				selectedTier := tiers[r.Intn(len(tiers))]
				var roomPrices []crm.TierRoomPrice
				db.DB.Where("tier_id = ?", selectedTier.ID).Find(&roomPrices)

				if len(roomPrices) > 0 {
					selectedRoom := roomPrices[r.Intn(len(roomPrices))]
					paxCount := 1 + r.Intn(4) // 1 to 5 pax
					finalAmount := selectedRoom.Price * float64(paxCount)

					tx := crm.LeadTransaction{
						ID:              uuid.New(),
						LeadID:          leadID,
						TripPackageID:   &tp.ID,
						TierID:          &selectedTier.ID,
						RoomPriceID:     &selectedRoom.ID,
						Currency:        tp.Currency,
						TransactionType: finalStatus, // dp or full_payment(closing)
						PaxCount:        paxCount,
						FinalAmount:     finalAmount,
						Notes:           fmt.Sprintf("Auto-generated seeding transaction for %s", tp.Name),
						CreatedAt:       lastStepTime,
					}
					
					if finalStatus == "dp" {
						dpAmt := 5000000.0 // 5jt IDR Base DP
						if tp.Currency == "USD" {
							dpAmt = 500.0 // 500 USD Base DP
						}
						dpAmt = dpAmt * float64(paxCount)
						tx.DPAmount = &dpAmt
						tx.TransactionType = "dp"
					} else { // closing
						tx.TransactionType = "full_payment"
					}

					db.DB.Create(&tx)
				}
			}
		} // end if dp or closing
	} // end of 50 leads loop

	fmt.Println("🎉 Database Seeding & Mock Scenarios Injection Complete!")
}
