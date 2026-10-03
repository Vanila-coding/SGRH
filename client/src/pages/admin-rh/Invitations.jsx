import { useEffect, useState } from 'react';
import { Search, Send, UserRoundCheck } from 'lucide-react';
import { listPersonnelWithoutAccount, sendRegistrationLink } from '../../services/personnelApi';
import PageHeader from '../../components/PageHeader';
import { Skeleton } from '../../components/ui/Skeleton';
import { traduire } from '../../i18n';

export default function Invitations() {
  const [personnel, setPersonnel] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState(null);
  const [message, setMessage] = useState('');

  async function load() {
    setLoading(true);
    try {
      setPersonnel(await listPersonnelWithoutAccount());
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  const filtered = personnel.filter((p) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      (p.nom || '').toLowerCase().includes(q) ||
      (p.prenom || '').toLowerCase().includes(q) ||
      (p.matricule || '').toLowerCase().includes(q)
    );
  });

  async function handleSend() {
    if (!selectedId) return;
    setStatus('loading');
    setMessage('');
    try {
      await sendRegistrationLink(selectedId);
      setStatus('success');
      setMessage(traduire("Lien d\'inscription envoyé."));
      setSelectedId(null);
      setSearch('');
      load();
    } catch (err) {
      setStatus('error');
      setMessage(err.message);
    }
  }

  return (
    <section className="w-full max-w-[1600px] mx-auto">
      <PageHeader crumbs={[{ label: traduire('Admin RH') }, { label: traduire('Utilisateurs & comptes') }, { label: traduire('Inviter un personnel') }]} title={traduire('Inviter un personnel')} />
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div className="border-b border-slate-100 bg-slate-50 px-5 py-5 sm:px-7 sm:py-6 dark:border-gray-700 dark:bg-gray-900/40">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-navy text-gold shadow-sm">
              <UserRoundCheck size={20} />
            </div>
            <div>
              <h2 className="font-semibold text-navy dark:text-gold">{traduire('Inviter un personnel')}</h2>
              <p className="mt-1 text-sm leading-6 text-gray-600 dark:text-gray-300">
                {traduire('Recherchez un employé déjà enregistré, puis envoyez-lui son lien de création de compte.')}
              </p>
            </div>
          </div>
        </div>

      <div className="p-5 sm:p-7">
      <div className="relative mb-4">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder={traduire('Rechercher par nom ou matricule...')}
          value={search}
          onChange={(e) => { setSearch(e.target.value); setSelectedId(null); }}
          className="w-full border border-gray-300 bg-white rounded-lg pl-10 pr-4 py-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-navy dark:border-gray-600 dark:bg-gray-900"
        />
      </div>

      {loading && (
        <div className="border border-gray-200 rounded-xl divide-y divide-gray-100 dark:border-gray-700 dark:divide-gray-700 mb-5" role="status" aria-label={traduire('Chargement de la liste')}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="px-4 py-3 space-y-2">
              <Skeleton className="h-3 w-1/3 rounded" />
              <Skeleton className="h-2.5 w-1/2 rounded" />
            </div>
          ))}
        </div>
      )}

      {!loading && (
        <div className="border border-gray-200 rounded-xl max-h-72 overflow-y-auto mb-5 divide-y divide-gray-100 dark:border-gray-700 dark:divide-gray-700">
          {filtered.length === 0 && (
            <p className="text-sm text-gray-400 p-6 text-center">{traduire('Aucun employé trouvé pour cette recherche.')}</p>
          )}
          {filtered.map((p) => (
            <button
              key={p.id}
              onClick={() => setSelectedId(p.id)}
              className={`w-full text-left px-4 py-3 text-sm transition-colors hover:bg-slate-50 dark:hover:bg-gray-700 ${
                selectedId === p.id ? 'bg-navy/10 font-medium text-navy dark:text-gold' : 'text-gray-700 dark:text-gray-200'
              }`}
            >
              <span className="block font-medium">{p.prenom} {p.nom}</span>
              <span className="mt-0.5 block text-xs text-gray-400">{traduire('Matricule')} {p.matricule} · {p.role}</span>
            </button>
          ))}
        </div>
      )}

      <button
        onClick={handleSend}
        disabled={!selectedId || status === 'loading'}
        className="w-full inline-flex items-center justify-center gap-2 bg-navy text-white rounded-lg py-3 text-sm font-medium shadow-sm hover:bg-navy/90 focus:outline-none focus:ring-2 focus:ring-navy focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <Send size={17} />
        {status === 'loading' ? 'Envoi...' : traduire("Envoyer le lien d\'inscription")}
      </button>

      {message && (
        <p className={`text-sm mt-3 ${status === 'success' ? 'text-status-approved' : 'text-status-rejected'}`}>
          {message}
        </p>
      )}
      </div>
      </div>
    </section>
  );
}
