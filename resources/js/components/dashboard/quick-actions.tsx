import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { useAttendanceExport } from '@/hooks/use-attendance-export';
import { cn } from '@/lib/utils';
import { Link } from '@inertiajs/react';
import { format } from 'date-fns';
import { BarChart3, Calendar as CalendarIcon, CalendarPlus, DollarSign, FileSpreadsheet, FileText, Loader2, Upload, UserPlus } from 'lucide-react';
import { useState } from 'react';

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

    const handleExportAttendance = () => {
        const filters = {
            date_from: dateFrom ? format(dateFrom, 'yyyy-MM-dd') : undefined,
            date_to: dateTo ? format(dateTo, 'yyyy-MM-dd') : undefined,
        };
        exportToExcel(filters);
    };

    const handleExportPayroll = () => {
        // TODO: Implement payroll export functionality
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

                            // Following AI Agent Instructions: Different rendering for link vs button actions
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
                    <CardDescription>Export attendance and payroll data to Excel</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Date Range Filter */}
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        {/* Date From */}
                        <div className="space-y-2">
                            <Label htmlFor="date-from">Date From</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        id="date-from"
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
                                        className="w-full"
                                        captionLayout="dropdown"
                                        fromYear={2020}
                                        toYear={2030}
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>

                        {/* Date To */}
                        <div className="space-y-2">
                            <Label htmlFor="date-to">Date To</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        id="date-to"
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
                                        defaultMonth={dateTo}
                                        captionLayout="dropdown"
                                        fromYear={2020}
                                        toYear={2030}
                                        initialFocus
                                        className="w-full"
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>
                    </div>

                    <Separator />

                    {/* Export Buttons */}
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                        {/* Export Attendance */}
                        <Button
                            onClick={handleExportAttendance}
                            disabled={isExporting}
                            className="flex items-center justify-center gap-2"
                            variant="default"
                        >
                            {isExporting ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Exporting...
                                </>
                            ) : (
                                <>
                                    <FileSpreadsheet className="h-4 w-4" />
                                    Export Attendance
                                </>
                            )}
                        </Button>

                        {/* Export Payroll - Placeholder */}
                        <Button onClick={handleExportPayroll} disabled className="flex items-center justify-center gap-2" variant="outline">
                            <DollarSign className="h-4 w-4" />
                            Export Payroll
                            <span className="ml-1 text-xs text-muted-foreground">(Coming Soon)</span>
                        </Button>
                    </div>

                    {/* Helper Text */}
                    <p className="text-xs text-muted-foreground">
                        {dateFrom || dateTo
                            ? `Exporting data ${dateFrom ? `from ${format(dateFrom, 'MMM d, yyyy')}` : ''} ${dateTo ? `to ${format(dateTo, 'MMM d, yyyy')}` : ''}`
                            : 'Select a date range to filter export data. Leave blank to export all records.'}
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
