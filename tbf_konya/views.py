from django.shortcuts import render
from django.http import HttpResponse, JsonResponse, FileResponse
import json
import os
from django.conf import settings
from pathlib import Path


def login_view(request):
    """Login sayfası"""
    html_path = Path(settings.BASE_DIR) / 'login.html'
    if html_path.exists():
        with open(html_path, 'r', encoding='utf-8') as f:
            return HttpResponse(f.read(), content_type='text/html; charset=utf-8')
    return HttpResponse('Login page not found', status=404)


def index_view(request):
    """Ana uygulama sayfası"""
    html_path = Path(settings.BASE_DIR) / 'index.html'
    if html_path.exists():
        with open(html_path, 'r', encoding='utf-8') as f:
            return HttpResponse(f.read(), content_type='text/html; charset=utf-8')
    return HttpResponse('Index page not found', status=404)


def admin_view(request):
    """Admin paneli"""
    html_path = Path(settings.BASE_DIR) / 'admin.html'
    if html_path.exists():
        with open(html_path, 'r', encoding='utf-8') as f:
            return HttpResponse(f.read(), content_type='text/html; charset=utf-8')
    return HttpResponse('Admin page not found', status=404)


def serve_json(request, filename):
    """JSON dosyalarını serve et"""
    try:
        file_path = os.path.join(settings.STATICFILES_DIRS[0], filename)
    except (IndexError, AttributeError):
        file_path = os.path.join(settings.BASE_DIR, 'static', filename)
    
    if os.path.exists(file_path):
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        return JsonResponse(data, safe=False, json_dumps_params={'ensure_ascii': False})
    return HttpResponse(f'File {filename} not found', status=404)


def serve_txt(request, filename):
    """TXT dosyalarını serve et"""
    try:
        file_path = os.path.join(settings.STATICFILES_DIRS[0], filename)
    except (IndexError, AttributeError):
        file_path = os.path.join(settings.BASE_DIR, 'static', filename)
    
    if os.path.exists(file_path):
        return FileResponse(open(file_path, 'rb'), content_type='text/plain; charset=utf-8')
    return HttpResponse(f'File {filename} not found', status=404)


def serve_image(request, filename):
    """Resim dosyalarını serve et"""
    # Önce kök dizinde ara
    file_path = Path(settings.BASE_DIR) / filename
    if not file_path.exists():
        # Sonra static klasöründe ara
        try:
            file_path = Path(settings.STATICFILES_DIRS[0]) / filename
        except (IndexError, AttributeError):
            file_path = Path(settings.BASE_DIR) / 'static' / filename
    
    if file_path.exists():
        content_type = 'image/jpeg' if filename.endswith('.jpeg') or filename.endswith('.jpg') else 'image/png'
        return FileResponse(open(file_path, 'rb'), content_type=content_type)
    return HttpResponse(f'File {filename} not found', status=404)
