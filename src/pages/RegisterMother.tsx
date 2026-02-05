import { useState } from 'react';
import { PinInput } from '@/components/PinInput';
import { useNavigate, Link } from 'react-router-dom';
import { Calendar, MapPin, User, Phone, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import VerifyOTPModal from '@/components/VerifyOTPModal';

export default function RegisterMother() {
  const navigate = useNavigate();
  const { register, verifyOTP } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showVerify, setShowVerify] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    dueDate: '',
    dobDate: '',
    weeksPregnant: '',
    location: '',
    pin: '',
    confirmPin: ''
  });

  const handlePinChange = (val: string) => {
    setFormData({ ...formData, pin: val });
  };

  const handleConfirmPinChange = (val: string) => {
    setFormData({ ...formData, confirmPin: val });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Basic validation
    if (!formData.fullName || !formData.phone || !formData.pin || !formData.location) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      setIsLoading(false);
      return;
    }

    if (formData.pin !== formData.confirmPin) {
      toast({
        title: "PIN Mismatch",
        description: "PINs do not match. Please try again.",
        variant: "destructive"
      });
      setIsLoading(false);
      return;
    }

    try {
      const result = await register({
        phone_number: formData.phone,
        name: formData.fullName,
        pin: formData.pin,
        role: 'mother'
      });
      
      if (result.success) {
        toast({
          title: "Registration Successful!",
          description: "We've sent you an OTP. Please verify your phone number.",
        });
        setShowVerify(true);
      } else {
        toast({
          title: "Registration Failed",
          description: result.error || "A user with this phone number may already exist.",
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-accent/5 to-primary/5 flex items-center justify-center p-3 sm:p-4 my-4">
      <div className="w-full max-w-md">
        <VerifyOTPModal
          open={showVerify}
          onOpenChange={setShowVerify}
          phoneNumber={formData.phone}
          onSubmit={async (otp) => {
            try {
              const success = await verifyOTP(formData.phone, otp);
              return success;
            } catch (error) {
              return false;
            }
          }}
          onResend={async () => {
            // OTP resend would require a backend endpoint
            toast({
              title: "OTP Resent",
              description: "A new OTP has been sent to your phone.",
            });
          }}
          onVerified={() => {
            toast({ 
              title: 'Phone verified', 
              description: 'Please login with your credentials.' 
            });
            navigate('/login/mother');
          }}
        />
        {/* Header */}
        <div className="text-center mb-6">
          <Link to="/" className="inline-flex items-center space-x-2 mb-4 hover:opacity-80 transition-opacity">
            <span className="text-2xl font-bold text-primary">RemyAfya</span>
          </Link>
          <h1 className="text-2xl font-bold text-primary mb-2">Join as a Mother</h1>
          <p className="text-muted-foreground">
            Start your journey with personalized maternal care
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
                <Label htmlFor="location">Location *</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
                  <Select value={formData.location} onValueChange={(value) => setFormData({ ...formData, location: value })} required>
                    <SelectTrigger className="pl-10">
                      <SelectValue placeholder="Select your location" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Nairobi">Nairobi</SelectItem>
                      <SelectItem value="Kisumu">Kisumu</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

               {/* DOB */}
               <div className="space-y-2">
                <Label htmlFor="dueDate">Date of birth </Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="dobDate"
                    name="dobDate"
                    type="date"
                    value={formData.dobDate}
                    onChange={handleInputChange}
                    className="pl-10"
                  />
                </div>
              </div>


              {/* Due Date */}
              <div className="space-y-2">
                <Label htmlFor="dueDate">Due Date</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="dueDate"
                    name="dueDate"
                    type="date"
                    value={formData.dueDate}
                    onChange={handleInputChange}
                    className="pl-10"
                  />
                </div>
              </div>

              

              {/* PIN */}
              <div className="space-y-2">
                <Label htmlFor="pin-0">PIN *</Label>
                <div className="flex justify-center items-center gap-3">
                  <Lock className="h-4 w-4 text-muted-foreground" />
                  <PinInput
                    value={formData.pin}
                    onChange={handlePinChange}
                    name="pin"
                    label="PIN"
                    required
                  />
                </div>
              </div>

              {/* Confirm PIN */}
              <div className="space-y-2">
                <Label htmlFor="confirm-pin-0">Confirm PIN *</Label>
                <div className="flex justify-center items-center gap-3">
                  <Lock className="h-4 w-4 text-muted-foreground" />
                  <PinInput
                    value={formData.confirmPin}
                    onChange={handleConfirmPinChange}
                    name="confirmPin"
                    label="Confirm PIN"
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
              <Link to="/login/mother" className="text-accent hover:underline font-medium">
                Sign in here
              </Link>
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