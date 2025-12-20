// Staff.tsx - Main Staff Management Page with API Integration
import React, { useState, useEffect, useCallback } from "react";
import type { Staff, AttendanceRecord } from "./StaffTypes";
import { staffService } from "../../services/staffService";
import AddStaffForm from "./AddStaffForm";
import StaffTable from "./StaffTable";
import AttendanceManager from "./AttendanceManager";
import EditStaffModal from "./EditStaffModal";

type Tab = "add" | "view" | "attendance";

const StaffPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>("view");
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);

  // ---- Load data from API ----
  const fetchStaff = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await staffService.getStaff();
      setStaffList(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load staff");
      console.error("Error fetching staff:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchAttendance = useCallback(async () => {
    try {
      const data = await staffService.getAttendance();
      setAttendance(data);
    } catch (err) {
      console.error("Error fetching attendance:", err);
    }
  }, []);

  useEffect(() => {
    fetchStaff();
    fetchAttendance();
  }, [fetchStaff, fetchAttendance]);

  // ---- handlers for staff ----
  const handleAddStaff = async (staff: Omit<Staff, "staff_id" | "created_at" | "updated_at">) => {
    try {
      setError(null);
      await staffService.createStaff({
        name: staff.name,
        position: staff.position,
        phone: staff.phone,
        email: staff.email,
        joiningDate: staff.joiningDate,
        salary: staff.salary,
        aadhaar_file: staff.aadhaar_file,
        is_active: staff.is_active,
      });
      await fetchStaff(); // Refresh the list
      setActiveTab("view"); // Switch to view tab after adding
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add staff");
      console.error("Error adding staff:", err);
    }
  };

  const handleEditStaff = (staff: Staff) => {
    setEditingStaff(staff);
  };

  const handleUpdateStaff = async (updatedStaff: Partial<Staff> & { staff_id: number }) => {
    try {
      setError(null);
      await staffService.updateStaff(updatedStaff.staff_id, {
        name: updatedStaff.name,
        position: updatedStaff.position,
        phone: updatedStaff.phone,
        email: updatedStaff.email,
        joiningDate: updatedStaff.joiningDate,
        salary: updatedStaff.salary,
        is_active: updatedStaff.is_active,
      });
      await fetchStaff(); // Refresh the list
      setEditingStaff(null); // Close modal
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update staff");
      console.error("Error updating staff:", err);
    }
  };

  const handleDeleteStaff = async (id: number) => {
    if (!confirm("Are you sure you want to delete this staff member?")) {
      return;
    }

    try {
      setError(null);
      await staffService.deleteStaff(id);
      await fetchStaff(); // Refresh the list
      await fetchAttendance(); // Also refresh attendance
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete staff");
      console.error("Error deleting staff:", err);
    }
  };

  // ---- handlers for attendance ----
  const handleMarkAttendance = async (record: Omit<AttendanceRecord, "attendance_id" | "created_at">) => {
    try {
      setError(null);
      await staffService.markAttendance({
        staffId: record.staffId,
        date: record.date,
        status: record.status,
      });
      await fetchAttendance(); // Refresh attendance list
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to mark attendance");
      console.error("Error marking attendance:", err);
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading staff data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">Shop Staff Management</h1>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          <p className="font-medium">Error</p>
          <p className="text-sm">{error}</p>
          <button
            onClick={fetchStaff}
            className="mt-2 text-sm underline hover:no-underline"
          >
            Try again
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => setActiveTab("view")}
          className={`px-4 py-2 rounded-md border ${activeTab === "view" ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-700"}`}
        >
          View Staff ({staffList.length})
        </button>

        <button
          onClick={() => setActiveTab("add")}
          className={`px-4 py-2 rounded-md border ${activeTab === "add" ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-700"}`}
        >
          Add Staff
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
        {activeTab === "view" && (
          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <StaffTable
              staffList={staffList}
              onEdit={handleEditStaff}
              onDelete={handleDeleteStaff}
            />
          </div>
        )}

        {activeTab === "add" && (
          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <AddStaffForm onAddStaff={handleAddStaff} />
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

      {/* Edit Modal */}
      {editingStaff && (
        <EditStaffModal
          staff={editingStaff}
          onSave={handleUpdateStaff}
          onClose={() => setEditingStaff(null)}
        />
      )}
    </div>
  );
};

export default StaffPage;
