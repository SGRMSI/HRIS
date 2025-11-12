import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Link, router } from '@inertiajs/react';
import { CheckCircle, ChevronLeft, ChevronRight, TrendingUp } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, Cell, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

interface AttendanceSummary {
    month_label: string;
    is_current_month: boolean;
    this_month: {
        total_days: number;
        working_days: number;
        present_days: number;
        late_days: number;
        absent_days: number;
        leave_days: number;
        average_attendance_rate: number;
        total_employees: number;
        present_today: number;
    };
    pending_approvals: number;
}

interface AttendanceSummaryWidgetProps {
    summary: AttendanceSummary;
    selectedMonth: string;
}

interface ChartDataItem {
    name: string;
    value: number;
    color: string;
}

interface CustomTooltipProps {
    active?: boolean;
    payload?: Array<{
        value: number;
        payload: ChartDataItem;
    }>;
}

export function AttendanceSummaryWidget({ summary, selectedMonth }: AttendanceSummaryWidgetProps) {
    // Prepare data for the chart
    const chartData: ChartDataItem[] = [
        {
            name: 'Present',
            value: summary.this_month.present_days,
            color: '#22c55e', // green-500
        },
        {
            name: 'Late',
            value: summary.this_month.late_days,
            color: '#eab308', // yellow-500
        },
        {
            name: 'Absent',
            value: summary.this_month.absent_days,
            color: '#ef4444', // red-500
        },
        {
            name: 'Leave',
            value: summary.this_month.leave_days,
            color: '#3b82f6', // blue-500
        },
    ];

    // Generate month options (last 12 months)
    const generateMonthOptions = () => {
        const options = [];
        const today = new Date();
        for (let i = 0; i < 12; i++) {
            const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
            const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            const label = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
            options.push({ value, label });
        }
        return options;
    };

    const monthOptions = generateMonthOptions();

    const handleMonthChange = (value: string) => {
        router.get(
            route('dashboard'),
            { month: value },
            {
                preserveState: true,
                preserveScroll: true,
            },
        );
    };

    const handlePreviousMonth = () => {
        const [year, month] = selectedMonth.split('-').map(Number);
        const date = new Date(year, month - 1, 1);
        date.setMonth(date.getMonth() - 1);
        const newMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        handleMonthChange(newMonth);
    };

    const handleNextMonth = () => {
        const [year, month] = selectedMonth.split('-').map(Number);
        const date = new Date(year, month - 1, 1);
        date.setMonth(date.getMonth() + 1);
        const newMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        handleMonthChange(newMonth);
    };

    const isCurrentMonth = summary.is_current_month;
    const canGoNext = new Date(selectedMonth + '-01') < new Date(new Date().getFullYear(), new Date().getMonth(), 1);

    // Custom tooltip for the chart with proper typing
    const CustomTooltip = ({ active, payload }: CustomTooltipProps) => {
        if (active && payload && payload.length > 0) {
            const data = payload[0].payload;
            const value = payload[0].value;

            return (
                <div className="rounded-lg border bg-background p-3 shadow-lg">
                    <p className="font-semibold">{data.name}</p>
                    <p className="text-sm text-muted-foreground">
                        {value} {value === 1 ? 'day' : 'days'}
                    </p>
                </div>
            );
        }
        return null;
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div className="flex-1">
                        <CardTitle className="flex items-center gap-2">
                            <CheckCircle className="h-5 w-5" />
                            Attendance Summary
                        </CardTitle>
                        <CardDescription>
                            {isCurrentMonth && summary.this_month.present_today > 0 && (
                                <>
                                    {summary.this_month.present_today} of {summary.this_month.total_employees} present today
                                </>
                            )}
                            {!isCurrentMonth && <>Historical data for {summary.month_label}</>}
                        </CardDescription>
                    </div>
                    {summary.pending_approvals > 0 && (
                        <Badge variant="secondary" className="bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300">
                            {summary.pending_approvals} Pending
                        </Badge>
                    )}
                </div>

                {/* Month Navigation */}
                <div className="flex items-center gap-2 pt-4">
                    <Button variant="outline" size="icon" onClick={handlePreviousMonth} className="h-8 w-8">
                        <ChevronLeft className="h-4 w-4" />
                    </Button>

                    <Select value={selectedMonth} onValueChange={handleMonthChange}>
                        <SelectTrigger className="flex-1">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {monthOptions.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                    {option.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Button variant="outline" size="icon" onClick={handleNextMonth} disabled={!canGoNext} className="h-8 w-8">
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            </CardHeader>

            <CardContent className="space-y-6">
                {/* Bar Chart */}
                <div>
                    <h4 className="mb-4 text-sm font-semibold">{summary.month_label}</h4>
                    <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                            <XAxis dataKey="name" className="text-xs" tick={{ fill: 'currentColor' }} />
                            <YAxis
                                className="text-xs"
                                tick={{ fill: 'currentColor' }}
                                label={{ value: 'Days', angle: -90, position: 'insideLeft' }}
                            />
                            <Tooltip content={<CustomTooltip />} />
                            <Legend wrapperStyle={{ paddingTop: '20px' }} iconType="circle" />
                            <Bar dataKey="value" name="Days" radius={[8, 8, 0, 0]} maxBarSize={80}>
                                {chartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Summary Stats */}
                <div className="grid grid-cols-2 gap-4 rounded-lg border bg-muted/50 p-4 md:grid-cols-4">
                    <div className="text-center">
                        <p className="text-2xl font-bold text-green-600 dark:text-green-400">{summary.this_month.present_days}</p>
                        <p className="text-xs text-muted-foreground">Present</p>
                    </div>
                    <div className="text-center">
                        <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{summary.this_month.late_days}</p>
                        <p className="text-xs text-muted-foreground">Late</p>
                    </div>
                    <div className="text-center">
                        <p className="text-2xl font-bold text-red-600 dark:text-red-400">{summary.this_month.absent_days}</p>
                        <p className="text-xs text-muted-foreground">Absent</p>
                    </div>
                    <div className="text-center">
                        <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{summary.this_month.leave_days}</p>
                        <p className="text-xs text-muted-foreground">Leave</p>
                    </div>
                </div>

                {/* Action Button */}
                <Button asChild variant="outline" className="w-full">
                    <Link href={route('attendance.final.index')}>
                        <TrendingUp className="mr-2 h-4 w-4" />
                        View Detailed Report
                    </Link>
                </Button>
            </CardContent>
        </Card>
    );
}
