export interface Contract {
    id: string;
    employeeId: string;
    firstName: string;
    lastName: string;
    email: string;
    type: 'employee' | 'contractor';
    classification: string;
    baseRate: number;
    superannuation: boolean;
    allowances: {
        dog: boolean;
        horse: boolean;
        firstAid: boolean;
        meal: boolean;
    };
    deductions: {
        accommodation: number;
        meat: number;
    };
    status: 'Draft' | 'Active' | 'Terminated';
    startDate: string;
}

export type NewContractData = Omit<Contract, 'id' | 'status' | 'startDate' | 'employeeId'>;

export interface TimesheetEntry {
    date: string; // YYYY-MM-DD
    startTime: string; // HH:mm
    endTime: string;   // HH:mm
    breakMinutes: number;
    isNightShift: boolean;
    isPublicHoliday: boolean;
    activity: string;
}

export interface PaySlipItem {
    description: string;
    units: number;
    rate: number;
    total: number;
}

export interface PaySlip {
    weekEnding: string;
    grossPay: number;
    tax: number;
    netPay: number;
    superannuation: number;
    items: PaySlipItem[];
}

export interface WeeklyTimesheet {
    id: string;
    employeeId: string;
    employeeName: string;
    weekEnding: string;
    entries: TimesheetEntry[];
    status: 'Pending' | 'Approved' | 'Paid';
    submittedAt: string;
}
