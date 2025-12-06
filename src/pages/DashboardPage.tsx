import React from "react";
import {
  BarChart2,
  ShoppingCart,
  Users
} from "lucide-react";

// Recharts imports
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";


// ---------------- Dashboard Content ----------------
const Dashboard: React.FC = () => {

  // Sales Chart Data
  const salesData = [
    { year: "2019", sales: 4000 },
    { year: "2020", sales: 3200 },
    { year: "2021", sales: 5000 },
    { year: "2022", sales: 4500 },
    { year: "2023", sales: 6000 },
    { year: "2024", sales: 7500 },
  ];

  return (
    <div className="w-full h-full overflow-y-auto p-6">
      {/* TOP HEADING */}
      <h1 className="text-3xl font-semibold">Dashboard Overview</h1>
      <p className="text-gray-500 text-sm mt-1">
        Welcome back! Here’s what’s happening at your shop today.
      </p>

      {/* TOP CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-6">
        
        <Card title="Today’s Revenue" value="₹80,000" growth="50% More than Average">
          <BarChart2 className="text-blue-600" size={22} />
        </Card>

        <Card title="Orders Today" value="34" growth="33 Completed">
          <ShoppingCart className="text-purple-600" size={22} />
        </Card>

        <Card title="Customers Served" value="17" growth="47 Total Customers">
          <Users className="text-orange-600" size={22} />
        </Card>

      </div>

      {/* MAIN CONTENT AREA */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-10">

        {/* INVENTORY STATUS */}
        <div className="bg-white p-6 rounded-xl shadow border">
          <h2 className="text-xl font-bold">Inventory Status</h2>
          <p className="text-gray-500 text-sm mt-1">
            Current stock levels for key items
          </p>

          <div className="mt-6 space-y-4">
            <InventoryItem title="Wireless Mouse" status="Stockout" color="bg-red-500" />
            <InventoryItem title="Mechanical Keyboard" status="Good" color="bg-green-500" />
            <InventoryItem title="USB-C Cable" status="Low" color="bg-yellow-500" />
            <InventoryItem title="Bluetooth Headphones" status="Stockout" color="bg-red-500" />
            <InventoryItem title="Power Bank" status="Good" color="bg-green-500" />
          </div>
        </div>

        {/* SALES CHART */}
        <div className="bg-white p-6 rounded-xl shadow border">
          <h2 className="text-xl font-bold">Sales Chart</h2>
          <p className="text-gray-500 text-sm mt-1">Sales comparison over the years</p>

          <div className="mt-6 h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="year" />
                <YAxis />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="sales"
                  stroke="#3b82f6"
                  strokeWidth={3}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;


// --------------------- Components ---------------------

const Card = ({ title, value, growth, children }: any) => (
  <div className="bg-white p-5 rounded-xl shadow border">
    <div className="flex items-center justify-between">
      <p className="text-gray-600">{title}</p>
      {children}
    </div>
    <h2 className="text-2xl font-bold mt-3">{value}</h2>
    <p className="text-xs text-gray-500 mt-1">{growth}</p>
  </div>
);


interface InventoryProps {
  title: string;
  status: string;
  color: string;
}

const InventoryItem: React.FC<InventoryProps> = ({ title, status, color }) => {
  return (
    <div className="flex items-center justify-between border rounded-lg p-3">
      <div>
        <p className="font-medium">{title}</p>
        <p className="text-xs text-gray-500 mt-1">Updated recently</p>
      </div>

      <span className={`px-3 py-1 text-white text-xs rounded-full ${color}`}>
        {status}
      </span>
    </div>
  );
};