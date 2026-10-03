import { traduire } from '../../i18n';
// Décision d'octroi d'une fraction de congé et état de congé (mise en page des fiches
// du Service du Personnel). Les données viennent du snapshot figé du document.

// AAAA-MM-JJ -> JJ/MM/AAAA, sans passer par Date (pas de décalage de fuseau).
function dmy(iso) {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(iso || ''));
  return m ? `${m[3]}/${m[2]}/${m[1]}` : '____/____/____';
}

function dateLongue(iso) {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(iso || ''));
  if (!m) return '____';
  return new Date(+m[1], +m[2] - 1, +m[3]).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}

const jrs = (n) => `${Number(n).toLocaleString('fr-FR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} jrs`;

function Position({ titre, p }) {
  return (
    <div className="p-3 space-y-1">
      <p className="font-bold text-center border-b border-black pb-1 mb-2">{titre}</p>
      <p><strong>{traduire('IM :')}</strong> {p.iM || '—'}</p>
      <p><strong>{traduire('Budget :')}</strong> {p.budget ? `Chapitre ${p.budget}` : '—'}</p>
      <p><strong>{traduire('Corps :')}</strong> {p.corps || '—'}</p>
      <p><strong>{traduire('Grade :')}</strong> {p.grade || '—'}</p>
      <p><strong>{traduire('Fonction :')}</strong> {p.fonction || '—'}</p>
      <p><strong>{traduire('Indice :')}</strong> {p.indice || '—'}</p>
    </div>
  );
}

export function DecisionConge({ doc }) {
  const d = doc.donnees;
  const annees = [...(d.anneesService || []), ...(d.soldeAnterieur ? ["solde d'ouverture antérieur"] : [])];
  return (
    <div className="text-sm" data-testid="decision-conge">
      <p className="mb-1"><span className="font-bold underline">{traduire('Décision N°')}</span> {d.numero}</p>
      <p className="font-bold mb-5">Portant octroi d'une fraction de congé de {d.jours} jours.</p>

      <p className="mb-1"><span className="font-bold underline">{traduire('Nom :')}</span> {d.nom}</p>
      <p className="mb-4"><span className="font-bold underline">{traduire('Prénoms :')}</span> {d.prenom}</p>

      <div className="border border-black">
        <div className="grid grid-cols-2 divide-x divide-black border-b border-black">
          <Position titre="ANCIENNE POSITION" p={d.ancienne} />
          <Position titre="NOUVELLE POSITION" p={d.nouvelle} />
        </div>
        <div className="grid grid-cols-2 divide-x divide-black">
          <div className="p-3 text-xs space-y-1">
            <p className="font-bold underline text-sm">{traduire('AMPLIATION')}</p>
            {d.ampliation.map((a) => (
              <p key={a.destinataire}>
                {a.destinataire}
                {a.mention ? (a.destinataire.startsWith('Service de') ? ` : ${a.mention}` : ` « ${a.mention} »`) : ''}
              </p>
            ))}
          </div>
          <div className="p-3">
            <p className="italic font-semibold">
              Obtient une fraction de congé de : {d.joursEnLettres} ({d.jours}) avec solde entière
              {annees.length > 0 ? ` pour service effectué pendant le(s) année(s) : ${annees.join(', ')}` : ''}
              {d.lieuJouissance ? ` pour en jouir à : ${d.lieuJouissance}` : ''}.
            </p>
            <p className="mt-4">Date de notification : {dateLongue(d.dateNotification)}</p>
            <p className="mt-2">Date de départ : {dateLongue(d.dateDepart)}</p>
            <p className="mt-2">Date de reprise : {dateLongue(d.dateReprise)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function EtatConge({ doc }) {
  const e = doc.donnees;
  return (
    <div className="text-sm" data-testid="etat-conge">
      <h1 className="text-center text-xl font-bold underline mb-5">{traduire('ETAT DE CONGE')}</h1>

      <div className="space-y-1 mb-4">
        <p><strong className="underline">{traduire('Service :')}</strong> {e.service || '—'}</p>
        <p><strong className="underline">{traduire('Fonction :')}</strong> {e.fonction || '—'}</p>
        <p><strong className="underline">{traduire('Nom :')}</strong> {e.nom}</p>
        <p><strong className="underline">{traduire('Prénoms :')}</strong> {e.prenom}</p>
        <p><strong className="underline">{traduire('LM :')}</strong> {e.matricule}</p>
        <p><strong className="underline">{traduire('Statut :')}</strong> {e.statut || '—'}</p>
      </div>

      <div className="overflow-x-auto print:overflow-visible">
      <table className="w-full border-collapse border border-black text-center text-xs">
        <thead>
          <tr className="font-bold">
            {['Année', 'Droit', 'Date de début', 'Date de fin', 'Congé pris', 'Congé restant'].map((h) => (
              <th key={h} className="border border-black p-1.5">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {e.lignes.map((l) => {
            const lignes = l.conges.length > 0 ? l.conges : [null];
            return lignes.map((c, i) => (
              <tr key={`${l.annee}-${i}`}>
                {i === 0 && <td rowSpan={lignes.length} className="border border-black p-1.5 font-bold">{l.libellePeriode || l.annee}</td>}
                {i === 0 && <td rowSpan={lignes.length} className="border border-black p-1.5">{jrs(l.droit)}</td>}
                <td className="border border-black p-1.5">{c ? dmy(c.dateDebut) : ''}</td>
                <td className="border border-black p-1.5">{c ? dmy(c.dateFin) : ''}</td>
                <td className="border border-black p-1.5">{c ? jrs(c.jours) : ''}</td>
                {i === 0 && <td rowSpan={lignes.length} className="border border-black p-1.5 font-bold">{jrs(l.restant)}</td>}
              </tr>
            ));
          })}
          {e.ouverture && (
            <tr>
              <td className="border border-black p-1.5 font-bold">{traduire('Solde d\'ouverture antérieur (non ventilé par année)')}</td>
              <td className="border border-black p-1.5">—</td>
              <td className="border border-black p-1.5" />
              <td className="border border-black p-1.5" />
              <td className="border border-black p-1.5">{e.ouverture.pris > 0 ? jrs(e.ouverture.pris) : ''}</td>
              <td className="border border-black p-1.5 font-bold">{jrs(e.ouverture.restant)}</td>
            </tr>
          )}
          {e.lignes.length === 0 && !e.ouverture && (
            <tr><td colSpan={6} className="border border-black p-3 text-gray-500">{traduire('Aucun droit à congé enregistré.')}</td></tr>
          )}
        </tbody>
      </table>
      </div>

      <p className="text-right font-bold mt-3">{traduire('Total de congé :')}<span className="inline-block border border-black px-3 py-1 ml-2">{Number(e.total).toLocaleString('fr-FR', { minimumFractionDigits: 1 })} Jrs</span></p>
      <p className="italic mt-2">L'état de congé est arrêté au nombre de : {e.totalEnLettres} ({Number(e.total).toLocaleString('fr-FR')} jours.)</p>
    </div>
  );
}
