# FIBA Soru Bankası - Dosya Açıklaması

## 📋 Genel Bilgiler

Bu dosya, **FIBA (Uluslararası Basketbol Federasyonu)** kurallarına ait örneklerden oluşturulmuş bir soru bankasını içermektedir.

- **Toplam Soru Sayısı:** 425 soru
- **Dil:** Türkçe
- **Format:** CSV (Comma-Separated Values)

## 📑 Sütun Yapısı

Dosyada toplam **17 sütun** bulunmaktadır:

### 1. **Soru_ID**
- Soru için benzersiz kimlik numarası
- 1'den 425'e kadar numaralandırılmış

### 2. **Baslik**
- Sorunun ait olduğu FIBA kuralı madde başlığı
- Örnek: "Madde 4 Takımlar", "Madde 5 Sakatlanma ve yardım"

### 3. **Aciklama_No**
- İlgili FIBA kural maddesinin açıklama numarası
- Format: "X-Y" (örn: "4-1", "5-1")

### 4. **Ornek_No**
- Sorunun dayandığı örnek numarası
- Format: "X-Y" veya "Diyagram X" şeklinde

### 5. **Ornek_Tipi**
- Örnek türü: "Örnek" veya "Diyagram"

### 6. **Senaryo**
- Soruya ait senaryo açıklaması
- **NOT:** Bu sütun çok satırlı metin içerebilir (açıklama + örnek)
- Format: "Madde X | Açıklama-Y\nAçıklama: ...\nÖrnek X-Y: ..."

### 7. **Soru**
- Soru metni
- Genellikle: "Aşağıdaki örneğe göre bu durumda doğru karar hangisidir?"

### 8. **Kategori**
- Sorunun kategorisi/tipi
- Örnek kategoriler:
  - `statement`: Genel ifade/kural sorusu
  - `substitution`: Oyuncu değişikliği
  - `free_throws`: Serbest atış
  - `possession`: Top sahipliği
  - `shot_clock`: Şut saati

### 9. **Sik_Sayisi**
- Sorudaki şık sayısı (genellikle 2 veya 3)

### 10-13. **A, B, C, D**
- Şık metinleri (C ve D şıkları çoğu soruda boş olabilir)

### 14. **Dogru_Sik**
- Doğru şık (A, B, C veya D)

### 15. **Dogru_Cevap**
- Doğru cevabın tam metni

### 16. **Dogru_Cevap_Gerekce**
- Doğru cevabın gerekçesi/açıklaması
- Detaylı kural açıklaması içerir

### 17. **Kaynak_Yorum**
- Ek kaynak bilgisi veya yorum (çoğu soruda boş)

## 🎯 Kullanım Önerileri

### Excel/Google Sheets ile Açma
1. CSV dosyasını Excel'de açarken **Türkçe karakterleri** doğru görüntülemek için:
   - Excel: Veri > Metinden/Dış Veriden > UTF-8 kodlamayı seçin
   - Google Sheets: Dosya > İçe Aktar > Karakter kodlaması: UTF-8

### Python ile Okuma
```python
import csv

with open('fiba_orneklerden_soru_bankasi_v4_azsikli.csv', 'r', encoding='utf-8-sig') as f:
    reader = csv.DictReader(f)
    for row in reader:
        print(f"Soru {row['Soru_ID']}: {row['Baslik']}")
```

### Pandas ile Okuma
```python
import pandas as pd

df = pd.read_csv('fiba_orneklerden_soru_bankasi_v4_azsikli.csv', encoding='utf-8-sig')
print(df.head())
```

## ⚠️ Önemli Notlar

1. **Çok Satırlı Metinler:** `Senaryo` sütunu içinde satır sonları (newline) bulunabilir. CSV okuyucunuz bunu doğru şekilde işlemeli.

2. **Boş Hücreler:** Bazı sorularda C ve D şıkları boş olabilir (2 veya 3 şıklı sorular için).

3. **Özel Karakterler:** Dosya UTF-8 kodlamasında olduğundan Türkçe karakterler (ş, ğ, ü, ö, ı, ç) korunmuştur.

4. **BOM Karakteri:** Dosya başında BOM (Byte Order Mark) karakteri olabilir. Okuyucunuz `utf-8-sig` kodlamasını destekliyorsa otomatik olarak temizlenir.

## 🔍 Analiz Araçları

`csv_analyzer.py` scriptini kullanarak dosyayı analiz edebilirsiniz:

```bash
python csv_analyzer.py
```

Bu script:
- Dosya istatistiklerini gösterir
- Kategorilere göre dağılımı analiz eder
- Temizlenmiş bir CSV oluşturur
- JSON formatında özet üretir

## 📊 Veri Yapısı Özeti

- **425** soru
- **17** sütun
- **FIBA kuralları** kapsamında çeşitli konular
- Her soru bir **senaryo**, **soru metni**, **şıklar** ve **doğru cevap gerekçesi** içerir

## 📚 Kullanım Senaryoları

1. **Eğitim Materyali:** Basketbol hakem eğitimi için soru bankası
2. **Sınav Hazırlama:** FIBA hakem sınavları için pratik
3. **Kural Analizi:** FIBA kurallarının örneklerle incelenmesi
4. **Veri Analizi:** Soru tiplerine göre istatistiksel analiz
