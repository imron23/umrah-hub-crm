package repository

import (
	"github.com/user/umrah-hub-aggregator/apps/api/internal/iam"
	"gorm.io/gorm"
)

type UserRepository interface {
	FindByEmail(email string) (*iam.User, error)
	Create(user *iam.User) error
	GetAllUsers() ([]iam.User, error)
	GetAllRoles() ([]iam.Role, error)
	CreateRole(role *iam.Role) error
	UpdateRolePermissions(id string, permissions string) error
	UpdateUser(id string, roleID string, status string) error
	Delete(id string) error
}

type userRepository struct {
	db *gorm.DB
}

func NewUserRepository(db *gorm.DB) UserRepository {
	return &userRepository{db}
}

func (r *userRepository) FindByEmail(email string) (*iam.User, error) {
	var user iam.User
	if err := r.db.Preload("Role").Where("email = ?", email).First(&user).Error; err != nil {
		return nil, err
	}
	return &user, nil
}

func (r *userRepository) Create(user *iam.User) error {
	return r.db.Create(user).Error
}

func (r *userRepository) CreateRole(role *iam.Role) error {
	return r.db.Create(role).Error
}
func (r *userRepository) GetAllUsers() ([]iam.User, error) {
	var users []iam.User
	err := r.db.Preload("Role").Find(&users).Error
	return users, err
}

func (r *userRepository) GetAllRoles() ([]iam.Role, error) {
	var roles []iam.Role
	err := r.db.Find(&roles).Error
	return roles, err
}

func (r *userRepository) UpdateRolePermissions(id string, permissions string) error {
	return r.db.Model(&iam.Role{}).Where("id = ?", id).Update("permissions", permissions).Error
}

func (r *userRepository) UpdateUser(id string, roleID string, status string) error {
	updates := make(map[string]interface{})
	if roleID != "" {
		updates["role_id"] = roleID
	}
	if status != "" {
		updates["status"] = status
	}
	return r.db.Model(&iam.User{}).Where("id = ?", id).Updates(updates).Error
}

func (r *userRepository) Delete(id string) error {
	return r.db.Where("id = ?", id).Delete(&iam.User{}).Error
}
