import { useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { usePermissions } from '../context/PermissionContext';
import { SETTINGS_CATEGORIES } from '../config/settingsConfig';
import SettingsRedirect from '../components/settings/SettingsRedirect';
import PageHeader from '../components/PageHeader';
import { ProfilCompte, Securite, Sessions } from './parametres/CompteTabs';
import { Apparence, Notifications, LangueRegion, Accessibilite } from './parametres/PreferencesTabs';
import { PreferencesTableaux, Documents } from './parametres/DonneesTabs';
import { Fonctionnalites, Maintenance } from './parametres/SystemeTabs';
import { traduire } from '../i18n';

const CONTENT = {
  profil: ProfilCompte, securite: Securite, sessions: Sessions,
  apparence: Apparence, notifications: Notifications, langue: LangueRegion, accessibilite: Accessibilite,
  tableaux: PreferencesTableaux, documents: Documents,
  fonctionnalites: Fonctionnalites, maintenance: Maintenance,
};

export default function Parametres() {
  const { user } = useAuth();
  const { can, loading } = usePermissions();

  const visibleCategories = useMemo(() => (
    SETTINGS_CATEGORIES
      .map((cat) => ({
        ...cat,
        items: cat.items.filter((item) => {
          const roleOk = item.roles.includes(user?.role);
          const permOk = !item.permission || loading || can(item.permission);
          return roleOk && permOk;
        }),
      }))
      .filter((cat) => cat.items.length > 0)
  ), [user, can, loading]);

  const allItems = visibleCategories.flatMap((c) => c.items);
  const [activeKey, setActiveKey] = useState(null);
  const activeItem = allItems.find((i) => i.key === activeKey) || allItems[0];

  if (!activeItem) {
    return <p className="text-sm text-gray-500 dark:text-gray-400">{traduire('Aucun paramètre disponible pour votre rôle.')}</p>;
  }

  const ContentComponent = CONTENT[activeItem.key];

  return (
    <div>
      <PageHeader
        crumbs={[{ label: traduire('Paramètres') }]}
        title={traduire('Paramètres')}
        subtitle={traduire('Gérez votre compte, vos préférences et les paramètres de votre espace SGRH')}
      />

      <div className="flex flex-col gap-6 lg:flex-row">
        <nav className="lg:w-64 shrink-0 overflow-x-auto lg:overflow-visible">
          <div className="flex gap-4 pb-1 lg:block lg:space-y-5 lg:pb-0">
            {visibleCategories.map((cat) => (
              <div key={cat.key} className="shrink-0 lg:shrink lg:w-full">
                <p className="hidden lg:block px-3 mb-1 text-[11px] font-semibold uppercase text-slate-400 tracking-wide">
                  {cat.label}
                </p>
                <div className="flex gap-1 lg:flex-col">
                  {cat.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = item.key === activeItem.key;
                    return (
                      <button key={item.key} type="button" onClick={() => setActiveKey(item.key)}
                        className={`flex items-center gap-2 whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium transition ${
                          isActive ? 'bg-navy text-white dark:bg-gold dark:text-navy' : 'text-slate-600 hover:bg-slate-100 dark:text-gray-300 dark:hover:bg-gray-700'
                        }`}
                      >
                        <Icon size={16} />
                        {item.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </nav>

        <div className="min-w-0 flex-1">
          {activeItem.path ? (
            <SettingsRedirect icon={activeItem.icon} title={activeItem.label} description={activeItem.description} path={activeItem.path} />
          ) : (
            ContentComponent && <ContentComponent />
          )}
        </div>
      </div>
    </div>
  );
}