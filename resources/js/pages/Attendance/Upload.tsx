import AppLayout from '@/layouts/app-layout';
import { Head } from '@inertiajs/react';

export default function Upload() {
    return (
        <AppLayout breadcrumbs={[{ title: 'Attendance', href: '/attendance/upload' }, { title: 'Upload', href: '/attendance/upload' }]}>
            <Head title="Upload Attendance" />
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-semibold">Upload Attendance</h1>
                    <p className="text-sm text-muted-foreground">Upload attendance data from Excel files</p>
                </div>
                {/* Content will be added here */}
            </div>
        </AppLayout>
    );
}
