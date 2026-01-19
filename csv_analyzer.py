#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
FIBA Soru Bankası CSV Analiz ve Düzenleme Aracı

Bu script CSV dosyasını analiz eder ve daha anlaşılır hale getirir.
"""

import csv
import json
from collections import Counter
from pathlib import Path

def analyze_csv(input_file):
    """CSV dosyasini analiz eder"""
    print(f"[ANALIZ] {input_file} dosyasi analiz ediliyor...\n")
    
    stats = {
        'toplam_soru': 0,
        'kategoriler': Counter(),
        'ornek_tipleri': Counter(),
        'sik_sayilari': Counter(),
        'bos_sutunlar': {},
        'sutunlar': []
    }
    
    with open(input_file, 'r', encoding='utf-8-sig') as f:
        reader = csv.DictReader(f)
        stats['sutunlar'] = reader.fieldnames
        
        for row in reader:
            stats['toplam_soru'] += 1
            stats['kategoriler'][row.get('Kategori', 'Belirsiz')] += 1
            stats['ornek_tipleri'][row.get('Ornek_Tipi', 'Belirsiz')] += 1
            stats['sik_sayilari'][row.get('Sik_Sayisi', '0')] += 1
            
            # Boş sütunları kontrol et
            for col in reader.fieldnames:
                if col not in stats['bos_sutunlar']:
                    stats['bos_sutunlar'][col] = 0
                if not row.get(col) or row.get(col).strip() == '':
                    stats['bos_sutunlar'][col] += 1
    
    return stats

def create_cleaned_csv(input_file, output_file):
    """Temizlenmis ve duzenlenmis CSV olusturur"""
    print(f"[TEMIZLEME] Temizlenmis CSV olusturuluyor: {output_file}\n")
    
    with open(input_file, 'r', encoding='utf-8-sig') as infile, \
         open(output_file, 'w', encoding='utf-8', newline='') as outfile:
        
        reader = csv.DictReader(infile)
        fieldnames = reader.fieldnames
        
        writer = csv.DictWriter(outfile, fieldnames=fieldnames, 
                               quoting=csv.QUOTE_MINIMAL, escapechar='\\')
        writer.writeheader()
        
        for row in reader:
            # Senaryo sütunundaki çok satırlı metinleri temizle
            if 'Senaryo' in row and row['Senaryo']:
                # Satır sonlarını boşluk ile değiştir (daha okunabilir)
                row['Senaryo'] = ' '.join(row['Senaryo'].splitlines())
            
            writer.writerow(row)

def print_stats(stats):
    """İstatistikleri yazdırır"""
    print("=" * 60)
    print("DOSYA ISTATISTIKLERI")
    print("=" * 60)
    print(f"\n[+] Toplam Soru Sayisi: {stats['toplam_soru']}")
    print(f"[+] Toplam Sutun Sayisi: {len(stats['sutunlar'])}")
    
    print("\nSUTUN ISIMLERI:")
    for i, col in enumerate(stats['sutunlar'], 1):
        print(f"  {i:2}. {col}")
    
    print("\nKATEGORI DAGILIMI:")
    for kategori, sayi in stats['kategoriler'].most_common():
        print(f"  - {kategori}: {sayi} soru")
    
    print("\nORNEK TIPI DAGILIMI:")
    for tip, sayi in stats['ornek_tipleri'].most_common():
        print(f"  - {tip}: {sayi} ornek")
    
    print("\nSIK SAYISI DAGILIMI:")
    for sik, sayi in sorted(stats['sik_sayilari'].items()):
        print(f"  - {sik} sik: {sayi} soru")
    
    print("\nBOS SUTUN ISTATISTIKLERI:")
    for sutun, bos_sayisi in stats['bos_sutunlar'].items():
        if bos_sayisi > 0:
            yuzde = (bos_sayisi / stats['toplam_soru']) * 100
            print(f"  - {sutun}: {bos_sayisi} bos ({yuzde:.1f}%)")

def generate_summary(stats, output_file='dosya_ozeti.json'):
    """JSON formatında özet oluşturur"""
    summary = {
        'toplam_soru': stats['toplam_soru'],
        'sutunlar': list(stats['sutunlar']),
        'kategoriler': dict(stats['kategoriler']),
        'ornek_tipleri': dict(stats['ornek_tipleri']),
        'sik_sayilari': dict(stats['sik_sayilari'])
    }
    
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(summary, f, ensure_ascii=False, indent=2)
    
    print(f"\n[KAYDET] Ozet JSON dosyasi olusturuldu: {output_file}")

if __name__ == '__main__':
    input_file = 'fiba_orneklerden_soru_bankasi_v4_azsikli.csv'
    output_file = 'fiba_orneklerden_soru_bankasi_v4_azsikli_TEMIZ.csv'
    
    # Analiz yap
    stats = analyze_csv(input_file)
    print_stats(stats)
    
    # Temizlenmiş CSV oluştur
    create_cleaned_csv(input_file, output_file)
    
    # Özet oluştur
    generate_summary(stats)
    
    print("\n" + "=" * 60)
    print("[TAMAMLANDI] Islem tamamlandi!")
    print("=" * 60)
