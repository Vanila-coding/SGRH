import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { traduire } from '../../i18n';

export default function ThemeToggle() {
  const { isDark, toggleTheme } = useTheme();
  return (
    <button
      onClick={toggleTheme}
      aria-label={isDark ? 'Passer en mode clair' : traduire('Passer en mode sombre')}
      title={isDark ? 'Passer en mode clair' : traduire('Passer en mode sombre')}
      className="shrink-0 rounded-md p-1.5 text-gray-500 hover:bg-slate-100 dark:text-gray-300 dark:hover:bg-gray-700 transition"
    >
      {isDark ? <Sun size={20} /> : <Moon size={20} />}
    </button>
  );
}