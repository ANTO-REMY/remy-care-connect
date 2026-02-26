import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users, AlertTriangle, MessageCircle, Phone, Upload, Calendar, CheckCircle,
  X, User, LogOut, Search, Filter, MapPin, TrendingUp, Activity,
  Heart, Baby, Clock, ChevronRight, MoreHorizontal, FileText,
  Video, Download, Share2, Bell, Settings, BarChart3, Stethoscope,
  ClipboardList, ArrowUpRight, ArrowDownRight, Sparkles, Star, Camera
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
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
import { chwService } from "@/services/chwService";
import { apiClient } from "@/lib/apiClient";

// Mock data for mothers
const mockMothers = [
  {
    id: 1,
    name: "Mary Wanjiku",
    phone_number: "+254712345678",
    status: "ok",
    last_check_in: "Today, 8:30 AM",
    weeks_pregnant: 28,
    location: "Kibera",
    due_date: "2024-05-15",
    risk_level: "low",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop",
    check_in_history: [
      { date: "2024-02-20", status: "ok" },
      { date: "2024-02-19", status: "ok" },
      { date: "2024-02-18", status: "not_ok" },
    ]
  },
  {
    id: 2,
    name: "Grace Akinyi",
    phone_number: "+254723456789",
    status: "not_ok",
    last_check_in: "Yesterday, 6:00 PM",
    weeks_pregnant: 32,
    location: "Kibera",
    due_date: "2024-04-20",
    risk_level: "high",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop",
    notes: "Reported headaches and swelling",
    check_in_history: [
      { date: "2024-02-20", status: "not_ok" },
      { date: "2024-02-19", status: "ok" },
      { date: "2024-02-18", status: "ok" },
    ]
  },
  {
    id: 3,
    name: "Esther Muthoni",
    phone_number: "+254734567890",
    status: "no_response",
    last_check_in: "3 days ago",
    weeks_pregnant: 24,
    location: "Mathare",
    due_date: "2024-06-10",
    risk_level: "medium",
    avatar: "https://images.unsplash.com/photo-1489424731084-a5d8b219a5bb?w=100&h=100&fit=crop",
    check_in_history: [
      { date: "2024-02-17", status: "ok" },
      { date: "2024-02-16", status: "ok" },
      { date: "2024-02-15", status: "ok" },
    ]
  },
  {
    id: 4,
    name: "Joyce Kemunto",
    phone_number: "+254745678901",
    status: "ok",
    last_check_in: "Today, 9:15 AM",
    weeks_pregnant: 36,
    location: "Kibera",
    due_date: "2024-03-25",
    risk_level: "low",
    avatar: "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=100&h=100&fit=crop",
    check_in_history: [
      { date: "2024-02-20", status: "ok" },
      { date: "2024-02-19", status: "ok" },
      { date: "2024-02-18", status: "ok" },
    ]
  },
  {
    id: 5,
    name: "Faith Chebet",
    phone_number: "+254756789012",
    status: "ok",
    last_check_in: "Today, 7:45 AM",
    weeks_pregnant: 20,
    location: "Mathare",
    due_date: "2024-07-15",
    risk_level: "low",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop",
    check_in_history: [
      { date: "2024-02-20", status: "ok" },
      { date: "2024-02-19", status: "ok" },
      { date: "2024-02-18", status: "ok" },
    ]
  },
];

// Mock data for escalated cases
const mockEscalatedCases = [
  {
    id: 1,
    motherId: 2,
    motherName: "Grace Akinyi",
    issue: "Severe headaches and vision problems",
    issueType: "preeclampsia",
    escalatedAt: "2024-02-20T14:30:00",
    status: "pending",
    priority: "high",
    notes: "Mother reported persistent headaches and blurred vision. Blood pressure elevated during last visit.",
  },
];

// Mock data for educational materials
const educationalMaterials = [
  {
    id: 1,
    title: "Nutrition During Pregnancy",
    type: "PDF",
    size: "2.3 MB",
    category: "Nutrition",
    downloads: 156,
    thumbnail: "🥗"
  },
  {
    id: 2,
    title: "Warning Signs to Watch",
    type: "PDF",
    size: "1.8 MB",
    category: "Safety",
    downloads: 234,
    thumbnail: "⚠️"
  },
  {
    id: 3,
    title: "Safe Exercise Guide",
    type: "Video",
    size: "45 MB",
    category: "Wellness",
    downloads: 89,
    thumbnail: "🧘‍♀️",
    duration: "12:30"
  },
  {
    id: 4,
    title: "Postpartum Care",
    type: "PDF",
    size: "3.1 MB",
    category: "Postpartum",
    downloads: 178,
    thumbnail: "👶"
  },
  {
    id: 5,
    title: "Breastfeeding Basics",
    type: "Video",
    size: "28 MB",
    category: "Breastfeeding",
    downloads: 267,
    thumbnail: "🤱",
    duration: "18:45"
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

export function EnhancedCHWDashboard({ isFirstLogin = false }: CHWDashboardProps) {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [showPhotoUpload, setShowPhotoUpload] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [selectedMother, setSelectedMother] = useState<typeof mockMothers[0] | null>(null);
  const [showMotherDetails, setShowMotherDetails] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showEscalationModal, setShowEscalationModal] = useState(false);
  const [escalationForm, setEscalationForm] = useState({
    motherId: "",
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
  const [notifications, setNotifications] = useState([
    { id: 1, message: "Grace Akinyi reported feeling unwell", time: "10 min ago", read: false },
    { id: 2, message: "New mother assigned to you", time: "1 hour ago", read: false },
    { id: 3, message: "Weekly report ready", time: "3 hours ago", read: true },
  ]);

  // Filter mothers based on search and status
  const filteredMothers = mockMothers.filter(mother => {
    const matchesSearch = mother.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      mother.phone_number.includes(searchQuery);
    const matchesStatus = statusFilter === "all" || mother.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const mothersWithIssues = mockMothers.filter(m => m.status === 'not_ok' || m.status === 'no_response');

  const getStatusColor = (status: string) => {
    switch (status) {
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

  const openWhatsApp = (phone: string) => {
    window.open(`https://wa.me/${phone.replace('+', '')}`, '_blank');
  };

  const openSMS = (phone: string) => {
    window.open(`sms:${phone}`, '_blank');
  };

  const handleEscalation = async () => {
    if (!escalationForm.motherId || !escalationForm.issueType || !escalationForm.description) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields before escalating.",
        variant: "destructive",
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
            case_description: escalationForm.description,
            issue_type: escalationForm.issueType,
            priority: escalationForm.priority,
          });
          // Add to local real escalations list
          setRealEscalations((prev) => [
            {
              id: created.id,
              motherId: created.mother_id ?? 0,
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
          toast({
            title: "Case Escalated ✓",
            description: `Case for ${created.mother_name} sent to nurse successfully.`,
          });
        } catch (err: any) {
          toast({
            title: "Escalation Failed",
            description: err.message || "Could not submit escalation. Please try again.",
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
    setEscalationForm({ motherId: "", nurseId: "", issueType: "", description: "", priority: "high" });
  };

  const handleMotherClick = (mother: typeof mockMothers[0]) => {
    setSelectedMother(mother);
    setShowMotherDetails(true);
  };

  const markNotificationRead = (id: number) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  // Load profile photo, CHW profile ID, nurses list and real escalations on mount
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
        if (isMounted) setChwProfileId(profile.id);

        // Load real escalations submitted by this CHW
        const escalResp = await escalationService.list({ chw_id: profile.id });
        if (isMounted && escalResp.escalations.length > 0) {
          // Merge with mock structure for UI compatibility
          const mapped = escalResp.escalations.map((e) => ({
            id: e.id,
            motherId: e.mother_id ?? 0,
            motherName: e.mother_name,
            issue: e.case_description,
            issueType: e.issue_type ?? e.case_description,
            escalatedAt: e.created_at,
            status: e.status as "pending" | "in_progress" | "resolved" | "rejected",
            priority: e.priority as "low" | "medium" | "high" | "critical",
            notes: e.notes ?? "",
          }));
          setRealEscalations(mapped as typeof mockEscalatedCases);
        }
      } catch { /* keep mock data if API unavailable */ }

      // Nurses list for escalation form
      try {
        const resp = await apiClient.get<{ nurses: { nurse_id: number; name: string }[] }>('/nurses');
        if (isMounted && resp.nurses?.length) setAvailableNurses(resp.nurses);
      } catch { /* keep empty; CHW can't escalate without a nurse in DB */ }
    })();
    return () => { isMounted = false; };
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
    } catch (err: any) {
      toast({
        title: "Upload failed",
        description: err.message || "Could not upload photo.",
        variant: "destructive",
      });
    }
  };

  return (
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
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-4xl">
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
                      <span>•</span>
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

                {/* Quick Actions */}
                <div className="flex gap-2">
                  <Button
                    className="flex-1 bg-green-600 hover:bg-green-700"
                    onClick={() => openWhatsApp(selectedMother.phone_number)}
                  >
                    <MessageCircle className="h-4 w-4 mr-2" />
                    WhatsApp
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => openSMS(selectedMother.phone_number)}
                  >
                    <MessageCircle className="h-4 w-4 mr-2" />
                    SMS
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => window.open(`tel:${selectedMother.phone_number}`, '_self')}
                  >
                    <Phone className="h-4 w-4 mr-2" />
                    Call
                  </Button>
                </div>
              </div>
            </>
          )}
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
                  {mothersWithIssues.map(mother => (
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
                  <SelectItem value="critical">🔴 Critical</SelectItem>
                  <SelectItem value="high">🟠 High</SelectItem>
                  <SelectItem value="medium">🟡 Medium</SelectItem>
                  <SelectItem value="low">🟢 Low</SelectItem>
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
            <Button onClick={handleEscalation} className="flex-1" disabled={escalationSubmitting}>
              {escalationSubmitting ? (
                <><Activity className="h-4 w-4 mr-2 animate-spin" />Submitting...</>
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

      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-2 rounded-xl">
                <Users className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-lg bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
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
                      className={`flex flex-col items-start p-3 ${!notification.read ? 'bg-blue-50' : ''}`}
                      onClick={() => markNotificationRead(notification.id)}
                    >
                      <span className="text-sm">{notification.message}</span>
                      <span className="text-xs text-muted-foreground">{notification.time}</span>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Profile */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                    <Avatar className="h-10 w-10 ring-2 ring-blue-200">
                      <AvatarImage src={profileImage || undefined} />
                      <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
                        {user?.first_name?.charAt(0).toUpperCase() || 'C'}
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
                  <DropdownMenuItem onClick={() => navigate("/dashboard/chw/profile")}>
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
            Welcome back, {user?.first_name || 'CHW'}! 👋
          </h2>
          <p className="text-muted-foreground">
            You have <span className="font-semibold text-red-600">{mothersWithIssues.length} mothers</span> who need attention today.
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm">Total Mothers</p>
                  <p className="text-3xl font-bold">{mockMothers.length}</p>
                </div>
                <Users className="h-8 w-8 text-blue-200" />
              </div>
              <div className="flex items-center gap-1 mt-2 text-sm">
                <ArrowUpRight className="h-4 w-4 text-green-300" />
                <span className="text-green-300">+{weeklyStats.registrationChange}</span>
                <span className="text-blue-200">this week</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-0">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm">Doing Well</p>
                  <p className="text-3xl font-bold">{mockMothers.filter(m => m.status === 'ok').length}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-200" />
              </div>
              <div className="flex items-center gap-1 mt-2 text-sm">
                <ArrowUpRight className="h-4 w-4 text-green-300" />
                <span className="text-green-300">+{weeklyStats.checkInChange}</span>
                <span className="text-green-200">check-ins</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-red-500 to-red-600 text-white border-0">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-red-100 text-sm">Need Attention</p>
                  <p className="text-3xl font-bold">{mothersWithIssues.length}</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-red-200" />
              </div>
              <div className="flex items-center gap-1 mt-2 text-sm">
                <ArrowDownRight className="h-4 w-4 text-green-300" />
                <span className="text-green-300">{weeklyStats.issuesChange}</span>
                <span className="text-red-200">from last week</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-amber-500 to-amber-600 text-white border-0">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-amber-100 text-sm">Escalated</p>
                  <p className="text-3xl font-bold">{(realEscalations ?? mockEscalatedCases).length}</p>
                </div>
                <Upload className="h-8 w-8 text-amber-200" />
              </div>
              <div className="flex items-center gap-1 mt-2 text-sm">
                <span className="text-amber-200">Pending review</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="mothers">My Mothers</TabsTrigger>
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
                onClick={() => setShowEscalationModal(true)}
                disabled={mothersWithIssues.length === 0}
              >
                <Upload className="h-4 w-4 mr-2" />
                Escalate Case
              </Button>
            </div>

            {/* Mothers Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredMothers.map((mother) => (
                <Card
                  key={mother.id}
                  className="cursor-pointer hover:shadow-lg transition-all group"
                  onClick={() => handleMotherClick(mother)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={mother.avatar} />
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          {mother.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-medium truncate">{mother.name}</p>
                            <p className="text-xs text-muted-foreground">{mother.phone_number}</p>
                          </div>
                          <Badge className={`${getStatusColor(mother.status)} text-xs`}>
                            {getStatusText(mother.status)}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                          <MapPin className="h-3 w-3" />
                          {mother.location}
                          <span>•</span>
                          <Baby className="h-3 w-3" />
                          {mother.weeks_pregnant} weeks
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          {getRiskBadge(mother.risk_level)}
                          <span className="text-xs text-muted-foreground">
                            Last: {mother.last_check_in}
                          </span>
                        </div>
                      </div>
                    </div>

                    <Separator className="my-3" />

                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 text-xs"
                        onClick={(e) => {
                          e.stopPropagation();
                          openWhatsApp(mother.phone_number);
                        }}
                      >
                        <MessageCircle className="h-3 w-3 mr-1" />
                        WhatsApp
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 text-xs"
                        onClick={(e) => {
                          e.stopPropagation();
                          openSMS(mother.phone_number);
                        }}
                      >
                        <MessageCircle className="h-3 w-3 mr-1" />
                        SMS
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 text-xs"
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(`tel:${mother.phone_number}`, '_self');
                        }}
                      >
                        <Phone className="h-3 w-3 mr-1" />
                        Call
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {filteredMothers.length === 0 && (
              <Card className="p-8 text-center">
                <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-medium mb-2">No mothers found</h3>
                <p className="text-muted-foreground">Try adjusting your search or filter criteria</p>
              </Card>
            )}
          </TabsContent>

          {/* Escalated Cases Tab */}
          <TabsContent value="cases" className="space-y-4">
            {/* Show real escalations if loaded, otherwise mock */}
            {(() => {
              const displayCases = realEscalations ?? mockEscalatedCases;
              if (displayCases.length === 0) return (
                <Card className="p-8 text-center">
                  <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
                  <h3 className="text-lg font-medium mb-2">No Escalated Cases</h3>
                  <p className="text-muted-foreground">All mothers are doing well. Great work!</p>
                </Card>
              );
              return displayCases.map((caseItem) => (
                <Card key={caseItem.id} className="border-red-200">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="bg-red-100 p-2 rounded-lg">
                          <AlertTriangle className="h-5 w-5 text-red-600" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{caseItem.motherName}</CardTitle>
                          <CardDescription>
                            Escalated {new Date(caseItem.escalatedAt).toLocaleString()}
                          </CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={
                          caseItem.status === 'pending' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                          caseItem.status === 'in_progress' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                          caseItem.status === 'resolved' ? 'bg-green-50 text-green-700 border-green-200' :
                          'bg-gray-50 text-gray-700 border-gray-200'
                        }>
                          {caseItem.status.replace('_', ' ')}
                        </Badge>
                        <Badge variant="destructive">{caseItem.priority} priority</Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="p-4 bg-red-50 rounded-lg border border-red-100">
                        <p className="font-medium text-red-800 mb-1">Issue: {caseItem.issueType}</p>
                        <p className="text-sm text-red-700">{caseItem.notes}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button className="flex-1">
                          <Stethoscope className="h-4 w-4 mr-2" />
                          View Full Case
                        </Button>
                        <Button variant="outline">
                          <MessageCircle className="h-4 w-4 mr-2" />
                          Contact Nurse
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ));
            })()}
          </TabsContent>

          {/* Resources Tab */}
          <TabsContent value="resources" className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              {educationalMaterials.map((material) => (
                <Card key={material.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div className="text-4xl">{material.thumbnail}</div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-medium">{material.title}</h4>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="outline">{material.category}</Badge>
                              <span className="text-xs text-muted-foreground">{material.type}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center justify-between mt-3">
                          <div className="flex items-center gap-3 text-sm text-muted-foreground">
                            <span>{material.size}</span>
                            {material.duration && <span>• {material.duration}</span>}
                            <span>• {material.downloads} downloads</span>
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
