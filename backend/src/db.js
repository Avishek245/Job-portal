import pg from 'pg';
const { Pool } = pg;

export const pool = new Pool({
  host: process.env.DATABASE_HOST,
  port: Number(process.env.DATABASE_PORT || 5432),
  database: process.env.DATABASE_NAME,
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD
});

export async function query(text, params = []) {
  return pool.query(text, params);
}
