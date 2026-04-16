import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getUserProfile, UserProfile } from '../lib/userService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { MapPin, Star } from 'lucide-react';

const getDemoEmployerProfile = (uid: string): UserProfile | null => {
  if (!uid.startsWith('demo-employer-')) return null;

  return {
    uid,
    email: `${uid}@demo.enclave.local`,
    displayName: 'Negocio Demo EnClave',
    role: 'employer',
    bio: 'Perfil de negocio de prueba para mostrar visualmente el flujo de reseñas y postulaciones.',
    location: 'Cali, Colombia',
    establishmentType: 'Centro de eventos',
    rating: 0,
    reviewCount: 0,
  };
};

export default function EmployerProfile() {
  const { uid } = useParams();
  const navigate = useNavigate();
  const [employer, setEmployer] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadEmployer = async () => {
      if (!uid) return;
      setLoading(true);

      const demoProfile = getDemoEmployerProfile(uid);
      if (demoProfile) {
        setEmployer(demoProfile);
        setLoading(false);
        return;
      }

      const data = await getUserProfile(uid);
      setEmployer(data);
      setLoading(false);
    };

    loadEmployer();
  }, [uid]);

  if (loading) {
    return <div className="h-60 rounded-3xl bg-slate-50 animate-pulse" />;
  }

  if (!employer || employer.role !== 'employer') {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">No encontramos este perfil de negocio.</p>
        <Button variant="ghost" onClick={() => navigate(-1)}>Volver</Button>
      </div>
    );
  }

  const hasReviews = (employer.reviewCount || 0) > 0;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card className="rounded-3xl border-none shadow-sm">
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4 sm:items-center">
            <Avatar className="h-20 w-20">
              <AvatarImage src={employer.photoURL} />
              <AvatarFallback>{employer.displayName.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="space-y-2">
              <CardTitle className="text-3xl">{employer.displayName}</CardTitle>
              <CardDescription>{employer.bio || 'Sin descripción disponible.'}</CardDescription>
              <div className="flex flex-wrap gap-2">
                <Badge>{employer.establishmentType || 'Negocio'}</Badge>
                <Badge variant="secondary" className="flex items-center gap-1"><MapPin className="w-3 h-3" />{employer.location || 'Cali'}</Badge>
                <Badge variant="outline" className="flex items-center gap-1">
                  <Star className="w-3 h-3" />
                  {hasReviews ? `${Number(employer.rating || 0).toFixed(1)} (${employer.reviewCount} reseñas)` : 'Sin calificación'}
                </Badge>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          {employer.address ? <p>Dirección: {employer.address}</p> : <p>Dirección no disponible.</p>}
        </CardContent>
      </Card>
    </div>
  );
}
