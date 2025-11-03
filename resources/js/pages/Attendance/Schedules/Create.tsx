import AppLayout from '@/layouts/app-layout';
import { Head, Link, useForm } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Save, X, Calendar, AlertTriangle } from 'lucide-react';
import { FormEventHandler, useState } from 'react';

interface Employee {
    id: number;
    name: string;
    employee_number: string;
    department: string;
}

interface Shift {
    shift_id: number;
    name: string;
    time_in: string;
    time_out: string;
}

interface Props {
    employees: Employee[];
    shifts: Shift[];
}

export default function SchedulesCreate({ employees = [], shifts = [] }: Props) {
    const { data, setData, post, processing, errors } = useForm({
        employee_id: '',
        shift_id: '',
        date_start: '',
        date_end: '',
        is_holiday: false,
    });

    const [showConflictWarning, setShowConflictWarning] = useState(false);

    const selectedEmployee = employees.find(e => e.id.toString() === data.employee_id);
    const selectedShift = shifts.find(s => s.shift_id.toString() === data.shift_id);

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('attendance.schedules.store'));
    };

    const formatDate = (date: string) => {
        if (!date) return '';
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
                { title: 'Schedules', href: '/attendance/schedules' },
                { title: 'Create', href: '/attendance/schedules/create' },
            ]}
        >
            <Head title="Create Schedule" />

            <div className="space-y-6 p-6 md:p-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold">Create Schedule</h1>
                        <p className="text-muted-foreground mt-1">Assign shift to employee</p>
                    </div>
                    <Link href={route('attendance.schedules.index')}>
                        <Button variant="outline">
                            <X className="mr-2 h-4 w-4" />
                            Cancel
                        </Button>
                    </Link>
                </div>

                <form onSubmit={submit}>
                    <div className="grid gap-6 md:grid-cols-3">
                        {/* Main Form */}
                        <div className="md:col-span-2">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Schedule Information</CardTitle>
                                    <CardDescription>
                                        Assign a shift schedule to an employee
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    {/* Employee Selection */}
                                    <div className="space-y-2">
                                        <Label htmlFor="employee_id">Employee *</Label>
                                        <Select
                                            value={data.employee_id}
                                            onValueChange={(value) => setData('employee_id', value)}
                                        >
                                            <SelectTrigger className={errors.employee_id ? 'border-red-500' : ''}>
                                                <SelectValue placeholder="Select employee" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {employees.map((employee) => (
                                                    <SelectItem key={employee.id} value={employee.id.toString()}>
                                                        {employee.name} - {employee.department} (#{employee.employee_number})
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {errors.employee_id && (
                                            <p className="text-sm text-red-500">{errors.employee_id}</p>
                                        )}
                                    </div>

                                    {/* Shift Selection */}
                                    <div className="space-y-2">
                                        <Label htmlFor="shift_id">Shift *</Label>
                                        <Select
                                            value={data.shift_id}
                                            onValueChange={(value) => setData('shift_id', value)}
                                        >
                                            <SelectTrigger className={errors.shift_id ? 'border-red-500' : ''}>
                                                <SelectValue placeholder="Select shift" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {shifts.map((shift) => (
                                                    <SelectItem key={shift.shift_id} value={shift.shift_id.toString()}>
                                                        {shift.name} ({shift.time_in} - {shift.time_out})
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {errors.shift_id && (
                                            <p className="text-sm text-red-500">{errors.shift_id}</p>
                                        )}
                                    </div>

                                    {/* Date Range */}
                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <div className="space-y-2">
                                            <Label htmlFor="date_start">Start Date *</Label>
                                            <Input
                                                id="date_start"
                                                type="date"
                                                value={data.date_start}
                                                onChange={(e) => setData('date_start', e.target.value)}
                                                className={errors.date_start ? 'border-red-500' : ''}
                                                min={new Date().toISOString().split('T')[0]}
                                            />
                                            {errors.date_start && (
                                                <p className="text-sm text-red-500">{errors.date_start}</p>
                                            )}
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="date_end">End Date (Optional)</Label>
                                            <Input
                                                id="date_end"
                                                type="date"
                                                value={data.date_end}
                                                onChange={(e) => setData('date_end', e.target.value)}
                                                className={errors.date_end ? 'border-red-500' : ''}
                                                min={data.date_start || new Date().toISOString().split('T')[0]}
                                            />
                                            <p className="text-sm text-muted-foreground">
                                                Leave empty for ongoing schedule
                                            </p>
                                            {errors.date_end && (
                                                <p className="text-sm text-red-500">{errors.date_end}</p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Submit Button */}
                                    <div className="flex justify-end gap-3 pt-4">
                                        <Link href={route('attendance.schedules.index')}>
                                            <Button type="button" variant="outline">
                                                Cancel
                                            </Button>
                                        </Link>
                                        <Button type="submit" disabled={processing}>
                                            <Save className="mr-2 h-4 w-4" />
                                            {processing ? 'Creating...' : 'Create Schedule'}
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Summary Sidebar */}
                        <div className="space-y-4">
                            {(errors.date_start && errors.date_start.includes('overlap')) && (
                                <Alert variant="destructive">
                                    <AlertTriangle className="h-4 w-4" />
                                    <AlertDescription>
                                        <strong>Schedule Conflict</strong>
                                        <p className="mt-1 text-sm">
                                            This schedule overlaps with an existing schedule for this employee.
                                        </p>
                                    </AlertDescription>
                                </Alert>
                            )}

                            {selectedEmployee && selectedShift && data.date_start && (
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-base flex items-center gap-2">
                                            <Calendar className="h-4 w-4" />
                                            Schedule Summary
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                        <div>
                                            <div className="text-sm text-muted-foreground">Employee</div>
                                            <div className="font-medium">{selectedEmployee.name}</div>
                                            <div className="text-sm text-gray-500">
                                                {selectedEmployee.department}
                                            </div>
                                        </div>

                                        <div className="border-t pt-3">
                                            <div className="text-sm text-muted-foreground">Shift</div>
                                            <div className="font-medium">{selectedShift.name}</div>
                                            <div className="text-sm text-gray-500">
                                                {selectedShift.time_in} - {selectedShift.time_out}
                                            </div>
                                        </div>

                                        <div className="border-t pt-3">
                                            <div className="text-sm text-muted-foreground">Period</div>
                                            <div className="font-medium">
                                                {formatDate(data.date_start)}
                                            </div>
                                            <div className="text-sm text-gray-500">
                                                {data.date_end ? (
                                                    <>to {formatDate(data.date_end)}</>
                                                ) : (
                                                    'Ongoing'
                                                )}
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                            <Alert>
                                <AlertCircle className="h-4 w-4" />
                                <AlertDescription>
                                    <strong>Important</strong>
                                    <ul className="mt-2 list-disc list-inside text-sm space-y-1">
                                        <li>Start date must be today or future</li>
                                        <li>End date must be after start date</li>
                                        <li>Overlapping schedules will be rejected</li>
                                    </ul>
                                </AlertDescription>
                            </Alert>
                        </div>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
