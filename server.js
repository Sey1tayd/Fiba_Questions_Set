const express = require('express');
const path = require('path');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// PostgreSQL connection (Railway DATABASE_URL)
const connectionString = process.env.DATABASE_URL;
const pool = connectionString
  ? new Pool({
      connectionString,
      ssl: connectionString.includes('localhost') ? false : { rejectUnauthorized: false },
    })
  : null;

async function initDb() {
  if (!pool) {
    console.warn('DATABASE_URL yok, DB bağlantısı yapılmadı.');
    return;
  }
  await pool.query(`
    CREATE TABLE IF NOT EXISTS user_stats (
      user_name TEXT PRIMARY KEY,
      correct INTEGER NOT NULL DEFAULT 0,
      incorrect INTEGER NOT NULL DEFAULT 0,
      total INTEGER NOT NULL DEFAULT 0,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
}

// Statik dosyaları serve et (HTML, CSS, JS, JSON, resimler, txt)
app.use(express.static(__dirname));

// Static klasörünü özel olarak serve et
app.use('/static', express.static(path.join(__dirname, 'static')));

// Ana sayfa için login.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'login.html'));
});

// Diğer route'lar için ilgili dosyaları serve et
app.get('/index.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/login.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'login.html'));
});

app.get('/admin.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin.html'));
});

// JSON endpoint'leri
app.get('/sorular.json', (req, res) => {
  res.sendFile(path.join(__dirname, 'static', 'sorular.json'));
});

app.get('/isimler.json', (req, res) => {
  res.sendFile(path.join(__dirname, 'static', 'isimler.json'));
});

app.get('/isimler.txt', (req, res) => {
  res.sendFile(path.join(__dirname, 'static', 'isimler.txt'));
});

// Health check endpoint for Railway
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// --- API: Kullanıcı istatistikleri ---
app.get('/api/stats/:user', async (req, res) => {
  if (!pool) return res.status(500).json({ error: 'Database bağlantısı yok' });
  const user = req.params.user;
  try {
    const result = await pool.query(
      'SELECT user_name, correct, incorrect, total FROM user_stats WHERE user_name = $1',
      [user]
    );
    if (result.rows.length === 0) {
      return res.json({ user, correct: 0, incorrect: 0, total: 0 });
    }
    const row = result.rows[0];
    res.json({
      user: row.user_name,
      correct: row.correct,
      incorrect: row.incorrect,
      total: row.total,
    });
  } catch (err) {
    console.error('GET /api/stats error', err);
    res.status(500).json({ error: 'İstatistik okunamadı' });
  }
});

app.get('/api/stats', async (_req, res) => {
  if (!pool) return res.status(500).json({ error: 'Database bağlantısı yok' });
  try {
    const result = await pool.query(
      'SELECT user_name, correct, incorrect, total, updated_at FROM user_stats ORDER BY user_name ASC'
    );
    res.json(result.rows);
  } catch (err) {
    console.error('GET /api/stats(all) error', err);
    res.status(500).json({ error: 'İstatistikler okunamadı' });
  }
});

app.post('/api/stats', async (req, res) => {
  if (!pool) return res.status(500).json({ error: 'Database bağlantısı yok' });
  const { user, correct = 0, incorrect = 0, total = 0 } = req.body || {};
  if (!user || typeof user !== 'string') {
    return res.status(400).json({ error: 'user gerekli' });
  }
  try {
    await pool.query(
      `
        INSERT INTO user_stats (user_name, correct, incorrect, total, updated_at)
        VALUES ($1, $2, $3, $4, NOW())
        ON CONFLICT (user_name)
        DO UPDATE SET correct = EXCLUDED.correct,
                      incorrect = EXCLUDED.incorrect,
                      total = EXCLUDED.total,
                      updated_at = NOW();
      `,
      [user, correct, incorrect, total]
    );
    res.json({ ok: true });
  } catch (err) {
    console.error('POST /api/stats error', err);
    res.status(500).json({ error: 'İstatistik kaydedilemedi' });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`);
  initDb().catch((err) => console.error('DB init error', err));
});
