import { useNavigate } from 'react-router-dom';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ArrowLeft, TrendingUp, Target, Award, Zap, Calendar } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { getPosts, getEvents } from '@/lib/store';

const StatsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const posts = getPosts();
  const events = getEvents();

  if (!user) {
    return (
      <div className="pb-20 pt-6 px-4">
        <h1 className="font-display font-extrabold text-2xl mb-4">Statistiques</h1>
        <p className="text-muted-foreground">Connectez-vous pour voir vos statistiques</p>
      </div>
    );
  }

  const myPosts = posts.filter(p => p.authorId === user.id);
  const myEvents = events.filter(e => e.participants.includes(user.id));
  
  // Calculate stats
  const totalDistance = myPosts.reduce((acc, p) => acc + (parseFloat(p.distance || '0') || 0), 0);
  const totalRuns = myPosts.length;
  const avgDistance = totalRuns > 0 ? (totalDistance / totalRuns).toFixed(2) : '0';
  
  // Monthly distance data (simulated)
  const monthlyData = [
    { month: 'Sep', distance: 45 },
    { month: 'Oct', distance: 52 },
    { month: 'Nov', distance: 48 },
    { month: 'Déc', distance: 61 },
    { month: 'Jan', distance: 58 },
    { month: 'Fév', distance: totalDistance },
  ];

  // Weekly runs data (simulated)
  const weeklyData = [
    { day: 'Lun', runs: 1 },
    { day: 'Mar', runs: 0 },
    { day: 'Mer', runs: 1 },
    { day: 'Jeu', runs: 1 },
    { day: 'Ven', runs: 0 },
    { day: 'Sam', runs: 2 },
    { day: 'Dim', runs: 1 },
  ];

  return (
    <div className="pb-20">
      {/* Header */}
      <div className="relative h-56 rct-gradient-hero">
        <button
          onClick={() => navigate('/profile')}
          className="absolute top-6 left-4 w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center"
        >
          <ArrowLeft className="w-5 h-5 text-white" />
        </button>
        <div className="absolute bottom-0 left-0 right-0 p-6 pb-8">
          <h1 className="font-display font-extrabold text-3xl text-white drop-shadow-lg mb-1">
            Mes statistiques
          </h1>
          <p className="text-white/80 text-sm">Suivi de performance</p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="px-4 -mt-6 mb-6">
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Distance totale', value: `${totalDistance.toFixed(1)} km`, icon: TrendingUp, color: 'text-blue-500' },
            { label: 'Sorties', value: totalRuns, icon: Calendar, color: 'text-green-500' },
            { label: 'Moyenne', value: `${avgDistance} km`, icon: Target, color: 'text-orange-500' },
            { label: 'Séquence', value: `${user.stats.streak} j`, icon: Zap, color: 'text-purple-500' },
          ].map((stat, idx) => (
            <div key={idx} className="bg-card rounded-2xl rct-shadow-card p-4">
              <stat.icon className={`w-5 h-5 ${stat.color} mb-2`} />
              <p className="text-2xl font-extrabold rct-text-gradient">{stat.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Monthly Distance Chart */}
      <div className="px-4 mb-6">
        <div className="bg-card rounded-2xl rct-shadow-card p-4">
          <h3 className="font-bold text-sm mb-3 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            Distance mensuelle (km)
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Line type="monotone" dataKey="distance" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Weekly Runs Chart */}
      <div className="px-4 mb-6">
        <div className="bg-card rounded-2xl rct-shadow-card p-4">
          <h3 className="font-bold text-sm mb-3 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-primary" />
            Activité de la semaine
          </h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={weeklyData}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
              <XAxis dataKey="day" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="runs" fill="#10b981" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Events Participation */}
      <div className="px-4 mb-6">
        <div className="bg-card rounded-2xl rct-shadow-card p-4">
          <h3 className="font-bold text-sm mb-3 flex items-center gap-2">
            <Award className="w-4 h-4 text-primary" />
            Participation aux événements
          </h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Événements rejoints</span>
              <span className="font-bold">{myEvents.length}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Taux de participation</span>
              <span className="font-bold">
                {events.length > 0 ? Math.round((myEvents.length / events.length) * 100) : 0}%
              </span>
            </div>
            <div className="w-full bg-muted rounded-full h-2 mt-2">
              <div
                className="rct-gradient-hero h-2 rounded-full"
                style={{ width: `${events.length > 0 ? (myEvents.length / events.length) * 100 : 0}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Personal Records */}
      <div className="px-4 mb-6">
        <div className="bg-card rounded-2xl rct-shadow-card p-4">
          <h3 className="font-bold text-sm mb-3">📊 Records personnels</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
              <span className="text-sm">Plus longue distance</span>
              <span className="font-bold text-primary">
                {Math.max(...myPosts.map(p => parseFloat(p.distance || '0')), 0).toFixed(1)} km
              </span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
              <span className="text-sm">Meilleur rythme</span>
              <span className="font-bold text-primary">{user.stats.avgPace}/km</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
              <span className="text-sm">Classement global</span>
              <span className="font-bold text-primary">#{user.stats.ranking}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatsPage;
