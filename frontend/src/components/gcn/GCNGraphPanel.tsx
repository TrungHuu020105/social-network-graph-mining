import React, { useEffect, useRef, useState } from 'react';
import cytoscape from 'cytoscape';
import { getGraphData } from '../../api/endpoints';

interface HoverInfo {
  nodeId: string;
  prediction: number | null;
  probability: number | null;
  degree: number;
}

export const GCNGraphPanel: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<cytoscape.Core | null>(null);
  const [hoverInfo, setHoverInfo] = useState<HoverInfo | null>(null);

  useEffect(() => {
    let active = true;
    const load = async () => {
      const graph = await getGraphData('louvain');
      if (!active || !containerRef.current) return;

      if (cyRef.current) {
        cyRef.current.destroy();
        cyRef.current = null;
      }

      const nodes = graph.nodes.map((node: any) => {
        const prediction = node.prediction;
        const color = prediction === 1 ? '#ef4444' : prediction === 0 ? '#3b82f6' : '#64748b';
        return {
          data: {
            id: String(node.id),
            degree: node.degree ?? 0,
            prediction: prediction ?? null,
            probability: node.probability ?? null,
            label: String(node.id),
            color,
          },
        };
      });
      const edges = graph.links.map((edge: any, idx: number) => ({
        data: {
          id: `${edge.source}-${edge.target}-${idx}`,
          source: String(edge.source),
          target: String(edge.target),
        },
      }));

      const cy = cytoscape({
        container: containerRef.current,
        elements: [...nodes, ...edges],
        style: [
          {
            selector: 'node',
            style: {
              'background-color': 'data(color)',
              label: 'data(label)',
              color: '#e2e8f0',
              'font-size': 8,
              width: 'mapData(degree, 0, 100, 12, 30)',
              height: 'mapData(degree, 0, 100, 12, 30)',
            },
          },
          {
            selector: 'edge',
            style: {
              'line-color': '#334155',
              width: 0.8,
              opacity: 0.45,
            },
          },
        ],
        layout: {
          name: 'cose',
          animate: false,
          fit: true,
          padding: 10,
        } as any,
      });

      cy.on('mouseover', 'node', (evt) => {
        const data = evt.target.data();
        setHoverInfo({
          nodeId: data.id,
          prediction: data.prediction,
          probability: data.probability,
          degree: data.degree,
        });
      });
      cy.on('mouseout', 'node', () => {
        setHoverInfo(null);
      });

      cyRef.current = cy;
    };

    load().catch(() => {});
    return () => {
      active = false;
      if (cyRef.current) {
        cyRef.current.destroy();
        cyRef.current = null;
      }
    };
  }, []);

  return (
    <section className="rounded-xl border border-slate-700 bg-slate-800 p-4">
      <h3 className="mb-3 text-lg font-semibold text-white">Graph Visualization (max 1000 nodes)</h3>
      <div className="mb-3 flex gap-4 text-xs text-slate-300">
        <span className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-blue-500" />
          Class 0
        </span>
        <span className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-red-500" />
          Class 1
        </span>
      </div>

      <div
        ref={containerRef}
        style={{ height: 420, width: '100%' }}
        className="rounded-lg border border-slate-700 bg-slate-900"
      />

      {hoverInfo && (
        <div className="mt-3 rounded-lg bg-slate-700 p-3 text-sm text-slate-200">
          <p>node_id: {hoverInfo.nodeId}</p>
          <p>prediction: {hoverInfo.prediction ?? 'N/A'}</p>
          <p>probability: {hoverInfo.probability != null ? `${(hoverInfo.probability * 100).toFixed(2)}%` : 'N/A'}</p>
          <p>degree: {hoverInfo.degree}</p>
        </div>
      )}
    </section>
  );
};
