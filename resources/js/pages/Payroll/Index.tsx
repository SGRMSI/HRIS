import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem, PageProps, PaginatedData } from '@/types';
import { PayrollFilters, PayrollPeriod } from '@/types/payroll';
import { Head, Link, router } from '@inertiajs/react';
import { format } from 'date-fns';
import { Calendar, Download, PlusCircle, Search, Settings, Users } from 'lucide-react';
import { useState } from 'react';

interface Props extends PageProps {
    periods: PaginatedData<PayrollPeriod>;
    filters: PayrollFilters;
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Payroll',
        href: '/payroll',
    },
];

export default function Index({ periods, filters }: Props) {
    const [search, setSearch] = useState(filters.search || '');
    const [status, setStatus] = useState(filters.status || '');

    const handleFilter = () => {
        router.get(route('payroll.index'), { search, status }, { preserveState: true, preserveScroll: true });
    };

    const getStatusBadge = (status: string) => {
        const variants: Record<string, 'default' | 'secondary' | 'destructive'> = {
            draft: 'secondary',
            approved: 'default',
            paid: 'default',
        };

        const colors: Record<string, string> = {
            draft: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
            approved: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
            paid: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
        };

        return (
            <Badge variant={variants[status] || 'default'} className={colors[status]}>
                {status.toUpperCase()}
            </Badge>
        );
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Payroll" />

            <div className="mb-6 flex items-center justify-between p-6">
                <h2 className="text-2xl font-bold tracking-tight">Payroll Management</h2>
                <div className="flex gap-2">
                    <Link href={route('payroll.employee-settings.index')}>
                        <Button variant="outline">
                            <Settings className="mr-2 h-4 w-4" />
                            Employee Settings
                        </Button>
                    </Link>
                    <Link href={route('payroll.create')}>
                        <Button>
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Create Payroll Period
                        </Button>
                    </Link>
                </div>
            </div>

            <div className="">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                    {/* Filters */}
                    <Card className="mb-6">
                        <CardContent className="pt-6">
                            <div className="flex flex-col gap-4 md:flex-row md:items-end">
                                <div className="flex-1">
                                    <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Search Period</label>
                                    <div className="relative">
                                        <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
                                        <Input
                                            type="text"
                                            placeholder="Search by period name..."
                                            value={search}
                                            onChange={(e) => setSearch(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && handleFilter()}
                                            className="pl-10"
                                        />
                                    </div>
                                </div>

                                <div className="w-full md:w-48">
                                    <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Status</label>
                                    <Select value={status || undefined} onValueChange={setStatus}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="All Status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="draft">Draft</SelectItem>
                                            <SelectItem value="approved">Approved</SelectItem>
                                            <SelectItem value="paid">Paid</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <Button onClick={handleFilter}>
                                    <Search className="mr-2 h-4 w-4" />
                                    Filter
                                </Button>

                                {(search || status) && (
                                    <Button
                                        variant="outline"
                                        onClick={() => {
                                            setSearch('');
                                            setStatus('');
                                            router.get(route('payroll.index'));
                                        }}
                                    >
                                        Clear
                                    </Button>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Payroll Periods Table */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Payroll Periods</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {periods.data.length === 0 ? (
                                <div className="py-12 text-center text-gray-500 dark:text-gray-400">
                                    <Calendar className="mx-auto mb-3 h-12 w-12 opacity-50" />
                                    <p>No payroll periods found.</p>
                                    <Link href={route('payroll.create')}>
                                        <Button className="mt-4" variant="outline">
                                            Create Your First Payroll
                                        </Button>
                                    </Link>
                                </div>
                            ) : (
                                <>
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Period Name</TableHead>
                                                <TableHead>Period</TableHead>
                                                <TableHead className="text-center">Employees</TableHead>
                                                <TableHead className="text-right">Gross Pay</TableHead>
                                                <TableHead className="text-right">Deductions</TableHead>
                                                <TableHead className="text-right">Net Pay</TableHead>
                                                <TableHead className="text-center">Status</TableHead>
                                                <TableHead className="text-center">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {periods.data.map((period) => (
                                                <TableRow key={period.period_id}>
                                                    <TableCell className="font-medium">
                                                        <Link
                                                            href={route('payroll.show', period.period_id)}
                                                            className="text-blue-600 hover:underline dark:text-blue-400"
                                                        >
                                                            {period.period_name}
                                                        </Link>
                                                    </TableCell>
                                                    <TableCell className="text-sm text-gray-600 dark:text-gray-400">
                                                        {format(new Date(period.date_from), 'MMM d')} -{' '}
                                                        {format(new Date(period.date_to), 'MMM d, yyyy')}
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        <div className="inline-flex items-center gap-1">
                                                            <Users className="h-4 w-4" />
                                                            {period.total_employees || period.payroll_records_count || 0}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-right font-medium">
                                                        ₱{parseFloat(period.total_gross).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                                                    </TableCell>
                                                    <TableCell className="text-right text-red-600 dark:text-red-400">
                                                        ₱{parseFloat(period.total_deductions).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                                                    </TableCell>
                                                    <TableCell className="text-right font-bold text-green-600 dark:text-green-400">
                                                        ₱{parseFloat(period.total_net).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                                                    </TableCell>
                                                    <TableCell className="text-center">{getStatusBadge(period.status)}</TableCell>
                                                    <TableCell className="text-center">
                                                        <div className="flex items-center justify-center gap-2">
                                                            <Link href={route('payroll.show', period.period_id)}>
                                                                <Button size="sm" variant="outline">
                                                                    View
                                                                </Button>
                                                            </Link>
                                                            <a href={route('payroll.export', period.period_id)}>
                                                                <Button size="sm" variant="outline">
                                                                    <Download className="h-4 w-4" />
                                                                </Button>
                                                            </a>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>

                                    {/* Pagination */}
                                    {periods.links && periods.links.length > 3 && (
                                        <div className="mt-4 flex items-center justify-between">
                                            <div className="text-sm text-gray-600 dark:text-gray-400">
                                                Showing {periods.from} to {periods.to} of {periods.total} results
                                            </div>
                                            <div className="flex gap-1">
                                                {periods.links.map((link, index) => (
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
                                </>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}
