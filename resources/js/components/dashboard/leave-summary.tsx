import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Link, router } from '@inertiajs/react';
import { formatDistanceToNow } from 'date-fns';
import { Calendar, CheckCircle2, Clock, FileText } from 'lucide-react';

interface LeaveRequest {
    id: number;
    employee: {
        id: number;
        name: string;
        avatar?: string;
        id_number: string;
        department?: { name: string } | null;
    };
    leave_type: string;
    date_start: string | null;
    date_end: string | null;
    days_count: number;
    reason: string;
    status: 'pending' | 'approved' | 'rejected' | 'cancelled';
    created_at: string;
    document_path?: string;
}

interface LeaveSummaryProps {
    pending_leaves: LeaveRequest[];
    total_pending: number;
    approved_today: number;
}

export function LeaveSummary({ pending_leaves, total_pending, approved_today }: LeaveSummaryProps) {
    const handleApprove = (leaveId: number) => {
        if (confirm('Are you sure you want to approve this leave request?')) {
            router.post(
                route('attendance.leaves.approve'),
                { leave_id: leaveId },
                {
                    preserveScroll: true,
                },
            );
        }
    };

    const getLeaveTypeColor = (type: string) => {
        const colors: Record<string, string> = {
            sick: 'bg-red-100 text-red-800',
            vacation: 'bg-blue-100 text-blue-800',
            emergency: 'bg-orange-100 text-orange-800',
            maternity: 'bg-pink-100 text-pink-800',
            paternity: 'bg-purple-100 text-purple-800',
            unpaid: 'bg-gray-100 text-gray-800',
        };
        return colors[type.toLowerCase()] || 'bg-gray-100 text-gray-800';
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                        <Calendar className="h-5 w-5" />
                        Leave Requests
                    </span>
                    <Link href={route('attendance.leaves.index')}>
                        <Badge variant="outline" className="cursor-pointer hover:bg-gray-100">
                            View All
                        </Badge>
                    </Link>
                </CardTitle>
                <CardDescription>
                    {total_pending} pending • {approved_today} approved today
                </CardDescription>
            </CardHeader>
            <CardContent>
                {pending_leaves.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                        <CheckCircle2 className="mb-3 h-12 w-12 text-green-500" />
                        <p className="text-sm font-medium">All caught up!</p>
                        <p className="text-xs text-muted-foreground">No pending leave requests at the moment.</p>
                    </div>
                ) : (
                    <div className="max-h-[400px] overflow-y-auto pr-4">
                        <div className="space-y-4">
                            {pending_leaves.map((leave) => (
                                <div key={leave.id} className="rounded-lg border bg-card p-4 transition-shadow hover:shadow-md">
                                    <div className="mb-3 flex items-start justify-between">
                                        <div className="flex items-start gap-3">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-200">
                                                {leave.employee.avatar ? (
                                                    <img
                                                        src={leave.employee.avatar}
                                                        alt={leave.employee.name}
                                                        className="h-10 w-10 rounded-full object-cover"
                                                    />
                                                ) : (
                                                    <span className="text-sm font-semibold">{leave.employee.name.charAt(0)}</span>
                                                )}
                                            </div>
                                            <div>
                                                <Link href={route('employee.show', leave.employee.id)} className="font-semibold hover:underline">
                                                    {leave.employee.name}
                                                </Link>
                                                <p className="text-xs text-muted-foreground">
                                                    {leave.employee.id_number}
                                                    {leave.employee.department && <> • {leave.employee.department.name}</>}
                                                </p>
                                            </div>
                                        </div>
                                        <Badge className={getLeaveTypeColor(leave.leave_type)}>{leave.leave_type}</Badge>
                                    </div>

                                    <div className="mb-3 space-y-2">
                                        <div className="flex items-center gap-2 text-sm">
                                            <Clock className="h-4 w-4 text-muted-foreground" />
                                            <span>
                                                {leave.date_start && leave.date_end ? (
                                                    <>
                                                        {new Date(leave.date_start).toLocaleDateString()} -{' '}
                                                        {new Date(leave.date_end).toLocaleDateString()}
                                                        <span className="ml-1 text-muted-foreground">
                                                            ({leave.days_count} day{leave.days_count !== 1 ? 's' : ''})
                                                        </span>
                                                    </>
                                                ) : (
                                                    <span className="text-muted-foreground">Date not specified</span>
                                                )}
                                            </span>
                                        </div>
                                        <p className="line-clamp-2 text-sm text-muted-foreground">{leave.reason}</p>
                                        <p className="text-xs text-muted-foreground">
                                            Requested {formatDistanceToNow(new Date(leave.created_at))} ago
                                        </p>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <Button size="sm" variant="default" onClick={() => handleApprove(leave.id)} className="flex-1">
                                            <CheckCircle2 className="mr-1 h-4 w-4" />
                                            Approve
                                        </Button>
                                        <Link href={route('attendance.leaves.show', leave.id)} className="flex-1">
                                            <Button size="sm" variant="outline" className="w-full">
                                                <FileText className="mr-1 h-4 w-4" />
                                                View
                                            </Button>
                                        </Link>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
