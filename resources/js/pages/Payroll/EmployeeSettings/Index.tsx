import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem, Company, PageProps, PaginatedData } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { Edit, Search } from 'lucide-react';
import { useState } from 'react';

interface Employee {
    employee_id: number;
    id_number: string;
    full_name: string;
    company?: {
        company_id: number;
        name: string;
    };
    department?: {
        department_id: number;
        name: string;
    };
    position?: {
        position_id: number;
        title: string;
    };
    employment_status: string;
    daily_rate: number;
    clothing_allowance: number;
    rice_allowance: number;
    transportation_allowance: number;
    program_allowance: number;
    attendance_incentive: number;
    adjustments: number;
    sss_contribution: number;
    phic_contribution: number;
    hdmf_contribution: number;
}

interface Props extends PageProps {
    employees: PaginatedData<Employee>;
    companies: Company[];
    filters: {
        search?: string;
        company_id?: string;
    };
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Payroll',
        href: '/payroll',
    },
    {
        title: 'Employee Settings',
        href: '/payroll/employee-settings',
    },
];

export default function Index({ employees, companies, filters }: Props) {
    const [search, setSearch] = useState(filters.search || '');
    const [companyId, setCompanyId] = useState(filters.company_id || '');

    const handleFilter = () => {
        router.get(route('payroll.employee-settings.index'), { search, company_id: companyId }, { preserveState: true, preserveScroll: true });
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-PH', {
            style: 'currency',
            currency: 'PHP',
        }).format(amount || 0);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Employee Payroll Settings" />

            <div className="mb-6 flex items-center justify-between p-6">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Employee Payroll Settings</h2>
                    <p className="text-sm text-muted-foreground">Configure daily rates, allowances, and deductions for employees</p>
                </div>
            </div>

            <div className="px-6">
                {/* Filters */}
                <Card className="mb-6">
                    <CardContent className="pt-6">
                        <div className="flex flex-col gap-4 md:flex-row md:items-end">
                            <div className="flex-1">
                                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Search Employee</label>
                                <div className="relative">
                                    <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
                                    <Input
                                        type="text"
                                        placeholder="Search by name or ID..."
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleFilter()}
                                        className="pl-10"
                                    />
                                </div>
                            </div>
                            <div className="w-full md:w-64">
                                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Company</label>
                                <Select value={companyId || undefined} onValueChange={setCompanyId}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="All Companies" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {companies.map((company) => (
                                            <SelectItem key={company.company_id} value={company.company_id.toString()}>
                                                {company.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <Button onClick={handleFilter}>
                                <Search className="mr-2 h-4 w-4" />
                                Filter
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Employees Table */}
                <Card>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Employee ID</TableHead>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Company</TableHead>
                                        <TableHead>Position</TableHead>
                                        <TableHead className="text-right">Daily Rate</TableHead>
                                        <TableHead className="text-right">Total Allowances</TableHead>
                                        <TableHead className="text-right">Total Deductions</TableHead>
                                        <TableHead className="text-center">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {employees.data.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={8} className="py-8 text-center text-muted-foreground">
                                                No employees found
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        employees.data.map((employee) => {
                                            const totalAllowances =
                                                Number(employee.clothing_allowance || 0) +
                                                Number(employee.rice_allowance || 0) +
                                                Number(employee.transportation_allowance || 0) +
                                                Number(employee.program_allowance || 0) +
                                                Number(employee.attendance_incentive || 0);

                                            const totalDeductions =
                                                Number(employee.sss_contribution || 0) +
                                                Number(employee.phic_contribution || 0) +
                                                Number(employee.hdmf_contribution || 0);

                                            return (
                                                <TableRow key={employee.employee_id}>
                                                    <TableCell className="font-medium">{employee.id_number}</TableCell>
                                                    <TableCell>
                                                        <div>
                                                            <div className="font-medium">{employee.full_name}</div>
                                                            <div className="text-xs text-muted-foreground">{employee.department?.name || 'N/A'}</div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>{employee.company?.name || 'N/A'}</TableCell>
                                                    <TableCell>{employee.position?.title || 'N/A'}</TableCell>
                                                    <TableCell className="text-right font-medium">{formatCurrency(employee.daily_rate)}</TableCell>
                                                    <TableCell className="text-right">{formatCurrency(totalAllowances)}</TableCell>
                                                    <TableCell className="text-right">{formatCurrency(totalDeductions)}</TableCell>
                                                    <TableCell className="text-center">
                                                        <Link href={route('payroll.employee-settings.edit', employee.employee_id)}>
                                                            <Button variant="ghost" size="sm">
                                                                <Edit className="h-4 w-4" />
                                                            </Button>
                                                        </Link>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })
                                    )}
                                </TableBody>
                            </Table>
                        </div>

                        {/* Pagination */}
                        {employees.data.length > 0 && (
                            <div className="flex items-center justify-between border-t px-6 py-4">
                                <div className="text-sm text-gray-700 dark:text-gray-300">
                                    Showing {employees.from} to {employees.to} of {employees.total} employees
                                </div>
                                <div className="flex gap-2">
                                    {employees.links.map((link, index) => (
                                        <Button
                                            key={index}
                                            variant={link.active ? 'default' : 'outline'}
                                            size="sm"
                                            disabled={!link.url}
                                            onClick={() => link.url && router.get(link.url)}
                                            dangerouslySetInnerHTML={{ __html: link.label }}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
