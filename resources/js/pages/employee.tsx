import { EmployeeDataTable } from '@/components/employee/employee-data-table';
import { columns, type Employee } from '@/components/employee/employeecolumns';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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

    const uniqueDepartments = [...new Set(employees.map((emp) => emp.department).filter(Boolean))];

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
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <div className="flex items-center justify-end py-4 gap-4">
                    <Card>
                        <CardHeader>
                            <div className="flex gap-2">
                                <Warehouse className="h-4 w-4" />
                                <CardTitle>{uniqueDepartments.length}</CardTitle>
                            </div>
                            <CardDescription>Departments</CardDescription>
                        </CardHeader>
                    </Card>
                    <Card>
                        <CardHeader>
                            <div className="flex gap-2">
                                <Users className="h-4 w-4" />
                                <CardTitle>{employees.length}</CardTitle>
                            </div>
                            <CardDescription>Total Employees</CardDescription>
                        </CardHeader>
                    </Card>
                </div>
                <EmployeeDataTable columns={columns} data={employees} />
            </div>
        </AppLayout>
    );
}
