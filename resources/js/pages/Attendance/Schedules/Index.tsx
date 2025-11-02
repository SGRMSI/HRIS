import AppLayout from '@/layouts/app-layout';
import { Head } from '@inertiajs/react';

export default function SchedulesIndex() {
    return (
        <AppLayout breadcrumbs={[{ title: 'Attendance', href: '/attendance/upload' }, { title: 'Schedules', href: '/attendance/schedules' }]}>
            <Head title="Employee Schedules" />
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-semibold">Employee Schedules</h1>
                    <p className="text-sm text-muted-foreground">Assign and manage employee shift schedules</p>
                </div>
                {/* Content will be added here */}
            </div>
        </AppLayout>
    );
}
