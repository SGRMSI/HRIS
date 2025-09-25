import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, User, Edit, Trash2 } from 'lucide-react';
import { DeleteEmployeeDialog } from '@/components/employee/delete-employee-dialog';
import { useState } from 'react';

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
    email?: string;
    address?: string;
    date_of_birth?: string;
    gender?: string;
    civil_status?: string;
    emergency_contact_name?: string;
    emergency_contact_number?: string;
    age?: number;
    date_regularized?: string;
    date_separated?: string;
    work_shift?: string;
    absents?: number;
    infractions?: number;
    sss_number?: string;
    phic_number?: string;
    hdmf_number?: string;
    tin_number?: string;
}

interface Props {
    employee: Employee;
}

export default function EmployeeShow({ employee }: Props) {
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Employee',
            href: '/employee',
        },
        {
            title: employee.full_name,
            href: `/employee/${employee.employee_id}`,
        },
    ];

    const handleEditEmployee = () => {
        window.location.href = `/employee/${employee.employee_id}/edit`;
    };

    const handleDeleteEmployee = () => {
        setDeleteDialogOpen(true);
    };

    // Generate initials from employee name
    const getInitials = (fullName: string) => {
        const nameParts = fullName.split(' ');
        const firstName = nameParts[0] || '';
        const lastName = nameParts[nameParts.length - 1] || '';
        return (firstName.charAt(0) + lastName.charAt(0)).toUpperCase();
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Regular':
                return 'bg-green-100 text-green-800 border border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800';
            case 'Probationary':
                return 'bg-yellow-100 text-yellow-800 border border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800';
            case 'Contractual':
                return 'bg-blue-100 text-blue-800 border border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800';
            case 'Resigned':
            case 'Terminated':
                return 'bg-red-100 text-red-800 border border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800';
            default:
                return 'bg-gray-100 text-gray-800 border border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700';
        }
    };

    // Calculate work duration from hire date to today
    const getWorkDuration = (hireDate: string) => {
        const hired = new Date(hireDate);
        const today = new Date();

        let years = today.getFullYear() - hired.getFullYear();
        let months = today.getMonth() - hired.getMonth();
        let days = today.getDate() - hired.getDate();

        // Adjust for negative days
        if (days < 0) {
            months--;
            const lastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
            days += lastMonth.getDate();
        }

        // Adjust for negative months
        if (months < 0) {
            years--;
            months += 12;
        }

        // Build the duration string
        const parts = [];
        if (years > 0) parts.push(`${years} year${years !== 1 ? 's' : ''}`);
        if (months > 0) parts.push(`${months} month${months !== 1 ? 's' : ''}`);
        if (days > 0) parts.push(`${days} day${days !== 1 ? 's' : ''}`);

        return parts.length > 0 ? parts.join(' ') : '0 days';
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Employee - ${employee.full_name}`} />

            <div className="flex h-full flex-1 flex-col gap-6 p-6">
                {/* Header */}
                <div className="mb-6 flex items-center gap-4">
                    <Link href="/employee">
                        <Button variant="ghost" size="sm" className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
                            <ArrowLeft className="h-4 w-4" />
                            View Employees
                        </Button>
                    </Link>
                </div>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    {/* Left Column - Profile */}
                    <div className="space-y-4">
                        {/* Profile Card */}
                        <Card className="border shadow-sm">
                            <CardContent className="p-6 text-center">
                                {/* Profile Picture with Initials Fallback */}
                                <div className="mx-auto mb-4 flex h-32 w-32 items-center justify-center rounded-full bg-gradient-to-br from-purple-400 via-pink-400 to-blue-400 text-3xl font-bold text-white shadow-lg">
                                    {getInitials(employee.full_name)}
                                </div>
                                <div className="flex flex-col items-center">
                                <h2 className="mb-1 text-2xl font-semibold text-foreground">{employee.full_name}</h2>
                                <p className="mb-4 text-xl text-muted-foreground">{employee.position}</p>
                                <div className="flex items-end gap-2">
                                    <p className="mt-2 text-sm text-muted-foreground">Employee ID :</p>
                                    <div className="text-sm font-medium text-foreground">{employee.id_number}</div>
                                </div>
                                </div>
                                <div className="text-sm mt-4 inline-block rounded bg-slate-800 dark:bg-slate-700 px-4 py-2 text-white">
                                    At work for: <span className="font-medium">{getWorkDuration(employee.date_hired)}</span>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Status and Work Schedule Row */}
                        <div className="flex gap-4">
                            {/* Status Card */}
                            <Card className="border shadow-sm flex-1">
                                <CardContent className="p-6">
                                    <div className="flex flex-col items-center">
                                        <div
                                            className={`inline-flex items-center rounded-lg p-5 text-sm font-medium ${getStatusColor(employee.employment_status)}`}
                                        >
                                            <User className="mr-2 h-4 w-4" />
                                            {employee.employment_status}
                                        </div>
                                        <p className="mt-2 text-sm text-muted-foreground">Status</p>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Work Schedule Card */}
                            <Card className="border shadow-sm flex-1">
                                <CardContent className="p-4 h-full">
                                    <div className='flex flex-col justify-center h-full items-center'>
                                        <div className="text-center">
                                            <p className="font-medium text-foreground">{employee.work_shift || 'Graveyard'}</p>
                                            <p className="mb-1 text-sm text-muted-foreground">Work Schedule</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Stats */}
                        <div className="grid grid-cols-2 gap-4">
                            <Card className="border shadow-sm">
                                <CardContent className="p-4 text-center">
                                    <div className="text-3xl font-bold text-foreground">{employee.absents || 2}</div>
                                    <div className="text-sm text-muted-foreground">Absents</div>
                                </CardContent>
                            </Card>
                            <Card className="border shadow-sm">
                                <CardContent className="p-4 text-center">
                                    <div className="text-3xl font-bold text-foreground">{employee.infractions || 1}</div>
                                    <div className="text-sm text-muted-foreground">Infractions</div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-3">
                            <Button 
                                onClick={handleEditEmployee}
                                variant="outline" 
                                size="sm" 
                                className="flex-1 flex items-center gap-2 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-600"
                            >
                                <Edit className="h-4 w-4" />
                                Edit
                            </Button>
                            <Button 
                                onClick={handleDeleteEmployee}
                                variant="outline" 
                                size="sm" 
                                className="flex-1 flex items-center gap-2 hover:bg-red-50 hover:border-red-300 hover:text-red-600"
                            >
                                <Trash2 className="h-4 w-4" />
                                Delete
                            </Button>
                        </div>
                    </div>

                    {/* Right Column - Details */}
                    <div className="space-y-6 lg:col-span-2">
                        {/* First Row - Personal Details and Employment Details */}
                        <div className="flex gap-6 flex-col xl:flex-row">
                            {/* Personal Details */}
                            <Card className="overflow-hidden border shadow-sm py-0 gap-2 flex-1">
                                <CardHeader className="bg-slate-800 dark:bg-slate-700 py-2 text-white">
                                    <CardTitle className="text-lg font-medium">Personal Details</CardTitle>
                                </CardHeader>
                                <CardContent className="p-6 pt-2">
                                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                        <div>
                                            <label className="mb-2 block text-sm font-medium text-muted-foreground">Name</label>
                                            <p className="text-sm font-bold text-foreground">{employee.full_name}</p>
                                        </div>
                                        <div>
                                            <label className="mb-2 block text-sm font-medium text-muted-foreground">Age</label>
                                            <p className="text-sm font-bold text-foreground">{employee.age || 'N/A'}</p>
                                        </div>
                                        <div>
                                            <label className="mb-2 block text-sm font-medium text-muted-foreground">Sex</label>
                                            <p className="text-sm font-bold text-foreground">{employee.gender || 'N/A'}</p>
                                        </div>
                                        <div>
                                            <label className="mb-2 block text-sm font-medium text-muted-foreground">Birthdate</label>
                                            <p className="text-sm font-bold text-foreground">{employee.date_of_birth || 'N/A'}</p>
                                        </div>
                                        <div>
                                            <label className="mb-2 block text-sm font-medium text-muted-foreground">Civil Status</label>
                                            <p className="text-sm font-bold text-foreground">{employee.civil_status || 'N/A'}</p>
                                        </div>
                                        <div>
                                            <label className="mb-2 block text-sm font-medium text-muted-foreground">Contact No.</label>
                                            <p className="text-sm font-bold text-foreground">{employee.contact_number || 'N/A'}</p>
                                        </div>
                                        <div className="sm:col-span-2">
                                            <label className="mb-2 block text-sm font-medium text-muted-foreground">Address</label>
                                            <p className="text-sm font-bold text-foreground">{employee.address || 'N/A'}</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Employment Details */}
                            <Card className="overflow-hidden border shadow-sm py-0 gap-2 flex-1">
                                <CardHeader className="bg-slate-800 dark:bg-slate-700 py-2 text-white">
                                    <CardTitle className="text-lg font-medium">Employment Details</CardTitle>
                                </CardHeader>
                                <CardContent className="p-6 pt-2">
                                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                        <div>
                                            <label className="mb-2 block text-sm font-medium text-muted-foreground">Employee ID</label>
                                            <p className="text-sm font-bold text-foreground">{employee.id_number}</p>
                                        </div>
                                        <div>
                                            <label className="mb-2 block text-sm font-medium text-muted-foreground">Company</label>
                                            <p className="text-sm font-bold text-foreground">{employee.company}</p>
                                        </div>
                                        <div>
                                            <label className="mb-2 block text-sm font-medium text-muted-foreground">Department</label>
                                            <p className="text-sm font-bold text-foreground">{employee.department}</p>
                                        </div>
                                        <div>
                                            <label className="mb-2 block text-sm font-medium text-muted-foreground">Position</label>
                                            <p className="text-sm font-bold text-foreground">{employee.position}</p>
                                        </div>
                                        <div>
                                            <label className="mb-2 block text-sm font-medium text-muted-foreground">Date Hired</label>
                                            <p className="text-sm font-bold text-foreground">{employee.date_hired}</p>
                                        </div>
                                        <div>
                                            <label className="mb-2 block text-sm font-medium text-muted-foreground">Status</label>
                                            <p className="text-sm font-bold text-foreground">{employee.employment_status}</p>
                                        </div>
                                        <div>
                                            <label className="mb-2 block text-sm font-medium text-muted-foreground">Date Regularized</label>
                                            <p className="text-sm font-bold text-foreground">{employee.date_regularized || 'N/A'}</p>
                                        </div>
                                        <div>
                                            <label className="mb-2 block text-sm font-medium text-muted-foreground">Date Separated</label>
                                            <p className="text-sm font-bold text-foreground">{employee.date_separated || 'N/A'}</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Second Row - Government Details */}
                        <Card className="overflow-hidden border shadow-sm py-0 gap-2">
                            <CardHeader className="bg-slate-800 dark:bg-slate-700 py-2 text-white">
                                <CardTitle className="text-lg font-medium">Government Details</CardTitle>
                            </CardHeader>
                            <CardContent className="p-6 pt-2">
                                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
                                    <div>
                                        <label className="mb-2 block text-sm font-medium text-muted-foreground">SSS Number</label>
                                        <p className="text-sm font-bold text-foreground">{employee.sss_number || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <label className="mb-2 block text-sm font-medium text-muted-foreground">PhilHealth Number</label>
                                        <p className="text-sm font-bold text-foreground">{employee.phic_number || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <label className="mb-2 block text-sm font-medium text-muted-foreground">Pag-IBIG Number</label>
                                        <p className="text-sm font-bold text-foreground">{employee.hdmf_number || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <label className="mb-2 block text-sm font-medium text-muted-foreground">TIN Number</label>
                                        <p className="text-sm font-bold text-foreground">{employee.tin_number || 'N/A'}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>

            {/* Delete Confirmation Dialog */}
            <DeleteEmployeeDialog 
                employee={{
                    id: employee.employee_id,
                    name: employee.full_name
                }}
                open={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
            />
        </AppLayout>
    );
}
