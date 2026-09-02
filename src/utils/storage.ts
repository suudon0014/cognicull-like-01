export interface UserProgressData {
  version: string;
  masteredIds: string[];
  targetId: string | null;
  quizAnswers: Record<string, number>; // nodeId -> selectedOptionIndex
  lastUpdated: string;
}

const STORAGE_KEY = 'cognicull_relativity_progress_v1';

export function loadUserProgress(defaultTargetId: string | null = null): UserProgressData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return {
        version: '1.0.0',
        masteredIds: [],
        targetId: defaultTargetId,
        quizAnswers: {},
        lastUpdated: new Date().toISOString(),
      };
    }
    const data = JSON.parse(raw) as Partial<UserProgressData>;
    return {
      version: data.version || '1.0.0',
      masteredIds: Array.isArray(data.masteredIds) ? data.masteredIds : [],
      targetId: data.targetId !== undefined ? data.targetId : defaultTargetId,
      quizAnswers: data.quizAnswers && typeof data.quizAnswers === 'object' ? data.quizAnswers : {},
      lastUpdated: data.lastUpdated || new Date().toISOString(),
    };
  } catch (err) {
    console.error('Failed to load user progress from localStorage:', err);
    return {
      version: '1.0.0',
      masteredIds: [],
      targetId: defaultTargetId,
      quizAnswers: {},
      lastUpdated: new Date().toISOString(),
    };
  }
}

export function saveUserProgress(progress: UserProgressData): void {
  try {
    const updated = {
      ...progress,
      lastUpdated: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to save user progress to localStorage:', err);
  }
}

export function resetUserProgress(defaultTargetId: string | null = null): UserProgressData {
  const freshProgress: UserProgressData = {
    version: '1.0.0',
    masteredIds: [],
    targetId: defaultTargetId,
    quizAnswers: {},
    lastUpdated: new Date().toISOString(),
  };
  try {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(freshProgress));
  } catch (err) {
    console.error('Failed to reset user progress:', err);
  }
  return freshProgress;
}

export function exportProgressToJson(progress: UserProgressData): void {
  const jsonString = JSON.stringify(progress, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `cognicull-relativity-progress-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function validateAndParseImportJson(jsonText: string): UserProgressData | null {
  try {
    const parsed = JSON.parse(jsonText);
    if (!parsed || typeof parsed !== 'object') return null;
    if (!Array.isArray(parsed.masteredIds)) return null;

    return {
      version: parsed.version || '1.0.0',
      masteredIds: parsed.masteredIds.filter((id: unknown) => typeof id === 'string'),
      targetId: typeof parsed.targetId === 'string' ? parsed.targetId : null,
      quizAnswers: parsed.quizAnswers && typeof parsed.quizAnswers === 'object' ? parsed.quizAnswers : {},
      lastUpdated: new Date().toISOString(),
    };
  } catch (err) {
    console.error('Invalid JSON progress import:', err);
    return null;
  }
}
