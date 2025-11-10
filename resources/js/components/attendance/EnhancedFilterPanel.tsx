import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronUp, X, Filter } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface FilterOption {
    label: string;
    value: string;
}

export interface DatePreset {
    label: string;
    getValue: () => { from: string; to: string };
}

interface FilterField {
    name: string;
    label: string;
    type: 'text' | 'select' | 'date' | 'daterange';
    placeholder?: string;
    options?: FilterOption[];
    value?: string;
    onChange?: (value: string) => void;
}

interface EnhancedFilterPanelProps {
    fields: FilterField[];
    datePresets?: DatePreset[];
    onApply: (filters: Record<string, string>) => void;
    onReset: () => void;
    activeFiltersCount?: number;
    defaultExpanded?: boolean;
}

const DEFAULT_DATE_PRESETS: DatePreset[] = [
    {
        label: 'Today',
        getValue: () => {
            const today = new Date().toISOString().split('T')[0];
            return { from: today, to: today };
        },
    },
    {
        label: 'Yesterday',
        getValue: () => {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const date = yesterday.toISOString().split('T')[0];
            return { from: date, to: date };
        },
    },
    {
        label: 'This Week',
        getValue: () => {
            const today = new Date();
            const firstDay = new Date(today.setDate(today.getDate() - today.getDay()));
            const lastDay = new Date(today.setDate(today.getDate() - today.getDay() + 6));
            return {
                from: firstDay.toISOString().split('T')[0],
                to: lastDay.toISOString().split('T')[0],
            };
        },
    },
    {
        label: 'Last Week',
        getValue: () => {
            const today = new Date();
            const firstDay = new Date(today.setDate(today.getDate() - today.getDay() - 7));
            const lastDay = new Date(today.setDate(today.getDate() - today.getDay() + 6));
            return {
                from: firstDay.toISOString().split('T')[0],
                to: lastDay.toISOString().split('T')[0],
            };
        },
    },
    {
        label: 'This Month',
        getValue: () => {
            const today = new Date();
            const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
            const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
            return {
                from: firstDay.toISOString().split('T')[0],
                to: lastDay.toISOString().split('T')[0],
            };
        },
    },
    {
        label: 'Last Month',
        getValue: () => {
            const today = new Date();
            const firstDay = new Date(today.getFullYear(), today.getMonth() - 1, 1);
            const lastDay = new Date(today.getFullYear(), today.getMonth(), 0);
            return {
                from: firstDay.toISOString().split('T')[0],
                to: lastDay.toISOString().split('T')[0],
            };
        },
    },
];

export function EnhancedFilterPanel({
    fields,
    datePresets = DEFAULT_DATE_PRESETS,
    onApply,
    onReset,
    activeFiltersCount = 0,
    defaultExpanded = false,
}: EnhancedFilterPanelProps) {
    const [isExpanded, setIsExpanded] = useState(defaultExpanded);
    const [filterValues, setFilterValues] = useState<Record<string, string>>(() => {
        const initial: Record<string, string> = {};
        fields.forEach((field) => {
            if (field.value) {
                initial[field.name] = field.value;
            }
        });
        return initial;
    });

    const handleFieldChange = (name: string, value: string) => {
        setFilterValues((prev) => ({ ...prev, [name]: value }));
        const field = fields.find((f) => f.name === name);
        field?.onChange?.(value);
    };

    const handlePresetClick = (preset: DatePreset) => {
        const { from, to } = preset.getValue();
        const dateFromField = fields.find((f) => f.name.includes('from') || f.name.includes('start'));
        const dateToField = fields.find((f) => f.name.includes('to') || f.name.includes('end'));

        if (dateFromField) {
            setFilterValues((prev) => ({ ...prev, [dateFromField.name]: from }));
        }
        if (dateToField) {
            setFilterValues((prev) => ({ ...prev, [dateToField.name]: to }));
        }
    };

    const handleApply = () => {
        onApply(filterValues);
    };

    const handleReset = () => {
        setFilterValues({});
        onReset();
    };

    const renderField = (field: FilterField) => {
        const value = filterValues[field.name] || '';

        switch (field.type) {
            case 'text':
                return (
                    <Input
                        placeholder={field.placeholder}
                        value={value}
                        onChange={(e) => handleFieldChange(field.name, e.target.value)}
                    />
                );

            case 'select':
                return (
                    <Select value={value} onValueChange={(val) => handleFieldChange(field.name, val)}>
                        <SelectTrigger>
                            <SelectValue placeholder={field.placeholder || 'Select...'} />
                        </SelectTrigger>
                        <SelectContent>
                            {field.options?.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                    {option.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                );

            case 'date':
                return (
                    <Input
                        type="date"
                        value={value}
                        onChange={(e) => handleFieldChange(field.name, e.target.value)}
                    />
                );

            default:
                return null;
        }
    };

    return (
        <Card className="mb-6">
            <CardContent className="p-4">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <Filter className="h-4 w-4 text-muted-foreground" />
                        <h3 className="font-semibold">Filters</h3>
                        {activeFiltersCount > 0 && (
                            <Badge variant="secondary" className="ml-2">
                                {activeFiltersCount} active
                            </Badge>
                        )}
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="gap-1"
                    >
                        {isExpanded ? (
                            <>
                                <ChevronUp className="h-4 w-4" />
                                Hide
                            </>
                        ) : (
                            <>
                                <ChevronDown className="h-4 w-4" />
                                Show
                            </>
                        )}
                    </Button>
                </div>

                {isExpanded && (
                    <>
                        {/* Date Presets */}
                        {datePresets.length > 0 && (
                            <div className="mb-4">
                                <Label className="text-xs text-muted-foreground mb-2 block">Quick Date Range</Label>
                                <div className="flex flex-wrap gap-2">
                                    {datePresets.map((preset) => (
                                        <Button
                                            key={preset.label}
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handlePresetClick(preset)}
                                        >
                                            {preset.label}
                                        </Button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Filter Fields */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                            {fields.map((field) => (
                                <div key={field.name}>
                                    <Label htmlFor={field.name} className="mb-2 block">
                                        {field.label}
                                    </Label>
                                    {renderField(field)}
                                </div>
                            ))}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-2">
                            <Button onClick={handleApply} size="sm">
                                Apply Filters
                            </Button>
                            <Button onClick={handleReset} variant="outline" size="sm">
                                <X className="h-4 w-4 mr-1" />
                                Clear All
                            </Button>
                        </div>
                    </>
                )}
            </CardContent>
        </Card>
    );
}
