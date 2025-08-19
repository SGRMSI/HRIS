import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, User } from 'lucide-react';

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
}

interface Props {
    employee: Employee;
}

export default function EmployeeShow({ employee }: Props) {
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
                return 'bg-green-100 text-green-800 border border-green-200';
            case 'Probationary':
                return 'bg-yellow-100 text-yellow-800 border border-yellow-200';
            case 'Contractual':
                return 'bg-blue-100 text-blue-800 border border-blue-200';
            case 'Resigned':
            case 'Terminated':
                return 'bg-red-100 text-red-800 border border-red-200';
            default:
                return 'bg-gray-100 text-gray-800 border border-gray-200';
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
                        <Button variant="ghost" size="sm" className="flex items-center gap-2 text-gray-600 hover:text-gray-800">
                            <ArrowLeft className="h-4 w-4" />
                            View Employees
                        </Button>
                    </Link>
                </div>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    {/* Left Column - Profile */}
                    <div className="space-y-4">
                        {/* Profile Card */}
                        <Card className="border-0 shadow-sm">
                            <CardContent className="p-6 text-center">
                                {/* Profile Picture with Initials Fallback */}
                                <div className="mx-auto mb-4 flex h-32 w-32 items-center justify-center rounded-full bg-gradient-to-br from-purple-400 via-pink-400 to-blue-400 text-3xl font-bold text-white shadow-lg">
                                    {getInitials(employee.full_name)}
                                </div>
                                <div className="flex flex-col items-center">
                                <h2 className="mb-1 text-2xl font-semibold text-gray-900">{employee.full_name}</h2>
                                <p className="mb-4 text-xl text-gray-600">{employee.position}</p>
                                <div className="flex items-end gap-2">
                                    <p className="mt-2 text-sm text-gray-600">Employee ID :</p>
                                    <div className="text-sm font-medium">{employee.id_number}</div>
                                </div>
                                </div>
                                <div className="text-md mt-4 inline-block rounded bg-gray-800 p-4 text-white">
                                    At work for: {getWorkDuration(employee.date_hired)}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Status Card */}
                        <Card className="border-0 shadow-sm">
                            <CardContent className="p-6">
                                <div className="flex flex-row items-center gap-12">
                                    <div className="flex flex-col">
                                        <div
                                            className={`inline-flex items-center rounded-lg p-5 text-sm font-medium ${getStatusColor(employee.employment_status)}`}
                                        >
                                            <User className="mr-2 h-4 w-4" />
                                            {employee.employment_status}
                                        </div>
                                        <p className="mt-2 text-sm text-gray-600">Status</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Work Shift */}
                        <Card className="border-0 shadow-sm">
                            <CardContent className="p-4">
                                <div className="text-center">
                                    <p className="mb-1 text-sm text-gray-600">Work Shift</p>
                                    <p className="font-medium text-gray-900">{employee.work_shift || 'Graveyard'}</p>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Stats */}
                        <div className="grid grid-cols-2 gap-4">
                            <Card className="border-0 shadow-sm">
                                <CardContent className="p-4 text-center">
                                    <div className="text-3xl font-bold text-gray-900">{employee.absents || 2}</div>
                                    <div className="text-sm text-gray-600">Absents</div>
                                </CardContent>
                            </Card>
                            <Card className="border-0 shadow-sm">
                                <CardContent className="p-4 text-center">
                                    <div className="text-3xl font-bold text-gray-900">{employee.infractions || 1}</div>
                                    <div className="text-sm text-gray-600">Infractions</div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Action Buttons */}
                        <div className="space-y-3">
                            <Button variant="destructive" className="w-full py-3">
                                Delete
                            </Button>
                            <Button className="w-full bg-blue-600 py-3 hover:bg-blue-700">Edit</Button>
                        </div>
                    </div>

                    {/* Right Column - Details */}
                    <div className="space-y-6 lg:col-span-2">
                        {/* Personal Details */}
                        <Card className="overflow-hidden border-0 shadow-sm">
                            <CardHeader className="bg-gray-800 py-4 text-white">
                                <CardTitle className="text-lg font-medium">Personal Details</CardTitle>
                            </CardHeader>
                            <CardContent className="p-6">
                                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                    <div>
                                        <Label htmlFor="name" className="mb-1 block text-sm font-medium text-gray-700">
                                            Name
                                        </Label>
                                        <Input id="name" value={employee.full_name} readOnly className="border-gray-200 bg-gray-50" />
                                    </div>
                                    <div>
                                        <Label htmlFor="age" className="mb-1 block text-sm font-medium text-gray-700">
                                            Age
                                        </Label>
                                        <Input id="age" value={employee.age?.toString() || ''} readOnly className="border-gray-200 bg-gray-50" />
                                    </div>
                                    <div>
                                        <Label htmlFor="sex" className="mb-1 block text-sm font-medium text-gray-700">
                                            Sex
                                        </Label>
                                        <Input id="sex" value={employee.gender || ''} readOnly className="border-gray-200 bg-gray-50" />
                                    </div>
                                    <div>
                                        <Label htmlFor="birthdate" className="mb-1 block text-sm font-medium text-gray-700">
                                            Birthdate
                                        </Label>
                                        <Input id="birthdate" value={employee.date_of_birth || ''} readOnly className="border-gray-200 bg-gray-50" />
                                    </div>
                                    <div>
                                        <Label htmlFor="civil-status" className="mb-1 block text-sm font-medium text-gray-700">
                                            Civil Status
                                        </Label>
                                        <Input
                                            id="civil-status"
                                            value={employee.civil_status || ''}
                                            readOnly
                                            className="border-gray-200 bg-gray-50"
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="contact" className="mb-1 block text-sm font-medium text-gray-700">
                                            Contact No.
                                        </Label>
                                        <Input id="contact" value={employee.contact_number || ''} readOnly className="border-gray-200 bg-gray-50" />
                                    </div>
                                    <div className="md:col-span-2">
                                        <Label htmlFor="address" className="mb-1 block text-sm font-medium text-gray-700">
                                            Address
                                        </Label>
                                        <Input id="address" value={employee.address || ''} readOnly className="border-gray-200 bg-gray-50" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Employment Details */}
                        <Card className="overflow-hidden border-0 shadow-sm">
                            <CardHeader className="bg-gray-800 py-4 text-white">
                                <CardTitle className="text-lg font-medium">Employment Details</CardTitle>
                            </CardHeader>
                            <CardContent className="p-6">
                                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                    <div>
                                        <Label htmlFor="employee-id" className="mb-1 block text-sm font-medium text-gray-700">
                                            Employee ID
                                        </Label>
                                        <Input id="employee-id" value={employee.id_number} readOnly className="border-gray-200 bg-gray-50" />
                                    </div>
                                    <div>
                                        <Label htmlFor="company" className="mb-1 block text-sm font-medium text-gray-700">
                                            Company
                                        </Label>
                                        <Input id="company" value={employee.company} readOnly className="border-gray-200 bg-gray-50" />
                                    </div>
                                    <div>
                                        <Label htmlFor="department" className="mb-1 block text-sm font-medium text-gray-700">
                                            Department
                                        </Label>
                                        <Input id="department" value={employee.department} readOnly className="border-gray-200 bg-gray-50" />
                                    </div>
                                    <div>
                                        <Label htmlFor="position" className="mb-1 block text-sm font-medium text-gray-700">
                                            Position
                                        </Label>
                                        <Input id="position" value={employee.position} readOnly className="border-gray-200 bg-gray-50" />
                                    </div>
                                    <div>
                                        <Label htmlFor="date-hired" className="mb-1 block text-sm font-medium text-gray-700">
                                            Date Hired
                                        </Label>
                                        <Input id="date-hired" value={employee.date_hired} readOnly className="border-gray-200 bg-gray-50" />
                                    </div>
                                    <div>
                                        <Label htmlFor="status" className="mb-1 block text-sm font-medium text-gray-700">
                                            Status
                                        </Label>
                                        <Input id="status" value={employee.employment_status} readOnly className="border-gray-200 bg-gray-50" />
                                    </div>
                                    <div>
                                        <Label htmlFor="date-regularized" className="mb-1 block text-sm font-medium text-gray-700">
                                            Date Regularized
                                        </Label>
                                        <Input
                                            id="date-regularized"
                                            value={employee.date_regularized || ''}
                                            readOnly
                                            className="border-gray-200 bg-gray-50"
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="date-separated" className="mb-1 block text-sm font-medium text-gray-700">
                                            Date Separated
                                        </Label>
                                        <Input
                                            id="date-separated"
                                            value={employee.date_separated || ''}
                                            readOnly
                                            className="border-gray-200 bg-gray-50"
                                        />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
