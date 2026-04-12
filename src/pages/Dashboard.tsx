import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/useAuth';
import { deleteJob, DEMO_JOBS, getJobs, getEmployerJobs, Job } from '../lib/jobService';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Input } from '../components/ui/input';
import { 
  Plus, 
  Music, 
  Calendar, 
  MapPin, 
  DollarSign,
  Search
} from 'lucide-react';
import { toast } from 'sonner';
import CreateJobDialog from '../components/jobs/CreateJobDialog';

export default function Dashboard() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [jobEditing, setJobEditing] = useState<Job | null>(null);
  const [selectedBusinessType, setSelectedBusinessType] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('all');
  const [selectedBudgetRange, setSelectedBudgetRange] = useState('all');

  const fetchJobs = async () => {
    if (!profile) return;
    setLoading(true);
    try {
      if (profile.role === 'employer') {
        const data = await getEmployerJobs(profile.uid);
        setJobs(data);
      } else {
        const data = await getJobs({ status: 'open' });
        setJobs([...DEMO_JOBS, ...data]);
      }
    } catch (error) {
      console.error('Error fetching jobs:', error);
      toast.error('No se pudieron cargar los trabajos.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, [profile]);

  const handleDeleteJob = async (jobId?: string) => {
    if (!jobId) return;

    const confirmed = window.confirm('¿Seguro que quieres borrar este gig? Esta acción no se puede deshacer.');
    if (!confirmed) return;

    try {
      await deleteJob(jobId);
      toast.success('Gig eliminado.');
      await fetchJobs();
    } catch (error) {
      console.error('Error deleting job:', error);
      toast.error('No se pudo eliminar el gig.');
    }
  };

  if (!profile) return null;

  const businessTypeOptions = Array.from(new Set(jobs.map((item) => item.businessType).filter(Boolean))) as string[];
  const genreOptions = Array.from(new Set(jobs.map((item) => item.genre).filter(Boolean))) as string[];

  const visibleJobs = jobs.filter((item) => {
    if (profile.role !== 'musician') return true;

    if (selectedBusinessType !== 'all' && item.businessType !== selectedBusinessType) return false;
    if (selectedGenre !== 'all' && item.genre !== selectedGenre) return false;

    if (selectedBudgetRange === 'low' && item.budget >= 800000) return false;
    if (selectedBudgetRange === 'mid' && (item.budget < 800000 || item.budget > 1800000)) return false;
    if (selectedBudgetRange === 'high' && item.budget <= 1800000) return false;

    const haystack = `${item.title} ${item.description} ${item.location} ${item.eventType || ''} ${item.businessType || ''}`.toLowerCase();
    if (searchTerm.trim() && !haystack.includes(searchTerm.trim().toLowerCase())) return false;

    return true;
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Hola, {profile.displayName}</h1>
          <p className="text-muted-foreground">Gestiona tus actividades y oportunidades en EnClave.</p>
        </div>
        {profile.role === 'employer' && (
          <Button onClick={() => setIsCreateDialogOpen(true)} className="rounded-full h-12 px-6">
            <Plus className="mr-2 h-5 w-5" />
            Publicar Nuevo Gig
          </Button>
        )}
      </div>

      <Tabs defaultValue="active" className="w-full">
        <TabsList className="bg-slate-100 p-1 rounded-xl h-12 mb-8">
          <TabsTrigger value="active" className="rounded-lg px-6 h-10 data-[state=active]:bg-white data-[state=active]:shadow-sm">
            {profile.role === 'employer' ? 'Mis Publicaciones' : 'Oportunidades Disponibles'}
          </TabsTrigger>
          <TabsTrigger value="history" className="rounded-lg px-6 h-10 data-[state=active]:bg-white data-[state=active]:shadow-sm">
            Historial
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-6">
          {profile.role === 'musician' && (
            <div className="rounded-2xl border bg-white p-4 space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  className="pl-10 rounded-xl h-11"
                  placeholder="Buscar por nombre de evento, tipo de lugar, ciudad o descripción"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <select
                  className="rounded-xl h-11 px-3 border bg-background"
                  value={selectedBusinessType}
                  onChange={(e) => setSelectedBusinessType(e.target.value)}
                >
                  <option value="all">Tipo de negocio: todos</option>
                  {businessTypeOptions.map((item) => (
                    <option key={item} value={item}>{item}</option>
                  ))}
                </select>

                <select
                  className="rounded-xl h-11 px-3 border bg-background"
                  value={selectedGenre}
                  onChange={(e) => setSelectedGenre(e.target.value)}
                >
                  <option value="all">Género: todos</option>
                  {genreOptions.map((item) => (
                    <option key={item} value={item}>{item}</option>
                  ))}
                </select>

                <select
                  className="rounded-xl h-11 px-3 border bg-background"
                  value={selectedBudgetRange}
                  onChange={(e) => setSelectedBudgetRange(e.target.value)}
                >
                  <option value="all">Presupuesto: todos</option>
                  <option value="low">Menos de 800.000 COP</option>
                  <option value="mid">800.000 a 1.800.000 COP</option>
                  <option value="high">Más de 1.800.000 COP</option>
                </select>
              </div>
            </div>
          )}
          {loading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => (
                <Card key={i} className="animate-pulse h-64 bg-slate-50 border-none rounded-3xl" />
              ))}
            </div>
          ) : visibleJobs.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {visibleJobs.map(job => (
                <Card key={job.id} className="rounded-3xl border-none shadow-sm hover:shadow-md transition-shadow overflow-hidden group">
                  {(job.coverImageURL || job.media?.find((item) => item.type === 'image')?.url) && (
                    <div className="h-36 overflow-hidden">
                      <img
                        src={job.coverImageURL || job.media?.find((item) => item.type === 'image')?.url}
                        alt={job.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  )}
                  <CardHeader className="pb-4">
                    <div className="flex justify-between items-start mb-2">
                      <Badge variant={job.status === 'open' ? 'default' : 'secondary'} className="rounded-full">
                        {job.status === 'open' ? 'Abierto' : 'Cerrado'}
                      </Badge>
                      <span className="text-xs text-muted-foreground font-mono">
                        {job.createdAt?.toDate ? new Date(job.createdAt.toDate()).toLocaleDateString() : new Date().toLocaleDateString()}
                      </span>
                    </div>
                    <CardTitle className="text-xl group-hover:text-primary transition-colors">{job.title}</CardTitle>
                    <CardDescription className="line-clamp-2">{job.description}</CardDescription>
                    {job.businessType && (
                      <Badge variant="secondary" className="w-fit rounded-full">{job.businessType}</Badge>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-3 pb-6">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="w-4 h-4" />
                      <span>{job.date}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="w-4 h-4" />
                      <span>{job.location}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm font-bold text-primary">
                      <DollarSign className="w-4 h-4" />
                      <span>${job.budget.toLocaleString()} COP</span>
                    </div>
                  </CardContent>
                  <CardFooter className="bg-slate-50/50 p-4 grid grid-cols-1 gap-2">
                    <Button variant="outline" className="w-full rounded-xl" onClick={() => navigate(`/jobs/${job.id}`)}>
                      Ver Detalles
                    </Button>
                    {profile.role === 'employer' && (
                      <>
                        <Button variant="secondary" className="w-full rounded-xl" onClick={() => setJobEditing(job)}>
                          Editar Gig
                        </Button>
                        <Button variant="destructive" className="w-full rounded-xl" onClick={() => handleDeleteJob(job.id)}>
                          Borrar Gig
                        </Button>
                      </>
                    )}
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200">
              <div className="bg-white w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
                <Music className="w-10 h-10 text-slate-300" />
              </div>
              <h3 className="text-xl font-bold mb-2">No hay gigs activos</h3>
              <p className="text-muted-foreground max-w-xs mx-auto">
                {profile.role === 'employer' 
                  ? 'Empieza publicando tu primera oferta de trabajo musical.' 
                  : 'Vuelve pronto para ver nuevas oportunidades en Cali.'}
              </p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="history">
          <div className="text-center py-20 text-muted-foreground">
            El historial de presentaciones aparecerá aquí.
          </div>
        </TabsContent>
      </Tabs>

      <CreateJobDialog 
        isOpen={isCreateDialogOpen} 
        onClose={() => setIsCreateDialogOpen(false)} 
        onSuccess={fetchJobs}
      />
      <CreateJobDialog
        isOpen={Boolean(jobEditing)}
        onClose={() => setJobEditing(null)}
        onSuccess={fetchJobs}
        jobToEdit={jobEditing}
      />
    </div>
  );
}
