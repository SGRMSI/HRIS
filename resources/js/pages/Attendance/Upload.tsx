import { BatchCard } from '@/components/attendance/batch-card';
import { FileUpload } from '@/components/attendance/file-upload';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { Head, router, useForm } from '@inertiajs/react';
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';

interface Batch {
    id: number;
    filename: string;
    uploaded_at: string;
    uploaded_by: string;
    total_records: number;
    status: string;
}

interface UploadPageProps {
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

export default function Upload({ batches, flash }: UploadPageProps) {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const { data, setData, post, processing, errors, reset } = useForm({
        file: null as File | null,
    });

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

    const handleFileSelect = (file: File) => {
        setSelectedFile(file);
        setData('file', file);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!data.file) {
            return;
        }

        post(route('attendance.import'), {
            forceFormData: true,
            onSuccess: () => {
                reset();
                setSelectedFile(null);
                // Set flag so raw data page knows to reload fresh data
                sessionStorage.setItem('attendance_uploaded', 'true');
                // Clear Inertia cache for raw data page so it shows fresh data
                router.reload({ only: ['batches'] });
            },
            onError: (errors) => {
                console.error('Upload errors:', errors);
            },
        });
    };

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Attendance', href: '#' },
                { title: 'Upload', href: '/attendance/upload' },
            ]}
        >
            <Head title="Upload Attendance" />

            <div className="space-y-6 p-6 md:p-4">
                <div>
                    <h1 className="text-3xl font-bold">Upload Attendance</h1>
                    <p className="mt-1 text-muted-foreground">Import attendance records from Excel files</p>
                </div>

                {flash?.success && (
                    <Alert className="border-green-200 bg-green-50">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        <AlertDescription className="text-green-800">{flash.success}</AlertDescription>
                    </Alert>
                )}

                {flash?.error && (
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{flash.error}</AlertDescription>
                    </Alert>
                )}

                {errors.file && (
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{errors.file}</AlertDescription>
                    </Alert>
                )}

                <Card>
                    <CardHeader>
                        <CardTitle>Import Attendance File</CardTitle>
                        <CardDescription>Upload an Excel file containing attendance records. Maximum file size: 10MB</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <FileUpload onFileSelect={handleFileSelect} accept=".xlsx,.xls" maxSize={10} />

                            <div className="flex items-center gap-3">
                                <Button type="submit" disabled={!selectedFile || processing}>
                                    {processing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    {processing ? 'Uploading...' : 'Upload & Import'}
                                </Button>

                                {selectedFile && !processing && (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => {
                                            setSelectedFile(null);
                                            reset();
                                        }}
                                    >
                                        Cancel
                                    </Button>
                                )}
                            </div>

                            <div className="space-y-1 text-sm text-muted-foreground">
                                <p className="font-medium">Required Columns in Excel File:</p>
                                <ul className="ml-2 list-inside list-disc space-y-1">
                                    <li>
                                        <span className="font-mono">AC-No.</span> - Employee ID (numeric) or ID Number (alphanumeric)
                                    </li>
                                    <li>
                                        <span className="font-mono">Name</span> - Employee name
                                    </li>
                                    <li>
                                        <span className="font-mono">Time</span> - Timestamp of attendance log
                                    </li>
                                    <li>
                                        <span className="font-mono">State</span> - Attendance state
                                    </li>
                                    <li>
                                        <span className="font-mono">New State</span> - Updated state (optional)
                                    </li>
                                    <li>
                                        <span className="font-mono">Exception</span> - Any exceptions (optional)
                                    </li>
                                    <li>
                                        <span className="font-mono">Operation</span> - Operation type (optional)
                                    </li>
                                </ul>
                                <p className="mt-2 text-xs text-muted-foreground/80">
                                    Note: AC-No. will match employees by Employee ID (1, 2, 3...) or ID Number (TNT001, TH001...).
                                </p>
                            </div>
                        </form>
                    </CardContent>
                </Card>

                <div>
                    <h2 className="mb-4 text-2xl font-bold">Recent Uploads</h2>

                    {batches.data.length === 0 ? (
                        <Card>
                            <CardContent className="flex flex-col items-center justify-center py-10">
                                <p className="text-muted-foreground">No batches uploaded yet</p>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {batches.data.map((batch) => (
                                <BatchCard key={batch.id} batch={batch} />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
