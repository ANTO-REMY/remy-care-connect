import { useState, useEffect } from "react";
import { User, Phone, MapPin, Lock, Edit2, Save, X, ArrowLeft } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { nurseService } from "@/services/nurseService";

interface NurseProfileProps {
  onBack?: () => void;
}

export function NurseProfile({ onBack }: NurseProfileProps) {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone_number: '',
    location: '',
    license_number: '',
  });

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const profile = await nurseService.getCurrentProfile();
        setFormData({
          name: profile.name || '',
          phone_number: profile.phone_number || '',
          location: profile.location || '',
          license_number: profile.license_number || '',
        });
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message || "Failed to load profile",
          variant: "destructive"
        });
      }
    };

    loadProfile();
  }, [toast]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      await nurseService.updateProfile({
        location: formData.location,
        license_number: formData.license_number
      });

      toast({
        title: "Profile Updated",
        description: "Your profile has been successfully updated.",
      });

      setIsEditing(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update profile",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
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
            <Label htmlFor="license_number">License Number</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="license_number"
                name="license_number"
                value={formData.license_number}
                onChange={handleInputChange}
                disabled={!isEditing}
                className="pl-10"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Work Location</Label>
            {isEditing ? (
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
                <Select
                  value={formData.location}
                  onValueChange={(value) => setFormData({ ...formData, location: value })}
                >
                  <SelectTrigger className="pl-10">
                    <SelectValue placeholder="Select work location" />
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
                  className="pl-10"
                />
              </div>
            )}
          </div>

          {isEditing && (
            <div className="flex flex-col sm:flex-row gap-2 pt-4">
              <Button onClick={handleSave} disabled={loading} className="flex-1">
                <Save className="h-4 w-4 mr-2" />
                {loading ? 'Saving...' : 'Save Changes'}
              </Button>
              <Button onClick={handleCancel} variant="outline" className="flex-1" disabled={loading}>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
