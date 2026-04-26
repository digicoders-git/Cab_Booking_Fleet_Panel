import React, { useState, useEffect } from "react";
import { getBulkMarketplace, acceptBulkBooking, verifyBulkPayment } from "../api/bulkBookingApi";
import { toast } from "sonner";
import Swal from "sweetalert2";
import {
    FaCar, FaCalendarAlt, FaWallet, FaClock, FaChevronRight,
    FaExclamationCircle, FaArrowRight, FaTruck, FaPhone, FaUser, FaRoad, FaDownload
} from "react-icons/fa";
import { useTheme } from "../context/ThemeContext";
import jsPDF from "jspdf";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

// --- Helper: Load Razorpay Script ---
const loadRazorpay = () => {
    return new Promise((resolve) => {
        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
    });
};

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

    const generateReceipt = (booking) => {
        const doc = new jsPDF();
        const logoUrl = "/logo.png";
        
        doc.setDrawColor(0);
        doc.setLineWidth(0.5);
        doc.rect(5, 5, 200, 287); 

        const img = new Image();
        img.src = logoUrl;
        doc.saveGraphicsState();
        doc.setGState(new doc.GState({ opacity: 0.05 }));
        doc.addImage(img, 'PNG', 45, 110, 120, 120);
        doc.restoreGraphicsState();
        
        doc.line(5, 15, 205, 15);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);
        doc.text("PAN: GWKPS6928H", 10, 11);
        doc.text("SECURITY DEPOSIT RECEIPT", 155, 11);
        
        const topLogo = new Image();
        topLogo.src = logoUrl;
        doc.addImage(topLogo, 'PNG', 92, 18, 25, 25); 
        
        doc.setFontSize(28);
        doc.setTextColor(0, 0, 0);
        doc.text("KWIK CABS", 105, 52, { align: "center" });
        
        doc.setFontSize(8);
        doc.setFont("helvetica", "normal");
        doc.text("Arun Bhawan Kalu Kuwan Baberu Road, Banda UP", 105, 59, { align: "center" });
        doc.text("MOB : +91 7310221010", 105, 64, { align: "center" });
        
        doc.line(5, 72, 205, 72);
        doc.line(125, 72, 125, 125); 
        
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.text("FLEET OWNER DETAILS (PAYER)", 15, 80);
        doc.setLineWidth(0.2);
        doc.line(15, 81, 75, 81); 
        
        doc.setFontSize(9);
        doc.text("Name :", 10, 89);
        doc.setFont("helvetica", "normal");
        
        let fleetData = {};
        try {
            fleetData = JSON.parse(localStorage.getItem('fleet-data') || localStorage.getItem('admin-data') || '{}');
        } catch (e) {}

        const fleetName = fleetData.companyName || fleetData.name || 'Fleet Owner';
        const fleetPhone = fleetData.phone || 'N/A';
        const fleetEmail = fleetData.email || 'N/A';

        doc.text(`${fleetName}`, 25, 89);
        
        doc.setFont("helvetica", "bold");
        doc.text("Phone :", 10, 97);
        doc.setFont("helvetica", "normal");
        doc.text(`${fleetPhone}`, 25, 97);
        
        doc.setFont("helvetica", "bold");
        doc.text("Email :", 10, 105);
        doc.setFont("helvetica", "normal");
        doc.text(`${fleetEmail}`, 25, 105);
        
        doc.setFont("helvetica", "bold");
        doc.text("Pickup :", 10, 113);
        doc.setFont("helvetica", "normal");
        const pickupAddr = booking.pickup?.address || 'N/A';
        doc.text(`${pickupAddr.slice(0, 55)}${pickupAddr.length > 55 ? '...' : ''}`, 25, 113);
        
        doc.setFont("helvetica", "bold");
        doc.text("Drop :", 10, 121);
        doc.setFont("helvetica", "normal");
        const dropAddr = booking.drop?.address || 'N/A';
        doc.text(`${dropAddr.slice(0, 55)}${dropAddr.length > 55 ? '...' : ''}`, 25, 121);
        
        doc.setFont("helvetica", "bold");
        doc.text(`Receipt No. : SEC/${booking._id?.toString().slice(-3).toUpperCase() || 'NEW'}`, 130, 80);
        doc.text(`Date : ${new Date().toLocaleDateString('en-GB')}`, 130, 87);
        doc.text(`Pickup Date : ${new Date(booking.pickupDateTime).toLocaleDateString('en-GB')}`, 130, 94);
        
        if (booking.tripType === 'RoundTrip' && booking.returnDateTime) {
            doc.text(`Return Date : ${new Date(booking.returnDateTime).toLocaleDateString('en-GB')}`, 130, 101);
        } else {
            doc.text(`Duration : ${booking.numberOfDays} Day(s)`, 130, 101);
        }
        
        doc.text(`Trip Type : ${booking.tripType}`, 130, 108);
        doc.text(`Total Deal : INR ${booking.offeredPrice?.toLocaleString()}`, 130, 115);
        doc.text(`Booking ID : #${booking._id?.toString().slice(-8).toUpperCase()}`, 130, 122);
        
        const tableTop = 125;
        doc.line(5, tableTop, 205, tableTop);
        doc.line(5, tableTop + 10, 205, tableTop + 10);
        
        doc.setFont("helvetica", "bold");
        doc.text("S. NO.", 8, tableTop + 7);
        doc.text("Description", 70, tableTop + 7, { align: "center" });
        doc.text("Qty.", 150, tableTop + 7);
        doc.text("Amount", 185, tableTop + 7);
        
        const tableBottom = 230;
        doc.line(18, tableTop, 18, tableBottom);
        doc.line(145, tableTop, 145, tableBottom);
        
        let currentY = tableTop + 17;
        doc.setFont("helvetica", "normal");
        doc.text("1", 11, currentY);
        doc.text(`Security Deposit for Bulk Booking Deal (20%)`, 25, currentY);
        doc.text("1", 152, currentY);
        
        const securityAmount = Math.round(booking.offeredPrice * 0.20);
        doc.setFont("helvetica", "bold");
        doc.text(`${securityAmount.toLocaleString()}`, 185, currentY);
        doc.line(5, currentY + 3, 205, currentY + 3); 
        
        for(let i = currentY + 10; i < tableBottom; i += 10) {
            doc.line(5, i, 205, i);
        }
        doc.line(5, tableBottom, 205, tableBottom);
        
        doc.setFont("helvetica", "bold");
        doc.text("TOTAL SECURITY PAID", 110, tableBottom + 10);
        doc.text(`INR ${securityAmount.toLocaleString()}`, 180, tableBottom + 10);
        doc.line(100, tableBottom + 13, 205, tableBottom + 13);
        
        doc.setFontSize(8);
        doc.setFont("helvetica", "normal");
        doc.text(`* This amount is non-refundable security deposit for accepting the marketplace deal.`, 10, tableBottom + 25);
        doc.text(`* Final settlement will happen after trip completion.`, 10, tableBottom + 30);
        
        doc.setFont("helvetica", "bold");
        doc.text("For KWIK CABS", 150, tableBottom + 50);
        doc.line(140, tableBottom + 75, 200, tableBottom + 75);
        doc.text("Authorized Signatory", 155, tableBottom + 82);
        
        doc.save(`KwikCabs_Security_${booking._id?.toString().slice(-6) || 'Fleet'}.pdf`);
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
                
                if (res.success && res.securityAmount) {
                    // 💳 TRIGGER RAZORPAY
                    const sdkLoaded = await loadRazorpay();
                    if (!sdkLoaded) {
                        toast.error("Razorpay SDK failed to load");
                        return;
                    }

                    const options = {
                        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
                        amount: res.securityAmount * 100, // paise
                        currency: "INR",
                        name: "Fleet Security Payment",
                        description: `20% Security for Deal ${deal._id}`,
                        handler: async (response) => {
                            console.log("✅ Fleet Razorpay Success:", response);
                            try {
                                const verifyRes = await verifyBulkPayment({
                                    bookingId: deal._id,
                                    paymentId: response.razorpay_payment_id,
                                    type: 'security'
                                });
                                console.log("📡 Backend Security Verification:", verifyRes);
                                if (verifyRes.success) {
                                    toast.success("Security Paid! Deal assigned to you.");
                                    generateReceipt(deal);
                                    fetchDeals();
                                } else {
                                    toast.error(verifyRes.message || "Verification failed");
                                }
                            } catch (err) {
                                console.error("❌ Verification Error:", err);
                                toast.error("Payment verification failed");
                            }
                        },
                        prefill: {
                            name: "Fleet Owner",
                        },
                        theme: { color: themeColors.primary },
                        modal: {
                            onDismiss: function() {
                                console.log("⚠️ RAZORPAY STATUS: CANCELLED (Modal Dismissed)");
                                toast.info("Payment cancelled");
                            }
                        }
                    };

                    const rzp = new window.Razorpay(options);
                    
                    rzp.on('payment.failed', function (response) {
                        console.log("❌ RAZORPAY STATUS: FAILED");
                        console.error("Reason:", response.error.description);
                        console.error("Error Code:", response.error.code);
                    });

                    console.log("🚀 RAZORPAY STATUS: MODAL OPENING...");
                    rzp.open();
                } else if (res.success) {
                    toast.success("Deal Accepted Successfully!");
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
                                        {deal.tripType === 'RoundTrip' ? 'Round Trip Package' : 'One Way Package'}
                                    </p>
                                </div>
                            </div>

                            {/* Trip Type Badge Bar */}
                            {deal.tripType === 'RoundTrip' && (
                                <div className="px-5 py-2 bg-green-500/5 border-b flex items-center gap-2" style={{ borderColor: themeColors.border }}>
                                    <span className="text-[9px] font-black uppercase tracking-widest text-green-600 bg-green-100 px-2 py-0.5 rounded">
                                        Round Trip Deal
                                    </span>
                                    <span className="text-[9px] text-green-700 font-bold italic">
                                        *Price includes return journey and stay
                                    </span>
                                </div>
                            )}

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

                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                    {[
                                        { icon: FaCalendarAlt, label: "Start Date", value: new Date(deal.pickupDateTime).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) },
                                        { 
                                            icon: FaCalendarAlt, 
                                            label: "Return Date", 
                                            value: deal.tripType === 'RoundTrip' && deal.returnDateTime 
                                                ? new Date(deal.returnDateTime).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) 
                                                : "N/A",
                                            isHidden: deal.tripType !== 'RoundTrip'
                                        },
                                        { icon: FaClock, label: "Duration", value: `${deal.numberOfDays} Days` },
                                        { icon: FaRoad, label: "Distance", value: `${deal.totalDistance} KM` },
                                    ].filter(item => !item.isHidden).map(({ icon: Icon, label, value }) => (
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
