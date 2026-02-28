import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Baby, MessageCircle, Phone, AlertCircle, BookOpen, CheckCircle,
  User, LogOut, Camera, Heart, Apple, Bell, Calendar, Clock,
  ChevronRight, Sparkles, Utensils, Droplets, Moon, Sun,
  Activity, TrendingUp, FileText, Video, ExternalLink, Bookmark,
  Share2, Play, Pause, Volume2, VolumeX, Loader2, Plus
} from "lucide-react";
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
import { motherService } from "@/services/motherService";
import { checkinService } from "@/services/checkinService";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { DateTimePicker } from "@/components/ui/datetime-picker";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { usePolling } from "@/hooks/usePolling";
import { PregnancyJourneyTracker } from "./PregnancyJourneyTracker";

// Mock data for daily insights
const dailyNutritionTips = [
  {
    id: 1,
    meal: "Breakfast",
    title: "Iron-Rich Oatmeal",
    description: "Start your day with iron-fortified oatmeal topped with sliced bananas and a handful of almonds.",
    calories: "350 kcal",
    nutrients: ["Iron", "Fiber", "Potassium"],
    image: "🥣",
    time: "7:00 AM"
  },
  {
    id: 2,
    meal: "Mid-Morning Snack",
    title: "Greek Yogurt Parfait",
    description: "Calcium-rich Greek yogurt with berries and a drizzle of honey for sustained energy.",
    calories: "200 kcal",
    nutrients: ["Calcium", "Protein", "Antioxidants"],
    image: "🥛",
    time: "10:00 AM"
  },
  {
    id: 3,
    meal: "Lunch",
    title: "Grilled Salmon & Quinoa",
    description: "Omega-3 rich salmon with quinoa and steamed vegetables for brain development.",
    calories: "450 kcal",
    nutrients: ["Omega-3", "Protein", "Folate"],
    image: "🐟",
    time: "1:00 PM"
  },
  {
    id: 4,
    meal: "Afternoon Snack",
    title: "Avocado Toast",
    description: "Whole grain toast with mashed avocado and a sprinkle of chia seeds.",
    calories: "250 kcal",
    nutrients: ["Healthy Fats", "Fiber", "Vitamin E"],
    image: "🥑",
    time: "4:00 PM"
  },
  {
    id: 5,
    meal: "Dinner",
    title: "Lean Chicken & Sweet Potato",
    description: "Protein-packed chicken breast with roasted sweet potatoes and green beans.",
    calories: "400 kcal",
    nutrients: ["Protein", "Vitamin A", "Iron"],
    image: "🍗",
    time: "7:00 PM"
  }
];

// Mock reminders data
const dailyReminders = [
  { id: 1, title: "Take Prenatal Vitamins", time: "8:00 AM", completed: true, type: "medication", icon: "💊" },
  { id: 2, title: "Drink 8 glasses of water", time: "Throughout day", completed: false, type: "hydration", icon: "💧" },
  { id: 3, title: "30-minute walk", time: "5:00 PM", completed: false, type: "exercise", icon: "🚶‍♀️" },
  { id: 4, title: "Daily check-in", time: "9:00 PM", completed: false, type: "health", icon: "✅" },
  { id: 5, title: "Read pregnancy article", time: "Anytime", completed: false, type: "education", icon: "📚" },
];

// Mock articles data
const pregnancyArticles = [
  {
    id: 1,
    title: "Understanding Your Baby's Development Week by Week",
    excerpt: "Track your baby's growth from conception to birth with our comprehensive week-by-week guide.",
    category: "Development",
    readTime: "8 min read",
    image: "https://images.unsplash.com/photo-1544367563-12123d8965cd?w=400&h=250&fit=crop",
    author: "Dr. Sarah Johnson",
    date: "2 days ago",
    featured: true,
    type: "article"
  },
  {
    id: 2,
    title: "Nutrition Essentials for a Healthy Pregnancy",
    excerpt: "Learn about the key nutrients your body needs and the best foods to support your baby's growth.",
    category: "Nutrition",
    readTime: "6 min read",
    image: "https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=400&h=250&fit=crop",
    author: "Nutritionist Mary Kimani",
    date: "1 week ago",
    featured: false,
    type: "article"
  },
  {
    id: 3,
    title: "Preparing for Labor: What to Expect",
    excerpt: "A comprehensive guide to help you understand the stages of labor and delivery.",
    category: "Labor & Delivery",
    readTime: "12 min read",
    image: "https://images.unsplash.com/photo-1555252333-9f8e92e65df4?w=400&h=250&fit=crop",
    author: "Midwife Grace Ochieng",
    date: "3 days ago",
    featured: true,
    type: "video",
    duration: "15:30"
  },
  {
    id: 4,
    title: "Postpartum Care: Recovery Tips for New Moms",
    excerpt: "Essential advice for physical and emotional recovery after childbirth.",
    category: "Postpartum",
    readTime: "10 min read",
    image: "https://images.unsplash.com/photo-1559757175-5700dde675bc?w=400&h=250&fit=crop",
    author: "Dr. Emily Wanjiku",
    date: "5 days ago",
    featured: false,
    type: "article"
  },
  {
    id: 5,
    title: "Breastfeeding Basics: Getting Started",
    excerpt: "Everything you need to know about successful breastfeeding from day one.",
    category: "Breastfeeding",
    readTime: "7 min read",
    image: "https://images.unsplash.com/photo-1555252333-9f8e92e65df4?w=400&h=250&fit=crop",
    author: "Lactation Consultant Jane Muthoni",
    date: "1 day ago",
    featured: false,
    type: "video",
    duration: "22:15"
  },
  {
    id: 6,
    title: "Managing Pregnancy Symptoms Naturally",
    excerpt: "Natural remedies and tips for dealing with common pregnancy discomforts.",
    category: "Wellness",
    readTime: "5 min read",
    image: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=400&h=250&fit=crop",
    author: "Holistic Practitioner Anna Otieno",
    date: "4 days ago",
    featured: false,
    type: "article"
  }
];

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

export function EnhancedMotherDashboard({ isFirstLogin = false }: MotherDashboardProps) {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  // State management
  const [showNextOfKinModal, setShowNextOfKinModal] = useState(isFirstLogin);
  const [showPhotoUpload, setShowPhotoUpload] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [reminders, setReminders] = useState(dailyReminders);
  const [bookmarkedArticles, setBookmarkedArticles] = useState<number[]>([]);
  const [selectedArticle, setSelectedArticle] = useState<typeof pregnancyArticles[0] | null>(null);
  const [showArticleDialog, setShowArticleDialog] = useState(false);
  const [waterIntake, setWaterIntake] = useState(3);
  const [showCheckInModal, setShowCheckInModal] = useState(false);
  const [checkInResponse, setCheckInResponse] = useState<'ok' | 'not_ok' | null>(null);
  const [motherProfileId, setMotherProfileId] = useState<number | null>(null);
  const [checkInSelected, setCheckInSelected] = useState<'ok' | 'not_ok' | null>(null);
  const [checkInComment, setCheckInComment] = useState('');
  const [checkInSubmitting, setCheckInSubmitting] = useState(false);
  // Appointments state
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [appointmentsLoading, setAppointmentsLoading] = useState(false);
  // Mother appointment scheduling
  const [showMotherScheduleModal, setShowMotherScheduleModal] = useState(false);
  const [motherScheduleForm, setMotherScheduleForm] = useState({
    scheduledTime: undefined as Date | undefined,
    appointmentType: 'prenatal_checkup',
    notes: '',
  });
  const [motherScheduleSubmitting, setMotherScheduleSubmitting] = useState(false);
  const motherProfileIdRef = useRef<number | null>(null);

  // Real profile data
  const [profile, setProfile] = useState<{ due_date?: string } | null>(null);

  /**
   * Silently refresh appointments + motherProfileId every 15 s.
   * No loading spinners — only the initial mount shows the spinner.
   */
  const refreshData = useCallback(async () => {
    if (!user?.id) return;

    // Appointments (all statuses so completed/cancelled also visible)
    try {
      const resp = await appointmentService.getAllForMother(user.id);
      setAppointments(resp.appointments);
    } catch { /* ignore */ }
  }, [user?.id]);

  // Poll every 15 seconds so appointments from CHW/nurse show automatically
  usePolling(refreshData, 15_000, !!user?.id);

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
        health_worker_id: user!.id, // backend links to assigned CHW/nurse
        scheduled_time: motherScheduleForm.scheduledTime.toISOString(),
        appointment_type: motherScheduleForm.appointmentType,
        notes: motherScheduleForm.notes.trim() || undefined,
      });
      setAppointments(prev => [appt, ...prev]);
      toast({ title: "Appointment Requested ✓", description: `Visit on ${new Date(appt.scheduled_time).toLocaleString()}.` });
      setShowMotherScheduleModal(false);
      setMotherScheduleForm({ scheduledTime: undefined, appointmentType: 'prenatal_checkup', notes: '' });
    } catch (err: any) {
      toast({ title: "Scheduling Failed", description: err.message || "Could not schedule appointment.", variant: "destructive" });
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
    } catch (err: any) {
      toast({
        title: "Upload failed",
        description: err.message || "Could not upload photo.",
        variant: "destructive",
      });
    }
  };

  // Toggle reminder completion
  const toggleReminder = (id: number) => {
    setReminders(prev => prev.map(r =>
      r.id === id ? { ...r, completed: !r.completed } : r
    ));
  };

  // Toggle article bookmark
  const toggleBookmark = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setBookmarkedArticles(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  // Handle article click
  const handleArticleClick = (article: typeof pregnancyArticles[0]) => {
    setSelectedArticle(article);
    setShowArticleDialog(true);
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
        channel: 'app',
      });
      setCheckInResponse(checkInSelected);
      setShowCheckInModal(false);
      setCheckInSelected(null);
      setCheckInComment('');
      toast({
        title: checkInSelected === 'ok' ? "Check-in recorded ✓" : "Check-in Recorded",
        description: checkInSelected === 'ok'
          ? "Great! Keep taking care of yourself."
          : "Your CHW has been notified and will contact you soon.",
      });
    } catch (err: any) {
      toast({
        title: "Submission Failed",
        description: err.message || "Could not submit check-in. Please try again.",
        variant: "destructive",
      });
    } finally {
      setCheckInSubmitting(false);
    }
  };

  // Add water intake
  const addWater = () => {
    if (waterIntake < 8) {
      setWaterIntake(prev => prev + 1);
      if (waterIntake + 1 === 8) {
        toast({
          title: "Goal Reached! 🎉",
          description: "You've reached your daily water intake goal!",
        });
      }
    }
  };

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

      // Initial data load — show spinner for appointments
      if (isMounted) setAppointmentsLoading(true);
      await refreshData();
      if (isMounted) setAppointmentsLoading(false);
    })();
    return () => { isMounted = false; };
  }, [refreshData]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50">

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

      {/* Article Dialog */}
      <Dialog open={showArticleDialog} onOpenChange={setShowArticleDialog}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedArticle && (
            <>
              <DialogHeader>
                <div className="relative h-48 -mx-6 -mt-6 mb-4 overflow-hidden rounded-t-lg">
                  <img
                    src={selectedArticle.image}
                    alt={selectedArticle.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <Badge className="absolute top-4 left-4 bg-white/90 text-foreground">
                    {selectedArticle.category}
                  </Badge>
                </div>
                <DialogTitle className="text-xl leading-tight">
                  {selectedArticle.title}
                </DialogTitle>
                <DialogDescription className="flex items-center gap-4 text-sm">
                  <span>By {selectedArticle.author}</span>
                  <span>•</span>
                  <span>{selectedArticle.date}</span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {selectedArticle.readTime}
                  </span>
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <p className="text-lg text-muted-foreground leading-relaxed">
                  {selectedArticle.excerpt}
                </p>
                <div className="prose prose-sm max-w-none">
                  <p>
                    Pregnancy is a beautiful journey filled with excitement, anticipation, and many questions.
                    This comprehensive guide will help you navigate through each stage with confidence and knowledge.
                  </p>
                  <h3 className="text-lg font-semibold mt-4">Key Takeaways</h3>
                  <ul className="list-disc pl-5 space-y-2">
                    <li>Understanding your body's changes during pregnancy</li>
                    <li>Nutrition and exercise recommendations</li>
                    <li>Preparing for labor and delivery</li>
                    <li>Postpartum care essentials</li>
                  </ul>
                  <p className="mt-4">
                    Remember, every pregnancy is unique. Always consult with your healthcare provider
                    for personalized advice and guidance throughout your journey.
                  </p>
                </div>
              </div>
              <div className="flex gap-2 pt-4 border-t">
                <Button className="flex-1">
                  <BookOpen className="h-4 w-4 mr-2" />
                  Read Full Article
                </Button>
                <Button variant="outline" size="icon">
                  <Share2 className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={(e) => toggleBookmark(selectedArticle.id, e)}
                >
                  <Bookmark
                    className={`h-4 w-4 ${bookmarkedArticles.includes(selectedArticle.id) ? 'fill-primary' : ''}`}
                  />
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Check-in Modal */}
      <Dialog open={showCheckInModal} onOpenChange={(open) => { setShowCheckInModal(open); if (!open) { setCheckInSelected(null); setCheckInComment(''); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center text-2xl">How are you feeling today?</DialogTitle>
            <DialogDescription className="text-center">
              Your response helps us monitor your health and provide better care
            </DialogDescription>
          </DialogHeader>

          {/* Step 1 — choose response */}
          <div className="grid grid-cols-2 gap-4 pt-4">
            <button
              onClick={() => setCheckInSelected('ok')}
              className={`flex flex-col items-center p-6 rounded-xl border-2 transition-all ${
                checkInSelected === 'ok'
                  ? 'bg-green-100 border-green-500 ring-2 ring-green-400'
                  : 'bg-green-50 border-green-200 hover:bg-green-100 hover:border-green-300'
              }`}
            >
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-3 transition-colors ${
                checkInSelected === 'ok' ? 'bg-green-200' : 'bg-green-100'
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
              className={`flex flex-col items-center p-6 rounded-xl border-2 transition-all ${
                checkInSelected === 'not_ok'
                  ? 'bg-red-100 border-red-500 ring-2 ring-red-400'
                  : 'bg-red-50 border-red-200 hover:bg-red-100 hover:border-red-300'
              }`}
            >
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-3 transition-colors ${
                checkInSelected === 'not_ok' ? 'bg-red-200' : 'bg-red-100'
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

          {/* Step 2 — optional comment + submit */}
          {checkInSelected && (
            <div className="space-y-3 pt-2">
              <Textarea
                placeholder="Add a note (optional) — describe how you feel..."
                value={checkInComment}
                onChange={(e) => setCheckInComment(e.target.value)}
                rows={3}
                className="resize-none"
              />
              <Button
                onClick={handleCheckIn}
                disabled={checkInSubmitting}
                className={`w-full ${
                  checkInSelected === 'ok'
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-pink-400 to-purple-500 p-2 rounded-xl">
                <Baby className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-lg bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent">
                  RemyAfya
                </h1>
                <p className="text-xs text-muted-foreground">Mother's Dashboard</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                className="relative"
                onClick={() => setActiveTab("reminders")}
              >
                <Bell className="h-5 w-5" />
                <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full text-[10px] text-white flex items-center justify-center">
                  {reminders.filter(r => !r.completed).length}
                </span>
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                    <Avatar className="h-10 w-10 ring-2 ring-pink-200">
                      <AvatarImage src={profileImage || undefined} />
                      <AvatarFallback className="bg-gradient-to-br from-pink-400 to-purple-500 text-white">
                        {user?.first_name?.charAt(0).toUpperCase() || 'M'}
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
                  <DropdownMenuItem onClick={() => navigate("/dashboard/mother/profile")}>
                    <User className="mr-2 h-4 w-4" />
                    My Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setShowPhotoUpload(true)}>
                    <Camera className="mr-2 h-4 w-4" />
                    Update Photo
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
          <div className="flex items-center gap-2 mb-2">
            <GreetingIcon className="h-5 w-5 text-amber-500" />
            <span className="text-muted-foreground">{greeting.text}</span>
          </div>
          <h2 className="text-3xl font-bold text-foreground mb-2">
            {user?.first_name || 'Mom'}! 👋
          </h2>
          <p className="text-muted-foreground">
            You're doing amazing! Let's make today count for you and your baby.
          </p>
        </div>

        {/* Pregnancy Progress Card */}
        {profile?.due_date && <PregnancyJourneyTracker dueDate={profile.due_date} />}

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <button
            onClick={() => setShowCheckInModal(true)}
            className="flex flex-col items-center p-4 rounded-xl bg-green-50 hover:bg-green-100 border border-green-200 transition-colors"
          >
            <div className="bg-green-100 p-3 rounded-full mb-2">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <span className="text-sm font-medium text-green-700">Daily Check-in</span>
          </button>

          <button
            onClick={() => setActiveTab("nutrition")}
            className="flex flex-col items-center p-4 rounded-xl bg-orange-50 hover:bg-orange-100 border border-orange-200 transition-colors"
          >
            <div className="bg-orange-100 p-3 rounded-full mb-2">
              <Utensils className="h-6 w-6 text-orange-600" />
            </div>
            <span className="text-sm font-medium text-orange-700">Nutrition</span>
          </button>

          <button
            onClick={() => setActiveTab("articles")}
            className="flex flex-col items-center p-4 rounded-xl bg-blue-50 hover:bg-blue-100 border border-blue-200 transition-colors"
          >
            <div className="bg-blue-100 p-3 rounded-full mb-2">
              <BookOpen className="h-6 w-6 text-blue-600" />
            </div>
            <span className="text-sm font-medium text-blue-700">Learn</span>
          </button>

          <button
            onClick={() => setActiveTab("reminders")}
            className="flex flex-col items-center p-4 rounded-xl bg-purple-50 hover:bg-purple-100 border border-purple-200 transition-colors"
          >
            <div className="bg-purple-100 p-3 rounded-full mb-2">
              <Bell className="h-6 w-6 text-purple-600" />
            </div>
            <span className="text-sm font-medium text-purple-700">Reminders</span>
          </button>
        </div>

        {/* Water Tracker */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-blue-100 p-2 rounded-lg">
                  <Droplets className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium">Water Intake</p>
                  <p className="text-sm text-muted-foreground">{waterIntake} of 8 glasses</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex gap-1">
                  {[...Array(8)].map((_, i) => (
                    <div
                      key={i}
                      className={`w-3 h-8 rounded-full transition-all ${i < waterIntake ? 'bg-blue-500' : 'bg-gray-200'
                        }`}
                    />
                  ))}
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={addWater}
                  disabled={waterIntake >= 8}
                >
                  + Add
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Tabs Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid grid-cols-5 w-full">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="appointments">Appointments</TabsTrigger>
            <TabsTrigger value="nutrition">Nutrition</TabsTrigger>
            <TabsTrigger value="articles">Articles</TabsTrigger>
            <TabsTrigger value="reminders">Reminders</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Today's Highlights */}
            <div className="grid md:grid-cols-2 gap-4">
              {/* Daily Tip */}
              <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-amber-500" />
                    <CardTitle className="text-base">Daily Tip</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    "Take time to connect with your baby today. Place your hands on your belly and talk or sing to them.
                    They can hear your voice and find it soothing!"
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
                      className={`flex items-center justify-between p-3 rounded-lg transition-colors ${reminder.completed ? 'bg-green-50' : 'bg-gray-50'
                        }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{reminder.icon}</span>
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
                  {pregnancyArticles.filter(a => a.featured).map((article) => (
                    <Card
                      key={article.id}
                      className="w-[300px] flex-shrink-0 cursor-pointer hover:shadow-lg transition-shadow"
                      onClick={() => handleArticleClick(article)}
                    >
                      <div className="relative h-40 overflow-hidden rounded-t-lg">
                        <img
                          src={article.image}
                          alt={article.title}
                          className="w-full h-full object-cover"
                        />
                        <Badge className="absolute top-2 left-2 bg-white/90">
                          {article.category}
                        </Badge>
                        {article.type === 'video' && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                            <div className="bg-white/90 rounded-full p-2">
                              <Play className="h-6 w-6 text-primary fill-primary" />
                            </div>
                          </div>
                        )}
                      </div>
                      <CardContent className="p-4">
                        <h4 className="font-medium line-clamp-2 mb-2 whitespace-normal">{article.title}</h4>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {article.readTime}
                          {article.duration && <span>• {article.duration}</span>}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                <ScrollBar orientation="horizontal" />
              </ScrollArea>
            </div>
          </TabsContent>

          {/* Appointments Tab */}
          <TabsContent value="appointments" className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-lg">Your Appointments</h3>
                <p className="text-sm text-muted-foreground">Scheduled visits with your health worker</p>
              </div>
              {/* Schedule Appointment Modal */}
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
            </div>

            {appointmentsLoading ? (
              <div className="flex items-center justify-center py-12">
                <Activity className="h-6 w-6 animate-spin text-muted-foreground mr-2" />
                <span className="text-muted-foreground">Loading appointments...</span>
              </div>
            ) : appointments.length === 0 ? (
              /* Empty state — show mock demo appointment so UI never looks broken */
              <div className="space-y-3">
                <Card className="border-dashed border-2 border-primary/30 bg-primary/5">
                  <CardContent className="p-4 text-center">
                    <Calendar className="h-10 w-10 mx-auto mb-2 text-primary/50" />
                    <p className="text-sm text-muted-foreground">
                      No upcoming appointments scheduled yet.
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Your CHW or nurse will schedule visits for you.
                    </p>
                  </CardContent>
                </Card>

                {/* Demo appointment card */}
                {[
                  {
                    id: "demo-1",
                    title: "Prenatal Checkup",
                    worker: "Your Nurse",
                    time: "Tomorrow, 10:00 AM",
                    status: "scheduled",
                    notes: "Bring your antenatal card.",
                    type: "checkup",
                  },
                  {
                    id: "demo-2",
                    title: "Routine Home Visit",
                    worker: "Your CHW",
                    time: "Friday, 2:00 PM",
                    status: "scheduled",
                    notes: "CHW will check vitals and answer questions.",
                    type: "visit",
                  },
                ].map((appt) => (
                  <Card key={appt.id} className="opacity-60">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <div className={`p-3 rounded-xl ${appt.type === 'checkup' ? 'bg-purple-100' : 'bg-blue-100'}`}>
                          {appt.type === 'checkup'
                            ? <Activity className="h-5 w-5 text-purple-600" />
                            : <Heart className="h-5 w-5 text-blue-600" />
                          }
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium">{appt.title}</h4>
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs">
                              {appt.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">{appt.worker}</p>
                          <div className="flex items-center gap-1 mt-1 text-sm text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            <span>{appt.time}</span>
                          </div>
                          {appt.notes && (
                            <p className="text-xs text-muted-foreground mt-2 bg-gray-50 p-2 rounded">
                              📋 {appt.notes}
                            </p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                <p className="text-center text-xs text-muted-foreground italic">
                  Sample appointments shown above — real appointments will appear here once scheduled.
                </p>
              </div>
            ) : (
              /* Real appointments from API */
              <div className="space-y-3">
                {appointments.map((appt) => {
                  const isScheduled = appt.status === 'scheduled';
                  const isCompleted = appt.status === 'completed';
                  const isCancelled = appt.status === 'canceled' || appt.status === 'cancelled';
                  return (
                    <Card key={appt.id} className={`hover:shadow-md transition-shadow ${isCancelled ? 'opacity-60' : ''}`}>
                      <CardContent className="p-4">
                        <div className="flex items-start gap-4">
                          <div className={`p-3 rounded-xl ${
                            isCompleted ? 'bg-green-100' :
                            isCancelled ? 'bg-gray-100' :
                            'bg-purple-100'
                          }`}>
                            <Calendar className={`h-5 w-5 ${
                              isCompleted ? 'text-green-600' :
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
                              </div>
                              <Badge
                                variant="outline"
                                className={`text-xs whitespace-nowrap ${
                                  isScheduled ? 'bg-green-50 text-green-700 border-green-200' :
                                  isCompleted ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                  'bg-gray-50 text-gray-600 border-gray-200'
                                }`}
                              >
                                {appt.status}
                              </Badge>
                            </div>
                            {appt.notes && (
                              <p className="text-xs text-muted-foreground mt-2 bg-gray-50 p-2 rounded-md">
                                📋 {appt.notes}
                              </p>
                            )}
                            <div className="flex flex-wrap items-center gap-2 mt-2">
                              {appt.escalated && (
                                <Badge className="bg-red-100 text-red-700 text-xs">⚠ Escalated</Badge>
                              )}
                              {appt.recurrence_rule && appt.recurrence_rule !== 'none' && (
                                <span className="text-xs text-purple-600">↺ {appt.recurrence_rule}</span>
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
                1,650 kcal
              </Badge>
            </div>

            <div className="space-y-3">
              {dailyNutritionTips.map((meal) => (
                <Card key={meal.id} className="overflow-hidden">
                  <CardContent className="p-0">
                    <div className="flex">
                      <div className="w-20 bg-gradient-to-br from-orange-100 to-amber-100 flex items-center justify-center text-4xl">
                        {meal.image}
                      </div>
                      <div className="flex-1 p-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant="outline" className="text-xs">{meal.meal}</Badge>
                              <span className="text-xs text-muted-foreground">{meal.time}</span>
                            </div>
                            <h4 className="font-medium">{meal.title}</h4>
                            <p className="text-sm text-muted-foreground mt-1">{meal.description}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-sm">{meal.calories}</p>
                          </div>
                        </div>
                        <div className="flex gap-2 mt-3">
                          {meal.nutrients.map((nutrient, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs bg-green-100 text-green-700">
                              {nutrient}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

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
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 mt-0.5">✓</span>
                    <span>Stay hydrated - aim for 8-10 glasses of water daily</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 mt-0.5">✓</span>
                    <span>Include protein in every meal for baby's growth</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 mt-0.5">✓</span>
                    <span>Choose whole grains over refined carbohydrates</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 mt-0.5">✓</span>
                    <span>Take your prenatal vitamins with food</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Articles Tab */}
          <TabsContent value="articles" className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-lg">Pregnancy Resources</h3>
                <p className="text-sm text-muted-foreground">Expert articles and videos for every stage</p>
              </div>
              <div className="flex gap-2">
                <Badge variant="outline" className="cursor-pointer hover:bg-primary hover:text-primary-foreground">
                  All
                </Badge>
                <Badge variant="outline" className="cursor-pointer hover:bg-primary hover:text-primary-foreground">
                  Articles
                </Badge>
                <Badge variant="outline" className="cursor-pointer hover:bg-primary hover:text-primary-foreground">
                  Videos
                </Badge>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              {pregnancyArticles.map((article) => (
                <Card
                  key={article.id}
                  className="cursor-pointer hover:shadow-lg transition-all group overflow-hidden"
                  onClick={() => handleArticleClick(article)}
                >
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={article.image}
                      alt={article.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                    <div className="absolute top-3 left-3 flex gap-2">
                      <Badge className="bg-white/90 text-foreground">
                        {article.category}
                      </Badge>
                      {article.type === 'video' && (
                        <Badge className="bg-red-500 text-white">
                          <Play className="h-3 w-3 mr-1 fill-white" />
                          Video
                        </Badge>
                      )}
                    </div>
                    <button
                      onClick={(e) => toggleBookmark(article.id, e)}
                      className="absolute top-3 right-3 bg-white/90 p-2 rounded-full hover:bg-white transition-colors"
                    >
                      <Bookmark
                        className={`h-4 w-4 ${bookmarkedArticles.includes(article.id) ? 'fill-primary text-primary' : ''}`}
                      />
                    </button>
                    {article.type === 'video' && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="bg-white/90 rounded-full p-3 group-hover:scale-110 transition-transform">
                          <Play className="h-8 w-8 text-primary fill-primary" />
                        </div>
                      </div>
                    )}
                  </div>
                  <CardContent className="p-4">
                    <h4 className="font-medium line-clamp-2 mb-2 group-hover:text-primary transition-colors">
                      {article.title}
                    </h4>
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                      {article.excerpt}
                    </p>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <span>{article.author}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {article.readTime}
                          {article.duration && ` (${article.duration})`}
                        </span>
                      </div>
                      <span>{article.date}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
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
                  className={`transition-all cursor-pointer ${reminder.completed ? 'bg-green-50 border-green-200' : 'hover:shadow-md'
                    }`}
                  onClick={() => toggleReminder(reminder.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`text-3xl ${reminder.completed ? 'grayscale' : ''}`}>
                          {reminder.icon}
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
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${reminder.completed
                        ? 'bg-green-500 border-green-500'
                        : 'border-gray-300'
                        }`}>
                        {reminder.completed && <CheckCircle className="h-4 w-4 text-white" />}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Add Custom Reminder */}
            <Button variant="outline" className="w-full">
              <Bell className="h-4 w-4 mr-2" />
              Add Custom Reminder
            </Button>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
