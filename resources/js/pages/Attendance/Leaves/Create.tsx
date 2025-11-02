import AppLayout from '@/layouts/app-layout';
import { Head } from '@inertiajs/react';

export default function LeavesCreate() {
    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Attendance', href: '/attendance/upload' },
                { title: 'Leaves', href: '/attendance/leaves' },
                { title: 'Create', href: '/attendance/leaves/create' },
            ]}
        >
            <Head title="Create Leave Request" />
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-semibold">Create Leave Request</h1>
                    <p className="text-sm text-muted-foreground">Submit a new leave request</p>
                </div>
                {/* Content will be added here */}
            </div>
        </AppLayout>
    );
}
