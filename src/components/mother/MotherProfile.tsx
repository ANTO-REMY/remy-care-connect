import { useState, useEffect } from "react";
import { User, Phone, MapPin, Calendar, Edit2, Save, X, ArrowLeft, Camera } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { motherService, type Mother } from "@/services/motherService";
import { NextOfKinSection } from "./NextOfKinSection";
import { getMyPhoto, getPhotoFileUrl } from "@/services/photoService";

interface MotherProfileProps {
  onBack?: () => void;
  motherData?: Mother | null;
}

export function MotherProfile({ onBack, motherData }: MotherProfileProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [mother, setMother] = useState<Mother | null>(motherData || null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [profilePhotoUrl, setProfilePhotoUrl] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    phone_number: user?.phone_number || '',
    location: motherData?.location || '',
    date_of_birth: motherData?.date_of_birth || '',
    due_date: motherData?.due_date || '',
  });

  const [nextOfKin, setNextOfKin] = useState([
    { name: '', phone: '', sex: '', relationship: '' },
    { name: '', phone: '', sex: '', relationship: '' },
  ]);

  // Load mother profile if not provided via props
  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      try {
        setLoading(true);

        let profile: Mother | null = null;

        if (motherData) {
          profile = motherData;
        } else {
          const storedId = localStorage.getItem('mother_profile_id');
          const motherId = storedId ? Number(storedId) : NaN;
          if (!motherId || isNaN(motherId)) {
            // No profile yet - show editing mode for first-time profile completion
            setIsEditing(true);
            setLoading(false);
            return;
          }
          profile = await motherService.getProfile(motherId);
        }

        if (!profile || !isMounted) return;

        setMother(profile);
        setFormData({
          first_name: profile.first_name || '',
          last_name: profile.last_name || '',
          phone_number: profile.phone_number,
          location: profile.location,
          date_of_birth: profile.date_of_birth,
          due_date: profile.due_date,
        });
        setIsEditing(false); // Profile is always complete now

        // Load next of kin data for this mother
        try {
          const kinList = await motherService.getNextOfKin(profile.id);
          if (!isMounted) return;
          const mapped = kinList.slice(0, 2).map(k => ({
            name: k.name,
            phone: k.phone,
            sex: k.sex,
            relationship: k.relationship,
          }));
          while (mapped.length < 2) {
            mapped.push({ name: '', phone: '', sex: '', relationship: '' });
          }
          setNextOfKin(mapped);
        } catch (kinError) {
          console.error('Failed to load next of kin:', kinError);
        }

        // Load profile photo
        try {
          const photoMeta = await getMyPhoto();
          if (photoMeta && isMounted) {
            setProfilePhotoUrl(getPhotoFileUrl(photoMeta.file_url));
          }
        } catch (photoError) {
          console.error('Failed to load profile photo:', photoError);
        }
      } catch (error: any) {
        console.error('Failed to load mother profile:', error);
        toast({
          title: "Error",
          description: error.message || "Failed to load profile",
          variant: "destructive",
        });
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      isMounted = false;
    };
  }, [motherData, toast]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSave = async () => {
    const currentMother = mother || motherData;
    if (!currentMother) return;

    // Validate required fields
    if (!formData.location || !formData.date_of_birth || !formData.due_date) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields (location, date of birth, due date).",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      await motherService.updateProfile(currentMother.id, {
        first_name: formData.first_name,
        last_name: formData.last_name,
        dob: formData.date_of_birth,
        due_date: formData.due_date,
        location: formData.location,
      });

      toast({
        title: "Profile Updated",
        description: "Your profile has been successfully updated.",
      });

      setIsEditing(false);
      if (onBack) onBack();
    } catch (error: any) {
      console.error('Profile save error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to save profile",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    const currentMother = mother || motherData;
    if (!currentMother) return;

    setFormData({
      first_name: currentMother.first_name || '',
      last_name: currentMother.last_name || '',
      phone_number: currentMother.phone_number,
      location: currentMother.location,
      date_of_birth: currentMother.date_of_birth,
      due_date: currentMother.due_date,
    });
    setIsEditing(false);
  };

  return (
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-6">
      {onBack && (
        <Button variant="ghost" onClick={onBack} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>
      )}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16 border-2 border-primary">
            <AvatarImage src={profilePhotoUrl || undefined} alt={`${formData.first_name} ${formData.last_name}`} />
            <AvatarFallback className="bg-primary/10">
              <User className="h-8 w-8 text-primary" />
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">My Profile</h1>
            <p className="text-sm sm:text-base text-muted-foreground">View and manage your personal information</p>
          </div>
        </div>
        {!isEditing && (
          <Button onClick={() => setIsEditing(true)} className="w-full sm:w-auto">
            <Edit2 className="h-4 w-4 mr-2" />
            Edit Profile
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
          <CardDescription>
            {isEditing ? "Update your personal details below" : "Your personal details"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="first_name">First Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="first_name"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="last_name">Last Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="last_name"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className="pl-10"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone_number">Phone Number</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="phone_number"
                name="phone_number"
                value={formData.phone_number}
                disabled
                className="pl-10 bg-muted"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Location *</Label>
            {isEditing ? (
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
                <Select
                  value={formData.location}
                  onValueChange={(value) => setFormData({ ...formData, location: value })}
                >
                  <SelectTrigger className="pl-10">
                    <SelectValue placeholder="Select your location" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Nairobi">Nairobi</SelectItem>
                    <SelectItem value="Kisumu">Kisumu</SelectItem>
                    <SelectItem value="Mombasa">Mombasa</SelectItem>
                    <SelectItem value="Nakuru">Nakuru</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={formData.location}
                  disabled
                  className="pl-10 bg-muted"
                />
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="date_of_birth">Date of Birth *</Label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="date_of_birth"
                name="date_of_birth"
                type="date"
                value={formData.date_of_birth}
                onChange={handleInputChange}
                disabled={!isEditing}
                className="pl-10"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="due_date">Due Date *</Label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="due_date"
                name="due_date"
                type="date"
                value={formData.due_date}
                onChange={handleInputChange}
                disabled={!isEditing}
                className="pl-10"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Next of Kin Section */}
      <NextOfKinSection kin={nextOfKin} isEditing={isEditing} onChange={setNextOfKin} />

      {isEditing && (
        <div className="flex flex-col sm:flex-row gap-2 pt-4">
          <Button onClick={handleSave} className="flex-1">
            <Save className="h-4 w-4 mr-2" />
            Save Changes
          </Button>
          <Button onClick={handleCancel} variant="outline" className="flex-1">
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
        </div>
      )}
    </div>
  );
}
