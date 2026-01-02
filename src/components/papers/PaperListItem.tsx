import { memo } from 'react';
import { Paper, PaperStatus } from '../../types';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { cn } from '../../lib/utils';
import { 
  Edit2, 
  Trash2, 
  ExternalLink, 
  GitBranch
} from 'lucide-react';

interface PaperListItemProps {
  paper: Paper;
  dependentCount: number;
  onEdit: (paper: Paper) => void;
  onDelete: (paper: Paper) => void;
  onManageDependencies: (paper: Paper) => void;
}

const statusColors: Record<PaperStatus, string> = {
  to_read: 'bg-gradient-to-r from-amber-400 to-orange-400 text-white border-0',
  reading: 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white border-0',
  completed: 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white border-0',
  archived: 'bg-gradient-to-r from-slate-400 to-gray-400 text-white border-0',
};

const statusLabels: Record<PaperStatus, string> = {
  to_read: 'To Read',
  reading: 'Reading',
  completed: 'Completed',
  archived: 'Archived',
};

export const PaperListItem = memo(function PaperListItem({ 
  paper, 
  dependentCount,
  onEdit, 
  onDelete, 
  onManageDependencies 
}: PaperListItemProps) {
  const dependencyCount = paper.dependencies.length;

  return (
    <div className="group flex items-center gap-3 px-4 py-2.5 rounded-xl hover:bg-purple-50/80 transition-colors border border-transparent hover:border-purple-100">
      {/* Main content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-sm text-slate-800 truncate" title={paper.title}>
            {paper.title}
          </span>
          {paper.url && (
            <a 
              href={paper.url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-slate-400 hover:text-purple-600 shrink-0"
              onClick={(e) => e.stopPropagation()}
            >
              <ExternalLink className="size-3" />
            </a>
          )}
        </div>
      </div>

      {/* Status badge */}
      <Badge 
        variant="outline" 
        className={cn("shrink-0 text-xs px-2 py-0.5", statusColors[paper.status])}
      >
        {statusLabels[paper.status]}
      </Badge>

      {/* Dependencies button */}
      <Button
        variant="ghost"
        size="sm"
        className="h-7 px-2 shrink-0 bg-slate-50 hover:bg-purple-100 rounded-lg border border-slate-200"
        onClick={(e) => {
          e.stopPropagation();
          onManageDependencies(paper);
        }}
        title={`${dependencyCount} prerequisites, ${dependentCount} dependents`}
      >
        <GitBranch className="size-3.5 text-purple-500" />
        <span className="text-xs font-medium ml-1">
          {dependencyCount > 0 && <span className="text-orange-500">{dependencyCount}</span>}
          {dependencyCount > 0 && dependentCount > 0 && <span className="text-slate-400 mx-0.5">/</span>}
          {dependentCount > 0 && <span className="text-indigo-500">{dependentCount}</span>}
          {dependencyCount === 0 && dependentCount === 0 && <span className="text-slate-400">0</span>}
        </span>
      </Button>

      {/* Action buttons - visible on hover */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          variant="ghost"
          size="icon"
          className="size-7 hover:bg-purple-100 rounded-lg"
          onClick={(e) => {
            e.stopPropagation();
            onEdit(paper);
          }}
          title="Edit paper"
        >
          <Edit2 className="size-3.5 text-purple-500" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="size-7 hover:bg-red-50 rounded-lg text-red-400 hover:text-red-500"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(paper);
          }}
          title="Delete paper"
        >
          <Trash2 className="size-3.5" />
        </Button>
      </div>
    </div>
  );
});
