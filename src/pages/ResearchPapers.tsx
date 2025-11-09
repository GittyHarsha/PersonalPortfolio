import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  MarkerType,
  Node,
  Edge,
  NodeChange,
  EdgeChange,
  Connection,
  applyNodeChanges,
  applyEdgeChanges,
  Position,
  useReactFlow,
  ReactFlowProvider,
  NodeMouseHandler,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { PaperNode } from '../components/PaperNode';
import { getLayoutedElements } from '../utils/layout';
import { isDevelopment } from '../utils/environment';
import type { AppData, Paper } from '../types';
import './ResearchPapers.css';

const nodeTypes = {
  paper: PaperNode,
};

function ResearchPapersContent() {
  const [data, setData] = useState<AppData | null>(null);
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingNode, setEditingNode] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Paper>>({});
  const isDev = isDevelopment();
  const reactFlowInstance = useReactFlow();
  const hasLayoutedRef = useRef(false);
  const isDraggingRef = useRef(false);

  // Auto-save to papers.json via API whenever data changes (dev mode only)
  useEffect(() => {
    if (isDev && data) {
      // Save to API endpoint
      fetch('http://localhost:3001/api/papers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })
        .then((res) => {
          if (res.ok) {
            console.log('💾 Auto-saved to papers.json');
          }
        })
        .catch((err) => {
          console.error('Failed to save:', err);
        });
    }
  }, [data, isDev]);

  // Load papers data
  useEffect(() => {
    // Load from papers.json
    fetch('/papers.json')
      .then((res) => res.json())
      .then((jsonData: AppData) => {
        setData(jsonData);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load papers:', err);
        setLoading(false);
      });
  }, []);

  // Convert papers to nodes and edges (similar to DAGView)
  const { reactFlowNodes, reactFlowEdges } = useMemo(() => {
    if (!data || data.papers.length === 0) {
      return { reactFlowNodes: [], reactFlowEdges: [] };
    }

    const reactFlowNodes: Node[] = data.papers.map((paper) => ({
      id: paper.id,
      type: 'paper',
      position: paper.dagPosition || { x: 0, y: 0 },
      data: { paper },
      draggable: isDev,
      selectable: true,
      sourcePosition: Position.Bottom,
      targetPosition: Position.Top,
    }));

    const reactFlowEdges: Edge[] = [];
    const visiblePaperIds = new Set(data.papers.map((p) => p.id));

    data.papers.forEach((paper) => {
      if (paper.dependencies && paper.dependencies.length > 0) {
        paper.dependencies.forEach((depId) => {
          if (visiblePaperIds.has(depId)) {
            reactFlowEdges.push({
              id: `${depId}::${paper.id}`,
              source: depId,
              target: paper.id,
              type: 'straight',
              markerEnd: {
                type: MarkerType.ArrowClosed,
                color: '#6b7280',
                width: 20,
                height: 20,
              },
              style: {
                stroke: '#6b7280',
                strokeWidth: 2,
              },
              animated: false,
              selectable: isDev,
            });
          }
        });
      }
    });

    return { reactFlowNodes, reactFlowEdges };
  }, [data, isDev]);

  // Apply layout when nodes change (similar to DAGView)
  useEffect(() => {
    if (reactFlowNodes.length === 0) {
      setNodes([]);
      setEdges([]);
      hasLayoutedRef.current = false;
      return;
    }

    if (isDraggingRef.current) {
      return;
    }

    // Always apply auto-layout when nodes change
    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
      reactFlowNodes,
      reactFlowEdges,
      {
        direction: 'TB',
        nodeWidth: 280,
        nodeHeight: 200,
        nodesep: 150,     // Increased horizontal spacing
        ranksep: 220,     // Increased vertical spacing
        edgesep: 50,      // Edge separation
        marginx: 100,     // Larger margins
        marginy: 100,
        ranker: 'network-simplex', // Best algorithm for minimizing crossings
      }
    );

    setNodes(layoutedNodes);
    setEdges(layoutedEdges);
    hasLayoutedRef.current = true;
  }, [reactFlowNodes, reactFlowEdges, data]);

  // Fit view after layout
  useEffect(() => {
    if (nodes.length > 0 && reactFlowInstance && hasLayoutedRef.current) {
      const timer = setTimeout(() => {
        try {
          reactFlowInstance.fitView({
            padding: 0.2,
            duration: 600,
            includeHiddenNodes: false,
            minZoom: 0.4,
            maxZoom: 1.5,
          });
        } catch (error) {
          // Silently handle fitView errors
        }
      }, 200);

      return () => clearTimeout(timer);
    }
  }, [nodes, reactFlowInstance]);

  // Handle node changes (similar to DAGView)
  const onNodesChange = useCallback((changes: NodeChange[]) => {
    const hasDragStart = changes.some((c) => c.type === 'position' && c.dragging === true);
    const hasDragEnd = changes.some((c) => c.type === 'position' && c.dragging === false);

    if (hasDragStart) {
      isDraggingRef.current = true;
    }
    if (hasDragEnd) {
      isDraggingRef.current = false;
    }

    setNodes((nds) => applyNodeChanges(changes, nds));

    // Save positions when drag ends (in dev mode)
    if (isDev) {
      changes.forEach((change) => {
        if (change.type === 'position' && change.position && !change.dragging) {
          // Position saved for export
        }
      });
    }
  }, [isDev]);

  const onEdgesChange = useCallback((changes: EdgeChange[]) => {
    setEdges((eds) => applyEdgeChanges(changes, eds));
  }, []);

  // Handle new connections (in dev mode)
  const onConnect = useCallback(
    (connection: Connection) => {
      if (!isDev) return;

      const { source, target } = connection;
      if (!source || !target || !data) return;

      // Add the edge visually
      const newEdge: Edge = {
        id: `${source}::${target}`,
        source,
        target,
        type: 'straight',
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: '#6b7280',
          width: 20,
          height: 20,
        },
        style: {
          stroke: '#6b7280',
          strokeWidth: 2,
        },
        animated: false,
        selectable: true,
      };

      setEdges((eds) => [...eds, newEdge]);

      // Update data structure
      setData((prevData) => {
        if (!prevData) return prevData;
        return {
          ...prevData,
          papers: prevData.papers.map((paper) => {
            if (paper.id === target) {
              const deps = paper.dependencies || [];
              if (!deps.includes(source)) {
                return { ...paper, dependencies: [...deps, source] };
              }
            }
            return paper;
          }),
        };
      });
    },
    [isDev, data]
  );

  const handleLayout = useCallback(() => {
    if (nodes.length === 0) return;

    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
      nodes.map((n) => ({ ...n, position: { x: 0, y: 0 } })),
      edges,
      {
        direction: 'TB',
        nodeWidth: 280,
        nodeHeight: 200,
        nodesep: 150,     // Increased horizontal spacing
        ranksep: 220,     // Increased vertical spacing
        edgesep: 50,      // Edge separation
        marginx: 100,     // Larger margins
        marginy: 100,
        ranker: 'network-simplex', // Best algorithm for minimizing crossings
      }
    );

    setNodes(layoutedNodes);
    setEdges(layoutedEdges);
    hasLayoutedRef.current = true;

    setTimeout(() => {
      try {
        reactFlowInstance?.fitView({
          padding: 0.2,
          duration: 800,
          includeHiddenNodes: false,
          minZoom: 0.4,
          maxZoom: 1.5,
        });
      } catch (error) {
        // Silently handle fitView errors
      }
    }, 150);
  }, [nodes, edges, reactFlowInstance]);

  const handleExport = useCallback(() => {
    if (!data) return;

    const updatedPapers = data.papers.map((paper) => {
      const node = nodes.find((n) => n.id === paper.id);
      return node ? { ...paper, dagPosition: node.position } : paper;
    });

    const exportData = {
      ...data,
      papers: updatedPapers,
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'papers.json';
    a.click();
    URL.revokeObjectURL(url);
    
    alert('✅ Papers exported! Replace public/papers.json with the downloaded file to deploy changes.');
  }, [data, nodes]);

  const handleResetData = useCallback(() => {
    if (!isDev) return;
    
    if (confirm('⚠️ Reload papers.json from disk?')) {
      window.location.reload();
    }
  }, [isDev]);

  // Add new node (dev mode only)
  const handleAddNode = useCallback(() => {
    if (!isDev || !data) return;

    const now = new Date().toISOString();
    const newPaper: Paper = {
      id: `paper-${Date.now()}`,
      title: 'New Paper',
      authors: '',
      year: new Date().getFullYear(),
      status: 'to_read',
      priority: 'MED',
      dependencies: [],
      dagPosition: { x: 0, y: 0 },
      createdAt: now,
      updatedAt: now,
    };

    // Add to data - this will trigger auto-layout
    setData({
      ...data,
      papers: [...data.papers, newPaper],
    });

    // Open edit modal immediately
    setEditingNode(newPaper.id);
    setEditForm(newPaper);
  }, [isDev, data]);

  // Delete node (dev mode only)
  const handleDeleteNode = useCallback(
    (nodeId: string) => {
      if (!isDev || !data) return;

      setData({
        ...data,
        papers: data.papers.filter((p) => p.id !== nodeId),
      });

      setNodes((nds) => nds.filter((n) => n.id !== nodeId));
      setEdges((eds) => eds.filter((e) => e.source !== nodeId && e.target !== nodeId));

      if (editingNode === nodeId) {
        setEditingNode(null);
        setEditForm({});
      }
    },
    [isDev, data, editingNode]
  );

  // Handle double click to edit (dev mode only)
  const handleNodeDoubleClick: NodeMouseHandler = useCallback(
    (_event, node) => {
      if (!isDev || !data) return;

      const paper = data.papers.find((p) => p.id === node.id);
      if (paper) {
        setEditingNode(node.id);
        setEditForm(paper);
      }
    },
    [isDev, data]
  );

  // Save edited node
  const handleSaveEdit = useCallback(() => {
    if (!editingNode || !editForm.id || !data) return;

    const updatedPaper: Paper = {
      id: editForm.id,
      title: editForm.title || 'Untitled',
      authors: editForm.authors || '',
      year: editForm.year || new Date().getFullYear(),
      venue: editForm.venue || '',
      status: editForm.status || 'to_read',
      priority: editForm.priority || 'MED',
      dependencies: editForm.dependencies || [],
      dagPosition: { x: 0, y: 0 }, // Reset position to trigger layout
      url: editForm.url,
      description: editForm.description,
      topicId: editForm.topicId,
      tags: editForm.tags,
      createdAt: editForm.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Update data - this will trigger auto-layout
    setData({
      ...data,
      papers: data.papers.map((p) => (p.id === editingNode ? updatedPaper : p)),
    });

    setEditingNode(null);
    setEditForm({});
  }, [editingNode, editForm, data]);

  // Cancel editing
  const handleCancelEdit = useCallback(() => {
    setEditingNode(null);
    setEditForm({});
  }, []);

  const stats = useMemo(() => {
    if (!data) return { total: 0, completed: 0, reading: 0, toRead: 0 };
    return {
      total: data.papers.length,
      completed: data.papers.filter((p) => p.status === 'completed').length,
      reading: data.papers.filter((p) => p.status === 'reading').length,
      toRead: data.papers.filter((p) => p.status === 'to_read').length,
    };
  }, [data]);

  if (loading) {
    return <div className="loading">Loading papers...</div>;
  }

  return (
    <div className="research-container">
      <div className="header">
        <h1>
          Research Papers Reading Graph
          <span className={isDev ? 'mode-badge mode-dev' : 'mode-badge mode-prod'}>
            {isDev ? '🛠️ Dev Mode' : ''}
          </span>
        </h1>
        <div className="stats">
          <span>📚 Total: {stats.total}</span>
          <span>✅ Completed: {stats.completed}</span>
          <span>📖 Reading: {stats.reading}</span>
          <span>📋 To Read: {stats.toRead}</span>
        </div>
        <div className="controls">
          {isDev && (
            <>
              <button className="btn btn-success" onClick={handleAddNode}>
                ➕ Add Node
              </button>
              <button className="btn" onClick={handleLayout}>
                🔄 Auto Layout
              </button>
              <button className="btn btn-primary" onClick={handleExport}>
                💾 Export JSON
              </button>
              <button className="btn" onClick={handleResetData}>
                🔄 Reset to Original
              </button>
            </>
          )}
          <a href="/" className="btn">
            ← Back to Home
          </a>
        </div>
      </div>

      <div className="graph-container">
        {!data || data.papers.length === 0 ? (
          <div className="empty-state">
            <h2>No papers yet</h2>
            <p>Add papers to papers.json to get started</p>
          </div>
        ) : (
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={isDev ? onNodesChange : undefined}
            onEdgesChange={isDev ? onEdgesChange : undefined}
            onConnect={isDev ? onConnect : undefined}
            onNodeDoubleClick={isDev ? handleNodeDoubleClick : undefined}
            nodeTypes={nodeTypes}
            fitView={false}
            minZoom={0.2}
            maxZoom={2}
            nodesDraggable={isDev}
            nodesConnectable={isDev}
            elementsSelectable={true}
            edgesFocusable={true}
            deleteKeyCode={isDev ? ['Backspace', 'Delete'] : undefined}
          >
            <Background color="#aaa" gap={16} />
            <Controls />
            <MiniMap
              nodeColor={(node: Node) => {
                const status = (node.data.paper as Paper)?.status;
                if (status === 'completed') return '#10b981';
                if (status === 'reading') return '#3b82f6';
                return '#d1d5db';
              }}
            />
          </ReactFlow>
        )}
      </div>

      {/* Edit Node Modal */}
      {isDev && editingNode && (
        <div className="modal-overlay" onClick={handleCancelEdit}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Edit Paper</h2>
            <div className="form-group">
              <label>Title:</label>
              <input
                type="text"
                value={editForm.title || ''}
                onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>URL:</label>
              <input
                type="text"
                value={editForm.url || ''}
                onChange={(e) => setEditForm({ ...editForm, url: e.target.value })}
                placeholder="https://..."
              />
            </div>
            <div className="form-group">
              <label>Status:</label>
              <select
                value={editForm.status || 'to_read'}
                onChange={(e) =>
                  setEditForm({
                    ...editForm,
                    status: e.target.value as Paper['status'],
                  })
                }
              >
                <option value="to_read">To Read</option>
                <option value="reading">Reading</option>
                <option value="completed">Completed</option>
                <option value="archived">Archived</option>
              </select>
            </div>
            <div className="modal-actions">
              <button onClick={handleSaveEdit} className="btn btn-primary">
                💾 Save
              </button>
              <button onClick={handleCancelEdit} className="btn">
                ❌ Cancel
              </button>
              <button
                onClick={() => {
                  if (editingNode && confirm('Delete this paper?')) {
                    handleDeleteNode(editingNode);
                  }
                }}
                className="btn btn-danger"
              >
                🗑️ Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function ResearchPapers() {
  return (
    <ReactFlowProvider>
      <ResearchPapersContent />
    </ReactFlowProvider>
  );
}
