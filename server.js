const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

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

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`);
});
