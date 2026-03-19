package service

import (
	"fmt"
	"log"
	"time"

	"github.com/google/uuid"
	"github.com/hibiken/asynq"
	"github.com/user/umrah-hub-aggregator/apps/api/internal/crm"
	"github.com/user/umrah-hub-aggregator/apps/api/internal/crm/repository"
	intelligence "github.com/user/umrah-hub-aggregator/apps/api/internal/intelligence/service"
	tasks "github.com/user/umrah-hub-aggregator/apps/api/internal/worker/tasks"
	"github.com/user/umrah-hub-aggregator/apps/api/pkg/telegram"
)

type LeadService interface {
	ProcessLead(lead *crm.Lead) error
}

type leadService struct {
	repo        repository.LeadRepository
	scoringSvc  intelligence.ScoringService
	routingSvc  intelligence.RoutingService
	workerClient *asynq.Client
	tg          telegram.TelegramService
}

func NewLeadService(
	repo repository.LeadRepository, 
	scoringSvc intelligence.ScoringService,
	routingSvc intelligence.RoutingService,
	workerClient *asynq.Client,
	tg telegram.TelegramService,
) LeadService {
	return &leadService{repo, scoringSvc, routingSvc, workerClient, tg}
}

func (s *leadService) ProcessLead(lead *crm.Lead) error {
	// 1. Initial Scoring (Synchronous for primary priority)
	lead.LeadScore = s.scoringSvc.CalculateScore(lead)
	if lead.LeadScore > 80 {
		lead.LeadPriority = 2 // High
	} else if lead.LeadScore > 50 {
		lead.LeadPriority = 1 // Medium
	}

	// Hot Lead Notification
	if lead.LeadScore >= 85 {
		go s.tg.SendHotLeadAlert(lead.Name, lead.Phone, "See Details", fmt.Sprintf("%d", lead.LeadScore))
	}

	// 2. Intelligent Lead Routing
	agents, err := s.repo.GetActiveAgents()
	if err != nil {
		return err
	}

	selectedAgent, err := s.routingSvc.SelectAgent(agents, lead.LeadPriority)
	if err != nil {
		// Log error and queue if no agent available
		log.Printf("Routing failed for Lead %s: %v", lead.ID, err)
		lead.Status = "queued"
		return s.repo.UpdateLeadStatus(lead.ID, "queued")
	}

	// 3. Assignment
	assignment := &crm.LeadAssignment{
		ID:              uuid.New(),
		LeadID:          lead.ID,
		AgentID:         selectedAgent.ID,
		AssignedAt:      time.Now(),
		OwnershipStatus: "active",
	}

	if err := s.repo.AssignLead(assignment); err != nil {
		return err
	}

	// 4. Async Worker - Deep Scoring & Automation
	if s.workerClient != nil {
		// Deep Scoring
		scoreTask, err := tasks.NewLeadScoringTask(lead.ID.String())
		if err == nil {
			s.workerClient.Enqueue(scoreTask)
		}

		// Automation Trigger
		autoTask, err := tasks.NewAutomationTask("lead_created", lead.ID.String())
		if err == nil {
			s.workerClient.Enqueue(autoTask)
		}
	}

	// 5. Update Status & Finish
	if err := s.repo.IncrementAgentLoad(selectedAgent.ID); err != nil {
		return err
	}

	return s.repo.UpdateLeadStatus(lead.ID, "assigned")
}

