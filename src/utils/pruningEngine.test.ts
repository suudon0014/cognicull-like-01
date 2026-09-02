import { describe, it, expect } from 'vitest';
import { calculateGraphState } from './pruningEngine';
import { KnowledgeNode } from '../types/curriculum';

const sampleNodes: KnowledgeNode[] = [
  {
    id: 'n1',
    title: 'Node 1',
    summary: 'Summary 1',
    content: 'Content 1',
    prerequisites: [],
    category: 'Cat1',
    level: 1,
  },
  {
    id: 'n2',
    title: 'Node 2',
    summary: 'Summary 2',
    content: 'Content 2',
    prerequisites: ['n1'],
    category: 'Cat1',
    level: 2,
  },
  {
    id: 'n3',
    title: 'Node 3',
    summary: 'Summary 3',
    content: 'Content 3',
    prerequisites: ['n2'],
    category: 'Cat1',
    level: 3,
  },
];

describe('Pruning Engine Logic', () => {
  it('initial state: root node is ready, dependent nodes are locked', () => {
    const state = calculateGraphState(sampleNodes, [], 'n3');

    expect(state.nodeStatuses.get('n1')).toBe('ready');
    expect(state.nodeStatuses.get('n2')).toBe('locked');
    expect(state.nodeStatuses.get('n3')).toBe('target');
    expect(state.unmasteredCountInPath).toBe(3);
    expect(state.remainingLoadPercentage).toBe(100);
  });

  it('marking node 2 as mastered auto-masters upstream node 1', () => {
    const state = calculateGraphState(sampleNodes, ['n2'], 'n3');

    expect(state.effectiveMasteredIds.has('n1')).toBe(true);
    expect(state.effectiveMasteredIds.has('n2')).toBe(true);
    // n3 is the target and unmastered
    expect(state.nodeStatuses.get('n3')).toBe('target');
    // n1 and n2 are mastered, but n2 is needed by unmastered n3.
    // n1 is needed by n2, but n2 is mastered. Is n1 needed by any UNMASTERED node? No.
    expect(state.nodeStatuses.get('n1')).toBe('pruned');
    expect(state.nodeStatuses.get('n2')).toBe('mastered'); // needed by unmastered n3
    expect(state.unmasteredCountInPath).toBe(1); // only n3 remaining
    expect(state.remainingLoadPercentage).toBe(33); // 1/3 ~ 33%
  });

  it('marking target n3 as mastered makes load percentage 0', () => {
    const state = calculateGraphState(sampleNodes, ['n3'], 'n3');

    expect(state.effectiveMasteredIds.has('n1')).toBe(true);
    expect(state.effectiveMasteredIds.has('n2')).toBe(true);
    expect(state.effectiveMasteredIds.has('n3')).toBe(true);
    expect(state.unmasteredCountInPath).toBe(0);
    expect(state.remainingLoadPercentage).toBe(0);
    expect(state.nodeStatuses.get('n1')).toBe('pruned');
    expect(state.nodeStatuses.get('n2')).toBe('pruned');
  });
});
