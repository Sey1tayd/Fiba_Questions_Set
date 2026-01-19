# TBF Resmi Yorumlar

424 adet TBF Resmi Yorumlar/FIBA basketbol kuralları sorusunu interaktif şekilde çözmek için hazırlanmış web uygulaması.

## 📁 Dosyalar

- **index.html** - Ana web uygulaması sayfası
- **sorular.json** - Soruların JSON formatında verileri
- **background.jpeg** - Arka plan görseli
- **csv_to_json.py** - CSV'den JSON'a dönüştürme scripti
- **fiba_orneklerden_soru_bankasi_v4_azsikli.csv** - Orijinal CSV dosyası

## 🚀 Kullanım

### Yerel Olarak Çalıştırma

**Node.js ile (Önerilen):**
```bash
npm install
npm start
```
Sonra tarayıcıda: `http://localhost:3000`

**Python ile:**
```bash
python -m http.server 8000
```
Sonra tarayıcıda: `http://localhost:8000`

**VS Code Live Server eklentisi** kullanarak da açabilirsiniz.

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

## 🚀 Railway'de Deploy

Projeyi Railway'e deploy etmek için:

1. GitHub repository'yi hazırlayın:
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/Sey1tayd/Fiba_Questions_Set.git
git push -u origin main
```

2. Railway'de:
   - Yeni proje oluşturun
   - GitHub repository'yi bağlayın
   - Railway otomatik olarak Node.js projesini algılayacak ve deploy edecek

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

## 🎨 Özelleştirme

`index.html` dosyasındaki CSS bölümünü düzenleyerek renkleri, fontları ve düzeni özelleştirebilirsiniz.

## 📞 Destek

Sorun yaşarsanız veya önerileriniz varsa lütfen iletişime geçin.
