#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Yeni CSV formatını JSON formatına çeviren script
fiba_sorular_ve_siklar.csv -> sorular.json
"""

import csv
import json
import sys
import io

# Windows konsol encoding sorununu çöz
if sys.platform == 'win32':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

def csv_to_json(csv_file, json_file):
    """CSV dosyasını JSON formatına çevirir"""
    sorular = []
    
    with open(csv_file, 'r', encoding='utf-8-sig') as f:
        reader = csv.DictReader(f)
        for idx, row in enumerate(reader, start=1):
            # Şıkları hazırla
            siklar = []
            for sik in ['A', 'B', 'C', 'D']:
                sik_metni = row.get(f'Sik_{sik}', '').strip()
                if sik_metni:
                    siklar.append({
                        'harf': sik,
                        'metin': sik_metni
                    })
            
            # Ornek_Metin soru metni olarak kullanılacak
            # Baslik, Aciklama_Metin, Yorum açıklama için saklanacak
            soru = {
                'id': idx,
                'baslik': row.get('Baslik', '').strip(),
                'aciklama_no': row.get('Aciklama_No', '').strip(),
                'aciklama_metin': row.get('Aciklama_Metin', '').strip(),
                'soru_metni': row.get('Ornek_Metin', '').strip(),  # Ornek_Metin soru olarak
                'yorum': row.get('Yorum', '').strip(),
                'siklar': siklar,
                'dogru_sik': row.get('Dogru_Cevap', '').strip().upper()
            }
            sorular.append(soru)
    
    with open(json_file, 'w', encoding='utf-8') as f:
        json.dump(sorular, f, ensure_ascii=False, indent=2)
    
    print(f"Toplam {len(sorular)} soru JSON dosyasına çevrildi: {json_file}")
    return sorular

if __name__ == '__main__':
    csv_to_json('fiba_sorular_ve_siklar.csv', 'sorular.json')