import AppLayout from '@/layouts/app-layout';
import { Head } from '@inertiajs/react';

export default function FinalIndex() {
    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Attendance', href: '/attendance/upload' },
                { title: 'Final Attendance', href: '/attendance/final' },
            ]}
        >
            <Head title="Final Attendance" />
            <div className="space-y-6">
                <h1 className="text-3xl font-bold">Final Attendance Records</h1>
                <p className="text-muted-foreground">
                    View, approve, and manage final attendance records with filtering and bulk actions.
                </p>
            </div>
        </AppLayout>
    );
}
