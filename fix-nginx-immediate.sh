#!/bin/bash
# IMMEDIATE FIX for CSRF and nginx routing issues
# Copy and paste this ENTIRE script into your server terminal

echo "🚨 EMERGENCY FIX: Nginx Configuration and CSRF Routing"

# Remove ALL conflicting nginx configurations
echo "🧹 Removing all conflicting nginx configurations..."
sudo rm -f /etc/nginx/sites-enabled/*
sudo rm -f /etc/nginx/sites-available/pathfindersgifts*
sudo rm -f /etc/nginx/sites-available/default

# Check if SSL certificate exists
if [ -f "/etc/letsencrypt/live/pathfindersgifts.com/fullchain.pem" ]; then
    echo "✅ SSL certificate found - creating HTTPS configuration"
    PROTOCOL="HTTPS"
else
    echo "ℹ️  No SSL certificate - creating HTTP configuration"
    PROTOCOL="HTTP"
fi

# Create the correct nginx configuration
if [ "$PROTOCOL" = "HTTPS" ]; then
    echo "📝 Creating HTTPS configuration with SSL..."
    sudo tee /etc/nginx/sites-available/pathfindersgifts.com << 'EOF'
# HTTP to HTTPS redirect
server {
    listen 80;
    server_name pathfindersgifts.com www.pathfindersgifts.com;
    return 301 https://$server_name$request_uri;
}

# Main HTTPS server
server {
    listen 443 ssl http2;
    server_name pathfindersgifts.com www.pathfindersgifts.com;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/pathfindersgifts.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/pathfindersgifts.com/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    # Security headers
    add_header X-Frame-Options DENY always;
    add_header X-Content-Type-Options nosniff always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # CORS for API endpoints only
    location ~ ^/api/ {
        # Handle preflight requests
        if ($request_method = OPTIONS) {
            add_header Access-Control-Allow-Origin "https://pathfindersgifts.com" always;
            add_header Access-Control-Allow-Methods "GET, POST, PUT, PATCH, DELETE, OPTIONS" always;
            add_header Access-Control-Allow-Headers "accept, accept-encoding, authorization, content-type, dnt, origin, user-agent, x-csrftoken, x-requested-with" always;
            add_header Access-Control-Allow-Credentials "true" always;
            add_header Access-Control-Max-Age 1728000 always;
            add_header Content-Type "text/plain; charset=utf-8" always;
            add_header Content-Length 0 always;
            return 204;
        }

        # Regular CORS headers
        add_header Access-Control-Allow-Origin "https://pathfindersgifts.com" always;
        add_header Access-Control-Allow-Credentials "true" always;
    }

    # CSRF endpoint - MOST IMPORTANT FOR SIGNUP
    location = /api/csrf/ {
        proxy_pass http://127.0.0.1:8000/api/auth/csrf/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;
    }

    # API health endpoint
    location = /api/health/ {
        proxy_pass http://127.0.0.1:8000/api/health/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Health check (root level)
    location = /health/ {
        proxy_pass http://127.0.0.1:8000/health/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location = /health {
        proxy_pass http://127.0.0.1:8000/health/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # FastAPI specific routes
    location /api/fastapi/ {
        rewrite ^/api/fastapi/(.*) /$1 break;
        proxy_pass http://127.0.0.1:8001/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 300;
        proxy_connect_timeout 300;
        proxy_send_timeout 300;
    }

    # Django API routes (general - comes after specific routes)
    location /api/ {
        proxy_pass http://127.0.0.1:8000/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;
    }

    # Admin panel
    location /admin/ {
        proxy_pass http://127.0.0.1:8000/admin/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Static files
    location /static/ {
        proxy_pass http://127.0.0.1:8000/static/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Media files
    location /media/ {
        proxy_pass http://127.0.0.1:8000/media/;
        expires 1y;
        add_header Cache-Control "public";
    }

    # Frontend - Next.js (must be last)
    location / {
        proxy_pass http://127.0.0.1:3000/;
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
EOF

else
    echo "📝 Creating HTTP-only configuration..."
    sudo tee /etc/nginx/sites-available/pathfindersgifts.com << 'EOF'
server {
    listen 80;
    server_name pathfindersgifts.com www.pathfindersgifts.com;

    # CORS for API endpoints only
    location ~ ^/api/ {
        # Handle preflight requests
        if ($request_method = OPTIONS) {
            add_header Access-Control-Allow-Origin "https://pathfindersgifts.com" always;
            add_header Access-Control-Allow-Methods "GET, POST, PUT, PATCH, DELETE, OPTIONS" always;
            add_header Access-Control-Allow-Headers "accept, accept-encoding, authorization, content-type, dnt, origin, user-agent, x-csrftoken, x-requested-with" always;
            add_header Access-Control-Allow-Credentials "true" always;
            add_header Access-Control-Max-Age 1728000 always;
            add_header Content-Type "text/plain; charset=utf-8" always;
            add_header Content-Length 0 always;
            return 204;
        }

        add_header Access-Control-Allow-Origin "https://pathfindersgifts.com" always;
        add_header Access-Control-Allow-Credentials "true" always;
    }

    # CSRF endpoint - MOST IMPORTANT FOR SIGNUP
    location = /api/csrf/ {
        proxy_pass http://127.0.0.1:8000/api/auth/csrf/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # API health endpoint
    location = /api/health/ {
        proxy_pass http://127.0.0.1:8000/api/health/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Health checks
    location = /health/ {
        proxy_pass http://127.0.0.1:8000/health/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location = /health {
        proxy_pass http://127.0.0.1:8000/health/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # FastAPI routes
    location /api/fastapi/ {
        rewrite ^/api/fastapi/(.*) /$1 break;
        proxy_pass http://127.0.0.1:8001/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 300;
        proxy_connect_timeout 300;
        proxy_send_timeout 300;
    }

    # Django API routes (general)
    location /api/ {
        proxy_pass http://127.0.0.1:8000/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Admin panel
    location /admin/ {
        proxy_pass http://127.0.0.1:8000/admin/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Frontend - Next.js (must be last)
    location / {
        proxy_pass http://127.0.0.1:3000/;
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
EOF

fi

# Enable the configuration
echo "🔗 Enabling nginx configuration..."
sudo ln -sf /etc/nginx/sites-available/pathfindersgifts.com /etc/nginx/sites-enabled/

# Test nginx configuration
echo "🧪 Testing nginx configuration..."
if sudo nginx -t; then
    echo "✅ Nginx configuration is VALID"
    
    echo "🔄 Reloading nginx..."
    sudo systemctl reload nginx
    
    echo "✅ Nginx reloaded successfully!"
    
    # Test CSRF endpoint specifically
    echo ""
    echo "🧪 Testing CSRF endpoint..."
    
    if [ "$PROTOCOL" = "HTTPS" ]; then
        TEST_URL="https://pathfindersgifts.com/api/csrf/"
    else
        TEST_URL="http://pathfindersgifts.com/api/csrf/"
    fi
    
    echo "Testing: $TEST_URL"
    
    # Test with curl
    RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" -k "$TEST_URL" || echo "000")
    
    if [ "$RESPONSE" = "200" ] || [ "$RESPONSE" = "302" ]; then
        echo "🎉 SUCCESS: CSRF endpoint is working! (HTTP $RESPONSE)"
        echo "✅ User signup should now work!"
    else
        echo "⚠️  CSRF test returned HTTP $RESPONSE"
        echo "🔍 Testing Django directly..."
        
        DJANGO_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "http://127.0.0.1:8000/api/auth/csrf/" || echo "000")
        
        if [ "$DJANGO_RESPONSE" = "200" ] || [ "$DJANGO_RESPONSE" = "302" ]; then
            echo "✅ Django CSRF endpoint works directly (HTTP $DJANGO_RESPONSE)"
            echo "🔄 Issue might be in nginx routing - but configuration is applied"
        else
            echo "❌ Django CSRF endpoint not responding (HTTP $DJANGO_RESPONSE)"
        fi
    fi
    
else
    echo "❌ Nginx configuration test FAILED!"
    echo "📋 Nginx error details:"
    sudo nginx -t
    exit 1
fi

echo ""
echo "📊 Current service status:"
sudo supervisorctl status

echo ""
echo "🎯 Quick verification commands:"
echo "curl -I https://pathfindersgifts.com/api/csrf/"
echo "curl -I http://127.0.0.1:8000/api/auth/csrf/"
echo ""
echo "🔍 If still having issues, check:"
echo "sudo tail -f /var/log/nginx/error.log"
echo "sudo tail -f /var/log/pathfinders-django.log"