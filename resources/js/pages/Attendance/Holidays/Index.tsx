import AppLayout from '@/layouts/app-layout';
import { Head } from '@inertiajs/react';

export default function HolidaysIndex() {
    return (
        <AppLayout breadcrumbs={[{ title: 'Attendance', href: '/attendance/upload' }, { title: 'Holidays', href: '/attendance/holidays' }]}>
            <Head title="Holidays Management" />
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-semibold">Holidays Management</h1>
                    <p className="text-sm text-muted-foreground">Manage company holidays and special dates</p>
                </div>
                {/* Content will be added here */}
            </div>
        </AppLayout>
    );
}
