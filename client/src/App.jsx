import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { ThemeProvider } from './context/ThemeContext';
import { PermissionProvider } from './context/PermissionContext';
import { TextProvider } from './context/TextContext';
import { SiteSettingsProvider } from './context/SiteSettingsContext';
import { SettingsPreferencesProvider } from './context/SettingsPreferencesContext';
import ProtectedRoute from './components/ProtectedRoute';
import AppShell from './components/layout/AppShell';
import Login from './pages/Login';
import Register from './pages/Register';
import MotDePasseOublie from './pages/MotDePasseOublie';
import ReinitialiserMotDePasse from './pages/ReinitialiserMotDePasse';
import NotificationsPage from './pages/NotificationsPage';
import Parametres from './pages/Parametres';
import FicheDemande from './pages/FicheDemande';
import DocumentImprimable from './pages/DocumentImprimable';
import VerificationAvis from './pages/VerificationAvis';
import ParOuCommencer from './pages/aide/ParOuCommencer';
import VosDroits from './pages/aide/VosDroits';
import Procedures from './pages/aide/Procedures';
import Reclamation from './pages/aide/Reclamation';
import Dashboard from './pages/admin-rh/Dashboard';
import Personnel from './pages/admin-rh/Personnel';
import PersonnelPE from './pages/admin-rh/PersonnelPE';
import PersonnelFiche from './pages/admin-rh/PersonnelFiche';
import OrganisationRH from './pages/admin-rh/OrganisationRH';
import Etablissements from './pages/admin-rh/Etablissements';
import Invitations from './pages/admin-rh/Invitations';
import ComptesEnAttente from './pages/admin-rh/ComptesEnAttente';
import EnvoyerNotification from './pages/admin-rh/EnvoyerNotification';
import GestionFonctions from './pages/admin-rh/GestionFonctions';
import Carriere from './pages/admin-rh/Carriere';
import ContratsAdmin from './pages/admin-rh/Contrats';
import ParametresCarriere from './pages/admin-rh/ParametresCarriere';
import CongesAdmin from './pages/admin-rh/CongesAdmin';
import DocumentsAdmin from './pages/admin-rh/DocumentsAdmin';
import DemandesDocuments from './pages/admin-rh/DemandesDocuments';
import Historique from './pages/admin-rh/Historique';
import CongesSecretariat from './pages/secretariat/CongesSecretariat';
import DemandesDocumentsSecretariat from './pages/secretariat/DemandesDocumentsSecretariat';
import ComptesSuperadmin from './pages/superadmin/Comptes';
import PermissionsSuperadmin from './pages/superadmin/Permissions';
import CorbeilleSuperadmin from './pages/superadmin/Corbeille';
import ReclamationsSuperadmin from './pages/superadmin/Reclamations';
import ApparenceSite from './pages/superadmin/ApparenceSite';
import SuperadminDashboard from './pages/superadmin/Dashboard';
import PersonnelDashboard from './pages/personnel/Dashboard';
import Profil from './pages/personnel/Profil';
import MaCarriere from './pages/personnel/MaCarriere';
import MesContrats from './pages/personnel/MesContrats';
import Conges from './pages/personnel/Conges';
import MonEquipe from './pages/personnel/MonEquipe';
import ValidationEquipe from './pages/personnel/ValidationEquipe';
import MesDocuments from './pages/personnel/MesDocuments';
import { traduire } from './i18n';

const ALL_ROLES = ['ADMIN_RH', 'SUPERADMIN', 'PE', 'PAT', 'SECRETAIRE_PE', 'SECRETAIRE_PAT'];
// Les routes en libre-service (mon dossier, mes congés, aide...) n'ont pas de prop
// `permission` : `allowedRoles` y est le seul verrou. Un compte Secrétaire garde son
// propre espace personnel (la promotion ne change que le rôle d'accès système, pas
// son identité de personnel PE/PAT), d'où leur présence ici.
const PE_PAT = ['PE', 'PAT', 'SECRETAIRE_PE', 'SECRETAIRE_PAT'];
const ADMIN_OR_SUPERADMIN = ['ADMIN_RH', 'SUPERADMIN'];

function App() {
  return (
    <ToastProvider>
    <ThemeProvider>
      <SiteSettingsProvider>
      <TextProvider>
        <SettingsPreferencesProvider>
        <BrowserRouter>
          <AuthProvider>
            <PermissionProvider>
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/mot-de-passe-oublie" element={<MotDePasseOublie />} />
                <Route path="/verification/:token" element={<VerificationAvis />} />
                <Route path="/reset-password" element={<ReinitialiserMotDePasse />} />

                <Route path="/demandes/:id/fiche" element={
                  <ProtectedRoute allowedRoles={ALL_ROLES}>
                    <FicheDemande />
                  </ProtectedRoute>
                } />
                <Route path="/documents/:id" element={
                  <ProtectedRoute allowedRoles={ALL_ROLES}>
                    <DocumentImprimable />
                  </ProtectedRoute>
                } />

                <Route path="/notifications" element={
                  <ProtectedRoute allowedRoles={ALL_ROLES} permission="view_notifications">
                    <AppShell title={traduire('Notifications')} subtitle={traduire('Gestion des Ressources Humaines')}><NotificationsPage /></AppShell>
                  </ProtectedRoute>
                } />
                <Route path="/parametres" element={
                  <ProtectedRoute allowedRoles={ALL_ROLES}>
                    <AppShell title={traduire('Paramètres')} subtitle={traduire('Gestion des Ressources Humaines')}><Parametres /></AppShell>
                  </ProtectedRoute>
                } />

                <Route path="/aide/commencer" element={
                  <ProtectedRoute allowedRoles={PE_PAT}>
                    <AppShell title={traduire('Par où commencer')} subtitle={traduire('Documentation')}><ParOuCommencer /></AppShell>
                  </ProtectedRoute>
                } />
                <Route path="/aide/droits" element={
                  <ProtectedRoute allowedRoles={PE_PAT}>
                    <AppShell title={traduire('Vos droits')} subtitle={traduire('Documentation')}><VosDroits /></AppShell>
                  </ProtectedRoute>
                } />
                <Route path="/aide/procedures" element={
                  <ProtectedRoute allowedRoles={PE_PAT}>
                    <AppShell title={traduire('Les procédures')} subtitle={traduire('Documentation')}><Procedures /></AppShell>
                  </ProtectedRoute>
                } />
                <Route path="/aide/signaler" element={
                  <ProtectedRoute allowedRoles={PE_PAT} permission="signaler_probleme">
                    <AppShell title={traduire('Signaler un problème')} subtitle={traduire('Documentation')}><Reclamation /></AppShell>
                  </ProtectedRoute>
                } />

                <Route path="/mon-equipe" element={
                  <ProtectedRoute allowedRoles={PE_PAT}>
                    <AppShell title={traduire('Mon équipe')} subtitle={traduire('Gestion des Ressources Humaines')}><MonEquipe /></AppShell>
                  </ProtectedRoute>
                } />
                <Route path="/validation-equipe" element={
                  <ProtectedRoute allowedRoles={PE_PAT}>
                    <AppShell title={traduire('Validation équipe')} subtitle={traduire('Gestion des Ressources Humaines')}><ValidationEquipe /></AppShell>
                  </ProtectedRoute>
                } />
                <Route path="/mes-documents" element={
                  <ProtectedRoute allowedRoles={PE_PAT} permission="demander_document">
                    <AppShell title={traduire('Mes documents')} subtitle={traduire('Gestion des Ressources Humaines')}><MesDocuments /></AppShell>
                  </ProtectedRoute>
                } />

                <Route path="/admin/dashboard" element={
                  <ProtectedRoute allowedRoles={ADMIN_OR_SUPERADMIN} permission="view_dashboard_admin">
                    <AppShell title={traduire('Tableau de bord')} subtitle={traduire('Gestion des Ressources Humaines')}><Dashboard /></AppShell>
                  </ProtectedRoute>
                } />
                <Route path="/admin/personnel/:id/fiche" element={
                  <ProtectedRoute allowedRoles={ADMIN_OR_SUPERADMIN} permission="view_personnel">
                    <AppShell title={traduire('Personnel')} subtitle={traduire('Gestion des Ressources Humaines')}><PersonnelFiche /></AppShell>
                  </ProtectedRoute>
                } />
                <Route path="/admin/personnel/pe" element={
                  <ProtectedRoute allowedRoles={ADMIN_OR_SUPERADMIN} permission="view_personnel">
                    <AppShell title={traduire('Personnel enseignant')} subtitle={traduire('Gestion des Ressources Humaines')}><PersonnelPE /></AppShell>
                  </ProtectedRoute>
                } />
                <Route path="/admin/personnel/etablissements" element={
                  <ProtectedRoute allowedRoles={ADMIN_OR_SUPERADMIN} permission="manage_etablissements">
                    <AppShell title={traduire('Établissements')} subtitle={traduire('Gestion des Ressources Humaines')}><Etablissements /></AppShell>
                  </ProtectedRoute>
                } />
                <Route path="/admin/personnel" element={
                  <ProtectedRoute allowedRoles={ADMIN_OR_SUPERADMIN} permission="view_personnel">
                    <AppShell title={traduire('Personnel')} subtitle={traduire('Gestion des Ressources Humaines')}><Personnel /></AppShell>
                  </ProtectedRoute>
                } />
                <Route path="/admin/organisation" element={
                  <ProtectedRoute allowedRoles={ADMIN_OR_SUPERADMIN} permission="manage_organisation">
                    <AppShell title={traduire('Directions & services')} subtitle={traduire('Gestion des Ressources Humaines')}><OrganisationRH /></AppShell>
                  </ProtectedRoute>
                } />
                <Route path="/admin/invitations" element={
                  <ProtectedRoute allowedRoles={ADMIN_OR_SUPERADMIN} permission="send_registration_link">
                    <AppShell title={traduire('Inviter un personnel')} subtitle={traduire('Gestion des Ressources Humaines')}><Invitations /></AppShell>
                  </ProtectedRoute>
                } />
                <Route path="/admin/comptes-attente" element={
                  <ProtectedRoute allowedRoles={ADMIN_OR_SUPERADMIN} permission="view_pending_accounts">
                    <AppShell title={traduire('Comptes en attente')} subtitle={traduire('Gestion des Ressources Humaines')}><ComptesEnAttente /></AppShell>
                  </ProtectedRoute>
                } />
                <Route path="/admin/notifications" element={
                  <ProtectedRoute allowedRoles={ADMIN_OR_SUPERADMIN} permission="send_notification">
                    <AppShell title={traduire('Envoyer une notification')} subtitle={traduire('Gestion des Ressources Humaines')}><EnvoyerNotification /></AppShell>
                  </ProtectedRoute>
                } />
                <Route path="/admin/fonctions" element={
                  <ProtectedRoute allowedRoles={ADMIN_OR_SUPERADMIN} permission="manage_fonctions">
                    <AppShell title={traduire('Gestion des fonctions')} subtitle={traduire('Gestion des Ressources Humaines')}><GestionFonctions /></AppShell>
                  </ProtectedRoute>
                } />
                <Route path="/admin/carriere" element={
                  <ProtectedRoute allowedRoles={ADMIN_OR_SUPERADMIN} permission="manage_fonctions">
                    <AppShell title={traduire('Carrière')} subtitle={traduire('Gestion des Ressources Humaines')}><Carriere /></AppShell>
                  </ProtectedRoute>
                } />
                <Route path="/admin/contrats" element={
                  <ProtectedRoute allowedRoles={ADMIN_OR_SUPERADMIN} permission="manage_fonctions">
                    <AppShell title={traduire('Contrats')} subtitle={traduire('Gestion des Ressources Humaines')}><ContratsAdmin /></AppShell>
                  </ProtectedRoute>
                } />
                <Route path="/admin/parametres-carriere" element={
                  <ProtectedRoute allowedRoles={ADMIN_OR_SUPERADMIN} permission="manage_parametres_carriere">
                    <AppShell title={traduire('Paramètres de carrière')} subtitle={traduire('Gestion des Ressources Humaines')}><ParametresCarriere /></AppShell>
                  </ProtectedRoute>
                } />
                <Route path="/admin/conges" element={
                  <ProtectedRoute allowedRoles={ADMIN_OR_SUPERADMIN} permission="view_conges_admin">
                    <AppShell title={traduire('Congés & absences')} subtitle={traduire('Gestion des Ressources Humaines')}><CongesAdmin /></AppShell>
                  </ProtectedRoute>
                } />
                <Route path="/admin/documents" element={
                  <ProtectedRoute allowedRoles={ADMIN_OR_SUPERADMIN} permission="manage_documents">
                    <AppShell title={traduire('Documents administratifs')} subtitle={traduire('Gestion des Ressources Humaines')}><DocumentsAdmin /></AppShell>
                  </ProtectedRoute>
                } />
                <Route path="/admin/demandes-documents" element={
                  <ProtectedRoute allowedRoles={ADMIN_OR_SUPERADMIN} permission="manage_documents">
                    <AppShell title={traduire('Demandes de documents')} subtitle={traduire('Gestion des Ressources Humaines')}><DemandesDocuments /></AppShell>
                  </ProtectedRoute>
                } />
                <Route path="/admin/historique" element={
                  <ProtectedRoute allowedRoles={ADMIN_OR_SUPERADMIN} permission="view_historique">
                    <AppShell title={traduire('Audit & journal')} subtitle={traduire('Gestion des Ressources Humaines')}><Historique /></AppShell>
                  </ProtectedRoute>
                } />
                <Route path="/secretariat/conges" element={
                  <ProtectedRoute allowedRoles={[...ADMIN_OR_SUPERADMIN, 'SECRETAIRE_PE', 'SECRETAIRE_PAT']} permission="review_conges_secretariat">
                    <AppShell title={traduire('Congés à vérifier')} subtitle={traduire('Secrétariat')}><CongesSecretariat /></AppShell>
                  </ProtectedRoute>
                } />
                <Route path="/secretariat/documents" element={
                  <ProtectedRoute allowedRoles={[...ADMIN_OR_SUPERADMIN, 'SECRETAIRE_PE', 'SECRETAIRE_PAT']} permission="review_documents_secretariat">
                    <AppShell title={traduire('Demandes de documents')} subtitle={traduire('Secrétariat')}><DemandesDocumentsSecretariat /></AppShell>
                  </ProtectedRoute>
                } />

                <Route path="/superadmin/dashboard" element={
                  <ProtectedRoute allowedRoles={['SUPERADMIN']} permission="view_dashboard_admin">
                    <AppShell title={traduire('Tableau de bord')} subtitle={traduire('Administration système')}><SuperadminDashboard /></AppShell>
                  </ProtectedRoute>
                } />
                <Route path="/superadmin/comptes" element={
                  <ProtectedRoute allowedRoles={['SUPERADMIN']} permission="manage_accounts">
                    <AppShell title={traduire('Gestion des comptes')} subtitle={traduire('Administration système')}><ComptesSuperadmin /></AppShell>
                  </ProtectedRoute>
                } />
                <Route path="/superadmin/corbeille" element={
                  <ProtectedRoute allowedRoles={['SUPERADMIN']} permission="manage_corbeille">
                    <AppShell title={traduire('Corbeille')} subtitle={traduire('Administration système')}><CorbeilleSuperadmin /></AppShell>
                  </ProtectedRoute>
                } />
                <Route path="/superadmin/permissions" element={
                  <ProtectedRoute allowedRoles={['SUPERADMIN']} permission="manage_permissions">
                    <AppShell title={traduire('Gestion des permissions')} subtitle={traduire('Administration système')}><PermissionsSuperadmin /></AppShell>
                  </ProtectedRoute>
                } />
                <Route path="/superadmin/reclamations" element={
                  <ProtectedRoute allowedRoles={['SUPERADMIN']} permission="manage_reclamations">
                    <AppShell title={traduire('Réclamations')} subtitle={traduire('Administration système')}><ReclamationsSuperadmin /></AppShell>
                  </ProtectedRoute>
                } />
                <Route path="/superadmin/apparence" element={
                  <ProtectedRoute allowedRoles={['SUPERADMIN']} permission="manage_site_texts">
                    <AppShell title={traduire('Personnalisation')} subtitle={traduire('Administration système')}><ApparenceSite /></AppShell>
                  </ProtectedRoute>
                } />

                <Route path="/dashboard" element={
                  <ProtectedRoute allowedRoles={PE_PAT}>
                    <AppShell title={traduire('Espace personnel')} subtitle={traduire('Gestion des Ressources Humaines')}><PersonnelDashboard /></AppShell>
                  </ProtectedRoute>
                } />
                <Route path="/profil" element={
                  <ProtectedRoute allowedRoles={PE_PAT} permission="view_profil">
                    <AppShell title={traduire('Mon dossier')} subtitle={traduire('Gestion des Ressources Humaines')}><Profil /></AppShell>
                  </ProtectedRoute>
                } />
                <Route path="/carriere" element={
                  <ProtectedRoute allowedRoles={PE_PAT} permission="view_profil">
                    <AppShell title={traduire('Ma carrière')} subtitle={traduire('Gestion des Ressources Humaines')}><MaCarriere /></AppShell>
                  </ProtectedRoute>
                } />
                <Route path="/mes-contrats" element={
                  <ProtectedRoute allowedRoles={PE_PAT} permission="view_profil">
                    <AppShell title={traduire('Mes contrats')} subtitle={traduire('Gestion des Ressources Humaines')}><MesContrats /></AppShell>
                  </ProtectedRoute>
                } />
                <Route path="/conges" element={
                  <ProtectedRoute allowedRoles={PE_PAT} permission="view_mes_conges">
                    <AppShell title={traduire('Mes congés & absences')} subtitle={traduire('Gestion des Ressources Humaines')}><Conges /></AppShell>
                  </ProtectedRoute>
                } />

                <Route path="*" element={<Navigate to="/login" replace />} />
              </Routes>
            </PermissionProvider>
          </AuthProvider>
        </BrowserRouter>
        </SettingsPreferencesProvider>
      </TextProvider>
      </SiteSettingsProvider>
    </ThemeProvider>
    </ToastProvider>
  );
}

export default App;