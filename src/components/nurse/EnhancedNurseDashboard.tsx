import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertTriangle, MessageCircle, Phone, Clock, CheckCircle, User, FileText,
  LogOut, Search, Filter, TrendingUp, Activity, Heart, Stethoscope,
  ChevronRight, MoreHorizontal, Calendar, MapPin, BadgeCheck,
  Video, Download, Share2, Bell, Settings, BarChart3, Users,
  ArrowUpRight, ArrowDownRight, Sparkles, Star, ClipboardCheck,
  CheckCircle2, XCircle, Clock4, UserCheck, Briefcase, Camera,
  PlusCircle, CalendarCheck, CalendarX, Loader2, AlertCircle, ArrowLeft
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
import { escalationService, type Escalation as RealEscalation } from "@/services/escalationService";
import { assignmentService, type Assignment } from "@/services/assignmentService";
import { appointmentService, type Appointment } from "@/services/appointmentService";
import { nurseService } from "@/services/nurseService";
import { usePolling } from "@/hooks/usePolling";

// Mock data for escalated cases
const mockEscalatedCases = [
  {
    id: 1,
    motherId: 2,
    motherName: "Grace Akinyi",
    motherPhone: "+254723456789",
    motherAvatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop",
    chwName: "John Kamau",
    chwPhone: "+254711111111",
    issue: "Severe headaches and vision problems",
    issueType: "preeclampsia",
    escalatedAt: "2024-02-20T14:30:00",
    status: "pending",
    priority: "high",
    notes: "Mother reported persistent headaches and blurred vision. Blood pressure elevated during last visit. Requires immediate attention.",
    weeksPregnant: 32,
    location: "Kibera",
    vitals: {
      bloodPressure: "150/95",
      heartRate: "88",
      temperature: "37.2°C"
    }
  },
  {
    id: 2,
    motherId: 3,
    motherName: "Esther Muthoni",
    motherPhone: "+254734567890",
    motherAvatar: "https://images.unsplash.com/photo-1489424731084-a5d8b219a5bb?w=100&h=100&fit=crop",
    chwName: "Mary Wanjiku",
    chwPhone: "+254722222222",
    issue: "Heavy bleeding reported",
    issueType: "bleeding",
    escalatedAt: "2024-02-20T10:15:00",
    status: "in_progress",
    priority: "critical",
    notes: "Mother reported heavy vaginal bleeding. Advised to go to hospital immediately. CHW following up.",
    weeksPregnant: 24,
    location: "Mathare",
    vitals: {
      bloodPressure: "140/90",
      heartRate: "95",
      temperature: "37.5°C"
    }
  },
];

// Mock data for CHWs
const mockCHWs = [
  {
    id: 1,
    name: "John Kamau",
    phone: "+254711111111",
    assignedMothers: 12,
    activeCases: 1,
    lastActive: "5 min ago",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop",
    location: "Kibera",
    performance: 94
  },
  {
    id: 2,
    name: "Mary Wanjiku",
    phone: "+254722222222",
    assignedMothers: 15,
    activeCases: 2,
    lastActive: "12 min ago",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop",
    location: "Mathare",
    performance: 91
  },
  {
    id: 3,
    name: "Peter Ochieng",
    phone: "+254733333333",
    assignedMothers: 10,
    activeCases: 0,
    lastActive: "1 hour ago",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop",
    location: "Kibera",
    performance: 88
  },
];

// Mock data for resources
const nurseResources = [
  {
    id: 1,
    title: "Emergency Response Protocols",
    type: "PDF",
    category: "Critical Care",
    author: "Ministry of Health",
    date: "2024-01-15",
    thumbnail: "🚨"
  },
  {
    id: 2,
    title: "Maternal Health Guidelines 2024",
    type: "PDF",
    category: "Guidelines",
    author: "WHO",
    date: "2024-01-10",
    thumbnail: "📋"
  },
  {
    id: 3,
    title: "Preeclampsia Management",
    type: "Video",
    category: "Training",
    author: "Dr. Sarah Johnson",
    date: "2024-02-01",
    duration: "25:30",
    thumbnail: "🎥"
  },
  {
    id: 4,
    title: "Postpartum Hemorrhage Protocol",
    type: "PDF",
    category: "Emergency",
    author: "Ministry of Health",
    date: "2024-01-20",
    thumbnail: "🩺"
  },
];

// Mock weekly statistics
const weeklyStats = {
  totalCases: 24,
  casesChange: 5,
  resolvedCases: 18,
  resolvedChange: 3,
  pendingCases: 4,
  pendingChange: -1,
  criticalCases: 2,
  criticalChange: 1,
  avgResponseTime: "15 min",
  responseTimeChange: -3,
};

interface NurseDashboardProps {
  isFirstLogin?: boolean;
}

export function EnhancedNurseDashboard({ isFirstLogin = false }: NurseDashboardProps) {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [showPhotoUpload, setShowPhotoUpload] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [selectedCase, setSelectedCase] = useState<typeof mockEscalatedCases[0] | null>(null);
  const [showCaseDetails, setShowCaseDetails] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [activeTab, setActiveTab] = useState("cases");
  const [notifications, setNotifications] = useState([
    { id: 1, message: "New critical case escalated from CHW", time: "2 min ago", read: false, type: "critical" },
    { id: 2, message: "Case #1 updated by CHW", time: "15 min ago", read: false, type: "update" },
    { id: 3, message: "Weekly report available", time: "1 hour ago", read: true, type: "info" },
  ]);
  const [caseNotes, setCaseNotes] = useState("");
  // Real-data state (populated from API; mock data used as initial fallback)
  const [nurseProfileId, setNurseProfileId] = useState<number | null>(null);
  const [realEscalations, setRealEscalations] = useState<typeof mockEscalatedCases | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  // Real CHW assignments for the CHW Team tab
  const [realCHWAssignments, setRealCHWAssignments] = useState<Assignment[] | null>(null);
  // Appointments for the nurse
  const [nurseAppointments, setNurseAppointments] = useState<Appointment[]>([]);
  const [nurseAppointmentsLoading, setNurseAppointmentsLoading] = useState(false);
  const [showNurseScheduleModal, setShowNurseScheduleModal] = useState(false);
  const [nurseScheduleForm, setNurseScheduleForm] = useState({
    motherUserId: "",
    scheduledTime: undefined as Date | undefined,
    appointmentType: "prenatal_checkup",
    notes: "",
    recurrence: "none",
  });
  const [nurseScheduleSubmitting, setNurseScheduleSubmitting] = useState(false);
  // 15-min CRUD – escalations
  const [editEscalOpen, setEditEscalOpen] = useState(false);
  const [editEscalId, setEditEscalId] = useState<number | null>(null);
  const [editEscalForm, setEditEscalForm] = useState({ description: '', priority: 'high', notes: '', issueType: '' });
  const [editEscalSubmitting, setEditEscalSubmitting] = useState(false);
  const [deleteEscalConfirm, setDeleteEscalConfirm] = useState<number | null>(null);
  const [deleteEscalSubmitting, setDeleteEscalSubmitting] = useState(false);
  // 15-min CRUD – appointments
  const [editApptOpen, setEditApptOpen] = useState(false);
  const [editApptId, setEditApptId] = useState<number | null>(null);
  const [editApptForm, setEditApptForm] = useState({ scheduledTime: undefined as Date | undefined, notes: '', appointmentType: 'prenatal_checkup' });
  const [editApptSubmitting, setEditApptSubmitting] = useState(false);
  const [deleteApptConfirm, setDeleteApptConfirm] = useState<number | null>(null);
  const [deleteApptSubmitting, setDeleteApptSubmitting] = useState(false);

  // Ref keeps the latest nurseProfileId available inside the polling callback
  const nurseProfileIdRef = useRef<number | null>(null);

  // Returns true if a timestamp is within the 15-minute edit/delete window
  const isWithin15Min = (createdAt: string) =>
    (new Date().getTime() - new Date(createdAt).getTime()) < 15 * 60 * 1000;

  // Derive CHW list from real assignments (grouped by chw_id) or empty
  const displayCHWs: typeof mockCHWs = (realCHWAssignments && realCHWAssignments.length > 0)
    ? Object.values(
        realCHWAssignments.reduce((acc, a) => {
          if (!acc[a.chw_id]) {
            acc[a.chw_id] = {
              id: a.chw_id,
              name: a.chw_name,
              phone: "",
              assignedMothers: 0,
              activeCases: 0,
              lastActive: "Recently",
              avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(a.chw_name)}`,
              location: "",
              performance: 0,
            };
          }
          acc[a.chw_id].assignedMothers += 1;
          return acc;
        }, {} as Record<number, (typeof mockCHWs)[0]>)
      )
    : [];

  // Filter cases — use real escalations when loaded, otherwise empty
  const allCases = realEscalations ?? [];
  const filteredCases = allCases.filter(caseItem => {
    const matchesSearch = caseItem.motherName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      caseItem.chwName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || caseItem.status === statusFilter;
    const matchesPriority = priorityFilter === "all" || caseItem.priority === priorityFilter;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-600 text-white';
      case 'high': return 'bg-orange-500 text-white';
      case 'medium': return 'bg-amber-500 text-white';
      default: return 'bg-blue-500 text-white';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending': return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200"><Clock4 className="h-3 w-3 mr-1" />Pending</Badge>;
      case 'in_progress': return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200"><Activity className="h-3 w-3 mr-1" />In Progress</Badge>;
      case 'resolved': return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200"><CheckCircle2 className="h-3 w-3 mr-1" />Resolved</Badge>;
    }
  };

  const openWhatsApp = (phone: string) => {
    window.open(`https://wa.me/${phone.replace('+', '')}`, '_blank');
  };

  const handleCaseClick = (caseItem: typeof mockEscalatedCases[0]) => {
    setSelectedCase(caseItem);
    setShowCaseDetails(true);
  };

  const handleResolveCase = async () => {
    if (!selectedCase) return;
    try {
      setActionLoading(true);
      // Try real API first
      if (nurseProfileId) {
        await escalationService.updateStatus(selectedCase.id, 'resolved',
          caseNotes.trim() || undefined);
        // Update local state
        setRealEscalations((prev) =>
          (prev ?? []).map((c) =>
            c.id === selectedCase.id ? { ...c, status: 'resolved' as const } : c
          ) as typeof mockEscalatedCases
        );
      }
      toast({
        title: "Case Resolved",
        description: "The case has been marked as resolved and the CHW has been notified.",
      });
    } catch (err: any) {
      toast({
        title: "Update Failed",
        description: err.message || "Could not resolve the case. Please try again.",
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
      setShowCaseDetails(false);
    }
  };

  const handleAddNote = async () => {
    if (!caseNotes.trim() || !selectedCase) return;
    try {
      setActionLoading(true);
      if (nurseProfileId) {
        await escalationService.update(selectedCase.id, { notes: caseNotes.trim() });
        // Reflect in local state
        setRealEscalations((prev) =>
          (prev ?? []).map((c) =>
            c.id === selectedCase.id ? { ...c, notes: caseNotes.trim() } : c
          ) as typeof mockEscalatedCases
        );
      }
      toast({
        title: "Note Added",
        description: "Your note has been saved to the case.",
      });
    } catch (err: any) {
      toast({
        title: "Save Failed",
        description: err.message || "Could not save note.",
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
      setCaseNotes("");
    }
  };

  const handleMarkInProgress = async () => {
    if (!selectedCase) return;
    try {
      setActionLoading(true);
      if (nurseProfileId) {
        await escalationService.updateStatus(selectedCase.id, 'in_progress',
          caseNotes.trim() || undefined);
        setRealEscalations((prev) =>
          (prev ?? []).map((c) =>
            c.id === selectedCase.id ? { ...c, status: 'in_progress' as const } : c
          ) as typeof mockEscalatedCases
        );
      }
      toast({ title: "Case Updated", description: "Case marked as in progress." });
    } catch (err: any) {
      toast({ title: "Update Failed", description: err.message || "Could not update status.", variant: "destructive" });
    } finally {
      setActionLoading(false);
      setShowCaseDetails(false);
    }
  };

  const handleScheduleNurseAppointment = async () => {
    if (!nurseScheduleForm.motherUserId || !nurseScheduleForm.scheduledTime) {
      toast({ title: "Missing Information", description: "Please select a mother and pick a date & time.", variant: "destructive" });
      return;
    }
    setNurseScheduleSubmitting(true);
    try {
      const appt = await appointmentService.create({
        mother_id: parseInt(nurseScheduleForm.motherUserId),
        health_worker_id: user!.id,
        scheduled_time: nurseScheduleForm.scheduledTime.toISOString(),
        appointment_type: nurseScheduleForm.appointmentType,
        notes: nurseScheduleForm.notes.trim() || undefined,
        recurrence_rule: nurseScheduleForm.recurrence !== "none" ? nurseScheduleForm.recurrence : undefined,
      });
      setNurseAppointments(prev => [appt, ...prev]);
      toast({ title: "Appointment Scheduled \u2713", description: `Visit on ${new Date(appt.scheduled_time).toLocaleString()}.` });
      setShowNurseScheduleModal(false);
      setNurseScheduleForm({ motherUserId: "", scheduledTime: undefined, appointmentType: "prenatal_checkup", notes: "", recurrence: "none" });
    } catch (err: any) {
      toast({ title: "Scheduling Failed", description: err.message || "Could not schedule appointment.", variant: "destructive" });
    } finally {
      setNurseScheduleSubmitting(false);
    }
  };

  const markNotificationRead = (id: number) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  /**
   * Fetch volatile data that should be kept fresh:
   * escalations, CHW assignments, and appointments.
   * Called once on mount and then every 15 s via usePolling.
   */
  const refreshData = useCallback(async () => {
    const profileId = nurseProfileIdRef.current;
    if (!profileId || !user) return;

    // Escalations
    try {
      const escalResp = await escalationService.list({ nurse_id: profileId });
      const mapped = escalResp.escalations.map((e) => ({
        id: e.id,
        motherId: e.mother_id ?? 0,
        motherName: e.mother_name,
        motherPhone: "",
        motherAvatar: "",
        chwName: e.chw_name,
        chwPhone: "",
        issue: e.case_description,
        issueType: e.issue_type ?? e.case_description,
        escalatedAt: e.created_at,
        status: e.status as "pending" | "in_progress" | "resolved",
        priority: e.priority as "low" | "medium" | "high" | "critical",
        notes: e.notes ?? "",
        weeksPregnant: 0,
        location: "",
        vitals: { bloodPressure: "---", heartRate: "---", temperature: "---" },
      }));
      setRealEscalations(mapped as typeof mockEscalatedCases);
    } catch { /* ignore */ }

    // CHW assignments
    try {
      const assignResp = await assignmentService.getAssignmentsForNurse(profileId, 'active');
      setRealCHWAssignments(assignResp.assignments);
    } catch { /* ignore */ }

    // Appointments
    try {
      const apptResp = await appointmentService.getForHealthWorker(user.id);
      setNurseAppointments(apptResp.appointments);
    } catch { /* ignore */ }
  }, [user]);

  // Poll every 15 seconds so the dashboard stays in sync with the backend
  usePolling(refreshData, 15_000, nurseProfileId !== null);

  // One-time setup: photo, nurse profile, then initial data load
  useEffect(() => {
    let isMounted = true;
    (async () => {
      // Photo
      try {
        const meta = await getMyPhoto();
        if (meta && isMounted) setProfileImage(getPhotoFileUrl(meta.file_url));
      } catch { /* ignore */ }

      // Nurse profile ID
      try {
        const profile = await nurseService.getCurrentProfile();
        if (!isMounted) return;
        setNurseProfileId(profile.id);
        nurseProfileIdRef.current = profile.id;
      } catch { /* profile unavailable */ }

      // Initial data load (shows loading spinner)
      if (isMounted) setNurseAppointmentsLoading(true);
      await refreshData();
      if (isMounted) setNurseAppointmentsLoading(false);
    })();
    return () => { isMounted = false; };
  }, [refreshData]);

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
    } catch (err: any) {
      toast({
        title: "Upload failed",
        description: err.message || "Could not upload photo.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50">
      {/* Photo Upload Modal */}
      <Dialog open={showPhotoUpload} onOpenChange={setShowPhotoUpload}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center">Add Your Profile Photo</DialogTitle>
            <DialogDescription className="text-center">
              Personalize your profile with a photo so CHWs and mothers can recognize you.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center space-y-4 py-6">
            <div className="relative">
              <Avatar className="h-32 w-32">
                <AvatarImage src={profileImage || undefined} />
                <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-600 text-white text-4xl">
                  {user?.first_name?.charAt(0).toUpperCase() || "N"}
                </AvatarFallback>
              </Avatar>
              <label
                htmlFor="nurse-photo-upload"
                className="absolute bottom-0 right-0 bg-primary text-primary-foreground p-2 rounded-full cursor-pointer hover:bg-primary/90 transition-colors"
              >
                <Camera className="h-5 w-5" />
              </label>
              <input
                id="nurse-photo-upload"
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
      {/* Case Details Dialog */}
      <Dialog open={showCaseDetails} onOpenChange={setShowCaseDetails}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
          {selectedCase && (
            <>
              <DialogHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-xl ${getPriorityColor(selectedCase.priority)}`}>
                      <AlertTriangle className="h-6 w-6" />
                    </div>
                    <div>
                      <DialogTitle className="text-xl">Case #{selectedCase.id}</DialogTitle>
                      <DialogDescription className="flex items-center gap-2 mt-1">
                        {getStatusBadge(selectedCase.status)}
                        <Badge className={getPriorityColor(selectedCase.priority)}>
                          {selectedCase.priority} priority
                        </Badge>
                      </DialogDescription>
                    </div>
                  </div>
                </div>
              </DialogHeader>

              <div className="space-y-6 py-4">
                {/* Mother Information */}
                <Card className="bg-gradient-to-br from-pink-50 to-purple-50 border-pink-200">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <User className="h-4 w-4 text-pink-600" />
                      Mother Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-start gap-4">
                      <Avatar className="h-16 w-16">
                        <AvatarImage src={selectedCase.motherAvatar} />
                        <AvatarFallback className="bg-pink-100 text-pink-600 text-xl">
                          {selectedCase.motherName.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <h4 className="font-semibold text-lg">{selectedCase.motherName}</h4>
                        <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Phone className="h-4 w-4" />
                            {selectedCase.motherPhone}
                          </div>
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <MapPin className="h-4 w-4" />
                            {selectedCase.location}
                          </div>
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Heart className="h-4 w-4" />
                            {selectedCase.weeksPregnant} weeks pregnant
                          </div>
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Clock className="h-4 w-4" />
                            Escalated {new Date(selectedCase.escalatedAt).toLocaleString()}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Vitals */}
                <div className="grid grid-cols-3 gap-4">
                  <Card className="bg-red-50 border-red-200">
                    <CardContent className="p-4 text-center">
                      <p className="text-xs text-red-600 mb-1">Blood Pressure</p>
                      <p className="text-2xl font-bold text-red-700">{selectedCase.vitals.bloodPressure}</p>
                      <p className="text-xs text-red-500">mmHg</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-blue-50 border-blue-200">
                    <CardContent className="p-4 text-center">
                      <p className="text-xs text-blue-600 mb-1">Heart Rate</p>
                      <p className="text-2xl font-bold text-blue-700">{selectedCase.vitals.heartRate}</p>
                      <p className="text-xs text-blue-500">bpm</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-amber-50 border-amber-200">
                    <CardContent className="p-4 text-center">
                      <p className="text-xs text-amber-600 mb-1">Temperature</p>
                      <p className="text-2xl font-bold text-amber-700">{selectedCase.vitals.temperature}</p>
                      <p className="text-xs text-amber-500">°C</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Issue Details */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-red-600" />
                      Issue Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="p-4 bg-red-50 rounded-lg border border-red-100">
                      <p className="font-medium text-red-800 mb-2">{selectedCase.issueType}</p>
                      <p className="text-red-700">{selectedCase.notes}</p>
                    </div>
                  </CardContent>
                </Card>

                {/* CHW Information */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <UserCheck className="h-4 w-4 text-blue-600" />
                      Assigned CHW
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{selectedCase.chwName}</p>
                        <p className="text-sm text-muted-foreground">{selectedCase.chwPhone}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openWhatsApp(selectedCase.chwPhone)}
                        >
                          <MessageCircle className="h-4 w-4 mr-2" />
                          Message
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => window.open(`tel:${selectedCase.chwPhone}`, '_self')}
                        >
                          <Phone className="h-4 w-4 mr-2" />
                          Call
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Add Note */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Add Note</label>
                  <Textarea
                    value={caseNotes}
                    onChange={(e) => setCaseNotes(e.target.value)}
                    placeholder="Add your notes about this case..."
                    rows={3}
                  />
                  <Button
                    className="mt-2"
                    size="sm"
                    onClick={handleAddNote}
                    disabled={!caseNotes.trim() || actionLoading}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    {actionLoading ? "Saving..." : "Add Note"}
                  </Button>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    className="border-blue-200 text-blue-700 hover:bg-blue-50"
                    onClick={handleMarkInProgress}
                    disabled={
                      actionLoading ||
                      selectedCase?.status === 'in_progress' ||
                      selectedCase?.status === 'resolved'
                    }
                  >
                    <Clock4 className="h-4 w-4 mr-2" />
                    {selectedCase?.status === 'in_progress'
                      ? "In Progress"
                      : actionLoading
                      ? "Updating..."
                      : "Mark In Progress"}
                  </Button>
                  <Button
                    className="flex-1 bg-green-600 hover:bg-green-700"
                    onClick={handleResolveCase}
                    disabled={actionLoading || selectedCase?.status === 'resolved'}
                  >
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    {actionLoading ? "Updating..." : selectedCase?.status === 'resolved' ? "Already Resolved" : "Mark as Resolved"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => openWhatsApp(selectedCase!.motherPhone)}
                  >
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Contact Mother
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Schedule Appointment Modal */}
      <Dialog open={showNurseScheduleModal} onOpenChange={setShowNurseScheduleModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Schedule Appointment</DialogTitle>
            <DialogDescription>Book a visit for a mother in your care</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-1">
              <label className="text-sm font-medium">Mother (User ID)</label>
              <Input
                placeholder="Enter mother's user ID"
                type="number"
                value={nurseScheduleForm.motherUserId}
                onChange={e => setNurseScheduleForm(f => ({ ...f, motherUserId: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Date & Time</label>
              <DateTimePicker
                date={nurseScheduleForm.scheduledTime}
                setDate={(date) => setNurseScheduleForm(f => ({ ...f, scheduledTime: date }))}
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Visit Type</label>
              <Select value={nurseScheduleForm.appointmentType} onValueChange={v => setNurseScheduleForm(f => ({ ...f, appointmentType: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="prenatal_checkup">Prenatal Checkup</SelectItem>
                  <SelectItem value="postnatal_visit">Postnatal Visit</SelectItem>
                  <SelectItem value="emergency_visit">Emergency Visit</SelectItem>
                  <SelectItem value="routine_home_visit">Routine Home Visit</SelectItem>
                  <SelectItem value="follow_up">Follow-Up</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Recurrence</label>
              <Select value={nurseScheduleForm.recurrence} onValueChange={v => setNurseScheduleForm(f => ({ ...f, recurrence: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Recurrence</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="biweekly">Bi-weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Notes</label>
              <Textarea
                placeholder="Any notes for this appointment..."
                value={nurseScheduleForm.notes}
                onChange={e => setNurseScheduleForm(f => ({ ...f, notes: e.target.value }))}
                rows={3}
              />
            </div>
            <div className="flex gap-3 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setShowNurseScheduleModal(false)}>
                Cancel
              </Button>
              <Button
                className="flex-1 bg-purple-600 hover:bg-purple-700"
                onClick={handleScheduleNurseAppointment}
                disabled={nurseScheduleSubmitting || !nurseScheduleForm.motherUserId || !nurseScheduleForm.scheduledTime}
              >
                {nurseScheduleSubmitting ? "Scheduling..." : "Schedule"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Edit Escalation Dialog (15-min window) ── */}
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
                } catch (err: any) {
                  toast({ title: "Error", description: err.message, variant: "destructive" });
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

      {/* ── Delete Escalation Confirmation ── */}
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
                } catch (err: any) {
                  toast({ title: "Error", description: err.message, variant: "destructive" });
                } finally {
                  setDeleteEscalSubmitting(false);
                }
              }}
            >
              {deleteEscalSubmitting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Deleting...</> : "Yes, Delete"}
            </Button>
            <Button variant="outline" className="flex-1" onClick={() => setDeleteEscalConfirm(null)} disabled={deleteEscalSubmitting}>Cancel</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Edit Appointment Dialog (15-min window) ── */}
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
                  <SelectItem value="postnatal_visit">Postnatal Visit</SelectItem>
                  <SelectItem value="emergency_visit">Emergency Visit</SelectItem>
                  <SelectItem value="routine_home_visit">Routine Home Visit</SelectItem>
                  <SelectItem value="follow_up">Follow-Up</SelectItem>
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
                  setNurseAppointments(prev => prev.map(a => a.id === editApptId ? updated : a));
                  setEditApptOpen(false);
                  toast({ title: "Appointment Updated", description: "Changes saved successfully." });
                } catch (err: any) {
                  toast({ title: "Error", description: err.message, variant: "destructive" });
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

      {/* ── Delete Appointment Confirmation ── */}
      <Dialog open={deleteApptConfirm !== null} onOpenChange={(o) => { if (!o) setDeleteApptConfirm(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />Delete Appointment?
            </DialogTitle>
            <DialogDescription>This cannot be undone.</DialogDescription>
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
                  await appointmentService.delete(deleteApptConfirm);
                  setNurseAppointments(prev => prev.filter(a => a.id !== deleteApptConfirm));
                  setDeleteApptConfirm(null);
                  toast({ title: "Appointment Deleted" });
                } catch (err: any) {
                  toast({ title: "Error", description: err.message, variant: "destructive" });
                } finally {
                  setDeleteApptSubmitting(false);
                }
              }}
            >
              {deleteApptSubmitting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Deleting...</> : "Yes, Delete"}
            </Button>
            <Button variant="outline" className="flex-1" onClick={() => setDeleteApptConfirm(null)} disabled={deleteApptSubmitting}>Cancel</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3 flex-1">
              <Button
                variant="outline"
                size="icon"
                onClick={() => window.history.back()}
                className="rounded-full shadow-sm hover:scale-105 transition-transform bg-white border-purple-200 text-purple-600 hover:bg-purple-50 shrink-0"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="bg-gradient-to-br from-purple-500 to-pink-600 p-2 rounded-xl hidden sm:block">
                <Stethoscope className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-lg bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  RemyAfya
                </h1>
                <p className="text-xs text-muted-foreground">Nurse Dashboard</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Notifications */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5" />
                    {notifications.some(n => !n.read) && (
                      <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full text-[10px] text-white flex items-center justify-center">
                        {notifications.filter(n => !n.read).length}
                      </span>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80">
                  <DropdownMenuLabel>Notifications</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {notifications.map((notification) => (
                    <DropdownMenuItem
                      key={notification.id}
                      className={`flex flex-col items-start p-3 ${!notification.read ? 'bg-red-50' : ''}`}
                      onClick={() => markNotificationRead(notification.id)}
                    >
                      <div className="flex items-center gap-2">
                        {notification.type === 'critical' && <AlertTriangle className="h-4 w-4 text-red-500" />}
                        {notification.type === 'update' && <Activity className="h-4 w-4 text-blue-500" />}
                        {notification.type === 'info' && <FileText className="h-4 w-4 text-gray-500" />}
                        <span className="text-sm">{notification.message}</span>
                      </div>
                      <span className="text-xs text-muted-foreground ml-6">{notification.time}</span>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Profile */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                    <Avatar className="h-10 w-10 ring-2 ring-purple-200">
                      <AvatarImage src={profileImage || undefined} />
                      <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-600 text-white">
                        {user?.first_name?.charAt(0).toUpperCase() || 'N'}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col">
                      <span className="font-semibold">{user?.first_name} {user?.last_name}</span>
                      <span className="text-xs text-muted-foreground">{user?.phone_number}</span>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setShowPhotoUpload(true)}>
                    <Camera className="mr-2 h-4 w-4" />
                    Update Photo
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/dashboard/nurse/profile")}>
                    <User className="mr-2 h-4 w-4" />
                    My Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={logout} className="text-red-600">
                    <LogOut className="mr-2 h-4 w-4" />
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-foreground mb-2">
            Welcome, Nurse {user?.first_name || 'Supervisor'}! 👋
          </h2>
          <p className="text-muted-foreground">
            You have <span className="font-semibold text-red-600">
            {(realEscalations ?? []).filter(c => c.status !== 'resolved').length} active cases
          </span> requiring your attention.
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm">Total Cases</p>
                  <p className="text-3xl font-bold">{allCases.length}</p>
                </div>
                <ClipboardCheck className="h-8 w-8 text-purple-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-0">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm">Resolved</p>
                  <p className="text-3xl font-bold">{allCases.filter(c => c.status === 'resolved').length}</p>
                </div>
                <CheckCircle2 className="h-8 w-8 text-green-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-amber-500 to-amber-600 text-white border-0">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-amber-100 text-sm">Pending</p>
                  <p className="text-3xl font-bold">{allCases.filter(c => c.status === 'pending').length}</p>
                </div>
                <Clock4 className="h-8 w-8 text-amber-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-red-500 to-red-600 text-white border-0">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-red-100 text-sm">Critical</p>
                  <p className="text-3xl font-bold">{allCases.filter(c => c.priority === 'critical').length}</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-red-200" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid grid-cols-4 w-full">
            <TabsTrigger value="cases">Escalated Cases</TabsTrigger>
            <TabsTrigger value="appointments">Appointments</TabsTrigger>
            <TabsTrigger value="chws">CHW Team</TabsTrigger>
            <TabsTrigger value="resources">Resources</TabsTrigger>
          </TabsList>

          {/* Cases Tab */}
          <TabsContent value="cases" className="space-y-4">
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by mother or CHW name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-40">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                </SelectContent>
              </Select>
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="w-full sm:w-40">
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Cases List */}
            <div className="space-y-4">
              {filteredCases.map((caseItem) => (
                <Card
                  key={caseItem.id}
                  className="cursor-pointer hover:shadow-lg transition-all"
                  onClick={() => handleCaseClick(caseItem)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <Avatar className="h-14 w-14">
                        <AvatarImage src={caseItem.motherAvatar} />
                        <AvatarFallback className="bg-pink-100 text-pink-600 text-lg">
                          {caseItem.motherName.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-semibold text-lg">{caseItem.motherName}</h4>
                              {getStatusBadge(caseItem.status)}
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">
                              {caseItem.weeksPregnant} weeks • {caseItem.location}
                            </p>
                          </div>
                          <Badge className={getPriorityColor(caseItem.priority)}>
                            {caseItem.priority}
                          </Badge>
                        </div>

                        <div className="mt-3 p-3 bg-red-50 rounded-lg border border-red-100">
                          <p className="text-sm text-red-800">
                            <span className="font-medium">{caseItem.issueType}:</span> {caseItem.issue}
                          </p>
                        </div>

                        <div className="flex items-center justify-between mt-3 flex-wrap gap-2">
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <UserCheck className="h-4 w-4" />
                              {caseItem.chwName}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              {new Date(caseItem.escalatedAt).toLocaleString()}
                            </span>
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline">
                              View Details
                              <ChevronRight className="h-4 w-4 ml-1" />
                            </Button>
                            {isWithin15Min(caseItem.escalatedAt) && (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-xs border-blue-200 text-blue-700 hover:bg-blue-50"
                                  onClick={(e) => {
                                    e.stopPropagation();
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
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-xs border-red-300 text-red-700 hover:bg-red-50"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setDeleteEscalConfirm(caseItem.id);
                                  }}
                                >
                                  Delete
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {filteredCases.length === 0 && (
              <Card className="p-8 text-center">
                <CheckCircle2 className="h-12 w-12 mx-auto mb-4 text-green-500" />
                <h3 className="text-lg font-medium mb-2">No Cases Found</h3>
                <p className="text-muted-foreground">All escalated cases have been handled. Great work!</p>
              </Card>
            )}
          </TabsContent>

          {/* Appointments Tab */}
          <TabsContent value="appointments" className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-lg">Scheduled Appointments</h3>
                <p className="text-sm text-muted-foreground">{nurseAppointments.length} appointment{nurseAppointments.length !== 1 ? 's' : ''}</p>
              </div>
              <Button
                className="bg-purple-600 hover:bg-purple-700"
                onClick={() => setShowNurseScheduleModal(true)}
              >
                <PlusCircle className="h-4 w-4 mr-2" />
                Schedule Appointment
              </Button>
            </div>

            {nurseAppointmentsLoading ? (
              <Card className="p-8 text-center">
                <div className="animate-spin h-8 w-8 border-4 border-purple-500 border-t-transparent rounded-full mx-auto mb-4" />
                <p className="text-muted-foreground">Loading appointments...</p>
              </Card>
            ) : nurseAppointments.length === 0 ? (
              <Card className="p-8 text-center">
                <Calendar className="h-12 w-12 mx-auto mb-4 text-purple-300" />
                <h3 className="text-lg font-medium mb-2">No Appointments Yet</h3>
                <p className="text-muted-foreground mb-4">Schedule your first appointment for a mother.</p>
                <Button onClick={() => setShowNurseScheduleModal(true)} className="bg-purple-600 hover:bg-purple-700">
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Schedule First Appointment
                </Button>
              </Card>
            ) : (
              <div className="space-y-3">
                {nurseAppointments.map(appt => {
                  const isScheduled = appt.status === 'scheduled';
                  const isCompleted = appt.status === 'completed';
                  const isCancelled = appt.status === 'canceled' || appt.status === 'cancelled';
                  return (
                    <Card key={appt.id} className={`transition-all hover:shadow-md ${ isCancelled ? 'opacity-60' : '' }`}>
                      <CardContent className="p-4">
                        <div className="flex items-start gap-4">
                          <div className={`p-2 rounded-full ${ isScheduled ? 'bg-purple-100' : isCompleted ? 'bg-green-100' : 'bg-gray-100' }`}>
                            {isCompleted ? (
                              <CalendarCheck className={`h-5 w-5 text-green-600`} />
                            ) : isCancelled ? (
                              <CalendarX className={`h-5 w-5 text-gray-400`} />
                            ) : (
                              <Calendar className={`h-5 w-5 text-purple-600`} />
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-start justify-between">
                              <div>
                                <p className="font-medium capitalize">{appt.appointment_type?.replace(/_/g, ' ')}</p>
                                <p className="text-sm text-muted-foreground">
                                  {new Date(appt.scheduled_time).toLocaleString('en-KE', { dateStyle: 'medium', timeStyle: 'short' })}
                                </p>
                                {appt.recurrence_rule && appt.recurrence_rule !== 'none' && (
                                  <p className="text-xs text-purple-600 mt-0.5">↻ {appt.recurrence_rule}</p>
                                )}
                                {appt.notes && (
                                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{appt.notes}</p>
                                )}
                              </div>
                              <Badge variant="outline" className={`text-xs ${
                                isScheduled ? 'bg-purple-50 text-purple-700 border-purple-200' :
                                isCompleted ? 'bg-green-50 text-green-700 border-green-200' :
                                'bg-gray-50 text-gray-500 border-gray-200'
                              }`}>
                                {appt.status}
                              </Badge>
                            </div>
                            {isScheduled && (
                              <div className="flex gap-2 mt-3 flex-wrap">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-green-700 border-green-200 hover:bg-green-50"
                                  onClick={async () => {
                                    await appointmentService.updateStatus(appt.id, 'completed');
                                    setNurseAppointments(prev => prev.map(a => a.id === appt.id ? { ...a, status: 'completed' } : a));
                                  }}
                                >
                                  <CalendarCheck className="h-3 w-3 mr-1" /> Mark Completed
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-red-600 border-red-200 hover:bg-red-50"
                                  onClick={async () => {
                                    await appointmentService.updateStatus(appt.id, 'cancelled');
                                    setNurseAppointments(prev => prev.map(a => a.id === appt.id ? { ...a, status: 'cancelled' } : a));
                                  }}
                                >
                                  <CalendarX className="h-3 w-3 mr-1" /> Cancel
                                </Button>
                                {isWithin15Min(appt.created_at) && (
                                  <>
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
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="text-xs border-red-300 text-red-700 hover:bg-red-50"
                                      onClick={() => setDeleteApptConfirm(appt.id)}
                                    >
                                      Delete
                                    </Button>
                                  </>
                                )}
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

          {/* CHWs Tab */}
          <TabsContent value="chws" className="space-y-4">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {displayCHWs.map((chw) => (
                <Card key={chw.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={chw.avatar} />
                        <AvatarFallback className="bg-blue-100 text-blue-600">
                          {chw.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <h4 className="font-semibold">{chw.name}</h4>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <MapPin className="h-3 w-3" />
                          {chw.location}
                        </div>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          Last active: {chw.lastActive}
                        </div>
                      </div>
                    </div>

                    <Separator className="my-3" />

                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div>
                        <p className="text-xl font-bold">{chw.assignedMothers}</p>
                        <p className="text-xs text-muted-foreground">Mothers</p>
                      </div>
                      <div>
                        <p className={`text-xl font-bold ${chw.activeCases > 0 ? 'text-red-600' : ''}`}>
                          {chw.activeCases}
                        </p>
                        <p className="text-xs text-muted-foreground">Active Cases</p>
                      </div>
                      <div>
                        <p className="text-xl font-bold">{chw.performance}%</p>
                        <p className="text-xs text-muted-foreground">Performance</p>
                      </div>
                    </div>

                    <div className="flex gap-2 mt-3">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={() => openWhatsApp(chw.phone)}
                      >
                        <MessageCircle className="h-4 w-4 mr-1" />
                        Message
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={() => window.open(`tel:${chw.phone}`, '_self')}
                      >
                        <Phone className="h-4 w-4 mr-1" />
                        Call
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Resources Tab */}
          <TabsContent value="resources" className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              {nurseResources.map((resource) => (
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
                              <span className="text-xs text-muted-foreground">{resource.type}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center justify-between mt-3">
                          <div className="text-sm text-muted-foreground">
                            <span>By {resource.author}</span>
                            <span className="mx-2">•</span>
                            <span>{new Date(resource.date).toLocaleDateString()}</span>
                            {resource.duration && (
                              <>
                                <span className="mx-2">•</span>
                                <span>{resource.duration}</span>
                              </>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline">
                              <Download className="h-4 w-4" />
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
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
