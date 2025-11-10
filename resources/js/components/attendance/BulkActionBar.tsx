import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BulkAction {
    label: string;
    icon?: React.ReactNode;
    onClick: () => void;
    variant?: 'default' | 'destructive' | 'outline' | 'secondary';
    disabled?: boolean;
}

interface BulkActionBarProps {
    selectedCount: number;
    totalCount?: number;
    actions: BulkAction[];
    onClearSelection: () => void;
    className?: string;
}

export function BulkActionBar({
    selectedCount,
    totalCount,
    actions,
    onClearSelection,
    className,
}: BulkActionBarProps) {
    if (selectedCount === 0) return null;

    return (
        <div className={cn('fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-5', className)}>
            <Card className="shadow-lg border-2">
                <div className="flex items-center gap-4 px-6 py-4">
                    <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-base px-3 py-1">
                            {selectedCount} {selectedCount === 1 ? 'item' : 'items'} selected
                        </Badge>
                        {totalCount && (
                            <span className="text-sm text-muted-foreground">
                                of {totalCount}
                            </span>
                        )}
                    </div>

                    <div className="h-6 w-px bg-border" />

                    <div className="flex items-center gap-2">
                        {actions.map((action, index) => (
                            <Button
                                key={index}
                                variant={action.variant || 'default'}
                                size="sm"
                                onClick={action.onClick}
                                disabled={action.disabled}
                                className="gap-2"
                            >
                                {action.icon}
                                {action.label}
                            </Button>
                        ))}
                    </div>

                    <div className="h-6 w-px bg-border" />

                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onClearSelection}
                        className="gap-1"
                    >
                        <X className="h-4 w-4" />
                        Clear
                    </Button>
                </div>
            </Card>
        </div>
    );
}
