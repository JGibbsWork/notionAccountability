# Accountability Coach - Notion API Service

A containerized REST API service for managing accountability data in Notion databases.

## 🐳 Docker Commands

### Build the Image
```bash
# Build the Docker image
docker build -t accountability-coach-api .

# Tag for your Docker Hub (replace 'yourusername' with your Docker Hub username)
docker tag accountability-coach-api yourusername/accountability-coach-api:latest
```

### Push to Docker Hub
```bash
# Login to Docker Hub
docker login

# Push the image
docker push yourusername/accountability-coach-api:latest
```

### Pull and Run from Docker Hub
```bash
# Pull the image
docker pull yourusername/accountability-coach-api:latest

# Run the container with environment file
docker run -d \
  --name accountability-coach \
  -p 3000:3000 \
  --env-file notionApi.env \
  --restart unless-stopped \
  yourusername/accountability-coach-api:latest
```

### Alternative: Run with Individual Environment Variables
```bash
docker run -d \
  --name accountability-coach \
  -p 3000:3000 \
  -e NOTION_API_KEY="your_api_key_here" \
  -e NOTION_CARDIO_DB_ID="your_cardio_db_id" \
  -e NOTION_DEBT_DB_ID="your_debt_db_id" \
  -e NOTION_BALANCES_DB_ID="your_balances_db_id" \
  -e NOTION_BONUSES_DB_ID="your_bonuses_db_id" \
  -e NOTION_WORKOUTS_DB_ID="your_workouts_db_id" \
  -e PORT=3000 \
  -e NODE_ENV=production \
  --restart unless-stopped \
  yourusername/accountability-coach-api:latest
```

## 📁 Environment File Setup

Create a `notionApi.env` file in your deployment directory:

```bash
# notionApi.env
NOTION_API_KEY=your_notion_integration_token_here
NOTION_CARDIO_DB_ID=your_cardio_database_id
NOTION_DEBT_DB_ID=your_debt_database_id
NOTION_BALANCES_DB_ID=your_balances_database_id
NOTION_BONUSES_DB_ID=your_bonuses_database_id
NOTION_WORKOUTS_DB_ID=your_workouts_database_id
PORT=3000
NODE_ENV=production
```

## 🔧 Container Management

### Check Container Status
```bash
# List running containers
docker ps

# Check container logs
docker logs accountability-coach

# Follow logs in real-time
docker logs -f accountability-coach
```

### Container Health Check
```bash
# Check health status
docker inspect --format='{{.State.Health.Status}}' accountability-coach

# Test API health endpoint
curl http://localhost:3000/health
```

### Stop and Remove Container
```bash
# Stop the container
docker stop accountability-coach

# Remove the container
docker rm accountability-coach

# Remove the image (if needed)
docker rmi yourusername/accountability-coach-api:latest
```

### Update Container
```bash
# Pull latest image
docker pull yourusername/accountability-coach-api:latest

# Stop and remove old container
docker stop accountability-coach
docker rm accountability-coach

# Run new container
docker run -d \
  --name accountability-coach \
  -p 3000:3000 \
  --env-file notionApi.env \
  --restart unless-stopped \
  yourusername/accountability-coach-api:latest
```

## 🏠 Home Assistant Integration

Once the container is running, you can integrate with Home Assistant using REST commands:

```yaml
# configuration.yaml
rest_command:
  log_workout:
    url: "http://YOUR_SERVER_IP:3000/workout/log"
    method: POST
    headers:
      Content-Type: "application/json"
    payload: |
      {
        "type": "{{ type }}",
        "duration": {{ duration }},
        "source": "{{ source | default('Manual Entry') }}"
      }

  assign_punishment:
    url: "http://YOUR_SERVER_IP:3000/cardio/assign"
    method: POST
    headers:
      Content-Type: "application/json"
    payload: |
      {
        "type": "treadmill",
        "minutes": 20,
        "reason": "{{ reason }}"
      }

  get_dashboard:
    url: "http://YOUR_SERVER_IP:3000/dashboard"
    method: GET
```

## 🔍 Troubleshooting

### Container Won't Start
```bash
# Check container logs for errors
docker logs accountability-coach

# Common issues:
# - Missing environment variables
# - Invalid Notion API key
# - Incorrect database IDs
```

### API Not Responding
```bash
# Test if container is running
docker ps

# Test port is exposed
netstat -tulpn | grep :3000

# Test health endpoint
curl http://localhost:3000/health
```

### Environment Variables
```bash
# Check environment variables in running container
docker exec accountability-coach env | grep NOTION
```

## 📊 Monitoring

### Resource Usage
```bash
# Check container resource usage
docker stats accountability-coach

# Check container processes
docker exec accountability-coach ps aux
```

### Logs
```bash
# View recent logs
docker logs --tail 50 accountability-coach

# Save logs to file
docker logs accountability-coach > app.log 2>&1
```

## 🚀 Production Deployment

For production deployment, consider:

1. **Reverse Proxy**: Use nginx or traefik in front of the container
2. **SSL/TLS**: Terminate SSL at the reverse proxy level
3. **Monitoring**: Add monitoring with Prometheus + Grafana
4. **Backup**: Regular backup of Notion data
5. **Secrets Management**: Use Docker secrets or external secret management

### Example with Docker Compose
```yaml
# docker-compose.yml
version: '3.8'
services:
  accountability-coach:
    image: yourusername/accountability-coach-api:latest
    container_name: accountability-coach
    ports:
      - "3000:3000"
    env_file:
      - notionApi.env
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
```

Run with: `docker-compose up -d`

## 📝 Notes

- **Port 3000** is exposed and should be mapped to host
- **Health checks** are built into the container
- **Non-root user** runs the application for security
- **Restart policy** keeps container running after host reboots
- **Environment file** keeps secrets out of command line history