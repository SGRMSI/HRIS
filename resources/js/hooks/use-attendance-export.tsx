import { useState } from 'react';
import { toast } from 'sonner';

interface ExportFilters {
    date_from?: string;
    date_to?: string;
    status?: string;
    employee_id?: number;
    company_id?: number;
    department_id?: number;
    shift_id?: number;
}

/**
 * Reusable hook for attendance export functionality
 * Following AI Agent Instructions: Common Integration Points #3 - Excel Processing
 */
export function useAttendanceExport() {
    const [isExporting, setIsExporting] = useState(false);

    /**
     * Export attendance data to Excel
     * Route: attendance.final.export (defined in routes/attendance.php)
     * Controller: AttendanceFinalController::export()
     */
    const exportToExcel = (filters?: ExportFilters) => {
        setIsExporting(true);

        try {
            // Build query parameters
            const params = new URLSearchParams();

            if (filters) {
                Object.entries(filters).forEach(([key, value]) => {
                    if (value !== undefined && value !== null && value !== '') {
                        params.append(key, value.toString());
                    }
                });
            }

            // Following AI Agent Instructions: Route Organization
            // Using attendance.final.export route from routes/attendance.php
            const url = route('attendance.final.export') + (params.toString() ? '?' + params.toString() : '');

            // Trigger download
            window.open(url, '_blank');

            // Following AI Agent Instructions: User feedback for async operations
            toast.success('Export started! Your download will begin shortly.');
        } catch (error) {
            console.error('Export failed:', error);
            toast.error('Failed to export attendance data. Please try again.');
        } finally {
            // Reset loading state after delay
            setTimeout(() => setIsExporting(false), 1000);
        }
    };

    return {
        isExporting,
        exportToExcel,
    };
}
