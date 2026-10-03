// Détecte le type d'une image par ses premiers octets (JPG/PNG/WebP), pour ne pas se
// fier au seul nom de fichier envoyé par le client (partagé entre l'upload de photo de
// profil et l'upload de logo/favicon du site).
function imageExtension(buffer) {
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return 'jpg';
  if (buffer.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'png';
  if (buffer.length >= 12 && buffer.subarray(0, 4).toString('ascii') === 'RIFF' && buffer.subarray(8, 12).toString('ascii') === 'WEBP') return 'webp';
  return null;
}

const SVG_DANGEREUX = /<script|<foreignObject|<iframe|<embed|<object|<!ENTITY|\son[a-z]+\s*=|javascript:|(href|src)\s*=\s*["']\s*(https?:|\/\/)/i;

function svgSur(buffer) {
  const texte = buffer.toString('utf8');
  if (!/^\s*(<\?xml[^>]*>\s*)?(<!--[\s\S]*?-->\s*)*(<!DOCTYPE[^>]*>\s*)?<svg[\s>]/i.test(texte)) return false;
  return !SVG_DANGEREUX.test(texte);
}

// Logos et favicon du site uniquement : un SVG est accepté s'il ne contient ni script
// ni attribut exécutable. Ne jamais l'utiliser pour les photos de profil.
function logoExtension(buffer) {
  return imageExtension(buffer) || (svgSur(buffer) ? 'svg' : null);
}

module.exports = { imageExtension, logoExtension };
