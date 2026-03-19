package marketing

import (
	"time"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Campaign struct {
	ID        uuid.UUID `gorm:"type:uuid;primary_key;default:uuid_generate_v4()" json:"id"`
	Name      string    `gorm:"size:100;not null" json:"name"`
	Provider  string    `gorm:"size:50" json:"provider"` // meta, google, tiktok
	Status    string    `gorm:"size:20;default:'active'" json:"status"`
	CreatedAt time.Time `json:"created_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`
}

type CampaignCost struct {
	ID         uuid.UUID `gorm:"type:uuid;primary_key;default:uuid_generate_v4()" json:"id"`
	CampaignID uuid.UUID `gorm:"type:uuid" json:"campaign_id"`
	Amount     float64   `gorm:"type:decimal(15,2);not null" json:"amount"`
	Currency   string    `gorm:"size:10;default:'IDR'" json:"currency"`
	CostDate   time.Time `gorm:"type:date;not null" json:"cost_date"`
	CreatedAt  time.Time `json:"created_at"`
}

type LeadAttribution struct {
	ID          uuid.UUID `gorm:"type:uuid;primary_key;default:uuid_generate_v4()" json:"id"`
	LeadID      uuid.UUID `gorm:"type:uuid" json:"lead_id"`
	UTMSource   string    `gorm:"size:100" json:"utm_source"`
	UTMMedium   string    `gorm:"size:100" json:"utm_medium"`
	UTMCampaign string    `gorm:"size:100" json:"utm_campaign"`
	UTMContent  string    `gorm:"size:100" json:"utm_content"`
	UTMTerm     string    `gorm:"size:100" json:"utm_term"`
	FBClid      string    `gorm:"size:255" json:"fbclid"`
	GClid       string    `gorm:"size:255" json:"gclid"`
	IPAddress   string    `gorm:"size:45" json:"ip_address"`
	UserAgent   string    `gorm:"type:text" json:"user_agent"`
	CreatedAt   time.Time `json:"created_at"`
}

type CallLog struct {
	ID           uuid.UUID `gorm:"type:uuid;primary_key;default:uuid_generate_v4()" json:"id"`
	LeadID       uuid.UUID `gorm:"type:uuid" json:"lead_id"`
	AgentID      uuid.UUID `gorm:"type:uuid" json:"agent_id"`
	CallDuration int       `json:"call_duration"`
	CallResult   string    `gorm:"size:50" json:"call_result"`
	RecordingURL string    `gorm:"type:text" json:"recording_url"`
	Timestamp    time.Time `json:"timestamp"`
}
