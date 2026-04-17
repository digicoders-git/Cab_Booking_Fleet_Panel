// src/components/DashboardLayout.jsx
import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { useFont } from "../context/FontContext";
import { useLocation, useNavigate, Outlet } from "react-router-dom";
import routes from ".././route/SidebarRaoute";
import Sidebar from "../pages/Sidebar";
import Header from "./Header";
import { fleetApi } from "../api/fleetApi";
import { requestForToken, onMessageListener } from "../firebase";
import { toast } from "sonner";

const DashboardLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // ✅ Auth: user object + logout
  const { user, logout } = useAuth();

  const { themeColors, toggleTheme, palette, changePalette } = useTheme();
  const { currentFont, corporateFonts, changeFont } = useFont();
  const location = useLocation();
  const navigate = useNavigate();
  const mainRef = useRef(null);

  // Reset scroll to top on route change
  useEffect(() => {
    if (mainRef.current) {
      mainRef.current.scrollTo(0, 0);
    }
  }, [location.pathname]);

  const currentPageTitle = useMemo(() => {
    const allRoutes = routes.flatMap(r => r.children || r);
    return allRoutes.find((route) => route.path === location.pathname)?.name || "Dashboard";
  }, [location.pathname]);

  const toggleSidebar = useCallback(() => setSidebarOpen((prev) => !prev), []);
  const closeSidebar = useCallback(() => setSidebarOpen(false), []);

  // ✅ Logout handler: context clear + redirect to /login
  const handleLogout = useCallback(() => {
    logout();
    navigate("/login", { replace: true });
  }, [logout, navigate]);

  // --- FCM TOKEN REGISTRATION ---
  useEffect(() => {
    const fleetId = user?._id || user?.id;
    if (!fleetId) return;

    const setupFCM = async (retries = 3) => {
      try {
        if ('serviceWorker' in navigator) {
          await navigator.serviceWorker.ready;
        }
        const token = await requestForToken();
        if (token) {
          await fleetApi.updateFcmToken(token);
          console.log("🚀 Fleet FCM Token synchronized with backend");
        } else if (retries > 0) {
          console.log(`⚠️ Token not received, retrying... (${retries} left)`);
          setTimeout(() => setupFCM(retries - 1), 5000);
        }
      } catch (error) {
        console.error("Fleet FCM Registration failed:", error);
      }
    };

    setupFCM();

    // Foreground notification listener
    const unsubscribe = onMessageListener((payload) => {
        console.log("🔔 Fleet Push Notification received:", payload);
        toast.info(payload.notification.title, {
            description: payload.notification.body,
            style: { background: '#2563eb', color: '#fff' }
        });
    });

    return () => {
      if (unsubscribe && typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, [user?._id]);

  return (
    <div
      className="flex h-screen overflow-hidden"
      style={{
        backgroundColor: themeColors.background,
        fontFamily:
          currentFont.family ||
          'var(--app-font, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif)',
      }}
    >
      {/* Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={closeSidebar}
        routes={routes}
        currentPath={location.pathname}
        user={user}
        logout={handleLogout}
        themeColors={themeColors}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <Header
          toggleSidebar={toggleSidebar}
          currentPageTitle={currentPageTitle}
          themeColors={themeColors}
          currentFont={currentFont}
          corporateFonts={corporateFonts}
          changeFont={changeFont}
          palette={palette}
          changePalette={changePalette}
          toggleTheme={toggleTheme}
        />

        {/* Page Content */}
        <main
          ref={mainRef}
          className={`flex-1 overflow-y-auto ${location.pathname === "/live-monitoring" ? "p-0 sm:p-6" : "p-0 sm:p-6"}`}
          style={{ backgroundColor: themeColors.background }}
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;