import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Paper } from '../types';

interface PaperNodeProps {
  data: {
    paper: Paper;
  };
  selected?: boolean;
}

const statusColors: Record<string, { bg: string; border: string; text: string }> = {
  completed: { bg: '#f0fdf4', border: '#10b981', text: '#065f46' },
  reading: { bg: '#eff6ff', border: '#3b82f6', text: '#1e40af' },
  to_read: { bg: '#ffffff', border: '#d1d5db', text: '#374151' },
  archived: { bg: '#f9fafb', border: '#9ca3af', text: '#4b5563' },
};

const statusLabels: Record<string, string> = {
  completed: '✓ Completed',
  reading: '📖 Reading',
  to_read: '📋 To Read',
  archived: '🗄️ Archived',
};

export const PaperNode = memo(({ data, selected }: PaperNodeProps) => {
  const { paper } = data;
  const colors = statusColors[paper.status] || statusColors.to_read;

  return (
    <div className="paper-node relative">
      {/* Top handle for incoming dependencies */}
      <Handle
        type="target"
        position={Position.Top}
        style={{
          background: '#3b82f6',
          border: '2px solid white',
          width: 12,
          height: 12,
        }}
      />

      <div
        style={{
          background: colors.bg,
          border: `2px solid ${colors.border}`,
          borderRadius: '8px',
          padding: '16px',
          width: '280px',
          height: '180px',
          boxShadow: selected
            ? '0 0 0 2px #3b82f6, 0 4px 12px rgba(0,0,0,0.15)'
            : '0 2px 8px rgba(0,0,0,0.1)',
          cursor: 'pointer',
          transition: 'all 0.2s',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Title */}
        <h3
          style={{
            fontWeight: 600,
            fontSize: '14px',
            margin: 0,
            marginBottom: '12px',
            lineHeight: '1.4',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
            wordBreak: 'break-word',
          }}
        >
          {paper.title}
        </h3>

        {/* Status badge */}
        <div
          style={{
            display: 'inline-block',
            padding: '2px 8px',
            borderRadius: '4px',
            fontSize: '11px',
            background: colors.bg,
            color: colors.text,
            border: `1px solid ${colors.border}`,
            marginBottom: paper.url ? '8px' : 0,
            alignSelf: 'flex-start',
          }}
        >
          {statusLabels[paper.status]}
        </div>

        {/* Link to paper */}
        {paper.url && (
          <div style={{ marginTop: 'auto' }}>
            <a
              href={paper.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                fontSize: '12px',
                color: '#3b82f6',
                textDecoration: 'none',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                display: 'block',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              View Paper →
            </a>
          </div>
        )}
      </div>

      {/* Bottom handle for outgoing dependencies */}
      <Handle
        type="source"
        position={Position.Bottom}
        style={{
          background: '#3b82f6',
          border: '2px solid white',
          width: 12,
          height: 12,
        }}
      />
    </div>
  );
});

PaperNode.displayName = 'PaperNode';

