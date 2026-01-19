import csv
import openai
import time
import json
import sys
import io

# Windows konsol encoding sorununu çöz
if sys.platform == 'win32':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

# API key'i ayarla
API_KEY = "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"
client = openai.OpenAI(
    api_key=API_KEY,
    base_url="https://openrouter.ai/api/v1"
)

def generate_question_with_choices(baslik: str, aciklama_metin: str, ornek_metin: str, yorum: str) -> dict:
    """API kullanarak örnek metinden soru oluşturur ve yoruma göre yanıltıcı şıklar hazırlar."""
    
    prompt = f"""Sen bir basketbol hakemi eğitimi için soru hazırlayan bir uzmansın.

Başlık: {baslik}
Açıklama: {aciklama_metin}
Örnek Metin: {ornek_metin}
Yorum: {yorum}

Görevin:
1. Örnek metni doğrudan bir soru formatına dönüştür (örnek metindeki durumu soru olarak sor)
2. Yorum kısmına göre doğru cevabı belirle
3. Doğru cevabın yanında 3 yanıltıcı şık daha hazırla. Yanıltıcı şıklar, yorumun tersi veya benzer ama yanlış olan durumları içermeli.

Çıktı formatı (JSON):
{{
    "soru": "Örnek metinden oluşturulmuş soru metni",
    "sik_a": "Birinci şık",
    "sik_b": "İkinci şık",
    "sik_c": "Üçüncü şık",
    "sik_d": "Dördüncü şık",
    "dogru_cevap": "A" veya "B" veya "C" veya "D"
}}

Sadece JSON formatında cevap ver, başka açıklama ekleme."""

    try:
        response = client.chat.completions.create(
            model="openai/gpt-4o",
            messages=[
                {"role": "system", "content": "Sen bir basketbol kuralları uzmanısın ve eğitim soruları hazırlıyorsun. Sadece JSON formatında cevap veriyorsun."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            response_format={"type": "json_object"}
        )
        
        result = json.loads(response.choices[0].message.content)
        return result
        
    except Exception as e:
        print(f"  API Hatası: {str(e)[:100]}")
        return {
            "soru": f"{ornek_metin} - Bu durumda ne yapılmalıdır?",
            "sik_a": "Yorum: " + yorum if yorum else "Seçenek A",
            "sik_b": "Yanıltıcı seçenek 1",
            "sik_c": "Yanıltıcı seçenek 2",
            "sik_d": "Yanıltıcı seçenek 3",
            "dogru_cevap": "A"
        }

# Test için sadece ilk 20 geçerli soruyu işle
results = []
question_number = 1

print("İlk 20 soruyu işliyorum (test için)...\n")

with open("fiba_resmi_yorumlar_structured.csv", 'r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    
    for idx, row in enumerate(reader, start=1):
        if question_number > 20:
            break
            
        ornek_metin = row.get('Ornek_Metin', '')
        if not ornek_metin or ornek_metin.strip() == '' or ornek_metin == 'Fular tarzı kafa bandı örnekleri':
            continue
        
        print(f"{question_number}. İşleniyor...")
        
        generated = generate_question_with_choices(
            row.get('Baslik', ''),
            row.get('Aciklama_Metin', ''),
            ornek_metin,
            row.get('Yorum', '')
        )
        
        results.append({
            'Soru_No': question_number,
            'Baslik': row.get('Baslik', ''),
            'Aciklama_No': row.get('Aciklama_No', ''),
            'Aciklama_Metin': row.get('Aciklama_Metin', ''),
            'Ornek_Metin': ornek_metin,
            'Yorum': row.get('Yorum', ''),
            'Soru': generated.get('soru', ''),
            'Sik_A': generated.get('sik_a', ''),
            'Sik_B': generated.get('sik_b', ''),
            'Sik_C': generated.get('sik_c', ''),
            'Sik_D': generated.get('sik_d', ''),
            'Dogru_Cevap': generated.get('dogru_cevap', '')
        })
        
        question_number += 1
        time.sleep(0.5)

# Sonuçları kaydet
if results:
    fieldnames = ['Soru_No', 'Baslik', 'Aciklama_No', 'Aciklama_Metin', 
                 'Ornek_Metin', 'Yorum', 'Soru', 'Sik_A', 'Sik_B', 
                 'Sik_C', 'Sik_D', 'Dogru_Cevap']
    
    with open("fiba_sorular_ve_siklar_test.csv", 'w', encoding='utf-8', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(results)
    
    print(f"\n✓ {len(results)} soru test dosyasına kaydedildi: fiba_sorular_ve_siklar_test.csv")
