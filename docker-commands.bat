@echo off
REM Deep Vision — Docker Batch Commands for Windows
REM Usage: docker-commands <command>

if "%1%"=="help" (
    echo Deep Vision - Docker Management for Windows
    echo.
    echo Available commands:
    echo   docker-commands build              - Build all Docker images
    echo   docker-commands up                 - Start all services
    echo   docker-commands down               - Stop all services
    echo   docker-commands logs               - View logs
    echo   docker-commands logs-backend       - View backend logs
    echo   docker-commands migrate            - Run Django migrations
    echo   docker-commands superuser          - Create Django superuser
    echo   docker-commands shell              - Django shell
    echo   docker-commands redis              - Redis CLI
    echo   docker-commands psql               - PostgreSQL shell
    echo   docker-commands clean              - Remove all containers and volumes
    echo   docker-commands ps                 - View running containers
    goto :eof
)

if "%1%"=="build" (
    docker-compose build --no-cache
    goto :eof
)

if "%1%"=="up" (
    docker-compose up
    goto :eof
)

if "%1%"=="up-prod" (
    docker-compose -f docker-compose.yml up -d
    goto :eof
)

if "%1%"=="down" (
    docker-compose down
    goto :eof
)

if "%1%"=="logs" (
    docker-compose logs -f
    goto :eof
)

if "%1%"=="logs-backend" (
    docker-compose logs -f backend
    goto :eof
)

if "%1%"=="logs-celery" (
    docker-compose logs -f celery
    goto :eof
)

if "%1%"=="logs-realtime" (
    docker-compose logs -f realtime
    goto :eof
)

if "%1%"=="migrate" (
    docker-compose exec backend python manage.py migrate
    goto :eof
)

if "%1%"=="superuser" (
    docker-compose exec backend python manage.py createsuperuser
    goto :eof
)

if "%1%"=="shell" (
    docker-compose exec backend python manage.py shell
    goto :eof
)

if "%1%"=="redis" (
    docker-compose exec redis redis-cli
    goto :eof
)

if "%1%"=="psql" (
    docker-compose exec postgres psql -U deepvision_user -d deep_vision
    goto :eof
)

if "%1%"=="clean" (
    docker-compose down -v
    docker system prune -f
    goto :eof
)

if "%1%"=="ps" (
    docker-compose ps
    goto :eof
)

echo Unknown command: %1%
echo Type 'docker-commands help' for available commands
