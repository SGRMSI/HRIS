import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Link } from '@inertiajs/react';
import { BarChart3, CalendarPlus, Clock, DollarSign, FileText, Upload, UserPlus } from 'lucide-react';

interface QuickAction {
    title: string;
    description: string;
    href: string;
    icon: React.ComponentType<{ className?: string }>;
    color: string;
}

export function QuickActions() {
    const actions: QuickAction[] = [
        {
            title: 'Add Employee',
            description: 'Register new employee',
            href: route('employee.create'),
            icon: UserPlus,
            color: 'bg-blue-50 text-blue-600 hover:bg-blue-100',
        },
        {
            title: 'Upload Attendance',
            description: 'Import attendance logs',
            href: route('attendance.upload'),
            icon: Upload,
            color: 'bg-green-50 text-green-600 hover:bg-green-100',
        },
        {
            title: 'Process Attendance',
            description: 'Review and approve',
            href: route('attendance.processed.index'),
            icon: Clock,
            color: 'bg-purple-50 text-purple-600 hover:bg-purple-100',
        },
        {
            title: 'Manage Schedules',
            description: 'Assign shifts',
            href: route('attendance.schedules.index'),
            icon: CalendarPlus,
            color: 'bg-orange-50 text-orange-600 hover:bg-orange-100',
        },
        {
            title: 'Leave Requests',
            description: 'View and approve',
            href: route('attendance.leaves.index'),
            icon: FileText,
            color: 'bg-pink-50 text-pink-600 hover:bg-pink-100',
        },
        {
            title: 'Generate Attendance',
            description: 'Generate attendance reports',
            href: route('attendance.final.index'),
            icon: BarChart3,
            color: 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100',
        },
        {
            title: 'Generate Payroll',
            description: 'Generate payroll reports',
            href: route('attendance.final.index'),
            icon: DollarSign,
            color: 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100',
        },
    ];

    return (
        <Card>
            <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Common tasks and shortcuts</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                    {actions.map((action) => {
                        const Icon = action.icon;
                        return (
                            <Link key={action.title} href={action.href}>
                                <Button variant="ghost" className="h-auto w-full flex-col items-start gap-2 p-4 transition-all hover:shadow-md">
                                    <div className={`rounded-lg p-2 ${action.color}`}>
                                        <Icon className="h-5 w-5" />
                                    </div>
                                    <div className="text-left">
                                        <p className="text-sm font-semibold">{action.title}</p>
                                        <p className="text-xs text-muted-foreground">{action.description}</p>
                                    </div>
                                </Button>
                            </Link>
                        );
                    })}
                </div>
            </CardContent>
        </Card>
    );
}
