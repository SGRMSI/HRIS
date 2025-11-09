import AppLayout from '@/layouts/app-layout';
import { Head, Link, useForm } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Save, X, AlertCircle, FileUp, Clock, Calendar as CalendarIcon } from 'lucide-react';
import { FormEventHandler, useState, useEffect } from 'react';
import axios from 'axios';

interface Employee {
    id: number;
    name: string;
    id_number: string;
    department: string;
}

interface Company {
    id: number;
    name: string;
}

interface Props {
    companies: Company[];
}

export default function OvertimesCreate({ companies = [] }: Props) {
    const { data, setData, post, processing, errors } = useForm({
        employee_id: '',
        overtime_date: '',
        duration_hours: '0',
        duration_minutes: '0',
        reason: '',
        document: null as File | null,
    });

    const [selectedCompany, setSelectedCompany] = useState<string>('');
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [loadingEmployees, setLoadingEmployees] = useState(false);
    const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);

    // Fetch employees when company is selected
    useEffect(() => {
        if (selectedCompany) {
            setLoadingEmployees(true);
            axios.get(route('attendance.overtimes.employees', selectedCompany))
                .then(response => {
                    setEmployees(response.data);
                    setLoadingEmployees(false);
                })
                .catch(error => {
                    console.error('Error fetching employees:', error);
                    setLoadingEmployees(false);
                });
        } else {
            setEmployees([]);
            setData('employee_id', '');
            setSelectedEmployee(null);
        }
    }, [selectedCompany]);

    const handleEmployeeChange = (employeeId: string) => {
        setData('employee_id', employeeId);
        const employee = employees.find((e) => e.id.toString() === employeeId);
        setSelectedEmployee(employee || null);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setData('document', e.target.files[0]);
        }
    };

    const handleSubmit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('attendance.overtimes.store'), {
            forceFormData: true,
        });
    };

    const getTotalDuration = () => {
        const hours = parseInt(data.duration_hours) || 0;
        const minutes = parseInt(data.duration_minutes) || 0;
        return hours * 60 + minutes;
    };

    const getFormattedDuration = () => {
        const hours = parseInt(data.duration_hours) || 0;
        const minutes = parseInt(data.duration_minutes) || 0;
        
        if (hours > 0 && minutes > 0) {
            return `${hours}h ${minutes}m`;
        } else if (hours > 0) {
            return `${hours}h`;
        } else if (minutes > 0) {
            return `${minutes}m`;
        }
        return '0m';
    };

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Attendance', href: '/attendance/overtimes' },
                { title: 'Overtimes', href: '/attendance/overtimes' },
                { title: 'Create', href: '/attendance/overtimes/create' },
            ]}
        >
            <Head title="Create Overtime Request" />

            <div className="space-y-6 p-6 md:p-4">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold">Create Overtime Request</h1>
                        <p className="text-muted-foreground mt-1">Submit a new overtime request for approval</p>
                    </div>
                    <Link href={route('attendance.overtimes.index')}>
                        <Button variant="outline">
                            <X className="h-4 w-4 mr-2" />
                            Cancel
                        </Button>
                    </Link>
                </div>

                <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Form */}
                    <div className="lg:col-span-2 space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Overtime Details</CardTitle>
                                <CardDescription>Enter the overtime information</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {/* Company Selection */}
                                <div className="space-y-2">
                                    <Label htmlFor="company_id">
                                        Company <span className="text-red-500">*</span>
                                    </Label>
                                    <Select value={selectedCompany} onValueChange={setSelectedCompany}>
                                        <SelectTrigger id="company_id">
                                            <SelectValue placeholder="Select a company first" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {companies.map((company) => (
                                                <SelectItem key={company.id} value={company.id.toString()}>
                                                    {company.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <p className="text-xs text-muted-foreground">
                                        Select a company to load employees
                                    </p>
                                </div>

                                {/* Employee Selection */}
                                <div className="space-y-2">
                                    <Label htmlFor="employee_id">
                                        Employee <span className="text-red-500">*</span>
                                    </Label>
                                    <Select 
                                        value={data.employee_id} 
                                        onValueChange={handleEmployeeChange}
                                        disabled={!selectedCompany || loadingEmployees}
                                    >
                                        <SelectTrigger id="employee_id" className={errors.employee_id ? 'border-red-500' : ''}>
                                            <SelectValue placeholder={
                                                loadingEmployees ? 'Loading employees...' :
                                                !selectedCompany ? 'Select a company first' :
                                                employees.length === 0 ? 'No employees found' :
                                                'Select an employee'
                                            } />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {employees.map((employee) => (
                                                <SelectItem key={employee.id} value={employee.id.toString()}>
                                                    {employee.name} - {employee.department} (#{employee.id_number})
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {errors.employee_id && (
                                        <p className="text-sm text-red-500">{errors.employee_id}</p>
                                    )}
                                </div>

                                {/* Overtime Date */}
                                <div className="space-y-2">
                                    <Label htmlFor="overtime_date">
                                        Overtime Date <span className="text-red-500">*</span>
                                    </Label>
                                    <div className="relative">
                                        <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            id="overtime_date"
                                            type="date"
                                            value={data.overtime_date}
                                            onChange={(e) => setData('overtime_date', e.target.value)}
                                            className={`pl-10 ${errors.overtime_date ? 'border-red-500' : ''}`}
                                        />
                                    </div>
                                    {errors.overtime_date && (
                                        <p className="text-sm text-red-500">{errors.overtime_date}</p>
                                    )}
                                </div>

                                {/* Duration */}
                                <div className="space-y-2">
                                    <Label>
                                        Duration <span className="text-red-500">*</span>
                                    </Label>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="duration_hours" className="text-sm text-muted-foreground">
                                                Hours
                                            </Label>
                                            <div className="relative">
                                                <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                <Input
                                                    id="duration_hours"
                                                    type="number"
                                                    min="0"
                                                    max="24"
                                                    value={data.duration_hours}
                                                    onChange={(e) => setData('duration_hours', e.target.value)}
                                                    className={`pl-10 ${errors.duration_hours ? 'border-red-500' : ''}`}
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="duration_minutes" className="text-sm text-muted-foreground">
                                                Minutes
                                            </Label>
                                            <div className="relative">
                                                <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                <Input
                                                    id="duration_minutes"
                                                    type="number"
                                                    min="0"
                                                    max="59"
                                                    value={data.duration_minutes}
                                                    onChange={(e) => setData('duration_minutes', e.target.value)}
                                                    className={`pl-10 ${errors.duration_minutes ? 'border-red-500' : ''}`}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    {(errors.duration_hours || errors.duration_minutes) && (
                                        <p className="text-sm text-red-500">
                                            {errors.duration_hours || errors.duration_minutes}
                                        </p>
                                    )}
                                    {getTotalDuration() === 0 && (
                                        <Alert>
                                            <AlertCircle className="h-4 w-4" />
                                            <AlertDescription>
                                                Duration must be at least 1 minute
                                            </AlertDescription>
                                        </Alert>
                                    )}
                                </div>

                                {/* Reason */}
                                <div className="space-y-2">
                                    <Label htmlFor="reason">
                                        Reason <span className="text-red-500">*</span>
                                    </Label>
                                    <Textarea
                                        id="reason"
                                        placeholder="Describe the reason for overtime..."
                                        value={data.reason}
                                        onChange={(e) => setData('reason', e.target.value)}
                                        rows={5}
                                        className={errors.reason ? 'border-red-500' : ''}
                                    />
                                    {errors.reason && <p className="text-sm text-red-500">{errors.reason}</p>}
                                </div>

                                {/* Document Upload */}
                                <div className="space-y-2">
                                    <Label htmlFor="document">Supporting Document (Optional)</Label>
                                    <div className="flex items-center gap-4">
                                        <Input
                                            id="document"
                                            type="file"
                                            accept=".pdf,.jpg,.jpeg,.png"
                                            onChange={handleFileChange}
                                            className={errors.document ? 'border-red-500' : ''}
                                        />
                                        {data.document && (
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => setData('document', null)}
                                            >
                                                Remove
                                            </Button>
                                        )}
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                        Accepted formats: PDF, JPG, PNG (Max 10MB)
                                    </p>
                                    {errors.document && <p className="text-sm text-red-500">{errors.document}</p>}
                                    {data.document && (
                                        <div className="flex items-center gap-2 p-2 bg-muted rounded">
                                            <FileUp className="h-4 w-4" />
                                            <span className="text-sm">{data.document.name}</span>
                                            <span className="text-sm text-muted-foreground">
                                                ({(data.document.size / 1024 / 1024).toFixed(2)} MB)
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Summary Sidebar */}
                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Request Summary</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {selectedEmployee ? (
                                    <>
                                        <div>
                                            <h3 className="text-sm font-medium text-muted-foreground">Employee</h3>
                                            <p className="text-lg font-semibold">{selectedEmployee.name}</p>
                                            <p className="text-sm text-muted-foreground">
                                                ID: #{selectedEmployee.id_number}
                                            </p>
                                            <p className="text-sm text-muted-foreground">
                                                {selectedEmployee.department}
                                            </p>
                                        </div>
                                        <div className="border-t pt-4">
                                            <h3 className="text-sm font-medium text-muted-foreground mb-2">
                                                Overtime Date
                                            </h3>
                                            <p className="font-semibold">
                                                {data.overtime_date
                                                    ? new Date(data.overtime_date).toLocaleDateString('en-US', {
                                                          weekday: 'long',
                                                          year: 'numeric',
                                                          month: 'long',
                                                          day: 'numeric',
                                                      })
                                                    : 'Not selected'}
                                            </p>
                                        </div>
                                        <div className="border-t pt-4">
                                            <h3 className="text-sm font-medium text-muted-foreground mb-2">
                                                Total Duration
                                            </h3>
                                            <p className="text-2xl font-bold">{getFormattedDuration()}</p>
                                            <p className="text-sm text-muted-foreground">
                                                {getTotalDuration()} minutes
                                            </p>
                                        </div>
                                        <div className="border-t pt-4">
                                            <h3 className="text-sm font-medium text-muted-foreground mb-2">
                                                Supporting Document
                                            </h3>
                                            <p className={data.document ? 'text-green-600 font-medium' : 'text-muted-foreground'}>
                                                {data.document ? '✓ Attached' : 'Not attached'}
                                            </p>
                                        </div>
                                    </>
                                ) : (
                                    <Alert>
                                        <AlertCircle className="h-4 w-4" />
                                        <AlertDescription>
                                            Select an employee to view request summary
                                        </AlertDescription>
                                    </Alert>
                                )}
                            </CardContent>
                        </Card>

                        <Card className="bg-muted/50">
                            <CardContent className="pt-6">
                                <Button type="submit" className="w-full" disabled={processing || getTotalDuration() === 0}>
                                    {processing ? (
                                        <>Processing...</>
                                    ) : (
                                        <>
                                            <Save className="h-4 w-4 mr-2" />
                                            Submit Request
                                        </>
                                    )}
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
