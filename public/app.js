let products = [
  {
    id: "rn-bag-01",
    name: "Northline Structured Carry Bag",
    category: "bags",
    price: 168,
    tone: "tone-sand",
    badge: "Carry",
    description: "A structured day bag with a compact profile, reinforced base, and easy-access interior pockets for everyday travel.",
    colors: ["Graphite", "Ivory", "Forest"],
    sizes: ["Small", "Medium"]
  },
  {
    id: "rn-watch-01",
    name: "Aster Field Chrono Watch",
    category: "watches",
    price: 245,
    tone: "tone-silver",
    badge: "Time",
    image: "images/annekali/watches/rolex-1051164-rolex-datejust-m126334-0022.webp",
    description: "A clean chronograph-inspired watch with a brushed case, legible dial, and low-profile strap for daily wear.",
    colors: ["Steel", "Black", "Sand"],
    sizes: ["40mm", "42mm"]
  },
  {
    id: "rn-shoe-01",
    name: "Vale Low Profile Sneaker",
    category: "shoes",
    price: 132,
    tone: "tone-graphite",
    badge: "Step",
    image: "images/annekali/products/1049550-low-top-sneakers.webp",
    description: "A minimal sneaker with a cushioned footbed, stable rubber outsole, and neutral upper for easy styling.",
    colors: ["Black", "Stone", "White"],
    sizes: ["7", "8", "9", "10", "11"]
  },
  {
    id: "rn-bag-02",
    name: "Harbor Zip Weekend Tote",
    category: "bags",
    price: 196,
    tone: "tone-plum",
    badge: "Travel",
    description: "A weekend-ready tote with a wide zip opening, structured handles, and a padded sleeve for short trips.",
    colors: ["Plum", "Charcoal", "Taupe"],
    sizes: ["Medium", "Large"]
  },
  {
    id: "rn-watch-02",
    name: "Civic Date Minimal Watch",
    category: "watches",
    price: 218,
    tone: "tone-graphite",
    badge: "Time",
    image: "images/annekali/watches/cartier-1051022-ballon-bleu-de-cartier-watch-40-mm-automatic.webp",
    description: "A pared-back date watch with a slim case, subtle markers, and a refined leather-style strap.",
    colors: ["Black", "Cognac", "Navy"],
    sizes: ["38mm", "40mm"]
  },
  {
    id: "rn-shoe-02",
    name: "Metro Knit Runner",
    category: "shoes",
    price: 148,
    tone: "tone-silver",
    badge: "Step",
    image: "images/annekali/products/1049175-b22.webp",
    description: "A breathable runner silhouette with a flexible knit upper and a lightweight sole for long city days.",
    colors: ["Slate", "Cloud", "Olive"],
    sizes: ["7", "8", "9", "10", "11"]
  },
  {
    id: "rn-bag-03",
    name: "Arc Mini Crossbody",
    category: "bags",
    price: 124,
    tone: "tone-graphite",
    badge: "Carry",
    description: "A compact crossbody built for essentials, with an adjustable strap and softly structured body.",
    colors: ["Black", "Cream", "Wine"],
    sizes: ["Mini"]
  },
  {
    id: "rn-watch-03",
    name: "Monarch Dress Watch",
    category: "watches",
    price: 286,
    tone: "tone-sand",
    badge: "Time",
    image: "images/annekali/watches/patek-1051397-5711-1r-001-patek-philippe-nautilus.webp",
    description: "A dress-focused watch with warm metal accents, clean markers, and a polished finish.",
    colors: ["Gold", "Steel", "Espresso"],
    sizes: ["39mm", "41mm"]
  },
  {
    id: "rn-shoe-03",
    name: "Axis Leather Court Shoe",
    category: "shoes",
    price: 156,
    tone: "tone-plum",
    badge: "Step",
    image: "images/annekali/products/1049407-out-of-office.webp",
    description: "A smooth court-inspired shoe with stitched panels, padded collar, and a balanced everyday shape.",
    colors: ["White", "Black", "Oxblood"],
    sizes: ["7", "8", "9", "10", "11"]
  },
  {
    id: "rn-bag-04",
    name: "Summit Foldover Pack",
    category: "bags",
    price: 174,
    tone: "tone-silver",
    badge: "Travel",
    description: "A foldover pack with a clean front profile, interior organization, and comfortable shoulder straps.",
    colors: ["Ash", "Black", "Moss"],
    sizes: ["One Size"]
  }
];

const cart = new Map();
let activeFilter = "all";
let activeBrandFilter = "";
let toastTimer;

const relatedGrid = document.querySelector("#relatedGrid");
const featuredGrid = document.querySelector("#featuredGrid");
const cartDrawer = document.querySelector("#cartDrawer");
const productModal = document.querySelector("#productModal");
const modalBody = document.querySelector("#modalBody");
const overlay = document.querySelector("#overlay");
const navDrawer = document.querySelector("#navDrawer");
const cartItems = document.querySelector("#cartItems");
const cartCount = document.querySelector("#cartCount");
const cartTotal = document.querySelector("#cartTotal");
const searchInput = document.querySelector("#searchInput");
const menuButton = document.querySelector(".menu-button");
const closeNavButton = document.querySelector("#closeNav");
const languageSelect = document.querySelector(".language-select");
let activeLanguage = localStorage.getItem("rovenox-language") || languageSelect.value || "en";

const supplementalTranslations = {
  en: {
    "contact.bannerCopy": "Welcome to RoveNox website! If you have a style you like, please contact me on WhatsApp.",
    "contact.now": "Contact now",
    "section.bags": "Bag Zone",
    "section.watches": "Watch Zone",
    "reviews.title": "CUSTOMER REVIEWS",
    "service.freeTitle": "Free Shipping",
    "service.freeCopy": "Journal is the best rated theme from more than 2000 reviews",
    "service.qualityTitle": "Quality Warranty",
    "service.qualityCopy": "Covering any possible defect in materials and workmanship",
    "service.returnsTitle": "Returns & Exchanges",
    "service.returnsCopy": "Any return for unsatisfied item(s) is available within 30 days",
    "service.moneyTitle": "Money Back Guarantee",
    "service.moneyCopy": "A full refund will be given within 1 week after receiving your return",
    "footer.infoTitle": "INFORMATIONS",
    "footer.aboutUs": "About Us",
    "footer.contactUs": "Contact Us",
    "footer.privacy": "Privacy Policy",
    "footer.returnPolicy": "Return Policy",
    "footer.shippingPolicy": "Shipping Policy",
    "footer.terms": "Terms & Conditions",
    "footer.careTitle": "CUSTOMER CARE",
    "footer.orders": "My Orders",
    "footer.account": "My Account",
    "footer.favorites": "My Favorites",
    "footer.allProducts": "All Products",
    "footer.cart": "Shopping Cart",
    "footer.tracking": "Order Tracking",
    "footer.newsletterTitle": "WANNA STAY TUNED?",
    "footer.newsletterCopy": "Sign up with your email address to receive LATEST news & enjoy members-only perks, deals, tips, and more!",
    "footer.email": "Email",
    "footer.send": "Send",
    "footer.copyright": "Copyright © 2026, RoveNox All Rights Reserved"
  },
  de: {
    "contact.bannerCopy": "Willkommen auf der RoveNox-Website! Wenn dir ein Stil gefallt, kontaktiere mich bitte per WhatsApp.",
    "contact.now": "Jetzt kontaktieren",
    "section.bags": "Taschenbereich",
    "section.watches": "Uhrenbereich",
    "reviews.title": "KUNDENBEWERTUNGEN",
    "service.freeTitle": "Kostenloser Versand",
    "service.freeCopy": "Journal ist das am besten bewertete Theme mit mehr als 2000 Bewertungen",
    "service.qualityTitle": "Qualitatsgarantie",
    "service.qualityCopy": "Deckt mogliche Material- und Verarbeitungsfehler ab",
    "service.returnsTitle": "Ruckgaben & Umtausch",
    "service.returnsCopy": "Ruckgaben unzufriedener Artikel sind innerhalb von 30 Tagen moglich",
    "service.moneyTitle": "Geld-zuruck-Garantie",
    "service.moneyCopy": "Eine vollstandige Erstattung erfolgt innerhalb von 1 Woche nach Erhalt deiner Rucksendung",
    "footer.infoTitle": "INFORMATIONEN",
    "footer.aboutUs": "Uber uns",
    "footer.contactUs": "Kontakt",
    "footer.privacy": "Datenschutz",
    "footer.returnPolicy": "Ruckgaberichtlinie",
    "footer.shippingPolicy": "Versandrichtlinie",
    "footer.terms": "AGB",
    "footer.careTitle": "KUNDENSERVICE",
    "footer.orders": "Meine Bestellungen",
    "footer.account": "Mein Konto",
    "footer.favorites": "Meine Favoriten",
    "footer.allProducts": "Alle Produkte",
    "footer.cart": "Warenkorb",
    "footer.tracking": "Sendungsverfolgung",
    "footer.newsletterTitle": "AUF DEM LAUFENDEN BLEIBEN?",
    "footer.newsletterCopy": "Melde dich mit deiner E-Mail-Adresse an, um neueste Nachrichten, Mitgliedervorteile, Angebote, Tipps und mehr zu erhalten!",
    "footer.email": "E-Mail",
    "footer.send": "Senden",
    "footer.copyright": "Copyright © 2026, RoveNox Alle Rechte vorbehalten"
  },
  ru: {
    "contact.bannerCopy": "Добро пожаловать на сайт RoveNox! Если вам нравится какой-либо стиль, свяжитесь со мной в WhatsApp.",
    "contact.now": "Связаться",
    "section.bags": "Раздел сумок",
    "section.watches": "Раздел часов",
    "reviews.title": "ОТЗЫВЫ КЛИЕНТОВ",
    "service.freeTitle": "Бесплатная доставка",
    "service.freeCopy": "Journal - самая высокооцененная тема с более чем 2000 отзывами",
    "service.qualityTitle": "Гарантия качества",
    "service.qualityCopy": "Покрывает возможные дефекты материалов и изготовления",
    "service.returnsTitle": "Возврат и обмен",
    "service.returnsCopy": "Возврат неподошедших товаров возможен в течение 30 дней",
    "service.moneyTitle": "Гарантия возврата денег",
    "service.moneyCopy": "Полный возврат будет выполнен в течение 1 недели после получения возврата",
    "footer.infoTitle": "ИНФОРМАЦИЯ",
    "footer.aboutUs": "О нас",
    "footer.contactUs": "Контакты",
    "footer.privacy": "Политика конфиденциальности",
    "footer.returnPolicy": "Политика возврата",
    "footer.shippingPolicy": "Политика доставки",
    "footer.terms": "Условия",
    "footer.careTitle": "ПОДДЕРЖКА",
    "footer.orders": "Мои заказы",
    "footer.account": "Мой аккаунт",
    "footer.favorites": "Мое избранное",
    "footer.allProducts": "Все товары",
    "footer.cart": "Корзина",
    "footer.tracking": "Отслеживание заказа",
    "footer.newsletterTitle": "ХОТИТЕ ОСТАВАТЬСЯ В КУРСЕ?",
    "footer.newsletterCopy": "Укажите email, чтобы получать новости, бонусы для участников, предложения, советы и многое другое!",
    "footer.email": "Email",
    "footer.send": "Отправить",
    "footer.copyright": "Copyright © 2026, RoveNox Все права защищены"
  },
  ko: {
    "contact.bannerCopy": "RoveNox 웹사이트에 오신 것을 환영합니다! 마음에 드는 스타일이 있으면 WhatsApp으로 연락해 주세요.",
    "contact.now": "지금 문의",
    "section.bags": "가방专区",
    "section.watches": "시계专区",
    "reviews.title": "고객 리뷰",
    "service.freeTitle": "무료 배송",
    "service.freeCopy": "Journal은 2000개 이상의 리뷰에서 가장 높은 평가를 받은 테마입니다",
    "service.qualityTitle": "품질 보증",
    "service.qualityCopy": "소재와 제작 과정에서 발생할 수 있는 결함을 보장합니다",
    "service.returnsTitle": "반품 및 교환",
    "service.returnsCopy": "만족하지 못한 상품은 30일 이내 반품할 수 있습니다",
    "service.moneyTitle": "환불 보장",
    "service.moneyCopy": "반품 수령 후 1주일 이내 전액 환불됩니다",
    "footer.infoTitle": "정보",
    "footer.aboutUs": "회사 소개",
    "footer.contactUs": "문의",
    "footer.privacy": "개인정보 처리방침",
    "footer.returnPolicy": "반품 정책",
    "footer.shippingPolicy": "배송 정책",
    "footer.terms": "이용 약관",
    "footer.careTitle": "고객 지원",
    "footer.orders": "내 주문",
    "footer.account": "내 계정",
    "footer.favorites": "내 즐겨찾기",
    "footer.allProducts": "전체 상품",
    "footer.cart": "장바구니",
    "footer.tracking": "주문 추적",
    "footer.newsletterTitle": "소식을 받아보시겠어요?",
    "footer.newsletterCopy": "이메일 주소로 가입하고 최신 뉴스, 회원 전용 혜택, 할인, 팁 등을 받아보세요!",
    "footer.email": "이메일",
    "footer.send": "보내기",
    "footer.copyright": "Copyright © 2026, RoveNox 모든 권리 보유"
  },
  "pt-PT": {
    "contact.bannerCopy": "Bem-vindo ao site RoveNox! Se gostar de algum estilo, contacte-me no WhatsApp.",
    "contact.now": "Contactar agora",
    "section.bags": "Zona de malas",
    "section.watches": "Zona de relogios",
    "reviews.title": "AVALIACOES DE CLIENTES",
    "service.freeTitle": "Envio gratis",
    "service.freeCopy": "Journal e o tema mais bem avaliado com mais de 2000 avaliacoes",
    "service.qualityTitle": "Garantia de qualidade",
    "service.qualityCopy": "Cobre qualquer possivel defeito de materiais e fabrico",
    "service.returnsTitle": "Devolucoes e trocas",
    "service.returnsCopy": "Qualquer devolucao de artigo insatisfeito esta disponivel no prazo de 30 dias",
    "service.moneyTitle": "Garantia de reembolso",
    "service.moneyCopy": "O reembolso total sera dado no prazo de 1 semana apos recebermos a devolucao",
    "footer.infoTitle": "INFORMACOES",
    "footer.aboutUs": "Sobre nos",
    "footer.contactUs": "Contacto",
    "footer.privacy": "Politica de privacidade",
    "footer.returnPolicy": "Politica de devolucao",
    "footer.shippingPolicy": "Politica de envio",
    "footer.terms": "Termos e condicoes",
    "footer.careTitle": "APOIO AO CLIENTE",
    "footer.orders": "As minhas encomendas",
    "footer.account": "A minha conta",
    "footer.favorites": "Os meus favoritos",
    "footer.allProducts": "Todos os produtos",
    "footer.cart": "Carrinho",
    "footer.tracking": "Seguimento da encomenda",
    "footer.newsletterTitle": "QUER FICAR A PAR?",
    "footer.newsletterCopy": "Inscreva-se com o seu email para receber novidades, vantagens de membro, ofertas, dicas e muito mais!",
    "footer.email": "Email",
    "footer.send": "Enviar",
    "footer.copyright": "Copyright © 2026, RoveNox Todos os direitos reservados"
  },
  ja: {
    "contact.bannerCopy": "RoveNoxサイトへようこそ。気に入ったスタイルがあればWhatsAppでご連絡ください。",
    "contact.now": "今すぐ連絡",
    "section.bags": "バッグ专区",
    "section.watches": "時計专区",
    "reviews.title": "カスタマーレビュー",
    "service.freeTitle": "送料無料",
    "service.freeCopy": "Journalは2000件以上のレビューで最も高く評価されたテーマです",
    "service.qualityTitle": "品質保証",
    "service.qualityCopy": "素材や仕上がりに関するあらゆる可能な欠陥をカバーします",
    "service.returnsTitle": "返品・交換",
    "service.returnsCopy": "満足できない商品は30日以内に返品できます",
    "service.moneyTitle": "返金保証",
    "service.moneyCopy": "返品到着後1週間以内に全額返金します",
    "footer.infoTitle": "インフォメーション",
    "footer.aboutUs": "会社概要",
    "footer.contactUs": "お問い合わせ",
    "footer.privacy": "プライバシーポリシー",
    "footer.returnPolicy": "返品ポリシー",
    "footer.shippingPolicy": "配送ポリシー",
    "footer.terms": "利用規約",
    "footer.careTitle": "カスタマーケア",
    "footer.orders": "注文履歴",
    "footer.account": "マイアカウント",
    "footer.favorites": "お気に入り",
    "footer.allProducts": "すべての商品",
    "footer.cart": "ショッピングカート",
    "footer.tracking": "注文追跡",
    "footer.newsletterTitle": "最新情報を受け取りますか？",
    "footer.newsletterCopy": "メールアドレスを登録して、最新ニュース、会員限定特典、セール、ヒントなどを受け取りましょう。",
    "footer.email": "メール",
    "footer.send": "送信",
    "footer.copyright": "Copyright © 2026, RoveNox All Rights Reserved"
  },
  es: {
    "contact.bannerCopy": "Bienvenido al sitio web de RoveNox. Si te gusta algun estilo, contactame por WhatsApp.",
    "contact.now": "Contactar ahora",
    "section.bags": "Zona de bolsos",
    "section.watches": "Zona de relojes",
    "reviews.title": "OPINIONES DE CLIENTES",
    "service.freeTitle": "Envio gratis",
    "service.freeCopy": "Journal es el tema mejor valorado con mas de 2000 opiniones",
    "service.qualityTitle": "Garantia de calidad",
    "service.qualityCopy": "Cubre cualquier posible defecto en materiales y fabricacion",
    "service.returnsTitle": "Devoluciones y cambios",
    "service.returnsCopy": "Cualquier devolucion por insatisfaccion esta disponible en 30 dias",
    "service.moneyTitle": "Garantia de reembolso",
    "service.moneyCopy": "El reembolso completo se dara en 1 semana tras recibir tu devolucion",
    "footer.infoTitle": "INFORMACION",
    "footer.aboutUs": "Sobre nosotros",
    "footer.contactUs": "Contacto",
    "footer.privacy": "Politica de privacidad",
    "footer.returnPolicy": "Politica de devolucion",
    "footer.shippingPolicy": "Politica de envio",
    "footer.terms": "Terminos y condiciones",
    "footer.careTitle": "ATENCION AL CLIENTE",
    "footer.orders": "Mis pedidos",
    "footer.account": "Mi cuenta",
    "footer.favorites": "Mis favoritos",
    "footer.allProducts": "Todos los productos",
    "footer.cart": "Carrito",
    "footer.tracking": "Seguimiento de pedido",
    "footer.newsletterTitle": "QUIERES ESTAR AL DIA?",
    "footer.newsletterCopy": "Registrate con tu email para recibir noticias, ventajas de miembros, ofertas, consejos y mas.",
    "footer.email": "Email",
    "footer.send": "Enviar",
    "footer.copyright": "Copyright © 2026, RoveNox Todos los derechos reservados"
  },
  it: {
    "contact.bannerCopy": "Benvenuto nel sito RoveNox! Se ti piace uno stile, contattami su WhatsApp.",
    "contact.now": "Contatta ora",
    "section.bags": "Area borse",
    "section.watches": "Area orologi",
    "reviews.title": "RECENSIONI CLIENTI",
    "service.freeTitle": "Spedizione gratuita",
    "service.freeCopy": "Journal e il tema piu votato con oltre 2000 recensioni",
    "service.qualityTitle": "Garanzia qualita",
    "service.qualityCopy": "Copre ogni possibile difetto di materiali e lavorazione",
    "service.returnsTitle": "Resi e cambi",
    "service.returnsCopy": "Il reso per articoli non soddisfacenti e disponibile entro 30 giorni",
    "service.moneyTitle": "Garanzia rimborso",
    "service.moneyCopy": "Il rimborso completo sara emesso entro 1 settimana dal ricevimento del reso",
    "footer.infoTitle": "INFORMAZIONI",
    "footer.aboutUs": "Chi siamo",
    "footer.contactUs": "Contatti",
    "footer.privacy": "Privacy policy",
    "footer.returnPolicy": "Politica resi",
    "footer.shippingPolicy": "Politica spedizioni",
    "footer.terms": "Termini e condizioni",
    "footer.careTitle": "ASSISTENZA CLIENTI",
    "footer.orders": "I miei ordini",
    "footer.account": "Il mio account",
    "footer.favorites": "I miei preferiti",
    "footer.allProducts": "Tutti i prodotti",
    "footer.cart": "Carrello",
    "footer.tracking": "Tracciamento ordine",
    "footer.newsletterTitle": "VUOI RESTARE AGGIORNATO?",
    "footer.newsletterCopy": "Iscriviti con la tua email per ricevere novita, vantaggi membri, offerte, consigli e altro!",
    "footer.email": "Email",
    "footer.send": "Invia",
    "footer.copyright": "Copyright © 2026, RoveNox Tutti i diritti riservati"
  },
  "zh-Hant": {
    "contact.bannerCopy": "歡迎來到 RoveNox 網站！如果你有喜歡的款式，請透過 WhatsApp 聯絡我。",
    "contact.now": "立即聯絡",
    "section.bags": "包專區",
    "section.watches": "手錶專區",
    "reviews.title": "顧客評價",
    "service.freeTitle": "免運費",
    "service.freeCopy": "Journal 是超過 2000 則評論中評分最高的主題",
    "service.qualityTitle": "品質保固",
    "service.qualityCopy": "涵蓋材料與工藝中任何可能的瑕疵",
    "service.returnsTitle": "退貨與換貨",
    "service.returnsCopy": "不滿意商品可於 30 天內辦理退貨",
    "service.moneyTitle": "退款保證",
    "service.moneyCopy": "收到退貨後 1 週內將提供全額退款",
    "footer.infoTitle": "資訊",
    "footer.aboutUs": "關於我們",
    "footer.contactUs": "聯絡我們",
    "footer.privacy": "隱私政策",
    "footer.returnPolicy": "退貨政策",
    "footer.shippingPolicy": "配送政策",
    "footer.terms": "條款與細則",
    "footer.careTitle": "客戶服務",
    "footer.orders": "我的訂單",
    "footer.account": "我的帳戶",
    "footer.favorites": "我的收藏",
    "footer.allProducts": "全部商品",
    "footer.cart": "購物車",
    "footer.tracking": "訂單追蹤",
    "footer.newsletterTitle": "想掌握最新消息？",
    "footer.newsletterCopy": "使用你的電子郵件訂閱最新消息，享受會員專屬福利、優惠、技巧與更多內容！",
    "footer.email": "電子郵件",
    "footer.send": "送出",
    "footer.copyright": "Copyright © 2026, RoveNox 版權所有"
  },
  ar: {
    "contact.bannerCopy": "مرحبا بك في موقع RoveNox! إذا أعجبك أي نمط، تواصل معي عبر واتساب.",
    "contact.now": "تواصل الآن",
    "section.bags": "قسم الحقائب",
    "section.watches": "قسم الساعات",
    "reviews.title": "آراء العملاء",
    "service.freeTitle": "شحن مجاني",
    "service.freeCopy": "Journal هو القالب الأعلى تقييما مع أكثر من 2000 مراجعة",
    "service.qualityTitle": "ضمان الجودة",
    "service.qualityCopy": "يغطي أي عيب محتمل في المواد أو التصنيع",
    "service.returnsTitle": "الإرجاع والاستبدال",
    "service.returnsCopy": "يمكن إرجاع أي منتج غير مرض خلال 30 يوما",
    "service.moneyTitle": "ضمان استرداد المال",
    "service.moneyCopy": "سيتم رد المبلغ بالكامل خلال أسبوع واحد بعد استلام الإرجاع",
    "footer.infoTitle": "معلومات",
    "footer.aboutUs": "من نحن",
    "footer.contactUs": "اتصل بنا",
    "footer.privacy": "سياسة الخصوصية",
    "footer.returnPolicy": "سياسة الإرجاع",
    "footer.shippingPolicy": "سياسة الشحن",
    "footer.terms": "الشروط والأحكام",
    "footer.careTitle": "خدمة العملاء",
    "footer.orders": "طلباتي",
    "footer.account": "حسابي",
    "footer.favorites": "مفضلتي",
    "footer.allProducts": "كل المنتجات",
    "footer.cart": "عربة التسوق",
    "footer.tracking": "تتبع الطلب",
    "footer.newsletterTitle": "هل تريد متابعة الجديد؟",
    "footer.newsletterCopy": "سجل بريدك الإلكتروني لتلقي آخر الأخبار ومزايا الأعضاء والعروض والنصائح والمزيد!",
    "footer.email": "البريد الإلكتروني",
    "footer.send": "إرسال",
    "footer.copyright": "Copyright © 2026, RoveNox جميع الحقوق محفوظة"
  }
};

function money(value) {
  const range = priceBounds(value);
  if (range.min !== range.max) {
    return `$${range.min.toLocaleString("en-US")}-$${range.max.toLocaleString("en-US")}`;
  }
  return `$${range.min.toLocaleString("en-US")}`;
}

function priceBounds(value) {
  if (typeof value === "string") {
    const range = value.trim().match(/^(\d+)\s*[-–]\s*(\d+)$/);
    if (range) return { min: Number(range[1]), max: Number(range[2]) };
  }
  const number = Number(value);
  return { min: number, max: number };
}

function getI18n() {
  return window.RoveNoxI18N || { languages: { en: { htmlLang: "en", dir: "ltr" } }, ui: { en: {} } };
}

function translate(key, replacements = {}) {
  const i18n = getI18n();
  const dictionary = i18n.ui[activeLanguage] || i18n.ui.en;
  const fallback = i18n.ui.en || {};
  const supplementalDictionary = supplementalTranslations[activeLanguage] || supplementalTranslations.en;
  const supplementalFallback = supplementalTranslations.en;
  const template = dictionary[key] || supplementalDictionary[key] || fallback[key] || supplementalFallback[key] || key;
  return Object.entries(replacements).reduce(
    (text, [name, value]) => text.replace(`{${name}}`, value),
    template
  );
}

function translateStaticPage() {
  document.querySelectorAll("[data-i18n]").forEach((element) => {
    element.textContent = translate(element.dataset.i18n);
  });

  document.querySelectorAll("[data-i18n-placeholder]").forEach((element) => {
    element.setAttribute("placeholder", translate(element.dataset.i18nPlaceholder));
  });

  document.querySelectorAll("[data-i18n-aria-label]").forEach((element) => {
    element.setAttribute("aria-label", translate(element.dataset.i18nAriaLabel));
  });
}

function productBadge(product) {
  const translatedBadge = translate(`badge.${product.badge.toLowerCase()}`);
  return translatedBadge.startsWith("badge.") ? product.badge : translatedBadge;
}

function productCategory(product) {
  return translate(`product.${product.category}`);
}

function productDescription(product) {
  const i18n = getI18n();
  const descriptions = i18n.productDescriptions || {};
  return descriptions[activeLanguage]?.[product.category] ||
    descriptions.en?.[product.category] ||
    product.description;
}

function visibleProducts() {
  const term = searchInput.value.trim().toLowerCase();
  return products.filter((product) => {
    const matchesFilter = activeFilter === "all" || product.category === activeFilter;
    const matchesBrand = !activeBrandFilter || product.badge.toLowerCase() === activeBrandFilter;
    const matchesSearch = !term ||
      product.name.toLowerCase().includes(term) ||
      product.badge.toLowerCase().includes(term) ||
      productCategory(product).toLowerCase().includes(term) ||
      product.category.includes(term);
    return matchesFilter && matchesBrand && matchesSearch;
  });
}

function productArt(product, extraClass = "") {
  const media = productMediaMarkup({
    url: product.image,
    mediaType: product.mediaType,
    alt: "",
    loading: "lazy",
    autoplay: true
  });
  const imageClass = product.image ? "has-image" : "";
  return `<div class="product-art ${product.category} ${product.tone} ${imageClass} ${extraClass}" aria-hidden="true">${media}</div>`;
}

function productMediaMarkup({ url, mediaType = "", alt = "", loading = "", autoplay = false }) {
  if (!url) return "";
  if (mediaType?.startsWith("video/")) {
    return `<video src="${url}" muted loop playsinline ${autoplay ? "autoplay" : "controls"}></video>`;
  }
  const loadingAttribute = loading ? ` loading="${loading}"` : "";
  return `<img src="${url}" alt="${alt.replace(/"/g, "&quot;")}"${loadingAttribute} decoding="async">`;
}

function productGalleryMedia(product) {
  const media = Array.isArray(product.media) ? product.media : [];
  if (media.length) return media;
  if (!product.image) return [];
  return [{
    url: product.image,
    mediaType: product.mediaType || "",
    title: product.name
  }];
}

function productDetailGallery(product) {
  const media = productGalleryMedia(product);
  if (!media.length) return productArt(product, "detail-art");
  const firstMedia = media[0];
  return `
    <div class="detail-gallery" data-detail-gallery>
      <div class="detail-thumbs" aria-label="Product images">
        ${media.map((item, index) => `
          <button class="detail-thumb ${index === 0 ? "active" : ""}" type="button" data-detail-media-index="${index}" aria-label="${item.title || product.name}">
            ${productMediaMarkup({
              url: item.url,
              mediaType: item.mediaType,
              alt: item.title || product.name,
              loading: "lazy"
            })}
          </button>
        `).join("")}
      </div>
      <div class="detail-main-media" data-detail-main-media>
        ${productMediaMarkup({
          url: firstMedia.url,
          mediaType: firstMedia.mediaType,
          alt: firstMedia.title || product.name,
          autoplay: true
        })}
      </div>
      <script type="application/json" data-detail-media-json>${JSON.stringify(media).replace(/</g, "\\u003c")}</script>
    </div>
  `;
}

function productCard(product) {
  return `
    <article class="product-card">
      <button class="product-button" type="button" data-view="${product.id}">
        ${productArt(product)}
        <div class="product-info">
          <div class="product-meta">
            <span class="product-category">${productBadge(product)}</span>
            <span class="product-price">${money(product.price)}</span>
          </div>
          <h3>${product.name}</h3>
        </div>
      </button>
      <div class="product-info quick-add">
        <span>${product.colors[0]} / ${product.sizes[0]}</span>
        <button type="button" data-add="${product.id}">${translate("modal.add")}</button>
      </div>
    </article>
  `;
}

function whatsappProductUrl(product) {
  const message = `Hello, I want to order ${product.name}.`;
  return `https://wa.me/86136159964960?text=${encodeURIComponent(message)}`;
}

function renderProducts() {
  const filtered = visibleProducts();
  relatedGrid.innerHTML = filtered.slice(0, 8).map(productCard).join("");
  if (featuredGrid) {
    featuredGrid.innerHTML = products.slice(2, 10).map(productCard).join("");
  }
}

function setFilter(filter, brand = "") {
  activeFilter = filter;
  activeBrandFilter = brand.toLowerCase();
  document.querySelectorAll("[data-filter]").forEach((button) => {
    button.classList.toggle(
      "active",
      button.dataset.filter === filter && (button.dataset.brandFilter || "").toLowerCase() === activeBrandFilter
    );
  });
  renderProducts();
}

function closeNavMenus() {
  document.querySelectorAll(".nav-item.open").forEach((item) => {
    item.classList.remove("open");
    item.querySelector(".nav-trigger")?.setAttribute("aria-expanded", "false");
  });
}

function toggleNavMenu(trigger) {
  const navItem = trigger.closest(".nav-item");
  const willOpen = !navItem.classList.contains("open");
  closeNavMenus();
  navItem.classList.toggle("open", willOpen);
  trigger.setAttribute("aria-expanded", String(willOpen));
}

function getProduct(id) {
  return products.find((product) => product.id === id);
}

function addToCart(id, quantity = 1) {
  const product = getProduct(id);
  if (!product) throw new Error(`Unknown product id: ${id}`);
  const current = cart.get(id) || { product, quantity: 0 };
  current.quantity += quantity;
  cart.set(id, current);
  renderCart();
  showToast(translate("toast.added", { name: product.name }));
}

function updateQuantity(id, delta) {
  const current = cart.get(id);
  if (!current) throw new Error(`Cannot update missing cart item: ${id}`);
  current.quantity += delta;
  if (current.quantity <= 0) {
    cart.delete(id);
  } else {
    cart.set(id, current);
  }
  renderCart();
}

function removeItem(id) {
  if (!cart.has(id)) throw new Error(`Cannot remove missing cart item: ${id}`);
  cart.delete(id);
  renderCart();
}

function cartSummary() {
  const entries = [...cart.values()];
  return entries.reduce(
    (summary, item) => {
      const price = priceBounds(item.product.price);
      summary.count += item.quantity;
      summary.totalMin += price.min * item.quantity;
      summary.totalMax += price.max * item.quantity;
      return summary;
    },
    { count: 0, totalMin: 0, totalMax: 0 }
  );
}

function renderCart() {
  const entries = [...cart.values()];
  if (!entries.length) {
    cartItems.innerHTML = `<div class="empty-cart"><p>${translate("cart.empty")}</p></div>`;
  } else {
    cartItems.innerHTML = entries
      .map(({ product, quantity }) => `
        <article class="cart-line">
          ${productArt(product, "cart-thumb")}
          <div>
            <h3>${product.name}</h3>
            <p>${money(product.price)} ${translate("cart.each")}</p>
            <div class="cart-controls">
              <div class="qty-control" aria-label="Quantity controls">
                <button type="button" data-dec="${product.id}" aria-label="${translate("cart.decrease")}">−</button>
                <span>${quantity}</span>
                <button type="button" data-inc="${product.id}" aria-label="${translate("cart.increase")}">+</button>
              </div>
              <button class="remove-button" type="button" data-remove="${product.id}">${translate("cart.remove")}</button>
            </div>
          </div>
        </article>
      `)
      .join("");
  }
  const summary = cartSummary();
  cartCount.textContent = summary.count;
  cartTotal.textContent = money(summary.totalMin === summary.totalMax ? summary.totalMin : `${summary.totalMin}-${summary.totalMax}`);
}

function openCart() {
  closeNav();
  cartDrawer.classList.add("open");
  cartDrawer.setAttribute("aria-hidden", "false");
  overlay.hidden = false;
}

function closeCart() {
  cartDrawer.classList.remove("open");
  cartDrawer.setAttribute("aria-hidden", "true");
  if (!productModal.classList.contains("open")) overlay.hidden = true;
}

function openNav() {
  closeCart();
  closeModal();
  navDrawer.classList.add("open");
  navDrawer.setAttribute("aria-hidden", "false");
  overlay.hidden = false;
}

function closeNav() {
  navDrawer.classList.remove("open");
  navDrawer.setAttribute("aria-hidden", "true");
  if (!cartDrawer.classList.contains("open") && !productModal.classList.contains("open")) {
    overlay.hidden = true;
  }
}

function openModal(id) {
  closeNav();
  const product = getProduct(id);
  if (!product) throw new Error(`Unknown product id: ${id}`);
  modalBody.innerHTML = `
    ${productDetailGallery(product)}
    <div class="detail-panel">
      <p class="eyebrow">${productCategory(product)}</p>
      <h2>${product.name}</h2>
      <p class="detail-price">${money(product.price)}</p>
      <p class="detail-copy">${productDescription(product)}</p>
      <dl class="detail-stock">
        <div>
          <dt>Quantity</dt>
          <dd>In Stock</dd>
        </div>
      </dl>
      <p class="detail-order-copy">Contact whatsapp to order</p>
      <a class="detail-whatsapp" href="${whatsappProductUrl(product)}" target="_blank" rel="noopener noreferrer">Contact on WhatsApp</a>
    </div>
  `;
  productModal.classList.add("open");
  productModal.setAttribute("aria-hidden", "false");
  overlay.hidden = false;
}

function closeModal() {
  productModal.classList.remove("open");
  productModal.setAttribute("aria-hidden", "true");
  if (!cartDrawer.classList.contains("open")) overlay.hidden = true;
}

function showToast(message) {
  const existing = document.querySelector(".toast");
  if (existing) existing.remove();
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.textContent = message;
  document.body.appendChild(toast);
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => toast.remove(), 2200);
}

function setLanguage(language) {
  const i18n = getI18n();
  if (!i18n.ui[language]) throw new Error(`Unsupported language: ${language}`);
  activeLanguage = language;
  languageSelect.value = language;
  localStorage.setItem("rovenox-language", language);
  const languageMeta = i18n.languages[language] || i18n.languages.en;
  document.documentElement.lang = languageMeta.htmlLang;
  document.documentElement.dir = languageMeta.dir;
  translateStaticPage();
  renderProducts();
  renderCart();
}

document.addEventListener("click", (event) => {
  const target = event.target.closest("button, a");
  if (!event.target.closest(".nav-item")) closeNavMenus();
  if (!target) return;

  if (target.matches("[data-nav-menu]")) {
    toggleNavMenu(target);
    return;
  }

  if (target.matches("[data-filter]")) {
    setFilter(target.dataset.filter, target.dataset.brandFilter || "");
    closeNavMenus();
  }

  if (target.matches("[data-view]")) {
    openModal(target.dataset.view);
  }

  if (target.matches("[data-add]")) {
    addToCart(target.dataset.add);
  }

  if (target.matches("[data-buy]")) {
    addToCart(target.dataset.buy);
    closeModal();
    openCart();
  }

  if (target.matches("[data-inc]")) updateQuantity(target.dataset.inc, 1);
  if (target.matches("[data-dec]")) updateQuantity(target.dataset.dec, -1);
  if (target.matches("[data-remove]")) removeItem(target.dataset.remove);

  if (target.closest(".nav-drawer a")) {
    closeNav();
  }
});

document.querySelector("#openCart").addEventListener("click", openCart);
document.querySelector("#closeCart").addEventListener("click", closeCart);
document.querySelector("#closeModal").addEventListener("click", closeModal);
menuButton.addEventListener("click", openNav);
closeNavButton.addEventListener("click", closeNav);
overlay.addEventListener("click", () => {
  closeModal();
  closeCart();
  closeNav();
});

document.querySelector(".search").addEventListener("submit", (event) => {
  event.preventDefault();
  renderProducts();
  document.querySelector("#related").scrollIntoView({ behavior: "smooth" });
});

searchInput.addEventListener("input", renderProducts);

languageSelect.addEventListener("change", (event) => {
  setLanguage(event.target.value);
});

modalBody.addEventListener("click", (event) => {
  const thumbnail = event.target.closest("[data-detail-media-index]");
  if (thumbnail) {
    const gallery = thumbnail.closest("[data-detail-gallery]");
    const mediaScript = gallery?.querySelector("[data-detail-media-json]");
    const mainMedia = gallery?.querySelector("[data-detail-main-media]");
    if (!mediaScript || !mainMedia) return;
    const media = JSON.parse(mediaScript.textContent);
    const selectedMedia = media[Number(thumbnail.dataset.detailMediaIndex)];
    if (!selectedMedia) return;
    gallery.querySelectorAll(".detail-thumb").forEach((button) => button.classList.remove("active"));
    thumbnail.classList.add("active");
    mainMedia.innerHTML = productMediaMarkup({
      url: selectedMedia.url,
      mediaType: selectedMedia.mediaType,
      alt: selectedMedia.title || "",
      autoplay: true
    });
    return;
  }

  const pill = event.target.closest(".choice-pill");
  if (!pill) return;
  const row = pill.parentElement;
  row.querySelectorAll(".choice-pill").forEach((button) => button.classList.remove("active"));
  pill.classList.add("active");
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeNavMenus();
    closeModal();
    closeCart();
    closeNav();
  }
});

async function loadProducts() {
  const response = await fetch("/api/public/products");
  if (!response.ok) throw new Error(`Cannot load products: ${response.status}`);
  const data = await response.json();
  if (!Array.isArray(data.products)) throw new Error("Invalid products response");
  products = data.products;
}

async function loadHomeModules() {
  const response = await fetch("/api/public/home");
  if (!response.ok) throw new Error(`Cannot load home modules: ${response.status}`);
  const data = await response.json();
  if (!Array.isArray(data.modules)) throw new Error("Invalid home modules response");
  renderHomeModules(data.modules);
}

function renderHomeModules(modules) {
  const brandLogoSection = document.querySelector("#brandLogoSection");
  const imageCategorySection = document.querySelector("#imageCategorySection");

  if (brandLogoSection) {
    brandLogoSection.innerHTML = modules
      .filter((module) => module.moduleType === "brand_logo")
      .map((module) => `<a class="brand-logo-card" href="${module.linkUrl}"><img src="${module.image}" alt="${module.title}"></a>`)
      .join("");
  }

  if (imageCategorySection) {
    imageCategorySection.innerHTML = modules
      .filter((module) => module.moduleType === "image_category")
      .map((module, index) => `<a class="image-category-card ${index === 3 || index === 7 ? "wide" : ""}" href="${module.linkUrl}"><img src="${module.image}" alt="${module.title}"><span>${module.title}</span></a>`)
      .join("");
  }
}

Promise.all([loadProducts(), loadHomeModules()])
  .catch((error) => {
    console.error(error);
  })
  .finally(() => {
    setLanguage(activeLanguage);
    window.requestAnimationFrame(() => document.body.classList.add("is-ready"));
  });
