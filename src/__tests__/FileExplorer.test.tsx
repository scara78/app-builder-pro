import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FileExplorer from '../components/editor/FileExplorer';

describe('FileExplorer', () => {
  describe('rendering with empty files', () => {
    it('should render "No files" when files array is empty', () => {
      render(<FileExplorer files={[]} />);

      expect(screen.getByText('No files')).toBeInTheDocument();
    });

    it('should render "No files" when files prop is not provided', () => {
      render(<FileExplorer />);

      expect(screen.getByText('No files')).toBeInTheDocument();
    });
  });

  describe('header rendering', () => {
    it('should render the "Files" header', () => {
      render(<FileExplorer files={[]} />);

      expect(screen.getByText('Files')).toBeInTheDocument();
    });

    it('should render New File button', () => {
      render(<FileExplorer files={[]} />);

      expect(screen.getByTitle('New File')).toBeInTheDocument();
    });

    it('should render More button', () => {
      render(<FileExplorer files={[]} />);

      expect(screen.getByTitle('More')).toBeInTheDocument();
    });
  });

  describe('file tree rendering', () => {
    it('should render a single file', () => {
      const files = [{ path: 'src/App.tsx', content: 'export default function App() {}' }];

      render(<FileExplorer files={files} />);

      expect(screen.getByText('App.tsx')).toBeInTheDocument();
    });

    it('should render multiple files at the same level', () => {
      const files = [
        { path: 'index.html', content: '<html></html>' },
        { path: 'style.css', content: 'body { margin: 0 }' },
        { path: 'main.ts', content: 'console.log("hi")' },
      ];

      render(<FileExplorer files={files} />);

      expect(screen.getByText('index.html')).toBeInTheDocument();
      expect(screen.getByText('style.css')).toBeInTheDocument();
      expect(screen.getByText('main.ts')).toBeInTheDocument();
    });

    it('should render nested folder structure', () => {
      const files = [
        { path: 'src/components/App.tsx', content: 'export default function App() {}' },
      ];

      render(<FileExplorer files={files} />);

      // src is a folder, components is a folder, App.tsx is a file
      expect(screen.getByText('src')).toBeInTheDocument();
      expect(screen.getByText('components')).toBeInTheDocument();
      expect(screen.getByText('App.tsx')).toBeInTheDocument();
    });

    it('should render folder with chevron icon', () => {
      const files = [{ path: 'src/index.ts', content: 'console.log("index")' }];

      const { container } = render(<FileExplorer files={files} />);

      // src should be a folder with item-row folder class
      const folderRow = container.querySelector('[data-testid="item-row"][data-type="folder"]');
      expect(folderRow).not.toBeNull();
    });

    it('should render file with file icon class', () => {
      const files = [{ path: 'README.md', content: '# Hello' }];

      const { container } = render(<FileExplorer files={files} />);

      const fileRow = container.querySelector('[data-testid="item-row"][data-type="file"]');
      expect(fileRow).not.toBeNull();
    });

    it('should render deeply nested structure', () => {
      const files = [
        { path: 'src/hooks/useAuth.ts', content: 'export function useAuth() {}' },
        { path: 'src/utils/helpers/format.ts', content: 'export function format() {}' },
      ];

      render(<FileExplorer files={files} />);

      expect(screen.getByText('src')).toBeInTheDocument();
      expect(screen.getByText('hooks')).toBeInTheDocument();
      expect(screen.getByText('useAuth.ts')).toBeInTheDocument();
      expect(screen.getByText('utils')).toBeInTheDocument();
      expect(screen.getByText('helpers')).toBeInTheDocument();
      expect(screen.getByText('format.ts')).toBeInTheDocument();
    });
  });

  describe('user interactions', () => {
    it('should render the file-explorer container', () => {
      const { container } = render(<FileExplorer files={[]} />);

      expect(container.querySelector('[data-testid="file-explorer"]')).not.toBeNull();
    });

    it('should render the file-tree container', () => {
      const files = [{ path: 'app.tsx', content: 'export default function App() {}' }];

      const { container } = render(<FileExplorer files={files} />);

      expect(container.querySelector('[data-testid="file-tree"]')).not.toBeNull();
    });

    it('should render tree-children for open folders', () => {
      const files = [{ path: 'src/App.tsx', content: 'export default function App() {}' }];

      const { container } = render(<FileExplorer files={files} />);

      // Folders are open by default (isOpen: !isLast, so src is open)
      const treeChildren = container.querySelector('[data-testid="tree-children"]');
      expect(treeChildren).not.toBeNull();
    });

    it('should render item-name for each node', () => {
      const files = [{ path: 'package.json', content: '{}' }];

      render(<FileExplorer files={files} />);

      const itemName = screen.getByText('package.json');
      expect(itemName).toBeInTheDocument();
      expect(itemName.getAttribute('data-testid')).toBe('item-name');
    });
  });
});
