import React, { useEffect, useState } from 'react';
import { useAuth } from '../../lib/useAuth';
import { createJob, Job, JobFaq, JobMediaItem, updateJob } from '../../lib/jobService';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { toast } from 'sonner';

interface CreateJobDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  jobToEdit?: Job | null;
}

const emptyForm = {
  title: '',
  description: '',
  genre: '',
  date: '',
  time: '',
  location: '',
  budget: '',
  coverImageURL: '',
  eventType: '',
  audienceSize: '',
  durationMinutes: '',
  dressCode: '',
  technicalRequirements: '',
  additionalNotes: '',
};

export default function CreateJobDialog({ isOpen, onClose, onSuccess, jobToEdit }: CreateJobDialogProps) {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState(emptyForm);
  const [media, setMedia] = useState<JobMediaItem[]>([]);
  const [mediaType, setMediaType] = useState<'image' | 'video'>('image');
  const [mediaUrl, setMediaUrl] = useState('');
  const [faq, setFaq] = useState<JobFaq[]>([]);
  const [faqQuestion, setFaqQuestion] = useState('');
  const [faqAnswer, setFaqAnswer] = useState('');

  const isEditMode = Boolean(jobToEdit?.id);

  useEffect(() => {
    if (!isOpen) return;

    if (jobToEdit) {
      setFormData({
        title: jobToEdit.title || '',
        description: jobToEdit.description || '',
        genre: jobToEdit.genre || '',
        date: jobToEdit.date || '',
        time: jobToEdit.time || '',
        location: jobToEdit.location || '',
        budget: String(jobToEdit.budget || ''),
        coverImageURL: jobToEdit.coverImageURL || '',
        eventType: jobToEdit.eventType || '',
        audienceSize: jobToEdit.audienceSize || '',
        durationMinutes: jobToEdit.durationMinutes ? String(jobToEdit.durationMinutes) : '',
        dressCode: jobToEdit.dressCode || '',
        technicalRequirements: jobToEdit.technicalRequirements || '',
        additionalNotes: jobToEdit.additionalNotes || '',
      });
      setMedia(jobToEdit.media || []);
      setFaq(jobToEdit.faq || []);
      return;
    }

    setFormData(emptyForm);
    setMedia([]);
    setFaq([]);
  }, [isOpen, jobToEdit]);

  const handleAddMedia = () => {
    const normalizedUrl = mediaUrl.trim();
    if (!normalizedUrl) {
      toast.error('Ingresa un enlace para la foto o video.');
      return;
    }

    if (!/^https?:\/\//.test(normalizedUrl)) {
      toast.error('El enlace debe iniciar con http:// o https://');
      return;
    }

    setMedia((current) => [...current, { type: mediaType, url: normalizedUrl }]);
    setMediaUrl('');
  };

  const handleRemoveMedia = (index: number) => {
    setMedia((current) => current.filter((_, itemIndex) => itemIndex !== index));
  };

  const handleAddFaq = () => {
    const question = faqQuestion.trim();
    const answer = faqAnswer.trim();
    if (!question || !answer) {
      toast.error('Completa la pregunta y respuesta.');
      return;
    }

    setFaq((current) => [...current, { question, answer }]);
    setFaqQuestion('');
    setFaqAnswer('');
  };

  const handleRemoveFaq = (index: number) => {
    setFaq((current) => current.filter((_, itemIndex) => itemIndex !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    if (!formData.title || !formData.date || !formData.budget) {
      toast.error('Por favor completa los campos obligatorios.');
      return;
    }

    if (formData.coverImageURL.trim() && !/^https?:\/\//.test(formData.coverImageURL.trim())) {
      toast.error('La imagen de portada debe iniciar con http:// o https://');
      return;
    }

    const payload = {
      title: formData.title,
      description: formData.description,
      genre: formData.genre,
      date: formData.date,
      time: formData.time,
      location: formData.location || profile.location || 'Cali',
      budget: Number(formData.budget),
      coverImageURL: formData.coverImageURL.trim() || undefined,
      businessType: profile.establishmentType || undefined,
      eventType: formData.eventType,
      audienceSize: formData.audienceSize,
      durationMinutes: formData.durationMinutes ? Number(formData.durationMinutes) : undefined,
      dressCode: formData.dressCode,
      technicalRequirements: formData.technicalRequirements,
      additionalNotes: formData.additionalNotes,
      media,
      faq,
    };

    setLoading(true);
    try {
      if (isEditMode && jobToEdit?.id) {
        await updateJob(jobToEdit.id, payload);
        toast.success('Gig actualizado con éxito.');
      } else {
        await createJob({
          employerId: profile.uid,
          ...payload,
          status: 'open',
        });
        toast.success('¡Gig publicado con éxito!');
      }

      onSuccess();
      onClose();
      setFormData(emptyForm);
      setMedia([]);
      setFaq([]);
    } catch (error) {
      console.error('Error saving job:', error);
      toast.error(isEditMode ? 'Hubo un error al actualizar el gig.' : 'Hubo un error al publicar el gig.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[850px] rounded-[2rem] p-8 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">{isEditMode ? 'Editar Gig' : 'Publicar Nuevo Gig'}</DialogTitle>
          <DialogDescription>Personaliza tu gig con detalles, multimedia y preguntas frecuentes.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-5 py-4">
          <Tabs defaultValue="general" className="w-full">
            <TabsList className="grid grid-cols-3 rounded-xl">
              <TabsTrigger value="general">General</TabsTrigger>
              <TabsTrigger value="media">Media</TabsTrigger>
              <TabsTrigger value="faq">FAQ</TabsTrigger>
            </TabsList>

            <TabsContent value="general" className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="title">Título del Evento *</Label>
                <Input id="title" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className="rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Descripción</Label>
                <Textarea id="description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="rounded-xl min-h-[90px]" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date">Fecha *</Label>
                  <Input id="date" type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} className="rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="time">Hora</Label>
                  <Input id="time" type="time" value={formData.time} onChange={(e) => setFormData({ ...formData, time: e.target.value })} className="rounded-xl" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="budget">Presupuesto base (COP) *</Label>
                  <Input id="budget" type="number" value={formData.budget} onChange={(e) => setFormData({ ...formData, budget: e.target.value })} className="rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="genre">Género Musical</Label>
                  <Input id="genre" value={formData.genre} onChange={(e) => setFormData({ ...formData, genre: e.target.value })} className="rounded-xl" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="location">Ubicación</Label>
                  <Input id="location" value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} className="rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="eventType">Tipo de evento</Label>
                  <Input id="eventType" value={formData.eventType} onChange={(e) => setFormData({ ...formData, eventType: e.target.value })} className="rounded-xl" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="coverImageURL">Imagen de portada (opcional)</Label>
                <Input
                  id="coverImageURL"
                  placeholder="https://..."
                  value={formData.coverImageURL}
                  onChange={(e) => setFormData({ ...formData, coverImageURL: e.target.value })}
                  className="rounded-xl"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="audienceSize">Tamaño de audiencia</Label>
                  <Input id="audienceSize" value={formData.audienceSize} onChange={(e) => setFormData({ ...formData, audienceSize: e.target.value })} className="rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="durationMinutes">Duración esperada (min)</Label>
                  <Input id="durationMinutes" type="number" value={formData.durationMinutes} onChange={(e) => setFormData({ ...formData, durationMinutes: e.target.value })} className="rounded-xl" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="dressCode">Dress code</Label>
                <Input id="dressCode" value={formData.dressCode} onChange={(e) => setFormData({ ...formData, dressCode: e.target.value })} className="rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="technicalRequirements">Requerimientos técnicos</Label>
                <Textarea id="technicalRequirements" value={formData.technicalRequirements} onChange={(e) => setFormData({ ...formData, technicalRequirements: e.target.value })} className="rounded-xl min-h-[70px]" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="additionalNotes">Notas adicionales</Label>
                <Textarea id="additionalNotes" value={formData.additionalNotes} onChange={(e) => setFormData({ ...formData, additionalNotes: e.target.value })} className="rounded-xl min-h-[70px]" />
              </div>
            </TabsContent>

            <TabsContent value="media" className="space-y-4 pt-4">
              <div className="grid grid-cols-4 gap-3">
                <div className="space-y-1 col-span-1">
                  <Label>Tipo</Label>
                  <select className="w-full rounded-xl h-10 px-3 border bg-background" value={mediaType} onChange={(e) => setMediaType(e.target.value as 'image' | 'video')}>
                    <option value="image">Foto</option>
                    <option value="video">Video</option>
                  </select>
                </div>
                <div className="space-y-1 col-span-2">
                  <Label>URL de media</Label>
                  <Input placeholder="https://..." value={mediaUrl} onChange={(e) => setMediaUrl(e.target.value)} className="rounded-xl" />
                </div>
                <div className="flex items-end">
                  <Button type="button" variant="outline" className="w-full rounded-xl" onClick={handleAddMedia}>Agregar</Button>
                </div>
              </div>

              {media.length > 0 && (
                <div className="space-y-2">
                  {media.map((item, index) => (
                    <div key={`${item.url}-${index}`} className="rounded-xl border px-3 py-2 flex items-center justify-between gap-2 bg-white">
                      <p className="text-sm truncate min-w-0"><span className="font-semibold mr-2 uppercase">{item.type}</span>{item.url}</p>
                      <Button type="button" variant="ghost" onClick={() => handleRemoveMedia(index)}>Eliminar</Button>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="faq" className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Pregunta</Label>
                <Input value={faqQuestion} onChange={(e) => setFaqQuestion(e.target.value)} className="rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label>Respuesta</Label>
                <Textarea value={faqAnswer} onChange={(e) => setFaqAnswer(e.target.value)} className="rounded-xl min-h-[70px]" />
              </div>
              <Button type="button" variant="outline" className="rounded-xl" onClick={handleAddFaq}>Agregar FAQ</Button>
              {faq.length > 0 && (
                <div className="space-y-2">
                  {faq.map((item, index) => (
                    <div key={`${item.question}-${index}`} className="rounded-xl border bg-white p-3">
                      <p className="font-semibold text-sm">{item.question}</p>
                      <p className="text-sm text-muted-foreground">{item.answer}</p>
                      <Button type="button" variant="ghost" className="px-0 h-7 mt-1" onClick={() => handleRemoveFaq(index)}>Quitar</Button>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>

          <DialogFooter className="pt-4">
            <Button type="button" variant="ghost" onClick={onClose} disabled={loading}>Cancelar</Button>
            <Button type="submit" disabled={loading} className="rounded-full px-8">
              {loading ? (isEditMode ? 'Guardando...' : 'Publicando...') : (isEditMode ? 'Guardar cambios' : 'Publicar Gig')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
