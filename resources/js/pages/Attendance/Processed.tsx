import AppLayout from '@/layouts/app-layout';
import { Head } from '@inertiajs/react';

export default function Processed() {
    return (
        <AppLayout breadcrumbs={[{ title: 'Attendance', href: '/attendance/upload' }, { title: 'Processed Data', href: '/attendance/processed' }]}>
            <Head title="Processed Attendance" />
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-semibold">Processed Attendance Data</h1>
                    <p className="text-sm text-muted-foreground">Process and review attendance records</p>
                </div>
                {/* Content will be added here */}
            </div>
        </AppLayout>
    );
}
