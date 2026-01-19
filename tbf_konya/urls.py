"""
URL configuration for tbf_konya project.
"""
from django.contrib import admin
from django.urls import path
from django.conf import settings
from django.conf.urls.static import static
from . import views

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', views.login_view, name='login'),
    path('login.html', views.login_view, name='login'),
    path('index.html', views.index_view, name='index'),
    path('admin.html', views.admin_view, name='admin_panel'),
    path('sorular.json', views.serve_json, {'filename': 'sorular.json'}, name='sorular_json'),
    path('isimler.json', views.serve_json, {'filename': 'isimler.json'}, name='isimler_json'),
    path('isimler.txt', views.serve_txt, {'filename': 'isimler.txt'}, name='isimler_txt'),
]

# Static files serving in development
if settings.DEBUG:
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATICFILES_DIRS[0])
