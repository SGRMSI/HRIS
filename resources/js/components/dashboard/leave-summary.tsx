import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Link } from '@inertiajs/react';
import { format } from 'date-fns';
import { Calendar, CheckCircle, Clock, FileText } from 'lucide-react';

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
    const getLeaveTypeBadgeColor = (type: string) => {
        const lowerType = type.toLowerCase();
        if (lowerType.includes('sick')) return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300';
        if (lowerType.includes('vacation')) return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300';
        if (lowerType.includes('emergency')) return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300';
        return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
    };

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <Calendar className="h-5 w-5" />
                            Leave Requests
                        </CardTitle>
                        <CardDescription>Pending leave applications</CardDescription>
                    </div>
                    <div className="flex gap-2">
                        <Badge variant="secondary" className="bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300">
                            <Clock className="mr-1 h-3 w-3" />
                            {total_pending} Pending
                        </Badge>
                        <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300">
                            <CheckCircle className="mr-1 h-3 w-3" />
                            {approved_today} Today
                        </Badge>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <ScrollArea className="h-[900px] pr-4">
                    {pending_leaves.length === 0 ? (
                        <div className="flex h-[200px] items-center justify-center">
                            <p className="text-sm text-muted-foreground">No pending leave requests</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {pending_leaves.map((leave) => (
                                <div
                                    key={leave.id}
                                    className="flex items-start gap-3 rounded-lg border p-3 transition-colors hover:bg-accent dark:border-gray-800 dark:hover:bg-gray-900/50"
                                >
                                    <Avatar className="h-10 w-10">
                                        <AvatarImage src={leave.employee.avatar} alt={leave.employee.name} />
                                        <AvatarFallback className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                                            {getInitials(leave.employee.name)}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 space-y-2">
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <Link href={route('employee.show', leave.employee.id)} className="font-medium hover:underline">
                                                    {leave.employee.name}
                                                </Link>
                                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                    <span>{leave.employee.id_number}</span>
                                                    {leave.employee.department && (
                                                        <>
                                                            <span>•</span>
                                                            <span>{leave.employee.department.name}</span>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                            <Badge variant="outline" className={getLeaveTypeBadgeColor(leave.leave_type)}>
                                                {leave.leave_type}
                                            </Badge>
                                        </div>
                                        <div className="space-y-1 text-sm">
                                            <div className="flex items-center gap-2 text-muted-foreground">
                                                <Calendar className="h-3 w-3" />
                                                <span>
                                                    {leave.date_start && format(new Date(leave.date_start), 'MMM d')}
                                                    {leave.date_end && ` - ${format(new Date(leave.date_end), 'MMM d, yyyy')}`}
                                                </span>
                                                <span className="font-medium text-foreground">({leave.days_count} days)</span>
                                            </div>
                                            <p className="text-muted-foreground">{leave.reason}</p>
                                            {leave.document_path && (
                                                <div className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
                                                    <FileText className="h-3 w-3" />
                                                    <span className="text-xs">Document attached</span>
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex gap-2 pt-2">
                                            <Button asChild size="sm" variant="default" className="h-8">
                                                <Link href={route('attendance.leaves.show', leave.id)}>Review</Link>
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </ScrollArea>
            </CardContent>
        </Card>
    );
}
