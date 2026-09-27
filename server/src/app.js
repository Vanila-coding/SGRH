require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const invitationRoutes = require('./routes/invitation.routes');
const authRoutes = require('./routes/auth.routes');
const statsRoutes = require('./routes/stats.routes');
const notificationRoutes = require('./routes/notification.routes');
const userRoutes = require('./routes/user.routes');
const congeRoutes = require('./routes/conge.routes');
const activityLogRoutes = require('./routes/activityLog.routes');
const personnelRoutes = require('./routes/personnel.routes');
const otpRoutes = require('./routes/otp.routes');
const registerRoutes = require('./routes/register.routes');
const pendingAccountRoutes = require('./routes/pendingAccount.routes');
const accountAdminRoutes = require('./routes/accountAdmin.routes');
const permissionRoutes = require('./routes/permission.routes');
const carriereRoutes = require('./routes/carriere.routes');
const corbeilleRoutes = require('./routes/corbeille.routes');
const siteSettingsRoutes = require('./routes/siteSettings.routes');
const siteTextsRoutes = require('./routes/siteTexts.routes');
const documentRoutes = require('./routes/document.routes');
const organisationRoutes = require('./routes/organisation.routes');
const categorieRoutes = require('./routes/categorie.routes');
const situationAdministrativeRoutes = require('./routes/situationAdministrative.routes');
const parametreCarriereRoutes = require('./routes/parametreCarriere.routes');
const contratRoutes = require('./routes/contrat.routes');
const grilleIndiciaireRoutes = require('./routes/grilleIndiciaire.routes');
const verificationRoutes = require('./routes/verification.routes');
const reclamationRoutes = require('./routes/reclamation.routes');
const etablissementRoutes = require('./routes/etablissement.routes');
const contratEcheanceJob = require('./services/contratEcheanceJob');
const avancementEcheanceJob = require('./services/avancementEcheanceJob');


const app = express();

app.use(cors());
app.use(express.json());
// Seules les photos de profil restent servies publiquement (avatars affichés partout
// dans l'app, sensibilité faible, noms de fichiers UUID). Les autres pièces jointes
// (justificatifs congés/carrière/situations, diplômes) ne sont plus sous express.static :
// elles ne sont accessibles que via une route authentifiée avec vérification RH/propriétaire
// (voir server/src/utils/secureFileServing.js) — un répertoire /uploads entier servi sans
// authentification était une fuite potentielle de documents personnels.
app.use('/uploads/profile-photos', express.static(path.join(__dirname, '../uploads/profile-photos')));
// Logo, favicon, logo de connexion : mêmes raisons (utilisés publiquement, y compris sur
// la page de connexion avant authentification ; noms de fichiers UUID).
app.use('/uploads/site', express.static(path.join(__dirname, '../uploads/site')));

app.use('/api/invitations', invitationRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/users', userRoutes);
app.use('/api/conges', congeRoutes);
app.use('/api/activity-log', activityLogRoutes);
app.use('/api/personnel', personnelRoutes);
app.use('/api/otp', otpRoutes);
app.use('/api/register', registerRoutes);
app.use('/api/pending-accounts', pendingAccountRoutes);
app.use('/api/account-admin', accountAdminRoutes);
app.use('/api/permissions', permissionRoutes);
app.use('/api/carriere', carriereRoutes);
app.use('/api/corbeille', corbeilleRoutes);
app.use('/api/site-settings', siteSettingsRoutes);
app.use('/api/site-texts', siteTextsRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/organisation', organisationRoutes);
app.use('/api/categories', categorieRoutes);
app.use('/api/situations-administratives', situationAdministrativeRoutes);
app.use('/api/parametres-carriere', parametreCarriereRoutes);
app.use('/api/contrats', contratRoutes);
app.use('/api/indiciaire', grilleIndiciaireRoutes);
app.use('/api/verification', verificationRoutes);
app.use('/api/reclamations', reclamationRoutes);
app.use('/api/etablissements', etablissementRoutes);

app.use((req, res) => res.status(404).json({ message: 'Route introuvable' }));

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Serveur RH démarré sur le port ${PORT}`));

if (!process.env.QR_SECRET) {
  console.warn('[config] QR_SECRET absent : les QR codes de vérification des avis sont désactivés.');
}
contratEcheanceJob.start();
avancementEcheanceJob.start();