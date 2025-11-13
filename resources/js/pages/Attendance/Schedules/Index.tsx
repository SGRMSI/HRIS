import AppLayout from '@/layouts/app-layout';
import { Head, Link, router } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
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
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
    Plus, 
    Search, 
    Edit, 
    Trash2, 
    Calendar, 
    Users, 
    AlertTriangle,
    Filter,
    UserPlus
} from 'lucide-react';
import { toast } from 'sonner';

interface Employee {
    id: number;
    name: string;
    employee_number: string;
    department: string;
    company: string;
}

interface Shift {
    id: number;
    name: string;
    time_in: string;
    time_out: string;
}

interface Schedule {
    id: number;
    employee: Employee;
    shift: Shift;
    date_start: string;
    date_end: string | null;
    is_holiday: boolean;
    has_conflict: boolean;
    is_active: boolean;
}

interface Company {
    id: number;
    name: string;
}

interface ShiftOption {
    shift_id: number;
    name: string;
}

interface Props {
    schedules: {
        data: Schedule[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
    filters: {
        employee_search?: string;
        company_id?: number;
        shift_id?: number;
        date_from?: string;
        date_to?: string;
    };
    companies: Company[];
    shifts: ShiftOption[];
    flash?: {
        success?: string;
        error?: string;
        warning?: string;
        info?: string;
    };
}

export default function SchedulesIndex({ schedules, filters = {}, companies = [], shifts = [], flash }: Props) {
    const [employeeSearch, setEmployeeSearch] = useState(filters.employee_search || '');
    const [deleteSchedule, setDeleteSchedule] = useState<Schedule | null>(null);
    const [showBulkDialog, setShowBulkDialog] = useState(false);
    
    // Bulk assignment form state
    const [bulkCompanyId, setBulkCompanyId] = useState('');
    const [bulkEmployees, setBulkEmployees] = useState<Employee[]>([]);
    const [bulkSelectedEmployees, setBulkSelectedEmployees] = useState<number[]>([]);
    const [bulkShiftId, setBulkShiftId] = useState('');
    const [bulkDateStart, setBulkDateStart] = useState('');
    const [bulkDateEnd, setBulkDateEnd] = useState('');
    const [bulkCloseExisting, setBulkCloseExisting] = useState(false);
    const [loadingBulkEmployees, setLoadingBulkEmployees] = useState(false);
    const [processingBulk, setProcessingBulk] = useState(false);

    const handleFilter = (key: string, value: string | number) => {
        const filterValue = value === 'all' || value === '' ? undefined : value;
        router.get(
            route('attendance.schedules.index'),
            { ...filters, [key]: filterValue },
            { preserveState: true, replace: true }
        );
    };

    const handleSearch = () => {
        router.get(
            route('attendance.schedules.index'),
            { ...filters, employee_search: employeeSearch || undefined },
            { preserveState: true, replace: true }
        );
    };

    const handleDelete = () => {
        if (!deleteSchedule) return;

        router.delete(route('attendance.schedules.destroy', deleteSchedule.id), {
            onSuccess: () => {
                setDeleteSchedule(null);
            },
        });
    };

     useEffect(() => {
        if (flash?.success) {
            toast.success(flash.success);
        }
        if (flash?.error) {
            toast.error(flash.error);
        }
        if (flash?.warning) {
            toast.warning(flash.warning);
        }
        if (flash?.info) {
            toast.info(flash.info);
        }
    }, [flash]);

    // Load employees when company is selected for bulk assignment
    useEffect(() => {
        if (bulkCompanyId && showBulkDialog) {
            setLoadingBulkEmployees(true);
            axios.get(route('attendance.schedules.employees', bulkCompanyId))
                .then(response => {
                    setBulkEmployees(response.data);
                    setLoadingBulkEmployees(false);
                })
                .catch(error => {
                    console.error('Error loading employees:', error);
                    setBulkEmployees([]);
                    setLoadingBulkEmployees(false);
                });
        } else {
            setBulkEmployees([]);
            setBulkSelectedEmployees([]);
        }
    }, [bulkCompanyId, showBulkDialog]);

    const handleBulkSubmit = () => {
        if (bulkSelectedEmployees.length === 0) {
            alert('Please select at least one employee');
            return;
        }
        if (!bulkShiftId) {
            alert('Please select a shift');
            return;
        }
        if (!bulkDateStart) {
            alert('Please select a start date');
            return;
        }

        setProcessingBulk(true);

        router.post(route('attendance.schedules.bulk'), {
            employee_ids: bulkSelectedEmployees,
            shift_id: bulkShiftId,
            date_start: bulkDateStart,
            date_end: bulkDateEnd || null,
            close_existing: bulkCloseExisting,
        }, {
            onSuccess: () => {
                setShowBulkDialog(false);
                // Reset form
                setBulkCompanyId('');
                setBulkEmployees([]);
                setBulkSelectedEmployees([]);
                setBulkShiftId('');
                setBulkDateStart('');
                setBulkDateEnd('');
                setBulkCloseExisting(false);
                setProcessingBulk(false);
            },
            onError: () => {
                setProcessingBulk(false);
            }
        });
    };

    const toggleAllEmployees = () => {
        if (bulkSelectedEmployees.length === bulkEmployees.length) {
            setBulkSelectedEmployees([]);
        } else {
            setBulkSelectedEmployees(bulkEmployees.map(e => e.id));
        }
    };

    const toggleEmployee = (employeeId: number) => {
        if (bulkSelectedEmployees.includes(employeeId)) {
            setBulkSelectedEmployees(bulkSelectedEmployees.filter(id => id !== employeeId));
        } else {
            setBulkSelectedEmployees([...bulkSelectedEmployees, employeeId]);
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
        <AppLayout breadcrumbs={[
            { title: 'Attendance', href: '/attendance/upload' }, 
            { title: 'Schedules', href: '/attendance/schedules' }
        ]}>
            <Head title="Employee Schedules" />

            <div className="space-y-6 p-6 md:p-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold">Employee Schedules</h1>
                        <p className="text-muted-foreground mt-1">Assign and manage employee shift schedules</p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => setShowBulkDialog(true)}>
                            <UserPlus className="mr-2 h-4 w-4" />
                            Bulk Assign
                        </Button>
                        <Link href={route('attendance.schedules.create')}>
                            <Button>
                                <Plus className="mr-2 h-4 w-4" />
                                Create Schedule
                            </Button>
                        </Link>
                    </div>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Filter className="h-5 w-5" />
                            Filters
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-4 md:grid-cols-5">
                            <div className="space-y-2">
                                <Label>Search Employee</Label>
                                <div className="flex gap-2">
                                    <div className="relative flex-1">
                                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                                        <Input
                                            type="text"
                                            placeholder="Name or ID..."
                                            value={employeeSearch}
                                            onChange={(e) => setEmployeeSearch(e.target.value)}
                                            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                                            className="pl-10"
                                        />
                                    </div>
                                    <Button onClick={handleSearch} variant="outline" size="icon">
                                        <Search className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>

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

                            <div className="space-y-2">
                                <Label>Shift</Label>
                                <Select 
                                    value={filters.shift_id?.toString() || 'all'}
                                    onValueChange={(value) => handleFilter('shift_id', value)}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="All Shifts" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Shifts</SelectItem>
                                        {Array.isArray(shifts) && shifts
                                            .filter(shift => shift && shift.shift_id != null)
                                            .map((shift) => (
                                                <SelectItem key={shift.shift_id} value={shift.shift_id.toString()}>
                                                    {shift.name}
                                                </SelectItem>
                                            ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label>From Date</Label>
                                <Input
                                    type="date"
                                    value={filters.date_from || ''}
                                    onChange={(e) => handleFilter('date_from', e.target.value)}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>To Date</Label>
                                <Input
                                    type="date"
                                    value={filters.date_to || ''}
                                    onChange={(e) => handleFilter('date_to', e.target.value)}
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Schedules</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {schedules.data.length === 0 ? (
                            <div className="py-12 text-center text-muted-foreground">
                                <Calendar className="mx-auto mb-4 h-12 w-12 opacity-20" />
                                <p className="text-lg font-medium">No schedules found</p>
                                <p className="mt-1 text-sm">
                                    {Object.keys(filters).length > 0
                                        ? 'Try adjusting your filters'
                                        : 'Create a schedule to get started'}
                                </p>
                            </div>
                        ) : (
                            <>
                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Employee</TableHead>
                                                <TableHead>Company</TableHead>
                                                <TableHead>Shift</TableHead>
                                                <TableHead>Start Date</TableHead>
                                                <TableHead>End Date</TableHead>
                                                <TableHead>Status</TableHead>
                                                <TableHead className="text-right">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {schedules.data.map((schedule) => (
                                                <TableRow key={schedule.id}>
                                                    <TableCell>
                                                        <div>
                                                            <Link 
                                                                href={`/employee/${schedule.employee.id}`}
                                                                className="font-medium text-primary hover:underline cursor-pointer"
                                                            >
                                                                {schedule.employee.name}
                                                            </Link>
                                                            <div className="text-sm text-muted-foreground">
                                                                #{schedule.employee.employee_number}
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div>
                                                            <div className="font-medium">{schedule.employee.company}</div>
                                                            <div className="text-sm text-muted-foreground">
                                                                {schedule.employee.department}
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div>
                                                            <div className="font-medium">{schedule.shift.name}</div>
                                                            <div className="text-sm text-muted-foreground">
                                                                {schedule.shift.time_in} - {schedule.shift.time_out}
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>{formatDate(schedule.date_start)}</TableCell>
                                                    <TableCell>
                                                        {schedule.date_end ? formatDate(schedule.date_end) : (
                                                            <span className="text-muted-foreground">Ongoing</span>
                                                        )}
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex flex-col gap-1">
                                                            {schedule.is_active ? (
                                                                <Badge variant="default" className="bg-green-600 hover:bg-green-700 w-fit">
                                                                    Active
                                                                </Badge>
                                                            ) : (
                                                                <Badge variant="secondary" className="w-fit">
                                                                    Inactive
                                                                </Badge>
                                                            )}
                                                            {schedule.has_conflict && (
                                                                <Badge variant="destructive" className="w-fit">
                                                                    <AlertTriangle className="mr-1 h-3 w-3" />
                                                                    Conflict
                                                                </Badge>
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <div className="flex justify-end gap-2">
                                                            <Link
                                                                href={route('attendance.schedules.edit', schedule.id)}
                                                            >
                                                                <Button variant="ghost" size="sm">
                                                                    <Edit className="h-4 w-4" />
                                                                </Button>
                                                            </Link>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => setDeleteSchedule(schedule)}
                                                                className="dark:hover:text-red-300"
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>

                                {/* Pagination */}
                                {schedules.last_page > 1 && (
                                    <div className="mt-6 flex items-center justify-between">
                                        <div className="text-sm text-muted-foreground">
                                            Showing {(schedules.current_page - 1) * schedules.per_page + 1} to{' '}
                                            {Math.min(schedules.current_page * schedules.per_page, schedules.total)} of{' '}
                                            {schedules.total} schedules
                                        </div>
                                        <div className="flex gap-2">
                                            {schedules.current_page > 1 && (
                                                <Button
                                                    variant="outline"
                                                    onClick={() =>
                                                        router.get(
                                                            route('attendance.schedules.index'),
                                                            {
                                                                ...filters,
                                                                page: schedules.current_page - 1,
                                                            },
                                                            { preserveState: true }
                                                        )
                                                    }
                                                >
                                                    Previous
                                                </Button>
                                            )}
                                            {schedules.current_page < schedules.last_page && (
                                                <Button
                                                    variant="outline"
                                                    onClick={() =>
                                                        router.get(
                                                            route('attendance.schedules.index'),
                                                            {
                                                                ...filters,
                                                                page: schedules.current_page + 1,
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
                            </>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={!!deleteSchedule} onOpenChange={() => setDeleteSchedule(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Schedule</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete the schedule for{' '}
                            <strong>{deleteSchedule?.employee.name}</strong>? This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            className=""
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Bulk Assignment Dialog */}
            <Dialog open={showBulkDialog} onOpenChange={setShowBulkDialog}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Bulk Schedule Assignment</DialogTitle>
                        <DialogDescription>
                            Assign the same shift schedule to multiple employees at once
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-6 py-4">
                        {/* Company Selection */}
                        <div className="space-y-2">
                            <Label htmlFor="bulk_company">Company *</Label>
                            <Select value={bulkCompanyId} onValueChange={setBulkCompanyId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select company" />
                                </SelectTrigger>
                                <SelectContent>
                                    {companies.map((company) => (
                                        <SelectItem key={company.id} value={company.id.toString()}>
                                            {company.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Employee Selection */}
                        {bulkCompanyId && (
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label>Select Employees *</Label>
                                    {bulkEmployees.length > 0 && (
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={toggleAllEmployees}
                                        >
                                            {bulkSelectedEmployees.length === bulkEmployees.length ? 'Deselect All' : 'Select All'}
                                        </Button>
                                    )}
                                </div>
                                
                                {loadingBulkEmployees ? (
                                    <div className="text-center py-8 text-muted-foreground">
                                        Loading employees...
                                    </div>
                                ) : bulkEmployees.length === 0 ? (
                                    <div className="text-center py-8 text-muted-foreground">
                                        No employees found for this company
                                    </div>
                                ) : (
                                    <div className="border rounded-md max-h-60 overflow-y-auto">
                                        <div className="divide-y">
                                            {bulkEmployees.map((employee) => (
                                                <div
                                                    key={employee.id}
                                                    className="flex items-center space-x-3 p-3 hover:bg-muted cursor-pointer"
                                                    onClick={() => toggleEmployee(employee.id)}
                                                >
                                                    <Checkbox
                                                        checked={bulkSelectedEmployees.includes(employee.id)}
                                                        onCheckedChange={() => toggleEmployee(employee.id)}
                                                    />
                                                    <div className="flex-1">
                                                        <div className="font-medium">{employee.name}</div>
                                                        <div className="text-sm text-muted-foreground">
                                                            {employee.department} - #{employee.employee_number}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                {bulkSelectedEmployees.length > 0 && (
                                    <p className="text-sm text-muted-foreground">
                                        {bulkSelectedEmployees.length} employee(s) selected
                                    </p>
                                )}
                            </div>
                        )}

                        {/* Shift Selection */}
                        <div className="space-y-2">
                            <Label htmlFor="bulk_shift">Shift *</Label>
                            <Select value={bulkShiftId} onValueChange={setBulkShiftId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select shift" />
                                </SelectTrigger>
                                <SelectContent>
                                    {shifts.map((shift) => (
                                        <SelectItem key={shift.shift_id} value={shift.shift_id.toString()}>
                                            {shift.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Date Range */}
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="bulk_date_start">Start Date *</Label>
                                <Input
                                    id="bulk_date_start"
                                    type="date"
                                    value={bulkDateStart}
                                    onChange={(e) => setBulkDateStart(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="bulk_date_end">End Date (Optional)</Label>
                                <Input
                                    id="bulk_date_end"
                                    type="date"
                                    value={bulkDateEnd}
                                    onChange={(e) => setBulkDateEnd(e.target.value)}
                                    min={bulkDateStart}
                                />
                            </div>
                        </div>

                        {/* Close Existing Option */}
                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="bulk_close_existing"
                                checked={bulkCloseExisting}
                                onCheckedChange={(checked) => setBulkCloseExisting(checked as boolean)}
                            />
                            <Label htmlFor="bulk_close_existing" className="cursor-pointer">
                                Close existing ongoing schedules for selected employees
                            </Label>
                        </div>

                        {bulkCloseExisting && (
                            <Alert>
                                <AlertTriangle className="h-4 w-4" />
                                <AlertDescription>
                                    This will automatically end any ongoing schedules (without end date) one day before the new start date.
                                </AlertDescription>
                            </Alert>
                        )}
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowBulkDialog(false)} disabled={processingBulk}>
                            Cancel
                        </Button>
                        <Button onClick={handleBulkSubmit} disabled={processingBulk}>
                            <Users className="mr-2 h-4 w-4" />
                            {processingBulk ? 'Assigning...' : `Assign to ${bulkSelectedEmployees.length} Employee(s)`}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
