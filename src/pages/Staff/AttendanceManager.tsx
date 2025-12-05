// AttendanceManager.tsx
import React, { useState } from "react";
import type {
  Staff,
  AttendanceRecord,
  AttendanceStatus,
} from "./StaffTypes";

type AttendanceManagerProps = {
  staffList: Staff[];
  attendance: AttendanceRecord[];
  onMarkAttendance: (record: Omit<AttendanceRecord, "id">) => void;
};

const thStyle: React.CSSProperties = {
  border: "1px solid #ccc",
  padding: "8px",
  textAlign: "left",
  background: "#f5f5f5",
};

const tdStyle: React.CSSProperties = {
  border: "1px solid #ccc",
  padding: "8px",
};

const AttendanceManager: React.FC<AttendanceManagerProps> = ({
  staffList,
  attendance,
  onMarkAttendance,
}) => {
  const [selectedStaffId, setSelectedStaffId] = useState<number | "">("");
  const [date, setDate] = useState("");
  const [status, setStatus] = useState<AttendanceStatus>("Present");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedStaffId || !date) {
      alert("Select staff & date");
      return;
    }

    onMarkAttendance({
      staffId: Number(selectedStaffId),
      date,
      status,
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <div className="lg:col-span-4">
        <div className="bg-white p-5 rounded-xl shadow-sm border">
          <h3 className="text-lg font-semibold mb-3">Mark Attendance</h3>

          <form onSubmit={handleSubmit} className="space-y-3">
            <label className="block">
              <span className="text-sm font-medium text-gray-700">Staff</span>
              <select
                value={selectedStaffId}
                onChange={(e) => setSelectedStaffId(e.target.value ? Number(e.target.value) : "")}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-400"
              >
                <option value="">Select staff</option>
                {staffList.map((s) => (
                  <option key={s.id} value={s.id}>
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
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-400"
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-gray-700">Status</span>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as AttendanceStatus)}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-400"
              >
                <option value="Present">Present</option>
                <option value="Absent">Absent</option>
                <option value="Leave">Leave</option>
              </select>
            </label>

            <div>
              <button
                type="submit"
                className="w-full inline-flex justify-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                Save Attendance
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="lg:col-span-8">
        <div className="bg-white p-5 rounded-xl shadow-sm border">
          <h3 className="text-lg font-semibold mb-3">Recent Staff Attendance</h3>

          {attendance.length === 0 ? (
            <p className="text-gray-600">No attendance records yet.</p>
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
                    .reverse()
                    .map((record) => {
                      const staff = staffList.find((s) => s.id === record.staffId);
                      return (
                        <tr key={record.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-gray-700">{staff?.name ?? "Unknown"}</td>
                          <td className="px-4 py-3 text-sm text-gray-700">{record.date}</td>
                          <td className="px-4 py-3 text-sm text-gray-700">{record.status}</td>
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
