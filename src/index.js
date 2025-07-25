// src/index.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const db = require('./db');

const app = express();

app.use(cors({
  origin: ['http://localhost:5173', 'https://you-are-solo.netlify.app'],
  credentials: true
}));
app.use(express.json());

// 프로필 저장
app.post('/api/profiles', async (req, res) => {
  const { nickname, gender, resultType } = req.body;
  if (!nickname || !gender || !resultType) {
    return res.status(400).json({ error: '모든 필드를 입력해주세요.' });
  }
  try {
    const { rows:[profile] } = await db.query(
      `INSERT INTO profiles (nickname, gender)
       VALUES ($1,$2) RETURNING id`, [nickname, gender]
    );

    for (let name of resultType) {
      const { rows:[t] } = await db.query(
        `INSERT INTO types (name) VALUES ($1)
        ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
        RETURNING id`, [name]
    );
    const typeId = t ? t.id : (
        await db.query(`SELECT id FROM types WHERE name = $1`, [name])
      ).rows[0].id;
    await db.query(
      `INSERT INTO profile_types (profile_id, type_id)
       VALUES ($1, $2)`, [profile.id, t.id]
      );
  }
  return res.status(201).json({
      message: '프로필 저장완료',
      profileId: profile.id
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '서버 오류' });
  }
});

app.get('/api/stats', async (req, res) => {
  try {
    const { rows: typeCounts } = await db.query(`
      SELECT
      p.gender,
      t.name   AS result_type,
      COUNT(*) AS count
      FROM profile_types pt
      JOIN profiles p    ON pt.profile_id = p.id
      JOIN types t       ON pt.type_id    = t.id
      GROUP BY p.gender, t.name
      ORDER BY p.gender, COUNT(*) DESC;
    `);

    res.json({ typeCounts });   // → [{ gender:'female', result_type:'영숙', count:5 }, …]
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '서버 오류' });
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, '0.0.0.0', () => console.log(`Server on ${PORT}`));