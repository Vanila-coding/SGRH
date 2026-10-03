import { traduire } from '../i18n';
export const TYPES_CONGE = [
  'Congé annuel', 'Permission', 'Autorisation d\'absence', 'Congé de maternité',
  'Congé de paternité', 'Congé de maladie', 'Formation', 'Autres',
];

export const JUSTIFICATIF_OBLIGATOIRE = ['Permission', 'Congé de maladie', 'Congé de maternité'];

export const STATUS_LABELS = {
  en_attente: { label: traduire('En attente'), color: 'text-status-pending' },
  approuvee: { label: traduire('Approuvée'), color: 'text-status-approved' },
  refusee: { label: traduire('Refusée'), color: 'text-status-rejected' },
};