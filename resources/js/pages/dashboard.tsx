import { AttendanceSummaryWidget } from '@/components/dashboard/attendance-summary';
import { StatsCard } from '@/components/dashboard/employee-stat-card';
import { LeaveSummary } from '@/components/dashboard/leave-summary';
import { QuickActions } from '@/components/dashboard/quick-actions';
import { RecentActivity } from '@/components/dashboard/recent-activity';
import { UpcomingEvents } from '@/components/dashboard/upcoming-events';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { Briefcase, UserCheck, UserCog, Users } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
    },
];

interface EmployeeStats {
    total: number;
    probationary: number;
    regular: number;
    contractual: number;
}

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

interface LeaveRequest {
    id: number;
    employee: {
        id: number;
        name: string;
        avatar?: string;
        id_number: string;
        department?: { name: string } | null;
    };
    leave_type: string;
    date_start: string | null;
    date_end: string | null;
    days_count: number;
    reason: string;
    status: 'pending' | 'approved' | 'rejected' | 'cancelled';
    created_at: string;
    document_path?: string;
}

interface LeaveSummaryData {
    pending_leaves: LeaveRequest[];
    total_pending: number;
    approved_today: number;
}

interface Activity {
    id: number;
    description: string;
    subject_type: string;
    subject_id: number;
    causer: { name: string; avatar?: string } | null;
    properties: Record<string, unknown>;
    created_at: string;
}

interface UpcomingEvent {
    id: number;
    type: 'holiday' | 'birthday' | 'anniversary';
    title: string;
    date: string;
    description?: string;
    employee?: {
        id: number;
        name: string;
        avatar?: string;
    };
    company?: {
        name: string;
    };
}

interface DashboardProps {
    employeeStats: EmployeeStats;
    attendanceSummary: AttendanceSummary;
    leaveSummary: LeaveSummaryData;
    recentActivities: Activity[];
    upcomingEvents: UpcomingEvent[];
    selectedMonth: string;
}

export default function Dashboard({
    employeeStats,
    attendanceSummary,
    leaveSummary,
    recentActivities,
    upcomingEvents,
    selectedMonth,
}: DashboardProps) {
    const stats = [
        {
            title: 'Total Employees',
            value: employeeStats.total,
            icon: Users,
            description: 'All active employees',
            color: 'text-blue-600',
            bgColor: 'bg-blue-100',
        },
        {
            title: 'Regular Employees',
            value: employeeStats.regular,
            icon: UserCheck,
            description: 'Permanent staff members',
            color: 'text-green-600',
            bgColor: 'bg-green-100',
        },
        {
            title: 'Probationary',
            value: employeeStats.probationary,
            icon: UserCog,
            description: 'Under probation period',
            color: 'text-yellow-600',
            bgColor: 'bg-yellow-100',
        },
        {
            title: 'Contractual',
            value: employeeStats.contractual,
            icon: Briefcase,
            description: 'Contract-based employees',
            color: 'text-purple-600',
            bgColor: 'bg-purple-100',
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl p-6">
                {/* Employee Stats Cards */}
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
                    {stats.map((stat) => (
                        <StatsCard
                            key={stat.title}
                            title={stat.title}
                            value={stat.value}
                            description={stat.description}
                            icon={stat.icon}
                            color={stat.color}
                            bgColor={stat.bgColor}
                            showPercentage={stat.title !== 'Total Employees'}
                            totalValue={employeeStats.total}
                        />
                    ))}
                </div>

                {/* Quick Actions */}
                <QuickActions />

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    {/* Attendance Summary */}
                    <AttendanceSummaryWidget summary={attendanceSummary} selectedMonth={selectedMonth} />
                    {/* Recent Activity */}
                    <RecentActivity activities={recentActivities} />
                </div>

                {/* Bottom Section */}
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    {/* Leave Requests */}
                    <LeaveSummary
                        pending_leaves={leaveSummary.pending_leaves}
                        total_pending={leaveSummary.total_pending}
                        approved_today={leaveSummary.approved_today}
                    />

                    {/* Upcoming Events */}
                    <UpcomingEvents events={upcomingEvents} />
                </div>
            </div>
        </AppLayout>
    );
}
