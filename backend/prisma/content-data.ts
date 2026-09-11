/**
 * Boshlang'ich kontent — AYN TRAVEL ning Instagram posterlaridagi takliflar.
 * `seed.ts` (lokal demo) va `seed-content.ts` (bo'sh production bazasi) shu
 * ma'lumotlardan foydalanadi. Narx va sanalarni admin paneldan yangilang.
 */

export const DESTINATIONS = [
  {
    slug: 'turkiya',
    nameUz: 'Turkiya',
    nameRu: 'Турция',
    countryCode: 'TR',
    sortOrder: 1,
    descriptionUz:
      'Turkiya — tarix, dengiz va zamonaviylik uyg‘unlashgan yo‘nalish. Istanbulning tarixiy masjidlari, Antalyaning moviy sohillari, Pamukkalening oq teraslari va Kapadokiyaning shar sayohatlari bir sayohatda.',
    descriptionRu:
      'Турция — направление, где история, море и современность сливаются воедино. Исторические мечети Стамбула, лазурные пляжи Антальи, белые террасы Памуккале.',
    seoTitleUz: 'Turkiyaga turlar — Istanbul, Antalya narxlari',
    seoTitleRu: 'Туры в Турцию — Стамбул, Анталия цены',
    seoDescriptionUz:
      'Toshkentdan Turkiyaga turlar: Istanbul, Antalya, Pamukkale, Chanakkale. Aviachipta, mehmonxona va transfer kiritilgan. Narxlar 600$ dan.',
    seoDescriptionRu:
      'Туры в Турцию из Ташкента: Стамбул, Анталия, Памуккале. Перелёт, отель и трансфер включены. Цены от 600$.',
  },
  {
    slug: 'ozarbayjon',
    nameUz: 'Ozarbayjon',
    nameRu: 'Азербайджан',
    countryCode: 'AZ',
    sortOrder: 2,
    descriptionUz:
      'Baku — Kaspiy bo‘yidagi zamonaviy poytaxt. Alanga minoralari, Icheri Sheher qadimiy shahri va Boulevard sayrgohi bilan mashhur.',
    descriptionRu:
      'Баку — современная столица на Каспии: Пламенные башни, старый город Ичери-шехер и знаменитый Приморский бульвар.',
    seoTitleUz: 'Ozarbayjon (Baku) turlari — narxlar 275$ dan',
    seoTitleRu: 'Туры в Азербайджан (Баку) — цены от 275$',
  },
  {
    slug: 'gruziya',
    nameUz: 'Gruziya',
    nameRu: 'Грузия',
    countryCode: 'GE',
    sortOrder: 3,
    descriptionUz:
      'Tbilisi va Batumi — tog‘lar, Qora dengiz sohili va o‘ziga xos gruzin oshxonasi. Vizasiz sayohat.',
    descriptionRu:
      'Тбилиси и Батуми — горы, побережье Чёрного моря и знаменитая грузинская кухня. Без визы.',
    seoTitleUz: 'Gruziya turlari — Tbilisi va Batumi 635$ dan',
    seoTitleRu: 'Туры в Грузию — Тбилиси и Батуми от 635$',
  },
  {
    slug: 'vyetnam',
    nameUz: 'Vyetnam',
    nameRu: 'Вьетнам',
    countryCode: 'VN',
    sortOrder: 4,
    descriptionUz:
      'Nha Trang va Danang — oq qumli plyajlar, iliq okean va tropik tabiat. Vizasiz 15 kungacha.',
    descriptionRu:
      'Нячанг и Дананг — белые пляжи, тёплый океан и тропическая природа. Без визы до 15 дней.',
    seoTitleUz: 'Vyetnam turlari — Nha Trang, Danang 580$ dan',
    seoTitleRu: 'Туры во Вьетнам — Нячанг, Дананг от 580$',
  },
  {
    slug: 'dubay',
    nameUz: 'Dubay (BAA)',
    nameRu: 'Дубай (ОАЭ)',
    countryCode: 'AE',
    sortOrder: 5,
    descriptionUz:
      'Dubay — osmono‘par binolar, cho‘l safari va dunyodagi eng yirik savdo markazlari.',
    descriptionRu: 'Дубай — небоскрёбы, сафари в пустыне и крупнейшие торговые центры мира.',
  },
  {
    slug: 'xitoy',
    nameUz: 'Xitoy',
    nameRu: 'Китай',
    countryCode: 'CN',
    sortOrder: 6,
    descriptionUz: 'Xaynan oroli va Guanchjou — tropik dam olish va shopping turlari.',
    descriptionRu: 'Остров Хайнань и Гуанчжоу — тропический отдых и шоп-туры.',
  },
  {
    slug: 'misr',
    nameUz: 'Misr',
    nameRu: 'Египет',
    countryCode: 'EG',
    sortOrder: 7,
    descriptionUz: 'Sharm el-Shayx va Hurgada — Qizil dengiz, rifllar va all inclusive.',
    descriptionRu: 'Шарм-эль-Шейх и Хургада — Красное море, рифы и «всё включено».',
  },
  {
    slug: 'tailand',
    nameUz: 'Tailand',
    nameRu: 'Таиланд',
    countryCode: 'TH',
    sortOrder: 8,
    descriptionUz: 'Pattaya va Phuket — tropik orollar, ekskursiyalar va tungi hayot.',
    descriptionRu: 'Паттайя и Пхукет — тропические острова, экскурсии и ночная жизнь.',
  },
  {
    slug: 'maldiv',
    nameUz: 'Maldiv orollari',
    nameRu: 'Мальдивы',
    countryCode: 'MV',
    sortOrder: 9,
    descriptionUz: 'Suv ustidagi villalar, kristal okean va eng yaxshi asal oyi yo‘nalishi.',
    descriptionRu: 'Виллы над водой, кристальный океан — лучшее направление для медового месяца.',
  },
];

export const SERVICES = [
  {
    slug: 'turlar',
    icon: 'plane',
    titleUz: 'Tayyor turlar',
    titleRu: 'Готовые туры',
    descriptionUz:
      'Aviachipta, mehmonxona, transfer va sug‘urta kiritilgan tayyor paketlar. Har hafta yangi yo‘nalishlar va «goryashiy» takliflar.',
    descriptionRu:
      'Готовые пакеты с перелётом, отелем, трансфером и страховкой. Каждую неделю новые направления и горящие предложения.',
    sortOrder: 1,
  },
  {
    slug: 'aviachiptalar',
    icon: 'ticket',
    titleUz: 'Aviachiptalar',
    titleRu: 'Авиабилеты',
    descriptionUz:
      'Dunyoning istalgan nuqtasiga chiptalar. Eng qulay narxni topamiz va bron qilamiz.',
    descriptionRu:
      'Билеты в любую точку мира. Найдём самый выгодный тариф и оформим бронирование.',
    sortOrder: 2,
  },
  {
    slug: 'mehmonxonalar',
    icon: 'hotel',
    titleUz: 'Mehmonxonalar',
    titleRu: 'Отели',
    descriptionUz:
      '3★ dan 5★ gacha mehmonxonalar. Joylashuvi va sharhlarini tekshirib, sizga mosini tanlaymiz.',
    descriptionRu:
      'Отели от 3★ до 5★. Проверим расположение и отзывы, подберём подходящий вариант.',
    sortOrder: 3,
  },
  {
    slug: 'viza',
    icon: 'passport',
    titleUz: 'Viza yordami',
    titleRu: 'Визовая поддержка',
    descriptionUz:
      'AQSH, Angliya, Shengen va boshqa davlatlar vizasi. Anketa to‘ldirish, hujjatlar va konsultatsiya — bo‘sh pasport bilan ham.',
    descriptionRu:
      'Визы США, Великобритании, Шенген и другие. Заполнение анкеты, документы и консультация — даже с пустым паспортом.',
    sortOrder: 4,
  },
  {
    slug: 'transport',
    icon: 'bus',
    titleUz: 'Transport xizmati',
    titleRu: 'Транспортные услуги',
    descriptionUz:
      'Aeroportga transfer, shahar bo‘ylab va guruhlar uchun mikroavtobus xizmati.',
    descriptionRu:
      'Трансфер в аэропорт, поездки по городу и микроавтобусы для групп.',
    sortOrder: 5,
  },
  {
    slug: 'korporativ',
    icon: 'briefcase',
    titleUz: 'Korporativ sayohatlar',
    titleRu: 'Корпоративные поездки',
    descriptionUz:
      'Jamoa uchun tur, biznes safar va konferensiyalarga tashkiliy yordam.',
    descriptionRu:
      'Туры для коллектива, деловые поездки и организация участия в конференциях.',
    sortOrder: 6,
  },
];

export const FAQS = [
  {
    questionUz: 'Tur narxiga nimalar kiradi?',
    questionRu: 'Что входит в стоимость тура?',
    answerUz:
      'Odatda narxga aviachipta (borish-kelish), mehmonxonada yashash, tanlangan ovqatlanish turi, aeroport–mehmonxona transferi va tibbiy sug‘urta kiradi. Har bir turda aniq ro‘yxat tur sahifasida ko‘rsatilgan.',
    answerRu:
      'Обычно в стоимость входят авиабилеты (туда-обратно), проживание в отеле, выбранный тип питания, трансфер аэропорт–отель и медицинская страховка. Точный список указан на странице тура.',
    sortOrder: 1,
  },
  {
    questionUz: 'Turni qanday band qilaman?',
    questionRu: 'Как забронировать тур?',
    answerUz:
      'Saytdagi formani to‘ldiring yoki +998 91 544 31 60 raqamiga qo‘ng‘iroq qiling. Menejerimiz 15 daqiqa ichida bog‘lanadi va barcha savollaringizga javob beradi.',
    answerRu:
      'Заполните форму на сайте или позвоните по номеру +998 91 544 31 60. Менеджер свяжется с вами в течение 15 минут.',
    sortOrder: 2,
  },
  {
    questionUz: 'Oldindan qancha to‘lash kerak?',
    questionRu: 'Какая нужна предоплата?',
    answerUz:
      'Odatda tur narxining 30% oldindan to‘lanadi, qolgani jo‘nashdan 7 kun oldin. Ba‘zi aksiyalarda shartlar boshqacha bo‘lishi mumkin — menejerdan aniqlashtiring.',
    answerRu:
      'Обычно предоплата составляет 30% от стоимости, остаток — за 7 дней до вылета. По некоторым акциям условия могут отличаться.',
    sortOrder: 3,
  },
  {
    questionUz: '«Goryashiy tur» nima?',
    questionRu: 'Что такое «горящий тур»?',
    answerUz:
      'Jo‘nash sanasiga kam vaqt qolgan va shu sababli chegirma bilan sotilayotgan tur. Joylar cheklangan, shuning uchun tez bron qilish kerak.',
    answerRu:
      'Это тур с ближайшей датой вылета, который продаётся со скидкой. Мест ограниченное количество, поэтому бронировать нужно быстро.',
    sortOrder: 4,
  },
  {
    questionUz: 'Viza kerakmi?',
    questionRu: 'Нужна ли виза?',
    answerUz:
      'O‘zbekiston fuqarolari uchun Turkiya, Gruziya, Ozarbayjon, Vyetnam, Malayziya va boshqa ko‘p davlatlarga viza kerak emas. AQSH, Angliya va Shengen uchun biz viza olishda to‘liq yordam beramiz.',
    answerRu:
      'Гражданам Узбекистана виза не нужна в Турцию, Грузию, Азербайджан, Вьетнам, Малайзию и ряд других стран. Для США, Великобритании и Шенгена мы полностью помогаем с оформлением.',
    sortOrder: 5,
  },
  {
    questionUz: 'Bolalar uchun chegirma bormi?',
    questionRu: 'Есть ли скидки для детей?',
    answerUz:
      'Ha. Aksariyat mehmonxonalarda 2 yoshgacha bolalar bepul, 2–12 yosh oralig‘ida esa sezilarli chegirma qo‘llaniladi. Aniq narxni menejer hisoblab beradi.',
    answerRu:
      'Да. В большинстве отелей дети до 2 лет — бесплатно, от 2 до 12 лет действует существенная скидка. Точную цену рассчитает менеджер.',
    sortOrder: 6,
  },
];

/** Instagram posterlaridagi haqiqiy takliflar. */
export const TOURS = [
  {
    slug: 'turkiya-mojizalari-istanbul-chanakkale-pamukkale-antalya',
    titleUz: 'Turkiya mo‘jizalari: Istanbul • Chanakkale • Pamukkale • Antalya',
    titleRu: 'Чудеса Турции: Стамбул • Чанаккале • Памуккале • Анталия',
    summaryUz:
      '7 kun / 6 kecha davomida Turkiyaning to‘rt eng go‘zal shahri: Istanbulning tarixiy markazi, Chanakkaledagi Troya oti, Pamukkalening oq teraslari va Antalyaning moviy sohili.',
    summaryRu:
      '7 дней / 6 ночей по четырём самым красивым городам Турции: исторический центр Стамбула, Троянский конь в Чанаккале, белые террасы Памуккале и лазурный берег Антальи.',
    destinationSlug: 'turkiya',
    priceFrom: 800,
    extraFee: 250,
    departureDate: new Date('2026-10-28T00:00:00Z'),
    durationDays: 7,
    durationNights: 6,
    hotelStars: 4,
    mealPlan: 'BB' as const,
    citiesUz: ['Istanbul', 'Chanakkale', 'Pamukkale', 'Antalya'],
    citiesRu: ['Стамбул', 'Чанаккале', 'Памуккале', 'Анталия'],
    includes: [
      'Toshkent–Istanbul–Toshkent aviachiptasi',
      '6 kecha mehmonxonada yashash (2 kishilik xonada)',
      'Nonushta (BB)',
      'Shaharlararo transport',
      'Rus/o‘zbek tilida gid',
      'Tibbiy sug‘urta',
    ],
    excludes: ['Qo‘shimcha to‘lov 250$', 'Muzeylarga kirish chiptalari', 'Shaxsiy xarajatlar'],
    isFeatured: true,
    isHot: false,
    seatsLeft: 12,
    seoTitleUz: 'Turkiya mo‘jizalari turi — 7 kun 800$ | 28-oktabr',
    seoDescriptionUz:
      'Istanbul, Chanakkale, Pamukkale va Antalya bo‘ylab 7 kunlik tur. 28-oktabr jo‘nash, narx 800$ dan. Aviachipta, mehmonxona va transfer kiritilgan.',
  },
  {
    slug: 'ozarbayjon-baku-turi',
    titleUz: 'Ozarbayjon — Baku sayohati',
    titleRu: 'Азербайджан — путешествие в Баку',
    summaryUz:
      'Kaspiy bo‘yidagi Baku: Alanga minoralari, Icheri Sheher qadimiy shahri va Boulevard. 3★, 4★ va 5★ mehmonxonalar tanlovi.',
    summaryRu:
      'Баку на Каспии: Пламенные башни, старый город Ичери-шехер и Приморский бульвар. На выбор отели 3★, 4★ и 5★.',
    destinationSlug: 'ozarbayjon',
    priceFrom: 275,
    departureDate: new Date('2026-10-10T00:00:00Z'),
    durationDays: 4,
    durationNights: 3,
    hotelStars: 3,
    mealPlan: 'BB' as const,
    citiesUz: ['Baku'],
    citiesRu: ['Баку'],
    includes: [
      'Toshkent–Baku–Toshkent aviachiptasi',
      '3 kecha mehmonxonada yashash',
      'Nonushta',
      'Aeroport transferi',
      'Tibbiy sug‘urta',
    ],
    excludes: ['Ekskursiyalar', 'Tushlik va kechki ovqat'],
    isHot: true,
    isFeatured: true,
    seatsLeft: 6,
    bodyUz:
      '<h2>Mehmonxona tanlovi</h2><ul><li><strong>3★ mehmonxona — 275$</strong></li><li><strong>4★ mehmonxona — 300$</strong></li><li><strong>5★ mehmonxona — 317$</strong></li></ul><p>Narxlar 1 kishi uchun, 2 kishilik joylashuv asosida.</p>',
    bodyRu:
      '<h2>Выбор отеля</h2><ul><li><strong>Отель 3★ — 275$</strong></li><li><strong>Отель 4★ — 300$</strong></li><li><strong>Отель 5★ — 317$</strong></li></ul><p>Цены за 1 человека при двухместном размещении.</p>',
    seoTitleUz: 'Baku turi 275$ dan — 31-avgust jo‘nash',
  },
  {
    slug: 'tbilisi-batumi-turi',
    titleUz: 'Tbilisi + Batumi',
    titleRu: 'Тбилиси + Батуми',
    summaryUz:
      'Ikki shahar bitta sayohatda: Tbilisining qadimiy ko‘chalari va Batumining Qora dengiz sohili. Vizasiz.',
    summaryRu:
      'Два города в одной поездке: старинные улицы Тбилиси и черноморское побережье Батуми. Без визы.',
    destinationSlug: 'gruziya',
    priceFrom: 635,
    departureDate: new Date('2026-10-17T00:00:00Z'),
    durationDays: 6,
    durationNights: 5,
    hotelStars: 4,
    mealPlan: 'BB' as const,
    citiesUz: ['Tbilisi', 'Batumi'],
    citiesRu: ['Тбилиси', 'Батуми'],
    includes: [
      'Aviachipta (borish-kelish)',
      '5 kecha mehmonxonada yashash',
      'Nonushta',
      'Tbilisi–Batumi transferi',
      'Tibbiy sug‘urta',
    ],
    excludes: ['Ekskursiyalar', 'Shaxsiy xarajatlar'],
    isHot: true,
    isFeatured: true,
    seatsLeft: 8,
    seoTitleUz: 'Tbilisi va Batumi turi 635$ dan',
  },
  {
    slug: 'nha-trang-vyetnam-turi',
    titleUz: 'Nha Trang — tropik jannatga sayohat',
    titleRu: 'Нячанг — путешествие в тропический рай',
    summaryUz:
      'Oppoq plyajlar, moviy dengiz, tropik tabiat va mazali taomlar. Vyetnamning eng mashhur kurorti.',
    summaryRu:
      'Белоснежные пляжи, лазурное море, тропическая природа и вкусная кухня. Самый популярный курорт Вьетнама.',
    destinationSlug: 'vyetnam',
    priceFrom: 580,
    departureDate: new Date('2026-11-07T00:00:00Z'),
    durationDays: 8,
    durationNights: 7,
    hotelStars: 4,
    mealPlan: 'BB' as const,
    citiesUz: ['Nha Trang'],
    citiesRu: ['Нячанг'],
    includes: [
      'Aviachipta (borish-kelish)',
      '7 kecha mehmonxonada yashash',
      'Nonushta',
      'Aeroport transferi',
      'Tibbiy sug‘urta',
    ],
    excludes: ['Ekskursiyalar', 'Vizа yig‘imi (agar kerak bo‘lsa)'],
    isHot: true,
    isFeatured: true,
    seatsLeft: 10,
    seoTitleUz: 'Nha Trang (Vyetnam) turi 580$ — 5-sentyabr',
  },
  {
    slug: 'istanbul-tarix-va-zamonaviylik',
    titleUz: 'Istanbul — tarix va zamonaviylik uyg‘unligi',
    titleRu: 'Стамбул — гармония истории и современности',
    summaryUz:
      'Ayasofya, Sultonahmad, Topqopi saroyi va Bosfor bo‘g‘ozi bo‘ylab kruiz. Ikki qit‘ani bir kunda ko‘ring.',
    summaryRu:
      'Айя-София, Султанахмет, дворец Топкапы и круиз по Босфору. Увидьте два континента за один день.',
    destinationSlug: 'turkiya',
    priceFrom: 728,
    departureDate: new Date('2026-10-24T00:00:00Z'),
    durationDays: 5,
    durationNights: 4,
    hotelStars: 4,
    mealPlan: 'BB' as const,
    citiesUz: ['Istanbul'],
    citiesRu: ['Стамбул'],
    includes: [
      'Toshkent–Istanbul–Toshkent aviachiptasi',
      '4 kecha mehmonxonada yashash',
      'Nonushta',
      'Aeroport transferi',
      'Tibbiy sug‘urta',
    ],
    excludes: ['Ekskursiyalar', 'Muzey chiptalari'],
    isFeatured: true,
    seatsLeft: 15,
    seoTitleUz: 'Istanbul turi 728$ — 3-sentyabr jo‘nash',
  },
  {
    slug: 'xitoy-xaynan-oroli',
    titleUz: 'Xitoy — Xaynan oroli',
    titleRu: 'Китай — остров Хайнань',
    summaryUz: 'Xitoyning «Gavayisi»: tropik iqlim, issiq okean va mineral buloqlar.',
    summaryRu: 'Китайские «Гавайи»: тропический климат, тёплый океан и минеральные источники.',
    destinationSlug: 'xitoy',
    priceFrom: 640,
    departureDate: new Date('2026-11-21T00:00:00Z'),
    durationDays: 8,
    durationNights: 7,
    hotelStars: 4,
    mealPlan: 'BB' as const,
    citiesUz: ['Sanya', 'Xaynan'],
    citiesRu: ['Санья', 'Хайнань'],
    includes: ['Aviachipta', '7 kecha yashash', 'Nonushta', 'Transfer', 'Sug‘urta'],
    excludes: ['Ekskursiyalar'],
    isHot: true,
    seatsLeft: 9,
  },
  {
    slug: 'antalya-goryashiy-tur',
    titleUz: 'Antalya — dengiz bo‘yida dam olish',
    titleRu: 'Анталия — отдых у моря',
    summaryUz:
      'Turkiyaning eng mashhur kurorti: moviy dengiz, hashamatli mehmonxonalar va quyoshli plyajlar. Cheklangan joylar!',
    summaryRu:
      'Самый популярный курорт Турции: лазурное море, роскошные отели и солнечные пляжи. Мест ограничено!',
    destinationSlug: 'turkiya',
    priceFrom: 600,
    departureDate: new Date('2026-10-03T00:00:00Z'),
    durationDays: 7,
    durationNights: 6,
    hotelStars: 5,
    mealPlan: 'AI' as const,
    citiesUz: ['Antalya'],
    citiesRu: ['Анталия'],
    includes: [
      'Toshkent–Antalya–Toshkent aviachiptasi',
      '6 kecha 5★ mehmonxonada',
      'Hammasi kiritilgan (All Inclusive)',
      'Aeroport transferi',
      'Tibbiy sug‘urta',
    ],
    excludes: ['Ekskursiyalar', 'Shaxsiy xarajatlar'],
    isHot: true,
    isFeatured: true,
    seatsLeft: 4,
    seoTitleUz: 'Antalya goryashiy tur 600$ — All Inclusive 5★',
  },
  {
    slug: 'dubay-turi',
    titleUz: 'Dubay — cho‘l va osmono‘parlar',
    titleRu: 'Дубай — пустыня и небоскрёбы',
    summaryUz:
      'Burj Khalifa, cho‘l safari, Dubai Mall va Palm Jumeirah. Shopping va zamonaviy hashamat.',
    summaryRu:
      'Бурдж-Халифа, сафари в пустыне, Dubai Mall и Пальма Джумейра. Шопинг и современная роскошь.',
    destinationSlug: 'dubay',
    priceFrom: 560,
    departureDate: new Date('2026-12-05T00:00:00Z'),
    durationDays: 6,
    durationNights: 5,
    hotelStars: 4,
    mealPlan: 'BB' as const,
    citiesUz: ['Dubay'],
    citiesRu: ['Дубай'],
    includes: ['Aviachipta', '5 kecha yashash', 'Nonushta', 'Transfer', 'Sug‘urta'],
    excludes: ['Ekskursiyalar', 'Viza yig‘imi'],
    isFeatured: true,
    seatsLeft: 11,
  },
];

export const POSTS = [
  {
    slug: 'ozbekistonliklar-uchun-vizasiz-davlatlar-2026',
    titleUz: 'O‘zbekistonliklar uchun vizasiz davlatlar — 2026 yil ro‘yxati',
    titleRu: 'Безвизовые страны для граждан Узбекистана — список 2026 года',
    excerptUz:
      'O‘zbekiston pasporti bilan vizasiz yoki soddalashtirilgan tartibda borish mumkin bo‘lgan davlatlar va ularda qancha turish mumkinligi.',
    excerptRu:
      'Страны, куда можно поехать с паспортом Узбекистана без визы или по упрощённой процедуре, и сроки пребывания.',
    category: 'Foydali',
    tags: ['viza', 'maslahat', 'hujjatlar'],
    bodyUz:
      '<p>O‘zbekiston fuqarolari 2026 yil holatiga ko‘ra 60 dan ortiq davlatga vizasiz sayohat qila oladi. Quyida eng ommabop yo‘nalishlar keltirilgan.</p><h2>Vizasiz — 30 kungacha</h2><ul><li><strong>Turkiya</strong> — 30 kun</li><li><strong>Gruziya</strong> — 30 kun</li><li><strong>Ozarbayjon</strong> — 10 kun</li><li><strong>Malayziya</strong> — 30 kun</li><li><strong>Vyetnam</strong> — 15 kun</li></ul><h2>Elektron viza (e-visa)</h2><ul><li><strong>BAA (Dubay)</strong> — onlayn rasmiylashtiriladi, 2–3 kun</li><li><strong>Misr</strong> — kelganda yoki onlayn</li><li><strong>Tailand</strong> — 30 kungacha vizasiz</li></ul><p>Aniq shartlar o‘zgarib turishi mumkin. Jo‘nashdan oldin menejerimiz bilan tekshiring: <a href="tel:+998915443160">+998 91 544 31 60</a>.</p>',
    bodyRu:
      '<p>По состоянию на 2026 год граждане Узбекистана могут посещать более 60 стран без визы. Ниже — самые популярные направления.</p><h2>Без визы — до 30 дней</h2><ul><li><strong>Турция</strong> — 30 дней</li><li><strong>Грузия</strong> — 30 дней</li><li><strong>Азербайджан</strong> — 10 дней</li><li><strong>Малайзия</strong> — 30 дней</li><li><strong>Вьетнам</strong> — 15 дней</li></ul><h2>Электронная виза</h2><ul><li><strong>ОАЭ (Дубай)</strong> — оформляется онлайн за 2–3 дня</li><li><strong>Египет</strong> — по прилёте или онлайн</li><li><strong>Таиланд</strong> — без визы до 30 дней</li></ul>',
    seoTitleUz: 'Vizasiz davlatlar 2026 — O‘zbekiston pasporti bilan qayerga borish mumkin',
  },
  {
    slug: 'goryashiy-tur-nima-va-qanday-tanlash-kerak',
    titleUz: '«Goryashiy tur» nima va uni qanday to‘g‘ri tanlash kerak?',
    titleRu: 'Что такое «горящий тур» и как его правильно выбрать?',
    excerptUz:
      'Chegirmali turlar qanday paydo bo‘ladi, ularda nimaga e’tibor berish kerak va qachon bron qilgan ma’qul.',
    excerptRu:
      'Откуда берутся туры со скидкой, на что обращать внимание и когда лучше бронировать.',
    category: 'Maslahat',
    tags: ['goryashiy', 'chegirma', 'maslahat'],
    bodyUz:
      '<p>Goryashiy tur — jo‘nash sanasiga 3–14 kun qolganda sotiladigan, narxi 20–40% gacha arzon bo‘lgan paket.</p><h2>Nega arzon?</h2><p>Tur operator chartered reyslardagi va mehmonxonalardagi bo‘sh joylarni sotib bo‘lmasa, ularni zararga ketkazgandan ko‘ra chegirma bilan sotgani foydali.</p><h2>Nimaga e’tibor berish kerak</h2><ul><li>Mehmonxonaning aniq nomi va yulduzi ko‘rsatilganmi</li><li>Ovqatlanish turi (BB, HB, AI)</li><li>Transfer narxga kiradimi</li><li>Pasport amal qilish muddati — kamida 6 oy</li></ul><p>Bizning goryashiy takliflarimiz Telegram kanalimizda birinchi bo‘lib e’lon qilinadi: <a href="https://t.me/ayn_travel">t.me/ayn_travel</a></p>',
    bodyRu:
      '<p>Горящий тур — это пакет, который продаётся за 3–14 дней до вылета со скидкой 20–40%.</p><h2>Почему дешевле?</h2><p>Туроператору выгоднее продать оставшиеся места со скидкой, чем потерять их полностью.</p><h2>На что смотреть</h2><ul><li>Указаны ли название и категория отеля</li><li>Тип питания (BB, HB, AI)</li><li>Входит ли трансфер</li><li>Срок действия паспорта — минимум 6 месяцев</li></ul>',
  },
  {
    slug: 'birinchi-marta-chet-elga-chiqayotganlar-uchun-yodnoma',
    titleUz: 'Birinchi marta chet elga chiqayotganlar uchun yodnoma',
    titleRu: 'Памятка для тех, кто впервые едет за границу',
    excerptUz:
      'Hujjatlar, bagaj qoidalari, valyuta, sug‘urta va aeroportdagi tartib — bilishingiz kerak bo‘lgan hamma narsa.',
    excerptRu:
      'Документы, правила багажа, валюта, страховка и порядок в аэропорту — всё, что нужно знать.',
    category: 'Foydali',
    tags: ['yodnoma', 'aeroport', 'bagaj'],
    bodyUz:
      '<h2>Hujjatlar</h2><ul><li>Xorijiy pasport — amal qilish muddati sayohat tugagach kamida 6 oy</li><li>Aviachipta (elektron nusxa yetarli)</li><li>Mehmonxona bronu</li><li>Tibbiy sug‘urta polisi</li></ul><h2>Bagaj</h2><p>Odatda 20 kg yuk + 7 kg qo‘l bagaji. Qo‘l bagajida 100 ml dan ortiq suyuqlik olib o‘tish taqiqlanadi.</p><h2>Aeroportga qachon kelish kerak</h2><p>Xalqaro reyslarga jo‘nashdan <strong>3 soat</strong> oldin.</p>',
    bodyRu:
      '<h2>Документы</h2><ul><li>Загранпаспорт — срок действия минимум 6 месяцев после поездки</li><li>Авиабилет (достаточно электронной копии)</li><li>Бронь отеля</li><li>Полис медицинского страхования</li></ul><h2>Багаж</h2><p>Обычно 20 кг багажа + 7 кг ручной клади. Жидкости более 100 мл в ручной клади запрещены.</p><h2>Когда приезжать в аэропорт</h2><p>За <strong>3 часа</strong> до международного рейса.</p>',
  },
];

export const PAGES = [
  {
    slug: 'biz-haqimizda',
    titleUz: 'Biz haqimizda',
    titleRu: 'О нас',
    bodyUz:
      '<p><strong>AYN TRAVEL</strong> — Toshkentdagi turizm kompaniyasi. Biz mijozlarimizga tayyor turlar, aviachiptalar, mehmonxona bronlari, viza yordami va transport xizmatlarini taklif qilamiz.</p><p>Instagram sahifamizda 25 000 dan ortiq obunachi bizning takliflarimizni kuzatib boradi. Har hafta yangi yo‘nalishlar va «goryashiy» turlar e’lon qilinadi.</p><h2>Nega aynan biz?</h2><ul><li>Har bir mijoz uchun individual yondashuv</li><li>Tezkor va sifatli xizmat</li><li>Shaffof narxlar — yashirin to‘lovlar yo‘q</li><li>Sayohat davomida 24/7 aloqa</li></ul><p>Ofisimiz: Toshkent shahri, Shota Rustaveli ko‘chasi, 136/2.</p>',
    bodyRu:
      '<p><strong>AYN TRAVEL</strong> — туристическая компания в Ташкенте. Мы предлагаем готовые туры, авиабилеты, бронирование отелей, визовую поддержку и транспортные услуги.</p><p>За нашими предложениями следят более 25 000 подписчиков в Instagram. Каждую неделю — новые направления и горящие туры.</p><h2>Почему мы?</h2><ul><li>Индивидуальный подход к каждому клиенту</li><li>Быстрый и качественный сервис</li><li>Прозрачные цены — без скрытых платежей</li><li>Связь 24/7 во время поездки</li></ul><p>Наш офис: г. Ташкент, улица Шота Руставели, 136/2.</p>',
  },
  {
    slug: 'ommaviy-oferta',
    titleUz: 'Ommaviy oferta',
    titleRu: 'Публичная оферта',
    bodyUz:
      '<p>Ushbu hujjat AYN TRAVEL va mijoz o‘rtasidagi turistik xizmatlar ko‘rsatish shartlarini belgilaydi.</p><h2>1. Umumiy qoidalar</h2><p>Saytdagi ariza formasini to‘ldirish orqali mijoz ushbu oferta shartlariga rozilik bildiradi.</p><h2>2. To‘lov tartibi</h2><p>Tur narxining 30% oldindan to‘lanadi, qolgan qismi jo‘nash sanasidan 7 kun oldin.</p><h2>3. Bekor qilish</h2><p>Bekor qilish shartlari har bir tur uchun alohida belgilanadi va shartnomada ko‘rsatiladi.</p>',
    bodyRu:
      '<p>Настоящий документ определяет условия оказания туристических услуг между AYN TRAVEL и клиентом.</p><h2>1. Общие положения</h2><p>Заполняя форму заявки на сайте, клиент соглашается с условиями настоящей оферты.</p><h2>2. Порядок оплаты</h2><p>Предоплата составляет 30% от стоимости тура, остаток — за 7 дней до вылета.</p><h2>3. Отмена</h2><p>Условия отмены определяются индивидуально для каждого тура и указываются в договоре.</p>',
  },
  {
    slug: 'maxfiylik-siyosati',
    titleUz: 'Maxfiylik siyosati',
    titleRu: 'Политика конфиденциальности',
    bodyUz:
      '<p>Biz sizning shaxsiy ma’lumotlaringizni himoya qilamiz va uchinchi shaxslarga bermaymiz.</p><h2>Qanday ma’lumot yig‘amiz</h2><p>Ariza formasi orqali: ism va telefon raqami. Bu ma’lumotlar faqat siz bilan bog‘lanish va xizmat ko‘rsatish uchun ishlatiladi.</p><h2>Saqlash muddati</h2><p>Ma’lumotlar xizmat ko‘rsatilgandan keyin 3 yil davomida saqlanadi.</p><h2>Cookie fayllari</h2><p>Sayt ish faoliyatini yaxshilash va statistika uchun cookie fayllardan foydalanadi.</p>',
    bodyRu:
      '<p>Мы защищаем ваши персональные данные и не передаём их третьим лицам.</p><h2>Какие данные мы собираем</h2><p>Через форму заявки: имя и номер телефона. Эти данные используются только для связи с вами и оказания услуг.</p><h2>Срок хранения</h2><p>Данные хранятся в течение 3 лет после оказания услуги.</p><h2>Файлы cookie</h2><p>Сайт использует cookie для улучшения работы и сбора статистики.</p>',
  },
];

