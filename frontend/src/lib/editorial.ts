import type { FaqDTO, ServiceDTO } from '@/shared';

// Describes existing agency services. Published CMS records take precedence.
export const EDITORIAL_SERVICES: ServiceDTO[] = [
  ['tours', 'plane', 'Sayohat paketlari', 'Туристические пакеты', 'Istaklaringiz va byudjetingizga mos yo‘nalish, mehmonxona va dam olish dasturini tanlaymiz.', 'Подберём направление, отель и программу отдыха под ваши пожелания и бюджет.'],
  ['flights', 'ticket', 'Aviachiptalar', 'Авиабилеты', 'Qulay parvoz va tarifni tanlash, bagaj shartlarini aniqlash hamda chipta bron qilishda yordam beramiz.', 'Поможем выбрать перелёт и тариф, уточнить условия багажа и забронировать билет.'],
  ['hotels', 'hotel', 'Mehmonxonalar', 'Отели', 'Joylashuv, qulayliklar va ovqatlanish turini hisobga olib, sizga mos mehmonxonani topamiz.', 'Подберём отель с учётом расположения, удобств и типа питания.'],
  ['visa', 'passport', 'Viza bo‘yicha yordam', 'Визовая поддержка', 'Tanlangan yo‘nalish uchun hujjatlar ro‘yxati va ariza topshirish jarayoni bo‘yicha maslahat beramiz.', 'Проконсультируем по документам и подаче заявления для выбранного направления.'],
  ['transfer', 'bus', 'Transferlar', 'Трансферы', 'Aeroportdan mehmonxonagacha borish va qaytish tafsilotlarini oldindan rejalashtiramiz.', 'Заранее согласуем поездку из аэропорта в отель и обратно.'],
  ['individual', 'briefcase', 'Individual sayohatlar', 'Индивидуальные поездки', 'Oilaviy dam, juftlik sayohati yoki ish safaringiz uchun alohida reja tuzamiz.', 'Составим индивидуальный план семейного отдыха, поездки вдвоём или командировки.'],
].map(([slug, icon, titleUz, titleRu, descriptionUz, descriptionRu], sortOrder) => ({ id: `editorial-${slug}`, slug, icon, titleUz, titleRu, descriptionUz, descriptionRu, sortOrder }));

export const EDITORIAL_FAQS: FaqDTO[] = [
  ['Sayohatni qanday bron qilaman?', 'Как забронировать путешествие?', 'Saytdagi arizani to‘ldiring yoki bizga qo‘ng‘iroq qiling. Yo‘nalish, sana va byudjetni kelishib, mavjud variantlarni taqdim etamiz. Bron qilish shartlari tanlangan turga qarab aniqlanadi.', 'Оставьте заявку на сайте или позвоните нам. Согласуем направление, даты и бюджет, затем предложим доступные варианты. Условия бронирования зависят от выбранного тура.'],
  ['Tur narxiga nimalar kiradi?', 'Что входит в стоимость тура?', 'Har bir tur tarkibi alohida ko‘rsatiladi. Parvoz, yashash, ovqatlanish, transfer va sug‘urta bor-yo‘qligini bron qilishdan oldin menejer bilan aniqlashtiring.', 'Состав каждого тура указан отдельно. До бронирования уточните у менеджера, включены ли перелёт, проживание, питание, трансфер и страховка.'],
  ['Bolalar bilan sayohat qilish mumkinmi?', 'Можно ли путешествовать с детьми?', 'Ha, oilaviy sayohat uchun ham variant tanlaymiz. Arizada bolalarning yoshi, soni va kerakli qulayliklarni yozing.', 'Да, мы подбираем и семейные поездки. Укажите в заявке количество и возраст детей, а также нужные удобства.'],
  ['Sanani o‘zgartirish yoki bronni bekor qilish mumkinmi?', 'Можно ли изменить даты или отменить бронь?', 'Shartlar tur, mehmonxona va aviatashuvchi tarifiga bog‘liq. O‘zgarish zarur bo‘lsa, menejer bilan bog‘laning; amaldagi shartlarni birga tekshiramiz.', 'Условия зависят от тура, отеля и тарифа авиакомпании. Если нужны изменения, свяжитесь с менеджером — вместе проверим условия вашего бронирования.'],
].map(([questionUz, questionRu, answerUz, answerRu], sortOrder) => ({ id: `editorial-faq-${sortOrder}`, questionUz, questionRu, answerUz, answerRu, sortOrder }));
