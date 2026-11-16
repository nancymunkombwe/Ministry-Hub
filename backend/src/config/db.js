const { Pool, types } = require('pg');
require('dotenv').config();
if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required');
const url = new URL(process.env.DATABASE_URL);
// Explicit TLS options take precedence; strip URL options that could override them.
for (const key of ['sslmode','sslcert','sslkey','sslrootcert']) url.searchParams.delete(key);
const ssl = process.env.NODE_ENV === 'production' || process.env.DB_SSL === 'true'
    ? { rejectUnauthorized: true, ...(process.env.PG_CA_BASE64 ? {ca: Buffer.from(process.env.PG_CA_BASE64, 'base64').toString('utf8')} : {}) }
    : false;
types.setTypeParser(1082, value => value); // keep dates as YYYY-MM-DD
const pool = new Pool({connectionString: url.toString(), ssl, max: 5,
    connectionTimeoutMillis: 15000});
pool.on('error', error => console.error('Database pool error:', error.code));
function convert(sql) {
    let index = 0;
    // Existing controllers use fixed SQL strings and bound parameters.
    sql = sql.replace(/'(?:''|[^'])*'|\?/g, part => part === '?' ? `$${++index}` : part);
    if (/^\s*INSERT\s+INTO\b/i.test(sql) && !/\bRETURNING\b/i.test(sql)) sql = sql.trim().replace(/;$/, '') + ' RETURNING id';
    return sql;
}
async function run(sql, values = []) {
    const client = await pool.connect();
    let result;
    try {
        await client.query('SET search_path TO ministry_private, pg_catalog');
        await client.query("SET TIME ZONE 'Africa/Lusaka'");
        result = await client.query(convert(sql), values);
    } finally { client.release(); }
    if (result.command === 'SELECT') return result.rows;
    return { affectedRows: result.rowCount, insertId: result.rows[0]?.id };
}
function query(sql, values, callback) {
    if (typeof values === 'function') { callback = values; values = []; }
    run(sql, values).then(result => callback(null, result), error => callback(error));
}
module.exports = { query, promise: () => ({query: async (sql, values) => [await run(sql, values)]}), pool };
