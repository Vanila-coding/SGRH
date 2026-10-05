import { useRef, useState } from 'react';
import { CalendarDays } from 'lucide-react';
import { traduire } from '../../i18n';

// Date saisie au clavier (jj/mm/aaaa) ou choisie dans le calendrier. La valeur reste au
// format ISO (aaaa-mm-jj) : onChange reçoit { target: { value } } comme un champ natif.
const ISO = /^\d{4}-\d{2}-\d{2}$/;

function versAffichage(iso) {
  if (!iso || !ISO.test(iso)) return '';
  const [annee, mois, jour] = iso.split('-');
  return `${jour}/${mois}/${annee}`;
}

function versIso(texte) {
  const m = texte.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!m) return null;
  const [, jour, mois, annee] = m;
  const date = new Date(Date.UTC(Number(annee), Number(mois) - 1, Number(jour)));
  if (date.getUTCFullYear() !== Number(annee) || date.getUTCMonth() !== Number(mois) - 1 || date.getUTCDate() !== Number(jour)) return null;
  return `${annee}-${mois}-${jour}`;
}

function formater(saisie) {
  const chiffres = saisie.replace(/\D/g, '').slice(0, 8);
  let sortie = chiffres.slice(0, 2);
  if (chiffres.length > 2) sortie += `/${chiffres.slice(2, 4)}`;
  if (chiffres.length > 4) sortie += `/${chiffres.slice(4, 8)}`;
  return sortie;
}

export default function DateInput({ value = '', onChange, placeholder = 'jj/mm/aaaa', required, disabled, className = '', name, ...props }) {
  const [texte, setTexte] = useState(() => versAffichage(value));
  const [valeurVue, setValeurVue] = useState(value);
  const calendrier = useRef(null);

  if (value !== valeurVue) {
    setValeurVue(value);
    if (versIso(texte) !== (value || null)) setTexte(versAffichage(value));
  }

  function emettre(iso) {
    onChange?.({ target: { value: iso || '', name } });
  }

  function handleSaisie(e) {
    const formate = formater(e.target.value);
    setTexte(formate);
    const iso = versIso(formate);
    if (iso) emettre(iso);
    else if (formate === '') emettre('');
  }

  function ouvrirCalendrier() {
    const champ = calendrier.current;
    if (!champ) return;
    try {
      if (champ.showPicker) champ.showPicker();
      else champ.click();
    } catch {
      champ.click();
    }
  }

  return (
    <div className="relative min-w-0">
      <input
        type="text"
        inputMode="numeric"
        autoComplete="off"
        name={name}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        value={texte}
        onChange={handleSaisie}
        onBlur={() => setTexte(versAffichage(value))}
        className={`w-full ${className}`}
        {...props}
      />
      <button
        type="button"
        onClick={ouvrirCalendrier}
        disabled={disabled}
        aria-label={traduire('Ouvrir le calendrier')}
        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-navy disabled:opacity-40 dark:hover:text-gold"
      >
        <CalendarDays size={16} aria-hidden="true" />
      </button>
      <input
        ref={calendrier}
        type="date"
        tabIndex={-1}
        aria-hidden="true"
        value={value || ''}
        onChange={(e) => emettre(e.target.value)}
        className="pointer-events-none absolute bottom-0 right-0 h-0 w-0 opacity-0"
      />
    </div>
  );
}
