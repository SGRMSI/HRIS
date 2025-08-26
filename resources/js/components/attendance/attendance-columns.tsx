import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal, Eye, Edit, ArrowUpDown } from 'lucide-react';

export type AttendanceRecord = {
    id: number;
    employee_id: number;
    full_name: string;
    time_in: string | null;
    time_out: string | null;
    date: string;
    status: 'Work' | 'Break' | 'Incomplete';
};

const ActionsCell = ({ record }: { record: AttendanceRecord }) => {
    const handleView = () => {
        console.log('View attendance record:', record.id);
        // Add navigation logic here if needed
    };

    const handleEdit = () => {
        console.log('Edit attendance record:', record.id);
        // Add edit logic here if needed
    };

    return (
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
                <DropdownMenuItem onClick={handleEdit}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
};

const StatusBadge = ({ status }: { status: AttendanceRecord['status'] }) => {
    const getStatusVariant = (status: AttendanceRecord['status']) => {
        switch (status) {
            case 'Work':
                return 'default'; // Green
            case 'Break':
                return 'secondary'; // Orange/Yellow
            case 'Incomplete':
                return 'destructive'; // Red
            default:
                return 'outline';
        }
    };

    return (
        <Badge variant={getStatusVariant(status)} className="capitalize">
            {status}
        </Badge>
    );
};

export const columns: ColumnDef<AttendanceRecord>[] = [
    {
        accessorKey: 'date',
        header: ({ column }) => {
            return (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
                    className="p-0 h-auto font-medium"
                >
                    Date
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            );
        },
        cell: ({ row }) => {
            const date = new Date(row.getValue('date'));
            return (
                <div>
                    {date.toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'short', 
                        day: 'numeric' 
                    })}
                </div>
            );
        },
    },
    {
        accessorKey: 'employee_id',
        header: ({ column }) => {
            return (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
                    className="p-0 h-auto font-medium"
                >
                    Employee ID
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            );
        },
        cell: ({ row }) => <div className="font-medium">{row.getValue('employee_id')}</div>,
    },
    {
        accessorKey: 'full_name',
        header: ({ column }) => {
            return (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
                    className="p-0 h-auto font-medium"
                >
                    Employee Name
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            );
        },
        cell: ({ row }) => <div className="font-medium">{row.getValue('full_name')}</div>,
    },
    {
        accessorKey: 'time_in',
        header: 'Time-In',
        cell: ({ row }) => {
            const timeIn = row.getValue('time_in') as string | null;
            return (
                <div className={timeIn ? 'text-foreground' : 'text-muted-foreground'}>
                    {timeIn ? new Date(`2000-01-01T${timeIn}`).toLocaleTimeString('en-US', { 
                        hour: '2-digit', 
                        minute: '2-digit',
                        hour12: true 
                    }) : '—'}
                </div>
            );
        },
    },
    {
        accessorKey: 'time_out',
        header: 'Time-Out',
        cell: ({ row }) => {
            const timeOut = row.getValue('time_out') as string | null;
            return (
                <div className={timeOut ? 'text-foreground' : 'text-muted-foreground'}>
                    {timeOut ? new Date(`2000-01-01T${timeOut}`).toLocaleTimeString('en-US', { 
                        hour: '2-digit', 
                        minute: '2-digit',
                        hour12: true 
                    }) : '—'}
                </div>
            );
        },
    },
    {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => <StatusBadge status={row.getValue('status')} />,
        filterFn: (row, id, value) => {
            return value.includes(row.getValue(id));
        },
    },
    {
        id: 'actions',
        enableHiding: false,
        cell: ({ row }) => <ActionsCell record={row.original} />,
    },
];
