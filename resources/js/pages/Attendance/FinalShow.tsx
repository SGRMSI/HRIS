import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import { ArrowLeft, Calendar, CheckCircle2, Clock, Edit, Save, User, XCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface AttendanceProps {
    attendance: {
        id: number;
        employee: {
            id: number;
            name: string;
            department: string;
            company: string;
            position: string;
        };
        date: string;
        shift: {
            name: string;
            time_in: string;
            time_out: string;
            break_start?: string;
            break_end?: string;
        } | null;
        times: {
            clock_in: string | null;
            break_out: string | null;
            break_in: string | null;
            clock_out: string | null;
        };
        computations: {
            total_hours: number;
            total_minutes: number;
            total_rendered_hours: number;
            overtime_hours: string;
            undertime_hours: string;
            break_minutes: number;
            late_minutes: number;
        };
        status: string;
        remarks: string | null;
        approved_by: string | null;
        approved_at: string | null;
        created_by: string | null;
        created_at: string;
    };
    can: {
        edit: boolean;
        approve: boolean;
    };
}

export default function FinalShow({ attendance, can }: AttendanceProps) {
    const { flash } = usePage().props as any;
    const [isEditing, setIsEditing] = useState(false);
    const [showApproveModal, setShowApproveModal] = useState(false);
    const [isApproving, setIsApproving] = useState(false);

    const { data, setData, put, processing, errors, reset } = useForm({
        clock_in: attendance.times.clock_in || '',
        break_out: attendance.times.break_out || '',
        break_in: attendance.times.break_in || '',
        clock_out: attendance.times.clock_out || '',
        remarks: attendance.remarks || '',
    });

    // Show toast notifications
    useEffect(() => {
        if (flash?.success) {
            toast.success(flash.success);
        }
        if (flash?.error) {
            toast.error(flash.error);
        }
    }, [flash]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        put(route('attendance.final.update', attendance.id), {
            onSuccess: () => {
                setIsEditing(false);
                // Don't show toast here, backend flash message will handle it
            },
            onError: () => {
                toast.error('Failed to update attendance record.');
            },
        });
    };

    const handleCancelEdit = () => {
        reset();
        setIsEditing(false);
    };

    const handleApproveClick = () => {
        setShowApproveModal(true);
    };

    const handleApproveConfirm = () => {
        setIsApproving(true);
        router.post(
            route('attendance.final.bulk-approve'),
            { ids: [attendance.id] },
            {
                preserveScroll: false,
                onFinish: () => {
                    setIsApproving(false);
                    setShowApproveModal(false);
                },
            },
        );
    };

    const getStatusBadge = (status: string, approved: boolean) => {
        if (approved) {
            return <Badge className="bg-green-600">Approved</Badge>;
        }

        switch (status.toLowerCase()) {
            case 'present':
                return <Badge className="bg-green-100 text-green-800">Present</Badge>;
            case 'late':
                return <Badge variant="destructive">Late</Badge>;
            case 'undertime':
                return (
                    <Badge variant="outline" className="border-orange-600 text-orange-600">
                        Undertime
                    </Badge>
                );
            case 'absent':
                return <Badge variant="destructive">Absent</Badge>;
            default:
                return <Badge variant="secondary">{status}</Badge>;
        }
    };

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Attendance', href: '/attendance/upload' },
                { title: 'Final Attendance', href: '/attendance/final' },
                { title: 'Details', href: '#' },
            ]}
        >
            <Head title="Attendance Details" />

            <div className="space-y-6 p-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold">Attendance Details</h1>
                        <p className="mt-1 text-muted-foreground">View and edit attendance record</p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => router.visit(route('attendance.final.index'))}>
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to List
                        </Button>
                        {can.edit && !attendance.approved_by && (
                            <>
                                {isEditing ? (
                                    <Button onClick={handleCancelEdit} variant="outline">
                                        <XCircle className="mr-2 h-4 w-4" />
                                        Cancel
                                    </Button>
                                ) : (
                                    <Button onClick={() => setIsEditing(true)} variant="default">
                                        <Edit className="mr-2 h-4 w-4" />
                                        Edit Record
                                    </Button>
                                )}
                            </>
                        )}
                        {!attendance.approved_by && (
                            <Button onClick={handleApproveClick} className="bg-green-600 hover:bg-green-700">
                                <CheckCircle2 className="mr-2 h-4 w-4" />
                                Approve
                            </Button>
                        )}
                    </div>
                </div>

                {/* Approval Modal */}
                <Dialog open={showApproveModal} onOpenChange={setShowApproveModal}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Approve Attendance Record</DialogTitle>
                            <DialogDescription>
                                Are you sure you want to approve this attendance record? This action cannot be undone.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="py-4">
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Employee:</span>
                                    <span className="font-medium">{attendance.employee.name}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Date:</span>
                                    <span className="font-medium">{attendance.date}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Total Hours:</span>
                                    <span className="font-medium">
                                        {attendance.computations.total_hours}h {attendance.computations.total_minutes}m
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Status:</span>
                                    <span>{getStatusBadge(attendance.status, false)}</span>
                                </div>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setShowApproveModal(false)} disabled={isApproving}>
                                Cancel
                            </Button>
                            <Button onClick={handleApproveConfirm} disabled={isApproving} className="bg-green-600 hover:bg-green-700">
                                <CheckCircle2 className="mr-2 h-4 w-4" />
                                {isApproving ? 'Approving...' : 'Approve'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Employee Information */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <User className="h-5 w-5" />
                            Employee Information
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                            <div>
                                <Label className="text-xs text-muted-foreground">Employee Name</Label>
                                <p className="font-medium">{attendance.employee.name}</p>
                            </div>
                            <div>
                                <Label className="text-xs text-muted-foreground">Company</Label>
                                <p className="font-medium">{attendance.employee.company}</p>
                            </div>
                            <div>
                                <Label className="text-xs text-muted-foreground">Department</Label>
                                <p className="font-medium">{attendance.employee.department}</p>
                            </div>
                            <div>
                                <Label className="text-xs text-muted-foreground">Position</Label>
                                <p className="font-medium">{attendance.employee.position}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Attendance Information */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Calendar className="h-5 w-5" />
                            Attendance Information
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
                            <div>
                                <Label className="text-xs text-muted-foreground">Date</Label>
                                <p className="font-medium">{attendance.date}</p>
                            </div>
                            <div>
                                <Label className="text-xs text-muted-foreground">Shift</Label>
                                <p className="font-medium">{attendance.shift?.name || 'No Shift'}</p>
                            </div>
                            <div>
                                <Label className="text-xs text-muted-foreground">Status</Label>
                                <div>{getStatusBadge(attendance.status, !!attendance.approved_by)}</div>
                            </div>
                        </div>

                        {attendance.shift && (
                            <div className="mb-6 rounded-lg bg-muted/50 p-4">
                                <p className="mb-2 text-sm font-medium">Scheduled Shift Times</p>
                                <div className="grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
                                    <div>
                                        <Label className="text-xs text-muted-foreground">Clock In</Label>
                                        <p className="font-mono">{attendance.shift.time_in}</p>
                                    </div>
                                    {attendance.shift.break_start && (
                                        <div>
                                            <Label className="text-xs text-muted-foreground">Break Start</Label>
                                            <p className="font-mono">{attendance.shift.break_start}</p>
                                        </div>
                                    )}
                                    {attendance.shift.break_end && (
                                        <div>
                                            <Label className="text-xs text-muted-foreground">Break End</Label>
                                            <p className="font-mono">{attendance.shift.break_end}</p>
                                        </div>
                                    )}
                                    <div>
                                        <Label className="text-xs text-muted-foreground">Clock Out</Label>
                                        <p className="font-mono">{attendance.shift.time_out}</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        <form onSubmit={handleSubmit}>
                            <div className="space-y-4">
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                                    {/* Clock In */}
                                    <div>
                                        <Label htmlFor="clock_in">Clock In Time</Label>
                                        <Input
                                            id="clock_in"
                                            type="time"
                                            step="1"
                                            value={data.clock_in}
                                            onChange={(e) => setData('clock_in', e.target.value)}
                                            disabled={!isEditing || !!attendance.approved_by}
                                            className={isEditing && !attendance.approved_by ? 'border-blue-300' : ''}
                                        />
                                        {errors.clock_in && <p className="mt-1 text-xs text-red-600">{errors.clock_in}</p>}
                                    </div>

                                    {/* Break Out */}
                                    <div>
                                        <Label htmlFor="break_out">Break Out Time</Label>
                                        <Input
                                            id="break_out"
                                            type="time"
                                            step="1"
                                            value={data.break_out}
                                            onChange={(e) => setData('break_out', e.target.value)}
                                            disabled={!isEditing || !!attendance.approved_by}
                                            className={isEditing && !attendance.approved_by ? 'border-blue-300' : ''}
                                        />
                                        {errors.break_out && <p className="mt-1 text-xs text-red-600">{errors.break_out}</p>}
                                    </div>

                                    {/* Break In */}
                                    <div>
                                        <Label htmlFor="break_in">Break In Time</Label>
                                        <Input
                                            id="break_in"
                                            type="time"
                                            step="1"
                                            value={data.break_in}
                                            onChange={(e) => setData('break_in', e.target.value)}
                                            disabled={!isEditing || !!attendance.approved_by}
                                            className={isEditing && !attendance.approved_by ? 'border-blue-300' : ''}
                                        />
                                        {errors.break_in && <p className="mt-1 text-xs text-red-600">{errors.break_in}</p>}
                                    </div>

                                    {/* Clock Out */}
                                    <div>
                                        <Label htmlFor="clock_out">Clock Out Time</Label>
                                        <Input
                                            id="clock_out"
                                            type="time"
                                            step="1"
                                            value={data.clock_out}
                                            onChange={(e) => setData('clock_out', e.target.value)}
                                            disabled={!isEditing || !!attendance.approved_by}
                                            className={isEditing && !attendance.approved_by ? 'border-blue-300' : ''}
                                        />
                                        {errors.clock_out && <p className="mt-1 text-xs text-red-600">{errors.clock_out}</p>}
                                    </div>
                                </div>

                                {/* Remarks */}
                                {/* Remarks */}
                                <div>
                                    <Label htmlFor="remarks">Remarks / Notes</Label>
                                    <Textarea
                                        id="remarks"
                                        value={data.remarks}
                                        onChange={(e) => setData('remarks', e.target.value)}
                                        disabled={!isEditing || !!attendance.approved_by}
                                        placeholder="Add any notes or comments about this attendance record..."
                                        rows={3}
                                        className={isEditing && !attendance.approved_by ? 'border-blue-300' : ''}
                                    />
                                    {errors.remarks && <p className="mt-1 text-xs text-red-600">{errors.remarks}</p>}
                                </div>

                                {/* Save Button */}
                                {isEditing && (
                                    <div className="flex justify-end">
                                        <Button type="submit" disabled={processing}>
                                            <Save className="mr-2 h-4 w-4" />
                                            {processing ? 'Saving...' : 'Save Changes'}
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </form>
                    </CardContent>
                </Card>

                {/* Computations */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Clock className="h-5 w-5" />
                            Time Computations
                        </CardTitle>
                        <CardDescription>Automatically calculated based on clock times</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
                            <div className="rounded-lg bg-blue-50 p-4">
                                <Label className="text-xs text-muted-foreground">Total Hours</Label>
                                <p className="text-2xl font-bold text-blue-600">
                                    {attendance.computations.total_hours}h {attendance.computations.total_minutes}m
                                </p>
                            </div>
                            <div className="rounded-lg bg-cyan-50 p-4">
                                <Label className="text-xs text-muted-foreground">Total Rendered</Label>
                                <p className="text-2xl font-bold text-cyan-600">{attendance.computations.total_rendered_hours ?? '0.00'}h</p>
                            </div>
                            <div className="rounded-lg bg-orange-50 p-4">
                                <Label className="text-xs text-muted-foreground">Break Time</Label>
                                <p className="text-2xl font-bold text-orange-600">{attendance.computations.break_minutes} min</p>
                            </div>
                            <div className="rounded-lg bg-red-50 p-4">
                                <Label className="text-xs text-muted-foreground">Late</Label>
                                <p className="text-2xl font-bold text-red-600">{attendance.computations.late_minutes} min</p>
                            </div>
                            <div className="rounded-lg bg-purple-50 p-4">
                                <Label className="text-xs text-muted-foreground">Overtime</Label>
                                <p className="text-2xl font-bold text-purple-600">
                                    {Math.round(parseFloat(attendance.computations.overtime_hours) * 60)} min
                                </p>
                            </div>
                            <div className="rounded-lg bg-yellow-50 p-4">
                                <Label className="text-xs text-muted-foreground">Undertime</Label>
                                <p className="text-2xl font-bold text-yellow-600">
                                    {Math.round(parseFloat(attendance.computations.undertime_hours) * 60)} min
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Approval Status */}
                {attendance.approved_by && (
                    <Alert className="border-green-200 bg-green-50">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        <AlertDescription className="text-green-800">
                            <strong>Approved</strong> by {attendance.approved_by} on {attendance.approved_at}
                        </AlertDescription>
                    </Alert>
                )}

                {/* Metadata */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm">Record Information</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <Label className="text-xs text-muted-foreground">Created By</Label>
                                <p>{attendance.created_by || 'System'}</p>
                            </div>
                            <div>
                                <Label className="text-xs text-muted-foreground">Created At</Label>
                                <p>{attendance.created_at}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
