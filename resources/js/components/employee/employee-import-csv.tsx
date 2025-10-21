import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useForm } from '@inertiajs/react';
import { FileUp, Upload } from 'lucide-react';
import {  useState } from 'react';
import { toast } from 'sonner';

export function EmployeeImportCsv() {
    const [open, setOpen] = useState(false);
    const [fileName, setFileName] = useState('');
    const { data, setData, post, processing, errors, reset } = useForm({
        csv_file: null as File | null,
    });

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setData('csv_file', file);
            setFileName(file.name);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        post(route('employee.import'), {
            forceFormData: true, // Important for file uploads
            onSuccess: () => {
                toast.success('CSV imported successfully');
                setOpen(false);
                reset();
                setFileName('');
            },
            onError: (errors: Record<string, string>) => {
                if (errors.csv_file) {
                    toast.error(errors.csv_file);
                } else {
                    toast.error('Error importing CSV');
                }
            },
        });
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="gap-2">
                    <FileUp className="h-4 w-4" />
                    Import CSV
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Import Employees from CSV</DialogTitle>
                    <DialogDescription>
                        Upload a CSV file with employee data. The file should have headers matching the database fields.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid w-full items-center gap-1.5">
                        <label htmlFor="csv_file" className="text-sm font-medium">
                            CSV File
                        </label>
                        <div className="flex items-center gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => document.getElementById('csv_file')?.click()}
                                className="w-full justify-start gap-2"
                            >
                                <Upload className="h-4 w-4" />
                                {fileName || 'Select CSV file'}
                            </Button>
                            <input id="csv_file" type="file" accept=".csv" className="hidden" onChange={handleFileChange} />
                        </div>
                        {errors.csv_file && <p className="text-sm text-red-500">{errors.csv_file}</p>}
                    </div>

                    <div className="flex justify-end gap-2">
                        <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={processing || !data.csv_file}>
                            Import
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
