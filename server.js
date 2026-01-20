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
      tests_completed INTEGER NOT NULL DEFAULT 0,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  // Migration: tests_completed kolonunu ekle (eğer yoksa)
  try {
    await pool.query(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'user_stats' AND column_name = 'tests_completed'
        ) THEN
          ALTER TABLE user_stats ADD COLUMN tests_completed INTEGER NOT NULL DEFAULT 0;
        END IF;
      END $$;
    `);
  } catch (err) {
    console.warn('Migration hatası (tests_completed):', err.message);
  }

  await pool.query(`
    CREATE TABLE IF NOT EXISTS user_question_stats (
      user_name TEXT NOT NULL,
      question_index INTEGER NOT NULL,
      attempts INTEGER NOT NULL DEFAULT 0,
      correct_count INTEGER NOT NULL DEFAULT 0,
      wrong_count INTEGER NOT NULL DEFAULT 0,
      last_selected TEXT,
      last_correct TEXT,
      last_is_correct BOOLEAN,
      last_attempt_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      PRIMARY KEY (user_name, question_index)
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
      return res.json({ user, correct: 0, incorrect: 0, total: 0, tests_completed: 0 });
    }
    const row = result.rows[0];
    res.json({
      user: row.user_name,
      correct: row.correct,
      incorrect: row.incorrect,
      total: row.total,
      tests_completed: row.tests_completed || 0,
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
      'SELECT user_name, correct, incorrect, total, tests_completed, updated_at FROM user_stats ORDER BY user_name ASC'
    );
    res.json(result.rows);
  } catch (err) {
    console.error('GET /api/stats(all) error', err);
    res.status(500).json({ error: 'İstatistikler okunamadı' });
  }
});

app.post('/api/stats', async (req, res) => {
  if (!pool) return res.status(500).json({ error: 'Database bağlantısı yok' });
  const { user, correct = 0, incorrect = 0, total = 0, tests_completed } = req.body || {};
  if (!user || typeof user !== 'string') {
    return res.status(400).json({ error: 'user gerekli' });
  }
  try {
    const setTestsCompleted =
      typeof tests_completed === 'number' && Number.isFinite(tests_completed) ? tests_completed : null;
    await pool.query(
      `
        INSERT INTO user_stats (user_name, correct, incorrect, total, tests_completed, updated_at)
        VALUES ($1, $2, $3, $4, COALESCE($5, 0), NOW())
        ON CONFLICT (user_name)
        DO UPDATE SET correct = EXCLUDED.correct,
                      incorrect = EXCLUDED.incorrect,
                      total = EXCLUDED.total,
                      tests_completed = COALESCE($5, user_stats.tests_completed),
                      updated_at = NOW();
      `,
      [user, correct, incorrect, total, setTestsCompleted]
    );
    res.json({ ok: true });
  } catch (err) {
    console.error('POST /api/stats error', err);
    res.status(500).json({ error: 'İstatistik kaydedilemedi' });
  }
});

// Per-question attempt logging (admin detayları için)
app.post('/api/attempt', async (req, res) => {
  if (!pool) return res.status(500).json({ error: 'Database bağlantısı yok' });
  const { user, questionIndex, selected, correct: correctOption, isCorrect } = req.body || {};
  if (!user || typeof user !== 'string') return res.status(400).json({ error: 'user gerekli' });
  if (typeof questionIndex !== 'number' || !Number.isFinite(questionIndex))
    return res.status(400).json({ error: 'questionIndex gerekli' });

  const qIndex = Math.trunc(questionIndex);
  const isCorrectBool = !!isCorrect;
  const selectedStr = typeof selected === 'string' ? selected : null;
  const correctStr = typeof correctOption === 'string' ? correctOption : null;

  try {
    await pool.query(
      `
        INSERT INTO user_question_stats
          (user_name, question_index, attempts, correct_count, wrong_count, last_selected, last_correct, last_is_correct, last_attempt_at)
        VALUES
          ($1, $2, 1, $3, $4, $5, $6, $7, NOW())
        ON CONFLICT (user_name, question_index)
        DO UPDATE SET
          attempts = user_question_stats.attempts + 1,
          correct_count = user_question_stats.correct_count + $3,
          wrong_count = user_question_stats.wrong_count + $4,
          last_selected = $5,
          last_correct = $6,
          last_is_correct = $7,
          last_attempt_at = NOW();
      `,
      [user, qIndex, isCorrectBool ? 1 : 0, isCorrectBool ? 0 : 1, selectedStr, correctStr, isCorrectBool]
    );
    res.json({ ok: true });
  } catch (err) {
    console.error('POST /api/attempt error', err);
    res.status(500).json({ error: 'Attempt kaydedilemedi' });
  }
});

// Test tamamlandı (kullanıcı kaç defa test bitirdi)
app.post('/api/sessionComplete', async (req, res) => {
  if (!pool) return res.status(500).json({ error: 'Database bağlantısı yok' });
  const { user } = req.body || {};
  if (!user || typeof user !== 'string') return res.status(400).json({ error: 'user gerekli' });
  try {
    await pool.query(
      `
        INSERT INTO user_stats (user_name, tests_completed, updated_at)
        VALUES ($1, 1, NOW())
        ON CONFLICT (user_name)
        DO UPDATE SET tests_completed = user_stats.tests_completed + 1,
                      updated_at = NOW();
      `,
      [user]
    );
    res.json({ ok: true });
  } catch (err) {
    console.error('POST /api/sessionComplete error', err);
    res.status(500).json({ error: 'Test tamamlandı kaydedilemedi' });
  }
});

// Admin detay: kullanıcı bazında soru istatistikleri
app.get('/api/admin/user/:user/details', async (req, res) => {
  if (!pool) return res.status(500).json({ error: 'Database bağlantısı yok' });
  const user = req.params.user;
  try {
    const summary = await pool.query(
      'SELECT user_name, correct, incorrect, total, tests_completed, updated_at FROM user_stats WHERE user_name = $1',
      [user]
    );
    const perQuestion = await pool.query(
      `
        SELECT user_name, question_index, attempts, correct_count, wrong_count, last_selected, last_correct, last_is_correct, last_attempt_at
        FROM user_question_stats
        WHERE user_name = $1
        ORDER BY wrong_count DESC, attempts DESC, question_index ASC
      `,
      [user]
    );
    res.json({
      summary: summary.rows[0] || { user_name: user, correct: 0, incorrect: 0, total: 0, tests_completed: 0 },
      perQuestion: perQuestion.rows,
    });
  } catch (err) {
    console.error('GET /api/admin/user/:user/details error', err);
    res.status(500).json({ error: 'Detay alınamadı' });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`);
  initDb().catch((err) => console.error('DB init error', err));
});
