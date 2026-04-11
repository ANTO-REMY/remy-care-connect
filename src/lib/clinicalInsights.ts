import type { UltrasoundRecord } from "@/services/ultrasoundService";
import type { WeightLog } from "@/services/weightService";

export type ClinicalStatus = "normal" | "watch" | "urgent";

export interface InsightResult {
  status: ClinicalStatus;
  message: string;
}

export interface MaternalWeightInsightInput {
  latest?: WeightLog | null;
  previous?: WeightLog | null;
  staleDays?: number | null;
}

export interface UltrasoundInsightInput {
  latest?: UltrasoundRecord | null;
  staleDays?: number | null;
}

function statusOrder(status: ClinicalStatus): number {
  if (status === "urgent") return 3;
  if (status === "watch") return 2;
  return 1;
}

function maxStatus(a: ClinicalStatus, b: ClinicalStatus): ClinicalStatus {
  return statusOrder(a) >= statusOrder(b) ? a : b;
}

export function getMaternalWeightInsight(input: MaternalWeightInsightInput): InsightResult {
  const { latest, previous, staleDays } = input;

  if (!latest) {
    return {
      status: "watch",
      message: "No maternal weight logs yet. Encourage weekly logging.",
    };
  }

  if (staleDays !== null && staleDays !== undefined && staleDays > 21) {
    return {
      status: "urgent",
      message: "Maternal weight is overdue by more than 3 weeks.",
    };
  }

  if (staleDays !== null && staleDays !== undefined && staleDays > 14) {
    return {
      status: "watch",
      message: "Maternal weight has not been logged in over 2 weeks.",
    };
  }

  if (!previous) {
    return {
      status: "normal",
      message: "Weight logging has started. Add one more entry to assess trend.",
    };
  }

  const deltaKg = latest.weight_kg - previous.weight_kg;

  if (Math.abs(deltaKg) >= 3) {
    return {
      status: "urgent",
      message: "Large weight change since last log. Prioritize follow-up.",
    };
  }

  if (Math.abs(deltaKg) >= 1.5) {
    return {
      status: "watch",
      message: "Weight trend changed notably since last log. Monitor closely.",
    };
  }

  return {
    status: "normal",
    message: "Recent maternal weight trend appears stable.",
  };
}

export function getUltrasoundInsight(input: UltrasoundInsightInput): InsightResult {
  const { latest, staleDays } = input;

  if (!latest) {
    return {
      status: "watch",
      message: "No ultrasound history yet. Schedule a scan per protocol.",
    };
  }

  if (staleDays !== null && staleDays !== undefined && staleDays > 28) {
    return {
      status: "urgent",
      message: "Latest ultrasound is over 4 weeks old.",
    };
  }

  if (staleDays !== null && staleDays !== undefined && staleDays > 21) {
    return {
      status: "watch",
      message: "Latest ultrasound is over 3 weeks old.",
    };
  }

  if (latest.heart_rate_bpm !== null && latest.heart_rate_bpm !== undefined) {
    if (latest.heart_rate_bpm < 110 || latest.heart_rate_bpm > 160) {
      return {
        status: "urgent",
        message: "Fetal heart rate is outside expected range. Review promptly.",
      };
    }
    if (latest.heart_rate_bpm < 120 || latest.heart_rate_bpm > 150) {
      return {
        status: "watch",
        message: "Fetal heart rate is borderline. Recheck at next follow-up.",
      };
    }
  }

  return {
    status: "normal",
    message: "Recent ultrasound measurements look reassuring.",
  };
}

export function combineInsights(...insights: InsightResult[]): InsightResult {
  if (insights.length === 0) {
    return { status: "normal", message: "No clinical insights available yet." };
  }

  const status = insights.reduce<ClinicalStatus>(
    (acc, current) => maxStatus(acc, current.status),
    "normal"
  );

  const message = insights
    .filter((insight) => insight.status === status)
    .map((insight) => insight.message)
    .join(" ");

  return {
    status,
    message: message || "Clinical status updated.",
  };
}

