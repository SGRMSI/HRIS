import { useState } from 'react';
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
    Building2
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
    total_hours: string;
    late_minutes: number | null;
    overtime_hours: string;
    undertime_hours: string;
    status: string;
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

export default function FinalIndex({ attendances, filters = {}, companies = [], employees = [], statuses = [] }: Props) {
    const { flash } = usePage().props as any;
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [bulkProcessing, setBulkProcessing] = useState(false);

    // Filter employees based on selected company
    const filteredEmployees = filters.company_id 
        ? employees.filter(emp => emp.company_id === filters.company_id)
        : employees;

    const handleFilter = (key: string, value: string) => {
        const filterValue = value === 'all' ? undefined : value;
        router.get(
            route('attendance.final.index'),
            { ...filters, [key]: filterValue || undefined },
            { preserveState: true, replace: true }
        );
    };

    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            const selectableIds = attendances.data
                .filter(a => !a.approved_by && a.can_approve)
                .map(a => a.id);
            setSelectedIds(selectableIds);
        } else {
            setSelectedIds([]);
        }
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

        if (!confirm(`Are you sure you want to approve ${selectedIds.length} attendance record(s)?`)) {
            return;
        }

        setBulkProcessing(true);
        router.post(
            route('attendance.final.bulk-approve'),
            { ids: selectedIds },
            {
                onFinish: () => {
                    setBulkProcessing(false);
                    setSelectedIds([]);
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

    const allSelectableSelected = attendances?.data
        ? attendances.data
            .filter(a => !a.approved_by && a.can_approve)
            .every(a => selectedIds.includes(a.id))
        : false;

    const someSelected = selectedIds.length > 0 && !allSelectableSelected;

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

                {/* Bulk Actions */}
                {selectedIds.length > 0 && (
                    <Card className="border-blue-200 bg-blue-50">
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <CheckSquare className="h-5 w-5 text-blue-600" />
                                    <span className="text-sm font-medium text-blue-900">
                                        {selectedIds.length} record(s) selected
                                    </span>
                                </div>
                                <Button
                                    onClick={handleBulkApprove}
                                    disabled={bulkProcessing}
                                    className="bg-blue-600 hover:bg-blue-700"
                                >
                                    <CheckCircle2 className="h-4 w-4 mr-2" />
                                    {bulkProcessing ? 'Approving...' : 'Approve Selected'}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
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
                                            <TableHead className="w-12">
                                                <Checkbox
                                                    checked={allSelectableSelected}
                                                    onCheckedChange={handleSelectAll}
                                                />
                                            </TableHead>
                                            <TableHead>Employee</TableHead>
                                            <TableHead>Company</TableHead>
                                            <TableHead>Date</TableHead>
                                            <TableHead>Shift</TableHead>
                                            <TableHead>Clock-In</TableHead>
                                            <TableHead>Clock-Out</TableHead>
                                            <TableHead>Break-Out</TableHead>
                                            <TableHead>Break-In</TableHead>
                                            <TableHead>Total Hours</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Approved</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {attendances.data.map((record) => (
                                            <TableRow key={record.id}>
                                                <TableCell>
                                                    {!record.approved_by && record.can_approve && (
                                                        <Checkbox
                                                            checked={selectedIds.includes(record.id)}
                                                            onCheckedChange={(checked) => handleSelectOne(record.id, !!checked)}
                                                        />
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <User className="h-4 w-4 text-gray-400" />
                                                        <div>
                                                            <p className="font-medium">{record.employee.name}</p>
                                                            <p className="text-xs text-gray-500">{record.employee.id_number}</p>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <span className="text-sm">{record.employee.company || 'N/A'}</span>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <Calendar className="h-4 w-4 text-gray-400" />
                                                        {formatDate(record.date)}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div>
                                                        <p className="font-medium">{record.employee.name}</p>
                                                        <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                                                            <Building2 className="h-3 w-3" />
                                                            {record.employee.company || 'N/A'}
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <Calendar className="h-4 w-4 text-gray-400" />
                                                        {formatDate(record.date)}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    {record.shift ? (
                                                        <div className="text-sm">
                                                            <p className="font-medium">{record.shift.name}</p>
                                                            <p className="text-xs text-gray-500">
                                                                {record.shift.time_in} - {record.shift.time_out}
                                                            </p>
                                                        </div>
                                                    ) : (
                                                        <span className="text-gray-400">-</span>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <Clock className="h-3 w-3 text-green-600" />
                                                        {record.clock_in || '-'}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <Clock className="h-3 w-3 text-red-600" />
                                                        {record.clock_out || '-'}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <Clock className="h-3 w-3 text-orange-600" />
                                                        {record.break_out || '-'}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <Clock className="h-3 w-3 text-orange-600" />
                                                        {record.break_in || '-'}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="text-sm">
                                                        <p className="font-medium">{record.total_hours} hrs</p>
                                                        {record.overtime_hours !== '0.00' && (
                                                            <p className="text-xs text-blue-600">
                                                                +{record.overtime_hours} OT
                                                            </p>
                                                        )}
                                                        {record.late_minutes && record.late_minutes > 0 && (
                                                            <p className="text-xs text-red-600">
                                                                Late: {record.late_minutes}m
                                                            </p>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    {getStatusBadge(record.status, !!record.approved_by)}
                                                </TableCell>
                                                <TableCell>
                                                    {record.approved_by ? (
                                                        <div className="text-sm">
                                                            <p className="font-medium">{record.approved_by}</p>
                                                            <p className="text-xs text-gray-500">
                                                                {new Date(record.approved_at!).toLocaleDateString()}
                                                            </p>
                                                        </div>
                                                    ) : (
                                                        <span className="text-gray-400">Pending</span>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => router.visit(route('attendance.final.show', record.id))}
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
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
            </div>
        </AppLayout>
    );
}
