'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { 
  Church, LogOut, Users, Plus, Search, Download, BarChart3, 
  Settings, User, Calendar, Phone, MapPin, Briefcase, Heart,
  Cake, Mail, FileText, Edit, Trash2, Eye, Bell, Shield,
  CheckCircle2, XCircle, UserPlus, Loader2
} from 'lucide-react';

// Types
interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

interface Person {
  id: string;
  numero: number;
  nomPrenoms: string;
  telephone: string | null;
  quartier: string | null;
  profession: string | null;
  communauteFrequentee: string | null;
  trancheAge: string | null;
  situationMatrimoniale: string | null;
  dateArrivee: string | null;
  jourAnniversaire: number | null;
  moisAnniversaire: number | null;
  accepteJesus: boolean;
  veutBapteme: boolean;
  besoinSuivi: boolean;
  voirPasteur: boolean;
  besoinPriere: boolean;
  integrerEglise: boolean;
  indecis: boolean;
  renseignementsEglise: boolean;
  email: string | null;
  matricule: string | null;
  personneRessource: string | null;
  contacts: string | null;
  photo: string | null;
  note: string | null;
  createdAt: string;
  user?: { name: string };
}

interface Stats {
  total: number;
  parTrancheAge: Array<{ trancheAge: string; _count: number }>;
  parQuartier: Array<{ quartier: string; _count: number }>;
  parProfession: Array<{ profession: string; _count: number }>;
  parPersonneRessource: Array<{ personneRessource: string; _count: number }>;
  parSituationMatrimoniale: Array<{ situationMatrimoniale: string; _count: number }>;
  spirituels: {
    accepteJesus: number;
    veutBapteme: number;
    besoinSuivi: number;
    voirPasteur: number;
    besoinPriere: number;
    integrerEglise: number;
  };
  anniversairesDuMois: Person[];
  anniversairesAujourd: Person[];
}

interface AppUser {
  id: string;
  email: string;
  name: string;
  role: string;
  active: boolean;
  createdAt: string;
}

// Options des listes déroulantes
const tranchesAge = ['10-15', '16-25', '26-35', '36-45', '+46'];
const situationsMatrimoniales = ['Célibataire', 'Fiancé.e', 'Marié.e', 'Concubinage', 'Veuf.ve', 'Divorcé.e'];
const moisNoms = ['', 'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];

export default function ChurchApp() {
  // États d'authentification
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [setupForm, setSetupForm] = useState({ email: '', password: '', name: '' });
  const [needsSetup, setNeedsSetup] = useState(false);

  // États de l'application
  const [activeTab, setActiveTab] = useState('dashboard');
  const [persons, setPersons] = useState<Person[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [searchFilters, setSearchFilters] = useState({
    nom: '', telephone: '', trancheAge: '', moisAnniversaire: '', quartier: '', moisArrivee: '', anneeArrivee: ''
  });
  
  // États du formulaire
  const [showPersonForm, setShowPersonForm] = useState(false);
  const [editingPerson, setEditingPerson] = useState<Person | null>(null);
  const [viewingPerson, setViewingPerson] = useState<Person | null>(null);
  const [personForm, setPersonForm] = useState({
    nomPrenoms: '',
    telephone: '',
    quartier: '',
    profession: '',
    communauteFrequentee: '',
    trancheAge: '',
    situationMatrimoniale: '',
    dateArrivee: '',
    jourAnniversaire: '',
    moisAnniversaire: '',
    accepteJesus: false,
    veutBapteme: false,
    besoinSuivi: false,
    voirPasteur: false,
    besoinPriere: false,
    integrerEglise: false,
    indecis: false,
    renseignementsEglise: false,
    email: '',
    matricule: '',
    personneRessource: '',
    contacts: '',
    photo: '',
    note: ''
  });

  // États gestion utilisateurs
  const [users, setUsers] = useState<AppUser[]>([]);
  const [showUserForm, setShowUserForm] = useState(false);
  const [userForm, setUserForm] = useState({ email: '', password: '', name: '', role: 'ADMIN' });

  // États configuration église
  const [churchConfig, setChurchConfig] = useState({ name: 'Mon Église', logo: '' });

  // Vérifier l'authentification
  useEffect(() => {
    async function initAuth() {
      try {
        // Vérifier si un super admin existe
        const setupRes = await fetch('/api/auth/setup');
        const setupData = await setupRes.json();
        
        if (!setupData.hasSuperAdmin) {
          setNeedsSetup(true);
          setIsLoading(false);
          return;
        }

        // Vérifier la session
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
        }
      } catch {
        console.error('Erreur auth');
      }
      setIsLoading(false);
    }
    initAuth();
  }, []);

  // Charger les données quand l'utilisateur change
  useEffect(() => {
    async function loadData() {
      if (!user) return;
      
      // Charger les personnes
      try {
        const params = new URLSearchParams();
        if (searchFilters.nom) params.append('nom', searchFilters.nom);
        if (searchFilters.telephone) params.append('telephone', searchFilters.telephone);
        if (searchFilters.trancheAge) params.append('trancheAge', searchFilters.trancheAge);
        if (searchFilters.moisAnniversaire) params.append('moisAnniversaire', searchFilters.moisAnniversaire);
        if (searchFilters.quartier) params.append('quartier', searchFilters.quartier);
        if (searchFilters.moisArrivee) params.append('moisArrivee', searchFilters.moisArrivee);
        if (searchFilters.anneeArrivee) params.append('anneeArrivee', searchFilters.anneeArrivee);

        const res = await fetch(`/api/persons?${params}`);
        if (res.ok) {
          const data = await res.json();
          setPersons(data.persons);
        }
      } catch {
        toast.error('Erreur lors du chargement des personnes');
      }

      // Charger les stats
      try {
        const res = await fetch('/api/stats');
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        }
      } catch {
        console.error('Erreur stats');
      }

      // Charger les utilisateurs si Super Admin
      if (user.role === 'SUPER_ADMIN') {
        try {
          const res = await fetch('/api/users');
          if (res.ok) {
            const data = await res.json();
            setUsers(data.users);
          }
        } catch {
          console.error('Erreur users');
        }
      }

      // Charger la configuration de l'église
      try {
        const res = await fetch('/api/church-config');
        if (res.ok) {
          const data = await res.json();
          setChurchConfig({ name: data.name || 'Mon Église', logo: data.logo || '' });
        }
      } catch {
        console.error('Erreur church config');
      }
    }
    
    loadData();
  }, [user, searchFilters]);

  // Fonctions de rechargement des données
  const loadPersons = async () => {
    try {
      const params = new URLSearchParams();
      if (searchFilters.nom) params.append('nom', searchFilters.nom);
      if (searchFilters.telephone) params.append('telephone', searchFilters.telephone);
      if (searchFilters.trancheAge) params.append('trancheAge', searchFilters.trancheAge);
      if (searchFilters.moisAnniversaire) params.append('moisAnniversaire', searchFilters.moisAnniversaire);
      if (searchFilters.quartier) params.append('quartier', searchFilters.quartier);
      if (searchFilters.moisArrivee) params.append('moisArrivee', searchFilters.moisArrivee);
      if (searchFilters.anneeArrivee) params.append('anneeArrivee', searchFilters.anneeArrivee);

      const res = await fetch(`/api/persons?${params}`);
      if (res.ok) {
        const data = await res.json();
        setPersons(data.persons);
      }
    } catch {
      toast.error('Erreur lors du chargement des personnes');
    }
  };

  const loadStats = async () => {
    try {
      const res = await fetch('/api/stats');
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch {
      console.error('Erreur stats');
    }
  };

  const loadUsers = async () => {
    try {
      const res = await fetch('/api/users');
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users);
      }
    } catch {
      console.error('Erreur users');
    }
  };

  // Handlers d'authentification
  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/auth/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(setupForm)
      });
      const data = await res.json();
      if (res.ok) {
        toast.success('Super Admin créé avec succès');
        setNeedsSetup(false);
        setSetupForm({ email: '', password: '', name: '' });
      } else {
        toast.error(data.error);
      }
    } catch {
      toast.error('Erreur lors de la création');
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginForm)
      });
      const data = await res.json();
      if (res.ok) {
        setUser(data.user);
        setLoginForm({ email: '', password: '' });
        toast.success('Connexion réussie');
      } else {
        toast.error(data.error);
      }
    } catch {
      toast.error('Erreur de connexion');
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
    toast.success('Déconnexion réussie');
  };

  // Handlers personnes
  const resetPersonForm = () => {
    setPersonForm({
      nomPrenoms: '',
      telephone: '',
      quartier: '',
      profession: '',
      communauteFrequentee: '',
      trancheAge: '',
      situationMatrimoniale: '',
      dateArrivee: '',
      jourAnniversaire: '',
      moisAnniversaire: '',
      accepteJesus: false,
      veutBapteme: false,
      besoinSuivi: false,
      voirPasteur: false,
      besoinPriere: false,
      integrerEglise: false,
      indecis: false,
      renseignementsEglise: false,
      email: '',
      matricule: '',
      personneRessource: '',
      contacts: '',
      photo: '',
      note: ''
    });
    setEditingPerson(null);
  };

  const openAddPerson = () => {
    resetPersonForm();
    setShowPersonForm(true);
  };

  const openEditPerson = (person: Person) => {
    setEditingPerson(person);
    setPersonForm({
      nomPrenoms: person.nomPrenoms,
      telephone: person.telephone || '',
      quartier: person.quartier || '',
      profession: person.profession || '',
      communauteFrequentee: person.communauteFrequentee || '',
      trancheAge: person.trancheAge || '',
      situationMatrimoniale: person.situationMatrimoniale || '',
      dateArrivee: person.dateArrivee || '',
      jourAnniversaire: person.jourAnniversaire?.toString() || '',
      moisAnniversaire: person.moisAnniversaire?.toString() || '',
      accepteJesus: person.accepteJesus,
      veutBapteme: person.veutBapteme,
      besoinSuivi: person.besoinSuivi,
      voirPasteur: person.voirPasteur,
      besoinPriere: person.besoinPriere,
      integrerEglise: person.integrerEglise,
      indecis: person.indecis,
      renseignementsEglise: person.renseignementsEglise,
      email: person.email || '',
      matricule: person.matricule || '',
      personneRessource: person.personneRessource || '',
      contacts: person.contacts || '',
      photo: person.photo || '',
      note: person.note || ''
    });
    setShowPersonForm(true);
  };

  const handleSavePerson = async () => {
    if (!personForm.nomPrenoms.trim()) {
      toast.error('Le nom est requis');
      return;
    }

    try {
      const url = editingPerson ? `/api/persons/${editingPerson.id}` : '/api/persons';
      const method = editingPerson ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(personForm)
      });

      const data = await res.json();
      if (res.ok) {
        toast.success(data.message);
        setShowPersonForm(false);
        resetPersonForm();
        loadPersons();
        loadStats();
      } else {
        // Erreur de doublon
        if (res.status === 409 && data.existingPerson) {
          toast.error(
            <div className="flex flex-col gap-2">
              <span>{data.error}</span>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => {
                  setViewingPerson(data.existingPerson);
                  setShowPersonForm(false);
                }}
              >
                Voir la personne existante
              </Button>
            </div>,
            { duration: 10000 }
          );
        } else {
          toast.error(data.error);
        }
      }
    } catch {
      toast.error('Erreur lors de l\'enregistrement');
    }
  };

  const handleDeletePerson = async (id: string) => {
    try {
      const res = await fetch(`/api/persons/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message);
        loadPersons();
        loadStats();
      } else {
        toast.error(data.error);
      }
    } catch {
      toast.error('Erreur lors de la suppression');
    }
  };

  const handleExport = async () => {
    try {
      const res = await fetch('/api/export');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `personnes_eglise_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success('Export réussi');
    } catch {
      toast.error('Erreur lors de l\'export');
    }
  };

  // Handlers utilisateurs
  const handleAddUser = async () => {
    if (!userForm.email || !userForm.password || !userForm.name) {
      toast.error('Tous les champs sont requis');
      return;
    }

    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userForm)
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message);
        setShowUserForm(false);
        setUserForm({ email: '', password: '', name: '', role: 'ADMIN' });
        loadUsers();
      } else {
        toast.error(data.error);
      }
    } catch {
      toast.error('Erreur lors de la création');
    }
  };

  const handleToggleUserActive = async (userId: string, currentActive: boolean) => {
    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !currentActive })
      });
      const data = await res.json();
      if (res.ok) {
        toast.success('Statut mis à jour');
        loadUsers();
      } else {
        toast.error(data.error);
      }
    } catch {
      toast.error('Erreur');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      const res = await fetch(`/api/users/${userId}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message);
        loadUsers();
      } else {
        toast.error(data.error);
      }
    } catch {
      toast.error('Erreur');
    }
  };

  // Handler configuration église
  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error('Le fichier est trop volumineux (max 2MB)');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setChurchConfig({ ...churchConfig, logo: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveChurchConfig = async () => {
    try {
      const res = await fetch('/api/church-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(churchConfig)
      });
      const data = await res.json();
      if (res.ok) {
        toast.success('Configuration enregistrée');
      } else {
        toast.error(data.error || 'Erreur');
      }
    } catch {
      toast.error('Erreur lors de l\'enregistrement');
    }
  };

  // Handler photo
  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPersonForm({ ...personForm, photo: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  // Loading screen
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-100">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-emerald-600 mx-auto mb-4" />
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  // Setup screen
  if (needsSetup) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-100 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <Church className="h-16 w-16 text-emerald-600" />
            </div>
            <CardTitle className="text-2xl">Configuration Initiale</CardTitle>
            <CardDescription>Créez le compte Super Administrateur</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSetup} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="setup-name">Nom complet</Label>
                <Input
                  id="setup-name"
                  value={setupForm.name}
                  onChange={(e) => setSetupForm({ ...setupForm, name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="setup-email">Email</Label>
                <Input
                  id="setup-email"
                  type="email"
                  value={setupForm.email}
                  onChange={(e) => setSetupForm({ ...setupForm, email: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="setup-password">Mot de passe</Label>
                <Input
                  id="setup-password"
                  type="password"
                  value={setupForm.password}
                  onChange={(e) => setSetupForm({ ...setupForm, password: e.target.value })}
                  required
                />
              </div>
              <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700">
                Créer le Super Admin
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Login screen
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-100 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <Church className="h-16 w-16 text-emerald-600" />
            </div>
            <CardTitle className="text-2xl">Gestion Personnes Église</CardTitle>
            <CardDescription>Connectez-vous pour accéder à l'application</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={loginForm.email}
                  onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Mot de passe</Label>
                <Input
                  id="password"
                  type="password"
                  value={loginForm.password}
                  onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                  required
                />
              </div>
              <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700">
                Se connecter
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Main app
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-teal-600 text-white shadow-lg sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Logo de l'église (60x60, rond) ou icône par défaut */}
              {churchConfig.logo ? (
                <img
                  src={churchConfig.logo}
                  alt="Logo église"
                  className="h-[60px] w-[60px] rounded-full object-cover border-2 border-white/30"
                />
              ) : (
                <div className="h-[60px] w-[60px] rounded-full bg-white/20 flex items-center justify-center">
                  <Church className="h-8 w-8" />
                </div>
              )}
              <div>
                <h1 className="text-xl font-bold">{churchConfig.name}</h1>
                <p className="text-xs text-teal-100">{user.name} ({user.role === 'SUPER_ADMIN' ? 'Super Admin' : 'Admin'})</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {stats?.anniversairesAujourd && stats.anniversairesAujourd.length > 0 && (
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="text-white relative">
                      <Bell className="h-5 w-5" />
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                        {stats.anniversairesAujourd.length}
                      </span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <Cake className="h-5 w-5 text-pink-500" />
                        Anniversaires du jour
                      </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-2">
                      {stats.anniversairesAujourd.map((p) => (
                        <div key={p.id} className="flex items-center gap-2 p-2 bg-pink-50 rounded-lg">
                          <Avatar>
                            <AvatarImage src={p.photo || undefined} />
                            <AvatarFallback>{p.nomPrenoms.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{p.nomPrenoms}</p>
                            <p className="text-sm text-gray-500">{p.telephone || 'Pas de téléphone'}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </DialogContent>
                </Dialog>
              )}
              {/* Icônes Paramètres (Super Admin uniquement) et Déconnexion */}
              <div className="flex flex-col items-center gap-1">
                {user.role === 'SUPER_ADMIN' && (
                  <Button variant="ghost" size="icon" onClick={() => setActiveTab('settings')} className="text-white h-8 w-8" title="Paramètres">
                    <Settings className="h-5 w-5" />
                  </Button>
                )}
                <Button variant="ghost" size="icon" onClick={handleLogout} className="text-white h-8 w-8" title="Déconnexion">
                  <LogOut className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:grid-cols-none lg:flex gap-1 mb-6">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Tableau de bord</span>
            </TabsTrigger>
            <TabsTrigger value="persons" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Personnes</span>
            </TabsTrigger>
            <TabsTrigger value="add" className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Ajouter</span>
            </TabsTrigger>
            {user.role === 'SUPER_ADMIN' && (
              <TabsTrigger value="users" className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                <span className="hidden sm:inline">Utilisateurs</span>
              </TabsTrigger>
            )}
          </TabsList>

          {/* Dashboard */}
          <TabsContent value="dashboard">
            <div className="space-y-6">
              {/* Stats cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-emerald-100 rounded-lg">
                        <Users className="h-6 w-6 text-emerald-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Total</p>
                        <p className="text-2xl font-bold">{stats?.total || 0}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-pink-100 rounded-lg">
                        <Cake className="h-6 w-6 text-pink-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Anniv. ce mois</p>
                        <p className="text-2xl font-bold">{stats?.anniversairesDuMois?.length || 0}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Heart className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Acceptent Jésus</p>
                        <p className="text-2xl font-bold">{stats?.spirituels?.accepteJesus || 0}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-purple-100 rounded-lg">
                        <CheckCircle2 className="h-6 w-6 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Veulent baptême</p>
                        <p className="text-2xl font-bold">{stats?.spirituels?.veutBapteme || 0}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Charts */}
              <div className="grid md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Par tranche d&apos;âge</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {stats?.parTrancheAge?.map((item) => (
                        <div key={item.trancheAge} className="flex items-center gap-2">
                          <span className="w-16 text-sm">{item.trancheAge}</span>
                          <div className="flex-1 bg-gray-100 rounded-full h-4 overflow-hidden">
                            <div 
                              className="bg-emerald-500 h-full rounded-full" 
                              style={{ width: `${(item._count / (stats?.total || 1)) * 100}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium">{item._count}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Par situation matrimoniale</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {stats?.parSituationMatrimoniale?.map((item) => (
                        <div key={item.situationMatrimoniale} className="flex items-center gap-2">
                          <span className="w-24 text-sm truncate">{item.situationMatrimoniale}</span>
                          <div className="flex-1 bg-gray-100 rounded-full h-4 overflow-hidden">
                            <div 
                              className="bg-pink-500 h-full rounded-full" 
                              style={{ width: `${(item._count / (stats?.total || 1)) * 100}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium">{item._count}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Par quartier</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-48">
                      <div className="space-y-2">
                        {stats?.parQuartier?.slice(0, 10).map((item) => (
                          <div key={item.quartier} className="flex items-center gap-2">
                            <span className="w-24 text-sm truncate">{item.quartier}</span>
                            <div className="flex-1 bg-gray-100 rounded-full h-4 overflow-hidden">
                              <div 
                                className="bg-blue-500 h-full rounded-full" 
                                style={{ width: `${(item._count / (stats?.total || 1)) * 100}%` }}
                              />
                            </div>
                            <span className="text-sm font-medium">{item._count}</span>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Besoins spirituels</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                        <Heart className="h-4 w-4 text-pink-500" />
                        <div>
                          <p className="text-xs text-gray-500">Besoin prière</p>
                          <p className="font-bold">{stats?.spirituels?.besoinPriere || 0}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                        <User className="h-4 w-4 text-blue-500" />
                        <div>
                          <p className="text-xs text-gray-500">Voir pasteur</p>
                          <p className="font-bold">{stats?.spirituels?.voirPasteur || 0}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                        <div>
                          <p className="text-xs text-gray-500">Intégrer église</p>
                          <p className="font-bold">{stats?.spirituels?.integrerEglise || 0}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                        <Settings className="h-4 w-4 text-orange-500" />
                        <div>
                          <p className="text-xs text-gray-500">Besoin suivi</p>
                          <p className="font-bold">{stats?.spirituels?.besoinSuivi || 0}</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Anniversaires du mois */}
              {stats?.anniversairesDuMois && stats.anniversairesDuMois.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Cake className="h-5 w-5 text-pink-500" />
                      Anniversaires de {moisNoms[new Date().getMonth() + 1]}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-48">
                      <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-2">
                        {stats.anniversairesDuMois.map((p) => (
                          <div key={p.id} className="flex items-center gap-2 p-2 bg-pink-50 rounded-lg">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={p.photo || undefined} />
                              <AvatarFallback>{p.nomPrenoms.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="text-sm font-medium truncate">{p.nomPrenoms}</p>
                              <p className="text-xs text-pink-600">{p.jourAnniversaire} {moisNoms[p.moisAnniversaire || 0]}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Persons list */}
          <TabsContent value="persons">
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <CardTitle>Liste des personnes</CardTitle>
                  <div className="flex gap-2">
                    <Button onClick={handleExport} variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      Export
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Filters */}
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                  <Input
                    placeholder="Rechercher par nom..."
                    value={searchFilters.nom}
                    onChange={(e) => setSearchFilters({ ...searchFilters, nom: e.target.value })}
                  />
                  <Input
                    placeholder="Téléphone (ex: 0612345678)..."
                    value={searchFilters.telephone}
                    onChange={(e) => setSearchFilters({ ...searchFilters, telephone: e.target.value })}
                  />
                  <Input
                    placeholder="Quartier..."
                    value={searchFilters.quartier}
                    onChange={(e) => setSearchFilters({ ...searchFilters, quartier: e.target.value })}
                  />
                  <Select value={searchFilters.trancheAge || 'all'} onValueChange={(v) => setSearchFilters({ ...searchFilters, trancheAge: v === 'all' ? '' : v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Âge : tous" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Âge : tous</SelectItem>
                      {tranchesAge.map((t) => (
                        <SelectItem key={t} value={t}>Âge : {t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={searchFilters.moisAnniversaire || 'all'} onValueChange={(v) => setSearchFilters({ ...searchFilters, moisAnniversaire: v === 'all' ? '' : v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Anniversaire : tous" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Anniversaire : tous</SelectItem>
                      {moisNoms.slice(1).map((m, i) => (
                        <SelectItem key={i + 1} value={(i + 1).toString()}>{m}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={searchFilters.moisArrivee || 'all'} onValueChange={(v) => setSearchFilters({ ...searchFilters, moisArrivee: v === 'all' ? '' : v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Arrivée (mois) : tous" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Arrivée (mois) : tous</SelectItem>
                      {moisNoms.slice(1).map((m, i) => (
                        <SelectItem key={i + 1} value={(i + 1).toString()}>{m}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={searchFilters.anneeArrivee || 'all'} onValueChange={(v) => setSearchFilters({ ...searchFilters, anneeArrivee: v === 'all' ? '' : v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Arrivée (année) : toutes" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Arrivée (année) : toutes</SelectItem>
                      {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i).map((y) => (
                        <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* List */}
                <ScrollArea className="h-[60vh]">
                  <div className="space-y-2">
                    {persons.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        Aucune personne trouvée
                      </div>
                    ) : (
                      persons.map((person) => (
                        <div key={person.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                          <div className="flex items-center gap-3">
                            <Avatar>
                              <AvatarImage src={person.photo || undefined} />
                              <AvatarFallback>{person.nomPrenoms.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{person.numero}. {person.nomPrenoms}</p>
                              <div className="flex flex-wrap gap-2 text-xs text-gray-500">
                                {person.telephone && (
                                  <span className="flex items-center gap-1">
                                    <Phone className="h-3 w-3" />
                                    {person.telephone}
                                  </span>
                                )}
                                {person.quartier && (
                                  <span className="flex items-center gap-1">
                                    <MapPin className="h-3 w-3" />
                                    {person.quartier}
                                  </span>
                                )}
                                {person.trancheAge && (
                                  <Badge variant="secondary" className="text-xs">{person.trancheAge}</Badge>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-1">
                            <Button size="icon" variant="ghost" onClick={() => setViewingPerson(person)}>
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button size="icon" variant="ghost" onClick={() => openEditPerson(person)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            {user.role === 'SUPER_ADMIN' && (
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button size="icon" variant="ghost" className="text-red-500 hover:text-red-700">
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Êtes-vous sûr de vouloir supprimer {person.nomPrenoms} ?
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Annuler</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDeletePerson(person.id)} className="bg-red-500 hover:bg-red-600">
                                      Supprimer
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Add person form */}
          <TabsContent value="add">
            <Card>
              <CardHeader>
                <CardTitle>Ajouter une personne</CardTitle>
                <CardDescription>Remplissez le formulaire pour enregistrer une nouvelle personne</CardDescription>
              </CardHeader>
              <CardContent>
                <PersonForm
                  form={personForm}
                  setForm={setPersonForm}
                  onSave={handleSavePerson}
                  onCancel={() => setActiveTab('persons')}
                  onPhotoChange={handlePhotoChange}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings - Super Admin uniquement */}
          {user.role === 'SUPER_ADMIN' && (
          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Paramètres
                </CardTitle>
                <CardDescription>Configuration de l&apos;application</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Church configuration */}
                <div className="space-y-4">
                  <h3 className="font-medium text-lg">Configuration de l&apos;église</h3>
                  <div className="flex items-start gap-6">
                    {/* Logo preview */}
                    <div className="flex flex-col items-center gap-2">
                      {churchConfig.logo ? (
                        <img
                          src={churchConfig.logo}
                          alt="Logo église"
                          className="h-[60px] w-[60px] rounded-full object-cover border-2 border-teal-500"
                        />
                      ) : (
                        <div className="h-[60px] w-[60px] rounded-full bg-teal-100 flex items-center justify-center border-2 border-teal-500">
                          <Church className="h-8 w-8 text-teal-600" />
                        </div>
                      )}
                      <span className="text-xs text-gray-500">60x60 px</span>
                    </div>
                    {/* Form */}
                    <div className="flex-1 space-y-4">
                      <div className="space-y-2">
                        <Label>Nom de l&apos;église</Label>
                        <Input
                          value={churchConfig.name}
                          onChange={(e) => setChurchConfig({ ...churchConfig, name: e.target.value })}
                          placeholder="Mon Église"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Logo de l&apos;église (60x60 px, rond)</Label>
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={handleLogoChange}
                        />
                        <p className="text-xs text-gray-500">Formats acceptés : JPG, PNG, GIF. Max 2MB.</p>
                      </div>
                      <Button onClick={handleSaveChurchConfig} className="bg-teal-600 hover:bg-teal-700">
                        Enregistrer la configuration
                      </Button>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Help */}
                <div className="space-y-4">
                  <h3 className="font-medium text-lg">Aide</h3>
                  <div className="text-sm text-gray-600 space-y-2">
                    <p><strong>Partager l&apos;application :</strong> Une fois déployée, partagez le lien URL avec les utilisateurs autorisés.</p>
                    <p><strong>Rôles :</strong></p>
                    <ul className="list-disc list-inside ml-4 space-y-1">
                      <li><strong>Super Admin</strong> : Accès complet, gestion des utilisateurs, suppression</li>
                      <li><strong>Admin</strong> : Création et modification des personnes uniquement</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          )}

          {/* Users management */}
          {user.role === 'SUPER_ADMIN' && (
            <TabsContent value="users">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Gestion des utilisateurs</CardTitle>
                    <Button onClick={() => setShowUserForm(true)} size="sm" className="bg-emerald-600 hover:bg-emerald-700">
                      <UserPlus className="h-4 w-4 mr-2" />
                      Ajouter
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[60vh]">
                    <div className="space-y-2">
                      {users.map((u) => (
                        <div key={u.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <Avatar>
                              <AvatarFallback>{u.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{u.name}</p>
                              <div className="flex items-center gap-2 text-xs text-gray-500">
                                <span>{u.email}</span>
                                <Badge variant={u.role === 'SUPER_ADMIN' ? 'default' : 'secondary'}>
                                  {u.role === 'SUPER_ADMIN' ? 'Super Admin' : 'Admin'}
                                </Badge>
                                <Badge variant={u.active ? 'default' : 'destructive'}>
                                  {u.active ? 'Actif' : 'Inactif'}
                                </Badge>
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleToggleUserActive(u.id, u.active)}
                            >
                              {u.active ? 'Désactiver' : 'Activer'}
                            </Button>
                            {u.id !== user.id && (
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button size="sm" variant="destructive">
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Supprimer cet utilisateur ?</AlertDialogTitle>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Annuler</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDeleteUser(u.id)} className="bg-red-500">
                                      Supprimer
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </main>

      {/* Footer */}
      <footer className="bg-gray-100 border-t py-4 mt-auto">
        <div className="container mx-auto px-4 text-center text-sm text-gray-500">
          Gestion Personnes Église © {new Date().getFullYear()}
        </div>
      </footer>

      {/* Person form dialog */}
      <Dialog open={showPersonForm} onOpenChange={setShowPersonForm}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingPerson ? 'Modifier' : 'Ajouter'} une personne</DialogTitle>
          </DialogHeader>
          <PersonForm
            form={personForm}
            setForm={setPersonForm}
            onSave={handleSavePerson}
            onCancel={() => { setShowPersonForm(false); resetPersonForm(); }}
            onPhotoChange={handlePhotoChange}
            isEdit={!!editingPerson}
          />
        </DialogContent>
      </Dialog>

      {/* View person dialog */}
      <Dialog open={!!viewingPerson} onOpenChange={() => setViewingPerson(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Détails de la personne</DialogTitle>
          </DialogHeader>
          {viewingPerson && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={viewingPerson.photo || undefined} />
                  <AvatarFallback className="text-2xl">{viewingPerson.nomPrenoms.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-xl font-bold">{viewingPerson.numero}. {viewingPerson.nomPrenoms}</h3>
                  {viewingPerson.trancheAge && <Badge>{viewingPerson.trancheAge}</Badge>}
                  {viewingPerson.situationMatrimoniale && <Badge variant="secondary" className="ml-2">{viewingPerson.situationMatrimoniale}</Badge>}
                </div>
              </div>

              <Separator />

              <div className="grid sm:grid-cols-2 gap-4">
                {viewingPerson.telephone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <span>{viewingPerson.telephone}</span>
                  </div>
                )}
                {viewingPerson.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <span>{viewingPerson.email}</span>
                  </div>
                )}
                {viewingPerson.quartier && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-gray-400" />
                    <span>{viewingPerson.quartier}</span>
                  </div>
                )}
                {viewingPerson.profession && (
                  <div className="flex items-center gap-2">
                    <Briefcase className="h-4 w-4 text-gray-400" />
                    <span>{viewingPerson.profession}</span>
                  </div>
                )}
                {viewingPerson.jourAnniversaire && viewingPerson.moisAnniversaire && (
                  <div className="flex items-center gap-2">
                    <Cake className="h-4 w-4 text-pink-400" />
                    <span>{viewingPerson.jourAnniversaire} {moisNoms[viewingPerson.moisAnniversaire]}</span>
                  </div>
                )}
                {viewingPerson.dateArrivee && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span>Arrivé(e) le {viewingPerson.dateArrivee}</span>
                  </div>
                )}
              </div>

              {viewingPerson.communauteFrequentee && (
                <div>
                  <p className="text-sm text-gray-500">Communauté fréquentée</p>
                  <p>{viewingPerson.communauteFrequentee}</p>
                </div>
              )}

              <Separator />

              <div>
                <h4 className="font-medium mb-2">Besoins spirituels</h4>
                <div className="flex flex-wrap gap-2">
                  {viewingPerson.accepteJesus && <Badge className="bg-green-100 text-green-800">Accepte Jésus</Badge>}
                  {viewingPerson.veutBapteme && <Badge className="bg-blue-100 text-blue-800">Veut baptême</Badge>}
                  {viewingPerson.besoinSuivi && <Badge className="bg-orange-100 text-orange-800">Besoin suivi</Badge>}
                  {viewingPerson.voirPasteur && <Badge className="bg-purple-100 text-purple-800">Voir pasteur</Badge>}
                  {viewingPerson.besoinPriere && <Badge className="bg-pink-100 text-pink-800">Besoin prière</Badge>}
                  {viewingPerson.integrerEglise && <Badge className="bg-teal-100 text-teal-800">Intégrer église</Badge>}
                  {viewingPerson.indecis && <Badge className="bg-gray-100 text-gray-800">Indécis</Badge>}
                  {viewingPerson.renseignementsEglise && <Badge className="bg-cyan-100 text-cyan-800">Renseignements</Badge>}
                </div>
              </div>

              {viewingPerson.note && (
                <div>
                  <p className="text-sm text-gray-500">Notes</p>
                  <p className="text-sm">{viewingPerson.note}</p>
                </div>
              )}

              <div className="text-xs text-gray-400">
                Enregistré par {viewingPerson.user?.name || 'Inconnu'} le {new Date(viewingPerson.createdAt).toLocaleDateString('fr-FR')}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewingPerson(null)}>Fermer</Button>
            <Button onClick={() => { setViewingPerson(null); openEditPerson(viewingPerson!); }}>
              <Edit className="h-4 w-4 mr-2" /> Modifier
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* User form dialog */}
      <Dialog open={showUserForm} onOpenChange={setShowUserForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajouter un utilisateur</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nom complet</Label>
              <Input
                value={userForm.name}
                onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={userForm.email}
                onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Mot de passe</Label>
              <Input
                type="password"
                value={userForm.password}
                onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Rôle</Label>
              <Select value={userForm.role} onValueChange={(v) => setUserForm({ ...userForm, role: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                  <SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUserForm(false)}>Annuler</Button>
            <Button onClick={handleAddUser} className="bg-emerald-600 hover:bg-emerald-700">Créer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Person form component
interface PersonFormProps {
  form: typeof personForm;
  setForm: React.Dispatch<React.SetStateAction<typeof personForm>>;
  onSave: () => void;
  onCancel: () => void;
  onPhotoChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isEdit?: boolean;
}

function PersonForm({ form, setForm, onSave, onCancel, onPhotoChange, isEdit }: PersonFormProps) {
  return (
    <div className="space-y-6">
      {/* Photo */}
      <div className="flex items-center gap-4">
        <Avatar className="h-20 w-20">
          <AvatarImage src={form.photo || undefined} />
          <AvatarFallback className="text-2xl">{form.nomPrenoms.charAt(0) || '?'}</AvatarFallback>
        </Avatar>
        <div>
          <Label htmlFor="photo">Photo</Label>
          <Input id="photo" type="file" accept="image/*" onChange={onPhotoChange} className="w-full" />
        </div>
      </div>

      {/* Infos personnelles */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-2 sm:col-span-2">
          <Label>Nom & Prénoms *</Label>
          <Input
            value={form.nomPrenoms}
            onChange={(e) => setForm({ ...form, nomPrenoms: e.target.value })}
            placeholder="Nom complet"
          />
        </div>
        <div className="space-y-2">
          <Label>Téléphone(s)</Label>
          <Input
            value={form.telephone}
            onChange={(e) => setForm({ ...form, telephone: e.target.value })}
            placeholder="Ex: 0612345678 / 0798765432"
          />
          <p className="text-xs text-gray-500">Séparez plusieurs numéros par / ou ,</p>
        </div>
        <div className="space-y-2">
          <Label>Email</Label>
          <Input
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="Adresse email"
          />
        </div>
        <div className="space-y-2">
          <Label>Quartier</Label>
          <Input
            value={form.quartier}
            onChange={(e) => setForm({ ...form, quartier: e.target.value })}
            placeholder="Quartier"
          />
        </div>
        <div className="space-y-2">
          <Label>Profession</Label>
          <Input
            value={form.profession}
            onChange={(e) => setForm({ ...form, profession: e.target.value })}
            placeholder="Profession"
          />
        </div>
      </div>

      {/* Infos église */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Communauté fréquentée</Label>
          <Input
            value={form.communauteFrequentee}
            onChange={(e) => setForm({ ...form, communauteFrequentee: e.target.value })}
            placeholder="Communauté"
          />
        </div>
        <div className="space-y-2">
          <Label>Date d&apos;arrivée</Label>
          <Input
            value={form.dateArrivee}
            onChange={(e) => setForm({ ...form, dateArrivee: e.target.value })}
            placeholder="DD/MM/YYYY"
          />
        </div>
        <div className="space-y-2">
          <Label>Tranche d&apos;âge</Label>
          <Select value={form.trancheAge} onValueChange={(v) => setForm({ ...form, trancheAge: v })}>
            <SelectTrigger>
              <SelectValue placeholder="Sélectionner" />
            </SelectTrigger>
            <SelectContent>
              {tranchesAge.map((t) => (
                <SelectItem key={t} value={t}>{t}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Situation matrimoniale</Label>
          <Select value={form.situationMatrimoniale} onValueChange={(v) => setForm({ ...form, situationMatrimoniale: v })}>
            <SelectTrigger>
              <SelectValue placeholder="Sélectionner" />
            </SelectTrigger>
            <SelectContent>
              {situationsMatrimoniales.map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Anniversaire */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Jour d&apos;anniversaire</Label>
          <Select value={form.jourAnniversaire} onValueChange={(v) => setForm({ ...form, jourAnniversaire: v })}>
            <SelectTrigger>
              <SelectValue placeholder="Jour" />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                <SelectItem key={d} value={d.toString()}>{d}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Mois d&apos;anniversaire</Label>
          <Select value={form.moisAnniversaire} onValueChange={(v) => setForm({ ...form, moisAnniversaire: v })}>
            <SelectTrigger>
              <SelectValue placeholder="Mois" />
            </SelectTrigger>
            <SelectContent>
              {moisNoms.slice(1).map((m, i) => (
                <SelectItem key={i + 1} value={(i + 1).toString()}>{m}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Besoins spirituels */}
      <div>
        <Label className="mb-2 block">Besoins spirituels</Label>
        <div className="grid sm:grid-cols-2 gap-2">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="accepteJesus"
              checked={form.accepteJesus}
              onCheckedChange={(c) => setForm({ ...form, accepteJesus: !!c })}
            />
            <Label htmlFor="accepteJesus" className="font-normal">J&apos;accepte Jésus</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="veutBapteme"
              checked={form.veutBapteme}
              onCheckedChange={(c) => setForm({ ...form, veutBapteme: !!c })}
            />
            <Label htmlFor="veutBapteme" className="font-normal">Je veux être baptisé</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="besoinSuivi"
              checked={form.besoinSuivi}
              onCheckedChange={(c) => setForm({ ...form, besoinSuivi: !!c })}
            />
            <Label htmlFor="besoinSuivi" className="font-normal">Besoin de suivi</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="voirPasteur"
              checked={form.voirPasteur}
              onCheckedChange={(c) => setForm({ ...form, voirPasteur: !!c })}
            />
            <Label htmlFor="voirPasteur" className="font-normal">Voir un pasteur</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="besoinPriere"
              checked={form.besoinPriere}
              onCheckedChange={(c) => setForm({ ...form, besoinPriere: !!c })}
            />
            <Label htmlFor="besoinPriere" className="font-normal">Besoin de prière</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="integrerEglise"
              checked={form.integrerEglise}
              onCheckedChange={(c) => setForm({ ...form, integrerEglise: !!c })}
            />
            <Label htmlFor="integrerEglise" className="font-normal">Intégrer l&apos;Église</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="indecis"
              checked={form.indecis}
              onCheckedChange={(c) => setForm({ ...form, indecis: !!c })}
            />
            <Label htmlFor="indecis" className="font-normal">Je suis indécis</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="renseignementsEglise"
              checked={form.renseignementsEglise}
              onCheckedChange={(c) => setForm({ ...form, renseignementsEglise: !!c })}
            />
            <Label htmlFor="renseignementsEglise" className="font-normal">Renseignements sur l&apos;Église</Label>
          </div>
        </div>
      </div>

      {/* Autres infos */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Matricule</Label>
          <Input
            value={form.matricule}
            onChange={(e) => setForm({ ...form, matricule: e.target.value })}
            placeholder="Matricule"
          />
        </div>
        <div className="space-y-2">
          <Label>Personne ressource</Label>
          <Input
            value={form.personneRessource}
            onChange={(e) => setForm({ ...form, personneRessource: e.target.value })}
            placeholder="Personne ressource"
          />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label>Contacts (Téléphone personne ressource)</Label>
          <Input
            value={form.contacts}
            onChange={(e) => setForm({ ...form, contacts: e.target.value })}
            placeholder="Téléphone de la personne ressource"
          />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label>Notes</Label>
          <Textarea
            value={form.note}
            onChange={(e) => setForm({ ...form, note: e.target.value })}
            placeholder="Notes additionnelles"
            rows={3}
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-2 pt-4">
        <Button variant="outline" onClick={onCancel}>Annuler</Button>
        <Button onClick={onSave} className="bg-emerald-600 hover:bg-emerald-700">
          {isEdit ? 'Mettre à jour' : 'Enregistrer'}
        </Button>
      </div>
    </div>
  );
}
