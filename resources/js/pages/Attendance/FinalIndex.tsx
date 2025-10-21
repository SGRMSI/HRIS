import { Head, Link, useForm } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { dayjs } from '@/lib/dayjs';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { DateTimeRangePicker } from '@/components/attendance/date-range-picker';

interface Employee {
    id: number;
    employee_number: string;
    first_name: string;
    last_name: string;
    department_id: number;
}

interface Shift {
    id: number;
    name: string;
    time_in: string;
    time_out: string;
}

interface Attendance {
    id: number;
    employee_id: number;
    employee: Employee;
    shift_id: number;
    shift: Shift;
    date: string;
    clock_in: string;
    break_out: string | null;
    break_in: string | null;
    clock_out: string;
    total_hours: number;
    late_minutes: number;
    overtime_hours: number;
    break_minutes: number;
    status: string;
    remarks: string | null;
    created_by: number;
    approved_by: number | null;
}

interface Filters {
    search?: string;
    date_from?: string;
    date_to?: string;
    status?: string;
    department_id?: number;
}

interface Props {
    attendances: {
        data: Attendance[];
        from: number;
        to: number;
        total: number;
        links: { url: string | null; label: string; active: boolean }[];
    };
    filters: Filters;
    can: {
        approve: boolean;
        edit: boolean;
    };
}

export default function FinalIndex({ attendances, filters, can }: Props) {
    interface FormData {
        search: string;
        date_from: string;
        date_to: string;
        status: string;
        selectedIds: number[];
    }

    type FormDataKey = keyof FormData;
    
    interface FormData {
        [key: string]: any;
        search: string;
        date_from: string;
        date_to: string;
        status: string;
        selectedIds: number[];
    }
    
    const { data, setData, post, processing, errors } = useForm({
        search: filters.search || '',
        date_from: filters.date_from || '',
        date_to: filters.date_to || '',
        status: filters.status || '',
        selectedIds: [] as number[],
    } as const);

    interface EditForm {
        clock_in: string;
        break_out: string | null;
        break_in: string | null;
        clock_out: string;
        status: string;
        remarks: string | null;
    }

    const [editingId, setEditingId] = useState<number | null>(null);
    const [editForm, setEditForm] = useState<EditForm>({
        clock_in: '',
        break_out: null,
        break_in: null,
        clock_out: '',
        status: '',
        remarks: null
    });

    // Handle inline edit
    const startEdit = (attendance: Attendance) => {
        setEditingId(attendance.id);
        setEditForm({
            clock_in: attendance.clock_in,
            break_out: attendance.break_out,
            break_in: attendance.break_in,
            clock_out: attendance.clock_out,
            status: attendance.status,
            remarks: attendance.remarks,
        });
    };

    const handleEdit = (field: keyof EditForm, value: string | null) => {
        setEditForm(prev => ({ ...prev, [field]: value }));
    };

    const saveEdit = (id: number) => {
        post(route('attendance.update', id), {
            preserveScroll: true,
            onSuccess: () => {
                setEditingId(null);
                toast.success('Attendance updated successfully');
            },
            onError: () => {
                toast.error('Failed to update attendance');
            }
        });
    };

    const approve = (id: number) => {
        post(route('attendance.approve', id), {
            preserveScroll: true,
            onSuccess: () => toast.success('Attendance approved'),
            onError: () => toast.error('Failed to approve attendance')
        });
    };

    const bulkApprove = () => {
        if (!data.selectedIds.length) {
            toast.error('Please select records to approve');
            return;
        }

        post(route('attendance.bulk-approve'), {
            preserveScroll: true,
            onSuccess: () => {
                setData('selectedIds', []);
                toast.success('Selected records approved');
            },
            onError: () => toast.error('Failed to approve records')
        });
    };

    const toggleSelect = (id: number) => {
        setData('selectedIds', 
            data.selectedIds.includes(id)
                ? data.selectedIds.filter(x => x !== id)
                : [...data.selectedIds, id]
        );
    };

    const selectAll = (checked: boolean) => {
        setData('selectedIds', 
            checked ? attendances.data.map(a => a.id) : []
        );
    };

    return (
        <>
            <Head title="Final Attendance" />

            <div className="max-w-7xl mx-auto p-6">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-semibold">Final Attendance</h1>
                    {can.approve && data.selectedIds.length > 0 && (
                        <Button onClick={bulkApprove}>
                            Approve Selected ({data.selectedIds.length})
                        </Button>
                    )}
                </div>

                {/* Filters */}
                <Card className="p-4 mb-6">
                    <div className="flex gap-4 flex-wrap">
                        <Input
                            placeholder="Search employee..."
                            value={data.search}
                            onChange={e => setData('search', e.target.value)}
                            className="max-w-xs"
                        />
                        <DateTimeRangePicker
                            startDate={data.date_from}
                            endDate={data.date_to}
                            startTime="00:00"
                            endTime="23:59"
                            onStartDateChange={(date) => setData('date_from', date)}
                            onEndDateChange={(date) => setData('date_to', date)}
                            onStartTimeChange={() => {}}
                            onEndTimeChange={() => {}}
                            onApply={() => {}}
                            onClear={() => {
                                setData({
                                    ...data,
                                    date_from: '',
                                    date_to: ''
                                });
                            }}
                        />
                        <Select value={data.status} onValueChange={val => setData('status', val)}>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Filter by status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="">All Status</SelectItem>
                                <SelectItem value="Present">Present</SelectItem>
                                <SelectItem value="Late">Late</SelectItem>
                                <SelectItem value="Absent">Absent</SelectItem>
                                <SelectItem value="On Leave">On Leave</SelectItem>
                                <SelectItem value="Holiday">Holiday</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </Card>

                {/* Records Table */}
                <Card>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[50px]">
                                    <Checkbox
                                        checked={data.selectedIds.length === attendances.data.length}
                                        onCheckedChange={selectAll}
                                    />
                                </TableHead>
                                <TableHead>Employee</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead>Clock In</TableHead>
                                <TableHead>Break</TableHead>
                                <TableHead>Clock Out</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Remarks</TableHead>
                                <TableHead>Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {attendances.data.map((attendance) => (
                                <TableRow key={attendance.id} className={
                                    cn({
                                        'opacity-60': attendance.approved_by,
                                    })
                                }>
                                    <TableCell>
                                        <Checkbox
                                            checked={data.selectedIds.includes(attendance.id)}
                                            onCheckedChange={() => toggleSelect(attendance.id)}
                                            disabled={!!attendance.approved_by}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <div className="font-medium">
                                            {attendance.employee.first_name} {attendance.employee.last_name}
                                        </div>
                                        <div className="text-sm text-muted-foreground">
                                            {attendance.employee.employee_number}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {dayjs(attendance.date).format('MMM DD, YYYY')}
                                    </TableCell>
                                    <TableCell>
                                        {editingId === attendance.id ? (
                                            <Input
                                                type="datetime-local"
                                                value={editForm.clock_in}
                                                onChange={e => handleEdit('clock_in', e.target.value)}
                                                className="w-40"
                                            />
                                        ) : (
                                            dayjs(attendance.clock_in).format('HH:mm:ss')
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        {attendance.break_out && attendance.break_in && (
                                            `${dayjs(attendance.break_out).format('HH:mm')} - ${dayjs(attendance.break_in).format('HH:mm')}`
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        {editingId === attendance.id ? (
                                            <Input
                                                type="datetime-local"
                                                value={editForm.clock_out}
                                                onChange={e => handleEdit('clock_out', e.target.value)}
                                                className="w-40"
                                            />
                                        ) : (
                                            dayjs(attendance.clock_out).format('HH:mm:ss')
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline">
                                            {attendance.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        {editingId === attendance.id ? (
                                            <Input
                                                value={editForm.remarks || ''}
                                                onChange={e => handleEdit('remarks', e.target.value)}
                                                className="w-40"
                                            />
                                        ) : (
                                            attendance.remarks
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        {editingId === attendance.id ? (
                                            <div className="flex gap-2">
                                                <Button
                                                    size="sm"
                                                    onClick={() => saveEdit(attendance.id)}
                                                    disabled={processing}
                                                >
                                                    Save
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => setEditingId(null)}
                                                >
                                                    Cancel
                                                </Button>
                                            </div>
                                        ) : (
                                            <div className="flex gap-2">
                                                {can.edit && !attendance.approved_by && (
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() => startEdit(attendance)}
                                                    >
                                                        Edit
                                                    </Button>
                                                )}
                                                {can.approve && !attendance.approved_by && (
                                                    <Button
                                                        size="sm"
                                                        onClick={() => approve(attendance.id)}
                                                    >
                                                        Approve
                                                    </Button>
                                                )}
                                            </div>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </Card>

                {/* Pagination */}
                <div className="mt-4 flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                        Showing {attendances.from}-{attendances.to} of {attendances.total} records
                    </div>
                    <div className="flex gap-2">
                        {attendances.links.map((link, i) => (
                            <Link
                                key={i}
                                href={link.url || '#'}
                                className={cn(
                                    "px-4 py-2 border rounded hover:bg-gray-50",
                                    {
                                        "bg-primary text-white hover:bg-primary-dark": link.active,
                                        "text-gray-600": !link.active,
                                        "opacity-50 cursor-not-allowed": !link.url,
                                    }
                                )}
                                preserveScroll
                            >
                                {link.label}
                            </Link>
                        ))}
                    </div>
                </div>
            </div>
        </>
    );
}