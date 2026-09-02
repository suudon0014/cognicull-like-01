import { describe, it, expect, beforeEach } from 'vitest';
import { loadUserProgress, saveUserProgress, resetUserProgress, validateAndParseImportJson, UserProgressData } from './storage';

describe('LocalStorage & Import/Export Utilities', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('loads default progress when localStorage is empty', () => {
    const progress = loadUserProgress('schwarzschild-metric');
    expect(progress.masteredIds).toEqual([]);
    expect(progress.targetId).toBe('schwarzschild-metric');
  });

  it('saves and reloads progress', () => {
    const data: UserProgressData = {
      version: '1.0.0',
      masteredIds: ['galilean-relativity', 'maxwell-equations'],
      targetId: 'lorentz-factor',
      quizAnswers: { 'galilean-relativity': 2 },
      lastUpdated: new Date().toISOString(),
    };

    saveUserProgress(data);
    const loaded = loadUserProgress();
    expect(loaded.masteredIds).toEqual(['galilean-relativity', 'maxwell-equations']);
    expect(loaded.targetId).toBe('lorentz-factor');
    expect(loaded.quizAnswers).toEqual({ 'galilean-relativity': 2 });
  });

  it('resets progress successfully', () => {
    saveUserProgress({
      version: '1.0.0',
      masteredIds: ['galilean-relativity'],
      targetId: 'lorentz-factor',
      quizAnswers: {},
      lastUpdated: new Date().toISOString(),
    });

    const reset = resetUserProgress('default-node');
    expect(reset.masteredIds).toEqual([]);
    expect(reset.targetId).toBe('default-node');
    expect(loadUserProgress().masteredIds).toEqual([]);
  });

  it('validates import JSON correctly', () => {
    const validJson = JSON.stringify({
      version: '1.0.0',
      masteredIds: ['node-1', 'node-2'],
      targetId: 'node-3',
      quizAnswers: { 'node-1': 0 },
    });

    const parsed = validateAndParseImportJson(validJson);
    expect(parsed).not.toBeNull();
    expect(parsed?.masteredIds).toEqual(['node-1', 'node-2']);
    expect(parsed?.targetId).toBe('node-3');

    const invalidJson = '{"masteredIds": "invalid"}';
    expect(validateAndParseImportJson(invalidJson)).toBeNull();
  });
});
