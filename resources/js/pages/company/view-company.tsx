import AccountTable from '@/components/accounts/AccountTable';
import DepartmentTable from '@/components/departments/DepartmentTable';
import PositionTable from '@/components/positions/PositionTable';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { type PageProps } from '@inertiajs/core';
import { Head, Link, usePage } from '@inertiajs/react';
import { ArrowLeft, Briefcase, Building2, Edit, Phone, SquareUserRound, Users } from 'lucide-react';
import { useEffect } from 'react';
import { toast } from 'sonner'; // Or your toast library

interface Company {
    company_id: number;
    name: string;
    industry: string;
    created_at: string;
    updated_at: string;
    has_account?: boolean;
}

interface Department {
    department_id: number;
    name: string;
    employees_count: number;
    description?: string;
}

interface Position {
    position_id: number;
    title: string;
    employees_count: number;
    department?: string;
    level?: string;
}

interface Account {
    account_id: number;
    name: string;
    active: boolean;
    client_type?: string;
    start_date?: string;
    contract_value?: number;
}

interface Employee {
    employee_id: number;
    id_number: string;
    full_name: string;
    department: string;
    position: string;
    employment_status: string;
    hire_date?: string;
}

interface Props {
    company: Company;
    departments?: Department[];
    positions?: Position[];
    accounts?: Account[];
    employees?: Employee[];
    flash: {
        success?: string;
        error?: string;
        warning?: string;
        info?: string;
    };
}

export default function ViewCompany({ company, departments = [], positions = [], accounts = [], employees = [] }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Company Management',
            href: '/company',
        },
        {
            title: company.name,
            href: `/company/${company.company_id}`,
        },
    ];

    const isCallCenter =
        company.industry.toLowerCase().includes('call center') ||
        company.industry.toLowerCase().includes('bpo') ||
        company.industry.toLowerCase().includes('customer service');

    const { props } = usePage<PageProps & Props>();

    useEffect(() => {
        if (props.flash?.success) {
            toast.success(props.flash.success);
        }
        if (props.flash?.error) {
            toast.error(props.flash.error);
        }
        if (props.flash?.warning) {
            toast.warning(props.flash.warning);
        }
        if (props.flash?.info) {
            toast.info(props.flash.info);
        }
    }, [props.flash]);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`${company.name} - Company Details`} />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl p-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" asChild>
                            <Link href="/company">
                                <ArrowLeft className="h-4 w-4" />
                                Back to Companies
                            </Link>
                        </Button>
                    </div>
                    <Button asChild>
                        <Link href={route('company.edit', company.company_id)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit Company
                        </Link>
                    </Button>
                </div>

                {/* Company Info */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            {isCallCenter ? <Phone className="h-5 w-5" /> : <Building2 className="h-5 w-5" />}
                            <CardTitle>{company.name}</CardTitle>
                            {isCallCenter && <Badge variant="default">Call Center</Badge>}
                        </div>
                        <CardDescription>Company Information & Operations</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 gap-10 md:grid-cols-3">
                            <div>
                                <span className="text-sm font-medium text-muted-foreground">Industry</span>
                                <div className="mt-1">
                                    <Badge variant="secondary">{company.industry}</Badge>
                                </div>
                            </div>
                            <div>
                                <span className="text-sm font-medium text-muted-foreground">Total Employees</span>

                                <div className="mt-1 flex items-center gap-2">
                                    <Users className="h-4 w-4 text-muted-foreground" />
                                    <p className="mt-1 text-lg font-semibold">{employees?.length || 0}</p>
                                </div>
                            </div>
                            <div>
                                <span className="text-sm font-medium text-muted-foreground">Total Departments</span>
                                <div className="mt-1 flex items-center gap-2">
                                    <Building2 className="h-4 w-4 text-muted-foreground" />
                                    <p className="mt-1 text-lg font-semibold">{departments?.length || 0}</p>
                                </div>
                            </div>
                            <div>
                                <span className="text-sm font-medium text-muted-foreground">Total Positions</span>
                                <div className="mt-1 flex items-center gap-2">
                                    <Briefcase className="h-4 w-4 text-muted-foreground" />
                                    <p className="mt-1 text-lg font-semibold">{positions?.length || 0}</p>
                                </div>
                            </div>
                            <div>
                                <span className="text-sm font-medium text-muted-foreground">Total Accounts</span>
                                <div className="mt-1 flex items-center gap-2">
                                    <SquareUserRound className="h-4 w-4 text-muted-foreground" />
                                    <p className="mt-1 text-lg font-semibold">{company.has_account ? accounts?.length || 0 : 'N/A'}</p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Add tables in a flex or grid layout */}
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                    <DepartmentTable company={company} departments={departments} isCallCenter={isCallCenter} />

                    <PositionTable company={company} positions={positions} isCallCenter={isCallCenter} />

                    {/* AccountTable will only render if company.has_account is true */}
                    <AccountTable company={company} accounts={accounts} isCallCenter={isCallCenter} />
                </div>
            </div>
        </AppLayout>
    );
}
