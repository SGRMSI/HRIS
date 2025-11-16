import { useState } from 'react';
import { router, usePage } from '@inertiajs/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    CalendarIcon,
    User,
    Building2,
    CheckCircle2,
    XCircle,
    CheckSquare,
    Square,
    AlertCircle,
    ChevronLeft,
    ChevronRight,
    CheckCheck,
} from 'lucide-react';

interface Employee {
    id: number;
    name: string;
    id_number: string;
    department: string | null;
    company: string | null;
}

interface Shift {
    id?: number;
    name: string;
    time_in: string;
    time_out: string;
}

interface AbsenceRecord {
    employee_id: number;
    employee: Employee;
    date: string;
    shift_id: number | null;
    shift: Shift | null;
    status: string;
    remarks: string | null;
    approved_by: string | null;
    approved_at: string | null;
    can_approve: boolean;
}

interface Props {
    absences: {
        data: AbsenceRecord[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
    totalPendingAbsences?: number;
}

export function AbsencesTable({ absences, totalPendingAbsences }: Props) {
    const { props } = usePage<any>();
    const filters = props.filters || {};
    const [selectedAbsences, setSelectedAbsences] = useState<{employee_id: number; date: string; shift_id: number | null}[]>([]);
    const [selectingAll, setSelectingAll] = useState(false);
    const [showApproveModal, setShowApproveModal] = useState(false);
    const [showDenyModal, setShowDenyModal] = useState(false);
    const [singleAbsenceData, setSingleAbsenceData] = useState<{employee_id: number; date: string; shift_id: number | null; employee_name: string} | null>(null);
    const [bulkProcessing, setBulkProcessing] = useState(false);
    const [modalType, setModalType] = useState<'approve' | 'deny'>('approve');

    const formatDate = (date: string) => {
        try {
            const d = new Date(date);
            const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            return `${monthNames[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
        } catch {
            return date;
        }
    };

    const formatTime = (time: string) => {
        try {
            const [hours, minutes] = time.split(':');
            const hour12 = parseInt(hours) % 12 || 12;
            const ampm = parseInt(hours) >= 12 ? 'PM' : 'AM';
            return `${hour12}:${minutes} ${ampm}`;
        } catch {
            return time;
        }
    };

    const handleSelectOne = (employee_id: number, date: string, shift_id: number | null, checked: boolean) => {
        if (checked) {
            setSelectedAbsences([...selectedAbsences, { employee_id, date, shift_id }]);
        } else {
            setSelectedAbsences(selectedAbsences.filter(
                a => !(a.employee_id === employee_id && a.date === date)
            ));
        }
    };

    const handleSelectAll = () => {
        const allAbsences = (absences?.data || [])
            .filter(a => a.can_approve)
            .map(a => ({ employee_id: a.employee_id, date: a.date, shift_id: a.shift_id }));
        setSelectedAbsences(allAbsences);
    };

    const handleSelectAllAcrossPages = () => {
        setSelectingAll(true);
        // This would require a backend endpoint to fetch all absence IDs
        // For now, we'll select all on current page and show a message
        router.get(
            route('attendance.final.index'),
            {
                ...filters,
                get_all_absence_ids: true,
            },
            {
                preserveState: true,
                preserveScroll: true,
                only: ['allAbsenceIds'],
                onSuccess: (page: any) => {
                    if (page.props.allAbsenceIds) {
                        setSelectedAbsences(page.props.allAbsenceIds);
                    }
                    setSelectingAll(false);
                },
                onError: () => {
                    setSelectingAll(false);
                    toast.error('Failed to select all absences');
                }
            }
        );
    };

    const handleDeselectAll = () => {
        setSelectedAbsences([]);
    };

    const handleBulkApprove = () => {
        if (selectedAbsences.length === 0) {
            toast.error('Please select absences to approve');
            return;
        }
        setModalType('approve');
        setSingleAbsenceData(null);
        setShowApproveModal(true);
    };

    const handleBulkReject = () => {
        if (selectedAbsences.length === 0) {
            toast.error('Please select absences to reject');
            return;
        }
        setModalType('deny');
        setSingleAbsenceData(null);
        setShowDenyModal(true);
    };

    const handleApproveAbsence = (employee_id: number, date: string, shift_id: number | null, employee_name: string) => {
        setModalType('approve');
        setSingleAbsenceData({ employee_id, date, shift_id, employee_name });
        setShowApproveModal(true);
    };

    const handleDenyAbsence = (employee_id: number, date: string, employee_name: string) => {
        setModalType('deny');
        setSingleAbsenceData({ employee_id, date, shift_id: null, employee_name });
        setShowDenyModal(true);
    };

    const handleApproveConfirm = () => {
        setBulkProcessing(true);
        
        if (singleAbsenceData) {
            // Single approval
            router.post(
                route('attendance.final.absences.approve'),
                {
                    employee_id: singleAbsenceData.employee_id,
                    date: singleAbsenceData.date,
                    shift_id: singleAbsenceData.shift_id,
                },
                {
                    preserveScroll: true,
                    preserveState: true,
                    onFinish: () => {
                        setBulkProcessing(false);
                        setShowApproveModal(false);
                        setSingleAbsenceData(null);
                    },
                }
            );
        } else {
            // Bulk approval
            router.post(
                route('attendance.final.absences.bulk-approve'),
                { absences: selectedAbsences },
                {
                    preserveScroll: true,
                    preserveState: true,
                    onFinish: () => {
                        setBulkProcessing(false);
                        setShowApproveModal(false);
                        setSelectedAbsences([]);
                    },
                }
            );
        }
    };

    const handleDenyConfirm = () => {
        setBulkProcessing(true);
        
        if (singleAbsenceData) {
            // Single denial
            router.post(
                route('attendance.final.absences.deny'),
                {
                    employee_id: singleAbsenceData.employee_id,
                    date: singleAbsenceData.date,
                    shift_id: singleAbsenceData.shift_id,
                },
                {
                    preserveScroll: true,
                    preserveState: true,
                    onFinish: () => {
                        setBulkProcessing(false);
                        setShowDenyModal(false);
                        setSingleAbsenceData(null);
                    },
                }
            );
        } else {
            // Bulk denial
            router.post(
                route('attendance.final.absences.bulk-reject'),
                { absences: selectedAbsences },
                {
                    preserveScroll: true,
                    preserveState: true,
                    onFinish: () => {
                        setBulkProcessing(false);
                        setShowDenyModal(false);
                        setSelectedAbsences([]);
                    },
                }
            );
        }
    };

    const isSelected = (employee_id: number, date: string) => {
        return selectedAbsences.some(a => a.employee_id === employee_id && a.date === date);
    };

    return (
        <>
            {/* Bulk Actions Bar */}
            {selectedAbsences.length > 0 && (
                <div className="border border-blue-300 bg-gradient-to-r from-blue-50 to-indigo-50 shadow-sm rounded-lg p-3 mb-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-blue-200">
                                <CheckSquare className="h-4 w-4 text-blue-600" />
                                <span className="text-sm font-semibold text-blue-900">
                                    {selectedAbsences.length} absence{selectedAbsences.length !== 1 ? 's' : ''} selected
                                </span>
                            </div>
                            <Button
                                onClick={handleDeselectAll}
                                variant="ghost"
                                size="sm"
                                className="text-gray-600 hover:text-gray-900 h-8"
                            >
                                <Square className="h-4 w-4 mr-1" />
                                Deselect All
                            </Button>
                        </div>
                        <div className="flex gap-2">
                            <Button
                                onClick={handleBulkReject}
                                disabled={bulkProcessing}
                                variant="destructive"
                                className="h-9"
                            >
                                <XCircle className="h-4 w-4 mr-2" />
                                {bulkProcessing ? 'Denying...' : `Deny ${selectedAbsences.length} Absence${selectedAbsences.length !== 1 ? 's' : ''}`}
                            </Button>
                            <Button
                                onClick={handleBulkApprove}
                                disabled={bulkProcessing}
                                className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg h-9"
                            >
                                <CheckCircle2 className="h-4 w-4 mr-2" />
                                {bulkProcessing ? 'Approving...' : `Approve ${selectedAbsences.length} Absence${selectedAbsences.length !== 1 ? 's' : ''}`}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {absences?.data && absences.data.length > 0 && absences.data.filter(a => a.can_approve).length > 0 && selectedAbsences.length === 0 && (
                <div className="border border-orange-200 bg-gradient-to-r from-orange-50 to-amber-50 rounded-lg p-3 mb-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <AlertCircle className="h-4 w-4 text-orange-600" />
                            <div>
                                <p className="text-sm font-medium text-orange-900">
                                    {absences.total} pending absence{absences.total !== 1 ? 's' : ''} need review
                                </p>
                                <p className="text-xs text-orange-700 mt-0.5">
                                    {(absences?.data || []).filter(a => a.can_approve).length} on this page
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <Button
                                onClick={handleSelectAll}
                                variant="outline"
                                size="sm"
                                className="border-orange-300 text-orange-700 hover:bg-orange-100 hover:text-orange-900 h-8"
                            >
                                <CheckCheck className="h-4 w-4 mr-1" />
                                This Page
                            </Button>
                            <Button
                                onClick={handleSelectAllAcrossPages}
                                variant="default"
                                size="sm"
                                className="bg-orange-600 hover:bg-orange-700 text-white h-8"
                                disabled={selectingAll}
                            >
                                <CheckSquare className="h-4 w-4 mr-1" />
                                {selectingAll ? 'Loading...' : `All ${absences.total} Absences`}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            <Card>
                <CardHeader>
                    <CardTitle className="text-xl">Absences</CardTitle>
                    <CardDescription>
                        Employees with scheduled shifts but no attendance record ({absences?.total || 0} total)
                    </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    {!absences?.data || absences.data.length === 0 ? (
                        <div className="py-12 text-center text-gray-500">
                            <CheckCircle2 className="h-12 w-12 mx-auto mb-4 opacity-50 text-green-500" />
                            <p className="font-medium">No absences found</p>
                            <p className="text-sm mt-2">All scheduled employees have attendance records</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-12">Select</TableHead>
                                        <TableHead>Employee</TableHead>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Shift</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Approval</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {(absences?.data || []).map((absence, index) => (
                                        <TableRow key={`${absence.employee_id}-${absence.date}`}>
                                            <TableCell>
                                                {absence.can_approve && (
                                                    <Checkbox
                                                        checked={isSelected(absence.employee_id, absence.date)}
                                                        onCheckedChange={(checked) => 
                                                            handleSelectOne(absence.employee_id, absence.date, absence.shift_id, !!checked)
                                                        }
                                                    />
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <User className="h-4 w-4 text-gray-400" />
                                                        <span className="font-medium">{absence.employee.name}</span>
                                                    </div>
                                                    <div className="text-xs text-gray-500 mt-1 ml-6">
                                                        {absence.employee.id_number} • {absence.employee.department}
                                                    </div>
                                                    <div className="text-xs text-gray-400 ml-6">
                                                        <Building2 className="h-3 w-3 inline mr-1" />
                                                        {absence.employee.company}
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <CalendarIcon className="h-4 w-4 text-gray-400" />
                                                    <span className="text-sm">{formatDate(absence.date)}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                {absence.shift ? (
                                                    <div>
                                                        <p className="text-sm font-medium">{absence.shift.name}</p>
                                                        <p className="text-xs text-gray-500">
                                                            {formatTime(absence.shift.time_in)} - {formatTime(absence.shift.time_out)}
                                                        </p>
                                                    </div>
                                                ) : (
                                                    <span className="text-sm text-gray-400">No shift</span>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="destructive">Absent</Badge>
                                            </TableCell>
                                            <TableCell>
                                                {absence.approved_by ? (
                                                    <div>
                                                        {absence.remarks === 'Denied' ? (
                                                            <Badge variant="destructive">Denied</Badge>
                                                        ) : (
                                                            <Badge variant="default" className="bg-green-600">Approved</Badge>
                                                        )}
                                                        <p className="text-xs text-gray-500 mt-1">by {absence.approved_by}</p>
                                                    </div>
                                                ) : (
                                                    <Badge variant="outline" className="border-orange-600 text-orange-600">Pending</Badge>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {absence.can_approve ? (
                                                    <div className="flex gap-2 justify-end">
                                                        <Button
                                                            onClick={() => handleApproveAbsence(
                                                                absence.employee_id,
                                                                absence.date,
                                                                absence.shift_id,
                                                                absence.employee.name
                                                            )}
                                                            size="sm"
                                                            variant="default"
                                                            className="bg-green-600 hover:bg-green-700"
                                                        >
                                                            <CheckCircle2 className="h-3 w-3 mr-1" />
                                                            Approve
                                                        </Button>
                                                        <Button
                                                            onClick={() => handleDenyAbsence(
                                                                absence.employee_id,
                                                                absence.date,
                                                                absence.employee.name
                                                            )}
                                                            size="sm"
                                                            variant="destructive"
                                                        >
                                                            <XCircle className="h-3 w-3 mr-1" />
                                                            Deny
                                                        </Button>
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-gray-400">No actions</span>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Pagination */}
            {absences && absences.last_page > 1 && (
                <div className="flex items-center justify-between px-2 py-4">
                    <div className="text-sm text-muted-foreground">
                        Showing {((absences.current_page - 1) * absences.per_page) + 1} to{' '}
                        {Math.min(absences.current_page * absences.per_page, absences.total)} of{' '}
                        {absences.total} absences
                    </div>
                    <div className="flex items-center space-x-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.get(route('attendance.final.index'), {
                                ...filters,
                                absences_page: absences.current_page - 1
                            })}
                            disabled={absences.current_page === 1}
                        >
                            <ChevronLeft className="h-4 w-4 mr-1" />
                            Previous
                        </Button>
                        <div className="text-sm">
                            Page {absences.current_page} of {absences.last_page}
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.get(route('attendance.final.index'), {
                                ...filters,
                                absences_page: absences.current_page + 1
                            })}
                            disabled={absences.current_page === absences.last_page}
                        >
                            Next
                            <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                    </div>
                </div>
            )}

            {/* Approve Confirmation Modal */}
            <Dialog open={showApproveModal} onOpenChange={setShowApproveModal}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Approve Absence{singleAbsenceData ? '' : 's'}</DialogTitle>
                        <DialogDescription>
                            {singleAbsenceData
                                ? `Are you sure you want to approve the absence for ${singleAbsenceData.employee_name} on ${formatDate(singleAbsenceData.date)}? This will create an attendance record with status "Absent".`
                                : `Are you sure you want to approve ${selectedAbsences.length} absence${selectedAbsences.length !== 1 ? 's' : ''}? This will create attendance records with status "Absent" for each selected absence.`
                            }
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setShowApproveModal(false)}
                            disabled={bulkProcessing}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleApproveConfirm}
                            disabled={bulkProcessing}
                            className="bg-green-600 hover:bg-green-700"
                        >
                            <CheckCircle2 className="h-4 w-4 mr-2" />
                            {bulkProcessing ? 'Approving...' : 'Approve'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Deny Confirmation Modal */}
            <Dialog open={showDenyModal} onOpenChange={setShowDenyModal}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Deny Absence{singleAbsenceData ? '' : 's'}</DialogTitle>
                        <DialogDescription>
                            {singleAbsenceData
                                ? `Are you sure you want to deny the absence for ${singleAbsenceData.employee_name} on ${formatDate(singleAbsenceData.date)}? This will create an attendance record marked as "Denied" in the absences table.`
                                : `Are you sure you want to deny ${selectedAbsences.length} absence${selectedAbsences.length !== 1 ? 's' : ''}? This will create attendance records marked as "Denied" in the absences table for each selected absence.`
                            }
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setShowDenyModal(false)}
                            disabled={bulkProcessing}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleDenyConfirm}
                            disabled={bulkProcessing}
                            variant="destructive"
                        >
                            <XCircle className="h-4 w-4 mr-2" />
                            {bulkProcessing ? 'Denying...' : 'Deny'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
