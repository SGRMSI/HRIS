import AppLayout from '@/layouts/app-layout';
import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { 
    Plus, 
    Search, 
    Eye,
    CheckCircle2, 
    XCircle,
    Calendar,
    Ban,
    Trash2,
    FileText,
    Clock
} from 'lucide-react';

interface Leave {
    id: number;
    employee: {
        id: number;
        name: string;
        employee_number: string;
        department: string;
        company: string;
    };
    type: string;
    date_from: string;
    date_to: string;
    duration_days: number;
    status: 'pending' | 'approved' | 'rejected' | 'cancelled';
    remarks: string | null;
    has_document: boolean;
    approved_by: string | null;
    approved_at: string;
    can_approve: boolean;
    can_cancel: boolean;
    can_delete: boolean;
}

interface Company {
    id: number;
    name: string;
}

interface StatusOption {
    value: string;
    label: string;
}

interface TypeOption {
    value: string;
    label: string;
}

interface Props {
    leaves: {
        data: Leave[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
    filters: {
        status?: string;
        type?: string;
        employee_search?: string;
        company_id?: number;
        date_from?: string;
        date_to?: string;
    };
    companies: Company[];
    statuses: StatusOption[];
    types: TypeOption[];
    departmentGroups?: Record<string, { count: number; employees: number; total_days: number }>;
}

export default function LeavesIndex({ 
    leaves, 
    filters = {}, 
    companies = [],
    statuses = [],
    types = []
}: Props) {
    const [searchTerm, setSearchTerm] = useState(filters.employee_search || '');
    const [showApprovalDialog, setShowApprovalDialog] = useState(false);
    const [selectedLeave, setSelectedLeave] = useState<Leave | null>(null);
    const [approvalAction, setApprovalAction] = useState<'approve' | 'reject'>('approve');
    const [approvalRemarks, setApprovalRemarks] = useState('');
    const [showCancelDialog, setShowCancelDialog] = useState(false);
    const [cancelReason, setCancelReason] = useState('');
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);

    const handleFilter = (key: string, value: string | number) => {
        const filterValue = value === 'all' || value === '' ? undefined : value;
        router.get(
            route('attendance.leaves.index'),
            { ...filters, [key]: filterValue },
            { preserveState: true }
        );
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        handleFilter('employee_search', searchTerm);
    };

    const openApprovalDialog = (leave: Leave, action: 'approve' | 'reject') => {
        setSelectedLeave(leave);
        setApprovalAction(action);
        setApprovalRemarks('');
        setShowApprovalDialog(true);
    };

    const handleApproval = () => {
        if (!selectedLeave) return;

        router.post(route('attendance.leaves.approve'), {
            leave_id: selectedLeave.id,
            action: approvalAction,
            remarks: approvalRemarks
        }, {
            onSuccess: () => {
                setShowApprovalDialog(false);
                setSelectedLeave(null);
                setApprovalRemarks('');
            }
        });
    };

    const openCancelDialog = (leave: Leave) => {
        setSelectedLeave(leave);
        setCancelReason('');
        setShowCancelDialog(true);
    };

    const handleCancel = () => {
        if (!selectedLeave) return;

        router.post(route('attendance.leaves.cancel'), {
            leave_id: selectedLeave.id,
            reason: cancelReason
        }, {
            onSuccess: () => {
                setShowCancelDialog(false);
                setSelectedLeave(null);
                setCancelReason('');
            }
        });
    };

    const openDeleteDialog = (leave: Leave) => {
        setSelectedLeave(leave);
        setShowDeleteDialog(true);
    };

    const handleDelete = () => {
        if (!selectedLeave) return;

        router.delete(route('attendance.leaves.destroy', selectedLeave.id), {
            onSuccess: () => {
                setShowDeleteDialog(false);
                setSelectedLeave(null);
            }
        });
    };

    const getStatusBadge = (status: Leave['status']) => {
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

    const getTypeBadgeVariant = (type: string) => {
        switch (type) {
            case 'sick':
                return 'destructive';
            case 'vacation':
                return 'default';
            case 'emergency':
                return 'secondary';
            default:
                return 'outline';
        }
    };

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Attendance', href: '/attendance/upload' },
                { title: 'Leaves', href: '#' }
            ]}
        >
            <Head title="Leave Management" />

            <div className="space-y-6 p-6 md:p-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold">Leave Management</h1>
                        <p className="text-muted-foreground mt-1">Manage employee leave requests</p>
                    </div>
                    <Link href={route('attendance.leaves.create')}>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            New Leave Request
                        </Button>
                    </Link>
                </div>

                {/* Filters */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Filters</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-4 md:grid-cols-5">
                            {/* Status Filter */}
                            <div className="space-y-2">
                                <Label>Status</Label>
                                <Select
                                    value={filters.status || 'all'}
                                    onValueChange={(value) => handleFilter('status', value)}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="All Statuses" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Statuses</SelectItem>
                                        {statuses.map((status) => (
                                            <SelectItem key={status.value} value={status.value}>
                                                {status.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Type Filter */}
                            <div className="space-y-2">
                                <Label>Leave Type</Label>
                                <Select
                                    value={filters.type || 'all'}
                                    onValueChange={(value) => handleFilter('type', value)}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="All Types" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Types</SelectItem>
                                        {types.map((type) => (
                                            <SelectItem key={type.value} value={type.value}>
                                                {type.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Company Filter */}
                            <div className="space-y-2">
                                <Label>Company</Label>
                                <Select
                                    value={filters.company_id?.toString() || 'all'}
                                    onValueChange={(value) => handleFilter('company_id', value)}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="All Companies" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Companies</SelectItem>
                                        {Array.isArray(companies) && companies
                                            .filter(company => company && company.id != null)
                                            .map((company) => (
                                                <SelectItem key={company.id} value={company.id.toString()}>
                                                    {company.name}
                                                </SelectItem>
                                            ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Date From */}
                            <div className="space-y-2">
                                <Label>From Date</Label>
                                <Input
                                    type="date"
                                    value={filters.date_from || ''}
                                    onChange={(e) => handleFilter('date_from', e.target.value)}
                                />
                            </div>

                            {/* Date To */}
                            <div className="space-y-2">
                                <Label>To Date</Label>
                                <Input
                                    type="date"
                                    value={filters.date_to || ''}
                                    onChange={(e) => handleFilter('date_to', e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Search */}
                        <div className="mt-4">
                            <Label>Search Employee</Label>
                            <form onSubmit={handleSearch} className="flex gap-2 mt-2">
                                <Input
                                    placeholder="Name or employee number..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="flex-1"
                                />
                                <Button type="submit" variant="outline">
                                    <Search className="h-4 w-4" />
                                </Button>
                            </form>
                        </div>
                    </CardContent>
                </Card>

                {/* Leaves Table */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Calendar className="h-5 w-5" />
                            Leave Requests
                            <Badge variant="secondary" className="ml-auto">
                                {leaves.total} total
                            </Badge>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Company</TableHead>
                                    <TableHead>Employee</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Period</TableHead>
                                    <TableHead>Duration</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Document</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {leaves.data.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                                            No leave requests found
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    leaves.data.map((leave) => (
                                        <TableRow key={leave.id}>
                                            <TableCell>
                                                <div className="font-medium">{leave.employee.company}</div>
                                            </TableCell>
                                            <TableCell>
                                                <div>
                                                    <div className="font-medium">{leave.employee.name}</div>
                                                    <div className="text-sm text-muted-foreground">
                                                        {leave.employee.department} - #{leave.employee.employee_number}
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={getTypeBadgeVariant(leave.type)}>
                                                    {types.find(t => t.value === leave.type)?.label || leave.type}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <div className="text-sm">
                                                    {new Date(leave.date_from).toLocaleDateString()} -<br />
                                                    {new Date(leave.date_to).toLocaleDateString()}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <span className="font-medium">{leave.duration_days}</span> day{leave.duration_days !== 1 ? 's' : ''}
                                            </TableCell>
                                            <TableCell>
                                                {getStatusBadge(leave.status)}
                                            </TableCell>
                                            <TableCell>
                                                {leave.has_document ? (
                                                    <FileText className="h-4 w-4 text-blue-600" />
                                                ) : (
                                                    <span className="text-muted-foreground text-sm">—</span>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Link href={route('attendance.leaves.show', leave.id)}>
                                                        <Button variant="ghost" size="icon">
                                                            <Eye className="h-4 w-4" />
                                                        </Button>
                                                    </Link>
                                                    {leave.can_approve && (
                                                        <>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() => openApprovalDialog(leave, 'approve')}
                                                                className="text-green-600 hover:text-green-700"
                                                            >
                                                                <CheckCircle2 className="h-4 w-4" />
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() => openApprovalDialog(leave, 'reject')}
                                                                className="text-red-600 hover:text-red-700"
                                                            >
                                                                <XCircle className="h-4 w-4" />
                                                            </Button>
                                                        </>
                                                    )}
                                                    {leave.can_cancel && (
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => openCancelDialog(leave)}
                                                            className="text-orange-600 hover:text-orange-700"
                                                        >
                                                            <Ban className="h-4 w-4" />
                                                        </Button>
                                                    )}
                                                    {leave.can_delete && (
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => openDeleteDialog(leave)}
                                                            className="text-red-600 hover:text-red-700"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    )}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>

                        {/* Pagination */}
                        {leaves.last_page > 1 && (
                            <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
                                <div>
                                    Showing {((leaves.current_page - 1) * leaves.per_page) + 1} to{' '}
                                    {Math.min(leaves.current_page * leaves.per_page, leaves.total)} of{' '}
                                    {leaves.total} leaves
                                </div>
                                <div className="flex gap-2">
                                    {Array.from({ length: leaves.last_page }, (_, i) => i + 1).map((page) => (
                                        <Button
                                            key={page}
                                            variant={page === leaves.current_page ? 'default' : 'outline'}
                                            size="sm"
                                            onClick={() => router.get(route('attendance.leaves.index', { ...filters, page }))}
                                        >
                                            {page}
                                        </Button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
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
                    {selectedLeave && (
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <div className="text-sm font-medium">Employee</div>
                                <div>{selectedLeave.employee.name}</div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <div className="text-sm font-medium">Type</div>
                                    <div>{types.find(t => t.value === selectedLeave.type)?.label}</div>
                                </div>
                                <div className="space-y-2">
                                    <div className="text-sm font-medium">Duration</div>
                                    <div>{selectedLeave.duration_days} day(s)</div>
                                </div>
                            </div>
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
                    )}
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
                    {selectedLeave && (
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <div className="text-sm font-medium">Employee</div>
                                <div>{selectedLeave.employee.name}</div>
                            </div>
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
                    )}
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

            {/* Delete Dialog */}
            <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Leave Request</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to permanently delete this leave request?
                        </DialogDescription>
                    </DialogHeader>
                    {selectedLeave && (
                        <div className="space-y-4 py-4">
                            <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg space-y-2">
                                <div className="flex items-center gap-2 text-destructive font-medium">
                                    <Trash2 className="h-4 w-4" />
                                    Warning: This action cannot be undone
                                </div>
                                <div className="text-sm">
                                    This will permanently delete the leave request for <strong>{selectedLeave.employee.name}</strong> from <strong>{selectedLeave.date_from}</strong> to <strong>{selectedLeave.date_to}</strong>.
                                </div>
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
                            Cancel
                        </Button>
                        <Button 
                            onClick={handleDelete}
                            variant="destructive"
                        >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete Permanently
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Dialog */}
            <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Leave Request</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to permanently delete this leave request?
                        </DialogDescription>
                    </DialogHeader>
                    {selectedLeave && (
                        <div className="space-y-4 py-4">
                            <div className="p-4 bg-destructive/10 rounded-lg border border-destructive/20">
                                <div className="space-y-2">
                                    <div className="text-sm font-medium">Employee</div>
                                    <div>{selectedLeave.employee.name}</div>
                                </div>
                                <div className="space-y-2 mt-2">
                                    <div className="text-sm font-medium">Period</div>
                                    <div className="text-sm">
                                        {new Date(selectedLeave.date_from).toLocaleDateString()} - {new Date(selectedLeave.date_to).toLocaleDateString()}
                                    </div>
                                </div>
                            </div>
                            <div className="text-sm text-muted-foreground">
                                This action cannot be undone. This will permanently delete the leave request and any attached documents.
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
                            Cancel
                        </Button>
                        <Button 
                            onClick={handleDelete}
                            variant="destructive"
                        >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete Permanently
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
