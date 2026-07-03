import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { EnhancedNurseDashboard } from "@/components/nurse/EnhancedNurseDashboard";
import PhotoOnboardingModal from "@/components/PhotoOnboardingModal";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertCircle, ShieldAlert, Stethoscope } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";

export default function NurseIndex() {
  const { isFirstLogin } = useAuth();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showMigrationBanner, setShowMigrationBanner] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (isFirstLogin) setShowOnboarding(true);
  }, [isFirstLogin]);

  return (
    <div className="app-shell">
      <PhotoOnboardingModal
        open={showOnboarding}
        roleName="Nurse"
        onComplete={() => setShowOnboarding(false)}
      />

      <div className="app-shell-inner space-y-4 sm:space-y-5">
        <section className="dashboard-hero">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="bg-white/15 text-white border-white/25 hover:bg-white/20">
              <Stethoscope className="mr-1 h-3.5 w-3.5" /> Clinical Oversight
            </Badge>
            <Badge className="bg-white/15 text-white border-white/25 hover:bg-white/20">
              <ShieldAlert className="mr-1 h-3.5 w-3.5" /> Transition Mode
            </Badge>
          </div>
          <h1 className="mt-3 text-xl sm:text-2xl font-semibold">Nurse Dashboard</h1>
          <p className="mt-1 text-sm sm:text-base text-primary-foreground/85">
            Legacy nurse workspace remains active while facility migration continues.
          </p>
        </section>

        {showMigrationBanner && (
          <Alert variant="default" className="mb-1 border-amber-500 bg-amber-50">
            <AlertCircle className="h-4 w-4 text-amber-600" />
            <AlertTitle className="text-amber-900">Important: Nurse Role Migration</AlertTitle>
            <AlertDescription className="text-amber-800">
              The standalone nurse role is being phased out. Please join a healthcare facility to continue providing care.
              <div className="mt-3 flex flex-wrap gap-2">
                <Button
                  size="sm"
                  onClick={() => navigate('/login/facility')}
                  className="bg-amber-600 hover:bg-amber-700"
                >
                  Join Facility
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowMigrationBanner(false)}
                >
                  Dismiss
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}

        <EnhancedNurseDashboard />
      </div>
    </div>
  );
}