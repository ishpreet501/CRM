import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import Navbar from "../components/Navbar";
import ConfirmModal from "../components/ConfirmModal";
import toast from "react-hot-toast";

export default function Leads() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Search, Filter, Sort, Pagination state
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalLeads, setTotalLeads] = useState(0);

  // Delete modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [leadToDelete, setLeadToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchLeads = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (search.trim()) params.append("search", search.trim());
      if (statusFilter && statusFilter !== "All") params.append("status", statusFilter);
      if (sort) params.append("sort", sort);
      params.append("page", page);
      params.append("limit", 8);

      const response = await api.get(`/leads?${params.toString()}`);

      setLeads(response.data.leads || []);
      setTotalPages(response.data.totalPages || 1);
      setTotalLeads(response.data.totalLeads || 0);
    } catch (err) {
      console.error("Fetch leads error:", err);
      setError("Failed to fetch leads");
      toast.error("Could not load leads");
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, sort, page]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  // Open delete confirmation modal
  const handleOpenDeleteModal = (lead) => {
    setLeadToDelete(lead);
    setDeleteModalOpen(true);
  };

  // Confirm delete handler
  const handleConfirmDelete = async () => {
    if (!leadToDelete) return;

    try {
      setDeleteLoading(true);
      await api.delete(`/leads/${leadToDelete._id}`);

      toast.success(`Lead "${leadToDelete.name}" deleted successfully`);
      setDeleteModalOpen(false);
      setLeadToDelete(null);

      // Refresh list
      fetchLeads();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete lead");
    } finally {
      setDeleteLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const map = {
      New: "bg-blue-100 text-blue-700 border-blue-200",
      Contacted: "bg-purple-100 text-purple-700 border-purple-200",
      Qualified: "bg-amber-100 text-amber-700 border-amber-200",
      Proposal: "bg-indigo-100 text-indigo-700 border-indigo-200",
      Won: "bg-emerald-100 text-emerald-700 border-emerald-200",
      Lost: "bg-rose-100 text-rose-700 border-rose-200",
    };
    return map[status] || "bg-gray-100 text-gray-700 border-gray-200";
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-800">
              Leads Management
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              Search, filter, edit and track your sales enquiries
            </p>
          </div>

          <Link
            to="/leads/add"
            className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg text-sm font-semibold shadow-sm transition"
          >
            <span>+ Add New Lead</span>
          </Link>
        </div>

        {/* Filter and Search Bar */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-slate-100 grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Search */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">
              Search
            </label>
            <input
              type="text"
              placeholder="Search name, email, company..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full border border-slate-300 rounded-lg px-3.5 py-2 text-sm outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
            />
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">
              Filter by Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="w-full border border-slate-300 rounded-lg px-3.5 py-2 text-sm outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 bg-white"
            >
              <option value="All">All Statuses</option>
              <option value="New">New</option>
              <option value="Contacted">Contacted</option>
              <option value="Qualified">Qualified</option>
              <option value="Proposal">Proposal</option>
              <option value="Won">Won</option>
              <option value="Lost">Lost</option>
            </select>
          </div>

          {/* Sort */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">
              Sort By
            </label>
            <select
              value={sort}
              onChange={(e) => {
                setSort(e.target.value);
                setPage(1);
              }}
              className="w-full border border-slate-300 rounded-lg px-3.5 py-2 text-sm outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 bg-white"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="name">Name (A - Z)</option>
            </select>
          </div>
        </div>

        {/* Leads Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          {loading ? (
            <div className="p-16 text-center text-slate-500">
              <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-3"></div>
              <p className="text-sm font-medium">Loading leads...</p>
            </div>
          ) : error ? (
            <div className="p-12 text-center text-rose-600">
              <p className="font-semibold">{error}</p>
              <button
                onClick={fetchLeads}
                className="mt-3 bg-rose-600 text-white px-4 py-1.5 rounded-lg text-sm"
              >
                Retry
              </button>
            </div>
          ) : leads.length === 0 ? (
            <div className="p-16 text-center text-slate-500">
              <p className="text-lg font-bold text-slate-700">No leads found</p>
              <p className="text-sm text-slate-400 mt-1">
                Try adjusting your search filters or click "+ Add New Lead".
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-500 border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-3.5">Name</th>
                    <th className="px-6 py-3.5">Contact Info</th>
                    <th className="px-6 py-3.5">Company</th>
                    <th className="px-6 py-3.5">Source</th>
                    <th className="px-6 py-3.5">Status</th>
                    <th className="px-6 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {leads.map((lead) => (
                    <tr
                      key={lead._id}
                      className="hover:bg-slate-50/70 transition"
                    >
                      <td className="px-6 py-4">
                        <span className="font-semibold text-slate-800 block">
                          {lead.name}
                        </span>
                        {lead.notes && (
                          <span className="text-xs text-slate-400 truncate max-w-xs block mt-0.5" title={lead.notes}>
                            {lead.notes}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-xs space-y-0.5">
                          <p className="text-slate-700">{lead.email}</p>
                          <p className="text-slate-400">{lead.phone}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-medium text-slate-700">
                        {lead.company || "-"}
                      </td>
                      <td className="px-6 py-4 text-xs font-medium text-slate-500">
                        {lead.source || "Other"}
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
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            to={`/leads/${lead._id}/edit`}
                            className="text-xs font-semibold text-blue-600 hover:text-blue-800 bg-blue-50 px-2.5 py-1.5 rounded transition"
                          >
                            Edit
                          </Link>
                          <button
                            type="button"
                            onClick={() => handleOpenDeleteModal(lead)}
                            className="text-xs font-semibold text-red-600 hover:text-red-800 bg-red-50 px-2.5 py-1.5 rounded transition"
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
          )}

          {/* Pagination Bar */}
          {!loading && totalPages > 1 && (
            <div className="p-4 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-3">
              <span className="text-xs text-slate-500">
                Total <strong>{totalLeads}</strong> leads &bull; Page{" "}
                <strong>{page}</strong> of <strong>{totalPages}</strong>
              </span>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                  className="px-3 py-1.5 border border-slate-200 text-xs font-medium rounded-lg text-slate-600 hover:bg-slate-50 disabled:opacity-40"
                >
                  Previous
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (p) => (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                        page === p
                          ? "bg-blue-600 text-white"
                          : "border border-slate-200 text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      {p}
                    </button>
                  )
                )}

                <button
                  type="button"
                  disabled={page >= totalPages}
                  onClick={() =>
                    setPage((prev) => Math.min(totalPages, prev + 1))
                  }
                  className="px-3 py-1.5 border border-slate-200 text-xs font-medium rounded-lg text-slate-600 hover:bg-slate-50 disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteModalOpen}
        title="Delete Lead"
        message={`Are you sure you want to delete lead "${leadToDelete?.name}"? This action cannot be reversed.`}
        confirmText="Yes, Delete"
        onConfirm={handleConfirmDelete}
        onClose={() => {
          setDeleteModalOpen(false);
          setLeadToDelete(null);
        }}
        loading={deleteLoading}
      />
    </div>
  );
}