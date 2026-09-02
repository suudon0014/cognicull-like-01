import { describe, it, expect } from 'vitest';
import { validateCurriculum } from '../../scripts/validate-dag';
import curriculumData from '../data/curriculum.json';
import { CurriculumData } from '../types/curriculum';

describe('Curriculum DAG Validation', () => {
  it('should pass validation for the official curriculum.json', () => {
    const result = validateCurriculum(curriculumData as CurriculumData);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
    expect(curriculumData.nodes.length).toBeGreaterThanOrEqual(25);
  });

  it('should detect cyclic dependencies in graph', () => {
    const mockData: CurriculumData = {
      domain: 'Test',
      version: '1.0.0',
      nodes: [
        {
          id: 'a',
          title: 'A',
          summary: 'A',
          content: 'A',
          prerequisites: ['b'],
          category: 'Cat',
          level: 1,
        },
        {
          id: 'b',
          title: 'B',
          summary: 'B',
          content: 'B',
          prerequisites: ['a'],
          category: 'Cat',
          level: 2,
        },
      ],
    };

    const result = validateCurriculum(mockData);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('Cycle detected'))).toBe(true);
  });
});
