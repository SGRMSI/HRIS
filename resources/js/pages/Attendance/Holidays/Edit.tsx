import AppLayout from '@/layouts/app-layout';
import { Head } from '@inertiajs/react';

export default function HolidaysEdit() {
    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Attendance', href: '/attendance/upload' },
                { title: 'Holidays', href: '/attendance/holidays' },
                { title: 'Edit', href: '#' },
            ]}
        >
            <Head title="Edit Holiday" />
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-semibold">Edit Holiday</h1>
                    <p className="text-sm text-muted-foreground">Update holiday information</p>
                </div>
                {/* Content will be added here */}
            </div>
        </AppLayout>
    );
}
