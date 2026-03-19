import { memo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaUserCircle, FaBell } from "react-icons/fa";
import { useTheme } from "../context/ThemeContext";
import { useFont } from "../context/FontContext";
import { useAuth } from "../context/AuthContext";
import { notificationApi } from "../api/notificationApi";

const Header = memo(({
  toggleSidebar,
  currentPageTitle
}) => {
  const navigate = useNavigate();
  const { themeColors } = useTheme();
  const { currentFont } = useFont();
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

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