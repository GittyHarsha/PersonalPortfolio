import { useState, useMemo, useCallback, memo } from 'react';
import { Paper } from '../../types';
import { PaperListItem } from './PaperListItem';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../ui/collapsible';
import { Button } from '../ui/button';
import { cn } from '../../lib/utils';
import { ChevronDown, Plus } from 'lucide-react';

interface PaperForestProps {
  papers: Paper[];
  onEditPaper: (paper: Paper) => void;
  onDeletePaper: (paper: Paper) => void;
  onManageDependencies: (paper: Paper) => void;
  onAddPaper: () => void;
}

interface LevelGroup {
  level: number;
  papers: Paper[];
}

// Build topological levels - papers grouped by their depth in the dependency graph
function buildTopologicalLevels(papers: Paper[]): LevelGroup[] {
  const paperMap = new Map<string, Paper>();
  papers.forEach(p => paperMap.set(p.id, p));

  const levels = new Map<string, number>();
  const visited = new Set<string>();

  // Calculate level for each paper (max depth of dependencies + 1)
  function getLevel(paperId: string, visiting: Set<string>): number {
    if (levels.has(paperId)) return levels.get(paperId)!;
    if (visiting.has(paperId)) return 0; // Cycle detected, treat as level 0
    
    const paper = paperMap.get(paperId);
    if (!paper) return 0;

    visiting.add(paperId);
    
    // Get dependencies that exist in current paper list
    const deps = paper.dependencies.filter(depId => paperMap.has(depId));
    
    if (deps.length === 0) {
      levels.set(paperId, 0);
    } else {
      const maxDepLevel = Math.max(...deps.map(depId => getLevel(depId, visiting)));
      levels.set(paperId, maxDepLevel + 1);
    }
    
    visiting.delete(paperId);
    visited.add(paperId);
    return levels.get(paperId)!;
  }

  // Calculate levels for all papers
  papers.forEach(p => getLevel(p.id, new Set()));

  // Group papers by level
  const levelGroups = new Map<number, Paper[]>();
  papers.forEach(paper => {
    const level = levels.get(paper.id) || 0;
    if (!levelGroups.has(level)) {
      levelGroups.set(level, []);
    }
    levelGroups.get(level)!.push(paper);
  });

  // Convert to sorted array
  const result: LevelGroup[] = [];
  const maxLevel = Math.max(...Array.from(levelGroups.keys()), 0);
  
  for (let i = 0; i <= maxLevel; i++) {
    if (levelGroups.has(i)) {
      result.push({
        level: i,
        papers: levelGroups.get(i)!.sort((a, b) => a.title.localeCompare(b.title))
      });
    }
  }

  return result;
}

// Pre-compute dependent counts for all papers
function buildDependentCounts(papers: Paper[]): Map<string, number> {
  const counts = new Map<string, number>();
  papers.forEach(p => counts.set(p.id, 0));
  
  papers.forEach(paper => {
    paper.dependencies.forEach(depId => {
      counts.set(depId, (counts.get(depId) || 0) + 1);
    });
  });
  
  return counts;
}

interface LevelSectionProps {
  group: LevelGroup;
  dependentCounts: Map<string, number>;
  isExpanded: boolean;
  onToggle: () => void;
  onEditPaper: (paper: Paper) => void;
  onDeletePaper: (paper: Paper) => void;
  onManageDependencies: (paper: Paper) => void;
}

const LevelSection = memo(function LevelSection({
  group,
  dependentCounts,
  isExpanded,
  onToggle,
  onEditPaper,
  onDeletePaper,
  onManageDependencies,
}: LevelSectionProps) {
  const label = group.level === 0 ? 'Foundations' : `Level ${group.level}`;
  
  return (
    <Collapsible open={isExpanded} onOpenChange={onToggle}>
      <CollapsibleTrigger asChild>
        <button className="w-full flex items-center gap-3 px-4 py-2.5 bg-gradient-to-r from-purple-50 to-indigo-50 hover:from-purple-100 hover:to-indigo-100 rounded-xl border border-purple-100 transition-colors">
          <span className="font-semibold text-slate-800">{label}</span>
          <span className="px-2 py-0.5 bg-white rounded-lg text-sm font-medium text-purple-600 border border-purple-200">
            {group.papers.length}
          </span>
          <div className="flex-1" />
          <ChevronDown className={cn(
            "size-5 text-purple-400 transition-transform",
            isExpanded && "rotate-180"
          )} />
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="mt-2 space-y-0.5 pl-2">
          {group.papers.map(paper => (
            <PaperListItem
              key={paper.id}
              paper={paper}
              dependentCount={dependentCounts.get(paper.id) || 0}
              onEdit={onEditPaper}
              onDelete={onDeletePaper}
              onManageDependencies={onManageDependencies}
            />
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
});

export function PaperForest({
  papers,
  onEditPaper,
  onDeletePaper,
  onManageDependencies,
  onAddPaper,
}: PaperForestProps) {
  const [expandedLevels, setExpandedLevels] = useState<Set<number>>(() => {
    // Start with all levels expanded
    return new Set([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
  });

  const levels = useMemo(() => buildTopologicalLevels(papers), [papers]);
  const dependentCounts = useMemo(() => buildDependentCounts(papers), [papers]);

  const toggleLevel = useCallback((level: number) => {
    setExpandedLevels(prev => {
      const next = new Set(prev);
      if (next.has(level)) {
        next.delete(level);
      } else {
        next.add(level);
      }
      return next;
    });
  }, []);

  if (papers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-20 h-20 mb-6 rounded-2xl bg-gradient-to-br from-purple-100 to-indigo-100 flex items-center justify-center">
          <svg className="size-10 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-slate-700 mb-2">No papers yet</h3>
        <p className="text-slate-500 mb-6">Start building your research knowledge graph</p>
        <Button 
          onClick={onAddPaper}
          className="bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white shadow-lg shadow-purple-200"
        >
          <Plus className="size-4 mr-2" />
          Add your first paper
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {levels.map(group => (
        <LevelSection
          key={group.level}
          group={group}
          dependentCounts={dependentCounts}
          isExpanded={expandedLevels.has(group.level)}
          onToggle={() => toggleLevel(group.level)}
          onEditPaper={onEditPaper}
          onDeletePaper={onDeletePaper}
          onManageDependencies={onManageDependencies}
        />
      ))}
    </div>
  );
}
