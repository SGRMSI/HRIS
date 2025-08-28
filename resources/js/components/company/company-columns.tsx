import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Link, router } from '@inertiajs/react';
import { ColumnDef } from '@tanstack/react-table';
import { Edit, Eye, MoreHorizontal, Trash2 } from 'lucide-react';

export interface Company {
    company_id: number;
    name: string;
    industry: string;
    departments_count: number;
    positions_count: number;
    employees_count: number;
    accounts_count?: number;
    created_at: string;
    updated_at: string;
}

export const columns: ColumnDef<Company>[] = [
    {
        accessorKey: 'name',
        header: 'Company Name',
        cell: ({ row }) => {
            const company = row.original;
            return <div className="font-medium">{company.name}</div>;
        },
    },
    {
        accessorKey: 'industry',
        header: 'Industry',
        cell: ({ row }) => {
            const company = row.original;
            return <Badge variant="secondary">{company.industry}</Badge>;
        },
    },
    {
        accessorKey: 'employees_count',
        header: 'Employees',
        cell: ({ row }) => {
            const company = row.original;
            return (
                <div className="text-center">
                    <Badge variant="outline">{company.employees_count}</Badge>
                </div>
            );
        },
    },
    {
        accessorKey: 'departments_count',
        header: 'Departments',
        cell: ({ row }) => {
            const company = row.original;
            return (
                <div className="text-center">
                    <Badge variant="outline">{company.departments_count}</Badge>
                </div>
            );
        },
    },
    {
        accessorKey: 'positions_count',
        header: 'Positions',
        cell: ({ row }) => {
            const company = row.original;
            return (
                <div className="text-center">
                    <Badge variant="outline">{company.positions_count}</Badge>
                </div>
            );
        },
    },
    {
        accessorKey: 'accounts_count',
        header: 'Accounts',
        cell: ({ row }) => {
            const company = row.original;
            return (
                <div className="text-center">
                    <Badge variant="outline">{company.accounts_count || 0}</Badge>
                </div>
            );
        },
    },
    {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => {
            const company = row.original;

            const handleDelete = () => {
                if (confirm(`Are you sure you want to delete ${company.name}? This action cannot be undone.`)) {
                    router.delete(route('company.destroy', company.company_id));
                }
            };

            return (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                            <Link href={route('company.show', company.company_id)}>
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                            <Link href={route('company.edit', company.company_id)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                            </Link>
                         </DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600" onClick={handleDelete} disabled={company.employees_count > 0}>
                            <Trash2 className="mr-2 h-4 w-4" />
                            {company.employees_count > 0 ? 'Cannot Delete' : 'Delete'}
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            );
        },
    },
];
