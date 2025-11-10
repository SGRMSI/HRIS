import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface CalendarEvent {
    id: string | number;
    date: string; // YYYY-MM-DD format
    title: string;
    variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
    badge?: string;
    onClick?: () => void;
}

interface AttendanceCalendarProps {
    events: CalendarEvent[];
    month?: number; // 0-11
    year?: number;
    onDateClick?: (date: string) => void;
    highlightToday?: boolean;
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
];

const variantColors = {
    default: 'bg-slate-100 hover:bg-slate-200 text-slate-700',
    success: 'bg-green-100 hover:bg-green-200 text-green-700',
    warning: 'bg-yellow-100 hover:bg-yellow-200 text-yellow-700',
    danger: 'bg-red-100 hover:bg-red-200 text-red-700',
    info: 'bg-blue-100 hover:bg-blue-200 text-blue-700',
};

export function AttendanceCalendar({
    events,
    month: initialMonth,
    year: initialYear,
    onDateClick,
    highlightToday = true,
}: AttendanceCalendarProps) {
    const today = new Date();
    const [currentMonth, setCurrentMonth] = useState(initialMonth ?? today.getMonth());
    const [currentYear, setCurrentYear] = useState(initialYear ?? today.getFullYear());

    const getDaysInMonth = (month: number, year: number) => {
        return new Date(year, month + 1, 0).getDate();
    };

    const getFirstDayOfMonth = (month: number, year: number) => {
        return new Date(year, month, 1).getDay();
    };

    const previousMonth = () => {
        if (currentMonth === 0) {
            setCurrentMonth(11);
            setCurrentYear(currentYear - 1);
        } else {
            setCurrentMonth(currentMonth - 1);
        }
    };

    const nextMonth = () => {
        if (currentMonth === 11) {
            setCurrentMonth(0);
            setCurrentYear(currentYear + 1);
        } else {
            setCurrentMonth(currentMonth + 1);
        }
    };

    const goToToday = () => {
        setCurrentMonth(today.getMonth());
        setCurrentYear(today.getFullYear());
    };

    const daysInMonth = getDaysInMonth(currentMonth, currentYear);
    const firstDayOfMonth = getFirstDayOfMonth(currentMonth, currentYear);

    // Create array of days to display
    const calendarDays: (number | null)[] = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDayOfMonth; i++) {
        calendarDays.push(null);
    }
    
    // Add the days of the month
    for (let day = 1; day <= daysInMonth; day++) {
        calendarDays.push(day);
    }

    const getEventsForDate = (day: number | null) => {
        if (!day) return [];
        const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        return events.filter((event) => event.date === dateStr);
    };

    const isToday = (day: number | null) => {
        if (!day || !highlightToday) return false;
        return (
            day === today.getDate() &&
            currentMonth === today.getMonth() &&
            currentYear === today.getFullYear()
        );
    };

    const handleDateClick = (day: number | null) => {
        if (!day || !onDateClick) return;
        const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        onDateClick(dateStr);
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle className="text-xl">
                        {MONTHS[currentMonth]} {currentYear}
                    </CardTitle>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={goToToday}>
                            Today
                        </Button>
                        <Button variant="outline" size="icon" onClick={previousMonth}>
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="icon" onClick={nextMonth}>
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-7 gap-2">
                    {/* Day headers */}
                    {DAYS.map((day) => (
                        <div key={day} className="text-center font-semibold text-sm text-muted-foreground py-2">
                            {day}
                        </div>
                    ))}
                    
                    {/* Calendar days */}
                    {calendarDays.map((day, index) => {
                        const dayEvents = getEventsForDate(day);
                        const isTodayDate = isToday(day);
                        
                        return (
                            <div
                                key={index}
                                className={cn(
                                    'min-h-[80px] p-2 border rounded-md transition-colors',
                                    day ? 'bg-white hover:bg-slate-50 cursor-pointer' : 'bg-slate-50',
                                    isTodayDate && 'border-blue-500 border-2 bg-blue-50'
                                )}
                                onClick={() => handleDateClick(day)}
                            >
                                {day && (
                                    <>
                                        <div className={cn(
                                            'text-sm font-medium mb-1',
                                            isTodayDate && 'text-blue-600'
                                        )}>
                                            {day}
                                        </div>
                                        <div className="space-y-1">
                                            {dayEvents.slice(0, 2).map((event) => (
                                                <div
                                                    key={event.id}
                                                    className={cn(
                                                        'text-xs px-1 py-0.5 rounded truncate',
                                                        variantColors[event.variant || 'default']
                                                    )}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        event.onClick?.();
                                                    }}
                                                >
                                                    {event.title}
                                                </div>
                                            ))}
                                            {dayEvents.length > 2 && (
                                                <div className="text-xs text-muted-foreground">
                                                    +{dayEvents.length - 2} more
                                                </div>
                                            )}
                                        </div>
                                    </>
                                )}
                            </div>
                        );
                    })}
                </div>
            </CardContent>
        </Card>
    );
}
