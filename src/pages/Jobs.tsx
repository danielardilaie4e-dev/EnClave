import { useState, useEffect } from 'react';
import { getJobs, Job } from '../lib/jobService';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { 
  Search, 
  Calendar, 
  MapPin, 
  DollarSign, 
  Music,
  Filter,
  ArrowRight
} from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

export default function Jobs() {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const data = await getJobs({ status: 'open' });
      setJobs(data);
    } catch (error) {
      console.error('Error fetching jobs:', error);
      toast.error('No se pudieron cargar las ofertas.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const filteredJobs = jobs.filter(job => 
    job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    job.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    job.genre.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenJob = (job: Job) => {
    navigate(`/jobs/${job.id}`);
  };

  return (
    <div className="space-y-12">
      <div className="text-center space-y-4 max-w-2xl mx-auto">
        <h1 className="text-4xl font-bold tracking-tight">Encuentra tu próximo escenario</h1>
        <p className="text-muted-foreground text-lg">Explora las mejores oportunidades musicales en Cali y aplica de forma segura.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-center bg-white p-4 rounded-3xl shadow-sm border">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
          <Input 
            placeholder="Buscar por género, título o descripción..." 
            className="pl-12 h-12 rounded-2xl border-none bg-slate-50"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button variant="outline" className="rounded-2xl h-12 px-6 gap-2">
          <Filter className="w-4 h-4" />
          Filtros
        </Button>
      </div>

      {loading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <Card key={i} className="animate-pulse h-80 bg-slate-50 border-none rounded-[2rem]" />
          ))}
        </div>
      ) : filteredJobs.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredJobs.map(job => (
            <Card key={job.id} className="rounded-[2rem] border-none shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden group flex flex-col">
              <div className="h-56 overflow-hidden relative">
                {(job.coverImageURL || job.media?.find((item) => item.type === 'image')?.url) ? (
                  <img
                    src={job.coverImageURL || job.media?.find((item) => item.type === 'image')?.url}
                    alt={job.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-slate-800 via-slate-700 to-slate-900 flex items-center justify-center">
                    <Music className="w-12 h-12 text-white/70" />
                  </div>
                )}
                <div className="absolute top-4 left-4">
                  <div className="flex gap-2 flex-wrap">
                    <Badge className="bg-white/90 backdrop-blur text-primary hover:bg-white rounded-full px-3 py-1">
                      {job.genre || 'Varios'}
                    </Badge>
                    {job.businessType && (
                      <Badge className="bg-slate-900/80 text-white hover:bg-slate-900 rounded-full px-3 py-1">
                        {job.businessType}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              <CardHeader className="pb-4">
                <CardTitle className="text-xl line-clamp-1 group-hover:text-primary transition-colors">{job.title}</CardTitle>
                <CardDescription className="line-clamp-2 min-h-[40px]">{job.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 flex-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="bg-slate-100 p-1.5 rounded-lg">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <span>{job.date}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="bg-slate-100 p-1.5 rounded-lg">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <span>{job.location}</span>
                </div>
                <div className="flex items-center gap-2 text-lg font-bold text-primary pt-2">
                  <DollarSign className="w-5 h-5" />
                  <span>${job.budget.toLocaleString()} COP</span>
                </div>
              </CardContent>
              <CardFooter className="p-6 pt-0">
                <Button 
                  onClick={() => handleOpenJob(job)} 
                  className="w-full rounded-2xl h-12 group"
                >
                  Ver Gig y Postular
                  <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-32 bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200">
          <div className="bg-white w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
            <Search className="w-12 h-12 text-slate-300" />
          </div>
          <h3 className="text-2xl font-bold mb-2">No encontramos resultados</h3>
          <p className="text-muted-foreground max-w-sm mx-auto">
            Intenta con otros términos de búsqueda o géneros musicales.
          </p>
          <Button variant="link" onClick={() => setSearchTerm('')} className="mt-4 text-primary font-bold">
            Ver todas las ofertas
          </Button>
        </div>
      )}
    </div>
  );
}
