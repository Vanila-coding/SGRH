import { Palette, Bell, Mail, Globe, Accessibility } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useSettingsPreferences } from '../../context/SettingsPreferencesContext';
import SettingsCard from '../../components/settings/SettingsCard';
import SettingsSelect from '../../components/settings/SettingsSelect';
import SettingsToggle from '../../components/settings/SettingsToggle';
import { traduire } from '../../i18n';

export function Apparence() {
  const { theme, setTheme } = useTheme();
  const { prefs, update } = useSettingsPreferences();

  return (
    <SettingsCard icon={Palette} title={traduire('Apparence')} description={traduire("Personnalisez l\'affichage de votre espace SGRH.")}>
      <SettingsSelect label={traduire('Thème')} description={traduire('Clair, sombre ou basé sur les préférences système.')}
        value={theme} onChange={setTheme}
        options={[{ value: 'light', label: traduire('Clair') }, { value: 'dark', label: traduire('Sombre') }, { value: 'system', label: traduire('Système') }]} />
      <SettingsSelect label={traduire('Densité')} description={traduire('Espacement du contenu dans les tableaux et listes.')}
        value={prefs.density} onChange={(v) => update('density', v)}
        options={[{ value: 'compact', label: traduire('Compacte') }, { value: 'normal', label: traduire('Normale') }, { value: 'comfortable', label: traduire('Confortable') }]} />
      <SettingsSelect label={traduire('Taille du texte')} value={prefs.textSize} onChange={(v) => update('textSize', v)}
        options={[{ value: 'small', label: traduire('Petit') }, { value: 'normal', label: traduire('Normal') }, { value: 'large', label: traduire('Grand') }]} />
      <SettingsSelect label={traduire('Sidebar')} description={traduire('Affichage de la navigation principale.')}
        value={prefs.sidebarMode} onChange={(v) => update('sidebarMode', v)}
        options={[{ value: 'expanded', label: traduire('Toujours ouverte') }, { value: 'collapsed', label: traduire('Réduite') }]} />
      <SettingsToggle label={traduire('Animations')} description={traduire("Active les transitions et animations de l\'interface.")}
        checked={prefs.animations} onChange={(v) => update('animations', v)} />
    </SettingsCard>
  );
}

const APP_ITEMS = [
  ['nouvelles_demandes', 'Nouvelles demandes'], ['modification_profil', 'Modification du profil'],
  ['documents_disponibles', 'Documents disponibles'], ['validation_demande', "Validation d'une demande"],
  ['refus_demande', "Refus d'une demande"], ['messages_administratifs', 'Messages administratifs'],
  ['alertes_importantes', 'Alertes importantes'],
];
const EMAIL_ITEMS = [
  ['notifications_importantes', 'Notifications importantes'], ['nouvelles_demandes', 'Nouvelles demandes'],
  ['documents', 'Documents'], ['rappels', 'Rappels'], ['informations_administratives', 'Informations administratives'],
];

export function Notifications() {
  const { prefs, updateNested } = useSettingsPreferences();
  return (
    <div className="space-y-6">
      <SettingsCard icon={Bell} title={traduire("Notifications dans l\'application")} description={traduire('Choisissez les alertes affichées dans le SGRH.')}>
        {APP_ITEMS.map(([key, label]) => (
          <SettingsToggle key={key} label={label} checked={prefs.notifications.app[key]}
            onChange={(v) => updateNested('notifications', 'app', { ...prefs.notifications.app, [key]: v })} />
        ))}
      </SettingsCard>
      <SettingsCard icon={Mail} title={traduire('Notifications par email')} description={traduire('Choisissez les emails que vous souhaitez recevoir.')}>
        {EMAIL_ITEMS.map(([key, label]) => (
          <SettingsToggle key={key} label={label} checked={prefs.notifications.email[key]}
            onChange={(v) => updateNested('notifications', 'email', { ...prefs.notifications.email, [key]: v })} />
        ))}
      </SettingsCard>
    </div>
  );
}

export function LangueRegion() {
  const { prefs, update } = useSettingsPreferences();
  return (
    <SettingsCard icon={Globe} title={traduire('Langue & région')} description={traduire('Langue de l\'interface et formats d\'affichage.')}>
      <SettingsSelect label={traduire('Langue')} value={prefs.langue} onChange={(v) => update('langue', v)}
        options={[{ value: 'fr', label: traduire('Français') }, { value: 'en', label: traduire('English') }]} />
      <SettingsSelect label={traduire('Format de date')} value={prefs.dateFormat} onChange={(v) => update('dateFormat', v)}
        options={[{ value: 'dd/mm/yyyy', label: '17/09/2026' }, { value: 'long', label: '17 septembre 2026' }]} />
      <SettingsSelect label={traduire('Format horaire')} value={prefs.timeFormat} onChange={(v) => update('timeFormat', v)}
        options={[{ value: '24h', label: '24 heures' }, { value: '12h', label: '12 heures' }]} />
    </SettingsCard>
  );
}

export function Accessibilite() {
  const { prefs, update } = useSettingsPreferences();
  return (
    <SettingsCard icon={Accessibility} title={traduire('Accessibilité')} description={traduire("Ajustez l\'interface selon vos besoins.")}>
      <SettingsToggle label={traduire('Contraste élevé')} description={traduire('Renforce les contrastes de couleurs et le focus visible.')}
        checked={prefs.highContrast} onChange={(v) => update('highContrast', v)} />
      <SettingsToggle label={traduire('Réduction des animations')} description={traduire("Diminue les transitions et mouvements à l\'écran.")}
        checked={prefs.reduceMotion} onChange={(v) => update('reduceMotion', v)} />
      <SettingsToggle label={traduire('Mise en évidence des éléments interactifs')} description={traduire('Contour visible sur les boutons et liens au focus clavier.')}
        checked={prefs.keyboardHighlight} onChange={(v) => update('keyboardHighlight', v)} />
    </SettingsCard>
  );
}