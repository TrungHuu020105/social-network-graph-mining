import React, { useEffect, useMemo, useRef, useState } from 'react';
import cytoscape from 'cytoscape';
import { Maximize2, RefreshCw, ZoomIn, ZoomOut } from 'lucide-react';
import { getGraphData } from '../../api/endpoints';
import { GraphData, GraphNodeData } from '../../types';

interface GraphPanelProps {
  communityAlgorithm?: string;
  selectedNodeId?: string | null;
  onNodeClick?: (nodeId: string) => void;
}

type ScaleMetric = 'degree' | 'pagerank';

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
    if (extension) {
      return name;
    }
  }
  return 'cose';
};

const createLayoutOptions = (name: string): Record<string, any> => {
  if (name === 'cose') {
    return {
      name: 'cose',
      animate: false,
      fit: true,
      randomize: true,
      nodeRepulsion: 800000,
      idealEdgeLength: 100,
      edgeElasticity: 0.1,
      numIter: 1800,
      gravity: 0.18,
      initialTemp: 300,
      coolingFactor: 0.97,
      padding: 30,
    };
  }
  return {
    name,
    animate: false,
    fit: true,
    padding: 30,
  };
};

const normalizeSize = (value: number, minValue: number, maxValue: number, minSize: number, maxSize: number): number => {
  if (maxValue <= minValue) return minSize;
  const ratio = (value - minValue) / (maxValue - minValue);
  return minSize + ratio * (maxSize - minSize);
};

export const GraphPanel: React.FC<GraphPanelProps> = ({
  communityAlgorithm = 'louvain',
  selectedNodeId = null,
  onNodeClick,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<cytoscape.Core | null>(null);

  const [graphData, setGraphData] = useState<GraphData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [maxNodes, setMaxNodes] = useState<number>(1000);
  const [selectedCommunity, setSelectedCommunity] = useState<string>('all');
  const [showLabels, setShowLabels] = useState(false);
  const [showOnlyNeighborhood, setShowOnlyNeighborhood] = useState(true);
  const [scaleMetric, setScaleMetric] = useState<ScaleMetric>('degree');
  const [selectedNode, setSelectedNode] = useState<GraphNodeData | null>(null);
  const [hoverState, setHoverState] = useState<HoverState | null>(null);
  const [layoutName, setLayoutName] = useState<string>('cose');

  const communityOptions = useMemo(() => graphData?.meta.community_ids ?? [], [graphData]);

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
    loadGraph(maxNodes);
  }, [communityAlgorithm, maxNodes]);

  useEffect(() => {
    if (!graphData || !containerRef.current) return;

    const cy = cyRef.current;
    if (cy) {
      cy.destroy();
      cyRef.current = null;
    }

    const currentLayout = getBestLayoutName();
    setLayoutName(currentLayout);

    const nodeMetricValues = graphData.nodes.map((n) => (scaleMetric === 'pagerank' ? n.pagerank : n.degree));
    const minValue = Math.min(...nodeMetricValues);
    const maxValue = Math.max(...nodeMetricValues);

    const nodes = graphData.nodes.map((node) => ({
      data: {
        ...node,
        size: normalizeSize(
          scaleMetric === 'pagerank' ? node.pagerank : node.degree,
          minValue,
          maxValue,
          10,
          40,
        ),
        color: COMMUNITY_PALETTE[Math.abs(node.community) % COMMUNITY_PALETTE.length],
      },
    }));

    const links = graphData.links.map((link, idx) => ({
      data: {
        id: `${link.source}-${link.target}-${idx}`,
        source: link.source,
        target: link.target,
      },
    }));

    const cyInstance = cytoscape({
      container: containerRef.current,
      elements: [...nodes, ...links],
      wheelSensitivity: 0.25,
      style: [
        {
          selector: 'node',
          style: {
            'background-color': 'data(color)',
            width: 'data(size)',
            height: 'data(size)',
            label: (ele: any) => {
              const shouldShow = showLabels || ele.hasClass('selected') || ele.hasClass('hovered') || ele.cy().zoom() > 1.8;
              return shouldShow ? ele.data('label') : '';
            },
            color: '#e2e8f0',
            'font-size': 10,
            'text-valign': 'top',
            'text-margin-y': -10,
            'text-outline-width': 2,
            'text-outline-color': '#0f172a',
            'border-width': 1.5,
            'border-color': '#0b1020',
          },
        },
        {
          selector: 'edge',
          style: {
            'line-color': '#94a3b8',
            width: 0.6,
            opacity: 0.12,
          },
        },
        {
          selector: '.selected',
          style: {
            'border-width': 3,
            'border-color': '#f8fafc',
            'z-index': 30,
          },
        },
        {
          selector: '.neighbor',
          style: {
            opacity: 1,
            'z-index': 20,
          },
        },
        {
          selector: '.active-edge',
          style: {
            opacity: 0.45,
            width: 1.4,
            'line-color': '#cbd5e1',
          },
        },
        {
          selector: '.faded',
          style: {
            opacity: 0.08,
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

    const resetHighlight = () => {
      cyInstance.elements().removeClass('selected neighbor active-edge faded hovered');
      if (selectedCommunity === 'all') {
        cyInstance.elements().removeClass('hidden-node');
      }
    };

    const applyCommunityFilter = () => {
      cyInstance.elements().removeClass('hidden-node');
      if (selectedCommunity === 'all') return;

      cyInstance.nodes().forEach((node) => {
        if (String(node.data('community')) !== selectedCommunity) {
          node.addClass('hidden-node');
        }
      });
      cyInstance.edges().forEach((edge) => {
        if (edge.source().hasClass('hidden-node') || edge.target().hasClass('hidden-node')) {
          edge.addClass('hidden-node');
        }
      });
    };

    const applySelection = (node: cytoscape.NodeSingular) => {
      resetHighlight();
      node.addClass('selected');
      const neighborNodes = node.neighborhood('node');
      const neighborEdges = node.connectedEdges();
      neighborNodes.addClass('neighbor');
      neighborEdges.addClass('active-edge');

      cyInstance.elements().difference(node.union(neighborNodes).union(neighborEdges)).addClass('faded');
      if (showOnlyNeighborhood) {
        cyInstance.elements().difference(node.union(neighborNodes).union(neighborEdges)).addClass('hidden-node');
      }

      const payload = node.data() as GraphNodeData;
      setSelectedNode(payload);
      onNodeClick?.(payload.id);
    };

    cyInstance.on('tap', 'node', (evt) => {
      applySelection(evt.target);
    });

    cyInstance.on('mouseover', 'node', (evt) => {
      const node = evt.target;
      node.addClass('hovered');
      const rendered = node.renderedPosition();
      setHoverState({
        x: rendered.x,
        y: rendered.y,
        node: node.data() as GraphNodeData,
      });
    });

    cyInstance.on('mouseout', 'node', (evt) => {
      evt.target.removeClass('hovered');
      setHoverState(null);
    });

    cyInstance.on('tap', (evt) => {
      if (evt.target === cyInstance) {
        setSelectedNode(null);
        setHoverState(null);
        resetHighlight();
        applyCommunityFilter();
      }
    });

    cyInstance.on('zoom pan', () => {
      if (hoverState) {
        setHoverState((prev) => (prev ? { ...prev } : null));
      }
    });

    const layout = cyInstance.layout(createLayoutOptions(currentLayout) as any);
    layout.run();

    cyRef.current = cyInstance;
    applyCommunityFilter();

    return () => {
      cyInstance.destroy();
      cyRef.current = null;
    };
  }, [graphData, onNodeClick, scaleMetric, selectedCommunity, showLabels, showOnlyNeighborhood]);

  useEffect(() => {
    const cy = cyRef.current;
    if (!cy) return;

    if (!selectedNodeId) {
      cy.elements().removeClass('selected neighbor active-edge faded hovered');
      setSelectedNode(null);
      return;
    }

    const targetNode = cy.getElementById(String(selectedNodeId));
    if (!targetNode || targetNode.empty()) {
      return;
    }

    cy.elements().removeClass('selected neighbor active-edge faded hovered');
    targetNode.removeClass('hidden-node');
    targetNode.neighborhood('node').removeClass('hidden-node');
    targetNode.connectedEdges().removeClass('hidden-node');

    targetNode.addClass('selected');
    const neighborNodes = targetNode.neighborhood('node');
    const neighborEdges = targetNode.connectedEdges();
    neighborNodes.addClass('neighbor');
    neighborEdges.addClass('active-edge');

    const activeElements = targetNode.union(neighborNodes).union(neighborEdges);
    const unrelatedElements = cy.elements().difference(activeElements);
    unrelatedElements.addClass('faded');

    if (showOnlyNeighborhood) {
      unrelatedElements.addClass('hidden-node');
    }

    setSelectedNode(targetNode.data() as GraphNodeData);
    cy.animate({
      fit: { eles: activeElements, padding: 80 },
      duration: 250,
    });
  }, [selectedNodeId, showOnlyNeighborhood]);

  const handleRelayout = () => {
    if (!cyRef.current) return;
    cyRef.current.layout(createLayoutOptions(layoutName) as any).run();
  };

  const handleZoom = (direction: 'in' | 'out') => {
    if (!cyRef.current) return;
    const zoom = cyRef.current.zoom();
    cyRef.current.zoom({
      level: direction === 'in' ? zoom * 1.15 : zoom / 1.15,
      renderedPosition: { x: 300, y: 220 },
    });
  };

  const handleFit = () => {
    cyRef.current?.fit(undefined, 35);
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
        </select>

        <label className="flex items-center gap-1 text-xs text-slate-200">
          <input type="checkbox" checked={showLabels} onChange={(e) => setShowLabels(e.target.checked)} />
          Show labels
        </label>
        <label className="flex items-center gap-1 text-xs text-slate-200">
          <input
            type="checkbox"
            checked={showOnlyNeighborhood}
            onChange={(e) => setShowOnlyNeighborhood(e.target.checked)}
          />
          Show only selected neighborhood
        </label>
      </div>

      <div className="grid grid-cols-1 gap-3 p-3 lg:grid-cols-[1fr_260px]">
        <div className="relative overflow-hidden rounded-lg border border-slate-700 bg-[#0b1220]" style={{ height: 620 }}>
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
            <div className="space-y-1">
              <div>
                <span className="text-slate-400">ID:</span> {selectedNode.id}
              </div>
              <div>
                <span className="text-slate-400">Community:</span> {selectedNode.community}
              </div>
              <div>
                <span className="text-slate-400">Degree:</span> {selectedNode.degree}
              </div>
              <div>
                <span className="text-slate-400">PageRank:</span> {selectedNode.pagerank.toFixed(6)}
              </div>
            </div>
          ) : (
            <div className="text-slate-400">Click a node to inspect details.</div>
          )}

          <div className="mt-4 border-t border-slate-700 pt-3 text-xs text-slate-300">
            <div>Rendered nodes: {graphData?.meta.num_nodes ?? 0}</div>
            <div>Rendered edges: {graphData?.meta.num_edges ?? 0}</div>
            <div>Communities: {graphData?.meta.num_communities ?? 0}</div>
            <div>Layout: {layoutName}</div>
          </div>
        </div>
      </div>
    </div>
  );
};
