const userRepository = require('../repositories/userRepository');
const invitationRepository = require('../repositories/invitationRepository');
const congeRepository = require('../repositories/congeRepository');
const demandeDocumentRepository = require('../repositories/demandeDocumentRepository');

async function getAdminDashboardStats() {
  const byRole = await userRepository.countByRole();
  const pe = byRole.find((r) => r.role === 'PE')?.count || 0;
  const pat = byRole.find((r) => r.role === 'PAT')?.count || 0;

  const [
    pendingValidation,
    newThisMonth,
    congesEnAttente,
    documentsEnAttente,
    congesSecretariat,
    documentsSecretariat,
  ] = await Promise.all([
    invitationRepository.countByStatus('soumise'),
    userRepository.countNewThisMonth(),
    congeRepository.findPending(),
    demandeDocumentRepository.findPending(),
    // roleCible = null : file combinée PE + PAT, celle que voit un ADMIN_RH en repli
    // anti-blocage (mêmes permissions qu'un secrétaire, voir migration 019).
    congeRepository.findPendingForSecretariat(null),
    demandeDocumentRepository.findPendingForSecretariat(null),
  ]);

  return {
    totalPersonnel: pe + pat,
    pe,
    pat,
    pendingValidation,
    newThisMonth,
    congesEnAttente: congesEnAttente.length,
    documentsEnAttente: documentsEnAttente.length,
    secretariatEnAttente: congesSecretariat.length + documentsSecretariat.length,
  };
}

module.exports = { getAdminDashboardStats };