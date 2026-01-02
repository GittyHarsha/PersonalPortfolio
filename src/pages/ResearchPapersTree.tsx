import { useState, useEffect, useCallback, useMemo } from 'react';
import { PaperForest, DependencySheet, PaperFormSheet } from '../components/papers';
import { ScrollArea } from '../components/ui/scroll-area';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import { isDevelopment } from '../utils/environment';
import type { AppData, Paper, PaperStatus } from '../types';
import { Search, Plus, Download, RefreshCw, Home } from 'lucide-react';
import './ResearchPapers.css';

// Debounce hook for search
function useDebouncedValue<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);
  
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  
  return debouncedValue;
}

export function ResearchPapers() {
  const [data, setData] = useState<AppData | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState('');
  const searchQuery = useDebouncedValue(searchInput, 150);
  const [statusFilter, setStatusFilter] = useState<PaperStatus | 'all'>('all');
  const isDev = isDevelopment();

  // Sheet states
  const [editingPaper, setEditingPaper] = useState<Paper | null>(null);
  const [isAddingPaper, setIsAddingPaper] = useState(false);
  const [dependencyPaper, setDependencyPaper] = useState<Paper | null>(null);
  const [deleteConfirmPaper, setDeleteConfirmPaper] = useState<Paper | null>(null);

  // Track if initial load is complete (to prevent auto-save on first load)
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Auto-save to papers.json via API whenever data changes (dev mode only)
  useEffect(() => {
    if (isDev && data && !isInitialLoad) {
      fetch('http://localhost:3001/api/papers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })
        .then((res) => {
          if (res.ok) {
            console.log('✅ Auto-saved to papers.json');
          } else {
            console.error('❌ Failed to save:', res.statusText);
          }
        })
        .catch((err) => {
          console.error('❌ Error saving to papers.json:', err.message);
          console.log('⚠️ Make sure to run: npm run dev:all');
        });
    }
  }, [data, isDev, isInitialLoad]);

  // Load papers data
  useEffect(() => {
    fetch('/papers.json')
      .then((res) => res.json())
      .then((jsonData: AppData) => {
        setData(jsonData);
        setLoading(false);
        // Mark initial load complete after a short delay
        setTimeout(() => {
          setIsInitialLoad(false);
        }, 500);
      })
      .catch((err) => {
        console.error('Failed to load papers:', err);
        setLoading(false);
      });
  }, []);

  // Filter papers based on search and status
  const filteredPapers = useMemo(() => {
    if (!data) return [];
    
    let papers = data.papers;

    // Status filter
    if (statusFilter !== 'all') {
      papers = papers.filter(p => p.status === statusFilter);
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      papers = papers.filter(p =>
        p.title.toLowerCase().includes(query) ||
        p.authors.toLowerCase().includes(query) ||
        p.description?.toLowerCase().includes(query) ||
        p.tags?.some(t => t.toLowerCase().includes(query)) ||
        p.venue?.toLowerCase().includes(query)
      );
    }

    return papers;
  }, [data, searchQuery, statusFilter]);

  // Stats
  const stats = useMemo(() => {
    if (!data) return { total: 0, completed: 0, reading: 0, toRead: 0 };
    return {
      total: data.papers.length,
      completed: data.papers.filter((p) => p.status === 'completed').length,
      reading: data.papers.filter((p) => p.status === 'reading').length,
      toRead: data.papers.filter((p) => p.status === 'to_read').length,
    };
  }, [data]);

  // Handlers
  const handleAddPaper = useCallback(() => {
    setEditingPaper(null);
    setIsAddingPaper(true);
  }, []);

  const handleEditPaper = useCallback((paper: Paper) => {
    setEditingPaper(paper);
    setIsAddingPaper(true);
  }, []);

  const handleDeletePaper = useCallback((paper: Paper) => {
    setDeleteConfirmPaper(paper);
  }, []);

  const confirmDelete = useCallback(() => {
    if (!deleteConfirmPaper || !data) return;

    // Remove paper and clean up references
    const updatedPapers = data.papers
      .filter(p => p.id !== deleteConfirmPaper.id)
      .map(p => ({
        ...p,
        dependencies: p.dependencies.filter(dep => dep !== deleteConfirmPaper.id)
      }));

    setData({
      ...data,
      papers: updatedPapers,
    });

    setDeleteConfirmPaper(null);
  }, [deleteConfirmPaper, data]);

  const handleManageDependencies = useCallback((paper: Paper) => {
    setDependencyPaper(paper);
  }, []);

  const handleSavePaper = useCallback((paperData: Partial<Paper> & { id?: string }) => {
    if (!data) return;

    const now = new Date().toISOString();

    if (paperData.id) {
      // Editing existing paper
      const updatedPapers = data.papers.map(p => {
        if (p.id === paperData.id) {
          return {
            ...p,
            ...paperData,
            updatedAt: now,
          } as Paper;
        }
        return p;
      });

      setData({
        ...data,
        papers: updatedPapers,
      });
    } else {
      // Adding new paper
      const newPaper: Paper = {
        id: `paper-${Date.now()}`,
        title: paperData.title || 'Untitled',
        authors: paperData.authors || '',
        year: paperData.year || new Date().getFullYear(),
        venue: paperData.venue || '',
        status: paperData.status || 'to_read',
        priority: paperData.priority || 'MED',
        dependencies: paperData.dependencies || [],
        topicId: paperData.topicId,
        url: paperData.url,
        description: paperData.description,
        tags: paperData.tags,
        createdAt: now,
        updatedAt: now,
      };

      setData({
        ...data,
        papers: [...data.papers, newPaper],
      });
    }

    setIsAddingPaper(false);
    setEditingPaper(null);
  }, [data]);

  const handleUpdateDependencies = useCallback((paperId: string, dependencies: string[]) => {
    if (!data) return;

    const updatedPapers = data.papers.map(p => {
      if (p.id === paperId) {
        return {
          ...p,
          dependencies,
          updatedAt: new Date().toISOString(),
        };
      }
      return p;
    });

    setData({
      ...data,
      papers: updatedPapers,
    });
  }, [data]);

  const handleExport = useCallback(() => {
    if (!data) return;

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'papers.json';
    a.click();
    URL.revokeObjectURL(url);
  }, [data]);

  const handleReset = useCallback(() => {
    if (confirm('⚠️ Reload papers.json from disk? Unsaved changes will be lost.')) {
      window.location.reload();
    }
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-indigo-50/50">
        <div className="w-16 h-16 mb-4 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center animate-pulse">
          <svg className="size-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        </div>
        <div className="text-lg font-medium text-purple-900">Loading papers...</div>
        <div className="text-sm text-purple-400 mt-1">Building your knowledge tree</div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-slate-50 via-purple-50/30 to-indigo-50/50">
      {/* Header */}
      <header className="bg-gradient-to-r from-indigo-900 via-purple-900 to-violet-900 text-white px-6 py-5 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/10 rounded-xl backdrop-blur-sm">
                <svg className="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">Research Papers</h1>
                <p className="text-purple-200 text-sm">Track your reading progress</p>
              </div>
            </div>
            {isDev && (
              <span className="px-3 py-1 bg-amber-400/90 text-amber-900 text-xs font-semibold rounded-full shadow-sm">
                ⚡ Dev Mode
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {isDev && (
              <>
                <Button size="sm" onClick={() => handleAddPaper()} className="bg-white/10 hover:bg-white/20 border-white/20 text-white">
                  <Plus className="size-4 mr-1.5" />
                  Add Paper
                </Button>
                <Button variant="ghost" size="sm" onClick={handleExport} className="text-white/80 hover:text-white hover:bg-white/10">
                  <Download className="size-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={handleReset} className="text-white/80 hover:text-white hover:bg-white/10">
                  <RefreshCw className="size-4" />
                </Button>
              </>
            )}
            <Button variant="ghost" size="sm" asChild className="text-white/80 hover:text-white hover:bg-white/10">
              <a href="/">
                <Home className="size-4" />
              </a>
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-6 mt-4">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-white/10 rounded-lg backdrop-blur-sm">
            <span className="text-2xl">📚</span>
            <div>
              <div className="text-lg font-bold">{stats.total}</div>
              <div className="text-xs text-purple-200">Total</div>
            </div>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/20 rounded-lg">
            <span className="text-2xl">✅</span>
            <div>
              <div className="text-lg font-bold">{stats.completed}</div>
              <div className="text-xs text-emerald-200">Completed</div>
            </div>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-500/20 rounded-lg">
            <span className="text-2xl">📖</span>
            <div>
              <div className="text-lg font-bold">{stats.reading}</div>
              <div className="text-xs text-blue-200">Reading</div>
            </div>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-500/20 rounded-lg">
            <span className="text-2xl">📋</span>
            <div>
              <div className="text-lg font-bold">{stats.toRead}</div>
              <div className="text-xs text-amber-200">To Read</div>
            </div>
          </div>
        </div>
      </header>

      {/* Filters */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-purple-100 px-6 py-4 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-lg">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-purple-400" />
            <Input
              type="search"
              placeholder="Search papers by title or tags..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-11 h-11 bg-purple-50/50 border-purple-200 focus:border-purple-400 focus:ring-purple-400/20 rounded-xl placeholder:text-purple-300"
            />
          </div>
          <Select
            value={statusFilter}
            onValueChange={(value) => setStatusFilter(value as PaperStatus | 'all')}
          >
            <SelectTrigger className="w-44 h-11 bg-white border-purple-200 rounded-xl">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="all">📑 All Status</SelectItem>
              <SelectItem value="to_read">📋 To Read</SelectItem>
              <SelectItem value="reading">📖 Reading</SelectItem>
              <SelectItem value="completed">✅ Completed</SelectItem>
              <SelectItem value="archived">📦 Archived</SelectItem>
            </SelectContent>
          </Select>
          {searchQuery || statusFilter !== 'all' ? (
            <Badge className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white border-0 px-3 py-1">
              {filteredPapers.length} of {data?.papers.length || 0}
            </Badge>
          ) : null}
        </div>
      </div>

      {/* Main content */}
      <ScrollArea className="flex-1">
        <div className="p-6">
          {data && (
            <PaperForest
              papers={filteredPapers}
              onEditPaper={handleEditPaper}
              onDeletePaper={handleDeletePaper}
              onManageDependencies={handleManageDependencies}
              onAddPaper={() => handleAddPaper()}
            />
          )}
        </div>
      </ScrollArea>

      {/* Paper Form Sheet */}
      <PaperFormSheet
        open={isAddingPaper}
        onOpenChange={setIsAddingPaper}
        paper={editingPaper}
        allPapers={data?.papers || []}
        onSave={handleSavePaper}
      />

      {/* Dependency Sheet */}
      <DependencySheet
        open={dependencyPaper !== null}
        onOpenChange={(open) => !open && setDependencyPaper(null)}
        paper={dependencyPaper}
        allPapers={data?.papers || []}
        onUpdateDependencies={handleUpdateDependencies}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmPaper !== null} onOpenChange={(open) => !open && setDeleteConfirmPaper(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Paper</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{deleteConfirmPaper?.title}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmPaper(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
