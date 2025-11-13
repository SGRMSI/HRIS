import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem, PageProps } from '@/types';
import { PayrollPeriod, PayrollRecord } from '@/types/payroll';
import { Head, Link, router } from '@inertiajs/react';
import { differenceInDays, format } from 'date-fns';
import { CheckCircle, Download, Edit, FileText, Trash2, Users } from 'lucide-react';

interface Props extends PageProps {
    period: PayrollPeriod & {
        creator?: { user_id: number; name: string };
        approver?: { user_id: number; name: string };
    };
    records: Record<string, PayrollRecord[]>;
}

export default function Show({ period, records }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Payroll',
            href: '/payroll',
        },
        {
            title: period.period_name,
            href: `/payroll/${period.period_id}`,
        },
    ];

    const getStatusBadge = (status: string) => {
        const variants: Record<string, string> = {
            draft: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
            approved: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
            paid: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
        };

        return <Badge className={variants[status] || ''}>{status.toUpperCase()}</Badge>;
    };

    const getPaymentDateBadge = () => {
        if (!period.payment_date) return null;

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const paymentDate = new Date(period.payment_date);
        paymentDate.setHours(0, 0, 0, 0);
        const daysUntil = differenceInDays(paymentDate, today);

        if (daysUntil === 0) {
            return <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300">Payment Today</Badge>;
        } else if (daysUntil > 0 && daysUntil <= 7) {
            return (
                <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300">
                    Payment in {daysUntil} {daysUntil === 1 ? 'day' : 'days'}
                </Badge>
            );
        } else if (daysUntil < 0) {
            return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">Payment Past</Badge>;
        }
        return null;
    };

    const handleApprove = () => {
        router.post(route('payroll.approve', period.period_id));
    };

    const handleMarkPaid = () => {
        router.post(route('payroll.mark-paid', period.period_id));
    };

    const handleDelete = () => {
        router.delete(route('payroll.destroy', period.period_id));
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Payroll - ${period.period_name}`} />
            <div className="p-4">
                {/* Header */}
                <div className="mb-6 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div>
                            <h2 className="text-2xl font-bold tracking-tight">{period.period_name}</h2>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                {format(new Date(period.date_from), 'MMM d')} - {format(new Date(period.date_to), 'MMM d, yyyy')}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {period.status === 'draft' && (
                            <>
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button variant="outline">
                                            <CheckCircle className="mr-2 h-4 w-4" />
                                            Approve Payroll
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Approve Payroll Period</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                Are you sure you want to approve this payroll period?
                                                <br />
                                                <br />
                                                <strong>This action will:</strong>
                                                <ul className="mt-2 list-inside list-disc space-y-1">
                                                    <li>Lock all {period.total_employees} employee records</li>
                                                    <li>Prevent further edits to payroll data</li>
                                                    <li>Mark the payroll as ready for payment</li>
                                                </ul>
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                            <AlertDialogAction onClick={handleApprove}>Approve Payroll</AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button variant="outline">
                                            <Trash2 className="mr-2 h-4 w-4" />
                                            Delete
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Delete Payroll Period</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                Are you sure you want to delete this payroll period?
                                                <br />
                                                <strong className="text-destructive">
                                                    This action cannot be undone and will delete all {period.total_employees} employee records.
                                                </strong>
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                            <AlertDialogAction onClick={handleDelete} className=" ">
                                                Delete Payroll
                                            </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </>
                        )}
                        {period.status === 'approved' && (
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant="outline">
                                        <CheckCircle className="mr-2 h-4 w-4" />
                                        Mark as Paid
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Mark Payroll as Paid</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            Are you sure you want to mark this payroll as paid?
                                            <br />
                                            <br />
                                            <strong>This action will:</strong>
                                            <ul className="mt-2 list-inside list-disc space-y-1">
                                                <li>Archive the payroll period</li>
                                                <li>Permanently lock all records</li>
                                                <li>Prevent any future modifications</li>
                                            </ul>
                                            <br />
                                            <span className="text-sm">
                                                Please ensure all payments have been disbursed to employees before confirming.
                                            </span>
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction onClick={handleMarkPaid}>Mark as Paid</AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        )}
                        <a href={route('payroll.export-payslips', period.period_id)}>
                            <Button>
                                <Download className="mr-2 h-4 w-4" />
                                Export Payslips
                            </Button>
                        </a>
                    </div>
                </div>

                {/* Summary Cards */}
                <div className="mb-6 grid gap-4 md:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Status</CardTitle>
                            <FileText className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{getStatusBadge(period.status)}</div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
                            <Users className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{period.total_employees}</div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Gross Pay</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                ₱{parseFloat(period.total_gross).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Net Pay</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-600">
                                ₱{parseFloat(period.total_net).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Payroll Records by Company */}
                {Object.entries(records).map(([companyName, companyRecords]) => (
                    <Card key={companyName} className="mb-6">
                        <CardHeader>
                            <CardTitle>{companyName}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>ID Number</TableHead>
                                        <TableHead>Employee Name</TableHead>
                                        <TableHead>Department</TableHead>
                                        <TableHead className="text-right">Days Worked</TableHead>
                                        <TableHead className="text-right">Gross Pay</TableHead>
                                        <TableHead className="text-right">Deductions</TableHead>
                                        <TableHead className="text-right">Net Pay</TableHead>
                                        <TableHead className="text-center">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {companyRecords.map((record) => (
                                        <TableRow key={record.payroll_id}>
                                            <TableCell className="font-mono text-sm">{record.employee?.id_number}</TableCell>
                                            <TableCell className="font-medium">{record.employee?.full_name}</TableCell>
                                            <TableCell>{record.employee?.department?.name}</TableCell>
                                            <TableCell className="text-right">{parseFloat(String(record.days_worked)).toFixed(1)}</TableCell>
                                            <TableCell className="text-right font-medium">
                                                ₱{parseFloat(String(record.gross_pay)).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                                            </TableCell>
                                            <TableCell className="text-right text-red-600">
                                                ₱{parseFloat(String(record.total_deductions)).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                                            </TableCell>
                                            <TableCell className="text-right font-bold text-green-600">
                                                ₱{parseFloat(String(record.net_pay)).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <Link href={route('payroll.records.edit', [period.period_id, record.payroll_id])}>
                                                    <Button size="sm" variant="outline">
                                                        {record.is_editable ? <Edit className="h-4 w-4" /> : 'View'}
                                                    </Button>
                                                </Link>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                ))}

                {/* Period Information */}
                <Card>
                    <CardHeader>
                        <CardTitle>Period Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-4 md:grid-cols-2">
                            <div>
                                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Period</p>
                                <p className="mt-1">
                                    {format(new Date(period.date_from), 'MMMM d, yyyy')} - {format(new Date(period.date_to), 'MMMM d, yyyy')}
                                </p>
                            </div>
                            {period.payment_date && (
                                <div>
                                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Payment Date</p>
                                    <div className="mt-1 flex items-center gap-2">
                                        <p>{format(new Date(period.payment_date), 'MMMM d, yyyy')}</p>
                                        {getPaymentDateBadge()}
                                    </div>
                                </div>
                            )}
                            <div>
                                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Created By</p>
                                <p className="mt-1">{period.creator?.name || 'Unknown'}</p>
                            </div>
                            {period.approver && (
                                <div>
                                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Approved By</p>
                                    <p className="mt-1">
                                        {period.approver.name} on {period.approved_at && format(new Date(period.approved_at), 'MMMM d, yyyy')}
                                    </p>
                                </div>
                            )}
                        </div>
                        {period.notes && (
                            <div>
                                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Notes</p>
                                <p className="mt-1">{period.notes}</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
