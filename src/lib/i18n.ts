import ja from '../lang/ja.json';
import en from '../lang/en.json';

export type SupportedLang = 'ja' | 'en';

type Translations = { [K in SupportedLang]: Translation };
type Translation = { [K: string]: TranslationEntry };
type TranslationEntry = {
  text: string;
};

const parseTranslation = (file: any): Translation => {
  const { translations } = file;
  if (typeof translations !== 'object' || translations === null || !Array.isArray(translations)) {
    return {};
  }

  const result: Translation = {};
  for (const entry of translations) {
    const { key, text } = entry;

    if (typeof key !== 'string' || key.length === 0) {
      continue;
    }

    if (typeof text !== 'string' || text.length === 0) {
      continue;
    }

    result[key] = { text };
  }

  return result;
};

const loaded: Translations = {
  'ja': parseTranslation(ja),
  'en': parseTranslation(en)
};

export const translate = (lang: SupportedLang, key: string): string | undefined =>  {
  const entry = loaded[lang][key];
  return entry?.text || key;
};
