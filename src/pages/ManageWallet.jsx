// src/pages/ManageWallet.jsx
import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import { useFont } from "../context/FontContext";
import { walletApi } from "../api/walletApi";
import { toast } from "sonner";
import {
  FaWallet, FaHistory, FaArrowUp, FaArrowDown,
  FaSync, FaSearch, FaTimes, FaCoins, FaHandHoldingUsd,
  FaCheckCircle, FaClock, FaExclamationCircle,
  FaFilter, FaDownload, FaPrint, FaEye
} from "react-icons/fa";
import {
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
  TrendingUp, TrendingDown, DollarSign, Calendar, Info, Banknote,
  CreditCard, Clock, CheckCircle, XCircle, AlertCircle
} from "lucide-react";
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend,
  LineChart, Line
} from 'recharts';

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
// Chart Card Component
// ─────────────────────────────────────────────
const ChartCard = ({ title, icon: Icon, children }) => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 hover:shadow-lg transition-all">
    <div className="flex items-center gap-2 mb-4">
      <div className="p-2 bg-blue-50 rounded-lg">
        <Icon className="text-blue-600" size={16} />
      </div>
      <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
    </div>
    {children}
  </div>
);

// ─────────────────────────────────────────────
// StatBox Component
// ─────────────────────────────────────────────
const StatBox = ({ label, value, icon: Icon, color }) => (
  <div className="bg-white rounded-xl p-3 sm:p-4 shadow-sm border border-gray-100/60 hover:shadow-lg transition-all">
    <div className="flex items-center gap-2 sm:gap-3">
      <div className="p-2 sm:p-3 rounded-lg shrink-0" style={{ backgroundColor: color + '15' }}>
        <Icon className="text-base sm:text-lg" style={{ color }} />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-tight truncate leading-tight mb-0.5">{label}</p>
        <div className="flex items-baseline gap-0.5">
          <span className="text-[10px] sm:text-xs font-bold text-gray-400">₹</span>
          <p className="text-base sm:text-xl font-black text-gray-900 leading-none">{value}</p>
        </div>
      </div>
    </div>
  </div>
);

// ─────────────────────────────────────────────
// Main ManageWallet Component
// ─────────────────────────────────────────────
export default function ManageWallet() {
  const { themeColors } = useTheme();
  const { currentFont } = useFont();
  const navigate = useNavigate();

  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [dateRange, setDateRange] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // ── Fetch Data ──────────────────────────────────
  const fetchWallet = useCallback(async () => {
    setRefreshing(true);
    try {
      const data = await walletApi.getFleetWallet();
      setWallet(data);
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || "Wallet load nahi hua");
    } finally {
      setLoading(false);
      setRefreshing(false);
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

  // Chart 1: Transaction Types - Pie Chart
  const typeData = [
    { name: 'Credits', value: stats.totalCredits, color: CHART_COLORS.success },
    { name: 'Debits', value: stats.totalDebits, color: CHART_COLORS.danger }
  ].filter(item => item.value > 0);

  // Chart 2: Status Distribution - Pie Chart
  const statusData = [
    { name: 'Completed', value: transactions.filter(t => t.status === 'Completed').length, color: CHART_COLORS.success },
    { name: 'Pending', value: transactions.filter(t => t.status === 'Pending').length, color: CHART_COLORS.warning }
  ].filter(item => item.value > 0);

  // Chart 3: Monthly Trend - Line Chart
  const monthlyData = transactions.reduce((acc, t) => {
    const month = new Date(t.createdAt).toLocaleString('default', { month: 'short' });
    const existing = acc.find(item => item.month === month);
    if (existing) {
      existing.amount += t.amount || 0;
    } else {
      acc.push({ month, amount: t.amount || 0 });
    }
    return acc;
  }, []).slice(0, 6);

  // Filter transactions
  const filtered = useMemo(() => {
    let filtered = transactions;

    // Type filter
    if (filter === "credit") filtered = filtered.filter(t => t.type === "Credit");
    if (filter === "debit") filtered = filtered.filter(t => t.type === "Debit");

    // Date range filter
    if (dateRange !== "all") {
      const now = new Date();
      const days = dateRange === "week" ? 7 : dateRange === "month" ? 30 : 90;
      const cutoff = new Date(now.setDate(now.getDate() - days));
      filtered = filtered.filter(t => new Date(t.createdAt) >= cutoff);
    }

    // Search filter
    const q = search.toLowerCase();
    return filtered
      .filter(t =>
        (t.description || "").toLowerCase().includes(q) ||
        (t.category || "").toLowerCase().includes(q) ||
        (t._id || "").toLowerCase().includes(q)
      )
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [transactions, filter, dateRange, search]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const displayed = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filtered.slice(start, start + itemsPerPage);
  }, [filtered, currentPage, itemsPerPage]);

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Completed': return <CheckCircle className="text-green-500" size={14} />;
      case 'Pending': return <Clock className="text-yellow-500" size={14} />;
      case 'Failed': return <XCircle className="text-red-500" size={14} />;
      default: return <AlertCircle className="text-gray-400" size={14} />;
    }
  };

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
           
           {/* Refresh Button - TOP RIGHT ON MOBILE */}
           <button
              onClick={fetchWallet}
              className="sm:hidden p-3 rounded-2xl border border-gray-100 bg-white shadow-sm hover:shadow-md transition-all active:scale-90 text-blue-600"
              title="Refresh"
           >
              <FaSync className={refreshing ? "animate-spin" : ""} size={16} />
           </button>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
           {/* Date Range - Hidden on tiny screens or better styled */}
           <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="hidden sm:block px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-600 focus:ring-2 focus:ring-blue-500/20 outline-none cursor-pointer"
           >
            <option value="all">All Time</option>
            <option value="week">7 Days</option>
            <option value="month">30 Days</option>
           </select>

           {/* Refresh Button - DESKTOP ONLY */}
           <button
            onClick={fetchWallet}
            className="hidden sm:flex p-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 transition-all text-gray-600"
            title="Refresh"
           >
            <FaSync className={refreshing ? "animate-spin" : ""} />
           </button>

           {/* Withdraw Button */}
           <button
            onClick={() => navigate("/withdraw")}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-2xl sm:rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20 active:scale-95 font-bold text-sm"
           >
            <Banknote size={16} />
            Withdraw
           </button>
        </div>
      </div>

      {/* Stats Cards */}
      {/* Stats Cards - Responsive 2-Column Grid on Mobile */}
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

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart 1: Transaction Types */}
        <ChartCard title="Transaction Types" icon={FaWallet}>
          {typeData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={typeData}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={65}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {typeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                  ))}
                </Pie>
                <Tooltip />
                <Legend iconType="circle" verticalAlign="bottom" align="center" wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-gray-400 text-sm">
              No transaction data
            </div>
          )}
        </ChartCard>

        {/* Chart 2: Status Distribution */}
        <ChartCard title="Transaction Status" icon={FaHistory}>
          {statusData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={65}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                  ))}
                </Pie>
                <Tooltip />
                <Legend iconType="circle" verticalAlign="bottom" align="center" wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-gray-400 text-sm">
              No status data
            </div>
          )}
        </ChartCard>

        {/* Chart 3: Monthly Trend */}
        <ChartCard title="Monthly Trend" icon={DollarSign}>
          {monthlyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="amount" stroke={CHART_COLORS.primary} strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-gray-400 text-sm">
              No monthly data
            </div>
          )}
        </ChartCard>
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
    </div>
  );
}