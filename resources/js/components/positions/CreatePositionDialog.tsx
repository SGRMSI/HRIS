import { Button } from '@/components/ui/button';
import { DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useForm } from '@inertiajs/react';

interface Company {
    company_id: number;
    name: string;
}

interface CreatePositionDialogProps {
    company: Company;
    onOpenChange: (open: boolean) => void;
}

export function CreatePositionDialog({ company, onOpenChange }: CreatePositionDialogProps) {
    const { post, processing, data, setData, reset } = useForm({
        title: '',
        company_id: company.company_id,
    });

    const handleSubmit = () => {
        post(`/company/${company.company_id}/position`, {
            onSuccess: () => {
                onOpenChange(false);
                reset();
            },
        });
    };

    return (
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Add New Position</DialogTitle>
                <DialogDescription>Create a new position for {company.name}.</DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
                <div className="space-y-2">
                    <Label htmlFor="title">Position Title</Label>
                    <Input id="title" value={data.title} onChange={(e) => setData('title', e.target.value)} placeholder="Enter position title" />
                </div>
            </div>

            <DialogFooter>
                <Button
                    variant="outline"
                    onClick={() => {
                        onOpenChange(false);
                        reset();
                    }}
                >
                    Cancel
                </Button>
                <Button onClick={handleSubmit} disabled={processing || !data.title}>
                    {processing ? 'Creating...' : 'Create Position'}
                </Button>
            </DialogFooter>
        </DialogContent>
    );
}
