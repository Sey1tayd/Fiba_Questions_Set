# TBF Resmi Yorumlar

424 adet TBF Resmi Yorumlar/FIBA basketbol kuralları sorusunu interaktif şekilde çözmek için hazırlanmış web uygulaması.

## 📁 Proje Yapısı

```
TBF_KONYA/
├── index.html          # Ana uygulama sayfası
├── login.html          # Giriş sayfası
├── admin.html          # Admin paneli
├── server.js           # Node.js/Express server
├── package.json        # Node.js bağımlılıkları
├── railway.json        # Railway deployment konfigürasyonu
├── csv_to_json_new.py  # CSV'den JSON'a dönüştürme scripti
├── static/             # Statik dosyalar
│   ├── background.jpeg
│   ├── sorular.json
│   ├── isimler.json
│   └── isimler.txt
└── tbf_konya/          # Django proje dosyaları (gelecek kullanım için)
```

## 🚀 Kurulum ve Kullanım

### Gereksinimler

- Node.js (v14 veya üzeri)
- npm veya yarn

### Yerel Olarak Çalıştırma

**Node.js ile (Önerilen):**
```bash
# Bağımlılıkları yükle
npm install

# Sunucuyu başlat
npm start
```
Sunucu `http://localhost:3000` adresinde çalışacaktır.

**Not:** Python scriptleri için (CSV dönüştürme):
```bash
# Virtual environment oluştur (opsiyonel)
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Gerekli paketleri yükle
pip install -r requirements.txt
```

## ✨ Özellikler

- ✅ 424 soruyu sırayla çözme
- ✅ İlerleme çubuğu ile görsel takip
- ✅ Soru metni görüntüleme (Ornek_Metin)
- ✅ Rastgele karıştırılan şıklar (her soruda farklı sıra)
- ✅ Çoktan seçmeli şık seçimi
- ✅ Anında açıklama gösterimi (Başlık, Açıklama Metni, Yorum)
- ✅ Doğru/yanlış renklendirme
- ✅ İstatistik takibi (Doğru/Yanlış/Cevaplanan)
- ✅ Responsive tasarım
- ✅ Modern ve sade arayüz

## 🎯 Kullanım Akışı

1. Sayfa yüklendiğinde ilk soru otomatik gösterilir
2. Soru metni (Ornek_Metin) yalın şekilde görüntülenir
3. Şıklar her soruda rastgele sıralanır
4. Şıklardan birini seçin
5. Seçim yapıldığında açıklama otomatik gösterilir:
   - Başlık (Baslik)
   - Açıklama Metni (Aciklama_Metin)
   - Yorum (Yorum)
6. Doğru şık yeşil renkle, yanlış seçilen şık kırmızı renkle vurgulanır
7. "Sonraki Soru" butonu ile devam edin

## 📊 İstatistikler

Sayfanın altında anlık istatistikler görüntülenir:
- **Doğru**: Doğru cevaplanan soru sayısı
- **Yanlış**: Yanlış cevaplanan soru sayısı
- **Cevaplanan**: Toplam cevaplanan soru sayısı

## 🔄 Veri Güncelleme

Eğer CSV dosyasını güncellediyseniz, JSON dosyasını yeniden oluşturun:

```bash
python csv_to_json_new.py
```

Script, `fiba_sorular_ve_siklar.csv` dosyasını okuyup `static/sorular.json` dosyasını oluşturur.

## 🚀 Railway'de Deploy

Proje Railway için hazırlanmıştır. Deploy için:

1. **GitHub repository'yi hazırlayın:**
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin <your-github-repo-url>
git push -u origin main
```

2. **Railway'de deploy:**
   - Railway hesabınıza giriş yapın
   - Yeni proje oluşturun
   - "Deploy from GitHub repo" seçeneğini seçin
   - Repository'nizi bağlayın
   - Railway otomatik olarak `package.json` ve `railway.json` dosyalarını algılayacak
   - Node.js environment'ı otomatik kurulacak
   - Deploy başlatılacak

3. **Environment Variables (Opsiyonel):**
   - Railway dashboard'dan environment variables ekleyebilirsiniz
   - `PORT` değişkeni otomatik olarak Railway tarafından ayarlanır

4. **Health Check:**
   - Uygulama `/health` endpoint'i ile health check yapılabilir
   - Railway otomatik olarak bu endpoint'i kullanır

## 💻 Tarayıcı Desteği

- Chrome (önerilir)
- Firefox
- Edge
- Safari

## 📝 Notlar

- Sorular sırayla gösterilir
- Şıklar her soruda rastgele karıştırılır
- Tüm soruları tamamladıktan sonra özet ekranı gösterilir
- Sayfa yenilendiğinde ilerleme sıfırlanır (kalıcı kayıt yoktur)
- Uygulama Node.js/Express server ile çalışır
- Django dosyaları gelecekte kullanılmak üzere korunmuştur ancak Railway deployment'ı Node.js kullanır

## 🔧 Teknik Detaylar

- **Backend:** Node.js + Express
- **Frontend:** Vanilla JavaScript, HTML5, CSS3
- **Deployment:** Railway.app
- **Port:** Environment variable'dan alınır (Railway otomatik ayarlar)

## 🎨 Özelleştirme

`index.html` dosyasındaki CSS bölümünü düzenleyerek renkleri, fontları ve düzeni özelleştirebilirsiniz.

## 📞 Destek

Sorun yaşarsanız veya önerileriniz varsa lütfen iletişime geçin.
