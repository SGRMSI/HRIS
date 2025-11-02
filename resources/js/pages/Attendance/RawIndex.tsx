import AppLayout from '@/layouts/app-layout';
import { Head } from '@inertiajs/react';

export default function RawIndex() {
    return (
        <AppLayout breadcrumbs={[{ title: 'Attendance', href: '/attendance/upload' }, { title: 'Raw Data', href: '/attendance/raw' }]}>
            <Head title="Raw Attendance Data" />
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-semibold">Raw Attendance Data</h1>
                    <p className="text-sm text-muted-foreground">View and manage raw attendance logs from uploads</p>
                </div>
                {/* Content will be added here */}
            </div>
        </AppLayout>
    );
}
