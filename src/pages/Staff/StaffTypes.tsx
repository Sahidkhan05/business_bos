// StaffTypes.ts

export type Staff = {
  id: number;
  name: string;
  position: string; // dukaan me role (Cashier, Salesman, Helper, etc.)
  phone: string;
  joiningDate: string;
  salary: number;
  aadhaarFileName?: string; // Aadhaar file ka naam
};

export type AttendanceStatus = "Present" | "Absent" | "Leave";

export type AttendanceRecord = {
  id: number;
  staffId: number;
  date: string; // yyyy-mm-dd
  status: AttendanceStatus;
};
