const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://postgres.yecmpaoallzidwrhdcww:vd4xM4x3VRGOo1nr@aws-1-ap-south-1.pooler.supabase.com:5432/postgres' });

async function main() {
  const { rows } = await pool.query('SELECT id, email, "displayName", "passwordHash", role FROM users LIMIT 5');
  rows.forEach(u => console.log(u.email, '| role:', u.role, '| has password:', !!u.passwordHash));
  await pool.end();
}
main().catch(console.error);
