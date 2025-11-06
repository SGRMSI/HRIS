import AppLayout from '@/layouts/app-layout';
import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
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
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { 
    Plus, 
    Search, 
    Edit, 
    Trash2, 
    Calendar, 
    ChevronLeft,
    ChevronRight,
    Upload,
    Download
} from 'lucide-react';

interface Holiday {
    id: number;
    name: string;
    date: string;
    formatted_date: string;
    day_of_week: string;
    type: 'regular' | 'special' | 'company';
    company: {
        id: number;
        name: string;
    } | null;
    is_past: boolean;
    is_upcoming: boolean;
}

interface Company {
    id: number;
    name: string;
}

interface TypeOption {
    value: string;
    label: string;
}

interface Props {
    holidays: {
        data: Holiday[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
    filters: {
        year?: number;
        company_id?: number;
        type?: string;
        search?: string;
    };
    companies: Company[];
    types: TypeOption[];
    availableYears: number[];
    currentYear: number;
}

export default function HolidaysIndex({ 
    holidays, 
    filters = {}, 
    companies = [], 
    types = [],
    availableYears = [],
    currentYear 
}: Props) {
    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const [deleteHoliday, setDeleteHoliday] = useState<Holiday | null>(null);
    const [showImportDialog, setShowImportDialog] = useState(false);
    const [importFile, setImportFile] = useState<File | null>(null);
    const [skipDuplicates, setSkipDuplicates] = useState(true);
    const [selectedCompanyForImport, setSelectedCompanyForImport] = useState<string>('');

    const handleFilter = (key: string, value: string | number) => {
        const filterValue = value === 'all' || value === '' ? undefined : value;
        router.get(
            route('attendance.holidays.index'),
            { ...filters, [key]: filterValue },
            { preserveState: true }
        );
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        handleFilter('search', searchTerm);
    };

    const handleYearChange = (increment: number) => {
        const currentYearValue = filters.year ? Number(filters.year) : currentYear;
        const newYear = currentYearValue + increment;
        handleFilter('year', newYear);
    };

    const handleDelete = () => {
        if (deleteHoliday) {
            router.delete(route('attendance.holidays.destroy', deleteHoliday.id), {
                onSuccess: () => setDeleteHoliday(null)
            });
        }
    };

    const handleImport = () => {
        if (!importFile) return;

        const formData = new FormData();
        formData.append('file', importFile);
        formData.append('skip_duplicates', skipDuplicates ? '1' : '0');
        if (selectedCompanyForImport) {
            formData.append('company_id', selectedCompanyForImport);
        }

        router.post(route('attendance.holidays.import'), formData, {
            onSuccess: () => {
                setShowImportDialog(false);
                setImportFile(null);
                setSelectedCompanyForImport('');
            }
        });
    };

    const handleExport = () => {
        const params = new URLSearchParams();
        if (filters.year) params.append('year', filters.year.toString());
        if (filters.company_id) params.append('company_id', filters.company_id.toString());
        if (filters.type) params.append('type', filters.type);
        
        window.location.href = route('attendance.holidays.export') + '?' + params.toString();
    };

    const getTypeBadgeVariant = (type: string) => {
        switch (type) {
            case 'regular':
                return 'default';
            case 'special':
                return 'secondary';
            case 'company':
                return 'outline';
            default:
                return 'default';
        }
    };

    const displayYear = filters.year ? Number(filters.year) : currentYear;

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Attendance', href: '/attendance/upload' },
                { title: 'Holidays', href: '#' }
            ]}
        >
            <Head title="Holidays Management" />

            <div className="space-y-6 p-6 md:p-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold">Holidays Management</h1>
                        <p className="text-muted-foreground mt-1">Manage company holidays and special dates</p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => setShowImportDialog(true)}>
                            <Upload className="mr-2 h-4 w-4" />
                            Import
                        </Button>
                        <Button variant="outline" onClick={handleExport}>
                            <Download className="mr-2 h-4 w-4" />
                            Export
                        </Button>
                        <Link href={route('attendance.holidays.create')}>
                            <Button>
                                <Plus className="mr-2 h-4 w-4" />
                                Add Holiday
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* Filters */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Filters</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-4 md:grid-cols-4">
                            {/* Year Navigation */}
                            <div className="space-y-2">
                                <Label>Year</Label>
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        onClick={() => handleYearChange(-1)}
                                    >
                                        <ChevronLeft className="h-4 w-4" />
                                    </Button>
                                    <div className="flex-1 text-center font-semibold">
                                        {displayYear}
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        onClick={() => handleYearChange(1)}
                                    >
                                        <ChevronRight className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>

                            {/* Company Filter */}
                            <div className="space-y-2">
                                <Label>Company</Label>
                                <Select
                                    value={filters.company_id?.toString() || 'all'}
                                    onValueChange={(value) => handleFilter('company_id', value)}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="All Companies" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Companies</SelectItem>
                                        {Array.isArray(companies) && companies
                                            .filter(company => company && company.id != null)
                                            .map((company) => (
                                                <SelectItem key={company.id} value={company.id.toString()}>
                                                    {company.name}
                                                </SelectItem>
                                            ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Type Filter */}
                            <div className="space-y-2">
                                <Label>Type</Label>
                                <Select
                                    value={filters.type || 'all'}
                                    onValueChange={(value) => handleFilter('type', value)}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="All Types" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Types</SelectItem>
                                        {Array.isArray(types) && types.map((type) => (
                                            <SelectItem key={type.value} value={type.value}>
                                                {type.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Search */}
                            <div className="space-y-2">
                                <Label>Search</Label>
                                <form onSubmit={handleSearch} className="flex gap-2">
                                    <Input
                                        placeholder="Holiday name..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                    <Button type="submit" size="icon" variant="outline">
                                        <Search className="h-4 w-4" />
                                    </Button>
                                </form>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Holidays Table */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Calendar className="h-5 w-5" />
                            Holidays for {displayYear}
                            <Badge variant="secondary" className="ml-auto">
                                {holidays.total} total
                            </Badge>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Holiday Name</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Day</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Company</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {holidays.data.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                                            No holidays found for {displayYear}
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    holidays.data.map((holiday) => (
                                        <TableRow key={holiday.id}>
                                            <TableCell className="font-medium">{holiday.name}</TableCell>
                                            <TableCell>{holiday.formatted_date}</TableCell>
                                            <TableCell>{holiday.day_of_week}</TableCell>
                                            <TableCell>
                                                <Badge variant={getTypeBadgeVariant(holiday.type)}>
                                                    {types.find(t => t.value === holiday.type)?.label || holiday.type}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                {holiday.company ? holiday.company.name : 'All'}
                                            </TableCell>
                                            <TableCell>
                                                {holiday.is_upcoming ? (
                                                    <Badge variant="default">Upcoming</Badge>
                                                ) : holiday.is_past ? (
                                                    <Badge variant="secondary">Past</Badge>
                                                ) : (
                                                    <Badge variant="outline">This Year</Badge>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Link href={route('attendance.holidays.edit', holiday.id)}>
                                                        <Button variant="ghost" size="icon">
                                                            <Edit className="h-4 w-4" />
                                                        </Button>
                                                    </Link>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => setDeleteHoliday(holiday)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>

                        {/* Pagination */}
                        {holidays.last_page > 1 && (
                            <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
                                <div>
                                    Showing {((holidays.current_page - 1) * holidays.per_page) + 1} to{' '}
                                    {Math.min(holidays.current_page * holidays.per_page, holidays.total)} of{' '}
                                    {holidays.total} holidays
                                </div>
                                <div className="flex gap-2">
                                    {Array.from({ length: holidays.last_page }, (_, i) => i + 1).map((page) => (
                                        <Button
                                            key={page}
                                            variant={page === holidays.current_page ? 'default' : 'outline'}
                                            size="sm"
                                            onClick={() => router.get(route('attendance.holidays.index', { ...filters, page }))}
                                        >
                                            {page}
                                        </Button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={!!deleteHoliday} onOpenChange={() => setDeleteHoliday(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Holiday</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete "{deleteHoliday?.name}"? This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Import Dialog */}
            <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Import Holidays</DialogTitle>
                        <DialogDescription>
                            Upload an Excel file containing holidays data
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="file">Excel File</Label>
                            <Input
                                id="file"
                                type="file"
                                accept=".xlsx,.xls,.csv"
                                onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                            />
                            <p className="text-sm text-muted-foreground">
                                Required columns: name, date, type
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="import_company">Company (Optional)</Label>
                            <Select
                                value={selectedCompanyForImport || 'none'}
                                onValueChange={(value) => setSelectedCompanyForImport(value === 'none' ? '' : value)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select company" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">None - All Companies</SelectItem>
                                    {Array.isArray(companies) && companies
                                        .filter(company => company && company.id != null)
                                        .map((company) => (
                                            <SelectItem key={company.id} value={company.id.toString()}>
                                                {company.name}
                                            </SelectItem>
                                        ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex items-center space-x-2">
                            <input
                                type="checkbox"
                                id="skip_duplicates"
                                checked={skipDuplicates}
                                onChange={(e) => setSkipDuplicates(e.target.checked)}
                                className="rounded border-gray-300"
                            />
                            <Label htmlFor="skip_duplicates" className="cursor-pointer">
                                Skip duplicate holidays
                            </Label>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowImportDialog(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleImport} disabled={!importFile}>
                            <Upload className="mr-2 h-4 w-4" />
                            Import
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
