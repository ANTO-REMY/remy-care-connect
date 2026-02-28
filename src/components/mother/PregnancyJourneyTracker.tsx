import React, { useMemo } from 'react';
import { Baby, Calendar } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

interface PregnancyJourneyTrackerProps {
  dueDate: string;
}

// Data mapping for baby size and weight by week
const fetalDevelopmentData: Record<number, { size: string; weight: string; length: string }> = {
  1: { size: "Poppy seed", weight: "< 1g", length: "< 1mm" },
  2: { size: "Poppy seed", weight: "< 1g", length: "< 1mm" },
  3: { size: "Poppy seed", weight: "< 1g", length: "< 1mm" },
  4: { size: "Poppy seed", weight: "< 1g", length: "< 1mm" },
  5: { size: "Apple seed", weight: "< 1g", length: "2mm" },
  6: { size: "Sweet pea", weight: "< 1g", length: "4-6mm" },
  7: { size: "Blueberry", weight: "< 1g", length: "13mm" },
  8: { size: "Raspberry", weight: "1g", length: "1.6cm" },
  9: { size: "Grape", weight: "2g", length: "2.3cm" },
  10: { size: "Kumquat", weight: "4g", length: "3.1cm" },
  11: { size: "Fig", weight: "7g", length: "4.1cm" },
  12: { size: "Lime", weight: "14g", length: "5.4cm" },
  13: { size: "Peapod", weight: "23g", length: "7.4cm" },
  14: { size: "Lemon", weight: "43g", length: "8.7cm" },
  15: { size: "Apple", weight: "70g", length: "10.1cm" },
  16: { size: "Avocado", weight: "100g", length: "11.6cm" },
  17: { size: "Turnip", weight: "140g", length: "13cm" },
  18: { size: "Bell pepper", weight: "190g", length: "14.2cm" },
  19: { size: "Heirloom tomato", weight: "240g", length: "15.3cm" },
  20: { size: "Banana", weight: "300g", length: "25.6cm" },
  21: { size: "Carrot", weight: "360g", length: "26.7cm" },
  22: { size: "Spaghetti squash", weight: "430g", length: "27.8cm" },
  23: { size: "Large mango", weight: "500g", length: "28.9cm" },
  24: { size: "Ear of corn", weight: "600g", length: "30cm" },
  25: { size: "Rutabaga", weight: "660g", length: "34.6cm" },
  26: { size: "Scallion", weight: "760g", length: "35.6cm" },
  27: { size: "Cauliflower", weight: "875g", length: "36.6cm" },
  28: { size: "Eggplant", weight: "1kg", length: "37.6cm" },
  29: { size: "Butternut squash", weight: "1.2kg", length: "38.6cm" },
  30: { size: "Large cabbage", weight: "1.3kg", length: "39.9cm" },
  31: { size: "Coconut", weight: "1.5kg", length: "41.1cm" },
  32: { size: "Jicama", weight: "1.7kg", length: "42.4cm" },
  33: { size: "Pineapple", weight: "1.9kg", length: "43.7cm" },
  34: { size: "Cantaloupe", weight: "2.1kg", length: "45cm" },
  35: { size: "Honeydew melon", weight: "2.4kg", length: "46.2cm" },
  36: { size: "Romaine lettuce", weight: "2.6kg", length: "47.4cm" },
  37: { size: "Swiss chard", weight: "2.9kg", length: "48.6cm" },
  38: { size: "Leek", weight: "3.1kg", length: "49.8cm" },
  39: { size: "Mini watermelon", weight: "3.3kg", length: "50.7cm" },
  40: { size: "Small pumpkin", weight: "3.5kg", length: "51.2cm" },
  41: { size: "Jackfruit", weight: "3.6kg", length: "51.7cm" },
  42: { size: "Watermelon", weight: "3.7kg", length: "51.8cm" },
};

export function PregnancyJourneyTracker({ dueDate }: PregnancyJourneyTrackerProps) {
  const {
    currentWeek,
    progressPercentage,
    daysUntilNextMilestone,
    nextMilestoneName,
    babyStats
  } = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const due = new Date(dueDate);
    due.setHours(0, 0, 0, 0);

    // Gestation is ~280 days (40 weeks)
    // Conception date is approx due date - 280 days
    const conceptionDate = new Date(due.getTime() - 280 * 24 * 60 * 60 * 1000);

    // Calculate days pregnant
    const daysPregnant = Math.floor((today.getTime() - conceptionDate.getTime()) / (1000 * 60 * 60 * 24));

    let week = Math.floor(daysPregnant / 7);

    // Cap week between 1 and 42 for display purposes
    week = Math.max(1, Math.min(week, 42));

    const totalWeeks = 40;
    // Cap progress at 100%
    const progress = Math.min(100, Math.max(0, (daysPregnant / 280) * 100));

    // Determine milestones based on standard trimesters
    let nextName = "Expected Due Date";
    let milestoneDate = due;

    if (week < 14) {
      nextName = "Start of 2nd Trimester (Week 14)";
      milestoneDate = new Date(conceptionDate.getTime() + 14 * 7 * 24 * 60 * 60 * 1000);
    } else if (week < 28) {
      nextName = "Start of 3rd Trimester (Week 28)";
      milestoneDate = new Date(conceptionDate.getTime() + 28 * 7 * 24 * 60 * 60 * 1000);
    }

    const daysUntilNext = Math.ceil((milestoneDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    const safeDaysUntilNext = Math.max(0, daysUntilNext); // Avoid negative days

    // Fallback data if week exceeds map
    const defaultStats = { size: "Baby", weight: "-", length: "-" };
    const stats = fetalDevelopmentData[week] || defaultStats;

    return {
      currentWeek: week,
      progressPercentage: progress,
      daysUntilNextMilestone: safeDaysUntilNext,
      nextMilestoneName: nextName,
      babyStats: stats
    };
  }, [dueDate]);

  // If due date is invalid or missing, render a fallback or nothing
  if (!dueDate || isNaN(new Date(dueDate).getTime())) {
    return null;
  }

  return (
    <Card className="mb-6 bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 text-white border-0 overflow-hidden">
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <div className="bg-white/20 p-2 rounded-lg">
                <Baby className="h-6 w-6" />
              </div>
              <div>
                <p className="text-white/80 text-sm">Week {currentWeek} of 40</p>
                <p className="font-bold text-lg">Your baby is the size of a {babyStats.size.toLowerCase()}!</p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-white/80">Pregnancy Journey</span>
                <span className="font-semibold">{Math.round(progressPercentage)}%</span>
              </div>
              <Progress value={progressPercentage} className="h-2 bg-white/20" />
            </div>
            {/* Visual Timeline / Trimesters */}
            <div className="flex justify-between mt-2 text-xs text-white/60 px-1">
                <span>1st Tri</span>
                <span>2nd Tri</span>
                <span>3rd Tri</span>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="bg-white/10 rounded-xl p-4 text-center min-w-[80px]">
              <p className="text-2xl font-bold">{babyStats.weight}</p>
              <p className="text-xs text-white/70">Est. Weight</p>
            </div>
            <div className="bg-white/10 rounded-xl p-4 text-center min-w-[80px]">
              <p className="text-2xl font-bold">{babyStats.length}</p>
              <p className="text-xs text-white/70">Est. Length</p>
            </div>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-white/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-white/70" />
            <span className="text-sm text-white/80">{nextMilestoneName}</span>
          </div>
          <span className="text-sm font-medium bg-white/10 px-3 py-1 rounded-full">
            {daysUntilNextMilestone === 0
                ? "Today!"
                : `${daysUntilNextMilestone} days away`}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
