import { Button } from '@/components/ui/button';
import { DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useForm } from '@inertiajs/react';

interface Company {
    company_id: number;
    name: string;
}

interface CreateDepartmentDialogProps {
    company: Company;
    onOpenChange: (open: boolean) => void;
}

export function CreateDepartmentDialog({ company, onOpenChange }: CreateDepartmentDialogProps) {
    const { post, processing, data, setData, reset } = useForm({
        name: '',
        company_id: company.company_id,
    });

    const handleSubmit = () => {
        post(`/company/${company.company_id}/department`, {
            onSuccess: () => {
                onOpenChange(false);
                reset();
            },
        });
    };

    return (
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Add New Department</DialogTitle>
                <DialogDescription>Create a new department for {company.name}.</DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
                <div className="space-y-2">
                    <Label htmlFor="name">Department Name</Label>
                    <Input id="name" value={data.name} onChange={(e) => setData('name', e.target.value)} placeholder="Enter department name" />
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
                <Button onClick={handleSubmit} disabled={processing || !data.name}>
                    {processing ? 'Creating...' : 'Create Department'}
                </Button>
            </DialogFooter>
        </DialogContent>
    );
}
