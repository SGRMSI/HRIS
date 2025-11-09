import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Link } from '@inertiajs/react';
import { Award, Cake, Calendar, PartyPopper } from 'lucide-react';

interface UpcomingEvent {
    id: number;
    type: 'holiday' | 'birthday' | 'anniversary';
    title: string;
    date: string;
    description?: string;
    employee?: {
        id: number;
        name: string;
        avatar?: string;
    };
    company?: {
        name: string;
    };
}

interface UpcomingEventsProps {
    events: UpcomingEvent[];
}

export function UpcomingEvents({ events }: UpcomingEventsProps) {
    const getEventIcon = (type: string) => {
        switch (type) {
            case 'holiday':
                return <Calendar className="h-4 w-4" />;
            case 'birthday':
                return <Cake className="h-4 w-4" />;
            case 'anniversary':
                return <Award className="h-4 w-4" />;
            default:
                return <PartyPopper className="h-4 w-4" />;
        }
    };

    const getEventColor = (type: string) => {
        switch (type) {
            case 'holiday':
                return 'bg-blue-50 text-blue-600 border-blue-200';
            case 'birthday':
                return 'bg-pink-50 text-pink-600 border-pink-200';
            case 'anniversary':
                return 'bg-purple-50 text-purple-600 border-purple-200';
            default:
                return 'bg-gray-50 text-gray-600 border-gray-200';
        }
    };

    const getBadgeVariant = (type: string) => {
        switch (type) {
            case 'holiday':
                return 'default';
            case 'birthday':
                return 'secondary';
            case 'anniversary':
                return 'outline';
            default:
                return 'outline';
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        if (date.toDateString() === today.toDateString()) {
            return 'Today';
        } else if (date.toDateString() === tomorrow.toDateString()) {
            return 'Tomorrow';
        } else {
            return date.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined,
            });
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <PartyPopper className="h-5 w-5" />
                    Upcoming Events
                </CardTitle>
                <CardDescription>Holidays, birthdays, and anniversaries</CardDescription>
            </CardHeader>
            <CardContent>
                {events.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                        <Calendar className="mb-3 h-12 w-12 text-gray-300" />
                        <p className="text-sm text-muted-foreground">No upcoming events in the next 30 days</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {events.map((event) => (
                            <div
                                key={`${event.type}-${event.id}`}
                                className={`rounded-lg border p-3 ${getEventColor(event.type)} transition-all hover:shadow-md`}
                            >
                                <div className="flex items-start gap-3">
                                    <div className="mt-0.5">{getEventIcon(event.type)}</div>
                                    <div className="min-w-0 flex-1">
                                        <div className="mb-1 flex items-start justify-between gap-2">
                                            <div className="flex-1">
                                                {event.employee ? (
                                                    <Link
                                                        href={route('employee.show', event.employee.id)}
                                                        className="text-sm font-semibold hover:underline"
                                                    >
                                                        {event.title}
                                                    </Link>
                                                ) : (
                                                    <p className="text-sm font-semibold">{event.title}</p>
                                                )}
                                                {event.description && <p className="mt-0.5 text-xs text-muted-foreground">{event.description}</p>}
                                                {event.company && <p className="mt-0.5 text-xs text-muted-foreground">{event.company.name}</p>}
                                            </div>
                                            <Badge variant={getBadgeVariant(event.type)} className="shrink-0">
                                                {event.type.charAt(0).toUpperCase() + event.type.slice(1)}
                                            </Badge>
                                        </div>
                                        <p className="text-xs font-medium">{formatDate(event.date)}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
