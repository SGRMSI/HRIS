import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { Head, Link, useForm, router } from '@inertiajs/react';
import { ArrowLeft, FileUp, ExternalLink, Trash } from 'lucide-react';
import { useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { UploadDocumentDialog } from '@/components/employee/upload-document-dialog';

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

interface Employee {
    employee_id: number;
    id_number: string;
    first_name: string;
    middle_name?: string;
    last_name: string;
    full_name: string;
    company: string;
    department: string;
    position: string;
    employment_status: 'Probationary' | 'Regular' | 'Contractual' | 'Resigned' | 'Terminated';
    date_hired: string;
    contact_number?: string;
    address?: string;
    date_of_birth?: string;
    gender?: string;
    civil_status?: string;
    age?: number;
    date_regularized?: string;
    date_separated?: string;
    sss_number?: string;
    phic_number?: string;
    hdmf_number?: string;
    tin_number?: string;
    company_id?: number;
    department_id?: number;
    position_id?: number;
    account_id?: number;
    remarks?: string;
}

interface EmployeeDocument {
    document_id: number;
    file_name: string;
    category: 'Government_Documents' | 'Company_Documents' | 'Infractions' | 'Other';
    uploaded_by: string;
    uploaded_at: string;
    remarks?: string;
    file_path: string;
}

interface Props {
    employee: Employee;
    companies: Company[];
    departments: Department[];
    positions: Position[];
    accounts: Account[];
    documents: EmployeeDocument[];
}

export default function EditEmployee({ employee, companies, departments, positions, accounts, documents }: Props) {
    const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Employee',
            href: '/employee',
        },
        {
            title: employee.full_name,
            href: `/employee/${employee.employee_id}`,
        },
        {
            title: 'Edit',
            href: `/employee/${employee.employee_id}/edit`,
        },
    ];

    const { data, setData, put, processing, errors } = useForm({
        id_number: employee.id_number || '',
        first_name: employee.first_name || '',
        last_name: employee.last_name || '',
        middle_name: employee.middle_name || '',
        gender: employee.gender || '',
        birth_date: employee.date_of_birth || '',
        civil_status: employee.civil_status || '',
        address: employee.address || '',
        contact_number: employee.contact_number || '',
        company_id: employee.company_id?.toString() || '',
        department_id: employee.department_id?.toString() || '',
        position_id: employee.position_id?.toString() || '',
        account_id: employee.account_id?.toString() || '',
        sss_number: employee.sss_number || '',
        phic_number: employee.phic_number || '',
        hdmf_number: employee.hdmf_number || '',
        tin_number: employee.tin_number || '',
        date_hired: employee.date_hired || '',
        date_regularized: employee.date_regularized || '',
        employment_status: employee.employment_status || '',
        remarks: employee.remarks || '',
    });

    const [selectedCompany, setSelectedCompany] = useState<number | null>(employee.company_id || null);

    const filteredDepartments = departments.filter((dept) => dept.company_id === selectedCompany);
    const filteredPositions = positions.filter((pos) => pos.company_id === selectedCompany);
    const filteredAccounts = accounts.filter((acc) => acc.company_id === selectedCompany);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        console.log('Form submission started');
        console.log('Form data:', JSON.stringify(data, null, 2));
        
        put(`/employee/${employee.employee_id}`, {
            onSuccess: () => {
                console.log('Employee updated successfully');
                router.visit(`/employee/${employee.employee_id}`);
            },
            onError: (errors) => {
                console.error('Update failed:', errors);
            }
        });
    };

    const handleDiscard = () => {
        router.visit(`/employee/${employee.employee_id}`);
    };

    const handleCompanyChange = (value: string) => {
        const companyId = parseInt(value);
        setSelectedCompany(companyId);
        setData({
            ...data,
            company_id: value,
            department_id: '',
            position_id: '',
            account_id: '',
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Edit Employee - ${employee.full_name}`} />

            <div className="flex h-full flex-1 flex-col gap-6 p-6">
                {/* Header */}
                <div className="mb-6 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href={`/employee/${employee.employee_id}`}>
                            <Button variant="ghost" size="sm" className="flex items-center gap-2 text-gray-600 hover:text-gray-800">
                                <ArrowLeft className="h-4 w-4" />
                                Back to Employee
                            </Button>
                        </Link>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" onClick={handleDiscard} disabled={processing}>
                            Discard
                        </Button>
                        <Button 
                            onClick={handleSubmit} 
                            disabled={processing}
                        >
                            {processing ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </div>
                </div>

                <Tabs defaultValue="details" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="details">Employee Details</TabsTrigger>
                        <TabsTrigger value="documents">Documents</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="details">
                        <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Personal Information */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Personal Information</CardTitle>
                            <CardDescription>
                                Update the employee's personal details below.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                                <div className="space-y-2">
                                    <Label htmlFor="id_number">Employee ID *</Label>
                                    <Input
                                        id="id_number"
                                        type="text"
                                        value={data.id_number}
                                        onChange={(e) => setData('id_number', e.target.value)}
                                        placeholder="Enter employee ID"
                                        className={errors.id_number ? 'border-red-500' : ''}
                                    />
                                    {errors.id_number && <p className="text-sm text-red-500">{errors.id_number}</p>}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="first_name">First Name *</Label>
                                    <Input
                                        id="first_name"
                                        type="text"
                                        value={data.first_name}
                                        onChange={(e) => setData('first_name', e.target.value)}
                                        placeholder="Enter first name"
                                        className={errors.first_name ? 'border-red-500' : ''}
                                    />
                                    {errors.first_name && <p className="text-sm text-red-500">{errors.first_name}</p>}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="last_name">Last Name *</Label>
                                    <Input
                                        id="last_name"
                                        type="text"
                                        value={data.last_name}
                                        onChange={(e) => setData('last_name', e.target.value)}
                                        placeholder="Enter last name"
                                        className={errors.last_name ? 'border-red-500' : ''}
                                    />
                                    {errors.last_name && <p className="text-sm text-red-500">{errors.last_name}</p>}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                                <div className="space-y-2">
                                    <Label htmlFor="middle_name">Middle Name</Label>
                                    <Input
                                        id="middle_name"
                                        type="text"
                                        value={data.middle_name}
                                        onChange={(e) => setData('middle_name', e.target.value)}
                                        placeholder="Enter middle name"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="gender">Gender *</Label>
                                    <Select value={data.gender} onValueChange={(value) => setData('gender', value)}>
                                        <SelectTrigger className={errors.gender ? 'border-red-500' : ''}>
                                            <SelectValue placeholder="Select gender" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Male">Male</SelectItem>
                                            <SelectItem value="Female">Female</SelectItem>
                                            <SelectItem value="Other">Other</SelectItem>
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
                                    />
                                    {errors.birth_date && <p className="text-sm text-red-500">{errors.birth_date}</p>}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="civil_status">Civil Status *</Label>
                                    <Select value={data.civil_status} onValueChange={(value) => setData('civil_status', value)}>
                                        <SelectTrigger className={errors.civil_status ? 'border-red-500' : ''}>
                                            <SelectValue placeholder="Select civil status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Single">Single</SelectItem>
                                            <SelectItem value="Married">Married</SelectItem>
                                            <SelectItem value="Separated">Separated</SelectItem>
                                            <SelectItem value="Widowed">Widowed</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    {errors.civil_status && <p className="text-sm text-red-500">{errors.civil_status}</p>}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="contact_number">Contact Number *</Label>
                                    <Input
                                        id="contact_number"
                                        type="tel"
                                        value={data.contact_number}
                                        onChange={(e) => setData('contact_number', e.target.value)}
                                        placeholder="Enter contact number"
                                        className={errors.contact_number ? 'border-red-500' : ''}
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
                                    placeholder="Enter complete address"
                                    rows={3}
                                    className={errors.address ? 'border-red-500' : ''}
                                />
                                {errors.address && <p className="text-sm text-red-500">{errors.address}</p>}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Employment Information */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Employment Information</CardTitle>
                            <CardDescription>
                                Update the employee's work-related information.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="company_id">Company *</Label>
                                    <Select value={data.company_id} onValueChange={handleCompanyChange}>
                                        <SelectTrigger className={errors.company_id ? 'border-red-500' : ''}>
                                            <SelectValue placeholder="Select company" />
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
                                    <Label htmlFor="department_id">Department *</Label>
                                    <Select
                                        value={data.department_id}
                                        onValueChange={(value) => setData('department_id', value)}
                                        disabled={!selectedCompany}
                                    >
                                        <SelectTrigger className={errors.department_id ? 'border-red-500' : ''}>
                                            <SelectValue placeholder="Select department" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {filteredDepartments.map((department) => (
                                                <SelectItem key={department.department_id} value={department.department_id.toString()}>
                                                    {department.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {errors.department_id && <p className="text-sm text-red-500">{errors.department_id}</p>}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="position_id">Position *</Label>
                                    <Select
                                        value={data.position_id}
                                        onValueChange={(value) => setData('position_id', value)}
                                        disabled={!selectedCompany}
                                    >
                                        <SelectTrigger className={errors.position_id ? 'border-red-500' : ''}>
                                            <SelectValue placeholder="Select position" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {filteredPositions.map((position) => (
                                                <SelectItem key={position.position_id} value={position.position_id.toString()}>
                                                    {position.title}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {errors.position_id && <p className="text-sm text-red-500">{errors.position_id}</p>}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="account_id">Account</Label>
                                    <Select
                                        value={data.account_id}
                                        onValueChange={(value) => setData('account_id', value)}
                                        disabled={!selectedCompany}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select account (optional)" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {filteredAccounts.map((account) => (
                                                <SelectItem key={account.account_id} value={account.account_id.toString()}>
                                                    {account.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                                <div className="space-y-2">
                                    <Label htmlFor="employment_status">Employment Status *</Label>
                                    <Select value={data.employment_status} onValueChange={(value) => setData('employment_status', value as 'Probationary' | 'Regular' | 'Contractual' | 'Resigned' | 'Terminated')}>
                                        <SelectTrigger className={errors.employment_status ? 'border-red-500' : ''}>
                                            <SelectValue placeholder="Select status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Probationary">Probationary</SelectItem>
                                            <SelectItem value="Regular">Regular</SelectItem>
                                            <SelectItem value="Contractual">Contractual</SelectItem>
                                            <SelectItem value="Resigned">Resigned</SelectItem>
                                            <SelectItem value="Terminated">Terminated</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    {errors.employment_status && <p className="text-sm text-red-500">{errors.employment_status}</p>}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="date_hired">Date Hired *</Label>
                                    <Input
                                        id="date_hired"
                                        type="date"
                                        value={data.date_hired}
                                        onChange={(e) => setData('date_hired', e.target.value)}
                                        className={errors.date_hired ? 'border-red-500' : ''}
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
                        </CardContent>
                    </Card>

                    {/* Government Information */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Government Information</CardTitle>
                            <CardDescription>
                                Update government-related identification numbers.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="sss_number">SSS Number</Label>
                                    <Input
                                        id="sss_number"
                                        type="text"
                                        value={data.sss_number}
                                        onChange={(e) => setData('sss_number', e.target.value)}
                                        placeholder="Enter SSS number"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="phic_number">PhilHealth Number</Label>
                                    <Input
                                        id="phic_number"
                                        type="text"
                                        value={data.phic_number}
                                        onChange={(e) => setData('phic_number', e.target.value)}
                                        placeholder="Enter PhilHealth number"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="hdmf_number">Pag-IBIG Number</Label>
                                    <Input
                                        id="hdmf_number"
                                        type="text"
                                        value={data.hdmf_number}
                                        onChange={(e) => setData('hdmf_number', e.target.value)}
                                        placeholder="Enter Pag-IBIG number"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="tin_number">TIN Number</Label>
                                    <Input
                                        id="tin_number"
                                        type="text"
                                        value={data.tin_number}
                                        onChange={(e) => setData('tin_number', e.target.value)}
                                        placeholder="Enter TIN number"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="remarks">Remarks</Label>
                                <Textarea
                                    id="remarks"
                                    value={data.remarks}
                                    onChange={(e) => setData('remarks', e.target.value)}
                                    placeholder="Enter any additional remarks"
                                    rows={3}
                                />
                            </div>
                        </CardContent>
                    </Card>
                </form>
                    </TabsContent>
                    
                    <TabsContent value="documents">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <div>
                                    <CardTitle>Employee Documents</CardTitle>
                                    <CardDescription>Manage employee documents and files</CardDescription>
                                </div>
                                <Button 
                                    onClick={() => setUploadDialogOpen(true)}
                                    className="flex items-center gap-2"
                                >
                                    <FileUp className="h-4 w-4" />
                                    Upload Document
                                </Button>
                            </CardHeader>
                            <CardContent>
                                <div className="overflow-x-auto">
                                    <table className="min-w-full">
                                        <thead>
                                            <tr className="border-b dark:border-slate-700">
                                                <th className="py-3 px-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                                    <input type="checkbox" className="rounded border-gray-300 text-primary focus:ring-primary" />
                                                </th>
                                                <th className="py-3 px-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                                    Category
                                                </th>
                                                <th className="py-3 px-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                                    Filename
                                                </th>
                                                <th className="py-3 px-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                                    Uploaded by
                                                </th>
                                                <th className="py-3 px-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                                    Actions
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {documents.length === 0 ? (
                                                <tr>
                                                    <td colSpan={5} className="text-center py-4 text-muted-foreground">
                                                        No documents found
                                                    </td>
                                                </tr>
                                            ) : (
                                                documents.map((doc) => (
                                                    <tr key={doc.document_id} className="border-b dark:border-slate-700">
                                                        <td className="py-3 px-4 whitespace-nowrap">
                                                            <input type="checkbox" className="rounded border-gray-300 text-primary focus:ring-primary" />
                                                        </td>
                                                        <td className="py-3 px-4 whitespace-nowrap">
                                                            {doc.category.replace('_', ' ')}
                                                        </td>
                                                        <td className="py-3 px-4 whitespace-nowrap">
                                                            {doc.file_name}
                                                        </td>
                                                        <td className="py-3 px-4 whitespace-nowrap">
                                                            {doc.uploaded_by}
                                                        </td>
                                                        <td className="py-3 px-4 whitespace-nowrap">
                                                            <div className="flex space-x-2">
                                                                <a 
                                                                    href={`/employee/documents/${doc.document_id}/download`} 
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                >
                                                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title="Download">
                                                                        <ExternalLink className="h-4 w-4" />
                                                                    </Button>
                                                                </a>
                                                                <form action={`/employee/documents/${doc.document_id}`} method="POST">
                                                                    <input type="hidden" name="_method" value="DELETE" />
                                                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-500 hover:text-red-700" title="Delete">
                                                                        <Trash className="h-4 w-4" />
                                                                    </Button>
                                                                </form>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
            
            {/* Upload Document Dialog */}
            <UploadDocumentDialog
                employeeId={employee.employee_id}
                open={uploadDialogOpen}
                onOpenChange={setUploadDialogOpen}
                initialCategory="Government_Documents"
            />
        </AppLayout>
    );
}
