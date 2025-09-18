import { ArrowRight, Users, Shield, Smartphone, Clock, Award, CheckCircle, Zap, Globe, Heart } from "lucide-react";
import { RegisterModal } from "@/components/RegisterModal";
import { Navigation } from "@/components/layout/Navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import networkIllustration from "@/assets/healthcare-network-illustration.jpg";
import platformIllustration from "@/assets/platform-features-illustration.jpg";
import journeyIllustration from "@/assets/pregnancy-journey-illustration.jpg";

const LandingPage = () => {
  const [registerModalOpen, setRegisterModalOpen] = useState(false);

  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* SEO Meta */}
      <head>
        <title>RemyAfya - Digital Maternal Healthcare Platform | Connect • Care • Thrive</title>
        <meta name="description" content="Revolutionary digital health platform connecting mothers, community health workers, and nurses across Africa. Join thousands improving maternal health outcomes." />
        <meta name="keywords" content="digital health platform, maternal care, Africa healthcare, pregnancy tracking, community health, telemedicine, mobile health" />
        <meta name="author" content="RemyAfya" />
        <meta property="og:title" content="RemyAfya - Digital Maternal Healthcare Platform" />
        <meta property="og:description" content="Empowering mothers and healthcare workers with innovative digital solutions" />
        <meta property="og:type" content="website" />
        <link rel="canonical" href="/" />
      </head>

      {/* Navigation */}
      <Navigation
        onLogin={() => navigate('/login')}
        onRegister={() => setRegisterModalOpen(true)}
        onHome={() => navigate('/')}
      />

      <RegisterModal
        open={registerModalOpen}
        onClose={() => setRegisterModalOpen(false)}
        onSelect={(role) => {
          setRegisterModalOpen(false);
          if (role === 'mother') {
            navigate('/register/mother');
          } else if (role === 'chw' || role === 'nurse') {
            navigate('/register/healthworker', { state: { role } });
          }
        }}
      />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-background via-secondary/10 to-accent/5">
        <div className="absolute inset-0 bg-grid-primary/[0.02] bg-[size:20px_20px]"></div>
        <div className="container mx-auto px-3 sm:px-4 py-12 sm:py-16 lg:py-24 relative">
          <div className="text-center space-y-6 sm:space-y-8 max-w-4xl mx-auto">
            <div className="inline-flex items-center space-x-2 bg-accent/10 px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm text-accent font-medium">
              <Zap className="h-3 w-3 sm:h-4 sm:w-4" />
              <span>Revolutionizing Maternal Healthcare</span>
            </div>
            <h1 className="text-2xl sm:text-4xl md:text-5xl lg:text-7xl font-bold text-primary leading-tight px-4">
              Connect
              <span className="text-accent">•</span>
              Care
              <span className="text-accent">•</span>
              <span className="text-accent block mt-2">Thrive</span>
            </h1>
            <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-muted-foreground leading-relaxed max-w-3xl mx-auto px-4">
              Empowering mothers, community health workers, and nurses with innovative digital health solutions. 
              Building a connected ecosystem for better maternal and child health outcomes across Africa.
            </p>
            
            {/* Main CTA Buttons */}
            <div className="flex justify-center px-4 pt-4">
  <Button
    size="lg"
    className="group text-sm sm:text-base lg:text-lg px-8 sm:px-12 py-4 sm:py-6 font-semibold shadow-md"
    onClick={() => setRegisterModalOpen(true)}
  >
    Get Started with RemyAfya
    <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5 group-hover:translate-x-1 transition-transform" />
  </Button>
</div>
            
            <div className="flex flex-col sm:flex-row justify-center items-center gap-4 sm:gap-6 lg:gap-12 text-xs sm:text-sm text-muted-foreground mt-8 sm:mt-12 px-4">
              <div className="flex items-center space-x-2">
                <Shield className="h-4 w-4 sm:h-5 sm:w-5 text-success" />
                <span>HIPAA Compliant</span>
              </div>
              <div className="flex items-center space-x-2">
                <Globe className="h-4 w-4 sm:h-5 sm:w-5 text-accent" />
                <span className="hidden sm:inline">Available in 5+ Languages</span>
                <span className="sm:hidden">Multilingual</span>
              </div>
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-warning" />
                <span>24/7 Support</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Platform Section */}
      <section id="platform" className="py-16 lg:py-24 bg-gradient-to-br from-primary/5 to-accent/5">
        <div className="container mx-auto px-4">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-primary">
              Our Platform
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              A comprehensive digital health ecosystem designed to connect and empower healthcare providers and mothers across Africa.
            </p>
          </div>
        </div>
      </section>

      {/* Features Preview */}
      <section id="features" className="py-16 lg:py-24 bg-secondary/20">
        <div className="container mx-auto px-4">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-primary">
              Powerful Features for Every User
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Tailored experiences designed specifically for mothers, community health workers, and nurses.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            {/* Mothers */}
            <Card className="relative overflow-hidden hover:shadow-accent transition-all duration-300 border-0 bg-gradient-to-br from-background to-accent/5">
              <CardHeader className="pb-4">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="bg-accent/10 p-3 rounded-xl">
                    <Heart className="h-8 w-8 text-accent" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl text-primary">For Mothers</CardTitle>
                    <CardDescription className="text-base">Empowering maternal journeys</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="aspect-video bg-gradient-to-br from-accent/10 to-accent/5 rounded-xl p-4 flex items-center justify-center">
                  <img 
                    src={journeyIllustration} 
                    alt="Pregnancy journey tracking illustration"
                    className="w-full h-full object-contain"
                  />
                </div>
                <ul className="space-y-3">
                  <li className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 text-success flex-shrink-0" />
                    <span className="text-sm">Personalized pregnancy tracking</span>
                  </li>
                  <li className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 text-success flex-shrink-0" />
                    <span className="text-sm">Appointment scheduling</span>
                  </li>
                  <li className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 text-success flex-shrink-0" />
                    <span className="text-sm">Health education resources</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* CHWs */}
            <Card className="relative overflow-hidden hover:shadow-accent transition-all duration-300 border-0 bg-gradient-to-br from-background to-primary/5">
              <CardHeader className="pb-4">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="bg-primary/10 p-3 rounded-xl">
                    <Users className="h-8 w-8 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl text-primary">For CHWs</CardTitle>
                    <CardDescription className="text-base">Community care management</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="aspect-video bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl p-4 flex items-center justify-center">
                  <img 
                    src={platformIllustration} 
                    alt="Digital health platform features"
                    className="w-full h-full object-contain"
                  />
                </div>
                <ul className="space-y-3">
                  <li className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 text-success flex-shrink-0" />
                    <span className="text-sm">Patient management</span>
                  </li>
                  <li className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 text-success flex-shrink-0" />
                    <span className="text-sm">Digital health assessments</span>
                  </li>
                  <li className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 text-success flex-shrink-0" />
                    <span className="text-sm">Real-time escalation</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Nurses */}
            <Card className="relative overflow-hidden hover:shadow-accent transition-all duration-300 border-0 bg-gradient-to-br from-background to-success/5">
              <CardHeader className="pb-4">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="bg-success/10 p-3 rounded-xl">
                    <Shield className="h-8 w-8 text-success" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl text-primary">For Nurses</CardTitle>
                    <CardDescription className="text-base">Clinical oversight</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="aspect-video bg-gradient-to-br from-success/10 to-success/5 rounded-xl p-4 flex items-center justify-center">
                  <img 
                    src={networkIllustration} 
                    alt="Healthcare network management"
                    className="w-full h-full object-contain"
                  />
                </div>
                <ul className="space-y-3">
                  <li className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 text-success flex-shrink-0" />
                    <span className="text-sm">Patient oversight</span>
                  </li>
                  <li className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 text-success flex-shrink-0" />
                    <span className="text-sm">Case management</span>
                  </li>
                  <li className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 text-success flex-shrink-0" />
                    <span className="text-sm">CHW coordination</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Impact Section */}
      <section id="impact" className="py-16 lg:py-24 bg-gradient-to-br from-success/5 to-primary/5">
        <div className="container mx-auto px-4">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-primary">
              Our Impact
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Making a real difference in maternal health outcomes across communities.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center space-y-2">
              <div className="text-4xl font-bold text-accent">10,000+</div>
              <div className="text-lg text-muted-foreground">Mothers Supported</div>
            </div>
            <div className="text-center space-y-2">
              <div className="text-4xl font-bold text-primary">500+</div>
              <div className="text-lg text-muted-foreground">Healthcare Workers</div>
            </div>
            <div className="text-center space-y-2">
              <div className="text-4xl font-bold text-success">95%</div>
              <div className="text-lg text-muted-foreground">Satisfaction Rate</div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-primary text-primary-foreground py-10 mt-12">
        <div className="container mx-auto px-4 flex flex-col md:flex-row md:items-center md:justify-between gap-8">
          {/* Brand Section */}
          <div className="flex flex-col items-center md:items-start text-center md:text-left gap-2">
            <span className="text-2xl font-extrabold tracking-tight text-white">RemyAfya</span>
            <span className="text-sm text-primary-foreground/80">Connect • Care • Thrive</span>
            <span className="text-xs text-primary-foreground/60">Empowering maternal health across Africa</span>
          </div>

          {/* Navigation Links */}
          <div className="flex flex-col sm:flex-row gap-12 md:gap-20 items-start">
            <div className="space-y-2">
              <h3 className="text-accent font-semibold text-xs uppercase tracking-wide">Company</h3>
              <div className="flex flex-col gap-1">
                <Button variant="ghost" size="sm" className="justify-start px-0 text-primary-foreground/90 hover:text-accent" asChild>
                  <a href="#">About Us</a>
                </Button>
                <Button variant="ghost" size="sm" className="justify-start px-0 text-primary-foreground/90 hover:text-accent" asChild>
                  <a href="#">Contact</a>
                </Button>
                <Button variant="ghost" size="sm" className="justify-start px-0 text-primary-foreground/90 hover:text-accent" asChild>
                  <a href="#">Careers</a>
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <h3 className="text-accent font-semibold text-xs uppercase tracking-wide">Legal</h3>
              <div className="flex flex-col gap-1">
                <Button variant="ghost" size="sm" className="justify-start px-0 text-primary-foreground/90 hover:text-accent" asChild>
                  <a href="#">Privacy Policy</a>
                </Button>
                <Button variant="ghost" size="sm" className="justify-start px-0 text-primary-foreground/90 hover:text-accent" asChild>
                  <a href="#">Terms of Service</a>
                </Button>
              </div>
            </div>
          </div>

          {/* Social Media */}
          <div className="flex flex-col items-center gap-2">
            <div className="flex gap-3">
              <Button variant="outline" size="icon" className="rounded-full bg-white/10 hover:bg-accent/30 border-none">
                <span className="sr-only">Facebook</span>
                <svg className="w-5 h-5 text-primary-foreground" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M22.675 0h-21.35C.595 0 0 .592 0 1.326v21.348C0 23.406.595 24 1.326 24H12.82v-9.294H9.692v-3.622h3.128V8.413c0-3.1 1.893-4.788 4.659-4.788 1.325 0 2.463.099 2.797.143v3.24l-1.918.001c-1.504 0-1.797.715-1.797 1.763v2.313h3.587l-.467 3.622h-3.12V24h6.116C23.406 24 24 23.406 24 22.674V1.326C24 .592 23.406 0 22.675 0"/>
                </svg>
              </Button>
              <Button variant="outline" size="icon" className="rounded-full bg-white/10 hover:bg-accent/30 border-none">
                <span className="sr-only">Instagram</span>
                <svg className="w-5 h-5 text-primary-foreground" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
              </Button>
              <Button variant="outline" size="icon" className="rounded-full bg-white/10 hover:bg-accent/30 border-none">
                <span className="sr-only">Twitter</span>
                <svg className="w-5 h-5 text-primary-foreground" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                </svg>
              </Button>
            </div>
            <span className="text-xs text-primary-foreground/60 mt-2"> {new Date().getFullYear()} RemyAfya. All rights reserved.</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;