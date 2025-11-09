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
import { toast } from 'sonner';

interface DeleteEmployeeDialogProps {
    employee: {
        id: number;
        name: string;
    };
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

interface FlashMessages {
    success?: string;
    error?: string;
}

interface PageProps {
    flash?: FlashMessages;
    errors?: Record<string, string>;
}

export function DeleteEmployeeDialog({ employee, open, onOpenChange }: DeleteEmployeeDialogProps) {
    const handleDelete = () => {
        router.delete(route('employee.destroy', employee.id), {
            preserveScroll: true,
            onSuccess: (page) => {
                const props = page.props as PageProps;

                // Check for error in flash messages (validation errors that didn't throw)
                if (props.flash?.error) {
                    toast.error(props.flash.error, {
                        duration: 5000,
                    });
                } else if (props.flash?.success) {
                    toast.success(props.flash.success);
                }

                handleClose();
            },
            onError: (errors) => {
                // Handle validation errors
                const errorMessage = errors.message || errors.error || Object.values(errors)[0] || 'Failed to delete employee';

                toast.error(errorMessage, {
                    duration: 5000,
                });

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
