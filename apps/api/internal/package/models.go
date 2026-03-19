package pkg

import (
	"time"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Package struct {
	ID            uuid.UUID `gorm:"type:uuid;primary_key;default:uuid_generate_v4()" json:"id"`
	VendorID      uuid.UUID `gorm:"type:uuid" json:"vendor_id"`
	Name          string    `gorm:"size:255;not null" json:"name"`
	Slug          string    `gorm:"size:255;unique;not null" json:"slug"`
	VendorPrice   float64   `gorm:"not null" json:"vendor_price"`
	PlatformFee   float64   `gorm:"not null" json:"platform_fee"`
	CustomerPrice float64   `gorm:"->;column:customer_price" json:"customer_price"`
	Duration      int       `json:"duration"`
	DepartureCity string    `gorm:"size:100" json:"departure_city"`
	HotelMakkah   string    `gorm:"size:255" json:"hotel_makkah"`
	HotelMadinah  string    `gorm:"size:255" json:"hotel_madinah"`
	Airline       string    `gorm:"size:100" json:"airline"`
	Quota         int       `json:"quota"`
	Description   string    `gorm:"type:text" json:"description"`
	Status        string    `gorm:"size:20;default:'active'" json:"status"`
	CreatedAt     time.Time `json:"created_at"`
	DeletedAt     gorm.DeletedAt `gorm:"index" json:"-"`
}
