import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMyNotifications, markNotificationAsRead, markAllNotificationsAsRead } from '../services/notificationApi';
import PageHeader from '../components/PageHeader';
import { SkeletonCard } from '../components/ui/Skeleton';
import ViewToggle from '../components/ui/ViewToggle';
import useVueListe, { classeConteneur } from '../hooks/useVueListe';
import { traduire } from '../i18n';

const TYPE_LABELS = {
  info: 'Information', reunion: 'Réunion', echeance: 'Échéance',
  conge: 'Congé', paie: 'Paie',
};

export default function NotificationsPage() {
  const [vue, setVue] = useVueListe('notifications');
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('toutes'); // 'toutes' | 'non_lues' | 'lues'
  const navigate = useNavigate();

  async function load() {
    setLoading(true);
    try {
      setNotifications(await getMyNotifications());
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleRead(id) {
    await markNotificationAsRead(id);
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
  }

  async function handleMarkAllRead() {
    await markAllNotificationsAsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  }

  async function handleGoTo(n) {
    if (!n.is_read) await handleRead(n.id);
    if (n.lien) navigate(n.lien);
  }

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const filtered = notifications.filter((n) => {
    if (filter === 'non_lues') return !n.is_read;
    if (filter === 'lues') return n.is_read;
    return true;
  });

  return (
    <div className="max-w-[1600px] mx-auto">
      <PageHeader crumbs={[{ label: traduire('Notifications') }]} title={traduire('Notifications')} />
      <div className="flex justify-end mb-3">
        <ViewToggle value={vue} onChange={setVue} />
      </div>
      <div className="flex items-center justify-between gap-2 mb-6 flex-wrap">
        <div className="flex gap-2">
          {['toutes', 'non_lues', 'lues'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium ${
                filter === f ? 'bg-navy text-white' : 'bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700'
              }`}
            >
              {f === 'toutes' ? 'Toutes' : f === 'non_lues' ? traduire('Non lues') : traduire('Lues')}
            </button>
          ))}
        </div>
        {unreadCount > 0 && (
          <button onClick={handleMarkAllRead} className="text-sm text-navy dark:text-gold font-medium underline">
            {traduire('Tout marquer comme lu')}
          </button>
        )}
      </div>

      {!loading && filtered.length === 0 && (
        <p className="text-gray-400 text-sm">{traduire('Aucune notification ici.')}</p>
      )}

      {loading ? (
        <div className={classeConteneur(vue, 3)}>
          <SkeletonCard lines={2} />
          <SkeletonCard lines={2} />
          <SkeletonCard lines={2} />
          <SkeletonCard lines={2} />
        </div>
      ) : (
      <div className={classeConteneur(vue, 3)}>
        {filtered.map((n) => (
          <div
            key={n.id}
            className={`bg-white dark:bg-gray-800 rounded-lg shadow p-4 flex items-start justify-between gap-3 ${
              n.is_read ? 'opacity-60' : ''
            }`}
          >
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-300">
                  {TYPE_LABELS[n.type] || n.type}
                </span>
                {!n.is_read && <span className="w-2 h-2 rounded-full bg-status-rejected" />}
              </div>
              <p className="text-sm font-medium text-navy dark:text-gray-100">{n.title}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{n.message}</p>
              <p className="text-xs text-gray-400 mt-1">
                {new Date(n.created_at).toLocaleString('fr-FR')}
              </p>
            </div>
            <div className="flex flex-col items-end gap-1 shrink-0">
              {n.lien && (
                <button
                  onClick={() => handleGoTo(n)}
                  className="text-xs text-navy dark:text-gold underline whitespace-nowrap"
                >
                  {traduire('Voir')}
                </button>
              )}
              {!n.is_read && (
                <button
                  onClick={() => handleRead(n.id)}
                  className="text-xs text-gray-400 underline whitespace-nowrap"
                >
                  {traduire('Marquer lue')}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
      )}
    </div>
  );
}
