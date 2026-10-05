const PDFDocument = require('pdfkit');
const path = require('path');

const LOGO_UNIVERSITE = path.join(__dirname, '../../assets/logo-univ-mahajanga.png');
const LOGO_UM_HR = path.join(__dirname, '../../assets/logo-um-hr.png');
const CONCEPTEUR = 'JAOSOA Tanaël Faustin';

const MARGE = 50;
const ENTETE_HAUTEUR = 90;

const present = (valeur) => (valeur === null || valeur === undefined || valeur === '' ? '—' : String(valeur));
const date = (valeur) => (valeur ? new Date(valeur).toLocaleDateString('fr-FR') : '—');

function statutCompte(fiche) {
  if (!fiche.a_un_compte) return 'Sans compte';
  if (fiche.statut_compte === 'active') return 'Compte activé';
  if (fiche.statut_compte === 'pending') return 'En attente de validation';
  return 'Désactivé';
}

function sections(fiche) {
  const roles = (fiche.roles && fiche.roles.length ? fiche.roles : [fiche.role].filter(Boolean)).join(' + ');
  return [
    ['Identité', [
      ['Nom', fiche.nom], ['Prénom', fiche.prenom], ['Matricule', fiche.matricule], ['Email', fiche.email],
      ['Téléphone', fiche.telephone], ['Sexe', fiche.sexe], ['Date de naissance', date(fiche.date_naissance)],
      ['Lieu de naissance', fiche.lieu_naissance], ['Nationalité', fiche.nationalite],
      ['Situation familiale', fiche.situation_familiale], ['Adresse', fiche.adresse],
    ]],
    ['Emploi', [
      ['Rôle(s)', roles], ['Fonction', fiche.fonction], ['Poste', fiche.poste], ['Corps', fiche.corps],
      ['Grade', fiche.grade], ['Catégorie professionnelle', fiche.categorie_appellation],
      ['Classe', fiche.classe], ['Échelon', fiche.echelon], ['Indice', fiche.indice], ['IB (indice brut)', fiche.indice_num],
      ['Service', fiche.service], ['Direction', fiche.direction], ['Responsable hiérarchique', fiche.responsable_hierarchique],
      ['Type de contrat', fiche.type_contrat], ['Date de recrutement', date(fiche.date_recrutement)],
      ['Date de prise de fonction', date(fiche.date_prise_fonction)],
      ['Fin de contrat', fiche.contrat_permanent ? 'Contrat permanent' : date(fiche.date_echeance_contrat)],
      ['Solde de congés', fiche.solde_conges !== undefined && fiche.solde_conges !== null ? `${fiche.solde_conges} jour(s)` : '—'],
    ]],
    ['Enseignement (PE)', [
      ['Établissement', fiche.etablissement_nom], ['Corps académique', fiche.corps_pe],
      ['Diplôme', fiche.diplome], ['Spécialité', fiche.specialite],
    ]],
    ['Compte', [['Statut', statutCompte(fiche)]]],
  ];
}

function dessinerEntete(doc) {
  doc.image(LOGO_UNIVERSITE, MARGE, 25, { fit: [70, 45] });
}

function dessinerPiedDePage(doc, numero, total) {
  const marges = doc.page.margins;
  const y = doc.page.height - 40;
  marges.bottom = 0;
  doc.image(LOGO_UM_HR, MARGE, y - 6, { fit: [40, 20] });
  doc.fontSize(8).fillColor('#6b7280')
    .text(`Conçu et développé par ${CONCEPTEUR}`, MARGE + 50, y, { lineBreak: false, width: 300 })
    .text(`Page ${numero} / ${total}`, doc.page.width - MARGE - 100, y, { lineBreak: false, width: 100, align: 'right' });
  marges.bottom = 50;
}

// PDF simple et complet du dossier de profil : logo de l'université en haut à gauche de
// chaque page, petite marque UM-HR et crédit du concepteur en bas de chaque page.
function genererDossierPdf(fiche, sortie) {
  const doc = new PDFDocument({ size: 'A4', margins: { top: ENTETE_HAUTEUR, bottom: 50, left: MARGE, right: MARGE }, bufferPages: true });
  doc.pipe(sortie);

  doc.on('pageAdded', () => dessinerEntete(doc));
  dessinerEntete(doc);

  doc.font('Helvetica-Bold').fontSize(16).fillColor('#02295D').text('Dossier de profil', MARGE, doc.y);
  doc.font('Helvetica').fontSize(10).fillColor('#374151')
    .text(`${present(fiche.prenom)} ${present(fiche.nom)} — matricule ${present(fiche.matricule)}`, MARGE, doc.y)
    .text(`Édité le ${new Date().toLocaleDateString('fr-FR')}`, MARGE, doc.y);
  doc.moveDown(1);

  for (const [titre, lignes] of sections(fiche)) {
    doc.font('Helvetica-Bold').fontSize(12).fillColor('#02295D').text(titre, MARGE, doc.y);
    doc.moveTo(MARGE, doc.y + 2).lineTo(doc.page.width - MARGE, doc.y + 2).strokeColor('#d1d5db').stroke();
    doc.moveDown(0.5);
    for (const [libelle, valeur] of lignes) {
      const y = doc.y;
      doc.font('Helvetica-Bold').fontSize(10).fillColor('#374151').text(libelle, MARGE, y, { width: 170, continued: false });
      doc.font('Helvetica').fontSize(10).fillColor('#111827').text(present(valeur), MARGE + 180, y, { width: doc.page.width - MARGE * 2 - 180 });
      doc.moveDown(0.3);
    }
    doc.moveDown(0.8);
  }

  const range = doc.bufferedPageRange();
  for (let i = range.start; i < range.start + range.count; i++) {
    doc.switchToPage(i);
    dessinerPiedDePage(doc, i - range.start + 1, range.count);
  }
  doc.end();
}

module.exports = { genererDossierPdf };
