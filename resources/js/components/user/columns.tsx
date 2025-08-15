import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react';

export type User = {
    id: number;
    name: string;
    email: string;
    role: string;
    is_active: boolean;
    created_at: string;
};

export const columns: ColumnDef<User>[] = [
    {
        accessorKey: 'name',
        header: 'Name',
    },
    {
        accessorKey: 'email',
        header: 'Email',
    },
    {
        accessorKey: 'role',
        header: 'Role',
        cell: ({ row }) => {
            const role = row.getValue('role') as string;
            return <Badge variant="secondary">{role}</Badge>;
        },
    },
    {
        accessorKey: 'is_active',
        header: 'Status',
        cell: ({ row }) => {
            const isActive = row.getValue('is_active') as boolean;
            return <Badge variant={isActive ? 'default' : 'destructive'}>{isActive ? 'Active' : 'Inactive'}</Badge>;
        },
    },
    {
        accessorKey: 'created_at',
        header: 'Created',
    },
    {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => {
            const user = row.original;

            const handleEdit = () => {
                console.log('Edit user:', user.id);
            };

            const handleDelete = () => {
                if (confirm(`Are you sure you want to delete ${user.name}?`)) {
                    console.log('Delete user:', user.id);
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
                        <DropdownMenuItem onClick={handleEdit}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={handleDelete} className="text-red-600">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            );
        },
    },
];
