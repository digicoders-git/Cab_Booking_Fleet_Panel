import React, { useState, useEffect } from "react";
import { getBulkMarketplace, acceptBulkBooking } from "../api/bulkBookingApi";
import { toast } from "sonner";
import Swal from "sweetalert2";
import { 
    FaCar, FaCalendarAlt, FaMapMarkerAlt, FaWallet, 
    FaClock, FaChevronRight, FaCheckCircle, FaExclamationCircle,
    FaArrowRight, FaTruck
} from "react-icons/fa";
import { useTheme } from "../context/ThemeContext";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

export default function BulkMarketplace() {
    const [deals, setDeals] = useState([]);
    const [loading, setLoading] = useState(true);
    const { themeColors } = useTheme();

    useEffect(() => {
        fetchDeals();
    }, []);

    const fetchDeals = async () => {
        try {
            setLoading(true);
            const res = await getBulkMarketplace();
            if (res.success) {
                setDeals(res.bookings || []);
            }
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
                    fetchDeals(); // Refresh
                }
            } catch (err) {
                toast.error(err.message || "Failed to accept deal");
            }
        }
    };

    if (loading) {
        return (
            <div className="p-8 flex items-center justify-center min-h-[60vh]">
                <div className="flex flex-col items-center gap-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                    <p className="text-gray-500 font-bold animate-pulse">Scanning Marketplace for Deals...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 sm:p-8 space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 flex items-center gap-3">
                        <FaWallet className="text-blue-600" /> Bulk Marketplace
                    </h1>
                    <p className="text-gray-500 text-sm font-bold uppercase tracking-widest mt-1">Live Deals for Fleet Owners</p>
                </div>
                <button 
                    onClick={fetchDeals}
                    className="px-6 py-2 bg-blue-600 text-white rounded-xl font-bold hover:shadow-lg hover:shadow-blue-200 transition-all text-sm"
                >
                    Refresh Deals
                </button>
            </div>

            {deals.length === 0 ? (
                <div className="bg-white rounded-3xl p-20 border border-dashed border-gray-300 flex flex-col items-center justify-center text-center">
                    <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6">
                        <FaTruck size={30} className="text-gray-300" />
                    </div>
                    <h3 className="text-xl font-black text-gray-900">No active deals found</h3>
                    <p className="text-gray-500 max-w-xs mt-2">Check back later for new bulk booking requests on the marketplace.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {deals.map((deal) => (
                        <div key={deal._id} className="bg-white rounded-3xl border border-gray-200 p-6 sm:p-8 hover:border-blue-500 transition-all group hover:shadow-2xl hover:shadow-blue-50/50">
                            <div className="flex items-center justify-between mb-8">
                                <div className="flex items-center gap-3">
                                    <div className="p-3 bg-blue-50 rounded-2xl text-blue-600">
                                        <FaTruck size={20} />
                                    </div>
                                    <div>
                                        <span className="text-[10px] font-black uppercase text-blue-500 tracking-tighter">Live Request</span>
                                        <h4 className="text-sm font-black text-gray-900">{deal.createdByModel === 'Admin' ? 'Direct Admin Post' : 'Direct User Request'}</h4>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-2xl font-black text-blue-600">₹{deal.offeredPrice.toLocaleString()}</p>
                                    <p className="text-[10px] text-gray-400 font-bold uppercase">{deal.totalDistance} KM Package</p>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <div className="flex-1">
                                        <p className="text-[10px] font-black text-gray-400 uppercase mb-1">Pickup</p>
                                        <p className="text-sm font-bold text-gray-900 line-clamp-1">{deal.pickup.address}</p>
                                    </div>
                                    <div className="px-4 text-gray-300">
                                        <FaArrowRight size={14} />
                                    </div>
                                    <div className="flex-1 text-right">
                                        <p className="text-[10px] font-black text-gray-400 uppercase mb-1">Drop</p>
                                        <p className="text-sm font-bold text-gray-900 line-clamp-1">{deal.drop.address}</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 gap-4 py-4 border-y border-gray-50">
                                    <div>
                                        <p className="text-[10px] text-gray-400 font-black uppercase mb-1">Start Date</p>
                                        <div className="flex items-center gap-2 text-gray-900">
                                            <FaCalendarAlt size={12} className="text-blue-500" />
                                            <span className="text-xs font-bold">{new Date(deal.pickupDateTime).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-gray-400 font-black uppercase mb-1">Duration</p>
                                        <div className="flex items-center gap-2 text-gray-900">
                                            <FaClock size={12} className="text-blue-500" />
                                            <span className="text-xs font-bold">{deal.numberOfDays} Days</span>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] text-gray-400 font-black uppercase mb-1">Vehicle Reqs</p>
                                        <div className="flex flex-wrap justify-end gap-1">
                                            {deal.carsRequired.map((car, idx) => (
                                                <span key={idx} className="px-2 py-0.5 bg-gray-100 text-[8px] font-black rounded text-gray-600 uppercase">
                                                    {car.quantity}x {car.category?.name}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {deal.notes && (
                                    <div className="bg-gray-50 p-4 rounded-2xl flex items-start gap-3">
                                        <FaExclamationCircle className="text-blue-500 mt-0.5 shrink-0" size={14} />
                                        <p className="text-[11px] text-gray-600 font-medium italic">"{deal.notes}"</p>
                                    </div>
                                )}

                                <button 
                                    onClick={() => handleAccept(deal)}
                                    className="w-full py-4 bg-gray-900 text-white rounded-2xl font-black hover:bg-black transition-all group flex items-center justify-center gap-3 active:scale-[0.98]"
                                >
                                    Accept this Fleet Offer
                                    <FaChevronRight className="group-hover:translate-x-1 transition-all" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
