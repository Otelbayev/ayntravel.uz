'use client';

import { CrudForm } from '@/components/admin/CrudForm';
import { MODELS } from '@/lib/admin-models';

export default function Page() {
  return <CrudForm config={MODELS.faq} />;
}
