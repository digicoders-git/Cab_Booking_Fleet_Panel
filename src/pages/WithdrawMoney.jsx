// src/pages/WithdrawMoney.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import { useFont } from "../context/FontContext";
import { walletApi } from "../api/walletApi";
import { toast } from "sonner";
import Swal from "sweetalert2";
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import {
  FaArrowLeft, FaWallet, FaPaperPlane, FaInfoCircle,
  FaExclamationTriangle, FaCheckCircle, FaHistory,
  FaChartLine, FaChartPie, FaChartBar, FaClock,
  FaArrowUp, FaArrowDown, FaShieldAlt, FaUniversity,
  FaDownload, FaPrint, FaEye, FaFilter
} from "react-icons/fa";
import {
  Banknote, MessageSquare, History, TrendingUp, DollarSign,
  Calendar, Clock, CheckCircle, XCircle, AlertCircle,
  ArrowUp, ArrowDown, ChevronDown, ChevronUp, MoreVertical
} from "lucide-react";

// Highcharts Modules
import Accessibility from 'highcharts/modules/accessibility';
import Exporting from 'highcharts/modules/exporting';
import ExportData from 'highcharts/modules/export-data';

// Initialize Highcharts modules
if (typeof Highcharts === 'object') {
  [Accessibility, Exporting, ExportData].forEach(module => {
    if (typeof module === 'function') {
      module(Highcharts);
    } else if (module && typeof module.default === 'function') {
      module.default(Highcharts);
    }
  });
}

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
const ChartCard = ({ title, icon: Icon, children, className = "" }) => (
  <div className={`bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-lg transition-all ${className}`}>
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
// Stat Card Component
// ─────────────────────────────────────────────
const StatCard = ({ label, value, icon: Icon, color }) => (
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
// Transaction Row Component
// ─────────────────────────────────────────────
const TransactionRow = ({ transaction }) => {
  const getStatusBadge = (status) => {
    switch (status) {
      case 'Completed':
        return <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">Completed</span>;
      case 'Pending':
        return <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium">Pending</span>;
      case 'Rejected':
        return <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">Rejected</span>;
      default:
        return <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">{status}</span>;
    }
  };

  return (
    <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0 hover:bg-gray-50 px-2 rounded-lg transition-colors">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${transaction.type === 'Credit' ? 'bg-green-50' : 'bg-red-50'}`}>
          {transaction.type === 'Credit' ? (
            <ArrowUp className="text-green-600" size={14} />
          ) : (
            <ArrowDown className="text-red-600" size={14} />
          )}
        </div>
        <div>
          <p className="text-sm font-medium text-gray-900">₹{transaction.amount?.toLocaleString()}</p>
          <p className="text-xs text-gray-500">{new Date(transaction.createdAt).toLocaleDateString()}</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        {getStatusBadge(transaction.status)}
        <span className="text-xs text-gray-400">{transaction.category || 'Withdrawal'}</span>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// Main WithdrawMoney Component
// ─────────────────────────────────────────────
export default function WithdrawMoney() {
  const { currentFont } = useFont();
  const navigate = useNavigate();

  const [balance, setBalance] = useState(0);
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [withdrawalHistory, setWithdrawalHistory] = useState([]);
  const [selectedPeriod, setSelectedPeriod] = useState('month');

  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      try {
        const walletData = await walletApi.getFleetWallet();

        if (isMounted) {
          const dash = walletData?.wallet || walletData || {};
          setBalance(dash.walletBalance || dash.balance || 0);

          // Get transactions from walletData
          const allTransactions = dash.transactions || dash.recentActivity?.transactions || [];

          // Filter recent withdrawals
          const withdrawals = allTransactions
            .filter(t => t.type === 'Debit' && t.category === 'Withdrawal')
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, 10);
          setWithdrawalHistory(withdrawals);

          // All recent transactions for chart
          setRecentTransactions(allTransactions.slice(0, 20));
          setFetching(false);
        }
      } catch (err) {
        if (isMounted) {
          toast.error("Data fetch karne mein dikkat hui");
          setFetching(false);
        }
      }
    };
    loadData();
    return () => { isMounted = false; };
  }, []);

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
        navigate("/wallet");
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

  // Calculate stats
  const stats = {
    totalWithdrawn: withdrawalHistory.filter(w => w.status === 'Completed').reduce((sum, w) => sum + (w.amount || 0), 0),
    pendingAmount: withdrawalHistory.filter(w => w.status === 'Pending').reduce((sum, w) => sum + (w.amount || 0), 0),
    rejectedAmount: withdrawalHistory.filter(w => w.status === 'Rejected').reduce((sum, w) => sum + (w.amount || 0), 0),
    totalRequests: withdrawalHistory.length,
    successRate: withdrawalHistory.length > 0
      ? Math.round((withdrawalHistory.filter(w => w.status === 'Completed').length / withdrawalHistory.length) * 100)
      : 0
  };

  // Chart 1: Balance Distribution - Pie Chart
  const balanceData = [
    { name: 'Available Balance', value: balance, color: CHART_COLORS.success },
    { name: 'Pending Withdrawals', value: stats.pendingAmount, color: CHART_COLORS.warning },
    { name: 'Processed', value: stats.totalWithdrawn, color: CHART_COLORS.primary }
  ].filter(item => item.value > 0);

  const pieOptions = {
    chart: { type: 'pie', height: 220, style: { fontFamily: currentFont.family } },
    title: { text: null },
    tooltip: { pointFormat: '{point.name}: <b>₹{point.y:,.0f}</b> ({point.percentage:.1f}%)' },
    plotOptions: {
      pie: {
        innerRadius: '60%',
        dataLabels: { enabled: false },
        showInLegend: true
      }
    },
    series: [{
      name: 'Balance',
      colorByPoint: true,
      data: balanceData.map(d => ({ name: d.name, y: d.value, color: d.color }))
    }],
    legend: { enabled: true, layout: 'vertical', align: 'right', verticalAlign: 'middle', itemStyle: { fontSize: '11px' } },
    credits: { enabled: false },
    exporting: { enabled: false }
  };

  // Chart 2: Withdrawal History - Bar Chart
  const monthlyWithdrawals = withdrawalHistory.reduce((acc, w) => {
    const month = new Date(w.createdAt).toLocaleString('default', { month: 'short', year: 'numeric' });
    acc[month] = (acc[month] || 0) + (w.amount || 0);
    return acc;
  }, {});

  const barData = Object.entries(monthlyWithdrawals)
    .map(([month, amount]) => ({ month, amount }))
    .sort((a, b) => new Date(a.month) - new Date(b.month))
    .slice(-6);

  const barOptions = {
    chart: { type: 'column', height: 220, style: { fontFamily: currentFont.family } },
    title: { text: null },
    xAxis: { categories: barData.map(d => d.month), labels: { style: { fontSize: '10px' } } },
    yAxis: { title: { text: 'Amount (₹)' }, labels: { style: { fontSize: '10px' } } },
    legend: { enabled: false },
    tooltip: { pointFormat: 'Withdrawn: <b>₹{point.y:,.0f}</b>' },
    plotOptions: { column: { borderRadius: 4, color: CHART_COLORS.primary } },
    series: [{ name: 'Withdrawals', data: barData.map(d => d.amount) }],
    credits: { enabled: false },
    exporting: { enabled: false }
  };

  // Chart 3: Recent Transactions Trend - Line Chart
  const recentTrendData = recentTransactions.slice(0, 7).map((t, i) => ({
    day: new Date(t.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
    amount: t.amount || 0
  })).reverse();

  const lineOptions = {
    chart: { type: 'spline', height: 220, style: { fontFamily: currentFont.family } },
    title: { text: null },
    xAxis: { categories: recentTrendData.map(d => d.day), labels: { style: { fontSize: '10px' } } },
    yAxis: { title: { text: 'Amount (₹)' }, labels: { style: { fontSize: '10px' } } },
    legend: { enabled: false },
    tooltip: { pointFormat: 'Amount: <b>₹{point.y:,.0f}</b>' },
    plotOptions: {
      spline: {
        marker: { radius: 4 },
        color: CHART_COLORS.success,
        lineWidth: 3
      }
    },
    series: [{ name: 'Transactions', data: recentTrendData.map(d => d.amount) }],
    credits: { enabled: false },
    exporting: { enabled: false }
  };

  // Chart 4: Status Distribution - Pie Chart
  const statusData = [
    { name: 'Completed', value: withdrawalHistory.filter(w => w.status === 'Completed').length, color: CHART_COLORS.success },
    { name: 'Pending', value: withdrawalHistory.filter(w => w.status === 'Pending').length, color: CHART_COLORS.warning },
    { name: 'Rejected', value: withdrawalHistory.filter(w => w.status === 'Rejected').length, color: CHART_COLORS.danger }
  ].filter(item => item.value > 0);

  const statusPieOptions = {
    chart: { type: 'pie', height: 150, style: { fontFamily: currentFont.family } },
    title: { text: null },
    tooltip: { pointFormat: '{point.name}: <b>{point.y}</b> ({point.percentage:.1f}%)' },
    plotOptions: {
      pie: {
        innerRadius: '50%',
        dataLabels: { enabled: false },
        showInLegend: false
      }
    },
    series: [{
      name: 'Status',
      colorByPoint: true,
      data: statusData.map(d => ({ name: d.name, y: d.value, color: d.color }))
    }],
    credits: { enabled: false },
    exporting: { enabled: false }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-8" style={{ fontFamily: currentFont.family }}>

      {/* Header */}
      <div className="max-w-8xl mx-auto mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Withdraw Money</h1>
              <p className="text-sm text-gray-500 mt-1">Withdraw funds to your bank account</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-white"
            >
              <option value="week">Last 7 Days</option>
              <option value="month">Last 30 Days</option>
              <option value="quarter">Last 90 Days</option>
              <option value="year">This Year</option>
            </select>
            <div className="px-3 py-1.5 bg-green-50 rounded-full flex items-center gap-2">
              <FaCheckCircle className="text-green-600" size={12} />
              <span className="text-xs font-medium text-green-700">Verified Account</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-8xl mx-auto">
        {/* Stats Cards Row - Responsive Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8">
          <StatCard
            label="Balance"
            value={balance.toLocaleString()}
            icon={FaWallet}
            color={CHART_COLORS.primary}
          />
          <StatCard
            label="Withdrawn"
            value={stats.totalWithdrawn.toLocaleString()}
            icon={Banknote}
            color={CHART_COLORS.success}
          />
          <StatCard
            label="Pending"
            value={stats.pendingAmount.toLocaleString()}
            icon={FaClock}
            color={CHART_COLORS.warning}
          />
          <StatCard
            label="History"
            value={stats.totalRequests.toString()}
            icon={FaHistory}
            color={CHART_COLORS.purple}
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* Left Column - Main Form */}
          <div className="lg:col-span-7 space-y-6">

            {/* Main Form Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Withdrawal Request</h2>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Balance Display */}
                <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl p-5 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-100 text-xs mb-1">Available Balance</p>
                      <p className="text-3xl font-bold">₹{fetching ? "..." : balance.toLocaleString()}</p>
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
                      disabled={fetching}
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

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading || fetching}
                  className="w-full py-4 bg-gray-900 text-white rounded-xl font-semibold hover:bg-gray-800 transition-all disabled:opacity-50 flex items-center justify-center gap-3 shadow-lg"
                >
                  {loading ? (
                    <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
                  ) : (
                    <>
                      <FaPaperPlane size={16} />
                      Submit Withdrawal Request
                    </>
                  )}
                </button>

                {/* Warning Note */}
                <div className="flex items-start gap-3 p-4 bg-yellow-50 rounded-xl border border-yellow-200">
                  <FaExclamationTriangle className="text-yellow-600 mt-0.5 shrink-0" size={16} />
                  <p className="text-xs text-yellow-700 leading-relaxed">
                    Make sure your bank details are correct in your profile. Incorrect details may cause delays.
                  </p>
                </div>
              </form>
            </div>

            {/* Chart 3: Transaction Trend */}
            <ChartCard title="Transaction Trend" icon={TrendingUp}>
              {recentTrendData.length > 0 ? (
                <HighchartsReact highcharts={Highcharts} options={lineOptions} />
              ) : (
                <div className="h-[220px] flex items-center justify-center text-gray-400 text-sm">
                  No transaction data available
                </div>
              )}
            </ChartCard>
          </div>

          {/* Right Column - Charts & History */}
          <div className="lg:col-span-5 space-y-6">

            {/* Chart 1: Balance Distribution */}
            <ChartCard title="Balance Distribution" icon={FaChartPie}>
              {balanceData.length > 0 ? (
                <HighchartsReact highcharts={Highcharts} options={pieOptions} />
              ) : (
                <div className="h-[220px] flex items-center justify-center text-gray-400 text-sm">
                  No balance data available
                </div>
              )}
            </ChartCard>

            {/* Chart 2: Withdrawal History */}
            <ChartCard title="Withdrawal History" icon={FaChartBar}>
              {barData.length > 0 ? (
                <HighchartsReact highcharts={Highcharts} options={barOptions} />
              ) : (
                <div className="h-[220px] flex items-center justify-center text-gray-400 text-sm">
                  No withdrawal history
                </div>
              )}
            </ChartCard>

            {/* Chart 4: Request Status */}
            <ChartCard title="Request Status" icon={FaClock}>
              {statusData.length > 0 ? (
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-1">
                    <HighchartsReact highcharts={Highcharts} options={statusPieOptions} />
                  </div>
                  <div className="col-span-1 space-y-3">
                    {statusData.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                          <span className="text-xs text-gray-600">{item.name}</span>
                        </div>
                        <span className="text-xs font-medium text-gray-900">{item.value}</span>
                      </div>
                    ))}
                    <div className="pt-3 border-t border-gray-100">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">Total Requests</span>
                        <span className="text-sm font-bold text-gray-900">{stats.totalRequests}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-[150px] flex items-center justify-center text-gray-400 text-sm">
                  No withdrawal requests
                </div>
              )}
            </ChartCard>

            {/* Recent Withdrawals List */}
            {withdrawalHistory.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <FaHistory className="text-gray-600" size={16} />
                    <h3 className="text-sm font-semibold text-gray-900">Recent Withdrawals</h3>
                  </div>
                  <span className="text-xs text-gray-400">Last 10</span>
                </div>
                <div className="space-y-1 max-h-[300px] overflow-y-auto pr-2">
                  {withdrawalHistory.map((w, idx) => (
                    <TransactionRow key={idx} transaction={w} />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}