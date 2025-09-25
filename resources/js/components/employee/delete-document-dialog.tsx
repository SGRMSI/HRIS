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

interface DeleteDocumentDialogProps {
    document: {
        document_id: number;
        file_name: string;
    };
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function DeleteDocumentDialog({ document, open, onOpenChange }: DeleteDocumentDialogProps) {
    const handleDelete = () => {
        router.delete(`/employee/documents/${document.document_id}`, {
            onSuccess: () => {
                console.log('Document deleted successfully');
                handleClose();
            },
            onError: (errors) => {
                console.error('Failed to delete document:', errors);
                handleClose();
            },
        });
    };

    const handleClose = () => {
        onOpenChange(false);
        // Fix pointer events after dialog closes
        setTimeout(() => {
            // Using window.document instead of document to avoid confusion with the prop
            window.document.body.style.pointerEvents = "";
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
                        This action cannot be undone. This will permanently delete <br /> 
                        <strong>{document.file_name}</strong> <span></span>
                        and remove the document from our servers.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={handleCancel}>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete} className="bg-primary text-primary-foreground shadow-xs hover:bg-primary/90">
                        Delete Document
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
