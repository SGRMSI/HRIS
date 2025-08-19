import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, usePage } from '@inertiajs/react';
import { type PageProps } from '@inertiajs/core';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { UserCheck, UserX, Clock, CalendarIcon } from 'lucide-react';
import { DateRangePicker } from '@/components/attendance/date-range-picker';
import { AttendanceDataTable } from '@/components/attendance/attendance-data-table';
import { columns, type AttendanceRecord } from '@/components/attendance/attendance-columns';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Attendance',
        href: '/attendance',
    },
];

interface Props {
    attendanceRecords: AttendanceRecord[];
}

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

    // Mock data - replace with actual attendance data from backend
    const attendanceRecords: AttendanceRecord[] = [
        {
            id: 1,
            employee_id: 101,
            full_name: 'John Doe',
            time_in: '08:00:00',
            time_out: '17:00:00',
            date: '2025-08-19',
            status: 'On Time'
        },
        {
            id: 2,
            employee_id: 102,
            full_name: 'Jane Smith',
            time_in: '08:30:00',
            time_out: '17:30:00',
            date: '2025-08-19',
            status: 'Late'
        },
        {
            id: 3,
            employee_id: 103,
            full_name: 'Mike Johnson',
            time_in: null,
            time_out: null,
            date: '2025-08-19',
            status: 'Absent'
        },
        {
            id: 4,
            employee_id: 104,
            full_name: 'Sarah Williams',
            time_in: '07:45:00',
            time_out: '16:45:00',
            date: '2025-08-19',
            status: 'Present'
        },
        {
            id: 5,
            employee_id: 105,
            full_name: 'David Brown',
            time_in: '08:15:00',
            time_out: null,
            date: '2025-08-19',
            status: 'Incomplete'
        },
        {
            id: 6,
            employee_id: 106,
            full_name: 'Emily Davis',
            time_in: '08:00:00',
            time_out: '17:00:00',
            date: '2025-08-18',
            status: 'On Time'
        },
        {
            id: 7,
            employee_id: 107,
            full_name: 'Robert Wilson',
            time_in: '09:00:00',
            time_out: '18:00:00',
            date: '2025-08-18',
            status: 'Late'
        }
    ];

    // Mock data - replace with actual attendance statistics
    const attendanceStats = {
        present: attendanceRecords.filter(r => r.status === 'Present' || r.status === 'On Time').length,
        absent: attendanceRecords.filter(r => r.status === 'Absent').length,
        onTime: attendanceRecords.filter(r => r.status === 'On Time').length,
        late: attendanceRecords.filter(r => r.status === 'Late').length
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
                
                {/* Attendance Data Table */}
                <AttendanceDataTable 
                    columns={columns} 
                    data={attendanceRecords} 
                    showImportButton={true}
                    onImportClick={() => console.log('Import CSV clicked')}
                />
            </div>
        </AppLayout>
    );
}