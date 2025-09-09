import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Link } from '@inertiajs/react';
import { Plus } from 'lucide-react';

interface Position {
    position_id: number;
    title: string;
    employees_count: number;
    department?: string;
    level?: string;
}

interface Company {
    company_id: number;
    name: string;
    industry: string;
    has_account?: boolean;
}

interface PositionTableProps {
    company: Company;
    positions: Position[];
    isCallCenter?: boolean;
}

export default function PositionTable({ company, positions, isCallCenter = false }: PositionTableProps) {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Positions</CardTitle>
                    <CardDescription>
                        {isCallCenter ? 'Roles & Levels' : 'Job positions'} within {company.name}
                    </CardDescription>
                </div>
                <Button size="sm" asChild>
                    <Link href={`/company/${company.company_id}/position/create`}>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Position
                    </Link>
                </Button>
            </CardHeader>
            <CardContent>
                {positions.length === 0 ? (
                    <div className="flex h-32 flex-col items-center justify-center rounded-md border border-dashed p-8 text-center">
                        <p className="text-sm text-muted-foreground">No positions found</p>
                        <p className="mt-2 text-xs text-muted-foreground">Add a position to define job roles in your company</p>
                    </div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Title</TableHead>
                                <TableHead>Employees</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {positions.map((position) => (
                                <TableRow key={position.position_id}>
                                    <TableCell className="font-medium">{position.title}</TableCell>
                                    <TableCell>{position.employees_count || 0}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </CardContent>
        </Card>
    );
}
