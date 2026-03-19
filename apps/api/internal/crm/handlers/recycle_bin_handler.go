package handlers

import (
	"net/http"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/user/umrah-hub-aggregator/apps/api/pkg/db"
	"github.com/user/umrah-hub-aggregator/apps/api/internal/crm"
	pkgModels "github.com/user/umrah-hub-aggregator/apps/api/internal/package"
	marketingModels "github.com/user/umrah-hub-aggregator/apps/api/internal/marketing"
)

type RecycleBinHandler struct{}

func NewRecycleBinHandler() *RecycleBinHandler {
	return &RecycleBinHandler{}
}

func (h *RecycleBinHandler) GetDeletedItems(c *gin.Context) {
	// Fetch deleted leads
	var deletedLeads []crm.Lead
	db.DB.Unscoped().Where("deleted_at IS NOT NULL").Find(&deletedLeads)

	// Fetch deleted packages
	var deletedPackages []pkgModels.Package
	db.DB.Unscoped().Where("deleted_at IS NOT NULL").Find(&deletedPackages)

	// Fetch deleted campaigns
	var deletedCampaigns []marketingModels.Campaign
	db.DB.Unscoped().Where("deleted_at IS NOT NULL").Find(&deletedCampaigns)

	// Fetch deleted landing pages
	var deletedLPs []crm.LandingPage
	db.DB.Unscoped().Where("deleted_at IS NOT NULL").Find(&deletedLPs)

	c.JSON(http.StatusOK, gin.H{
		"leads":     deletedLeads,
		"packages":  deletedPackages,
		"campaigns": deletedCampaigns,
		"lps":       deletedLPs,
	})
}

func (h *RecycleBinHandler) RestoreItem(c *gin.Context) {
	var req struct {
		ID   uuid.UUID `json:"id" binding:"required"`
		Type string    `json:"type" binding:"required"` // lead, package, campaign, lp
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var err error
	switch req.Type {
	case "lead":
		err = db.DB.Unscoped().Model(&crm.Lead{}).Where("id = ?", req.ID).Update("deleted_at", nil).Error
	case "package":
		err = db.DB.Unscoped().Model(&pkgModels.Package{}).Where("id = ?", req.ID).Update("deleted_at", nil).Error
	case "campaign":
		err = db.DB.Unscoped().Model(&marketingModels.Campaign{}).Where("id = ?", req.ID).Update("deleted_at", nil).Error
	case "lp":
		err = db.DB.Unscoped().Model(&crm.LandingPage{}).Where("id = ?", req.ID).Update("deleted_at", nil).Error
	default:
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid item type"})
		return
	}

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to restore item"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Item restored successfully"})
}

func (h *RecycleBinHandler) PurgeItem(c *gin.Context) {
	idStr := c.Param("id")
	itemType := c.Query("type")
	id, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}

	var txErr error
	switch itemType {
	case "lead":
		txErr = db.DB.Unscoped().Delete(&crm.Lead{}, id).Error
	case "package":
		txErr = db.DB.Unscoped().Delete(&pkgModels.Package{}, id).Error
	case "campaign":
		txErr = db.DB.Unscoped().Delete(&marketingModels.Campaign{}, id).Error
	case "lp":
		txErr = db.DB.Unscoped().Delete(&crm.LandingPage{}, id).Error
	default:
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid item type"})
		return
	}

	if txErr != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to purge item permanently"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Item purged permanently"})
}
