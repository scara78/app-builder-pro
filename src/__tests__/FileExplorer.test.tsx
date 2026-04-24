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
    it('should render a single file', async () => {
      const user = userEvent.setup();
      const files = [{ path: 'src/App.tsx', content: 'export default function App() {}' }];

      render(<FileExplorer files={files} />);

      // Folder is collapsed by default, file not visible until expanded
      expect(screen.getByText('src')).toBeInTheDocument();
      await user.click(screen.getByText('src'));
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

    it('should render nested folder structure', async () => {
      const user = userEvent.setup();
      const files = [
        { path: 'src/components/App.tsx', content: 'export default function App() {}' },
      ];

      render(<FileExplorer files={files} />);

      // Folders are collapsed by default — need to expand to see children
      expect(screen.getByText('src')).toBeInTheDocument();
      expect(screen.queryByText('components')).not.toBeInTheDocument();
      expect(screen.queryByText('App.tsx')).not.toBeInTheDocument();

      // Expand src to reveal children
      await user.click(screen.getByText('src'));
      expect(screen.getByText('components')).toBeInTheDocument();
      expect(screen.queryByText('App.tsx')).not.toBeInTheDocument();

      // Expand components to reveal App.tsx
      await user.click(screen.getByText('components'));
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

    it('should render deeply nested structure', async () => {
      const user = userEvent.setup();
      const files = [
        { path: 'src/hooks/useAuth.ts', content: 'export function useAuth() {}' },
        { path: 'src/utils/helpers/format.ts', content: 'export function format() {}' },
      ];

      render(<FileExplorer files={files} />);

      // src is collapsed by default
      expect(screen.getByText('src')).toBeInTheDocument();

      // Expand src
      await user.click(screen.getByText('src'));
      expect(screen.getByText('hooks')).toBeInTheDocument();
      expect(screen.getByText('utils')).toBeInTheDocument();

      // Expand hooks
      await user.click(screen.getByText('hooks'));
      expect(screen.getByText('useAuth.ts')).toBeInTheDocument();

      // Expand utils then helpers
      await user.click(screen.getByText('utils'));
      expect(screen.getByText('helpers')).toBeInTheDocument();
      await user.click(screen.getByText('helpers'));
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

    it('should render item-name for each node', () => {
      const files = [{ path: 'package.json', content: '{}' }];

      render(<FileExplorer files={files} />);

      const itemName = screen.getByText('package.json');
      expect(itemName).toBeInTheDocument();
      expect(itemName.getAttribute('data-testid')).toBe('item-name');
    });
  });

  // ============ Task 4.1: Folders collapsed by default ============
  describe('folders collapsed by default', () => {
    it('renders folders collapsed - children not visible', () => {
      const files = [{ path: 'src/App.tsx', content: '' }];

      const { container } = render(<FileExplorer files={files} />);

      expect(screen.getByText('src')).toBeInTheDocument();
      expect(screen.queryByText('App.tsx')).not.toBeInTheDocument();
      expect(container.querySelector('[data-testid="tree-children"]')).toBeNull();
    });

    it('renders multiple folders all collapsed', () => {
      const files = [
        { path: 'src/App.tsx', content: '' },
        { path: 'public/index.html', content: '' },
      ];

      const { container } = render(<FileExplorer files={files} />);

      expect(screen.getByText('src')).toBeInTheDocument();
      expect(screen.getByText('public')).toBeInTheDocument();
      expect(screen.queryByText('App.tsx')).not.toBeInTheDocument();
      expect(screen.queryByText('index.html')).not.toBeInTheDocument();
      expect(container.querySelector('[data-testid="tree-children"]')).toBeNull();
    });
  });

  // ============ Task 4.2: Click folder toggles expand ============
  describe('click folder toggles expand', () => {
    it('expands folder on click revealing children', async () => {
      const user = userEvent.setup();
      const files = [{ path: 'src/App.tsx', content: '' }];

      render(<FileExplorer files={files} />);

      expect(screen.queryByText('App.tsx')).not.toBeInTheDocument();

      await user.click(screen.getByText('src'));

      expect(screen.getByText('App.tsx')).toBeInTheDocument();
    });

    it('collapses expanded folder on click', async () => {
      const user = userEvent.setup();
      const files = [{ path: 'src/App.tsx', content: '' }];

      render(<FileExplorer files={files} />);

      await user.click(screen.getByText('src'));
      expect(screen.getByText('App.tsx')).toBeInTheDocument();

      await user.click(screen.getByText('src'));
      expect(screen.queryByText('App.tsx')).not.toBeInTheDocument();
    });
  });

  // ============ Task 4.3: Expanded state persists on re-render ============
  describe('expanded state persists on re-render', () => {
    it('keeps expanded folders after files prop change (simulating refresh)', async () => {
      const user = userEvent.setup();
      const initialFiles = [{ path: 'src/App.tsx', content: '' }];
      const refreshedFiles = [
        { path: 'src/App.tsx', content: '' },
        { path: 'src/utils.ts', content: '' },
      ];

      const { rerender } = render(<FileExplorer files={initialFiles} />);

      await user.click(screen.getByText('src'));
      expect(screen.getByText('App.tsx')).toBeInTheDocument();

      rerender(<FileExplorer files={refreshedFiles} />);

      expect(screen.getByText('App.tsx')).toBeInTheDocument();
      expect(screen.getByText('utils.ts')).toBeInTheDocument();
    });

    it('keeps multiple expanded folders on re-render', async () => {
      const user = userEvent.setup();
      const files = [
        { path: 'src/App.tsx', content: '' },
        { path: 'public/index.html', content: '' },
      ];

      const { rerender } = render(<FileExplorer files={files} />);

      await user.click(screen.getByText('src'));
      await user.click(screen.getByText('public'));

      expect(screen.getByText('App.tsx')).toBeInTheDocument();
      expect(screen.getByText('index.html')).toBeInTheDocument();

      rerender(<FileExplorer files={[...files]} />);

      expect(screen.getByText('App.tsx')).toBeInTheDocument();
      expect(screen.getByText('index.html')).toBeInTheDocument();
    });
  });

  // ============ Task 4.4: Loading and error states ============
  describe('loading and error states', () => {
    it('shows loading state when isLoading=true', () => {
      render(<FileExplorer files={[]} isLoading={true} />);

      expect(screen.getByTestId('loading-state')).toBeInTheDocument();
      expect(screen.getByText(/Loading/i)).toBeInTheDocument();
    });

    it('shows error state with message when error is provided', () => {
      render(<FileExplorer files={[]} error={new Error('Read failed')} />);

      expect(screen.getByTestId('error-state')).toBeInTheDocument();
      expect(screen.getByText(/Error reading files: Read failed/i)).toBeInTheDocument();
    });

    it('shows retry button that calls onRefresh when clicked', async () => {
      const user = userEvent.setup();
      const onRefresh = vi.fn();

      render(<FileExplorer files={[]} error={new Error('Read failed')} onRefresh={onRefresh} />);

      const retryButton = screen.getByTestId('retry-button');
      expect(retryButton).toBeInTheDocument();

      await user.click(retryButton);
      expect(onRefresh).toHaveBeenCalledTimes(1);
    });

    it('does not show retry button when onRefresh is not provided', () => {
      render(<FileExplorer files={[]} error={new Error('Read failed')} />);

      expect(screen.queryByTestId('retry-button')).not.toBeInTheDocument();
    });
  });
});
