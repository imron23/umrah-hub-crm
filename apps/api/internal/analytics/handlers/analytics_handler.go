package handlers

import (
	"net/http"
	"github.com/gin-gonic/gin"
	"github.com/user/umrah-hub-aggregator/apps/api/internal/analytics/service"
)

type AnalyticsHandler struct {
	service service.AnalyticsService
}

func NewAnalyticsHandler(svc service.AnalyticsService) *AnalyticsHandler {
	return &AnalyticsHandler{svc}
}

func (h *AnalyticsHandler) GetDashboard(c *gin.Context) {
	metrics, err := h.service.GetDashboardMetrics()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch analytics"})
		return
	}
	c.JSON(http.StatusOK, metrics)
}

func (h *AnalyticsHandler) GetCampaignPerformance(c *gin.Context) {
	// Placeholder for campaign performance logic
	c.JSON(http.StatusOK, gin.H{"message": "Campaign performance data coming soon"})
}

func (h *AnalyticsHandler) GetVendorPerformance(c *gin.Context) {
	// Placeholder for vendor performance logic
	c.JSON(http.StatusOK, gin.H{"message": "Vendor performance data coming soon"})
}

func (h *AnalyticsHandler) GetAgentLeaderboard(c *gin.Context) {
	// Placeholder for agent performance logic
	c.JSON(http.StatusOK, gin.H{"message": "Agent leaderboard data coming soon"})
}
