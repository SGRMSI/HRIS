import { Button } from '@/components/ui/button';
import { CalendarIcon, ChevronDown } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { DateTimeRangeCalendar } from './date-range-calendar';

interface DateTimeRangePickerProps {
    startDate: string;
    endDate: string;
    startTime: string;
    endTime: string;
    onStartDateChange: (date: string) => void;
    onEndDateChange: (date: string) => void;
    onStartTimeChange: (time: string) => void;
    onEndTimeChange: (time: string) => void;
    onApply?: () => void;
    onClear?: () => void;
}

export function DateTimeRangePicker({
    startDate,
    endDate,
    startTime,
    endTime,
    onStartDateChange,
    onEndDateChange,
    onStartTimeChange,
    onEndTimeChange,
    onApply,
    onClear,
}: DateTimeRangePickerProps) {
    const [isPopoverOpen, setIsPopoverOpen] = useState(false);
    const [selectingFor, setSelectingFor] = useState<'start' | 'end' | null>(null);
    const popoverRef = useRef<HTMLDivElement>(null);

    // Close popover when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
                setIsPopoverOpen(false);
            }
        }

        if (isPopoverOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }
    }, [isPopoverOpen]);

    const formatDateRange = () => {
        const formatDisplayDateTime = (dateStr: string, timeStr: string) => {
            if (!dateStr) return '';
            const [year, month, day] = dateStr.split('-').map(Number);
            const date = new Date(year, month - 1, day);
            const dateFormatted = date.toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric', 
                year: 'numeric' 
            });
            
            if (timeStr) {
                const [hours, minutes] = timeStr.split(':');
                const hour24 = parseInt(hours);
                const hour12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24;
                const ampm = hour24 >= 12 ? 'PM' : 'AM';
                return `${dateFormatted} ${hour12}:${minutes} ${ampm}`;
            }
            
            return dateFormatted;
        };

        if (!startDate && !endDate) {
            return 'Select date & time range';
        }

        if (startDate && !endDate) {
            return `From ${formatDisplayDateTime(startDate, startTime)}`;
        }

        if (!startDate && endDate) {
            return `Until ${formatDisplayDateTime(endDate, endTime)}`;
        }

        if (startDate === endDate) {
            const baseDate = formatDisplayDateTime(startDate, '');
            if (startTime && endTime && startTime !== endTime) {
                const formatTime = (timeStr: string) => {
                    const [hours, minutes] = timeStr.split(':');
                    const hour24 = parseInt(hours);
                    const hour12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24;
                    const ampm = hour24 >= 12 ? 'PM' : 'AM';
                    return `${hour12}:${minutes} ${ampm}`;
                };
                return `${baseDate} ${formatTime(startTime)} - ${formatTime(endTime)}`;
            }
            return formatDisplayDateTime(startDate, startTime);
        }

        return `${formatDisplayDateTime(startDate, startTime)} to ${formatDisplayDateTime(endDate, endTime)}`;
    };

    const handleApplyFilter = () => {
        onApply?.();
        setIsPopoverOpen(false);
    };

    const handleClear = () => {
        onClear?.();
        setSelectingFor(null);
    };

    const hasSelection = startDate || endDate || startTime || endTime;

    return (
        <div className="relative" ref={popoverRef}>
            <Button
                variant="outline"
                onClick={() => setIsPopoverOpen(!isPopoverOpen)}
                className="justify-between min-w-[320px]"
            >
                <span className="truncate">{formatDateRange()}</span>
                <ChevronDown className={`h-4 w-4 transition-transform ${isPopoverOpen ? 'rotate-180' : ''}`} />
            </Button>
            
            {isPopoverOpen && (
                <div className="absolute top-full left-0 mt-2 z-50 w-96 rounded-md border bg-popover p-4 text-popover-foreground shadow-md">
                    <div className="space-y-4">
                        <DateTimeRangeCalendar
                            startDate={startDate}
                            endDate={endDate}
                            startTime={startTime}
                            endTime={endTime}
                            onStartDateChange={onStartDateChange}
                            onEndDateChange={onEndDateChange}
                            onStartTimeChange={onStartTimeChange}
                            onEndTimeChange={onEndTimeChange}
                            selectingFor={selectingFor}
                            onSelectingForChange={setSelectingFor}
                        />
                        
                        {/* Action Buttons */}
                        <div className="flex justify-between gap-2 pt-2 border-t">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleClear}
                            >
                                Clear
                            </Button>
                            <Button
                                size="sm"
                                onClick={handleApplyFilter}
                                disabled={!hasSelection}
                            >
                                Apply Filter
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
