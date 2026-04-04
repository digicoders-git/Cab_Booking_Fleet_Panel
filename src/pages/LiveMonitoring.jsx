import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useTheme } from "../context/ThemeContext";
import { useFont } from "../context/FontContext";
import { useAuth } from "../context/AuthContext";
import { driversApi } from "../api/driversApi";
import { carsApi } from "../api/carsApi";
import { assignmentApi } from "../api/assignmentApi";
import { io } from "socket.io-client";
import {
  FaMapMarkedAlt, FaFilter, FaCar, FaUserTie, FaCheckCircle,
  FaTimesCircle, FaMapMarkerAlt, FaSync, FaSearch, FaChevronLeft,
  FaChevronRight, FaTimes, FaPhoneAlt, FaUser
} from "react-icons/fa";
import {
  Activity, Radio, Map as MapIcon, Navigation, Car, Users,
  Signal, MapPin, Search, Filter
} from "lucide-react";
import { toast } from "sonner";

// --- Google Maps Configuration ---
const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

export default function LiveMonitoring() {
  const { themeColors, theme } = useTheme();
  const { currentFont } = useFont();
  const { user } = useAuth();

  // --- States ---
  const [drivers, setDrivers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeSignals, setActiveSignals] = useState(0);
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'online', 'offline'

  // Map Refs
  const mapRef = useRef(null);
  const googleMapRef = useRef(null);
  const markersRef = useRef({}); 
  const socketRef = useRef(null);
  const initialFetchDone = useRef(false); // 🔥 Prevent double toast

  // --- Fetch Initial Data ---
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      // 🔥 Now fetching Directly from the LIVE model API
      const [driversRes, catsRes] = await Promise.all([
        driversApi.getFleetDriversLive(),
        carsApi.getActiveCategories()
      ]);

      const mainDrivers = driversRes.drivers || [];
      const activeCats = catsRes.categories || catsRes.data || [];

      // Link Drivers with their Category Info for easier rendering
      const mappedDrivers = mainDrivers.map(d => {
        // 🔥 Sabse Aggressive mapping - check all possible places for image and name
        const catObj = d.carDetails?.carType || d.carCategory;
        const rawIcon = catObj?.image || catObj?.categoryImage || d.image; // Driver's own image as final fallback
        const rawName = catObj?.name || catObj?.categoryName || "No Car Assigned";
        
        return {
          ...d,
          carImageIcon: rawIcon,
          carCategoryName: rawName,
          activeRideType: d.currentRideType || d.activeRideType || "Idle"
        };
      });

      setDrivers(mappedDrivers);
      setCategories(activeCats);

      // Notify once
      if (!initialFetchDone.current) {
        if (mappedDrivers.length > 0) toast.success(`Monitoring ${mappedDrivers.length} drivers`);
        initialFetchDone.current = true;
      }
    } catch (err) {
      console.error(err);
      toast.error("Live Data load fail!");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // --- Filtering Logic ---
  const filteredDrivers = drivers.filter(d => {
    if (statusFilter === 'online') return d.isOnline === true;
    if (statusFilter === 'offline') return d.isOnline === false;
    return true;
  });

  // --- Google Maps Initialization ---
  useEffect(() => {
    if (!loading && GOOGLE_MAPS_API_KEY && !googleMapRef.current) {
      // Already loaded check
      if (window.google?.maps) {
        const mapOptions = {
          center: { lat: 26.8467, lng: 80.9462 },
          zoom: 12,
          styles: theme === "dark" ? darkMapStyle : [],
          disableDefaultUI: true,
          zoomControl: false,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
        };
        googleMapRef.current = new window.google.maps.Map(mapRef.current, mapOptions);
        return;
      }

      // loading=async fix — best practice
      const script = document.createElement("script");
      script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&loading=async`;
      script.async = true;
      script.defer = true;
      script.onload = () => {
        const mapOptions = {
          center: { lat: 26.8467, lng: 80.9462 },
          zoom: 12,
          styles: theme === "dark" ? darkMapStyle : [],
          disableDefaultUI: true,
          zoomControl: false,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
        };
        googleMapRef.current = new window.google.maps.Map(mapRef.current, mapOptions);
      };
      document.head.appendChild(script);
    }
  }, [loading, theme]);

  // --- Marker Animation Helper ---
  const animateMarker = (marker, newPos) => {
    const startPos = marker.getPosition();
    const latDiff = newPos.lat - startPos.lat();
    const lngDiff = newPos.lng - startPos.lng();
    const startTime = performance.now();
    const duration = 1000; // 1 second sliding

    function step(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      const currentLat = startPos.lat() + (latDiff * progress);
      const currentLng = startPos.lng() + (lngDiff * progress);

      marker.setPosition({ lat: currentLat, lng: currentLng });

      if (progress < 1) {
        requestAnimationFrame(step);
      }
    }
    requestAnimationFrame(step);
  };

  // --- Markers Sync with Filters & Drivers State ---
  useEffect(() => {
    if (!googleMapRef.current || !window.google || loading) return;

    // 1. Visible Markers Update (Smooth sliding & Online/Offline support)
    filteredDrivers.forEach(d => {
      // Location aur Image honi chahiye tabhi dikhega
      if (d.currentLocation?.latitude && d.currentLocation?.longitude && d.carImageIcon) {
        const pos = { lat: parseFloat(d.currentLocation.latitude), lng: parseFloat(d.currentLocation.longitude) };
        
        // Pass isOnline to getCarIcon for visual styling
        const icon = getCarIcon(d.currentHeading || 0, d.isOnline ? '#10B981' : '#94A3B8', d.carImageIcon, d.isOnline);

        if (!icon) return;

        // Agar marker already hai toh move/animate karo
        if (markersRef.current[d._id]) {
          const marker = markersRef.current[d._id];
          const currentPos = marker.getPosition();

          if (Math.abs(currentPos.lat() - pos.lat) > 0.00001 || Math.abs(currentPos.lng() - pos.lng) > 0.00001) {
            animateMarker(marker, pos);
          }
          marker.setIcon(icon);
          marker.setOpacity(d.isOnline ? 1.0 : 0.7); // Offline drivers are slightly faded
        }
        // Naya marker banao
        else {
          const marker = new window.google.maps.Marker({
            position: pos,
            map: googleMapRef.current,
            icon: icon,
            title: d.name,
            optimized: false,
            opacity: d.isOnline ? 1.0 : 0.7
          });
          marker.addListener('click', () => setSelectedDriver(d));
          markersRef.current[d._id] = marker;
        }
      }
    });

    // 2. Cleanup: Jo drivers ab filter mein nahi hain ya image nahi hai, unhe hatao
    Object.keys(markersRef.current).forEach(id => {
      const driver = filteredDrivers.find(d => d._id === id);
      if (!driver || !driver.carImageIcon) {
        markersRef.current[id].setMap(null);
        delete markersRef.current[id];
      }
    });
  }, [filteredDrivers, loading]);

  // --- WebSockets ---
  useEffect(() => {
    if (user?._id) {
      socketRef.current = io(import.meta.env.VITE_API_BASE_URL || "http://localhost:5000");

      socketRef.current.on("connect", () => {
        socketRef.current.emit("join_room", { userId: user._id, role: "fleet" });
      });

      socketRef.current.on("driver_location_update", (data) => {
        setActiveSignals(prev => prev + 1);
        const { driverId, latitude, longitude, heading } = data;

        // Update State (useEffect handle karega marker position change)
        setDrivers(prev => prev.map(d =>
          d._id === driverId
            ? { ...d, currentLocation: { latitude, longitude }, currentHeading: heading, isOnline: true }
            : d
        ));
      });

      return () => {
        socketRef.current.disconnect();
      }
    }
  }, [user?._id]);

  const getCarIcon = (rotation, color, carImage, isOnline) => {
    // Agar image nahi hai toh marker hi mat dikhao
    if (!carImage) return null;

    const baseUrl = `${import.meta.env.VITE_API_BASE_URL || "http://localhost:5000"}/uploads/`;
    
    return {
      url: `${baseUrl}${carImage}`,
      scaledSize: new window.google.maps.Size(46, 46),
      anchor: new window.google.maps.Point(23, 23)
    };
  };


  return (
    <div className="min-h-screen bg-[#F8FAFC]" style={{ fontFamily: currentFont.family }}>

      {/* Map Section - STICKY ON MOBILE, STATIC ON DESKTOP */}
      <div className="h-[45vh] sm:h-[85vh] w-full sticky sm:static top-0 z-30 sm:z-10 shadow-xl bg-white rounded-none sm:rounded-[32px] overflow-hidden border-b sm:border border-slate-200/60 transition-all duration-300">
        <div ref={mapRef} className="w-full h-full bg-slate-200"></div>
        {loading && (
          <div className="absolute inset-0 bg-white/60 backdrop-blur-md flex items-center justify-center z-50">
            <Activity className="text-blue-600 animate-spin" size={32} />
          </div>
        )}
      </div>

      <div className="pt-5 pb-2 px-4 sm:px-6 sm:pt-8 sm:pb-4 mt-2">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <div className="w-2 h-8 bg-blue-600 rounded-full"></div>
              Live Fleet Monitor
            </h1>
            <div className="flex items-center gap-3 text-[11px] font-bold text-slate-400 uppercase tracking-tighter">
              <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-green-500"></div> Online: {drivers.filter(d => d.isOnline).length}</span>
              <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-slate-300"></div> Offline: {drivers.filter(d => !d.isOnline).length}</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Minimal Status Filter */}
            <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
              {[
                { id: 'all', label: 'All' },
                { id: 'online', label: 'Online' },
                { id: 'offline', label: 'Offline' }
              ].map(status => (
                <button
                  key={status.id}
                  onClick={() => setStatusFilter(status.id)}
                  className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                    statusFilter === status.id 
                    ? 'bg-white text-blue-600 shadow-sm border border-slate-200' 
                    : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  {status.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-xl border border-slate-100 group">
              <Radio className="text-green-500 animate-pulse" size={14} />
              <span className="text-[10px] font-black text-slate-500 uppercase">{activeSignals} Live</span>
            </div>
          </div>
        </div>
      </div>

      {/* Control Panel Content */}
      <div className="px-4 sm:px-6 py-4 relative z-10 w-full">
        <div className="space-y-6">
          {/* Drivers Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {filteredDrivers.map(d => (
              <div
                key={d._id} 
                onClick={() => {
                  if (d.currentLocation) googleMapRef.current.panTo({ lat: d.currentLocation.latitude, lng: d.currentLocation.longitude });
                  setSelectedDriver(d);
                }}
                className="bg-white px-3 py-4 sm:p-5 rounded-[28px] sm:rounded-[36px] shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_20px_40px_rgba(0,0,0,0.08)] hover:-translate-y-1 transition-all duration-500 cursor-pointer group relative overflow-hidden border border-slate-100"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50/30 rounded-full -mr-12 -mt-12 group-hover:scale-150 transition-transform duration-700"></div>

                <div className="flex items-center gap-3 relative z-10">
                  <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-blue-600 shrink-0 overflow-hidden shadow-sm">
                    {d.image ? <img src={`${import.meta.env.VITE_API_BASE_URL || "http://localhost:5000"}/uploads/${d.image}`} className="w-full h-full object-cover" /> : <FaUser size={20} />}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <h3 className="font-bold text-slate-900 truncate text-sm">{d.name}</h3>
                      <div className={`w-2 h-2 rounded-full ${d.isOnline ? 'bg-green-500 animate-pulse' : 'bg-slate-300'}`}></div>
                    </div>
                    <p className="text-[10px] font-bold text-slate-400 mb-2 flex items-center gap-1">
                      {d.phone}
                    </p>

                    <div className="flex gap-2">
                      <span className="px-2 py-0.5 rounded-md bg-blue-50 text-[9px] font-black uppercase text-blue-600 border border-blue-100/50">
                        {d.carCategoryName || 'Private'}
                      </span>
                      <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase ${d.activeRideType === 'Idle' ? 'bg-orange-50 text-orange-600 border border-orange-100/50' : 'bg-emerald-50 text-emerald-600 border border-emerald-100/50'}`}>
                        {d.activeRideType}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Driver Detail Modal Overlay - COMPACT PREMIUM DASHBOARD */}
      {selectedDriver && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 animate-in fade-in zoom-in duration-300">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setSelectedDriver(null)}></div>
          
          <div className="bg-white w-full max-w-xl max-h-[85vh] rounded-[32px] shadow-2xl relative z-10 overflow-hidden flex flex-col border border-slate-100">
            {/* Modal Header/Profile Image */}
            <div className="relative h-32 sm:h-36 bg-slate-100 shrink-0">
              {selectedDriver.image ? (
                <img src={`${import.meta.env.VITE_API_BASE_URL || "http://localhost:5000"}/uploads/${selectedDriver.image}`} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-600 to-indigo-700 text-white">
                  <FaUserTie size={50} className="opacity-20" />
                </div>
              )}
              
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 via-transparent to-transparent"></div>

              <div className="absolute top-4 right-4 flex gap-2">
                <button onClick={() => setSelectedDriver(null)} className="p-2 bg-black/20 backdrop-blur-md text-white rounded-full hover:bg-black/40 border border-white/10 transition-all">
                  <FaTimes size={14} />
                </button>
              </div>

              {/* Status & Category Badge Overlay */}
              <div className="absolute bottom-4 left-6 flex items-center gap-2">
                <div className="flex items-center gap-1.5 bg-white px-3 py-1 rounded-full shadow-md border border-slate-50">
                  <div className={`w-2 h-2 rounded-full ${selectedDriver.isOnline ? 'bg-green-500 animate-pulse' : 'bg-slate-300'}`}></div>
                  <span className="text-[9px] font-black uppercase text-slate-800 tracking-tighter">{selectedDriver.isOnline ? 'On Duty' : 'Off Duty'}</span>
                </div>
                <div className="flex items-center gap-1.5 bg-blue-600 text-white px-3 py-1 rounded-full shadow-md border border-blue-400/20">
                  <Car size={10} />
                  <span className="text-[9px] font-black uppercase tracking-widest">{selectedDriver.carCategoryName || 'Fleet'}</span>
                </div>
              </div>
            </div>

            {/* Modal Content - Scrollable Scroll Area */}
            <div className="flex-1 overflow-y-auto p-6 sm:p-8 custom-scrollbar">
              
              {/* Primary Identity Section */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 border-b border-slate-50 pb-6">
                <div>
                  <h2 className="text-xl font-black text-slate-900 mb-1 leading-tight">{selectedDriver.name}</h2>
                  <div className="flex flex-wrap items-center gap-3 text-[11px] font-bold text-slate-400">
                    <span className="flex items-center gap-1.5"><FaPhoneAlt className="text-blue-500" size={10} /> {selectedDriver.phone}</span>
                    <span className="w-0.5 h-0.5 bg-slate-200 rounded-full"></span>
                    <span className="text-xs">{selectedDriver.email}</span>
                  </div>
                </div>
                <button 
                  onClick={() => window.open(`tel:${selectedDriver.phone}`, '_self')}
                  className="bg-blue-600 text-white px-5 py-3 rounded-2xl font-black text-[10px] uppercase tracking-wider hover:bg-blue-700 hover:shadow-xl transition-all active:scale-95"
                >
                  Contact Now
                </button>
              </div>

              {/* Data Dashboard Grid */}
              <div className="space-y-8">
                
                {/* 1. Fleet Performance & Wallet Insights */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  {[
                    { label: 'Rating', val: selectedDriver.rating + '★', col: 'text-orange-500' },
                    { label: 'Trips', val: selectedDriver.totalTrips || 0, col: 'text-blue-600' },
                    { label: 'Wallet', val: '₹' + (selectedDriver.walletBalance || 0), col: 'text-emerald-600' },
                    { label: 'Debt', val: '₹' + (selectedDriver.debtLimit || 0), col: 'text-rose-500' }
                  ].map((item, idx) => (
                    <div key={idx} className="bg-slate-50 border border-slate-100 p-4 rounded-3xl group">
                      <span className="block text-[8px] font-black uppercase text-slate-400 tracking-wider mb-1">{item.label}</span>
                      <p className={`text-sm font-black ${item.col}`}>{item.val}</p>
                    </div>
                  ))}
                </div>

                {/* 2. Detailed Vehicle Information */}
                {selectedDriver.carDetails ? (
                  <div className="bg-slate-900 rounded-[28px] p-5 sm:p-6 text-white relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl -mr-16 -mt-16"></div>
                    
                    <div className="flex items-center gap-4 mb-4 pb-4 border-b border-white/10 relative z-10">
                      <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center backdrop-blur-sm border border-white/20">
                        <Car size={20} className="text-blue-400" />
                      </div>
                      <div>
                        <span className="block text-[8px] font-black text-slate-500 uppercase tracking-widest">Plate Number</span>
                        <p className="text-sm font-black text-blue-400 tracking-wide">{selectedDriver.carDetails.carNumber}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 relative z-10">
                      <div>
                        <span className="block text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Brand</span>
                        <p className="text-xs font-black">{selectedDriver.carDetails.carBrand}</p>
                      </div>
                      <div>
                        <span className="block text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Model</span>
                        <p className="text-xs font-black">{selectedDriver.carDetails.carModel}</p>
                      </div>
                      <div>
                        <span className="block text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Year</span>
                        <p className="text-xs font-black">{selectedDriver.carDetails.manufacturingYear}</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-6 bg-slate-50 rounded-[28px] border border-dashed border-slate-200 text-center">
                    <p className="text-slate-400 font-bold uppercase tracking-widest text-[9px]">No Vehicle info</p>
                  </div>
                )}

                {/* 3. Driver Compliance & Documents */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white border border-slate-100 p-5 rounded-[28px]">
                    <h4 className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-4 flex items-center gap-2">
                       Compliance
                    </h4>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-bold text-slate-500">License</span>
                        <span className="text-[10px] font-black text-slate-900">{selectedDriver.licenseNumber}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-bold text-slate-500">Expiry</span>
                        <span className={`text-[10px] font-black ${new Date(selectedDriver.licenseExpiry) < new Date() ? 'text-rose-500' : 'text-blue-600'}`}>
                          {new Date(selectedDriver.licenseExpiry).toLocaleDateString('en-GB')}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white border border-slate-100 p-5 rounded-[28px]">
                    <h4 className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-4 flex items-center gap-2">
                       Address
                    </h4>
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-slate-700 line-clamp-1">{selectedDriver.address}</p>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-tight">{selectedDriver.city}, {selectedDriver.pincode}</p>
                    </div>
                  </div>
                </div>

              </div>
            </div>

            {/* Modal Bottom Lock Bar */}
            <div className="px-6 py-4 bg-slate-50 shrink-0 border-t border-slate-100 flex items-center justify-between text-slate-400">
              <span className="text-[8px] font-black uppercase tracking-[0.2em]">Fleet Monitor v4.0</span>
              <span className="text-[8px] font-bold">ID: {selectedDriver._id.slice(-6)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const darkMapStyle = [
  { "elementType": "geometry", "stylers": [{ "color": "#242f3e" }] },
  { "featureType": "road", "elementType": "geometry", "stylers": [{ "color": "#38414e" }] },
  { "featureType": "water", "elementType": "geometry", "stylers": [{ "color": "#17263c" }] }
];
