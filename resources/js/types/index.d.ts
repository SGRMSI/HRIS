import { LucideIcon } from 'lucide-react';
import type { Config } from 'ziggy-js';

export interface Auth {
    user: User;
}

export interface BreadcrumbItem {
    title: string;
    href: string;
}

export interface NavGroup {
    title: string;
    items: NavItem[];
}

export interface NavItem {
    title: string;
    href: string;
    icon?: LucideIcon | null;
    isActive?: boolean;
    requiredRole?: string;
    items?: NavItem[];
}

export interface SharedData {
    name: string;
    quote: { message: string; author: string };
    auth: Auth;
    ziggy: Config & { location: string };
    sidebarOpen: boolean;
    [key: string]: unknown;
}

export interface User {
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

export interface PageProps {
    auth: {
        user: User | null;
    };
}

export interface PaginatedData<T> {
    data: T[];
    current_page: number;
    from: number;
    to: number;
    total: number;
    per_page: number;
    last_page: number;
    links: Array<{
        url: string | null;
        label: string;
        active: boolean;
    }>;
}

export interface Company {
    company_id: number;
    name: string;
    hasAccount?: boolean;
    status?: string;
}

export interface Department {
    department_id: number;
    name: string;
    company_id: number;
}

export interface Position {
    position_id: number;
    title: string;
    company_id: number;
}

export interface Employee {
    employee_id: number;
    id_number: string;
    full_name: string;
    first_name?: string;
    middle_name?: string;
    last_name?: string;
    company_id?: number;
    department_id?: number;
    position_id?: number;
    employment_status?: string;
    date_hired?: string;
    contact_number?: string;
    company?: Company;
    department?: Department;
    position?: Position;
}
