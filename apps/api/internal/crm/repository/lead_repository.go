package repository

import (
	"github.com/google/uuid"
	"github.com/user/umrah-hub-aggregator/apps/api/internal/crm"
	"gorm.io/gorm"
)

type LeadRepository interface {
	Create(lead *crm.Lead) error
	CreateUTM(utm *crm.UTMLog) error
	GetAvailableAgents() ([]crm.Agent, error)
	AssignLead(assignment *crm.LeadAssignment) error
	IncrementAgentLoad(agentID uuid.UUID) error
	UpdateLeadStatus(leadID uuid.UUID, status string) error
	UpdateLead(lead *crm.Lead) error
	AddActivity(activity *crm.LeadActivity) error
	GetActivitiesByLeadID(leadID uuid.UUID) ([]crm.LeadActivity, error)
	GetAllLeads() ([]crm.Lead, error)
	GetLeadByID(id uuid.UUID) (crm.Lead, error)
	GetActiveAgents() ([]crm.Agent, error)
	GetAllLPs() ([]crm.LandingPage, error)
	UpdateLPStatus(id uuid.UUID, status string) error
	UpdateAgentCapacity(id uuid.UUID, capacity int) error
	GetTrackingPixels() ([]crm.TrackingPixel, error)
	UpsertTrackingPixel(pixel *crm.TrackingPixel) error
	GetAPIConfigs() ([]crm.APIConfiguration, error)
	SaveAPIConfig(config *crm.APIConfiguration) error
	Delete(id uuid.UUID) error
	GetDeletedLeads() ([]crm.Lead, error)
	RestoreLead(id uuid.UUID) error
	DeleteLandingPage(id uuid.UUID) error
}

type leadRepository struct {
	db *gorm.DB
}

func NewLeadRepository(db *gorm.DB) LeadRepository {
	return &leadRepository{db}
}

func (r *leadRepository) Create(lead *crm.Lead) error {
	return r.db.Create(lead).Error
}

func (r *leadRepository) CreateUTM(utm *crm.UTMLog) error {
	return r.db.Create(utm).Error
}

func (r *leadRepository) GetAvailableAgents() ([]crm.Agent, error) {
	var agents []crm.Agent
	err := r.db.Where("status = ? AND current_load < daily_capacity", "available").
		Order("current_load ASC"). 
		Find(&agents).Error
	return agents, err
}

func (r *leadRepository) AssignLead(assignment *crm.LeadAssignment) error {
	return r.db.Create(assignment).Error
}

func (r *leadRepository) IncrementAgentLoad(agentID uuid.UUID) error {
	return r.db.Model(&crm.Agent{}).Where("id = ?", agentID).
		UpdateColumn("current_load", gorm.Expr("current_load + ?", 1)).Error
}

func (r *leadRepository) UpdateLeadStatus(leadID uuid.UUID, status string) error {
	return r.db.Model(&crm.Lead{}).Where("id = ?", leadID).Update("status", status).Error
}

func (r *leadRepository) UpdateLead(lead *crm.Lead) error {
	return r.db.Save(lead).Error
}

func (r *leadRepository) AddActivity(activity *crm.LeadActivity) error {
	return r.db.Create(activity).Error
}

func (r *leadRepository) GetActivitiesByLeadID(leadID uuid.UUID) ([]crm.LeadActivity, error) {
	var activities []crm.LeadActivity
	err := r.db.Where("lead_id = ?", leadID).Order("created_at DESC").Find(&activities).Error
	return activities, err
}

func (r *leadRepository) GetAllLeads() ([]crm.Lead, error) {
	var leads []crm.Lead
	err := r.db.Preload("Assignments").Preload("UTMLogs").Preload("Activities").Order("created_at DESC").Find(&leads).Error
	return leads, err
}

func (r *leadRepository) GetLeadByID(id uuid.UUID) (crm.Lead, error) {
	var lead crm.Lead
	err := r.db.Preload("UTMLogs").Preload("Assignments").Preload("Activities").First(&lead, "id = ?", id).Error
	return lead, err
}
func (r *leadRepository) GetActiveAgents() ([]crm.Agent, error) {
	var agents []crm.Agent
	err := r.db.Table("agents").
		Select("agents.*, users.email").
		Joins("join users on users.id = agents.user_id").
		Where("agents.status = ?", "available").
		Scan(&agents).Error
	return agents, err
}
func (r *leadRepository) GetAllLPs() ([]crm.LandingPage, error) {
	var lps []crm.LandingPage
	err := r.db.Find(&lps).Error
	return lps, err
}

func (r *leadRepository) UpdateLPStatus(id uuid.UUID, status string) error {
	return r.db.Model(&crm.LandingPage{}).Where("id = ?", id).Update("status", status).Error
}

func (r *leadRepository) UpdateAgentCapacity(id uuid.UUID, capacity int) error {
	return r.db.Model(&crm.Agent{}).Where("id = ?", id).Update("daily_capacity", capacity).Error
}

func (r *leadRepository) GetTrackingPixels() ([]crm.TrackingPixel, error) {
	var pixels []crm.TrackingPixel
	err := r.db.Find(&pixels).Error
	return pixels, err
}
func (r *leadRepository) GetAPIConfigs() ([]crm.APIConfiguration, error) {
	var configs []crm.APIConfiguration
	err := r.db.Order("priority ASC").Find(&configs).Error
	return configs, err
}

func (r *leadRepository) SaveAPIConfig(config *crm.APIConfiguration) error {
	return r.db.Save(config).Error
}

func (r *leadRepository) UpsertTrackingPixel(pixel *crm.TrackingPixel) error {
	return r.db.Save(pixel).Error
}

func (r *leadRepository) Delete(id uuid.UUID) error {
	return r.db.Delete(&crm.Lead{}, "id = ?", id).Error
}

func (r *leadRepository) GetDeletedLeads() ([]crm.Lead, error) {
	var leads []crm.Lead
	err := r.db.Unscoped().Where("deleted_at IS NOT NULL").Find(&leads).Error
	return leads, err
}

func (r *leadRepository) RestoreLead(id uuid.UUID) error {
	return r.db.Unscoped().Model(&crm.Lead{}).Where("id = ?", id).Update("deleted_at", nil).Error
}

func (r *leadRepository) DeleteLandingPage(id uuid.UUID) error {
	return r.db.Delete(&crm.LandingPage{}, "id = ?", id).Error
}
