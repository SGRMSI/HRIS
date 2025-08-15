import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { type NavItem } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { KeyRound, LayoutGrid, Notebook, User, Wallet } from 'lucide-react';
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
        title: 'User',
        href: '/user',
        icon: KeyRound,
        requiredRole: 'admin', // Add this property
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
    },
    {
        title: 'Payroll',
        href: '/payroll',
        icon: Wallet,
    },
];

export function AppSidebar() {
    const { auth } = usePage<PageProps>().props;

    // Filter nav items based on user role
    const filteredNavItems = useMemo(() => {
        return mainNavItems.filter((item) => {
            if (!item.requiredRole) return true;

            // Check if user has the required role
            const userRole = auth.user?.role?.name;
            return userRole === item.requiredRole;
        });
    }, [auth.user?.role?.name]);

    // Debug logs - check what we're actually getting
    console.log('=== DEBUG AUTH DATA ===');
    console.log('Full auth object:', JSON.stringify(auth, null, 2));
    console.log('User exists:', !!auth.user);
    console.log('User role_id:', auth.user?.role_id);
    console.log('User role object:', auth.user?.role);
    console.log('Role name:', auth.user?.role?.name);
    console.log('Is admin check:', auth.user?.role?.name === 'admin');
    console.log(
        'Filtered items:',
        filteredNavItems.map((item) => item.title),
    );
    console.log('========================');

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
                <NavMain items={filteredNavItems} />
            </SidebarContent>

            <SidebarFooter>
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
