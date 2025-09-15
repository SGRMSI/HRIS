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
        router.delete(`/employee/${employee.id}`, {
            onSuccess: () => {
                console.log('Employee deleted successfully');
                handleClose();
            },
            onError: (errors) => {
                console.error('Failed to delete employee:', errors);
                handleClose();
            },
        });
    };

    const handleClose = () => {
        onOpenChange(false);
        // Fix pointer events after dialog closes
        setTimeout(() => {
            document.body.style.pointerEvents = "";
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
                        This action cannot be undone. This will permanently delete <br /> <strong>{employee.name}</strong> <span></span>  
                        and remove their data from our servers.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={handleCancel}>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete} className="bg-primary text-primary-foreground shadow-xs hover:bg-primary/90">
                        Delete Employee
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}