/**
 * Sample project fixtures for adapter testing
 * CHANGE 6 - Supabase Frontend Adapter
 */

import type { ProjectFile } from '../../types';
import type { BackendCreationResult } from '../../hooks/backend/pipeline/types';
import type { BackendRequirements } from '../../services/analyzer/types';

/**
 * Sample backend creation result
 */
export const SAMPLE_BACKEND_RESULT: BackendCreationResult = {
  projectUrl: 'https://abc123xyz.supabase.co',
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiYzEyM3h5eiIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNjk3ODI1NjAwLCJleHAiOjIwMTMzODU2MDB9.test-signature',
  projectName: 'test-project',
  migrationName: 'initial_schema',
};

/**
 * Sample backend requirements with auth
 */
export const SAMPLE_REQUIREMENTS_WITH_AUTH: BackendRequirements = {
  entities: [],
  hasAuth: true,
  authRequirements: [
    {
      type: 'login',
      triggerPattern: 'LoginForm',
      confidence: 90,
    },
  ],
  hasStorage: false,
  storageRequirements: [],
  crudOperations: [],
  overallConfidence: 85,
  analysisMethod: 'pattern',
  analyzedAt: '2024-01-01T00:00:00Z',
};

/**
 * Sample backend requirements with entities
 */
export const SAMPLE_REQUIREMENTS_WITH_ENTITIES: BackendRequirements = {
  entities: [
    {
      name: 'User',
      typeName: 'User',
      fields: [
        { name: 'id', type: 'string', isOptional: false },
        { name: 'email', type: 'string', isOptional: false },
        { name: 'name', type: 'string', isOptional: true },
      ],
      confidence: 90,
      matchType: 'pattern',
    },
    {
      name: 'Post',
      typeName: 'Post',
      fields: [
        { name: 'id', type: 'string', isOptional: false },
        { name: 'title', type: 'string', isOptional: false },
        { name: 'content', type: 'string', isOptional: false },
        { name: 'authorId', type: 'string', isOptional: false },
      ],
      confidence: 85,
      matchType: 'pattern',
    },
  ],
  hasAuth: false,
  hasStorage: false,
  storageRequirements: [],
  crudOperations: [],
  overallConfidence: 80,
  analysisMethod: 'pattern',
  analyzedAt: '2024-01-01T00:00:00Z',
};

/**
 * Sample backend requirements with storage
 */
export const SAMPLE_REQUIREMENTS_WITH_STORAGE: BackendRequirements = {
  entities: [],
  hasAuth: false,
  hasStorage: true,
  storageRequirements: [
    {
      contentType: 'image',
      maxSizeMB: 5,
      bucketName: 'images',
      triggerPattern: 'ImageUploader',
      confidence: 90,
    },
  ],
  crudOperations: [],
  overallConfidence: 85,
  analysisMethod: 'pattern',
  analyzedAt: '2024-01-01T00:00:00Z',
};

/**
 * Minimal requirements (no auth, no storage, no entities)
 */
export const SAMPLE_REQUIREMENTS_MINIMAL: BackendRequirements = {
  entities: [],
  hasAuth: false,
  hasStorage: false,
  storageRequirements: [],
  crudOperations: [],
  overallConfidence: 50,
  analysisMethod: 'pattern',
  analyzedAt: '2024-01-01T00:00:00Z',
};

/**
 * Sample project files with auth component
 */
export const SAMPLE_FILES_WITH_AUTH: ProjectFile[] = [
  {
    path: 'src/App.tsx',
    content: `import React from 'react';
import { LoginForm } from './components/LoginForm';

function App() {
  return (
    <div className="app">
      <LoginForm />
    </div>
  );
}

export default App;
`,
  },
  {
    path: 'src/components/LoginForm.tsx',
    content: `import React, { useState } from 'react';

interface LoginCredentials {
  email: string;
  password: string;
}

export const LoginForm = () => {
  const [credentials, setCredentials] = useState<LoginCredentials>({
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Login logic here
    console.log('Logging in with:', credentials);
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="email"
        value={credentials.email}
        onChange={(e) => setCredentials({ ...credentials, email: e.target.value })}
        placeholder="Email"
      />
      <input
        type="password"
        value={credentials.password}
        onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
        placeholder="Password"
      />
      <button type="submit" disabled={loading}>
        {loading ? 'Logging in...' : 'Login'}
      </button>
    </form>
  );
};

export default LoginForm;
`,
  },
];

/**
 * Sample project files with entity components
 */
export const SAMPLE_FILES_WITH_ENTITIES: ProjectFile[] = [
  {
    path: 'src/App.tsx',
    content: `import React from 'react';
import { UserList } from './components/UserList';

function App() {
  return (
    <div className="app">
      <h1>User Management</h1>
      <UserList />
    </div>
  );
}

export default App;
`,
  },
  {
    path: 'src/components/UserList.tsx',
    content: `import React, { useState, useEffect } from 'react';

interface User {
  id: string;
  email: string;
  name?: string;
}

export const UserList = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    // Fetch users from API
    const response = await fetch('/api/users');
    const data = await response.json();
    setUsers(data);
    setLoading(false);
  };

  if (loading) return <div>Loading...</div>;

  return (
    <ul>
      {users.map((user) => (
        <li key={user.id}>
          {user.name || user.email}
        </li>
      ))}
    </ul>
  );
};

export default UserList;
`,
  },
];

/**
 * Sample project files at deeply nested paths
 */
export const SAMPLE_FILES_DEEPLY_NESTED: ProjectFile[] = [
  {
    path: 'src/App.tsx',
    content: `import React from 'react';
import { UserProfile } from './components/pages/profile/UserProfile';

function App() {
  return <UserProfile />;
}

export default App;
`,
  },
  {
    path: 'src/components/pages/profile/UserProfile.tsx',
    content: `import React from 'react';

interface User {
  id: string;
  name: string;
  email: string;
}

export const UserProfile = () => {
  // Component that needs user
  return <div>Profile</div>;
};

export default UserProfile;
`,
  },
];

/**
 * Sample project with existing supabase.ts (should not overwrite)
 */
export const SAMPLE_FILES_WITH_EXISTING_SUPABASE: ProjectFile[] = [
  {
    path: 'src/lib/supabase.ts',
    content: `import { createClient } from '@supabase/supabase-js';

// Custom configuration
export const supabase = createClient(
  'https://existing-project.supabase.co',
  'existing-anon-key'
);

// Custom helper
export const getSupabase = () => supabase;
`,
  },
  {
    path: 'src/App.tsx',
    content: `import React from 'react';

function App() {
  return <div>App</div>;
}

export default App;
`,
  },
];
