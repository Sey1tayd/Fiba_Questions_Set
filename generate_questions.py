import csv
import openai
import time
import json
import sys
import io
from typing import Dict, List

# Windows konsol encoding sorununu çöz
if sys.platform == 'win32':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

# API key'i ayarla
API_KEY = "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"
# OpenRouter API kullanılıyor (sk-or-v1 prefix'i OpenRouter'ı gösteriyor)
client = openai.OpenAI(
    api_key=API_KEY,
    base_url="https://openrouter.ai/api/v1"
)

def generate_question_with_choices(baslik: str, aciklama_metin: str, ornek_metin: str, yorum: str) -> Dict:
    """
    API kullanarak örnek metinden soru oluşturur ve yoruma göre yanıltıcı şıklar hazırlar.
    """
    
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
            model="openai/gpt-4o",  # OpenRouter için model formatı (openai/ prefix ile)
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
        print(f"API Hatası (satır için): {str(e)}")
        import traceback
        traceback.print_exc()
        # Hata durumunda varsayılan değerler
        return {
            "soru": f"{ornek_metin} - Bu durumda ne yapılmalıdır?",
            "sik_a": "Yorum: " + yorum if yorum else "Seçenek A",
            "sik_b": "Yanıltıcı seçenek 1",
            "sik_c": "Yanıltıcı seçenek 2",
            "sik_d": "Yanıltıcı seçenek 3",
            "dogru_cevap": "A"
        }

def save_results(results: List[Dict], output_file: str):
    """Sonuçları CSV'ye kaydeder"""
    if not results:
        return
    
    fieldnames = ['Soru_No', 'Baslik', 'Aciklama_No', 'Aciklama_Metin', 
                 'Ornek_Metin', 'Yorum', 'Soru', 'Sik_A', 'Sik_B', 
                 'Sik_C', 'Sik_D', 'Dogru_Cevap']
    
    with open(output_file, 'w', encoding='utf-8', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(results)

def process_csv(input_file: str, output_file: str):
    """
    CSV dosyasını okuyup her satır için soru oluşturur ve yeni CSV'ye kaydeder.
    """
    results = []
    question_number = 1  # Soru numarası 1'den başlayacak
    
    try:
        with open(input_file, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            rows = list(reader)
            total_rows = len(rows)
            
            print(f"Toplam {total_rows} satır bulundu. İşlem başlatılıyor...\n")
            
            for idx, row in enumerate(rows, start=1):
                print(f"İşleniyor: {idx}/{total_rows} - {row.get('Baslik', 'N/A')[:50]}...")
                
                baslik = row.get('Baslik', '')
                aciklama_no = row.get('Aciklama_No', '')
                aciklama_metin = row.get('Aciklama_Metin', '')
                ornek_metin = row.get('Ornek_Metin', '')
                yorum = row.get('Yorum', '')
                
                # Eğer örnek metin yoksa veya boşsa, bu satırı atla
                if not ornek_metin or ornek_metin.strip() == '' or ornek_metin == 'Fular tarzı kafa bandı örnekleri':
                    print(f"  Satır {idx} atlandı: Örnek metin yok veya geçersiz")
                    continue
                
                # API ile soru ve şıkları oluştur
                generated = generate_question_with_choices(
                    baslik, aciklama_metin, ornek_metin, yorum
                )
                
                # Sonuçları kaydet
                results.append({
                    'Soru_No': question_number,
                    'Baslik': baslik,
                    'Aciklama_No': aciklama_no,
                    'Aciklama_Metin': aciklama_metin,
                    'Ornek_Metin': ornek_metin,
                    'Yorum': yorum,
                    'Soru': generated.get('soru', ''),
                    'Sik_A': generated.get('sik_a', ''),
                    'Sik_B': generated.get('sik_b', ''),
                    'Sik_C': generated.get('sik_c', ''),
                    'Sik_D': generated.get('sik_d', ''),
                    'Dogru_Cevap': generated.get('dogru_cevap', '')
                })
                
                question_number += 1
                
                # Her 10 soruda bir ilerlemeyi kaydet
                if len(results) % 10 == 0:
                    save_results(results, output_file)
                    print(f"  → İlerleme kaydedildi ({len(results)} soru)")
                
                # API rate limit için kısa bir bekleme
                time.sleep(0.5)
                
                # 425 soruya ulaşıldığında dur
                if question_number > 425:
                    print(f"\n425 soruya ulaşıldı. İşlem durduruluyor.")
                    break
    
    except FileNotFoundError:
        print(f"HATA: {input_file} dosyası bulunamadı!")
        return
    except Exception as e:
        print(f"HATA: {str(e)}")
        import traceback
        traceback.print_exc()
        return
    
    # Sonuçları CSV'ye kaydet
    if results:
        save_results(results, output_file)
        print(f"\n✓ Toplam {len(results)} soru başarıyla oluşturuldu ve {output_file} dosyasına kaydedildi.")
    else:
        print("✗ Hiç soru oluşturulamadı!")

if __name__ == "__main__":
    input_file = "fiba_resmi_yorumlar_structured.csv"
    output_file = "fiba_sorular_ve_siklar.csv"
    
    print("Soru oluşturma işlemi başlatılıyor...")
    print("Bu işlem biraz zaman alabilir (425 soru için yaklaşık 5-7 dakika)...\n")
    print("İlerleme her 10 soruda bir kaydedilecek.\n")
    
    process_csv(input_file, output_file)
