import { lazy } from "react";
import { FaTachometerAlt, FaCar, FaUser, FaLink, FaWallet, FaHandHoldingUsd, FaBell, FaChartBar, FaUserCircle } from "react-icons/fa";

const Dashboard = lazy(() => import("../pages/Dashboard"));
const ManageCars = lazy(() => import("../pages/ManageCars"));
const ManageDrivers = lazy(() => import("../pages/ManageDrivers"));
const ManageAssignments = lazy(() => import("../pages/ManageAssignments"));
const ManageWallet = lazy(() => import("../pages/ManageWallet"));
const WithdrawMoney = lazy(() => import("../pages/WithdrawMoney"));
const ManageNotifications = lazy(() => import("../pages/ManageNotifications"));
const ManageReports = lazy(() => import("../pages/ManageReports"));
const ManageProfile = lazy(() => import("../pages/ManageProfile"));

const routes = [
  { path: "/dashboard", component: Dashboard, name: "Dashboard", icon: FaTachometerAlt },
  { path: "/cars", component: ManageCars, name: "Manage Cars", icon: FaCar },
  { path: "/drivers", component: ManageDrivers, name: "Manage Drivers", icon: FaUser },
  { path: "/assignments", component: ManageAssignments, name: "Assignments", icon: FaLink },
  { path: "/wallet", component: ManageWallet, name: "Wallet", icon: FaWallet },
  { path: "/withdraw", component: WithdrawMoney, name: "Withdraw", icon: FaHandHoldingUsd, hide: false },
  { path: "/notifications", component: ManageNotifications, name: "Notifications", icon: FaBell },
  { path: "/profile", component: ManageProfile, name: "Profile", icon: FaUserCircle },
  { path: "/reports", component: ManageReports, name: "Reports", icon: FaChartBar },

];

export default routes;
