import AppLayout from '@/layouts/app-layout';
import { Head, Link, router } from '@inertiajs/react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BatchCard } from '@/components/attendance/batch-card';
import { FileText, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useEffect } from 'react';
import { toast } from 'sonner';

interface Batch {
    id: number;
    filename: string;
    uploaded_at: string;
    uploaded_by: string;
    total_records: number;
    raws_count: number;
    status: string;
}

interface RawIndexProps {
    batches: {
        data: Batch[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
    flash?: {
        success?: string;
        error?: string;
        warning?: string;
        info?: string;
    };
}

export default function RawIndex({ batches, flash }: RawIndexProps) {
    // Force reload data when component mounts to prevent stale cache
    useEffect(() => {
        const hasNavigatedFromUpload = sessionStorage.getItem('attendance_uploaded');
        if (hasNavigatedFromUpload) {
            router.reload({ only: ['batches'] });
            sessionStorage.removeItem('attendance_uploaded');
        }
    }, []);

        useEffect(() => {
        if (flash?.success) {
            toast.success(flash.success);
        }
        if (flash?.error) {
            toast.error(flash.error);
        }
        if (flash?.warning) {
            toast.warning(flash.warning);
        }
        if (flash?.info) {
            toast.info(flash.info);
        }
    }, [flash]);

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Attendance', href: '/attendance/upload' },
                { title: 'Raw Data', href: '/attendance/raw' },
            ]}
        >
            <Head title="Raw Attendance Data" />
            
            <div className="space-y-6 p-6 md:p-4">
                <div>
                    <h1 className="text-3xl font-bold">Raw Attendance Data</h1>
                    <p className="text-muted-foreground mt-1">
                        View imported attendance logs and verify data quality
                    </p>
                </div>

                {batches.data.length === 0 ? (
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center py-10">
                            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                            <p className="text-muted-foreground text-center">
                                No attendance data uploaded yet
                            </p>
                            <Link href={route('attendance.upload')}>
                                <Button variant="outline" className="mt-4">
                                    Upload Attendance File
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>
                ) : (
                    <>
                        <Alert>
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>
                                Click on a batch to view its raw attendance logs and check employee matching status.
                            </AlertDescription>
                        </Alert>

                        <div>
                            <h2 className="text-2xl font-bold mb-4">Upload Batches</h2>
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                {batches.data.map((batch) => (
                                    <Link 
                                        key={batch.id} 
                                        href={route('attendance.raw.show', batch.id)}
                                        className="transition-transform hover:scale-[1.02]"
                                    >
                                        <BatchCard 
                                            batch={{
                                                ...batch,
                                                total_records: batch.raws_count || batch.total_records,
                                            }}
                                        />
                                    </Link>
                                ))}
                            </div>
                        </div>

                        {batches.last_page > 1 && (
                            <div className="flex items-center justify-between">
                                <p className="text-sm text-muted-foreground">
                                    Showing {batches.data.length} of {batches.total} batches
                                </p>
                                <div className="flex gap-2">
                                    {batches.current_page > 1 && (
                                        <Link href={route('attendance.raw.index', { page: batches.current_page - 1 })}>
                                            <Button variant="outline" size="sm">
                                                Previous
                                            </Button>
                                        </Link>
                                    )}
                                    {batches.current_page < batches.last_page && (
                                        <Link href={route('attendance.raw.index', { page: batches.current_page + 1 })}>
                                            <Button variant="outline" size="sm">
                                                Next
                                            </Button>
                                        </Link>
                                    )}
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </AppLayout>
    );
}
