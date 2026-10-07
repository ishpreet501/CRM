import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import Navbar from "../components/Navbar";
import toast from "react-hot-toast";

export default function Dashboard() {
  const [stats, setStats] = useState({
    total: 0,
    new: 0,
    contacted: 0,
    qualified: 0,
    proposal: 0,
    won: 0,
    lost: 0,
  });
  const [recentLeads, setRecentLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch stats and recent leads concurrently
      const [statsRes, leadsRes] = await Promise.all([
        api.get("/leads/stats"),
        api.get("/leads?limit=5&sort=newest"),
      ]);

      setStats(statsRes.data);
      setRecentLeads(leadsRes.data.leads || leadsRes.data || []);
    } catch (err) {
      console.error("Dashboard error:", err);
      setError("Failed to load dashboard data");
      toast.error("Could not load dashboard statistics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const getStatusBadge = (status) => {
    const map = {
      New: "bg-blue-100 text-blue-700 border-blue-200",
      Contacted: "bg-purple-100 text-purple-700 border-purple-200",
      Qualified: "bg-amber-100 text-amber-700 border-amber-200",
      Proposal: "bg-indigo-100 text-indigo-700 border-indigo-200",
      Won: "bg-emerald-100 text-emerald-700 border-emerald-200",
      Lost: "bg-rose-100 text-rose-700 border-rose-200",
    };
    return (
      map[status] || "bg-gray-100 text-gray-700 border-gray-200"
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-800">
              Lead Analytics Dashboard
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              Overview of your leads and sales conversion pipeline
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/leads"
              className="border border-slate-300 text-slate-700 hover:bg-slate-50 px-4 py-2.5 rounded-lg text-sm font-medium transition"
            >
              All Leads
            </Link>
            <Link
              to="/leads/add"
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium shadow-sm transition"
            >
              + Add Lead
            </Link>
          </div>
        </div>

        {/* Loading and Error States */}
        {loading ? (
          <div className="bg-white rounded-2xl p-12 text-center text-slate-500 shadow-sm border border-slate-100">
            <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-3"></div>
            <p className="text-sm font-medium">Loading dashboard metrics...</p>
          </div>
        ) : error ? (
          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6 text-center text-rose-700">
            <p className="font-semibold">{error}</p>
            <button
              onClick={fetchDashboardData}
              className="mt-3 bg-rose-600 hover:bg-rose-700 text-white px-4 py-1.5 rounded-lg text-sm"
            >
              Retry
            </button>
          </div>
        ) : (
          <>
            {/* Lead Statistics Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              <StatCard
                title="Total Leads"
                value={stats.total}
                colorClass="text-slate-900"
                bgAccent="bg-slate-100 text-slate-700"
              />
              <StatCard
                title="New"
                value={stats.new}
                colorClass="text-blue-600"
                bgAccent="bg-blue-50 text-blue-600"
              />
              <StatCard
                title="Contacted"
                value={stats.contacted}
                colorClass="text-purple-600"
                bgAccent="bg-purple-50 text-purple-600"
              />
              <StatCard
                title="Qualified"
                value={stats.qualified}
                colorClass="text-amber-600"
                bgAccent="bg-amber-50 text-amber-600"
              />
              <StatCard
                title="Won"
                value={stats.won}
                colorClass="text-emerald-600"
                bgAccent="bg-emerald-50 text-emerald-600"
              />
              <StatCard
                title="Lost"
                value={stats.lost}
                colorClass="text-rose-600"
                bgAccent="bg-rose-50 text-rose-600"
              />
            </div>

            {/* Recent Leads Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="p-5 sm:p-6 border-b border-slate-100 flex justify-between items-center">
                <div>
                  <h2 className="text-lg font-bold text-slate-800">
                    Recent Leads
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Your 5 most recently created sales leads
                  </p>
                </div>
                <Link
                  to="/leads"
                  className="text-sm font-semibold text-blue-600 hover:text-blue-700"
                >
                  View All &rarr;
                </Link>
              </div>

              {recentLeads.length === 0 ? (
                <div className="p-12 text-center text-slate-500">
                  <p className="text-base font-medium">No leads added yet</p>
                  <p className="text-sm text-slate-400 mt-1">
                    Start by clicking the "Add Lead" button above.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-slate-600">
                    <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-500 border-b border-slate-100">
                      <tr>
                        <th className="px-6 py-3.5">Name</th>
                        <th className="px-6 py-3.5">Email</th>
                        <th className="px-6 py-3.5">Company</th>
                        <th className="px-6 py-3.5">Status</th>
                        <th className="px-6 py-3.5">Created</th>
                        <th className="px-6 py-3.5 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {recentLeads.map((lead) => (
                        <tr
                          key={lead._id}
                          className="hover:bg-slate-50/70 transition"
                        >
                          <td className="px-6 py-4 font-semibold text-slate-800">
                            {lead.name}
                          </td>
                          <td className="px-6 py-4">{lead.email}</td>
                          <td className="px-6 py-4">
                            {lead.company || "-"}
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${getStatusBadge(
                                lead.status
                              )}`}
                            >
                              {lead.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-xs text-slate-400">
                            {new Date(lead.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <Link
                              to={`/leads/${lead._id}/edit`}
                              className="text-xs font-semibold text-blue-600 hover:text-blue-800 bg-blue-50 px-2.5 py-1 rounded"
                            >
                              Edit
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}

function StatCard({ title, value, colorClass, bgAccent }) {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex flex-col justify-between">
      <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
        {title}
      </span>
      <div className="mt-3 flex items-baseline justify-between">
        <span className={`text-3xl font-extrabold ${colorClass}`}>
          {value}
        </span>
        <span
          className={`text-xs px-2 py-0.5 rounded-full font-medium ${bgAccent}`}
        >
          Active
        </span>
      </div>
    </div>
  );
}