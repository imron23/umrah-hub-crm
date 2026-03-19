package service

import (
	"errors"
	"sort"
	"github.com/user/umrah-hub-aggregator/apps/api/internal/crm"
)

type RoutingService interface {
	SelectAgent(agents []crm.Agent, leadPriority int) (*crm.Agent, error)
}

type routingService struct{}

func NewRoutingService() RoutingService {
	return &routingService{}
}

func (s *routingService) SelectAgent(agents []crm.Agent, leadPriority int) (*crm.Agent, error) {
	if len(agents) == 0 {
		return nil, errors.New("no available agents")
	}

	// Filter agents yang masih punya kapasitas
	var candidates []crm.Agent
	for _, a := range agents {
		if a.CurrentLoad < a.DailyCapacity && a.Status == "available" {
			candidates = append(candidates, a)
		}
	}

	if len(candidates) == 0 {
		return nil, errors.New("all agents are at full capacity")
	}

	// Urutkan berdasarkan beban kerja terkecil (CurrentLoad)
	// Jika LeadPriority tinggi, kita bisa menambahkan logika untuk memilih agen dengan ConversionRate tertinggi (jika tersedia)
	sort.Slice(candidates, func(i, j int) bool {
		return candidates[i].CurrentLoad < candidates[j].CurrentLoad
	})

	return &candidates[0], nil
}
