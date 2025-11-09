import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Link } from '@inertiajs/react';
import { Calendar, CheckCircle, Clock, TrendingUp, UserCheck, UserX } from 'lucide-react';

interface AttendanceSummary {
    today: {
        present: number;
        late: number;
        absent: number;
        on_leave: number;
        total_expected: number;
    };
    this_month: {
        total_days: number;
        worked_days: number;
        leave_days: number;
        absent_days: number;
        average_attendance_rate: number;
    };
    pending_approvals: number;
}

interface AttendanceSummaryWidgetProps {
    summary: AttendanceSummary;
}

export function AttendanceSummaryWidget({ summary }: AttendanceSummaryWidgetProps) {
    const todayStats = [
        {
            label: 'Present',
            value: summary.today.present,
            icon: UserCheck,
            color: 'text-green-600 dark:text-green-400',
            bgColor: 'bg-green-100 dark:bg-green-900/30',
        },
        {
            label: 'Late',
            value: summary.today.late,
            icon: Clock,
            color: 'text-yellow-600 dark:text-yellow-400',
            bgColor: 'bg-yellow-100 dark:bg-yellow-900/30',
        },
        {
            label: 'Absent',
            value: summary.today.absent,
            icon: UserX,
            color: 'text-red-600 dark:text-red-400',
            bgColor: 'bg-red-100 dark:bg-red-900/30',
        },
        {
            label: 'On Leave',
            value: summary.today.on_leave,
            icon: Calendar,
            color: 'text-blue-600 dark:text-blue-400',
            bgColor: 'bg-blue-100 dark:bg-blue-900/30',
        },
    ];

    const attendanceRate = summary.this_month.average_attendance_rate || 0;

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <CheckCircle className="h-5 w-5" />
                            Attendance Summary
                        </CardTitle>
                        <CardDescription>Today's attendance and monthly overview</CardDescription>
                    </div>
                    {summary.pending_approvals > 0 && (
                        <Badge variant="secondary" className="bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300">
                            {summary.pending_approvals} Pending
                        </Badge>
                    )}
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Today's Stats */}
                <div>
                    <h4 className="mb-3 text-sm font-semibold">Today</h4>
                    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                        {todayStats.map((stat) => (
                            <div key={stat.label} className={`flex items-center gap-2 rounded-lg p-3 transition-colors ${stat.bgColor}`}>
                                <stat.icon className={`h-4 w-4 ${stat.color}`} />
                                <div>
                                    <p className="text-2xl font-bold">{stat.value}</p>
                                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Monthly Overview */}
                <div>
                    <h4 className="mb-3 text-sm font-semibold">This Month</h4>
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Attendance Rate</span>
                            <span className="text-sm font-semibold">{attendanceRate.toFixed(1)}%</span>
                        </div>
                        <Progress value={attendanceRate} className="h-2" />
                        <div className="grid grid-cols-3 gap-4 pt-2">
                            <div className="text-center">
                                <p className="text-2xl font-bold text-green-600 dark:text-green-400">{summary.this_month.worked_days}</p>
                                <p className="text-xs text-muted-foreground">Worked Days</p>
                            </div>
                            <div className="text-center">
                                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{summary.this_month.leave_days}</p>
                                <p className="text-xs text-muted-foreground">Leave Days</p>
                            </div>
                            <div className="text-center">
                                <p className="text-2xl font-bold text-red-600 dark:text-red-400">{summary.this_month.absent_days}</p>
                                <p className="text-xs text-muted-foreground">Absent Days</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Action Button */}
                <Button asChild variant="outline" className="w-full">
                    <Link href={route('attendance.final.index')}>
                        <TrendingUp className="mr-2 h-4 w-4" />
                        View Detailed Report
                    </Link>
                </Button>
            </CardContent>
        </Card>
    );
}
