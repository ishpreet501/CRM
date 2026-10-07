import { Link, useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    toast.success("Logged out successfully");
    navigate("/login");
  };

  const navLinks = [
    { name: "Dashboard", path: "/dashboard" },
    { name: "Leads", path: "/leads" },
  ];

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo & Navigation */}
          <div className="flex items-center gap-8">
            <Link to="/dashboard" className="flex items-center gap-2">
              <span className="text-2xl font-black bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                LeadCRM
              </span>
            </Link>

            <nav className="hidden md:flex space-x-1">
              {navLinks.map((link) => {
                const isActive = location.pathname === link.path;
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition ${
                      isActive
                        ? "bg-blue-50 text-blue-700"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                    }`}
                  >
                    {link.name}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* User Profile & Actions */}
          <div className="flex items-center gap-3">
            <Link
              to="/leads/add"
              className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-3.5 py-2 rounded-lg transition"
            >
              + Add Lead
            </Link>

            <div className="hidden sm:flex flex-col text-right">
              <span className="text-sm font-medium text-gray-800">
                {user.name || "User"}
              </span>
              <span className="text-xs text-gray-500">{user.email || ""}</span>
            </div>

            <button
              onClick={handleLogout}
              className="border border-gray-300 hover:bg-red-50 hover:text-red-600 hover:border-red-300 text-gray-700 text-sm font-medium px-3 py-2 rounded-lg transition ml-2"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
