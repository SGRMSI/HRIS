import AppLayout from '@/layouts/app-layout';
import { Head, Link, router } from '@inertiajs/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
    Table, 
    TableBody, 
    TableCell, 
    TableHead, 
    TableHeader, 
    TableRow 
} from '@/components/ui/table';
import { 
    ArrowLeft, 
    Download, 
    Search, 
    CheckCircle2, 
    XCircle,
    Filter,
    FileSpreadsheet,
    Trash2
} from 'lucide-react';
import { useState } from 'react';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
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
import { toast } from 'sonner';

interface Employee {
    id: number;
    number: string;
    name: string;
}

interface RawRecord {
    id: number;
    ac_no: string;
    name: string;
    time_log: string;
    state: string;
    new_state: string;
    exception: string;
    operation: string;
    employee: Employee | null;
}

interface Batch {
    id: number;
    filename: string;
    uploaded_at: string;
    uploaded_by: string;
    total_records: number;
    status: string;
}

interface Stats {
    total: number;
    matched: number;
    unmatched: number;
}

interface Filters {
    search?: string;
    has_employee?: string;
}

interface RawShowProps {
    batch: Batch;
    records: {
        data: RawRecord[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
    stats: Stats;
    filters: Filters;
}

export default function RawShow({ batch, records, stats, filters }: RawShowProps) {
    const [search, setSearch] = useState(filters.search || '');
    const [matchFilter, setMatchFilter] = useState(filters.has_employee || 'all');
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

    const handleSearch = () => {
        router.get(
            route('attendance.raw.show', batch.id),
            { 
                search: search || undefined,
                has_employee: matchFilter !== 'all' ? matchFilter : undefined,
            },
            { preserveState: true }
        );
    };

    const handleExport = () => {
        window.location.href = route('attendance.raw.export', batch.id);
    };

    const handleDelete = () => {
        router.delete(route('attendance.raw.destroy', batch.id), {
            onSuccess: () => {
                setDeleteDialogOpen(false);
                router.visit(route('attendance.raw.index'));
            },
            onError: (errors) => {
                if (errors.delete) {
                    toast.error(errors.delete);
                }
            },
        });
    };

    const getMatchBadge = (employee: Employee | null) => {
        if (employee) {
            return (
                <Badge variant="default" className="bg-green-600">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Matched
                </Badge>
            );
        }
        return (
            <Badge variant="destructive">
                <XCircle className="h-3 w-3 mr-1" />
                Unmatched
            </Badge>
        );
    };

    const matchPercentage = stats.total > 0 
        ? ((stats.matched / stats.total) * 100).toFixed(1) 
        : 0;

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Attendance', href: '/attendance/upload' },
                { title: 'Raw Data', href: '/attendance/raw' },
                { title: batch.filename, href: route('attendance.raw.show', batch.id) },
            ]}
        >
            <Head title={`Raw Data - ${batch.filename}`} />
            
            <div className="space-y-6 p-6 md:p-4">
                <div className="flex items-center justify-between">
                    <div>
                        <Link href={route('attendance.raw.index')}>
                            <Button variant="ghost" size="sm" className="mb-2">
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                Back to Batches
                            </Button>
                        </Link>
                        <h1 className="text-3xl font-bold">{batch.filename}</h1>
                        <p className="text-muted-foreground mt-1">
                            Uploaded by {batch.uploaded_by} on {batch.uploaded_at}
                        </p>
                    </div>
                    <div className="flex gap-2">
                        {batch.status !== 'finalized' && (
                            <Button variant="destructive" onClick={() => setDeleteDialogOpen(true)}>
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete Batch
                            </Button>
                        )}
                        <Button onClick={handleExport}>
                            <Download className="h-4 w-4 mr-2" />
                            Export to Excel
                        </Button>
                    </div>
                </div>

                {/* Statistics Cards */}
                <div className="grid gap-4 md:grid-cols-3">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Records</CardTitle>
                            <FileSpreadsheet className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.total}</div>
                            <p className="text-xs text-muted-foreground">
                                All attendance logs
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Matched Employees</CardTitle>
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-600">{stats.matched}</div>
                            <p className="text-xs text-muted-foreground">
                                {matchPercentage}% match rate
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Unmatched Records</CardTitle>
                            <XCircle className="h-4 w-4 text-destructive" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-destructive">{stats.unmatched}</div>
                            <p className="text-xs text-muted-foreground">
                                Needs review
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Filters */}
                <Card>
                    <CardHeader>
                        <CardTitle>Filter Records</CardTitle>
                        <CardDescription>Search and filter raw attendance logs</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex gap-4">
                            <div className="flex-1">
                                <Input
                                    placeholder="Search by AC-No. or Name..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                />
                            </div>
                            <Select value={matchFilter} onValueChange={setMatchFilter}>
                                <SelectTrigger className="w-[200px]">
                                    <Filter className="h-4 w-4 mr-2" />
                                    <SelectValue placeholder="Match Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Records</SelectItem>
                                    <SelectItem value="matched">Matched Only</SelectItem>
                                    <SelectItem value="unmatched">Unmatched Only</SelectItem>
                                </SelectContent>
                            </Select>
                            <Button onClick={handleSearch}>
                                <Search className="h-4 w-4 mr-2" />
                                Search
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Records Table */}
                <Card>
                    <CardHeader>
                        <CardTitle>Attendance Logs ({records.total})</CardTitle>
                        <CardDescription>
                            Raw attendance data from biometric device
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>AC-No.</TableHead>
                                        <TableHead>Name (File)</TableHead>
                                        <TableHead>Time Log</TableHead>
                                        <TableHead>State</TableHead>
                                        <TableHead>Exception</TableHead>
                                        <TableHead>Employee Match</TableHead>
                                        <TableHead>Matched Employee</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {records.data.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                                                No records found
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        records.data.map((record) => (
                                            <TableRow key={record.id}>
                                                <TableCell className="font-mono">{record.ac_no}</TableCell>
                                                <TableCell>{record.name}</TableCell>
                                                <TableCell className="font-mono text-sm">
                                                    {record.time_log}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline">{record.state}</Badge>
                                                </TableCell>
                                                <TableCell>
                                                    {record.exception && (
                                                        <Badge variant="secondary">{record.exception}</Badge>
                                                    )}
                                                </TableCell>
                                                <TableCell>{getMatchBadge(record.employee)}</TableCell>
                                                <TableCell>
                                                    {record.employee ? (
                                                        <div>
                                                            <div className="font-medium">{record.employee.name}</div>
                                                            <div className="text-sm text-muted-foreground font-mono">
                                                                {record.employee.number}
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <span className="text-muted-foreground text-sm">-</span>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>

                        {/* Pagination */}
                        {records.last_page > 1 && (
                            <div className="flex items-center justify-between mt-4">
                                <p className="text-sm text-muted-foreground">
                                    Showing {records.data.length} of {records.total} records
                                </p>
                                <div className="flex gap-2">
                                    {records.current_page > 1 && (
                                        <Link 
                                            href={route('attendance.raw.show', { 
                                                batch: batch.id, 
                                                page: records.current_page - 1,
                                                search: search || undefined,
                                                has_employee: matchFilter !== 'all' ? matchFilter : undefined,
                                            })}
                                        >
                                            <Button variant="outline" size="sm">
                                                Previous
                                            </Button>
                                        </Link>
                                    )}
                                    <span className="flex items-center px-3 text-sm">
                                        Page {records.current_page} of {records.last_page}
                                    </span>
                                    {records.current_page < records.last_page && (
                                        <Link 
                                            href={route('attendance.raw.show', { 
                                                batch: batch.id, 
                                                page: records.current_page + 1,
                                                search: search || undefined,
                                                has_employee: matchFilter !== 'all' ? matchFilter : undefined,
                                            })}
                                        >
                                            <Button variant="outline" size="sm">
                                                Next
                                            </Button>
                                        </Link>
                                    )}
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Attendance Batch?</AlertDialogTitle>
                        <AlertDialogDescription className="space-y-2">
                            <p>
                                Are you sure you want to delete the batch <strong>"{batch.filename}"</strong>?
                            </p>
                            <p className="text-destructive font-semibold">
                                ⚠️ Warning: This will permanently delete:
                            </p>
                            <ul className="list-disc list-inside space-y-1 text-sm">
                                <li>All raw attendance logs ({stats.total} records)</li>
                                <li>All processed attendance records</li>
                                <li>The uploaded file from storage</li>
                            </ul>
                            <p className="text-sm">
                                This action cannot be undone.
                            </p>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
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
