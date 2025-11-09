import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Link } from '@inertiajs/react';
import { eachDayOfInterval, endOfMonth, format, getDay, isSameDay, isSameMonth, isToday, startOfMonth } from 'date-fns';
import { Award, Cake, Calendar, ChevronLeft, ChevronRight, PartyPopper } from 'lucide-react';
import { useState } from 'react';

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
    const [currentMonth, setCurrentMonth] = useState(new Date());

    const getEventIcon = (type: string) => {
        switch (type) {
            case 'holiday':
                return Calendar;
            case 'birthday':
                return Cake;
            case 'anniversary':
                return Award;
            default:
                return PartyPopper;
        }
    };

    const getEventColor = (type: string) => {
        switch (type) {
            case 'holiday':
                return 'bg-blue-100 text-blue-700 hover:bg-blue-200';
            case 'birthday':
                return 'bg-pink-100 text-pink-700 hover:bg-pink-200';
            case 'anniversary':
                return 'bg-purple-100 text-purple-700 hover:bg-purple-200';
            default:
                return 'bg-gray-100 text-gray-700 hover:bg-gray-200';
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

    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

    // Get events for a specific day
    const getEventsForDay = (day: Date) => {
        return events.filter((event) => isSameDay(new Date(event.date), day));
    };

    // Calculate calendar grid start (include previous month days to fill first week)
    const firstDayOfMonth = getDay(monthStart);
    const daysFromPrevMonth = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1; // Adjust for Monday start

    const calendarDays: Date[] = [];

    // Add days from previous month
    for (let i = daysFromPrevMonth; i > 0; i--) {
        const day = new Date(monthStart);
        day.setDate(day.getDate() - i);
        calendarDays.push(day);
    }

    // Add current month days
    calendarDays.push(...monthDays);

    // Add days from next month to complete the grid (ensure 6 weeks)
    const remainingDays = 42 - calendarDays.length; // 6 rows × 7 days = 42
    for (let i = 1; i <= remainingDays; i++) {
        const day = new Date(monthEnd);
        day.setDate(day.getDate() + i);
        calendarDays.push(day);
    }

    const previousMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
    };

    const nextMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
    };

    const goToToday = () => {
        setCurrentMonth(new Date());
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <PartyPopper className="h-5 w-5" />
                            Upcoming Events
                        </CardTitle>
                        <CardDescription>Holidays, birthdays, and anniversaries</CardDescription>
                    </div>
                    <Button variant="outline" size="sm" onClick={goToToday}>
                        Today
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                {/* Calendar Header */}
                <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-lg font-semibold">{format(currentMonth, 'MMMM yyyy')}</h3>
                    <div className="flex gap-1">
                        <Button variant="outline" size="icon" onClick={previousMonth}>
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="icon" onClick={nextMonth}>
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                {/* Calendar Grid */}
                <div className="grid grid-cols-7 gap-1">
                    {/* Day headers */}
                    {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
                        <div key={day} className="p-2 text-center text-xs font-semibold text-muted-foreground">
                            {day}
                        </div>
                    ))}

                    {/* Calendar days */}
                    {calendarDays.map((day, idx) => {
                        const dayEvents = getEventsForDay(day);
                        const isCurrentMonth = isSameMonth(day, currentMonth);
                        const isTodayDate = isToday(day);
                        const hasEvents = dayEvents.length > 0;

                        return (
                            <Popover key={idx}>
                                <PopoverTrigger asChild>
                                    <div
                                        className={`min-h-[80px] cursor-pointer rounded-md border p-1 transition-colors ${
                                            !isCurrentMonth ? 'bg-gray-50 text-muted-foreground' : 'bg-white'
                                        } ${isTodayDate ? 'border-blue-500 bg-blue-50' : 'border-gray-200'} ${
                                            hasEvents ? 'hover:border-gray-400 hover:shadow-sm' : ''
                                        }`}
                                    >
                                        <div className={`mb-1 text-xs font-medium ${isTodayDate ? 'text-blue-600' : ''}`}>{format(day, 'd')}</div>
                                        <div className="space-y-1">
                                            {dayEvents.slice(0, 2).map((event) => {
                                                const Icon = getEventIcon(event.type);
                                                return (
                                                    <div
                                                        key={`${event.type}-${event.id}`}
                                                        className={`flex items-center gap-1 rounded px-1 py-0.5 text-xs ${getEventColor(event.type)}`}
                                                    >
                                                        <Icon className="h-3 w-3 shrink-0" />
                                                        <span className="truncate">{event.title}</span>
                                                    </div>
                                                );
                                            })}
                                            {dayEvents.length > 2 && (
                                                <div className="text-xs text-muted-foreground">+{dayEvents.length - 2} more</div>
                                            )}
                                        </div>
                                    </div>
                                </PopoverTrigger>
                                {hasEvents && (
                                    <PopoverContent className="w-80" align="start" side="top">
                                        <div className="space-y-3">
                                            <div className="border-b pb-2">
                                                <h4 className="font-semibold">{format(day, 'EEEE, MMMM d, yyyy')}</h4>
                                                <p className="text-xs text-muted-foreground">{dayEvents.length} event(s)</p>
                                            </div>
                                            <div className="space-y-2">
                                                {dayEvents.map((event) => {
                                                    const Icon = getEventIcon(event.type);
                                                    return (
                                                        <div
                                                            key={`${event.type}-${event.id}`}
                                                            className="flex items-start gap-3 rounded-lg border p-2"
                                                        >
                                                            <div className={`rounded-full p-2 ${getEventColor(event.type)}`}>
                                                                <Icon className="h-4 w-4" />
                                                            </div>
                                                            <div className="min-w-0 flex-1">
                                                                {event.employee ? (
                                                                    <Link
                                                                        href={route('employee.show', event.employee.id)}
                                                                        className="text-sm font-medium hover:underline"
                                                                    >
                                                                        {event.title}
                                                                    </Link>
                                                                ) : (
                                                                    <p className="text-sm font-medium">{event.title}</p>
                                                                )}
                                                                <div className="mt-1 flex items-center gap-2">
                                                                    <Badge variant={getBadgeVariant(event.type)} className="text-xs">
                                                                        {event.type}
                                                                    </Badge>
                                                                    {event.company && (
                                                                        <span className="text-xs text-muted-foreground">{event.company.name}</span>
                                                                    )}
                                                                </div>
                                                                {event.description && (
                                                                    <p className="mt-1 text-xs text-muted-foreground">{event.description}</p>
                                                                )}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </PopoverContent>
                                )}
                            </Popover>
                        );
                    })}
                </div>

                {/* Event Legend */}
                <div className="mt-4 flex flex-wrap gap-3 border-t pt-4">
                    <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-blue-600" />
                        <span className="text-xs text-muted-foreground">Holiday</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Cake className="h-4 w-4 text-pink-600" />
                        <span className="text-xs text-muted-foreground">Birthday</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Award className="h-4 w-4 text-purple-600" />
                        <span className="text-xs text-muted-foreground">Anniversary</span>
                    </div>
                </div>

                {/* Upcoming Events List (Next 5 events) */}
                <div className="mt-4 border-t pt-4">
                    <h4 className="mb-3 text-sm font-semibold">Next Events</h4>
                    <ScrollArea className="h-[200px]">
                        {events.length === 0 ? (
                            <p className="text-center text-sm text-muted-foreground">No upcoming events</p>
                        ) : (
                            <div className="space-y-2">
                                {events.slice(0, 5).map((event) => {
                                    const Icon = getEventIcon(event.type);
                                    return (
                                        <div
                                            key={`${event.type}-${event.id}`}
                                            className="flex items-center gap-3 rounded-lg border p-2 hover:bg-gray-50"
                                        >
                                            <div className={`rounded-full p-2 ${getEventColor(event.type)}`}>
                                                <Icon className="h-4 w-4" />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                {event.employee ? (
                                                    <Link
                                                        href={route('employee.show', event.employee.id)}
                                                        className="text-sm font-medium hover:underline"
                                                    >
                                                        {event.title}
                                                    </Link>
                                                ) : (
                                                    <p className="text-sm font-medium">{event.title}</p>
                                                )}
                                                <div className="flex items-center gap-2">
                                                    <p className="text-xs text-muted-foreground">{format(new Date(event.date), 'MMM d, yyyy')}</p>
                                                    <Badge variant={getBadgeVariant(event.type)} className="text-xs">
                                                        {event.type}
                                                    </Badge>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </ScrollArea>
                </div>
            </CardContent>
        </Card>
    );
}
