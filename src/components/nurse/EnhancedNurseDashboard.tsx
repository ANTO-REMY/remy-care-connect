import { useState, useEffect, useCallback } from "react";
import {
  AlertTriangle, MessageCircle, Phone, Clock, CheckCircle, User, FileText,
  LogOut, Search, Filter, TrendingUp, Activity, Heart, Stethoscope,
  ChevronRight, MoreHorizontal, Calendar, MapPin, BadgeCheck,
  Video, Download, Share2, Bell, Settings, BarChart3, Users,
  ArrowUpRight, ArrowDownRight, Sparkles, Star, ClipboardCheck,
  CheckCircle2, XCircle, Clock4, UserCheck, Briefcase
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
import { NurseProfile } from "./NurseProfile";

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

  const [showProfile, setShowProfile] = useState(false);
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

  // Filter cases
  const filteredCases = mockEscalatedCases.filter(caseItem => {
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

  const handleResolveCase = () => {
    toast({
      title: "Case Resolved",
      description: "The case has been marked as resolved and the CHW has been notified.",
    });
    setShowCaseDetails(false);
  };

  const handleAddNote = () => {
    if (!caseNotes.trim()) return;
    toast({
      title: "Note Added",
      description: "Your note has been added to the case.",
    });
    setCaseNotes("");
  };

  const markNotificationRead = (id: number) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  if (showProfile) {
    return <NurseProfile onBack={() => setShowProfile(false)} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50">
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
                    disabled={!caseNotes.trim()}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Add Note
                  </Button>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Button
                    className="flex-1 bg-green-600 hover:bg-green-700"
                    onClick={handleResolveCase}
                  >
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Mark as Resolved
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => openWhatsApp(selectedCase.motherPhone)}
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

      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-purple-500 to-pink-600 p-2 rounded-xl">
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
                  <DropdownMenuItem onClick={() => setShowProfile(true)}>
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
            You have <span className="font-semibold text-red-600">{mockEscalatedCases.filter(c => c.status !== 'resolved').length} active cases</span> requiring your attention.
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm">Total Cases</p>
                  <p className="text-3xl font-bold">{weeklyStats.totalCases}</p>
                </div>
                <ClipboardCheck className="h-8 w-8 text-purple-200" />
              </div>
              <div className="flex items-center gap-1 mt-2 text-sm">
                <ArrowUpRight className="h-4 w-4 text-green-300" />
                <span className="text-green-300">+{weeklyStats.casesChange}</span>
                <span className="text-purple-200">this week</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-0">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm">Resolved</p>
                  <p className="text-3xl font-bold">{weeklyStats.resolvedCases}</p>
                </div>
                <CheckCircle2 className="h-8 w-8 text-green-200" />
              </div>
              <div className="flex items-center gap-1 mt-2 text-sm">
                <ArrowUpRight className="h-4 w-4 text-green-300" />
                <span className="text-green-300">+{weeklyStats.resolvedChange}</span>
                <span className="text-green-200">this week</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-amber-500 to-amber-600 text-white border-0">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-amber-100 text-sm">Pending</p>
                  <p className="text-3xl font-bold">{weeklyStats.pendingCases}</p>
                </div>
                <Clock4 className="h-8 w-8 text-amber-200" />
              </div>
              <div className="flex items-center gap-1 mt-2 text-sm">
                <ArrowDownRight className="h-4 w-4 text-green-300" />
                <span className="text-green-300">{weeklyStats.pendingChange}</span>
                <span className="text-amber-200">from last week</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-red-500 to-red-600 text-white border-0">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-red-100 text-sm">Critical</p>
                  <p className="text-3xl font-bold">{weeklyStats.criticalCases}</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-red-200" />
              </div>
              <div className="flex items-center gap-1 mt-2 text-sm">
                <ArrowUpRight className="h-4 w-4 text-amber-300" />
                <span className="text-amber-300">+{weeklyStats.criticalChange}</span>
                <span className="text-red-200">needs attention</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="cases">Escalated Cases</TabsTrigger>
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

                        <div className="flex items-center justify-between mt-3">
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
                          <Button size="sm" variant="outline">
                            View Details
                            <ChevronRight className="h-4 w-4 ml-1" />
                          </Button>
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

          {/* CHWs Tab */}
          <TabsContent value="chws" className="space-y-4">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {mockCHWs.map((chw) => (
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
