// src/pages/ManageProfile.jsx
import { useState, useEffect, useRef } from "react";
import { useTheme } from "../context/ThemeContext";
import { useFont } from "../context/FontContext";
import { fleetApi } from "../api/fleetApi";
import { toast } from "sonner";
import Swal from "sweetalert2";
import {
  FaUserCircle, FaBuilding, FaMapMarkerAlt, FaCamera,
  FaUniversity, FaIdCard, FaSave, FaSync, FaInfoCircle,
  FaCheckCircle, FaExclamationTriangle, FaShieldAlt
} from "react-icons/fa";
import {
  User, Briefcase, MapPin, Landmark, ShieldCheck,
  Mail, Phone, Calendar, CreditCard, Lock
} from "lucide-react";

export default function ManageProfile() {
  const { currentFont } = useFont();
  const fileInputRef = useRef(null);

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [activeTab, setActiveTab] = useState('profile'); // profile, bank, security

  // States for form fields
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
  const [selectedFile, setSelectedFile] = useState(null);

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
      const profileData = data.fleet || data.profile || data || {};

      setProfile(profileData);

      // Sync states
      setName(profileData.name || "");
      setCompanyName(profileData.companyName || "");
      setAddress(profileData.address || "");
      setEmail(profileData.email || "");
      setPhone(profileData.phone || "");
      setCity(profileData.city || "");
      setState(profileData.state || "");
      setPincode(profileData.pincode || "");
      setGstNumber(profileData.gstNumber || "");
      setPanNumber(profileData.panNumber || "");

      setAccountNumber(profileData.bankDetails?.accountNumber || "");
      setIfscCode(profileData.bankDetails?.ifscCode || "");
      setAccountHolderName(profileData.bankDetails?.accountHolderName || "");
      setBankName(profileData.bankDetails?.bankName || "");

      setImagePreview(profileData.image || null);
    } catch (err) {
      toast.error("Profile load nahi hua!");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setUpdating(true);
    try {
      const formData = new FormData();
      formData.append("name", name);
      formData.append("companyName", companyName);
      formData.append("address", address);
      formData.append("city", city);
      formData.append("state", state);
      formData.append("pincode", pincode);
      formData.append("gstNumber", gstNumber);
      formData.append("panNumber", panNumber);
      if (selectedFile) {
        formData.append("image", selectedFile);
      }

      await fleetApi.updateProfile(formData);
      toast.success("Profile update ho gaya!");
      fetchProfile();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Profile update fail hui!");
    } finally {
      setUpdating(false);
    }
  };

  const handleUpdateBank = async (e) => {
    e.preventDefault();
    setUpdating(true);
    try {
      const bankData = {
        bankDetails: {
          accountNumber,
          ifscCode,
          accountHolderName,
          bankName
        }
      };
      await fleetApi.updateBankDetails(bankData);
      toast.success("Bank details update ho gayi!");
      fetchProfile();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Bank details update fail hui!");
    } finally {
      setUpdating(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      return toast.error("Passwords don't match!");
    }
    if (newPassword.length < 6) {
      return toast.error("Password must be at least 6 characters!");
    }

    setUpdating(true);
    try {
      await fleetApi.changePassword({
        currentPassword,
        newPassword
      });
      toast.success("Password changed successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Password change failed!");
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-medium text-gray-500">Loading profile...</p>
        </div>
      </div>
    );
  }

  const stats = {
    totalCars: profile?.totalCars || 0,
    totalDrivers: profile?.totalDrivers || 0,
    totalEarnings: profile?.totalEarnings || 0,
    walletBalance: profile?.walletBalance || 0
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6" style={{ fontFamily: currentFont.family }}>

      {/* Header */}
      {/* Header & Main Container */}
      <div className="max-w-8xl mx-auto">
        {/* Header - Redesigned for Mobile */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-5 mb-4 sm:mb-6">
          <div className="flex items-start justify-between w-full sm:w-auto">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-blue-600 text-white rounded-2xl shadow-lg shadow-blue-500/20">
                <User size={20} />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">Profile</h1>
                <p className="text-[10px] sm:text-xs text-gray-500 font-medium mt-0.5 uppercase tracking-wider">Business & Account Settings</p>
              </div>
            </div>

            {/* Refresh Button - TOP RIGHT ON MOBILE */}
            <button
              onClick={fetchProfile}
              className="sm:hidden p-3 rounded-2xl border border-gray-100 bg-white shadow-sm hover:shadow-md transition-all active:scale-90 text-blue-600"
              title="Refresh"
            >
              <FaSync className={updating ? "animate-spin" : ""} size={16} />
            </button>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            {/* Refresh Button - DESKTOP ONLY */}
            <button
              onClick={fetchProfile}
              className="hidden sm:flex p-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 transition-all text-gray-600"
              title="Refresh"
            >
              <FaSync className={updating ? "animate-spin" : ""} size={14} />
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        {/* Stats Cards - Dual Column Grid on Mobile */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mt-2 sm:mt-4">
          <div className="bg-white rounded-xl pt-2 pb-3 px-3 sm:pt-3 sm:pb-4 sm:px-4 border border-gray-100/60 shadow-sm hover:shadow-md transition-all">
            <p className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-tight mb-1 leading-tight">Total Cars</p>
            <p className="text-xl sm:text-2xl font-black text-gray-900 leading-none">{stats.totalCars}</p>
          </div>
          <div className="bg-white rounded-xl pt-2 pb-3 px-3 sm:pt-3 sm:pb-4 sm:px-4 border border-gray-100/60 shadow-sm hover:shadow-md transition-all">
            <p className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-tight mb-1 leading-tight">Total Drivers</p>
            <p className="text-xl sm:text-2xl font-black text-gray-900 leading-none">{stats.totalDrivers}</p>
          </div>
          <div className="bg-white rounded-xl pt-2 pb-3 px-3 sm:pt-3 sm:pb-4 sm:px-4 border border-gray-100/60 shadow-sm hover:shadow-md transition-all house-shadow">
            <p className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-tight mb-1 leading-tight">Total Earnings</p>
            <div className="flex items-baseline gap-0.5">
              <span className="text-[10px] sm:text-xs font-bold text-emerald-500 tracking-tight">₹</span>
              <p className="text-xl sm:text-2xl font-black text-emerald-600 leading-none truncate">{stats.totalEarnings.toLocaleString()}</p>
            </div>
          </div>
          <div className="bg-white rounded-xl pt-2 pb-3 px-3 sm:pt-3 sm:pb-4 sm:px-4 border border-gray-100/60 shadow-sm hover:shadow-md transition-all">
            <p className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-tight mb-1 leading-tight">Wallet Balance</p>
            <div className="flex items-baseline gap-0.5">
              <span className={`text-[10px] sm:text-xs font-bold tracking-tight ${stats.walletBalance < 0 ? 'text-red-500' : 'text-blue-500'}`}>₹</span>
              <p className={`text-xl sm:text-2xl font-black leading-none truncate ${stats.walletBalance < 0 ? 'text-red-600' : 'text-blue-600'}`}>
                {stats.walletBalance.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        {/* Tabs - Horizontal Scroll on tiny screens */}
        <div className="flex border-b border-gray-100 mt-8 overflow-x-auto no-scrollbar scroll-smooth">
          {[
            { id: 'profile', label: 'Profile Info' },
            { id: 'bank', label: 'Bank Details' },
            { id: 'security', label: 'Security' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-5 py-4 text-xs sm:text-sm font-bold transition-all relative whitespace-nowrap ${activeTab === tab.id
                ? 'text-blue-600 after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-blue-600'
                : 'text-gray-400 hover:text-gray-600'
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-8xl mx-auto">
        {activeTab === 'profile' && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 sm:p-8">
            {/* Profile Image */}
            <div className="flex flex-col sm:flex-row items-center gap-6 mb-8 pb-6 border-b border-gray-100">
              <div className="relative group">
                <div className="w-24 h-24 rounded-full bg-gradient-to-r from-blue-100 to-purple-100 border-4 border-white shadow-lg overflow-hidden">
                  {imagePreview ? (
                    <img
                      src={imagePreview}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <User size={40} className="text-gray-400" />
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current.click()}
                  className="absolute -bottom-1 -right-1 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-blue-700 transition-all"
                >
                  <FaCamera size={12} />
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  onChange={handleImageChange}
                  accept="image/*"
                />
              </div>
              <div className="text-center sm:text-left">
                <h2 className="text-xl font-bold text-gray-900">{name || 'Your Name'}</h2>
                <p className="text-sm text-gray-500">{email}</p>
                <p className="text-xs text-gray-400 mt-1">{phone}</p>
              </div>
            </div>

            <form onSubmit={handleUpdateProfile} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left Column */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      placeholder="Enter your name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      placeholder="Enter email"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      placeholder="Enter phone number"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Company Name</label>
                    <input
                      type="text"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      placeholder="Enter company name"
                    />
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">GST Number</label>
                    <input
                      type="text"
                      value={gstNumber}
                      onChange={(e) => setGstNumber(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      placeholder="Enter GST number"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">PAN Number</label>
                    <input
                      type="text"
                      value={panNumber}
                      onChange={(e) => setPanNumber(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      placeholder="Enter PAN number"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      placeholder="Enter city"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">State</label>
                      <input
                        type="text"
                        value={state}
                        onChange={(e) => setState(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                        placeholder="State"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Pincode</label>
                      <input
                        type="text"
                        value={pincode}
                        onChange={(e) => setPincode(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                        placeholder="Pincode"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Address */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                <textarea
                  rows="3"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none"
                  placeholder="Enter your address"
                />
              </div>

              {/* Submit Button */}
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={updating}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  {updating ? (
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                  ) : (
                    <FaSave size={14} />
                  )}
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        )}

        {activeTab === 'bank' && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 sm:p-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Bank Details</h2>
            <form onSubmit={handleUpdateBank} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Bank Name</label>
                  <input
                    type="text"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    placeholder="Enter bank name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Account Holder Name</label>
                  <input
                    type="text"
                    value={accountHolderName}
                    onChange={(e) => setAccountHolderName(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    placeholder="Enter account holder name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Account Number</label>
                  <input
                    type="text"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    placeholder="Enter account number"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">IFSC Code</label>
                  <input
                    type="text"
                    value={ifscCode}
                    onChange={(e) => setIfscCode(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 uppercase"
                    placeholder="Enter IFSC code"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={updating}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  {updating ? (
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                  ) : (
                    <FaSave size={14} />
                  )}
                  Update Bank Details
                </button>
              </div>
            </form>
          </div>
        )}

        {activeTab === 'security' && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 sm:p-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Change Password</h2>
            <form onSubmit={handleChangePassword} className="space-y-6 max-w-md">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Current Password</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  placeholder="Enter current password"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  placeholder="Enter new password"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Confirm New Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  placeholder="Confirm new password"
                  required
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={updating}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  {updating ? (
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                  ) : (
                    <Lock size={14} />
                  )}
                  Change Password
                </button>
              </div>
            </form>

            {/* Security Tips */}
            <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-100">
              <h3 className="text-sm font-semibold text-blue-800 mb-2 flex items-center gap-2">
                <ShieldCheck size={16} />
                Security Tips
              </h3>
              <ul className="space-y-2 text-sm text-blue-700">
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5" />
                  <span>Use a strong password with at least 8 characters</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5" />
                  <span>Never share your password with anyone</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5" />
                  <span>Change your password regularly</span>
                </li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}