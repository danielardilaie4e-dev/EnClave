import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  serverTimestamp,
  doc,
  updateDoc,
  getDoc,
  deleteDoc,
  setDoc
} from 'firebase/firestore';
import { db } from './firebase';

export interface JobMediaItem {
  type: 'image' | 'video';
  url: string;
}

export interface JobPackage {
  name: 'basico' | 'estandar' | 'premium';
  title: string;
  description: string;
  price: number;
  deliveryDays: number;
  expressDays?: number;
  expressExtra?: number;
}

export interface JobFaq {
  question: string;
  answer: string;
}

export interface JobApplication {
  id?: string;
  jobId: string;
  musicianId: string;
  musicianName: string;
  musicianEmail: string;
  musicianPhotoURL?: string;
  musicianBio?: string;
  status: 'pending' | 'shortlisted' | 'rejected';
  createdAt?: any;
}

export interface Job {
  id?: string;
  employerId: string;
  title: string;
  description: string;
  genre: string;
  date: string;
  time: string;
  location: string;
  budget: number;
  coverImageURL?: string;
  businessType?: string;
  eventType?: string;
  audienceSize?: string;
  durationMinutes?: number;
  dressCode?: string;
  technicalRequirements?: string;
  additionalNotes?: string;
  media?: JobMediaItem[];
  packages?: JobPackage[];
  faq?: JobFaq[];
  selectedMusicianId?: string;
  selectedMusicianName?: string;
  completedAt?: any;
  status: 'open' | 'closed' | 'completed';
  createdAt?: any;
}

export interface ReviewInput {
  jobId: string;
  fromId: string;
  fromName: string;
  toId: string;
  toName: string;
  rating: number;
  comment: string;
}

export const DEMO_JOBS: Job[] = [
  { id: 'demo-001', employerId: 'demo-employer-1', title: 'Noche de Salsa en Terraza', description: 'Buscamos agrupacion de salsa para animar noche de viernes con sets de 45 minutos.', genre: 'Salsa', date: '2026-05-09', time: '21:00', location: 'Granada, Cali', budget: 1200000, businessType: 'Bar restaurante', eventType: 'Noche temática', audienceSize: '120-180 personas', status: 'open', coverImageURL: 'https://picsum.photos/seed/demo001/1000/600' },
  { id: 'demo-002', employerId: 'demo-employer-2', title: 'Show Acústico para Brunch', description: 'Formato duo o trio acústico para ambiente relajado de domingo.', genre: 'Pop acústico', date: '2026-05-11', time: '11:30', location: 'Ciudad Jardín, Cali', budget: 650000, businessType: 'Restaurante', eventType: 'Brunch musical', audienceSize: '70-100 personas', status: 'open', coverImageURL: 'https://picsum.photos/seed/demo002/1000/600' },
  { id: 'demo-003', employerId: 'demo-employer-3', title: 'Banda de Rock para Festival Universitario', description: 'Se requieren bandas con repertorio propio y covers para cierre de jornada estudiantil.', genre: 'Rock', date: '2026-05-15', time: '18:00', location: 'Sur de Cali', budget: 1800000, businessType: 'Universidad / institución educativa', eventType: 'Festival', audienceSize: '500+ personas', status: 'open', coverImageURL: 'https://picsum.photos/seed/demo003/1000/600' },
  { id: 'demo-004', employerId: 'demo-employer-4', title: 'DJ Set para Rooftop de Hotel', description: 'Set de house elegante para publico internacional en rooftop premium.', genre: 'House', date: '2026-05-18', time: '20:30', location: 'Zona Norte, Cali', budget: 2200000, businessType: 'Hotel', eventType: 'Sunset session', audienceSize: '150 personas', status: 'open', coverImageURL: 'https://picsum.photos/seed/demo004/1000/600' },
  { id: 'demo-005', employerId: 'demo-employer-5', title: 'Cuarteto de Jazz para Cena Ejecutiva', description: 'Evento corporativo con repertorio jazz y bossa nova en volumen moderado.', genre: 'Jazz', date: '2026-05-20', time: '19:30', location: 'Centro, Cali', budget: 2500000, businessType: 'Corporativo / empresa privada', eventType: 'Cena empresarial', audienceSize: '90 personas', status: 'open', coverImageURL: 'https://picsum.photos/seed/demo005/1000/600' },
  { id: 'demo-006', employerId: 'demo-employer-6', title: 'Música Llanera para Feria Cultural', description: 'Presentacion de musica tradicional llanera para festival regional.', genre: 'Llanera', date: '2026-05-23', time: '16:00', location: 'Parque principal, Cali', budget: 1400000, businessType: 'Festival / feria', eventType: 'Feria cultural', audienceSize: '300 personas', status: 'open', coverImageURL: 'https://picsum.photos/seed/demo006/1000/600' },
  { id: 'demo-007', employerId: 'demo-employer-7', title: 'Trío de Boleros para Noche Romántica', description: 'Buscamos trio de boleros con presencia escenica y vestuario formal.', genre: 'Bolero', date: '2026-05-25', time: '20:00', location: 'San Antonio, Cali', budget: 900000, businessType: 'Restaurante', eventType: 'Noche romántica', audienceSize: '80 personas', status: 'open', coverImageURL: 'https://picsum.photos/seed/demo007/1000/600' },
  { id: 'demo-008', employerId: 'demo-employer-8', title: 'Mariachis para Celebración Familiar', description: 'Presentacion de 1 hora para cumpleaños en evento privado.', genre: 'Mariachi', date: '2026-05-27', time: '19:00', location: 'Pance, Cali', budget: 700000, businessType: 'Agencia de eventos privados', eventType: 'Cumpleaños privado', audienceSize: '40 personas', status: 'open', coverImageURL: 'https://picsum.photos/seed/demo008/1000/600' },
  { id: 'demo-009', employerId: 'demo-employer-9', title: 'Banda Tropical para Matrimonio', description: 'Show principal para recepcion de boda con repertorio bailable.', genre: 'Tropical', date: '2026-06-01', time: '22:00', location: 'Jamundí', budget: 3200000, businessType: 'Empresa de bodas y celebraciones', eventType: 'Matrimonio', audienceSize: '200 personas', status: 'open', coverImageURL: 'https://picsum.photos/seed/demo009/1000/600' },
  { id: 'demo-010', employerId: 'demo-employer-10', title: 'Cantante Solista para Casino', description: 'Formato solista con pistas para amenizar franjas nocturnas.', genre: 'Balada / pop latino', date: '2026-06-03', time: '23:00', location: 'Norte, Cali', budget: 1100000, businessType: 'Casino', eventType: 'Show nocturno', audienceSize: '130 personas', status: 'open', coverImageURL: 'https://picsum.photos/seed/demo010/1000/600' },
  { id: 'demo-011', employerId: 'demo-employer-11', title: 'Percusión Urbana para Activación de Marca', description: 'Show de alto impacto para lanzamiento de marca en centro comercial.', genre: 'Urbano', date: '2026-06-06', time: '17:00', location: 'Centro comercial, Cali', budget: 1700000, businessType: 'Empresa de activaciones de marca', eventType: 'Activación comercial', audienceSize: '250 personas', status: 'open', coverImageURL: 'https://picsum.photos/seed/demo011/1000/600' },
  { id: 'demo-012', employerId: 'demo-employer-12', title: 'Banda de Covers 80s/90s', description: 'Set list enfocado en clasicos para publico adulto en club social.', genre: 'Covers', date: '2026-06-08', time: '21:30', location: 'Oeste, Cali', budget: 1600000, businessType: 'Club nocturno', eventType: 'Noche retro', audienceSize: '180 personas', status: 'open', coverImageURL: 'https://picsum.photos/seed/demo012/1000/600' },
  { id: 'demo-013', employerId: 'demo-employer-13', title: 'Grupo Vallenato para Paranda', description: 'Presentación de 2 horas para evento corporativo con invitados VIP.', genre: 'Vallenato', date: '2026-06-10', time: '20:00', location: 'Yumbo', budget: 2100000, businessType: 'Centro de eventos', eventType: 'Parranda empresarial', audienceSize: '140 personas', status: 'open', coverImageURL: 'https://picsum.photos/seed/demo013/1000/600' },
  { id: 'demo-014', employerId: 'demo-employer-14', title: 'DJ Techno para Discoteca', description: 'Invitado especial para fecha de fin de semana, set de 3 horas.', genre: 'Techno', date: '2026-06-13', time: '23:30', location: 'Menga, Cali', budget: 3000000, businessType: 'Discoteca', eventType: 'Guest DJ Night', audienceSize: '350 personas', status: 'open', coverImageURL: 'https://picsum.photos/seed/demo014/1000/600' },
  { id: 'demo-015', employerId: 'demo-employer-15', title: 'Ensamble Instrumental para Museo', description: 'Música instrumental en inauguración de exposición de arte.', genre: 'Instrumental', date: '2026-06-15', time: '18:30', location: 'Centro histórico, Cali', budget: 1300000, businessType: 'Café cultural', eventType: 'Apertura cultural', audienceSize: '100 personas', status: 'open', coverImageURL: 'https://picsum.photos/seed/demo015/1000/600' },
  { id: 'demo-016', employerId: 'demo-employer-16', title: 'Show Infantil Musical en Parque', description: 'Presentacion didactica para familias durante jornada recreativa.', genre: 'Infantil', date: '2026-06-18', time: '10:00', location: 'Parque público, Cali', budget: 950000, businessType: 'Parque público', eventType: 'Jornada familiar', audienceSize: '220 personas', status: 'open', coverImageURL: 'https://picsum.photos/seed/demo016/1000/600' },
  { id: 'demo-017', employerId: 'demo-employer-17', title: 'Banda Fusión Latina para Teatro', description: 'Concierto de 90 minutos con puesta en escena y rider técnico básico.', genre: 'Fusión latina', date: '2026-06-20', time: '19:00', location: 'Teatro municipal, Cali', budget: 2600000, businessType: 'Teatro', eventType: 'Concierto', audienceSize: '280 personas', status: 'open', coverImageURL: 'https://picsum.photos/seed/demo017/1000/600' },
  { id: 'demo-018', employerId: 'demo-employer-18', title: 'Trío Andino para Hostal Boutique', description: 'Música ambiental para huéspedes extranjeros en noche temática.', genre: 'Andina', date: '2026-06-22', time: '20:00', location: 'San Fernando, Cali', budget: 800000, businessType: 'Hostal', eventType: 'Noche cultural', audienceSize: '60 personas', status: 'open', coverImageURL: 'https://picsum.photos/seed/demo018/1000/600' },
  { id: 'demo-019', employerId: 'demo-employer-19', title: 'Show Gospel para Encuentro Comunitario', description: 'Presentacion para comunidad con repertorio espiritual y participativo.', genre: 'Gospel', date: '2026-06-24', time: '17:30', location: 'Norte, Cali', budget: 1000000, businessType: 'Iglesia / comunidad religiosa', eventType: 'Encuentro comunitario', audienceSize: '160 personas', status: 'open', coverImageURL: 'https://picsum.photos/seed/demo019/1000/600' },
  { id: 'demo-020', employerId: 'demo-employer-20', title: 'Banda Son Cubano para Plaza Gastronómica', description: 'Música en vivo para dinamizar flujo de visitantes en fin de semana.', genre: 'Son cubano', date: '2026-06-27', time: '19:30', location: 'Plaza gastronómica, Cali', budget: 1500000, businessType: 'Plaza de mercado / gastronómica', eventType: 'Fin de semana en vivo', audienceSize: '240 personas', status: 'open', coverImageURL: 'https://picsum.photos/seed/demo020/1000/600' },
];

export const createJob = async (job: Omit<Job, 'id' | 'createdAt'>) => {
  const docRef = await addDoc(collection(db, 'jobs'), {
    ...job,
    createdAt: serverTimestamp()
  });
  return docRef.id;
};

export const getJobs = async (filters?: { genre?: string; status?: string }) => {
  let q = query(collection(db, 'jobs'), orderBy('createdAt', 'desc'));
  
  if (filters?.status) {
    q = query(q, where('status', '==', filters.status));
  } else {
    q = query(q, where('status', '==', 'open'));
  }

  if (filters?.genre) {
    q = query(q, where('genre', '==', filters.genre));
  }

  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Job));
};

export const getEmployerJobs = async (employerId: string) => {
  const q = query(
    collection(db, 'jobs'), 
    where('employerId', '==', employerId),
    orderBy('createdAt', 'desc')
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Job));
};

export const getJobById = async (jobId: string) => {
  const demoJob = DEMO_JOBS.find((item) => item.id === jobId);
  if (demoJob) {
    return demoJob;
  }

  const docRef = doc(db, 'jobs', jobId);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) return null;

  return { id: docSnap.id, ...docSnap.data() } as Job;
};

export const updateJobStatus = async (jobId: string, status: Job['status']) => {
  const docRef = doc(db, 'jobs', jobId);
  await updateDoc(docRef, { status });
};

export const updateJob = async (jobId: string, data: Partial<Job>) => {
  const docRef = doc(db, 'jobs', jobId);
  await updateDoc(docRef, data);
};

export const deleteJob = async (jobId: string) => {
  const docRef = doc(db, 'jobs', jobId);
  await deleteDoc(docRef);
};

export const applyToJob = async (input: Omit<JobApplication, 'id' | 'status' | 'createdAt'>) => {
  const applicationId = `${input.jobId}__${input.musicianId}`;
  const appDocRef = doc(db, 'job_applications', applicationId);
  const existingApplication = await getDoc(appDocRef);

  if (existingApplication.exists()) {
    const error = new Error('Ya aplicaste a este gig.') as Error & { code?: string };
    error.code = 'application/already-exists';
    throw error;
  }

  const payload = JSON.parse(JSON.stringify({
    ...input,
    status: 'pending',
    createdAt: serverTimestamp(),
  }));

  await setDoc(appDocRef, payload);
  return applicationId;
};

export const getJobApplications = async (jobId: string) => {
  const q = query(collection(db, 'job_applications'), where('jobId', '==', jobId));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs
    .map((item) => ({ id: item.id, ...item.data() } as JobApplication))
    .sort((a, b) => {
      const aTime = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
      const bTime = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
      return bTime - aTime;
    });
};

export const hasUserAppliedToJob = async (jobId: string, musicianId: string) => {
  const appDocRef = doc(db, 'job_applications', `${jobId}__${musicianId}`);
  const appDoc = await getDoc(appDocRef);
  return appDoc.exists();
};

export const getMusicianApplications = async (musicianId: string) => {
  const q = query(collection(db, 'job_applications'), where('musicianId', '==', musicianId));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs
    .map((item) => ({ id: item.id, ...item.data() } as JobApplication))
    .sort((a, b) => {
      const aTime = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
      const bTime = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
      return bTime - aTime;
    });
};

export const finalizeJobWithReview = async (
  jobId: string,
  employerId: string,
  employerName: string,
  application: JobApplication,
  rating: number,
  comment: string
) => {
  const jobRef = doc(db, 'jobs', jobId);
  const jobDoc = await getDoc(jobRef);

  if (!jobDoc.exists()) {
    const error = new Error('Gig no encontrado.') as Error & { code?: string };
    error.code = 'job/not-found';
    throw error;
  }

  const jobData = jobDoc.data() as Job;
  if (jobData.employerId !== employerId) {
    const error = new Error('No autorizado para finalizar este gig.') as Error & { code?: string };
    error.code = 'job/not-owner';
    throw error;
  }

  const reviewDocId = `${jobId}__${application.musicianId}`;
  const reviewRef = doc(db, 'reviews', reviewDocId);
  const existingReview = await getDoc(reviewRef);
  if (existingReview.exists()) {
    const error = new Error('Este artista ya fue reseñado para este gig.') as Error & { code?: string };
    error.code = 'review/already-exists';
    throw error;
  }

  await setDoc(reviewRef, {
    jobId,
    fromId: employerId,
    fromName: employerName,
    toId: application.musicianId,
    toName: application.musicianName,
    rating,
    comment,
    createdAt: serverTimestamp(),
  });

  await updateDoc(jobRef, {
    status: 'completed',
    selectedMusicianId: application.musicianId,
    selectedMusicianName: application.musicianName,
    completedAt: serverTimestamp(),
  });

  const selectedApplicationRef = doc(db, 'job_applications', `${jobId}__${application.musicianId}`);
  await updateDoc(selectedApplicationRef, { status: 'shortlisted' });

  const musicianReviewsQuery = query(collection(db, 'reviews'), where('toId', '==', application.musicianId));
  const musicianReviewsSnapshot = await getDocs(musicianReviewsQuery);
  const musicianReviews = musicianReviewsSnapshot.docs.map((item) => item.data() as { rating?: number });
  const reviewCount = musicianReviews.length;
  const totalRating = musicianReviews.reduce((acc, item) => acc + (item.rating || 0), 0);
  const averageRating = reviewCount > 0 ? Number((totalRating / reviewCount).toFixed(1)) : 0;

  const musicianRef = doc(db, 'users', application.musicianId);
  await updateDoc(musicianRef, {
    rating: averageRating,
    reviewCount,
  });
};
