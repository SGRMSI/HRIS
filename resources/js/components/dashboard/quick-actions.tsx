import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { useAttendanceExport } from '@/hooks/use-attendance-export';
import { cn } from '@/lib/utils';
import { PayrollPeriod } from '@/types/payroll';
import { Link } from '@inertiajs/react';
import { format } from 'date-fns';
import {
    BarChart3,
    Calendar as CalendarIcon,
    CalendarPlus,
    DollarSign,
    Download,
    FileSpreadsheet,
    FileText,
    Loader2,
    Upload,
    UserPlus,
} from 'lucide-react';
import { useEffect, useState } from 'react';

interface QuickAction {
    title: string;
    description: string;
    href?: string;
    icon: React.ComponentType<{ className?: string }>;
    color: string;
    bgColor: string;
    onClick?: () => void;
    isLoading?: boolean;
}

export function QuickActions() {
    // Following AI Agent Instructions: Reusable hooks pattern
    const { isExporting, exportToExcel } = useAttendanceExport();

    // Date range state for exports
    const [dateFrom, setDateFrom] = useState<Date>();
    const [dateTo, setDateTo] = useState<Date>();

    // Modal states
    const [showAttendanceModal, setShowAttendanceModal] = useState(false);
    const [showPayrollModal, setShowPayrollModal] = useState(false);

    // Payroll periods state
    const [payrollPeriods, setPayrollPeriods] = useState<PayrollPeriod[]>([]);
    const [loadingPeriods, setLoadingPeriods] = useState(false);

    // All routes verified against routes/attendance.php
    const actions: QuickAction[] = [
        {
            title: 'Add Employee',
            description: 'Register new employee',
            href: route('employee.create'),
            icon: UserPlus,
            color: 'text-blue-600 dark:text-blue-400',
            bgColor: 'bg-blue-100 dark:bg-blue-900/30',
        },
        {
            title: 'Upload Attendance',
            description: 'Import attendance logs',
            href: route('attendance.raw.index'),
            icon: Upload,
            color: 'text-green-600 dark:text-green-400',
            bgColor: 'bg-green-100 dark:bg-green-900/30',
        },
        {
            title: 'Manage Schedules',
            description: 'Assign shifts',
            href: route('attendance.schedules.index'),
            icon: CalendarPlus,
            color: 'text-orange-600 dark:text-orange-400',
            bgColor: 'bg-orange-100 dark:bg-orange-900/30',
        },
        {
            title: 'Leave Requests',
            description: 'View and approve',
            href: route('attendance.leaves.index'),
            icon: FileText,
            color: 'text-pink-600 dark:text-pink-400',
            bgColor: 'bg-pink-100 dark:bg-pink-900/30',
        },
        {
            title: 'Attendance Reports',
            description: 'View final records',
            href: route('attendance.final.index'),
            icon: BarChart3,
            color: 'text-indigo-600 dark:text-indigo-400',
            bgColor: 'bg-indigo-100 dark:bg-indigo-900/30',
        },
    ];

    // Fetch payroll periods when modal opens
    useEffect(() => {
        if (showPayrollModal && payrollPeriods.length === 0) {
            setLoadingPeriods(true);
            fetch('/api/payroll-periods')
                .then((response) => response.json())
                .then((data) => {
                    setPayrollPeriods(data.periods || []);
                })
                .catch((error) => {
                    console.error('Failed to fetch payroll periods:', error);
                    setPayrollPeriods([]);
                })
                .finally(() => {
                    setLoadingPeriods(false);
                });
        }
    }, [showPayrollModal, payrollPeriods.length]);

    const handleExportAttendanceClick = () => {
        setShowAttendanceModal(true);
    };

    const handleExportAttendance = () => {
        const filters = {
            date_from: dateFrom ? format(dateFrom, 'yyyy-MM-dd') : undefined,
            date_to: dateTo ? format(dateTo, 'yyyy-MM-dd') : undefined,
        };
        exportToExcel(filters);
        setShowAttendanceModal(false);
    };

    const handleExportPayrollClick = () => {
        setShowPayrollModal(true);
    };

    const handleExportPayroll = (periodId: number) => {
        window.location.href = route('payroll.export', periodId);
        setShowPayrollModal(false);
    };

    return (
        <div className="space-y-6">
            {/* Quick Actions Card */}
            <Card>
                <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                    <CardDescription>Common tasks and shortcuts</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
                        {actions.map((action) => {
                            const Icon = action.icon;
                            const content = (
                                <>
                                    <div className={`rounded-lg p-2 ${action.bgColor}`}>
                                        {action.isLoading ? (
                                            <Loader2 className={`h-5 w-5 animate-spin ${action.color}`} />
                                        ) : (
                                            <Icon className={`h-5 w-5 ${action.color}`} />
                                        )}
                                    </div>
                                    <div className="text-left">
                                        <p className="text-sm font-semibold">{action.title}</p>
                                        <p className="text-xs text-muted-foreground">{action.description}</p>
                                    </div>
                                </>
                            );

                            if (action.href) {
                                return (
                                    <Link key={action.title} href={action.href}>
                                        <Button
                                            variant="ghost"
                                            className="h-auto w-full flex-col items-start gap-2 p-4 transition-all hover:bg-accent hover:shadow-md dark:hover:bg-gray-900/50"
                                        >
                                            {content}
                                        </Button>
                                    </Link>
                                );
                            }

                            return (
                                <Button
                                    key={action.title}
                                    variant="ghost"
                                    onClick={action.onClick}
                                    disabled={action.isLoading}
                                    className="h-auto w-full flex-col items-start gap-2 p-4 transition-all hover:bg-accent hover:shadow-md dark:hover:bg-gray-900/50"
                                >
                                    {content}
                                </Button>
                            );
                        })}
                    </div>
                </CardContent>
            </Card>

            {/* Export Section Card */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <FileSpreadsheet className="h-5 w-5" />
                        Export Data
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Separator />

                    {/* Export Buttons */}
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                        {/* Export Attendance */}
                        <Button onClick={handleExportAttendanceClick} className="flex items-center justify-center gap-2" variant="default">
                            <FileSpreadsheet className="h-4 w-4" />
                            Export Attendance
                        </Button>

                        {/* Export Payroll */}
                        <Button onClick={handleExportPayrollClick} className="flex items-center justify-center gap-2" variant="outline">
                            <DollarSign className="h-4 w-4" />
                            Export Payroll
                        </Button>
                    </div>

                    {/* Helper Text */}
                    <p className="text-xs text-muted-foreground">Click export buttons to export attendance and payroll data</p>
                </CardContent>
            </Card>

            {/* Attendance Export Modal */}
            <Dialog open={showAttendanceModal} onOpenChange={setShowAttendanceModal}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>Export Attendance Data</DialogTitle>
                        <DialogDescription>Select a date range to filter the attendance records you want to export</DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 py-4">
                        {/* Date From */}
                        <div className="space-y-2">
                            <Label htmlFor="export-date-from">Date From</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        id="export-date-from"
                                        variant="outline"
                                        className={cn('w-full justify-start text-left font-normal', !dateFrom && 'text-muted-foreground')}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {dateFrom ? format(dateFrom, 'PPP') : 'Pick a date'}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[300px] p-0" align="start">
                                    <Calendar
                                        mode="single"
                                        selected={dateFrom}
                                        onSelect={setDateFrom}
                                        captionLayout="dropdown"
                                        fromYear={2020}
                                        toYear={2030}
                                        className="w-full"
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>

                        {/* Date To */}
                        <div className="space-y-2">
                            <Label htmlFor="export-date-to">Date To</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        id="export-date-to"
                                        variant="outline"
                                        className={cn('w-full justify-start text-left font-normal', !dateTo && 'text-muted-foreground')}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {dateTo ? format(dateTo, 'PPP') : 'Pick a date'}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[300px] p-0" align="start">
                                    <Calendar
                                        mode="single"
                                        selected={dateTo}
                                        onSelect={setDateTo}
                                        captionLayout="dropdown"
                                        fromYear={2020}
                                        toYear={2030}
                                        className="w-full"
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowAttendanceModal(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleExportAttendance} disabled={isExporting}>
                            {isExporting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Exporting...
                                </>
                            ) : (
                                <>
                                    <Download className="mr-2 h-4 w-4" />
                                    Export to Excel
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Payroll Export Modal */}
            <Dialog open={showPayrollModal} onOpenChange={setShowPayrollModal}>
                <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                        <DialogTitle>Export Payroll Data</DialogTitle>
                        <DialogDescription>Select a payroll period to export as CSV</DialogDescription>
                    </DialogHeader>

                    <div className="max-h-[400px] overflow-y-auto py-4">
                        {loadingPeriods ? (
                            <div className="flex items-center justify-center py-8">
                                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                            </div>
                        ) : payrollPeriods.length === 0 ? (
                            <p className="py-8 text-center text-muted-foreground">No payroll periods found</p>
                        ) : (
                            <div className="space-y-2">
                                {payrollPeriods.map((period) => (
                                    <Button
                                        key={period.period_id}
                                        variant="outline"
                                        className="w-full justify-between"
                                        onClick={() => handleExportPayroll(period.period_id)}
                                    >
                                        <div className="text-left">
                                            <div className="font-semibold">{period.period_name}</div>
                                            <div className="text-xs text-muted-foreground">
                                                {format(new Date(period.date_from), 'MMM d, yyyy')} -{' '}
                                                {format(new Date(period.date_to), 'MMM d, yyyy')}
                                            </div>
                                        </div>
                                        <Download className="ml-2 h-4 w-4" />
                                    </Button>
                                ))}
                            </div>
                        )}
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowPayrollModal(false)}>
                            Close
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
