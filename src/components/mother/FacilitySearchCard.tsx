import { MapPin, Navigation, Building2, ShieldCheck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { HealthFacility } from "@/services/healthFacilityService";

interface FacilitySearchCardProps {
  facility: HealthFacility;
  onViewDetails: (facility: HealthFacility) => void;
}

function formatFacilityType(facility: HealthFacility): string {
  return facility.amenity || facility.healthcare || "health facility";
}

export function FacilitySearchCard({ facility, onViewDetails }: FacilitySearchCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex items-start gap-2">
              <Building2 className="h-5 w-5 text-primary mt-0.5 shrink-0" />
              <div className="min-w-0">
                <h4 className="font-semibold leading-tight break-words">{facility.name}</h4>
                <p className="text-xs text-muted-foreground capitalize">{formatFacilityType(facility)}</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {facility.city && (
                <Badge variant="outline" className="text-xs">
                  <MapPin className="h-3 w-3 mr-1" />
                  {facility.city}
                </Badge>
              )}

              {typeof facility.distance_km === "number" && (
                <Badge className="text-xs bg-blue-100 text-blue-700 hover:bg-blue-100">
                  <Navigation className="h-3 w-3 mr-1" />
                  {facility.distance_km.toFixed(1)} km
                </Badge>
              )}

              {facility.verified && (
                <Badge className="text-xs bg-green-100 text-green-700 hover:bg-green-100">
                  <ShieldCheck className="h-3 w-3 mr-1" />
                  Verified
                </Badge>
              )}
            </div>

            {facility.specialities && facility.specialities.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {facility.specialities.slice(0, 3).map((speciality) => (
                  <Badge key={speciality} variant="secondary" className="text-[11px] capitalize">
                    {speciality}
                  </Badge>
                ))}
                {facility.specialities.length > 3 && (
                  <Badge variant="secondary" className="text-[11px]">
                    +{facility.specialities.length - 3} more
                  </Badge>
                )}
              </div>
            )}
          </div>

          <Button size="sm" variant="outline" onClick={() => onViewDetails(facility)}>
            Details
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
