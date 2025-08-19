import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ColumnDef } from '@tanstack/react-table';
import { ArrowUpDown, MoreHorizontal } from 'lucide-react';

export type Employee = {
    employee_id: number;
    id_number: string;
    full_name: string;
    company: string;
    department: string | null;
    position: string;
    employment_status: string;
    date_hired: string;
    contact_number: string;
};

export const columns: ColumnDef<Employee>[] = [
    {
        accessorKey: 'id_number',
        header: 'Employee ID',
        enableSorting: false,
    },
    {
        accessorKey: 'full_name',
        header: ({ column }) => {
            return (
                <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
                    Full Name
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            );
        },
        enableSorting: true,
    },
    {
        accessorKey: 'company',
        header: 'Company',
        enableSorting: false,
    },
    {
        accessorKey: 'department',
        header: 'Department',
        enableSorting: false,
    },
    {
        accessorKey: 'position',
        header: 'Position',
        enableSorting: false,
    },
    {
        accessorKey: 'employment_status',
        header: 'Status',
        enableSorting: false,
    },
    {
        accessorKey: 'date_hired',
        header: ({ column }) => {
            return (
                <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
                    Date Hired
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            );
        },
        enableSorting: true,
        cell: ({ row }) => {
            const date = new Date(row.getValue('date_hired'));
            return date.toLocaleDateString();
        },
    },
    {
        accessorKey: 'contact_number',
        header: 'Contact',
        enableSorting: false,
    },
    {
        id: 'actions',
        enableHiding: false,
        enableSorting: false,
        cell: ({ row }) => {
            const employee = row.original;

            return (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => navigator.clipboard.writeText(employee.id_number)}>Copy Employee ID</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem>View employee</DropdownMenuItem>
                        <DropdownMenuItem>Edit employee</DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            );
        },
    },
];
