// src/pages/ManageAssignments.jsx
import { useState, useEffect, useCallback, useMemo } from "react";
import { useTheme } from "../context/ThemeContext";
import { useFont } from "../context/FontContext";
import { assignmentApi } from "../api/assignmentApi";
import { driversApi } from "../api/driversApi";
import { carsApi } from "../api/carsApi";
import { toast } from "sonner";
import Swal from "sweetalert2";
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend,
  LineChart, Line
} from 'recharts';
import {
  FaCar, FaUser, FaSync, FaLink, FaUnlink, FaEye,
  FaSearch, FaTimes, FaCheckCircle, FaClock, FaExclamationTriangle,
  FaChartPie, FaChartBar, FaChartLine, FaHistory
} from "react-icons/fa";
import {
  Eye, X, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
  LinkIcon, Unlink, User, Car, Calendar, Phone, UserCheck,
  TrendingUp, DollarSign, Activity, Users
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
// StatBox
// ─────────────────────────────────────────────
const StatBox = ({ label, value, icon: Icon, color, trend }) => (
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
// Assign Modal
// ─────────────────────────────────────────────
const AssignModal = ({ isOpen, onClose, onAssign, drivers, cars, assignments, themeColors, preSelectedDriverId }) => {
  const [driverId, setDriverId] = useState("");
  const [carId, setCarId] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setDriverId(preSelectedDriverId || "");
      setCarId("");
    }
  }, [isOpen, preSelectedDriverId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!driverId) return Swal.fire({ icon: "error", title: "Driver Select Karo", text: "Koi driver select karna zaroori hai!" });
    if (!carId) return Swal.fire({ icon: "error", title: "Car Select Karo", text: "Koi car select karna zaroori hai!" });
    setSaving(true);
    try { await onAssign(driverId, carId); onClose(); }
    catch (err) { /* Handled in parent */ }
    finally { setSaving(false); }
  };

  if (!isOpen) return null;

  const inputStyle = {
    backgroundColor: themeColors.background,
    color: themeColors.text,
    borderColor: themeColors.border,
  };

  // Jo drivers/cars abhi assigned hain unhe exclude karo
  const assignedDriverIds = new Set(
    assignments.filter(a => a.isAssigned).map(a => a.driverId?._id || a.driverId)
  );
  const assignedCarIds = new Set(
    assignments.filter(a => a.isAssigned).map(a => a.carId?._id || a.carId)
  );
  const freeDrivers = drivers.filter(d => !assignedDriverIds.has(d._id));
  const freeCars = cars.filter(c => !assignedCarIds.has(c._id));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }} onClick={onClose}>
      <div className="relative w-full max-w-md rounded-2xl shadow-2xl border overflow-hidden" style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border }} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b bg-blue-50/60">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 rounded-lg shadow-blue-200 shadow-md">
              <LinkIcon className="text-white" size={18} />
            </div>
            <h2 className="text-lg font-bold text-gray-900">🔗 Car Assign Karo</h2>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex justify-center items-center hover:bg-red-50 hover:text-red-500 transition-all">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Driver Select */}
          <div>
            <label className="block text-xs font-semibold mb-1.5 text-gray-600 uppercase tracking-wide">
              Driver <span className="text-red-500">*</span>
            </label>
            <select
              value={driverId}
              onChange={e => setDriverId(e.target.value)}
              required
              className="w-full p-2.5 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              style={inputStyle}
            >
              <option value="">-- Driver Select Karo --</option>
              {freeDrivers.map(d => (
                <option key={d._id} value={d._id}>{d.name} — {d.phone}</option>
              ))}
            </select>
            {freeDrivers.length === 0 && (
              <p className="text-xs text-orange-500 mt-1">⚠️ Koi unassigned driver nahi mila</p>
            )}
          </div>

          {/* Car Select */}
          <div>
            <label className="block text-xs font-semibold mb-1.5 text-gray-600 uppercase tracking-wide">
              Car <span className="text-red-500">*</span>
            </label>
            <select
              value={carId}
              onChange={e => setCarId(e.target.value)}
              required
              className="w-full p-2.5 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              style={inputStyle}
            >
              <option value="">-- Car Select Karo --</option>
              {freeCars.map(c => (
                <option key={c._id} value={c._id}>{c.carNumber} — {c.carModel} {c.carBrand ? `(${c.carBrand})` : ""}</option>
              ))}
            </select>
            {freeCars.length === 0 && (
              <p className="text-xs text-orange-500 mt-1">⚠️ Koi unassigned car nahi mili</p>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl border font-medium text-sm text-gray-700 hover:bg-gray-50">Cancel</button>
            <button type="submit" disabled={saving} className="flex-1 py-2.5 rounded-xl font-medium text-sm text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50">
              {saving ? "Assigning..." : "🔗 Assign Karo"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

};

// ─────────────────────────────────────────────
// Detail Modal — Assignment Info
// ─────────────────────────────────────────────
const AssignmentDetailModal = ({ assignment, onClose }) => {
  if (!assignment) return null;

  const Row = ({ label, value, icon: Icon, valueColor }) => (
    <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-100 hover:bg-white transition-all">
      <div className="flex items-center gap-3">
        {Icon && <div className="p-2 rounded-lg bg-blue-50 text-blue-600"><Icon size={14} /></div>}
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{label}</span>
      </div>
      <span className="font-bold text-sm" style={{ color: valueColor || "#1F2937" }}>{value || "—"}</span>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="relative w-full max-w-lg rounded-2xl shadow-2xl bg-white border border-gray-100 overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b bg-blue-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 rounded-lg shadow-blue-200 shadow-md">
              <Eye className="text-white" size={18} />
            </div>
            <h2 className="text-lg font-bold text-gray-900">Assignment Details</h2>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex justify-center items-center hover:bg-red-50 hover:text-red-500 transition-all">
            <X size={18} />
          </button>
        </div>
        <div className="p-6 space-y-3">
          <h4 className="text-xs font-bold text-blue-500 uppercase tracking-widest">Driver Info</h4>
          <Row label="Name" value={assignment.driverName || assignment.driverId?.name} icon={User} />
          <Row label="Phone" value={assignment.driverPhone || assignment.driverId?.phone} icon={Phone} />
          <Row label="Email" value={assignment.driverId?.email} icon={User} />
          <h4 className="text-xs font-bold text-green-500 uppercase tracking-widest pt-2">Car Info</h4>
          <Row label="Car Number" value={assignment.carNumber || assignment.carId?.carNumber} icon={Car} />
          <Row label="Model" value={assignment.carModel || assignment.carId?.carModel} icon={Car} />
          <Row label="Seats" value={assignment.seatCapacity} icon={UserCheck} />
          <h4 className="text-xs font-bold text-orange-500 uppercase tracking-widest pt-2">Status</h4>
          <Row
            label="Status"
            value={assignment.isAssigned ? "Assigned ✅" : "Unassigned"}
            valueColor={assignment.isAssigned ? "#10B981" : "#6B7280"}
          />
          <Row label="Assigned At" value={assignment.assignedAt ? new Date(assignment.assignedAt).toLocaleString("en-IN") : "—"} icon={Calendar} />
          {assignment.unassignedAt && (
            <Row label="Unassigned At" value={new Date(assignment.unassignedAt).toLocaleString("en-IN")} icon={Calendar} valueColor="#EF4444" />
          )}
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────
export default function ManageAssignments() {
  const { themeColors } = useTheme();
  const { currentFont } = useFont();

  const [assignments, setAssignments] = useState([]);
  const [history, setHistory] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  const [showAssignModal, setShowAssignModal] = useState(false);
  const [viewAssignment, setViewAssignment] = useState(null);
  const [unassigning, setUnassigning] = useState(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const [preSelectedDriver, setPreSelectedDriver] = useState("");

  // ── Fetch ───────────────────────────────────────
  const fetchAssignments = useCallback(async () => {
    setLoading(true);
    try {
      const [aData, hData] = await Promise.all([
        assignmentApi.getAllAssignments(),
        assignmentApi.getUnassignedHistory()
      ]);
      setAssignments(aData?.assignments || aData?.data || []);
      setHistory(hData?.assignments || hData?.data || []);
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || "Data load nahi hua");
      setAssignments([]);
      setHistory([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchDriversAndCars = useCallback(async () => {
    try {
      const [dData, cData] = await Promise.all([driversApi.getAllDrivers(), carsApi.getAllCars()]);
      setDrivers(dData?.drivers || dData?.data || []);
      setCars(cData?.cars || cData?.data || []);
    } catch (err) {
      console.error("Drivers/Cars fetch error:", err);
    }
  }, []);

  useEffect(() => {
    fetchAssignments();
    fetchDriversAndCars();
  }, [fetchAssignments, fetchDriversAndCars]);

  useEffect(() => { setCurrentPage(1); }, [search, filter, itemsPerPage]);

  // ── Handlers ─────────────────────────────────────
  const handleAssign = async (driverId, carId) => {
    try {
      const res = await assignmentApi.assignCar(driverId, carId);
      if (res.success === false) throw new Error(res.message || "Assign failed");
      toast.success(`Car assign ho gayi! 🔗 Driver: ${res.assignment?.driverName || ""}`);
      fetchAssignments();
      fetchDriversAndCars();
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Assign Failed",
        text: err?.response?.data?.message || err?.message || "Kuch gadbad ho gayi!",
        confirmButtonColor: "#3B82F6",
      });
      throw err;
    }
  };

  const handleUnassign = async (assignmentId, driverName) => {
    const result = await Swal.fire({
      icon: "warning",
      title: "Car Unassign Karein?",
      text: `${driverName} se car wapas loge?`,
      showCancelButton: true,
      confirmButtonColor: "#EF4444",
      cancelButtonColor: "#6B7280",
      confirmButtonText: "Haan, Unassign Karo",
      cancelButtonText: "Cancel",
    });
    if (!result.isConfirmed) return;

    setUnassigning(assignmentId);
    try {
      const res = await assignmentApi.unassignCar(assignmentId);
      if (res.success === false) throw new Error(res.message || "Unassign failed");
      toast.success("Car unassign ho gayi! 🔓");
      fetchAssignments();
      fetchDriversAndCars();
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Unassign Failed",
        text: err?.response?.data?.message || err?.message || "Kuch gadbad ho gayi!",
        confirmButtonColor: "#3B82F6",
      });
    } finally {
      setUnassigning(null);
    }
  };

  // ── Filtered + Paginated ─────────────────────────
  // Map drivers to their active assignment
  const assignmentsByDriverId = useMemo(() => {
    const map = {};
    assignments.forEach(a => {
      if (a.isAssigned) {
        const dId = a.driverId?._id || a.driverId;
        if (dId) map[dId] = a;
      }
    });
    return map;
  }, [assignments]);

  const filtered = useMemo(() => {
    if (filter === "history") {
      return history
        .filter(h => {
          const q = search.toLowerCase();
          return (
            (h.driverName || "").toLowerCase().includes(q) ||
            (h.driverPhone || "").includes(q) ||
            (h.carNumber || "").toLowerCase().includes(q) ||
            (h.carModel || "").toLowerCase().includes(q)
          );
        })
        .sort((a, b) => new Date(b.unassignedAt || 0) - new Date(a.unassignedAt || 0));
    }

    return drivers
      .filter(d => {
        const hasCar = !!assignmentsByDriverId[d._id];
        if (filter === "assigned") return hasCar;
        if (filter === "unassigned") return !hasCar;
        return true;
      })
      .filter(d => {
        const q = search.toLowerCase();
        const a = assignmentsByDriverId[d._id];
        return (
          d.name.toLowerCase().includes(q) ||
          d.phone.includes(q) ||
          (a && (
            (a.carNumber || a.carId?.carNumber || "").toLowerCase().includes(q) ||
            (a.carModel || a.carId?.carModel || "").toLowerCase().includes(q)
          ))
        );
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [drivers, filter, search, assignmentsByDriverId, history]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const displayed = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filtered.slice(start, start + itemsPerPage);
  }, [filtered, currentPage, itemsPerPage]);

  // ── Stats ─────────────────────────────────────────
  const stats = useMemo(() => {
    const assignedCount = drivers.filter(d => !!assignmentsByDriverId[d._id]).length;
    return {
      total: drivers.length,
      assigned: assignedCount,
      unassigned: drivers.length - assignedCount,
      history: history.length,
    };
  }, [drivers, assignmentsByDriverId, history]);

  // ── Chart Data ────────────────────────────────────
  const statusData = [
    { name: 'Assigned', value: stats.assigned, color: CHART_COLORS.success },
    { name: 'Unassigned', value: stats.unassigned, color: CHART_COLORS.gray }
  ].filter(item => item.value > 0);

  const assignmentTrendData = assignments.slice(0, 7).map((a, i) => ({
    day: `Day ${i + 1}`,
    assignments: 1
  }));

  const driverUtilizationData = [
    { name: 'With Car', value: stats.assigned, color: CHART_COLORS.success },
    { name: 'Without Car', value: stats.unassigned, color: CHART_COLORS.warning }
  ].filter(item => item.value > 0);

  const monthlyHistoryData = history.reduce((acc, h) => {
    const month = new Date(h.unassignedAt || h.createdAt).toLocaleString('default', { month: 'short' });
    acc[month] = (acc[month] || 0) + 1;
    return acc;
  }, {});

  const historyBarData = Object.entries(monthlyHistoryData).map(([month, count]) => ({ month, count }));

  return (
    <div className="space-y-6 p-6 bg-gray-50 min-h-screen" style={{ fontFamily: currentFont.family }}>

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2 text-gray-900">
            <FaLink className="text-blue-600" />
            Car Assignments
          </h1>
          <p className="text-sm text-gray-500 mt-1">Fleet mein {stats.assigned} active assignments hain</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => { fetchAssignments(); fetchDriversAndCars(); }} className="p-2 rounded-lg border hover:bg-gray-50 transition-all text-gray-600" title="Refresh">
            <FaSync />
          </button>
          <button
            onClick={() => { setPreSelectedDriver(""); setShowAssignModal(true); }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all font-medium text-sm"
          >
            <FaLink /> Assign Car
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <StatBox label="Total Drivers" value={stats.total} icon={FaUser} color={CHART_COLORS.primary} />
        <StatBox label="Assigned" value={stats.assigned} icon={FaCheckCircle} color={CHART_COLORS.success} trend={15} />
        <StatBox label="Unassigned" value={stats.unassigned} icon={FaUnlink} color={CHART_COLORS.gray} />
        <StatBox label="History" value={stats.history} icon={FaHistory} color={CHART_COLORS.purple} />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Chart 1: Assignment Status */}
        <ChartCard title="Assignment Status" icon={FaChartPie}>
          {statusData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-gray-400 text-sm">
              No data available
            </div>
          )}
        </ChartCard>

        {/* Chart 2: Driver Utilization */}
        <ChartCard title="Driver Utilization" icon={Activity}>
          {driverUtilizationData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={driverUtilizationData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {driverUtilizationData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-gray-400 text-sm">
              No data available
            </div>
          )}
        </ChartCard>

        {/* Chart 3: Assignment Trend */}
        <ChartCard title="Assignment Trend" icon={FaChartLine}>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={assignmentTrendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="assignments" stroke={CHART_COLORS.primary} strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Chart 4: History Distribution */}
        <ChartCard title="History Distribution" icon={FaChartBar}>
          {historyBarData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={historyBarData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill={CHART_COLORS.purple} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-gray-400 text-sm">
              No history data
            </div>
          )}
        </ChartCard>
      </div>

      {/* Search */}
      <div className="flex gap-3 p-4 bg-white rounded-xl border border-gray-200">
        <div className="relative flex-1">
          <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={12} />
          <input
            type="text"
            placeholder="Search by driver name, phone, car number, model..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2">
              <FaTimes className="text-xs text-gray-400" />
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">

        {/* Tabs */}
        <div className="flex border-b border-gray-200 overflow-x-auto bg-gray-50/30">
          {[
            { key: "all", label: "All Drivers", count: stats.total },
            { key: "assigned", label: "Assigned ✅", count: stats.assigned },
            { key: "unassigned", label: "Free Drivers", count: stats.unassigned },
            { key: "history", label: "History ⏳", count: stats.history },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`flex items-center gap-2 px-6 py-3 text-sm font-medium transition-all relative min-w-max ${filter === tab.key ? "text-blue-600 bg-white" : "text-gray-500 hover:text-gray-700 hover:bg-gray-100/50"}`}
            >
              {tab.label}
              <span className={`px-2 py-0.5 rounded-full text-[10px] ${filter === tab.key ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-600"}`}>
                {tab.count}
              </span>
              {filter === tab.key && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600" />}
            </button>
          ))}
        </div>

        {/* Table Header */}
        <div className="grid gap-4 px-6 py-3 bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase" style={{ gridTemplateColumns: filter === "history" ? "2.5fr 2.5fr 1.5fr 1.5fr 1fr" : "2.5fr 2.5fr 1.5fr 1fr 1.5fr" }}>
          <span>{filter === "history" ? "Driver Name" : "Driver Info"}</span>
          <span>{filter === "history" ? "Past Car" : "Assigned Car"}</span>
          <span>Assigned At</span>
          <span>{filter === "history" ? "Unassigned At" : "Status"}</span>
          <span className="text-center">{filter === "history" ? "ID" : "Actions"}</span>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600" />
          </div>
        )}

        {/* Empty */}
        {!loading && displayed.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <FaUser className="text-5xl text-gray-200" />
            <p className="text-sm text-gray-400">{search ? "Koi driver nahi mila" : "Koi driver nahi mila"}</p>
          </div>
        )}

        {/* Rows */}
        {!loading && displayed.map((item, i) => {
          if (filter === "history") {
            return (
              <div
                key={item._id}
                className="grid gap-4 px-6 py-4 border-b border-gray-100 hover:bg-gray-50 transition-all items-center"
                style={{ gridTemplateColumns: "2.5fr 2.5fr 1.5fr 1.5fr 1fr", backgroundColor: i % 2 === 0 ? "#FFFFFF" : "#F9FAFB" }}
              >
                {/* Driver */}
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center border border-gray-200 shrink-0">
                    <FaUser className="text-gray-400 text-xs" />
                  </div>
                  <div>
                    <p className="font-medium text-sm text-gray-900">{item.driverName}</p>
                    <p className="text-[10px] text-gray-500">{item.driverPhone}</p>
                  </div>
                </div>

                {/* Car */}
                <div className="flex items-center gap-3 text-gray-600">
                  <FaCar className="text-xs" />
                  <div>
                    <p className="font-medium text-sm">{item.carNumber}</p>
                    <p className="text-[10px]">{item.carModel}</p>
                  </div>
                </div>

                {/* Assigned At */}
                <span className="text-xs text-gray-500">
                  {item.assignedAt ? new Date(item.assignedAt).toLocaleDateString("en-IN") : "—"}
                </span>

                {/* Unassigned At */}
                <span className="text-xs text-red-500 font-medium">
                  {item.unassignedAt ? new Date(item.unassignedAt).toLocaleDateString("en-IN") : "—"}
                </span>

                {/* ID Snapshot */}
                <span className="text-[10px] font-mono text-gray-400 text-center truncate px-2" title={item._id}>
                  {item._id.slice(-6)}
                </span>
              </div>
            );
          }

          const d = item;
          const assignment = assignmentsByDriverId[d._id];
          const hasCar = !!assignment;
          return (
            <div
              key={d._id}
              className="grid gap-4 px-6 py-4 border-b border-gray-100 hover:bg-gray-50 transition-all items-center"
              style={{ gridTemplateColumns: "2.5fr 2.5fr 1.5fr 1fr 1.5fr", backgroundColor: i % 2 === 0 ? "#FFFFFF" : "#F9FAFB" }}
            >
              {/* Driver */}
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center border border-blue-200 shrink-0">
                  <FaUser className="text-blue-500 text-sm" />
                </div>
                <div>
                  <p className="font-semibold text-sm text-gray-900">{d.name}</p>
                  <p className="text-xs text-gray-500">{d.phone}</p>
                </div>
              </div>

              {/* Car */}
              <div className="flex items-center gap-3">
                {hasCar ? (
                  <>
                    <div className="w-9 h-9 rounded-lg bg-green-50 flex items-center justify-center border border-green-100 shrink-0">
                      <FaCar className="text-green-500 text-sm" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-gray-900">{assignment.carNumber || assignment.carId?.carNumber}</p>
                      <p className="text-xs text-gray-500">{assignment.carModel || assignment.carId?.carModel}</p>
                    </div>
                  </>
                ) : (
                  <span className="text-xs text-gray-400 italic">No car assigned</span>
                )}
              </div>

              {/* Assigned At */}
              <div>
                <p className="text-xs text-gray-600">
                  {assignment?.assignedAt ? new Date(assignment.assignedAt).toLocaleDateString("en-IN") : "—"}
                </p>
              </div>

              {/* Status */}
              <div>
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide inline-block ${hasCar ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                  {hasCar ? "Assigned" : "Free"}
                </span>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-center gap-2">
                {hasCar ? (
                  <>
                    <button
                      onClick={() => setViewAssignment(assignment)}
                      className="p-1.5 rounded-lg border border-blue-100 hover:bg-blue-50 text-blue-600 transition-all group"
                      title="Details Dekho"
                    >
                      <Eye size={15} />
                    </button>
                    <button
                      onClick={() => handleUnassign(assignment._id, d.name)}
                      className="p-1.5 rounded-lg border border-red-100 hover:bg-red-50 text-red-500 transition-all group"
                      title="Unassign Karo"
                    >
                      <Unlink size={15} />
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => { setPreSelectedDriver(d._id); setShowAssignModal(true); }}
                    className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-600 hover:text-white transition-all text-xs font-semibold border border-blue-100"
                  >
                    <FaLink size={10} /> Assign Car
                  </button>
                )}
              </div>
            </div>
          );
        })}

        {/* Pagination */}
        {!loading && filtered.length > 0 && (
          <div className="px-6 py-4 border-t bg-gray-50/50 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-500">
                Showing <span className="font-semibold text-gray-900">{Math.min(filtered.length, (currentPage - 1) * itemsPerPage + 1)}–{Math.min(filtered.length, currentPage * itemsPerPage)}</span> of <span className="font-semibold text-gray-900">{filtered.length}</span>
              </span>
              <select
                value={itemsPerPage}
                onChange={e => setItemsPerPage(Number(e.target.value))}
                className="text-sm border rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-white"
              >
                {[10, 20, 50, 100].map(v => <option key={v} value={v}>{v} per page</option>)}
              </select>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => setCurrentPage(1)} disabled={currentPage === 1} className="p-2 rounded-lg border hover:bg-white disabled:opacity-30 transition-all">
                <ChevronsLeft size={15} />
              </button>
              <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-2 rounded-lg border hover:bg-white disabled:opacity-30 transition-all">
                <ChevronLeft size={15} />
              </button>
              <div className="flex items-center gap-1 mx-2">
                {[...Array(totalPages)].map((_, idx) => {
                  const page = idx + 1;
                  if (page === 1 || page === totalPages || (page >= currentPage - 1 && page <= currentPage + 1)) {
                    return (
                      <button key={page} onClick={() => setCurrentPage(page)}
                        className={`w-8 h-8 rounded-lg text-sm font-medium transition-all ${currentPage === page ? "bg-blue-600 text-white" : "border border-gray-200 hover:bg-white"}`}>
                        {page}
                      </button>
                    );
                  }
                  if (page === 2 || page === totalPages - 1) return <span key={page} className="text-gray-400">...</span>;
                  return null;
                })}
              </div>
              <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="p-2 rounded-lg border hover:bg-white disabled:opacity-30 transition-all">
                <ChevronRight size={15} />
              </button>
              <button onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages} className="p-2 rounded-lg border hover:bg-white disabled:opacity-30 transition-all">
                <ChevronsRight size={15} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <AssignModal
        isOpen={showAssignModal}
        onClose={() => setShowAssignModal(false)}
        onAssign={handleAssign}
        drivers={drivers}
        cars={cars}
        assignments={assignments}
        themeColors={themeColors}
        preSelectedDriverId={preSelectedDriver}
      />
      <AssignmentDetailModal
        assignment={viewAssignment}
        onClose={() => setViewAssignment(null)}
      />
    </div>
  );
}