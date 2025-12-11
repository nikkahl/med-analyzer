import IndicatorService from './indicator.service.js';
import logger from '../logger.js';

class ParserService {
  constructor() {
    this.dictionary = [];
    this.loadDictionary();
  }

  async loadDictionary() {
    try {
      this.dictionary = await IndicatorService.getAll();
      logger.info(`📚 Словник завантажено: ${this.dictionary.length} показників.`);
    } catch (error) {
      logger.error('❌ Помилка завантаження словника', error);
    }
  }

  // Головна функція
  parse(rawText) {
    if (!this.dictionary.length || !rawText) return [];

    // 1. АНОНІМІЗАЦІЯ (Ховаємо ім'я та дати для конфіденційності)
    const cleanText = this.anonymizeText(rawText);
    
    const foundIndicators = [];
    // 2. Розбиваємо весь текст на окремі рядки
    const lines = cleanText.split(/\r?\n/).filter(line => line.trim().length > 0);

    for (const indicator of this.dictionary) {
      const searchTerms = [indicator.name, ...indicator.aliases]
        .map(t => t.toLowerCase().trim())
        .filter(t => t.length > 0);

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].toLowerCase();

        // Шукаємо, чи є назва показника в цьому рядку
        const matchTerm = searchTerms.find(term => line.includes(term));

        if (matchTerm) {
          // Шукаємо значення СУВОРО в цьому ж рядку (після назви)
          let value = this.extractValueFromLine(line, matchTerm);

          // Якщо в рядку назва є, а цифри немає — перевіряємо наступний рядок
          // (буває, що значення "з'їхало" вниз)
          if (value === null && lines[i + 1]) {
             value = this.extractValueFromLine(lines[i + 1], ''); 
          }

          if (value !== null) {
            // Фільтр "адекватності": відсіюємо цифри, які явно не схожі на результат
            // (наприклад, щоб не сплутати дату чи номер телефону з аналізом)
            if (this.isValidValue(value, indicator)) {
                foundIndicators.push({
                  dictionaryId: indicator._id,
                  name: indicator.name,
                  value: value,
                  units: indicator.units,
                  referenceMin: indicator.referenceMin,
                  referenceMax: indicator.referenceMax,
                });
                // Якщо знайшли показник — переходимо до пошуку наступного (щоб не дублювати)
                break; 
            }
          }
        }
      }
    }
    return foundIndicators;
  }

  // Функція для приховування особистих даних
  anonymizeText(text) {
    let anon = text;
    // Замінюємо ПІБ на [КОНФІДЕНЦІЙНО]
    anon = anon.replace(/(ПІБ|Пацієнт|Patient|Name)[:\s]+([А-ЯІЇЄA-Z][a-zа-яіїє]+)/gi, '$1: [КОНФІДЕНЦІЙНО]');
    // Ховаємо дати (щоб парсер не плутав їх з показниками)
    anon = anon.replace(/\d{1,2}[./-]\d{1,2}[./-]\d{2,4}/g, '[ДАТА]');
    return anon;
  }

  extractValueFromLine(line, term) {
    try {
      // 1. ВАЖЛИВО: Беремо тільки ту частину рядка, що йде ПІСЛЯ назви показника.
      // Це виправляє помилку, коли парсер хапав сміття "228" перед словом "Гематокрит".
      let cleanLine = line;
      if (term) {
        const parts = line.split(term);
        if (parts.length > 1) {
            cleanLine = parts[1]; // Беремо праву частину
        }
      }

      cleanLine = cleanLine.replace(/\d+(\.\d+)?\s*[-–—]\s*\d+(\.\d+)?/g, ''); 

      cleanLine = cleanLine.replace(/(\d)[oOоО](\d)/g, '$10$2'); // 5O5 -> 505
      cleanLine = cleanLine.replace(/,/g, '.'); // коми на крапки

      const numberMatch = cleanLine.match(/(\d+(\.\d+)?)/);

      if (numberMatch) {
        return parseFloat(numberMatch[0]);
      }
      return null;
    } catch (e) {
      return null;
    }
  }

  isValidValue(val, indicator) {
    if (!indicator.referenceMin) return true;
    
    const min = indicator.referenceMin / 20;
    const max = indicator.referenceMax * 20;
    
    return val > min && val < max;
  }
}

export default new ParserService();