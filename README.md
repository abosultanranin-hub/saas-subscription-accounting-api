# SaaS Subscription Accounting API

Backend REST API for a multi-tenant SaaS subscription management system. It supports tenant registration, plans, customers, subscriptions, monthly invoicing, payments, deferred revenue accounting, revenue recognition, and simple financial reports.

## Tech Stack

- Node.js 20
- Express + TypeScript
- PostgreSQL
- Prisma ORM
- JWT authentication

## Accounting Design

Each tenant receives a basic chart of accounts at registration:

| Code | Account | Type |
| --- | --- | --- |
| 1000 | Cash | Asset |
| 1100 | Accounts Receivable | Asset |
| 2000 | Deferred Revenue | Liability |
| 4000 | Subscription Revenue | Revenue |

Financial actions create balanced double-entry journal entries:

| Event | Debit | Credit |
| --- | --- | --- |
| Monthly invoice | Accounts Receivable | Deferred Revenue |
| Payment received | Cash | Accounts Receivable |
| Revenue recognition | Deferred Revenue | Subscription Revenue |

Revenue is not recognized when the invoice is created. It is first recorded as deferred revenue, then moved to subscription revenue through the revenue recognition endpoint.

## Multi-Tenancy

The API uses `tenantId` on operational and accounting records. Authenticated routes derive the tenant from the JWT token and filter every query by that tenant. Customers, plans, subscriptions, invoices, payments, accounts, and journal entries are isolated per tenant.

## Local Setup

1. Install dependencies:

```bash
npm install
```

2. Copy environment variables:

```bash
cp .env.example .env
```

3. Set `DATABASE_URL` in `.env` to a PostgreSQL database.

4. Run migrations and generate Prisma client:

```bash
npm run prisma:migrate
npm run prisma:generate
```

5. Optional seed:

```bash
npm run db:seed
```

6. Start the API:

```bash
npm run dev
```

The API runs at `http://localhost:3000`.

## Deployment

Deploy to Vercel, Render, Railway, or Heroku with:

- `DATABASE_URL`
- `JWT_SECRET`

For production database setup, run:

```bash
npm run prisma:deploy
```

## API Quick Start

### Register Tenant

`POST /api/auth/register`

```json
{
  "tenantName": "Acme SaaS",
  "tenantEmail": "billing@acme.test",
  "adminName": "Acme Admin",
  "adminEmail": "admin@acme.test",
  "password": "password123"
}
```

Use the returned token as:

```text
Authorization: Bearer <token>
```

### Login

`POST /api/auth/login`

```json
{
  "email": "admin@acme.test",
  "password": "password123"
}
```

### Plans

- `GET /api/plans`
- `POST /api/plans`
- `PUT /api/plans/:id`
- `DELETE /api/plans/:id`

Create plan:

```json
{
  "name": "Gold",
  "priceCents": 50000,
  "currency": "USD",
  "interval": "monthly"
}
```

### Customers

- `GET /api/customers`
- `POST /api/customers`
- `PUT /api/customers/:id`
- `DELETE /api/customers/:id`

Create customer:

```json
{
  "name": "Customer One",
  "email": "customer@example.com"
}
```

### Subscriptions

- `GET /api/subscriptions`
- `POST /api/subscriptions`
- `PATCH /api/subscriptions/:id/cancel`

Create subscription:

```json
{
  "customerId": "<customer-id>",
  "planId": "<plan-id>",
  "startDate": "2026-06-01T00:00:00.000Z"
}
```

### Generate Monthly Invoices

`POST /api/invoices/generate-monthly`

```json
{
  "period": "2026-06-01T00:00:00.000Z"
}
```

This creates one invoice per active subscription for that month and records:

- Debit Accounts Receivable
- Credit Deferred Revenue

### Register Payment

`POST /api/invoices/:id/payments`

```json
{
  "amountCents": 50000,
  "paidAt": "2026-06-10T00:00:00.000Z"
}
```

This records:

- Debit Cash
- Credit Accounts Receivable

### Recognize Revenue

`POST /api/invoices/recognize-revenue`

```json
{
  "periodEnd": "2026-07-01T00:00:00.000Z"
}
```

This records:

- Debit Deferred Revenue
- Credit Subscription Revenue

### Reports

- `GET /api/reports/income-statement?from=2026-06-01T00:00:00.000Z&to=2026-07-01T00:00:00.000Z`
- `GET /api/reports/balance-sheet?asOf=2026-07-01T00:00:00.000Z`
- `GET /api/journal-entries`

## Evaluation Notes

- Double-entry validation rejects unbalanced journal entries.
- Tenant data is scoped by authenticated `tenantId`.
- Invoice generation is idempotent for each subscription and month.
- Revenue recognition is idempotent per invoice.
