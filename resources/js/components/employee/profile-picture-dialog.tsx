import React, { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { useForm, router } from '@inertiajs/react';
import { UploadCloud, Image as ImageIcon, Eye, Trash2 } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface ProfilePictureDialogProps {
    employeeId: number;
    employeeName: string;
    currentProfilePicture?: string | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function ProfilePictureDialog({ 
    employeeId, 
    employeeName,
    currentProfilePicture,
    open, 
    onOpenChange 
}: ProfilePictureDialogProps) {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    const { setData, post, processing, errors, reset, clearErrors } = useForm({
        profile_picture: null as File | null,
    });

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const file = e.target.files[0];
            
            // Validate file type
            if (!file.type.match(/^image\/(png|jpeg|jpg)$/)) {
                alert('Only PNG or JPG files are allowed');
                return;
            }
            
            // Validate file size (max 2MB)
            if (file.size > 2 * 1024 * 1024) {
                alert('File size exceeds 2MB limit');
                return;
            }
            
            setSelectedFile(file);
            setData('profile_picture', file);
            
            // Create preview
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviewUrl(reader.result as string);
            };
            reader.readAsDataURL(file);
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
            
            // Validate file type
            if (!file.type.match(/^image\/(png|jpeg|jpg)$/)) {
                alert('Only PNG or JPG files are allowed');
                return;
            }
            
            // Validate file size (max 2MB)
            if (file.size > 2 * 1024 * 1024) {
                alert('File size exceeds 2MB limit');
                return;
            }
            
            setSelectedFile(file);
            setData('profile_picture', file);
            
            // Create preview
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviewUrl(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    }, [setData]);

    const handleUpload = (e: React.FormEvent) => {
        e.preventDefault();
        post(`/employee/${employeeId}/profile-picture`, {
            preserveScroll: true,
            onSuccess: () => {
                reset();
                setSelectedFile(null);
                setPreviewUrl(null);
                onOpenChange(false);
            },
        });
    };

    const handleDelete = () => {
        if (confirm('Are you sure you want to delete the profile picture?')) {
            router.delete(`/employee/${employeeId}/profile-picture`, {
                preserveScroll: true,
                onSuccess: () => {
                    onOpenChange(false);
                },
            });
        }
    };

    const handleView = () => {
        if (currentProfilePicture) {
            window.open(`/employee/${employeeId}/profile-picture/view`, '_blank');
        }
    };

    const handleClose = () => {
        reset();
        setSelectedFile(null);
        setPreviewUrl(null);
        clearErrors();
        onOpenChange(false);
    };

    // Generate initials from employee name
    const getInitials = (fullName: string) => {
        const nameParts = fullName.split(' ');
        const firstName = nameParts[0] || '';
        const lastName = nameParts[nameParts.length - 1] || '';
        return (firstName.charAt(0) + lastName.charAt(0)).toUpperCase();
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Profile Picture Management</DialogTitle>
                    <DialogDescription>
                        Upload, view, or delete the employee's profile picture. Only PNG or JPG files are allowed, with a maximum size of 2MB.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    {/* Current Profile Picture Preview */}
                    <div className="flex flex-col items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-slate-800">
                        <Label className="text-sm font-medium">Current Profile Picture</Label>
                        {currentProfilePicture ? (
                            <img
                                src={`/employee/${employeeId}/profile-picture/view`}
                                alt={employeeName}
                                className="h-24 w-24 rounded-full object-cover border-2 border-gray-300"
                            />
                        ) : (
                            <Avatar className="h-24 w-24 overflow-hidden rounded-full">
                                <AvatarFallback className="bg-gradient-to-br from-purple-400 via-pink-400 to-blue-400 text-2xl font-bold text-white">
                                    {getInitials(employeeName)}
                                </AvatarFallback>
                            </Avatar>
                        )}
                        {currentProfilePicture && (
                            <div className="flex gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={handleView}
                                    className="flex items-center gap-2"
                                >
                                    <Eye className="h-4 w-4" />
                                    View
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setShowDeleteDialog(true)}
                                    className="flex items-center gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950"
                                >
                                    <Trash2 className="h-4 w-4" />
                                    Delete
                                </Button>
                            </div>
                        )}
                    </div>

                    {/* Upload New Picture Section */}
                    <form onSubmit={handleUpload} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="file">Add New Profile Picture</Label>
                            <div 
                                className={`border-2 border-dashed rounded-md p-6 text-center transition-colors duration-200 
                                    ${isDragging ? 'border-primary bg-primary/5' : 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-slate-800'}`}
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                                onDrop={handleDrop}
                            >
                                {selectedFile && previewUrl ? (
                                    <div className="flex flex-col items-center">
                                        <img 
                                            src={previewUrl} 
                                            alt="Preview" 
                                            className="mb-3 h-32 w-32 rounded-full object-cover"
                                        />
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
                                                setPreviewUrl(null);
                                                setData('profile_picture', null);
                                            }}
                                        >
                                            Change File
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center">
                                        <UploadCloud className="w-10 h-10 text-muted-foreground mb-2" />
                                        <p className="text-sm text-foreground font-medium">Drag & Drop your image here</p>
                                        <p className="text-xs text-muted-foreground mt-1 mb-3">or</p>
                                        <input
                                            id="file"
                                            type="file"
                                            accept="image/png,image/jpeg,image/jpg"
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
                                            <ImageIcon className="mr-2 h-4 w-4" />
                                            Choose Image
                                        </Button>
                                        <p className="text-xs text-muted-foreground mt-3">Max size: 2MB, PNG or JPG only</p>
                                    </div>
                                )}
                            </div>
                            {errors.profile_picture && <p className="text-sm text-red-500">{errors.profile_picture}</p>}
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
                                {processing ? 'Uploading...' : 'Upload Picture'}
                            </Button>
                        </DialogFooter>
                    </form>
                </div>
            </DialogContent>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Profile Picture</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete this profile picture? This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </Dialog>
    );
}
