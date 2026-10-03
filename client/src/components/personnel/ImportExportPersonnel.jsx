import { useRef, useState } from 'react';
import { Download, FileSpreadsheet, Upload } from 'lucide-react';
import { exportPersonnelExcel, importPersonnelExcel, telechargerModeleImport } from '../../services/personnelApi';
import { toast } from '../../utils/toast';
import { traduire } from '../../i18n';

const BOUTON = 'flex items-center gap-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-navy dark:text-gray-100 rounded-md px-4 py-2 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50';

// Export, import et modèle Excel d'une liste du personnel (PE ou PAT). Le rôle borne
// l'export ; l'import lit la colonne « Rôle » du fichier comme le fait l'API.
export default function ImportExportPersonnel({ role, onImported }) {
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [modele, setModele] = useState(false);
  const [resultat, setResultat] = useState(null);
  const fileInputRef = useRef(null);

  async function handleExport() {
    setExporting(true);
    try {
      await exportPersonnelExcel(role);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setExporting(false);
    }
  }

  async function handleModele() {
    setModele(true);
    try {
      await telechargerModeleImport(role);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setModele(false);
    }
  }

  async function handleImportFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    setImporting(true);
    setResultat(null);
    try {
      setResultat(await importPersonnelExcel(file));
      onImported?.();
    } catch (err) {
      setResultat({ inserted: 0, errors: [{ line: '-', reason: err.message }] });
    } finally {
      setImporting(false);
      e.target.value = '';
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" onClick={handleModele} disabled={modele} className={BOUTON}>
          <FileSpreadsheet size={16} />
          {modele ? 'Téléchargement…' : traduire('Modèle d’import')}
        </button>
        <button type="button" onClick={handleExport} disabled={exporting} className={BOUTON}>
          <Download size={16} />
          {exporting ? 'Export en cours…' : traduire('Exporter en Excel')}
        </button>
        <button type="button" onClick={() => fileInputRef.current?.click()} disabled={importing} className={BOUTON}>
          <Upload size={16} />
          {importing ? 'Import en cours…' : traduire('Importer un fichier Excel')}
        </button>
        <input ref={fileInputRef} type="file" accept=".xlsx" onChange={handleImportFile} className="hidden" />
      </div>

      {resultat && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <p className="text-sm font-medium text-status-approved">{resultat.inserted} {traduire('fiche(s) importée(s) avec succès.')}</p>
          {resultat.errors.length > 0 && (
            <div className="mt-2">
              <p className="text-sm text-status-rejected font-medium">{resultat.errors.length} {traduire('ligne(s) ignorée(s) :')}</p>
              <ul className="text-xs text-gray-500 list-disc list-inside mt-1">
                {resultat.errors.map((e, i) => (
                  <li key={i}>{traduire('Ligne')} {e.line} : {e.reason}</li>
                ))}
              </ul>
            </div>
          )}
          <button onClick={() => setResultat(null)} className="text-xs text-navy underline mt-2">{traduire('Fermer')}</button>
        </div>
      )}
    </div>
  );
}
