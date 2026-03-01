# Droppin Maintenance Mode (Nginx + GCP)

This setup shows a branded maintenance page when:

- frontend process on `127.0.0.1:3000` is down, or
- you manually enable maintenance mode.

## Files added in this repository

- `frontend/public/maintenance.html` (branded page)
- `docs/nginx-maintenance.conf.example` (server block snippet)

## 1) Add Nginx fallback config (serve directly from frontend/public)

- Open your site config (for example `/etc/nginx/sites-available/droppin`).
- Inside the `server { ... }` block, apply the snippet from:

`docs/nginx-maintenance.conf.example`

The snippet serves both:

- `/maintenance.html` from `frontend/public/maintenance.html`
- `/assets/...` from `frontend/public/assets/...`

This means no extra copy to `/var/www` is needed.

If Nginx runs as `www-data`, ensure it can read your project path.

Then test and reload:

```bash
sudo nginx -t
sudo systemctl reload nginx
```

## 2) Manual maintenance switch

Enable maintenance mode:

```bash
sudo touch /etc/nginx/maintenance.flag
sudo systemctl reload nginx
```

Disable maintenance mode:

```bash
sudo rm /etc/nginx/maintenance.flag
sudo systemctl reload nginx
```

## 3) How automatic fallback works

If port `3000` is down, Nginx receives `502/504` from upstream and serves `/maintenance.html` directly from `frontend/public`.

## 4) Notes

- Keep backend (`5000`) routing blocks unchanged.
- Because maintenance page is served by Nginx filesystem, users still see it even when frontend app is fully offline.
