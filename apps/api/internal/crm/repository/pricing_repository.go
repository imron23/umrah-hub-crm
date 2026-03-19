package repository

import (
	"github.com/google/uuid"
	"github.com/user/umrah-hub-aggregator/apps/api/internal/crm"
	"gorm.io/gorm"
)

type PricingRepository interface {
	// Trip Packages
	CreateTripPackage(p *crm.TripPackage) error
	GetAllTripPackages() ([]crm.TripPackage, error)
	GetTripPackageByID(id uuid.UUID) (crm.TripPackage, error)
	UpdateTripPackage(p *crm.TripPackage) error
	DeleteTripPackage(id uuid.UUID) error

	// Tiers
	CreateTier(t *crm.PackageTier) error
	UpdateTier(t *crm.PackageTier) error
	DeleteTier(id uuid.UUID) error

	// Room Prices
	CreateRoomPrice(rp *crm.TierRoomPrice) error
	UpdateRoomPrice(rp *crm.TierRoomPrice) error
	DeleteRoomPrice(id uuid.UUID) error
	GetRoomPriceByID(id uuid.UUID) (crm.TierRoomPrice, error)

	// Lead Transactions (Revenue)
	CreateTransaction(tx *crm.LeadTransaction) error
	GetTransactionByLeadID(leadID uuid.UUID) (*crm.LeadTransaction, error)
	UpdateTransaction(tx *crm.LeadTransaction) error
	GetRevenueStats() (*RevenueStats, error)
	GetAllTransactions() ([]crm.LeadTransaction, error)
}

type RevenueStats struct {
	TotalIDRCommitted   float64 `json:"total_idr_committed"`   // Closing (full_payment) IDR
	TotalUSDCommitted   float64 `json:"total_usd_committed"`   // Closing (full_payment) USD
	TotalIDRDP          float64 `json:"total_idr_dp"`          // DP nominal IDR
	TotalUSDDP          float64 `json:"total_usd_dp"`          // DP nominal USD
	ClosingCount        int     `json:"closing_count"`
	DPCount             int     `json:"dp_count"`
}

type pricingRepository struct {
	db *gorm.DB
}

func NewPricingRepository(db *gorm.DB) PricingRepository {
	return &pricingRepository{db}
}

// ─── Trip Package ────────────────────────────────────────────────────────────
func (r *pricingRepository) CreateTripPackage(p *crm.TripPackage) error {
	return r.db.Create(p).Error
}

func (r *pricingRepository) GetAllTripPackages() ([]crm.TripPackage, error) {
	var packages []crm.TripPackage
	err := r.db.
		Preload("Tiers.RoomPrices").
		Where("deleted_at IS NULL").
		Order("departure_date ASC").
		Find(&packages).Error
	return packages, err
}

func (r *pricingRepository) GetTripPackageByID(id uuid.UUID) (crm.TripPackage, error) {
	var p crm.TripPackage
	err := r.db.
		Preload("Tiers.RoomPrices").
		First(&p, "id = ? AND deleted_at IS NULL", id).Error
	return p, err
}

func (r *pricingRepository) UpdateTripPackage(p *crm.TripPackage) error {
	return r.db.Save(p).Error
}

func (r *pricingRepository) DeleteTripPackage(id uuid.UUID) error {
	return r.db.Delete(&crm.TripPackage{}, "id = ?", id).Error
}

// ─── Tiers ───────────────────────────────────────────────────────────────────
func (r *pricingRepository) CreateTier(t *crm.PackageTier) error {
	return r.db.Create(t).Error
}

func (r *pricingRepository) UpdateTier(t *crm.PackageTier) error {
	return r.db.Save(t).Error
}

func (r *pricingRepository) DeleteTier(id uuid.UUID) error {
	return r.db.Delete(&crm.PackageTier{}, "id = ?", id).Error
}

// ─── Room Prices ─────────────────────────────────────────────────────────────
func (r *pricingRepository) CreateRoomPrice(rp *crm.TierRoomPrice) error {
	return r.db.Create(rp).Error
}

func (r *pricingRepository) UpdateRoomPrice(rp *crm.TierRoomPrice) error {
	return r.db.Save(rp).Error
}

func (r *pricingRepository) DeleteRoomPrice(id uuid.UUID) error {
	return r.db.Delete(&crm.TierRoomPrice{}, "id = ?", id).Error
}

func (r *pricingRepository) GetRoomPriceByID(id uuid.UUID) (crm.TierRoomPrice, error) {
	var rp crm.TierRoomPrice
	err := r.db.First(&rp, "id = ?", id).Error
	return rp, err
}

// ─── Lead Transactions ────────────────────────────────────────────────────────
func (r *pricingRepository) CreateTransaction(tx *crm.LeadTransaction) error {
	return r.db.Create(tx).Error
}

func (r *pricingRepository) GetTransactionByLeadID(leadID uuid.UUID) (*crm.LeadTransaction, error) {
	var tx crm.LeadTransaction
	err := r.db.
		Preload("TripPackage").
		Preload("PackageTier").
		Preload("RoomPrice").
		Where("lead_id = ?", leadID).
		Order("created_at DESC").
		First(&tx).Error
	if err != nil {
		return nil, err
	}
	return &tx, nil
}

func (r *pricingRepository) UpdateTransaction(tx *crm.LeadTransaction) error {
	return r.db.Save(tx).Error
}

func (r *pricingRepository) GetAllTransactions() ([]crm.LeadTransaction, error) {
	var txs []crm.LeadTransaction
	err := r.db.
		Preload("TripPackage").
		Preload("PackageTier").
		Preload("RoomPrice").
		Order("created_at DESC").
		Find(&txs).Error
	return txs, err
}

func (r *pricingRepository) GetRevenueStats() (*RevenueStats, error) {
	stats := &RevenueStats{}

	// Full Payment IDR
	r.db.Model(&crm.LeadTransaction{}).
		Where("transaction_type = 'full_payment' AND currency = 'IDR'").
		Select("COALESCE(SUM(final_amount), 0)").Scan(&stats.TotalIDRCommitted)

	// Full Payment USD
	r.db.Model(&crm.LeadTransaction{}).
		Where("transaction_type = 'full_payment' AND currency = 'USD'").
		Select("COALESCE(SUM(final_amount), 0)").Scan(&stats.TotalUSDCommitted)

	// DP IDR
	r.db.Model(&crm.LeadTransaction{}).
		Where("transaction_type = 'dp' AND currency = 'IDR'").
		Select("COALESCE(SUM(dp_amount), 0)").Scan(&stats.TotalIDRDP)

	// DP USD
	r.db.Model(&crm.LeadTransaction{}).
		Where("transaction_type = 'dp' AND currency = 'USD'").
		Select("COALESCE(SUM(dp_amount), 0)").Scan(&stats.TotalUSDDP)

	// Counts
	r.db.Model(&crm.LeadTransaction{}).Where("transaction_type = 'full_payment'").Count((*int64)(nil))

	var closingCount, dpCount int64
	r.db.Model(&crm.LeadTransaction{}).Where("transaction_type = 'full_payment'").Count(&closingCount)
	r.db.Model(&crm.LeadTransaction{}).Where("transaction_type = 'dp'").Count(&dpCount)
	stats.ClosingCount = int(closingCount)
	stats.DPCount = int(dpCount)

	return stats, nil
}
