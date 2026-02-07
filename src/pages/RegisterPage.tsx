import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { registerUser } from '@/lib/store';
import { Eye, EyeOff, ArrowLeft, UserPlus } from 'lucide-react';

const groups = ['Groupe A', 'Groupe B', 'Comité'];

const RegisterPage = () => {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [cin, setCin] = useState('');
  const [group, setGroup] = useState('');
  const [showCin, setShowCin] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!name.trim()) {
      setError('Veuillez entrer votre nom complet');
      return;
    }
    if (!cin || cin.length !== 3 || !/^\d{3}$/.test(cin)) {
      setError('Le code CIN doit contenir exactement 3 chiffres');
      return;
    }

    setLoading(true);
    const result = registerUser(name.trim(), cin, group || undefined);
    setLoading(false);

    if (result.success) {
      navigate('/login', { state: { registered: true, name, cin } });
    } else {
      setError(result.error || 'Erreur lors de l\'inscription');
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="relative h-48 rct-gradient-hero flex items-end">
        <button
          onClick={() => navigate('/login')}
          className="absolute top-6 left-4 w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center"
        >
          <ArrowLeft className="w-5 h-5 text-white" />
        </button>
        <div className="relative p-6 pb-8 w-full">
          <h1 className="font-display font-extrabold text-3xl text-white drop-shadow-lg">Inscription</h1>
          <p className="text-white/80 font-body text-sm mt-1">Rejoignez le Running Club Tunis</p>
        </div>
      </div>

      {/* Registration Form */}
      <div className="flex-1 px-6 -mt-4">
        <div className="bg-card rounded-2xl rct-shadow-elevated p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-full rct-gradient-hero flex items-center justify-center">
              <UserPlus className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="font-display font-bold text-lg">Nouveau membre</h2>
              <p className="text-xs text-muted-foreground">Créez votre compte</p>
            </div>
          </div>

          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Nom complet *</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Prénom et nom"
                className="w-full h-12 px-4 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                disabled={loading}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-1.5 block">Code CIN (3 derniers chiffres) *</label>
              <div className="relative">
                <input
                  type={showCin ? 'text' : 'password'}
                  value={cin}
                  onChange={e => {
                    if (/^\d{0,3}$/.test(e.target.value)) setCin(e.target.value);
                  }}
                  placeholder="•••"
                  maxLength={3}
                  className="w-full h-12 px-4 pr-12 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary tracking-widest"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowCin(!showCin)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                >
                  {showCin ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Ce code servira de mot de passe</p>
            </div>

            <div>
              <label className="text-sm font-medium mb-1.5 block">Groupe (optionnel)</label>
              <select
                value={group}
                onChange={e => setGroup(e.target.value)}
                className="w-full h-12 px-4 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                disabled={loading}
              >
                <option value="">Choisir plus tard</option>
                {groups.map(g => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>

            {error && (
              <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-3">
                <p className="text-destructive text-sm font-medium">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 rct-gradient-hero text-white font-display font-bold rounded-xl rct-glow-blue transition-transform active:scale-[0.98] disabled:opacity-50"
            >
              {loading ? 'Inscription...' : 'S\'inscrire'}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-border">
            <p className="text-xs text-muted-foreground text-center">
              Déjà membre ?{' '}
              <button onClick={() => navigate('/login')} className="text-primary font-semibold">
                Se connecter
              </button>
            </p>
          </div>
        </div>

        {/* Info */}
        <div className="mt-6 mb-6 bg-card rounded-2xl rct-shadow-card p-4">
          <h3 className="font-semibold text-sm mb-2">📋 Informations importantes</h3>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li>• Votre compte sera créé avec le rôle "Membre"</li>
            <li>• Un administrateur pourra modifier votre groupe plus tard</li>
            <li>• Conservez bien votre code CIN (mot de passe)</li>
            <li>• Vous aurez accès à tous les événements du club</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
