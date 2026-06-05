import { LOCALE_OPTIONS } from '../i18n/locales';
import { useI18n } from '../context/LocaleContext';

export default function LanguageSwitcher() {
  const { locale, setLocale, t } = useI18n();

  return (
    <div className="lang-switcher">
      <label className="lang-switcher__label label-caps" htmlFor="lang-select">
        {t.lang.label}
      </label>
      <select
        id="lang-select"
        className="lang-switcher__select"
        value={locale}
        aria-label={t.lang.choose}
        onChange={(e) => setLocale(e.target.value as typeof locale)}
      >
        {LOCALE_OPTIONS.map((opt) => (
          <option key={opt.code} value={opt.code}>
            {opt.nativeName}
          </option>
        ))}
      </select>
    </div>
  );
}
