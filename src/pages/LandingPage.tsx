import { ArrowRight, Heart, Users, Shield, Smartphone, Clock, Award, CheckCircle, Zap, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import networkIllustration from "@/assets/healthcare-network-illustration.jpg";
import platformIllustration from "@/assets/platform-features-illustration.jpg";
import journeyIllustration from "@/assets/pregnancy-journey-illustration.jpg";

const LandingPage = () => {
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
      <nav className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 border-b border-border">
        <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Heart className="h-6 w-6 sm:h-8 sm:w-8 text-accent" />
              <span className="text-lg sm:text-xl md:text-2xl font-bold text-primary">RemyAfya</span>
            </div>
            <div className="hidden md:flex items-center space-x-6 lg:space-x-8">
              <a href="#platform" className="text-sm lg:text-base text-foreground hover:text-accent transition-colors">Platform</a>
              <a href="#features" className="text-sm lg:text-base text-foreground hover:text-accent transition-colors">Features</a>
              <a href="#impact" className="text-sm lg:text-base text-foreground hover:text-accent transition-colors">Impact</a>
              <Button onClick={() => navigate('/login/mother')} variant="outline" size="sm" className="text-sm">
                Login
              </Button>
            </div>
            <div className="md:hidden">
              <Button onClick={() => navigate('/login/mother')} size="sm" variant="outline">
                <span className="text-xs">Login</span>
              </Button>
            </div>
          </div>
        </div>
      </nav>

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
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-4 pt-4">
              <Button 
                size="lg" 
                className="group text-sm sm:text-base lg:text-lg px-6 sm:px-8 py-4 sm:py-6" 
                onClick={() => navigate('/register/mother')}
              >
                Get Started as a Pregnant Mother
                <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button 
                variant="outline" 
                size="lg" 
                className="text-sm sm:text-base lg:text-lg px-6 sm:px-8 py-4 sm:py-6"
                onClick={() => navigate('/register/healthworker')}
              >
                Get Started as a Health Worker
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

      {/* Footer */}
      <footer className="bg-primary text-primary-foreground py-12">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Heart className="h-8 w-8" />
            <span className="text-2xl font-bold">RemyAfya</span>
          </div>
          <p className="text-primary-foreground/80 mb-6">
            Connecting communities for better maternal health outcomes
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              variant="outline" 
              className="bg-transparent border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10"
              onClick={() => navigate('/register/mother')}
            >
              Join as Mother
            </Button>
            <Button 
              variant="outline" 
              className="bg-transparent border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10"
              onClick={() => navigate('/register/healthworker')}
            >
              Join as Health Worker
            </Button>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;