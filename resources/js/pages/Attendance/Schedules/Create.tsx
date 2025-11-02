import AppLayout from '@/layouts/app-layout';
import { Head } from '@inertiajs/react';

export default function SchedulesCreate() {
    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Attendance', href: '/attendance/upload' },
                { title: 'Schedules', href: '/attendance/schedules' },
                { title: 'Create', href: '/attendance/schedules/create' },
            ]}
        >
            <Head title="Create Schedule" />
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-semibold">Create Schedule</h1>
                    <p className="text-sm text-muted-foreground">Assign shift to employee</p>
                </div>
                {/* Content will be added here */}
            </div>
        </AppLayout>
    );
}
