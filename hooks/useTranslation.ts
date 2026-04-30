import { useLanguageStore } from '../store/languageStore';
import { t, TranslationKey } from '../constants/i18n';

export function useTranslation() {
  const { language } = useLanguageStore();
  return (key: TranslationKey) => t(key, language);
}
