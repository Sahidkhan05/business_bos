import { useNavigate } from "react-router-dom";
import { PlusCircle, ListOrdered, Folder, Boxes, FileDown } from "lucide-react";

const ProductOverview = () => {
  const navigate = useNavigate();

  const cards = [
    { title: "Add Product", icon: <PlusCircle size={40} />, path: "/products/add", color: "bg-blue-100" },
    { title: "Product List", icon: <ListOrdered size={40} />, path: "/products/list", color: "bg-green-100" },
    { title: "Categories", icon: <Folder size={40} />, path: "/products/categories", color: "bg-yellow-100" },
    { title: "Stock Management", icon: <Boxes size={40} />, path: "/products/stock", color: "bg-purple-100" },
    { title: "Import / Export", icon: <FileDown size={40} />, path: "/products/import-export", color: "bg-red-100" },
  ];

  return (
    <div className="p-6">
      <h1 className="text-2xl md:text-3xl font-semibold mb-6">Products Overview</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {cards.map((card, index) => (
          <div
            key={index}
            onClick={() => navigate(card.path)}
            className={`cursor-pointer shadow rounded-xl p-6 flex flex-col items-center justify-center gap-4 hover:shadow-xl transition-all transform hover:-translate-y-1 ${card.color} min-h-[180px]`}
          >
            <div className="flex items-center justify-center w-16 h-16 bg-white rounded-full">
              {card.icon}
            </div>
            <h2 className="text-lg md:text-xl font-medium text-center">{card.title}</h2>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProductOverview;