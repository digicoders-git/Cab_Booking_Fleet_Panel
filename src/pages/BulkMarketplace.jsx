import React, { useState, useEffect } from "react";
import { getBulkMarketplace, acceptBulkBooking } from "../api/bulkBookingApi";
import { toast } from "sonner";
import Swal from "sweetalert2";
import {
    FaCar, FaCalendarAlt, FaWallet, FaClock, FaChevronRight,
    FaExclamationCircle, FaArrowRight, FaTruck, FaPhone, FaUser, FaRoad
} from "react-icons/fa";
import { useTheme } from "../context/ThemeContext";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

export default function BulkMarketplace() {
    const [deals, setDeals] = useState([]);
    const [loading, setLoading] = useState(true);
    const { themeColors } = useTheme();

    useEffect(() => { fetchDeals(); }, []);

    const fetchDeals = async () => {
        try {
            setLoading(true);
            const res = await getBulkMarketplace();
            if (res.success) setDeals(res.bookings || []);
        } catch (err) {
            toast.error("Failed to load marketplace deals");
        } finally {
            setLoading(false);
        }
    };

    const handleAccept = async (deal) => {
        const result = await Swal.fire({
            title: 'Accept this Deal?',
            text: `Confirming deal for ₹${deal.offeredPrice.toLocaleString()}`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes, Accept it!'
        });

        if (result.isConfirmed) {
            try {
                const res = await acceptBulkBooking(deal._id);
                if (res.success) {
                    toast.success("Deal Accepted Successfully! Check your assignments.");
                    fetchDeals();
                }
            } catch (err) {
                toast.error(err.message || "Failed to accept deal");
            }
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <div className="flex flex-col items-center gap-3">
                <div
                    className="animate-spin rounded-full h-10 w-10 border-2"
                    style={{ borderColor: themeColors.primary, borderTopColor: "transparent" }}
                />
                <p className="text-sm font-medium" style={{ color: themeColors.textSecondary }}>
                    Scanning marketplace...
                </p>
            </div>
        </div>
    );

    return (
        <div className="p-4 sm:p-2 space-y-6">

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: themeColors.text }}>
                       
                        Bulk Marketplace
                    </h1>
                    <p className="text-sm mt-0.5" style={{ color: themeColors.textSecondary }}>
                        {deals.length} live deal{deals.length !== 1 ? "s" : ""} available
                    </p>
                </div>
                <button
                    onClick={fetchDeals}
                    className="px-4 py-2 rounded-xl text-sm font-semibold transition-all hover:opacity-80 self-start sm:self-auto"
                    style={{ backgroundColor: themeColors.primary, color: "#fff" }}
                >
                    Refresh Deals
                </button>
            </div>

            {/* Empty State */}
            {deals.length === 0 ? (
                <div
                    className="rounded-2xl border-2 border-dashed p-16 flex flex-col items-center justify-center text-center"
                    style={{ borderColor: themeColors.border, backgroundColor: themeColors.surface }}
                >
                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
                        style={{ backgroundColor: themeColors.background }}>
                        <FaTruck size={28} style={{ color: themeColors.textSecondary, opacity: 0.4 }} />
                    </div>
                    <h3 className="text-lg font-bold mb-1" style={{ color: themeColors.text }}>No active deals found</h3>
                    <p className="text-sm" style={{ color: themeColors.textSecondary }}>
                        Check back later for new bulk booking requests.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                    {deals.map((deal) => (
                        <div
                            key={deal._id}
                            className="rounded-2xl border overflow-hidden transition-all hover:shadow-lg"
                            style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border }}
                        >
                            {/* Card Header */}
                            <div
                                className="px-5 py-4 flex items-center justify-between border-b"
                                style={{ backgroundColor: themeColors.background, borderColor: themeColors.border }}
                            >
                                {/* Customer Info */}
                                <div className="flex items-center gap-3">
                                    <div
                                        className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                                        style={{ backgroundColor: `${themeColors.primary}18` }}
                                    >
                                        <FaUser size={13} style={{ color: themeColors.primary }} />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <p className="text-xs font-bold leading-none" style={{ color: themeColors.text }}>
                                                {deal.createdBy?.name || "Unknown Customer"}
                                            </p>
                                            {deal.createdByModel && (
                                                <span 
                                                    className="text-[8px] px-1.5 py-0.5 rounded-full font-black uppercase tracking-tighter flex items-center gap-1"
                                                    style={{ 
                                                        backgroundColor: 
                                                            deal.createdByModel === 'Admin' ? '#fee2e2' : 
                                                            deal.createdByModel === 'Agent' ? '#dbeafe' : '#dcfce7',
                                                        color: 
                                                            deal.createdByModel === 'Admin' ? '#dc2626' : 
                                                            deal.createdByModel === 'Agent' ? '#2563eb' : '#16a34a',
                                                        border: `0.5px solid ${
                                                            deal.createdByModel === 'Admin' ? '#dc2626' : 
                                                            deal.createdByModel === 'Agent' ? '#2563eb' : '#16a34a'}30`
                                                    }}
                                                >
                                                    {deal.createdByModel === 'Admin' ? '🔴 ' : 
                                                     deal.createdByModel === 'Agent' ? '💼 ' : '👤 '}
                                                    {deal.createdByModel}
                                                </span>
                                            )}
                                        </div>

                                        <p className="text-[11px] mt-0.5 flex items-center gap-1" style={{ color: themeColors.textSecondary }}>
                                            <FaPhone size={8} />
                                            {deal.createdBy?.phone || "N/A"}
                                        </p>
                                    </div>
                                </div>

                                {/* Price */}
                                <div className="text-right">
                                    <p className="text-xl font-bold" style={{ color: themeColors.primary }}>
                                        ₹{deal.offeredPrice.toLocaleString("en-IN")}
                                    </p>
                                    <p className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: themeColors.textSecondary }}>
                                        {deal.totalDistance} KM Package
                                    </p>
                                </div>
                            </div>

                            {/* Card Body */}
                            <div className="p-5 space-y-4">

                                {/* Route */}
                                <div
                                    className="p-3 rounded-xl space-y-2"
                                    style={{ backgroundColor: themeColors.background }}
                                >
                                    <div className="flex items-start gap-2">
                                        <div className="w-2 h-2 rounded-full mt-1 flex-shrink-0" style={{ backgroundColor: themeColors.success }} />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[10px] font-bold uppercase tracking-wider mb-0.5" style={{ color: themeColors.textSecondary }}>Pickup</p>
                                            <p className="text-xs font-semibold" style={{ color: themeColors.text }}>{deal.pickup.address}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 pl-0.5">
                                        <div className="w-1 border-l-2 border-dashed h-4 ml-0.5" style={{ borderColor: themeColors.border }} />
                                    </div>
                                    <div className="flex items-start gap-2">
                                        <div className="w-2 h-2 rounded-full mt-1 flex-shrink-0" style={{ backgroundColor: themeColors.danger }} />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[10px] font-bold uppercase tracking-wider mb-0.5" style={{ color: themeColors.textSecondary }}>Drop</p>
                                            <p className="text-xs font-semibold" style={{ color: themeColors.text }}>{deal.drop.address}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Stats Row */}
                                <div className="grid grid-cols-3 gap-3">
                                    {[
                                        { icon: FaCalendarAlt, label: "Start Date", value: new Date(deal.pickupDateTime).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) },
                                        { icon: FaClock, label: "Duration", value: `${deal.numberOfDays} Days` },
                                        { icon: FaRoad, label: "Distance", value: `${deal.totalDistance} KM` },
                                    ].map(({ icon: Icon, label, value }) => (
                                        <div
                                            key={label}
                                            className="p-3 rounded-xl"
                                            style={{ backgroundColor: themeColors.background }}
                                        >
                                            <div className="flex items-center gap-1 mb-1">
                                                <Icon size={9} style={{ color: themeColors.primary }} />
                                                <p className="text-[9px] font-bold uppercase tracking-wider" style={{ color: themeColors.textSecondary }}>{label}</p>
                                            </div>
                                            <p className="text-xs font-bold" style={{ color: themeColors.text }}>{value}</p>
                                        </div>
                                    ))}
                                </div>

                                {/* Vehicle Requirements */}
                                <div>
                                    <p className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: themeColors.textSecondary }}>
                                        Vehicle Requirements
                                    </p>
                                    <div className="flex flex-wrap gap-2">
                                        {deal.carsRequired.map((car, idx) => (
                                            <div
                                                key={idx}
                                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg"
                                                style={{ backgroundColor: `${themeColors.primary}12`, border: `1px solid ${themeColors.primary}25` }}
                                            >
                                                <FaCar size={10} style={{ color: themeColors.primary }} />
                                                <span className="text-xs font-semibold" style={{ color: themeColors.text }}>{car.category?.name}</span>
                                                <span
                                                    className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                                                    style={{ backgroundColor: themeColors.primary, color: "#fff" }}
                                                >
                                                    ×{car.quantity}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Notes */}
                                {deal.notes && (
                                    <div
                                        className="flex items-start gap-2 p-3 rounded-xl"
                                        style={{ backgroundColor: `${themeColors.warning}12`, border: `1px solid ${themeColors.warning}30` }}
                                    >
                                        <FaExclamationCircle size={12} style={{ color: themeColors.warning, marginTop: 1, flexShrink: 0 }} />
                                        <p className="text-xs font-medium italic" style={{ color: themeColors.text }}>"{deal.notes}"</p>
                                    </div>
                                )}

                                {/* Accept Button */}
                                <button
                                    onClick={() => handleAccept(deal)}
                                    className="w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all hover:opacity-90 active:scale-[0.98]"
                                    style={{ backgroundColor: themeColors.primary, color: "#fff" }}
                                >
                                    Accept this Fleet Offer
                                    <FaChevronRight size={11} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
