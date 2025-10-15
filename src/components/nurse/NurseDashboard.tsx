import { useState } from "react";
import { AlertTriangle, MessageCircle, Phone, Clock, CheckCircle, User, FileText, LogOut } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { mockEscalatedCases, mockMothers, mockCHWs } from "@/data/mockData";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { NurseProfile } from "./NurseProfile";

export function NurseDashboard() {
  const { user, logout } = useAuth();
  const [selectedCase, setSelectedCase] = useState<string | null>(null);
  const [showProfile, setShowProfile] = useState(false);
  const { toast } = useToast();

  const pendingCases = mockEscalatedCases.filter(c => c.status === 'pending');
  const resolvedCases = mockEscalatedCases.filter(c => c.status === 'resolved');

  const getCaseDetails = (caseId: string) => {
    const escalatedCase = mockEscalatedCases.find(c => c.id === caseId);
    const mother = mockMothers.find(m => m.id === escalatedCase?.motherId);
    const chw = mockCHWs.find(c => c.name === escalatedCase?.escalatedBy);
    return { escalatedCase, mother, chw };
  };

  const openWhatsApp = (phone: string) => {
    window.open(`https://wa.me/${phone.replace('+', '')}`, '_blank');
  };

  const openSMS = (phone: string) => {
    window.open(`sms:${phone}`, '_blank');
  };

  const resolveCase = (caseId: string) => {
    toast({
      title: "Case Resolved",
      description: "The case has been marked as resolved.",
    });
    setSelectedCase(null);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (showProfile) {
    return <NurseProfile onBack={() => setShowProfile(false)} />;
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
    <div className="min-h-screen bg-background">
      <div className="relative w-full">
        <div className="w-full bg-gradient-to-r from-primary to-primary/80 text-primary-foreground rounded-t-none shadow-sm flex items-center justify-between px-4 sm:px-6 py-4 sm:py-6" style={{marginTop:0, borderTopLeftRadius:0, borderTopRightRadius:0}}>
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-8 w-8" />
            <div className="min-w-0">
              <div className="text-2xl font-semibold">Nurse Supervisor Dashboard</div>
              <div className="text-primary-foreground/80">
                Monitor critical cases and support CHWs
              </div>
            </div>
          </div>
          <div className="flex items-center">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-14 w-14 rounded-full bg-white shadow-md hover:shadow-lg">
                  <Avatar className="h-14 w-14">
                    <AvatarFallback className="bg-primary text-primary-foreground text-xl">
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
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-destructive flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-lg sm:text-2xl font-bold text-destructive">{pendingCases.length}</p>
                <p className="text-xs sm:text-sm text-muted-foreground">Critical Alerts</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-success flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-lg sm:text-2xl font-bold text-success">{resolvedCases.length}</p>
                <p className="text-xs sm:text-sm text-muted-foreground">Resolved Today</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 sm:h-5 sm:w-5 text-accent flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-lg sm:text-2xl font-bold">{mockCHWs.length}</p>
                <p className="text-xs sm:text-sm text-muted-foreground">Active CHWs</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="alerts" className="space-y-6">
        <TabsList>
          <TabsTrigger value="alerts">Critical Alerts</TabsTrigger>
          <TabsTrigger value="resources">Resources</TabsTrigger>
          <TabsTrigger value="communication">Communication</TabsTrigger>
        </TabsList>

        <TabsContent value="alerts" className="space-y-4">
          <div className="space-y-4">
            {pendingCases.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <CheckCircle className="h-12 w-12 text-success mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Critical Alerts</h3>
                  <p className="text-muted-foreground">
                    All mothers are doing well. Great work by the CHW team!
                  </p>
                </CardContent>
              </Card>
            ) : (
              pendingCases.map((escalatedCase) => {
                const { mother, chw } = getCaseDetails(escalatedCase.id);
                return (
                  <Card key={escalatedCase.id} className="border-destructive/20">
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-destructive" />
                            {escalatedCase.motherName}
                          </CardTitle>
                          <CardDescription>
                            Escalated by {escalatedCase.escalatedBy} • {formatDate(escalatedCase.escalatedAt)}
                          </CardDescription>
                        </div>
                        <Badge variant="destructive">Critical</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="p-3 bg-destructive/5 rounded-lg border border-destructive/10">
                          <p className="font-medium text-destructive mb-1">Issue Reported:</p>
                          <p className="text-sm">{escalatedCase.issue}</p>
                        </div>

                        <div className="flex gap-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button size="sm" className="flex-1">
                                <FileText className="h-3 w-3 mr-1" />
                                View Case
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                              <DialogHeader>
                                <DialogTitle>Case Details - {escalatedCase.motherName}</DialogTitle>
                                <DialogDescription>
                                  Critical case escalated from CHW
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <h4 className="font-medium mb-2">Mother Information</h4>
                                    <div className="space-y-1 text-sm">
                                      <p><span className="font-medium">Name:</span> {mother?.name}</p>
                                      <p><span className="font-medium">Phone:</span> {mother?.phone}</p>
                                      <p><span className="font-medium">Status:</span> {
                                        mother?.pregnancyWeek ? `${mother.pregnancyWeek} weeks pregnant` : 
                                        `${mother?.postpartumWeek} weeks postpartum`
                                      }</p>
                                    </div>
                                  </div>
                                  <div>
                                    <h4 className="font-medium mb-2">CHW Information</h4>
                                    <div className="space-y-1 text-sm">
                                      <p><span className="font-medium">Name:</span> {chw?.name}</p>
                                      <p><span className="font-medium">Phone:</span> {chw?.phone}</p>
                                      <p><span className="font-medium">Escalated:</span> {formatDate(escalatedCase.escalatedAt)}</p>
                                    </div>
                                  </div>
                                </div>
                                
                                <div>
                                  <h4 className="font-medium mb-2">Issue Details</h4>
                                  <div className="p-3 bg-destructive/5 rounded-lg">
                                    <p className="text-sm">{escalatedCase.issue}</p>
                                  </div>
                                </div>

                                <div className="flex gap-2">
                                  <Button 
                                    onClick={() => openWhatsApp(mother?.phone || '')}
                                    className="flex-1 bg-green-600 hover:bg-green-700"
                                    size="sm"
                                  >
                                    <MessageCircle className="h-3 w-3 mr-1" />
                                    Message Mother
                                  </Button>
                                  <Button 
                                    onClick={() => openWhatsApp(chw?.phone || '')}
                                    variant="outline"
                                    className="flex-1"
                                    size="sm"
                                  >
                                    <MessageCircle className="h-3 w-3 mr-1" />
                                    Contact CHW
                                  </Button>
                                  <Button 
                                    onClick={() => resolveCase(escalatedCase.id)}
                                    className="flex-1"
                                    size="sm"
                                  >
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    Mark Resolved
                                  </Button>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                          
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openWhatsApp(chw?.phone || '')}
                            className="flex-1"
                          >
                            <MessageCircle className="h-3 w-3 mr-1" />
                            Contact CHW
                          </Button>
                          
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => window.open(`tel:${mother?.phone}`, '_self')}
                            className="flex-1"
                          >
                            <Phone className="h-3 w-3 mr-1" />
                            Call Mother
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </TabsContent>

        <TabsContent value="resources" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Educational Resources</CardTitle>
              <CardDescription>
                Resource library for CHWs and mothers
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { title: "Emergency Response Protocols", type: "PDF", category: "Critical Care" },
                  { title: "Maternal Health Guidelines", type: "PDF", category: "General" },
                  { title: "Nutrition Counseling Guide", type: "PDF", category: "Education" },
                  { title: "Mental Health Support", type: "Video", category: "Wellness" },
                  { title: "Postpartum Depression Signs", type: "PDF", category: "Mental Health" },
                  { title: "Family Planning Methods", type: "PDF", category: "Education" },
                ].map((resource, index) => (
                  <Card key={index}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium mb-1">{resource.title}</h4>
                          <div className="flex gap-2">
                            <Badge variant="secondary" className="text-xs">
                              {resource.type}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {resource.category}
                            </Badge>
                          </div>
                        </div>
                        <Button size="sm" variant="outline">
                          View
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="communication" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Quick Communication</CardTitle>
              <CardDescription>
                Contact CHWs and mothers directly
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-3">Active CHWs</h4>
                  <div className="space-y-2">
                    {mockCHWs.map((chw) => (
                      <Card key={chw.id}>
                        <CardContent className="p-3">
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="font-medium">{chw.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {chw.assignedMothers.length} mothers assigned
                              </p>
                            </div>
                            <div className="flex gap-1">
                              <Button
                                size="sm"
                                onClick={() => openWhatsApp(chw.phone)}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                <MessageCircle className="h-3 w-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => window.open(`tel:${chw.phone}`, '_self')}
                              >
                                <Phone className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-3">Recent Contacts</h4>
                  <div className="space-y-2">
                    <Card>
                      <CardContent className="p-3">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-medium">Mary Akinyi</p>
                            <p className="text-sm text-muted-foreground">
                              <Clock className="h-3 w-3 inline mr-1" />
                              2 hours ago
                            </p>
                          </div>
                          <Badge variant="destructive">Critical</Badge>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-3">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-medium">James Kiprotich</p>
                            <p className="text-sm text-muted-foreground">
                              <Clock className="h-3 w-3 inline mr-1" />
                              4 hours ago
                            </p>
                          </div>
                          <Badge variant="outline">CHW</Badge>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}