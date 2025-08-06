#!/bin/bash

# Pathfinders Production Deployment Script for pathfindersgifts.com
# Run this script on your AWS EC2 instance

set -e  # Exit on any error

echo "🚀 Starting Pathfinders Production Deployment for pathfindersgifts.com"

# Configuration
PROJECT_DIR="/home/ubuntu/app"
BACKEND_DIR="$PROJECT_DIR"
FRONTEND_DIR="$PROJECT_DIR/pathfinders-client"
VENV_DIR="$BACKEND_DIR/venv"
DJANGO_DIR="$BACKEND_DIR"
FASTAPI_DIR="$BACKEND_DIR/fastapi_app"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to ensure virtual environment is activated
activate_venv() {
    if [ ! -f "$VENV_DIR/bin/activate" ]; then
        print_error "Virtual environment not found at $VENV_DIR"
        exit 1
    fi
    
    source $VENV_DIR/bin/activate
    
    if [ "$VIRTUAL_ENV" != "$VENV_DIR" ]; then
        print_error "Failed to activate virtual environment"
        exit 1
    fi
    
    print_status "Virtual environment active: $VIRTUAL_ENV"
}

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   print_error "This script should not be run as root for security reasons"
   exit 1
fi

# 1. System Dependencies
print_status "Installing system dependencies..."
sudo apt update
sudo apt install -y python3-pip python3-venv python3-dev nginx supervisor certbot python3-certbot-nginx sqlite3 curl

# Install Node.js 18.x for frontend
print_status "Installing Node.js for frontend..."
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs
node --version
npm --version

# Ensure yarn is not being used
print_status "Ensuring npm is the package manager..."
if command -v yarn &> /dev/null; then
    print_warning "Yarn is installed. Using npm instead..."
    # Uninstall yarn to prevent conflicts
    sudo npm uninstall -g yarn 2>/dev/null || true
fi

# 2. Verify project structure
print_status "Verifying project structure..."

# Check if we're in the right directory
if [ ! -f "$BACKEND_DIR/requirements.txt" ]; then
    print_error "Project structure not found. Make sure you're in /home/ubuntu/app and the repository is cloned."
    print_error "Expected file: $BACKEND_DIR/requirements.txt"
    exit 1
fi

if [ ! -f "$FRONTEND_DIR/package.json" ]; then
    print_error "Frontend not found. Expected file: $FRONTEND_DIR/package.json"
    exit 1
fi

print_status "Project structure verified ✓"

# 3. Create project directory permissions
print_status "Setting up project directory permissions..."
sudo chown -R $USER:$USER $PROJECT_DIR

# 4. Setup Python virtual environment
print_status "Creating Python virtual environment..."
cd $BACKEND_DIR

# Remove existing venv if it exists
if [ -d "$VENV_DIR" ]; then
    print_warning "Removing existing virtual environment..."
    rm -rf $VENV_DIR
fi

# Create new virtual environment
python3 -m venv $VENV_DIR

# Verify venv was created
if [ ! -f "$VENV_DIR/bin/activate" ]; then
    print_error "Failed to create virtual environment"
    exit 1
fi

# Activate virtual environment
activate_venv

# 5. Install Python dependencies
print_status "Installing Python dependencies..."
pip install --upgrade pip
pip install -r requirements.txt

# Verify key packages are installed
python -c "import django; print(f'Django {django.get_version()} installed')"
python -c "import fastapi; print(f'FastAPI installed')"

# 6. Environment configuration
print_status "Setting up environment configuration..."
if [ ! -f "$BACKEND_DIR/.env" ]; then
    print_warning "No .env file found. Creating from template..."
    
    # Generate a secure Django secret key
    DJANGO_SECRET_KEY=$(python3 -c 'from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())' 2>/dev/null || echo "your-secret-key-here")
    
    # Create .env file with environment variables or defaults
    cat > $BACKEND_DIR/.env << EOF
# Django Settings
DEBUG=False
SECRET_KEY=${DJANGO_SECRET_KEY}
ALLOWED_HOSTS=pathfindersgifts.com,www.pathfindersgifts.com,127.0.0.1,localhost,3.98.30.68

# Database - SQLite
DATABASE_URL=sqlite:///db.sqlite3
DATABASE_ENGINE=django.db.backends.sqlite3

# Static Files
STATIC_URL=/static/
STATIC_ROOT=/home/ubuntu/app/staticfiles
MEDIA_URL=/media/
MEDIA_ROOT=/home/ubuntu/app/media

# MTN Mobile Money Configuration
MTN_TARGET_ENVIRONMENT=\${MTN_TARGET_ENVIRONMENT:-sandbox}
MTN_COLLECTION_SUBSCRIPTION_KEY=\${MTN_COLLECTION_SUBSCRIPTION_KEY:-2026432ffc664e909d6ace2e4d4b24b0}
MTN_COLLECTION_PRIMARY_KEY=\${MTN_COLLECTION_PRIMARY_KEY:-2026432ffc664e909d6ace2e4d4b24b0}
MTN_COLLECTION_SECONDARY_KEY=\${MTN_COLLECTION_SECONDARY_KEY:-e3e05b43c2e04540a969390346beb2a0}
MTN_CALLBACK_URL=\${MTN_CALLBACK_URL:-https://pathfindersgifts.com/api/core/mtn-webhook/}
MTN_CURRENCY=\${MTN_CURRENCY:-GHS}
MTN_MERCHANT_NUMBER=\${MTN_MERCHANT_NUMBER:-233536888387}

# Stripe Configuration
STRIPE_PUBLISHABLE_KEY=\${STRIPE_PUBLISHABLE_KEY:-pk_test_your_publishable_key}
STRIPE_SECRET_KEY=\${STRIPE_SECRET_KEY:-sk_test_your_secret_key}
STRIPE_WEBHOOK_SECRET=\${STRIPE_WEBHOOK_SECRET:-whsec_your_webhook_secret}

# FastAPI Configuration
FASTAPI_HOST=127.0.0.1
FASTAPI_PORT=8001
EOF
    
    print_warning "Environment file created. Please review and update with your actual production values!"
    print_warning "You can set environment variables before running this script to auto-populate values."
    read -p "Press enter when you've updated the .env file..."
fi

# 7. Setup SQLite database directory with proper permissions
print_status "Setting up SQLite database..."
mkdir -p $DJANGO_DIR/data
sudo chown $USER:www-data $DJANGO_DIR/data
sudo chmod 775 $DJANGO_DIR/data

# 8. Django setup
print_status "Running Django migrations and setup..."
cd $DJANGO_DIR

# Ensure virtual environment is still activated
activate_venv

# Clear Django cache and old static files
print_status "Clearing Django cache and static files..."
rm -rf staticfiles
rm -rf __pycache__
find . -name "*.pyc" -delete
find . -name "__pycache__" -type d -exec rm -rf {} + 2>/dev/null || true

# Set Django settings module and verify Django can be imported
export DJANGO_SETTINGS_MODULE="pathfinders_project.settings"
python -c "import django; django.setup()" || {
    print_error "Django setup failed - virtual environment issue"
    exit 1
}

# Set Django settings and run Django commands
export DJANGO_SETTINGS_MODULE="pathfinders_project.settings"
export ENVIRONMENT="production"
export DEBUG="False"

# Update Django settings for production
python manage.py collectstatic --noinput --clear
python manage.py migrate

# Create a production settings override
cat > $DJANGO_DIR/production_settings.py << 'EOF'
# Production settings override
import os
from pathlib import Path

# Ensure production settings
os.environ.setdefault('ENVIRONMENT', 'production')
os.environ.setdefault('DEBUG', 'False')

# Update CORS settings for production - support both HTTP and HTTPS during setup
CORS_ALLOWED_ORIGINS = [
    "http://pathfindersgifts.com",
    "http://www.pathfindersgifts.com",
    "https://pathfindersgifts.com",
    "https://www.pathfindersgifts.com",
    "http://3.98.30.68",
    "https://3.98.30.68",
]

# Ensure CSRF settings are correct - support both HTTP and HTTPS during setup
CSRF_TRUSTED_ORIGINS = [
    "http://pathfindersgifts.com",
    "http://www.pathfindersgifts.com",
    "https://pathfindersgifts.com",
    "https://www.pathfindersgifts.com",
    "http://3.98.30.68",
    "https://3.98.30.68",
]

# Disable SSL redirect during initial setup
SECURE_SSL_REDIRECT = False
SECURE_HSTS_SECONDS = 0
SECURE_HSTS_INCLUDE_SUBDOMAINS = False
SECURE_HSTS_PRELOAD = False

# Cookie settings for HTTP during initial setup
CSRF_COOKIE_SECURE = False
SESSION_COOKIE_SECURE = False
EOF

# Set proper permissions for SQLite database
if [ -f "$DJANGO_DIR/db.sqlite3" ]; then
    sudo chown $USER:www-data $DJANGO_DIR/db.sqlite3
    sudo chmod 664 $DJANGO_DIR/db.sqlite3
fi

# 9. Create Django superuser (if needed)
print_status "Creating Django superuser (if needed)..."

# Ensure virtual environment is activated
activate_venv

# Set Django settings module
export DJANGO_SETTINGS_MODULE="pathfinders_project.settings"

python manage.py shell << EOF
from django.contrib.auth import get_user_model
User = get_user_model()
if not User.objects.filter(username='admin').exists():
    User.objects.create_superuser('admin', 'admin@pathfindersgifts.com', 'change-this-password')
    print("Superuser 'admin' created")
else:
    print("Superuser already exists")
EOF

# 9.1. Frontend Build and Deployment
print_status "Building and deploying frontend..."
cd $FRONTEND_DIR

# Clear existing cache and builds
print_status "Clearing frontend cache and old builds..."
rm -rf .next
rm -rf node_modules/.cache
rm -f yarn.lock yarn-error.log
rm -rf .yarn .yarnrc .yarnrc.yml
npm cache clean 2>/dev/null || rm -rf ~/.npm/_cacache 2>/dev/null || true

# Clear any existing deployment files
sudo rm -rf /var/www/html/pathfinders
sudo mkdir -p /var/www/html/pathfinders
sudo chown $USER:www-data /var/www/html/pathfinders

# Ensure we're using npm and not yarn
print_status "Ensuring npm package manager..."
unset YARN_CACHE_FOLDER
unset YARN_IGNORE_PATH
export npm_config_package_manager=npm

# Create production environment file
if [ ! -f "$FRONTEND_DIR/.env.production" ]; then
    print_status "Creating frontend production environment file..."
    cat > $FRONTEND_DIR/.env.production << EOF
NEXT_PUBLIC_API_URL=https://pathfindersgifts.com
NODE_ENV=production
# Ensure npm is used
npm_config_package_manager=npm
EOF
fi

# Install frontend dependencies (fresh install)
print_status "Installing frontend dependencies (fresh install)..."
rm -rf node_modules
rm -f yarn.lock yarn-error.log

# Verify npm is being used
print_status "Verifying npm installation..."
npm --version
which npm

npm install --legacy-peer-deps

# Build the frontend
print_status "Building frontend for production..."
# Ensure we're using npm explicitly
export npm_config_package_manager=npm
npm run build

# Clear and recreate directory for built frontend
print_status "Preparing frontend deployment directory..."
sudo rm -rf /var/www/html/pathfinders
sudo mkdir -p /var/www/html/pathfinders
sudo chown $USER:www-data /var/www/html/pathfinders

# Copy built files to web directory
print_status "Deploying frontend files..."
sudo cp -r $FRONTEND_DIR/.next/standalone/* /var/www/html/pathfinders/
sudo cp -r $FRONTEND_DIR/.next/standalone/.next /var/www/html/pathfinders/
sudo cp -r $FRONTEND_DIR/.next/static /var/www/html/pathfinders/.next/
sudo cp -r $FRONTEND_DIR/public /var/www/html/pathfinders/

# Set proper permissions
sudo chown -R $USER:www-data /var/www/html/pathfinders
sudo chmod -R 755 /var/www/html/pathfinders

print_status "Frontend build and deployment completed ✓"

# 10. Nginx configuration - Simple working configuration
print_status "Configuring Nginx with simple working configuration..."

# Clear existing nginx configurations and cache
print_status "Clearing existing nginx configurations and cache..."
sudo rm -f /etc/nginx/sites-enabled/default
sudo rm -f /etc/nginx/sites-enabled/pathfindersgifts.com
sudo rm -f /etc/nginx/sites-available/pathfindersgifts.com
sudo rm -rf /var/cache/nginx/*
sudo rm -rf /var/log/nginx/*.log
sudo systemctl stop nginx 2>/dev/null || true

# Clear any existing SSL configurations that might conflict
sudo rm -f /etc/nginx/sites-available/pathfindersgifts.com-ssl
sudo rm -f /etc/nginx/sites-enabled/pathfindersgifts.com-ssl

# Create simple HTTP-only configuration that works
sudo tee /etc/nginx/sites-available/pathfindersgifts.com > /dev/null << 'EOF'
# HTTP-only configuration for initial setup
server {
    listen 80;
    server_name pathfindersgifts.com www.pathfindersgifts.com 3.98.30.68;

    # CORS headers for API endpoints
    location ~ ^/(api|fastapi)/ {
        add_header Access-Control-Allow-Origin "http://pathfindersgifts.com" always;
        add_header Access-Control-Allow-Methods "GET, POST, PUT, PATCH, DELETE, OPTIONS" always;
        add_header Access-Control-Allow-Headers "accept, accept-encoding, authorization, content-type, dnt, origin, user-agent, x-csrftoken, x-requested-with" always;
        add_header Access-Control-Allow-Credentials "true" always;
        
        # Handle preflight requests
        if ($request_method = OPTIONS) {
            add_header Access-Control-Allow-Origin "http://pathfindersgifts.com" always;
            add_header Access-Control-Allow-Methods "GET, POST, PUT, PATCH, DELETE, OPTIONS" always;
            add_header Access-Control-Allow-Headers "accept, accept-encoding, authorization, content-type, dnt, origin, user-agent, x-csrftoken, x-requested-with" always;
            add_header Access-Control-Allow-Credentials "true" always;
            add_header Access-Control-Max-Age 1728000;
            add_header Content-Type "text/plain; charset=utf-8";
            add_header Content-Length 0;
            return 204;
        }
    }

    # Common proxy settings
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header X-Forwarded-Host $host;
    proxy_set_header X-Forwarded-Server $host;
    proxy_redirect off;
    proxy_read_timeout 300;
    proxy_connect_timeout 300;
    proxy_send_timeout 300;
    
    # Health checks - Django health endpoint (most specific first)
    location = /health {
        proxy_pass http://127.0.0.1:8000/health/;
    }
    
    location = /health/ {
        proxy_pass http://127.0.0.1:8000/health/;
    }
    
    # API health endpoint
    location = /api/health/ {
        proxy_pass http://127.0.0.1:8000/api/health/;
    }
    
    # CSRF endpoint - CRITICAL: Route /api/csrf/ to Django's /api/auth/csrf/
    location = /api/csrf/ {
        proxy_pass http://127.0.0.1:8000/api/auth/csrf/;
    }
    
    # FastAPI specific endpoints (most specific first)
    location /api/fastapi/health/ {
        rewrite ^/api/fastapi/(.*) /$1 break;
        proxy_pass http://127.0.0.1:8001/;
        proxy_read_timeout 300;
        proxy_connect_timeout 300;
        proxy_send_timeout 300;
    }
    
    location /api/fastapi/calculate-gifts/ {
        rewrite ^/api/fastapi/(.*) /$1 break;
        proxy_pass http://127.0.0.1:8001/;
        proxy_read_timeout 300;
        proxy_connect_timeout 300;
        proxy_send_timeout 300;
    }
    
    location /api/fastapi/progress/ {
        rewrite ^/api/fastapi/(.*) /$1 break;
        proxy_pass http://127.0.0.1:8001/;
        proxy_read_timeout 300;
        proxy_connect_timeout 300;
        proxy_send_timeout 300;
    }
    
    # FastAPI general routes (frontend expects /api/fastapi/ path)
    location /api/fastapi/ {
        rewrite ^/api/fastapi/(.*) /$1 break;
        proxy_pass http://127.0.0.1:8001/;
        proxy_read_timeout 300;
        proxy_connect_timeout 300;
        proxy_send_timeout 300;
    }
    
    # Django API routes (general catch-all for /api/ - MUST be after specific routes)
    location /api/ {
        proxy_pass http://127.0.0.1:8000/api/;
    }
    
    # Admin panel
    location /admin/ {
        proxy_pass http://127.0.0.1:8000/admin/;
    }
    
    # Static and media files
    location /static/ {
        proxy_pass http://127.0.0.1:8000/static/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    location /media/ {
        proxy_pass http://127.0.0.1:8000/media/;
        expires 1y;
        add_header Cache-Control "public";
    }
    
    # Frontend - Next.js (MUST be last)
    location / {
        proxy_pass http://127.0.0.1:3000/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

# Enable the site and test configuration
sudo ln -sf /etc/nginx/sites-available/pathfindersgifts.com /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Test nginx configuration
if ! sudo nginx -t; then
    print_error "Nginx configuration test failed"
    exit 1
fi

# Clear nginx cache and restart
print_status "Clearing nginx cache and restarting..."
sudo rm -rf /var/cache/nginx/*
sudo systemctl stop nginx 2>/dev/null || true
sudo systemctl start nginx
sudo systemctl enable nginx
sudo systemctl reload nginx

# Verify nginx is running
sleep 3
if sudo systemctl is-active --quiet nginx; then
    print_status "✅ Nginx is running and enabled"
else
    print_error "❌ Nginx failed to start"
    sudo systemctl status nginx
    exit 1
fi

print_status "Nginx configuration completed ✓"

# Create a simple error page
sudo mkdir -p /var/www/html
sudo tee /var/www/html/50x.html > /dev/null << 'EOF'
<!DOCTYPE html>
<html>
<head>
    <title>Pathfinders - Service Temporarily Unavailable</title>
    <style>
        body { font-family: Arial, sans-serif; text-align: center; margin-top: 100px; }
        h1 { color: #333; }
        p { color: #666; }
    </style>
</head>
<body>
    <h1>Service Temporarily Unavailable</h1>
    <p>Pathfinders services are starting up. Please try again in a moment.</p>
    <p>If this problem persists, please contact support.</p>
</body>
</html>
EOF

# Start nginx with initial configuration
sudo systemctl reload nginx

# 11. Supervisor configuration for services
print_status "Configuring Supervisor for service management..."

# Django/Gunicorn configuration
sudo tee /etc/supervisor/conf.d/pathfinders-django.conf > /dev/null << EOF
[program:pathfinders-django]
command=$VENV_DIR/bin/gunicorn --workers 3 --bind 127.0.0.1:8000 --timeout 300 pathfinders_project.wsgi:application
directory=$DJANGO_DIR
user=$USER
autostart=true
autorestart=true
redirect_stderr=true
stdout_logfile=/var/log/pathfinders-django.log
environment=ENVIRONMENT="production",DJANGO_SETTINGS_MODULE="pathfinders_project.settings",DEBUG="False"
EOF

# FastAPI configuration
sudo tee /etc/supervisor/conf.d/pathfinders-fastapi.conf > /dev/null << EOF
[program:pathfinders-fastapi]
command=$VENV_DIR/bin/uvicorn fastapi_app.main:app --host 127.0.0.1 --port 8001 --workers 1
directory=$BACKEND_DIR
user=$USER
autostart=true
autorestart=true
redirect_stderr=true
stdout_logfile=/var/log/pathfinders-fastapi.log
environment=ENVIRONMENT="production",DJANGO_API_URL="https://pathfindersgifts.com"
EOF

# Next.js frontend configuration
sudo tee /etc/supervisor/conf.d/pathfinders-frontend.conf > /dev/null << EOF
[program:pathfinders-frontend]
command=/usr/bin/node server.js
directory=/var/www/html/pathfinders
user=$USER
autostart=true
autorestart=true
redirect_stderr=true
stdout_logfile=/var/log/pathfinders-frontend.log
environment=NODE_ENV="production",PORT="3000"
EOF

# 12. SSL Certificate with Let's Encrypt
print_status "Setting up SSL certificate with Let's Encrypt..."

# First, ensure nginx is running with HTTP config for Let's Encrypt challenge
print_status "Testing HTTP configuration before SSL..."
curl -I http://pathfindersgifts.com/ || print_warning "HTTP test failed - continuing with SSL setup"

# Get SSL certificate - let certbot modify nginx configuration automatically
print_status "Obtaining SSL certificate from Let's Encrypt..."
sudo certbot --nginx -d pathfindersgifts.com -d www.pathfindersgifts.com --non-interactive --agree-tos --email vineralse@gmail.com || {
    print_warning "SSL certificate installation failed - continuing with HTTP-only configuration"
    print_warning "You can manually run: sudo certbot --nginx -d pathfindersgifts.com -d www.pathfindersgifts.com"
}

# Verify SSL certificate was installed
if [ -f "/etc/letsencrypt/live/pathfindersgifts.com/fullchain.pem" ]; then
    print_status "SSL certificate installed successfully ✓"
    
    # Certbot may have overwritten our custom routes - restore them
    print_status "Restoring custom nginx configuration after SSL setup..."
    
    # Check if certbot created a backup
    if [ -f "/etc/nginx/sites-enabled/pathfindersgifts.com.backup" ]; then
        print_status "Found certbot backup, restoring our custom configuration..."
        
        # Create a complete HTTPS configuration with our custom routes
        sudo tee /etc/nginx/sites-available/pathfindersgifts.com > /dev/null << 'EOFSSL'
# HTTPS configuration with SSL
server {
    listen 80;
    server_name pathfindersgifts.com www.pathfindersgifts.com 3.98.30.68;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name pathfindersgifts.com www.pathfindersgifts.com 3.98.30.68;

    ssl_certificate /etc/letsencrypt/live/pathfindersgifts.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/pathfindersgifts.com/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    # Security headers
    add_header X-Frame-Options DENY always;
    add_header X-Content-Type-Options nosniff always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # CORS headers for API endpoints
    location ~ ^/(api|fastapi)/ {
        add_header Access-Control-Allow-Origin "https://pathfindersgifts.com" always;
        add_header Access-Control-Allow-Methods "GET, POST, PUT, PATCH, DELETE, OPTIONS" always;
        add_header Access-Control-Allow-Headers "accept, accept-encoding, authorization, content-type, dnt, origin, user-agent, x-csrftoken, x-requested-with" always;
        add_header Access-Control-Allow-Credentials "true" always;
        
        # Handle preflight requests
        if ($request_method = OPTIONS) {
            add_header Access-Control-Allow-Origin "https://pathfindersgifts.com" always;
            add_header Access-Control-Allow-Methods "GET, POST, PUT, PATCH, DELETE, OPTIONS" always;
            add_header Access-Control-Allow-Headers "accept, accept-encoding, authorization, content-type, dnt, origin, user-agent, x-csrftoken, x-requested-with" always;
            add_header Access-Control-Allow-Credentials "true" always;
            add_header Access-Control-Max-Age 1728000;
            add_header Content-Type "text/plain; charset=utf-8";
            add_header Content-Length 0;
            return 204;
        }
    }

    # Common proxy settings
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header X-Forwarded-Host $host;
    proxy_set_header X-Forwarded-Server $host;
    proxy_redirect off;
    proxy_read_timeout 300;
    proxy_connect_timeout 300;
    proxy_send_timeout 300;
    
    # Health checks - Django health endpoint (most specific first)
    location = /health {
        proxy_pass http://127.0.0.1:8000/health/;
    }
    
    location = /health/ {
        proxy_pass http://127.0.0.1:8000/health/;
    }
    
    # API health endpoint
    location = /api/health/ {
        proxy_pass http://127.0.0.1:8000/api/health/;
    }
    
    # CSRF endpoint - CRITICAL: Route /api/csrf/ to Django's /api/auth/csrf/
    location = /api/csrf/ {
        proxy_pass http://127.0.0.1:8000/api/auth/csrf/;
    }
    
    # FastAPI specific endpoints (most specific first)
    location /api/fastapi/health/ {
        rewrite ^/api/fastapi/(.*) /$1 break;
        proxy_pass http://127.0.0.1:8001/;
        proxy_read_timeout 300;
        proxy_connect_timeout 300;
        proxy_send_timeout 300;
    }
    
    location /api/fastapi/calculate-gifts/ {
        rewrite ^/api/fastapi/(.*) /$1 break;
        proxy_pass http://127.0.0.1:8001/;
        proxy_read_timeout 300;
        proxy_connect_timeout 300;
        proxy_send_timeout 300;
    }
    
    location /api/fastapi/progress/ {
        rewrite ^/api/fastapi/(.*) /$1 break;
        proxy_pass http://127.0.0.1:8001/;
        proxy_read_timeout 300;
        proxy_connect_timeout 300;
        proxy_send_timeout 300;
    }
    
    # FastAPI general routes (frontend expects /api/fastapi/ path)
    location /api/fastapi/ {
        rewrite ^/api/fastapi/(.*) /$1 break;
        proxy_pass http://127.0.0.1:8001/;
        proxy_read_timeout 300;
        proxy_connect_timeout 300;
        proxy_send_timeout 300;
    }
    
    # Django API routes (general catch-all for /api/ - MUST be after specific routes)
    location /api/ {
        proxy_pass http://127.0.0.1:8000/api/;
    }
    
    # Admin panel
    location /admin/ {
        proxy_pass http://127.0.0.1:8000/admin/;
    }
    
    # Static and media files
    location /static/ {
        proxy_pass http://127.0.0.1:8000/static/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    location /media/ {
        proxy_pass http://127.0.0.1:8000/media/;
        expires 1y;
        add_header Cache-Control "public";
    }
    
    # Frontend - Next.js (MUST be last)
    location / {
        proxy_pass http://127.0.0.1:3000/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_cache_bypass $http_upgrade;
    }
}
EOFSSL

        # Remove the backup and enable our custom configuration
        sudo rm -f /etc/nginx/sites-enabled/pathfindersgifts.com.backup
        sudo ln -sf /etc/nginx/sites-available/pathfindersgifts.com /etc/nginx/sites-enabled/
    fi
    
    # Test configuration and reload
    sudo nginx -t && sudo systemctl reload nginx
    print_status "HTTPS configuration with custom routes activated ✓"
else
    print_warning "SSL certificate not found - continuing with HTTP-only configuration"
    print_warning "You can manually obtain SSL certificate later with:"
    print_warning "sudo certbot --nginx -d pathfindersgifts.com -d www.pathfindersgifts.com"
fi

# 13. Start services
print_status "Starting services..."
sudo supervisorctl reread
sudo supervisorctl update
sudo supervisorctl start all
sudo systemctl enable nginx supervisor
sudo systemctl start nginx supervisor

# Clear nginx cache
print_status "Clearing nginx cache..."
sudo systemctl reload nginx
# Clear any nginx proxy cache if configured
sudo rm -rf /var/cache/nginx/* 2>/dev/null || true

# 14. Firewall configuration
print_status "Configuring firewall..."
sudo ufw allow 'Nginx Full'
sudo ufw allow ssh
sudo ufw --force enable

# 15. Setup automatic SSL renewal
print_status "Setting up automatic SSL certificate renewal..."
echo "0 12 * * * /usr/bin/certbot renew --quiet" | sudo crontab -

# 16. Create backup script for SQLite database
print_status "Setting up database backup..."
sudo tee /usr/local/bin/pathfinders-backup.sh > /dev/null << EOF
#!/bin/bash
BACKUP_DIR="/var/backups/pathfinders"
DATE=\$(date +%Y%m%d_%H%M%S)
mkdir -p \$BACKUP_DIR
sqlite3 $DJANGO_DIR/db.sqlite3 ".backup \$BACKUP_DIR/pathfinders_backup_\$DATE.sqlite3"
# Keep only last 7 days of backups
find \$BACKUP_DIR -name "pathfinders_backup_*.sqlite3" -mtime +7 -delete
EOF

sudo chmod +x /usr/local/bin/pathfinders-backup.sh

# Setup daily backup
echo "0 2 * * * /usr/local/bin/pathfinders-backup.sh" | sudo crontab -

print_status "✅ Pathfinders Production Deployment Complete!"
print_status "Your Pathfinders application is now running at https://pathfindersgifts.com"
print_status ""
print_status "Services deployed:"
print_status "- Frontend (Next.js): https://pathfindersgifts.com → port 3000"
print_status "- Backend (Django): https://pathfindersgifts.com/api/, /admin/ → port 8000"
print_status "- API (FastAPI): https://pathfindersgifts.com/fastapi/ → port 8001"
print_status ""
print_status "Next steps:"
print_status "1. Update backend/.env with actual production values"
print_status "2. Update frontend/.env.production if needed"
print_status "3. Change default superuser password: python manage.py changepassword admin"
print_status "4. Test the deployment: curl -k https://pathfindersgifts.com"
print_status "5. Monitor logs: sudo tail -f /var/log/pathfinders-*.log"
print_status ""
print_status "Service management commands:"
print_status "- sudo supervisorctl status"
print_status "- sudo supervisorctl restart pathfinders-frontend"
print_status "- sudo supervisorctl restart pathfinders-django"
print_status "- sudo supervisorctl restart pathfinders-fastapi"
print_status "- sudo systemctl reload nginx"
print_status ""
print_status "Database backup:"
print_status "- Manual backup: /usr/local/bin/pathfinders-backup.sh"
print_status "- Backups location: /var/backups/pathfinders/"

# 17. Test and verify deployment
print_status "Testing deployment..."

# Wait for services to start
sleep 10

# Test services directly
print_status "Testing services directly..."

# Test Django
if curl -s http://127.0.0.1:8000/health/ > /dev/null; then
    print_status "✅ Django is responding on port 8000"
else
    print_warning "⚠️  Django not responding on port 8000"
fi

# Test FastAPI
if curl -s http://127.0.0.1:8001/health/ > /dev/null; then
    print_status "✅ FastAPI is responding on port 8001"
else
    print_warning "⚠️  FastAPI not responding on port 8001"
fi

# Test Next.js
if curl -s http://127.0.0.1:3000/ > /dev/null; then
    print_status "✅ Next.js is responding on port 3000"
else
    print_warning "⚠️  Next.js not responding on port 3000"
fi

# Test nginx routing
print_status "Testing nginx routing..."

# Check if nginx is running
print_status "Checking nginx status..."
if sudo systemctl is-active --quiet nginx; then
    print_status "✅ Nginx is running"
else
    print_warning "⚠️  Nginx is not running - starting it..."
    sudo systemctl start nginx
    sleep 2
fi

# Check nginx configuration
print_status "Testing nginx configuration..."
if sudo nginx -t; then
    print_status "✅ Nginx configuration is valid"
else
    print_error "❌ Nginx configuration is invalid"
    sudo nginx -t
    exit 1
fi

# Test local nginx routing first
print_status "Testing local nginx routing..."
if curl -s -I http://127.0.0.1/api/ | grep -q "200\|302\|403"; then
    print_status "✅ Django API accessible through local nginx"
else
    print_warning "⚠️  Django API not accessible through local nginx"
    print_status "Debug info:"
    curl -v http://127.0.0.1/api/ 2>&1 | head -20
fi

if curl -s -I http://127.0.0.1/fastapi/health | grep -q "200\|502"; then
    print_status "✅ FastAPI accessible through local nginx"
else
    print_warning "⚠️  FastAPI not accessible through local nginx"
    print_status "Debug info:"
    curl -v http://127.0.0.1/fastapi/health 2>&1 | head -20
fi

# Test external nginx routing
print_status "Testing external nginx routing..."

# Test Django API through nginx
if curl -s -I https://pathfindersgifts.com/api/ | grep -q "200\|302\|403"; then
    print_status "✅ Django API accessible through nginx"
else
    print_warning "⚠️  Django API not accessible through nginx"
    print_status "Trying HTTP instead of HTTPS..."
    if curl -s -I http://pathfindersgifts.com/api/ | grep -q "200\|302\|403"; then
        print_status "✅ Django API accessible through HTTP nginx"
    else
        print_warning "⚠️  Django API not accessible through HTTP nginx"
    fi
fi

# Test FastAPI through nginx
if curl -s -I https://pathfindersgifts.com/fastapi/health | grep -q "200\|502"; then
    print_status "✅ FastAPI health check accessible through nginx"
else
    print_warning "⚠️  FastAPI not accessible through nginx"
    print_status "Trying HTTP instead of HTTPS..."
    if curl -s -I http://pathfindersgifts.com/fastapi/health | grep -q "200\|502"; then
        print_status "✅ FastAPI accessible through HTTP nginx"
    else
        print_warning "⚠️  FastAPI not accessible through HTTP nginx"
    fi
fi

print_status ""
print_status "🔧 Troubleshooting commands:"
print_status "- Check service status: sudo supervisorctl status"
print_status "- View Django logs: sudo tail -f /var/log/pathfinders-django.log"
print_status "- View FastAPI logs: sudo tail -f /var/log/pathfinders-fastapi.log"
print_status "- View nginx logs: sudo tail -f /var/log/nginx/error.log"
print_status "- Test nginx config: sudo nginx -t"
print_status "- Restart services: sudo supervisorctl restart all"
print_status "- Reload nginx: sudo systemctl reload nginx" 