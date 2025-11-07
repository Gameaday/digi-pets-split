import { useState, useEffect } from 'react';
import { Pet } from './types';
import { api } from './api';
import './App.css';

interface ConfirmDialogProps {
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

function ConfirmDialog({ message, onConfirm, onCancel }: ConfirmDialogProps) {
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
    }}>
      <div style={{
        background: 'white',
        padding: '2rem',
        borderRadius: '15px',
        maxWidth: '400px',
        width: '90%',
        textAlign: 'center',
        boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)',
      }}>
        <p style={{ color: '#333', marginBottom: '1.5rem', fontSize: '1.1rem' }}>{message}</p>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
          <button onClick={onConfirm} style={{ flex: 1 }}>
            Yes
          </button>
          <button onClick={onCancel} style={{ flex: 1, background: '#666' }}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  
  const [pets, setPets] = useState<Pet[]>([]);
  const [species, setSpecies] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newPetName, setNewPetName] = useState('');
  const [selectedSpecies, setSelectedSpecies] = useState('');
  const [confirmDialog, setConfirmDialog] = useState<{ show: boolean; petId: string; petName: string }>({
    show: false,
    petId: '',
    petName: '',
  });

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    setLoading(true);
    if (api.isAuthenticated()) {
      const userRes = await api.getCurrentUser();
      if (userRes.success && userRes.data) {
        setIsAuthenticated(true);
        setCurrentUser(userRes.data.username);
        await loadData();
      } else {
        // Token expired or invalid
        api.logout();
        setIsAuthenticated(false);
        setLoading(false);
      }
    } else {
      setIsAuthenticated(false);
      setLoading(false);
    }
  };

  const loadData = async () => {
    setLoading(true);
    setError(null);

    const [petsRes, speciesRes] = await Promise.all([
      api.getPets(),
      api.getSpecies(),
    ]);

    if (!petsRes.success) {
      if (petsRes.error?.includes('Authentication') || petsRes.error?.includes('token')) {
        // Session expired
        handleLogout();
        return;
      }
      setError(petsRes.error || 'Failed to load pets');
    } else {
      setPets(petsRes.data || []);
    }

    if (!speciesRes.success) {
      setError(speciesRes.error || 'Failed to load species');
    } else {
      setSpecies(speciesRes.data || []);
      if (speciesRes.data && speciesRes.data.length > 0) {
        setSelectedSpecies(speciesRes.data[0]);
      }
    }

    setLoading(false);
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!username.trim() || !password) {
      setError('Please enter both username and password');
      return;
    }

    const res = showRegister 
      ? await api.register({ username: username.trim(), password })
      : await api.login({ username: username.trim(), password });

    if (!res.success) {
      setError(res.error || 'Authentication failed');
    } else if (res.data) {
      setIsAuthenticated(true);
      setCurrentUser(res.data.user.username);
      setUsername('');
      setPassword('');
      await loadData();
    }
  };

  const handleLogout = () => {
    api.logout();
    setIsAuthenticated(false);
    setCurrentUser(null);
    setPets([]);
  };

  const handleCreatePet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPetName.trim()) {
      setError('Please enter a pet name');
      return;
    }

    const res = await api.createPet({
      name: newPetName,
      species: selectedSpecies,
    });

    if (!res.success) {
      setError(res.error || 'Failed to create pet');
    } else {
      setNewPetName('');
      await loadData();
    }
  };

  const handleAction = async (
    petId: string,
    action: 'feed' | 'play' | 'rest'
  ) => {
    let res;
    switch (action) {
      case 'feed':
        res = await api.feedPet(petId);
        break;
      case 'play':
        res = await api.playWithPet(petId);
        break;
      case 'rest':
        res = await api.restPet(petId);
        break;
    }

    if (!res.success) {
      setError(res.error || `Failed to ${action} pet`);
      setTimeout(() => setError(null), 3000);
    } else {
      await loadData();
    }
  };

  const handleDeleteClick = (petId: string, petName: string) => {
    setConfirmDialog({ show: true, petId, petName });
  };

  const handleDeleteConfirm = async () => {
    const res = await api.deletePet(confirmDialog.petId);
    if (!res.success) {
      setError(res.error || 'Failed to delete pet');
    } else {
      await loadData();
    }
    setConfirmDialog({ show: false, petId: '', petName: '' });
  };

  const handleDeleteCancel = () => {
    setConfirmDialog({ show: false, petId: '', petName: '' });
  };

  const getStatColor = (value: number): string => {
    if (value < 30) return 'low';
    if (value < 60) return 'medium';
    return '';
  };

  if (loading) {
    return (
      <div className="app">
        <h1>🐾 Digi-Pets 🐾</h1>
        <div className="loading">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="app">
        <h1>🐾 Digi-Pets 🐾</h1>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleAuth} className="create-pet-form">
          <h2>{showRegister ? 'Create Account' : 'Login'}</h2>
          <div className="form-group">
            <label htmlFor="username">Username:</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter username"
              minLength={3}
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Password:</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              minLength={6}
            />
          </div>
          <button type="submit">{showRegister ? 'Register' : 'Login'}</button>
          <button 
            type="button" 
            onClick={() => {
              setShowRegister(!showRegister);
              setError(null);
            }}
            style={{ background: '#666', marginTop: '0.5rem' }}
          >
            {showRegister ? 'Already have an account? Login' : 'Need an account? Register'}
          </button>
        </form>

        <div className="empty-state">
          {showRegister 
            ? 'Create an account to start your Digi-Pet journey!' 
            : 'Login to manage your Digi-Pets'}
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h1 style={{ margin: 0 }}>🐾 Digi-Pets 🐾</h1>
        <div style={{ color: 'white', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span>Welcome, {currentUser}!</span>
          <button onClick={handleLogout} style={{ padding: '0.5rem 1rem' }}>
            Logout
          </button>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      {confirmDialog.show && (
        <ConfirmDialog
          message={`Are you sure you want to release ${confirmDialog.petName}?`}
          onConfirm={handleDeleteConfirm}
          onCancel={handleDeleteCancel}
        />
      )}

      <form onSubmit={handleCreatePet} className="create-pet-form">
        <h2>Create New Pet</h2>
        <div className="form-group">
          <label htmlFor="petName">Pet Name:</label>
          <input
            id="petName"
            type="text"
            value={newPetName}
            onChange={(e) => setNewPetName(e.target.value)}
            placeholder="Enter pet name"
          />
        </div>
        <div className="form-group">
          <label htmlFor="species">Species:</label>
          <select
            id="species"
            value={selectedSpecies}
            onChange={(e) => setSelectedSpecies(e.target.value)}
          >
            {species.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <button type="submit">Create Pet</button>
      </form>

      {pets.length === 0 ? (
        <div className="empty-state">
          No pets yet! Create your first Digi-Pet above.
        </div>
      ) : (
        <div className="pets-grid">
          {pets.map((pet) => (
            <div key={pet.id} className="pet-card">
              <div className="pet-header">
                <div>
                  <div className="pet-name">{pet.name}</div>
                  <div className="pet-species">{pet.species}</div>
                </div>
                <div style={{ fontSize: '2rem' }}>
                  Level {pet.level}
                </div>
              </div>

              <div className="pet-stats">
                <div className="stat">
                  <div className="stat-label">
                    <span>❤️ Health</span>
                    <span>{pet.health}%</span>
                  </div>
                  <div className="stat-bar">
                    <div
                      className={`stat-fill ${getStatColor(pet.health)}`}
                      style={{ width: `${pet.health}%` }}
                    />
                  </div>
                </div>

                <div className="stat">
                  <div className="stat-label">
                    <span>🍔 Hunger</span>
                    <span>{pet.hunger}%</span>
                  </div>
                  <div className="stat-bar">
                    <div
                      className={`stat-fill ${getStatColor(pet.hunger)}`}
                      style={{ width: `${pet.hunger}%` }}
                    />
                  </div>
                </div>

                <div className="stat">
                  <div className="stat-label">
                    <span>😊 Happiness</span>
                    <span>{pet.happiness}%</span>
                  </div>
                  <div className="stat-bar">
                    <div
                      className={`stat-fill ${getStatColor(pet.happiness)}`}
                      style={{ width: `${pet.happiness}%` }}
                    />
                  </div>
                </div>

                <div className="stat">
                  <div className="stat-label">
                    <span>⚡ Energy</span>
                    <span>{pet.energy}%</span>
                  </div>
                  <div className="stat-bar">
                    <div
                      className={`stat-fill ${getStatColor(pet.energy)}`}
                      style={{ width: `${pet.energy}%` }}
                    />
                  </div>
                </div>

                <div className="stat">
                  <div className="stat-label">
                    <span>🌟 Experience</span>
                    <span>{pet.experience} XP</span>
                  </div>
                  <div className="stat-bar">
                    <div
                      className="stat-fill"
                      style={{
                        width: `${(pet.experience / (pet.level * 100)) * 100}%`,
                      }}
                    />
                  </div>
                </div>

                <div style={{ marginTop: '1rem', fontSize: '0.9rem', color: '#666' }}>
                  Age: {pet.age} hours
                </div>
              </div>

              <div className="pet-actions">
                <button onClick={() => handleAction(pet.id, 'feed')}>
                  🍔 Feed
                </button>
                <button onClick={() => handleAction(pet.id, 'play')}>
                  🎮 Play
                </button>
                <button onClick={() => handleAction(pet.id, 'rest')}>
                  😴 Rest
                </button>
                <button
                  className="delete-btn"
                  onClick={() => handleDeleteClick(pet.id, pet.name)}
                >
                  🗑️ Release
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default App;
