import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { columns, type User } from '@/components/user/columns';
import { DataTable } from '@/components/user/data-table';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { Users } from 'lucide-react';

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
                <div className="flex items-center justify-end py-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Total Users</CardTitle>
                            <div className='flex gap-2'>
                                <Users className='h-4 w-4' />

                                <CardDescription>{users.length}</CardDescription>
                            </div>
                        </CardHeader>
                    </Card>
                </div>
                <DataTable columns={columns} data={users} />
            </div>
        </AppLayout>
    );
}
