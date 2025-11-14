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
import { ArrowLeft, Calculator, Download, Save } from 'lucide-react';
import { FormEventHandler } from 'react';

interface Holiday {
    holiday_id: number;
    name: string;
    date: string;
    type: string;
    is_double_pay: boolean;
}

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
    holidays: Holiday[];
}

export default function Edit({ period, record, holidays }: Props) {
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
            title: `View ${record.employee?.full_name || 'Employee'}'s Payroll`,
            href: `/payroll/${period.period_id}/records/${record.payroll_id}/edit`,
        },
    ];

    const { data, setData, put, processing } = useForm({
        days_worked: Number(record.days_worked) || 0,
        daily_rate: Number(record.daily_rate) || 0,
        basic_pay: Number(record.basic_pay) || 0,
        overtime: Number(record.overtime) || 0,
        overtime_hours: Number(record.overtime_hours) || 0,
        holiday_pay: Number(record.holiday_pay) || 0,
        clothing_allowance: Number(record.clothing_allowance) || 0,
        rice_allowance: Number(record.rice_allowance) || 0,
        transportation_allowance: Number(record.transportation_allowance) || 0,
        program_allowance: Number(record.program_allowance) || 0,
        attendance_incentive: Number(record.attendance_incentive) || 0,
        adjustments: Number(record.adjustments) || 0,
        sss_contribution: Number(record.sss_contribution) || 0,
        phic_contribution: Number(record.phic_contribution) || 0,
        hdmf_contribution: Number(record.hdmf_contribution) || 0,
        late_undertime_minutes: Number(record.late_undertime_minutes) || 0,
        late_undertime_amount: Number(record.late_undertime_amount) || 0,
        remarks: (record.remarks || '') as string,
    });

    const handleSubmit: FormEventHandler = (e) => {
        e.preventDefault();
        put(route('payroll.records.update', [period.period_id, record.final_id || record.payroll_id]));
    };

    const handleRecalculate = () => {
        if (confirm('This will recalculate the payroll based on attendance and employee settings. Continue?')) {
            router.post(
                route('payroll.records.recalculate', [period.period_id, record.final_id || record.payroll_id]),
                {},
                {
                    onSuccess: () => {
                        router.reload();
                    },
                },
            );
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-PH', {
            style: 'currency',
            currency: 'PHP',
        }).format(amount || 0);
    };

    // Calculate totals
    const basicPay = Number(data.basic_pay);
    const overtime = Number(data.overtime);
    const holidayPay = Number(data.holiday_pay);
    const totalAllowances =
        Number(data.clothing_allowance) +
        Number(data.rice_allowance) +
        Number(data.transportation_allowance) +
        Number(data.program_allowance) +
        Number(data.attendance_incentive);

    const grossPay = basicPay + overtime + holidayPay + totalAllowances + Number(data.adjustments);
    const totalDeductions =
        Number(data.sss_contribution) + Number(data.phic_contribution) + Number(data.hdmf_contribution) + Number(data.late_undertime_amount);
    const netPay = grossPay - totalDeductions;

    // Calculate expected holiday pay based on double pay holidays
    const doublePayHolidays = holidays.filter((h) => h.is_double_pay);
    const expectedHolidayPay = doublePayHolidays.length * Number(data.daily_rate);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`View Payroll - ${record.employee.full_name}`} />

            <div className="p-6">
                <div className="mb-6 flex items-center justify-between">
                    <Button variant="ghost" size="sm" asChild>
                        <Link href={route('payroll.show', period.period_id)}>
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Payroll
                        </Link>
                    </Button>
                    <div className="flex gap-2">
                        {period.status === 'draft' && (
                            <Button variant="outline" onClick={handleRecalculate}>
                                <Calculator className="mr-2 h-4 w-4" />
                                Recalculate from Settings & Attendance
                            </Button>
                        )}
                        <Button variant="outline" asChild>
                            <a href={route('payroll.records.export-pdf', [period.period_id, record.payroll_id])} target="_blank">
                                <Download className="mr-2 h-4 w-4" />
                                Export Payslip (PDF)
                            </a>
                        </Button>
                    </div>
                </div>

                {period.status !== 'draft' && (
                    <div className="mx-auto mb-4 max-w-4xl rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-950">
                        <p className="text-sm text-blue-800 dark:text-blue-200">
                            <strong>View Only:</strong> This payroll record is locked and cannot be edited because the payroll period has been{' '}
                            {period.status}.
                        </p>
                    </div>
                )}

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
                                <CardDescription>
                                    Daily Rate × Days Worked = Basic Pay (Pre-filled from attendance and employee settings, editable)
                                </CardDescription>
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
                                            onChange={(e) => setData('daily_rate', e.target.value === '' ? 0 : parseFloat(e.target.value))}
                                            disabled={period.status !== 'draft'}
                                        />
                                        <p className="text-xs text-muted-foreground">From Employee Settings (editable)</p>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="days_worked">Days Worked</Label>
                                        <Input
                                            id="days_worked"
                                            type="number"
                                            step="0.5"
                                            min="0"
                                            value={data.days_worked}
                                            onChange={(e) => setData('days_worked', e.target.value === '' ? 0 : parseFloat(e.target.value))}
                                            disabled={period.status !== 'draft'}
                                        />
                                        <p className="text-xs text-muted-foreground">From Attendance Records (editable)</p>
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Basic Pay</Label>
                                        <div className="flex h-10 items-center rounded-md border bg-muted px-3 text-sm font-medium">
                                            {formatCurrency(basicPay)}
                                        </div>
                                        <p className="text-xs text-muted-foreground">Auto-calculated</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Additional Earnings */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Additional Earnings</CardTitle>
                                <CardDescription>Overtime and holiday pay from attendance</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <h4 className="mb-3 text-sm font-medium">Overtime</h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>Total Overtime Hours</Label>
                                            <div className="flex h-10 items-center rounded-md border bg-muted px-3 text-sm font-medium">
                                                {Number(data.overtime_hours).toFixed(2)} hours ({(Number(data.overtime_hours) * 60).toFixed(0)}{' '}
                                                minutes)
                                            </div>
                                            <p className="text-xs text-muted-foreground">From attendance records</p>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="overtime">Overtime Pay</Label>
                                            <Input
                                                id="overtime"
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                value={data.overtime}
                                                onChange={(e) => setData('overtime', parseFloat(e.target.value) || 0)}
                                                disabled={period.status !== 'draft'}
                                            />
                                            <p className="text-xs text-muted-foreground">Auto-calculated (editable)</p>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <h4 className="mb-3 text-sm font-medium">Holiday Pay</h4>
                                    <div className="grid grid-cols-1 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="holiday_pay">Holiday Pay</Label>
                                            <Input
                                                id="holiday_pay"
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                value={data.holiday_pay}
                                                onChange={(e) => setData('holiday_pay', parseFloat(e.target.value) || 0)}
                                                disabled={period.status !== 'draft'}
                                            />
                                            <p className="text-xs text-muted-foreground">For holidays worked (editable)</p>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Holidays in Period */}
                        {holidays.length > 0 && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>Holidays in This Period</CardTitle>
                                    <CardDescription>
                                        {doublePayHolidays.length > 0 && (
                                            <>
                                                Expected Holiday Pay: {doublePayHolidays.length} double pay holiday
                                                {doublePayHolidays.length !== 1 ? 's' : ''} × {formatCurrency(data.daily_rate)} ={' '}
                                                {formatCurrency(expectedHolidayPay)}
                                            </>
                                        )}
                                        {doublePayHolidays.length === 0 && 'No double pay holidays in this period'}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-2">
                                        {holidays.map((holiday) => (
                                            <div key={holiday.holiday_id} className="flex items-center justify-between rounded-md border p-3 text-sm">
                                                <div>
                                                    <p className="font-medium">{holiday.name}</p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {format(new Date(holiday.date), 'MMMM d, yyyy')} • {holiday.type}
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                    {holiday.is_double_pay ? (
                                                        <>
                                                            <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900 dark:text-green-200">
                                                                Double Pay
                                                            </span>
                                                            <p className="mt-1 text-xs font-medium text-green-600">
                                                                {formatCurrency(data.daily_rate)}
                                                            </p>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800 dark:bg-gray-800 dark:text-gray-200">
                                                                Regular Pay
                                                            </span>
                                                            <p className="mt-1 text-xs text-muted-foreground">₱0.00</p>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        )}

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
                                <div className="space-y-4">
                                    <div>
                                        <h4 className="mb-3 text-sm font-medium">Government Contributions</h4>
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
                                    </div>

                                    <div>
                                        <h4 className="mb-3 text-sm font-medium">Late & Undertime</h4>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label>Total Late Minutes</Label>
                                                <div className="flex h-10 items-center rounded-md border bg-muted px-3 text-sm font-medium">
                                                    {data.late_undertime_minutes} minutes
                                                </div>
                                                <p className="text-xs text-muted-foreground">From attendance records</p>
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="late_undertime_amount">Late Deduction Amount</Label>
                                                <Input
                                                    id="late_undertime_amount"
                                                    type="number"
                                                    step="0.01"
                                                    min="0"
                                                    value={data.late_undertime_amount}
                                                    onChange={(e) => setData('late_undertime_amount', parseFloat(e.target.value) || 0)}
                                                    disabled={period.status !== 'draft'}
                                                />
                                                <p className="text-xs text-muted-foreground">Auto-calculated (editable)</p>
                                            </div>
                                        </div>
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
                                        <span className="text-muted-foreground">Basic Pay:</span>
                                        <span className="font-medium">{formatCurrency(basicPay)}</span>
                                    </div>
                                    <div className="flex justify-between border-b pb-2">
                                        <span className="text-muted-foreground">Overtime:</span>
                                        <span className="font-medium">{formatCurrency(overtime)}</span>
                                    </div>
                                    <div className="flex justify-between border-b pb-2">
                                        <span className="text-muted-foreground">Holiday Pay:</span>
                                        <span className="font-medium">{formatCurrency(holidayPay)}</span>
                                    </div>
                                    <div className="flex justify-between border-b pb-2">
                                        <span className="text-muted-foreground">Total Allowances:</span>
                                        <span className="font-medium">{formatCurrency(totalAllowances)}</span>
                                    </div>
                                    <div className="flex justify-between border-b pb-2">
                                        <span className="text-muted-foreground">Adjustments:</span>
                                        <span className="font-medium">{formatCurrency(data.adjustments)}</span>
                                    </div>
                                    <div className="flex justify-between border-b pb-2">
                                        <span className="text-muted-foreground">Gross Pay:</span>
                                        <span className="font-medium text-green-600">{formatCurrency(grossPay)}</span>
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
