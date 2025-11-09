import AppLayout from '@/layouts/app-layout';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BatchCard } from '@/components/attendance/batch-card';
import { FileText, AlertCircle, Upload, Trash2, CheckCircle2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Progress } from '@/components/ui/progress';

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
    const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [selectedBatch, setSelectedBatch] = useState<Batch | null>(null);
    const [uploadProgress, setUploadProgress] = useState(0);
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    const uploadForm = useForm({
        file: null as File | null,
    });

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

    const handleUpload = () => {
        if (!uploadForm.data.file) {
            toast.error('Please select a file');
            return;
        }

        setUploadProgress(0);
        const progressInterval = setInterval(() => {
            setUploadProgress((prev) => {
                if (prev >= 90) {
                    clearInterval(progressInterval);
                    return 90;
                }
                return prev + 10;
            });
        }, 200);

        uploadForm.post(route('attendance.import'), {
            forceFormData: true,
            onSuccess: () => {
                clearInterval(progressInterval);
                setUploadProgress(100);
                setTimeout(() => {
                    setUploadDialogOpen(false);
                    uploadForm.reset();
                    setUploadProgress(0);
                    if (fileInputRef.current) {
                        fileInputRef.current.value = '';
                    }
                }, 500);
            },
            onError: (errors) => {
                clearInterval(progressInterval);
                setUploadProgress(0);
                if (errors.file) {
                    toast.error(errors.file);
                }
            },
        });
    };

    const handleDelete = () => {
        if (!selectedBatch) return;

        router.delete(route('attendance.raw.destroy', selectedBatch.id), {
            onSuccess: () => {
                setDeleteDialogOpen(false);
                setSelectedBatch(null);
            },
            onError: (errors) => {
                if (errors.delete) {
                    toast.error(errors.delete);
                }
            },
        });
    };

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Attendance', href: '/attendance/raw' },
                { title: 'Raw Data', href: '/attendance/raw' },
            ]}
        >
            <Head title="Raw Attendance Data" />
            
            <div className="space-y-6 p-6 md:p-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold">Raw Attendance Data</h1>
                        <p className="text-muted-foreground mt-1">
                            View imported attendance logs and verify data quality
                        </p>
                    </div>
                    <Button onClick={() => setUploadDialogOpen(true)}>
                        <Upload className="mr-2 h-4 w-4" />
                        Upload File
                    </Button>
                </div>

                {batches.data.length === 0 ? (
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center py-10">
                            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                            <p className="text-muted-foreground text-center">
                                No attendance data uploaded yet
                            </p>
                            <Button 
                                variant="outline" 
                                className="mt-4"
                                onClick={() => setUploadDialogOpen(true)}
                            >
                                <Upload className="mr-2 h-4 w-4" />
                                Upload Attendance File
                            </Button>
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
                                    <div key={batch.id} className="relative group">
                                        <Link 
                                            href={route('attendance.raw.show', batch.id)}
                                            className="block transition-transform hover:scale-[1.02]"
                                        >
                                            <BatchCard 
                                                batch={{
                                                    ...batch,
                                                    total_records: batch.raws_count || batch.total_records,
                                                }}
                                            />
                                        </Link>
                                        <Button
                                            variant="destructive"
                                            size="icon"
                                            className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                setSelectedBatch(batch);
                                                setDeleteDialogOpen(true);
                                            }}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
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

            {/* Upload Dialog */}
            <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Upload Attendance File</DialogTitle>
                        <DialogDescription>
                            Import attendance records from Excel files. Maximum file size: 10MB
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-6">
                        {/* File Input */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Select File</label>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".xlsx,.xls,.csv"
                                onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                        uploadForm.setData('file', file);
                                    }
                                }}
                                disabled={uploadForm.processing}
                                className="block w-full text-sm text-slate-500
                                    file:mr-4 file:py-2 file:px-4
                                    file:rounded-md file:border-0
                                    file:text-sm file:font-semibold
                                    file:bg-primary file:text-primary-foreground
                                    hover:file:bg-primary/90
                                    file:cursor-pointer cursor-pointer
                                    disabled:opacity-50 disabled:cursor-not-allowed"
                            />
                            {uploadForm.errors.file && (
                                <p className="text-sm text-destructive mt-1">{uploadForm.errors.file}</p>
                            )}
                        </div>

                        {/* Selected File Info */}
                        {uploadForm.data.file && (
                            <Alert className="border-green-200 bg-green-50">
                                <CheckCircle2 className="h-4 w-4 text-green-600" />
                                <AlertDescription className="text-green-800">
                                    <span className="font-medium">{uploadForm.data.file.name}</span> 
                                    {' '}({(uploadForm.data.file.size / 1024 / 1024).toFixed(2)} MB)
                                </AlertDescription>
                            </Alert>
                        )}

                        {/* Progress Bar */}
                        {uploadForm.processing && (
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Uploading...</span>
                                    <span className="font-medium">{uploadProgress}%</span>
                                </div>
                                <Progress value={uploadProgress} className="h-2" />
                            </div>
                        )}

                        {/* Instructions */}
                        <div className="space-y-3 rounded-md border p-4 bg-muted/50">
                            <p className="font-medium text-sm">📋 Required Columns in Excel File:</p>
                            <ul className="ml-2 list-inside list-disc space-y-1.5 text-sm text-muted-foreground">
                                <li>
                                    <span className="font-mono text-foreground">Name</span> - Employee full name (will be matched against system records)
                                </li>
                                <li>
                                    <span className="font-mono text-foreground">Time</span> - Timestamp of attendance log
                                </li>
                                <li>
                                    <span className="font-mono text-foreground">State</span> - Attendance state (C/In, C/Out, OverTime In, OverTime Out)
                                </li>
                                <li>
                                    <span className="font-mono text-foreground">AC-No.</span> - Employee AC number (optional)
                                </li>
                                <li>
                                    <span className="font-mono text-foreground">New State</span> - Updated state (optional)
                                </li>
                                <li>
                                    <span className="font-mono text-foreground">Exception</span> - Any exceptions (optional)
                                </li>
                                <li>
                                    <span className="font-mono text-foreground">Operation</span> - Operation type (optional)
                                </li>
                            </ul>
                        </div>

                        {/* Important Notes */}
                        <Alert>
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription className="text-sm space-y-2">
                                <p className="font-medium">Important Notes:</p>
                                <ul className="list-disc list-inside space-y-1 ml-2">
                                    <li>Employee names will be matched against First Name + Last Name in the system</li>
                                    <li>Duplicate events within the same sequence will be automatically removed</li>
                                    <li>The first instance of consecutive duplicates will be kept</li>
                                    <li>Attendance processing will validate proper clock-in/clock-out sequences</li>
                                </ul>
                            </AlertDescription>
                        </Alert>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => {
                                if (!uploadForm.processing) {
                                    setUploadDialogOpen(false);
                                    uploadForm.reset();
                                    setUploadProgress(0);
                                    if (fileInputRef.current) {
                                        fileInputRef.current.value = '';
                                    }
                                }
                            }}
                            disabled={uploadForm.processing}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleUpload}
                            disabled={!uploadForm.data.file || uploadForm.processing}
                        >
                            {uploadForm.processing ? (
                                <>
                                    <Upload className="mr-2 h-4 w-4 animate-pulse" />
                                    Uploading...
                                </>
                            ) : (
                                <>
                                    <Upload className="mr-2 h-4 w-4" />
                                    Upload & Import
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Attendance Batch?</AlertDialogTitle>
                        <AlertDialogDescription className="space-y-2">
                            <p>
                                Are you sure you want to delete the batch <strong>"{selectedBatch?.filename}"</strong>?
                            </p>
                            <p className="text-destructive font-semibold">
                                ⚠️ Warning: This will permanently delete:
                            </p>
                            <ul className="list-disc list-inside space-y-1 text-sm">
                                <li>All raw attendance logs ({selectedBatch?.raws_count || selectedBatch?.total_records} records)</li>
                                <li>All processed attendance records</li>
                                <li>The uploaded file from storage</li>
                            </ul>
                            <p className="text-sm">
                                This action cannot be undone.
                            </p>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setSelectedBatch(null)}>
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            className="bg-destructive hover:bg-destructive/90"
                        >
                            Delete Batch
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </AppLayout>
    );
}
