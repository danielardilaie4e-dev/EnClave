import { useEffect, useState } from 'react';
import { useAuth } from '../lib/useAuth';
import { getMusicianApplications, getJobById, Job } from '../lib/jobService';
import { JobApplication } from '../lib/jobService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Calendar, MapPin, DollarSign, CheckCircle, Clock, XCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Applications() {
  const { profile } = useAuth();
  const [applications, setApplications] = useState<(JobApplication & { job?: Job })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchApplications = async () => {
      if (!profile || profile.role !== 'musician') return;

      setLoading(true);
      try {
        const apps = await getMusicianApplications(profile.uid);
        
        // Obtener detalles del job para cada aplicación
        const applicationsWithJobs = await Promise.all(
          apps.map(async (app) => {
            try {
              const job = await getJobById(app.jobId);
              return { ...app, job };
            } catch (error) {
              console.error(`Error fetching job ${app.jobId}:`, error);
              return app;
            }
          })
        );

        setApplications(applicationsWithJobs);
      } catch (error) {
        console.error('Error fetching applications:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchApplications();
  }, [profile?.uid, profile?.role]);

  if (profile?.role !== 'musician') {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">Solo artistas pueden ver el historial de postulaciones.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-40 rounded-3xl bg-slate-50 animate-pulse" />
        ))}
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-yellow-500"><Clock className="w-3 h-3 mr-1" />Pendiente</Badge>;
      case 'shortlisted':
        return <Badge className="bg-blue-500"><CheckCircle className="w-3 h-3 mr-1" />Preseleccionado</Badge>;
      case 'rejected':
        return <Badge className="bg-red-500"><XCircle className="w-3 h-3 mr-1" />Rechazado</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Mis Postulaciones</h1>
        <p className="text-muted-foreground">
          {applications.length === 0
            ? 'Aún no te has postulado a ningún gig.'
            : `Tienes ${applications.length} postulación${applications.length === 1 ? '' : 'es'}`}
        </p>
      </div>

      {applications.length === 0 ? (
        <Card className="rounded-3xl border-none shadow-sm">
          <CardContent className="pt-12 pb-12 text-center">
            <p className="text-muted-foreground mb-4">Explora los gigs disponibles y postúlate a los que te interesen.</p>
            <Link to="/jobs">
              <Button className="rounded-full">Ver Gigs Disponibles</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {applications.map((app) => (
            <Card key={app.id} className="rounded-3xl border-none shadow-sm overflow-hidden">
              <CardContent className="p-0">
                <div className="flex items-start gap-6 p-6">
                  {/* Imagen del gig si existe */}
                  {app.job?.coverImageURL && (
                    <div className="w-32 h-32 rounded-2xl overflow-hidden flex-shrink-0 bg-slate-100">
                      <img 
                        src={app.job.coverImageURL} 
                        alt={app.job.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  {/* Información */}
                  <div className="flex-grow">
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div>
                        <h3 className="text-xl font-bold text-slate-900">
                          {app.job?.title || 'Gig no disponible'}
                        </h3>
                        {app.job?.location && (
                          <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                            <MapPin className="w-3 h-3" />
                            {app.job.location}
                          </p>
                        )}
                      </div>
                      {getStatusBadge(app.status)}
                    </div>

                    {/* Detalles */}
                    <div className="grid sm:grid-cols-3 gap-4 mb-4">
                      {app.job?.date && (
                        <div>
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            Fecha
                          </p>
                          <p className="text-sm font-semibold">{new Date(app.job.date).toLocaleDateString('es-ES')}</p>
                        </div>
                      )}
                      {app.job?.budget && (
                        <div>
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <DollarSign className="w-3 h-3" />
                            Presupuesto
                          </p>
                          <p className="text-sm font-semibold">${app.job.budget.toLocaleString()} COP</p>
                        </div>
                      )}
                      {app.createdAt && (
                        <div>
                          <p className="text-xs text-muted-foreground">Postulación</p>
                          <p className="text-sm font-semibold">
                            {new Date(app.createdAt.toDate?.() || app.createdAt).toLocaleDateString('es-ES')}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Botones */}
                    <div className="flex gap-2">
                      <Link to={`/jobs/${app.jobId}`}>
                        <Button variant="outline" size="sm" className="rounded-lg">
                          Ver Detalles
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
