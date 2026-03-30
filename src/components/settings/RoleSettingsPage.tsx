import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  CalendarClock,
  Camera,
  ImageOff,
  Loader2,
  RefreshCw,
  RotateCcw,
  Settings2,
  ShieldCheck,
  Stethoscope,
  UserCog,
} from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { appointmentService, type Appointment } from "@/services/appointmentService";
import { chwService } from "@/services/chwService";
import { escalationService, type Escalation } from "@/services/escalationService";
import { motherService } from "@/services/motherService";
import { deletePhoto, getMyPhoto, getPhotoFileUrl, uploadPhoto } from "@/services/photoService";
import { nurseService } from "@/services/nurseService";

type UserRole = "mother" | "chw" | "nurse";

interface RoleSettingsPageProps {
  role: UserRole;
}

interface SettingsProfile {
  id: number;
  userId: number;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  location?: string | null;
  licenseNumber?: string | null;
}

const ROLE_COPY: Record<UserRole, {
  label: string;
  subtitle: string;
  deletedAppointmentsEmpty: string;
  deletedEscalationsEmpty?: string;
  photoHint: string;
}> = {
  mother: {
    label: "Mother",
    subtitle: "Manage your account tools, profile photo, and recently deleted appointments.",
    deletedAppointmentsEmpty: "You have no recently deleted appointments right now.",
    photoHint: "A clear photo helps your care team recognize you quickly.",
  },
  chw: {
    label: "Community Health Worker",
    subtitle: "Manage your account tools, profile photo, and recently deleted work items.",
    deletedAppointmentsEmpty: "No recently deleted appointments were found for your dashboard.",
    deletedEscalationsEmpty: "No recently deleted escalations were found for your dashboard.",
    photoHint: "A profile photo makes it easier for mothers and nurses to recognize you.",
  },
  nurse: {
    label: "Nurse",
    subtitle: "Manage your account tools, profile photo, and recently deleted work items.",
    deletedAppointmentsEmpty: "No recently deleted appointments were found for your dashboard.",
    deletedEscalationsEmpty: "No recently deleted escalations were found for your dashboard.",
    photoHint: "A profile photo helps CHWs and mothers identify you with confidence.",
  },
};

function formatDateTime(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "Unknown date";
  }

  return parsed.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function formatAppointmentType(value?: string | null) {
  if (!value) return "Appointment";
  return value.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatStatus(value?: string | null) {
  if (!value) return "Unknown";
  return value.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function getInitials(firstName?: string, lastName?: string) {
  return `${firstName?.charAt(0) || ""}${lastName?.charAt(0) || ""}`.toUpperCase() || "RA";
}

export function RoleSettingsPage({ role }: RoleSettingsPageProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Extract stable values to prevent unnecessary re-renders
  const userId = user?.id;

  const [profile, setProfile] = useState<SettingsProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [appointmentsLoading, setAppointmentsLoading] = useState(true);
  const [appointmentsError, setAppointmentsError] = useState<string | null>(null);
  const [escalations, setEscalations] = useState<Escalation[]>([]);
  const [escalationsLoading, setEscalationsLoading] = useState(role !== "mother");
  const [escalationsError, setEscalationsError] = useState<string | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [photoLoading, setPhotoLoading] = useState(true);
  const [photoDialogOpen, setPhotoDialogOpen] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null);
  const [photoSubmitting, setPhotoSubmitting] = useState(false);
  const [photoRemoving, setPhotoRemoving] = useState(false);

  const copy = ROLE_COPY[role];
  const previewUrl = useMemo(() => {
    if (!selectedPhoto) return null;
    return URL.createObjectURL(selectedPhoto);
  }, [selectedPhoto]);

  useEffect(() => {
    if (!previewUrl) return undefined;
    return () => URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  const loadPhoto = useCallback(async () => {
    setPhotoLoading(true);
    try {
      const photo = await getMyPhoto();
      setPhotoUrl(photo ? getPhotoFileUrl(photo.file_url) : null);
    } catch (error: unknown) {
      toast({
        title: "Could not load profile photo",
        description: (error as Error).message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setPhotoLoading(false);
    }
  }, []);

  const loadProfile = useCallback(async () => {
    if (!userId) {
      setProfileLoading(false);
      return null;
    }

    setProfileLoading(true);
    setProfileError(null);

    try {
      let resolvedProfile: SettingsProfile;

      if (role === "mother") {
        const mother = await motherService.getMyProfile();
        resolvedProfile = {
          id: mother.id,
          userId: mother.user_id,
          firstName: mother.first_name,
          lastName: mother.last_name,
          phoneNumber: mother.phone_number,
          location: mother.location,
        };
      } else if (role === "chw") {
        const chw = await chwService.getCurrentProfile();
        resolvedProfile = {
          id: chw.id,
          userId: chw.user_id,
          firstName: chw.first_name,
          lastName: chw.last_name,
          phoneNumber: chw.phone_number,
          location: chw.location,
          licenseNumber: chw.license_number,
        };
      } else {
        const nurse = await nurseService.getCurrentProfile();
        resolvedProfile = {
          id: nurse.id,
          userId: nurse.user_id,
          firstName: nurse.first_name,
          lastName: nurse.last_name,
          phoneNumber: nurse.phone_number,
          location: nurse.location,
          licenseNumber: nurse.license_number,
        };
      }

      setProfile(resolvedProfile);
      return resolvedProfile;
    } catch (error: unknown) {
      const message = (error as Error).message || "Please refresh and try again.";
      setProfileError(message);
      toast({
        title: "Could not load settings profile",
        description: message,
        variant: "destructive",
      });
      return null;
    } finally {
      setProfileLoading(false);
    }
  }, [role, userId]);

  const loadDeletedAppointments = useCallback(async () => {
    if (!userId) {
      setAppointmentsLoading(false);
      return;
    }

    setAppointmentsLoading(true);
    setAppointmentsError(null);
    try {
      const response = await appointmentService.list(
        role === "mother"
          ? { mother_id: userId, include_deleted: true, deleted_only: true }
          : { health_worker_id: userId, include_deleted: true, deleted_only: true }
      );
      setAppointments(response.appointments);
    } catch (error: unknown) {
      const message = (error as Error).message || "Please try again.";
      setAppointmentsError(message);
      toast({
        title: "Could not load deleted appointments",
        description: message,
        variant: "destructive",
      });
    } finally {
      setAppointmentsLoading(false);
    }
  }, [role, user]);

  const loadDeletedEscalations = useCallback(async (resolvedProfile?: SettingsProfile | null) => {
    if (role === "mother") {
      setEscalations([]);
      setEscalationsError(null);
      setEscalationsLoading(false);
      return;
    }

    const activeProfile = resolvedProfile ?? profile;
    if (!activeProfile) {
      setEscalationsLoading(false);
      return;
    }

    setEscalationsLoading(true);
    setEscalationsError(null);
    try {
      const response = await escalationService.list(
        role === "chw"
          ? { chw_id: activeProfile.id, deleted_only: true }
          : { nurse_id: activeProfile.id, deleted_only: true }
      );
      setEscalations(response.escalations);
    } catch (error: unknown) {
      const message = (error as Error).message || "Please try again.";
      setEscalationsError(message);
      toast({
        title: "Could not load deleted escalations",
        description: message,
        variant: "destructive",
      });
    } finally {
      setEscalationsLoading(false);
    }
  }, [role]);

  const loadAllSettingsData = useCallback(async () => {
    const resolvedProfile = await loadProfile();
    await loadDeletedAppointments();
    await loadDeletedEscalations(resolvedProfile);
  }, [loadDeletedAppointments, loadDeletedEscalations, loadProfile]);

  useEffect(() => {
    void loadPhoto();
    void loadAllSettingsData();
  }, [loadAllSettingsData, loadPhoto]);

  const handlePhotoChange = async () => {
    if (!selectedPhoto) return;

    setPhotoSubmitting(true);
    try {
      const uploaded = await uploadPhoto(selectedPhoto);
      setPhotoUrl(getPhotoFileUrl(uploaded.file_url));
      setSelectedPhoto(null);
      setPhotoDialogOpen(false);
      toast({
        title: "Profile photo updated",
        description: "Your new profile photo is now active.",
      });
    } catch (error: unknown) {
      toast({
        title: "Photo update failed",
        description: (error as Error).message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setPhotoSubmitting(false);
    }
  };

  const handleRemovePhoto = async () => {
    setPhotoRemoving(true);
    try {
      await deletePhoto();
      setPhotoUrl(null);
      setSelectedPhoto(null);
      setPhotoDialogOpen(false);
      toast({
        title: "Profile photo removed",
        description: "You can upload a new one whenever you are ready.",
      });
    } catch (error: unknown) {
      toast({
        title: "Could not remove profile photo",
        description: (error as Error).message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setPhotoRemoving(false);
    }
  };

  const handleRestoreAppointment = async (appointmentId: number) => {
    try {
      await appointmentService.restoreDeleted(appointmentId);
      setAppointments((current) => current.filter((appointment) => appointment.id !== appointmentId));
      toast({
        title: "Appointment restored",
        description: "The appointment is visible on your dashboard again.",
      });
    } catch (error: unknown) {
      toast({
        title: "Could not restore appointment",
        description: (error as Error).message || "Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleRestoreEscalation = async (escalationId: number) => {
    try {
      await escalationService.restoreDeleted(escalationId);
      setEscalations((current) => current.filter((escalation) => escalation.id !== escalationId));
      toast({
        title: "Escalation restored",
        description: "The escalation is visible on your dashboard again.",
      });
    } catch (error: unknown) {
      toast({
        title: "Could not restore escalation",
        description: (error as Error).message || "Please try again.",
        variant: "destructive",
      });
    }
  };

  const profilePath = `/dashboard/${role}/profile`;
  const dashboardPath = `/dashboard/${role}`;
  const userName = profile ? `${profile.firstName} ${profile.lastName}`.trim() : `${user?.first_name || ""} ${user?.last_name || ""}`.trim();

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(14,165,233,0.12),_transparent_35%),linear-gradient(180deg,_#f8fafc_0%,_#eef6ff_100%)]">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Button variant="outline" size="icon" onClick={() => navigate(dashboardPath)} aria-label="Back to dashboard">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <p className="text-sm font-medium text-sky-700">Account</p>
              <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Settings</h1>
            </div>
          </div>
          <Button variant="outline" onClick={() => navigate(profilePath)}>
            <UserCog className="mr-2 h-4 w-4" />
            My Profile
          </Button>
        </div>

        <Card className="overflow-hidden border-slate-200 bg-white/90 shadow-lg shadow-sky-100/60">
          <CardContent className="grid gap-6 p-6 md:grid-cols-[auto,1fr,auto] md:items-center">
            <div className="relative">
              <Avatar className="h-20 w-20 ring-4 ring-white shadow-md">
                <AvatarImage src={photoUrl || previewUrl || undefined} alt={userName} />
                <AvatarFallback className="bg-gradient-to-br from-sky-600 to-cyan-500 text-xl text-white">
                  {getInitials(profile?.firstName || user?.first_name, profile?.lastName || user?.last_name)}
                </AvatarFallback>
              </Avatar>
            </div>

            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-2xl font-semibold text-slate-900">{userName || "Your account"}</h2>
                <Badge variant="secondary" className="bg-sky-50 text-sky-700 hover:bg-sky-50">
                  {copy.label}
                </Badge>
              </div>
              <p className="max-w-2xl text-sm text-slate-600">{copy.subtitle}</p>
              <div className="flex flex-wrap gap-2 text-sm text-slate-500">
                <span>{profile?.phoneNumber || user?.phone_number || "No phone number"}</span>
                {profile?.location ? <span>{profile.location}</span> : null}
                {profile?.licenseNumber ? <span>License: {profile.licenseNumber}</span> : null}
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button onClick={() => setPhotoDialogOpen(true)}>
                <Camera className="mr-2 h-4 w-4" />
                Change Photo
              </Button>
              <Button variant="outline" onClick={() => void loadAllSettingsData()}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-[1.1fr,1.9fr]">
          <Card className="border-slate-200 bg-white/90">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Settings2 className="h-5 w-5 text-sky-600" />
                Profile Photo
              </CardTitle>
              <CardDescription>{copy.photoHint}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
            {profileError ? (
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
                {profileError}
              </div>
            ) : null}
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-5">
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={photoUrl || undefined} alt={userName} />
                    <AvatarFallback className="bg-slate-200 text-slate-700">
                      {getInitials(profile?.firstName || user?.first_name, profile?.lastName || user?.last_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="space-y-1">
                    <p className="font-medium text-slate-900">
                      {photoLoading ? "Loading current photo..." : photoUrl ? "Current photo is active" : "No active photo yet"}
                    </p>
                    <p className="text-sm text-slate-500">
                      Upload a clear image to keep your account recognizable across the dashboard.
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button onClick={() => setPhotoDialogOpen(true)}>
                  <Camera className="mr-2 h-4 w-4" />
                  {photoUrl ? "Update Photo" : "Add Photo"}
                </Button>
                <Button variant="outline" onClick={() => void loadPhoto()}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Reload
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 bg-white/90">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <ShieldCheck className="h-5 w-5 text-emerald-600" />
                Recovery Window
              </CardTitle>
              <CardDescription>
                Deleted items can be restored for up to 15 days before they disappear from your recovery list.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Recently deleted appointments</p>
                <p className="mt-2 text-3xl font-semibold text-slate-900">{appointments.length}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Recently deleted escalations</p>
                <p className="mt-2 text-3xl font-semibold text-slate-900">{role === "mother" ? 0 : escalations.length}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Role</p>
                <p className="mt-2 text-xl font-semibold text-slate-900">{copy.label}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="border-slate-200 bg-white/90">
          <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-xl">
                <CalendarClock className="h-5 w-5 text-sky-600" />
                Recently Deleted Appointments
              </CardTitle>
              <CardDescription>Restore appointments back to your dashboard in one click.</CardDescription>
            </div>
            <Button variant="outline" onClick={() => void loadDeletedAppointments()}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh List
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {appointmentsError ? (
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
                {appointmentsError}
              </div>
            ) : null}
            {appointmentsLoading ? (
              <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading deleted appointments...
              </div>
            ) : appointments.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-5 text-sm text-slate-600">
                {copy.deletedAppointmentsEmpty}
              </div>
            ) : (
              appointments.map((appointment) => (
                <div key={appointment.id} className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="space-y-1">
                    <p className="font-semibold text-slate-900">{formatAppointmentType(appointment.appointment_type)}</p>
                    <p className="text-sm text-slate-600">
                      Scheduled for {formatDateTime(appointment.scheduled_time)}
                    </p>
                    <div className="flex flex-wrap gap-2 text-xs text-slate-500">
                      <Badge variant="outline">{formatStatus(appointment.status)}</Badge>
                      {appointment.mother_name ? <span>Mother: {appointment.mother_name}</span> : null}
                      {appointment.hw_name ? <span>Health worker: {appointment.hw_name}</span> : null}
                    </div>
                  </div>
                  <Button onClick={() => void handleRestoreAppointment(appointment.id)}>
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Restore
                  </Button>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {role !== "mother" ? (
          <Card className="border-slate-200 bg-white/90">
            <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Stethoscope className="h-5 w-5 text-amber-600" />
                  Recently Deleted Escalations
                </CardTitle>
                <CardDescription>Restore escalations back to your dashboard without losing context.</CardDescription>
              </div>
              <Button variant="outline" onClick={() => void loadDeletedEscalations()}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh List
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {escalationsError ? (
                <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
                  {escalationsError}
                </div>
              ) : null}
              {escalationsLoading ? (
                <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading deleted escalations...
                </div>
              ) : escalations.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-5 text-sm text-slate-600">
                  {copy.deletedEscalationsEmpty}
                </div>
              ) : (
                escalations.map((escalation) => (
                  <div key={escalation.id} className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="space-y-1">
                      <p className="font-semibold text-slate-900">{escalation.case_description}</p>
                      <p className="text-sm text-slate-600">
                        Raised on {formatDateTime(escalation.created_at)}
                      </p>
                      <div className="flex flex-wrap gap-2 text-xs text-slate-500">
                        <Badge variant="outline">{formatStatus(escalation.priority)}</Badge>
                        <Badge variant="outline">{formatStatus(escalation.status)}</Badge>
                        {escalation.mother_name ? <span>Mother: {escalation.mother_name}</span> : null}
                        {role === "nurse" ? <span>CHW: {escalation.chw_name}</span> : null}
                      </div>
                    </div>
                    <Button onClick={() => void handleRestoreEscalation(escalation.id)}>
                      <RotateCcw className="mr-2 h-4 w-4" />
                      Restore
                    </Button>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        ) : null}
      </div>

      <Dialog open={photoDialogOpen} onOpenChange={setPhotoDialogOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Update Profile Photo</DialogTitle>
            <DialogDescription>
              Choose a clear image. Your latest upload replaces the current active photo.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-6 sm:grid-cols-[auto,1fr]">
            <div className="mx-auto">
              <Avatar className="h-28 w-28 shadow-md">
                <AvatarImage src={previewUrl || photoUrl || undefined} alt={userName} />
                <AvatarFallback className="bg-slate-200 text-lg text-slate-700">
                  {getInitials(profile?.firstName || user?.first_name, profile?.lastName || user?.last_name)}
                </AvatarFallback>
              </Avatar>
            </div>

            <div className="space-y-4">
              <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4">
                <label className="mb-2 block text-sm font-medium text-slate-700" htmlFor="profile-photo-upload">
                  Choose image
                </label>
                <Input
                  id="profile-photo-upload"
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/webp"
                  onChange={(event) => setSelectedPhoto(event.target.files?.[0] || null)}
                />
                <p className="mt-2 text-xs text-slate-500">
                  Accepted formats: JPG, PNG, and WEBP. Use a photo that clearly shows your face.
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                {selectedPhoto ? (
                  <span>Ready to upload: {selectedPhoto.name}</span>
                ) : photoUrl ? (
                  <span>Your current photo will stay active until you upload a replacement.</span>
                ) : (
                  <span>No active photo yet. Upload one to personalize your account.</span>
                )}
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            {photoUrl ? (
              <Button variant="outline" onClick={() => void handleRemovePhoto()} disabled={photoSubmitting || photoRemoving}>
                {photoRemoving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ImageOff className="mr-2 h-4 w-4" />}
                Remove Photo
              </Button>
            ) : null}
            <Button variant="outline" onClick={() => setPhotoDialogOpen(false)} disabled={photoSubmitting || photoRemoving}>
              Cancel
            </Button>
            <Button onClick={() => void handlePhotoChange()} disabled={!selectedPhoto || photoSubmitting || photoRemoving}>
              {photoSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Camera className="mr-2 h-4 w-4" />}
              Save Photo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
