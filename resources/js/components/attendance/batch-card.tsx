import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { StatusBadge } from './status-badge';
import { FileText, Calendar, User, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BatchCardProps {
    batch: {
        id: number;
        filename: string;
        uploaded_at: string;
        uploaded_by: string;
        total_records: number;
        status: string;
    };
    className?: string;
}

export function BatchCard({ batch, className }: BatchCardProps) {
    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <Card className={cn('hover:shadow-md transition-shadow', className)}>
            <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-muted-foreground" />
                        <h3 className="font-semibold text-sm truncate max-w-[300px]">
                            {batch.filename}
                        </h3>
                    </div>
                    <StatusBadge status={batch.status} />
                </div>
            </CardHeader>
            <CardContent className="space-y-2">
                <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span className="text-xs">{formatDate(batch.uploaded_at)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <User className="h-4 w-4" />
                        <span className="text-xs">{batch.uploaded_by}</span>
                    </div>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground pt-2 border-t">
                    <Clock className="h-4 w-4" />
                    <span className="text-xs font-medium">
                        {batch.total_records.toLocaleString()} records
                    </span>
                </div>
            </CardContent>
        </Card>
    );
}
