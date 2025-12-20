import { apiService } from './api';

// Type definitions matching backend serializers
export interface Staff {
    staff_id: number;
    name: string;
    position: string;
    phone: string;
    email?: string;
    joiningDate: string; // yyyy-mm-dd format
    salary: number | string;
    aadhaar_file?: File | null;
    aadhaarFileName?: string | null;
    is_active: boolean;
    created_at?: string;
    updated_at?: string;
}

export interface StaffCreateInput {
    name: string;
    position: string;
    phone: string;
    email?: string;
    joiningDate: string;
    salary: number | string;
    aadhaar_file?: File | null;
    is_active?: boolean;
}

export type AttendanceStatus = 'Present' | 'Absent' | 'Leave';

export interface AttendanceRecord {
    attendance_id: number;
    staffId: number;
    staff_name?: string;
    date: string; // yyyy-mm-dd
    status: AttendanceStatus;
    created_at?: string;
}

export interface AttendanceInput {
    staffId: number;
    date: string;
    status: AttendanceStatus;
}

/**
 * Staff Service - handles all staff-related API calls
 */
class StaffService {
    private readonly baseUrl = '/api/hr';

    /**
     * Get all staff members
     */
    async getStaff(): Promise<Staff[]> {
        return apiService.get<Staff[]>(`${this.baseUrl}/staff/`);
    }

    /**
     * Get a single staff member by ID
     */
    async getStaffById(id: number): Promise<Staff> {
        return apiService.get<Staff>(`${this.baseUrl}/staff/${id}/`);
    }

    /**
     * Create a new staff member
     */
    async createStaff(staff: StaffCreateInput): Promise<Staff> {
        // If there's a file, we need to use FormData
        if (staff.aadhaar_file) {
            const formData = new FormData();
            formData.append('name', staff.name);
            formData.append('position', staff.position);
            formData.append('phone', staff.phone);
            if (staff.email) formData.append('email', staff.email);
            formData.append('joining_date', staff.joiningDate);
            formData.append('salary', staff.salary.toString());
            formData.append('aadhaar_file', staff.aadhaar_file);
            formData.append('is_active', (staff.is_active ?? true).toString());

            return apiService.postFormData<Staff>(`${this.baseUrl}/staff/`, formData);
        }

        // No file, use JSON
        return apiService.post<Staff>(`${this.baseUrl}/staff/`, {
            name: staff.name,
            position: staff.position,
            phone: staff.phone,
            email: staff.email,
            joiningDate: staff.joiningDate,
            salary: staff.salary,
            is_active: staff.is_active ?? true,
        });
    }

    /**
     * Update an existing staff member
     */
    async updateStaff(id: number, staff: Partial<StaffCreateInput>): Promise<Staff> {
        return apiService.patch<Staff>(`${this.baseUrl}/staff/${id}/`, {
            name: staff.name,
            position: staff.position,
            phone: staff.phone,
            email: staff.email,
            joiningDate: staff.joiningDate,
            salary: staff.salary,
        });
    }

    /**
     * Delete a staff member
     */
    async deleteStaff(id: number): Promise<void> {
        return apiService.delete<void>(`${this.baseUrl}/staff/${id}/`);
    }

    /**
     * Get attendance history for a specific staff member
     */
    async getStaffAttendanceHistory(staffId: number): Promise<AttendanceRecord[]> {
        return apiService.get<AttendanceRecord[]>(`${this.baseUrl}/staff/${staffId}/attendance-history/`);
    }

    // ---- Attendance ----

    /**
     * Get all attendance records
     */
    async getAttendance(filters?: { staffId?: number; date?: string; status?: AttendanceStatus }): Promise<AttendanceRecord[]> {
        let url = `${this.baseUrl}/attendance/`;
        const params = new URLSearchParams();

        if (filters?.staffId) {
            params.append('staff', filters.staffId.toString());
        }
        if (filters?.date) {
            params.append('date', filters.date);
        }
        if (filters?.status) {
            params.append('status', filters.status);
        }

        const queryString = params.toString();
        if (queryString) {
            url += `?${queryString}`;
        }

        return apiService.get<AttendanceRecord[]>(url);
    }

    /**
     * Mark attendance for a staff member
     */
    async markAttendance(attendance: AttendanceInput): Promise<AttendanceRecord> {
        return apiService.post<AttendanceRecord>(`${this.baseUrl}/attendance/`, {
            staffId: attendance.staffId,
            date: attendance.date,
            status: attendance.status,
        });
    }

    /**
     * Update attendance record
     */
    async updateAttendance(attendanceId: number, data: Partial<AttendanceInput>): Promise<AttendanceRecord> {
        return apiService.patch<AttendanceRecord>(`${this.baseUrl}/attendance/${attendanceId}/`, data);
    }

    /**
     * Delete attendance record
     */
    async deleteAttendance(attendanceId: number): Promise<void> {
        return apiService.delete<void>(`${this.baseUrl}/attendance/${attendanceId}/`);
    }
}

export const staffService = new StaffService();
