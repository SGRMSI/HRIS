import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, Edit, Trash2, FileUp, ExternalLink, Trash, Calendar, Camera, AlertTriangle, Clock } from 'lucide-react';
import { DeleteEmployeeDialog } from '@/components/employee/delete-employee-dialog';
import { UploadDocumentDialog } from '@/components/employee/upload-document-dialog';
import { ProfilePictureDialog } from '@/components/employee/profile-picture-dialog';
import { useState } from 'react';
import { DeleteDocumentDialog } from '@/components/employee/delete-document-dialog';
import { formatTime12Hour, formatDate } from '@/lib/date-utils';

interface Employee {
    employee_id: number;
    id_number: string;
    first_name: string;
    middle_name?: string;
    last_name: string;
    full_name: string;
    company: string;
    company_id?: number;
    department: string;
    position: string;
    employment_status: 'Probationary' | 'Trainee' | 'Regular' | 'Contractual' | 'Resigned' | 'Terminated';
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
    absents?: number;
    infractions?: number;
    infractions_last_reset_at?: string | null;
    sss_number?: string;
    phic_number?: string;
    hdmf_number?: string;
    tin_number?: string;
    profile_picture?: string | null;
    evaluation_start_date?: string | null;
    evaluation_end_date?: string | null;
    days_until_evaluation?: number | null;
    is_evaluation_overdue?: boolean;
    is_evaluation_due_soon?: boolean;
    current_shift?: {
        schedule_id: number;
        name: string;
        time_in: string;
        time_out: string;
        date_start: string;
        date_end: string | null;
    } | null;
}

interface EmployeeDocument {
    document_id: number;
    file_name: string;
    category: 'Government_Documents' | 'Company_Documents' | 'Infractions' | 'Other';
    uploaded_by: string;
    uploaded_at: string;
    remarks: string;
    file_path: string;
}

interface Props {
    employee: Employee;
    documents: EmployeeDocument[];
}

export default function EmployeeShow({ employee, documents }: Props) {
    const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
    const [profilePictureDialogOpen, setProfilePictureDialogOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [deleteDocumentDialogOpen, setDeleteDocumentDialogOpen] = useState(false);
    const [selectedDocument, setSelectedDocument] = useState<{ document_id: number; file_name: string } | null>(null);
    // const [selectedCategory, setSelectedCategory] = useState<'Government_Documents' | 'Company_Documents' | 'Infractions' | 'Other'>('Government_Documents');

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

            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl p-6">
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
                        <Card className="transition-shadow hover:shadow-lg">
                            <CardContent className="p-6 text-center">
                                {/* Profile Picture with Camera Icon Overlay */}
                                <div className="relative mx-auto mb-4 inline-block">
                                    {/* Profile Picture with Initials Fallback - Larger with border */}
                                    <div className="flex h-40 w-40 items-center justify-center rounded-full bg-gradient-to-br from-purple-400 via-pink-400 to-blue-400 text-4xl font-bold text-white shadow-xl overflow-hidden border-4 border-gray-200 dark:border-gray-600">
                                        {employee.profile_picture ? (
                                            <img 
                                                src={`/employee/${employee.employee_id}/profile-picture/view`}
                                                alt={employee.full_name}
                                                className="h-full w-full object-cover"
                                            />
                                        ) : (
                                            getInitials(employee.full_name)
                                        )}
                                    </div>
                                    
                                    {/* Camera Icon Button - Bottom right, white background */}
                                    <button
                                        onClick={() => setProfilePictureDialogOpen(true)}
                                        className="absolute bottom-0 right-0 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white text-slate-800 shadow-lg border-2 border-slate-200 transition-all hover:scale-110 hover:bg-slate-50 dark:bg-white dark:text-slate-800 dark:border-slate-300 dark:hover:bg-slate-100"
                                        title="Manage Profile Picture"
                                        type="button"
                                    >
                                        <Camera className="h-5 w-5" />
                                    </button>
                                </div>

                                <div className="flex flex-col items-center">
                                <h2 className="mb-1 text-xl font-semibold text-foreground">{employee.full_name}</h2>
                                <p className="mb-3 text-base text-muted-foreground">{employee.position}</p>
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
                        <div className="flex flex-col gap-4">
                            {/* Status Card */}
                            <Card className="transition-shadow hover:shadow-lg">
                                <CardContent className="p-4">
                                    <div className="space-y-3">
                                        <div className="flex flex-col items-center justify-center gap-3">
                                            <div
                                                className={`inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium ${getStatusColor(employee.employment_status)}`}
                                            >
                                                {employee.employment_status}
                                            </div>
                                            <p className="text-sm text-muted-foreground">Employment Status</p>
                                        </div>

                                        {/* Evaluation Period - Only for Probationary/Trainee */}
                                        {(employee.employment_status === 'Probationary' || employee.employment_status === 'Trainee') && employee.evaluation_end_date && (
                                            <div className="border-t pt-3 space-y-2">
                                                <p className="text-xs font-semibold text-muted-foreground text-center">Evaluation Period</p>
                                                
                                                {/* Evaluation Dates */}
                                                <div className="grid grid-cols-2 gap-2">
                                                    {employee.evaluation_start_date && (
                                                        <div className="flex flex-col gap-1 py-2 px-3 bg-muted/50 rounded-md">
                                                            <span className="text-xs text-muted-foreground">Start</span>
                                                            <span className="text-sm font-semibold text-foreground">{formatDate(employee.evaluation_start_date)}</span>
                                                        </div>
                                                    )}
                                                    <div className="flex flex-col gap-1 py-2 px-3 bg-muted/50 rounded-md">
                                                        <span className="text-xs text-muted-foreground">End</span>
                                                        <span className="text-sm font-semibold text-foreground">{formatDate(employee.evaluation_end_date)}</span>
                                                    </div>
                                                </div>

                                                {/* Warning Messages */}
                                                {employee.is_evaluation_overdue && (
                                                    <div className="flex items-center gap-2 rounded-md bg-red-50 p-2 dark:bg-red-950/20">
                                                        <AlertTriangle className="h-3.5 w-3.5 text-red-600 dark:text-red-400 flex-shrink-0" />
                                                        <div className="flex-1">
                                                            <p className="text-xs font-semibold text-red-900 dark:text-red-100">Overdue by {Math.abs(employee.days_until_evaluation || 0)} day(s)</p>
                                                        </div>
                                                    </div>
                                                )}

                                                {employee.is_evaluation_due_soon && !employee.is_evaluation_overdue && (
                                                    <div className="flex items-center gap-2 rounded-md bg-amber-50 p-2 dark:bg-amber-950/20">
                                                        <Clock className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
                                                        <div className="flex-1">
                                                            <p className="text-xs font-semibold text-amber-900 dark:text-amber-100">Due in {employee.days_until_evaluation || 0} day(s)</p>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Work Schedule Card */}
                            <Card className="transition-shadow hover:shadow-lg overflow-hidden relative">
                                {employee.current_shift ? (
                                    <>
                                        {/* Status Badge on Top Corner */}
                                        <div className="absolute top-0 right-0 bg-green-500 text-white px-3 py-1 rounded-bl-lg shadow-md z-10">
                                            <div className="flex items-center gap-1.5">
                                                <div className="h-1.5 w-1.5 rounded-full bg-white animate-pulse"></div>
                                                <span className="text-xs font-semibold uppercase tracking-wide">
                                                    Active
                                                </span>
                                            </div>
                                        </div>
                                        
                                        <CardContent className="p-6">
                                            <div className="space-y-4">
                                                {/* Shift Name */}
                                                <div className="text-center pb-3 border-b">
                                                    <h3 className="text-lg font-bold text-foreground">
                                                        {employee.current_shift.name}
                                                    </h3>
                                                    <p className="text-xs text-muted-foreground mt-1">Work Schedule</p>
                                                </div>

                                                {/* Schedule Details */}
                                                <div className="space-y-2.5">
                                                    {/* Time In and Time Out - Side by Side */}
                                                    <div className="grid grid-cols-2 gap-2">
                                                        <div className="flex flex-col gap-1 py-2 px-3 bg-muted/50 rounded-md">
                                                            <span className="text-xs text-muted-foreground">Time In</span>
                                                            <span className="text-sm font-semibold text-foreground">{formatTime12Hour(employee.current_shift.time_in)}</span>
                                                        </div>
                                                        <div className="flex flex-col gap-1 py-2 px-3 bg-muted/50 rounded-md">
                                                            <span className="text-xs text-muted-foreground">Time Out</span>
                                                            <span className="text-sm font-semibold text-foreground">{formatTime12Hour(employee.current_shift.time_out)}</span>
                                                        </div>
                                                    </div>
                                                    {/* Period Section */}
                                                    <div className="space-y-1.5">
                                                        
                                                        <div className="grid grid-cols-2 gap-2">
                                                            <div className="flex flex-col gap-1 py-2 px-3 bg-muted/50 rounded-md">
                                                                <span className="text-xs text-muted-foreground">Start Date</span>
                                                                <span className="text-sm font-semibold text-foreground">{formatDate(employee.current_shift.date_start)}</span>
                                                            </div>
                                                            <div className="flex flex-col gap-1 py-2 px-3 bg-muted/50 rounded-md">
                                                                <span className="text-xs text-muted-foreground">End Date</span>
                                                                <span className="text-sm font-semibold text-foreground">{employee.current_shift.date_end ? formatDate(employee.current_shift.date_end) : 'Ongoing'}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Action Buttons */}
                                                <div className="flex gap-2 pt-2">
                                                    <Link 
                                                        href={`/attendance/schedules/${employee.current_shift.schedule_id}/edit`}
                                                        className="flex-1"
                                                    >
                                                        <Button 
                                                            variant="default" 
                                                            size="sm" 
                                                            className="w-full"
                                                        >
                                                            Change Schedule
                                                        </Button>
                                                    </Link>
                                                    <Link 
                                                        href="/attendance/schedules"
                                                        className="flex-1"
                                                    >
                                                        <Button 
                                                            variant="outline" 
                                                            size="sm" 
                                                            className="w-full"
                                                        >
                                                            View All
                                                        </Button>
                                                    </Link>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </>
                                    ) : (
                                    <>
                                        {/* Status Badge on Top Corner */}
                                        <div className="absolute top-0 right-0 bg-yellow-500 text-white px-3 py-1 rounded-bl-lg shadow-md z-10">
                                            <div className="flex items-center gap-1.5">
                                                <div className="h-1.5 w-1.5 rounded-full bg-white"></div>
                                                <span className="text-xs font-semibold uppercase tracking-wide">
                                                    Not Assigned
                                                </span>
                                            </div>
                                        </div>

                                        <CardContent className="p-6">
                                            <div className="flex flex-col items-center justify-center py-4 space-y-4">
                                                <div className="text-center space-y-2">
                                                    <div className="mx-auto w-16 h-16 rounded-full bg-yellow-100 dark:bg-yellow-900/20 flex items-center justify-center">
                                                        <Calendar className="h-8 w-8 text-yellow-600 dark:text-yellow-400" />
                                                    </div>
                                                    <p className="text-sm text-muted-foreground">
                                                        No work schedule has been assigned to this employee yet.
                                                    </p>
                                                </div>
                                                <Link 
                                                    href={`/attendance/schedules/create?employee_id=${employee.employee_id}&company_id=${employee.company_id || ''}`}
                                                    className="w-full"
                                                >
                                                    <Button 
                                                        variant="default" 
                                                        size="sm" 
                                                        className="w-full"
                                                    >
                                                        <Calendar className="mr-2 h-4 w-4" />
                                                        Assign Schedule
                                                    </Button>
                                                </Link>
                                            </div>
                                        </CardContent>
                                    </>
                                    )}
                            </Card>
                        </div>

                        {/* Stats */}
                        <div className="grid grid-cols-2 gap-4">
                            <Card className="transition-shadow hover:shadow-lg">
                                <CardContent className="p-4 text-center">
                                    <div className="text-3xl font-bold text-foreground">{employee.absents || 2}</div>
                                    <div className="text-sm text-muted-foreground">Absents</div>
                                </CardContent>
                            </Card>
                            <Card className="transition-shadow hover:shadow-lg">
                                <CardContent className="p-4 text-center">
                                    <div className="text-3xl font-bold text-foreground">{employee.infractions || 0}</div>
                                    <div className="text-sm text-muted-foreground">Infractions</div>
                                    <div className='text-xs text-muted-foreground mt-1'>
                                        {employee.infractions_last_reset_at 
                                            ? `Last reset: ${formatDate(employee.infractions_last_reset_at)}`
                                            : 'Resets every 30 days'
                                        }
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-3">
                            <Button 
                                onClick={handleEditEmployee}
                                variant="outline" 
                                size="sm" 
                                className="flex-1 flex items-center gap-2"
                            >
                                <Edit className="h-4 w-4" />
                                Edit
                            </Button>
                            <Button 
                                onClick={handleDeleteEmployee}
                                variant="outline" 
                                size="sm" 
                                className="flex-1 flex items-center gap-2"
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
                            <Card className="overflow-hidden transition-shadow hover:shadow-lg p-0 flex-1">
                                <CardHeader className="bg-slate-800 dark:bg-slate-700 py-4 text-white">
                                    <CardTitle className="text-lg font-medium">Personal Details</CardTitle>
                                </CardHeader>
                                <CardContent className="p-6">
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
                            <Card className="overflow-hidden transition-shadow hover:shadow-lg p-0 flex-1">
                                <CardHeader className="bg-slate-800 dark:bg-slate-700 py-4 text-white">
                                    <CardTitle className="text-lg font-medium">Employment Details</CardTitle>
                                </CardHeader>
                                <CardContent className="p-6">
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
                        <Card className="overflow-hidden transition-shadow hover:shadow-lg p-0">
                            <CardHeader className="bg-slate-800 dark:bg-slate-700 py-4 text-white">
                                <CardTitle className="text-lg font-medium">Government Details</CardTitle>
                            </CardHeader>
                            <CardContent className="p-6">
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
                        
                        {/* Employee Documents */}
                        <Card className="overflow-hidden transition-shadow hover:shadow-lg p-0 mt-6">
                            <CardHeader className="bg-slate-800 dark:bg-slate-700 py-4 text-white flex flex-row justify-between items-center">
                                <CardTitle className="text-lg font-medium">Employee Documents</CardTitle>
                                <Button 
                                    variant="outline" 
                                    size="sm"
                                    className="bg-white text-slate-800 hover:bg-slate-100 hover:text-slate-900"
                                    onClick={() => setUploadDialogOpen(true)}
                                >
                                    <FileUp className="h-4 w-4 mr-2" />
                                    Upload File
                                </Button>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 dark:scrollbar-thumb-gray-600 dark:scrollbar-track-gray-800">
                                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                        <thead className="bg-gray-50 dark:bg-gray-800">
                                            <tr className="border-b dark:border-slate-700">
                                                <th className="py-2 px-3 text-left text-sm font-medium text-muted-foreground uppercase tracking-wider whitespace-nowrap">
                                                    Category
                                                </th>
                                                <th className="py-2 px-3 text-left text-sm font-medium text-muted-foreground uppercase tracking-wider whitespace-nowrap">
                                                    Filename
                                                </th>
                                                <th className="py-2 px-3 text-left text-sm font-medium text-muted-foreground uppercase tracking-wider whitespace-nowrap">
                                                    Uploaded by
                                                </th>
                                                <th className="py-2 px-3 text-left text-sm font-medium text-muted-foreground uppercase tracking-wider whitespace-nowrap">
                                                    Date
                                                </th>
                                                <th className="py-2 px-3 text-left text-sm font-medium text-muted-foreground uppercase tracking-wider whitespace-nowrap">
                                                    Remarks
                                                </th>
                                                <th className="py-2 px-3 text-left text-sm font-medium text-muted-foreground uppercase tracking-wider whitespace-nowrap">
                                                    Actions
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-900 dark:divide-gray-700">
                                            {documents.length === 0 ? (
                                                <tr>
                                                    <td colSpan={6} className="text-center py-8 text-muted-foreground text-sm">
                                                        <div className="flex flex-col items-center gap-2">
                                                            <FileUp className="h-8 w-8 text-muted-foreground opacity-50" />
                                                            <p>No documents found</p>
                                                            <p className="text-xs">Upload a document to get started</p>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ) : (
                                                documents.map((doc) => (
                                                    <tr key={doc.document_id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                                                        <td className="py-2 px-3">
                                                            <div className="text-sm break-words">{doc.category.replace(/_/g, ' ')}</div>
                                                        </td>
                                                        <td className="py-2 px-3 max-w-[200px]">
                                                            <div className="text-sm break-words">{doc.file_name}</div>
                                                        </td>
                                                        <td className="py-2 px-3">
                                                            <div className="text-sm break-words">{doc.uploaded_by}</div>
                                                        </td>
                                                        <td className="py-2 px-3 whitespace-nowrap">
                                                            <div className="text-sm">{doc.uploaded_at}</div>
                                                        </td>
                                                        <td className="py-2 px-3 max-w-[250px]">
                                                            <div className="text-sm break-words">{doc.remarks || '-'}</div>
                                                        </td>
                                                        <td className="py-2 px-3 whitespace-nowrap">
                                                            <div className="flex space-x-1">
                                                                <a 
                                                                    href={`/employee/documents/${doc.document_id}/view`} 
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                >
                                                                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0" title="View Document">
                                                                        <ExternalLink className="h-3 w-3" />
                                                                    </Button>
                                                                </a>
                                                                <Button 
                                                                    type="button" 
                                                                    variant="ghost" 
                                                                    size="sm" 
                                                                    className="h-7 w-7 p-0 text-red-500 hover:text-red-700" 
                                                                    title="Delete"
                                                                    onClick={() => {
                                                                        setSelectedDocument({
                                                                            document_id: doc.document_id,
                                                                            file_name: doc.file_name
                                                                        });
                                                                        setDeleteDocumentDialogOpen(true);
                                                                    }}
                                                                >
                                                                    <Trash className="h-3 w-3" />
                                                                </Button>
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
            
            {/* Upload Document Dialog */}
            <UploadDocumentDialog
                employeeId={employee.employee_id}
                open={uploadDialogOpen}
                onOpenChange={setUploadDialogOpen}
                initialCategory="Government_Documents"
            />

            {/* Profile Picture Dialog */}
            <ProfilePictureDialog
                employeeId={employee.employee_id}
                employeeName={employee.full_name}
                currentProfilePicture={employee.profile_picture || null}
                open={profilePictureDialogOpen}
                onOpenChange={setProfilePictureDialogOpen}
            />
            
            {/* Document Delete Confirmation Dialog */}
            {selectedDocument && (
                <DeleteDocumentDialog
                    document={selectedDocument}
                    open={deleteDocumentDialogOpen}
                    onOpenChange={setDeleteDocumentDialogOpen}
                />
            )}
        </AppLayout>
    );
}
