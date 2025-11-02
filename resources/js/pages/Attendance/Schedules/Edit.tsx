import AppLayout from '@/layouts/app-layout';
import { Head } from '@inertiajs/react';

export default function SchedulesEdit() {
    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Attendance', href: '/attendance/upload' },
                { title: 'Schedules', href: '/attendance/schedules' },
                { title: 'Edit', href: '#' },
            ]}
        >
            <Head title="Edit Schedule" />
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-semibold">Edit Schedule</h1>
                    <p className="text-sm text-muted-foreground">Update employee schedule</p>
                </div>
                {/* Content will be added here */}
            </div>
        </AppLayout>
    );
}
