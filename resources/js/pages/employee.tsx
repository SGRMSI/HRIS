import { EmployeeDataTable } from '@/components/employee/employee-data-table';
import { columns, type Employee } from '@/components/employee/employeecolumns';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { type PageProps } from '@inertiajs/core';
import { Head, usePage } from '@inertiajs/react';
import { Users, Warehouse } from 'lucide-react';
import { useEffect } from 'react';
import { toast } from 'sonner';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Employee',
        href: '/employee',
    },
];

interface Props {
    employees: Employee[];
}

interface GlobalPageProps extends PageProps {
    flash?: {
        success?: string;
        error?: string;
        warning?: string;
        info?: string;
    };
}

export default function Employee({ employees }: Props) {
    const { props } = usePage<GlobalPageProps>();

    const uniqueCompanies = [...new Set(employees.map((emp) => emp.company).filter(Boolean))];

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
            <Head title="Employee" />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl p-6">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <Card className="transition-shadow hover:shadow-lg">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Companies</CardTitle>
                            <div className="rounded-full bg-blue-100 dark:bg-blue-900/30 p-2">
                                <Warehouse className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                            </div>
                        </CardHeader>
                        <div className="px-6 pb-6">
                            <div className="text-3xl font-bold">{uniqueCompanies.length}</div>
                            <p className="mt-1 text-xs text-muted-foreground">Active organizations</p>
                        </div>
                    </Card>
                    <Card className="transition-shadow hover:shadow-lg">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
                            <div className="rounded-full bg-green-100 dark:bg-green-900/30 p-2">
                                <Users className="h-4 w-4 text-green-600 dark:text-green-400" />
                            </div>
                        </CardHeader>
                        <div className="px-6 pb-6">
                            <div className="text-3xl font-bold">{employees.length}</div>
                            <p className="mt-1 text-xs text-muted-foreground">All active employees</p>
                        </div>
                    </Card>
                </div>
                
                {/* Employee Data Table */}
                <EmployeeDataTable columns={columns} data={employees} />
            </div>
        </AppLayout>
    );
}
