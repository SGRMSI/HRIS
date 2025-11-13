import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem, PageProps } from '@/types';
import { PayrollPeriod, PayrollRecord } from '@/types/payroll';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { format } from 'date-fns';
import { ArrowLeft, Calculator, Save } from 'lucide-react';
import { FormEventHandler } from 'react';

interface Props extends PageProps {
    period: PayrollPeriod;
    record: PayrollRecord & {
        employee: {
            employee_id: number;
            id_number: string;
            first_name: string;
            middle_name?: string;
            last_name: string;
            full_name: string;
            company?: { name: string };
            department?: { name: string };
            position?: { title: string };
        };
    };
}

export default function Edit({ period, record }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Payroll',
            href: '/payroll',
        },
        {
            title: period.period_name,
            href: `/payroll/${period.period_id}`,
        },
        {
            title: `Edit ${record.employee.full_name}`,
            href: `/payroll/${period.period_id}/records/${record.payroll_id}/edit`,
        },
    ];

    const { data, setData, put, processing, errors } = useForm({
        days_worked: record.days_worked || 0,
        daily_rate: record.daily_rate || 0,
        rate_15th: record.rate_15th || 0,
        rate_30th: record.rate_30th || 0,
        clothing_allowance: record.clothing_allowance || 0,
        rice_allowance: record.rice_allowance || 0,
        transportation_allowance: record.transportation_allowance || 0,
        program_allowance: record.program_allowance || 0,
        attendance_incentive: record.attendance_incentive || 0,
        adjustments: record.adjustments || 0,
        sss_contribution: record.sss_contribution || 0,
        phic_contribution: record.phic_contribution || 0,
        hdmf_contribution: record.hdmf_contribution || 0,
        remarks: record.remarks || '',
    });

    const handleSubmit: FormEventHandler = (e) => {
        e.preventDefault();
        put(route('payroll.records.update', [period.period_id, record.payroll_id]));
    };

    const handleRecalculate = () => {
        if (confirm('This will recalculate the payroll based on attendance. Continue?')) {
            router.post(route('payroll.records.recalculate', [period.period_id, record.payroll_id]));
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-PH', {
            style: 'currency',
            currency: 'PHP',
        }).format(amount || 0);
    };

    // Calculate totals
    const totalEarnings =
        Number(data.rate_15th) +
        Number(data.rate_30th) +
        Number(data.clothing_allowance) +
        Number(data.rice_allowance) +
        Number(data.transportation_allowance) +
        Number(data.program_allowance) +
        Number(data.attendance_incentive) +
        Number(data.adjustments);

    const totalDeductions = Number(data.sss_contribution) + Number(data.phic_contribution) + Number(data.hdmf_contribution);

    const grossPay = totalEarnings;
    const netPay = grossPay - totalDeductions;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Edit Payroll - ${record.employee.full_name}`} />

            <div className="p-6">
                <div className="mb-6 flex items-center justify-between">
                    <Button variant="ghost" size="sm" asChild>
                        <Link href={route('payroll.show', period.period_id)}>
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Payroll
                        </Link>
                    </Button>
                    {period.status === 'draft' && (
                        <Button variant="outline" onClick={handleRecalculate}>
                            <Calculator className="mr-2 h-4 w-4" />
                            Recalculate from Attendance
                        </Button>
                    )}
                </div>

                <div className="mx-auto max-w-4xl">
                    {/* Employee Info */}
                    <Card className="mb-6">
                        <CardHeader>
                            <CardTitle>{record.employee.full_name}</CardTitle>
                            <CardDescription>
                                {record.employee.id_number} • {record.employee.company?.name} • {record.employee.position?.title}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <span className="text-muted-foreground">Period:</span> <span className="font-medium">{period.period_name}</span>
                                </div>
                                <div>
                                    <span className="text-muted-foreground">Payment Date:</span>{' '}
                                    <span className="font-medium">
                                        {period.payment_date ? format(new Date(period.payment_date), 'MMM d, yyyy') : 'Not set'}
                                    </span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Basic Earnings */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Basic Earnings</CardTitle>
                                <CardDescription>Daily Rate × Days Worked = Rate 15th/30th</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="daily_rate">Daily Rate</Label>
                                        <Input
                                            id="daily_rate"
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            value={data.daily_rate}
                                            onChange={(e) => {
                                                const rate = parseFloat(e.target.value) || 0;
                                                setData('daily_rate', rate);
                                                const calculated = rate * Number(data.days_worked);
                                                setData('rate_15th', calculated);
                                                setData('rate_30th', calculated);
                                            }}
                                            disabled={period.status !== 'draft'}
                                            className={errors.daily_rate ? 'border-red-500' : ''}
                                        />
                                        {errors.daily_rate && <p className="text-sm text-red-500">{errors.daily_rate}</p>}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="days_worked">Days Worked</Label>
                                        <Input
                                            id="days_worked"
                                            type="number"
                                            step="0.5"
                                            min="0"
                                            value={data.days_worked}
                                            onChange={(e) => {
                                                const days = parseFloat(e.target.value) || 0;
                                                setData('days_worked', days);
                                                const calculated = Number(data.daily_rate) * days;
                                                setData('rate_15th', calculated);
                                                setData('rate_30th', calculated);
                                            }}
                                            disabled={period.status !== 'draft'}
                                            className={errors.days_worked ? 'border-red-500' : ''}
                                        />
                                        {errors.days_worked && <p className="text-sm text-red-500">{errors.days_worked}</p>}
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Calculated Rate</Label>
                                        <div className="flex h-10 items-center rounded-md border bg-muted px-3 text-sm font-medium">
                                            {formatCurrency(Number(data.daily_rate) * Number(data.days_worked))}
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="rate_15th">Rate 15th</Label>
                                        <Input
                                            id="rate_15th"
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            value={data.rate_15th}
                                            onChange={(e) => setData('rate_15th', parseFloat(e.target.value) || 0)}
                                            disabled={period.status !== 'draft'}
                                            className={errors.rate_15th ? 'border-red-500' : ''}
                                        />
                                        {errors.rate_15th && <p className="text-sm text-red-500">{errors.rate_15th}</p>}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="rate_30th">Rate 30th</Label>
                                        <Input
                                            id="rate_30th"
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            value={data.rate_30th}
                                            onChange={(e) => setData('rate_30th', parseFloat(e.target.value) || 0)}
                                            disabled={period.status !== 'draft'}
                                            className={errors.rate_30th ? 'border-red-500' : ''}
                                        />
                                        {errors.rate_30th && <p className="text-sm text-red-500">{errors.rate_30th}</p>}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Allowances */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Allowances</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="clothing_allowance">Clothing Allowance</Label>
                                        <Input
                                            id="clothing_allowance"
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            value={data.clothing_allowance}
                                            onChange={(e) => setData('clothing_allowance', parseFloat(e.target.value) || 0)}
                                            disabled={period.status !== 'draft'}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="rice_allowance">Rice Allowance</Label>
                                        <Input
                                            id="rice_allowance"
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            value={data.rice_allowance}
                                            onChange={(e) => setData('rice_allowance', parseFloat(e.target.value) || 0)}
                                            disabled={period.status !== 'draft'}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="transportation_allowance">Transportation Allowance</Label>
                                        <Input
                                            id="transportation_allowance"
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            value={data.transportation_allowance}
                                            onChange={(e) => setData('transportation_allowance', parseFloat(e.target.value) || 0)}
                                            disabled={period.status !== 'draft'}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="program_allowance">Program Allowance</Label>
                                        <Input
                                            id="program_allowance"
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            value={data.program_allowance}
                                            onChange={(e) => setData('program_allowance', parseFloat(e.target.value) || 0)}
                                            disabled={period.status !== 'draft'}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="attendance_incentive">Attendance Incentive</Label>
                                        <Input
                                            id="attendance_incentive"
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            value={data.attendance_incentive}
                                            onChange={(e) => setData('attendance_incentive', parseFloat(e.target.value) || 0)}
                                            disabled={period.status !== 'draft'}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="adjustments">Adjustments</Label>
                                        <Input
                                            id="adjustments"
                                            type="number"
                                            step="0.01"
                                            value={data.adjustments}
                                            onChange={(e) => setData('adjustments', parseFloat(e.target.value) || 0)}
                                            disabled={period.status !== 'draft'}
                                        />
                                        <p className="text-xs text-muted-foreground">Positive or negative amount</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Deductions */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Deductions</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="sss_contribution">SSS Contribution</Label>
                                        <Input
                                            id="sss_contribution"
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            value={data.sss_contribution}
                                            onChange={(e) => setData('sss_contribution', parseFloat(e.target.value) || 0)}
                                            disabled={period.status !== 'draft'}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="phic_contribution">PhilHealth</Label>
                                        <Input
                                            id="phic_contribution"
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            value={data.phic_contribution}
                                            onChange={(e) => setData('phic_contribution', parseFloat(e.target.value) || 0)}
                                            disabled={period.status !== 'draft'}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="hdmf_contribution">Pag-IBIG</Label>
                                        <Input
                                            id="hdmf_contribution"
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            value={data.hdmf_contribution}
                                            onChange={(e) => setData('hdmf_contribution', parseFloat(e.target.value) || 0)}
                                            disabled={period.status !== 'draft'}
                                        />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Summary */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Payroll Summary</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    <div className="flex justify-between border-b pb-2">
                                        <span className="text-muted-foreground">Total Earnings:</span>
                                        <span className="font-medium">{formatCurrency(totalEarnings)}</span>
                                    </div>
                                    <div className="flex justify-between border-b pb-2">
                                        <span className="text-muted-foreground">Gross Pay:</span>
                                        <span className="font-medium">{formatCurrency(grossPay)}</span>
                                    </div>
                                    <div className="flex justify-between border-b pb-2">
                                        <span className="text-muted-foreground">Total Deductions:</span>
                                        <span className="font-medium text-red-600">{formatCurrency(totalDeductions)}</span>
                                    </div>
                                    <div className="flex justify-between pt-2">
                                        <span className="text-lg font-semibold">Net Pay:</span>
                                        <span className="text-lg font-bold text-green-600">{formatCurrency(netPay)}</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Remarks */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Remarks</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Textarea
                                    id="remarks"
                                    value={data.remarks}
                                    onChange={(e) => setData('remarks', e.target.value)}
                                    placeholder="Add any notes or remarks..."
                                    rows={3}
                                    disabled={period.status !== 'draft'}
                                />
                            </CardContent>
                        </Card>

                        {/* Actions */}
                        {period.status === 'draft' && (
                            <div className="flex justify-end gap-4">
                                <Button type="button" variant="outline" asChild>
                                    <Link href={route('payroll.show', period.period_id)}>Cancel</Link>
                                </Button>
                                <Button type="submit" disabled={processing}>
                                    <Save className="mr-2 h-4 w-4" />
                                    {processing ? 'Saving...' : 'Save Changes'}
                                </Button>
                            </div>
                        )}
                    </form>
                </div>
            </div>
        </AppLayout>
    );
}
