import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Link } from '@inertiajs/react';
import { BarChart3, CalendarPlus, FileText, Loader2, Upload, UserPlus } from 'lucide-react';

interface QuickAction {
    title: string;
    description: string;
    href?: string;
    icon: React.ComponentType<{ className?: string }>;
    color: string;
    bgColor: string;
    onClick?: () => void;
    isLoading?: boolean;
}

export function QuickActions() {

    // All routes verified against routes/attendance.php
    const actions: QuickAction[] = [
        {
            title: 'Add Employee',
            description: 'Register new employee',
            href: route('employee.create'),
            icon: UserPlus,
            color: 'text-blue-600 dark:text-blue-400',
            bgColor: 'bg-blue-100 dark:bg-blue-900/30',
        },
        {
            title: 'Upload Attendance',
            description: 'Import attendance logs',
            href: route('attendance.raw.index'),
            icon: Upload,
            color: 'text-green-600 dark:text-green-400',
            bgColor: 'bg-green-100 dark:bg-green-900/30',
        },
        {
            title: 'Manage Schedules',
            description: 'Assign shifts',
            href: route('attendance.schedules.index'),
            icon: CalendarPlus,
            color: 'text-orange-600 dark:text-orange-400',
            bgColor: 'bg-orange-100 dark:bg-orange-900/30',
        },
        {
            title: 'Leave Requests',
            description: 'View and approve',
            href: route('attendance.leaves.index'),
            icon: FileText,
            color: 'text-pink-600 dark:text-pink-400',
            bgColor: 'bg-pink-100 dark:bg-pink-900/30',
        },
        {
            title: 'Attendance Reports',
            description: 'View final records',
            href: route('attendance.final.index'),
            icon: BarChart3,
            color: 'text-indigo-600 dark:text-indigo-400',
            bgColor: 'bg-indigo-100 dark:bg-indigo-900/30',
        },
    ];

    return (
        <Card>
            <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Common tasks and shortcuts</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
                    {actions.map((action) => {
                        const Icon = action.icon;
                        const content = (
                            <>
                                <div className={`rounded-lg p-2 ${action.bgColor}`}>
                                    {action.isLoading ? (
                                        <Loader2 className={`h-5 w-5 animate-spin ${action.color}`} />
                                    ) : (
                                        <Icon className={`h-5 w-5 ${action.color}`} />
                                    )}
                                </div>
                                <div className="text-left">
                                    <p className="text-sm font-semibold">{action.title}</p>
                                    <p className="text-xs text-muted-foreground">{action.description}</p>
                                </div>
                            </>
                        );

                        
                        // Different rendering for link vs button actions
                        if (action.href) {
                            return (
                                <Link key={action.title} href={action.href}>
                                    <Button
                                        variant="ghost"
                                        className="h-auto w-full flex-col items-start gap-2 p-4 transition-all hover:bg-accent hover:shadow-md dark:hover:bg-gray-900/50"
                                    >
                                        {content}
                                    </Button>
                                </Link>
                            );
                        }

                        return (
                            <Button
                                key={action.title}
                                variant="ghost"
                                onClick={action.onClick}
                                disabled={action.isLoading}
                                className="h-auto w-full flex-col items-start gap-2 p-4 transition-all hover:bg-accent hover:shadow-md dark:hover:bg-gray-900/50"
                            >
                                {content}
                            </Button>
                        );
                    })}
                </div>
            </CardContent>
        </Card>
    );
}
