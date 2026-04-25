import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import { getMyBulkRides, assignDriverToBulk } from "../api/bulkBookingApi";
import { assignmentApi } from "../api/assignmentApi";
import { toast } from "sonner";
import {
    FaCar, FaArrowRight, FaTruck, FaPhone, FaUser,
    FaCalendarAlt, FaRoad, FaCheckCircle, FaClock, FaLayerGroup, FaTimes, FaPlusCircle
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
    const [assignments, setAssignments] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [selectedRide, setSelectedRide] = useState(null);
    const [selectedPairs, setSelectedPairs] = useState([]); // Array of { driverId, carId }
    const [assigning, setAssigning] = useState(false);
    const [activeTab, setActiveTab] = useState("pending"); // "pending" or "assigned"
    const { themeColors } = useTheme();

    useEffect(() => { 
        fetchRides();
        fetchFleetAssignments();
    }, []);

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

    const fetchFleetAssignments = async () => {
        try {
            const res = await assignmentApi.getAllAssignments();
            if (res.success) setAssignments(res.assignments || []);
        } catch (err) {
            console.error("Failed to load assignments", err);
        }
    };

    const handleOpenAssignModal = (ride) => {
        setSelectedRide(ride);
        // Pre-fill with existing assignments so they don't get lost
        const existing = (ride.assignedDrivers || []).map(d => ({
            driverId: d.driver?._id,
            carId: d.car?._id
        }));
        setSelectedPairs(existing); 
        setShowModal(true);
    };

    const toggleSelection = (driverId, carId) => {
        setSelectedPairs(prev => {
            const exists = prev.find(p => p.driverId === driverId);
            if (exists) {
                return prev.filter(p => p.driverId !== driverId);
            } else {
                return [...prev, { driverId, carId }];
            }
        });
    };

    const handleConfirmBulkAssign = async () => {
        if (selectedPairs.length === 0) return toast.error("Please select at least one driver.");
        
        try {
            setAssigning(true);
            const res = await assignDriverToBulk(selectedRide._id, { assignments: selectedPairs });
            if (res.success) {
                toast.success(res.message || "Assignments confirmed!");
                fetchRides(); // Refresh list
                setShowModal(false);
            }
        } catch (err) {
            toast.error(err.message || "Failed to assign drivers");
        } finally {
            setAssigning(false);
        }
    };

    // Filter rides based on tab
    const pendingRides = rides.filter(r => (r.assignedDrivers || []).length === 0);
    const assignedRides = rides.filter(r => (r.assignedDrivers || []).length > 0);
    const displayedRides = activeTab === "pending" ? pendingRides : assignedRides;

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
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: themeColors.text }}>
                        <FaLayerGroup style={{ color: themeColors.primary }} />
                        My Bulk Assignments
                    </h1>
                    <p className="text-sm mt-0.5" style={{ color: themeColors.textSecondary }}>
                        Manage your confirmed fleet jobs and driver allocations
                    </p>
                </div>
                
                {/* Tabs */}
                <div className="flex bg-gray-100 p-1 rounded-xl w-fit">
                    <button 
                        onClick={() => setActiveTab("pending")}
                        className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === "pending" ? 'bg-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                        style={activeTab === "pending" ? { color: themeColors.primary } : {}}
                    >
                        Pending ({pendingRides.length})
                    </button>
                    <button 
                        onClick={() => setActiveTab("assigned")}
                        className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === "assigned" ? 'bg-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                        style={activeTab === "assigned" ? { color: themeColors.primary } : {}}
                    >
                        Assigned ({assignedRides.length})
                    </button>
                </div>
            </div>

            {/* Empty State */}
            {displayedRides.length === 0 ? (
                <div
                    className="rounded-2xl border-2 border-dashed p-16 flex flex-col items-center justify-center text-center"
                    style={{ borderColor: themeColors.border, backgroundColor: themeColors.surface }}
                >
                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ backgroundColor: themeColors.background }}>
                        <FaTruck size={28} style={{ color: themeColors.textSecondary, opacity: 0.4 }} />
                    </div>
                    <h3 className="text-lg font-bold mb-1" style={{ color: themeColors.text }}>
                        No {activeTab} assignments
                    </h3>
                    <p className="text-sm" style={{ color: themeColors.textSecondary }}>
                        {activeTab === "pending" ? "All your accepted rides are fully assigned." : "Assign drivers to your accepted rides to see them here."}
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    {displayedRides.map((ride) => {
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
                                    <div className="flex items-center gap-3">
                                        <span
                                            className="px-3 py-1 rounded-full text-xs font-bold"
                                            style={{ backgroundColor: status.bg, color: status.color }}
                                        >
                                            {status.label}
                                        </span>
                                        <span
                                            className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${ride.tripType === 'RoundTrip' ? 'bg-green-500/10 text-green-600 border-green-500/20' : 'bg-gray-100 text-gray-500 border-gray-200'}`}
                                        >
                                            {ride.tripType === 'RoundTrip' ? 'Round Trip' : 'One Way'}
                                        </span>
                                    </div>
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
                                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
                                            {[
                                                { icon: FaCalendarAlt, label: "Start Date", value: new Date(ride.pickupDateTime).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) },
                                                { 
                                                    icon: FaCalendarAlt, 
                                                    label: "Return Date", 
                                                    value: ride.tripType === 'RoundTrip' && ride.returnDateTime 
                                                        ? new Date(ride.returnDateTime).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) 
                                                        : "N/A",
                                                    isHidden: ride.tripType !== 'RoundTrip' 
                                                },
                                                { icon: FaClock, label: "Duration", value: `${ride.numberOfDays} Days` },
                                                { icon: FaRoad, label: "Total KM", value: `${ride.totalDistance} KM` },
                                                { icon: FaCheckCircle, label: "Earnings", value: `₹${ride.offeredPrice?.toLocaleString("en-IN")}`, highlight: true },
                                            ].filter(item => !item.isHidden).map(({ icon: Icon, label, value, highlight }) => (
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

                                        {/* Fleet Requirements / Assignment Box */}
                                        {(() => {
                                            const totalRequired = ride.carsRequired?.reduce((sum, c) => sum + (c.quantity || 0), 0) || 0;
                                            const currentAssigned = (ride.assignedDrivers || []).length;
                                            const isFullyAssigned = currentAssigned >= totalRequired;

                                            if (isFullyAssigned) {
                                                return (
                                                    <div 
                                                        className="rounded-xl p-4 border-2 border-dashed flex flex-col items-center justify-center text-center gap-2"
                                                        style={{ backgroundColor: `${themeColors.success}10`, borderColor: themeColors.success }}
                                                    >
                                                        <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                                                            <FaCheckCircle className="text-green-600" size={20} />
                                                        </div>
                                                        <div>
                                                            <p className="text-xs font-black uppercase tracking-widest text-green-700">Fully Assigned</p>
                                                            <p className="text-[10px] text-green-600 font-medium">{currentAssigned} of {totalRequired} assets ready</p>
                                                        </div>
                                                    </div>
                                                );
                                            }

                                            return (
                                                <div
                                                    className="rounded-xl p-4 space-y-3 shadow-lg shadow-blue-500/10"
                                                    style={{ backgroundColor: themeColors.primary }}
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <p className="text-[10px] font-bold uppercase tracking-wider text-white opacity-70">Fleet Requirements</p>
                                                        <span className="text-[10px] font-bold text-white bg-white/20 px-2 py-0.5 rounded-full">{currentAssigned}/{totalRequired}</span>
                                                    </div>
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
                                                    <button 
                                                        onClick={() => handleOpenAssignModal(ride)}
                                                        className="w-full py-2.5 bg-white rounded-lg text-xs font-bold transition-all hover:bg-gray-100 hover:scale-[1.02] active:scale-95" style={{ color: themeColors.primary }}
                                                    >
                                                        Assign Drivers & Cars
                                                    </button>
                                                </div>
                                            );
                                        })()}

                                        {/* Customer Info */}
                                        <div
                                            className="rounded-xl p-4 border flex items-center justify-between transition-all hover:border-gray-300"
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

                                {/* Assigned Drivers Display */}
                                {ride.assignedDrivers && ride.assignedDrivers.length > 0 && (
                                    <div className="px-6 pb-6 pt-0 border-t" style={{ borderColor: themeColors.border }}>
                                        <div className="mt-4 space-y-3">
                                            <div className="flex items-center justify-between">
                                                <p className="text-xs font-bold uppercase tracking-widest" style={{ color: themeColors.textSecondary }}>Assigned Assets ({ride.assignedDrivers.length})</p>
                                                {ride.assignedDrivers.length < (ride.carsRequired?.reduce((s,c) => s + (c.quantity||0), 0) || 0) && (
                                                    <button 
                                                        onClick={() => handleOpenAssignModal(ride)}
                                                        className="text-[10px] font-bold text-blue-500 hover:underline flex items-center gap-1"
                                                    >
                                                        <FaPlusCircle /> Add More
                                                    </button>
                                                )}
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                                {ride.assignedDrivers.map((item, idx) => (
                                                    <div key={idx} className="flex items-center justify-between p-3 rounded-xl border group hover:border-red-100 transition-all shadow-sm relative" style={{ backgroundColor: themeColors.background, borderColor: themeColors.border }}>
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center overflow-hidden">
                                                                {item.driver?.image ? (
                                                                    <img src={`${import.meta.env.VITE_API_BASE_URL || "http://localhost:5000"}/uploads/${item.driver.image}`} alt="" className="w-full h-full object-cover" />
                                                                ) : (
                                                                    <FaUser size={12} className="text-blue-500" />
                                                                )}
                                                            </div>
                                                            <div>
                                                                <p className="text-xs font-bold" style={{ color: themeColors.text }}>{item.driver?.name}</p>
                                                                <p className="text-[10px] text-gray-500">{item.driver?.phone}</p>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-3 text-right">
                                                            <div>
                                                                <p className="text-xs font-bold" style={{ color: themeColors.text }}>{item.car?.carNumber}</p>
                                                                <p className="text-[10px] text-gray-500">{item.car?.carModel}</p>
                                                            </div>
                                                            {/* Remove Button - Only if status is Pending */}
                                                            {item.status === 'Pending' && (
                                                                <button 
                                                                    onClick={async () => {
                                                                        const result = await Swal.fire({
                                                                            title: '<span class="text-xl font-black text-gray-800 uppercase tracking-tight">Remove Driver?</span>',
                                                                            html: `<p class="text-sm text-gray-500">Are you sure you want to remove <b class="text-blue-600">${item.driver?.name}</b> from this assignment?</p>`,
                                                                            icon: 'warning',
                                                                            showCancelButton: true,
                                                                            confirmButtonText: 'Yes, Remove Him',
                                                                            cancelButtonText: 'No, Keep Him',
                                                                            confirmButtonColor: '#ef4444',
                                                                            cancelButtonColor: '#f3f4f6',
                                                                            customClass: {
                                                                                popup: 'rounded-[2rem] p-8 border border-gray-100 shadow-2xl',
                                                                                confirmButton: 'rounded-2xl px-6 py-3 font-bold text-xs uppercase tracking-widest transition-all hover:scale-105',
                                                                                cancelButton: 'rounded-2xl px-6 py-3 font-bold text-xs uppercase tracking-widest text-gray-400'
                                                                            },
                                                                            buttonsStyling: true
                                                                        });

                                                                        if (result.isConfirmed) {
                                                                            const remaining = ride.assignedDrivers
                                                                                .filter(d => d.driver?._id !== item.driver?._id)
                                                                                .map(d => ({ driverId: d.driver?._id, carId: d.car?._id }));
                                                                            
                                                                            try {
                                                                                const res = await assignDriverToBulk(ride._id, { assignments: remaining });
                                                                                if (res.success) {
                                                                                    Swal.fire({
                                                                                        icon: 'success',
                                                                                        title: 'Removed!',
                                                                                        text: 'Driver has been removed from this assignment.',
                                                                                        timer: 1500,
                                                                                        showConfirmButton: false,
                                                                                        customClass: { popup: 'rounded-3xl' }
                                                                                    });
                                                                                    fetchRides();
                                                                                }
                                                                            } catch (err) {
                                                                                toast.error(err.message || "Failed to remove driver");
                                                                            }
                                                                        }
                                                                    }}
                                                                    className="w-8 h-8 rounded-lg bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all shadow-sm"
                                                                    title="Remove Driver"
                                                                >
                                                                    <FaTimes size={10} />
                                                                </button>
                                                            )}
                                                            {item.status !== 'Pending' && (
                                                                <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center">
                                                                    <FaCar size={12} className="text-green-500" />
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Assignment Modal */}
            {showModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div 
                        className="w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden"
                        style={{ backgroundColor: themeColors.surface }}
                    >
                        {/* Modal Header */}
                        <div className="px-6 py-4 border-b flex items-center justify-between" style={{ borderColor: themeColors.border }}>
                            <div>
                                <h2 className="text-lg font-bold" style={{ color: themeColors.text }}>Assign Drivers & Cars</h2>
                                {selectedPairs.length > 0 && (
                                    <p className="text-[10px] font-bold text-blue-500 uppercase tracking-widest">{selectedPairs.length} selected</p>
                                )}
                            </div>
                            <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-full transition-all">
                                <FaTimes style={{ color: themeColors.textSecondary }} />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6 max-h-[60vh] overflow-y-auto space-y-4">
                            <div className="space-y-3">
                                {(() => {
                                    const requestedCategoryIds = selectedRide?.carsRequired?.map(r => r.category?._id || r.category) || [];
                                    const filteredAssignments = assignments.filter(a => {
                                        if (!a.isAssigned) return false;
                                        const carCategory = a.carId?.carType?._id || a.carId?.carType;
                                        return requestedCategoryIds.includes(carCategory);
                                    });

                                    if (filteredAssignments.length === 0) {
                                        return <div className="text-center py-10 text-gray-500">No matching cars found in your fleet.</div>;
                                    }

                                    return filteredAssignments.map((item) => {
                                        const isSelected = selectedPairs.some(p => p.driverId === item.driverId?._id);
                                        
                                        return (
                                            <div 
                                                key={item._id}
                                                className={`p-4 rounded-xl border flex items-center justify-between transition-all cursor-pointer ${isSelected ? 'border-blue-500 bg-blue-50/30' : 'hover:border-gray-400'}`}
                                                style={{ borderColor: isSelected ? themeColors.primary : themeColors.border }}
                                                onClick={() => toggleSelection(item.driverId?._id, item.carId?._id)}
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden">
                                                        {item.driverId?.image ? (
                                                            <img src={`${import.meta.env.VITE_API_BASE_URL || "http://localhost:5000"}/uploads/${item.driverId.image}`} alt="" className="w-full h-full object-cover" />
                                                        ) : (
                                                            <FaUser className="text-gray-400" />
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-bold" style={{ color: themeColors.text }}>{item.driverName}</p>
                                                        <p className="text-[10px] text-gray-500 font-bold">{item.carNumber}</p>
                                                        <span className="text-[9px] px-1.5 bg-gray-100 rounded text-gray-500 font-bold uppercase">{item.carId?.carType?.name}</span>
                                                    </div>
                                                </div>
                                                {isSelected ? (
                                                    <FaCheckCircle className="text-blue-500" size={20} />
                                                ) : (
                                                    <div className="w-5 h-5 rounded-full border-2" style={{ borderColor: themeColors.border }} />
                                                )}
                                            </div>
                                        );
                                    });
                                })()}
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="px-6 py-4 bg-gray-50 border-t flex items-center justify-between gap-3" style={{ borderColor: themeColors.border }}>
                            <button 
                                onClick={() => setShowModal(false)}
                                className="px-4 py-2 text-sm font-bold text-gray-500 hover:text-gray-700"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={handleConfirmBulkAssign}
                                disabled={assigning || selectedPairs.length === 0}
                                className="flex-1 py-2.5 rounded-xl text-white font-bold text-sm shadow-lg shadow-blue-500/30 disabled:opacity-50 transition-all hover:scale-[1.02] active:scale-95"
                                style={{ backgroundColor: themeColors.primary }}
                            >
                                {assigning ? "Assigning..." : `Confirm Assignment (${selectedPairs.length})`}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
