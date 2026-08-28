'use client';

import { Suspense, useState, type FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { LogIn, ShieldAlert } from 'lucide-react';
import { adminClient, AdminApiError } from '@/lib/admin-client';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    const data = new FormData(event.currentTarget);

    try {
      await adminClient.post('/api/auth/login', {
        email: String(data.get('email') ?? '').trim().toLowerCase(),
        password: String(data.get('password') ?? ''),
      });

      // Kirishdan oldin qaysi sahifaga bormoqchi bo'lganini eslaymiz.
      const next = searchParams.get('next');
      // Faqat ichki manzillarga ruxsat — ochiq redirect zaifligini oldini olamiz.
      const target = next && next.startsWith('/admin') ? next : '/admin';

      // `replace` — orqaga tugmasi login sahifasiga qaytarmasin.
      router.replace(target);
      router.refresh();
    } catch (err) {
      setError(
        err instanceof AdminApiError ? err.message : 'Serverga ulanib bo‘lmadi',
      );
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full flex-col gap-4">
      <Input
        name="email"
        type="email"
        label="Email"
        placeholder="admin@ayntravel.uz"
        autoComplete="username"
        required
        autoFocus
      />

      <Input
        name="password"
        type="password"
        label="Parol"
        placeholder="••••••••"
        autoComplete="current-password"
        required
      />

      {error && (
        <p
          role="alert"
          className="flex items-center gap-2 rounded-lg bg-hot-500/10 px-3 py-2.5 text-sm text-hot-400"
        >
          <ShieldAlert className="size-4 shrink-0" aria-hidden="true" />
          {error}
        </p>
      )}

      <Button type="submit" size="lg" disabled={loading} className="mt-2 w-full">
        {loading ? (
          'Kirilmoqda...'
        ) : (
          <>
            <LogIn className="size-4" aria-hidden="true" />
            Kirish
          </>
        )}
      </Button>
    </form>
  );
}

export default function AdminLoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <Image
            src="/logo.jpg"
            alt=""
            width={64}
            height={64}
            className="size-16 rounded-full object-cover"
            priority
          />
          <div>
            <h1 className="font-display text-2xl font-black text-ink">
              AYN <span className="text-gold-gradient">TRAVEL</span>
            </h1>
            <p className="mt-1 text-sm text-ink-muted">Boshqaruv paneli</p>
          </div>
        </div>

        <div className="card-surface p-6 sm:p-8">
          {/* useSearchParams Suspense chegarasini talab qiladi */}
          <Suspense fallback={<div className="h-64 animate-pulse rounded-xl bg-ink/5" />}>
            <LoginForm />
          </Suspense>
        </div>

        <p className="mt-6 text-center text-xs text-ink-subtle">
          Parolni unutdingizmi? Administratorga murojaat qiling.
        </p>
      </div>
    </div>
  );
}
