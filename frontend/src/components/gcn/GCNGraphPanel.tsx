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
  const [selectedNodeInfo, setSelectedNodeInfo] = useState<HoverInfo | null>(null);

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

      cy.on('tap', 'node', (evt) => {
        const data = evt.target.data();
        setSelectedNodeInfo({
          nodeId: data.id,
          prediction: data.prediction,
          probability: data.probability,
          degree: data.degree,
        });
      });

      cy.on('tap', (evt) => {
        if (evt.target === cy) {
          setSelectedNodeInfo(null);
        }
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
      <h3 className="mb-3 text-lg font-semibold text-white">Trực quan đồ thị (tối đa 1000 node)</h3>
      <div className="mb-3 flex gap-4 text-xs text-slate-300">
        <span className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-blue-500" />
          Lớp 0
        </span>
        <span className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-red-500" />
          Lớp 1
        </span>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-[minmax(0,1fr)_280px]">
        <div
          ref={containerRef}
          style={{ height: 420, width: '100%' }}
          className="rounded-lg border border-slate-700 bg-slate-900"
        />

        <div className="rounded-lg border border-slate-700 bg-slate-900/70 p-3 text-sm text-slate-200">
          <h4 className="mb-3 text-base font-semibold text-white">Chi tiết node</h4>
          {selectedNodeInfo ? (
            <div className="space-y-2">
              <p>node_id: {selectedNodeInfo.nodeId}</p>
              <p>dự đoán: {selectedNodeInfo.prediction ?? 'N/A'}</p>
              <p>
                xác suất:{' '}
                {selectedNodeInfo.probability != null
                  ? `${(selectedNodeInfo.probability * 100).toFixed(2)}%`
                  : 'N/A'}
              </p>
              <p>bậc: {selectedNodeInfo.degree}</p>
            </div>
          ) : (
            <p className="text-slate-400">Nhấn vào node để xem thông tin chi tiết.</p>
          )}
        </div>
      </div>
    </section>
  );
};
