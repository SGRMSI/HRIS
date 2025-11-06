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
import { AlertCircle, Save, X, Calendar, Upload as UploadIcon, FileText } from 'lucide-react';
import { FormEventHandler, useState } from 'react';

interface Employee {
    id: number;
    name: string;
    employee_number: string;
    department: string;
}

interface TypeOption {
    value: string;
    label: string;
}

interface Props {
    employees: Employee[];
    types: TypeOption[];
}

export default function LeavesCreate({ employees = [], types = [] }: Props) {
    const { data, setData, post, processing, errors } = useForm({
        employee_id: '',
        type: '',
        date_from: '',
        date_to: '',
        remarks: '',
        document: null as File | null,
    });

    const [fileName, setFileName] = useState<string>('');

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('attendance.leaves.store'));
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setData('document', file);
            setFileName(file.name);
        }
    };

    const selectedEmployee = employees.find(emp => emp.id && emp.id.toString() === data.employee_id);
    const selectedType = types.find(t => t.value === data.type);

    const calculateDuration = () => {
        if (!data.date_from || !data.date_to) return 0;
        const from = new Date(data.date_from);
        const to = new Date(data.date_to);
        const diffTime = Math.abs(to.getTime() - from.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays + 1;
    };

    const duration = calculateDuration();

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Attendance', href: '/attendance/upload' },
                { title: 'Leaves', href: '/attendance/leaves' },
                { title: 'Create', href: '#' },
            ]}
        >
            <Head title="Create Leave Request" />

            <div className="space-y-6 p-6 md:p-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold">Create Leave Request</h1>
                        <p className="text-muted-foreground mt-1">Submit a new leave request</p>
                    </div>
                    <Link href={route('attendance.leaves.index')}>
                        <Button variant="outline">
                            <X className="mr-2 h-4 w-4" />
                            Cancel
                        </Button>
                    </Link>
                </div>

                <form onSubmit={submit}>
                    <div className="grid gap-6 md:grid-cols-3">
                        {/* Main Form */}
                        <div className="md:col-span-2">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Leave Request Details</CardTitle>
                                    <CardDescription>Fill in the leave request information</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    {/* Employee Selection */}
                                    <div className="space-y-2">
                                        <Label htmlFor="employee_id">Employee *</Label>
                                        <Select
                                            value={data.employee_id}
                                            onValueChange={(value) => setData('employee_id', value)}
                                        >
                                            <SelectTrigger className={errors.employee_id ? 'border-red-500' : ''}>
                                                <SelectValue placeholder="Select employee" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {Array.isArray(employees) && employees
                                                    .filter(emp => emp && emp.id != null)
                                                    .map((emp) => (
                                                        <SelectItem key={emp.id} value={emp.id.toString()}>
                                                            {emp.name} - {emp.department} (#{emp.employee_number})
                                                        </SelectItem>
                                                    ))}
                                            </SelectContent>
                                        </Select>
                                        {errors.employee_id && (
                                            <p className="text-sm text-red-500">{errors.employee_id}</p>
                                        )}
                                    </div>

                                    {/* Leave Type */}
                                    <div className="space-y-2">
                                        <Label htmlFor="type">Leave Type *</Label>
                                        <Select
                                            value={data.type}
                                            onValueChange={(value) => setData('type', value)}
                                        >
                                            <SelectTrigger className={errors.type ? 'border-red-500' : ''}>
                                                <SelectValue placeholder="Select type" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {types.map((type) => (
                                                    <SelectItem key={type.value} value={type.value}>
                                                        {type.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {errors.type && (
                                            <p className="text-sm text-red-500">{errors.type}</p>
                                        )}
                                    </div>

                                    {/* Date Range */}
                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <div className="space-y-2">
                                            <Label htmlFor="date_from">From Date *</Label>
                                            <Input
                                                id="date_from"
                                                type="date"
                                                value={data.date_from}
                                                onChange={(e) => setData('date_from', e.target.value)}
                                                className={errors.date_from ? 'border-red-500' : ''}
                                                min={new Date().toISOString().split('T')[0]}
                                            />
                                            {errors.date_from && (
                                                <p className="text-sm text-red-500">{errors.date_from}</p>
                                            )}
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="date_to">To Date *</Label>
                                            <Input
                                                id="date_to"
                                                type="date"
                                                value={data.date_to}
                                                onChange={(e) => setData('date_to', e.target.value)}
                                                className={errors.date_to ? 'border-red-500' : ''}
                                                min={data.date_from || new Date().toISOString().split('T')[0]}
                                            />
                                            {errors.date_to && (
                                                <p className="text-sm text-red-500">{errors.date_to}</p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Remarks */}
                                    <div className="space-y-2">
                                        <Label htmlFor="remarks">Remarks (Optional)</Label>
                                        <Textarea
                                            id="remarks"
                                            value={data.remarks}
                                            onChange={(e) => setData('remarks', e.target.value)}
                                            placeholder="Provide additional details about your leave..."
                                            rows={4}
                                        />
                                        {errors.remarks && (
                                            <p className="text-sm text-red-500">{errors.remarks}</p>
                                        )}
                                    </div>

                                    {/* Document Upload */}
                                    <div className="space-y-2">
                                        <Label htmlFor="document">Supporting Document (Optional)</Label>
                                        <div className="flex items-center gap-2">
                                            <Input
                                                id="document"
                                                type="file"
                                                accept=".pdf,.jpg,.jpeg,.png"
                                                onChange={handleFileChange}
                                                className="hidden"
                                            />
                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={() => document.getElementById('document')?.click()}
                                                className="flex-1"
                                            >
                                                <UploadIcon className="mr-2 h-4 w-4" />
                                                {fileName || 'Choose File'}
                                            </Button>
                                            {fileName && (
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => {
                                                        setData('document', null);
                                                        setFileName('');
                                                    }}
                                                >
                                                    <X className="h-4 w-4" />
                                                </Button>
                                            )}
                                        </div>
                                        <p className="text-sm text-muted-foreground">
                                            PDF, JPG, JPEG, PNG (Max 5MB)
                                        </p>
                                        {errors.document && (
                                            <p className="text-sm text-red-500">{errors.document}</p>
                                        )}
                                    </div>

                                    {/* Submit Button */}
                                    <div className="flex justify-end gap-3 pt-4">
                                        <Link href={route('attendance.leaves.index')}>
                                            <Button type="button" variant="outline">
                                                Cancel
                                            </Button>
                                        </Link>
                                        <Button type="submit" disabled={processing}>
                                            <Save className="mr-2 h-4 w-4" />
                                            {processing ? 'Submitting...' : 'Submit Request'}
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Summary Sidebar */}
                        <div className="space-y-4">
                            {selectedEmployee && selectedType && data.date_from && data.date_to && (
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-base flex items-center gap-2">
                                            <Calendar className="h-4 w-4" />
                                            Request Summary
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                        <div>
                                            <div className="text-sm text-muted-foreground">Employee</div>
                                            <div className="font-medium">{selectedEmployee.name}</div>
                                            <div className="text-sm text-gray-500">
                                                {selectedEmployee.department}
                                            </div>
                                        </div>

                                        <div className="border-t pt-3">
                                            <div className="text-sm text-muted-foreground">Leave Type</div>
                                            <div className="font-medium">{selectedType.label}</div>
                                        </div>

                                        <div className="border-t pt-3">
                                            <div className="text-sm text-muted-foreground">Period</div>
                                            <div className="font-medium">
                                                {new Date(data.date_from).toLocaleDateString()}
                                            </div>
                                            <div className="text-sm text-gray-500">
                                                to {new Date(data.date_to).toLocaleDateString()}
                                            </div>
                                        </div>

                                        <div className="border-t pt-3">
                                            <div className="text-sm text-muted-foreground">Duration</div>
                                            <div className="font-medium text-lg">
                                                {duration} day{duration !== 1 ? 's' : ''}
                                            </div>
                                        </div>

                                        {fileName && (
                                            <div className="border-t pt-3">
                                                <div className="text-sm text-muted-foreground">Document</div>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <FileText className="h-4 w-4 text-blue-500" />
                                                    <div className="text-sm truncate">{fileName}</div>
                                                </div>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            )}

                            <Alert>
                                <AlertCircle className="h-4 w-4" />
                                <AlertDescription>
                                    <strong>Important</strong>
                                    <ul className="mt-2 list-disc list-inside text-sm space-y-1">
                                        <li>Leave requests require approval</li>
                                        <li>Check your leave balance before submitting</li>
                                        <li>Overlapping leaves will be rejected</li>
                                        <li>Upload medical certificate for sick leave (if required)</li>
                                    </ul>
                                </AlertDescription>
                            </Alert>
                        </div>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
