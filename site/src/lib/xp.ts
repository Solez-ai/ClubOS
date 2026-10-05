export function calculateLevel(xp: number = 0): {
  level: number;
  romanLevel: string;
  title: string;
  currentLevelXp: number;
  nextLevelXp: number;
  progressPercent: number;
} {
  const safeXp = Math.max(0, xp);
  const level = Math.floor(Math.sqrt(safeXp / 50)) + 1;
  
  // XP required for level L = 50 * (L - 1)^2
  const currentLevelXp = 50 * Math.pow(level - 1, 2);
  const nextLevelXp = 50 * Math.pow(level, 2);
  
  const xpInCurrentLevel = safeXp - currentLevelXp;
  const xpNeededForNext = nextLevelXp - currentLevelXp;
  const progressPercent = Math.min(100, Math.max(0, (xpInCurrentLevel / xpNeededForNext) * 100));

  let title = 'Newcomer';
  if (level >= 10) title = 'Legend';
  else if (level >= 7) title = 'Veteran';
  else if (level >= 5) title = 'Regular';
  else if (level >= 3) title = 'Explorer';

  return {
    level,
    romanLevel: toRoman(level),
    title,
    currentLevelXp,
    nextLevelXp,
    progressPercent,
  };
}

export function toRoman(num: number): string {
  const romanMap: [number, string][] = [
    [10, 'X'],
    [9, 'IX'],
    [5, 'V'],
    [4, 'IV'],
    [1, 'I'],
  ];
  let result = '';
  let n = num;
  for (const [val, char] of romanMap) {
    while (n >= val) {
      result += char;
      n -= val;
    }
  }
  return result || 'I';
}
