package service

import (
	"errors"

	"hotel-backend/config"
	"hotel-backend/internal/models"
	"hotel-backend/internal/repository"
	"hotel-backend/pkg/utils"
)

type AuthService interface {
	Login(req *models.UserLoginRequest) (string, *models.UserResponse, error)
	GetProfile(userID uint) (*models.UserResponse, error)
}

type authService struct {
	userRepo repository.UserRepository
	cfg      *config.Config
}

func NewAuthService(userRepo repository.UserRepository, cfg *config.Config) AuthService {
	return &authService{
		userRepo: userRepo,
		cfg:      cfg,
	}
}

func (s *authService) Login(req *models.UserLoginRequest) (string, *models.UserResponse, error) {
	user, err := s.userRepo.FindByEmail(req.Email)
	if err != nil {
		return "", nil, errors.New("invalid email or password")
	}

	if !user.IsActive {
		return "", nil, errors.New("account is disabled. Contact system administrator")
	}

	if !utils.CheckPassword(req.Password, user.PasswordHash) {
		return "", nil, errors.New("invalid email or password")
	}

	token, err := utils.GenerateJWT(user.ID, user.Email, string(user.Role), s.cfg.JWTSecret, s.cfg.JWTExpirationHours)
	if err != nil {
		return "", nil, errors.New("failed to generate authentication token")
	}

	userResp := user.ToResponse()
	return token, &userResp, nil
}

func (s *authService) GetProfile(userID uint) (*models.UserResponse, error) {
	user, err := s.userRepo.FindByID(userID)
	if err != nil {
		return nil, errors.New("user not found")
	}
	res := user.ToResponse()
	return &res, nil
}
