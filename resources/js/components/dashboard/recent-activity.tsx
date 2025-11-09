import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatDistanceToNow } from 'date-fns';
import { AlertCircle, Calendar, CheckCircle2, Clock, FileText, UserPlus } from 'lucide-react';
import { Component, ErrorInfo, ReactNode } from 'react';

interface Activity {
    id: number;
    description: string;
    subject_type: string;
    subject_id: number | null;
    causer: {
        name: string;
        avatar?: string;
    } | null;
    properties: Record<string, unknown>;
    created_at: string;
}

interface RecentActivityProps {
    activities: Activity[];
}

export function RecentActivity({ activities }: RecentActivityProps) {
    const getActivityIcon = (type: string) => {
        try {
            const lowerType = type.toLowerCase();
            if (lowerType.includes('employee')) return UserPlus;
            if (lowerType.includes('attendance')) return Clock;
            if (lowerType.includes('leave')) return Calendar;
            if (lowerType.includes('document')) return FileText;
            return CheckCircle2;
        } catch {
            return CheckCircle2;
        }
    };

    const getActivityColor = (type: string) => {
        try {
            const lowerType = type.toLowerCase();
            if (lowerType.includes('employee')) return 'text-blue-600';
            if (lowerType.includes('attendance')) return 'text-green-600';
            if (lowerType.includes('leave')) return 'text-yellow-600';
            if (lowerType.includes('document')) return 'text-purple-600';
            return 'text-gray-600';
        } catch {
            return 'text-gray-600';
        }
    };

    // Validate activities prop
    if (!Array.isArray(activities)) {
        console.error('RecentActivity: activities prop is not an array', activities);
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Clock className="h-5 w-5" />
                        Recent Activity
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center gap-2 py-8 text-sm text-muted-foreground">
                        <AlertCircle className="h-4 w-4" />
                        <p>Unable to load activity feed</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Recent Activity
                </CardTitle>
            </CardHeader>
            <CardContent>
                <ScrollArea className="h-[400px] pr-4">
                    <div className="space-y-4">
                        {activities.length === 0 ? (
                            <p className="py-8 text-center text-sm text-muted-foreground">No recent activity</p>
                        ) : (
                            activities.map((activity) => {
                                try {
                                    const Icon = getActivityIcon(activity.subject_type || '');
                                    const colorClass = getActivityColor(activity.subject_type || '');

                                    return (
                                        <div key={activity.id} className="flex gap-3">
                                            <div className={`mt-1 h-fit rounded-full bg-gray-100 p-2`}>
                                                <Icon className={`h-4 w-4 ${colorClass}`} />
                                            </div>
                                            <div className="flex-1 space-y-1">
                                                <p className="text-sm leading-none">{activity.description || 'Activity details unavailable'}</p>
                                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                    {activity.causer && (
                                                        <>
                                                            <span>by {activity.causer.name}</span>
                                                            <span>•</span>
                                                        </>
                                                    )}
                                                    <span>
                                                        {formatDistanceToNow(new Date(activity.created_at), {
                                                            addSuffix: true,
                                                        })}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                } catch (error) {
                                    console.error('Error rendering activity', activity, error);
                                    return null;
                                }
                            })
                        )}
                    </div>
                </ScrollArea>
            </CardContent>
        </Card>
    );
}

interface ErrorBoundaryProps {
    children: ReactNode;
    fallback?: ReactNode;
}

interface ErrorBoundaryState {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
    public state: ErrorBoundaryState = {
        hasError: false,
        error: null,
    };

    public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('ErrorBoundary caught an error:', error, errorInfo);
    }

    private handleReset = () => {
        this.setState({ hasError: false, error: null });
    };

    public render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <Card className="border-red-200 bg-red-50">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-red-700">
                            <AlertCircle className="h-5 w-5" />
                            Something went wrong
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-sm text-red-600">{this.state.error?.message || 'An unexpected error occurred'}</p>
                        <Button variant="outline" size="sm" onClick={this.handleReset} className="border-red-300 text-red-700 hover:bg-red-100">
                            Try Again
                        </Button>
                    </CardContent>
                </Card>
            );
        }

        return this.props.children;
    }
}
