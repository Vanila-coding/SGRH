export default function SettingsToggle({ checked, onChange, label, description, disabled }) {
  return (
    <div className="flex items-center justify-between gap-4 py-4">
      <div className="min-w-0">
        <p className="text-sm font-medium text-slate-800 dark:text-gray-100">{label}</p>
        {description && <p className="text-xs text-slate-500 dark:text-gray-400 mt-0.5">{description}</p>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-navy focus:ring-offset-2 dark:focus:ring-offset-gray-800 disabled:opacity-40 disabled:cursor-not-allowed ${
          checked ? 'bg-navy dark:bg-gold' : 'bg-slate-300 dark:bg-gray-600'
        }`}
      >
        <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'}`} />
      </button>
    </div>
  );
}