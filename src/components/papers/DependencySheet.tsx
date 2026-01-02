import { useState, useMemo } from 'react';
import { Paper } from '../../types';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '../ui/sheet';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { ScrollArea } from '../ui/scroll-area';
import { X, ArrowRight, ArrowLeft, Search } from 'lucide-react';

interface DependencySheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  paper: Paper | null;
  allPapers: Paper[];
  onUpdateDependencies: (paperId: string, dependencies: string[]) => void;
}

export function DependencySheet({
  open,
  onOpenChange,
  paper,
  allPapers,
  onUpdateDependencies,
}: DependencySheetProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [localDependencies, setLocalDependencies] = useState<string[]>([]);

  // Sync local state when paper changes - use useEffect pattern with useMemo
  const paperId = paper?.id;
  const paperDeps = paper?.dependencies;
  
  useMemo(() => {
    if (paperId && paperDeps) {
      setLocalDependencies(paperDeps);
    }
  }, [paperId, paperDeps]);

  // Papers that this paper depends on (prerequisites)
  const prerequisites = useMemo(() => {
    if (!paper) return [];
    return allPapers.filter(p => localDependencies.includes(p.id));
  }, [allPapers, localDependencies, paper]);

  // Papers that depend on this paper (dependents)
  const dependents = useMemo(() => {
    if (!paper) return [];
    return allPapers.filter(p => p.dependencies.includes(paper.id));
  }, [allPapers, paper]);

  // Available papers to add as dependencies (excluding self, current deps, and papers that would create cycles)
  const availablePapers = useMemo(() => {
    if (!paper) return [];
    
    const currentDepIds = new Set(localDependencies);
    
    // Simple cycle detection: don't allow adding papers that depend on this paper
    const wouldCreateCycle = (candidateId: string): boolean => {
      const visited = new Set<string>();
      const queue = [candidateId];
      
      while (queue.length > 0) {
        const current = queue.shift()!;
        if (current === paper.id) return true;
        if (visited.has(current)) continue;
        visited.add(current);
        
        const currentPaper = allPapers.find(p => p.id === current);
        if (currentPaper) {
          queue.push(...currentPaper.dependencies);
        }
      }
      return false;
    };

    return allPapers.filter(p => 
      p.id !== paper.id && 
      !currentDepIds.has(p.id) &&
      !wouldCreateCycle(p.id)
    );
  }, [allPapers, paper, localDependencies]);

  // Filter papers based on search
  const filteredPapers = useMemo(() => {
    if (!searchQuery) return availablePapers;
    const query = searchQuery.toLowerCase();
    return availablePapers.filter(p =>
      p.title.toLowerCase().includes(query) ||
      p.authors.toLowerCase().includes(query) ||
      p.year.toString().includes(query)
    );
  }, [availablePapers, searchQuery]);

  // Early return AFTER all hooks
  if (!paper) return null;

  const addDependency = (depId: string) => {
    const newDeps = [...localDependencies, depId];
    setLocalDependencies(newDeps);
    onUpdateDependencies(paper.id, newDeps);
  };

  const removeDependency = (depId: string) => {
    const newDeps = localDependencies.filter(id => id !== depId);
    setLocalDependencies(newDeps);
    onUpdateDependencies(paper.id, newDeps);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle className="pr-8">Manage Dependencies</SheetTitle>
          <SheetDescription className="line-clamp-2">
            {paper.title}
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-6 mt-6 h-[calc(100vh-140px)]">
          {/* Current Prerequisites */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <ArrowLeft className="size-4 text-orange-500" />
              <span>Prerequisites ({prerequisites.length})</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Papers that should be read before this one
            </p>
            <ScrollArea className="h-32 rounded-md border">
              <div className="p-2 space-y-1">
                {prerequisites.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-4">
                    No prerequisites
                  </p>
                ) : (
                  prerequisites.map(dep => (
                    <div
                      key={dep.id}
                      className="flex items-center justify-between gap-2 p-2 rounded-md bg-orange-50 hover:bg-orange-100 transition-colors group"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{dep.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {dep.authors} · {dep.year}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-6 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => removeDependency(dep.id)}
                        title="Remove prerequisite"
                      >
                        <X className="size-3.5 text-destructive" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Dependents (read-only) */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <ArrowRight className="size-4 text-blue-500" />
              <span>Dependents ({dependents.length})</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Papers that require this one as a prerequisite
            </p>
            <ScrollArea className="h-24 rounded-md border bg-muted/30">
              <div className="p-2 space-y-1">
                {dependents.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-4">
                    No dependents
                  </p>
                ) : (
                  dependents.map(dep => (
                    <div
                      key={dep.id}
                      className="flex items-center gap-2 p-2 rounded-md"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-sm truncate">{dep.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {dep.authors} · {dep.year}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Add Dependencies */}
          <div className="flex-1 space-y-2 min-h-0 flex flex-col">
            <div className="text-sm font-medium">Add Prerequisites</div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Search papers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <ScrollArea className="flex-1 rounded-md border">
              <div className="p-2 space-y-1">
                {filteredPapers.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">
                    No papers found
                  </p>
                ) : (
                  filteredPapers.slice(0, 50).map(p => (
                    <button
                      key={p.id}
                      onClick={() => addDependency(p.id)}
                      className="w-full flex items-center justify-between gap-2 p-2 rounded-md hover:bg-purple-50 transition-colors text-left"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{p.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {p.authors} · {p.year}
                        </p>
                      </div>
                      <Badge variant="outline" className="shrink-0 text-xs">
                        {p.status.replace('_', ' ')}
                      </Badge>
                    </button>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
