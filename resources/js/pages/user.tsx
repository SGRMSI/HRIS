import { columns, type User } from '@/components/user/columns';
import { DataTable } from '@/components/user/data-table';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'User',
        href: '/user',
    },
];

interface Props {
    users: User[];
}

export default function User({ users }: Props) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="User" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <DataTable columns={columns} data={users} />
            </div>
        </AppLayout>
    );
}
