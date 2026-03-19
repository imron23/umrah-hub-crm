package service

import (
	"fmt"
	"log"
	"github.com/user/umrah-hub-aggregator/apps/api/internal/crm"
	"github.com/user/umrah-hub-aggregator/apps/api/pkg/db"
)

type AutomationService interface {
	ProcessEvent(event string, leadID string) error
}

type automationService struct{}

func NewAutomationService() AutomationService {
	return &automationService{}
}

func (s *automationService) ProcessEvent(event string, leadID string) error {
	var lead crm.Lead
	if err := db.DB.Preload("Assignments").First(&lead, "id = ?", leadID).Error; err != nil {
		return err
	}

	switch event {
	case "lead_created":
		return s.handleLeadCreated(&lead)
	case "lead_not_contacted":
		return s.handleLeadIdle(&lead)
	case "lead_booked":
		return s.handleLeadBooked(&lead)
	}

	return nil
}

func (s *automationService) handleLeadCreated(lead *crm.Lead) error {
	// Aksi 1: Kirim Brosur Digital via WhatsApp (Simulasi)
	brochureURL := "https://umrahhub.id/brochure/premium-syawal-2026"
	fmt.Printf("[Automation] Mengirim Brosur Digital ke WhatsApp %s...\n", lead.Phone)
	fmt.Printf("[WA Simulation] Pesan: 'Assalamu'alaikum, Bapak/Ibu. Terlampir brosur lengkap untuk paket Umrah pilihan Anda: %s'\n", brochureURL)
	
	// Aksi 2: Notifikasi Tim Sales jika Lead Score > 80
	if lead.LeadScore > 80 {
		fmt.Printf("[Automation] ALERT: Prospek Prioritas Tinggi (%d)! Notifikasi Manajer Terkirim.\n", lead.LeadScore)
	}
	
	return nil
}

func (s *automationService) handleLeadIdle(lead *crm.Lead) error {
	// Peringatan jika lead belum diubah statusnya dalam 2 jam
	fmt.Printf("[Automation] Peringatan: Lead %s belum direspon oleh agen. Mengirim pengingat...\n", lead.Name)
	return nil
}

func (s *automationService) handleLeadBooked(lead *crm.Lead) error {
	log.Printf("[Automation] Lead %s telah dikonversi! Mengupdate status kampanye.", lead.Name)
	return nil
}
