// components/graph/GraphPanel.tsx
import React, { useEffect, useRef, useState } from 'react';
import cytoscape from 'cytoscape';
import { getGraphData } from '../../api/endpoints';
import { GraphData } from '../../types';
import { ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';

interface GraphPanelProps {
  communityAlgorithm?: string;
  onNodeClick?: (nodeId: string) => void;
}

export const GraphPanel: React.FC<GraphPanelProps> = ({
  communityAlgorithm = 'louvain',
  onNodeClick,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadGraph = async () => {
      try {
        const data = await getGraphData(communityAlgorithm);

        if (containerRef.current && cyRef.current === null) {
          // Map nodes to Cytoscape format
          const nodes = data.nodes.map((node: any) => ({
            data: {
              id: String(node.data.id),
              label: String(node.data.id), // Chỉ show ID
              username: node.data.username,
              degree: node.data.degree,
              community: node.data.community,
              backgroundColor: node.data.style['background-color'],
            }
          }));

          const edges = data.edges.map((edge: any) => ({
            data: {
              id: edge.data.id,
              source: String(edge.data.source),
              target: String(edge.data.target),
            }
          }));

          // Initialize Cytoscape
          const cy = cytoscape({
            container: containerRef.current,
            elements: [...nodes, ...edges],
            style: [
              {
                selector: 'node',
                style: {
                  'background-color': (ele: any) => ele.data('backgroundColor') || '#808080',
                  'label': 'data(label)',
                  'text-valign': 'center',
                  'text-halign': 'center',
                  'width': 'mapData(degree, 0, 50, 20, 40)',
                  'height': 'mapData(degree, 0, 50, 20, 40)',
                  'font-size': 12,
                  'color': '#fff',
                  'border-width': 2,
                  'border-color': '#ddd',
                }
              },
              {
                selector: 'edge',
                style: {
                  'line-color': '#ccc',
                  'width': 1,
                  'opacity': 0.5,
                }
              },
              {
                selector: 'node:selected',
                style: {
                  'border-width': 4,
                  'border-color': '#ffff00',
                  'width': 'mapData(degree, 0, 50, 30, 50)',
                  'height': 'mapData(degree, 0, 50, 30, 50)',
                  'z-index': 100,
                }
              },
              {
                selector: 'edge.highlighted',
                style: {
                  'line-color': '#ffff00',
                  'width': 3,
                  'opacity': 1,
                  'z-index': 99,
                }
              },
              {
                selector: 'node.neighbor',
                style: {
                  'border-width': 3,
                  'border-color': '#ff6b6b',
                  'width': 'mapData(degree, 0, 50, 25, 45)',
                  'height': 'mapData(degree, 0, 50, 25, 45)',
                  'z-index': 50,
                }
              }
            ],
            layout: {
              name: 'cose',
              animate: true,
              animationDuration: 500,
            } as any
          });

          // Node click event
          cy.on('tap', 'node', (evt: any) => {
            const node = evt.target;
            const nodeId = node.id();
            
            // Clear previous selection
            cy.elements().removeClass('selected neighbor highlighted');
            
            // Select current node
            node.addClass('selected');
            
            // Get all connected edges and highlight them
            const connectedEdges = node.connectedEdges();
            connectedEdges.addClass('highlighted');
            
            // Highlight neighbor nodes
            const neighbors = node.neighborhood('node');
            neighbors.addClass('neighbor');
            
            // Callback
            onNodeClick?.(nodeId);
          });

          // Click background to deselect
          cy.on('tap', (evt: any) => {
            if (evt.target === cy) {
              cy.elements().removeClass('selected neighbor highlighted');
            }
          });

          cyRef.current = cy;
        }
      } catch (error) {
        console.error('Error loading graph:', error);
        setError(error instanceof Error ? error.message : 'Lỗi tải đồ thị');
      } finally {
        setLoading(false);
      }
    };

    loadGraph();
  }, [communityAlgorithm, onNodeClick]);

  const handleZoom = (direction: 'in' | 'out') => {
    if (cyRef.current) {
      const zoom = cyRef.current.zoom();
      cyRef.current.zoom(direction === 'in' ? zoom * 1.2 : zoom / 1.2);
    }
  };

  const handleFit = () => {
    if (cyRef.current) {
      cyRef.current.fit();
    }
  };

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden">
      {/* Controls */}
      <div className="flex gap-2 p-3 bg-slate-700 border-b border-slate-600">
        <button
          onClick={() => handleZoom('in')}
          className="p-2 hover:bg-slate-600 rounded transition-colors"
          title="Phóng to"
        >
          <ZoomIn size={20} className="text-white" />
        </button>
        <button
          onClick={() => handleZoom('out')}
          className="p-2 hover:bg-slate-600 rounded transition-colors"
          title="Thu nhỏ"
        >
          <ZoomOut size={20} className="text-white" />
        </button>
        <button
          onClick={handleFit}
          className="p-2 hover:bg-slate-600 rounded transition-colors"
          title="Vừa khít"
        >
          <Maximize2 size={20} className="text-white" />
        </button>
      </div>

      {/* Graph Container */}
      <div
        ref={containerRef}
        style={{ 
          width: '100%', 
          height: '600px', 
          background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
          position: 'relative'
        }}
      >
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-800 bg-opacity-50">
            <div className="text-white text-center">
              <div className="animate-spin mb-2">⏳</div>
              <p>Đang tải đồ thị...</p>
            </div>
          </div>
        )}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-800 bg-opacity-50">
            <div className="text-red-400 text-center">
              <p>❌ Lỗi: {error}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
