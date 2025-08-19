import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import { useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Employee',
        href: '/employee',
    },
    {
        title: 'Create Employee',
        href: '/employee/create',
    },
];

interface Company {
    company_id: number;
    name: string;
}

interface Department {
    department_id: number;
    name: string;
    company_id: number;
}

interface Position {
    position_id: number;
    title: string;
    company_id: number;
}

interface Account {
    account_id: number;
    name: string;
    company_id: number;
}

interface Props {
    companies: Company[];
    departments: Department[];
    positions: Position[];
    accounts: Account[];
}

export default function CreateEmployee({ companies, departments, positions, accounts }: Props) {
    const { data, setData, post, processing, errors } = useForm({
        id_number: '',
        first_name: '',
        last_name: '',
        middle_name: '',
        gender: '',
        birth_date: '',
        civil_status: '',
        address: '',
        contact_number: '',
        company_id: '',
        department_id: '',
        position_id: '',
        account_id: '',
        sss_number: '',
        phic_number: '',
        hdmf_number: '',
        tin_number: '',
        date_hired: '',
        date_regularized: '',
        employment_status: '',
        remarks: '',
    });

    const [selectedCompany, setSelectedCompany] = useState<number | null>(null);

    const filteredDepartments = departments.filter((dept) => dept.company_id === selectedCompany);
    const filteredPositions = positions.filter((pos) => pos.company_id === selectedCompany);
    const filteredAccounts = accounts.filter((acc) => acc.company_id === selectedCompany);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        console.log('Form data being submitted:', data);
        post(route('employee.store'));
    };

    const handleCompanyChange = (value: string) => {
        setData('company_id', value);
        setSelectedCompany(Number(value));

        setData('department_id', '');
        setData('position_id', '');
        setData('account_id', '');
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Create Employee" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" asChild>
                            <Link href="/employee">
                                <ArrowLeft className="h-4 w-4" />
                                Back to Employees
                            </Link>
                        </Button>
                    </div>
                </div>

                <Card className="max-w-4xl">
                    <CardHeader>
                        <CardTitle>Add Employee</CardTitle>
                        <CardDescription>Complete the form to add a new employee. Click Create when you're done.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-8">
                            {/* Personal Information */}
                            <div className="space-y-4">
                                <h3 className="border-b pb-2 text-lg font-medium">Personal Information</h3>
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                                    <div className="space-y-2">
                                        <Label htmlFor="id_number">Employee ID *</Label>
                                        <Input
                                            id="id_number"
                                            value={data.id_number}
                                            onChange={(e) => setData('id_number', e.target.value)}
                                            placeholder="e.g., EMP001"
                                            className={errors.id_number ? 'border-red-500' : ''}
                                            required
                                        />
                                        {errors.id_number && <p className="text-sm text-red-500">{errors.id_number}</p>}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="first_name">First Name *</Label>
                                        <Input
                                            id="first_name"
                                            value={data.first_name}
                                            onChange={(e) => setData('first_name', e.target.value)}
                                            className={errors.first_name ? 'border-red-500' : ''}
                                            required
                                        />
                                        {errors.first_name && <p className="text-sm text-red-500">{errors.first_name}</p>}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="last_name">Last Name *</Label>
                                        <Input
                                            id="last_name"
                                            value={data.last_name}
                                            onChange={(e) => setData('last_name', e.target.value)}
                                            className={errors.last_name ? 'border-red-500' : ''}
                                            required
                                        />
                                        {errors.last_name && <p className="text-sm text-red-500">{errors.last_name}</p>}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                                    <div className="space-y-2">
                                        <Label htmlFor="middle_name">Middle Name</Label>
                                        <Input id="middle_name" value={data.middle_name} onChange={(e) => setData('middle_name', e.target.value)} />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="gender">Gender *</Label>
                                        <Select onValueChange={(value) => setData('gender', value)}>
                                            <SelectTrigger className={errors.gender ? 'border-red-500' : ''}>
                                                <SelectValue placeholder="Select Gender" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Male">Male</SelectItem>
                                                <SelectItem value="Female">Female</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        {errors.gender && <p className="text-sm text-red-500">{errors.gender}</p>}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="birth_date">Birth Date *</Label>
                                        <Input
                                            id="birth_date"
                                            type="date"
                                            value={data.birth_date}
                                            onChange={(e) => setData('birth_date', e.target.value)}
                                            className={errors.birth_date ? 'border-red-500' : ''}
                                            required
                                        />
                                        {errors.birth_date && <p className="text-sm text-red-500">{errors.birth_date}</p>}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="civil_status">Civil Status *</Label>
                                        <Select onValueChange={(value) => setData('civil_status', value)}>
                                            <SelectTrigger className={errors.civil_status ? 'border-red-500' : ''}>
                                                <SelectValue placeholder="Select Civil Status" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Single">Single</SelectItem>
                                                <SelectItem value="Married">Married</SelectItem>
                                                <SelectItem value="Divorced">Divorced</SelectItem>
                                                <SelectItem value="Widowed">Widowed</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        {errors.civil_status && <p className="text-sm text-red-500">{errors.civil_status}</p>}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="contact_number">Contact Number *</Label>
                                        <Input
                                            id="contact_number"
                                            value={data.contact_number}
                                            onChange={(e) => setData('contact_number', e.target.value)}
                                            placeholder="e.g., 09171234567"
                                            className={errors.contact_number ? 'border-red-500' : ''}
                                            required
                                        />
                                        {errors.contact_number && <p className="text-sm text-red-500">{errors.contact_number}</p>}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="address">Address *</Label>
                                    <Textarea
                                        id="address"
                                        value={data.address}
                                        onChange={(e) => setData('address', e.target.value)}
                                        className={errors.address ? 'border-red-500' : ''}
                                        required
                                    />
                                    {errors.address && <p className="text-sm text-red-500">{errors.address}</p>}
                                </div>
                            </div>

                            {/* Company Information */}
                            <div className="space-y-4">
                                <h3 className="border-b pb-2 text-lg font-medium">Company Information</h3>
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="company_id">Company *</Label>
                                        <Select onValueChange={handleCompanyChange}>
                                            <SelectTrigger className={errors.company_id ? 'border-red-500' : ''}>
                                                <SelectValue placeholder="Select Company" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {companies.map((company) => (
                                                    <SelectItem key={company.company_id} value={company.company_id.toString()}>
                                                        {company.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {errors.company_id && <p className="text-sm text-red-500">{errors.company_id}</p>}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="employment_status">Employment Status *</Label>
                                        <Select onValueChange={(value) => setData('employment_status', value)}>
                                            <SelectTrigger className={errors.employment_status ? 'border-red-500' : ''}>
                                                <SelectValue placeholder="Select Status" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Probationary">Probationary</SelectItem>
                                                <SelectItem value="Regular">Regular</SelectItem>
                                                <SelectItem value="Contractual">Contractual</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        {errors.employment_status && <p className="text-sm text-red-500">{errors.employment_status}</p>}
                                    </div>
                                </div>

                                {selectedCompany && (
                                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                                        <div className="space-y-2">
                                            <Label htmlFor="department_id">Department *</Label>
                                            <Select onValueChange={(value) => setData('department_id', value)}>
                                                <SelectTrigger className={errors.department_id ? 'border-red-500' : ''}>
                                                    <SelectValue placeholder="Select Department" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {filteredDepartments.map((dept) => (
                                                        <SelectItem key={dept.department_id} value={dept.department_id.toString()}>
                                                            {dept.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            {errors.department_id && <p className="text-sm text-red-500">{errors.department_id}</p>}
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="position_id">Position *</Label>
                                            <Select onValueChange={(value) => setData('position_id', value)}>
                                                <SelectTrigger className={errors.position_id ? 'border-red-500' : ''}>
                                                    <SelectValue placeholder="Select Position" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {filteredPositions.map((pos) => (
                                                        <SelectItem key={pos.position_id} value={pos.position_id.toString()}>
                                                            {pos.title}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            {errors.position_id && <p className="text-sm text-red-500">{errors.position_id}</p>}
                                        </div>

                                        {selectedCompany && companies.find((c) => c.company_id === selectedCompany)?.name === 'TechHub' && (
                                            <div className="space-y-2">
                                                <Label htmlFor="account_id">Account (Optional)</Label>
                                                <Select onValueChange={(value) => setData('account_id', value)}>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select Account" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {filteredAccounts.map((acc) => (
                                                            <SelectItem key={acc.account_id} value={acc.account_id.toString()}>
                                                                {acc.name}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Employment Details */}
                            <div className="space-y-4">
                                <h3 className="border-b pb-2 text-lg font-medium">Employment Details</h3>
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="date_hired">Date Hired *</Label>
                                        <Input
                                            id="date_hired"
                                            type="date"
                                            value={data.date_hired}
                                            onChange={(e) => setData('date_hired', e.target.value)}
                                            className={errors.date_hired ? 'border-red-500' : ''}
                                            required
                                        />
                                        {errors.date_hired && <p className="text-sm text-red-500">{errors.date_hired}</p>}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="date_regularized">Date Regularized</Label>
                                        <Input
                                            id="date_regularized"
                                            type="date"
                                            value={data.date_regularized}
                                            onChange={(e) => setData('date_regularized', e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Government IDs */}
                            <div className="space-y-4">
                                <h3 className="border-b pb-2 text-lg font-medium">Government IDs (Optional)</h3>
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="sss_number">SSS Number</Label>
                                        <Input
                                            id="sss_number"
                                            value={data.sss_number}
                                            onChange={(e) => setData('sss_number', e.target.value)}
                                            placeholder="e.g., 11-2222-3333"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="phic_number">PhilHealth Number</Label>
                                        <Input
                                            id="phic_number"
                                            value={data.phic_number}
                                            onChange={(e) => setData('phic_number', e.target.value)}
                                            placeholder="e.g., 12-345678901-2"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="hdmf_number">Pag-IBIG Number</Label>
                                        <Input
                                            id="hdmf_number"
                                            value={data.hdmf_number}
                                            onChange={(e) => setData('hdmf_number', e.target.value)}
                                            placeholder="e.g., 1234-5678-9012"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="tin_number">TIN Number</Label>
                                        <Input
                                            id="tin_number"
                                            value={data.tin_number}
                                            onChange={(e) => setData('tin_number', e.target.value)}
                                            placeholder="e.g., 123-456-789-000"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Remarks */}
                            <div className="space-y-2">
                                <Label htmlFor="remarks">Remarks</Label>
                                <Textarea
                                    id="remarks"
                                    value={data.remarks}
                                    onChange={(e) => setData('remarks', e.target.value)}
                                    placeholder="Any additional notes..."
                                />
                            </div>

                            <div className="flex justify-end gap-4">
                                <Button type="button" variant="outline" asChild>
                                    <Link href="/employee">Cancel</Link>
                                </Button>
                                <Button type="submit" disabled={processing}>
                                    {processing ? 'Creating...' : 'Create Employee'}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
