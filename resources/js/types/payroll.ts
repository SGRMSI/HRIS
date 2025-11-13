export interface PayrollPeriod {
    period_id: number;
    period_name: string;
    date_from: string;
    date_to: string;
    payment_date: string | null;
    status: 'draft' | 'approved' | 'paid';
    total_employees: number;
    total_gross: string;
    total_deductions: string;
    total_net: string;
    notes: string | null;
    created_by: number;
    approved_by: number | null;
    approved_at: string | null;
    created_at: string;
    updated_at: string;
    creator?: {
        user_id: number;
        name: string;
    };
    approver?: {
        user_id: number;
        name: string;
    };
    payroll_records_count?: number;
}

export interface PayrollRecord {
    payroll_id?: number;
    final_id?: number; // New primary key for PayrollFinal
    period_id: number;
    employee_id: number;
    daily_rate: string | number;
    days_worked: string | number;
    basic_pay?: string | number; // New field replacing rate_15th_30th
    rate_15th?: string | number; // Deprecated
    rate_30th?: string | number; // Deprecated
    rate_15th_30th?: string; // Deprecated
    overtime: string | number;
    night_differential: string;
    special_holiday: string;
    legal_holiday: string;
    holiday_pay: string | number;
    clothing_allowance: string | number;
    rice_allowance: string | number;
    transportation_allowance: string | number;
    program_allowance: string | number;
    attendance_incentive: string | number;
    adjustments: string | number;
    adjustment_notes: string | null;
    gross_pay: string;
    sss_contribution: string | number;
    phic_contribution: string | number;
    hdmf_contribution: string | number;
    late_undertime_minutes: number;
    late_undertime_amount: string;
    cash_advance: string;
    total_deductions: string;
    net_pay: string;
    status: 'draft' | 'for_approval' | 'approved' | 'paid';
    is_editable: boolean;
    remarks: string | null;
    created_at: string;
    updated_at: string;
    employee?: {
        employee_id: number;
        id_number: string;
        full_name: string;
        company?: {
            company_id: number;
            name: string;
        };
        department?: {
            department_id: number;
            name: string;
        };
        position?: {
            position_id: number;
            name: string;
        };
    };
    period?: PayrollPeriod;
}

export interface PayrollFilters {
    status?: 'draft' | 'approved' | 'paid';
    from_date?: string;
    to_date?: string;
    search?: string;
}
