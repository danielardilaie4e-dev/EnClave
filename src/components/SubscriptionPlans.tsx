import React, { useState } from 'react';
import { useAuth } from '../lib/useAuth';
import { updateUserProfile } from '../lib/userService';
import { SUBSCRIPTION_PLANS, SubscriptionPlan, getPlanDetails } from '../lib/subscriptionPlans';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Check, Star } from 'lucide-react';
import { toast } from 'sonner';

interface SubscriptionPlansProps {
  onComplete?: () => void;
}

export default function SubscriptionPlans({ onComplete }: SubscriptionPlansProps) {
  const { profile, refreshProfile } = useAuth();
  const [loading, setLoading] = useState<string | null>(null);

  if (!profile) return null;

  const currentPlan = profile.subscription || 'free';

  const handleSelectPlan = async (plan: SubscriptionPlan) => {
    if (plan === currentPlan) return;

    setLoading(plan);
    try {
      await updateUserProfile(profile.uid, { subscription: plan });
      await refreshProfile();
      toast.success(`¡Plan ${getPlanDetails(plan).name} activado!`);
      if (onComplete) onComplete();
    } catch (error) {
      console.error('Error updating subscription:', error);
      toast.error('Error al actualizar el plan.');
    } finally {
      setLoading(null);
    }
  };

  const renderBenefits = (plan: SubscriptionPlan) => {
    const details = getPlanDetails(plan);
    const benefits = [];

    if (profile.role === 'employer') {
      benefits.push(
        `Publicar hasta ${details.benefits.eventsPerMonth === -1 ? 'ilimitados' : details.benefits.eventsPerMonth} eventos al mes`,
        `Realizar hasta ${details.benefits.hiresPerMonth === -1 ? 'ilimitadas' : details.benefits.hiresPerMonth} contrataciones al mes`,
        `Visibilidad: ${details.benefits.visibility}`
      );
    } else if (profile.role === 'musician') {
      benefits.push(
        `Visibilidad: ${details.benefits.visibility}`,
        details.benefits.suggestedProfiles ? 'Aparecer en perfiles sugeridos' : 'Sin aparecer en sugeridos'
      );
    }

    return benefits.map((benefit, index) => (
      <li key={index} className="flex items-center gap-2">
        <Check className="w-4 h-4 text-green-500" />
        <span className="text-sm">{benefit}</span>
      </li>
    ));
  };

  return (
    <Card className="w-full rounded-3xl border-none shadow-lg">
      <CardHeader className="text-center pt-8 pb-4">
        <CardTitle className="text-3xl font-bold">Elige tu Plan de Suscripción</CardTitle>
        <CardDescription className="text-base mt-2">
          Selecciona el plan que mejor se ajuste a tus necesidades.
        </CardDescription>
      </CardHeader>
      
      <CardContent className="px-8 py-6">
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {Object.entries(SUBSCRIPTION_PLANS).map(([key, plan]) => {
            const planKey = key as SubscriptionPlan;
            const isCurrent = planKey === currentPlan;
            const isLoading = loading === planKey;

            return (
              <button
                key={planKey}
                onClick={() => handleSelectPlan(planKey)}
                disabled={isLoading}
                className={`relative rounded-2xl border-2 p-6 text-left transition-all hover:shadow-lg ${
                  isCurrent
                    ? 'border-primary bg-primary/5'
                    : planKey === 'premium'
                    ? 'border-yellow-400 bg-white hover:border-yellow-500'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                {/* Checkmark para plan actual */}
                {isCurrent && (
                  <div className="absolute top-4 right-4">
                    <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                  </div>
                )}

                {/* Badge Más Popular */}
                {planKey === 'premium' && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-yellow-400 text-slate-900 font-semibold">
                      <Star className="w-3 h-3 mr-1 fill-current" />
                      Más Popular
                    </Badge>
                  </div>
                )}

                {/* Contenido */}
                <div className="space-y-4">
                  <div>
                    <h3 className="text-2xl font-bold text-slate-900">{plan.name}</h3>
                    <p className="text-3xl font-bold text-primary mt-1">{plan.price}</p>
                  </div>

                  <ul className="space-y-2">
                    {renderBenefits(planKey)}
                  </ul>
                </div>
              </button>
            );
          })}
        </div>

        {/* Footer note */}
        <p className="text-xs text-muted-foreground text-center mb-6">
          * Los precios son simulados. En una implementación real, se integraría una pasarela de pago.
        </p>
      </CardContent>

      {/* Buttons */}
      <div className="px-8 pb-8 flex flex-col gap-3">
        <Button
          onClick={(e) => {
            e.preventDefault();
            // Para SubscriptionPlansPage, completar y redirigir
            if (onComplete) onComplete();
          }}
          disabled={loading !== null}
          className="w-full h-14 rounded-full text-base font-bold"
        >
          {loading ? 'Actualizando...' : 'Actualizar Plan'}
        </Button>
        <Button
          variant="ghost"
          className="w-full h-10"
          onClick={() => {
            // Volver a la página anterior
            window.history.back();
          }}
        >
          Volver
        </Button>
      </div>
    </Card>
  );
}