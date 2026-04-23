import React, { useEffect, useMemo, useRef, useState } from 'react';
import cytoscape from 'cytoscape';
import { Maximize2, RefreshCw, RotateCcw, ZoomIn, ZoomOut } from 'lucide-react';
import { getGraphData, getUserDetail } from '../../api/endpoints';
import { GraphData, GraphNodeData, UserDetail } from '../../types';

interface GraphPanelProps {
  communityAlgorithm?: string;
  selectedNodeId?: string | null;
  onNodeClick?: (nodeId: string) => void;
}

type ScaleMetric = 'degree' | 'pagerank';
type EdgeMode = 'full' | 'reduced';

interface HoverState {
  x: number;
  y: number;
  node: GraphNodeData;
}

const COMMUNITY_PALETTE = [
  '#60a5fa',
  '#f97316',
  '#22c55e',
  '#e879f9',
  '#f43f5e',
  '#14b8a6',
  '#facc15',
  '#a78bfa',
  '#fb7185',
  '#2dd4bf',
  '#38bdf8',
  '#f59e0b',
];

const LAYOUT_PRIORITY = ['fcose', 'cose-bilkent', 'cose'];

const getBestLayoutName = (): string => {
  for (const name of LAYOUT_PRIORITY) {
    const extension = (cytoscape as any).extension?.('layout', name);
    if (extension) return name;
  }
  return 'cose';
};

const createLayoutOptions = (name: string, nodeCount: number): Record<string, any> => {
  if (name === 'fcose') {
    const isLarge = nodeCount > 1200;
    return {
      name: 'fcose',
      quality: 'default',
      randomize: false,
      animate: false,
      fit: true,
      padding: 50,
      nodeRepulsion: isLarge ? 6800 : 9000,
      idealEdgeLength: isLarge ? 115 : 96,
      edgeElasticity: 0.1,
      gravity: isLarge ? 0.2 : 0.32,
      numIter: 2500,
      tile: true,
      tilingPaddingVertical: 10,
      tilingPaddingHorizontal: 10,
    };
  }

  const isSmall = nodeCount <= 400;
  const isMedium = nodeCount > 400 && nodeCount <= 1200;

  return {
    name: 'cose',
    animate: false,
    fit: true,
    randomize: false,
    padding: 50,
    nodeRepulsion: isSmall ? 550000 : isMedium ? 950000 : 1300000,
    idealEdgeLength: isSmall ? 90 : isMedium ? 110 : 130,
    edgeElasticity: 0.12,
    gravity: isSmall ? 0.42 : isMedium ? 0.24 : 0.12,
    numIter: 2800,
    initialTemp: 220,
    coolingFactor: 0.985,
  };
};

const quantile = (arr: number[], q: number): number => {
  if (arr.length === 0) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const pos = (sorted.length - 1) * q;
  const base = Math.floor(pos);
  const rest = pos - base;
  if (sorted[base + 1] !== undefined) {
    return sorted[base] + rest * (sorted[base + 1] - sorted[base]);
  }
  return sorted[base];
};

const normalizeSize = (value: number, minValue: number, maxValue: number, minSize: number, maxSize: number): number => {
  if (maxValue <= minValue) return minSize;
  const clamped = Math.min(maxValue, Math.max(minValue, value));
  const ratio = (clamped - minValue) / (maxValue - minValue);
  return minSize + ratio * (maxSize - minSize);
};

const metricTransform = (value: number, metric: ScaleMetric): number => {
  if (metric === 'degree') return Math.log1p(Math.max(0, value));
  return Math.sqrt(Math.max(0, value));
};

const stableEdgeHash = (source: string, target: string): number => {
  const key = source < target ? `${source}|${target}` : `${target}|${source}`;
  let hash = 0;
  for (let i = 0; i < key.length; i += 1) {
    hash = (hash * 31 + key.charCodeAt(i)) % 1000003;
  }
  return hash % 100;
};

export const GraphPanel: React.FC<GraphPanelProps> = ({
  communityAlgorithm = 'louvain',
  selectedNodeId = null,
  onNodeClick,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<cytoscape.Core | null>(null);
  const layoutNameRef = useRef<string>('cose');
  const onNodeClickRef = useRef<typeof onNodeClick>(onNodeClick);
  const selectedCommunityRef = useRef<string>('all');
  const showOnlyNeighborhoodRef = useRef<boolean>(false);
  const selectedNodeIdRef = useRef<string | null>(null);
  const positionsCacheRef = useRef<Record<string, Record<string, cytoscape.Position>>>({});
  const resetViewRef = useRef<(() => void) | null>(null);
  const applyCommunityFilterRef = useRef<(() => void) | null>(null);
  const applySelectionByIdRef = useRef<((nodeId: string) => void) | null>(null);

  const [graphData, setGraphData] = useState<GraphData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [maxNodes, setMaxNodes] = useState<number>(2000);
  const [selectedCommunity, setSelectedCommunity] = useState<string>('all');
  const [showOnlyNeighborhood, setShowOnlyNeighborhood] = useState(false);
  const [scaleMetric, setScaleMetric] = useState<ScaleMetric>('degree');
  const [edgeMode, setEdgeMode] = useState<EdgeMode>('reduced');
  const [selectedNode, setSelectedNode] = useState<GraphNodeData | null>(null);
  const [selectedNodeDetail, setSelectedNodeDetail] = useState<UserDetail | null>(null);
  const [nodeDetailLoading, setNodeDetailLoading] = useState(false);
  const [hoverState, setHoverState] = useState<HoverState | null>(null);
  const [layoutName, setLayoutName] = useState<string>('cose');

  const graphKey = `${communityAlgorithm}:${maxNodes}:${edgeMode}`;
  const communityOptions = useMemo(() => graphData?.meta.community_ids ?? [], [graphData]);

  const displayedGraph = useMemo(() => {
    if (!graphData) return null;
    if (edgeMode === 'full') return graphData;

    const nodeCount = graphData.nodes.length;
    const links = graphData.links;
    if (links.length === 0) return graphData;

    // Keep graph naturally connected: ensure each node retains a few incident edges
    // before applying global reduction, so reduced mode still looks "alive" at every scale.
    const adjacency = new Map<string, Array<{ edgeIdx: number; hash: number }>>();
    links.forEach((edge, idx) => {
      const hash = stableEdgeHash(edge.source, edge.target);
      if (!adjacency.has(edge.source)) adjacency.set(edge.source, []);
      if (!adjacency.has(edge.target)) adjacency.set(edge.target, []);
      adjacency.get(edge.source)!.push({ edgeIdx: idx, hash });
      adjacency.get(edge.target)!.push({ edgeIdx: idx, hash });
    });

    const selectedIdx = new Set<number>();
    const minPerNode = nodeCount <= 350 ? 1 : 2;
    adjacency.forEach((incident) => {
      incident
        .sort((a, b) => a.hash - b.hash)
        .slice(0, minPerNode)
        .forEach((item) => selectedIdx.add(item.edgeIdx));
    });

    const targetBudget =
      nodeCount <= 300 ? nodeCount * 3 :
      nodeCount <= 700 ? nodeCount * 4 :
      nodeCount <= 1500 ? nodeCount * 5 :
      nodeCount * 6;

    if (selectedIdx.size < targetBudget) {
      links
        .map((edge, idx) => ({
          idx,
          hash: stableEdgeHash(edge.source, edge.target),
        }))
        .sort((a, b) => a.hash - b.hash)
        .forEach((item) => {
          if (selectedIdx.size >= targetBudget) return;
          selectedIdx.add(item.idx);
        });
    }

    const reducedLinks = links.filter((_, idx) => selectedIdx.has(idx));

    return {
      ...graphData,
      links: reducedLinks,
      edges: reducedLinks,
      meta: {
        ...graphData.meta,
        num_edges: reducedLinks.length,
      },
    };
  }, [graphData, edgeMode]);

  const graphElements = useMemo(() => {
    if (!displayedGraph) return [] as cytoscape.ElementDefinition[];
    const nodes: cytoscape.ElementDefinition[] = displayedGraph.nodes.map((node) => ({
      data: {
        ...node,
        color: COMMUNITY_PALETTE[Math.abs(node.community) % COMMUNITY_PALETTE.length],
        displayLabel: '',
      },
    }));

    const edges: cytoscape.ElementDefinition[] = displayedGraph.links.map((link, idx) => ({
      data: {
        id: `${link.source}-${link.target}-${idx}`,
        source: link.source,
        target: link.target,
      },
    }));
    return [...nodes, ...edges];
  }, [displayedGraph]);

  const loadGraph = async (nodesLimit: number) => {
    setIsLoading(true);
    try {
      const data = await getGraphData(communityAlgorithm, nodesLimit);
      setGraphData(data);
      setError(null);
    } catch (e) {
      console.error('Error loading graph:', e);
      setError(e instanceof Error ? e.message : 'Loi tai do thi');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    onNodeClickRef.current = onNodeClick;
  }, [onNodeClick]);

  useEffect(() => {
    selectedCommunityRef.current = selectedCommunity;
    applyCommunityFilterRef.current?.();
  }, [selectedCommunity]);

  useEffect(() => {
    showOnlyNeighborhoodRef.current = showOnlyNeighborhood;
    if (selectedNodeIdRef.current) {
      applySelectionByIdRef.current?.(selectedNodeIdRef.current);
    }
  }, [showOnlyNeighborhood]);

  useEffect(() => {
    loadGraph(maxNodes);
  }, [communityAlgorithm, maxNodes]);

  useEffect(() => {
    if (!containerRef.current || cyRef.current) return;

    const cy = cytoscape({
      container: containerRef.current,
      elements: [],
      wheelSensitivity: 0.18,
      minZoom: 0.05,
      maxZoom: 2.6,
      pixelRatio: 1,
      motionBlur: false,
      hideEdgesOnViewport: true,
      textureOnViewport: true,
      style: [
        {
          selector: 'node',
          style: {
            'background-color': 'data(color)',
            width: 'data(size)',
            height: 'data(size)',
            label: 'data(displayLabel)',
            color: '#e2e8f0',
            'font-size': 11,
            'text-valign': 'top',
            'text-margin-y': -10,
            'text-outline-width': 2,
            'text-outline-color': '#0f172a',
            'text-opacity': 1,
            'border-width': 1,
            'border-color': '#111827',
            'overlay-opacity': 0,
          },
        },
        {
          selector: 'edge',
          style: {
            width: 0.45,
            opacity: 0.08,
            'line-color': '#94a3b8',
            'curve-style': 'haystack',
          },
        },
        {
          selector: '.selected',
          style: {
            'border-width': 2.5,
            'border-color': '#f8fafc',
            'z-index': 30,
            opacity: 1,
          },
        },
        {
          selector: '.neighbor',
          style: {
            opacity: 0.9,
            'z-index': 20,
          },
        },
        {
          selector: '.active-edge',
          style: {
            opacity: 0.35,
            width: 1,
            'line-color': '#cbd5e1',
          },
        },
        {
          selector: '.faded',
          style: {
            opacity: 0.1,
          },
        },
        {
          selector: '.hidden-node',
          style: {
            display: 'none',
          },
        },
      ],
    });

    const clearVisualState = () => {
      cy.elements().removeClass('selected neighbor active-edge faded');
      cy.nodes().forEach((n) => {
        n.data('displayLabel', '');
      });
    };

    const applyCommunityFilter = () => {
      cy.elements().removeClass('hidden-node');
      const currentCommunity = selectedCommunityRef.current;
      if (currentCommunity === 'all') return;

      cy.nodes().forEach((node) => {
        if (String(node.data('community')) !== currentCommunity) {
          node.addClass('hidden-node');
        }
      });
      cy.edges().forEach((edge) => {
        if (edge.source().hasClass('hidden-node') || edge.target().hasClass('hidden-node')) {
          edge.addClass('hidden-node');
        }
      });
    };

    const applySelection = (node: cytoscape.NodeSingular) => {
      clearVisualState();
      applyCommunityFilter();

      node.removeClass('hidden-node');
      const neighborNodes = node.neighborhood('node');
      const neighborEdges = node.connectedEdges();
      neighborNodes.removeClass('hidden-node');
      neighborEdges.removeClass('hidden-node');

      node.addClass('selected');
      neighborNodes.addClass('neighbor');
      neighborEdges.addClass('active-edge');

      node.data('displayLabel', node.data('label'));
      if (showOnlyNeighborhoodRef.current) {
        cy.elements().difference(node.union(neighborNodes).union(neighborEdges)).addClass('hidden-node');
      } else {
        cy.elements().difference(node.union(neighborNodes).union(neighborEdges)).addClass('faded');
      }

      const payload = node.data() as GraphNodeData;
      selectedNodeIdRef.current = payload.id;
      setSelectedNode(payload);
      onNodeClickRef.current?.(payload.id);
    };

    const resetView = () => {
      selectedNodeIdRef.current = null;
      clearVisualState();
      applyCommunityFilter();
      setSelectedNode(null);
      setHoverState(null);
      cy.fit(undefined, 60);
    };

    cy.on('tap', 'node', (evt) => {
      applySelection(evt.target);
    });

    cy.on('mouseover', 'node', (evt) => {
      const node = evt.target;
      if (!node.hasClass('selected')) {
        node.data('displayLabel', node.data('label'));
      }
      const rendered = node.renderedPosition();
      setHoverState({
        x: rendered.x,
        y: rendered.y,
        node: node.data() as GraphNodeData,
      });
    });

    cy.on('mouseout', 'node', (evt) => {
      const node = evt.target;
      if (!node.hasClass('selected')) {
        node.data('displayLabel', '');
      }
      setHoverState(null);
    });

    cy.on('tap', (evt) => {
      if (evt.target === cy) resetView();
    });

    cy.on('zoom pan', () => {
      setHoverState(null);
    });

    applyCommunityFilterRef.current = applyCommunityFilter;
    applySelectionByIdRef.current = (nodeId: string) => {
      const node = cy.getElementById(String(nodeId));
      if (!node || node.empty()) return;
      applySelection(node as cytoscape.NodeSingular);
      const focusElements = node.union(node.neighborhood('node')).union(node.connectedEdges());
      cy.animate({
        fit: { eles: focusElements, padding: 90 },
        duration: 180,
      });
    };
    resetViewRef.current = resetView;

    cyRef.current = cy;

    return () => {
      cy.destroy();
      cyRef.current = null;
      resetViewRef.current = null;
      applyCommunityFilterRef.current = null;
      applySelectionByIdRef.current = null;
    };
  }, []);

  useEffect(() => {
    const cy = cyRef.current;
    if (!cy || !displayedGraph) return;

    const bestLayout = getBestLayoutName();
    layoutNameRef.current = bestLayout;
    setLayoutName(bestLayout);

    cy.batch(() => {
      cy.elements().remove();
      cy.add(graphElements);
    });

    const cachedPositions = positionsCacheRef.current[graphKey];
    if (cachedPositions) {
      cy.nodes().forEach((node) => {
        const pos = cachedPositions[node.id()];
        if (pos) node.position(pos);
      });
      cy.layout({ name: 'preset', fit: true, animate: false, padding: 60 } as any).run();
    } else {
      cy.one('layoutstop', () => {
        const positions: Record<string, cytoscape.Position> = {};
        cy.nodes().forEach((node) => {
          positions[node.id()] = { ...node.position() };
        });
        positionsCacheRef.current[graphKey] = positions;
      });
      cy.layout(createLayoutOptions(bestLayout, displayedGraph.nodes.length) as any).run();
    }

    applyCommunityFilterRef.current?.();
    selectedNodeIdRef.current = null;
    setSelectedNode(null);
    setHoverState(null);
  }, [displayedGraph, graphElements, graphKey]);

  useEffect(() => {
    const cy = cyRef.current;
    if (!cy || !graphData) return;

    const metricValues = graphData.nodes.map((n) =>
      metricTransform(scaleMetric === 'pagerank' ? n.pagerank : n.degree, scaleMetric),
    );
    const minValue = quantile(metricValues, 0.05);
    const maxValue = quantile(metricValues, 0.95);
    const minNodeSize = maxNodes <= 300 ? 3.5 : 4;
    const maxNodeSize = maxNodes <= 300 ? 13 : 18;

    const dataMap = new Map(graphData.nodes.map((node) => [node.id, node]));
    cy.batch(() => {
      cy.nodes().forEach((cyNode) => {
        const nodeData = dataMap.get(cyNode.id());
        if (!nodeData) return;
        const rawValue = scaleMetric === 'pagerank' ? nodeData.pagerank : nodeData.degree;
        const size = normalizeSize(
          metricTransform(rawValue, scaleMetric),
          minValue,
          maxValue,
          minNodeSize,
          maxNodeSize,
        );
        cyNode.data('size', size);
      });
    });
  }, [graphData, maxNodes, scaleMetric]);

  useEffect(() => {
    if (!selectedNodeId) return;
    applySelectionByIdRef.current?.(String(selectedNodeId));
  }, [selectedNodeId]);

  useEffect(() => {
    if (!selectedNode?.id) {
      setSelectedNodeDetail(null);
      return;
    }

    let active = true;
    const loadDetail = async () => {
      setNodeDetailLoading(true);
      try {
        const detail = await getUserDetail(selectedNode.id);
        if (active) setSelectedNodeDetail(detail);
      } catch {
        if (active) setSelectedNodeDetail(null);
      } finally {
        if (active) setNodeDetailLoading(false);
      }
    };
    loadDetail();
    return () => {
      active = false;
    };
  }, [selectedNode?.id]);

  const handleRelayout = () => {
    const cy = cyRef.current;
    if (!cy || !displayedGraph) return;
    const bestLayout = getBestLayoutName();
    layoutNameRef.current = bestLayout;
    setLayoutName(bestLayout);
    cy.layout(createLayoutOptions(bestLayout, displayedGraph.nodes.length) as any).run();
    cy.one('layoutstop', () => {
      const positions: Record<string, cytoscape.Position> = {};
      cy.nodes().forEach((node) => {
        positions[node.id()] = { ...node.position() };
      });
      positionsCacheRef.current[graphKey] = positions;
    });
  };

  const handleZoom = (direction: 'in' | 'out') => {
    const cy = cyRef.current;
    if (!cy) return;
    const zoom = cy.zoom();
    cy.zoom({
      level: direction === 'in' ? zoom * 1.15 : zoom / 1.15,
      renderedPosition: { x: 320, y: 240 },
    });
  };

  const handleFit = () => {
    cyRef.current?.fit(undefined, 60);
  };

  const handleResetView = () => {
    resetViewRef.current?.();
  };

  return (
    <div className="rounded-xl border border-slate-700 bg-slate-800 shadow-lg">
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-700 bg-slate-800/90 p-3">
        <button onClick={() => handleZoom('in')} className="rounded bg-slate-700 p-2 text-slate-100 hover:bg-slate-600" title="Zoom in">
          <ZoomIn size={16} />
        </button>
        <button onClick={() => handleZoom('out')} className="rounded bg-slate-700 p-2 text-slate-100 hover:bg-slate-600" title="Zoom out">
          <ZoomOut size={16} />
        </button>
        <button onClick={handleFit} className="rounded bg-slate-700 p-2 text-slate-100 hover:bg-slate-600" title="Fit graph">
          <Maximize2 size={16} />
        </button>
        <button onClick={handleRelayout} className="rounded bg-slate-700 p-2 text-slate-100 hover:bg-slate-600" title="Relayout">
          <RefreshCw size={16} />
        </button>
        <button onClick={handleResetView} className="rounded bg-slate-700 p-2 text-slate-100 hover:bg-slate-600" title="Reset view">
          <RotateCcw size={16} />
        </button>

        <select
          value={selectedCommunity}
          onChange={(e) => setSelectedCommunity(e.target.value)}
          className="rounded border border-slate-600 bg-slate-700 px-3 py-2 text-xs text-slate-100"
        >
          <option value="all">All communities</option>
          {communityOptions.map((communityId) => (
            <option key={communityId} value={String(communityId)}>
              Community {communityId}
            </option>
          ))}
        </select>

        <select
          value={scaleMetric}
          onChange={(e) => setScaleMetric(e.target.value as ScaleMetric)}
          className="rounded border border-slate-600 bg-slate-700 px-3 py-2 text-xs text-slate-100"
        >
          <option value="degree">Scale by degree</option>
          <option value="pagerank">Scale by pagerank</option>
        </select>

        <select
          value={maxNodes}
          onChange={(e) => setMaxNodes(Number(e.target.value))}
          className="rounded border border-slate-600 bg-slate-700 px-3 py-2 text-xs text-slate-100"
        >
          <option value={200}>200 nodes</option>
          <option value={500}>500 nodes</option>
          <option value={1000}>1000 nodes</option>
          <option value={2000}>2000 nodes</option>
          <option value={5000}>Full dataset</option>
        </select>

        <select
          value={edgeMode}
          onChange={(e) => setEdgeMode(e.target.value as EdgeMode)}
          className="rounded border border-slate-600 bg-slate-700 px-3 py-2 text-xs text-slate-100"
        >
          <option value="reduced">Reduced edges</option>
          <option value="full">Full edges</option>
        </select>

        <label className="flex items-center gap-1 text-xs text-slate-200">
          <input
            type="checkbox"
            checked={showOnlyNeighborhood}
            onChange={(e) => setShowOnlyNeighborhood(e.target.checked)}
          />
          Show only selected neighborhood
        </label>
      </div>

      <div className="grid grid-cols-1 gap-3 p-3 md:grid-cols-[minmax(0,1fr)_300px] xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="relative overflow-hidden rounded-lg border border-slate-700 bg-[#0b1220]" style={{ height: 640 }}>
          <div ref={containerRef} className="h-full w-full" />
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-900/70 text-slate-200">
              Dang tai do thi...
            </div>
          )}
          {error && <div className="absolute inset-0 flex items-center justify-center text-red-400">{error}</div>}
          {hoverState && (
            <div
              className="pointer-events-none absolute z-20 rounded border border-slate-600 bg-slate-900/95 px-2 py-1 text-xs text-slate-100"
              style={{ left: hoverState.x + 10, top: hoverState.y + 10 }}
            >
              <div>ID: {hoverState.node.id}</div>
              <div>Community: {hoverState.node.community}</div>
              <div>Degree: {hoverState.node.degree}</div>
              <div>PageRank: {hoverState.node.pagerank.toFixed(6)}</div>
            </div>
          )}
        </div>

        <div className="rounded-lg border border-slate-700 bg-slate-900/40 p-3 text-sm text-slate-200">
          <h4 className="mb-2 font-semibold text-slate-100">Selected Node</h4>
          {selectedNode ? (
            <div className="space-y-2">
              <div><span className="text-slate-400">ID:</span> {selectedNode.id}</div>
              <div><span className="text-slate-400">Community:</span> {selectedNode.community}</div>
              <div><span className="text-slate-400">Degree:</span> {selectedNode.degree}</div>
              <div><span className="text-slate-400">PageRank:</span> {selectedNode.pagerank.toFixed(6)}</div>
              {nodeDetailLoading && <p className="text-xs text-slate-400">Dang tai thong tin...</p>}
              {!nodeDetailLoading && selectedNodeDetail && (
                <>
                  <div><span className="text-slate-400">Name:</span> {selectedNodeDetail.name}</div>
                  <div><span className="text-slate-400">Username:</span> @{selectedNodeDetail.username}</div>
                  <div><span className="text-slate-400">Hang xom:</span> {selectedNodeDetail.neighbors.length}</div>
                </>
              )}
            </div>
          ) : (
            <div className="text-slate-400">Click a node to inspect details.</div>
          )}

          <div className="mt-4 border-t border-slate-700 pt-3 text-xs text-slate-300">
            <div>Rendered nodes: {displayedGraph?.meta.num_nodes ?? 0}</div>
            <div>Rendered edges: {displayedGraph?.meta.num_edges ?? 0}</div>
            <div>Communities: {displayedGraph?.meta.num_communities ?? 0}</div>
            <div>Layout: {layoutName}</div>
            <div>Edges mode: {edgeMode}</div>
          </div>
        </div>
      </div>
    </div>
  );
};
