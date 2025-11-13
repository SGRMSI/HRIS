import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem, Company, Employee, PageProps } from '@/types';
import { Head, router, useForm } from '@inertiajs/react';
import { Users } from 'lucide-react';
import { FormEventHandler, useState } from 'react';

interface Props extends PageProps {
    companies: Company[];
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Payroll',
        href: '/payroll',
    },
    {
        title: 'Create Payroll Period',
        href: '/payroll/create',
    },
];

export default function Create({ companies = [] }: Props) {
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [selectedCompany, setSelectedCompany] = useState<string>('');
    const [selectedEmployees, setSelectedEmployees] = useState<number[]>([]);
    const [selectAll, setSelectAll] = useState(false);

    // Debug: Log companies to console
    console.log('Companies:', companies);

    const { data, setData, post, processing, errors } = useForm({
        period_name: '',
        date_from: '',
        date_to: '',
        payment_date: '',
        employee_ids: [] as number[],
        notes: '',
    });

    const handleCompanyChange = (companyId: string) => {
        setSelectedCompany(companyId);
        if (companyId) {
            // Fetch employees for the selected company
            console.log('Fetching employees for company:', companyId);
            console.log('Route:', route('api.employees.by-company', companyId));

            fetch(route('api.employees.by-company', companyId))
                .then((res) => {
                    console.log('Response status:', res.status);
                    if (!res.ok) {
                        throw new Error(`HTTP error! status: ${res.status}`);
                    }
                    return res.json();
                })
                .then((data) => {
                    console.log('Fetched employees:', data);
                    setEmployees(data);
                })
                .catch((error) => {
                    console.error('Error fetching employees:', error);
                    setEmployees([]);
                });
        } else {
            setEmployees([]);
        }
        setSelectedEmployees([]);
        setSelectAll(false);
    };

    const handleSelectAll = () => {
        if (selectAll) {
            setSelectedEmployees([]);
        } else {
            setSelectedEmployees(employees.map((e) => e.employee_id));
        }
        setSelectAll(!selectAll);
    };

    const handleSelectEmployee = (employeeId: number) => {
        setSelectedEmployees((prev) => (prev.includes(employeeId) ? prev.filter((id) => id !== employeeId) : [...prev, employeeId]));
    };

    const handleSubmit: FormEventHandler = (e) => {
        e.preventDefault();
        data.employee_ids = selectedEmployees;
        post(route('payroll.store'));
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Create Payroll" />

            <div className="py-6">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Period Information */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Period Information</CardTitle>
                                <CardDescription>Set up the basic details for this payroll period</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <Label htmlFor="period_name">Period Name *</Label>
                                    <Input
                                        id="period_name"
                                        type="text"
                                        placeholder="e.g., January 1-15, 2025"
                                        value={data.period_name}
                                        onChange={(e) => setData('period_name', e.target.value)}
                                        required
                                    />
                                    {errors.period_name && <p className="mt-1 text-sm text-red-600">{errors.period_name}</p>}
                                </div>

                                <div className="grid gap-4 md:grid-cols-3">
                                    <div>
                                        <Label htmlFor="date_from">Date From *</Label>
                                        <Input
                                            id="date_from"
                                            type="date"
                                            value={data.date_from}
                                            onChange={(e) => setData('date_from', e.target.value)}
                                            required
                                        />
                                        {errors.date_from && <p className="mt-1 text-sm text-red-600">{errors.date_from}</p>}
                                    </div>

                                    <div>
                                        <Label htmlFor="date_to">Date To *</Label>
                                        <Input
                                            id="date_to"
                                            type="date"
                                            value={data.date_to}
                                            onChange={(e) => setData('date_to', e.target.value)}
                                            required
                                        />
                                        {errors.date_to && <p className="mt-1 text-sm text-red-600">{errors.date_to}</p>}
                                    </div>

                                    <div>
                                        <Label htmlFor="payment_date">Payment Date</Label>
                                        <Input
                                            id="payment_date"
                                            type="date"
                                            value={data.payment_date}
                                            onChange={(e) => setData('payment_date', e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <Label htmlFor="notes">Notes</Label>
                                    <Textarea
                                        id="notes"
                                        placeholder="Optional notes about this payroll period..."
                                        value={data.notes}
                                        onChange={(e) => setData('notes', e.target.value)}
                                        rows={3}
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        {/* Employee Selection */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Select Employees</CardTitle>
                                <CardDescription>Choose which employees to include in this payroll period</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {companies && companies.length === 0 && (
                                    <div className="mb-4 rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800 dark:border-yellow-900 dark:bg-yellow-900/20 dark:text-yellow-300">
                                        <p className="font-medium">No active companies found</p>
                                        <p className="mt-1">Please create an active company first before creating a payroll period.</p>
                                    </div>
                                )}

                                <div className="w-full md:w-64">
                                    <Label htmlFor="company">Filter by Company</Label>
                                    <Select value={selectedCompany || undefined} onValueChange={handleCompanyChange}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select a company" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {companies && companies.length > 0 ? (
                                                companies.map((company) => (
                                                    <SelectItem key={company.company_id} value={company.company_id.toString()}>
                                                        {company.name}
                                                    </SelectItem>
                                                ))
                                            ) : (
                                                <div className="px-2 py-1.5 text-sm text-gray-500">No companies found</div>
                                            )}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {errors.employee_ids && <p className="text-sm text-red-600">{errors.employee_ids}</p>}

                                {employees.length > 0 && (
                                    <>
                                        <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 dark:border-gray-700 dark:bg-gray-800">
                                            <div className="flex items-center gap-2">
                                                <Checkbox id="select-all" checked={selectAll} onCheckedChange={handleSelectAll} />
                                                <Label htmlFor="select-all" className="cursor-pointer font-medium">
                                                    Select All ({employees.length} employees)
                                                </Label>
                                            </div>
                                            <div className="text-sm text-gray-600 dark:text-gray-400">{selectedEmployees.length} selected</div>
                                        </div>

                                        <div className="max-h-96 overflow-y-auto rounded-lg border border-gray-200 dark:border-gray-700">
                                            <Table>
                                                <TableHeader className="sticky top-0 bg-white dark:bg-gray-900">
                                                    <TableRow>
                                                        <TableHead className="w-12"></TableHead>
                                                        <TableHead>ID Number</TableHead>
                                                        <TableHead>Name</TableHead>
                                                        <TableHead>Department</TableHead>
                                                        <TableHead>Position</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {employees.map((employee) => (
                                                        <TableRow key={employee.employee_id}>
                                                            <TableCell>
                                                                <Checkbox
                                                                    checked={selectedEmployees.includes(employee.employee_id)}
                                                                    onCheckedChange={() => handleSelectEmployee(employee.employee_id)}
                                                                />
                                                            </TableCell>
                                                            <TableCell className="font-mono text-sm">{employee.id_number}</TableCell>
                                                            <TableCell className="font-medium">{employee.full_name}</TableCell>
                                                            <TableCell>{employee.department?.name}</TableCell>
                                                            <TableCell>{employee.position?.title}</TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </div>
                                    </>
                                )}

                                {selectedCompany && employees.length === 0 && (
                                    <div className="rounded-lg border border-dashed border-gray-300 py-12 text-center text-gray-500 dark:border-gray-700 dark:text-gray-400">
                                        <Users className="mx-auto mb-3 h-12 w-12 opacity-50" />
                                        <p>No employees found for this company.</p>
                                    </div>
                                )}

                                {!selectedCompany && (
                                    <div className="rounded-lg border border-dashed border-gray-300 py-12 text-center text-gray-500 dark:border-gray-700 dark:text-gray-400">
                                        <Users className="mx-auto mb-3 h-12 w-12 opacity-50" />
                                        <p>Select a company to view employees.</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Submit Actions */}
                        <div className="flex items-center justify-end gap-4">
                            <Button type="button" variant="outline" onClick={() => router.visit(route('payroll.index'))}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={processing || selectedEmployees.length === 0}>
                                {processing ? 'Creating...' : 'Create Payroll Period'}
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </AppLayout>
    );
}
