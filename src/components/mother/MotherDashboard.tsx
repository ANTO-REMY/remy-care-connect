import { useState, useEffect } from "react";
import { Baby, MessageCircle, Phone, AlertCircle, BookOpen, CheckCircle, X, User, LogOut } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { motherService, type Mother } from "@/services/motherService";
import { useToast } from "@/hooks/use-toast";
import { MotherProfile } from "./MotherProfile";
import { NextOfKinModal } from "./NextOfKinModal";

export function MotherDashboard() {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const [showCheckInModal, setShowCheckInModal] = useState(false);
  const [checkInResponse, setCheckInResponse] = useState<'ok' | 'not_ok' | null>(null);
  const [showProfile, setShowProfile] = useState(false);
  const [showNextOfKinModal, setShowNextOfKinModal] = useState(false);
  const [motherProfile, setMotherProfile] = useState<Mother | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasNextOfKin, setHasNextOfKin] = useState(false);

  useEffect(() => {
    loadMotherData();
  }, []);

  const loadMotherData = async () => {
    try {
      setLoading(true);
      
      // Fetch mother profile
      const profile = await motherService.getCurrentProfile();
      setMotherProfile(profile);
      
      // Check if next of kin exists
      const nextOfKin = await motherService.getNextOfKin(profile.id);
      setHasNextOfKin(nextOfKin.length > 0);
      
      // Show next of kin modal if profile incomplete
      if (!profile.date_of_birth || !profile.due_date || !profile.location) {
        // Profile incomplete - redirect to complete profile
        setShowProfile(true);
      } else if (nextOfKin.length === 0) {
        // Show next of kin modal if none exists
        setShowNextOfKinModal(true);
      }
    } catch (error: any) {
      console.error('Error loading mother data:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to load profile data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async (response: 'ok' | 'not_ok') => {
    if (!motherProfile) return;
    
    try {
      setCheckInResponse(response);
      
      await motherService.createDailyCheckIn(motherProfile.id, {
        feeling: response === 'ok' ? 'good' : 'poor',
        notes: response === 'not_ok' ? 'User indicated not feeling well' : undefined
      });
      
      toast({
        title: "Check-in recorded",
        description: response === 'ok' ? "Great! Keep taking care of yourself." : "Your CHW will be notified.",
      });
    } catch (error) {
      console.error('Check-in error:', error);
      toast({
        title: "Error",
        description: "Failed to record check-in",
        variant: "destructive"
      });
    }
  };

  const openWhatsApp = (phone: string) => {
    window.open(`https://wa.me/${phone.replace('+', '')}`, '_blank');
  };

  const openSMS = (phone: string) => {
    window.open(`sms:${phone}`, '_blank');
  };

  const handleNextOfKinSave = async (kin: any[]) => {
    if (!motherProfile || kin.length === 0) return;
    
    try {
      const kinData = kin[0]; // Take first entry
      await motherService.addNextOfKin(motherProfile.id, {
        name: kinData.name,
        relationship: kinData.relationship,
        phone_number: kinData.phone
      });
      
      setHasNextOfKin(true);
      setShowNextOfKinModal(false);
      
      toast({
        title: "Success",
        description: "Next of kin information saved",
      });
    } catch (error) {
      console.error('Next of kin save error:', error);
      toast({
        title: "Error",
        description: "Failed to save next of kin",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-lg font-semibold">Loading...</div>
        </div>
      </div>
    );
  }

  if (showProfile) {
    return <MotherProfile motherData={motherProfile} onBack={() => {
      setShowProfile(false);
      loadMotherData(); // Reload data after profile update
    }} />;
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
    <>
      <NextOfKinModal open={showNextOfKinModal} onClose={() => setShowNextOfKinModal(false)} onSave={handleNextOfKinSave} />
      <div className="min-h-screen bg-background">
        <div className="relative w-full">
          <div className="w-full bg-gradient-to-r from-primary to-primary/80 text-primary-foreground rounded-t-none shadow-sm flex items-center justify-between px-4 sm:px-6 py-4 sm:py-6" style={{marginTop:0, borderTopLeftRadius:0, borderTopRightRadius:0}}>
            <div className="flex items-center gap-3">
              <Baby className="h-6 w-6 sm:h-8 sm:w-8 flex-shrink-0" />
              <div className="min-w-0">
                <div className="text-lg sm:text-xl md:text-2xl font-semibold break-words">Welcome back, {user?.name || 'Mother'}!</div>
                <div className="text-primary-foreground/80 text-sm sm:text-base">
                  {motherProfile?.location || 'Your maternal health journey'}
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
                        {user?.phone_number}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setShowProfile(true)}>
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="bg-primary/10">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          {/* Quick Check-In */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-accent" />
                Daily Check-In
              </CardTitle>
              <CardDescription>
                Let us know how you're feeling today
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-3 sm:p-4 bg-muted rounded-lg">
                  <p className="font-medium mb-2 text-sm sm:text-base">How to respond:</p>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    • Reply <span className="font-bold">1</span> if you're feeling OK
                  </p>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    • Reply <span className="font-bold">2</span> if you're NOT feeling OK
                  </p>
                </div>
                
                <Dialog open={showCheckInModal} onOpenChange={setShowCheckInModal}>
                  <DialogTrigger asChild>
                    <Button className="w-full text-sm sm:text-base">Quick Check-In</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>How are you feeling today?</DialogTitle>
                      <DialogDescription>
                        Your response helps us monitor your health and provide better care.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-3">
                      <Button 
                        onClick={() => {
                          handleCheckIn('ok');
                          setShowCheckInModal(false);
                        }}
                        className="w-full bg-success hover:bg-success/90"
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        I'm feeling OK (Reply: 1)
                      </Button>
                      <Button 
                        onClick={() => {
                          handleCheckIn('not_ok');
                          setShowCheckInModal(false);
                        }}
                        variant="destructive"
                        className="w-full"
                      >
                        <AlertCircle className="h-4 w-4 mr-2" />
                        I'm NOT feeling OK (Reply: 2)
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>

                {checkInResponse && (
                  <div className={`p-3 rounded-lg flex items-center gap-2 ${
                    checkInResponse === 'ok' 
                      ? 'bg-success/10 text-success' 
                      : 'bg-destructive/10 text-destructive'
                  }`}>
                    {checkInResponse === 'ok' ? (
                      <CheckCircle className="h-4 w-4" />
                    ) : (
                      <AlertCircle className="h-4 w-4" />
                    )}
                    <span className="text-sm font-medium">
                      {checkInResponse === 'ok' 
                        ? 'Thank you! Your CHW has been notified that you\'re doing well.' 
                        : 'Your CHW has been alerted and will contact you soon for support.'
                      }
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {/* Assigned CHW */}
            {motherProfile?.assigned_chw && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5 text-primary" />
                    Your Community Health Worker
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <p className="font-medium text-lg">{motherProfile.assigned_chw.name}</p>
                      <p className="text-sm text-muted-foreground">{motherProfile.assigned_chw.phone_number}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1"
                        onClick={() => openSMS(motherProfile.assigned_chw!.phone_number)}
                      >
                        <MessageCircle className="h-4 w-4 mr-2" />
                        SMS
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1"
                        onClick={() => openWhatsApp(motherProfile.assigned_chw!.phone_number)}
                      >
                        <Phone className="h-4 w-4 mr-2" />
                        Call
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Profile Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Baby className="h-5 w-5 text-accent" />
                  Your Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  {motherProfile?.due_date && (
                    <div>
                      <span className="font-medium">Due Date:</span>{' '}
                      <span className="text-muted-foreground">
                        {new Date(motherProfile.due_date).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                  {motherProfile?.location && (
                    <div>
                      <span className="font-medium">Location:</span>{' '}
                      <span className="text-muted-foreground">{motherProfile.location}</span>
                    </div>
                  )}
                  {motherProfile?.status && (
                    <div>
                      <span className="font-medium">Status:</span>{' '}
                      <Badge variant="secondary">{motherProfile.status}</Badge>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}
