import { ArrowRight, Heart, Users, Shield, Smartphone, Clock, Award, CheckCircle, Zap, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import networkIllustration from "@/assets/healthcare-network-illustration.jpg";
import platformIllustration from "@/assets/platform-features-illustration.jpg";
import journeyIllustration from "@/assets/pregnancy-journey-illustration.jpg";

const LandingPageIllustrations = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* SEO and Meta */}
      <head>
        <title>RemyAfya - Digital Maternal Healthcare Platform | Connect • Care • Thrive</title>
        <meta name="description" content="Revolutionary digital health platform connecting mothers, community health workers, and nurses across Africa. Empowering better maternal and child health outcomes through technology." />
        <meta name="keywords" content="digital health platform, maternal care, Africa healthcare, pregnancy tracking, community health, telemedicine, mobile health" />
        <meta name="author" content="RemyAfya" />
        <meta property="og:title" content="RemyAfya - Digital Maternal Healthcare Platform" />
        <meta property="og:description" content="Empowering mothers and healthcare workers with innovative digital solutions" />
        <meta property="og:type" content="website" />
        <link rel="canonical" href="/landing-illustrations" />
      </head>

      {/* Navigation */}
      <nav className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Heart className="h-8 w-8 text-accent" />
              <span className="text-2xl font-bold text-primary">RemyAfya</span>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <a href="#platform" className="text-foreground hover:text-accent transition-colors">Platform</a>
              <a href="#features" className="text-foreground hover:text-accent transition-colors">Features</a>
              <a href="#impact" className="text-foreground hover:text-accent transition-colors">Impact</a>
              <Button asChild>
                <a href="/">Start Journey</a>
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-background via-secondary/10 to-accent/5">
        <div className="absolute inset-0 bg-grid-primary/[0.02] bg-[size:20px_20px]"></div>
        <div className="container mx-auto px-4 py-16 lg:py-24 relative">
          <div className="text-center space-y-8 max-w-4xl mx-auto">
            <div className="inline-flex items-center space-x-2 bg-accent/10 px-4 py-2 rounded-full text-sm text-accent font-medium">
              <Zap className="h-4 w-4" />
              <span>Revolutionizing Maternal Healthcare</span>
            </div>
            <h1 className="text-4xl md:text-7xl font-bold text-primary leading-tight">
              Connect
              <span className="text-accent">•</span>
              Care
              <span className="text-accent">•</span>
              <span className="text-accent block mt-2">Thrive</span>
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground leading-relaxed max-w-3xl mx-auto">
              Empowering mothers, community health workers, and nurses with innovative digital health solutions. 
              Building a connected ecosystem for better maternal and child health outcomes across Africa.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="group text-lg px-8 py-6" asChild>
                <a href="/">
                  Experience the Platform
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </a>
              </Button>
              <Button variant="outline" size="lg" className="text-lg px-8 py-6">
                Watch Demo
              </Button>
            </div>
            <div className="flex justify-center items-center space-x-12 text-sm text-muted-foreground mt-12">
              <div className="flex items-center space-x-2">
                <Shield className="h-5 w-5 text-success" />
                <span>HIPAA Compliant</span>
              </div>
              <div className="flex items-center space-x-2">
                <Globe className="h-5 w-5 text-accent" />
                <span>Available in 5+ Languages</span>
              </div>
              <div className="flex items-center space-x-2">
                <Clock className="h-5 w-5 text-warning" />
                <span>24/7 Support</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Platform Overview */}
      <section id="platform" className="py-16 lg:py-24">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="space-y-4">
                <h2 className="text-3xl md:text-5xl font-bold text-primary">
                  Integrated Healthcare
                  <span className="text-accent block">Ecosystem</span>
                </h2>
                <p className="text-xl text-muted-foreground leading-relaxed">
                  Our comprehensive platform seamlessly connects all stakeholders in the maternal healthcare journey, 
                  creating a unified network that ensures no mother is left behind.
                </p>
              </div>
              <div className="space-y-4">
                <div className="flex items-start space-x-4">
                  <div className="bg-accent/10 p-2 rounded-lg">
                    <Users className="h-6 w-6 text-accent" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-primary">Connected Community</h3>
                    <p className="text-muted-foreground">Real-time communication between mothers, CHWs, and healthcare facilities.</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="bg-success/10 p-2 rounded-lg">
                    <Smartphone className="h-6 w-6 text-success" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-primary">Mobile-First Design</h3>
                    <p className="text-muted-foreground">Optimized for smartphones with offline capabilities for rural areas.</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="bg-warning/10 p-2 rounded-lg">
                    <Shield className="h-6 w-6 text-warning" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-primary">Secure & Private</h3>
                    <p className="text-muted-foreground">End-to-end encryption ensuring patient data privacy and security.</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="aspect-square relative overflow-hidden rounded-3xl bg-gradient-to-br from-accent/10 to-primary/10 p-8">
                <img 
                  src={networkIllustration} 
                  alt="Healthcare network connecting mothers, CHWs, and nurses"
                  className="w-full h-full object-contain"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Showcase */}
      <section id="features" className="py-16 lg:py-24 bg-secondary/20">
        <div className="container mx-auto px-4">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-primary">
              Powerful Features for Every User
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Tailored experiences designed specifically for mothers, community health workers, and nurses, 
              each with tools that matter most to their unique needs.
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
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
                    <span className="text-sm">Personalized pregnancy tracking and milestones</span>
                  </li>
                  <li className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 text-success flex-shrink-0" />
                    <span className="text-sm">Appointment scheduling and reminders</span>
                  </li>
                  <li className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 text-success flex-shrink-0" />
                    <span className="text-sm">Health education and resources</span>
                  </li>
                  <li className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 text-success flex-shrink-0" />
                    <span className="text-sm">Emergency support and escalation</span>
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
                    <span className="text-sm">Patient management and visit scheduling</span>
                  </li>
                  <li className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 text-success flex-shrink-0" />
                    <span className="text-sm">Digital health assessments and forms</span>
                  </li>
                  <li className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 text-success flex-shrink-0" />
                    <span className="text-sm">Real-time escalation to nurses</span>
                  </li>
                  <li className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 text-success flex-shrink-0" />
                    <span className="text-sm">Performance tracking and analytics</span>
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
                    <CardDescription className="text-base">Clinical oversight and care</CardDescription>
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
                    <span className="text-sm">Comprehensive patient oversight</span>
                  </li>
                  <li className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 text-success flex-shrink-0" />
                    <span className="text-sm">Case management and prioritization</span>
                  </li>
                  <li className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 text-success flex-shrink-0" />
                    <span className="text-sm">Clinical decision support tools</span>
                  </li>
                  <li className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 text-success flex-shrink-0" />
                    <span className="text-sm">CHW coordination and supervision</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Impact Statistics */}
      <section id="impact" className="py-16 lg:py-24">
        <div className="container mx-auto px-4">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-primary">
              Measurable Impact
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Real results from communities using RemyAfya to transform their healthcare delivery and outcomes.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center space-y-4 p-8 bg-gradient-to-br from-accent/10 to-accent/5 rounded-2xl">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-accent/20 rounded-full">
                <Heart className="h-8 w-8 text-accent" />
              </div>
              <div className="text-4xl font-bold text-accent">15,000+</div>
              <div className="text-lg font-medium text-primary">Mothers Supported</div>
              <div className="text-sm text-muted-foreground">Across 12 African countries</div>
            </div>

            <div className="text-center space-y-4 p-8 bg-gradient-to-br from-success/10 to-success/5 rounded-2xl">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-success/20 rounded-full">
                <Users className="h-8 w-8 text-success" />
              </div>
              <div className="text-4xl font-bold text-success">2,500+</div>
              <div className="text-lg font-medium text-primary">Active CHWs</div>
              <div className="text-sm text-muted-foreground">Serving rural communities</div>
            </div>

            <div className="text-center space-y-4 p-8 bg-gradient-to-br from-warning/10 to-warning/5 rounded-2xl">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-warning/20 rounded-full">
                <Shield className="h-8 w-8 text-warning" />
              </div>
              <div className="text-4xl font-bold text-warning">800+</div>
              <div className="text-lg font-medium text-primary">Healthcare Facilities</div>
              <div className="text-sm text-muted-foreground">Connected to the network</div>
            </div>

            <div className="text-center space-y-4 p-8 bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/20 rounded-full">
                <Award className="h-8 w-8 text-primary" />
              </div>
              <div className="text-4xl font-bold text-primary">98%</div>
              <div className="text-lg font-medium text-primary">User Satisfaction</div>
              <div className="text-sm text-muted-foreground">Based on user feedback</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 lg:py-24 bg-gradient-to-r from-primary via-primary to-accent text-primary-foreground relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:20px_20px]"></div>
        <div className="container mx-auto px-4 relative">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <h2 className="text-3xl md:text-6xl font-bold">
              Join the Healthcare Revolution
            </h2>
            <p className="text-xl md:text-2xl opacity-90 leading-relaxed">
              Be part of the digital transformation that's improving maternal health outcomes across Africa. 
              Start your journey with RemyAfya today.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" variant="secondary" className="group text-lg px-8 py-6" asChild>
                <a href="/">
                  Start Your Journey Now
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </a>
              </Button>
              <Button size="lg" variant="outline" className="text-lg px-8 py-6 border-white/20 text-white hover:bg-white/10">
                Schedule a Demo
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-5 gap-8">
            <div className="md:col-span-2 space-y-6">
              <div className="flex items-center space-x-2">
                <Heart className="h-8 w-8 text-accent" />
                <span className="text-2xl font-bold">RemyAfya</span>
              </div>
              <p className="text-primary-foreground/80 max-w-md">
                Transforming maternal healthcare across Africa through innovative digital solutions that connect communities and save lives.
              </p>
              <div className="flex space-x-4">
                <Button size="sm" variant="secondary">
                  Download App
                </Button>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Platform</h3>
              <ul className="space-y-3 text-primary-foreground/80">
                <li><a href="#" className="hover:text-accent transition-colors">For Mothers</a></li>
                <li><a href="#" className="hover:text-accent transition-colors">For CHWs</a></li>
                <li><a href="#" className="hover:text-accent transition-colors">For Nurses</a></li>
                <li><a href="#" className="hover:text-accent transition-colors">Healthcare Facilities</a></li>
              </ul>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Company</h3>
              <ul className="space-y-3 text-primary-foreground/80">
                <li><a href="#" className="hover:text-accent transition-colors">About Us</a></li>
                <li><a href="#" className="hover:text-accent transition-colors">Our Mission</a></li>
                <li><a href="#" className="hover:text-accent transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-accent transition-colors">Press</a></li>
              </ul>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Support</h3>
              <ul className="space-y-3 text-primary-foreground/80">
                <li><a href="#" className="hover:text-accent transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-accent transition-colors">Documentation</a></li>
                <li><a href="#" className="hover:text-accent transition-colors">Contact Us</a></li>
                <li><a href="#" className="hover:text-accent transition-colors">System Status</a></li>
              </ul>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-primary-foreground/10">
            <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
              <p className="text-primary-foreground/60 text-sm">
                &copy; 2024 RemyAfya. All rights reserved. Made with ❤️ for better healthcare in Africa.
              </p>
              <div className="flex space-x-6 text-sm text-primary-foreground/60">
                <a href="#" className="hover:text-accent transition-colors">Privacy Policy</a>
                <a href="#" className="hover:text-accent transition-colors">Terms of Service</a>
                <a href="#" className="hover:text-accent transition-colors">Cookies</a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPageIllustrations;