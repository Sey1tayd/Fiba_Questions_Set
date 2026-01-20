const express = require('express');
const path = require('path');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const fs = require('fs');

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
  
  // Users table (kurumsal sistem için)
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      username TEXT PRIMARY KEY,
      password_hash TEXT NOT NULL,
      full_name TEXT,
      email TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      approved_at TIMESTAMPTZ,
      approved_by TEXT
    );
  `);

  // İlk admin kullanıcısını oluştur (eğer yoksa)
  try {
    const adminCheck = await pool.query('SELECT username FROM users WHERE username = $1', ['admin']);
    if (adminCheck.rows.length === 0) {
      const adminPasswordHash = await bcrypt.hash('admin123', 10);
      await pool.query(
        `INSERT INTO users (username, password_hash, full_name, status, approved_at, approved_by)
         VALUES ($1, $2, $3, $4, NOW(), 'system')`,
        ['admin', adminPasswordHash, 'Sistem Yöneticisi', 'approved']
      );
      console.log('İlk admin kullanıcısı oluşturuldu (username: admin, password: admin123)');
    }
  } catch (err) {
    console.warn('Admin kullanıcısı oluşturulurken hata:', err.message);
  }

  // isimler.txt'deki isimleri veritabanına kaydet (listedeki kullanıcılar)
  try {
    const isimlerPath = path.join(__dirname, 'isimler.txt');
    if (fs.existsSync(isimlerPath)) {
      const isimlerContent = fs.readFileSync(isimlerPath, 'utf-8');
      const isimler = isimlerContent
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0);
      
      for (const isim of isimler) {
        const username = isim.toLowerCase().replace(/\s+/g, '_');
        const checkUser = await pool.query('SELECT username FROM users WHERE username = $1', [username]);
        if (checkUser.rows.length === 0) {
          // Listedeki kullanıcılar için özel password_hash (şifre yok, sadece listeden seçim)
          const listPasswordHash = await bcrypt.hash('LIST_USER_' + username, 10);
          await pool.query(
            `INSERT INTO users (username, password_hash, full_name, status, approved_at, approved_by)
             VALUES ($1, $2, $3, $4, NOW(), 'system')`,
            [username, listPasswordHash, isim, 'approved']
          );
        }
      }
      console.log(`isimler.txt'den ${isimler.length} kullanıcı veritabanına kaydedildi`);
    }
  } catch (err) {
    console.warn('isimler.txt yüklenirken hata:', err.message);
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

app.get('/signup.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'signup.html'));
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

// --- API: Kullanıcı Kayıt ve Giriş ---
app.post('/api/signup', async (req, res) => {
  if (!pool) return res.status(500).json({ error: 'Database bağlantısı yok' });
  const { username, password, fullName, email } = req.body || {};
  
  if (!username || typeof username !== 'string' || username.trim().length < 3) {
    return res.status(400).json({ error: 'Kullanıcı adı en az 3 karakter olmalı' });
  }
  if (!password || typeof password !== 'string' || password.length < 6) {
    return res.status(400).json({ error: 'Şifre en az 6 karakter olmalı' });
  }
  
  const cleanUsername = username.trim().toLowerCase();
  
  try {
    // Kullanıcı adı kontrolü
    const existing = await pool.query('SELECT username FROM users WHERE username = $1', [cleanUsername]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'Bu kullanıcı adı zaten kullanılıyor' });
    }
    
    const passwordHash = await bcrypt.hash(password, 10);
    await pool.query(
      `INSERT INTO users (username, password_hash, full_name, email, status)
       VALUES ($1, $2, $3, $4, 'pending')`,
      [cleanUsername, passwordHash, fullName || null, email || null]
    );
    
    res.json({ ok: true, message: 'Kayıt başarılı. Admin onayı bekleniyor.' });
  } catch (err) {
    console.error('POST /api/signup error', err);
    res.status(500).json({ error: 'Kayıt yapılamadı' });
  }
});

// Listedeki kullanıcıları getir
app.get('/api/list-users', async (req, res) => {
  if (!pool) return res.status(500).json({ error: 'Database bağlantısı yok' });
  try {
    // isimler.txt'den kullanıcıları oku
    const isimlerPath = path.join(__dirname, 'isimler.txt');
    if (!fs.existsSync(isimlerPath)) {
      return res.json([]);
    }
    
    const isimlerContent = fs.readFileSync(isimlerPath, 'utf-8');
    const isimler = isimlerContent
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);
    
    // Veritabanından bu kullanıcıları getir
    const listUsers = [];
    for (const isim of isimler) {
      const username = isim.toLowerCase().replace(/\s+/g, '_');
      const result = await pool.query(
        'SELECT username, full_name FROM users WHERE username = $1 AND status = $2',
        [username, 'approved']
      );
      if (result.rows.length > 0) {
        listUsers.push({
          username: result.rows[0].username,
          fullName: result.rows[0].full_name || isim
        });
      }
    }
    
    res.json(listUsers);
  } catch (err) {
    console.error('GET /api/list-users error', err);
    res.status(500).json({ error: 'Liste kullanıcıları alınamadı' });
  }
});

// Listedeki kullanıcılar için giriş (şifre gerektirmez)
app.post('/api/login-list', async (req, res) => {
  if (!pool) return res.status(500).json({ error: 'Database bağlantısı yok' });
  const { username } = req.body || {};
  
  if (!username) {
    return res.status(400).json({ error: 'Kullanıcı adı gerekli' });
  }
  
  const cleanUsername = username.trim().toLowerCase();
  
  try {
    // isimler.txt'den kontrol et
    const isimlerPath = path.join(__dirname, 'isimler.txt');
    if (!fs.existsSync(isimlerPath)) {
      return res.status(404).json({ error: 'Liste dosyası bulunamadı' });
    }
    
    const isimlerContent = fs.readFileSync(isimlerPath, 'utf-8');
    const isimler = isimlerContent
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);
    
    // Kullanıcı adını isimler.txt'deki bir isimle eşleştir
    const matchedName = isimler.find(isim => 
      isim.toLowerCase().replace(/\s+/g, '_') === cleanUsername
    );
    
    if (!matchedName) {
      return res.status(401).json({ error: 'Bu kullanıcı listede bulunamadı' });
    }
    
    // Veritabanından kullanıcıyı getir
    const result = await pool.query(
      'SELECT username, full_name, status FROM users WHERE username = $1',
      [cleanUsername]
    );
    
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Kullanıcı bulunamadı' });
    }
    
    const user = result.rows[0];
    
    if (user.status !== 'approved') {
      return res.status(403).json({ error: 'Kullanıcı onaylanmamış' });
    }
    
    res.json({
      ok: true,
      username: user.username,
      fullName: user.full_name,
      userType: 'user',
    });
  } catch (err) {
    console.error('POST /api/login-list error', err);
    res.status(500).json({ error: 'Giriş yapılamadı' });
  }
});

app.post('/api/login', async (req, res) => {
  if (!pool) return res.status(500).json({ error: 'Database bağlantısı yok' });
  const { username, password } = req.body || {};
  
  if (!username || !password) {
    return res.status(400).json({ error: 'Kullanıcı adı ve şifre gerekli' });
  }
  
  const cleanUsername = username.trim().toLowerCase();
  
  try {
    const result = await pool.query(
      'SELECT username, password_hash, status, full_name FROM users WHERE username = $1',
      [cleanUsername]
    );
    
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Kullanıcı adı veya şifre hatalı' });
    }
    
    const user = result.rows[0];
    
    if (user.status === 'pending') {
      return res.status(403).json({ error: 'Hesabınız henüz onaylanmadı. Lütfen admin onayı bekleyin.' });
    }
    
    if (user.status === 'rejected') {
      return res.status(403).json({ error: 'Hesabınız reddedildi. Lütfen admin ile iletişime geçin.' });
    }
    
    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Kullanıcı adı veya şifre hatalı' });
    }
    
    const isAdmin = cleanUsername === 'admin';
    res.json({
      ok: true,
      username: user.username,
      fullName: user.full_name,
      userType: isAdmin ? 'admin' : 'user',
    });
  } catch (err) {
    console.error('POST /api/login error', err);
    res.status(500).json({ error: 'Giriş yapılamadı' });
  }
});

// Admin: Bekleyen kullanıcıları listele
app.get('/api/admin/pending-users', async (req, res) => {
  if (!pool) return res.status(500).json({ error: 'Database bağlantısı yok' });
  try {
    const result = await pool.query(
      `SELECT username, full_name, email, created_at 
       FROM users 
       WHERE status = 'pending' 
       ORDER BY created_at ASC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error('GET /api/admin/pending-users error', err);
    res.status(500).json({ error: 'Bekleyen kullanıcılar alınamadı' });
  }
});

// Admin: Kullanıcı onayla/reddet
app.post('/api/admin/approve-user', async (req, res) => {
  if (!pool) return res.status(500).json({ error: 'Database bağlantısı yok' });
  const { username, action, approvedBy } = req.body || {}; // action: 'approve' veya 'reject'
  
  if (!username || !action || (action !== 'approve' && action !== 'reject')) {
    return res.status(400).json({ error: 'Geçersiz istek' });
  }
  
  try {
    const newStatus = action === 'approve' ? 'approved' : 'rejected';
    await pool.query(
      `UPDATE users 
       SET status = $1, approved_at = NOW(), approved_by = $2 
       WHERE username = $3`,
      [newStatus, approvedBy || 'admin', username]
    );
    res.json({ ok: true });
  } catch (err) {
    console.error('POST /api/admin/approve-user error', err);
    res.status(500).json({ error: 'İşlem yapılamadı' });
  }
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
