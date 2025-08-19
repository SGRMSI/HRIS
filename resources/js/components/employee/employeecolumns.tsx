import { DeleteEmployeeDialog } from '@/components/employee/delete-employee-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { router } from '@inertiajs/react';
import { ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal, Eye, Trash2 } from 'lucide-react';
import { useState } from 'react';

export type Employee = {
    employee_id: number;
    id_number: string;
    full_name: string;
    company: string;
    department?: string;
    position: string;
    employment_status: 'Probationary' | 'Regular' | 'Contractual' | 'Resigned' | 'Terminated';
    date_hired: string;
    contact_number?: string;
};

const ActionsCell = ({ employee }: { employee: Employee }) => {
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

    const handleView = () => {
        router.visit(`/employee/${employee.employee_id}`);
    };

    return (
        <>
            <DropdownMenu modal={false}>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={handleView}>
                        <Eye className="mr-2 h-4 w-4" />
                        View
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-red-600" onClick={() => setDeleteDialogOpen(true)}>
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            <DeleteEmployeeDialog
                employee={{
                    id: employee.employee_id,
                    name: employee.full_name,
                }}
                open={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
            />
        </>
    );
};

export const columns: ColumnDef<Employee>[] = [
    {
        accessorKey: 'id_number',
        header: 'Employee ID',
    },
    {
        accessorKey: 'full_name',
        header: 'Full Name',
    },
    {
        accessorKey: 'company',
        header: 'Company',
    },
    {
        accessorKey: 'department',
        header: 'Department',
        cell: ({ row }) => {
            const department = row.getValue('department') as string;
            return department || 'N/A';
        },
    },
    {
        accessorKey: 'position',
        header: 'Position',
    },
    {
        accessorKey: 'employment_status',
        header: 'Status',
        cell: ({ row }) => {
            const status = row.getValue('employment_status') as string;
            let variant: 'default' | 'secondary' | 'destructive' | 'outline' = 'default';

            switch (status) {
                case 'Regular':
                    variant = 'default';
                    break;
                case 'Probationary':
                    variant = 'outline';
                    break;
                case 'Contractual':
                    variant = 'secondary';
                    break;
                case 'Resigned':
                case 'Terminated':
                    variant = 'destructive';
                    break;
                default:
                    variant = 'secondary';
            }

            return <Badge variant={variant}>{status}</Badge>;
        },
    },
    {
        accessorKey: 'date_hired',
        header: 'Date Hired',
        cell: ({ row }) => {
            const date = row.getValue('date_hired') as string;
            return new Date(date).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
            });
        },
    },
    {
        accessorKey: 'contact_number',
        header: 'Contact',
        cell: ({ row }) => {
            const contact = row.getValue('contact_number') as string;
            return contact || 'N/A';
        },
    },
    {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => {
            const employee = row.original;
            return <ActionsCell employee={employee} />;
        },
    },
];
