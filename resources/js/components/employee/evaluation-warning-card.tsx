import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, AlertTriangle, Clock } from 'lucide-react';

interface StatusCount {
    [key: string]: number;
}

interface EvaluationWarning {
    status: string;
    dueSoonCount: number;
    overdueCount: number;
}

interface EvaluationWarningCardProps {
    statusCounts: StatusCount;
    evaluationWarnings: EvaluationWarning[];
}

export function EvaluationWarningCard({ statusCounts, evaluationWarnings }: EvaluationWarningCardProps) {
    const totalStatuses = Object.keys(statusCounts).length;

    // Helper function to get warning for a specific status
    const getWarningForStatus = (status: string) => {
        return evaluationWarnings.find(w => w.status === status);
    };

    return (
        <Card className="transition-shadow hover:shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Employment Status</CardTitle>
                <div className="rounded-full bg-purple-100 p-2 dark:bg-purple-900/30">
                    <Users className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                </div>
            </CardHeader>
            <div className="px-6 pb-6">
                <div className="space-y-3">
                    {totalStatuses > 0 ? (
                        <div className="space-y-2">
                            {Object.entries(statusCounts).map(([status, count]) => {
                                const warning = getWarningForStatus(status);
                                const hasWarning = warning && (warning.dueSoonCount > 0 || warning.overdueCount > 0);
                                
                                return (
                                    <div key={status}>
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-medium text-muted-foreground">{status}</span>
                                            <span className="text-lg font-bold">{count}</span>
                                        </div>
                                        {hasWarning && (
                                            <div className="mt-1 space-y-1">
                                                {warning.overdueCount > 0 && (
                                                    <div className="flex items-center gap-1 text-xs text-red-600 dark:text-red-400">
                                                        <AlertTriangle className="h-3 w-3" />
                                                        <span>{warning.overdueCount} evaluation{warning.overdueCount > 1 ? 's' : ''} overdue</span>
                                                    </div>
                                                )}
                                                {warning.dueSoonCount > 0 && (
                                                    <div className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400">
                                                        <Clock className="h-3 w-3" />
                                                        <span>{warning.dueSoonCount} evaluation{warning.dueSoonCount > 1 ? 's' : ''} due soon</span>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <p className="text-sm text-muted-foreground">No employees yet</p>
                    )}
                </div>
            </div>
        </Card>
    );
}
