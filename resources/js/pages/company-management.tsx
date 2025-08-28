import {columns, type Company} from '@/components/company/company-columns';
import {DataTable} from '@/components/company/company-data-table';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { type PageProps } from '@inertiajs/core';
import { Head, usePage } from '@inertiajs/react';
import { Building2 } from 'lucide-react';
import { useEffect } from 'react';
import { toast } from 'sonner';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Company Management',
        href: '/company',
    },
];

interface Props {
    companies: Company[];
    flash: {
        success?: string;
        error?: string;
        warning?: string;
        info?: string;
    };
}

export default function CompanyManagement({ companies }: Props) {
    const { props } = usePage<PageProps & Props>();

    useEffect(() => {
        if (props.flash?.success) {
            toast.success(props.flash.success);
        }
        if (props.flash?.error) {
            toast.error(props.flash.error);
        }
        if (props.flash?.warning) {
            toast.warning(props.flash.warning);
        }
        if (props.flash?.info) {
            toast.info(props.flash.info);
        }
    }, [props.flash]);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Company Management" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <div className="flex items-center justify-end py-4">
                    <Card>
                        <CardHeader>
                            <div className="flex gap-2">
                                <Building2 className="h-4 w-4" />
                                <CardTitle>{companies.length}</CardTitle>
                            </div>
                            <CardDescription>Total Companies</CardDescription>
                        </CardHeader>
                    </Card>
                </div>
                <DataTable columns={columns} data={companies} />
            </div>
        </AppLayout>
    );
}
