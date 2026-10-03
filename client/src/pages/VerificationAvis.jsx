import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { traduire } from '../i18n';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

function fmt(date) {
  if (!date) return '—';
  const s = String(date);
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  return m ? `${m[3]}/${m[2]}/${m[1]}` : new Date(date).toLocaleDateString('fr-FR');
}

// Page publique (sans connexion) ouverte en scannant le QR d'un avis de chef de service.
export default function VerificationAvis() {
  const { token } = useParams();
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`${API_URL}/verification/avis/${encodeURIComponent(token)}`)
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.message || traduire('Vérification impossible.'));
        setResult(data);
      })
      .catch((err) => setError(err.message));
  }, [token]);

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-start justify-center p-4 sm:p-8">
      <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <p className="text-xs text-gray-400 text-center">{traduire("Université de Mahajanga — Vérification d\'un avis")}</p>

        {!result && !error && <p className="mt-6 text-center text-sm text-gray-500" role="status">{traduire('Vérification en cours…')}</p>}

        {error && (
          <div className="mt-6 text-center" role="alert">
            <p className="text-lg font-bold text-status-rejected">{traduire('Avis non vérifiable')}</p>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">{error}</p>
          </div>
        )}

        {result && (
          <div className="mt-6">
            <p className={`text-center text-lg font-bold ${result.valide ? 'text-status-approved' : 'text-status-rejected'}`} role="status">
              {result.valide ? 'Avis authentique' : traduire('Avis non confirmé')}
            </p>
            <p className="mt-1 text-center text-sm text-gray-600 dark:text-gray-300">{result.message}</p>
            <dl className="mt-5 space-y-2 text-sm text-navy dark:text-gray-100">
              <div className="flex justify-between gap-4"><dt className="text-gray-400">{traduire('Demande n°')}</dt><dd>{result.numero}</dd></div>
              <div className="flex justify-between gap-4"><dt className="text-gray-400">{traduire('Agent')}</dt><dd>{result.agent}</dd></div>
              <div className="flex justify-between gap-4"><dt className="text-gray-400">{traduire('Type')}</dt><dd>{result.typeConge}</dd></div>
              <div className="flex justify-between gap-4"><dt className="text-gray-400">{traduire('Période')}</dt><dd>{fmt(result.dateDebut)} {'au'} {fmt(result.dateFin)}</dd></div>
              {result.validateur && (
                <>
                  <div className="flex justify-between gap-4"><dt className="text-gray-400">{traduire('Avis rendu par')}</dt><dd className="text-right">{result.validateur.prenom} {result.validateur.nom}{result.validateur.fonction ? ` (${result.validateur.fonction})` : ''}</dd></div>
                  <div className="flex justify-between gap-4"><dt className="text-gray-400">{traduire('Le')}</dt><dd>{new Date(result.dateAvis).toLocaleString('fr-FR')}</dd></div>
                </>
              )}
            </dl>
          </div>
        )}
      </div>
    </div>
  );
}
