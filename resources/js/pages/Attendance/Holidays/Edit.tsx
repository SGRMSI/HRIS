import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { Head, Link, useForm } from '@inertiajs/react';
import { AlertCircle, Calendar, Save, X } from 'lucide-react';
import { FormEventHandler } from 'react';

interface Company {
    id: number;
    name: string;
}

interface TypeOption {
    value: string;
    label: string;
}

interface Holiday {
    id: number;
    name: string;
    date: string;
    type: string;
    is_double_pay: boolean;
    company_id: number | null;
    company: {
        id: number;
        name: string;
    } | null;
}

interface Props {
    holiday: Holiday;
    companies: Company[];
    types: TypeOption[];
}

export default function HolidaysEdit({ holiday, companies = [], types = [] }: Props) {
    const { data, setData, put, processing, errors } = useForm({
        name: holiday.name,
        date: holiday.date,
        type: holiday.type,
        company_id: holiday.company_id?.toString() || '',
        is_double_pay: holiday.is_double_pay || false,
        description: '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        put(route('attendance.holidays.update', holiday.id));
    };

    const selectedType = types.find((t) => t.value === data.type);

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Attendance', href: '/attendance/upload' },
                { title: 'Holidays', href: '/attendance/holidays' },
                { title: 'Edit', href: '#' },
            ]}
        >
            <Head title="Edit Holiday" />

            <div className="space-y-6 p-6 md:p-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold">Edit Holiday</h1>
                        <p className="mt-1 text-muted-foreground">Update holiday information</p>
                    </div>
                    <Link href={route('attendance.holidays.index')}>
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
                                    <CardTitle>Holiday Information</CardTitle>
                                    <CardDescription>Update the details for this holiday</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    {/* Holiday Name */}
                                    <div className="space-y-2">
                                        <Label htmlFor="name">Holiday Name *</Label>
                                        <Input
                                            id="name"
                                            value={data.name}
                                            onChange={(e) => setData('name', e.target.value)}
                                            className={errors.name ? 'border-red-500' : ''}
                                            placeholder="e.g., New Year's Day"
                                        />
                                        {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
                                    </div>

                                    {/* Date */}
                                    <div className="space-y-2">
                                        <Label htmlFor="date">Date *</Label>
                                        <Input
                                            id="date"
                                            type="date"
                                            value={data.date}
                                            onChange={(e) => setData('date', e.target.value)}
                                            className={errors.date ? 'border-red-500' : ''}
                                        />
                                        {errors.date && <p className="text-sm text-red-500">{errors.date}</p>}
                                    </div>

                                    {/* Type */}
                                    <div className="space-y-2">
                                        <Label htmlFor="type">Holiday Type *</Label>
                                        <Select value={data.type} onValueChange={(value) => setData('type', value)}>
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
                                        {errors.type && <p className="text-sm text-red-500">{errors.type}</p>}
                                    </div>

                                    {/* Company (required if type is company) */}
                                    {data.type === 'company' && (
                                        <div className="space-y-2">
                                            <Label htmlFor="company_id">Company *</Label>
                                            <Select value={data.company_id} onValueChange={(value) => setData('company_id', value)}>
                                                <SelectTrigger className={errors.company_id ? 'border-red-500' : ''}>
                                                    <SelectValue placeholder="Select company" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {Array.isArray(companies) &&
                                                        companies
                                                            .filter((company) => company && company.id != null)
                                                            .map((company) => (
                                                                <SelectItem key={company.id} value={company.id.toString()}>
                                                                    {company.name}
                                                                </SelectItem>
                                                            ))}
                                                </SelectContent>
                                            </Select>
                                            {errors.company_id && <p className="text-sm text-red-500">{errors.company_id}</p>}
                                        </div>
                                    )}

                                    {/* Double Pay Checkbox */}
                                    <div className="flex items-center space-x-2">
                                        <input
                                            type="checkbox"
                                            id="is_double_pay"
                                            checked={data.is_double_pay}
                                            onChange={(e) => setData('is_double_pay', e.target.checked)}
                                            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                        />
                                        <Label htmlFor="is_double_pay" className="cursor-pointer">
                                            Double Pay Holiday
                                            <span className="ml-2 text-xs text-muted-foreground">
                                                (Pay will be 2x daily rate if employee works on this day)
                                            </span>
                                        </Label>
                                    </div>

                                    {/* Description */}
                                    <div className="space-y-2">
                                        <Label htmlFor="description">Description (Optional)</Label>
                                        <Textarea
                                            id="description"
                                            value={data.description}
                                            onChange={(e) => setData('description', e.target.value)}
                                            placeholder="Additional information about this holiday..."
                                            rows={3}
                                        />
                                        {errors.description && <p className="text-sm text-red-500">{errors.description}</p>}
                                    </div>

                                    {/* Submit Button */}
                                    <div className="flex justify-end gap-3 pt-4">
                                        <Link href={route('attendance.holidays.index')}>
                                            <Button type="button" variant="outline">
                                                Cancel
                                            </Button>
                                        </Link>
                                        <Button type="submit" disabled={processing}>
                                            <Save className="mr-2 h-4 w-4" />
                                            {processing ? 'Updating...' : 'Update Holiday'}
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Summary Sidebar */}
                        <div className="space-y-4">
                            {data.name && data.date && selectedType && (
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2 text-base">
                                            <Calendar className="h-4 w-4" />
                                            Holiday Summary
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                        <div>
                                            <div className="text-sm text-muted-foreground">Name</div>
                                            <div className="font-medium">{data.name}</div>
                                        </div>

                                        <div className="border-t pt-3">
                                            <div className="text-sm text-muted-foreground">Date</div>
                                            <div className="font-medium">
                                                {new Date(data.date).toLocaleDateString('en-US', {
                                                    weekday: 'long',
                                                    year: 'numeric',
                                                    month: 'long',
                                                    day: 'numeric',
                                                })}
                                            </div>
                                        </div>

                                        <div className="border-t pt-3">
                                            <div className="text-sm text-muted-foreground">Type</div>
                                            <div className="font-medium">{selectedType.label}</div>
                                        </div>

                                        {data.type === 'company' && data.company_id && (
                                            <div className="border-t pt-3">
                                                <div className="text-sm text-muted-foreground">Company</div>
                                                <div className="font-medium">
                                                    {companies.find((c) => c.id.toString() === data.company_id)?.name || 'N/A'}
                                                </div>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            )}

                            <Alert>
                                <AlertCircle className="h-4 w-4" />
                                <AlertDescription>
                                    <strong>Note</strong>
                                    <ul className="mt-2 list-inside list-disc space-y-1 text-sm">
                                        <li>Changes affect all future attendance calculations</li>
                                        <li>Duplicate holidays will be rejected</li>
                                        <li>Company-specific holidays require company selection</li>
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
