package service

import (
	"errors"
	"os"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"github.com/user/umrah-hub-aggregator/apps/api/internal/iam"
	"github.com/user/umrah-hub-aggregator/apps/api/internal/iam/repository"
	"golang.org/x/crypto/bcrypt"
)

type IAMService interface {
	Login(email, password string) (string, *iam.User, error)
	Register(email, password string, roleID string) error
	GetAllUsers() ([]iam.User, error)
	GetAllRoles() ([]iam.Role, error)
	UpdateRolePermissions(id string, permissions string) error
	UpdateUser(id string, roleID string, status string) error
	CreateRole(name string) error
	DeleteUser(id string) error
}

type iamService struct {
	repo repository.UserRepository
}

func NewIAMService(repo repository.UserRepository) IAMService {
	return &iamService{repo}
}

func (s *iamService) Login(email, password string) (string, *iam.User, error) {
	user, err := s.repo.FindByEmail(email)
	if err != nil {
		return "", nil, errors.New("invalid credentials")
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(password)); err != nil {
		return "", nil, errors.New("invalid credentials")
	}

	token, err := s.generateToken(user)
	if err != nil {
		return "", nil, err
	}

	return token, user, nil
}

func (s *iamService) Register(email, password string, roleID string) error {
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return err
	}

	parsedRoleID, err := uuid.Parse(roleID)
	if err != nil {
		return errors.New("invalid role ID format")
	}

	user := &iam.User{
		ID:           uuid.New(),
		Email:        email,
		PasswordHash: string(hashedPassword),
		Status:       "active",
		RoleID:       parsedRoleID,
	}
	
	return s.repo.Create(user)
}

func (s *iamService) CreateRole(name string) error {
	role := &iam.Role{
		ID:          uuid.New(),
		Name:        name,
		Permissions: "{}",
	}
	return s.repo.CreateRole(role)
}

func (s *iamService) GetAllUsers() ([]iam.User, error) {
	return s.repo.GetAllUsers()
}

func (s *iamService) GetAllRoles() ([]iam.Role, error) {
	return s.repo.GetAllRoles()
}

func (s *iamService) UpdateRolePermissions(id string, permissions string) error {
	return s.repo.UpdateRolePermissions(id, permissions)
}

func (s *iamService) UpdateUser(id string, roleID string, status string) error {
	return s.repo.UpdateUser(id, roleID, status)
}

func (s *iamService) DeleteUser(id string) error {
	return s.repo.Delete(id)
}

func (s *iamService) generateToken(user *iam.User) (string, error) {
	secret := os.Getenv("JWT_SECRET")
	if secret == "" {
		secret = "default_secret" // Fallback but should be set in .env
	}

	claims := jwt.MapClaims{
		"sub":   user.ID,
		"email": user.Email,
		"role":  user.Role.Name,
		"exp":   time.Now().Add(tokenDuration).Unix(),
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(secret))
}

const tokenDuration = time.Hour * 24 * 7
