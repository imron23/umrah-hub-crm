package handlers

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/user/umrah-hub-aggregator/apps/api/internal/crm"
	"github.com/user/umrah-hub-aggregator/apps/api/internal/crm/repository"
)

type PricingHandler struct {
	repo        repository.PricingRepository
	leadRepo    repository.LeadRepository
}

func NewPricingHandler(repo repository.PricingRepository, leadRepo repository.LeadRepository) *PricingHandler {
	return &PricingHandler{repo, leadRepo}
}

// ─── TRIP PACKAGES ────────────────────────────────────────────────────────────

func (h *PricingHandler) GetAllTripPackages(c *gin.Context) {
	packages, err := h.repo.GetAllTripPackages()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch packages"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"packages": packages})
}

func (h *PricingHandler) GetTripPackageByID(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}
	p, err := h.repo.GetTripPackageByID(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Package not found"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"package": p})
}

func (h *PricingHandler) CreateTripPackage(c *gin.Context) {
	var req crm.TripPackage
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	req.ID = uuid.New()
	req.CreatedAt = time.Now()
	if err := h.repo.CreateTripPackage(&req); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create package"})
		return
	}
	// Reload with relations
	full, _ := h.repo.GetTripPackageByID(req.ID)
	c.JSON(http.StatusCreated, gin.H{"package": full})
}

func (h *PricingHandler) UpdateTripPackage(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}
	existing, err := h.repo.GetTripPackageByID(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Package not found"})
		return
	}
	if err := c.ShouldBindJSON(&existing); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	existing.ID = id
	if err := h.repo.UpdateTripPackage(&existing); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Package updated", "package": existing})
}

func (h *PricingHandler) DeleteTripPackage(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}
	if err := h.repo.DeleteTripPackage(id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Package archived"})
}

// ─── TIERS ────────────────────────────────────────────────────────────────────

func (h *PricingHandler) AddTier(c *gin.Context) {
	packageID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid package ID"})
		return
	}
	var req crm.PackageTier
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	req.ID = uuid.New()
	req.TripPackageID = packageID
	req.CreatedAt = time.Now()

	if err := h.repo.CreateTier(&req); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create tier"})
		return
	}
	c.JSON(http.StatusCreated, gin.H{"tier": req})
}

func (h *PricingHandler) UpdateTier(c *gin.Context) {
	id, err := uuid.Parse(c.Param("tier_id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid tier ID"})
		return
	}
	var req crm.PackageTier
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	req.ID = id
	if err := h.repo.UpdateTier(&req); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update tier"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Tier updated", "tier": req})
}

func (h *PricingHandler) DeleteTier(c *gin.Context) {
	id, err := uuid.Parse(c.Param("tier_id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid tier ID"})
		return
	}
	if err := h.repo.DeleteTier(id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete tier"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Tier removed"})
}

// ─── ROOM PRICES ──────────────────────────────────────────────────────────────

func (h *PricingHandler) UpsertRoomPrice(c *gin.Context) {
	tierID, err := uuid.Parse(c.Param("tier_id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid tier ID"})
		return
	}
	var req crm.TierRoomPrice
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	req.ID = uuid.New()
	req.TierID = tierID
	req.CreatedAt = time.Now()
	if err := h.repo.CreateRoomPrice(&req); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save room price"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"room_price": req})
}

func (h *PricingHandler) DeleteRoomPrice(c *gin.Context) {
	id, err := uuid.Parse(c.Param("price_id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}
	if err := h.repo.DeleteRoomPrice(id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete room price"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Room price removed"})
}

// ─── LEAD TRANSACTIONS (Revenue) ──────────────────────────────────────────────

// CommitTransaction is triggered when a lead's status changes to dp or closing
func (h *PricingHandler) CommitTransaction(c *gin.Context) {
	leadID, err := uuid.Parse(c.Param("lead_id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid lead ID"})
		return
	}

	var req struct {
		TripPackageID   string   `json:"trip_package_id"`
		TierID          string   `json:"tier_id"`
		RoomPriceID     string   `json:"room_price_id"`
		TransactionType string   `json:"transaction_type"` // dp or full_payment
		PaxCount        int      `json:"pax_count"`
		DPAmount        *float64 `json:"dp_amount"`  // only for dp
		Notes           string   `json:"notes"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if req.TransactionType != "dp" && req.TransactionType != "full_payment" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "transaction_type must be 'dp' or 'full_payment'"})
		return
	}

	tx := &crm.LeadTransaction{
		ID:              uuid.New(),
		LeadID:          leadID,
		TransactionType: req.TransactionType,
		PaxCount:        req.PaxCount,
		DPAmount:        req.DPAmount,
		Notes:           req.Notes,
		CreatedAt:       time.Now(),
		UpdatedAt:       time.Now(),
	}
	if req.PaxCount == 0 {
		tx.PaxCount = 1
	}

	// Link to package / tier / room price
	if req.TripPackageID != "" {
		if pid, err := uuid.Parse(req.TripPackageID); err == nil {
			tx.TripPackageID = &pid

			// Detect currency from package
			pkg, pErr := h.repo.GetTripPackageByID(pid)
			if pErr == nil {
				tx.Currency = pkg.Currency
			}
		}
	}
	if req.TierID != "" {
		if tid, err := uuid.Parse(req.TierID); err == nil {
			tx.TierID = &tid
		}
	}
	if req.RoomPriceID != "" {
		if rid, err := uuid.Parse(req.RoomPriceID); err == nil {
			tx.RoomPriceID = &rid
			// Calculate final amount from room price
			rp, rpErr := h.repo.GetRoomPriceByID(rid)
			if rpErr == nil {
				tx.FinalAmount = rp.Price * float64(tx.PaxCount)
			}
		}
	}

	// If dp, override final_amount with dp_amount
	if req.TransactionType == "dp" && req.DPAmount != nil {
		tx.DPAmount = req.DPAmount
		// FinalAmount stays as the "committed price reference" from package
	}

	if err := h.repo.CreateTransaction(tx); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to record transaction"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message":     "Transaction committed",
		"transaction": tx,
	})
}

func (h *PricingHandler) GetLeadTransaction(c *gin.Context) {
	leadID, err := uuid.Parse(c.Param("lead_id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid lead ID"})
		return
	}
	tx, err := h.repo.GetTransactionByLeadID(leadID)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{"transaction": nil})
		return
	}
	c.JSON(http.StatusOK, gin.H{"transaction": tx})
}

func (h *PricingHandler) GetAllTransactions(c *gin.Context) {
	txs, err := h.repo.GetAllTransactions()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch transactions"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"transactions": txs})
}

func (h *PricingHandler) GetRevenueStats(c *gin.Context) {
	stats, err := h.repo.GetRevenueStats()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to calculate revenue"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"revenue": stats})
}
