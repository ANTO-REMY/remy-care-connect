import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users, AlertTriangle, Upload, Calendar, CheckCircle,
  X, Search, Filter, MapPin, TrendingUp, Activity, ArrowLeft,
  Heart, Baby, Clock, ChevronRight, MoreHorizontal, FileText,
  Video, Download, Share2, Bell, BarChart3, Stethoscope,
  ClipboardList, ArrowUpRight, ArrowDownRight, Sparkles, Star, Camera, Trash2,
  PlusCircle, Plus, CalendarCheck, CalendarX, Loader2, AlertCircle
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { DateTimePicker } from "@/components/ui/datetime-picker";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { uploadPhoto, getPhotoFileUrl, getMyPhoto } from "@/services/photoService";
import { escalationService } from "@/services/escalationService";
import { assignmentService, type AssignedMother } from "@/services/assignmentService";
import { appointmentService, type Appointment } from "@/services/appointmentService";
import { chwService } from "@/services/chwService";
import { apiClient } from "@/lib/apiClient";
import { checkinService, type CheckIn } from "@/services/checkinService";
import { ultrasoundService, type UltrasoundRecord } from "@/services/ultrasoundService";
import { weightService, type WeightLog } from "@/services/weightService";
import { notificationService, type UserNotification } from "@/services/notificationService";
import { useSocket, useSocketStatus, joinProfileRoom } from "@/hooks/useSocket";
import { ConnectionBanner } from "@/components/ConnectionBanner";
import resourceService, { Resource } from '@/services/resourceService';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { DashboardAccountMenu } from "@/components/layout/DashboardAccountMenu";
import { combineInsights, getMaternalWeightInsight, getUltrasoundInsight } from "@/lib/clinicalInsights";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// Mock data for escalated cases
const mockEscalatedCases = [
  {
    id: 1,
    motherId: 2,
    checkInId: null,
    motherName: "Grace Akinyi",
    issue: "Severe headaches and vision problems",
    issueType: "preeclampsia",
    escalatedAt: "2024-02-20T14:30:00",
    status: "pending",
    priority: "high",
    notes: "Mother reported persistent headaches and blurred vision. Blood pressure elevated during last visit.",
  },
];

// Mock weekly stats
const weeklyStats = {
  totalCheckIns: 45,
  checkInChange: 12,
  mothersWithIssues: 2,
  issuesChange: -1,
  escalatedCases: 1,
  escalatedChange: 0,
  newRegistrations: 3,
  registrationChange: 2,
};

interface CHWDashboardProps {
  isFirstLogin?: boolean;
}

interface MotherListItem {
  id: number;
  user_id: number;
  name: string;
  phone_number: string;
  status: "ok" | "not_ok" | "no_response";
  last_check_in: string;
  last_check_in_at?: string | null;
  weeks_pregnant: number;
  location: string;
  due_date: string;
  risk_level: "low" | "medium" | "high";
  last_ultrasound_at?: string | null;
  avatar: string | null;
  check_in_history: { date: string; status: string }[];
  notes?: string;
}

export function EnhancedCHWDashboard({ isFirstLogin = false }: CHWDashboardProps) {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [showPhotoUpload, setShowPhotoUpload] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [selectedMother, setSelectedMother] = useState<MotherListItem | null>(null);
  const [showMotherDetails, setShowMotherDetails] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showEscalationModal, setShowEscalationModal] = useState(false);
  const [escalationForm, setEscalationForm] = useState({
    motherId: "",
    checkInId: "",
    nurseId: "",
    issueType: "",
    description: "",
    priority: "high" as "low" | "medium" | "high" | "critical",
  });
  const [activeTab, setActiveTab] = useState("mothers");
  // Real-data state (populated from API; mock data used as initial fallback)
  const [chwProfileId, setChwProfileId] = useState<number | null>(null);
  const [availableNurses, setAvailableNurses] = useState<{ nurse_id: number; name: string }[]>([]);
  const [realEscalations, setRealEscalations] = useState<typeof mockEscalatedCases | null>(null);
  const [escalationSubmitting, setEscalationSubmitting] = useState(false);
  // Real assigned mothers from API
  const [realMothers, setRealMothers] = useState<AssignedMother[] | null>(null);
  // Appointments
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [hiddenAppointments, setHiddenAppointments] = useState<Appointment[]>([]);
  const [appointmentsLoading, setAppointmentsLoading] = useState(false);
  const [hiddenAppointmentsLoading, setHiddenAppointmentsLoading] = useState(false);
  const [showHiddenAppointments, setShowHiddenAppointments] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleContext, setScheduleContext] = useState<'general' | 'nurse_referral'>('general');
  const [appointmentTab, setAppointmentTab] = useState<'yours' | 'requested'>('yours');
  const [scheduleForm, setScheduleForm] = useState({
    motherId: "",
    scheduledTime: undefined as Date | undefined,
    appointmentType: "prenatal_checkup",
    notes: "",
    recurrence: "none",
    nurseUserId: undefined as number | undefined,
  });
  const [scheduleSubmitting, setScheduleSubmitting] = useState(false);
  const [showUltrasoundModal, setShowUltrasoundModal] = useState(false);
  const [ultrasoundForm, setUltrasoundForm] = useState({
    motherId: null as number | null,
    week_number: '',
    fetal_weight_grams: '',
    fetal_length_cm: '',
    heart_rate_bpm: '',
    notes: '',
    scan_date: new Date().toISOString().split('T')[0],
  });
  const [ultrasoundSubmitting, setUltrasoundSubmitting] = useState(false);
  // Live check-in feed
  const [recentCheckIns, setRecentCheckIns] = useState<CheckIn[]>([]);
  const [checkInsLoading, setCheckInsLoading] = useState(false);
  const [hiddenCheckIns, setHiddenCheckIns] = useState<CheckIn[]>([]);
  const [hiddenCheckInsLoading, setHiddenCheckInsLoading] = useState(false);
  const [showHiddenCheckIns, setShowHiddenCheckIns] = useState(false);
  const [checkInToEscalate, setCheckInToEscalate] = useState<CheckIn | null>(null);
  const [optimisticEscalatedCheckInIds, setOptimisticEscalatedCheckInIds] = useState<number[]>([]);
  const [showEscalateFromCheckinDialog, setShowEscalateFromCheckinDialog] = useState(false);
  // 15-min CRUD â€“ appointments
  const [editApptOpen, setEditApptOpen] = useState(false);
  const [editApptId, setEditApptId] = useState<number | null>(null);
  const [editApptForm, setEditApptForm] = useState({ scheduledTime: undefined as Date | undefined, notes: '', appointmentType: 'prenatal_checkup' });
  const [editApptSubmitting, setEditApptSubmitting] = useState(false);
  const [deleteApptConfirm, setDeleteApptConfirm] = useState<number | null>(null);
  const [deleteApptSubmitting, setDeleteApptSubmitting] = useState(false);
  // 15-min CRUD â€“ escalations
  const [editEscalOpen, setEditEscalOpen] = useState(false);
  const [editEscalId, setEditEscalId] = useState<number | null>(null);
  const [editEscalForm, setEditEscalForm] = useState({ description: '', priority: 'high', notes: '', issueType: '' });
  const [editEscalSubmitting, setEditEscalSubmitting] = useState(false);
  const [deleteEscalConfirm, setDeleteEscalConfirm] = useState<number | null>(null);
  const [deleteEscalSubmitting, setDeleteEscalSubmitting] = useState(false);
  // Deleted escalations (soft-delete recycle bin)
  const [hiddenEscalations, setHiddenEscalations] = useState<typeof mockEscalatedCases>([]);
  const [hiddenEscalationsLoading, setHiddenEscalationsLoading] = useState(false);
  const [showHiddenEscalations, setShowHiddenEscalations] = useState(false);
  const [showEscalatedCaseDetails, setShowEscalatedCaseDetails] = useState(false);
  const [selectedEscalatedCase, setSelectedEscalatedCase] = useState<(typeof mockEscalatedCases)[0] | null>(null);
  const [notifications, setNotifications] = useState<UserNotification[]>([]);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
  // Resources
  const [resources, setResources] = useState<Resource[]>([]);
  const [resourcesLoading, setResourcesLoading] = useState(true);
  const [resourcesError, setResourcesError] = useState<string | null>(null);
  const [motherUltrasoundHistory, setMotherUltrasoundHistory] = useState<UltrasoundRecord[]>([]);
  const [motherWeightHistory, setMotherWeightHistory] = useState<WeightLog[]>([]);
  const [motherClinicalLoading, setMotherClinicalLoading] = useState(false);
  const [motherClinicalError, setMotherClinicalError] = useState<string | null>(null);

  // Ref keeps the latest chwProfileId available inside the polling callback
  const chwProfileIdRef = useRef<number | null>(null);

  // Unified display list: backend-driven mother summary data.
  const displayMothers: MotherListItem[] = (realMothers ?? []).map(m => ({
    id: m.mother_id,
    user_id: m.user_id,
    name: m.name,
    phone_number: m.phone_number ?? "",
    status: m.checkin_status === "not_ok" ? "not_ok" : m.checkin_status === "ok" ? "ok" : "no_response",
    last_check_in: m.last_check_in_at ? new Date(m.last_check_in_at).toLocaleDateString() : "No check-in yet",
    last_check_in_at: m.last_check_in_at ?? null,
    weeks_pregnant: m.weeks_pregnant ?? 0,
    location: m.location ?? "Unknown",
    due_date: m.due_date ?? "",
    risk_level: (m.risk_level ?? "medium") as "low" | "medium" | "high",
    last_ultrasound_at: m.last_ultrasound_at ?? null,
    avatar: null as string | null,
    check_in_history: [] as { date: string; status: string }[],
    notes: undefined as string | undefined,
  }));

  // Filter mothers based on search and status
  const filteredMothers = displayMothers.filter(mother => {
    const matchesSearch = mother.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      mother.phone_number.includes(searchQuery);
    const matchesStatus = statusFilter === "all" || mother.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const mothersWithIssues = displayMothers.filter(m => m.status === 'not_ok' || m.status === 'no_response');

  // Returns true if a timestamp is within the 15-minute edit/delete window
  const isWithin15Min = (createdAt: string) =>
    (new Date().getTime() - new Date(createdAt).getTime()) < 15 * 60 * 1000;

  const getStatusColor = (status: string) => {    switch (status) {
      case 'ok': return 'bg-green-500 text-white';
      case 'not_ok': return 'bg-red-500 text-white';
      case 'no_response': return 'bg-amber-500 text-white';
      default: return 'bg-gray-400 text-white';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'ok': return 'Doing Well';
      case 'not_ok': return 'Needs Attention';
      case 'no_response': return 'No Response';
      default: return 'Unknown';
    }
  };

  const getRiskBadge = (risk: string) => {
    switch (risk) {
      case 'low': return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Low Risk</Badge>;
      case 'medium': return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">Medium Risk</Badge>;
      case 'high': return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">High Risk</Badge>;
    }
  };

  const getEscalationStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'in_progress': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'resolved': return 'bg-green-50 text-green-700 border-green-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  // Appointment filtering: separate by creator
  const sourceAppointments = showHiddenAppointments ? hiddenAppointments : appointments;

  const displayedCheckIns = showHiddenCheckIns ? hiddenCheckIns : recentCheckIns;

  const appointmentsScheduledByMe = sourceAppointments.filter(
    appt => appt.created_by_user_id === user?.id
  );
  
  const appointmentsRequestedByMother = sourceAppointments.filter(
    appt => appt.created_by_user_id !== user?.id
  );
  
  const displayedAppointments = showHiddenAppointments
    ? sourceAppointments
    : (appointmentTab === 'yours' ? appointmentsScheduledByMe : appointmentsRequestedByMother);

  // Helper: Check if a mother has an active/pending escalation.
  const hasActiveEscalation = (motherId: number): boolean => {
    if (!realEscalations) return false;
    return realEscalations.some(
      e => e.motherId === motherId && (e.status === 'pending' || e.status === 'in_progress')
    );
  };

  const hasActiveEscalationForCheckIn = (checkInId: number): boolean => {
    const fromServer = (realEscalations ?? []).some(
      e => e.checkInId === checkInId && (e.status === 'pending' || e.status === 'in_progress')
    );
    return fromServer || optimisticEscalatedCheckInIds.includes(checkInId);
  };

  // Helper: Check if a specific check-in has already been escalated.
  const isCheckInEscalated = (checkIn: CheckIn): boolean => {
    return hasActiveEscalationForCheckIn(checkIn.id);
  };

  const sortedUltrasound = useMemo(
    () => motherUltrasoundHistory
      .slice()
      .sort((a, b) => {
        const aTime = new Date(a.scan_date || a.created_at).getTime();
        const bTime = new Date(b.scan_date || b.created_at).getTime();
        return bTime - aTime;
      }),
    [motherUltrasoundHistory]
  );
  const sortedWeight = useMemo(
    () => motherWeightHistory
      .slice()
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
    [motherWeightHistory]
  );
  const latestUltrasound = sortedUltrasound[0];
  const previousUltrasound = sortedUltrasound[1];
  const latestWeight = sortedWeight[0];
  const previousWeight = sortedWeight[1];
  const weightDelta = latestWeight && previousWeight
    ? latestWeight.weight_kg - previousWeight.weight_kg
    : null;
  const ultrasoundStaleDays = latestUltrasound
    ? Math.floor((Date.now() - new Date(latestUltrasound.scan_date || latestUltrasound.created_at).getTime()) / (1000 * 60 * 60 * 24))
    : null;
  const weightStaleDays = latestWeight
    ? Math.floor((Date.now() - new Date(latestWeight.created_at).getTime()) / (1000 * 60 * 60 * 24))
    : null;
  const ultrasoundInsight = getUltrasoundInsight({ latest: latestUltrasound, staleDays: ultrasoundStaleDays });
  const weightInsight = getMaternalWeightInsight({ latest: latestWeight, previous: previousWeight, staleDays: weightStaleDays });
  const combinedInsight = combineInsights(ultrasoundInsight, weightInsight);
  const insightAlertClass = combinedInsight.status === "urgent"
    ? "border-red-300 bg-red-50"
    : combinedInsight.status === "watch"
      ? "border-amber-300 bg-amber-50"
      : "border-emerald-300 bg-emerald-50";

  const handleEscalation = async () => {
    if (!escalationForm.motherId || !escalationForm.issueType || !escalationForm.description) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields before escalating.",
        variant: "destructive",
      });
      return;
    }

    const selectedCheckInId = escalationForm.checkInId
      ? parseInt(escalationForm.checkInId)
      : (checkInToEscalate?.id ?? null);
    if (selectedCheckInId && hasActiveEscalationForCheckIn(selectedCheckInId)) {
      toast({
        title: "Already Escalated",
        description: "This check-in has already been escalated.",
      });
      return;
    }

    // If we have a real CHW profile, try to call the API
    if (chwProfileId) {
      const nurseId = escalationForm.nurseId
        ? parseInt(escalationForm.nurseId)
        : availableNurses[0]?.nurse_id;

      if (!nurseId) {
        toast({
          title: "No Nurse Available",
          description: "No nurse found in the system. Escalation saved locally only.",
          variant: "destructive",
        });
        // Still close and reset form
      } else {
        try {
          setEscalationSubmitting(true);
          const created = await escalationService.create({
            chw_id: chwProfileId,
            nurse_id: nurseId,
            mother_id: parseInt(escalationForm.motherId),
            checkin_id: selectedCheckInId ?? undefined,
            case_description: escalationForm.description,
            issue_type: escalationForm.issueType,
            priority: escalationForm.priority,
          });
          const effectiveCheckInId = created.checkin_id ?? selectedCheckInId;
          // Add to local real escalations list
          setRealEscalations((prev) => [
            {
              id: created.id,
              motherId: created.mother_id ?? 0,
              checkInId: effectiveCheckInId,
              motherName: created.mother_name,
              issue: created.case_description,
              issueType: created.issue_type ?? created.case_description,
              escalatedAt: created.created_at,
              status: created.status as "pending" | "in_progress" | "resolved" | "rejected",
              priority: created.priority as "low" | "medium" | "high" | "critical",
              notes: created.notes ?? "",
            },
            ...(prev ?? []),
          ] as typeof mockEscalatedCases);
          if (effectiveCheckInId) {
            setOptimisticEscalatedCheckInIds(prev => prev.includes(effectiveCheckInId) ? prev : [...prev, effectiveCheckInId]);
          }
          toast({
            title: "Case Escalated",
            description: `Case for ${created.mother_name} sent to nurse successfully.`,
          });
        } catch (err: unknown) {
          toast({
            title: "Escalation Failed",
            description: (err as Error).message || "Could not submit escalation. Please try again.",
            variant: "destructive",
          });
        } finally {
          setEscalationSubmitting(false);
        }
      }
    } else {
      // Offline/demo mode
      toast({
        title: "Case Escalated (Demo)",
        description: "The case has been escalated to the nurse supervisor.",
      });
    }

    setShowEscalationModal(false);
    setCheckInToEscalate(null);
    setEscalationForm({ motherId: "", checkInId: "", nurseId: "", issueType: "", description: "", priority: "high" });
  };

  const loadClinicalSnapshot = useCallback(async (motherId: number) => {
    setMotherClinicalLoading(true);
    setMotherClinicalError(null);
    try {
      const [ultrasound, weight] = await Promise.all([
        ultrasoundService.getMotherRecords(motherId),
        weightService.getMotherWeightLogs(motherId),
      ]);
      setMotherUltrasoundHistory(ultrasound);
      setMotherWeightHistory(weight);
    } catch (err: unknown) {
      setMotherUltrasoundHistory([]);
      setMotherWeightHistory([]);
      setMotherClinicalError((err as Error).message || "Unable to load clinical history.");
    } finally {
      setMotherClinicalLoading(false);
    }
  }, []);

  const handleMotherClick = (mother: MotherListItem) => {
    setSelectedMother(mother);
    setMotherUltrasoundHistory([]);
    setMotherWeightHistory([]);
    setMotherClinicalError(null);
    setShowMotherDetails(true);
    void loadClinicalSnapshot(mother.id);
  };

  const handleUltrasoundSubmit = async () => {
    if (!ultrasoundForm.motherId || !ultrasoundForm.week_number || !ultrasoundForm.scan_date) {
      toast({ title: "Validation Error", description: "Week number and scan date are required.", variant: "destructive" });
      return;
    }
    setUltrasoundSubmitting(true);
    try {
      await ultrasoundService.create(ultrasoundForm.motherId, {
        week_number: parseInt(ultrasoundForm.week_number),
        scan_date: ultrasoundForm.scan_date,
        fetal_weight_grams: ultrasoundForm.fetal_weight_grams ? parseFloat(ultrasoundForm.fetal_weight_grams) : undefined,
        fetal_length_cm: ultrasoundForm.fetal_length_cm ? parseFloat(ultrasoundForm.fetal_length_cm) : undefined,
        heart_rate_bpm: ultrasoundForm.heart_rate_bpm ? parseInt(ultrasoundForm.heart_rate_bpm) : undefined,
        notes: ultrasoundForm.notes.trim() || undefined,
      });
      if (selectedMother && ultrasoundForm.motherId === selectedMother.id) {
        void loadClinicalSnapshot(selectedMother.id);
      }
      await refreshData();
      toast({ title: "Ultrasound Recorded", description: "Successfully saved fetal measurements." });
      setShowUltrasoundModal(false);
      setUltrasoundForm({ motherId: null, week_number: '', fetal_weight_grams: '', fetal_length_cm: '', heart_rate_bpm: '', notes: '', scan_date: new Date().toISOString().split('T')[0] });
    } catch (e: any) {
      toast({ title: "Submission Failed", description: e.message || "Failed to save ultrasound data.", variant: "destructive" });
    } finally {
      setUltrasoundSubmitting(false);
    }
  };

  const handleScheduleAppointment = async () => {
    if (!scheduleForm.motherId || !scheduleForm.scheduledTime) {
      toast({
        title: "Missing Information",
        description: "Please select a mother and pick a date & time.",
        variant: "destructive",
      });
      return;
    }
    setScheduleSubmitting(true);
    try {
      const motherEntry = displayMothers.find(m => String(m.id) === scheduleForm.motherId);
      const motherUserId = motherEntry?.user_id ?? parseInt(scheduleForm.motherId, 10);
      const appt = await appointmentService.create({
        mother_id: motherUserId,
        health_worker_id: scheduleForm.nurseUserId || user!.id,
        scheduled_time: scheduleForm.scheduledTime.toISOString(),
        notes: scheduleForm.notes.trim() || undefined,
        recurrence_rule: scheduleContext === 'nurse_referral'
          ? undefined
          : (scheduleForm.recurrence !== "none" ? scheduleForm.recurrence : undefined),
      });
      setAppointments(prev => prev.some(a => a.id === appt.id) ? prev : [appt, ...prev]);
      toast({
        title: "Appointment Scheduled \u2713",
        description: `Visit for ${motherEntry?.name ?? "mother"} on ${new Date(appt.scheduled_time).toLocaleString()}.`,
      });
      setShowScheduleModal(false);
      setScheduleContext('general');
      setScheduleForm({ motherId: "", scheduledTime: undefined, appointmentType: "prenatal_checkup", notes: "", recurrence: "none", nurseUserId: undefined });
    } catch (err: unknown) {
      toast({
        title: "Scheduling Failed",
        description: (err as Error).message || "Could not schedule appointment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setScheduleSubmitting(false);
    }
  };

  const handleScheduleModalChange = (open: boolean) => {
    setShowScheduleModal(open);
    if (!open) {
      setScheduleContext('general');
    }
  };

  const loadHiddenAppointments = useCallback(async () => {
    if (!user) return;
    setHiddenAppointmentsLoading(true);
    try {
      const apptResp = await appointmentService.list({
        health_worker_id: user.id,
        include_deleted: true,
        deleted_only: true,
      });
      setHiddenAppointments(apptResp.appointments);
    } catch (err: unknown) {
      toast({
        title: 'Could not load deleted appointments',
        description: (err as Error).message || 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setHiddenAppointmentsLoading(false);
    }
  }, [user, toast]);

  const loadHiddenCheckIns = useCallback(async () => {
    if (!chwProfileIdRef.current) return;
    setHiddenCheckInsLoading(true);
    try {
      const resp = await checkinService.listForCHWWithDeleted(chwProfileIdRef.current, { deleted_only: true });
      setHiddenCheckIns(resp.checkins);
    } catch (err: unknown) {
      toast({ title: 'Could not load deleted check-ins', description: (err as Error).message, variant: 'destructive' });
    } finally {
      setHiddenCheckInsLoading(false);
    }
  }, [toast]);

  const loadHiddenEscalations = useCallback(async () => {
    if (!chwProfileIdRef.current) return;
    setHiddenEscalationsLoading(true);
    try {
      const resp = await escalationService.list({
        chw_id: chwProfileIdRef.current,
        deleted_only: true,
      });
      const mapped = resp.escalations.map((e) => ({
        id: e.id,
        motherId: e.mother_id ?? 0,
        checkInId: e.checkin_id,
        motherName: e.mother_name,
        issue: e.case_description,
        issueType: e.issue_type ?? e.case_description,
        escalatedAt: e.created_at,
        status: e.status as "pending" | "in_progress" | "resolved" | "rejected",
        priority: e.priority as "low" | "medium" | "high" | "critical",
        notes: e.notes ?? "",
      }));
      setHiddenEscalations(mapped as typeof mockEscalatedCases);
    } catch (err: unknown) {
      toast({ title: 'Could not load deleted escalations', description: (err as Error).message, variant: 'destructive' });
    } finally {
      setHiddenEscalationsLoading(false);
    }
  }, [toast]);

  const refreshNotifications = useCallback(async () => {
    if (!user) return;
    try {
      const resp = await notificationService.list(20, true);
      setNotifications(resp.notifications);
      setUnreadNotificationCount(resp.unread_count);
    } catch {
      // ignore notification fetch errors to avoid blocking dashboard
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

  /**
   * Fetch the volatile data that should be kept fresh:
   * check-ins, escalations, assigned mothers, and appointments.
   * Called once on mount (inside the setup useEffect) and on
   * WebSocket events (assignment/escalation changes).
   */
  const refreshData = useCallback(async () => {
    const profileId = chwProfileIdRef.current;
    if (!profileId || !user) return;

    // Check-ins
    try {
      const ciResp = await checkinService.listForCHW(profileId);
      setRecentCheckIns(ciResp.checkins);
    } catch { /* ignore */ }

    // Escalations
    try {
      const escalResp = await escalationService.list({ chw_id: profileId });
      const mapped = escalResp.escalations.map((e) => ({
        id: e.id,
        motherId: e.mother_id ?? 0,
        checkInId: e.checkin_id,
        motherName: e.mother_name,
        issue: e.case_description,
        issueType: e.issue_type ?? e.case_description,
        escalatedAt: e.created_at,
        status: e.status as "pending" | "in_progress" | "resolved" | "rejected",
        priority: e.priority as "low" | "medium" | "high" | "critical",
        notes: e.notes ?? "",
        nurseUserId: e.nurse_user_id,
      }));
      setRealEscalations(mapped as any);
    } catch { /* ignore */ }

    // Assigned mothers (summary payload #1)
    try {
      const mothersResp = await assignmentService.getMothersForCHW(profileId, 'active');
      let merged = mothersResp.mothers;

      // Latest ultrasound summaries (summary payload #2) to harden list values from DB
      try {
        const ultrasoundSummaries = await assignmentService.getLatestUltrasoundSummariesForCHW(profileId);
        const byMotherId = new Map(ultrasoundSummaries.summaries.map(s => [s.mother_id, s]));
        merged = mothersResp.mothers.map(m => {
          const summary = byMotherId.get(m.mother_id);
          if (!summary) return m;
          return {
            ...m,
            last_ultrasound_at: summary.last_ultrasound_at ?? m.last_ultrasound_at ?? null,
            weeks_pregnant: (m.weeks_pregnant && m.weeks_pregnant > 0)
              ? m.weeks_pregnant
              : (summary.last_ultrasound_week ?? m.weeks_pregnant ?? 0),
          };
        });
      } catch {
        // Keep base mothers payload when ultrasound summary endpoint fails.
      }

      setRealMothers(merged);
    } catch { /* ignore */ }

    // Appointments
    try {
      const apptResp = await appointmentService.getForHealthWorker(user.id);
      setAppointments(apptResp.appointments);
    } catch { /* ignore */ }
  }, [user]);

  const handleDeleteCheckInCard = useCallback(async (checkInId: number) => {
    try {
      await checkinService.softDelete(checkInId, 'deleted_by_chw_dashboard');
      setRecentCheckIns(prev => prev.filter(ci => ci.id !== checkInId));
      toast({
        title: 'Check-in Card Deleted',
        description: 'This check-in was removed from your dashboard feed.',
      });
    } catch (err: unknown) {
      toast({
        title: 'Delete Failed',
        description: (err as Error).message || 'Could not delete check-in card.',
        variant: 'destructive',
      });
    }
  }, [toast]);

  const handleRestoreCheckIn = useCallback(async (checkInId: number) => {
    try {
      await checkinService.restore(checkInId);
      setHiddenCheckIns(prev => prev.filter(ci => ci.id !== checkInId));
      await refreshData();
      setShowHiddenCheckIns(false);
      toast({ title: "Check-in Restored", description: "This card is back in your live feed." });
    } catch (err: unknown) {
      toast({ title: "Restore Failed", description: (err as Error).message, variant: "destructive" });
    }
  }, [refreshData, toast]);

  const handleRestoreEscalation = useCallback(async (id: number) => {
    try {
      await escalationService.restoreDeleted(id);
      setHiddenEscalations(prev => prev.filter(e => e.id !== id));
      await refreshData();
      setShowHiddenEscalations(false);
      toast({ title: "Escalation Restored", description: "This case is back in your active view." });
    } catch (err: unknown) {
      toast({ title: "Restore Failed", description: (err as Error).message, variant: "destructive" });
    }
  }, [refreshData, toast]);

  // WebSocket: real-time updates
  const { connected } = useSocketStatus();

  // Join the CHW-specific socket room once profile is known
  useEffect(() => {
    if (chwProfileId !== null) joinProfileRoom(chwProfileId);
  }, [chwProfileId]);

  useSocket<Appointment>('appointment:created', (appt) => {
    // Avoid duplicates: only add if not already present (by ID)
    setAppointments(prev => prev.some(a => a.id === appt.id) ? prev : [appt, ...prev]);
  }, { enabled: chwProfileId !== null });
  useSocket<Appointment>('appointment:updated', (appt) => setAppointments(prev => prev.map(a => a.id === appt.id ? appt : a)), { enabled: chwProfileId !== null });
  useSocket<{ id: number; user_id: number }>('appointment:deleted', ({ id, user_id }) => {
    if (user_id === user?.id) {
      setAppointments(prev => prev.filter(a => a.id !== id));
    }
  }, { enabled: chwProfileId !== null });
  useSocket<CheckIn>('checkin:new', async (ci) => {
    setRecentCheckIns(prev => prev.some(c => c.id === ci.id) ? prev : [ci, ...prev]);
    await refreshData();
  }, { enabled: chwProfileId !== null });
  useSocket<{ id: number; user_id: number }>('checkin:deleted', ({ id, user_id }) => {
    if (user_id === user?.id) {
      setRecentCheckIns(prev => prev.filter(ci => ci.id !== id));
    }
  }, { enabled: chwProfileId !== null });
  useSocket<{ id: number; user_id: number }>('checkin:restored', ({ id, user_id }) => {
    if (user_id === user?.id) {
      refreshData(); // Easiest way to get it back in the list
    }
  }, { enabled: chwProfileId !== null });

  // Escalation payloads use the raw API shape; trigger a full refresh instead of direct state patch
  useSocket('escalation:created', () => refreshData(), { enabled: chwProfileId !== null });
  useSocket('escalation:updated', () => refreshData(), { enabled: chwProfileId !== null });
  useSocket('escalation:deleted', () => refreshData(), { enabled: chwProfileId !== null });
  useSocket('ultrasound:created', () => refreshData(), { enabled: chwProfileId !== null });
  // Assignment events â€” refresh to pick up changes to assigned mothers list
  useSocket('assignment:created', () => refreshData(), { enabled: chwProfileId !== null });
  useSocket('assignment:status_changed', () => refreshData(), { enabled: chwProfileId !== null });
  useSocket('assignment:deleted', () => refreshData(), { enabled: chwProfileId !== null });
  // Reconnect sync: replace state wholesale with the server snapshot
  useSocket<{ appointments?: Appointment[] }>('sync', (data) => {
    if (data.appointments) setAppointments(data.appointments);
    // Escalations & assignments are fetched via refreshData for simplicity
    refreshData();
  }, { enabled: chwProfileId !== null });

  // Persisted notification inbox refresh events
  useSocket('notification:new', () => refreshNotifications(), { enabled: chwProfileId !== null });
  useSocket('escalation:created', () => refreshNotifications(), { enabled: chwProfileId !== null });
  useSocket('escalation:updated', () => refreshNotifications(), { enabled: chwProfileId !== null });
  useSocket('appointment:created', () => refreshNotifications(), { enabled: chwProfileId !== null });
  useSocket('appointment:updated', () => refreshNotifications(), { enabled: chwProfileId !== null });
  useSocket('assignment:created', () => refreshNotifications(), { enabled: chwProfileId !== null });
  useSocket('assignment:status_changed', () => refreshNotifications(), { enabled: chwProfileId !== null });
  useSocket('checkin:new', () => refreshNotifications(), { enabled: chwProfileId !== null });
  useSocket('ultrasound:created', () => refreshNotifications(), { enabled: chwProfileId !== null });

  // One-time setup: photo, CHW profile, nurses list, then initial data load
  useEffect(() => {
    let isMounted = true;
    (async () => {
      // Photo
      try {
        const meta = await getMyPhoto();
        if (meta && isMounted) setProfileImage(getPhotoFileUrl(meta.file_url));
      } catch { /* silently ignore */ }

      // CHW profile ID (needed for API calls)
      try {
        const profile = await chwService.getCurrentProfile();
        if (isMounted) {
          setChwProfileId(profile.id);
          chwProfileIdRef.current = profile.id;
        }
      } catch { /* profile unavailable */ }

      // Nurses list for escalation form
      try {
        const resp = await apiClient.get<{ nurses: { nurse_id: number; name: string }[] }>('/nurses');
        if (isMounted && resp.nurses?.length) setAvailableNurses(resp.nurses);
      } catch { /* keep empty */ }

      // Initial data load (shows loading spinners)
      if (isMounted) {
        setCheckInsLoading(true);
        setAppointmentsLoading(true);
      }
      await refreshData();
      await refreshNotifications();
      if (isMounted) {
        setCheckInsLoading(false);
        setAppointmentsLoading(false);
      }
    })();
    return () => { isMounted = false; };
  }, [refreshData, refreshNotifications]);

  // Fetch resources for CHW role
  useEffect(() => {
    const fetchResources = async () => {
      try {
        setResourcesLoading(true);
        setResourcesError(null);
        const data = await resourceService.list({ role: 'chw' });
        setResources(data);
      } catch (err) {
        setResourcesError(err instanceof Error ? err.message : 'Failed to load resources');
      } finally {
        setResourcesLoading(false);
      }
    };
    fetchResources();
  }, []);

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

  return (
    <TooltipProvider>
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Photo Upload Modal */}
      <Dialog open={showPhotoUpload} onOpenChange={setShowPhotoUpload}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center">Add Your Profile Photo</DialogTitle>
            <DialogDescription className="text-center">
              Personalize your profile with a photo so mothers and nurses can recognize you.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center space-y-4 py-6">
            <div className="relative">
              <Avatar className="h-32 w-32">
                <AvatarImage src={profileImage || undefined} />
                <AvatarFallback className="bg-primary text-primary-foreground text-4xl">
                  {user?.first_name?.charAt(0).toUpperCase() || "C"}
                </AvatarFallback>
              </Avatar>
              <label
                htmlFor="chw-photo-upload"
                className="absolute bottom-0 right-0 bg-primary text-primary-foreground p-2 rounded-full cursor-pointer hover:bg-primary/90 transition-colors"
              >
                <Camera className="h-5 w-5" />
              </label>
              <input
                id="chw-photo-upload"
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

      {/* Mother Details Dialog */}
      <Dialog open={showMotherDetails} onOpenChange={setShowMotherDetails}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedMother && (
            <>
              <DialogHeader>
                <div className="flex items-start gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={selectedMother.avatar} />
                    <AvatarFallback className="bg-primary text-primary-foreground text-xl">
                      {selectedMother.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <DialogTitle className="text-xl">{selectedMother.name}</DialogTitle>
                    <DialogDescription className="flex items-center gap-2 mt-1">
                      <MapPin className="h-4 w-4" />
                      {selectedMother.location}
                      <span>|</span>
                      <span>{selectedMother.phone_number}</span>
                    </DialogDescription>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge className={getStatusColor(selectedMother.status)}>
                        {getStatusText(selectedMother.status)}
                      </Badge>
                      {getRiskBadge(selectedMother.risk_level)}
                    </div>
                  </div>
                </div>
              </DialogHeader>

              <div className="space-y-6 py-4">
                {/* Pregnancy Info */}
                <div className="grid grid-cols-3 gap-4">
                  <Card className="bg-gradient-to-br from-pink-50 to-purple-50">
                    <CardContent className="p-4 text-center">
                      <Baby className="h-6 w-6 mx-auto mb-2 text-pink-500" />
                      <p className="text-2xl font-bold">{selectedMother.weeks_pregnant}</p>
                      <p className="text-xs text-muted-foreground">Weeks Pregnant</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-gradient-to-br from-blue-50 to-cyan-50">
                    <CardContent className="p-4 text-center">
                      <Calendar className="h-6 w-6 mx-auto mb-2 text-blue-500" />
                      <p className="text-lg font-bold">{new Date(selectedMother.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                      <p className="text-xs text-muted-foreground">Due Date</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-gradient-to-br from-green-50 to-emerald-50">
                    <CardContent className="p-4 text-center">
                      <CheckCircle className="h-6 w-6 mx-auto mb-2 text-green-500" />
                      <p className="text-lg font-bold">{selectedMother.last_check_in}</p>
                      <p className="text-xs text-muted-foreground">Last Check-in</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Notes */}
                {selectedMother.notes && (
                  <Card className="bg-amber-50 border-amber-200">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-amber-600" />
                        Notes
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-amber-800">{selectedMother.notes}</p>
                    </CardContent>
                  </Card>
                )}

                {/* Check-in History */}
                <div>
                  <h4 className="font-medium mb-3">Recent Check-in History</h4>
                  <div className="space-y-2">
                    {selectedMother.check_in_history.map((checkIn, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-3 rounded-lg bg-gray-50"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-3 h-3 rounded-full ${checkIn.status === 'ok' ? 'bg-green-500' : 'bg-red-500'
                            }`} />
                          <span className="text-sm">{new Date(checkIn.date).toLocaleDateString()}</span>
                        </div>
                        <Badge variant={checkIn.status === 'ok' ? 'default' : 'destructive'}>
                          {checkIn.status === 'ok' ? 'OK' : 'Not OK'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-3">Clinical Snapshot</h4>
                  {motherClinicalLoading ? (
                    <Card>
                      <CardContent className="p-4 text-sm text-muted-foreground">Loading clinical history...</CardContent>
                    </Card>
                  ) : motherClinicalError ? (
                    <Card className="border-red-200 bg-red-50">
                      <CardContent className="p-4 text-sm text-red-700">{motherClinicalError}</CardContent>
                    </Card>
                  ) : (
                    <div className="grid md:grid-cols-2 gap-4">
                      <Card className="bg-gradient-to-br from-blue-50 to-cyan-50">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm">Latest Ultrasound</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-1 text-sm">
                          {latestUltrasound ? (
                            <>
                              <p className="font-medium">
                                Week {latestUltrasound.week_number} • {new Date(latestUltrasound.scan_date || latestUltrasound.created_at).toLocaleDateString()}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Last updated: {new Date(latestUltrasound.created_at).toLocaleString()}
                              </p>
                              <p>Weight: {latestUltrasound.fetal_weight_grams ? `${latestUltrasound.fetal_weight_grams} g` : 'Not recorded'}</p>
                              <p>Length: {latestUltrasound.fetal_length_cm ? `${latestUltrasound.fetal_length_cm} cm` : 'Not recorded'}</p>
                              <p>Heart rate: {latestUltrasound.heart_rate_bpm ? `${latestUltrasound.heart_rate_bpm} bpm` : 'Not recorded'}</p>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <p className="text-[11px] text-muted-foreground cursor-help">What do these values mean?</p>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p className="max-w-[260px] text-xs">
                                    These are the most recent fetal scan values. Combine these with week number and trend direction to guide follow-up.
                                  </p>
                                </TooltipContent>
                              </Tooltip>
                              {previousUltrasound && (
                                <p className="text-xs text-muted-foreground">
                                  Prev: week {previousUltrasound.week_number} on {new Date(previousUltrasound.scan_date || previousUltrasound.created_at).toLocaleDateString()}
                                </p>
                              )}
                            </>
                          ) : (
                            <p className="text-muted-foreground">No ultrasound history yet. Consider recording a scan at the next scheduled follow-up.</p>
                          )}
                        </CardContent>
                      </Card>
                      <Card className="bg-gradient-to-br from-emerald-50 to-lime-50">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm">Maternal Weight</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-1 text-sm">
                          {latestWeight ? (
                            <>
                              <p className="font-medium">
                                {latestWeight.weight_kg.toFixed(1)} kg • {new Date(latestWeight.created_at).toLocaleDateString()}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Last updated: {new Date(latestWeight.created_at).toLocaleString()}
                              </p>
                              <p>
                                Trend: {weightDelta === null ? 'Need one more log' : `${weightDelta > 0 ? '+' : ''}${weightDelta.toFixed(1)} kg since previous`}
                              </p>
                              <p className="text-xs text-muted-foreground">Recent logs: {sortedWeight.slice(0, 3).map(l => `${l.weight_kg.toFixed(1)}kg`).join(' • ')}</p>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <p className="text-[11px] text-muted-foreground cursor-help">How to interpret trend?</p>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p className="max-w-[260px] text-xs">
                                    Trend compares the latest two maternal weight logs. Large or abrupt changes may need closer review.
                                  </p>
                                </TooltipContent>
                              </Tooltip>
                            </>
                          ) : (
                            <p className="text-muted-foreground">No weight history yet. Encourage weekly weight logging for stronger clinical follow-up.</p>
                          )}
                        </CardContent>
                      </Card>
                    </div>
                  )}
                  {!motherClinicalLoading && !motherClinicalError && (
                    <Alert className={`mt-3 ${insightAlertClass}`}>
                      <AlertDescription>
                        <span className="font-semibold capitalize">{combinedInsight.status}</span>
                        {" • "}
                        {combinedInsight.message}
                      </AlertDescription>
                    </Alert>
                  )}
                </div>

                {/* Quick Actions -> Replaced with Ultrasound for now */}
                <div className="flex gap-2">
                  <Button
                    className="w-full"
                    onClick={() => {
                      setUltrasoundForm({ ...ultrasoundForm, motherId: selectedMother.id });
                      setShowMotherDetails(false);
                      setShowUltrasoundModal(true);
                    }}
                  >
                    <Baby className="h-4 w-4 mr-2" />
                    Record Ultrasound
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Ultrasound Modal */}
      <Dialog open={showUltrasoundModal} onOpenChange={setShowUltrasoundModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Ultrasound Scan</DialogTitle>
            <DialogDescription>Enter fetal measurements for the current week.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Week Number *</label>
                <Input type="number" min="1" max="42" placeholder="e.g. 20" value={ultrasoundForm.week_number} onChange={(e) => setUltrasoundForm(f => ({ ...f, week_number: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Scan Date *</label>
                <Input type="date" value={ultrasoundForm.scan_date} onChange={(e) => setUltrasoundForm(f => ({ ...f, scan_date: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Est. Weight (g)</label>
                <Input type="number" placeholder="e.g. 300" value={ultrasoundForm.fetal_weight_grams} onChange={(e) => setUltrasoundForm(f => ({ ...f, fetal_weight_grams: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Est. Length (cm)</label>
                <Input type="number" step="0.1" placeholder="e.g. 15.2" value={ultrasoundForm.fetal_length_cm} onChange={(e) => setUltrasoundForm(f => ({ ...f, fetal_length_cm: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Heart Rate (bpm)</label>
              <Input type="number" placeholder="e.g. 140" value={ultrasoundForm.heart_rate_bpm} onChange={(e) => setUltrasoundForm(f => ({ ...f, heart_rate_bpm: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Notes</label>
              <Textarea placeholder="Any clinical notes..." value={ultrasoundForm.notes} onChange={(e) => setUltrasoundForm(f => ({ ...f, notes: e.target.value }))} />
            </div>
            <Button className="w-full" onClick={handleUltrasoundSubmit} disabled={ultrasoundSubmitting || !ultrasoundForm.week_number || !ultrasoundForm.scan_date}>
              {ultrasoundSubmitting ? "Saving..." : "Save Record"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Escalation Modal */}
      <Dialog open={showEscalationModal} onOpenChange={setShowEscalationModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Escalate Case to Nurse</DialogTitle>
            <DialogDescription>
              Report a critical issue that requires nurse supervision
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Select Mother</label>
              <Select
                value={escalationForm.motherId}
                onValueChange={(value) => setEscalationForm({ ...escalationForm, motherId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose a mother" />
                </SelectTrigger>
                <SelectContent>
                  {/* Always show all assigned mothers */}
                  {displayMothers.map(mother => (
                    <SelectItem key={mother.id} value={String(mother.id)}>
                      {mother.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {availableNurses.length > 0 && (
              <div>
                <label className="text-sm font-medium mb-2 block">Assign to Nurse</label>
                <Select
                  value={escalationForm.nurseId}
                  onValueChange={(value) => setEscalationForm({ ...escalationForm, nurseId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={availableNurses[0]?.name ?? "Select nurse"} />
                  </SelectTrigger>
                  <SelectContent>
                    {availableNurses.map(n => (
                      <SelectItem key={n.nurse_id} value={String(n.nurse_id)}>
                        {n.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div>
              <label className="text-sm font-medium mb-2 block">Issue Type</label>
              <Select
                value={escalationForm.issueType}
                onValueChange={(value) => setEscalationForm({ ...escalationForm, issueType: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select issue type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bleeding">Bleeding</SelectItem>
                  <SelectItem value="preeclampsia">Possible Preeclampsia</SelectItem>
                  <SelectItem value="infection">Infection Signs</SelectItem>
                  <SelectItem value="mental_health">Mental Health Concerns</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Priority</label>
              <Select
                value={escalationForm.priority}
                onValueChange={(value) => setEscalationForm({ ...escalationForm, priority: value as typeof escalationForm.priority })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Priority level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Description</label>
              <Textarea
                value={escalationForm.description}
                onChange={(e) => setEscalationForm({ ...escalationForm, description: e.target.value })}
                placeholder="Describe the issue in detail..."
                rows={4}
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={handleEscalation}
              className="flex-1"
              disabled={escalationSubmitting || (escalationForm.checkInId
                ? hasActiveEscalationForCheckIn(parseInt(escalationForm.checkInId))
                : (escalationForm.motherId ? hasActiveEscalation(parseInt(escalationForm.motherId)) : false))}
            >
              {escalationSubmitting ? (
                <><Activity className="h-4 w-4 mr-2 animate-spin" />Submitting...</>
              ) : (escalationForm.checkInId
                ? hasActiveEscalationForCheckIn(parseInt(escalationForm.checkInId))
                : hasActiveEscalation(escalationForm.motherId ? parseInt(escalationForm.motherId) : 0)) ? (
                <><CheckCircle className="h-4 w-4 mr-2" />Already Escalated</>
              ) : (
                <><Upload className="h-4 w-4 mr-2" />Escalate Case</>
              )}
            </Button>
            <Button variant="outline" onClick={() => setShowEscalationModal(false)} disabled={escalationSubmitting}>
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Schedule Appointment Modal */}
      <Dialog open={showScheduleModal} onOpenChange={handleScheduleModalChange}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarCheck className="h-5 w-5 text-blue-600" />
              {scheduleContext === 'nurse_referral' ? 'Book Nurse Appointment' : 'Schedule a Home Visit'}
            </DialogTitle>
            <DialogDescription>
              {scheduleContext === 'nurse_referral'
                ? 'Book an appointment with a nurse for this escalated case.'
                : 'Book an appointment or home visit for one of your assigned mothers.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-sm font-medium mb-2 block">Mother <span className="text-red-500">*</span></label>
              <Select
                value={scheduleForm.motherId}
                onValueChange={(v) => setScheduleForm({ ...scheduleForm, motherId: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select mother" />
                </SelectTrigger>
                <SelectContent>
                  {displayMothers.map(m => (
                    <SelectItem key={m.id} value={String(m.id)}>{m.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Date & Time <span className="text-red-500">*</span></label>
              <DateTimePicker
                date={scheduleForm.scheduledTime}
                setDate={(date) => setScheduleForm({ ...scheduleForm, scheduledTime: date })}
              />
            </div>

            {scheduleContext === 'general' && (
              <div>
                <label className="text-sm font-medium mb-2 block">Recurrence</label>
                <Select
                  value={scheduleForm.recurrence}
                  onValueChange={(v) => setScheduleForm({ ...scheduleForm, recurrence: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Recurrence" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Recurrence</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="biweekly">Bi-weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div>
              <label className="text-sm font-medium mb-2 block">Notes</label>
              <Textarea
                value={scheduleForm.notes}
                onChange={(e) => setScheduleForm({ ...scheduleForm, notes: e.target.value })}
                placeholder="Any notes for this visit (e.g., bring antenatal card)..."
                rows={3}
              />
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <Button
              onClick={handleScheduleAppointment}
              className="flex-1"
              disabled={scheduleSubmitting}
            >
              {scheduleSubmitting ? (
                <><Activity className="h-4 w-4 mr-2 animate-spin" />Scheduling...</>
              ) : (
                <><CalendarCheck className="h-4 w-4 mr-2" />{scheduleContext === 'nurse_referral' ? 'Book Nurse Appointment' : 'Schedule Visit'}</>
              )}
            </Button>
            <Button variant="outline" onClick={() => handleScheduleModalChange(false)} disabled={scheduleSubmitting}>
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Escalate from Check-in Confirmation Dialog */}
      <Dialog open={showEscalateFromCheckinDialog} onOpenChange={setShowEscalateFromCheckinDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              Confirm Escalation
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to escalate{' '}
              <strong>{checkInToEscalate?.mother_name ?? `Mother #${checkInToEscalate?.mother_id}`}</strong>'s
              check-in?
              {checkInToEscalate?.comment && (
                <span className="block mt-1 italic text-gray-600">"{checkInToEscalate.comment}"</span>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 pt-2">
            <Button
              variant="destructive"
              className="flex-1"
              onClick={() => {
                setShowEscalateFromCheckinDialog(false);
                if (checkInToEscalate) {
                  // Pre-fill and open escalation modal
                  setEscalationForm(prev => ({
                    ...prev,
                    motherId: String(checkInToEscalate.mother_id),
                    checkInId: String(checkInToEscalate.id),
                    description: checkInToEscalate.comment
                      ? `Check-in concern: ${checkInToEscalate.comment}`
                      : `Mother reported feeling ${checkInToEscalate.response === 'not_ok' ? 'unwell' : 'concern raised by CHW'} on ${new Date(checkInToEscalate.created_at).toLocaleDateString()}`,
                    issueType: 'other',
                    priority: checkInToEscalate.response === 'not_ok' ? 'high' : 'medium',
                  }));
                  setShowEscalationModal(true);
                }
              }}
            >
              <AlertTriangle className="h-4 w-4 mr-2" />
              Yes, Escalate
            </Button>
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setShowEscalateFromCheckinDialog(false)}
            >
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* â”€â”€ Edit Appointment Dialog (15-min window) â”€â”€ */}
      <Dialog open={editApptOpen} onOpenChange={setEditApptOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Appointment</DialogTitle>
            <DialogDescription>You can edit this appointment within the 15-minute window.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium">Date & Time</label>
              <DateTimePicker
                date={editApptForm.scheduledTime}
                setDate={(date) => setEditApptForm(p => ({ ...p, scheduledTime: date }))}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Appointment Type</label>
              <Select value={editApptForm.appointmentType} onValueChange={v => setEditApptForm(p => ({ ...p, appointmentType: v }))}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="prenatal_checkup">Prenatal Checkup</SelectItem>
                  <SelectItem value="home_visit">Home Visit</SelectItem>
                  <SelectItem value="postnatal">Postnatal</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Notes</label>
              <Textarea
                value={editApptForm.notes}
                onChange={e => setEditApptForm(p => ({ ...p, notes: e.target.value }))}
                rows={3}
                className="mt-1 resize-none"
              />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <Button
              className="flex-1"
              disabled={editApptSubmitting}
              onClick={async () => {
                if (!editApptId) return;
                setEditApptSubmitting(true);
                try {
                  const updated = await appointmentService.update(editApptId, {
                    scheduled_time: editApptForm.scheduledTime ? editApptForm.scheduledTime.toISOString() : undefined,
                    notes: editApptForm.notes || undefined,
                    appointment_type: editApptForm.appointmentType || undefined,
                  });
                  setAppointments(prev => prev.map(a => a.id === editApptId ? updated : a));
                  setEditApptOpen(false);
                  toast({ title: "Appointment Updated", description: "Changes saved successfully." });
                } catch (err: unknown) {
                  toast({ title: "Error", description: (err as Error).message, variant: "destructive" });
                } finally {
                  setEditApptSubmitting(false);
                }
              }}
            >
              {editApptSubmitting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving...</> : "Save Changes"}
            </Button>
            <Button variant="outline" className="flex-1" onClick={() => setEditApptOpen(false)} disabled={editApptSubmitting}>Cancel</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* â”€â”€ Delete Appointment Confirmation â”€â”€ */}
      <Dialog open={deleteApptConfirm !== null} onOpenChange={(o) => { if (!o) setDeleteApptConfirm(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />Remove Appointment From Your Dashboard?
            </DialogTitle>
            <DialogDescription>You can restore this within 15 days from the Recently Deleted section.</DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 pt-2">
            <Button
              variant="destructive"
              className="flex-1"
              disabled={deleteApptSubmitting}
              onClick={async () => {
                if (!deleteApptConfirm) return;
                setDeleteApptSubmitting(true);
                try {
                  await appointmentService.softDelete(deleteApptConfirm, 'deleted_by_chw_dashboard');
                  setAppointments(prev => prev.filter(a => a.id !== deleteApptConfirm));
                  setDeleteApptConfirm(null);
                  toast({ title: "Appointment Deleted" });
                } catch (err: unknown) {
                  toast({ title: "Error", description: (err as Error).message, variant: "destructive" });
                } finally {
                  setDeleteApptSubmitting(false);
                }
              }}
            >
              {deleteApptSubmitting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving...</> : "Yes, Delete"}
            </Button>
            <Button variant="outline" className="flex-1" onClick={() => setDeleteApptConfirm(null)} disabled={deleteApptSubmitting}>Cancel</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* -- Delete Escalation Confirmation -- */}
      <Dialog open={deleteEscalConfirm !== null} onOpenChange={(o) => { if (!o) setDeleteEscalConfirm(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />Delete Escalation?
            </DialogTitle>
            <DialogDescription>This will permanently remove the escalation and cannot be undone.</DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 pt-2">
            <Button
              variant="destructive"
              className="flex-1"
              disabled={deleteEscalSubmitting}
              onClick={async () => {
                if (!deleteEscalConfirm) return;
                setDeleteEscalSubmitting(true);
                try {
                  await escalationService.delete(deleteEscalConfirm);
                  setRealEscalations(prev => prev ? prev.filter(e => e.id !== deleteEscalConfirm) : prev);
                  setDeleteEscalConfirm(null);
                  toast({ title: "Escalation Deleted" });
                } catch (err: unknown) {
                  toast({ title: "Error", description: (err as Error).message, variant: "destructive" });
                } finally {
                  setDeleteEscalSubmitting(false);
                }
              }}
            >
              {deleteEscalSubmitting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Deleting...</> : 'Yes, Delete'}
            </Button>
            <Button variant="outline" className="flex-1" onClick={() => setDeleteEscalConfirm(null)} disabled={deleteEscalSubmitting}>Cancel</Button>
          </div>
        </DialogContent>
      </Dialog>


      {/* â”€â”€ Edit Escalation Dialog (15-min window) â”€â”€ */}
      <Dialog open={editEscalOpen} onOpenChange={setEditEscalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Escalation</DialogTitle>
            <DialogDescription>You can edit this escalation within the 15-minute window.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium">Issue Type</label>
              <Input
                value={editEscalForm.issueType}
                onChange={e => setEditEscalForm(p => ({ ...p, issueType: e.target.value }))}
                className="mt-1"
                placeholder="e.g. bleeding, high blood pressure"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Priority</label>
              <Select value={editEscalForm.priority} onValueChange={v => setEditEscalForm(p => ({ ...p, priority: v }))}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Description</label>
              <Textarea
                value={editEscalForm.description}
                onChange={e => setEditEscalForm(p => ({ ...p, description: e.target.value }))}
                rows={3}
                className="mt-1 resize-none"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Additional Notes</label>
              <Textarea
                value={editEscalForm.notes}
                onChange={e => setEditEscalForm(p => ({ ...p, notes: e.target.value }))}
                rows={2}
                className="mt-1 resize-none"
              />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <Button
              className="flex-1"
              disabled={editEscalSubmitting}
              onClick={async () => {
                if (!editEscalId) return;
                setEditEscalSubmitting(true);
                try {
                  const updated = await escalationService.update(editEscalId, {
                    issue_type: editEscalForm.issueType || undefined,
                    priority: editEscalForm.priority as 'low' | 'medium' | 'high' | 'critical',
                    case_description: editEscalForm.description || undefined,
                    notes: editEscalForm.notes || undefined,
                  });
                  setRealEscalations(prev => prev ? prev.map(e => e.id === editEscalId ? {
                    ...e,
                    issueType: updated.issue_type ?? e.issueType,
                    priority: updated.priority as typeof e.priority,
                    issue: updated.case_description ?? e.issue,
                    notes: updated.notes ?? '',
                  } : e) : prev);
                  setEditEscalOpen(false);
                  toast({ title: "Escalation Updated", description: "Changes saved successfully." });
                } catch (err: unknown) {
                  toast({ title: "Error", description: (err as Error).message, variant: "destructive" });
                } finally {
                  setEditEscalSubmitting(false);
                }
              }}
            >
              {editEscalSubmitting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving...</> : "Save Changes"}
            </Button>
            <Button variant="outline" className="flex-1" onClick={() => setEditEscalOpen(false)} disabled={editEscalSubmitting}>Cancel</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* â”€â”€ Delete Escalation Confirmation â”€â”€ */}
      <Dialog open={deleteEscalConfirm !== null} onOpenChange={(o) => { if (!o) setDeleteEscalConfirm(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />Delete Escalation?
            </DialogTitle>
            <DialogDescription>This will permanently remove the escalation and cannot be undone.</DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 pt-2">
            <Button
              variant="destructive"
              className="flex-1"
              disabled={deleteEscalSubmitting}
              onClick={async () => {
                if (!deleteEscalConfirm) return;
                setDeleteEscalSubmitting(true);
                try {
                  await escalationService.delete(deleteEscalConfirm);
                  setRealEscalations(prev => prev ? prev.filter(e => e.id !== deleteEscalConfirm) : prev);
                  setDeleteEscalConfirm(null);
                  toast({ title: "Escalation Deleted" });
                } catch (err: unknown) {
                  toast({ title: "Error", description: (err as Error).message, variant: "destructive" });
                } finally {
                  setDeleteEscalSubmitting(false);
                }
              }}
            >
              {deleteEscalSubmitting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Deleting...</> : 'Yes, Delete'}
            </Button>
            <Button variant="outline" className="flex-1" onClick={() => setDeleteEscalConfirm(null)} disabled={deleteEscalSubmitting}>Cancel</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Escalated Case Details Dialog */}
      <Dialog open={showEscalatedCaseDetails} onOpenChange={setShowEscalatedCaseDetails}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedEscalatedCase && (
            <>
              <DialogHeader>
                <DialogTitle className="text-xl">Case Details</DialogTitle>
                <DialogDescription>
                  Escalated on {new Date(selectedEscalatedCase.escalatedAt).toLocaleString()}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-2">
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <CardTitle className="text-lg">{selectedEscalatedCase.motherName}</CardTitle>
                        <CardDescription>Issue: {selectedEscalatedCase.issueType}</CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={getEscalationStatusBadgeClass(selectedEscalatedCase.status)}>
                          {selectedEscalatedCase.status.replace('_', ' ')}
                        </Badge>
                        <Badge variant="destructive">{selectedEscalatedCase.priority} priority</Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm text-muted-foreground">
                    <p><span className="font-medium text-foreground">Summary:</span> {selectedEscalatedCase.issue}</p>
                    <p><span className="font-medium text-foreground">Notes:</span> {selectedEscalatedCase.notes || "No extra notes provided."}</p>
                  </CardContent>
                </Card>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      const motherEntry = displayMothers.find(m => m.name === selectedEscalatedCase.motherName);
                      const mId = motherEntry ? String(motherEntry.id) : "";
                      setScheduleForm({
                        motherId: mId,
                        scheduledTime: undefined,
                        appointmentType: "consultation",
                        recurrence: "none",
                        notes: `Regarding Escalation: ${selectedEscalatedCase.issueType} - ${selectedEscalatedCase.notes}`,
                        nurseUserId: (selectedEscalatedCase as any).nurseUserId,
                      });
                      setScheduleContext('nurse_referral');
                      setShowEscalatedCaseDetails(false);
                      setShowScheduleModal(true);
                    }}
                  >
                    <CalendarCheck className="h-4 w-4 mr-2" />
                    Book with Nurse
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Header */}
      <ConnectionBanner />
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b">
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
              <div className="bg-primary p-2 rounded-xl">
                <Users className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-lg text-primary">
                  RemyAfya
                </h1>
                <p className="text-xs text-muted-foreground">CHW Dashboard</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Notifications */}
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
                      className={`flex flex-col items-start p-3 ${!notification.is_read ? 'bg-blue-50' : ''}`}
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
                fallbackText={user?.first_name?.charAt(0).toUpperCase() || "C"}
                onProfile={() => navigate("/dashboard/chw/profile")}
                onSettings={() => navigate("/dashboard/chw/settings")}
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
          <h2 className="text-3xl font-bold text-foreground">
            Hello <span className="capitalize">{user?.first_name?.toLowerCase() || 'CHW'}</span>
          </h2>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-primary text-primary-foreground border-0">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/80 text-sm">Total Mothers</p>
                  <p className="text-3xl font-bold">{displayMothers.length}</p>
                </div>
                <div className="h-10 w-10 rounded-xl bg-white/20 flex items-center justify-center">
                  <Users className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="flex items-center gap-1 mt-2 text-sm">
                <ArrowUpRight className="h-4 w-4 text-green-300" />
                <span className="text-green-300">+{weeklyStats.registrationChange}</span>
                <span className="text-white/75">this week</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-primary text-primary-foreground border-0">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/80 text-sm">Doing Well</p>
                  <p className="text-3xl font-bold">{displayMothers.filter(m => m.status === 'ok').length}</p>
                </div>
                <div className="h-10 w-10 rounded-xl bg-green-500/25 flex items-center justify-center">
                  <CheckCircle className="h-6 w-6 text-green-100" />
                </div>
              </div>
              <div className="flex items-center gap-1 mt-2 text-sm">
                <ArrowUpRight className="h-4 w-4 text-green-300" />
                <span className="text-green-300">+{weeklyStats.checkInChange}</span>
                <span className="text-white/75">check-ins</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-primary text-primary-foreground border-0">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/80 text-sm">Need Attention</p>
                  <p className="text-3xl font-bold">{mothersWithIssues.length}</p>
                </div>
                <div className="h-10 w-10 rounded-xl bg-red-500/25 flex items-center justify-center">
                  <AlertTriangle className="h-6 w-6 text-red-100" />
                </div>
              </div>
              <div className="flex items-center gap-1 mt-2 text-sm">
                <ArrowDownRight className="h-4 w-4 text-green-300" />
                <span className="text-green-300">{weeklyStats.issuesChange}</span>
                <span className="text-white/75">from last week</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-primary text-primary-foreground border-0">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/80 text-sm">Escalated</p>
                  <p className="text-3xl font-bold">{(realEscalations ?? []).length}</p>
                </div>
                <div className="h-10 w-10 rounded-xl bg-amber-500/25 flex items-center justify-center">
                  <Upload className="h-6 w-6 text-amber-100" />
                </div>
              </div>
              <div className="flex items-center gap-1 mt-2 text-sm">
                <span className="text-white/75">Pending review</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid grid-cols-4 w-full">
            <TabsTrigger value="mothers">My Mothers</TabsTrigger>
            <TabsTrigger value="appointments">Appointments</TabsTrigger>
            <TabsTrigger value="cases">Escalated Cases</TabsTrigger>
            <TabsTrigger value="resources">Resources</TabsTrigger>
          </TabsList>

          {/* Mothers Tab */}
          <TabsContent value="mothers" className="space-y-4">
            {/* Search and Filter */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search mothers by name or phone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="ok">Doing Well</SelectItem>
                  <SelectItem value="not_ok">Needs Attention</SelectItem>
                  <SelectItem value="no_response">No Response</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="destructive"
                onClick={() => {
                  setCheckInToEscalate(null);
                  setEscalationForm(prev => ({ ...prev, checkInId: "" }));
                  setShowEscalationModal(true);
                }}
              >
                <Upload className="h-4 w-4 mr-2" />
                Escalate Case
              </Button>
            </div>

            {/* Mothers List (default scalable view) */}
            <Card>
              <CardContent className="p-0">
                <div className="hidden md:grid grid-cols-12 gap-4 px-4 py-3 text-xs font-semibold text-muted-foreground border-b">
                  <div className="col-span-3">Mother</div>
                  <div className="col-span-1 text-center">Weeks</div>
                  <div className="col-span-3">Last Check-in</div>
                  <div className="col-span-2">Last Ultrasound</div>
                  <div className="col-span-3 text-right">Actions</div>
                </div>
                {filteredMothers.map((mother) => (
                  <div
                    key={mother.id}
                    className="grid grid-cols-1 md:grid-cols-12 gap-4 px-4 py-4 border-b last:border-b-0 hover:bg-slate-50 cursor-pointer items-center"
                    onClick={() => handleMotherClick(mother)}
                  >
                    <div className="md:col-span-3 flex items-center gap-3 min-w-0">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={mother.avatar ?? undefined} />
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          {mother.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="font-medium truncate">{mother.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{mother.phone_number}</p>
                      </div>
                    </div>
                    <div className="md:col-span-1 text-sm flex items-center justify-center gap-1.5 text-muted-foreground">
                      <Baby className="h-3.5 w-3.5" />
                      {mother.weeks_pregnant}
                    </div>
                    <div className="md:col-span-3 flex items-center flex-wrap gap-2">
                      <Badge className={`${getStatusColor(mother.status)} text-xs whitespace-nowrap`}>{getStatusText(mother.status)}</Badge>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">{mother.last_check_in}</span>
                    </div>
                    <div className="md:col-span-2 text-xs text-muted-foreground flex items-center">
                      {mother.last_ultrasound_at ? new Date(mother.last_ultrasound_at).toLocaleDateString() : "No scan yet"}
                    </div>
                    <div className="md:col-span-3 flex items-center justify-end gap-3 flex-wrap">
                      {getRiskBadge(mother.risk_level)}
                      <Button
                        size="sm"
                        className="text-xs"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (mother.last_ultrasound_at) {
                            const hoursSinceLast = (Date.now() - new Date(mother.last_ultrasound_at).getTime()) / (1000 * 60 * 60);
                            if (hoursSinceLast < 24) {
                              const ok = window.confirm("An ultrasound was recorded in the last 24 hours. Record another now?");
                              if (!ok) return;
                            }
                          }
                          setUltrasoundForm({
                            ...ultrasoundForm,
                            motherId: mother.id,
                          });
                          setShowUltrasoundModal(true);
                        }}
                      >
                        <Baby className="h-3 w-3 mr-1" />
                        {mother.last_ultrasound_at ? "Record Again" : "Record Ultrasound"}
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {filteredMothers.length === 0 && (
              <Card className="p-8 text-center">
                <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-medium mb-2">No mothers found</h3>
                <p className="text-muted-foreground">Try adjusting your search or filter criteria</p>
              </Card>
            )}

            {/* Live Check-in Feed */}
            <div className="mt-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                <h3 className="font-semibold text-lg">Live Check-in Feed</h3>
                {checkInsLoading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                {displayedCheckIns.length > 0 && (
                  <Badge variant="outline" className="ml-auto">{displayedCheckIns.length} recent</Badge>
                )}
                 <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="ml-auto">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => {
                      setShowHiddenCheckIns(true);
                      loadHiddenCheckIns();
                    }}>
                      <Trash2 className="h-4 w-4 mr-2" />
                      View Deleted Check-ins
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              {checkInsLoading || hiddenCheckInsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground mr-2" />
                  <span className="text-muted-foreground">
                    {hiddenCheckInsLoading ? 'Loading deleted check-ins...' : 'Loading check-ins...'}
                  </span>
                </div>
              ) : displayedCheckIns.length === 0 ? (
                <Card className="border-dashed border-2 border-gray-200 bg-gray-50/50">
                  <CardContent className="p-6 text-center">
                    <Heart className="h-10 w-10 mx-auto mb-3 text-gray-300" />
                    <p className="text-muted-foreground text-sm">
                      {showHiddenCheckIns
                        ? "No recently deleted check-ins."
                        : "No check-ins yet from assigned mothers."}
                    </p>
                    {showHiddenCheckIns && (
                      <Button variant="link" onClick={() => setShowHiddenCheckIns(false)}>
                        Back to live feed
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {showHiddenCheckIns && (
                    <div className="flex items-center justify-between pb-2">
                       <h3 className="text-lg font-semibold">Recently Deleted Check-ins</h3>
                       <Button variant="outline" size="sm" onClick={() => setShowHiddenCheckIns(false)}>
                         <ArrowLeft className="h-4 w-4 mr-2" />
                         Back to Live Feed
                       </Button>
                     </div>
                  )}
                  {displayedCheckIns.map((ci) => (
                    <Card key={ci.id} className={`border-l-4 ${
                      showHiddenCheckIns ? 'border-l-gray-400 bg-gray-50/50' :
                      ci.response === 'ok' ? 'border-l-green-500 bg-green-50/30' : 'border-l-red-500 bg-red-50/30'
                    }`}>
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback className={`text-white text-sm font-semibold ${
                              showHiddenCheckIns ? 'bg-gray-400' :
                              ci.response === 'ok' ? 'bg-green-500' : 'bg-red-500'
                            }`}>
                              {(ci.mother_name ?? 'M').charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-medium text-sm">{ci.mother_name ?? `Mother #${ci.mother_id}`}</p>
                              {!showHiddenCheckIns && (
                                <Badge className={ci.response === 'ok'
                                  ? 'bg-green-500 text-white text-xs'
                                  : 'bg-red-500 text-white text-xs'
                                }>
                                  {ci.response === 'ok' ? 'Feeling Good' : 'Not Well'}
                                </Badge>
                              )}
                              <span className="text-xs text-muted-foreground ml-auto">
                                {new Date(ci.created_at).toLocaleString()}
                              </span>
                            </div>
                            {ci.comment && (
                              <p className="text-sm text-gray-600 mt-1 italic">"{ci.comment}"</p>
                            )}
                            {ci.symptoms && ci.symptoms.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {ci.symptoms.map((sym, i) => (
                                  <Badge key={i} variant="outline" className="text-red-600 bg-red-50 border-red-200 text-[10px] px-1 py-0">
                                    {sym}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex justify-end gap-2 mt-3">
                          {showHiddenCheckIns ? (
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-xs"
                              onClick={() => handleRestoreCheckIn(ci.id)}
                            >
                              Restore
                            </Button>
                          ) : isCheckInEscalated(ci) ? (
                            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-300 flex items-center gap-1">
                              <CheckCircle className="h-3 w-3" />
                              Escalated
                            </Badge>
                          ) : (
                            <Button
                              size="sm"
                              variant="destructive"
                              className="text-xs"
                              onClick={() => {
                                setCheckInToEscalate(ci);
                                setShowEscalateFromCheckinDialog(true);
                              }}
                            >
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              Escalate
                            </Button>
                          )}
                          {!showHiddenCheckIns && (
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 text-red-600 hover:bg-red-50 hover:text-red-700"
                              onClick={() => handleDeleteCheckInCard(ci.id)}
                              aria-label="Delete check-in card from dashboard"
                              title="Delete card from dashboard"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          {/* Appointments Tab */}
          <TabsContent value="appointments" className="space-y-4">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-semibold text-lg">{showHiddenAppointments ? 'Recently Deleted Appointments' : 'Scheduled Appointments'}</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {(showHiddenAppointments ? hiddenAppointments : displayedAppointments).length > 0
                    ? `${displayedAppointments.filter(a => a.status === 'scheduled').length} upcoming visit(s)`
                    : (showHiddenAppointments ? 'No deleted appointments in the last 15 days' : 'No visits scheduled yet')}
                </p>
              </div>
              {showHiddenAppointments ? (
                <Button variant="outline" onClick={() => setShowHiddenAppointments(false)}>
                  Back To Active Appointments
                </Button>
              ) : (
                <Button
                  onClick={() => {
                    setScheduleContext('general');
                    setShowScheduleModal(true);
                  }}
                >
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Schedule Visit
                </Button>
              )}
            </div>

            {/* Symmetrical Header for Appointments Tab with Restore Toggle */}
            <div className="flex items-center justify-between mb-4">
               <div>
                  <h3 className="text-xl font-bold flex items-center gap-2">
                    {showHiddenAppointments ? (
                      <><Clock className="h-5 w-5 text-blue-600" /> Recently Deleted Visits</>
                    ) : (
                      <><CalendarCheck className="h-5 w-5 text-blue-600" /> Scheduled Visits</>
                    )}
                  </h3>
                  {showHiddenAppointments && (
                    <p className="text-sm text-muted-foreground italic">Restorable for 15 days.</p>
                  )}
               </div>
               {showHiddenAppointments ? (
                 <Button variant="outline" size="sm" onClick={() => setShowHiddenAppointments(false)}>
                   <ArrowLeft className="h-4 w-4 mr-2" />
                   Back to Active
                 </Button>
               ) : (
                 <Button 
                   variant="ghost" 
                   size="sm" 
                   className="text-muted-foreground hover:text-blue-600 font-normal" 
                   onClick={async () => {
                     setShowHiddenAppointments(true);
                     await loadHiddenAppointments();
                   }}
                 >
                   <Clock className="h-4 w-4 mr-1" /> View Deleted
                 </Button>
               )}
            </div>

            {/* Appointment Tab Selector (Only visible for active visits) */}
            {!showHiddenAppointments && (
              <Tabs value={appointmentTab} onValueChange={(val) => setAppointmentTab(val as 'yours' | 'requested')} className="mb-6">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="yours" className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    <span className="truncate">Your Appointments ({appointmentsScheduledByMe.length})</span>
                  </TabsTrigger>
                  <TabsTrigger value="requested" className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span className="truncate">Mother Requests ({appointmentsRequestedByMother.length})</span>
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            )}

            {(showHiddenAppointments ? hiddenAppointmentsLoading : appointmentsLoading) ? (
              <div className="flex items-center justify-center py-12">
                <Activity className="h-6 w-6 animate-spin text-muted-foreground mr-2" />
                <span className="text-muted-foreground">Loading appointments...</span>
              </div>
            ) : displayedAppointments.length === 0 ? (
              <Card className="border-dashed border-2 border-blue-200 bg-blue-50/50">
                <CardContent className="p-8 text-center">
                  <CalendarCheck className="h-12 w-12 mx-auto mb-4 text-blue-400" />
                  <h3 className="text-lg font-medium mb-2">No Visits in This Category</h3>
                  <p className="text-muted-foreground mb-4">
                    {appointmentTab === 'yours'
                      ? "You haven't scheduled any appointments yet."
                      : "No mothers have requested appointments yet."}
                  </p>
                  {appointmentTab === 'yours' && (
                    <Button
                      onClick={() => {
                        setScheduleContext('general');
                        setShowScheduleModal(true);
                      }}
                    >
                      <PlusCircle className="h-4 w-4 mr-2" />
                      Schedule First Visit
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {displayedAppointments.map((appt) => {
                  const isUpcoming = appt.status === 'scheduled';
                  const isPast = appt.status === 'completed';
                  const isCancelled = appt.status === 'canceled' || appt.status === 'cancelled';
                  return (
                    <Card
                      key={appt.id}
                      className={`transition-all ${isUpcoming ? 'border-blue-200 bg-blue-50/30' : isPast ? 'border-green-200 bg-green-50/20' : 'border-gray-200 opacity-70'}`}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start gap-4">
                          <div className={`p-3 rounded-xl flex-shrink-0 ${isUpcoming ? 'bg-blue-100' : isPast ? 'bg-green-100' : 'bg-gray-100'}`}>
                            {isUpcoming ? (
                              <Calendar className={`h-5 w-5 text-blue-600`} />
                            ) : isPast ? (
                              <CheckCircle className="h-5 w-5 text-green-600" />
                            ) : (
                              <CalendarX className="h-5 w-5 text-gray-500" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <p className="font-medium text-base">
                                  {appt.mother_name ? `${appt.mother_name} - ` : ''}
                                  {appt.notes?.slice(0, 50) || "Scheduled Visit"}
                                </p>
                                <p className="text-sm text-muted-foreground mt-0.5">
                                  <Clock className="h-3 w-3 inline mr-1" />
                                  {new Date(appt.scheduled_time).toLocaleString('en-KE', {
                                    weekday: 'short', month: 'short', day: 'numeric',
                                    hour: '2-digit', minute: '2-digit'
                                  })}
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge
                                  variant="outline"
                                  className={
                                    isUpcoming ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                    isPast ? 'bg-green-50 text-green-700 border-green-200' :
                                    'bg-gray-50 text-gray-600 border-gray-200'
                                  }
                                >
                                  {appt.status}
                                </Badge>
                                {!showHiddenAppointments && !isUpcoming && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                                    onClick={() => setDeleteApptConfirm(appt.id)}
                                    title="Delete from dashboard"
                                    aria-label="Delete appointment from dashboard"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            </div>
                            {appt.recurrence_rule && appt.recurrence_rule !== 'none' && (
                              <p className="text-xs text-muted-foreground mt-1">
                                Repeats: {appt.recurrence_rule}
                              </p>
                            )}
                            {!showHiddenAppointments && (
                              <div className="flex gap-2 mt-3 flex-wrap">
                                {isUpcoming && (
                                  <>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="text-xs border-green-200 text-green-700 hover:bg-green-50"
                                      onClick={() => {
                                        appointmentService.updateStatus(appt.id, 'completed').then(updated => {
                                          setAppointments(prev => prev.map(a => a.id === appt.id ? updated : a));
                                          toast({ title: "Visit Completed", description: "Appointment marked as completed." });
                                        }).catch(() => toast({ title: "Error", description: "Could not update status.", variant: "destructive" }));
                                      }}
                                    >
                                      <CheckCircle className="h-3 w-3 mr-1" />
                                      Mark Completed
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="text-xs border-red-200 text-red-600 hover:bg-red-50"
                                      onClick={() => {
                                        appointmentService.updateStatus(appt.id, 'cancelled').then(updated => {
                                          setAppointments(prev => prev.map(a => a.id === appt.id ? updated : a));
                                          toast({ title: "Visit Cancelled", description: "Appointment has been cancelled." });
                                        }).catch(() => toast({ title: "Error", description: "Could not update status.", variant: "destructive" }));
                                      }}
                                    >
                                      <CalendarX className="h-3 w-3 mr-1" />
                                      Cancel
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="text-xs border-red-200 text-red-600 hover:bg-red-50"
                                      onClick={() => setDeleteApptConfirm(appt.id)}
                                      title="Delete from dashboard"
                                    >
                                      <Trash2 className="h-3 w-3 mr-1" />
                                      Delete
                                    </Button>
                                  </>
                                )}
                                {isWithin15Min(appt.created_at) && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="text-xs border-blue-200 text-blue-700 hover:bg-blue-50"
                                    onClick={() => {
                                      setEditApptId(appt.id);
                                      setEditApptForm({
                                        scheduledTime: appt.scheduled_time ? new Date(appt.scheduled_time) : undefined,
                                        notes: appt.notes || '',
                                        appointmentType: appt.appointment_type || 'prenatal_checkup',
                                      });
                                      setEditApptOpen(true);
                                    }}
                                  >
                                    Edit
                                  </Button>
                                )}
                              </div>
                            )}
                            {showHiddenAppointments && (
                              <div className="flex gap-2 mt-3">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-xs border-green-200 text-green-700 hover:bg-green-50"
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
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* Escalated Cases Tab */}
          <TabsContent value="cases" className="space-y-4">
            {/* Header for Cases Tab with View/Restore Hidden Toggle */}
            <div className="flex items-center justify-between mb-4">
               <div>
                  <h3 className="text-xl font-bold flex items-center gap-2">
                    {showHiddenEscalations ? (
                      <><Clock className="h-5 w-5 text-blue-600" /> Recently Deleted Escalations</>
                    ) : (
                      <><AlertTriangle className="h-5 w-5 text-red-600" /> Currently Escalated</>
                    )}
                  </h3>
                  {showHiddenEscalations && (
                    <p className="text-sm text-muted-foreground italic">Restorable for 15 days.</p>
                  )}
               </div>
               {showHiddenEscalations ? (
                 <Button variant="outline" size="sm" onClick={() => setShowHiddenEscalations(false)}>
                   <ArrowLeft className="h-4 w-4 mr-2" />
                   Back to Active
                 </Button>
               ) : (
                 <Button 
                   variant="ghost" 
                   size="sm" 
                   className="text-muted-foreground hover:text-blue-600 font-normal" 
                   onClick={async () => {
                     setShowHiddenEscalations(true);
                     await loadHiddenEscalations();
                   }}
                 >
                   <Clock className="h-4 w-4 mr-1" /> View Deleted
                 </Button>
               )}
            </div>

            {/* Display Logic for Escalations */}
            {(showHiddenEscalations ? hiddenEscalationsLoading : escalationSubmitting) ? (
              <div className="flex items-center justify-center py-12">
                 <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mr-2" />
                 <span className="text-muted-foreground">Loading cases...</span>
              </div>
            ) : (() => {
              const displayCases = showHiddenEscalations ? (hiddenEscalations || []) : (realEscalations ?? []);
              if (displayCases.length === 0) return (
                <Card className="p-8 text-center bg-gray-50/50 border-dashed border-2 border-gray-200">
                  <div className="bg-white p-3 rounded-full w-fit mx-auto shadow-sm mb-4">
                     {showHiddenEscalations ? <CalendarX className="h-8 w-8 text-muted-foreground" /> : <CheckCircle className="h-12 w-12 text-green-500" />}
                  </div>
                  <h3 className="text-lg font-medium mb-2">{showHiddenEscalations ? "No Deleted Escalations" : "No Escalated Cases"}</h3>
                  <p className="text-muted-foreground">
                    {showHiddenEscalations ? "You don't have any cases in the recycle bin." : "All mothers are doing well. Great work!"}
                  </p>
                </Card>
              );
              return displayCases.map((caseItem) => (
                <Card key={caseItem.id} className={showHiddenEscalations ? "border-gray-200 bg-gray-50/20 shadow-none opacity-90" : "border-red-200"}>
                  <CardHeader className="py-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className={showHiddenEscalations ? "bg-gray-100 p-2 rounded-lg" : "bg-red-100 p-2 rounded-lg"}>
                          {showHiddenEscalations ? <Clock className="h-5 w-5 text-gray-600" /> : <AlertTriangle className="h-5 w-5 text-red-600" />}
                        </div>
                        <div>
                          <CardTitle className="text-lg">{caseItem.motherName}</CardTitle>
                          <CardDescription>
                            Escalated {new Date(caseItem.escalatedAt).toLocaleString()}
                          </CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={getEscalationStatusBadgeClass(caseItem.status)}>
                          {caseItem.status.replace('_', ' ')}
                        </Badge>
                        <Badge variant="destructive" className={showHiddenEscalations ? "bg-gray-400" : ""}>{caseItem.priority} priority</Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pb-4">
                    <div className="space-y-4">
                      <div className={`p-4 rounded-lg border ${showHiddenEscalations ? "bg-white border-gray-100" : "bg-red-50 border-red-100"}`}>
                        <p className={`font-medium mb-1 ${showHiddenEscalations ? "text-gray-800" : "text-red-800"}`}>Issue: {caseItem.issueType}</p>
                        <p className={`text-sm ${showHiddenEscalations ? "text-gray-600" : "text-red-700"}`}>{caseItem.notes}</p>
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        {showHiddenEscalations ? (
                          <Button 
                            className="flex-1"
                            onClick={() => handleRestoreEscalation(caseItem.id)}
                          >
                            <PlusCircle className="h-4 w-4 mr-2" />
                            Restore Case to Active
                          </Button>
                        ) : (
                          <>
                            <Button
                              className="flex-1"
                              onClick={() => {
                                setSelectedEscalatedCase(caseItem);
                                setShowEscalatedCaseDetails(true);
                              }}
                            >
                              <Stethoscope className="h-4 w-4 mr-2" />
                              View Case Details
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => {
                                const motherEntry = displayMothers.find(m => m.name === caseItem.motherName);
                                const mId = motherEntry ? String(motherEntry.id) : "";
                                setScheduleForm({
                                  motherId: mId,
                                  scheduledTime: undefined,
                                  appointmentType: "consultation",
                                  recurrence: "none",
                                  notes: `Regarding Escalation: ${caseItem.issueType} - ${caseItem.notes}`,
                                  nurseUserId: (caseItem as any).nurseUserId
                                });
                                setScheduleContext('nurse_referral');
                                setShowScheduleModal(true);
                              }}
                            >
                              <CalendarCheck className="h-4 w-4 mr-2" />
                              Book with Nurse
                            </Button>
                            <div className="flex gap-2 ml-auto">
                              {isWithin15Min(caseItem.escalatedAt) && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-xs border-blue-200 text-blue-700 hover:bg-blue-50"
                                  onClick={() => {
                                    setEditEscalId(caseItem.id);
                                    setEditEscalForm({
                                      description: caseItem.issue,
                                      priority: caseItem.priority,
                                      notes: caseItem.notes || '',
                                      issueType: caseItem.issueType,
                                    });
                                    setEditEscalOpen(true);
                                  }}
                                >
                                  Edit
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                                onClick={() => setDeleteEscalConfirm(caseItem.id)}
                                title="Delete from dashboard"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ));
            })()}
          </TabsContent>

          {/* Resources Tab */}
          <TabsContent value="resources" className="space-y-4">
            {resourcesLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-2 text-muted-foreground">Loading resources...</span>
              </div>
            ) : resourcesError ? (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {resourcesError}
                </AlertDescription>
              </Alert>
            ) : resources.length === 0 ? (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  No resources available for CHW at this time.
                </AlertDescription>
              </Alert>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {resources.map((resource) => (
                  <Card key={resource.id} className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <div className="text-4xl">{resource.thumbnail}</div>
                        <div className="flex-1">
                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className="font-medium">{resource.title}</h4>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="outline">{resource.category}</Badge>
                                <span className="text-xs text-muted-foreground capitalize">{resource.content_type}</span>
                              </div>
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{resource.description}</p>
                          <div className="flex items-center justify-between mt-3">
                            <div className="flex items-center gap-3 text-sm text-muted-foreground">
                              <span>CHW Resource</span>
                            </div>
                            <div className="flex gap-2">
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => window.open(resource.url, '_blank', 'noopener,noreferrer')}
                              >
                                View
                              </Button>
                              <Button size="sm" variant="outline">
                                <Share2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
    </TooltipProvider>
  );
}

