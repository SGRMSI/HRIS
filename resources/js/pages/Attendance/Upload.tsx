import AppLayout from '@/layouts/app-layout';
import { Head, useForm } from '@inertiajs/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileUpload } from '@/components/attendance/file-upload';
import { BatchCard } from '@/components/attendance/batch-card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useState } from 'react';

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
    };
}

export default function Upload({ batches, flash }: UploadPageProps) {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const { data, setData, post, processing, errors, reset } = useForm({
        file: null as File | null,
    });

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
            },
            onError: (errors) => {
                console.error('Upload errors:', errors);
            },
        });
    };

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Attendance', href: '/attendance/upload' },
                { title: 'Upload', href: '/attendance/upload' },
            ]}
        >
            <Head title="Upload Attendance" />
            
            <div className="space-y-6 p-6 md:p-4">
                <div>
                    <h1 className="text-3xl font-bold">Upload Attendance</h1>
                    <p className="text-muted-foreground mt-1">
                        Import attendance records from Excel files
                    </p>
                </div>

                {flash?.success && (
                    <Alert className="border-green-200 bg-green-50">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        <AlertDescription className="text-green-800">
                            {flash.success}
                        </AlertDescription>
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
                        <CardDescription>
                            Upload an Excel file containing attendance records. Maximum file size: 10MB
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <FileUpload
                                onFileSelect={handleFileSelect}
                                accept=".xlsx,.xls"
                                maxSize={10}
                            />

                            <div className="flex items-center gap-3">
                                <Button
                                    type="submit"
                                    disabled={!selectedFile || processing}
                                >
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

                            <div className="text-sm text-muted-foreground space-y-1">
                                <p className="font-medium">Required Columns in Excel File:</p>
                                <ul className="list-disc list-inside space-y-1 ml-2">
                                    <li><span className="font-mono">AC-No.</span> - Employee attendance number</li>
                                    <li><span className="font-mono">Name</span> - Employee name</li>
                                    <li><span className="font-mono">Time</span> - Timestamp of attendance log</li>
                                    <li><span className="font-mono">State</span> - Attendance state</li>
                                    <li><span className="font-mono">New State</span> - Updated state (optional)</li>
                                    <li><span className="font-mono">Exception</span> - Any exceptions (optional)</li>
                                    <li><span className="font-mono">Operation</span> - Operation type (optional)</li>
                                </ul>
                            </div>
                        </form>
                    </CardContent>
                </Card>

                <div>
                    <h2 className="text-2xl font-bold mb-4">Recent Uploads</h2>

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
