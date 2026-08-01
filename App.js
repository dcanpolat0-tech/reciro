import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  AppState,
  Image,
  KeyboardAvoidingView,
  Linking,
  Modal,
  PanResponder,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as Localization from 'expo-localization';
import * as ImageManipulator from 'expo-image-manipulator';
import * as Sharing from 'expo-sharing';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getMobileAdsModule } from './mobileAds';

const RECEIPTS_STORAGE_KEY = 'reciro.receipts.v2';
const SALARY_STORAGE_KEY = 'reciro.salary.v1';
const INCOME_BY_MONTH_STORAGE_KEY = 'reciro.incomeByMonth.v1';
const CURRENCY_STORAGE_KEY = 'reciro.currency.v1';
const AUTH_PROVIDER_STORAGE_KEY = 'reciro.authProvider.v1';
const ANALYSIS_USAGE_STORAGE_KEY = 'reciro.analysisUsage.v1';
const CATEGORY_MEMORY_STORAGE_KEY = 'reciro.categoryMemory.v1';
const BUDGETS_STORAGE_KEY = 'reciro.budgets.v1';
const RECURRING_EXPENSES_STORAGE_KEY = 'reciro.recurringExpenses.v1';
const ACTIVE_SPACE_STORAGE_KEY = 'reciro.activeSpace.v1';
const OTHER_CATEGORY_LABEL_STORAGE_KEY = 'reciro.otherCategoryLabel.v1';
const RECEIPT_SETTINGS_STORAGE_KEY = 'reciro.receiptSettings.v1';
const REWARDED_ANALYSIS_CREDITS_STORAGE_KEY = 'reciro.rewardedAnalysisCredits.v1';
const RECEIPT_IMAGE_DIR = `${FileSystem.documentDirectory}receipts/`;
const RECEIPT_FILE_DIR = `${FileSystem.documentDirectory}receipt-files/`;
const BACKUP_DIR = `${FileSystem.documentDirectory}backups/`;
const EXPORT_DIR = `${FileSystem.documentDirectory}exports/`;
const APP_CONFIG_EXTRA = Constants.expoConfig?.extra || Constants.manifest?.extra || {};
const DEFAULT_RECEIPT_ANALYSIS_ENDPOINT = 'https://reciro-receipt-analysis.onrender.com/analyze-receipt';
const RECEIPT_ANALYSIS_ENDPOINT =
  APP_CONFIG_EXTRA.receiptAnalysisUrl ||
  process.env.EXPO_PUBLIC_RECEIPT_ANALYSIS_URL ||
  DEFAULT_RECEIPT_ANALYSIS_ENDPOINT;
const FEEDBACK_ENDPOINT = RECEIPT_ANALYSIS_ENDPOINT.replace(/\/analyze-receipt\/?$/, '/feedback');
const RECEIPT_ANALYSIS_CLIENT_TOKEN =
  APP_CONFIG_EXTRA.analysisClientToken ||
  process.env.EXPO_PUBLIC_ANALYSIS_CLIENT_TOKEN ||
  '';
const ANALYSIS_IMAGE_MAX_WIDTH = 1024;
const ANALYSIS_IMAGE_QUALITY = 0.55;
const ANALYSIS_REQUEST_TIMEOUT_MS = 35000;
const EXCHANGE_RATE_ENDPOINT = 'https://api.frankfurter.dev/v2/rates';
const FREE_MONTHLY_ANALYSIS_LIMIT = 5;
const ENABLE_PREMIUM_PAYWALL = true;
const ENABLE_REWARDED_ADS = true;
const ADMOB_ANDROID_REWARDED_AD_UNIT_ID = 'ca-app-pub-8547815405822008/8421426783';
const ADMOB_IOS_REWARDED_AD_UNIT_ID = 'ca-app-pub-8547815405822008/1911858751';
const REWARDED_AD_LOAD_TIMEOUT_MS = 20000;
const IMAGE_PICKER_MEDIA_TYPES = ['images'];
const FEEDBACK_EMAIL = 'denizcanpolat2307@gmail.com';
const DEFAULT_SPACE_KEY = 'personal';
const DEFAULT_RECEIPT_SETTINGS = {
  autoAnalyze: true,
  reviewBeforeSave: true,
  keepPhotos: true,
  defaultCategory: 'grocery',
};

let activeCurrency = 'TRY';
let mobileAdsInitializePromise = null;

const languages = [
  { code: 'tr', name: 'Türkçe' },
  { code: 'en', name: 'English' },
  { code: 'fr', name: 'Francais' },
  { code: 'de', name: 'Deutsch' },
  { code: 'es', name: 'Espanol' },
  { code: 'it', name: 'Italiano' },
  { code: 'pt', name: 'Portugues' },
  { code: 'nl', name: 'Nederlands' },
];

const currencies = [
  { code: 'TRY', name: 'Türk Lirası', symbol: '₺' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'GBP', name: 'Sterlin', symbol: '£' },
  { code: 'USD', name: 'US Dollar', symbol: '$' },
];

const countryCurrencyMap = {
  TR: 'TRY',
  US: 'USD',
  GB: 'GBP',
  GG: 'GBP',
  IM: 'GBP',
  JE: 'GBP',
  AD: 'EUR',
  AT: 'EUR',
  BE: 'EUR',
  CY: 'EUR',
  DE: 'EUR',
  EE: 'EUR',
  ES: 'EUR',
  FI: 'EUR',
  FR: 'EUR',
  GR: 'EUR',
  HR: 'EUR',
  IE: 'EUR',
  IT: 'EUR',
  LT: 'EUR',
  LU: 'EUR',
  LV: 'EUR',
  MC: 'EUR',
  ME: 'EUR',
  MT: 'EUR',
  NL: 'EUR',
  PT: 'EUR',
  SI: 'EUR',
  SK: 'EUR',
  SM: 'EUR',
  VA: 'EUR',
  XK: 'EUR',
};

const translations = {
  tr: {
    appSubtitle: 'Tara. Kaydet. Kolaylaştır.',
    navHome: 'Ana',
    navReceipt: 'Fiş',
    navReport: 'Rapor',
    navMonthlyReceipts: 'Aylıklar',
    navProducts: 'Ürünler',
    navSettings: 'Ayarlar',
    settings: 'Ayarlar',
    appSettings: 'Uygulama ayarları',
    settingsInfo: 'Dil, gelir ve ileride eklenecek yedekleme ayarları burada olacak.',
    language: 'Dil',
    income: 'Gelir',
    monthlyIncome: 'Aylık maaş / gelir',
    incomeForMonth: 'Bu ayın geliri',
    previousMonth: 'Önceki ay',
    nextMonth: 'Sonraki ay',
    selectedMonth: 'Seçili ay',
    remainingMoney: 'Kalan para',
    reportButton: 'Raporu Gör',
    totalThisMonth: 'Bu ay toplam',
    receiptArchive: 'Fiş arşivi',
    archiveInfo: 'Yüklediğin tüm fişler burada kalır. Detayını görmek için fişe dokun.',
    monthlyReceiptsTitle: 'Aylık fişler',
    monthlyReceiptsInfo: 'Fişleri ve aylık ödemeleri ay ay gör.',
    monthReceiptsTitle: (month) => `${month} fişleri`,
    tapMonthReceipts: 'Bu ayın fişlerini görmek için dokun',
    topCategorySentence: (category, amount) => `En çok harcama ${category} kategorisinde: ${amount}.`,
    moneyLeft: 'Toplam kalan',
    savings: 'Tasarruf',
    receiptCount: 'Fiş sayısı',
    searchResultCount: (count) => `${count} fiş bulundu`,
    dailyAverage: 'Günlük ort.',
    spendingInsightTitle: 'En çok harcama nerede?',
    spendingInsightText: (category, amount) => `Bu ay en yüksek harcama ${category} kategorisinde. Toplam: ${amount}.`,
    recentSpending: 'Son yüklenen fişler',
    newReceipt: 'Yeni fiş',
    addReceipt: 'Fiş ekle',
    freeUsageText: (used, limit) => `Bu ay ${used}/${limit} ücretsiz fiş analizi kullandın.`,
    freeLimitTitle: 'Ücretsiz limit doldu',
    freeLimitText: (limit) => `Bu ay ${limit} ücretsiz fiş analizi hakkını kullandın. 1 ekstra analiz için reklam izleyebilir veya sınırsız analiz için Premium’a geçebilirsin.`,
    watchAdForScan: 'Reklam izle +1 hak',
    rewardedAdSetupTitle: 'Reklam şu an açılamadı',
    rewardedAdSetupText: 'Gerçek ödüllü reklam Expo Go içinde çalışmaz. Dev build veya yayın sürümünde reklam izleyince 1 analiz hakkı eklenir.',
    rewardedCreditTitle: '1 analiz hakkı eklendi',
    rewardedCreditText: 'Şimdi fişini tekrar analiz edebilirsin.',
    receiptHelp: 'Kamerayla çek, analiz et, kontrol edip harcamalara ekle.',
    noReceiptPhoto: 'Fiş fotoğrafı yok',
    choosePhotoHelp: 'Kamerayla çek veya galeriden seç.',
    changeReceiptPhoto: 'Fiş Fotoğrafını Değiştir',
    addReceiptPhoto: 'Fiş Fotoğrafı Ekle',
    receiptStartTitle: 'Yeni fiş',
    receiptStartText: 'Fiş fotoğrafını ekle, gerisini otomatik dolduralım.',
    takePhoto: 'Kameradan Çek',
    takePhotoHelp: 'Yeni fiş fotoğrafı çek.',
    cameraCapture: 'Çek',
    cameraUsePhoto: 'Fotoğrafı Kullan',
    cameraRetake: 'Tekrar Çek',
    cameraHint: 'Fişi çerçeveye yerleştir',
    chooseFromGallery: 'Galeriden Seç',
    chooseFromGalleryHelp: 'Daha önce çekilmiş fişi seç.',
    demoAnalyze: 'Fişi Analiz Et',
    demoAnalyzing: 'Fiş Analiz Ediliyor...',
    reanalyzeReceipt: 'Tekrar Analiz Et',
    storeName: 'Mağaza / işletme adı',
    totalAmount: 'Toplam tutar',
    receiptCurrency: 'Fiş para birimi',
    originalAmount: 'Fişteki tutar',
    convertedAmount: 'Rapor tutarı',
    exchangeRateErrorTitle: 'Kur alınamadı',
    exchangeRateErrorText: 'Bu fişi ana para birimine çeviremedik. İnterneti kontrol edip tekrar dene.',
    taxAmount: 'Vergi / KDV',
    subtotalAmount: 'Ara toplam',
    exchangeRate: 'Kur',
    duplicateReceiptTitle: 'Bu fiş eklenmiş olabilir',
    duplicateReceiptText: 'Bu fiş daha önce kaydedilmiş görünüyor. Aynı fiş tekrar arşive eklenmedi.',
    saveAnyway: 'Yine de kaydet',
    imageQualityTitle: 'Fotoğraf net olmayabilir',
    imageQualityText: 'Bu fotoğraf düşük çözünürlüklü görünüyor. Analiz yanlış olabilir.',
    usePhotoAnyway: 'Yine de kullan',
    pickFile: 'Dosya seç',
    pickFileHelp: 'PDF veya fotoğraf dosyası yükle.',
    fileSaved: 'Dosya kaydedildi',
    fileSavedText: 'PDF dosyası saklandı. Bilgileri elle doldurup kaydedebilirsin.',
    openFile: 'PDF dosyasını aç',
    openFileErrorTitle: 'PDF açılamadı',
    openFileErrorText: 'Bu PDF dosyası telefonda bulunamadı veya açılamıyor.',
    exportCsv: 'CSV Dışa Aktar',
    exportReady: 'Dışa aktarma hazır',
    exportError: 'Dışa aktarma hatası',
    exportErrorText: 'CSV dosyası oluşturulamadı.',
    category: 'Kategori',
    customCategory: 'Özel kategori',
    customCategoryPlaceholder: 'Örn. Oto bakım, okul, vergi...',
    readItems: 'Okunan ürünler',
    addToSpending: 'Harcamalara Ekle',
    manualSaveHelp: 'Analiz olmadan kaydetmek için mağaza adı ve toplam tutarı yazman yeterli.',
    editReceiptDetails: 'Detayları düzenle',
    confirmAndSave: 'Onayla ve Kaydet',
    confirmReceiptTitle: 'Fişi kaydet',
    confirmReceiptMessage: 'Analiz sonucunu kontrol ettin mi? Onaylarsan fiş arşive, ana ekrana ve raporlara kaydedilecek.',
    confirmReceiptAction: 'Onayla',
    reviewBeforeSave: 'Kaydetmeden önce kontrol et',
    reviewBeforeSaveText: 'Mağaza, tarih, toplam ve ürünleri kontrol et. Eksik veya yanlış alan varsa elle düzelt.',
    analysisConfidence: 'Analiz güveni',
    needsReview: 'Kontrol gerekli',
    looksGood: 'İyi görünüyor',
    backHome: 'Ana Ekrana Dön',
    totalSpending: 'Toplam harcama',
    reportOverview: 'Genel rapor',
    highest: 'En yüksek',
    categoryBreakdown: 'Kategori dağılımı',
    merchantBreakdown: 'Marketler ve mağazalar',
    merchantReceiptsTitle: (store) => `${store} fişleri`,
    clearMerchantFilter: 'Seçimi temizle',
    productBreakdown: 'Ürün özeti',
    productsInfo: 'Ürünler aylık toplam adet ve miktara göre sıralanır.',
    productMonthPeriod: 'Ay',
    productThisYear: 'Bu yıl',
    productMonthSelect: 'Ay seç',
    noProductData: 'Bu ay ürün verisi yok',
    noProductDataText: 'Fiş analiz ettiğinde ürün adetleri burada görünecek.',
    receiptsShort: 'fiş',
    boughtItems: 'Alınanlar',
    tapMerchantReceipts: 'Fişleri görmek için dokun',
    searchReceipts: 'Mağaza, kategori, ürün, tarih veya tutar ara',
    noReceipts: 'Henüz fiş yok',
    noReceiptsText: 'İlk fişi eklediğinde harcamaların, marketlerin ve raporların burada görünecek.',
    noReportData: 'Bu filtrede veri yok',
    thisMonth: 'Bu ay',
    allTime: 'Tüm zamanlar',
    currency: 'Para birimi',
    selectedCurrency: (symbol, name) => `Seçili para birimi: ${symbol} ${name}`,
    premium: 'Premium',
    premiumInfo: 'Sınırsız AI fiş analizi ve gelişmiş raporlar.',
    premiumTitle: 'Reciro Premium',
    premiumSubtitle: 'Sınırsız fiş analizi, ürün raporları ve reklamsız kullanım.',
    premiumMonthly: 'Aylık: €1,99',
    premiumYearly: 'Yıllık: €21,49 (%10 indirim)',
    premiumBenefits: [
      'Sınırsız AI fiş analizi',
      'PDF ve fotoğraf fiş analizi',
      'Ürün, kategori, market ve mağaza raporları',
      'Aylık ve tüm zamanlar raporları',
      'Reklamsız kullanım',
    ],
    startPremium: 'Premium’a Geç',
    premiumSetupTitle: 'Premium yakında',
    premiumSetupText: 'Gerçek abonelik için App Store ve Google Play satın alma sistemi bağlanacak.',
    viewPremium: 'Premium’u Gör',
    accountSync: 'Premium ve satın alma',
    accountSyncInfo: 'Verilerin bu telefonda kalır. Premium ve satın alma işlemleri mağaza hesabınla yönetilir.',
    welcomeTitle: 'Hesabını seç',
    welcomeText: 'Verilerin telefonda kalır. Yedeklerini kendi iCloud Drive veya Google Drive hesabında saklayabilirsin.',
    chooseAccount: 'Devam et',
    signedInWith: (provider) => `${provider} seçildi`,
    signInWithApple: 'Apple ile devam et',
    signOut: 'Çıkış Yap',
    signOutTitle: 'Hesaptan çık',
    signOutMessage: 'Çıkış yaparsan uygulama tekrar başlangıç ekranına döner. Kayıtlı fişlerin telefonda kalır.',
    signOutConfirm: 'Çıkış yap',
    notSignedIn: 'Veriler bu telefonda',
    signInWithGoogle: 'Google ile Giriş Yap',
    signInWithICloud: 'iCloud ile Bağlan',
    cloudSetupNeededTitle: 'Veriler cihazda saklanır',
    cloudSetupNeededText: 'Reciro fişlerini kendi sunucusunda saklamaz. Yedeklerini Verilerim bölümünden kendin dışa aktarabilirsin.',
    dataBackup: 'Veri ve yedekleme',
    createBackup: 'Yedek Oluştur',
    restoreBackup: 'Son Yedeği Geri Yükle',
    backupReady: 'Yedek hazır',
    backupReadyText: (fileName) => `Yedek oluşturuldu: ${fileName}`,
    backupRestored: 'Yedek yüklendi',
    backupRestoredText: 'Son yedekteki fişler, gelir ve para birimi geri yüklendi.',
    backupError: 'Yedekleme hatası',
    backupErrorText: 'Yedekleme işlemi tamamlanamadı.',
    noBackupTitle: 'Yedek yok',
    noBackupText: 'Geri yüklenecek bir yedek bulunamadı.',
    backupInfo: 'Fişler, gelirler ve ayarların bu telefonda kalır. Yedeği kendi iCloud, Google Drive veya dosyalarına kaydedebilirsin.',
    feedback: 'Geri bildirim',
    feedbackInfo: 'Öneri, hata veya isteklerini bize gönder.',
    feedbackTitle: 'Bize neyi düzeltelim?',
    feedbackText: 'Mesajın uygulama içinden bize ulaşır. Böylece kullanıcıların istediği şeyleri okuyup uygulamayı ona göre geliştiririz.',
    feedbackPlaceholder: 'Örn. Fiş okuma daha hızlı olsun, şu ekran karışık...',
    sendFeedback: 'Geri Bildirim Gönder',
    feedbackEmptyTitle: 'Mesaj boş',
    feedbackEmptyText: 'Göndermeden önce kısa bir mesaj yaz.',
    feedbackSentTitle: 'Geri bildirim gönderildi',
    feedbackSentText: 'Mesajın uygulama içinden alındı. Teşekkürler.',
    feedbackMailTitle: 'E-posta açılamadı',
    feedbackMailText: 'Telefonunda e-posta uygulaması yoksa mesaj gönderilemeyebilir.',
    analysisUnavailableTitle: 'Analiz servisi bağlı değil',
    analysisUnavailableText: 'Gerçek fiş okuma için OCR/AI servisi bağlanmalı. Şimdilik bilgileri elle girip kaydedebilirsin.',
    analysisTimeoutTitle: 'Analiz uzun sürdü',
    analysisTimeoutText: 'Fiş okunamadı. Bağlantıyı kontrol edip tekrar dene veya bilgileri elle kaydet.',
    cameraOpenErrorTitle: 'Kamera açılamadı',
    cameraOpenErrorText: 'Telefon ayarlarından Expo Go için kamera iznini kontrol et ve tekrar dene.',
    comingSoon: 'Yakında',
    comingSoonMessage: 'Bu özellik yakında eklenecek.',
    selected: 'Seçili',
    back: 'Geri Dön',
    spending: 'Harcama',
    receiptStoredText: 'Bu fiş telefonda kayıtlı. İstediğin zaman buradan fotoğrafına ve detaylarına tekrar bakabilirsin.',
    noPhoto: 'Fotoğraf yok',
    noPhotoText: 'Bu kayıtta fiş fotoğrafı bulunmuyor.',
    total: 'Toplam',
    date: 'Tarih',
    editReceipt: 'Fişi Düzenle',
    saveChanges: 'Değişiklikleri Kaydet',
    cancel: 'Vazgeç',
    deleteReceipt: 'Fişi Sil',
    items: 'Ürünler',
    editItems: 'Ürünleri düzenle',
    addItem: 'Ürün ekle',
    removeItem: 'Sil',
    itemName: 'Ürün adı',
    itemAmount: 'Fiyat',
    quantity: 'Adet',
    unit: 'Birim',
    tapForDetails: 'Detayı görmek için dokun',
    photoAvailable: 'fotoğraf var',
    deleteTitle: 'Fişi sil',
    deleteMessage: 'Bu fiş arşivden silinsin mi?',
    deleteConfirm: 'Sil',
    missingInfo: 'Eksik bilgi',
    enterStore: 'Mağaza adını yaz.',
    enterAmount: 'Toplam tutarı yaz.',
    permissionNeeded: 'İzin gerekli',
    galleryPermission: 'Fiş fotoğrafı seçmek için galeri izni gerekiyor.',
    cameraPermission: 'Fiş fotoğrafı çekmek için kamera izni gerekiyor.',
    photoNeeded: 'Fotoğraf gerekli',
    choosePhotoFirst: 'Önce kamerayla fiş çek veya galeriden seç.',
    saveError: 'Kayıt hatası',
    readError: 'Kayıt okunamadı',
    recordsReadError: 'Kayıtlı fişler açılırken bir sorun oluştu.',
    receiptsSaveError: 'Fişler telefona kaydedilemedi.',
    incomeSaveError: 'Gelir bilgisi kaydedilemedi.',
    languageAutomatic: 'Telefon diline göre otomatik',
    languageAutomaticInfo: 'Uygulama her açıldığında telefonundaki dili kontrol eder. Desteklenmeyen dillerde İngilizce açılır.',
    currencySaveError: 'Para birimi kaydedilemedi.',
    photoSaveErrorTitle: 'Fotoğraf kaydedilemedi',
    photoSaveErrorText: 'Fiş fotoğrafı telefona kaydedilemedi.',
    placeholderStore: 'Mağaza adı',
    placeholderAmount: '0,00',
    categories: {
      grocery: 'Market',
      food: 'Yemek',
      transport: 'Ulaşım',
      fuel: 'Yakıt',
      home: 'Ev',
      clothing: 'Giyim',
      health: 'Sağlık',
      other: 'Diğer',
    },
  },
  en: {
    appSubtitle: 'Scan. Save. Simplify.',
    navHome: 'Home',
    navReceipt: 'Receipt',
    navReport: 'Report',
    navMonthlyReceipts: 'Months',
    navProducts: 'Products',
    navSettings: 'Settings',
    settings: 'Settings',
    appSettings: 'App settings',
    settingsInfo: 'Language, income, and future backup settings will live here.',
    language: 'Language',
    income: 'Income',
    monthlyIncome: 'Monthly income',
    incomeForMonth: 'Income for this month',
    previousMonth: 'Previous month',
    nextMonth: 'Next month',
    selectedMonth: 'Selected month',
    remainingMoney: 'Total left',
    reportButton: 'View Report',
    totalThisMonth: 'This month',
    receiptArchive: 'Receipt archive',
    archiveInfo: 'All uploaded receipts stay here. Tap a receipt to see details.',
    monthlyReceiptsTitle: 'Monthly receipts',
    monthlyReceiptsInfo: 'View receipts and monthly payments month by month.',
    monthReceiptsTitle: (month) => `${month} receipts`,
    tapMonthReceipts: 'Tap to view this month',
    topCategorySentence: (category, amount) => `Most spending is in ${category}: ${amount}.`,
    moneyLeft: 'Total left',
    savings: 'Savings',
    receiptCount: 'Receipt count',
    searchResultCount: (count) => `${count} receipts found`,
    dailyAverage: 'Daily avg.',
    spendingInsightTitle: 'Where does it go most?',
    spendingInsightText: (category, amount) => `Your highest spending this month is ${category}. Total: ${amount}.`,
    recentSpending: 'Recently added receipts',
    newReceipt: 'New receipt',
    addReceipt: 'Add receipt',
    freeUsageText: (used, limit) => `You used ${used}/${limit} free receipt scans this month.`,
    freeLimitTitle: 'Free limit reached',
    freeLimitText: (limit) => `You used your ${limit} free receipt scans this month. Watch an ad for 1 extra scan or go Premium for unlimited scans.`,
    watchAdForScan: 'Watch ad +1 scan',
    rewardedAdSetupTitle: 'Ad could not open',
    rewardedAdSetupText: 'Real rewarded ads do not run inside Expo Go. In a dev build or store build, watching an ad adds 1 scan.',
    rewardedCreditTitle: '1 scan added',
    rewardedCreditText: 'You can analyze your receipt again now.',
    receiptHelp: 'Take a photo, analyze it, review it, and add it to spending.',
    noReceiptPhoto: 'No receipt photo',
    choosePhotoHelp: 'Take a photo or choose from gallery.',
    changeReceiptPhoto: 'Change receipt photo',
    addReceiptPhoto: 'Add receipt photo',
    receiptStartTitle: 'New receipt',
    receiptStartText: 'Add a receipt photo and let the app fill the details.',
    takePhoto: 'Take photo',
    takePhotoHelp: 'Take a new receipt photo.',
    cameraCapture: 'Capture',
    cameraUsePhoto: 'Use Photo',
    cameraRetake: 'Retake',
    cameraHint: 'Place the receipt inside the frame',
    chooseFromGallery: 'Choose from gallery',
    chooseFromGalleryHelp: 'Select an existing receipt photo.',
    demoAnalyze: 'Analyze receipt',
    demoAnalyzing: 'Analyzing receipt...',
    reanalyzeReceipt: 'Analyze Again',
    storeName: 'Store / business name',
    totalAmount: 'Total amount',
    receiptCurrency: 'Receipt currency',
    originalAmount: 'Original amount',
    convertedAmount: 'Report amount',
    exchangeRateErrorTitle: 'Exchange rate unavailable',
    exchangeRateErrorText: 'This receipt could not be converted to your main currency. Check your connection and try again.',
    taxAmount: 'Tax / VAT',
    subtotalAmount: 'Subtotal',
    exchangeRate: 'Exchange rate',
    duplicateReceiptTitle: 'This receipt may already exist',
    duplicateReceiptText: 'This receipt appears to be saved already, so it was not added again.',
    saveAnyway: 'Save anyway',
    imageQualityTitle: 'Photo may not be clear',
    imageQualityText: 'This photo looks low resolution. The analysis may be wrong.',
    usePhotoAnyway: 'Use anyway',
    pickFile: 'Choose file',
    pickFileHelp: 'Upload a PDF or photo file.',
    fileSaved: 'File saved',
    fileSavedText: 'The PDF file was saved. Fill in the details manually and save.',
    openFile: 'Open PDF file',
    openFileErrorTitle: 'PDF could not be opened',
    openFileErrorText: 'This PDF file could not be found on the phone or cannot be opened.',
    exportCsv: 'Export CSV',
    exportReady: 'Export ready',
    exportError: 'Export error',
    exportErrorText: 'CSV file could not be created.',
    category: 'Category',
    customCategory: 'Custom category',
    customCategoryPlaceholder: 'Example: car care, school, tax...',
    readItems: 'Read items',
    addToSpending: 'Add to spending',
    manualSaveHelp: 'To save without analysis, enter the store name and total amount.',
    editReceiptDetails: 'Edit details',
    confirmAndSave: 'Confirm and Save',
    confirmReceiptTitle: 'Save receipt',
    confirmReceiptMessage: 'Have you checked the analysis result? If you confirm, this receipt will be saved to archive, home, and reports.',
    confirmReceiptAction: 'Confirm',
    reviewBeforeSave: 'Review before saving',
    reviewBeforeSaveText: 'Check store, date, total, and items. Edit anything missing or wrong.',
    analysisConfidence: 'Analysis confidence',
    needsReview: 'Needs review',
    looksGood: 'Looks good',
    backHome: 'Back to Home',
    totalSpending: 'Total spending',
    reportOverview: 'Overview',
    highest: 'Highest',
    categoryBreakdown: 'Category breakdown',
    merchantBreakdown: 'Stores and merchants',
    merchantReceiptsTitle: (store) => `${store} receipts`,
    clearMerchantFilter: 'Clear selection',
    productBreakdown: 'Product summary',
    productsInfo: 'Products are ranked monthly by total quantity.',
    productMonthPeriod: 'Month',
    productThisYear: 'This year',
    productMonthSelect: 'Choose month',
    noProductData: 'No product data this month',
    noProductDataText: 'After receipt analysis, product quantities will appear here.',
    receiptsShort: 'receipts',
    boughtItems: 'Items',
    tapMerchantReceipts: 'Tap to view receipts',
    searchReceipts: 'Search store, category, item, date, or amount',
    noReceipts: 'No receipts yet',
    noReceiptsText: 'After you add your first receipt, spending, stores, and reports will appear here.',
    noReportData: 'No data for this filter',
    thisMonth: 'This month',
    allTime: 'All time',
    currency: 'Currency',
    selectedCurrency: (symbol, name) => `Selected currency: ${symbol} ${name}`,
    premium: 'Premium',
    premiumInfo: 'Unlimited AI receipt scans and advanced reports.',
    premiumTitle: 'Reciro Premium',
    premiumSubtitle: 'Unlimited receipt scans, product reports, and ad-free use.',
    premiumMonthly: 'Monthly: €1.99',
    premiumYearly: 'Yearly: €21.49 (10% off)',
    premiumBenefits: [
      'Unlimited AI receipt scans',
      'PDF and photo receipt analysis',
      'Product, category, store, and merchant reports',
      'Monthly and all-time reports',
      'Ad-free use',
    ],
    startPremium: 'Go Premium',
    premiumSetupTitle: 'Premium coming soon',
    premiumSetupText: 'Real subscriptions will be connected through App Store and Google Play purchases.',
    viewPremium: 'View Premium',
    accountSync: 'Premium and purchases',
    accountSyncInfo: 'Your data stays on this phone. Premium and purchases are managed by your store account.',
    welcomeTitle: 'Choose your account',
    welcomeText: 'Your data stays on this phone. You can keep your backups in your own iCloud Drive or Google Drive.',
    chooseAccount: 'Continue',
    signedInWith: (provider) => `${provider} selected`,
    signInWithApple: 'Continue with Apple',
    signOut: 'Sign out',
    signOutTitle: 'Sign out',
    signOutMessage: 'If you sign out, the app will return to the start screen. Saved receipts stay on this phone.',
    signOutConfirm: 'Sign out',
    notSignedIn: 'Data stays on this phone',
    signInWithGoogle: 'Sign in with Google',
    signInWithICloud: 'Connect iCloud',
    cloudSetupNeededTitle: 'Data is stored on-device',
    cloudSetupNeededText: 'Reciro does not store your receipts on its own servers. You can export your own backup from My data.',
    dataBackup: 'Data and backup',
    createBackup: 'Create backup',
    restoreBackup: 'Restore latest backup',
    backupReady: 'Backup ready',
    backupReadyText: (fileName) => `Backup created: ${fileName}`,
    backupRestored: 'Backup restored',
    backupRestoredText: 'Receipts, income, and currency were restored from the latest backup.',
    backupError: 'Backup error',
    backupErrorText: 'Backup could not be completed.',
    noBackupTitle: 'No backup',
    noBackupText: 'No backup was found to restore.',
    backupInfo: 'Receipts, income, and settings stay on this phone. You can save the backup to your own iCloud, Google Drive, or files.',
    feedback: 'Feedback',
    feedbackInfo: 'Send suggestions, bugs, or feature requests.',
    feedbackTitle: 'What should we improve?',
    feedbackText: 'Your message is sent from inside the app, so we can read user feedback and improve the app.',
    feedbackPlaceholder: 'Example: make receipt reading faster, this screen feels confusing...',
    sendFeedback: 'Send Feedback',
    feedbackEmptyTitle: 'Message is empty',
    feedbackEmptyText: 'Write a short message before sending.',
    feedbackSentTitle: 'Feedback sent',
    feedbackSentText: 'Your message was sent from inside the app. Thank you.',
    feedbackMailTitle: 'Email could not open',
    feedbackMailText: 'If there is no email app on the phone, the message may not be sent.',
    analysisUnavailableTitle: 'Analysis service is not connected',
    analysisUnavailableText: 'Real receipt reading needs an OCR/AI service. For now, you can enter the details manually and save.',
    analysisTimeoutTitle: 'Analysis took too long',
    analysisTimeoutText: 'The receipt could not be read. Check the connection and try again, or save the details manually.',
    cameraOpenErrorTitle: 'Camera could not open',
    cameraOpenErrorText: 'Check the camera permission for Expo Go in phone settings and try again.',
    comingSoon: 'Coming soon',
    comingSoonMessage: 'This feature will be added soon.',
    selected: 'Selected',
    back: 'Back',
    spending: 'Spending',
    receiptStoredText: 'This receipt is saved on your phone. You can view its photo and details anytime.',
    noPhoto: 'No photo',
    noPhotoText: 'This record has no receipt photo.',
    total: 'Total',
    date: 'Date',
    editReceipt: 'Edit receipt',
    saveChanges: 'Save changes',
    cancel: 'Cancel',
    deleteReceipt: 'Delete receipt',
    items: 'Items',
    editItems: 'Edit items',
    addItem: 'Add item',
    removeItem: 'Remove',
    itemName: 'Item name',
    itemAmount: 'Price',
    quantity: 'Quantity',
    unit: 'Unit',
    tapForDetails: 'Tap to see details',
    photoAvailable: 'photo available',
    deleteTitle: 'Delete receipt',
    deleteMessage: 'Delete this receipt from the archive?',
    deleteConfirm: 'Delete',
    missingInfo: 'Missing info',
    enterStore: 'Enter the store name.',
    enterAmount: 'Enter the total amount.',
    permissionNeeded: 'Permission needed',
    galleryPermission: 'Gallery permission is needed to choose a receipt photo.',
    cameraPermission: 'Camera permission is needed to take a receipt photo.',
    photoNeeded: 'Photo needed',
    choosePhotoFirst: 'First take a receipt photo or choose one from gallery.',
    saveError: 'Save error',
    readError: 'Could not read saved data',
    recordsReadError: 'There was a problem loading saved receipts.',
    receiptsSaveError: 'Receipts could not be saved on the phone.',
    incomeSaveError: 'Income could not be saved.',
    languageAutomatic: 'Automatic from phone language',
    languageAutomaticInfo: 'The app checks your phone language when it opens. Unsupported languages open in English.',
    currencySaveError: 'Currency could not be saved.',
    photoSaveErrorTitle: 'Photo could not be saved',
    photoSaveErrorText: 'Receipt photo could not be saved on the phone.',
    placeholderStore: 'Store name',
    placeholderAmount: '0.00',
    categories: {
      grocery: 'Groceries',
      food: 'Food',
      transport: 'Transport',
      fuel: 'Fuel',
      home: 'Home',
      clothing: 'Clothing',
      health: 'Health',
      other: 'Other',
    },
  },
  fr: {
    appSubtitle: 'Scannez. Enregistrez. Simplifiez.',
    navHome: 'Accueil',
    navReceipt: 'Ticket',
    navReport: 'Rapport',
    navMonthlyReceipts: 'Mois',
    navProducts: 'Articles',
    navSettings: 'Reglages',
    settings: 'Reglages',
    appSettings: 'Reglages de l app',
    settingsInfo: 'La langue, les revenus et les futures sauvegardes seront ici.',
    language: 'Langue',
    income: 'Revenu',
    monthlyIncome: 'Revenu mensuel',
    incomeForMonth: 'Revenu du mois',
    previousMonth: 'Mois precedent',
    nextMonth: 'Mois suivant',
    selectedMonth: 'Mois selectionne',
    remainingMoney: 'Solde total',
    reportButton: 'Voir le rapport',
    totalThisMonth: 'Ce mois-ci',
    receiptArchive: 'Archive des tickets',
    archiveInfo: 'Tous les tickets ajoutes restent ici. Touchez un ticket pour voir les details.',
    monthlyReceiptsTitle: 'Tickets mensuels',
    monthlyReceiptsInfo: 'Consultez tickets et paiements mensuels mois par mois.',
    monthReceiptsTitle: (month) => `Tickets de ${month}`,
    tapMonthReceipts: 'Touchez pour voir ce mois',
    topCategorySentence: (category, amount) => `La depense principale est ${category}: ${amount}.`,
    moneyLeft: 'Solde total',
    savings: 'Epargne',
    receiptCount: 'Nombre de tickets',
    searchResultCount: (count) => `${count} tickets trouves`,
    dailyAverage: 'Moyenne jour',
    spendingInsightTitle: 'Ou va le plus d argent?',
    spendingInsightText: (category, amount) => `Ce mois-ci, la depense la plus elevee est ${category}. Total: ${amount}.`,
    recentSpending: 'Tickets ajoutes recemment',
    newReceipt: 'Nouveau ticket',
    addReceipt: 'Ajouter un ticket',
    freeUsageText: (used, limit) => `${used}/${limit} analyses gratuites utilisees ce mois-ci.`,
    freeLimitTitle: 'Limite gratuite atteinte',
    freeLimitText: (limit) => `Vous avez utilise vos ${limit} analyses gratuites ce mois-ci. Regardez une publicite pour 1 analyse en plus ou passez Premium.`,
    watchAdForScan: 'Voir une pub +1 analyse',
    rewardedAdSetupTitle: 'Publicite indisponible',
    rewardedAdSetupText: 'Les publicites recompensees ne fonctionnent pas dans Expo Go. Dans un dev build ou la version store, une publicite ajoute 1 analyse.',
    rewardedCreditTitle: '1 analyse ajoutee',
    rewardedCreditText: 'Vous pouvez analyser votre ticket maintenant.',
    receiptHelp: 'Prenez une photo, analysez, verifiez et ajoutez aux depenses.',
    noReceiptPhoto: 'Aucune photo de ticket',
    choosePhotoHelp: 'Prenez une photo ou choisissez depuis la galerie.',
    changeReceiptPhoto: 'Changer la photo du ticket',
    addReceiptPhoto: 'Ajouter une photo du ticket',
    receiptStartTitle: 'Nouveau ticket',
    receiptStartText: 'Ajoutez une photo et laissez l app remplir les details.',
    takePhoto: 'Prendre une photo',
    takePhotoHelp: 'Prendre une nouvelle photo du ticket.',
    cameraCapture: 'Prendre',
    cameraUsePhoto: 'Utiliser la photo',
    cameraRetake: 'Reprendre',
    cameraHint: 'Placez le ticket dans le cadre',
    chooseFromGallery: 'Choisir dans la galerie',
    chooseFromGalleryHelp: 'Choisir une photo de ticket existante.',
    demoAnalyze: 'Analyser le ticket',
    demoAnalyzing: 'Analyse du ticket...',
    reanalyzeReceipt: 'Analyser encore',
    storeName: 'Nom du magasin',
    totalAmount: 'Montant total',
    receiptCurrency: 'Devise du ticket',
    originalAmount: 'Montant original',
    convertedAmount: 'Montant du rapport',
    exchangeRateErrorTitle: 'Taux indisponible',
    exchangeRateErrorText: 'Ce ticket n a pas pu etre converti dans votre devise principale. Verifiez la connexion et reessayez.',
    taxAmount: 'Taxe / TVA',
    subtotalAmount: 'Sous-total',
    exchangeRate: 'Taux',
    duplicateReceiptTitle: 'Ce ticket existe peut-etre deja',
    duplicateReceiptText: 'Ce ticket semble deja enregistre. Il n a pas ete ajoute une deuxieme fois.',
    saveAnyway: 'Enregistrer quand meme',
    imageQualityTitle: 'Photo peut-etre floue',
    imageQualityText: 'Cette photo semble en basse resolution. L analyse peut etre incorrecte.',
    usePhotoAnyway: 'Utiliser quand meme',
    pickFile: 'Choisir un fichier',
    pickFileHelp: 'Importer un PDF ou une photo.',
    fileSaved: 'Fichier enregistre',
    fileSavedText: 'Le PDF a ete enregistre. Remplissez les details manuellement.',
    openFile: 'Ouvrir le PDF',
    openFileErrorTitle: 'PDF impossible a ouvrir',
    openFileErrorText: 'Ce fichier PDF est introuvable sur le telephone ou ne peut pas etre ouvert.',
    exportCsv: 'Exporter CSV',
    exportReady: 'Export pret',
    exportError: 'Erreur export',
    exportErrorText: 'Le fichier CSV n a pas pu etre cree.',
    category: 'Categorie',
    customCategory: 'Categorie personnalisee',
    customCategoryPlaceholder: 'Ex. voiture, ecole, taxe...',
    readItems: 'Articles lus',
    addToSpending: 'Ajouter aux depenses',
    manualSaveHelp: 'Pour enregistrer sans analyse, indiquez le magasin et le montant total.',
    editReceiptDetails: 'Modifier les details',
    confirmAndSave: 'Confirmer et enregistrer',
    confirmReceiptTitle: 'Enregistrer le ticket',
    confirmReceiptMessage: 'Avez-vous verifie le resultat? En confirmant, le ticket sera enregistre dans l archive, l accueil et les rapports.',
    confirmReceiptAction: 'Confirmer',
    reviewBeforeSave: 'Verifier avant enregistrement',
    reviewBeforeSaveText: 'Verifiez le magasin, la date, le total et les articles. Corrigez les champs manquants ou faux.',
    analysisConfidence: 'Confiance analyse',
    needsReview: 'Verification requise',
    looksGood: 'Semble correct',
    backHome: 'Retour accueil',
    totalSpending: 'Depense totale',
    reportOverview: 'Vue generale',
    highest: 'Plus elevee',
    categoryBreakdown: 'Repartition par categorie',
    merchantBreakdown: 'Magasins et commercants',
    merchantReceiptsTitle: (store) => `Tickets de ${store}`,
    clearMerchantFilter: 'Effacer la selection',
    productBreakdown: 'Resume des articles',
    productsInfo: 'Les articles sont classes chaque mois par quantite totale.',
    productMonthPeriod: 'Mois',
    productThisYear: 'Cette annee',
    productMonthSelect: 'Choisir le mois',
    noProductData: 'Aucun article ce mois',
    noProductDataText: 'Apres analyse des tickets, les quantites apparaitront ici.',
    receiptsShort: 'tickets',
    boughtItems: 'Articles',
    tapMerchantReceipts: 'Touchez pour voir les tickets',
    searchReceipts: 'Rechercher magasin, categorie, article, date ou montant',
    noReceipts: 'Aucun ticket',
    noReceiptsText: 'Ajoutez votre premier ticket pour voir les depenses, magasins et rapports.',
    noReportData: 'Aucune donnee pour ce filtre',
    thisMonth: 'Ce mois',
    allTime: 'Tout',
    currency: 'Devise',
    selectedCurrency: (symbol, name) => `Devise selectionnee: ${symbol} ${name}`,
    premium: 'Premium',
    premiumInfo: 'Analyses AI illimitees et rapports avances.',
    premiumTitle: 'Reciro Premium',
    premiumSubtitle: 'Analyses illimitees, rapports produits et sans publicite.',
    premiumMonthly: 'Mensuel: €1,99',
    premiumYearly: 'Annuel: €21,49 (-10%)',
    premiumBenefits: [
      'Analyses AI illimitees',
      'Analyse des tickets PDF et photo',
      'Rapports produits, categories et magasins',
      'Analyse mensuelle des produits',
      'Utilisation sans publicite',
    ],
    startPremium: 'Passer Premium',
    premiumSetupTitle: 'Premium bientot',
    premiumSetupText: 'Les abonnements reels seront connectes via l App Store et Google Play.',
    viewPremium: 'Voir Premium',
    accountSync: 'Premium et achats',
    accountSyncInfo: 'Vos donnees restent sur ce telephone. Premium et les achats sont geres par votre compte de magasin.',
    welcomeTitle: 'Choisissez votre compte',
    welcomeText: 'Vos donnees restent sur ce telephone. Vous pouvez garder vos sauvegardes dans votre iCloud Drive ou Google Drive.',
    chooseAccount: 'Continuer',
    signedInWith: (provider) => `${provider} selectionne`,
    signInWithApple: 'Continuer avec Apple',
    signOut: 'Se deconnecter',
    signOutTitle: 'Deconnexion',
    signOutMessage: 'En vous deconnectant, l app revient a l ecran de depart. Les tickets restent sur ce telephone.',
    signOutConfirm: 'Se deconnecter',
    notSignedIn: 'Donnees sur ce telephone',
    signInWithGoogle: 'Se connecter avec Google',
    signInWithICloud: 'Connecter iCloud',
    cloudSetupNeededTitle: 'Donnees stockees sur l appareil',
    cloudSetupNeededText: 'Reciro ne stocke pas vos tickets sur ses serveurs. Creez une sauvegarde dans Mes donnees et gardez-la dans iCloud Drive, Google Drive ou Fichiers.',
    dataBackup: 'Donnees et sauvegarde',
    createBackup: 'Creer une sauvegarde',
    restoreBackup: 'Choisir une sauvegarde',
    backupReady: 'Sauvegarde prete',
    backupReadyText: (fileName) => `Sauvegarde creee: ${fileName}`,
    backupRestored: 'Sauvegarde restauree',
    backupRestoredText: 'Tickets, revenus et devise ont ete restaures.',
    backupError: 'Erreur de sauvegarde',
    backupErrorText: 'La sauvegarde n a pas pu etre terminee.',
    noBackupTitle: 'Aucun fichier choisi',
    noBackupText: 'Choisissez un fichier de sauvegarde Reciro pour restaurer vos donnees.',
    backupInfo: 'Tickets, revenus et reglages restent sur ce telephone. Vous pouvez garder la sauvegarde dans votre iCloud Drive, Google Drive ou Fichiers.',
    feedback: 'Avis',
    feedbackInfo: 'Envoyez une idee, un bug ou une demande.',
    feedbackTitle: 'Que devons-nous ameliorer ?',
    feedbackText: 'Votre message est envoye depuis l app afin de lire les retours et ameliorer l app.',
    feedbackPlaceholder: 'Ex. rendre la lecture plus rapide, cet ecran est confus...',
    sendFeedback: 'Envoyer un avis',
    feedbackEmptyTitle: 'Message vide',
    feedbackEmptyText: 'Ecrivez un court message avant l envoi.',
    feedbackSentTitle: 'Avis envoye',
    feedbackSentText: 'Votre message a ete envoye depuis l app. Merci.',
    feedbackMailTitle: 'E-mail impossible a ouvrir',
    feedbackMailText: 'Sans application e-mail sur le telephone, le message peut ne pas etre envoye.',
    analysisUnavailableTitle: 'Service d analyse non connecte',
    analysisUnavailableText: 'La lecture reelle des tickets necessite un service OCR/AI. Vous pouvez saisir les details manuellement.',
    analysisTimeoutTitle: 'Analyse trop longue',
    analysisTimeoutText: 'Le ticket n a pas pu etre lu. Verifiez la connexion ou saisissez les details manuellement.',
    cameraOpenErrorTitle: 'Camera indisponible',
    cameraOpenErrorText: 'Verifiez l autorisation camera pour Expo Go dans les reglages du telephone.',
    comingSoon: 'Bientot',
    comingSoonMessage: 'Cette fonctionnalite sera bientot ajoutee.',
    selected: 'Selectionne',
    back: 'Retour',
    spending: 'Depense',
    receiptStoredText: 'Ce ticket est enregistre sur votre telephone. Vous pouvez revoir sa photo et ses details a tout moment.',
    noPhoto: 'Pas de photo',
    noPhotoText: 'Ce ticket n a pas de photo.',
    total: 'Total',
    date: 'Date',
    editReceipt: 'Modifier le ticket',
    saveChanges: 'Enregistrer',
    cancel: 'Annuler',
    deleteReceipt: 'Supprimer le ticket',
    items: 'Articles',
    editItems: 'Modifier les articles',
    addItem: 'Ajouter un article',
    removeItem: 'Supprimer',
    itemName: 'Nom de l article',
    itemAmount: 'Prix',
    quantity: 'Quantite',
    unit: 'Unite',
    tapForDetails: 'Touchez pour voir les details',
    photoAvailable: 'photo disponible',
    deleteTitle: 'Supprimer le ticket',
    deleteMessage: 'Supprimer ce ticket de l archive?',
    deleteConfirm: 'Supprimer',
    missingInfo: 'Information manquante',
    enterStore: 'Entrez le nom du magasin.',
    enterAmount: 'Entrez le montant total.',
    permissionNeeded: 'Permission requise',
    galleryPermission: 'La permission galerie est necessaire pour choisir une photo.',
    cameraPermission: 'La permission camera est necessaire pour prendre une photo.',
    photoNeeded: 'Photo requise',
    choosePhotoFirst: 'Prenez une photo ou choisissez-en une depuis la galerie.',
    saveError: 'Erreur d enregistrement',
    readError: 'Lecture impossible',
    recordsReadError: 'Probleme lors du chargement des tickets.',
    receiptsSaveError: 'Les tickets n ont pas pu etre enregistres.',
    incomeSaveError: 'Le revenu n a pas pu etre enregistre.',
    languageAutomatic: 'Automatique selon la langue du telephone',
    languageAutomaticInfo: 'L app verifie la langue du telephone au demarrage. Les langues non prises en charge ouvrent l anglais.',
    currencySaveError: 'La devise n a pas pu etre enregistree.',
    photoSaveErrorTitle: 'Photo non enregistree',
    photoSaveErrorText: 'La photo du ticket n a pas pu etre enregistree.',
    placeholderStore: 'Nom du magasin',
    placeholderAmount: '0,00',
    categories: {
      grocery: 'Courses',
      food: 'Restaurant',
      transport: 'Transport',
      fuel: 'Carburant',
      home: 'Maison',
      clothing: 'Vetements',
      health: 'Sante',
      other: 'Autre',
    },
  },
  de: {
    appSubtitle: 'Scannen. Speichern. Vereinfachen.',
    navHome: 'Start',
    navReceipt: 'Beleg',
    navReport: 'Bericht',
    navMonthlyReceipts: 'Monate',
    navProducts: 'Artikel',
    navSettings: 'Einstellungen',
    settings: 'Einstellungen',
    appSettings: 'App-Einstellungen',
    settingsInfo: 'Sprache, Einkommen und spaetere Backups werden hier sein.',
    language: 'Sprache',
    income: 'Einkommen',
    monthlyIncome: 'Monatliches Einkommen',
    incomeForMonth: 'Einkommen fuer diesen Monat',
    previousMonth: 'Voriger Monat',
    nextMonth: 'Naechster Monat',
    selectedMonth: 'Ausgewaehlter Monat',
    remainingMoney: 'Gesamt uebrig',
    reportButton: 'Bericht ansehen',
    totalThisMonth: 'Dieser Monat',
    receiptArchive: 'Belegarchiv',
    archiveInfo: 'Alle hochgeladenen Belege bleiben hier. Tippe auf einen Beleg fuer Details.',
    monthlyReceiptsTitle: 'Monatliche Belege',
    monthlyReceiptsInfo: 'Belege und monatliche Zahlungen nach Monat ansehen.',
    monthReceiptsTitle: (month) => `${month} Belege`,
    tapMonthReceipts: 'Tippen, um diesen Monat zu sehen',
    topCategorySentence: (category, amount) => `Die meisten Ausgaben sind in ${category}: ${amount}.`,
    moneyLeft: 'Gesamt uebrig',
    savings: 'Sparen',
    receiptCount: 'Beleganzahl',
    searchResultCount: (count) => `${count} Belege gefunden`,
    dailyAverage: 'Tagesdurchs.',
    spendingInsightTitle: 'Wohin geht am meisten?',
    spendingInsightText: (category, amount) => `Diesen Monat ist ${category} am hoechsten. Gesamt: ${amount}.`,
    recentSpending: 'Zuletzt hinzugefuegte Belege',
    newReceipt: 'Neuer Beleg',
    addReceipt: 'Beleg hinzufuegen',
    freeUsageText: (used, limit) => `${used}/${limit} kostenlose Beleganalysen diesen Monat genutzt.`,
    freeLimitTitle: 'Kostenloses Limit erreicht',
    freeLimitText: (limit) => `Du hast deine ${limit} kostenlosen Beleganalysen diesen Monat genutzt. Sieh eine Anzeige fuer 1 weitere Analyse oder aktiviere Premium.`,
    watchAdForScan: 'Anzeige ansehen +1 Scan',
    rewardedAdSetupTitle: 'Anzeige konnte nicht geoeffnet werden',
    rewardedAdSetupText: 'Rewarded Ads laufen nicht in Expo Go. In einem Dev Build oder Store Build fuegt eine angesehene Anzeige 1 Analyse hinzu.',
    rewardedCreditTitle: '1 Analyse hinzugefuegt',
    rewardedCreditText: 'Du kannst deinen Beleg jetzt erneut analysieren.',
    receiptHelp: 'Foto aufnehmen, analysieren, pruefen und speichern.',
    noReceiptPhoto: 'Kein Belegfoto',
    choosePhotoHelp: 'Foto aufnehmen oder aus Galerie waehlen.',
    changeReceiptPhoto: 'Belegfoto aendern',
    addReceiptPhoto: 'Belegfoto hinzufuegen',
    receiptStartTitle: 'Neuer Beleg',
    receiptStartText: 'Belegfoto hinzufuegen, Details automatisch ausfuellen lassen.',
    takePhoto: 'Foto aufnehmen',
    takePhotoHelp: 'Neues Belegfoto aufnehmen.',
    cameraCapture: 'Aufnehmen',
    cameraUsePhoto: 'Foto verwenden',
    cameraRetake: 'Neu aufnehmen',
    cameraHint: 'Beleg im Rahmen platzieren',
    chooseFromGallery: 'Aus Galerie waehlen',
    chooseFromGalleryHelp: 'Vorhandenes Belegfoto auswaehlen.',
    demoAnalyze: 'Beleg analysieren',
    demoAnalyzing: 'Beleg wird analysiert...',
    reanalyzeReceipt: 'Erneut analysieren',
    storeName: 'Geschaeftsname',
    totalAmount: 'Gesamtbetrag',
    receiptCurrency: 'Belegwaehrung',
    originalAmount: 'Originalbetrag',
    convertedAmount: 'Berichtsbetrag',
    exchangeRateErrorTitle: 'Wechselkurs nicht verfuegbar',
    exchangeRateErrorText: 'Dieser Beleg konnte nicht in deine Hauptwaehrung umgerechnet werden. Pruefe die Verbindung und versuche es erneut.',
    taxAmount: 'Steuer / MwSt.',
    subtotalAmount: 'Zwischensumme',
    exchangeRate: 'Wechselkurs',
    duplicateReceiptTitle: 'Dieser Beleg koennte schon existieren',
    duplicateReceiptText: 'Dieser Beleg scheint bereits gespeichert zu sein und wurde nicht erneut hinzugefuegt.',
    saveAnyway: 'Trotzdem speichern',
    imageQualityTitle: 'Foto ist moeglicherweise unscharf',
    imageQualityText: 'Dieses Foto wirkt niedrig aufgeloest. Die Analyse kann falsch sein.',
    usePhotoAnyway: 'Trotzdem nutzen',
    pickFile: 'Datei waehlen',
    pickFileHelp: 'PDF oder Foto hochladen.',
    fileSaved: 'Datei gespeichert',
    fileSavedText: 'Die PDF-Datei wurde gespeichert. Details manuell ausfuellen und speichern.',
    openFile: 'PDF-Datei oeffnen',
    openFileErrorTitle: 'PDF konnte nicht geoeffnet werden',
    openFileErrorText: 'Diese PDF-Datei wurde auf dem Telefon nicht gefunden oder kann nicht geoeffnet werden.',
    exportCsv: 'CSV exportieren',
    exportReady: 'Export bereit',
    exportError: 'Exportfehler',
    exportErrorText: 'CSV-Datei konnte nicht erstellt werden.',
    category: 'Kategorie',
    customCategory: 'Eigene Kategorie',
    customCategoryPlaceholder: 'Z.B. Auto, Schule, Steuer...',
    readItems: 'Gelesene Artikel',
    addToSpending: 'Zu Ausgaben hinzufuegen',
    manualSaveHelp: 'Zum Speichern ohne Analyse reichen Geschaeftsname und Gesamtbetrag.',
    editReceiptDetails: 'Details bearbeiten',
    confirmAndSave: 'Bestaetigen und speichern',
    confirmReceiptTitle: 'Beleg speichern',
    confirmReceiptMessage: 'Hast du das Ergebnis geprueft? Nach der Bestaetigung wird der Beleg im Archiv, Start und Bericht gespeichert.',
    confirmReceiptAction: 'Bestaetigen',
    reviewBeforeSave: 'Vor dem Speichern pruefen',
    reviewBeforeSaveText: 'Pruefe Geschaeft, Datum, Betrag und Artikel. Fehlende oder falsche Felder bearbeiten.',
    analysisConfidence: 'Analysevertrauen',
    needsReview: 'Pruefung noetig',
    looksGood: 'Sieht gut aus',
    backHome: 'Zurueck zur Startseite',
    totalSpending: 'Gesamtausgaben',
    reportOverview: 'Uebersicht',
    highest: 'Hoechste',
    categoryBreakdown: 'Kategorieaufteilung',
    merchantBreakdown: 'Maerkte und Geschaefte',
    merchantReceiptsTitle: (store) => `${store} Belege`,
    clearMerchantFilter: 'Auswahl loeschen',
    productBreakdown: 'Artikeluebersicht',
    productsInfo: 'Artikel werden monatlich nach Gesamtmenge sortiert.',
    productMonthPeriod: 'Monat',
    productThisYear: 'Dieses Jahr',
    productMonthSelect: 'Monat waehlen',
    noProductData: 'Keine Artikeldaten diesen Monat',
    noProductDataText: 'Nach der Beleganalyse erscheinen Mengen hier.',
    receiptsShort: 'Belege',
    boughtItems: 'Gekauft',
    tapMerchantReceipts: 'Tippen, um Belege zu sehen',
    searchReceipts: 'Nach Laden, Kategorie, Artikel, Datum oder Betrag suchen',
    noReceipts: 'Noch keine Belege',
    noReceiptsText: 'Nach dem ersten Beleg erscheinen Ausgaben, Geschaefte und Berichte hier.',
    noReportData: 'Keine Daten fuer diesen Filter',
    thisMonth: 'Dieser Monat',
    allTime: 'Gesamt',
    currency: 'Waehrung',
    selectedCurrency: (symbol, name) => `Ausgewaehlte Waehrung: ${symbol} ${name}`,
    premium: 'Premium',
    premiumInfo: 'Unbegrenzte AI-Beleganalysen und erweiterte Berichte.',
    premiumTitle: 'Reciro Premium',
    premiumSubtitle: 'Unbegrenzte Beleganalysen, Produktberichte und werbefrei.',
    premiumMonthly: 'Monatlich: €1,99',
    premiumYearly: 'Jaehrlich: €21,49 (10% Rabatt)',
    premiumBenefits: [
      'Unbegrenzte AI-Beleganalysen',
      'PDF- und Foto-Beleganalyse',
      'Produkt-, Kategorie- und Geschaeftsberichte',
      'Monatliche Produktanalyse',
      'Werbefreie Nutzung',
    ],
    startPremium: 'Premium aktivieren',
    premiumSetupTitle: 'Premium kommt bald',
    premiumSetupText: 'Echte Abos werden ueber App Store und Google Play Kaeufe verbunden.',
    viewPremium: 'Premium ansehen',
    accountSync: 'Premium und Kaeufe',
    accountSyncInfo: 'Deine Daten bleiben auf diesem Telefon. Premium und Kaeufe werden ueber dein Store-Konto verwaltet.',
    welcomeTitle: 'Konto auswaehlen',
    welcomeText: 'Deine Daten bleiben auf diesem Telefon. Backups kannst du in deinem iCloud Drive oder Google Drive speichern.',
    chooseAccount: 'Fortfahren',
    signedInWith: (provider) => `${provider} ausgewaehlt`,
    signInWithApple: 'Mit Apple fortfahren',
    signOut: 'Abmelden',
    signOutTitle: 'Abmelden',
    signOutMessage: 'Nach dem Abmelden kehrt die App zum Startbildschirm zurueck. Gespeicherte Belege bleiben auf dem Telefon.',
    signOutConfirm: 'Abmelden',
    notSignedIn: 'Daten bleiben auf diesem Telefon',
    signInWithGoogle: 'Mit Google anmelden',
    signInWithICloud: 'iCloud verbinden',
    cloudSetupNeededTitle: 'Daten werden auf dem Geraet gespeichert',
    cloudSetupNeededText: 'Reciro speichert deine Belege nicht auf eigenen Servern. Erstelle unter Meine Daten ein Backup und bewahre es in iCloud Drive, Google Drive oder Dateien auf.',
    dataBackup: 'Daten und Backup',
    createBackup: 'Backup erstellen',
    restoreBackup: 'Backup-Datei waehlen',
    backupReady: 'Backup bereit',
    backupReadyText: (fileName) => `Backup erstellt: ${fileName}`,
    backupRestored: 'Backup wiederhergestellt',
    backupRestoredText: 'Belege, Einkommen und Waehrung wurden wiederhergestellt.',
    backupError: 'Backup-Fehler',
    backupErrorText: 'Backup konnte nicht abgeschlossen werden.',
    noBackupTitle: 'Keine Datei gewaehlt',
    noBackupText: 'Waehle eine Reciro-Backup-Datei, um deine Daten wiederherzustellen.',
    backupInfo: 'Belege, Einkommen und Einstellungen bleiben auf diesem Telefon. Du kannst das Backup in iCloud Drive, Google Drive oder Dateien speichern.',
    feedback: 'Feedback',
    feedbackInfo: 'Sende Ideen, Fehler oder Wuensche.',
    feedbackTitle: 'Was sollen wir verbessern?',
    feedbackText: 'Deine Nachricht wird direkt aus der App gesendet, damit wir Feedback lesen und die App verbessern.',
    feedbackPlaceholder: 'Z.B. Belege schneller lesen, dieser Bildschirm ist unklar...',
    sendFeedback: 'Feedback senden',
    feedbackEmptyTitle: 'Nachricht leer',
    feedbackEmptyText: 'Schreibe vor dem Senden eine kurze Nachricht.',
    feedbackSentTitle: 'Feedback gesendet',
    feedbackSentText: 'Deine Nachricht wurde direkt aus der App gesendet. Danke.',
    feedbackMailTitle: 'E-Mail konnte nicht geoeffnet werden',
    feedbackMailText: 'Ohne E-Mail-App auf dem Telefon kann die Nachricht eventuell nicht gesendet werden.',
    analysisUnavailableTitle: 'Analysedienst nicht verbunden',
    analysisUnavailableText: 'Echtes Beleglesen braucht einen OCR/AI-Dienst. Details koennen vorerst manuell eingegeben werden.',
    analysisTimeoutTitle: 'Analyse dauert zu lange',
    analysisTimeoutText: 'Der Beleg konnte nicht gelesen werden. Verbindung pruefen oder Details manuell speichern.',
    cameraOpenErrorTitle: 'Kamera konnte nicht geoeffnet werden',
    cameraOpenErrorText: 'Bitte die Kamera-Berechtigung fuer Expo Go in den Telefoneinstellungen pruefen.',
    comingSoon: 'Demnaechst',
    comingSoonMessage: 'Diese Funktion kommt bald.',
    selected: 'Ausgewaehlt',
    back: 'Zurueck',
    spending: 'Ausgaben',
    receiptStoredText: 'Dieser Beleg ist auf dem Telefon gespeichert. Foto und Details sind jederzeit sichtbar.',
    noPhoto: 'Kein Foto',
    noPhotoText: 'Dieser Eintrag hat kein Belegfoto.',
    total: 'Gesamt',
    date: 'Datum',
    editReceipt: 'Beleg bearbeiten',
    saveChanges: 'Speichern',
    cancel: 'Abbrechen',
    deleteReceipt: 'Beleg loeschen',
    items: 'Artikel',
    editItems: 'Artikel bearbeiten',
    addItem: 'Artikel hinzufuegen',
    removeItem: 'Loeschen',
    itemName: 'Artikelname',
    itemAmount: 'Preis',
    quantity: 'Menge',
    unit: 'Einheit',
    tapForDetails: 'Tippen fuer Details',
    photoAvailable: 'Foto vorhanden',
    deleteTitle: 'Beleg loeschen',
    deleteMessage: 'Diesen Beleg aus dem Archiv loeschen?',
    deleteConfirm: 'Loeschen',
    missingInfo: 'Fehlende Info',
    enterStore: 'Geschaeftsname eingeben.',
    enterAmount: 'Gesamtbetrag eingeben.',
    permissionNeeded: 'Berechtigung erforderlich',
    galleryPermission: 'Galerie-Berechtigung ist erforderlich.',
    cameraPermission: 'Kamera-Berechtigung ist erforderlich.',
    photoNeeded: 'Foto erforderlich',
    choosePhotoFirst: 'Bitte zuerst Foto aufnehmen oder aus Galerie waehlen.',
    saveError: 'Speicherfehler',
    readError: 'Daten konnten nicht gelesen werden',
    recordsReadError: 'Problem beim Laden gespeicherter Belege.',
    receiptsSaveError: 'Belege konnten nicht gespeichert werden.',
    incomeSaveError: 'Einkommen konnte nicht gespeichert werden.',
    languageAutomatic: 'Automatisch nach Telefonsprache',
    languageAutomaticInfo: 'Die App prueft beim Start die Telefonsprache. Nicht unterstuetzte Sprachen werden auf Englisch geoeffnet.',
    currencySaveError: 'Waehrung konnte nicht gespeichert werden.',
    photoSaveErrorTitle: 'Foto konnte nicht gespeichert werden',
    photoSaveErrorText: 'Belegfoto konnte nicht gespeichert werden.',
    placeholderStore: 'Geschaeftsname',
    placeholderAmount: '0,00',
    categories: {
      grocery: 'Lebensmittel',
      food: 'Essen',
      transport: 'Transport',
      fuel: 'Kraftstoff',
      home: 'Haushalt',
      clothing: 'Kleidung',
      health: 'Gesundheit',
      other: 'Sonstiges',
    },
  },
  es: {
    appSubtitle: 'Escanea. Guarda. Simplifica.',
    navHome: 'Inicio',
    navReceipt: 'Ticket',
    navReport: 'Informe',
    navMonthlyReceipts: 'Meses',
    navProducts: 'Productos',
    navSettings: 'Ajustes',
    settings: 'Ajustes',
    appSettings: 'Ajustes de la app',
    settingsInfo: 'El idioma, los ingresos y futuras copias de seguridad estaran aqui.',
    language: 'Idioma',
    income: 'Ingresos',
    monthlyIncome: 'Ingreso mensual',
    incomeForMonth: 'Ingreso de este mes',
    previousMonth: 'Mes anterior',
    nextMonth: 'Mes siguiente',
    selectedMonth: 'Mes seleccionado',
    remainingMoney: 'Total restante',
    reportButton: 'Ver informe',
    totalThisMonth: 'Este mes',
    receiptArchive: 'Archivo de tickets',
    archiveInfo: 'Todos los tickets subidos quedan aqui. Toca un ticket para ver detalles.',
    monthlyReceiptsTitle: 'Tickets mensuales',
    monthlyReceiptsInfo: 'Consulta tickets y pagos mensuales por mes.',
    monthReceiptsTitle: (month) => `Tickets de ${month}`,
    tapMonthReceipts: 'Toca para ver este mes',
    topCategorySentence: (category, amount) => `El mayor gasto esta en ${category}: ${amount}.`,
    moneyLeft: 'Total restante',
    savings: 'Ahorro',
    receiptCount: 'Numero de tickets',
    searchResultCount: (count) => `${count} tickets encontrados`,
    dailyAverage: 'Media diaria',
    spendingInsightTitle: 'Donde gastas mas?',
    spendingInsightText: (category, amount) => `Este mes el gasto mas alto esta en ${category}. Total: ${amount}.`,
    recentSpending: 'Tickets anadidos recientemente',
    newReceipt: 'Nuevo ticket',
    addReceipt: 'Anadir ticket',
    freeUsageText: (used, limit) => `Has usado ${used}/${limit} analisis gratis este mes.`,
    freeLimitTitle: 'Limite gratis alcanzado',
    freeLimitText: (limit) => `Has usado tus ${limit} analisis gratis este mes. Mira un anuncio para 1 analisis extra o pasa a Premium.`,
    watchAdForScan: 'Ver anuncio +1 analisis',
    rewardedAdSetupTitle: 'No se pudo abrir el anuncio',
    rewardedAdSetupText: 'Los anuncios recompensados no funcionan en Expo Go. En un dev build o version de tienda, ver un anuncio anade 1 analisis.',
    rewardedCreditTitle: '1 analisis anadido',
    rewardedCreditText: 'Ya puedes analizar tu ticket otra vez.',
    receiptHelp: 'Haz una foto, analiza, revisa y anade al gasto.',
    noReceiptPhoto: 'Sin foto de ticket',
    choosePhotoHelp: 'Haz una foto o elige desde la galeria.',
    changeReceiptPhoto: 'Cambiar foto del ticket',
    addReceiptPhoto: 'Anadir foto del ticket',
    receiptStartTitle: 'Nuevo ticket',
    receiptStartText: 'Anade una foto y deja que la app complete los detalles.',
    takePhoto: 'Hacer foto',
    takePhotoHelp: 'Hacer una nueva foto del ticket.',
    cameraCapture: 'Capturar',
    cameraUsePhoto: 'Usar foto',
    cameraRetake: 'Repetir',
    cameraHint: 'Coloca el ticket dentro del marco',
    chooseFromGallery: 'Elegir de galeria',
    chooseFromGalleryHelp: 'Seleccionar una foto existente.',
    demoAnalyze: 'Analizar ticket',
    demoAnalyzing: 'Analizando ticket...',
    reanalyzeReceipt: 'Analizar otra vez',
    storeName: 'Nombre de tienda',
    totalAmount: 'Importe total',
    receiptCurrency: 'Moneda del ticket',
    originalAmount: 'Importe original',
    convertedAmount: 'Importe del reporte',
    exchangeRateErrorTitle: 'Tipo de cambio no disponible',
    exchangeRateErrorText: 'No pudimos convertir este ticket a tu moneda principal. Revisa la conexion e intentalo de nuevo.',
    taxAmount: 'Impuesto / IVA',
    subtotalAmount: 'Subtotal',
    exchangeRate: 'Tipo de cambio',
    duplicateReceiptTitle: 'Este ticket puede existir ya',
    duplicateReceiptText: 'Este ticket parece estar ya guardado, asi que no se anadio de nuevo.',
    saveAnyway: 'Guardar igualmente',
    imageQualityTitle: 'La foto puede no estar clara',
    imageQualityText: 'Esta foto parece de baja resolucion. El analisis puede fallar.',
    usePhotoAnyway: 'Usar igualmente',
    pickFile: 'Elegir archivo',
    pickFileHelp: 'Sube un PDF o una foto.',
    fileSaved: 'Archivo guardado',
    fileSavedText: 'El PDF fue guardado. Rellena los detalles manualmente y guarda.',
    openFile: 'Abrir PDF',
    openFileErrorTitle: 'No se pudo abrir el PDF',
    openFileErrorText: 'Este PDF no se encontro en el telefono o no se puede abrir.',
    exportCsv: 'Exportar CSV',
    exportReady: 'Export listo',
    exportError: 'Error de exportacion',
    exportErrorText: 'No se pudo crear el CSV.',
    category: 'Categoria',
    customCategory: 'Categoria personalizada',
    customCategoryPlaceholder: 'Ej. coche, escuela, impuesto...',
    readItems: 'Productos leidos',
    addToSpending: 'Anadir a gastos',
    manualSaveHelp: 'Para guardar sin analisis, introduce la tienda y el importe total.',
    editReceiptDetails: 'Editar detalles',
    confirmAndSave: 'Confirmar y guardar',
    confirmReceiptTitle: 'Guardar ticket',
    confirmReceiptMessage: 'Has revisado el resultado? Al confirmar, el ticket se guardara en archivo, inicio e informes.',
    confirmReceiptAction: 'Confirmar',
    reviewBeforeSave: 'Revisar antes de guardar',
    reviewBeforeSaveText: 'Revisa tienda, fecha, total y productos. Corrige campos faltantes o incorrectos.',
    analysisConfidence: 'Confianza del analisis',
    needsReview: 'Revisar',
    looksGood: 'Se ve bien',
    backHome: 'Volver al inicio',
    totalSpending: 'Gasto total',
    reportOverview: 'Resumen',
    highest: 'Mas alto',
    categoryBreakdown: 'Desglose por categoria',
    merchantBreakdown: 'Tiendas y comercios',
    merchantReceiptsTitle: (store) => `Tickets de ${store}`,
    clearMerchantFilter: 'Borrar seleccion',
    productBreakdown: 'Resumen de productos',
    productsInfo: 'Los productos se ordenan cada mes por cantidad total.',
    productMonthPeriod: 'Mes',
    productThisYear: 'Este ano',
    productMonthSelect: 'Elegir mes',
    noProductData: 'Sin datos de productos este mes',
    noProductDataText: 'Despues de analizar tickets, las cantidades apareceran aqui.',
    receiptsShort: 'tickets',
    boughtItems: 'Productos',
    tapMerchantReceipts: 'Toca para ver tickets',
    searchReceipts: 'Buscar tienda, categoria, producto, fecha o importe',
    noReceipts: 'Aun no hay tickets',
    noReceiptsText: 'Cuando anadas el primer ticket, veras gastos, tiendas e informes aqui.',
    noReportData: 'No hay datos para este filtro',
    thisMonth: 'Este mes',
    allTime: 'Todo',
    currency: 'Moneda',
    selectedCurrency: (symbol, name) => `Moneda seleccionada: ${symbol} ${name}`,
    premium: 'Premium',
    premiumInfo: 'Analisis AI ilimitado y reportes avanzados.',
    premiumTitle: 'Reciro Premium',
    premiumSubtitle: 'Tickets ilimitados, reportes de productos y sin anuncios.',
    premiumMonthly: 'Mensual: €1,99',
    premiumYearly: 'Anual: €21,49 (10% desc.)',
    premiumBenefits: [
      'Analisis AI ilimitado',
      'Analisis de tickets PDF y foto',
      'Reportes de productos, categorias y tiendas',
      'Analisis mensual de productos',
      'Uso sin anuncios',
    ],
    startPremium: 'Pasar a Premium',
    premiumSetupTitle: 'Premium pronto',
    premiumSetupText: 'Las suscripciones reales se conectaran con compras de App Store y Google Play.',
    viewPremium: 'Ver Premium',
    accountSync: 'Premium y compras',
    accountSyncInfo: 'Tus datos se quedan en este telefono. Premium y las compras se gestionan con tu cuenta de la tienda.',
    welcomeTitle: 'Elige tu cuenta',
    welcomeText: 'Tus datos se quedan en este telefono. Puedes guardar tus copias en tu iCloud Drive o Google Drive.',
    chooseAccount: 'Continuar',
    signedInWith: (provider) => `${provider} seleccionado`,
    signInWithApple: 'Continuar con Apple',
    signOut: 'Cerrar sesion',
    signOutTitle: 'Cerrar sesion',
    signOutMessage: 'Si cierras sesion, la app volvera a la pantalla inicial. Los tickets guardados permanecen en este telefono.',
    signOutConfirm: 'Cerrar sesion',
    notSignedIn: 'Datos en este telefono',
    signInWithGoogle: 'Entrar con Google',
    signInWithICloud: 'Conectar iCloud',
    cloudSetupNeededTitle: 'Datos guardados en el dispositivo',
    cloudSetupNeededText: 'Reciro no guarda tus tickets en sus servidores. Crea una copia desde Mis datos y guardala en iCloud Drive, Google Drive o Archivos.',
    dataBackup: 'Datos y copia',
    createBackup: 'Crear copia',
    restoreBackup: 'Elegir copia',
    backupReady: 'Copia lista',
    backupReadyText: (fileName) => `Copia creada: ${fileName}`,
    backupRestored: 'Copia restaurada',
    backupRestoredText: 'Tickets, ingresos y moneda fueron restaurados.',
    backupError: 'Error de copia',
    backupErrorText: 'No se pudo completar la copia.',
    noBackupTitle: 'Ningun archivo elegido',
    noBackupText: 'Elige un archivo de copia de Reciro para restaurar tus datos.',
    backupInfo: 'Tickets, ingresos y ajustes se quedan en este telefono. Puedes guardar la copia en iCloud Drive, Google Drive o Archivos.',
    feedback: 'Comentarios',
    feedbackInfo: 'Envia sugerencias, errores o ideas.',
    feedbackTitle: 'Que deberiamos mejorar?',
    feedbackText: 'Tu mensaje se envia desde la app para leer los comentarios y mejorar la app.',
    feedbackPlaceholder: 'Ej. hacer la lectura mas rapida, esta pantalla es confusa...',
    sendFeedback: 'Enviar comentario',
    feedbackEmptyTitle: 'Mensaje vacio',
    feedbackEmptyText: 'Escribe un mensaje corto antes de enviar.',
    feedbackSentTitle: 'Comentario enviado',
    feedbackSentText: 'Tu mensaje se envio desde la app. Gracias.',
    feedbackMailTitle: 'No se pudo abrir el email',
    feedbackMailText: 'Si no hay app de email en el telefono, el mensaje puede no enviarse.',
    analysisUnavailableTitle: 'Servicio de analisis no conectado',
    analysisUnavailableText: 'La lectura real necesita un servicio OCR/AI. Por ahora puedes introducir los datos manualmente.',
    analysisTimeoutTitle: 'Analisis demasiado largo',
    analysisTimeoutText: 'No se pudo leer el ticket. Revisa la conexion o guarda los datos manualmente.',
    cameraOpenErrorTitle: 'No se pudo abrir la camara',
    cameraOpenErrorText: 'Revisa el permiso de camara de Expo Go en los ajustes del telefono e intentalo de nuevo.',
    comingSoon: 'Pronto',
    comingSoonMessage: 'Esta funcion se anadira pronto.',
    selected: 'Seleccionado',
    back: 'Volver',
    spending: 'Gasto',
    receiptStoredText: 'Este ticket esta guardado en el telefono. Puedes ver su foto y detalles cuando quieras.',
    noPhoto: 'Sin foto',
    noPhotoText: 'Este registro no tiene foto de ticket.',
    total: 'Total',
    date: 'Fecha',
    editReceipt: 'Editar ticket',
    saveChanges: 'Guardar cambios',
    cancel: 'Cancelar',
    deleteReceipt: 'Eliminar ticket',
    items: 'Productos',
    editItems: 'Editar productos',
    addItem: 'Anadir producto',
    removeItem: 'Eliminar',
    itemName: 'Nombre del producto',
    itemAmount: 'Precio',
    quantity: 'Cantidad',
    unit: 'Unidad',
    tapForDetails: 'Toca para ver detalles',
    photoAvailable: 'foto disponible',
    deleteTitle: 'Eliminar ticket',
    deleteMessage: 'Eliminar este ticket del archivo?',
    deleteConfirm: 'Eliminar',
    missingInfo: 'Informacion faltante',
    enterStore: 'Escribe el nombre de la tienda.',
    enterAmount: 'Escribe el importe total.',
    permissionNeeded: 'Permiso necesario',
    galleryPermission: 'Se necesita permiso de galeria para elegir una foto.',
    cameraPermission: 'Se necesita permiso de camara para hacer una foto.',
    photoNeeded: 'Foto necesaria',
    choosePhotoFirst: 'Primero haz una foto o elige una desde la galeria.',
    saveError: 'Error al guardar',
    readError: 'No se pudieron leer los datos',
    recordsReadError: 'Hubo un problema al cargar los tickets.',
    receiptsSaveError: 'No se pudieron guardar los tickets.',
    incomeSaveError: 'No se pudo guardar el ingreso.',
    languageAutomatic: 'Automatico segun el idioma del telefono',
    languageAutomaticInfo: 'La app revisa el idioma del telefono al abrirse. Los idiomas no compatibles se abren en ingles.',
    currencySaveError: 'No se pudo guardar la moneda.',
    photoSaveErrorTitle: 'No se pudo guardar la foto',
    photoSaveErrorText: 'No se pudo guardar la foto del ticket.',
    placeholderStore: 'Nombre de tienda',
    placeholderAmount: '0,00',
    categories: {
      grocery: 'Supermercado',
      food: 'Comida',
      transport: 'Transporte',
      fuel: 'Combustible',
      home: 'Hogar',
      clothing: 'Ropa',
      health: 'Salud',
      other: 'Otros',
    },
  },
};

const featureTranslations = {
  en: {
    budgets: 'Budgets',
    budgetsInfo: 'Set monthly limits for your categories.',
    budgetHealth: 'Budget health',
    budgetLeft: 'left',
    budgetOver: 'over',
    monthlyLimit: 'Monthly limit',
    otherCategoryName: 'Other category name',
    otherCategoryPlaceholder: 'Example: school, car care, taxes...',
    saveBudgets: 'Save budgets',
    recurring: 'Monthly payments',
    recurringInfo: 'Track rent, subscriptions, bills, and fixed monthly costs.',
    recurringName: 'Payment name',
    recurringAmount: 'Monthly amount',
    recurringYearlyAmount: 'Yearly amount',
    recurringMonthlyEquivalent: 'monthly',
    recurringDay: 'Payment day',
    recurringMonth: 'Payment month',
    recurringFrequency: 'Frequency',
    recurringMonthly: 'Monthly',
    recurringYearly: 'Yearly',
    recurringActive: 'Active',
    recurringPaused: 'Paused',
    deleteRecurring: 'Delete',
    recurringIncludedInfo: 'Active monthly payments are included in monthly totals and reports.',
    addRecurring: 'Add monthly payment',
    noRecurring: 'No monthly payments yet.',
    spaces: 'Spaces',
    spacesInfo: 'Separate personal, business, travel, and family spending.',
    activeSpace: 'Active space',
    allSpaces: 'All spaces',
    personalSpace: 'Personal',
    businessSpace: 'Business',
    travelSpace: 'Travel',
    familySpace: 'Family',
    receiptType: 'Receipt type',
    expenseType: 'Expense',
    refundType: 'Refund',
    warranty: 'Warranty / reminder',
    warrantyUntil: 'Warranty until',
    importantReceipt: 'Important receipt',
    note: 'Note',
    notePlaceholder: 'Example: warranty, return deadline, invoice number...',
    priceHistory: 'Price history',
    lastPrice: 'Last',
    averagePrice: 'Avg.',
    lowestPrice: 'Low',
    highestPrice: 'High',
    markedImportant: 'Important',
    refundBadge: 'Refund',
    moneyAndBudget: 'Money and budget',
    receiptAndAnalysis: 'Receipt and analysis',
    dataControls: 'My data',
    accountAndPremium: 'Premium and purchases',
    supportAndFeedback: 'Support and feedback',
    privacyAndLegal: 'Privacy and legal',
    autoAnalyzeReceipts: 'Automatic receipt analysis',
    autoAnalyzeReceiptsInfo: 'Start AI analysis right after a photo is selected.',
    reviewBeforeSave: 'Review before saving',
    reviewBeforeSaveInfo: 'Keep extracted receipt details on screen before saving.',
    keepReceiptPhotos: 'Keep receipt photos',
    keepReceiptPhotosInfo: 'Store receipt photos on this phone after saving.',
    defaultCategory: 'Default category',
    defaultCategoryInfo: 'Used when AI cannot decide a category.',
    allData: 'All app data',
    clearAllData: 'Delete all data',
    clearAllDataTitle: 'Delete all data?',
    clearAllDataText: 'Receipts, income, budgets, monthly payments and local settings will be removed from this phone.',
    clearAllDataConfirm: 'Delete all',
    dataDeletedTitle: 'Data deleted',
    dataDeletedText: 'All local app data was removed.',
    deleteAccount: 'Delete account',
    deleteAccountInfo: 'Ask us to delete account and sync data.',
    deleteAccountTitle: 'Delete account request',
    deleteAccountText: 'Reciro does not keep a cloud account for your receipts. Local receipts can be removed from My data.',
    sendDeleteRequest: 'Send request',
    privacySummary: 'Receipt photos are stored on this phone unless you turn photo storage off. AI analysis sends the selected receipt image to the analysis service to read store, date, total and items.',
    privacyPolicyText: 'Reciro stores receipts, income, budgets, monthly payments and preferences locally on this phone. If receipt photo storage is enabled, receipt images are also kept locally. When AI analysis is used, the selected receipt image is sent to the receipt analysis service only to extract store, date, totals, categories and line items. Reciro does not sell personal data, does not use receipt content for advertising, and does not store receipt backups on its own servers. You can export, back up or delete local data from My data.',
    privacyPolicy: 'Privacy policy',
    termsOfUse: 'Terms of use',
    termsOfUseText: 'Reciro helps track receipts, spending, products and monthly payments. AI receipt analysis may be imperfect, so users should review important amounts, dates and categories before relying on reports. The app is provided for personal expense tracking and is not financial, tax or legal advice. Users are responsible for keeping backups of important data and for complying with local rules about receipts, invoices and accounting.',
    restorePurchases: 'Restore purchases',
    restorePurchasesInfo: 'For App Store and Google Play subscriptions once Premium is active.',
    restorePurchasesTitle: 'Purchases',
    restorePurchasesText: 'Purchase restore will be connected with App Store and Google Play subscriptions.',
    appVersion: 'App version',
    enabled: 'On',
    disabled: 'Off',
  },
  tr: {
    budgets: 'Bütçeler',
    budgetsInfo: 'Kategoriler için aylık limit belirle.',
    budgetHealth: 'Bütçe durumu',
    budgetLeft: 'kaldı',
    budgetOver: 'aşıldı',
    monthlyLimit: 'Aylık limit',
    otherCategoryName: 'Diğer kategori adı',
    otherCategoryPlaceholder: 'Örn. okul, oto bakım, vergi...',
    saveBudgets: 'Bütçeleri kaydet',
    recurring: 'Aylık ödemeler',
    recurringInfo: 'Kira, abonelik, fatura ve sabit aylık ödemeleri takip et.',
    recurringName: 'Ödeme adı',
    recurringAmount: 'Aylık tutar',
    recurringYearlyAmount: 'Yıllık tutar',
    recurringMonthlyEquivalent: 'aylık',
    recurringDay: 'Ödeme günü',
    recurringMonth: 'Ödeme ayı',
    recurringFrequency: 'Sıklık',
    recurringMonthly: 'Aylık',
    recurringYearly: 'Yıllık',
    recurringActive: 'Aktif',
    recurringPaused: 'Pasif',
    deleteRecurring: 'Sil',
    recurringIncludedInfo: 'Aktif aylık ödemeler aylık toplama ve raporlara dahil edilir.',
    addRecurring: 'Aylık ödeme ekle',
    noRecurring: 'Henüz aylık ödeme yok.',
    spaces: 'Alanlar',
    spacesInfo: 'Kişisel, iş, seyahat ve aile harcamalarını ayır.',
    activeSpace: 'Aktif alan',
    allSpaces: 'Tüm alanlar',
    personalSpace: 'Kişisel',
    businessSpace: 'İş',
    travelSpace: 'Seyahat',
    familySpace: 'Aile',
    receiptType: 'Fiş tipi',
    expenseType: 'Harcama',
    refundType: 'İade',
    warranty: 'Garanti / hatırlatma',
    warrantyUntil: 'Garanti tarihi',
    importantReceipt: 'Önemli fiş',
    note: 'Not',
    notePlaceholder: 'Örn. garanti, iade süresi, fatura numarası...',
    priceHistory: 'Fiyat geçmişi',
    lastPrice: 'Son',
    averagePrice: 'Ort.',
    lowestPrice: 'En düşük',
    highestPrice: 'En yüksek',
    markedImportant: 'Önemli',
    refundBadge: 'İade',
    moneyAndBudget: 'Para ve bütçe',
    receiptAndAnalysis: 'Fiş ve analiz',
    dataControls: 'Verilerim',
    accountAndPremium: 'Premium ve satın alma',
    supportAndFeedback: 'Yardım ve geri bildirim',
    privacyAndLegal: 'Gizlilik ve yasal',
    autoAnalyzeReceipts: 'Otomatik fiş analizi',
    autoAnalyzeReceiptsInfo: 'Fotoğraf seçilince AI analizi otomatik başlasın.',
    reviewBeforeSave: 'Kaydetmeden önce kontrol',
    reviewBeforeSaveInfo: 'Okunan fiş bilgileri kaydetmeden önce ekranda kalsın.',
    keepReceiptPhotos: 'Fiş fotoğraflarını sakla',
    keepReceiptPhotosInfo: 'Kaydedilen fiş fotoğrafları telefonda kalsın.',
    defaultCategory: 'Varsayılan kategori',
    defaultCategoryInfo: 'AI kategori bulamazsa bu kategori kullanılır.',
    allData: 'Tüm uygulama verileri',
    clearAllData: 'Tüm verileri sil',
    clearAllDataTitle: 'Tüm veriler silinsin mi?',
    clearAllDataText: 'Fişler, gelirler, bütçeler, aylık ödemeler ve yerel ayarlar bu telefondan silinir.',
    clearAllDataConfirm: 'Hepsini sil',
    dataDeletedTitle: 'Veriler silindi',
    dataDeletedText: 'Telefondaki tüm yerel uygulama verileri silindi.',
    deleteAccount: 'Hesabı sil',
    deleteAccountInfo: 'Hesap ve senkronizasyon verileri için silme talebi gönder.',
    deleteAccountTitle: 'Hesap silme talebi',
    deleteAccountText: 'Reciro fişlerin için bulut hesabı tutmaz. Telefondaki yerel fişleri Verilerim bölümünden silebilirsin.',
    sendDeleteRequest: 'Talep gönder',
    privacySummary: 'Fiş fotoğrafları, fotoğraf saklama kapalı değilse bu telefonda tutulur. AI analizi, mağaza, tarih, toplam ve ürünleri okumak için seçilen fiş görselini analiz servisine gönderir.',
    privacyPolicyText: 'Reciro; fişleri, gelirleri, bütçeleri, aylık ödemeleri ve tercihleri bu telefonda yerel olarak saklar. Fiş fotoğrafı saklama açıksa fiş görselleri de yerel olarak tutulur. AI analizi kullanıldığında seçilen fiş görseli yalnızca mağaza, tarih, toplam, kategori ve ürün satırlarını okumak için analiz servisine gönderilir. Reciro kişisel verileri satmaz, fiş içeriklerini reklam amacıyla kullanmaz ve fiş yedeklerini kendi sunucularında saklamaz. Yerel verilerini Verilerim bölümünden dışa aktarabilir, yedekleyebilir veya silebilirsin.',
    privacyPolicy: 'Gizlilik politikası',
    termsOfUse: 'Kullanım şartları',
    termsOfUseText: 'Reciro fiş, harcama, ürün ve aylık ödeme takibi için yardımcı olur. AI fiş analizi her zaman kusursuz olmayabilir; bu yüzden önemli tutar, tarih ve kategorileri raporlara güvenmeden önce kontrol etmek kullanıcının sorumluluğundadır. Uygulama kişisel harcama takibi içindir; finansal, vergi veya hukuki danışmanlık değildir. Önemli verilerin yedeğini almak ve fiş/fatura/muhasebe kurallarına uymak kullanıcının sorumluluğundadır.',
    restorePurchases: 'Satın almaları geri yükle',
    restorePurchasesInfo: 'Premium aktif olunca App Store ve Google Play abonelikleri için kullanılır.',
    restorePurchasesTitle: 'Satın almalar',
    restorePurchasesText: 'Satın alma geri yükleme App Store ve Google Play abonelikleri ile bağlanacak.',
    appVersion: 'Uygulama sürümü',
    enabled: 'Açık',
    disabled: 'Kapalı',
  },
  fr: {
    budgets: 'Budgets',
    budgetsInfo: 'Definissez des limites mensuelles par categorie.',
    budgetHealth: 'Etat du budget',
    budgetLeft: 'restant',
    budgetOver: 'depasse',
    monthlyLimit: 'Limite mensuelle',
    otherCategoryName: 'Nom de la categorie autre',
    otherCategoryPlaceholder: 'Ex. ecole, voiture, taxes...',
    saveBudgets: 'Enregistrer les budgets',
    recurring: 'Paiements mensuels',
    recurringInfo: 'Suivez loyer, abonnements, factures et frais fixes mensuels.',
    recurringName: 'Nom du paiement',
    recurringAmount: 'Montant mensuel',
    recurringYearlyAmount: 'Montant annuel',
    recurringMonthlyEquivalent: 'par mois',
    recurringDay: 'Jour de paiement',
    recurringMonth: 'Mois de paiement',
    recurringFrequency: 'Frequence',
    recurringMonthly: 'Mensuel',
    recurringYearly: 'Annuel',
    recurringActive: 'Actif',
    recurringPaused: 'En pause',
    deleteRecurring: 'Supprimer',
    recurringIncludedInfo: 'Les paiements mensuels actifs sont inclus dans les totaux mensuels et les rapports.',
    addRecurring: 'Ajouter un paiement mensuel',
    noRecurring: 'Aucun paiement mensuel pour le moment.',
    spaces: 'Espaces',
    spacesInfo: 'Separez depenses personnelles, pro, voyage et famille.',
    activeSpace: 'Espace actif',
    allSpaces: 'Tous les espaces',
    personalSpace: 'Personnel',
    businessSpace: 'Professionnel',
    travelSpace: 'Voyage',
    familySpace: 'Famille',
    receiptType: 'Type de ticket',
    expenseType: 'Depense',
    refundType: 'Remboursement',
    warranty: 'Garantie / rappel',
    warrantyUntil: 'Garantie jusqu au',
    importantReceipt: 'Ticket important',
    note: 'Note',
    notePlaceholder: 'Ex. garantie, date de retour, numero de facture...',
    priceHistory: 'Historique des prix',
    lastPrice: 'Dernier',
    averagePrice: 'Moy.',
    lowestPrice: 'Bas',
    highestPrice: 'Haut',
    markedImportant: 'Important',
    refundBadge: 'Remboursement',
  },
  de: {
    budgets: 'Budgets',
    budgetsInfo: 'Monatliche Limits fuer Kategorien festlegen.',
    budgetHealth: 'Budgetstatus',
    budgetLeft: 'uebrig',
    budgetOver: 'ueberschritten',
    monthlyLimit: 'Monatslimit',
    otherCategoryName: 'Name fuer Sonstiges',
    otherCategoryPlaceholder: 'Z.B. Schule, Auto, Steuern...',
    saveBudgets: 'Budgets speichern',
    recurring: 'Monatliche Zahlungen',
    recurringInfo: 'Miete, Abos, Rechnungen und feste monatliche Kosten verfolgen.',
    recurringName: 'Name der Zahlung',
    recurringAmount: 'Monatlicher Betrag',
    recurringYearlyAmount: 'Jaehrlicher Betrag',
    recurringMonthlyEquivalent: 'pro Monat',
    recurringDay: 'Zahlungstag',
    recurringMonth: 'Zahlungsmonat',
    recurringFrequency: 'Haeufigkeit',
    recurringMonthly: 'Monatlich',
    recurringYearly: 'Jaehrlich',
    recurringActive: 'Aktiv',
    recurringPaused: 'Pausiert',
    deleteRecurring: 'Loeschen',
    recurringIncludedInfo: 'Aktive monatliche Zahlungen werden in Monatsgesamt und Berichten beruecksichtigt.',
    addRecurring: 'Monatliche Zahlung hinzufuegen',
    noRecurring: 'Noch keine monatlichen Zahlungen.',
    spaces: 'Bereiche',
    spacesInfo: 'Persoenliche, berufliche, Reise- und Familienausgaben trennen.',
    activeSpace: 'Aktiver Bereich',
    allSpaces: 'Alle Bereiche',
    personalSpace: 'Persoenlich',
    businessSpace: 'Beruflich',
    travelSpace: 'Reise',
    familySpace: 'Familie',
    receiptType: 'Belegtyp',
    expenseType: 'Ausgabe',
    refundType: 'Rueckerstattung',
    warranty: 'Garantie / Erinnerung',
    warrantyUntil: 'Garantie bis',
    importantReceipt: 'Wichtiger Beleg',
    note: 'Notiz',
    notePlaceholder: 'Z.B. Garantie, Rueckgabefrist, Rechnungsnummer...',
    priceHistory: 'Preishistorie',
    lastPrice: 'Letzter',
    averagePrice: 'Durchschn.',
    lowestPrice: 'Niedrig',
    highestPrice: 'Hoch',
    markedImportant: 'Wichtig',
    refundBadge: 'Rueckerstattung',
  },
  es: {
    budgets: 'Presupuestos',
    budgetsInfo: 'Define limites mensuales por categoria.',
    budgetHealth: 'Estado del presupuesto',
    budgetLeft: 'restante',
    budgetOver: 'superado',
    monthlyLimit: 'Limite mensual',
    otherCategoryName: 'Nombre de otra categoria',
    otherCategoryPlaceholder: 'Ej. escuela, coche, impuestos...',
    saveBudgets: 'Guardar presupuestos',
    recurring: 'Pagos mensuales',
    recurringInfo: 'Controla alquiler, suscripciones, facturas y costes fijos mensuales.',
    recurringName: 'Nombre del pago',
    recurringAmount: 'Importe mensual',
    recurringYearlyAmount: 'Importe anual',
    recurringMonthlyEquivalent: 'al mes',
    recurringDay: 'Dia de pago',
    recurringMonth: 'Mes de pago',
    recurringFrequency: 'Frecuencia',
    recurringMonthly: 'Mensual',
    recurringYearly: 'Anual',
    recurringActive: 'Activo',
    recurringPaused: 'Pausado',
    deleteRecurring: 'Eliminar',
    recurringIncludedInfo: 'Los pagos mensuales activos se incluyen en los totales mensuales e informes.',
    addRecurring: 'Anadir pago mensual',
    noRecurring: 'Aun no hay pagos mensuales.',
    spaces: 'Espacios',
    spacesInfo: 'Separa gastos personales, trabajo, viaje y familia.',
    activeSpace: 'Espacio activo',
    allSpaces: 'Todos los espacios',
    personalSpace: 'Personal',
    businessSpace: 'Trabajo',
    travelSpace: 'Viaje',
    familySpace: 'Familia',
    receiptType: 'Tipo de ticket',
    expenseType: 'Gasto',
    refundType: 'Reembolso',
    warranty: 'Garantia / recordatorio',
    warrantyUntil: 'Garantia hasta',
    importantReceipt: 'Ticket importante',
    note: 'Nota',
    notePlaceholder: 'Ej. garantia, fecha de devolucion, numero de factura...',
    priceHistory: 'Historial de precios',
    lastPrice: 'Ultimo',
    averagePrice: 'Media',
    lowestPrice: 'Bajo',
    highestPrice: 'Alto',
    markedImportant: 'Importante',
    refundBadge: 'Reembolso',
  },
};

translations.it = {
  ...translations.en,
  appSubtitle: 'Scansiona. Salva. Semplifica.',
  navHome: 'Home',
  navReport: 'Report',
  navMonthlyReceipts: 'Mesi',
  navProducts: 'Prodotti',
  navSettings: 'Impostazioni',
  settings: 'Impostazioni',
  income: 'Entrate',
  monthlyIncome: 'Reddito mensile',
  totalThisMonth: 'Totale del mese',
  receiptArchive: 'Archivio scontrini',
  monthlyReceiptsTitle: 'Scontrini mensili',
  recentSpending: 'Scontrini aggiunti di recente',
  addReceipt: 'Aggiungi scontrino',
  receiptPhotoMissing: 'Nessuna foto dello scontrino',
  takeReceiptPhoto: 'Scatta foto',
  chooseFromGallery: 'Scegli dalla galleria',
  analyzingReceipt: 'Analisi dello scontrino...',
  analysisDone: 'Analisi completata',
  storeName: 'Nome negozio',
  amount: 'Totale',
  receiptDate: 'Data',
  category: 'Categoria',
  itemsRead: 'Prodotti letti',
  confirmAndSave: 'Salva',
  saveReceipt: 'Salva scontrino',
  receiptDetails: 'Dettagli scontrino',
  showMore: 'Mostra dettagli',
  showLess: 'Nascondi dettagli',
  back: 'Indietro',
  cancel: 'Annulla',
  selected: 'Selezionato',
  noReceipts: 'Nessuno scontrino',
  searchReceipts: 'Cerca scontrini',
  categoryBreakdown: 'Distribuzione categorie',
  merchantBreakdown: 'Negozi e commercianti',
  reportOverview: 'Panoramica',
  totalSpending: 'Spesa totale',
  thisMonth: 'Questo mese',
  allTime: 'Sempre',
  receiptsShort: 'scontrini',
  productBreakdown: 'Riepilogo prodotti',
  productMonthPeriod: 'Mese',
  productThisYear: "Quest'anno",
  productMonthSelect: 'Scegli mese',
  noProductData: 'Nessun prodotto trovato',
  quantity: 'Quantita',
  dataBackup: 'Dati e backup',
  createBackup: 'Crea backup',
  restoreBackup: 'Ripristina backup',
  exportCsv: 'Esporta CSV',
  feedback: 'Feedback',
  accountSync: 'Premium e acquisti',
  signOut: 'Esci',
  premium: 'Premium',
  deleteReceipt: 'Elimina scontrino',
  editReceipt: 'Modifica scontrino',
  currency: 'Valuta',
  categories: {
    grocery: 'Supermercato',
    food: 'Cibo',
    transport: 'Trasporti',
    fuel: 'Carburante',
    home: 'Casa',
    clothing: 'Abbigliamento',
    health: 'Salute',
    other: 'Altro',
  },
};

translations.pt = {
  ...translations.en,
  appSubtitle: 'Digitalize. Guarde. Simplifique.',
  navHome: 'Inicio',
  navReport: 'Relatorio',
  navMonthlyReceipts: 'Meses',
  navProducts: 'Produtos',
  navSettings: 'Definicoes',
  settings: 'Definicoes',
  income: 'Rendimento',
  monthlyIncome: 'Rendimento mensal',
  totalThisMonth: 'Total do mes',
  receiptArchive: 'Arquivo de recibos',
  monthlyReceiptsTitle: 'Recibos mensais',
  recentSpending: 'Recibos adicionados recentemente',
  addReceipt: 'Adicionar recibo',
  receiptPhotoMissing: 'Sem foto do recibo',
  takeReceiptPhoto: 'Tirar foto',
  chooseFromGallery: 'Escolher da galeria',
  analyzingReceipt: 'A analisar recibo...',
  analysisDone: 'Analise concluida',
  storeName: 'Nome da loja',
  amount: 'Total',
  receiptDate: 'Data',
  category: 'Categoria',
  itemsRead: 'Produtos lidos',
  confirmAndSave: 'Guardar',
  saveReceipt: 'Guardar recibo',
  receiptDetails: 'Detalhes do recibo',
  showMore: 'Mostrar detalhes',
  showLess: 'Ocultar detalhes',
  back: 'Voltar',
  cancel: 'Cancelar',
  selected: 'Selecionado',
  noReceipts: 'Sem recibos',
  searchReceipts: 'Pesquisar recibos',
  categoryBreakdown: 'Distribuicao por categoria',
  merchantBreakdown: 'Lojas e comerciantes',
  reportOverview: 'Resumo',
  totalSpending: 'Despesa total',
  thisMonth: 'Este mes',
  allTime: 'Sempre',
  receiptsShort: 'recibos',
  productBreakdown: 'Resumo de produtos',
  productMonthPeriod: 'Mes',
  productThisYear: 'Este ano',
  productMonthSelect: 'Escolher mes',
  noProductData: 'Nenhum produto encontrado',
  quantity: 'Quantidade',
  dataBackup: 'Dados e backup',
  createBackup: 'Criar backup',
  restoreBackup: 'Restaurar backup',
  exportCsv: 'Exportar CSV',
  feedback: 'Feedback',
  accountSync: 'Premium e compras',
  signOut: 'Terminar sessao',
  premium: 'Premium',
  deleteReceipt: 'Eliminar recibo',
  editReceipt: 'Editar recibo',
  currency: 'Moeda',
  categories: {
    grocery: 'Supermercado',
    food: 'Comida',
    transport: 'Transporte',
    fuel: 'Combustivel',
    home: 'Casa',
    clothing: 'Roupa',
    health: 'Saude',
    other: 'Outro',
  },
};

translations.nl = {
  ...translations.en,
  appSubtitle: 'Scan. Bewaar. Vereenvoudig.',
  navHome: 'Start',
  navReport: 'Rapport',
  navMonthlyReceipts: 'Maanden',
  navProducts: 'Producten',
  navSettings: 'Instellingen',
  settings: 'Instellingen',
  income: 'Inkomen',
  monthlyIncome: 'Maandelijks inkomen',
  totalThisMonth: 'Totaal deze maand',
  receiptArchive: 'Bonnenarchief',
  monthlyReceiptsTitle: 'Maandelijkse bonnen',
  recentSpending: 'Recent toegevoegde bonnen',
  addReceipt: 'Bon toevoegen',
  receiptPhotoMissing: 'Geen bonfoto',
  takeReceiptPhoto: 'Foto maken',
  chooseFromGallery: 'Uit galerij kiezen',
  analyzingReceipt: 'Bon wordt geanalyseerd...',
  analysisDone: 'Analyse voltooid',
  storeName: 'Winkelnaam',
  amount: 'Totaal',
  receiptDate: 'Datum',
  category: 'Categorie',
  itemsRead: 'Gelezen producten',
  confirmAndSave: 'Opslaan',
  saveReceipt: 'Bon opslaan',
  receiptDetails: 'Bondetails',
  showMore: 'Details tonen',
  showLess: 'Details verbergen',
  back: 'Terug',
  cancel: 'Annuleren',
  selected: 'Geselecteerd',
  noReceipts: 'Geen bonnen',
  searchReceipts: 'Bonnen zoeken',
  categoryBreakdown: 'Categorieverdeling',
  merchantBreakdown: 'Winkels en zaken',
  reportOverview: 'Overzicht',
  totalSpending: 'Totale uitgaven',
  thisMonth: 'Deze maand',
  allTime: 'Altijd',
  receiptsShort: 'bonnen',
  productBreakdown: 'Productoverzicht',
  productMonthPeriod: 'Maand',
  productThisYear: 'Dit jaar',
  productMonthSelect: 'Maand kiezen',
  noProductData: 'Geen producten gevonden',
  quantity: 'Aantal',
  dataBackup: 'Gegevens en back-up',
  createBackup: 'Back-up maken',
  restoreBackup: 'Back-up herstellen',
  exportCsv: 'CSV exporteren',
  feedback: 'Feedback',
  accountSync: 'Premium en aankopen',
  signOut: 'Uitloggen',
  premium: 'Premium',
  deleteReceipt: 'Bon verwijderen',
  editReceipt: 'Bon bewerken',
  currency: 'Valuta',
  categories: {
    grocery: 'Supermarkt',
    food: 'Eten',
    transport: 'Vervoer',
    fuel: 'Brandstof',
    home: 'Wonen',
    clothing: 'Kleding',
    health: 'Gezondheid',
    other: 'Overig',
  },
};

featureTranslations.it = {
  ...featureTranslations.en,
  budgets: 'Budget',
  budgetsInfo: 'Imposta limiti mensili per categoria.',
  budgetHealth: 'Stato budget',
  monthlyLimit: 'Limite mensile',
  otherCategoryName: 'Nome categoria personalizzata',
  recurring: 'Pagamenti mensili',
  recurringInfo: 'Monitora affitto, abbonamenti, bollette e costi fissi.',
  recurringName: 'Nome pagamento',
  recurringAmount: 'Importo mensile',
  recurringYearlyAmount: 'Importo annuale',
  recurringMonthlyEquivalent: 'al mese',
  recurringFrequency: 'Frequenza',
  recurringMonthly: 'Mensile',
  recurringYearly: 'Annuale',
  recurringActive: 'Attivo',
  recurringPaused: 'In pausa',
  addRecurring: 'Aggiungi pagamento mensile',
  noRecurring: 'Nessun pagamento mensile.',
  receiptType: 'Tipo scontrino',
  expenseType: 'Spesa',
  refundType: 'Rimborso',
  warranty: 'Garanzia / promemoria',
  importantReceipt: 'Scontrino importante',
  note: 'Nota',
  moneyAndBudget: 'Denaro e budget',
  receiptAndAnalysis: 'Scontrini e analisi',
  dataControls: 'I miei dati',
  accountAndPremium: 'Account e premium',
  supportAndFeedback: 'Supporto e feedback',
  privacyAndLegal: 'Privacy e legale',
  autoAnalyzeReceipts: 'Analisi automatica',
  keepReceiptPhotos: 'Conserva foto scontrini',
  clearAllData: 'Cancella tutti i dati',
  deleteAccount: 'Elimina account',
  privacyPolicy: 'Informativa privacy',
  termsOfUse: 'Termini di utilizzo',
  appVersion: 'Versione app',
  enabled: 'Attivo',
  disabled: 'Disattivo',
};

featureTranslations.pt = {
  ...featureTranslations.en,
  budgets: 'Orcamentos',
  budgetsInfo: 'Defina limites mensais por categoria.',
  budgetHealth: 'Estado do orcamento',
  monthlyLimit: 'Limite mensal',
  otherCategoryName: 'Nome da categoria personalizada',
  recurring: 'Pagamentos mensais',
  recurringInfo: 'Acompanhe renda, subscricoes, contas e custos fixos.',
  recurringName: 'Nome do pagamento',
  recurringAmount: 'Valor mensal',
  recurringYearlyAmount: 'Valor anual',
  recurringMonthlyEquivalent: 'por mes',
  recurringFrequency: 'Frequencia',
  recurringMonthly: 'Mensal',
  recurringYearly: 'Anual',
  recurringActive: 'Ativo',
  recurringPaused: 'Pausado',
  addRecurring: 'Adicionar pagamento mensal',
  noRecurring: 'Ainda nao ha pagamentos mensais.',
  receiptType: 'Tipo de recibo',
  expenseType: 'Despesa',
  refundType: 'Reembolso',
  warranty: 'Garantia / lembrete',
  importantReceipt: 'Recibo importante',
  note: 'Nota',
  moneyAndBudget: 'Dinheiro e orcamento',
  receiptAndAnalysis: 'Recibos e analise',
  dataControls: 'Os meus dados',
  accountAndPremium: 'Conta e premium',
  supportAndFeedback: 'Suporte e feedback',
  privacyAndLegal: 'Privacidade e legal',
  autoAnalyzeReceipts: 'Analise automatica',
  keepReceiptPhotos: 'Guardar fotos dos recibos',
  clearAllData: 'Apagar todos os dados',
  deleteAccount: 'Eliminar conta',
  privacyPolicy: 'Politica de privacidade',
  termsOfUse: 'Termos de utilizacao',
  appVersion: 'Versao da app',
  enabled: 'Ativo',
  disabled: 'Inativo',
};

featureTranslations.nl = {
  ...featureTranslations.en,
  budgets: 'Budgetten',
  budgetsInfo: 'Stel maandlimieten per categorie in.',
  budgetHealth: 'Budgetstatus',
  monthlyLimit: 'Maandlimiet',
  otherCategoryName: 'Naam aangepaste categorie',
  recurring: 'Maandelijkse betalingen',
  recurringInfo: 'Volg huur, abonnementen, rekeningen en vaste kosten.',
  recurringName: 'Naam betaling',
  recurringAmount: 'Maandbedrag',
  recurringYearlyAmount: 'Jaarbedrag',
  recurringMonthlyEquivalent: 'per maand',
  recurringFrequency: 'Frequentie',
  recurringMonthly: 'Maandelijks',
  recurringYearly: 'Jaarlijks',
  recurringActive: 'Actief',
  recurringPaused: 'Gepauzeerd',
  addRecurring: 'Maandelijkse betaling toevoegen',
  noRecurring: 'Nog geen maandelijkse betalingen.',
  receiptType: 'Type bon',
  expenseType: 'Uitgave',
  refundType: 'Terugbetaling',
  warranty: 'Garantie / herinnering',
  importantReceipt: 'Belangrijke bon',
  note: 'Notitie',
  moneyAndBudget: 'Geld en budget',
  receiptAndAnalysis: 'Bonnen en analyse',
  dataControls: 'Mijn gegevens',
  accountAndPremium: 'Account en premium',
  supportAndFeedback: 'Support en feedback',
  privacyAndLegal: 'Privacy en juridisch',
  autoAnalyzeReceipts: 'Automatische analyse',
  keepReceiptPhotos: 'Bonfoto’s bewaren',
  clearAllData: 'Alle gegevens wissen',
  deleteAccount: 'Account verwijderen',
  privacyPolicy: 'Privacybeleid',
  termsOfUse: 'Gebruiksvoorwaarden',
  appVersion: 'Appversie',
  enabled: 'Aan',
  disabled: 'Uit',
};

// Complete direct translations for every supported language.

Object.assign(featureTranslations.fr, {
  clearAllDataTitle: "Supprimer toutes les donnees ?",
  clearAllDataText: "Les tickets, revenus, budgets, paiements mensuels et parametres locaux seront supprimes de ce telephone.",
  clearAllDataConfirm: "Tout supprimer",
  dataDeletedTitle: "Donnees supprimees",
  dataDeletedText: "Toutes les donnees locales de l'application ont ete supprimees.",
  deleteAccountTitle: "Demande de suppression de compte",
  deleteAccountText: "Cela ouvre une demande par email. Les tickets locaux sur ce telephone peuvent etre supprimes depuis Mes donnees.",
  sendDeleteRequest: "Envoyer la demande",
  reviewBeforeSave: "Verifier avant d'enregistrer",
  dataControls: "Mes donnees",
  clearAllData: "Supprimer toutes les donnees",
  receiptAndAnalysis: "Ticket et analyse",
  autoAnalyzeReceiptsInfo: "Demarrer l'analyse IA des qu'une photo est selectionnee.",
  autoAnalyzeReceipts: "Analyse automatique des tickets",
  enabled: "Active",
  disabled: "Desactive",
  reviewBeforeSaveInfo: "Conserver les details extraits du ticket a l'ecran avant d'enregistrer.",
  keepReceiptPhotos: "Conserver les photos des tickets",
  keepReceiptPhotosInfo: "Stocker les photos des tickets sur ce telephone apres enregistrement.",
  defaultCategory: "Categorie par defaut",
  defaultCategoryInfo: "Utilisee quand l'IA ne peut pas choisir une categorie.",
  restorePurchases: "Restaurer les achats",
  restorePurchasesTitle: "Achats",
  restorePurchasesText: "La restauration des achats sera liee aux abonnements App Store et Google Play.",
  restorePurchasesInfo: "Pour les abonnements App Store et Google Play une fois Premium actif.",
  deleteAccount: "Supprimer le compte",
  deleteAccountInfo: "Demandez-nous de supprimer le compte et les donnees synchronisees.",
  privacyAndLegal: "Confidentialite et legal",
  privacySummary: "Les photos des tickets sont stockees sur ce telephone sauf si vous desactivez le stockage des photos. L'analyse IA envoie l'image du ticket selectionne au service d'analyse pour lire le magasin, la date, le total et les articles.",
  privacyPolicy: "Politique de confidentialite",
  privacyPolicyText: "Reciro stocke les tickets, revenus, budgets, paiements mensuels et preferences localement sur ce telephone. Si le stockage des photos de tickets est active, les images sont egalement conservees localement. Lors de l'utilisation de l'analyse IA, l'image du ticket selectionne est envoyee au service d'analyse uniquement pour extraire le magasin, la date, les totaux, categories et articles. Reciro ne vend pas de donnees personnelles, n'utilise pas le contenu des tickets pour la publicite et ne stocke pas de sauvegardes de tickets sur ses propres serveurs. Vous pouvez exporter, sauvegarder ou supprimer les donnees locales depuis Mes donnees.",
  termsOfUse: "Conditions d'utilisation",
  termsOfUseText: "Reciro aide a suivre les tickets, depenses, produits et paiements mensuels. L'analyse IA des tickets peut etre imperfecte, les utilisateurs doivent verifier les montants, dates et categories importants avant de se fier aux rapports. L'application est fournie pour le suivi personnel des depenses et ne constitue pas un conseil financier, fiscal ou juridique. Les utilisateurs sont responsables de sauvegarder les donnees importantes et de respecter les regles locales concernant tickets, factures et comptabilite.",
  appVersion: "Version de l'application",
  moneyAndBudget: "Argent et budget",
  accountAndPremium: "Compte et premium",
  supportAndFeedback: "Support et retours",
});


Object.assign(featureTranslations.de, {
  clearAllDataTitle: "Alle Daten löschen?",
  clearAllDataText: "Quittungen, Einkommen, Budgets, monatliche Zahlungen und lokale Einstellungen werden von diesem Telefon entfernt.",
  clearAllDataConfirm: "Alle löschen",
  dataDeletedTitle: "Daten gelöscht",
  dataDeletedText: "Alle lokalen App-Daten wurden entfernt.",
  deleteAccountTitle: "Konto löschen Anfrage",
  deleteAccountText: "Dies öffnet eine E-Mail-Anfrage. Lokale Quittungen auf diesem Telefon können unter Meine Daten entfernt werden.",
  sendDeleteRequest: "Anfrage senden",
  reviewBeforeSave: "Vor dem Speichern prüfen",
  dataControls: "Meine Daten",
  clearAllData: "Alle Daten löschen",
  receiptAndAnalysis: "Quittung und Analyse",
  autoAnalyzeReceiptsInfo: "Starte KI-Analyse direkt nach Auswahl eines Fotos.",
  autoAnalyzeReceipts: "Automatische Quittungsanalyse",
  enabled: "An",
  disabled: "Aus",
  reviewBeforeSaveInfo: "Behalte extrahierte Quittungsdetails vor dem Speichern auf dem Bildschirm.",
  keepReceiptPhotos: "Quittungsfotos behalten",
  keepReceiptPhotosInfo: "Speichere Quittungsfotos nach dem Speichern auf diesem Telefon.",
  defaultCategory: "Standardkategorie",
  defaultCategoryInfo: "Wird verwendet, wenn die KI keine Kategorie bestimmen kann.",
  restorePurchases: "Käufe wiederherstellen",
  restorePurchasesTitle: "Käufe",
  restorePurchasesText: "Wiederherstellung der Käufe wird mit App Store und Google Play Abonnements verbunden.",
  restorePurchasesInfo: "Für App Store und Google Play Abonnements, sobald Premium aktiv ist.",
  deleteAccount: "Konto löschen",
  deleteAccountInfo: "Fordere uns auf, Konto und synchronisierte Daten zu löschen.",
  privacyAndLegal: "Datenschutz und Rechtliches",
  privacySummary: "Quittungsfotos werden auf diesem Telefon gespeichert, sofern die Fotospeicherung nicht deaktiviert ist. Die KI-Analyse sendet das ausgewählte Quittungsbild an den Analyse-Service, um Geschäft, Datum, Gesamtbetrag und Artikel zu lesen.",
  privacyPolicy: "Datenschutzerklärung",
  privacyPolicyText: "Reciro speichert Quittungen, Einkommen, Budgets, monatliche Zahlungen und Einstellungen lokal auf diesem Telefon. Wenn die Fotospeicherung aktiviert ist, werden Quittungsbilder ebenfalls lokal gespeichert. Bei Nutzung der KI-Analyse wird das ausgewählte Quittungsbild nur zum Extrahieren von Geschäft, Datum, Gesamtbeträgen, Kategorien und Positionen an den Analyse-Service gesendet. Reciro verkauft keine persönlichen Daten, nutzt Quittungsinhalte nicht für Werbung und speichert keine Beleg-Backups auf eigenen Servern. Du kannst lokale Daten unter Meine Daten exportieren, sichern oder löschen.",
  termsOfUse: "Nutzungsbedingungen",
  termsOfUseText: "Reciro hilft beim Verfolgen von Quittungen, Ausgaben, Produkten und monatlichen Zahlungen. Die KI-Quittungsanalyse kann ungenau sein, daher sollten Nutzer wichtige Beträge, Daten und Kategorien vor der Nutzung der Berichte prüfen. Die App dient der persönlichen Ausgabenverfolgung und ist keine Finanz-, Steuer- oder Rechtsberatung. Nutzer sind verantwortlich für Sicherungen wichtiger Daten und die Einhaltung lokaler Vorschriften zu Quittungen, Rechnungen und Buchhaltung.",
  appVersion: "App-Version",
  moneyAndBudget: "Geld und Budget",
  accountAndPremium: "Konto und Premium",
  supportAndFeedback: "Support und Feedback",
});


Object.assign(featureTranslations.es, {
  clearAllDataTitle: "¿Eliminar todos los datos?",
  clearAllDataText: "Recibos, ingresos, presupuestos, pagos mensuales y configuraciones locales se eliminarán de este teléfono.",
  clearAllDataConfirm: "Eliminar todo",
  dataDeletedTitle: "Datos eliminados",
  dataDeletedText: "Todos los datos locales de la app fueron eliminados.",
  deleteAccountTitle: "Solicitud de eliminación de cuenta",
  deleteAccountText: "Esto abre una solicitud por correo. Los recibos locales en este teléfono pueden eliminarse desde Mis datos.",
  sendDeleteRequest: "Enviar solicitud",
  reviewBeforeSave: "Revisar antes de guardar",
  dataControls: "Mis datos",
  clearAllData: "Eliminar todos los datos",
  receiptAndAnalysis: "Recibo y análisis",
  autoAnalyzeReceiptsInfo: "Iniciar análisis AI justo después de seleccionar una foto.",
  autoAnalyzeReceipts: "Análisis automático de recibos",
  enabled: "Activado",
  disabled: "Desactivado",
  reviewBeforeSaveInfo: "Mantener detalles extraídos del recibo en pantalla antes de guardar.",
  keepReceiptPhotos: "Conservar fotos de recibos",
  keepReceiptPhotosInfo: "Guardar fotos de recibos en este teléfono después de guardar.",
  defaultCategory: "Categoría predeterminada",
  defaultCategoryInfo: "Usada cuando AI no puede decidir una categoría.",
  restorePurchases: "Restaurar compras",
  restorePurchasesTitle: "Compras",
  restorePurchasesText: "La restauración de compras se conectará con suscripciones de App Store y Google Play.",
  restorePurchasesInfo: "Para suscripciones de App Store y Google Play una vez que Premium esté activo.",
  deleteAccount: "Eliminar cuenta",
  deleteAccountInfo: "Solicítanos eliminar cuenta y datos sincronizados.",
  privacyAndLegal: "Privacidad y legal",
  privacySummary: "Las fotos de recibos se almacenan en este teléfono a menos que desactives el almacenamiento de fotos. El análisis AI envía la imagen del recibo seleccionado al servicio de análisis para leer tienda, fecha, total y artículos.",
  privacyPolicy: "Política de privacidad",
  privacyPolicyText: "Reciro almacena recibos, ingresos, presupuestos, pagos mensuales y preferencias localmente en este teléfono. Si el almacenamiento de fotos de recibos está activado, las imágenes también se guardan localmente. Cuando se usa análisis AI, la imagen del recibo seleccionada se envía al servicio de análisis solo para extraer tienda, fecha, totales, categorías y artículos. Reciro no vende datos personales, no usa contenido de recibos para publicidad y no guarda copias de tickets en sus propios servidores. Puedes exportar, respaldar o eliminar datos locales desde Mis datos.",
  termsOfUse: "Términos de uso",
  termsOfUseText: "Reciro ayuda a rastrear recibos, gastos, productos y pagos mensuales. El análisis AI de recibos puede ser imperfecto, por lo que los usuarios deben revisar montos, fechas y categorías importantes antes de confiar en los informes. La app se ofrece para seguimiento personal de gastos y no es asesoría financiera, fiscal o legal. Los usuarios son responsables de mantener respaldos de datos importantes y cumplir con las normas locales sobre recibos, facturas y contabilidad.",
  appVersion: "Versión de la app",
  moneyAndBudget: "Dinero y presupuesto",
  accountAndPremium: "Cuenta y premium",
  supportAndFeedback: "Soporte y comentarios",
});


Object.assign(translations.it, {
  notSignedIn: "Dati su questo telefono",
  saveError: "Errore salvataggio",
  receiptsSaveError: "Gli scontrini non possono essere salvati sul telefono.",
  incomeSaveError: "Il reddito non può essere salvato.",
  currencySaveError: "La valuta non può essere salvata.",
  signOutTitle: "Disconnetti",
  signOutMessage: "Se ti disconnetti, l'app tornerà alla schermata iniziale. Gli scontrini salvati rimangono su questo telefono.",
  signOutConfirm: "Disconnetti",
  missingInfo: "Informazioni mancanti",
  enterStore: "Inserisci il nome del negozio.",
  enterAmount: "Inserisci l'importo totale.",
  deleteTitle: "Elimina scontrino",
  deleteMessage: "Eliminare questo scontrino dall'archivio?",
  deleteConfirm: "Elimina",
  backupReady: "Backup pronto",
  backupError: "Errore backup",
  backupErrorText: "Il backup non può essere completato.",
  noBackupTitle: "Nessun backup",
  noBackupText: "Nessun backup trovato da ripristinare.",
  backupRestored: "Backup ripristinato",
  backupRestoredText: "Scontrini, reddito e valuta sono stati ripristinati dall'ultimo backup.",
  exportReady: "Esportazione pronta",
  exportError: "Errore esportazione",
  exportErrorText: "Il file CSV non può essere creato.",
  feedbackMailTitle: "Impossibile aprire email",
  feedbackMailText: "Se non c'è un'app email sul telefono, il messaggio potrebbe non essere inviato.",
  freeLimitTitle: "Limite gratuito raggiunto",
  viewPremium: "Visualizza Premium",
  permissionNeeded: "Permesso richiesto",
  galleryPermission: "Serve il permesso per la galleria per scegliere una foto dello scontrino.",
  imageQualityTitle: "Foto potrebbe non essere chiara",
  imageQualityText: "Questa foto sembra a bassa risoluzione. L'analisi potrebbe essere errata.",
  usePhotoAnyway: "Usa comunque",
  photoSaveErrorTitle: "Impossibile salvare foto",
  photoSaveErrorText: "La foto dello scontrino non può essere salvata sul telefono.",
  cameraPermission: "Serve il permesso per la fotocamera per scattare una foto dello scontrino.",
  cameraOpenErrorTitle: "Impossibile aprire fotocamera",
  cameraOpenErrorText: "Controlla il permesso fotocamera per Expo Go nelle impostazioni del telefono e riprova.",
  fileSaved: "File salvato",
  fileSavedText: "Il file PDF è stato salvato. Compila i dettagli manualmente e salva.",
  photoNeeded: "Foto necessaria",
  choosePhotoFirst: "Prima scatta una foto dello scontrino o scegli una dalla galleria.",
  analysisUnavailableTitle: "Servizio analisi non connesso",
  analysisUnavailableText: "La lettura reale dello scontrino richiede un servizio OCR/AI. Per ora puoi inserire i dettagli manualmente e salvare.",
  analysisTimeoutTitle: "Analisi troppo lunga",
  analysisTimeoutText: "Lo scontrino non può essere letto. Controlla la connessione e riprova, o salva i dettagli manualmente.",
  duplicateReceiptTitle: "Questo scontrino potrebbe esistere già",
  duplicateReceiptText: "Questo scontrino sembra già salvato, quindi non è stato aggiunto di nuovo.",
  exchangeRateErrorTitle: "Tasso di cambio non disponibile",
  exchangeRateErrorText: "Questo scontrino non può essere convertito nella tua valuta principale. Controlla la connessione e riprova.",
  noReceiptsText: "Dopo aver aggiunto il primo scontrino, qui appariranno spese, negozi e report.",
  receiptCount: "Numero scontrini",
  highest: "Massimo",
  newReceipt: "Nuovo scontrino",
  receiptStartTitle: "Nuovo scontrino",
  receiptStartText: "Aggiungi una foto dello scontrino e lascia che l'app compili i dettagli.",
  noReceiptPhoto: "Nessuna foto dello scontrino",
  choosePhotoHelp: "Scatta una foto o scegli dalla galleria.",
  changeReceiptPhoto: "Cambia foto scontrino",
  addReceiptPhoto: "Aggiungi foto scontrino",
  demoAnalyzing: "Analisi scontrino...",
  reviewBeforeSave: "Controlla prima di salvare",
  needsReview: "Da controllare",
  looksGood: "Sembra corretto",
  reviewBeforeSaveText: "Controlla negozio, data, totale e articoli. Modifica ciò che manca o è errato.",
  analysisConfidence: "Affidabilita analisi",
  reanalyzeReceipt: "Analizza di nuovo",
  totalAmount: "Importo totale",
  manualSaveHelp: "Per salvare senza analisi, inserisci nome negozio e importo totale.",
  editReceiptDetails: "Modifica dettagli",
  receiptCurrency: "Valuta scontrino",
  date: "Data",
  subtotalAmount: "Subtotale",
  taxAmount: "Tasse / IVA",
  customCategory: "Categoria personalizzata",
  customCategoryPlaceholder: "Esempio: cura auto, scuola, tasse...",
  readItems: "Leggi articoli",
  items: "Articoli",
  removeItem: "Rimuovi",
  itemName: "Nome articolo",
  itemAmount: "Prezzo",
  unit: "Unità",
  addItem: "Aggiungi articolo",
  clearMerchantFilter: "Cancella selezione",
  noReportData: "Nessun dato per questo filtro",
  archiveInfo: "Tutti gli scontrini caricati rimangono qui. Tocca uno scontrino per vedere i dettagli.",
  selectedMonth: "Mese selezionato",
  monthlyReceiptsInfo: "Visualizza scontrini e pagamenti mensili mese per mese.",
  tapMonthReceipts: "Tocca per vedere questo mese",
  noProductDataText: "Dopo l'analisi dello scontrino, qui appariranno le quantità dei prodotti.",
  feedbackEmptyTitle: "Messaggio vuoto",
  feedbackEmptyText: "Scrivi un breve messaggio prima di inviare.",
  feedbackSentTitle: "Feedback inviato",
  feedbackSentText: "Il tuo messaggio è stato inviato dall'app. Grazie.",
  remainingMoney: "Totale rimanente",
  previousMonth: "Mese precedente",
  nextMonth: "Mese successivo",
  incomeForMonth: "Reddito di questo mese",
  spending: "Spese",
  reportButton: "Visualizza report",
  backupInfo: "Scontrini, entrate e impostazioni restano su questo telefono. Puoi salvare il backup in iCloud, Google Drive o nei file.",
  feedbackTitle: "Cosa dovremmo migliorare?",
  feedbackText: "Il tuo messaggio viene inviato dall'app, così possiamo leggere i feedback e migliorare l'app.",
  feedbackPlaceholder: "Esempio: rendere la lettura scontrini piu veloce, questa schermata e confusa...",
  sendFeedback: "Invia feedback",
  premiumTitle: "Reciro Premium",
  premiumSubtitle: "Scansioni illimitate, report prodotti e uso senza pubblicita.",
  premiumMonthly: "Mensile: €1.99",
  premiumYearly: "Annuale: €21.49 (10% sconto)",
  premiumBenefits: ["Scansioni illimitate AI degli scontrini", "Analisi PDF e foto degli scontrini", "Report prodotti, categorie e negozi", "Analisi prodotti mensile", "Uso senza pubblicita"],
  startPremium: "Attiva Premium",
  premiumSetupTitle: "Premium in arrivo",
  premiumSetupText: "Gli abbonamenti reali saranno collegati tramite acquisti App Store e Google Play.",
  accountSyncInfo: "I tuoi dati restano su questo telefono. Premium e acquisti sono gestiti dal tuo account dello store.",
  feedbackInfo: "Invia suggerimenti, bug o richieste di funzionalita.",
  noPhoto: "Nessuna foto",
  noPhotoText: "Questo record non ha foto dello scontrino.",
  placeholderStore: "Nome negozio",
  placeholderAmount: "0.00",
  editItems: "Modifica articoli",
  saveChanges: "Salva modifiche",
  convertedAmount: "Importo report",
  originalAmount: "Importo originale",
  exchangeRate: "Tasso di cambio",
  boughtItems: "Articoli",
  tapMerchantReceipts: "Tocca per vedere scontrini",
  welcomeTitle: "Scegli il tuo account",
  welcomeText: "Inizia a tracciare le tue spese.",
  signInWithGoogle: "Accedi con Google",
  signInWithICloud: "Connetti iCloud",
  takePhoto: "Scatta foto",
  takePhotoHelp: "Scatta una nuova foto dello scontrino.",
  chooseFromGalleryHelp: "Seleziona una foto dello scontrino esistente.",
  pickFile: "Scegli file",
  pickFileHelp: "Carica un file PDF o foto.",
  cameraHint: "Posiziona lo scontrino nel riquadro",
  cameraRetake: "Ritocca",
  cameraUsePhoto: "Usa foto",
  cameraCapture: "Scatta",
  freeUsageText: (used, limit) => `Hai usato ${used}/${limit} scansioni gratuite questo mese.`,
  backupReadyText: fileName => `Backup creato: ${fileName}`,
  freeLimitText: limit => `Hai usato le ${limit} scansioni gratuite di questo mese. Guarda una pubblicita per 1 scansione extra o passa a Premium.`,
  watchAdForScan: "Guarda pubblicita +1",
  rewardedAdSetupTitle: "Pubblicita non disponibile",
  rewardedAdSetupText: "Le pubblicita con ricompensa non funzionano in Expo Go. In un dev build o nella versione store, guardare una pubblicita aggiunge 1 scansione.",
  rewardedCreditTitle: "1 scansione aggiunta",
  rewardedCreditText: "Ora puoi analizzare di nuovo lo scontrino.",
  topCategorySentence: (category, amount) => `La spesa maggiore e in ${category}: ${amount}.`,
  merchantReceiptsTitle: store => `Scontrini di ${store}`,
  searchResultCount: count => `${count} scontrini trovati`,
  monthReceiptsTitle: month => `Scontrini di ${month}`,
  selectedCurrency: (symbol, name) => `Valuta selezionata: ${symbol} ${name}`,
  signedInWith: provider => `${provider} selezionato`,
});


Object.assign(featureTranslations.it, {
  clearAllDataTitle: "Eliminare tutti i dati?",
  clearAllDataText: "Scontrini, entrate, budget, pagamenti mensili e impostazioni locali saranno rimossi da questo telefono.",
  clearAllDataConfirm: "Elimina tutto",
  dataDeletedTitle: "Dati eliminati",
  dataDeletedText: "Tutti i dati locali dell'app sono stati rimossi.",
  deleteAccountTitle: "Richiesta di eliminazione account",
  deleteAccountText: "Si aprirà una richiesta via email. Gli scontrini locali su questo telefono possono essere rimossi da I miei dati.",
  sendDeleteRequest: "Invia richiesta",
  budgetLeft: "rimanente",
  budgetOver: "superato",
  reviewBeforeSave: "Controlla prima di salvare",
  notePlaceholder: "Esempio: garanzia, scadenza reso, numero fattura...",
  priceHistory: "Storico prezzi",
  lastPrice: "Ultimo",
  lowestPrice: "Minimo",
  autoAnalyzeReceiptsInfo: "Avvia analisi AI subito dopo la selezione di una foto.",
  reviewBeforeSaveInfo: "Mantieni i dettagli estratti dello scontrino sullo schermo prima di salvare.",
  keepReceiptPhotosInfo: "Conserva le foto degli scontrini su questo telefono dopo il salvataggio.",
  defaultCategory: "Categoria predefinita",
  defaultCategoryInfo: "Usata quando l'AI non riesce a decidere una categoria.",
  otherCategoryPlaceholder: "Esempio: scuola, cura auto, tasse...",
  recurringIncludedInfo: "I pagamenti mensili attivi sono inclusi nei totali e nei report mensili.",
  recurringDay: "Giorno pagamento",
  recurringMonth: "Mese pagamento",
  deleteRecurring: "Elimina",
  spaces: "Spazi",
  spacesInfo: "Separa spese personali, lavoro, viaggi e famiglia.",
  activeSpace: "Spazio attivo",
  restorePurchases: "Ripristina acquisti",
  restorePurchasesTitle: "Acquisti",
  restorePurchasesText: "Il ripristino acquisti sarà collegato agli abbonamenti App Store e Google Play.",
  restorePurchasesInfo: "Per abbonamenti App Store e Google Play una volta attivato Premium.",
  deleteAccountInfo: "Chiedici di eliminare account e dati sincronizzati.",
  privacySummary: "Le foto degli scontrini sono memorizzate su questo telefono a meno che non disattivi l'archiviazione foto. L'analisi AI invia l'immagine selezionata al servizio di analisi per leggere negozio, data, totale e articoli.",
  privacyPolicyText: "Reciro memorizza scontrini, entrate, budget, pagamenti mensili e preferenze localmente su questo telefono. Se l'archiviazione foto scontrini è attiva, le immagini sono conservate localmente. Quando si usa l'analisi AI, l'immagine selezionata viene inviata solo per estrarre negozio, data, totali, categorie e voci. Reciro non vende dati personali, non usa contenuti degli scontrini per pubblicità e non conserva backup degli scontrini sui propri server. Puoi esportare, fare backup o eliminare dati locali da I miei dati.",
  termsOfUseText: "Reciro aiuta a tracciare scontrini, spese, prodotti e pagamenti mensili. L'analisi AI degli scontrini può non essere perfetta, quindi gli utenti devono controllare importi, date e categorie importanti prima di affidarsi ai report. L'app è per la gestione personale delle spese e non fornisce consigli finanziari, fiscali o legali. Gli utenti sono responsabili di fare backup dei dati importanti e di rispettare le norme locali su scontrini, fatture e contabilità.",
  refundBadge: "Rimborso",
  markedImportant: "Importante",
  warrantyUntil: "Garanzia fino a",
});

Object.assign(translations.pt, {
  notSignedIn: "Dados neste telefone",
  saveError: "Erro ao salvar",
  receiptsSaveError: "Os recibos não puderam ser salvos no telefone.",
  incomeSaveError: "A receita não pôde ser salva.",
  currencySaveError: "A moeda não pôde ser salva.",
  signOutTitle: "Terminar sessão",
  signOutMessage: "Se terminar a sessão, a app voltará ao ecrã inicial. Os recibos guardados permanecem neste telefone.",
  signOutConfirm: "Terminar sessão",
  missingInfo: "Informação em falta",
  enterStore: "Introduza o nome da loja.",
  enterAmount: "Introduza o valor total.",
  deleteTitle: "Eliminar recibo",
  deleteMessage: "Eliminar este recibo do arquivo?",
  deleteConfirm: "Eliminar",
  backupReady: "Cópia de segurança pronta",
  backupError: "Erro na cópia de segurança",
  backupErrorText: "A cópia de segurança não pôde ser concluída.",
  noBackupTitle: "Sem cópia de segurança",
  noBackupText: "Não foi encontrada nenhuma cópia de segurança para restaurar.",
  backupRestored: "Cópia de segurança restaurada",
  backupRestoredText: "Recibos, receitas e moeda foram restaurados da última cópia de segurança.",
  exportReady: "Exportação pronta",
  exportError: "Erro na exportação",
  exportErrorText: "O ficheiro CSV não pôde ser criado.",
  feedbackMailTitle: "Não foi possível abrir o email",
  feedbackMailText: "Se não houver uma app de email no telefone, a mensagem pode não ser enviada.",
  freeLimitTitle: "Limite gratuito atingido",
  viewPremium: "Ver Premium",
  permissionNeeded: "Permissão necessária",
  galleryPermission: "É necessária permissão para a galeria para escolher uma foto do recibo.",
  imageQualityTitle: "Foto pode não estar clara",
  imageQualityText: "Esta foto parece ter baixa resolução. A análise pode estar incorreta.",
  usePhotoAnyway: "Usar na mesma",
  photoSaveErrorTitle: "Foto não pôde ser salva",
  photoSaveErrorText: "A foto do recibo não pôde ser salva no telefone.",
  cameraPermission: "É necessária permissão para a câmara para tirar uma foto do recibo.",
  cameraOpenErrorTitle: "Não foi possível abrir a câmara",
  cameraOpenErrorText: "Verifique a permissão da câmara para o Expo Go nas definições do telefone e tente novamente.",
  fileSaved: "Ficheiro guardado",
  fileSavedText: "O ficheiro PDF foi guardado. Preencha os detalhes manualmente e guarde.",
  photoNeeded: "Foto necessária",
  choosePhotoFirst: "Primeiro tire uma foto do recibo ou escolha uma da galeria.",
  analysisUnavailableTitle: "Serviço de análise não está ligado",
  analysisUnavailableText: "A leitura real do recibo necessita de um serviço OCR/AI. Por agora, pode introduzir os detalhes manualmente e guardar.",
  analysisTimeoutTitle: "Análise demorou demasiado",
  analysisTimeoutText: "O recibo não pôde ser lido. Verifique a ligação e tente novamente, ou guarde os detalhes manualmente.",
  duplicateReceiptTitle: "Este recibo pode já existir",
  duplicateReceiptText: "Este recibo parece já estar guardado, por isso não foi adicionado novamente.",
  exchangeRateErrorTitle: "Taxa de câmbio indisponível",
  exchangeRateErrorText: "Este recibo não pôde ser convertido para a sua moeda principal. Verifique a ligação e tente novamente.",
  noReceiptsText: "Depois de adicionar o seu primeiro recibo, despesas, lojas e relatórios aparecerão aqui.",
  receiptCount: "Número de recibos",
  highest: "Maior",
  newReceipt: "Novo recibo",
  receiptStartTitle: "Novo recibo",
  receiptStartText: "Adicione uma foto do recibo e deixe a app preencher os detalhes.",
  noReceiptPhoto: "Sem foto do recibo",
  choosePhotoHelp: "Tire uma foto ou escolha da galeria.",
  changeReceiptPhoto: "Alterar foto do recibo",
  addReceiptPhoto: "Adicionar foto do recibo",
  demoAnalyzing: "A analisar recibo...",
  reviewBeforeSave: "Rever antes de guardar",
  needsReview: "Precisa de revisão",
  looksGood: "Parece bem",
  reviewBeforeSaveText: "Verifique loja, data, total e itens. Edite o que faltar ou estiver errado.",
  analysisConfidence: "Confiança na análise",
  reanalyzeReceipt: "Analisar novamente",
  totalAmount: "Valor total",
  manualSaveHelp: "Para guardar sem análise, introduza o nome da loja e o valor total.",
  editReceiptDetails: "Editar detalhes",
  receiptCurrency: "Moeda do recibo",
  date: "Data",
  subtotalAmount: "Subtotal",
  taxAmount: "Imposto / IVA",
  customCategory: "Categoria personalizada",
  customCategoryPlaceholder: "Exemplo: cuidado do carro, escola, impostos...",
  readItems: "Ler itens",
  items: "Itens",
  removeItem: "Remover",
  itemName: "Nome do item",
  itemAmount: "Preço",
  unit: "Unidade",
  addItem: "Adicionar item",
  clearMerchantFilter: "Limpar seleção",
  noReportData: "Sem dados para este filtro",
  archiveInfo: "Todos os recibos carregados ficam aqui. Toque num recibo para ver detalhes.",
  selectedMonth: "Mês selecionado",
  monthlyReceiptsInfo: "Veja recibos e pagamentos mensais mês a mês.",
  tapMonthReceipts: "Toque para ver este mês",
  noProductDataText: "Após a análise do recibo, as quantidades dos produtos aparecerão aqui.",
  feedbackEmptyTitle: "Mensagem vazia",
  feedbackEmptyText: "Escreva uma mensagem curta antes de enviar.",
  feedbackSentTitle: "Feedback enviado",
  feedbackSentText: "A sua mensagem foi enviada pela app. Obrigado.",
  remainingMoney: "Total restante",
  previousMonth: "Mês anterior",
  nextMonth: "Mês seguinte",
  incomeForMonth: "Receita deste mês",
  spending: "Despesas",
  reportButton: "Ver relatório",
  backupInfo: "Recibos, rendimentos e definicoes ficam neste telefone. Pode guardar o backup no iCloud, Google Drive ou ficheiros.",
  feedbackTitle: "O que devemos melhorar?",
  feedbackText: "A sua mensagem é enviada pela app, para podermos ler o feedback dos utilizadores e melhorar a app.",
  feedbackPlaceholder: "Exemplo: tornar a leitura de recibos mais rápida, este ecrã é confuso...",
  sendFeedback: "Enviar feedback",
  premiumTitle: "Reciro Premium",
  premiumSubtitle: "Digitalizações ilimitadas de recibos, relatórios de produtos e uso sem anúncios.",
  premiumMonthly: "Mensal: €1.99",
  premiumYearly: "Anual: €21.49 (10% desc.)",
  premiumBenefits: ["Digitalizações ilimitadas de recibos com IA", "Análise de recibos em PDF e foto", "Relatórios de produtos, categorias e lojas", "Análise mensal de produtos", "Uso sem anúncios"],
  startPremium: "Tornar-se Premium",
  premiumSetupTitle: "Premium em breve",
  premiumSetupText: "As subscrições reais serão ligadas através de compras na App Store e Google Play.",
  accountSyncInfo: "Os seus dados ficam neste telefone. Premium e compras sao geridos pela sua conta da loja.",
  feedbackInfo: "Envie sugestões, erros ou pedidos de funcionalidades.",
  noPhoto: "Sem foto",
  noPhotoText: "Este registo não tem foto do recibo.",
  placeholderStore: "Nome da loja",
  placeholderAmount: "0.00",
  editItems: "Editar itens",
  saveChanges: "Guardar alterações",
  convertedAmount: "Valor do relatório",
  originalAmount: "Valor original",
  exchangeRate: "Taxa de câmbio",
  boughtItems: "Itens",
  tapMerchantReceipts: "Toque para ver recibos",
  welcomeTitle: "Escolha a sua conta",
  welcomeText: "Comece a controlar as suas despesas.",
  signInWithGoogle: "Iniciar sessão com Google",
  signInWithICloud: "Ligar iCloud",
  takePhoto: "Tirar foto",
  takePhotoHelp: "Tire uma nova foto do recibo.",
  chooseFromGalleryHelp: "Selecione uma foto de recibo existente.",
  pickFile: "Escolher ficheiro",
  pickFileHelp: "Carregue um ficheiro PDF ou foto.",
  cameraHint: "Coloque o recibo dentro do quadro",
  cameraRetake: "Retomar",
  cameraUsePhoto: "Usar foto",
  cameraCapture: "Capturar",
  freeUsageText: (used, limit) => `Usou ${used}/${limit} analises gratuitas este mes.`,
  backupReadyText: fileName => `Backup criado: ${fileName}`,
  freeLimitText: limit => `Usou as ${limit} analises gratuitas deste mes. Veja um anuncio para 1 analise extra ou passe para Premium.`,
  watchAdForScan: "Ver anuncio +1",
  rewardedAdSetupTitle: "Anuncio indisponivel",
  rewardedAdSetupText: "Os anuncios recompensados nao funcionam no Expo Go. Num dev build ou versao da loja, ver um anuncio adiciona 1 analise.",
  rewardedCreditTitle: "1 analise adicionada",
  rewardedCreditText: "Agora pode analisar o recibo novamente.",
  topCategorySentence: (category, amount) => `A maior despesa esta em ${category}: ${amount}.`,
  merchantReceiptsTitle: store => `Recibos de ${store}`,
  searchResultCount: count => `${count} recibos encontrados`,
  monthReceiptsTitle: month => `Recibos de ${month}`,
  selectedCurrency: (symbol, name) => `Moeda selecionada: ${symbol} ${name}`,
  signedInWith: provider => `${provider} selecionado`,
});


Object.assign(featureTranslations.pt, {
  clearAllDataTitle: "Eliminar todos os dados?",
  clearAllDataText: "Recibos, rendimentos, orçamentos, pagamentos mensais e definições locais serão removidos deste telemóvel.",
  clearAllDataConfirm: "Eliminar tudo",
  dataDeletedTitle: "Dados eliminados",
  dataDeletedText: "Todos os dados locais da app foram removidos.",
  deleteAccountTitle: "Pedido de eliminação de conta",
  deleteAccountText: "Isto abre um pedido por email. Recibos locais neste telemóvel podem ser removidos em Os meus dados.",
  sendDeleteRequest: "Enviar pedido",
  budgetLeft: "restante",
  budgetOver: "excedido",
  reviewBeforeSave: "Rever antes de guardar",
  notePlaceholder: "Exemplo: garantia, prazo de devolução, número da fatura...",
  priceHistory: "Histórico de preços",
  lastPrice: "Último",
  lowestPrice: "Mais baixo",
  autoAnalyzeReceiptsInfo: "Iniciar análise AI logo após selecionar uma foto.",
  reviewBeforeSaveInfo: "Manter detalhes do recibo extraídos no ecrã antes de guardar.",
  keepReceiptPhotosInfo: "Guardar fotos dos recibos neste telemóvel após guardar.",
  defaultCategory: "Categoria predefinida",
  defaultCategoryInfo: "Usada quando a AI não consegue decidir uma categoria.",
  otherCategoryPlaceholder: "Exemplo: escola, cuidado do carro, impostos...",
  recurringIncludedInfo: "Pagamentos mensais ativos estão incluídos nos totais e relatórios mensais.",
  recurringDay: "Dia do pagamento",
  recurringMonth: "Mês do pagamento",
  deleteRecurring: "Eliminar",
  spaces: "Espaços",
  spacesInfo: "Separe despesas pessoais, negócios, viagens e família.",
  activeSpace: "Espaço ativo",
  restorePurchases: "Restaurar compras",
  restorePurchasesTitle: "Compras",
  restorePurchasesText: "A restauração de compras será ligada às subscrições da App Store e Google Play.",
  restorePurchasesInfo: "Para subscrições da App Store e Google Play após ativar o Premium.",
  deleteAccountInfo: "Peça-nos para eliminar conta e dados sincronizados.",
  privacySummary: "Fotos dos recibos são guardadas neste telemóvel a menos que desative o armazenamento. A análise AI envia a imagem do recibo selecionado para o serviço de análise para ler loja, data, total e itens.",
  privacyPolicyText: "O Reciro guarda recibos, rendimentos, orçamentos, pagamentos mensais e preferências localmente neste telemóvel. Se o armazenamento de fotos de recibos estiver ativado, as imagens também são guardadas localmente. Quando a análise AI é usada, a imagem do recibo selecionado é enviada ao serviço de análise apenas para extrair loja, data, totais, categorias e itens. O Reciro não vende dados pessoais, não usa conteúdo dos recibos para publicidade e não guarda backups de recibos nos seus próprios servidores. Pode exportar, fazer backup ou eliminar dados locais em Os meus dados.",
  termsOfUseText: "O Reciro ajuda a controlar recibos, despesas, produtos e pagamentos mensais. A análise AI dos recibos pode não ser perfeita, por isso os utilizadores devem rever valores, datas e categorias importantes antes de confiar nos relatórios. A app é para controlo pessoal de despesas e não constitui aconselhamento financeiro, fiscal ou legal. Os utilizadores são responsáveis por manter backups dos dados importantes e cumprir as regras locais sobre recibos, faturas e contabilidade.",
  refundBadge: "Reembolso",
  markedImportant: "Importante",
  warrantyUntil: "Garantia até",
});

Object.assign(translations.nl, {
  notSignedIn: "Gegevens op deze telefoon",
  saveError: "Fout bij opslaan",
  receiptsSaveError: "Bonnen konden niet op de telefoon worden opgeslagen.",
  incomeSaveError: "Inkomen kon niet worden opgeslagen.",
  currencySaveError: "Valuta kon niet worden opgeslagen.",
  signOutTitle: "Uitloggen",
  signOutMessage: "Als je uitlogt, keert de app terug naar het startscherm. Opgeslagen bonnen blijven op deze telefoon.",
  signOutConfirm: "Uitloggen",
  missingInfo: "Ontbrekende info",
  enterStore: "Voer de winkelnaam in.",
  enterAmount: "Voer het totaalbedrag in.",
  deleteTitle: "Bon verwijderen",
  deleteMessage: "Deze bon uit het archief verwijderen?",
  deleteConfirm: "Verwijderen",
  backupReady: "Backup klaar",
  backupError: "Backup fout",
  backupErrorText: "Backup kon niet worden voltooid.",
  noBackupTitle: "Geen backup",
  noBackupText: "Er is geen backup gevonden om te herstellen.",
  backupRestored: "Backup hersteld",
  backupRestoredText: "Bonnen, inkomen en valuta zijn hersteld van de laatste backup.",
  exportReady: "Export klaar",
  exportError: "Export fout",
  exportErrorText: "CSV-bestand kon niet worden aangemaakt.",
  feedbackMailTitle: "E-mail kon niet openen",
  feedbackMailText: "Als er geen e-mailapp op de telefoon is, kan het bericht niet worden verzonden.",
  freeLimitTitle: "Gratis limiet bereikt",
  viewPremium: "Bekijk Premium",
  permissionNeeded: "Toestemming nodig",
  galleryPermission: "Toestemming voor galerij is nodig om een bonfoto te kiezen.",
  imageQualityTitle: "Foto is mogelijk niet duidelijk",
  imageQualityText: "Deze foto lijkt een lage resolutie te hebben. De analyse kan onjuist zijn.",
  usePhotoAnyway: "Toch gebruiken",
  photoSaveErrorTitle: "Foto kon niet worden opgeslagen",
  photoSaveErrorText: "Bonfoto kon niet op de telefoon worden opgeslagen.",
  cameraPermission: "Toestemming voor camera is nodig om een bonfoto te maken.",
  cameraOpenErrorTitle: "Camera kon niet openen",
  cameraOpenErrorText: "Controleer de cameratoestemming voor Expo Go in de telefooninstellingen en probeer opnieuw.",
  fileSaved: "Bestand opgeslagen",
  fileSavedText: "Het PDF-bestand is opgeslagen. Vul de gegevens handmatig in en sla op.",
  photoNeeded: "Foto nodig",
  choosePhotoFirst: "Maak eerst een bonfoto of kies er een uit de galerij.",
  analysisUnavailableTitle: "Analyseringsdienst is niet verbonden",
  analysisUnavailableText: "Echte bonlezen vereist een OCR/AI-dienst. Voor nu kun je de gegevens handmatig invoeren en opslaan.",
  analysisTimeoutTitle: "Analyse duurde te lang",
  analysisTimeoutText: "De bon kon niet worden gelezen. Controleer de verbinding en probeer opnieuw, of sla de gegevens handmatig op.",
  duplicateReceiptTitle: "Deze bon bestaat mogelijk al",
  duplicateReceiptText: "Deze bon lijkt al opgeslagen te zijn, dus is niet opnieuw toegevoegd.",
  exchangeRateErrorTitle: "Wisselkoers niet beschikbaar",
  exchangeRateErrorText: "Deze bon kon niet worden omgerekend naar je hoofdvaluta. Controleer je verbinding en probeer opnieuw.",
  noReceiptsText: "Na het toevoegen van je eerste bon verschijnen hier uitgaven, winkels en rapporten.",
  receiptCount: "Aantal bonnen",
  highest: "Hoogste",
  newReceipt: "Nieuwe bon",
  receiptStartTitle: "Nieuwe bon",
  receiptStartText: "Voeg een bonfoto toe en laat de app de gegevens invullen.",
  noReceiptPhoto: "Geen bonfoto",
  choosePhotoHelp: "Maak een foto of kies uit de galerij.",
  changeReceiptPhoto: "Bonfoto wijzigen",
  addReceiptPhoto: "Bonfoto toevoegen",
  demoAnalyzing: "Bon wordt geanalyseerd...",
  reviewBeforeSave: "Controleren voor opslaan",
  needsReview: "Moet gecontroleerd worden",
  looksGood: "Ziet er goed uit",
  reviewBeforeSaveText: "Controleer winkel, datum, totaal en items. Bewerk wat ontbreekt of fout is.",
  analysisConfidence: "Analysevertrouwen",
  reanalyzeReceipt: "Opnieuw analyseren",
  totalAmount: "Totaalbedrag",
  manualSaveHelp: "Om zonder analyse op te slaan, voer winkelnaam en totaalbedrag in.",
  editReceiptDetails: "Details bewerken",
  receiptCurrency: "Bonvaluta",
  date: "Datum",
  subtotalAmount: "Subtotaal",
  taxAmount: "Belasting / BTW",
  customCategory: "Aangepaste categorie",
  customCategoryPlaceholder: "Bijv: auto onderhoud, school, belasting...",
  readItems: "Items lezen",
  items: "Items",
  removeItem: "Verwijderen",
  itemName: "Itemnaam",
  itemAmount: "Prijs",
  unit: "Eenheid",
  addItem: "Item toevoegen",
  clearMerchantFilter: "Selectie wissen",
  noReportData: "Geen gegevens voor deze filter",
  archiveInfo: "Alle geuploade bonnen blijven hier. Tik op een bon voor details.",
  selectedMonth: "Geselecteerde maand",
  monthlyReceiptsInfo: "Bekijk bonnen en maandelijkse betalingen per maand.",
  tapMonthReceipts: "Tik om deze maand te bekijken",
  noProductDataText: "Na bonanalyse verschijnen hier productaantallen.",
  feedbackEmptyTitle: "Bericht is leeg",
  feedbackEmptyText: "Schrijf een kort bericht voordat je verzendt.",
  feedbackSentTitle: "Feedback verzonden",
  feedbackSentText: "Je bericht is vanuit de app verzonden. Bedankt.",
  remainingMoney: "Totaal over",
  previousMonth: "Vorige maand",
  nextMonth: "Volgende maand",
  incomeForMonth: "Inkomen deze maand",
  spending: "Uitgaven",
  reportButton: "Bekijk rapport",
  backupInfo: "Bonnen, inkomen en instellingen blijven op deze telefoon. Je kunt de back-up opslaan in iCloud, Google Drive of Bestanden.",
  feedbackTitle: "Wat kunnen we verbeteren?",
  feedbackText: "Je bericht wordt vanuit de app verzonden, zodat we feedback kunnen lezen en de app verbeteren.",
  feedbackPlaceholder: "Bijv: bonlezen sneller maken, dit scherm is verwarrend...",
  sendFeedback: "Feedback verzenden",
  premiumTitle: "Reciro Premium",
  premiumSubtitle: "Onbeperkt bonnen scannen, productrapporten en reclamevrij gebruik.",
  premiumMonthly: "Maandelijks: €1.99",
  premiumYearly: "Jaarlijks: €21.49 (10% korting)",
  premiumBenefits: ["Onbeperkt AI bonnen scannen", "PDF- en foto-bonanalyse", "Product-, categorie- en winkelrapporten", "Maandelijkse productanalyse", "Reclamevrij gebruik"],
  startPremium: "Word Premium",
  premiumSetupTitle: "Premium komt binnenkort",
  premiumSetupText: "Echte abonnementen worden verbonden via App Store en Google Play aankopen.",
  accountSyncInfo: "Je gegevens blijven op deze telefoon. Premium en aankopen worden beheerd via je store-account.",
  feedbackInfo: "Stuur suggesties, bugs of functieverzoeken.",
  noPhoto: "Geen foto",
  noPhotoText: "Deze registratie heeft geen bonfoto.",
  placeholderStore: "Winkelnaam",
  placeholderAmount: "0.00",
  editItems: "Items bewerken",
  saveChanges: "Wijzigingen opslaan",
  convertedAmount: "Rapportbedrag",
  originalAmount: "Origineel bedrag",
  exchangeRate: "Wisselkoers",
  boughtItems: "Items",
  tapMerchantReceipts: "Tik om bonnen te bekijken",
  welcomeTitle: "Kies je account",
  welcomeText: "Begin met het bijhouden van je uitgaven.",
  signInWithGoogle: "Inloggen met Google",
  signInWithICloud: "Verbind iCloud",
  takePhoto: "Foto maken",
  takePhotoHelp: "Maak een nieuwe bonfoto.",
  chooseFromGalleryHelp: "Selecteer een bestaande bonfoto.",
  pickFile: "Bestand kiezen",
  pickFileHelp: "Upload een PDF- of fotobestand.",
  cameraHint: "Plaats de bon binnen het kader",
  cameraRetake: "Opnieuw nemen",
  cameraUsePhoto: "Foto gebruiken",
  cameraCapture: "Opnemen",
  freeUsageText: (used, limit) => `Je hebt deze maand ${used}/${limit} gratis bonscans gebruikt.`,
  backupReadyText: fileName => `Backup gemaakt: ${fileName}`,
  freeLimitText: limit => `Je hebt je ${limit} gratis bonscans deze maand gebruikt. Bekijk een advertentie voor 1 extra scan of kies Premium.`,
  watchAdForScan: "Advertentie bekijken +1",
  rewardedAdSetupTitle: "Advertentie niet beschikbaar",
  rewardedAdSetupText: "Beloningsadvertenties werken niet in Expo Go. In een dev build of store build voegt een advertentie 1 scan toe.",
  rewardedCreditTitle: "1 scan toegevoegd",
  rewardedCreditText: "Je kunt je bon nu opnieuw analyseren.",
  topCategorySentence: (category, amount) => `De meeste uitgaven zijn in ${category}: ${amount}.`,
  merchantReceiptsTitle: store => `Bonnen van ${store}`,
  searchResultCount: count => `${count} bonnen gevonden`,
  monthReceiptsTitle: month => `Bonnen van ${month}`,
  selectedCurrency: (symbol, name) => `Geselecteerde valuta: ${symbol} ${name}`,
  signedInWith: provider => `${provider} geselecteerd`,
});


Object.assign(featureTranslations.nl, {
  clearAllDataTitle: "Alle gegevens verwijderen?",
  clearAllDataText: "Bonnen, inkomsten, budgetten, maandelijkse betalingen en lokale instellingen worden van deze telefoon verwijderd.",
  clearAllDataConfirm: "Alles verwijderen",
  dataDeletedTitle: "Gegevens verwijderd",
  dataDeletedText: "Alle lokale app-gegevens zijn verwijderd.",
  deleteAccountTitle: "Verzoek account verwijderen",
  deleteAccountText: "Dit opent een e-mailverzoek. Lokale bonnen op deze telefoon kunnen worden verwijderd via Mijn gegevens.",
  sendDeleteRequest: "Verzoek verzenden",
  budgetLeft: "over",
  budgetOver: "boven",
  reviewBeforeSave: "Controleren voor opslaan",
  notePlaceholder: "Voorbeeld: garantie, retourtermijn, factuurnummer...",
  priceHistory: "Prijsverloop",
  lastPrice: "Laatste",
  lowestPrice: "Laagste",
  autoAnalyzeReceiptsInfo: "Start AI-analyse direct na het selecteren van een foto.",
  reviewBeforeSaveInfo: "Houd de uitgelezen bongegevens op het scherm voor het opslaan.",
  keepReceiptPhotosInfo: "Bewaar bonfoto's op deze telefoon na het opslaan.",
  defaultCategory: "Standaardcategorie",
  defaultCategoryInfo: "Wordt gebruikt als AI geen categorie kan bepalen.",
  otherCategoryPlaceholder: "Voorbeeld: school, auto onderhoud, belastingen...",
  recurringIncludedInfo: "Actieve maandelijkse betalingen zijn inbegrepen in maandtotalen en rapporten.",
  recurringDay: "Betaaldag",
  recurringMonth: "Betaalmaand",
  deleteRecurring: "Verwijderen",
  spaces: "Ruimtes",
  spacesInfo: "Scheid persoonlijke, zakelijke, reis- en gezinsuitgaven.",
  activeSpace: "Actieve ruimte",
  restorePurchases: "Aankopen herstellen",
  restorePurchasesTitle: "Aankopen",
  restorePurchasesText: "Herstel van aankopen wordt gekoppeld aan App Store- en Google Play-abonnementen.",
  restorePurchasesInfo: "Voor App Store- en Google Play-abonnementen zodra Premium actief is.",
  deleteAccountInfo: "Vraag ons om account en synchronisatiegegevens te verwijderen.",
  privacySummary: "Bonfoto's worden op deze telefoon opgeslagen tenzij je foto-opslag uitschakelt. AI-analyse stuurt de geselecteerde bonafbeelding naar de analysetool om winkel, datum, totaal en items te lezen.",
  privacyPolicyText: "Reciro slaat bonnetjes, inkomsten, budgetten, maandelijkse betalingen en voorkeuren lokaal op deze telefoon op. Als bonfoto-opslag is ingeschakeld, worden bonafbeeldingen ook lokaal bewaard. Bij gebruik van AI-analyse wordt de geselecteerde bonafbeelding alleen naar de bonanalyse-service gestuurd om winkel, datum, totalen, categorieën en regels te extraheren. Reciro verkoopt geen persoonlijke gegevens, gebruikt boninhoud niet voor reclame en bewaart geen bonback-ups op eigen servers. Je kunt lokale gegevens exporteren, back-uppen of verwijderen via Mijn gegevens.",
  termsOfUseText: "Reciro helpt bij het bijhouden van bonnetjes, uitgaven, producten en maandelijkse betalingen. AI-bonanalyse kan onvolledig zijn, dus gebruikers moeten belangrijke bedragen, data en categorieën controleren voordat ze op rapporten vertrouwen. De app is bedoeld voor persoonlijke uitgavenregistratie en is geen financieel, fiscaal of juridisch advies. Gebruikers zijn verantwoordelijk voor het maken van back-ups van belangrijke gegevens en het naleven van lokale regels over bonnetjes, facturen en boekhouding.",
  refundBadge: "Terugbetaling",
  markedImportant: "Belangrijk",
  warrantyUntil: "Garantie tot",
});

Object.assign(translations.fr, {
  accountSync: "Premium et achats",
  accountSyncInfo: "Vos donnees restent sur ce telephone. Premium et les achats sont geres par votre compte de store.",
  notSignedIn: "Donnees sur ce telephone",
  cloudSetupNeededTitle: "Donnees stockees sur l appareil",
  cloudSetupNeededText: "Reciro ne stocke pas vos tickets sur ses propres serveurs. Vous pouvez exporter votre sauvegarde depuis Mes donnees.",
  backupInfo: "Tickets, revenus et reglages restent sur ce telephone. Vous pouvez enregistrer la sauvegarde dans iCloud, Google Drive ou vos fichiers.",
  accountAndPremium: "Premium et achats",
});

Object.assign(translations.de, {
  accountSync: "Premium und Kaeufe",
  accountSyncInfo: "Deine Daten bleiben auf diesem Telefon. Premium und Kaeufe werden ueber dein Store-Konto verwaltet.",
  notSignedIn: "Daten bleiben auf diesem Telefon",
  cloudSetupNeededTitle: "Daten werden auf dem Geraet gespeichert",
  cloudSetupNeededText: "Reciro speichert deine Belege nicht auf eigenen Servern. Du kannst dein Backup unter Meine Daten exportieren.",
  backupInfo: "Belege, Einkommen und Einstellungen bleiben auf diesem Telefon. Du kannst das Backup in iCloud, Google Drive oder Dateien speichern.",
  accountAndPremium: "Premium und Kaeufe",
});

Object.assign(translations.es, {
  accountSync: "Premium y compras",
  accountSyncInfo: "Tus datos permanecen en este telefono. Premium y las compras se gestionan con tu cuenta de la tienda.",
  notSignedIn: "Datos en este telefono",
  cloudSetupNeededTitle: "Datos guardados en el dispositivo",
  cloudSetupNeededText: "Reciro no guarda tus tickets en sus propios servidores. Puedes exportar tu copia desde Mis datos.",
  backupInfo: "Tickets, ingresos y ajustes permanecen en este telefono. Puedes guardar la copia en iCloud, Google Drive o archivos.",
  accountAndPremium: "Premium y compras",
});

Object.assign(translations.it, {
  accountSync: "Premium e acquisti",
  accountSyncInfo: "I tuoi dati restano su questo telefono. Premium e acquisti sono gestiti dal tuo account dello store.",
  notSignedIn: "Dati su questo telefono",
  cloudSetupNeededTitle: "Dati salvati sul dispositivo",
  cloudSetupNeededText: "Reciro non salva gli scontrini sui propri server. Puoi esportare il backup da I miei dati.",
  backupInfo: "Scontrini, entrate e impostazioni restano su questo telefono. Puoi salvare il backup in iCloud, Google Drive o nei file.",
  accountAndPremium: "Premium e acquisti",
});

Object.assign(translations.pt, {
  accountSync: "Premium e compras",
  accountSyncInfo: "Os seus dados ficam neste telefone. Premium e compras sao geridos pela sua conta da loja.",
  notSignedIn: "Dados neste telefone",
  cloudSetupNeededTitle: "Dados guardados no dispositivo",
  cloudSetupNeededText: "O Reciro nao guarda os seus recibos em servidores proprios. Pode exportar o backup em Os meus dados.",
  backupInfo: "Recibos, rendimentos e definicoes ficam neste telefone. Pode guardar o backup no iCloud, Google Drive ou ficheiros.",
  accountAndPremium: "Premium e compras",
});

Object.assign(translations.nl, {
  accountSync: "Premium en aankopen",
  accountSyncInfo: "Je gegevens blijven op deze telefoon. Premium en aankopen worden beheerd via je store-account.",
  notSignedIn: "Gegevens op deze telefoon",
  cloudSetupNeededTitle: "Gegevens worden op het apparaat bewaard",
  cloudSetupNeededText: "Reciro bewaart je bonnetjes niet op eigen servers. Je kunt je back-up exporteren via Mijn gegevens.",
  backupInfo: "Bonnen, inkomen en instellingen blijven op deze telefoon. Je kunt de back-up opslaan in iCloud, Google Drive of Bestanden.",
  accountAndPremium: "Premium en aankopen",
});

function getAppTranslations(languageCode) {
  const base = translations.en;
  const language = translations[languageCode] || base;
  const baseFeatures = featureTranslations.en;
  const languageFeatures = featureTranslations[languageCode] || {};

  return {
    ...base,
    ...baseFeatures,
    ...language,
    ...languageFeatures,
    categories: {
      ...base.categories,
      ...language.categories,
    },
  };
}

function getDeviceLanguage() {
  const locales = Localization.getLocales?.() || [];
  const primaryLocale = locales[0] || {};
  const languageCode = String(
    primaryLocale.languageCode ||
      String(primaryLocale.languageTag || '').split('-')[0] ||
      ''
  ).toLowerCase();
  const supportedLanguage = languages.find((language) => language.code === languageCode);
  return supportedLanguage?.code || 'en';
}

function getDeviceCurrency() {
  const locales = Localization.getLocales?.() || [];
  const regionCode = String(locales[0]?.regionCode || locales[0]?.countryCode || '').toUpperCase();
  return countryCurrencyMap[regionCode] || 'EUR';
}

function getAuthProviderLabel(provider) {
  if (provider === 'apple') {
    return 'Apple';
  }

  if (provider === 'google') {
    return 'Google';
  }

  return 'Reciro';
}

function normalizeLookupText(value) {
  return String(value || '')
    .toLocaleLowerCase('tr-TR')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();
}

function normalizeCurrencyCode(currencyCode, fallbackCurrency = activeCurrency) {
  const normalizedCode = String(currencyCode || '').trim().toUpperCase();
  return currencies.some((currency) => currency.code === normalizedCode)
    ? normalizedCode
    : fallbackCurrency;
}

function getCurrencySymbol(currencyCode) {
  return currencies.find((currency) => currency.code === currencyCode)?.symbol || currencyCode;
}

const categoryOptions = [
  { key: 'grocery', color: '#157f3b', icon: '🛒' },
  { key: 'food', color: '#f5b942', icon: '🍽️' },
  { key: 'transport', color: '#3d7ee8', icon: '🚇' },
  { key: 'fuel', color: '#f97316', icon: '⛽' },
  { key: 'home', color: '#e35b4f', icon: '🏠' },
  { key: 'clothing', color: '#8b5cf6', icon: '👕' },
  { key: 'health', color: '#14b8a6', icon: '✚' },
  { key: 'other', color: '#6b7280', icon: '⋯' },
];

function buildCategorySummary(receiptList) {
  const totals = new Map();
  const fixedCategoryKeys = new Set(categoryOptions.map((category) => category.key));

  receiptList.forEach((receipt) => {
    const key = normalizeCategoryKey(receipt.category);
    const existing = totals.get(key) || 0;
    totals.set(key, existing + getReceiptSignedAmount(receipt));
  });

  const fixedCategories = categoryOptions.map((category) => ({
    ...category,
    amount: totals.get(category.key) || 0,
  }));

  const customCategories = Array.from(totals.entries())
    .filter(([key]) => !fixedCategoryKeys.has(key))
    .map(([key, amount]) => ({
      key,
      color: '#6b7280',
      amount,
    }));

  return [...fixedCategories, ...customCategories];
}

const legacyCategoryMap = {
  grocery: 'grocery',
  Market: 'grocery',
  Groceries: 'grocery',
  Courses: 'grocery',
  Lebensmittel: 'grocery',
  Supermercado: 'grocery',
  food: 'food',
  Yemek: 'food',
  Food: 'food',
  Restaurant: 'food',
  Essen: 'food',
  Comida: 'food',
  transport: 'transport',
  Ulasim: 'transport',
  Transport: 'transport',
  Transporte: 'transport',
  fuel: 'fuel',
  Yakit: 'fuel',
  Yakıt: 'fuel',
  Fuel: 'fuel',
  Carburant: 'fuel',
  Kraftstoff: 'fuel',
  Combustible: 'fuel',
  home: 'home',
  Ev: 'home',
  Home: 'home',
  Maison: 'home',
  Haushalt: 'home',
  Hogar: 'home',
  clothing: 'clothing',
  Giyim: 'clothing',
  Clothing: 'clothing',
  Vetements: 'clothing',
  Kleidung: 'clothing',
  Ropa: 'clothing',
  health: 'health',
  Saglik: 'health',
  Health: 'health',
  Sante: 'health',
  Gesundheit: 'health',
  Salud: 'health',
  other: 'other',
  Diger: 'other',
  Other: 'other',
  Autre: 'other',
  Sonstiges: 'other',
  Otros: 'other',
};

function normalizeCategoryKey(category) {
  const categoryText = String(category || '').trim();

  if (categoryText.startsWith('custom:')) {
    const customLabel = categoryText.slice('custom:'.length).trim();
    return customLabel ? `custom:${customLabel}` : 'other';
  }

  const directMatch = legacyCategoryMap[categoryText];
  const normalizedCategoryText = categoryText.toLocaleLowerCase('tr-TR');
  const caseInsensitiveMatch = Object.entries(legacyCategoryMap).find(
    ([legacyLabel]) => legacyLabel.toLocaleLowerCase('tr-TR') === normalizedCategoryText
  )?.[1];

  return directMatch || caseInsensitiveMatch || categoryText || 'other';
}

function makeCustomCategoryKey(label) {
  const cleanLabel = String(label || '').trim();
  return cleanLabel ? `custom:${cleanLabel}` : 'other';
}

function isCustomCategory(category) {
  return String(category || '').startsWith('custom:');
}

function getCustomCategoryText(category) {
  return isCustomCategory(category) ? String(category).slice('custom:'.length).trim() : '';
}

function getCategoryLabel(category, t) {
  const key = normalizeCategoryKey(category);

  if (isCustomCategory(key)) {
    return getCustomCategoryText(key);
  }

  return t.categories?.[key] || translations.en.categories[key] || key;
}

function getCategoryIcon(category) {
  const key = normalizeCategoryKey(category);
  return categoryOptions.find((option) => option.key === key)?.icon || '🏷️';
}

async function sendFeedbackMessage({ message, language, currency }) {
  if (!FEEDBACK_ENDPOINT) {
    const error = new Error('Feedback endpoint is not configured.');
    error.code = 'FEEDBACK_NOT_CONFIGURED';
    throw error;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch(FEEDBACK_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(RECEIPT_ANALYSIS_CLIENT_TOKEN ? { 'X-Client-Token': RECEIPT_ANALYSIS_CLIENT_TOKEN } : {}),
      },
      signal: controller.signal,
      body: JSON.stringify({
        message,
        language,
        currency,
        app: 'Reciro',
        sentAt: new Date().toISOString(),
      }),
    });

    if (!response.ok) {
      const error = new Error(`Feedback failed: ${response.status}`);
      error.code = 'FEEDBACK_SEND_FAILED';
      throw error;
    }

    return response.json();
  } finally {
    clearTimeout(timeoutId);
  }
}

async function initializeMobileAds() {
  const adsModule = getMobileAdsModule();
  const mobileAds = adsModule?.default;

  if (!mobileAds) {
    const error = new Error('Google Mobile Ads SDK is not available in this build.');
    error.code = 'ADS_SDK_NOT_AVAILABLE';
    throw error;
  }

  if (!mobileAdsInitializePromise) {
    mobileAdsInitializePromise = mobileAds().initialize();
  }

  return mobileAdsInitializePromise;
}

function getRewardedAdUnitId(adsModule) {
  if (__DEV__ && adsModule?.TestIds?.REWARDED) {
    return adsModule.TestIds.REWARDED;
  }

  return Platform.select({
    ios: ADMOB_IOS_REWARDED_AD_UNIT_ID,
    android: ADMOB_ANDROID_REWARDED_AD_UNIT_ID,
    default: '',
  });
}

async function showRewardedScanAd() {
  await initializeMobileAds();

  const adsModule = getMobileAdsModule();
  const { AdEventType, RewardedAd, RewardedAdEventType } = adsModule || {};
  const adUnitId = getRewardedAdUnitId(adsModule);

  if (!RewardedAd || !RewardedAdEventType || !AdEventType || !adUnitId) {
    const error = new Error('Rewarded ads are not available in this build.');
    error.code = 'REWARDED_AD_NOT_AVAILABLE';
    throw error;
  }

  return new Promise((resolve, reject) => {
    let earnedReward = false;
    let finished = false;
    let timeoutId;
    const rewardedAd = RewardedAd.createForAdRequest(adUnitId, {
      requestNonPersonalizedAdsOnly: true,
    });

    const subscriptions = [
      rewardedAd.addAdEventListener(RewardedAdEventType.LOADED, () => {
        rewardedAd.show();
      }),
      rewardedAd.addAdEventListener(RewardedAdEventType.EARNED_REWARD, () => {
        earnedReward = true;
      }),
      rewardedAd.addAdEventListener(AdEventType.CLOSED, () => {
        if (earnedReward) {
          finish(resolve);
        } else {
          const error = new Error('Rewarded ad closed before reward.');
          error.code = 'REWARDED_AD_NO_REWARD';
          finish(reject, error);
        }
      }),
      rewardedAd.addAdEventListener(AdEventType.ERROR, (error) => {
        finish(reject, error);
      }),
    ];

    function finish(callback, value) {
      if (finished) {
        return;
      }

      finished = true;
      clearTimeout(timeoutId);
      subscriptions.forEach((unsubscribe) => unsubscribe?.());
      callback(value);
    }

    timeoutId = setTimeout(() => {
      const error = new Error('Rewarded ad timed out.');
      error.code = 'REWARDED_AD_TIMEOUT';
      finish(reject, error);
    }, REWARDED_AD_LOAD_TIMEOUT_MS);

    rewardedAd.load();
  });
}

const appSpaces = [
  { key: 'personal', icon: '👤', labelKey: 'personalSpace' },
  { key: 'business', icon: '💼', labelKey: 'businessSpace' },
  { key: 'travel', icon: '✈️', labelKey: 'travelSpace' },
  { key: 'family', icon: '🏡', labelKey: 'familySpace' },
];

function normalizeSpaceKey(spaceKey) {
  return appSpaces.some((space) => space.key === spaceKey) ? spaceKey : DEFAULT_SPACE_KEY;
}

function getSpaceLabel(spaceKey, t) {
  const space = appSpaces.find((item) => item.key === normalizeSpaceKey(spaceKey)) || appSpaces[0];
  return `${space.icon} ${t[space.labelKey]}`;
}

function normalizeReceiptKind(kind) {
  return kind === 'refund' ? 'refund' : 'expense';
}

function getReceiptSignedAmount(receipt) {
  const amount = Math.abs(Number(receipt?.amount) || 0);
  return normalizeReceiptKind(receipt?.kind) === 'refund' ? -amount : amount;
}

function formatReceiptAmount(receipt) {
  return formatTL(getReceiptSignedAmount(receipt));
}

function safeParseStoredJson(value, fallbackValue) {
  if (!value) {
    return fallbackValue;
  }

  try {
    return JSON.parse(value);
  } catch (error) {
    console.warn('Stored JSON could not be parsed:', error);
    return fallbackValue;
  }
}

function isValidReceiptRecord(receipt) {
  return Boolean(receipt && typeof receipt === 'object' && !Array.isArray(receipt));
}

function normalizeReceiptCategories(receipt, fallbackCurrency = activeCurrency) {
  if (!isValidReceiptRecord(receipt)) {
    return null;
  }

  const normalizedCategory = normalizeCategoryKey(receipt.category);
  const normalizedItems = Array.isArray(receipt.items)
    ? receipt.items.map((item) =>
        typeof item === 'string'
          ? item
          : {
              ...item,
              category: normalizeCategoryKey(item.category || normalizedCategory),
              amount: typeof item.amount === 'number' ? item.amount : parseAmount(String(item.amount || '')),
              quantity: Number(item.quantity) > 0 ? Number(item.quantity) : 1,
              unit: String(item.unit || ''),
            }
      )
    : [];
  const normalizedAmount = normalizeReceiptAmount(receipt.amount, normalizedItems);
  const reportCurrency = normalizeCurrencyCode(receipt.currency, fallbackCurrency);
  const originalCurrency = normalizeCurrencyCode(receipt.originalCurrency, reportCurrency);
  const originalAmount =
    typeof receipt.originalAmount === 'number'
      ? receipt.originalAmount
      : normalizedAmount;
  const subtotalAmount =
    typeof receipt.subtotalAmount === 'number'
      ? receipt.subtotalAmount
      : parseAmount(String(receipt.subtotalAmount || ''));
  const taxAmount =
    typeof receipt.taxAmount === 'number'
      ? receipt.taxAmount
      : parseAmount(String(receipt.taxAmount || ''));

  return {
    ...receipt,
    category: normalizedCategory,
    amount: normalizedAmount,
    currency: reportCurrency,
    originalAmount,
    originalCurrency,
    exchangeRate: Number(receipt.exchangeRate) > 0 ? Number(receipt.exchangeRate) : 1,
    subtotalAmount,
    taxAmount,
    kind: normalizeReceiptKind(receipt.kind),
    important: Boolean(receipt.important),
    warrantyUntil: normalizeDateDisplay(receipt.warrantyUntil || ''),
    note: String(receipt.note || ''),
    space: normalizeSpaceKey(receipt.space),
    items: normalizedItems,
    receiptNumber: normalizeReceiptNumber(receipt.receiptNumber || receipt.ticketNumber || receipt.invoiceNumber || ''),
    fingerprint: receipt.fingerprint || getReceiptFingerprint({ ...receipt, amount: normalizedAmount, items: normalizedItems }),
  };
}

function getItemsTotal(items) {
  return Array.isArray(items)
    ? items.reduce((sum, item) => {
        if (typeof item === 'string') {
          return sum;
        }

        return sum + getEditableItemAmount(item);
      }, 0)
    : 0;
}

function getEditableItemAmount(item) {
  if (!item || typeof item === 'string') {
    return 0;
  }

  const amountTextValue = parseAmount(String(item.amountText || ''));

  if (amountTextValue > 0) {
    return amountTextValue;
  }

  return Number(item.amount) || 0;
}

function normalizeReceiptNumber(value) {
  return normalizeLookupText(String(value || '').replace(/[^a-zA-Z0-9]/g, ''));
}

function getReceiptItemsFingerprint(items) {
  if (!Array.isArray(items) || items.length === 0) {
    return '';
  }

  return items
    .map((item) => {
      if (typeof item === 'string') {
        return normalizeLookupText(item);
      }

      const name = normalizeLookupText(item.name);
      const amount = getEditableItemAmount(item);
      const quantity = Number(item.quantity) || parseAmount(String(item.quantityText || '')) || 1;
      return `${name}:${amount.toFixed(2)}:${quantity}`;
    })
    .filter(Boolean)
    .sort()
    .join('|');
}

function getReceiptFingerprint(receipt) {
  const store = normalizeLookupText(receipt?.store);
  const date = normalizeDateDisplay(receipt?.date || '', receipt?.createdAt);
  const amount = Number(receipt?.amount) || 0;
  const items = getReceiptItemsFingerprint(receipt?.items);

  return [store, date, amount.toFixed(2), items].filter(Boolean).join('|');
}

function normalizeReceiptAmount(amount, items) {
  const numericAmount =
    typeof amount === 'number' ? amount : parseAmount(String(amount || ''));
  const itemTotal = getItemsTotal(items);

  if (itemTotal <= 0 || numericAmount <= 0) {
    return numericAmount;
  }

  const ratio = numericAmount / itemTotal;

  if (ratio > 90 && ratio < 110) {
    return Number(itemTotal.toFixed(2));
  }

  return numericAmount;
}

function createEditableItems(receipt) {
  const receiptCategory = normalizeCategoryKey(receipt.category);
  const items = Array.isArray(receipt.items) ? receipt.items : [];

  return createEditableItemsFromList(items, receiptCategory);
}

function createEditableItemsFromList(items, fallbackCategory) {
  const normalizedFallbackCategory = normalizeCategoryKey(fallbackCategory);
  const safeItems = Array.isArray(items) ? items : [];

  return safeItems.map((item, index) => {
    if (typeof item === 'string') {
      return {
        id: `${Date.now()}-${index}`,
        name: item,
        amountText: '',
        quantityText: '1',
        unit: '',
        category: normalizedFallbackCategory,
      };
    }

    return {
      id: `${Date.now()}-${index}`,
      name: item.name || '',
      amountText: typeof item.amount === 'number' ? String(item.amount).replace('.', ',') : '',
      quantityText: Number(item.quantity) > 0 ? String(item.quantity).replace('.', ',') : '1',
      unit: item.unit || '',
      category: normalizeCategoryKey(item.category || normalizedFallbackCategory),
    };
  });
}

function cleanEditableItems(items, fallbackCategory) {
  return items
    .map((item) => {
      const name = item.name.trim();
      const amount = parseAmount(item.amountText);

      return {
        name,
        category: normalizeCategoryKey(item.category || fallbackCategory),
        amount: amount > 0 ? amount : null,
        quantity: parseAmount(item.quantityText || '1') || 1,
        unit: String(item.unit || '').trim(),
      };
    })
    .filter((item) => item.name || item.amount);
}

function getReceiptTime(receipt) {
  const receiptDate = parseReceiptDateText(receipt?.date);

  if (receiptDate) {
    return receiptDate.getTime();
  }

  return receipt?.createdAt || receipt?.id || 0;
}

function getReceiptAddedTime(receipt) {
  return receipt?.createdAt || receipt?.id || 0;
}

function getMonthKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function moveMonthKey(monthKey, monthDelta) {
  const [year, month] = monthKey.split('-').map(Number);
  const date = new Date(year, month - 1 + monthDelta, 1);
  return getMonthKey(date);
}

function formatMonthKey(monthKey) {
  const [year, month] = monthKey.split('-');
  return `${month}.${year}`;
}

function isSeedReceipt(receipt) {
  return [1, 2, 3, 4, 5].includes(receipt.id) && !receipt.image && !receipt.createdAt;
}

function parseReceiptDateText(dateText) {
  const match = String(dateText || '').trim().match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);

  if (!match) {
    return null;
  }

  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);
  const parsedDate = new Date(year, month - 1, day);

  if (
    parsedDate.getFullYear() !== year ||
    parsedDate.getMonth() !== month - 1 ||
    parsedDate.getDate() !== day
  ) {
    return null;
  }

  return parsedDate;
}

function getDateFromReceipt(receipt) {
  const receiptDate = parseReceiptDateText(receipt.date);

  if (receiptDate) {
    return receiptDate;
  }

  if (receipt.createdAt) {
    return new Date(receipt.createdAt);
  }

  return null;
}

function filterReceiptsByPeriod(receipts, period) {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekStart = new Date(startOfToday);
  weekStart.setDate(startOfToday.getDate() - ((startOfToday.getDay() + 6) % 7));

  return receipts.filter((receipt) => {
    if (period === 'all') {
      return true;
    }

    const receiptDate = getDateFromReceipt(receipt);
    if (!receiptDate) {
      return false;
    }

    if (period === 'week') {
      return receiptDate >= weekStart;
    }

    return (
      receiptDate.getFullYear() === now.getFullYear() &&
      receiptDate.getMonth() === now.getMonth()
    );
  });
}

function filterReceiptsByMonthKey(receipts, monthKey) {
  return receipts.filter((receipt) => {
    const receiptDate = getDateFromReceipt(receipt);

    if (!receiptDate) {
      return false;
    }

    return getMonthKey(receiptDate) === monthKey;
  });
}

function getMonthKeysBetween(startMonthKey, endMonthKey) {
  const monthKeys = [];
  let cursor = startMonthKey;
  let guard = 0;

  while (cursor <= endMonthKey && guard < 36) {
    monthKeys.push(cursor);
    cursor = moveMonthKey(cursor, 1);
    guard += 1;
  }

  return monthKeys;
}

function buildMonthlyReceiptGroups(receipts, recurringExpenses, spaceKey, currencyCode) {
  const currentMonthKey = getMonthKey();
  const monthKeys = new Set();

  receipts.forEach((receipt) => {
    const receiptDate = getDateFromReceipt(receipt);

    if (receiptDate) {
      monthKeys.add(getMonthKey(receiptDate));
    }
  });

  recurringExpenses.forEach((expense) => {
    if (expense.space && normalizeSpaceKey(expense.space) !== normalizeSpaceKey(spaceKey)) {
      return;
    }

    const startMonthKey = String(expense.startMonth || currentMonthKey);

    getMonthKeysBetween(startMonthKey, currentMonthKey).forEach((monthKey) => {
      if (buildRecurringReceiptsForMonth([expense], monthKey, spaceKey, currencyCode).length > 0) {
        monthKeys.add(monthKey);
      }
    });
  });

  if (monthKeys.size === 0) {
    monthKeys.add(currentMonthKey);
  }

  return [...monthKeys]
    .sort((first, second) => second.localeCompare(first))
    .map((monthKey) => {
      const monthReceipts = [
        ...filterReceiptsByMonthKey(receipts, monthKey),
        ...buildRecurringReceiptsForMonth(recurringExpenses, monthKey, spaceKey, currencyCode),
      ].sort((first, second) => getReceiptTime(second) - getReceiptTime(first));

      return {
        key: monthKey,
        label: formatMonthKey(monthKey),
        receipts: monthReceipts,
        count: monthReceipts.length,
        amount: monthReceipts.reduce((sum, receipt) => sum + getReceiptSignedAmount(receipt), 0),
      };
    });
}

function getReceiptProductMonthOptions(receipts) {
  const now = new Date();
  const monthKeys = new Set();

  for (let monthIndex = 0; monthIndex <= now.getMonth(); monthIndex += 1) {
    monthKeys.add(getMonthKey(new Date(now.getFullYear(), monthIndex, 1)));
  }

  receipts.forEach((receipt) => {
    const receiptDate = getDateFromReceipt(receipt);

    if (receiptDate) {
      monthKeys.add(getMonthKey(receiptDate));
    }
  });

  return [...monthKeys]
    .sort((first, second) => second.localeCompare(first))
    .map((monthKey) => ({
      key: monthKey,
      label: formatMonthKey(monthKey),
    }));
}

function filterReceiptsByYear(receipts, year = new Date().getFullYear()) {
  return receipts.filter((receipt) => {
    const receiptDate = getDateFromReceipt(receipt);

    return receiptDate && receiptDate.getFullYear() === year;
  });
}

function getEndOfMonthFromKey(monthKey) {
  const [year, month] = monthKey.split('-').map(Number);
  return new Date(year, month, 0, 23, 59, 59, 999);
}

function getIncomeTotalUntilMonth(incomeByMonth, monthKey) {
  return Object.entries(incomeByMonth).reduce((sum, [incomeKey, incomeValue]) => {
    if (incomeKey > monthKey) {
      return sum;
    }

    return sum + parseAmount(String(incomeValue || ''));
  }, 0);
}

function getReceiptTotalUntilMonth(receipts, monthKey) {
  const endOfMonth = getEndOfMonthFromKey(monthKey);

  return receipts.reduce((sum, receipt) => {
    const receiptDate = getDateFromReceipt(receipt);

    if (!receiptDate || receiptDate > endOfMonth) {
      return sum;
    }

    return sum + getReceiptSignedAmount(receipt);
  }, 0);
}

function searchReceipts(receipts, query) {
  const cleanQuery = query.trim().toLocaleLowerCase('tr-TR');

  if (!cleanQuery) {
    return receipts;
  }

  return receipts.filter((receipt) => {
    const categoryLabel = getCategoryLabel(receipt.category, translations.tr);
    const normalizedDate = normalizeDateDisplay(receipt.date, receipt.createdAt);
    const amountText = [
      String(receipt.amount || ''),
      formatReceiptAmount(receipt),
      Number(getReceiptSignedAmount(receipt)).toFixed(2).replace('.', ','),
    ].join(' ');
    const itemText = Array.isArray(receipt.items)
      ? receipt.items
          .map((item) => {
            if (typeof item === 'string') {
              return item;
            }

            return [
              item?.name || '',
              getCategoryLabel(item?.category || receipt.category, translations.tr),
              String(item?.amount || ''),
              Number(item?.amount || 0).toFixed(2).replace('.', ','),
              String(item?.quantity || ''),
              item?.unit || '',
            ].join(' ');
          })
          .join(' ')
      : '';
    const haystack = [
      receipt.store,
      receipt.date,
      normalizedDate,
      categoryLabel,
      normalizeCategoryKey(receipt.category),
      amountText,
      itemText,
      receipt.note,
      receipt.warrantyUntil,
      receipt.space,
      normalizeReceiptKind(receipt.kind),
    ]
      .join(' ')
      .toLocaleLowerCase('tr-TR');
    return haystack.includes(cleanQuery);
  });
}

function getMerchantGroups(receipts) {
  const groups = new Map();

  receipts.forEach((receipt) => {
    const storeName = String(receipt.store || '').trim() || 'Bilinmeyen';
    const storeKey = storeName.toLocaleLowerCase('tr-TR');
    const existingGroup =
      groups.get(storeKey) || {
        key: storeKey,
        store: storeName,
        amount: 0,
        count: 0,
        latestTime: 0,
        items: [],
        receipts: [],
      };

    existingGroup.amount += getReceiptSignedAmount(receipt);
    existingGroup.count += 1;
    existingGroup.latestTime = Math.max(existingGroup.latestTime, getReceiptTime(receipt));
    existingGroup.receipts.push(receipt);

    if (Array.isArray(receipt.items)) {
      receipt.items.forEach((item) => {
        if (typeof item === 'string' && item.trim()) {
          existingGroup.items.push(item.trim());
        } else if (item?.name) {
          existingGroup.items.push(item.name);
        }
      });
    }

    groups.set(storeKey, existingGroup);
  });

  return [...groups.values()].sort((first, second) => second.amount - first.amount);
}

function getProductGroups(receipts) {
  const groups = new Map();

  receipts.forEach((receipt) => {
    if (!Array.isArray(receipt.items)) {
      return;
    }

    receipt.items.forEach((item) => {
      const normalizedItem =
        typeof item === 'string'
          ? { name: item, amount: 0, quantity: 1, unit: '' }
          : item;
      const name = String(normalizedItem.name || '').trim();

      if (!name) {
        return;
      }

      const unit = String(normalizedItem.unit || '').trim();
      const key = `${name.toLocaleLowerCase('tr-TR')}|${unit.toLocaleLowerCase('tr-TR')}`;
      const existingGroup =
        groups.get(key) || {
          key,
          name,
          unit,
          quantity: 0,
          amount: 0,
          count: 0,
          prices: [],
          latestTime: 0,
        };

      const itemQuantity = Number(normalizedItem.quantity) > 0 ? Number(normalizedItem.quantity) : 1;
      const itemAmount = Number(normalizedItem.amount) || 0;
      existingGroup.quantity += itemQuantity;
      existingGroup.amount += itemAmount;
      existingGroup.count += 1;
      existingGroup.latestTime = Math.max(existingGroup.latestTime, getReceiptTime(receipt));
      if (itemAmount > 0 && itemQuantity > 0) {
        existingGroup.prices.push({
          unitPrice: itemAmount / itemQuantity,
          time: getReceiptTime(receipt),
        });
      }
      groups.set(key, existingGroup);
    });
  });

  return [...groups.values()].map((group) => {
    const prices = group.prices || [];
    const sortedPrices = [...prices].sort((first, second) => second.time - first.time);
    const unitPrices = prices.map((price) => price.unitPrice).filter((price) => Number.isFinite(price) && price > 0);

    return {
      ...group,
      lastPrice: sortedPrices[0]?.unitPrice || 0,
      averagePrice:
        unitPrices.length > 0
          ? unitPrices.reduce((sum, price) => sum + price, 0) / unitPrices.length
          : 0,
      lowestPrice: unitPrices.length > 0 ? Math.min(...unitPrices) : 0,
      highestPrice: unitPrices.length > 0 ? Math.max(...unitPrices) : 0,
    };
  }).sort((first, second) => {
    if (second.quantity !== first.quantity) {
      return second.quantity - first.quantity;
    }

    if (second.count !== first.count) {
      return second.count - first.count;
    }

    return second.amount - first.amount;
  });
}

function getBudgetSummary(categories, budgetsByCategory) {
  return categories
    .map((category) => {
      const limit = parseAmount(String(budgetsByCategory[category.key] || ''));
      const spent = Math.max(0, Number(category.amount) || 0);

      if (limit <= 0) {
        return null;
      }

      return {
        ...category,
        limit,
        spent,
        remaining: limit - spent,
        ratio: limit > 0 ? spent / limit : 0,
      };
    })
    .filter(Boolean)
    .sort((first, second) => second.ratio - first.ratio);
}

function normalizeRecurringFrequency(frequency) {
  return frequency === 'yearly' ? 'yearly' : 'monthly';
}

function isMonthKeyBefore(firstMonthKey, secondMonthKey) {
  return String(firstMonthKey || '') < String(secondMonthKey || '');
}

function getRecurringStartMonth(expense) {
  return String(expense?.startMonth || getMonthKey()).match(/^\d{4}-\d{2}$/)
    ? expense.startMonth
    : getMonthKey();
}

function shouldRecurringExpenseApply(expense, monthKey, spaceKey) {
  if (!expense || expense.active === false) {
    return false;
  }

  if (expense.space && normalizeSpaceKey(expense.space) !== normalizeSpaceKey(spaceKey)) {
    return false;
  }

  const startMonth = getRecurringStartMonth(expense);
  if (isMonthKeyBefore(monthKey, startMonth)) {
    return false;
  }

  return true;
}

function getRecurringMonthlyAmount(expense) {
  const amount = parseAmount(String(expense?.amountText || expense?.amount || ''));

  if (amount <= 0) {
    return 0;
  }

  return normalizeRecurringFrequency(expense?.frequency) === 'yearly' ? amount / 12 : amount;
}

function getRecurringMonthlyTotal(recurringExpenses, spaceKey = DEFAULT_SPACE_KEY, monthKey = getMonthKey()) {
  return buildRecurringReceiptsForMonth(recurringExpenses, monthKey, spaceKey, activeCurrency)
    .reduce((sum, receipt) => sum + getReceiptSignedAmount(receipt), 0);
}

function getRecurringTotalUntilMonth(recurringExpenses, spaceKey, monthKey, currencyCode) {
  const endMonth = String(monthKey || getMonthKey());
  const startMonth = recurringExpenses.reduce((earliestMonth, expense) => {
    if (!expense || expense.active === false) {
      return earliestMonth;
    }

    if (expense.space && normalizeSpaceKey(expense.space) !== normalizeSpaceKey(spaceKey)) {
      return earliestMonth;
    }

    const expenseStartMonth = getRecurringStartMonth(expense);
    return !earliestMonth || expenseStartMonth < earliestMonth ? expenseStartMonth : earliestMonth;
  }, '');

  if (!startMonth || isMonthKeyBefore(endMonth, startMonth)) {
    return 0;
  }

  let cursor = startMonth;
  let total = 0;

  while (!isMonthKeyBefore(endMonth, cursor)) {
    total += buildRecurringReceiptsForMonth(recurringExpenses, cursor, spaceKey, currencyCode)
      .reduce((sum, receipt) => sum + getReceiptSignedAmount(receipt), 0);
    cursor = moveMonthKey(cursor, 1);
  }

  return total;
}

function buildRecurringReceiptsForMonth(recurringExpenses, monthKey, spaceKey, currencyCode) {
  const [year, month] = String(monthKey || getMonthKey()).split('-').map(Number);
  const safeYear = Number.isFinite(year) ? year : new Date().getFullYear();
  const safeMonth = Number.isFinite(month) ? month : new Date().getMonth() + 1;
  const maxDay = new Date(safeYear, safeMonth, 0).getDate();

  return recurringExpenses
    .filter((expense) => shouldRecurringExpenseApply(expense, monthKey, spaceKey))
    .map((expense, index) => {
      const amount = getRecurringMonthlyAmount(expense);
      const day = Math.max(1, Math.min(maxDay, Math.round(Number(expense.day) || 1)));
      const timestamp = new Date(safeYear, safeMonth - 1, day, 8, index).getTime();

      if (amount <= 0 || !String(expense.name || '').trim()) {
        return null;
      }

      return {
        id: `recurring-${expense.id || index}-${monthKey}`,
        createdAt: timestamp,
        store: String(expense.name || '').trim(),
        amount,
        currency: normalizeCurrencyCode(currencyCode),
        originalAmount: amount,
        originalCurrency: normalizeCurrencyCode(currencyCode),
        exchangeRate: 1,
        subtotalAmount: 0,
        taxAmount: 0,
        category: normalizeCategoryKey(expense.category || 'other'),
        date: formatReceiptDate(timestamp),
        kind: 'expense',
        important: false,
        warrantyUntil: '',
        note: '',
        space: normalizeSpaceKey(spaceKey),
        image: null,
        file: null,
        items: [],
        isRecurring: true,
      };
    })
    .filter(Boolean);
}

function formatReceiptDate(timestamp, languageCode = 'tr') {
  if (!timestamp) {
    return '';
  }

  const date = new Date(timestamp);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();

  return `${day}.${month}.${year}`;
}

function normalizeDateDisplay(dateText, timestamp) {
  const monthMap = {
    ocak: '01',
    january: '01',
    janvier: '01',
    januar: '01',
    enero: '01',
    subat: '02',
    şubat: '02',
    february: '02',
    fevrier: '02',
    février: '02',
    februar: '02',
    febrero: '02',
    mart: '03',
    march: '03',
    mars: '03',
    marzo: '03',
    nisan: '04',
    april: '04',
    avril: '04',
    abril: '04',
    mayis: '05',
    mayıs: '05',
    may: '05',
    mai: '05',
    mayo: '05',
    haziran: '06',
    june: '06',
    juin: '06',
    juni: '06',
    junio: '06',
    temmuz: '07',
    july: '07',
    juillet: '07',
    juli: '07',
    julio: '07',
    agustos: '08',
    ağustos: '08',
    august: '08',
    aout: '08',
    août: '08',
    agosto: '08',
    eylul: '09',
    eylül: '09',
    september: '09',
    septembre: '09',
    septiembre: '09',
    ekim: '10',
    october: '10',
    octobre: '10',
    oktober: '10',
    octubre: '10',
    kasim: '11',
    kasım: '11',
    november: '11',
    novembre: '11',
    noviembre: '11',
    aralik: '12',
    aralık: '12',
    december: '12',
    decembre: '12',
    décembre: '12',
    dezember: '12',
    diciembre: '12',
  };
  const normalizedText = String(dateText || '').trim();

  const parsedDate = parseReceiptDateText(normalizedText);

  if (parsedDate) {
    return formatReceiptDate(parsedDate.getTime());
  }

  const match = normalizedText.match(/(\d{1,2})\s+([^\s]+)\s+(\d{4})/i);

  if (match) {
    const day = match[1].padStart(2, '0');
    const month = monthMap[match[2].toLocaleLowerCase('tr-TR')];
    const year = match[3];

    if (month) {
      return `${day}.${month}.${year}`;
    }
  }

  return normalizedText || formatReceiptDate(timestamp);
}

const initialReceipts = [];

async function prepareReceiptImageForAnalysis(imageUri) {
  try {
    const result = await ImageManipulator.manipulateAsync(
      imageUri,
      [{ resize: { width: ANALYSIS_IMAGE_MAX_WIDTH } }],
      {
        compress: ANALYSIS_IMAGE_QUALITY,
        format: ImageManipulator.SaveFormat.JPEG,
        base64: true,
      }
    );

    if (result.base64) {
      return result.base64;
    }
  } catch (error) {
    console.warn('Receipt image compression failed. Sending original image.', error);
  }

  return FileSystem.readAsStringAsync(imageUri, {
    encoding: FileSystem.EncodingType?.Base64 || 'base64',
  });
}

async function analyzeReceiptPhoto(imageUri) {
  if (!RECEIPT_ANALYSIS_ENDPOINT) {
    const error = new Error('Receipt analysis endpoint is not configured.');
    error.code = 'ANALYSIS_NOT_CONFIGURED';
    throw error;
  }

  const imageBase64 = await prepareReceiptImageForAnalysis(imageUri);
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), ANALYSIS_REQUEST_TIMEOUT_MS);

  let response;

  try {
    response = await fetch(RECEIPT_ANALYSIS_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(RECEIPT_ANALYSIS_CLIENT_TOKEN ? { 'X-Client-Token': RECEIPT_ANALYSIS_CLIENT_TOKEN } : {}),
      },
      signal: controller.signal,
      body: JSON.stringify({
        imageBase64,
      }),
    });
  } catch (error) {
    if (error.name === 'AbortError') {
      const timeoutError = new Error('Receipt analysis timed out.');
      timeoutError.code = 'ANALYSIS_TIMEOUT';
      throw timeoutError;
    }

    throw error;
  } finally {
    clearTimeout(timeoutId);
  }

  if (!response.ok) {
    let errorBody = {};

    try {
      errorBody = await response.json();
    } catch (error) {
      errorBody = {};
    }

    const error = new Error(errorBody.message || `Receipt analysis failed: ${response.status}`);
    error.code = errorBody.error || 'ANALYSIS_SERVICE_ERROR';
    throw error;
  }

  const result = await response.json();

  return {
    storeName: result.storeName || result.store || '',
    totalText: String(result.totalText || result.total || ''),
    subtotalText: String(result.subtotalText || ''),
    taxText: String(result.taxText || ''),
    receiptNumber: String(result.receiptNumber || result.ticketNumber || result.invoiceNumber || result.orderNumber || ''),
    currencyCode: normalizeCurrencyCode(result.currencyCode, activeCurrency),
    dateText: result.dateText || result.date || formatReceiptDate(Date.now()),
    categoryKey: normalizeCategoryKey(result.categoryKey || result.category),
    confidence: typeof result.confidence === 'number' ? result.confidence : null,
    items: Array.isArray(result.items)
      ? result.items.map((item) => ({
          name: String(item.name || ''),
          category: normalizeCategoryKey(item.category),
          amount: typeof item.amount === 'number' ? item.amount : parseAmount(String(item.amount || '')),
          quantity: Number(item.quantity) > 0 ? Number(item.quantity) : 1,
          unit: String(item.unit || ''),
        }))
      : [],
  };
}

async function analyzeReceiptPdf(fileUri, fileName = 'receipt.pdf', mimeType = 'application/pdf') {
  if (!RECEIPT_ANALYSIS_ENDPOINT) {
    const error = new Error('Receipt analysis endpoint is not configured.');
    error.code = 'ANALYSIS_NOT_CONFIGURED';
    throw error;
  }

  const fileBase64 = await FileSystem.readAsStringAsync(fileUri, {
    encoding: FileSystem.EncodingType?.Base64 || 'base64',
  });
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), ANALYSIS_REQUEST_TIMEOUT_MS);

  let response;

  try {
    response = await fetch(RECEIPT_ANALYSIS_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(RECEIPT_ANALYSIS_CLIENT_TOKEN ? { 'X-Client-Token': RECEIPT_ANALYSIS_CLIENT_TOKEN } : {}),
      },
      signal: controller.signal,
      body: JSON.stringify({
        fileBase64,
        fileName,
        mimeType,
      }),
    });
  } catch (error) {
    if (error.name === 'AbortError') {
      const timeoutError = new Error('Receipt analysis timed out.');
      timeoutError.code = 'ANALYSIS_TIMEOUT';
      throw timeoutError;
    }

    throw error;
  } finally {
    clearTimeout(timeoutId);
  }

  if (!response.ok) {
    let errorBody = {};

    try {
      errorBody = await response.json();
    } catch (error) {
      errorBody = {};
    }

    const error = new Error(errorBody.message || `Receipt analysis failed: ${response.status}`);
    error.code = errorBody.error || 'ANALYSIS_SERVICE_ERROR';
    throw error;
  }

  const result = await response.json();

  return {
    storeName: result.storeName || result.store || '',
    totalText: String(result.totalText || result.total || ''),
    subtotalText: String(result.subtotalText || ''),
    taxText: String(result.taxText || ''),
    receiptNumber: String(result.receiptNumber || result.ticketNumber || result.invoiceNumber || result.orderNumber || ''),
    currencyCode: normalizeCurrencyCode(result.currencyCode, activeCurrency),
    dateText: result.dateText || result.date || formatReceiptDate(Date.now()),
    categoryKey: normalizeCategoryKey(result.categoryKey || result.category),
    confidence: typeof result.confidence === 'number' ? result.confidence : null,
    items: Array.isArray(result.items)
      ? result.items.map((item) => ({
          name: String(item.name || ''),
          category: normalizeCategoryKey(item.category),
          amount: typeof item.amount === 'number' ? item.amount : parseAmount(String(item.amount || '')),
          quantity: Number(item.quantity) > 0 ? Number(item.quantity) : 1,
          unit: String(item.unit || ''),
        }))
      : [],
  };
}

function formatTL(value) {
  return formatCurrencyAmount(value, activeCurrency);
}

function formatCurrencyAmount(value, currencyCode = activeCurrency) {
  const numericValue = Number(value) || 0;
  const hasCents = Math.abs(numericValue % 1) > 0.001;

  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: normalizeCurrencyCode(currencyCode, activeCurrency),
    minimumFractionDigits: hasCents ? 2 : 0,
    maximumFractionDigits: 2,
  }).format(numericValue);
}

async function getExchangeRate(fromCurrency, toCurrency, dateText = '') {
  const from = normalizeCurrencyCode(fromCurrency, activeCurrency);
  const to = normalizeCurrencyCode(toCurrency, activeCurrency);

  if (from === to) {
    return 1;
  }

  const rateDate = getReceiptDateForRate(dateText);
  const dateQuery = rateDate ? `&date=${encodeURIComponent(rateDate)}` : '';
  const response = await fetch(`${EXCHANGE_RATE_ENDPOINT}?base=${encodeURIComponent(from)}&quotes=${encodeURIComponent(to)}${dateQuery}`);

  if (!response.ok) {
    throw new Error(`Exchange rate request failed: ${response.status}`);
  }

  const result = await response.json();
  const rate = Array.isArray(result)
    ? Number(result.find((entry) => entry?.quote === to)?.rate)
    : Number(result?.rates?.[to]);

  if (!Number.isFinite(rate) || rate <= 0) {
    throw new Error('Exchange rate is missing.');
  }

  return rate;
}

async function buildReceiptMoneyFields(originalAmount, originalCurrency, reportCurrency, items, dateText = '') {
  const cleanOriginalCurrency = normalizeCurrencyCode(originalCurrency, reportCurrency);
  const cleanReportCurrency = normalizeCurrencyCode(reportCurrency, activeCurrency);
  const exchangeRate = await getExchangeRate(cleanOriginalCurrency, cleanReportCurrency, dateText);
  const convertedAmount = Number((originalAmount * exchangeRate).toFixed(2));
  const convertedItems = Array.isArray(items)
    ? items.map((item) => {
        if (typeof item.amount !== 'number' || item.amount <= 0) {
          return item;
        }

        return {
          ...item,
          originalAmount: item.originalAmount ?? item.amount,
          originalCurrency: item.originalCurrency || cleanOriginalCurrency,
          amount: Number((item.amount * exchangeRate).toFixed(2)),
        };
      })
    : [];

  return {
    amount: convertedAmount,
    currency: cleanReportCurrency,
    originalAmount: Number(originalAmount.toFixed(2)),
    originalCurrency: cleanOriginalCurrency,
    exchangeRate,
    items: convertedItems,
  };
}

function formatQuantity(value) {
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue) || numericValue <= 0) {
    return '1';
  }

  return new Intl.NumberFormat('tr-TR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 3,
  }).format(numericValue);
}

function getItemQuantityText(item, t) {
  const quantity = Number(item.quantity) > 0 ? Number(item.quantity) : 1;
  const unit = String(item.unit || '').trim();
  const quantityText = `${formatQuantity(quantity)}${unit ? ` ${unit}` : ''}`;

  if (typeof item.amount === 'number' && item.amount > 0 && quantity > 0) {
    const unitPrice = item.amount / quantity;

    if (quantity !== 1 || unit) {
      return `${quantityText} x ${formatTL(unitPrice)} = ${formatTL(item.amount)}`;
    }
  }

  return `${t.quantity}: ${quantityText}`;
}

function parseAmount(value) {
  const cleanedValue = String(value || '').replace(/[^\d.,-]/g, '');
  const lastCommaIndex = cleanedValue.lastIndexOf(',');
  const lastDotIndex = cleanedValue.lastIndexOf('.');

  if (lastCommaIndex !== -1 && lastDotIndex !== -1) {
    const decimalSeparator = lastCommaIndex > lastDotIndex ? ',' : '.';
    const thousandSeparator = decimalSeparator === ',' ? '.' : ',';
    const normalized = cleanedValue
      .replace(new RegExp(`\\${thousandSeparator}`, 'g'), '')
      .replace(decimalSeparator, '.');

    return Number(normalized) || 0;
  }

  const separator = lastCommaIndex !== -1 ? ',' : lastDotIndex !== -1 ? '.' : null;

  if (!separator) {
    return Number(cleanedValue) || 0;
  }

  const separatorIndex = separator === ',' ? lastCommaIndex : lastDotIndex;
  const decimals = cleanedValue.length - separatorIndex - 1;
  const separatorCount = cleanedValue.split(separator).length - 1;

  if (separatorCount === 1 && decimals > 0 && decimals <= 2) {
    return Number(cleanedValue.replace(separator, '.')) || 0;
  }

  return Number(cleanedValue.replace(new RegExp(`\\${separator}`, 'g'), '')) || 0;
}

async function saveReceiptImageToDevice(sourceUri) {
  try {
    const directoryInfo = await FileSystem.getInfoAsync(RECEIPT_IMAGE_DIR);

    if (!directoryInfo.exists) {
      await FileSystem.makeDirectoryAsync(RECEIPT_IMAGE_DIR, { intermediates: true });
    }

    const extension = sourceUri.split('.').pop()?.split('?')[0] || 'jpg';
    const targetUri = `${RECEIPT_IMAGE_DIR}${Date.now()}.${extension}`;
    await FileSystem.copyAsync({ from: sourceUri, to: targetUri });

    return targetUri;
  } catch (error) {
    console.warn('Receipt image copy failed, using original uri:', error);
    return sourceUri;
  }
}

async function saveReceiptFileToDevice(sourceUri, fileName = '') {
  try {
    await ensureDirectory(RECEIPT_FILE_DIR);

    const safeExtension = fileName.split('.').pop() || sourceUri.split('.').pop()?.split('?')[0] || 'pdf';
    const targetUri = `${RECEIPT_FILE_DIR}${Date.now()}.${safeExtension}`;
    await FileSystem.copyAsync({ from: sourceUri, to: targetUri });

    return targetUri;
  } catch (error) {
    console.warn('Receipt file copy failed, using original uri:', error);
    return sourceUri;
  }
}

async function deleteReceiptImage(imageUri) {
  if (!imageUri || !imageUri.startsWith(RECEIPT_IMAGE_DIR)) {
    return;
  }

  try {
    const imageInfo = await FileSystem.getInfoAsync(imageUri);

    if (imageInfo.exists) {
      await FileSystem.deleteAsync(imageUri, { idempotent: true });
    }
  } catch (error) {
    console.warn('Receipt image delete failed:', error);
  }
}

async function deleteReceiptFile(fileRecord) {
  const fileUri = typeof fileRecord === 'string' ? fileRecord : fileRecord?.uri;

  if (!fileUri || !fileUri.startsWith(RECEIPT_FILE_DIR)) {
    return;
  }

  try {
    const fileInfo = await FileSystem.getInfoAsync(fileUri);

    if (fileInfo.exists) {
      await FileSystem.deleteAsync(fileUri, { idempotent: true });
    }
  } catch (error) {
    console.warn('Receipt file delete failed:', error);
  }
}

async function ensureDirectory(directoryUri) {
  const directoryInfo = await FileSystem.getInfoAsync(directoryUri);

  if (!directoryInfo.exists) {
    await FileSystem.makeDirectoryAsync(directoryUri, { intermediates: true });
  }
}

async function deleteDirectoryIfExists(directoryUri) {
  try {
    const directoryInfo = await FileSystem.getInfoAsync(directoryUri);

    if (directoryInfo.exists) {
      await FileSystem.deleteAsync(directoryUri, { idempotent: true });
    }
  } catch (error) {
    console.warn('Directory delete failed:', error);
  }
}

function getReceiptDateForRate(dateText) {
  const match = String(dateText || '').match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);

  if (!match) {
    return '';
  }

  const day = match[1].padStart(2, '0');
  const month = match[2].padStart(2, '0');
  const year = match[3];
  const date = new Date(`${year}-${month}-${day}T00:00:00Z`);

  if (Number.isNaN(date.getTime()) || date.getTime() > Date.now()) {
    return '';
  }

  return `${year}-${month}-${day}`;
}

function isReceiptDuplicate(candidateReceipt, receiptList) {
  const candidateStore = normalizeLookupText(candidateReceipt.store);
  const candidateDate = String(candidateReceipt.date || '').trim();
  const candidateAmount = Number(candidateReceipt.amount) || 0;
  const candidateReceiptNumber = normalizeReceiptNumber(candidateReceipt.receiptNumber);
  const candidateFingerprint = candidateReceipt.fingerprint || getReceiptFingerprint(candidateReceipt);
  const candidateItemsFingerprint = getReceiptItemsFingerprint(candidateReceipt.items);

  return receiptList.some((receipt) => {
    const receiptStore = normalizeLookupText(receipt.store);
    const receiptNumber = normalizeReceiptNumber(receipt.receiptNumber);
    const receiptFingerprint = receipt.fingerprint || getReceiptFingerprint(receipt);
    const receiptItemsFingerprint = getReceiptItemsFingerprint(receipt.items);
    const sameDate = candidateDate && candidateDate === String(receipt.date || '').trim();
    const sameAmount = Math.abs((Number(receipt.amount) || 0) - candidateAmount) < 0.02;
    const sameStore =
      candidateStore &&
      receiptStore &&
      (candidateStore === receiptStore || candidateStore.includes(receiptStore) || receiptStore.includes(candidateStore));

    const sameReceiptNumber =
      candidateReceiptNumber &&
      receiptNumber &&
      candidateReceiptNumber === receiptNumber;
    const sameFingerprint =
      candidateFingerprint &&
      receiptFingerprint &&
      candidateFingerprint === receiptFingerprint;
    const sameItems =
      candidateItemsFingerprint &&
      receiptItemsFingerprint &&
      candidateItemsFingerprint === receiptItemsFingerprint;

    return sameReceiptNumber || sameFingerprint || (sameDate && sameAmount && sameStore && sameItems) || (sameDate && sameAmount && sameStore);
  });
}

function shouldWarnImageQuality(asset) {
  const width = Number(asset?.width) || 0;
  const height = Number(asset?.height) || 0;

  return (width > 0 && width < 900) || (height > 0 && height < 900);
}

function confirmAlert(title, message, confirmLabel, cancelLabel) {
  return new Promise((resolve) => {
    Alert.alert(title, message, [
      { text: cancelLabel, style: 'cancel', onPress: () => resolve(false) },
      { text: confirmLabel, onPress: () => resolve(true) },
    ]);
  });
}

function buildCategoryMemoryFromItems(items) {
  return cleanEditableItems(items, 'other').reduce((memory, item) => {
    const key = normalizeLookupText(item.name);

    if (key && item.category) {
      memory[key] = item.category;
    }

    return memory;
  }, {});
}

function applyCategoryMemory(items, memory) {
  if (!Array.isArray(items)) {
    return [];
  }

  return items.map((item) => {
    const key = normalizeLookupText(item.name);
    const rememberedCategory = memory[key];

    return rememberedCategory
      ? { ...item, category: rememberedCategory }
      : item;
  });
}

function csvEscape(value) {
  const text = String(value ?? '');
  return `"${text.replace(/"/g, '""')}"`;
}

function buildReceiptsCsv(receiptList) {
  const rows = [
    ['Date', 'Store', 'Category', 'Kind', 'Amount', 'Currency', 'Original Amount', 'Original Currency', 'Tax', 'Subtotal', 'Warranty', 'Important', 'Space', 'Note', 'Items'],
    ...receiptList.map((receipt) => [
      receipt.date || '',
      receipt.store || '',
      receipt.category || '',
      normalizeReceiptKind(receipt.kind),
      getReceiptSignedAmount(receipt),
      receipt.currency || activeCurrency,
      Number(receipt.originalAmount ?? receipt.amount) || 0,
      receipt.originalCurrency || receipt.currency || activeCurrency,
      Number(receipt.taxAmount) || 0,
      Number(receipt.subtotalAmount) || 0,
      receipt.warrantyUntil || '',
      receipt.important ? 'yes' : 'no',
      receipt.space || DEFAULT_SPACE_KEY,
      receipt.note || '',
      Array.isArray(receipt.items)
        ? receipt.items.map((item) => (typeof item === 'string' ? item : item.name)).filter(Boolean).join('; ')
        : '',
    ]),
  ];

  return rows.map((row) => row.map(csvEscape).join(',')).join('\n');
}

export default function App() {
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const mainScrollRef = useRef(null);
  const [screen, setScreen] = useState('home');
  const [receipts, setReceipts] = useState(initialReceipts);
  const [incomeByMonth, setIncomeByMonth] = useState({});
  const [incomeMonthKey, setIncomeMonthKey] = useState(getMonthKey());
  const [storeName, setStoreName] = useState('');
  const [amountText, setAmountText] = useState('');
  const [receiptCurrency, setReceiptCurrency] = useState(getDeviceCurrency);
  const [subtotalText, setSubtotalText] = useState('');
  const [taxText, setTaxText] = useState('');
  const [receiptDateText, setReceiptDateText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('grocery');
  const [customCategoryText, setCustomCategoryText] = useState('');
  const [receiptKind, setReceiptKind] = useState('expense');
  const [receiptImportant, setReceiptImportant] = useState(false);
  const [receiptWarrantyText, setReceiptWarrantyText] = useState('');
  const [receiptNoteText, setReceiptNoteText] = useState('');
  const [receiptNoteOpen, setReceiptNoteOpen] = useState(false);
  const [receiptDetailsOpen, setReceiptDetailsOpen] = useState(false);
  const [receiptNumberText, setReceiptNumberText] = useState('');
  const [receiptImage, setReceiptImage] = useState(null);
  const [receiptFile, setReceiptFile] = useState(null);
  const [analysisStatus, setAnalysisStatus] = useState('idle');
  const [analysisConfidence, setAnalysisConfidence] = useState(null);
  const [receiptItems, setReceiptItems] = useState([]);
  const [photoOptionsOpen, setPhotoOptionsOpen] = useState(false);
  const [pendingPhotoAction, setPendingPhotoAction] = useState(null);
  const [customCameraOpen, setCustomCameraOpen] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [detailReturnScreen, setDetailReturnScreen] = useState('report');
  const [editingReceipt, setEditingReceipt] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const [editStoreName, setEditStoreName] = useState('');
  const [editAmountText, setEditAmountText] = useState('');
  const [editDateText, setEditDateText] = useState('');
  const [editCategory, setEditCategory] = useState('grocery');
  const [editCustomCategoryText, setEditCustomCategoryText] = useState('');
  const [editReceiptKind, setEditReceiptKind] = useState('expense');
  const [editReceiptImportant, setEditReceiptImportant] = useState(false);
  const [editWarrantyText, setEditWarrantyText] = useState('');
  const [editNoteText, setEditNoteText] = useState('');
  const [editItems, setEditItems] = useState([]);
  const [selectedLanguage, setSelectedLanguage] = useState(getDeviceLanguage);
  const [selectedCurrency, setSelectedCurrency] = useState(getDeviceCurrency);
  const [analysisUsageByMonth, setAnalysisUsageByMonth] = useState({});
  const [rewardedAnalysisCreditsByMonth, setRewardedAnalysisCreditsByMonth] = useState({});
  const [categoryMemory, setCategoryMemory] = useState({});
  const [budgetsByCategory, setBudgetsByCategory] = useState({});
  const [recurringExpenses, setRecurringExpenses] = useState([]);
  const [otherCategoryLabel, setOtherCategoryLabel] = useState('');
  const [receiptSettings, setReceiptSettings] = useState(DEFAULT_RECEIPT_SETTINGS);
  const [activeSpace, setActiveSpace] = useState(DEFAULT_SPACE_KEY);
  const [settingsSection, setSettingsSection] = useState('main');
  const [authProvider, setAuthProvider] = useState(null);
  const [reportPeriod, setReportPeriod] = useState('month');
  const [reportView, setReportView] = useState('overview');
  const [reportSearchText, setReportSearchText] = useState('');
  const [productPeriod, setProductPeriod] = useState('month');
  const [productMonthKey, setProductMonthKey] = useState(getMonthKey());
  const [homeRecurringOpen, setHomeRecurringOpen] = useState(false);
  const [selectedMerchantKey, setSelectedMerchantKey] = useState(null);
  const [selectedReportCategoryKey, setSelectedReportCategoryKey] = useState(null);
  const [selectedMonthlyReceiptKey, setSelectedMonthlyReceiptKey] = useState(null);
  const [openSwipeReceiptId, setOpenSwipeReceiptId] = useState(null);
  const [storageReady, setStorageReady] = useState(false);

  useEffect(() => {
    async function loadSavedData() {
      try {
        const [
          savedReceipts,
          savedSalary,
          savedIncomeByMonth,
          savedCurrency,
          savedAuthProvider,
          savedAnalysisUsage,
          savedRewardedAnalysisCredits,
          savedCategoryMemory,
          savedBudgets,
          savedRecurringExpenses,
          savedActiveSpace,
          savedOtherCategoryLabel,
          savedReceiptSettings,
        ] = await Promise.all([
          AsyncStorage.getItem(RECEIPTS_STORAGE_KEY),
          AsyncStorage.getItem(SALARY_STORAGE_KEY),
          AsyncStorage.getItem(INCOME_BY_MONTH_STORAGE_KEY),
          AsyncStorage.getItem(CURRENCY_STORAGE_KEY),
          AsyncStorage.getItem(AUTH_PROVIDER_STORAGE_KEY),
          AsyncStorage.getItem(ANALYSIS_USAGE_STORAGE_KEY),
          AsyncStorage.getItem(REWARDED_ANALYSIS_CREDITS_STORAGE_KEY),
          AsyncStorage.getItem(CATEGORY_MEMORY_STORAGE_KEY),
          AsyncStorage.getItem(BUDGETS_STORAGE_KEY),
          AsyncStorage.getItem(RECURRING_EXPENSES_STORAGE_KEY),
          AsyncStorage.getItem(ACTIVE_SPACE_STORAGE_KEY),
          AsyncStorage.getItem(OTHER_CATEGORY_LABEL_STORAGE_KEY),
          AsyncStorage.getItem(RECEIPT_SETTINGS_STORAGE_KEY),
        ]);

        const startupCurrency =
          savedCurrency && currencies.some((currency) => currency.code === savedCurrency)
            ? savedCurrency
            : getDeviceCurrency();
        activeCurrency = startupCurrency;

        const parsedReceipts = safeParseStoredJson(savedReceipts, null);
        if (Array.isArray(parsedReceipts)) {
          const cleanReceipts = parsedReceipts
            .filter(isValidReceiptRecord)
            .filter((receipt) => !isSeedReceipt(receipt))
            .map((receipt) => normalizeReceiptCategories(receipt, startupCurrency))
            .filter(Boolean);
          setReceipts(cleanReceipts);
        }

        const parsedIncome = safeParseStoredJson(savedIncomeByMonth, null);
        if (parsedIncome && typeof parsedIncome === 'object' && !Array.isArray(parsedIncome)) {
          setIncomeByMonth(parsedIncome);
        } else if (savedSalary) {
          setIncomeByMonth({ [getMonthKey()]: savedSalary });
        }

        setSelectedLanguage(getDeviceLanguage());

        setSelectedCurrency(startupCurrency);

        if (savedAuthProvider === 'apple' || savedAuthProvider === 'google') {
          setAuthProvider(savedAuthProvider);
        }

        const parsedAnalysisUsage = safeParseStoredJson(savedAnalysisUsage, null);
        if (parsedAnalysisUsage && typeof parsedAnalysisUsage === 'object' && !Array.isArray(parsedAnalysisUsage)) {
          setAnalysisUsageByMonth(parsedAnalysisUsage);
        }

        const parsedRewardedAnalysisCredits = safeParseStoredJson(savedRewardedAnalysisCredits, null);
        if (
          parsedRewardedAnalysisCredits &&
          typeof parsedRewardedAnalysisCredits === 'object' &&
          !Array.isArray(parsedRewardedAnalysisCredits)
        ) {
          setRewardedAnalysisCreditsByMonth(parsedRewardedAnalysisCredits);
        }

        const parsedCategoryMemory = safeParseStoredJson(savedCategoryMemory, null);
        if (parsedCategoryMemory && typeof parsedCategoryMemory === 'object' && !Array.isArray(parsedCategoryMemory)) {
          setCategoryMemory(parsedCategoryMemory);
        }

        const parsedBudgets = safeParseStoredJson(savedBudgets, null);
        if (parsedBudgets && typeof parsedBudgets === 'object' && !Array.isArray(parsedBudgets)) {
          setBudgetsByCategory(parsedBudgets);
        }

        const parsedRecurringExpenses = safeParseStoredJson(savedRecurringExpenses, null);
        if (Array.isArray(parsedRecurringExpenses)) {
          setRecurringExpenses(parsedRecurringExpenses);
        }

        if (savedActiveSpace) {
          setActiveSpace(normalizeSpaceKey(savedActiveSpace));
        }

        if (savedOtherCategoryLabel) {
          setOtherCategoryLabel(savedOtherCategoryLabel);
        }

        const parsedReceiptSettings = safeParseStoredJson(savedReceiptSettings, null);
        if (parsedReceiptSettings && typeof parsedReceiptSettings === 'object' && !Array.isArray(parsedReceiptSettings)) {
          setReceiptSettings({
            ...DEFAULT_RECEIPT_SETTINGS,
            ...parsedReceiptSettings,
            defaultCategory: normalizeCategoryKey(parsedReceiptSettings.defaultCategory || DEFAULT_RECEIPT_SETTINGS.defaultCategory),
          });
        }
      } catch (error) {
        console.warn('Saved app data could not be loaded:', error);
      } finally {
        setStorageReady(true);
      }
    }

    loadSavedData();
  }, []);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        setSelectedLanguage(getDeviceLanguage());
      }
    });

    return () => subscription.remove();
  }, []);

  useEffect(() => {
    if (photoOptionsOpen || !pendingPhotoAction) {
      return undefined;
    }

    const timer = setTimeout(() => {
      const action = pendingPhotoAction;
      setPendingPhotoAction(null);

      if (action === 'camera') {
        takeReceiptPhoto();
      }

      if (action === 'gallery') {
        pickReceiptImage();
      }

      if (action === 'file') {
        pickReceiptFile();
      }
    }, 650);

    return () => clearTimeout(timer);
  }, [photoOptionsOpen, pendingPhotoAction]);

  useEffect(() => {
    if (!storageReady) {
      return;
    }

    if (authProvider === 'apple' || authProvider === 'google') {
      AsyncStorage.setItem(AUTH_PROVIDER_STORAGE_KEY, authProvider).catch(() => {
        console.warn('Auth provider could not be saved.');
      });
    } else {
      AsyncStorage.removeItem(AUTH_PROVIDER_STORAGE_KEY).catch(() => {
        console.warn('Auth provider could not be removed.');
      });
    }
  }, [authProvider, storageReady]);

  useEffect(() => {
    if (!storageReady) {
      return;
    }

    AsyncStorage.setItem(RECEIPTS_STORAGE_KEY, JSON.stringify(receipts)).catch(() => {
      Alert.alert(t.saveError, t.receiptsSaveError);
    });
  }, [receipts, storageReady]);

  useEffect(() => {
    if (!storageReady) {
      return;
    }

    AsyncStorage.setItem(INCOME_BY_MONTH_STORAGE_KEY, JSON.stringify(incomeByMonth)).catch(() => {
      Alert.alert(t.saveError, t.incomeSaveError);
    });
  }, [incomeByMonth, storageReady]);

  useEffect(() => {
    if (!storageReady) {
      return;
    }

    AsyncStorage.setItem(CURRENCY_STORAGE_KEY, selectedCurrency).catch(() => {
      Alert.alert(t.saveError, t.currencySaveError);
    });
  }, [selectedCurrency, storageReady]);

  useEffect(() => {
    if (!storageReady) {
      return;
    }

    AsyncStorage.setItem(RECEIPT_SETTINGS_STORAGE_KEY, JSON.stringify(receiptSettings)).catch(() => {
      console.warn('Receipt settings could not be saved.');
    });
  }, [receiptSettings, storageReady]);

  useEffect(() => {
    if (!storageReady) {
      return;
    }

    AsyncStorage.setItem(CATEGORY_MEMORY_STORAGE_KEY, JSON.stringify(categoryMemory)).catch(() => {
      console.warn('Category memory could not be saved.');
    });
  }, [categoryMemory, storageReady]);

  useEffect(() => {
    if (!storageReady) {
      return;
    }

    AsyncStorage.setItem(ANALYSIS_USAGE_STORAGE_KEY, JSON.stringify(analysisUsageByMonth)).catch(() => {
      console.warn('Analysis usage could not be saved.');
    });
  }, [analysisUsageByMonth, storageReady]);

  useEffect(() => {
    if (!storageReady) {
      return;
    }

    AsyncStorage.setItem(REWARDED_ANALYSIS_CREDITS_STORAGE_KEY, JSON.stringify(rewardedAnalysisCreditsByMonth)).catch(() => {
      console.warn('Rewarded analysis credits could not be saved.');
    });
  }, [rewardedAnalysisCreditsByMonth, storageReady]);

  useEffect(() => {
    if (!storageReady) {
      return;
    }

    AsyncStorage.setItem(BUDGETS_STORAGE_KEY, JSON.stringify(budgetsByCategory)).catch(() => {
      console.warn('Budgets could not be saved.');
    });
  }, [budgetsByCategory, storageReady]);

  useEffect(() => {
    if (!storageReady) {
      return;
    }

    AsyncStorage.setItem(RECURRING_EXPENSES_STORAGE_KEY, JSON.stringify(recurringExpenses)).catch(() => {
      console.warn('Recurring expenses could not be saved.');
    });
  }, [recurringExpenses, storageReady]);

  useEffect(() => {
    if (!storageReady) {
      return;
    }

    AsyncStorage.setItem(ACTIVE_SPACE_STORAGE_KEY, activeSpace).catch(() => {
      console.warn('Active space could not be saved.');
    });
  }, [activeSpace, storageReady]);

  useEffect(() => {
    if (!storageReady) {
      return;
    }

    const cleanLabel = otherCategoryLabel.trim();

    if (cleanLabel) {
      AsyncStorage.setItem(OTHER_CATEGORY_LABEL_STORAGE_KEY, cleanLabel).catch(() => {
        console.warn('Other category label could not be saved.');
      });
    } else {
      AsyncStorage.removeItem(OTHER_CATEGORY_LABEL_STORAGE_KEY).catch(() => {
        console.warn('Other category label could not be removed.');
      });
    }
  }, [otherCategoryLabel, storageReady]);

  const salaryText = incomeByMonth[incomeMonthKey] || '';
  const salary = parseAmount(salaryText);
  const visibleReceipts = useMemo(
    () => receipts.filter((receipt) => normalizeSpaceKey(receipt.space) === activeSpace),
    [receipts, activeSpace]
  );
  const selectedMonthRecurringReceipts = useMemo(
    () => buildRecurringReceiptsForMonth(recurringExpenses, incomeMonthKey, activeSpace, selectedCurrency),
    [recurringExpenses, incomeMonthKey, activeSpace, selectedCurrency]
  );
  const selectedMonthReceipts = useMemo(
    () => [
      ...filterReceiptsByMonthKey(visibleReceipts, incomeMonthKey),
      ...selectedMonthRecurringReceipts,
    ],
    [visibleReceipts, incomeMonthKey, selectedMonthRecurringReceipts]
  );
  const selectedMonthSpend = useMemo(
    () => selectedMonthReceipts.reduce((sum, receipt) => sum + getReceiptSignedAmount(receipt), 0),
    [selectedMonthReceipts]
  );
  const totalIncomeUntilSelectedMonth = useMemo(
    () => getIncomeTotalUntilMonth(incomeByMonth, incomeMonthKey),
    [incomeByMonth, incomeMonthKey]
  );
  const totalSpendUntilSelectedMonth = useMemo(
    () =>
      getReceiptTotalUntilMonth(visibleReceipts, incomeMonthKey) +
      getRecurringTotalUntilMonth(recurringExpenses, activeSpace, incomeMonthKey, selectedCurrency),
    [visibleReceipts, incomeMonthKey, recurringExpenses, activeSpace, selectedCurrency]
  );
  const remaining = totalIncomeUntilSelectedMonth - totalSpendUntilSelectedMonth;
  const categories = useMemo(
    () => buildCategorySummary(selectedMonthReceipts),
    [selectedMonthReceipts]
  );

  const topCategory = useMemo(() => {
    return categories.reduce(
      (top, category) => (category.amount > top.amount ? category : top),
      categories[0]
    );
  }, [categories]);

  const baseTranslations = getAppTranslations(selectedLanguage);
  const t = useMemo(() => {
    const cleanOtherLabel = otherCategoryLabel.trim();

    if (!cleanOtherLabel) {
      return baseTranslations;
    }

    return {
      ...baseTranslations,
      categories: {
        ...baseTranslations.categories,
        other: cleanOtherLabel,
      },
    };
  }, [baseTranslations, otherCategoryLabel]);

  useEffect(() => {
    if (reportPeriod === 'week') {
      setReportPeriod('month');
    }
  }, [reportPeriod]);

  activeCurrency = selectedCurrency;
  const currentAnalysisMonthKey = getMonthKey();
  const monthlyAnalysisUsage = Number(analysisUsageByMonth[currentAnalysisMonthKey]) || 0;
  const monthlyRewardedCredits = Number(rewardedAnalysisCreditsByMonth[currentAnalysisMonthKey]) || 0;
  const monthlyAnalysisAllowance = FREE_MONTHLY_ANALYSIS_LIMIT + Math.max(0, monthlyRewardedCredits);
  const isPremium = !ENABLE_PREMIUM_PAYWALL;
  const canUseReceiptAnalysis = isPremium || monthlyAnalysisUsage < monthlyAnalysisAllowance;
  const freeUsageText = t.freeUsageText(
    Math.min(monthlyAnalysisUsage, monthlyAnalysisAllowance),
    monthlyAnalysisAllowance
  );
  const reportVisibleReceipts = useMemo(
    () => [
      ...visibleReceipts,
      ...buildRecurringReceiptsForMonth(recurringExpenses, getMonthKey(), activeSpace, selectedCurrency),
    ],
    [visibleReceipts, recurringExpenses, activeSpace, selectedCurrency]
  );
  const sortedReceipts = useMemo(
    () => [...reportVisibleReceipts].sort((first, second) => getReceiptTime(second) - getReceiptTime(first)),
    [reportVisibleReceipts]
  );
  const recentReceipts = useMemo(
    () =>
      visibleReceipts
        .filter((receipt) => !receipt.isRecurring)
        .sort((first, second) => getReceiptAddedTime(second) - getReceiptAddedTime(first))
        .slice(0, 3),
    [visibleReceipts]
  );
  const merchantGroups = useMemo(() => getMerchantGroups(selectedMonthReceipts), [selectedMonthReceipts]);
  const productMonthOptions = useMemo(() => getReceiptProductMonthOptions(visibleReceipts), [visibleReceipts]);
  const productReceipts = useMemo(() => {
    if (productPeriod === 'year') {
      return filterReceiptsByYear(visibleReceipts);
    }

    if (productPeriod === 'all') {
      return visibleReceipts;
    }

    return filterReceiptsByMonthKey(visibleReceipts, productMonthKey);
  }, [visibleReceipts, productPeriod, productMonthKey]);
  const productGroups = useMemo(() => getProductGroups(productReceipts), [productReceipts]);
  const monthlyReceiptGroups = useMemo(
    () => buildMonthlyReceiptGroups(visibleReceipts, recurringExpenses, activeSpace, selectedCurrency),
    [visibleReceipts, recurringExpenses, activeSpace, selectedCurrency]
  );
  const selectedMonthlyReceiptGroup = useMemo(
    () => monthlyReceiptGroups.find((group) => group.key === selectedMonthlyReceiptKey) || null,
    [monthlyReceiptGroups, selectedMonthlyReceiptKey]
  );
  const budgetSummary = useMemo(
    () => getBudgetSummary(categories, budgetsByCategory),
    [categories, budgetsByCategory]
  );
  const isReceiptComposerActive =
    Boolean(receiptImage) ||
    Boolean(receiptFile) ||
    Boolean(storeName.trim()) ||
    Boolean(amountText.trim()) ||
    receiptItems.length > 0 ||
    analysisStatus === 'analyzing' ||
    analysisStatus === 'done';
  const recurringMonthlyTotal = useMemo(
    () => getRecurringMonthlyTotal(recurringExpenses, activeSpace, incomeMonthKey),
    [recurringExpenses, activeSpace, incomeMonthKey]
  );
  const reportReceipts = useMemo(
    () => searchReceipts(filterReceiptsByPeriod(sortedReceipts, reportPeriod), reportSearchText),
    [sortedReceipts, reportPeriod, reportSearchText]
  );
  const reportTotalSpend = useMemo(
    () => reportReceipts.reduce((sum, receipt) => sum + getReceiptSignedAmount(receipt), 0),
    [reportReceipts]
  );
  const reportIncomeTotal = useMemo(() => {
    if (reportPeriod === 'all') {
      return getIncomeTotalUntilMonth(incomeByMonth, getMonthKey());
    }

    return parseAmount(incomeByMonth[getMonthKey()] || '');
  }, [incomeByMonth, reportPeriod]);
  const reportBalance = reportIncomeTotal - reportTotalSpend;
  const reportCategories = useMemo(
    () => buildCategorySummary(reportReceipts),
    [reportReceipts]
  );
  const reportTopCategory = useMemo(
    () =>
      reportCategories.reduce(
        (top, category) => (category.amount > top.amount ? category : top),
        reportCategories[0]
      ),
    [reportCategories]
  );
  const reportMerchantGroups = useMemo(() => getMerchantGroups(reportReceipts), [reportReceipts]);
  const selectedMerchantGroup = useMemo(
    () => reportMerchantGroups.find((merchant) => merchant.key === selectedMerchantKey) || null,
    [reportMerchantGroups, selectedMerchantKey]
  );
  const selectedReportCategory = useMemo(
    () => reportCategories.find((category) => category.key === selectedReportCategoryKey) || null,
    [reportCategories, selectedReportCategoryKey]
  );
  const selectedReportCategoryReceipts = useMemo(
    () =>
      selectedReportCategoryKey
        ? reportReceipts.filter((receipt) => normalizeCategoryKey(receipt.category) === selectedReportCategoryKey)
        : [],
    [reportReceipts, selectedReportCategoryKey]
  );

  function updateReportPeriod(period) {
    setReportPeriod(period);
    setSelectedMerchantKey(null);
    setSelectedReportCategoryKey(null);
  }

  function updateReportView(view) {
    setReportView(view);
    setReportSearchText('');
    setSelectedMerchantKey(null);
    setSelectedReportCategoryKey(null);
  }

  function updateReportSearchText(value) {
    setReportSearchText(value);
    setSelectedMerchantKey(null);
    setSelectedReportCategoryKey(null);
  }

  function selectReportMerchant(merchant) {
    setSelectedMerchantKey(merchant.key);
    setReportSearchText('');
    setSelectedReportCategoryKey(null);
  }

  function updateMonthlyIncome(value) {
    setIncomeByMonth((currentIncome) => ({
      ...currentIncome,
      [incomeMonthKey]: value,
    }));
  }

  function navigateToScreen(nextScreen) {
    if (screen === 'settings' && nextScreen !== 'settings') {
      setSettingsSection('main');
    }

    if (screen === 'home' && nextScreen !== 'home') {
      setHomeRecurringOpen(false);
      setPhotoOptionsOpen(false);
    }

    if (screen === 'monthly' && nextScreen !== 'monthly') {
      setSelectedMonthlyReceiptKey(null);
    }

    setScreen(nextScreen);
  }

  function goBack() {
    if (previewImage) {
      setPreviewImage(null);
      return;
    }

    if (screen === 'settings' && settingsSection !== 'main') {
      setSettingsSection('main');
      return;
    }

    if (screen === 'report' && selectedMerchantKey) {
      setSelectedMerchantKey(null);
      return;
    }

    if (screen === 'report' && selectedReportCategoryKey) {
      setSelectedReportCategoryKey(null);
      return;
    }

    if (screen === 'report' && reportView === 'merchants') {
      setReportView('overview');
      return;
    }

    if (screen === 'report' && reportSearchText.trim()) {
      setReportSearchText('');
      return;
    }

    if (screen === 'monthly' && selectedMonthlyReceiptKey) {
      setSelectedMonthlyReceiptKey(null);
      return;
    }

    if (screen === 'home' && homeRecurringOpen) {
      setHomeRecurringOpen(false);
      return;
    }

    if (screen === 'home' && photoOptionsOpen) {
      setPhotoOptionsOpen(false);
      return;
    }

    if (screen === 'detail') {
      setEditingReceipt(false);
      setScreen(detailReturnScreen);
      return;
    }
  }

  const swipeResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gestureState) => {
          const swipingRight = gestureState.dx > 22;
          const verticalMove = Math.abs(gestureState.dy) > 18;

          return swipingRight && !verticalMove;
        },
        onPanResponderRelease: (_, gestureState) => {
          const longRightSwipe = gestureState.dx > 88;
          const intentionalSwipe = gestureState.vx > 0.12;

          if (longRightSwipe && intentionalSwipe) {
            goBack();
          }
        },
      }),
    [screen, settingsSection, previewImage, reportSearchText, reportView, selectedMerchantKey, selectedMonthlyReceiptKey, homeRecurringOpen, photoOptionsOpen, detailReturnScreen]
  );
  const canShowBackControl =
    !previewImage &&
    ((screen === 'settings' && settingsSection !== 'main') ||
      (screen === 'report' && Boolean(selectedMerchantKey)) ||
      (screen === 'report' && Boolean(selectedReportCategoryKey)) ||
      (screen === 'report' && reportView === 'merchants') ||
      (screen === 'report' && Boolean(reportSearchText.trim())) ||
      (screen === 'monthly' && Boolean(selectedMonthlyReceiptKey)) ||
      (screen === 'home' && homeRecurringOpen) ||
      (screen === 'home' && photoOptionsOpen) ||
      screen === 'detail');

  const scrollResetKey = [
    screen,
    settingsSection,
    reportView,
    reportPeriod,
    productPeriod,
    productMonthKey,
    selectedMerchantKey || '',
    selectedReportCategoryKey || '',
    selectedMonthlyReceiptKey || '',
    homeRecurringOpen ? 'home-recurring' : '',
    selectedReceipt?.id || '',
    isReceiptComposerActive ? 'receipt-composer' : 'main-content',
  ].join('|');

  useEffect(() => {
    requestAnimationFrame(() => {
      mainScrollRef.current?.scrollTo({ y: 0, animated: false });
    });
  }, [scrollResetKey]);

  useEffect(() => {
    setOpenSwipeReceiptId(null);
  }, [scrollResetKey]);

  function openReceiptDetail(receipt) {
    const normalizedReceipt = normalizeReceiptCategories(receipt);
    setDetailReturnScreen(screen === 'detail' ? detailReturnScreen : screen);
    setSelectedReceipt(normalizedReceipt);
    setEditingReceipt(false);
    setEditStoreName(normalizedReceipt.store);
    setEditAmountText(String(normalizedReceipt.amount).replace('.', ','));
    setEditDateText(normalizeDateDisplay(normalizedReceipt.date, normalizedReceipt.createdAt));
    setEditCategory(isCustomCategory(normalizedReceipt.category) ? 'other' : normalizedReceipt.category);
    setEditCustomCategoryText(getCustomCategoryText(normalizedReceipt.category));
    setEditReceiptKind(normalizeReceiptKind(normalizedReceipt.kind));
    setEditReceiptImportant(Boolean(normalizedReceipt.important));
    setEditWarrantyText(normalizedReceipt.warrantyUntil || '');
    setEditNoteText(normalizedReceipt.note || '');
    setEditItems(createEditableItems(normalizedReceipt));
    setScreen('detail');
  }

  function startEditSelectedReceipt() {
    if (!selectedReceipt) {
      return;
    }

    setEditStoreName(selectedReceipt.store);
    setEditAmountText(String(selectedReceipt.amount).replace('.', ','));
    setEditDateText(normalizeDateDisplay(selectedReceipt.date, selectedReceipt.createdAt));
    setEditCategory(isCustomCategory(selectedReceipt.category) ? 'other' : normalizeCategoryKey(selectedReceipt.category));
    setEditCustomCategoryText(getCustomCategoryText(selectedReceipt.category));
    setEditReceiptKind(normalizeReceiptKind(selectedReceipt.kind));
    setEditReceiptImportant(Boolean(selectedReceipt.important));
    setEditWarrantyText(selectedReceipt.warrantyUntil || '');
    setEditNoteText(selectedReceipt.note || '');
    setEditItems(createEditableItems(selectedReceipt));
    setEditingReceipt(true);
  }

  function cancelEditSelectedReceipt() {
    if (selectedReceipt) {
      setEditItems(createEditableItems(selectedReceipt));
      setEditDateText(normalizeDateDisplay(selectedReceipt.date, selectedReceipt.createdAt));
    }
    setEditingReceipt(false);
  }

  function updateEditItem(itemId, field, value) {
    setEditItems((currentItems) =>
      currentItems.map((item) => (item.id === itemId ? { ...item, [field]: value } : item))
    );
  }

  function addEditItem() {
    setEditItems((currentItems) => [
      ...currentItems,
      {
        id: `${Date.now()}-${currentItems.length}`,
        name: '',
        amountText: '',
        quantityText: '1',
        unit: '',
        category: normalizeCategoryKey(editCategory),
      },
    ]);
  }

  function removeEditItem(itemId) {
    setEditItems((currentItems) => currentItems.filter((item) => item.id !== itemId));
  }

  function setTotalFromEditItems() {
    const total = getItemsTotal(editItems);

    if (total > 0) {
      setEditAmountText(String(Number(total.toFixed(2))).replace('.', ','));
    }
  }

  function saveEditedReceipt() {
    if (!selectedReceipt) {
      return;
    }

    const amount = parseAmount(editAmountText);
    const cleanStoreName = editStoreName.trim();
    const categoryForSave =
      editCategory === 'other' && editCustomCategoryText.trim()
        ? makeCustomCategoryKey(editCustomCategoryText)
        : normalizeCategoryKey(editCategory);

    if (!cleanStoreName) {
      Alert.alert(t.missingInfo, t.enterStore);
      return;
    }

    if (amount <= 0) {
      Alert.alert(t.missingInfo, t.enterAmount);
      return;
    }

    const editedItemsForSave = cleanEditableItems(editItems, categoryForSave);
    const updatedReceipt = {
      ...selectedReceipt,
      store: cleanStoreName,
      amount: normalizeReceiptAmount(amount, editedItemsForSave),
      currency: selectedCurrency,
      originalAmount: normalizeReceiptAmount(amount, editedItemsForSave),
      originalCurrency: selectedCurrency,
      exchangeRate: 1,
      date: editDateText.trim() || formatReceiptDate(selectedReceipt.createdAt),
      category: categoryForSave,
      kind: normalizeReceiptKind(editReceiptKind),
      important: editReceiptImportant,
      warrantyUntil: normalizeDateDisplay(editWarrantyText),
      note: editNoteText.trim(),
      space: normalizeSpaceKey(selectedReceipt.space || activeSpace),
      items: editedItemsForSave,
    };

    setReceipts((currentReceipts) =>
      currentReceipts.map((receipt) =>
        receipt.id === selectedReceipt.id ? updatedReceipt : receipt
      )
    );
    const learnedCategories = buildCategoryMemoryFromItems(editItems);
    if (Object.keys(learnedCategories).length > 0) {
      setCategoryMemory((currentMemory) => ({
        ...currentMemory,
        ...learnedCategories,
      }));
    }
    setSelectedReceipt(updatedReceipt);
    setEditingReceipt(false);
  }

  function requestDeleteReceipt(receiptToDelete, options = {}) {
    if (!receiptToDelete || receiptToDelete.isRecurring) {
      return;
    }

    Alert.alert(t.deleteTitle, t.deleteMessage, [
      { text: t.cancel, style: 'cancel' },
      {
        text: t.deleteConfirm,
        style: 'destructive',
        onPress: async () => {
          setReceipts((currentReceipts) =>
            currentReceipts.filter((receipt) => receipt.id !== receiptToDelete.id)
          );
          await deleteReceiptImage(receiptToDelete.image);
          await deleteReceiptFile(receiptToDelete.file);
          if (selectedReceipt?.id === receiptToDelete.id) {
            setSelectedReceipt(null);
            setEditingReceipt(false);
            if (options.returnToDetailScreen !== false) {
              setScreen(detailReturnScreen);
            }
          }
        },
      },
    ]);
  }

  function deleteSelectedReceipt() {
    requestDeleteReceipt(selectedReceipt);
  }

  async function openReceiptFile(fileRecord) {
    const fileUri = typeof fileRecord === 'string' ? fileRecord : fileRecord?.uri;
    const fileName = typeof fileRecord === 'string' ? 'receipt.pdf' : fileRecord?.name || 'receipt.pdf';
    const mimeType = typeof fileRecord === 'string' ? 'application/pdf' : fileRecord?.mimeType || 'application/pdf';

    if (!fileUri) {
      Alert.alert(t.openFileErrorTitle, t.openFileErrorText);
      return;
    }

    try {
      const fileInfo = await FileSystem.getInfoAsync(fileUri);

      if (!fileInfo.exists) {
        Alert.alert(t.openFileErrorTitle, t.openFileErrorText);
        return;
      }

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType,
          dialogTitle: fileName,
          UTI: 'com.adobe.pdf',
        });
        return;
      }

      const canOpen = await Linking.canOpenURL(fileUri);
      if (canOpen) {
        await Linking.openURL(fileUri);
        return;
      }

      Alert.alert(t.openFileErrorTitle, t.openFileErrorText);
    } catch (error) {
      console.warn('Receipt file open failed:', error);
      Alert.alert(t.openFileErrorTitle, t.openFileErrorText);
    }
  }

  async function createDataBackup() {
    try {
      await ensureDirectory(BACKUP_DIR);

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const fileName = `reciro-backup-${timestamp}.json`;
      const targetUri = `${BACKUP_DIR}${fileName}`;
      const backupData = {
        version: 1,
        createdAt: Date.now(),
        receipts,
        incomeByMonth,
        selectedCurrency,
        categoryMemory,
        budgetsByCategory,
        recurringExpenses,
        activeSpace,
        otherCategoryLabel,
        receiptSettings,
      };

      await FileSystem.writeAsStringAsync(targetUri, JSON.stringify(backupData, null, 2));
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(targetUri, {
          mimeType: 'application/json',
          dialogTitle: t.backupReady,
          UTI: 'public.json',
        });
      } else {
        Alert.alert(t.backupReady, t.backupReadyText(fileName));
      }
    } catch (error) {
      Alert.alert(t.backupError, t.backupErrorText);
    }
  }

  async function restoreLatestBackup() {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        copyToCacheDirectory: true,
        multiple: false,
        type: '*/*',
      });

      if (result.canceled) {
        return;
      }

      const latestBackupUri = result.assets?.[0]?.uri;

      if (!latestBackupUri) {
        Alert.alert(t.noBackupTitle, t.noBackupText);
        return;
      }

      const backupText = await FileSystem.readAsStringAsync(latestBackupUri);
      const backupData = JSON.parse(backupText);

      setReceipts(Array.isArray(backupData.receipts) ? backupData.receipts.map(normalizeReceiptCategories) : []);
      setIncomeByMonth(
        backupData.incomeByMonth && typeof backupData.incomeByMonth === 'object'
          ? backupData.incomeByMonth
          : {}
      );

      setSelectedLanguage(getDeviceLanguage());

      if (currencies.some((currency) => currency.code === backupData.selectedCurrency)) {
        setSelectedCurrency(backupData.selectedCurrency);
      }

      setCategoryMemory(
        backupData.categoryMemory && typeof backupData.categoryMemory === 'object'
          ? backupData.categoryMemory
          : {}
      );
      setBudgetsByCategory(
        backupData.budgetsByCategory && typeof backupData.budgetsByCategory === 'object'
          ? backupData.budgetsByCategory
          : {}
      );
      setRecurringExpenses(Array.isArray(backupData.recurringExpenses) ? backupData.recurringExpenses : []);
      setActiveSpace(normalizeSpaceKey(backupData.activeSpace));
      setOtherCategoryLabel(String(backupData.otherCategoryLabel || '').trim());
      setReceiptSettings({
        ...DEFAULT_RECEIPT_SETTINGS,
        ...(backupData.receiptSettings && typeof backupData.receiptSettings === 'object' ? backupData.receiptSettings : {}),
      });

      setSelectedReceipt(null);
      setSettingsSection('main');
      setDetailReturnScreen('report');
      setScreen('home');
      Alert.alert(t.backupRestored, t.backupRestoredText);
    } catch (error) {
      Alert.alert(t.backupError, t.backupErrorText);
    }
  }

  async function exportReceiptsCsv() {
    try {
      await ensureDirectory(EXPORT_DIR);

      const timestamp = new Date().toISOString().slice(0, 10);
      const fileName = `reciro-receipts-${timestamp}.csv`;
      const targetUri = `${EXPORT_DIR}${fileName}`;
      await FileSystem.writeAsStringAsync(targetUri, buildReceiptsCsv(receipts));

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(targetUri, {
          mimeType: 'text/csv',
          dialogTitle: t.exportReady,
          UTI: 'public.comma-separated-values-text',
        });
      } else {
        Alert.alert(t.exportReady, fileName);
      }
    } catch (error) {
      console.warn('CSV export failed.', error);
      Alert.alert(t.exportError, t.exportErrorText);
    }
  }

  function updateReceiptSettings(nextValues) {
    setReceiptSettings((currentSettings) => ({
      ...currentSettings,
      ...nextValues,
      defaultCategory: normalizeCategoryKey(nextValues.defaultCategory || currentSettings.defaultCategory),
    }));
  }

  function chooseAuthProvider(provider) {
    setAuthProvider(provider);
    setSettingsSection('main');
    setScreen('home');
  }

  function signOutAuthProvider() {
    Alert.alert(t.signOutTitle, t.signOutMessage, [
      { text: t.cancel, style: 'cancel' },
      {
        text: t.signOutConfirm,
        style: 'destructive',
        onPress: () => {
          setAuthProvider(null);
          setSettingsSection('main');
          setScreen('home');
        },
      },
    ]);
  }

  function clearAllData() {
    Alert.alert(t.clearAllDataTitle, t.clearAllDataText, [
      { text: t.cancel, style: 'cancel' },
      {
        text: t.clearAllDataConfirm,
        style: 'destructive',
        onPress: async () => {
          await AsyncStorage.multiRemove([
            RECEIPTS_STORAGE_KEY,
            SALARY_STORAGE_KEY,
            INCOME_BY_MONTH_STORAGE_KEY,
            AUTH_PROVIDER_STORAGE_KEY,
            ANALYSIS_USAGE_STORAGE_KEY,
            CATEGORY_MEMORY_STORAGE_KEY,
            BUDGETS_STORAGE_KEY,
            RECURRING_EXPENSES_STORAGE_KEY,
            ACTIVE_SPACE_STORAGE_KEY,
            OTHER_CATEGORY_LABEL_STORAGE_KEY,
            RECEIPT_SETTINGS_STORAGE_KEY,
          ]);
          setReceipts([]);
          setIncomeByMonth({});
          setAnalysisUsageByMonth({});
          setCategoryMemory({});
          setBudgetsByCategory({});
          setRecurringExpenses([]);
          setOtherCategoryLabel('');
          setReceiptSettings(DEFAULT_RECEIPT_SETTINGS);
          setAuthProvider(null);
          setActiveSpace(DEFAULT_SPACE_KEY);
          setSelectedReceipt(null);
          setSettingsSection('main');
          setScreen('home');
          await deleteDirectoryIfExists(RECEIPT_IMAGE_DIR);
          await deleteDirectoryIfExists(RECEIPT_FILE_DIR);
          Alert.alert(t.dataDeletedTitle, t.dataDeletedText);
        },
      },
    ]);
  }

  function resetReceiptForm() {
    setStoreName('');
    setAmountText('');
    setReceiptCurrency(selectedCurrency);
    setSubtotalText('');
    setTaxText('');
    setReceiptDateText('');
    setSelectedCategory(normalizeCategoryKey(receiptSettings.defaultCategory));
    setCustomCategoryText('');
    setReceiptKind('expense');
    setReceiptImportant(false);
    setReceiptWarrantyText('');
    setReceiptNoteText('');
    setReceiptNoteOpen(false);
    setReceiptDetailsOpen(false);
    setReceiptNumberText('');
    setReceiptImage(null);
    setReceiptFile(null);
    setReceiptItems([]);
    setAnalysisConfidence(null);
    setAnalysisStatus('idle');
    setPhotoOptionsOpen(false);
    setPendingPhotoAction(null);
  }

  function showAnalysisLimitAlert() {
    Alert.alert(t.freeLimitTitle, t.freeLimitText(FREE_MONTHLY_ANALYSIS_LIMIT), [
      { text: t.cancel, style: 'cancel' },
      {
        text: t.watchAdForScan,
        onPress: watchRewardedAdForScan,
      },
      {
        text: t.viewPremium,
        onPress: () => {
          setPhotoOptionsOpen(false);
          setSettingsSection('premium');
          setScreen('settings');
        },
      },
    ]);
  }

  function addRewardedAnalysisCredit() {
    const monthKey = getMonthKey();
    setRewardedAnalysisCreditsByMonth((currentCredits) => ({
      ...currentCredits,
      [monthKey]: (Number(currentCredits[monthKey]) || 0) + 1,
    }));
    Alert.alert(t.rewardedCreditTitle, t.rewardedCreditText);
  }

  async function watchRewardedAdForScan() {
    setPhotoOptionsOpen(false);

    if (!ENABLE_REWARDED_ADS) {
      Alert.alert(t.rewardedAdSetupTitle, t.rewardedAdSetupText, [
        {
          text: 'OK',
          onPress: addRewardedAnalysisCredit,
        },
      ]);
      return;
    }

    try {
      await showRewardedScanAd();
      addRewardedAnalysisCredit();
    } catch (error) {
      console.warn('Rewarded ad could not be shown.', error);

      if (__DEV__) {
        Alert.alert(t.rewardedAdSetupTitle, t.rewardedAdSetupText, [
          {
            text: 'OK',
            onPress: addRewardedAnalysisCredit,
          },
        ]);
        return;
      }

      Alert.alert(t.rewardedAdSetupTitle, t.rewardedAdSetupText);
    }
  }

  function incrementAnalysisUsage() {
    const monthKey = getMonthKey();
    setAnalysisUsageByMonth((currentUsage) => ({
      ...currentUsage,
      [monthKey]: (Number(currentUsage[monthKey]) || 0) + 1,
    }));
  }

  function updateReceiptItemCategory(itemIndex, categoryKey) {
    setReceiptItems((currentItems) =>
      currentItems.map((item, index) =>
        index === itemIndex
          ? {
              ...(typeof item === 'string' ? { name: item, amount: null } : item),
              category: normalizeCategoryKey(categoryKey),
              quantity: typeof item === 'string' ? 1 : Number(item.quantity) || 1,
              unit: typeof item === 'string' ? '' : String(item.unit || ''),
            }
          : item
      )
    );
  }

  function updateReceiptItem(itemId, field, value) {
    setReceiptItems((currentItems) =>
      currentItems.map((item) => (item.id === itemId ? { ...item, [field]: value } : item))
    );
  }

  function addReceiptItem() {
    const fallbackCategory =
      selectedCategory === 'other' && customCategoryText.trim()
        ? makeCustomCategoryKey(customCategoryText)
        : normalizeCategoryKey(selectedCategory);

    setReceiptItems((currentItems) => [
      ...currentItems,
      {
        id: `${Date.now()}-${currentItems.length}`,
        name: '',
        amountText: '',
        quantityText: '1',
        unit: '',
        category: fallbackCategory,
      },
    ]);
  }

  function removeReceiptItem(itemId) {
    setReceiptItems((currentItems) => currentItems.filter((item) => item.id !== itemId));
  }

  async function pickReceiptImage() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert(t.permissionNeeded, t.galleryPermission);
      setPhotoOptionsOpen(false);
      return;
    }

    let savedImageUri = '';

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: IMAGE_PICKER_MEDIA_TYPES,
        allowsEditing: false,
        quality: 0.85,
      });

      if (!result.canceled && result.assets?.[0]?.uri) {
        const selectedAsset = result.assets[0];
        if (shouldWarnImageQuality(selectedAsset)) {
          const shouldContinue = await confirmAlert(
            t.imageQualityTitle,
            t.imageQualityText,
            t.usePhotoAnyway,
            t.cancel
          );

          if (!shouldContinue) {
            setPhotoOptionsOpen(false);
            return;
          }
        }

        savedImageUri = await saveReceiptImageToDevice(selectedAsset.uri);
        setReceiptImage(savedImageUri);
        setReceiptFile(null);
        setStoreName('');
        setAmountText('');
        setReceiptCurrency(selectedCurrency);
        setSubtotalText('');
        setTaxText('');
        setReceiptDateText(formatReceiptDate(Date.now()));
        setAnalysisConfidence(null);
        setReceiptItems([]);
        setPhotoOptionsOpen(false);
      } else {
        setPhotoOptionsOpen(false);
      }
    } catch (error) {
      console.warn('Gallery receipt photo could not be saved.', error);
      setPhotoOptionsOpen(false);
      Alert.alert(t.photoSaveErrorTitle, t.photoSaveErrorText);
      return;
    }

    if (savedImageUri && receiptSettings.autoAnalyze) {
      await analyzeReceiptImage(savedImageUri);
    } else if (savedImageUri) {
      setAnalysisStatus('ready');
    }
  }

  async function takeReceiptPhoto() {
    try {
      const permission = cameraPermission?.granted ? cameraPermission : await requestCameraPermission();

      if (!permission.granted) {
        Alert.alert(t.permissionNeeded, t.cameraPermission);
        setPhotoOptionsOpen(false);
        return;
      }

      setPhotoOptionsOpen(false);
      setCustomCameraOpen(true);
    } catch (error) {
      console.warn('Camera launch failed.', error);
      setPhotoOptionsOpen(false);
      Alert.alert(t.cameraOpenErrorTitle, t.cameraOpenErrorText);
    }
  }

  async function useCapturedReceiptPhoto(photoUri) {
    let savedImageUri = '';

    try {
      savedImageUri = await saveReceiptImageToDevice(photoUri);
      setReceiptImage(savedImageUri);
      setReceiptFile(null);
      setStoreName('');
      setAmountText('');
      setReceiptCurrency(selectedCurrency);
      setSubtotalText('');
      setTaxText('');
      setReceiptDateText(formatReceiptDate(Date.now()));
      setAnalysisConfidence(null);
      setReceiptItems([]);
      setCustomCameraOpen(false);
    } catch (error) {
      console.warn('Camera receipt photo could not be saved.', error);
      Alert.alert(t.photoSaveErrorTitle, t.photoSaveErrorText);
      return;
    }

    if (savedImageUri && receiptSettings.autoAnalyze) {
      await analyzeReceiptImage(savedImageUri);
    } else if (savedImageUri) {
      setAnalysisStatus('ready');
    }
  }

  async function pickReceiptFile() {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['image/*', 'application/pdf'],
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (result.canceled || !result.assets?.[0]?.uri) {
        setPhotoOptionsOpen(false);
        return;
      }

      const asset = result.assets[0];
      const mimeType = String(asset.mimeType || '').toLowerCase();
      const fileName = asset.name || '';

      if (mimeType.startsWith('image/')) {
        const savedImageUri = await saveReceiptImageToDevice(asset.uri);
        setReceiptImage(savedImageUri);
        setReceiptFile(null);
        setStoreName('');
        setAmountText('');
        setReceiptCurrency(selectedCurrency);
        setSubtotalText('');
        setTaxText('');
        setReceiptDateText(formatReceiptDate(Date.now()));
        setAnalysisConfidence(null);
        setReceiptItems([]);
        setPhotoOptionsOpen(false);
        if (receiptSettings.autoAnalyze) {
          await analyzeReceiptImage(savedImageUri);
        } else {
          setAnalysisStatus('ready');
        }
        return;
      }

      const savedFileUri = await saveReceiptFileToDevice(asset.uri, fileName);
      setReceiptImage(null);
      setReceiptFile({
        uri: savedFileUri,
        name: fileName || 'receipt.pdf',
        mimeType: mimeType || 'application/pdf',
      });
      setStoreName('');
      setAmountText('');
      setReceiptCurrency(selectedCurrency);
      setSubtotalText('');
      setTaxText('');
      setReceiptDateText(formatReceiptDate(Date.now()));
      setAnalysisConfidence(null);
      setReceiptItems([]);
      setPhotoOptionsOpen(false);
      if (receiptSettings.autoAnalyze) {
        await analyzeReceiptFile(savedFileUri, fileName || 'receipt.pdf', mimeType || 'application/pdf');
      } else {
        setAnalysisStatus('ready');
      }
    } catch (error) {
      console.warn('Receipt file selection failed.', error);
      setPhotoOptionsOpen(false);
      Alert.alert(t.photoSaveErrorTitle, t.photoSaveErrorText);
    }
  }

  async function analyzeReceiptImage(imageUri = receiptImage) {
    if (!imageUri) {
      Alert.alert(t.photoNeeded, t.choosePhotoFirst);
      return;
    }

    if (!canUseReceiptAnalysis) {
      setAnalysisStatus('ready');
      showAnalysisLimitAlert();
      return;
    }

    await analyzeReceiptSource({
      analyze: () => analyzeReceiptPhoto(imageUri),
      imageUri,
      sourceFile: null,
    });
  }

  async function analyzeReceiptFile(fileUri, fileName = 'receipt.pdf', mimeType = 'application/pdf') {
    if (!fileUri) {
      Alert.alert(t.photoNeeded, t.choosePhotoFirst);
      return;
    }

    if (!canUseReceiptAnalysis) {
      setAnalysisStatus('ready');
      showAnalysisLimitAlert();
      return;
    }

    await analyzeReceiptSource({
      analyze: () => analyzeReceiptPdf(fileUri, fileName, mimeType),
      imageUri: null,
      sourceFile: {
        uri: fileUri,
        name: fileName || 'receipt.pdf',
        mimeType: mimeType || 'application/pdf',
      },
    });
  }

  async function analyzeReceiptSource({ analyze, imageUri, sourceFile }) {
    setAnalysisStatus('analyzing');

    try {
      const analysisResult = await analyze();

      setStoreName(analysisResult.storeName || '');
      setAmountText(analysisResult.totalText || '');
      setReceiptCurrency(normalizeCurrencyCode(analysisResult.currencyCode, selectedCurrency));
      setSubtotalText(analysisResult.subtotalText || '');
      setTaxText(analysisResult.taxText || '');
      setReceiptDateText(analysisResult.dateText || formatReceiptDate(Date.now()));
      setReceiptNumberText(analysisResult.receiptNumber || '');
      const analyzedCategory = normalizeCategoryKey(analysisResult.categoryKey);
      const editableItems = createEditableItemsFromList(
        applyCategoryMemory(analysisResult.items || [], categoryMemory),
        analyzedCategory
      );
      setSelectedCategory(analyzedCategory);
      setCustomCategoryText('');
      setAnalysisConfidence(analysisResult.confidence ?? null);
      setReceiptItems(editableItems);
      incrementAnalysisUsage();
      setAnalysisStatus('done');

      if (!receiptSettings.reviewBeforeSave) {
        await saveAnalyzedReceiptResult(analysisResult, imageUri, analyzedCategory, editableItems, sourceFile);
      }
    } catch (error) {
      console.warn('Receipt analysis failed.', error);
      setAnalysisStatus('ready');
      if (error.code === 'ANALYSIS_NOT_CONFIGURED') {
        Alert.alert(t.analysisUnavailableTitle, t.analysisUnavailableText);
      } else if (error.code === 'ANALYSIS_TIMEOUT') {
        Alert.alert(t.analysisTimeoutTitle, t.analysisTimeoutText);
      } else if (
        error.code === 'OPENAI_API_KEY_MISSING' ||
        error.code === 'OPENAI_REQUEST_FAILED' ||
        error.code === 'ANALYSIS_SERVICE_ERROR'
      ) {
        Alert.alert(t.analysisUnavailableTitle, t.analysisUnavailableText);
      } else {
        Alert.alert(t.analysisUnavailableTitle, t.analysisUnavailableText);
      }
    }
  }

  async function saveAnalyzedReceiptResult(analysisResult, imageUri, analyzedCategory, editableItems, sourceFile = null) {
    const amount = parseAmount(analysisResult.totalText || '');
    const cleanStoreName = String(analysisResult.storeName || '').trim();
    const now = Date.now();
    const cleanDateText = normalizeDateDisplay(analysisResult.dateText || '') || formatReceiptDate(now);

    if (!cleanStoreName || amount <= 0) {
      return;
    }

    const receiptItemsForSave = cleanEditableItems(editableItems, analyzedCategory);
    const originalReceiptAmount = normalizeReceiptAmount(amount, receiptItemsForSave);
    const moneyFields = await buildReceiptMoneyFields(
      originalReceiptAmount,
      normalizeCurrencyCode(analysisResult.currencyCode, selectedCurrency),
      selectedCurrency,
      receiptItemsForSave,
      cleanDateText
    );
    const newReceipt = {
      id: now,
      createdAt: now,
      store: cleanStoreName,
      amount: moneyFields.amount,
      currency: moneyFields.currency,
      originalAmount: moneyFields.originalAmount,
      originalCurrency: moneyFields.originalCurrency,
      exchangeRate: moneyFields.exchangeRate,
      subtotalAmount: Number((parseAmount(analysisResult.subtotalText) * moneyFields.exchangeRate).toFixed(2)) || 0,
      taxAmount: Number((parseAmount(analysisResult.taxText) * moneyFields.exchangeRate).toFixed(2)) || 0,
      originalSubtotalAmount: parseAmount(analysisResult.subtotalText) || 0,
      originalTaxAmount: parseAmount(analysisResult.taxText) || 0,
      category: analyzedCategory,
      date: cleanDateText,
      kind: 'expense',
      important: false,
      warrantyUntil: '',
      note: '',
      space: activeSpace,
      image: receiptSettings.keepPhotos ? imageUri : null,
      file: sourceFile,
      items: moneyFields.items,
      receiptNumber: normalizeReceiptNumber(analysisResult.receiptNumber),
    };
    newReceipt.fingerprint = getReceiptFingerprint(newReceipt);

    if (isReceiptDuplicate(newReceipt, receipts)) {
      Alert.alert(t.duplicateReceiptTitle, t.duplicateReceiptText);
      return;
    }

    const learnedCategories = buildCategoryMemoryFromItems(editableItems);
    if (Object.keys(learnedCategories).length > 0) {
      setCategoryMemory((currentMemory) => ({
        ...currentMemory,
        ...learnedCategories,
      }));
    }

    commitNewReceipt(newReceipt);
    if (!receiptSettings.keepPhotos && imageUri) {
      await deleteReceiptImage(imageUri);
    }
  }

  function commitNewReceipt(newReceipt) {
    setReceipts((currentReceipts) => [...currentReceipts, newReceipt]);
    setSelectedReceipt(null);
    setDetailReturnScreen('report');
    setEditingReceipt(false);
    setEditStoreName('');
    setEditAmountText('');
    setEditDateText('');
    setEditCategory('grocery');
    setEditCustomCategoryText('');
    setEditItems([]);
    resetReceiptForm();
    setPhotoOptionsOpen(false);
    setPendingPhotoAction(null);
    setScreen('home');
  }

  async function saveManualReceipt() {
    const amount = parseAmount(amountText);
    const cleanStoreName = storeName.trim();
    const now = Date.now();
    const cleanDateText = receiptDateText.trim() || formatReceiptDate(now);
    const categoryForSave =
      selectedCategory === 'other' && customCategoryText.trim()
        ? makeCustomCategoryKey(customCategoryText)
        : normalizeCategoryKey(selectedCategory);

    if (!cleanStoreName) {
      Alert.alert(t.missingInfo, t.enterStore);
      return;
    }

    if (amount <= 0) {
      Alert.alert(t.missingInfo, t.enterAmount);
      return;
    }

    const receiptItemsForSave = cleanEditableItems(receiptItems, categoryForSave);
    const originalReceiptAmount = normalizeReceiptAmount(amount, receiptItemsForSave);
    let moneyFields;

    try {
      moneyFields = await buildReceiptMoneyFields(
        originalReceiptAmount,
        receiptCurrency,
        selectedCurrency,
        receiptItemsForSave,
        cleanDateText
      );
    } catch (error) {
      console.warn('Exchange rate conversion failed.', error);
      Alert.alert(t.exchangeRateErrorTitle, t.exchangeRateErrorText);
      return;
    }

    const newReceipt = {
      id: now,
      createdAt: now,
      store: cleanStoreName,
      amount: moneyFields.amount,
      currency: moneyFields.currency,
      originalAmount: moneyFields.originalAmount,
      originalCurrency: moneyFields.originalCurrency,
      exchangeRate: moneyFields.exchangeRate,
      subtotalAmount: Number((parseAmount(subtotalText) * moneyFields.exchangeRate).toFixed(2)) || 0,
      taxAmount: Number((parseAmount(taxText) * moneyFields.exchangeRate).toFixed(2)) || 0,
      originalSubtotalAmount: parseAmount(subtotalText) || 0,
      originalTaxAmount: parseAmount(taxText) || 0,
      category: categoryForSave,
      date: cleanDateText,
      kind: normalizeReceiptKind(receiptKind),
      important: receiptImportant,
      warrantyUntil: normalizeDateDisplay(receiptWarrantyText),
      note: receiptNoteText.trim(),
      space: activeSpace,
      image: receiptSettings.keepPhotos ? receiptImage : null,
      file: receiptFile,
      items: moneyFields.items,
      receiptNumber: normalizeReceiptNumber(receiptNumberText),
    };
    newReceipt.fingerprint = getReceiptFingerprint(newReceipt);

    if (isReceiptDuplicate(newReceipt, receipts)) {
      Alert.alert(t.duplicateReceiptTitle, t.duplicateReceiptText);
      return;
    }

    const learnedCategories = buildCategoryMemoryFromItems(receiptItems);
    if (Object.keys(learnedCategories).length > 0) {
      setCategoryMemory((currentMemory) => ({
        ...currentMemory,
        ...learnedCategories,
      }));
    }

    commitNewReceipt(newReceipt);
    if (!receiptSettings.keepPhotos && receiptImage) {
      await deleteReceiptImage(receiptImage);
    }
  }

  if (!storageReady) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style="dark" />
        <View style={styles.app} />
      </SafeAreaView>
    );
  }

  if (!authProvider) {
    return (
      <AuthStartScreen
        t={t}
        onChooseApple={() => chooseAuthProvider('apple')}
        onChooseGoogle={() => chooseAuthProvider('google')}
      />
    );
  }

  if (customCameraOpen) {
    return (
      <ReciroCameraScreen
        t={t}
        onCancel={() => setCustomCameraOpen(false)}
        onUsePhoto={useCapturedReceiptPhoto}
      />
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <View style={styles.app}>
        {canShowBackControl && (
          <View style={styles.header}>
            <Pressable style={styles.headerBackButton} onPress={goBack}>
              <Text style={styles.headerBackText}>‹</Text>
            </Pressable>
          </View>
        )}

        <KeyboardAvoidingView
          style={styles.keyboardAvoidingView}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 12 : 0}
        >
          <ScrollView
            ref={mainScrollRef}
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
            onScrollBeginDrag={() => setOpenSwipeReceiptId(null)}
            onTouchStart={() => {
              if (openSwipeReceiptId) {
                setOpenSwipeReceiptId(null);
              }
            }}
            showsVerticalScrollIndicator={false}
          >
          {screen === 'home' && (
            <HomeScreen
              totalSpend={selectedMonthSpend}
              topCategory={topCategory}
              recentReceipts={recentReceipts}
              receiptCount={selectedMonthReceipts.length}
              budgetSummary={budgetSummary}
              recurringMonthlyTotal={recurringMonthlyTotal}
              recurringReceipts={selectedMonthRecurringReceipts}
              homeRecurringOpen={homeRecurringOpen}
              onOpenRecurringPayments={() => setHomeRecurringOpen(true)}
              onCloseRecurringPayments={() => setHomeRecurringOpen(false)}
              onSelectReceipt={openReceiptDetail}
              onDeleteReceipt={(receipt) => requestDeleteReceipt(receipt, { returnToDetailScreen: false })}
              openSwipeReceiptId={openSwipeReceiptId}
              setOpenSwipeReceiptId={setOpenSwipeReceiptId}
              isReceiptComposerActive={isReceiptComposerActive}
              t={t}
              receiptComposer={
                <ReceiptScreen
                  storeName={storeName}
                  setStoreName={setStoreName}
                  amountText={amountText}
                  setAmountText={setAmountText}
                  receiptCurrency={receiptCurrency}
                  setReceiptCurrency={setReceiptCurrency}
                  subtotalText={subtotalText}
                  setSubtotalText={setSubtotalText}
                  taxText={taxText}
                  setTaxText={setTaxText}
                  receiptDateText={receiptDateText}
                  setReceiptDateText={setReceiptDateText}
                  selectedCategory={selectedCategory}
                  setSelectedCategory={setSelectedCategory}
                  customCategoryText={customCategoryText}
                  setCustomCategoryText={setCustomCategoryText}
                  receiptKind={receiptKind}
                  setReceiptKind={setReceiptKind}
                  receiptImportant={receiptImportant}
                  setReceiptImportant={setReceiptImportant}
                  receiptWarrantyText={receiptWarrantyText}
                  setReceiptWarrantyText={setReceiptWarrantyText}
                  receiptNoteText={receiptNoteText}
                  setReceiptNoteText={setReceiptNoteText}
                  receiptNoteOpen={receiptNoteOpen}
                  setReceiptNoteOpen={setReceiptNoteOpen}
                  receiptDetailsOpen={receiptDetailsOpen}
                  setReceiptDetailsOpen={setReceiptDetailsOpen}
                  receiptImage={receiptImage}
                  receiptFile={receiptFile}
                  receiptItems={receiptItems}
                  onUpdateReceiptItemCategory={updateReceiptItemCategory}
                  onUpdateReceiptItem={updateReceiptItem}
                  onAddReceiptItem={addReceiptItem}
                  onRemoveReceiptItem={removeReceiptItem}
                  analysisStatus={analysisStatus}
                  analysisConfidence={analysisConfidence}
                  usageText={freeUsageText}
                  photoOptionsOpen={photoOptionsOpen}
                  onOpenPhotoOptions={() => setPhotoOptionsOpen(true)}
                  onClosePhotoOptions={() => setPhotoOptionsOpen(false)}
                  onPickImage={() => {
                    if (!canUseReceiptAnalysis) {
                      showAnalysisLimitAlert();
                      setPhotoOptionsOpen(false);
                      return;
                    }

                    setPendingPhotoAction('gallery');
                    setPhotoOptionsOpen(false);
                  }}
                  onPickFile={() => {
                    setPendingPhotoAction('file');
                    setPhotoOptionsOpen(false);
                  }}
                  onTakePhoto={() => {
                    if (!canUseReceiptAnalysis) {
                      showAnalysisLimitAlert();
                      setPhotoOptionsOpen(false);
                      return;
                    }

                    setPendingPhotoAction('camera');
                    setPhotoOptionsOpen(false);
                  }}
                  onReanalyze={() => {
                    if (!canUseReceiptAnalysis) {
                      showAnalysisLimitAlert();
                      return;
                    }

                    analyzeReceiptImage(receiptImage);
                  }}
                  onSave={saveManualReceipt}
                  onPreviewImage={setPreviewImage}
                  t={t}
                />
              }
            />
          )}

          {screen === 'report' && (
            <ReportScreen
              totalSpend={reportTotalSpend}
              incomeTotal={reportIncomeTotal}
              balance={reportBalance}
              receiptCount={reportReceipts.length}
              categories={reportCategories}
              topCategory={reportTopCategory}
              receipts={reportReceipts}
              merchantGroups={reportMerchantGroups}
              selectedMerchantGroup={selectedMerchantGroup}
              selectedCategory={selectedReportCategory}
              selectedCategoryReceipts={selectedReportCategoryReceipts}
              reportView={reportView}
              setReportView={updateReportView}
              reportPeriod={reportPeriod}
              setReportPeriod={updateReportPeriod}
              reportSearchText={reportSearchText}
              setReportSearchText={updateReportSearchText}
              onSelectCategory={(category) => setSelectedReportCategoryKey(category.key)}
              onClearSelectedCategory={() => setSelectedReportCategoryKey(null)}
              onSelectMerchant={selectReportMerchant}
              onClearSelectedMerchant={() => setSelectedMerchantKey(null)}
              onSelectReceipt={openReceiptDetail}
              onDeleteReceipt={(receipt) => requestDeleteReceipt(receipt, { returnToDetailScreen: false })}
              openSwipeReceiptId={openSwipeReceiptId}
              setOpenSwipeReceiptId={setOpenSwipeReceiptId}
              t={t}
            />
          )}

          {screen === 'monthly' && (
            <MonthlyReceiptsScreen
              monthlyGroups={monthlyReceiptGroups}
              selectedGroup={selectedMonthlyReceiptGroup}
              onSelectMonth={(group) => setSelectedMonthlyReceiptKey(group.key)}
              onClearMonth={() => setSelectedMonthlyReceiptKey(null)}
              onSelectReceipt={openReceiptDetail}
              onDeleteReceipt={(receipt) => requestDeleteReceipt(receipt, { returnToDetailScreen: false })}
              openSwipeReceiptId={openSwipeReceiptId}
              setOpenSwipeReceiptId={setOpenSwipeReceiptId}
              t={t}
            />
          )}

          {screen === 'products' && (
            <ProductsScreen
              productGroups={productGroups}
              productPeriod={productPeriod}
              setProductPeriod={setProductPeriod}
              productMonthKey={productMonthKey}
              setProductMonthKey={setProductMonthKey}
              productMonthOptions={productMonthOptions}
              t={t}
            />
          )}

          {screen === 'detail' && selectedReceipt && (
            <ReceiptDetailScreen
              receipt={selectedReceipt}
              editing={editingReceipt}
              editStoreName={editStoreName}
              setEditStoreName={setEditStoreName}
              editAmountText={editAmountText}
              setEditAmountText={setEditAmountText}
              editDateText={editDateText}
              setEditDateText={setEditDateText}
              editCategory={editCategory}
              setEditCategory={setEditCategory}
              editCustomCategoryText={editCustomCategoryText}
              setEditCustomCategoryText={setEditCustomCategoryText}
              editReceiptKind={editReceiptKind}
              setEditReceiptKind={setEditReceiptKind}
              editReceiptImportant={editReceiptImportant}
              setEditReceiptImportant={setEditReceiptImportant}
              editWarrantyText={editWarrantyText}
              setEditWarrantyText={setEditWarrantyText}
              editNoteText={editNoteText}
              setEditNoteText={setEditNoteText}
              editItems={editItems}
              onUpdateEditItem={updateEditItem}
              onAddEditItem={addEditItem}
              onRemoveEditItem={removeEditItem}
              onSetTotalFromItems={setTotalFromEditItems}
              onBack={goBack}
              onStartEdit={startEditSelectedReceipt}
              onCancelEdit={cancelEditSelectedReceipt}
              onSaveEdit={saveEditedReceipt}
              onDelete={deleteSelectedReceipt}
              onPreviewImage={setPreviewImage}
              onOpenFile={openReceiptFile}
              t={t}
            />
          )}

          {screen === 'settings' && (
            <SettingsScreen
              salaryText={salaryText}
              setSalaryText={updateMonthlyIncome}
              incomeMonthKey={incomeMonthKey}
              setIncomeMonthKey={setIncomeMonthKey}
              salary={salary}
              totalSpend={selectedMonthSpend}
              remaining={remaining}
              selectedLanguage={selectedLanguage}
              selectedCurrency={selectedCurrency}
              setSelectedCurrency={setSelectedCurrency}
              budgetsByCategory={budgetsByCategory}
              setBudgetsByCategory={setBudgetsByCategory}
              otherCategoryLabel={otherCategoryLabel}
              setOtherCategoryLabel={setOtherCategoryLabel}
              receiptSettings={receiptSettings}
              updateReceiptSettings={updateReceiptSettings}
              recurringExpenses={recurringExpenses}
              setRecurringExpenses={setRecurringExpenses}
              activeSpace={activeSpace}
              setActiveSpace={setActiveSpace}
              settingsSection={settingsSection}
              setSettingsSection={setSettingsSection}
              onReport={() => navigateToScreen('report')}
              onCreateBackup={createDataBackup}
              onRestoreBackup={restoreLatestBackup}
              onExportCsv={exportReceiptsCsv}
              onClearAllData={clearAllData}
              authProvider={authProvider}
              onSignOut={signOutAuthProvider}
              onChooseAuthProvider={chooseAuthProvider}
              t={t}
            />
          )}
          </ScrollView>
        </KeyboardAvoidingView>

        {canShowBackControl && (
          <View style={styles.edgeBackZone} {...swipeResponder.panHandlers} />
        )}

        <View
          style={[styles.navArea, Platform.OS === 'web' && styles.pointerEventsBoxNone]}
          {...(Platform.OS === 'web' ? {} : { pointerEvents: 'box-none' })}
        >
          <View style={styles.nav}>
            <NavButton
              icon="🏠"
              label={t.navHome}
              active={screen === 'home' || (screen === 'detail' && detailReturnScreen === 'home')}
              onPress={() => navigateToScreen('home')}
            />
            <NavButton
              icon="📊"
              label={t.navReport}
              active={screen === 'report' || (screen === 'detail' && detailReturnScreen === 'report')}
              onPress={() => navigateToScreen('report')}
            />
            <NavButton
              icon="🧾"
              label={t.navMonthlyReceipts}
              active={screen === 'monthly' || (screen === 'detail' && detailReturnScreen === 'monthly')}
              onPress={() => navigateToScreen('monthly')}
            />
            <NavButton
              icon="🛍️"
              label={t.navProducts}
              active={screen === 'products' || (screen === 'detail' && detailReturnScreen === 'products')}
              onPress={() => navigateToScreen('products')}
            />
            <NavButton
              icon="⚙️"
              label={t.navSettings}
              active={screen === 'settings' || (screen === 'detail' && detailReturnScreen === 'settings')}
              onPress={() => navigateToScreen('settings')}
            />
          </View>
        </View>

        <ImagePreviewModal
          imageUri={previewImage}
          onClose={() => setPreviewImage(null)}
          closeLabel={t.cancel}
        />
      </View>
    </SafeAreaView>
  );
}

function AuthStartScreen({ t, onChooseApple, onChooseGoogle }) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <View style={styles.authScreen}>
        <View style={styles.authBrandBlock}>
          <View style={styles.authLogoMark}>
            <Text style={styles.authLogoText}>R</Text>
          </View>
          <Text style={styles.authBrandName}>Reciro</Text>
          <Text style={styles.authSubtitle}>{t.appSubtitle}</Text>
        </View>

        <View style={styles.authCard}>
          <Text style={styles.authTitle}>{t.welcomeTitle}</Text>
          <Text style={styles.authText}>{t.welcomeText}</Text>

          <Pressable style={[styles.authButton, styles.authButtonDark]} onPress={onChooseApple}>
            <Text style={[styles.authButtonIcon, styles.authButtonTextDark]}></Text>
            <Text style={[styles.authButtonText, styles.authButtonTextDark]}>{t.signInWithApple}</Text>
          </Pressable>

          <Pressable style={styles.authButton} onPress={onChooseGoogle}>
            <Text style={styles.authButtonIcon}>G</Text>
            <Text style={styles.authButtonText}>{t.signInWithGoogle}</Text>
          </Pressable>

          <Text style={styles.authFootnote}>{t.accountSyncInfo}</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

function HomeScreen({
  totalSpend,
  topCategory,
  recentReceipts,
  receiptCount,
  budgetSummary,
  recurringMonthlyTotal,
  recurringReceipts,
  homeRecurringOpen,
  onOpenRecurringPayments,
  onCloseRecurringPayments,
  onSelectReceipt,
  onDeleteReceipt,
  openSwipeReceiptId,
  setOpenSwipeReceiptId,
  isReceiptComposerActive,
  receiptComposer,
  t,
}) {
  const topCategoryLabel = getCategoryLabel(topCategory.key, t);
  const hasBudgetOrMonthlyPayments = recurringMonthlyTotal > 0 || budgetSummary.length > 0;

  if (homeRecurringOpen) {
    return (
      <HomeRecurringPaymentsScreen
        receipts={recurringReceipts}
        total={recurringMonthlyTotal}
        onBack={onCloseRecurringPayments}
        t={t}
      />
    );
  }

  if (isReceiptComposerActive) {
    return (
      <View style={styles.homeReceiptComposerFocused}>
        {receiptComposer}
      </View>
    );
  }

  return (
    <View>
      <View style={styles.homeHero}>
        <Text style={styles.label}>{t.totalThisMonth}</Text>
        <Text style={styles.homeAmount}>{formatTL(totalSpend)}</Text>
        <Text style={styles.homeHeroText}>
          {receiptCount > 0
            ? t.topCategorySentence(topCategoryLabel, formatTL(topCategory.amount))
            : t.noReceiptsText}
        </Text>
      </View>

      <View style={styles.metricGrid}>
        <Metric title={t.receiptCount} value={String(receiptCount)} />
        <Metric title={t.highest} value={topCategoryLabel} />
      </View>

      {hasBudgetOrMonthlyPayments && (
      <View style={styles.card}>
        {recurringMonthlyTotal > 0 && (
          <Pressable style={styles.row} onPress={onOpenRecurringPayments}>
            <Text style={styles.rowText}>{t.recurring}</Text>
            <View style={styles.merchantAmountBlock}>
              <Text style={styles.rowAmount}>{formatTL(recurringMonthlyTotal)}</Text>
              <Text style={styles.merchantChevron}>›</Text>
            </View>
          </Pressable>
        )}
        {budgetSummary.slice(0, 2).map((budget) => (
          <View style={styles.row} key={budget.key}>
            <View style={styles.receiptTextBlock}>
              <Text style={styles.rowText}>{getCategoryIcon(budget.key)} {getCategoryLabel(budget.key, t)}</Text>
              <Text style={styles.rowMeta}>
                {formatTL(budget.spent)} / {formatTL(budget.limit)}
              </Text>
            </View>
            <Text style={styles.rowAmount}>
              {formatTL(Math.abs(budget.remaining))} {budget.remaining >= 0 ? t.budgetLeft : t.budgetOver}
            </Text>
          </View>
        ))}
      </View>
      )}

      <HomeReceiptList
        title={t.recentSpending}
        receipts={recentReceipts}
        onSelectReceipt={onSelectReceipt}
        onDeleteReceipt={onDeleteReceipt}
        openSwipeReceiptId={openSwipeReceiptId}
        setOpenSwipeReceiptId={setOpenSwipeReceiptId}
        t={t}
      />

      <View style={styles.homeReceiptComposer}>
        {receiptComposer}
      </View>
    </View>
  );
}

function HomeRecurringPaymentsScreen({ receipts, total, onBack, t }) {
  return (
    <View>
      <View style={styles.reportHero}>
        <Text style={styles.label}>{t.recurring}</Text>
        <Text style={styles.reportAmount}>{formatTL(total)}</Text>
        <Text style={styles.productsHeroText}>{t.recurringInfo}</Text>
      </View>

      <SecondaryButton label={t.back} onPress={onBack} />

      <View style={styles.card}>
        {receipts.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>{t.noRecurring}</Text>
            <Text style={styles.emptyText}>{t.recurringInfo}</Text>
          </View>
        )}

        {receipts.map((receipt) => (
          <View style={styles.row} key={receipt.id}>
            <View style={styles.receiptTextBlock}>
              <Text style={styles.rowText}>{receipt.store}</Text>
              <Text style={styles.rowMeta}>
                {getCategoryIcon(receipt.category)} {getCategoryLabel(receipt.category, t)} - {normalizeDateDisplay(receipt.date, receipt.createdAt)}
              </Text>
              <Text style={styles.rowHint}>{t.recurringMonthlyEquivalent}</Text>
            </View>
            <Text style={styles.rowAmount}>{formatReceiptAmount(receipt)}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function ReceiptScreen({
  storeName,
  setStoreName,
  amountText,
  setAmountText,
  receiptCurrency,
  setReceiptCurrency,
  subtotalText,
  setSubtotalText,
  taxText,
  setTaxText,
  receiptDateText,
  setReceiptDateText,
  selectedCategory,
  setSelectedCategory,
  customCategoryText,
  setCustomCategoryText,
  receiptKind,
  setReceiptKind,
  receiptImportant,
  setReceiptImportant,
  receiptWarrantyText,
  setReceiptWarrantyText,
  receiptNoteText,
  setReceiptNoteText,
  receiptNoteOpen,
  setReceiptNoteOpen,
  receiptDetailsOpen,
  setReceiptDetailsOpen,
  receiptImage,
  receiptFile,
  receiptItems,
  onUpdateReceiptItemCategory,
  onUpdateReceiptItem,
  onAddReceiptItem,
  onRemoveReceiptItem,
  analysisStatus,
  analysisConfidence,
  usageText,
  photoOptionsOpen,
  onOpenPhotoOptions,
  onClosePhotoOptions,
  onPickImage,
  onPickFile,
  onTakePhoto,
  onReanalyze,
  onSave,
  onPreviewImage,
  t,
}) {
  const [expandedReceiptItemId, setExpandedReceiptItemId] = useState(null);
  const requiredFieldsComplete =
    Boolean(storeName.trim()) && Boolean(amountText.trim());
  const confidencePercent =
    typeof analysisConfidence === 'number' ? Math.round(analysisConfidence * 100) : null;
  const needsReview = confidencePercent === null || confidencePercent < 85 || !requiredFieldsComplete;
  const showSimpleAddButton =
    !receiptImage && !receiptFile && !storeName && !amountText && receiptItems.length === 0 && analysisStatus !== 'done';

  if (showSimpleAddButton) {
    return (
      <View>
        <Pressable style={styles.receiptActionButton} onPress={onOpenPhotoOptions} hitSlop={8}>
          <Text style={styles.receiptActionText}>{t.addReceipt}</Text>
        </Pressable>
        <Text style={styles.receiptUsageText}>{usageText}</Text>

        <PhotoOptionsSheet
          visible={photoOptionsOpen}
          onClose={onClosePhotoOptions}
          onTakePhoto={onTakePhoto}
          onPickImage={onPickImage}
          onPickFile={onPickFile}
          t={t}
        />
      </View>
    );
  }

  return (
    <View>
      {receiptImage ? (
        <View style={styles.receiptPhotoBox}>
          <Pressable onPress={() => onPreviewImage(receiptImage)}>
            <Image source={{ uri: receiptImage }} style={styles.receiptImage} />
          </Pressable>
        </View>
      ) : receiptFile ? (
        <View style={styles.receiptPhotoBox}>
          <View style={styles.filePreviewBox}>
            <Text style={styles.filePreviewIcon}>PDF</Text>
            <Text style={styles.filePreviewTitle}>{receiptFile.name || t.fileSaved}</Text>
            <Text style={styles.filePreviewText}>{t.fileSavedText}</Text>
          </View>
        </View>
      ) : (
        <View style={styles.receiptStartCard}>
          <View style={styles.receiptStartHeader}>
            <View>
              <Text style={styles.receiptStartEyebrow}>{t.newReceipt}</Text>
              <Text style={styles.receiptStartTitle}>{t.receiptStartTitle}</Text>
            </View>
            <View style={styles.receiptStartBadge}>
              <Text style={styles.receiptStartBadgeText}>AI</Text>
            </View>
          </View>
          <Text style={styles.receiptStartText}>{t.receiptStartText}</Text>

          <View style={styles.receiptScanPanel}>
            <View style={styles.receiptScanLine} />
            <View style={styles.receiptScanCenter}>
              <View style={styles.receiptScanIcon}>
                <Text style={styles.receiptScanIconText}>+</Text>
              </View>
            </View>
            <Text style={styles.photoTitle}>{t.noReceiptPhoto}</Text>
            <Text style={styles.photoText}>{t.choosePhotoHelp}</Text>
          </View>
        </View>
      )}

      <Pressable style={styles.receiptActionButton} onPress={onOpenPhotoOptions} hitSlop={8}>
        <Text style={styles.receiptActionText}>
          {receiptImage ? t.changeReceiptPhoto : t.addReceiptPhoto}
        </Text>
      </Pressable>
      <Text style={styles.receiptUsageText}>{usageText}</Text>

      <PhotoOptionsSheet
        visible={photoOptionsOpen}
        onClose={onClosePhotoOptions}
        onTakePhoto={onTakePhoto}
        onPickImage={onPickImage}
        onPickFile={onPickFile}
        t={t}
      />

      {receiptImage && analysisStatus === 'analyzing' && (
        <View style={styles.analysisCard}>
          <Text style={styles.analysisTitle}>{t.demoAnalyzing}</Text>
          <Text style={styles.analysisText}>{t.receiptStartText}</Text>
        </View>
      )}

      {analysisStatus === 'done' && (
        <View style={[styles.reviewCard, needsReview && styles.reviewCardWarning]}>
          <View style={styles.reviewTop}>
            <Text style={styles.reviewTitle}>{t.reviewBeforeSave}</Text>
            <Text style={[styles.reviewBadge, needsReview && styles.reviewBadgeWarning]}>
              {needsReview ? t.needsReview : t.looksGood}
            </Text>
          </View>
          <Text style={styles.reviewText}>{t.reviewBeforeSaveText}</Text>
          {confidencePercent !== null && (
            <Text style={styles.reviewMeta}>
              {t.analysisConfidence}: %{confidencePercent}
            </Text>
          )}
          {receiptImage && (
            <Pressable style={styles.reanalyzeButton} onPress={onReanalyze}>
              <Text style={styles.reanalyzeButtonText}>{t.reanalyzeReceipt}</Text>
            </Pressable>
          )}
        </View>
      )}

      {(receiptImage || receiptFile || storeName || amountText) && (
        <View style={styles.formCard}>
          <Text style={[styles.inputLabel, styles.firstInputLabel]}>{t.storeName}</Text>
          <TextInput
            style={styles.input}
            value={storeName}
            onChangeText={setStoreName}
            placeholder=""
            returnKeyType="next"
          />

          <Text style={styles.inputLabel}>{t.totalAmount}</Text>
          <TextInput
            style={styles.input}
            value={amountText}
            onChangeText={setAmountText}
            keyboardType="decimal-pad"
            placeholder=""
          />

          {analysisStatus !== 'done' && (
            <Text style={styles.manualSaveText}>{t.manualSaveHelp}</Text>
          )}

          <Pressable
            style={[styles.toggleRow, receiptDetailsOpen && styles.toggleRowActive]}
            onPress={() => setReceiptDetailsOpen(!receiptDetailsOpen)}
          >
            <Text style={styles.rowText}>{t.editReceiptDetails}</Text>
            <Text style={styles.settingsValue}>{receiptDetailsOpen ? '⌃' : '⌄'}</Text>
          </Pressable>

          {receiptDetailsOpen && (
            <View style={styles.detailFieldsPanel}>
              <Text style={styles.inputLabel}>{t.receiptType}</Text>
              <View style={styles.currencyChipRow}>
                {[
                  { key: 'expense', label: t.expenseType },
                  { key: 'refund', label: t.refundType },
                ].map((option) => (
                  <Pressable
                    key={option.key}
                    style={[styles.currencyChip, receiptKind === option.key && styles.currencyChipActive]}
                    onPress={() => setReceiptKind(option.key)}
                  >
                    <Text style={[styles.currencyChipText, receiptKind === option.key && styles.currencyChipTextActive]}>
                      {option.key === 'refund' ? '↩ ' : '+ '}{option.label}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <Text style={styles.inputLabel}>{t.receiptCurrency}</Text>
              <View style={styles.currencyChipRow}>
                {currencies.map((currency) => (
                  <Pressable
                    key={currency.code}
                    style={[
                      styles.currencyChip,
                      receiptCurrency === currency.code && styles.currencyChipActive,
                    ]}
                    onPress={() => setReceiptCurrency(currency.code)}
                  >
                    <Text
                      style={[
                        styles.currencyChipText,
                        receiptCurrency === currency.code && styles.currencyChipTextActive,
                      ]}
                    >
                      {currency.symbol} {currency.code}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <Text style={styles.inputLabel}>{t.date}</Text>
              <TextInput
                style={styles.input}
                value={receiptDateText}
                onChangeText={setReceiptDateText}
                placeholder={formatReceiptDate(Date.now())}
              />

              <Text style={styles.inputLabel}>{t.subtotalAmount}</Text>
              <TextInput
                style={styles.input}
                value={subtotalText}
                onChangeText={setSubtotalText}
                keyboardType="decimal-pad"
                placeholder=""
              />

              <Text style={styles.inputLabel}>{t.taxAmount}</Text>
              <TextInput
                style={styles.input}
                value={taxText}
                onChangeText={setTaxText}
                keyboardType="decimal-pad"
                placeholder=""
              />

              <Text style={styles.inputLabel}>{t.category}</Text>
              <View style={styles.receiptCategoryGrid}>
                {categoryOptions.map((category) => (
                  <Pressable
                    key={category.key}
                    style={[
                      styles.receiptCategoryButton,
                      selectedCategory === category.key && styles.receiptCategoryButtonActive,
                    ]}
                    onPress={() => {
                      setSelectedCategory(category.key);
                      if (category.key !== 'other') {
                        setCustomCategoryText('');
                      }
                    }}
                  >
                    <Text
                      style={[
                        styles.receiptCategoryText,
                        selectedCategory === category.key && styles.receiptCategoryTextActive,
                      ]}
                    >
                      {category.icon} {getCategoryLabel(category.key, t)}
                    </Text>
                  </Pressable>
                ))}
              </View>
              {selectedCategory === 'other' && (
                <>
                  <Text style={styles.inputLabel}>{t.customCategory}</Text>
                  <TextInput
                    style={styles.input}
                    value={customCategoryText}
                    onChangeText={setCustomCategoryText}
                    placeholder={t.customCategoryPlaceholder}
                  />
                </>
              )}

              <Text style={styles.inputLabel}>{t.warranty}</Text>
              <TextInput
                style={styles.input}
                value={receiptWarrantyText}
                onChangeText={setReceiptWarrantyText}
                placeholder={formatReceiptDate(Date.now())}
              />

              <Pressable
                style={[styles.toggleRow, receiptImportant && styles.toggleRowActive]}
                onPress={() => setReceiptImportant(!receiptImportant)}
              >
                <Text style={styles.rowText}>{receiptImportant ? '⭐ ' : ''}{t.importantReceipt}</Text>
                <Text style={styles.settingsValue}>{receiptImportant ? t.selected : ''}</Text>
              </Pressable>

              <Pressable
                style={[styles.toggleRow, receiptNoteOpen && styles.toggleRowActive]}
                onPress={() => setReceiptNoteOpen(!receiptNoteOpen)}
              >
                <Text style={styles.rowText}>{t.note}</Text>
                <Text style={styles.settingsValue}>{receiptNoteOpen ? '⌃' : '⌄'}</Text>
              </Pressable>

              {receiptNoteOpen && (
                <TextInput
                  style={[styles.input, styles.feedbackInput]}
                  value={receiptNoteText}
                  onChangeText={setReceiptNoteText}
                  placeholder={t.notePlaceholder}
                  multiline
                  textAlignVertical="top"
                />
              )}
            </View>
          )}
        </View>
      )}

      {(receiptItems.length > 0 || analysisStatus === 'done') && (
        <View>
          <Text style={styles.sectionTitle}>{t.readItems}</Text>
          <View style={styles.card}>
            {receiptItems.map((item, index) => {
              const normalizedItem =
                typeof item === 'string'
                  ? {
                      id: `${index}-${item}`,
                      name: item,
                      category: selectedCategory,
                      amountText: '',
                      quantityText: '1',
                      unit: '',
                    }
                  : item;
              const itemCategory = normalizeCategoryKey(normalizedItem.category || selectedCategory);
              const itemId = normalizedItem.id || `${normalizedItem.name}-${index}`;
              const isExpanded = expandedReceiptItemId === itemId;
              const itemAmount = parseAmount(normalizedItem.amountText);
              const itemQuantity = String(normalizedItem.quantityText || normalizedItem.quantity || '').trim();
              const itemMeta = [
                itemQuantity ? `${itemQuantity}${normalizedItem.unit ? ` ${normalizedItem.unit}` : ''}` : '',
                itemAmount > 0 ? formatTL(itemAmount) : '',
                getCategoryLabel(itemCategory, t),
              ].filter(Boolean).join(' - ');

              return (
                <View style={styles.receiptItemEditCard} key={itemId}>
                  <Pressable
                    style={styles.compactItemHeader}
                    onPress={() => setExpandedReceiptItemId(isExpanded ? null : itemId)}
                    hitSlop={8}
                  >
                    <View style={styles.receiptTextBlock}>
                      <Text style={styles.editItemTitle}>
                        {String(normalizedItem.name || '').trim() || `${t.items} ${index + 1}`}
                      </Text>
                      <Text style={styles.rowMeta}>{itemMeta}</Text>
                    </View>
                    <Text style={styles.compactItemChevron}>{isExpanded ? '⌃' : '⌄'}</Text>
                  </Pressable>

                  {isExpanded && (
                    <View style={styles.compactItemDetails}>
                      <View style={styles.editItemHeader}>
                        <Text style={styles.rowHint}>{t.reviewBeforeSave}</Text>
                        <Pressable onPress={() => onRemoveReceiptItem(itemId)}>
                          <Text style={styles.removeItemText}>{t.removeItem}</Text>
                        </Pressable>
                      </View>

                      <TextInput
                        style={styles.itemInput}
                        value={String(normalizedItem.name || '')}
                        onChangeText={(value) => onUpdateReceiptItem(itemId, 'name', value)}
                        placeholder={t.itemName}
                      />

                      <TextInput
                        style={styles.itemInput}
                        value={String(normalizedItem.amountText || '')}
                        onChangeText={(value) => onUpdateReceiptItem(itemId, 'amountText', value)}
                        keyboardType="decimal-pad"
                        placeholder={t.itemAmount}
                      />

                      <View style={styles.itemInlineInputs}>
                        <TextInput
                          style={[styles.itemInput, styles.itemInlineInput]}
                          value={String(normalizedItem.quantityText || '')}
                          onChangeText={(value) => onUpdateReceiptItem(itemId, 'quantityText', value)}
                          keyboardType="decimal-pad"
                          placeholder={t.quantity}
                        />
                        <TextInput
                          style={[styles.itemInput, styles.itemInlineInput]}
                          value={String(normalizedItem.unit || '')}
                          onChangeText={(value) => onUpdateReceiptItem(itemId, 'unit', value)}
                          placeholder={t.unit}
                        />
                      </View>

                      <View style={styles.receiptItemCategoryGrid}>
                        {categoryOptions.map((category) => (
                          <Pressable
                            key={category.key}
                            style={[
                              styles.receiptItemCategoryButton,
                              itemCategory === category.key && styles.receiptItemCategoryButtonActive,
                            ]}
                            onPress={() => onUpdateReceiptItem(itemId, 'category', category.key)}
                          >
                            <Text
                              style={[
                                styles.receiptItemCategoryText,
                                itemCategory === category.key && styles.receiptItemCategoryTextActive,
                              ]}
                            >
                              {category.icon} {getCategoryLabel(category.key, t)}
                            </Text>
                          </Pressable>
                        ))}
                      </View>
                    </View>
                  )}
                </View>
              );
            })}

            <Pressable style={styles.addItemButton} onPress={onAddReceiptItem}>
              <Text style={styles.addItemText}>+ {t.addItem}</Text>
            </Pressable>
          </View>
        </View>
      )}

      {analysisStatus === 'done' && (
        <PrimaryButton
          label={t.confirmAndSave}
          onPress={onSave}
        />
      )}
    </View>
  );
}

function ReportScreen({
  totalSpend,
  incomeTotal,
  balance,
  receiptCount,
  categories,
  topCategory,
  receipts,
  merchantGroups,
  selectedMerchantGroup,
  selectedCategory,
  selectedCategoryReceipts,
  reportView,
  setReportView,
  reportPeriod,
  setReportPeriod,
  reportSearchText,
  setReportSearchText,
  onSelectCategory,
  onClearSelectedCategory,
  onSelectMerchant,
  onClearSelectedMerchant,
  onSelectReceipt,
  onDeleteReceipt,
  openSwipeReceiptId,
  setOpenSwipeReceiptId,
  t,
}) {
  const maxAmount = Math.max(1, ...categories.map((category) => category.amount));
  const topCategoryLabel = getCategoryLabel(topCategory.key, t);
  const periodFilters = [
    { key: 'month', label: t.thisMonth },
    { key: 'all', label: t.allTime },
  ];
  const reportViews = [
    { key: 'overview', label: `📊 ${t.reportOverview}` },
    { key: 'merchants', label: `🏬 ${t.merchantBreakdown}` },
  ];

  if (selectedMerchantGroup) {
    return (
      <View>
        <View style={styles.reportHero}>
          <Text style={styles.label}>🏬 {selectedMerchantGroup.store}</Text>
          <Text style={styles.reportAmount}>{formatTL(selectedMerchantGroup.amount)}</Text>
          <View style={styles.reportInfoRow}>
            <View style={styles.reportInfoItem}>
              <Text style={styles.reportInfoLabel}>{t.receiptCount}</Text>
              <Text style={styles.reportInfoValue}>{selectedMerchantGroup.count}</Text>
            </View>
            <View style={styles.reportInfoItem}>
              <Text style={styles.reportInfoLabel}>{t.merchantBreakdown}</Text>
              <Text style={styles.reportInfoValue}>{selectedMerchantGroup.store}</Text>
            </View>
          </View>
        </View>

        <SecondaryButton label={t.clearMerchantFilter} onPress={onClearSelectedMerchant} />

        <ReceiptList
          title={t.merchantReceiptsTitle(selectedMerchantGroup.store)}
          subtitle={`${selectedMerchantGroup.count} ${t.receiptsShort}`}
          receipts={selectedMerchantGroup.receipts}
          onSelectReceipt={onSelectReceipt}
          onDeleteReceipt={onDeleteReceipt}
          openSwipeReceiptId={openSwipeReceiptId}
          setOpenSwipeReceiptId={setOpenSwipeReceiptId}
          t={t}
        />
      </View>
    );
  }

  if (selectedCategory) {
    const selectedCategoryLabel = getCategoryLabel(selectedCategory.key, t);

    return (
      <View>
        <View style={styles.reportHero}>
          <Text style={styles.label}>{getCategoryIcon(selectedCategory.key)} {selectedCategoryLabel}</Text>
          <Text style={styles.reportAmount}>{formatTL(selectedCategory.amount)}</Text>
          <View style={styles.reportInfoRow}>
            <View style={styles.reportInfoItem}>
              <Text style={styles.reportInfoLabel}>{t.receiptCount}</Text>
              <Text style={styles.reportInfoValue}>{selectedCategoryReceipts.length}</Text>
            </View>
            <View style={styles.reportInfoItem}>
              <Text style={styles.reportInfoLabel}>{t.category}</Text>
              <Text style={styles.reportInfoValue}>{selectedCategoryLabel}</Text>
            </View>
          </View>
        </View>

        <SecondaryButton label={t.clearMerchantFilter} onPress={onClearSelectedCategory} />

        <ReceiptList
          title={`${getCategoryIcon(selectedCategory.key)} ${selectedCategoryLabel}`}
          subtitle={`${selectedCategoryReceipts.length} ${t.receiptsShort}`}
          receipts={selectedCategoryReceipts}
          onSelectReceipt={onSelectReceipt}
          onDeleteReceipt={onDeleteReceipt}
          openSwipeReceiptId={openSwipeReceiptId}
          setOpenSwipeReceiptId={setOpenSwipeReceiptId}
          t={t}
        />
      </View>
    );
  }

  return (
    <View>
      <View style={styles.reportHero}>
        <Text style={styles.label}>📌 {t.totalSpending}</Text>
        <Text style={styles.reportAmount}>{formatTL(totalSpend)}</Text>
        <View style={styles.reportInfoRow}>
          <View style={styles.reportInfoItem}>
            <Text style={styles.reportInfoLabel}>{t.receiptCount}</Text>
            <Text style={styles.reportInfoValue}>{receiptCount}</Text>
          </View>
          <View style={styles.reportInfoItem}>
            <Text style={styles.reportInfoLabel}>{t.highest}</Text>
            <Text style={styles.reportInfoValue}>{topCategoryLabel}</Text>
          </View>
        </View>
        <View style={styles.reportInfoRow}>
          <View style={styles.reportInfoItem}>
            <Text style={styles.reportInfoLabel}>{t.income}</Text>
            <Text style={styles.reportInfoValue}>{formatTL(incomeTotal)}</Text>
          </View>
          <View style={[styles.reportInfoItem, balance < 0 && styles.reportInfoItemWarning]}>
            <Text style={styles.reportInfoLabel}>{t.remainingMoney}</Text>
            <Text style={styles.reportInfoValue}>{formatTL(balance)}</Text>
          </View>
        </View>
      </View>

      <View style={styles.reportViewTabs}>
        {reportViews.map((view) => (
          <Pressable
            key={view.key}
            style={[styles.reportViewTab, reportView === view.key && styles.reportViewTabActive]}
            onPress={() => setReportView(view.key)}
          >
            <Text style={[styles.reportViewTabText, reportView === view.key && styles.reportViewTabTextActive]}>
              {view.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.periodTabs}>
        {periodFilters.map((filter) => (
          <Pressable
            key={filter.key}
            style={[styles.periodTab, reportPeriod === filter.key && styles.periodTabActive]}
            onPress={() => setReportPeriod(filter.key)}
          >
            <Text style={[styles.periodTabText, reportPeriod === filter.key && styles.periodTabTextActive]}>
              {filter.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {reportView === 'overview' ? (
        <>
          <TextInput
            style={styles.searchInput}
            value={reportSearchText}
            onChangeText={setReportSearchText}
            placeholder={t.searchReceipts}
          />
          {Boolean(reportSearchText.trim()) && (
            <Text style={styles.searchResultText}>{t.searchResultCount(receipts.length)}</Text>
          )}

          <Text style={styles.sectionTitle}>{t.categoryBreakdown}</Text>
          <View style={styles.reportCard}>
            {categories.filter((category) => category.amount > 0).length === 0 && (
              <Text style={styles.emptyText}>{t.noReportData}</Text>
            )}
            {categories.filter((category) => category.amount > 0).map((category) => (
              <Pressable
                style={styles.barItem}
                key={category.key}
                onPress={() => onSelectCategory(category)}
              >
                <View style={styles.barTop}>
                  <Text style={styles.barName}>
                    {getCategoryIcon(category.key)} {getCategoryLabel(category.key, t)}
                  </Text>
                  <Text style={styles.barName}>{formatTL(category.amount)} ›</Text>
                </View>
                <View style={styles.barTrack}>
                  <View
                    style={[
                      styles.barFill,
                      {
                        width: `${Math.max(4, Math.round((category.amount / maxAmount) * 100))}%`,
                        backgroundColor: category.color,
                      },
                    ]}
                  />
                </View>
              </Pressable>
            ))}
          </View>

          <ReceiptList
            title={t.receiptArchive}
            subtitle={t.archiveInfo}
            receipts={receipts}
            onSelectReceipt={onSelectReceipt}
            onDeleteReceipt={onDeleteReceipt}
            openSwipeReceiptId={openSwipeReceiptId}
            setOpenSwipeReceiptId={setOpenSwipeReceiptId}
            t={t}
          />
        </>
      ) : (
        <>
          <MerchantList merchantGroups={merchantGroups} onSelectMerchant={onSelectMerchant} t={t} />
        </>
      )}
    </View>
  );
}

function MonthlyReceiptsScreen({
  monthlyGroups,
  selectedGroup,
  onSelectMonth,
  onClearMonth,
  onSelectReceipt,
  onDeleteReceipt,
  openSwipeReceiptId,
  setOpenSwipeReceiptId,
  t,
}) {
  if (selectedGroup) {
    return (
      <View>
        <View style={styles.reportHero}>
          <Text style={styles.label}>🧾 {t.monthlyReceiptsTitle}</Text>
          <Text style={styles.reportAmount}>{formatTL(selectedGroup.amount)}</Text>
          <View style={styles.reportInfoRow}>
            <View style={styles.reportInfoItem}>
              <Text style={styles.reportInfoLabel}>{t.selectedMonth}</Text>
              <Text style={styles.reportInfoValue}>{selectedGroup.label}</Text>
            </View>
            <View style={styles.reportInfoItem}>
              <Text style={styles.reportInfoLabel}>{t.receiptCount}</Text>
              <Text style={styles.reportInfoValue}>{selectedGroup.count}</Text>
            </View>
          </View>
        </View>

        <SecondaryButton label={t.back} onPress={onClearMonth} />

        <ReceiptList
          title={t.monthReceiptsTitle(selectedGroup.label)}
          subtitle={`${selectedGroup.count} ${t.receiptsShort}`}
          receipts={selectedGroup.receipts}
          onSelectReceipt={onSelectReceipt}
          onDeleteReceipt={onDeleteReceipt}
          openSwipeReceiptId={openSwipeReceiptId}
          setOpenSwipeReceiptId={setOpenSwipeReceiptId}
          t={t}
        />
      </View>
    );
  }

  return (
    <View>
      <View style={styles.reportHero}>
        <Text style={styles.label}>🧾 {t.monthlyReceiptsTitle}</Text>
        <Text style={styles.productsHeroText}>{t.monthlyReceiptsInfo}</Text>
      </View>

      <View style={styles.monthList}>
        {monthlyGroups.length === 0 && (
          <View style={styles.card}>
            <Text style={styles.emptyTitle}>{t.noReceipts}</Text>
            <Text style={styles.emptyText}>{t.noReceiptsText}</Text>
          </View>
        )}
        {monthlyGroups.map((group) => (
          <Pressable
            key={group.key}
            style={styles.monthRow}
            onPress={() => onSelectMonth(group)}
          >
            <View style={styles.monthIconBox}>
              <Text style={styles.monthIconText}>🧾</Text>
            </View>
            <View style={styles.receiptTextBlock}>
              <Text style={styles.monthTitle}>{group.label}</Text>
              <Text style={styles.rowMeta}>
                {group.count} {t.receiptsShort} - {t.tapMonthReceipts}
              </Text>
            </View>
            <View style={styles.merchantAmountBlock}>
              <Text style={styles.merchantAmount}>{formatTL(group.amount)}</Text>
              <Text style={styles.merchantChevron}>›</Text>
            </View>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

function ProductsScreen({
  productGroups,
  productPeriod,
  setProductPeriod,
  productMonthKey,
  setProductMonthKey,
  productMonthOptions,
  t,
}) {
  const [monthPickerOpen, setMonthPickerOpen] = useState(false);
  const productPeriodOptions = [
    { key: 'month', label: t.productMonthPeriod },
    { key: 'year', label: t.productThisYear },
    { key: 'all', label: t.allTime },
  ];
  const selectedProductMonth = productMonthOptions.find((month) => month.key === productMonthKey);

  return (
    <View>
      <View style={styles.periodTabs}>
        {productPeriodOptions.map((option) => (
          <Pressable
            key={option.key}
            style={[styles.periodTab, productPeriod === option.key && styles.periodTabActive]}
            onPress={() => setProductPeriod(option.key)}
          >
            <Text style={[styles.periodTabText, productPeriod === option.key && styles.periodTabTextActive]}>
              {option.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {productPeriod === 'month' && (
        <View>
          <Pressable
            style={styles.monthSelectButton}
            onPress={() => setMonthPickerOpen((isOpen) => !isOpen)}
          >
            <View>
              <Text style={styles.monthSelectLabel}>{t.productMonthSelect}</Text>
              <Text style={styles.monthSelectValue}>{selectedProductMonth?.label || formatMonthKey(productMonthKey)}</Text>
            </View>
            <Text style={styles.merchantChevron}>{monthPickerOpen ? '⌃' : '⌄'}</Text>
          </Pressable>

          {monthPickerOpen && (
            <View style={styles.monthPickerCard}>
              {productMonthOptions.map((month) => (
                <Pressable
                  key={month.key}
                  style={[styles.monthPickerRow, productMonthKey === month.key && styles.monthPickerRowActive]}
                  onPress={() => {
                    setProductMonthKey(month.key);
                    setMonthPickerOpen(false);
                  }}
                >
                  <Text
                    style={[
                      styles.monthPickerText,
                      productMonthKey === month.key && styles.monthPickerTextActive,
                    ]}
                  >
                    {month.label}
                  </Text>
                  {productMonthKey === month.key && <Text style={styles.monthPickerCheck}>✓</Text>}
                </Pressable>
              ))}
            </View>
          )}
        </View>
      )}

      <Text style={styles.sectionTitle}>📦 {t.productBreakdown}</Text>
      <View style={styles.card}>
        {productGroups.length === 0 && <Text style={styles.emptyText}>{t.noProductDataText}</Text>}
        {productGroups.map((product, index) => (
          <View style={styles.productRow} key={product.key}>
            <View style={styles.productRank}>
              <Text style={styles.productRankText}>{index + 1}</Text>
            </View>
            <View style={styles.productRowTextBlock}>
              <Text style={styles.rowText}>{product.name}</Text>
              <Text style={styles.rowMeta}>
                {t.quantity}: {formatQuantity(product.quantity)}
                {product.unit ? ` ${product.unit}` : ''} - {product.count} {t.receiptsShort}
              </Text>
              {product.lastPrice > 0 && (
                <Text style={styles.rowMeta}>
                  {t.priceHistory}: {t.lastPrice} {formatTL(product.lastPrice)} · {t.lowestPrice} {formatTL(product.lowestPrice)}
                </Text>
              )}
            </View>
            <Text style={styles.rowAmount}>{formatTL(product.amount)}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function SettingsScreen({
  salaryText,
  setSalaryText,
  incomeMonthKey,
  setIncomeMonthKey,
  salary,
  totalSpend,
  remaining,
  selectedLanguage,
  selectedCurrency,
  setSelectedCurrency,
  budgetsByCategory,
  setBudgetsByCategory,
  otherCategoryLabel,
  setOtherCategoryLabel,
  receiptSettings,
  updateReceiptSettings,
  recurringExpenses,
  setRecurringExpenses,
  activeSpace,
  setActiveSpace,
  settingsSection,
  setSettingsSection,
  onReport,
  onCreateBackup,
  onRestoreBackup,
  onExportCsv,
  onClearAllData,
  authProvider,
  onSignOut,
  onChooseAuthProvider,
  t,
}) {
  const [feedbackText, setFeedbackText] = useState('');
  const [recurringName, setRecurringName] = useState('');
  const [recurringAmount, setRecurringAmount] = useState('');
  const [recurringDay, setRecurringDay] = useState('');
  const [recurringMonth, setRecurringMonth] = useState(String(new Date().getMonth() + 1));
  const [recurringFrequency, setRecurringFrequency] = useState('monthly');
  const [recurringCategory, setRecurringCategory] = useState('home');
  const selectedCurrencyItem =
    currencies.find((currency) => currency.code === selectedCurrency) || currencies[0];

  async function sendFeedback() {
    const message = feedbackText.trim();

    if (!message) {
      Alert.alert(t.feedbackEmptyTitle, t.feedbackEmptyText);
      return;
    }

    try {
      await sendFeedbackMessage({
        message,
        language: selectedLanguage,
        currency: selectedCurrency,
      });
      setFeedbackText('');
      Alert.alert(
        t.feedbackSentTitle || translations.en.feedbackSentTitle,
        t.feedbackSentText || translations.en.feedbackSentText
      );
    } catch (error) {
      console.warn('Feedback could not be sent from the app.', error);
      const subject = encodeURIComponent('Reciro feedback');
      const body = encodeURIComponent(`${message}\n\n---\nLanguage: ${selectedLanguage}\nCurrency: ${selectedCurrency}`);
      const mailUrl = `mailto:${FEEDBACK_EMAIL}?subject=${subject}&body=${body}`;

      try {
        await Linking.openURL(mailUrl);
      } catch (mailError) {
        Alert.alert(t.feedbackMailTitle, t.feedbackMailText);
      }
    }
  }

  if (settingsSection === 'money') {
    return (
      <View>
        <View style={styles.settingsList}>
          <SettingsRow
            icon="💶"
            title={t.income}
            subtitle={`${formatTL(salary)} / ${t.remainingMoney}: ${formatTL(remaining)}`}
            value=">"
            onPress={() => setSettingsSection('income')}
          />
          <SettingsRow
            icon="💱"
            title={t.currency}
            subtitle={`${selectedCurrencyItem.symbol} ${selectedCurrencyItem.code}`}
            value=">"
            onPress={() => setSettingsSection('currency')}
          />
          <SettingsRow
            icon="🎯"
            title={t.budgets}
            subtitle={t.budgetsInfo}
            value=">"
            onPress={() => setSettingsSection('budgets')}
          />
          <SettingsRow
            icon="🔁"
            title={t.recurring}
            subtitle={t.recurringInfo}
            value=">"
            onPress={() => setSettingsSection('recurring')}
          />
        </View>

        <SecondaryButton label={t.back} onPress={() => setSettingsSection('main')} />
      </View>
    );
  }

  if (settingsSection === 'income') {
    return (
      <View>
        <View style={styles.monthSwitcher}>
          <SecondaryButton
            label={t.previousMonth}
            onPress={() => setIncomeMonthKey(moveMonthKey(incomeMonthKey, -1))}
          />
          <SecondaryButton
            label={t.nextMonth}
            onPress={() => setIncomeMonthKey(moveMonthKey(incomeMonthKey, 1))}
          />
        </View>

        <Text style={styles.inputLabel}>{t.incomeForMonth}</Text>
        <TextInput
          style={styles.input}
          value={salaryText}
          onChangeText={setSalaryText}
          keyboardType="number-pad"
          placeholder="0"
        />

        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.rowText}>{t.selectedMonth}</Text>
            <Text style={styles.rowAmount}>{formatMonthKey(incomeMonthKey)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.rowText}>{t.income}</Text>
            <Text style={styles.rowAmount}>{formatTL(salary)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.rowText}>{t.spending}</Text>
            <Text style={styles.rowAmount}>{formatTL(totalSpend)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalText}>{t.remainingMoney}</Text>
            <Text style={styles.totalText}>{formatTL(remaining)}</Text>
          </View>
        </View>

        <PrimaryButton label={t.reportButton} onPress={onReport} />
        <SecondaryButton label={t.back} onPress={() => setSettingsSection('main')} />
      </View>
    );
  }

  if (settingsSection === 'currency') {
    return (
      <View>
        <View style={styles.card}>
          <Text style={styles.analysisTitle}>{t.currency}</Text>
          <Text style={styles.analysisText}>{t.selectedCurrency(selectedCurrencyItem.symbol, selectedCurrencyItem.name)}</Text>
        </View>

        <View style={styles.settingsList}>
          {currencies.map((currency) => (
            <Pressable
              key={currency.code}
              style={styles.settingsRow}
              onPress={() => setSelectedCurrency(currency.code)}
            >
              <View style={styles.settingsIconBox}>
                <Text style={styles.settingsIconText}>{currency.symbol}</Text>
              </View>
              <View style={styles.settingsTextBlock}>
                <Text style={styles.settingsTitle}>{currency.name}</Text>
                <Text style={styles.settingsText}>{currency.code}</Text>
              </View>
              <Text style={styles.settingsValue}>
                {selectedCurrency === currency.code ? t.selected : ''}
              </Text>
            </Pressable>
          ))}
        </View>

        <SecondaryButton label={t.back} onPress={() => setSettingsSection('main')} />
      </View>
    );
  }

  if (settingsSection === 'backup') {
    return (
      <View>
        <View style={styles.card}>
          <Text style={styles.analysisTitle}>{t.dataControls}</Text>
          <Text style={styles.analysisText}>{t.backupInfo}</Text>
        </View>

        <PrimaryButton label={t.createBackup} onPress={onCreateBackup} />
        <SecondaryButton label={t.restoreBackup} onPress={onRestoreBackup} />
        <SecondaryButton label={t.exportCsv} onPress={onExportCsv} />
        <DangerButton label={t.clearAllData} onPress={onClearAllData} />
        <SecondaryButton label={t.back} onPress={() => setSettingsSection('main')} />
      </View>
    );
  }

  if (settingsSection === 'data') {
    return (
      <View>
        <View style={styles.card}>
          <Text style={styles.analysisTitle}>{t.dataControls}</Text>
          <Text style={styles.analysisText}>{t.backupInfo}</Text>
        </View>

        <View style={styles.settingsList}>
          <SettingsRow
            icon="📦"
            title={t.createBackup}
            subtitle={t.backupInfo}
            value=">"
            onPress={onCreateBackup}
          />
          <SettingsRow
            icon="↩️"
            title={t.restoreBackup}
            subtitle={t.noBackupText}
            value=">"
            onPress={onRestoreBackup}
          />
          <SettingsRow
            icon="📄"
            title={t.exportCsv}
            subtitle={t.archiveInfo}
            value=">"
            onPress={onExportCsv}
          />
          <SettingsRow
            icon="🗑️"
            title={t.clearAllData}
            subtitle={t.clearAllDataText}
            value=">"
            onPress={onClearAllData}
          />
        </View>

        <SecondaryButton label={t.back} onPress={() => setSettingsSection('main')} />
      </View>
    );
  }

  if (settingsSection === 'receipt') {
    return (
      <View>
        <View style={styles.card}>
          <Text style={styles.analysisTitle}>{t.receiptAndAnalysis}</Text>
          <Text style={styles.analysisText}>{t.autoAnalyzeReceiptsInfo}</Text>
        </View>

        <View style={styles.settingsList}>
          <SettingsRow
            icon="🤖"
            title={t.autoAnalyzeReceipts}
            subtitle={t.autoAnalyzeReceiptsInfo}
            value={receiptSettings.autoAnalyze ? t.enabled : t.disabled}
            onPress={() => updateReceiptSettings({ autoAnalyze: !receiptSettings.autoAnalyze })}
          />
          <SettingsRow
            icon="✅"
            title={t.reviewBeforeSave}
            subtitle={t.reviewBeforeSaveInfo}
            value={receiptSettings.reviewBeforeSave ? t.enabled : t.disabled}
            onPress={() => updateReceiptSettings({ reviewBeforeSave: !receiptSettings.reviewBeforeSave })}
          />
          <SettingsRow
            icon="🖼️"
            title={t.keepReceiptPhotos}
            subtitle={t.keepReceiptPhotosInfo}
            value={receiptSettings.keepPhotos ? t.enabled : t.disabled}
            onPress={() => updateReceiptSettings({ keepPhotos: !receiptSettings.keepPhotos })}
          />
        </View>

        <Text style={styles.settingGroupTitle}>{t.defaultCategory}</Text>
        <View style={styles.card}>
          <Text style={styles.settingsTitle}>{t.otherCategoryName}</Text>
          <Text style={styles.settingsText}>{t.defaultCategoryInfo}</Text>
          <TextInput
            style={styles.inlineSettingsInput}
            value={otherCategoryLabel}
            onChangeText={setOtherCategoryLabel}
            placeholder={t.otherCategoryPlaceholder}
            returnKeyType="done"
          />
        </View>
        <View style={styles.settingsList}>
          {categoryOptions.map((category) => (
            <Pressable
              key={category.key}
              style={styles.settingsRow}
              onPress={() => updateReceiptSettings({ defaultCategory: category.key })}
            >
              <View style={styles.settingsIconBox}>
                <Text style={styles.settingsIconText}>{category.icon}</Text>
              </View>
              <View style={styles.settingsTextBlock}>
                <Text style={styles.settingsTitle}>{getCategoryLabel(category.key, t)}</Text>
                <Text style={styles.settingsText}>{t.defaultCategoryInfo}</Text>
              </View>
              <Text style={styles.settingsValue}>
                {normalizeCategoryKey(receiptSettings.defaultCategory) === category.key ? t.selected : ''}
              </Text>
            </Pressable>
          ))}
        </View>

        <SecondaryButton label={t.back} onPress={() => setSettingsSection('main')} />
      </View>
    );
  }

  if (settingsSection === 'budgets') {
    return (
      <View>
        <View style={styles.card}>
          <Text style={styles.analysisTitle}>{t.budgets}</Text>
          <Text style={styles.analysisText}>{t.budgetsInfo}</Text>
        </View>

        <View style={styles.settingsList}>
          {categoryOptions.map((category) => (
            <View style={styles.settingsRow} key={category.key}>
              <View style={styles.settingsIconBox}>
                <Text style={styles.settingsIconText}>{category.icon}</Text>
              </View>
              <View style={styles.settingsTextBlock}>
                <Text style={styles.settingsTitle}>{getCategoryLabel(category.key, t)}</Text>
                {category.key === 'other' && (
                  <>
                    <Text style={styles.settingsText}>{t.otherCategoryName}</Text>
                    <TextInput
                      style={styles.inlineSettingsInput}
                      value={otherCategoryLabel}
                      onChangeText={setOtherCategoryLabel}
                      placeholder={t.otherCategoryPlaceholder}
                      returnKeyType="done"
                    />
                  </>
                )}
                <TextInput
                  style={styles.inlineSettingsInput}
                  value={String(budgetsByCategory[category.key] || '')}
                  onChangeText={(value) =>
                    setBudgetsByCategory((currentBudgets) => ({
                      ...currentBudgets,
                      [category.key]: value,
                    }))
                  }
                  keyboardType="decimal-pad"
                  placeholder={t.monthlyLimit}
                  returnKeyType="done"
                />
              </View>
            </View>
          ))}
        </View>

        <SecondaryButton label={t.back} onPress={() => setSettingsSection('main')} />
      </View>
    );
  }

  if (settingsSection === 'recurring') {
    function addRecurringExpense() {
      const name = recurringName.trim();
      const amount = parseAmount(recurringAmount);

      if (!name || amount <= 0) {
        Alert.alert(t.missingInfo, t.enterAmount);
        return;
      }

      setRecurringExpenses((currentExpenses) => [
        ...currentExpenses,
        {
          id: Date.now(),
          name,
          amountText: recurringAmount,
          day: Math.max(1, Math.min(31, Math.round(parseAmount(recurringDay) || 1))),
          dueMonth: Math.max(1, Math.min(12, Math.round(parseAmount(recurringMonth) || new Date().getMonth() + 1))),
          frequency: normalizeRecurringFrequency(recurringFrequency),
          startMonth: incomeMonthKey,
          category: recurringCategory,
          space: activeSpace,
          active: true,
        },
      ]);
      setRecurringName('');
      setRecurringAmount('');
      setRecurringDay('');
      setRecurringMonth(String(new Date().getMonth() + 1));
      setRecurringFrequency('monthly');
      setRecurringCategory('home');
    }

    return (
      <View>
        <View style={styles.card}>
          <Text style={styles.analysisTitle}>{t.recurring}</Text>
          <Text style={styles.analysisText}>{t.recurringInfo}</Text>
          <Text style={styles.analysisText}>{t.recurringIncludedInfo}</Text>
        </View>

        <Text style={styles.inputLabel}>{t.recurringFrequency}</Text>
        <View style={styles.currencyChipRow}>
          {[
            { key: 'monthly', label: t.recurringMonthly },
            { key: 'yearly', label: t.recurringYearly },
          ].map((option) => (
            <Pressable
              key={option.key}
              style={[styles.currencyChip, recurringFrequency === option.key && styles.currencyChipActive]}
              onPress={() => setRecurringFrequency(option.key)}
            >
              <Text style={[styles.currencyChipText, recurringFrequency === option.key && styles.currencyChipTextActive]}>
                {option.label}
              </Text>
            </Pressable>
          ))}
        </View>

        <TextInput
          style={styles.input}
          value={recurringName}
          onChangeText={setRecurringName}
          placeholder={t.recurringName}
        />
        <TextInput
          style={styles.input}
          value={recurringAmount}
          onChangeText={setRecurringAmount}
          keyboardType="decimal-pad"
          placeholder={recurringFrequency === 'yearly' ? t.recurringYearlyAmount : t.recurringAmount}
        />
        <TextInput
          style={styles.input}
          value={recurringDay}
          onChangeText={setRecurringDay}
          keyboardType="number-pad"
          placeholder={t.recurringDay}
        />
        {recurringFrequency === 'yearly' && (
          <TextInput
            style={styles.input}
            value={recurringMonth}
            onChangeText={setRecurringMonth}
            keyboardType="number-pad"
            placeholder={t.recurringMonth}
          />
        )}
        <Text style={styles.inputLabel}>{t.category}</Text>
        <View style={styles.receiptCategoryGrid}>
          {categoryOptions.map((category) => (
            <Pressable
              key={category.key}
              style={[
                styles.receiptCategoryButton,
                recurringCategory === category.key && styles.receiptCategoryButtonActive,
              ]}
              onPress={() => setRecurringCategory(category.key)}
            >
              <Text
                style={[
                  styles.receiptCategoryText,
                  recurringCategory === category.key && styles.receiptCategoryTextActive,
                ]}
              >
                {category.icon} {getCategoryLabel(category.key, t)}
              </Text>
            </Pressable>
          ))}
        </View>
        <PrimaryButton label={t.addRecurring} onPress={addRecurringExpense} />

        <View style={styles.card}>
          {recurringExpenses.length === 0 && <Text style={styles.emptyText}>{t.noRecurring}</Text>}
          {recurringExpenses.map((expense) => (
            <View
              style={styles.row}
              key={expense.id}
            >
              <View style={styles.receiptTextBlock}>
                <Text style={styles.rowText}>{expense.active === false ? '○ ' : '● '}{expense.name}</Text>
                <Text style={styles.rowMeta}>
                  {getCategoryIcon(expense.category)} {getCategoryLabel(expense.category || 'other', t)}
                  {' - '}
                  {normalizeRecurringFrequency(expense.frequency) === 'yearly' ? t.recurringYearly : t.recurringMonthly}
                  {' - '}
                  {normalizeRecurringFrequency(expense.frequency) === 'yearly' ? `${t.recurringMonth}: ${expense.dueMonth || 1}, ` : ''}
                  {t.recurringDay}: {expense.day || 1}
                </Text>
                <Pressable
                  hitSlop={8}
                  onPress={() =>
                    setRecurringExpenses((currentExpenses) =>
                      currentExpenses.map((item) =>
                        item.id === expense.id ? { ...item, active: item.active === false } : item
                      )
                    )
                  }
                >
                  <Text style={styles.rowHint}>
                    {expense.active === false ? t.recurringPaused : t.recurringActive}
                  </Text>
                </Pressable>
              </View>
              <View style={styles.merchantAmountBlock}>
                <Text style={styles.rowAmount}>{formatTL(parseAmount(expense.amountText))}</Text>
                {normalizeRecurringFrequency(expense.frequency) === 'yearly' && (
                  <Text style={styles.rowMeta}>
                    {formatTL(getRecurringMonthlyAmount(expense))} {t.recurringMonthlyEquivalent}
                  </Text>
                )}
                <Pressable
                  hitSlop={8}
                  onPress={() =>
                    setRecurringExpenses((currentExpenses) =>
                      currentExpenses.filter((item) => item.id !== expense.id)
                    )
                  }
                >
                  <Text style={styles.removeItemText}>{t.deleteRecurring}</Text>
                </Pressable>
              </View>
            </View>
          ))}
        </View>

        <SecondaryButton label={t.back} onPress={() => setSettingsSection('main')} />
      </View>
    );
  }

  if (settingsSection === 'spaces') {
    return (
      <View>
        <View style={styles.card}>
          <Text style={styles.analysisTitle}>{t.spaces}</Text>
          <Text style={styles.analysisText}>{t.spacesInfo}</Text>
        </View>

        <View style={styles.settingsList}>
          {appSpaces.map((space) => (
            <Pressable
              key={space.key}
              style={styles.settingsRow}
              onPress={() => setActiveSpace(space.key)}
            >
              <View style={styles.settingsIconBox}>
                <Text style={styles.settingsIconText}>{space.icon}</Text>
              </View>
              <View style={styles.settingsTextBlock}>
                <Text style={styles.settingsTitle}>{t[space.labelKey]}</Text>
                <Text style={styles.settingsText}>{t.activeSpace}</Text>
              </View>
              <Text style={styles.settingsValue}>{activeSpace === space.key ? t.selected : ''}</Text>
            </Pressable>
          ))}
        </View>

        <SecondaryButton label={t.back} onPress={() => setSettingsSection('main')} />
      </View>
    );
  }

  if (settingsSection === 'feedback') {
    return (
      <View>
        <View style={styles.card}>
          <Text style={styles.analysisTitle}>{t.feedbackTitle}</Text>
          <Text style={styles.analysisText}>{t.feedbackText}</Text>
        </View>

        <TextInput
          style={[styles.input, styles.feedbackInput]}
          value={feedbackText}
          onChangeText={setFeedbackText}
          placeholder={t.feedbackPlaceholder}
          multiline
          textAlignVertical="top"
        />

        <PrimaryButton label={t.sendFeedback} onPress={sendFeedback} />
        <SecondaryButton label={t.back} onPress={() => setSettingsSection('main')} />
      </View>
    );
  }

  if (settingsSection === 'premium') {
    return (
      <View>
        <View style={styles.card}>
          <Text style={styles.analysisTitle}>{t.premiumTitle}</Text>
          <Text style={styles.analysisText}>{t.premiumSubtitle}</Text>
          <View style={styles.premiumPriceRow}>
            <Text style={styles.premiumPriceText}>{t.premiumMonthly}</Text>
            <Text style={styles.premiumPriceText}>{t.premiumYearly}</Text>
          </View>
        </View>

        <View style={styles.settingsList}>
          {t.premiumBenefits.map((benefit) => (
            <View style={styles.settingsRow} key={benefit}>
              <View style={styles.premiumCheck}>
                <Text style={styles.premiumCheckText}>✓</Text>
              </View>
              <View style={styles.settingsTextBlock}>
                <Text style={styles.settingsTitle}>{benefit}</Text>
              </View>
            </View>
          ))}
        </View>

        <PrimaryButton
          label={t.startPremium}
          onPress={() => Alert.alert(t.premiumSetupTitle, t.premiumSetupText)}
        />
        <SecondaryButton
          label={t.restorePurchases}
          onPress={() => Alert.alert(t.restorePurchasesTitle, t.restorePurchasesText)}
        />
        <SecondaryButton label={t.back} onPress={() => setSettingsSection('main')} />
      </View>
    );
  }

  if (settingsSection === 'account') {
    return (
      <View>
        <View style={styles.card}>
          <Text style={styles.analysisTitle}>{t.accountSync}</Text>
          <Text style={styles.analysisText}>{t.accountSyncInfo}</Text>
          <View style={styles.syncStatusRow}>
            <Text style={styles.rowMeta}>{t.signedInWith(getAuthProviderLabel(authProvider))}</Text>
          </View>
        </View>

        <View style={styles.settingsList}>
          <SettingsRow
            icon=""
            title={t.signInWithApple}
            subtitle={t.backupInfo}
            value={authProvider === 'apple' ? '✓' : '>'}
            onPress={() => onChooseAuthProvider('apple')}
          />
          <SettingsRow
            icon="G"
            title={t.signInWithGoogle}
            subtitle={t.backupInfo}
            value={authProvider === 'google' ? '✓' : '>'}
            onPress={() => onChooseAuthProvider('google')}
          />
          <SettingsRow
            icon="↻"
            title={t.restorePurchases}
            subtitle={t.restorePurchasesInfo}
            value=">"
            onPress={() => Alert.alert(t.restorePurchasesTitle, t.restorePurchasesText)}
          />
          <SettingsRow
            icon="↩"
            title={t.signOut}
            subtitle={t.signOutMessage}
            value=">"
            onPress={onSignOut}
          />
        </View>
        <SecondaryButton label={t.back} onPress={() => setSettingsSection('main')} />
      </View>
    );
  }

  if (settingsSection === 'support') {
    return (
      <View>
        <View style={styles.card}>
          <Text style={styles.analysisTitle}>{t.feedbackTitle}</Text>
          <Text style={styles.analysisText}>{t.feedbackText}</Text>
        </View>

        <TextInput
          style={[styles.input, styles.feedbackInput]}
          value={feedbackText}
          onChangeText={setFeedbackText}
          placeholder={t.feedbackPlaceholder}
          multiline
          textAlignVertical="top"
        />

        <PrimaryButton label={t.sendFeedback} onPress={sendFeedback} />
        <SecondaryButton label={t.back} onPress={() => setSettingsSection('main')} />
      </View>
    );
  }

  if (settingsSection === 'privacy') {
    return (
      <View>
        <View style={styles.card}>
          <Text style={styles.analysisTitle}>{t.privacyAndLegal}</Text>
          <Text style={styles.analysisText}>{t.privacySummary}</Text>
        </View>

        <View style={styles.settingsList}>
          <SettingsRow
            icon="🔒"
            title={t.privacyPolicy}
            subtitle={t.privacySummary}
            value=">"
            onPress={() => setSettingsSection('privacyPolicy')}
          />
          <SettingsRow
            icon="📄"
            title={t.termsOfUse}
            subtitle={t.termsOfUse}
            value=">"
            onPress={() => setSettingsSection('termsOfUse')}
          />
          <SettingsRow
            icon="ℹ️"
            title={t.appVersion}
            subtitle="Reciro"
            value={Constants.expoConfig?.version || '1.0.0'}
          />
        </View>

        <SecondaryButton label={t.back} onPress={() => setSettingsSection('main')} />
      </View>
    );
  }

  if (settingsSection === 'privacyPolicy') {
    return (
      <View>
        <View style={styles.legalDocumentCard}>
          <Text style={styles.legalDocumentTitle}>{t.privacyPolicy}</Text>
          <Text style={styles.legalDocumentText}>{t.privacyPolicyText}</Text>
        </View>

        <SecondaryButton label={t.back} onPress={() => setSettingsSection('privacy')} />
      </View>
    );
  }

  if (settingsSection === 'termsOfUse') {
    return (
      <View>
        <View style={styles.legalDocumentCard}>
          <Text style={styles.legalDocumentTitle}>{t.termsOfUse}</Text>
          <Text style={styles.legalDocumentText}>{t.termsOfUseText}</Text>
        </View>

        <SecondaryButton label={t.back} onPress={() => setSettingsSection('privacy')} />
      </View>
    );
  }

  return (
    <View>
      <View style={styles.settingsList}>
        <SettingsRow
          icon="💶"
          title={t.moneyAndBudget}
          subtitle={`${t.income}, ${t.currency}, ${t.budgets}, ${t.recurring}`}
          value=">"
          onPress={() => setSettingsSection('money')}
        />
        <SettingsRow
          icon="🧾"
          title={t.receiptAndAnalysis}
          subtitle={t.autoAnalyzeReceiptsInfo}
          value=">"
          onPress={() => setSettingsSection('receipt')}
        />
        <SettingsRow
          icon="🗂️"
          title={t.dataControls}
          subtitle={t.backupInfo}
          value=">"
          onPress={() => setSettingsSection('data')}
        />
        <SettingsRow
          icon="💎"
          title={t.accountAndPremium}
          subtitle={t.accountSyncInfo}
          value=">"
          onPress={() => setSettingsSection('account')}
        />
        <SettingsRow
          icon="✉️"
          title={t.supportAndFeedback}
          subtitle={t.feedbackInfo}
          value=">"
          onPress={() => setSettingsSection('support')}
        />
        <SettingsRow
          icon="🔒"
          title={t.privacyAndLegal}
          subtitle={t.privacySummary}
          value=">"
          onPress={() => setSettingsSection('privacy')}
        />
      </View>
    </View>
  );
}

function SettingsRow({ icon, title, subtitle, value, onPress }) {
  return (
    <Pressable style={styles.settingsRow} onPress={onPress} disabled={!onPress}>
      {icon && (
        <View style={styles.settingsIconBox}>
          <Text style={styles.settingsIconText}>{icon}</Text>
        </View>
      )}
      <View style={styles.settingsTextBlock}>
        <Text style={styles.settingsTitle}>{title}</Text>
        <Text style={styles.settingsText}>{subtitle}</Text>
      </View>
      <Text style={styles.settingsValue}>{value}</Text>
    </Pressable>
  );
}

function ReceiptDetailScreen({
  receipt,
  editing,
  editStoreName,
  setEditStoreName,
  editAmountText,
  setEditAmountText,
  editDateText,
  setEditDateText,
  editCategory,
  setEditCategory,
  editCustomCategoryText,
  setEditCustomCategoryText,
  editReceiptKind,
  setEditReceiptKind,
  editReceiptImportant,
  setEditReceiptImportant,
  editWarrantyText,
  setEditWarrantyText,
  editNoteText,
  setEditNoteText,
  editItems,
  onUpdateEditItem,
  onAddEditItem,
  onRemoveEditItem,
  onSetTotalFromItems,
  onBack,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  onDelete,
  onPreviewImage,
  onOpenFile,
  t,
}) {
  const items = Array.isArray(receipt.items) ? receipt.items : [];
  const detailDate = normalizeDateDisplay(receipt.date, receipt.createdAt);

  return (
    <View>
      {receipt.image ? (
        <View style={styles.detailImageBox}>
          <Pressable style={styles.detailImagePressable} onPress={() => onPreviewImage(receipt.image)}>
            <Image source={{ uri: String(receipt.image) }} style={styles.detailImage} />
          </Pressable>
        </View>
      ) : receipt.file ? (
        <Pressable style={[styles.analysisCard, styles.fileDetailCard]} onPress={() => onOpenFile(receipt.file)}>
          <Text style={styles.fileDetailIcon}>PDF</Text>
          <View style={styles.fileDetailTextBlock}>
            <Text style={styles.analysisTitle}>{receipt.file.name || t.fileSaved}</Text>
            <Text style={styles.analysisText}>{t.fileSavedText}</Text>
            <Text style={styles.fileDetailAction}>{t.openFile}</Text>
          </View>
        </Pressable>
      ) : (
        <View style={styles.analysisCard}>
          <Text style={styles.analysisTitle}>{t.noPhoto}</Text>
          <Text style={styles.analysisText}>{t.noPhotoText}</Text>
        </View>
      )}

      {editing ? (
        <View>
          <Text style={styles.inputLabel}>{t.storeName}</Text>
          <TextInput
            style={styles.input}
            value={editStoreName}
            onChangeText={setEditStoreName}
            placeholder={t.placeholderStore}
          />

          <Text style={styles.inputLabel}>{t.totalAmount}</Text>
          <TextInput
            style={styles.input}
            value={editAmountText}
            onChangeText={setEditAmountText}
            keyboardType="decimal-pad"
            placeholder={t.placeholderAmount}
          />

          <Text style={styles.inputLabel}>{t.receiptType}</Text>
          <View style={styles.currencyChipRow}>
            {[
              { key: 'expense', label: t.expenseType },
              { key: 'refund', label: t.refundType },
            ].map((option) => (
              <Pressable
                key={option.key}
                style={[styles.currencyChip, editReceiptKind === option.key && styles.currencyChipActive]}
                onPress={() => setEditReceiptKind(option.key)}
              >
                <Text style={[styles.currencyChipText, editReceiptKind === option.key && styles.currencyChipTextActive]}>
                  {option.key === 'refund' ? '↩ ' : '+ '}{option.label}
                </Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.inputLabel}>{t.date}</Text>
          <TextInput
            style={styles.input}
            value={editDateText}
            onChangeText={setEditDateText}
            placeholder={detailDate}
          />

          <Text style={styles.inputLabel}>{t.category}</Text>
          <View style={styles.categoryGrid}>
            {categoryOptions.map((category) => (
              <Pressable
                key={category.key}
                style={[
                  styles.categoryButton,
                  editCategory === category.key && styles.categoryButtonActive,
                ]}
                onPress={() => {
                  setEditCategory(category.key);
                  if (category.key !== 'other') {
                    setEditCustomCategoryText('');
                  }
                }}
              >
                <View style={[styles.categoryDot, { backgroundColor: category.color }]} />
                <Text
                  style={[
                    styles.categoryButtonText,
                    editCategory === category.key && styles.categoryButtonTextActive,
                  ]}
                >
                  {category.icon} {getCategoryLabel(category.key, t)}
                </Text>
              </Pressable>
            ))}
          </View>
          {editCategory === 'other' && (
            <>
              <Text style={styles.inputLabel}>{t.customCategory}</Text>
              <TextInput
                style={styles.input}
                value={editCustomCategoryText}
                onChangeText={setEditCustomCategoryText}
                placeholder={t.customCategoryPlaceholder}
              />
            </>
          )}

          <Text style={styles.inputLabel}>{t.warranty}</Text>
          <TextInput
            style={styles.input}
            value={editWarrantyText}
            onChangeText={setEditWarrantyText}
            placeholder={formatReceiptDate(Date.now())}
          />

          <Pressable
            style={[styles.toggleRow, editReceiptImportant && styles.toggleRowActive]}
            onPress={() => setEditReceiptImportant(!editReceiptImportant)}
          >
            <Text style={styles.rowText}>{editReceiptImportant ? '⭐ ' : ''}{t.importantReceipt}</Text>
            <Text style={styles.settingsValue}>{editReceiptImportant ? t.selected : ''}</Text>
          </Pressable>

          <Text style={styles.inputLabel}>{t.note}</Text>
          <TextInput
            style={[styles.input, styles.feedbackInput]}
            value={editNoteText}
            onChangeText={setEditNoteText}
            placeholder={t.notePlaceholder}
            multiline
            textAlignVertical="top"
          />

          <Text style={styles.sectionTitle}>{t.editItems}</Text>
          <View style={styles.card}>
            {editItems.map((item, index) => (
              <View style={styles.editItemCard} key={item.id}>
                <View style={styles.editItemHeader}>
                  <Text style={styles.editItemTitle}>
                    {t.items} {index + 1}
                  </Text>
                  <Pressable onPress={() => onRemoveEditItem(item.id)}>
                    <Text style={styles.removeItemText}>{t.removeItem}</Text>
                  </Pressable>
                </View>

                <TextInput
                  style={styles.itemInput}
                  value={item.name}
                  onChangeText={(value) => onUpdateEditItem(item.id, 'name', value)}
                  placeholder={t.itemName}
                />

                <TextInput
                  style={styles.itemInput}
                  value={item.amountText}
                  onChangeText={(value) => onUpdateEditItem(item.id, 'amountText', value)}
                  keyboardType="decimal-pad"
                  placeholder={t.itemAmount}
                />

                <View style={styles.itemInlineInputs}>
                  <TextInput
                    style={[styles.itemInput, styles.itemInlineInput]}
                    value={item.quantityText}
                    onChangeText={(value) => onUpdateEditItem(item.id, 'quantityText', value)}
                    keyboardType="decimal-pad"
                    placeholder={t.quantity}
                  />
                  <TextInput
                    style={[styles.itemInput, styles.itemInlineInput]}
                    value={item.unit}
                    onChangeText={(value) => onUpdateEditItem(item.id, 'unit', value)}
                    placeholder={t.unit}
                  />
                </View>

                <View style={styles.itemCategoryGrid}>
                  {categoryOptions.map((category) => (
                    <Pressable
                      key={category.key}
                      style={[
                        styles.itemCategoryButton,
                        item.category === category.key && styles.itemCategoryButtonActive,
                      ]}
                      onPress={() => onUpdateEditItem(item.id, 'category', category.key)}
                    >
                      <Text
                        style={[
                          styles.itemCategoryText,
                          item.category === category.key && styles.itemCategoryTextActive,
                        ]}
                      >
                        {category.icon} {getCategoryLabel(category.key, t)}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            ))}

            <Pressable style={styles.addItemButton} onPress={onAddEditItem}>
              <Text style={styles.addItemText}>+ {t.addItem}</Text>
            </Pressable>
          </View>

          <PrimaryButton label={t.saveChanges} onPress={onSaveEdit} />
          <SecondaryButton label={t.cancel} onPress={onCancelEdit} />
        </View>
      ) : (
        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.rowText}>{t.storeName}</Text>
            <Text style={styles.rowAmount}>{receipt.store}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.rowText}>{t.convertedAmount}</Text>
            <Text style={styles.rowAmount}>{formatReceiptAmount(receipt)}</Text>
          </View>
          {normalizeReceiptKind(receipt.kind) === 'refund' && (
            <View style={styles.row}>
              <Text style={styles.rowText}>{t.receiptType}</Text>
              <Text style={styles.rowAmount}>↩ {t.refundBadge}</Text>
            </View>
          )}
          {receipt.important && (
            <View style={styles.row}>
              <Text style={styles.rowText}>{t.importantReceipt}</Text>
              <Text style={styles.rowAmount}>⭐ {t.markedImportant}</Text>
            </View>
          )}
          {Boolean(receipt.warrantyUntil) && (
            <View style={styles.row}>
              <Text style={styles.rowText}>{t.warrantyUntil}</Text>
              <Text style={styles.rowAmount}>{normalizeDateDisplay(receipt.warrantyUntil)}</Text>
            </View>
          )}
          {Boolean(receipt.note) && (
            <View style={styles.row}>
              <Text style={styles.rowText}>{t.note}</Text>
              <Text style={styles.rowAmount}>{receipt.note}</Text>
            </View>
          )}
          {receipt.originalCurrency && receipt.originalCurrency !== receipt.currency && (
            <View style={styles.row}>
              <Text style={styles.rowText}>{t.originalAmount}</Text>
              <Text style={styles.rowAmount}>
                {formatCurrencyAmount(receipt.originalAmount, receipt.originalCurrency)}
              </Text>
            </View>
          )}
          {Number(receipt.subtotalAmount) > 0 && (
            <View style={styles.row}>
              <Text style={styles.rowText}>{t.subtotalAmount}</Text>
              <Text style={styles.rowAmount}>{formatTL(receipt.subtotalAmount)}</Text>
            </View>
          )}
          {Number(receipt.taxAmount) > 0 && (
            <View style={styles.row}>
              <Text style={styles.rowText}>{t.taxAmount}</Text>
              <Text style={styles.rowAmount}>{formatTL(receipt.taxAmount)}</Text>
            </View>
          )}
          {Number(receipt.exchangeRate) > 0 && receipt.originalCurrency !== receipt.currency && (
            <View style={styles.row}>
              <Text style={styles.rowText}>{t.exchangeRate}</Text>
              <Text style={styles.rowAmount}>
                1 {getCurrencySymbol(receipt.originalCurrency)} = {formatCurrencyAmount(receipt.exchangeRate, receipt.currency)}
              </Text>
            </View>
          )}
          <View style={styles.row}>
            <Text style={styles.rowText}>{t.category}</Text>
            <Text style={styles.rowAmount}>{getCategoryLabel(receipt.category, t)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.rowText}>{t.date}</Text>
            <Text style={styles.rowAmount}>{detailDate}</Text>
          </View>
        </View>
      )}

      {!editing && <PrimaryButton label={t.editReceipt} onPress={onStartEdit} />}

      {items.length > 0 && (
        <View>
          <Text style={styles.sectionTitle}>{t.items}</Text>
          <View style={styles.card}>
            {items.map((item, index) => {
              const normalizedItem =
                typeof item === 'string'
                  ? { name: item, category: receipt.category, amount: null, quantity: 1, unit: '' }
                  : item;
              const itemCategory = normalizedItem.category || receipt.category;

              return (
                <View style={styles.row} key={`${normalizedItem.name}-${index}`}>
                  <View style={styles.receiptTextBlock}>
                    <Text style={styles.rowText}>{normalizedItem.name}</Text>
                    <Text style={styles.rowMeta}>{getCategoryLabel(itemCategory, t)}</Text>
                    <Text style={styles.rowMeta}>{getItemQuantityText(normalizedItem, t)}</Text>
                  </View>
                  {typeof normalizedItem.amount === 'number' && (
                    <Text style={styles.rowAmount}>
                      {normalizedItem.originalCurrency && normalizedItem.originalCurrency !== receipt.currency
                        ? formatCurrencyAmount(normalizedItem.originalAmount, normalizedItem.originalCurrency)
                        : formatTL(normalizedItem.amount)}
                    </Text>
                  )}
                </View>
              );
            })}
          </View>
        </View>
      )}

      {!editing && (
        <>
          <SecondaryButton label={t.back} onPress={onBack} />
          <DangerButton label={t.deleteReceipt} onPress={onDelete} />
        </>
      )}
    </View>
  );
}

function ReceiptList({
  title,
  subtitle,
  receipts,
  onSelectReceipt,
  onDeleteReceipt,
  openSwipeReceiptId,
  setOpenSwipeReceiptId,
  t,
}) {
  return (
    <View>
      {Boolean(title) && <Text style={styles.sectionTitle}>{title}</Text>}
      {subtitle && <Text style={styles.sectionSubtitle}>{subtitle}</Text>}
      <View style={styles.card}>
        {receipts.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>{t.noReceipts}</Text>
            <Text style={styles.emptyText}>{t.noReceiptsText}</Text>
          </View>
        )}
        {receipts.map((receipt) => (
          <SwipeableReceiptRow
            key={receipt.id}
            receipt={receipt}
            onSelectReceipt={onSelectReceipt}
            onDeleteReceipt={onDeleteReceipt}
            openSwipeReceiptId={openSwipeReceiptId}
            setOpenSwipeReceiptId={setOpenSwipeReceiptId}
            t={t}
          />
        ))}
      </View>
    </View>
  );
}

function SwipeableReceiptRow({
  receipt,
  onSelectReceipt,
  onDeleteReceipt,
  openSwipeReceiptId,
  setOpenSwipeReceiptId,
  t,
  rowVariant = 'default',
}) {
  const [deleteVisible, setDeleteVisible] = useState(false);
  const swipeTranslateX = useRef(new Animated.Value(0)).current;
  const canDelete = Boolean(onDeleteReceipt && !receipt.isRecurring);
  const isHomeRow = rowVariant === 'home';
  const isOpenFromOutside = openSwipeReceiptId === receipt.id;

  const animateSwipeTo = useCallback((value) => {
    Animated.spring(swipeTranslateX, {
      toValue: value,
      useNativeDriver: true,
      tension: 90,
      friction: 14,
    }).start();
  }, [swipeTranslateX]);

  const rowSwipeResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => false,
        onStartShouldSetPanResponderCapture: () => false,
        onMoveShouldSetPanResponderCapture: (_, gestureState) =>
          canDelete &&
          Math.abs(gestureState.dx) > 12 &&
          Math.abs(gestureState.dx) > Math.abs(gestureState.dy) * 1.15,
        onMoveShouldSetPanResponder: (_, gestureState) =>
          canDelete &&
          Math.abs(gestureState.dx) > 12 &&
          Math.abs(gestureState.dx) > Math.abs(gestureState.dy) * 1.15,
        onPanResponderTerminationRequest: () => false,
        onPanResponderGrant: () => {
          swipeTranslateX.stopAnimation();
        },
        onPanResponderMove: (_, gestureState) => {
          if (!canDelete) {
            return;
          }

          const baseOffset = deleteVisible ? -96 : 0;
          const nextOffset = Math.max(-110, Math.min(0, baseOffset + gestureState.dx));
          swipeTranslateX.setValue(nextOffset);
        },
        onPanResponderRelease: (_, gestureState) => {
          if (gestureState.dx < -38 || gestureState.vx < -0.3) {
            setDeleteVisible(true);
            setOpenSwipeReceiptId?.(receipt.id);
            animateSwipeTo(-96);
            return;
          }

          if (deleteVisible && gestureState.dx > 26) {
            setDeleteVisible(false);
            setOpenSwipeReceiptId?.(null);
            animateSwipeTo(0);
            return;
          }

          if (deleteVisible) {
            animateSwipeTo(-96);
            return;
          }

          setDeleteVisible(false);
          setOpenSwipeReceiptId?.(null);
          animateSwipeTo(0);
        },
      }),
    [animateSwipeTo, canDelete, deleteVisible, receipt.id, setOpenSwipeReceiptId, swipeTranslateX]
  );

  useEffect(() => {
    if (deleteVisible && !isOpenFromOutside) {
      setDeleteVisible(false);
      animateSwipeTo(0);
    }
  }, [animateSwipeTo, deleteVisible, isOpenFromOutside]);

  return (
    <View style={styles.swipeReceiptShell} {...rowSwipeResponder.panHandlers}>
      {canDelete && (
        <Pressable
          style={styles.swipeDeleteButton}
          onTouchStart={(event) => event.stopPropagation?.()}
          onPress={() => {
            setDeleteVisible(false);
            setOpenSwipeReceiptId?.(null);
            animateSwipeTo(0);
            onDeleteReceipt(receipt);
          }}
        >
          <Text style={styles.swipeDeleteText}>{t.deleteConfirm}</Text>
        </Pressable>
      )}
      <Animated.View
        style={[
          styles.swipeReceiptContent,
          {
            transform: [{ translateX: swipeTranslateX }],
          },
        ]}
      >
        <Pressable
          style={isHomeRow ? styles.homeReceiptRow : styles.row}
          onPress={() => {
            if (openSwipeReceiptId && openSwipeReceiptId !== receipt.id) {
              setOpenSwipeReceiptId?.(null);
              return;
            }

            if (deleteVisible) {
              setDeleteVisible(false);
              setOpenSwipeReceiptId?.(null);
              animateSwipeTo(0);
              return;
            }

            if (!receipt.isRecurring) {
              onSelectReceipt?.(receipt);
            }
          }}
          disabled={Boolean(receipt.isRecurring)}
        >
          <View style={styles.receiptTextBlock}>
            <Text style={isHomeRow ? styles.homeReceiptStore : styles.rowText}>{receipt.store}</Text>
            <Text style={styles.rowMeta}>
              {getCategoryLabel(receipt.category, t)} - {normalizeDateDisplay(receipt.date, receipt.createdAt)}
              {receipt.isRecurring ? ` - ${t.recurring}` : receipt.image ? ` - ${t?.photoAvailable || 'photo'}` : ''}
            </Text>
            {onSelectReceipt && !receipt.isRecurring && <Text style={styles.rowHint}>{t?.tapForDetails}</Text>}
          </View>
          <Text style={isHomeRow ? styles.homeReceiptAmount : styles.rowAmount}>{formatReceiptAmount(receipt)}</Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}

function MerchantList({ merchantGroups, onSelectMerchant, t }) {
  return (
    <View>
      <Text style={styles.sectionTitle}>{t.merchantBreakdown}</Text>
      <View style={styles.merchantCard}>
        {merchantGroups.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>{t.noReportData}</Text>
            <Text style={styles.emptyText}>{t.noReceiptsText}</Text>
          </View>
        )}
        {merchantGroups.slice(0, 6).map((merchant) => {
          const itemSummary = [...new Set(merchant.items)].slice(0, 3).join(', ');

          return (
            <Pressable
              style={styles.merchantRow}
              key={merchant.key}
              onPress={() => onSelectMerchant?.(merchant)}
            >
              <View style={styles.receiptTextBlock}>
                <Text style={styles.merchantName}>{merchant.store}</Text>
                <Text style={styles.rowMeta}>
                  {merchant.count} {t.receiptsShort}
                  {itemSummary ? ` - ${t.boughtItems}: ${itemSummary}` : ''}
                </Text>
                <Text style={styles.rowHint}>{t.tapMerchantReceipts}</Text>
              </View>
              <View style={styles.merchantAmountBlock}>
                <Text style={styles.merchantAmount}>{formatTL(merchant.amount)}</Text>
                <Text style={styles.merchantChevron}>›</Text>
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function HomeReceiptList({
  title,
  receipts,
  onSelectReceipt,
  onDeleteReceipt,
  openSwipeReceiptId,
  setOpenSwipeReceiptId,
  t,
}) {
  return (
    <View>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.homeReceiptCard}>
        {receipts.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>{t.noReceipts}</Text>
            <Text style={styles.emptyText}>{t.noReceiptsText}</Text>
          </View>
        )}
        {receipts.map((receipt) => (
          <SwipeableReceiptRow
            key={receipt.id}
            receipt={receipt}
            onSelectReceipt={onSelectReceipt}
            onDeleteReceipt={onDeleteReceipt}
            openSwipeReceiptId={openSwipeReceiptId}
            setOpenSwipeReceiptId={setOpenSwipeReceiptId}
            t={t}
            rowVariant="home"
          />
        ))}
      </View>
    </View>
  );
}

function ImagePreviewModal({ imageUri, onClose, closeLabel }) {
  return (
    <Modal visible={Boolean(imageUri)} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.previewOverlay}>
        {imageUri && (
          <ScrollView
            style={styles.previewZoomScroll}
            contentContainerStyle={styles.previewImageFrame}
            maximumZoomScale={4}
            minimumZoomScale={1}
            bouncesZoom
            centerContent
            showsHorizontalScrollIndicator={false}
            showsVerticalScrollIndicator={false}
          >
            <Image source={{ uri: imageUri }} style={styles.previewImage} />
          </ScrollView>
        )}
        <Pressable style={styles.previewCloseButton} onPress={onClose}>
          <Text style={styles.previewCloseText}>{closeLabel}</Text>
        </Pressable>
      </View>
    </Modal>
  );
}

function Metric({ title, value }) {
  return (
    <View style={styles.metric}>
      <Text style={styles.metricTitle}>{title}</Text>
      <Text style={styles.metricValue}>{value}</Text>
    </View>
  );
}

function PrimaryButton({ label, onPress }) {
  return (
    <Pressable style={styles.primaryButton} onPress={onPress}>
      <Text style={styles.primaryText}>{label}</Text>
    </Pressable>
  );
}

function SecondaryButton({ label, onPress }) {
  return (
    <Pressable style={styles.secondaryButton} onPress={onPress}>
      <Text style={styles.secondaryText}>{label}</Text>
    </Pressable>
  );
}

function DangerButton({ label, onPress }) {
  return (
    <Pressable style={styles.dangerButton} onPress={onPress}>
      <Text style={styles.dangerText}>{label}</Text>
    </Pressable>
  );
}

function PhotoOptionsSheet({ visible, onClose, onTakePhoto, onPickImage, onPickFile, t }) {
  function handleTakePhoto() {
    onTakePhoto();
  }

  function handlePickImage() {
    onPickImage();
  }

  function handlePickFile() {
    onPickFile();
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.sheetOverlay}>
        <Pressable style={styles.sheetBackdrop} onPress={onClose} />
        <View style={styles.photoSheet}>
          <View style={styles.sheetHandle} />
          <Text style={styles.photoSheetTitle}>{t.addReceiptPhoto}</Text>

          <Pressable style={styles.photoSheetOption} onPress={handleTakePhoto}>
            <CameraGlyph />
            <View style={styles.receiptTextBlock}>
              <Text style={styles.photoOptionTitle}>{t.takePhoto}</Text>
              <Text style={styles.photoOptionText}>{t.takePhotoHelp}</Text>
            </View>
          </Pressable>

          <Pressable style={styles.photoSheetOption} onPress={handlePickImage}>
            <GalleryGlyph />
            <View style={styles.receiptTextBlock}>
              <Text style={styles.photoOptionTitle}>{t.chooseFromGallery}</Text>
              <Text style={styles.photoOptionText}>{t.chooseFromGalleryHelp}</Text>
            </View>
          </Pressable>

          <Pressable style={styles.photoSheetOption} onPress={handlePickFile}>
            <FileGlyph />
            <View style={styles.receiptTextBlock}>
              <Text style={styles.photoOptionTitle}>{t.pickFile}</Text>
              <Text style={styles.photoOptionText}>{t.pickFileHelp}</Text>
            </View>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

function ReciroCameraScreen({ t, onCancel, onUsePhoto }) {
  const cameraRef = useRef(null);
  const [capturedUri, setCapturedUri] = useState('');
  const [cameraBusy, setCameraBusy] = useState(false);

  async function capturePhoto() {
    if (!cameraRef.current || cameraBusy) {
      return;
    }

    try {
      setCameraBusy(true);
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.85,
        skipProcessing: false,
      });

      if (photo?.uri) {
        setCapturedUri(photo.uri);
      }
    } catch (error) {
      console.warn('Custom camera capture failed.', error);
      Alert.alert(t.cameraOpenErrorTitle, t.cameraOpenErrorText);
    } finally {
      setCameraBusy(false);
    }
  }

  return (
    <SafeAreaView style={styles.cameraScreen}>
      <StatusBar style="light" />
      {capturedUri ? (
        <Image source={{ uri: capturedUri }} style={styles.cameraPreviewImage} />
      ) : (
        <CameraView ref={cameraRef} style={styles.cameraPreview} facing="back">
          <View style={styles.cameraFrame}>
            <View style={styles.cameraCornerTopLeft} />
            <View style={styles.cameraCornerTopRight} />
            <View style={styles.cameraCornerBottomLeft} />
            <View style={styles.cameraCornerBottomRight} />
          </View>
        </CameraView>
      )}

      <View style={styles.cameraControls}>
        {capturedUri ? (
          <>
            <Pressable style={styles.cameraSecondaryButton} onPress={() => setCapturedUri('')}>
              <Text style={styles.cameraSecondaryText}>{t.cameraRetake}</Text>
            </Pressable>
            <Pressable style={styles.cameraPrimaryButton} onPress={() => onUsePhoto(capturedUri)}>
              <Text style={styles.cameraPrimaryText}>{t.cameraUsePhoto}</Text>
            </Pressable>
          </>
        ) : (
          <>
            <Pressable style={styles.cameraSecondaryButton} onPress={onCancel}>
              <Text style={styles.cameraSecondaryText}>{t.cancel}</Text>
            </Pressable>
            <Pressable style={styles.cameraShutterButton} onPress={capturePhoto} disabled={cameraBusy}>
              <View style={styles.cameraShutterInner} />
            </Pressable>
            <View style={styles.cameraSidePlaceholder} />
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

function FileGlyph() {
  return (
    <View style={styles.glyphBoxSecondary}>
      <Text style={styles.fileGlyphText}>PDF</Text>
    </View>
  );
}

function CameraGlyph() {
  return (
    <View style={styles.glyphBoxPrimary}>
      <View style={styles.cameraTop} />
      <View style={styles.cameraBody}>
        <View style={styles.cameraLens} />
      </View>
    </View>
  );
}

function GalleryGlyph() {
  return (
    <View style={styles.glyphBoxSecondary}>
      <View style={styles.galleryFrame}>
        <View style={styles.gallerySun} />
        <View style={styles.galleryMountain} />
      </View>
    </View>
  );
}

function NavButton({ icon, label, active, onPress }) {
  return (
    <Pressable style={[styles.navButton, active && styles.navButtonActive]} onPress={onPress}>
      <Text style={[styles.navIcon, active && styles.navTextActive]}>{icon}</Text>
      <Text style={[styles.navText, active && styles.navTextActive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f4f7f4',
  },
  app: {
    flex: 1,
    backgroundColor: '#f4f7f4',
  },
  authScreen: {
    flex: 1,
    backgroundColor: '#f4f7f4',
    justifyContent: 'center',
    padding: 24,
  },
  authBrandBlock: {
    alignItems: 'center',
    marginBottom: 28,
  },
  authLogoMark: {
    alignItems: 'center',
    backgroundColor: '#157f3b',
    borderRadius: 18,
    height: 64,
    justifyContent: 'center',
    marginBottom: 14,
    width: 64,
  },
  authLogoText: {
    color: '#ffffff',
    fontSize: 32,
    fontWeight: '900',
  },
  authBrandName: {
    color: '#172018',
    fontSize: 34,
    fontWeight: '900',
    textAlign: 'center',
  },
  authSubtitle: {
    color: '#68766b',
    fontSize: 15,
    fontWeight: '700',
    marginTop: 4,
    textAlign: 'center',
  },
  authCard: {
    backgroundColor: '#ffffff',
    borderColor: '#dfe8e0',
    borderRadius: 8,
    borderWidth: 1,
    padding: 20,
  },
  authTitle: {
    color: '#172018',
    fontSize: 24,
    fontWeight: '900',
    textAlign: 'center',
  },
  authText: {
    color: '#68766b',
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
    marginTop: 8,
    textAlign: 'center',
  },
  authButton: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderColor: '#dfe8e0',
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'center',
    marginTop: 14,
    paddingHorizontal: 16,
    paddingVertical: 15,
  },
  authButtonDark: {
    backgroundColor: '#172018',
    borderColor: '#172018',
    marginTop: 22,
  },
  authButtonIcon: {
    color: '#172018',
    fontSize: 19,
    fontWeight: '900',
    minWidth: 22,
    textAlign: 'center',
  },
  authButtonText: {
    color: '#172018',
    fontSize: 16,
    fontWeight: '900',
  },
  authButtonTextDark: {
    color: '#ffffff',
  },
  authFootnote: {
    color: '#68766b',
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 17,
    marginTop: 16,
    textAlign: 'center',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    position: 'relative',
  },
  headerTitle: {
    alignItems: 'center',
    flex: 1,
  },
  headerBackButton: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderColor: '#dfe8e0',
    borderRadius: 999,
    borderWidth: 1,
    height: 42,
    justifyContent: 'center',
    left: 20,
    position: 'absolute',
    top: 14,
    width: 42,
    zIndex: 2,
  },
  headerBackText: {
    color: '#172018',
    fontSize: 34,
    fontWeight: '700',
    lineHeight: 36,
  },
  appName: {
    color: '#172018',
    fontSize: 28,
    fontWeight: '900',
    textAlign: 'center',
  },
  muted: {
    color: '#68766b',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  content: {
    padding: 20,
    paddingBottom: 132,
  },
  hero: {
    backgroundColor: '#eaf8ec',
    borderColor: '#dceade',
    borderWidth: 1,
    borderRadius: 8,
    padding: 20,
  },
  homeHero: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderColor: '#dfe8e0',
    borderWidth: 1,
    borderRadius: 8,
    padding: 20,
  },
  label: {
    color: '#0d5f2b',
    fontSize: 12,
    fontWeight: '900',
    textAlign: 'center',
  },
  homeAmount: {
    color: '#172018',
    fontSize: 44,
    fontWeight: '900',
    marginTop: 8,
    textAlign: 'center',
  },
  homeHeroText: {
    color: '#4f5d52',
    fontSize: 14,
    lineHeight: 20,
    marginTop: 8,
    textAlign: 'center',
  },
  reportHero: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderColor: '#dfe8e0',
    borderWidth: 1,
    borderRadius: 8,
    padding: 20,
  },
  reportAmount: {
    color: '#172018',
    fontSize: 40,
    fontWeight: '900',
    marginTop: 8,
    textAlign: 'center',
  },
  reportInfoRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 18,
    width: '100%',
  },
  reportInfoItem: {
    flex: 1,
    backgroundColor: '#eaf8ec',
    borderRadius: 8,
    padding: 10,
  },
  reportInfoItemWarning: {
    backgroundColor: '#fff0f0',
  },
  reportInfoLabel: {
    color: '#68766b',
    fontSize: 11,
    fontWeight: '800',
  },
  reportInfoValue: {
    color: '#172018',
    fontSize: 14,
    fontWeight: '900',
    marginTop: 6,
  },
  reportViewTabs: {
    backgroundColor: '#ffffff',
    borderColor: '#dfe8e0',
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 6,
    marginTop: 12,
    padding: 5,
  },
  reportViewTab: {
    alignItems: 'center',
    borderRadius: 7,
    flex: 1,
    paddingHorizontal: 8,
    paddingVertical: 11,
  },
  reportViewTabActive: {
    backgroundColor: '#157f3b',
  },
  reportViewTabText: {
    color: '#68766b',
    fontSize: 12,
    fontWeight: '900',
    textAlign: 'center',
  },
  reportViewTabTextActive: {
    color: '#ffffff',
  },
  periodTabs: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  periodTab: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderColor: '#dfe8e0',
    borderWidth: 1,
    borderRadius: 8,
    alignItems: 'center',
    paddingVertical: 11,
    paddingHorizontal: 6,
  },
  periodTabActive: {
    backgroundColor: '#e6f5ea',
    borderColor: '#157f3b',
  },
  periodTabText: {
    color: '#68766b',
    fontSize: 12,
    fontWeight: '900',
    textAlign: 'center',
  },
  periodTabTextActive: {
    color: '#0d5f2b',
  },
  searchInput: {
    backgroundColor: '#fff',
    borderColor: '#dfe8e0',
    borderWidth: 1,
    borderRadius: 8,
    color: '#172018',
    fontSize: 15,
    fontWeight: '800',
    marginTop: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  searchResultText: {
    color: '#68766b',
    fontSize: 12,
    fontWeight: '800',
    marginTop: 8,
  },
  heroAmount: {
    color: '#172018',
    fontSize: 42,
    fontWeight: '900',
    marginTop: 6,
  },
  heroText: {
    color: '#4f5d52',
    fontSize: 15,
    lineHeight: 22,
    marginTop: 8,
  },
  formTitle: {
    color: '#172018',
    fontSize: 28,
    fontWeight: '900',
    marginTop: 6,
  },
  photoBox: {
    minHeight: 190,
    borderWidth: 1,
    borderColor: '#dfe8e0',
    borderRadius: 8,
    backgroundColor: '#fff',
    overflow: 'hidden',
    marginTop: 14,
  },
  receiptPhotoBox: {
    minHeight: 210,
    borderWidth: 1,
    borderColor: '#dfe8e0',
    borderRadius: 8,
    backgroundColor: '#fff',
    overflow: 'hidden',
    marginTop: 12,
  },
  receiptImage: {
    width: '100%',
    height: 230,
    resizeMode: 'cover',
  },
  filePreviewBox: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 210,
    padding: 18,
  },
  filePreviewIcon: {
    backgroundColor: '#e6f5ea',
    borderRadius: 8,
    color: '#0d5f2b',
    fontSize: 18,
    fontWeight: '900',
    overflow: 'hidden',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  filePreviewTitle: {
    color: '#172018',
    fontSize: 17,
    fontWeight: '900',
    marginTop: 12,
    textAlign: 'center',
  },
  filePreviewText: {
    color: '#68766b',
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 19,
    marginTop: 6,
    textAlign: 'center',
  },
  receiptStartCard: {
    backgroundColor: '#ffffff',
    borderColor: '#dfe8e0',
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 10,
    padding: 16,
  },
  receiptStartHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  receiptStartBadge: {
    alignItems: 'center',
    backgroundColor: '#e6f5ea',
    borderRadius: 999,
    height: 34,
    justifyContent: 'center',
    width: 46,
  },
  receiptStartBadgeText: {
    color: '#0d5f2b',
    fontSize: 13,
    fontWeight: '900',
  },
  receiptStartEyebrow: {
    color: '#0d5f2b',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  receiptStartTitle: {
    color: '#172018',
    fontSize: 26,
    fontWeight: '900',
    lineHeight: 30,
    marginTop: 3,
  },
  receiptStartText: {
    color: '#4f5d52',
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
    marginTop: 8,
  },
  receiptScanPanel: {
    alignItems: 'center',
    backgroundColor: '#fbfdfb',
    borderColor: '#e1e9e2',
    borderStyle: 'dashed',
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: 'center',
    marginTop: 16,
    minHeight: 150,
    overflow: 'hidden',
    padding: 18,
  },
  receiptScanLine: {
    backgroundColor: '#dff3e4',
    height: 2,
    left: 18,
    position: 'absolute',
    right: 18,
    top: 46,
  },
  receiptScanCenter: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderColor: '#dfe8e0',
    borderWidth: 1,
    borderRadius: 999,
    height: 54,
    justifyContent: 'center',
    marginBottom: 12,
    width: 54,
  },
  receiptScanIcon: {
    alignItems: 'center',
    backgroundColor: '#157f3b',
    borderRadius: 999,
    height: 34,
    justifyContent: 'center',
    width: 34,
  },
  receiptScanIconText: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: '900',
    lineHeight: 27,
  },
  detailImageBox: {
    alignItems: 'center',
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#dfe8e0',
    backgroundColor: '#fff',
    marginTop: 14,
  },
  detailImage: {
    width: '100%',
    height: 320,
    resizeMode: 'contain',
  },
  detailImagePressable: {
    width: '100%',
  },
  photoEmpty: {
    minHeight: 190,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 28,
  },
  photoIcon: {
    color: '#157f3b',
    fontSize: 40,
    marginBottom: 8,
  },
  photoTitle: {
    color: '#172018',
    fontSize: 18,
    fontWeight: '900',
  },
  photoText: {
    color: '#68766b',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 20,
  },
  sheetOverlay: {
    flex: 1,
    backgroundColor: 'rgba(23, 32, 24, 0.28)',
    justifyContent: 'flex-end',
    padding: 18,
  },
  sheetBackdrop: {
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
    zIndex: 1,
  },
  photoSheet: {
    backgroundColor: '#ffffff',
    borderColor: '#dfe8e0',
    borderRadius: 8,
    borderWidth: 1,
    padding: 14,
    ...Platform.select({
      web: {
        boxShadow: '0 10px 24px rgba(15, 36, 21, 0.16)',
      },
      default: {
        shadowColor: '#0f2415',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.16,
        shadowRadius: 24,
        elevation: 12,
      },
    }),
    zIndex: 2,
  },
  sheetHandle: {
    alignSelf: 'center',
    backgroundColor: '#dfe8e0',
    borderRadius: 999,
    height: 4,
    marginBottom: 12,
    width: 42,
  },
  photoSheetTitle: {
    color: '#172018',
    fontSize: 18,
    fontWeight: '900',
    marginBottom: 10,
  },
  photoSheetOption: {
    alignItems: 'center',
    backgroundColor: '#fbfdfb',
    borderColor: '#e1e9e2',
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 12,
    marginTop: 10,
    padding: 14,
  },
  glyphBoxPrimary: {
    alignItems: 'center',
    backgroundColor: '#157f3b',
    borderRadius: 999,
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  glyphBoxSecondary: {
    alignItems: 'center',
    backgroundColor: '#e6f5ea',
    borderRadius: 999,
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  cameraScreen: {
    backgroundColor: '#050805',
    flex: 1,
  },
  cameraPreview: {
    flex: 1,
  },
  cameraPreviewImage: {
    flex: 1,
    resizeMode: 'contain',
  },
  cameraFrame: {
    borderColor: 'rgba(255,255,255,0.28)',
    borderRadius: 8,
    borderWidth: 1,
    bottom: 150,
    left: 28,
    position: 'absolute',
    right: 28,
    top: 130,
  },
  cameraCornerTopLeft: {
    borderLeftColor: '#ffffff',
    borderLeftWidth: 4,
    borderTopColor: '#ffffff',
    borderTopWidth: 4,
    borderTopLeftRadius: 8,
    height: 42,
    left: -2,
    position: 'absolute',
    top: -2,
    width: 42,
  },
  cameraCornerTopRight: {
    borderRightColor: '#ffffff',
    borderRightWidth: 4,
    borderTopColor: '#ffffff',
    borderTopWidth: 4,
    borderTopRightRadius: 8,
    height: 42,
    position: 'absolute',
    right: -2,
    top: -2,
    width: 42,
  },
  cameraCornerBottomLeft: {
    borderBottomColor: '#ffffff',
    borderBottomWidth: 4,
    borderBottomLeftRadius: 8,
    borderLeftColor: '#ffffff',
    borderLeftWidth: 4,
    bottom: -2,
    height: 42,
    left: -2,
    position: 'absolute',
    width: 42,
  },
  cameraCornerBottomRight: {
    borderBottomColor: '#ffffff',
    borderBottomWidth: 4,
    borderBottomRightRadius: 8,
    borderRightColor: '#ffffff',
    borderRightWidth: 4,
    bottom: -2,
    height: 42,
    position: 'absolute',
    right: -2,
    width: 42,
  },
  cameraControls: {
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.72)',
    bottom: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    left: 0,
    paddingBottom: 28,
    paddingHorizontal: 24,
    paddingTop: 18,
    position: 'absolute',
    right: 0,
  },
  cameraSecondaryButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderRadius: 8,
    minWidth: 108,
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  cameraSecondaryText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '900',
  },
  cameraPrimaryButton: {
    alignItems: 'center',
    backgroundColor: '#157f3b',
    borderRadius: 8,
    flex: 1,
    marginLeft: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  cameraPrimaryText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '900',
  },
  cameraShutterButton: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderColor: 'rgba(255,255,255,0.5)',
    borderRadius: 999,
    borderWidth: 5,
    height: 76,
    justifyContent: 'center',
    width: 76,
  },
  cameraShutterInner: {
    backgroundColor: '#157f3b',
    borderRadius: 999,
    height: 54,
    width: 54,
  },
  cameraSidePlaceholder: {
    alignItems: 'center',
    minWidth: 108,
  },
  cameraTop: {
    backgroundColor: '#ffffff',
    borderRadius: 2,
    height: 4,
    marginBottom: -1,
    width: 13,
  },
  cameraBody: {
    alignItems: 'center',
    borderColor: '#ffffff',
    borderRadius: 5,
    borderWidth: 2,
    height: 19,
    justifyContent: 'center',
    width: 25,
  },
  cameraLens: {
    borderColor: '#ffffff',
    borderRadius: 999,
    borderWidth: 2,
    height: 9,
    width: 9,
  },
  galleryFrame: {
    borderColor: '#0d5f2b',
    borderRadius: 5,
    borderWidth: 2,
    height: 24,
    overflow: 'hidden',
    position: 'relative',
    width: 26,
  },
  gallerySun: {
    backgroundColor: '#0d5f2b',
    borderRadius: 999,
    height: 5,
    position: 'absolute',
    right: 4,
    top: 4,
    width: 5,
  },
  galleryMountain: {
    backgroundColor: '#0d5f2b',
    bottom: -5,
    height: 16,
    left: 4,
    position: 'absolute',
    transform: [{ rotate: '45deg' }],
    width: 16,
  },
  fileGlyphText: {
    color: '#0d5f2b',
    fontSize: 12,
    fontWeight: '900',
  },
  receiptActionButton: {
    alignItems: 'center',
    backgroundColor: '#157f3b',
    borderRadius: 8,
    marginTop: 12,
    paddingVertical: 14,
  },
  receiptActionText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '900',
  },
  receiptUsageText: {
    color: '#68766b',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 8,
    textAlign: 'center',
  },
  photoOptionButton: {
    backgroundColor: '#fbfdfb',
    borderColor: '#e1e9e2',
    borderWidth: 1,
    borderRadius: 8,
    padding: 15,
  },
  photoOptionTitle: {
    color: '#172018',
    fontSize: 15,
    fontWeight: '900',
  },
  photoOptionText: {
    color: '#68766b',
    fontSize: 13,
    fontWeight: '600',
    marginTop: 4,
  },
  scanBox: {
    minHeight: 190,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#b7d7bf',
    backgroundColor: '#fbfdfb',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
    marginVertical: 16,
  },
  scanIcon: {
    color: '#157f3b',
    fontSize: 54,
    fontWeight: '300',
    marginBottom: 4,
  },
  scanTitle: {
    color: '#172018',
    fontSize: 20,
    fontWeight: '900',
  },
  scanText: {
    color: '#68766b',
    fontSize: 14,
    lineHeight: 20,
    marginTop: 6,
    textAlign: 'center',
  },
  primaryButton: {
    backgroundColor: '#157f3b',
    borderRadius: 8,
    alignItems: 'center',
    paddingVertical: 16,
    marginTop: 12,
  },
  primaryText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '900',
  },
  secondaryButton: {
    backgroundColor: '#e6f5ea',
    borderRadius: 8,
    alignItems: 'center',
    paddingVertical: 16,
    marginTop: 10,
  },
  secondaryText: {
    color: '#0d5f2b',
    fontSize: 16,
    fontWeight: '900',
  },
  monthSwitcher: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  dangerButton: {
    backgroundColor: '#fff1f1',
    borderColor: '#f1b6b6',
    borderWidth: 1,
    borderRadius: 8,
    alignItems: 'center',
    paddingVertical: 16,
    marginTop: 10,
  },
  dangerText: {
    color: '#b42318',
    fontSize: 16,
    fontWeight: '900',
  },
  analysisCard: {
    backgroundColor: '#fff',
    borderColor: '#b7d7bf',
    borderWidth: 1,
    borderRadius: 8,
    padding: 14,
    marginTop: 12,
  },
  analysisTitle: {
    color: '#172018',
    fontSize: 16,
    fontWeight: '900',
  },
  analysisText: {
    color: '#4f5d52',
    fontSize: 14,
    lineHeight: 20,
    marginTop: 6,
  },
  fileDetailCard: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
  },
  fileDetailIcon: {
    backgroundColor: '#e6f6eb',
    borderRadius: 8,
    color: '#157f3b',
    fontSize: 15,
    fontWeight: '900',
    overflow: 'hidden',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  fileDetailTextBlock: {
    flex: 1,
  },
  fileDetailAction: {
    color: '#096b32',
    fontSize: 14,
    fontWeight: '900',
    marginTop: 8,
  },
  insightCard: {
    backgroundColor: '#fff',
    borderColor: '#dfe8e0',
    borderWidth: 1,
    borderRadius: 8,
    padding: 16,
    marginTop: 16,
  },
  insightTitle: {
    color: '#172018',
    fontSize: 17,
    fontWeight: '900',
  },
  insightText: {
    color: '#4f5d52',
    fontSize: 14,
    lineHeight: 20,
    marginTop: 6,
  },
  metricGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 16,
  },
  metric: {
    alignItems: 'center',
    width: '48.5%',
    backgroundColor: '#fff',
    borderColor: '#dfe8e0',
    borderWidth: 1,
    borderRadius: 8,
    padding: 14,
  },
  metricTitle: {
    color: '#68766b',
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 8,
    textAlign: 'center',
  },
  metricValue: {
    color: '#172018',
    fontSize: 19,
    fontWeight: '900',
    textAlign: 'center',
  },
  homeReceiptComposer: {
    marginTop: 10,
  },
  homeReceiptComposerFocused: {
    marginTop: 4,
  },
  card: {
    backgroundColor: '#fff',
    borderColor: '#dfe8e0',
    borderWidth: 1,
    borderRadius: 8,
    padding: 16,
    marginTop: 12,
  },
  legalDocumentCard: {
    backgroundColor: '#fff',
    borderColor: '#dfe8e0',
    borderWidth: 1,
    borderRadius: 8,
    padding: 18,
    marginTop: 12,
  },
  legalDocumentTitle: {
    color: '#172018',
    fontSize: 22,
    fontWeight: '900',
    lineHeight: 28,
  },
  legalDocumentText: {
    color: '#4f5d52',
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 23,
    marginTop: 14,
  },
  emptyState: {
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 22,
  },
  emptyTitle: {
    color: '#172018',
    fontSize: 17,
    fontWeight: '900',
    textAlign: 'center',
  },
  emptyText: {
    color: '#68766b',
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 19,
    marginTop: 7,
    textAlign: 'center',
  },
  reportCard: {
    backgroundColor: '#fff',
    borderColor: '#dfe8e0',
    borderWidth: 1,
    borderRadius: 8,
    padding: 16,
    marginTop: 12,
  },
  formCard: {
    backgroundColor: '#fff',
    borderColor: '#dfe8e0',
    borderWidth: 1,
    borderRadius: 8,
    padding: 14,
    marginTop: 12,
  },
  detailFieldsPanel: {
    borderTopColor: '#edf2ee',
    borderTopWidth: 1,
    marginTop: 12,
    paddingTop: 4,
  },
  reviewCard: {
    backgroundColor: '#f0faf2',
    borderColor: '#b7d7bf',
    borderWidth: 1,
    borderRadius: 8,
    padding: 14,
    marginTop: 12,
  },
  reviewCardWarning: {
    backgroundColor: '#fff9e8',
    borderColor: '#efd28a',
  },
  reviewTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  reviewTitle: {
    color: '#172018',
    flex: 1,
    fontSize: 16,
    fontWeight: '900',
  },
  reviewBadge: {
    color: '#0d5f2b',
    backgroundColor: '#dff3e4',
    borderRadius: 8,
    overflow: 'hidden',
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 12,
    fontWeight: '900',
  },
  reviewBadgeWarning: {
    color: '#8a5a00',
    backgroundColor: '#fff0c2',
  },
  reviewText: {
    color: '#4f5d52',
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 19,
    marginTop: 8,
  },
  reviewMeta: {
    color: '#68766b',
    fontSize: 12,
    fontWeight: '900',
    marginTop: 8,
  },
  reanalyzeButton: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderColor: '#b7d7bf',
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 12,
    paddingVertical: 12,
  },
  reanalyzeButtonText: {
    color: '#0d5f2b',
    fontSize: 14,
    fontWeight: '900',
  },
  homeReceiptCard: {
    backgroundColor: '#fff',
    borderColor: '#dfe8e0',
    borderWidth: 1,
    borderRadius: 8,
    marginTop: 12,
    overflow: 'hidden',
  },
  homeReceiptRow: {
    minHeight: 62,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomColor: '#edf2ee',
    borderBottomWidth: 1,
  },
  homeReceiptStore: {
    color: '#172018',
    fontSize: 15,
    fontWeight: '900',
  },
  homeReceiptAmount: {
    color: '#172018',
    fontSize: 16,
    fontWeight: '900',
  },
  merchantCard: {
    backgroundColor: '#fff',
    borderColor: '#dfe8e0',
    borderWidth: 1,
    borderRadius: 8,
    marginTop: 12,
    overflow: 'hidden',
  },
  merchantRow: {
    minHeight: 68,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderBottomColor: '#edf2ee',
    borderBottomWidth: 1,
  },
  merchantName: {
    color: '#172018',
    fontSize: 16,
    fontWeight: '900',
  },
  merchantAmount: {
    color: '#0d5f2b',
    fontSize: 16,
    fontWeight: '900',
  },
  merchantAmountBlock: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  merchantChevron: {
    color: '#97a59a',
    fontSize: 24,
    fontWeight: '900',
  },
  monthList: {
    backgroundColor: '#fff',
    borderColor: '#dfe8e0',
    borderWidth: 1,
    borderRadius: 8,
    marginTop: 12,
    overflow: 'hidden',
  },
  monthRow: {
    minHeight: 74,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
    borderBottomColor: '#edf2ee',
    borderBottomWidth: 1,
  },
  monthIconBox: {
    alignItems: 'center',
    backgroundColor: '#eaf8ec',
    borderRadius: 8,
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  monthIconText: {
    fontSize: 20,
  },
  monthTitle: {
    color: '#172018',
    fontSize: 17,
    fontWeight: '900',
  },
  clearSelectionText: {
    color: '#0d5f2b',
    fontSize: 12,
    fontWeight: '900',
  },
  productHeroRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
    marginTop: 10,
  },
  productsHero: {
    paddingVertical: 24,
  },
  productsHeroTitle: {
    color: '#172018',
    fontSize: 34,
    fontWeight: '900',
    lineHeight: 39,
    marginTop: 9,
    textAlign: 'center',
  },
  productsHeroText: {
    color: '#4f5d52',
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
    marginTop: 9,
    textAlign: 'center',
  },
  productTopCard: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderColor: '#dfe8e0',
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 16,
    padding: 18,
  },
  productHeroTextBlock: {
    flex: 1,
    alignItems: 'center',
  },
  productHeroName: {
    color: '#172018',
    fontSize: 22,
    fontWeight: '900',
    textAlign: 'center',
  },
  productHeroAmount: {
    color: '#0d5f2b',
    fontSize: 18,
    fontWeight: '900',
    minWidth: 76,
    textAlign: 'right',
  },
  monthSelectButton: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderColor: '#dfe8e0',
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  monthSelectLabel: {
    color: '#68766b',
    fontSize: 12,
    fontWeight: '900',
  },
  monthSelectValue: {
    color: '#172018',
    fontSize: 18,
    fontWeight: '900',
    marginTop: 4,
  },
  monthPickerCard: {
    backgroundColor: '#ffffff',
    borderColor: '#dfe8e0',
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 8,
    overflow: 'hidden',
  },
  monthPickerRow: {
    alignItems: 'center',
    borderBottomColor: '#edf2ee',
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  monthPickerRowActive: {
    backgroundColor: '#e6f5ea',
  },
  monthPickerText: {
    color: '#344337',
    fontSize: 15,
    fontWeight: '800',
  },
  monthPickerTextActive: {
    color: '#0d5f2b',
  },
  monthPickerCheck: {
    color: '#0d5f2b',
    fontSize: 16,
    fontWeight: '900',
  },
  productRow: {
    alignItems: 'center',
    borderBottomColor: '#edf2ee',
    borderBottomWidth: 1,
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 13,
  },
  productRowTextBlock: {
    flex: 1,
    justifyContent: 'center',
  },
  productRank: {
    alignItems: 'center',
    backgroundColor: '#e6f5ea',
    borderRadius: 999,
    height: 32,
    justifyContent: 'center',
    width: 32,
  },
  productRankText: {
    color: '#0d5f2b',
    fontSize: 13,
    fontWeight: '900',
  },
  previewOverlay: {
    flex: 1,
    backgroundColor: '#0b0f0d',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingBottom: 20,
    paddingTop: 48,
  },
  previewImageFrame: {
    alignItems: 'center',
    flexGrow: 1,
    justifyContent: 'center',
    minHeight: '100%',
    width: '100%',
  },
  previewZoomScroll: {
    flex: 1,
    width: '100%',
  },
  previewImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  previewCloseButton: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    alignItems: 'center',
    paddingVertical: 14,
    marginTop: 16,
  },
  previewCloseText: {
    color: '#172018',
    fontSize: 16,
    fontWeight: '900',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    paddingVertical: 12,
    borderBottomColor: '#edf2ee',
    borderBottomWidth: 1,
  },
  swipeReceiptShell: {
    backgroundColor: '#c62828',
    overflow: 'hidden',
    position: 'relative',
  },
  swipeReceiptContent: {
    backgroundColor: '#ffffff',
    zIndex: 1,
  },
  swipeDeleteButton: {
    alignItems: 'center',
    backgroundColor: '#c62828',
    bottom: 0,
    justifyContent: 'center',
    position: 'absolute',
    right: 0,
    top: 0,
    width: 96,
    zIndex: 0,
  },
  swipeDeleteText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '900',
  },
  receiptTextBlock: {
    flex: 1,
  },
  rowText: {
    color: '#344337',
    flex: 1,
    fontSize: 15,
    fontWeight: '800',
  },
  rowMeta: {
    color: '#68766b',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
  rowHint: {
    color: '#0d5f2b',
    fontSize: 12,
    fontWeight: '800',
    marginTop: 5,
  },
  rowAmount: {
    color: '#172018',
    fontSize: 15,
    fontWeight: '900',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    paddingTop: 14,
  },
  totalText: {
    color: '#172018',
    fontSize: 18,
    fontWeight: '900',
  },
  syncStatusRow: {
    backgroundColor: '#f4f7f4',
    borderColor: '#dfe8e0',
    borderWidth: 1,
    borderRadius: 8,
    marginTop: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  sectionTitle: {
    color: '#172018',
    fontSize: 19,
    fontWeight: '900',
    marginTop: 22,
  },
  sectionSubtitle: {
    color: '#68766b',
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 19,
    marginTop: 4,
  },
  barItem: {
    borderColor: 'transparent',
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 16,
    padding: 4,
  },
  barItemActive: {
    backgroundColor: '#e6f5ea',
    borderColor: '#157f3b',
  },
  barTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  barName: {
    color: '#172018',
    fontSize: 15,
    fontWeight: '900',
  },
  barTrack: {
    height: 10,
    borderRadius: 999,
    backgroundColor: '#edf2ee',
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 999,
  },
  inputLabel: {
    color: '#68766b',
    fontSize: 13,
    fontWeight: '800',
    marginTop: 18,
    marginBottom: 8,
  },
  firstInputLabel: {
    marginTop: 0,
  },
  input: {
    backgroundColor: '#fff',
    borderColor: '#dfe8e0',
    borderWidth: 1,
    borderRadius: 8,
    color: '#172018',
    fontSize: 18,
    fontWeight: '800',
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  feedbackInput: {
    minHeight: 150,
    lineHeight: 22,
  },
  toggleRow: {
    alignItems: 'center',
    backgroundColor: '#fbfdfb',
    borderColor: '#dfe8e0',
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'space-between',
    marginTop: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  toggleRowActive: {
    backgroundColor: '#e6f5ea',
    borderColor: '#157f3b',
  },
  manualSaveText: {
    color: '#68766b',
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
    marginTop: 10,
  },
  itemInput: {
    backgroundColor: '#fbfdfb',
    borderColor: '#dfe8e0',
    borderWidth: 1,
    borderRadius: 8,
    color: '#172018',
    fontSize: 15,
    fontWeight: '800',
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginTop: 10,
  },
  itemInlineInputs: {
    flexDirection: 'row',
    gap: 10,
  },
  itemInlineInput: {
    flex: 1,
  },
  editItemCard: {
    borderBottomColor: '#edf2ee',
    borderBottomWidth: 1,
    paddingBottom: 14,
    marginBottom: 14,
  },
  receiptItemEditCard: {
    borderBottomColor: '#edf2ee',
    borderBottomWidth: 1,
    paddingBottom: 14,
    marginBottom: 14,
  },
  compactItemHeader: {
    alignItems: 'center',
    backgroundColor: '#fbfdfb',
    borderColor: '#edf2ee',
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  compactItemDetails: {
    paddingTop: 10,
  },
  compactItemChevron: {
    color: '#0d5f2b',
    fontSize: 20,
    fontWeight: '900',
  },
  editItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  editItemTitle: {
    color: '#172018',
    fontSize: 15,
    fontWeight: '900',
  },
  removeItemText: {
    color: '#b42318',
    fontSize: 13,
    fontWeight: '900',
  },
  itemCategoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
  },
  itemCategoryButton: {
    borderColor: '#dfe8e0',
    borderWidth: 1,
    borderRadius: 8,
    backgroundColor: '#fff',
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  itemCategoryButtonActive: {
    borderColor: '#157f3b',
    backgroundColor: '#e6f5ea',
  },
  itemCategoryText: {
    color: '#68766b',
    fontSize: 12,
    fontWeight: '900',
  },
  itemCategoryTextActive: {
    color: '#0d5f2b',
  },
  receiptItemCategoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
  },
  receiptItemCategoryButton: {
    backgroundColor: '#fff',
    borderColor: '#dfe8e0',
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  receiptItemCategoryButtonActive: {
    backgroundColor: '#e6f5ea',
    borderColor: '#157f3b',
  },
  receiptItemCategoryText: {
    color: '#68766b',
    fontSize: 12,
    fontWeight: '900',
  },
  receiptItemCategoryTextActive: {
    color: '#0d5f2b',
  },
  receiptCategoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 2,
  },
  currencyChipRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  currencyChip: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderColor: '#dfe8e0',
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    paddingHorizontal: 10,
    paddingVertical: 12,
  },
  currencyChipActive: {
    backgroundColor: '#e6f5ea',
    borderColor: '#157f3b',
  },
  currencyChipText: {
    color: '#68766b',
    fontSize: 13,
    fontWeight: '900',
  },
  currencyChipTextActive: {
    color: '#0d5f2b',
  },
  receiptCategoryButton: {
    borderColor: '#dfe8e0',
    borderWidth: 1,
    borderRadius: 8,
    backgroundColor: '#fbfdfb',
    paddingHorizontal: 11,
    paddingVertical: 10,
  },
  receiptCategoryButtonActive: {
    borderColor: '#157f3b',
    backgroundColor: '#e6f5ea',
  },
  receiptCategoryText: {
    color: '#68766b',
    fontSize: 13,
    fontWeight: '900',
  },
  receiptCategoryTextActive: {
    color: '#0d5f2b',
  },
  addItemButton: {
    borderColor: '#157f3b',
    borderWidth: 1,
    borderRadius: 8,
    alignItems: 'center',
    paddingVertical: 13,
    backgroundColor: '#fff',
  },
  addItemText: {
    color: '#0d5f2b',
    fontSize: 14,
    fontWeight: '900',
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 2,
  },
  categoryButton: {
    width: '48.5%',
    minHeight: 46,
    borderWidth: 1,
    borderColor: '#dfe8e0',
    borderRadius: 8,
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    gap: 8,
  },
  categoryButtonActive: {
    borderColor: '#157f3b',
    backgroundColor: '#e6f5ea',
  },
  categoryDot: {
    width: 10,
    height: 10,
    borderRadius: 999,
  },
  categoryButtonText: {
    color: '#344337',
    fontSize: 14,
    fontWeight: '900',
  },
  categoryButtonTextActive: {
    color: '#0d5f2b',
  },
  settingsList: {
    backgroundColor: '#fff',
    borderColor: '#dfe8e0',
    borderWidth: 1,
    borderRadius: 8,
    marginTop: 16,
    overflow: 'hidden',
  },
  settingGroupTitle: {
    color: '#0d5f2b',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0,
    marginBottom: -6,
    marginTop: 18,
  },
  settingsRow: {
    minHeight: 68,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomColor: '#edf2ee',
    borderBottomWidth: 1,
    backgroundColor: '#fff',
  },
  settingsRowCompact: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomColor: '#edf2ee',
    borderBottomWidth: 1,
    backgroundColor: '#fbfdfb',
  },
  settingsTextBlock: {
    flex: 1,
  },
  settingsIconBox: {
    alignItems: 'center',
    backgroundColor: '#e6f5ea',
    borderRadius: 999,
    height: 34,
    justifyContent: 'center',
    width: 34,
  },
  settingsIconText: {
    fontSize: 16,
  },
  settingsTitle: {
    color: '#172018',
    fontSize: 16,
    fontWeight: '900',
  },
  settingsText: {
    color: '#68766b',
    fontSize: 13,
    fontWeight: '600',
    marginTop: 4,
  },
  inlineSettingsInput: {
    backgroundColor: '#fbfdfb',
    borderColor: '#dfe8e0',
    borderRadius: 8,
    borderWidth: 1,
    color: '#172018',
    fontSize: 15,
    fontWeight: '800',
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  settingsValue: {
    color: '#0d5f2b',
    fontSize: 15,
    fontWeight: '900',
  },
  premiumPriceRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 14,
  },
  premiumPriceText: {
    backgroundColor: '#e6f5ea',
    borderRadius: 8,
    color: '#0d5f2b',
    fontSize: 14,
    fontWeight: '900',
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  premiumCheck: {
    alignItems: 'center',
    backgroundColor: '#e6f5ea',
    borderRadius: 999,
    height: 28,
    justifyContent: 'center',
    marginRight: 12,
    width: 28,
  },
  premiumCheckText: {
    color: '#0d5f2b',
    fontSize: 16,
    fontWeight: '900',
  },
  navArea: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 14,
    backgroundColor: '#f4f7f4',
    borderTopColor: '#e1e9e2',
    borderTopWidth: 1,
  },
  pointerEventsBoxNone: {
    pointerEvents: 'box-none',
  },
  edgeBackZone: {
    bottom: 104,
    left: 0,
    position: 'absolute',
    top: 0,
    width: 34,
    zIndex: 20,
  },
  nav: {
    backgroundColor: '#ffffff',
    borderColor: '#dfe8e0',
    borderWidth: 1,
    borderRadius: 8,
    flexDirection: 'row',
    padding: 5,
    ...Platform.select({
      web: {
        boxShadow: '0 8px 18px rgba(15, 36, 21, 0.12)',
      },
      default: {
        shadowColor: '#0f2415',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.12,
        shadowRadius: 18,
        elevation: 8,
      },
    }),
  },
  navButton: {
    flex: 1,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 54,
    paddingHorizontal: 4,
  },
  navButtonActive: {
    backgroundColor: '#157f3b',
  },
  navText: {
    color: '#68766b',
    fontSize: 10,
    fontWeight: '900',
    textAlign: 'center',
  },
  navIcon: {
    color: '#68766b',
    fontSize: 14,
    fontWeight: '900',
    marginBottom: 2,
  },
  navTextActive: {
    color: '#ffffff',
  },
});
