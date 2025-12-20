// StaffTable.tsx - Display staff list with API data
import React from "react";
import type { Staff } from "./StaffTypes";

type StaffTableProps = {
  staffList: Staff[];
  onEdit: (staff: Staff) => void;
  onDelete: (id: number) => void;
};

const StaffTable: React.FC<StaffTableProps> = ({ staffList, onEdit, onDelete }) => {
  if (!staffList.length) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">No staff members added yet.</p>
        <p className="text-sm text-gray-400 mt-1">Add your first staff member to get started.</p>
      </div>
    );
  }

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    try {
      return new Date(dateStr).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };

  const formatSalary = (salary: number | string) => {
    const num = typeof salary === 'string' ? parseFloat(salary) : salary;
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(num);
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">ID</th>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Name</th>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Position</th>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Phone</th>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Joining Date</th>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Salary</th>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Aadhaar</th>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Status</th>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Actions</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-100">
          {staffList.map((staff) => (
            <tr key={staff.staff_id} className="hover:bg-gray-50">
              <td className="px-4 py-3 text-sm text-gray-700">{staff.staff_id}</td>
              <td className="px-4 py-3 text-sm text-gray-700 font-medium">{staff.name}</td>
              <td className="px-4 py-3 text-sm text-gray-700">{staff.position}</td>
              <td className="px-4 py-3 text-sm text-gray-700">{staff.phone}</td>
              <td className="px-4 py-3 text-sm text-gray-700">{formatDate(staff.joiningDate)}</td>
              <td className="px-4 py-3 text-sm text-gray-700">{formatSalary(staff.salary)}</td>
              <td className="px-4 py-3 text-sm text-gray-500">
                {staff.aadhaarFileName ? (
                  <span className="text-sm text-green-600">{staff.aadhaarFileName}</span>
                ) : (
                  <span className="text-xs text-gray-400">Not uploaded</span>
                )}
              </td>
              <td className="px-4 py-3 text-sm">
                {staff.is_active ? (
                  <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-700">Active</span>
                ) : (
                  <span className="px-2 py-1 rounded-full text-xs bg-red-100 text-red-700">Inactive</span>
                )}
              </td>
              <td className="px-4 py-3 text-sm">
                <div className="flex gap-2">
                  <button
                    onClick={() => onEdit(staff)}
                    className="inline-flex items-center px-3 py-1 rounded-md bg-blue-600 text-white text-sm hover:bg-blue-700"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => onDelete(staff.staff_id)}
                    className="inline-flex items-center px-3 py-1 rounded-md bg-red-600 text-white text-sm hover:bg-red-700"
                  >
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default StaffTable;