const corbeilleRepository = require('../repositories/corbeilleRepository');
const activityLogRepository = require('../repositories/activityLogRepository');
const { sendAccountRestoredEmail } = require('../config/mailer');

async function list(req, res) {
  const items = await corbeilleRepository.listAll();
  return res.status(200).json({ items });
}

async function restore(req, res) {
  const item = await corbeilleRepository.findById(req.params.id);
  if (!item) return res.status(404).json({ message: 'Élément introuvable dans la corbeille' });

  try {
    let restored;
    if (item.type_element === 'compte') {
      restored = await corbeilleRepository.restoreCompte(item.donnees);
      if (!restored) {
        return res.status(400).json({ message: 'Restauration impossible : un compte avec ce même id, email ou fiche personnel existe déjà' });
      }
    } else {
      return res.status(400).json({ message: `Type d'élément non pris en charge pour la restauration : ${item.type_element}` });
    }

    await corbeilleRepository.removeFromCorbeille(req.params.id);
    await activityLogRepository.create(req.user.id, 'element_restaure', `${item.type_element} restauré depuis la corbeille`);

    // Notification best-effort : la restauration reste acquise même si l'e-mail échoue
    // (ex. service mail temporairement indisponible) — ce n'est qu'une information, pas
    // une condition de l'action elle-même. Par e-mail uniquement, aucun fournisseur SMS
    // n'étant configuré dans ce projet.
    if (restored.email) {
      try {
        await sendAccountRestoredEmail(restored.email);
      } catch (mailErr) {
        console.error('Échec de la notification de restauration par e-mail:', mailErr);
      }
    }

    return res.status(200).json({ message: 'Élément restauré' });
  } catch (err) {
    console.error('Erreur lors de la restauration', req.params.id, err);
    return res.status(500).json({ message: "La restauration a échoué. Aucune donnée n'a été modifiée." });
  }
}

async function remove(req, res) {
  const item = await corbeilleRepository.findById(req.params.id);
  if (!item) return res.status(404).json({ message: 'Élément introuvable' });

  await corbeilleRepository.removeFromCorbeille(req.params.id);
  await activityLogRepository.create(req.user.id, 'element_supprime_definitivement', `${item.type_element} supprimé définitivement de la corbeille`);

  return res.status(200).json({ message: 'Supprimé définitivement' });
}

async function empty(req, res) {
  const count = await corbeilleRepository.removeAll();
  if (count > 0) {
    await activityLogRepository.create(
      req.user.id,
      'corbeille_videe',
      `Corbeille vidée (${count} élément${count > 1 ? 's' : ''} supprimé${count > 1 ? 's' : ''} définitivement)`
    );
  }
  return res.status(200).json({ message: 'Corbeille vidée', count });
}

module.exports = { list, restore, remove, empty };