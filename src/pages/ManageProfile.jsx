// src/pages/ManageProfile.jsx
import { useState, useEffect, useRef } from "react";
import { useFont } from "../context/FontContext";
import { fleetApi } from "../api/fleetApi";
import { toast } from "sonner";
import {
  FaCamera, FaSave, FaSync, FaShieldAlt, FaUniversity,
  FaIdCard, FaFileImage, FaCheckCircle, FaTimesCircle,
  FaMoneyBillWave, FaCar, FaUsers, FaCalendarAlt, FaPercentage
} from "react-icons/fa";
import { User, Lock, ShieldCheck, ExternalLink } from "lucide-react";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
const imgUrl = (path) => {
  if (!path) return null;
  if (path.startsWith("http") || path.startsWith("data:")) return path;
  return `${API_BASE}/uploads/${path}`;
};

// ── Info Row ─────────────────────────────────
const InfoRow = ({ label, value, icon: Icon }) => (
  <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
    <div className="flex items-center gap-2 text-gray-500">
      {Icon && <Icon size={13} className="shrink-0" />}
      <span className="text-xs font-medium">{label}</span>
    </div>
    <span className="text-sm font-semibold text-gray-800 text-right max-w-[60%] break-all">{value || "—"}</span>
  </div>
);

// ── Document Card ─────────────────────────────
const DocCard = ({ label, filename }) => {
  const url = imgUrl(filename);
  if (!url) return (
    <div className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-xl border border-dashed border-gray-200 h-32">
      <FaFileImage className="text-gray-300 text-2xl mb-2" />
      <p className="text-xs text-gray-400 font-medium">{label}</p>
      <p className="text-[10px] text-gray-300 mt-1">Not uploaded</p>
    </div>
  );
  return (
    <div className="rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-all">
      <a href={url} target="_blank" rel="noreferrer">
        <img src={url} alt={label} className="w-full h-28 object-cover hover:opacity-90 transition-opacity" />
      </a>
      <div className="flex items-center justify-between px-3 py-2 bg-gray-50">
        <p className="text-xs font-semibold text-gray-600">{label}</p>
        <a href={url} target="_blank" rel="noreferrer" className="text-blue-500 hover:text-blue-700">
          <ExternalLink size={12} />
        </a>
      </div>
    </div>
  );
};

export default function ManageProfile() {
  const { currentFont } = useFont();
  const fileInputRef = useRef(null);

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");

  // Form states
  const [name, setName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [address, setAddress] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [pincode, setPincode] = useState("");
  const [gstNumber, setGstNumber] = useState("");
  const [panNumber, setPanNumber] = useState("");

  // Bank states
  const [accountNumber, setAccountNumber] = useState("");
  const [ifscCode, setIfscCode] = useState("");
  const [accountHolderName, setAccountHolderName] = useState("");
  const [bankName, setBankName] = useState("");

  // Security states
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const data = await fleetApi.getProfile();
      const p = data.fleet || data.profile || data || {};
      setProfile(p);
      setName(p.name || ""); setCompanyName(p.companyName || "");
      setAddress(p.address || ""); setEmail(p.email || "");
      setPhone(p.phone || ""); setCity(p.city || "");
      setState(p.state || ""); setPincode(p.pincode || "");
      setGstNumber(p.gstNumber || ""); setPanNumber(p.panNumber || "");
      setAccountNumber(p.bankDetails?.accountNumber || "");
      setIfscCode(p.bankDetails?.ifscCode || "");
      setAccountHolderName(p.bankDetails?.accountHolderName || "");
      setBankName(p.bankDetails?.bankName || "");
      setImagePreview(p.image || null);
    } catch {
      toast.error("Profile load nahi hua!");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProfile(); }, []);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setSelectedFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result);
    reader.readAsDataURL(file);
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setUpdating(true);
    try {
      const fd = new FormData();
      [["name", name], ["companyName", companyName], ["address", address],
      ["city", city], ["state", state], ["pincode", pincode],
      ["gstNumber", gstNumber], ["panNumber", panNumber]
      ].forEach(([k, v]) => fd.append(k, v));
      if (selectedFile) fd.append("image", selectedFile);
      await fleetApi.updateProfile(fd);
      toast.success("Profile update ho gaya! ✅");
      setSelectedFile(null);
      fetchProfile();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Update fail hui!");
    } finally {
      setUpdating(false);
    }
  };

  const handleUpdateBank = async (e) => {
    e.preventDefault();
    setUpdating(true);
    try {
      await fleetApi.updateBankDetails({ bankDetails: { accountNumber, ifscCode, accountHolderName, bankName } });
      toast.success("Bank details update ho gayi! 🏦");
      fetchProfile();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Bank update fail!");
    } finally {
      setUpdating(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) return toast.error("Passwords match nahi kar rahe!");
    if (newPassword.length < 6) return toast.error("Password kam se kam 6 characters ka hona chahiye!");
    setUpdating(true);
    try {
      await fleetApi.changePassword({ password: newPassword });
      toast.success("Password change ho gaya! 🔐");
      setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Password change fail!");
    } finally {
      setUpdating(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-gray-500 font-medium">Loading profile...</p>
      </div>
    </div>
  );

  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "edit", label: "Edit Profile" },
    { id: "documents", label: "Documents" },
    { id: "bank", label: "Bank Details" },
    { id: "security", label: "Security" },
  ];

  const inputCls = "w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-white";
  const labelCls = "block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide";

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6" style={{ fontFamily: currentFont.family }}>
      <div className="max-w-8xl mx-auto space-y-6">

        {/* ── Top Profile Hero Card ── */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          {/* Cover */}
          <div className="h-24 bg-gradient-to-r from-blue-600 to-indigo-600" />
          <div className="px-6 pb-6">
            {/* Avatar */}
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 -mt-12">
              <div className="relative w-fit">
                <div className="w-24 h-24 rounded-2xl border-4 border-white shadow-lg overflow-hidden bg-blue-100">
                  {imagePreview
                    ? <img src={imgUrl(imagePreview)} alt="Profile" className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex items-center justify-center text-blue-400"><User size={40} /></div>
                  }
                </div>
                <button
                  onClick={() => fileInputRef.current.click()}
                  className="absolute -bottom-1 -right-1 w-7 h-7 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-md hover:bg-blue-700 transition-all"
                >
                  <FaCamera size={11} />
                </button>
                <input type="file" ref={fileInputRef} className="hidden" onChange={handleImageChange} accept="image/*" />
              </div>

              <div className="flex items-center gap-2 pb-1">
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${profile?.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                  {profile?.isActive ? "✅ Active" : "❌ Inactive"}
                </span>
                <button onClick={fetchProfile} className="p-2 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-500 transition-all">
                  <FaSync size={13} className={loading ? "animate-spin" : ""} />
                </button>
              </div>
            </div>

            {/* Name & Info */}
            <div className="mt-3">
              <h1 className="text-xl font-black text-gray-900">{profile?.name || "—"}</h1>
              <p className="text-sm text-gray-500 break-all">{profile?.email}</p>
              <div className="flex flex-wrap gap-3 mt-3">
                <span className="text-xs text-gray-500 flex items-center gap-1"><FaIdCard size={11} /> {profile?.phone || "—"}</span>
                {profile?.companyName && <span className="text-xs text-gray-500 flex items-center gap-1"><FaShieldAlt size={11} /> {profile.companyName}</span>}
                {profile?.city && <span className="text-xs text-gray-500 flex items-center gap-1">📍 {profile.city}, {profile.state}</span>}
                {profile?.createdAt && <span className="text-xs text-gray-400 flex items-center gap-1"><FaCalendarAlt size={11} /> Joined {new Date(profile.createdAt).toLocaleDateString("en-IN")}</span>}
              </div>
            </div>
          </div>
        </div>

        {/* ── Stats Row ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Total Cars", value: profile?.totalCars || 0, icon: FaCar, color: "#3B82F6" },
            { label: "Total Drivers", value: profile?.totalDrivers || 0, icon: FaUsers, color: "#8B5CF6" },
            { label: "Total Earnings", value: `₹${(profile?.totalEarnings || 0).toLocaleString()}`, icon: FaMoneyBillWave, color: "#10B981" },
            { label: "Commission", value: `${profile?.commissionPercentage || 0}%`, icon: FaPercentage, color: "#F59E0B" },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-2 rounded-lg" style={{ backgroundColor: color + "15" }}>
                  <Icon style={{ color }} size={14} />
                </div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">{label}</p>
              </div>
              <p className="text-xl font-black text-gray-900">{value}</p>
            </div>
          ))}
        </div>

        {/* ── Tabs ── */}
        <div className="flex border-b border-gray-200 bg-white rounded-t-xl overflow-x-auto">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-5 py-3.5 text-xs font-bold whitespace-nowrap transition-all relative ${activeTab === tab.id
                ? "text-blue-600 after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-blue-600"
                : "text-gray-400 hover:text-gray-600"
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── OVERVIEW TAB ── */}
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Personal Info */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
              <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                <User size={15} className="text-blue-600" /> Personal Info
              </h3>
              <InfoRow label="Full Name" value={profile?.name} icon={User} />
              <InfoRow label="Email" value={profile?.email} />
              <InfoRow label="Phone" value={profile?.phone} />
              <InfoRow label="Address" value={profile?.address} />
              <InfoRow label="City" value={profile?.city} />
              <InfoRow label="State" value={profile?.state} />
              <InfoRow label="Pincode" value={profile?.pincode} />
            </div>

            {/* Business Info */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
              <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                <FaShieldAlt size={13} className="text-purple-600" /> Business Info
              </h3>
              <InfoRow label="Company Name" value={profile?.companyName} />
              <InfoRow label="GST Number" value={profile?.gstNumber} />
              <InfoRow label="PAN Number" value={profile?.panNumber} />
              <InfoRow label="Commission %" value={`${profile?.commissionPercentage || 0}%`} />
              <InfoRow label="Wallet Balance" value={`₹${(profile?.walletBalance || 0).toLocaleString()}`} />
              <InfoRow label="Account Status" value={profile?.isActive ? "Active ✅" : "Inactive ❌"} />
              <InfoRow label="Member Since" value={profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }) : "—"} />
            </div>

            {/* Bank Info */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
              <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                <FaUniversity size={13} className="text-green-600" /> Bank Details
              </h3>
              <InfoRow label="Bank Name" value={profile?.bankDetails?.bankName} />
              <InfoRow label="Account Holder" value={profile?.bankDetails?.accountHolderName} />
              <InfoRow label="Account Number" value={profile?.bankDetails?.accountNumber ? `****${profile.bankDetails.accountNumber.slice(-4)}` : "—"} />
              <InfoRow label="IFSC Code" value={profile?.bankDetails?.ifscCode} />
            </div>

            {/* Documents Preview */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
              <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                <FaFileImage size={13} className="text-orange-500" /> Documents
              </h3>
              <div className="grid grid-cols-3 gap-3">
                <DocCard label="GST Certificate" filename={profile?.documents?.gstCertificate} />
                <DocCard label="PAN Card" filename={profile?.documents?.panCard} />
                <DocCard label="Business License" filename={profile?.documents?.businessLicense} />
              </div>
            </div>
          </div>
        )}

        {/* ── EDIT PROFILE TAB ── */}
        {activeTab === "edit" && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <form onSubmit={handleUpdateProfile} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Email - Non Editable */}
                <div className="md:col-span-2">
                  <label className={labelCls}>Email</label>
                  <div className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-500 flex items-center justify-between">
                    <span>{email}</span>
                    <span className="text-[10px] font-bold text-gray-400 bg-gray-200 px-2 py-0.5 rounded-full">Non-Editable</span>
                  </div>
                </div>
                {[
                  { label: "Full Name", val: name, set: setName, type: "text" },
                  { label: "Phone", val: phone, set: setPhone, type: "text" },
                  { label: "Company Name", val: companyName, set: setCompanyName, type: "text" },
                  { label: "GST Number", val: gstNumber, set: setGstNumber, type: "text" },
                  { label: "PAN Number", val: panNumber, set: setPanNumber, type: "text" },
                  { label: "City", val: city, set: setCity, type: "text" },
                  { label: "Pincode", val: pincode, set: setPincode, type: "text" },
                ].map(({ label, val, set, type }) => (
                  <div key={label}>
                    <label className={labelCls}>{label}</label>
                    <input type={type} value={val} onChange={e => set(e.target.value)} className={inputCls} placeholder={`Enter ${label}`} />
                  </div>
                ))}
                <div>
                  <label className={labelCls}>State</label>
                  <input type="text" value={state} onChange={e => setState(e.target.value)} className={inputCls} placeholder="Enter state" />
                </div>
              </div>
              <div>
                <label className={labelCls}>Address</label>
                <textarea rows="3" value={address} onChange={e => setAddress(e.target.value)} className={`${inputCls} resize-none`} placeholder="Enter full address" />
              </div>
              <div className="flex justify-end">
                <button type="submit" disabled={updating} className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-semibold text-sm hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2">
                  {updating ? <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" /> : <FaSave size={13} />}
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ── DOCUMENTS TAB ── */}
        {activeTab === "documents" && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h3 className="text-sm font-bold text-gray-900 mb-6 flex items-center gap-2">
              <FaFileImage className="text-orange-500" /> Fleet Documents
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <DocCard label="GST Certificate" filename={profile?.documents?.gstCertificate} />
              <DocCard label="PAN Card" filename={profile?.documents?.panCard} />
              <DocCard label="Business License" filename={profile?.documents?.businessLicense} />
            </div>
            {!profile?.documents?.gstCertificate && !profile?.documents?.panCard && !profile?.documents?.businessLicense && (
              <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-xl flex items-start gap-3">
                <span className="text-yellow-500 text-lg">⚠️</span>
                <div>
                  <p className="text-sm font-semibold text-yellow-800">Koi document upload nahi hua hai</p>
                  <p className="text-xs text-yellow-600 mt-1">GST Certificate, PAN Card aur Business License upload karne ke liye Admin se contact karein.</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── BANK TAB ── */}
        {activeTab === "bank" && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h3 className="text-sm font-bold text-gray-900 mb-6 flex items-center gap-2">
              <FaUniversity className="text-green-600" /> Bank Details
            </h3>
            <form onSubmit={handleUpdateBank} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {[
                  { label: "Bank Name", val: bankName, set: setBankName },
                  { label: "Account Holder Name", val: accountHolderName, set: setAccountHolderName },
                  { label: "Account Number", val: accountNumber, set: setAccountNumber },
                  { label: "IFSC Code", val: ifscCode, set: setIfscCode, upper: true },
                ].map(({ label, val, set, upper }) => (
                  <div key={label}>
                    <label className={labelCls}>{label}</label>
                    <input type="text" value={val} onChange={e => set(upper ? e.target.value.toUpperCase() : e.target.value)} className={inputCls} placeholder={`Enter ${label}`} />
                  </div>
                ))}
              </div>
              <div className="flex justify-end">
                <button type="submit" disabled={updating} className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-semibold text-sm hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2">
                  {updating ? <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" /> : <FaSave size={13} />}
                  Update Bank Details
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ── SECURITY TAB ── */}
        {activeTab === "security" && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h3 className="text-sm font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Lock size={15} className="text-red-500" /> Change Password
            </h3>
            <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
              {[
                { label: "New Password", val: newPassword, set: setNewPassword },
                { label: "Confirm New Password", val: confirmPassword, set: setConfirmPassword },
              ].map(({ label, val, set }) => (
                <div key={label}>
                  <label className={labelCls}>{label}</label>
                  <input type="password" value={val} onChange={e => set(e.target.value)} className={inputCls} placeholder={label} required />
                </div>
              ))}
              <div className="flex justify-end pt-2">
                <button type="submit" disabled={updating} className="px-6 py-2.5 bg-red-600 text-white rounded-xl font-semibold text-sm hover:bg-red-700 disabled:opacity-50 flex items-center gap-2">
                  {updating ? <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" /> : <Lock size={13} />}
                  Change Password
                </button>
              </div>
            </form>

            <div className="mt-8 p-4 bg-blue-50 rounded-xl border border-blue-100">
              <h4 className="text-xs font-bold text-blue-800 mb-3 flex items-center gap-2"><ShieldCheck size={14} /> Security Tips</h4>
              <ul className="space-y-1.5 text-xs text-blue-700">
                <li>• Strong password use karo (min 8 characters)</li>
                <li>• Kisi ke saath password share mat karo</li>
                <li>• Regular password change karte raho</li>
              </ul>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
