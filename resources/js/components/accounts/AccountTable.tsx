import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useForm } from '@inertiajs/react';
import { Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { CreateAccountDialog } from './CreateAccountDialog';

interface Account {
    account_id: number;
    name: string;
    active: boolean;
    client_type?: string;
    start_date?: string;
    contract_value?: number;
}

interface Company {
    company_id: number;
    name: string;
    industry: string;
    has_account?: boolean | number | string;
}

// Define a type for your status toggle form
type StatusToggleForm = {
    active: boolean;
};

interface AccountTableProps {
    company: Company;
    accounts: Account[];
    isCallCenter?: boolean;
}

export default function AccountTable({ company, accounts, isCallCenter = false }: AccountTableProps) {
    const [accountToDelete, setAccountToDelete] = useState<Account | null>(null);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

    const { delete: destroyAccount, processing: deleteProcessing } = useForm();

    // Use the typed form for status toggling
    const { put, processing: updateProcessing, setData} = useForm<StatusToggleForm>();

    const handleDelete = () => {
        if (accountToDelete) {
            destroyAccount(`/company/${company.company_id}/account/${accountToDelete.account_id}`, {
                onSuccess: () => {
                    setIsDeleteDialogOpen(false);
                    setAccountToDelete(null);
                },
            });
        }
    };

    const handleStatusToggle = (account: Account, checked: boolean) => {
        // First set the data
        setData({ active: checked });

        // Then make the request
        put(`/company/${company.company_id}/account/${account.account_id}/toggle-status`);
    };

    // More flexible check that handles different data types
    const hasAccount =
        company.has_account === true ||
        company.has_account === 1 ||
        company.has_account === '1' ||
        String(company.has_account).toLowerCase() === 'true';

    if (!hasAccount) {
        return null;
    }

    return (
        <Card>
            {/* Card header remains the same */}
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Accounts</CardTitle>
                    <CardDescription>
                        {isCallCenter ? 'Client accounts' : 'Business accounts'} for {company.name}
                    </CardDescription>
                </div>
                <Button size="sm" onClick={() => setIsAddDialogOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Account
                </Button>
            </CardHeader>
            <CardContent>
                {accounts.length === 0 ? (
                    <div className="flex h-32 flex-col items-center justify-center rounded-md border border-dashed p-8 text-center">
                        <p className="text-sm text-muted-foreground">No accounts found</p>
                        <p className="mt-2 text-xs text-muted-foreground">Add a client account to track contracts and services</p>
                    </div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {accounts.map((account) => (
                                <TableRow key={account.account_id}>
                                    <TableCell className="font-medium">{account.name}</TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            {/* Updated Switch using the same pattern as CreateAccountDialog */}
                                            <Switch
                                                checked={account.active}
                                                onCheckedChange={(checked) => handleStatusToggle(account, checked)}
                                                disabled={updateProcessing}
                                            />
                                            {account.active ? <Badge>Active</Badge> : <Badge variant="destructive">Inactive</Badge>}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="text-destructive"
                                            onClick={() => {
                                                setAccountToDelete(account);
                                                setIsDeleteDialogOpen(true);
                                            }}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                            <span className="sr-only">Delete</span>
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </CardContent>

            {/* Dialogs remain the same */}
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <CreateAccountDialog company={company} onOpenChange={setIsAddDialogOpen} />
            </Dialog>

            <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Account</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete the account "{accountToDelete?.name}"? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={handleDelete} disabled={deleteProcessing}>
                            {deleteProcessing ? 'Deleting...' : 'Delete Account'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </Card>
    );
}
