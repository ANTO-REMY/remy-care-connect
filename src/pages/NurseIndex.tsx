import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { EnhancedNurseDashboard } from "@/components/nurse/EnhancedNurseDashboard";
import PhotoOnboardingModal from "@/components/PhotoOnboardingModal";

export default function NurseIndex() {
  const { isFirstLogin } = useAuth();
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    if (isFirstLogin) setShowOnboarding(true);
  }, [isFirstLogin]);

  return (
    <>
      <PhotoOnboardingModal
        open={showOnboarding}
        roleName="Nurse"
        onComplete={() => setShowOnboarding(false)}
      />
      <EnhancedNurseDashboard />
    </>
  );
}