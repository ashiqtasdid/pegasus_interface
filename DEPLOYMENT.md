# Pegasus Interface - Docker Deployment Guide

This guide covers deploying the Pegasus Interface to your VPS using Docker and Docker Compose.

## 🚀 Quick Deployment

### Prerequisites
- Docker and Docker Compose installed on your VPS
- Access to your VPS (37.114.41.124)
- MongoDB Atlas connection string
- GitHub OAuth credentials

### 1. Environment Setup

Copy the production environment file and update the values:

```bash
cp .env.production .env
```

**⚠️ Important**: Update the following values in `.env`:

```bash
# Generate a secure secret for production
BETTER_AUTH_SECRET=$(openssl rand -base64 32)

# Update GitHub OAuth callback URL to:
# http://37.114.41.124:3001/api/auth/callback/github
```

### 2. Deploy with Docker

Run the deployment script:

```bash
./deploy.sh
```

The script will:
- Build the Docker image
- Start the application container
- Perform health checks
- Display deployment status

### 3. Manual Deployment (Alternative)

If you prefer manual deployment:

```bash
# Build and start
docker-compose up --build -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f pegasus-interface

# Health check
curl -f http://localhost:3001/api/health
```

## 🔧 Configuration

### Docker Configuration

The application runs in a multi-stage Docker container:
- **Stage 1**: Install dependencies
- **Stage 2**: Build the application
- **Stage 3**: Run the optimized production build

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `BETTER_AUTH_SECRET` | Authentication secret key | ✅ |
| `MONGODB_URI` | MongoDB Atlas connection string | ✅ |
| `GITHUB_CLIENT_ID` | GitHub OAuth client ID | ✅ |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth client secret | ✅ |
| `NEXT_PUBLIC_API_BASE_URL` | External API base URL | ✅ |

### GitHub OAuth Setup

Update your GitHub OAuth app settings:
1. Go to https://github.com/settings/applications/new
2. Set **Authorization callback URL** to: `http://37.114.41.124:3001/api/auth/callback/github`
3. Update the client ID and secret in your `.env` file

## 🌐 Production URLs

- **Frontend**: http://37.114.41.124:3001
- **Health Check**: http://37.114.41.124:3001/api/health
- **API**: http://37.114.41.124:3001/api/

## 📋 Management Commands

### Container Management
```bash
# Start the application
docker-compose up -d

# Stop the application
docker-compose down

# Restart the application
docker-compose restart pegasus-interface

# View logs
docker-compose logs -f pegasus-interface

# View container status
docker-compose ps
```

### Maintenance
```bash
# Update and rebuild
docker-compose down
docker-compose up --build -d

# Clean up old images
docker system prune -a

# View resource usage
docker stats pegasus-interface
```

## 🔍 Monitoring

### Health Checks
The application includes built-in health monitoring:
- Docker health checks every 30 seconds
- Manual health check: `curl http://37.114.41.124:3001/api/health`

### Logs
```bash
# View real-time logs
docker-compose logs -f pegasus-interface

# View last 100 lines
docker-compose logs --tail=100 pegasus-interface
```

## 🛡️ Security Considerations

### Environment Security
- Never commit `.env` files to version control
- Use strong, randomly generated secrets
- Regularly rotate OAuth credentials

### Network Security
- Consider setting up SSL/TLS with Let's Encrypt
- Use firewall rules to restrict access
- Monitor for suspicious activity

## 🚨 Troubleshooting

### Common Issues

**Container won't start:**
```bash
# Check logs
docker-compose logs pegasus-interface

# Verify environment variables
docker-compose config
```

**Health check failing:**
```bash
# Check if application is responding
curl -v http://localhost:3001/api/health

# Check container status
docker-compose ps
```

**Database connection issues:**
```bash
# Test MongoDB connection
docker-compose exec pegasus-interface node -e "
const { MongoClient } = require('mongodb');
const client = new MongoClient(process.env.MONGODB_URI);
client.connect().then(() => console.log('Connected')).catch(console.error);
"
```

### Performance Issues
```bash
# Monitor resource usage
docker stats pegasus-interface

# Check memory usage
docker-compose exec pegasus-interface free -h

# Check disk usage
docker system df
```

## 🔄 Updates and Maintenance

### Updating the Application
1. Pull latest changes from repository
2. Run deployment script: `./deploy.sh`
3. Verify deployment with health check

### Backup Strategy
- MongoDB Atlas handles database backups
- Consider backing up environment configuration
- Document any custom modifications

## 📞 Support

For deployment issues:
1. Check the logs: `docker-compose logs -f pegasus-interface`
2. Verify environment variables
3. Test external API connectivity
4. Check GitHub OAuth configuration

---

**🎯 Deployment Target**: VPS 37.114.41.124:3001  
**🐳 Container**: pegasus-interface  
**🔍 Health**: http://37.114.41.124:3001/api/health