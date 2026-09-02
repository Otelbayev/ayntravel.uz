import type { ReactNode } from 'react';

/**
 * Ildiz layout. Haqiqiy `<html>` tegi `app/[locale]/layout.tsx` da —
 * chunki `lang` atributi joriy tilga bog'liq. Bu yerda faqat o'tkazib yuboramiz.
 */
export default function RootLayout({ children }: { children: ReactNode }) {
  return children;
}
