import React, { useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { Head, router } from '@inertiajs/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Calendar, Clock, User, Building2, Briefcase, FileText, Download, CheckCircle2, XCircle, Ban, Edit, Trash2 } from 'lucide-react';

interface Employee {
    employee_id: number;
    first_name: string;
    last_name: string;
    id_number: string;
    department: {
        department_id: number;
        department_name: string;
    } | null;
    company: {
        company_id: number;
        company_name: string;
    } | null;
    position?: string;
}

interface User {
    user_id: number;
    name: string;
}

interface Overtime {
    overtime_id: number;
    employee_id: number;
    overtime_date: string;
    duration_hours: number;
    duration_minutes: number;
    reason: string;
    status: 'pending' | 'approved' | 'rejected' | 'cancelled';
    remarks: string | null;
    document_path: string | null;
    created_by: User | null;
    approved_by: User | null;
    approved_at: string | null;
    created_at: string;
    updated_at: string;
    employee: Employee;
    formatted_duration: string;
    total_minutes: number;
}

interface Props {
    overtime: Overtime;
}

export default function Show({ overtime }: Props) {
    const [approveDialogOpen, setApproveDialogOpen] = useState(false);
    const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
    const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [remarks, setRemarks] = useState('');
    const [processing, setProcessing] = useState(false);

    const getStatusBadge = (status: string) => {
        const config = {
            pending: { label: 'Pending', className: 'bg-yellow-500', icon: Clock },
            approved: { label: 'Approved', className: 'bg-green-500', icon: CheckCircle2 },
            rejected: { label: 'Rejected', className: 'bg-red-500', icon: XCircle },
            cancelled: { label: 'Cancelled', className: 'bg-gray-500', icon: Ban },
        };

        const { label, className, icon: Icon } = config[status as keyof typeof config];
        return (
            <Badge className={`${className} text-white`}>
                <Icon className="mr-1 h-3 w-3" />
                {label}
            </Badge>
        );
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    const formatTimestamp = (dateString: string) => {
        return new Date(dateString).toLocaleString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const handleApprove = () => {
        setProcessing(true);
        router.post(
            route('attendance.overtimes.approve', overtime.overtime_id),
            { remarks },
            {
                onFinish: () => {
                    setProcessing(false);
                    setApproveDialogOpen(false);
                    setRemarks('');
                },
            }
        );
    };

    const handleReject = () => {
        if (!remarks.trim()) return;
        setProcessing(true);
        router.post(
            route('attendance.overtimes.reject', overtime.overtime_id),
            { remarks },
            {
                onFinish: () => {
                    setProcessing(false);
                    setRejectDialogOpen(false);
                    setRemarks('');
                },
            }
        );
    };

    const handleCancel = () => {
        if (!remarks.trim()) return;
        setProcessing(true);
        router.post(
            route('attendance.overtimes.cancel', overtime.overtime_id),
            { remarks },
            {
                onFinish: () => {
                    setProcessing(false);
                    setCancelDialogOpen(false);
                    setRemarks('');
                },
            }
        );
    };

    const handleDelete = () => {
        setProcessing(true);
        router.delete(route('attendance.overtimes.destroy', overtime.overtime_id), {
            onFinish: () => {
                setProcessing(false);
                setDeleteDialogOpen(false);
            },
        });
    };

    const handleDownloadDocument = () => {
        window.location.href = route('attendance.overtimes.download', overtime.overtime_id);
    };

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Attendance', href: '/attendance/upload' },
                { title: 'Overtimes', href: '/attendance/overtimes' },
                { title: 'Details', href: '#' },
            ]}
        >
            <Head title="Overtime Details" />

            <div className="space-y-6 p-6 md:p-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => router.visit(route('attendance.overtimes.index'))}
                        >
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                        <div>
                            <h1 className="text-3xl font-bold">Overtime Details</h1>
                            <p className="text-muted-foreground mt-1">
                                Overtime ID: #{overtime.overtime_id}
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        {overtime.status === 'pending' && (
                            <>
                                <Button
                                    onClick={() => router.visit(route('attendance.overtimes.edit', overtime.overtime_id))}
                                    variant="outline"
                                >
                                    <Edit className="mr-2 h-4 w-4" />
                                    Edit
                                </Button>
                                <Button
                                    onClick={() => setApproveDialogOpen(true)}
                                    className="bg-green-600 hover:bg-green-700"
                                >
                                    <CheckCircle2 className="mr-2 h-4 w-4" />
                                    Approve
                                </Button>
                                <Button
                                    onClick={() => setRejectDialogOpen(true)}
                                    variant="destructive"
                                >
                                    <XCircle className="mr-2 h-4 w-4" />
                                    Reject
                                </Button>
                                <Button
                                    onClick={() => setDeleteDialogOpen(true)}
                                    variant="outline"
                                    className="text-red-600 border-red-600 hover:bg-red-50"
                                >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete
                                </Button>
                            </>
                        )}
                        {overtime.status === 'approved' && (
                            <Button
                                onClick={() => setCancelDialogOpen(true)}
                                variant="outline"
                                className="text-orange-600 border-orange-600 hover:bg-orange-50"
                            >
                                <Ban className="mr-2 h-4 w-4" />
                                Cancel
                            </Button>
                        )}
                        {(overtime.status === 'rejected' || overtime.status === 'cancelled') && (
                            <Button
                                onClick={() => setDeleteDialogOpen(true)}
                                variant="outline"
                                className="text-red-600 border-red-600 hover:bg-red-50"
                            >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
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
                                        <div className="font-medium">
                                            {overtime.employee.first_name} {overtime.employee.last_name}
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-sm text-muted-foreground">ID Number</div>
                                        <div className="font-medium">#{overtime.employee.id_number}</div>
                                    </div>
                                    <div>
                                        <div className="text-sm text-muted-foreground">Company</div>
                                        <div className="font-medium">
                                            {overtime.employee.company?.company_name || 'N/A'}
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-sm text-muted-foreground">Department</div>
                                        <div className="font-medium">
                                            {overtime.employee.department?.department_name || 'N/A'}
                                        </div>
                                    </div>
                                    {overtime.employee.position && (
                                        <div>
                                            <div className="text-sm text-muted-foreground">Position</div>
                                            <div className="font-medium">{overtime.employee.position}</div>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Overtime Details */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Clock className="h-5 w-5" />
                                    Overtime Details
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <div className="text-sm text-muted-foreground">Overtime Date</div>
                                        <div className="font-medium">{formatDate(overtime.overtime_date)}</div>
                                    </div>
                                    <div>
                                        <div className="text-sm text-muted-foreground">Duration</div>
                                        <div className="font-medium">
                                            {overtime.formatted_duration} ({overtime.total_minutes} minutes)
                                        </div>
                                    </div>
                                    <div className="col-span-2">
                                        <div className="text-sm text-muted-foreground">Reason</div>
                                        <div className="font-medium mt-1 whitespace-pre-wrap">{overtime.reason}</div>
                                    </div>
                                    {overtime.remarks && (
                                        <div className="col-span-2">
                                            <div className="text-sm text-muted-foreground">Remarks</div>
                                            <div className="font-medium mt-1 whitespace-pre-wrap text-gray-600">
                                                {overtime.remarks}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Document */}
                        {overtime.document_path && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-base">Supporting Document</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-blue-50 rounded-lg">
                                                <FileText className="h-5 w-5 text-blue-600" />
                                            </div>
                                            <div>
                                                <div className="font-medium text-foreground">Attached Document</div>
                                                <div className="text-sm text-muted-foreground">
                                                    {overtime.document_path.split('/').pop()}
                                                </div>
                                            </div>
                                        </div>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={handleDownloadDocument}
                                        >
                                            <Download className="mr-2 h-4 w-4" />
                                            Download
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Status Card */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Status</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {getStatusBadge(overtime.status)}
                            </CardContent>
                        </Card>

                        {/* Approval Info */}
                        {overtime.approved_by && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-base">
                                        {overtime.status === 'approved' ? 'Approval' : 
                                         overtime.status === 'rejected' ? 'Rejection' : 
                                         'Cancellation'} Information
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <div>
                                        <div className="text-sm text-muted-foreground">
                                            {overtime.status === 'approved' ? 'Approved By' : 
                                             overtime.status === 'rejected' ? 'Rejected By' : 
                                             'Cancelled By'}
                                        </div>
                                        <div className="font-medium">{overtime.approved_by.name}</div>
                                    </div>
                                    {overtime.approved_at && (
                                        <div>
                                            <div className="text-sm text-muted-foreground">Date</div>
                                            <div className="font-medium">{formatTimestamp(overtime.approved_at)}</div>
                                        </div>
                                    )}
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
                                            {formatTimestamp(overtime.created_at)}
                                        </div>
                                        {overtime.created_by && (
                                            <div className="text-xs text-muted-foreground mt-1">
                                                by {overtime.created_by.name}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {overtime.status !== 'pending' && (
                                    <div className="flex gap-3">
                                        <div className="flex flex-col items-center">
                                            <div className={`w-2 h-2 rounded-full ${
                                                overtime.status === 'approved' ? 'bg-green-500' :
                                                overtime.status === 'rejected' ? 'bg-red-500' :
                                                'bg-orange-500'
                                            }`}></div>
                                        </div>
                                        <div className="flex-1">
                                            <div className="text-sm font-medium">
                                                {overtime.status.charAt(0).toUpperCase() + overtime.status.slice(1)}
                                            </div>
                                            <div className="text-xs text-muted-foreground">
                                                {overtime.approved_at && formatTimestamp(overtime.approved_at)}
                                            </div>
                                            {overtime.approved_by && (
                                                <div className="text-xs text-muted-foreground mt-1">
                                                    by {overtime.approved_by.name}
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

            {/* Approve Dialog */}
            <Dialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Approve Overtime</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to approve this overtime request?
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="approve-remarks">Remarks (Optional)</Label>
                            <Textarea
                                id="approve-remarks"
                                placeholder="Enter any additional remarks..."
                                value={remarks}
                                onChange={(e) => setRemarks(e.target.value)}
                                rows={3}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setApproveDialogOpen(false);
                                setRemarks('');
                            }}
                            disabled={processing}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleApprove}
                            disabled={processing}
                            className="bg-green-600 hover:bg-green-700"
                        >
                            {processing ? 'Approving...' : 'Approve'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Reject Dialog */}
            <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Reject Overtime</DialogTitle>
                        <DialogDescription>
                            Please provide a reason for rejecting this overtime request.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="reject-remarks">Remarks (Required) *</Label>
                            <Textarea
                                id="reject-remarks"
                                placeholder="Enter reason for rejection..."
                                value={remarks}
                                onChange={(e) => setRemarks(e.target.value)}
                                rows={3}
                                required
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setRejectDialogOpen(false);
                                setRemarks('');
                            }}
                            disabled={processing}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleReject}
                            disabled={processing || !remarks.trim()}
                            variant="destructive"
                        >
                            {processing ? 'Rejecting...' : 'Reject'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Cancel Dialog */}
            <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Cancel Approval</DialogTitle>
                        <DialogDescription>
                            Please provide a reason for cancelling this approved overtime.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="cancel-remarks">Remarks (Required) *</Label>
                            <Textarea
                                id="cancel-remarks"
                                placeholder="Enter reason for cancellation..."
                                value={remarks}
                                onChange={(e) => setRemarks(e.target.value)}
                                rows={3}
                                required
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setCancelDialogOpen(false);
                                setRemarks('');
                            }}
                            disabled={processing}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleCancel}
                            disabled={processing || !remarks.trim()}
                            variant="destructive"
                        >
                            {processing ? 'Cancelling...' : 'Cancel Approval'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Dialog */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the overtime record.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={processing}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            disabled={processing}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            {processing ? 'Deleting...' : 'Delete'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </AppLayout>
    );
}
