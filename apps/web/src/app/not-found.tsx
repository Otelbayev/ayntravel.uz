import Link from 'next/link';

/**
 * Til prefiksisiz noto'g'ri manzillar uchun (masalan /xyz).
 * Bu yerda tarjima mavjud emas — locale hali aniqlanmagan.
 */
export default function GlobalNotFound() {
  return (
    <html lang="uz">
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '1rem',
          background: '#071630',
          color: '#fff',
          fontFamily: 'system-ui, sans-serif',
          textAlign: 'center',
          padding: '1rem',
        }}
      >
        <p style={{ fontSize: '3.5rem', fontWeight: 900, color: '#D4AF37', margin: 0 }}>404</p>
        <h1 style={{ fontSize: '1.5rem', margin: 0 }}>Sahifa topilmadi / Страница не найдена</h1>
        <Link
          href="/uz"
          style={{
            marginTop: '.5rem',
            padding: '.75rem 1.5rem',
            borderRadius: '.75rem',
            background: '#D4AF37',
            color: '#050f22',
            fontWeight: 700,
            textDecoration: 'none',
          }}
        >
          Bosh sahifaga
        </Link>
      </body>
    </html>
  );
}
