const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const root = path.resolve(__dirname, "..", "..");
const outRoot = __dirname;
const htmlDir = path.join(outRoot, ".generated-html");
const chromePath = [
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
].find((candidate) => fs.existsSync(candidate));

if (!chromePath) {
  throw new Error("Chrome or Edge was not found.");
}

const green = "#168a43";
const dark = "#102018";
const muted = "#68756c";
const bg = "#f3f7f3";
const border = "#dce6de";
const pale = "#e8f7ee";

const locales = {
  "en-US": {
    name: "English",
    promo: "Scan receipts, save details, and understand your spending with a simple receipt tracker.",
    desc: [
      "Reciro helps you keep receipts organized and understand where your money goes.",
      "Take a photo, choose an image, or save a PDF receipt. Reciro extracts useful details such as the store, date, total, category, and products so you can review everything before saving.",
      "Track monthly spending, browse receipts by month, see category reports, and discover which products you buy most. Your receipt data stays on your device unless you choose to export it yourself.",
      "Reciro is built to be simple, private, and easy to use.",
    ],
    features: [
      "Scan receipt photos with AI-assisted analysis",
      "Save receipt images and PDF invoices",
      "Review and edit details before saving",
      "Track monthly spending and receipt history",
      "See category, store, and product summaries",
      "Add monthly payments and budgets",
      "Export your data when you need a backup",
    ],
    keywords: "receipt scanner,expense tracker,budget,spending,invoice,receipt,finance,money,shopping,scan",
    terms: { groceries: "Groceries", fuel: "Fuel", transport: "Transport", today: "today", yesterday: "yesterday", receipts: "receipts", receipt: "receipt" },
    tabs: ["Home", "Reports", "Months", "Products", "Settings"],
    screens: {
      home: ["See your spending clearly", "Scan receipts, track totals, and keep every purchase organized.", "Dashboard", "This month", "Highest spending: Groceries", "Receipts", "Top store", "Add Receipt"],
      add: ["Add a receipt in seconds", "Camera, gallery, or PDF. Reciro starts the analysis right away.", "Add Receipt", "Choose a source and let AI fill the details.", "AI ready", "No receipt selected", "Take a photo or pick an existing file.", "Camera", "Gallery", "PDF upload", "Add Receipt Photo"],
      review: ["Review AI results before saving", "Check the store, total, category, and products before they enter your reports.", "Review Receipt", "Analysis confidence: 94%", "Store", "Editable", "Total", "From receipt", "Category", "Detected automatically", "Confirm and Save"],
      detail: ["Keep every receipt in one place", "Open the original receipt anytime and edit details when needed.", "Receipt Detail", "Green Market", "Total", "Category", "Products", "Edit Receipt"],
      reports: ["Understand where money goes", "Category and store reports make monthly spending easy to read.", "Reports", "This month", "Total spending", "Groceries", "Fuel", "Transport", "Green Market", "City Fuel"],
      months: ["Browse receipts by month", "Receipts are sorted by the date printed on the receipt.", "Monthly Receipts", "Choose a month to see every receipt.", "July 2026", "June 2026", "May 2026", "April 2026"],
      products: ["See what you buy most", "Product summaries are grouped by month, year, or all time.", "Product Summary", "July 2026", "Water", "Bread", "Tomatoes", "Chicken", "Yogurt", "Sorted by quantity", "Know the products you buy most, not only the most expensive ones."],
      settings: ["Stay in control", "Budgets, monthly payments, privacy, and exports are easy to manage.", "Settings", "Your data stays on your device.", "Money & Budget", "Receipt Analysis", "My Data", "Privacy & Legal", "Help & Feedback", "Private by design", "Reciro stores receipts locally unless you choose to export your own backup."],
    },
  },
  "tr-TR": {
    name: "Turkish",
    promo: "Fişlerini tara, detayları kaydet ve harcamalarını sade şekilde takip et.",
    desc: [
      "Reciro, fişlerini düzenli tutmana ve paranı nereye harcadığını kolayca anlamana yardımcı olur.",
      "Fotoğraf çek, galeriden seç veya PDF fiş kaydet. Reciro mağaza, tarih, toplam tutar, kategori ve ürünleri çıkarır; kaydetmeden önce her şeyi kontrol edebilirsin.",
      "Aylık harcamaları takip et, fişleri aya göre bul, kategori raporlarını gör ve en çok aldığın ürünleri keşfet. Verilerin sen dışa aktarmadıkça cihazında kalır.",
      "Reciro basit, özel ve kullanımı kolay olacak şekilde tasarlandı.",
    ],
    features: [
      "Yapay zeka destekli fiş fotoğrafı analizi",
      "Fiş fotoğraflarını ve PDF faturaları saklama",
      "Kaydetmeden önce detayları düzenleme",
      "Aylık harcama ve fiş geçmişi takibi",
      "Kategori, mağaza ve ürün özetleri",
      "Aylık ödemeler ve bütçeler",
      "Gerektiğinde veri dışa aktarma",
    ],
    keywords: "fiş tarayıcı,harcama takibi,bütçe,para,fatura,alışveriş,finans,masraf,gelir,tarama",
    terms: { groceries: "Market", fuel: "Yakıt", transport: "Ulaşım", today: "bugün", yesterday: "dün", receipts: "fiş", receipt: "fiş" },
    tabs: ["Ana", "Rapor", "Aylar", "Ürünler", "Ayarlar"],
    screens: {
      home: ["Harcamalarını net gör", "Fişleri tara, toplamları takip et ve her alışverişi düzenli tut.", "Ana Sayfa", "Bu ay", "En yüksek harcama: Market", "Fişler", "En çok mağaza", "Fiş Ekle"],
      add: ["Saniyeler içinde fiş ekle", "Kamera, galeri veya PDF. Reciro analizi hemen başlatır.", "Fiş Ekle", "Kaynağı seç, detayları yapay zeka doldursun.", "AI hazır", "Fiş seçilmedi", "Fotoğraf çek veya mevcut dosya seç.", "Kamera", "Galeri", "PDF yükle", "Fiş Fotoğrafı Ekle"],
      review: ["Kaydetmeden önce kontrol et", "Mağaza, toplam, kategori ve ürünleri raporlara eklenmeden incele.", "Fişi Kontrol Et", "Analiz güveni: %94", "Mağaza", "Düzenlenebilir", "Toplam", "Fişten okundu", "Kategori", "Otomatik algılandı", "Onayla ve Kaydet"],
      detail: ["Her fiş tek yerde kalsın", "Orijinal fişi istediğin zaman aç ve gerekirse detayları düzenle.", "Fiş Detayı", "Green Market", "Toplam", "Kategori", "Ürünler", "Fişi Düzenle"],
      reports: ["Para nereye gidiyor anla", "Kategori ve mağaza raporları aylık harcamayı okunur yapar.", "Raporlar", "Bu ay", "Toplam harcama", "Market", "Yakıt", "Ulaşım", "Green Market", "City Fuel"],
      months: ["Fişleri aya göre bul", "Fişler yükleme tarihine göre değil, fiş tarihine göre sıralanır.", "Aylık Fişler", "Bir ay seç ve tüm fişleri gör.", "Temmuz 2026", "Haziran 2026", "Mayıs 2026", "Nisan 2026"],
      products: ["En çok ne aldığını gör", "Ürün özetleri ay, yıl veya tüm zamanlara göre gruplanır.", "Ürün Özeti", "Temmuz 2026", "Su", "Ekmek", "Domates", "Tavuk", "Yoğurt", "Adede göre sıralı", "Sadece pahalıları değil, en çok aldığın ürünleri de bil."],
      settings: ["Kontrol sende", "Bütçe, aylık ödemeler, gizlilik ve dışa aktarma kolayca yönetilir.", "Ayarlar", "Verilerin cihazında kalır.", "Para ve Bütçe", "Fiş Analizi", "Verilerim", "Gizlilik ve Yasal", "Yardım ve Geri Bildirim", "Gizlilik odaklı", "Reciro, sen yedek almayı seçmedikçe fişleri cihazında saklar."],
    },
  },
  "fr-FR": {
    name: "French",
    promo: "Scannez vos reçus, enregistrez les détails et suivez vos dépenses simplement.",
    desc: [
      "Reciro vous aide à organiser vos reçus et à comprendre où va votre argent.",
      "Prenez une photo, choisissez une image ou enregistrez un reçu PDF. Reciro extrait les détails utiles comme le magasin, la date, le total, la catégorie et les produits pour que vous puissiez tout vérifier avant d’enregistrer.",
      "Suivez vos dépenses mensuelles, parcourez vos reçus par mois, consultez les rapports par catégorie et découvrez les produits que vous achetez le plus. Vos données restent sur votre appareil sauf si vous choisissez de les exporter.",
      "Reciro est conçu pour être simple, privé et facile à utiliser.",
    ],
    features: [
      "Analyse de reçus avec assistance IA",
      "Enregistrement de photos et factures PDF",
      "Vérification et modification avant sauvegarde",
      "Suivi mensuel des dépenses",
      "Résumés par catégorie, magasin et produit",
      "Paiements mensuels et budgets",
      "Export de données pour vos sauvegardes",
    ],
    keywords: "scanner reçu,suivi dépenses,budget,argent,facture,reçu,finance,courses,scan,dépenses",
    terms: { groceries: "Courses", fuel: "Carburant", transport: "Transport", today: "aujourd’hui", yesterday: "hier", receipts: "reçus", receipt: "reçu" },
    tabs: ["Accueil", "Rapports", "Mois", "Produits", "Réglages"],
    screens: {
      home: ["Voyez vos dépenses clairement", "Scannez vos reçus, suivez les totaux et organisez chaque achat.", "Accueil", "Ce mois-ci", "Dépense principale : Courses", "Reçus", "Magasin principal", "Ajouter un reçu"],
      add: ["Ajoutez un reçu en quelques secondes", "Caméra, galerie ou PDF. Reciro lance l’analyse automatiquement.", "Ajouter un reçu", "Choisissez une source et laissez l’IA remplir les détails.", "IA prête", "Aucun reçu sélectionné", "Prenez une photo ou choisissez un fichier.", "Caméra", "Galerie", "PDF", "Ajouter une photo"],
      review: ["Vérifiez l’IA avant d’enregistrer", "Contrôlez le magasin, le total, la catégorie et les produits.", "Vérifier le reçu", "Confiance : 94 %", "Magasin", "Modifiable", "Total", "Lu sur le reçu", "Catégorie", "Détectée automatiquement", "Confirmer et enregistrer"],
      detail: ["Gardez chaque reçu au même endroit", "Ouvrez le reçu original à tout moment et modifiez les détails.", "Détail du reçu", "Green Market", "Total", "Catégorie", "Produits", "Modifier le reçu"],
      reports: ["Comprenez où va l’argent", "Les rapports par catégorie et magasin rendent vos dépenses lisibles.", "Rapports", "Ce mois-ci", "Dépense totale", "Courses", "Carburant", "Transport", "Green Market", "City Fuel"],
      months: ["Parcourez vos reçus par mois", "Les reçus sont triés selon la date indiquée sur le reçu.", "Reçus mensuels", "Choisissez un mois pour voir tous les reçus.", "Juillet 2026", "Juin 2026", "Mai 2026", "Avril 2026"],
      products: ["Voyez ce que vous achetez le plus", "Les produits sont regroupés par mois, année ou tout l’historique.", "Résumé des produits", "Juillet 2026", "Eau", "Pain", "Tomates", "Poulet", "Yaourt", "Trié par quantité", "Identifiez les produits les plus achetés, pas seulement les plus chers."],
      settings: ["Gardez le contrôle", "Budgets, paiements mensuels, confidentialité et export sont simples.", "Réglages", "Vos données restent sur votre appareil.", "Argent et budget", "Analyse des reçus", "Mes données", "Confidentialité et légal", "Aide et retour", "Conçu pour la confidentialité", "Reciro stocke les reçus localement sauf si vous exportez une sauvegarde."],
    },
  },
};

locales["de-DE"] = deriveLocale(locales["en-US"], {
  name: "German",
  promo: "Scanne Belege, speichere Details und verfolge deine Ausgaben einfach.",
  keywords: "belegscanner,ausgaben,budget,geld,rechnung,beleg,finanzen,einkauf,scan,kosten",
  tabs: ["Start", "Berichte", "Monate", "Produkte", "Einstellungen"],
  home: ["Behalte Ausgaben klar im Blick", "Scanne Belege, verfolge Summen und organisiere jeden Einkauf.", "Start", "Dieser Monat", "Höchste Ausgabe: Lebensmittel", "Belege", "Top-Geschäft", "Beleg hinzufügen"],
  add: ["Beleg in Sekunden hinzufügen", "Kamera, Galerie oder PDF. Reciro startet die Analyse sofort.", "Beleg hinzufügen", "Quelle wählen und Details automatisch ausfüllen lassen.", "KI bereit", "Kein Beleg ausgewählt", "Foto aufnehmen oder Datei wählen.", "Kamera", "Galerie", "PDF", "Belegfoto hinzufügen"],
  review: ["KI-Ergebnisse vor dem Speichern prüfen", "Prüfe Geschäft, Summe, Kategorie und Produkte.", "Beleg prüfen", "Analysevertrauen: 94 %", "Geschäft", "Bearbeitbar", "Summe", "Vom Beleg gelesen", "Kategorie", "Automatisch erkannt", "Bestätigen und speichern"],
  detail: ["Alle Belege an einem Ort", "Öffne den Originalbeleg jederzeit und ändere Details.", "Belegdetails", "Green Market", "Summe", "Kategorie", "Produkte", "Beleg bearbeiten"],
  reports: ["Verstehe, wohin Geld geht", "Kategorie- und Geschäftsberichte machen Ausgaben lesbar.", "Berichte", "Dieser Monat", "Gesamtausgaben", "Lebensmittel", "Kraftstoff", "Transport", "Green Market", "City Fuel"],
  months: ["Belege nach Monaten durchsuchen", "Belege werden nach dem Datum auf dem Beleg sortiert.", "Monatliche Belege", "Wähle einen Monat und sieh alle Belege.", "Juli 2026", "Juni 2026", "Mai 2026", "April 2026"],
  products: ["Sieh, was du am häufigsten kaufst", "Produktübersichten nach Monat, Jahr oder gesamter Zeit.", "Produktübersicht", "Juli 2026", "Wasser", "Brot", "Tomaten", "Hähnchen", "Joghurt", "Nach Menge sortiert", "Erkenne häufig gekaufte Produkte, nicht nur die teuersten."],
  settings: ["Du hast die Kontrolle", "Budgets, monatliche Zahlungen, Datenschutz und Export.", "Einstellungen", "Deine Daten bleiben auf deinem Gerät.", "Geld & Budget", "Beleganalyse", "Meine Daten", "Datenschutz & Rechtliches", "Hilfe & Feedback", "Datenschutzorientiert", "Reciro speichert Belege lokal, außer du exportierst selbst ein Backup."],
});

locales["es-ES"] = deriveLocale(locales["en-US"], {
  name: "Spanish",
  promo: "Escanea recibos, guarda detalles y entiende tus gastos de forma sencilla.",
  keywords: "escaner recibos,gastos,presupuesto,dinero,factura,recibo,finanzas,compras,scan,ahorro",
  tabs: ["Inicio", "Informes", "Meses", "Productos", "Ajustes"],
  home: ["Ve tus gastos con claridad", "Escanea recibos, sigue totales y organiza cada compra.", "Inicio", "Este mes", "Mayor gasto: Supermercado", "Recibos", "Tienda principal", "Añadir recibo"],
  add: ["Añade un recibo en segundos", "Cámara, galería o PDF. Reciro inicia el análisis al instante.", "Añadir recibo", "Elige una fuente y deja que la IA complete los detalles.", "IA lista", "Sin recibo seleccionado", "Toma una foto o elige un archivo.", "Cámara", "Galería", "PDF", "Añadir foto"],
  review: ["Revisa la IA antes de guardar", "Comprueba tienda, total, categoría y productos.", "Revisar recibo", "Confianza: 94 %", "Tienda", "Editable", "Total", "Leído del recibo", "Categoría", "Detectada automáticamente", "Confirmar y guardar"],
  detail: ["Guarda cada recibo en un lugar", "Abre el recibo original cuando quieras y edita detalles.", "Detalle del recibo", "Green Market", "Total", "Categoría", "Productos", "Editar recibo"],
  reports: ["Entiende adónde va tu dinero", "Informes por categoría y tienda claros para cada mes.", "Informes", "Este mes", "Gasto total", "Supermercado", "Combustible", "Transporte", "Green Market", "City Fuel"],
  months: ["Consulta recibos por mes", "Los recibos se ordenan por la fecha impresa.", "Recibos mensuales", "Elige un mes para ver todos los recibos.", "Julio 2026", "Junio 2026", "Mayo 2026", "Abril 2026"],
  products: ["Ve qué compras más", "Resumen de productos por mes, año o todo el tiempo.", "Resumen de productos", "Julio 2026", "Agua", "Pan", "Tomates", "Pollo", "Yogur", "Ordenado por cantidad", "Conoce lo que compras más, no solo lo más caro."],
  settings: ["Tú tienes el control", "Presupuestos, pagos mensuales, privacidad y exportación.", "Ajustes", "Tus datos permanecen en tu dispositivo.", "Dinero y presupuesto", "Análisis de recibos", "Mis datos", "Privacidad y legal", "Ayuda y comentarios", "Privado por diseño", "Reciro guarda recibos localmente salvo que exportes una copia."],
});

locales["it-IT"] = deriveLocale(locales["en-US"], {
  name: "Italian",
  promo: "Scansiona scontrini, salva dettagli e controlla le spese con semplicità.",
  keywords: "scanner scontrini,spese,budget,denaro,fattura,scontrino,finanza,acquisti,scan,risparmio",
  tabs: ["Home", "Report", "Mesi", "Prodotti", "Impostazioni"],
  home: ["Vedi le spese con chiarezza", "Scansiona scontrini, segui i totali e organizza ogni acquisto.", "Home", "Questo mese", "Spesa principale: Alimentari", "Scontrini", "Negozio top", "Aggiungi scontrino"],
  add: ["Aggiungi uno scontrino in pochi secondi", "Fotocamera, galleria o PDF. Reciro avvia subito l’analisi.", "Aggiungi scontrino", "Scegli una fonte e lascia compilare i dettagli all’IA.", "IA pronta", "Nessuno scontrino selezionato", "Scatta una foto o scegli un file.", "Fotocamera", "Galleria", "PDF", "Aggiungi foto"],
  review: ["Controlla l’IA prima di salvare", "Verifica negozio, totale, categoria e prodotti.", "Verifica scontrino", "Affidabilità: 94 %", "Negozio", "Modificabile", "Totale", "Letto dallo scontrino", "Categoria", "Rilevata automaticamente", "Conferma e salva"],
  detail: ["Ogni scontrino in un solo posto", "Apri l’originale quando vuoi e modifica i dettagli.", "Dettaglio scontrino", "Green Market", "Totale", "Categoria", "Prodotti", "Modifica scontrino"],
  reports: ["Capisci dove vanno i soldi", "Report per categoria e negozio rendono le spese leggibili.", "Report", "Questo mese", "Spesa totale", "Alimentari", "Carburante", "Trasporti", "Green Market", "City Fuel"],
  months: ["Sfoglia gli scontrini per mese", "Gli scontrini sono ordinati per la data stampata.", "Scontrini mensili", "Scegli un mese e vedi tutti gli scontrini.", "Luglio 2026", "Giugno 2026", "Maggio 2026", "Aprile 2026"],
  products: ["Vedi cosa compri di più", "Riepiloghi prodotti per mese, anno o sempre.", "Riepilogo prodotti", "Luglio 2026", "Acqua", "Pane", "Pomodori", "Pollo", "Yogurt", "Ordinato per quantità", "Scopri cosa compri più spesso, non solo cosa costa di più."],
  settings: ["Tutto sotto controllo", "Budget, pagamenti mensili, privacy ed export.", "Impostazioni", "I tuoi dati restano sul dispositivo.", "Denaro e budget", "Analisi scontrini", "I miei dati", "Privacy e legale", "Aiuto e feedback", "Privacy prima di tutto", "Reciro salva gli scontrini in locale salvo esportazione manuale."],
});

locales["pt-PT"] = deriveLocale(locales["en-US"], {
  name: "Portuguese",
  promo: "Digitalize recibos, guarde detalhes e acompanhe despesas facilmente.",
  keywords: "scanner recibos,despesas,orcamento,dinheiro,fatura,recibo,financas,compras,scan,poupanca",
  tabs: ["Início", "Relatórios", "Meses", "Produtos", "Definições"],
  home: ["Veja as despesas com clareza", "Digitalize recibos, acompanhe totais e organize cada compra.", "Início", "Este mês", "Maior despesa: Mercearia", "Recibos", "Loja principal", "Adicionar recibo"],
  add: ["Adicione um recibo em segundos", "Câmara, galeria ou PDF. O Reciro inicia logo a análise.", "Adicionar recibo", "Escolha uma origem e deixe a IA preencher os detalhes.", "IA pronta", "Nenhum recibo selecionado", "Tire uma foto ou escolha um ficheiro.", "Câmara", "Galeria", "PDF", "Adicionar foto"],
  review: ["Reveja a IA antes de guardar", "Confirme loja, total, categoria e produtos.", "Rever recibo", "Confiança: 94 %", "Loja", "Editável", "Total", "Lido do recibo", "Categoria", "Detetada automaticamente", "Confirmar e guardar"],
  detail: ["Guarde todos os recibos num lugar", "Abra o recibo original quando quiser e edite detalhes.", "Detalhe do recibo", "Green Market", "Total", "Categoria", "Produtos", "Editar recibo"],
  reports: ["Entenda para onde vai o dinheiro", "Relatórios por categoria e loja tornam as despesas claras.", "Relatórios", "Este mês", "Despesa total", "Mercearia", "Combustível", "Transporte", "Green Market", "City Fuel"],
  months: ["Veja recibos por mês", "Os recibos são ordenados pela data impressa.", "Recibos mensais", "Escolha um mês para ver todos os recibos.", "Julho 2026", "Junho 2026", "Maio 2026", "Abril 2026"],
  products: ["Veja o que compra mais", "Resumo de produtos por mês, ano ou todo o período.", "Resumo de produtos", "Julho 2026", "Água", "Pão", "Tomate", "Frango", "Iogurte", "Ordenado por quantidade", "Saiba o que compra mais, não apenas o mais caro."],
  settings: ["Mantenha o controlo", "Orçamentos, pagamentos mensais, privacidade e exportação.", "Definições", "Os seus dados ficam no dispositivo.", "Dinheiro e orçamento", "Análise de recibos", "Os meus dados", "Privacidade e legal", "Ajuda e feedback", "Privado por desenho", "O Reciro guarda recibos localmente salvo exportação escolhida por si."],
});

locales["nl-NL"] = deriveLocale(locales["en-US"], {
  name: "Dutch",
  promo: "Scan bonnetjes, bewaar details en volg je uitgaven eenvoudig.",
  keywords: "bon scanner,uitgaven,budget,geld,factuur,bon,financien,winkelen,scan,kosten",
  tabs: ["Start", "Rapporten", "Maanden", "Producten", "Instellingen"],
  home: ["Zie je uitgaven helder", "Scan bonnetjes, volg totalen en organiseer elke aankoop.", "Start", "Deze maand", "Hoogste uitgave: Boodschappen", "Bonnen", "Topwinkel", "Bon toevoegen"],
  add: ["Voeg een bon toe in seconden", "Camera, galerij of PDF. Reciro start meteen de analyse.", "Bon toevoegen", "Kies een bron en laat AI de details invullen.", "AI klaar", "Geen bon geselecteerd", "Maak een foto of kies een bestand.", "Camera", "Galerij", "PDF", "Bonfoto toevoegen"],
  review: ["Controleer AI voor opslaan", "Bekijk winkel, totaal, categorie en producten.", "Bon controleren", "Analysezekerheid: 94 %", "Winkel", "Bewerkbaar", "Totaal", "Gelezen van bon", "Categorie", "Automatisch herkend", "Bevestigen en opslaan"],
  detail: ["Alle bonnen op één plek", "Open de originele bon altijd en pas details aan.", "Bondetail", "Green Market", "Totaal", "Categorie", "Producten", "Bon bewerken"],
  reports: ["Begrijp waar geld naartoe gaat", "Categorie- en winkelrapporten maken uitgaven duidelijk.", "Rapporten", "Deze maand", "Totale uitgaven", "Boodschappen", "Brandstof", "Vervoer", "Green Market", "City Fuel"],
  months: ["Bekijk bonnen per maand", "Bonnen worden gesorteerd op de datum op de bon.", "Maandelijkse bonnen", "Kies een maand en bekijk alle bonnen.", "Juli 2026", "Juni 2026", "Mei 2026", "April 2026"],
  products: ["Zie wat je het meest koopt", "Productoverzichten per maand, jaar of altijd.", "Productoverzicht", "Juli 2026", "Water", "Brood", "Tomaten", "Kip", "Yoghurt", "Gesorteerd op aantal", "Weet wat je vaak koopt, niet alleen wat duur is."],
  settings: ["Houd controle", "Budgetten, maandbetalingen, privacy en export.", "Instellingen", "Je gegevens blijven op je apparaat.", "Geld en budget", "Bonanalyse", "Mijn gegevens", "Privacy en juridisch", "Hulp en feedback", "Privacygericht", "Reciro bewaart bonnen lokaal tenzij je zelf een back-up exporteert."],
});

function deriveLocale(base, data) {
  return {
    ...base,
    name: data.name,
    promo: data.promo,
    desc: base.desc,
    features: base.features,
    keywords: data.keywords,
    terms: data.terms,
    tabs: data.tabs,
    screens: {
      home: data.home,
      add: data.add,
      review: data.review,
      detail: data.detail,
      reports: data.reports,
      months: data.months,
      products: data.products,
      settings: data.settings,
    },
  };
}

Object.assign(locales["de-DE"], {
  desc: [
    "Reciro hilft dir, Belege zu organisieren und zu verstehen, wohin dein Geld geht.",
    "Mach ein Foto, wähle ein Bild oder speichere einen PDF-Beleg. Reciro erkennt wichtige Details wie Geschäft, Datum, Summe, Kategorie und Produkte, damit du alles vor dem Speichern prüfen kannst.",
    "Verfolge monatliche Ausgaben, durchsuche Belege nach Monaten, sieh Kategorieberichte und erkenne, welche Produkte du am häufigsten kaufst. Deine Daten bleiben auf deinem Gerät, außer du exportierst sie selbst.",
    "Reciro ist einfach, privat und leicht zu bedienen.",
  ],
  features: [
    "Belegfotos mit KI-Unterstützung analysieren",
    "Belegbilder und PDF-Rechnungen speichern",
    "Details vor dem Speichern prüfen und bearbeiten",
    "Monatliche Ausgaben und Belegverlauf verfolgen",
    "Übersichten nach Kategorie, Geschäft und Produkt",
    "Monatliche Zahlungen und Budgets hinzufügen",
    "Daten bei Bedarf für Backups exportieren",
  ],
  terms: { groceries: "Lebensmittel", fuel: "Kraftstoff", transport: "Transport", today: "heute", yesterday: "gestern", receipts: "Belege", receipt: "Beleg" },
});

Object.assign(locales["es-ES"], {
  desc: [
    "Reciro te ayuda a organizar recibos y entender adónde va tu dinero.",
    "Haz una foto, elige una imagen o guarda un recibo PDF. Reciro extrae detalles útiles como tienda, fecha, total, categoría y productos para que puedas revisarlo todo antes de guardar.",
    "Sigue tus gastos mensuales, consulta recibos por mes, revisa informes por categoría y descubre qué productos compras más. Tus datos permanecen en tu dispositivo salvo que decidas exportarlos.",
    "Reciro está diseñado para ser simple, privado y fácil de usar.",
  ],
  features: [
    "Análisis de fotos de recibos con ayuda de IA",
    "Guardar imágenes de recibos y facturas PDF",
    "Revisar y editar detalles antes de guardar",
    "Seguimiento mensual de gastos e historial",
    "Resúmenes por categoría, tienda y producto",
    "Pagos mensuales y presupuestos",
    "Exportar datos para crear copias de seguridad",
  ],
  terms: { groceries: "Supermercado", fuel: "Combustible", transport: "Transporte", today: "hoy", yesterday: "ayer", receipts: "recibos", receipt: "recibo" },
});

Object.assign(locales["it-IT"], {
  desc: [
    "Reciro ti aiuta a organizzare gli scontrini e a capire dove vanno i tuoi soldi.",
    "Scatta una foto, scegli un’immagine o salva uno scontrino PDF. Reciro estrae dettagli utili come negozio, data, totale, categoria e prodotti, così puoi controllare tutto prima di salvare.",
    "Monitora le spese mensili, sfoglia gli scontrini per mese, consulta report per categoria e scopri quali prodotti acquisti più spesso. I dati restano sul tuo dispositivo salvo esportazione manuale.",
    "Reciro è semplice, privato e facile da usare.",
  ],
  features: [
    "Analisi di scontrini con assistenza IA",
    "Salvataggio di foto e fatture PDF",
    "Controllo e modifica prima del salvataggio",
    "Monitoraggio mensile delle spese",
    "Riepiloghi per categoria, negozio e prodotto",
    "Pagamenti mensili e budget",
    "Esportazione dati per backup personali",
  ],
  terms: { groceries: "Alimentari", fuel: "Carburante", transport: "Trasporti", today: "oggi", yesterday: "ieri", receipts: "scontrini", receipt: "scontrino" },
});

Object.assign(locales["pt-PT"], {
  desc: [
    "O Reciro ajuda a organizar recibos e a perceber para onde vai o seu dinheiro.",
    "Tire uma foto, escolha uma imagem ou guarde um recibo PDF. O Reciro extrai detalhes úteis como loja, data, total, categoria e produtos para que possa rever tudo antes de guardar.",
    "Acompanhe despesas mensais, veja recibos por mês, consulte relatórios por categoria e descubra que produtos compra mais. Os seus dados ficam no dispositivo salvo se decidir exportá-los.",
    "O Reciro foi criado para ser simples, privado e fácil de usar.",
  ],
  features: [
    "Análise de recibos com assistência de IA",
    "Guardar fotos de recibos e faturas PDF",
    "Rever e editar detalhes antes de guardar",
    "Acompanhar despesas mensais e histórico",
    "Resumos por categoria, loja e produto",
    "Pagamentos mensais e orçamentos",
    "Exportar dados para cópias de segurança",
  ],
  terms: { groceries: "Mercearia", fuel: "Combustível", transport: "Transporte", today: "hoje", yesterday: "ontem", receipts: "recibos", receipt: "recibo" },
});

Object.assign(locales["nl-NL"], {
  desc: [
    "Reciro helpt je bonnetjes te organiseren en te begrijpen waar je geld naartoe gaat.",
    "Maak een foto, kies een afbeelding of bewaar een PDF-bon. Reciro haalt nuttige details op zoals winkel, datum, totaal, categorie en producten, zodat je alles kunt controleren voordat je opslaat.",
    "Volg maandelijkse uitgaven, bekijk bonnen per maand, zie categorierapporten en ontdek welke producten je het meest koopt. Je gegevens blijven op je apparaat tenzij je zelf exporteert.",
    "Reciro is eenvoudig, privé en makkelijk te gebruiken.",
  ],
  features: [
    "Bonfoto’s analyseren met AI-ondersteuning",
    "Bonafbeeldingen en PDF-facturen bewaren",
    "Details controleren en bewerken voor opslaan",
    "Maandelijkse uitgaven en geschiedenis volgen",
    "Overzichten per categorie, winkel en product",
    "Maandbetalingen en budgetten toevoegen",
    "Gegevens exporteren voor eigen back-ups",
  ],
  terms: { groceries: "Boodschappen", fuel: "Brandstof", transport: "Vervoer", today: "vandaag", yesterday: "gisteren", receipts: "bonnen", receipt: "bon" },
});

function esc(value) {
  return String(value).replace(/[&<>"]/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
  }[char]));
}

function tab(label, active) {
  return `<div class="tab ${active ? "active" : ""}"><b>${esc(label)}</b></div>`;
}

function shell(locale, active, title, subtitle, body) {
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=1242,height=2688,initial-scale=1"><style>
*{box-sizing:border-box}body{width:1242px;height:2688px;margin:0;overflow:hidden;background:${bg};color:${dark};font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Arial,sans-serif}.poster{width:100%;height:100%;padding:94px 70px 86px;display:flex;flex-direction:column;gap:38px}.hero{text-align:center;padding:14px 24px 4px}.brand{display:flex;align-items:center;justify-content:center;gap:18px;margin-bottom:26px}.mark{width:74px;height:74px;border-radius:24px;background:${green};color:white;display:grid;place-items:center;font-weight:900;font-size:34px;box-shadow:0 18px 38px rgba(22,138,67,.25)}.brand-name{font-size:42px;font-weight:900}h1{margin:0;font-size:82px;line-height:1;letter-spacing:0}.subtitle{margin:28px auto 0;max-width:850px;color:${muted};font-size:33px;line-height:1.25;font-weight:650}.phone{width:100%;flex:1;background:#fbfdfb;border:1px solid ${border};border-radius:44px;padding:46px 46px 120px;position:relative;box-shadow:0 34px 90px rgba(16,32,24,.12);overflow:hidden}.phone-title{text-align:center;margin-bottom:34px}.phone-title h2{margin:0;font-size:52px;line-height:1.05;font-weight:900}.phone-title p{margin:8px 0 0;color:${muted};font-size:25px;font-weight:650}.grid{display:grid;gap:22px}.two{grid-template-columns:1fr 1fr}.card{background:white;border:1px solid ${border};border-radius:22px;padding:30px;box-shadow:0 8px 26px rgba(16,32,24,.04)}.soft{background:${pale};border-color:#cbeed9}.label{color:${green};text-transform:uppercase;font-weight:900;font-size:22px;letter-spacing:.04em}.big{margin-top:14px;font-size:72px;line-height:1;font-weight:900}.money{color:${green};font-weight:900}.row{display:flex;align-items:center;justify-content:space-between;gap:18px;padding:24px 0;border-bottom:1px solid #edf1ed}.row:last-child{border-bottom:0}.row h3{margin:0 0 7px;font-size:29px;line-height:1.12}.row p{margin:0;color:${muted};font-size:23px;font-weight:650}.amount{font-size:32px;font-weight:900;white-space:nowrap}.button{background:${green};color:white;border-radius:19px;padding:26px 30px;text-align:center;font-size:30px;font-weight:900}.outline{background:white;color:${green};border:2px solid ${green}}.bottom-tabs{position:absolute;left:28px;right:28px;bottom:24px;height:92px;background:white;border:1px solid ${border};border-radius:24px;display:grid;grid-template-columns:repeat(5,1fr);padding:10px;gap:8px;box-shadow:0 22px 60px rgba(16,32,24,.14)}.tab{border-radius:17px;display:grid;place-items:center;text-align:center;color:${muted};font-size:18px;font-weight:850;line-height:1}.tab.active{background:${green};color:white}.receipt{height:620px;border-radius:22px;background:linear-gradient(180deg,#fff,#f5f1e8);border:1px solid #e4ded0;padding:45px 58px;color:#29352e;font-family:"Courier New",monospace;box-shadow:inset 0 -18px 50px rgba(0,0,0,.05)}.receipt h3{text-align:center;font-size:31px;margin:0 0 22px}.receipt .line{display:flex;justify-content:space-between;font-size:24px;border-bottom:1px dashed #9fa89f;padding:13px 0}.bar{height:18px;border-radius:99px;background:#e8eee9;overflow:hidden}.fill{height:100%;border-radius:99px;background:${green}}.pill{display:inline-flex;align-items:center;justify-content:center;border-radius:999px;padding:12px 20px;background:${pale};color:${green};font-size:22px;font-weight:900}
</style></head><body><div class="poster"><section class="hero"><div class="brand"><div class="mark">R</div><div class="brand-name">Reciro</div></div><h1>${esc(title)}</h1><p class="subtitle">${esc(subtitle)}</p></section><section class="phone">${body}<nav class="bottom-tabs">${locale.tabs.map((t,i)=>tab(t,i===active)).join("")}</nav></section></div></body></html>`;
}

function row(title, sub, amount) {
  return `<div class="row"><div><h3>${esc(title)}</h3><p>${esc(sub)}</p></div><div class="amount">${esc(amount)}</div></div>`;
}

function receiptBlock(height = 620) {
  return `<div class="receipt" style="height:${height}px"><h3>GREEN MARKET</h3><div class="line"><span>Water x6</span><span>3.60</span></div><div class="line"><span>Bread x2</span><span>2.40</span></div><div class="line"><span>Chicken 1kg</span><span>9.80</span></div><div class="line"><span>Tomatoes</span><span>4.50</span></div><div class="line"><b>TOTAL</b><b>42.80 EUR</b></div></div>`;
}

function screensFor(locale) {
  const s = locale.screens;
  const t = locale.terms;
  return [
    ["01-home.png", 0, s.home[0], s.home[1], `<div class="phone-title"><h2>${esc(s.home[2])}</h2><p>Scan. Save. Simplify.</p></div><div class="grid"><div class="card soft" style="text-align:center"><div class="label">${esc(s.home[3])}</div><div class="big">€246.80</div><p style="font-size:25px;color:${muted};font-weight:700">${esc(s.home[4])}</p></div><div class="grid two"><div class="card"><div class="label">${esc(s.home[5])}</div><div class="big" style="font-size:50px">12</div></div><div class="card"><div class="label">${esc(s.home[6])}</div><div class="big" style="font-size:43px">Green Market</div></div></div><div class="card">${row("Green Market",`${t.groceries} - ${t.today}`,"€42.80")}${row("City Fuel",`${t.fuel} - ${t.yesterday}`,"€58.20")}${row("Metro",`${t.transport} - 13.07.2026`,"€12.40")}</div><div class="button">${esc(s.home[7])}</div></div>`],
    ["02-add-receipt.png", 0, s.add[0], s.add[1], `<div class="phone-title"><h2>${esc(s.add[2])}</h2><p>${esc(s.add[3])}</p></div><div class="grid"><div class="card soft" style="text-align:center;padding:64px 40px"><div class="pill">${esc(s.add[4])}</div><h3 style="font-size:44px;margin:28px 0 12px">${esc(s.add[5])}</h3><p style="font-size:27px;color:${muted};font-weight:700">${esc(s.add[6])}</p></div><div class="grid two"><div class="card"><h3 style="font-size:34px;margin:0">${esc(s.add[7])}</h3><p style="font-size:24px;color:${muted}">Receipt photo</p></div><div class="card"><h3 style="font-size:34px;margin:0">${esc(s.add[8])}</h3><p style="font-size:24px;color:${muted}">Saved image</p></div></div><div class="card"><h3 style="font-size:34px;margin:0">${esc(s.add[9])}</h3><p style="font-size:24px;color:${muted}">Invoices and documents</p></div><div class="button">${esc(s.add[10])}</div></div>`],
    ["03-ai-review.png", 0, s.review[0], s.review[1], `<div class="phone-title"><h2>${esc(s.review[2])}</h2><p>${esc(s.review[3])}</p></div><div class="grid">${receiptBlock()}<div class="card">${row(s.review[4],s.review[5],"Green Market")}${row(s.review[6],s.review[7],"€42.80")}${row(s.review[8],s.review[9],"Groceries")}</div><div class="button">${esc(s.review[10])}</div></div>`],
    ["04-detail.png", 1, s.detail[0], s.detail[1], `<div class="phone-title"><h2>13.07.2026</h2><p>${esc(s.detail[3])}</p></div><div class="grid">${receiptBlock(700)}<div class="card">${row(s.detail[4],"","€42.80")}${row(s.detail[5],"","Groceries")}${row(s.detail[6],"","5")}</div><div class="button outline">${esc(s.detail[7])}</div></div>`],
    ["05-reports.png", 1, s.reports[0], s.reports[1], `<div class="phone-title"><h2>${esc(s.reports[2])}</h2><p>${esc(s.reports[3])}</p></div><div class="grid"><div class="card soft" style="text-align:center"><div class="label">${esc(s.reports[4])}</div><div class="big">€246.80</div></div><div class="card">${row(s.reports[5],"47%","€116.40")}<div class="bar"><div class="fill" style="width:72%"></div></div>${row(s.reports[6],"23%","€58.20")}<div class="bar"><div class="fill" style="width:38%"></div></div>${row(s.reports[7],"11%","€27.10")}<div class="bar"><div class="fill" style="width:22%"></div></div></div><div class="card">${row(s.reports[8],`4 ${t.receipts}`,"€116.40")}${row(s.reports[9],`1 ${t.receipt}`,"€58.20")}</div></div>`],
    ["06-months.png", 2, s.months[0], s.months[1], `<div class="phone-title"><h2>${esc(s.months[2])}</h2><p>${esc(s.months[3])}</p></div><div class="grid"><div class="card soft">${row(s.months[4],`12 ${t.receipts}`,"€246.80")}</div><div class="card">${row(s.months[5],`9 ${t.receipts}`,"€188.20")}${row(s.months[6],`14 ${t.receipts}`,"€312.45")}${row(s.months[7],`8 ${t.receipts}`,"€174.90")}</div><div class="card">${row("13.07.2026 - Green Market",t.groceries,"€42.80")}${row("12.07.2026 - City Fuel",t.fuel,"€58.20")}</div></div>`],
    ["07-products.png", 3, s.products[0], s.products[1], `<div class="phone-title"><h2>${esc(s.products[2])}</h2><p>${esc(s.products[3])}</p></div><div class="grid"><div class="card">${row(s.products[4],"18 pcs - 3 receipts","€10.80")}${row(s.products[5],"8 pcs - 4 receipts","€9.60")}${row(s.products[6],"4.5 kg - 2 receipts","€13.50")}${row(s.products[7],"2 kg - 2 receipts","€19.60")}${row(s.products[8],"6 pcs - 3 receipts","€9.60")}</div><div class="card soft"><h3 style="font-size:38px;margin:0 0 10px">${esc(s.products[9])}</h3><p style="font-size:27px;color:${muted};font-weight:700">${esc(s.products[10])}</p></div></div>`],
    ["08-settings.png", 4, s.settings[0], s.settings[1], `<div class="phone-title"><h2>${esc(s.settings[2])}</h2><p>${esc(s.settings[3])}</p></div><div class="grid"><div class="card">${row(s.settings[4],"Income, budgets, monthly payments","›")}${row(s.settings[5],"Default category, scan preferences","›")}${row(s.settings[6],"Export, import, clear data","›")}${row(s.settings[7],"Privacy policy and terms","›")}${row(s.settings[8],"Send feedback directly","›")}</div><div class="card soft"><h3 style="font-size:38px;margin:0 0 10px">${esc(s.settings[9])}</h3><p style="font-size:27px;color:${muted};font-weight:700">${esc(s.settings[10])}</p></div></div>`],
  ];
}

function writeListing(localeCode, locale) {
  const labels = {
    "en-US": ["Promotional Text", "Description", "Key features", "Keywords", "Support URL", "Privacy Policy URL", "Terms URL", "Copyright"],
    "tr-TR": ["Tanıtım Metni", "Açıklama", "Öne çıkan özellikler", "Anahtar Kelimeler", "Destek URL", "Gizlilik Politikası URL", "Kullanım Şartları URL", "Telif"],
    "fr-FR": ["Texte promotionnel", "Description", "Fonctionnalités clés", "Mots-clés", "URL d’assistance", "URL de confidentialité", "URL des conditions", "Copyright"],
    "de-DE": ["Werbetext", "Beschreibung", "Wichtige Funktionen", "Schlüsselwörter", "Support-URL", "Datenschutz-URL", "Nutzungsbedingungen-URL", "Copyright"],
    "es-ES": ["Texto promocional", "Descripción", "Funciones principales", "Palabras clave", "URL de soporte", "URL de privacidad", "URL de términos", "Copyright"],
    "it-IT": ["Testo promozionale", "Descrizione", "Funzioni principali", "Parole chiave", "URL supporto", "URL privacy", "URL termini", "Copyright"],
    "pt-PT": ["Texto promocional", "Descrição", "Funcionalidades principais", "Palavras-chave", "URL de suporte", "URL de privacidade", "URL dos termos", "Copyright"],
    "nl-NL": ["Promotietekst", "Beschrijving", "Belangrijkste functies", "Trefwoorden", "Support-URL", "Privacybeleid-URL", "Voorwaarden-URL", "Copyright"],
  }[localeCode] || ["Promotional Text", "Description", "Key features", "Keywords", "Support URL", "Privacy Policy URL", "Terms URL", "Copyright"];
  const file = path.join(outRoot, "listings", `${localeCode}.md`);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `# Reciro App Store Listing - ${locale.name}

## ${labels[0]}

${locale.promo}

## ${labels[1]}

${locale.desc.join("\n\n")}

${labels[2]}:

${locale.features.map((feature) => `- ${feature}`).join("\n")}

## ${labels[3]}

${locale.keywords}

## ${labels[4]}

https://reciro-receipt-analysis.onrender.com/support

## ${labels[5]}

https://reciro-receipt-analysis.onrender.com/privacy

## ${labels[6]}

https://reciro-receipt-analysis.onrender.com/terms

## ${labels[7]}

2026 Deniz Canpolat
`, "utf8");
}

fs.mkdirSync(htmlDir, { recursive: true });
fs.copyFileSync(path.join(root, "assets", "icon.png"), path.join(outRoot, "icon-1024.png"));

for (const [localeCode, locale] of Object.entries(locales)) {
  writeListing(localeCode, locale);
  const screenshotDir = path.join(outRoot, "screenshots", "ios", localeCode);
  fs.mkdirSync(screenshotDir, { recursive: true });
  for (const [fileName, active, title, subtitle, body] of screensFor(locale)) {
    const html = shell(locale, active, title, subtitle, body);
    const htmlPath = path.join(htmlDir, `${localeCode}-${fileName.replace(".png", ".html")}`);
    const pngPath = path.join(screenshotDir, fileName);
    fs.writeFileSync(htmlPath, html, "utf8");
    execFileSync(chromePath, [
      "--headless=new",
      "--disable-gpu",
      "--hide-scrollbars",
      "--force-device-scale-factor=1",
      "--window-size=1242,2688",
      `--screenshot=${pngPath}`,
      `file:///${htmlPath.replace(/\\/g, "/")}`,
    ], { stdio: "ignore" });
  }
}

const readme = `# Reciro Localized App Store Package

Generated localized store materials for:

${Object.entries(locales).map(([code, locale]) => `- ${code}: ${locale.name}`).join("\n")}

## Icon

- icon-1024.png

## Screenshots

Each locale has 8 iPhone 6.5-inch screenshots at 1242 x 2688:

- screenshots/ios/<locale-code>/

## Listing Text

Each locale has a ready-to-copy App Store text file:

- listings/<locale-code>.md

Generated with:

\`\`\`
node store-assets/app-store/generate-localized-store-assets.js
\`\`\`
`;

fs.writeFileSync(path.join(outRoot, "LOCALIZED_README.md"), readme, "utf8");
console.log(`Generated ${Object.keys(locales).length} localized App Store packages.`);
