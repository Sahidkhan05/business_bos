// AddStaffForm.tsx - Form for adding new staff members
import React, { useState } from "react";
import type { Staff } from "./StaffTypes";

type AddStaffFormProps = {
  onAddStaff: (staff: Omit<Staff, "staff_id" | "created_at" | "updated_at">) => void;
};

const AddStaffForm: React.FC<AddStaffFormProps> = ({ onAddStaff }) => {
  const [name, setName] = useState("");
  const [position, setPosition] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [joiningDate, setJoiningDate] = useState("");
  const [salary, setSalary] = useState<number | "">("");
  const [aadhaarFile, setAadhaarFile] = useState<File | null>(null);
  const [isActive, setIsActive] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !name ||
      !position ||
      !phone ||
      !joiningDate ||
      salary === "" ||
      salary <= 0
    ) {
      alert("Please fill all required fields correctly");
      return;
    }

    setSubmitting(true);
    try {
      await onAddStaff({
        name,
        position,
        phone,
        email: email || undefined,
        joiningDate,
        salary: Number(salary),
        aadhaar_file: aadhaarFile,
        aadhaarFileName: aadhaarFile?.name,
        is_active: isActive,
      });

      // Reset form on success
      resetForm();
    } finally {
      setSubmitting(false);
    }
  };

  const handleAadhaarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setAadhaarFile(file || null);
  };

  const resetForm = () => {
    setName("");
    setPosition("");
    setPhone("");
    setEmail("");
    setJoiningDate("");
    setSalary("");
    setAadhaarFile(null);
    setIsActive(true);
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-xl w-full space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Staff Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={name}
          placeholder="e.g. Ramesh Kumar"
          onChange={(e) => setName(e.target.value)}
          disabled={submitting}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-400 disabled:bg-gray-100"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Position <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={position}
          placeholder="e.g. Cashier, Salesman"
          onChange={(e) => setPosition(e.target.value)}
          disabled={submitting}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-400 disabled:bg-gray-100"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Mobile Number <span className="text-red-500">*</span>
          </label>
          <input
            type="tel"
            value={phone}
            placeholder="e.g. 9876543210"
            onChange={(e) => setPhone(e.target.value)}
            disabled={submitting}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-400 disabled:bg-gray-100"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Email</label>
          <input
            type="email"
            value={email}
            placeholder="e.g. ramesh@example.com"
            onChange={(e) => setEmail(e.target.value)}
            disabled={submitting}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-400 disabled:bg-gray-100"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Joining Date <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            value={joiningDate}
            onChange={(e) => setJoiningDate(e.target.value)}
            disabled={submitting}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-400 disabled:bg-gray-100"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Monthly Salary (₹) <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            value={salary}
            placeholder="e.g. 15000"
            onChange={(e) => setSalary(e.target.value ? Number(e.target.value) : "")}
            disabled={submitting}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-400 disabled:bg-gray-100"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Aadhaar File (PDF / Image)
        </label>
        <input
          type="file"
          accept=".pdf,image/*"
          onChange={handleAadhaarChange}
          disabled={submitting}
          className="mt-2 block w-full text-sm text-gray-600 disabled:opacity-50"
        />
        {aadhaarFile && (
          <p className="text-xs text-gray-500 mt-1">Selected: {aadhaarFile.name}</p>
        )}
      </div>

      {/* Is Active Toggle */}
      <div className="flex items-center gap-3">
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            disabled={submitting}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
          <span className="ml-3 text-sm font-medium text-gray-700">
            {isActive ? "Active" : "Inactive"}
          </span>
        </label>
      </div>

      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 shadow disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
              </svg>
              Adding...
            </>
          ) : (
            "Add Staff"
          )}
        </button>

        <button
          type="button"
          onClick={resetForm}
          disabled={submitting}
          className="px-4 py-2 rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50"
        >
          Reset
        </button>
      </div>
    </form>
  );
};

export default AddStaffForm;
