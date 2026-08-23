# Reciro Google Play Gonderim Paketi

Bu belge Google Play Console alanlarini doldurmak icin guncel kopyala-yapistir bilgisidir. Android Premium arayuzde gorunur; ancak Play urunleri ve RevenueCat baglantisi tamamlanip fiziksel cihazda dogrulanmadan Android surumu yuklenmemelidir.

## Uygulama Kimligi

- Uygulama adi: Reciro
- Paket adi: `com.dcanpolat.reciro`
- Kategori: Finans
- Iletisim e-postasi: `denizcanpolat2307@gmail.com`
- Gizlilik politikasi: https://reciro-receipt-analysis.onrender.com/privacy
- Destek: https://reciro-receipt-analysis.onrender.com/support
- Kosullar: https://reciro-receipt-analysis.onrender.com/terms

## Magaza Girisi (Turkce)

### Kisa aciklama

Fislerini tara, harcamalarini kaydet ve gunluk takibini kolaylastir.

### Tam aciklama

Reciro, fislerini ve harcamalarini elle tek tek yazmadan takip etmeni kolaylastirir.

Fis fotografi cekebilir, galeriden fis secebilir veya PDF belge ekleyebilirsin. Reciro yapay zeka ile magazayi, tarihi, toplam tutari, kategoriyi ve urunleri okumaya calisir. Sonucu kontrol eder, yanlis olan yerleri duzenler ve fisi arsivine kaydedersin.

Reciro harcamalarini ay, kategori, magaza ve urun bazinda duzenler. Boylece paran nereye gidiyor sorusuna daha sade ve hizli cevap alirsin.

One cikan ozellikler:

- Kamera, galeri veya PDF ile fis ekleme
- Yapay zeka ile magaza, tarih, toplam, kategori ve urun okuma
- Fis ayrintilarini kaydetmeden once duzenleme
- Aylik fis arsivi ve harcama raporlari
- Kategori, magaza ve urun bazinda inceleme
- Gelir, butce ve aylik odeme takibi
- Verileri disa aktarma ve kullanicinin kendi depolama alaninda yedekleme
- Turkce, Ingilizce, Fransizca, Almanca, Ispanyolca, Italyanca, Portekizce ve Hollandaca dil destegi

Not: Yapay zeka analizi her zaman kusursuz olmayabilir. Kaydetmeden once onemli tutar, tarih ve kategori bilgilerini kontrol etmen gerekir.

## Icerik Bildirimleri

- Uygulama giris bilgisi gerektirmez.
- Uygulama reklam icerir: odullu AdMob reklamlari sadece kullanici ek analiz kredisi istediginde gosterilebilir.
- Hedef kitle: 18+ yetiskinler; uygulama cocuklara yonelik degildir.
- Finansal ozellikler: kisisel harcama, butce ve fis takibi vardir. Bankacilik, kredi, menkul kiymet islemi, odeme transferi veya finansal danismanlik yoktur.
- Saglik veya resmi kurum uygulamasi degildir.

## Veri Guvenligi Ozeti

Uygulama islevi icin islenen veriler:

- Kullanici icerigi: fis fotograflari, PDF fisler, urun adlari, magaza adi, tutar, tarih ve kategoriler.
- Finansal bilgiler: kullanicinin girdigi gelir, butce ve harcama verileri.
- Iletisim: kullanici geri bildirim gonderirse destek mesaji.

Amaclar: fis analizi, harcama takibi, uygulama islevi ve kullanici destegi. Fisler ve finansal kayitlar varsayilan olarak cihazda tutulur. Kullanici yapay zeka analizi baslattiginda sectigi fis fotografi veya PDF, ayrintilari cikarmak amaciyla analiz hizmetine gonderilir. Reciro bu verileri satmaz ve fis icerigini reklam hedefleme icin kullanmaz.

Odullu reklamlar Google AdMob araciligiyla sunulabilir; Google teknik reklam verilerini kendi politikalarina gore isleyebilir. Kisisellestirilmis reklam veya kullanicilar arasi takip etkinlestirilirse bu beyan yeniden gozden gecirilmelidir.

## Android Premium Satin Alma Hazirligi

Premium acilmadan once su adimlar tamamlanmalidir:

1. Google Payments satici hesabi etkin olmalidir.
2. Play Console abonelikleri olusturulmalidir: `reciro_premium_monthly` ve `reciro_premium_yearly`.
3. RevenueCat Android uygulamasi, `Reciro Premium` entitlement'i ve aktif offering'i Play urunleriyle eslestirilmelidir.
4. RevenueCat Android genel SDK anahtari EAS ortam degiskeni `EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY` olarak tanimlanmalidir.
5. Satin alma ve satin almalari geri yukleme akisi fiziksel Android cihazda test edilmelidir.
