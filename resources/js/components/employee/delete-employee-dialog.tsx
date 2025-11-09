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
import { router } from '@inertiajs/react';

interface DeleteEmployeeDialogProps {
    employee: {
        id: number;
        name: string;
    };
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function DeleteEmployeeDialog({ employee, open, onOpenChange }: DeleteEmployeeDialogProps) {
    const handleDelete = () => {
        router.delete(route('employee.destroy', employee.id), {
            preserveScroll: true,
            onSuccess: () => {
                handleClose();
            },
            onError: () => {
                handleClose();
            },
        });
    };

    const handleClose = () => {
        onOpenChange(false);
        setTimeout(() => {
            document.body.style.pointerEvents = '';
        }, 500);
    };

    const handleCancel = () => {
        handleClose();
    };

    return (
        <AlertDialog open={open} onOpenChange={handleClose}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete <strong>{employee.name}</strong> and remove their data from our
                        servers.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={handleCancel}>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete} className="">
                        Delete Employee
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
