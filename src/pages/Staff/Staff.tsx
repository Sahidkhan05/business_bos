// Staff.tsx
import React, { useState } from "react";
import type { Staff, AttendanceRecord } from "./StaffTypes";
import AddStaffForm from "./AddStaffForm";
import StaffTable from "./StaffTable";
import AttendanceManager from "./AttendanceManager";

type Tab = "add" | "view" | "attendance";

const StaffPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>("add");
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);

  // ---- handlers for staff ----
  const handleAddStaff = (staff: Omit<Staff, "id">) => {
    setStaffList((prev) => [
      ...prev,
      {
        ...staff,
        id: prev.length ? prev[prev.length - 1].id + 1 : 1,
      },
    ]);
  };

  const handleDeleteStaff = (id: number) => {
    setStaffList((prev) => prev.filter((s) => s.id !== id));
    setAttendance((prev) => prev.filter((a) => a.staffId !== id));
  };

  // ---- handlers for attendance ----
  const handleMarkAttendance = (record: Omit<AttendanceRecord, "id">) => {
    setAttendance((prev) => {
      const existingIndex = prev.findIndex(
        (a) => a.staffId === record.staffId && a.date === record.date
      );

      if (existingIndex !== -1) {
        const copy = [...prev];
        copy[existingIndex] = { ...copy[existingIndex], status: record.status };
        return copy;
      }

      return [
        ...prev,
        {
          ...record,
          id: prev.length ? prev[prev.length - 1].id + 1 : 1,
        },
      ];
    });
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">Shop Staff Management</h1>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => setActiveTab("add")}
          className={`px-4 py-2 rounded-md border ${activeTab === "add" ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-700"}`}
        >
          Add Staff
        </button>

        <button
          onClick={() => setActiveTab("view")}
          className={`px-4 py-2 rounded-md border ${activeTab === "view" ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-700"}`}
        >
          View Staff
        </button>

        <button
          onClick={() => setActiveTab("attendance")}
          className={`px-4 py-2 rounded-md border ${activeTab === "attendance" ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-700"}`}
        >
          Attendance
        </button>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === "add" && (
          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <AddStaffForm onAddStaff={handleAddStaff} />
          </div>
        )}

        {activeTab === "view" && (
          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <StaffTable staffList={staffList} onDelete={handleDeleteStaff} />
          </div>
        )}

        {activeTab === "attendance" && (
          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <AttendanceManager
              staffList={staffList}
              attendance={attendance}
              onMarkAttendance={handleMarkAttendance}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default StaffPage;
