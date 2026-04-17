/**
 * E2E Test Fixture - Simple User Entity
 * Scenario 1: Simple User Entity detection
 */

export const SIMPLE_USER_CODE = `import React, { useState } from 'react';

interface User {
  id: string;
  name: string;
  email: string;
}

export const UserProfile = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);

  const handleUpdate = (updates: Partial<User>) => {
    if (user) {
      setUser({ ...user, ...updates });
    }
  };

  return (
    <div className="user-profile">
      {user && (
        <div>
          <h2>{user.name}</h2>
          <p>{user.email}</p>
        </div>
      )}
    </div>
  );
};

export default UserProfile;
`;

export default SIMPLE_USER_CODE;