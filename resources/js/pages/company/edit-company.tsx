import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
        title: 'Edit Company',
        href: '#',
    },
];

interface Company {
    company_id: number;
    name: string;
    industry: string;
    has_account: boolean;
}

interface Props {
    company: Company;
}

export default function EditCompany({ company }: Props) {
    const { data, setData, put, processing, errors } = useForm({
        name: company.name,
        industry: company.industry,
        has_account: company.has_account,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        put(`/company/${company.company_id}`);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Edit ${company.name}`} />
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
                        <CardTitle>Edit Company: {company.name}</CardTitle>
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
                                    required
                                    className={errors.name ? 'border-red-500' : ''}
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
                                    required
                                    className={errors.industry ? 'border-red-500' : ''}
                                />
                                {errors.industry && <p className="text-sm text-red-600">{errors.industry}</p>}
                            </div>

                            <div className="flex items-center space-x-2">
                                <Switch
                                    id="has_account"
                                    checked={data.has_account}
                                    onCheckedChange={() => setData('has_account', !data.has_account)}
                                />
                                <Label htmlFor="has_account">Has Client Accounts</Label>
                                {errors.has_account && <p className="text-sm text-red-600">{errors.has_account}</p>}
                            </div>
                            <p className="text-sm text-muted-foreground">Enable this for call centers or companies that manage client accounts</p>

                            <div className="flex gap-2">
                                <Button type="submit" disabled={processing}>
                                    {processing ? 'Updating...' : 'Update Company'}
                                </Button>
                                <Button type="button" variant="outline" asChild>
                                    <Link href="/company">Cancel</Link>
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
