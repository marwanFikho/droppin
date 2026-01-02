# Shopify App Deployment on GCP with Custom Domain

## Prerequisites
1. Domain `shopify.droppin-eg.com` pointing to your GCP instance
2. SSL certificate configured for the domain
3. Nginx or other reverse proxy configured

## Configuration Steps

### 1. Environment Variables
Make sure `.env` file is properly configured with:
- `SHOPIFY_APP_URL=https://shopify.droppin-eg.com`
- `SHOPIFY_API_KEY` and `SHOPIFY_API_SECRET` from your Shopify Partner Dashboard

### 2. Nginx Configuration
Configure Nginx to proxy requests to your app:

```nginx
server {
    listen 443 ssl http2;
    server_name shopify.droppin-eg.com;

    ssl_certificate /path/to/your/certificate.crt;
    ssl_certificate_key /path/to/your/private.key;

    location / {
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

    # WebSocket support for HMR
    location /ws {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }
}

server {
    listen 80;
    server_name shopify.droppin-eg.com;
    return 301 https://$server_name$request_uri;
}
```

### 3. Shopify Partner Dashboard
Update your app settings in the Shopify Partner Dashboard:
1. Go to https://partners.shopify.com
2. Navigate to Apps → Droppin EG
3. Update the following URLs:
   - **App URL**: `https://shopify.droppin-eg.com`
   - **Allowed redirection URL(s)**: `https://shopify.droppin-eg.com/auth/callback`

### 4. Running the App

#### Development Mode (with custom domain):
```bash
npm run dev
```

#### Production Mode:
```bash
npm run build
npm run start
```

#### Using PM2 (recommended for production):
```bash
# Install PM2
npm install -g pm2

# Start the app
pm2 start npm --name "shopify-app" -- run start

# Save PM2 configuration
pm2 save

# Setup PM2 to start on system boot
pm2 startup
```

### 5. Firewall Configuration
Ensure your GCP instance firewall allows:
- Port 80 (HTTP)
- Port 443 (HTTPS)
- Port 3000 (if accessing directly, otherwise only localhost)

### 6. SSL Certificate
You can use Let's Encrypt for free SSL certificates:

```bash
# Install certbot
sudo apt-get update
sudo apt-get install certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d shopify.droppin-eg.com

# Auto-renewal is set up automatically
```

## Troubleshooting

### Issue: App not loading in Shopify admin
- Verify DNS is pointing correctly
- Check SSL certificate is valid
- Ensure Nginx is proxying correctly
- Check app URLs in Partner Dashboard match your domain

### Issue: Websocket connection errors
- Make sure Nginx is configured to proxy WebSocket connections
- Check that the `/ws` location block is present in Nginx config

### Issue: CORS errors
- Verify `SHOPIFY_APP_URL` in `.env` matches your domain
- Check Nginx proxy headers are set correctly

## Notes
- The app now uses `--no-tunnel` flag to disable Cloudflare tunnel
- `automatically_update_urls_on_dev` is set to `false` to prevent automatic URL changes
- Keep your `.env` file secure and never commit it to version control
