import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Label } from '../components/ui/label';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { toast } from 'sonner';
import { auth } from '../lib/firebase';
import { clearOnboardingIntent, setOnboardingIntent } from '../lib/onboardingIntent';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword
} from 'firebase/auth';

export default function Auth() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAuth = async () => {
    if (!email.trim() || !password.trim()) {
      toast.error('Ingresa correo y contraseña para iniciar sesión.');
      return;
    }

    setLoading(true);
    try {
      // Try to sign in
      await signInWithEmailAndPassword(auth, email, password);
      clearOnboardingIntent();
      toast.success('Sesión iniciada.');
    } catch (error: any) {
      console.error('Auth error:', error);
      if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
        toast.error('Credenciales inválidas o cuenta no encontrada.');
      } else if (error.code === 'auth/wrong-password') {
        toast.error('Contraseña incorrecta.');
      } else {
        toast.error('Error al iniciar sesión. Verifica tus datos.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!email.trim() || !password.trim()) {
      toast.error('Ingresa un correo y contraseña para registrarte.');
      return;
    }

    if (password.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    setLoading(true);
    try {
      const normalizedEmail = email.trim().toLowerCase();
      const credential = await createUserWithEmailAndPassword(auth, normalizedEmail, password);
      setOnboardingIntent(credential.user.uid);
      toast.success('Cuenta creada. Ahora completa tu perfil.');
      navigate('/onboarding');
    } catch (error: any) {
      console.error('Registration error:', error);
      if (error.code === 'auth/email-already-in-use') {
        toast.error('Este correo ya está registrado.');
      } else if (error.code === 'auth/invalid-email') {
        toast.error('El correo no es válido.');
      } else if (error.code === 'auth/weak-password') {
        toast.error('La contraseña es muy débil. Usa al menos 6 caracteres.');
      } else {
        toast.error('Error al registrarse.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-10">
      <Card className="rounded-[2rem] shadow-lg border-none">
        <CardHeader className="space-y-2">
          <CardTitle className="text-3xl font-bold">Iniciar sesión</CardTitle>
          <CardDescription>Ingresa con tu correo y contraseña.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="authEmail">Correo</Label>
            <Input
              id="authEmail"
              type="email"
              className="rounded-xl h-12"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="authPassword">Contraseña</Label>
            <Input
              id="authPassword"
              type="password"
              className="rounded-xl h-12"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <Button
            className="w-full h-12 rounded-full"
            disabled={loading}
            onClick={handleAuth}
          >
            {loading ? 'Procesando...' : 'Iniciar sesión'}
          </Button>

          <Button
            variant="outline"
            className="w-full h-12 rounded-full"
            disabled={loading}
            onClick={handleRegister}
          >
            Registrarse
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
