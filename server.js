const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Statik dosyaları serve et (HTML, CSS, JS, JSON, resimler)
app.use(express.static(__dirname));

// Tüm route'ları index.html'e yönlendir (SPA için)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
