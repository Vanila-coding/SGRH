import { useState } from 'react';
import { Pencil } from 'lucide-react';
import { useEditMode } from '../context/EditModeContext';
import { useAuth } from '../context/AuthContext';
import { useTextContext } from '../context/TextContext';
import { updateText } from '../services/siteTextsApi';
import { toast } from '../utils/toast';
import Modal from './ui/Modal';
import Button from './ui/Button';
import { traduire } from '../i18n';

// Enrobe un texte déjà résolu par useText d'un petit crayon cliquable, visible
// uniquement en mode édition (activé depuis Personnalisation) pour un compte
// SUPERADMIN. En dehors de ce cas, rend exactement `value` — aucun changement visuel
// ni de structure DOM pour tout le reste de l'application ou pour les autres rôles.
// `textKey` est la clé site_texts à modifier (PATCH /api/site-texts, déjà utilisée par
// Personnalisation) ; aucune nouvelle route ni permission n'est ajoutée, c'est la même
// permission `manage_site_texts` qui s'applique côté serveur.
export default function EditableText({ value, textKey, multiline = false }) {
  const { editMode } = useEditMode();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);

  if (!editMode || user?.role !== 'SUPERADMIN') return value;

  return (
    <>
      {value}
      <button
        type="button"
        onClick={() => setOpen(true)}
        title={traduire('Modifier ce texte')}
        aria-label={traduire('Modifier ce texte')}
        className="inline-flex items-center justify-center w-5 h-5 ml-1.5 rounded bg-gold text-navy align-middle hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-gold"
      >
        <Pencil size={11} />
      </button>
      {open && (
        <EditTextModal
          textKey={textKey}
          current={value}
          multiline={multiline}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}

// Crayon seul, sans le texte accolé : pour les cas où le texte édité est déjà à
// l'intérieur d'un élément interactif (ex. le bouton d'un accordéon) — imbriquer un
// <button> dans un <button> serait invalide, donc ce crayon se place en frère, pas en
// enfant du texte. Même garde SUPERADMIN + mode édition qu'EditableText.
export function EditPencilButton({ textKey, current, multiline = false, className = '' }) {
  const { editMode } = useEditMode();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);

  if (!editMode || user?.role !== 'SUPERADMIN') return null;

  return (
    <>
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); setOpen(true); }}
        title={traduire('Modifier ce texte')}
        aria-label={traduire('Modifier ce texte')}
        className={`inline-flex items-center justify-center w-5 h-5 rounded bg-gold text-navy hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-gold ${className}`}
      >
        <Pencil size={11} />
      </button>
      {open && (
        <EditTextModal
          textKey={textKey}
          current={current}
          multiline={multiline}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}

function EditTextModal({ textKey, current, multiline, onClose }) {
  const { reload } = useTextContext();
  const [draft, setDraft] = useState(current);
  const [saving, setSaving] = useState(false);
  const Champ = multiline ? 'textarea' : 'input';

  async function handleSave() {
    setSaving(true);
    try {
      await updateText(textKey, draft);
      await reload();
      toast.success(traduire('Texte enregistré.'));
      onClose();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open onClose={onClose} title={traduire('Modifier ce texte')} maxWidth="max-w-lg">
      <p className="text-xs text-gray-400 dark:text-gray-500 mb-3 font-mono">{textKey}</p>
      <Champ
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        rows={multiline ? 5 : undefined}
        className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy mb-4"
        autoFocus
      />
      <div className="flex justify-end gap-2">
        <Button variant="secondary" onClick={onClose} disabled={saving}>{traduire('Annuler')}</Button>
        <Button variant="primary" onClick={handleSave} loading={saving}>{traduire('Enregistrer')}</Button>
      </div>
    </Modal>
  );
}
