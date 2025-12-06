// src/components/DashboardLayout.tsx
import Sidebar from "./Sidebar";
import { Outlet } from "react-router-dom";

export default function DashboardLayout() {
  return (
    <div className="flex min-h-screen bg-gray-100">
      
      {/* LEFT SIDEBAR */}
      <div className="w-64 fixed top-0 left-0 h-screen">
        <Sidebar />
      </div>

      {/* RIGHT MAIN CONTENT */}
      <div className="flex-1 ml-64 p-6 overflow-y-auto">
        {/* Render the page based on route */}
        <Outlet />
      </div>
    </div>
  );
}