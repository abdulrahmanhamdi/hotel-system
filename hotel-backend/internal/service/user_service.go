package service

import (
	"errors"

	"hotel-backend/internal/models"
	"hotel-backend/internal/repository"
	"hotel-backend/pkg/utils"
)

type UserService interface {
	CreateUser(req *models.UserRegisterRequest) (*models.UserResponse, error)
	GetAllUsers() ([]models.UserResponse, error)
	GetUserByID(id uint) (*models.UserResponse, error)
	UpdateUser(id uint, req *models.UserUpdateRequest) (*models.UserResponse, error)
	DeleteUser(id uint) error
}

type userService struct {
	userRepo repository.UserRepository
}

func NewUserService(userRepo repository.UserRepository) UserService {
	return &userService{userRepo: userRepo}
}

func (s *userService) CreateUser(req *models.UserRegisterRequest) (*models.UserResponse, error) {
	existing, _ := s.userRepo.FindByEmail(req.Email)
	if existing != nil {
		return nil, errors.New("user with this email already exists")
	}

	hash, err := utils.HashPassword(req.Password)
	if err != nil {
		return nil, errors.New("failed to hash password")
	}

	user := &models.User{
		Name:         req.Name,
		Email:        req.Email,
		PasswordHash: hash,
		Role:         req.Role,
		IsActive:     true,
	}

	if err := s.userRepo.Create(user); err != nil {
		return nil, err
	}

	res := user.ToResponse()
	return &res, nil
}

func (s *userService) GetAllUsers() ([]models.UserResponse, error) {
	users, err := s.userRepo.FindAll()
	if err != nil {
		return nil, err
	}

	var res []models.UserResponse
	for _, u := range users {
		res = append(res, u.ToResponse())
	}
	return res, nil
}

func (s *userService) GetUserByID(id uint) (*models.UserResponse, error) {
	user, err := s.userRepo.FindByID(id)
	if err != nil {
		return nil, errors.New("user not found")
	}
	res := user.ToResponse()
	return &res, nil
}

func (s *userService) UpdateUser(id uint, req *models.UserUpdateRequest) (*models.UserResponse, error) {
	user, err := s.userRepo.FindByID(id)
	if err != nil {
		return nil, errors.New("user not found")
	}

	if req.Name != nil {
		user.Name = *req.Name
	}
	if req.Email != nil {
		user.Email = *req.Email
	}
	if req.Role != nil {
		user.Role = *req.Role
	}
	if req.IsActive != nil {
		user.IsActive = *req.IsActive
	}

	if err := s.userRepo.Update(user); err != nil {
		return nil, err
	}

	res := user.ToResponse()
	return &res, nil
}

func (s *userService) DeleteUser(id uint) error {
	return s.userRepo.Delete(id)
}
