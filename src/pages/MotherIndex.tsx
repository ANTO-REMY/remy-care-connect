import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { EnhancedMotherDashboard } from "@/components/mother/EnhancedMotherDashboard";
import OnboardingModal from "@/components/mother/OnboardingModal";
import { getMyPhoto } from "@/services/photoService";
import { motherService } from "@/services/motherService";

export default function MotherIndex() {
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
        // Check if a profile photo exists
        const photo = await getMyPhoto().catch(() => null);

        // Check if at least one next-of-kin exists
        let hasKin = false;
        const storedId = sessionStorage.getItem("mother_profile_id");
        const motherId = storedId ? Number(storedId) : NaN;
        if (motherId) {
          const kinList = await motherService.getNextOfKin(motherId).catch(() => []);
          hasKin = Array.isArray(kinList) && kinList.length > 0;
        }

        if (photo && hasKin) {
          // User already has both photo and next of kin — skip onboarding
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

    return () => {
      isMounted = false;
    };
  }, [isFirstLogin, markOnboardingComplete]);

  return (
    <>
      <OnboardingModal
        open={showOnboarding}
        onComplete={() => {
          setShowOnboarding(false);
        }}
      />
      <EnhancedMotherDashboard />
    </>
  );
}