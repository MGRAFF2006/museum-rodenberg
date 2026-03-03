import React, { useState, useEffect } from 'react';
import { AdminLogin } from './AdminLogin';
import { AdminDashboard } from './AdminDashboard';
import { ExhibitionEditor } from './ExhibitionEditor';
import { ArtifactEditor } from './ArtifactEditor';
import { login as serverLogin, logout as serverLogout, isAuthenticated as checkAuth } from '../../utils/auth';

export const Admin: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [editingType, setEditingType] = useState<'exhibition' | 'artifact' | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Check for existing session on mount
  useEffect(() => {
    if (checkAuth()) {
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogin = async (password: string): Promise<boolean> => {
    const success = await serverLogin(password);
    if (success) {
      setIsAuthenticated(true);
      return true;
    }
    return false;
  };

  const handleLogout = async () => {
    await serverLogout();
    setIsAuthenticated(false);
  };

  if (!isAuthenticated) {
    return <AdminLogin onLogin={handleLogin} />;
  }

  if (editingType === 'exhibition' && editingId) {
    return (
      <ExhibitionEditor 
        id={editingId} 
        onBack={() => {
          setEditingType(null);
          setEditingId(null);
          // refreshData is called inside ExhibitionEditor if saved
        }} 
      />
    );
  }

  if (editingType === 'artifact' && editingId) {
    return (
      <ArtifactEditor 
        id={editingId} 
        onBack={() => {
          setEditingType(null);
          setEditingId(null);
        }} 
      />
    );
  }

  return (
    <AdminDashboard 
      onLogout={handleLogout}
      onEditExhibition={(id: string) => {
        setEditingType('exhibition');
        setEditingId(id);
      }}
      onEditArtifact={(id: string) => {
        setEditingType('artifact');
        setEditingId(id);
      }}
      onAddExhibition={() => {
        setEditingType('exhibition');
        setEditingId('new');
      }}
      onAddArtifact={() => {
        setEditingType('artifact');
        setEditingId('new');
      }}
    />
  );
};
