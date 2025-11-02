import AppLayout from '@/layouts/app-layout';
import { Head } from '@inertiajs/react';

export default function LeavesIndex() {
    return (
        <AppLayout breadcrumbs={[{ title: 'Attendance', href: '/attendance/upload' }, { title: 'Leaves', href: '/attendance/leaves' }]}>
            <Head title="Leave Management" />
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-semibold">Leave Management</h1>
                    <p className="text-sm text-muted-foreground">Manage employee leave requests</p>
                </div>
                {/* Content will be added here */}
            </div>
        </AppLayout>
    );
}
