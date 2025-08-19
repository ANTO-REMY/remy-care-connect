import { useState } from 'react';
import { PinInput } from '@/components/PinInput';
import { useNavigate, Link } from 'react-router-dom';
import { Phone, Lock, UserCheck, Stethoscope } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

const roles = [
  { label: 'Mother', value: 'mother', icon: null },
  { label: 'CHW', value: 'chw', icon: UserCheck },
  { label: 'Nurse', value: 'nurse', icon: Stethoscope }
];

import { RegisterModal } from '@/components/RegisterModal';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    phone: '',
    pin: '',
    role: 'mother',
  });
  const [showRegisterModal, setShowRegisterModal] = useState(false);


  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handlePinChange = (val: string) => {
    setFormData({ ...formData, pin: val });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // No validation, allow free navigation
    try {
      // Always welcome toast, regardless of credentials
      toast({
        title: `Welcome, ${formData.role.charAt(0).toUpperCase() + formData.role.slice(1)}!`,
        description: "You've successfully logged in.",
      });
      // Navigate to dashboard for selected role
      navigate(`/dashboard/${formData.role}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterRoleSelect = (role: 'mother' | 'chw' | 'nurse') => {
    setShowRegisterModal(false);
    if (role === 'mother') navigate('/register/mother');
    else navigate('/register/healthworker', { state: { role } });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-accent/5 to-primary/5 flex items-center justify-center p-3 sm:p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-6">
          <Link to="/" className="inline-flex items-center space-x-2 mb-4 hover:opacity-80 transition-opacity">
            <span className="text-2xl font-bold text-primary">RemyAfya</span>
          </Link>
          <h1 className="text-2xl font-bold text-primary mb-2">Welcome Back</h1>
          <p className="text-muted-foreground">
            Sign in to continue your journey
          </p>
        </div>
        <Card>
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-xl">Sign In</CardTitle>
            <CardDescription>
              Enter your credentials to access your dashboard
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Role Selector */}
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <select
                  id="role"
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                  className="w-full border rounded px-3 py-2 bg-background text-foreground"
                >
                  {roles.map((role) => (
                    <option key={role.value} value={role.value}>
                      {role.label}
                    </option>
                  ))}
                </select>
              </div>
              {/* Phone Number */}
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
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
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Signing In..." : "Sign In"}
              </Button>
            </form>
            <div className="mt-4 text-center text-sm">
              <span className="text-muted-foreground">Don't have an account? </span>
              <button type="button" className="text-accent hover:underline font-medium" onClick={() => setShowRegisterModal(true)}>
                Register here
              </button>
            </div>
          </CardContent>
        </Card>
        {/* Quick Login for Demo */}
        <div className="mt-4 p-3 bg-muted/50 rounded-lg border border-dashed border-muted-foreground/30">
          <p className="text-xs text-muted-foreground text-center mb-2">
            Demo Mode - Quick Login Options:
          </p>
          <div className="space-y-1 text-xs text-center">
            <div>Mother: +254700000001 | Pass: demo123</div>
            <div>CHW: +254700000002 | Pass: demo123</div>
            <div>Nurse: +254700000003 | Pass: demo123</div>
          </div>
        </div>
        <div className="mt-4 text-center">
          <Link to="/" className="text-sm text-muted-foreground hover:text-accent transition-colors">
            ← Back to home
          </Link>
        </div>
      </div>
      <RegisterModal
        open={showRegisterModal}
        onClose={() => setShowRegisterModal(false)}
        onSelect={handleRegisterRoleSelect}
      />
    </div>
  );
}
