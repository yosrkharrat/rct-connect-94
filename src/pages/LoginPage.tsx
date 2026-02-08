import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Eye, EyeOff, Loader2, Shield, Dumbbell, Users, Mic } from 'lucide-react';
import rctLogo from '@/assets/rct-logo.png';

const demoAccounts = [
  { email: 'admin@rct.tn', cin: '123', role: 'Comité Directeur', icon: Shield },
  { email: 'coach@rct.tn', cin: '456', role: 'Admin Coach', icon: Dumbbell },
  { email: 'mohamed@rct.tn', cin: '789', role: 'Adhérant', icon: Users },
];

const LoginPage = () => {
  const navigate = useNavigate();
  const { login, loginAsVisitor } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [showDemo, setShowDemo] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [voiceFilled, setVoiceFilled] = useState(false);

  // Load voice-filled data from sessionStorage
  useEffect(() => {
    const voiceDraft = sessionStorage.getItem('voice_login_draft');
    if (voiceDraft) {
      try {
        const data = JSON.parse(voiceDraft);
        if (data.email) setEmail(data.email);
        if (data.password) setPassword(data.password);
        setVoiceFilled(true);
        sessionStorage.removeItem('voice_login_draft');
      } catch (e) {
        console.error('Error parsing voice draft:', e);
      }
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email.trim()) { setError('Entrez votre email'); return; }
    if (!password) { setError('Entrez les 3 chiffres de votre CIN'); return; }
    setIsSubmitting(true);
    const result = await login(email, password);
    setIsSubmitting(false);
    if (result.success) { navigate('/'); return; }
    setError(result.error || 'Erreur');
  };

  const handleDemoLogin = async (demoEmail: string, demoCin: string) => {
    setError('');
    setIsSubmitting(true);
    const result = await login(demoEmail, demoCin);
    setIsSubmitting(false);
    if (result.success) {
      navigate('/');
    } else {
      setError(result.error || 'Erreur de connexion au compte démo');
    }
  };

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      {/* Hero - compact */}
      <div className="relative h-40 rct-gradient-hero flex items-end shrink-0">
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
        <div className="relative p-4 pb-8 w-full flex items-center gap-3">
          <img src={rctLogo} alt="RCT Logo" className="h-14 w-14 drop-shadow-2xl" width={56} height={56} />
          <div>
            <h1 className="font-display font-extrabold text-2xl text-white drop-shadow-lg">RCT</h1>
            <p className="text-white/80 font-body text-xs">Running Club Tunis</p>
          </div>
        </div>
      </div>

      {/* Login Form */}
      <div className="flex-1 px-5 -mt-4 flex flex-col justify-center">
        <div className="bg-card rounded-2xl rct-shadow-elevated p-5">
          <div className="flex items-center justify-between mb-0.5">
            <h2 className="font-display font-bold text-lg">Connexion</h2>
            {voiceFilled && (
              <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
                <Mic className="w-3 h-3" /> Assistant
              </div>
            )}
          </div>
          <p className="text-xs text-muted-foreground mb-4">Identifiez-vous pour accéder à votre espace</p>

          <form onSubmit={handleLogin} className="space-y-3">
            <div>
              <label htmlFor="login-email" className="text-xs font-medium mb-1 block">Email</label>
              <input
                id="login-email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="votre@email.com"
                className="w-full h-11 px-4 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label htmlFor="login-password" className="text-xs font-medium mb-1 block">Mot de passe (3 derniers chiffres CIN)</label>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="123"
                  className="w-full h-11 px-4 pr-12 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  disabled={isSubmitting}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {error && <p className="text-destructive text-xs font-medium">{error}</p>}

            <button type="submit" disabled={isSubmitting} className="w-full h-11 rct-gradient-hero text-white font-display font-bold rounded-xl rct-glow-blue transition-transform active:scale-[0.98] disabled:opacity-70 flex items-center justify-center gap-2 mt-4">
              {isSubmitting ? <><Loader2 className="w-5 h-5 animate-spin" /> Connexion...</> : 'Se connecter'}
            </button>

            <div className="flex items-center gap-3 my-2">
              <div className="flex-1 h-px bg-border" />
              <span className="text-xs text-muted-foreground">ou</span>
              <div className="flex-1 h-px bg-border" />
            </div>

            <button type="button" onClick={() => { loginAsVisitor(); navigate('/calendar'); }} className="w-full h-11 bg-muted text-foreground font-display font-semibold rounded-xl transition-colors hover:bg-muted/80">
              Continuer en visiteur
            </button>
          </form>
        </div>

        {/* Demo Accounts */}
        <div className="mt-4">
          <button 
            onClick={() => setShowDemo(!showDemo)} 
            className="text-xs text-primary font-semibold mb-2 mx-auto block"
          >
            {showDemo ? 'Masquer les comptes de démonstration' : '👉 Comptes de démonstration'}
          </button>
          
          {showDemo && (
            <div className="space-y-2 animate-slide-up">
              {demoAccounts.map(account => (
                <button
                  key={account.email}
                  onClick={() => handleDemoLogin(account.email, account.cin)}
                  disabled={isSubmitting}
                  className="w-full bg-card rounded-xl p-3 rct-shadow-card flex items-center gap-3 text-left hover:bg-muted/50 transition-colors disabled:opacity-70"
                >
                  <div className="w-10 h-10 rounded-full rct-gradient-hero flex items-center justify-center flex-shrink-0">
                    <account.icon className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{account.email}</p>
                    <p className="text-xs text-muted-foreground">{account.role} · CIN: xxx{account.cin}</p>
                  </div>
                  <span className="text-xs text-primary font-semibold flex-shrink-0">Essayer →</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <p className="text-center text-[10px] text-muted-foreground py-3">
          RCT Connect © 2026
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
