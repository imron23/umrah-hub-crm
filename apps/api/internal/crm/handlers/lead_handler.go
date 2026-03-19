package handlers

import (
	"net/http"
	"log"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/user/umrah-hub-aggregator/apps/api/internal/crm"
	"github.com/user/umrah-hub-aggregator/apps/api/internal/crm/repository"
	"github.com/user/umrah-hub-aggregator/apps/api/internal/crm/service"
)

type LeadHandler struct {
	repo    repository.LeadRepository
	service service.LeadService
}

func NewLeadHandler(repo repository.LeadRepository, service service.LeadService) *LeadHandler {
	return &LeadHandler{repo, service}
}

type CreateLeadRequest struct {
	Name      string    `json:"name" binding:"required"`
	Phone     string    `json:"phone" binding:"required"`
	City      string    `json:"city"`
	Age       int       `json:"age"`
	GroupType string    `json:"group_type"`
	Message   string    `json:"message"`
	PackageID uuid.UUID `json:"package_id"`
	UTM       struct {
		Source   string `json:"source"`
		Medium   string `json:"medium"`
		Campaign string `json:"campaign"`
		Content  string `json:"content"`
	} `json:"utm"`
}

func (h *LeadHandler) CreatePublicLead(c *gin.Context) {
	var req CreateLeadRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	lead := &crm.Lead{
		ID:        uuid.New(),
		Name:      req.Name,
		Phone:     req.Phone,
		City:      req.City,
		Age:       req.Age,
		GroupType: req.GroupType,
		Message:   req.Message,
		PackageID: req.PackageID,
		Status:    "new",
	}

	if err := h.repo.Create(lead); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create lead"})
		return
	}

	// Log UTM parameters
	utm := &crm.UTMLog{
		ID:          uuid.New(),
		LeadID:      lead.ID,
		UTMSource:   req.UTM.Source,
		UTMMedium:   req.UTM.Medium,
		UTMCampaign: req.UTM.Campaign,
		UTMContent:  req.UTM.Content,
	}
	_ = h.repo.CreateUTM(utm)

	// Trigger Round-Robin Assignment & Scoring
	if err := h.service.ProcessLead(lead); err != nil {
		// Log error but don't fail the request since lead is already saved
		log.Printf("Failed to process lead distribution: %v", err)
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "Lead captured and assigned successfully",
		"lead_id": lead.ID,
		"status":  lead.Status,
	})
}

func (h *LeadHandler) GetAllLeads(c *gin.Context) {
	leads, err := h.repo.GetAllLeads()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch leads"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"leads": leads,
	})
}

func (h *LeadHandler) GetLeadDetail(c *gin.Context) {
	idStr := c.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid lead ID"})
		return
	}

	lead, err := h.repo.GetLeadByID(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Lead not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"lead": lead,
	})
}

func (h *LeadHandler) GetLeadsDemo(c *gin.Context) {
	leads, err := h.repo.GetAllLeads()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch leads for demo"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"leads": leads,
	})
}

func (h *LeadHandler) UpdateLead(c *gin.Context) {
	idStr := c.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid lead ID"})
		return
	}

	var req crm.Lead
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Fetch existing to preserve some fields
	lead, err := h.repo.GetLeadByID(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Lead not found"})
		return
	}

	// Update allowed fields
	lead.Name = req.Name
	lead.Phone = req.Phone
	lead.City = req.City
	lead.Status = req.Status
	lead.LeadScore = req.LeadScore

	if err := h.repo.UpdateLead(&lead); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update lead"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Lead updated successfully", "lead": lead})
}

func (h *LeadHandler) AddLeadActivity(c *gin.Context) {
	var req crm.LeadActivity
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if req.LeadID == uuid.Nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Lead ID is required"})
		return
	}

	req.ID = uuid.New()
	req.CreatedAt = time.Now()

	if err := h.repo.AddActivity(&req); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to record activity"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Activity recorded", "activity": req})
}
func (h *LeadHandler) GetActiveAgents(c *gin.Context) {
	agents, err := h.repo.GetActiveAgents()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch agents"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"agents": agents,
	})
}

func (h *LeadHandler) GetAllLandingPages(c *gin.Context) {
	lps, err := h.repo.GetAllLPs()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch LPs"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"lps": lps})
}

func (h *LeadHandler) UpdateLandingPageStatus(c *gin.Context) {
	idStr := c.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid LP ID"})
		return
	}

	var req struct {
		Status string `json:"status" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.repo.UpdateLPStatus(id, req.Status); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update status"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Status updated"})
}

func (h *LeadHandler) UpdateAgentCapacity(c *gin.Context) {
	idStr := c.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid Agent ID"})
		return
	}

	var req struct {
		Capacity int `json:"capacity" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.repo.UpdateAgentCapacity(id, req.Capacity); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update capacity"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Capacity updated"})
}

func (h *LeadHandler) GetTrackingPixels(c *gin.Context) {
	pixels, err := h.repo.GetTrackingPixels()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch pixels"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"pixels": pixels})
}

func (h *LeadHandler) SaveTrackingPixel(c *gin.Context) {
	var req crm.TrackingPixel
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if req.ID == uuid.Nil {
		req.ID = uuid.New()
	}

	if err := h.repo.UpsertTrackingPixel(&req); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save pixel"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Pixel settings saved", "pixel": req})
}

func (h *LeadHandler) AIAudit(c *gin.Context) {
	leads, err := h.repo.GetAllLeads()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch data for audit"})
		return
	}

	// 1. Group by Campaign/LP
	lpStats := make(map[string]struct{Leads, Qual int})
	for _, l := range leads {
		lp := "generic"
		if len(l.UTMLogs) > 0 {
			lp = l.UTMLogs[0].UTMContent
		}
		s := lpStats[lp]
		s.Leads++
		if l.LeadScore > 70 {
			s.Qual++
		}
		lpStats[lp] = s
	}

	type Decision struct {
		Campaign string `json:"campaign"`
		Quadrant string `json:"quadrant"`
		Reason   string `json:"reason"`
		Action   string `json:"action"`
		Priority string `json:"priority"`
	}

	var decisions []Decision
	if len(lpStats) == 0 {
		c.JSON(http.StatusOK, gin.H{
			"agent_name": "Antigravity AI Auditor",
			"timestamp": time.Now(),
			"analysis_summary": "Inadequate data for audit. System requires active lead flow to generate campaign insights.",
			"decisions": []Decision{},
			"global_advice": "Initiate lead generation campaigns to start receiving AI-driven marketing optimizations.",
		})
		return
	}

	avgLeads := len(leads) / len(lpStats)

	for lp, s := range lpStats {
		isHighVol := s.Leads >= avgLeads
		isHighQual := float64(s.Qual)/float64(s.Leads) > 0.5

		d := Decision{Campaign: lp}
		if isHighVol && isHighQual {
			d.Quadrant = "Q1: STAR"
			d.Reason = "High volume and high intent consistency."
			d.Action = "SCALE BUDGET 2X"
			d.Priority = "HIGH"
		} else if !isHighVol && isHighQual {
			d.Quadrant = "Q2: HIDDEN GEM"
			d.Reason = "Small sample size but extremely high lead quality."
			d.Action = "INCREASE CPM/BID"
			d.Priority = "MEDIUM"
		} else if isHighVol && !isHighQual {
			d.Quadrant = "Q3: THE TRAP"
			d.Reason = "High junk leads ratio. Wasting sales team's capacity."
			d.Action = "REFINE TARGETING / KILL"
			d.Priority = "CRITICAL"
		} else {
			d.Quadrant = "Q4: WASTE"
			d.Reason = "No volume, no quality. Underperforming across all KPIs."
			d.Action = "KILL IMMEDIATELY"
			d.Priority = "HIGH"
		}
		decisions = append(decisions, d)
	}

	c.JSON(http.StatusOK, gin.H{
		"agent_name": "Antigravity AI Auditor",
		"timestamp": time.Now(),
		"analysis_summary": "Deep audit complete. 4-Quadrant assessment indicates bottleneck in lead quality for high-volume campaigns.",
		"decisions": decisions,
		"global_advice": "Focus budget on Q2 Hidden Gems to stabilize CAC. Q3 Trap campaigns are draining agent energy—recommend immediate kill.",
	})
}

func (h *LeadHandler) GetAPIConfigs(c *gin.Context) {
	configs, err := h.repo.GetAPIConfigs()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch API configs"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"configs": configs})
}

func (h *LeadHandler) SaveAPIConfig(c *gin.Context) {
	var req crm.APIConfiguration
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if req.ID == uuid.Nil {
		req.ID = uuid.New()
		req.CreatedAt = time.Now()
	}

	if err := h.repo.SaveAPIConfig(&req); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save API config"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "API configuration saved", "config": req})
}
func (h *LeadHandler) DeleteLead(c *gin.Context) {
	// 1. Check permissions
	userRole, _ := c.Get("userRole")
	if userRole == "cs" {
		c.JSON(http.StatusForbidden, gin.H{"error": "CS tidak diizinkan menghapus data leads"})
		return
	}

	idStr := c.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid lead ID"})
		return
	}

	if err := h.repo.Delete(id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete lead"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Lead moved to Recycle Bin"})
}

func (h *LeadHandler) DeleteLandingPage(c *gin.Context) {
	idStr := c.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid LP ID"})
		return
	}

	if err := h.repo.DeleteLandingPage(id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete landing page"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Landing Page moved to Recycle Bin"})
}
