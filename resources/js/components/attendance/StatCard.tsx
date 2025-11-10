import { Card, CardContent } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
    title: string;
    value: string | number;
    icon: LucideIcon;
    description?: string;
    trend?: {
        value: number;
        isPositive: boolean;
    };
    variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
    className?: string;
}

const variantStyles = {
    default: 'bg-slate-50 border-slate-200',
    success: 'bg-green-50 border-green-200',
    warning: 'bg-yellow-50 border-yellow-200',
    danger: 'bg-red-50 border-red-200',
    info: 'bg-blue-50 border-blue-200',
};

const iconStyles = {
    default: 'text-slate-600',
    success: 'text-green-600',
    warning: 'text-yellow-600',
    danger: 'text-red-600',
    info: 'text-blue-600',
};

export function StatCard({
    title,
    value,
    icon: Icon,
    description,
    trend,
    variant = 'default',
    className,
}: StatCardProps) {
    return (
        <Card className={cn(variantStyles[variant], 'border-l-4', className)}>
            <CardContent className="p-6">
                <div className="flex items-center justify-between">
                    <div className="flex-1">
                        <p className="text-sm font-medium text-muted-foreground">{title}</p>
                        <div className="flex items-baseline gap-2 mt-2">
                            <h3 className="text-3xl font-bold">{value}</h3>
                            {trend && (
                                <span
                                    className={cn(
                                        'text-xs font-medium',
                                        trend.isPositive ? 'text-green-600' : 'text-red-600'
                                    )}
                                >
                                    {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
                                </span>
                            )}
                        </div>
                        {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
                    </div>
                    <div className={cn('p-3 rounded-full', variantStyles[variant])}>
                        <Icon className={cn('h-6 w-6', iconStyles[variant])} />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
