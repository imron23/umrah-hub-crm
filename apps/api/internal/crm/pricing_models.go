package crm

import (
	"time"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

// TripPackage is a dated travel package product, e.g. "Umrah Liburan 2 Juni 2026"
type TripPackage struct {
	ID              uuid.UUID      `gorm:"type:uuid;primary_key;default:uuid_generate_v4()" json:"id"`
	VendorID        *uuid.UUID     `gorm:"type:uuid" json:"vendor_id"`
	Name            string         `gorm:"size:255;not null" json:"name"`
	Description     string         `gorm:"type:text" json:"description"`
	DepartureDate   *time.Time     `json:"departure_date"`
	ReturnDate      *time.Time     `json:"return_date"`
	Destination     string         `gorm:"size:100;default:'Makkah - Madinah'" json:"destination"`
	DurationNights  int            `gorm:"default:9" json:"duration_nights"`
	Currency        string         `gorm:"size:10;default:'IDR'" json:"currency"` // IDR or USD
	Status          string         `gorm:"size:20;default:'active'" json:"status"`
	Tiers           []PackageTier  `gorm:"foreignKey:TripPackageID" json:"tiers"`
	CreatedAt       time.Time      `json:"created_at"`
	DeletedAt       gorm.DeletedAt `gorm:"index" json:"-"`
}

// PackageTier defines a tier within a package: Bronze, Silver, Gold, VVIP, etc.
type PackageTier struct {
	ID            uuid.UUID        `gorm:"type:uuid;primary_key;default:uuid_generate_v4()" json:"id"`
	TripPackageID uuid.UUID        `gorm:"type:uuid" json:"trip_package_id"`
	TierName      string           `gorm:"size:100;not null" json:"tier_name"`   // e.g. "VVIP", "Gold"
	TierLabel     string           `gorm:"size:50" json:"tier_label"`             // e.g. "Full Private"
	SortOrder     int              `gorm:"default:0" json:"sort_order"`
	ColorCode     string           `gorm:"size:20;default:'#6366f1'" json:"color_code"`
	IncludesItems string           `gorm:"type:text" json:"includes_items"`       // JSON string
	RoomPrices    []TierRoomPrice  `gorm:"foreignKey:TierID" json:"room_prices"`
	CreatedAt     time.Time        `json:"created_at"`
}

// TierRoomPrice defines the per-person price for a specific room type within a tier
type TierRoomPrice struct {
	ID        uuid.UUID `gorm:"type:uuid;primary_key;default:uuid_generate_v4()" json:"id"`
	TierID    uuid.UUID `gorm:"type:uuid" json:"tier_id"`
	RoomType  string    `gorm:"size:20;not null" json:"room_type"` // single, double, triple, quad
	Price     float64   `gorm:"not null" json:"price"`
	Quota     int       `gorm:"default:0" json:"quota"`
	CreatedAt time.Time `json:"created_at"`
}

// LeadTransaction links a converted lead (dp/closing) to a specific package, tier, room & price
type LeadTransaction struct {
	ID              uuid.UUID      `gorm:"type:uuid;primary_key;default:uuid_generate_v4()" json:"id"`
	LeadID          uuid.UUID      `gorm:"type:uuid;index" json:"lead_id"`
	TripPackageID   *uuid.UUID     `gorm:"type:uuid" json:"trip_package_id"`
	TierID          *uuid.UUID     `gorm:"type:uuid" json:"tier_id"`
	RoomPriceID     *uuid.UUID     `gorm:"type:uuid" json:"room_price_id"`
	TransactionType string         `gorm:"size:20;default:'dp'" json:"transaction_type"` // dp or full_payment
	PaxCount        int            `gorm:"default:1" json:"pax_count"`
	DPAmount        *float64       `json:"dp_amount"`    // only for dp type: custom DP nominal
	FinalAmount     float64        `json:"final_amount"` // price * pax_count (from tier_room_price)
	Currency        string         `gorm:"size:10;default:'IDR'" json:"currency"`
	Notes           string         `gorm:"type:text" json:"notes"`

	// Preloaded relations for revenue reporting
	TripPackage     *TripPackage   `gorm:"foreignKey:TripPackageID" json:"trip_package,omitempty"`
	PackageTier     *PackageTier   `gorm:"foreignKey:TierID" json:"tier,omitempty"`
	RoomPrice       *TierRoomPrice `gorm:"foreignKey:RoomPriceID" json:"room_price,omitempty"`

	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}
