import AppLayout from '@/layouts/app-layout';
import { Head } from '@inertiajs/react';

export default function ShiftsEdit() {
    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Attendance', href: '/attendance/upload' },
                { title: 'Shifts', href: '/attendance/shifts' },
                { title: 'Edit', href: '#' },
            ]}
        >
            <Head title="Edit Shift" />
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-semibold">Edit Shift</h1>
                    <p className="text-sm text-muted-foreground">Update shift information</p>
                </div>
                {/* Content will be added here */}
            </div>
        </AppLayout>
    );
}
