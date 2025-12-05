// StaffTable.tsx
import React from "react";
import type { Staff } from "./StaffTypes";

type StaffTableProps = {
  staffList: Staff[];
  onDelete: (id: number) => void;
};

const StaffTable: React.FC<StaffTableProps> = ({ staffList, onDelete }) => {
  if (!staffList.length) {
    return <p className="text-gray-600">No staff added yet.</p>;
  }

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
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Salary (₹)</th>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Aadhaar File</th>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Actions</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-100">
          {staffList.map((staff) => (
            <tr key={staff.id} className="hover:bg-gray-50">
              <td className="px-4 py-3 text-sm text-gray-700">{staff.id}</td>
              <td className="px-4 py-3 text-sm text-gray-700">{staff.name}</td>
              <td className="px-4 py-3 text-sm text-gray-700">{staff.position}</td>
              <td className="px-4 py-3 text-sm text-gray-700">{staff.phone}</td>
              <td className="px-4 py-3 text-sm text-gray-700">{staff.joiningDate}</td>
              <td className="px-4 py-3 text-sm text-gray-700">{staff.salary}</td>
              <td className="px-4 py-3 text-sm text-gray-500">
                {staff.aadhaarFileName ? (
                  <span className="text-sm text-gray-700">{staff.aadhaarFileName}</span>
                ) : (
                  <span className="text-xs text-gray-400">Not uploaded</span>
                )}
              </td>
              <td className="px-4 py-3 text-sm">
                <button
                  onClick={() => onDelete(staff.id)}
                  className="inline-flex items-center px-3 py-1 rounded-md bg-red-600 text-white text-sm hover:bg-red-700"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default StaffTable;