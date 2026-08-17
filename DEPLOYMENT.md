# Deploying to your Hostinger VPS (alongside WordPress)

This app is a Node.js server (Next.js + PostgreSQL). It runs as its own
process on a subdomain (e.g. `app.financial.help`), completely separate
from WordPress — WordPress keeps serving `financial.help` exactly as it
does now. Nothing here touches your WordPress install, database, or files.

I can't run these commands for you — I don't have access to your VPS
from this session. This is the exact sequence to SSH in and run yourself
(or hand to whoever manages the server).

## Step 0: Figure out what's already on the VPS

SSH in (`ssh root@your-vps-ip` or your usual user) and run:

```bash
# What's serving WordPress on port 80/443?
sudo ss -tlnp | grep -E ':80|:443'

# Is there a control panel installed?
ls /usr/local/hestia 2>/dev/null && echo "Hestia"
ls /usr/local/CyberCP 2>/dev/null && echo "CyberPanel"
ls /etc/cloudpanel 2>/dev/null && echo "CloudPanel"
ls /usr/local/psa 2>/dev/null && echo "Plesk"
which hpanel-cli 2>/dev/null && echo "hPanel VPS tools present"

# What web server?
which nginx apache2 2>/dev/null
```

This tells you which "exposing it publicly" section to use in Step 5.
Everything before that (Steps 1-4) is the same regardless of panel.

## Step 1: Install Node.js and PostgreSQL

```bash
# Node.js 20.x (matches what this app was built/tested against)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# PostgreSQL
sudo apt-get install -y postgresql postgresql-contrib

# PM2 — keeps the app running, restarts it on crash/reboot
sudo npm install -g pm2
```

If your VPS already has a control panel (CyberPanel, CloudPanel, Plesk,
Hestia), it likely already manages PostgreSQL/MySQL and Node through its
own UI — check there first rather than installing a second copy.

## Step 2: Create the database

```bash
sudo -u postgres psql -c "CREATE USER investment_app WITH PASSWORD 'CHOOSE_A_REAL_PASSWORD';"
sudo -u postgres psql -c "CREATE DATABASE investment_property OWNER investment_app;"
```

## Step 3: Get the code onto the server and configure it

```bash
cd /var/www   # or wherever you keep sites outside the WordPress docroot
git clone <your-repo-url> investment-property
cd investment-property
git checkout claude/investment-property-analyzer-6xn6w0   # or main, once merged

npm install
cp .env.example .env
nano .env
```

Fill in `.env`:

```bash
DATABASE_URL="postgresql://investment_app:CHOOSE_A_REAL_PASSWORD@localhost:5432/investment_property"
NEXTAUTH_SECRET="<run: openssl rand -base64 32>"
NEXTAUTH_URL="https://app.financial.help"     # your real subdomain, once DNS is set up
RENTCAST_API_KEY=""                            # optional, see README
EMAIL_FROM="Investment Property Analyzer <no-reply@financial.help>"
SMTP_HOST=""                                   # optional — see note below
SMTP_PORT="587"
SMTP_USER=""
SMTP_PASSWORD=""
```

For `SMTP_HOST`: Hostinger's own email hosting can usually serve as an
SMTP relay if `financial.help`'s email is hosted there too (check
hPanel → Emails → Connection details). Without it configured, the app
still works — verification/reset links just get logged to the server
console instead of emailed, which isn't useful for real users, so set
this up before letting real customers sign up.

## Step 4: Migrate the database and build

```bash
npx prisma migrate deploy
npm run build
```

## Step 5: Run it with PM2

The repo includes `ecosystem.config.js`, already set to run on port 3001
(change the port there if you need a different one):

```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup     # follow the printed instructions to enable on-boot start
```

This runs the app on `localhost:3001` (pick any free port — just don't
collide with whatever WordPress/Apache/other apps use). Confirm it's up:

```bash
curl -I http://localhost:3001
pm2 logs investment-property
```

## Step 6: DNS — point a subdomain at this VPS

In Hostinger's DNS zone editor for `financial.help` (hPanel → Domains →
DNS Zone), add:

```
Type: A
Name: app          (or "tools", "investment", whatever you want)
Value: <your VPS IP address>
TTL: 3600
```

DNS propagation is usually fast on Hostinger but can take up to a few
hours.

## Step 7: Expose it publicly (this part depends on your panel)

The goal is the same regardless of panel: reverse-proxy
`https://app.financial.help` to `http://localhost:3001`, with SSL.

### If it's plain Nginx (no panel, or hPanel with raw Nginx)

Copy `deploy/nginx-app-subdomain.conf` from this repo to
`/etc/nginx/sites-available/app.financial.help`, edit the placeholders,
then:

```bash
sudo ln -s /etc/nginx/sites-available/app.financial.help /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
sudo apt-get install -y certbot python3-certbot-nginx
sudo certbot --nginx -d app.financial.help
```

### If it's CloudPanel / CyberPanel / Plesk

Each of these has a "create a new site" flow in its UI for the
subdomain, with a "reverse proxy" or "Node.js app" option — point it at
`http://127.0.0.1:3001`, then use the panel's built-in Let's Encrypt/SSL
button. The Nginx config in `deploy/nginx-app-subdomain.conf` is a
useful reference for what the proxy directives should look like even if
you're setting it up through a UI instead of the raw file.

### If it's Hostinger's own hPanel VPS website manager

hPanel VPS has a "Websites" section where you can add a new site/domain
and, depending on your VPS OS image, a Node.js application option. If
that's available, point it at this app's directory and let it manage
the process instead of PM2. If it only offers static/PHP sites, fall
back to the plain-Nginx path above (hPanel VPS still gives you full SSH
root access, so nothing stops you from configuring Nginx directly).

## Verifying it's live

```bash
curl -I https://app.financial.help/login
```

Should return `200`. Visit it in a browser, sign up, and confirm you can
log in and run an analysis.

## Keeping it updated later

```bash
cd /var/www/investment-property
git pull
npm install
npx prisma migrate deploy
npm run build
pm2 restart investment-property
```

## What this does NOT do yet

This deploys the app standalone, reachable at its own subdomain with its
own login system — completely separate from WordPress. It does **not**
connect it to any WordPress paywall/membership plugin. That's a
separate, deliberate decision (see the note in the main README and the
earlier conversation about Stripe-in-the-app vs. bridging WordPress
membership) — say the word when you're ready to tackle that and I'll
scope it properly rather than bolt it on as an afterthought here.
