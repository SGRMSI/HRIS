import { Button } from '@/components/ui/button';
import { CalendarIcon, ChevronDown } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { DateRangeCalendar } from './date-range-calendar';

interface DateRangePickerProps {
    startDate: string;
    endDate: string;
    onStartDateChange: (date: string) => void;
    onEndDateChange: (date: string) => void;
    onApply?: () => void;
    onClear?: () => void;
}

export function DateRangePicker({
    startDate,
    endDate,
    onStartDateChange,
    onEndDateChange,
    onApply,
    onClear,
}: DateRangePickerProps) {
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
        if (!startDate && !endDate) return 'Select date range';
        
        const formatDisplayDate = (dateStr: string) => {
            const [year, month, day] = dateStr.split('-').map(Number);
            const date = new Date(year, month - 1, day);
            return date.toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric', 
                year: 'numeric' 
            });
        };
        
        if (startDate && endDate) {
            // If same date, show single date
            if (startDate === endDate) {
                return formatDisplayDate(startDate);
            }
            // Different dates, show range
            return `${formatDisplayDate(startDate)} - ${formatDisplayDate(endDate)}`;
        }
        if (startDate) return `From ${formatDisplayDate(startDate)}`;
        if (endDate) return `Until ${formatDisplayDate(endDate)}`;
        return 'Select date range';
    };

    const handleApplyFilter = () => {
        onApply?.();
        setIsPopoverOpen(false);
    };

    const handleClear = () => {
        onClear?.();
        setSelectingFor(null);
    };

    return (
        <div className="relative" ref={popoverRef}>
            <Button
                variant="outline"
                onClick={() => setIsPopoverOpen(!isPopoverOpen)}
                className="justify-between min-w-[240px]"
            >
                <span className="truncate">{formatDateRange()}</span>
                <ChevronDown className={`h-4 w-4 transition-transform ${isPopoverOpen ? 'rotate-180' : ''}`} />
            </Button>
            
            {isPopoverOpen && (
                <div className="absolute top-full left-0 mt-2 z-50 w-96 rounded-md border bg-popover p-4 text-popover-foreground shadow-md">
                    <div className="space-y-4">
                        <DateRangeCalendar
                            startDate={startDate}
                            endDate={endDate}
                            onStartDateChange={onStartDateChange}
                            onEndDateChange={onEndDateChange}
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
                                disabled={!startDate && !endDate}
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
