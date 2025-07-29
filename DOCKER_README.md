# Docker Setup Guide

## Environment Configuration

The application now uses environment variables for configuration. Copy the `.env.example` file to `.env` and modify the values as needed:

```bash
cp .env.example .env
```

### Environment Variables

```bash
# Database Configuration
DB_TYPE=postgres
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=prompture_user
DB_PASSWORD=prompture_password
DB_DATABASE=prompture_db

# Application Configuration
NODE_ENV=development
PORT=3000

# Docker Compose Database Configuration
POSTGRES_USER=prompture_user
POSTGRES_PASSWORD=prompture_password
POSTGRES_DB=prompture_db
```

## Docker Commands

### Using NPM Scripts (Recommended)
```bash
# Start only database services (PostgreSQL, Redis, pgAdmin)
npm run docker:db

# Start all services
npm run docker:start

# Stop all services
npm run docker:stop

# Build and start all services
npm run docker:build

# View logs
npm run docker:logs
```

### Using Docker Compose Directly
```bash
# Start all services
docker-compose up -d

# Start only database services
docker-compose up -d db redis pgadmin

# Stop all services
docker-compose down

# View logs
docker-compose logs -f

# Rebuild and start
docker-compose up -d --build
```

### Using the Docker Script
```bash
# Make the script executable (if not already done)
chmod +x docker.sh

# Available commands
./docker.sh start      # Start all services
./docker.sh stop       # Stop all services
./docker.sh restart    # Restart all services
./docker.sh logs       # Show logs
./docker.sh db-only    # Start only database services
./docker.sh build      # Build and start all services
./docker.sh clean      # Clean up Docker resources
```

## Services

### PostgreSQL Database
- **Port**: 5432 (mapped from container)
- **Username**: Configured via `POSTGRES_USER` env var
- **Password**: Configured via `POSTGRES_PASSWORD` env var
- **Database**: Configured via `POSTGRES_DB` env var

### Redis Cache
- **Port**: 6379
- **Used for**: Caching and session storage

### pgAdmin (Database Management)
- **URL**: http://localhost:5050
- **Email**: admin@prompture.com
- **Password**: admin

### NestJS Application (when enabled)
- **Port**: Configured via `PORT` env var (default: 3000)
- **Health Check**: http://localhost:3000/health

## Development Workflow

1. **Start database services only** (recommended for local development):
   ```bash
   npm run docker:db
   ```

2. **Run the application locally**:
   ```bash
   npm run start:dev
   ```

3. **Run migrations**:
   ```bash
   npm run migration:run
   ```

## Production Deployment

1. **Set production environment variables** in your `.env` file
2. **Build and start all services**:
   ```bash
   npm run docker:build
   ```

## Troubleshooting

### Database Connection Issues
- Ensure the database service is running: `docker-compose ps`
- Check database logs: `docker-compose logs db`
- Verify environment variables in `.env` file

### Port Conflicts
- Check if ports 5432, 6379, 5050, or 3000 are already in use
- Modify the ports in `docker-compose.yml` if needed

### Docker Build Issues
- Clean up Docker resources: `./docker.sh clean`
- Rebuild images: `docker-compose build --no-cache`
