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
		{"Flash Sale Sultan", "meta"},
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

	// 3. Vendors (5 Tiers: Entry -> VVIP)
	vendorData := []struct {
		Name, Company, License, Tier string
	}{
		{"Bismillah Berkah Economy", "PT Bismillah Hemat", "UM-EE-101", "entry"},
		{"Harmoni Umrah Standard", "PT Harmoni Reguler", "UM-STD-222", "standard"},
		{"Al-Fath Global Travel", "PT Al-Fath Premium", "UM-PRM-333", "premium"},
		{"Mabrur Executive Hajj", "PT Mabrur VVIP", "UM-EXC-444", "exclusive"},
		{"Sultan Private Jet Tours", "PT Sultan Dirgantara", "UM-ULT-555", "vvip"},
	}
	var createdVendors []vendorModel.Vendor
	for _, vd := range vendorData {
		v := vendorModel.Vendor{ID: uuid.New(), VendorName: vd.Name, CompanyName: vd.Company, LicenseNumber: vd.License, Status: "active"}
		db.DB.Create(&v)
		createdVendors = append(createdVendors, v)
	}

	// 4. OLD Packages Mapper (for compatibility)
	var createdPackages []pkgModel.Package
	for i, vd := range createdVendors {
		p := pkgModel.Package{
			ID: uuid.New(), VendorID: vd.ID, Name: vd.VendorName + " Promo", Slug: "promo-" + fmt.Sprintf("%d", i),
			VendorPrice: 20000000 + float64(i*5000000), PlatformFee: 2000000, Status: "active",
		}
		db.DB.Create(&p)
		createdPackages = append(createdPackages, p)
	}

	// 5. NEW Pricing Engine - Trip Packages (Linked to Vendors)
	// Entry (0), Standard (1), Premium (2), Exclusive (3), VVIP (4)
	tripPkgData := []struct {
		VendorIdx        int
		Name, Dest, Ccy string
		Dur              int
	}{
		{0, "Umrah Backpacker Hemat", "Makkah - Madinah", "IDR", 10},
		{1, "Umrah Plus Thaif", "Makkah - Madinah - Thaif", "IDR", 9},
		{2, "VIP Syawal Swissotel", "Makkah - Madinah", "IDR", 9},
		{3, "Plus Turki & Cappadocia", "Makkah - Istanbul", "IDR", 12},
		{4, "Haji Furoda Platinum / Private Jet", "Makkah VIP", "USD", 25},
	}

	var tripPkgs []crm.TripPackage
	for _, td := range tripPkgData {
		vid := createdVendors[td.VendorIdx].ID
		tp := crm.TripPackage{
			ID:             uuid.New(),
			VendorID:       &vid,
			Name:           td.Name,
			Description:    "Paket premium terbaik dari " + createdVendors[td.VendorIdx].VendorName,
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
			tiers[0].BasePrice = 15000
			tiers[1].BasePrice = 12000
			tiers[2].BasePrice = 9000
		} else { // Adjust price drastically based on vendor tier
			multiplier := float64(td.VendorIdx+1) // 1 to 5
			tiers[0].BasePrice = 20000000 * multiplier
			tiers[1].BasePrice = 17000000 * multiplier
			tiers[2].BasePrice = 14000000 * multiplier
		}

		for idx, tr := range tiers {
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

			roomTypes := []string{"quad", "triple", "double"}
			for rip, rt := range roomTypes {
				priceVariant := tr.BasePrice + float64(rip*2000000)
				if td.Ccy == "USD" {
					priceVariant = tr.BasePrice + float64(rip*500)
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
	agentNames := []string{"Faisal", "Aisyah", "Meida", "Bram", "Rizky"}
	var createdAgents []crm.Agent
	for _, name := range agentNames {
		user := iam.User{ID: uuid.New(), Email: strings.ToLower(name) + "@umrahhub.id", Status: "active", RoleID: roleMap["agent"]}
		db.DB.Create(&user)
		agent := crm.Agent{ID: uuid.New(), UserID: user.ID, DailyCapacity: 30, Status: "available"}
		db.DB.Create(&agent)
		createdAgents = append(createdAgents, agent)
	}

	// 7. 50 Highly Varied Leads with AI Score Calculation
	fmt.Printf("💎 Injecting 50 High-Fidelity Leads with Dynamic AI Sentiments...\n")

	leadNames := []string{
		"Budi Santoso", "Siti Aminah", "Ario Bayu", "Tara Basro", "Andi Pratama",
		"Wahyu Saputra", "Tuti Indriani", "Reza Rahadian", "Rini Mulyani", "Iwan Fals",
		"Nita Kusuma", "Hendra Wijaya", "Anita Carolina", "Doni Salman", "Rika Yuliana",
		"Eko Prasetyo", "Linda Permatasari", "Faisal Rachman", "Dina Oktavia", "Taufiq Hidayat",
		"Yudi Antoro", "Santi Novita", "Arif Rahman", "Dian Sastrowardoyo", "Raffi Ahmad",
		"Intan Nuraini", "Bayu Skak", "Gita Gutawa", "Indra Bekti", "Maudy Ayunda",
		"Ariel Noah", "Luna Maya", "Deddy Corbuzier", "Nagita Slavina", "Iqbaal",
		"Abdurrahman", "Fatimah Zahra", "Siti Khadijah", "Muhammad Ali", "Omar Khalid",
		"Aisyah Putri", "Dinda Mutiara", "Vino G. Bastian", "Marsha Timothy", "Joe Taslim",
		"Iko Uwais", "Yayan Ruhian", "Julie Estelle", "Nabila Syakieb", "Ririn Dwi Ariyanti",
	}
	cities := []string{"Jakarta Selatan", "Bogor", "Depok", "Bekasi", "Tangerang", "Jakarta Pusat", "Surabaya", "Malang", "Medan", "Makassar"}
	statuses := []string{"new", "contacted", "qualified", "prospect", "dp", "closing", "lost"}

	// Sentiment variations
	sentiments := []struct{ Text string; Score int }{
		{"Saya sudah sangat siap berangkat akhir bulan ini. Tolong kirimkan rincian rekening transfernya.", 40},
		{"Keluarga kami tertarik. Tolong buatkan penawaran resminya karena kami memang sudah niat.", 35},
		{"Bisa tolong kirim brosurnya? Kami sedang mencari-cari travel yang pas.", 20},
		{"Ini harganya mahal banget ya dibanding travel sebelah. Ada diskon kah?", 10},
		{"Saya coba tanya-tanya dulu ya, rencananya tahun depan.", 5},
	}

	for i := 0; i < 50; i++ {
		leadID := uuid.New()
		creationTime := now.AddDate(0, 0, -r.Intn(45)).Add(time.Duration(r.Intn(24)) * time.Hour)
		
		tp := tripPkgs[r.Intn(len(tripPkgs))]
		agent := createdAgents[r.Intn(len(createdAgents))]
		finalStatus := statuses[r.Intn(len(statuses))]
		city := cities[r.Intn(len(cities))]

		// --- AI CALCULATION SCORE (Total 100) ---
		
		// 1. Sentiment Text (40%)
		sentInfo := sentiments[r.Intn(len(sentiments))]
		scoreSentiment := sentInfo.Score

		// 2. Region Jabodetabek (10%)
		scoreLocation := 0
		jabodetabek := []string{"Jakarta Selatan", "Bogor", "Depok", "Bekasi", "Tangerang", "Jakarta Pusat"}
		for _, j := range jabodetabek {
			if city == j {
				scoreLocation = 10
				break
			}
		}

		// 3. Group / Keluarganya (30%)
		paxCount := 1
		groupSizes := []int{1, 2, 3, 4, 5, 8, 12}
		paxCount = groupSizes[r.Intn(len(groupSizes))]
		scoreGroup := 5
		if paxCount == 2 { scoreGroup = 15 }
		if paxCount > 2 && paxCount <= 4 { scoreGroup = 25 }
		if paxCount >= 5 { scoreGroup = 30 }

		// 4. Status Progress (10%)
		scoreStatus := 0
		if finalStatus == "dp" || finalStatus == "closing" { scoreStatus = 10 }
		if finalStatus == "prospect" || finalStatus == "qualified" { scoreStatus = 7 }
		if finalStatus == "contacted" { scoreStatus = 3 }

		// 5. Update/Interaction Length (10%)
		// Depend on how many statuses they went through
		scoreLength := 0
		currentPath := []string{"new"}
		if finalStatus != "new" && finalStatus != "lost" {
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
			scoreLength = (len(currentPath) * 2) // max 5 statuses * 2 = 10%
			if scoreLength > 10 { scoreLength = 10 }
		} else if finalStatus == "lost" {
			currentPath = []string{"new", "contacted", "lost"}
			scoreLength = 2
		}

		// FINAL TOTAL SCORE
		totalAiScore := scoreSentiment + scoreLocation + scoreGroup + scoreStatus + scoreLength

		// FORM MESSAGE CREATION
		age := 25 + r.Intn(40) // usia random 25 sampai 65 tahun
		groupStr := ""
		groupType := "individual"
		if paxCount == 1 {
			groupStr = "Saya mendaftar sendiri."
			groupType = "individual"
		} else if paxCount == 2 {
			groupStr = "Berencana berangkat berdua bersama pasangan saya."
			groupType = "couple"
		} else {
			groupStr = fmt.Sprintf("Kami berencana berangkat sekeluarga (%d orang).", paxCount)
			groupType = "family"
		}
		
		fullMessage := fmt.Sprintf("Form Data: Usia %d tahun. %s %s", age, sentInfo.Text, groupStr)

		// CREATE LEAD
		// We use fallback legacy PackageID/VendorID from createdPackages[0] for DB constraint,
		// but TripPackage relation is the new source of truth.
		fallbackPkg := createdPackages[0]
		for _, cp := range createdPackages {
			if cp.VendorID == *tp.VendorID {
				fallbackPkg = cp
				break
			}
		}

		lead := crm.Lead{
			ID:           leadID,
			Name:         leadNames[i%len(leadNames)],
			Phone:        fmt.Sprintf("081%d%d", 1+r.Intn(2), 10000000+r.Intn(89999999)),
			City:         city,
			Age:          age,
			GroupType:    groupType,
			Message:      fullMessage,
			Status:       finalStatus,
			LeadScore:    totalAiScore,
			LeadPriority: totalAiScore / 20,
			PackageID:    fallbackPkg.ID,
			VendorID:     *tp.VendorID,
			CreatedAt:    creationTime,
		}
		db.DB.Create(&lead)

		// UTM LOGS
		camp := createdCampaigns[r.Intn(len(createdCampaigns))]
		db.DB.Create(&crm.UTMLog{
			ID:          uuid.New(), LeadID: leadID, UTMSource: camp.Provider, UTMMedium: "cpc", 
			UTMCampaign: camp.Name, FBClid: "fb.1." + uuid.New().String()[:8], CreatedAt: creationTime,
		})

		// LEAD ASSIGNMENT
		db.DB.Create(&crm.LeadAssignment{
			ID: uuid.New(), LeadID: leadID, AgentID: agent.ID, 
			AssignedAt: creationTime.Add(time.Minute * time.Duration(1+r.Intn(30))), OwnershipStatus: "active",
		})

		// TIMELINE ACTIVITIES
		lastStepTime := creationTime
		for stepIdx, stage := range currentPath {
			stepTime := lastStepTime.Add(time.Hour * time.Duration(2+r.Intn(48)))
			if stepTime.After(now) { stepTime = now.Add(-time.Minute * time.Duration(1+r.Intn(60))) }

			db.DB.Create(&crm.LeadActivity{
				ID: uuid.New(), LeadID: leadID, Type: "status_change",
				Content: fmt.Sprintf("Status updated to %s", strings.ToUpper(stage)),
				AgentName: agentNames[r.Intn(len(agentNames))], CreatedAt: stepTime,
			})

			// Add AI Alert Details based on AI metrics
			if stepIdx == 0 {
				aiContent := fmt.Sprintf(
					"AI Score Details (%d): Sentiment(%d) + Locator(%d) + GroupSize(%d) + History(%d) + Intent(%d)", 
					totalAiScore, scoreSentiment, scoreLocation, scoreGroup, scoreLength, scoreStatus,
				)
				if totalAiScore > 75 {
					aiContent = "🔥 HOT LEAD ALERT! " + aiContent
				}
				db.DB.Create(&crm.LeadActivity{
					ID: uuid.New(), LeadID: leadID, Type: "ai_analysis",
					Content: aiContent, AgentName: "AI Auditor", CreatedAt: stepTime.Add(time.Minute * 1),
				})
			}

			lastStepTime = stepTime
		}

		// ─── REVENUE INJECTION ───
		if finalStatus == "dp" || finalStatus == "closing" {
			var tiers []crm.PackageTier
			db.DB.Where("trip_package_id = ?", tp.ID).Find(&tiers)

			if len(tiers) > 0 {
				selectedTier := tiers[r.Intn(len(tiers))]
				var roomPrices []crm.TierRoomPrice
				db.DB.Where("tier_id = ?", selectedTier.ID).Find(&roomPrices)

				if len(roomPrices) > 0 {
					selectedRoom := roomPrices[r.Intn(len(roomPrices))]
					finalAmount := selectedRoom.Price * float64(paxCount)

					tx := crm.LeadTransaction{
						ID:              uuid.New(),
						LeadID:          leadID,
						TripPackageID:   &tp.ID,
						TierID:          &selectedTier.ID,
						RoomPriceID:     &selectedRoom.ID,
						Currency:        tp.Currency,
						TransactionType: finalStatus,
						PaxCount:        paxCount,
						FinalAmount:     finalAmount,
						Notes:           fmt.Sprintf("Transaction linked from package %s (Vendor ID: %s)", tp.Name, *tp.VendorID),
						CreatedAt:       lastStepTime,
					}
					if finalStatus == "dp" {
						dpAmt := 3000000.0 * float64(paxCount)
						if tp.Currency == "USD" { dpAmt = 300.0 * float64(paxCount) }
						tx.DPAmount = &dpAmt
						tx.TransactionType = "dp"
					} else {
						tx.TransactionType = "full_payment"
					}
					db.DB.Create(&tx)
				}
			}
		}
	}

	fmt.Println("🎉 Database Seeding w/ 5 Vendor Tiers & AI Prefs Injection Complete!")
}
