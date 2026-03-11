/**
 * Нормализация единиц измерения из смет ГрандСмета
 *
 * Особенность: в сметах встречаются составные единицы вида "100 м2", "1000 м3" и т.д.
 * Нормализатор разбирает их на базовую единицу и множитель.
 */

export interface NormalizedUnit {
  unit: string;       // Базовая единица: "м2", "м3", "шт" и т.д.
  multiplier: number; // Множитель: 100, 1000, 1 и т.д.
  original: string;   // Исходная строка
}

const UNIT_ALIASES: Record<string, string> = {
  'м2': 'м2',
  'кв.м': 'м2',
  'кв. м': 'м2',
  'м.кв.': 'м2',
  'м кв': 'м2',
  'м3': 'м3',
  'куб.м': 'м3',
  'куб. м': 'м3',
  'м.куб.': 'м3',
  'м куб': 'м3',
  'м.п.': 'м.п.',
  'м п': 'м.п.',
  'пог.м': 'м.п.',
  'пог. м': 'м.п.',
  'п.м': 'м.п.',
  'п. м': 'м.п.',
  'шт': 'шт.',
  'шт.': 'шт.',
  'штук': 'шт.',
  'компл': 'компл.',
  'компл.': 'компл.',
  'комплект': 'компл.',
  'т': 'т',
  'тонн': 'т',
  'тонна': 'т',
  'кг': 'кг',
  'л': 'л',
  'литр': 'л',
  'чел.-ч': 'чел.-ч',
  'чел-ч': 'чел.-ч',
  'чел.ч': 'чел.-ч',
  'маш.-ч': 'маш.-ч',
  'маш-ч': 'маш.-ч',
  'маш.ч': 'маш.-ч',
  'тыс. шт': 'тыс. шт.',
  'тыс.шт': 'тыс. шт.',
  'тыс. шт.': 'тыс. шт.',
  'тыс.м3': 'тыс. м3',
  'тыс. м3': 'тыс. м3',
};

/**
 * Нормализует единицу измерения из сметы
 */
export function normalizeUnit(rawUnit: string): NormalizedUnit {
  if (!rawUnit) {
    return { unit: '', multiplier: 1, original: rawUnit };
  }

  const trimmed = rawUnit.trim();

  // Пытаемся выделить числовой множитель: "100 м2" → multiplier=100, unit="м2"
  const multiplierMatch = trimmed.match(/^(\d+)\s+(.+)$/);

  let multiplier = 1;
  let unitPart = trimmed;

  if (multiplierMatch) {
    const possibleMultiplier = parseInt(multiplierMatch[1], 10);
    // Только стандартные множители: 10, 100, 1000
    if ([10, 100, 1000].includes(possibleMultiplier)) {
      multiplier = possibleMultiplier;
      unitPart = multiplierMatch[2];
    }
  }

  // Нормализуем единицу через алиасы
  const normalized = UNIT_ALIASES[unitPart.toLowerCase()] || unitPart;

  return {
    unit: normalized,
    multiplier,
    original: rawUnit,
  };
}

/**
 * Возвращает строковое представление единицы для отображения
 */
export function formatUnit(unit: NormalizedUnit): string {
  if (unit.multiplier === 1) {
    return unit.unit;
  }
  return `${unit.multiplier} ${unit.unit}`;
}
