import Script from 'next/script';

const YANDEX_ID = process.env.NEXT_PUBLIC_YANDEX_METRIKA_ID;
const GA_ID = process.env.NEXT_PUBLIC_GA_ID;

/**
 * Analitika. Ikkalasi ham `afterInteractive` — sahifa interaktiv bo'lgach
 * yuklanadi va LCP/INP ko'rsatkichlariga ta'sir qilmaydi.
 *
 * Yandex Metrika birinchi o'rinda: O'zbekiston auditoriyasining katta qismi
 * Yandex orqali keladi va webvisor sessiyalarni yozib beradi.
 */
export function Analytics() {
  if (!YANDEX_ID && !GA_ID) return null;

  return (
    <>
      {YANDEX_ID && (
        <>
          <Script id="yandex-metrika" strategy="afterInteractive">
            {`
              (function(m,e,t,r,i,k,a){m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
              m[i].l=1*new Date();
              for (var j = 0; j < document.scripts.length; j++) {if (document.scripts[j].src === r) { return; }}
              k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)})
              (window, document, "script", "https://mc.yandex.ru/metrika/tag.js", "ym");
              ym(${YANDEX_ID}, "init", {
                clickmap:true, trackLinks:true, accurateTrackBounce:true, webvisor:true
              });
            `}
          </Script>
          <noscript>
            <div>
              {/* Yandex Metrika JS o'chirilgan brauzerlar uchun piksel talab
                  qiladi. `next/image` bu yerda ishlamaydi: `<noscript>` ichida
                  React komponenti hidratlanmaydi va optimallashtirish ham
                  keraksiz — bu 1×1 piksel. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`https://mc.yandex.ru/watch/${YANDEX_ID}`}
                style={{ position: 'absolute', left: '-9999px' }}
                alt=""
              />
            </div>
          </noscript>
        </>
      )}

      {GA_ID && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
            strategy="afterInteractive"
          />
          <Script id="google-analytics" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${GA_ID}');
            `}
          </Script>
        </>
      )}
    </>
  );
}
