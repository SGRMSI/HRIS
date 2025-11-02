import AppLayout from '@/layouts/app-layout';
import { Head } from '@inertiajs/react';

export default function LeavesEdit() {
    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Attendance', href: '/attendance/upload' },
                { title: 'Leaves', href: '/attendance/leaves' },
                { title: 'Edit', href: '#' },
            ]}
        >
            <Head title="Edit Leave Request" />
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-semibold">Edit Leave Request</h1>
                    <p className="text-sm text-muted-foreground">Update leave request information</p>
                </div>
                {/* Content will be added here */}
            </div>
        </AppLayout>
    );
}
