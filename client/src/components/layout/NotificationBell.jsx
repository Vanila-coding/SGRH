import { useEffect, useRef, useState } from 'react';
import { Bell, CheckCheck } from 'lucide-react';
import { getMyNotifications, markNotificationAsRead, markAllNotificationsAsRead } from '../../services/notificationApi';
import { Link, useNavigate } from 'react-router-dom';
import { traduire } from '../../i18n';

export default function NotificationBell() {
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const navigate = useNavigate();

  async function load() {
    try {
      setNotifications(await getMyNotifications());
    } catch {
      // silencieux : pas grave si ça échoue ponctuellement
    }
  }

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  async function handleOpen() {
    setOpen((prev) => !prev);
  }

  async function handleRead(id) {
    await markNotificationAsRead(id);
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
  }

  async function handleItemClick(n) {
    if (!n.is_read) await handleRead(n.id);
    setOpen(false);
    if (n.lien) navigate(n.lien);
  }

  async function handleMarkAllRead() {
    await markAllNotificationsAsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  }

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={handleOpen}
        aria-label={traduire('Notifications')}
        className="relative shrink-0 rounded-md p-1.5 text-gray-500 hover:bg-slate-100 dark:text-gray-300 dark:hover:bg-gray-700 transition"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-0.5 right-0.5 bg-status-rejected text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 max-w-[calc(100vw-2rem)] bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-slate-200 dark:border-gray-700 max-h-96 overflow-y-auto z-10">
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="w-full flex items-center justify-center gap-1.5 text-xs text-navy dark:text-gold font-medium py-2 border-b border-slate-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              <CheckCheck size={14} /> Tout marquer comme lu
            </button>
          )}
          {notifications.length === 0 && (
            <p className="p-4 text-sm text-gray-500 dark:text-gray-400">{traduire('Aucune notification.')}</p>
          )}
          {notifications.slice(0, 5).map((n) => (
            <button
              key={n.id}
              onClick={() => handleItemClick(n)}
              className={`w-full text-left p-3 border-b border-slate-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 ${
                n.is_read ? 'opacity-60' : ''
              }`}
            >
              <p className="text-sm font-medium text-navy dark:text-gray-100">{n.title}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{n.message}</p>
            </button>
          ))}
          <Link
            to="/notifications"
            onClick={() => setOpen(false)}
            className="block text-center text-sm text-navy dark:text-gold font-medium py-2 hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            {traduire('Voir toutes mes notifications')}
          </Link>
        </div>
      )}
    </div>
  );
}