import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { Head, router, usePage } from '@inertiajs/react';
import { format } from 'date-fns';
import { Calendar, CheckCircle2, Clock, Download, FileText, Filter, PlayCircle, RotateCcw, Send, User, XCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface Batch {
    id: number;
    filename: string;
    created_at: string;
    uploaded_by: string;
    status: 'imported' | 'processing' | 'processed' | 'failed' | 'finalized';
    total_records: number;
    processed_records: number;
    progress: number;
}

interface ProcessedRecord {
    id: number;
    batch_id: number;
    employee: {
        id: number | null;
        name: string;
        id_number: string | null;
    };
    ac_no: string;
    date: string;
    clock_in: string | null;
    clock_out: string | null;
    break_out: string | null;
    break_in: string | null;
    break_minutes: number | null;
    total_hours: number | null;
    status: 'Present' | 'Incomplete';
    status_message: string | null;
    meta: any;
    errors: any;
}

interface Props {
    batches: Batch[];
    processed: {
        data: ProcessedRecord[];
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
    filters: {
        employee_id?: number;
        date_from?: string;
        date_to?: string;
        status?: string;
        batch_id?: number;
    };
    employees: Array<{ id: number; name: string }>;
    statuses: Array<{ value: string; label: string }>;
    flash?: {
        success?: string;
        error?: string;
        warning?: string;
        info?: string;
    };
}

function getStatusBadge(status: Batch['status']) {
    const statusConfig: Record<Batch['status'], { icon: any; variant: any; label: string; className?: string }> = {
        imported: { icon: Clock, variant: 'secondary' as const, label: 'Ready to Process' },
        processing: { icon: PlayCircle, variant: 'default' as const, label: 'Processing' },
        processed: { icon: CheckCircle2, variant: 'default' as const, label: 'Processed' },
        failed: { icon: XCircle, variant: 'destructive' as const, label: 'Failed' },
        finalized: { icon: CheckCircle2, variant: 'default' as const, label: 'Finalized', className: 'bg-green-600' },
    };

    const config = statusConfig[status];
    const Icon = config.icon;

    return (
        <Badge variant={config.variant} className={`gap-1 ${config.className || ''}`}>
            <Icon className="h-3 w-3" />
            {config.label}
        </Badge>
    );
}

function getRecordStatusBadge(status: 'Present' | 'Incomplete', statusMessage?: string | null) {
    if (status === 'Present') {
        if (statusMessage?.startsWith('Warning:')) {
            return (
                <div className="flex flex-col gap-1">
                    <Badge variant="default">Present</Badge>
                    <span className="text-xs text-orange-600 whitespace-normal break-words max-w-[200px]">{statusMessage}</span>
                </div>
            );
        }
        return <Badge variant="default">Present</Badge>;
    }
    
    return (
        <div className="flex flex-col gap-1">
            <Badge variant="destructive">Incomplete</Badge>
            {statusMessage && <span className="text-xs text-muted-foreground whitespace-normal break-words max-w-[200px]">{statusMessage}</span>}
        </div>
    );
}

export default function Processed({ batches, processed, filters, employees, statuses }: Props) {
    const { flash } = usePage().props as any;
    const [processing, setProcessing] = useState<number | null>(null);
    const [finalizing, setFinalizing] = useState<number | null>(null);
    const [reprocessing, setReprocessing] = useState<number | null>(null);
    const [processDialogOpen, setProcessDialogOpen] = useState(false);
    const [selectedBatchId, setSelectedBatchId] = useState<number | null>(null);
    const [dialogAction, setDialogAction] = useState<'process' | 'reprocess' | 'finalize'>('process');

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

    const openProcessDialog = (batchId: number, action: 'process' | 'reprocess' | 'finalize') => {
        setSelectedBatchId(batchId);
        setDialogAction(action);
        setProcessDialogOpen(true);
    };

    const confirmProcess = () => {
        if (!selectedBatchId) return;

        setProcessDialogOpen(false);

        if (dialogAction === 'process' || dialogAction === 'reprocess') {
            dialogAction === 'process' ? setProcessing(selectedBatchId) : setReprocessing(selectedBatchId);
            router.post(
                route('attendance.processed.process', selectedBatchId),
                {},
                {
                    onFinish: () => {
                        setProcessing(null);
                        setReprocessing(null);
                    },
                },
            );
        } else if (dialogAction === 'finalize') {
            setFinalizing(selectedBatchId);
            router.post(
                route('attendance.processed.finalize', selectedBatchId),
                {},
                {
                    onFinish: () => setFinalizing(null),
                },
            );
        }
    };

    const handleProcess = (batchId: number) => {
        openProcessDialog(batchId, 'process');
    };

    const handleReprocess = (batchId: number) => {
        openProcessDialog(batchId, 'reprocess');
    };

    const handleFinalize = (batchId: number) => {
        openProcessDialog(batchId, 'finalize');
    };

    const handleFilter = (key: string, value: string) => {
        // Handle special "all" value by removing the filter
        const filterValue = value === 'all' ? undefined : value;
        router.get(route('attendance.processed.index'), { ...filters, [key]: filterValue || undefined }, { preserveState: true, replace: true });
    };

    const formatTime = (datetime: string | null) => {
        if (!datetime) return '-';
        try {
            // Parse the datetime string as-is without timezone conversion
            // The datetime is already in the correct timezone from the database
            const date = new Date(datetime);

            // Extract the parts directly from the ISO string to avoid timezone conversion
            const dateStr = datetime.split('T')[0]; // YYYY-MM-DD
            const timeStr = datetime.split('T')[1]?.split('.')[0]; // HH:mm:ss

            if (dateStr && timeStr) {
                const [year, month, day] = dateStr.split('-');
                const [hours, minutes] = timeStr.split(':');

                // Format manually to avoid timezone issues
                const hour12 = parseInt(hours) % 12 || 12;
                const ampm = parseInt(hours) >= 12 ? 'PM' : 'AM';
                const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

                return `${monthNames[parseInt(month) - 1]} ${parseInt(day)}, ${hour12}:${minutes} ${ampm}`;
            }

            return format(date, 'MMM d, h:mm a');
        } catch {
            return '-';
        }
    };

    const formatDate = (date: string) => {
        try {
            return format(new Date(date), 'MMM d, yyyy');
        } catch {
            return date;
        }
    };

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Attendance', href: '/attendance/upload' },
                { title: 'Processed Data', href: '/attendance/processed' },
            ]}
        >
            <Head title="Processed Attendance" />

            <div className="space-y-6 p-6 md:p-4">
                <div>
                    <h1 className="text-3xl font-bold">Processed Attendance</h1>
                    <p className="mt-1 text-muted-foreground">Process uploaded attendance data and review results</p>
                </div>

                {flash?.success && (
                    <Alert className="border-green-500 bg-green-50">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        <AlertDescription className="text-green-800">
                            {typeof flash.success === 'string' ? flash.success : flash.success.message}
                        </AlertDescription>
                    </Alert>
                )}

                {flash?.errors && (
                    <Alert variant="destructive">
                        <XCircle className="h-4 w-4" />
                        <AlertDescription>{Object.values(flash.errors).flat().join(', ')}</AlertDescription>
                    </Alert>
                )}

                <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Upload Batches</h3>

                    {batches.length === 0 ? (
                        <Card>
                            <CardContent className="py-12 text-center text-gray-500">
                                <FileText className="mx-auto mb-4 h-12 w-12 opacity-50" />
                                <p>No batches available for processing</p>
                                <p className="mt-2 text-sm">Upload attendance files to get started</p>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {batches.map((batch) => (
                                <Card key={batch.id} className="relative">
                                    <CardHeader>
                                        <div className="flex items-start justify-between">
                                            <div className="min-w-0 flex-1">
                                                <CardTitle className="truncate text-base">{batch.filename}</CardTitle>
                                                <CardDescription className="mt-1 text-xs">
                                                    Uploaded {formatDate(batch.created_at)} by {batch.uploaded_by}
                                                </CardDescription>
                                            </div>
                                            {getStatusBadge(batch.status)}
                                        </div>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4 text-sm">
                                            <div>
                                                <p className="text-gray-500">Total Records</p>
                                                <p className="font-semibold">{batch.total_records.toLocaleString()}</p>
                                            </div>
                                            <div>
                                                <p className="text-gray-500">Processed</p>
                                                <p className="font-semibold">{batch.processed_records.toLocaleString()}</p>
                                            </div>
                                        </div>

                                        {batch.status === 'imported' || batch.status === 'failed' ? (
                                            <Button
                                                onClick={() => handleProcess(batch.id)}
                                                disabled={processing === batch.id}
                                                className="w-full"
                                                size="sm"
                                            >
                                                {processing === batch.id ? (
                                                    <>
                                                        <Clock className="mr-2 h-4 w-4 animate-spin" />
                                                        Processing...
                                                    </>
                                                ) : (
                                                    <>
                                                        <PlayCircle className="mr-2 h-4 w-4" />
                                                        {batch.status === 'failed' ? 'Retry Processing' : 'Process Batch'}
                                                    </>
                                                )}
                                            </Button>
                                        ) : null}

                                        {batch.status === 'processed' ? (
                                            <div className="space-y-2">
                                                <Button
                                                    onClick={() => handleReprocess(batch.id)}
                                                    disabled={reprocessing === batch.id}
                                                    className="w-full"
                                                    size="sm"
                                                    variant="outline"
                                                >
                                                    {reprocessing === batch.id ? (
                                                        <>
                                                            <Clock className="mr-2 h-4 w-4 animate-spin" />
                                                            Reprocessing...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <RotateCcw className="mr-2 h-4 w-4" />
                                                            Reprocess Batch
                                                        </>
                                                    )}
                                                </Button>
                                                <Button
                                                    onClick={() => handleFinalize(batch.id)}
                                                    disabled={finalizing === batch.id}
                                                    className="w-full bg-green-600 hover:bg-green-700"
                                                    size="sm"
                                                >
                                                    {finalizing === batch.id ? (
                                                        <>
                                                            <Clock className="mr-2 h-4 w-4 animate-spin" />
                                                            Finalizing...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Send className="mr-2 h-4 w-4" />
                                                            Finalize Attendance
                                                        </>
                                                    )}
                                                </Button>
                                            </div>
                                        ) : null}

                                        {batch.status === 'finalized' ? (
                                            <Button
                                                onClick={() => handleReprocess(batch.id)}
                                                disabled={reprocessing === batch.id}
                                                className="w-full"
                                                size="sm"
                                                variant="outline"
                                            >
                                                {reprocessing === batch.id ? (
                                                    <>
                                                        <Clock className="mr-2 h-4 w-4 animate-spin" />
                                                        Reprocessing...
                                                    </>
                                                ) : (
                                                    <>
                                                        <RotateCcw className="mr-2 h-4 w-4" />
                                                        Reprocess Batch
                                                    </>
                                                )}
                                            </Button>
                                        ) : null}
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>

                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold">Processed Records</h3>
                        <Button variant="outline" size="sm">
                            <Download className="mr-2 h-4 w-4" />
                            Export
                        </Button>
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base">
                                <Filter className="h-4 w-4" />
                                Filters
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-4 md:grid-cols-5">
                                <div className="space-y-2">
                                    <Label>Batch</Label>
                                    <Select value={filters.batch_id?.toString() || 'all'} onValueChange={(value) => handleFilter('batch_id', value)}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="All Batches" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Batches</SelectItem>
                                            {batches.map((batch) => (
                                                <SelectItem key={batch.id} value={batch.id.toString()}>
                                                    {batch.filename}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label>Employee</Label>
                                    <Select
                                        value={filters.employee_id?.toString() || 'all'}
                                        onValueChange={(value) => handleFilter('employee_id', value)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="All Employees" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Employees</SelectItem>
                                            {employees.map((emp) => (
                                                <SelectItem key={emp.id} value={emp.id.toString()}>
                                                    {emp.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label>Status</Label>
                                    <Select value={filters.status || 'all'} onValueChange={(value) => handleFilter('status', value)}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="All Statuses" />
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

                                <div className="space-y-2">
                                    <Label>Date From</Label>
                                    <Input type="date" value={filters.date_from || ''} onChange={(e) => handleFilter('date_from', e.target.value)} />
                                </div>

                                <div className="space-y-2">
                                    <Label>Date To</Label>
                                    <Input type="date" value={filters.date_to || ''} onChange={(e) => handleFilter('date_to', e.target.value)} />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-0">
                            {processed.data.length === 0 ? (
                                <div className="py-12 text-center text-gray-500">
                                    <User className="mx-auto mb-4 h-12 w-12 opacity-50" />
                                    <p>No processed records found</p>
                                    <p className="mt-2 text-sm">Process a batch to see attendance records here</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Employee</TableHead>
                                                <TableHead>Date</TableHead>
                                                <TableHead>Clock In</TableHead>
                                                <TableHead>Clock Out</TableHead>
                                                <TableHead>Break Out</TableHead>
                                                <TableHead>Break In</TableHead>
                                                <TableHead>Break (min)</TableHead>
                                                <TableHead>Hours</TableHead>
                                                <TableHead className="w-[220px]">Status</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {processed.data.map((record) => (
                                                <TableRow key={record.id}>
                                                    <TableCell>
                                                        <div>
                                                            <p className="font-medium">{record.employee.name}</p>
                                                            {record.employee.id_number && (
                                                                <p className="text-xs text-gray-500">{record.employee.id_number}</p>
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-2">
                                                            <Calendar className="h-4 w-4 text-gray-400" />
                                                            {formatDate(record.date)}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-2">
                                                            <Clock className="h-3 w-3 text-green-600" />
                                                            {formatTime(record.clock_in)}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-2">
                                                            <Clock className="h-3 w-3 text-red-600" />
                                                            {formatTime(record.clock_out)}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-2">
                                                            <Clock className="h-3 w-3 text-orange-600" />
                                                            {formatTime(record.break_out)}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-2">
                                                            <Clock className="h-3 w-3 text-orange-600" />
                                                            {formatTime(record.break_in)}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        {record.break_minutes !== null ? (
                                                            <span className="text-sm">{record.break_minutes} min</span>
                                                        ) : (
                                                            <span className="text-gray-400">-</span>
                                                        )}
                                                    </TableCell>
                                                    <TableCell>
                                                        {record.total_hours !== null ? (
                                                            <span className="font-medium">{Number(record.total_hours).toFixed(2)} hrs</span>
                                                        ) : (
                                                            <span className="text-gray-400">-</span>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="w-[220px]">{getRecordStatusBadge(record.status, record.status_message)}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {processed.last_page > 1 && (
                        <div className="flex items-center justify-between">
                            <p className="text-sm text-gray-600">
                                Showing {(processed.current_page - 1) * processed.per_page + 1} to{' '}
                                {Math.min(processed.current_page * processed.per_page, processed.total)} of {processed.total} records
                            </p>
                            <div className="flex gap-2">
                                {processed.links.map((link, index) => (
                                    <Button
                                        key={index}
                                        variant={link.active ? 'default' : 'outline'}
                                        size="sm"
                                        disabled={!link.url}
                                        onClick={() => {
                                            if (link.url) {
                                                router.get(link.url, filters, {
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
                    )}
                </div>
            </div>

            <AlertDialog open={processDialogOpen} onOpenChange={setProcessDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            {dialogAction === 'process' && 'Process Batch?'}
                            {dialogAction === 'reprocess' && 'Reprocess Batch?'}
                            {dialogAction === 'finalize' && 'Finalize Batch?'}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            {dialogAction === 'process' && 'This will group clock in/out times and calculate work hours for all records in this batch.'}
                            {dialogAction === 'reprocess' && 'This will re-calculate all attendance records in this batch. Existing processed data will be updated.'}
                            {dialogAction === 'finalize' && 'This will move all processed records to Final Attendance. This action cannot be undone.'}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmProcess}>
                            {dialogAction === 'process' && 'Process'}
                            {dialogAction === 'reprocess' && 'Reprocess'}
                            {dialogAction === 'finalize' && 'Finalize'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </AppLayout>
    );
}
