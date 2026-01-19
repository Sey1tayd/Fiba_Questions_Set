#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Soru 3'u CSV dosyasindan siler ve ID'leri yeniden numaralandirir
"""

import csv

def remove_question_3(csv_file):
    """Soru 3'u CSV dosyasindan siler"""
    rows = []
    
    with open(csv_file, 'r', encoding='utf-8-sig') as f:
        reader = csv.reader(f)
        header = next(reader)  # Header'i al
        
        for row in reader:
            if not row:  # Bos satir
                continue
                
            # Soru_ID'yi kontrol et
            if len(row) > 0 and row[0].strip():
                try:
                    soru_id = int(row[0])
                    if soru_id == 3:
                        # Soru 3'u atla
                        print(f"Soru 3 siliniyor...")
                        continue
                    elif soru_id > 3:
                        # Sonraki sorularin ID'sini 1 azalt
                        row[0] = str(soru_id - 1)
                except (ValueError, IndexError):
                    pass
            
            rows.append(row)
    
    # Yeni CSV dosyasini yaz
    with open(csv_file, 'w', encoding='utf-8-sig', newline='') as f:
        writer = csv.writer(f)
        writer.writerow(header)
        writer.writerows(rows)
    
    print(f"Toplam {len(rows)} soru kaldi (Soru 3 silindi ve ID'ler yeniden numaralandirildi)")
    return len(rows)

if __name__ == '__main__':
    remove_question_3('fiba_orneklerden_soru_bankasi_v4_azsikli.csv')
    print("JSON dosyasini yeniden olusturmak icin 'python csv_to_json.py' calistirin")
