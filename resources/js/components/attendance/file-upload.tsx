import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Upload, FileSpreadsheet, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FileUploadProps {
    onFileSelect: (file: File) => void;
    accept?: string;
    maxSize?: number; // in MB
    className?: string;
}

export function FileUpload({ 
    onFileSelect, 
    accept = '.xlsx,.xls,.csv', 
    maxSize = 10,
    className 
}: FileUploadProps) {
    const [isDragging, setIsDragging] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const validateFile = (file: File): string | null => {
        // Check file size
        const fileSizeMB = file.size / (1024 * 1024);
        if (fileSizeMB > maxSize) {
            return `File size must be less than ${maxSize}MB`;
        }

        // Check file type
        const allowedTypes = accept.split(',').map(t => t.trim());
        const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
        if (!allowedTypes.includes(fileExtension)) {
            return `Only ${allowedTypes.join(', ')} files are allowed`;
        }

        return null;
    };

    const handleFile = (file: File) => {
        setError(null);
        
        const validationError = validateFile(file);
        if (validationError) {
            setError(validationError);
            return;
        }

        setSelectedFile(file);
        onFileSelect(file);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);

        const files = Array.from(e.dataTransfer.files);
        if (files.length > 0) {
            handleFile(files[0]);
        }
    };

    const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            handleFile(files[0]);
        }
    };

    const handleClear = () => {
        setSelectedFile(null);
        setError(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    return (
        <div className={cn('w-full', className)}>
            <input
                ref={fileInputRef}
                type="file"
                accept={accept}
                onChange={handleFileInput}
                className="hidden"
            />

            {!selectedFile ? (
                <Card
                    className={cn(
                        'border-2 border-dashed transition-colors cursor-pointer',
                        isDragging && 'border-primary bg-primary/5',
                        error && 'border-destructive'
                    )}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                >
                    <CardContent className="flex flex-col items-center justify-center py-10 text-center">
                        <Upload className={cn(
                            'h-12 w-12 mb-4',
                            isDragging ? 'text-primary' : 'text-muted-foreground'
                        )} />
                        <p className="text-sm font-medium mb-1">
                            Drop your attendance file here, or click to browse
                        </p>
                        <p className="text-xs text-muted-foreground">
                            Supports {accept} (Max {maxSize}MB)
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <Card className="border-2 border-primary">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <FileSpreadsheet className="h-10 w-10 text-primary" />
                                <div>
                                    <p className="font-medium text-sm">{selectedFile.name}</p>
                                    <p className="text-xs text-muted-foreground">
                                        {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                                    </p>
                                </div>
                            </div>
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleClear();
                                }}
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {error && (
                <p className="text-sm text-destructive mt-2">{error}</p>
            )}
        </div>
    );
}
