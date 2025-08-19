import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, usePage } from '@inertiajs/react';
import { type PageProps } from '@inertiajs/core';
import { useState, useRef, useEffect } from 'react';
import { toast } from 'sonner';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { UserCheck, UserX, Clock, CalendarIcon, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Attendance',
        href: '/attendance',
    },
];

// interface Props {
//     attendance: Attendance[];
// }

interface GlobalPageProps extends PageProps {
    flash?: {
        success?: string;
        error?: string;
        warning?: string;
        info?: string;
    };
}

export default function Attendance() {
    const { props } = usePage<GlobalPageProps>();
    const [startDate, setStartDate] = useState<string>('');
    const [endDate, setEndDate] = useState<string>('');
    const [isPopoverOpen, setIsPopoverOpen] = useState(false);
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [selectingFor, setSelectingFor] = useState<'start' | 'end' | null>(null);
    const popoverRef = useRef<HTMLDivElement>(null);

    // Mock data - replace with actual attendance data
    const attendanceStats = {
        present: 45,
        absent: 5,
        onTime: 40,
        late: 10
    };

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

    const parseDate = (dateString: string) => {
        if (!dateString) return null;
        const [year, month, day] = dateString.split('-').map(Number);
        return new Date(year, month - 1, day);
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
            setStartDate(dateString);
            if (endDate && dateString > endDate) {
                setEndDate('');
            }
            setSelectingFor('end');
        } else if (selectingFor === 'end') {
            if (startDate && dateString < startDate) {
                setStartDate(dateString);
                setEndDate('');
                setSelectingFor('end');
            } else {
                setEndDate(dateString);
                setSelectingFor(null);
            }
        } else {
            // No selection mode, start fresh
            setStartDate(dateString);
            setEndDate('');
            setSelectingFor('end');
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
        // Add your filter logic here
        console.log('Applying filter:', { startDate, endDate });
        setIsPopoverOpen(false);
        // You can add a toast notification here
        if (startDate || endDate) {
            toast.success('Date filter applied successfully');
        }
    };

    useEffect(() => {
        if (props.flash?.success) {
            toast.success(props.flash.success);
        }
        if (props.flash?.error) {
            toast.error(props.flash.error);
        }
        if (props.flash?.warning) {
            toast.warning(props.flash.warning);
        }
        if (props.flash?.info) {
            toast.info(props.flash.info);
        }
    }, [props.flash]);
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Attendance" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                {/* Date Range Selector with Popover */}
                <div className="flex items-center gap-4 py-4">
                    <div className="flex items-center gap-2">
                        <CalendarIcon className="h-4 w-4" />
                        <span className="text-sm font-medium">Date Range:</span>
                    </div>
                    
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
                                    {/* Selection Mode Indicators */}
                                    <div className="flex gap-2 text-sm">
                                        <button
                                            onClick={() => setSelectingFor('start')}
                                            className={`px-3 py-1 rounded-md border ${
                                                selectingFor === 'start' 
                                                    ? 'bg-primary text-primary-foreground' 
                                                    : 'bg-background hover:bg-accent'
                                            }`}
                                        >
                                            Start Date {startDate && `(${startDate})`}
                                        </button>
                                        <button
                                            onClick={() => setSelectingFor('end')}
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
                                    
                                    {/* Action Buttons */}
                                    <div className="flex justify-between gap-2 pt-2 border-t">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => {
                                                setStartDate('');
                                                setEndDate('');
                                                setSelectingFor(null);
                                            }}
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
                </div>

                {/* Statistics Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card className="w-full">
                        <CardHeader className="pb-3">
                            <div className="flex items-center gap-2">
                                <UserCheck className="h-4 w-4 text-green-600" />
                                <CardTitle className="text-2xl font-bold">{attendanceStats.present}</CardTitle>
                            </div>
                            <CardDescription>Present</CardDescription>
                        </CardHeader>
                    </Card>
                    <Card className="w-full">
                        <CardHeader className="pb-3">
                            <div className="flex items-center gap-2">
                                <UserX className="h-4 w-4 text-red-600" />
                                <CardTitle className="text-2xl font-bold">{attendanceStats.absent}</CardTitle>
                            </div>
                            <CardDescription>Absent</CardDescription>
                        </CardHeader>
                    </Card>
                    <Card className="w-full">
                        <CardHeader className="pb-3">
                            <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4 text-blue-600" />
                                <CardTitle className="text-2xl font-bold">{attendanceStats.onTime}</CardTitle>
                            </div>
                            <CardDescription>On Time</CardDescription>
                        </CardHeader>
                    </Card>
                    <Card className="w-full">
                        <CardHeader className="pb-3">
                            <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4 text-orange-600" />
                                <CardTitle className="text-2xl font-bold">{attendanceStats.late}</CardTitle>
                            </div>
                            <CardDescription>Late</CardDescription>
                        </CardHeader>
                    </Card>
                </div>
                {/* <EmployeeDataTable columns={columns} data={employees} /> */}
            </div>
        </AppLayout>
    );
}