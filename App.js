import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Image,
  Linking,
  Modal,
  PanResponder,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as Localization from 'expo-localization';
import * as ImageManipulator from 'expo-image-manipulator';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';

const RECEIPTS_STORAGE_KEY = 'paranereye.receipts.v2';
const SALARY_STORAGE_KEY = 'paranereye.salary.v1';
const INCOME_BY_MONTH_STORAGE_KEY = 'paranereye.incomeByMonth.v1';
const LANGUAGE_STORAGE_KEY = 'paranereye.language.v1';
const CURRENCY_STORAGE_KEY = 'paranereye.currency.v1';
const AUTH_CHOICE_STORAGE_KEY = 'paranereye.authChoice.v1';
const ANALYSIS_USAGE_STORAGE_KEY = 'paranereye.analysisUsage.v1';
const RECEIPT_IMAGE_DIR = `${FileSystem.documentDirectory}receipts/`;
const BACKUP_DIR = `${FileSystem.documentDirectory}backups/`;
const APP_CONFIG_EXTRA = Constants.expoConfig?.extra || Constants.manifest?.extra || {};
const DEFAULT_RECEIPT_ANALYSIS_ENDPOINT = 'https://nereye-receipt-analysis.onrender.com/analyze-receipt';
const RECEIPT_ANALYSIS_ENDPOINT =
  APP_CONFIG_EXTRA.receiptAnalysisUrl ||
  process.env.EXPO_PUBLIC_RECEIPT_ANALYSIS_URL ||
  DEFAULT_RECEIPT_ANALYSIS_ENDPOINT;
const RECEIPT_ANALYSIS_CLIENT_TOKEN =
  APP_CONFIG_EXTRA.analysisClientToken ||
  process.env.EXPO_PUBLIC_ANALYSIS_CLIENT_TOKEN ||
  '';
const ANALYSIS_IMAGE_MAX_WIDTH = 1024;
const ANALYSIS_IMAGE_QUALITY = 0.55;
const ANALYSIS_REQUEST_TIMEOUT_MS = 35000;
const FREE_MONTHLY_ANALYSIS_LIMIT = 5;
const IMAGE_PICKER_MEDIA_TYPES = ['images'];
const FEEDBACK_EMAIL = 'dcanpolat0@gmail.com';

let activeCurrency = 'TRY';

const languages = [
  { code: 'tr', name: 'Türkçe' },
  { code: 'en', name: 'English' },
  { code: 'fr', name: 'Francais' },
  { code: 'de', name: 'Deutsch' },
  { code: 'es', name: 'Espanol' },
];

const currencies = [
  { code: 'TRY', name: 'Türk Lirası', symbol: '₺' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'GBP', name: 'Sterlin', symbol: '£' },
];

const translations = {
  tr: {
    appSubtitle: 'Harcamanı kolayca takip et',
    navHome: 'Ana',
    navReceipt: 'Fiş',
    navReport: 'Rapor',
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
    topCategorySentence: (category, amount) => `En çok harcama ${category} kategorisinde: ${amount}.`,
    moneyLeft: 'Toplam kalan',
    savings: 'Tasarruf',
    receiptCount: 'Fiş sayısı',
    searchResultCount: (count) => `${count} fiş bulundu`,
    dailyAverage: 'Günlük ort.',
    spendingInsightTitle: 'En çok nereye gidiyor?',
    spendingInsightText: (category, amount) => `Bu ay en yüksek harcama ${category} kategorisinde. Toplam: ${amount}.`,
    recentSpending: 'Son harcamalar',
    newReceipt: 'Yeni fiş',
    addReceipt: 'Fiş ekle',
    freeUsageText: (used, limit) => `Bu ay ${used}/${limit} ücretsiz fiş analizi kullandın.`,
    freeLimitTitle: 'Ücretsiz limit doldu',
    freeLimitText: (limit) => `Bu ay ${limit} ücretsiz fiş analizi hakkını kullandın. Sınırsız analiz için Premium gerekli olacak.`,
    receiptHelp: 'Kamerayla çek, analiz et, kontrol edip harcamalara ekle.',
    noReceiptPhoto: 'Fiş fotoğrafı yok',
    choosePhotoHelp: 'Kamerayla çek veya galeriden seç.',
    changeReceiptPhoto: 'Fiş Fotoğrafını Değiştir',
    addReceiptPhoto: 'Fiş Fotoğrafı Ekle',
    receiptStartTitle: 'Yeni fiş',
    receiptStartText: 'Fiş fotoğrafını ekle, gerisini otomatik dolduralım.',
    takePhoto: 'Kameradan Çek',
    takePhotoHelp: 'Yeni fiş fotoğrafı çek.',
    chooseFromGallery: 'Galeriden Seç',
    chooseFromGalleryHelp: 'Daha önce çekilmiş fişi seç.',
    demoAnalyze: 'Fişi Analiz Et',
    demoAnalyzing: 'Fiş Analiz Ediliyor...',
    reanalyzeReceipt: 'Tekrar Analiz Et',
    storeName: 'Mağaza / işletme adı',
    totalAmount: 'Toplam tutar',
    category: 'Kategori',
    customCategory: 'Özel kategori',
    customCategoryPlaceholder: 'Örn. Oto bakım, okul, vergi...',
    readItems: 'Okunan ürünler',
    addToSpending: 'Harcamalara Ekle',
    manualSaveHelp: 'Analiz olmadan kaydetmek için mağaza adı ve toplam tutarı yazman yeterli.',
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
    highest: 'En yüksek',
    categoryBreakdown: 'Kategori dağılımı',
    merchantBreakdown: 'Marketler ve mağazalar',
    productBreakdown: 'Ürün özeti',
    productsTitle: 'Bu ay en çok alınanlar',
    productsInfo: 'Ürünler aylık toplam adet ve miktara göre sıralanır.',
    topProduct: 'Adete göre en çok alınan',
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
    thisWeek: 'Bu hafta',
    allTime: 'Tüm zamanlar',
    currency: 'Para birimi',
    selectedCurrency: (symbol, name) => `Seçili para birimi: ${symbol} ${name}`,
    premium: 'Premium',
    premiumInfo: 'Sınırsız AI fiş analizi ve gelişmiş raporlar.',
    premiumTitle: 'Nereye Premium',
    premiumSubtitle: 'Sınırsız fiş analizi, ürün raporları ve reklamsız kullanım.',
    premiumMonthly: 'Aylık: €2,99',
    premiumYearly: 'Yıllık: €24,99',
    premiumBenefits: [
      'Sınırsız AI fiş analizi',
      'Market ve mağaza raporları',
      'Ürün bazlı aylık analiz',
      'PDF / Excel dışa aktarma yakında',
      'Bulut yedekleme yakında',
    ],
    startPremium: 'Premium’a Geç',
    premiumSetupTitle: 'Premium yakında',
    premiumSetupText: 'Gerçek abonelik için App Store satın alma sistemi bağlanacak.',
    viewPremium: 'Premium’u Gör',
    accountSync: 'Hesap ve bulut',
    accountSyncInfo: 'Telefon değiştirince verilerini geri almak için hesap seçimi burada tutulur.',
    welcomeTitle: 'Hesabını seç',
    welcomeText: 'Harcamalarını takip etmeye başla.',
    chooseAccount: 'Devam et',
    signedInWith: (provider) => `${provider} seçildi`,
    signOut: 'Çıkış Yap',
    signOutTitle: 'Hesaptan çık',
    signOutMessage: 'Çıkış yaparsan uygulama tekrar başlangıç ekranına döner. Kayıtlı fişlerin telefonda kalır.',
    signOutConfirm: 'Çıkış yap',
    notSignedIn: 'Hesap seçilmedi',
    signInWithGoogle: 'Google ile Giriş Yap',
    signInWithICloud: 'iCloud ile Bağlan',
    cloudSetupNeededTitle: 'Bulut girişi hazır değil',
    cloudSetupNeededText: 'Gerçek giriş için Google/Firebase veya Apple iCloud kurulumu yapılmalı. Ekran hazır, servis bağlanınca aktif olacak.',
    dataBackup: 'Veri ve yedekleme',
    createBackup: 'Yedek Oluştur',
    restoreBackup: 'Son Yedeği Geri Yükle',
    backupReady: 'Yedek hazır',
    backupReadyText: (fileName) => `Yedek oluşturuldu: ${fileName}`,
    backupRestored: 'Yedek yüklendi',
    backupRestoredText: 'Son yedekteki fişler, gelir, dil ve para birimi geri yüklendi.',
    backupError: 'Yedekleme hatası',
    backupErrorText: 'Yedekleme işlemi tamamlanamadı.',
    noBackupTitle: 'Yedek yok',
    noBackupText: 'Geri yüklenecek bir yedek bulunamadı.',
    backupInfo: 'Fişler, gelirler, dil ve para birimi telefonda yedeklenir.',
    feedback: 'Geri bildirim',
    feedbackInfo: 'Öneri, hata veya isteklerini bize gönder.',
    feedbackTitle: 'Bize neyi düzeltelim?',
    feedbackText: 'Mesajın e-posta olarak bize gelir. Böylece kullanıcıların istediği şeyleri okuyup uygulamayı ona göre geliştiririz.',
    feedbackPlaceholder: 'Örn. Fiş okuma daha hızlı olsun, şu ekran karışık...',
    sendFeedback: 'Geri Bildirim Gönder',
    feedbackEmptyTitle: 'Mesaj boş',
    feedbackEmptyText: 'Göndermeden önce kısa bir mesaj yaz.',
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
    receiptDetail: 'Fiş detayı',
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
    autoTotalFromItems: 'Toplamı ürünlerden hesapla',
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
    languageSaveError: 'Dil seçimi kaydedilemedi.',
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
    appSubtitle: 'Track your spending easily',
    navHome: 'Home',
    navReceipt: 'Receipt',
    navReport: 'Report',
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
    topCategorySentence: (category, amount) => `Most spending is in ${category}: ${amount}.`,
    moneyLeft: 'Total left',
    savings: 'Savings',
    receiptCount: 'Receipt count',
    searchResultCount: (count) => `${count} receipts found`,
    dailyAverage: 'Daily avg.',
    spendingInsightTitle: 'Where does it go most?',
    spendingInsightText: (category, amount) => `Your highest spending this month is ${category}. Total: ${amount}.`,
    recentSpending: 'Recent spending',
    newReceipt: 'New receipt',
    addReceipt: 'Add receipt',
    freeUsageText: (used, limit) => `You used ${used}/${limit} free receipt scans this month.`,
    freeLimitTitle: 'Free limit reached',
    freeLimitText: (limit) => `You used your ${limit} free receipt scans this month. Unlimited scanning will require Premium.`,
    receiptHelp: 'Take a photo, analyze it, review it, and add it to spending.',
    noReceiptPhoto: 'No receipt photo',
    choosePhotoHelp: 'Take a photo or choose from gallery.',
    changeReceiptPhoto: 'Change receipt photo',
    addReceiptPhoto: 'Add receipt photo',
    receiptStartTitle: 'New receipt',
    receiptStartText: 'Add a receipt photo and let the app fill the details.',
    takePhoto: 'Take photo',
    takePhotoHelp: 'Take a new receipt photo.',
    chooseFromGallery: 'Choose from gallery',
    chooseFromGalleryHelp: 'Select an existing receipt photo.',
    demoAnalyze: 'Analyze receipt',
    demoAnalyzing: 'Analyzing receipt...',
    reanalyzeReceipt: 'Analyze Again',
    storeName: 'Store / business name',
    totalAmount: 'Total amount',
    category: 'Category',
    customCategory: 'Custom category',
    customCategoryPlaceholder: 'Example: car care, school, tax...',
    readItems: 'Read items',
    addToSpending: 'Add to spending',
    manualSaveHelp: 'To save without analysis, enter the store name and total amount.',
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
    highest: 'Highest',
    categoryBreakdown: 'Category breakdown',
    merchantBreakdown: 'Stores and merchants',
    productBreakdown: 'Product summary',
    productsTitle: 'Most bought this month',
    productsInfo: 'Products are ranked monthly by total quantity.',
    topProduct: 'Most bought by quantity',
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
    thisWeek: 'This week',
    allTime: 'All time',
    currency: 'Currency',
    selectedCurrency: (symbol, name) => `Selected currency: ${symbol} ${name}`,
    premium: 'Premium',
    premiumInfo: 'Unlimited AI receipt scans and advanced reports.',
    premiumTitle: 'Nereye Premium',
    premiumSubtitle: 'Unlimited receipt scans, product reports, and ad-free use.',
    premiumMonthly: 'Monthly: €2.99',
    premiumYearly: 'Yearly: €24.99',
    premiumBenefits: [
      'Unlimited AI receipt scans',
      'Store and merchant reports',
      'Monthly product analysis',
      'PDF / Excel export soon',
      'Cloud backup soon',
    ],
    startPremium: 'Go Premium',
    premiumSetupTitle: 'Premium coming soon',
    premiumSetupText: 'Real subscriptions will be connected through App Store purchases.',
    viewPremium: 'View Premium',
    accountSync: 'Account and cloud',
    accountSyncInfo: 'Your account choice is kept here so data recovery can be connected later.',
    welcomeTitle: 'Choose your account',
    welcomeText: 'Start tracking your spending.',
    chooseAccount: 'Continue',
    signedInWith: (provider) => `${provider} selected`,
    signOut: 'Sign out',
    signOutTitle: 'Sign out',
    signOutMessage: 'If you sign out, the app will return to the start screen. Saved receipts stay on this phone.',
    signOutConfirm: 'Sign out',
    notSignedIn: 'No account selected',
    signInWithGoogle: 'Sign in with Google',
    signInWithICloud: 'Connect iCloud',
    cloudSetupNeededTitle: 'Cloud sign-in is not ready',
    cloudSetupNeededText: 'Real sign-in needs Google/Firebase or Apple iCloud setup. The screen is ready and will become active once the service is connected.',
    dataBackup: 'Data and backup',
    createBackup: 'Create backup',
    restoreBackup: 'Restore latest backup',
    backupReady: 'Backup ready',
    backupReadyText: (fileName) => `Backup created: ${fileName}`,
    backupRestored: 'Backup restored',
    backupRestoredText: 'Receipts, income, language, and currency were restored from the latest backup.',
    backupError: 'Backup error',
    backupErrorText: 'Backup could not be completed.',
    noBackupTitle: 'No backup',
    noBackupText: 'No backup was found to restore.',
    backupInfo: 'Receipts, income, language, and currency are backed up on this phone.',
    feedback: 'Feedback',
    feedbackInfo: 'Send suggestions, bugs, or feature requests.',
    feedbackTitle: 'What should we improve?',
    feedbackText: 'Your message comes to us by email, so we can read user feedback and improve the app.',
    feedbackPlaceholder: 'Example: make receipt reading faster, this screen feels confusing...',
    sendFeedback: 'Send Feedback',
    feedbackEmptyTitle: 'Message is empty',
    feedbackEmptyText: 'Write a short message before sending.',
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
    receiptDetail: 'Receipt detail',
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
    autoTotalFromItems: 'Calculate total from items',
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
    languageSaveError: 'Language selection could not be saved.',
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
    appSubtitle: 'Suivez vos depenses facilement',
    navHome: 'Accueil',
    navReceipt: 'Ticket',
    navReport: 'Rapport',
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
    topCategorySentence: (category, amount) => `La depense principale est ${category}: ${amount}.`,
    moneyLeft: 'Solde total',
    savings: 'Epargne',
    receiptCount: 'Nombre de tickets',
    searchResultCount: (count) => `${count} tickets trouves`,
    dailyAverage: 'Moyenne jour',
    spendingInsightTitle: 'Ou va le plus d argent?',
    spendingInsightText: (category, amount) => `Ce mois-ci, la depense la plus elevee est ${category}. Total: ${amount}.`,
    recentSpending: 'Depenses recentes',
    newReceipt: 'Nouveau ticket',
    addReceipt: 'Ajouter un ticket',
    freeUsageText: (used, limit) => `${used}/${limit} analyses gratuites utilisees ce mois-ci.`,
    freeLimitTitle: 'Limite gratuite atteinte',
    freeLimitText: (limit) => `Vous avez utilise vos ${limit} analyses gratuites ce mois-ci. Les analyses illimitees demanderont Premium.`,
    receiptHelp: 'Prenez une photo, analysez, verifiez et ajoutez aux depenses.',
    noReceiptPhoto: 'Aucune photo de ticket',
    choosePhotoHelp: 'Prenez une photo ou choisissez depuis la galerie.',
    changeReceiptPhoto: 'Changer la photo du ticket',
    addReceiptPhoto: 'Ajouter une photo du ticket',
    receiptStartTitle: 'Nouveau ticket',
    receiptStartText: 'Ajoutez une photo et laissez l app remplir les details.',
    takePhoto: 'Prendre une photo',
    takePhotoHelp: 'Prendre une nouvelle photo du ticket.',
    chooseFromGallery: 'Choisir dans la galerie',
    chooseFromGalleryHelp: 'Choisir une photo de ticket existante.',
    demoAnalyze: 'Analyser le ticket',
    demoAnalyzing: 'Analyse du ticket...',
    reanalyzeReceipt: 'Analyser encore',
    storeName: 'Nom du magasin',
    totalAmount: 'Montant total',
    category: 'Categorie',
    customCategory: 'Categorie personnalisee',
    customCategoryPlaceholder: 'Ex. voiture, ecole, taxe...',
    readItems: 'Articles lus',
    addToSpending: 'Ajouter aux depenses',
    manualSaveHelp: 'Pour enregistrer sans analyse, indiquez le magasin et le montant total.',
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
    highest: 'Plus elevee',
    categoryBreakdown: 'Repartition par categorie',
    merchantBreakdown: 'Magasins et commercants',
    productBreakdown: 'Resume des articles',
    productsTitle: 'Les plus achetes ce mois',
    productsInfo: 'Les articles sont classes chaque mois par quantite totale.',
    topProduct: 'Le plus achete en quantite',
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
    thisWeek: 'Cette semaine',
    allTime: 'Tout',
    currency: 'Devise',
    selectedCurrency: (symbol, name) => `Devise selectionnee: ${symbol} ${name}`,
    premium: 'Premium',
    premiumInfo: 'Analyses AI illimitees et rapports avances.',
    premiumTitle: 'Nereye Premium',
    premiumSubtitle: 'Analyses illimitees, rapports produits et sans publicite.',
    premiumMonthly: 'Mensuel: €2,99',
    premiumYearly: 'Annuel: €24,99',
    premiumBenefits: [
      'Analyses AI illimitees',
      'Rapports par magasin',
      'Analyse mensuelle des produits',
      'Export PDF / Excel bientot',
      'Sauvegarde cloud bientot',
    ],
    startPremium: 'Passer Premium',
    premiumSetupTitle: 'Premium bientot',
    premiumSetupText: 'Les abonnements reels seront connectes via l App Store.',
    viewPremium: 'Voir Premium',
    accountSync: 'Compte et cloud',
    accountSyncInfo: 'Le choix du compte est conserve ici pour connecter la recuperation plus tard.',
    welcomeTitle: 'Choisissez votre compte',
    welcomeText: 'Commencez a suivre vos depenses.',
    chooseAccount: 'Continuer',
    signedInWith: (provider) => `${provider} selectionne`,
    signOut: 'Se deconnecter',
    signOutTitle: 'Deconnexion',
    signOutMessage: 'En vous deconnectant, l app revient a l ecran de depart. Les tickets restent sur ce telephone.',
    signOutConfirm: 'Se deconnecter',
    notSignedIn: 'Aucun compte choisi',
    signInWithGoogle: 'Se connecter avec Google',
    signInWithICloud: 'Connecter iCloud',
    cloudSetupNeededTitle: 'Connexion cloud non prete',
    cloudSetupNeededText: 'La vraie connexion necessite Google/Firebase ou Apple iCloud. L ecran est pret et sera actif apres connexion du service.',
    dataBackup: 'Donnees et sauvegarde',
    createBackup: 'Creer une sauvegarde',
    restoreBackup: 'Restaurer la derniere sauvegarde',
    backupReady: 'Sauvegarde prete',
    backupReadyText: (fileName) => `Sauvegarde creee: ${fileName}`,
    backupRestored: 'Sauvegarde restauree',
    backupRestoredText: 'Tickets, revenus, langue et devise ont ete restaures.',
    backupError: 'Erreur de sauvegarde',
    backupErrorText: 'La sauvegarde n a pas pu etre terminee.',
    noBackupTitle: 'Aucune sauvegarde',
    noBackupText: 'Aucune sauvegarde a restaurer.',
    backupInfo: 'Tickets, revenus, langue et devise sont sauvegardes sur ce telephone.',
    feedback: 'Avis',
    feedbackInfo: 'Envoyez une idee, un bug ou une demande.',
    feedbackTitle: 'Que devons-nous ameliorer ?',
    feedbackText: 'Votre message nous arrive par e-mail afin de lire les retours et ameliorer l app.',
    feedbackPlaceholder: 'Ex. rendre la lecture plus rapide, cet ecran est confus...',
    sendFeedback: 'Envoyer un avis',
    feedbackEmptyTitle: 'Message vide',
    feedbackEmptyText: 'Ecrivez un court message avant l envoi.',
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
    receiptDetail: 'Detail du ticket',
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
    autoTotalFromItems: 'Calculer le total des articles',
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
    languageSaveError: 'La langue n a pas pu etre enregistree.',
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
    appSubtitle: 'Ausgaben einfach verfolgen',
    navHome: 'Start',
    navReceipt: 'Beleg',
    navReport: 'Bericht',
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
    topCategorySentence: (category, amount) => `Die meisten Ausgaben sind in ${category}: ${amount}.`,
    moneyLeft: 'Gesamt uebrig',
    savings: 'Sparen',
    receiptCount: 'Beleganzahl',
    searchResultCount: (count) => `${count} Belege gefunden`,
    dailyAverage: 'Tagesdurchs.',
    spendingInsightTitle: 'Wohin geht am meisten?',
    spendingInsightText: (category, amount) => `Diesen Monat ist ${category} am hoechsten. Gesamt: ${amount}.`,
    recentSpending: 'Letzte Ausgaben',
    newReceipt: 'Neuer Beleg',
    addReceipt: 'Beleg hinzufuegen',
    freeUsageText: (used, limit) => `${used}/${limit} kostenlose Beleganalysen diesen Monat genutzt.`,
    freeLimitTitle: 'Kostenloses Limit erreicht',
    freeLimitText: (limit) => `Du hast deine ${limit} kostenlosen Beleganalysen diesen Monat genutzt. Unbegrenzte Analysen brauchen Premium.`,
    receiptHelp: 'Foto aufnehmen, analysieren, pruefen und speichern.',
    noReceiptPhoto: 'Kein Belegfoto',
    choosePhotoHelp: 'Foto aufnehmen oder aus Galerie waehlen.',
    changeReceiptPhoto: 'Belegfoto aendern',
    addReceiptPhoto: 'Belegfoto hinzufuegen',
    receiptStartTitle: 'Neuer Beleg',
    receiptStartText: 'Belegfoto hinzufuegen, Details automatisch ausfuellen lassen.',
    takePhoto: 'Foto aufnehmen',
    takePhotoHelp: 'Neues Belegfoto aufnehmen.',
    chooseFromGallery: 'Aus Galerie waehlen',
    chooseFromGalleryHelp: 'Vorhandenes Belegfoto auswaehlen.',
    demoAnalyze: 'Beleg analysieren',
    demoAnalyzing: 'Beleg wird analysiert...',
    reanalyzeReceipt: 'Erneut analysieren',
    storeName: 'Geschaeftsname',
    totalAmount: 'Gesamtbetrag',
    category: 'Kategorie',
    customCategory: 'Eigene Kategorie',
    customCategoryPlaceholder: 'Z.B. Auto, Schule, Steuer...',
    readItems: 'Gelesene Artikel',
    addToSpending: 'Zu Ausgaben hinzufuegen',
    manualSaveHelp: 'Zum Speichern ohne Analyse reichen Geschaeftsname und Gesamtbetrag.',
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
    highest: 'Hoechste',
    categoryBreakdown: 'Kategorieaufteilung',
    merchantBreakdown: 'Maerkte und Geschaefte',
    productBreakdown: 'Artikeluebersicht',
    productsTitle: 'Diesen Monat am meisten gekauft',
    productsInfo: 'Artikel werden monatlich nach Gesamtmenge sortiert.',
    topProduct: 'Meist gekauft nach Menge',
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
    thisWeek: 'Diese Woche',
    allTime: 'Gesamt',
    currency: 'Waehrung',
    selectedCurrency: (symbol, name) => `Ausgewaehlte Waehrung: ${symbol} ${name}`,
    premium: 'Premium',
    premiumInfo: 'Unbegrenzte AI-Beleganalysen und erweiterte Berichte.',
    premiumTitle: 'Nereye Premium',
    premiumSubtitle: 'Unbegrenzte Beleganalysen, Produktberichte und werbefrei.',
    premiumMonthly: 'Monatlich: €2,99',
    premiumYearly: 'Jaehrlich: €24,99',
    premiumBenefits: [
      'Unbegrenzte AI-Beleganalysen',
      'Berichte nach Geschaeft',
      'Monatliche Produktanalyse',
      'PDF / Excel Export bald',
      'Cloud-Backup bald',
    ],
    startPremium: 'Premium aktivieren',
    premiumSetupTitle: 'Premium kommt bald',
    premiumSetupText: 'Echte Abos werden ueber App Store Kaeufe verbunden.',
    viewPremium: 'Premium ansehen',
    accountSync: 'Konto und Cloud',
    accountSyncInfo: 'Die Kontoauswahl wird hier gespeichert, damit Wiederherstellung spaeter verbunden werden kann.',
    welcomeTitle: 'Konto auswaehlen',
    welcomeText: 'Beginne mit dem Verfolgen deiner Ausgaben.',
    chooseAccount: 'Fortfahren',
    signedInWith: (provider) => `${provider} ausgewaehlt`,
    signOut: 'Abmelden',
    signOutTitle: 'Abmelden',
    signOutMessage: 'Nach dem Abmelden kehrt die App zum Startbildschirm zurueck. Gespeicherte Belege bleiben auf dem Telefon.',
    signOutConfirm: 'Abmelden',
    notSignedIn: 'Kein Konto ausgewaehlt',
    signInWithGoogle: 'Mit Google anmelden',
    signInWithICloud: 'iCloud verbinden',
    cloudSetupNeededTitle: 'Cloud-Anmeldung nicht bereit',
    cloudSetupNeededText: 'Echte Anmeldung braucht Google/Firebase oder Apple iCloud. Der Bildschirm ist bereit und wird nach Service-Anbindung aktiv.',
    dataBackup: 'Daten und Backup',
    createBackup: 'Backup erstellen',
    restoreBackup: 'Letztes Backup wiederherstellen',
    backupReady: 'Backup bereit',
    backupReadyText: (fileName) => `Backup erstellt: ${fileName}`,
    backupRestored: 'Backup wiederhergestellt',
    backupRestoredText: 'Belege, Einkommen, Sprache und Waehrung wurden wiederhergestellt.',
    backupError: 'Backup-Fehler',
    backupErrorText: 'Backup konnte nicht abgeschlossen werden.',
    noBackupTitle: 'Kein Backup',
    noBackupText: 'Kein Backup zum Wiederherstellen gefunden.',
    backupInfo: 'Belege, Einkommen, Sprache und Waehrung werden auf diesem Telefon gesichert.',
    feedback: 'Feedback',
    feedbackInfo: 'Sende Ideen, Fehler oder Wuensche.',
    feedbackTitle: 'Was sollen wir verbessern?',
    feedbackText: 'Deine Nachricht kommt per E-Mail zu uns, damit wir Feedback lesen und die App verbessern.',
    feedbackPlaceholder: 'Z.B. Belege schneller lesen, dieser Bildschirm ist unklar...',
    sendFeedback: 'Feedback senden',
    feedbackEmptyTitle: 'Nachricht leer',
    feedbackEmptyText: 'Schreibe vor dem Senden eine kurze Nachricht.',
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
    receiptDetail: 'Belegdetails',
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
    autoTotalFromItems: 'Summe aus Artikeln berechnen',
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
    languageSaveError: 'Sprache konnte nicht gespeichert werden.',
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
    appSubtitle: 'Controla tus gastos facilmente',
    navHome: 'Inicio',
    navReceipt: 'Ticket',
    navReport: 'Informe',
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
    topCategorySentence: (category, amount) => `El mayor gasto esta en ${category}: ${amount}.`,
    moneyLeft: 'Total restante',
    savings: 'Ahorro',
    receiptCount: 'Numero de tickets',
    searchResultCount: (count) => `${count} tickets encontrados`,
    dailyAverage: 'Media diaria',
    spendingInsightTitle: 'Donde gastas mas?',
    spendingInsightText: (category, amount) => `Este mes el gasto mas alto esta en ${category}. Total: ${amount}.`,
    recentSpending: 'Gastos recientes',
    newReceipt: 'Nuevo ticket',
    addReceipt: 'Anadir ticket',
    freeUsageText: (used, limit) => `Has usado ${used}/${limit} analisis gratis este mes.`,
    freeLimitTitle: 'Limite gratis alcanzado',
    freeLimitText: (limit) => `Has usado tus ${limit} analisis gratis este mes. El analisis ilimitado requerira Premium.`,
    receiptHelp: 'Haz una foto, analiza, revisa y anade al gasto.',
    noReceiptPhoto: 'Sin foto de ticket',
    choosePhotoHelp: 'Haz una foto o elige desde la galeria.',
    changeReceiptPhoto: 'Cambiar foto del ticket',
    addReceiptPhoto: 'Anadir foto del ticket',
    receiptStartTitle: 'Nuevo ticket',
    receiptStartText: 'Anade una foto y deja que la app complete los detalles.',
    takePhoto: 'Hacer foto',
    takePhotoHelp: 'Hacer una nueva foto del ticket.',
    chooseFromGallery: 'Elegir de galeria',
    chooseFromGalleryHelp: 'Seleccionar una foto existente.',
    demoAnalyze: 'Analizar ticket',
    demoAnalyzing: 'Analizando ticket...',
    reanalyzeReceipt: 'Analizar otra vez',
    storeName: 'Nombre de tienda',
    totalAmount: 'Importe total',
    category: 'Categoria',
    customCategory: 'Categoria personalizada',
    customCategoryPlaceholder: 'Ej. coche, escuela, impuesto...',
    readItems: 'Productos leidos',
    addToSpending: 'Anadir a gastos',
    manualSaveHelp: 'Para guardar sin analisis, introduce la tienda y el importe total.',
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
    highest: 'Mas alto',
    categoryBreakdown: 'Desglose por categoria',
    merchantBreakdown: 'Tiendas y comercios',
    productBreakdown: 'Resumen de productos',
    productsTitle: 'Mas comprados este mes',
    productsInfo: 'Los productos se ordenan cada mes por cantidad total.',
    topProduct: 'Mas comprado por cantidad',
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
    thisWeek: 'Esta semana',
    allTime: 'Todo',
    currency: 'Moneda',
    selectedCurrency: (symbol, name) => `Moneda seleccionada: ${symbol} ${name}`,
    premium: 'Premium',
    premiumInfo: 'Analisis AI ilimitado y reportes avanzados.',
    premiumTitle: 'Nereye Premium',
    premiumSubtitle: 'Tickets ilimitados, reportes de productos y sin anuncios.',
    premiumMonthly: 'Mensual: €2,99',
    premiumYearly: 'Anual: €24,99',
    premiumBenefits: [
      'Analisis AI ilimitado',
      'Reportes por tienda',
      'Analisis mensual de productos',
      'Exportar PDF / Excel pronto',
      'Copia en la nube pronto',
    ],
    startPremium: 'Pasar a Premium',
    premiumSetupTitle: 'Premium pronto',
    premiumSetupText: 'Las suscripciones reales se conectaran con compras de App Store.',
    viewPremium: 'Ver Premium',
    accountSync: 'Cuenta y nube',
    accountSyncInfo: 'La opcion de cuenta se guarda aqui para conectar la recuperacion mas adelante.',
    welcomeTitle: 'Elige tu cuenta',
    welcomeText: 'Empieza a controlar tus gastos.',
    chooseAccount: 'Continuar',
    signedInWith: (provider) => `${provider} seleccionado`,
    signOut: 'Cerrar sesion',
    signOutTitle: 'Cerrar sesion',
    signOutMessage: 'Si cierras sesion, la app volvera a la pantalla inicial. Los tickets guardados permanecen en este telefono.',
    signOutConfirm: 'Cerrar sesion',
    notSignedIn: 'Ninguna cuenta seleccionada',
    signInWithGoogle: 'Entrar con Google',
    signInWithICloud: 'Conectar iCloud',
    cloudSetupNeededTitle: 'Inicio en nube no listo',
    cloudSetupNeededText: 'El inicio real necesita Google/Firebase o Apple iCloud. La pantalla esta lista y se activara al conectar el servicio.',
    dataBackup: 'Datos y copia',
    createBackup: 'Crear copia',
    restoreBackup: 'Restaurar ultima copia',
    backupReady: 'Copia lista',
    backupReadyText: (fileName) => `Copia creada: ${fileName}`,
    backupRestored: 'Copia restaurada',
    backupRestoredText: 'Tickets, ingresos, idioma y moneda fueron restaurados.',
    backupError: 'Error de copia',
    backupErrorText: 'No se pudo completar la copia.',
    noBackupTitle: 'Sin copia',
    noBackupText: 'No se encontro ninguna copia para restaurar.',
    backupInfo: 'Tickets, ingresos, idioma y moneda se guardan en este telefono.',
    feedback: 'Comentarios',
    feedbackInfo: 'Envia sugerencias, errores o ideas.',
    feedbackTitle: 'Que deberiamos mejorar?',
    feedbackText: 'Tu mensaje nos llega por email para leer los comentarios y mejorar la app.',
    feedbackPlaceholder: 'Ej. hacer la lectura mas rapida, esta pantalla es confusa...',
    sendFeedback: 'Enviar comentario',
    feedbackEmptyTitle: 'Mensaje vacio',
    feedbackEmptyText: 'Escribe un mensaje corto antes de enviar.',
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
    receiptDetail: 'Detalle del ticket',
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
    autoTotalFromItems: 'Calcular total desde productos',
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
    languageSaveError: 'No se pudo guardar el idioma.',
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

function getDeviceLanguage() {
  const locales = Localization.getLocales?.() || [];
  const languageCode = locales[0]?.languageCode;
  const supportedLanguage = languages.find((language) => language.code === languageCode);
  return supportedLanguage?.code || 'en';
}

const categoryOptions = [
  { key: 'grocery', color: '#157f3b' },
  { key: 'food', color: '#f5b942' },
  { key: 'transport', color: '#3d7ee8' },
  { key: 'fuel', color: '#f97316' },
  { key: 'home', color: '#e35b4f' },
  { key: 'clothing', color: '#8b5cf6' },
  { key: 'health', color: '#14b8a6' },
  { key: 'other', color: '#6b7280' },
];

function buildCategorySummary(receiptList) {
  const totals = new Map();

  receiptList.forEach((receipt) => {
    const key = normalizeCategoryKey(receipt.category);
    const existing = totals.get(key) || 0;
    totals.set(key, existing + (Number(receipt.amount) || 0));
  });

  const fixedCategories = categoryOptions.map((category) => ({
    ...category,
    amount: totals.get(category.key) || 0,
  }));

  const customCategories = Array.from(totals.entries())
    .filter(([key]) => isCustomCategory(key))
    .map(([key, amount]) => ({
      key,
      color: '#6b7280',
      amount,
    }));

  return [...fixedCategories, ...customCategories];
}

const legacyCategoryMap = {
  Market: 'grocery',
  Groceries: 'grocery',
  Courses: 'grocery',
  Lebensmittel: 'grocery',
  Supermercado: 'grocery',
  Yemek: 'food',
  Food: 'food',
  Restaurant: 'food',
  Essen: 'food',
  Comida: 'food',
  Ulasim: 'transport',
  Transport: 'transport',
  Transporte: 'transport',
  Yakit: 'fuel',
  Yakıt: 'fuel',
  Fuel: 'fuel',
  Carburant: 'fuel',
  Kraftstoff: 'fuel',
  Combustible: 'fuel',
  Ev: 'home',
  Home: 'home',
  Maison: 'home',
  Haushalt: 'home',
  Hogar: 'home',
  Giyim: 'clothing',
  Clothing: 'clothing',
  Vetements: 'clothing',
  Kleidung: 'clothing',
  Ropa: 'clothing',
  Saglik: 'health',
  Health: 'health',
  Sante: 'health',
  Gesundheit: 'health',
  Salud: 'health',
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

  return legacyCategoryMap[categoryText] || categoryText || 'other';
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

function getAuthProviderLabel(authChoice, t) {
  if (authChoice === 'google') {
    return 'Google';
  }

  if (authChoice === 'icloud') {
    return 'iCloud';
  }

  return t.notSignedIn;
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

function normalizeReceiptCategories(receipt) {
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

  return {
    ...receipt,
    category: normalizedCategory,
    amount: normalizedAmount,
    items: normalizedItems,
  };
}

function getItemsTotal(items) {
  return Array.isArray(items)
    ? items.reduce((sum, item) => {
        if (typeof item === 'string') {
          return sum;
        }

        return sum + (Number(item.amount) || 0);
      }, 0)
    : 0;
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
  return receipt.createdAt || receipt.id || 0;
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

function getDateFromReceipt(receipt) {
  if (receipt.createdAt) {
    return new Date(receipt.createdAt);
  }

  const match = String(receipt.date || '').match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
  if (!match) {
    return null;
  }

  return new Date(Number(match[3]), Number(match[2]) - 1, Number(match[1]));
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

    return sum + (Number(receipt.amount) || 0);
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
      formatTL(receipt.amount),
      Number(receipt.amount || 0).toFixed(2).replace('.', ','),
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

    existingGroup.amount += receipt.amount || 0;
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
        };

      existingGroup.quantity += Number(normalizedItem.quantity) > 0 ? Number(normalizedItem.quantity) : 1;
      existingGroup.amount += Number(normalizedItem.amount) || 0;
      existingGroup.count += 1;
      groups.set(key, existingGroup);
    });
  });

  return [...groups.values()].sort((first, second) => {
    if (second.quantity !== first.quantity) {
      return second.quantity - first.quantity;
    }

    if (second.count !== first.count) {
      return second.count - first.count;
    }

    return second.amount - first.amount;
  });
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
  if (timestamp) {
    return formatReceiptDate(timestamp);
  }

  const monthMap = {
    temmuz: '07',
    july: '07',
    juillet: '07',
    juli: '07',
    julio: '07',
  };
  const normalizedText = String(dateText || '').trim();
  const match = normalizedText.match(/(\d{1,2})\s+([^\s]+)\s+(\d{4})/i);

  if (match) {
    const day = match[1].padStart(2, '0');
    const month = monthMap[match[2].toLocaleLowerCase('tr-TR')];
    const year = match[3];

    if (month) {
      return `${day}.${month}.${year}`;
    }
  }

  return normalizedText;
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
  const numericValue = Number(value) || 0;
  const hasCents = Math.abs(numericValue % 1) > 0.001;

  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: activeCurrency,
    minimumFractionDigits: hasCents ? 2 : 0,
    maximumFractionDigits: 2,
  }).format(numericValue);
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

async function ensureDirectory(directoryUri) {
  const directoryInfo = await FileSystem.getInfoAsync(directoryUri);

  if (!directoryInfo.exists) {
    await FileSystem.makeDirectoryAsync(directoryUri, { intermediates: true });
  }
}

export default function App() {
  const [screen, setScreen] = useState('home');
  const [receipts, setReceipts] = useState(initialReceipts);
  const [incomeByMonth, setIncomeByMonth] = useState({});
  const [incomeMonthKey, setIncomeMonthKey] = useState(getMonthKey());
  const [storeName, setStoreName] = useState('');
  const [amountText, setAmountText] = useState('');
  const [receiptDateText, setReceiptDateText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('grocery');
  const [customCategoryText, setCustomCategoryText] = useState('');
  const [receiptImage, setReceiptImage] = useState(null);
  const [analysisStatus, setAnalysisStatus] = useState('idle');
  const [analysisConfidence, setAnalysisConfidence] = useState(null);
  const [receiptItems, setReceiptItems] = useState([]);
  const [photoOptionsOpen, setPhotoOptionsOpen] = useState(false);
  const [pendingPhotoAction, setPendingPhotoAction] = useState(null);
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [detailReturnScreen, setDetailReturnScreen] = useState('report');
  const [editingReceipt, setEditingReceipt] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const [editStoreName, setEditStoreName] = useState('');
  const [editAmountText, setEditAmountText] = useState('');
  const [editDateText, setEditDateText] = useState('');
  const [editCategory, setEditCategory] = useState('grocery');
  const [editCustomCategoryText, setEditCustomCategoryText] = useState('');
  const [editItems, setEditItems] = useState([]);
  const [selectedLanguage, setSelectedLanguage] = useState(getDeviceLanguage);
  const [selectedCurrency, setSelectedCurrency] = useState('TRY');
  const [authChoice, setAuthChoice] = useState(null);
  const [analysisUsageByMonth, setAnalysisUsageByMonth] = useState({});
  const [settingsSection, setSettingsSection] = useState('main');
  const [reportPeriod, setReportPeriod] = useState('month');
  const [reportSearchText, setReportSearchText] = useState('');
  const [storageReady, setStorageReady] = useState(false);

  useEffect(() => {
    async function loadSavedData() {
      try {
        const [
          savedReceipts,
          savedSalary,
          savedIncomeByMonth,
          savedLanguage,
          savedCurrency,
          savedAuthChoice,
          savedAnalysisUsage,
        ] = await Promise.all([
          AsyncStorage.getItem(RECEIPTS_STORAGE_KEY),
          AsyncStorage.getItem(SALARY_STORAGE_KEY),
          AsyncStorage.getItem(INCOME_BY_MONTH_STORAGE_KEY),
          AsyncStorage.getItem(LANGUAGE_STORAGE_KEY),
          AsyncStorage.getItem(CURRENCY_STORAGE_KEY),
          AsyncStorage.getItem(AUTH_CHOICE_STORAGE_KEY),
          AsyncStorage.getItem(ANALYSIS_USAGE_STORAGE_KEY),
        ]);

        const parsedReceipts = safeParseStoredJson(savedReceipts, null);
        if (Array.isArray(parsedReceipts)) {
          const cleanReceipts = parsedReceipts
            .filter(isValidReceiptRecord)
            .filter((receipt) => !isSeedReceipt(receipt))
            .map(normalizeReceiptCategories)
            .filter(Boolean);
          setReceipts(cleanReceipts);
        }

        const parsedIncome = safeParseStoredJson(savedIncomeByMonth, null);
        if (parsedIncome && typeof parsedIncome === 'object' && !Array.isArray(parsedIncome)) {
          setIncomeByMonth(parsedIncome);
        } else if (savedSalary) {
          setIncomeByMonth({ [getMonthKey()]: savedSalary });
        }

        if (savedLanguage && languages.some((language) => language.code === savedLanguage)) {
          setSelectedLanguage(savedLanguage);
        } else {
          setSelectedLanguage(getDeviceLanguage());
        }

        if (savedCurrency && currencies.some((currency) => currency.code === savedCurrency)) {
          setSelectedCurrency(savedCurrency);
        }

        if (savedAuthChoice) {
          setAuthChoice(savedAuthChoice);
        }

        const parsedAnalysisUsage = safeParseStoredJson(savedAnalysisUsage, null);
        if (parsedAnalysisUsage && typeof parsedAnalysisUsage === 'object' && !Array.isArray(parsedAnalysisUsage)) {
          setAnalysisUsageByMonth(parsedAnalysisUsage);
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
    }, 650);

    return () => clearTimeout(timer);
  }, [photoOptionsOpen, pendingPhotoAction]);

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

    AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, selectedLanguage).catch(() => {
      Alert.alert(t.saveError, t.languageSaveError);
    });
  }, [selectedLanguage, storageReady]);

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

    if (authChoice) {
      AsyncStorage.setItem(AUTH_CHOICE_STORAGE_KEY, authChoice).catch(() => {
        console.warn('Auth choice could not be saved.');
      });
    } else {
      AsyncStorage.removeItem(AUTH_CHOICE_STORAGE_KEY).catch(() => {
        console.warn('Auth choice could not be removed.');
      });
    }
  }, [authChoice, storageReady]);

  useEffect(() => {
    if (!storageReady) {
      return;
    }

    AsyncStorage.setItem(ANALYSIS_USAGE_STORAGE_KEY, JSON.stringify(analysisUsageByMonth)).catch(() => {
      console.warn('Analysis usage could not be saved.');
    });
  }, [analysisUsageByMonth, storageReady]);

  const salaryText = incomeByMonth[incomeMonthKey] || '';
  const salary = parseAmount(salaryText);
  const selectedMonthReceipts = useMemo(
    () => filterReceiptsByMonthKey(receipts, incomeMonthKey),
    [receipts, incomeMonthKey]
  );
  const selectedMonthSpend = useMemo(
    () => selectedMonthReceipts.reduce((sum, receipt) => sum + receipt.amount, 0),
    [selectedMonthReceipts]
  );
  const totalIncomeUntilSelectedMonth = useMemo(
    () => getIncomeTotalUntilMonth(incomeByMonth, incomeMonthKey),
    [incomeByMonth, incomeMonthKey]
  );
  const totalSpendUntilSelectedMonth = useMemo(
    () => getReceiptTotalUntilMonth(receipts, incomeMonthKey),
    [receipts, incomeMonthKey]
  );
  const remaining = totalIncomeUntilSelectedMonth - totalSpendUntilSelectedMonth;
  const savingRate =
    totalIncomeUntilSelectedMonth > 0
      ? Math.max(0, Math.round((remaining / totalIncomeUntilSelectedMonth) * 100))
      : 0;
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

  const t = translations[selectedLanguage] || translations.en;
  activeCurrency = selectedCurrency;
  const currentAnalysisMonthKey = getMonthKey();
  const monthlyAnalysisUsage = Number(analysisUsageByMonth[currentAnalysisMonthKey]) || 0;
  const isPremium = false;
  const canUseReceiptAnalysis = isPremium || monthlyAnalysisUsage < FREE_MONTHLY_ANALYSIS_LIMIT;
  const freeUsageText = t.freeUsageText(
    Math.min(monthlyAnalysisUsage, FREE_MONTHLY_ANALYSIS_LIMIT),
    FREE_MONTHLY_ANALYSIS_LIMIT
  );
  const sortedReceipts = useMemo(
    () => [...receipts].sort((first, second) => getReceiptTime(second) - getReceiptTime(first)),
    [receipts]
  );
  const recentReceipts = useMemo(
    () =>
      filterReceiptsByMonthKey(sortedReceipts, incomeMonthKey)
        .sort((first, second) => getReceiptTime(second) - getReceiptTime(first))
        .slice(0, 3),
    [sortedReceipts, incomeMonthKey]
  );
  const merchantGroups = useMemo(() => getMerchantGroups(selectedMonthReceipts), [selectedMonthReceipts]);
  const monthlyProductGroups = useMemo(() => getProductGroups(selectedMonthReceipts), [selectedMonthReceipts]);
  const reportReceipts = useMemo(
    () => searchReceipts(filterReceiptsByPeriod(sortedReceipts, reportPeriod), reportSearchText),
    [sortedReceipts, reportPeriod, reportSearchText]
  );
  const reportTotalSpend = useMemo(
    () => reportReceipts.reduce((sum, receipt) => sum + receipt.amount, 0),
    [reportReceipts]
  );
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

  function updateMonthlyIncome(value) {
    setIncomeByMonth((currentIncome) => ({
      ...currentIncome,
      [incomeMonthKey]: value,
    }));
  }

  function chooseAuthMethod(method) {
    setAuthChoice(method);
    setScreen('home');
    setSettingsSection('main');
  }

  function signOutAccount() {
    Alert.alert(t.signOutTitle, t.signOutMessage, [
      { text: t.cancel, style: 'cancel' },
      {
        text: t.signOutConfirm,
        style: 'destructive',
        onPress: () => {
          setAuthChoice(null);
          setScreen('home');
          setSettingsSection('main');
        },
      },
    ]);
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

    if (screen === 'report' && reportSearchText.trim()) {
      setReportSearchText('');
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
    [screen, settingsSection, previewImage, reportSearchText, photoOptionsOpen, detailReturnScreen]
  );
  const canShowBackControl =
    !previewImage &&
    ((screen === 'settings' && settingsSection !== 'main') ||
      (screen === 'report' && Boolean(reportSearchText.trim())) ||
      (screen === 'home' && photoOptionsOpen) ||
      screen === 'detail');

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
    const total = editItems.reduce((sum, item) => sum + parseAmount(item.amountText), 0);

    if (total > 0) {
      setEditAmountText(String(total).replace('.', ','));
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
      date: editDateText.trim() || formatReceiptDate(selectedReceipt.createdAt),
      category: categoryForSave,
      items: editedItemsForSave,
    };

    setReceipts((currentReceipts) =>
      currentReceipts.map((receipt) =>
        receipt.id === selectedReceipt.id ? updatedReceipt : receipt
      )
    );
    setSelectedReceipt(updatedReceipt);
    setEditingReceipt(false);
  }

  function deleteSelectedReceipt() {
    if (!selectedReceipt) {
      return;
    }

    const receiptToDelete = selectedReceipt;

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
          setSelectedReceipt(null);
          setScreen(detailReturnScreen);
        },
      },
    ]);
  }

  async function createDataBackup() {
    try {
      await ensureDirectory(BACKUP_DIR);

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const fileName = `paranereye-backup-${timestamp}.json`;
      const targetUri = `${BACKUP_DIR}${fileName}`;
      const backupData = {
        version: 1,
        createdAt: Date.now(),
        receipts,
        incomeByMonth,
        selectedLanguage,
        selectedCurrency,
      };

      await FileSystem.writeAsStringAsync(targetUri, JSON.stringify(backupData, null, 2));
      Alert.alert(t.backupReady, t.backupReadyText(fileName));
    } catch (error) {
      Alert.alert(t.backupError, t.backupErrorText);
    }
  }

  async function restoreLatestBackup() {
    try {
      const backupDirectory = await FileSystem.getInfoAsync(BACKUP_DIR);

      if (!backupDirectory.exists) {
        Alert.alert(t.noBackupTitle, t.noBackupText);
        return;
      }

      const files = await FileSystem.readDirectoryAsync(BACKUP_DIR);
      const backupFiles = files
        .filter((fileName) => fileName.endsWith('.json'))
        .sort()
        .reverse();

      if (backupFiles.length === 0) {
        Alert.alert(t.noBackupTitle, t.noBackupText);
        return;
      }

      const latestBackupUri = `${BACKUP_DIR}${backupFiles[0]}`;
      const backupText = await FileSystem.readAsStringAsync(latestBackupUri);
      const backupData = JSON.parse(backupText);

      setReceipts(Array.isArray(backupData.receipts) ? backupData.receipts.map(normalizeReceiptCategories) : []);
      setIncomeByMonth(
        backupData.incomeByMonth && typeof backupData.incomeByMonth === 'object'
          ? backupData.incomeByMonth
          : {}
      );

      if (languages.some((language) => language.code === backupData.selectedLanguage)) {
        setSelectedLanguage(backupData.selectedLanguage);
      }

      if (currencies.some((currency) => currency.code === backupData.selectedCurrency)) {
        setSelectedCurrency(backupData.selectedCurrency);
      }

      setSelectedReceipt(null);
      setSettingsSection('main');
      setDetailReturnScreen('report');
      setScreen('home');
      Alert.alert(t.backupRestored, t.backupRestoredText);
    } catch (error) {
      Alert.alert(t.backupError, t.backupErrorText);
    }
  }

  function resetReceiptForm() {
    setStoreName('');
    setAmountText('');
    setReceiptDateText('');
    setSelectedCategory('grocery');
    setCustomCategoryText('');
    setReceiptImage(null);
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
        text: t.viewPremium,
        onPress: () => {
          setPhotoOptionsOpen(false);
          setSettingsSection('premium');
          setScreen('settings');
        },
      },
    ]);
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

  function setTotalFromReceiptItems() {
    const total = receiptItems.reduce((sum, item) => sum + parseAmount(item.amountText), 0);

    if (total > 0) {
      setAmountText(String(Number(total.toFixed(2))).replace('.', ','));
    }
  }

  async function pickReceiptImage() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert(t.permissionNeeded, t.galleryPermission);
      setPhotoOptionsOpen(false);
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: IMAGE_PICKER_MEDIA_TYPES,
      allowsEditing: false,
      quality: 0.85,
    });

    if (!result.canceled && result.assets?.[0]?.uri) {
      try {
        const savedImageUri = await saveReceiptImageToDevice(result.assets[0].uri);
        setReceiptImage(savedImageUri);
        setStoreName('');
        setAmountText('');
        setReceiptDateText(formatReceiptDate(Date.now()));
        setAnalysisConfidence(null);
        setReceiptItems([]);
        setPhotoOptionsOpen(false);
        await analyzeReceiptImage(savedImageUri);
      } catch (error) {
        Alert.alert(t.photoSaveErrorTitle, t.photoSaveErrorText);
      }
    } else {
      setPhotoOptionsOpen(false);
    }
  }

  async function takeReceiptPhoto() {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();

      if (!permission.granted) {
        Alert.alert(t.permissionNeeded, t.cameraPermission);
        setPhotoOptionsOpen(false);
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: false,
        quality: 0.85,
      });

      if (!result.canceled && result.assets?.[0]?.uri) {
        const savedImageUri = await saveReceiptImageToDevice(result.assets[0].uri);
        setReceiptImage(savedImageUri);
        setStoreName('');
        setAmountText('');
        setReceiptDateText(formatReceiptDate(Date.now()));
        setAnalysisConfidence(null);
        setReceiptItems([]);
        setPhotoOptionsOpen(false);
        await analyzeReceiptImage(savedImageUri);
      } else {
        setPhotoOptionsOpen(false);
      }
    } catch (error) {
      console.warn('Camera launch failed.', error);
      setPhotoOptionsOpen(false);
      Alert.alert(t.cameraOpenErrorTitle, t.cameraOpenErrorText);
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

    setAnalysisStatus('analyzing');

    try {
      const analysisResult = await analyzeReceiptPhoto(imageUri);

      setStoreName(analysisResult.storeName || '');
      setAmountText(analysisResult.totalText || '');
      setReceiptDateText(analysisResult.dateText || formatReceiptDate(Date.now()));
      const analyzedCategory = normalizeCategoryKey(analysisResult.categoryKey);
      setSelectedCategory(analyzedCategory);
      setCustomCategoryText('');
      setAnalysisConfidence(analysisResult.confidence ?? null);
      setReceiptItems(createEditableItemsFromList(analysisResult.items || [], analyzedCategory));
      incrementAnalysisUsage();
      setAnalysisStatus('done');
    } catch (error) {
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

  function commitNewReceipt(newReceipt) {
    setReceipts((currentReceipts) => [...currentReceipts, newReceipt]);
    setSelectedReceipt(newReceipt);
    setDetailReturnScreen('home');
    setEditingReceipt(false);
    setEditStoreName(newReceipt.store);
    setEditAmountText(String(newReceipt.amount).replace('.', ','));
    setEditDateText(newReceipt.date);
    setEditCategory(newReceipt.category);
    setEditItems(createEditableItems(newReceipt));
    resetReceiptForm();
    setScreen('detail');
  }

  function saveManualReceipt() {
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

    const newReceipt = {
      id: now,
      createdAt: now,
      store: cleanStoreName,
      amount: normalizeReceiptAmount(amount, receiptItemsForSave),
      category: categoryForSave,
      date: cleanDateText,
      image: receiptImage,
      items: receiptItemsForSave,
    };

    commitNewReceipt(newReceipt);
  }

  if (!storageReady) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style="dark" />
        <View style={styles.app}>
          <View style={styles.header}>
            <View>
              <Text style={styles.appName}>Nereye</Text>
              <Text style={styles.muted}>{t.appSubtitle}</Text>
            </View>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  if (!authChoice) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style="dark" />
        <View style={styles.app}>
          <AuthStartScreen onChoose={chooseAuthMethod} t={t} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <View style={styles.app}>
        <View style={styles.header}>
          {canShowBackControl && (
            <Pressable style={styles.headerBackButton} onPress={goBack}>
              <Text style={styles.headerBackText}>‹</Text>
            </Pressable>
          )}
          <View>
            <Text style={styles.appName}>Nereye</Text>
            <Text style={styles.muted}>{t.appSubtitle}</Text>
          </View>
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {screen === 'home' && (
            <HomeScreen
              totalSpend={selectedMonthSpend}
              remaining={remaining}
              savingRate={savingRate}
              topCategory={topCategory}
              recentReceipts={recentReceipts}
              receiptCount={selectedMonthReceipts.length}
              onSelectReceipt={openReceiptDetail}
              t={t}
              receiptComposer={
                <ReceiptScreen
                  storeName={storeName}
                  setStoreName={setStoreName}
                  amountText={amountText}
                  setAmountText={setAmountText}
                  receiptDateText={receiptDateText}
                  setReceiptDateText={setReceiptDateText}
                  selectedCategory={selectedCategory}
                  setSelectedCategory={setSelectedCategory}
                  customCategoryText={customCategoryText}
                  setCustomCategoryText={setCustomCategoryText}
                  receiptImage={receiptImage}
                  receiptItems={receiptItems}
                  onUpdateReceiptItemCategory={updateReceiptItemCategory}
                  onUpdateReceiptItem={updateReceiptItem}
                  onAddReceiptItem={addReceiptItem}
                  onRemoveReceiptItem={removeReceiptItem}
                  onSetTotalFromReceiptItems={setTotalFromReceiptItems}
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
              receiptCount={reportReceipts.length}
              categories={reportCategories}
              topCategory={reportTopCategory}
              receipts={reportReceipts}
              merchantGroups={reportMerchantGroups}
              reportPeriod={reportPeriod}
              setReportPeriod={setReportPeriod}
              reportSearchText={reportSearchText}
              setReportSearchText={setReportSearchText}
              onSelectMerchant={(merchant) => setReportSearchText(merchant.store)}
              onSelectReceipt={openReceiptDetail}
              t={t}
            />
          )}

          {screen === 'products' && (
            <ProductsScreen
              productGroups={monthlyProductGroups}
              monthKey={incomeMonthKey}
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
              setSelectedLanguage={setSelectedLanguage}
              selectedCurrency={selectedCurrency}
              setSelectedCurrency={setSelectedCurrency}
              settingsSection={settingsSection}
              setSettingsSection={setSettingsSection}
              onReport={() => setScreen('report')}
              onCreateBackup={createDataBackup}
              onRestoreBackup={restoreLatestBackup}
              authChoice={authChoice}
              onSignOut={signOutAccount}
              t={t}
            />
          )}
        </ScrollView>

        {canShowBackControl && (
          <View style={styles.edgeBackZone} {...swipeResponder.panHandlers} />
        )}

        <View style={styles.navArea} pointerEvents="box-none">
          <View style={styles.nav}>
            <NavButton
              label={t.navHome}
              active={screen === 'home' || (screen === 'detail' && detailReturnScreen === 'home')}
              onPress={() => setScreen('home')}
            />
            <NavButton
              label={t.navReport}
              active={screen === 'report' || (screen === 'detail' && detailReturnScreen === 'report')}
              onPress={() => setScreen('report')}
            />
            <NavButton
              label={t.navProducts}
              active={screen === 'products' || (screen === 'detail' && detailReturnScreen === 'products')}
              onPress={() => setScreen('products')}
            />
            <NavButton
              label={t.navSettings}
              active={screen === 'settings' || (screen === 'detail' && detailReturnScreen === 'settings')}
              onPress={() => setScreen('settings')}
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

function HomeScreen({
  totalSpend,
  remaining,
  savingRate,
  topCategory,
  recentReceipts,
  receiptCount,
  onSelectReceipt,
  receiptComposer,
  t,
}) {
  const topCategoryLabel = getCategoryLabel(topCategory.key, t);

  return (
    <View>
      <View style={styles.homeHero}>
        <Text style={styles.label}>{t.totalThisMonth}</Text>
        <Text style={styles.homeAmount}>{formatTL(totalSpend)}</Text>
        <Text style={styles.homeHeroText}>
          {t.topCategorySentence(topCategoryLabel, formatTL(topCategory.amount))}
        </Text>

        <View style={styles.homeSummaryRow}>
          <View style={styles.homeSummaryItem}>
            <Text style={styles.homeSummaryLabel}>{t.moneyLeft}</Text>
            <Text style={styles.homeSummaryValue}>{formatTL(remaining)}</Text>
          </View>
          <View style={styles.homeSummaryItem}>
            <Text style={styles.homeSummaryLabel}>{t.savings}</Text>
            <Text style={styles.homeSummaryValue}>%{savingRate}</Text>
          </View>
        </View>
      </View>

      <View style={styles.metricGrid}>
        <Metric title={t.receiptCount} value={String(receiptCount)} />
        <Metric title={t.highest} value={topCategoryLabel} />
      </View>

      <HomeReceiptList
        title={t.recentSpending}
        receipts={recentReceipts}
        onSelectReceipt={onSelectReceipt}
        t={t}
      />

      <View style={styles.homeReceiptComposer}>
        {receiptComposer}
      </View>
    </View>
  );
}

function ReceiptScreen({
  storeName,
  setStoreName,
  amountText,
  setAmountText,
  receiptDateText,
  setReceiptDateText,
  selectedCategory,
  setSelectedCategory,
  customCategoryText,
  setCustomCategoryText,
  receiptImage,
  receiptItems,
  onUpdateReceiptItemCategory,
  onUpdateReceiptItem,
  onAddReceiptItem,
  onRemoveReceiptItem,
  onSetTotalFromReceiptItems,
  analysisStatus,
  analysisConfidence,
  usageText,
  photoOptionsOpen,
  onOpenPhotoOptions,
  onClosePhotoOptions,
  onPickImage,
  onTakePhoto,
  onReanalyze,
  onSave,
  onPreviewImage,
  t,
}) {
  const requiredFieldsComplete =
    Boolean(storeName.trim()) && Boolean(amountText.trim());
  const confidencePercent =
    typeof analysisConfidence === 'number' ? Math.round(analysisConfidence * 100) : null;
  const needsReview = confidencePercent === null || confidencePercent < 85 || !requiredFieldsComplete;
  const showSimpleAddButton =
    !receiptImage && !storeName && !amountText && receiptItems.length === 0 && analysisStatus !== 'done';

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

      {(receiptImage || storeName || amountText) && (
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

          <Text style={styles.inputLabel}>{t.date}</Text>
          <TextInput
            style={styles.input}
            value={receiptDateText}
            onChangeText={setReceiptDateText}
            placeholder={formatReceiptDate(Date.now())}
          />

          {analysisStatus !== 'done' && (
            <Text style={styles.manualSaveText}>{t.manualSaveHelp}</Text>
          )}

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
                  {getCategoryLabel(category.key, t)}
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

              return (
                <View style={styles.receiptItemEditCard} key={normalizedItem.id || `${normalizedItem.name}-${index}`}>
                  <View style={styles.editItemHeader}>
                    <Text style={styles.editItemTitle}>
                      {t.items} {index + 1}
                    </Text>
                    <Pressable onPress={() => onRemoveReceiptItem(normalizedItem.id)}>
                      <Text style={styles.removeItemText}>{t.removeItem}</Text>
                    </Pressable>
                  </View>

                  <TextInput
                    style={styles.itemInput}
                    value={String(normalizedItem.name || '')}
                    onChangeText={(value) => onUpdateReceiptItem(normalizedItem.id, 'name', value)}
                    placeholder={t.itemName}
                  />

                  <TextInput
                    style={styles.itemInput}
                    value={String(normalizedItem.amountText || '')}
                    onChangeText={(value) => onUpdateReceiptItem(normalizedItem.id, 'amountText', value)}
                    keyboardType="decimal-pad"
                    placeholder={t.itemAmount}
                  />

                  <View style={styles.itemInlineInputs}>
                    <TextInput
                      style={[styles.itemInput, styles.itemInlineInput]}
                      value={String(normalizedItem.quantityText || '')}
                      onChangeText={(value) => onUpdateReceiptItem(normalizedItem.id, 'quantityText', value)}
                      keyboardType="decimal-pad"
                      placeholder={t.quantity}
                    />
                    <TextInput
                      style={[styles.itemInput, styles.itemInlineInput]}
                      value={String(normalizedItem.unit || '')}
                      onChangeText={(value) => onUpdateReceiptItem(normalizedItem.id, 'unit', value)}
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
                        onPress={() => onUpdateReceiptItem(normalizedItem.id, 'category', category.key)}
                      >
                        <Text
                          style={[
                            styles.receiptItemCategoryText,
                            itemCategory === category.key && styles.receiptItemCategoryTextActive,
                          ]}
                        >
                          {getCategoryLabel(category.key, t)}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
              );
            })}

            <Pressable style={styles.addItemButton} onPress={onAddReceiptItem}>
              <Text style={styles.addItemText}>+ {t.addItem}</Text>
            </Pressable>

            <Pressable style={styles.calculateItemsButton} onPress={onSetTotalFromReceiptItems}>
              <Text style={styles.calculateItemsText}>{t.autoTotalFromItems}</Text>
            </Pressable>
          </View>
        </View>
      )}

      {requiredFieldsComplete ? (
        <PrimaryButton
          label={t.confirmAndSave}
          onPress={onSave}
        />
      ) : null}
    </View>
  );
}

function ReportScreen({
  totalSpend,
  receiptCount,
  categories,
  topCategory,
  receipts,
  merchantGroups,
  reportPeriod,
  setReportPeriod,
  reportSearchText,
  setReportSearchText,
  onSelectMerchant,
  onSelectReceipt,
  t,
}) {
  const maxAmount = Math.max(1, ...categories.map((category) => category.amount));
  const topCategoryLabel = getCategoryLabel(topCategory.key, t);
  const periodFilters = [
    { key: 'month', label: t.thisMonth },
    { key: 'week', label: t.thisWeek },
    { key: 'all', label: t.allTime },
  ];

  return (
    <View>
      <View style={styles.reportHero}>
        <Text style={styles.label}>{t.totalSpending}</Text>
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
          <View style={styles.barItem} key={category.key}>
            <View style={styles.barTop}>
              <Text style={styles.barName}>{getCategoryLabel(category.key, t)}</Text>
              <Text style={styles.barName}>{formatTL(category.amount)}</Text>
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
          </View>
        ))}
      </View>

      <MerchantList merchantGroups={merchantGroups} onSelectMerchant={onSelectMerchant} t={t} />

      <ReceiptList
        title={t.receiptArchive}
        subtitle={t.archiveInfo}
        receipts={receipts}
        onSelectReceipt={onSelectReceipt}
        t={t}
      />
    </View>
  );
}

function ProductsScreen({ productGroups, monthKey, t }) {
  const topProduct = productGroups[0];

  return (
    <View>
      <View style={styles.reportHero}>
        <Text style={styles.label}>{formatMonthKey(monthKey)}</Text>
        <Text style={styles.reportAmount}>{t.productsTitle}</Text>
        <Text style={styles.sectionSubtitle}>{t.productsInfo}</Text>
      </View>

      {topProduct ? (
        <View style={styles.card}>
          <Text style={styles.label}>{t.topProduct}</Text>
          <View style={styles.productHeroRow}>
            <View style={styles.receiptTextBlock}>
              <Text style={styles.productHeroName}>{topProduct.name}</Text>
              <Text style={styles.rowMeta}>
                {t.quantity}: {formatQuantity(topProduct.quantity)}
                {topProduct.unit ? ` ${topProduct.unit}` : ''} - {topProduct.count} {t.receiptsShort}
              </Text>
            </View>
            <Text style={styles.productHeroAmount}>{formatTL(topProduct.amount)}</Text>
          </View>
        </View>
      ) : (
        <View style={styles.card}>
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>{t.noProductData}</Text>
            <Text style={styles.emptyText}>{t.noProductDataText}</Text>
          </View>
        </View>
      )}

      <Text style={styles.sectionTitle}>{t.productBreakdown}</Text>
      <View style={styles.card}>
        {productGroups.length === 0 && <Text style={styles.emptyText}>{t.noProductDataText}</Text>}
        {productGroups.map((product, index) => (
          <View style={styles.productRow} key={product.key}>
            <View style={styles.productRank}>
              <Text style={styles.productRankText}>{index + 1}</Text>
            </View>
            <View style={styles.receiptTextBlock}>
              <Text style={styles.rowText}>{product.name}</Text>
              <Text style={styles.rowMeta}>
                {t.quantity}: {formatQuantity(product.quantity)}
                {product.unit ? ` ${product.unit}` : ''} - {product.count} {t.receiptsShort}
              </Text>
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
  setSelectedLanguage,
  selectedCurrency,
  setSelectedCurrency,
  settingsSection,
  setSettingsSection,
  onReport,
  onCreateBackup,
  onRestoreBackup,
  authChoice,
  onSignOut,
  t,
}) {
  const [feedbackText, setFeedbackText] = useState('');
  const selectedLanguageName =
    languages.find((language) => language.code === selectedLanguage)?.name || 'English';
  const selectedCurrencyItem =
    currencies.find((currency) => currency.code === selectedCurrency) || currencies[0];

  async function sendFeedback() {
    const message = feedbackText.trim();

    if (!message) {
      Alert.alert(t.feedbackEmptyTitle, t.feedbackEmptyText);
      return;
    }

    const subject = encodeURIComponent('Nereye feedback');
    const body = encodeURIComponent(`${message}\n\n---\nLanguage: ${selectedLanguage}\nCurrency: ${selectedCurrency}`);
    const mailUrl = `mailto:${FEEDBACK_EMAIL}?subject=${subject}&body=${body}`;

    try {
      await Linking.openURL(mailUrl);
    } catch (error) {
      Alert.alert(t.feedbackMailTitle, t.feedbackMailText);
    }
  }

  if (settingsSection === 'language') {
    return (
      <View>
        <View style={styles.settingsList}>
          {languages.map((language) => (
            <Pressable
              key={language.code}
              style={styles.settingsRow}
              onPress={() => setSelectedLanguage(language.code)}
            >
              <View>
                <Text style={styles.settingsTitle}>{language.name}</Text>
                <Text style={styles.settingsText}>{language.code.toUpperCase()}</Text>
              </View>
              <Text style={styles.settingsValue}>
                {selectedLanguage === language.code ? t.selected : ''}
              </Text>
            </Pressable>
          ))}
        </View>

        <SecondaryButton label={t.back} onPress={() => setSettingsSection('main')} />
      </View>
    );
  }

  if (settingsSection === 'currency') {
    return (
      <View>
        <View style={styles.settingsList}>
          {currencies.map((currency) => (
            <Pressable
              key={currency.code}
              style={styles.settingsRow}
              onPress={() => setSelectedCurrency(currency.code)}
            >
              <View>
                <Text style={styles.settingsTitle}>{currency.name}</Text>
                <Text style={styles.settingsText}>
                  {currency.code} - {currency.symbol}
                </Text>
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

  if (settingsSection === 'backup') {
    return (
      <View>
        <View style={styles.card}>
          <Text style={styles.analysisTitle}>{t.dataBackup}</Text>
          <Text style={styles.analysisText}>{t.backupInfo}</Text>
        </View>

        <PrimaryButton label={t.createBackup} onPress={onCreateBackup} />
        <SecondaryButton label={t.restoreBackup} onPress={onRestoreBackup} />
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
        <SecondaryButton label={t.back} onPress={() => setSettingsSection('main')} />
      </View>
    );
  }

  if (settingsSection === 'account') {
    const providerLabel = getAuthProviderLabel(authChoice, t);

    return (
      <View>
        <View style={styles.card}>
          <Text style={styles.analysisTitle}>{t.accountSync}</Text>
          <Text style={styles.analysisText}>{t.accountSyncInfo}</Text>
          <View style={styles.syncStatusRow}>
            <Text style={styles.rowText}>
              {authChoice ? t.signedInWith(providerLabel) : t.notSignedIn}
            </Text>
          </View>
        </View>

        <DangerButton label={t.signOut} onPress={onSignOut} />
        <SecondaryButton label={t.back} onPress={() => setSettingsSection('main')} />
      </View>
    );
  }

  return (
    <View>
      <View style={styles.settingsList}>
        <SettingsRow
          title={t.premium}
          subtitle={t.premiumInfo}
          value=">"
          onPress={() => setSettingsSection('premium')}
        />
        <SettingsRow
          title={t.accountSync}
          subtitle={t.accountSyncInfo}
          value=">"
          onPress={() => setSettingsSection('account')}
        />
        <SettingsRow
          title={t.language}
          subtitle={selectedLanguageName}
          value=">"
          onPress={() => setSettingsSection('language')}
        />
        <SettingsRow
          title={t.income}
          subtitle={`${formatTL(salary)} / ${t.remainingMoney}: ${formatTL(remaining)}`}
          value=">"
          onPress={() => setSettingsSection('income')}
        />
        <SettingsRow
          title={t.currency}
          subtitle={`${selectedCurrencyItem.symbol} ${selectedCurrencyItem.code}`}
          value=">"
          onPress={() => setSettingsSection('currency')}
        />
        <SettingsRow
          title={t.dataBackup}
          subtitle={t.backupInfo}
          value=">"
          onPress={() => setSettingsSection('backup')}
        />
        <SettingsRow
          title={t.feedback}
          subtitle={t.feedbackInfo}
          value=">"
          onPress={() => setSettingsSection('feedback')}
        />
      </View>
    </View>
  );
}

function SettingsRow({ title, subtitle, value, onPress }) {
  return (
    <Pressable style={styles.settingsRow} onPress={onPress} disabled={!onPress}>
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
  t,
}) {
  const items = Array.isArray(receipt.items) ? receipt.items : [];
  const detailDate = normalizeDateDisplay(receipt.date, receipt.createdAt);

  return (
    <View>
      <View style={styles.receiptDetailHero}>
        <Text style={styles.receiptDetailLabel}>{t.receiptDetail}</Text>
        <Text style={styles.receiptDateTitle}>{detailDate}</Text>
        <Text style={styles.receiptStoreTitle}>{receipt.store}</Text>
      </View>

      {!editing && <PrimaryButton label={t.editReceipt} onPress={onStartEdit} />}

      {receipt.image ? (
        <View style={styles.detailImageBox}>
          <Pressable onPress={() => onPreviewImage(receipt.image)}>
            <Image source={{ uri: receipt.image }} style={styles.detailImage} />
          </Pressable>
        </View>
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
                  {getCategoryLabel(category.key, t)}
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
                        {getCategoryLabel(category.key, t)}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            ))}

            <Pressable style={styles.addItemButton} onPress={onAddEditItem}>
              <Text style={styles.addItemText}>+ {t.addItem}</Text>
            </Pressable>

            <Pressable style={styles.calculateItemsButton} onPress={onSetTotalFromItems}>
              <Text style={styles.calculateItemsText}>{t.autoTotalFromItems}</Text>
            </Pressable>
          </View>

          <PrimaryButton label={t.saveChanges} onPress={onSaveEdit} />
          <SecondaryButton label={t.cancel} onPress={onCancelEdit} />
        </View>
      ) : (
        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.rowText}>{t.total}</Text>
            <Text style={styles.rowAmount}>{formatTL(receipt.amount)}</Text>
          </View>
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
                    <Text style={styles.rowAmount}>{formatTL(normalizedItem.amount)}</Text>
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

function ReceiptList({ title, subtitle, receipts, onSelectReceipt, t }) {
  return (
    <View>
      <Text style={styles.sectionTitle}>{title}</Text>
      {subtitle && <Text style={styles.sectionSubtitle}>{subtitle}</Text>}
      <View style={styles.card}>
        {receipts.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>{t.noReceipts}</Text>
            <Text style={styles.emptyText}>{t.noReceiptsText}</Text>
          </View>
        )}
        {receipts.map((receipt) => (
          <Pressable
            style={styles.row}
            key={receipt.id}
            onPress={() => onSelectReceipt?.(receipt)}
          >
            <View style={styles.receiptTextBlock}>
              <Text style={styles.rowText}>{receipt.store}</Text>
              <Text style={styles.rowMeta}>
                {getCategoryLabel(receipt.category, t)} - {normalizeDateDisplay(receipt.date, receipt.createdAt)}
                {receipt.image ? ` - ${t?.photoAvailable || 'photo'}` : ''}
              </Text>
              {onSelectReceipt && <Text style={styles.rowHint}>{t?.tapForDetails}</Text>}
            </View>
            <Text style={styles.rowAmount}>{formatTL(receipt.amount)}</Text>
          </Pressable>
        ))}
      </View>
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

function HomeReceiptList({ title, receipts, onSelectReceipt, t }) {
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
          <Pressable
            style={styles.homeReceiptRow}
            key={receipt.id}
            onPress={() => onSelectReceipt?.(receipt)}
          >
            <View style={styles.receiptTextBlock}>
              <Text style={styles.homeReceiptStore}>{receipt.store}</Text>
              <Text style={styles.rowMeta}>
                {getCategoryLabel(receipt.category, t)} - {normalizeDateDisplay(receipt.date, receipt.createdAt)}
              </Text>
            </View>
            <Text style={styles.homeReceiptAmount}>{formatTL(receipt.amount)}</Text>
          </Pressable>
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
            style={styles.previewZoomArea}
            contentContainerStyle={styles.previewZoomContent}
            maximumZoomScale={4}
            minimumZoomScale={1}
            showsHorizontalScrollIndicator={false}
            showsVerticalScrollIndicator={false}
            bouncesZoom
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

function AuthStartScreen({ onChoose, t }) {
  return (
    <View style={styles.authScreen}>
      <View style={styles.authHeader}>
        <View style={styles.authLogoLarge}>
          <Text style={styles.authLogoText}>N</Text>
        </View>
        <Text style={styles.authBrandName}>Nereye</Text>
        <Text style={styles.authTitle}>{t.welcomeTitle}</Text>
        <Text style={styles.authText}>{t.welcomeText}</Text>
      </View>

      <View style={styles.authActionsCard}>
        <PrimaryButton label={t.signInWithGoogle} onPress={() => onChoose('google')} />
        <SecondaryButton label={t.signInWithICloud} onPress={() => onChoose('icloud')} />
      </View>
    </View>
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

function PhotoOptionsSheet({ visible, onClose, onTakePhoto, onPickImage, t }) {
  function handleTakePhoto() {
    onTakePhoto();
  }

  function handlePickImage() {
    onPickImage();
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
        </View>
      </View>
    </Modal>
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

function NavButton({ label, active, onPress }) {
  return (
    <Pressable style={[styles.navButton, active && styles.navButtonActive]} onPress={onPress}>
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
  header: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  headerBackButton: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderColor: '#dfe8e0',
    borderRadius: 999,
    borderWidth: 1,
    height: 42,
    justifyContent: 'center',
    width: 42,
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
  },
  muted: {
    color: '#68766b',
    fontSize: 13,
    fontWeight: '600',
  },
  authScreen: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  authHeader: {
    alignItems: 'center',
    marginBottom: 28,
  },
  authLogoLarge: {
    alignItems: 'center',
    backgroundColor: '#15803d',
    borderRadius: 16,
    height: 72,
    justifyContent: 'center',
    width: 72,
  },
  authLogoText: {
    color: '#ffffff',
    fontSize: 34,
    fontWeight: '900',
  },
  authBrandName: {
    color: '#172018',
    fontSize: 30,
    fontWeight: '900',
    marginTop: 18,
  },
  authTitle: {
    color: '#172018',
    fontSize: 24,
    fontWeight: '900',
    lineHeight: 30,
    marginTop: 28,
    textAlign: 'center',
  },
  authText: {
    color: '#4f5d52',
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 22,
    marginTop: 8,
    textAlign: 'center',
  },
  authActionsCard: {
    gap: 10,
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
  receiptDetailHero: {
    backgroundColor: '#eaf8ec',
    borderColor: '#dceade',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 18,
    paddingVertical: 22,
    alignItems: 'center',
  },
  receiptDetailLabel: {
    color: '#0d5f2b',
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  receiptDateTitle: {
    color: '#172018',
    fontSize: 25,
    fontWeight: '900',
    lineHeight: 31,
    marginTop: 8,
    textAlign: 'center',
  },
  receiptStoreTitle: {
    color: '#4f5d52',
    fontSize: 16,
    fontWeight: '800',
    marginTop: 8,
    textAlign: 'center',
  },
  homeHero: {
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
    textTransform: 'uppercase',
  },
  homeAmount: {
    color: '#172018',
    fontSize: 44,
    fontWeight: '900',
    marginTop: 8,
  },
  homeHeroText: {
    color: '#4f5d52',
    fontSize: 14,
    lineHeight: 20,
    marginTop: 8,
  },
  homeSummaryRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 18,
  },
  homeSummaryItem: {
    flex: 1,
    backgroundColor: '#eaf8ec',
    borderRadius: 8,
    padding: 12,
  },
  homeSummaryLabel: {
    color: '#68766b',
    fontSize: 12,
    fontWeight: '800',
  },
  homeSummaryValue: {
    color: '#172018',
    fontSize: 18,
    fontWeight: '900',
    marginTop: 5,
  },
  reportHero: {
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
  },
  reportInfoRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 18,
  },
  reportInfoItem: {
    flex: 1,
    backgroundColor: '#eaf8ec',
    borderRadius: 8,
    padding: 10,
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
    textTransform: 'uppercase',
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
    resizeMode: 'cover',
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
    shadowColor: '#0f2415',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.16,
    shadowRadius: 24,
    elevation: 12,
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
  },
  metricValue: {
    color: '#172018',
    fontSize: 19,
    fontWeight: '900',
  },
  homeReceiptComposer: {
    marginTop: 10,
  },
  card: {
    backgroundColor: '#fff',
    borderColor: '#dfe8e0',
    borderWidth: 1,
    borderRadius: 8,
    padding: 16,
    marginTop: 12,
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
  productHeroRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
    marginTop: 10,
  },
  productHeroName: {
    color: '#172018',
    fontSize: 22,
    fontWeight: '900',
  },
  productHeroAmount: {
    color: '#0d5f2b',
    fontSize: 18,
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
  previewZoomArea: {
    flex: 1,
    width: '100%',
  },
  previewZoomContent: {
    alignItems: 'center',
    flexGrow: 1,
    justifyContent: 'center',
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
    marginBottom: 16,
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
  calculateItemsButton: {
    borderRadius: 8,
    alignItems: 'center',
    paddingVertical: 13,
    backgroundColor: '#e6f5ea',
    marginTop: 10,
  },
  calculateItemsText: {
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
  languageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 10,
  },
  languageButton: {
    width: '48.5%',
    minHeight: 48,
    borderColor: '#dfe8e0',
    borderWidth: 1,
    borderRadius: 8,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  languageButtonActive: {
    borderColor: '#157f3b',
    backgroundColor: '#e6f5ea',
  },
  languageText: {
    color: '#344337',
    fontSize: 14,
    fontWeight: '900',
  },
  languageTextActive: {
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
  settingsTextBlock: {
    flex: 1,
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
    shadowColor: '#0f2415',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 18,
    elevation: 8,
  },
  navButton: {
    flex: 1,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    paddingHorizontal: 4,
  },
  navButtonActive: {
    backgroundColor: '#157f3b',
  },
  navText: {
    color: '#68766b',
    fontSize: 11,
    fontWeight: '900',
  },
  navTextActive: {
    color: '#ffffff',
  },
});

