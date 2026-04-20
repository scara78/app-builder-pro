/**
 * E2E Test Fixture - Auth + Posts
 * Scenario 2: Auth detection with Posts entity and relationships
 */

export const AUTH_POSTS_CODE = `import React, { useState, createContext, useContext } from 'react';

interface User {
  id: string;
  email: string;
}

interface Post {
  id: string;
  title: string;
  content: string;
  authorId: string;
}

// Auth Context
interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  const login = (email: string, password: string) => {
    setUser({ id: '123', email });
  };

  const logout = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

// Post List Component
export const PostList = () => {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);

  const handleCreate = (post: Omit<Post, 'id'>) => {
    const newPost: Post = {
      ...post,
      id: Date.now().toString(),
    };
    setPosts([...posts, newPost]);
  };

  const handleDelete = (postId: string) => {
    setPosts(posts.filter(p => p.id !== postId));
  };

  const handleUpdate = (postId: string, updates: Partial<Post>) => {
    setPosts(posts.map(p => p.id === postId ? { ...p, ...updates } : p));
  };

  return (
    <div className="post-list">
      {posts.map(post => (
        <article key={post.id}>
          <h3>{post.title}</h3>
          <p>{post.content}</p>
          <small>Author: {post.authorId}</small>
          {user && post.authorId === user.id && (
            <button onClick={() => handleDelete(post.id)}>Delete</button>
          )}
        </article>
      ))}
    </div>
  );
};

// Login/Register Components
export const Login = () => {
  const { login } = useAuth();
  return (
    <form onSubmit={(e) => { e.preventDefault(); login('test@test.com', 'password'); }}>
      <input type="email" placeholder="Email" />
      <input type="password" placeholder="Password" />
      <button type="submit">Login</button>
    </form>
  );
};

export const Register = () => {
  return (
    <form onSubmit={(e) => e.preventDefault()}>
      <input type="text" placeholder="Name" />
      <input type="email" placeholder="Email" />
      <input type="password" placeholder="Password" />
      <button type="submit">Register</button>
    </form>
  );
};
`;

export default AUTH_POSTS_CODE;
