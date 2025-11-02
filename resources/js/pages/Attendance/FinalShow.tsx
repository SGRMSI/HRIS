import AppLayout from '@/layouts/app-layout';
import { Head } from '@inertiajs/react';

export default function FinalShow() {
    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Attendance', href: '/attendance/upload' },
                { title: 'Final Attendance', href: '/attendance/final' },
                { title: 'Details', href: '#' },
            ]}
        >
            <Head title="Attendance Details" />
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-semibold">Attendance Details</h1>
                    <p className="text-sm text-muted-foreground">Detailed view of attendance record</p>
                </div>
                {/* Content will be added here */}
            </div>
        </AppLayout>
    );
}
