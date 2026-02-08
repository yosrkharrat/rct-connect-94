import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, Target, Scale, Ruler, Flame, Apple, Coffee, Moon, Sun, TrendingUp, Edit2, Check, X, Mic } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface FoodEntry {
  id: string;
  name: string;
  calories: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  meal: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  timestamp: string;
}

interface UserProfile {
  height: number; // cm
  weight: number; // kg
  age: number;
  gender: 'male' | 'female';
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
  goal: 'lose' | 'maintain' | 'gain';
}

interface DailyLog {
  date: string;
  foods: FoodEntry[];
  waterGlasses: number;
}

const MEAL_ICONS = {
  breakfast: Coffee,
  lunch: Sun,
  dinner: Moon,
  snack: Apple,
};

const MEAL_LABELS = {
  breakfast: 'Petit-déjeuner',
  lunch: 'Déjeuner',
  dinner: 'Dîner',
  snack: 'Collation',
};

const ACTIVITY_MULTIPLIERS = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

const CalorieTrackerPage = () => {
  const navigate = useNavigate();
  const { user, isLoggedIn } = useAuth();
  const [voiceAction, setVoiceAction] = useState<string | null>(null);
  
  const [profile, setProfile] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('rct_calorie_profile');
    return saved ? JSON.parse(saved) : {
      height: 170,
      weight: 70,
      age: 30,
      gender: 'male',
      activityLevel: 'moderate',
      goal: 'maintain',
    };
  });

  const [dailyLog, setDailyLog] = useState<DailyLog>(() => {
    const today = new Date().toISOString().split('T')[0];
    const saved = localStorage.getItem(`rct_calorie_log_${today}`);
    return saved ? JSON.parse(saved) : {
      date: today,
      foods: [],
      waterGlasses: 0,
    };
  });

  const [showAddFood, setShowAddFood] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [selectedMeal, setSelectedMeal] = useState<'breakfast' | 'lunch' | 'dinner' | 'snack'>('breakfast');
  const [newFood, setNewFood] = useState({ name: '', calories: '', protein: '', carbs: '', fat: '' });

  // Listen for voice commands
  useEffect(() => {
    const handleVoiceAddCalorie = (event: CustomEvent) => {
      const entry = event.detail;
      if (entry) {
        const food: FoodEntry = {
          id: entry.id || Date.now().toString(),
          name: entry.name || 'Food',
          calories: parseInt(entry.calories) || 0,
          protein: entry.protein ? parseInt(entry.protein) : undefined,
          carbs: entry.carbs ? parseInt(entry.carbs) : undefined,
          fat: entry.fat ? parseInt(entry.fat) : undefined,
          meal: entry.meal || 'snack',
          timestamp: new Date().toISOString(),
        };
        setDailyLog(prev => ({
          ...prev,
          foods: [...prev.foods, food],
        }));
        setVoiceAction(`Ajouté: ${food.name} (${food.calories} kcal)`);
        setTimeout(() => setVoiceAction(null), 3000);
      }
    };

    const handleVoiceUpdateProfile = (event: CustomEvent) => {
      const update = event.detail;
      if (update) {
        setProfile(prev => ({
          ...prev,
          ...(update.height && { height: parseInt(update.height) }),
          ...(update.weight && { weight: parseInt(update.weight) }),
          ...(update.age && { age: parseInt(update.age) }),
          ...(update.gender && { gender: update.gender }),
          ...(update.activityLevel && { activityLevel: update.activityLevel }),
          ...(update.goal && { goal: update.goal }),
        }));
        setVoiceAction('Profil mis à jour');
        setTimeout(() => setVoiceAction(null), 3000);
      }
    };

    const handleVoiceAddWater = (event: CustomEvent) => {
      const { glasses } = event.detail || { glasses: 1 };
      setDailyLog(prev => ({
        ...prev,
        waterGlasses: prev.waterGlasses + (glasses || 1),
      }));
      setVoiceAction(`+${glasses} verre(s) d'eau`);
      setTimeout(() => setVoiceAction(null), 3000);
    };

    window.addEventListener('voice-add-calorie', handleVoiceAddCalorie as EventListener);
    window.addEventListener('voice-update-calorie-profile', handleVoiceUpdateProfile as EventListener);
    window.addEventListener('voice-add-water', handleVoiceAddWater as EventListener);

    // Also check sessionStorage for any pending voice actions
    const pendingEntry = sessionStorage.getItem('voice_calorie_entry');
    if (pendingEntry) {
      try {
        const entry = JSON.parse(pendingEntry);
        handleVoiceAddCalorie({ detail: entry } as CustomEvent);
        sessionStorage.removeItem('voice_calorie_entry');
      } catch (e) {}
    }

    const pendingProfile = sessionStorage.getItem('voice_calorie_profile_update');
    if (pendingProfile) {
      try {
        const update = JSON.parse(pendingProfile);
        handleVoiceUpdateProfile({ detail: update } as CustomEvent);
        sessionStorage.removeItem('voice_calorie_profile_update');
      } catch (e) {}
    }

    const pendingWater = sessionStorage.getItem('voice_water_add');
    if (pendingWater) {
      try {
        const data = JSON.parse(pendingWater);
        handleVoiceAddWater({ detail: data } as CustomEvent);
        sessionStorage.removeItem('voice_water_add');
      } catch (e) {}
    }

    return () => {
      window.removeEventListener('voice-add-calorie', handleVoiceAddCalorie as EventListener);
      window.removeEventListener('voice-update-calorie-profile', handleVoiceUpdateProfile as EventListener);
      window.removeEventListener('voice-add-water', handleVoiceAddWater as EventListener);
    };
  }, []);

  // Save profile to localStorage
  useEffect(() => {
    localStorage.setItem('rct_calorie_profile', JSON.stringify(profile));
  }, [profile]);

  // Save daily log to localStorage
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    localStorage.setItem(`rct_calorie_log_${today}`, JSON.stringify(dailyLog));
  }, [dailyLog]);

  // Calculate BMR (Basal Metabolic Rate) using Mifflin-St Jeor Equation
  const calculateBMR = () => {
    if (profile.gender === 'male') {
      return 10 * profile.weight + 6.25 * profile.height - 5 * profile.age + 5;
    } else {
      return 10 * profile.weight + 6.25 * profile.height - 5 * profile.age - 161;
    }
  };

  // Calculate TDEE (Total Daily Energy Expenditure)
  const calculateTDEE = () => {
    const bmr = calculateBMR();
    return Math.round(bmr * ACTIVITY_MULTIPLIERS[profile.activityLevel]);
  };

  // Calculate daily calorie goal based on user's goal
  const calculateCalorieGoal = () => {
    const tdee = calculateTDEE();
    switch (profile.goal) {
      case 'lose': return Math.round(tdee - 500); // 500 calorie deficit
      case 'gain': return Math.round(tdee + 300); // 300 calorie surplus
      default: return tdee;
    }
  };

  // Calculate BMI
  const calculateBMI = () => {
    const heightM = profile.height / 100;
    return (profile.weight / (heightM * heightM)).toFixed(1);
  };

  const getBMICategory = (bmi: number) => {
    if (bmi < 18.5) return { label: 'Insuffisant', color: 'text-blue-500' };
    if (bmi < 25) return { label: 'Normal', color: 'text-green-500' };
    if (bmi < 30) return { label: 'Surpoids', color: 'text-yellow-500' };
    return { label: 'Obésité', color: 'text-red-500' };
  };

  // Calculate totals for the day
  const dailyTotals = dailyLog.foods.reduce(
    (acc, food) => ({
      calories: acc.calories + food.calories,
      protein: acc.protein + (food.protein || 0),
      carbs: acc.carbs + (food.carbs || 0),
      fat: acc.fat + (food.fat || 0),
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  const calorieGoal = calculateCalorieGoal();
  const caloriesRemaining = calorieGoal - dailyTotals.calories;
  const progressPercent = Math.min((dailyTotals.calories / calorieGoal) * 100, 100);

  const handleAddFood = () => {
    if (!newFood.name || !newFood.calories) return;

    const food: FoodEntry = {
      id: Date.now().toString(),
      name: newFood.name,
      calories: parseInt(newFood.calories) || 0,
      protein: parseInt(newFood.protein) || 0,
      carbs: parseInt(newFood.carbs) || 0,
      fat: parseInt(newFood.fat) || 0,
      meal: selectedMeal,
      timestamp: new Date().toISOString(),
    };

    setDailyLog(prev => ({
      ...prev,
      foods: [...prev.foods, food],
    }));

    setNewFood({ name: '', calories: '', protein: '', carbs: '', fat: '' });
    setShowAddFood(false);
  };

  const handleDeleteFood = (id: string) => {
    setDailyLog(prev => ({
      ...prev,
      foods: prev.foods.filter(f => f.id !== id),
    }));
  };

  const addWater = () => {
    setDailyLog(prev => ({
      ...prev,
      waterGlasses: prev.waterGlasses + 1,
    }));
  };

  const bmi = parseFloat(calculateBMI());
  const bmiCategory = getBMICategory(bmi);

  if (!isLoggedIn) {
    return (
      <div className="pb-20 pt-6 px-4">
        <h1 className="font-display font-extrabold text-2xl mb-4">Suivi Calories</h1>
        <div className="bg-card rounded-2xl rct-shadow-card p-8 text-center space-y-4">
          <Flame className="w-12 h-12 text-orange-500 mx-auto" />
          <p className="text-muted-foreground">Connectez-vous pour suivre vos calories</p>
          <button onClick={() => navigate('/login')}
            className="rct-gradient-hero text-white px-6 py-3 rounded-xl font-semibold">
            Se connecter
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-20 pt-6">
      {/* Voice Action Toast */}
      {voiceAction && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-primary text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2 animate-slide-up">
          <Mic className="w-4 h-4" />
          <span className="text-sm font-medium">{voiceAction}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center gap-3 px-4 mb-6">
        <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="font-display font-extrabold text-xl">Suivi Calories</h1>
      </div>

      {/* Daily Progress Card */}
      <div className="mx-4 bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl p-5 mb-4 text-white">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm opacity-90">Aujourd'hui</p>
            <p className="text-3xl font-bold">{dailyTotals.calories}</p>
            <p className="text-sm opacity-90">/ {calorieGoal} kcal</p>
          </div>
          <div className="text-right">
            <Flame className="w-10 h-10 mb-1" />
            <p className="text-sm font-semibold">
              {caloriesRemaining > 0 ? `${caloriesRemaining} restant` : `${Math.abs(caloriesRemaining)} excess`}
            </p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-3 bg-white/30 rounded-full overflow-hidden">
          <div 
            className={`h-full rounded-full transition-all duration-500 ${
              progressPercent > 100 ? 'bg-red-300' : 'bg-white'
            }`}
            style={{ width: `${Math.min(progressPercent, 100)}%` }}
          />
        </div>

        {/* Macros */}
        <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-white/20">
          <div className="text-center">
            <p className="text-lg font-bold">{dailyTotals.protein}g</p>
            <p className="text-xs opacity-80">Protéines</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold">{dailyTotals.carbs}g</p>
            <p className="text-xs opacity-80">Glucides</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold">{dailyTotals.fat}g</p>
            <p className="text-xs opacity-80">Lipides</p>
          </div>
        </div>
      </div>

      {/* Profile Stats */}
      <div className="mx-4 bg-card rounded-2xl rct-shadow-card p-4 mb-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-sm">Mon profil</h3>
          <button 
            onClick={() => setShowEditProfile(true)}
            className="text-primary text-sm font-semibold flex items-center gap-1"
          >
            <Edit2 className="w-4 h-4" /> Modifier
          </button>
        </div>
        <div className="grid grid-cols-4 gap-3">
          <div className="text-center p-2 bg-muted rounded-lg">
            <Ruler className="w-4 h-4 mx-auto mb-1 text-muted-foreground" />
            <p className="font-bold text-sm">{profile.height}</p>
            <p className="text-[10px] text-muted-foreground">cm</p>
          </div>
          <div className="text-center p-2 bg-muted rounded-lg">
            <Scale className="w-4 h-4 mx-auto mb-1 text-muted-foreground" />
            <p className="font-bold text-sm">{profile.weight}</p>
            <p className="text-[10px] text-muted-foreground">kg</p>
          </div>
          <div className="text-center p-2 bg-muted rounded-lg">
            <TrendingUp className="w-4 h-4 mx-auto mb-1 text-muted-foreground" />
            <p className={`font-bold text-sm ${bmiCategory.color}`}>{bmi}</p>
            <p className="text-[10px] text-muted-foreground">IMC</p>
          </div>
          <div className="text-center p-2 bg-muted rounded-lg">
            <Target className="w-4 h-4 mx-auto mb-1 text-muted-foreground" />
            <p className="font-bold text-sm">{calorieGoal}</p>
            <p className="text-[10px] text-muted-foreground">kcal/j</p>
          </div>
        </div>
        <p className={`text-xs text-center mt-2 ${bmiCategory.color}`}>
          IMC: {bmiCategory.label}
        </p>
      </div>

      {/* Water Tracker */}
      <div className="mx-4 bg-card rounded-2xl rct-shadow-card p-4 mb-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-sm">Eau 💧</h3>
            <p className="text-xs text-muted-foreground">{dailyLog.waterGlasses} / 8 verres</p>
          </div>
          <button 
            onClick={addWater}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-semibold"
          >
            + Ajouter
          </button>
        </div>
        <div className="flex gap-1 mt-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div 
              key={i}
              className={`flex-1 h-2 rounded-full ${
                i < dailyLog.waterGlasses ? 'bg-blue-500' : 'bg-muted'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Food Log by Meal */}
      <div className="mx-4 mb-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold">Journal alimentaire</h3>
          <button 
            onClick={() => setShowAddFood(true)}
            className="w-8 h-8 rounded-full rct-gradient-hero flex items-center justify-center"
          >
            <Plus className="w-4 h-4 text-white" />
          </button>
        </div>

        {(['breakfast', 'lunch', 'dinner', 'snack'] as const).map(meal => {
          const MealIcon = MEAL_ICONS[meal];
          const mealFoods = dailyLog.foods.filter(f => f.meal === meal);
          const mealCalories = mealFoods.reduce((sum, f) => sum + f.calories, 0);

          return (
            <div key={meal} className="bg-card rounded-xl rct-shadow-card mb-3 overflow-hidden">
              <div className="flex items-center justify-between p-3 border-b border-border">
                <div className="flex items-center gap-2">
                  <MealIcon className="w-5 h-5 text-primary" />
                  <span className="font-semibold text-sm">{MEAL_LABELS[meal]}</span>
                </div>
                <span className="text-sm font-bold text-muted-foreground">{mealCalories} kcal</span>
              </div>
              {mealFoods.length > 0 ? (
                <div className="divide-y divide-border">
                  {mealFoods.map(food => (
                    <div key={food.id} className="flex items-center justify-between p-3">
                      <div>
                        <p className="text-sm font-medium">{food.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {food.protein}g P · {food.carbs}g G · {food.fat}g L
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold">{food.calories}</span>
                        <button 
                          onClick={() => handleDeleteFood(food.id)}
                          className="w-6 h-6 rounded-full bg-destructive/10 flex items-center justify-center"
                        >
                          <Trash2 className="w-3 h-3 text-destructive" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="p-3 text-xs text-muted-foreground text-center">Aucun aliment ajouté</p>
              )}
            </div>
          );
        })}
      </div>

      {/* Add Food Modal */}
      {showAddFood && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center">
          <div className="bg-card w-full sm:w-96 sm:rounded-2xl rounded-t-2xl p-6 max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom duration-300">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-bold text-lg">Ajouter un aliment</h3>
              <button 
                onClick={() => setShowAddFood(false)}
                className="w-8 h-8 rounded-full bg-muted flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Meal Selection */}
            <div className="grid grid-cols-4 gap-2 mb-4">
              {(['breakfast', 'lunch', 'dinner', 'snack'] as const).map(meal => {
                const MealIcon = MEAL_ICONS[meal];
                return (
                  <button
                    key={meal}
                    onClick={() => setSelectedMeal(meal)}
                    className={`p-2 rounded-lg flex flex-col items-center gap-1 transition-all ${
                      selectedMeal === meal 
                        ? 'bg-primary text-white' 
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    <MealIcon className="w-4 h-4" />
                    <span className="text-[10px] font-medium">{MEAL_LABELS[meal].split('-')[0]}</span>
                  </button>
                );
              })}
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium mb-1 block">Nom de l'aliment *</label>
                <input
                  type="text"
                  value={newFood.name}
                  onChange={(e) => setNewFood({ ...newFood, name: e.target.value })}
                  placeholder="Ex: Salade César"
                  className="w-full px-4 py-3 rounded-xl bg-muted outline-none"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Calories (kcal) *</label>
                <input
                  type="number"
                  value={newFood.calories}
                  onChange={(e) => setNewFood({ ...newFood, calories: e.target.value })}
                  placeholder="350"
                  className="w-full px-4 py-3 rounded-xl bg-muted outline-none"
                />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-xs font-medium mb-1 block">Protéines (g)</label>
                  <input
                    type="number"
                    value={newFood.protein}
                    onChange={(e) => setNewFood({ ...newFood, protein: e.target.value })}
                    placeholder="0"
                    className="w-full px-3 py-2 rounded-lg bg-muted outline-none text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium mb-1 block">Glucides (g)</label>
                  <input
                    type="number"
                    value={newFood.carbs}
                    onChange={(e) => setNewFood({ ...newFood, carbs: e.target.value })}
                    placeholder="0"
                    className="w-full px-3 py-2 rounded-lg bg-muted outline-none text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium mb-1 block">Lipides (g)</label>
                  <input
                    type="number"
                    value={newFood.fat}
                    onChange={(e) => setNewFood({ ...newFood, fat: e.target.value })}
                    placeholder="0"
                    className="w-full px-3 py-2 rounded-lg bg-muted outline-none text-sm"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowAddFood(false)}
                className="flex-1 py-3 rounded-xl bg-muted font-semibold"
              >
                Annuler
              </button>
              <button
                onClick={handleAddFood}
                disabled={!newFood.name || !newFood.calories}
                className="flex-1 py-3 rounded-xl rct-gradient-hero text-white font-semibold disabled:opacity-50"
              >
                Ajouter
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Profile Modal */}
      {showEditProfile && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center">
          <div className="bg-card w-full sm:w-96 sm:rounded-2xl rounded-t-2xl p-6 max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom duration-300">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-bold text-lg">Mon profil santé</h3>
              <button 
                onClick={() => setShowEditProfile(false)}
                className="w-8 h-8 rounded-full bg-muted flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium mb-1 block">Taille (cm)</label>
                  <input
                    type="number"
                    value={profile.height}
                    onChange={(e) => setProfile({ ...profile, height: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-3 rounded-xl bg-muted outline-none"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Poids (kg)</label>
                  <input
                    type="number"
                    value={profile.weight}
                    onChange={(e) => setProfile({ ...profile, weight: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-3 rounded-xl bg-muted outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium mb-1 block">Âge</label>
                  <input
                    type="number"
                    value={profile.age}
                    onChange={(e) => setProfile({ ...profile, age: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-3 rounded-xl bg-muted outline-none"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Sexe</label>
                  <select
                    value={profile.gender}
                    onChange={(e) => setProfile({ ...profile, gender: e.target.value as 'male' | 'female' })}
                    className="w-full px-4 py-3 rounded-xl bg-muted outline-none"
                  >
                    <option value="male">Homme</option>
                    <option value="female">Femme</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">Niveau d'activité</label>
                <select
                  value={profile.activityLevel}
                  onChange={(e) => setProfile({ ...profile, activityLevel: e.target.value as any })}
                  className="w-full px-4 py-3 rounded-xl bg-muted outline-none"
                >
                  <option value="sedentary">Sédentaire (peu ou pas d'exercice)</option>
                  <option value="light">Légèrement actif (1-3 jours/sem)</option>
                  <option value="moderate">Modérément actif (3-5 jours/sem)</option>
                  <option value="active">Très actif (6-7 jours/sem)</option>
                  <option value="very_active">Extrêmement actif (athlète)</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">Objectif</label>
                <select
                  value={profile.goal}
                  onChange={(e) => setProfile({ ...profile, goal: e.target.value as 'lose' | 'maintain' | 'gain' })}
                  className="w-full px-4 py-3 rounded-xl bg-muted outline-none"
                >
                  <option value="lose">Perdre du poids (-500 kcal/j)</option>
                  <option value="maintain">Maintenir le poids</option>
                  <option value="gain">Prendre du poids (+300 kcal/j)</option>
                </select>
              </div>

              {/* Calculated values preview */}
              <div className="bg-muted rounded-xl p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">IMC:</span>
                  <span className={`font-bold ${bmiCategory.color}`}>{bmi} ({bmiCategory.label})</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Métabolisme de base:</span>
                  <span className="font-bold">{Math.round(calculateBMR())} kcal</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Dépense quotidienne:</span>
                  <span className="font-bold">{calculateTDEE()} kcal</span>
                </div>
                <div className="flex justify-between text-sm border-t border-border pt-2 mt-2">
                  <span className="font-semibold">Objectif calorique:</span>
                  <span className="font-bold text-primary">{calculateCalorieGoal()} kcal/j</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowEditProfile(false)}
              className="w-full mt-6 py-3 rounded-xl rct-gradient-hero text-white font-semibold"
            >
              <Check className="w-4 h-4 inline mr-2" />
              Enregistrer
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CalorieTrackerPage;
