package repository

import (
	"github.com/google/uuid"
	pkg "github.com/user/umrah-hub-aggregator/apps/api/internal/package"
	"gorm.io/gorm"
)

type PackageRepository interface {
	GetAll() ([]pkg.Package, error)
	GetByVendorID(vendorID uuid.UUID) ([]pkg.Package, error)
	GetByID(id uuid.UUID) (*pkg.Package, error)
	Create(p *pkg.Package) error
	Update(p *pkg.Package) error
	Delete(id uuid.UUID) error
}

func (r *packageRepository) Delete(id uuid.UUID) error {
	return r.db.Delete(&pkg.Package{}, "id = ?", id).Error
}

type packageRepository struct {
	db *gorm.DB
}

func NewPackageRepository(db *gorm.DB) PackageRepository {
	return &packageRepository{db}
}

func (r *packageRepository) GetAll() ([]pkg.Package, error) {
	var packages []pkg.Package
	err := r.db.Find(&packages).Error
	return packages, err
}

func (r *packageRepository) GetByVendorID(vendorID uuid.UUID) ([]pkg.Package, error) {
	var packages []pkg.Package
	err := r.db.Where("vendor_id = ?", vendorID).Find(&packages).Error
	return packages, err
}

func (r *packageRepository) GetByID(id uuid.UUID) (*pkg.Package, error) {
	var p pkg.Package
	err := r.db.First(&p, "id = ?", id).Error
	return &p, err
}

func (r *packageRepository) Create(p *pkg.Package) error {
	return r.db.Create(p).Error
}
func (r *packageRepository) Update(p *pkg.Package) error {
	return r.db.Save(p).Error
}
