import React, { useState } from 'react';
import {
  Folder,
  File,
  ChevronRight,
  ChevronDown,
  Plus,
  MoreVertical,
  Loader2,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { type ProjectFile } from '../../types';
import './FileExplorer.css';

interface FileExplorerProps {
  files?: ProjectFile[];
  isLoading?: boolean;
  error?: Error | null;
  onRefresh?: () => void;
}

interface TreeNode {
  name: string;
  type: 'folder' | 'file';
  children?: TreeNode[];
  path?: string;
  content?: string;
}

function buildTree(files: ProjectFile[]): TreeNode[] {
  const root: TreeNode[] = [];

  files.forEach((file) => {
    const parts = file.path.split('/').filter(Boolean);
    let current = root;

    parts.forEach((part, index) => {
      const isLast = index === parts.length - 1;
      const existing = current.find((n) => n.name === part);

      if (existing) {
        if (!isLast) {
          if (!existing.children) existing.children = [];
          current = existing.children;
        }
      } else {
        const newNode: TreeNode = {
          name: part,
          type: isLast ? 'file' : 'folder',
          children: isLast ? undefined : [],
          path: file.path,
          content: file.content,
        };
        current.push(newNode);
        if (!isLast) current = newNode.children!;
      }
    });
  });

  return root;
}

const FileExplorer: React.FC<FileExplorerProps> = ({ files = [], isLoading, error, onRefresh }) => {
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set());
  const tree = buildTree(files);

  const toggleFolder = (path: string) => {
    setExpandedPaths((prev) => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  };

  const renderTree = (
    nodes: TreeNode[],
    depth: number = 0,
    parentPath: string = ''
  ): React.ReactNode => {
    return nodes.map((item) => {
      const fullPath = parentPath ? `${parentPath}/${item.name}` : item.name;
      const isExpanded = expandedPaths.has(fullPath);

      return (
        <div key={fullPath} className="tree-item">
          <div
            className={`item-row ${item.type}`}
            data-testid="item-row"
            data-type={item.type}
            onClick={item.type === 'folder' ? () => toggleFolder(fullPath) : undefined}
            style={item.type === 'folder' ? { cursor: 'pointer' } : undefined}
          >
            {item.type === 'folder' ? (
              <>
                {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                <Folder size={14} className="folder-icon" />
              </>
            ) : (
              <File size={14} className="file-icon" />
            )}
            <span className="item-name" data-testid="item-name">
              {item.name}
            </span>
          </div>

          {item.type === 'folder' && isExpanded && item.children && (
            <div className="tree-children" data-testid="tree-children">
              {renderTree(item.children, depth + 1, fullPath)}
            </div>
          )}
        </div>
      );
    });
  };

  return (
    <div className="file-explorer" data-testid="file-explorer">
      <div className="explorer-header">
        <span>Files</span>
        <div className="explorer-actions">
          <button title="New File">
            <Plus size={14} />
          </button>
          <button title="More">
            <MoreVertical size={14} />
          </button>
        </div>
      </div>

      <div className="file-tree" data-testid="file-tree">
        {isLoading ? (
          <div className="empty-state" data-testid="loading-state">
            <Loader2 size={16} className="spin" /> Loading...
          </div>
        ) : error ? (
          <div className="empty-state" data-testid="error-state">
            <AlertCircle size={16} /> Error reading files: {error.message}
            {onRefresh && (
              <button
                onClick={onRefresh}
                title="Retry"
                data-testid="retry-button"
                className="retry-button"
              >
                <RefreshCw size={12} /> Retry
              </button>
            )}
          </div>
        ) : tree.length > 0 ? (
          renderTree(tree)
        ) : (
          <div className="empty-state">No files</div>
        )}
      </div>
    </div>
  );
};

export default FileExplorer;
