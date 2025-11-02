import AppLayout from '@/layouts/app-layout';
import { Head } from '@inertiajs/react';

export default function HolidaysCreate() {
    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Attendance', href: '/attendance/upload' },
                { title: 'Holidays', href: '/attendance/holidays' },
                { title: 'Create', href: '/attendance/holidays/create' },
            ]}
        >
            <Head title="Create Holiday" />
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-semibold">Create Holiday</h1>
                    <p className="text-sm text-muted-foreground">Add a new holiday</p>
                </div>
                {/* Content will be added here */}
            </div>
        </AppLayout>
    );
}
