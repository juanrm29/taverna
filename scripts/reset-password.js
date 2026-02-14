const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({ connectionString: 'postgresql://postgres.yecmpaoallzidwrhdcww:vd4xM4x3VRGOo1nr@aws-1-ap-south-1.pooler.supabase.com:5432/postgres' });

async function main() {
  const newPassword = 'admin123';
  const hash = await bcrypt.hash(newPassword, 12);
  const { rows } = await pool.query(
    'UPDATE users SET "passwordHash" = $1 WHERE email = $2 RETURNING email, role',
    [hash, 'test@taverna.gg']
  );
  console.log('Password reset done:', rows[0]);
  console.log('Login with: test@taverna.gg / admin123');
  await pool.end();
}
main().catch(console.error);
