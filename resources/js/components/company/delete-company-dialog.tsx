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

interface DeleteCompanyDialogProps {
    company: {
        company_id: number;
        name: string;
    };
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function DeleteCompanyDialog({ company, open, onOpenChange }: DeleteCompanyDialogProps) {
    const handleDelete = () => {
        router.delete(`/company/${company.company_id}`, {
            onSuccess: () => {
                console.log('Company deleted successfully');
                handleClose();
            },
            onError: (errors) => {
                console.error('Failed to delete company:', errors);
                handleClose();
            },
        });
    };

    const handleClose = () => {
        onOpenChange(false);
        // Fix pointer events after dialog closes
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
                        This action cannot be undone. This will permanently delete <strong>{company.name}</strong>
                        and all associated departments, positions, and accounts from our servers.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={handleCancel}>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
                        Delete Company
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
