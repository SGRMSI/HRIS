import React, { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useForm } from '@inertiajs/react';
import { UploadCloud } from 'lucide-react';

interface UploadDocumentDialogProps {
    employeeId: number;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    initialCategory?: 'Government_Documents' | 'Company_Documents' | 'Infractions' | 'Other';
}

export function UploadDocumentDialog({ employeeId, open, onOpenChange, initialCategory = 'Government_Documents' }: UploadDocumentDialogProps) {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    const { data, setData, post, processing, errors, reset, clearErrors } = useForm({
        file: null as File | null,
        category: initialCategory,
        remarks: '',
    });

    const handleRemarksChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const value = e.target.value;
        const wordCount = value.trim().split(/\s+/).filter(word => word.length > 0).length;
        
        // Limit to 10 words or 30 characters
        if (wordCount <= 10 && value.length <= 30) {
            setData('remarks', value);
        } else if (value.length <= 30) {
            // If character limit is ok but word limit exceeded, truncate to 10 words
            const words = value.trim().split(/\s+/).slice(0, 10);
            setData('remarks', words.join(' '));
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const file = e.target.files[0];
            setSelectedFile(file);
            setData('file', file);
        }
    };
    
    const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    }, []);
    
    const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    }, []);
    
    const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            const file = e.dataTransfer.files[0];
            
            // Check if file is PDF
            if (file.type !== 'application/pdf') {
                alert('Only PDF files are allowed');
                return;
            }
            
            // Check file size (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                alert('File size exceeds 5MB limit');
                return;
            }
            
            setSelectedFile(file);
            setData('file', file);
        }
    }, [setData]);

    const handleCategoryChange = (value: string) => {
        setData('category', value as 'Government_Documents' | 'Company_Documents' | 'Infractions' | 'Other');
    };
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(`/employee/${employeeId}/documents`, {
            preserveScroll: true,
            onSuccess: () => {
                reset();
                setSelectedFile(null);
                onOpenChange(false);
            },
        });
    };

    const handleClose = () => {
        reset();
        setSelectedFile(null);
        clearErrors();
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Upload Document</DialogTitle>
                    <DialogDescription>
                        Upload a new document for this employee. Only PDF files are accepted.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="file">Document</Label>
                        <div 
                            className={`border-2 border-dashed rounded-md p-6 text-center transition-colors duration-200 
                                ${isDragging ? 'border-primary bg-primary/5' : 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-slate-800'}`}
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                        >
                            {selectedFile ? (
                                <div className="flex flex-col items-center">
                                    <UploadCloud className="w-10 h-10 text-primary mb-2" />
                                    <p className="text-sm text-foreground font-medium">{selectedFile.name}</p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                                    </p>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className="mt-3"
                                        onClick={() => {
                                            setSelectedFile(null);
                                            setData('file', null);
                                        }}
                                    >
                                        Change File
                                    </Button>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center">
                                    <UploadCloud className="w-10 h-10 text-muted-foreground mb-2" />
                                    <p className="text-sm text-foreground font-medium">Drag & Drop your file here</p>
                                    <p className="text-xs text-muted-foreground mt-1 mb-3">or</p>
                                    <input
                                        id="file"
                                        type="file"
                                        accept=".pdf"
                                        onChange={handleFileChange}
                                        className="hidden"
                                        ref={fileInputRef}
                                    />
                                    <Button 
                                        type="button" 
                                        variant="outline" 
                                        size="sm"
                                        onClick={() => fileInputRef.current?.click()}
                                    >
                                        Choose file
                                    </Button>
                                    <p className="text-xs text-muted-foreground mt-3">Max size: 5MB, PDF only</p>
                                </div>
                            )}
                        </div>
                        {errors.file && <p className="text-sm text-red-500">{errors.file}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="category">Categories</Label>
                        <Select
                            value={data.category}
                            onValueChange={handleCategoryChange}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Government_Documents">Government Documents</SelectItem>
                                <SelectItem value="Company_Documents">Company Documents</SelectItem>
                                <SelectItem value="Infractions">Infractions</SelectItem>
                                <SelectItem value="Other">Other</SelectItem>
                            </SelectContent>
                        </Select>
                        {errors.category && <p className="text-sm text-red-500">{errors.category}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="remarks">Remarks (optional)</Label>
                        <Textarea
                            id="remarks"
                            placeholder="Add any notes or comments about this document"
                            value={data.remarks}
                            onChange={handleRemarksChange}
                            maxLength={30}
                        />
                        <p className="text-xs text-muted-foreground">Max 10 words or 30 characters</p>
                    </div>

                    <DialogFooter>
                        <Button 
                            type="button" 
                            variant="outline" 
                            onClick={handleClose}
                            disabled={processing}
                        >
                            Cancel
                        </Button>
                        <Button 
                            type="submit"
                            disabled={processing || !selectedFile}
                        >
                            {processing ? 'Uploading...' : 'Upload File'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
