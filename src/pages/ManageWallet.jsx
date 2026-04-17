// src/pages/ManageWallet.jsx
import { useState, useEffect, useCallback, useMemo } from "react";
import { useTheme } from "../context/ThemeContext";
import { useFont } from "../context/FontContext";
import { walletApi } from "../api/walletApi";
import { toast } from "sonner";
import Swal from "sweetalert2";
import {
  FaWallet, FaHistory, FaArrowUp, FaArrowDown,
  FaSync, FaSearch, FaTimes, FaCoins, FaHandHoldingUsd,
  FaCheckCircle, FaClock, FaExclamationCircle,
  FaFilter, FaDownload, FaPrint, FaEye, FaPaperPlane,
  FaExclamationTriangle
} from "react-icons/fa";
import {
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
  TrendingUp, TrendingDown, DollarSign, Calendar, Info, Banknote,
  CreditCard, Clock, CheckCircle, XCircle, AlertCircle
} from "lucide-react";

// Chart Colors
const CHART_COLORS = {
  primary: '#3B82F6',
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  purple: '#8B5CF6',
  cyan: '#06B6D4',
  orange: '#F97316',
  teal: '#14B8A6',
  gray: '#94A3B8',
  lightGray: '#E5E7EB'
};

// ─────────────────────────────────────────────
// StatBox Component
// ─────────────────────────────────────────────
const StatBox = ({ label, value, icon: Icon, color }) => (
  <div
    className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden"
    style={{ borderColor: '#e5e7eb', boxShadow: `0 4px 20px rgba(0,0,0,0.06), 0 1px 4px rgba(0,0,0,0.04)` }}
  >
    <div className="p-5 sm:p-6">
      <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 shadow-sm" style={{ backgroundColor: color + '20' }}>
        <Icon size={22} style={{ color }} />
      </div>
      <p className="text-3xl sm:text-4xl font-black text-gray-900 leading-none mb-2">{value}</p>
      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{label}</p>
    </div>
  </div>
);

// ─────────────────────────────────────────────
// Withdraw Modal Component
// ─────────────────────────────────────────────
const WithdrawModal = ({ isOpen, onClose, balance, themeColors }) => {
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const withdrawAmount = Number(amount);

    if (isNaN(withdrawAmount) || withdrawAmount <= 0) {
      return toast.error("Valid amount daalein");
    }

    if (withdrawAmount > balance) {
      return Swal.fire({
        icon: 'error',
        title: 'Insufficient Balance',
        text: `Aapke wallet mein sirf ₹${balance.toLocaleString()} hain.`,
        confirmButtonColor: '#3B82F6'
      });
    }

    const result = await Swal.fire({
      title: 'Withdrawal Request Karein?',
      text: `₹${withdrawAmount.toLocaleString()} aapke wallet se kat jayenge aur approval ke liye bhej diye jayenge.`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#3B82F6',
      cancelButtonColor: '#94A3B8',
      confirmButtonText: 'Haan, Request Bhejo',
      cancelButtonText: 'Cancel'
    });

    if (!result.isConfirmed) return;

    setLoading(true);
    try {
      const res = await walletApi.withdraw({ amount: withdrawAmount, description });
      if (res.success) {
        await Swal.fire({
          icon: 'success',
          title: 'Request Submitted!',
          text: 'Aapki withdrawal request Admin ko bhej di gayi hai.',
          confirmButtonColor: '#10B981'
        });
        setAmount("");
        setDescription("");
        onClose();
        window.location.reload();
      } else {
        throw new Error(res.message || "Withdrawal failed");
      }
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: err?.response?.data?.message || err?.message || "Kuch gadbad ho gayi!",
        confirmButtonColor: '#EF4444'
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-gray-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-600 rounded-xl text-white">
              <FaPaperPlane size={16} />
            </div>
            <h2 className="text-lg font-bold text-gray-900">Withdrawal Request</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <FaTimes size={18} className="text-gray-600" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Balance Display */}
          <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl p-5 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-xs mb-1">Available Balance</p>
                <p className="text-3xl font-bold">₹{balance.toLocaleString()}</p>
              </div>
              <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                <FaWallet size={24} className="text-white" />
              </div>
            </div>
          </div>

          {/* Amount Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Withdrawal Amount</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-bold text-gray-400">₹</span>
              <input
                type="number"
                required
                placeholder="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full pl-10 pr-24 py-4 border border-gray-300 rounded-xl text-2xl font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
              <button
                type="button"
                onClick={() => setAmount(balance.toString())}
                className="absolute right-3 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-xs font-medium hover:bg-blue-100 transition-colors"
              >
                Max
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2">Minimum withdrawal: ₹100</p>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Description (Optional)</label>
            <textarea
              rows="3"
              placeholder="Add a note for your withdrawal request..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none"
            />
          </div>

          {/* Info Boxes */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
              <p className="text-xs text-blue-600 font-medium mb-1">Processing Time</p>
              <p className="text-sm font-bold text-gray-900">24-48 hours</p>
            </div>
            <div className="p-4 bg-purple-50 rounded-xl border border-purple-100">
              <p className="text-xs text-purple-600 font-medium mb-1">Withdrawal Fee</p>
              <p className="text-sm font-bold text-gray-900">Free</p>
            </div>
          </div>

          {/* Warning Note */}
          <div className="flex items-start gap-3 p-4 bg-yellow-50 rounded-xl border border-yellow-200">
            <FaExclamationTriangle className="text-yellow-600 mt-0.5 shrink-0" size={16} />
            <p className="text-xs text-yellow-700 leading-relaxed">
              Make sure your bank details are correct in your profile. Incorrect details may cause delays.
            </p>
          </div>

          {/* Buttons */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 border border-gray-300 rounded-xl font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 px-4 bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
              ) : (
                <>
                  <FaPaperPlane size={14} />
                  Submit Request
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// Main ManageWallet Component
// ─────────────────────────────────────────────
export default function ManageWallet() {
  const { themeColors } = useTheme();
  const { currentFont } = useFont();

  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);

  // ── Fetch Data ──────────────────────────────────
  const fetchWallet = useCallback(async () => {
    try {
      const data = await walletApi.getFleetWallet();
      setWallet(data);
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || "Wallet load nahi hua");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWallet();
  }, [fetchWallet]);

  // ── Logic ───────────────────────────────────────
  const transactions = useMemo(() => wallet?.transactions || [], [wallet]);

  // Calculate stats
  const stats = useMemo(() => {
    const totalCredits = transactions
      .filter(t => t.type === 'Credit' && t.status === 'Completed')
      .reduce((sum, t) => sum + (t.amount || 0), 0);
    const totalDebits = transactions
      .filter(t => t.type === 'Debit' && t.status === 'Completed')
      .reduce((sum, t) => sum + (t.amount || 0), 0);
    const pendingAmount = transactions
      .filter(t => t.status === 'Pending')
      .reduce((sum, t) => sum + (t.amount || 0), 0);

    return {
      balance: wallet?.walletBalance || 0,
      totalEarnings: wallet?.totalEarnings || 0,
      totalCredits,
      totalDebits,
      pendingAmount,
      netFlow: totalCredits - totalDebits
    };
  }, [wallet, transactions]);

  // Filter transactions
  const filtered = useMemo(() => {
    let filtered = transactions;

    // Type filter
    if (filter === "credit") filtered = filtered.filter(t => t.type === "Credit");
    if (filter === "debit") filtered = filtered.filter(t => t.type === "Debit");

    // Search filter
    const q = search.toLowerCase();
    return filtered
      .filter(t =>
        (t.description || "").toLowerCase().includes(q) ||
        (t.category || "").toLowerCase().includes(q) ||
        (t._id || "").toLowerCase().includes(q)
      )
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [transactions, filter, search]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const displayed = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filtered.slice(start, start + itemsPerPage);
  }, [filtered, currentPage, itemsPerPage]);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Completed':
        return <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">Completed</span>;
      case 'Pending':
        return <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium">Pending</span>;
      case 'Failed':
        return <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">Failed</span>;
      default:
        return <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">{status}</span>;
    }
  };

  return (
    <div className="space-y-6 p-4 sm:p-6 bg-gray-50 min-h-screen" style={{ fontFamily: currentFont.family }}>

      {/* Header - Optimized for Mobile */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-5">
        <div className="flex items-start justify-between w-full sm:w-auto">
           <div className="flex items-center gap-3">
              <div className="p-2.5 bg-blue-600 rounded-2xl text-white shadow-lg shadow-blue-500/20">
                <FaWallet size={20} />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">Wallet</h1>
                <p className="text-[10px] sm:text-xs text-gray-500 font-medium mt-0.5 uppercase tracking-wider">Financial Overview</p>
              </div>
           </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
           {/* Withdraw Button */}
           <button
            onClick={() => setShowWithdrawModal(true)}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-2xl sm:rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20 active:scale-95 font-bold text-sm"
           >
            <Banknote size={16} />
            Withdraw
           </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatBox
          label="Wallet Balance"
          value={stats.balance.toLocaleString()}
          icon={FaCoins}
          color={CHART_COLORS.primary}
        />
        <StatBox
          label="Total Earnings"
          value={stats.totalEarnings.toLocaleString()}
          icon={FaHandHoldingUsd}
          color={CHART_COLORS.success}
        />
        <StatBox
          label="Credits"
          value={stats.totalCredits.toLocaleString()}
          icon={TrendingUp}
          color={CHART_COLORS.success}
        />
        <StatBox
          label="Debits"
          value={stats.totalDebits.toLocaleString()}
          icon={TrendingDown}
          color={CHART_COLORS.danger}
        />
      </div>

      {/* Quick Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <p className="text-xs text-gray-500 mb-1">Pending Amount</p>
          <p className="text-xl font-bold text-yellow-600">₹{stats.pendingAmount.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <p className="text-xs text-gray-500 mb-1">Net Flow</p>
          <p className={`text-xl font-bold ${stats.netFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {stats.netFlow >= 0 ? '+' : '-'} ₹{Math.abs(stats.netFlow).toLocaleString()}
          </p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <p className="text-xs text-gray-500 mb-1">Total Transactions</p>
          <p className="text-xl font-bold text-blue-600">{transactions.length}</p>
        </div>
      </div>

      {/* Transactions Section */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">

        {/* Filters */}
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Type Filter */}
            <div className="flex items-center gap-2 p-1 bg-white rounded-lg border border-gray-200">
              {[
                { key: "all", label: "All" },
                { key: "credit", label: "Credits" },
                { key: "debit", label: "Debits" }
              ].map(t => (
                <button
                  key={t.key}
                  onClick={() => { setFilter(t.key); setCurrentPage(1); }}
                  className={`px-4 py-1.5 rounded-md text-xs font-medium transition-all ${filter === t.key
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                    }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="relative flex-1">
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
              <input
                type="text"
                placeholder="Search by description, category, ID..."
                value={search}
                onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
                className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
              {search && (
                <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  <FaTimes size={12} />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase">
                <th className="px-6 py-3 text-left">Type</th>
                <th className="px-6 py-3 text-left">Description</th>
                <th className="px-6 py-3 text-left">Category</th>
                <th className="px-6 py-3 text-left">Status</th>
                <th className="px-6 py-3 text-left">Date & Time</th>
                <th className="px-6 py-3 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center">
                    <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto" />
                  </td>
                </tr>
              ) : displayed.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <FaHistory className="text-4xl text-gray-300" />
                      <p className="text-sm text-gray-500">No transactions found</p>
                    </div>
                  </td>
                </tr>
              ) : (
                displayed.map((t) => (
                  <tr key={t._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${t.type === 'Credit' ? 'bg-green-50' : 'bg-red-50'}`}>
                          {t.type === 'Credit' ? (
                            <TrendingUp className="text-green-600" size={14} />
                          ) : (
                            <TrendingDown className="text-red-600" size={14} />
                          )}
                        </div>
                        <span className={`text-sm font-medium ${t.type === 'Credit' ? 'text-green-600' : 'text-red-600'}`}>
                          {t.type}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-900">{t.description || '—'}</p>
                      <p className="text-xs text-gray-400 font-mono mt-1">ID: {t._id.slice(-8).toUpperCase()}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs font-medium">
                        {t.category || 'General'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(t.status)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-start gap-2">
                        <Calendar size={14} className="text-gray-400 mt-0.5" />
                        <div>
                          <p className="text-sm text-gray-700">{new Date(t.createdAt).toLocaleDateString('en-IN')}</p>
                          <p className="text-xs text-gray-400">{new Date(t.createdAt).toLocaleTimeString('en-IN')}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <p className={`text-lg font-bold ${t.type === 'Credit' ? 'text-green-600' : 'text-red-600'}`}>
                        {t.type === 'Credit' ? '+' : '-'} ₹{t.amount?.toLocaleString()}
                      </p>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!loading && filtered.length > 0 && (
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-500">
                Showing <strong>{(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, filtered.length)}</strong> of <strong>{filtered.length}</strong>
              </span>
              <select
                value={itemsPerPage}
                onChange={e => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                className="text-sm border border-gray-300 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <option value={10}>10 / page</option>
                <option value={20}>20 / page</option>
                <option value={50}>50 / page</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                className="p-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-50 transition-all"
              >
                <ChevronsLeft size={16} />
              </button>
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-50 transition-all"
              >
                <ChevronLeft size={16} />
              </button>

              <span className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium">
                Page {currentPage} of {totalPages}
              </span>

              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-50 transition-all"
              >
                <ChevronRight size={16} />
              </button>
              <button
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-50 transition-all"
              >
                <ChevronsRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Withdraw Modal */}
      <WithdrawModal
        isOpen={showWithdrawModal}
        onClose={() => setShowWithdrawModal(false)}
        balance={stats.balance}
        themeColors={themeColors}
      />
    </div>
  );
}
