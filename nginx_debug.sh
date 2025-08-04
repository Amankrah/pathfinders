#!/bin/bash

echo "🔍 Nginx Configuration Debug Script"
echo "=================================="

echo "1. Current nginx configuration test:"
sudo nginx -t

echo ""
echo "2. Check if our site config exists:"
ls -la /etc/nginx/sites-enabled/pathfindersgifts.com

echo ""
echo "3. Check nginx error logs (last 10 lines):"
sudo tail -10 /var/log/nginx/error.log

echo ""
echo "4. Test direct backend connections:"
echo "Testing Django on 127.0.0.1:8000:"
curl -s -I http://127.0.0.1:8000/api/health/ | head -1

echo "Testing FastAPI on 127.0.0.1:8001:"
curl -s -I http://127.0.0.1:8001/health/ | head -1

echo ""
echo "5. Check active nginx processes:"
ps aux | grep nginx

echo ""
echo "6. Simple test - create basic nginx config:"
sudo tee /etc/nginx/sites-available/pathfindersgifts-simple.conf > /dev/null << 'EOF'
server {
    listen 80;
    server_name pathfindersgifts.com www.pathfindersgifts.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name pathfindersgifts.com www.pathfindersgifts.com;

    # SSL certificates (managed by certbot)
    ssl_certificate /etc/letsencrypt/live/pathfindersgifts.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/pathfindersgifts.com/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    # Basic proxy settings
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;

    # API routes to Django
    location /api/ {
        proxy_pass http://127.0.0.1:8000/api/;
    }

    location /admin/ {
        proxy_pass http://127.0.0.1:8000/admin/;
    }

    location /api {
        proxy_pass http://127.0.0.1:8000/api;
    }

    location /admin {
        proxy_pass http://127.0.0.1:8000/admin;
    }

    # FastAPI routes
    location /fastapi/ {
        rewrite ^/fastapi/(.*) /$1 break;
        proxy_pass http://127.0.0.1:8001;
    }

    location /fastapi {
        rewrite ^/fastapi$ /fastapi/ permanent;
    }

    # Health checks
    location /health/ {
        proxy_pass http://127.0.0.1:8000/health/;
    }

    location /health {
        proxy_pass http://127.0.0.1:8000/health;
    }

    # Frontend - everything else
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

echo ""
echo "7. Test the simple configuration:"
sudo nginx -t -c /dev/null -g 'include /etc/nginx/sites-available/pathfindersgifts-simple.conf;' 2>/dev/null || echo "Simple config has syntax errors"

echo ""
echo "8. Apply simple config temporarily (backup current first):"
read -p "Apply simple nginx config? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    sudo cp /etc/nginx/sites-enabled/pathfindersgifts.com /etc/nginx/sites-enabled/pathfindersgifts.com.backup
    sudo cp /etc/nginx/sites-available/pathfindersgifts-simple.conf /etc/nginx/sites-enabled/pathfindersgifts.com
    sudo nginx -t && sudo systemctl reload nginx
    echo "Simple config applied. Test with:"
    echo "curl -I https://pathfindersgifts.com/api/health/"
    echo "curl -I https://pathfindersgifts.com/fastapi/health/"
fi

echo ""
echo "🔧 Debug complete!"