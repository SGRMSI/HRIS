import AppLayout from '@/layouts/app-layout';
import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
    Plus,
    Search,
    Eye,
    Edit,
    Trash2,
    Clock,
    CheckCircle2,
    XCircle,
    Ban,
    FileText,
    Calendar,
} from 'lucide-react';

interface Overtime {
    id: number;
    employee: {
        id: number;
        name: string;
        id_number: string;
        department: string;
        company: string;
    };
    overtime_date: string;
    duration: {
        hours: number;
        minutes: number;
        formatted: string;
        total_minutes: number;
    };
    reason: string;
    status: 'pending' | 'approved' | 'rejected' | 'cancelled';
    remarks: string | null;
    has_document: boolean;
    created_by: string;
    approved_by: string | null;
    approved_at: string | null;
    created_at: string;
}

interface Props {
    overtimes: {
        data: Overtime[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
    filters: {
        search?: string;
        status?: string;
        company?: string;
        date_from?: string;
        date_to?: string;
    };
    companies: Array<{ id: number; name: string }>;
}

export default function OvertimesIndex({ overtimes, filters, companies }: Props) {
    const [search, setSearch] = useState(filters.search || '');
    const [status, setStatus] = useState(filters.status || 'all');
    const [company, setCompany] = useState(filters.company || 'all');
    const [dateFrom, setDateFrom] = useState(filters.date_from || '');
    const [dateTo, setDateTo] = useState(filters.date_to || '');
    
    const [approveDialog, setApproveDialog] = useState<Overtime | null>(null);
    const [rejectDialog, setRejectDialog] = useState<Overtime | null>(null);
    const [cancelDialog, setCancelDialog] = useState<Overtime | null>(null);
    const [deleteDialog, setDeleteDialog] = useState<Overtime | null>(null);
    
    const [approveRemarks, setApproveRemarks] = useState('');
    const [rejectRemarks, setRejectRemarks] = useState('');
    const [cancelRemarks, setCancelRemarks] = useState('');
    const [processing, setProcessing] = useState(false);

    const handleFilter = () => {
        router.get(
            route('attendance.overtimes.index'),
            {
                search: search || undefined,
                status: status !== 'all' ? status : undefined,
                company: company !== 'all' ? company : undefined,
                date_from: dateFrom || undefined,
                date_to: dateTo || undefined,
            },
            { preserveState: true, replace: true }
        );
    };

    const handleClearFilters = () => {
        setSearch('');
        setStatus('all');
        setCompany('all');
        setDateFrom('');
        setDateTo('');
        router.get(route('attendance.overtimes.index'), {}, { preserveState: true, replace: true });
    };

    const handleApprove = () => {
        if (!approveDialog) return;
        setProcessing(true);

        router.post(
            route('attendance.overtimes.approve', approveDialog.id),
            { remarks: approveRemarks },
            {
                onSuccess: () => {
                    setApproveDialog(null);
                    setApproveRemarks('');
                    setProcessing(false);
                },
                onError: () => setProcessing(false),
            }
        );
    };

    const handleReject = () => {
        if (!rejectDialog) return;
        setProcessing(true);

        router.post(
            route('attendance.overtimes.reject', rejectDialog.id),
            { remarks: rejectRemarks },
            {
                onSuccess: () => {
                    setRejectDialog(null);
                    setRejectRemarks('');
                    setProcessing(false);
                },
                onError: () => setProcessing(false),
            }
        );
    };

    const handleCancel = () => {
        if (!cancelDialog) return;
        setProcessing(true);

        router.post(
            route('attendance.overtimes.cancel', cancelDialog.id),
            { remarks: cancelRemarks },
            {
                onSuccess: () => {
                    setCancelDialog(null);
                    setCancelRemarks('');
                    setProcessing(false);
                },
                onError: () => setProcessing(false),
            }
        );
    };

    const handleDelete = () => {
        if (!deleteDialog) return;
        setProcessing(true);

        router.delete(route('attendance.overtimes.destroy', deleteDialog.id), {
            onSuccess: () => {
                setDeleteDialog(null);
                setProcessing(false);
            },
            onError: () => setProcessing(false),
        });
    };

    const getStatusBadge = (status: Overtime['status']) => {
        const variants = {
            pending: { variant: 'default' as const, icon: Clock, className: 'bg-yellow-600 hover:bg-yellow-700' },
            approved: { variant: 'default' as const, icon: CheckCircle2, className: 'bg-green-600 hover:bg-green-700' },
            rejected: { variant: 'destructive' as const, icon: XCircle, className: '' },
            cancelled: { variant: 'secondary' as const, icon: Ban, className: '' },
        };

        const config = variants[status];
        const Icon = config.icon;

        return (
            <Badge variant={config.variant} className={config.className}>
                <Icon className="h-3 w-3 mr-1" />
                {status.charAt(0).toUpperCase() + status.slice(1)}
            </Badge>
        );
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Attendance', href: '/attendance/overtimes' },
                { title: 'Overtimes', href: '/attendance/overtimes' },
            ]}
        >
            <Head title="Overtime Requests" />

            <div className="space-y-6 p-6 md:p-4">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold">Overtime Requests</h1>
                        <p className="text-muted-foreground mt-1">
                            Manage employee overtime requests and approvals
                        </p>
                    </div>
                    <Link href={route('attendance.overtimes.create')}>
                        <Button>
                            <Plus className="h-4 w-4 mr-2" />
                            New Overtime Request
                        </Button>
                    </Link>
                </div>

                {/* Filters */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Search className="h-5 w-5" />
                            Search & Filter
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
                            <div className="lg:col-span-2">
                                <Label htmlFor="search">Search</Label>
                                <Input
                                    id="search"
                                    placeholder="Employee name, ID, or reason..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && handleFilter()}
                                />
                            </div>
                            <div>
                                <Label htmlFor="company">Company</Label>
                                <Select value={company} onValueChange={setCompany}>
                                    <SelectTrigger id="company">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Companies</SelectItem>
                                        {companies.map((comp) => (
                                            <SelectItem key={comp.id} value={comp.id.toString()}>
                                                {comp.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label htmlFor="status">Status</Label>
                                <Select value={status} onValueChange={setStatus}>
                                    <SelectTrigger id="status">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Status</SelectItem>
                                        <SelectItem value="pending">Pending</SelectItem>
                                        <SelectItem value="approved">Approved</SelectItem>
                                        <SelectItem value="rejected">Rejected</SelectItem>
                                        <SelectItem value="cancelled">Cancelled</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label htmlFor="date_from">Date From</Label>
                                <Input
                                    id="date_from"
                                    type="date"
                                    value={dateFrom}
                                    onChange={(e) => setDateFrom(e.target.value)}
                                />
                            </div>
                            <div>
                                <Label htmlFor="date_to">Date To</Label>
                                <Input
                                    id="date_to"
                                    type="date"
                                    value={dateTo}
                                    onChange={(e) => setDateTo(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <Button onClick={handleFilter}>
                                <Search className="h-4 w-4 mr-2" />
                                Apply Filters
                            </Button>
                            <Button variant="outline" onClick={handleClearFilters}>
                                Clear
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Overtime List */}
                <Card>
                    <CardHeader>
                        <CardTitle>
                            Overtime Requests
                            <span className="text-sm font-normal text-muted-foreground ml-2">
                                ({overtimes.total} total)
                            </span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {overtimes.data.length === 0 ? (
                            <Alert>
                                <AlertDescription>
                                    No overtime requests found. Try adjusting your filters or create a new request.
                                </AlertDescription>
                            </Alert>
                        ) : (
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Employee</TableHead>
                                            <TableHead>Company</TableHead>
                                            <TableHead>Date</TableHead>
                                            <TableHead>Duration</TableHead>
                                            <TableHead>Reason</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Document</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {overtimes.data.map((overtime) => (
                                            <TableRow key={overtime.id}>
                                                <TableCell>
                                                    <div>
                                                        <div className="font-medium">{overtime.employee.name}</div>
                                                        <div className="text-sm text-muted-foreground">
                                                            #{overtime.employee.id_number}
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div>
                                                        <div className="font-medium">{overtime.employee.company}</div>
                                                        <div className="text-sm text-muted-foreground">
                                                            {overtime.employee.department}
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-1">
                                                        <Calendar className="h-4 w-4 text-muted-foreground" />
                                                        {formatDate(overtime.overtime_date)}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-1">
                                                        <Clock className="h-4 w-4 text-muted-foreground" />
                                                        {overtime.duration.formatted}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="max-w-xs truncate" title={overtime.reason}>
                                                        {overtime.reason}
                                                    </div>
                                                </TableCell>
                                                <TableCell>{getStatusBadge(overtime.status)}</TableCell>
                                                <TableCell>
                                                    {overtime.has_document ? (
                                                        <FileText className="h-4 w-4 text-blue-600" />
                                                    ) : (
                                                        <span className="text-muted-foreground text-sm">—</span>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <Link href={route('attendance.overtimes.show', overtime.id)}>
                                                            <Button variant="ghost" size="sm">
                                                                <Eye className="h-4 w-4" />
                                                            </Button>
                                                        </Link>

                                                        {overtime.status === 'pending' && (
                                                            <>
                                                                <Link
                                                                    href={route('attendance.overtimes.edit', overtime.id)}
                                                                >
                                                                    <Button variant="ghost" size="sm">
                                                                        <Edit className="h-4 w-4" />
                                                                    </Button>
                                                                </Link>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={() => setApproveDialog(overtime)}
                                                                    className="text-green-600 hover:text-green-700"
                                                                >
                                                                    <CheckCircle2 className="h-4 w-4" />
                                                                </Button>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={() => setRejectDialog(overtime)}
                                                                    className="text-red-600 hover:text-red-700"
                                                                >
                                                                    <XCircle className="h-4 w-4" />
                                                                </Button>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={() => setDeleteDialog(overtime)}
                                                                    className="text-red-600 hover:text-red-700"
                                                                >
                                                                    <Trash2 className="h-4 w-4" />
                                                                </Button>
                                                            </>
                                                        )}

                                                        {overtime.status === 'approved' && (
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => setCancelDialog(overtime)}
                                                                className="text-orange-600 hover:text-orange-700"
                                                            >
                                                                <Ban className="h-4 w-4" />
                                                            </Button>
                                                        )}

                                                        {(overtime.status === 'rejected' ||
                                                            overtime.status === 'cancelled') && (
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => setDeleteDialog(overtime)}
                                                                className="text-red-600 hover:text-red-700"
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        )}
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        )}

                        {/* Pagination */}
                        {overtimes.last_page > 1 && (
                            <div className="mt-6 flex items-center justify-between">
                                <div className="text-sm text-muted-foreground">
                                    Showing {(overtimes.current_page - 1) * overtimes.per_page + 1} to{' '}
                                    {Math.min(overtimes.current_page * overtimes.per_page, overtimes.total)} of{' '}
                                    {overtimes.total} requests
                                </div>
                                <div className="flex gap-2">
                                    {overtimes.current_page > 1 && (
                                        <Button
                                            variant="outline"
                                            onClick={() =>
                                                router.get(
                                                    route('attendance.overtimes.index'),
                                                    {
                                                        ...filters,
                                                        page: overtimes.current_page - 1,
                                                    },
                                                    { preserveState: true }
                                                )
                                            }
                                        >
                                            Previous
                                        </Button>
                                    )}
                                    {overtimes.current_page < overtimes.last_page && (
                                        <Button
                                            variant="outline"
                                            onClick={() =>
                                                router.get(
                                                    route('attendance.overtimes.index'),
                                                    {
                                                        ...filters,
                                                        page: overtimes.current_page + 1,
                                                    },
                                                    { preserveState: true }
                                                )
                                            }
                                        >
                                            Next
                                        </Button>
                                    )}
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Approve Dialog */}
            <Dialog open={!!approveDialog} onOpenChange={() => setApproveDialog(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Approve Overtime Request</DialogTitle>
                        <DialogDescription>
                            Approve overtime for {approveDialog?.employee.name} on{' '}
                            {approveDialog && formatDate(approveDialog.overtime_date)}?
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="approve-remarks">Remarks (Optional)</Label>
                            <Textarea
                                id="approve-remarks"
                                placeholder="Add approval remarks..."
                                value={approveRemarks}
                                onChange={(e) => setApproveRemarks(e.target.value)}
                                rows={3}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setApproveDialog(null)} disabled={processing}>
                            Cancel
                        </Button>
                        <Button onClick={handleApprove} disabled={processing} className="bg-green-600 hover:bg-green-700">
                            {processing ? 'Approving...' : 'Approve'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Reject Dialog */}
            <Dialog open={!!rejectDialog} onOpenChange={() => setRejectDialog(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Reject Overtime Request</DialogTitle>
                        <DialogDescription>
                            Reject overtime for {rejectDialog?.employee.name} on{' '}
                            {rejectDialog && formatDate(rejectDialog.overtime_date)}?
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="reject-remarks">Reason for Rejection *</Label>
                            <Textarea
                                id="reject-remarks"
                                placeholder="Provide reason for rejection..."
                                value={rejectRemarks}
                                onChange={(e) => setRejectRemarks(e.target.value)}
                                rows={3}
                                required
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setRejectDialog(null)} disabled={processing}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handleReject}
                            disabled={processing || !rejectRemarks}
                            variant="destructive"
                        >
                            {processing ? 'Rejecting...' : 'Reject'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Cancel Dialog */}
            <Dialog open={!!cancelDialog} onOpenChange={() => setCancelDialog(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Cancel Overtime Request</DialogTitle>
                        <DialogDescription>
                            Cancel approved overtime for {cancelDialog?.employee.name} on{' '}
                            {cancelDialog && formatDate(cancelDialog.overtime_date)}?
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="cancel-remarks">Reason for Cancellation *</Label>
                            <Textarea
                                id="cancel-remarks"
                                placeholder="Provide reason for cancellation..."
                                value={cancelRemarks}
                                onChange={(e) => setCancelRemarks(e.target.value)}
                                rows={3}
                                required
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setCancelDialog(null)} disabled={processing}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handleCancel}
                            disabled={processing || !cancelRemarks}
                            className="bg-orange-600 hover:bg-orange-700"
                        >
                            {processing ? 'Cancelling...' : 'Cancel Overtime'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Dialog */}
            <AlertDialog open={!!deleteDialog} onOpenChange={() => setDeleteDialog(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Overtime Request</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete this overtime request for{' '}
                            {deleteDialog?.employee.name}? This action cannot be undone.
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
