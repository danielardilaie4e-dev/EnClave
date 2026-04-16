import React, { useState } from 'react';
import { useAuth } from '../lib/useAuth';
import { PortfolioItem, updateUserProfile, uploadPortfolioAsset } from '../lib/userService';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Badge } from '../components/ui/badge';
import { 
  User, 
  Mail, 
  MapPin, 
  Briefcase, 
  ShieldCheck, 
  Star,
  Save,
  Camera
} from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { getPlanDetails } from '../lib/subscriptionPlans';

const isValidVideoLink = (url: string) => {
  const normalized = url.trim();
  return /^https?:\/\//.test(normalized) && (
    normalized.includes('youtube.com') ||
    normalized.includes('youtu.be') ||
    normalized.includes('vimeo.com')
  );
};

const readFileAsDataUrl = (file: File) => new Promise<string>((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(String(reader.result || ''));
  reader.onerror = () => reject(new Error('No fue posible leer el archivo.'));
  reader.readAsDataURL(file);
});

const isJpgFile = (file: File) => {
  const name = file.name.toLowerCase();
  return file.type === 'image/jpeg' || name.endsWith('.jpg') || name.endsWith('.jpeg');
};

const isPdfFile = (file: File) => {
  const name = file.name.toLowerCase();
  return file.type === 'application/pdf' || name.endsWith('.pdf');
};

const getYoutubeId = (url: string) => {
  const normalized = url.trim();
  const watchMatch = normalized.match(/[?&]v=([^&]+)/);
  if (watchMatch?.[1]) return watchMatch[1];

  const shortMatch = normalized.match(/youtu\.be\/([^?&/]+)/);
  if (shortMatch?.[1]) return shortMatch[1];

  const embedMatch = normalized.match(/youtube\.com\/embed\/([^?&/]+)/);
  if (embedMatch?.[1]) return embedMatch[1];

  return null;
};

const toVideoEmbedUrl = (url: string) => {
  const youtubeId = getYoutubeId(url);
  if (youtubeId) {
    return `https://www.youtube-nocookie.com/embed/${youtubeId}?rel=0&modestbranding=1&controls=1`;
  }

  if (url.includes('vimeo.com')) {
    const vimeoId = url.split('/').pop()?.split('?')[0];
    if (vimeoId) return `https://player.vimeo.com/video/${vimeoId}`;
  }

  return url;
};

const getPortfolioSource = (item: PortfolioItem) => item.fileDataUrl || item.url || '';

const dataUrlToBlob = (dataUrl: string) => {
  const [meta, data] = dataUrl.split(',');
  const mimeMatch = meta.match(/data:(.*?);base64/);
  const mimeType = mimeMatch?.[1] || 'application/octet-stream';
  const binary = atob(data);
  const bytes = new Uint8Array(binary.length);

  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }

  return new Blob([bytes], { type: mimeType });
};

export default function Profile() {
  const { profile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const socialLinks = Array.isArray(profile?.socialLinks) ? profile.socialLinks : [];
  const hasReviews = (profile.reviewCount || 0) > 0;
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    displayName: profile?.displayName || '',
    bio: profile?.bio || '',
    location: profile?.location || '',
    photoURL: profile?.photoURL || '',
  });
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>(profile?.portfolio || []);
  const [portfolioDraft, setPortfolioDraft] = useState({
    type: 'image' as 'image' | 'video' | 'document',
    title: '',
    url: '',
  });
  const [portfolioFile, setPortfolioFile] = useState<File | null>(null);

  if (!profile) return null;

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const normalizedPhotoURL = formData.photoURL.trim();

      let normalizedPortfolio = portfolio;

      if (profile.role === 'musician') {
        normalizedPortfolio = await Promise.all(
          portfolio.map(async (item) => {
            if (!item.fileDataUrl) return item;

            const blob = dataUrlToBlob(item.fileDataUrl);
            const fileName = item.fileName || `${item.id}.${item.type === 'document' ? 'pdf' : 'jpg'}`;
            const uploadedUrl = await uploadPortfolioAsset(profile.uid, item.id, fileName, blob);

            return {
              ...item,
              url: uploadedUrl,
              fileDataUrl: undefined,
            };
          })
        );
      }

      await updateUserProfile(profile.uid, {
        ...formData,
        photoURL: normalizedPhotoURL || undefined,
        ...(profile.role === 'musician' ? { portfolio: normalizedPortfolio } : {}),
      });
      setPortfolio(normalizedPortfolio);
      await refreshProfile();
      toast.success('¡Perfil actualizado!');
    } catch (error) {
      console.error('Error updating profile:', error);
      const errorCode = (error as { code?: string })?.code;
      if (errorCode === 'storage/unauthorized' || errorCode === 'permission-denied') {
        toast.error('No tienes permisos para subir archivos. Revisa las reglas de Firebase Storage.');
      } else {
        toast.error('Error al actualizar el perfil.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAddPortfolioItem = async () => {
    const title = portfolioDraft.title.trim();
    if (!title) {
      toast.error('Completa el título del recurso.');
      return;
    }

    if (portfolioDraft.type === 'video') {
      const videoUrl = portfolioDraft.url.trim();
      if (!videoUrl) {
        toast.error('Ingresa el link del video.');
        return;
      }

      if (!isValidVideoLink(videoUrl)) {
        toast.error('Para video ingresa un link válido de YouTube o Vimeo.');
        return;
      }

      setPortfolio((current) => [
        ...current,
        {
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          type: 'video',
          title,
          url: videoUrl,
        },
      ]);

      setPortfolioDraft({ type: 'image', title: '', url: '' });
      setPortfolioFile(null);
      return;
    }

    if (portfolioDraft.type === 'image') {
      if (!portfolioFile) {
        toast.error('Selecciona una imagen JPG/JPEG.');
        return;
      }

      if (!isJpgFile(portfolioFile)) {
        toast.error('La imagen debe estar en formato JPG/JPEG.');
        return;
      }

      if (portfolioFile.size > 5 * 1024 * 1024) {
        toast.error('La imagen supera el límite de 5 MB.');
        return;
      }
    }

    if (portfolioDraft.type === 'document') {
      if (!portfolioFile) {
        toast.error('Selecciona un documento PDF.');
        return;
      }

      if (!isPdfFile(portfolioFile)) {
        toast.error('El documento debe estar en formato PDF.');
        return;
      }

      if (portfolioFile.size > 8 * 1024 * 1024) {
        toast.error('El PDF supera el límite de 8 MB.');
        return;
      }
    }

    try {
      const dataUrl = await readFileAsDataUrl(portfolioFile!);

      setPortfolio((current) => [
        ...current,
        {
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          type: portfolioDraft.type,
          title,
          fileDataUrl: dataUrl,
          fileName: portfolioFile?.name,
        },
      ]);

      setPortfolioDraft({ type: 'image', title: '', url: '' });
      setPortfolioFile(null);
    } catch (error) {
      console.error('Error reading portfolio file:', error);
      toast.error('No fue posible procesar el archivo.');
    }
  };

  const handleRemovePortfolioItem = (id: string) => {
    setPortfolio((current) => current.filter((item) => item.id !== id));
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row gap-8 items-start">
        {/* Profile Sidebar */}
        <Card className="w-full md:w-80 rounded-[2rem] border-none shadow-sm overflow-hidden">
          <div className="h-32 bg-primary/10 relative">
            <div className="absolute -bottom-12 left-1/2 -translate-x-1/2">
              <div className="relative group">
                <Avatar className="h-24 w-24 border-4 border-white shadow-lg">
                  <AvatarImage src={profile.photoURL} />
                  <AvatarFallback className="text-2xl">{profile.displayName.charAt(0)}</AvatarFallback>
                </Avatar>
                <button className="absolute bottom-0 right-0 bg-primary text-white p-1.5 rounded-full shadow-md hover:scale-110 transition-transform">
                  <Camera className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
          <CardContent className="pt-16 pb-8 text-center space-y-4">
            <div>
              <h2 className="text-xl font-bold">{profile.displayName}</h2>
              <p className="text-sm text-muted-foreground">{profile.email}</p>
            </div>
            <div className="flex justify-center gap-2">
              <Badge variant="secondary" className="rounded-full px-3">
                {profile.role === 'musician' ? 'Músico' : 'Empleador'}
              </Badge>
              {profile.verified && (
                <Badge className="bg-green-100 text-green-700 hover:bg-green-100 rounded-full px-3 border-none">
                  <ShieldCheck className="w-3 h-3 mr-1" />
                  Verificado
                </Badge>
              )}
            </div>
            <div className="flex items-center justify-center gap-1 text-yellow-500 font-bold">
              <Star className="w-4 h-4 fill-yellow-500" />
              {hasReviews ? (
                <>
                  <span>{Number(profile.rating || 0).toFixed(1)}</span>
                  <span className="text-muted-foreground font-normal text-sm">({profile.reviewCount || 0} reseñas)</span>
                </>
              ) : (
                <span className="text-muted-foreground font-semibold text-sm">Sin calificación</span>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Profile Form */}
        <Card className="flex-1 rounded-[2rem] border-none shadow-sm">
          <CardHeader className="p-8">
            <CardTitle className="text-2xl font-bold">Editar Perfil</CardTitle>
            <CardDescription>Mantén tu información actualizada para atraer mejores oportunidades.</CardDescription>
          </CardHeader>
          <CardContent className="p-8 pt-0 space-y-6">
            <form onSubmit={handleUpdate} className="space-y-6">
              <div className="grid sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="displayName" className="font-semibold">Nombre Público</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input 
                      id="displayName" 
                      className="pl-10 rounded-xl h-12"
                      value={formData.displayName}
                      onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location" className="font-semibold">Ubicación</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input 
                      id="location" 
                      className="pl-10 rounded-xl h-12"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="photoURL" className="font-semibold">Foto de perfil (URL)</Label>
                <Input
                  id="photoURL"
                  className="rounded-xl h-12"
                  value={formData.photoURL}
                  onChange={(e) => setFormData({ ...formData, photoURL: e.target.value })}
                  placeholder="https://..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio" className="font-semibold">Biografía</Label>
                <Textarea 
                  id="bio" 
                  className="rounded-2xl min-h-[150px] p-4 resize-none"
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  placeholder="Cuéntanos sobre tu trayectoria, estilo y experiencia..."
                />
              </div>

              <div className="pt-4">
                <Button type="submit" disabled={loading} className="rounded-full px-8 h-12 font-bold group">
                  {loading ? 'Guardando...' : 'Guardar Cambios'}
                  <Save className="ml-2 w-4 h-4 group-hover:scale-110 transition-transform" />
                </Button>
              </div>
            </form>

            <div className="pt-4 border-t">
              <Button
                onClick={() => navigate('/subscription-plans')}
                variant="outline"
                className="rounded-full px-8 h-12 font-bold"
              >
                Mejorar Plan de Suscripción
              </Button>
            </div>

            {profile.role === 'musician' && (
              <div className="pt-4 border-t space-y-4">
                <div>
                  <h3 className="text-lg font-bold">Portafolio del artista</h3>
                  <p className="text-sm text-muted-foreground">Agrega fotos, videos o documentos para mostrar tu propuesta a empleadores.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <select
                    className="w-full rounded-xl h-12 px-4 border bg-background"
                    value={portfolioDraft.type}
                    onChange={(e) => {
                      setPortfolioDraft({
                        ...portfolioDraft,
                        type: e.target.value as 'image' | 'video' | 'document',
                        url: '',
                      });
                      setPortfolioFile(null);
                    }}
                  >
                    <option value="image">Foto</option>
                    <option value="video">Video</option>
                    <option value="document">Documento</option>
                  </select>
                  <Input
                    className="rounded-xl h-12"
                    placeholder="Título"
                    value={portfolioDraft.title}
                    onChange={(e) => setPortfolioDraft({ ...portfolioDraft, title: e.target.value })}
                  />
                  {portfolioDraft.type === 'video' ? (
                    <Input
                      className="rounded-xl h-12"
                      placeholder="Link de YouTube o Vimeo"
                      value={portfolioDraft.url}
                      onChange={(e) => setPortfolioDraft({ ...portfolioDraft, url: e.target.value })}
                    />
                  ) : (
                    <div className="flex items-center gap-2 rounded-xl border bg-white px-3 h-12">
                      <label
                        htmlFor="portfolioFileInput"
                        className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white cursor-pointer hover:bg-slate-800 whitespace-nowrap"
                      >
                        Seleccionar archivo
                      </label>
                      <input
                        id="portfolioFileInput"
                        className="hidden"
                        type="file"
                        accept={portfolioDraft.type === 'image' ? '.jpg,.jpeg,image/jpeg' : '.pdf,application/pdf'}
                        onChange={(e) => setPortfolioFile(e.target.files?.[0] || null)}
                      />
                      <p className="text-xs text-muted-foreground truncate min-w-0">
                        {portfolioFile ? portfolioFile.name : (portfolioDraft.type === 'image' ? 'JPG/JPEG (max 5MB)' : 'PDF (max 8MB)')}
                      </p>
                    </div>
                  )}
                </div>
                <Button type="button" variant="outline" className="rounded-xl w-full sm:w-auto" onClick={handleAddPortfolioItem}>
                  Agregar recurso al portafolio
                </Button>

                {portfolio.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {portfolio.map((item) => (
                      <div key={item.id} className="rounded-2xl border bg-white overflow-hidden">
                        <div className="aspect-square bg-slate-100">
                          {item.type === 'image' && (
                            <img src={getPortfolioSource(item)} alt={item.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          )}
                          {item.type === 'video' && (
                            <iframe
                              title={item.title}
                              src={toVideoEmbedUrl(item.url || '')}
                              className="w-full h-full"
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                              referrerPolicy="strict-origin-when-cross-origin"
                              allowFullScreen
                            />
                          )}
                          {item.type === 'document' && (
                            <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center">
                              <p className="text-3xl">PDF</p>
                              <a href={getPortfolioSource(item)} target="_blank" rel="noreferrer" className="text-sm text-primary underline mt-2">
                                Abrir documento
                              </a>
                            </div>
                          )}
                        </div>
                        <div className="p-3 space-y-2">
                          <p className="font-semibold text-sm line-clamp-1">{item.title}</p>
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-xs text-muted-foreground uppercase">{item.type}</p>
                            <Button type="button" variant="ghost" className="h-7 px-2" onClick={() => handleRemovePortfolioItem(item.id)}>
                              Eliminar
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-[2rem] border-none shadow-sm">
        <CardHeader className="p-8">
          <CardTitle className="text-2xl font-bold">Informacion de registro</CardTitle>
          <CardDescription>Datos completos con los que te registraste en EnClave.</CardDescription>
        </CardHeader>
        <CardContent className="p-8 pt-0 space-y-6">
          <div className="grid sm:grid-cols-2 gap-4 text-sm">
            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-muted-foreground">Correo</p>
              <p className="font-semibold">{profile.email || '-'}</p>
            </div>
            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-muted-foreground">Documento</p>
              <p className="font-semibold">{profile.documentId || '-'}</p>
            </div>
            {profile.role === 'musician' && (
              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-muted-foreground">Edad</p>
                <p className="font-semibold">{profile.age || '-'}</p>
              </div>
            )}
            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-muted-foreground">Plan de Suscripción</p>
              <p className="font-semibold">{getPlanDetails(profile.subscription || 'free').name}</p>
            </div>
            <div className="rounded-xl bg-slate-50 p-4 sm:col-span-2">
              <p className="text-muted-foreground">Bio / descripcion</p>
              <p className="font-semibold">{profile.bio || '-'}</p>
            </div>

            {profile.role === 'employer' && (
              <>
                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-muted-foreground">Ubicacion</p>
                  <p className="font-semibold">{profile.location || '-'}</p>
                </div>
                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-muted-foreground">Direccion</p>
                  <p className="font-semibold">{profile.address || '-'}</p>
                </div>
                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-muted-foreground">Tipo de establecimiento</p>
                  <p className="font-semibold">{profile.establishmentType || '-'}</p>
                </div>
                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-muted-foreground">Restriccion de edad</p>
                  <p className="font-semibold">{profile.hasAgeRestriction ? 'Si' : 'No'}</p>
                </div>
                {profile.hasAgeRestriction && (
                  <div className="rounded-xl bg-slate-50 p-4 sm:col-span-2">
                    <p className="text-muted-foreground">Rango de edad permitido</p>
                    <p className="font-semibold">
                      Minima: {profile.minEntryAge ?? '-'}
                      {profile.maxEntryAge ? ` | Maxima: ${profile.maxEntryAge}` : ''}
                    </p>
                  </div>
                )}
              </>
            )}
          </div>

          <div className="space-y-3">
            <h3 className="text-lg font-bold">Redes sociales</h3>
            {socialLinks.length > 0 ? (
              <div className="flex flex-wrap gap-3">
                {socialLinks.map((social) => (
                  <a
                    key={`${social.platform}-${social.url}`}
                    href={social.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center rounded-full bg-primary/10 px-4 py-2 text-sm font-semibold text-primary hover:bg-primary/20 transition-colors"
                  >
                    Ver {social.platform}
                  </a>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No hay redes sociales registradas.</p>
            )}
          </div>

          {profile.role === 'musician' && (
            <div className="space-y-3 pt-2">
              <h3 className="text-lg font-bold">Portafolio visible para empleadores</h3>
              {profile.portfolio && profile.portfolio.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {profile.portfolio.map((item) => (
                    <div key={item.id} className="rounded-2xl border bg-white overflow-hidden">
                      <div className="aspect-square bg-slate-100">
                        {item.type === 'image' && (
                          <img src={getPortfolioSource(item)} alt={item.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        )}
                        {item.type === 'video' && (
                          <iframe
                            title={item.title}
                            src={toVideoEmbedUrl(item.url || '')}
                            className="w-full h-full"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                            referrerPolicy="strict-origin-when-cross-origin"
                            allowFullScreen
                          />
                        )}
                        {item.type === 'document' && (
                          <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center">
                            <p className="text-3xl">PDF</p>
                            <a href={getPortfolioSource(item)} target="_blank" rel="noreferrer" className="text-sm text-primary underline mt-2">
                              Abrir documento
                            </a>
                          </div>
                        )}
                      </div>
                      <div className="p-3">
                        <p className="font-semibold text-sm line-clamp-1">{item.title}</p>
                        <p className="text-xs text-muted-foreground uppercase">{item.type}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Aún no has agregado recursos de portafolio.</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
