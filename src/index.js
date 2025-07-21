// src/index.js
require('dotenv').config();
const express = require('express');
const db      = require('./db');

const app = express();
app.use(express.json());

// 프로필 저장
app.post('/api/profiles', async (req, res) => {
  const { nickname, gender, resultType } = req.body;
  if (!nickname || !gender || !resultType) {
    return res.status(400).json({ error: '모든 필드를 입력해주세요.' });
  }
  try {
    const { rows } = await db.query(
      `INSERT INTO profiles (nickname, gender, result_type)
       VALUES ($1,$2,$3)
       RETURNING id, nickname, gender, result_type, created_at`,
      [nickname, gender, resultType]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '서버 오류' });
  }
});

// 통계 조회
app.get('/api/stats', async (req, res) => {
  try {
    const { rows: typeCounts } = await db.query(`
      SELECT result_type, COUNT(*) AS count
      FROM profiles
      GROUP BY result_type
    `);
    const { rows: genderType } = await db.query(`
      SELECT gender, result_type, COUNT(*) AS count
      FROM profiles
      GROUP BY gender, result_type
    `);
    res.json({ typeCounts, genderType });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '서버 오류' });
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Server on ${PORT}`));
