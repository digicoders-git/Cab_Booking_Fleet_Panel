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
      <div className="min-h-screen bg-gray-50 p-4 sm:p-8" style={{ fontFamily: currentFont.family }}>

         {/* Header */}
         <div className="max-w-8xl mx-auto mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
               <div>
                  <div className="flex items-center gap-3 mb-2">
                     <div className="p-3 bg-blue-600 text-white rounded-xl shadow-lg">
                        <FaBell size={20} />
                     </div>
                     <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Notifications</h1>
                        <p className="text-sm text-gray-500 mt-1">Stay updated with fleet news and system alerts</p>
                     </div>
                  </div>
               </div>

               <div className="flex items-center gap-2">
                  <button
                     onClick={fetchNotifications}
                     className="p-2.5 border border-gray-200 bg-white rounded-lg text-gray-600 hover:text-blue-600 hover:border-blue-200 transition-all"
                     title="Refresh"
                  >
                     <FaSync className={loading ? "animate-spin" : ""} size={14} />
                  </button>
                  <button
                     onClick={handleMarkAllRead}
                     className="px-4 py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-all flex items-center gap-2 text-sm font-medium"
                  >
                     <FaCheckDouble size={14} />
                     Mark All Read
                  </button>
               </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mt-6">
               <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                  <p className="text-xs text-gray-500 mb-1">Total</p>
                  <p className="text-2xl font-bold text-gray-900">{notifications.length}</p>
               </div>
               <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                  <p className="text-xs text-gray-500 mb-1">Unread</p>
                  <p className="text-2xl font-bold text-blue-600">{unreadCount}</p>
               </div>
               <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                  <p className="text-xs text-gray-500 mb-1">Read</p>
                  <p className="text-2xl font-bold text-gray-600">{notifications.length - unreadCount}</p>
               </div>
               <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                  <p className="text-xs text-gray-500 mb-1">This Week</p>
                  <p className="text-2xl font-bold text-green-600">
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

                        <div className="p-6">
                           <div className="flex items-start gap-4">
                              {/* Icon */}
                              <div
                                 className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                                 style={{ backgroundColor: icon.bg }}
                              >
                                 <icon.icon size={20} style={{ color: icon.color }} />
                              </div>

                              {/* Content */}
                              <div className="flex-1 min-w-0">
                                 <div className="flex items-start justify-between gap-4 mb-2">
                                    <div>
                                       <h3 className={`text-base font-semibold ${isUnread ? 'text-gray-900' : 'text-gray-700'}`}>
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