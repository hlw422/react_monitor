# React Monitor Deployment Guide

## Prerequisites

- Docker 20.10+
- Docker Compose 2.0+
- Node.js 18+ (for local development)
- npm or yarn (for local development)

## Quick Start

### 1. Clone the repository

```bash
git clone <repository-url>
cd react_monitor
```

### 2. Configure environment variables

Create a `.env` file in the root directory:

```bash
# Database
DB_PASSWORD=your_secure_password

# JWT Secret (change this in production!)
JWT_SECRET=your-super-secret-jwt-key-change-in-production

# Environment
NODE_ENV=production
```

### 3. Deploy with Docker Compose

#### Development
```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

#### Production
```bash
# Make deployment script executable
chmod +x deploy.sh

# Run deployment script
./deploy.sh

# Or manually:
docker-compose -f docker-compose.prod.yml up -d
```

## Service Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Nginx     │────▶│  Frontend   │     │  PostgreSQL │
│   (Port 80) │     │  (Port 3000)│     │  (Port 5432)│
└─────────────┘     └─────────────┘     └─────────────┘
       │                   │                   │
       │                   │                   │
       ▼                   ▼                   ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Backend   │◀───▶│    Redis    │     │   Monitor   │
│  (Port 4000)│     │  (Port 6379)│     │   Network   │
└─────────────┘     └─────────────┘     └─────────────┘
```

## Service URLs

- **Frontend**: http://localhost
- **Backend API**: http://localhost/api
- **PostgreSQL**: localhost:5432
- **Redis**: localhost:6379

## Configuration

### Database Configuration

The PostgreSQL database is configured with the following default settings:

- **Host**: postgres
- **Port**: 5432
- **Username**: postgres
- **Password**: postgres (change in .env)
- **Database**: monitor_db

### Redis Configuration

Redis is configured with default settings:

- **Host**: redis
- **Port**: 6379

### JWT Configuration

JWT tokens are configured with:

- **Secret**: Change in .env file
- **Access Token Expiration**: 15 minutes
- **Refresh Token Expiration**: 7 days

## SSL Configuration

For production with SSL:

1. Place your SSL certificates in `nginx/ssl/`:
   - `cert.pem` - SSL certificate
   - `key.pem` - SSL private key

2. Update `nginx/nginx.prod.conf` with your domain name

3. Use the production docker-compose file:
   ```bash
   docker-compose -f docker-compose.prod.yml up -d
   ```

## Monitoring

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f postgres
docker-compose logs -f redis
```

### Health Checks

- **Backend**: http://localhost/api/health
- **Frontend**: http://localhost
- **PostgreSQL**: `pg_isready -U postgres`
- **Redis**: `redis-cli ping`

## Backup and Restore

### Database Backup

```bash
# Create backup
docker-compose exec postgres pg_dump -U postgres monitor_db > backup.sql

# Restore backup
docker-compose exec -T postgres psql -U postgres monitor_db < backup.sql
```

### Redis Backup

```bash
# Create backup
docker-compose exec redis redis-cli BGSAVE

# Copy backup file
docker-compose cp redis:/data/dump.rdb ./redis-backup.rdb
```

## Troubleshooting

### Common Issues

1. **Port already in use**
   ```bash
   # Check what's using the port
   netstat -tulpn | grep :80
   
   # Stop the service or change port in docker-compose.yml
   ```

2. **Database connection issues**
   ```bash
   # Check database logs
   docker-compose logs postgres
   
   # Restart database
   docker-compose restart postgres
   ```

3. **Permission issues**
   ```bash
   # Fix file permissions
   sudo chown -R $USER:$USER .
   ```

### Reset Everything

```bash
# Stop and remove all containers, networks, and volumes
docker-compose down -v

# Remove all images
docker rmi $(docker images -q)

# Start fresh
docker-compose up -d
```

## Performance Tuning

### PostgreSQL

Add to `docker-compose.yml` under postgres service:

```yaml
command: >
  postgres
  -c shared_buffers=256MB
  -c effective_cache_size=768MB
  -c maintenance_work_mem=64MB
  -c checkpoint_completion_target=0.9
  -c wal_buffers=16MB
  -c default_statistics_target=100
  -c random_page_cost=1.1
  -c effective_io_concurrency=200
  -c work_mem=4MB
  -c min_wal_size=1GB
  -c max_wal_size=4GB
```

### Redis

Add to `docker-compose.yml` under redis service:

```yaml
command: redis-server --appendonly yes --maxmemory 256mb --maxmemory-policy allkeys-lru
```

## Security

### Production Security Checklist

- [ ] Change default passwords
- [ ] Use strong JWT secret
- [ ] Enable SSL/HTTPS
- [ ] Configure firewall rules
- [ ] Regular security updates
- [ ] Monitor logs for suspicious activity
- [ ] Backup database regularly
- [ ] Use environment variables for secrets

## Support

For issues and questions:

1. Check the troubleshooting section
2. Review service logs
3. Check Docker and Docker Compose versions
4. Verify environment variables
