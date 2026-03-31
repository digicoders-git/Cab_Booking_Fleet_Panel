// src/pages/Sidebar.jsx
import { Link } from "react-router-dom";
import { memo, useState } from "react";
import {
  FaSignOutAlt,
  FaTimes,
  FaUserCircle,
  FaChevronDown,
  FaChevronRight
} from "react-icons/fa";

const SidebarItem = memo(({ route, isActive, themeColors, onClose, currentPath, isExpanded }) => {
  const IconComponent = route.icon;
  const hasChildren = route.children && route.children.length > 0;
  const [isOpen, setIsOpen] = useState(() => {
    // Auto-open if child is active
    if (!hasChildren) return false;
    return route.children.some(child => currentPath === child.path || currentPath.startsWith(child.path + "/"));
  });

  // Toggle for parent items
  const handleToggle = (e) => {
    e.preventDefault();
    setIsOpen(!isOpen);
  };

  if (hasChildren) {
    return (
      <div className="mb-1">
        <div
          onClick={handleToggle}
          className={`flex items-center justify-between px-4 py-3 rounded-lg cursor-pointer transition-all duration-200 ${isActive ? "shadow-md" : "hover:shadow-sm"
            }`}
          style={{
            color: isActive ? themeColors.primary : themeColors.text,
            backgroundColor: isActive
              ? themeColors.active?.background || `${themeColors.primary}15`
              : "transparent",
            border: isActive ? `1px solid ${themeColors.primary}30` : "1px solid transparent",
          }}
          onMouseEnter={(e) => {
            if (!isActive) {
              e.currentTarget.style.backgroundColor =
                themeColors.hover?.background || `${themeColors.primary}10`;
              e.currentTarget.style.borderColor = `${themeColors.primary}20`;
            }
          }}
          onMouseLeave={(e) => {
            if (!isActive) {
              e.currentTarget.style.backgroundColor = "transparent";
              e.currentTarget.style.borderColor = "transparent";
            }
          }}
        >
          <div className="flex items-center min-w-0">
            <div className="min-w-[40px] flex-shrink-0 flex justify-center">
              <IconComponent
                className="text-lg transition-colors duration-200"
                style={{
                  color: isActive ? themeColors.primary : themeColors.textSecondary,
                }}
              />
            </div>
            <span 
              className={`font-medium text-sm transition-all duration-300 whitespace-nowrap overflow-hidden ${
                isExpanded ? "opacity-100 w-auto ml-1" : "opacity-0 w-0"
              }`}
            >
              {route.name}
            </span>
          </div>
          <div className={`${isExpanded ? "opacity-100" : "opacity-0"} transition-opacity duration-300`}>
            {isOpen ? <FaChevronDown size={10} /> : <FaChevronRight size={10} />}
          </div>
        </div>
        {isOpen && (
          <div className="ml-4 pl-2 border-l border-gray-200 mt-1 space-y-1">
            {route.children.map((child) => (
              <SidebarItem
                key={child.path}
                route={child}
                isActive={currentPath === child.path || (child.path !== "/" && currentPath.startsWith(child.path + "/"))} // Recalculate active for child
                themeColors={themeColors}
                onClose={onClose}
                currentPath={currentPath}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <Link
      to={route.path}
      className={`flex items-center px-4 py-3 rounded-lg transition-all duration-200 ${isActive ? "shadow-md" : "hover:shadow-sm"
        }`}
      style={{
        color: isActive ? themeColors.primary : themeColors.text,
        backgroundColor: isActive
          ? themeColors.active?.background || `${themeColors.primary}15`
          : "transparent",
        border: isActive ? `1px solid ${themeColors.primary}30` : "1px solid transparent",
      }}
      onMouseEnter={(e) => {
        if (!isActive) {
          e.currentTarget.style.backgroundColor =
            themeColors.hover?.background || `${themeColors.primary}10`;
          e.currentTarget.style.borderColor = `${themeColors.primary}20`;
        }
      }}
      onMouseLeave={(e) => {
        if (!isActive) {
          e.currentTarget.style.backgroundColor = "transparent";
          e.currentTarget.style.borderColor = "transparent";
        }
      }}
      onClick={onClose}
      aria-current={isActive ? "page" : undefined}
    >
      <div className="min-w-[40px] flex-shrink-0 flex justify-center">
        <IconComponent
          className="text-lg transition-colors duration-200"
          style={{
            color: isActive ? themeColors.primary : themeColors.textSecondary,
          }}
        />
      </div>
      <span 
        className={`font-medium text-sm transition-all duration-300 whitespace-nowrap overflow-hidden ${
          isExpanded ? "opacity-100 w-auto ml-1" : "opacity-0 w-0"
        }`}
      >
        {route.name}
      </span>
    </Link>
  );
});

SidebarItem.displayName = "SidebarItem";

const Sidebar = ({
  isOpen,
  onClose,
  routes,
  currentPath,
  user,
  logout,
  themeColors,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const isExpanded = isHovered || isOpen; // Expanded if either hovered or forced open (mobile)

  // 🔥 Sirf wahi routes jo hide: true NA ho
  const visibleRoutes = routes.filter((r) => !r.hide);

  // Active check — logic updated to handle parents
  const isRouteActive = (route) => {
    if (route.children) {
      return route.children.some(child => isRouteActive(child));
    }
    if (currentPath === route.path) return true;
    if (route.path !== "/" && currentPath.startsWith(route.path + "/")) {
      return true;
    }
    return false;
  };

  return (
    <>
      {/* Mobile Overlay - Improved with Backdrop Blur and cross-browser opacity */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 lg:hidden backdrop-blur-[2px] transition-all duration-300"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.4)' }}
          onClick={onClose}
        />
      )}

      <div
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`fixed inset-y-0 left-0 z-50 transform ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0 lg:static lg:inset-0 transition-all duration-300 ease-in-out ${
          isExpanded ? "w-64" : "w-24"
        } flex flex-col border-r overflow-x-hidden`}
        style={{
          backgroundColor: themeColors.surface,
          borderColor: themeColors.border,
          boxShadow: isExpanded ? "4px 0 10px rgba(0,0,0,0.05)" : "none"
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between h-16 px-4 border-b"
          style={{ borderColor: themeColors.border }}
        >
          <div className="flex items-center">
            <div 
              className="w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center mr-0 transition-all duration-300"
              style={{ 
                backgroundColor: themeColors.primary,
                marginRight: isExpanded ? "12px" : "0"
              }}
            >
              <span className="text-white font-bold text-sm">C</span>
            </div>
            <h1
              className={`text-lg font-bold transition-all duration-300 whitespace-nowrap overflow-hidden ${
                isExpanded ? "opacity-100 w-auto" : "opacity-0 w-0"
              }`}
              style={{ color: themeColors.primary }}
            >
              Cab booking
            </h1>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden p-2 rounded-lg hover:scale-110 transition-all duration-200"
            style={{
              color: themeColors.text,
              backgroundColor: themeColors.background,
            }}
            aria-label="Close sidebar"
          >
            <FaTimes className="text-sm" />
          </button>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto py-6 scrollbar-hide">
          <nav className="px-3 space-y-2" aria-label="Main navigation">
            {visibleRoutes.map((route) => (
              <SidebarItem
                key={route.path || route.name}
                route={route}
                isActive={isRouteActive(route)}
                themeColors={themeColors}
                onClose={onClose}
                currentPath={currentPath}
                isExpanded={isExpanded}
              />
            ))}
          </nav>
        </div>

        {/* User Section */}
        <div
          className="p-4 border-t"
          style={{ borderColor: themeColors.border }}
        >
          <div
            className="flex items-center mb-4 p-3 rounded-lg"
            style={{ backgroundColor: themeColors.background }}
          >
            <div
              className="min-w-[40px] h-10 rounded-full flex-shrink-0 flex items-center justify-center mr-0 border transition-all duration-300"
              style={{
                backgroundColor: themeColors.primary,
                color: themeColors.onPrimary,
                borderColor: themeColors.border,
                marginRight: isExpanded ? "12px" : "0"
              }}
              aria-hidden="true"
            >
              <FaUserCircle className="text-lg" />
            </div>
            <div className={`flex-1 min-w-0 transition-all duration-300 overflow-hidden ${
              isExpanded ? "opacity-100 w-auto" : "opacity-0 w-0"
            }`}>
              <p
                className="font-medium text-sm truncate"
                style={{ color: themeColors.text }}
              >
                {user?.name || "Auction Manager"}
              </p>
              <p
                className="text-xs opacity-75 truncate"
                style={{ color: themeColors.textSecondary }}
              >
                {user?.role || "Administrator"}
              </p>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full py-3 px-0 rounded-lg text-center transition-all duration-200 flex items-center justify-center border hover:shadow-md"
            style={{
              color: themeColors.danger,
              backgroundColor: "transparent",
              borderColor: themeColors.danger,
              paddingLeft: isExpanded ? "12px" : "0",
              paddingRight: isExpanded ? "12px" : "0",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = themeColors.danger;
              e.currentTarget.style.color = "#fff";
              e.currentTarget.style.transform = "translateY(-1px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
              e.currentTarget.style.color = themeColors.danger;
              e.currentTarget.style.transform = "translateY(0)";
            }}
            aria-label="Sign out"
          >
            <div className="min-w-[40px] flex-shrink-0 flex justify-center">
              <FaSignOutAlt className="text-sm" />
            </div>
            <span className={`text-sm font-medium transition-all duration-300 overflow-hidden ${
              isExpanded ? "opacity-100 w-auto ml-2" : "opacity-0 w-0"
            }`}>Sign Out</span>
          </button>
        </div>
      </div>
    </>
  );
};

export default memo(Sidebar);
