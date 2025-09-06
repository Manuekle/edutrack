'use client';

import { useRef, useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Home, Info, Menu, Moon, Sun, User, X, Zap } from 'lucide-react';
import { useTheme } from 'next-themes';
import Link from 'next/link';

interface NavigationItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  sectionId: string;
}

export default function Navbar() {
  const navigation: NavigationItem[] = useMemo(
    () => [
      { name: 'Inicio', href: '/', icon: Home, sectionId: 'home' },
      { name: 'Características', href: '#features', icon: Zap, sectionId: 'features' },
      { name: 'Cómo funciona', href: '#how-it-works', icon: Info, sectionId: 'how-it-works' },
      { name: 'Sobre el proyecto', href: '#about', icon: Info, sectionId: 'about' },
    ],
    []
  );

  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState<string>('');
  const scrollTimeout = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Set initial active section based on path
    const path = window.location.pathname;
    setActiveSection(path === '/' ? 'home' : '');

    // Throttled scroll handler
    const handleScroll = () => {
      // Update scroll position immediately
      const isScrolled = window.scrollY > 10;
      if (isScrolled !== scrolled) {
        setScrolled(isScrolled);
      }

      // Throttle the section detection
      if (scrollTimeout.current) {
        clearTimeout(scrollTimeout.current);
      }

      scrollTimeout.current = setTimeout(() => {
        const sections = navigation.map((item: NavigationItem) => item.sectionId);
        let currentSection = '';
        const scrollPosition = window.scrollY + 100; // 100px offset for better UX

        for (const section of sections) {
          const element = document.getElementById(section);
          if (element) {
            const { top, bottom } = element.getBoundingClientRect();
            const elementTop = top + window.scrollY;
            const elementBottom = bottom + window.scrollY;

            if (scrollPosition >= elementTop && scrollPosition <= elementBottom) {
              currentSection = section;
              break;
            }
          }
        }

        if (currentSection !== activeSection) {
          setActiveSection(currentSection);
        }
      }, 100); // 100ms throttle
    };

    // Add event listener
    window.addEventListener('scroll', handleScroll, { passive: true });

    // Initial check
    handleScroll();

    // Cleanup
    return () => {
      if (scrollTimeout.current) {
        clearTimeout(scrollTimeout.current);
      }
      window.removeEventListener('scroll', handleScroll);
    };
  }, [navigation, scrolled, activeSection]);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  if (!mounted) return null;

  return (
    <header
      className={`sticky top-0 z-50 w-full transition-all duration-300 ${
        scrolled
          ? 'bg-background/90 backdrop-blur-md border-b border-border/40 shadow-sm'
          : 'bg-background/80 backdrop-blur-sm border-b border-transparent'
      }`}
    >
      <div className="container px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <span className="text-xl font-semibold bg-gradient-to-r from-primary to-amber-500 bg-clip-text text-transparent">
                edu<span className="text-amber-500">Track</span>
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            {navigation.map(item => (
              <Button
                key={item.name}
                asChild
                variant="ghost"
                className={`px-4 py-2 text-xs font-normal transition-colors ${
                  item.sectionId === activeSection || (!activeSection && item.sectionId === 'home')
                    ? 'text-foreground bg-muted/50'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/30'
                }`}
              >
                <Link href={item.href}>
                  <item.icon className="mr-2 h-4 w-4" />
                  {item.name}
                </Link>
              </Button>
            ))}
          </nav>

          <div className="flex items-center space-x-2">
            {/* Theme Toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
              className="rounded-full"
              aria-label="Toggle theme"
            >
              {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
            </Button>

            {/* Authentication */}
            <Button variant="ghost" asChild className="rounded-lg">
              <Link href="/login">
                <User className="mr-2 h-4 w-4" />
                Iniciar Sesión
              </Link>
            </Button>

            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-border/40 bg-background/95 backdrop-blur-lg">
          <div className="container px-4 py-4 space-y-2">
            {navigation.map(item => (
              <Button
                key={item.name}
                asChild
                variant="ghost"
                className="w-full justify-start px-4 py-3 text-xs"
                onClick={() => setMobileMenuOpen(false)}
              >
                <Link href={item.href}>
                  <item.icon className="mr-3 h-5 w-5" />
                  {item.name}
                </Link>
              </Button>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}
