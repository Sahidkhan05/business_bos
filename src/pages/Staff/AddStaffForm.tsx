// AddStaffForm.tsx
import React, { useState } from "react";
import type { Staff } from "./StaffTypes";

type AddStaffFormProps = {
  onAddStaff: (staff: Omit<Staff, "id">) => void;
};

const AddStaffForm: React.FC<AddStaffFormProps> = ({ onAddStaff }) => {
  const [name, setName] = useState("");
  const [position, setPosition] = useState("");
  const [phone, setPhone] = useState("");
  const [joiningDate, setJoiningDate] = useState("");
  const [salary, setSalary] = useState<number | "">("");
  const [aadhaarFile, setAadhaarFile] = useState<File | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !name ||
      !position ||
      !phone ||
      !joiningDate ||
      salary === "" ||
      salary <= 0
    ) {
      alert("Please fill all fields correctly");
      return;
    }

    onAddStaff({
      name,
      position,
      phone,
      joiningDate,
      salary: Number(salary),
      aadhaarFileName: aadhaarFile?.name,
    });

    setName("");
    setPosition("");
    setPhone("");
    setJoiningDate("");
    setSalary("");
    setAadhaarFile(null);
  };

  const handleAadhaarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAadhaarFile(file);
    } else {
      setAadhaarFile(null);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-xl w-full space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Staff Name</label>
        <input
          type="text"
          value={name}
          placeholder="e.g. Ramesh Kumar"
          onChange={(e) => setName(e.target.value)}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-400"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Position</label>
        <input
          type="text"
          value={position}
          placeholder="e.g. Cashier, Salesman"
          onChange={(e) => setPosition(e.target.value)}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-400"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Mobile Number</label>
          <input
            type="tel"
            value={phone}
            placeholder="e.g. 9876543210"
            onChange={(e) => setPhone(e.target.value)}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-400"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Joining Date</label>
          <input
            type="date"
            value={joiningDate}
            onChange={(e) => setJoiningDate(e.target.value)}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-400"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Monthly Salary (₹)</label>
        <input
          type="number"
          value={salary}
          placeholder="e.g. 15000"
          onChange={(e) => setSalary(e.target.value ? Number(e.target.value) : "")}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-400"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Aadhaar File (PDF / Image)</label>
        <input
          type="file"
          accept=".pdf,image/*"
          onChange={handleAadhaarChange}
          className="mt-2 block w-full text-sm text-gray-600"
        />
        {aadhaarFile && <p className="text-xs text-gray-500 mt-1">Selected: {aadhaarFile.name}</p>}
      </div>

      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 shadow"
        >
          Add Staff
        </button>

        <button
          type="button"
          onClick={() => {
            setName("");
            setPosition("");
            setPhone("");
            setJoiningDate("");
            setSalary("");
            setAadhaarFile(null);
          }}
          className="px-4 py-2 rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200"
        >
          Reset
        </button>
      </div>
    </form>
  );
};

export default AddStaffForm;
