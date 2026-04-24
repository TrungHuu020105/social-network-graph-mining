import React, { useEffect, useRef } from 'react';
import cytoscape from 'cytoscape';
import { ExplanationData } from '../../types';

interface RecommendationGraphProps {
  userId: string;
  targetId: string;
  targetName: string;
  userName: string;
  explanation: ExplanationData;
}

export const RecommendationGraph: React.FC<RecommendationGraphProps> = ({
  userId,
  targetId,
  targetName,
  userName,
  explanation,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<any>(null);

  useEffect(() => {
    if (!containerRef.current || !explanation) return;

    let mounted = true;

    const initGraph = () => {
      try {
        if (cyRef.current) {
          try {
            cyRef.current.removeAllListeners();
            cyRef.current.destroy();
          } catch (e) {
            console.warn('Error destroying cytoscape:', e);
          }
          cyRef.current = null;
        }

        const elements: any[] = [];

        elements.push({
          data: {
            id: userId,
            label: userId,
            type: 'user',
          },
        });

        elements.push({
          data: {
            id: targetId,
            label: targetId,
            type: 'target',
          },
        });

        explanation.common_neighbors.forEach((neighbor: string) => {
          elements.push({
            data: {
              id: neighbor,
              label: neighbor,
              type: 'neighbor',
            },
          });

          elements.push({
            data: {
              id: `${userId}-${neighbor}`,
              source: userId,
              target: neighbor,
            },
          });

          elements.push({
            data: {
              id: `${targetId}-${neighbor}`,
              source: targetId,
              target: neighbor,
            },
          });
        });

        const cy = cytoscape({
          container: containerRef.current,
          elements,
          style: [
            {
              selector: 'node',
              style: {
                label: 'data(label)',
                'text-valign': 'center',
                'text-halign': 'center',
                width: 50,
                height: 50,
                'font-size': 11,
                color: '#fff',
                'border-width': 2,
                'border-color': '#ddd',
              },
            },
            {
              selector: 'node[type=\"user\"]',
              style: {
                'background-color': '#3b82f6',
                'border-color': '#1e40af',
                width: 60,
                height: 60,
                'font-weight': 'bold',
              },
            },
            {
              selector: 'node[type=\"target\"]',
              style: {
                'background-color': '#eab308',
                'border-color': '#ca8a04',
                width: 60,
                height: 60,
                'font-weight': 'bold',
                color: '#000',
              },
            },
            {
              selector: 'node[type=\"neighbor\"]',
              style: {
                'background-color': '#64748b',
                'border-color': '#475569',
              },
            },
            {
              selector: 'edge',
              style: {
                'line-color': '#cbd5e1',
                width: 1.5,
                opacity: 0.6,
              },
            },
          ],
          layout: {
            name: 'cose',
            animate: false,
            directed: false,
            componentSpacing: 40,
            nodeSpacing: 10,
          } as any,
        });

        if (mounted) {
          cyRef.current = cy;
          setTimeout(() => {
            cy.fit(undefined, 10);
          }, 100);
        }
      } catch (error) {
        console.error('Error initializing recommendation graph:', error);
      }
    };

    initGraph();

    return () => {
      mounted = false;
      if (cyRef.current) {
        try {
          cyRef.current.removeAllListeners();
          cyRef.current.destroy();
          cyRef.current = null;
        } catch (e) {
          console.warn('Error during cleanup:', e);
        }
      }
    };
  }, [userId, targetId, userName, targetName, explanation]);

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-sm">
        <div className="flex items-center gap-1">
          <div className="h-3 w-3 rounded-full bg-blue-500" />
          <span className="text-slate-400">Người dùng</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="h-3 w-3 rounded-full bg-yellow-400" />
          <span className="text-slate-400">Gợi ý</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="h-3 w-3 rounded-full bg-slate-500" />
          <span className="text-slate-400">Bạn chung</span>
        </div>
      </div>
      <div
        ref={containerRef}
        style={{
          width: '100%',
          height: '250px',
          background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
          borderRadius: '0.5rem',
          border: '1px solid #475569',
        }}
      />
    </div>
  );
};
