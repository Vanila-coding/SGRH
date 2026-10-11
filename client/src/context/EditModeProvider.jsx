import { useState } from 'react';
import { EditModeContext } from './EditModeContext';

// État global minimal (pas de persistance localStorage : une rafraîchissement de page
// suffit à sortir du mode édition, pour ne jamais rester bloqué dedans par erreur).
// Activé depuis Superadmin → Personnalisation (« Modifier la page d'accueil »), consommé
// par les pages publiques (Accueil, À propos, Contact, FAQ, Mentions légales) via
// EditableText, qui n'affiche le crayon que si ce drapeau est actif ET que la personne
// connectée est bien SUPERADMIN (vérifié localement dans EditableText, pas ici).
export function EditModeProvider({ children }) {
  const [editMode, setEditMode] = useState(false);

  return (
    <EditModeContext.Provider value={{ editMode, setEditMode }}>
      {children}
    </EditModeContext.Provider>
  );
}
