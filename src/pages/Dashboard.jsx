// src/pages/FleetDashboard.jsx
import { useState, useEffect, useMemo } from "react";
import { useTheme } from "../context/ThemeContext";
import { useFont } from "../context/FontContext";
import { fleetApi } from "../api/fleetApi";
import { toast } from "sonner";
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import {
  FaTachometerAlt, FaCar, FaUsers, FaWallet, FaBuilding,
  FaCheckCircle, FaClock, FaExclamationTriangle, FaBan,
  FaArrowUp, FaArrowDown, FaSync, FaEye, FaCalendarAlt,
  FaHistory, FaMoneyBillWave, FaChartPie, FaChartBar,
  FaChartLine, FaUserTie, FaCreditCard, FaFileInvoice
} from "react-icons/fa";
import {
  TrendingUp, DollarSign, Activity, Clock, Calendar,
  Download, Filter, Printer, MoreVertical
} from 'lucide-react';

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
  pink: '#EC4899',
  indigo: '#6366F1',
  gray: '#94A3B8'
};

// ─────────────────────────────────────────────
// Chart Components
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
// Stat Card Component
// ─────────────────────────────────────────────
const StatCard = ({ label, value, icon: Icon, color, trend }) => (
  <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200 hover:shadow-md transition-all">
    <div className="flex items-start justify-between mb-3">
      <div className="p-3 rounded-lg" style={{ backgroundColor: color + '15' }}>
        <Icon className="text-lg" style={{ color }} />
      </div>
      {trend !== undefined && (
        <span className={`text-xs font-medium px-2 py-1 rounded-full ${trend > 0 ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
          }`}>
          {trend > 0 ? '+' : ''}{trend}%
        </span>
      )}
    </div>
    <p className="text-2xl font-bold text-gray-900 mb-1">{value}</p>
    <p className="text-xs font-medium text-gray-500">{label}</p>
  </div>
);

// ─────────────────────────────────────────────
// Profile Card Component
// ─────────────────────────────────────────────
const ProfileCard = ({ profile }) => {
  if (!profile) return null;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all">
      <div className="flex items-start gap-4 mb-4">
        <div className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-xl">
          {profile.name?.charAt(0) || 'F'}
        </div>
        <div className="flex-1">
          <h2 className="text-lg font-bold text-gray-900">{profile.name}</h2>
          <p className="text-sm text-gray-500">{profile.email}</p>
          <p className="text-sm text-gray-500 mt-1">{profile.phone}</p>
        </div>
        <div className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
          {profile.isActive ? 'Active' : 'Inactive'}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
        <div>
          <p className="text-xs text-gray-500 mb-1">Company</p>
          <p className="text-sm font-medium text-gray-900">{profile.companyName || '—'}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 mb-1">Location</p>
          <p className="text-sm font-medium text-gray-900">{profile.city || '—'}, {profile.state || '—'}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 mb-1">Wallet Balance</p>
          <p className={`text-sm font-medium ${profile.walletBalance < 0 ? 'text-red-600' : 'text-green-600'}`}>
            ₹{profile.walletBalance?.toLocaleString() || 0}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500 mb-1">Commission</p>
          <p className="text-sm font-medium text-orange-600">{profile.commissionPercentage || 0}%</p>
        </div>
      </div>

      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
        <p className="text-xs text-gray-500 mb-2">Bank Details</p>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <span className="text-gray-400">Bank:</span>
            <p className="font-medium text-gray-700">{profile.bankDetails?.bankName || '—'}</p>
          </div>
          <div>
            <span className="text-gray-400">Account:</span>
            <p className="font-medium text-gray-700">
              {profile.bankDetails?.accountNumber ? `****${profile.bankDetails.accountNumber.slice(-4)}` : '—'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// Assignment Row Component
// ─────────────────────────────────────────────
const AssignmentRow = ({ assignment }) => {
  const [expanded, setExpanded] = useState(false);

  const getStatusBadge = () => {
    if (assignment.isAssigned) {
      return { label: 'Assigned', color: '#10B981', bg: '#10B98115' };
    }
    return { label: 'Unassigned', color: '#EF4444', bg: '#EF444415' };
  };

  const badge = getStatusBadge();
  const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN') : '—';
  const fmtTime = (d) => d ? new Date(d).toLocaleTimeString('en-IN') : '—';

  return (
    <>
      <div className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-gray-100 hover:bg-gray-50 transition-colors items-center cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="col-span-3">
          <p className="font-medium text-sm text-gray-900">{assignment.driverName}</p>
          <p className="text-xs text-gray-500">{assignment.driverPhone}</p>
        </div>
        <div className="col-span-3">
          <p className="font-medium text-sm text-gray-900">{assignment.carModel}</p>
          <p className="text-xs text-gray-500">{assignment.carNumber}</p>
        </div>
        <div className="col-span-2">
          <p className="text-xs text-gray-600">{assignment.seatCapacity} seats</p>
        </div>
        <div className="col-span-2">
          <span className="px-2 py-1 rounded-full text-[10px] font-medium"
            style={{ backgroundColor: badge.bg, color: badge.color }}>
            {badge.label}
          </span>
        </div>
        <div className="col-span-2">
          <p className="text-xs text-gray-600">{fmtDate(assignment.assignedAt)}</p>
        </div>
      </div>

      {expanded && (
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
          <h4 className="text-xs font-semibold text-gray-700 mb-3">Assignment History</h4>
          <div className="space-y-2">
            {assignment.assignmentHistory?.map((history, idx) => (
              <div key={idx} className="flex items-center gap-3 text-xs bg-white p-2 rounded border border-gray-100">
                <span className={`px-2 py-0.5 rounded-full ${history.action === 'assigned' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}>
                  {history.action}
                </span>
                <span className="text-gray-600">{fmtDate(history.timestamp)} {fmtTime(history.timestamp)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
};

// ─────────────────────────────────────────────
// Transaction Row Component
// ─────────────────────────────────────────────
const TransactionRow = ({ transaction }) => {
  const getTypeColor = () => {
    if (transaction.type === 'Credit') return { color: '#10B981', bg: '#10B98115' };
    return { color: '#EF4444', bg: '#EF444415' };
  };

  const typeStyle = getTypeColor();

  return (
    <div className="grid grid-cols-12 gap-4 px-6 py-3 border-b border-gray-100 hover:bg-gray-50 transition-colors items-center">
      <div className="col-span-3">
        <p className="text-xs text-gray-500">{new Date(transaction.createdAt).toLocaleDateString('en-IN')}</p>
        <p className="text-xs text-gray-400">{new Date(transaction.createdAt).toLocaleTimeString('en-IN')}</p>
      </div>
      <div className="col-span-2">
        <span className="px-2 py-1 rounded-full text-[10px] font-medium"
          style={{ backgroundColor: typeStyle.bg, color: typeStyle.color }}>
          {transaction.type}
        </span>
      </div>
      <div className="col-span-3">
        <p className="text-xs font-medium text-gray-700">{transaction.category}</p>
      </div>
      <div className="col-span-2">
        <p className={`text-xs font-medium ${transaction.type === 'Credit' ? 'text-green-600' : 'text-red-600'}`}>
          {transaction.type === 'Credit' ? '+' : '-'} ₹{transaction.amount?.toLocaleString()}
        </p>
      </div>
      <div className="col-span-2">
        <span className={`px-2 py-1 rounded-full text-[10px] font-medium ${transaction.status === 'Completed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
          }`}>
          {transaction.status}
        </span>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// Main FleetDashboard Component
// ─────────────────────────────────────────────
export default function FleetDashboard() {
  const { themeColors } = useTheme();
  const { currentFont } = useFont();

  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [timeRange, setTimeRange] = useState('week');

  const fetchDashboard = async () => {
    try {
      setRefreshing(true);
      const data = await fleetApi.getDashboard();
      
      // Handle { success: true, dashboard: { ... } } or just { ... }
      const dash = data.dashboard || data || {};
      setDashboardData(dash);
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || "Dashboard load nahi ho saka");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const profile = dashboardData?.profile || {};
  const stats = dashboardData?.stats || {};
  const assignments = dashboardData?.recentActivity?.assignments || dashboardData?.assignments || [];
  const transactions = dashboardData?.recentActivity?.transactions || dashboardData?.transactions || [];

  // Chart Data
  const carStatusData = [
    { name: 'Available', value: stats.cars?.available || 0, color: CHART_COLORS.success },
    { name: 'Busy', value: stats.cars?.busy || 0, color: CHART_COLORS.warning }
  ].filter(item => item.value > 0);

  const driverStatusData = [
    { name: 'Active', value: stats.drivers?.active || 0, color: CHART_COLORS.success },
    { name: 'Pending', value: stats.drivers?.pending || 0, color: CHART_COLORS.warning }
  ].filter(item => item.value > 0);

  // Transaction summary
  const transactionSummary = useMemo(() => {
    const totalCredits = transactions
      .filter(t => t.type === 'Credit')
      .reduce((sum, t) => sum + (t.amount || 0), 0);
    const totalDebits = transactions
      .filter(t => t.type === 'Debit')
      .reduce((sum, t) => sum + (t.amount || 0), 0);
    return { totalCredits, totalDebits, net: totalCredits - totalDebits };
  }, [transactions]);

  // === HIGHCHARTS CONFIG ===
  const pieOptions = (data, title) => ({
    chart: { type: 'pie', height: 180, style: { fontFamily: currentFont.family } },
    title: { text: null },
    tooltip: { pointFormat: '{point.name}: <b>{point.y}</b> ({point.percentage:.1f}%)' },
    plotOptions: {
      pie: {
        innerRadius: '60%',
        dataLabels: { enabled: false },
        showInLegend: true
      }
    },
    series: [{
      name: title,
      colorByPoint: true,
      data: data.map(d => ({ name: d.name, y: d.value, color: d.color }))
    }],
    legend: { enabled: true, layout: 'vertical', align: 'right', verticalAlign: 'middle' },
    credits: { enabled: false },
    exporting: { enabled: false }
  });

  const barOptions = {
    chart: { type: 'column', height: 200, style: { fontFamily: currentFont.family } },
    title: { text: null },
    xAxis: { categories: ['Cars', 'Drivers'] },
    yAxis: { title: { text: null }, allowDecimals: false },
    legend: { enabled: false },
    tooltip: { pointFormat: 'Total: <b>{point.y}</b>' },
    plotOptions: { column: { borderRadius: 4 } },
    series: [
      { name: 'Total', data: [stats.cars?.total || 0, stats.drivers?.total || 0], color: CHART_COLORS.primary },
      { name: 'Available/Active', data: [stats.cars?.available || 0, stats.drivers?.active || 0], color: CHART_COLORS.success }
    ],
    credits: { enabled: false },
    exporting: { enabled: false }
  };

  const transactionOptions = {
    chart: { type: 'areaspline', height: 200, style: { fontFamily: currentFont.family } },
    title: { text: null },
    xAxis: { categories: ['Credits', 'Debits', 'Net'] },
    yAxis: { title: { text: null } },
    legend: { enabled: false },
    tooltip: { pointFormat: 'Amount: <b>₹{point.y}</b>' },
    plotOptions: {
      areaspline: {
        fillColor: {
          linearGradient: { x1: 0, y1: 0, x2: 0, y2: 1 },
          stops: [
            [0, 'rgba(59, 130, 246, 0.4)'],
            [1, 'rgba(59, 130, 246, 0.0)']
          ]
        },
        marker: { radius: 4 },
        lineWidth: 2,
        color: CHART_COLORS.primary
      }
    },
    series: [{
      name: 'Amount',
      data: [transactionSummary.totalCredits, transactionSummary.totalDebits, transactionSummary.net]
    }],
    credits: { enabled: false },
    exporting: { enabled: false }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 bg-gray-50 min-h-screen" style={{ fontFamily: currentFont.family }}>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2 text-gray-900">
            <FaTachometerAlt className="text-blue-600" />
            Fleet Dashboard
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Welcome back, {profile?.name || 'Fleet Owner'}! Here's your fleet overview.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="year">This Year</option>
          </select>
          <button
            onClick={fetchDashboard}
            className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-all"
            disabled={refreshing}
          >
            <FaSync className={refreshing ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* Profile & Stats Row */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Profile Card - Takes 1 column */}
        <div className="lg:col-span-1">
          <ProfileCard profile={profile} />
        </div>

        {/* Stats Cards - Takes 3 columns */}
        <div className="lg:col-span-3 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard
            label="Total Cars"
            value={stats.cars?.total || 0}
            icon={FaCar}
            color={CHART_COLORS.primary}
          />
          <StatCard
            label="Available Cars"
            value={stats.cars?.available || 0}
            icon={FaCheckCircle}
            color={CHART_COLORS.success}
            trend={stats.cars?.total ? Math.round((stats.cars.available / stats.cars.total) * 100) : 0}
          />
          <StatCard
            label="Total Drivers"
            value={stats.drivers?.total || 0}
            icon={FaUsers}
            color={CHART_COLORS.purple}
          />
          <StatCard
            label="Active Drivers"
            value={stats.drivers?.active || 0}
            icon={FaUserTie}
            color={CHART_COLORS.success}
          />
          <StatCard
            label="Pending Drivers"
            value={stats.drivers?.pending || 0}
            icon={FaClock}
            color={CHART_COLORS.warning}
          />
          <StatCard
            label="Wallet Balance"
            value={`₹${profile?.walletBalance?.toLocaleString() || 0}`}
            icon={FaWallet}
            color={profile?.walletBalance < 0 ? CHART_COLORS.danger : CHART_COLORS.success}
          />
          <StatCard
            label="Commission"
            value={`${profile?.commissionPercentage || 0}%`}
            icon={FaMoneyBillWave}
            color={CHART_COLORS.orange}
          />
          <StatCard
            label="Total Earnings"
            value={`₹${profile?.totalEarnings?.toLocaleString() || 0}`}
            icon={DollarSign}
            color={CHART_COLORS.success}
          />
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart 1: Car Status */}
        <ChartCard title="Car Status" icon={FaChartPie}>
          {carStatusData.length > 0 ? (
            <HighchartsReact highcharts={Highcharts} options={pieOptions(carStatusData, 'Cars')} />
          ) : (
            <div className="h-[180px] flex items-center justify-center text-gray-400 text-sm">
              No car data available
            </div>
          )}
        </ChartCard>

        {/* Chart 2: Driver Status */}
        <ChartCard title="Driver Status" icon={FaChartPie}>
          {driverStatusData.length > 0 ? (
            <HighchartsReact highcharts={Highcharts} options={pieOptions(driverStatusData, 'Drivers')} />
          ) : (
            <div className="h-[180px] flex items-center justify-center text-gray-400 text-sm">
              No driver data available
            </div>
          )}
        </ChartCard>

        {/* Chart 3: Overview */}
        <ChartCard title="Fleet Overview" icon={FaChartBar}>
          <HighchartsReact highcharts={Highcharts} options={barOptions} />
        </ChartCard>
      </div>

      {/* Second Row: Transactions Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Transaction Summary" icon={FaChartLine}>
          <HighchartsReact highcharts={Highcharts} options={transactionOptions} />
        </ChartCard>

        {/* Quick Stats */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Quick Stats</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-xs text-gray-500 mb-1">Total Credits</p>
              <p className="text-lg font-bold text-green-600">₹{transactionSummary.totalCredits.toLocaleString()}</p>
            </div>
            <div className="p-4 bg-red-50 rounded-lg">
              <p className="text-xs text-gray-500 mb-1">Total Debits</p>
              <p className="text-lg font-bold text-red-600">₹{transactionSummary.totalDebits.toLocaleString()}</p>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg">
              <p className="text-xs text-gray-500 mb-1">Net Flow</p>
              <p className={`text-lg font-bold ${transactionSummary.net >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                ₹{transactionSummary.net.toLocaleString()}
              </p>
            </div>
            <div className="p-4 bg-orange-50 rounded-lg">
              <p className="text-xs text-gray-500 mb-1">Total Transactions</p>
              <p className="text-lg font-bold text-orange-600">{transactions.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Assignments */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FaHistory className="text-blue-600" />
            <h3 className="text-sm font-semibold text-gray-900">Recent Assignments</h3>
          </div>
          <span className="text-xs text-gray-500">Last 5 assignments</span>
        </div>

        {/* Responsive Container */}
        <div className="overflow-x-auto">
          <div className="min-w-[800px]">
            {/* Table Header */}
            <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase">
              <div className="col-span-3">Driver</div>
              <div className="col-span-3">Vehicle</div>
              <div className="col-span-2">Seats</div>
              <div className="col-span-2">Status</div>
              <div className="col-span-2">Assigned Date</div>
            </div>

            {/* Assignments */}
            {assignments.length > 0 ? (
              assignments.slice(0, 5).map(assignment => (
                <AssignmentRow key={assignment._id} assignment={assignment} />
              ))
            ) : (
              <div className="py-8 text-center text-gray-400 text-sm">
                No recent assignments
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FaFileInvoice className="text-blue-600" />
            <h3 className="text-sm font-semibold text-gray-900">Recent Transactions</h3>
          </div>
          <span className="text-xs text-gray-500">Last 5 transactions</span>
        </div>

        {/* Responsive Container */}
        <div className="overflow-x-auto">
          <div className="min-w-[800px]">
            {/* Table Header */}
            <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase">
              <div className="col-span-3">Date</div>
              <div className="col-span-2">Type</div>
              <div className="col-span-3">Category</div>
              <div className="col-span-2">Amount</div>
              <div className="col-span-2">Status</div>
            </div>

            {/* Transactions */}
            {transactions.length > 0 ? (
              transactions.slice(0, 5).map(transaction => (
                <TransactionRow key={transaction._id} transaction={transaction} />
              ))
            ) : (
              <div className="py-8 text-center text-gray-400 text-sm">
                No recent transactions
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}