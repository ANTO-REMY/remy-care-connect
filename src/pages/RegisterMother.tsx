import { useState } from 'react';
import { PinInput } from '@/components/PinInput';
import { useNavigate, Link } from 'react-router-dom';
import { normalizePhoneNumber, validatePhoneNumber } from '@/lib/utils';
import { Calendar, MapPin, User, Phone, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/components/ui/sonner';
import VerifyOTPModal from '@/components/VerifyOTPModal';

export default function RegisterMother() {
  const navigate = useNavigate();
  const { register, verifyOTP } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [showVerify, setShowVerify] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
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
    if (!formData.firstName || !formData.lastName || !formData.phone || !formData.pin || !formData.location) {
      toast.warning('Missing information', {
        description: 'Please fill in all required fields before creating your account.',
      });
      setIsLoading(false);
      return;
    }

    if (!validatePhoneNumber(formData.phone)) {
      toast.error('Invalid phone number', {
        description: 'Please enter a valid Kenyan phone number (e.g. 0712345678).',
      });
      setIsLoading(false);
      return;
    }

    const normalizedPhone = normalizePhoneNumber(formData.phone);

    if (formData.pin !== formData.confirmPin) {
      toast.error('PINs do not match', {
        description: 'Make sure both PIN fields are identical before continuing.',
      });
      setIsLoading(false);
      return;
    }

    try {
      const result = await register({
        phone_number: normalizedPhone,
        first_name: formData.firstName.trim(),
        last_name: formData.lastName.trim(),
        pin: formData.pin,
        role: 'mother'
      });

      if (result.success) {
        toast.success('Almost there! 🎉', {
          description: "We've sent a verification code to your phone. Please check your messages.",
        });
        setShowVerify(true);
      } else {
        toast.error('Registration failed', {
          description: result.error || 'A user with this phone number may already exist. Try logging in instead.',
        });
      }
    } catch (error) {
      toast.error('Something went wrong', {
        description: 'We could not complete your registration. Please check your connection and try again.',
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
              const result = await verifyOTP(normalizePhoneNumber(formData.phone), otp);
              return result.success;
            } catch (error) {
              return false;
            }
          }}
          onResend={async () => {
            toast.info('Code resent', {
              description: 'A new verification code has been sent to your phone.',
            });
          }}
          onVerified={() => {
            toast.success('Phone verified! ✅', {
              description: 'Your account is ready. Please sign in with your credentials.',
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
              {/* Name row: First + Last side by side */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name *</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="firstName"
                      name="firstName"
                      type="text"
                      placeholder="Jane"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      className="pl-10"
                      required
                      autoComplete="given-name"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name *</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="lastName"
                      name="lastName"
                      type="text"
                      placeholder="Wanjiru"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      className="pl-10"
                      required
                      autoComplete="family-name"
                    />
                  </div>
                </div>
              </div>

              {/* Phone Number */}
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number (07xxxxxxxx) *</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    placeholder="0712345678"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="pl-10"
                    autoComplete="tel"
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