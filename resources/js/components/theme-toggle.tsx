import { Appearance, useAppearance } from '@/hooks/use-appearance';
import { cn } from '@/lib/utils';
import { Monitor, Moon, Sun } from 'lucide-react';
import { HTMLAttributes } from 'react';

export function ThemeToggle({ className = '', ...props }: HTMLAttributes<HTMLDivElement>) {
    const { appearance, updateAppearance } = useAppearance();

    const icons = [
        { value: 'light' as Appearance, icon: Sun },
        { value: 'dark' as Appearance, icon: Moon },
        { value: 'system' as Appearance, icon: Monitor },
    ];

    return (
        <div className={cn('inline-flex items-center gap-1 rounded-lg bg-neutral-100/80 p-1 dark:bg-neutral-800/80', className)} {...props}>
            {icons.map(({ value, icon: Icon }) => (
                <button
                    key={value}
                    onClick={() => updateAppearance(value)}
                    className={cn(
                        'rounded-md p-1.5 transition-colors',
                        appearance === value
                            ? 'bg-white shadow-xs dark:bg-neutral-700 dark:text-neutral-100'
                            : 'text-neutral-500 hover:bg-neutral-200/60 hover:text-black dark:text-neutral-400 dark:hover:bg-neutral-700/60',
                    )}
                >
                    <Icon className="h-4 w-4" />
                </button>
            ))}
        </div>
    );
}
