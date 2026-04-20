/**
 * Sample React code inputs for testing the analyzer
 * CHANGE 4 - Backend Pipeline Integration
 */

/**
 * Sample code fixtures for pipeline integration tests
 */
export const SAMPLE_CODE = {
  /**
   * Simple entity with id, email, name
   * Used for basic entity detection tests
   */
  simpleEntity: `import React, { useState } from 'react';

interface User {
  id: string;
  email: string;
  name: string;
}

export const UserCard = () => {
  const [user, setUser] = useState<User | null>(null);

  return (
    <div className="user-card">
      {user && (
        <div>
          <h2>{user.name}</h2>
          <p>{user.email}</p>
        </div>
      )}
    </div>
  );
};

export default UserCard;
`,

  /**
   * Login component with form submission
   * Used for auth requirement detection tests
   */
  authComponent: `import React, { useState } from 'react';

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
    
    // Login logic
    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('Logged in:', data.user);
      }
    } catch (error) {
      console.error('Login failed:', error);
    } finally {
      setLoading(false);
    }
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

  /**
   * File input with image upload
   * Used for storage requirement detection tests
   */
  storageComponent: `import React, { useState, useRef } from 'react';

interface FileUploadProps {
  onUpload?: (url: string) => void;
}

export const ImageUploader = ({ onUpload }: FileUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Show preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);

      // Upload to storage
      uploadFile(file);
    }
  };

  const uploadFile = async (file: File) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/storage/upload', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        onUpload?.(data.url);
      }
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="image-uploader">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />
      <button onClick={() => fileInputRef.current?.click()}>
        {uploading ? 'Uploading...' : 'Select Image'}
      </button>
      {preview && (
        <img src={preview} alt="Preview" className="preview-image" />
      )}
    </div>
  );
};

export default ImageUploader;
`,

  /**
   * Multiple entities (User, Post, Comment) with relations
   * Used for complex entity relationship tests
   */
  complexApp: `import React, { useState, useEffect } from 'react';

interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
}

interface Post {
  id: string;
  title: string;
  content: string;
  authorId: string;
  createdAt: string;
}

interface Comment {
  id: string;
  content: string;
  postId: string;
  authorId: string;
  createdAt: string;
}

export const BlogApp = () => {
  const [user, setUser] = useState<User | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);

  useEffect(() => {
    // Fetch posts
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    const response = await fetch('/api/posts');
    const data = await response.json();
    setPosts(data);
  };

  const createPost = async (title: string, content: string) => {
    const response = await fetch('/api/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, content, authorId: user?.id }),
    });
    const newPost = await response.json();
    setPosts([...posts, newPost]);
  };

  const addComment = async (postId: string, content: string) => {
    const response = await fetch(\`/api/posts/\${postId}/comments\`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content, authorId: user?.id }),
    });
    const newComment = await response.json();
    setComments([...comments, newComment]);
  };

  const deletePost = async (postId: string) => {
    await fetch(\`/api/posts/\${postId}\`, { method: 'DELETE' });
    setPosts(posts.filter((p) => p.id !== postId));
  };

  return (
    <div className="blog-app">
      {posts.map((post) => (
        <article key={post.id}>
          <h2>{post.title}</h2>
          <p>{post.content}</p>
          <button onClick={() => deletePost(post.id)}>Delete</button>
        </article>
      ))}
    </div>
  );
};

export default BlogApp;
`,

  /**
   * Empty string - edge case
   */
  emptyCode: '',

  /**
   * Non-TypeScript string - edge case
   */
  invalidCode: `<!DOCTYPE html>
<html>
<head>
  <title>Not TypeScript</title>
</head>
<body>
  <h1>Hello World</h1>
</body>
</html>`,
};

export default SAMPLE_CODE;
