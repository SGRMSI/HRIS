import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LucideIcon, TrendingUp } from 'lucide-react';

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

export function StatsCard({ title, value, description, icon: Icon, color, bgColor, showPercentage = false, totalValue }: StatsCardProps) {
    const percentage = showPercentage && totalValue && totalValue > 0 ? ((value / totalValue) * 100).toFixed(1) : null;

    return (
        <Card className="transition-shadow hover:shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
                <div className={`rounded-full p-2 ${bgColor}`}>
                    <Icon className={`h-4 w-4 ${color}`} />
                </div>
            </CardHeader>
            <CardContent>
                <div className="text-3xl font-bold">{value.toLocaleString()}</div>
                <p className="mt-1 text-xs text-muted-foreground">{description}</p>

                {percentage && (
                    <div className="mt-2 flex items-center text-xs">
                        <TrendingUp className="mr-1 h-3 w-3 text-muted-foreground" />
                        <span className="text-muted-foreground">{percentage}% of total</span>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
