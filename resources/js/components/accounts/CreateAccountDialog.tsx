import { Button } from '@/components/ui/button';
import { DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useForm } from '@inertiajs/react';

interface Company {
    company_id: number;
    name: string;
}

interface CreateAccountDialogProps {
    company: Company;
    onOpenChange: (open: boolean) => void;
}

export function CreateAccountDialog({ company, onOpenChange }: CreateAccountDialogProps) {
    const { post, processing, data, setData, reset } = useForm({
        name: '',
        company_id: company.company_id,
    });

    const handleSubmit = () => {
        post(`/company/${company.company_id}/account`, {
            onSuccess: () => {
                onOpenChange(false);
                reset();
            },
        });
    };

    return (
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Add New Account</DialogTitle>
                <DialogDescription>Create a new account for {company.name}.</DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
                <div className="space-y-2">
                    <Label htmlFor="name">Account Name</Label>
                    <Input id="name" value={data.name} onChange={(e) => setData('name', e.target.value)} placeholder="Enter account name" />
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
                    {processing ? 'Creating...' : 'Create Account'}
                </Button>
            </DialogFooter>
        </DialogContent>
    );
}
