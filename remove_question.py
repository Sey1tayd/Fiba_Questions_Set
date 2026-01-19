#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Soru 3'ü CSV dosyasından siler
"""

import csv

def remove_question_3(csv_file):
    """Soru 3'ü CSV dosyasından siler"""
    rows = []
    current_row = []
    in_multiline_field = False
    
    with open(csv_file, 'r', encoding='utf-8-sig') as f:
        reader = csv.reader(f)
        header = next(reader)  # Header'ı al
        
        for row in reader:
            # Soru_ID'yi kontrol et
            if row and len(row) > 0:
                try:
                    soru_id = int(row[0])
                    if soru_id == 3:
                        # Soru 3'ü atla
                        print(f"Soru 3 siliniyor: {row[0]}")
                        continue
                    elif soru_id > 3:
                        # Sonraki soruların ID'sini 1 azalt
                        row[0] = str(soru_id - 1)
                except (ValueError, IndexError):
                    pass
            
            rows.append(row)
    
    # Yeni CSV dosyasını yaz
    with open(csv_file, 'w', encoding='utf-8-sig', newline='') as f:
        writer = csv.writer(f)
        writer.writerow(header)
        writer.writerows(rows)
    
    print(f"Toplam {len(rows)} soru kaldi (Soru 3 silindi)")
    return len(rows)

if __name__ == '__main__':
    remove_question_3('fiba_orneklerden_soru_bankasi_v4_azsikli.csv')
    print("JSON dosyasını yeniden oluşturmak için 'python csv_to_json.py' çalıştırın")
