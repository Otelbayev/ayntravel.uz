'use client';

import { use, useEffect, useState } from 'react';
import type { TourDTO } from '@/shared';
import { adminClient, AdminApiError } from '@/lib/admin-client';
import { AdminShell } from '@/components/admin/AdminShell';
import { TourForm } from '@/components/admin/TourForm';
import { ErrorBox, Spinner } from '@/components/admin/ui';

export default function EditTourPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  const [tour, setTour] = useState<TourDTO | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminClient
      .get<TourDTO>(`/api/admin/tours/${id}`)
      .then(setTour)
      .catch((err) => setError(err instanceof AdminApiError ? err.message : 'Tur yuklanmadi'))
      .finally(() => setLoading(false));
  }, [id]);

  return (
    <AdminShell title={tour ? tour.titleUz : 'Turni tahrirlash'}>
      {error && <ErrorBox message={error} />}
      {loading ? <Spinner /> : tour ? <TourForm tour={tour} /> : null}
    </AdminShell>
  );
}
