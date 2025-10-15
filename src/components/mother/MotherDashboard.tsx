import { useState } from "react";
import { Baby, MessageCircle, Phone, AlertCircle, BookOpen, CheckCircle, X, User, LogOut } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { currentUser, mockMothers, mockCHWs, weeklyTips } from "@/data/mockData";
import { useAuth } from "@/contexts/AuthContext";
import { MotherProfile } from "./MotherProfile";

export function MotherDashboard() {
  const { user, logout } = useAuth();
  const [showCheckInModal, setShowCheckInModal] = useState(false);
  const [checkInResponse, setCheckInResponse] = useState<'ok' | 'not_ok' | null>(null);
  const [showProfile, setShowProfile] = useState(false);
  
  const mother = mockMothers.find(m => m.id === currentUser.id);
  const chw = mockCHWs.find(c => c.id === mother?.assignedCHW);
  const currentWeek = mother?.pregnancyWeek || mother?.postpartumWeek || 24;
  const weekTips = weeklyTips.filter(tip => tip.week === currentWeek);

  const handleCheckIn = (response: 'ok' | 'not_ok') => {
    setCheckInResponse(response);
    // In a real app, this would send the response to backend
    console.log(`Check-in response: ${response}`);
  };

  const openWhatsApp = (phone: string) => {
    window.open(`https://wa.me/${phone.replace('+', '')}`, '_blank');
  };

  const openSMS = (phone: string) => {
    window.open(`sms:${phone}`, '_blank');
  };

  if (showProfile) {
    return <MotherProfile onBack={() => setShowProfile(false)} />;
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
    <div className="space-y-4 sm:space-y-6">
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

      {/* Welcome Banner */}
      <Card className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground">
        <CardHeader className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <Baby className="h-6 w-6 sm:h-8 sm:w-8 flex-shrink-0" />
            <div className="min-w-0">
              <CardTitle className="text-lg sm:text-xl md:text-2xl break-words">
                Welcome back, {currentUser.name}!
              </CardTitle>
              <CardDescription className="text-primary-foreground/80 text-sm sm:text-base">
                {mother?.pregnancyWeek ? (
                  `You are ${mother.pregnancyWeek} weeks pregnant`
                ) : (
                  `${mother?.postpartumWeek} weeks postpartum`
                )}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

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
        {/* Weekly Tips */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-accent" />
              This Week's Tips
            </CardTitle>
            <CardDescription>
              Week {currentWeek} guidance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 sm:space-y-4">
              {weekTips.map((tip, index) => (
                <div key={index} className="p-3 border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="secondary" className="text-xs">
                      {tip.category.replace('_', ' ')}
                    </Badge>
                  </div>
                  <h4 className="font-medium text-sm mb-1 break-words">{tip.title}</h4>
                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">{tip.content}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* CHW Contact */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-accent" />
              Your Community Health Worker
            </CardTitle>
            <CardDescription>
              Get support from your assigned CHW
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-3 sm:p-4 bg-muted rounded-lg">
                <h4 className="font-medium mb-1 text-sm sm:text-base break-words">{chw?.name}</h4>
                <p className="text-xs sm:text-sm text-muted-foreground mb-3 break-all">{chw?.phone}</p>
                
                <div className="space-y-2">
                  <Button 
                    onClick={() => openWhatsApp(chw?.phone || '')}
                    className="w-full bg-green-600 hover:bg-green-700 text-xs sm:text-sm"
                    size="sm"
                  >
                    <MessageCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                    Message on WhatsApp
                  </Button>
                  <Button 
                    onClick={() => openSMS(chw?.phone || '')}
                    variant="outline"
                    className="w-full text-xs sm:text-sm"
                    size="sm"
                  >
                    <MessageCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                    Send SMS
                  </Button>
                  <Button 
                    onClick={() => window.open(`tel:${chw?.phone}`, '_self')}
                    variant="outline"
                    className="w-full text-xs sm:text-sm"
                    size="sm"
                  >
                    <Phone className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                    Call Now
                  </Button>
                </div>
              </div>
              
              <div className="p-3 bg-accent/10 rounded-lg border border-accent/20">
                <p className="text-sm text-accent font-medium">
                  💡 Need immediate help? Contact your CHW anytime!
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}