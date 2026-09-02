import { KnowledgeNode, NodeStatus } from '../types/curriculum';

export interface CalculatedGraphState {
  masteredIds: Set<string>;
  effectiveMasteredIds: Set<string>;
  targetAncestors: Set<string>;
  targetSubGraphIds: Set<string>;
  nodeStatuses: Map<string, NodeStatus>;
  remainingLoadPercentage: number;
  unmasteredCountInPath: number;
  totalNodesInPath: number;
}

/**
 * Given all nodes, user explicitly mastered node IDs, and current target node ID,
 * calculates effective node statuses, target path, and pruning states.
 */
export function calculateGraphState(
  nodes: KnowledgeNode[],
  userMasteredIds: string[] | Set<string>,
  targetId: string | null
): CalculatedGraphState {
  const nodeMap = new Map<string, KnowledgeNode>(nodes.map((n) => [n.id, n]));
  const userMasteredSet = new Set(userMasteredIds);

  // 1. Calculate effective mastered IDs (Explicitly mastered + all upstream ancestors)
  const effectiveMasteredIds = new Set<string>();

  function addMasteredWithAncestors(id: string) {
    if (effectiveMasteredIds.has(id)) return;
    effectiveMasteredIds.add(id);

    const node = nodeMap.get(id);
    if (node) {
      for (const prereqId of node.prerequisites) {
        addMasteredWithAncestors(prereqId);
      }
    }
  }

  for (const id of userMasteredSet) {
    if (nodeMap.has(id)) {
      addMasteredWithAncestors(id);
    }
  }

  // 2. Identify Target SubGraph (Target node + all its recursive prerequisites)
  const targetSubGraphIds = new Set<string>();
  const targetAncestors = new Set<string>();

  if (targetId && nodeMap.has(targetId)) {
    targetSubGraphIds.add(targetId);

    function collectAncestors(id: string) {
      const node = nodeMap.get(id);
      if (node) {
        for (const prereqId of node.prerequisites) {
          targetAncestors.add(prereqId);
          targetSubGraphIds.add(prereqId);
          collectAncestors(prereqId);
        }
      }
    }

    collectAncestors(targetId);
  } else {
    // If no target selected, entire graph is active
    nodes.forEach((n) => targetSubGraphIds.add(n.id));
  }

  // 3. Find prerequisites needed by any unmastered node
  const neededByUnmastered = new Set<string>();
  for (const node of nodes) {
    if (!effectiveMasteredIds.has(node.id)) {
      // Node itself is unmastered, so its prerequisites are needed
      for (const prereqId of node.prerequisites) {
        neededByUnmastered.add(prereqId);
      }
    }
  }

  // 4. Calculate individual node status
  const nodeStatuses = new Map<string, NodeStatus>();

  for (const node of nodes) {
    if (node.id === targetId) {
      if (effectiveMasteredIds.has(node.id)) {
        nodeStatuses.set(node.id, 'mastered');
      } else {
        nodeStatuses.set(node.id, 'target');
      }
      continue;
    }

    if (effectiveMasteredIds.has(node.id)) {
      // Check if this node is pruned:
      // It is mastered, and no unmastered node depends on it anymore
      if (!neededByUnmastered.has(node.id)) {
        nodeStatuses.set(node.id, 'pruned');
      } else {
        nodeStatuses.set(node.id, 'mastered');
      }
    } else {
      // Unmastered node: check if all prerequisites are satisfied
      const allPrereqsMastered = node.prerequisites.every((pId) => effectiveMasteredIds.has(pId));
      if (allPrereqsMastered) {
        nodeStatuses.set(node.id, 'ready');
      } else {
        nodeStatuses.set(node.id, 'locked');
      }
    }
  }

  // 5. Calculate Remaining Learning Load Percentage for current target path
  let unmasteredCountInPath = 0;
  const totalNodesInPath = targetSubGraphIds.size;

  if (totalNodesInPath > 0) {
    for (const id of targetSubGraphIds) {
      if (!effectiveMasteredIds.has(id)) {
        unmasteredCountInPath++;
      }
    }
  }

  const remainingLoadPercentage = totalNodesInPath > 0
    ? Math.round((unmasteredCountInPath / totalNodesInPath) * 100)
    : 0;

  return {
    masteredIds: userMasteredSet,
    effectiveMasteredIds,
    targetAncestors,
    targetSubGraphIds,
    nodeStatuses,
    remainingLoadPercentage,
    unmasteredCountInPath,
    totalNodesInPath,
  };
}
