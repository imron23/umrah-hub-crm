package service

import (
	"strings"
	"github.com/user/umrah-hub-aggregator/apps/api/internal/crm"
)

type ScoringService interface {
	CalculateScore(lead *crm.Lead) int
}

type scoringService struct{}

func NewScoringService() ScoringService {
	return &scoringService{}
}

func (s *scoringService) CalculateScore(lead *crm.Lead) int {
	baseScore := 40.0

	// 1. Geo-Priority (Sesuai strategi Pesantren Bogor/Umrah Hub)
	switch strings.ToLower(lead.City) {
	case "bogor", "jakarta":
		baseScore += 40.0
	case "depok", "bekasi", "tangerang":
		baseScore += 20.0
	}

	// 2. Messaging Intent logic
	if len(lead.Message) > 50 {
		baseScore += 15.0
	}

	// 3. Simulated AI Sentiment Integration
	aiScore := s.simulatedAIPrediction(lead.Message)
	
	finalScore := (baseScore * 0.7) + (float64(aiScore) * 0.3)
	
	if finalScore > 100 {
		return 100
	}
	return int(finalScore)
}

func (s *scoringService) simulatedAIPrediction(message string) int {
	intensity := 0
	msg := strings.ToLower(message)

	// High Buying Signals
	if containsAny(msg, "daftar", "booking", "harga", "biaya", "paket", "cicilan") {
		intensity += 60
	}
	// Urgency
	if containsAny(msg, "sekarang", "cepat", "sisa", "kuota") {
		intensity += 40
	}

	if intensity > 100 { return 100 }
	return intensity
}

func containsAny(msg string, keywords ...string) bool {
	for _, k := range keywords {
		if strings.Contains(msg, k) {
			return true
		}
	}
	return false
}
