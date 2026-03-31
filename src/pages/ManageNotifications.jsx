// src/pages/ManageNotifications.jsx
import { useState, useEffect, useCallback } from "react";
import { useTheme } from "../context/ThemeContext";
import { useFont } from "../context/FontContext";
import { notificationApi } from "../api/notificationApi";
import { toast } from "sonner";
import {
   FaBell, FaSync, FaRegClock, FaCircle,
   FaExclamationCircle, FaInfoCircle, FaBullhorn, FaCheckDouble,
   FaTrash, FaEnvelope, FaEnvelopeOpen, FaStar, FaFilter
} from "react-icons/fa";
import { Trash2, Inbox, BellOff, Mail, MailOpen, Star } from "lucide-react";

export default function ManageNotifications() {
   const { themeColors, theme } = useTheme();
   const { currentFont } = useFont();

   const [notifications, setNotifications] = useState([]);
   const [loading, setLoading] = useState(true);
   const [filter, setFilter] = useState('all'); // all, unread, read
   const [selectedType, setSelectedType] = useState('all'); // all, maintenance, commission, info

   const fetchNotifications = useCallback(async () => {
      setLoading(true);
      try {
         const data = await notificationApi.getMyNotifications();
         if (data.success) {
            setNotifications(data.notifications || []);
         }
      } catch (err) {
         toast.error(err?.response?.data?.message || err?.message || "Notifications load nahi hui");
      } finally {
         setLoading(false);
      }
   }, []);

   useEffect(() => {
      fetchNotifications();
   }, [fetchNotifications]);

   const handleMarkAllRead = async () => {
      try {
         await notificationApi.markAllRead();
         toast.success("All notifications marked as read!");
         fetchNotifications();
      } catch (err) {
         toast.error("Failed to mark all as read");
      }
   };

   const handleMarkRead = async (id) => {
      try {
         await notificationApi.markAsRead(id);
         fetchNotifications();
      } catch (err) {
         toast.error("Failed to mark as read");
      }
   };

   const handleDelete = async (id) => {
      try {
         await notificationApi.deleteNotification(id);
         toast.success("Notification deleted!");
         fetchNotifications();
      } catch (err) {
         toast.error("Failed to delete");
      }
   };

   const getTimeAgo = (dateString) => {
      const now = new Date();
      const then = new Date(dateString);
      const diffInSeconds = Math.floor((now - then) / 1000);

      if (diffInSeconds < 60) return "Just now";
      if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
      if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
      if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
      return then.toLocaleDateString("en-IN", { day: 'numeric', month: 'short', year: 'numeric' });
   };

   const getNotificationIcon = (title) => {
      const lower = title.toLowerCase();
      if (lower.includes('maintenance')) return { icon: FaSync, color: '#F59E0B', bg: '#F59E0B15' };
      if (lower.includes('commission') || lower.includes('payment')) return { icon: FaBullhorn, color: '#10B981', bg: '#10B98115' };
      if (lower.includes('alert') || lower.includes('warning')) return { icon: FaExclamationCircle, color: '#EF4444', bg: '#EF444415' };
      return { icon: FaInfoCircle, color: '#3B82F6', bg: '#3B82F615' };
   };

   const filteredNotifications = notifications.filter(n => {
      // Filter by read/unread
      if (filter === 'unread' && n.read) return false;
      if (filter === 'read' && !n.read) return false;

      // Filter by type
      if (selectedType !== 'all') {
         const lower = n.title.toLowerCase();
         if (selectedType === 'maintenance' && !lower.includes('maintenance')) return false;
         if (selectedType === 'commission' && !lower.includes('commission') && !lower.includes('payment')) return false;
         if (selectedType === 'info' && lower.includes('maintenance') || lower.includes('commission') || lower.includes('payment')) return false;
      }
      return true;
   });

   const unreadCount = notifications.filter(n => !n.read).length;

   return (
      <div className="min-h-screen bg-gray-50 p-4 sm:p-6" style={{ fontFamily: currentFont.family }}>

         {/* Header */}
         {/* Header & Stats Container */}
         <div className="max-w-8xl mx-auto">
            {/* Header - Redesigned for Mobile */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-5 mb-8">
               <div className="flex items-start justify-between w-full sm:w-auto">
                  <div className="flex items-center gap-3">
                     <div className="p-2.5 bg-blue-600 text-white rounded-2xl shadow-lg shadow-blue-500/20">
                        <FaBell size={20} />
                     </div>
                     <div>
                        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">Notifications</h1>
                        <p className="text-[10px] sm:text-xs text-gray-500 font-medium mt-0.5 uppercase tracking-wider">System Activity & Alerts</p>
                     </div>
                  </div>
                  
                  {/* Refresh Button - TOP RIGHT ON MOBILE */}
                  <button
                     onClick={fetchNotifications}
                     className="sm:hidden p-3 rounded-2xl border border-gray-100 bg-white shadow-sm hover:shadow-md transition-all active:scale-90 text-blue-600"
                     title="Refresh"
                  >
                     <FaSync className={loading ? "animate-spin" : ""} size={16} />
                  </button>
               </div>

               <div className="flex items-center gap-3 w-full sm:w-auto">
                  {/* Refresh Button - DESKTOP ONLY */}
                  <button
                     onClick={fetchNotifications}
                     className="hidden sm:flex p-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 transition-all text-gray-600"
                     title="Refresh"
                  >
                     <FaSync className={loading ? "animate-spin" : ""} size={14} />
                  </button>

                  {/* Mark All Read Button */}
                  <button
                     onClick={handleMarkAllRead}
                     className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-2xl sm:rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20 active:scale-95 font-bold text-sm"
                  >
                     <FaCheckDouble size={14} />
                     Mark All Read
                  </button>
               </div>
            </div>

            {/* Stats Cards */}
            {/* Stats Cards - Dual Column Grid on Mobile */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mt-6">
               <div className="bg-white rounded-xl p-3 sm:p-4 border border-gray-100/60 shadow-sm hover:shadow-md transition-all">
                  <p className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-tight mb-1">Total</p>
                  <p className="text-xl sm:text-2xl font-black text-gray-900 leading-none">{notifications.length}</p>
               </div>
               <div className="bg-white rounded-xl p-3 sm:p-4 border border-gray-100/60 shadow-sm hover:shadow-md transition-all">
                  <p className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-tight mb-1">Unread</p>
                  <p className="text-xl sm:text-2xl font-black text-blue-600 leading-none">{unreadCount}</p>
               </div>
               <div className="bg-white rounded-xl p-3 sm:p-4 border border-gray-100/60 shadow-sm hover:shadow-md transition-all house-shadow">
                  <p className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-tight mb-1">Read</p>
                  <p className="text-xl sm:text-2xl font-black text-gray-600 leading-none">{notifications.length - unreadCount}</p>
               </div>
               <div className="bg-white rounded-xl p-3 sm:p-4 border border-gray-100/60 shadow-sm hover:shadow-md transition-all">
                  <p className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-tight mb-1">Weekly</p>
                  <p className="text-xl sm:text-2xl font-black text-emerald-600 leading-none">
                     {notifications.filter(n => {
                        const diff = (new Date() - new Date(n.createdAt)) / (1000 * 60 * 60 * 24);
                        return diff <= 7;
                     }).length}
                  </p>
               </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-4 mt-6">
               <div className="flex items-center gap-2">
                  <FaFilter size={14} className="text-gray-400" />
                  <span className="text-xs font-medium text-gray-500">Filter by:</span>
               </div>

               {/* Read/Unread Tabs */}
               <div className="flex bg-white rounded-lg border border-gray-200 p-1">
                  {[
                     { id: 'all', label: 'All' },
                     { id: 'unread', label: 'Unread' },
                     { id: 'read', label: 'Read' }
                  ].map((f) => (
                     <button
                        key={f.id}
                        onClick={() => setFilter(f.id)}
                        className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${filter === f.id
                           ? 'bg-blue-600 text-white'
                           : 'text-gray-600 hover:bg-gray-100'
                           }`}
                     >
                        {f.label}
                     </button>
                  ))}
               </div>

               {/* Type Tabs */}
               <div className="flex bg-white rounded-lg border border-gray-200 p-1">
                  {[
                     { id: 'all', label: 'All Types' },
                     { id: 'maintenance', label: 'Maintenance' },
                     { id: 'commission', label: 'Commission' },
                     { id: 'info', label: 'Info' }
                  ].map((t) => (
                     <button
                        key={t.id}
                        onClick={() => setSelectedType(t.id)}
                        className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${selectedType === t.id
                           ? 'bg-blue-600 text-white'
                           : 'text-gray-600 hover:bg-gray-100'
                           }`}
                     >
                        {t.label}
                     </button>
                  ))}
               </div>
            </div>
         </div>

         {/* Notifications List */}
         <div className="max-w-8xl mx-auto space-y-4">
            {loading ? (
               <div className="bg-white rounded-xl border border-gray-200 p-16 flex flex-col items-center gap-4">
                  <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                  <p className="text-sm font-medium text-gray-500">Loading notifications...</p>
               </div>
            ) : filteredNotifications.length === 0 ? (
               <div className="bg-white rounded-xl border border-gray-200 p-16 flex flex-col items-center text-center">
                  <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                     <BellOff size={32} className="text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No notifications found</h3>
                  <p className="text-sm text-gray-500 max-w-sm">
                     {filter !== 'all' || selectedType !== 'all'
                        ? "No notifications match your current filters. Try changing your filter criteria."
                        : "You're all caught up! Check back later for new updates."}
                  </p>
               </div>
            ) : (
               filteredNotifications.map((n, idx) => {
                  const icon = getNotificationIcon(n.title);
                  const isUnread = !n.read;

                  return (
                     <div
                        key={n._id}
                        className={`group bg-white rounded-xl border ${isUnread ? 'border-blue-200 shadow-md' : 'border-gray-200'} hover:shadow-lg transition-all relative overflow-hidden`}
                     >
                        {/* Unread Indicator */}
                        {isUnread && (
                           <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-600" />
                        )}

                        <div className="p-4 sm:p-6">
                           <div className="flex items-start gap-4">
                              {/* Icon */}
                              <div
                                 className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center shrink-0"
                                 style={{ backgroundColor: icon.bg }}
                              >
                                 <icon.icon size={18} className="sm:size-[20px]" style={{ color: icon.color }} />
                              </div>

                              {/* Content */}
                              <div className="flex-1 min-w-0">
                                 <div className="flex items-start justify-between gap-4 mb-2">
                                    <div>
                                       <h3 className={`text-sm sm:text-base font-semibold ${isUnread ? 'text-gray-900' : 'text-gray-700'}`}>
                                          {n.title}
                                       </h3>
                                       <p className="text-xs text-gray-500 mt-1">
                                          {getTimeAgo(n.createdAt)}
                                       </p>
                                    </div>

                                    {/* Priority Badge */}
                                    {n.targetRoles?.includes('all') && (
                                       <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded-full text-[10px] font-medium flex items-center gap-1">
                                          <FaStar size={8} />
                                          Priority
                                       </span>
                                    )}
                                 </div>

                                 <p className="text-sm text-gray-600 leading-relaxed mb-4">
                                    {n.message}
                                 </p>

                                 {/* Footer Actions */}
                                 <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                       <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">
                                          From: {n.createdByModel || 'System'}
                                       </span>
                                       {n.targetRoles && n.targetRoles.length > 0 && (
                                          <span className="text-[10px] font-medium text-gray-400">
                                             • To: {n.targetRoles.join(', ')}
                                          </span>
                                       )}
                                    </div>

                                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                       {isUnread && (
                                          <button
                                             onClick={() => handleMarkRead(n._id)}
                                             className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                             title="Mark as read"
                                          >
                                             <FaEnvelopeOpen size={14} />
                                          </button>
                                       )}
                                       <button
                                          onClick={() => handleDelete(n._id)}
                                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                          title="Delete"
                                       >
                                          <Trash2 size={14} />
                                       </button>
                                    </div>
                                 </div>
                              </div>
                           </div>
                        </div>
                     </div>
                  );
               })
            )}
         </div>

         {/* Footer */}
         {filteredNotifications.length > 0 && (
            <div className="max-w-5xl mx-auto mt-8 text-center">
               <p className="text-xs text-gray-400">
                  Showing {filteredNotifications.length} of {notifications.length} notifications
               </p>
            </div>
         )}
      </div>
   );
}