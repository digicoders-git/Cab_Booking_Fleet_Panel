import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useTheme } from "../context/ThemeContext";
import { useFont } from "../context/FontContext";
import { driversApi } from "../api/driversApi";
import { toast } from "sonner";
import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";
import {
  FaUser, FaPlus, FaEdit, FaTrash, FaEye, FaSync,
  FaSearch, FaTimes, FaCheckCircle, FaClock,
  FaExclamationTriangle, FaChartPie, FaChartBar,
  FaIdCard, FaMapMarkerAlt, FaPhoneAlt, FaEnvelope, FaImage
} from "react-icons/fa";
import { Eye, Pencil, Trash2, Plus, Search, X, CheckCircle, Clock, AlertTriangle, Filter, Database, Menu, Grid, List as ListIcon, ShieldCheck, Mail, Phone, MapPin, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Calendar, User } from "lucide-react";
import Swal from "sweetalert2";

// Chart Colors
const CHART_COLORS = {
  primary: '#3B82F6',
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  purple: '#8B5CF6',
  gray: '#94A3B8'
};

// ─────────────────────────────────────────────
// UI Components
// ─────────────────────────────────────────────
const ChartCard = ({ title, subtitle, icon: Icon, children }) => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 hover:shadow-lg transition-all">
    <div className="flex items-center justify-between mb-4">
      <div>
        <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
        <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
      </div>
      <div className="p-2 bg-blue-50 rounded-lg">
        <Icon className="text-blue-600" size={16} />
      </div>
    </div>
    {children}
  </div>
);

const StatBox = ({ label, value, icon: Icon, color }) => (
  <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-lg transition-all">
    <div className="flex items-center gap-3">
      <div className={`p-3 rounded-xl bg-${color}-50 text-${color}-600`}>
        <Icon size={18} />
      </div>
      <div>
        <p className="text-xs font-medium text-gray-500 uppercase">{label}</p>
        <p className="text-xl font-bold text-gray-900">{value}</p>
      </div>
    </div>
  </div>
);

// ─────────────────────────────────────────────
// Forms & Modals
// ─────────────────────────────────────────────
const DriverFormModal = ({ isOpen, onClose, onSave, editDriver, themeColors }) => {
  const emptyForm = {
    name: "", email: "", phone: "", password: "",
    licenseNumber: "", licenseExpiry: "",
    address: "", city: "", state: "", pincode: "", image: null
  };
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [imgPreview, setImgPreview] = useState(null);

  useEffect(() => {
    if (editDriver) {
      setForm({
        name: editDriver.name || "",
        email: editDriver.email || "",
        phone: editDriver.phone || "",
        password: "", // Keep empty for edit unless user wants to update
        licenseNumber: editDriver.licenseNumber || "",
        licenseExpiry: editDriver.licenseExpiry ? editDriver.licenseExpiry.slice(0, 10) : "",
        address: editDriver.address || "",
        city: editDriver.city || "",
        state: editDriver.state || "",
        pincode: editDriver.pincode || "",
        image: null
      });
      setImgPreview(editDriver.image ? `http://localhost:5000/uploads/${editDriver.image}` : null);
    } else {
      setForm(emptyForm);
      setImgPreview(null);
    }
  }, [editDriver, isOpen]);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "image" && files.length > 0) {
      setForm(prev => ({ ...prev, image: files[0] }));
      setImgPreview(URL.createObjectURL(files[0]));
    } else {
      setForm(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // ─────────────────────────────────────────────
    // CLIENT SIDE VALIDATION
    // ─────────────────────────────────────────────
    if (form.name.trim().length < 3) {
      return Swal.fire({ icon: "error", title: "Invalid Name", text: "Name kam se kam 3 characters ka hona chahiye!" });
    }
    if (!/^\d{10}$/.test(form.phone)) {
      return Swal.fire({ icon: "error", title: "Invalid Phone", text: "Kripya valid 10-digit mobile number bharein!" });
    }
    if (!form.licenseNumber || form.licenseNumber.length < 5) {
      return Swal.fire({ icon: "error", title: "Invalid License", text: "License Number sahi se dalo bhai (min 5 chars)!" });
    }
    if (!editDriver && !form.password) {
      return Swal.fire({ icon: "error", title: "Password Required", text: "Naye driver ke liye password bharna zaroori hai!" });
    }

    setSaving(true);
    
    const formData = new FormData();
    Object.keys(form).forEach(key => {
      // Don't send empty password if editing
      if (editDriver && key === "password" && !form[key]) return;
      if (form[key] !== null && form[key] !== "") {
        formData.append(key, form[key]);
      }
    });

    try {
      await onSave(formData);
      onClose();
    } catch (err) {
      // Error handled by parent
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  const inputStyle = {
    backgroundColor: themeColors.background,
    color: themeColors.text,
    borderColor: themeColors.border,
  };

  const renderField = ({ label, name, type = "text", required = false }) => (
    <div key={name}>
      <label className="block text-xs font-medium mb-1" style={{ color: themeColors.text }}>
        {label} {required && <span style={{ color: themeColors.danger }}>*</span>}
      </label>
      <input
        type={type}
        name={name}
        value={type !== "file" ? form[name] : undefined}
        onChange={handleChange}
        required={required}
        accept={type === "file" ? "image/*" : undefined}
        className="w-full p-2.5 rounded-lg border text-sm focus:outline-none transition-all"
        style={inputStyle}
        placeholder={`Enter ${label}`}
      />
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }} onClick={onClose}>
      <div className="relative w-full max-w-2xl rounded-2xl shadow-2xl border overflow-hidden" style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border }} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b bg-blue-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 rounded-lg shadow-blue-200 shadow-md">
              <Plus className="text-white" size={20} />
            </div>
            <h2 className="text-lg font-bold text-gray-900">{editDriver ? "✏️ Edit Driver" : "👤 Add New Driver"}</h2>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex justify-center items-center hover:bg-red-50 hover:text-red-500 transition-all">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[75vh]">
          {imgPreview && (
            <div className="mb-4 flex justify-center">
              <img src={imgPreview} alt="Preview" className="w-24 h-24 object-cover rounded-full border-4 border-white shadow-lg" />
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {renderField({ label: "Full Name", name: "name", required: true })}
            {renderField({ label: "Email", name: "email", type: "email", required: true })}
            {renderField({ label: "Phone", name: "phone", required: true })}
            {renderField({ label: "Password", name: "password", type: "password", required: !editDriver })}
            {renderField({ label: "License Number", name: "licenseNumber", required: true })}
            {renderField({ label: "License Expiry", name: "licenseExpiry", type: "date", required: true })}
            {renderField({ label: "Address", name: "address" })}
            {renderField({ label: "City", name: "city" })}
            {renderField({ label: "State", name: "state" })}
            {renderField({ label: "Pincode", name: "pincode" })}
            <div className="sm:col-span-2">
               {renderField({ label: "Profile Image", name: "image", type: "file" })}
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl border font-medium text-sm text-gray-700 hover:bg-gray-50">Cancel</button>
            <button type="submit" disabled={saving} className="flex-1 py-2.5 rounded-xl font-medium text-sm text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50">
              {saving ? "Saving..." : (editDriver ? "Update Driver" : "Save Driver")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const DriverDetailModal = ({ driverId, onClose, themeColors }) => {
  const [driver, setDriver] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (driverId) {
      setLoading(true);
      driversApi.getDriverById(driverId)
        .then(res => setDriver(res.driver || res.data))
        .catch(err => toast.error("Could not load details"))
        .finally(() => setLoading(false));
    } else {
      setDriver(null);
    }
  }, [driverId]);

  if (!driverId) return null;

  const Row = ({ label, value, icon: Icon, valueColor }) => (
    <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50/50 border border-gray-100 hover:bg-white transition-all">
      <div className="flex items-center gap-3">
        {Icon && <div className="p-2 rounded-lg bg-blue-50 text-blue-600"><Icon size={14} /></div>}
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{label}</span>
      </div>
      <span className="font-bold text-sm" style={{ color: valueColor || "#1F2937" }}>{value || "—"}</span>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="relative w-full max-w-2xl rounded-2xl shadow-2xl bg-white border border-gray-100 overflow-hidden" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b bg-blue-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 rounded-lg shadow-blue-200 shadow-md">
              <User className="text-white" size={20} />
            </div>
            <h2 className="text-lg font-bold text-gray-900">Driver Details</h2>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex justify-center items-center hover:bg-red-50 hover:text-red-500 transition-all">
            <X size={18} />
          </button>
        </div>

        {loading ? (
          <div className="p-20 flex justify-center"><div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-600" /></div>
        ) : driver ? (
          <div className="p-6 overflow-y-auto max-h-[80vh]">
            <div className="flex flex-col md:flex-row gap-6 mb-8 items-center bg-gray-50/50 p-6 rounded-2xl border border-gray-100">
               <div className="w-32 h-32 rounded-2xl bg-white shadow-sm border p-1 shrink-0 overflow-hidden">
                {driver.image ? 
                  <img src={`http://localhost:5000/uploads/${driver.image}`} alt={driver.name} className="w-full h-full object-cover rounded-xl" /> 
                  : <div className="w-full h-full flex items-center justify-center bg-blue-50 text-blue-200"><User size={48} /></div>
                }
               </div>
               <div className="text-center md:text-left">
                 <h3 className="text-2xl font-bold text-gray-900">{driver.name}</h3>
                 <p className="text-blue-600 font-medium flex items-center justify-center md:justify-start gap-2 mt-1">
                   {driver.email}
                 </p>
                 <div className="flex gap-2 mt-3 flex-wrap justify-center md:justify-start">
                   <span className={`px-3 py-1 rounded-full text-[10px] font-bold tracking-wide uppercase ${driver.isApproved ? "bg-green-100 text-green-600" : "bg-orange-100 text-orange-600"}`}>
                     {driver.isApproved ? "Approved" : "Pending Approval"}
                   </span>
                   <span className={`px-3 py-1 rounded-full text-[10px] font-bold tracking-wide uppercase ${driver.isActive ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-600"}`}>
                     {driver.isActive ? "Active" : "Inactive"}
                   </span>
                 </div>
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1">Basic Info</h4>
                <Row label="Phone" value={driver.phone} icon={Phone} />
                <Row label="Joined On" value={new Date(driver.createdAt).toLocaleDateString('en-IN')} icon={Calendar} />
              </div>
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1">License & Location</h4>
                <Row label="License No" value={driver.licenseNumber} icon={ShieldCheck} />
                <Row label="License Expiry" value={driver.licenseExpiry ? new Date(driver.licenseExpiry).toLocaleDateString('en-IN') : "N/A"} icon={AlertTriangle} />
              </div>
              <div className="md:col-span-2 space-y-4">
                 <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1">Address</h4>
                 <Row label="Full Address" value={`${driver.address || ""}, ${driver.city || ""}, ${driver.state || ""} - ${driver.pincode || ""}`} icon={MapPin} />
              </div>
            </div>
          </div>
        ) : (
          <div className="p-20 text-center text-gray-500">Driver not found.</div>
        )}
      </div>
    </div>
  );
};

const DeleteModal = ({ driver, onClose, onConfirm, deleting }) => {
  if (!driver) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }} onClick={onClose}>
      <div className="w-full max-w-sm rounded-2xl shadow-xl overflow-hidden bg-white text-center p-6 border border-gray-200" onClick={e => e.stopPropagation()}>
        <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
          <FaTrash className="text-2xl text-red-600" />
        </div>
        <h3 className="text-lg font-bold mb-2 text-gray-900">Delete Driver?</h3>
        <p className="text-sm mb-6 text-gray-600">
          <strong className="text-gray-900">{driver.name}</strong> will be permanently deleted.
        </p>
        <div className="flex gap-3">
          <button onClick={onClose} disabled={deleting} className="flex-1 py-2 rounded-lg font-medium border border-gray-300 hover:bg-gray-50 text-gray-700 transition-all">Cancel</button>
          <button onClick={onConfirm} disabled={deleting} className="flex-1 py-2 rounded-lg font-medium bg-red-600 hover:bg-red-700 text-white transition-all disabled:opacity-50">
            {deleting ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────
export default function ManageDrivers() {
  const { themeColors } = useTheme();
  const { currentFont } = useFont();

  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  const [showForm, setShowForm] = useState(false);
  const [editDriver, setEditDriver] = useState(null);
  const [deleteDriver, setDeleteDriver] = useState(null);
  const [viewDriverId, setViewDriverId] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Reset page
  useEffect(() => {
    setCurrentPage(1);
  }, [search, filter, itemsPerPage]);

  // Fetch API
  const fetchDriversData = useCallback(async () => {
    setLoading(true);
    try {
      // By default getting all drivers. We can filter locally based on `filter` state to avoid too many requests.
      const data = await driversApi.getAllDrivers();
      setDrivers(data?.drivers || data?.data || []);
    } catch (err) {
      toast.error(err?.message || "Failed to load drivers");
      setDrivers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDriversData();
  }, [fetchDriversData]);

  // Handlers
  const handleCreate = async (formData) => {
    try {
      const res = await driversApi.createDriver(formData);
      if (res.success === false) throw new Error(res.message || "Create failed");
      toast.success("Driver created successfully! ✅");
      fetchDriversData();
      setShowForm(false);
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Create Failed",
        text: err?.response?.data?.message || err.message || "Something went wrong!",
        confirmButtonColor: CHART_COLORS.primary,
      });
      throw err;
    }
  };

  const handleUpdate = async (formData) => {
    try {
      const res = await driversApi.updateDriver(editDriver._id, formData);
      if (res.success === false) throw new Error(res.message || "Update failed");
      toast.success("Driver updated successfully! ✏️");
      fetchDriversData();
      setShowForm(false);
      setEditDriver(null);
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Update Failed",
        text: err?.response?.data?.message || err.message || "Something went wrong!",
        confirmButtonColor: CHART_COLORS.primary,
      });
      throw err;
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await driversApi.deleteDriver(deleteDriver._id);
      if (res.success === false) throw new Error(res.message || "Delete failed");
      toast.success("Driver deleted! 🗑️");
      setDeleteDriver(null);
      fetchDriversData();
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Delete Failed",
        text: err?.message || "Could not delete",
        confirmButtonColor: CHART_COLORS.primary,
      });
    } finally {
      setDeleting(false);
    }
  };

  // Filtered List (Sorted by latest)
  const filteredDrivers = useMemo(() => {
    return drivers
      .filter(d => {
        // 1. Tab Filter
        if (filter === "pending" && (d.isApproved || d.isRejected)) return false;
        if (filter === "approved" && !d.isApproved) return false;

        // 2. Search Filter
        const q = search.toLowerCase();
        return (
          d.name?.toLowerCase().includes(q) ||
          d.email?.toLowerCase().includes(q) ||
          d.phone?.includes(q) ||
          d.licenseNumber?.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [drivers, filter, search]);

  // Pagination Logic
  const totalPages = Math.ceil(filteredDrivers.length / itemsPerPage);
  const displayedDrivers = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredDrivers.slice(start, start + itemsPerPage);
  }, [filteredDrivers, currentPage, itemsPerPage]);

  // Stats
  const stats = useMemo(() => ({
    total: drivers.length,
    approved: drivers.filter(d => d.isApproved).length,
    pending: drivers.filter(d => !d.isApproved && !d.isRejected).length,
  }), [drivers]);

  // Highcharts Config
  const statusData = [
    { name: 'Approved', value: stats.approved, color: CHART_COLORS.success },
    { name: 'Pending', value: stats.pending, color: CHART_COLORS.warning },
    { name: 'Rejected', value: drivers.filter(d => d.isRejected).length, color: CHART_COLORS.danger }
  ].filter(i => i.value > 0);

  const cityMap = {};
  drivers.forEach(d => {
    if (d.city) cityMap[d.city] = (cityMap[d.city] || 0) + 1;
  });
  const cityData = Object.entries(cityMap).map(([name, count]) => ({ name, count }));

  const pieOptions = {
    chart: { type: 'pie', height: 220, style: { fontFamily: currentFont.family }, margin: [0, 0, 0, 0] },
    title: { text: null },
    tooltip: { pointFormat: '{point.name}: <b>{point.y}</b> Drivers' },
    plotOptions: { pie: { innerRadius: '60%', size: '100%', dataLabels: { enabled: false }, showInLegend: true } },
    series: [{ name: 'Status', colorByPoint: true, data: statusData.map(d => ({ name: d.name, y: d.value, color: d.color })) }],
    legend: { enabled: true, layout: 'vertical', align: 'right', verticalAlign: 'middle' },
    credits: { enabled: false },
    exporting: { enabled: false }
  };

  const barOptions = {
    chart: { type: 'column', height: 220, style: { fontFamily: currentFont.family }, margin: [10, 10, 30, 30] },
    title: { text: null },
    xAxis: { categories: cityData.map(d => d.name) },
    yAxis: { title: { text: null }, allowDecimals: false },
    legend: { enabled: false },
    tooltip: { pointFormat: 'Total: <b>{point.y}</b> Drivers' },
    plotOptions: { column: { borderRadius: 4, color: CHART_COLORS.primary } },
    series: [{ name: 'Drivers By City', data: cityData.map(d => d.count) }],
    credits: { enabled: false },
    exporting: { enabled: false }
  };

  const getStatusBadge = (d) => {
    if (d.isApproved) return { label: "Approved", color: "#10B981" };
    if (d.isRejected) return { label: "Rejected", color: "#EF4444" };
    return { label: "Pending", color: "#F59E0B" };
  };

  return (
    <div className="space-y-6 p-6 bg-gray-50 min-h-screen" style={{ fontFamily: currentFont.family }}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2 text-gray-900">
            <FaUser className="text-blue-600" />
            Manage Drivers
          </h1>
          <p className="text-sm text-gray-500 mt-1">Total {drivers.length} drivers in fleet</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchDriversData} className="p-2 rounded-lg border hover:bg-gray-50 transition-all text-gray-600" title="Refresh">
            <FaSync />
          </button>
          <button onClick={() => { setEditDriver(null); setShowForm(true); }} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all">
            <FaPlus /> Add New Driver
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatBox label="Total Drivers" value={stats.total} icon={FaUser} color="blue" />
        <StatBox label="Approved" value={stats.approved} icon={FaCheckCircle} color="green" />
        <StatBox label="Pending" value={stats.pending} icon={FaClock} color="orange" />
        <StatBox label="Rejected" value={drivers.filter(d=>d.isRejected).length} icon={FaExclamationTriangle} color="red" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Driver Status" subtitle="Approval Distribution" icon={FaChartPie}>
          <HighchartsReact highcharts={Highcharts} options={pieOptions} />
        </ChartCard>
        <ChartCard title="Drivers by City" subtitle="City-wise distribution" icon={FaChartBar}>
          <HighchartsReact highcharts={Highcharts} options={barOptions} />
        </ChartCard>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-3 p-4 bg-white rounded-xl border border-gray-200">
        <div className="relative flex-1">
          <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={12} />
          <input
            type="text"
            placeholder="Search by name, email, phone, license..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
          {search && <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2"><FaTimes className="text-xs text-gray-400" /></button>}
        </div>
        <div className="flex gap-2">
          {/* Tabs moved to table header */}
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {/* Table Tabs */}
        <div className="flex border-b border-gray-200 overflow-x-auto bg-gray-50/30">
          {[
            { key: "all", label: "All Drivers", count: stats.total, color: "blue" },
            { key: "approved", label: "Approved", count: stats.approved, color: "green" },
            { key: "pending", label: "Pending", count: stats.pending, color: "orange" }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`flex items-center gap-2 px-6 py-3 text-sm font-medium transition-all relative min-w-max ${filter === tab.key
                ? "text-blue-600 bg-white"
                : "text-gray-500 hover:text-gray-700 hover:bg-gray-100/50"
              }`}
            >
              {tab.label}
              <span className={`px-2 py-0.5 rounded-full text-[10px] ${filter === tab.key ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-600"
              }`}>
                {tab.count}
              </span>
              {filter === tab.key && (
                <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600" />
              )}
            </button>
          ))}
        </div>
        <div className="min-w-[900px]">
          <div className="px-6 py-3 border-b bg-gray-50 text-xs font-semibold text-gray-500 uppercase grid gap-4 items-center" style={{ gridTemplateColumns: "2.5fr 1.5fr 1.5fr 1fr 1fr 1.5fr" }}>
            <span>Driver Info</span>
            <span>Contact</span>
            <span>License / Location</span>
            <span>Status</span>
            <span>Registered</span>
            <span className="text-center">Actions</span>
          </div>

          {loading && <div className="flex justify-center py-16"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600" /></div>}
          
          {!loading && displayedDrivers.length === 0 && (
            <div className="text-center py-16 text-gray-500 text-sm">No drivers found matching criteria.</div>
          )}

          {!loading && displayedDrivers.map((d, i) => {
            const badge = getStatusBadge(d);
            return (
              <div key={d._id} className="px-6 py-4 border-b grid gap-4 items-center hover:bg-gray-50 transition-all" style={{ gridTemplateColumns: "2.5fr 1.5fr 1.5fr 1fr 1fr auto", backgroundColor: i % 2 === 0 ? '#FFFFFF' : '#F9FAFB' }}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center overflow-hidden shrink-0 border border-blue-200">
                    {d.image ? <img src={`http://localhost:5000/uploads/${d.image}`} alt={d.name} className="w-full h-full object-cover" /> : <FaUser className="text-blue-500" />}
                  </div>
                  <div>
                    <p className="font-bold text-sm text-gray-900">{d.name}</p>
                    <p className="text-xs text-gray-500">{d.email}</p>
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-800 flex items-center gap-1.5"><FaPhoneAlt size={10} className="text-gray-400"/> {d.phone}</p>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-800 flex items-center gap-1.5"><FaIdCard size={12} className="text-gray-400"/> {d.licenseNumber || 'N/A'}</p>
                  <p className="text-xs text-gray-500 flex items-center gap-1.5 mt-0.5"><FaMapMarkerAlt size={10} className="text-gray-400"/> {d.city || 'N/A'}{d.state ? `, ${d.state}` : ''}</p>
                </div>

                <div>
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide" style={{ backgroundColor: badge.color + '15', color: badge.color }}>
                    {badge.label}
                  </span>
                </div>

                <div>
                  <p className="text-xs text-gray-600">{new Date(d.createdAt).toLocaleDateString('en-IN')}</p>
                </div>

                <div className="flex items-center justify-center gap-2">
                  <button onClick={() => setViewDriverId(d._id)} className="p-1.5 rounded-lg border border-blue-100 hover:bg-blue-50 text-blue-600 transition-all group" title="View Details">
                    <Eye size={16} className="group-hover:scale-110 transition-transform" />
                  </button>
                  <button onClick={() => { setEditDriver(d); setShowForm(true); }} className="p-1.5 rounded-lg border border-orange-100 hover:bg-orange-50 text-orange-600 transition-all group" title="Edit">
                    <Pencil size={16} className="group-hover:scale-110 transition-transform" />
                  </button>
                  <button onClick={() => setDeleteDriver(d)} className="p-1.5 rounded-lg border border-red-100 hover:bg-red-50 text-red-600 transition-all group" title="Delete">
                    <Trash2 size={16} className="group-hover:scale-110 transition-transform" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Pagination Footer */}
        {!loading && filteredDrivers.length > 0 && (
          <div className="px-6 py-4 border-t bg-gray-50/50 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-500">
                Showing <span className="font-semibold text-gray-900">{Math.min(filteredDrivers.length, (currentPage - 1) * itemsPerPage + 1)}-{Math.min(filteredDrivers.length, currentPage * itemsPerPage)}</span> of <span className="font-semibold text-gray-900">{filteredDrivers.length}</span> drivers
              </span>
              <select
                value={itemsPerPage}
                onChange={(e) => setItemsPerPage(Number(e.target.value))}
                className="text-sm border rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-white"
              >
                {[10, 20, 50, 100].map(val => (
                  <option key={val} value={val}>{val} per page</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1">
              <button onClick={() => setCurrentPage(1)} disabled={currentPage === 1} className="p-2 rounded-lg border hover:bg-white disabled:opacity-30 transition-all">
                <ChevronsLeft size={16} />
              </button>
              <button onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} disabled={currentPage === 1} className="p-2 rounded-lg border hover:bg-white disabled:opacity-30 transition-all">
                <ChevronLeft size={16} />
              </button>

              <div className="flex items-center gap-1 mx-2">
                {[...Array(totalPages)].map((_, idx) => {
                  const page = idx + 1;
                  if (page === 1 || page === totalPages || (page >= currentPage - 1 && page <= currentPage + 1)) {
                    return (
                      <button key={page} onClick={() => setCurrentPage(page)} className={`w-8 h-8 rounded-lg text-sm font-medium transition-all ${currentPage === page ? 'bg-blue-600 text-white border-blue-600' : 'border border-gray-200 hover:bg-white'}`}>
                        {page}
                      </button>
                    );
                  }
                  if (page === 2 || page === totalPages - 1) return <span key={page} className="text-gray-400">...</span>;
                  return null;
                })}
              </div>

              <button onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))} disabled={currentPage === totalPages} className="p-2 rounded-lg border hover:bg-white disabled:opacity-30 transition-all">
                <ChevronRight size={16} />
              </button>
              <button onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages} className="p-2 rounded-lg border hover:bg-white disabled:opacity-30 transition-all">
                <ChevronsRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      <DriverDetailModal
        driverId={viewDriverId}
        onClose={() => setViewDriverId(null)}
        themeColors={themeColors}
      />


      <DriverFormModal
        isOpen={showForm}
        onClose={() => { setShowForm(false); setEditDriver(null); }}
        onSave={editDriver ? handleUpdate : handleCreate}
        editDriver={editDriver}
        themeColors={themeColors}
      />

      <DeleteModal
        driver={deleteDriver}
        onClose={() => setDeleteDriver(null)}
        onConfirm={handleDelete}
        deleting={deleting}
      />
    </div>
  );
}
