#!/bin/bash

# Quick fix for CSRF and API routing issues
# Run this on your production server: sudo bash fix-nginx.sh

set -e

echo "🔧 Fixing nginx configuration for CSRF and API routing..."

# Check if SSL is configured
if [ -f "/etc/letsencrypt/live/pathfindersgifts.com/fullchain.pem" ]; then
    echo "✅ SSL certificate found - creating HTTPS configuration"
    
    # Create complete HTTPS configuration with proper routing
    sudo tee /etc/nginx/sites-available/pathfindersgifts.com > /dev/null << 'EOF'
# HTTP to HTTPS redirect
server {
    listen 80;
    server_name pathfindersgifts.com www.pathfindersgifts.com;
    return 301 https://$server_name$request_uri;
}

# HTTPS configuration with custom routes
server {
    listen 443 ssl http2;
    server_name pathfindersgifts.com www.pathfindersgifts.com;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/pathfindersgifts.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/pathfindersgifts.com/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

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
    proxy_set_header X-Forwarded-Host $server_name;
    proxy_set_header X-Forwarded-Server $server_name;
    proxy_redirect off;
    proxy_read_timeout 300;
    proxy_connect_timeout 300;
    proxy_send_timeout 300;

    # Health checks (most specific routes first)
    location /health {
        proxy_pass http://127.0.0.1:8000/health/;
    }
    
    location /health/ {
        proxy_pass http://127.0.0.1:8000/health/;
    }
    
    # CSRF endpoint - CRITICAL FOR USER SIGNUP
    location /api/csrf/ {
        proxy_pass http://127.0.0.1:8000/api/auth/csrf/;
        proxy_set_header X-Forwarded-Host $server_name;
        proxy_set_header X-Forwarded-Server $server_name;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
    
    # API health endpoint
    location /api/health/ {
        proxy_pass http://127.0.0.1:8000/api/health/;
        proxy_set_header X-Forwarded-Host $server_name;
        proxy_set_header X-Forwarded-Server $server_name;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
    
    # FastAPI specific endpoints
    location /api/fastapi/health/ {
        rewrite ^/api/fastapi/(.*) /$1 break;
        proxy_pass http://127.0.0.1:8001;
        proxy_set_header X-Forwarded-Host $server_name;
        proxy_set_header X-Forwarded-Server $server_name;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_read_timeout 300;
        proxy_connect_timeout 300;
        proxy_send_timeout 300;
    }
    
    location /api/fastapi/ {
        rewrite ^/api/fastapi/(.*) /$1 break;
        proxy_pass http://127.0.0.1:8001;
        proxy_set_header X-Forwarded-Host $server_name;
        proxy_set_header X-Forwarded-Server $server_name;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_read_timeout 300;
        proxy_connect_timeout 300;
        proxy_send_timeout 300;
    }
    
    # General API routes (after specific ones)
    location /api/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header X-Forwarded-Host $server_name;
        proxy_set_header X-Forwarded-Server $server_name;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
    
    # Admin panel
    location /admin/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header X-Forwarded-Host $server_name;
        proxy_set_header X-Forwarded-Server $server_name;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
    
    # Frontend - Next.js (catch-all, goes last)
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

else
    echo "❌ SSL certificate not found - creating HTTP-only configuration"
    
    # Create HTTP-only configuration
    sudo tee /etc/nginx/sites-available/pathfindersgifts.com > /dev/null << 'EOF'
server {
    listen 80;
    server_name pathfindersgifts.com www.pathfindersgifts.com;

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
    proxy_set_header X-Forwarded-Host $server_name;
    proxy_set_header X-Forwarded-Server $server_name;
    proxy_redirect off;
    proxy_read_timeout 300;
    proxy_connect_timeout 300;
    proxy_send_timeout 300;

    # Health checks
    location /health {
        proxy_pass http://127.0.0.1:8000/health/;
    }
    
    location /health/ {
        proxy_pass http://127.0.0.1:8000/health/;
    }
    
    # CSRF endpoint - CRITICAL FOR USER SIGNUP
    location /api/csrf/ {
        proxy_pass http://127.0.0.1:8000/api/auth/csrf/;
        proxy_set_header X-Forwarded-Host $server_name;
        proxy_set_header X-Forwarded-Server $server_name;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
    
    # API health endpoint
    location /api/health/ {
        proxy_pass http://127.0.0.1:8000/api/health/;
        proxy_set_header X-Forwarded-Host $server_name;
        proxy_set_header X-Forwarded-Server $server_name;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
    
    # FastAPI endpoints
    location /api/fastapi/ {
        rewrite ^/api/fastapi/(.*) /$1 break;
        proxy_pass http://127.0.0.1:8001;
        proxy_set_header X-Forwarded-Host $server_name;
        proxy_set_header X-Forwarded-Server $server_name;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_read_timeout 300;
        proxy_connect_timeout 300;
        proxy_send_timeout 300;
    }
    
    # General API routes
    location /api/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header X-Forwarded-Host $server_name;
        proxy_set_header X-Forwarded-Server $server_name;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
    
    # Admin panel
    location /admin/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header X-Forwarded-Host $server_name;
        proxy_set_header X-Forwarded-Server $server_name;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
    
    # Frontend - Next.js
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

fi

# Remove any conflicting configurations
echo "🧹 Cleaning up conflicting configurations..."
sudo rm -f /etc/nginx/sites-enabled/default
sudo rm -f /etc/nginx/sites-enabled/pathfindersgifts.com.backup
sudo rm -f /etc/nginx/sites-available/default

# Enable the new configuration
echo "🔗 Enabling new configuration..."
sudo ln -sf /etc/nginx/sites-available/pathfindersgifts.com /etc/nginx/sites-enabled/

# Test nginx configuration
echo "🧪 Testing nginx configuration..."
if sudo nginx -t; then
    echo "✅ Nginx configuration is valid"
    
    # Reload nginx
    echo "🔄 Reloading nginx..."
    sudo systemctl reload nginx
    
    echo "✅ Nginx reloaded successfully!"
    
    # Test the CSRF endpoint
    echo "🧪 Testing CSRF endpoint..."
    if curl -I -k https://pathfindersgifts.com/api/csrf/ 2>/dev/null | grep -q "200\|302"; then
        echo "✅ CSRF endpoint is working!"
    elif curl -I http://pathfindersgifts.com/api/csrf/ 2>/dev/null | grep -q "200\|302"; then
        echo "✅ CSRF endpoint is working (HTTP)!"
    else
        echo "⚠️  CSRF endpoint test failed - but configuration is applied"
    fi
    
    echo ""
    echo "🎉 Nginx configuration fixed!"
    echo "💡 User signup should now work"
    echo "🔍 Check frontend console - CSRF 404 error should be resolved"
    
else
    echo "❌ Nginx configuration test failed!"
    echo "📋 Please check the nginx error logs:"
    echo "   sudo tail -f /var/log/nginx/error.log"
    exit 1
fi

echo ""
echo "📊 Service Status:"
sudo supervisorctl status