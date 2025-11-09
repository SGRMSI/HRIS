import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
    title: string;
    value: number;
    description: string;
    icon: LucideIcon;
    color: string;
    bgColor: string;
    showPercentage?: boolean;
    totalValue?: number;
}

export function StatsCard({ title, value, description, icon: Icon, color, bgColor, showPercentage, totalValue }: StatsCardProps) {
    const percentage = showPercentage && totalValue ? Math.round((value / totalValue) * 100) : null;

    // Convert light mode colors to include dark mode variants
    const getDarkModeClasses = (lightColor: string, lightBg: string) => {
        const colorMap: Record<string, string> = {
            'text-blue-600': 'dark:text-blue-400',
            'text-green-600': 'dark:text-green-400',
            'text-yellow-600': 'dark:text-yellow-400',
            'text-purple-600': 'dark:text-purple-400',
        };

        const bgMap: Record<string, string> = {
            'bg-blue-100': 'dark:bg-blue-900/30',
            'bg-green-100': 'dark:bg-green-900/30',
            'bg-yellow-100': 'dark:bg-yellow-900/30',
            'bg-purple-100': 'dark:bg-purple-900/30',
        };

        return {
            textClass: `${lightColor} ${colorMap[lightColor] || ''}`,
            bgClass: `${lightBg} ${bgMap[lightBg] || ''}`,
        };
    };

    const { textClass, bgClass } = getDarkModeClasses(color, bgColor);

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
                <div className={`rounded-full p-2 ${bgClass}`}>
                    <Icon className={`h-4 w-4 ${textClass}`} />
                </div>
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{value}</div>
                <div className="flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">{description}</p>
                    {percentage !== null && <span className={`text-xs font-medium ${textClass}`}>{percentage}%</span>}
                </div>
            </CardContent>
        </Card>
    );
}
