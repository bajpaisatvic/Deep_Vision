# Deep Vision — Docker Makefile
# Convenient commands for Docker operations
# Usage: make <target>

.PHONY: help build up down logs clean migrate shell celery-shell redis-cli db-shell restart stop start

help:
	@echo "Deep Vision — Docker Management"
	@echo "================================"
	@echo ""
	@echo "Available commands:"
	@echo "  make build              - Build all Docker images"
	@echo "  make up                 - Start all services (development)"
	@echo "  make up-prod            - Start all services (production)"
	@echo "  make down               - Stop all services"
	@echo "  make stop               - Stop services without removing"
	@echo "  make restart            - Restart all services"
	@echo "  make logs               - View logs from all services"
	@echo "  make logs-backend       - View backend logs"
	@echo "  make logs-celery        - View Celery worker logs"
	@echo "  make logs-realtime      - View real-time server logs"
	@echo "  make logs-dashboard     - View dashboard logs"
	@echo "  make logs-db            - View database logs"
	@echo "  make migrate            - Run Django migrations"
	@echo "  make superuser          - Create Django superuser"
	@echo "  make shell              - Django shell"
	@echo "  make celery-shell       - Celery shell"
	@echo "  make redis-cli          - Redis CLI"
	@echo "  make db-shell           - PostgreSQL shell"
	@echo "  make clean              - Remove all containers, volumes, images"
	@echo "  make ps                 - View running containers"
	@echo "  make test               - Run tests"
	@echo ""

build:
	docker-compose build --no-cache

up:
	docker-compose up

up-prod:
	docker-compose -f docker-compose.yml up -d

down:
	docker-compose down

stop:
	docker-compose stop

start:
	docker-compose start

restart:
	docker-compose restart

ps:
	docker-compose ps

logs:
	docker-compose logs -f

logs-backend:
	docker-compose logs -f backend

logs-celery:
	docker-compose logs -f celery

logs-realtime:
	docker-compose logs -f realtime

logs-dashboard:
	docker-compose logs -f dashboard

logs-db:
	docker-compose logs -f postgres

migrate:
	docker-compose exec backend python manage.py migrate

superuser:
	docker-compose exec backend python manage.py createsuperuser

shell:
	docker-compose exec backend python manage.py shell

celery-shell:
	docker-compose exec celery celery -A config.celery_app shell

redis-cli:
	docker-compose exec redis redis-cli

db-shell:
	docker-compose exec postgres psql -U deepvision_user -d deep_vision

clean:
	docker-compose down -v
	docker system prune -f

test:
	docker-compose exec backend pytest -v

lint:
	docker-compose exec backend flake8 .
	docker-compose exec backend black --check .

format:
	docker-compose exec backend black .

requirements-install:
	docker-compose exec backend pip install -r requirements.txt

requirements-freeze:
	docker-compose exec backend pip freeze > requirements.txt
