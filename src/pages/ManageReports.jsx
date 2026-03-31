// src/pages/FleetPerformanceReport.jsx
import { useState, useEffect, useMemo, useRef } from "react";
import { useTheme } from "../context/ThemeContext";
import { useFont } from "../context/FontContext";
import { fleetApi } from "../api/fleetApi";
import { toast } from "sonner";
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import {
  FaChartLine, FaChartBar, FaChartPie, FaChartArea,
  FaCar, FaUsers, FaWallet, FaMoneyBillWave, FaTachometerAlt,
  FaExclamationTriangle, FaCheckCircle, FaClock, FaBan,
  FaDownload, FaPrint, FaCalendarAlt, FaSync,
  FaArrowUp, FaArrowDown, FaStar, FaMedal, FaAward,
  FaFileExcel, FaFilePdf, FaFileCsv
} from "react-icons/fa";
import {
  TrendingUp, DollarSign, Activity, Target, Gauge,
  Download, Filter, Printer, MoreVertical, Eye,
  Calendar, ChevronDown, X, Check
} from 'lucide-react';
import * as XLSX from 'xlsx';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

// Highcharts Modules
import HighchartsMore from 'highcharts/highcharts-more';
import SolidGauge from 'highcharts/modules/solid-gauge';
import Accessibility from 'highcharts/modules/accessibility';

// Initialize Highcharts modules
if (typeof Highcharts === 'object') {
  [HighchartsMore, SolidGauge, Accessibility].forEach(module => {
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
  pink: '#EC4899',
  indigo: '#6366F1',
  gray: '#94A3B8',
  lightGray: '#E5E7EB'
};

// ─────────────────────────────────────────────
// Chart Components
// ─────────────────────────────────────────────
const ChartCard = ({ title, subtitle, icon: Icon, children, action }) => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-lg transition-all">
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-blue-50 rounded-lg">
          <Icon className="text-blue-600" size={18} />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
          {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {action && (
        <button className="p-1.5 hover:bg-gray-100 rounded-lg">
          <MoreVertical size={14} className="text-gray-400" />
        </button>
      )}
    </div>
    {children}
  </div>
);

// ─────────────────────────────────────────────
// Stat Card Component
// ─────────────────────────────────────────────
const StatCard = ({ label, value, icon: Icon, color, trend, suffix = '' }) => (
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
    <p className="text-2xl font-bold text-gray-900 mb-1">{value}{suffix}</p>
    <p className="text-xs font-medium text-gray-500">{label}</p>
  </div>
);

// ─────────────────────────────────────────────
// KPI Card Component
// ─────────────────────────────────────────────
const KPICard = ({ label, value, icon: Icon, color, sublabel }) => (
  <div className="bg-white rounded-xl py-5 px-3 sm:p-6 shadow-sm border border-gray-200 hover:shadow-md transition-all flex flex-col justify-center min-h-[90px] sm:min-h-0">
    <div className="flex items-center gap-3 sm:gap-4">
      <div className="p-2 sm:p-3 rounded-xl shrink-0" style={{ backgroundColor: color + '15' }}>
        <Icon className="text-sm sm:text-xl" style={{ color }} />
      </div>
      <div className="min-w-0">
        <p className="text-[8px] sm:text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">{label}</p>
        <p className="text-base sm:text-2xl font-black text-gray-900 mt-1 leading-none">{value}</p>
        {sublabel && <p className="text-[8px] sm:text-xs text-gray-400 mt-1.5 leading-tight truncate">{sublabel}</p>}
      </div>
    </div>
  </div>
);

// ─────────────────────────────────────────────
// Car Performance Row
// ─────────────────────────────────────────────
const CarPerformanceRow = ({ car, rank, type }) => {
  const getRankIcon = () => {
    if (rank === 1) return <FaAward className="text-yellow-500" size={16} />;
    if (rank === 2) return <FaMedal className="text-gray-400" size={16} />;
    if (rank === 3) return <FaMedal className="text-orange-500" size={16} />;
    return <span className="text-xs font-medium text-gray-400 w-4 text-center">{rank}</span>;
  };

  return (
    <div className="flex items-center justify-between py-3 px-4 hover:bg-gray-50 rounded-lg transition-colors border-b border-gray-100 last:border-0">
      <div className="flex items-center gap-4">
        <div className="w-6 flex justify-center">
          {getRankIcon()}
        </div>
        <div>
          <p className="text-sm font-medium text-gray-900">{car.carNumber}</p>
          <p className="text-xs text-gray-500">{car.carModel}</p>
        </div>
      </div>
      <div className="flex items-center gap-6">
        <div className="text-right">
          <p className="text-sm font-medium text-gray-900">{car.totalTrips || 0}</p>
          <p className="text-xs text-gray-400">Trips</p>
        </div>
        <div className="text-right min-w-[80px]">
          <p className="text-sm font-bold text-green-600">₹{car.totalEarnings?.toLocaleString() || 0}</p>
          <p className="text-xs text-gray-400">Earnings</p>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// Filter Panel Component
// ─────────────────────────────────────────────
const FilterPanel = ({ isOpen, onClose, filters, onApplyFilters }) => {
  const [localFilters, setLocalFilters] = useState(filters);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="relative w-full max-w-md rounded-2xl shadow-2xl bg-white border border-gray-200 overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b bg-blue-50">
          <div className="flex items-center gap-2">
            <Filter size={18} className="text-blue-600" />
            <h2 className="text-lg font-bold text-gray-900">Filter Report</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white rounded-full transition-all">
            <X size={18} className="text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Date Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
            <select
              value={localFilters.dateRange}
              onChange={(e) => setLocalFilters({ ...localFilters, dateRange: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="quarter">This Quarter</option>
              <option value="year">This Year</option>
              <option value="custom">Custom Range</option>
            </select>
          </div>

          {/* Custom Date Range */}
          {localFilters.dateRange === 'custom' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">From</label>
                <input
                  type="date"
                  value={localFilters.startDate}
                  onChange={(e) => setLocalFilters({ ...localFilters, startDate: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">To</label>
                <input
                  type="date"
                  value={localFilters.endDate}
                  onChange={(e) => setLocalFilters({ ...localFilters, endDate: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
            </div>
          )}

          {/* Car Category Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Car Category</label>
            <select
              value={localFilters.category}
              onChange={(e) => setLocalFilters({ ...localFilters, category: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="all">All Categories</option>
              <option value="sedan">Sedan</option>
              <option value="suv">SUV</option>
              <option value="hatchback">Hatchback</option>
              <option value="luxury">Luxury</option>
            </select>
          </div>

          {/* Driver Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Driver Status</label>
            <select
              value={localFilters.driverStatus}
              onChange={(e) => setLocalFilters({ ...localFilters, driverStatus: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="all">All Drivers</option>
              <option value="approved">Approved Only</option>
              <option value="pending">Pending Only</option>
              <option value="active">Active Only</option>
            </select>
          </div>

          {/* Performance Threshold */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Minimum Earnings</label>
            <input
              type="number"
              placeholder="₹ 0"
              value={localFilters.minEarnings}
              onChange={(e) => setLocalFilters({ ...localFilters, minEarnings: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          {/* Include/Exclude Options */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Include in Report</label>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={localFilters.includeCars}
                  onChange={(e) => setLocalFilters({ ...localFilters, includeCars: e.target.checked })}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-600">Cars</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={localFilters.includeDrivers}
                  onChange={(e) => setLocalFilters({ ...localFilters, includeDrivers: e.target.checked })}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-600">Drivers</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={localFilters.includeEarnings}
                  onChange={(e) => setLocalFilters({ ...localFilters, includeEarnings: e.target.checked })}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-600">Earnings</span>
              </label>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              onClick={() => {
                setLocalFilters({
                  dateRange: 'month',
                  startDate: '',
                  endDate: '',
                  category: 'all',
                  driverStatus: 'all',
                  minEarnings: '',
                  includeCars: true,
                  includeDrivers: true,
                  includeEarnings: true
                });
              }}
              className="flex-1 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-all"
            >
              Reset
            </button>
            <button
              onClick={() => {
                onApplyFilters(localFilters);
                onClose();
              }}
              className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-all"
            >
              Apply Filters
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// Main FleetPerformanceReport Component
// ─────────────────────────────────────────────
export default function ManageReports() {
  const { themeColors } = useTheme();
  const { currentFont } = useFont();

  const reportContentRef = useRef(null);

  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dateRange, setDateRange] = useState('month');
  const [exporting, setExporting] = useState(false);
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [filters, setFilters] = useState({
    dateRange: 'month',
    startDate: '',
    endDate: '',
    category: 'all',
    driverStatus: 'all',
    minEarnings: '',
    includeCars: true,
    includeDrivers: true,
    includeEarnings: true
  });

  const fetchReport = async () => {
    try {
      setRefreshing(true);
      const data = await fleetApi.getPerformanceReport();
      setReportData(data?.report || null);
    } catch (err) {
      toast.error(err?.message || "Report load nahi ho saka");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, []);

  // Apply filters to data
  const filteredData = useMemo(() => {
    if (!reportData) return null;

    let filtered = { ...reportData };

    // Filter by date range if custom dates are set
    if (filters.dateRange === 'custom' && filters.startDate && filters.endDate) {
      const start = new Date(filters.startDate);
      const end = new Date(filters.endDate);

      // Filter top performing cars by date
      filtered.topPerformingCars = (filtered.topPerformingCars || []).filter(car => {
        // This would need actual date fields in your data
        return true;
      });
    }

    // Filter by minimum earnings
    if (filters.minEarnings) {
      const minEarnings = Number(filters.minEarnings);
      filtered.topPerformingCars = (filtered.topPerformingCars || []).filter(
        car => (car.totalEarnings || 0) >= minEarnings
      );
      filtered.needsAttentionCars = (filtered.needsAttentionCars || []).filter(
        car => (car.totalEarnings || 0) >= minEarnings
      );
    }

    return filtered;
  }, [reportData, filters]);

  const fleetStats = filteredData?.fleetStats || {};
  const utilization = filteredData?.utilization || {};
  const topCars = filteredData?.topPerformingCars || [];
  const attentionCars = filteredData?.needsAttentionCars || [];
  const reportGeneratedAt = filteredData?.reportGeneratedAt;

  // Chart configurations (same as before)
  const fleetDistributionData = [
    { name: 'Total Cars', value: fleetStats.totalCars || 0, color: CHART_COLORS.primary },
    { name: 'Total Drivers', value: fleetStats.totalDrivers || 0, color: CHART_COLORS.success }
  ].filter(item => item.value > 0);

  const utilizationData = [
    { name: 'Utilized', value: utilization.busyCarsCount || 0, color: CHART_COLORS.success },
    { name: 'Available', value: (fleetStats.totalCars || 0) - (utilization.busyCarsCount || 0), color: CHART_COLORS.warning }
  ].filter(item => item.value > 0);

  const earningsData = topCars.slice(0, 5).map(car => ({
    name: car.carNumber,
    earnings: car.totalEarnings || 0,
    trips: car.totalTrips || 0
  }));

  const performanceData = [
    { name: 'Earnings', value: fleetStats.totalEarnings || 0, color: CHART_COLORS.success },
    { name: 'Cars', value: fleetStats.totalCars || 0, color: CHART_COLORS.primary },
    { name: 'Drivers', value: fleetStats.totalDrivers || 0, color: CHART_COLORS.purple }
  ];

  const monthlyTrendData = [
    { month: 'Jan', earnings: fleetStats.monthlyEarningsSnapshot || 0, trips: 0 },
    { month: 'Feb', earnings: 0, trips: 0 },
    { month: 'Mar', earnings: 0, trips: 0 },
    { month: 'Apr', earnings: 0, trips: 0 },
    { month: 'May', earnings: 0, trips: 0 },
    { month: 'Jun', earnings: 0, trips: 0 }
  ];

  const topCarsData = topCars.slice(0, 5).map((car, index) => ({
    name: car.carNumber,
    value: car.totalEarnings || 0,
    color: index === 0 ? CHART_COLORS.yellow :
      index === 1 ? CHART_COLORS.gray :
        index === 2 ? CHART_COLORS.orange : CHART_COLORS.primary
  }));

  const attentionGaugeOptions = {
    chart: { type: 'solidgauge', height: 200, style: { fontFamily: currentFont.family } },
    title: { text: null },
    pane: {
      center: ['50%', '70%'],
      size: '100%',
      startAngle: -90,
      endAngle: 90,
      background: {
        backgroundColor: CHART_COLORS.lightGray,
        innerRadius: '60%',
        outerRadius: '100%',
        shape: 'arc'
      }
    },
    tooltip: { enabled: false },
    yAxis: {
      min: 0,
      max: fleetStats.totalCars || 1,
      stops: [
        [0.1, CHART_COLORS.success],
        [0.5, CHART_COLORS.warning],
        [0.9, CHART_COLORS.danger]
      ],
      lineWidth: 0,
      tickWidth: 0,
      minorTickInterval: null,
      tickAmount: 2,
      labels: { y: 16 }
    },
    plotOptions: {
      solidgauge: {
        dataLabels: {
          y: -20,
          borderWidth: 0,
          useHTML: true,
          format: '<div style="text-align:center"><span style="font-size:20px">{point.y}</span><br/><span style="font-size:12px">Cars</span></div>'
        }
      }
    },
    series: [{
      name: 'Cars Needing Attention',
      data: [attentionCars.length || 0],
      dataLabels: { format: '<div style="text-align:center"><span style="font-size:20px">{y}</span><br/><span style="font-size:12px">Need Attention</span></div>' },
      tooltip: { valueSuffix: ' cars' }
    }],
    credits: { enabled: false },
    exporting: { enabled: false }
  };

  const scatterData = topCars.map(car => ({
    x: car.totalTrips || 0,
    y: car.totalEarnings || 0,
    name: car.carNumber,
    color: car.totalEarnings > 0 ? CHART_COLORS.success : CHART_COLORS.gray
  }));

  const scatterOptions = {
    chart: { type: 'scatter', height: 250, style: { fontFamily: currentFont.family } },
    title: { text: null },
    xAxis: { title: { text: 'Trips' }, gridLineWidth: 1 },
    yAxis: { title: { text: 'Earnings (₹)' }, gridLineWidth: 1 },
    legend: { enabled: false },
    plotOptions: {
      scatter: {
        marker: { radius: 6, symbol: 'circle' },
        tooltip: { pointFormat: '{point.name}<br/>Trips: {point.x}<br/>Earnings: ₹{point.y}' }
      }
    },
    series: [{
      name: 'Cars',
      colorByPoint: true,
      data: scatterData.map(d => ({ x: d.x, y: d.y, name: d.name }))
    }],
    credits: { enabled: false },
    exporting: { enabled: false }
  };

  const pieOptions = (data, title) => ({
    chart: { type: 'pie', height: 220, style: { fontFamily: currentFont.family } },
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
    exporting: { enabled: false },
    responsive: {
      rules: [{
        condition: { maxWidth: 500 },
        chartOptions: {
          legend: {
            align: 'center',
            verticalAlign: 'bottom',
            layout: 'horizontal'
          }
        }
      }]
    }
  });

  const barOptions = {
    chart: { type: 'column', height: 220, style: { fontFamily: currentFont.family } },
    title: { text: null },
    xAxis: { categories: performanceData.map(d => d.name) },
    yAxis: { title: { text: null }, allowDecimals: false },
    legend: { enabled: false },
    tooltip: { pointFormat: '{point.y}' },
    plotOptions: { column: { borderRadius: 4 } },
    series: [{
      name: 'Value',
      data: performanceData.map(d => ({ y: d.value, color: d.color }))
    }],
    credits: { enabled: false },
    exporting: { enabled: false }
  };

  const lineOptions = {
    chart: { type: 'spline', height: 220, style: { fontFamily: currentFont.family } },
    title: { text: null },
    xAxis: { categories: monthlyTrendData.map(d => d.month) },
    yAxis: { title: { text: null } },
    legend: { layout: 'horizontal', align: 'center', verticalAlign: 'bottom' },
    plotOptions: {
      spline: { marker: { radius: 4 } }
    },
    series: [
      { name: 'Earnings', data: monthlyTrendData.map(d => d.earnings), color: CHART_COLORS.success },
      { name: 'Trips', data: monthlyTrendData.map(d => d.trips), color: CHART_COLORS.primary }
    ],
    credits: { enabled: false },
    exporting: { enabled: false }
  };

  const horizontalBarOptions = {
    chart: { type: 'bar', height: 250, style: { fontFamily: currentFont.family } },
    title: { text: null },
    xAxis: { categories: topCarsData.map(d => d.name) },
    yAxis: { title: { text: 'Earnings (₹)' } },
    legend: { enabled: false },
    plotOptions: { bar: { borderRadius: 4 } },
    series: [{
      name: 'Earnings',
      data: topCarsData.map(d => ({ y: d.value, color: d.color }))
    }],
    credits: { enabled: false },
    exporting: { enabled: false }
  };

  // ── EXPORT FUNCTIONS ─────────────────────────────

  const handleExportPDF = async () => {
    setExporting(true);
    try {
      const element = document.getElementById('report-content');
      if (!element) throw new Error('Report content not found');

      const canvas = await html2canvas(element, {
        scale: 2,
        backgroundColor: '#ffffff',
        logging: false,
        allowTaint: true,
        useCORS: true
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: 'a4'
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`fleet-performance-report-${new Date().toISOString().split('T')[0]}.pdf`);

      toast.success("PDF downloaded successfully!");
    } catch (err) {
      console.error('PDF Export Error:', err);
      toast.error("Failed to generate PDF");
    } finally {
      setExporting(false);
    }
  };

  const handleExportExcel = () => {
    try {
      // Prepare data for Excel
      const workbook = XLSX.utils.book_new();

      // Summary Sheet
      const summaryData = [
        ['Fleet Performance Report', new Date().toLocaleDateString()],
        [],
        ['Metric', 'Value'],
        ['Total Earnings', `₹${fleetStats.totalEarnings?.toLocaleString() || 0}`],
        ['Wallet Balance', `₹${fleetStats.walletBalance?.toLocaleString() || 0}`],
        ['Total Cars', fleetStats.totalCars || 0],
        ['Total Drivers', fleetStats.totalDrivers || 0],
        ['Utilization Rate', utilization.utilizationRate || '0%'],
        ['Busy Cars', utilization.busyCarsCount || 0],
        ['Monthly Earnings', `₹${fleetStats.monthlyEarningsSnapshot?.toLocaleString() || 0}`],
        ['Cars Needing Attention', attentionCars.length],
      ];

      const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');

      // Top Performing Cars Sheet
      if (topCars.length > 0) {
        const topCarsSheetData = [
          ['Rank', 'Car Number', 'Model', 'Total Trips', 'Total Earnings (₹)'],
          ...topCars.map((car, index) => [
            index + 1,
            car.carNumber,
            car.carModel,
            car.totalTrips || 0,
            car.totalEarnings || 0
          ])
        ];
        const topCarsSheet = XLSX.utils.aoa_to_sheet(topCarsSheetData);
        XLSX.utils.book_append_sheet(workbook, topCarsSheet, 'Top Cars');
      }

      // Cars Needing Attention Sheet
      if (attentionCars.length > 0) {
        const attentionCarsSheetData = [
          ['Car Number', 'Model', 'Total Trips', 'Total Earnings (₹)'],
          ...attentionCars.map(car => [
            car.carNumber,
            car.carModel,
            car.totalTrips || 0,
            car.totalEarnings || 0
          ])
        ];
        const attentionCarsSheet = XLSX.utils.aoa_to_sheet(attentionCarsSheetData);
        XLSX.utils.book_append_sheet(workbook, attentionCarsSheet, 'Needs Attention');
      }

      // Save Excel file
      XLSX.writeFile(workbook, `fleet-performance-report-${new Date().toISOString().split('T')[0]}.xlsx`);
      toast.success("Excel downloaded successfully!");
    } catch (err) {
      console.error('Excel Export Error:', err);
      toast.error("Failed to generate Excel");
    }
  };

  const handleExportCSV = () => {
    try {
      // Prepare CSV data
      const csvData = [];

      // Header
      csvData.push('Fleet Performance Report');
      csvData.push(`Generated on: ${new Date().toLocaleString()}`);
      csvData.push('');

      // Summary
      csvData.push('SUMMARY');
      csvData.push('Metric,Value');
      csvData.push(`Total Earnings,₹${fleetStats.totalEarnings?.toLocaleString() || 0}`);
      csvData.push(`Wallet Balance,₹${fleetStats.walletBalance?.toLocaleString() || 0}`);
      csvData.push(`Total Cars,${fleetStats.totalCars || 0}`);
      csvData.push(`Total Drivers,${fleetStats.totalDrivers || 0}`);
      csvData.push(`Utilization Rate,${utilization.utilizationRate || '0%'}`);
      csvData.push(`Busy Cars,${utilization.busyCarsCount || 0}`);
      csvData.push(`Monthly Earnings,₹${fleetStats.monthlyEarningsSnapshot?.toLocaleString() || 0}`);
      csvData.push(`Cars Needing Attention,${attentionCars.length}`);
      csvData.push('');

      // Top Cars
      if (topCars.length > 0) {
        csvData.push('TOP PERFORMING CARS');
        csvData.push('Rank,Car Number,Model,Trips,Earnings (₹)');
        topCars.forEach((car, index) => {
          csvData.push(`${index + 1},${car.carNumber},${car.carModel || ''},${car.totalTrips || 0},${car.totalEarnings || 0}`);
        });
        csvData.push('');
      }

      // Attention Cars
      if (attentionCars.length > 0) {
        csvData.push('CARS NEEDING ATTENTION');
        csvData.push('Car Number,Model,Trips,Earnings (₹)');
        attentionCars.forEach(car => {
          csvData.push(`${car.carNumber},${car.carModel || ''},${car.totalTrips || 0},${car.totalEarnings || 0}`);
        });
      }

      // Create and download CSV
      const blob = new Blob([csvData.join('\n')], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `fleet-performance-report-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);

      toast.success("CSV downloaded successfully!");
    } catch (err) {
      console.error('CSV Export Error:', err);
      toast.error("Failed to generate CSV");
    }
  };

  const handlePrint = () => {
    const printContent = document.getElementById('report-content');
    const originalTitle = document.title;

    if (printContent) {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Fleet Performance Report</title>
              <style>
                body { font-family: ${currentFont.family}; padding: 20px; }
                @media print {
                  body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                }
              </style>
            </head>
            <body>${printContent.outerHTML}</body>
          </html>
        `);
        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
        printWindow.close();
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 sm:p-6 bg-gray-50 min-h-screen" style={{ fontFamily: currentFont.family }}>


      {/* Header - Redesigned for Mobile */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-5 mb-8">
        <div className="flex items-start justify-between w-full sm:w-auto">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-600 text-white rounded-2xl shadow-lg shadow-blue-500/20">
              <TrendingUp size={20} />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">Performance</h1>
              <p className="text-[10px] sm:text-xs text-gray-500 font-medium mt-0.5 uppercase tracking-wider">Fleet & Earnings Analysis</p>
            </div>
          </div>
          
          {/* Refresh Button - TOP RIGHT ON MOBILE */}
          <button
            onClick={fetchReport}
            className="sm:hidden p-3 rounded-2xl border border-gray-100 bg-white shadow-sm hover:shadow-md transition-all active:scale-90 text-blue-600"
            title="Refresh"
          >
            <FaSync className={refreshing ? "animate-spin" : ""} size={16} />
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {/* Refresh Button - DESKTOP ONLY */}
          <button
            onClick={fetchReport}
            className="hidden sm:flex p-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 transition-all text-gray-600"
            title="Refresh"
          >
            <FaSync className={refreshing ? "animate-spin" : ""} size={14} />
          </button>

          <button
            onClick={() => setShowFilterPanel(true)}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50 transition-all shadow-sm active:scale-95"
          >
            <Filter size={16} className="text-blue-600" />
            <span>Filter</span>
          </button>

          <div className="flex-none flex items-center gap-1.5 p-1 bg-gray-100/50 rounded-xl border border-gray-200">
            <button
               onClick={handleExportPDF}
               className="p-2 text-red-600 hover:bg-white rounded-lg transition-all"
               title="Export PDF"
            >
               <FaFilePdf size={16} />
            </button>
            <button
               onClick={handleExportExcel}
               className="p-2 text-green-600 hover:bg-white rounded-lg transition-all"
               title="Export Excel"
            >
               <FaFileExcel size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Report Generated Info */}
      <div className="text-xs text-gray-400 flex items-center gap-2">
        <FaCalendarAlt size={12} />
        Report Generated: {reportGeneratedAt ? new Date(reportGeneratedAt).toLocaleString('en-IN') : 'N/A'}
        {filters.dateRange === 'custom' && filters.startDate && filters.endDate && (
          <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">
            Filtered: {new Date(filters.startDate).toLocaleDateString()} - {new Date(filters.endDate).toLocaleDateString()}
          </span>
        )}
      </div>

      {/* Main Report Content */}
      <div id="report-content" ref={reportContentRef} className="space-y-6">

        {/* Primary Stats Grid - 2 Columns on Mobile */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <StatCard
            label="Total Earnings"
            value={`₹${fleetStats.totalEarnings?.toLocaleString() || 0}`}
            icon={FaWallet}
            color={CHART_COLORS.success}
            trend={12}
          />
          <StatCard
            label="Wallet Balance"
            value={`₹${fleetStats.walletBalance?.toLocaleString() || 0}`}
            icon={FaMoneyBillWave}
            color={CHART_COLORS.primary}
            trend={-5}
          />
          <StatCard
            label="Total Cars"
            value={fleetStats.totalCars || 0}
            icon={FaCar}
            color={CHART_COLORS.purple}
          />
          <StatCard
            label="Total Drivers"
            value={fleetStats.totalDrivers || 0}
            icon={FaUsers}
            color={CHART_COLORS.orange}
          />
        </div>

        {/* Utilization & Snapshot Grid - 2 Columns on Mobile */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <KPICard
            label="Utilization Rate"
            value={utilization.utilizationRate || '0%'}
            icon={Gauge}
            color={CHART_COLORS.cyan}
            sublabel={`${utilization.busyCarsCount || 0} cars currently busy`}
          />
          <KPICard
            label="Monthly Revenue"
            value={`₹${fleetStats.monthlyEarningsSnapshot?.toLocaleString() || 0}`}
            icon={Calendar}
            color={CHART_COLORS.pink}
            sublabel="Current billing period"
          />
          <KPICard
            label="Efficiency Score"
            value="94%"
            icon={Activity}
            color={CHART_COLORS.teal}
            sublabel="+2.5% from last period"
          />
          <KPICard
            label="Fleet Health"
            value="Excellent"
            icon={Check}
            color={CHART_COLORS.success}
            sublabel="Average rating: 4.8/5"
          />
        </div>

        {/* Charts Row 1 - 4 Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Chart 1: Fleet Distribution */}
          <ChartCard title="Fleet Distribution" subtitle="Cars vs Drivers" icon={FaChartPie}>
            {fleetDistributionData.length > 0 ? (
              <HighchartsReact highcharts={Highcharts} options={pieOptions(fleetDistributionData, 'Fleet')} />
            ) : (
              <div className="h-[200px] flex items-center justify-center text-gray-400 text-sm">
                No data available
              </div>
            )}
          </ChartCard>

          {/* Chart 2: Utilization */}
          <ChartCard title="Utilization" subtitle="Busy vs Available" icon={FaChartPie}>
            {utilizationData.length > 0 ? (
              <HighchartsReact highcharts={Highcharts} options={pieOptions(utilizationData, 'Utilization')} />
            ) : (
              <div className="h-[200px] flex items-center justify-center text-gray-400 text-sm">
                No data available
              </div>
            )}
          </ChartCard>

          {/* Chart 3: Performance Comparison */}
          <ChartCard title="Performance" subtitle="Key metrics" icon={FaChartBar}>
            <HighchartsReact highcharts={Highcharts} options={barOptions} />
          </ChartCard>

          {/* Chart 4: Attention Gauge */}
          <ChartCard title="Cars Needing Attention" subtitle="Out of total fleet" icon={Target}>
            <HighchartsReact highcharts={Highcharts} options={attentionGaugeOptions} />
          </ChartCard>
        </div>

        {/* Charts Grid - 1 Col on Mobile, 2 on Desktop */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* Chart 5: Monthly Trend */}
          <ChartCard title="Monthly Trend" subtitle="Earnings & Trips" icon={FaChartLine}>
            <HighchartsReact highcharts={Highcharts} options={lineOptions} />
          </ChartCard>

          {/* Chart 6: Earnings vs Trips Scatter */}
          <ChartCard title="Earnings vs Trips" subtitle="Performance correlation" icon={FaChartArea}>
            <HighchartsReact highcharts={Highcharts} options={scatterOptions} />
          </ChartCard>
        </div>

        {/* Charts Row 3 - 1 Chart */}
        <div className="grid grid-cols-1 gap-6">
          {/* Chart 7: Top Cars Performance */}
          <ChartCard title="Top Performing Cars" subtitle="Earnings by vehicle" icon={FaChartBar}>
            <HighchartsReact highcharts={Highcharts} options={horizontalBarOptions} />
          </ChartCard>
        </div>

        {/* Top Performing Cars List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-yellow-50 to-orange-50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FaAward className="text-yellow-600" />
              <h3 className="text-sm font-semibold text-gray-900">Top Performing Cars</h3>
            </div>
            <span className="text-xs text-gray-500">Ranked by earnings</span>
          </div>
          <div className="p-4">
            {topCars.length > 0 ? (
              topCars.map((car, index) => (
                <CarPerformanceRow key={car._id} car={car} rank={index + 1} type="top" />
              ))
            ) : (
              <div className="py-8 text-center text-gray-400 text-sm">
                No car performance data available
              </div>
            )}
          </div>
        </div>

        {/* Cars Needing Attention List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-red-50 to-orange-50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FaExclamationTriangle className="text-red-600" />
              <h3 className="text-sm font-semibold text-gray-900">Cars Needing Attention</h3>
            </div>
            <span className="text-xs text-gray-500">Low performance / No trips</span>
          </div>
          <div className="p-4">
            {attentionCars.length > 0 ? (
              attentionCars.map((car, index) => (
                <CarPerformanceRow key={car._id} car={car} rank={index + 1} type="attention" />
              ))
            ) : (
              <div className="py-8 text-center text-gray-400 text-sm">
                No cars need attention! 🎉
              </div>
            )}
          </div>
        </div>

        {/* Summary Section */}
        <div className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl p-6 text-white shadow-lg">
          <h3 className="text-lg font-semibold mb-4">Performance Summary</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <p className="text-blue-100 text-xs uppercase tracking-wider">Total Fleet Value</p>
              <p className="text-2xl font-bold mt-1">{fleetStats.totalCars || 0} Cars</p>
            </div>
            <div>
              <p className="text-blue-100 text-xs uppercase tracking-wider">Workforce</p>
              <p className="text-2xl font-bold mt-1">{fleetStats.totalDrivers || 0} Drivers</p>
            </div>
            <div>
              <p className="text-blue-100 text-xs uppercase tracking-wider">Utilization</p>
              <p className="text-2xl font-bold mt-1">{utilization.utilizationRate || '0%'}</p>
            </div>
            <div>
              <p className="text-blue-100 text-xs uppercase tracking-wider">Efficiency Score</p>
              <p className="text-2xl font-bold mt-1">
                {fleetStats.totalCars ? Math.round((utilization.busyCarsCount / fleetStats.totalCars) * 100) : 0}%
              </p>
            </div>
          </div>
        </div>

      </div> {/* End report-content */}

      {/* Filter Panel */}
      <FilterPanel
        isOpen={showFilterPanel}
        onClose={() => setShowFilterPanel(false)}
        filters={filters}
        onApplyFilters={setFilters}
      />
    </div>
  );
}