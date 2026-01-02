import { useState, useMemo } from 'react';
import { Paper, Topic } from '../../types';
import { PaperListItem } from './PaperListItem';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../ui/collapsible';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { cn } from '../../lib/utils';
import { ChevronRight, FolderOpen, Folder, Plus } from 'lucide-react';

interface TopicTreeProps {
  papers: Paper[];
  topics: Topic[];
  onEditPaper: (paper: Paper) => void;
  onDeletePaper: (paper: Paper) => void;
  onManageDependencies: (paper: Paper) => void;
  onAddPaper: (topicId?: string) => void;
}

interface TopicNode {
  topic: Topic;
  children: TopicNode[];
  papers: Paper[];
}

function buildTopicTree(topics: Topic[], papers: Paper[]): { tree: TopicNode[], uncategorized: Paper[] } {
  const topicMap = new Map<string, TopicNode>();
  
  // Create nodes for all topics
  topics.forEach(topic => {
    topicMap.set(topic.id, {
      topic,
      children: [],
      papers: papers.filter(p => p.topicId === topic.id)
    });
  });

  // Build parent-child relationships
  const rootNodes: TopicNode[] = [];
  topics.forEach(topic => {
    const node = topicMap.get(topic.id)!;
    if (topic.parentId && topicMap.has(topic.parentId)) {
      topicMap.get(topic.parentId)!.children.push(node);
    } else {
      rootNodes.push(node);
    }
  });

  // Find uncategorized papers
  const uncategorized = papers.filter(p => !p.topicId || !topicMap.has(p.topicId));

  return { tree: rootNodes, uncategorized };
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

function countPapersInTopic(node: TopicNode): number {
  return node.papers.length + node.children.reduce((acc, child) => acc + countPapersInTopic(child), 0);
}

interface TopicSectionProps {
  node: TopicNode;
  depth: number;
  dependentCounts: Map<string, number>;
  expandedTopics: Set<string>;
  onToggleTopic: (topicId: string) => void;
  onEditPaper: (paper: Paper) => void;
  onDeletePaper: (paper: Paper) => void;
  onManageDependencies: (paper: Paper) => void;
  onAddPaper: (topicId?: string) => void;
}

function TopicSection({
  node,
  depth,
  dependentCounts,
  expandedTopics,
  onToggleTopic,
  onEditPaper,
  onDeletePaper,
  onManageDependencies,
  onAddPaper
}: TopicSectionProps) {
  const isExpanded = expandedTopics.has(node.topic.id);
  const paperCount = countPapersInTopic(node);

  return (
    <Collapsible open={isExpanded} onOpenChange={() => onToggleTopic(node.topic.id)}>
      <div 
        className="flex items-center gap-2 py-2 px-2 rounded-md hover:bg-accent/30 transition-colors group"
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
      >
        <CollapsibleTrigger asChild>
          <Button variant="ghost" size="icon" className="size-6 shrink-0">
            <ChevronRight 
              className={cn(
                "size-4 transition-transform duration-200",
                isExpanded && "rotate-90"
              )} 
            />
          </Button>
        </CollapsibleTrigger>

        {isExpanded ? (
          <FolderOpen className="size-4 shrink-0" style={{ color: node.topic.color }} />
        ) : (
          <Folder className="size-4 shrink-0" style={{ color: node.topic.color }} />
        )}

        <span className="font-medium text-sm flex-1">{node.topic.name}</span>

        <Badge variant="secondary" className="text-xs">
          {paperCount}
        </Badge>

        <Button
          variant="ghost"
          size="icon"
          className="size-6 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={(e) => {
            e.stopPropagation();
            onAddPaper(node.topic.id);
          }}
          title="Add paper to this topic"
        >
          <Plus className="size-3.5" />
        </Button>
      </div>

      <CollapsibleContent>
        {/* Papers in this topic */}
        <div className="ml-4" style={{ paddingLeft: `${depth * 16}px` }}>
          {node.papers.map(paper => (
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

        {/* Child topics */}
        {node.children.map(child => (
          <TopicSection
            key={child.topic.id}
            node={child}
            depth={depth + 1}
            dependentCounts={dependentCounts}
            expandedTopics={expandedTopics}
            onToggleTopic={onToggleTopic}
            onEditPaper={onEditPaper}
            onDeletePaper={onDeletePaper}
            onManageDependencies={onManageDependencies}
            onAddPaper={onAddPaper}
          />
        ))}
      </CollapsibleContent>
    </Collapsible>
  );
}

export function TopicTree({
  papers,
  topics,
  onEditPaper,
  onDeletePaper,
  onManageDependencies,
  onAddPaper
}: TopicTreeProps) {
  const [expandedTopics, setExpandedTopics] = useState<Set<string>>(() => {
    // Start with all topics expanded
    return new Set(topics.map(t => t.id));
  });

  const { tree, uncategorized } = useMemo(
    () => buildTopicTree(topics, papers),
    [topics, papers]
  );

  const dependentCounts = useMemo(() => buildDependentCounts(papers), [papers]);

  const toggleTopic = (topicId: string) => {
    setExpandedTopics(prev => {
      const next = new Set(prev);
      if (next.has(topicId)) {
        next.delete(topicId);
      } else {
        next.add(topicId);
      }
      return next;
    });
  };

  const [uncategorizedExpanded, setUncategorizedExpanded] = useState(true);

  return (
    <div className="space-y-1">
      {/* Topic sections */}
      {tree.map(node => (
        <TopicSection
          key={node.topic.id}
          node={node}
          depth={0}
          dependentCounts={dependentCounts}
          expandedTopics={expandedTopics}
          onToggleTopic={toggleTopic}
          onEditPaper={onEditPaper}
          onDeletePaper={onDeletePaper}
          onManageDependencies={onManageDependencies}
          onAddPaper={onAddPaper}
        />
      ))}

      {/* Uncategorized papers */}
      {uncategorized.length > 0 && (
        <Collapsible open={uncategorizedExpanded} onOpenChange={setUncategorizedExpanded}>
          <div className="flex items-center gap-2 py-2 px-2 rounded-md hover:bg-accent/30 transition-colors group">
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="icon" className="size-6 shrink-0">
                <ChevronRight 
                  className={cn(
                    "size-4 transition-transform duration-200",
                    uncategorizedExpanded && "rotate-90"
                  )} 
                />
              </Button>
            </CollapsibleTrigger>

            {uncategorizedExpanded ? (
              <FolderOpen className="size-4 shrink-0 text-muted-foreground" />
            ) : (
              <Folder className="size-4 shrink-0 text-muted-foreground" />
            )}

            <span className="font-medium text-sm flex-1 text-muted-foreground">Uncategorized</span>

            <Badge variant="secondary" className="text-xs">
              {uncategorized.length}
            </Badge>

            <Button
              variant="ghost"
              size="icon"
              className="size-6 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={(e) => {
                e.stopPropagation();
                onAddPaper(undefined);
              }}
              title="Add uncategorized paper"
            >
              <Plus className="size-3.5" />
            </Button>
          </div>

          <CollapsibleContent>
            <div className="ml-4">
              {uncategorized.map(paper => (
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
      )}

      {/* Empty state */}
      {papers.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <p>No papers yet.</p>
          <Button 
            variant="outline" 
            className="mt-4"
            onClick={() => onAddPaper(undefined)}
          >
            <Plus className="size-4 mr-2" />
            Add your first paper
          </Button>
        </div>
      )}
    </div>
  );
}
