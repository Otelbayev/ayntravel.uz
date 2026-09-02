'use client';

import { use } from 'react';
import { CrudForm } from '@/components/admin/CrudForm';
import { MODELS } from '@/lib/admin-models';

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <CrudForm config={MODELS.users} id={id} />;
}
