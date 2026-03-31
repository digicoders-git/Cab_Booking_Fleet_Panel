import { memo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaUserCircle, FaBell } from "react-icons/fa";
import { useTheme } from "../context/ThemeContext";
import { useFont } from "../context/FontContext";
import { useAuth } from "../context/AuthContext";
import { notificationApi } from "../api/notificationApi";
import { io } from "socket.io-client";
import { Activity, Radio } from "lucide-react";

const Header = memo(({
  toggleSidebar,
  currentPageTitle
}) => {
  const navigate = useNavigate();
  const { themeColors } = useTheme();
  const { currentFont } = useFont();
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [socketSignals, setSocketSignals] = useState(0);

  // === SOCKET.IO REAL-TIME TRACKING SIGNALS ===
  useEffect(() => {
    if (user?._id) {
       // Backend URL: adjust if needed (loading from .env or using localhost:5000)
       const socket = io("http://localhost:5000");

       socket.on("connect", () => {
         console.log("Header: Connected to Real-time Stream ✅");
         socket.emit("join_room", { userId: user._id, role: "fleet" });
       });

       socket.on("driver_location_update", (data) => {
         setSocketSignals(prev => prev + 1);
       });

       return () => {
         socket.disconnect();
       };
    }
  }, [user?._id]);

  useEffect(() => {
    const fetchUnread = async () => {
      try {
        const data = await notificationApi.getMyNotifications();
        if (data.success) {
          const count = data.notifications?.filter(n => !n.read).length || 0;
          setUnreadCount(count);
        }
      } catch (err) {
        console.error("Header notification fetch fail:", err);
      }
    };

    fetchUnread();
    const interval = setInterval(fetchUnread, 30000); // 30s polling
    return () => clearInterval(interval);
  }, []);

  return (
    <header
      className="h-16 flex items-center justify-between px-4 border-b backdrop-blur-sm sticky top-0 z-40"
      style={{
        backgroundColor: themeColors.surface,
        borderColor: themeColors.border,
      }}
    >
      <div className="flex items-center min-w-0 flex-1">
        <button
          onClick={toggleSidebar}
          className="lg:hidden mr-3 p-1.5 rounded-md hover:scale-110 transition-all duration-200"
          style={{
            color: themeColors.text,
            backgroundColor: themeColors.background
          }}
          aria-label="Open sidebar"
        >
          <span className="text-base">☰</span>
        </button>
        <h2
          className="text-sm font-semibold truncate"
          style={{
            color: themeColors.text,
            fontFamily: currentFont.family
          }}
        >
          Welcome back, {user?.name || 'Administrator'}! 👋 | Fleet Owner 👑🚀
        </h2>
      </div>

      <div className="flex items-center space-x-5 mr-5">
        {/* LIVE SIGNALS COUNTER */}
        <div 
          className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full border bg-green-50/50 border-green-100 shadow-sm"
          title="Live Driver Location Updates Received"
        >
          <div className="relative">
            <Radio className="text-green-600 animate-pulse" size={16} />
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-green-500 rounded-full border border-white"></span>
          </div>
          <div className="flex flex-col">
            <span className="text-[9px] font-black text-green-700 uppercase leading-none">Live Signals</span>
            <span className="text-xs font-black text-gray-900 leading-none mt-0.5">
              {socketSignals.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Notification Button */}
        <button
          onClick={() => navigate("/notifications")}
          className="p-2.5 rounded-lg border hover:scale-105 transition-all duration-300 relative group shadow-sm hover:shadow-md"
          style={{
            backgroundColor: themeColors.background,
            color: themeColors.text,
            borderColor: themeColors.border,
          }}
          aria-label="View Notifications"
          title="Notifications"
        >
          <FaBell className="text-lg group-hover:rotate-12 transition-transform duration-300" />
          {unreadCount > 0 && (
            <span
              className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 border-2"
              style={{ borderColor: themeColors.surface }}
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>

        {/* Profile Button */}
        <button
          onClick={() => navigate("/profile")}
          className="p-2.5 px-6 rounded-lg border hover:scale-105 transition-all duration-300 flex items-center gap-3 group shadow-sm hover:shadow-md"
          style={{
            backgroundColor: themeColors.background,
            color: themeColors.text,
            borderColor: themeColors.border,
          }}
          aria-label="View Profile"
          title="My Profile"
        >
          <FaUserCircle className="text-lg group-hover:scale-110 transition-transform duration-300" />
          <span className="hidden sm:inline text-xs font-semibold">Profile</span>
        </button>
      </div>
    </header>
  );
});

Header.displayName = 'Header';
export default Header;