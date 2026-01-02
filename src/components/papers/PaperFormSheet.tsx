import { useState, useEffect, useMemo } from 'react';
import { Paper, PaperStatus } from '../../types';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '../ui/sheet';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { ScrollArea } from '../ui/scroll-area';
import { Badge } from '../ui/badge';
import { X, Search } from 'lucide-react';

interface PaperFormSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  paper: Paper | null; // null for new paper
  allPapers?: Paper[];
  onSave: (paper: Partial<Paper> & { id?: string }) => void;
}

const emptyPaper: Omit<Paper, 'id' | 'createdAt' | 'updatedAt'> = {
  title: '',
  authors: '',
  year: new Date().getFullYear(),
  url: '',
  description: '',
  status: 'to_read',
  priority: 'MED',
  dependencies: [],
  topicId: undefined,
  tags: [],
  venue: '',
};

export function PaperFormSheet({
  open,
  onOpenChange,
  paper,
  allPapers = [],
  onSave,
}: PaperFormSheetProps) {
  const [formData, setFormData] = useState<Omit<Paper, 'id' | 'createdAt' | 'updatedAt'>>(emptyPaper);
  const [tagsInput, setTagsInput] = useState('');
  const [prereqSearch, setPrereqSearch] = useState('');

  const isEditing = paper !== null;

  // Reset form when paper changes
  useEffect(() => {
    if (paper) {
      setFormData({
        title: paper.title,
        authors: paper.authors,
        year: paper.year,
        url: paper.url || '',
        description: paper.description || '',
        status: paper.status,
        priority: paper.priority,
        dependencies: paper.dependencies,
        topicId: paper.topicId,
        tags: paper.tags || [],
        venue: paper.venue || '',
      });
      setTagsInput(paper.tags?.join(', ') || '');
    } else {
      setFormData({
        ...emptyPaper,
      });
      setTagsInput('');
    }
    setPrereqSearch('');
  }, [paper, open]);

  // Available papers for prerequisites (exclude self)
  const availablePrereqs = useMemo(() => {
    const currentId = paper?.id;
    return allPapers.filter(p => p.id !== currentId);
  }, [allPapers, paper?.id]);

  // Filtered prerequisites based on search
  const filteredPrereqs = useMemo(() => {
    if (!prereqSearch.trim()) return availablePrereqs;
    const query = prereqSearch.toLowerCase();
    return availablePrereqs.filter(p => p.title.toLowerCase().includes(query));
  }, [availablePrereqs, prereqSearch]);

  // Currently selected prerequisites
  const selectedPrereqs = useMemo(() => {
    return allPapers.filter(p => formData.dependencies.includes(p.id));
  }, [allPapers, formData.dependencies]);

  const addPrerequisite = (prereqId: string) => {
    if (!formData.dependencies.includes(prereqId)) {
      setFormData(prev => ({
        ...prev,
        dependencies: [...prev.dependencies, prereqId]
      }));
    }
    setPrereqSearch('');
  };

  const removePrerequisite = (prereqId: string) => {
    setFormData(prev => ({
      ...prev,
      dependencies: prev.dependencies.filter(id => id !== prereqId)
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const tags = tagsInput
      .split(',')
      .map(t => t.trim())
      .filter(t => t.length > 0);

    const paperData: Partial<Paper> & { id?: string } = {
      ...formData,
      tags,
      ...(paper ? { id: paper.id } : {}),
    };

    onSave(paperData);
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-lg">
        <form onSubmit={handleSubmit} className="flex flex-col h-full">
          <SheetHeader>
            <SheetTitle>{isEditing ? 'Edit Paper' : 'Add New Paper'}</SheetTitle>
            <SheetDescription>
              {isEditing 
                ? 'Update the paper details below.' 
                : 'Fill in the details for your new paper.'}
            </SheetDescription>
          </SheetHeader>

          <ScrollArea className="flex-1 pr-4 mt-6 overflow-auto" style={{ maxHeight: 'calc(100vh - 280px)' }}>
            <div className="space-y-5 pb-4">
              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title" className="text-sm font-medium">Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Paper title"
                  required
                  className="h-11 rounded-xl border-purple-200 focus:border-purple-400"
                />
              </div>

              {/* URL */}
              <div className="space-y-2">
                <Label htmlFor="url" className="text-sm font-medium">URL</Label>
                <Input
                  id="url"
                  type="url"
                  value={formData.url}
                  onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
                  placeholder="https://arxiv.org/abs/..."
                  className="h-11 rounded-xl border-purple-200 focus:border-purple-400"
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description" className="text-sm font-medium">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Brief description of the paper"
                  rows={3}
                  className="rounded-xl border-purple-200 focus:border-purple-400"
                />
              </div>

              {/* Prerequisites */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Prerequisites</Label>
                <p className="text-xs text-muted-foreground">Papers you need to read before this one</p>
                
                {/* Selected prerequisites */}
                {selectedPrereqs.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-2">
                    {selectedPrereqs.map(prereq => (
                      <Badge 
                        key={prereq.id} 
                        variant="secondary"
                        className="pl-2 pr-1 py-1 bg-purple-100 text-purple-700 border-purple-200"
                      >
                        <span className="max-w-[200px] truncate">{prereq.title}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="size-5 ml-1 hover:bg-purple-200 rounded-full"
                          onClick={() => removePrerequisite(prereq.id)}
                        >
                          <X className="size-3" />
                        </Button>
                      </Badge>
                    ))}
                  </div>
                )}

                {/* Search for prerequisites */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-purple-400" />
                  <Input
                    value={prereqSearch}
                    onChange={(e) => setPrereqSearch(e.target.value)}
                    placeholder="Search papers..."
                    className="pl-9 h-10 rounded-xl border-purple-200 focus:border-purple-400"
                  />
                </div>

                {/* Available papers list */}
                <div className="border border-purple-200 rounded-xl overflow-hidden bg-white max-h-40 overflow-y-auto">
                  {filteredPrereqs.filter(p => !formData.dependencies.includes(p.id)).length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      {availablePrereqs.length === 0 ? 'No papers available' : 'No matching papers'}
                    </p>
                  ) : (
                    filteredPrereqs
                      .filter(p => !formData.dependencies.includes(p.id))
                      .map(prereq => (
                        <button
                          key={prereq.id}
                          type="button"
                          onClick={() => addPrerequisite(prereq.id)}
                          className="w-full px-3 py-2 text-left text-sm hover:bg-purple-50 border-b border-purple-100 last:border-b-0 transition-colors"
                        >
                          <span className="font-medium text-slate-700">{prereq.title}</span>
                        </button>
                      ))
                  )}
                </div>
              </div>

              {/* Status */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: PaperStatus) => setFormData(prev => ({ ...prev, status: value }))}
                >
                  <SelectTrigger className="w-full h-11 rounded-xl border-purple-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="to_read">📋 To Read</SelectItem>
                    <SelectItem value="reading">📖 Reading</SelectItem>
                    <SelectItem value="completed">✅ Completed</SelectItem>
                    <SelectItem value="archived">📦 Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Tags */}
              <div className="space-y-2">
                <Label htmlFor="tags" className="text-sm font-medium">Tags</Label>
                <Input
                  id="tags"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  placeholder="transformers, attention, nlp"
                  className="h-11 rounded-xl border-purple-200 focus:border-purple-400"
                />
                <p className="text-xs text-muted-foreground">
                  Separate tags with commas
                </p>
              </div>
            </div>
          </ScrollArea>

          <SheetFooter className="mt-4 pt-4 gap-2 border-t border-purple-100 bg-white flex-shrink-0">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="rounded-xl">
              Cancel
            </Button>
            <Button type="submit" className="rounded-xl bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600">
              {isEditing ? 'Save Changes' : 'Add Paper'}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
