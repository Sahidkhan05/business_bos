// AttendanceManager.tsx - Mark and view staff attendance
import React, { useState } from "react";
import type { Staff, AttendanceRecord, AttendanceStatus } from "./StaffTypes";

type AttendanceManagerProps = {
  staffList: Staff[];
  attendance: AttendanceRecord[];
  onMarkAttendance: (record: Omit<AttendanceRecord, "attendance_id" | "created_at">) => void;
};

const AttendanceManager: React.FC<AttendanceManagerProps> = ({
  staffList,
  attendance,
  onMarkAttendance,
}) => {
  const [selectedStaffId, setSelectedStaffId] = useState<number | "">("");
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]); // Default to today
  const [status, setStatus] = useState<AttendanceStatus>("Present");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedStaffId || !date) {
      alert("Select staff & date");
      return;
    }

    setSubmitting(true);
    try {
      await onMarkAttendance({
        staffId: Number(selectedStaffId),
        date,
        status,
      });
      // Reset selection after marking
      setSelectedStaffId("");
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (attendanceStatus: AttendanceStatus) => {
    const styles: Record<AttendanceStatus, string> = {
      Present: "bg-green-100 text-green-700",
      Absent: "bg-red-100 text-red-700",
      Leave: "bg-yellow-100 text-yellow-700",
    };
    return `px-2 py-1 rounded-full text-xs font-medium ${styles[attendanceStatus]}`;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Mark Attendance Form */}
      <div className="lg:col-span-4">
        <div className="bg-white p-5 rounded-xl shadow-sm border">
          <h3 className="text-lg font-semibold mb-3">Mark Attendance</h3>

          <form onSubmit={handleSubmit} className="space-y-3">
            <label className="block">
              <span className="text-sm font-medium text-gray-700">Staff</span>
              <select
                value={selectedStaffId}
                onChange={(e) => setSelectedStaffId(e.target.value ? Number(e.target.value) : "")}
                disabled={submitting}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-400 disabled:bg-gray-100"
              >
                <option value="">Select staff</option>
                {staffList.map((s) => (
                  <option key={s.staff_id} value={s.staff_id}>
                    {s.name} ({s.position})
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="text-sm font-medium text-gray-700">Date</span>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                disabled={submitting}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-400 disabled:bg-gray-100"
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-gray-700">Status</span>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as AttendanceStatus)}
                disabled={submitting}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-400 disabled:bg-gray-100"
              >
                <option value="Present">Present</option>
                <option value="Absent">Absent</option>
                <option value="Leave">Leave</option>
              </select>
            </label>

            <div>
              <button
                type="submit"
                disabled={submitting || !selectedStaffId}
                className="w-full inline-flex justify-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? "Saving..." : "Save Attendance"}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Attendance History */}
      <div className="lg:col-span-8">
        <div className="bg-white p-5 rounded-xl shadow-sm border">
          <h3 className="text-lg font-semibold mb-3">Recent Attendance Records</h3>

          {attendance.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600">No attendance records yet.</p>
              <p className="text-sm text-gray-400 mt-1">Mark attendance for staff to see records here.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Staff</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Date</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {attendance
                    .slice()
                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                    .slice(0, 20) // Show only last 20 records
                    .map((record) => {
                      const staff = staffList.find((s) => s.staff_id === record.staffId);
                      return (
                        <tr key={record.attendance_id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-gray-700">
                            {record.staff_name || staff?.name || "Unknown"}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700">
                            {new Date(record.date).toLocaleDateString('en-IN', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric'
                            })}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <span className={getStatusBadge(record.status)}>
                              {record.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AttendanceManager;
