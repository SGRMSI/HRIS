import AppLayout from '@/layouts/app-layout';
import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { Plus, Search, Edit, Trash2, Moon, Clock, Users, FileText } from 'lucide-react';

interface Shift {
    id: number;
    name: string;
    description: string | null;
    times: {
        time_in: string;
        time_out: string;
        break_start: string | null;
        break_end: string | null;
    };
    grace_period: number;
    working_hours: number;
    is_overnight: boolean;
    schedules_count: number;
    attendances_count: number;
    is_active: boolean;
    can_delete: boolean;
}

interface Props {
    shifts: {
        data: Shift[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
    filters: {
        search?: string;
        status?: string;
    };
}

export default function ShiftsIndex({ shifts, filters }: Props) {
    const [search, setSearch] = useState(filters.search || '');
    const [status, setStatus] = useState(filters.status || 'all');
    const [deleteShift, setDeleteShift] = useState<Shift | null>(null);

    const handleSearch = (value: string) => {
        setSearch(value);
        router.get(
            route('attendance.shifts.index'),
            { search: value, status: status !== 'all' ? status : undefined },
            { preserveState: true, replace: true }
        );
    };

    const handleStatusFilter = (value: string) => {
        setStatus(value);
        router.get(
            route('attendance.shifts.index'),
            { search, status: value !== 'all' ? value : undefined },
            { preserveState: true, replace: true }
        );
    };

    const handleDelete = () => {
        if (!deleteShift) return;

        router.delete(route('attendance.shifts.destroy', deleteShift.id), {
            onSuccess: () => {
                setDeleteShift(null);
            },
        });
    };

    return (
        <AppLayout breadcrumbs={[
            { title: 'Attendance', href: '/attendance/upload' },
            { title: 'Shifts', href: '/attendance/shifts' }
        ]}>
            <Head title="Shifts Management" />

            <div className="space-y-6 p-6 md:p-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold">Shifts Management</h1>
                        <p className="text-muted-foreground mt-1">Manage work shifts and schedules</p>
                    </div>
                    <Link href={route('attendance.shifts.create')}>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            Create Shift
                        </Button>
                    </Link>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Shifts</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {/* Filters */}
                        <div className="mb-6 flex flex-col gap-4 sm:flex-row">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                                <Input
                                    type="text"
                                    placeholder="Search shifts..."
                                    value={search}
                                    onChange={(e) => handleSearch(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                            <Select value={status} onValueChange={handleStatusFilter}>
                                <SelectTrigger className="w-full sm:w-[200px]">
                                    <SelectValue placeholder="Filter by status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Shifts</SelectItem>
                                    <SelectItem value="active">Active</SelectItem>
                                    <SelectItem value="inactive">Inactive</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Table */}
                        {shifts.data.length === 0 ? (
                            <div className="py-12 text-center text-gray-500">
                                <Clock className="mx-auto mb-4 h-12 w-12 text-gray-300" />
                                <p className="text-lg font-medium">No shifts found</p>
                                <p className="mt-1 text-sm">
                                    {search || status !== 'all'
                                        ? 'Try adjusting your filters'
                                        : 'Create your first shift to get started'}
                                </p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Shift Name</TableHead>
                                            <TableHead>Time In</TableHead>
                                            <TableHead>Time Out</TableHead>
                                            <TableHead>Break</TableHead>
                                            <TableHead>Grace Period</TableHead>
                                            <TableHead>Working Hours</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Usage</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {shifts.data.map((shift) => (
                                            <TableRow key={shift.id}>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <div>
                                                            <div className="font-medium">{shift.name}</div>
                                                            {shift.description && (
                                                                <div className="text-sm text-gray-500">
                                                                    {shift.description}
                                                                </div>
                                                            )}
                                                        </div>
                                                        {shift.is_overnight && (
                                                            <Badge variant="secondary" className="ml-2">
                                                                <Moon className="mr-1 h-3 w-3" />
                                                                Overnight
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="font-mono">
                                                    {shift.times.time_in}
                                                </TableCell>
                                                <TableCell className="font-mono">
                                                    {shift.times.time_out}
                                                </TableCell>
                                                <TableCell className="font-mono text-sm">
                                                    {shift.times.break_start && shift.times.break_end ? (
                                                        <div className="text-gray-600">
                                                            {shift.times.break_start} - {shift.times.break_end}
                                                        </div>
                                                    ) : (
                                                        <span className="text-gray-400">No break</span>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <span className="text-sm text-gray-600">
                                                        {shift.grace_period} min
                                                    </span>
                                                </TableCell>
                                                <TableCell>
                                                    <span className="font-medium">
                                                        {shift.working_hours.toFixed(2)} hrs
                                                    </span>
                                                </TableCell>
                                                <TableCell>
                                                    {shift.is_active ? (
                                                        <Badge variant="default" className="bg-green-600">
                                                            Active
                                                        </Badge>
                                                    ) : (
                                                        <Badge variant="secondary">Inactive</Badge>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex flex-col gap-1 text-sm">
                                                        <div className="flex items-center gap-1 text-gray-600">
                                                            <Users className="h-3 w-3" />
                                                            <span>{shift.schedules_count} schedules</span>
                                                        </div>
                                                        <div className="flex items-center gap-1 text-gray-600">
                                                            <FileText className="h-3 w-3" />
                                                            <span>{shift.attendances_count} records</span>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <Link
                                                            href={route('attendance.shifts.edit', shift.id)}
                                                        >
                                                            <Button variant="ghost" size="sm">
                                                                <Edit className="h-4 w-4" />
                                                            </Button>
                                                        </Link>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => setDeleteShift(shift)}
                                                            disabled={!shift.can_delete}
                                                            className="text-red-600 hover:text-red-700 disabled:opacity-50"
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
                        )}

                        {/* Pagination */}
                        {shifts.last_page > 1 && (
                            <div className="mt-6 flex items-center justify-between">
                                <div className="text-sm text-gray-500">
                                    Showing {(shifts.current_page - 1) * shifts.per_page + 1} to{' '}
                                    {Math.min(shifts.current_page * shifts.per_page, shifts.total)} of{' '}
                                    {shifts.total} shifts
                                </div>
                                <div className="flex gap-2">
                                    {shifts.current_page > 1 && (
                                        <Button
                                            variant="outline"
                                            onClick={() =>
                                                router.get(
                                                    route('attendance.shifts.index'),
                                                    {
                                                        ...filters,
                                                        page: shifts.current_page - 1,
                                                    },
                                                    { preserveState: true }
                                                )
                                            }
                                        >
                                            Previous
                                        </Button>
                                    )}
                                    {shifts.current_page < shifts.last_page && (
                                        <Button
                                            variant="outline"
                                            onClick={() =>
                                                router.get(
                                                    route('attendance.shifts.index'),
                                                    {
                                                        ...filters,
                                                        page: shifts.current_page + 1,
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

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={!!deleteShift} onOpenChange={() => setDeleteShift(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Shift</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete "{deleteShift?.name}"? This action cannot be
                            undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </AppLayout>
    );
}
