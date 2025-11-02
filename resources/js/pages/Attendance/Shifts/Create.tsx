import AppLayout from '@/layouts/app-layout';
import { Head } from '@inertiajs/react';

export default function ShiftsCreate() {
    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Attendance', href: '/attendance/upload' },
                { title: 'Shifts', href: '/attendance/shifts' },
                { title: 'Create', href: '/attendance/shifts/create' },
            ]}
        >
            <Head title="Create Shift" />
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-semibold">Create New Shift</h1>
                    <p className="text-sm text-muted-foreground">Add a new work shift</p>
                </div>
                {/* Content will be added here */}
            </div>
        </AppLayout>
    );
}
