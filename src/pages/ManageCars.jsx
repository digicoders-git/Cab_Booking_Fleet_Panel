// src/pages/ManageCars.jsx
import { useState, useEffect, useCallback, useMemo } from "react";
import { useTheme } from "../context/ThemeContext";
import { useFont } from "../context/FontContext";
import { carsApi } from "../api/carsApi";
import { toast } from "sonner";
import Swal from "sweetalert2";
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import {
  FaCar, FaPlus, FaEdit, FaTrash, FaEye, FaSync,
  FaSearch, FaTimes, FaCheckCircle, FaClock,
  FaExclamationTriangle, FaShieldAlt, FaCalendarAlt,
  FaFilter, FaChartPie, FaChartBar, FaChartLine,
  FaUsers, FaMoneyBillWave, FaTachometerAlt, FaChair,
  FaImage, FaTag, FaGasPump, FaCogs, FaWrench,
  FaUser, FaEnvelope, FaPhone
} from "react-icons/fa";
import { Eye, Pencil, Trash2, Plus, Search, X, CheckCircle, Clock, AlertTriangle, Filter, Database, Menu, Grid, List as ListIcon, ShieldCheck, Mail, Phone, MapPin, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";

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

// ─────────────────────────────────────────────
// StatBox Component
// ─────────────────────────────────────────────
const StatBox = ({ label, value, icon: Icon, color }) => (
  <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-lg transition-all">
    <div className="flex items-center gap-3">
      <div className="p-3 rounded-lg" style={{ backgroundColor: color + '15' }}>
        <Icon className="text-lg" style={{ color }} />
      </div>
      <div>
        <p className="text-xs font-medium text-gray-500 uppercase">{label}</p>
        <p className="text-xl font-bold text-gray-900">{value}</p>
      </div>
    </div>
  </div>
);

// ─────────────────────────────────────────────
// Create / Edit Modal
// ─────────────────────────────────────────────
const CarFormModal = ({ isOpen, onClose, onSave, editCar, themeColors, categories = [] }) => {
  const emptyForm = {
    carNumber: "", carModel: "", carBrand: "", carType: "",
    carColor: "", manufacturingYear: "", insuranceExpiry: "",
    permitExpiry: "", pucExpiry: "", lastServiceDate: "", nextServiceDate: "",
    image: null,
  };
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [imgPreview, setImgPreview] = useState(null);

  useEffect(() => {
    if (editCar) {
      setForm({
        carNumber: editCar.carNumber || "",
        carModel: editCar.carModel || "",
        carBrand: editCar.carBrand || "",
        carType: editCar.carType?._id || editCar.carType || "",
        carColor: editCar.carColor || "",
        manufacturingYear: editCar.manufacturingYear || "",
        insuranceExpiry: editCar.insuranceExpiry ? editCar.insuranceExpiry.slice(0, 10) : "",
        permitExpiry: editCar.permitExpiry ? editCar.permitExpiry.slice(0, 10) : "",
        pucExpiry: editCar.pucExpiry ? editCar.pucExpiry.slice(0, 10) : "",
        lastServiceDate: editCar.lastServiceDate ? editCar.lastServiceDate.slice(0, 10) : "",
        nextServiceDate: editCar.nextServiceDate ? editCar.nextServiceDate.slice(0, 10) : "",
        image: null,
      });
      setImgPreview(editCar.image ? `http://localhost:5000/uploads/${editCar.image}` : null);
    } else {
      setForm(emptyForm);
      setImgPreview(null);
    }
  }, [editCar, isOpen]);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "image" && files && files.length > 0) {
      setForm((prev) => ({ ...prev, image: files[0] }));
      setImgPreview(URL.createObjectURL(files[0]));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // ─────────────────────────────────────────────
    // CLIENT SIDE VALIDATION
    // ─────────────────────────────────────────────
    const year = Number(form.manufacturingYear);
    const currYear = new Date().getFullYear();

    if (form.carNumber.length < 5) {
      return Swal.fire({ icon: "error", title: "Invalid Car Number", text: "Car Number kam se kam 5 characters ka hona chahiye!" });
    }
    if (!form.carType) {
      return Swal.fire({ icon: "error", title: "Missing Car Type", text: "Kripya 'Car Type' (Category) select karein!" });
    }
    if (year && (year < 2000 || year > currYear + 1)) {
      return Swal.fire({ icon: "error", title: "Invalid Year", text: `Manufacturing Year 2000 aur ${currYear + 1} ke bich hona chahiye!` });
    }

    setSaving(true);
    try {
      // Build FormData to support image upload (multipart/form-data)
      const payload = new FormData();
      Object.entries(form).forEach(([key, value]) => {
        if (key === "image") {
          if (value) payload.append("image", value);
        } else if (key === "carNumber" && editCar) {
          // skip carNumber on edit
        } else if (value !== "" && value !== null && value !== undefined) {
          payload.append(key, value);
        }
      });
      await onSave(payload);
    } catch (err) {
      // Error handled by parent with Swal
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

  const labelStyle = { color: themeColors.text };

  const renderField = ({ label, name, type = "text", required = false, disabled = false }) => (
    <div key={name}>
      <label className="block text-xs font-medium mb-1" style={labelStyle}>
        {label} {required && <span style={{ color: themeColors.danger }}>*</span>}
      </label>
      <input
        type={type}
        name={name}
        value={form[name]}
        onChange={handleChange}
        required={required}
        disabled={disabled}
        className="w-full p-2.5 rounded-lg border text-sm focus:outline-none transition-all"
        style={{ ...inputStyle, opacity: disabled ? 0.6 : 1 }}
        placeholder={label}
      />
    </div>
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl rounded-2xl shadow-2xl border overflow-hidden"
        style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="flex items-center justify-between px-6 py-4 border-b"
          style={{ borderColor: themeColors.border, backgroundColor: themeColors.primary + "10" }}
        >
          <div className="flex items-center gap-3">
            <FaCar style={{ color: themeColors.primary }} className="text-xl" />
            <h2 className="text-lg font-bold" style={{ color: themeColors.text }}>
              {editCar ? "✏️ Car Update Karo" : "🚗 Nayi Car Add Karo"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center border hover:rotate-90 transition-all duration-300"
            style={{ color: themeColors.text, backgroundColor: themeColors.background, borderColor: themeColors.border }}
          >
            <FaTimes className="text-sm" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[75vh]">
          {/* Car Image Preview */}
          {imgPreview && (
            <div className="mb-4 flex justify-center">
              <img src={imgPreview} alt="Car Preview" className="w-32 h-24 object-cover rounded-xl border-4 border-white shadow-lg" />
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {renderField({ label: "Car Number", name: "carNumber", required: true, disabled: !!editCar })}
            {renderField({ label: "Car Model", name: "carModel", required: true })}
            {renderField({ label: "Car Brand", name: "carBrand" })}
            <div>
              <label className="block text-xs font-medium mb-1" style={labelStyle}>
                Car Type <span style={{ color: themeColors.danger }}>*</span>
              </label>
              <select
                name="carType"
                value={form.carType}
                onChange={handleChange}
                required
                className="w-full p-2.5 rounded-lg border text-sm focus:outline-none transition-all"
                style={inputStyle}
              >
                <option value="" disabled>-- Select Category --</option>
                {categories.map((cat) => (
                  <option key={cat._id} value={cat._id}>
                    {cat.name} ({cat.seatCapacity} seats - ₹{cat.baseFare})
                  </option>
                ))}
              </select>
            </div>
            {renderField({ label: "Car Color", name: "carColor" })}
            {renderField({ label: "Manufacturing Year", name: "manufacturingYear", type: "number" })}
            {renderField({ label: "Insurance Expiry", name: "insuranceExpiry", type: "date" })}
            {renderField({ label: "Permit Expiry", name: "permitExpiry", type: "date" })}
            {renderField({ label: "PUC Expiry", name: "pucExpiry", type: "date" })}
            {renderField({ label: "Last Service Date", name: "lastServiceDate", type: "date" })}
            {renderField({ label: "Next Service Date", name: "nextServiceDate", type: "date" })}
            {/* Car Image Upload */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium mb-1" style={labelStyle}>
                Car Image 🖼️
              </label>
              <input
                type="file"
                name="image"
                accept="image/*"
                onChange={handleChange}
                className="w-full p-2.5 rounded-lg border text-sm focus:outline-none transition-all"
                style={inputStyle}
              />
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border font-medium text-sm"
              style={{ borderColor: themeColors.border, color: themeColors.text }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-2.5 rounded-xl font-medium text-sm text-white"
              style={{ backgroundColor: themeColors.primary }}
            >
              {saving ? "Saving..." : editCar ? "Update" : "Add Car"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// Detail Modal
// ─────────────────────────────────────────────
const CarDetailModal = ({ car, onClose, themeColors, categories = [] }) => {
  if (!car) return null;

  const Row = ({ label, value, icon: Icon, valueColor }) => (
    <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50">
      {Icon && <Icon className="text-sm mt-0.5 shrink-0" style={{ color: themeColors.primary }} />}
      <div>
        <p className="text-xs text-gray-500">{label}</p>
        <p className="text-sm font-medium" style={{ color: valueColor || themeColors.text }}>{value || "—"}</p>
      </div>
    </div>
  );

  const fmtDate = (d) => d ? new Date(d).toLocaleDateString("en-IN") : "—";

  // Find category from categories array
  const category = categories.find(c => c._id === (car.carType?._id || car.carType)) || {};

  // Parse seat layout properly
  const getSeatLayout = () => {
    if (category.seatLayout && Array.isArray(category.seatLayout)) {
      return category.seatLayout.map((seat, idx) => (
        <span key={idx} className="px-2 py-1 bg-gray-100 rounded text-xs">
          {seat}
        </span>
      ));
    }
    return <span className="text-sm">{car.seatCapacity || category.seatCapacity || 4} Seats</span>;
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-3xl rounded-2xl shadow-2xl border overflow-hidden bg-white"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b bg-blue-50">
          <div className="flex items-center gap-3">
            <FaEye className="text-blue-600" />
            <h2 className="text-lg font-bold text-gray-900">Car Details: {car.carNumber}</h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center border hover:rotate-90 transition-all"
          >
            <FaTimes className="text-sm text-gray-500" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[75vh]">
          {/* Basic Info Section */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-blue-600 mb-3 pb-1 border-b">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Row label="Car Number" value={car.carNumber} icon={FaCar} />
              <Row label="Model" value={car.carModel} icon={FaCar} />
              <Row label="Brand" value={car.carBrand || "—"} icon={FaTag} />
              <Row label="Color" value={car.carColor || "—"} icon={FaTag} />
              <Row label="Year" value={car.manufacturingYear || "—"} icon={FaCalendarAlt} />
              <Row label="Added On" value={fmtDate(car.createdAt)} icon={FaCalendarAlt} />
            </div>
          </div>

          {/* Category Details */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-purple-600 mb-3 pb-1 border-b">Category Details (Populated)</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Row label="Category Name" value={category.name || "—"} icon={FaTag} />
              <Row label="Base Fare" value={`₹${category.baseFare || 0}`} valueColor="#10B981" icon={FaMoneyBillWave} />
              <Row label="Private Rate" value={`₹${category.privateRatePerKm || 0}/km`} valueColor="#10B981" />
              <Row label="Shared Rate" value={`₹${category.sharedRatePerSeatPerKm || 0}/km`} valueColor="#10B981" />
              <Row label="Seat Capacity" value={category.seatCapacity || car.seatCapacity || 4} icon={FaUsers} />
              <Row label="Avg Speed" value={`${category.avgSpeedKmH || 0} km/h`} icon={FaTachometerAlt} />
            </div>
          </div>

          {/* Seat Layout */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-green-600 mb-3 pb-1 border-b">Seat Layout</h3>
            <div className="flex flex-wrap gap-2">
              {getSeatLayout()}
            </div>
          </div>

          {/* Status Section */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-orange-600 mb-3 pb-1 border-b">Status & Performance</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <Row label="Status" value={car.isActive ? "Active" : "Inactive"} icon={FaCheckCircle} />
              <Row label="Available" value={car.isAvailable ? "Yes" : "No"} />
              <Row label="On Trip" value={car.isBusy ? "Yes" : "No"} icon={FaClock} />
              <Row label="Total Trips" value={car.totalTrips || 0} />
              <Row label="Total Earnings" value={`₹${car.totalEarnings || 0}`} valueColor="#10B981" />
            </div>
          </div>

          {/* Documents Section */}
          <div>
            <h3 className="text-sm font-semibold text-red-600 mb-3 pb-1 border-b">Documents & Expiry</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Row label="Insurance" value={fmtDate(car.insuranceExpiry)} icon={FaShieldAlt} />
              <Row label="Permit" value={fmtDate(car.permitExpiry)} icon={FaCalendarAlt} />
              <Row label="PUC" value={fmtDate(car.pucExpiry)} icon={FaGasPump} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// Delete Confirm Modal
// ─────────────────────────────────────────────
const DeleteModal = ({ car, onClose, onConfirm, themeColors, deleting }) => {
  if (!car) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-2xl shadow-2xl border p-6 text-center bg-white"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
          <FaTrash className="text-2xl text-red-600" />
        </div>
        <h3 className="text-lg font-bold mb-2 text-gray-900">Delete Car?</h3>
        <p className="text-sm mb-1 text-gray-600">
          <strong className="text-gray-900">{car.carNumber}</strong> ({car.carModel}) will be deleted.
        </p>
        <p className="text-xs mb-6 text-red-600">⚠️ Cannot delete if driver assigned!</p>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border font-medium text-sm text-gray-700"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={deleting}
            className="flex-1 py-2.5 rounded-xl font-medium text-sm text-white bg-red-600 disabled:opacity-50"
          >
            {deleting ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// Car Row Component (Expandable)
// ─────────────────────────────────────────────
const CarRow = ({ car, categories, onView, onEdit, onDelete }) => {
  const category = categories.find(c => c._id === (car.carType?._id || car.carType)) || {};

  const getStatusBadge = () => {
    if (car.isBusy) return { label: "On Trip", color: "#F59E0B" };
    if (!car.isActive) return { label: "Inactive", color: "#EF4444" };
    if (car.isAvailable) return { label: "Available", color: "#10B981" };
    return { label: "Unavailable", color: "#94A3B8" };
  };

  const badge = getStatusBadge();
  const fmtDate = (d) => d ? new Date(d).toLocaleDateString("en-IN") : "—";

  // Parse seat layout for preview
  const getLayoutPreview = () => {
    if (category.seatLayout && Array.isArray(category.seatLayout)) {
      return category.seatLayout.slice(0, 2).join(", ") + (category.seatLayout.length > 2 ? "..." : "");
    }
    return `${car.seatCapacity || category.seatCapacity || 4} Seats`;
  };

  return (
    <>
      {/* Main Row */}
      <div
        className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-gray-100 hover:bg-gray-50 transition-colors items-center"
      >
        {/* Car Info with Image */}
        <div className="col-span-2 flex items-center gap-3">
          <div className="w-12 h-10 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center overflow-hidden shrink-0">
            {car.image
              ? <img
                  src={`http://localhost:5000/uploads/${car.image}`}
                  alt={car.carNumber}
                  className="w-full h-full object-cover"
                  onError={(e) => { e.currentTarget.style.display = "none"; e.currentTarget.parentElement.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" class="text-blue-400" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/></svg>'; }}
                />
              : <FaCar className="text-blue-400 text-lg" />
            }
          </div>
          <div className="min-w-0">
            <p className="font-bold text-sm text-blue-600 truncate">{car.carNumber}</p>
            <p className="text-xs text-gray-500 truncate">{car.carModel}{car.carBrand ? ` (${car.carBrand})` : ''}</p>
          </div>
        </div>

        {/* Category */}
        <div className="col-span-2">
          <p className="font-medium text-sm text-gray-900">{category.name || "—"}</p>
          <p className="text-xs text-gray-500">{category.seatCapacity || car.seatCapacity || 4} seats</p>
        </div>

        {/* Pricing */}
        <div className="col-span-2">
          <p className="text-xs font-medium">
            <span className="text-green-600">Base: ₹{category.baseFare || 0}</span>
          </p>
          <p className="text-xs text-gray-500">Private: ₹{category.privateRatePerKm || 0}/km</p>
          <p className="text-xs text-gray-500">Shared: ₹{category.sharedRatePerSeatPerKm || 0}/km</p>
        </div>

        {/* Seat Layout Preview */}
        <div className="col-span-2">
          <p className="text-xs text-gray-700">{getLayoutPreview()}</p>
          {category.seatLayout?.length > 2 && (
            <p className="text-xs text-gray-400 mt-1">+{category.seatLayout.length - 2} more</p>
          )}
        </div>

        {/* Status Badge */}
        <div className="col-span-1">
          <span
            className="px-2 py-1 inline-block rounded-full text-[10px] font-medium"
            style={{ backgroundColor: badge.color + '15', color: badge.color }}
          >
            {badge.label}
          </span>
        </div>

        {/* Created Date */}
        <div className="col-span-1">
          <p className="text-xs text-gray-600">{fmtDate(car.createdAt)}</p>
        </div>

        <div className="col-span-2 flex items-center justify-center gap-2">
          <button
            onClick={(e) => { e.stopPropagation(); onView(car); }}
            className="p-1.5 rounded-lg border border-blue-100 hover:bg-blue-50 transition-all text-blue-600 group"
            title="View Details"
          >
            <Eye size={16} className="group-hover:scale-110 transition-transform" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onEdit(car); }}
            className="p-1.5 rounded-lg border border-orange-100 hover:bg-orange-50 transition-all text-orange-600 group"
            title="Edit"
          >
            <Pencil size={16} className="group-hover:scale-110 transition-transform" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(car); }}
            className="p-1.5 rounded-lg border border-red-100 hover:bg-red-50 transition-all text-red-600 group"
            title="Delete"
          >
            <Trash2 size={16} className="group-hover:scale-110 transition-transform" />
          </button>
        </div>
      </div>
    </>
  );
};

// ─────────────────────────────────────────────
// Main ManageCars Page
// ─────────────────────────────────────────────
export default function ManageCars() {
  const { themeColors } = useTheme();
  const { currentFont } = useFont();

  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [categories, setCategories] = useState([]);

  const [showForm, setShowForm] = useState(false);
  const [editCar, setEditCar] = useState(null);
  const [viewCar, setViewCar] = useState(null);
  const [deleteCar, setDeleteCar] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Fetch cars
  const fetchCars = useCallback(async () => {
    setLoading(true);
    try {
      const data = await carsApi.getAllCars();
      const list = data?.cars || data?.data || [];
      setCars(Array.isArray(list) ? list : []);
    } catch (err) {
      toast.error(err?.message || "Cars load nahi ho sake");
      setCars([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch categories
  const fetchCategories = useCallback(async () => {
    try {
      const data = await carsApi.getActiveCategories();
      const list = data?.categories || data?.data || [];
      setCategories(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error("Categories fetch error:", err);
    }
  }, []);

  useEffect(() => {
    fetchCars();
    fetchCategories();
  }, [fetchCars, fetchCategories]);

  // Create
  const handleCreate = async (formData) => {
    try {
      // formData is already a FormData object (multipart) from CarFormModal
      const res = await carsApi.createCar(formData);
      if (res.success === false) throw new Error(res.message || "Create failed");
      
      toast.success("Car create ho gayi! 🚗");
      fetchCars();
      setShowForm(false);
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || "Create failed!";
      Swal.fire({
        icon: "error",
        title: "Oops...",
        text: msg,
        confirmButtonColor: themeColors.primary,
      });
    }
  };

  // Update
  const handleUpdate = async (formData) => {
    try {
      // formData is a FormData object from CarFormModal (carNumber already excluded there)
      const res = await carsApi.updateCar(editCar._id, formData);
      if (res.success === false) throw new Error(res.message || "Update failed");
      
      toast.success("Car update ho gayi! ✏️");
      fetchCars();
      setShowForm(false);
      setEditCar(null);
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || "Update failed!";
      Swal.fire({
        icon: "error",
        title: "Selection Failed",
        text: msg,
        confirmButtonColor: themeColors.primary,
      });
    }
  };

  // Delete
  const handleDelete = async () => {
    setDeleting(true);
    try {
      await carsApi.deleteCar(deleteCar._id);
      toast.success("Car delete ho gayi! 🗑️");
      setDeleteCar(null);
      fetchCars();
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Delete Failed",
        text: err?.response?.data?.message || err?.message || "Delete nahi ho saka",
        confirmButtonColor: themeColors.primary,
      });
    } finally {
      setDeleting(false);
    }
  };

  // Filtered cars
  const filteredCars = useMemo(() => {
    return cars
      .filter((c) => {
        const q = search.toLowerCase();
        return (
          c.carNumber?.toLowerCase().includes(q) ||
          c.carModel?.toLowerCase().includes(q) ||
          c.carBrand?.toLowerCase().includes(q)
        );
      })
      .filter((c) => {
        if (filter === "available") return c.isAvailable && c.isActive;
        if (filter === "busy") return c.isBusy;
        if (filter === "inactive") return !c.isActive;
        return true;
      })
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [cars, search, filter]);

  // Pagination logic
  const totalPages = Math.ceil(filteredCars.length / itemsPerPage);
  const displayedCars = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredCars.slice(start, start + itemsPerPage);
  }, [filteredCars, currentPage, itemsPerPage]);

  // Reset to page 1 on search/filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, filter, itemsPerPage]);

  // Stats
  const stats = useMemo(() => ({
    total: cars.length,
    available: cars.filter(c => c.isAvailable && c.isActive).length,
    busy: cars.filter(c => c.isBusy).length,
    inactive: cars.filter(c => !c.isActive).length
  }), [cars]);

  // Chart Data
  const statusData = [
    { name: 'Available', value: stats.available, color: CHART_COLORS.success },
    { name: 'On Trip', value: stats.busy, color: CHART_COLORS.warning },
    { name: 'Inactive', value: stats.inactive, color: CHART_COLORS.gray }
  ].filter(item => item.value > 0);

  const categoryData = useMemo(() => {
    const catMap = {};
    cars.forEach(car => {
      const category = categories.find(c => c._id === (car.carType?._id || car.carType));
      const catName = category?.name || 'Unknown';
      catMap[catName] = (catMap[catName] || 0) + 1;
    });
    return Object.entries(catMap).map(([name, count]) => ({ name, count }));
  }, [cars, categories]);

  const earningsData = [...cars]
    .sort((a, b) => (b.totalEarnings || 0) - (a.totalEarnings || 0))
    .slice(0, 5)
    .map(car => ({
      name: car.carNumber,
      earnings: car.totalEarnings || 0
    }));

  // === HIGHCHARTS CONFIG ===
  const pieOptions = {
    chart: { type: 'pie', height: 220, style: { fontFamily: currentFont.family }, margin: [0, 0, 0, 0] },
    title: { text: null },
    tooltip: { pointFormat: '{point.name}: <b>{point.y}</b> Cars ({point.percentage:.1f}%)' },
    plotOptions: {
      pie: {
        innerRadius: '60%',
        size: '100%',
        dataLabels: { enabled: false },
        showInLegend: true
      }
    },
    series: [{
      name: 'Status',
      colorByPoint: true,
      data: statusData.map(d => ({ name: d.name, y: d.value, color: d.color }))
    }],
    legend: { enabled: true, layout: 'vertical', align: 'right', verticalAlign: 'middle' },
    credits: { enabled: false },
    exporting: { enabled: false }
  };

  const barOptions = {
    chart: { type: 'column', height: 220, style: { fontFamily: currentFont.family }, margin: [10, 10, 30, 30] },
    title: { text: null },
    xAxis: { categories: categoryData.map(d => d.name) },
    yAxis: { title: { text: null }, allowDecimals: false },
    legend: { enabled: false },
    tooltip: { pointFormat: 'Total: <b>{point.y}</b> Cars' },
    plotOptions: { column: { borderRadius: 4, color: CHART_COLORS.primary } },
    series: [{ name: 'Cars By Category', data: categoryData.map(d => d.count) }],
    credits: { enabled: false },
    exporting: { enabled: false }
  };

  const areaOptions = {
    chart: { type: 'areaspline', height: 220, style: { fontFamily: currentFont.family }, margin: [10, 10, 30, 40] },
    title: { text: null },
    xAxis: { categories: earningsData.map(d => d.name) },
    yAxis: { title: { text: null } },
    legend: { enabled: false },
    tooltip: { pointFormat: 'Earnings: <b>₹{point.y}</b>' },
    plotOptions: {
      areaspline: {
        fillColor: {
          linearGradient: { x1: 0, y1: 0, x2: 0, y2: 1 },
          stops: [
            [0, 'rgba(16, 185, 129, 0.4)'],
            [1, 'rgba(16, 185, 129, 0.0)']
          ]
        },
        marker: { radius: 3 },
        lineWidth: 2,
        color: CHART_COLORS.success
      }
    },
    series: [{ name: 'Earnings', data: earningsData.map(d => d.earnings) }],
    credits: { enabled: false }
  };

  return (
    <div className="space-y-6 p-6 bg-gray-50 min-h-screen" style={{ fontFamily: currentFont.family }}>

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2 text-gray-900">
            <FaCar className="text-blue-600" />
            Manage Cars
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Total {cars.length} cars in fleet
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchCars}
            className="p-2 rounded-lg border hover:bg-gray-50 transition-all"
            title="Refresh"
          >
            <FaSync className={loading ? "animate-spin" : ""} />
          </button>
          <button
            onClick={() => { setEditCar(null); setShowForm(true); }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all"
          >
            <FaPlus />
            Add New Car
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatBox label="Total Cars" value={stats.total} icon={FaCar} color={CHART_COLORS.primary} />
        <StatBox label="Available" value={stats.available} icon={FaCheckCircle} color={CHART_COLORS.success} />
        <StatBox label="On Trip" value={stats.busy} icon={FaClock} color={CHART_COLORS.warning} />
        <StatBox label="Inactive" value={stats.inactive} icon={FaExclamationTriangle} color={CHART_COLORS.danger} />
      </div>

      {/* Charts Section - 3 Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart 1: Status Distribution */}
        <ChartCard title="Car Status" subtitle="Distribution by status" icon={FaChartPie}>
          <HighchartsReact highcharts={Highcharts} options={pieOptions} />
        </ChartCard>

        {/* Chart 2: Category Distribution */}
        <ChartCard title="Cars by Category" subtitle="Distribution across types" icon={FaChartBar}>
          <HighchartsReact highcharts={Highcharts} options={barOptions} />
        </ChartCard>

        {/* Chart 3: Top Earners */}
        <ChartCard title="Top Earners" subtitle="Highest earning cars" icon={FaChartLine}>
          <HighchartsReact highcharts={Highcharts} options={areaOptions} />
        </ChartCard>
      </div>

      {/* Search + Filter */}
      <div className="flex flex-col sm:flex-row gap-3 p-4 bg-white rounded-xl border border-gray-200">
        <div className="relative flex-1">
          <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={12} />
          <input
            type="text"
            placeholder="Search by number, model, brand..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2">
              <FaTimes className="text-xs text-gray-400" />
            </button>
          )}
        </div>

        <div className="flex gap-2">
          {/* Tabs moved to table below */}
        </div>
      </div>

      {/* Cars Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {/* Table Tabs */}
        <div className="flex border-b border-gray-200 overflow-x-auto bg-gray-50/30">
          {[
            { key: "all", label: "All Cars", count: stats.total, color: "blue" },
            { key: "available", label: "Available", count: stats.available, color: "green" },
            { key: "busy", label: "On Trip", count: stats.busy, color: "orange" },
            { key: "inactive", label: "Inactive", count: stats.inactive, color: "red" },
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
                <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600" shadow-sm="true" />
              )}
            </button>
          ))}
        </div>
        {/* Table Header */}
        <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase">
          <div className="col-span-2">Car / Image</div>
          <div className="col-span-2">Category</div>
          <div className="col-span-2">Pricing</div>
          <div className="col-span-2">Seat Layout</div>
          <div className="col-span-1">Status</div>
          <div className="col-span-1">Added On</div>
          <div className="col-span-2 text-center">Actions</div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-600" />
          </div>
        )}

        {/* Empty */}
        {!loading && displayedCars.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <FaCar className="text-5xl text-gray-300" />
            <p className="text-sm text-gray-500">
              {search ? "No cars match your search" : "No cars found — add one!"}
            </p>
          </div>
        )}

        {/* Rows */}
          {!loading && displayedCars.map((car) => (
            <CarRow
              key={car._id}
              car={car}
              categories={categories}
              onView={setViewCar}
              onEdit={(car) => { setEditCar(car); setShowForm(true); }}
              onDelete={setDeleteCar}
            />
          ))}
        {/* Pagination Footer */}
        {!loading && filteredCars.length > 0 && (
          <div className="px-6 py-4 border-t bg-gray-50/50 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-500">
                Showing <span className="font-semibold text-gray-900">{Math.min(filteredCars.length, (currentPage - 1) * itemsPerPage + 1)}-{Math.min(filteredCars.length, currentPage * itemsPerPage)}</span> of <span className="font-semibold text-gray-900">{filteredCars.length}</span> cars
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
              <button
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                className="p-2 rounded-lg border hover:bg-white disabled:opacity-30 transition-all"
              >
                <ChevronsLeft size={16} />
              </button>
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg border hover:bg-white disabled:opacity-30 transition-all"
              >
                <ChevronLeft size={16} />
              </button>

              <div className="flex items-center gap-1 mx-2">
                {[...Array(totalPages)].map((_, idx) => {
                  const page = idx + 1;
                  // Only show current page, first, last, and a few around current
                  if (page === 1 || page === totalPages || (page >= currentPage - 1 && page <= currentPage + 1)) {
                    return (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`w-8 h-8 rounded-lg text-sm font-medium transition-all ${currentPage === page ? 'bg-blue-600 text-white border-blue-600' : 'border border-gray-200 hover:bg-white'}`}
                      >
                        {page}
                      </button>
                    );
                  }
                  if (page === 2 || page === totalPages - 1) return <span key={page} className="text-gray-400">...</span>;
                  return null;
                })}
              </div>

              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg border hover:bg-white disabled:opacity-30 transition-all"
              >
                <ChevronRight size={16} />
              </button>
              <button
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg border hover:bg-white disabled:opacity-30 transition-all"
              >
                <ChevronsRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <CarFormModal
        isOpen={showForm}
        onClose={() => { setShowForm(false); setEditCar(null); }}
        onSave={editCar ? handleUpdate : handleCreate}
        editCar={editCar}
        themeColors={themeColors}
        categories={categories}
      />
      <CarDetailModal
        car={viewCar}
        onClose={() => setViewCar(null)}
        themeColors={themeColors}
        categories={categories}
      />
      <DeleteModal
        car={deleteCar}
        onClose={() => setDeleteCar(null)}
        onConfirm={handleDelete}
        themeColors={themeColors}
        deleting={deleting}
      />
    </div>
  );
}