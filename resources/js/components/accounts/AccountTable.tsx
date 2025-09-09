import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Link } from '@inertiajs/react';
import { Plus } from 'lucide-react';

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

    // More flexible check that handles different data types
    const hasAccount =
        company.has_account === true ||
        company.has_account === 1 ||
        company.has_account === '1' ||
        String(company.has_account).toLowerCase() === 'true';

    if (!hasAccount) {
        console.log('Not showing account table for', company.name);
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
                <Button size="sm" asChild>
                    <Link href={`/company/${company.company_id}/account/create`}>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Account
                    </Link>
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
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {accounts.map((account) => (
                                <TableRow key={account.account_id}>
                                    <TableCell className="font-medium">{account.name}</TableCell>
                                    <TableCell>{account.active ? <Badge>Active</Badge> : <Badge variant="destructive">Inactive</Badge>}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </CardContent>
        </Card>
    );
}
