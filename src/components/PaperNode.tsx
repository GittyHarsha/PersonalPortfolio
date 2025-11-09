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

const priorityColors: Record<string, string> = {
  HIGH: '#ef4444',
  MED: '#f59e0b',
  LOW: '#10b981',
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
          minWidth: '250px',
          boxShadow: selected
            ? '0 0 0 2px #3b82f6, 0 4px 12px rgba(0,0,0,0.15)'
            : '0 2px 8px rgba(0,0,0,0.1)',
          cursor: 'pointer',
          transition: 'all 0.2s',
        }}
      >
        {/* Priority indicator */}
        <div style={{ display: 'flex', alignItems: 'start', gap: '8px', marginBottom: '8px' }}>
          <div
            style={{
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              background: priorityColors[paper.priority],
              flexShrink: 0,
              marginTop: '2px',
            }}
            title={`${paper.priority} priority`}
          />
          <h3 style={{ fontWeight: 600, fontSize: '14px', margin: 0, flex: 1 }}>
            {paper.title}
          </h3>
        </div>

        {/* Authors */}
        <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px' }}>
          {paper.authors}
        </div>

        {/* Venue and year */}
        <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '8px' }}>
          {paper.venue} ({paper.year})
        </div>

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
          }}
        >
          {statusLabels[paper.status]}
        </div>

        {/* Link to paper */}
        {paper.url && (
          <div style={{ marginTop: '8px' }}>
            <a
              href={paper.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                fontSize: '12px',
                color: '#3b82f6',
                textDecoration: 'none',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              View Paper →
            </a>
          </div>
        )}

        {/* Tags */}
        {paper.tags && paper.tags.length > 0 && (
          <div style={{ display: 'flex', gap: '4px', marginTop: '8px', flexWrap: 'wrap' }}>
            {paper.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                style={{
                  fontSize: '10px',
                  padding: '2px 6px',
                  background: '#f3f4f6',
                  color: '#6b7280',
                  borderRadius: '4px',
                }}
              >
                {tag}
              </span>
            ))}
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

