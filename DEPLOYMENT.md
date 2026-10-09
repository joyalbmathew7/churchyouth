# Church donation deployment

## Local development

1. Install the backend requirements and frontend dependencies.
2. Copy `backend/.env.example` to `backend/.env` and set local values. Keep `.env` files private.
3. Run `python manage.py migrate` and `python manage.py createsuperuser` from `backend/`.
4. Start Django at `http://127.0.0.1:8000`.
5. Copy `frontend/joyal/.env.example` to `frontend/joyal/.env.local` if a proxy override is needed. The default Vite proxy targets Django at `http://127.0.0.1:8000`.
6. Start Vite from `frontend/joyal/`. The donation page is `/donation/`; the protected dashboard is `/joyaladmin/`. The existing `/admin/` backend URL remains available.

Create an administrator with Django's interactive `createsuperuser` command. Django hashes the password; no administrator password is stored in frontend code or this repository. Only active staff accounts can sign in to the admin site.

## Production deployment

- Deploy the Django project from `backend/` and serve it over HTTPS. Configure `DEBUG=False`, a newly generated `DJANGO_SECRET_KEY`, `ALLOWED_HOSTS`, `DATABASE_URL` for PostgreSQL, and Razorpay keys in the hosting provider's private environment settings.
- If email notifications are enabled, configure `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_HOST_USER`, `EMAIL_HOST_PASSWORD`, and `EMAIL_USE_TLS` using the SMTP provider's settings. The local console backend is only selected in development.
- Set `CORS_ALLOWED_ORIGINS` to the exact HTTPS origin(s) serving the frontend. Set `CSRF_TRUSTED_ORIGINS` to the exact HTTPS origins that may submit Django admin login forms. Do not use `*`.
- Add `https://<backend-host>` to `ALLOWED_HOSTS`. Keep TLS enabled and preserve the forwarded HTTPS header so secure Django cookies work behind the host's proxy.
- Run `python manage.py migrate` and `python manage.py collectstatic --noinput` as deployment/release steps. WhiteNoise serves Django admin static assets; do not omit static collection.
- Set the Vercel project root to `frontend/joyal`. Set `VITE_API_BASE_URL` to the Django backend origin only (for example, `https://<backend-host>`, without an `/api` suffix). This value is public and must not contain credentials or Razorpay secrets. The Vercel rewrites retain the React donation route and send `/joyaladmin/` to the frontend redirect, which forwards the browser to the backend's protected Django admin.
- Set the Django CORS origin to the deployed Vercel custom domain. The admin login/session remains on the Django backend origin and uses Django's CSRF middleware.
- The provided official CSI logo is stored at `frontend/joyal/public/images/csi-logo.png` and displayed without modifying its source image or aspect ratio.
- The supplied landscape church photo is optimized as `frontend/joyal/public/images/puthuval-church.webp`; CSS uses `cover` with responsive focal positioning and a soft contrast layer.

No database model changes or migrations are included in this update.
