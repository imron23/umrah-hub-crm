package crm

import (
	"time"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Lead struct {
	ID          uuid.UUID `gorm:"type:uuid;primary_key;default:uuid_generate_v4()" json:"id"`
	Name        string    `gorm:"size:100;not null" json:"name"`
	Phone       string    `gorm:"size:20;not null" json:"phone"`
	City        string    `gorm:"size:100" json:"city"`
	Age         int       `gorm:"default:0" json:"age"`
	GroupType   string    `gorm:"size:50" json:"group_type"` // individual, couple, family
	Message     string    `gorm:"type:text" json:"message"`
	PackageID   uuid.UUID `gorm:"type:uuid" json:"package_id"`
	VendorID    uuid.UUID `gorm:"type:uuid" json:"vendor_id"`
	Status       string    `gorm:"size:50;default:'new'" json:"status"`
	LeadScore    int       `gorm:"default:0" json:"lead_score"`
	LeadPriority int       `gorm:"default:0" json:"lead_priority"`
	UTMLogs      []UTMLog  `gorm:"foreignKey:LeadID" json:"utm_logs"`
	Assignments []LeadAssignment `gorm:"foreignKey:LeadID" json:"assignments"`
	Activities  []LeadActivity   `gorm:"foreignKey:LeadID" json:"activities"`
	CreatedAt   time.Time `json:"created_at"`
	DeletedAt   gorm.DeletedAt `gorm:"index" json:"-"`
}

type LeadActivity struct {
	ID        uuid.UUID `gorm:"type:uuid;primary_key;default:uuid_generate_v4()" json:"id"`
	LeadID    uuid.UUID `gorm:"type:uuid;index" json:"lead_id"`
	Type      string    `gorm:"size:50" json:"type"` // e.g., info_update, status_change, wa_sent, ai_analysis
	Content   string    `gorm:"type:text" json:"content"`
	AgentName string    `gorm:"size:100" json:"agent_name"`
	CreatedAt time.Time `json:"created_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`
}

type UTMLog struct {
	ID          uuid.UUID `gorm:"type:uuid;primary_key;default:uuid_generate_v4()" json:"id"`
	LeadID      uuid.UUID `gorm:"type:uuid" json:"lead_id"`
	UTMSource   string    `gorm:"size:100" json:"utm_source"`
	UTMMedium   string    `gorm:"size:100" json:"utm_medium"`
	UTMCampaign string    `gorm:"size:100" json:"utm_campaign"`
	UTMContent  string    `gorm:"size:100" json:"utm_content"`
	FBClid      string    `gorm:"size:255" json:"fbclid"`
	Referrer    string    `gorm:"type:text" json:"referrer"`
	CreatedAt   time.Time `json:"created_at"`
}

type Agent struct {
	ID            uuid.UUID `gorm:"type:uuid;primary_key;default:uuid_generate_v4()" json:"id"`
	UserID        uuid.UUID `gorm:"type:uuid" json:"user_id"`
	Email         string    `gorm:"-" json:"email"` // Virtual field from join
	DailyCapacity int       `gorm:"default:20" json:"daily_capacity"`
	CurrentLoad   int       `gorm:"default:0" json:"current_load"`
	Status        string    `gorm:"size:20;default:'available'" json:"status"`
}

type LeadAssignment struct {
	ID              uuid.UUID `gorm:"type:uuid;primary_key;default:uuid_generate_v4()" json:"id"`
	LeadID          uuid.UUID `gorm:"type:uuid" json:"lead_id"`
	AgentID         uuid.UUID `gorm:"type:uuid" json:"agent_id"`
	AssignedAt      time.Time `json:"assigned_at"`
	OwnershipStatus string    `gorm:"size:20;default:'active'" json:"ownership_status"`
}

type LandingPage struct {
	ID        uuid.UUID `gorm:"type:uuid;primary_key;default:uuid_generate_v4()" json:"id"`
	Name      string    `gorm:"size:100;not null" json:"name"`
	Slug      string    `gorm:"size:100;unique;not null" json:"slug"`
	Status    string    `gorm:"size:20;default:'active'" json:"status"` // active, inactive
	CreatedAt time.Time `json:"created_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`
}

type TrackingPixel struct {
	ID        uuid.UUID `gorm:"type:uuid;primary_key;default:uuid_generate_v4()" json:"id"`
	Provider  string    `gorm:"size:50;unique;not null" json:"provider"` // meta_pixel, gtm, ga4
	PixelID   string    `gorm:"size:255" json:"pixel_id"`
	Token     string    `gorm:"type:text" json:"token"` // For CAPI or advanced tokens
	IsActive  bool      `gorm:"default:true" json:"is_active"`
	UpdatedAt time.Time `json:"updated_at"`
}

type APIConfiguration struct {
	ID           uuid.UUID `gorm:"type:uuid;primary_key;default:uuid_generate_v4()" json:"id"`
	VendorName   string    `gorm:"size:100;not null" json:"vendor_name"`
	ProviderType string    `gorm:"size:50;not null" json:"provider_type"` // whatsapp, email, etc.
	APIKey       string    `json:"api_key"`
	APISecret    string    `json:"api_secret"`
	Endpoint     string    `json:"endpoint"`
	Status       string    `gorm:"size:20;default:'active'" json:"status"`
	Priority     int       `gorm:"default:1" json:"priority"`
	ConfigJSON   string    `gorm:"type:text" json:"config_json"`
	CreatedAt    time.Time `json:"created_at"`
}
