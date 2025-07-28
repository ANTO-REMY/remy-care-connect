import { ArrowRight, Heart, Users, Shield, Smartphone, Clock, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import heroImage from "@/assets/hero-mother-baby.jpg";
import chwImage from "@/assets/chw-community.jpg";
import nurseImage from "@/assets/nurse-tech.jpg";

const LandingPagePhotos = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* SEO and Meta */}
      <head>
        <title>RemyAfya - Transforming Maternal Healthcare in Africa | Digital Health Platform</title>
        <meta name="description" content="RemyAfya connects mothers, community health workers, and nurses through innovative digital health technology. Improving maternal and child health outcomes across Africa." />
        <meta name="keywords" content="maternal health, digital health, Africa, pregnancy care, community health workers, telemedicine" />
        <meta name="author" content="RemyAfya" />
        <meta property="og:title" content="RemyAfya - Transforming Maternal Healthcare in Africa" />
        <meta property="og:description" content="Connecting mothers, CHWs, and nurses for better health outcomes" />
        <meta property="og:type" content="website" />
        <link rel="canonical" href="/landing-photos" />
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
              <a href="#features" className="text-foreground hover:text-accent transition-colors">Features</a>
              <a href="#about" className="text-foreground hover:text-accent transition-colors">About</a>
              <a href="#contact" className="text-foreground hover:text-accent transition-colors">Contact</a>
              <Button asChild>
                <a href="/">Get Started</a>
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="container mx-auto px-4 py-12 lg:py-20">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="space-y-4">
                <h1 className="text-4xl md:text-6xl font-bold text-primary leading-tight">
                  Transforming
                  <span className="text-accent block">Maternal Healthcare</span>
                  in Africa
                </h1>
                <p className="text-xl text-muted-foreground leading-relaxed">
                  Connecting mothers, community health workers, and nurses through innovative digital health technology. 
                  Improving maternal and child health outcomes with personalized care and real-time support.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="lg" className="group" asChild>
                  <a href="/">
                    Start Your Journey
                    <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </a>
                </Button>
                <Button variant="outline" size="lg">
                  Learn More
                </Button>
              </div>
              <div className="flex items-center space-x-8 text-sm text-muted-foreground">
                <div className="flex items-center space-x-2">
                  <Users className="h-4 w-4" />
                  <span>10,000+ Mothers</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Shield className="h-4 w-4" />
                  <span>Secure & Private</span>
                </div>
              </div>
            </div>
            <div className="relative">
              <img 
                src={heroImage} 
                alt="Mother holding baby in modern healthcare setting"
                className="rounded-2xl shadow-medical w-full h-auto object-cover"
                loading="eager"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-primary/20 to-transparent rounded-2xl"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-16 lg:py-24 bg-secondary/20">
        <div className="container mx-auto px-4">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-primary">
              Comprehensive Healthcare Platform
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Our integrated platform serves three key user groups with specialized tools and features designed for optimal maternal and child health outcomes.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Mothers Card */}
            <Card className="relative overflow-hidden hover:shadow-accent transition-all duration-300 group">
              <div className="aspect-video relative overflow-hidden">
                <img 
                  src={heroImage} 
                  alt="Mothers using RemyAfya platform"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-primary/60 to-transparent"></div>
                <div className="absolute bottom-4 left-4 text-white">
                  <Heart className="h-8 w-8 mb-2" />
                  <h3 className="text-2xl font-bold">For Mothers</h3>
                </div>
              </div>
              <CardContent className="p-6">
                <CardDescription className="text-base mb-4">
                  Personalized pregnancy tracking, appointment scheduling, health education, and direct communication with healthcare providers.
                </CardDescription>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center">
                    <Clock className="h-4 w-4 mr-2 text-accent" />
                    24/7 Health Monitoring
                  </li>
                  <li className="flex items-center">
                    <Smartphone className="h-4 w-4 mr-2 text-accent" />
                    Mobile Health Records
                  </li>
                  <li className="flex items-center">
                    <Users className="h-4 w-4 mr-2 text-accent" />
                    Community Support
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* CHW Card */}
            <Card className="relative overflow-hidden hover:shadow-accent transition-all duration-300 group">
              <div className="aspect-video relative overflow-hidden">
                <img 
                  src={chwImage} 
                  alt="Community Health Worker with digital tools"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-primary/60 to-transparent"></div>
                <div className="absolute bottom-4 left-4 text-white">
                  <Users className="h-8 w-8 mb-2" />
                  <h3 className="text-2xl font-bold">For CHWs</h3>
                </div>
              </div>
              <CardContent className="p-6">
                <CardDescription className="text-base mb-4">
                  Digital tools for patient management, visit scheduling, health assessments, and seamless escalation to healthcare facilities.
                </CardDescription>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center">
                    <Shield className="h-4 w-4 mr-2 text-accent" />
                    Patient Management
                  </li>
                  <li className="flex items-center">
                    <Smartphone className="h-4 w-4 mr-2 text-accent" />
                    Mobile Assessments
                  </li>
                  <li className="flex items-center">
                    <ArrowRight className="h-4 w-4 mr-2 text-accent" />
                    Care Escalation
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Nurses Card */}
            <Card className="relative overflow-hidden hover:shadow-accent transition-all duration-300 group">
              <div className="aspect-video relative overflow-hidden">
                <img 
                  src={nurseImage} 
                  alt="Nurse using digital health technology"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-primary/60 to-transparent"></div>
                <div className="absolute bottom-4 left-4 text-white">
                  <Shield className="h-8 w-8 mb-2" />
                  <h3 className="text-2xl font-bold">For Nurses</h3>
                </div>
              </div>
              <CardContent className="p-6">
                <CardDescription className="text-base mb-4">
                  Comprehensive patient oversight, case management, clinical decision support, and coordination with CHWs in the field.
                </CardDescription>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center">
                    <Award className="h-4 w-4 mr-2 text-accent" />
                    Clinical Oversight
                  </li>
                  <li className="flex items-center">
                    <Users className="h-4 w-4 mr-2 text-accent" />
                    Case Management
                  </li>
                  <li className="flex items-center">
                    <Clock className="h-4 w-4 mr-2 text-accent" />
                    Real-time Monitoring
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Impact Section */}
      <section className="py-16 lg:py-24">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="space-y-4">
                <h2 className="text-3xl md:text-5xl font-bold text-primary">
                  Making a Real Impact
                </h2>
                <p className="text-xl text-muted-foreground">
                  Our platform is designed to address the critical challenges in maternal healthcare across Africa, 
                  providing accessible, affordable, and quality care for all.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="text-center p-6 bg-accent/10 rounded-xl">
                  <div className="text-3xl font-bold text-accent mb-2">95%</div>
                  <div className="text-sm text-muted-foreground">Patient Satisfaction</div>
                </div>
                <div className="text-center p-6 bg-success/10 rounded-xl">
                  <div className="text-3xl font-bold text-success mb-2">80%</div>
                  <div className="text-sm text-muted-foreground">Faster Care Access</div>
                </div>
                <div className="text-center p-6 bg-warning/10 rounded-xl">
                  <div className="text-3xl font-bold text-warning mb-2">10K+</div>
                  <div className="text-sm text-muted-foreground">Lives Improved</div>
                </div>
                <div className="text-center p-6 bg-primary/10 rounded-xl">
                  <div className="text-3xl font-bold text-primary mb-2">24/7</div>
                  <div className="text-sm text-muted-foreground">Support Available</div>
                </div>
              </div>
            </div>
            <div className="relative">
              <img 
                src={chwImage} 
                alt="Community health worker providing care"
                className="rounded-2xl shadow-medical w-full h-auto object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-accent/20 to-transparent rounded-2xl"></div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 lg:py-24 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto space-y-8">
            <h2 className="text-3xl md:text-5xl font-bold">
              Ready to Transform Healthcare?
            </h2>
            <p className="text-xl opacity-90">
              Join thousands of mothers, CHWs, and nurses who are already experiencing better health outcomes with RemyAfya.
            </p>
            <Button size="lg" variant="secondary" className="group" asChild>
              <a href="/">
                Get Started Today
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </a>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-secondary/30">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Heart className="h-6 w-6 text-accent" />
                <span className="text-xl font-bold text-primary">RemyAfya</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Transforming maternal healthcare through innovative digital solutions.
              </p>
            </div>
            <div className="space-y-4">
              <h3 className="font-semibold text-primary">Platform</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-accent transition-colors">For Mothers</a></li>
                <li><a href="#" className="hover:text-accent transition-colors">For CHWs</a></li>
                <li><a href="#" className="hover:text-accent transition-colors">For Nurses</a></li>
              </ul>
            </div>
            <div className="space-y-4">
              <h3 className="font-semibold text-primary">Company</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-accent transition-colors">About Us</a></li>
                <li><a href="#" className="hover:text-accent transition-colors">Contact</a></li>
                <li><a href="#" className="hover:text-accent transition-colors">Privacy</a></li>
              </ul>
            </div>
            <div className="space-y-4">
              <h3 className="font-semibold text-primary">Support</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-accent transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-accent transition-colors">Documentation</a></li>
                <li><a href="#" className="hover:text-accent transition-colors">Status</a></li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-border text-center text-sm text-muted-foreground">
            <p>&copy; 2024 RemyAfya. All rights reserved. Made with ❤️ for better healthcare.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPagePhotos;