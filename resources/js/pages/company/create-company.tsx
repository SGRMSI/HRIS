import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Company Management',
        href: '/company',
    },
    {
        title: 'Create Company',
        href: '/company/create',
    },
];

type CompanyForm = {
  name: string;
  industry: string;
  has_account: boolean;
};


export default function CreateCompany() {
    const { data, setData, post, processing, errors } = useForm<CompanyForm>({
        name: '',
        industry: '',
        has_account: false, 
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/company');
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Create Company" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" asChild>
                            <Link href="/company">
                                <ArrowLeft className="h-4 w-4" />
                                Back to Companies
                            </Link>
                        </Button>
                    </div>
                </div>

                <Card className="max-w-2xl">
                    <CardHeader>
                        <CardTitle>Add Company</CardTitle>
                        <CardDescription>Complete the form to add a new company. Click Create when you're done.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="name">Company Name</Label>
                                <Input
                                    id="name"
                                    type="text"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    placeholder="Enter company name"
                                    required
                                />
                                {errors.name && <p className="text-sm text-red-600">{errors.name}</p>}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="industry">Industry</Label>
                                <Input
                                    id="industry"
                                    type="text"
                                    value={data.industry}
                                    onChange={(e) => setData('industry', e.target.value)}
                                    placeholder="e.g., Technology, Healthcare, Finance"
                                    required
                                />
                                {errors.industry && <p className="text-sm text-red-600">{errors.industry}</p>}
                            </div>
                            
                            {/* Add toggle for has_account */}
                            <div className="flex items-center space-x-2">
                                <Switch
                                    id="has-account"
                                    checked={data.has_account}
                                    onCheckedChange={(checked) => setData('has_account', checked)}
                                />
                                <Label htmlFor="has-account">Has Accounts</Label>
                                {errors.has_account && <p className="text-sm text-red-600">{errors.has_account}</p>}
                            </div>
                            <p className="text-sm text-muted-foreground">
                                Enable this for call centers or companies that manage client accounts
                            </p>

                            <div className="flex justify-end gap-2">
                                <Button type="button" variant="outline" asChild>
                                    <Link href="/company">Cancel</Link>
                                </Button>
                                <Button type="submit" disabled={processing}>
                                    {processing ? 'Creating...' : 'Create Company'}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
