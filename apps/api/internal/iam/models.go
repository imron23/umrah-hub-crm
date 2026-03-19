package iam

import (
	"time"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Role struct {
	ID          uuid.UUID      `gorm:"type:uuid;primary_key;default:uuid_generate_v4()" json:"id"`
	Name        string         `gorm:"size:50;unique;not null" json:"name"`
	Permissions string         `gorm:"type:jsonb;default:'{}'" json:"permissions"`
	CreatedAt   time.Time      `json:"created_at"`
}

type User struct {
	ID           uuid.UUID      `gorm:"type:uuid;primary_key;default:uuid_generate_v4()" json:"id"`
	Email        string         `gorm:"size:255;unique;not null" json:"email"`
	PasswordHash string         `gorm:"not null" json:"-"`
	RoleID       uuid.UUID      `gorm:"type:uuid" json:"role_id"`
	Role         Role           `gorm:"foreignKey:RoleID" json:"role"`
	Status       string         `gorm:"size:20;default:'active'" json:"status"`
	CreatedAt    time.Time      `json:"created_at"`
	DeletedAt    gorm.DeletedAt `gorm:"index" json:"-"`
}
