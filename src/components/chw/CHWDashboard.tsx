import { useState } from "react";
import { Users, AlertTriangle, MessageCircle, Phone, Upload, Calendar, CheckCircle, X, User, LogOut } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { mockMothers, mockCHWs, currentUser } from "@/data/mockData";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { CHWProfile } from "./CHWProfile";

export function CHWDashboard() {
  const { user, logout } = useAuth();
  const [showIssuesOnly, setShowIssuesOnly] = useState(false);
  const [escalationModal, setEscalationModal] = useState(false);
  const [selectedMother, setSelectedMother] = useState<string>("");
  const [issueType, setIssueType] = useState<string>("");
  const [issueDescription, setIssueDescription] = useState("");
  const [showProfile, setShowProfile] = useState(false);
  const { toast } = useToast();

  // For demo, using first CHW
  const currentCHW = mockCHWs[0];
  const assignedMothers = mockMothers.filter(m => 
    currentCHW.assignedMothers.includes(m.id)
  );

  const mothersWithIssues = assignedMothers.filter(m => 
    m.status === 'not_ok' || m.status === 'no_response'
  );

  const displayedMothers = showIssuesOnly ? mothersWithIssues : assignedMothers;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ok': return 'bg-success text-success-foreground';
      case 'not_ok': return 'bg-destructive text-destructive-foreground';
      case 'no_response': return 'bg-warning text-warning-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'ok': return 'OK';
      case 'not_ok': return 'Not OK';
      case 'no_response': return 'No Response';
      default: return 'Unknown';
    }
  };

  const openWhatsApp = (phone: string) => {
    window.open(`https://wa.me/${phone.replace('+', '')}`, '_blank');
  };

  const openSMS = (phone: string) => {
    window.open(`sms:${phone}`, '_blank');
  };

  const handleEscalation = () => {
    if (!selectedMother || !issueType || !issueDescription) {
      toast({
        title: "Missing Information",
        description: "Please fill in all fields before escalating.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Case Escalated",
      description: "The case has been escalated to the nurse supervisor.",
    });

    setEscalationModal(false);
    setSelectedMother("");
    setIssueType("");
    setIssueDescription("");
  };

  if (showProfile) {
    return <CHWProfile onBack={() => setShowProfile(false)} />;
  }

  const handleLogout = () => {
    logout();
    window.location.href = '/';
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <div className="space-y-6">
      {/* Profile and Logout */}
      <div className="fixed top-4 right-4 z-50">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-10 w-10 rounded-full bg-white shadow-md hover:shadow-lg">
              <Avatar className="h-10 w-10">
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {getInitials(user?.name || 'U')}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{user?.name}</p>
                <p className="text-xs leading-none text-muted-foreground">
                  {user?.phone}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setShowProfile(true)}>
              <User className="mr-2 h-4 w-4" />
              <span>Profile</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Header */}
      <Card className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground">
        <CardHeader>
          <div className="flex items-center gap-3">
            <Users className="h-8 w-8" />
            <div>
              <CardTitle className="text-2xl">Welcome, {currentCHW.name}</CardTitle>
              <CardDescription className="text-primary-foreground/80">
                Community Health Worker Dashboard
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 sm:h-5 sm:w-5 text-accent flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-lg sm:text-2xl font-bold">{assignedMothers.length}</p>
                <p className="text-xs sm:text-sm text-muted-foreground">Total Mothers</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-success flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-lg sm:text-2xl font-bold text-success">
                  {assignedMothers.filter(m => m.status === 'ok').length}
                </p>
                <p className="text-xs sm:text-sm text-muted-foreground">Doing Well</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-destructive flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-lg sm:text-2xl font-bold text-destructive">
                  {assignedMothers.filter(m => m.status === 'not_ok').length}
                </p>
                <p className="text-xs sm:text-sm text-muted-foreground">Need Attention</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-warning flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-lg sm:text-2xl font-bold text-warning">
                  {assignedMothers.filter(m => m.status === 'no_response').length}
                </p>
                <p className="text-xs sm:text-sm text-muted-foreground">No Response</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="mothers" className="space-y-6">
        <TabsList>
          <TabsTrigger value="mothers">My Mothers</TabsTrigger>
          <TabsTrigger value="education">Education Materials</TabsTrigger>
        </TabsList>

        <TabsContent value="mothers" className="space-y-4">
          {/* Controls */}
          <div className="flex flex-col sm:flex-row gap-4 justify-between">
            <Button
              variant={showIssuesOnly ? "default" : "outline"}
              onClick={() => setShowIssuesOnly(!showIssuesOnly)}
              className="w-fit"
            >
              <AlertTriangle className="h-4 w-4 mr-2" />
              {showIssuesOnly ? 'Show All' : 'Show Issues Only'}
            </Button>

            <Dialog open={escalationModal} onOpenChange={setEscalationModal}>
              <DialogTrigger asChild>
                <Button variant="destructive">
                  <Upload className="h-4 w-4 mr-2" />
                  Escalate Case
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Escalate Case to Nurse</DialogTitle>
                  <DialogDescription>
                    Report a critical issue that requires nurse supervision.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Select Mother</label>
                    <Select value={selectedMother} onValueChange={setSelectedMother}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a mother" />
                      </SelectTrigger>
                      <SelectContent>
                        {mothersWithIssues.map(mother => (
                          <SelectItem key={mother.id} value={mother.id}>
                            {mother.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium">Issue Type</label>
                    <Select value={issueType} onValueChange={setIssueType}>
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
                    <label className="text-sm font-medium">Description</label>
                    <Textarea
                      value={issueDescription}
                      onChange={(e) => setIssueDescription(e.target.value)}
                      placeholder="Describe the issue in detail..."
                      rows={3}
                    />
                  </div>
                  
                  <div className="flex gap-2">
                    <Button onClick={handleEscalation} className="flex-1">
                      Escalate Case
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => setEscalationModal(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Mothers List */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
            {displayedMothers.map((mother) => (
              <Card key={mother.id} className="relative">
                <CardHeader className="pb-3 p-3 sm:p-6 sm:pb-3">
                  <div className="flex flex-col sm:flex-row justify-between items-start gap-2 sm:gap-0">
                    <div className="min-w-0 flex-1">
                      <CardTitle className="text-base sm:text-lg break-words">{mother.name}</CardTitle>
                      <CardDescription className="text-xs sm:text-sm">
                        {mother.pregnancyWeek ? `${mother.pregnancyWeek} weeks pregnant` : `${mother.postpartumWeek} weeks postpartum`}
                      </CardDescription>
                    </div>
                    <Badge className={`${getStatusColor(mother.status)} text-xs flex-shrink-0`}>
                      {getStatusText(mother.status)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-3 sm:p-6 pt-0">
                  <div className="space-y-3">
                    <div className="text-xs sm:text-sm">
                      <p className="text-muted-foreground">Last check-in: {mother.lastCheckIn}</p>
                      {mother.issues && (
                        <div className="mt-2">
                          <p className="font-medium text-destructive text-xs sm:text-sm">Issues reported:</p>
                          <ul className="list-disc list-inside text-xs sm:text-sm text-muted-foreground space-y-1">
                            {mother.issues.map((issue, index) => (
                              <li key={index} className="break-words">{issue}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Button
                        size="sm"
                        onClick={() => openWhatsApp(mother.phone)}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-xs sm:text-sm"
                      >
                        <MessageCircle className="h-3 w-3 mr-1" />
                        <span className="hidden sm:inline">WhatsApp</span>
                        <span className="sm:hidden">WA</span>
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openSMS(mother.phone)}
                        className="flex-1 text-xs sm:text-sm"
                      >
                        <MessageCircle className="h-3 w-3 mr-1" />
                        SMS
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.open(`tel:${mother.phone}`, '_self')}
                        className="flex-1 text-xs sm:text-sm"
                      >
                        <Phone className="h-3 w-3 mr-1" />
                        Call
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="education" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Education Materials</CardTitle>
              <CardDescription>
                Download and share educational content with mothers
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { title: "Nutrition During Pregnancy", type: "PDF", size: "2.3 MB" },
                  { title: "Warning Signs to Watch", type: "PDF", size: "1.8 MB" },
                  { title: "Safe Exercise Guide", type: "Video", size: "45 MB" },
                  { title: "Postpartum Care", type: "PDF", size: "3.1 MB" },
                ].map((material, index) => (
                  <Card key={index}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <h4 className="font-medium">{material.title}</h4>
                          <p className="text-sm text-muted-foreground">
                            {material.type} • {material.size}
                          </p>
                        </div>
                        <div className="flex gap-1">
                          <Button size="sm" variant="outline">
                            Download
                          </Button>
                          <Button size="sm">
                            Share
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}