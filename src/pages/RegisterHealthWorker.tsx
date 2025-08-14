import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Heart, MapPin, User, Phone, Lock, UserCheck, Stethoscope } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export default function RegisterHealthWorker() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const { toast } = useToast();
  const [showModal, setShowModal] = useState(true);
  const [selectedRole, setSelectedRole] = useState<'chw' | 'nurse' | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    location: '',
    password: ''
  });

  const handleRoleSelect = (role: 'chw' | 'nurse') => {
    setSelectedRole(role);
    setShowModal(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRole) return;

    setIsLoading(true);

    // Basic validation
    if (!formData.fullName || !formData.phone || !formData.password || !formData.location) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      setIsLoading(false);
      return;
    }

    try {
      const userData = {
        ...formData,
        name: formData.fullName,
        role: selectedRole
      };

      const success = await register(userData);
      
      if (success) {
        toast({
          title: "Registration Successful!",
          description: `Welcome to RemyAfya as a ${selectedRole === 'chw' ? 'Community Health Worker' : 'Nurse'}.`,
        });
        navigate(`/dashboard/${selectedRole}`);
      } else {
        toast({
          title: "Registration Failed",
          description: "A user with this phone number already exists.",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Registration Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  if (showModal) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 to-accent/5 flex items-center justify-center p-3 sm:p-4">
        <Dialog open={showModal} onOpenChange={() => navigate('/')}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-center">Choose Your Role</DialogTitle>
              <DialogDescription className="text-center">
                Select which type of health worker you are
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <Button
                onClick={() => handleRoleSelect('chw')}
                variant="outline"
                className="w-full h-auto p-6 flex flex-col items-center space-y-2 hover:bg-primary/5"
              >
                <UserCheck className="h-8 w-8 text-primary" />
                <div className="text-center">
                  <div className="font-semibold">Community Health Worker</div>
                  <div className="text-sm text-muted-foreground">Work directly with mothers in the community</div>
                </div>
              </Button>
              <Button
                onClick={() => handleRoleSelect('nurse')}
                variant="outline"
                className="w-full h-auto p-6 flex flex-col items-center space-y-2 hover:bg-success/5"
              >
                <Stethoscope className="h-8 w-8 text-success" />
                <div className="text-center">
                  <div className="font-semibold">Nurse Supervisor</div>
                  <div className="text-sm text-muted-foreground">Oversee critical cases and provide guidance</div>
                </div>
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-accent/5 flex items-center justify-center p-3 sm:p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-6">
          <Link to="/" className="inline-flex items-center space-x-2 mb-4 hover:opacity-80 transition-opacity">
            <Heart className="h-8 w-8 text-accent" />
            <span className="text-2xl font-bold text-primary">RemyAfya</span>
          </Link>
          <div className="flex items-center justify-center space-x-2 mb-2">
            {selectedRole === 'chw' ? (
              <UserCheck className="h-6 w-6 text-primary" />
            ) : (
              <Stethoscope className="h-6 w-6 text-success" />
            )}
            <h1 className="text-2xl font-bold text-primary">
              {selectedRole === 'chw' ? 'Join as CHW' : 'Join as Nurse'}
            </h1>
          </div>
          <p className="text-muted-foreground">
            {selectedRole === 'chw' 
              ? 'Help mothers in your community thrive'
              : 'Provide clinical oversight and guidance'
            }
          </p>
        </div>

        <Card>
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-xl">Create Your Account</CardTitle>
            <CardDescription>
              Enter your details to get started with RemyAfya
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Full Name */}
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name *</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="fullName"
                    name="fullName"
                    type="text"
                    placeholder="Enter your full name"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              {/* Phone Number */}
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number *</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    placeholder="+254 123 456 789"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              {/* Location */}
              <div className="space-y-2">
                <Label htmlFor="location">Work Location *</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="location"
                    name="location"
                    type="text"
                    placeholder="Health facility or area"
                    value={formData.location}
                    onChange={handleInputChange}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="password">Password *</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="Create a secure password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Creating Account..." : "Create Account"}
              </Button>
            </form>

            <div className="mt-4 text-center text-sm">
              <span className="text-muted-foreground">Already have an account? </span>
              <Link 
                to={`/login/${selectedRole}`} 
                className="text-accent hover:underline font-medium"
              >
                Sign in here
              </Link>
            </div>

            <div className="mt-2 text-center">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setShowModal(true)}
                className="text-xs text-muted-foreground hover:text-accent"
              >
                Change role selection
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="mt-4 text-center">
          <Link to="/" className="text-sm text-muted-foreground hover:text-accent transition-colors">
            ← Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}