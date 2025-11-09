import { useState, useEffect } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { 
    CheckCircle2, 
    XCircle, 
    Clock, 
    Calendar,
    User,
    Filter,
    Download,
    Eye,
    CheckSquare,
    AlertCircle,
    Building2,
    Edit,
    Square,
    CheckCheck
} from 'lucide-react';

interface Employee {
    id: number;
    name: string;
    id_number: string;
    company: string | null;
    department: string | null;
}

interface Shift {
    name: string;
    time_in: string;
    time_out: string;
}

interface AttendanceRecord {
    id: number;
    employee: Employee;
    date: string;
    shift: Shift | null;
    clock_in: string | null;
    clock_out: string | null;
    break_in: string | null;
    break_out: string | null;
    break_minutes: number | null;
    total_hours: number | null;
    total_minutes: number | null;
    late_minutes: number | null;
    overtime_hours: string;
    undertime_hours: string;
    status: string;
    is_holiday: boolean;
    remarks: string | null;
    approved_by: string | null;
    approved_at: string | null;
    can_edit: boolean;
    can_approve: boolean;
}

interface Company {
    id: number;
    name: string;
}

interface EmployeeOption {
    id: number;
    name: string;
    company_id: number;
}

interface Status {
    value: string;
    label: string;
}

interface Props {
    attendances: {
        data: AttendanceRecord[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
        links: Array<{
            url: string | null;
            label: string;
            active: boolean;
        }>;
    };
    pendingCount: number;
    filteredPendingCount: number;
    filters: {
        search?: string;
        date_from?: string;
        date_to?: string;
        status?: string;
        company_id?: number;
        employee_id?: number;
    };
    companies: Company[];
    employees: EmployeeOption[];
    statuses: Status[];
}

function getStatusBadge(status: string, approved: boolean) {
    if (approved) {
        return <Badge variant="default" className="bg-green-600">Approved</Badge>;
    }

    switch (status.toLowerCase()) {
        case 'present':
            return <Badge variant="default">Present</Badge>;
        case 'absent':
            return <Badge variant="destructive">Absent</Badge>;
        case 'leave':
            return <Badge variant="outline" className="border-blue-600 text-blue-600">On Leave</Badge>;
        case 'holiday':
            return <Badge variant="outline" className="border-purple-600 text-purple-600">Holiday</Badge>;
        default:
            return <Badge variant="secondary">{status}</Badge>;
    }
}

export default function FinalIndex({ attendances, pendingCount, filteredPendingCount, filters = {}, companies = [], employees = [], statuses = [] }: Props) {
    const { flash } = usePage().props as any;
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [bulkProcessing, setBulkProcessing] = useState(false);
    const [showApproveModal, setShowApproveModal] = useState(false);
    const [approvalType, setApprovalType] = useState<'bulk' | 'single'>('bulk');
    const [singleApprovalId, setSingleApprovalId] = useState<number | null>(null);

    // Show toast notifications
    useEffect(() => {
        if (flash?.success) {
            toast.success(flash.success);
        }
        if (flash?.error) {
            toast.error(flash.error);
        }
    }, [flash]);

    // Filter employees based on selected company
    const filteredEmployees = filters.company_id 
        ? employees.filter(emp => emp.company_id === filters.company_id)
        : employees;

    // Determine which count to show (use filtered if filters are active, otherwise use total)
    const hasActiveFilters = !!(filters.search || filters.date_from || filters.date_to || 
                                 filters.status || filters.company_id || filters.employee_id);
    const displayPendingCount = hasActiveFilters ? filteredPendingCount : pendingCount;

    const handleFilter = (key: string, value: string) => {
        const filterValue = value === 'all' ? undefined : value;
        router.get(
            route('attendance.final.index'),
            { ...filters, [key]: filterValue || undefined },
            { preserveState: true, replace: true }
        );
    };

    const handleSelectAllPending = () => {
        const pendingIds = attendances.data
            .filter(a => !a.approved_by && a.can_approve)
            .map(a => a.id);
        setSelectedIds(pendingIds);
    };

    const handleSelectAllPendingAcrossPages = () => {
        // Fetch all pending IDs across all pages
        router.get(
            route('attendance.final.index'),
            { 
                ...filters, 
                get_all_pending_ids: true 
            },
            {
                preserveState: true,
                only: ['pendingIds'],
                onSuccess: (page: any) => {
                    if (page.props.pendingIds) {
                        setSelectedIds(page.props.pendingIds);
                    }
                }
            }
        );
    };

    const handleDeselectAll = () => {
        setSelectedIds([]);
    };

    const handleSelectOne = (id: number, checked: boolean) => {
        if (checked) {
            setSelectedIds([...selectedIds, id]);
        } else {
            setSelectedIds(selectedIds.filter(selectedId => selectedId !== id));
        }
    };

    const handleBulkApprove = () => {
        if (selectedIds.length === 0) {
            alert('Please select at least one attendance record to approve.');
            return;
        }

        setApprovalType('bulk');
        setShowApproveModal(true);
    };

    const handleApprove = (id: number) => {
        setSingleApprovalId(id);
        setApprovalType('single');
        setShowApproveModal(true);
    };

    const handleApproveConfirm = () => {
        const idsToApprove = approvalType === 'bulk' ? selectedIds : [singleApprovalId!];
        
        setBulkProcessing(true);
        router.post(
            route('attendance.final.bulk-approve'),
            { ids: idsToApprove },
            {
                preserveScroll: false,
                onFinish: () => {
                    setBulkProcessing(false);
                    setShowApproveModal(false);
                    if (approvalType === 'bulk') {
                        setSelectedIds([]);
                    }
                    setSingleApprovalId(null);
                },
            }
        );
    };

    const handleExport = () => {
        router.get(route('attendance.final.export'), filters, {
            preserveState: true,
        });
    };

    const formatTime = (datetime: string | null) => {
        if (!datetime) return '-';
        try {
            const [hours, minutes] = datetime.split(':');
            const hour12 = parseInt(hours) % 12 || 12;
            const ampm = parseInt(hours) >= 12 ? 'PM' : 'AM';
            return `${hour12}:${minutes} ${ampm}`;
        } catch {
            return '-';
        }
    };

    const formatDate = (date: string) => {
        try {
            const d = new Date(date);
            const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            return `${monthNames[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
        } catch {
            return date;
        }
    };

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Attendance', href: '/attendance/upload' },
                { title: 'Final Attendance', href: '/attendance/final' },
            ]}
        >
            <Head title="Final Attendance" />

            <div className="space-y-6 p-6 md:p-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold">Final Attendance</h1>
                        <p className="text-muted-foreground mt-1">
                            Review, approve, and manage attendance records
                        </p>
                    </div>
                    <Button onClick={handleExport} variant="outline">
                        <Download className="h-4 w-4 mr-2" />
                        Export
                    </Button>
                </div>
                {flash?.success && (
                    <Alert className="bg-green-50 border-green-200">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        <AlertDescription className="text-green-800">
                            {flash.success}
                        </AlertDescription>
                    </Alert>
                )}

                {flash?.error && (
                    <Alert className="bg-red-50 border-red-200">
                        <XCircle className="h-4 w-4 text-red-600" />
                        <AlertDescription className="text-red-800">
                            {flash.error}
                        </AlertDescription>
                    </Alert>
                )}

                {/* Filters */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Filter className="h-5 w-5" />
                            Filters
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                            {/* Search */}
                            <div>
                                <Label htmlFor="search">Search Employee</Label>
                                <Input
                                    id="search"
                                    type="text"
                                    placeholder="Name or ID..."
                                    value={filters.search || ''}
                                    onChange={(e) => handleFilter('search', e.target.value)}
                                />
                            </div>

                            {/* Date From */}
                            <div>
                                <Label htmlFor="date_from">Date From</Label>
                                <Input
                                    id="date_from"
                                    type="date"
                                    value={filters.date_from || ''}
                                    onChange={(e) => handleFilter('date_from', e.target.value)}
                                />
                            </div>

                            {/* Date To */}
                            <div>
                                <Label htmlFor="date_to">Date To</Label>
                                <Input
                                    id="date_to"
                                    type="date"
                                    value={filters.date_to || ''}
                                    onChange={(e) => handleFilter('date_to', e.target.value)}
                                />
                            </div>

                            {/* Company */}
                            <div>
                                <Label htmlFor="company">Company</Label>
                                <Select
                                    value={filters.company_id?.toString() || 'all'}
                                    onValueChange={(value) => handleFilter('company_id', value)}
                                >
                                    <SelectTrigger id="company">
                                        <SelectValue placeholder="All Companies" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Companies</SelectItem>
                                        {companies.map((company) => (
                                            <SelectItem key={company.id} value={company.id.toString()}>
                                                {company.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Employee */}
                            <div>
                                <Label htmlFor="employee">Employee</Label>
                                <Select
                                    value={filters.employee_id?.toString() || 'all'}
                                    onValueChange={(value) => handleFilter('employee_id', value)}
                                >
                                    <SelectTrigger id="employee">
                                        <SelectValue placeholder="All Employees" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Employees</SelectItem>
                                        {filteredEmployees.map((emp) => (
                                            <SelectItem key={emp.id} value={emp.id.toString()}>
                                                {emp.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Status */}
                            <div>
                                <Label htmlFor="status">Status</Label>
                                <Select
                                    value={filters.status || 'all'}
                                    onValueChange={(value) => handleFilter('status', value)}
                                >
                                    <SelectTrigger id="status">
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
                        </div>
                    </CardContent>
                </Card>

                {/* Bulk Actions Bar */}
                {selectedIds.length > 0 ? (
                    <div className="border border-blue-300 bg-gradient-to-r from-blue-50 to-indigo-50 shadow-sm rounded-lg p-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-blue-200">
                                    <CheckSquare className="h-4 w-4 text-blue-600" />
                                    <span className="text-sm font-semibold text-blue-900">
                                        {selectedIds.length} record{selectedIds.length !== 1 ? 's' : ''} selected
                                    </span>
                                </div>
                                <Button
                                    onClick={handleDeselectAll}
                                    variant="ghost"
                                    size="sm"
                                    className="text-gray-600 hover:text-gray-900 h-8"
                                >
                                    <Square className="h-4 w-4 mr-1" />
                                    Deselect All
                                </Button>
                            </div>
                            <Button
                                onClick={handleBulkApprove}
                                disabled={bulkProcessing}
                                className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg h-9"
                            >
                                <CheckCircle2 className="h-4 w-4 mr-2" />
                                {bulkProcessing ? 'Approving...' : `Approve ${selectedIds.length} Record${selectedIds.length !== 1 ? 's' : ''}`}
                            </Button>
                        </div>
                    </div>
                ) : displayPendingCount > 0 && (
                    <div className="border border-orange-200 bg-gradient-to-r from-orange-50 to-amber-50 rounded-lg p-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <AlertCircle className="h-4 w-4 text-orange-600" />
                                <div>
                                    <p className="text-sm font-medium text-orange-900">
                                        {displayPendingCount} record{displayPendingCount !== 1 ? 's' : ''} pending approval
                                        {hasActiveFilters && pendingCount !== filteredPendingCount && (
                                            <span className="text-xs ml-2 text-orange-700">
                                                ({pendingCount} total in system)
                                            </span>
                                        )}
                                    </p>
                                    <p className="text-xs text-orange-700 mt-0.5">
                                        {hasActiveFilters 
                                            ? 'Showing pending records matching current filters'
                                            : 'Select records to approve or use quick selection'
                                        }
                                    </p>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    onClick={handleSelectAllPending}
                                    variant="outline"
                                    size="sm"
                                    className="border-orange-300 text-orange-700 hover:bg-orange-100 hover:text-orange-900 h-8"
                                >
                                    <CheckCheck className="h-4 w-4 mr-1" />
                                    This Page
                                </Button>
                                <Button
                                    onClick={handleSelectAllPendingAcrossPages}
                                    variant="default"
                                    size="sm"
                                    className="bg-orange-600 hover:bg-orange-700 text-white h-8"
                                >
                                    <CheckSquare className="h-4 w-4 mr-1" />
                                    All {displayPendingCount} Records
                                </Button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Attendance Table */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle>Attendance Records</CardTitle>
                            <CardDescription>
                                {attendances?.total || 0} total record(s)
                            </CardDescription>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        {!attendances?.data || attendances.data.length === 0 ? (
                            <div className="py-12 text-center text-gray-500">
                                <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                <p>No attendance records found</p>
                                <p className="text-sm mt-2">Try adjusting your filters</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-12">Select</TableHead>
                                            <TableHead>Employee</TableHead>
                                            <TableHead>Date</TableHead>
                                            <TableHead>Shift</TableHead>
                                            <TableHead>Clock-In</TableHead>
                                            <TableHead>Clock-Out</TableHead>
                                            <TableHead>Total Hours</TableHead>
                                            <TableHead>Break Time</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Approval</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {attendances.data.map((record) => (
                                            <TableRow key={record.id}>
                                                <TableCell>
                                                    {!record.approved_by && (
                                                        <Checkbox
                                                            checked={selectedIds.includes(record.id)}
                                                            onCheckedChange={(checked) => handleSelectOne(record.id, !!checked)}
                                                        />
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <div>
                                                        <p className="font-medium">{record.employee.name}</p>
                                                        <div className="flex gap-2 mt-1">
                                                            <Badge variant="outline" className="text-xs">
                                                                {record.employee.id_number}
                                                            </Badge>
                                                            <Badge variant="secondary" className="text-xs">
                                                                {record.employee.company || 'N/A'}
                                                            </Badge>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <Calendar className="h-4 w-4 text-gray-400" />
                                                        <span className="text-sm">{formatDate(record.date)}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    {record.shift ? (
                                                        <div>
                                                            <p className="font-medium text-sm">{record.shift.name}</p>
                                                            <Badge variant="outline" className="text-xs mt-1">
                                                                {record.shift.time_in} - {record.shift.time_out}
                                                            </Badge>
                                                        </div>
                                                    ) : (
                                                        <span className="text-gray-400">-</span>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <Clock className="h-3 w-3 text-green-600" />
                                                        <span className="text-sm">{record.clock_in || '-'}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <Clock className="h-3 w-3 text-red-600" />
                                                        <span className="text-sm">{record.clock_out || '-'}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    {record.total_hours !== null ? (
                                                        record.total_minutes !== null ? (
                                                            <span className="font-medium text-sm">{record.total_hours}h {record.total_minutes}m</span>
                                                        ) : (
                                                            <span className="font-medium text-sm">{record.total_hours}h</span>
                                                        )
                                                    ) : (
                                                        <span className="text-gray-400">-</span>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <span className="text-sm">
                                                        {record.break_minutes !== null && record.break_minutes !== undefined ? `${record.break_minutes} min` : '-'}
                                                    </span>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex flex-col gap-1">
                                                        {record.status === 'late' ? (
                                                            <Badge variant="destructive" className="text-xs">
                                                                Late
                                                            </Badge>
                                                        ) : record.status === 'undertime' ? (
                                                            <Badge variant="outline" className="text-xs text-orange-600 border-orange-600">
                                                                Undertime
                                                            </Badge>
                                                        ) : record.status === 'present' ? (
                                                            <Badge variant="default" className="text-xs bg-green-100 text-green-800">
                                                                Present
                                                            </Badge>
                                                        ) : (
                                                            <Badge variant="secondary" className="text-xs">
                                                                {record.status}
                                                            </Badge>
                                                        )}
                                                        {record.is_holiday && (
                                                            <Badge variant="secondary" className="text-xs bg-purple-100 text-purple-800">
                                                                Holiday Worked
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    {record.approved_by ? (
                                                        <div>
                                                            <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs">
                                                                Approved
                                                            </Badge>
                                                            <p className="text-xs text-gray-500 mt-1">{record.approved_by}</p>
                                                        </div>
                                                    ) : (
                                                        <Badge variant="outline" className="text-xs text-orange-600 border-orange-600">
                                                            Pending
                                                        </Badge>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex gap-2 justify-end">
                                                        {!record.approved_by ? (
                                                            <>
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    onClick={() => router.visit(route('attendance.final.show', record.id))}
                                                                >
                                                                    <Edit className="h-4 w-4 mr-1" />
                                                                    Edit
                                                                </Button>
                                                                <Button
                                                                    variant="default"
                                                                    size="sm"
                                                                    onClick={() => handleApprove(record.id)}
                                                                    className="bg-green-600 hover:bg-green-700"
                                                                >
                                                                    <CheckCircle2 className="h-4 w-4 mr-1" />
                                                                    Approve
                                                                </Button>
                                                            </>
                                                        ) : (
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => router.visit(route('attendance.final.show', record.id))}
                                                            >
                                                                <Eye className="h-4 w-4 mr-1" />
                                                                View
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
                    </CardContent>
                </Card>

                {/* Pagination */}
                {attendances.last_page > 1 && (
                    <div className="flex items-center justify-between">
                        <p className="text-sm text-gray-600">
                            Showing {((attendances.current_page - 1) * attendances.per_page) + 1} to{' '}
                            {Math.min(attendances.current_page * attendances.per_page, attendances.total)} of{' '}
                            {attendances.total} records
                        </p>
                        <div className="flex gap-2">
                            {attendances.links.map((link, index) => (
                                <Button
                                    key={index}
                                    variant={link.active ? 'default' : 'outline'}
                                    size="sm"
                                    disabled={!link.url}
                                    onClick={() => link.url && router.get(link.url)}
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                />
                            ))}
                        </div>
                    </div>
                )}

                {/* Approval Modal */}
                <Dialog open={showApproveModal} onOpenChange={setShowApproveModal}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>
                                {approvalType === 'bulk' ? 'Approve Multiple Records' : 'Approve Attendance Record'}
                            </DialogTitle>
                            <DialogDescription>
                                {approvalType === 'bulk' 
                                    ? `Are you sure you want to approve ${selectedIds.length} attendance record(s)? This action cannot be undone.`
                                    : 'Are you sure you want to approve this attendance record? This action cannot be undone.'
                                }
                            </DialogDescription>
                        </DialogHeader>
                        <div className="py-4">
                            {approvalType === 'bulk' ? (
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 text-sm">
                                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                                        <span className="font-medium">{selectedIds.length} records selected for approval</span>
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                        All selected attendance records will be marked as approved and locked from further editing.
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {singleApprovalId && (() => {
                                        const record = attendances.data.find(a => a.id === singleApprovalId);
                                        return record ? (
                                            <div className="space-y-2 text-sm">
                                                <div className="flex justify-between">
                                                    <span className="text-muted-foreground">Employee:</span>
                                                    <span className="font-medium">{record.employee.name}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-muted-foreground">Date:</span>
                                                    <span className="font-medium">{formatDate(record.date)}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-muted-foreground">Total Hours:</span>
                                                    <span className="font-medium">
                                                        {record.total_hours}h {record.total_minutes}m
                                                    </span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-muted-foreground">Status:</span>
                                                    <span>{getStatusBadge(record.status, false)}</span>
                                                </div>
                                            </div>
                                        ) : null;
                                    })()}
                                </div>
                            )}
                        </div>
                        <DialogFooter>
                            <Button
                                variant="outline"
                                onClick={() => setShowApproveModal(false)}
                                disabled={bulkProcessing}
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleApproveConfirm}
                                disabled={bulkProcessing}
                                className="bg-green-600 hover:bg-green-700"
                            >
                                <CheckCircle2 className="h-4 w-4 mr-2" />
                                {bulkProcessing ? 'Approving...' : 'Approve'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </AppLayout>
    );
}
