import React from 'react';
import { Folder, File, ChevronRight, ChevronDown, Plus, MoreVertical } from 'lucide-react';
import { type ProjectFile } from '../../types';
import './FileExplorer.css';

interface FileExplorerProps {
  files?: ProjectFile[];
}

interface TreeNode {
  name: string;
  type: 'folder' | 'file';
  isOpen?: boolean;
  children?: TreeNode[];
  path?: string;
  content?: string;
}

function buildTree(files: ProjectFile[]): TreeNode[] {
  const root: TreeNode[] = [];
  
  files.forEach(file => {
    const parts = file.path.split('/').filter(Boolean);
    let current = root;
    
    parts.forEach((part, index) => {
      const isLast = index === parts.length - 1;
      const existing = current.find(n => n.name === part);
      
      if (existing) {
        if (!isLast) {
          if (!existing.children) existing.children = [];
          current = existing.children;
        }
      } else {
        const newNode: TreeNode = {
          name: part,
          type: isLast ? 'file' : 'folder',
          isOpen: !isLast,
          children: isLast ? undefined : [],
          path: file.path,
          content: file.content
        };
        current.push(newNode);
        if (!isLast) current = newNode.children!;
      }
    });
  });
  
  return root;
}

const FileExplorer: React.FC<FileExplorerProps> = ({ files = [] }) => {
  const tree = buildTree(files);

  const renderTree = (nodes: TreeNode[], depth: number = 0): React.ReactNode => {
    return nodes.map((item, i) => (
      <div key={`${depth}-${i}`} className="tree-item">
        <div className={`item-row ${item.type}`}>
          {item.type === 'folder' ? (
            <>
              {item.isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              <Folder size={14} className="folder-icon" />
            </>
          ) : (
            <File size={14} className="file-icon" />
          )}
          <span className="item-name">{item.name}</span>
        </div>
        
        {item.type === 'folder' && item.isOpen && item.children && (
          <div className="tree-children">
            {renderTree(item.children, depth + 1)}
          </div>
        )}
      </div>
    ));
  };

  return (
    <div className="file-explorer">
      <div className="explorer-header">
        <span>Files</span>
        <div className="explorer-actions">
          <button title="New File"><Plus size={14} /></button>
          <button title="More"><MoreVertical size={14} /></button>
        </div>
      </div>
      
      <div className="file-tree">
        {tree.length > 0 ? (
          renderTree(tree)
        ) : (
          <div className="empty-state">No files</div>
        )}
      </div>
    </div>
  );
};

export default FileExplorer;
