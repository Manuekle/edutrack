import { Mail } from 'lucide-react';
import Link from 'next/link';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t bg-muted/20 backdrop-blur-sm w-full">
      <div className="container px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto py-8">
        <div className="flex flex-col md:flex-row justify-between items-center">
          {/* Branding */}
          <div className="text-center md:text-left mb-4 md:mb-0">
            <Link href="/" className="flex items-center justify-center md:justify-start space-x-2">
              <span className="text-xl font-semibold bg-gradient-to-r from-primary to-amber-500 bg-clip-text text-transparent">
                edu<span className="text-amber-500">Track</span>
              </span>
            </Link>
            <p className="text-muted-foreground text-xs mt-2">
              Transformando la gestión de asistencia educativa
            </p>
          </div>

          {/* Contact Info */}
          <div className="flex items-center">
            <a
              href="mailto:contacto@edutrack.com"
              className="flex items-center text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <Mail className="h-4 w-4 mr-2" />
              contacto@edutrack.com
            </a>
          </div>
        </div>

        <div className="border-t border-border pt-6 mt-6 text-center">
          <p className="text-xs text-muted-foreground">
            &copy; {currentYear} EduTrack. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}
