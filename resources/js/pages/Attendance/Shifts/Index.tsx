import AppLayout from '@/layouts/app-layout';
import { Head } from '@inertiajs/react';

export default function ShiftsIndex() {
    return (
        <AppLayout breadcrumbs={[{ title: 'Attendance', href: '/attendance/upload' }, { title: 'Shifts', href: '/attendance/shifts' }]}>
            <Head title="Shifts Management" />
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-semibold">Shifts Management</h1>
                    <p className="text-sm text-muted-foreground">Manage work shifts and schedules</p>
                </div>
                {/* Content will be added here */}
            </div>
        </AppLayout>
    );
}
