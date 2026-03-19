package main

import (
	"fmt"
	"log"
	"math/rand"
	"time"

	"github.com/google/uuid"
	"github.com/joho/godotenv"
	"github.com/user/umrah-hub-aggregator/apps/api/internal/crm"
	pkgModel "github.com/user/umrah-hub-aggregator/apps/api/internal/package"
	"github.com/user/umrah-hub-aggregator/apps/api/pkg/db"
)

func main() {
	if err := godotenv.Load(".env"); err != nil {
		log.Println("No .env file found")
	}

	db.InitDB()
	r := rand.New(rand.NewSource(time.Now().UnixNano()))

	// Get a valid package for FK consistency
	var pkg pkgModel.Package
	if err := db.DB.First(&pkg).Error; err != nil {
		log.Fatal("No packages found in DB. Please run global seed first.")
	}

	// 1. UPDATE 5 RECENT LEADS (Simulate Conversion Progress)
	fmt.Println("🚀 Processing 5 Lead Transitions...")
	var existingLeads []crm.Lead
	db.DB.Order("created_at desc").Limit(30).Find(&existingLeads) // Get more to avoid newly created ones if re-running
	
	count := 0
	for _, l := range existingLeads {
		if count >= 5 { break }
		if l.Status == "new" || l.Status == "contacted" {
			prevStatus := l.Status
			if count == 0 { l.Status = "closing" } else if count == 1 { l.Status = "dp" } else { l.Status = "prospect" }
			
			l.Message = fmt.Sprintf("[DECISION HQ UPDATE] %s | Moved from %s to %s for Bogor Program.", l.Message, prevStatus, l.Status)
			l.LeadScore = 85 + r.Intn(15)
			
			db.DB.Save(&l)
			
			db.DB.Create(&crm.LeadActivity{
				ID: uuid.New(), LeadID: l.ID,
				Type: "status_change",
				Content: fmt.Sprintf("Strategic Transition: %s confirmed interest in Bogor Pesantren All-in. Moving to %s.", l.Name, l.Status),
				AgentName: "Manager Bot",
				CreatedAt: time.Now(),
			})
			fmt.Printf("✅ Lead Updated: %s (%s -> %s)\n", l.Name, prevStatus, l.Status)
			count++
		}
	}

	// 2. CREATE 5 BRAND NEW LEADS (Simulate Inbound Acquisition)
	fmt.Println("🌊 Capturing 5 New Inbound Targets...")
	newLeadData := []string{"Haji Lukman Hakim", "Ustadzah Fatimah", "Bapak Syaifullah", "Ibu Hj. Aminah", "Drs. Mulyadi Saputra"}
	cities := []string{"Bogor", "Jakarta Selatan", "Depok", "Bekasi City"}
	
	for _, name := range newLeadData {
		leadID := uuid.New()
		l := crm.Lead{
			ID: leadID,
			Name: name,
			Phone: fmt.Sprintf("0812%d", 1000000+r.Intn(8999999)),
			City: cities[r.Intn(len(cities))],
			Status: "new",
			LeadScore: 70 + r.Intn(25),
			PackageID: pkg.ID,
			VendorID: pkg.VendorID,
			Message: "[Campaign: Pesantren Bogor 15jt] Ingin konsultasi skema cicilan All-in 15jt Pesantren Bogor.",
			CreatedAt: time.Now().Add(-time.Duration(r.Intn(60)) * time.Minute),
			UTMLogs: []crm.UTMLog{
				{
					ID: uuid.New(),
					UTMSource: "facebook_ads", UTMMedium: "cpc",
					UTMCampaign: "Bogor_Pesantren_Scale", UTMContent: "decision_hq_simulation",
					CreatedAt: time.Now(),
				},
			},
			Activities: []crm.LeadActivity{
				{
					ID: uuid.New(),
					Type: "ai_analysis",
					Content: "Inbound via FB Ads detected. High potential for Bogor 15jt program.",
					AgentName: "AI Auditor",
					CreatedAt: time.Now(),
				},
			},
		}
		
		if err := db.DB.Create(&l).Error; err != nil {
			fmt.Printf("❌ Failed to create lead %s: %v\n", name, err)
		} else {
			fmt.Printf("🎯 Fresh Lead Captured: %s from %s (Score: %d)\n", l.Name, l.City, l.LeadScore)
		}
	}

	fmt.Println("✨ Intelligence Injection Complete. Decision HQ reflects active state.")
}
