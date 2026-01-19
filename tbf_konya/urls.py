"""
URL configuration for tbf_konya project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/6.0/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from django.views.static import serve
from django.conf import settings
from django.conf.urls.static import static
from django.http import FileResponse
from pathlib import Path

def home_view(request):
    """Ana sayfa - index.html'i gösterir"""
    index_path = Path(settings.BASE_DIR) / 'index.html'
    if index_path.exists():
        return FileResponse(open(index_path, 'rb'), content_type='text/html')
    else:
        from django.http import HttpResponse
        return HttpResponse('<h1>index.html bulunamadı</h1>', status=404)

def serve_json(request, filename):
    """JSON dosyalarını serve eder (sorular.json için)"""
    json_path = Path(settings.BASE_DIR) / filename
    if json_path.exists():
        return FileResponse(open(json_path, 'rb'), content_type='application/json')
    else:
        from django.http import HttpResponse
        return HttpResponse(f'<h1>{filename} bulunamadı</h1>', status=404)

urlpatterns = [
    path('admin/', admin.site.urls),
    path('accounts/', include('accounts.urls')),
    path('sorular.json', serve_json, {'filename': 'sorular.json'}),
    path('background.jpeg', serve, {'document_root': settings.BASE_DIR, 'path': 'background.jpeg'}),
    path('', home_view, name='home'),
]

# Static dosyalarını serve et (DEBUG modunda)
if settings.DEBUG:
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATICFILES_DIRS[0] if settings.STATICFILES_DIRS else None)
