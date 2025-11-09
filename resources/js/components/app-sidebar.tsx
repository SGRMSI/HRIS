import { NavAdmin } from '@/components/nav-admin';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { type NavItem } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { Building2, Calendar, CalendarDays, ClipboardList, Clock, FileUp, KeyRound, LayoutGrid, ListChecks, Notebook, Settings, Timer, User, Wallet } from 'lucide-react';
import { useMemo } from 'react';
import AppLogo from './app-logo';

// Define the types
interface User {
    id: number;
    name: string;
    email: string;
    role_id: number;
    role: {
        id: number;
        name: string;
        label: string;
    } | null;
    is_active: boolean;
}

interface PageProps {
    auth: {
        user: User | null;
    };
    [key: string]: unknown;
}

const mainNavItems: NavItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
        icon: LayoutGrid,
    },
    {
        title: 'Employee',
        href: '/employee',
        icon: User,
    },
    {
        title: 'Attendance',
        href: '/attendance',
        icon: Notebook,
        items: [
            {
                title: 'Upload Attendance',
                href: '/attendance/upload',
                icon: FileUp,
            },
            {
                title: 'Raw Data',
                href: '/attendance/raw',
                icon: ClipboardList,
            },
            {
                title: 'Processed Data',
                href: '/attendance/processed',
                icon: ListChecks,
            },
            {
                title: 'Final Attendance',
                href: '/attendance/final',
                icon: Calendar,
            },
            {
                title: 'Shifts',
                href: '/attendance/shifts',
                icon: Clock,
            },
            {
                title: 'Schedules',
                href: '/attendance/schedules',
                icon: CalendarDays,
            },
            {
                title: 'Holidays',
                href: '/attendance/holidays',
                icon: Calendar,
            },
            {
                title: 'Leaves',
                href: '/attendance/leaves',
                icon: CalendarDays,
            },
            {
                title: 'Overtimes',
                href: '/attendance/overtimes',
                icon: Timer,
            },
        ],
    },
    {
        title: 'Payroll',
        href: '/payroll',
        icon: Wallet,
    },
];

const adminNavItems: NavItem[] = [
    {
        title: 'User Management',
        href: '/user',
        icon: KeyRound,
    },
    {
        title: 'Company Management',
        href: '/company',
        icon: Building2,
    },
];

export function AppSidebar() {
    const { auth } = usePage<PageProps>().props;

    // Check if user is admin
    const isAdmin = useMemo(() => {
        return auth.user?.role?.name === 'admin';
    }, [auth.user?.role?.name]);

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href="/dashboard" prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                {/* Main Navigation */}
                <NavMain items={mainNavItems} />

                {/* Admin Navigation - Only show for admins */}
                {isAdmin && <NavAdmin items={adminNavItems} />}
            </SidebarContent>

            <SidebarFooter>
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
