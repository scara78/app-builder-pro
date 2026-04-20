/**
 * Edge Case Tests
 * CHANGE 6 - Supabase Frontend Adapter
 *
 * Tests for edge cases and special scenarios.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { SupabaseFrontendAdapter } from '../SupabaseFrontendAdapter';
import type { AdapterConfig } from '../types';
import type { BackendRequirements } from '../../analyzer/types';
import {
  SAMPLE_BACKEND_RESULT,
  SAMPLE_REQUIREMENTS_WITH_AUTH,
  SAMPLE_REQUIREMENTS_WITH_ENTITIES,
  SAMPLE_FILES_WITH_EXISTING_SUPABASE,
  SAMPLE_FILES_WITH_AUTH,
} from '../../../__fixtures__/adapter/sample-project';

describe('Edge Cases', () => {
  let adapter: SupabaseFrontendAdapter;

  beforeEach(() => {
    adapter = new SupabaseFrontendAdapter();
  });

  describe('no backend scenario', () => {
    it('should skip when backend result is null', () => {
      const config: AdapterConfig = {
        files: SAMPLE_FILES_WITH_AUTH,
        backendResult: null,
        requirements: SAMPLE_REQUIREMENTS_WITH_AUTH,
      };

      const result = adapter.adapt(config);

      expect(result.skipped).toBe(true);
      expect(result.files).toEqual(SAMPLE_FILES_WITH_AUTH);
      expect(result.injectedFiles).toHaveLength(0);
      expect(result.transformedFiles).toHaveLength(0);
    });

    it('should preserve original files when skipped', () => {
      const originalFiles = [
        { path: 'src/App.tsx', content: 'original content' },
      ];
      const config: AdapterConfig = {
        files: originalFiles,
        backendResult: null,
        requirements: null,
      };

      const result = adapter.adapt(config);

      expect(result.files[0].content).toBe('original content');
    });
  });

  describe('no auth scenario', () => {
    it('should not inject useAuth when hasAuth is false', () => {
      const requirementsNoAuth: BackendRequirements = {
        entities: [],
        hasAuth: false,
        hasStorage: false,
        storageRequirements: [],
        crudOperations: [],
        overallConfidence: 50,
        analysisMethod: 'pattern',
        analyzedAt: '2024-01-01T00:00:00Z',
      };

      const config: AdapterConfig = {
        files: [{ path: 'src/App.tsx', content: 'export default function App() {}' }],
        backendResult: SAMPLE_BACKEND_RESULT,
        requirements: requirementsNoAuth,
      };

      const result = adapter.adapt(config);

      expect(result.skipped).toBe(true);
      expect(result.injectedFiles).not.toContain('src/hooks/useAuth.ts');
    });

    it('should only inject supabase client when no auth but has entities', () => {
      const config: AdapterConfig = {
        files: [{ path: 'src/App.tsx', content: 'interface User { id: string; }' }],
        backendResult: SAMPLE_BACKEND_RESULT,
        requirements: SAMPLE_REQUIREMENTS_WITH_ENTITIES,
      };

      const result = adapter.adapt(config);

      expect(result.injectedFiles).toContain('src/lib/supabase.ts');
      expect(result.injectedFiles).not.toContain('src/hooks/useAuth.ts');
    });
  });

  describe('existing supabase.ts scenario', () => {
    it('should not overwrite existing supabase.ts', () => {
      const config: AdapterConfig = {
        files: SAMPLE_FILES_WITH_EXISTING_SUPABASE,
        backendResult: SAMPLE_BACKEND_RESULT,
        requirements: SAMPLE_REQUIREMENTS_WITH_AUTH,
      };

      const result = adapter.adapt(config);

      const supabaseFile = result.files.find((f) => f.path === 'src/lib/supabase.ts');

      // Should keep original content
      expect(supabaseFile?.content).toContain('existing-project');
      expect(supabaseFile?.content).toContain('getSupabase');

      // Should not inject (already exists)
      expect(result.injectedFiles).not.toContain('src/lib/supabase.ts');
    });

    it('should still inject useAuth if missing and needed', () => {
      const config: AdapterConfig = {
        files: SAMPLE_FILES_WITH_EXISTING_SUPABASE,
        backendResult: SAMPLE_BACKEND_RESULT,
        requirements: SAMPLE_REQUIREMENTS_WITH_AUTH,
      };

      const result = adapter.adapt(config);

      // useAuth should still be injected since it doesn't exist
      expect(result.injectedFiles).toContain('src/hooks/useAuth.ts');
    });
  });

  describe('deeply nested components', () => {
    it('should calculate correct relative paths for 4+ levels deep', () => {
      const deeplyNestedFiles = [
        {
          path: 'src/features/admin/dashboard/users/UserList.tsx',
          content: 'interface User { id: string; name: string; }',
        },
      ];

      const config: AdapterConfig = {
        files: deeplyNestedFiles,
        backendResult: SAMPLE_BACKEND_RESULT,
        requirements: SAMPLE_REQUIREMENTS_WITH_ENTITIES,
      };

      const result = adapter.adapt(config);

      if (result.transformedFiles.includes('src/features/admin/dashboard/users/UserList.tsx')) {
        const userList = result.files.find(
          (f) => f.path === 'src/features/admin/dashboard/users/UserList.tsx'
        );

        // From src/features/admin/dashboard/users to src/lib
        // Path breakdown: src/features/admin/dashboard/users -> features/admin/dashboard/users (4 dirs)
        // To reach src/lib: go up 4 levels to src, then into lib
        // Need: ../../../../lib/supabase (4 ../)
        expect(userList?.content).toContain('../../../../lib/supabase');
      }
    });

    it('should handle sibling directories correctly', () => {
      const siblingFiles = [
        {
          path: 'src/features/auth/Login.tsx',
          content: 'const [user, setUser] = useState(null);',
        },
      ];

      const config: AdapterConfig = {
        files: siblingFiles,
        backendResult: SAMPLE_BACKEND_RESULT,
        requirements: SAMPLE_REQUIREMENTS_WITH_AUTH,
      };

      const result = adapter.adapt(config);

      if (result.transformedFiles.includes('src/features/auth/Login.tsx')) {
        const login = result.files.find((f) => f.path === 'src/features/auth/Login.tsx');

        // From src/features/auth to src/hooks
        // Need: ../../hooks/useAuth
        expect(login?.content).toContain('../../hooks/useAuth');
      }
    });
  });

  describe('skipAdaptation flag', () => {
    it('should skip when skipAdaptation is true', () => {
      const config: AdapterConfig = {
        files: SAMPLE_FILES_WITH_AUTH,
        backendResult: SAMPLE_BACKEND_RESULT,
        requirements: SAMPLE_REQUIREMENTS_WITH_AUTH,
        skipAdaptation: true,
      };

      const result = adapter.adapt(config);

      expect(result.skipped).toBe(true);
      expect(result.reason).toContain('skipAdaptation');
    });

    it('should not process files when skipAdaptation is true', () => {
      const config: AdapterConfig = {
        files: SAMPLE_FILES_WITH_AUTH,
        backendResult: SAMPLE_BACKEND_RESULT,
        requirements: SAMPLE_REQUIREMENTS_WITH_AUTH,
        skipAdaptation: true,
      };

      const result = adapter.adapt(config);

      expect(result.injectedFiles).toHaveLength(0);
      expect(result.transformedFiles).toHaveLength(0);
    });
  });

  describe('mixed requirements', () => {
    it('should handle auth + entities together', () => {
      const mixedRequirements: BackendRequirements = {
        entities: [
          {
            name: 'Post',
            typeName: 'Post',
            fields: [
              { name: 'id', type: 'string', isOptional: false },
              { name: 'title', type: 'string', isOptional: false },
            ],
            confidence: 90,
            matchType: 'pattern',
          },
        ],
        hasAuth: true,
        authRequirements: [
          { type: 'login', triggerPattern: 'login', confidence: 90 },
        ],
        hasStorage: false,
        storageRequirements: [],
        crudOperations: [],
        overallConfidence: 85,
        analysisMethod: 'pattern',
        analyzedAt: '2024-01-01T00:00:00Z',
      };

      const config: AdapterConfig = {
        files: [
          { path: 'src/App.tsx', content: 'interface Post { id: string; }' },
        ],
        backendResult: SAMPLE_BACKEND_RESULT,
        requirements: mixedRequirements,
      };

      const result = adapter.adapt(config);

      expect(result.injectedFiles).toContain('src/lib/supabase.ts');
      expect(result.injectedFiles).toContain('src/hooks/useAuth.ts');
    });

    it('should handle storage + entities together', () => {
      const mixedRequirements: BackendRequirements = {
        entities: [
          {
            name: 'File',
            typeName: 'File',
            fields: [
              { name: 'id', type: 'string', isOptional: false },
              { name: 'url', type: 'string', isOptional: false },
            ],
            confidence: 90,
            matchType: 'pattern',
          },
        ],
        hasAuth: false,
        hasStorage: true,
        storageRequirements: [
          { contentType: 'image', triggerPattern: 'upload', confidence: 90 },
        ],
        crudOperations: [],
        overallConfidence: 85,
        analysisMethod: 'pattern',
        analyzedAt: '2024-01-01T00:00:00Z',
      };

      const config: AdapterConfig = {
        files: [
          { path: 'src/App.tsx', content: 'interface File { url: string; }' },
        ],
        backendResult: SAMPLE_BACKEND_RESULT,
        requirements: mixedRequirements,
      };

      const result = adapter.adapt(config);

      expect(result.skipped).toBe(false);
      expect(result.injectedFiles).toContain('src/lib/supabase.ts');
    });
  });

  describe('empty and minimal files', () => {
    it('should handle empty files array', () => {
      const config: AdapterConfig = {
        files: [],
        backendResult: SAMPLE_BACKEND_RESULT,
        requirements: SAMPLE_REQUIREMENTS_WITH_AUTH,
      };

      const result = adapter.adapt(config);

      expect(result.skipped).toBe(false);
      // Should still inject files
      expect(result.files.length).toBeGreaterThan(0);
    });

    it('should handle file with empty content', () => {
      const config: AdapterConfig = {
        files: [{ path: 'src/empty.ts', content: '' }],
        backendResult: SAMPLE_BACKEND_RESULT,
        requirements: SAMPLE_REQUIREMENTS_WITH_ENTITIES,
      };

      const result = adapter.adapt(config);

      // Should not crash
      expect(result).toBeDefined();
    });

    it('should handle file with only whitespace', () => {
      const config: AdapterConfig = {
        files: [{ path: 'src/whitespace.ts', content: '   \n\t\n   ' }],
        backendResult: SAMPLE_BACKEND_RESULT,
        requirements: SAMPLE_REQUIREMENTS_WITH_ENTITIES,
      };

      const result = adapter.adapt(config);

      expect(result).toBeDefined();
    });
  });

  describe('special characters in content', () => {
    it('should handle template literals in file content', () => {
      const config: AdapterConfig = {
        files: [
          {
            path: 'src/utils.ts',
            content: `const query = \`SELECT * FROM users WHERE id = \${userId}\`;`,
          },
        ],
        backendResult: SAMPLE_BACKEND_RESULT,
        requirements: SAMPLE_REQUIREMENTS_WITH_ENTITIES,
      };

      const result = adapter.adapt(config);

      // Should not crash with template literals
      expect(result).toBeDefined();
    });

    it('should handle special regex characters in content', () => {
      const config: AdapterConfig = {
        files: [
          {
            path: 'src/regex.ts',
            content: `const pattern = /[a-z]+\\.test\\(\\)/;`,
          },
        ],
        backendResult: SAMPLE_BACKEND_RESULT,
        requirements: SAMPLE_REQUIREMENTS_WITH_ENTITIES,
      };

      const result = adapter.adapt(config);

      expect(result).toBeDefined();
    });
  });
});
