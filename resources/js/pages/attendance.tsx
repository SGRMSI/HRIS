import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, usePage } from '@inertiajs/react';
import { type PageProps } from '@inertiajs/core';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { UserCheck, UserX, Clock, CalendarIcon } from 'lucide-react';
import { DateRangePicker } from '@/components/attendance/date-range-picker';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Attendance',
        href: '/attendance',
    },
];

// interface Props {
//     attendance: Attendance[];
// }

interface GlobalPageProps extends PageProps {
    flash?: {
        success?: string;
        error?: string;
        warning?: string;
        info?: string;
    };
}

export default function Attendance() {
    const { props } = usePage<GlobalPageProps>();
    const [startDate, setStartDate] = useState<string>('');
    const [endDate, setEndDate] = useState<string>('');

    // Mock data - replace with actual attendance data
    const attendanceStats = {
        present: 45,
        absent: 5,
        onTime: 40,
        late: 10
    };

    const handleApplyFilter = () => {
        // Add your filter logic here
        console.log('Applying filter:', { startDate, endDate });
        // You can add a toast notification here
        if (startDate || endDate) {
            toast.success('Date filter applied successfully');
        }
    };

    const handleClearFilter = () => {
        setStartDate('');
        setEndDate('');
    };

    useEffect(() => {
        if (props.flash?.success) {
            toast.success(props.flash.success);
        }
        if (props.flash?.error) {
            toast.error(props.flash.error);
        }
        if (props.flash?.warning) {
            toast.warning(props.flash.warning);
        }
        if (props.flash?.info) {
            toast.info(props.flash.info);
        }
    }, [props.flash]);
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Attendance" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                {/* Date Range Selector with Popover */}
                <div className="flex items-center gap-4 py-4">
                    <div className="flex items-center gap-2">
                        <CalendarIcon className="h-4 w-4" />
                        <span className="text-sm font-medium">Date Range:</span>
                    </div>
                    
                    <DateRangePicker
                        startDate={startDate}
                        endDate={endDate}
                        onStartDateChange={setStartDate}
                        onEndDateChange={setEndDate}
                        onApply={handleApplyFilter}
                        onClear={handleClearFilter}
                    />
                </div>

                {/* Statistics Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card className="w-full">
                        <CardHeader className="pb-3">
                            <div className="flex items-center gap-2">
                                <UserCheck className="h-4 w-4 text-green-600" />
                                <CardTitle className="text-2xl font-bold">{attendanceStats.present}</CardTitle>
                            </div>
                            <CardDescription>Present</CardDescription>
                        </CardHeader>
                    </Card>
                    <Card className="w-full">
                        <CardHeader className="pb-3">
                            <div className="flex items-center gap-2">
                                <UserX className="h-4 w-4 text-red-600" />
                                <CardTitle className="text-2xl font-bold">{attendanceStats.absent}</CardTitle>
                            </div>
                            <CardDescription>Absent</CardDescription>
                        </CardHeader>
                    </Card>
                    <Card className="w-full">
                        <CardHeader className="pb-3">
                            <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4 text-blue-600" />
                                <CardTitle className="text-2xl font-bold">{attendanceStats.onTime}</CardTitle>
                            </div>
                            <CardDescription>On Time</CardDescription>
                        </CardHeader>
                    </Card>
                    <Card className="w-full">
                        <CardHeader className="pb-3">
                            <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4 text-orange-600" />
                                <CardTitle className="text-2xl font-bold">{attendanceStats.late}</CardTitle>
                            </div>
                            <CardDescription>Late</CardDescription>
                        </CardHeader>
                    </Card>
                </div>
                {/* <EmployeeDataTable columns={columns} data={employees} /> */}
            </div>
        </AppLayout>
    );
}