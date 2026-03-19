package repository

import (
	"github.com/google/uuid"
	"github.com/user/umrah-hub-aggregator/apps/api/internal/provider"
	"gorm.io/gorm"
)

type VendorRepository interface {
	GetAll() ([]provider.Vendor, error)
	GetByID(id uuid.UUID) (*provider.Vendor, error)
	Create(v *provider.Vendor) error
}

type vendorRepository struct {
	db *gorm.DB
}

func NewVendorRepository(db *gorm.DB) VendorRepository {
	return &vendorRepository{db}
}

func (r *vendorRepository) GetAll() ([]provider.Vendor, error) {
	var vendors []provider.Vendor
	err := r.db.Find(&vendors).Error
	return vendors, err
}

func (r *vendorRepository) GetByID(id uuid.UUID) (*provider.Vendor, error) {
	var v provider.Vendor
	err := r.db.First(&v, "id = ?", id).Error
	return &v, err
}

func (r *vendorRepository) Create(v *provider.Vendor) error {
	return r.db.Create(v).Error
}
