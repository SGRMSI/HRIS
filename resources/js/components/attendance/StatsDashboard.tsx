import { StatCard } from './StatCard';
import { LucideIcon } from 'lucide-react';

interface StatItem {
    title: string;
    value: string | number;
    icon: LucideIcon;
    description?: string;
    trend?: {
        value: number;
        isPositive: boolean;
    };
    variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
}

interface StatsDashboardProps {
    stats: StatItem[];
    columns?: 2 | 3 | 4 | 5;
}

export function StatsDashboard({ stats, columns = 4 }: StatsDashboardProps) {
    const gridCols = {
        2: 'grid-cols-1 md:grid-cols-2',
        3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
        4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
        5: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-5',
    };

    return (
        <div className={`grid ${gridCols[columns]} gap-4 mb-6`}>
            {stats.map((stat, index) => (
                <StatCard key={index} {...stat} />
            ))}
        </div>
    );
}
