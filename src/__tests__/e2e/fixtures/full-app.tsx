/**
 * E2E Test Fixture - Full App
 * Scenario 3: Full Requirements (Storage + Auth + CRUD)
 */

export const FULL_APP_CODE = `import React, { useState, createContext, useContext } from 'react';

interface User {
  id: string;
  email: string;
  name: string;
}

interface Profile {
  id: string;
  username: string;
  bio: string;
  avatarUrl: string;
  userId: string;
}

// Auth Context
interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => void;
  logout: () => void;
  register: (name: string, email: string, password: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  const login = (email: string, _password: string) => {
    setUser({ id: '123', email, name: 'Test User' });
  };

  const logout = () => {
    setUser(null);
  };

  const register = (name: string, email: string, _password: string) => {
    setUser({ id: Date.now().toString(), email, name });
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, register }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

// Login Component
export const Login: React.FC = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login(email, password);
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
      />
      <button type="submit">Login</button>
    </form>
  );
};

// Register Component
export const Register: React.FC = () => {
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    register(name, email, password);
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Name"
      />
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
      />
      <button type="submit">Register</button>
    </form>
  );
};

// Profile Page with file upload
export const ProfilePage: React.FC = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (file: File): Promise<string> => {
    setUploading(true);
    // Simulate upload to Supabase Storage
    await new Promise(resolve => setTimeout(resolve, 1000));
    const avatarUrl = URL.createObjectURL(file);
    setUploading(false);
    return avatarUrl;
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && user) {
      const avatarUrl = await handleUpload(file);
      setProfile({
        id: Date.now().toString(),
        username: user.name,
        bio: '',
        avatarUrl,
        userId: user.id
      });
    }
  };

  const handleUpdateBio = (bio: string) => {
    if (profile) {
      setProfile({ ...profile, bio });
    }
  };

  return (
    <div className="profile-page">
      <h1>Profile</h1>
      {profile ? (
        <div className="profile-info">
          <img src={profile.avatarUrl} alt="Avatar" />
          <h2>{profile.username}</h2>
          <p>{profile.bio}</p>
          <button onClick={() => handleUpdateBio('Updated bio')}>Update Bio</button>
        </div>
      ) : (
        <div className="upload-section">
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
          />
          {uploading && <p>Uploading...</p>}
        </div>
      )}
    </div>
  );
};
`;

export default FULL_APP_CODE;