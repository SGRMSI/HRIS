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

interface DataTableProps<TData, TValue> {
    columns: ColumnDef<TData, TValue>[];
    data: TData[];
}

export function EmployeeDataTable<TData, TValue>({ columns, data }: DataTableProps<TData, TValue>) {
    const [sorting, setSorting] = React.useState<SortingState>([]);
    const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
    const [recentlyAddedFilter, setRecentlyAddedFilter] = React.useState<string>('newest');

    // Extract unique companies for the filter dropdown
    const uniqueCompanies = React.useMemo(() => {
        const companies = data
            .map((row) => (row as { company?: string }).company)
            .filter(Boolean) as string[];
        return [...new Set(companies)].sort();
    }, [data]);

    // Filter and sort data
    const filteredData = React.useMemo(() => {
        let filtered = [...data];
        
        // Apply name search filter
        const nameFilter = columnFilters.find(f => f.id === 'full_name');
        if (nameFilter && nameFilter.value) {
            const searchValue = (nameFilter.value as string).toLowerCase();
            filtered = filtered.filter(row => 
                (row as { full_name?: string }).full_name?.toLowerCase().includes(searchValue)
            );
        }
        
        // Apply company filter
        const companyFilter = columnFilters.find(f => f.id === 'company');
        if (companyFilter && companyFilter.value) {
            filtered = filtered.filter(row => 
                (row as { company?: string }).company === companyFilter.value
            );
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
    }, [data, recentlyAddedFilter, columnFilters]);

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
            <div className="flex items-center py-4 justify-between">
                <div className="flex items-center gap-3">
                    <Input
                        placeholder="Search by name..."
                        value={(table.getColumn('full_name')?.getFilterValue() as string) ?? ''}
                        onChange={(event) => table.getColumn('full_name')?.setFilterValue(event.target.value)}
                        className="w-[250px]"
                    />
                    
                    <Select
                        value={(table.getColumn('company')?.getFilterValue() as string) ?? ''}
                        onValueChange={(value) => 
                            table.getColumn('company')?.setFilterValue(value === 'all' ? '' : value)
                        }
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
                        value={recentlyAddedFilter}
                        onValueChange={setRecentlyAddedFilter}
                    >
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Sort by date" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="newest">Newest to Oldest</SelectItem>
                            <SelectItem value="oldest">Oldest to Newest</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <Button asChild>
                    <Link href="/employee/create">Add Employee</Link>
                </Button>
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
                            table.getRowModel().rows.map((row) => (
                                <TableRow key={row.id}>
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                                    ))}
                                </TableRow>
                            ))
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
