import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Download } from 'lucide-react';
import { router } from '@inertiajs/react';

interface Company {
    id: number;
    name: string;
}

interface Employee {
    id: number;
    name: string;
    company_id: number;
}

interface ExportDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    exportRoute: string;
    companies?: Company[];
    employees?: Employee[];
    currentFilters?: {
        date_from?: string;
        date_to?: string;
        company_id?: number;
        employee_id?: number;
        status?: string;
    };
}

export function ExportDialog({
    open,
    onOpenChange,
    exportRoute,
    companies = [],
    employees = [],
    currentFilters = {},
}: ExportDialogProps) {
    const [filters, setFilters] = useState({
        date_from: currentFilters.date_from || '',
        date_to: currentFilters.date_to || '',
        company_id: currentFilters.company_id || '',
        employee_id: currentFilters.employee_id || '',
    });

    const filteredEmployees = filters.company_id
        ? employees.filter(emp => emp.company_id === Number(filters.company_id))
        : employees;

    const handleExport = () => {
        const exportFilters: any = {};
        
        if (filters.date_from) exportFilters.date_from = filters.date_from;
        if (filters.date_to) exportFilters.date_to = filters.date_to;
        if (filters.company_id && filters.company_id !== 'all') exportFilters.company_id = filters.company_id;
        if (filters.employee_id && filters.employee_id !== 'all') exportFilters.employee_id = filters.employee_id;

        // Navigate to export route with filters as query params
        window.location.href = exportRoute + '?' + new URLSearchParams(exportFilters).toString();
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Export Attendance Data</DialogTitle>
                    <DialogDescription>
                        Select filters to customize your export. Leave filters empty to export all data.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="date_from">Date From</Label>
                            <Input
                                id="date_from"
                                type="date"
                                value={filters.date_from}
                                onChange={(e) => setFilters({ ...filters, date_from: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="date_to">Date To</Label>
                            <Input
                                id="date_to"
                                type="date"
                                value={filters.date_to}
                                onChange={(e) => setFilters({ ...filters, date_to: e.target.value })}
                            />
                        </div>
                    </div>

                    {companies.length > 0 && (
                        <div className="space-y-2">
                            <Label htmlFor="company">Company</Label>
                            <Select
                                value={filters.company_id?.toString() || 'all'}
                                onValueChange={(value) => setFilters({ 
                                    ...filters, 
                                    company_id: value === 'all' ? '' : value,
                                    employee_id: '' // Reset employee when company changes
                                })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="All Companies" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Companies</SelectItem>
                                    {companies.map((company) => (
                                        <SelectItem key={company.id} value={company.id.toString()}>
                                            {company.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    {employees.length > 0 && (
                        <div className="space-y-2">
                            <Label htmlFor="employee">Employee</Label>
                            <Select
                                value={filters.employee_id?.toString() || 'all'}
                                onValueChange={(value) => setFilters({ 
                                    ...filters, 
                                    employee_id: value === 'all' ? '' : value 
                                })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="All Employees" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Employees</SelectItem>
                                    {filteredEmployees.map((emp) => (
                                        <SelectItem key={emp.id} value={emp.id.toString()}>
                                            {emp.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button onClick={handleExport}>
                        <Download className="h-4 w-4 mr-2" />
                        Export
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
