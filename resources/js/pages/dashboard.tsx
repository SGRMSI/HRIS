import { StatsCard } from '@/components/dashboard/employee-stat-card';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { Briefcase, UserCheck, UserCog, Users } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
    },
];

interface EmployeeStats {
    total: number;
    probationary: number;
    regular: number;
    contractual: number;
}

interface DashboardProps {
    employeeStats: EmployeeStats;
}

export default function Dashboard({ employeeStats }: DashboardProps) {
    const stats = [
        {
            title: 'Total Employees',
            value: employeeStats.total,
            icon: Users,
            description: 'All active employees',
            color: 'text-blue-600',
            bgColor: 'bg-blue-100',
        },
        {
            title: 'Regular Employees',
            value: employeeStats.regular,
            icon: UserCheck,
            description: 'Permanent staff members',
            color: 'text-green-600',
            bgColor: 'bg-green-100',
        },
        {
            title: 'Probationary',
            value: employeeStats.probationary,
            icon: UserCog,
            description: 'Under probation period',
            color: 'text-yellow-600',
            bgColor: 'bg-yellow-100',
        },
        {
            title: 'Contractual',
            value: employeeStats.contractual,
            icon: Briefcase,
            description: 'Contract-based employees',
            color: 'text-purple-600',
            bgColor: 'bg-purple-100',
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl p-6">

                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
                    {stats.map((stat) => (
                        <StatsCard
                            key={stat.title}
                            title={stat.title}
                            value={stat.value}
                            description={stat.description}
                            icon={stat.icon}
                            color={stat.color}
                            bgColor={stat.bgColor}
                            showPercentage={stat.title !== 'Total Employees'}
                            totalValue={employeeStats.total}
                        />
                    ))}
                </div>
            </div>
        </AppLayout>
    );
}
