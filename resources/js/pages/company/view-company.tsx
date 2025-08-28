import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, Briefcase, Building2, CreditCard, Edit, Phone, Plus, Users } from 'lucide-react';

interface Company {
    company_id: number;
    name: string;
    industry: string;
    created_at: string;
    updated_at: string;
}

interface Department {
    department_id: number;
    name: string;
    employees_count: number;
    description?: string;
}

interface Position {
    position_id: number;
    title: string;
    employees_count: number;
    department?: string;
    level?: string;
}

interface Account {
    account_id: number;
    name: string;
    active: boolean;
    client_type?: string;
    start_date?: string;
    contract_value?: number;
}

interface Employee {
    employee_id: number;
    id_number: string;
    full_name: string;
    department: string;
    position: string;
    employment_status: string;
    hire_date?: string;
}

interface Props {
    company: Company;
    departments?: Department[];
    positions?: Position[];
    accounts?: Account[];
    employees?: Employee[];
}

export default function ViewCompany({ company, departments = [], positions = [], accounts = [], employees = [] }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Company Management',
            href: '/company',
        },
        {
            title: company.name,
            href: `/company/${company.company_id}`,
        },
    ];

    const isCallCenter =
        company.industry.toLowerCase().includes('call center') ||
        company.industry.toLowerCase().includes('bpo') ||
        company.industry.toLowerCase().includes('customer service');

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`${company.name} - Company Details`} />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl p-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" asChild>
                            <Link href="/company">
                                <ArrowLeft className="h-4 w-4" />
                                Back to Companies
                            </Link>
                        </Button>
                    </div>
                    <Button asChild>
                        <Link href={route('company.edit', company.company_id)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit Company
                        </Link>
                    </Button>
                </div>

                {/* Company Info */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            {isCallCenter ? <Phone className="h-5 w-5" /> : <Building2 className="h-5 w-5" />}
                            <CardTitle>{company.name}</CardTitle>
                            {isCallCenter && <Badge variant="default">Call Center</Badge>}
                        </div>
                        <CardDescription>Company Information & Operations</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                            <div>
                                <span className="text-sm font-medium text-muted-foreground">Industry</span>
                                <div className="mt-1">
                                    <Badge variant="secondary">{company.industry}</Badge>
                                </div>
                            </div>
                            <div>
                                <span className="text-sm font-medium text-muted-foreground">Total Agents</span>
                                <p className="mt-1 text-lg font-semibold">{employees?.length || 0}</p>
                            </div>
                            <div>
                                <span className="text-sm font-medium text-muted-foreground">Active Accounts</span>
                                <p className="mt-1 text-lg font-semibold text-green-600">{accounts?.filter((acc) => acc.active).length || 0}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Statistics Cards */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">{isCallCenter ? 'Agents' : 'Employees'}</CardTitle>
                            <Users className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{employees?.length || 0}</div>
                            <p className="text-xs text-muted-foreground">Total workforce</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Departments</CardTitle>
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{departments?.length || 0}</div>
                            <p className="text-xs text-muted-foreground">{isCallCenter ? 'Service teams' : 'Business units'}</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Positions</CardTitle>
                            <Briefcase className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{positions?.length || 0}</div>
                            <p className="text-xs text-muted-foreground">{isCallCenter ? 'Role types' : 'Job roles'}</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">{isCallCenter ? 'Client Accounts' : 'Accounts'}</CardTitle>
                            <CreditCard className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{accounts?.length || 0}</div>
                            <p className="text-xs text-muted-foreground">{accounts?.filter((acc) => acc.active).length || 0} active</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Tabs for Call Center specific view */}
                {isCallCenter ? (
                    <Tabs defaultValue="accounts" className="w-full">
                        <TabsList className="grid w-full grid-cols-4">
                            <TabsTrigger value="accounts">Client Accounts</TabsTrigger>
                            <TabsTrigger value="departments">Service Teams</TabsTrigger>
                            <TabsTrigger value="positions">Roles & Levels</TabsTrigger>
                            <TabsTrigger value="agents">Agents</TabsTrigger>
                        </TabsList>

                        {/* Client Accounts Tab */}
                        <TabsContent value="accounts">
                            <Card>
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <CardTitle>Client Accounts</CardTitle>
                                            <CardDescription>Call center client accounts and contracts</CardDescription>
                                        </div>
                                        <Button size="sm" asChild>
                                            <Link href={route('company.account.create', company.company_id)}>
                                                <Plus className="mr-2 h-4 w-4" />
                                                Add Client Account
                                            </Link>
                                        </Button>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    {accounts && accounts.length > 0 ? (
                                        <div className="rounded-md border">
                                            <Table>
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead>Client Name</TableHead>
                                                        <TableHead>Type</TableHead>
                                                        <TableHead>Contract Value</TableHead>
                                                        <TableHead>Start Date</TableHead>
                                                        <TableHead className="text-center">Status</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {accounts.map((account) => (
                                                        <TableRow key={account.account_id}>
                                                            <TableCell className="font-medium">{account.name}</TableCell>
                                                            <TableCell>
                                                                <Badge variant="outline">{account.client_type || 'Standard'}</Badge>
                                                            </TableCell>
                                                            <TableCell>
                                                                {account.contract_value ? `$${account.contract_value.toLocaleString()}` : 'N/A'}
                                                            </TableCell>
                                                            <TableCell>
                                                                {account.start_date ? new Date(account.start_date).toLocaleDateString() : 'N/A'}
                                                            </TableCell>
                                                            <TableCell className="text-center">
                                                                <Badge variant={account.active ? 'default' : 'secondary'}>
                                                                    {account.active ? 'Active' : 'Inactive'}
                                                                </Badge>
                                                            </TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </div>
                                    ) : (
                                        <div className="py-8 text-center text-muted-foreground">
                                            <CreditCard className="mx-auto mb-2 h-8 w-8" />
                                            <p>No client accounts found</p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* Service Teams Tab */}
                        <TabsContent value="departments">
                            <Card>
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <CardTitle>Service Teams</CardTitle>
                                            <CardDescription>Call center departments and service teams</CardDescription>
                                        </div>
                                        <Button size="sm" asChild>
                                            <Link href={route('company.department.create', company.company_id)}>
                                                <Plus className="mr-2 h-4 w-4" />
                                                Add Team
                                            </Link>
                                        </Button>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    {departments && departments.length > 0 ? (
                                        <div className="rounded-md border">
                                            <Table>
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead>Team Name</TableHead>
                                                        <TableHead>Description</TableHead>
                                                        <TableHead className="text-center">Agents</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {departments.map((department) => (
                                                        <TableRow key={department.department_id}>
                                                            <TableCell className="font-medium">{department.name}</TableCell>
                                                            <TableCell className="text-sm text-muted-foreground">
                                                                {department.description || 'Customer service team'}
                                                            </TableCell>
                                                            <TableCell className="text-center">
                                                                <Badge variant="outline">{department.employees_count}</Badge>
                                                            </TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </div>
                                    ) : (
                                        <div className="py-8 text-center text-muted-foreground">
                                            <Building2 className="mx-auto mb-2 h-8 w-8" />
                                            <p>No service teams found</p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* Roles & Levels Tab */}
                        <TabsContent value="positions">
                            <Card>
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <CardTitle>Roles & Career Levels</CardTitle>
                                            <CardDescription>Available positions and career progression</CardDescription>
                                        </div>
                                        <Button size="sm" asChild>
                                            <Link href={route('company.position.create', company.company_id)}>
                                                <Plus className="mr-2 h-4 w-4" />
                                                Add Position
                                            </Link>
                                        </Button>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    {positions && positions.length > 0 ? (
                                        <div className="rounded-md border">
                                            <Table>
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead>Position Title</TableHead>
                                                        <TableHead>Level</TableHead>
                                                        <TableHead>Department</TableHead>
                                                        <TableHead className="text-center">Current Agents</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {positions.map((position) => (
                                                        <TableRow key={position.position_id}>
                                                            <TableCell className="font-medium">{position.title}</TableCell>
                                                            <TableCell>
                                                                <Badge variant="outline">{position.level || 'Entry Level'}</Badge>
                                                            </TableCell>
                                                            <TableCell>{position.department || 'General'}</TableCell>
                                                            <TableCell className="text-center">
                                                                <Badge variant="outline">{position.employees_count}</Badge>
                                                            </TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </div>
                                    ) : (
                                        <div className="py-8 text-center text-muted-foreground">
                                            <Briefcase className="mx-auto mb-2 h-8 w-8" />
                                            <p>No positions found</p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* Agents Tab */}
                        <TabsContent value="agents">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Recent Agents</CardTitle>
                                    <CardDescription>Latest agents and their assignments</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    {employees && employees.length > 0 ? (
                                        <div className="rounded-md border">
                                            <Table>
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead>Agent ID</TableHead>
                                                        <TableHead>Name</TableHead>
                                                        <TableHead>Team</TableHead>
                                                        <TableHead>Role</TableHead>
                                                        <TableHead>Hire Date</TableHead>
                                                        <TableHead>Status</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {employees.slice(0, 10).map((employee) => (
                                                        <TableRow key={employee.employee_id}>
                                                            <TableCell className="font-medium">{employee.id_number}</TableCell>
                                                            <TableCell>{employee.full_name}</TableCell>
                                                            <TableCell>{employee.department}</TableCell>
                                                            <TableCell>{employee.position}</TableCell>
                                                            <TableCell>
                                                                {employee.hire_date ? new Date(employee.hire_date).toLocaleDateString() : 'N/A'}
                                                            </TableCell>
                                                            <TableCell>
                                                                <Badge variant="outline">{employee.employment_status}</Badge>
                                                            </TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </div>
                                    ) : (
                                        <div className="py-8 text-center text-muted-foreground">
                                            <Users className="mx-auto mb-2 h-8 w-8" />
                                            <p>No agents found</p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                ) : (
                    /* Regular company view for non-call centers */
                    <div className="space-y-6">
                        {/* Standard departments, positions, accounts layout */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Departments</CardTitle>
                                <CardDescription>Company departments</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {departments && departments.length > 0 ? (
                                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                        {departments.map((department) => (
                                            <div key={department.department_id} className="rounded-lg border p-4">
                                                <h4 className="font-medium">{department.name}</h4>
                                                <p className="text-sm text-muted-foreground">{department.employees_count} employees</p>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-center text-muted-foreground">No departments found</p>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
