import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../lib/useAuth';
import { applyToJob, finalizeJobWithReview, getJobApplications, getJobById, hasUserAppliedToJob, Job, JobApplication } from '../lib/jobService';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { toast } from 'sonner';
import { Textarea } from '../components/ui/textarea';
import { Calendar, Clock, DollarSign, MapPin, Users } from 'lucide-react';

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

  return url;
};

export default function JobDetail() {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [job, setJob] = useState<Job | null>(null);
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [alreadyApplied, setAlreadyApplied] = useState(false);
  const [reviewingApplicationId, setReviewingApplicationId] = useState<string | null>(null);
  const [reviewRating, setReviewRating] = useState('5');
  const [reviewComment, setReviewComment] = useState('');
  const [finalizing, setFinalizing] = useState(false);

  const fetchJob = async () => {
    if (!jobId) return;
    setLoading(true);
    try {
      const data = await getJobById(jobId);
      setJob(data);

      if (data && profile?.role === 'musician') {
        const applied = await hasUserAppliedToJob(data.id!, profile.uid);
        setAlreadyApplied(applied);
      }

      if (data && profile?.role === 'employer' && profile.uid === data.employerId) {
        const applicantData = await getJobApplications(data.id!);
        setApplications(applicantData);
      }
    } catch (error) {
      console.error('Error fetching job detail:', error);
      toast.error('No se pudo cargar el gig.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJob();
  }, [jobId, profile?.role, profile?.uid]);

  const handleApply = async () => {
    if (!jobId || !user || !profile) {
      toast.error('Debes iniciar sesión para postularte.');
      navigate('/auth');
      return;
    }

    if (profile.role !== 'musician') {
      toast.error('Solo perfiles de artista pueden postularse.');
      return;
    }

    if (job && profile.uid === job.employerId) {
      toast.error('No puedes postularte a un gig publicado por tu propia cuenta.');
      return;
    }

    if (job?.status !== 'open') {
      toast.error('Este gig ya no está abierto para postulaciones.');
      return;
    }

    if (alreadyApplied) {
      toast.info('Ya te habías postulado a este gig.');
      return;
    }

    setSubmitting(true);
    try {
      await applyToJob({
        jobId,
        musicianId: profile.uid,
        musicianName: profile.displayName,
        musicianEmail: profile.email,
        musicianPhotoURL: profile.photoURL,
        musicianBio: profile.bio,
      });
      setAlreadyApplied(true);
      // Refrescar datos después de aplicar exitosamente
      await fetchJob();
      toast.success('Postulación enviada correctamente.');
    } catch (error) {
      const errorCode = (error as { code?: string })?.code;
      if (errorCode === 'application/already-exists') {
        toast.info('Ya te habías postulado a este gig.');
      } else if (errorCode === 'permission-denied') {
        toast.error('Tu cuenta no tiene permisos para postularse todavía. Si ya actualizaste reglas, vuelve a desplegarlas.');
      } else if (errorCode === 'failed-precondition') {
        toast.error('Falta un índice de Firestore para completar la postulación.');
      } else if (errorCode === 'invalid-argument') {
        toast.error('Datos inválidos en la postulación. Actualiza la página y vuelve a intentar.');
      } else {
        toast.error('No fue posible enviar la postulación.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleFinalizeWithReview = async (application: JobApplication) => {
    if (!job || !profile) return;

    const parsedRating = Number(reviewRating);
    if (!Number.isFinite(parsedRating) || parsedRating < 1 || parsedRating > 5) {
      toast.error('La calificación debe estar entre 1 y 5.');
      return;
    }

    if (!reviewComment.trim()) {
      toast.error('Escribe una reseña antes de finalizar.');
      return;
    }

    setFinalizing(true);
    try {
      await finalizeJobWithReview(
        job.id!,
        profile.uid,
        profile.displayName,
        application,
        parsedRating,
        reviewComment.trim()
      );
      toast.success('Evento finalizado y reseña registrada.');
      setReviewingApplicationId(null);
      setReviewComment('');
      setReviewRating('5');
      await fetchJob();
    } catch (error) {
      console.error('Error finalizing event:', error);
      const code = (error as { code?: string })?.code;
      if (code === 'review/already-exists') {
        toast.info('Este artista ya fue reseñado para este gig.');
      } else {
        toast.error('No se pudo finalizar el evento con reseña.');
      }
    } finally {
      setFinalizing(false);
    }
  };

  if (loading) {
    return <div className="h-60 rounded-3xl bg-slate-50 animate-pulse" />;
  }

  if (!job) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">Este gig no existe o ya no está disponible.</p>
        <Button variant="link" onClick={() => navigate('/jobs')}>Ver otros gigs</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => navigate(-1)}>Volver</Button>
        <Badge variant={job.status === 'open' ? 'default' : 'secondary'}>{job.status === 'open' ? 'Abierto' : 'Cerrado'}</Badge>
      </div>

      <Card className="rounded-3xl border-none shadow-sm">
        {(job.coverImageURL || job.media?.find((item) => item.type === 'image')?.url) && (
          <div className="h-72 overflow-hidden rounded-t-3xl">
            <img
              src={job.coverImageURL || job.media?.find((item) => item.type === 'image')?.url}
              alt={job.title}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
        )}
        <CardHeader>
          <CardTitle className="text-3xl">{job.title}</CardTitle>
          <CardDescription className="text-base">{job.description}</CardDescription>
          <div>
            <Button variant="link" className="px-0" asChild>
              <Link to={`/business/${job.employerId}`}>Ver perfil del negocio</Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
            <div className="rounded-xl bg-slate-50 p-3 flex items-center gap-2"><Calendar className="w-4 h-4" />{job.date}</div>
            <div className="rounded-xl bg-slate-50 p-3 flex items-center gap-2"><Clock className="w-4 h-4" />{job.time || 'Hora por definir'}</div>
            <div className="rounded-xl bg-slate-50 p-3 flex items-center gap-2"><MapPin className="w-4 h-4" />{job.location}</div>
            <div className="rounded-xl bg-slate-50 p-3 flex items-center gap-2"><DollarSign className="w-4 h-4" />${job.budget.toLocaleString()} COP</div>
            <div className="rounded-xl bg-slate-50 p-3 flex items-center gap-2"><Users className="w-4 h-4" />{job.audienceSize || 'Audiencia por definir'}</div>
            <div className="rounded-xl bg-slate-50 p-3">{job.eventType || 'Tipo de evento por definir'}</div>
            <div className="rounded-xl bg-slate-50 p-3 sm:col-span-2 lg:col-span-3">Tipo de negocio: {job.businessType || 'No especificado'}</div>
          </div>

          {job.media && job.media.length > 0 && (
            <div className="grid md:grid-cols-2 gap-4">
              {job.media.map((item, index) => (
                <div key={`${item.url}-${index}`} className="rounded-2xl border bg-slate-50 overflow-hidden">
                  {item.type === 'image' ? (
                    <img src={item.url} alt={`media-${index}`} className="w-full h-72 object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <iframe
                      title={`video-${index}`}
                      src={toVideoEmbedUrl(item.url)}
                      className="w-full h-72"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      referrerPolicy="strict-origin-when-cross-origin"
                      allowFullScreen
                    />
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="rounded-3xl border-none shadow-sm">
        <CardHeader>
          <CardTitle>Aplicar al gig</CardTitle>
          <CardDescription>Presupuesto base: ${job.budget.toLocaleString()} COP</CardDescription>
        </CardHeader>
        <CardContent>
          {profile?.role === 'musician' && job.status === 'open' ? (
            <Button onClick={handleApply} disabled={submitting || alreadyApplied} className="rounded-full w-full h-11">
              {alreadyApplied ? 'Ya te postulaste' : (submitting ? 'Enviando...' : 'Postularme a este gig')}
            </Button>
          ) : (
            <p className="text-sm text-muted-foreground">Solo artistas autenticados pueden postularse a gigs abiertos.</p>
          )}
        </CardContent>
      </Card>

      {job.faq && job.faq.length > 0 && (
        <Card className="rounded-3xl border-none shadow-sm">
          <CardHeader>
            <CardTitle>Preguntas frecuentes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {job.faq.map((item, index) => (
              <div key={`${item.question}-${index}`} className="rounded-xl bg-slate-50 p-4">
                <p className="font-semibold">{item.question}</p>
                <p className="text-sm text-muted-foreground mt-1">{item.answer}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {profile?.role === 'employer' && profile.uid === job.employerId && (
        <Card className="rounded-3xl border-none shadow-sm">
          <CardHeader>
            <CardTitle>Postulaciones recibidas</CardTitle>
            <CardDescription>{applications.length} artista(s) han aplicado</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {applications.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aún no tienes postulaciones para este gig.</p>
            ) : (
              applications.map((item) => (
                <div key={item.id} className="rounded-xl border p-3 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="font-semibold">{item.musicianName}</p>
                      <p className="text-xs text-muted-foreground">{item.musicianEmail}</p>
                      <p className="text-xs text-muted-foreground capitalize">Estado: {item.status}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" asChild className="rounded-xl">
                        <Link to={`/artists/${item.musicianId}`}>Ver perfil</Link>
                      </Button>
                      {job.status !== 'completed' && (
                        <Button
                          variant="secondary"
                          className="rounded-xl"
                          onClick={() => {
                            setReviewingApplicationId(item.id || null);
                            setReviewRating('5');
                            setReviewComment('');
                          }}
                        >
                          Finalizar y reseñar
                        </Button>
                      )}
                    </div>
                  </div>

                  {reviewingApplicationId === item.id && (
                    <div className="rounded-xl bg-slate-50 p-3 space-y-3">
                      <p className="text-sm font-semibold">Calificar al artista y finalizar este gig</p>
                      <div className="grid sm:grid-cols-4 gap-2 items-center">
                        <label className="text-sm text-muted-foreground">Calificación</label>
                        <select
                          className="sm:col-span-3 rounded-xl h-10 px-3 border bg-background"
                          value={reviewRating}
                          onChange={(e) => setReviewRating(e.target.value)}
                        >
                          <option value="5">5 - Excelente</option>
                          <option value="4">4 - Muy bueno</option>
                          <option value="3">3 - Bueno</option>
                          <option value="2">2 - Regular</option>
                          <option value="1">1 - Deficiente</option>
                        </select>
                      </div>
                      <Textarea
                        className="rounded-xl min-h-[90px]"
                        placeholder="Escribe una reseña breve sobre puntualidad, calidad y trato profesional."
                        value={reviewComment}
                        onChange={(e) => setReviewComment(e.target.value)}
                      />
                      <div className="flex gap-2 justify-end">
                        <Button variant="ghost" onClick={() => setReviewingApplicationId(null)} disabled={finalizing}>
                          Cancelar
                        </Button>
                        <Button onClick={() => handleFinalizeWithReview(item)} disabled={finalizing}>
                          {finalizing ? 'Finalizando...' : 'Guardar reseña y finalizar'}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
