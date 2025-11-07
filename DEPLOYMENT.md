# Deployment Guide

This guide covers deploying the Digi-Pets application in various environments.

## Table of Contents
- [Local Development](#local-development)
- [Docker Deployment](#docker-deployment)
- [Production Deployment](#production-deployment)
- [Cloud Deployment](#cloud-deployment)
- [Mobile App Deployment](#mobile-app-deployment)

## Local Development

### Prerequisites
- Node.js 18+ and npm
- Git

### Setup

1. Clone the repository:
```bash
git clone https://github.com/Gameaday/digi-pets-split.git
cd digi-pets-split
```

2. Install server dependencies:
```bash
cd server
npm install
cp .env.example .env
```

3. Install client dependencies:
```bash
cd ../client
npm install --ignore-scripts
cp .env.example .env
```

4. Start the development servers:

Terminal 1 (Server):
```bash
cd server
npm run dev
```

Terminal 2 (Client):
```bash
cd client
npm run dev
```

5. Access the application:
- Client: http://localhost:5173
- Server API: http://localhost:3000/api

## Docker Deployment

### Using Docker Compose (Recommended)

1. Ensure Docker and Docker Compose are installed

2. Build and start all services:
```bash
docker-compose up --build
```

3. Access the application:
- Client: http://localhost
- Server API: http://localhost:3000/api

4. Stop the services:
```bash
docker-compose down
```

### Individual Container Deployment

#### Server
```bash
cd server
docker build -t digi-pets-server .
docker run -d -p 3000:3000 --name digi-pets-server digi-pets-server
```

#### Client
```bash
cd client
docker build -t digi-pets-client .
docker run -d -p 80:80 --name digi-pets-client digi-pets-client
```

## Production Deployment

### Server Deployment

#### Option 1: PM2 Process Manager

1. Install PM2:
```bash
npm install -g pm2
```

2. Build and start the server:
```bash
cd server
npm run build
pm2 start dist/index.js --name digi-pets-server
pm2 save
pm2 startup
```

#### Option 2: Systemd Service

Create `/etc/systemd/system/digi-pets-server.service`:
```ini
[Unit]
Description=Digi-Pets Server
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/opt/digi-pets-split/server
ExecStart=/usr/bin/node dist/index.js
Restart=on-failure
Environment=NODE_ENV=production
Environment=PORT=3000

[Install]
WantedBy=multi-user.target
```

Enable and start:
```bash
sudo systemctl enable digi-pets-server
sudo systemctl start digi-pets-server
```

### Client Deployment

#### Nginx Configuration

1. Build the client:
```bash
cd client
npm run build
```

2. Configure Nginx (`/etc/nginx/sites-available/digi-pets`):
```nginx
server {
    listen 80;
    server_name yourdomain.com;
    root /var/www/digi-pets/client/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

3. Enable the site:
```bash
sudo ln -s /etc/nginx/sites-available/digi-pets /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

#### SSL with Let's Encrypt

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

## Cloud Deployment

### AWS Deployment

#### Using ECS with ECR

1. Build and push Docker images:
```bash
# Login to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin YOUR_ACCOUNT.dkr.ecr.us-east-1.amazonaws.com

# Build and push server
cd server
docker build -t digi-pets-server .
docker tag digi-pets-server:latest YOUR_ACCOUNT.dkr.ecr.us-east-1.amazonaws.com/digi-pets-server:latest
docker push YOUR_ACCOUNT.dkr.ecr.us-east-1.amazonaws.com/digi-pets-server:latest

# Build and push client
cd ../client
docker build -t digi-pets-client .
docker tag digi-pets-client:latest YOUR_ACCOUNT.dkr.ecr.us-east-1.amazonaws.com/digi-pets-client:latest
docker push YOUR_ACCOUNT.dkr.ecr.us-east-1.amazonaws.com/digi-pets-client:latest
```

2. Create ECS task definitions and services using the AWS Console or CLI

#### Using Elastic Beanstalk

1. Install EB CLI:
```bash
pip install awsebcli
```

2. Initialize and deploy:
```bash
cd server
eb init -p node.js digi-pets-server
eb create digi-pets-server-env
eb deploy
```

### Google Cloud Platform

#### Using Cloud Run

```bash
# Server
cd server
gcloud builds submit --tag gcr.io/PROJECT_ID/digi-pets-server
gcloud run deploy digi-pets-server --image gcr.io/PROJECT_ID/digi-pets-server --platform managed

# Client
cd ../client
gcloud builds submit --tag gcr.io/PROJECT_ID/digi-pets-client
gcloud run deploy digi-pets-client --image gcr.io/PROJECT_ID/digi-pets-client --platform managed
```

### Azure

#### Using Container Instances

```bash
# Create resource group
az group create --name digi-pets-rg --location eastus

# Deploy server
az container create \
  --resource-group digi-pets-rg \
  --name digi-pets-server \
  --image digi-pets-server:latest \
  --dns-name-label digi-pets-server \
  --ports 3000

# Deploy client
az container create \
  --resource-group digi-pets-rg \
  --name digi-pets-client \
  --image digi-pets-client:latest \
  --dns-name-label digi-pets-client \
  --ports 80
```

### Heroku

1. Install Heroku CLI

2. Deploy server:
```bash
cd server
heroku create digi-pets-server
git subtree push --prefix server heroku main
```

3. For the client, you can use Netlify or Vercel (see below)

### Netlify (Client Only)

1. Install Netlify CLI:
```bash
npm install -g netlify-cli
```

2. Deploy:
```bash
cd client
npm run build
netlify deploy --prod --dir=dist
```

Or connect your GitHub repo in the Netlify dashboard:
- Build command: `cd client && npm run build`
- Publish directory: `client/dist`

### Vercel (Client Only)

1. Install Vercel CLI:
```bash
npm install -g vercel
```

2. Deploy:
```bash
cd client
vercel --prod
```

## Mobile App Deployment

### Converting to Mobile Apps with Capacitor

1. Install Capacitor:
```bash
cd client
npm install @capacitor/core @capacitor/cli @capacitor/ios @capacitor/android
```

2. Initialize Capacitor:
```bash
npx cap init
```

3. Build the web app:
```bash
npm run build
```

4. Add platforms:
```bash
npx cap add ios
npx cap add android
```

5. Sync web code to native projects:
```bash
npx cap sync
```

6. Open in native IDE:
```bash
# For iOS
npx cap open ios

# For Android
npx cap open android
```

### iOS App Store Deployment

1. Configure app in Xcode:
   - Set bundle identifier
   - Configure signing certificates
   - Set app icons and launch screens

2. Archive and upload:
   - Product → Archive
   - Upload to App Store Connect
   - Submit for review

### Google Play Store Deployment

1. Configure in Android Studio:
   - Update `app/build.gradle` with version info
   - Configure signing keys
   - Set app icons

2. Generate signed APK/AAB:
   - Build → Generate Signed Bundle/APK
   - Upload to Google Play Console

### Progressive Web App (PWA)

1. Add service worker and manifest:
```bash
npm install vite-plugin-pwa -D
```

2. Update `vite.config.ts`:
```typescript
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Digi-Pets',
        short_name: 'Digi-Pets',
        description: 'Digital Pet Game',
        theme_color: '#667eea',
        icons: [
          {
            src: 'icon-192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'icon-512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ]
})
```

## Environment Variables

### Server Production Variables

Create `.env` file:
```bash
PORT=3000
CORS_ORIGIN=https://yourdomain.com
NODE_ENV=production
```

### Client Production Variables

Create `.env.production`:
```bash
VITE_API_URL=https://api.yourdomain.com/api
```

## Security Checklist

- [ ] Set strong CORS policies in production
- [ ] Enable HTTPS/TLS certificates
- [ ] Use environment variables for secrets
- [ ] Enable rate limiting
- [ ] Add authentication (future feature)
- [ ] Regular security updates
- [ ] Monitor logs for suspicious activity
- [ ] Use a firewall
- [ ] Keep dependencies updated

## Monitoring and Logging

### Server Logging

Add logging middleware:
```bash
npm install winston morgan
```

### Application Monitoring

Recommended tools:
- **New Relic** - Full stack monitoring
- **DataDog** - Infrastructure and APM
- **Sentry** - Error tracking
- **LogRocket** - Session replay

### Health Checks

The server includes a `/health` endpoint. Set up monitoring:
```bash
# Using cron
*/5 * * * * curl -f http://localhost:3000/health || alert
```

## Backup and Disaster Recovery

Currently, the app uses in-memory storage. For production:

1. Add a database (PostgreSQL, MongoDB)
2. Set up regular backups
3. Implement data replication
4. Document recovery procedures

## Scaling

### Horizontal Scaling

Use a load balancer (nginx, HAProxy, AWS ALB) with multiple server instances:

```nginx
upstream digi_pets_servers {
    server server1:3000;
    server server2:3000;
    server server3:3000;
}

server {
    location /api {
        proxy_pass http://digi_pets_servers;
    }
}
```

### Database for Persistence

Replace in-memory storage with a database:
- **PostgreSQL** - Relational data
- **MongoDB** - Document storage
- **Redis** - Caching layer

## Troubleshooting

### Common Issues

**Port already in use:**
```bash
lsof -ti:3000 | xargs kill
```

**Node modules issues:**
```bash
rm -rf node_modules package-lock.json
npm install --ignore-scripts
```

**CORS errors:**
- Check server CORS_ORIGIN environment variable
- Ensure client API_URL matches server location

**Build fails:**
- Verify Node.js version (18+)
- Clear build caches
- Check for TypeScript errors

## Support

For issues and questions:
- GitHub Issues: https://github.com/Gameaday/digi-pets-split/issues
- Documentation: See README.md and API.md
