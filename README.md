# Afghanistan Online Cargo

[![Live Site](https://img.shields.io/badge/live-afghancargo.online-1E2A5E)](https://afghancargo.online)
[![License: MIT](https://img.shields.io/badge/license-MIT-green.svg)](#license)
[![Node.js](https://img.shields.io/badge/node-20.x-339933?logo=node.js&logoColor=white)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7.3-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Prisma](https://img.shields.io/badge/Prisma-6.19.3-2D3748?logo=prisma&logoColor=white)](https://www.prisma.io)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org)

**A KYC-verified, cross-border package coordination platform connecting Afghan senders and travelers.**

---

## Overview

Afghanistan Online Cargo is a trust layer for informal cross-border package delivery. Millions of packages move every year between Afghanistan and the rest of the world carried by ordinary travelers — friends, family, and strangers headed the same direction. This platform gives that existing practice a verified, accountable, and legally documented structure: identity-checked users, an explicit agreement flow, and a timestamped record of every handover.

Senders post packages that need to travel somewhere. Travelers post trips they're already taking. Either side can find the other, agree on terms in person or over WhatsApp, and then formally record the arrangement on the platform through a five-step delivery workflow — from proposal to final confirmation and review.

**What this platform is not:** it is not a courier or logistics company, does not take custody of packages, and does not guarantee delivery. It does not process payments between users — all payment terms are agreed directly between sender and traveler.

**Its legal role** is narrower and more important: every registration, agreement acceptance, and delivery status change is timestamped and stored, producing an evidentiary record both parties can rely on if a dispute ever needs to be resolved outside the platform.

## Live Demo

- **Frontend:** [https://afghancargo.online](https://afghancargo.online)
- **API health check:** [https://api.afghancargo.online/api/health](https://api.afghancargo.online/api/health)

<!-- Add screenshots here -->

## Features

- **KYC verification** — passport or Tazkira, plus a live face photo, reviewed and approved by an admin before a user can post or contact anyone
- **Cross-border trip & package listings** with country/city/date search and filtering
- **Delivery proposal & acceptance workflow** between senders and travelers
- **Five-step delivery tracking:** `Posted → Proposed → Accepted → Delivered → Reviewed`
- **Agreement acknowledgment system** — legally significant, timestamped records of sender and traveler terms
- **5% platform commission** tracked per finalized delivery, visible in a per-user wallet
- **Bilingual interface** — English and Dari (دری), including full RTL layout support
- **Notification system** — in-app notifications and transactional email for every workflow step
- **Admin dashboard** with full platform oversight: approvals, rejections, user/trip/package/delivery management, deletion requests
- **Cloudflare R2** object storage for KYC documents and package photos
- **Signed URLs** for private KYC documents (300-second expiry) — documents are never served from a public path

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS v4 |
| State management | Zustand |
| Forms & validation | React Hook Form + Zod |
| i18n | i18next / react-i18next (English + Dari, RTL) |
| Backend | Node.js, Express 5, TypeScript |
| ORM / Database | Prisma 6.19.3, PostgreSQL 15 (Supabase-hosted) |
| Auth | JWT (access + refresh tokens), bcrypt |
| File storage | Cloudflare R2 (S3-compatible) |
| Email | Resend |
| Deployment | Docker, Apache reverse proxy, VPS |

## Architecture Overview

This is a monorepo with two independently deployable apps:

- **`client/`** — a Vite-built React SPA. In production it's built to static assets and served by Apache.
- **`server/`** — an Express + TypeScript API. In production it runs inside a Docker container behind Apache acting as a reverse proxy, terminating SSL and forwarding `/api` traffic to the container.

The API talks to a managed PostgreSQL database (via Prisma) and to Cloudflare R2 for file storage — KYC documents in a private bucket accessed only through short-lived signed URLs, and package photos in a public bucket served directly.

## Project Structure

```
afghanistan_online_cargo/
├── client/                  # React + TypeScript + Vite frontend
│   ├── public/               # Static assets (favicon, og-image, robots.txt, sitemap.xml)
│   └── src/
│       ├── components/       # Shared UI components
│       ├── pages/             # Route-level page components
│       ├── store/             # Zustand stores
│       ├── lib/                # axios instance, utilities
│       ├── hooks/             # Custom React hooks
│       └── i18n/               # English + Dari translation resources
└── server/                  # Node.js + Express + TypeScript backend
    ├── prisma/
    │   ├── schema.prisma      # Database schema
    │   └── migrations/         # Hand-written & generated migrations
    └── src/
        ├── routes/             # Express route handlers, grouped by resource
        ├── middleware/         # Auth guards, upload handling
        ├── lib/                 # Prisma client, JWT, email, storage, visibility rules
        └── schemas/            # Zod request-validation schemas
```

## Getting Started (Local Development)

### Prerequisites

- Node.js 20.x
- npm
- A PostgreSQL database (e.g. a free Supabase project)
- A Cloudflare R2 bucket (or any S3-compatible storage) for file uploads
- A [Resend](https://resend.com) API key for transactional email (optional in development — emails are logged, not sent, if omitted)

### 1. Clone and install

```bash
git clone <repository-url>
cd afghanistan_online_cargo

cd server && npm install
cd ../client && npm install
```

### 2. Configure environment variables

Copy the variables listed in the [Environment Variables](#environment-variables) table into `server/.env` and `client/.env`.

### 3. Set up the database

```bash
cd server
npx prisma generate
npx prisma migrate deploy
```

### 4. Run the backend

```bash
cd server
npm run dev
# API on http://localhost:4000
```

### 5. Run the frontend

```bash
cd client
npm run dev
# App on http://localhost:5173
```

## Environment Variables

### `server/.env`

| Variable | Description | Example |
|---|---|---|
| `PORT` | Port the API server listens on | `4000` |
| `DATABASE_URL` | Pooled PostgreSQL connection string (used at runtime) | `postgresql://user:pass@host:6543/db?pgbouncer=true` |
| `DIRECT_URL` | Direct PostgreSQL connection string (used for migrations) | `postgresql://user:pass@host:5432/db` |
| `SUPABASE_URL` | Supabase project URL | `https://xxxx.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service-role key | `eyJhbGciOi...` |
| `JWT_ACCESS_SECRET` | Secret used to sign short-lived access tokens | `change-me` |
| `JWT_REFRESH_SECRET` | Secret used to sign long-lived refresh tokens | `change-me-too` |
| `RESEND_API_KEY` | API key for sending transactional email via Resend | `re_xxxxxxxx` |
| `CLIENT_URL` | Public URL of the frontend, used in email links | `https://afghancargo.online` |
| `R2_ENDPOINT` | Cloudflare R2 S3-compatible endpoint | `https://<account-id>.r2.cloudflarestorage.com` |
| `R2_ACCESS_KEY_ID` | R2 access key ID | `xxxxxxxx` |
| `R2_SECRET_ACCESS_KEY` | R2 secret access key | `xxxxxxxx` |
| `R2_PUBLIC_URL` | Public base URL for the package-photos bucket | `https://cdn.afghancargo.online` |

### `client/.env`

| Variable | Description | Example |
|---|---|---|
| `VITE_API_URL` | Base URL of the API the frontend calls | `http://localhost:4000/api` |

## API Documentation Summary

All endpoints are prefixed with `/api`.

| Group | Description |
|---|---|
| `auth` | Registration, login/logout, token refresh, current-user profile, public user search & profiles |
| `trips` | Create, list, view, update, and delete travel listings |
| `packages` | Create, list, view, update, and delete package listings |
| `deliveries` | Propose, accept, finalize, and cancel deliveries between a sender and traveler |
| `reviews` | Submit and view reviews left for travelers after a finalized delivery |
| `messages` | Direct messaging between users |
| `notifications` | In-app notification feed and read-state |
| `agreements` | Record acceptance of sender/traveler terms before key delivery actions |
| `admin` | Platform oversight: approve/reject users, manage trips/packages/deliveries/messages, view stats |

## Business Rules

1. Every user must register with a passport or Tazkira, a live face photo, and — if residing outside Afghanistan — a visa or residency document.
2. New accounts start as `PENDING` and require manual admin approval before the user can post or see anyone's contact details.
3. Full contact details (legal name, WhatsApp, email) of another user are only visible to admins, or to approved users who have posted at least one trip or package. Everyone else sees only a nickname.
4. Any edit to a profile's verified fields sends the account back to `PENDING` for re-approval.
5. Requesting account deletion immediately suspends the account, hiding it and its listings from the public while preserving delivery history for legal purposes.
6. A delivery moves through exactly five states: Posted → Proposed → Accepted → Delivered (Finalized) → Reviewed.
7. Before proposing or accepting a delivery, the relevant party must acknowledge an explicit agreement — creating a timestamped legal record.
8. Travelers owe a 5% platform commission on the agreed amount of every finalized delivery.
9. Users with unpaid commission cannot post new trips or packages until it is settled.
10. Only the sender of a finalized delivery may leave a review, and only once per delivery.
11. A package tied to a finalized delivery cannot be deleted.
12. A trip is automatically considered closed once its departure date has passed; closed trips are visually marked and no longer accept new contact or delivery proposals.

## Deployment

- **VPS:** Bluehost Standard VPS, CentOS 7
- **Backend:** Dockerized Node.js 20 Alpine container running the Express API
- **Frontend:** static React build served directly by Apache
- **Reverse proxy:** Apache proxies `/api` traffic to the backend container and terminates SSL
- **Database:** PostgreSQL 15 running on the VPS
- **File storage:** Cloudflare R2
- **SSL:** Let's Encrypt, issued and renewed via cPanel AutoSSL

Deploying an update to the backend means rebuilding and restarting the Docker container on the VPS; deploying an update to the frontend means rebuilding the static assets (`npm run build` in `client/`) and syncing the output to the directory Apache serves.

## Contributing

1. Fork the repository and create a feature branch.
2. Keep changes scoped — one logical change per commit.
3. Run `npx tsc --noEmit` in both `client/` and `server/` before opening a pull request.
4. Describe what changed and why in the pull request description.

## Developer

**Khadim Tawakuli**
Portfolio: [tawakuli.dev](https://tawakuli.dev)
Email: [tawakuli456@gmail.com](mailto:tawakuli456@gmail.com)
WhatsApp: [+93 765 074 686](https://wa.me/93765074686)

## License

MIT License — see [LICENSE](LICENSE) for details.
