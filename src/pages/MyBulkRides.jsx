import React, { useState, useEffect } from "react";
import { getMyBulkRides } from "../api/bulkBookingApi";
import { toast } from "sonner";
import {
    FaCar, FaArrowRight, FaTruck, FaPhone, FaUser,
    FaCalendarAlt, FaRoad, FaCheckCircle, FaClock, FaLayerGroup
} from "react-icons/fa";
import { useTheme } from "../context/ThemeContext";

const statusConfig = {
    Accepted: { bg: "#dbeafe", color: "#1d4ed8", label: "Accepted" },
    Ongoing: { bg: "#fef3c7", color: "#b45309", label: "Ongoing" },
    Completed: { bg: "#d1fae5", color: "#047857", label: "Completed" },
};

export default function MyBulkRides() {
    const [rides, setRides] = useState([]);
    const [loading, setLoading] = useState(true);
    const { themeColors } = useTheme();

    useEffect(() => { fetchRides(); }, []);

    const fetchRides = async () => {
        try {
            setLoading(true);
            const res = await getMyBulkRides();
            if (res.success) setRides(res.bookings || []);
        } catch {
            toast.error("Failed to load your bulk rides");
        } finally {
            setLoading(false);
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <div className="flex flex-col items-center gap-3">
                <div className="animate-spin rounded-full h-10 w-10 border-2 border-t-transparent" style={{ borderColor: themeColors.primary, borderTopColor: "transparent" }} />
                <p className="text-sm font-medium" style={{ color: themeColors.textSecondary }}>Loading rides...</p>
            </div>
        </div>
    );

    return (
        <div className="p-4 sm:p-4 space-y-6">

            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: themeColors.text }}>
                        <FaLayerGroup style={{ color: themeColors.primary }} />
                        My Bulk Assignments
                    </h1>
                    <p className="text-sm mt-0.5" style={{ color: themeColors.textSecondary }}>
                        {rides.length} confirmed fleet job{rides.length !== 1 ? "s" : ""}
                    </p>
                </div>
                <button
                    onClick={fetchRides}
                    className="px-4 py-2 rounded-xl text-sm font-semibold transition-all hover:opacity-80"
                    style={{ backgroundColor: themeColors.primary, color: "#fff" }}
                >
                    Refresh
                </button>
            </div>

            {/* Empty State */}
            {rides.length === 0 ? (
                <div
                    className="rounded-2xl border-2 border-dashed p-16 flex flex-col items-center justify-center text-center"
                    style={{ borderColor: themeColors.border, backgroundColor: themeColors.surface }}
                >
                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ backgroundColor: themeColors.background }}>
                        <FaTruck size={28} style={{ color: themeColors.textSecondary, opacity: 0.4 }} />
                    </div>
                    <h3 className="text-lg font-bold mb-1" style={{ color: themeColors.text }}>No active assignments</h3>
                    <p className="text-sm" style={{ color: themeColors.textSecondary }}>Go to Marketplace to accept your first bulk ride.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {rides.map((ride) => {
                        const status = statusConfig[ride.status] || statusConfig.Accepted;
                        return (
                            <div
                                key={ride._id}
                                className="rounded-2xl border overflow-hidden transition-all hover:shadow-lg"
                                style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border }}
                            >
                                {/* Card Top Bar */}
                                <div
                                    className="px-6 py-3 flex items-center justify-between border-b"
                                    style={{ backgroundColor: themeColors.background, borderColor: themeColors.border }}
                                >
                                    <span
                                        className="px-3 py-1 rounded-full text-xs font-bold"
                                        style={{ backgroundColor: status.bg, color: status.color }}
                                    >
                                        {status.label}
                                    </span>
                                    <span className="text-xs font-medium" style={{ color: themeColors.textSecondary }}>
                                        Accepted on {new Date(ride.updatedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                                    </span>
                                </div>

                                <div className="p-6 flex flex-col lg:flex-row gap-6">

                                    {/* Left — Main Info */}
                                    <div className="flex-1 space-y-5">

                                        {/* Route */}
                                        <div
                                            className="p-4 rounded-xl space-y-2"
                                            style={{ backgroundColor: themeColors.background }}
                                        >
                                            <div className="flex items-start gap-2">
                                                <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ backgroundColor: themeColors.success }} />
                                                <div>
                                                    <p className="text-[10px] font-bold uppercase tracking-wider mb-0.5" style={{ color: themeColors.textSecondary }}>Pickup</p>
                                                    <p className="text-sm font-semibold" style={{ color: themeColors.text }}>{ride.pickup?.address}</p>
                                                </div>
                                            </div>
                                            <div className="ml-1 border-l-2 border-dashed h-3" style={{ borderColor: themeColors.border }} />
                                            <div className="flex items-start gap-2">
                                                <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ backgroundColor: themeColors.danger }} />
                                                <div>
                                                    <p className="text-[10px] font-bold uppercase tracking-wider mb-0.5" style={{ color: themeColors.textSecondary }}>Drop</p>
                                                    <p className="text-sm font-semibold" style={{ color: themeColors.text }}>{ride.drop?.address}</p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Stats Grid */}
                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                            {[
                                                { icon: FaCalendarAlt, label: "Start Date", value: new Date(ride.pickupDateTime).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) },
                                                { icon: FaClock, label: "Duration", value: `${ride.numberOfDays} Days` },
                                                { icon: FaRoad, label: "Total KM", value: `${ride.totalDistance} KM` },
                                                { icon: FaCheckCircle, label: "Earnings", value: `₹${ride.offeredPrice?.toLocaleString("en-IN")}`, highlight: true },
                                            ].map(({ icon: Icon, label, value, highlight }) => (
                                                <div
                                                    key={label}
                                                    className="p-4 rounded-xl flex flex-col gap-1"
                                                    style={{ backgroundColor: themeColors.background }}
                                                >
                                                    <div className="flex items-center gap-1.5">
                                                        <Icon size={10} style={{ color: highlight ? themeColors.success : themeColors.textSecondary }} />
                                                        <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: themeColors.textSecondary }}>{label}</p>
                                                    </div>
                                                    <p className="text-sm font-bold" style={{ color: highlight ? themeColors.success : themeColors.text }}>{value}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Right — Fleet Requirements + Customer */}
                                    <div className="w-full lg:w-72 space-y-3">

                                        {/* Fleet Requirements */}
                                        <div
                                            className="rounded-xl p-4 space-y-3"
                                            style={{ backgroundColor: themeColors.primary }}
                                        >
                                            <p className="text-[10px] font-bold uppercase tracking-wider text-white opacity-70">Fleet Requirements</p>
                                            <div className="space-y-2">
                                                {ride.carsRequired?.map((car, idx) => (
                                                    <div key={idx} className="flex items-center justify-between py-2 border-b border-white/10 last:border-0">
                                                        <div className="flex items-center gap-2">
                                                            <FaCar size={12} className="text-white opacity-60" />
                                                            <span className="text-sm font-semibold text-white">{car.category?.name}</span>
                                                        </div>
                                                        <span className="px-2 py-0.5 bg-white/20 rounded-md text-xs font-bold text-white">×{car.quantity}</span>
                                                    </div>
                                                ))}
                                            </div>
                                            <button className="w-full py-2.5 bg-white rounded-lg text-xs font-bold transition-all hover:bg-gray-100" style={{ color: themeColors.primary }}>
                                                Assign Drivers & Cars
                                            </button>
                                        </div>

                                        {/* Customer Info */}
                                        <div
                                            className="rounded-xl p-4 border flex items-center justify-between"
                                            style={{ backgroundColor: themeColors.background, borderColor: themeColors.border }}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${themeColors.primary}15` }}>
                                                    <FaUser size={13} style={{ color: themeColors.primary }} />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-semibold" style={{ color: themeColors.text }}>{ride.createdBy?.name || 'Unknown Customer'}</p>
                                                    <p className="text-xs flex items-center gap-1 mt-0.5" style={{ color: themeColors.textSecondary }}>
                                                        <FaPhone size={9} />
                                                        {ride.createdBy?.phone || 'N/A'}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
