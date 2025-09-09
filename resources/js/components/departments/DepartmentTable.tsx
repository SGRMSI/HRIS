import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Link } from '@inertiajs/react';
import { Plus } from 'lucide-react';

interface Department {
    department_id: number;
    name: string;
    employees_count: number;
    description?: string;
}

interface Company {
    company_id: number;
    name: string;
    industry: string;
    has_account?: boolean;
}

interface DepartmentTableProps {
    company: Company;
    departments: Department[];
    isCallCenter?: boolean;
}

export default function DepartmentTable({ company, departments, isCallCenter = false }: DepartmentTableProps) {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Departments</CardTitle>
                    <CardDescription>
                        {isCallCenter ? 'Service teams' : 'Business units'} within {company.name}
                    </CardDescription>
                </div>
                <Button size="sm" asChild>
                    <Link href={`/company/${company.company_id}/department/create`}>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Department
                    </Link>
                </Button>
            </CardHeader>
            <CardContent>
                {departments.length === 0 ? (
                    <div className="flex h-32 flex-col items-center justify-center rounded-md border border-dashed p-8 text-center">
                        <p className="text-sm text-muted-foreground">No departments found</p>
                        <p className="mt-2 text-xs text-muted-foreground">Add a department to start organizing your workforce</p>
                    </div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Employees</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {departments.map((department) => (
                                <TableRow key={department.department_id}>
                                    <TableCell className="font-medium">{department.name}</TableCell>
                                    <TableCell>{department.employees_count || 0}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </CardContent>
        </Card>
    );
}
