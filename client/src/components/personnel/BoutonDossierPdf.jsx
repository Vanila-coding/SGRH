import { useState } from 'react';
import { Download } from 'lucide-react';
import { telechargerDossierPdf } from '../../services/personnelApi';
import { toast } from '../../utils/toast';
import { traduire } from '../../i18n';

// Télécharge le dossier de profil en PDF : celui de la personne connectée si aucun
// identifiant n'est fourni, sinon celui de la fiche RH indiquée.
export default function BoutonDossierPdf({ personnelId }) {
  const [telechargement, setTelechargement] = useState(false);

  async function handleClick() {
    setTelechargement(true);
    try {
      await telechargerDossierPdf(personnelId);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setTelechargement(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={telechargement}
      className="flex items-center gap-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-navy dark:text-gray-100 rounded-md px-4 py-2 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
    >
      <Download size={16} aria-hidden="true" />
      {telechargement ? traduire('Téléchargement…') : traduire('Télécharger le dossier (PDF)')}
    </button>
  );
}
