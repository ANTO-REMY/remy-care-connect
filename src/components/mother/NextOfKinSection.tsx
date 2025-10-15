import { useState } from "react";
import { User, Phone, Venus, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface NextOfKin {
  name: string;
  phone: string;
  sex: string;
  relationship: string;
}

interface NextOfKinSectionProps {
  kin: NextOfKin[];
  isEditing: boolean;
  onChange: (kin: NextOfKin[]) => void;
}

export function NextOfKinSection({ kin, isEditing, onChange }: NextOfKinSectionProps) {
  const handleKinChange = (index: number, field: keyof NextOfKin, value: string) => {
    const updated = kin.map((k, i) => i === index ? { ...k, [field]: value } : k);
    onChange(updated);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Next of Kin</CardTitle>
        <CardDescription>Provide details for at least one next of kin.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {[0, 1].map((i) => (
          <div key={i} className="space-y-3 border-b pb-4 last:border-b-0 last:pb-0">
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-5 w-5 text-primary" />
              <span className="font-semibold text-base">
                Next of Kin {i === 0 ? '(Required)' : '(Optional)'}
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor={`kin-name-${i}`}>Name</Label>
                <Input
                  id={`kin-name-${i}`}
                  value={kin[i]?.name || ''}
                  onChange={e => handleKinChange(i, 'name', e.target.value)}
                  disabled={!isEditing}
                  placeholder="Full Name"
                  required={i === 0}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`kin-phone-${i}`}>Phone Number</Label>
                <Input
                  id={`kin-phone-${i}`}
                  value={kin[i]?.phone || ''}
                  onChange={e => handleKinChange(i, 'phone', e.target.value)}
                  disabled={!isEditing}
                  placeholder="e.g. 0712345678"
                  required={i === 0}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`kin-sex-${i}`}>Sex</Label>
                <Select
                  value={kin[i]?.sex || ''}
                  onValueChange={val => handleKinChange(i, 'sex', val)}
                  disabled={!isEditing}
                >
                  <SelectTrigger id={`kin-sex-${i}`}> 
                    <SelectValue placeholder="Select Sex" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Female">Female</SelectItem>
                    <SelectItem value="Male">Male</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor={`kin-relationship-${i}`}>Relationship</Label>
                <Input
                  id={`kin-relationship-${i}`}
                  value={kin[i]?.relationship || ''}
                  onChange={e => handleKinChange(i, 'relationship', e.target.value)}
                  disabled={!isEditing}
                  placeholder="How they're related"
                  required={i === 0}
                />
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
