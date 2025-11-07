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
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);

    const [petsRes, speciesRes] = await Promise.all([
      api.getPets(),
      api.getSpecies(),
    ]);

    if (!petsRes.success) {
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

  return (
    <div className="app">
      <h1>🐾 Digi-Pets 🐾</h1>

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
