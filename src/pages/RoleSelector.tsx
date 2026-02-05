import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, UserCheck, Stethoscope } from "lucide-react";

export default function RoleSelector() {
  const navigate = useNavigate();

  const roles = [
    {
      id: 'mother',
      title: 'Pregnant Mother',
      description: 'Access your health check-ins, weekly tips, and connect with your CHW',
      icon: Heart,
      path: '/mother',
      color: 'bg-pink-500'
    },
    {
      id: 'chw',
      title: 'Community Health Worker',
      description: 'Monitor assigned mothers, manage alerts, and access educational materials',
      icon: UserCheck,
      path: '/chw',
      color: 'bg-blue-500'
    },
    {
      id: 'nurse',
      title: 'Nurse Supervisor',
      description: 'Oversee critical cases escalated by CHWs and provide guidance',
      icon: Stethoscope,
      path: '/nurse',
      color: 'bg-green-500'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-accent/5 flex items-center justify-center p-3 sm:p-4">
      <div className="w-full max-w-4xl">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-primary">RemyAfya</h1>
          </div>
          <p className="text-lg sm:text-xl text-muted-foreground mb-2">
            Maternal Health Platform
          </p>
          <p className="text-sm text-muted-foreground px-4">
            Please select your role to continue
          </p>
        </div>

        {/* Role Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {roles.map((role) => (
            <Card key={role.id} className="hover:shadow-lg transition-shadow cursor-pointer group">
              <CardHeader className="text-center pb-4 p-4 sm:p-6">
                <div className={`w-12 h-12 sm:w-16 sm:h-16 ${role.color} rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4 group-hover:scale-110 transition-transform`}>
                  <role.icon className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
                </div>
                <CardTitle className="text-lg sm:text-xl">{role.title}</CardTitle>
                <CardDescription className="text-center text-sm sm:text-base px-2">
                  {role.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0 p-4 sm:p-6">
                <Button 
                  onClick={() => navigate(role.path)}
                  className="w-full text-sm sm:text-base"
                  size="lg"
                >
                  Enter Dashboard
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Landing Pages */}
        <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
          <Button 
            variant="outline" 
            onClick={() => navigate('/landing-illustrations')}
            className="group w-full sm:w-auto"
          >
            <Stethoscope className="mr-2 h-4 w-4" />
            <span className="text-sm sm:text-base">Landing Page (Illustrations)</span>
          </Button>
        </div>
      </div>
    </div>
  );
}