import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

import {
  Home,
  ShoppingCart,
  Box,
  Layers,
  Users,
  BarChart2,
  UserCog,
  Settings,
  LogOut,
} from "lucide-react";

// Sidebar Item Component
const SidebarItem = ({
  icon,
  label,
  to,
}: {
  icon: React.ReactNode;
  label: string;
  to: string;
}) => {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex items-center gap-3 px-5 py-3 cursor-pointer hover:bg-gray-100 ${isActive ? "bg-gray-100 border-r-4 border-black" : ""
        }`
      }
    >
      {icon}
      <span className="text-sm font-medium">{label}</span>
    </NavLink>
  );
};

const Sidebar = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/"); // Redirect to login page
    } catch (error) {
      console.error("Logout failed:", error);
      // Still navigate to login even if API call fails
      navigate("/");
    }
  };

  return (
    <div className="h-screen w-64 bg-white border-r flex flex-col justify-between">
      {/* Top Section */}
      <div>
        <div className="p-5">
          <div className="text-xl font-bold leading-tight">Navonous AI</div>
          <div className="text-xs text-gray-500">Business BOS</div>
        </div>

        {/* Menu List */}
        <nav className="mt-4">
          <SidebarItem icon={<Home size={18} />} label="Dashboard" to="/dashboard" />
          {/* 👇 route me 'billing' small h hai, isliye yaha bhi */}
          <SidebarItem icon={<ShoppingCart size={18} />} label="POS Billing" to="/billing" />
          <SidebarItem icon={<Box size={18} />} label="Products" to="/products" />
          <SidebarItem icon={<Layers size={18} />} label="Inventory" to="/inventory" />
          <SidebarItem icon={<Users size={18} />} label="Customers" to="/customers" />
          <SidebarItem icon={<BarChart2 size={18} />} label="Sales Report" to="/sales" />
          {/* 👇 Staff link */}
          <SidebarItem icon={<UserCog size={18} />} label="Staff" to="/staff" />
          <SidebarItem icon={<Settings size={18} />} label="Settings" to="/settings" />
        </nav>
      </div>

      {/* Logout Button */}
      <div className="p-4">
        <div
          onClick={handleLogout}
          className="flex items-center gap-3 text-red-600 font-medium cursor-pointer"
        >
          <LogOut size={18} />
          <span>Log Out</span>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
