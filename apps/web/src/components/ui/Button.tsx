import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import type { ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 font-semibold whitespace-nowrap transition-all duration-200 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]',
  {
    variants: {
      variant: {
        /*
         * Asosiy CTA — posterlardagi oltin blok uslubi.
         * Oltin fon + navy matn ikkala temada ham bir xil ishlaydi va
         * kontrasti yetarli (oltin ustidagi navy ~8:1).
         */
        primary:
          'bg-gradient-to-br from-gold-300 to-gold-500 text-navy-950 hover:from-gold-200 hover:to-gold-400 shadow-lg shadow-gold-500/25',

        /*
         * Kuchli ikkilamchi tugma. `bg-ink text-surface` — tokenlar
         * teskarisiga ishlatilgan: oq sahifada navy tugma + oq matn,
         * to'q blokda oq tugma + navy matn. Bitta variant, ikkala fon.
         */
        solid: 'bg-ink text-surface hover:opacity-90 shadow-sm',

        /* "Goryashiy" — qizil fon har doim to'q, matn har doim oq */
        hot: 'bg-hot-500 text-white hover:bg-hot-400 shadow-lg shadow-hot-500/25',

        /* Neytral ikkilamchi — fon rangiga moslashadi */
        outline: 'border border-line-strong text-ink hover:border-ink/40 hover:bg-ink/5',

        /* Oltin urg'uli ikkilamchi */
        gold: 'border border-gold-500/60 text-accent hover:bg-gold-500/10 hover:border-gold-500',

        ghost: 'text-ink-muted hover:text-ink hover:bg-ink/5',

        /* Xavfli amal — o'chirish */
        danger: 'bg-hot-500 text-white hover:bg-hot-600 shadow-sm',
      },
      size: {
        sm: 'h-9 px-4 text-sm rounded-lg',
        md: 'h-11 px-6 text-[15px] rounded-xl',
        lg: 'h-14 px-8 text-base rounded-xl',
        icon: 'size-11 rounded-xl',
        'icon-sm': 'size-9 rounded-lg',
      },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  },
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  /** `true` bo'lsa o'zi element chizmaydi — uslubni bolasiga beradi (Link uchun). */
  asChild?: boolean;
}

export function Button({ className, variant, size, asChild, ...props }: ButtonProps) {
  const Comp = asChild ? Slot : 'button';
  return <Comp className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}

export { buttonVariants };
