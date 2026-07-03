import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Baby, MessageCircle, Phone, AlertCircle, CheckCircle,
  Camera, Heart, Apple, Bell, Calendar, Clock,
  ChevronRight, Sparkles, Utensils, Droplets, Moon, Sun,
  Activity, TrendingUp, FileText, Video, ExternalLink,
  MapPin, LocateFixed,
  Play, Pause, Volume2, VolumeX, Loader2, Plus, ArrowLeft, Trash2, BookOpen, Pencil
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { uploadPhoto, getPhotoFileUrl, getMyPhoto } from "@/services/photoService";
import { appointmentService, type Appointment } from "@/services/appointmentService";
import { reminderService, type Reminder } from "@/services/reminderService";
import { motherService } from "@/services/motherService";
import { checkinService } from "@/services/checkinService";
import { assignmentService } from "@/services/assignmentService";
import { notificationService, type UserNotification } from "@/services/notificationService";
import resourceService, { Resource } from "@/services/resourceService";
import nutritionService, { DietaryRecommendation } from "@/services/nutritionService";
import { ultrasoundService, type UltrasoundRecord } from "@/services/ultrasoundService";
import { weightService, type WeightLog } from "@/services/weightService";
import healthFacilityService, {
  type HealthFacility,
  type MotherFacilityAppointment,
  type ReportIssueData,
} from "@/services/healthFacilityService";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { DateTimePicker } from "@/components/ui/datetime-picker";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useSocket, useSocketStatus } from "@/hooks/useSocket";
import { ConnectionBanner } from "@/components/ConnectionBanner";
import { PregnancyJourneyTracker, fetalDevelopmentData } from "./PregnancyJourneyTracker";
import { DashboardAccountMenu } from "@/components/layout/DashboardAccountMenu";
import { RESPONSIVE_PADDING } from "@/components/ui/spacing.constants";
import { FacilitySearchCard } from "./FacilitySearchCard";
import { FacilityDetailModal } from "./FacilityDetailModal";



// No more mock reminders



// Mock weekly progress data
const weeklyProgress = {
  week: 24,
  totalWeeks: 40,
  babySize: "Corn",
  babyWeight: "600g",
  babyLength: "30cm",
  nextMilestone: "Week 28 - Third Trimester Begins",
  daysUntilNext: 28
};

interface MotherDashboardProps {
  isFirstLogin?: boolean;
}

type ReminderVisual = {
  icon: LucideIcon;
  toneClass: string;
  bgClass: string;
  borderClass: string;
};

const REMINDER_TYPE_ICON_MAP: Record<string, string> = {
  medication: 'MED',
  hydration: 'H2O',
  exercise: 'WALK',
  health: 'CHECK',
  education: 'READ',
  custom: 'BELL',
};

const REMINDER_TYPE_OPTIONS: Array<{ value: string; label: string }> = [
  { value: 'medication', label: 'Medication' },
  { value: 'hydration', label: 'Hydration' },
  { value: 'exercise', label: 'Exercise' },
  { value: 'health', label: 'Health Check' },
  { value: 'education', label: 'Education' },
  { value: 'custom', label: 'Custom' },
];

const FACILITY_AMENITY_OPTIONS = [
  { value: 'all', label: 'All Types' },
  { value: 'hospital', label: 'Hospital' },
  { value: 'clinic', label: 'Clinic' },
  { value: 'pharmacy', label: 'Pharmacy' },
  { value: 'laboratory', label: 'Laboratory' },
  { value: 'dentist', label: 'Dentist' },
  { value: 'doctors', label: 'Doctors' },
];

function getReminderVisual(reminder: Reminder): ReminderVisual {
  const code = (reminder.icon || '').toUpperCase();
  const type = (reminder.type || '').toLowerCase();

  if (code === 'H2O' || type === 'hydration') {
    return {
      icon: Droplets,
      toneClass: 'text-sky-700',
      bgClass: 'bg-sky-100/80',
      borderClass: 'border-sky-200',
    };
  }

  if (code === 'MED' || type === 'medication') {
    return {
      icon: Heart,
      toneClass: 'text-rose-700',
      bgClass: 'bg-rose-100/80',
      borderClass: 'border-rose-200',
    };
  }

  if (code === 'WALK' || type === 'exercise') {
    return {
      icon: Activity,
      toneClass: 'text-emerald-700',
      bgClass: 'bg-emerald-100/80',
      borderClass: 'border-emerald-200',
    };
  }

  if (code === 'CHECK' || type === 'health') {
    return {
      icon: CheckCircle,
      toneClass: 'text-lime-700',
      bgClass: 'bg-lime-100/80',
      borderClass: 'border-lime-200',
    };
  }

  if (code === 'READ' || type === 'education') {
    return {
      icon: BookOpen,
      toneClass: 'text-indigo-700',
      bgClass: 'bg-indigo-100/80',
      borderClass: 'border-indigo-200',
    };
  }

  if (code === 'CAL' || type === 'appointment') {
    return {
      icon: Calendar,
      toneClass: 'text-violet-700',
      bgClass: 'bg-violet-100/80',
      borderClass: 'border-violet-200',
    };
  }

  return {
    icon: Bell,
    toneClass: 'text-amber-700',
    bgClass: 'bg-amber-100/80',
    borderClass: 'border-amber-200',
  };
}

function ReminderIconBadge({ reminder, compact = false }: { reminder: Reminder; compact?: boolean }) {
  const visual = getReminderVisual(reminder);
  const Icon = visual.icon;

  return (
    <div
      className={`inline-flex items-center rounded-xl border px-2 py-1 ${visual.bgClass} ${visual.borderClass}`}
      aria-label={`${reminder.type} reminder icon`}
    >
      <Icon className={`${compact ? 'h-3.5 w-3.5' : 'h-4 w-4'} ${visual.toneClass}`} />
    </div>
  );
}

export function EnhancedMotherDashboard({ isFirstLogin = false }: MotherDashboardProps) {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  // State management
  const [showNextOfKinModal, setShowNextOfKinModal] = useState(isFirstLogin);
  const [showPhotoUpload, setShowPhotoUpload] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [showCheckInModal, setShowCheckInModal] = useState(false);
  const [checkInResponse, setCheckInResponse] = useState<'ok' | 'not_ok' | null>(null);
  const [motherProfileId, setMotherProfileId] = useState<number | null>(null);
  const [checkInSelected, setCheckInSelected] = useState<'ok' | 'not_ok' | null>(null);
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [checkInComment, setCheckInComment] = useState('');
  const [checkInSubmitting, setCheckInSubmitting] = useState(false);
  // Appointments state
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [hiddenAppointments, setHiddenAppointments] = useState<Appointment[]>([]);
  const [appointmentsLoading, setAppointmentsLoading] = useState(false);
  const [hiddenAppointmentsLoading, setHiddenAppointmentsLoading] = useState(false);
  const [showHiddenAppointments, setShowHiddenAppointments] = useState(false);
  const [apptTab, setApptTab] = useState<'yours' | 'chw'>('yours');
  // Mother appointment scheduling
  const [showMotherScheduleModal, setShowMotherScheduleModal] = useState(false);
  const [motherScheduleForm, setMotherScheduleForm] = useState({
    scheduledTime: undefined as Date | undefined,
    appointmentType: 'prenatal_checkup',
    notes: '',
  });
  const [motherScheduleSubmitting, setMotherScheduleSubmitting] = useState(false);
  const [deleteApptConfirm, setDeleteApptConfirm] = useState<number | null>(null);
  const [deleteApptSubmitting, setDeleteApptSubmitting] = useState(false);
  const [notifications, setNotifications] = useState<UserNotification[]>([]);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
  const motherProfileIdRef = useRef<number | null>(null);
  // Assigned CHW's user_id - used when mother schedules an appointment
  const [assignedCHWUserId, setAssignedCHWUserId] = useState<number | null>(null);

  // Custom Reminders
  const [showAddReminderModal, setShowAddReminderModal] = useState(false);
  const [newReminderTitle, setNewReminderTitle] = useState("");
  const [newReminderTime, setNewReminderTime] = useState("");
  const [newReminderType, setNewReminderType] = useState("custom");
  const [addReminderSubmitting, setAddReminderSubmitting] = useState(false);

  const [editingReminder, setEditingReminder] = useState<Reminder | null>(null);
  const [editReminderSubmitting, setEditReminderSubmitting] = useState(false);

  // Facility discovery (Milestone 2)
  const [facilityQuery, setFacilityQuery] = useState("");
  const [facilityAmenity, setFacilityAmenity] = useState("all");
  const [facilityResults, setFacilityResults] = useState<HealthFacility[]>([]);
  const [facilityLoading, setFacilityLoading] = useState(false);
  const [facilityError, setFacilityError] = useState<string | null>(null);
  const [facilityMode, setFacilityMode] = useState<'search' | 'nearby'>('search');
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [selectedFacility, setSelectedFacility] = useState<HealthFacility | null>(null);
  const [facilityDetailOpen, setFacilityDetailOpen] = useState(false);
  const [reportIssueSubmitting, setReportIssueSubmitting] = useState(false);
  const [facilityBookingSubmitting, setFacilityBookingSubmitting] = useState(false);
  const [facilityAppointments, setFacilityAppointments] = useState<MotherFacilityAppointment[]>([]);

  // Resources state
  const [resources, setResources] = useState<Resource[]>([]);
  const [resourcesLoading, setResourcesLoading] = useState(true);
  const [resourcesError, setResourcesError] = useState<string | null>(null);

  // Nutrition state
  const [nutritionPlans, setNutritionPlans] = useState<DietaryRecommendation[]>([]);
  const [nutritionLoading, setNutritionLoading] = useState(true);
  const [nutritionError, setNutritionError] = useState<string | null>(null);

  // Real profile data
  const [profile, setProfile] = useState<{ due_date?: string } | null>(null);
  const [ultrasoundRecords, setUltrasoundRecords] = useState<UltrasoundRecord[]>([]);
  const [weightLogs, setWeightLogs] = useState<WeightLog[]>([]);
  const [ultrasoundRecordsLoading, setUltrasoundRecordsLoading] = useState(true);
  const [weightLogsLoading, setWeightLogsLoading] = useState(true);
  const ultrasoundLoadedRef = useRef(false);
  const weightLoadedRef = useRef(false);

  /**
   * Silently refresh appointments + motherProfileId every 15 s.
   * No loading spinners â€” only the initial mount shows the spinner.
   */
  const refreshData = useCallback(async () => {
    if (!user?.id) return;

    try {
      const fetchedProfile = await motherService.getMyProfile();
      if (fetchedProfile?.id) {
        setMotherProfileId(fetchedProfile.id);
        setProfile(fetchedProfile);
        motherProfileIdRef.current = fetchedProfile.id;
      }
    } catch { /* ignore */ }

    try {
      const chwData = await assignmentService.getAssignedCHWForMother(user.id);
      if (chwData.assigned && chwData.chw?.user_id) {
        setAssignedCHWUserId(chwData.chw.user_id);
      } else {
        setAssignedCHWUserId(null);
      }
    } catch { /* ignore */ }

    // Appointments (all statuses so completed/cancelled also visible)
    try {
      const resp = await appointmentService.getAllForMother(user.id);
      setAppointments(resp.appointments);
    } catch { /* ignore */ }

    try {
      const resp = await healthFacilityService.getMyAppointments();
      setFacilityAppointments(resp.appointments || []);
    } catch { /* ignore */ }

    // Ultrasound records (used for real measurements in journey tracker)
    try {
      if (!ultrasoundLoadedRef.current) setUltrasoundRecordsLoading(true);
      const records = await ultrasoundService.getMyRecords();
      setUltrasoundRecords(records);
    } catch { /* ignore */ }
    finally {
      if (!ultrasoundLoadedRef.current) {
        setUltrasoundRecordsLoading(false);
        ultrasoundLoadedRef.current = true;
      }
    }

    // Weight logs (used for maternal trend context)
    try {
      if (!weightLoadedRef.current) setWeightLogsLoading(true);
      const logs = await weightService.getMyWeightLogs();
      setWeightLogs(logs);
    } catch { /* ignore */ }
    finally {
      if (!weightLoadedRef.current) {
        setWeightLogsLoading(false);
        weightLoadedRef.current = true;
      }
    }

    // Reminders
    try {
      const remResp = await reminderService.list();
      setReminders(remResp.reminders);
    } catch { /* ignore */ }
  }, [user?.id]);

  const handleWeightLogged = useCallback((newLog: WeightLog) => {
    setWeightLogs(prev => [newLog, ...prev.filter(log => log.id !== newLog.id)]);
    setWeightLogsLoading(false);
    weightLoadedRef.current = true;
  }, []);

  const loadHiddenAppointments = useCallback(async () => {
    if (!user?.id) return;
    setHiddenAppointmentsLoading(true);
    try {
      const resp = await appointmentService.list({
        mother_id: user.id,
        include_deleted: true,
        deleted_only: true,
      });
      setHiddenAppointments(resp.appointments);
    } catch (err: unknown) {
      toast({
        title: 'Could not load deleted appointments',
        description: (err as Error).message || 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setHiddenAppointmentsLoading(false);
    }
  }, [user?.id, toast]);

  // WebSocket: real-time appointment updates
  const { connected } = useSocketStatus();

  const refreshNotifications = useCallback(async () => {
    if (!user) return;
    try {
      const resp = await notificationService.list(20, true);
      setNotifications(resp.notifications);
      setUnreadNotificationCount(resp.unread_count);
    } catch {
      // ignore
    }
  }, [user]);

  const markNotificationRead = async (id: number) => {
    try {
      const resp = await notificationService.markRead(id);
      setNotifications(prev => prev.filter(n => n.id !== id));
      setUnreadNotificationCount(resp.unread_count);
    } catch {
      // ignore
    }
  };

  const markAllNotificationsRead = async () => {
    try {
      await notificationService.markAllRead();
      setNotifications([]);
      setUnreadNotificationCount(0);
    } catch {
      // ignore
    }
  };

  useSocket<Appointment>('appointment:created', (appt) => {
    // Avoid duplicates: only add if not already present (by ID)
    setAppointments(prev => prev.some(a => a.id === appt.id) ? prev : [appt, ...prev]);
    refreshNotifications();
  }, { enabled: !!user?.id });
  useSocket<Appointment>('appointment:updated', (appt) => {
    setAppointments(prev => prev.map(a => a.id === appt.id ? appt : a));
    refreshNotifications();
  }, { enabled: !!user?.id });
  useSocket<{ id: number; user_id: number }>('appointment:deleted', ({ id, user_id }) => {
    if (user_id === user?.id) {
      setAppointments(prev => prev.filter(a => a.id !== id));
      refreshNotifications();
    }
  }, { enabled: !!user?.id });
  useSocket('checkin:new', () => refreshData(), { enabled: !!user?.id });
  useSocket('ultrasound:created', () => refreshData(), { enabled: !!user?.id });
  useSocket('notification:new', () => refreshNotifications(), { enabled: !!user?.id });
  useSocket('assignment:created', () => {
    refreshData();
    refreshNotifications();
  }, { enabled: !!user?.id });
  useSocket('assignment:status_changed', () => {
    refreshData();
    refreshNotifications();
  }, { enabled: !!user?.id });
  useSocket('assignment:deleted', () => {
    refreshData();
    refreshNotifications();
  }, { enabled: !!user?.id });
  
  // Reminder real-time events
  useSocket('reminder:created', () => refreshData(), { enabled: !!user?.id });
  useSocket('reminder:updated', () => refreshData(), { enabled: !!user?.id });
  useSocket('reminder:deleted', () => refreshData(), { enabled: !!user?.id });
  // Reconnect sync: replace state wholesale with the server snapshot
  useSocket<{ appointments?: Appointment[] }>('sync', (data) => {
    if (data.appointments) setAppointments(data.appointments);
  }, { enabled: !!user?.id });

  // Escalation notifications
  useSocket('escalation:created', () => {
    refreshNotifications();
    toast({
      title: '📋 Case Escalated',
      description: 'Your case has been sent to a nurse for review.',
      variant: 'default',
    });
  }, { enabled: !!user?.id });

  useSocket<{ message?: string; status?: string }>('escalation:status_changed', (data) => {
    refreshNotifications();
    const status = data.status || 'updated';
    let description = `Your case status is now: ${status}`;
    if (status === 'in_progress') {
      description = 'Your case is now being reviewed.';
    } else if (status === 'resolved') {
      description = 'Your case has been resolved.';
    } else if (status === 'rejected') {
      description = 'Your case was not proceeded with.';
    }
    toast({
      title: '📊 Case Status Update',
      description,
      variant: status === 'resolved' ? 'default' : 'default',
    });
  }, { enabled: !!user?.id });

  useEffect(() => {
    refreshNotifications();
  }, [refreshNotifications]);

  // Fetch resources for mother role
  useEffect(() => {
    const fetchResources = async () => {
      try {
        setResourcesLoading(true);
        setResourcesError(null);
        const data = await resourceService.list({ role: 'mother' });
        setResources(data);
      } catch (err) {
        setResourcesError(err instanceof Error ? err.message : 'Failed to load resources');
      } finally {
        setResourcesLoading(false);
      }
    };
    fetchResources();
  }, []);

  const deriveTrimesterTag = useCallback((): 'T1' | 'T2' | 'T3' | undefined => {
    if (!profile?.due_date) return undefined;
    const dueDate = new Date(profile.due_date);
    if (Number.isNaN(dueDate.getTime())) return undefined;
    const conceptionDate = new Date(dueDate.getTime() - 280 * 24 * 60 * 60 * 1000);
    const today = new Date();
    const daysPregnant = Math.max(0, Math.floor((today.getTime() - conceptionDate.getTime()) / (1000 * 60 * 60 * 24)));
    const week = Math.max(1, Math.min(42, Math.floor(daysPregnant / 7)));

    if (week < 14) return 'T1';
    if (week < 28) return 'T2';
    return 'T3';
  }, [profile?.due_date]);

  useEffect(() => {
    let isMounted = true;
    const fetchNutrition = async () => {
      try {
        setNutritionLoading(true);
        setNutritionError(null);
        const trimesterTag = deriveTrimesterTag();
        const data = await nutritionService.list({
          target_group: 'general_all_trimesters',
          trimester: trimesterTag,
          limit: 4,
          daily_plan: true,
        });
        if (isMounted) {
          setNutritionPlans(data);
        }
      } catch (err) {
        if (isMounted) {
          setNutritionError(err instanceof Error ? err.message : 'Failed to load meal plan');
        }
      } finally {
        if (isMounted) {
          setNutritionLoading(false);
        }
      }
    };

    fetchNutrition();
    return () => {
      isMounted = false;
    };
  }, [deriveTrimesterTag]);

  // Appointment filtering: separate by creator
  const sourceAppointments = showHiddenAppointments ? hiddenAppointments : appointments;
  const apptsByMother = sourceAppointments.filter(
    appt => appt.created_by_user_id === user?.id
  );
  const apptsByChw = sourceAppointments.filter(
    appt => appt.created_by_user_id !== user?.id
  );
  const displayedAppointments = showHiddenAppointments
    ? sourceAppointments
    : (apptTab === 'yours' ? apptsByMother : apptsByChw);

  /** Mother schedules an appointment with their assigned health worker */
  const handleMotherScheduleAppointment = async () => {
    if (!motherScheduleForm.scheduledTime) {
      toast({ title: "Missing Information", description: "Please pick a date & time.", variant: "destructive" });
      return;
    }
    setMotherScheduleSubmitting(true);
    try {
      const appt = await appointmentService.create({
        mother_id: user!.id,
        health_worker_id: assignedCHWUserId ?? user!.id, // use fetched CHW user_id; fallback is a safe no-op handled by backend
        scheduled_time: motherScheduleForm.scheduledTime.toISOString(),
        appointment_type: motherScheduleForm.appointmentType,
        notes: motherScheduleForm.notes.trim() || undefined,
      });
      setAppointments(prev => prev.some(a => a.id === appt.id) ? prev : [appt, ...prev]);
      toast({ title: "Appointment Requested", description: `Visit on ${new Date(appt.scheduled_time).toLocaleString()}.` });
      setShowMotherScheduleModal(false);
      setMotherScheduleForm({ scheduledTime: undefined, appointmentType: 'prenatal_checkup', notes: '' });
    } catch (err: unknown) {
      toast({ title: "Scheduling Failed", description: (err as Error).message || "Could not schedule appointment.", variant: "destructive" });
    } finally {
      setMotherScheduleSubmitting(false);
    }
  };

  // Handle photo upload
  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const meta = await uploadPhoto(file);
      setProfileImage(getPhotoFileUrl(meta.file_url));
      toast({
        title: "Photo Updated",
        description: "Your profile photo has been successfully updated.",
      });
      setShowPhotoUpload(false);
    } catch (err: unknown) {
      toast({
        title: "Upload failed",
        description: (err as Error).message || "Could not upload photo.",
        variant: "destructive",
      });
    }
  };

  // Toggle reminder completion
  const toggleReminder = async (id: number | string) => {
    // If it's an appointment masquerading as a reminder, we don't toggle it here
    if (typeof id === 'string' && id.startsWith('appt_')) {
      toast({ title: "It's an appointment", description: "Appointments are marked completed by your healthcare provider." });
      return;
    }
    
    // Optimistic UI update
    setReminders(prev => prev.map(r =>
      r.id === id ? { ...r, completed: !r.completed } : r
    ));

    try {
      await reminderService.toggle(Number(id));
    } catch (err) {
        // Revert on error
        toast({ title: "Error", description: "Failed to update reminder.", variant: "destructive" });
        setReminders(prev => prev.map(r =>
            r.id === id ? { ...r, completed: !r.completed } : r
        ));
    }
  };

  const handleAddCustomReminder = async () => {
    if (!newReminderTitle.trim() || !newReminderTime.trim()) {
      toast({ title: "Incomplete", description: "Please provide a title and time for your reminder.", variant: "destructive" });
      return;
    }
    setAddReminderSubmitting(true);
    try {
      const iconCode = REMINDER_TYPE_ICON_MAP[newReminderType] || 'BELL';
      await reminderService.create({
        title: newReminderTitle,
        time: newReminderTime,
        type: newReminderType,
        icon: iconCode,
      });
      toast({ title: "Reminder added" });
      setShowAddReminderModal(false);
      setNewReminderTitle("");
      setNewReminderTime("");
      setNewReminderType("custom");
      refreshData();
    } catch (err: unknown) {
      toast({ title: "Failed to add reminder", description: (err as Error).message || "An error occurred.", variant: "destructive" });
    } finally {
      setAddReminderSubmitting(false);
    }
  };

  const handleEditReminder = async () => {
    if (!editingReminder) return;
    if (!editingReminder.title.trim() || !editingReminder.time.trim()) {
      toast({ title: "Incomplete", description: "Please provide a title and time for your reminder.", variant: "destructive" });
      return;
    }
    setEditReminderSubmitting(true);
    try {
      await reminderService.update(Number(editingReminder.id), {
        title: editingReminder.title,
        time: editingReminder.time,
      });
      toast({ title: "Reminder updated" });
      setEditingReminder(null);
      refreshData();
    } catch (err: unknown) {
      toast({ title: "Failed to update reminder", description: (err as Error).message || "An error occurred.", variant: "destructive" });
    } finally {
      setEditReminderSubmitting(false);
    }
  };

  const handleDeleteReminder = async (e: React.MouseEvent, id: number | string) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this reminder?")) return;
    
    try {
      await reminderService.delete(Number(id));
      toast({ title: "Reminder deleted" });
      refreshData();
    } catch (err: unknown) {
      toast({ title: "Failed to delete reminder", description: (err as Error).message || "An error occurred.", variant: "destructive" });
    }
  };

  const loadFacilitySearch = useCallback(async (overrideQuery?: string, overrideAmenity?: string) => {
    const effectiveQuery = overrideQuery !== undefined ? overrideQuery : facilityQuery;
    const effectiveAmenity = overrideAmenity !== undefined ? overrideAmenity : facilityAmenity;

    setFacilityLoading(true);
    setFacilityError(null);
    try {
      const response = await healthFacilityService.search({
        q: effectiveQuery.trim() || undefined,
        amenity: effectiveAmenity !== 'all' ? effectiveAmenity : undefined,
        limit: 20,
      });
      setFacilityResults(response.facilities || []);
      setFacilityMode('search');
    } catch (err: unknown) {
      setFacilityError((err as Error).message || 'Unable to search facilities right now.');
      setFacilityResults([]);
    } finally {
      setFacilityLoading(false);
    }
  }, [facilityAmenity, facilityQuery]);

  const handleUseMyLocation = async () => {
    setFacilityLoading(true);
    setFacilityError(null);
    try {
      const location = await healthFacilityService.getCurrentLocation();
      setCurrentLocation(location);

      const response = await healthFacilityService.nearby({
        lat: location.lat,
        lng: location.lng,
        radius_km: 10,
        amenity: facilityAmenity !== 'all' ? facilityAmenity : undefined,
        limit: 20,
      });

      setFacilityResults(response.facilities || []);
      setFacilityMode('nearby');
    } catch (err: unknown) {
      setFacilityError((err as Error).message || 'Unable to fetch nearby facilities.');
      setFacilityResults([]);
    } finally {
      setFacilityLoading(false);
    }
  };

  const openFacilityDetails = async (facility: HealthFacility) => {
    setFacilityDetailOpen(true);
    setSelectedFacility(facility);
    try {
      const detailed = await healthFacilityService.getDetail(facility.id);
      setSelectedFacility({
        ...detailed,
        distance_km: facility.distance_km,
      });
    } catch {
      // Fall back to card-level data if detail endpoint fails.
    }
  };

  const handleReportFacilityIssue = async (data: ReportIssueData) => {
    if (!selectedFacility) return;
    setReportIssueSubmitting(true);
    try {
      await healthFacilityService.reportIssue(selectedFacility.id, data);
      toast({
        title: 'Issue submitted',
        description: 'Thank you. We will review this facility report.',
      });

      const detailed = await healthFacilityService.getDetail(selectedFacility.id);
      setSelectedFacility({
        ...detailed,
        distance_km: selectedFacility.distance_km,
      });
    } catch (err: unknown) {
      toast({
        title: 'Issue submission failed',
        description: (err as Error).message || 'Please try again shortly.',
        variant: 'destructive',
      });
    } finally {
      setReportIssueSubmitting(false);
    }
  };

  const handleBookFacilityAppointment = async (payload: {
    scheduled_time: string;
    appointment_type?: string;
    notes?: string;
  }) => {
    if (!selectedFacility) return;

    setFacilityBookingSubmitting(true);
    try {
      await healthFacilityService.bookAppointment(selectedFacility.id, payload);
      const response = await healthFacilityService.getMyAppointments();
      setFacilityAppointments(response.appointments || []);
      setFacilityDetailOpen(false);
      toast({
        title: 'Appointment booked',
        description: `Your request was sent to ${selectedFacility.name}.`,
      });
    } catch (err: unknown) {
      toast({
        title: 'Booking failed',
        description: (err as Error).message || 'Please try again shortly.',
        variant: 'destructive',
      });
    } finally {
      setFacilityBookingSubmitting(false);
    }
  };

  // Handle check-in
  const handleCheckIn = async () => {
    if (!checkInSelected) return;
    if (!motherProfileId) {
      toast({ title: "Profile not found", description: "Please complete your profile first.", variant: "destructive" });
      return;
    }
    setCheckInSubmitting(true);
    try {
      await checkinService.create(motherProfileId, {
        response: checkInSelected,
        comment: checkInComment.trim() || undefined,
        symptoms: selectedSymptoms,
        channel: 'app',
      });
      setCheckInResponse(checkInSelected);
      setShowCheckInModal(false);
      setCheckInSelected(null);
      setSelectedSymptoms([]);
      setCheckInComment('');
      toast({
        title: checkInSelected === 'ok' ? "Check-in recorded" : "Check-in Recorded",
        description: checkInSelected === 'ok'
          ? "Great! Keep taking care of yourself."
          : "Your CHW has been notified and will contact you soon.",
      });
    } catch (err: unknown) {
      toast({
        title: "Submission Failed",
        description: (err as Error).message || "Could not submit check-in. Please try again.",
        variant: "destructive",
      });
    } finally {
      setCheckInSubmitting(false);
    }
  };


  // Calculate current week and dynamic tip
  const { currentWeek, dailyTip } = useMemo(() => {
    if (!profile?.due_date) return { currentWeek: 0, dailyTip: "Take time to connect with your baby today. Place your hands on your belly and talk or sing to them." };

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(profile.due_date);
    due.setHours(0, 0, 0, 0);

    const conceptionDate = new Date(due.getTime() - 280 * 24 * 60 * 60 * 1000);
    const daysPregnant = Math.floor((today.getTime() - conceptionDate.getTime()) / (1000 * 60 * 60 * 24));
    
    let week = Math.floor(daysPregnant / 7);
    week = Math.max(1, Math.min(week, 42));

    const tip = fetalDevelopmentData[week]?.motherTip || "Rest, hydrate, and listen to your body.";
    return { currentWeek: week, dailyTip: tip };
  }, [profile?.due_date]);

  // Calculate progress percentage
  const progressPercentage = (weeklyProgress.week / weeklyProgress.totalWeeks) * 100;

  // Get greeting based on time
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return { text: "Good morning", icon: Sun };
    if (hour < 17) return { text: "Good afternoon", icon: Sun };
    return { text: "Good evening", icon: Moon };
  };

  const greeting = getGreeting();
  const GreetingIcon = greeting.icon;

  // One-time setup: load profile photo + mother profile, then initial data fetch (with spinners)
  useEffect(() => {
    let isMounted = true;
    (async () => {
      // Photo
      try {
        const meta = await getMyPhoto();
        if (meta && isMounted) setProfileImage(getPhotoFileUrl(meta.file_url));
      } catch { /* ignore */ }

      // Mother profile ID (needed for check-in; fetched once, not on every poll)
      try {
        const fetchedProfile = await motherService.getMyProfile();
        if (fetchedProfile?.id && isMounted) {
          setMotherProfileId(fetchedProfile.id);
          setProfile(fetchedProfile);
          motherProfileIdRef.current = fetchedProfile.id;
        }
      } catch { /* ignore */ }

      // Assigned CHW user_id (needed for correct appointment health_worker_id)
      try {
        if (user?.id) {
          const chwData = await assignmentService.getAssignedCHWForMother(user.id);
          if (chwData.assigned && chwData.chw?.user_id && isMounted) {
            setAssignedCHWUserId(chwData.chw.user_id);
          }
        }
      } catch { /* ignore */ }

      // Initial data load â€” show spinner for appointments
      if (isMounted) setAppointmentsLoading(true);
      await refreshData();
      if (isMounted) setAppointmentsLoading(false);
    })();
    return () => { isMounted = false; };
  }, [refreshData, user?.id]);

  useEffect(() => {
    if (activeTab !== 'facilities') return;
    if (facilityResults.length > 0 || facilityLoading) return;
    loadFacilitySearch('', facilityAmenity);
  }, [activeTab, facilityResults.length, facilityLoading, facilityAmenity, loadFacilitySearch]);

  const totalNutritionCalories = useMemo(() => {
    return nutritionPlans.reduce((sum, plan) => sum + (plan.calories || 0), 0);
  }, [nutritionPlans]);

  const nutritionTips = useMemo(() => {
    const tips = nutritionPlans.flatMap(plan => plan.health_benefits || []);
    if (tips.length === 0) {
      return [
        "Stay hydrated - aim for 8-10 glasses of water daily",
        "Include lean protein and leafy greens for iron support",
        "Snack on fruits or nuts between meals to steady energy",
        "Take prenatal vitamins with meals to reduce nausea",
      ];
    }
    return tips.slice(0, 4);
  }, [nutritionPlans]);

  const formatMealType = (mealType?: string) => {
    if (!mealType) return "Meal";
    return mealType.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  };

  const getMealIconInfo = (mealType?: string) => {
    switch (mealType?.toLowerCase()) {
      case 'breakfast':
        return { icon: Sun, color: 'text-amber-500', bg: 'from-amber-100 to-yellow-100' };
      case 'snack':
        return { icon: Apple, color: 'text-orange-500', bg: 'from-orange-100 to-amber-100' };
      case 'lunch':
        return { icon: Utensils, color: 'text-green-500', bg: 'from-green-100 to-emerald-100' };
      case 'dinner':
        return { icon: Moon, color: 'text-purple-500', bg: 'from-purple-100 to-indigo-100' };
      default:
        return { icon: Utensils, color: 'text-gray-500', bg: 'from-gray-100 to-slate-100' };
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50/30">

      {/* Photo Upload Modal */}
      <Dialog open={showPhotoUpload} onOpenChange={setShowPhotoUpload}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center">Add Your Profile Photo</DialogTitle>
            <DialogDescription className="text-center">
              Personalize your profile with a photo. This helps your CHW recognize you.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center space-y-4 py-6">
            <div className="relative">
              <Avatar className="h-32 w-32">
                <AvatarImage src={profileImage || undefined} />
                <AvatarFallback className="bg-primary text-primary-foreground text-4xl">
                  {user?.first_name?.charAt(0).toUpperCase() || 'M'}
                </AvatarFallback>
              </Avatar>
              <label
                htmlFor="photo-upload"
                className="absolute bottom-0 right-0 bg-primary text-primary-foreground p-2 rounded-full cursor-pointer hover:bg-primary/90 transition-colors"
              >
                <Camera className="h-5 w-5" />
              </label>
              <input
                id="photo-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handlePhotoUpload}
              />
            </div>
            <p className="text-sm text-muted-foreground">
              Tap the camera icon to upload a photo
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setShowPhotoUpload(false)}
            >
              Skip for now
            </Button>
            <Button
              className="flex-1"
              onClick={() => setShowPhotoUpload(false)}
              disabled={!profileImage}
            >
              Continue
            </Button>
          </div>
        </DialogContent>
      </Dialog>


      {/* Check-in Modal */}
      <Dialog open={showCheckInModal} onOpenChange={(open) => { setShowCheckInModal(open); if (!open) { setCheckInSelected(null); setSelectedSymptoms([]); setCheckInComment(''); } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center text-2xl">How are you feeling today?</DialogTitle>
            <DialogDescription className="text-center">
              Your response helps us monitor your health and provide better care
            </DialogDescription>
          </DialogHeader>

          {/* Step 1 â€” choose response */}
          <div className="grid grid-cols-2 gap-4 pt-4">
            <button
              onClick={() => setCheckInSelected('ok')}
              className={`flex flex-col items-center p-6 rounded-xl border-2 transition-all ${checkInSelected === 'ok'
                  ? 'bg-green-100 border-green-500 ring-2 ring-green-400'
                  : 'bg-green-50 border-green-200 hover:bg-green-100 hover:border-green-300'
                }`}
            >
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-3 transition-colors ${checkInSelected === 'ok' ? 'bg-green-200' : 'bg-green-100'
                }`}>
                <Sparkles className="h-8 w-8 text-green-600" />
              </div>
              <span className="font-semibold text-green-700">I'm feeling great!</span>
              <span className="text-sm text-green-600 mt-1">No concerns</span>
              {checkInSelected === 'ok' && (
                <CheckCircle className="h-5 w-5 text-green-500 mt-2" />
              )}
            </button>
            <button
              onClick={() => setCheckInSelected('not_ok')}
              className={`flex flex-col items-center p-6 rounded-xl border-2 transition-all ${checkInSelected === 'not_ok'
                  ? 'bg-red-100 border-red-500 ring-2 ring-red-400'
                  : 'bg-red-50 border-red-200 hover:bg-red-100 hover:border-red-300'
                }`}
            >
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-3 transition-colors ${checkInSelected === 'not_ok' ? 'bg-red-200' : 'bg-red-100'
                }`}>
                <Heart className="h-8 w-8 text-red-600" />
              </div>
              <span className="font-semibold text-red-700">Not feeling well</span>
              <span className="text-sm text-red-600 mt-1">Need support</span>
              {checkInSelected === 'not_ok' && (
                <CheckCircle className="h-5 w-5 text-red-500 mt-2" />
              )}
            </button>
          </div>

          {checkInSelected === 'not_ok' && (
            <div className="space-y-2 mt-4">
              <label className="text-sm font-medium">Select any symptoms you're experiencing:</label>
              <div className="flex flex-wrap gap-2">
                {["Headache", "Nausea", "Swelling", "Bleeding", "Dizziness", "Reduced movement", "Fever", "Back pain", "Abdominal pain", "Other"].map(symptom => (
                  <Badge 
                    key={symptom}
                    variant={selectedSymptoms.includes(symptom) ? "default" : "outline"}
                    className="cursor-pointer hover:bg-slate-100"
                    onClick={() => {
                      setSelectedSymptoms(prev => 
                        prev.includes(symptom) 
                          ? prev.filter(s => s !== symptom) 
                          : [...prev, symptom]
                      );
                    }}
                  >
                    {symptom}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Step 2 â€” optional comment + submit */}
          {checkInSelected && (
            <div className="space-y-3 pt-2">
              <Textarea
                placeholder="Add a note (optional) describe how you feel..."
                value={checkInComment}
                onChange={(e) => setCheckInComment(e.target.value)}
                rows={3}
                className="resize-none"
              />
              <Button
                onClick={handleCheckIn}
                disabled={checkInSubmitting}
                className={`w-full ${checkInSelected === 'ok'
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-red-600 hover:bg-red-700'
                  } text-white`}
              >
                {checkInSubmitting ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Submitting...</>
                ) : (
                  <><CheckCircle className="h-4 w-4 mr-2" />Submit Check-in</>
                )}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b">
        <ConnectionBanner />
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate(-1)}
                className="mr-1 rounded-full bg-slate-100 hover:bg-slate-200"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="bg-gradient-to-br from-pink-400 to-purple-500 p-2 rounded-xl">
                <Baby className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-lg text-primary">
                  RemyAfya
                </h1>
                <p className="text-xs text-muted-foreground">Mother's Dashboard</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5" />
                    {unreadNotificationCount > 0 && (
                      <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full text-[10px] text-white flex items-center justify-center">
                        {unreadNotificationCount}
                      </span>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80">
                  <DropdownMenuLabel className="flex items-center justify-between">
                    <span>Notifications</span>
                    {unreadNotificationCount > 0 && (
                      <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={markAllNotificationsRead}>
                        Mark all read
                      </Button>
                    )}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {notifications.length === 0 && (
                    <DropdownMenuItem className="text-muted-foreground">No notifications yet</DropdownMenuItem>
                  )}
                  {notifications.map((notification) => (
                    <DropdownMenuItem
                      key={notification.id}
                      className={`flex flex-col items-start p-3 ${!notification.is_read ? 'bg-pink-50' : ''}`}
                      onClick={async () => {
                        await markNotificationRead(notification.id);
                        if (notification.url) navigate(notification.url);
                      }}
                    >
                      <span className="text-sm font-medium">{notification.title}</span>
                      <span className="text-sm">{notification.message}</span>
                      <span className="text-xs text-muted-foreground">{new Date(notification.created_at).toLocaleString()}</span>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <DashboardAccountMenu
                userName={`${user?.first_name || ""} ${user?.last_name || ""}`.trim()}
                phoneNumber={user?.phone_number}
                profileImage={profileImage}
                fallbackText={user?.first_name?.charAt(0).toUpperCase() || "M"}
                onProfile={() => navigate("/dashboard/mother/profile")}
                onSettings={() => navigate("/dashboard/mother/settings")}
                onLogout={logout}
              />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-foreground mb-2">
            Hello <span className="capitalize">{user?.first_name?.toLowerCase() || 'Mom'}</span>
          </h2>
          <p className="text-muted-foreground">
            You're doing amazing! Let's make today count for you and your baby.
          </p>
        </div>

        {/* Pregnancy Progress Card */}
        {profile?.due_date && (
          <PregnancyJourneyTracker
            dueDate={profile.due_date}
            ultrasoundData={ultrasoundRecords}
            ultrasoundLoading={ultrasoundRecordsLoading}
            weightLogs={weightLogs}
            weightLogsLoading={weightLogsLoading}
            onWeightLogged={handleWeightLogged}
            onCheckInClick={() => setShowCheckInModal(true)}
          />
        )}

        {/* Main Tabs Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 w-full">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="appointments">Appointments</TabsTrigger>
            <TabsTrigger value="facilities">Find Facilities</TabsTrigger>
            <TabsTrigger value="nutrition">Nutrition</TabsTrigger>
            <TabsTrigger value="articles">Articles</TabsTrigger>
            <TabsTrigger value="reminders">Reminders</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Today's Highlights */}
            <div className="grid md:grid-cols-2 gap-4">
              {/* Daily Tip */}
              <Card className="bg-blue-50 border-blue-200">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-blue-500" />
                    <CardTitle className="text-base">Daily Tip</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    "{dailyTip}"
                  </p>
                </CardContent>
              </Card>

              {/* Next Appointment */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-primary" />
                    <CardTitle className="text-base">Next Appointment</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  {appointments.length > 0 ? (
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">
                          {appointments[0].notes?.slice(0, 30) || "Scheduled Visit"}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(appointments[0].scheduled_time).toLocaleString()}
                        </p>
                      </div>
                      <Button size="sm" variant="outline" onClick={() => setActiveTab("appointments")}>
                        View Details
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Prenatal Checkup</p>
                        <p className="text-sm text-muted-foreground">Dr. Sarah Johnson</p>
                        <p className="text-sm text-muted-foreground">Tomorrow, 10:00 AM</p>
                      </div>
                      <Button size="sm" variant="outline" onClick={() => setActiveTab("appointments")}>
                        View Details
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Upcoming Reminders Preview */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bell className="h-5 w-5 text-purple-500" />
                    <CardTitle className="text-base">Today's Reminders</CardTitle>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setActiveTab("reminders")}>
                    View All
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {reminders.slice(0, 3).map((reminder) => (
                    <div
                      key={reminder.id}
                      className={`flex items-center justify-between p-3 rounded-lg transition-colors ${reminder.completed ? 'bg-blue-50' : 'bg-gray-50'
                        }`}
                    >
                      <div className="flex items-center gap-3">
                        <ReminderIconBadge reminder={reminder} compact />
                        <div>
                          <p className={`font-medium ${reminder.completed ? 'line-through text-muted-foreground' : ''}`}>
                            {reminder.title}
                          </p>
                          <p className="text-xs text-muted-foreground">{reminder.time}</p>
                        </div>
                      </div>
                      <Switch
                        checked={reminder.completed}
                        onCheckedChange={() => toggleReminder(reminder.id)}
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Featured Articles Preview */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-lg">Recommended for You</h3>
                <Button variant="ghost" size="sm" onClick={() => setActiveTab("articles")}>
                  See All
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
              <ScrollArea className="w-full whitespace-nowrap">
                <div className="flex gap-4 pb-4">
                  {resources.slice(0, 3).map((resource) => (
                    <Card
                      key={resource.id}
                      className="w-[300px] flex-shrink-0 cursor-pointer hover:shadow-lg transition-shadow"
                      onClick={() => window.open(resource.url, '_blank', 'noopener,noreferrer')}
                    >
                      <CardHeader>
                        <div className="flex items-center gap-3">
                          <div className="text-2xl">{resource.thumbnail}</div>
                          <div className="flex-1">
                            <Badge variant="secondary" className="mb-2">{resource.category}</Badge>
                            {resource.content_type === 'video' && (
                              <Badge className="bg-red-500 text-white ml-2">
                                <Play className="h-3 w-3 mr-1 fill-white" />
                                Video
                              </Badge>
                            )}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <h4 className="font-medium line-clamp-2 mb-2 whitespace-normal">{resource.title}</h4>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {resource.description}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                <ScrollBar orientation="horizontal" />
              </ScrollArea>
            </div>
          </TabsContent>

          {/* Facilities Tab */}
          <TabsContent value="facilities" className="space-y-4">
            <div className="flex flex-col md:flex-row md:items-end gap-3">
              <div className="flex-1 space-y-2">
                <Label htmlFor="facility-search">Search facilities</Label>
                <Input
                  id="facility-search"
                  value={facilityQuery}
                  onChange={(e) => setFacilityQuery(e.target.value)}
                  placeholder="Facility name, town, or keyword"
                />
              </div>

              <div className="w-full md:w-56 space-y-2">
                <Label>Facility type</Label>
                <Select
                  value={facilityAmenity}
                  onValueChange={setFacilityAmenity}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    {FACILITY_AMENITY_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => loadFacilitySearch()}
                  disabled={facilityLoading}
                >
                  {facilityLoading && facilityMode === 'search' ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                  Search
                </Button>

                <Button
                  onClick={handleUseMyLocation}
                  disabled={facilityLoading}
                >
                  {facilityLoading && facilityMode === 'nearby' ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <LocateFixed className="h-4 w-4 mr-2" />}
                  Near Me
                </Button>
              </div>
            </div>

            {currentLocation && facilityMode === 'nearby' && (
              <Alert>
                <MapPin className="h-4 w-4" />
                <AlertDescription>
                  Showing facilities within 10 km of your location ({currentLocation.lat.toFixed(3)}, {currentLocation.lng.toFixed(3)}).
                </AlertDescription>
              </Alert>
            )}

            {facilityError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{facilityError}</AlertDescription>
              </Alert>
            )}

            {facilityLoading ? (
              <div className="py-12 text-center text-muted-foreground">
                <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                Loading facilities...
              </div>
            ) : facilityResults.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className={`${RESPONSIVE_PADDING.modal} text-center space-y-2`}>
                  <MapPin className="h-10 w-10 mx-auto text-muted-foreground/60" />
                  <p className="font-medium">No facilities found</p>
                  <p className="text-sm text-muted-foreground">
                    Try a different keyword, type filter, or use Near Me for location-based results.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                {facilityResults.map((facility) => (
                  <FacilitySearchCard
                    key={facility.id}
                    facility={facility}
                    onViewDetails={openFacilityDetails}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          {/* Appointments Tab */}
          <TabsContent value="appointments" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Facility Bookings</CardTitle>
              </CardHeader>
              <CardContent>
                {facilityAppointments.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No facility bookings yet. Book from the Find Facilities tab.</p>
                ) : (
                  <div className="space-y-2">
                    {facilityAppointments.map((booking) => (
                      <div key={booking.id} className="border rounded-md p-3 flex items-start justify-between gap-3">
                        <div>
                          <p className="font-medium">{booking.facility_name || `Facility #${booking.facility_id}`}</p>
                          <p className="text-sm text-muted-foreground">At Facility • {new Date(booking.scheduled_time).toLocaleString('en-KE')}</p>
                          <p className="text-xs text-muted-foreground capitalize mt-1">{(booking.appointment_type || 'appointment').replace(/_/g, ' ')}</p>
                          {booking.ticket_code && (
                            <p className="mt-2 text-xs text-muted-foreground">
                              Ticket Code: <span className="font-mono text-foreground">{booking.ticket_code}</span>
                            </p>
                          )}
                        </div>
                        <Badge variant="outline" className="capitalize">{booking.status}</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-lg">{showHiddenAppointments ? 'Recently Deleted Appointments' : 'Your Appointments'}</h3>
                <p className="text-sm text-muted-foreground">{showHiddenAppointments ? 'Visible for up to 15 days, then auto-expire from this list' : 'Scheduled visits with your health worker'}</p>
              </div>
              {showHiddenAppointments ? (
                <Button variant="outline" size="sm" onClick={() => setShowHiddenAppointments(false)}>
                  Back To Active Appointments
                </Button>
              ) : (
                <Dialog open={showMotherScheduleModal} onOpenChange={setShowMotherScheduleModal}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Plus className="h-4 w-4 mr-1" />
                      Schedule
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Schedule an Appointment</DialogTitle>
                      <DialogDescription>Request a visit with your health worker.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                      <div className="space-y-2">
                        <Label>Date & Time *</Label>
                        <DateTimePicker
                          date={motherScheduleForm.scheduledTime}
                          setDate={(date) => setMotherScheduleForm(f => ({ ...f, scheduledTime: date }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Appointment Type</Label>
                        <Select
                          value={motherScheduleForm.appointmentType}
                          onValueChange={v => setMotherScheduleForm(f => ({ ...f, appointmentType: v }))}
                        >
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="prenatal_checkup">Prenatal Checkup</SelectItem>
                            <SelectItem value="home_visit">Home Visit</SelectItem>
                            <SelectItem value="ultrasound">Ultrasound</SelectItem>
                            <SelectItem value="lab_test">Lab Test</SelectItem>
                            <SelectItem value="postnatal_care">Postnatal Care</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Notes (optional)</Label>
                        <Textarea
                          placeholder="Reason for the visit, any symptoms..."
                          value={motherScheduleForm.notes}
                          onChange={e => setMotherScheduleForm(f => ({ ...f, notes: e.target.value }))}
                          rows={3}
                        />
                      </div>
                      <Button className="w-full" onClick={handleMotherScheduleAppointment} disabled={motherScheduleSubmitting}>
                        {motherScheduleSubmitting ? (
                          <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Scheduling...</>
                        ) : (
                          <><Calendar className="h-4 w-4 mr-2" />Confirm Appointment</>
                        )}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </div>

            {!showHiddenAppointments && (
              <Tabs value={apptTab} onValueChange={(val) => setApptTab(val as 'yours' | 'chw')} className="mb-4">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="yours" className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    <span className="truncate">Your Requests ({apptsByMother.length})</span>
                  </TabsTrigger>
                  <TabsTrigger value="chw" className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span className="truncate">Health Worker Appointments ({apptsByChw.length})</span>
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            )}

            {(showHiddenAppointments ? hiddenAppointmentsLoading : appointmentsLoading) ? (
              <div className="flex items-center justify-center py-12">
                <Activity className="h-6 w-6 animate-spin text-muted-foreground mr-2" />
                <span className="text-muted-foreground">Loading appointments...</span>
              </div>
            ) : (displayedAppointments.length === 0) ? (
              <div className="space-y-3">
                <Card className="border-dashed border-2 border-primary/30 bg-primary/5">
                  <CardContent className={`${RESPONSIVE_PADDING.card} text-center`}>
                    <Calendar className="h-10 w-10 mx-auto mb-2 text-primary/50" />
                    <p className="text-sm text-muted-foreground">
                      {showHiddenAppointments ? 'No deleted appointments in the last 15 days.' : (apptTab === 'yours' ? 'You haven\'t requested any appointments yet.' : 'No Health Worker appointments scheduled yet.')}
                    </p>
                    {!showHiddenAppointments && apptTab === 'yours' && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Use the Schedule button to request a visit.
                      </p>
                    )}
                  </CardContent>
                </Card>
              </div>
            ) : (
              /* Real appointments from API */
              <div className="space-y-3">
                {displayedAppointments.map((appt) => {
                  const isScheduled = appt.status === 'scheduled';
                  const isCompleted = appt.status === 'completed';
                  const isCancelled = appt.status === 'canceled' || appt.status === 'cancelled';
                  return (
                    <Card key={appt.id} className={`hover:shadow-md transition-shadow ${isCancelled ? 'opacity-60' : ''}`}>
                      <CardContent className={RESPONSIVE_PADDING.card}>
                        <div className="flex items-start gap-4">
                          <div className={`p-3 rounded-xl ${isCompleted ? 'bg-green-100' :
                              isCancelled ? 'bg-gray-100' :
                                'bg-purple-100'
                            }`}>
                            <Calendar className={`h-5 w-5 ${isCompleted ? 'text-green-600' :
                                isCancelled ? 'text-gray-400' :
                                  'text-purple-600'
                              }`} />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <h4 className="font-medium capitalize">
                                  {appt.appointment_type
                                    ? appt.appointment_type.replace(/_/g, ' ')
                                    : 'Scheduled Appointment'}
                                </h4>
                                {apptTab === 'chw' && (
                                  <div className="text-sm font-semibold text-primary/80 mt-0.5">
                                    {appt.creator_name ? `${appt.creator_name} - ${appt.creator_role ? appt.creator_role.toUpperCase() : 'HW'}` : 'Health Worker'}
                                  </div>
                                )}
                                <div className="flex items-center gap-1 mt-1 text-sm text-muted-foreground">
                                  <Clock className="h-3 w-3" />
                                  <span>
                                    {new Date(appt.scheduled_time).toLocaleString('en-KE', {
                                      weekday: 'short',
                                      year: 'numeric',
                                      month: 'short',
                                      day: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit',
                                    })}
                                  </span>
                                </div>
                                {appt.ticket_code && (
                                  <p className="mt-2 text-xs text-muted-foreground">
                                    Ticket Code: <span className="font-mono text-foreground">{appt.ticket_code}</span>
                                  </p>
                                )}
                              </div>
                              <div className="flex items-center gap-2 flex-shrink-0">
                                <Badge
                                  variant="outline"
                                  className={`text-xs whitespace-nowrap ${isScheduled ? 'bg-green-50 text-green-700 border-green-200' :
                                      isCompleted ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                        'bg-gray-50 text-gray-600 border-gray-200'
                                    }`}
                                >
                                  {appt.status}
                                </Badge>
                                {!showHiddenAppointments && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 text-red-400 hover:text-red-600 hover:bg-red-50"
                                    onClick={() => setDeleteApptConfirm(appt.id)}
                                    title="Delete from dashboard"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                )}
                                {showHiddenAppointments && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-7 text-xs border-green-200 text-green-700 hover:bg-green-50"
                                    onClick={async () => {
                                      try {
                                        await appointmentService.restoreDeleted(appt.id);
                                        setHiddenAppointments(prev => prev.filter(a => a.id !== appt.id));
                                        await refreshData();
                                        toast({ title: 'Appointment Restored' });
                                      } catch (err: unknown) {
                                        toast({ title: 'Error', description: (err as Error).message || 'Could not restore appointment.', variant: 'destructive' });
                                      }
                                    }}
                                  >
                                    Restore
                                  </Button>
                                )}
                              </div>
                            </div>
                            {appt.notes && (
                              <p className="text-xs text-muted-foreground mt-2 bg-gray-50 p-2 rounded-md">
                                Note: {appt.notes}
                              </p>
                            )}
                            <div className="flex flex-wrap items-center gap-2 mt-2">
                              {appt.escalated && (
                                <Badge className="bg-red-100 text-red-700 text-xs">Escalated</Badge>
                              )}
                              {appt.recurrence_rule && appt.recurrence_rule !== 'none' && (
                                <span className="text-xs text-purple-600">Repeats: {appt.recurrence_rule}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* Nutrition Tab */}
          <TabsContent value="nutrition" className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-lg">Today's Meal Plan</h3>
                <p className="text-sm text-muted-foreground">Personalized nutrition for you and your baby</p>
              </div>
              <Badge variant="secondary" className="text-sm">
                <Apple className="h-4 w-4 mr-1" />
                {totalNutritionCalories > 0 ? `${totalNutritionCalories} kcal` : 'Balanced Plate'}
              </Badge>
            </div>

            {nutritionError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{nutritionError}</AlertDescription>
              </Alert>
            )}

            {nutritionLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((idx) => (
                  <Card key={idx} className="overflow-hidden animate-pulse">
                    <CardContent className="p-0">
                      <div className="flex">
                        <div className="w-20 bg-orange-100 h-full" />
                        <div className="flex-1 p-4 space-y-2">
                          <div className="h-4 w-24 bg-muted rounded" />
                          <div className="h-5 w-2/3 bg-muted rounded" />
                          <div className="h-3 w-full bg-muted rounded" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : nutritionPlans.length === 0 ? (
              <Card>
                <CardContent className={`${RESPONSIVE_PADDING.modal} text-center text-muted-foreground`}>
                  We’re preparing a personalized plan for you. Check back soon for culturally relevant meals.
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {nutritionPlans.map((meal) => (
                  <Card key={meal.id ?? meal.source_id} className="overflow-hidden">
                    <CardContent className="p-0">
                      <div className="flex">
                        {(() => {
                          const iconInfo = getMealIconInfo(meal.meal_type);
                          const IconComp = iconInfo.icon;
                          return (
                            <div className={`w-20 bg-gradient-to-br ${iconInfo.bg} flex items-center justify-center`}>
                              <IconComp className={`h-8 w-8 ${iconInfo.color}`} />
                            </div>
                          );
                        })()}
                        <div className="flex-1 p-4">
                          <div className="flex items-start justify-between gap-4">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <Badge variant="outline" className="text-xs capitalize">
                                  {formatMealType(meal.meal_type)}
                                </Badge>
                                {meal.meal_time && (
                                  <span className="text-xs text-muted-foreground">{meal.meal_time}</span>
                                )}
                                {meal.nutrition_highlight && (
                                  <Badge variant="secondary" className="text-xs bg-orange-100 text-orange-700">
                                    {meal.nutrition_highlight}
                                  </Badge>
                                )}
                              </div>
                              <h4 className="font-medium">
                                {meal.title}
                                {meal.swahili_name && (
                                  <span className="block text-sm text-muted-foreground italic">
                                    {meal.swahili_name}
                                  </span>
                                )}
                              </h4>
                              <p className="text-sm text-muted-foreground">{meal.description || meal.content}</p>
                              {meal.portion_guide && (
                                <p className="text-xs text-muted-foreground">
                                  Portion: {meal.portion_guide}
                                </p>
                              )}
                            </div>
                            <div className="text-right min-w-[80px]">
                              {meal.calories && (
                                <p className="font-semibold text-sm">{meal.calories} kcal</p>
                              )}
                              {meal.tags?.length > 0 && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  {meal.tags.slice(0, 2).join(' • ')}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-2 mt-3">
                            {(meal.key_nutrients?.length ? meal.key_nutrients : meal.tags)?.slice(0, 4).map((nutrient, idx) => (
                              <Badge key={`${meal.id}-nutrient-${idx}`} variant="secondary" className="text-xs bg-green-100 text-green-700">
                                {nutrient}
                              </Badge>
                            ))}
                          </div>
                          {meal.cautions?.length > 0 && (
                            <Alert className="mt-3 border-amber-200 bg-amber-50 text-amber-900">
                              <AlertCircle className="h-4 w-4" />
                              <AlertDescription className="text-xs">
                                {meal.cautions[0]}
                              </AlertDescription>
                            </Alert>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Nutrition Tips */}
            <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Heart className="h-5 w-5 text-green-600" />
                  <CardTitle className="text-base">Nutrition Tips</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  {nutritionTips.map((tip, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-green-500 mt-0.5">✓</span>
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Articles Tab */}
          <TabsContent value="articles" className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-lg">Resources</h3>
                <p className="text-sm text-muted-foreground">Expert articles and videos for every stage</p>
              </div>
            </div>

            {resourcesError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{resourcesError}</AlertDescription>
              </Alert>
            )}

            {resourcesLoading ? (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {resources.map((resource) => (
                  <Card
                    key={resource.id}
                    className="hover:shadow-lg transition-all duration-300 cursor-pointer hover:-translate-y-1"
                    onClick={() => window.open(resource.url, '_blank', 'noopener,noreferrer')}
                  >
                    <CardHeader>
                      <div className="flex items-center gap-3">
                        <div className="text-3xl">{resource.thumbnail}</div>
                        <div className="flex-1">
                          <CardTitle className="text-lg">{resource.title}</CardTitle>
                          <Badge variant="secondary" className="mt-1">{resource.category}</Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <CardDescription className="text-sm mb-4">
                        {resource.description}
                      </CardDescription>
                      <Button variant="outline" className="w-full">
                        {resource.content_type === 'video' ? '▶ Watch' : '📖 Read More'}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Reminders Tab */}
          <TabsContent value="reminders" className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-lg">Daily Reminders</h3>
                <p className="text-sm text-muted-foreground">Stay on track with your pregnancy journey</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  {reminders.filter(r => r.completed).length}/{reminders.length} completed
                </span>
                <Progress
                  value={(reminders.filter(r => r.completed).length / reminders.length) * 100}
                  className="w-24 h-2"
                />
              </div>
            </div>

            <div className="space-y-3">
              {reminders.map((reminder) => (
                <Card
                  key={reminder.id}
                  className={`transition-all cursor-pointer ${reminder.completed ? 'bg-blue-50 border-blue-200' : 'hover:shadow-md'
                    }`}
                  onClick={() => toggleReminder(reminder.id)}
                >
                  <CardContent className={RESPONSIVE_PADDING.card}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={reminder.completed ? 'opacity-60' : ''}>
                          <ReminderIconBadge reminder={reminder} />
                        </div>
                        <div>
                          <p className={`font-medium ${reminder.completed ? 'line-through text-muted-foreground' : ''}`}>
                            {reminder.title}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <Clock className="h-3 w-3 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">{reminder.time}</span>
                            <Badge variant="outline" className="text-xs capitalize">
                              {reminder.type}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {reminder.type !== 'appointment' && (
                          <div className="flex items-center gap-1">
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-7 w-7 text-muted-foreground hover:text-primary z-10"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingReminder(reminder);
                                }}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-7 w-7 text-muted-foreground hover:text-destructive z-10"
                                onClick={(e) => handleDeleteReminder(e, reminder.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                          </div>
                        )}
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${reminder.completed
                          ? 'bg-blue-500 border-blue-500'
                          : 'border-gray-300'
                          }`}>
                          {reminder.completed && <CheckCircle className="h-4 w-4 text-white" />}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Add Custom Reminder */}
            <Dialog open={showAddReminderModal} onOpenChange={setShowAddReminderModal}>
              <DialogTrigger asChild>
                <Button variant="outline" className="w-full">
                  <Bell className="h-4 w-4 mr-2" />
                  Add Custom Reminder
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add a Custom Reminder</DialogTitle>
                  <DialogDescription>Create a personal reminder to help you stay on track.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">What do you need to remember?</Label>
                    <Input 
                        id="title" 
                        placeholder="e.g., Take Iron Supplement" 
                        value={newReminderTitle} 
                        onChange={(e) => setNewReminderTitle(e.target.value)} 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="time">When should you do this daily?</Label>
                    <Input 
                        id="time" 
                        type="time"
                        value={newReminderTime} 
                        onChange={(e) => setNewReminderTime(e.target.value)} 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reminder-type">Reminder type</Label>
                    <Select value={newReminderType} onValueChange={setNewReminderType}>
                      <SelectTrigger id="reminder-type">
                        <SelectValue placeholder="Pick reminder type" />
                      </SelectTrigger>
                      <SelectContent>
                        {REMINDER_TYPE_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowAddReminderModal(false)}>Cancel</Button>
                  <Button onClick={handleAddCustomReminder} disabled={addReminderSubmitting}>
                    {addReminderSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Adding</> : 'Add Reminder'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            {/* Edit Reminder Modal */}
            <Dialog open={!!editingReminder} onOpenChange={(open) => !open && setEditingReminder(null)}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Edit Reminder</DialogTitle>
                  <DialogDescription>Update the details of your reminder.</DialogDescription>
                </DialogHeader>
                {editingReminder && (
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit-title">Task Name</Label>
                      <Input 
                          id="edit-title" 
                          value={editingReminder.title} 
                          onChange={(e) => setEditingReminder({...editingReminder, title: e.target.value})} 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-time">Time</Label>
                      <Input 
                          id="edit-time" 
                          type="time" 
                          value={editingReminder.time} 
                          onChange={(e) => setEditingReminder({...editingReminder, time: e.target.value})} 
                      />
                    </div>
                  </div>
                )}
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setEditingReminder(null)}>Cancel</Button>
                  <Button onClick={handleEditReminder} disabled={editReminderSubmitting}>
                    {editReminderSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving</> : 'Save Changes'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </TabsContent>
        </Tabs>
      </main>

      {/* Appointment Delete Confirmation */}
      <Dialog open={deleteApptConfirm !== null} onOpenChange={(o) => { if (!o) setDeleteApptConfirm(null); }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Remove Appointment From Your Dashboard?</DialogTitle>
            <DialogDescription>
              This only deletes it from your dashboard for you. It will remain in the system for other users.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 mt-2">
            <Button
              variant="destructive"
              className="flex-1"
              disabled={deleteApptSubmitting}
              onClick={async () => {
                if (!deleteApptConfirm) return;
                setDeleteApptSubmitting(true);
                try {
                  await appointmentService.softDelete(deleteApptConfirm, 'deleted_by_mother_dashboard');
                  setAppointments(prev => prev.filter(a => a.id !== deleteApptConfirm));
                  setDeleteApptConfirm(null);
                } catch (err: unknown) {
                  toast({ title: 'Error', description: (err as Error)?.message ?? 'Failed to delete appointment.', variant: 'destructive' });
                } finally {
                  setDeleteApptSubmitting(false);
                }
              }}
            >
              {deleteApptSubmitting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving...</> : 'Yes, Delete'}
            </Button>
            <Button variant="outline" className="flex-1" onClick={() => setDeleteApptConfirm(null)} disabled={deleteApptSubmitting}>Cancel</Button>
          </div>
        </DialogContent>
      </Dialog>

      <FacilityDetailModal
        facility={selectedFacility}
        open={facilityDetailOpen}
        onOpenChange={setFacilityDetailOpen}
        onReportIssue={handleReportFacilityIssue}
        onBookAppointment={handleBookFacilityAppointment}
        reporting={reportIssueSubmitting}
        booking={facilityBookingSubmitting}
      />
    </div>
  );
}
