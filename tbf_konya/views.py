from django.shortcuts import render
from django.http import HttpResponse, JsonResponse, FileResponse
import json
import os
from django.conf import settings


def login_view(request):
    """Login sayfası"""
    return render(request, 'login.html')


def index_view(request):
    """Ana uygulama sayfası"""
    return render(request, 'index.html')


def admin_view(request):
    """Admin paneli"""
    return render(request, 'admin.html')


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
