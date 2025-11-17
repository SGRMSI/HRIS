import { EmployeeDataTable } from '@/components/employee/employee-data-table';
import { EvaluationWarningCard } from '@/components/employee/evaluation-warning-card';
import { columns, type Employee } from '@/components/employee/employeecolumns';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { Users, Warehouse } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Employee',
        href: '/employee',
    },
];

interface Props {
    employees: Employee[];
    flash?: {
        success?: string;
        error?: string;
        warning?: string;
        info?: string;
    };
}



export default function Employee({ employees, flash }: Props) {
    // State to track the currently displayed (filtered) employees
    const [displayedEmployees, setDisplayedEmployees] = useState<Employee[]>(employees);

    // Calculate stats from displayed employees (filtered data)
    const uniqueCompanies = [...new Set(displayedEmployees.map((emp) => emp.company).filter(Boolean))];

    // Calculate status counts
    const statusCounts = displayedEmployees.reduce((acc, employee) => {
        const status = employee.employment_status || 'Unknown';
        acc[status] = (acc[status] || 0) + 1;
        return acc;
    }, {} as { [key: string]: number });

    // Calculate evaluation warnings for Probationary and Trainee
    const evaluationWarnings = ['Probationary', 'Trainee'].map(status => {
        const employeesWithStatus = displayedEmployees.filter(emp => 
            emp.employment_status === status && 
            emp.evaluation_end_date
        );

        const dueSoonCount = employeesWithStatus.filter(emp => {
            if (!emp.days_until_evaluation) return false;
            return emp.days_until_evaluation >= 0 && 
                   emp.days_until_evaluation <= 3 && 
                   !emp.is_evaluation_overdue;
        }).length;

        const overdueCount = employeesWithStatus.filter(emp => 
            emp.is_evaluation_overdue === true
        ).length;

        return {
            status,
            dueSoonCount,
            overdueCount
        };
    });

    
    useEffect(() => {
        if (flash?.success) {
            toast.success(flash.success);
        }
        if (flash?.error) {
            toast.error(flash.error);
        }
        if (flash?.warning) {
            toast.warning(flash.warning);
        }
        if (flash?.info) {
            toast.info(flash.info);
        }
    }, [
        flash?.success,
        flash?.error,
        flash?.warning,
        flash?.info,
    ]);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Employee" />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl p-6">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                    <Card className="transition-shadow hover:shadow-lg">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Companies</CardTitle>
                            <div className="rounded-full bg-blue-100 p-2 dark:bg-blue-900/30">
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
                            <div className="rounded-full bg-green-100 p-2 dark:bg-green-900/30">
                                <Users className="h-4 w-4 text-green-600 dark:text-green-400" />
                            </div>
                        </CardHeader>
                        <div className="px-6 pb-6">
                            <div className="text-3xl font-bold">{displayedEmployees.length}</div>
                            <p className="mt-1 text-xs text-muted-foreground">All active employees</p>
                        </div>
                    </Card>
                    <EvaluationWarningCard 
                        statusCounts={statusCounts}
                        evaluationWarnings={evaluationWarnings}
                    />
                </div>

                {/* Employee Data Table */}
                <EmployeeDataTable 
                    columns={columns} 
                    data={employees}
                    onFilteredDataChange={setDisplayedEmployees}
                />
            </div>
        </AppLayout>
    );
}
