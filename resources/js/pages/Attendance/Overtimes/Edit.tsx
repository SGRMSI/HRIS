import React, { FormEventHandler, useState, useEffect } from 'react';
import AppLayout from '@/layouts/app-layout';
import { Head, router, useForm } from '@inertiajs/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, Calendar, Clock, FileText, Upload, X, AlertCircle } from 'lucide-react';

interface Employee {
    employee_id: number;
    first_name: string;
    last_name: string;
    id_number: string;
    department: {
        department_id: number;
        department_name: string;
    } | null;
    company: {
        company_id: number;
        company_name: string;
    } | null;
}

interface Overtime {
    overtime_id: number;
    employee_id: number;
    overtime_date: string;
    duration_hours: number;
    duration_minutes: number;
    reason: string;
    document_path: string | null;
    employee: Employee;
}

interface Props {
    overtime: Overtime;
}

interface OvertimeFormData {
    overtime_date: string;
    duration_hours: number;
    duration_minutes: number;
    reason: string;
    document: File | null;
    remove_document: boolean;
}

export default function Edit({ overtime }: Props) {
    const { data, setData, post, processing, errors } = useForm({
        overtime_date: overtime.overtime_date,
        duration_hours: overtime.duration_hours,
        duration_minutes: overtime.duration_minutes,
        reason: overtime.reason,
        document: null as File | null,
        remove_document: false as boolean,
        _method: 'PUT' as const,
    });

    const [totalDuration, setTotalDuration] = useState({
        hours: overtime.duration_hours,
        minutes: overtime.duration_minutes,
        total: overtime.duration_hours * 60 + overtime.duration_minutes,
    });

    const [documentPreview, setDocumentPreview] = useState<{
        name: string;
        size: string;
    } | null>(null);

    useEffect(() => {
        const total = data.duration_hours * 60 + data.duration_minutes;
        setTotalDuration({
            hours: data.duration_hours,
            minutes: data.duration_minutes,
            total,
        });
    }, [data.duration_hours, data.duration_minutes]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setData('document', file);
            setData('remove_document', false);
            setDocumentPreview({
                name: file.name,
                size: (file.size / 1024 / 1024).toFixed(2),
            });
        }
    };

    const handleRemoveFile = () => {
        setData('document', null);
        setDocumentPreview(null);
        const fileInput = document.getElementById('document') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
    };

    const handleRemoveExistingDocument = () => {
        setData('remove_document', true);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    const formatDuration = (hours: number, minutes: number) => {
        const parts = [];
        if (hours > 0) parts.push(`${hours}h`);
        if (minutes > 0) parts.push(`${minutes}m`);
        return parts.length > 0 ? parts.join(' ') : '0m';
    };

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('attendance.overtimes.update', overtime.overtime_id), {
            forceFormData: true,
            onSuccess: () => {
                // Redirect handled by controller
            },
        });
    };

    const isValidDuration = totalDuration.total > 0;

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Attendance', href: '/attendance/upload' },
                { title: 'Overtimes', href: '/attendance/overtimes' },
                { title: 'Edit', href: '#' },
            ]}
        >
            <Head title="Edit Overtime" />

            <div className="space-y-6 p-6 md:p-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => router.visit(route('attendance.overtimes.show', overtime.overtime_id))}
                        >
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                        <div>
                            <h1 className="text-3xl font-bold">Edit Overtime Request</h1>
                            <p className="text-muted-foreground mt-1">
                                Update overtime details for {overtime.employee.first_name} {overtime.employee.last_name}
                            </p>
                        </div>
                    </div>
                </div>

            <div className="py-12">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                        {/* Main Form */}
                        <div className="lg:col-span-2">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Overtime Information</CardTitle>
                                    <CardDescription>
                                        Update the overtime request details
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <form onSubmit={submit} className="space-y-6">
                                        {/* Employee Display (Read-only) */}
                                        <div className="space-y-2">
                                            <Label>Employee</Label>
                                            <div className="rounded-md border bg-muted p-3">
                                                <p className="font-medium">
                                                    {overtime.employee.first_name} {overtime.employee.last_name}
                                                </p>
                                                <p className="text-sm text-muted-foreground">
                                                    {overtime.employee.department?.department_name} • ID: {overtime.employee.id_number}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Overtime Date */}
                                        <div className="space-y-2">
                                            <Label htmlFor="overtime_date">
                                                Overtime Date <span className="text-red-500">*</span>
                                            </Label>
                                            <div className="relative">
                                                <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                                <Input
                                                    id="overtime_date"
                                                    type="date"
                                                    className="pl-10"
                                                    value={data.overtime_date}
                                                    onChange={(e) => setData('overtime_date', e.target.value)}
                                                    required
                                                />
                                            </div>
                                            {errors.overtime_date && (
                                                <p className="text-sm text-red-600">{errors.overtime_date}</p>
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
                                                        <Clock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                                        <Input
                                                            id="duration_hours"
                                                            type="number"
                                                            min="0"
                                                            max="24"
                                                            className="pl-10"
                                                            value={data.duration_hours}
                                                            onChange={(e) =>
                                                                setData('duration_hours', parseInt(e.target.value) || 0)
                                                            }
                                                            required
                                                        />
                                                    </div>
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="duration_minutes" className="text-sm text-muted-foreground">
                                                        Minutes
                                                    </Label>
                                                    <div className="relative">
                                                        <Clock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                                        <Input
                                                            id="duration_minutes"
                                                            type="number"
                                                            min="0"
                                                            max="59"
                                                            className="pl-10"
                                                            value={data.duration_minutes}
                                                            onChange={(e) =>
                                                                setData('duration_minutes', parseInt(e.target.value) || 0)
                                                            }
                                                            required
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                            {!isValidDuration && (
                                                <Alert variant="destructive">
                                                    <AlertCircle className="h-4 w-4" />
                                                    <AlertDescription>
                                                        Total duration must be at least 1 minute
                                                    </AlertDescription>
                                                </Alert>
                                            )}
                                            {errors.duration_hours && (
                                                <p className="text-sm text-red-600">{errors.duration_hours}</p>
                                            )}
                                            {errors.duration_minutes && (
                                                <p className="text-sm text-red-600">{errors.duration_minutes}</p>
                                            )}
                                        </div>

                                        {/* Reason */}
                                        <div className="space-y-2">
                                            <Label htmlFor="reason">
                                                Reason <span className="text-red-500">*</span>
                                            </Label>
                                            <Textarea
                                                id="reason"
                                                rows={4}
                                                placeholder="Explain the reason for overtime..."
                                                value={data.reason}
                                                onChange={(e) => setData('reason', e.target.value)}
                                                required
                                                maxLength={1000}
                                            />
                                            <p className="text-xs text-muted-foreground">
                                                {data.reason.length}/1000 characters
                                            </p>
                                            {errors.reason && (
                                                <p className="text-sm text-red-600">{errors.reason}</p>
                                            )}
                                        </div>

                                        {/* Current Document */}
                                        {overtime.document_path && !data.remove_document && (
                                            <div className="space-y-2">
                                                <Label>Current Document</Label>
                                                <div className="flex items-center justify-between rounded-md border p-3">
                                                    <div className="flex items-center gap-2">
                                                        <FileText className="h-4 w-4 text-muted-foreground" />
                                                        <span className="text-sm">Document attached</span>
                                                    </div>
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={handleRemoveExistingDocument}
                                                    >
                                                        <X className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        )}

                                        {/* New Document Upload */}
                                        <div className="space-y-2">
                                            <Label htmlFor="document">
                                                {overtime.document_path && !data.remove_document
                                                    ? 'Replace Document (Optional)'
                                                    : 'Upload Document (Optional)'}
                                            </Label>
                                            <div className="space-y-2">
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
                                                    >
                                                        <Upload className="mr-2 h-4 w-4" />
                                                        Choose File
                                                    </Button>
                                                    {documentPreview && (
                                                        <div className="flex flex-1 items-center justify-between rounded-md border px-3 py-2">
                                                            <div className="flex items-center gap-2">
                                                                <FileText className="h-4 w-4 text-muted-foreground" />
                                                                <div>
                                                                    <p className="text-sm font-medium">
                                                                        {documentPreview.name}
                                                                    </p>
                                                                    <p className="text-xs text-muted-foreground">
                                                                        {documentPreview.size} MB
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={handleRemoveFile}
                                                            >
                                                                <X className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    )}
                                                </div>
                                                <p className="text-xs text-muted-foreground">
                                                    Accepted formats: PDF, JPG, PNG. Max size: 10MB
                                                </p>
                                            </div>
                                            {errors.document && (
                                                <p className="text-sm text-red-600">{errors.document}</p>
                                            )}
                                        </div>

                                        {/* Submit Buttons */}
                                        <div className="flex gap-2">
                                            <Button
                                                type="submit"
                                                disabled={processing || !isValidDuration}
                                            >
                                                {processing ? 'Updating...' : 'Update Overtime'}
                                            </Button>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={() => router.visit(route('attendance.overtimes.show', overtime.overtime_id))}
                                            >
                                                Cancel
                                            </Button>
                                        </div>
                                    </form>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Summary Sidebar */}
                        <div className="lg:col-span-1">
                            <Card className="sticky top-6">
                                <CardHeader>
                                    <CardTitle className="text-lg">Summary</CardTitle>
                                    <CardDescription>Review changes before updating</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {/* Employee Info */}
                                    <div>
                                        <Label className="text-xs text-muted-foreground">Employee</Label>
                                        <p className="mt-1 font-medium">
                                            {overtime.employee.first_name} {overtime.employee.last_name}
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                            ID: {overtime.employee.id_number}
                                        </p>
                                        {overtime.employee.department && (
                                            <p className="text-sm text-muted-foreground">
                                                {overtime.employee.department.department_name}
                                            </p>
                                        )}
                                    </div>

                                    {/* Date */}
                                    <div>
                                        <Label className="text-xs text-muted-foreground">Overtime Date</Label>
                                        <p className="mt-1 text-sm">
                                            {data.overtime_date ? formatDate(data.overtime_date) : '-'}
                                        </p>
                                    </div>

                                    {/* Duration */}
                                    <div>
                                        <Label className="text-xs text-muted-foreground">Duration</Label>
                                        <p className="mt-1 text-lg font-semibold">
                                            {formatDuration(totalDuration.hours, totalDuration.minutes)}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {totalDuration.total} total minutes
                                        </p>
                                    </div>

                                    {/* Document Status */}
                                    <div>
                                        <Label className="text-xs text-muted-foreground">Document</Label>
                                        <p className="mt-1 text-sm">
                                            {data.document
                                                ? `New: ${documentPreview?.name}`
                                                : overtime.document_path && !data.remove_document
                                                ? 'Existing document'
                                                : 'No document'}
                                        </p>
                                    </div>

                                    {/* Changes Indicator */}
                                    <div className="rounded-md bg-blue-50 p-3">
                                        <p className="text-sm font-medium text-blue-900">
                                            Review your changes
                                        </p>
                                        <p className="mt-1 text-xs text-blue-700">
                                            Make sure all information is correct before updating
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </div>
            </div>
        </AppLayout>
    );
}
