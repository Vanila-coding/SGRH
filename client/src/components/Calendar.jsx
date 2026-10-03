import { traduire } from '../i18n';
export default function MiniCalendar({ demandes }) {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth(); // 0-indexé
  const firstDay = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startWeekday = (firstDay.getDay() + 6) % 7; // lundi = 0

  function demandesForDay(day) {
    const d = new Date(year, month, day);
    return demandes.filter((dm) => {
      const start = new Date(dm.date_debut);
      const end = new Date(dm.date_fin);
      const startClean = new Date(start.getFullYear(), start.getMonth(), start.getDate());
      const endClean = new Date(end.getFullYear(), end.getMonth(), end.getDate());
      return d >= startClean && d <= endClean;
    });
  }

  const cells = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const monthLabel = firstDay.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-5">
      <h3 className="font-semibold text-navy dark:text-gold mb-3 capitalize">{monthLabel}</h3>
      <div className="grid grid-cols-7 gap-1 text-center text-xs text-gray-400 dark:text-gray-500 mb-1">
        {['Lu', 'Ma', 'Me', 'Je', 'Ve', 'Sa', 'Di'].map((d) => <div key={d}>{d}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, i) => {
          if (!day) return <div key={i} />;
          const dayDemandes = demandesForDay(day);
          const isToday = day === now.getDate();
          return (
            <div
              key={i}
              title={dayDemandes.map((dm) => [dm.prenom, dm.nom].filter(Boolean).join(' ')).join(', ')}
              className={`relative text-xs text-center rounded-md py-1.5 ${
                isToday ? 'bg-navy dark:bg-gold text-white dark:text-navy font-bold' : 'text-gray-600 dark:text-gray-300'
              }`}>
              {day}
              {dayDemandes.length > 0 && (
                <span
                  className={`absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full ${
                    dayDemandes.some((dm) => dm.status === 'approuvee')
                      ? 'bg-status-approved'
                      : 'bg-status-pending'
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>
      <p className="text-xs text-gray-400 dark:text-gray-500 mt-3">
        🟢 congé approuvé · 🟠 demande en attente
      </p>
    </div>
  );
}