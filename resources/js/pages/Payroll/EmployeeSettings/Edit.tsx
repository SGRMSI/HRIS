import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem, PageProps } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Save } from 'lucide-react';
import { FormEventHandler } from 'react';

interface Employee {
    employee_id: number;
    id_number: string;
    full_name: string;
    company?: {
        company_id: number;
        name: string;
    };
    department?: {
        department_id: number;
        name: string;
    };
    position?: {
        position_id: number;
        title: string;
    };
    employment_status: string;
    daily_rate: number;
    clothing_allowance: number;
    rice_allowance: number;
    transportation_allowance: number;
    program_allowance: number;
    attendance_incentive: number;
    adjustments: number;
    sss_contribution: number;
    phic_contribution: number;
    hdmf_contribution: number;
}

interface Props extends PageProps {
    employee: Employee;
}

export default function Edit({ employee }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Payroll',
            href: '/payroll',
        },
        {
            title: 'Employee Settings',
            href: '/payroll/employee-settings',
        },
        {
            title: employee.full_name,
            href: `/payroll/employee-settings/${employee.employee_id}/edit`,
        },
    ];

    const { data, setData, put, processing, errors } = useForm({
        daily_rate: employee.daily_rate || 0,
        clothing_allowance: employee.clothing_allowance || 0,
        rice_allowance: employee.rice_allowance || 0,
        transportation_allowance: employee.transportation_allowance || 0,
        program_allowance: employee.program_allowance || 0,
        attendance_incentive: employee.attendance_incentive || 0,
        adjustments: employee.adjustments || 0,
        sss_contribution: employee.sss_contribution || 0,
        phic_contribution: employee.phic_contribution || 0,
        hdmf_contribution: employee.hdmf_contribution || 0,
    });

    const handleSubmit: FormEventHandler = (e) => {
        e.preventDefault();
        put(route('payroll.employee-settings.update', employee.employee_id));
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-PH', {
            style: 'currency',
            currency: 'PHP',
        }).format(amount || 0);
    };

    const totalAllowances =
        Number(data.clothing_allowance) +
        Number(data.rice_allowance) +
        Number(data.transportation_allowance) +
        Number(data.program_allowance) +
        Number(data.attendance_incentive);

    const totalDeductions = Number(data.sss_contribution) + Number(data.phic_contribution) + Number(data.hdmf_contribution);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Payroll Settings - ${employee.full_name}`} />

            <div className="p-6">
                <div className="mb-6 flex items-center gap-4">
                    <Button variant="ghost" size="sm" asChild>
                        <Link href={route('payroll.employee-settings.index')}>
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Employee Settings
                        </Link>
                    </Button>
                </div>

                <div className="mx-auto max-w-4xl">
                    {/* Employee Info Card */}
                    <Card className="mb-6">
                        <CardHeader>
                            <CardTitle>{employee.full_name}</CardTitle>
                            <CardDescription>
                                {employee.id_number} • {employee.company?.name || 'N/A'} • {employee.position?.title || 'N/A'}
                            </CardDescription>
                        </CardHeader>
                    </Card>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Daily Rate */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Daily Rate</CardTitle>
                                <CardDescription>Set the employee's daily rate</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    <Label htmlFor="daily_rate">Daily Rate *</Label>
                                    <Input
                                        id="daily_rate"
                                        type="number"
                                        step="1"
                                        min="0"
                                        value={data.daily_rate}
                                        onChange={(e) => setData('daily_rate', e.target.value === '' ? 0 : parseFloat(e.target.value))}
                                        className={errors.daily_rate ? 'border-red-500' : ''}
                                    />
                                    {errors.daily_rate && <p className="text-sm text-red-500">{errors.daily_rate}</p>}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Allowances */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Allowances</CardTitle>
                                <CardDescription>Configure monthly allowances for the employee</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="clothing_allowance">Clothing Allowance</Label>
                                        <Input
                                            id="clothing_allowance"
                                            type="number"
                                            step="1"
                                            min="0"
                                            value={data.clothing_allowance}
                                            onChange={(e) => setData('clothing_allowance', e.target.value === '' ? 0 : parseFloat(e.target.value))}
                                            className={errors.clothing_allowance ? 'border-red-500' : ''}
                                        />
                                        {errors.clothing_allowance && <p className="text-sm text-red-500">{errors.clothing_allowance}</p>}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="rice_allowance">Rice Allowance</Label>
                                        <Input
                                            id="rice_allowance"
                                            type="number"
                                            step="1"
                                            min="0"
                                            value={data.rice_allowance}
                                            onChange={(e) => setData('rice_allowance', e.target.value === '' ? 0 : parseFloat(e.target.value))}
                                            className={errors.rice_allowance ? 'border-red-500' : ''}
                                        />
                                        {errors.rice_allowance && <p className="text-sm text-red-500">{errors.rice_allowance}</p>}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="transportation_allowance">Transportation Allowance</Label>
                                        <Input
                                            id="transportation_allowance"
                                            type="number"
                                            step="1"
                                            min="0"
                                            value={data.transportation_allowance}
                                            onChange={(e) =>
                                                setData('transportation_allowance', e.target.value === '' ? 0 : parseFloat(e.target.value))
                                            }
                                            className={errors.transportation_allowance ? 'border-red-500' : ''}
                                        />
                                        {errors.transportation_allowance && <p className="text-sm text-red-500">{errors.transportation_allowance}</p>}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="program_allowance">Program Allowance</Label>
                                        <Input
                                            id="program_allowance"
                                            type="number"
                                            step="1"
                                            min="0"
                                            value={data.program_allowance}
                                            onChange={(e) => setData('program_allowance', e.target.value === '' ? 0 : parseFloat(e.target.value))}
                                            className={errors.program_allowance ? 'border-red-500' : ''}
                                        />
                                        {errors.program_allowance && <p className="text-sm text-red-500">{errors.program_allowance}</p>}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="attendance_incentive">Attendance Incentive</Label>
                                        <Input
                                            id="attendance_incentive"
                                            type="number"
                                            step="1"
                                            min="0"
                                            value={data.attendance_incentive}
                                            onChange={(e) => setData('attendance_incentive', e.target.value === '' ? 0 : parseFloat(e.target.value))}
                                            className={errors.attendance_incentive ? 'border-red-500' : ''}
                                        />
                                        {errors.attendance_incentive && <p className="text-sm text-red-500">{errors.attendance_incentive}</p>}
                                    </div>
                                </div>

                                <div className="rounded-md bg-blue-50 p-4 dark:bg-blue-950/20">
                                    <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                                        Total Allowances: {formatCurrency(totalAllowances)}
                                    </p>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Adjustments */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Adjustments</CardTitle>
                                <CardDescription>Additional adjustments (can be positive for bonuses or negative for deductions)</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    <Label htmlFor="adjustments">Adjustments</Label>
                                    <Input
                                        id="adjustments"
                                        type="number"
                                        step="1"
                                        value={data.adjustments}
                                        onChange={(e) => setData('adjustments', e.target.value === '' ? 0 : parseFloat(e.target.value))}
                                        className={errors.adjustments ? 'border-red-500' : ''}
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Use positive values for additional earnings, negative values for deductions
                                    </p>
                                    {errors.adjustments && <p className="text-sm text-red-500">{errors.adjustments}</p>}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Deductions */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Government Contributions</CardTitle>
                                <CardDescription>Set monthly government contribution deductions</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                                    <div className="space-y-2">
                                        <Label htmlFor="sss_contribution">SSS Contribution</Label>
                                        <Input
                                            id="sss_contribution"
                                            type="number"
                                            step="1"
                                            min="0"
                                            value={data.sss_contribution}
                                            onChange={(e) => setData('sss_contribution', e.target.value === '' ? 0 : parseFloat(e.target.value))}
                                            className={errors.sss_contribution ? 'border-red-500' : ''}
                                        />
                                        {errors.sss_contribution && <p className="text-sm text-red-500">{errors.sss_contribution}</p>}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="phic_contribution">PhilHealth Contribution</Label>
                                        <Input
                                            id="phic_contribution"
                                            type="number"
                                            step="1"
                                            min="0"
                                            value={data.phic_contribution}
                                            onChange={(e) => setData('phic_contribution', e.target.value === '' ? 0 : parseFloat(e.target.value))}
                                            className={errors.phic_contribution ? 'border-red-500' : ''}
                                        />
                                        {errors.phic_contribution && <p className="text-sm text-red-500">{errors.phic_contribution}</p>}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="hdmf_contribution">Pag-IBIG Contribution</Label>
                                        <Input
                                            id="hdmf_contribution"
                                            type="number"
                                            step="1"
                                            min="0"
                                            value={data.hdmf_contribution}
                                            onChange={(e) => setData('hdmf_contribution', e.target.value === '' ? 0 : parseFloat(e.target.value))}
                                            className={errors.hdmf_contribution ? 'border-red-500' : ''}
                                        />
                                        {errors.hdmf_contribution && <p className="text-sm text-red-500">{errors.hdmf_contribution}</p>}
                                    </div>
                                </div>

                                <div className="rounded-md bg-red-50 p-4 dark:bg-red-950/20">
                                    <p className="text-sm font-medium text-red-800 dark:text-red-200">
                                        Total Deductions: {formatCurrency(totalDeductions)}
                                    </p>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Submit Buttons */}
                        <div className="flex justify-end gap-4">
                            <Button type="button" variant="outline" asChild>
                                <Link href={route('payroll.employee-settings.index')}>Cancel</Link>
                            </Button>
                            <Button type="submit" disabled={processing}>
                                <Save className="mr-2 h-4 w-4" />
                                {processing ? 'Saving...' : 'Save Settings'}
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </AppLayout>
    );
}
