import { Button } from '@/components/ui/button';
import { DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useForm } from '@inertiajs/react';

interface Company {
    company_id: number;
    name: string;
}

interface CreateAccountDialogProps {
    company: Company;
    onOpenChange: (open: boolean) => void;
}

// Define a type for your form
type AccountForm = {
    name: string;
    active: boolean;
    company_id: number;
};

export function CreateAccountDialog({ company, onOpenChange }: CreateAccountDialogProps) {
    // Use the type definition
    const { post, processing, data, setData, reset } = useForm<AccountForm>({
        name: '',
        active: true,
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

                <div className="flex items-center space-x-2">
                    <Switch id="active-status" checked={data.active} onCheckedChange={(checked) => setData('active', checked)} />
                    <Label htmlFor="active-status">Active Account</Label>
                </div>
                <p className="text-sm text-muted-foreground">Toggle to set account as active or inactive</p>
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
