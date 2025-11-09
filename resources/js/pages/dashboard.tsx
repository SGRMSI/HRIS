import { Card, CardContent,  CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { Briefcase, TrendingUp, UserCheck, UserCog, Users } from 'lucide-react';

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
                    {stats.map((stat) => {
                        const Icon = stat.icon;
                        return (
                            <Card key={stat.title} className="transition-shadow hover:shadow-lg">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                                    <div className={`rounded-full p-2 ${stat.bgColor}`}>
                                        <Icon className={`h-4 w-4 ${stat.color}`} />
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-3xl font-bold">{stat.value.toLocaleString()}</div>
                                    <p className="mt-1 text-xs text-muted-foreground">{stat.description}</p>

                                    {/* Optional: Show percentage of total */}
                                    {stat.title !== 'Total Employees' && employeeStats.total > 0 && (
                                        <div className="mt-2 flex items-center text-xs">
                                            <TrendingUp className="mr-1 h-3 w-3 text-muted-foreground" />
                                            <span className="text-muted-foreground">
                                                {((stat.value / employeeStats.total) * 100).toFixed(1)}% of total
                                            </span>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>


            </div>
        </AppLayout>
    );
}
