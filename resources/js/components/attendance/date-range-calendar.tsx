import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';

interface DateRangeCalendarProps {
    startDate: string;
    endDate: string;
    onStartDateChange: (date: string) => void;
    onEndDateChange: (date: string) => void;
    selectingFor: 'start' | 'end' | null;
    onSelectingForChange: (mode: 'start' | 'end' | null) => void;
}

export function DateRangeCalendar({
    startDate,
    endDate,
    onStartDateChange,
    onEndDateChange,
    selectingFor,
    onSelectingForChange,
}: DateRangeCalendarProps) {
    const [currentMonth, setCurrentMonth] = useState(new Date());

    // Calendar helper functions
    const getDaysInMonth = (date: Date) => {
        return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    };

    const getFirstDayOfMonth = (date: Date) => {
        return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
    };

    const formatDate = (date: Date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const isDateSelected = (day: number) => {
        const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
        const dateString = formatDate(date);
        return dateString === startDate || dateString === endDate;
    };

    const isDateInRange = (day: number) => {
        if (!startDate || !endDate) return false;
        const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
        const dateString = formatDate(date);
        return dateString >= startDate && dateString <= endDate;
    };

    const handleDateClick = (day: number) => {
        const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
        const dateString = formatDate(date);

        if (selectingFor === 'start') {
            onStartDateChange(dateString);
            if (endDate && dateString > endDate) {
                onEndDateChange('');
            }
            onSelectingForChange('end');
        } else if (selectingFor === 'end') {
            if (startDate && dateString < startDate) {
                onStartDateChange(dateString);
                onEndDateChange('');
                onSelectingForChange('end');
            } else {
                onEndDateChange(dateString);
                onSelectingForChange(null);
            }
        } else {
            // No selection mode, start fresh
            onStartDateChange(dateString);
            onEndDateChange('');
            onSelectingForChange('end');
        }
    };

    const navigateMonth = (direction: 'prev' | 'next') => {
        setCurrentMonth(prev => {
            const newDate = new Date(prev);
            if (direction === 'prev') {
                newDate.setMonth(prev.getMonth() - 1);
            } else {
                newDate.setMonth(prev.getMonth() + 1);
            }
            return newDate;
        });
    };

    const renderCalendar = () => {
        const daysInMonth = getDaysInMonth(currentMonth);
        const firstDay = getFirstDayOfMonth(currentMonth);
        const days = [];
        const monthNames = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
        ];
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

        // Empty cells for days before the first day of the month
        for (let i = 0; i < firstDay; i++) {
            days.push(<div key={`empty-${i}`} className="h-8 w-8" />);
        }

        // Days of the month
        for (let day = 1; day <= daysInMonth; day++) {
            const isSelected = isDateSelected(day);
            const isInRange = isDateInRange(day);
            const isToday = new Date().toDateString() === new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day).toDateString();

            days.push(
                <button
                    key={day}
                    onClick={() => handleDateClick(day)}
                    className={`h-8 w-8 rounded-md text-sm hover:bg-accent hover:text-accent-foreground focus:outline-none focus:ring-2 focus:ring-ring ${
                        isSelected
                            ? 'bg-primary text-primary-foreground'
                            : isInRange
                            ? 'bg-accent text-accent-foreground'
                            : isToday
                            ? 'bg-accent text-accent-foreground font-medium'
                            : ''
                    }`}
                >
                    {day}
                </button>
            );
        }

        return (
            <div className="space-y-4">
                {/* Calendar Header */}
                <div className="flex items-center justify-between">
                    <button
                        onClick={() => navigateMonth('prev')}
                        className="p-1 hover:bg-accent rounded-md"
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </button>
                    <h3 className="font-medium">
                        {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                    </h3>
                    <button
                        onClick={() => navigateMonth('next')}
                        className="p-1 hover:bg-accent rounded-md"
                    >
                        <ChevronRight className="h-4 w-4" />
                    </button>
                </div>

                {/* Day Names */}
                <div className="grid grid-cols-7 gap-1 text-xs text-muted-foreground">
                    {dayNames.map(name => (
                        <div key={name} className="h-8 flex items-center justify-center font-medium">
                            {name}
                        </div>
                    ))}
                </div>

                {/* Calendar Days */}
                <div className="grid grid-cols-7 gap-1">
                    {days}
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-4">
            {/* Selection Mode Indicators */}
            <div className="flex gap-2 text-sm">
                <button
                    onClick={() => onSelectingForChange('start')}
                    className={`px-3 py-1 rounded-md border ${
                        selectingFor === 'start' 
                            ? 'bg-primary text-primary-foreground' 
                            : 'bg-background hover:bg-accent'
                    }`}
                >
                    Start Date {startDate && `(${startDate})`}
                </button>
                <button
                    onClick={() => onSelectingForChange('end')}
                    className={`px-3 py-1 rounded-md border ${
                        selectingFor === 'end' 
                            ? 'bg-primary text-primary-foreground' 
                            : 'bg-background hover:bg-accent'
                    }`}
                >
                    End Date {endDate && `(${endDate})`}
                </button>
            </div>

            {/* Calendar */}
            {renderCalendar()}
        </div>
    );
}
