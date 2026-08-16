.PHONY: up down logs migrate seed test shell rebuild help

up:
	docker-compose up -d

down:
	docker-compose down

logs:
	docker-compose logs -f app

test:
	docker-compose exec app go test ./... -v

shell:
	docker-compose exec app sh

rebuild:
	docker-compose up -d --build

clean:
	docker-compose down -v

help:
	@echo "Available commands:"
	@echo "  make up       - Start all containers in background"
	@echo "  make down     - Stop and remove all containers"
	@echo "  make logs     - Follow logs from Go API (app)"
	@echo "  make test     - Run Go test suite inside app container"
	@echo "  make shell    - Open shell inside app container"
	@echo "  make rebuild  - Rebuild Docker images and restart"
	@echo "  make clean    - Stop containers and remove persistent volumes"
