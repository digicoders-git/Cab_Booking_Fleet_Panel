import React, { useState, useEffect } from "react";
import { getMyBulkRides } from "../api/bulkBookingApi";
import { toast } from "sonner";
import { 
    FaCar, FaCalendarAlt, FaMapMarkerAlt, FaWallet, 
    FaClock, FaChevronRight, FaCheckCircle, FaExclamationCircle,
    FaArrowRight, FaTruck, FaPhone, FaUser
} from "react-icons/fa";
import { useTheme } from "../context/ThemeContext";

export default function MyBulkRides() {
    const [rides, setRides] = useState([]);
    const [loading, setLoading] = useState(true);
    const { themeColors } = useTheme();

    useEffect(() => {
        fetchRides();
    }, []);

    const fetchRides = async () => {
        try {
            setLoading(true);
            const res = await getMyBulkRides();
            if (res.success) {
                setRides(res.bookings || []);
            }
        } catch (err) {
            toast.error("Failed to load your bulk rides");
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="p-8 flex items-center justify-center min-h-[60vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <div className="p-4 sm:p-8 space-y-8 animate-in fade-in duration-500">
            <div>
                <h1 className="text-3xl font-black text-gray-900 flex items-center gap-3">
                    <FaCheckCircle className="text-green-600" /> My Bulk Assignments
                </h1>
                <p className="text-gray-500 text-sm font-bold uppercase tracking-widest mt-1">Confirmed Fleet Jobs</p>
            </div>

            {rides.length === 0 ? (
                <div className="bg-white rounded-3xl p-20 border border-dashed border-gray-300 flex flex-col items-center justify-center text-center">
                    <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6">
                        <FaTruck size={30} className="text-gray-300" />
                    </div>
                    <h3 className="text-xl font-black text-gray-900">No active assignments</h3>
                    <p className="text-gray-500 max-w-xs mt-2">Go to Marketplace to accept your first bulk ride.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {rides.map((ride) => (
                        <div key={ride._id} className="bg-white rounded-3xl border border-gray-100 p-6 sm:p-8 hover:shadow-xl hover:shadow-gray-100 transition-all flex flex-col lg:flex-row gap-8">
                            <div className="flex-1 space-y-6">
                                <div className="flex items-center justify-between">
                                    <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                                        ride.status === 'Accepted' ? 'bg-blue-100 text-blue-600' : 
                                        ride.status === 'Ongoing' ? 'bg-orange-100 text-orange-600' :
                                        'bg-green-100 text-green-600'
                                    }`}>
                                        {ride.status}
                                    </span>
                                    <p className="text-xs font-bold text-gray-400">Accepted on {new Date(ride.updatedAt).toLocaleDateString()}</p>
                                </div>

                                <div className="flex items-center justify-between bg-gray-50 p-6 rounded-2xl">
                                    <div className="flex-1">
                                        <p className="text-[10px] font-black text-gray-400 uppercase mb-1">Pickup From</p>
                                        <p className="text-sm font-bold text-gray-900 line-clamp-2">{ride.pickup.address}</p>
                                    </div>
                                    <div className="px-6 text-blue-500">
                                        <FaArrowRight size={20} />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-[10px] font-black text-gray-400 uppercase mb-1">Drop To</p>
                                        <p className="text-sm font-bold text-gray-900 line-clamp-2">{ride.drop.address}</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                     <div className="p-4 bg-gray-50 rounded-2xl text-center">
                                         <p className="text-[9px] font-black text-gray-400 uppercase mb-1">Start Date</p>
                                         <p className="text-xs font-bold">{new Date(ride.pickupDateTime).toLocaleDateString()}</p>
                                     </div>
                                     <div className="p-4 bg-gray-50 rounded-2xl text-center">
                                         <p className="text-[9px] font-black text-gray-400 uppercase mb-1">Duration</p>
                                         <p className="text-xs font-bold">{ride.numberOfDays} Days</p>
                                     </div>
                                     <div className="p-4 bg-gray-50 rounded-2xl text-center">
                                         <p className="text-[9px] font-black text-gray-400 uppercase mb-1">Total KM</p>
                                         <p className="text-xs font-bold">{ride.totalDistance} KM</p>
                                     </div>
                                     <div className="p-4 bg-gray-50 rounded-2xl text-center">
                                         <p className="text-[9px] font-black text-gray-400 uppercase mb-1">Earnings</p>
                                         <p className="text-xs font-black text-green-600">₹{ride.offeredPrice.toLocaleString()}</p>
                                     </div>
                                </div>
                            </div>

                            <div className="w-full lg:w-80 space-y-4">
                                <div className="bg-blue-600 rounded-3xl p-6 text-white shadow-lg shadow-blue-100">
                                    <h4 className="text-xs font-black uppercase tracking-widest mb-4 opacity-70">Fleet Requirements</h4>
                                    <div className="space-y-3">
                                        {ride.carsRequired.map((car, idx) => (
                                            <div key={idx} className="flex items-center justify-between border-b border-white/10 pb-2">
                                                <div className="flex items-center gap-3">
                                                    <FaCar className="opacity-50" />
                                                    <span className="text-sm font-bold">{car.category?.name}</span>
                                                </div>
                                                <span className="px-2 py-0.5 bg-white/20 rounded text-[10px] font-black">x{car.quantity}</span>
                                            </div>
                                        ))}
                                    </div>
                                    <button className="w-full mt-6 py-3 bg-white text-blue-600 rounded-xl font-black text-xs hover:bg-gray-100 transition-all">
                                        Assign Drivers & Cars
                                    </button>
                                </div>

                                <div className="p-6 border border-gray-100 rounded-3xl space-y-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-400">
                                            <FaUser />
                                        </div>
                                        <div>
                                            <p className="text-[9px] font-black text-gray-400 uppercase">Booked By</p>
                                            <p className="text-xs font-bold text-gray-900">{ride.createdByModel} Customer</p>
                                        </div>
                                    </div>
                                    <button className="flex items-center gap-2 text-blue-600 font-bold text-xs hover:underline">
                                        <FaPhone size={10} /> Contact Support
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
