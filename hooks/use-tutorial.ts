import { adminTutorials } from '@/config/tutorials';
import { driver, DriveStep } from 'driver.js';
import 'driver.js/dist/driver.css';
import { useTheme } from 'next-themes';
import { useCallback, useEffect, useState } from 'react';

export function useTutorial(pathname: string) {
  const { theme, systemTheme } = useTheme();
  const [hasTutorial, setHasTutorial] = useState(false);
  const [steps, setSteps] = useState<DriveStep[]>([]);

  useEffect(() => {
    // Check if the current path has a defined tutorial
    const tutorialSteps = adminTutorials[pathname];
    if (tutorialSteps && tutorialSteps.length > 0) {
      setHasTutorial(true);
      setSteps(tutorialSteps);
    } else {
      setHasTutorial(false);
      setSteps([]);
    }
  }, [pathname]);

  const startTutorial = useCallback(() => {
    if (!hasTutorial || steps.length === 0) return;

    const currentTheme = theme === 'system' ? systemTheme : theme;
    const isDark = currentTheme === 'dark';

    const driverObj = driver({
      showProgress: true,
      animate: true,
      smoothScroll: true,
      allowClose: true,
      progressText: 'Paso {{current}} de {{total}}',
      doneBtnText: 'Finalizar',
      nextBtnText: 'Siguiente &rarr;',
      prevBtnText: '&larr; Anterior',
      popoverClass: `sira-theme-driver ${isDark ? 'sira-driver-dark' : 'sira-driver-light'}`,
      steps: steps,
    });

    driverObj.drive();
  }, [hasTutorial, steps, theme, systemTheme]);

  return {
    hasTutorial,
    startTutorial,
  };
}
