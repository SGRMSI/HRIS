import AppLayout from '@/layouts/app-layout';
import { Head } from '@inertiajs/react';

export default function LeavesShow() {
    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Attendance', href: '/attendance/upload' },
                { title: 'Leaves', href: '/attendance/leaves' },
                { title: 'Details', href: '#' },
            ]}
        >
            <Head title="Leave Request Details" />
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-semibold">Leave Request Details</h1>
                    <p className="text-sm text-muted-foreground">View leave request information</p>
                </div>
                {/* Content will be added here */}
            </div>
        </AppLayout>
    );
}
