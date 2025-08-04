# Pathfinders Production Deployment Guide for pathfindersgifts.com

## Prerequisites

- AWS EC2 instance (Ubuntu 20.04+) at **13.49.5.171**
- Domain **pathfindersgifts.com** pointed to your Elastic IP
- RSA key pair `pathfinders.pem` (located in project root)

## Step 1: SSH into AWS Server

```bash
# Navigate to project directory where the key is located
cd /path/to/pathfinders

# Set proper permissions for the SSH key
chmod 400 test.pem

# SSH into your AWS instance
ssh -i test.pem ubuntu@3.98.30.68
```

## Step 2: Clone Repository and Setup

```bash
# On your AWS server
sudo mkdir -p /home/ubuntu/app
sudo chown $USER:$USER /home/ubuntu/app
cd /home/ubuntu/app

# Clone the repository
git clone https://github.com/Dish365/pathfinders.git .

# Configure production environment
cp .env.template .env

# Edit the .env file with your production values
nano .env
```

**Important:** Update these values in `.env`:
- `SECRET_KEY` - Generate a new secure key
- `MTN_COLLECTION_SUBSCRIPTION_KEY` - Your MTN subscription key
- `MTN_COLLECTION_PRIMARY_KEY` - Your MTN primary key  
- `MTN_COLLECTION_SECONDARY_KEY` - Your MTN secondary key
- `STRIPE_PUBLISHABLE_KEY` - Your Stripe publishable key
- `STRIPE_SECRET_KEY` - Your Stripe secret key
- `STRIPE_WEBHOOK_SECRET` - Your Stripe webhook secret

## Step 3: Run Automated Deployment

```bash
cd /home/ubuntu/app
chmod +x deploy.sh
./deploy.sh
```

The deployment script will automatically:
- Install system dependencies (Python, Nginx, Redis, SQLite, etc.)
- Setup Python virtual environment and install packages
- Configure SQLite database with proper permissions
- Setup Nginx with SSL certificates (Let's Encrypt)
- Configure Supervisor for process management
- Setup automated daily database backups
- Configure firewall (UFW)
- Start all services

## Step 4: Post-Deployment Security

**After deployment completes, immediately:**

1. **Generate and set a new Django secret key:**
   ```bash
   cd /home/ubuntu/app
   source venv/bin/activate
   python -c 'from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())'
   ```
   Copy the output and update `SECRET_KEY` in `.env`

2. **Change the default admin password:**
   ```bash
   python manage.py changepassword admin
   ```

3. **Restart services to apply changes:**
   ```bash
   sudo supervisorctl restart all
   ```

## Step 5: Verify Deployment

```bash
# Test HTTPS connection
curl -I https://pathfindersgifts.com

# Check service status
sudo supervisorctl status

# View logs if needed
sudo tail -f /var/log/pathfinders-django.log
sudo tail -f /var/log/pathfinders-fastapi.log
sudo tail -f /var/log/pathfinders-frontend.log
```

**Your Pathfinders application should now be live at:** `https://pathfindersgifts.com`

---

## Production Architecture

```
Internet → Nginx (443/80) → Django (8000) + FastAPI (8001) + Next.js (3000)
                         ↓
                   SQLite Database + Redis Cache
```

## Service Management Commands

```bash
# Check all services
sudo supervisorctl status

# Restart individual services
sudo supervisorctl restart pathfinders-django
sudo supervisorctl restart pathfinders-fastapi
sudo supervisorctl restart pathfinders-frontend

# Reload Nginx
sudo systemctl reload nginx

# View real-time logs
sudo tail -f /var/log/pathfinders-django.log
sudo tail -f /var/log/pathfinders-fastapi.log
sudo tail -f /var/log/pathfinders-frontend.log
```

## Database Backup

- **Automatic:** Daily backups at 2:00 AM to `/var/backups/pathfinders/`
- **Manual backup:** `/usr/local/bin/pathfinders-backup.sh`
- **View backups:** `ls -la /var/backups/pathfinders/`

## SSL Certificate Management

Certificates auto-renew via cron job. Manual renewal:
```bash
sudo certbot renew --dry-run
sudo systemctl reload nginx
```

## Security Features Enabled

✅ HTTPS with Let's Encrypt SSL certificates  
✅ Security headers (HSTS, XSS protection, etc.)  
✅ Firewall configured (UFW)  
✅ Proper file permissions for SQLite  
✅ Rate limiting on API endpoints  
✅ Production-only CORS origins  

## Troubleshooting

**SSL Issues:**
```bash
sudo certbot certificates
sudo certbot renew --force-renewal
```

**Permission Issues:**
```bash
sudo chown -R $USER:www-data /home/ubuntu/app/
sudo chmod 664 /home/ubuntu/app/db.sqlite3
```

**Service Issues:**
```bash
sudo supervisorctl reread
sudo supervisorctl update
sudo supervisorctl restart all
```

**View detailed logs:**
```bash
sudo journalctl -u supervisor -f
sudo nginx -t  # Test nginx configuration
```

---

## Future Updates

To deploy updates:
```bash
cd /home/ubuntu/app
git pull origin main
source venv/bin/activate
python manage.py migrate
python manage.py collectstatic --noinput
cd pathfinders-client && yarn install && yarn build && cd ..
sudo supervisorctl restart all
sudo systemctl reload nginx
```

## Environment Variables Reference

### Django Settings
```bash
DEBUG=False
SECRET_KEY=your-secret-key-here
ALLOWED_HOSTS=pathfindersgifts.com,www.pathfindersgifts.com
DATABASE_URL=sqlite:///db.sqlite3
STATIC_URL=/static/
STATIC_ROOT=/home/ubuntu/app/staticfiles
MEDIA_URL=/media/
MEDIA_ROOT=/home/ubuntu/app/media
```

### MTN Mobile Money Configuration
```bash
MTN_TARGET_ENVIRONMENT=sandbox
MTN_COLLECTION_SUBSCRIPTION_KEY=2026432ffc664e909d6ace2e4d4b24b0
MTN_COLLECTION_PRIMARY_KEY=2026432ffc664e909d6ace2e4d4b24b0
MTN_COLLECTION_SECONDARY_KEY=e3e05b43c2e04540a969390346beb2a0
MTN_CALLBACK_URL=https://pathfindersgifts.com/api/core/mtn-webhook/
MTN_CURRENCY=GHS
MTN_MERCHANT_NUMBER=233536888387
```

### Stripe Configuration
```bash
STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key
STRIPE_SECRET_KEY=sk_test_your_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
```

### FastAPI Configuration
```bash
FASTAPI_HOST=127.0.0.1
FASTAPI_PORT=8001
```

## Testing Endpoints

```bash
# Test Django API
curl -I https://pathfindersgifts.com/api/

# Test FastAPI
curl -I https://pathfindersgifts.com/fastapi/

# Test Django Admin
curl -I https://pathfindersgifts.com/admin/

# Test Frontend
curl -I https://pathfindersgifts.com/

# Test Static Files
curl -I https://pathfindersgifts.com/static/
curl -I https://pathfindersgifts.com/_next/static/
```



export MTN_COLLECTION_SUBSCRIPTION_KEY="2026432ffc664e909d6ace2e4d4b24b0"
export MTN_COLLECTION_PRIMARY_KEY="2026432ffc664e909d6ace2e4d4b24b0"
export MTN_COLLECTION_SECONDARY_KEY="e3e05b43c2e04540a969390346beb2a0"
export STRIPE_SECRET_KEY="sk_test_your_actual_key"
./deploy.sh