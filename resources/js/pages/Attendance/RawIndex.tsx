import AppLayout from '@/layouts/app-layout';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BatchCard } from '@/components/attendance/batch-card';
import { 
    FileText, 
    AlertCircle, 
    Upload, 
    Trash2, 
    CheckCircle2, 
    Filter, 
    X, 
    Search,
    TrendingUp,
    Users,
    Calendar,
    ArrowUpDown,
    ArrowUp,
    ArrowDown
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
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

interface StatusCount {
    status: string;
    count: number;
}

interface Stats {
    total_batches: number;
    total_records: number;
    by_status: Record<string, StatusCount>;
    recent_uploads: number;
}

interface Uploader {
    id: number;
    name: string;
}

interface Status {
    value: string;
    label: string;
}

interface Filters {
    search?: string;
    status?: string;
    uploaded_by?: string;
    date_from?: string;
    date_to?: string;
    sort_by?: string;
    sort_direction?: string;
}

interface RawIndexProps {
    batches: {
        data: Batch[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
        links: Array<{
            url: string | null;
            label: string;
            active: boolean;
        }>;
    };
    filters: Filters;
    uploaders: Uploader[];
    stats: Stats;
    statuses: Status[];
    flash?: {
        success?: string;
        error?: string;
        warning?: string;
        info?: string;
    };
}

export default function RawIndex({ batches, filters, uploaders, stats, statuses, flash }: RawIndexProps) {
    const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [selectedBatch, setSelectedBatch] = useState<Batch | null>(null);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [showFilters, setShowFilters] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    const uploadForm = useForm({
        file: null as File | null,
    });

    // Local filter state
    const [localFilters, setLocalFilters] = useState<Filters>(filters || {});

    // Force reload data when component mounts to prevent stale cache
    useEffect(() => {
        const hasNavigatedFromUpload = sessionStorage.getItem('attendance_uploaded');
        if (hasNavigatedFromUpload) {
            router.reload({ only: ['batches', 'stats'] });
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

    const handleFilter = (key: string, value: string) => {
        const newFilters = { ...localFilters, [key]: value || undefined };
        setLocalFilters(newFilters);
        router.get(route('attendance.raw.index'), newFilters, { 
            preserveState: true, 
            replace: true 
        });
    };

    const handleClearFilters = () => {
        setLocalFilters({});
        router.get(route('attendance.raw.index'), {}, { 
            preserveState: true, 
            replace: true 
        });
    };

    const handleSort = (field: string) => {
        const currentSortBy = localFilters.sort_by || 'created_at';
        const currentDirection = localFilters.sort_direction || 'desc';
        
        let newDirection = 'asc';
        if (currentSortBy === field) {
            newDirection = currentDirection === 'asc' ? 'desc' : 'asc';
        }
        
        const newFilters = { ...localFilters, sort_by: field, sort_direction: newDirection };
        setLocalFilters(newFilters);
        router.get(route('attendance.raw.index'), newFilters, { 
            preserveState: true, 
            replace: true 
        });
    };

    const getSortIcon = (field: string) => {
        if (localFilters.sort_by !== field) {
            return <ArrowUpDown className="h-4 w-4 ml-1 opacity-50" />;
        }
        return localFilters.sort_direction === 'asc' ? 
            <ArrowUp className="h-4 w-4 ml-1" /> : 
            <ArrowDown className="h-4 w-4 ml-1" />;
    };

    const activeFiltersCount = Object.values(localFilters).filter(v => v).length;

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
                    window.location.href = route('attendance.raw.index');
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
                window.location.href = route('attendance.raw.index');
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
                {/* Header */}
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

                {/* Statistics Dashboard */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Batches</CardTitle>
                            <FileText className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.total_batches}</div>
                            <p className="text-xs text-muted-foreground">
                                All uploaded batches
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Records</CardTitle>
                            <Users className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.total_records.toLocaleString()}</div>
                            <p className="text-xs text-muted-foreground">
                                Attendance logs imported
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Recent Uploads</CardTitle>
                            <TrendingUp className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.recent_uploads}</div>
                            <p className="text-xs text-muted-foreground">
                                Last 7 days
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Status Breakdown</CardTitle>
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-1">
                                {Object.entries(stats.by_status).map(([status, data]) => (
                                    <div key={status} className="flex items-center justify-between text-xs">
                                        <span className="capitalize">{status}</span>
                                        <span className="font-medium">{data.count}</span>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Filters */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Filter className="h-4 w-4" />
                                <CardTitle className="text-base">Filters & Search</CardTitle>
                                {activeFiltersCount > 0 && (
                                    <Badge variant="secondary">{activeFiltersCount} active</Badge>
                                )}
                            </div>
                            <div className="flex gap-2">
                                {activeFiltersCount > 0 && (
                                    <Button variant="ghost" size="sm" onClick={handleClearFilters}>
                                        <X className="h-4 w-4 mr-1" />
                                        Clear All
                                    </Button>
                                )}
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setShowFilters(!showFilters)}
                                >
                                    {showFilters ? 'Hide' : 'Show'} Filters
                                </Button>
                            </div>
                        </div>
                    </CardHeader>
                    {showFilters && (
                        <CardContent>
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                {/* Search */}
                                <div className="space-y-2">
                                    <Label htmlFor="search">Search Filename</Label>
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            id="search"
                                            placeholder="Search by filename..."
                                            value={localFilters.search || ''}
                                            onChange={(e) => handleFilter('search', e.target.value)}
                                            className="pl-9"
                                        />
                                    </div>
                                </div>

                                {/* Status Filter */}
                                <div className="space-y-2">
                                    <Label>Status</Label>
                                    <Select 
                                        value={localFilters.status || 'all'} 
                                        onValueChange={(value) => handleFilter('status', value === 'all' ? '' : value)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="All statuses" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Statuses</SelectItem>
                                            {statuses.map((status) => (
                                                <SelectItem key={status.value} value={status.value}>
                                                    {status.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Uploaded By Filter */}
                                <div className="space-y-2">
                                    <Label>Uploaded By</Label>
                                    <Select 
                                        value={localFilters.uploaded_by || 'all'} 
                                        onValueChange={(value) => handleFilter('uploaded_by', value === 'all' ? '' : value)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="All users" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Users</SelectItem>
                                            {uploaders.map((uploader) => (
                                                <SelectItem key={uploader.id} value={uploader.id.toString()}>
                                                    {uploader.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Date From */}
                                <div className="space-y-2">
                                    <Label htmlFor="date_from">Date From</Label>
                                    <Input
                                        id="date_from"
                                        type="date"
                                        value={localFilters.date_from || ''}
                                        onChange={(e) => handleFilter('date_from', e.target.value)}
                                    />
                                </div>

                                {/* Date To */}
                                <div className="space-y-2">
                                    <Label htmlFor="date_to">Date To</Label>
                                    <Input
                                        id="date_to"
                                        type="date"
                                        value={localFilters.date_to || ''}
                                        onChange={(e) => handleFilter('date_to', e.target.value)}
                                    />
                                </div>
                            </div>
                        </CardContent>
                    )}
                </Card>

                {/* Sorting Options */}
                <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm text-muted-foreground">Sort by:</span>
                    <Button
                        variant={localFilters.sort_by === 'created_at' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handleSort('created_at')}
                    >
                        Upload Date
                        {getSortIcon('created_at')}
                    </Button>
                    <Button
                        variant={localFilters.sort_by === 'filename' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handleSort('filename')}
                    >
                        Filename
                        {getSortIcon('filename')}
                    </Button>
                    <Button
                        variant={localFilters.sort_by === 'status' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handleSort('status')}
                    >
                        Status
                        {getSortIcon('status')}
                    </Button>
                    <Button
                        variant={localFilters.sort_by === 'total_rows' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handleSort('total_rows')}
                    >
                        Record Count
                        {getSortIcon('total_rows')}
                    </Button>
                </div>

                {/* Batches Grid */}
                {batches.data.length === 0 ? (
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center py-10">
                            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                            <p className="text-muted-foreground text-center">
                                {activeFiltersCount > 0 
                                    ? 'No batches found matching your filters'
                                    : 'No attendance data uploaded yet'
                                }
                            </p>
                            {activeFiltersCount > 0 ? (
                                <Button 
                                    variant="outline" 
                                    className="mt-4"
                                    onClick={handleClearFilters}
                                >
                                    <X className="mr-2 h-4 w-4" />
                                    Clear Filters
                                </Button>
                            ) : (
                                <Button 
                                    variant="outline" 
                                    className="mt-4"
                                    onClick={() => setUploadDialogOpen(true)}
                                >
                                    <Upload className="mr-2 h-4 w-4" />
                                    Upload Attendance File
                                </Button>
                            )}
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
                                        {batch.status !== 'finalized' && (
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
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Enhanced Pagination */}
                            <div className="flex items-center justify-between">
                                <p className="text-sm text-muted-foreground">
                                    Showing {(batches.current_page - 1) * batches.per_page + 1} to{' '}
                                    {Math.min(batches.current_page * batches.per_page, batches.total)} of {batches.total} batches
                                    {' · '}Page {batches.current_page} of {batches.last_page}
                                </p>
                                <div className="flex gap-2">
                                    {batches.links.map((link, index) => (
                                        <Button
                                            key={index}
                                            variant={link.active ? 'default' : 'outline'}
                                            size="sm"
                                            disabled={!link.url}
                                            onClick={() => {
                                                if (link.url) {
                                                    router.get(link.url, Object.fromEntries(
                                                        Object.entries(localFilters).filter(([_, v]) => v != null)
                                                    ), {
                                                        preserveState: true,
                                                        preserveScroll: true,
                                                    });
                                                }
                                            }}
                                            dangerouslySetInnerHTML={{ __html: link.label }}
                                        />
                                    ))}
                                </div>
                            </div>
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
                                    <span className="font-mono text-foreground">Name</span> - Employee full name
                                </li>
                                <li>
                                    <span className="font-mono text-foreground">Time</span> - Timestamp of attendance log
                                </li>
                                <li>
                                    <span className="font-mono text-foreground">State</span> - Attendance state
                                </li>
                                <li>
                                    <span className="font-mono text-foreground">AC-No.</span> - Employee AC number
                                </li>
                            </ul>
                        </div>

                        {/* Important Notes */}
                        <Alert>
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription className="text-sm space-y-2">
                                <p className="font-medium">Important Notes:</p>
                                <ul className="list-disc list-inside space-y-1 ml-2">
                                    <li>Employee names will be matched against system records</li>
                                    <li>Duplicate events will be automatically removed</li>
                                    <li>Attendance processing validates clock-in/clock-out sequences</li>
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
