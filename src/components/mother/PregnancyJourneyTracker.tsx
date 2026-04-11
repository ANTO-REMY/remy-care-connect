import React, { useMemo, useState } from 'react';
import { Baby, Calendar, ChevronDown, ChevronUp, Scale, Activity } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { weightService, type WeightLog } from '@/services/weightService';
import { useToast } from '@/hooks/use-toast';
import type { UltrasoundRecord } from '@/services/ultrasoundService';
import { combineInsights, getMaternalWeightInsight, getUltrasoundInsight } from '@/lib/clinicalInsights';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface PregnancyJourneyTrackerProps {
  dueDate: string;
  /** Real ultrasound data — if present for the current week, replaces estimates */
  ultrasoundData?: UltrasoundRecord[];
  ultrasoundLoading?: boolean;
  weightLogs?: WeightLog[];
  weightLogsLoading?: boolean;
  onWeightLogged?: (log: WeightLog) => void;
  onCheckInClick?: () => void;
}

// Data mapping for baby size, weight, length, milestone, tip, and symptoms by week
const fetalDevelopmentData: Record<number, {
  size: string; weight: string; length: string;
  milestone: string; motherTip: string; symptoms: string[];
}> = {
  1:  { size: "Poppy seed", weight: "< 1g", length: "< 1mm", milestone: "Fertilization has occurred. Your baby's genetic blueprint is set!", motherTip: "Start taking prenatal vitamins with folic acid daily.", symptoms: ["Fatigue", "Breast tenderness"] },
  2:  { size: "Poppy seed", weight: "< 1g", length: "< 1mm", milestone: "The fertilized egg is implanting in your uterine wall.", motherTip: "Avoid alcohol and smoking. Stay hydrated.", symptoms: ["Mild cramping", "Spotting"] },
  3:  { size: "Poppy seed", weight: "< 1g", length: "< 1mm", milestone: "The embryo is forming. The neural tube is developing.", motherTip: "Eat folate-rich foods like spinach and lentils.", symptoms: ["Fatigue", "Nausea"] },
  4:  { size: "Poppy seed", weight: "< 1g", length: "< 1mm", milestone: "The heart begins to form and will start beating soon.", motherTip: "Schedule your first prenatal appointment.", symptoms: ["Morning sickness", "Fatigue", "Mood swings"] },
  5:  { size: "Apple seed", weight: "< 1g", length: "2mm", milestone: "The heart is beating! Major organs are starting to form.", motherTip: "Eat small, frequent meals to ease nausea.", symptoms: ["Nausea", "Frequent urination", "Fatigue"] },
  6:  { size: "Sweet pea", weight: "< 1g", length: "4-6mm", milestone: "Facial features are forming. Tiny buds appear for arms and legs.", motherTip: "Ginger tea can help with morning sickness.", symptoms: ["Morning sickness", "Breast tenderness", "Mood swings"] },
  7:  { size: "Blueberry", weight: "< 1g", length: "13mm", milestone: "The brain is growing rapidly. Hands and feet are forming.", motherTip: "Get plenty of rest — your body is working hard.", symptoms: ["Nausea", "Fatigue", "Food aversions"] },
  8:  { size: "Raspberry", weight: "1g", length: "1.6cm", milestone: "Baby can now make small movements! Fingers are starting to form.", motherTip: "Stay active with gentle walks or prenatal yoga.", symptoms: ["Nausea", "Bloating", "Constipation"] },
  9:  { size: "Grape", weight: "2g", length: "2.3cm", milestone: "All essential organs have begun to develop. The tail disappears.", motherTip: "Eat protein-rich foods to support baby's growth.", symptoms: ["Morning sickness", "Mood swings", "Fatigue"] },
  10: { size: "Kumquat", weight: "4g", length: "3.1cm", milestone: "Baby's vital organs are fully formed and starting to function.", motherTip: "Book your first ultrasound scan if you haven't.", symptoms: ["Nausea", "Visible veins", "Growing waistline"] },
  11: { size: "Fig", weight: "7g", length: "4.1cm", milestone: "Baby can open and close their fists. Tooth buds appear.", motherTip: "Increase calcium intake through dairy or leafy greens.", symptoms: ["Nausea easing", "Increased energy", "Skin changes"] },
  12: { size: "Lime", weight: "14g", length: "5.4cm", milestone: "All vital organs have formed. Reflexes are developing — baby can curl toes!", motherTip: "Morning sickness should start easing. Stay hydrated and eat small, frequent meals.", symptoms: ["Fatigue", "Nausea easing", "Breast tenderness"] },
  13: { size: "Peapod", weight: "23g", length: "7.4cm", milestone: "Welcome to the second trimester! Baby can make sucking motions.", motherTip: "Many mothers feel more energetic now. Enjoy it!", symptoms: ["Increased appetite", "Round ligament pain", "Visible bump"] },
  14: { size: "Lemon", weight: "43g", length: "8.7cm", milestone: "Baby's facial muscles are working — they might be making expressions!", motherTip: "Start sleeping on your side for better blood flow.", symptoms: ["Increased energy", "Growing bump", "Nasal congestion"] },
  15: { size: "Apple", weight: "70g", length: "10.1cm", milestone: "Baby can sense light through closed eyelids.", motherTip: "Stay active — prenatal exercise improves mood and sleep.", symptoms: ["Nosebleeds", "Swollen gums", "Growing bump"] },
  16: { size: "Avocado", weight: "100g", length: "11.6cm", milestone: "Baby's circulatory system is working. You might feel the first flutters!", motherTip: "Wear comfortable clothing — your bump is growing.", symptoms: ["Backache", "Constipation", "Glowing skin"] },
  17: { size: "Turnip", weight: "140g", length: "13cm", milestone: "Baby's skeleton is hardening from cartilage to bone.", motherTip: "Eat iron-rich foods to prevent anemia.", symptoms: ["Increased appetite", "Dizziness", "Stretch marks"] },
  18: { size: "Bell pepper", weight: "190g", length: "14.2cm", milestone: "Baby can hear sounds! They respond to your voice and music.", motherTip: "Talk and sing to your baby — they can hear you now.", symptoms: ["Backache", "Leg cramps", "Swelling"] },
  19: { size: "Heirloom tomato", weight: "240g", length: "15.3cm", milestone: "A protective coating called vernix forms on baby's skin.", motherTip: "You're almost halfway! Celebrate this milestone.", symptoms: ["Round ligament pain", "Dizziness", "Skin changes"] },
  20: { size: "Banana", weight: "300g", length: "25.6cm", milestone: "Halfway there! Baby can swallow and taste amniotic fluid.", motherTip: "You're halfway through your pregnancy! Schedule your anomaly scan.", symptoms: ["Backache", "Swelling", "Increased appetite"] },
  21: { size: "Carrot", weight: "360g", length: "26.7cm", milestone: "Baby's movements are more coordinated. You'll feel more kicks!", motherTip: "Start doing kick counts if your doctor recommends.", symptoms: ["Braxton Hicks", "Varicose veins", "Stretch marks"] },
  22: { size: "Spaghetti squash", weight: "430g", length: "27.8cm", milestone: "Baby's eyes have formed, though the iris still lacks color.", motherTip: "Eat omega-3 rich foods for baby's brain development.", symptoms: ["Backache", "Swollen feet", "Increased discharge"] },
  23: { size: "Large mango", weight: "500g", length: "28.9cm", milestone: "Baby can hear your heartbeat and outside noises clearly.", motherTip: "Practice relaxation techniques for better sleep.", symptoms: ["Swelling", "Braxton Hicks", "Snoring"] },
  24: { size: "Ear of corn", weight: "600g", length: "30cm", milestone: "Baby's lungs are developing surfactant — needed for breathing.", motherTip: "Monitor for signs of gestational diabetes at your checkup.", symptoms: ["Back pain", "Leg cramps", "Itchy skin"] },
  25: { size: "Rutabaga", weight: "660g", length: "34.6cm", milestone: "Baby responds to touch and familiar voices.", motherTip: "Keep up with prenatal check-ups. You're doing great!", symptoms: ["Heartburn", "Hemorrhoids", "Restless legs"] },
  26: { size: "Scallion", weight: "760g", length: "35.6cm", milestone: "Baby's eyes are opening! They can blink and respond to light.", motherTip: "Practice breathing exercises for labor preparation.", symptoms: ["Insomnia", "Headaches", "Swelling"] },
  27: { size: "Cauliflower", weight: "875g", length: "36.6cm", milestone: "Baby's brain activity is increasing rapidly.", motherTip: "Start thinking about your birth plan.", symptoms: ["Leg cramps", "Shortness of breath", "Pelvic pressure"] },
  28: { size: "Eggplant", weight: "1kg", length: "37.6cm", milestone: "Welcome to the third trimester! Baby can dream during sleep.", motherTip: "You've entered the third trimester! Keep monitoring baby movements.", symptoms: ["Braxton Hicks", "Back pain", "Difficulty sleeping"] },
  29: { size: "Butternut squash", weight: "1.2kg", length: "38.6cm", milestone: "Baby's muscles and lungs continue to mature.", motherTip: "Take breaks and elevate your feet to reduce swelling.", symptoms: ["Shortness of breath", "Heartburn", "Frequent urination"] },
  30: { size: "Large cabbage", weight: "1.3kg", length: "39.9cm", milestone: "Baby's bone marrow is producing red blood cells.", motherTip: "Pack your hospital bag — it's time to prepare!", symptoms: ["Fatigue", "Insomnia", "Mood swings"] },
  31: { size: "Coconut", weight: "1.5kg", length: "41.1cm", milestone: "Baby's brain connections are forming at incredible speed.", motherTip: "Continue eating well and staying hydrated.", symptoms: ["Breathlessness", "Leaking colostrum", "Back pain"] },
  32: { size: "Jicama", weight: "1.7kg", length: "42.4cm", milestone: "Baby is practicing breathing movements with the diaphragm.", motherTip: "Finalize your birth plan with your healthcare provider.", symptoms: ["Heartburn", "Braxton Hicks", "Fatigue"] },
  33: { size: "Pineapple", weight: "1.9kg", length: "43.7cm", milestone: "Baby's bones are hardening, except for the skull (for delivery).", motherTip: "Eat calcium-rich foods for baby's bone development.", symptoms: ["Overheating", "Swollen ankles", "Insomnia"] },
  34: { size: "Cantaloupe", weight: "2.1kg", length: "45cm", milestone: "Baby's central nervous system and lungs are maturing.", motherTip: "Rest as much as possible and prepare for labor.", symptoms: ["Pelvic pressure", "Fatigue", "Blurred vision"] },
  35: { size: "Honeydew melon", weight: "2.4kg", length: "46.2cm", milestone: "Baby is gaining weight rapidly — about 200g per week.", motherTip: "Attend all prenatal visits — you're in the home stretch!", symptoms: ["Frequent urination", "Braxton Hicks", "Pelvic pain"] },
  36: { size: "Romaine lettuce", weight: "2.6kg", length: "47.4cm", milestone: "Baby is likely in head-down position preparing for birth.", motherTip: "Know the signs of labor: contractions, water breaking, bloody show.", symptoms: ["Nesting instinct", "Lightening", "Diarrhea"] },
  37: { size: "Swiss chard", weight: "2.9kg", length: "48.6cm", milestone: "Baby is now considered early term! Lungs are nearly mature.", motherTip: "Rest and conserve energy for delivery day.", symptoms: ["Cramping", "Pelvic pressure", "Insomnia"] },
  38: { size: "Leek", weight: "3.1kg", length: "49.8cm", milestone: "Baby has a firm grasp and all organs are ready for life outside.", motherTip: "Stay close to your hospital. Baby could come any time!", symptoms: ["Braxton Hicks", "Cervical dilation", "Nesting"] },
  39: { size: "Mini watermelon", weight: "3.3kg", length: "50.7cm", milestone: "Baby is full term! The placenta continues to provide antibodies.", motherTip: "Walk gently to encourage baby's position for labor.", symptoms: ["Pelvic pain", "Mucus plug loss", "Contractions"] },
  40: { size: "Small pumpkin", weight: "3.5kg", length: "51.2cm", milestone: "Your due date! Baby is ready to meet you.", motherTip: "Stay calm and trust your body. You're ready for this!", symptoms: ["Contractions", "Nesting", "Excitement"] },
  41: { size: "Jackfruit", weight: "3.6kg", length: "51.7cm", milestone: "Baby is post-term. Your doctor will monitor you closely.", motherTip: "Talk to your doctor about induction options.", symptoms: ["Impatience", "Discomfort", "Contractions"] },
  42: { size: "Watermelon", weight: "3.7kg", length: "51.8cm", milestone: "Your care team will likely plan for delivery this week.", motherTip: "Follow your doctor's guidance for a safe delivery.", symptoms: ["Strong contractions", "Pelvic pressure"] },
};

export function PregnancyJourneyTracker({
  dueDate,
  ultrasoundData,
  ultrasoundLoading = false,
  weightLogs,
  weightLogsLoading = false,
  onWeightLogged,
  onCheckInClick,
}: PregnancyJourneyTrackerProps) {
  const [expanded, setExpanded] = useState(false);
  const [showWeightModal, setShowWeightModal] = useState(false);
  const [weightInput, setWeightInput] = useState('');
  const [weightSubmitting, setWeightSubmitting] = useState(false);
  const { toast } = useToast();

  const {
    currentWeek,
    progressPercentage,
    daysUntilNextMilestone,
    nextMilestoneName,
    babyStats,
    realMeasurements,
  } = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const due = new Date(dueDate);
    due.setHours(0, 0, 0, 0);

    // Gestation is ~280 days (40 weeks)
    const conceptionDate = new Date(due.getTime() - 280 * 24 * 60 * 60 * 1000);
    const daysPregnant = Math.floor((today.getTime() - conceptionDate.getTime()) / (1000 * 60 * 60 * 24));

    let week = Math.floor(daysPregnant / 7);
    week = Math.max(1, Math.min(week, 42));

    const progress = Math.min(100, Math.max(0, (daysPregnant / 280) * 100));

    let nextName = "Expected Due Date";
    let milestoneDate = due;

    if (week < 14) {
      nextName = "Start of 2nd Trimester (Week 14)";
      milestoneDate = new Date(conceptionDate.getTime() + 14 * 7 * 24 * 60 * 60 * 1000);
    } else if (week < 28) {
      nextName = "Start of 3rd Trimester (Week 28)";
      milestoneDate = new Date(conceptionDate.getTime() + 28 * 7 * 24 * 60 * 60 * 1000);
    }

    const daysUntilNext = Math.max(0, Math.ceil((milestoneDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));
    const defaultStats = { size: "Baby", weight: "-", length: "-", milestone: "", motherTip: "", symptoms: [] as string[] };
    const stats = fetalDevelopmentData[week] || defaultStats;

    // Use latest scan at or before current week.
    const realData = (ultrasoundData ?? [])
      .filter((u) => u.week_number <= week)
      .sort((a, b) => {
        if (a.week_number !== b.week_number) return b.week_number - a.week_number;
        const aTime = new Date(a.scan_date || a.created_at).getTime();
        const bTime = new Date(b.scan_date || b.created_at).getTime();
        return bTime - aTime;
      })[0];

    return {
      currentWeek: week,
      progressPercentage: progress,
      daysUntilNextMilestone: daysUntilNext,
      nextMilestoneName: nextName,
      babyStats: stats,
      realMeasurements: realData || null,
    };
  }, [dueDate, ultrasoundData]);

  const handleLogWeight = async () => {
    const kg = parseFloat(weightInput);
    if (isNaN(kg) || kg <= 0 || kg > 300) {
      toast({ title: "Invalid weight", description: "Please enter a valid weight in kg.", variant: "destructive" });
      return;
    }
    setWeightSubmitting(true);
    try {
      const saved = await weightService.logWeight({ weight_kg: kg });
      onWeightLogged?.(saved);
      toast({
        title: "Weight Logged",
        description: `${saved.weight_kg.toFixed(1)} kg recorded${saved.week_number ? ` for week ${saved.week_number}` : ""}.`,
      });
      setShowWeightModal(false);
      setWeightInput('');
    } catch {
      toast({ title: "Error", description: "Could not save weight. Please try again.", variant: "destructive" });
    } finally {
      setWeightSubmitting(false);
    }
  };

  // If due date is invalid or missing, render nothing
  if (!dueDate || isNaN(new Date(dueDate).getTime())) {
    return null;
  }

  // Display weight: prefer real ultrasound data, fallback to estimates
  const displayWeight = realMeasurements?.fetal_weight_grams
    ? `${(realMeasurements.fetal_weight_grams / 1000).toFixed(1)}kg`
    : babyStats.weight;
  const displayLength = realMeasurements?.fetal_length_cm
    ? `${realMeasurements.fetal_length_cm}cm`
    : babyStats.length;
  const isVerified = !!realMeasurements;
  const scanDateLabel = realMeasurements?.scan_date
    ? new Date(realMeasurements.scan_date).toLocaleDateString()
    : realMeasurements?.created_at
      ? new Date(realMeasurements.created_at).toLocaleDateString()
      : null;
  const sortedWeightLogs = (weightLogs ?? [])
    .slice()
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  const latestWeightLog = sortedWeightLogs[0];
  const previousWeightLog = sortedWeightLogs[1];
  const weightDelta = latestWeightLog && previousWeightLog
    ? latestWeightLog.weight_kg - previousWeightLog.weight_kg
    : null;
  const ultrasoundStaleDays = realMeasurements
    ? Math.floor((Date.now() - new Date(realMeasurements.scan_date || realMeasurements.created_at).getTime()) / (1000 * 60 * 60 * 24))
    : null;
  const weightStaleDays = latestWeightLog
    ? Math.floor((Date.now() - new Date(latestWeightLog.created_at).getTime()) / (1000 * 60 * 60 * 24))
    : null;
  const ultrasoundInsight = getUltrasoundInsight({ latest: realMeasurements, staleDays: ultrasoundStaleDays });
  const weightInsight = getMaternalWeightInsight({ latest: latestWeightLog, previous: previousWeightLog, staleDays: weightStaleDays });
  const combinedInsight = combineInsights(ultrasoundInsight, weightInsight);
  const statusToneClass = combinedInsight.status === 'urgent'
    ? 'bg-red-500/20 text-red-100 border-red-300/40'
    : combinedInsight.status === 'watch'
      ? 'bg-amber-500/20 text-amber-100 border-amber-300/40'
      : 'bg-emerald-500/20 text-emerald-100 border-emerald-300/40';
  const weightLastUpdatedLabel = latestWeightLog
    ? `${new Date(latestWeightLog.created_at).toLocaleDateString()} ${new Date(latestWeightLog.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
    : null;

  return (
    <TooltipProvider>
      <Card
        className="mb-6 bg-gradient-to-r from-[hsl(210,50%,15%)] via-[hsl(210,40%,25%)] to-[hsl(180,65%,55%)] text-white border-0 overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-xl"
        onClick={() => setExpanded(!expanded)}
      >
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <div className="bg-white/15 p-2 rounded-lg">
                  <Baby className="h-6 w-6 animate-pulse" />
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
                <p className="text-2xl font-bold">{displayWeight}</p>
                <p className="text-xs text-white/70">{isVerified ? 'Measured Weight' : 'Estimated Weight'}</p>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <p className="text-[10px] text-white/60 cursor-help">What is this?</p>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-[220px] text-xs">
                      Measured values come from your latest ultrasound. Estimated values use standard growth references for your current week.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <div className="bg-white/10 rounded-xl p-4 text-center min-w-[80px]">
                <p className="text-2xl font-bold">{displayLength}</p>
                <p className="text-xs text-white/70">{isVerified ? 'Measured Length' : 'Estimated Length'}</p>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <p className="text-[10px] text-white/60 cursor-help">What is this?</p>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-[220px] text-xs">
                      This is fetal length from your latest scan when available, or a week-based estimate when no recent scan is available.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>
          </div>
          <div className="mt-2 text-xs text-white/70">
            {ultrasoundLoading ? (
              <span>Loading ultrasound history...</span>
            ) : realMeasurements ? (
              <span>
                Latest scan: week {realMeasurements.week_number}
                {scanDateLabel ? ` • ${scanDateLabel}` : ""}
              </span>
            ) : (
              <span>No ultrasound scans yet — showing estimates.</span>
            )}
          </div>

          <div className="mt-4 pt-4 border-t border-white/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-white/70" />
              <span className="text-sm text-white/80">{nextMilestoneName}</span>
            </div>
            <div className="flex flex-1 justify-end items-center gap-2">
              <span className="text-sm font-medium bg-white/15 px-3 py-1 rounded-full mr-2">
                {daysUntilNextMilestone === 0 ? "Today!" : `${daysUntilNextMilestone} days away`}
              </span>
              <Button 
                variant="ghost" 
                size="sm" 
                className="hover:bg-white/10 text-white p-2 h-auto"
                onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
              >
                {expanded
                  ? <ChevronUp className="h-5 w-5" />
                  : <ChevronDown className="h-5 w-5" />
                }
              </Button>
            </div>
          </div>

          {/* Persistent Action Bar */}
          <div className="mt-4 grid grid-cols-2 gap-3">
            <Button
              className="bg-emerald-500/80 hover:bg-emerald-500 text-white font-medium border-0 shadow-sm transition-all"
              onClick={(e) => { e.stopPropagation(); onCheckInClick?.(); }}
            >
              <Activity className="h-4 w-4 mr-2" />
              Daily Check-in
            </Button>
            <Button
              className="bg-white/20 hover:bg-white/30 text-white font-medium border-0 shadow-sm transition-all backdrop-blur-sm"
              onClick={(e) => { e.stopPropagation(); setShowWeightModal(true); }}
            >
              <Scale className="h-4 w-4 mr-2" />
              Log My Weight
            </Button>
          </div>

          {/* Expanded Content */}
          {expanded && (
            <div className="mt-4 pt-4 border-t border-white/20 space-y-4 animate-in slide-in-from-top-2 duration-300">
              
              {/* Metrics Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Weight Card */}
                <div className="bg-white/10 rounded-xl p-4 flex flex-col justify-center h-full">
                  <p className="text-xs font-semibold text-white/60 uppercase tracking-wider mb-2">Your Weight</p>
                  {weightLogsLoading ? (
                    <p className="text-sm text-white/80">Loading...</p>
                  ) : latestWeightLog ? (
                    <>
                      <p className="text-lg font-bold">{latestWeightLog.weight_kg.toFixed(1)} kg</p>
                      <p className="text-[11px] text-white/65 mt-1">
                        Updated {weightLastUpdatedLabel}
                      </p>
                      {weightDelta !== null && (
                        <p className="text-xs text-emerald-200 mt-1 font-medium">
                          {(weightDelta > 0 ? '+' : '') + weightDelta.toFixed(1)} kg since last log
                        </p>
                      )}
                    </>
                  ) : (
                    <p className="text-sm text-white/80">No logs yet.</p>
                  )}
                </div>

                {/* Heart Rate Card */}
                <div className="bg-white/10 rounded-xl p-4 flex flex-col justify-center h-full">
                  <p className="text-xs font-semibold text-white/60 uppercase tracking-wider mb-2">Baby's Heart Rate</p>
                  {realMeasurements?.heart_rate_bpm ? (
                    <div className="flex items-center gap-3">
                      <Activity className="h-6 w-6 text-red-300 animate-pulse" />
                      <p className="text-2xl font-bold">{realMeasurements.heart_rate_bpm} BPM</p>
                    </div>
                  ) : (
                    <p className="text-sm text-white/80">No recent scan.</p>
                  )}
                </div>
              </div>

              <div className={`rounded-xl border p-3 ${statusToneClass}`}>
                <p className="text-[11px] font-semibold uppercase tracking-wider mb-1">
                  Clinical status: {combinedInsight.status}
                </p>
                <p className="text-xs">{combinedInsight.message}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Weight Log Modal */}
      <Dialog open={showWeightModal} onOpenChange={setShowWeightModal}>
        <DialogContent className="sm:max-w-sm" onClick={(e) => e.stopPropagation()}>
          <DialogHeader>
            <DialogTitle>Log Your Weight</DialogTitle>
            <DialogDescription>
              Track your weight weekly to monitor healthy progress. Week {currentWeek} of 40.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="weight-input">Weight (kg)</Label>
              <Input
                id="weight-input"
                type="number"
                step="0.1"
                min="20"
                max="300"
                placeholder="e.g. 65.5"
                value={weightInput}
                onChange={(e) => setWeightInput(e.target.value)}
              />
            </div>
            <Button className="w-full" onClick={handleLogWeight} disabled={weightSubmitting}>
              {weightSubmitting ? "Saving..." : "Save Weight"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
}

// Export the development data so the Daily Tip card can use it
export { fetalDevelopmentData };
