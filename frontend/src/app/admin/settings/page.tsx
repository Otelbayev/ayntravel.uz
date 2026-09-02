"use client";

import { useState, type FormEvent } from "react";
import { useAdminResource } from "@/hooks/useAdminResource";
import { Loader2, Save } from "lucide-react";
import type { SiteSettings } from "@/shared";
import { adminClient, AdminApiError } from "@/lib/admin-client";
import { useToast } from "@/components/admin/Toast";
import { AdminShell } from "@/components/admin/AdminShell";
import {
  Card,
  ErrorBox,
  Field,
  FormSkeleton,
  inputStyles,
} from "@/components/admin/ui";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

/**
 * Sayt sozlamalari. Telefonlar, linklar, manzil va hero matni shu yerdan
 * boshqariladi — ularni o'zgartirish uchun dasturchi kerak bo'lmasligi kerak.
 */

interface Group {
  title: string;
  hint?: string;
  fields: {
    key: keyof SiteSettings & string;
    label: string;
    type?: "text" | "textarea";
    hint?: string;
    placeholder?: string;
  }[];
}

const GROUPS: Group[] = [
  {
    title: "Aloqa",
    hint: "Telefon raqamlari saytning eng ko‘p bosiladigan elementi — diqqat bilan kiriting.",
    fields: [
      {
        key: "phonePrimary",
        label: "Asosiy telefon",
        placeholder: "+998915443160",
        hint: "Xalqaro formatda, bo‘shliqsiz",
      },
      {
        key: "phoneSecondary",
        label: "Ikkinchi telefon",
        placeholder: "+998772696767",
      },
      { key: "email", label: "Email", placeholder: "info@ayntravel.uz" },
    ],
  },
  {
    title: "Ijtimoiy tarmoqlar",
    fields: [
      {
        key: "telegramChannel",
        label: "Telegram kanal",
        placeholder: "https://t.me/ayn_travel",
      },
      {
        key: "telegramAdmin",
        label: "Telegram admin",
        placeholder: "https://t.me/ayntravel01",
      },
      {
        key: "instagram",
        label: "Instagram",
        placeholder: "https://www.instagram.com/ayntravel.uz/",
      },
    ],
  },
  {
    title: "Manzil va ish vaqti",
    fields: [
      { key: "addressUz", label: "Manzil (UZ)", type: "textarea" },
      { key: "addressRu", label: "Manzil (RU)", type: "textarea" },
      {
        key: "mapUrl",
        label: "Xarita havolasi",
        placeholder: "https://yandex.uz/maps/-/CTHanBlc",
      },
      { key: "workingHoursUz", label: "Ish vaqti (UZ)" },
      { key: "workingHoursRu", label: "Ish vaqti (RU)" },
    ],
  },
  {
    title: "Bosh sahifa matni",
    hint: "Saytning birinchi ekranida ko‘rinadigan katta sarlavha va tagmatn.",
    fields: [
      { key: "heroTitleUz", label: "Sarlavha (UZ)" },
      { key: "heroTitleRu", label: "Sarlavha (RU)" },
      { key: "heroSubtitleUz", label: "Tagmatn (UZ)" },
      { key: "heroSubtitleRu", label: "Tagmatn (RU)" },
    ],
  },
];

const STAT_FIELDS: { key: keyof SiteSettings["stats"]; label: string }[] = [
  { key: "toursCount", label: "Tur yo‘nalishlari" },
  { key: "clientsCount", label: "Mamnun mijozlar" },
  { key: "followersCount", label: "Instagram obunachilari" },
  { key: "yearsCount", label: "Yillik tajriba" },
];

export default function SettingsPage() {
  const {
    data: loaded,
    loading,
    error,
    reload,
  } = useAdminResource<SiteSettings>("/api/admin/settings");

  return (
    <AdminShell title="Sozlamalar">
      {error && <ErrorBox message={error} onRetry={reload} />}

      {loading || !loaded ? (
        <FormSkeleton />
      ) : (
        /*
         * Forma alohida komponent va `key` bilan bog'langan: server
         * ma'lumoti kelganda u mount bo'ladi va boshlang'ich holatni
         * o'sha zahoti oladi. Shu tufayli serverdan kelgan qiymatni
         * effekt ichida holatga ko'chirish kerak emas.
         */
        <SettingsForm initial={loaded} />
      )}
    </AdminShell>
  );
}

function SettingsForm({ initial }: { initial: SiteSettings }) {
  const toast = useToast();
  const [settings, setSettings] = useState<SiteSettings>(initial);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  function setValue(key: string, value: unknown) {
    setSettings((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  }

  function setStat(key: keyof SiteSettings["stats"], value: number) {
    setSettings((prev) => ({
      ...prev,
      stats: { ...prev.stats, [key]: value },
    }));
    setSaved(false);
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    try {
      const updated = await adminClient.put<SiteSettings>(
        "/api/admin/settings",
        settings,
      );
      setSettings(updated);
      setSaved(true);
      toast.success("Sozlamalar saqlandi", "Saytdagi kontaktlar yangilandi");
    } catch (err) {
      toast.error(
        err instanceof AdminApiError ? err.message : "Saqlab bo‘lmadi",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="flex max-w-3xl flex-col gap-5 pb-24">
      {GROUPS.map((group) => (
        <Card key={group.title} className="flex flex-col gap-4">
          <div>
            <h2 className="font-display font-bold text-ink">{group.title}</h2>
            {group.hint && (
              <p className="mt-1 text-xs text-ink-subtle">{group.hint}</p>
            )}
          </div>

          {group.fields.map((field) => (
            <Field key={field.key} label={field.label} hint={field.hint}>
              {field.type === "textarea" ? (
                <textarea
                  value={String(settings[field.key] ?? "")}
                  onChange={(e) => setValue(field.key, e.target.value)}
                  rows={2}
                  placeholder={field.placeholder}
                  className={cn(inputStyles, "resize-y")}
                />
              ) : (
                <input
                  value={String(settings[field.key] ?? "")}
                  onChange={(e) => setValue(field.key, e.target.value)}
                  placeholder={field.placeholder}
                  className={inputStyles}
                />
              )}
            </Field>
          ))}
        </Card>
      ))}

      <Card className="flex flex-col gap-4">
        <div>
          <h2 className="font-display font-bold text-ink">
            Statistika raqamlari
          </h2>
          <p className="mt-1 text-xs text-ink-subtle">
            Bosh sahifada sanaladigan raqamlar sifatida ko‘rinadi.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {STAT_FIELDS.map((stat) => (
            <Field key={stat.key} label={stat.label}>
              <input
                type="number"
                min={0}
                value={settings.stats[stat.key]}
                onChange={(e) => setStat(stat.key, Number(e.target.value) || 0)}
                className={inputStyles}
              />
            </Field>
          ))}
        </div>
      </Card>

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-surface-raised/95 p-4 backdrop-blur-xl lg:pl-64">
        <div className="flex items-center justify-end gap-3">
          {saved && (
            <span className="text-sm text-emerald-400">Saqlandi ✓</span>
          )}
          <Button type="submit" disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                Saqlanmoqda...
              </>
            ) : (
              <>
                <Save className="size-4" aria-hidden="true" />
                Saqlash
              </>
            )}
          </Button>
        </div>
      </div>
    </form>
  );
}
