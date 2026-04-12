import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getUserProfile, UserProfile } from '../lib/userService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';

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

const getPortfolioSource = (url?: string, fileDataUrl?: string) => fileDataUrl || url || '';

export default function ArtistProfile() {
  const { uid } = useParams();
  const navigate = useNavigate();
  const [artist, setArtist] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadArtist = async () => {
      if (!uid) return;
      setLoading(true);
      const data = await getUserProfile(uid);
      setArtist(data);
      setLoading(false);
    };
    loadArtist();
  }, [uid]);

  if (loading) {
    return <div className="h-60 rounded-3xl bg-slate-50 animate-pulse" />;
  }

  if (!artist || artist.role !== 'musician') {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">No encontramos este perfil de artista.</p>
        <Button variant="ghost" onClick={() => navigate(-1)}>Volver</Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card className="rounded-3xl border-none shadow-sm">
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4 sm:items-center">
            <Avatar className="h-20 w-20">
              <AvatarImage src={artist.photoURL} />
              <AvatarFallback>{artist.displayName.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="space-y-2">
              <CardTitle className="text-3xl">{artist.displayName}</CardTitle>
              <CardDescription>{artist.bio || 'Sin bio disponible.'}</CardDescription>
              <div className="flex gap-2">
                <Badge>Artista</Badge>
                <Badge variant="secondary">{artist.location || 'Cali'}</Badge>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      <Card className="rounded-3xl border-none shadow-sm">
        <CardHeader>
          <CardTitle>Portafolio</CardTitle>
          <CardDescription>Material para evaluar estilo, calidad y propuesta del artista.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!artist.portfolio || artist.portfolio.length === 0 ? (
            <p className="text-sm text-muted-foreground">Este artista aún no ha publicado recursos de portafolio.</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {artist.portfolio.map((item) => (
                <div key={item.id} className="rounded-2xl border bg-white overflow-hidden">
                  <div className="aspect-square bg-slate-100">
                  {item.type === 'image' && (
                    <img src={getPortfolioSource(item.url, item.fileDataUrl)} alt={item.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
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
                      <a href={getPortfolioSource(item.url, item.fileDataUrl)} target="_blank" rel="noreferrer" className="text-primary font-medium underline mt-2">
                        Abrir documento
                      </a>
                    </div>
                  )}
                  </div>
                  <div className="p-3">
                    <p className="font-semibold line-clamp-1 text-sm">{item.title}</p>
                    <p className="text-xs text-muted-foreground uppercase">{item.type}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
