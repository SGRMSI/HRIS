import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { router, useForm } from '@inertiajs/react';
import debounce from 'lodash/debounce';
import { Plus, Trash2 } from 'lucide-react';
import { useCallback, useRef, useState } from 'react';
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

interface AccountTableProps {
    company: Company;
    accounts: Account[];
    isCallCenter?: boolean;
}

export default function AccountTable({ company, accounts, isCallCenter = false }: AccountTableProps) {
    const [accountToDelete, setAccountToDelete] = useState<Account | null>(null);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

    // Track accounts with pending status changes
    const pendingStatusChanges = useRef<Record<number, boolean>>({});

    // For delete functionality
    const { delete: destroyAccount, processing: deleteProcessing } = useForm();

    // Create a debounced function for toggling status
    const debouncedToggle = useCallback(
        debounce((accountId: number, newStatus: boolean) => {
            // Use router directly instead of useForm for this one-off operation
            router.put(
                `/company/${company.company_id}/account/${accountId}/toggle-status`,
                { active: newStatus },
                {
                    onSuccess: () => {
                        // Clear the pending status after success
                        const newPending = { ...pendingStatusChanges.current };
                        delete newPending[accountId];
                        pendingStatusChanges.current = newPending;
                    },
                    onError: () => {
                        // Clear the pending status after error
                        const newPending = { ...pendingStatusChanges.current };
                        delete newPending[accountId];
                        pendingStatusChanges.current = newPending;
                    },
                },
            );
        }, 300),
        [company.company_id],
    );

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
        // Don't allow toggling if there's a pending change for this account
        if (pendingStatusChanges.current[account.account_id] !== undefined) {
            return;
        }

        // Track this pending status change
        pendingStatusChanges.current = {
            ...pendingStatusChanges.current,
            [account.account_id]: checked,
        };

        // Call the debounced function
        debouncedToggle(account.account_id, checked);
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
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Accounts</CardTitle>
                    <CardDescription>
                        {isCallCenter ? 'Client accounts' : 'Business accounts'} for {company.name}
                    </CardDescription>
                </div>
                <Button size="sm" onClick={() => setIsAddDialogOpen(true)}>
                    <Plus className="h-4 w-4" />
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
                                            <Switch
                                                checked={
                                                    pendingStatusChanges.current[account.account_id] !== undefined
                                                        ? pendingStatusChanges.current[account.account_id]
                                                        : account.active
                                                }
                                                onCheckedChange={(checked) => handleStatusToggle(account, checked)}
                                                disabled={deleteProcessing || pendingStatusChanges.current[account.account_id] !== undefined}
                                            />
                                            {pendingStatusChanges.current[account.account_id] !== undefined ? (
                                                pendingStatusChanges.current[account.account_id] ? (
                                                    <Badge>Active</Badge>
                                                ) : (
                                                    <Badge variant="secondary">Inactive</Badge>
                                                )
                                            ) : account.active ? (
                                                <Badge>Active</Badge>
                                            ) : (
                                                <Badge variant="secondary">Inactive</Badge>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="text-primary"
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
                        <Button variant="default" onClick={handleDelete} disabled={deleteProcessing}>
                            {deleteProcessing ? 'Deleting...' : 'Delete Account'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </Card>
    );
}
