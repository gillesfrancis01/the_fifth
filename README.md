# The Fifth Event Agency

Website and back office for The Fifth Event Agency (Montréal): public event pages, ticket sales with Stripe, QR-code tickets sent by email, check-in scanning at the door, and an admin dashboard.

Designed & developed by [Quartier Digital](https://www.quartier-digital.com/).

## Stack

- **Next.js 16** (App Router, Server Actions) with React 19 and TypeScript
- **Tailwind CSS 4**, GSAP for animations
- **Appwrite** for the database and file storage
- **Stripe** for payments
- **Resend** for transactional emails (tickets, contact form, provider applications)
- **Vitest** for tests

## Getting started

Requirements: Node.js 20+ and npm.

```bash
npm install
cp .env.example .env   # then fill in the values
npm run dev            # http://localhost:3000
```

Every environment variable is listed and explained in [`.env.example`](.env.example).

## Scripts

| Command         | What it does                         |
| --------------- | ------------------------------------ |
| `npm run dev`   | Start the development server         |
| `npm run build` | Build for production                 |
| `npm start`     | Serve the production build           |
| `npm run lint`  | Lint the project with ESLint         |
| `npm test`      | Run the test suite (Vitest)          |

## Features

**Public site** (`src/app/(site)`)
- Home, About, Services, Gallery, Portfolio, Events and Contact pages
- Event pages with ticket purchase (Stripe) and promo codes
- Contact form and "Join as a Provider" application form, both protected against spam bots (honeypot field, minimum fill time, gibberish detection)
- English, French and Spanish (language switcher in the header; translations in `src/context/LanguageContext.tsx` and `src/constants`)

**Back office** (`/admin`, password protected with `ADMIN_PASSWORD`)
- Dashboard, events, tickets, reservations, customers, promo codes, gallery, provider applications and scanner accounts
- Live refresh when tickets or reservations change

**Door check-in** (`/scan`)
- Scanner accounts created in the back office log in and scan ticket QR codes

## Project structure

```
src/
  app/
    (site)/        public pages
    admin/         back office
    scan/          door check-in scanner
    check-in/      page opened by a ticket QR code
    actions/       server actions (data access, payments, emails)
    api/           admin and scanner login/logout routes
  components/      UI components (admin/ and scan/ for back-office UI)
  constants/       page content per language (en, fr, es)
  context/         language context and translations
  utils/           email sending, PDF tickets, auth helpers
config/appwrite.ts Appwrite clients
tests/             Vitest test suite
```

## Deployment

The site is a standard Next.js app and deploys to any Node.js host that supports Next.js 16 (e.g. Vercel).

1. Set every variable from `.env.example` in the host's environment settings.
2. Use `npm run build` as the build command and `npm start` to serve it (Vercel detects this automatically).
3. In Resend, verify the domain of the sender address (`TICKETING_EMAIL_FROM`).
4. In Appwrite, add the production domain as a web platform for the project.

## Brevo newsletter sync

Newsletter form submissions and customers with a confirmed ticket purchase are
added to the configured Brevo list from server-side code.

Set these secrets in the production hosting environment (never in browser code
or in Git):

```text
BREVO_API_KEY=<Brevo API key>
BREVO_NEWSLETTER_LIST_ID=<numeric Brevo list ID>
```

The Brevo contact request uses `updateEnabled`, so submitting an existing email
updates the contact and keeps the integration idempotent.
