import { useState, useEffect } from "react";
import { User, Phone, MapPin, Calendar, Edit2, Save, X, ArrowLeft } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { motherService, type Mother } from "@/services/motherService";
import { NextOfKinSection } from "./NextOfKinSection";

interface MotherProfileProps {
  onBack?: () => void;
  motherData?: Mother | null;
}

export function MotherProfile({ onBack, motherData }: MotherProfileProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(!motherData?.date_of_birth); // Edit mode if profile incomplete
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    phone_number: user?.phone_number || '',
    location: motherData?.location || '',
    date_of_birth: motherData?.date_of_birth || '',
    due_date: motherData?.due_date || '',
  });

  const [nextOfKin, setNextOfKin] = useState([
    { name: '', phone: '', sex: '', relationship: '' },
    { name: '', phone: '', sex: '', relationship: '' },
  ]);

  useEffect(() => {
    if (motherData) {
      setFormData({
        name: motherData.name,
        phone_number: motherData.phone_number,
        location: motherData.location || '',
        date_of_birth: motherData.date_of_birth || '',
        due_date: motherData.due_date || '',
      });
    }
  }, [motherData]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSave = async () => {
    if (!motherData) return;

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
      // Check if this is profile completion or update
      if (!motherData.date_of_birth) {
        // Complete profile
        await motherService.completeProfile({
          date_of_birth: formData.date_of_birth,
          due_date: formData.due_date,
          location: formData.location,
        });
        
        toast({
          title: "Profile Completed",
          description: "Your profile has been successfully completed.",
        });
      } else {
        // Update profile
        await motherService.updateProfile(motherData.id, {
          date_of_birth: formData.date_of_birth,
          due_date: formData.due_date,
          location: formData.location,
        });

        toast({
          title: "Profile Updated",
          description: "Your profile has been successfully updated.",
        });
      }

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
    if (!motherData?.date_of_birth) {
      // Can't cancel if profile incomplete
      toast({
        title: "Profile Incomplete",
        description: "Please complete your profile before continuing.",
        variant: "destructive",
      });
      return;
    }

    setFormData({
      name: motherData.name,
      phone_number: motherData.phone_number,
      location: motherData.location || '',
      date_of_birth: motherData.date_of_birth || '',
      due_date: motherData.due_date || '',
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
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">My Profile</h1>
          <p className="text-sm sm:text-base text-muted-foreground">View and manage your personal information</p>
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
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="name"
                name="name"
                value={formData.name}
                disabled
                className="pl-10 bg-muted"
              />
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
