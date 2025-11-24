import { AbsencesTable } from '@/components/attendance/AbsencesTable';
import { ExportDialog } from '@/components/attendance/ExportDialog';
import { StatsDashboard } from '@/components/attendance/StatsDashboard';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { Head, router, usePage } from '@inertiajs/react';
import {
    AlertCircle,
    Building2,
    Calendar as CalendarIcon,
    CheckCheck,
    CheckCircle2,
    CheckSquare,
    Clock,
    Download,
    Edit,
    Eye,
    Filter,
    Hourglass,
    PartyPopper,
    Square,
    User,
    UserCheck,
    UserX,
    XCircle,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

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

interface AbsenceRecord {
    employee_id: number;
    employee: Employee;
    date: string;
    shift_id: number | null;
    shift: Shift | null;
    status: string;
    remarks: string | null;
    approved_by: string | null;
    approved_at: string | null;
    can_approve: boolean;
}

interface LeaveRecord {
    id: number;
    employee: Employee;
    leave_type: string;
    date_start: string;
    date_end: string;
    period: string;
    days_count: number;
    status: string;
    has_document: boolean;
    approved_by: string | null;
}

interface Props {
    attendances?: {
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
    absences?: {
        data: AbsenceRecord[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
    leaves?: {
        data: LeaveRecord[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
    stats?: {
        total: number;
        present: number;
        late: number;
        undertime: number;
        absent: number;
        on_leave: number;
        pending_approval: number;
        pending_absences: number;
        approved: number;
    };
    pendingCount?: number;
    filteredPendingCount?: number;
    filters?: {
        search?: string;
        date_from?: string;
        date_to?: string;
        status?: string;
        company_id?: number;
        employee_id?: number;
    };
    companies?: Company[];
    employees?: EmployeeOption[];
    statuses?: Status[];
}

function getStatusBadge(status: string, approved: boolean) {
    if (approved) {
        return (
            <Badge variant="default" className="bg-green-600">
                Approved
            </Badge>
        );
    }

    switch (status.toLowerCase()) {
        case 'present':
            return <Badge variant="default">Present</Badge>;
        case 'late':
            return (
                <Badge variant="default" className="bg-yellow-600">
                    Late
                </Badge>
            );
        case 'undertime':
            return (
                <Badge variant="default" className="bg-orange-600">
                    Undertime
                </Badge>
            );
        case 'absent':
            return <Badge variant="destructive">Absent</Badge>;
        case 'leave':
            return (
                <Badge variant="outline" className="border-blue-600 text-blue-600">
                    On Leave
                </Badge>
            );
        case 'holiday':
            return (
                <Badge variant="outline" className="border-purple-600 text-purple-600">
                    Holiday
                </Badge>
            );
        default:
            return <Badge variant="secondary">{status}</Badge>;
    }
}

export default function FinalIndex({
    attendances = { data: [], current_page: 1, last_page: 1, per_page: 15, total: 0, links: [] },
    absences = { data: [], current_page: 1, last_page: 1, per_page: 15, total: 0 },
    leaves = { data: [], current_page: 1, last_page: 1, per_page: 15, total: 0 },
    stats = { total: 0, present: 0, late: 0, undertime: 0, absent: 0, on_leave: 0, pending_approval: 0, pending_absences: 0, approved: 0 },
    pendingCount = 0,
    filteredPendingCount = 0,
    filters = {},
    companies = [],
    employees = [],
    statuses = [],
}: Props) {
    const { flash } = usePage().props as { flash?: { success?: string; error?: string } };
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [bulkProcessing, setBulkProcessing] = useState(false);
    const [showApproveModal, setShowApproveModal] = useState(false);
    const [approvalType, setApprovalType] = useState<'bulk' | 'single'>('bulk');
    const [singleApprovalId, setSingleApprovalId] = useState<number | null>(null);
    const [exportDialogOpen, setExportDialogOpen] = useState(false);
    const [localFilters, setLocalFilters] = useState({
        search: filters.search || '',
        date_from: filters.date_from || '',
        date_to: filters.date_to || '',
        status: filters.status || '',
        company_id: filters.company_id?.toString() || '',
        employee_id: filters.employee_id?.toString() || '',
    });

    // Determine which count to show (use filtered if filters are active, otherwise use total)
    const hasActiveFilters = !!(
        filters.search ||
        filters.date_from ||
        filters.date_to ||
        filters.status ||
        filters.company_id ||
        filters.employee_id
    );
    const displayPendingCount = hasActiveFilters ? filteredPendingCount || 0 : pendingCount || 0;

    const handleLocalFilterChange = (key: string, value: string) => {
        setLocalFilters((prev) => ({ ...prev, [key]: value }));
    };

    const handleApplyFilters = () => {
        const appliedFilters: Record<string, string | undefined> = {};

        if (localFilters.search) appliedFilters.search = localFilters.search;
        if (localFilters.date_from) appliedFilters.date_from = localFilters.date_from;
        if (localFilters.date_to) appliedFilters.date_to = localFilters.date_to;
        if (localFilters.status && localFilters.status !== 'all') appliedFilters.status = localFilters.status;
        if (localFilters.company_id && localFilters.company_id !== 'all') appliedFilters.company_id = localFilters.company_id;
        if (localFilters.employee_id && localFilters.employee_id !== 'all') appliedFilters.employee_id = localFilters.employee_id;

        router.get(route('attendance.final.index'), appliedFilters, { preserveState: true, replace: true });
    };

    const handleClearFilters = () => {
        setLocalFilters({
            search: '',
            date_from: '',
            date_to: '',
            status: '',
            company_id: '',
            employee_id: '',
        });
        router.get(route('attendance.final.index'), {}, { preserveState: true, replace: true });
    };

    // Show toast notifications
    useEffect(() => {
        if (flash?.success) {
            toast.success(flash.success);
        }
        if (flash?.error) {
            toast.error(flash.error);
        }
    }, [flash]);

    const handleSelectAllPending = () => {
        const pendingIds = (attendances?.data || []).filter((a) => !a.approved_by && a.can_approve).map((a) => a.id);
        setSelectedIds(pendingIds);
    };

    const handleSelectAllPendingAcrossPages = () => {
        // Fetch all pending IDs across all pages
        router.get(
            route('attendance.final.index'),
            {
                ...filters,
                get_all_pending_ids: true,
            },
            {
                preserveState: true,
                only: ['pendingIds'],
                onSuccess: (page) => {
                    const props = page.props as { pendingIds?: number[] };
                    if (props.pendingIds) {
                        setSelectedIds(props.pendingIds);
                    }
                },
            },
        );
    };

    const handleDeselectAll = () => {
        setSelectedIds([]);
    };

    const handleSelectOne = (id: number, checked: boolean) => {
        if (checked) {
            setSelectedIds([...selectedIds, id]);
        } else {
            setSelectedIds(selectedIds.filter((selectedId) => selectedId !== id));
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
                preserveScroll: true,
                preserveState: true,
                onFinish: () => {
                    setBulkProcessing(false);
                    setShowApproveModal(false);
                    if (approvalType === 'bulk') {
                        setSelectedIds([]);
                    }
                    setSingleApprovalId(null);
                },
            },
        );
    };

    const handleExport = () => {
        setExportDialogOpen(true);
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
    // Stats configuration for dashboard
    const dashboardStats = [
        {
            title: 'Total Records',
            value: stats?.total || 0,
            icon: User,
            description: 'All attendance records',
            variant: 'default' as const,
        },
        {
            title: 'Present',
            value: stats?.present || 0,
            icon: UserCheck,
            description: `${(stats?.total || 0) + (stats?.absent || 0) > 0 ? Math.round(((stats?.present || 0) / ((stats?.total || 0) + (stats?.absent || 0))) * 100) : 0}% attendance rate`,
            variant: 'success' as const,
        },
        {
            title: 'Late',
            value: stats?.late || 0,
            icon: Clock,
            description: `${(stats?.total || 0) + (stats?.absent || 0) > 0 ? Math.round(((stats?.late || 0) / ((stats?.total || 0) + (stats?.absent || 0))) * 100) : 0}% late rate`,
            variant: 'warning' as const,
        },
        {
            title: 'Undertime',
            value: stats?.undertime || 0,
            icon: Hourglass,
            description: `${(stats?.total || 0) + (stats?.absent || 0) > 0 ? Math.round(((stats?.undertime || 0) / ((stats?.total || 0) + (stats?.absent || 0))) * 100) : 0}% undertime`,
            variant: 'warning' as const,
        },
        {
            title: 'Absent',
            value: stats?.absent || 0,
            icon: UserX,
            description: `${(stats?.present || 0) + (stats?.absent || 0) > 0 ? Math.round(((stats?.absent || 0) / ((stats?.present || 0) + (stats?.absent || 0))) * 100) : 0}% absent rate`,
            variant: 'danger' as const,
        },
        {
            title: 'On Leave',
            value: stats?.on_leave || 0,
            icon: PartyPopper,
            description: 'Approved leave',
            variant: 'info' as const,
        },
        {
            title: 'Pending Approval (Attendance)',
            value: stats?.pending_approval || 0,
            icon: AlertCircle,
            description: 'Attendance records awaiting approval',
            variant: 'warning' as const,
        },
        {
            title: 'Pending Approval (Absences)',
            value: stats?.pending_absences || 0,
            icon: AlertCircle,
            description: 'Absences awaiting approval',
            variant: 'warning' as const,
        },
    ];

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Attendance', href: '#' },
                { title: 'Final Attendance', href: '/attendance/final' },
            ]}
        >
            <Head title="Final Attendance" />

            <div className="space-y-6 p-6 md:p-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold">Final Attendance</h1>
                        <p className="mt-1 text-muted-foreground">Review, approve, and manage attendance records</p>
                    </div>
                    <div className="flex gap-2">
                        <Button onClick={handleExport} variant="outline">
                            <Download className="mr-2 h-4 w-4" />
                            Export
                        </Button>
                    </div>
                </div>

                {/* Stats Dashboard */}
                <StatsDashboard stats={dashboardStats} columns={(stats?.total || 0) > 0 ? 5 : 4} />

                {/* Flash Messages */}
                {flash?.success && (
                    <Alert className="border-green-200 bg-green-50">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        <AlertDescription className="text-green-800">{flash.success}</AlertDescription>
                    </Alert>
                )}

                {flash?.error && (
                    <Alert className="border-red-200 bg-red-50">
                        <XCircle className="h-4 w-4 text-red-600" />
                        <AlertDescription className="text-red-800">{flash.error}</AlertDescription>
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
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-5">
                            {/* Search */}
                            <div>
                                <Label htmlFor="search">Search Employee</Label>
                                <Input
                                    id="search"
                                    type="text"
                                    placeholder="Name or ID..."
                                    value={localFilters.search}
                                    onChange={(e) => handleLocalFilterChange('search', e.target.value)}
                                />
                            </div>

                            {/* Date From */}
                            <div>
                                <Label htmlFor="date_from">Date From</Label>
                                <Input
                                    id="date_from"
                                    type="date"
                                    value={localFilters.date_from}
                                    onChange={(e) => handleLocalFilterChange('date_from', e.target.value)}
                                />
                            </div>

                            {/* Date To */}
                            <div>
                                <Label htmlFor="date_to">Date To</Label>
                                <Input
                                    id="date_to"
                                    type="date"
                                    value={localFilters.date_to}
                                    onChange={(e) => handleLocalFilterChange('date_to', e.target.value)}
                                />
                            </div>

                            {/* Company */}
                            <div>
                                <Label htmlFor="company">Company</Label>
                                <Select
                                    value={localFilters.company_id || 'all'}
                                    onValueChange={(value) => {
                                        handleLocalFilterChange('company_id', value);
                                        if (value === 'all' || value !== localFilters.company_id) {
                                            handleLocalFilterChange('employee_id', '');
                                        }
                                    }}
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
                                    value={localFilters.employee_id || 'all'}
                                    onValueChange={(value) => handleLocalFilterChange('employee_id', value)}
                                >
                                    <SelectTrigger id="employee">
                                        <SelectValue placeholder="All Employees" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Employees</SelectItem>
                                        {(localFilters.company_id && localFilters.company_id !== 'all'
                                            ? employees.filter((emp) => emp.company_id.toString() === localFilters.company_id)
                                            : employees
                                        ).map((emp) => (
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
                                <Select value={localFilters.status || 'all'} onValueChange={(value) => handleLocalFilterChange('status', value)}>
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
                        <div className="mt-4 flex justify-end gap-2">
                            <Button onClick={handleClearFilters} variant="outline" size="sm">
                                Clear Filters
                            </Button>
                            <Button onClick={handleApplyFilters} size="sm">
                                <Filter className="mr-2 h-4 w-4" />
                                Apply Filters
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Bulk Actions Bar */}
                {selectedIds.length > 0 ? (
                    <div className="rounded-lg border border-blue-300 bg-gradient-to-r from-blue-50 to-indigo-50 p-3 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2 rounded-lg border border-blue-200 bg-white px-3 py-1.5">
                                    <CheckSquare className="h-4 w-4 text-blue-600" />
                                    <span className="text-sm font-semibold text-blue-900">
                                        {selectedIds.length} record{selectedIds.length !== 1 ? 's' : ''} selected
                                    </span>
                                </div>
                                <Button onClick={handleDeselectAll} variant="ghost" size="sm" className="h-8 text-gray-600 hover:text-gray-900">
                                    <Square className="mr-1 h-4 w-4" />
                                    Deselect All
                                </Button>
                            </div>
                            <Button
                                onClick={handleBulkApprove}
                                disabled={bulkProcessing}
                                className="h-9 bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-lg hover:from-green-700 hover:to-emerald-700"
                            >
                                <CheckCircle2 className="mr-2 h-4 w-4" />
                                {bulkProcessing ? 'Approving...' : `Approve ${selectedIds.length} Record${selectedIds.length !== 1 ? 's' : ''}`}
                            </Button>
                        </div>
                    </div>
                ) : (
                    displayPendingCount > 0 && (
                        <div className="rounded-lg border border-orange-200 bg-gradient-to-r from-orange-50 to-amber-50 p-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <AlertCircle className="h-4 w-4 text-orange-600" />
                                    <div>
                                        <p className="text-sm font-medium text-orange-900">
                                            {displayPendingCount} record{displayPendingCount !== 1 ? 's' : ''} pending approval
                                            {hasActiveFilters && pendingCount !== filteredPendingCount && (
                                                <span className="ml-2 text-xs text-orange-700">({pendingCount} total in system)</span>
                                            )}
                                        </p>
                                        <p className="mt-0.5 text-xs text-orange-700">
                                            {hasActiveFilters
                                                ? 'Showing pending records matching current filters'
                                                : 'Select records to approve or use quick selection'}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        onClick={handleSelectAllPending}
                                        variant="outline"
                                        size="sm"
                                        className="h-8 border-orange-300 text-orange-700 hover:bg-orange-100 hover:text-orange-900"
                                    >
                                        <CheckCheck className="mr-1 h-4 w-4" />
                                        This Page
                                    </Button>
                                    <Button
                                        onClick={handleSelectAllPendingAcrossPages}
                                        variant="default"
                                        size="sm"
                                        className="h-8 bg-orange-600 text-white hover:bg-orange-700"
                                    >
                                        <CheckSquare className="mr-1 h-4 w-4" />
                                        All {displayPendingCount} Records
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )
                )}

                {/* Attendance Table */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle>Attendance Records</CardTitle>
                            <CardDescription>{attendances?.total || 0} total record(s)</CardDescription>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        {!attendances?.data || attendances.data.length === 0 ? (
                            <div className="py-12 text-center text-gray-500">
                                <CalendarIcon className="mx-auto mb-4 h-12 w-12 opacity-50" />
                                <p>No attendance records found</p>
                                <p className="mt-2 text-sm">Try adjusting your filters</p>
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
                                        {(attendances?.data || []).map((record) => (
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
                                                        <div className="mt-1 flex gap-2">
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
                                                        <CalendarIcon className="h-4 w-4 text-gray-400" />
                                                        <span className="text-sm">{formatDate(record.date)}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    {record.shift ? (
                                                        <div>
                                                            <p className="text-sm font-medium">{record.shift.name}</p>
                                                            <Badge variant="outline" className="mt-1 text-xs">
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
                                                            <span className="text-sm font-medium">
                                                                {record.total_hours}h {record.total_minutes}m
                                                            </span>
                                                        ) : (
                                                            <span className="text-sm font-medium">{record.total_hours}h</span>
                                                        )
                                                    ) : (
                                                        <span className="text-gray-400">-</span>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <span className="text-sm">
                                                        {record.break_minutes !== null && record.break_minutes !== undefined
                                                            ? `${record.break_minutes} min`
                                                            : '-'}
                                                    </span>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex flex-col gap-1">
                                                        {record.status === 'late' ? (
                                                            <Badge variant="destructive" className="text-xs">
                                                                Late
                                                            </Badge>
                                                        ) : record.status === 'undertime' ? (
                                                            <Badge variant="outline" className="border-orange-600 text-xs text-orange-600">
                                                                Undertime
                                                            </Badge>
                                                        ) : record.status === 'present' ? (
                                                            <Badge variant="default" className="bg-green-100 text-xs text-green-800">
                                                                Present
                                                            </Badge>
                                                        ) : (
                                                            <Badge variant="secondary" className="text-xs">
                                                                {record.status}
                                                            </Badge>
                                                        )}
                                                        {record.is_holiday && (
                                                            <Badge variant="secondary" className="bg-purple-100 text-xs text-purple-800">
                                                                Holiday Worked
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    {record.approved_by ? (
                                                        <div>
                                                            <Badge variant="secondary" className="bg-green-100 text-xs text-green-800">
                                                                Approved
                                                            </Badge>
                                                            <p className="mt-1 text-xs text-gray-500">{record.approved_by}</p>
                                                        </div>
                                                    ) : (
                                                        <Badge variant="outline" className="border-orange-600 text-xs text-orange-600">
                                                            Pending
                                                        </Badge>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex justify-end gap-2">
                                                        {!record.approved_by ? (
                                                            <>
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    onClick={() => router.visit(route('attendance.final.show', record.id))}
                                                                >
                                                                    <Edit className="mr-1 h-4 w-4" />
                                                                    Edit
                                                                </Button>
                                                                <Button
                                                                    variant="default"
                                                                    size="sm"
                                                                    onClick={() => handleApprove(record.id)}
                                                                    className="bg-green-600 hover:bg-green-700"
                                                                >
                                                                    <CheckCircle2 className="mr-1 h-4 w-4" />
                                                                    Approve
                                                                </Button>
                                                            </>
                                                        ) : (
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => router.visit(route('attendance.final.show', record.id))}
                                                            >
                                                                <Eye className="mr-1 h-4 w-4" />
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

                {/* Attendance Pagination */}
                {attendances?.last_page > 1 && (
                    <div className="flex items-center justify-between px-2 py-4">
                        <p className="text-sm text-muted-foreground">
                            Showing {(attendances.current_page - 1) * attendances.per_page + 1} to{' '}
                            {Math.min(attendances.current_page * attendances.per_page, attendances.total)} of {attendances.total} records
                        </p>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={attendances.current_page === 1}
                                onClick={() =>
                                    router.get(route('attendance.final.index'), {
                                        ...filters,
                                        page: attendances.current_page - 1,
                                    })
                                }
                            >
                                Previous
                            </Button>
                            <span className="flex items-center px-3 text-sm">
                                Page {attendances.current_page} of {attendances.last_page}
                            </span>
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={attendances.current_page === attendances.last_page}
                                onClick={() =>
                                    router.get(route('attendance.final.index'), {
                                        ...filters,
                                        page: attendances.current_page + 1,
                                    })
                                }
                            >
                                Next
                            </Button>
                        </div>
                    </div>
                )}

                {/* Absences Table */}
                <div className="mt-6">
                    <AbsencesTable absences={absences} />
                </div>

                {/* Leaves Table */}
                {leaves?.data && leaves.data.length > 0 && (
                    <Card className="mt-6">
                        <CardHeader>
                            <CardTitle className="text-xl">On Leave</CardTitle>
                            <CardDescription>Approved leave requests within the filtered period</CardDescription>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Employee</TableHead>
                                            <TableHead>Type</TableHead>
                                            <TableHead>Period</TableHead>
                                            <TableHead>Duration</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead className="text-center">Document</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {(leaves?.data || []).map((leave) => (
                                            <TableRow key={leave.id}>
                                                <TableCell>
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <User className="h-4 w-4 text-gray-400" />
                                                            <span className="font-medium">{leave.employee.name}</span>
                                                        </div>
                                                        <div className="mt-1 ml-6 text-xs text-gray-500">
                                                            {leave.employee.id_number} • {leave.employee.department}
                                                        </div>
                                                        <div className="ml-6 text-xs text-gray-400">
                                                            <Building2 className="mr-1 inline h-3 w-3" />
                                                            {leave.employee.company}
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline">{leave.leave_type}</Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <CalendarIcon className="h-4 w-4 text-gray-400" />
                                                        <span className="text-sm">{leave.period}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <span className="text-sm">
                                                        {leave.days_count} day{leave.days_count !== 1 ? 's' : ''}
                                                    </span>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="default" className="bg-green-600">
                                                        Approved
                                                    </Badge>
                                                    {leave.approved_by && <p className="mt-1 text-xs text-gray-500">by {leave.approved_by}</p>}
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    {leave.has_document ? (
                                                        <Badge variant="secondary" className="gap-1">
                                                            <CheckCircle2 className="h-3 w-3" />
                                                            Attached
                                                        </Badge>
                                                    ) : (
                                                        <span className="text-xs text-gray-400">No document</span>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Leaves Pagination */}
                {leaves?.data && leaves.data.length > 0 && leaves.last_page > 1 && (
                    <div className="flex items-center justify-between px-2 py-4">
                        <div className="text-sm text-muted-foreground">
                            Showing {(leaves.current_page - 1) * leaves.per_page + 1} to{' '}
                            {Math.min(leaves.current_page * leaves.per_page, leaves.total)} of {leaves.total} leaves
                        </div>
                        <div className="flex items-center space-x-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                    router.get(route('attendance.final.index'), {
                                        ...filters,
                                        leaves_page: leaves.current_page - 1,
                                    })
                                }
                                disabled={leaves.current_page === 1}
                            >
                                Previous
                            </Button>
                            <div className="text-sm">
                                Page {leaves.current_page} of {leaves.last_page}
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                    router.get(route('attendance.final.index'), {
                                        ...filters,
                                        leaves_page: leaves.current_page + 1,
                                    })
                                }
                                disabled={leaves.current_page === leaves.last_page}
                            >
                                Next
                            </Button>
                        </div>
                    </div>
                )}

                {/* Approval Modal */}
                <Dialog open={showApproveModal} onOpenChange={setShowApproveModal}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{approvalType === 'bulk' ? 'Approve Multiple Records' : 'Approve Attendance Record'}</DialogTitle>
                            <DialogDescription>
                                {approvalType === 'bulk'
                                    ? `Are you sure you want to approve ${selectedIds.length} attendance record(s)? This action cannot be undone.`
                                    : 'Are you sure you want to approve this attendance record? This action cannot be undone.'}
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
                                    {singleApprovalId &&
                                        (() => {
                                            const record = (attendances?.data || []).find((a) => a.id === singleApprovalId);
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
                            <Button variant="outline" onClick={() => setShowApproveModal(false)} disabled={bulkProcessing}>
                                Cancel
                            </Button>
                            <Button onClick={handleApproveConfirm} disabled={bulkProcessing} className="bg-green-600 hover:bg-green-700">
                                <CheckCircle2 className="mr-2 h-4 w-4" />
                                {bulkProcessing ? 'Approving...' : 'Approve'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                <ExportDialog
                    open={exportDialogOpen}
                    onOpenChange={setExportDialogOpen}
                    exportRoute={route('attendance.final.export')}
                    companies={companies}
                    employees={employees}
                    currentFilters={filters}
                />
            </div>
        </AppLayout>
    );
}
