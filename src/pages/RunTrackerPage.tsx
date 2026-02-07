import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Polyline, Marker, useMap } from 'react-leaflet';
import { Geolocation } from '@capacitor/geolocation';
import { Capacitor } from '@capacitor/core';
import { ArrowLeft, Play, Pause, Square, Navigation, AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { createPost } from '@/lib/store';
import 'leaflet/dist/leaflet.css';

interface Position {
  lat: number;
  lng: number;
  timestamp: number;
}

const MapUpdater = ({ center }: { center: [number, number] }) => {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
};

const RunTrackerPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isTracking, setIsTracking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [positions, setPositions] = useState<Position[]>([]);
  const [currentPosition, setCurrentPosition] = useState<[number, number]>([36.83, 10.2]);
  const [distance, setDistance] = useState(0);
  const [duration, setDuration] = useState(0);
  const [pace, setPace] = useState('0:00');
  const watchIdRef = useRef<string | null>(null);
  const startTimeRef = useRef<number>(0);
  const pausedTimeRef = useRef<number>(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (watchIdRef.current) {
        Geolocation.clearWatch({ id: watchIdRef.current });
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  const calculateDistance = (pos: Position[]) => {
    let total = 0;
    for (let i = 1; i < pos.length; i++) {
      const lat1 = pos[i - 1].lat * Math.PI / 180;
      const lat2 = pos[i].lat * Math.PI / 180;
      const dlat = lat2 - lat1;
      const dlng = (pos[i].lng - pos[i - 1].lng) * Math.PI / 180;
      const a = Math.sin(dlat / 2) * Math.sin(dlat / 2) +
        Math.cos(lat1) * Math.cos(lat2) *
        Math.sin(dlng / 2) * Math.sin(dlng / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      total += 6371 * c; // Earth radius in km
    }
    return total;
  };

  const startTracking = async () => {
    try {
      const permission = await Geolocation.requestPermissions();
      if (permission.location !== 'granted') {
        alert('Permission de localisation refusée');
        return;
      }

      setIsTracking(true);
      setIsPaused(false);
      startTimeRef.current = Date.now();
      setPositions([]);
      setDistance(0);
      setDuration(0);

      // Get initial position
      const initialPos = await Geolocation.getCurrentPosition();
      const initPos: Position = {
        lat: initialPos.coords.latitude,
        lng: initialPos.coords.longitude,
        timestamp: Date.now(),
      };
      setCurrentPosition([initPos.lat, initPos.lng]);
      setPositions([initPos]);

      // Start watching position
      const id = await Geolocation.watchPosition(
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
        (position, err) => {
          if (err) {
            console.error('Geolocation error:', err);
            return;
          }
          if (!position) return;

          const newPos: Position = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            timestamp: Date.now(),
          };
          setCurrentPosition([newPos.lat, newPos.lng]);
          setPositions(prev => {
            const updated = [...prev, newPos];
            setDistance(calculateDistance(updated));
            return updated;
          });
        }
      );
      watchIdRef.current = id;

      // Start timer
      timerRef.current = setInterval(() => {
        if (!isPaused) {
          const elapsed = Math.floor((Date.now() - startTimeRef.current - pausedTimeRef.current) / 1000);
          setDuration(elapsed);
          
          // Calculate pace
          const dist = distance;
          if (dist > 0 && elapsed > 0) {
            const paceMinutes = (elapsed / 60) / dist;
            const mins = Math.floor(paceMinutes);
            const secs = Math.floor((paceMinutes - mins) * 60);
            setPace(`${mins}:${secs.toString().padStart(2, '0')}`);
          }
        }
      }, 1000);
    } catch (error) {
      console.error('Error starting tracking:', error);
      alert('Erreur lors du démarrage du suivi');
    }
  };

  const togglePause = () => {
    if (isPaused) {
      pausedTimeRef.current += Date.now() - startTimeRef.current;
      setIsPaused(false);
    } else {
      startTimeRef.current = Date.now();
      setIsPaused(true);
    }
  };

  const stopTracking = async () => {
    if (watchIdRef.current) {
      await Geolocation.clearWatch({ id: watchIdRef.current });
      watchIdRef.current = null;
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    setIsTracking(false);
    setIsPaused(false);

    // Save as post
    if (user && distance > 0) {
      const hours = Math.floor(duration / 3600);
      const minutes = Math.floor((duration % 3600) / 60);
      const durationStr = hours > 0 ? `${hours}h ${minutes}min` : `${minutes}min`;

      createPost({
        id: 'p' + Date.now(),
        authorId: user.id,
        authorName: user.name,
        authorAvatar: user.avatar || '',
        content: `Course enregistrée - ${distance.toFixed(2)} km en ${durationStr}`,
        distance: distance.toFixed(2),
        pace,
        likes: [],
        comments: [],
        createdAt: new Date().toISOString(),
        type: 'post',
      });

      navigate('/community');
    }
  };

  const formatTime = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <div className="relative h-16 rct-gradient-hero flex items-center px-4 z-10">
        <button
          onClick={() => navigate('/profile')}
          className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center"
        >
          <ArrowLeft className="w-5 h-5 text-white" />
        </button>
        <h1 className="flex-1 text-center font-display font-bold text-white text-lg">Suivi GPS</h1>
        <div className="w-10" />
      </div>

      {/* Map */}
      <div className="flex-1 relative">
        <MapContainer
          center={currentPosition}
          zoom={15}
          style={{ height: '100%', width: '100%' }}
          zoomControl={false}
        >
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <MapUpdater center={currentPosition} />
          {positions.length > 1 && (
            <Polyline positions={positions.map(p => [p.lat, p.lng])} color="#3b82f6" weight={4} />
          )}
          {positions.length > 0 && (
            <Marker position={[positions[positions.length - 1].lat, positions[positions.length - 1].lng]} />
          )}
        </MapContainer>

        {/* Warning for non-native platform */}
        {!Capacitor.isNativePlatform() && (
          <div className="absolute top-4 left-4 right-4 z-[1000] mb-4">
            <div className="bg-orange-500/90 backdrop-blur-xl rounded-xl p-3 flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-white flex-shrink-0 mt-0.5" />
              <p className="text-white text-xs font-medium">
                ⚠️ Le suivi GPS nécessite un appareil mobile. Testez avec <code className="bg-white/20 px-1 rounded">npx cap run android</code>
              </p>
            </div>
          </div>
        )}

        {/* Stats Overlay */}
        <div className={`absolute ${!Capacitor.isNativePlatform() ? 'top-24' : 'top-4'} left-4 right-4 z-[1000]`}>
          <div className="bg-card/95 backdrop-blur-xl rounded-2xl rct-shadow-elevated p-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-2xl font-extrabold rct-text-gradient">{distance.toFixed(2)}</p>
                <p className="text-xs text-muted-foreground">km</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-extrabold rct-text-gradient">{formatTime(duration)}</p>
                <p className="text-xs text-muted-foreground">temps</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-extrabold rct-text-gradient">{pace}</p>
                <p className="text-xs text-muted-foreground">min/km</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="p-6 bg-card border-t border-border safe-bottom">
        {!isTracking ? (
          <button
            onClick={startTracking}
            className="w-full h-14 rct-gradient-hero text-white font-display font-bold rounded-xl rct-glow-blue flex items-center justify-center gap-2"
          >
            <Navigation className="w-5 h-5" />
            Démarrer le suivi
          </button>
        ) : (
          <div className="flex gap-3">
            <button
              onClick={togglePause}
              className="flex-1 h-14 bg-muted text-foreground font-display font-bold rounded-xl flex items-center justify-center gap-2"
            >
              {isPaused ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
              {isPaused ? 'Reprendre' : 'Pause'}
            </button>
            <button
              onClick={stopTracking}
              className="flex-1 h-14 bg-destructive text-destructive-foreground font-display font-bold rounded-xl flex items-center justify-center gap-2"
            >
              <Square className="w-5 h-5" />
              Terminer
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default RunTrackerPage;
