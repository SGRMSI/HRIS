import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

type AttendanceStatus = 'present' | 'late' | 'absent' | 'on_leave' | 'holiday';
type BatchStatus = 'uploaded' | 'processing' | 'processed' | 'failed';

interface StatusBadgeProps {
    status: AttendanceStatus | BatchStatus | string;
    className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
    const getStatusConfig = (status: string) => {
        const statusLower = status.toLowerCase();
        
        // Attendance statuses
        if (statusLower === 'present') {
            return { variant: 'default' as const, label: 'Present', className: 'bg-green-500 hover:bg-green-600' };
        }
        if (statusLower === 'late') {
            return { variant: 'default' as const, label: 'Late', className: 'bg-yellow-500 hover:bg-yellow-600' };
        }
        if (statusLower === 'absent') {
            return { variant: 'destructive' as const, label: 'Absent' };
        }
        if (statusLower === 'on_leave' || statusLower === 'leave') {
            return { variant: 'secondary' as const, label: 'On Leave' };
        }
        if (statusLower === 'holiday') {
            return { variant: 'outline' as const, label: 'Holiday', className: 'bg-blue-50 text-blue-700 border-blue-200' };
        }
        
        // Batch statuses
        if (statusLower === 'uploaded') {
            return { variant: 'outline' as const, label: 'Uploaded', className: 'bg-slate-50' };
        }
        if (statusLower === 'processing') {
            return { variant: 'default' as const, label: 'Processing', className: 'bg-blue-500 hover:bg-blue-600' };
        }
        if (statusLower === 'processed') {
            return { variant: 'default' as const, label: 'Processed', className: 'bg-green-500 hover:bg-green-600' };
        }
        if (statusLower === 'failed') {
            return { variant: 'destructive' as const, label: 'Failed' };
        }
        
        // Default fallback
        return { variant: 'outline' as const, label: status, className: '' };
    };

    const config = getStatusConfig(status);

    return (
        <Badge 
            variant={config.variant} 
            className={cn('capitalize', config.className, className)}
        >
            {config.label}
        </Badge>
    );
}
