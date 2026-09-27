import { useEffect, useState } from 'react';
import { listAllPermissions, updatePermission } from '../../services/permissionApi';
import PageHeader from '../../components/PageHeader';
import { SkeletonTable } from '../../components/ui/Skeleton';

const ROLES = ['ADMIN_RH', 'SUPERADMIN', 'PE', 'PAT', 'SECRETAIRE_PE', 'SECRETAIRE_PAT'];
const ROLE_LABELS = {
  ADMIN_RH: 'Admin RH', SUPERADMIN: 'Superadmin', PE: 'PE', PAT: 'PAT',
  SECRETAIRE_PE: 'Secrétaire PE', SECRETAIRE_PAT: 'Secrétaire PAT',
};

export default function Permissions() {
  const [raw, setRaw] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [savingKey, setSavingKey] = useState(null);

  async function load() {
    setLoading(true);
    try {
      setRaw(await listAllPermissions());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  // Regroupe la liste plate (une ligne par permission x rôle) en une matrice
  // { category: [ { id, key, label, byRole: { ADMIN_RH: {enabled, permissionId}, ... } } ] }
  const grouped = {};
  raw.forEach((row) => {
    if (!grouped[row.category]) grouped[row.category] = {};
    if (!grouped[row.category][row.key]) {
      grouped[row.category][row.key] = { id: row.id, key: row.key, label: row.label, byRole: {} };
    }
    grouped[row.category][row.key].byRole[row.role] = row.enabled;
  });

  async function handleToggle(permissionId, role, currentEnabled, key) {
    setSavingKey(`${role}-${key}`);
    setError('');
    try {
      await updatePermission(role, permissionId, !currentEnabled);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSavingKey(null);
    }
  }

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto">
        <PageHeader
          crumbs={[{ label: 'Administration' }, { label: 'Rôles & permissions' }]}
          title="Rôles & permissions"
          subtitle="Coche ou décoche pour activer/désactiver une fonctionnalité pour un rôle — la modification est immédiate"
        />
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <SkeletonTable rows={8} columns={5} />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <PageHeader
        crumbs={[{ label: 'Administration' }, { label: 'Rôles & permissions' }]}
        title="Rôles & permissions"
        subtitle="Coche ou décoche pour activer/désactiver une fonctionnalité pour un rôle — la modification est immédiate"
      />

      {error && <p className="text-sm text-status-rejected mb-4">{error}</p>}

      {Object.entries(grouped).map(([category, permissions]) => (
        <div key={category} className="bg-white dark:bg-gray-800 rounded-lg shadow mb-4 overflow-x-auto">
          <div className="bg-gray-50 dark:bg-gray-700 px-4 py-2 font-semibold text-navy dark:text-gold text-sm">
            {category}
          </div>
          <table className="w-full min-w-max text-sm">
            <thead>
              <tr className="border-b dark:border-gray-700">
                <th className="text-left px-4 py-2 font-medium text-gray-500 dark:text-gray-400">Fonctionnalité</th>
                {ROLES.map((role) => (
                  <th key={role} className="px-3 py-2 font-medium text-gray-500 dark:text-gray-400 text-center">{ROLE_LABELS[role]}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Object.values(permissions).map((perm) => (
                <tr key={perm.key} className="border-b last:border-0 dark:border-gray-700">
                  <td className="px-4 py-2 text-navy dark:text-gray-100">{perm.label}</td>
                  {ROLES.map((role) => {
                    const enabled = perm.byRole[role] || false;
                    const isSaving = savingKey === `${role}-${perm.key}`;
                    return (
                      <td key={role} className="px-3 py-2 text-center">
                        <input
                          type="checkbox"
                          checked={enabled}
                          disabled={isSaving}
                          onChange={() => handleToggle(perm.id, role, enabled, perm.key)}
                          className="w-4 h-4 accent-navy cursor-pointer disabled:opacity-40"
                        />
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
}
