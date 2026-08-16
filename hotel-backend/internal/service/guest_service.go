package service

import (
	"errors"

	"hotel-backend/internal/models"
	"hotel-backend/internal/repository"
)

type GuestService interface {
	CreateGuest(req *models.CreateGuestRequest) (*models.Guest, error)
	GetGuestByID(id uint) (*models.Guest, error)
	GetAllGuests(search string) ([]models.Guest, error)
	UpdateGuest(id uint, req *models.UpdateGuestRequest) (*models.Guest, error)
	DeleteGuest(id uint) error
}

type guestService struct {
	guestRepo repository.GuestRepository
}

func NewGuestService(guestRepo repository.GuestRepository) GuestService {
	return &guestService{guestRepo: guestRepo}
}

func (s *guestService) CreateGuest(req *models.CreateGuestRequest) (*models.Guest, error) {
	guest := &models.Guest{
		FirstName:        req.FirstName,
		LastName:         req.LastName,
		Email:            req.Email,
		Phone:            req.Phone,
		IDCardOrPassport: req.IDCardOrPassport,
		Address:          req.Address,
	}

	err := s.guestRepo.Create(guest)
	return guest, err
}

func (s *guestService) GetGuestByID(id uint) (*models.Guest, error) {
	guest, err := s.guestRepo.FindByID(id)
	if err != nil {
		return nil, errors.New("guest not found")
	}
	return guest, nil
}

func (s *guestService) GetAllGuests(search string) ([]models.Guest, error) {
	return s.guestRepo.FindAll(search)
}

func (s *guestService) UpdateGuest(id uint, req *models.UpdateGuestRequest) (*models.Guest, error) {
	guest, err := s.guestRepo.FindByID(id)
	if err != nil {
		return nil, errors.New("guest not found")
	}

	if req.FirstName != nil {
		guest.FirstName = *req.FirstName
	}
	if req.LastName != nil {
		guest.LastName = *req.LastName
	}
	if req.Email != nil {
		guest.Email = *req.Email
	}
	if req.Phone != nil {
		guest.Phone = *req.Phone
	}
	if req.IDCardOrPassport != nil {
		guest.IDCardOrPassport = *req.IDCardOrPassport
	}
	if req.Address != nil {
		guest.Address = *req.Address
	}

	err = s.guestRepo.Update(guest)
	return guest, err
}

func (s *guestService) DeleteGuest(id uint) error {
	return s.guestRepo.Delete(id)
}
