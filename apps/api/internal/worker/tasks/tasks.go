package tasks

import (
	"context"
	"encoding/json"
	"fmt"
	"github.com/hibiken/asynq"
	"github.com/google/uuid"
	"github.com/user/umrah-hub-aggregator/apps/api/pkg/db"
	"github.com/user/umrah-hub-aggregator/apps/api/internal/crm"
	intelligence "github.com/user/umrah-hub-aggregator/apps/api/internal/intelligence/service"
	automation "github.com/user/umrah-hub-aggregator/apps/api/internal/automation/service"
)

// Task Types
const (
	TypeLeadScoring = "lead:scoring"
	TypeAnalytics   = "analytics:daily"
	TypeAutomation  = "automation:process"
)

// Task Payloads
type LeadScoringPayload struct {
	LeadID string `json:"lead_id"`
}

type AutomationPayload struct {
	Event  string `json:"event"`
	LeadID string `json:"lead_id"`
}

// Client functions for enqueuing
func NewLeadScoringTask(leadID string) (*asynq.Task, error) {
	payload, err := json.Marshal(LeadScoringPayload{LeadID: leadID})
	if err != nil {
		return nil, err
	}
	return asynq.NewTask(TypeLeadScoring, payload, asynq.Queue("critical")), nil
}

func NewAutomationTask(event, leadID string) (*asynq.Task, error) {
	payload, err := json.Marshal(AutomationPayload{Event: event, LeadID: leadID})
	if err != nil {
		return nil, err
	}
	return asynq.NewTask(TypeAutomation, payload, asynq.Queue("default")), nil
}

// Task Handlers
func HandleLeadScoringTask(ctx context.Context, t *asynq.Task) error {
	var p LeadScoringPayload
	if err := json.Unmarshal(t.Payload(), &p); err != nil {
		return fmt.Errorf("json.Unmarshal failed: %v", err)
	}

	leadID, err := uuid.Parse(p.LeadID)
	if err != nil {
		return err
	}

	// Fetch lead from DB
	var lead crm.Lead
	if err := db.DB.First(&lead, "id = ?", leadID).Error; err != nil {
		return fmt.Errorf("lead not found: %v", err)
	}

	// Re-calculate deep score
	scoringSvc := intelligence.NewScoringService()
	newScore := scoringSvc.CalculateScore(&lead)

	// Update DB
	if err := db.DB.Model(&crm.Lead{}).Where("id = ?", leadID).Update("lead_score", newScore).Error; err != nil {
		return err
	}

	fmt.Printf("[✓] Lead %s re-scored to %d\n", p.LeadID, newScore)
	return nil
}

func HandleAutomationTask(ctx context.Context, t *asynq.Task) error {
	var p AutomationPayload
	if err := json.Unmarshal(t.Payload(), &p); err != nil {
		return fmt.Errorf("json.Unmarshal failed: %v", err)
	}

	autoSvc := automation.NewAutomationService()
	return autoSvc.ProcessEvent(p.Event, p.LeadID)
}
