package provider

import (
	"time"
	"github.com/google/uuid"
)

type Vendor struct {
	ID            uuid.UUID `gorm:"type:uuid;primary_key;default:uuid_generate_v4()" json:"id"`
	VendorName    string    `gorm:"size:100;not null" json:"vendor_name"`
	CompanyName   string    `gorm:"size:255" json:"company_name"`
	ContactPerson string    `gorm:"size:100" json:"contact_person"`
	Phone         string    `gorm:"size:20" json:"phone"`
	Email         string    `gorm:"size:255" json:"email"`
	Address       string    `gorm:"type:text" json:"address"`
	LicenseNumber string    `gorm:"size:100" json:"license_number"`
	Status        string    `gorm:"size:20;default:'pending'" json:"status"`
	CreatedAt     time.Time `json:"created_at"`
}
