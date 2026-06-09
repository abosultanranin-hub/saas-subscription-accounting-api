export const docsHtml = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>SaaS Subscription Accounting API</title>
  <style>
    :root {
      color-scheme: light;
      --bg: #f7f7f4;
      --panel: #ffffff;
      --ink: #202124;
      --muted: #5f6368;
      --line: #d8d9d2;
      --accent: #1b6f5c;
      --accent-2: #8a4b2b;
      --code: #f1f3f1;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      color: var(--ink);
      background: var(--bg);
      line-height: 1.55;
    }
    header {
      border-bottom: 1px solid var(--line);
      background: var(--panel);
    }
    .wrap {
      width: min(1120px, calc(100% - 32px));
      margin: 0 auto;
    }
    .hero {
      padding: 44px 0 30px;
    }
    h1 {
      margin: 0 0 10px;
      font-size: clamp(2rem, 4vw, 3.4rem);
      line-height: 1.05;
      letter-spacing: 0;
    }
    .lead {
      max-width: 820px;
      margin: 0;
      color: var(--muted);
      font-size: 1.05rem;
    }
    .status {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      margin-top: 24px;
    }
    .pill {
      border: 1px solid var(--line);
      background: #fbfbfa;
      padding: 8px 12px;
      border-radius: 6px;
      font-size: 0.92rem;
    }
    main { padding: 28px 0 46px; }
    section {
      margin-top: 28px;
      padding-top: 4px;
    }
    h2 {
      font-size: 1.28rem;
      margin: 0 0 14px;
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
      gap: 12px;
    }
    .card {
      background: var(--panel);
      border: 1px solid var(--line);
      border-radius: 8px;
      padding: 16px;
    }
    .card h3 {
      margin: 0 0 8px;
      font-size: 1rem;
    }
    .card p {
      margin: 0;
      color: var(--muted);
      font-size: 0.95rem;
    }
    code, pre {
      font-family: "SFMono-Regular", Consolas, "Liberation Mono", monospace;
    }
    code {
      background: var(--code);
      border: 1px solid var(--line);
      border-radius: 4px;
      padding: 1px 5px;
    }
    pre {
      overflow: auto;
      margin: 0;
      padding: 14px;
      border-radius: 8px;
      background: #202124;
      color: #f7f7f4;
      font-size: 0.9rem;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      background: var(--panel);
      border: 1px solid var(--line);
      border-radius: 8px;
      overflow: hidden;
    }
    th, td {
      text-align: left;
      padding: 10px 12px;
      border-bottom: 1px solid var(--line);
      vertical-align: top;
    }
    tr:last-child td { border-bottom: 0; }
    th {
      color: var(--muted);
      font-weight: 600;
      background: #fbfbfa;
    }
    .method {
      color: var(--accent);
      font-weight: 700;
      white-space: nowrap;
    }
    .decision {
      border-left: 4px solid var(--accent);
    }
    .accounting {
      border-left: 4px solid var(--accent-2);
    }
    @media (max-width: 640px) {
      .hero { padding-top: 30px; }
      th, td { display: block; width: 100%; }
      th { display: none; }
      td { border-bottom: 0; padding-bottom: 5px; }
      tr { display: block; padding: 8px 0; border-bottom: 1px solid var(--line); }
      tr:last-child { border-bottom: 0; }
    }
  </style>
</head>
<body>
  <header>
    <div class="wrap hero">
      <h1>SaaS Subscription Accounting API</h1>
      <p class="lead">A multi-tenant backend for subscription plans, customers, subscriptions, invoicing, payments, deferred revenue, revenue recognition, and financial reports.</p>
      <div class="status">
        <span class="pill">Status: running</span>
        <span class="pill">Stack: Node.js + TypeScript + Prisma</span>
        <span class="pill">Database: PostgreSQL</span>
        <span class="pill">API: REST</span>
      </div>
    </div>
  </header>
  <main class="wrap">
    <section>
      <h2>Core Endpoints</h2>
      <table>
        <thead><tr><th>Method</th><th>Path</th><th>Purpose</th></tr></thead>
        <tbody>
          <tr><td class="method">POST</td><td><code>/api/auth/register</code></td><td>Create a tenant and its admin user.</td></tr>
          <tr><td class="method">POST</td><td><code>/api/auth/login</code></td><td>Authenticate and receive a JWT token.</td></tr>
          <tr><td class="method">GET/POST/PUT/DELETE</td><td><code>/api/plans</code></td><td>Manage tenant subscription plans.</td></tr>
          <tr><td class="method">GET/POST/PUT/DELETE</td><td><code>/api/customers</code></td><td>Manage tenant customers.</td></tr>
          <tr><td class="method">GET/POST/PATCH</td><td><code>/api/subscriptions</code></td><td>Create and cancel subscriptions.</td></tr>
          <tr><td class="method">POST</td><td><code>/api/invoices/generate-monthly</code></td><td>Generate monthly invoices for active subscriptions.</td></tr>
          <tr><td class="method">POST</td><td><code>/api/invoices/:id/payments</code></td><td>Record a payment against an invoice.</td></tr>
          <tr><td class="method">POST</td><td><code>/api/invoices/recognize-revenue</code></td><td>Move deferred revenue into subscription revenue.</td></tr>
          <tr><td class="method">GET</td><td><code>/api/reports/income-statement</code></td><td>Report subscription revenue for a period.</td></tr>
          <tr><td class="method">GET</td><td><code>/api/reports/balance-sheet</code></td><td>Report cash, accounts receivable, and deferred revenue balances.</td></tr>
          <tr><td class="method">GET</td><td><code>/api/journal-entries</code></td><td>Inspect generated double-entry accounting journals.</td></tr>
        </tbody>
      </table>
    </section>

    <section>
      <h2>Accounting Flow</h2>
      <div class="grid">
        <article class="card accounting">
          <h3>Invoice Creation</h3>
          <p>Debit Accounts Receivable, credit Deferred Revenue. Revenue is not recognized immediately.</p>
        </article>
        <article class="card accounting">
          <h3>Payment Received</h3>
          <p>Debit Cash, credit Accounts Receivable. Invoice becomes paid when fully collected.</p>
        </article>
        <article class="card accounting">
          <h3>Revenue Recognition</h3>
          <p>Debit Deferred Revenue, credit Subscription Revenue at the end of the service period.</p>
        </article>
      </div>
    </section>

    <section>
      <h2>Design Decisions</h2>
      <div class="grid">
        <article class="card decision">
          <h3>Tenant Isolation</h3>
          <p>Authenticated routes scope operational and accounting records by <code>tenantId</code> from the JWT.</p>
        </article>
        <article class="card decision">
          <h3>Idempotent Billing</h3>
          <p>Monthly invoice generation is unique per tenant, subscription, and period.</p>
        </article>
        <article class="card decision">
          <h3>Balanced Journals</h3>
          <p>Journal entry creation rejects unbalanced debit and credit totals.</p>
        </article>
      </div>
    </section>

    <section>
      <h2>Quick Test</h2>
      <pre>curl http://localhost:3000/health

curl -X POST http://localhost:3000/api/auth/register \\
  -H "Content-Type: application/json" \\
  -d '{"tenantName":"Acme","tenantEmail":"billing@acme.test","adminName":"Admin","adminEmail":"admin@acme.test","password":"password123"}'</pre>
    </section>
  </main>
</body>
</html>`;
