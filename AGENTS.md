# reciro Agent Guide

`reciro` gerçek kullanıcıları olan production bir Expo/React Native uygulamasıdır. Günlük geliştirme yalnızca `RECIRO-DEVELOPMENT` worktree’sinde (`codex/development`) yapılır; ana `Reciro`/`main` çalışma alanını değiştirmeyin.

## Working Rules

- Yeni bir task’a önce `docs/PROJECT_STATE.md` dosyasını okuyarak başlayın; sonra sadece görev için gerekli dosyaları inceleyin. Tüm repository’yi gereksiz yere yeniden taramayın.
- Çalışan özellikleri ve görev dışı dosyaları koruyun. Büyük refactor yalnızca açıkça istenirse yapılır.
- `.env`, credential, certificate, private key ve secret bilgilerini okumayın, değiştirmeyin veya commit etmeyin. İstemciye gizli anahtar eklemeyin.
- Değişiklik bitince göreve uygun testleri çalıştırın. Uygulama davranışını değiştiren işlerden sonra `docs/PROJECT_STATE.md` dosyasını kısa ve güncel tutun; günlük/geçmiş kayıt eklemeyin.
- Expo kodu yazmadan önce [Expo v57 belgelerini](https://docs.expo.dev/versions/v57.0.0/) okuyun.

## Common Commands

```powershell
npm install
npm run start
npm run check:config
npm run check:doctor
npm run check:ios-export
npm run backend:start
```

`check:ios-export` bir `dist-check/` export çıktısı üretir; bunu kaynak değişiklik olarak commit etmeyin. EAS build/submit veya App Store yayın işlemleri yalnızca açıkça istendiğinde yapılır.

## Task Completion Rules

- Verilen görevi baştan sona tamamla.
- Gerekli bir adım eksikse "sonra yaparız" deme; eksik adımı şimdi tamamla ve ana göreve devam et.
- Gerekli işleri sonraya, başka bir göreve veya follow-up'a bırakma.
- Kısmi çözümü tamamlanmış görev olarak kabul etme.
- Gerekli TODO, placeholder veya yarım kod bırakma.
- Bir hata veya başarısız test varsa mümkünse şimdi düzelt ve devam et.
- Görevi bitirmeden önce kullanıcının istediği her şeyin tamamlandığını kontrol et.
- Yalnızca kullanıcıdan bilgi, şifre, izin veya karar almadan gerçekten devam edemiyorsan dur ve tam olarak neye ihtiyaç olduğunu söyle.
