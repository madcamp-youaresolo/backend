// src/db.js
require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // ssl: { rejectUnauthorized: false }  // 필요 시 SSL 옵션
});

module.exports = {
  query: (text, params) => pool.query(text, params),
};