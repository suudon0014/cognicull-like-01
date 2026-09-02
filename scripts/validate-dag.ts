import fs from 'fs';
import path from 'path';
import { CurriculumData, KnowledgeNode } from '../src/types/curriculum';

export function validateCurriculum(data: CurriculumData): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const nodes = data.nodes;
  const nodeMap = new Map<string, KnowledgeNode>();

  if (!nodes || !Array.isArray(nodes) || nodes.length < 25) {
    errors.push(`Node count should be at least 25. Found: ${nodes?.length || 0}`);
  }

  // Check unique IDs
  for (const node of nodes) {
    if (!node.id) {
      errors.push(`Node missing id: ${JSON.stringify(node)}`);
      continue;
    }
    if (nodeMap.has(node.id)) {
      errors.push(`Duplicate node id found: ${node.id}`);
    }
    nodeMap.set(node.id, node);
  }

  // Check prerequisites existence
  for (const node of nodes) {
    for (const prereqId of node.prerequisites) {
      if (!nodeMap.has(prereqId)) {
        errors.push(`Node '${node.id}' references missing prerequisite '${prereqId}'`);
      }
    }
  }

  // Cycle detection via DFS
  const visited = new Set<string>();
  const visiting = new Set<string>();

  function dfs(nodeId: string, pathStack: string[]) {
    if (visiting.has(nodeId)) {
      errors.push(`Cycle detected: ${[...pathStack, nodeId].join(' -> ')}`);
      return;
    }
    if (visited.has(nodeId)) {
      return;
    }

    visiting.add(nodeId);
    pathStack.push(nodeId);

    const node = nodeMap.get(nodeId);
    if (node) {
      for (const prereqId of node.prerequisites) {
        if (nodeMap.has(prereqId)) {
          dfs(prereqId, [...pathStack]);
        }
      }
    }

    visiting.delete(nodeId);
    visited.add(nodeId);
  }

  for (const node of nodes) {
    if (!visited.has(node.id)) {
      dfs(node.id, []);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// Run CLI check if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const filePath = path.resolve(process.cwd(), 'src/data/curriculum.json');
  const fileContent = fs.readFileSync(filePath, 'utf-8');
  const data: CurriculumData = JSON.parse(fileContent);

  console.log(`Validating curriculum data: ${data.domain} (v${data.version})`);
  console.log(`Total nodes count: ${data.nodes.length}`);

  const result = validateCurriculum(data);

  if (result.valid) {
    console.log('✅ Curriculum DAG validation passed! No cycles found.');
    process.exit(0);
  } else {
    console.error('❌ Curriculum DAG validation failed with errors:');
    result.errors.forEach((err) => console.error(` - ${err}`));
    process.exit(1);
  }
}
