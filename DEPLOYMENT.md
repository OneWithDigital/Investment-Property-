# Deploying to your Hostinger VPS

Two facts about your actual setup that shape everything below:

1. **WordPress (myfinancial.help) is NOT on this VPS.** It's on a
   separate Hostinger Premium Web Hosting plan. This app deploys to the
   VPS on its own subdomain (e.g. `app.myfinancial.help`); the two are
   connected only by a DNS record, nothing else.
2. **The VPS is Docker-based.** Ports 80/443 are served by Nginx Proxy
   Manager (`jc21/nginx-proxy-manager`) running in Docker, and there's
   already a `postgres:16-alpine` container — both managed by an
   existing compose project at `/root/automation-stack/docker-compose.yml`,
   alongside another project at `/root/agentic_agency/docker-compose.yml`.
   **This deployment never touches either of those files or restarts
   anything in them.** It's its own separate compose project that joins
   `automation-stack_database_network` — an existing Docker network — so
   it can reach the existing Postgres container and be reached by the
   existing Nginx Proxy Manager container, without editing either.

I don't have access to this VPS from this session — everything below is
what you (or whoever manages the server) runs over SSH.

## What's in this repo for this

- `Dockerfile` — multi-stage production build. Built and tested in a
  sandbox mirroring this exact setup (Alpine + Postgres reachable over a
  shared Docker network) before being handed to you — see the notes at
  the bottom of this file for exactly what that testing did and didn't
  cover.
- `docker-entrypoint.sh` — runs `prisma migrate deploy` then starts the
  app on every container start.
- `docker-compose.yml` — the standalone project described above.
- `.dockerignore`

## Step 1: Create a database and user for this app

Don't reuse the Postgres superuser. Run this on the VPS (adjust `-U
postgres` if the existing container's superuser has a different
username — check `/root/automation-stack/docker-compose.yml`'s postgres
service `environment:` block, or ask whoever set it up):

```bash
docker exec -it postgres psql -U postgres -c \
  "CREATE USER investment_app WITH PASSWORD 'CHOOSE_A_REAL_PASSWORD';"
docker exec -it postgres psql -U postgres -c \
  "CREATE DATABASE investment_property OWNER investment_app;"
```

Pick your own password — you never need to share it with me.

## Step 2: Get the code onto the server

```bash
cd /root   # or wherever you keep things outside automation-stack/agentic_agency
git clone <your-repo-url> investment-property
cd investment-property
git checkout claude/investment-property-analyzer-6xn6w0   # or main, once merged
```

## Step 3: Configure `.env`

```bash
cp .env.example .env
nano .env
```

```bash
# "postgres" here is the existing container's name — Docker's internal
# DNS resolves it once this app joins the same network. Not "localhost".
DATABASE_URL="postgresql://investment_app:CHOOSE_A_REAL_PASSWORD@postgres:5432/investment_property"
NEXTAUTH_SECRET="<run: openssl rand -base64 32>"
NEXTAUTH_URL="https://app.myfinancial.help"
RENTCAST_API_KEY=""                            # optional, see README
EMAIL_FROM="Investment Property Analyzer <no-reply@myfinancial.help>"
SMTP_HOST=""                                   # optional, see README
SMTP_PORT="587"
SMTP_USER=""
SMTP_PASSWORD=""
```

Without `SMTP_HOST` configured, verification/reset emails get logged to
`docker compose logs` instead of actually sent — fine for you to test
with, not fine for real users. Set up real SMTP before inviting anyone.

## Step 4: Build and start it

```bash
docker compose build
docker compose up -d
```

Watch it come up (should see "Applying database migrations..." then
"Starting Next.js..." then a Next.js ready message):

```bash
docker compose logs -f app
```

Confirm the container is on the right network and reachable internally:

```bash
docker exec investment-property wget -qO- http://localhost:3000/login | head -5
```

If this hangs or errors, don't move on to DNS/proxy setup yet — paste me
the output from `docker compose logs app` and we'll fix it first.

## Step 5: DNS — point a subdomain at this VPS

In Hostinger's DNS zone editor for `myfinancial.help` (this is
domain-level DNS management — accessible from hPanel regardless of which
hosting product serves the root domain), add:

```
Type: A
Name: app          (or "tools", "investment", whatever you prefer)
Value: <this VPS's public IP address>
TTL: 3600
```

## Step 6: Add the proxy host in Nginx Proxy Manager

Open NPM's admin UI at `http://<vps-ip>:81` (log in with whatever
credentials were set up when `automation-stack` was deployed). Then:

1. **Hosts → Proxy Hosts → Add Proxy Host**
2. **Domain Names**: `app.myfinancial.help`
3. **Scheme**: `http`
4. **Forward Hostname / IP**: `investment-property` — this resolves
   because the app container and NPM are on the same
   `automation-stack_database_network`
5. **Forward Port**: `3000`
6. Turn on **Block Common Exploits**
7. **SSL tab** → Request a new SSL Certificate → enable **Force SSL** →
   Save. NPM handles Let's Encrypt issuance/renewal automatically; no
   certbot needed.

## Verifying it's live

```bash
curl -I https://app.myfinancial.help/login
```

Should return `200`. Visit it in a browser, sign up, run an analysis.

## Keeping it updated later

```bash
cd /root/investment-property
git pull
docker compose build
docker compose up -d
```

`docker-entrypoint.sh` re-runs migrations on every start, so this alone
picks up new database changes too.

## What was actually tested before this was handed to you

Built and ran this Dockerfile + compose setup in a sandbox against a
`postgres:16-alpine` container on a Docker network named
`automation-stack_database_network` — deliberately mirroring your real
setup. That process caught and fixed three real bugs before you ever saw
this file:

1. The Dockerfile tried to copy a `public/` directory that didn't exist
   in this repo (now added, with a placeholder).
2. `package.json`'s `postinstall` hook (`prisma generate`) was failing
   inside the Docker build because the layer-caching structure copies
   `package.json` before the rest of the source — fixed with
   `npm ci --ignore-scripts` plus an explicit `prisma generate` once the
   full source is present.
3. `node:20-alpine` ships no OpenSSL, which breaks Prisma's engine
   auto-detection — fixed with `apk add --no-cache openssl` (Prisma's
   own documented fix for this exact error).

What I could **not** fully verify end-to-end in that sandbox: this
sandbox's own outbound network goes through a TLS-intercepting proxy for
unrelated reasons, which blocks Alpine's `apk` package manager
specifically (a sandbox-only restriction — `apk add` doesn't trust that
proxy's certificate, and there's no reasonable way to route around that
without meddling with the sandbox in ways irrelevant to your VPS). That
blocked a full clean containerized run of the final `apk add openssl`
fix. I'm confident in the fix itself — it's Prisma's own documented
solution, and it's an extremely standard, widely-used line in production
Alpine Dockerfiles — but "confident because it's well-established" is a
different thing than "watched it succeed end-to-end," and I want to be
honest about which one this is. If `docker compose up -d` in Step 4
doesn't come up cleanly, that's the first thing to check, and I'm ready
to debug it with you against the actual logs.

## Alternative: deploying without Docker

If you ever deploy this to a different, non-Docker VPS, see
`deploy/bare-metal/` for a PM2 + plain-Nginx path instead — not relevant
to `srv1677419`, kept here in case this repo is ever deployed elsewhere.

## What this does NOT do yet

This deploys the app standalone, reachable at its own subdomain with its
own login system — completely separate from WordPress (which, to
reiterate, isn't even on this server). It does **not** connect to any
WordPress paywall/membership system. That's a separate, deliberate
decision — Stripe billing built directly into this app vs. bridging
WordPress membership status across — flagged earlier and still open.
Say the word when you're ready to tackle it.
