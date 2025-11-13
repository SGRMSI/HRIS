import { DeleteEmployeeDialog } from '@/components/employee/delete-employee-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { router } from '@inertiajs/react';
import { ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal, Eye, Trash2, AlertTriangle, Clock } from 'lucide-react';
import { useState } from 'react';

export type Employee = {
    employee_id: number;
    id_number: string;
    full_name: string;
    company: string;
    department?: string;
    position: string;
    employment_status: 'Probationary' | 'Trainee' | 'Regular' | 'Contractual' | 'Resigned' | 'Terminated';
    date_hired: string;
    contact_number?: string;
    created_at: string;
    evaluation_start_date?: string | null;
    evaluation_end_date?: string | null;
    days_until_evaluation?: number | null;
    is_evaluation_overdue?: boolean;
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
                    <DropdownMenuItem className="text-ghost" onClick={() => setDeleteDialogOpen(true)}>
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
        id: 'evaluation_warning',
        header: 'Evaluation',
        cell: ({ row }) => {
            const employee = row.original;
            const status = employee.employment_status;
            
            // Only show warnings for Probationary and Trainee
            if ((status !== 'Probationary' && status !== 'Trainee') || !employee.evaluation_end_date) {
                return <span className="text-xs text-muted-foreground">-</span>;
            }

            if (employee.is_evaluation_overdue) {
                return (
                    <Badge variant="destructive" className="gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        Overdue
                    </Badge>
                );
            }

            if (employee.days_until_evaluation !== null && employee.days_until_evaluation !== undefined) {
                if (employee.days_until_evaluation >= 0 && employee.days_until_evaluation <= 3) {
                    return (
                        <Badge variant="outline" className="gap-1 border-amber-500 text-amber-600">
                            <Clock className="h-3 w-3" />
                            {employee.days_until_evaluation}d left
                        </Badge>
                    );
                }
            }

            return <span className="text-xs text-green-600">On Track</span>;
        },
    },
    {
        id: 'actions',
        cell: ({ row }) => {
            const employee = row.original;
            return <ActionsCell employee={employee} />;
        },
    },
];