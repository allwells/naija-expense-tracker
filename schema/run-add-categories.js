import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const queries = [
  "ALTER TYPE expense_category ADD VALUE IF NOT EXISTS 'loan_repayment'",
  "ALTER TYPE expense_category ADD VALUE IF NOT EXISTS 'gift'",
  "ALTER TYPE expense_category ADD VALUE IF NOT EXISTS 'groceries'",
  "ALTER TYPE expense_category ADD VALUE IF NOT EXISTS 'reimbursement'",
  "ALTER TYPE expense_category ADD VALUE IF NOT EXISTS 'transport'",
  "ALTER TYPE expense_category ADD VALUE IF NOT EXISTS 'education'",
  "ALTER TYPE expense_category ADD VALUE IF NOT EXISTS 'healthcare'",
  "ALTER TYPE expense_category ADD VALUE IF NOT EXISTS 'personal_care'",
  "ALTER TYPE expense_category ADD VALUE IF NOT EXISTS 'clothing'",
  "ALTER TYPE expense_category ADD VALUE IF NOT EXISTS 'household'",
  "ALTER TYPE expense_category ADD VALUE IF NOT EXISTS 'charity'",
  "ALTER TYPE expense_category ADD VALUE IF NOT EXISTS 'taxes_levies'",
  "ALTER TYPE expense_category ADD VALUE IF NOT EXISTS 'entertainment'",
  "ALTER TYPE expense_category ADD VALUE IF NOT EXISTS 'savings_investment'",
];

async function run() {
  for (const q of queries) {
    try {
      await pool.query(q);
      console.log(`Ran: ${q}`);
    } catch (e) {
      console.error(`Error on ${q}:`, e.message);
    }
  }
  pool.end();
}

run();
