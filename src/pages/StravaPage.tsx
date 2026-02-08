import { useNavigate, useSearchParams } from 'react-router-dom';
import { ExternalLink, Activity, TrendingUp, Zap, RefreshCw, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { updateUser } from '@/lib/store';
import { useState, useEffect } from 'react';
import { stravaApi } from '@/lib/api';
import ActivityMap from '@/components/ActivityMap';
import DistanceMedal from '@/components/DistanceMedal';
import 'leaflet/dist/leaflet.css';

const StravaPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [connected, setConnected] = useState(user?.strava?.connected || false);
  const [syncing, setSyncing] = useState(false);
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Check if just connected via OAuth callback
  useEffect(() => {
    const justConnected = searchParams.get('connected');
    if (justConnected === 'true' && user) {
      setConnected(true);
      setSuccessMsg('Compte Strava connecté avec succès !');
      // Clean URL
      navigate('/strava', { replace: true });
      // Load activities
      setTimeout(() => loadActivities(), 500);
    }
  }, [searchParams, user]);

  // Load activities when connected
  useEffect(() => {
    if (connected && !searchParams.get('code') && !searchParams.get('connected')) {
      loadActivities();
    }
  }, [connected]);

  const handleConnect = async () => {
    if (!user) {
      setError('Vous devez être connecté pour lier votre compte Strava');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Get OAuth URL and redirect to Strava
      const response = await stravaApi.getAuthUrl();

      if (response.success && response.data.authUrl) {
        // Redirect to Strava OAuth page
        window.location.href = response.data.authUrl;
      } else {
        setError('Erreur lors de la génération de l\'URL d\'autorisation');
        setLoading(false);
      }
    } catch (err: any) {
      console.error('Connect Strava error:', err);
      setError(err.message || 'Erreur lors de la connexion à Strava');
      setLoading(false);
    }
  };

  const loadActivities = async () => {
    if (!user) return;

    try {
      setSyncing(true);
      setError(null);
      const response = await stravaApi.getActivities();
      if (response.success) {
        setActivities(response.data || []);
      }
    } catch (err: any) {
      console.error('Load activities error:', err);
      if (err.message?.includes('reconnecter')) {
        setConnected(false);
        setError('Votre session Strava a expiré. Veuillez vous reconnecter.');
      } else {
        setError('Erreur lors du chargement des activités');
      }
    } finally {
      setSyncing(false);
    }
  };

  const handleDisconnect = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);
      const response = await stravaApi.disconnect();
      if (response.success) {
        setConnected(false);
        setActivities([]);
        setSuccessMsg(null);
        if (user) {
          const updated = { ...user, strava: { connected: false } };
          updateUser(updated);
        }
      }
    } catch (err) {
      console.error('Disconnect Strava error:', err);
      setError('Erreur lors de la déconnexion');
    } finally {
      setLoading(false);
    }
  };

  const formatDistance = (meters: number) => {
    return (meters / 1000).toFixed(1) + ' km';
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const formatPace = (speed: number) => {
    if (!speed || speed === 0) return '--:--/km';
    const paceMinutes = 1000 / speed / 60;
    const minutes = Math.floor(paceMinutes);
    const seconds = Math.round((paceMinutes - minutes) * 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}/km`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Aujourd'hui";
    if (diffDays === 1) return 'Hier';
    if (diffDays < 7) return `Il y a ${diffDays}j`;
    return date.toLocaleDateString('fr-FR');
  };

  // Show loading state during OAuth callback
  if (searchParams.get('code') && loading) {
    return (
      <div className="pb-20 pt-6">
        <div className="px-4 mb-6">
          <h1 className="font-display font-extrabold text-xl">Strava</h1>
        </div>
        <div className="mx-4">
          <div className="bg-card rounded-2xl rct-shadow-elevated p-8 text-center">
            <Loader2 className="w-12 h-12 text-[#FC4C02] mx-auto mb-4 animate-spin" />
            <h2 className="font-display font-bold text-xl mb-2">Connexion en cours...</h2>
            <p className="text-sm text-muted-foreground">
              Liaison de votre compte Strava avec RCT Connect
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-20 pt-6">
      <div className="px-4 mb-6">
        <h1 className="font-display font-extrabold text-xl">Strava</h1>
      </div>

      {error && (
        <div className="mx-4 mb-4 bg-destructive/10 border border-destructive/20 rounded-2xl p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0" />
          <p className="text-sm text-destructive">{error}</p>
          <button onClick={() => setError(null)} className="ml-auto text-destructive/50 hover:text-destructive">✕</button>
        </div>
      )}

      {successMsg && (
        <div className="mx-4 mb-4 bg-green-500/10 border border-green-500/20 rounded-2xl p-4 flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
          <p className="text-sm text-green-700 dark:text-green-400">{successMsg}</p>
          <button onClick={() => setSuccessMsg(null)} className="ml-auto text-green-500/50 hover:text-green-600">✕</button>
        </div>
      )}

      {!connected ? (
        <div className="mx-4">
          {!user ? (
            <div className="bg-card rounded-2xl rct-shadow-elevated p-8 text-center">
              <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                <Activity className="w-10 h-10 text-muted-foreground" />
              </div>
              <h2 className="font-display font-bold text-xl mb-2">Connexion requise</h2>
              <p className="text-sm text-muted-foreground mb-6">
                Vous devez être connecté à RCT Connect pour lier votre compte Strava.
              </p>
              <button
                onClick={() => navigate('/login')}
                className="w-full h-12 bg-primary text-primary-foreground font-display font-bold rounded-xl flex items-center justify-center gap-2 transition-transform active:scale-[0.98]"
                aria-label="Se connecter à RCT Connect"
              >
                Se connecter
              </button>
            </div>
          ) : (
            <div className="bg-card rounded-2xl rct-shadow-elevated p-8 text-center">
              <div className="w-20 h-20 rounded-full bg-[#FC4C02]/10 flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10" viewBox="0 0 24 24" fill="#FC4C02">
                  <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L10.463 0l-7 13.828h4.169" />
                </svg>
              </div>
              <h2 className="font-display font-bold text-xl mb-2">Connecter Strava</h2>
              <p className="text-sm text-muted-foreground mb-6">
                Liez votre compte Strava pour synchroniser automatiquement vos courses et suivre vos performances.
              </p>
              <button
                onClick={handleConnect}
                disabled={loading}
                className="w-full h-12 bg-[#FC4C02] text-white font-display font-bold rounded-xl flex items-center justify-center gap-2 transition-transform active:scale-[0.98] disabled:opacity-50 hover:bg-[#e04500]"
                aria-label="Connecter le compte Strava"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <ExternalLink className="w-5 h-5" />
                )}
                {loading ? 'Redirection...' : 'Connecter avec Strava'}
              </button>
              <p className="text-xs text-muted-foreground mt-3">
                Vous serez redirigé vers Strava pour autoriser l'accès à vos activités de course.
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="px-4 space-y-4">
          {/* Status */}
          <div className="bg-card rounded-2xl rct-shadow-card p-4 flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-[#FC4C02]/10 flex items-center justify-center">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="#FC4C02">
                <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L10.463 0l-7 13.828h4.169" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="font-display font-bold text-sm">Strava connecté ✓</p>
              <p className="text-xs text-accent">
                {user?.strava?.athleteId ? `Athlète #${user.strava.athleteId}` : 'Synchronisation active'}
              </p>
            </div>
            <button
              onClick={loadActivities}
              disabled={syncing}
              className={`w-10 h-10 rounded-full bg-muted flex items-center justify-center ${syncing ? 'animate-spin' : ''}`}
            >
              <RefreshCw className="w-5 h-5" />
            </button>
          </div>

          {/* Stats */}
          {activities.length > 0 && (
            <div className="grid grid-cols-3 gap-3">
              {[
                {
                  icon: TrendingUp,
                  value: formatDistance(activities.reduce((sum: number, a: any) => sum + a.distance, 0)),
                  label: 'Total',
                },
                {
                  icon: Zap,
                  value: formatPace(
                    activities.reduce((sum: number, a: any) => sum + (a.average_speed || 0), 0) / activities.length
                  ),
                  label: 'Allure moy.',
                },
                {
                  icon: Activity,
                  value: activities.length.toString(),
                  label: 'Courses (30j)',
                },
              ].map((s) => (
                <div key={s.label} className="bg-card rounded-2xl rct-shadow-card p-3 text-center">
                  <s.icon className="w-5 h-5 text-[#FC4C02] mx-auto mb-1" />
                  <p className="font-display font-bold text-lg">{s.value}</p>
                  <p className="text-[10px] text-muted-foreground">{s.label}</p>
                </div>
              ))}
            </div>
          )}

          {/* Recent activities */}
          <div>
            <h3 className="font-display font-bold text-base mb-3">5 dernières courses</h3>
            {syncing ? (
              <div className="bg-card rounded-2xl rct-shadow-card p-8 text-center">
                <Loader2 className="w-8 h-8 text-[#FC4C02] mx-auto mb-3 animate-spin" />
                <p className="text-sm text-muted-foreground">Chargement des activités...</p>
              </div>
            ) : activities.length > 0 ? (
              <div className="space-y-4">
                {activities.slice(0, 5).map((activity: any) => (
                  <div key={activity.id} className="bg-card rounded-2xl rct-shadow-card overflow-hidden">
                    {/* Activity Header */}
                    <div className="p-4 flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#FC4C02]/10 flex items-center justify-center flex-shrink-0">
                        <Activity className="w-5 h-5 text-[#FC4C02]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-display font-semibold text-sm mb-1">{activity.name}</p>
                        <p className="text-xs text-muted-foreground mb-2">
                          {formatDistance(activity.distance)} · {formatPace(activity.average_speed)} · {formatTime(activity.moving_time)}
                        </p>
                        <div className="flex items-center gap-2">
                          <DistanceMedal distanceMeters={activity.distance} size="sm" showLabel={true} />
                        </div>
                      </div>
                      <span className="text-[11px] text-muted-foreground whitespace-nowrap">{formatDate(activity.start_date)}</span>
                    </div>

                    {/* Activity Map */}
                    {(activity.polyline || activity.start_latlng) && (
                      <ActivityMap
                        polyline={activity.polyline}
                        startLatLng={activity.start_latlng}
                        endLatLng={activity.end_latlng}
                        className="h-48 w-full"
                      />
                    )}

                    {/* Activity Footer */}
                    {activity.total_elevation_gain > 0 && (
                      <div className="px-4 py-2 bg-muted/50 text-[10px] text-muted-foreground">
                        ↗ {Math.round(activity.total_elevation_gain)}m D+ · {activity.type}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-card rounded-2xl rct-shadow-card p-8 text-center">
                <Activity className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">Aucune course trouvée ces 30 derniers jours</p>
              </div>
            )}
          </div>

          {/* Disconnect */}
          <button
            onClick={handleDisconnect}
            disabled={loading}
            className="w-full h-10 bg-destructive/10 text-destructive text-sm font-semibold rounded-xl disabled:opacity-50"
            aria-label="Déconnecter le compte Strava"
          >
            {loading ? 'Déconnexion...' : 'Déconnecter Strava'}
          </button>
        </div>
      )}
    </div>
  );
};

export default StravaPage;
