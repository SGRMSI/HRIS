import {
    ColumnDef,
    ColumnFiltersState,
    SortingState,
    flexRender,
    getCoreRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    useReactTable,
} from '@tanstack/react-table';
import * as React from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Link } from '@inertiajs/react';
import { EmployeeImportCsv } from './employee-import-csv';

interface DataTableProps<TData, TValue> {
    columns: ColumnDef<TData, TValue>[];
    data: TData[];
    onFilteredDataChange?: (filteredData: TData[]) => void;
}

export function EmployeeDataTable<TData, TValue>({ columns, data, onFilteredDataChange }: DataTableProps<TData, TValue>) {
    const [sorting, setSorting] = React.useState<SortingState>([]);
    const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
    const [recentlyAddedFilter, setRecentlyAddedFilter] = React.useState<string>('newest');
    const [evaluationFilter, setEvaluationFilter] = React.useState<string>('all');

    // Extract unique companies for the filter dropdown
    const uniqueCompanies = React.useMemo(() => {
        const companies = data.map((row) => (row as { company?: string }).company).filter(Boolean) as string[];
        return [...new Set(companies)].sort();
    }, [data]);

    // Extract unique employment statuses for the filter dropdown
    const uniqueStatuses = React.useMemo(() => {
        const statuses = data.map((row) => (row as { employment_status?: string }).employment_status).filter(Boolean) as string[];
        return [...new Set(statuses)].sort();
    }, [data]);

    // Filter and sort data
    const filteredData = React.useMemo(() => {
        let filtered = [...data];

        // Apply name search filter
        const nameFilter = columnFilters.find((f) => f.id === 'full_name');
        if (nameFilter && nameFilter.value) {
            const searchValue = (nameFilter.value as string).toLowerCase();
            filtered = filtered.filter((row) => (row as { full_name?: string }).full_name?.toLowerCase().includes(searchValue));
        }

        // Apply company filter
        const companyFilter = columnFilters.find((f) => f.id === 'company');
        if (companyFilter && companyFilter.value) {
            filtered = filtered.filter((row) => (row as { company?: string }).company === companyFilter.value);
        }

        // Apply employment status filter
        const statusFilter = columnFilters.find((f) => f.id === 'employment_status');
        if (statusFilter && statusFilter.value) {
            filtered = filtered.filter((row) => (row as { employment_status?: string }).employment_status === statusFilter.value);
        }

        // Apply evaluation warning filter
        if (evaluationFilter !== 'all') {
            filtered = filtered.filter((row) => {
                const employee = row as { 
                    employment_status?: string; 
                    evaluation_end_date?: string | null; 
                    is_evaluation_overdue?: boolean;
                    days_until_evaluation?: number | null;
                };
                
                const status = employee.employment_status;
                const hasEvaluationTracking = (status === 'Probationary' || status === 'Trainee') && employee.evaluation_end_date;
                
                if (!hasEvaluationTracking) {
                    return evaluationFilter === 'none';
                }

                if (evaluationFilter === 'overdue') {
                    return employee.is_evaluation_overdue === true;
                }

                if (evaluationFilter === 'due-soon') {
                    return employee.days_until_evaluation !== null && 
                           employee.days_until_evaluation !== undefined &&
                           employee.days_until_evaluation >= 0 && 
                           employee.days_until_evaluation <= 3 && 
                           !employee.is_evaluation_overdue;
                }

                if (evaluationFilter === 'warnings') {
                    // Both overdue and due soon
                    const isOverdue = employee.is_evaluation_overdue === true;
                    const isDueSoon = employee.days_until_evaluation !== null && 
                                     employee.days_until_evaluation !== undefined &&
                                     employee.days_until_evaluation >= 0 && 
                                     employee.days_until_evaluation <= 3;
                    return isOverdue || isDueSoon;
                }

                return true;
            });
        }

        // Sort by created_at based on selected order
        filtered.sort((a, b) => {
            const dateA = (a as { created_at?: string }).created_at;
            const dateB = (b as { created_at?: string }).created_at;
            if (!dateA || !dateB) return 0;

            if (recentlyAddedFilter === 'oldest') {
                // Oldest to Newest (ascending)
                return new Date(dateA).getTime() - new Date(dateB).getTime();
            } else {
                // Newest to Oldest (descending) - default
                return new Date(dateB).getTime() - new Date(dateA).getTime();
            }
        });

        return filtered;
    }, [data, recentlyAddedFilter, columnFilters, evaluationFilter]);

    // Notify parent component when filtered data changes
    React.useEffect(() => {
        onFilteredDataChange?.(filteredData);
    }, [filteredData, onFilteredDataChange]);

    const table = useReactTable({
        data: filteredData,
        columns,
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        state: {
            sorting,
            columnFilters,
        },
        manualFiltering: true, // We handle filtering manually in the filteredData memo
    });

    return (
        <div className="w-full">
                                {/* Action buttons on the same row */}
                    <div className="ml-auto flex items-center gap-2">
                        <Button asChild>
                            <Link href="/employee/create">Add Employee</Link>
                        </Button>

                        <EmployeeImportCsv />
                    </div>
            <div className="flex flex-col gap-4 py-4">
                {/* First row: Search and main filters */}
                <div className="flex flex-wrap items-center gap-3">
                    <Input
                        placeholder="Search by name..."
                        value={(table.getColumn('full_name')?.getFilterValue() as string) ?? ''}
                        onChange={(event) => table.getColumn('full_name')?.setFilterValue(event.target.value)}
                        className="w-[250px]"
                    />

                    <Select
                        value={(table.getColumn('company')?.getFilterValue() as string) ?? ''}
                        onValueChange={(value) => table.getColumn('company')?.setFilterValue(value === 'all' ? '' : value)}
                    >
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Filter by company" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Companies</SelectItem>
                            {uniqueCompanies.map((company) => (
                                <SelectItem key={company} value={company}>
                                    {company}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Select
                        value={(table.getColumn('employment_status')?.getFilterValue() as string) ?? ''}
                        onValueChange={(value) => table.getColumn('employment_status')?.setFilterValue(value === 'all' ? '' : value)}
                    >
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Filter by status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Statuses</SelectItem>
                            {uniqueStatuses.map((status) => (
                                <SelectItem key={status} value={status}>
                                    {status}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Select value={recentlyAddedFilter} onValueChange={setRecentlyAddedFilter}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Sort by date" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="newest">Newest to Oldest</SelectItem>
                            <SelectItem value="oldest">Oldest to Newest</SelectItem>
                        </SelectContent>
                    </Select>

                    <Select value={evaluationFilter} onValueChange={setEvaluationFilter}>
                        <SelectTrigger className="w-[200px]">
                            <SelectValue placeholder="Filter by evaluation" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Employees</SelectItem>
                            <SelectItem value="warnings"> With Warnings</SelectItem>
                            <SelectItem value="overdue">Overdue Only</SelectItem>
                            <SelectItem value="due-soon"> Due Soon Only</SelectItem>
                            <SelectItem value="none">No Evaluation</SelectItem>
                        </SelectContent>
                    </Select>

                </div>
            </div>
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id}>
                                {headerGroup.headers.map((header) => {
                                    return (
                                        <TableHead key={header.id}>
                                            {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                                        </TableHead>
                                    );
                                })}
                            </TableRow>
                        ))}
                    </TableHeader>
                    <TableBody>
                        {table.getRowModel().rows?.length ? (
                            table.getRowModel().rows.map((row) => {
                                const employee = row.original as { 
                                    employment_status?: string; 
                                    evaluation_end_date?: string | null; 
                                    is_evaluation_overdue?: boolean;
                                    days_until_evaluation?: number | null;
                                };
                                
                                // Determine if row should be highlighted
                                const hasEvaluationTracking = (employee.employment_status === 'Probationary' || employee.employment_status === 'Trainee') && employee.evaluation_end_date;
                                const isOverdue = hasEvaluationTracking && employee.is_evaluation_overdue === true;
                                const isDueSoon = hasEvaluationTracking && 
                                                 employee.days_until_evaluation !== null && 
                                                 employee.days_until_evaluation !== undefined &&
                                                 employee.days_until_evaluation >= 0 && 
                                                 employee.days_until_evaluation <= 3 && 
                                                 !employee.is_evaluation_overdue;
                                
                                const rowClassName = isOverdue 
                                    ? 'bg-red-50 dark:bg-red-950/20 border-l-4 border-l-red-500'
                                    : isDueSoon 
                                    ? 'bg-amber-50 dark:bg-amber-950/20 border-l-4 border-l-amber-500'
                                    : '';
                                
                                return (
                                    <TableRow key={row.id} className={rowClassName}>
                                        {row.getVisibleCells().map((cell) => (
                                            <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                                        ))}
                                    </TableRow>
                                );
                            })
                        ) : (
                            <TableRow>
                                <TableCell colSpan={columns.length} className="h-24 text-center">
                                    No employees found.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
            <div className="flex items-center justify-end space-x-2 py-4">
                <div className="flex-1 text-sm text-muted-foreground">
                    Showing {table.getRowModel().rows.length} of {data.length} employees
                </div>
                <div className="space-x-2">
                    <Button variant="outline" size="sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
                        Previous
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
                        Next
                    </Button>
                </div>
            </div>
        </div>
    );
}
