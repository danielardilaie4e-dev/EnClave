import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/useAuth';
import { createUserProfile, SocialPlatform, UserProfile } from '../lib/userService';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Badge } from '../components/ui/badge';
import { Music, Building2, ArrowRight, Plus, Trash2, Check, Star } from 'lucide-react';
import { toast } from 'sonner';
import { clearOnboardingIntent, hasOnboardingIntent } from '../lib/onboardingIntent';
import { SubscriptionPlan, SUBSCRIPTION_PLANS, getPlanDetails } from '../lib/subscriptionPlans';

const SOCIAL_OPTIONS: { value: SocialPlatform; label: string }[] = [
  { value: 'facebook', label: 'Facebook' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'x', label: 'X' },
  { value: 'tiktok', label: 'TikTok' },
];

const BUSINESS_TYPE_OPTIONS = [
  'Restaurante',
  'Bar',
  'Bar restaurante',
  'Hotel',
  'Hostal',
  'Club nocturno',
  'Discoteca',
  'Café cultural',
  'Teatro',
  'Auditorio',
  'Centro de eventos',
  'Salón de eventos',
  'Parque temático',
  'Parque público',
  'Centro comercial',
  'Casino',
  'Plaza de mercado / gastronómica',
  'Festival / feria',
  'Agencia de eventos privados',
  'Empresa de bodas y celebraciones',
  'Productora de conciertos',
  'Empresa de activaciones de marca',
  'Universidad / institución educativa',
  'Iglesia / comunidad religiosa',
  'Corporativo / empresa privada',
];

export default function Onboarding() {
  const { user, profile, loading: authLoading, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [role, setRole] = useState<'musician' | 'employer' | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPasswords, setShowPasswords] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan>('free');
  const [formData, setFormData] = useState({
    fullName: '',
    documentId: '',
    age: '',
    email: (user?.email || '').trim().toLowerCase(),
    password: '',
    confirmPassword: '',
    phone: '',
    socialLinks: [] as { platform: SocialPlatform; url: string }[],
    socialPlatform: '' as '' | SocialPlatform,
    socialProfileUrl: '',
    bio: '',
    location: 'Cali, Valle del Cauca',
    address: '',
    establishmentType: '',
    hasAgeRestriction: 'no',
    minEntryAge: '',
    maxEntryAge: '',
  });

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      navigate('/auth', { replace: true });
      return;
    }

    if (!hasOnboardingIntent(user.uid)) {
      navigate('/dashboard', { replace: true });
      return;
    }

    if (profile) {
      navigate('/dashboard', { replace: true });
    }
  }, [authLoading, user, profile, navigate]);

  if (authLoading) {
    return null;
  }

  if (!user || profile) {
    return null;
  }

  if (!hasOnboardingIntent(user.uid)) {
    return null;
  }

  const validateForm = () => {
    const requiredCommon = [
      formData.fullName,
      formData.documentId,
      formData.email,
      formData.password,
      formData.confirmPassword,
      formData.phone,
    ];

    const hasEmptyCommon = requiredCommon.some((value) => !value.trim());
    if (hasEmptyCommon) {
      toast.error('Completa todos los campos obligatorios.');
      return false;
    }

    if (role === 'musician') {
      const ageNumber = Number(formData.age);
      if (!Number.isFinite(ageNumber) || ageNumber < 14) {
        toast.error('Ingresa una edad valida.');
        return false;
      }
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error('Las contrasenas no coinciden.');
      return false;
    }

    if (formData.socialLinks.length === 0) {
      toast.error('Agrega al menos una red social con su enlace.');
      return false;
    }

    if (formData.socialPlatform || formData.socialProfileUrl.trim()) {
      toast.error('Tienes una red social pendiente. Pulsa "Agregar red" antes de finalizar.');
      return false;
    }

    if (role === 'employer') {
      if (!formData.location.trim() || !formData.address.trim() || !formData.establishmentType.trim()) {
        toast.error('Completa los datos del establecimiento.');
        return false;
      }

      if (formData.hasAgeRestriction === 'si') {
        const minAge = Number(formData.minEntryAge);
        if (!Number.isFinite(minAge) || minAge < 0) {
          toast.error('Define una edad minima valida para ingresar.');
          return false;
        }

        if (formData.maxEntryAge.trim()) {
          const maxAge = Number(formData.maxEntryAge);
          if (!Number.isFinite(maxAge) || maxAge < minAge) {
            toast.error('La edad maxima debe ser valida y mayor o igual a la minima.');
            return false;
          }
        }
      }
    }

    return true;
  };

  const handleAddSocialLink = () => {
    if (!formData.socialPlatform) {
      toast.error('Selecciona una red social.');
      return;
    }

    const url = formData.socialProfileUrl.trim();
    if (!url) {
      toast.error('Ingresa el enlace del perfil.');
      return;
    }

    if (!/^https?:\/\//.test(url)) {
      toast.error('El enlace debe iniciar con http:// o https://');
      return;
    }

    const nextLinks = [...formData.socialLinks];
    const existingIndex = nextLinks.findIndex((item) => item.platform === formData.socialPlatform);

    if (existingIndex >= 0) {
      nextLinks[existingIndex] = { platform: formData.socialPlatform, url };
    } else {
      nextLinks.push({ platform: formData.socialPlatform, url });
    }

    setFormData({
      ...formData,
      socialLinks: nextLinks,
      socialPlatform: '',
      socialProfileUrl: '',
    });
  };

  const handleRemoveSocialLink = (platform: SocialPlatform) => {
    setFormData({
      ...formData,
      socialLinks: formData.socialLinks.filter((item) => item.platform !== platform),
    });
  };

  const handleComplete = async () => {
    if (!role) return;
    if (!validateForm()) return;
    if (profile) {
      toast.error('Tu perfil ya esta registrado.');
      navigate('/dashboard', { replace: true });
      return;
    }

    const normalizedUserEmail = (user.email || '').trim().toLowerCase();
    if (!normalizedUserEmail) {
      toast.error('No se pudo validar el correo autenticado. Inicia sesion de nuevo.');
      return;
    }

    if (formData.email.trim().toLowerCase() !== normalizedUserEmail) {
      toast.error('No puedes registrar un correo diferente al de tu cuenta.');
      return;
    }

    setLoading(true);
    try {
      const hasValidPhotoURL = typeof user.photoURL === 'string' && /^https?:\/\//.test(user.photoURL);
      const profile: UserProfile = {
        uid: user.uid,
        email: normalizedUserEmail,
        displayName: formData.fullName,
        role: role,
        documentId: formData.documentId,
        age: role === 'musician' ? Number(formData.age) : undefined,
        password: formData.password,
        phone: formData.phone,
        socialLinks: formData.socialLinks,
        bio: formData.bio,
        location: formData.location,
        address: role === 'employer' ? formData.address : undefined,
        establishmentType: role === 'employer' ? formData.establishmentType : undefined,
        hasAgeRestriction: role === 'employer' ? formData.hasAgeRestriction === 'si' : undefined,
        minEntryAge: role === 'employer' && formData.hasAgeRestriction === 'si' ? Number(formData.minEntryAge) : undefined,
        maxEntryAge: role === 'employer' && formData.hasAgeRestriction === 'si' && formData.maxEntryAge.trim() ? Number(formData.maxEntryAge) : undefined,
        subscription: selectedPlan,
        ...(hasValidPhotoURL ? { photoURL: user.photoURL! } : {}),
      };
      await createUserProfile(profile);
      clearOnboardingIntent();
      await refreshProfile();
      toast.success('¡Perfil creado con éxito!');
      navigate('/dashboard');
    } catch (error) {
      console.error('Error creating profile:', error);
      const errorCode = (error as { code?: string })?.code;

      if (errorCode === 'profile/already-exists') {
        toast.error('Este usuario ya tiene un perfil registrado.');
        navigate('/dashboard', { replace: true });
      } else if (errorCode === 'profile/email-already-in-use') {
        toast.error('Este correo ya esta registrado y no puede volver a usarse.');
      } else {
        toast.error('Hubo un error al crear tu perfil.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50">
      <div className="max-w-2xl w-full">
        {step === 1 && (
          <div className="space-y-8 text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="space-y-2">
              <h1 className="text-4xl font-bold tracking-tight">Bienvenido a EnClave</h1>
              <p className="text-muted-foreground text-lg">Para empezar, cuéntanos quién eres.</p>
            </div>
            
            <div className="grid sm:grid-cols-2 gap-6">
              <button 
                onClick={() => setRole('musician')}
                className={`p-8 rounded-3xl border-2 text-left transition-all hover:shadow-lg group ${role === 'musician' ? 'border-primary bg-primary/5' : 'border-white bg-white'}`}
              >
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 transition-colors ${role === 'musician' ? 'bg-primary text-white' : 'bg-slate-100 text-slate-600 group-hover:bg-primary/10 group-hover:text-primary'}`}>
                  <Music className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold mb-2">Soy Músico</h3>
                <p className="text-sm text-muted-foreground">Busco oportunidades para tocar, formalizar mi carrera y conectar con clientes.</p>
              </button>

              <button 
                onClick={() => setRole('employer')}
                className={`p-8 rounded-3xl border-2 text-left transition-all hover:shadow-lg group ${role === 'employer' ? 'border-primary bg-primary/5' : 'border-white bg-white'}`}
              >
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 transition-colors ${role === 'employer' ? 'bg-primary text-white' : 'bg-slate-100 text-slate-600 group-hover:bg-primary/10 group-hover:text-primary'}`}>
                  <Building2 className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold mb-2">Soy Empleador</h3>
                <p className="text-sm text-muted-foreground">Busco talento musical para mi negocio, evento o establecimiento en Cali.</p>
              </button>
            </div>

            <Button 
              size="lg" 
              disabled={!role} 
              onClick={() => setStep(2)}
              className="rounded-full px-12 h-14 text-lg"
            >
              Continuar
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </div>
        )}

        {step === 2 && (
          <Card className="rounded-[2rem] shadow-xl border-none animate-in fade-in slide-in-from-bottom-4 duration-500">
            <CardHeader className="space-y-1 p-8">
              <CardTitle className="text-3xl font-bold">Completa tu perfil</CardTitle>
              <CardDescription className="text-lg">
                {role === 'musician' ? 'Cuéntanos sobre tu proyecto musical.' : 'Cuéntanos sobre tu establecimiento.'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 p-8 pt-0">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="fullName" className="text-base font-semibold">
                    {role === 'musician' ? 'Nombres' : 'Nombre de empresa o responsable'} *
                  </Label>
                  <Input
                    id="fullName"
                    className="rounded-xl h-12 px-4"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="documentId" className="text-base font-semibold">Cedula / NIT *</Label>
                  <Input
                    id="documentId"
                    className="rounded-xl h-12 px-4"
                    value={formData.documentId}
                    onChange={(e) => setFormData({ ...formData, documentId: e.target.value })}
                  />
                </div>
                {role === 'musician' && (
                  <div className="space-y-2">
                    <Label htmlFor="age" className="text-base font-semibold">Edad *</Label>
                    <Input
                      id="age"
                      type="number"
                      min={14}
                      className="rounded-xl h-12 px-4"
                      value={formData.age}
                      onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                    />
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-base font-semibold">Correo *</Label>
                  <Input
                    id="email"
                    type="email"
                    className="rounded-xl h-12 px-4"
                    value={formData.email}
                    readOnly
                    disabled
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-base font-semibold">Contraseña *</Label>
                  <Input
                    id="password"
                    type={showPasswords ? 'text' : 'password'}
                    className="rounded-xl h-12 px-4"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-base font-semibold">Confirmar contraseña *</Label>
                  <Input
                    id="confirmPassword"
                    type={showPasswords ? 'text' : 'password'}
                    className="rounded-xl h-12 px-4"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-base font-semibold">Numero de telefono *</Label>
                  <Input
                    id="phone"
                    className="rounded-xl h-12 px-4"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
                <div className="sm:col-span-2 flex items-center gap-2">
                  <input
                    id="showPasswords"
                    type="checkbox"
                    checked={showPasswords}
                    onChange={(e) => setShowPasswords(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300"
                  />
                  <Label htmlFor="showPasswords" className="text-sm font-medium">Mostrar contraseñas</Label>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="socialPlatform" className="text-base font-semibold">Red social principal *</Label>
                  <select
                    id="socialPlatform"
                    className="w-full rounded-xl h-12 px-4 border bg-background"
                    value={formData.socialPlatform}
                    onChange={(e) => setFormData({ ...formData, socialPlatform: e.target.value as '' | SocialPlatform, socialProfileUrl: '' })}
                  >
                    <option value="">Selecciona una red</option>
                    {SOCIAL_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="socialProfileUrl" className="text-base font-semibold">
                    Link del perfil
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="socialProfileUrl"
                      type="url"
                      className="rounded-xl h-12 px-4"
                      placeholder="https://..."
                      value={formData.socialProfileUrl}
                      onChange={(e) => setFormData({ ...formData, socialProfileUrl: e.target.value })}
                    />
                    <Button type="button" variant="outline" className="rounded-xl h-12 px-4" onClick={handleAddSocialLink}>
                      <Plus className="w-4 h-4 mr-1" />
                      Agregar red
                    </Button>
                  </div>
                </div>

                {formData.socialLinks.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">Redes agregadas</p>
                    <div className="space-y-2">
                      {formData.socialLinks.map((item) => (
                        <div key={item.platform} className="flex items-center justify-between gap-2 rounded-xl border bg-white px-3 py-2">
                          <div className="min-w-0">
                            <p className="font-semibold capitalize">{item.platform}</p>
                            <p className="text-xs text-muted-foreground truncate">{item.url}</p>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            className="text-destructive"
                            onClick={() => handleRemoveSocialLink(item.platform)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio" className="text-base font-semibold">
                  {role === 'musician' ? 'Biografia' : 'Descripcion del establecimiento'}
                </Label>
                <Textarea
                  id="bio"
                  placeholder={role === 'musician' ? 'Ej: Banda de jazz fusion con 5 anos de trayectoria...' : 'Ej: Bar restaurante con enfoque en musica en vivo...'}
                  className="min-h-[120px] rounded-2xl p-4 resize-none"
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                />
              </div>

              {role === 'employer' && (
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="location" className="text-base font-semibold">Ubicacion *</Label>
                    <Input
                      id="location"
                      className="rounded-xl h-12 px-4"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="address" className="text-base font-semibold">Direccion *</Label>
                    <Input
                      id="address"
                      className="rounded-xl h-12 px-4"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="establishmentType" className="text-base font-semibold">Tipo de negocio *</Label>
                    <select
                      id="establishmentType"
                      className="w-full rounded-xl h-12 px-4 border bg-background"
                      value={formData.establishmentType}
                      onChange={(e) => setFormData({ ...formData, establishmentType: e.target.value })}
                    >
                      <option value="">Selecciona un tipo de negocio</option>
                      {BUSINESS_TYPE_OPTIONS.map((item) => (
                        <option key={item} value={item}>{item}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="hasAgeRestriction" className="text-base font-semibold">Restriccion de edad</Label>
                    <select
                      id="hasAgeRestriction"
                      className="w-full rounded-xl h-12 px-4 border bg-background"
                      value={formData.hasAgeRestriction}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          hasAgeRestriction: e.target.value,
                          minEntryAge: e.target.value === 'si' ? formData.minEntryAge : '',
                          maxEntryAge: e.target.value === 'si' ? formData.maxEntryAge : '',
                        })
                      }
                    >
                      <option value="no">No</option>
                      <option value="si">Si</option>
                    </select>
                  </div>
                  {formData.hasAgeRestriction === 'si' && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="minEntryAge" className="text-base font-semibold">Edad minima de ingreso *</Label>
                        <Input
                          id="minEntryAge"
                          type="number"
                          min={0}
                          className="rounded-xl h-12 px-4"
                          value={formData.minEntryAge}
                          onChange={(e) => setFormData({ ...formData, minEntryAge: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="maxEntryAge" className="text-base font-semibold">Edad maxima de ingreso (opcional)</Label>
                        <Input
                          id="maxEntryAge"
                          type="number"
                          min={0}
                          className="rounded-xl h-12 px-4"
                          value={formData.maxEntryAge}
                          onChange={(e) => setFormData({ ...formData, maxEntryAge: e.target.value })}
                        />
                      </div>
                    </>
                  )}
                </div>
              )}
            </CardContent>
            <CardFooter className="p-8 pt-0 flex flex-col gap-4">
              <Button 
                className="w-full h-14 rounded-full text-lg font-bold" 
                onClick={() => setStep(3)}
                disabled={loading}
              >
                Continuar
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
              <Button variant="ghost" className="w-full" onClick={() => setStep(1)} disabled={loading}>
                Volver
              </Button>
            </CardFooter>
          </Card>
        )}

        {step === 3 && (
          <Card className="rounded-3xl shadow-xl border-none animate-in fade-in slide-in-from-bottom-4 duration-500">
            <CardHeader className="text-center pt-8 pb-4">
              <CardTitle className="text-3xl font-bold">Elige tu Plan de Suscripción</CardTitle>
              <CardDescription className="text-base mt-2">
                Selecciona el plan que mejor se ajuste a tus necesidades.
              </CardDescription>
            </CardHeader>
            
            <CardContent className="px-8 py-6">
              <div className="grid md:grid-cols-3 gap-6 mb-8">
                {Object.entries(SUBSCRIPTION_PLANS).map(([key, plan]) => {
                  const planKey = key as SubscriptionPlan;
                  const isSelected = planKey === selectedPlan;

                  return (
                    <button
                      key={planKey}
                      onClick={() => setSelectedPlan(planKey)}
                      className={`relative rounded-2xl border-2 p-6 text-left transition-all hover:shadow-lg ${
                        isSelected
                          ? 'border-primary bg-primary/5'
                          : planKey === 'premium'
                          ? 'border-yellow-400 bg-white hover:border-yellow-500'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      {/* Checkmark para plan seleccionado */}
                      {isSelected && (
                        <div className="absolute top-4 right-4">
                          <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                            <Check className="w-4 h-4 text-white" />
                          </div>
                        </div>
                      )}

                      {/* Badge Más Popular */}
                      {planKey === 'premium' && (
                        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                          <Badge className="bg-yellow-400 text-slate-900 font-semibold">
                            <Star className="w-3 h-3 mr-1 fill-current" />
                            Más Popular
                          </Badge>
                        </div>
                      )}

                      {/* Contenido */}
                      <div className="space-y-4">
                        <div>
                          <h3 className="text-2xl font-bold text-slate-900">{plan.name}</h3>
                          <p className="text-3xl font-bold text-primary mt-1">{plan.price}</p>
                        </div>

                        <ul className="space-y-2">
                          {role === 'employer' ? (
                            <>
                              <li className="flex items-center gap-2 text-sm">
                                <Check className="w-4 h-4 text-green-500" />
                                <span>
                                  Publicar hasta {plan.benefits.eventsPerMonth === -1 ? 'ilimitados' : plan.benefits.eventsPerMonth} eventos
                                </span>
                              </li>
                              <li className="flex items-center gap-2 text-sm">
                                <Check className="w-4 h-4 text-green-500" />
                                <span>
                                  Contratar hasta {plan.benefits.hiresPerMonth === -1 ? 'ilimitado' : plan.benefits.hiresPerMonth} artistas
                                </span>
                              </li>
                              <li className="flex items-center gap-2 text-sm">
                                <Check className="w-4 h-4 text-green-500" />
                                <span>Visibilidad: {plan.benefits.visibility}</span>
                              </li>
                            </>
                          ) : (
                            <>
                              <li className="flex items-center gap-2 text-sm">
                                <Check className="w-4 h-4 text-green-500" />
                                <span>Visibilidad: {plan.benefits.visibility}</span>
                              </li>
                              <li className="flex items-center gap-2 text-sm">
                                <Check className="w-4 h-4 text-green-500" />
                                <span>
                                  {plan.benefits.suggestedProfiles ? 'Aparecer en perfiles sugeridos' : 'Sin aparecer en sugeridos'}
                                </span>
                              </li>
                            </>
                          )}
                        </ul>
                      </div>
                    </button>
                  );
                })}
              </div>

              <p className="text-xs text-muted-foreground text-center mb-6">
                * Los precios son simulados. En una implementación real, se integraría una pasarela de pago.
              </p>
            </CardContent>

            {/* Buttons */}
            <div className="px-8 pb-8 flex flex-col gap-3">
              <Button 
                className="w-full h-14 rounded-full text-base font-bold" 
                onClick={handleComplete}
                disabled={loading}
              >
                {loading ? 'Guardando...' : 'Finalizar Registro'}
              </Button>
              <Button variant="ghost" className="w-full h-10" onClick={() => setStep(2)} disabled={loading}>
                Volver
              </Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
