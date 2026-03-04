import { useState, useEffect, useCallback } from 'react';
import { Pet } from './types';
import { api } from './api';
import './App.css';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const FEED_COOLDOWN_MS  = 2 * 60 * 1000;
const PLAY_COOLDOWN_MS  = 2 * 60 * 1000;
const REST_COOLDOWN_MS  = 5 * 60 * 1000;
const AUTO_REFRESH_MS   = 60_000;

function cooldownRemaining(lastActionIso: string, cooldownMs: number): number {
  const elapsed = Date.now() - new Date(lastActionIso).getTime();
  return Math.max(0, Math.ceil((cooldownMs - elapsed) / 1000));
}

function formatSeconds(s: number): string {
  if (s <= 0) return '';
  return s >= 60 ? `${Math.ceil(s / 60)}m` : `${s}s`;
}

function getStatColor(value: number): string {
  if (value < 30) return 'low';
  if (value < 60) return 'medium';
  return '';
}

// ─── Sub-components ──────────────────────────────────────────────────────────

interface ConfirmDialogProps {
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

function ConfirmDialog({ message, onConfirm, onCancel }: ConfirmDialogProps) {
  return (
    <div className="dialog-overlay">
      <div className="dialog-box">
        <p>{message}</p>
        <div className="dialog-actions">
          <button onClick={onConfirm}>Yes</button>
          <button onClick={onCancel} className="btn-secondary">Cancel</button>
        </div>
      </div>
    </div>
  );
}

interface StatBarProps {
  label: string;
  value: number;
  max?: number;
}

function StatBar({ label, value, max = 100 }: StatBarProps) {
  const pct = Math.round((value / max) * 100);
  return (
    <div className="stat">
      <div className="stat-label">
        <span>{label}</span>
        <span>{value}{max === 100 ? '%' : ` / ${max}`}</span>
      </div>
      <div className="stat-bar">
        <div className={`stat-fill ${getStatColor(pct)}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

interface ActionButtonProps {
  label: string;
  onClick: () => void;
  cooldownSec: number;
  disabled?: boolean;
}

function ActionButton({ label, onClick, cooldownSec, disabled }: ActionButtonProps) {
  const onCooldown = cooldownSec > 0;
  return (
    <button
      onClick={onClick}
      disabled={disabled || onCooldown}
      title={onCooldown ? `Ready in ${formatSeconds(cooldownSec)}` : undefined}
    >
      {label}
      {onCooldown && <span className="cooldown-badge">{formatSeconds(cooldownSec)}</span>}
    </button>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [username, setUsername]     = useState('');
  const [password, setPassword]     = useState('');
  const [currentUser, setCurrentUser] = useState<string | null>(null);

  const [pets, setPets]       = useState<Pet[]>([]);
  const [species, setSpecies] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [newPetName, setNewPetName]           = useState('');
  const [selectedSpecies, setSelectedSpecies] = useState('');
  const [selectedGameMode, setSelectedGameMode] = useState<'casual' | 'realistic'>('casual');

  // Increments every second – the value is unused; the re-render is the purpose.
  const [, setSecondTick] = useState(0);

  const [confirmDialog, setConfirmDialog] = useState<{
    show: boolean; petId: string; petName: string;
  }>({ show: false, petId: '', petName: '' });

  // ── Auth helpers ────────────────────────────────────────────────────────────

  const handleLogout = useCallback(() => {
    api.logout();
    setIsAuthenticated(false);
    setCurrentUser(null);
    setPets([]);
    setSpecies([]);
  }, []);

  const loadData = useCallback(async () => {
    const [petsRes, speciesRes] = await Promise.all([
      api.getPets(),
      api.getSpecies(),
    ]);

    if (!petsRes.success) {
      if (petsRes.error?.match(/auth|token/i)) { handleLogout(); return; }
      setError(petsRes.error || 'Failed to load pets');
    } else {
      setPets(petsRes.data || []);
    }

    if (speciesRes.success && speciesRes.data) {
      setSpecies(speciesRes.data);
      setSelectedSpecies(prev => prev || speciesRes.data![0] || '');
    }
  }, [handleLogout]);

  const checkAuth = useCallback(async () => {
    setLoading(true);
    if (api.isAuthenticated()) {
      const userRes = await api.getCurrentUser();
      if (userRes.success && userRes.data) {
        setIsAuthenticated(true);
        setCurrentUser(userRes.data.username);
        await loadData();
      } else {
        api.logout();
      }
    }
    setLoading(false);
  }, [loadData]);

  // ── Effects ─────────────────────────────────────────────────────────────────

  useEffect(() => { checkAuth(); }, [checkAuth]);

  // Auto-refresh pets every 60 s to pick up stat changes
  useEffect(() => {
    if (!isAuthenticated) return;
    const id = setInterval(() => loadData(), AUTO_REFRESH_MS);
    return () => clearInterval(id);
  }, [isAuthenticated, loadData]);

  // Tick every second for cooldown countdown display
  useEffect(() => {
    const id = setInterval(() => setSecondTick(t => t + 1), 1_000);
    return () => clearInterval(id);
  }, []);

  // Auto-clear messages after 4 s
  useEffect(() => {
    if (!error) return;
    const id = setTimeout(() => setError(null), 4_000);
    return () => clearTimeout(id);
  }, [error]);

  useEffect(() => {
    if (!success) return;
    const id = setTimeout(() => setSuccess(null), 3_000);
    return () => clearTimeout(id);
  }, [success]);

  // ── Handlers ────────────────────────────────────────────────────────────────

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
      setLoading(true);
      await loadData();
      setLoading(false);
    }
  };

  const handleCreatePet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPetName.trim()) { setError('Please enter a pet name'); return; }

    const res = await api.createPet({
      name: newPetName.trim(),
      species: selectedSpecies,
      gameMode: selectedGameMode,
    });

    if (!res.success) {
      setError(res.error || 'Failed to create pet');
    } else {
      setNewPetName('');
      setSuccess(`${res.data?.name} was born! 🎉`);
      await loadData();
    }
  };

  const handleAction = async (petId: string, action: 'feed' | 'play' | 'rest') => {
    const res = action === 'feed' ? await api.feedPet(petId)
              : action === 'play' ? await api.playWithPet(petId)
              : await api.restPet(petId);

    if (!res.success) {
      setError(res.error || `Failed to ${action} pet`);
    } else {
      const verb = action === 'feed' ? 'Fed' : action === 'play' ? 'Played with' : 'Rested';
      setSuccess(`${verb} ${res.data?.name}! ✅`);
      await loadData();
    }
  };

  const handleHatchEgg = async (petId: string) => {
    const res = await api.hatchEgg(petId);
    if (!res.success) {
      setError(res.error || 'Failed to hatch egg');
    } else {
      setSuccess(`${res.data?.name} hatched! 🐣`);
      await loadData();
    }
  };

  const handleDeleteClick = (petId: string, petName: string) => {
    setConfirmDialog({ show: true, petId, petName });
  };

  const handleDeleteConfirm = async () => {
    const { petId } = confirmDialog;
    setConfirmDialog({ show: false, petId: '', petName: '' });
    const res = await api.deletePet(petId);
    if (!res.success) {
      setError(res.error || 'Failed to release pet');
    } else {
      await loadData();
    }
  };

  // ── Render ──────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="app">
        <h1>🐾 Digi-Pets 🐾</h1>
        <div className="loading">Loading…</div>
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
              placeholder="Enter username (min 3 chars)"
              minLength={3}
              maxLength={32}
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Password:</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password (min 6 chars)"
              minLength={6}
            />
          </div>
          <button type="submit">{showRegister ? 'Register' : 'Login'}</button>
          <button
            type="button"
            className="btn-secondary"
            style={{ marginTop: '0.5rem' }}
            onClick={() => { setShowRegister(!showRegister); setError(null); }}
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
      {/* Header */}
      <div className="app-header">
        <h1 style={{ margin: 0 }}>🐾 Digi-Pets 🐾</h1>
        <div className="header-user">
          <span>Welcome, {currentUser}!</span>
          <button onClick={handleLogout} style={{ padding: '0.5rem 1rem' }}>Logout</button>
        </div>
      </div>

      {/* Notifications */}
      {error   && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      {/* Confirm dialog */}
      {confirmDialog.show && (
        <ConfirmDialog
          message={`Release ${confirmDialog.petName}? This cannot be undone.`}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setConfirmDialog({ show: false, petId: '', petName: '' })}
        />
      )}

      {/* Create pet form */}
      <form onSubmit={handleCreatePet} className="create-pet-form">
        <h2>Adopt a New Pet</h2>
        <div className="form-group">
          <label htmlFor="petName">Pet Name:</label>
          <input
            id="petName"
            type="text"
            value={newPetName}
            onChange={(e) => setNewPetName(e.target.value)}
            placeholder="Enter pet name (max 24 chars)"
            maxLength={24}
          />
        </div>
        <div className="form-group">
          <label htmlFor="species">Species:</label>
          <select id="species" value={selectedSpecies} onChange={(e) => setSelectedSpecies(e.target.value)}>
            {species.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label htmlFor="gameMode">Game Mode:</label>
          <select
            id="gameMode"
            value={selectedGameMode}
            onChange={(e) => setSelectedGameMode(e.target.value as 'casual' | 'realistic')}
          >
            <option value="casual">🌟 Casual – forgiving, pets never revert to egg</option>
            <option value="realistic">⚡ Realistic – pets can turn into eggs after 3+ days neglect</option>
          </select>
        </div>
        <button type="submit">🐣 Adopt Pet</button>
      </form>

      {/* Pet list */}
      {pets.length === 0 ? (
        <div className="empty-state">No pets yet! Adopt your first Digi-Pet above.</div>
      ) : (
        <div className="pets-grid">
          {pets.map((pet) => (
            <div key={pet.id} className="pet-card">
              {pet.stage === 'egg' ? (
                /* ── Egg view ── */
                <div>
                  <div className="pet-header">
                    <div>
                      <div className="pet-name">🥚 {pet.name}</div>
                      <div className="pet-species">{pet.species} Egg</div>
                    </div>
                    <div className="pet-level">Lv {pet.level}</div>
                  </div>
                  <div className="egg-view">
                    <div className="egg-emoji">🥚</div>
                    <p className="egg-description">
                      Your pet turned into an egg from neglect.<br />
                      Hatch it to bring it back!
                    </p>
                    <button onClick={() => handleHatchEgg(pet.id)} style={{ width: '100%' }}>
                      🐣 Hatch Egg
                    </button>
                  </div>
                </div>
              ) : (
                /* ── Normal pet view ── */
                <div>
                  <div className="pet-header">
                    <div>
                      <div className="pet-name">
                        {pet.stage === 'baby' ? '👶' : '🦖'} {pet.name}
                      </div>
                      <div className="pet-species">{pet.species}</div>
                      <div className="pet-mode">
                        {pet.gameMode === 'casual' ? '🌟 Casual' : '⚡ Realistic'}
                      </div>
                    </div>
                    <div className="pet-level">Lv {pet.level}</div>
                  </div>

                  <div className="pet-stats">
                    <StatBar label="❤️ Health"    value={pet.health} />
                    <StatBar label="🍔 Hunger"    value={pet.hunger} />
                    <StatBar label="😊 Happiness" value={pet.happiness} />
                    <StatBar label="⚡ Energy"    value={pet.energy} />
                    <StatBar
                      label="🌟 Experience"
                      value={pet.experience}
                      max={pet.level * 100}
                    />
                    <div className="pet-age">Age: {pet.age} hour{pet.age !== 1 ? 's' : ''}</div>
                  </div>

                  <div className="pet-actions">
                    <ActionButton
                      label="🍔 Feed"
                      onClick={() => handleAction(pet.id, 'feed')}
                      cooldownSec={cooldownRemaining(pet.lastFed, FEED_COOLDOWN_MS)}
                    />
                    <ActionButton
                      label="🎮 Play"
                      onClick={() => handleAction(pet.id, 'play')}
                      cooldownSec={cooldownRemaining(pet.lastPlayed, PLAY_COOLDOWN_MS)}
                      disabled={pet.energy < 15}
                    />
                    <ActionButton
                      label="😴 Rest"
                      onClick={() => handleAction(pet.id, 'rest')}
                      cooldownSec={cooldownRemaining(pet.lastSlept, REST_COOLDOWN_MS)}
                    />
                    <button
                      className="delete-btn"
                      onClick={() => handleDeleteClick(pet.id, pet.name)}
                    >
                      🗑️ Release
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default App;

