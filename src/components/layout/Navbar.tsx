import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../lib/useAuth';
import { logout } from '../../lib/firebase';
import { Button } from '../ui/button';
import { 
  Music, 
  User, 
  LogOut, 
  LayoutDashboard, 
  Menu,
  X,
  FileText
} from 'lucide-react';
import { useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";

export default function Navbar() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogin = () => navigate('/auth');

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <nav className="border-b bg-white/80 backdrop-blur-md sticky top-0 z-50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="bg-primary p-1.5 rounded-lg">
            <Music className="w-6 h-6 text-white" />
          </div>
          <span className="font-bold text-xl tracking-tight text-primary">EnClave</span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-6">
          {user ? (
            <div className="flex items-center gap-4">
              <Link to="/dashboard" className="text-sm font-medium hover:text-primary transition-colors flex items-center gap-1.5">
                <LayoutDashboard className="w-4 h-4" />
                Panel
              </Link>
              
              <DropdownMenu>
                <DropdownMenuTrigger render={<Button variant="ghost" className="relative h-10 w-10 rounded-full" />}>
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={user.photoURL || ''} alt={user.displayName || ''} />
                    <AvatarFallback>{user.displayName?.charAt(0) || 'U'}</AvatarFallback>
                  </Avatar>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem onClick={() => navigate('/profile')}>
                    <User className="mr-2 h-4 w-4" />
                    <span>Mi Perfil</span>
                  </DropdownMenuItem>
                  {profile?.role === 'musician' && (
                    <DropdownMenuItem onClick={() => navigate('/applications')}>
                      <FileText className="mr-2 h-4 w-4" />
                      <span>Mis Postulaciones</span>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Cerrar Sesión</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ) : (
            <Button onClick={handleLogin} className="rounded-full px-6">
              Iniciar sesion
            </Button>
          )}
        </div>

        {/* Mobile menu button */}
        <div className="md:hidden">
          <Button variant="ghost" size="icon" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>
        </div>
      </div>

      {/* Mobile Nav */}
      {isMenuOpen && (
        <div className="md:hidden border-t bg-white p-4 space-y-4 animate-in slide-in-from-top duration-200">
          {user ? (
            <>
              <Link 
                to="/dashboard" 
                className="block text-lg font-medium py-2"
                onClick={() => setIsMenuOpen(false)}
              >
                Panel de Control
              </Link>
              <Link 
                to="/profile" 
                className="block text-lg font-medium py-2"
                onClick={() => setIsMenuOpen(false)}
              >
                Mi Perfil
              </Link>
              {profile?.role === 'musician' && (
                <Link 
                  to="/applications" 
                  className="block text-lg font-medium py-2"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Mis Postulaciones
                </Link>
              )}
              <Button 
                variant="destructive" 
                className="w-full justify-start" 
                onClick={() => {
                  handleLogout();
                  setIsMenuOpen(false);
                }}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Cerrar Sesión
              </Button>
            </>
          ) : (
            <Button onClick={handleLogin} className="w-full">
              Iniciar sesion
            </Button>
          )}
        </div>
      )}
    </nav>
  );
}
