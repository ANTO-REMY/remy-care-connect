import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { EnhancedCHWDashboard } from "@/components/chw/EnhancedCHWDashboard";
import PhotoOnboardingModal from "@/components/PhotoOnboardingModal";

export default function CHWIndex() {
  const { isFirstLogin } = useAuth();
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    if (isFirstLogin) setShowOnboarding(true);
  }, [isFirstLogin]);

  return (
    <>
      <PhotoOnboardingModal
        open={showOnboarding}
        roleName="CHW"
        onComplete={() => setShowOnboarding(false)}
      />
      <EnhancedCHWDashboard />
    </>
  );
}