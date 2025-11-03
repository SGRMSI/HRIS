import { useState } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { 
    PlayCircle, 
    CheckCircle2, 
    XCircle, 
    Clock, 
    Calendar,
    FileText,
    User,
    Filter,
    Download
} from 'lucide-react';
import { format } from 'date-fns';

interface Batch {
    id: number;
    filename: string;
    created_at: string;
    uploaded_by: string;
    status: 'imported' | 'processing' | 'processed' | 'failed';
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
}

function getStatusBadge(status: Batch['status']) {
    const statusConfig = {
        imported: { icon: Clock, variant: 'secondary' as const, label: 'Ready to Process' },
        processing: { icon: PlayCircle, variant: 'default' as const, label: 'Processing' },
        processed: { icon: CheckCircle2, variant: 'default' as const, label: 'Processed' },
        failed: { icon: XCircle, variant: 'destructive' as const, label: 'Failed' },
    };

    const config = statusConfig[status];
    const Icon = config.icon;

    return (
        <Badge variant={config.variant} className="gap-1">
            <Icon className="h-3 w-3" />
            {config.label}
        </Badge>
    );
}

function getRecordStatusBadge(status: 'Present' | 'Incomplete') {
    if (status === 'Present') {
        return <Badge variant="default">Present</Badge>;
    }
    return <Badge variant="destructive">Incomplete</Badge>;
}

export default function Processed({ batches, processed, filters, employees, statuses }: Props) {
    const { flash } = usePage().props as any;
    const [processing, setProcessing] = useState<number | null>(null);

    const handleProcess = (batchId: number) => {
        if (!confirm('Are you sure you want to process this batch? This will group clock in/out times and calculate work hours.')) {
            return;
        }

        setProcessing(batchId);
        router.post(
            route('attendance.processed.process', batchId),
            {},
            {
                onFinish: () => setProcessing(null),
            }
        );
    };

    const handleFilter = (key: string, value: string) => {
        // Handle special "all" value by removing the filter
        const filterValue = value === 'all' ? undefined : value;
        router.get(
            route('attendance.processed.index'),
            { ...filters, [key]: filterValue || undefined },
            { preserveState: true, replace: true }
        );
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
        <AppLayout breadcrumbs={[{ title: 'Attendance', href: '/attendance/upload' }, { title: 'Processed Data', href: '/attendance/processed' }]}>
            <Head title="Processed Attendance" />

            <div className="space-y-6 p-6 md:p-4">
                <div>
                    <h1 className="text-3xl font-bold">Processed Attendance</h1>
                    <p className="text-muted-foreground mt-1">
                        Process uploaded attendance data and review results
                    </p>
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
                        <AlertDescription>
                            {Object.values(flash.errors).flat().join(', ')}
                        </AlertDescription>
                    </Alert>
                )}

                <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Upload Batches</h3>
                    
                    {batches.length === 0 ? (
                        <Card>
                            <CardContent className="py-12 text-center text-gray-500">
                                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                <p>No batches available for processing</p>
                                <p className="text-sm mt-2">Upload attendance files to get started</p>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {batches.map((batch) => (
                                <Card key={batch.id} className="relative">
                                    <CardHeader>
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1 min-w-0">
                                                <CardTitle className="text-base truncate">
                                                    {batch.filename}
                                                </CardTitle>
                                                <CardDescription className="text-xs mt-1">
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

                                        {batch.status === 'processing' || batch.status === 'processed' ? (
                                            <div className="space-y-2">
                                                <div className="flex justify-between text-xs text-gray-600">
                                                    <span>Progress</span>
                                                    <span>{batch.progress}%</span>
                                                </div>
                                                <Progress value={batch.progress} />
                                            </div>
                                        ) : null}

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
                            <CardTitle className="text-base flex items-center gap-2">
                                <Filter className="h-4 w-4" />
                                Filters
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-4 md:grid-cols-5">
                                <div className="space-y-2">
                                    <Label>Batch</Label>
                                    <Select
                                        value={filters.batch_id?.toString() || 'all'}
                                        onValueChange={(value) => handleFilter('batch_id', value)}
                                    >
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
                                    <Select
                                        value={filters.status || 'all'}
                                        onValueChange={(value) => handleFilter('status', value)}
                                    >
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
                                    <Input
                                        type="date"
                                        value={filters.date_from || ''}
                                        onChange={(e) => handleFilter('date_from', e.target.value)}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label>Date To</Label>
                                    <Input
                                        type="date"
                                        value={filters.date_to || ''}
                                        onChange={(e) => handleFilter('date_to', e.target.value)}
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-0">
                            {processed.data.length === 0 ? (
                                <div className="py-12 text-center text-gray-500">
                                    <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                    <p>No processed records found</p>
                                    <p className="text-sm mt-2">Process a batch to see attendance records here</p>
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
                                                <TableHead>Status</TableHead>
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
                                                    <TableCell>
                                                        {getRecordStatusBadge(record.status)}
                                                    </TableCell>
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
                                Showing {((processed.current_page - 1) * processed.per_page) + 1} to{' '}
                                {Math.min(processed.current_page * processed.per_page, processed.total)} of{' '}
                                {processed.total} records
                            </p>
                            <div className="flex gap-2">
                                {processed.links.map((link, index) => (
                                    <Button
                                        key={index}
                                        variant={link.active ? 'default' : 'outline'}
                                        size="sm"
                                        disabled={!link.url}
                                        onClick={() => link.url && router.get(link.url)}
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
