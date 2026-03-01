/**
 * ModernMotherIndex.tsx
 *
 * Entry page for the GK-inspired mothers' dashboard.
 * Route: /dashboard/mother/modern
 *
 * Handles the same onboarding gate (photo + next-of-kin) as MotherIndex,
 * but renders the new ModernMotherDashboard instead of EnhancedMotherDashboard.
 * The original /dashboard/mother route is NOT touched.
 */

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { ModernMotherDashboard } from "@/components/mother/ModernMotherDashboard";
import OnboardingModal from "@/components/mother/OnboardingModal";
import { getMyPhoto } from "@/services/photoService";
import { motherService } from "@/services/motherService";

export default function ModernMotherIndex() {
  const { isFirstLogin, markOnboardingComplete } = useAuth();
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const checkOnboarding = async () => {
      if (!isFirstLogin) {
        if (isMounted) setShowOnboarding(false);
        return;
      }

      try {
        const photo = await getMyPhoto().catch(() => null);

        let hasKin = false;
        const storedId = sessionStorage.getItem("mother_profile_id");
        const motherId = storedId ? Number(storedId) : NaN;
        if (motherId) {
          const kinList = await motherService.getNextOfKin(motherId).catch(() => []);
          hasKin = Array.isArray(kinList) && kinList.length > 0;
        }

        if (photo && hasKin) {
          markOnboardingComplete();
          if (isMounted) setShowOnboarding(false);
        } else if (isMounted) {
          setShowOnboarding(true);
        }
      } catch {
        if (isMounted) setShowOnboarding(true);
      }
    };

    checkOnboarding();
    return () => { isMounted = false; };
  }, [isFirstLogin, markOnboardingComplete]);

  return (
    <>
      <OnboardingModal
        open={showOnboarding}
        onComplete={() => setShowOnboarding(false)}
      />
      <ModernMotherDashboard />
    </>
  );
}
