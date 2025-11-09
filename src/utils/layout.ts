import dagre from 'dagre';
import { Node, Edge, Position } from '@xyflow/react';

interface LayoutOptions {
  direction?: 'TB' | 'LR' | 'BT' | 'RL';
  nodeWidth?: number;
  nodeHeight?: number;
  nodesep?: number;
  ranksep?: number;
  edgesep?: number;
  marginx?: number;
  marginy?: number;
  ranker?: 'network-simplex' | 'tight-tree' | 'longest-path';
}

/**
 * Layout nodes using Dagre algorithm with collision detection
 * Copied and enhanced from task-dependency-dag
 */
export function getLayoutedElements(
  nodes: Node[],
  edges: Edge[],
  options: LayoutOptions = {}
): { nodes: Node[]; edges: Edge[] } {
  const {
    direction = 'TB',
    nodeWidth = 280,
    nodeHeight = 180,
    nodesep = 150,      // Increased for better node separation
    ranksep = 200,      // Increased for better vertical spacing
    edgesep = 50,       // Edge separation to avoid edge-node collision
    marginx = 80,       // Larger margins
    marginy = 80,
    ranker = 'network-simplex', // Best for minimizing edge crossings
  } = options;

  // Early return for empty nodes
  if (nodes.length === 0) {
    return { nodes: [], edges: [] };
  }

  const g = new dagre.graphlib.Graph();
  
  // Configure graph with collision-aware settings
  g.setGraph({
    rankdir: direction,
    nodesep,      // Horizontal spacing between nodes in same rank
    ranksep,      // Vertical spacing between ranks
    edgesep,      // Minimum separation between edges
    marginx,      // Graph margins
    marginy,
    ranker,       // Algorithm for minimizing edge crossings
    acyclicer: 'greedy', // Handle cycles if they exist
  });
  
  g.setDefaultEdgeLabel(() => ({}));

  // Add nodes to graph with proper dimensions
  nodes.forEach((node) => {
    g.setNode(node.id, {
      width: nodeWidth,
      height: nodeHeight,
    });
  });

  // Add edges to graph
  edges.forEach((edge) => {
    try {
      g.setEdge(edge.source, edge.target);
    } catch (error) {
      // Silently handle invalid edges
      console.warn(`Invalid edge: ${edge.source} -> ${edge.target}`);
    }
  });

  // Run layout algorithm
  dagre.layout(g);

  // Set handle positions based on layout direction
  let sourcePosition: Position;
  let targetPosition: Position;

  switch (direction) {
    case 'TB':
      sourcePosition = Position.Bottom;
      targetPosition = Position.Top;
      break;
    case 'BT':
      sourcePosition = Position.Top;
      targetPosition = Position.Bottom;
      break;
    case 'LR':
      sourcePosition = Position.Right;
      targetPosition = Position.Left;
      break;
    case 'RL':
      sourcePosition = Position.Left;
      targetPosition = Position.Right;
      break;
    default:
      sourcePosition = Position.Bottom;
      targetPosition = Position.Top;
  }

  // Apply positions to nodes
  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = g.node(node.id);

    return {
      ...node,
      sourcePosition,
      targetPosition,
      // Convert dagre center-center positioning to React Flow top-left
      position: {
        x: nodeWithPosition.x - nodeWidth / 2,
        y: nodeWithPosition.y - nodeHeight / 2,
      },
    };
  });

  return {
    nodes: layoutedNodes,
    edges,
  };
}

/**
 * Check if nodes have valid saved positions
 */
export function hasValidPositions(nodes: Node[]): boolean {
  if (nodes.length === 0) return false;
  
  return nodes.some(node => 
    node.position && 
    (node.position.x !== 0 || node.position.y !== 0)
  );
}

/**
 * Detect and fix overlapping nodes (post-processing)
 */
export function fixNodeOverlaps(nodes: Node[], nodeWidth: number, nodeHeight: number): Node[] {
  const padding = 20; // Minimum padding between nodes
  const fixedNodes = [...nodes];

  for (let i = 0; i < fixedNodes.length; i++) {
    for (let j = i + 1; j < fixedNodes.length; j++) {
      const node1 = fixedNodes[i];
      const node2 = fixedNodes[j];

      // Calculate bounding boxes
      const box1 = {
        x1: node1.position.x,
        y1: node1.position.y,
        x2: node1.position.x + nodeWidth,
        y2: node1.position.y + nodeHeight,
      };

      const box2 = {
        x1: node2.position.x,
        y1: node2.position.y,
        x2: node2.position.x + nodeWidth,
        y2: node2.position.y + nodeHeight,
      };

      // Check for overlap
      if (
        box1.x1 < box2.x2 + padding &&
        box1.x2 + padding > box2.x1 &&
        box1.y1 < box2.y2 + padding &&
        box1.y2 + padding > box2.y1
      ) {
        // Nodes overlap - push node2 to the right
        const overlapX = (box1.x2 + padding) - box2.x1;
        fixedNodes[j] = {
          ...node2,
          position: {
            x: node2.position.x + overlapX,
            y: node2.position.y,
          },
        };
      }
    }
  }

  return fixedNodes;
}
