import { Button } from '../components/ui/button';
import { useAuth } from '../lib/useAuth';
import { useNavigate } from 'react-router-dom';
import { 
  Music, 
  ShieldCheck, 
  Clock, 
  Globe, 
  Star,
  ArrowRight,
  CheckCircle2
} from 'lucide-react';
import { motion } from 'motion/react';

export default function Home() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  const handleStart = async () => {
    if (user) {
      navigate(profile ? '/dashboard' : '/onboarding');
    } else {
      navigate('/auth');
    }
  };

  return (
    <div className="space-y-24 pb-20">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 lg:pt-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-8"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
              <Star className="w-4 h-4 fill-primary" />
              <span>La clave que mueve la música en Cali</span>
            </div>
            <h1 className="text-5xl lg:text-7xl font-extrabold tracking-tight leading-tight">
              Formaliza tu talento, <span className="text-primary">asegura tu show.</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-lg leading-relaxed">
              Conectamos músicos y establecimientos en Cali de forma segura, transparente y profesional. Sin fraudes, con contratos claros.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button size="lg" onClick={handleStart} className="rounded-full px-8 text-lg h-14 group">
                Empezar Ahora
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate('/jobs')} className="rounded-full px-8 text-lg h-14">
                Ver Oportunidades
              </Button>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative"
          >
            <div className="aspect-square rounded-3xl overflow-hidden shadow-2xl rotate-3 bg-primary/5 p-4">
              <img 
                src="https://picsum.photos/seed/cali-music/800/800" 
                alt="Músicos en Cali" 
                className="w-full h-full object-cover rounded-2xl"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="absolute -bottom-6 -left-6 bg-white p-6 rounded-2xl shadow-xl border max-w-xs animate-bounce-slow">
              <div className="flex items-center gap-3 mb-2">
                <div className="bg-green-100 p-2 rounded-full">
                  <ShieldCheck className="w-5 h-5 text-green-600" />
                </div>
                <span className="font-bold">Pago Protegido</span>
              </div>
              <p className="text-sm text-muted-foreground">Tu dinero está seguro hasta que el show termine satisfactoriamente.</p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="bg-slate-50 -mx-4 px-4 py-24 rounded-[3rem]">
        <div className="max-w-4xl mx-auto text-center space-y-4 mb-16">
          <h2 className="text-3xl lg:text-5xl font-bold tracking-tight">¿Por qué elegir EnClave?</h2>
          <p className="text-lg text-muted-foreground">Diseñado específicamente para el ecosistema musical de nuestra ciudad.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              icon: <ShieldCheck className="w-8 h-8 text-primary" />,
              title: "Perfiles Verificados",
              desc: "Adiós a los fraudes. Validamos la identidad de músicos y empleadores."
            },
            {
              icon: <Clock className="w-8 h-8 text-primary" />,
              title: "Ahorro de Tiempo",
              desc: "Centraliza búsqueda, negociación y pago en un solo lugar."
            },
            {
              icon: <Globe className="w-8 h-8 text-primary" />,
              title: "Enfoque Local",
              desc: "Adaptado a las dinámicas y necesidades de Cali."
            }
          ].map((benefit, i) => (
            <motion.div 
              key={i}
              whileHover={{ y: -5 }}
              className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 space-y-4"
            >
              <div className="bg-primary/5 w-16 h-16 rounded-2xl flex items-center justify-center mb-6">
                {benefit.icon}
              </div>
              <h3 className="text-xl font-bold">{benefit.title}</h3>
              <p className="text-muted-foreground leading-relaxed">{benefit.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Features List */}
      <section className="grid lg:grid-cols-2 gap-16 items-center">
        <div className="space-y-8">
          <h2 className="text-4xl font-bold tracking-tight">Todo lo que necesitas para profesionalizar tu carrera</h2>
          <div className="space-y-4">
            {[
              "Contratos automatizados y claros",
              "Sistema de reputación basado en reseñas reales",
              "Bajo consumo de datos para conectividad limitada",
              "Gestión de necesidades técnicas (Riders)",
              "Historial de presentaciones y pagos"
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                <CheckCircle2 className="w-6 h-6 text-primary flex-shrink-0" />
                <span className="text-lg font-medium">{item}</span>
              </div>
            ))}
          </div>
          <Button size="lg" onClick={handleStart} className="rounded-full px-8">
            Unirse a la Comunidad
          </Button>
        </div>
        <div className="rounded-3xl overflow-hidden shadow-xl border">
          <img 
            src="https://picsum.photos/seed/concert/800/600" 
            alt="Concierto en Cali" 
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-primary rounded-[3rem] p-12 lg:p-24 text-center text-white space-y-8">
        <h2 className="text-4xl lg:text-6xl font-black tracking-tight">¿Listo para subir al escenario?</h2>
        <p className="text-xl opacity-90 max-w-2xl mx-auto">
          Únete a cientos de músicos y establecimientos que ya están transformando la escena musical en Cali.
        </p>
        <Button size="lg" variant="secondary" onClick={handleStart} className="rounded-full px-12 text-lg h-16 font-bold hover:scale-105 transition-transform">
          Crear mi Perfil Gratis
        </Button>
      </section>
    </div>
  );
}
