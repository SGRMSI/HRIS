import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { Head, Link, useForm,} from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Users',
        href: '/user',
    },
    {
        title: 'Edit User',
        href: '#',
    },
];

interface Role {
    value: number;
    label: string;
}

interface User {
    id: number;
    name: string;
    email: string;
    role_id: number;
    is_active: boolean;
}


interface Props {
    user: User;
    roles: Role[];
}

export default function EditUser({ user, roles }: Props) {


    const { data, setData, put, processing, errors } = useForm({
        name: user.name,
        email: user.email,
        password: '',
        password_confirmation: '',
        role_id: user.role_id.toString(),
        is_active: user.is_active,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        put(`/user/${user.id}`);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Edit ${user.name}`} />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" asChild>
                            <Link href="/user">
                                <ArrowLeft className="h-4 w-4" />
                                Back to Users
                            </Link>
                        </Button>
                    </div>
                </div>

                <Card className="max-w-2xl">
                    <CardHeader>
                        <CardTitle>Edit User: {user.name}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="name">Full Name</Label>
                                <Input
                                    id="name"
                                    type="text"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    required
                                    className={errors.name ? 'border-red-500' : ''}
                                />
                                {errors.name && <p className="text-sm text-red-600">{errors.name}</p>}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={data.email}
                                    onChange={(e) => setData('email', e.target.value)}
                                    required
                                    className={errors.email ? 'border-red-500' : ''}
                                />
                                {errors.email && <p className="text-sm text-red-600">{errors.email}</p>}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="password">New Password (leave blank to keep current)</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    value={data.password}
                                    onChange={(e) => setData('password', e.target.value)}
                                    placeholder="Leave blank to keep current password"
                                    className={errors.password ? 'border-red-500' : ''}
                                />
                                {errors.password && <p className="text-sm text-red-600">{errors.password}</p>}
                            </div>

                            {data.password && (
                                <div className="space-y-2">
                                    <Label htmlFor="password_confirmation">Confirm New Password</Label>
                                    <Input
                                        id="password_confirmation"
                                        type="password"
                                        value={data.password_confirmation}
                                        onChange={(e) => setData('password_confirmation', e.target.value)}
                                        className={errors.password_confirmation ? 'border-red-500' : ''}
                                    />
                                    {errors.password_confirmation && <p className="text-sm text-red-600">{errors.password_confirmation}</p>}
                                </div>
                            )}

                            <div className="space-y-2">
                                <Label htmlFor="role">Role</Label>
                                <Select value={data.role_id} onValueChange={(value) => setData('role_id', value)}>
                                    <SelectTrigger className={errors.role_id ? 'border-red-500' : ''}>
                                        <SelectValue placeholder="Select a role" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {roles.map((role) => (
                                            <SelectItem key={role.value} value={role.value.toString()}>
                                                {role.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {errors.role_id && <p className="text-sm text-red-600">{errors.role_id}</p>}
                            </div>

                            <div className="flex items-center space-x-2">
                                <Switch id="is_active" checked={data.is_active} onCheckedChange={(checked) => setData('is_active', checked)} />
                                <Label htmlFor="is_active">Active</Label>
                            </div>

                            <div className="flex gap-2">
                                <Button type="submit" disabled={processing}>
                                    {processing ? 'Updating...' : 'Update User'}
                                </Button>
                                <Button type="button" variant="outline" asChild>
                                    <Link href="/user">Cancel</Link>
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
