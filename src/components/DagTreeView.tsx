import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import { KnowledgeNode, NodeStatus } from '../types/curriculum';
import { CheckCircle2, Target, Eye, EyeOff, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';

interface DagTreeViewProps {
  nodes: KnowledgeNode[];
  nodeStatuses: Map<string, NodeStatus>;
  targetId: string | null;
  selectedNodeId: string | null;
  targetSubGraphIds: Set<string>;
  onSelectNode: (nodeId: string) => void;
  onToggleMastered: (nodeId: string) => void;
  onSetTarget: (nodeId: string) => void;
}

interface GraphNode extends d3.SimulationNodeDatum {
  id: string;
  title: string;
  level: number;
  category: string;
  status: NodeStatus;
  isInTargetPath: boolean;
  x?: number;
  y?: number;
}

interface GraphLink extends d3.SimulationLinkDatum<GraphNode> {
  source: string | GraphNode;
  target: string | GraphNode;
  isInTargetPath: boolean;
}

export const DagTreeView: React.FC<DagTreeViewProps> = ({
  nodes,
  nodeStatuses,
  targetId,
  selectedNodeId,
  targetSubGraphIds,
  onSelectNode,
  onToggleMastered,
  onSetTarget,
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [showOnlyTargetSubGraph, setShowOnlyTargetSubGraph] = useState<boolean>(false);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);

  // Filter nodes based on target sub-graph view toggle
  const visibleNodes = useMemo(() => {
    if (!showOnlyTargetSubGraph || !targetId) return nodes;
    return nodes.filter((n) => targetSubGraphIds.has(n.id));
  }, [nodes, targetSubGraphIds, showOnlyTargetSubGraph, targetId]);

  const visibleNodeIds = useMemo(() => new Set(visibleNodes.map((n) => n.id)), [visibleNodes]);

  // Compute edges
  const links = useMemo(() => {
    const list: GraphLink[] = [];
    for (const node of visibleNodes) {
      for (const prereqId of node.prerequisites) {
        if (visibleNodeIds.has(prereqId)) {
          const isInTargetPath =
            targetSubGraphIds.has(node.id) && targetSubGraphIds.has(prereqId);
          list.push({
            source: prereqId,
            target: node.id,
            isInTargetPath,
          });
        }
      }
    }
    return list;
  }, [visibleNodes, visibleNodeIds, targetSubGraphIds]);

  // Hierarchical layout computation using D3 simulation + Level-based Y positioning
  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;

    const width = containerRef.current.clientWidth || 900;
    const height = Math.max(650, (d3.max(visibleNodes, (d) => d.level) || 1) * 110 + 100);

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    // Create marker defs for arrows
    const defs = svg.append('defs');

    const markerColors = [
      { id: 'arrow-default', color: '#64748b' },
      { id: 'arrow-target', color: '#38bdf8' },
      { id: 'arrow-pruned', color: '#334155' },
    ];

    markerColors.forEach(({ id, color }) => {
      defs
        .append('marker')
        .attr('id', id)
        .attr('viewBox', '0 -5 10 10')
        .attr('refX', 28)
        .attr('refY', 0)
        .attr('markerWidth', 6)
        .attr('markerHeight', 6)
        .attr('orient', 'auto')
        .append('path')
        .attr('d', 'M0,-5L10,0L0,5')
        .attr('fill', color);
    });

    const g = svg.append('g').attr('class', 'main-group');

    // Setup Zoom & Pan behavior
    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.3, 2.5])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });

    svg.call(zoom);

    // Initial positioning by Level (Y) and spread horizontally (X)
    const levelGroups = d3.group(visibleNodes, (d) => d.level);
    const maxLevel = d3.max(visibleNodes, (d) => d.level) || 1;

    const graphNodes: GraphNode[] = visibleNodes.map((n) => {
      const levelNodes = levelGroups.get(n.level) || [];
      const idx = levelNodes.findIndex((x) => x.id === n.id);
      const totalInLevel = levelNodes.length;

      const xSpacing = Math.min(220, (width - 160) / Math.max(1, totalInLevel));
      const startX = width / 2 - ((totalInLevel - 1) * xSpacing) / 2;
      const initialX = totalInLevel === 1 ? width / 2 : startX + idx * xSpacing;

      const levelGap = (height - 180) / Math.max(1, maxLevel - 1);
      const initialY = 90 + (n.level - 1) * levelGap;

      return {
        id: n.id,
        title: n.title,
        level: n.level,
        category: n.category,
        status: nodeStatuses.get(n.id) || 'locked',
        isInTargetPath: targetSubGraphIds.has(n.id),
        x: initialX,
        y: initialY,
        fx: initialX,
      };
    });

    const graphLinks: GraphLink[] = links.map((l) => ({ ...l }));

    const simulation = d3
      .forceSimulation<GraphNode>(graphNodes)
      .force(
        'link',
        d3
          .forceLink<GraphNode, GraphLink>(graphLinks)
          .id((d) => d.id)
          .distance(120)
      )
      .force('charge', d3.forceManyBody().strength(-300))
      .force('collide', d3.forceCollide(50))
      .force('y', d3.forceY<GraphNode>((d) => 90 + (d.level - 1) * ((height - 180) / Math.max(1, maxLevel - 1))).strength(0.8));

    // Draw Links
    const linkGroup = g.append('g').attr('class', 'links');
    const linkSelection = linkGroup
      .selectAll<SVGLineElement, GraphLink>('line')
      .data(graphLinks)
      .enter()
      .append('line')
      .attr('stroke', (d) => (d.isInTargetPath ? '#38bdf8' : '#475569'))
      .attr('stroke-opacity', (d) => (d.isInTargetPath ? 0.85 : 0.35))
      .attr('stroke-width', (d) => (d.isInTargetPath ? 2.5 : 1.5))
      .attr('stroke-dasharray', (d) => (d.isInTargetPath ? 'none' : '4,4'))
      .attr('marker-end', (d) => (d.isInTargetPath ? 'url(#arrow-target)' : 'url(#arrow-default)'));

    // Draw Node Groups
    const nodeGroup = g.append('g').attr('class', 'nodes');
    const nodeSelection = nodeGroup
      .selectAll<SVGGElement, GraphNode>('g')
      .data(graphNodes)
      .enter()
      .append('g')
      .attr('class', 'node-item cursor-pointer')
      .on('click', (_, d) => {
        onSelectNode(d.id);
      })
      .on('mouseenter', (_, d) => {
        setHoveredNodeId(d.id);
      })
      .on('mouseleave', () => {
        setHoveredNodeId(null);
      });

    // Outer Circle Glow/Border
    nodeSelection
      .append('circle')
      .attr('r', (d) => (d.id === targetId ? 28 : 22))
      .attr('fill', (d) => {
        if (d.id === targetId) return '#0284c7';
        if (d.status === 'ready') return '#0d9488';
        if (d.status === 'mastered') return '#059669';
        if (d.status === 'pruned') return '#1e293b';
        return '#334155';
      })
      .attr('fill-opacity', (d) => (d.status === 'pruned' ? 0.35 : 0.9))
      .attr('stroke', (d) => {
        if (d.id === selectedNodeId) return '#f59e0b';
        if (d.id === targetId) return '#38bdf8';
        if (d.status === 'ready') return '#2dd4bf';
        if (d.status === 'mastered') return '#34d399';
        if (d.status === 'pruned') return '#475569';
        return '#64748b';
      })
      .attr('stroke-width', (d) => (d.id === selectedNodeId || d.id === targetId ? 3.5 : 2))
      .attr('class', (d) => {
        if (d.status === 'ready') return 'animate-pulse';
        return '';
      });

    // Node Icons/Labels
    nodeSelection
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '0.35em')
      .attr('fill', (d) => (d.status === 'pruned' ? '#64748b' : '#ffffff'))
      .attr('font-size', '12px')
      .attr('font-weight', 'bold')
      .attr('pointer-events', 'none')
      .text((d) => {
        if (d.id === targetId) return '🎯';
        if (d.status === 'mastered') return '✓';
        if (d.status === 'pruned') return '✂';
        if (d.status === 'ready') return '★';
        return '🔒';
      });

    // Title label
    nodeSelection
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('y', (d) => (d.id === targetId ? 42 : 36))
      .attr('fill', (d) => {
        if (d.id === selectedNodeId) return '#fbbf24';
        if (d.id === targetId) return '#7dd3fc';
        if (d.status === 'pruned') return '#64748b';
        return '#e2e8f0';
      })
      .attr('font-size', '12px')
      .attr('font-weight', (d) => (d.id === selectedNodeId || d.id === targetId ? 'bold' : 'normal'))
      .attr('pointer-events', 'none')
      .text((d) => (d.title.length > 14 ? d.title.slice(0, 13) + '…' : d.title));

    simulation.on('tick', () => {
      linkSelection
        .attr('x1', (d) => (d.source as GraphNode).x || 0)
        .attr('y1', (d) => (d.source as GraphNode).y || 0)
        .attr('x2', (d) => (d.target as GraphNode).x || 0)
        .attr('y2', (d) => (d.target as GraphNode).y || 0);

      nodeSelection.attr('transform', (d) => `translate(${d.x || 0}, ${d.y || 0})`);
    });

    return () => {
      simulation.stop();
    };
  }, [visibleNodes, links, nodeStatuses, targetId, selectedNodeId, targetSubGraphIds, onSelectNode]);

  const handleZoom = (factor: number) => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);
    svg.transition().duration(300).call(d3.zoom<SVGSVGElement, unknown>().scaleBy as any, factor);
  };

  const handleResetZoom = () => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);
    svg.transition().duration(300).call(d3.zoom<SVGSVGElement, unknown>().transform as any, d3.zoomIdentity);
  };

  const hoveredNode = useMemo(() => nodes.find((n) => n.id === hoveredNodeId), [nodes, hoveredNodeId]);

  return (
    <div className="relative w-full h-[700px] bg-slate-950 rounded-xl border border-slate-800 overflow-hidden flex flex-col shadow-2xl">
      <div className="absolute top-4 left-4 z-10 flex flex-wrap items-center gap-2 bg-slate-900/90 backdrop-blur-md p-2 rounded-lg border border-slate-800 text-xs shadow-lg">
        <button
          onClick={() => setShowOnlyTargetSubGraph(!showOnlyTargetSubGraph)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition font-medium ${
            showOnlyTargetSubGraph
              ? 'bg-sky-600 text-white shadow-sm'
              : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
          }`}
        >
          {showOnlyTargetSubGraph ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
          {showOnlyTargetSubGraph ? 'ターゲット依存樹のみ' : '全タクソノミー表示'}
        </button>

        <div className="h-4 w-px bg-slate-800 mx-1" />

        <div className="flex items-center gap-1">
          <button
            onClick={() => handleZoom(1.2)}
            className="p-1.5 bg-slate-800 text-slate-300 hover:bg-slate-700 rounded-md"
            title="拡大"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleZoom(0.8)}
            className="p-1.5 bg-slate-800 text-slate-300 hover:bg-slate-700 rounded-md"
            title="縮小"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={handleResetZoom}
            className="p-1.5 bg-slate-800 text-slate-300 hover:bg-slate-700 rounded-md"
            title="リセット"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="absolute bottom-4 left-4 z-10 bg-slate-900/90 backdrop-blur-md p-3 rounded-lg border border-slate-800 text-xs flex flex-wrap items-center gap-4 text-slate-300 shadow-lg">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-sky-600 border border-sky-400" />
          <span className="font-semibold text-sky-400">ターゲット (Target)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-teal-600 border border-teal-400 animate-pulse" />
          <span className="font-semibold text-teal-300">学習可能 (Ready)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-emerald-600 border border-emerald-400" />
          <span>習得済み (Mastered)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-slate-800 border border-slate-600 opacity-50" />
          <span className="text-slate-400">プルーニング (Pruned)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-slate-700 border border-slate-500" />
          <span className="text-slate-400">前提未完了 (Locked)</span>
        </div>
      </div>

      {hoveredNode && (
        <div className="absolute top-4 right-4 z-10 max-w-sm bg-slate-900/95 backdrop-blur-md p-4 rounded-xl border border-slate-700 text-xs shadow-2xl space-y-2 transition-all duration-200">
          <div className="flex items-center justify-between gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold tracking-wide uppercase bg-slate-800 text-sky-400 border border-slate-700">
              L{hoveredNode.level} • {hoveredNode.category}
            </span>
            <span className="text-slate-400 font-mono">ID: {hoveredNode.id}</span>
          </div>
          <h4 className="font-bold text-sm text-slate-100">{hoveredNode.title}</h4>
          <p className="text-slate-300 leading-relaxed">{hoveredNode.summary}</p>

          <div className="pt-2 flex items-center justify-between border-t border-slate-800">
            <button
              onClick={() => onToggleMastered(hoveredNode.id)}
              className="flex items-center gap-1 px-2.5 py-1 bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-700 rounded text-[11px] font-semibold transition"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              習得トグル
            </button>
            <button
              onClick={() => onSetTarget(hoveredNode.id)}
              className="flex items-center gap-1 px-2.5 py-1 bg-sky-950 hover:bg-sky-900 text-sky-300 border border-sky-700 rounded text-[11px] font-semibold transition"
            >
              <Target className="w-3.5 h-3.5" />
              ターゲット設定
            </button>
          </div>
        </div>
      )}

      <div ref={containerRef} className="w-full h-full flex-1 cursor-grab active:cursor-grabbing">
        <svg ref={svgRef} className="w-full h-full" />
      </div>
    </div>
  );
};
