require('dotenv').config();
const bcrypt = require('bcryptjs');
const {pool} = require('../src/config/db');
(async () => {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password || password.length < 12) throw new Error('Set ADMIN_EMAIL and ADMIN_PASSWORD (minimum 12 characters).');
  const hash = await bcrypt.hash(password, 12);
  const result = await pool.query("INSERT INTO ministry_private.users (full_name,email,password,role,status) VALUES ($1,$2,$3,'admin','Active') ON CONFLICT (email) DO NOTHING RETURNING id", [process.env.ADMIN_NAME || 'Ministry Hub Administrator',email,hash]);
  if (!result.rowCount) throw new Error('Account already exists; no changes made.');
  console.log('Administrator created. Remove ADMIN_PASSWORD from the environment.');
})().catch(error => { console.error('Admin setup failed:', error.message); process.exitCode = 1; }).finally(() => pool.end());
