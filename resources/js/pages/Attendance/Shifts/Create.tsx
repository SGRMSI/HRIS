import AppLayout from '@/layouts/app-layout';
import { Head, Link, useForm } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Save, X, Moon, Clock } from 'lucide-react';
import { FormEventHandler, useEffect, useState } from 'react';

interface Props {
    defaultGracePeriod: number;
}

export default function ShiftsCreate({ defaultGracePeriod }: Props) {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        description: '',
        time_in: '',
        time_out: '',
        break_start: '',
        break_end: '',
        grace_period: defaultGracePeriod.toString(),
    });

    const [isOvernight, setIsOvernight] = useState(false);
    const [workingHours, setWorkingHours] = useState<number | null>(null);
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
            setIsOvernight(false);
            setWorkingHours(null);
        }
    }, [data.time_in, data.time_out, data.break_start, data.break_end]);

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('attendance.shifts.store'));
    };

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Attendance', href: '/attendance/upload' },
                { title: 'Shifts', href: '/attendance/shifts' },
                { title: 'Create', href: '/attendance/shifts/create' },
            ]}
        >
            <Head title="Create Shift" />

            <div className="space-y-6 p-6 md:p-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold">Create New Shift</h1>
                        <p className="text-muted-foreground mt-1">Add a new work shift</p>
                    </div>
                    <Link href={route('attendance.shifts.index')}>
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
                                    <CardTitle>Shift Information</CardTitle>
                                    <CardDescription>
                                        Define the shift name, times, and break periods
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

                                    {/* Grace Period */}
                                    <div className="space-y-2">
                                        <Label htmlFor="grace_period">Grace Period (minutes)</Label>
                                        <Input
                                            id="grace_period"
                                            type="number"
                                            min="0"
                                            max="60"
                                            value={data.grace_period}
                                            onChange={(e) => setData('grace_period', e.target.value)}
                                            className={errors.grace_period ? 'border-red-500' : ''}
                                        />
                                        <p className="text-sm text-muted-foreground">
                                            Late threshold after clock-in time (0-60 minutes)
                                        </p>
                                        {errors.grace_period && (
                                            <p className="text-sm text-red-500">{errors.grace_period}</p>
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
                                            {processing ? 'Creating...' : 'Create Shift'}
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
                                        {data.grace_period && parseInt(data.grace_period) > 0 && (
                                            <div className="flex justify-between text-sm">
                                                <span className="text-muted-foreground">Grace Period:</span>
                                                <span className="font-medium">{data.grace_period} min</span>
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
