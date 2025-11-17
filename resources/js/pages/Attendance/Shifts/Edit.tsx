import AppLayout from '@/layouts/app-layout';
import { Head, Link, useForm, router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Save, X, Moon, Clock, AlertTriangle, Users, FileText } from 'lucide-react';
import { FormEventHandler, useEffect, useState } from 'react';
import { Checkbox } from '@/components/ui/checkbox';

interface LateRule {
    threshold_minutes: number;
    deduction_minutes: number;
}

interface Shift {
    id: number;
    name: string;
    description: string | null;
    time_in: string;
    time_out: string;
    break_start: string | null;
    break_end: string | null;
    include_saturday: boolean;
    include_sunday: boolean;
    late_rules: LateRule[];
    working_hours: number;
    is_overnight: boolean;
}

interface Impact {
    active_schedules: number;
    recent_attendances: number;
    has_impact: boolean;
}

interface Props {
    shift: Shift;
    impact: Impact;
}

interface ShiftFormData {
    name: string;
    description: string;
    time_in: string;
    time_out: string;
    break_start: string;
    break_end: string;
    include_saturday: boolean;
    include_sunday: boolean;
}

export default function ShiftsEdit({ shift, impact }: Props) {
    const { data, setData, put, processing, errors } = useForm({
        name: shift.name || '',
        description: shift.description || '',
        time_in: shift.time_in || '',
        time_out: shift.time_out || '',
        break_start: shift.break_start || '',
        break_end: shift.break_end || '',
        include_saturday: shift.include_saturday || false,
        include_sunday: shift.include_sunday || false,
    });

    const [lateRules, setLateRules] = useState<LateRule[]>(shift.late_rules || []);
    const [isOvernight, setIsOvernight] = useState(shift.is_overnight);
    const [workingHours, setWorkingHours] = useState<number | null>(shift.working_hours);
    const [breakDuration, setBreakDuration] = useState<number | null>(null);

    // Calculate if shift is overnight
    useEffect(() => {
        if (data.time_in && data.time_out) {
            const [inHour, inMin] = data.time_in.split(':').map(Number);
            const [outHour, outMin] = data.time_out.split(':').map(Number);
            
            const overnight = outHour < inHour || (outHour === inHour && outMin < inMin);
            setIsOvernight(overnight);

            // Calculate working hours
            let totalMinutes: number;
            if (overnight) {
                totalMinutes = (24 * 60) - (inHour * 60 + inMin) + (outHour * 60 + outMin);
            } else {
                totalMinutes = (outHour * 60 + outMin) - (inHour * 60 + inMin);
            }

            // Subtract break time if provided
            if (data.break_start && data.break_end) {
                const [breakStartHour, breakStartMin] = data.break_start.split(':').map(Number);
                const [breakEndHour, breakEndMin] = data.break_end.split(':').map(Number);
                const breakMins = (breakEndHour * 60 + breakEndMin) - (breakStartHour * 60 + breakStartMin);
                setBreakDuration(breakMins);
                totalMinutes -= breakMins;
            } else {
                setBreakDuration(null);
            }

            setWorkingHours(totalMinutes / 60);
        } else {
            setIsOvernight(shift.is_overnight);
            setWorkingHours(shift.working_hours);
        }
    }, [data.time_in, data.time_out, data.break_start, data.break_end, shift.is_overnight, shift.working_hours]);

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        router.put(route('attendance.shifts.update', shift.id), {
            ...data,
            late_rules: lateRules,
        } as any, {
            onSuccess: () => {
                // Optional success handling
            }
        });
    };

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Attendance', href: '/attendance/upload' },
                { title: 'Shifts', href: '/attendance/shifts' },
                { title: 'Edit', href: '#' },
            ]}
        >
            <Head title="Edit Shift" />

            <div className="space-y-6 p-6 md:p-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold">Edit Shift</h1>
                        <p className="text-muted-foreground mt-1">Update shift information</p>
                    </div>
                    <Link href={route('attendance.shifts.index')}>
                        <Button variant="outline">
                            <X className="mr-2 h-4 w-4" />
                            Cancel
                        </Button>
                    </Link>
                </div>

                {impact.has_impact && (
                    <Alert>
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                            <strong>This shift is currently in use</strong>
                            <div className="mt-2 space-y-1 text-sm">
                                <div className="flex items-center gap-2">
                                    <Users className="h-3 w-3" />
                                    <span>{impact.active_schedules} active employee schedule(s)</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <FileText className="h-3 w-3" />
                                    <span>{impact.recent_attendances} recent attendance record(s)</span>
                                </div>
                            </div>
                            <p className="mt-2 text-sm">
                                Changes will affect future attendance calculations. Existing records will remain unchanged.
                            </p>
                        </AlertDescription>
                    </Alert>
                )}

                <form onSubmit={submit}>
                    <div className="grid gap-6 md:grid-cols-3">
                        {/* Main Form */}
                        <div className="md:col-span-2">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Shift Information</CardTitle>
                                    <CardDescription>
                                        Update the shift name, times, and break periods
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    {/* Name */}
                                    <div className="space-y-2">
                                        <Label htmlFor="name">Shift Name *</Label>
                                        <Input
                                            id="name"
                                            value={data.name}
                                            onChange={(e) => setData('name', e.target.value)}
                                            placeholder="e.g., Morning Shift, Night Shift"
                                            className={errors.name ? 'border-red-500' : ''}
                                        />
                                        {errors.name && (
                                            <p className="text-sm text-red-500">{errors.name}</p>
                                        )}
                                    </div>

                                    {/* Description */}
                                    <div className="space-y-2">
                                        <Label htmlFor="description">Description</Label>
                                        <Textarea
                                            id="description"
                                            value={data.description}
                                            onChange={(e) => setData('description', e.target.value)}
                                            placeholder="Optional description for this shift"
                                            rows={3}
                                        />
                                        {errors.description && (
                                            <p className="text-sm text-red-500">{errors.description}</p>
                                        )}
                                    </div>

                                    {/* Shift Times */}
                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <div className="space-y-2">
                                            <Label htmlFor="time_in">Time In *</Label>
                                            <Input
                                                id="time_in"
                                                type="time"
                                                value={data.time_in}
                                                onChange={(e) => setData('time_in', e.target.value)}
                                                className={errors.time_in ? 'border-red-500' : ''}
                                            />
                                            {errors.time_in && (
                                                <p className="text-sm text-red-500">{errors.time_in}</p>
                                            )}
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="time_out">Time Out *</Label>
                                            <Input
                                                id="time_out"
                                                type="time"
                                                value={data.time_out}
                                                onChange={(e) => setData('time_out', e.target.value)}
                                                className={errors.time_out ? 'border-red-500' : ''}
                                            />
                                            {errors.time_out && (
                                                <p className="text-sm text-red-500">{errors.time_out}</p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Break Times */}
                                    <div className="space-y-4">
                                        <Label>Break Time (Optional)</Label>
                                        <div className="grid gap-4 sm:grid-cols-2">
                                            <div className="space-y-2">
                                                <Label htmlFor="break_start" className="text-sm text-muted-foreground">
                                                    Break Start
                                                </Label>
                                                <Input
                                                    id="break_start"
                                                    type="time"
                                                    value={data.break_start}
                                                    onChange={(e) => setData('break_start', e.target.value)}
                                                    className={errors.break_start ? 'border-red-500' : ''}
                                                />
                                                {errors.break_start && (
                                                    <p className="text-sm text-red-500">{errors.break_start}</p>
                                                )}
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="break_end" className="text-sm text-muted-foreground">
                                                    Break End
                                                </Label>
                                                <Input
                                                    id="break_end"
                                                    type="time"
                                                    value={data.break_end}
                                                    onChange={(e) => setData('break_end', e.target.value)}
                                                    className={errors.break_end ? 'border-red-500' : ''}
                                                />
                                                {errors.break_end && (
                                                    <p className="text-sm text-red-500">{errors.break_end}</p>
                                                )}
                                            </div>
                                        </div>
                                        {breakDuration !== null && (
                                            <p className="text-sm text-muted-foreground">
                                                Break duration: {breakDuration} minutes ({(breakDuration / 60).toFixed(2)} hours)
                                            </p>
                                        )}
                                    </div>

                                    {/* Weekend Inclusion */}
                                    <div className="space-y-4">
                                        <Label>Weekend Coverage</Label>
                                        <div className="grid gap-4 sm:grid-cols-2">
                                            <div className="flex items-center space-x-2">
                                                <Checkbox
                                                    id="include_saturday"
                                                    checked={data.include_saturday as boolean}
                                                    onCheckedChange={(checked) => 
                                                        setData('include_saturday', !!checked as any)
                                                    }
                                                />
                                                <Label 
                                                    htmlFor="include_saturday" 
                                                    className="text-sm font-normal cursor-pointer"
                                                >
                                                    Include Saturday
                                                </Label>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <Checkbox
                                                    id="include_sunday"
                                                    checked={data.include_sunday as boolean}
                                                    onCheckedChange={(checked) => 
                                                        setData('include_sunday', !!checked as any)
                                                    }
                                                />
                                                <Label 
                                                    htmlFor="include_sunday" 
                                                    className="text-sm font-normal cursor-pointer"
                                                >
                                                    Include Sunday
                                                </Label>
                                            </div>
                                        </div>
                                        <p className="text-sm text-muted-foreground">
                                            Check the days this shift covers
                                        </p>
                                    </div>

                                    {/* Late Rules */}
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <Label>Late Deduction Rules</Label>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setLateRules([
                                                    ...lateRules,
                                                    { threshold_minutes: 1, deduction_minutes: 1 }
                                                ])}
                                            >
                                                Add Rule
                                            </Button>
                                        </div>
                                        <p className="text-sm text-muted-foreground">
                                            Define deductions for late arrivals. Employees 2+ hours late are automatically marked absent.
                                        </p>
                                        
                                        {lateRules.length > 0 && (
                                            <div className="space-y-3">
                                                {lateRules.map((rule, index) => (
                                                    <div key={index} className="flex items-end gap-3">
                                                        <div className="flex-1">
                                                            <Label htmlFor={`threshold_${index}`} className="text-xs">
                                                                If late by (minutes)
                                                            </Label>
                                                            <Input
                                                                id={`threshold_${index}`}
                                                                type="number"
                                                                min="1"
                                                                value={rule.threshold_minutes}
                                                                onChange={(e) => {
                                                                    const newRules = [...lateRules];
                                                                    newRules[index].threshold_minutes = parseInt(e.target.value) || 1;
                                                                    setLateRules(newRules);
                                                                }}
                                                            />
                                                        </div>
                                                        <div className="flex-1">
                                                            <Label htmlFor={`deduction_${index}`} className="text-xs">
                                                                Deduct (minutes)
                                                            </Label>
                                                            <Input
                                                                id={`deduction_${index}`}
                                                                type="number"
                                                                min="1"
                                                                value={rule.deduction_minutes}
                                                                onChange={(e) => {
                                                                    const newRules = [...lateRules];
                                                                    newRules[index].deduction_minutes = parseInt(e.target.value) || 1;
                                                                    setLateRules(newRules);
                                                                }}
                                                            />
                                                        </div>
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => {
                                                                const newRules = lateRules.filter((_, i) => i !== index);
                                                                setLateRules(newRules);
                                                            }}
                                                        >
                                                            <X className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                        
                                        {lateRules.length === 0 && (
                                            <div className="text-sm text-muted-foreground text-center py-4 border-2 border-dashed rounded-lg">
                                                No late rules defined. Click "Add Rule" to create one.
                                            </div>
                                        )}
                                    </div>

                                    {/* Submit Button */}
                                    <div className="flex justify-end gap-3 pt-4">
                                        <Link href={route('attendance.shifts.index')}>
                                            <Button type="button" variant="outline">
                                                Cancel
                                            </Button>
                                        </Link>
                                        <Button type="submit" disabled={processing}>
                                            <Save className="mr-2 h-4 w-4" />
                                            {processing ? 'Updating...' : 'Update Shift'}
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Summary Sidebar */}
                        <div className="space-y-4">
                            {isOvernight && (
                                <Alert>
                                    <Moon className="h-4 w-4" />
                                    <AlertDescription>
                                        <strong>Overnight Shift Detected</strong>
                                        <p className="mt-1 text-sm">
                                            This shift crosses midnight. Make sure the times are correct.
                                        </p>
                                    </AlertDescription>
                                </Alert>
                            )}

                            {workingHours !== null && (
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-base flex items-center gap-2">
                                            <Clock className="h-4 w-4" />
                                            Shift Summary
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-muted-foreground">Time In:</span>
                                            <span className="font-mono font-medium">{data.time_in}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-muted-foreground">Time Out:</span>
                                            <span className="font-mono font-medium">{data.time_out}</span>
                                        </div>
                                        {breakDuration !== null && (
                                            <div className="flex justify-between text-sm">
                                                <span className="text-muted-foreground">Break:</span>
                                                <span className="font-medium">
                                                    {breakDuration} min
                                                </span>
                                            </div>
                                        )}
                                        <div className="flex justify-between border-t pt-3">
                                            <span className="font-medium">Working Hours:</span>
                                            <span className="font-mono text-lg font-bold">
                                                {workingHours.toFixed(2)} hrs
                                            </span>
                                        </div>
                                        {(data.include_saturday || data.include_sunday) && (
                                            <div className="border-t pt-3">
                                                <span className="text-sm text-muted-foreground">Weekend:</span>
                                                <div className="flex gap-2 mt-1">
                                                    {data.include_saturday && (
                                                        <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">Sat</span>
                                                    )}
                                                    {data.include_sunday && (
                                                        <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">Sun</span>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                        {lateRules.length > 0 && (
                                            <div className="border-t pt-3">
                                                <span className="text-sm text-muted-foreground">Late Rules:</span>
                                                <div className="mt-2 space-y-1">
                                                    {lateRules.map((rule, i) => (
                                                        <div key={i} className="text-xs flex justify-between">
                                                            <span>{rule.threshold_minutes} min late →</span>
                                                            <span className="font-medium">{rule.deduction_minutes} min deduction</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            )}

                            {(workingHours !== null && workingHours < 1) && (
                                <Alert variant="destructive">
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertDescription>
                                        Shift duration must be at least 1 hour
                                    </AlertDescription>
                                </Alert>
                            )}

                            {(workingHours !== null && workingHours > 24) && (
                                <Alert variant="destructive">
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertDescription>
                                        Shift duration cannot exceed 24 hours
                                    </AlertDescription>
                                </Alert>
                            )}
                        </div>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
