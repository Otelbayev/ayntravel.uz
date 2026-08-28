'use client';

import { CrudList } from '@/components/admin/CrudList';
import { MODELS } from '@/lib/admin-models';

export default function Page() {
  return <CrudList config={MODELS.testimonials} />;
}
