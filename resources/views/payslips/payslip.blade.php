<!DOCTYPE html>
<html>
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
    <title>Payslip - {{ $record->employee->full_name }}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: DejaVu Sans, sans-serif;
            font-size: 11px;
            line-height: 1.4;
            padding: 20px;
        }
        .header {
            text-align: center;
            margin-bottom: 15px;
            border-bottom: 2px solid #000;
            padding-bottom: 10px;
        }
        .company-logo {
            font-size: 16px;
            font-weight: bold;
            margin-bottom: 3px;
        }
        .company-address {
            font-size: 9px;
            color: #555;
        }
        .title {
            font-size: 14px;
            font-weight: bold;
            margin-top: 8px;
        }
        .employee-info {
            margin: 15px 0;
            border: 1px solid #000;
            padding: 10px;
        }
        .info-row {
            display: flex;
            margin-bottom: 4px;
        }
        .info-label {
            width: 120px;
            font-weight: bold;
        }
        .info-value {
            flex: 1;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 15px;
        }
        th {
            background-color: #f0f0f0;
            border: 1px solid #000;
            padding: 6px;
            text-align: left;
            font-weight: bold;
        }
        td {
            border: 1px solid #000;
            padding: 6px;
        }
        .amount {
            text-align: right;
        }
        .total-row {
            font-weight: bold;
            background-color: #f9f9f9;
        }
        .summary {
            margin-top: 15px;
            border: 2px solid #000;
            padding: 10px;
        }
        .summary-row {
            display: flex;
            justify-content: space-between;
            padding: 5px 0;
            border-bottom: 1px solid #ddd;
        }
        .summary-row:last-child {
            border-bottom: none;
            font-size: 13px;
            font-weight: bold;
            margin-top: 5px;
            padding-top: 8px;
            border-top: 2px solid #000;
        }
        .footer {
            margin-top: 30px;
            font-size: 9px;
            text-align: center;
            color: #666;
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="company-logo">SOUTHEAST GLOBAL RESOURCING MANAGEMENT SERVICES INC.</div>
        <div class="company-address">Conveyor St., JP Laurel Bajada, Davao City</div>
        <div class="title">PAY-OUT DATE: {{ \Carbon\Carbon::parse($period->payment_date)->format('F d, Y') }}</div>
    </div>

    <div class="employee-info">
        <div class="info-row">
            <div class="info-label">Employee Name:</div>
            <div class="info-value">{{ $record->employee->full_name }}</div>
        </div>
        <div class="info-row">
            <div class="info-label">Daily Rate:</div>
            <div class="info-value">PHP {{ number_format($record->daily_rate, 2) }}</div>
        </div>
        <div class="info-row">
            <div class="info-label">Days Worked:</div>
            <div class="info-value">{{ number_format($record->days_worked, 1) }}</div>
        </div>
        <div class="info-row">
            <div class="info-label">Rate 15th/30th:</div>
            <div class="info-value">PHP {{ number_format($record->basic_pay, 2) }}</div>
        </div>
    </div>

    <table>
        <thead>
            <tr>
                <th colspan="2">EARNINGS</th>
            </tr>
        </thead>
        <tbody>
            @if($record->overtime > 0)
            <tr>
                <td>Overtime:</td>
                <td class="amount">PHP {{ number_format($record->overtime, 2) }}</td>
            </tr>
            @endif
            @if($record->night_differential > 0)
            <tr>
                <td>Night Differential:</td>
                <td class="amount">PHP {{ number_format($record->night_differential, 2) }}</td>
            </tr>
            @endif
            @if($record->special_holiday > 0)
            <tr>
                <td>Special Holiday:</td>
                <td class="amount">PHP {{ number_format($record->special_holiday, 2) }}</td>
            </tr>
            @endif
            @if($record->legal_holiday > 0)
            <tr>
                <td>Legal Holiday:</td>
                <td class="amount">PHP {{ number_format($record->legal_holiday, 2) }}</td>
            </tr>
            @endif
            @if($record->holiday_pay > 0)
            <tr>
                <td>Holiday Pay:</td>
                <td class="amount">PHP {{ number_format($record->holiday_pay, 2) }}</td>
            </tr>
            @endif
            @if($record->clothing_allowance > 0)
            <tr>
                <td>Clothing Allowance:</td>
                <td class="amount">PHP {{ number_format($record->clothing_allowance, 2) }}</td>
            </tr>
            @endif
            @if($record->rice_allowance > 0)
            <tr>
                <td>Rice Allowance:</td>
                <td class="amount">PHP {{ number_format($record->rice_allowance, 2) }}</td>
            </tr>
            @endif
            @if($record->transportation_allowance > 0)
            <tr>
                <td>Transportation Allowance:</td>
                <td class="amount">PHP {{ number_format($record->transportation_allowance, 2) }}</td>
            </tr>
            @endif
            @if($record->program_allowance > 0)
            <tr>
                <td>Program Allowance:</td>
                <td class="amount">PHP {{ number_format($record->program_allowance, 2) }}</td>
            </tr>
            @endif
            @if($record->attendance_incentive > 0)
            <tr>
                <td>Attendance Incentive:</td>
                <td class="amount">PHP {{ number_format($record->attendance_incentive, 2) }}</td>
            </tr>
            @endif
            @if($record->adjustments != 0)
            <tr>
                <td>Adjustments:</td>
                <td class="amount">PHP {{ number_format($record->adjustments, 2) }}</td>
            </tr>
            @endif
        </tbody>
    </table>

    <table>
        <thead>
            <tr>
                <th colspan="2">DEDUCTIONS</th>
            </tr>
        </thead>
        <tbody>
            @if($record->sss_contribution > 0)
            <tr>
                <td>SSS:</td>
                <td class="amount">PHP {{ number_format($record->sss_contribution, 2) }}</td>
            </tr>
            @endif
            @if($record->phic_contribution > 0)
            <tr>
                <td>PhilHealth:</td>
                <td class="amount">PHP {{ number_format($record->phic_contribution, 2) }}</td>
            </tr>
            @endif
            @if($record->hdmf_contribution > 0)
            <tr>
                <td>Pag-IBIG:</td>
                <td class="amount">PHP {{ number_format($record->hdmf_contribution, 2) }}</td>
            </tr>
            @endif
            @if($record->late_undertime_amount > 0)
            <tr>
                <td>Late/Undertime:</td>
                <td class="amount">PHP {{ number_format($record->late_undertime_amount, 2) }}</td>
            </tr>
            @endif
            @if($record->cash_advance > 0)
            <tr>
                <td>Cash Advance:</td>
                <td class="amount">PHP {{ number_format($record->cash_advance, 2) }}</td>
            </tr>
            @endif
        </tbody>
    </table>

    <div class="summary">
        <div class="summary-row">
            <span>Gross Pay:</span>
            <span>PHP {{ number_format($record->gross_pay, 2) }}</span>
        </div>
        <div class="summary-row">
            <span>Total Deductions:</span>
            <span>PHP {{ number_format($record->total_deductions, 2) }}</span>
        </div>
        <div class="summary-row">
            <span>NET PAY:</span>
            <span>PHP {{ number_format($record->net_pay, 2) }}</span>
        </div>
    </div>

    <div class="footer">
        <p>{{ $period->period_name }} | Pay Period: {{ \Carbon\Carbon::parse($period->date_from)->format('M d') }} - {{ \Carbon\Carbon::parse($period->date_to)->format('M d, Y') }}</p>
        <p style="margin-top: 5px;">This is a computer-generated document. No signature required.</p>
    </div>
</body>
</html>
