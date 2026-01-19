from django.shortcuts import render, redirect
from django.contrib.auth import authenticate, login
from django.contrib import messages

def login_view(request):
    # Giriş yapmış kullanıcılar için kontrol kaldırıldı - her zaman login sayfasını göster
    # Eğer giriş yapmışsa ve admin'e gitmek isterse direkt /admin/ URL'ini kullanabilir
    
    if request.method == 'POST':
        username = request.POST.get('username')
        password = request.POST.get('password')
        
        user = authenticate(request, username=username, password=password)
        
        if user is not None:
            login(request, user)
            messages.success(request, 'Başarıyla giriş yaptınız!')
            # Girişten sonra ana sayfaya (index.html) yönlendir
            return redirect('/')
        else:
            messages.error(request, 'Kullanıcı adı veya şifre hatalı!')
    
    return render(request, 'accounts/login.html')
