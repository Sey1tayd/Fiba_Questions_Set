#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
CSV'yi JSON formatina ceviren script
"""

import csv
import json

def csv_to_json(csv_file, json_file):
    """CSV dosyasini JSON formatina cevirir"""
    sorular = []
    
    with open(csv_file, 'r', encoding='utf-8-sig') as f:
        reader = csv.DictReader(f)
        for row in reader:
            # Senaryo metnini temizle ve formatla
            senaryo = row.get('Senaryo', '').strip()
            
            # Senaryodan sadece "Örnek X-Y:" veya "Diyagram X:" kısmından sonrasını al
            # Ornek format: "Madde X | X-Y\nAçıklama: ...\nÖrnek X-Y: ..."
            senaryo_metni = senaryo
            
            # Önce "Örnek" kelimesini ara
            if 'Örnek ' in senaryo:
                ornek_index = senaryo.find('Örnek ')
                if ornek_index != -1:
                    ornek_kismi = senaryo[ornek_index:]
                    # İki noktadan sonrasını al
                    if ':' in ornek_kismi:
                        senaryo_metni = ornek_kismi.split(':', 1)[1].strip()
            # "Diyagram" kelimesini ara (eğer Örnek yoksa)
            elif 'Diyagram' in senaryo:
                diyagram_index = senaryo.find('Diyagram')
                if diyagram_index != -1:
                    diyagram_kismi = senaryo[diyagram_index:]
                    if ':' in diyagram_kismi:
                        # "Diyagram Diyagram X:" gibi durumlar için
                        parts = diyagram_kismi.split(':', 1)
                        if len(parts) > 1:
                            senaryo_metni = parts[1].strip()
                        else:
                            senaryo_metni = diyagram_kismi.strip()
                    else:
                        senaryo_metni = diyagram_kismi.strip()
            
            # Şıkları hazırla
            siklar = []
            for sik in ['A', 'B', 'C', 'D']:
                sik_metni = row.get(sik, '').strip()
                if sik_metni:
                    siklar.append({
                        'harf': sik,
                        'metin': sik_metni
                    })
            
            soru = {
                'id': int(row.get('Soru_ID', 0)),
                'baslik': row.get('Baslik', '').strip(),
                'aciklama_no': row.get('Aciklama_No', '').strip(),
                'ornek_no': row.get('Ornek_No', '').strip(),
                'senaryo': senaryo_metni,
                'soru_metni': row.get('Soru', '').strip(),
                'kategori': row.get('Kategori', '').strip(),
                'siklar': siklar,
                'dogru_sik': row.get('Dogru_Sik', '').strip(),
                'dogru_cevap': row.get('Dogru_Cevap', '').strip(),
                'aciklama': row.get('Dogru_Cevap_Gerekce', '').strip() or row.get('Kaynak_Yorum', '').strip()
            }
            sorular.append(soru)
    
    with open(json_file, 'w', encoding='utf-8') as f:
        json.dump(sorular, f, ensure_ascii=False, indent=2)
    
    print(f"Toplam {len(sorular)} soru JSON dosyasina cevrildi: {json_file}")
    return sorular

if __name__ == '__main__':
    csv_to_json('fiba_orneklerden_soru_bankasi_v4_azsikli.csv', 'sorular.json')
