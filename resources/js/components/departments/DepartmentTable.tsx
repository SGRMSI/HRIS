import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useForm } from '@inertiajs/react';
import { Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { CreateDepartmentDialog } from './CreateDepartmentDialog';

interface Department {
    department_id: number;
    name: string;
    employees_count: number;
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
    // Delete functionality state (existing)
    const [departmentToDelete, setDepartmentToDelete] = useState<Department | null>(null);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

    // Add functionality state (new)
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

    const { delete: destroyDepartment, processing: deleteProcessing } = useForm();

    // Delete handler (existing)
    const handleDelete = () => {
        if (departmentToDelete) {
            destroyDepartment(`/company/${company.company_id}/department/${departmentToDelete.department_id}`, {
                onSuccess: () => {
                    setIsDeleteDialogOpen(false);
                    setDepartmentToDelete(null);
                },
            });
        }
    };

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Departments</CardTitle>
                    <CardDescription>
                        {isCallCenter ? 'Service teams' : 'Business units'} within {company.name}
                    </CardDescription>
                </div>
                <Button size="sm" onClick={() => setIsAddDialogOpen(true)}>
                    <Plus className="h-4 w-4" />
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
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {departments.map((department) => (
                                <TableRow key={department.department_id}>
                                    <TableCell className="font-medium">{department.name}</TableCell>
                                    <TableCell>{department.employees_count || 0}</TableCell>
                                    <TableCell className="text-right">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="text-destructive"
                                            onClick={() => {
                                                setDepartmentToDelete(department);
                                                setIsDeleteDialogOpen(true);
                                            }}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                            <span className="sr-only">Delete</span>
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </CardContent>

            {/* Add Department Dialog - Now using the separate component */}
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <CreateDepartmentDialog company={company} onOpenChange={setIsAddDialogOpen} />
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Department</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete the department "{departmentToDelete?.name}"? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={handleDelete} disabled={deleteProcessing}>
                            {deleteProcessing ? 'Deleting...' : 'Delete Department'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </Card>
    );
}
