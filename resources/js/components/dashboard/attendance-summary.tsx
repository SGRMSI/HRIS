import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Link } from '@inertiajs/react';
import { AlertCircle, Calendar, CheckCircle2, Clock, XCircle } from 'lucide-react';

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
    const attendanceRate = summary.today.total_expected > 0 ? (summary.today.present / summary.today.total_expected) * 100 : 0;

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                        <Clock className="h-5 w-5" />
                        Attendance Today
                    </span>
                    <Link href={route('attendance.final.index')}>
                        <Badge variant="outline" className="cursor-pointer hover:bg-gray-100">
                            View All
                        </Badge>
                    </Link>
                </CardTitle>
                <CardDescription>
                    {new Date().toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                    })}
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Today's Attendance */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                        <span>Attendance Rate</span>
                        <span className="font-semibold">{attendanceRate.toFixed(1)}%</span>
                    </div>
                    <Progress value={attendanceRate} className="h-2" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        <div>
                            <p className="text-2xl font-bold">{summary.today.present}</p>
                            <p className="text-xs text-muted-foreground">Present</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-yellow-600" />
                        <div>
                            <p className="text-2xl font-bold">{summary.today.late}</p>
                            <p className="text-xs text-muted-foreground">Late</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <XCircle className="h-4 w-4 text-red-600" />
                        <div>
                            <p className="text-2xl font-bold">{summary.today.absent}</p>
                            <p className="text-xs text-muted-foreground">Absent</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-blue-600" />
                        <div>
                            <p className="text-2xl font-bold">{summary.today.on_leave}</p>
                            <p className="text-xs text-muted-foreground">On Leave</p>
                        </div>
                    </div>
                </div>

                {/* Pending Approvals */}
                {summary.pending_approvals > 0 && (
                    <div className="border-t pt-4">
                        <Link href={route('attendance.final.index', { requires_approval: true })}>
                            <div className="flex cursor-pointer items-center justify-between rounded-lg bg-yellow-50 p-3 transition-colors hover:bg-yellow-100">
                                <div className="flex items-center gap-2">
                                    <AlertCircle className="h-4 w-4 text-yellow-600" />
                                    <span className="text-sm font-medium">{summary.pending_approvals} pending approval(s)</span>
                                </div>
                                <Badge variant="secondary">{summary.pending_approvals}</Badge>
                            </div>
                        </Link>
                    </div>
                )}

                {/* This Month Stats */}
                <div className="space-y-2 border-t pt-4">
                    <h4 className="text-sm font-medium">This Month</h4>
                    <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="rounded bg-gray-50 p-2">
                            <p className="text-lg font-bold">{summary.this_month.worked_days}</p>
                            <p className="text-xs text-muted-foreground">Worked</p>
                        </div>
                        <div className="rounded bg-gray-50 p-2">
                            <p className="text-lg font-bold">{summary.this_month.leave_days}</p>
                            <p className="text-xs text-muted-foreground">Leave</p>
                        </div>
                        <div className="rounded bg-gray-50 p-2">
                            <p className="text-lg font-bold">{summary.this_month.average_attendance_rate.toFixed(0)}%</p>
                            <p className="text-xs text-muted-foreground">Avg Rate</p>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
