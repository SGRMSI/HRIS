import AppLayout from '@/layouts/app-layout';
import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { 
    ArrowLeft,
    Edit,
    CheckCircle2,
    XCircle,
    Ban,
    Calendar,
    User,
    FileText,
    Download,
    Clock
} from 'lucide-react';

interface Leave {
    id: number;
    employee: {
        id: number;
        name: string;
        employee_number: string;
        department: string;
    };
    type: string;
    date_from: string;
    date_to: string;
    formatted_date_from: string;
    formatted_date_to: string;
    duration_days: number;
    status: 'pending' | 'approved' | 'rejected' | 'cancelled';
    remarks: string | null;
    document_path: string | null;
    approved_by: {
        id: string;
        name: string;
    } | null;
    created_at: string;
    updated_at: string;
    can_approve: boolean;
    can_edit: boolean;
    can_cancel: boolean;
}

interface Props {
    leave: Leave;
}

export default function LeavesShow({ leave }: Props) {
    const [showApprovalDialog, setShowApprovalDialog] = useState(false);
    const [approvalAction, setApprovalAction] = useState<'approve' | 'reject'>('approve');
    const [approvalRemarks, setApprovalRemarks] = useState('');
    const [showCancelDialog, setShowCancelDialog] = useState(false);
    const [cancelReason, setCancelReason] = useState('');

    const openApprovalDialog = (action: 'approve' | 'reject') => {
        setApprovalAction(action);
        setApprovalRemarks('');
        setShowApprovalDialog(true);
    };

    const handleApproval = () => {
        router.post(route('attendance.leaves.approve'), {
            leave_id: leave.id,
            action: approvalAction,
            remarks: approvalRemarks
        }, {
            onSuccess: () => {
                setShowApprovalDialog(false);
            }
        });
    };

    const handleCancel = () => {
        router.post(route('attendance.leaves.cancel'), {
            leave_id: leave.id,
            reason: cancelReason
        }, {
            onSuccess: () => {
                setShowCancelDialog(false);
            }
        });
    };

    const getStatusBadgeVariant = (status: string) => {
        switch (status) {
            case 'approved':
                return 'default';
            case 'pending':
                return 'secondary';
            case 'rejected':
                return 'destructive';
            case 'cancelled':
                return 'outline';
            default:
                return 'default';
        }
    };

    const getTypeLabel = (type: string) => {
        const types: Record<string, string> = {
            sick: 'Sick Leave',
            vacation: 'Vacation Leave',
            emergency: 'Emergency Leave',
            unpaid: 'Unpaid Leave',
            other: 'Other'
        };
        return types[type] || type;
    };

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Attendance', href: '/attendance/upload' },
                { title: 'Leaves', href: '/attendance/leaves' },
                { title: 'Details', href: '#' },
            ]}
        >
            <Head title="Leave Request Details" />

            <div className="space-y-6 p-6 md:p-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href={route('attendance.leaves.index')}>
                            <Button variant="outline" size="icon">
                                <ArrowLeft className="h-4 w-4" />
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-3xl font-bold">Leave Request Details</h1>
                            <p className="text-muted-foreground mt-1">
                                Leave ID: #{leave.id}
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        {leave.can_edit && (
                            <Link href={route('attendance.leaves.edit', leave.id)}>
                                <Button variant="outline">
                                    <Edit className="mr-2 h-4 w-4" />
                                    Edit
                                </Button>
                            </Link>
                        )}
                        {leave.can_approve && (
                            <>
                                <Button
                                    onClick={() => openApprovalDialog('approve')}
                                    className="bg-green-600 hover:bg-green-700"
                                >
                                    <CheckCircle2 className="mr-2 h-4 w-4" />
                                    Approve
                                </Button>
                                <Button
                                    onClick={() => openApprovalDialog('reject')}
                                    variant="destructive"
                                >
                                    <XCircle className="mr-2 h-4 w-4" />
                                    Reject
                                </Button>
                            </>
                        )}
                        {leave.can_cancel && (
                            <Button
                                onClick={() => setShowCancelDialog(true)}
                                variant="outline"
                                className="text-orange-600 border-orange-600 hover:bg-orange-50"
                            >
                                <Ban className="mr-2 h-4 w-4" />
                                Cancel
                            </Button>
                        )}
                    </div>
                </div>

                <div className="grid gap-6 md:grid-cols-3">
                    {/* Main Content */}
                    <div className="md:col-span-2 space-y-6">
                        {/* Employee Information */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <User className="h-5 w-5" />
                                    Employee Information
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <div className="text-sm text-muted-foreground">Name</div>
                                        <div className="font-medium">{leave.employee.name}</div>
                                    </div>
                                    <div>
                                        <div className="text-sm text-muted-foreground">Employee Number</div>
                                        <div className="font-medium">#{leave.employee.employee_number}</div>
                                    </div>
                                    <div>
                                        <div className="text-sm text-muted-foreground">Department</div>
                                        <div className="font-medium">{leave.employee.department}</div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Leave Details */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Calendar className="h-5 w-5" />
                                    Leave Details
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <div className="text-sm text-muted-foreground">Leave Type</div>
                                        <div className="font-medium">{getTypeLabel(leave.type)}</div>
                                    </div>
                                    <div>
                                        <div className="text-sm text-muted-foreground">Status</div>
                                        <Badge variant={getStatusBadgeVariant(leave.status)} className="mt-1">
                                            {leave.status.toUpperCase()}
                                        </Badge>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <div className="text-sm text-muted-foreground">From Date</div>
                                        <div className="font-medium">{leave.formatted_date_from}</div>
                                    </div>
                                    <div>
                                        <div className="text-sm text-muted-foreground">To Date</div>
                                        <div className="font-medium">{leave.formatted_date_to}</div>
                                    </div>
                                </div>

                                <div>
                                    <div className="text-sm text-muted-foreground">Duration</div>
                                    <div className="font-medium text-lg">
                                        {leave.duration_days} day{leave.duration_days !== 1 ? 's' : ''}
                                    </div>
                                </div>

                                {leave.remarks && (
                                    <div>
                                        <div className="text-sm text-muted-foreground mb-2">Remarks</div>
                                        <div className="p-3 bg-muted/50 text-foreground rounded-md">
                                            {leave.remarks}
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Document */}
                        {leave.document_path && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <FileText className="h-5 w-5" />
                                        Supporting Document
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-md">
                                        <div className="flex items-center gap-3">
                                            <FileText className="h-8 w-8 text-blue-500" />
                                            <div>
                                                <div className="font-medium text-foreground">Attached Document</div>
                                                <div className="text-sm text-muted-foreground">
                                                    {leave.document_path.split('/').pop()}
                                                </div>
                                            </div>
                                        </div>
                                        <a
                                            href={`/storage/${leave.document_path}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                        >
                                            <Button variant="outline" size="sm">
                                                <Download className="mr-2 h-4 w-4" />
                                                Download
                                            </Button>
                                        </a>
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Approval Info */}
                        {leave.approved_by && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-base">Approval Information</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <div>
                                        <div className="text-sm text-muted-foreground">Approved By</div>
                                        <div className="font-medium">{leave.approved_by.name}</div>
                                    </div>
                                    <div>
                                        <div className="text-sm text-muted-foreground">Status</div>
                                        <Badge variant={getStatusBadgeVariant(leave.status)}>
                                            {leave.status.toUpperCase()}
                                        </Badge>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Timeline */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base flex items-center gap-2">
                                    <Clock className="h-4 w-4" />
                                    Timeline
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex gap-3">
                                    <div className="flex flex-col items-center">
                                        <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                                        <div className="w-0.5 h-full bg-gray-200"></div>
                                    </div>
                                    <div className="flex-1 pb-4">
                                        <div className="text-sm font-medium">Submitted</div>
                                        <div className="text-xs text-muted-foreground">
                                            {new Date(leave.created_at).toLocaleString()}
                                        </div>
                                    </div>
                                </div>

                                {leave.status !== 'pending' && (
                                    <div className="flex gap-3">
                                        <div className="flex flex-col items-center">
                                            <div className={`w-2 h-2 rounded-full ${
                                                leave.status === 'approved' ? 'bg-green-500' :
                                                leave.status === 'rejected' ? 'bg-red-500' :
                                                'bg-orange-500'
                                            }`}></div>
                                        </div>
                                        <div className="flex-1">
                                            <div className="text-sm font-medium">
                                                {leave.status.charAt(0).toUpperCase() + leave.status.slice(1)}
                                            </div>
                                            <div className="text-xs text-muted-foreground">
                                                {new Date(leave.updated_at).toLocaleString()}
                                            </div>
                                            {leave.approved_by && (
                                                <div className="text-xs text-muted-foreground mt-1">
                                                    by {leave.approved_by.name}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>

            {/* Approval Dialog */}
            <Dialog open={showApprovalDialog} onOpenChange={setShowApprovalDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {approvalAction === 'approve' ? 'Approve' : 'Reject'} Leave Request
                        </DialogTitle>
                        <DialogDescription>
                            {approvalAction === 'approve' 
                                ? 'Confirm approval of this leave request'
                                : 'Provide a reason for rejecting this leave request'}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="approval_remarks">Remarks (Optional)</Label>
                            <Textarea
                                id="approval_remarks"
                                value={approvalRemarks}
                                onChange={(e) => setApprovalRemarks(e.target.value)}
                                placeholder="Add any comments..."
                                rows={3}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowApprovalDialog(false)}>
                            Cancel
                        </Button>
                        <Button 
                            onClick={handleApproval}
                            variant={approvalAction === 'approve' ? 'default' : 'destructive'}
                        >
                            {approvalAction === 'approve' ? 'Approve' : 'Reject'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Cancel Dialog */}
            <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Cancel Leave Request</DialogTitle>
                        <DialogDescription>
                            Provide a reason for cancelling this leave request
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="cancel_reason">Reason *</Label>
                            <Textarea
                                id="cancel_reason"
                                value={cancelReason}
                                onChange={(e) => setCancelReason(e.target.value)}
                                placeholder="Explain why this leave is being cancelled..."
                                rows={3}
                                required
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowCancelDialog(false)}>
                            Close
                        </Button>
                        <Button 
                            onClick={handleCancel}
                            variant="destructive"
                            disabled={!cancelReason.trim()}
                        >
                            Cancel Leave
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
