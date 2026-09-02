/**
 * Strukturalangan ma'lumotni sahifaga qo'yadi.
 *
 * `dangerouslySetInnerHTML` bu yerda zarur: JSON-LD `<script>` tegi ichida
 * xom matn bo'lishi kerak. Ma'lumot faqat bizning bazamizdan keladi,
 * lekin baribir `<` belgisini ekranlaymiz — HTML ichida tegni erta yopib
 * yuborish (XSS) ehtimolini butunlay yo'qotadi.
 */
export function JsonLd({ data }: { data: Record<string, unknown> | Record<string, unknown>[] }) {
  const json = JSON.stringify(data).replace(/</g, '\\u003c');

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: json }}
    />
  );
}
