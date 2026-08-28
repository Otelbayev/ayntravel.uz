'use client';

import { AdminShell } from '@/components/admin/AdminShell';
import { TourForm } from '@/components/admin/TourForm';

export default function NewTourPage() {
  return (
    <AdminShell title="Yangi tur">
      <TourForm />
    </AdminShell>
  );
}
