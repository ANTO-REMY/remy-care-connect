import { useAuth } from "@/contexts/AuthContext";
import { EnhancedMotherDashboard } from "@/components/mother/EnhancedMotherDashboard";
import OnboardingModal from "@/components/mother/OnboardingModal";

export default function MotherIndex() {
  const { isFirstLogin } = useAuth();

  return (
    <>
      {/* Mandatory onboarding modal — the modal calls markOnboardingComplete internally */}
      <OnboardingModal
        open={isFirstLogin}
        onComplete={() => {/* handled inside OnboardingModal via markOnboardingComplete() */ }}
      />
      <EnhancedMotherDashboard />
    </>
  );
}