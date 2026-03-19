package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	pkg "github.com/user/umrah-hub-aggregator/apps/api/internal/package"
	"github.com/user/umrah-hub-aggregator/apps/api/internal/package/repository"
)

type PackageHandler struct {
	repo repository.PackageRepository
}

func NewPackageHandler(repo repository.PackageRepository) *PackageHandler {
	return &PackageHandler{repo}
}

type CreatePackageRequest struct {
	VendorID    uuid.UUID `json:"vendor_id" binding:"required"`
	Name        string    `json:"name" binding:"required"`
	Slug        string    `json:"slug" binding:"required"`
	VendorPrice float64   `json:"vendor_price" binding:"required"`
	PlatformFee float64   `json:"platform_fee"`
	Duration    int       `json:"duration"`
	Airline     string    `json:"airline"`
	HotelMakkah string    `json:"hotel_makkah"`
}

func (h *PackageHandler) CreatePackage(c *gin.Context) {
	var req CreatePackageRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	p := &pkg.Package{
		ID:          uuid.New(),
		VendorID:    req.VendorID,
		Name:        req.Name,
		Slug:        req.Slug,
		VendorPrice: req.VendorPrice,
		PlatformFee: req.PlatformFee,
		Duration:    req.Duration,
		Airline:     req.Airline,
		HotelMakkah: req.HotelMakkah,
		Status:      "active",
	}

	if err := h.repo.Create(p); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create package"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "Package created successfully",
		"package": p,
	})
}

func (h *PackageHandler) UpdatePackage(c *gin.Context) {
	idStr := c.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid package ID"})
		return
	}

	var req CreatePackageRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	p, err := h.repo.GetByID(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Package not found"})
		return
	}

	p.Name = req.Name
	p.Slug = req.Slug
	p.VendorPrice = req.VendorPrice
	p.PlatformFee = req.PlatformFee
	p.Duration = req.Duration
	p.Airline = req.Airline
	p.HotelMakkah = req.HotelMakkah
	p.VendorID = req.VendorID

	if err := h.repo.Update(p); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update package"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Package updated successfully", "package": p})
}

func (h *PackageHandler) GetAllPackages(c *gin.Context) {
	packages, err := h.repo.GetAll()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch packages"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"packages": packages,
	})
}

func (h *PackageHandler) GetPackagesByVendor(c *gin.Context) {
	vendorIDStr := c.Param("vendor_id")
	vendorID, err := uuid.Parse(vendorIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid vendor ID"})
		return
	}

	packages, err := h.repo.GetByVendorID(vendorID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch packages for vendor"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"packages": packages,
	})
}
func (h *PackageHandler) DeletePackage(c *gin.Context) {
	idStr := c.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid package ID"})
		return
	}

	if err := h.repo.Delete(id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete package"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Package deleted successfully"})
}
