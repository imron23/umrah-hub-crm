package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/user/umrah-hub-aggregator/apps/api/internal/provider"
	"github.com/user/umrah-hub-aggregator/apps/api/internal/provider/repository"
)

type VendorHandler struct {
	repo repository.VendorRepository
}

func NewVendorHandler(repo repository.VendorRepository) *VendorHandler {
	return &VendorHandler{repo}
}

type CreateVendorRequest struct {
	VendorName    string `json:"vendor_name" binding:"required"`
	CompanyName   string `json:"company_name" binding:"required"`
	LicenseNumber string `json:"license_number" binding:"required"`
}

func (h *VendorHandler) CreateVendor(c *gin.Context) {
	var req CreateVendorRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	v := &provider.Vendor{
		ID:            uuid.New(),
		VendorName:    req.VendorName,
		CompanyName:   req.CompanyName,
		LicenseNumber: req.LicenseNumber,
		Status:        "active",
	}

	if err := h.repo.Create(v); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to onboard vendor"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "Vendor onboarded", "vendor": v})
}

func (h *VendorHandler) GetAllVendors(c *gin.Context) {
	vendors, err := h.repo.GetAll()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch vendors"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"vendors": vendors,
	})
}
