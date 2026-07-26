"use client";

import { useEffect, useMemo, useState } from "react";

type Values = Record<string, number>;
type Output = {
  primary: number;
  perGroup?: number;
  total?: number;
  adjustedTotal?: number;
  details: string[];
};
type Variable = {
  key: string;
  label: string;
  min: number;
  max: number;
  step: number;
  default: number;
  suffix?: string;
  help: string;
  slider?: boolean;
};
type Calculator = {
  id: string;
  category: string;
  title: string;
  purpose: string;
  variables: Variable[];
  formula: string;
  assumptions: string[];
  references: string[];
  compute: (values: Values) => Output;
};
type Scenario = {
  id: string;
  calculatorId: string;
  calculatorTitle: string;
  values: Values;
  result: Output;
  createdAt: string;
};
type AppMode = "finder" | "calculator" | "randomiser";
type DecisionAnswers = Record<string, string>;
type DecisionOption = {
  value: string;
  label: string;
  description: string;
};
type DecisionQuestion = {
  id: string;
  prompt: string;
  helper: string;
  options: DecisionOption[];
};
type DecisionResult = {
  calculatorId?: string;
  title: string;
  explanation: string;
  assumptions: string[];
  warnings: string[];
};
type RandomisationMethod = "simple" | "block";
type RandomisationAssignment = {
  subject: number;
  group: string;
  block?: number;
};

const pct = (value: number) => value / 100;
const ceil = (value: number) => Math.max(1, Math.ceil(value));
const dropoutInflation = (n: number, dropout: number) => ceil(n / (1 - pct(dropout)));

function erfInv(x: number) {
  const a = 0.147;
  const sign = x < 0 ? -1 : 1;
  const ln = Math.log(1 - x * x);
  const first = 2 / (Math.PI * a) + ln / 2;
  return sign * Math.sqrt(Math.sqrt(first * first - ln / a) - first);
}

function zFromProbability(probability: number) {
  const clipped = Math.min(0.999999, Math.max(0.000001, probability));
  return Math.SQRT2 * erfInv(2 * clipped - 1);
}

function zAlpha(alphaPct: number, tails = 2) {
  return zFromProbability(1 - pct(alphaPct) / tails);
}

function zPower(powerPct: number) {
  return zFromProbability(pct(powerPct));
}

function commonPower(alphaDefault = 5, powerDefault = 80, dropoutDefault = 10) {
  return [
    {
      key: "alpha",
      label: "Alpha",
      min: 0.5,
      max: 10,
      step: 0.5,
      default: alphaDefault,
      suffix: "%",
      help: "Type I error rate.",
      slider: true,
    },
    {
      key: "power",
      label: "Power",
      min: 70,
      max: 99,
      step: 1,
      default: powerDefault,
      suffix: "%",
      help: "Chance of detecting the target effect.",
      slider: true,
    },
    {
      key: "dropout",
      label: "Dropout",
      min: 0,
      max: 40,
      step: 1,
      default: dropoutDefault,
      suffix: "%",
      help: "Expected unusable or lost participants.",
      slider: true,
    },
  ];
}

const calculators: Calculator[] = [
  {
    id: "prevalence",
    category: "Descriptive",
    title: "Prevalence / Single Proportion",
    purpose: "Estimate a population proportion with a target margin of error.",
    variables: [
      { key: "p", label: "Expected proportion", min: 1, max: 99, step: 1, default: 50, suffix: "%", help: "Best estimate of prevalence.", slider: true },
      { key: "margin", label: "Margin of error", min: 1, max: 20, step: 0.5, default: 5, suffix: "%", help: "Half-width of the confidence interval.", slider: true },
      { key: "confidence", label: "Confidence", min: 80, max: 99, step: 1, default: 95, suffix: "%", help: "Confidence level for the estimate.", slider: true },
      { key: "dropout", label: "Non-response", min: 0, max: 50, step: 1, default: 10, suffix: "%", help: "Expected missing or unusable records.", slider: true },
    ],
    formula: "n = Z²p(1-p) / d²",
    assumptions: ["Large-sample Wald interval planning.", "Use 50% when prevalence is unknown for a conservative estimate."],
    references: ["Cochran WG. Sampling Techniques.", "Lwanga SK, Lemeshow S. Sample Size Determination in Health Studies."],
    compute: (v) => {
      const z = zFromProbability(1 - (1 - pct(v.confidence)) / 2);
      const n = ceil((z ** 2 * pct(v.p) * (1 - pct(v.p))) / pct(v.margin) ** 2);
      return { primary: n, total: n, adjustedTotal: dropoutInflation(n, v.dropout), details: [`Confidence z = ${z.toFixed(2)}`, `Planned precision = ±${v.margin}%`] };
    },
  },
  {
    id: "single-mean",
    category: "Descriptive",
    title: "Single Mean",
    purpose: "Estimate a mean with a target margin of error.",
    variables: [
      { key: "sd", label: "Standard deviation", min: 1, max: 100, step: 1, default: 15, help: "Expected standard deviation.", slider: false },
      { key: "margin", label: "Margin of error", min: 1, max: 30, step: 0.5, default: 5, help: "Target half-width in original units.", slider: true },
      { key: "confidence", label: "Confidence", min: 80, max: 99, step: 1, default: 95, suffix: "%", help: "Confidence level for the estimate.", slider: true },
      { key: "dropout", label: "Non-response", min: 0, max: 50, step: 1, default: 10, suffix: "%", help: "Expected missing measurements.", slider: true },
    ],
    formula: "n = (Zσ / d)²",
    assumptions: ["Continuous outcome with planning SD supplied from prior data.", "Normal approximation for the confidence interval."],
    references: ["Julious SA. Sample Sizes for Clinical Trials.", "Lwanga SK, Lemeshow S. Sample Size Determination in Health Studies."],
    compute: (v) => {
      const z = zFromProbability(1 - (1 - pct(v.confidence)) / 2);
      const n = ceil((z * v.sd / v.margin) ** 2);
      return { primary: n, total: n, adjustedTotal: dropoutInflation(n, v.dropout), details: [`Confidence z = ${z.toFixed(2)}`, `SD to precision ratio = ${(v.sd / v.margin).toFixed(2)}`] };
    },
  },
  {
    id: "two-means",
    category: "Comparative",
    title: "Two Independent Means",
    purpose: "Compare two independent groups on a continuous outcome.",
    variables: [
      { key: "delta", label: "Mean difference", min: 1, max: 50, step: 0.5, default: 8, help: "Smallest difference worth detecting.", slider: true },
      { key: "sd", label: "Common SD", min: 1, max: 100, step: 1, default: 20, help: "Expected within-group standard deviation.", slider: false },
      { key: "ratio", label: "Allocation ratio", min: 0.5, max: 3, step: 0.1, default: 1, help: "Treatment participants per control participant.", slider: true },
      ...commonPower(),
    ],
    formula: "n_control = (1 + 1/r)(Zα/2 + Zβ)²σ² / Δ²",
    assumptions: ["Two-sided test with equal variance approximation.", "Normal outcome or sufficiently large samples."],
    references: ["Julious SA. Sample Sizes for Clinical Trials.", "Chow SC, Shao J, Wang H, Lokhnygina Y. Sample Size Calculations in Clinical Research."],
    compute: (v) => {
      const base = ((1 + 1 / v.ratio) * (zAlpha(v.alpha) + zPower(v.power)) ** 2 * v.sd ** 2) / v.delta ** 2;
      const control = ceil(base);
      const treatment = ceil(control * v.ratio);
      const total = control + treatment;
      return { primary: total, perGroup: control, total, adjustedTotal: dropoutInflation(total, v.dropout), details: [`Control n = ${control}; treatment n = ${treatment}`, `Standardized effect = ${(v.delta / v.sd).toFixed(2)}`] };
    },
  },
  {
    id: "paired-mean",
    category: "Comparative",
    title: "Paired / Before-After Mean",
    purpose: "Detect a mean change in paired measurements.",
    variables: [
      { key: "delta", label: "Mean change", min: 1, max: 50, step: 0.5, default: 5, help: "Smallest paired change worth detecting.", slider: true },
      { key: "sdDiff", label: "SD of differences", min: 1, max: 100, step: 1, default: 15, help: "Standard deviation of within-person differences.", slider: false },
      ...commonPower(),
    ],
    formula: "n = ((Zα/2 + Zβ)σd / Δ)²",
    assumptions: ["Continuous paired difference outcome.", "Two-sided paired t-test planning approximation."],
    references: ["Julious SA. Sample Sizes for Clinical Trials.", "Machin D et al. Sample Size Tables for Clinical Studies."],
    compute: (v) => {
      const n = ceil(((zAlpha(v.alpha) + zPower(v.power)) * v.sdDiff / v.delta) ** 2);
      return { primary: n, total: n, adjustedTotal: dropoutInflation(n, v.dropout), details: [`Standardized paired effect = ${(v.delta / v.sdDiff).toFixed(2)}`, "Each participant contributes both measurements."] };
    },
  },
  {
    id: "two-proportions",
    category: "Comparative",
    title: "Two Independent Proportions",
    purpose: "Compare event risks or response rates between two groups.",
    variables: [
      { key: "p1", label: "Control proportion", min: 1, max: 95, step: 1, default: 30, suffix: "%", help: "Expected event or response rate in control.", slider: true },
      { key: "p2", label: "Treatment proportion", min: 1, max: 95, step: 1, default: 45, suffix: "%", help: "Expected event or response rate in treatment.", slider: true },
      { key: "ratio", label: "Allocation ratio", min: 0.5, max: 3, step: 0.1, default: 1, help: "Treatment participants per control participant.", slider: true },
      ...commonPower(),
    ],
    formula: "Equal-allocation approximation scaled by allocation ratio.",
    assumptions: ["Two-sided z-test approximation.", "Independent binary outcomes."],
    references: ["Fleiss JL, Levin B, Paik MC. Statistical Methods for Rates and Proportions.", "Chow SC et al. Sample Size Calculations in Clinical Research."],
    compute: (v) => {
      const p1 = pct(v.p1);
      const p2 = pct(v.p2);
      const pbar = (p1 + p2) / 2;
      const equal = ((zAlpha(v.alpha) * Math.sqrt(2 * pbar * (1 - pbar)) + zPower(v.power) * Math.sqrt(p1 * (1 - p1) + p2 * (1 - p2))) ** 2) / (p2 - p1) ** 2;
      const control = ceil(equal * (1 + v.ratio) / (2 * v.ratio));
      const treatment = ceil(control * v.ratio);
      const total = control + treatment;
      return { primary: total, perGroup: control, total, adjustedTotal: dropoutInflation(total, v.dropout), details: [`Control n = ${control}; treatment n = ${treatment}`, `Absolute difference = ${Math.abs(v.p2 - v.p1).toFixed(1)} percentage points`] };
    },
  },
  {
    id: "one-proportion-test",
    category: "Comparative",
    title: "One Proportion vs Benchmark",
    purpose: "Test whether a single proportion differs from a fixed benchmark.",
    variables: [
      { key: "p0", label: "Benchmark", min: 1, max: 95, step: 1, default: 30, suffix: "%", help: "Null or historical proportion.", slider: true },
      { key: "p1", label: "Target proportion", min: 1, max: 95, step: 1, default: 45, suffix: "%", help: "Expected true proportion.", slider: true },
      ...commonPower(),
    ],
    formula: "n = [Zα/2√p0q0 + Zβ√p1q1]² / (p1-p0)²",
    assumptions: ["One-sample z-test approximation.", "Two-sided alternative."],
    references: ["Fleiss JL et al. Statistical Methods for Rates and Proportions.", "Machin D et al. Sample Size Tables for Clinical Studies."],
    compute: (v) => {
      const p0 = pct(v.p0);
      const p1 = pct(v.p1);
      const n = ceil((zAlpha(v.alpha) * Math.sqrt(p0 * (1 - p0)) + zPower(v.power) * Math.sqrt(p1 * (1 - p1))) ** 2 / (p1 - p0) ** 2);
      return { primary: n, total: n, adjustedTotal: dropoutInflation(n, v.dropout), details: [`Absolute difference = ${Math.abs(v.p1 - v.p0).toFixed(1)} percentage points`, "Benchmark is treated as fixed."] };
    },
  },
  {
    id: "correlation",
    category: "Association",
    title: "Correlation",
    purpose: "Detect a non-zero Pearson correlation.",
    variables: [
      { key: "rho", label: "Expected correlation", min: 0.1, max: 0.9, step: 0.05, default: 0.3, help: "Smallest correlation worth detecting.", slider: true },
      ...commonPower(),
    ],
    formula: "n = [(Zα/2 + Zβ) / atanh(r)]² + 3",
    assumptions: ["Fisher z transformation.", "Bivariate normal planning approximation."],
    references: ["Cohen J. Statistical Power Analysis for the Behavioral Sciences.", "Machin D et al. Sample Size Tables for Clinical Studies."],
    compute: (v) => {
      const fisher = 0.5 * Math.log((1 + v.rho) / (1 - v.rho));
      const n = ceil(((zAlpha(v.alpha) + zPower(v.power)) / fisher) ** 2 + 3);
      return { primary: n, total: n, adjustedTotal: dropoutInflation(n, v.dropout), details: [`Fisher z effect = ${fisher.toFixed(3)}`, "Tests correlation against zero."] };
    },
  },
  {
    id: "diagnostic-sensitivity",
    category: "Diagnostic",
    title: "Diagnostic Sensitivity",
    purpose: "Estimate sensitivity with a target confidence interval width.",
    variables: [
      { key: "sensitivity", label: "Sensitivity", min: 50, max: 99, step: 1, default: 85, suffix: "%", help: "Expected sensitivity among diseased participants.", slider: true },
      { key: "margin", label: "Margin of error", min: 2, max: 20, step: 0.5, default: 7, suffix: "%", help: "Precision around sensitivity.", slider: true },
      { key: "prevalence", label: "Disease prevalence", min: 1, max: 80, step: 1, default: 20, suffix: "%", help: "Expected prevalence in the recruited population.", slider: true },
      { key: "confidence", label: "Confidence", min: 80, max: 99, step: 1, default: 95, suffix: "%", help: "Confidence level.", slider: true },
      { key: "dropout", label: "Non-evaluable", min: 0, max: 40, step: 1, default: 10, suffix: "%", help: "Expected participants without usable index/reference results.", slider: true },
    ],
    formula: "Diseased n = Z²Se(1-Se) / d²; total n = diseased n / prevalence",
    assumptions: ["Sensitivity estimated among diseased participants.", "Reference standard classification is assumed correct."],
    references: ["Buderer NMF. Statistical methodology: I. Incorporating prevalence into sample size calculations for sensitivity and specificity.", "Flahault A et al. Sample size calculation should be performed for design accuracy in diagnostic test studies."],
    compute: (v) => {
      const z = zFromProbability(1 - (1 - pct(v.confidence)) / 2);
      const diseased = ceil((z ** 2 * pct(v.sensitivity) * (1 - pct(v.sensitivity))) / pct(v.margin) ** 2);
      const total = ceil(diseased / pct(v.prevalence));
      return { primary: total, perGroup: diseased, total, adjustedTotal: dropoutInflation(total, v.dropout), details: [`Diseased participants needed = ${diseased}`, `Total inflates by prevalence = ${v.prevalence}%`] };
    },
  },
  {
    id: "diagnostic-specificity",
    category: "Diagnostic",
    title: "Diagnostic Specificity",
    purpose: "Estimate specificity with a target confidence interval width.",
    variables: [
      { key: "specificity", label: "Specificity", min: 50, max: 99, step: 1, default: 90, suffix: "%", help: "Expected specificity among non-diseased participants.", slider: true },
      { key: "margin", label: "Margin of error", min: 2, max: 20, step: 0.5, default: 6, suffix: "%", help: "Precision around specificity.", slider: true },
      { key: "prevalence", label: "Disease prevalence", min: 1, max: 80, step: 1, default: 20, suffix: "%", help: "Expected prevalence in the recruited population.", slider: true },
      { key: "confidence", label: "Confidence", min: 80, max: 99, step: 1, default: 95, suffix: "%", help: "Confidence level.", slider: true },
      { key: "dropout", label: "Non-evaluable", min: 0, max: 40, step: 1, default: 10, suffix: "%", help: "Expected unusable test results.", slider: true },
    ],
    formula: "Non-diseased n = Z²Sp(1-Sp) / d²; total n = non-diseased n / (1-prevalence)",
    assumptions: ["Specificity estimated among non-diseased participants.", "Reference standard classification is assumed correct."],
    references: ["Buderer NMF. Statistical methodology: I. Incorporating prevalence into sample size calculations for sensitivity and specificity.", "Flahault A et al. Diagnostic test sample size methodology."],
    compute: (v) => {
      const z = zFromProbability(1 - (1 - pct(v.confidence)) / 2);
      const nonDiseased = ceil((z ** 2 * pct(v.specificity) * (1 - pct(v.specificity))) / pct(v.margin) ** 2);
      const total = ceil(nonDiseased / (1 - pct(v.prevalence)));
      return { primary: total, perGroup: nonDiseased, total, adjustedTotal: dropoutInflation(total, v.dropout), details: [`Non-diseased participants needed = ${nonDiseased}`, `Total uses non-disease fraction = ${(100 - v.prevalence).toFixed(0)}%`] };
    },
  },
  {
    id: "cohort-rr",
    category: "Epidemiology",
    title: "Cohort / Risk Ratio",
    purpose: "Compare exposed and unexposed groups in a cohort study.",
    variables: [
      { key: "p0", label: "Unexposed risk", min: 1, max: 80, step: 1, default: 15, suffix: "%", help: "Outcome risk among unexposed participants.", slider: true },
      { key: "rr", label: "Risk ratio", min: 0.2, max: 4, step: 0.1, default: 1.8, help: "Target exposed/unexposed risk ratio.", slider: true },
      { key: "ratio", label: "Exposed:unexposed", min: 0.5, max: 3, step: 0.1, default: 1, help: "Exposed participants per unexposed participant.", slider: true },
      ...commonPower(),
    ],
    formula: "Converts RR to two proportions, then uses independent-proportions planning.",
    assumptions: ["Independent exposed and unexposed groups.", "Approximate two-sided test for risk difference implied by the target RR."],
    references: ["Fleiss JL et al. Statistical Methods for Rates and Proportions.", "Kelsey JL et al. Methods in Observational Epidemiology."],
    compute: (v) => {
      const p1 = Math.min(0.98, pct(v.p0) * v.rr);
      return calculators.find((c) => c.id === "two-proportions")!.compute({ ...v, p1: v.p0, p2: p1 * 100 });
    },
  },
  {
    id: "case-control",
    category: "Epidemiology",
    title: "Case-Control / Odds Ratio",
    purpose: "Detect an odds ratio using expected control exposure prevalence.",
    variables: [
      { key: "p0", label: "Control exposure", min: 1, max: 90, step: 1, default: 25, suffix: "%", help: "Exposure prevalence among controls.", slider: true },
      { key: "or", label: "Odds ratio", min: 0.2, max: 5, step: 0.1, default: 2, help: "Target odds ratio.", slider: true },
      { key: "ratio", label: "Controls per case", min: 1, max: 4, step: 0.25, default: 1, help: "Number of controls for each case.", slider: true },
      ...commonPower(),
    ],
    formula: "p_case = OR*p_control / (1-p_control + OR*p_control), then two-proportions planning.",
    assumptions: ["Unmatched case-control design.", "Exposure is binary and measured independently."],
    references: ["Schlesselman JJ. Case-Control Studies.", "Kelsey JL et al. Methods in Observational Epidemiology."],
    compute: (v) => {
      const p0 = pct(v.p0);
      const pCase = (v.or * p0) / (1 - p0 + v.or * p0);
      const result = calculators.find((c) => c.id === "two-proportions")!.compute({ ...v, p1: pCase * 100, p2: v.p0, ratio: v.ratio });
      return { ...result, details: [`Cases n = ${result.perGroup}; controls follow selected ratio`, `Implied case exposure = ${(pCase * 100).toFixed(1)}%`] };
    },
  },
  {
    id: "noninferiority-means",
    category: "Advanced Trials",
    title: "Non-Inferiority Mean",
    purpose: "Compare a mean outcome against a non-inferiority margin.",
    variables: [
      { key: "margin", label: "NI margin", min: 1, max: 30, step: 0.5, default: 5, help: "Largest acceptable loss in original units.", slider: true },
      { key: "sd", label: "Common SD", min: 1, max: 100, step: 1, default: 15, help: "Expected within-group standard deviation.", slider: false },
      { key: "ratio", label: "Allocation ratio", min: 0.5, max: 3, step: 0.1, default: 1, help: "Experimental participants per control participant.", slider: true },
      ...commonPower(2.5, 80, 10),
    ],
    formula: "n_control = (1 + 1/r)(Zα + Zβ)²σ² / margin²",
    assumptions: ["One-sided non-inferiority framework.", "True difference is planned as zero unless a stricter effect is specified externally."],
    references: ["Chow SC et al. Sample Size Calculations in Clinical Research.", "ICH E9 Statistical Principles for Clinical Trials."],
    compute: (v) => {
      const base = ((1 + 1 / v.ratio) * (zAlpha(v.alpha, 1) + zPower(v.power)) ** 2 * v.sd ** 2) / v.margin ** 2;
      const control = ceil(base);
      const experimental = ceil(control * v.ratio);
      const total = control + experimental;
      return { primary: total, perGroup: control, total, adjustedTotal: dropoutInflation(total, v.dropout), details: [`Control n = ${control}; experimental n = ${experimental}`, `Margin/SD = ${(v.margin / v.sd).toFixed(2)}`] };
    },
  },
  {
    id: "equivalence-means",
    category: "Advanced Trials",
    title: "Equivalence Mean",
    purpose: "Plan a two one-sided tests equivalence study for a mean outcome.",
    variables: [
      { key: "margin", label: "Equivalence margin", min: 1, max: 30, step: 0.5, default: 5, help: "Symmetric acceptable difference.", slider: true },
      { key: "sd", label: "Common SD", min: 1, max: 100, step: 1, default: 15, help: "Expected within-group standard deviation.", slider: false },
      { key: "ratio", label: "Allocation ratio", min: 0.5, max: 3, step: 0.1, default: 1, help: "Group B participants per group A participant.", slider: true },
      ...commonPower(5, 80, 10),
    ],
    formula: "Approximate TOST: n_control = (1 + 1/r)(Zα + Zβ)²σ² / margin²",
    assumptions: ["Two one-sided tests approximation.", "True mean difference planned at zero."],
    references: ["Julious SA. Sample Sizes for Clinical Trials.", "Chow SC et al. Sample Size Calculations in Clinical Research."],
    compute: (v) => calculators.find((c) => c.id === "noninferiority-means")!.compute(v),
  },
  {
    id: "cluster-crt",
    category: "Advanced Trials",
    title: "Cluster Randomized Trial",
    purpose: "Adjust an individual-level comparison for clustering.",
    variables: [
      { key: "p1", label: "Control proportion", min: 1, max: 90, step: 1, default: 30, suffix: "%", help: "Control event or response rate.", slider: true },
      { key: "p2", label: "Intervention proportion", min: 1, max: 90, step: 1, default: 45, suffix: "%", help: "Intervention event or response rate.", slider: true },
      { key: "clusterSize", label: "Cluster size", min: 5, max: 200, step: 5, default: 30, help: "Average participants per cluster.", slider: true },
      { key: "icc", label: "ICC", min: 0.001, max: 0.2, step: 0.001, default: 0.02, help: "Intracluster correlation coefficient.", slider: false },
      ...commonPower(),
    ],
    formula: "Individual n × design effect; design effect = 1 + (m-1)ICC",
    assumptions: ["Equal cluster sizes approximation.", "Binary endpoint with two-arm cluster allocation."],
    references: ["Donner A, Klar N. Design and Analysis of Cluster Randomization Trials.", "Hayes RJ, Moulton LH. Cluster Randomised Trials."],
    compute: (v) => {
      const individual = calculators.find((c) => c.id === "two-proportions")!.compute({ ...v, ratio: 1, dropout: 0 });
      const deff = 1 + (v.clusterSize - 1) * v.icc;
      const total = ceil((individual.total ?? individual.primary) * deff);
      const clusters = ceil(total / v.clusterSize);
      return { primary: total, perGroup: ceil(clusters / 2), total, adjustedTotal: dropoutInflation(total, v.dropout), details: [`Design effect = ${deff.toFixed(2)}`, `Approximate clusters total = ${clusters}`] };
    },
  },
  {
    id: "survival",
    category: "Advanced Trials",
    title: "Survival / Time-to-Event",
    purpose: "Estimate required events and participants for a log-rank comparison.",
    variables: [
      { key: "hr", label: "Hazard ratio", min: 0.3, max: 0.95, step: 0.05, default: 0.7, help: "Target hazard ratio for treatment vs control.", slider: true },
      { key: "eventRate", label: "Overall event rate", min: 10, max: 90, step: 1, default: 50, suffix: "%", help: "Expected proportion with observed events by analysis.", slider: true },
      { key: "ratio", label: "Allocation ratio", min: 0.5, max: 3, step: 0.1, default: 1, help: "Treatment participants per control participant.", slider: true },
      ...commonPower(),
    ],
    formula: "Events = (Zα/2 + Zβ)² / [allocation fraction product × ln(HR)²]",
    assumptions: ["Proportional hazards.", "Log-rank test with approximately uniform information accrual."],
    references: ["Schoenfeld DA. Sample-size formula for the proportional-hazards regression model.", "Freedman LS. Tables of the number of patients required in clinical trials using the logrank test."],
    compute: (v) => {
      const p = v.ratio / (1 + v.ratio);
      const events = ceil((zAlpha(v.alpha) + zPower(v.power)) ** 2 / (p * (1 - p) * Math.log(v.hr) ** 2));
      const total = ceil(events / pct(v.eventRate));
      return { primary: total, perGroup: events, total, adjustedTotal: dropoutInflation(total, v.dropout), details: [`Required events = ${events}`, `Allocation information fraction = ${(p * (1 - p)).toFixed(2)}`] };
    },
  },
  {
    id: "linear-regression",
    category: "Modeling",
    title: "Multiple Linear Regression",
    purpose: "Plan for detecting model R² using Cohen's f² effect size.",
    variables: [
      { key: "f2", label: "Effect size f²", min: 0.02, max: 0.35, step: 0.01, default: 0.15, help: "Small=.02, medium=.15, large=.35.", slider: true },
      { key: "predictors", label: "Predictors", min: 1, max: 25, step: 1, default: 5, help: "Number of tested predictors.", slider: true },
      ...commonPower(),
    ],
    formula: "Approximate n = (Zα/2 + Zβ)² / f² + predictors + 1",
    assumptions: ["Planning approximation for omnibus regression signal.", "Use simulation for complex predictor distributions."],
    references: ["Cohen J. Statistical Power Analysis for the Behavioral Sciences.", "Green SB. How many subjects does it take to do a regression analysis?"],
    compute: (v) => {
      const n = ceil((zAlpha(v.alpha) + zPower(v.power)) ** 2 / v.f2 + v.predictors + 1);
      return { primary: n, total: n, adjustedTotal: dropoutInflation(n, v.dropout), details: [`Predictors included = ${v.predictors}`, `Cohen f² = ${v.f2.toFixed(2)}`] };
    },
  },
  {
    id: "logistic-regression",
    category: "Modeling",
    title: "Logistic Regression Events",
    purpose: "Plan minimum events for a multivariable logistic model.",
    variables: [
      { key: "predictors", label: "Predictors", min: 1, max: 30, step: 1, default: 8, help: "Candidate predictors or model degrees of freedom.", slider: true },
      { key: "eventsPerPredictor", label: "Events per predictor", min: 5, max: 30, step: 1, default: 15, help: "Conservative modeling target.", slider: true },
      { key: "eventRate", label: "Outcome event rate", min: 1, max: 80, step: 1, default: 20, suffix: "%", help: "Expected outcome prevalence.", slider: true },
      { key: "dropout", label: "Missing data", min: 0, max: 50, step: 1, default: 10, suffix: "%", help: "Expected incomplete records.", slider: true },
    ],
    formula: "Events = predictors × events-per-predictor; total n = events / event rate",
    assumptions: ["Rule-of-thumb planning for model stability.", "Prefer Riley/van Smeden style calculations for final prediction model protocols."],
    references: ["Peduzzi P et al. A simulation study of the number of events per variable in logistic regression analysis.", "Riley RD et al. Minimum sample size for developing a multivariable prediction model."],
    compute: (v) => {
      const events = ceil(v.predictors * v.eventsPerPredictor);
      const total = ceil(events / pct(v.eventRate));
      return { primary: total, perGroup: events, total, adjustedTotal: dropoutInflation(total, v.dropout), details: [`Target events = ${events}`, `Outcome event rate = ${v.eventRate}%`] };
    },
  },
];

const categories = ["All", ...Array.from(new Set(calculators.map((calculator) => calculator.category)))];

const decisionQuestions: Record<string, DecisionQuestion> = {
  goal: {
    id: "goal",
    prompt: "What is the main purpose of the study?",
    helper: "Choose the analysis goal that best matches the primary objective.",
    options: [
      { value: "estimate", label: "Estimate one quantity", description: "Prevalence, rate, proportion, or mean with a target precision." },
      { value: "compare", label: "Compare groups", description: "Treatment vs control, exposed vs unexposed, or before vs after." },
      { value: "association", label: "Study association", description: "Correlation, risk ratio, odds ratio, or hazard ratio." },
      { value: "diagnostic", label: "Diagnostic accuracy", description: "Sensitivity or specificity of a test against a reference standard." },
      { value: "modeling", label: "Prediction/modeling", description: "Regression or prediction model sample size planning." },
    ],
  },
  estimateType: {
    id: "estimateType",
    prompt: "What are you estimating?",
    helper: "This determines whether the app plans around a proportion or a continuous mean.",
    options: [
      { value: "proportion", label: "Proportion or prevalence", description: "A percentage such as prevalence, response, positivity, or coverage." },
      { value: "mean", label: "Mean value", description: "A continuous measurement such as score, blood pressure, or biomarker level." },
    ],
  },
  comparisonOutcome: {
    id: "comparisonOutcome",
    prompt: "What type of primary outcome are you comparing?",
    helper: "Pick the outcome scale used for the primary sample size calculation.",
    options: [
      { value: "binary", label: "Binary", description: "Event/no event, response/no response, disease/no disease." },
      { value: "continuous", label: "Continuous", description: "A numeric measurement summarized by means and standard deviations." },
      { value: "survival", label: "Time-to-event", description: "Time until event, censoring, hazard ratio, or log-rank comparison." },
    ],
  },
  comparisonStructure: {
    id: "comparisonStructure",
    prompt: "How are the observations arranged?",
    helper: "This helps separate independent, paired, clustered, and benchmark comparisons.",
    options: [
      { value: "independent", label: "Two independent groups", description: "Different people in each group." },
      { value: "paired", label: "Paired or before-after", description: "Same people measured twice or matched pairs." },
      { value: "clustered", label: "Clustered groups", description: "People are nested in clinics, schools, wards, practices, or communities." },
      { value: "benchmark", label: "One group vs benchmark", description: "A single group compared with a fixed historical or target value." },
    ],
  },
  comparisonDesign: {
    id: "comparisonDesign",
    prompt: "What best describes the group comparison?",
    helper: "Use the design as planned, not necessarily the later statistical model.",
    options: [
      { value: "trial", label: "Trial or experiment", description: "Groups are assigned by protocol or intervention." },
      { value: "cohort", label: "Cohort/exposure groups", description: "Exposed and unexposed groups are followed for outcome risk." },
      { value: "case-control", label: "Case-control", description: "Participants are sampled by outcome status, then exposure is compared." },
    ],
  },
  trialObjective: {
    id: "trialObjective",
    prompt: "What is the trial objective?",
    helper: "Most studies are superiority; choose non-inferiority or equivalence only when that is the protocol objective.",
    options: [
      { value: "superiority", label: "Superiority", description: "Show one group differs from or is better than another." },
      { value: "noninferiority", label: "Non-inferiority", description: "Show a new approach is not unacceptably worse." },
      { value: "equivalence", label: "Equivalence", description: "Show groups are similar within a symmetric margin." },
    ],
  },
  associationType: {
    id: "associationType",
    prompt: "What association measure best matches your question?",
    helper: "When in doubt, choose the measure named in the protocol or primary paper objective.",
    options: [
      { value: "correlation", label: "Correlation", description: "Two continuous variables measured on the same participants." },
      { value: "risk-ratio", label: "Risk ratio", description: "Outcome risk compared between exposed and unexposed groups." },
      { value: "odds-ratio", label: "Odds ratio", description: "Exposure odds compared between cases and controls." },
      { value: "hazard-ratio", label: "Hazard ratio", description: "Time-to-event association or survival comparison." },
    ],
  },
  diagnosticTarget: {
    id: "diagnosticTarget",
    prompt: "Which diagnostic accuracy target is primary?",
    helper: "If both sensitivity and specificity are co-primary, calculate both and use the larger total.",
    options: [
      { value: "sensitivity", label: "Sensitivity", description: "Precision among participants who truly have the condition." },
      { value: "specificity", label: "Specificity", description: "Precision among participants who truly do not have the condition." },
    ],
  },
  modelType: {
    id: "modelType",
    prompt: "What kind of model are you planning?",
    helper: "These are pragmatic planning tools; final prediction model protocols often need specialist methods.",
    options: [
      { value: "linear", label: "Linear regression", description: "Continuous outcome with predictors." },
      { value: "logistic", label: "Logistic regression", description: "Binary outcome or event/no-event model." },
    ],
  },
  complexity: {
    id: "complexity",
    prompt: "Does the design include advanced features?",
    helper: "Examples: adaptive design, repeated longitudinal outcomes, rare events, competing risks, complex survey sampling, Bayesian design, dose finding, mediation, or more than two arms.",
    options: [
      { value: "no", label: "No", description: "A standard design is a reasonable starting point." },
      { value: "yes", label: "Yes", description: "Use the recommendation as a starting point and request statistical review." },
    ],
  },
};

const decisionOrder = [
  "goal",
  "estimateType",
  "comparisonOutcome",
  "comparisonStructure",
  "comparisonDesign",
  "trialObjective",
  "associationType",
  "diagnosticTarget",
  "modelType",
  "complexity",
];

function getCurrentDecisionQuestion(answers: DecisionAnswers) {
  if (!answers.goal) return decisionQuestions.goal;

  if (answers.goal === "estimate" && !answers.estimateType) return decisionQuestions.estimateType;

  if (answers.goal === "compare") {
    if (!answers.comparisonOutcome) return decisionQuestions.comparisonOutcome;
    if (answers.comparisonOutcome !== "survival" && !answers.comparisonStructure) return decisionQuestions.comparisonStructure;
    if (
      answers.comparisonOutcome === "binary" &&
      answers.comparisonStructure === "independent" &&
      !answers.comparisonDesign
    ) {
      return decisionQuestions.comparisonDesign;
    }
    if (
      answers.comparisonOutcome === "continuous" &&
      answers.comparisonStructure === "independent" &&
      !answers.trialObjective
    ) {
      return decisionQuestions.trialObjective;
    }
  }

  if (answers.goal === "association" && !answers.associationType) return decisionQuestions.associationType;
  if (answers.goal === "diagnostic" && !answers.diagnosticTarget) return decisionQuestions.diagnosticTarget;
  if (answers.goal === "modeling" && !answers.modelType) return decisionQuestions.modelType;
  if (!answers.complexity) return decisionQuestions.complexity;

  return undefined;
}

function decisionResult(answers: DecisionAnswers): DecisionResult | undefined {
  if (getCurrentDecisionQuestion(answers)) return undefined;

  const warnings =
    answers.complexity === "yes"
      ? ["Advanced design features can make closed-form sample size formulas misleading. Use this calculator as orientation, then get statistical review."]
      : [];

  if (answers.goal === "estimate") {
    return answers.estimateType === "mean"
      ? {
          calculatorId: "single-mean",
          title: "Use Single Mean",
          explanation: "You are estimating one continuous quantity with target precision, so the planning driver is SD and margin of error.",
          assumptions: ["Continuous outcome.", "Primary goal is estimation rather than a hypothesis test."],
          warnings,
        }
      : {
          calculatorId: "prevalence",
          title: "Use Prevalence / Single Proportion",
          explanation: "You are estimating one percentage or prevalence with target precision, so the proportion CI formula is the right starting point.",
          assumptions: ["Binary or proportion outcome.", "Primary goal is confidence interval precision."],
          warnings,
        };
  }

  if (answers.goal === "diagnostic") {
    return answers.diagnosticTarget === "specificity"
      ? {
          calculatorId: "diagnostic-specificity",
          title: "Use Diagnostic Specificity",
          explanation: "Specificity is estimated among people without the condition, then inflated by the expected non-disease fraction.",
          assumptions: ["Reference standard is available.", "Specificity is the primary accuracy target."],
          warnings,
        }
      : {
          calculatorId: "diagnostic-sensitivity",
          title: "Use Diagnostic Sensitivity",
          explanation: "Sensitivity is estimated among people with the condition, then inflated by the expected prevalence.",
          assumptions: ["Reference standard is available.", "Sensitivity is the primary accuracy target."],
          warnings,
        };
  }

  if (answers.goal === "modeling") {
    return answers.modelType === "linear"
      ? {
          calculatorId: "linear-regression",
          title: "Use Multiple Linear Regression",
          explanation: "The planned outcome is continuous, so the regression calculator uses predictors and Cohen's f2 effect size.",
          assumptions: ["Continuous outcome.", "Approximate omnibus model planning."],
          warnings: [...warnings, "For clinical prediction model development, consider minimum sample size methods beyond simple rules."],
        }
      : {
          calculatorId: "logistic-regression",
          title: "Use Logistic Regression Events",
          explanation: "The planned outcome is binary, so sample size is driven by expected events and model degrees of freedom.",
          assumptions: ["Binary outcome.", "Event rate estimate is available."],
          warnings: [...warnings, "For final prediction model protocols, consider Riley-style minimum sample size methods."],
        };
  }

  if (answers.goal === "association") {
    const associationMap: Record<string, DecisionResult> = {
      correlation: {
        calculatorId: "correlation",
        title: "Use Correlation",
        explanation: "The question is about association between two continuous variables measured on the same participants.",
        assumptions: ["Pearson correlation is the target measure.", "No group allocation is being compared."],
        warnings,
      },
      "risk-ratio": {
        calculatorId: "cohort-rr",
        title: "Use Cohort / Risk Ratio",
        explanation: "The study compares outcome risk between exposed and unexposed groups.",
        assumptions: ["Exposure groups are observed or assembled before outcome assessment.", "Risk ratio is the primary effect measure."],
        warnings,
      },
      "odds-ratio": {
        calculatorId: "case-control",
        title: "Use Case-Control / Odds Ratio",
        explanation: "The study samples cases and controls, then compares exposure odds.",
        assumptions: ["Unmatched case-control design.", "Control exposure prevalence can be estimated."],
        warnings,
      },
      "hazard-ratio": {
        calculatorId: "survival",
        title: "Use Survival / Time-to-Event",
        explanation: "The target association is a hazard ratio, so planning is driven by required events.",
        assumptions: ["Proportional hazards.", "Expected event rate by analysis is available."],
        warnings,
      },
    };
    return associationMap[answers.associationType];
  }

  if (answers.goal === "compare") {
    if (answers.comparisonOutcome === "survival") {
      return {
        calculatorId: "survival",
        title: "Use Survival / Time-to-Event",
        explanation: "The primary comparison uses time until event, so the log-rank/event-based calculator is the correct starting point.",
        assumptions: ["Proportional hazards.", "Event rate and hazard ratio can be estimated."],
        warnings,
      };
    }

    if (answers.comparisonStructure === "clustered") {
      return {
        calculatorId: "cluster-crt",
        title: "Use Cluster Randomized Trial",
        explanation: "Participants are nested within clusters, so the individual-level sample size needs a design-effect adjustment.",
        assumptions: ["Average cluster size and ICC can be estimated.", "Cluster sizes are not extremely unequal."],
        warnings: [...warnings, "Cluster studies are sensitive to ICC assumptions; run sensitivity scenarios."],
      };
    }

    if (answers.comparisonStructure === "paired") {
      return answers.comparisonOutcome === "continuous"
        ? {
            calculatorId: "paired-mean",
            title: "Use Paired / Before-After Mean",
            explanation: "The same participants or matched pairs contribute paired continuous measurements.",
            assumptions: ["Paired differences are the primary outcome.", "SD of differences can be estimated."],
            warnings,
          }
        : {
            calculatorId: "two-proportions",
            title: "Start With Two Independent Proportions",
            explanation: "The current app does not yet include a paired binary formula, so this is only a conservative orientation point.",
            assumptions: ["Binary outcome.", "Pairing/matching should be handled in a specialist calculation."],
            warnings: [...warnings, "Paired binary outcomes usually need McNemar or matched-pair methods; request statistical review."],
          };
    }

    if (answers.comparisonStructure === "benchmark") {
      return answers.comparisonOutcome === "binary"
        ? {
            calculatorId: "one-proportion-test",
            title: "Use One Proportion vs Benchmark",
            explanation: "A single binary proportion is being tested against a fixed historical or target value.",
            assumptions: ["Benchmark is fixed.", "One sample contributes the new proportion."],
            warnings,
          }
        : {
            calculatorId: "single-mean",
            title: "Start With Single Mean",
            explanation: "The current app estimates one mean precisely; testing a single mean against a benchmark can be added as a dedicated calculator.",
            assumptions: ["Continuous outcome.", "Benchmark is fixed."],
            warnings: [...warnings, "For a formal one-sample mean hypothesis test, confirm the exact formula before protocol use."],
          };
    }

    if (answers.comparisonOutcome === "binary") {
      if (answers.comparisonDesign === "cohort") {
        return {
          calculatorId: "cohort-rr",
          title: "Use Cohort / Risk Ratio",
          explanation: "The design compares exposed and unexposed groups on later outcome risk.",
          assumptions: ["Binary outcome risk.", "Exposure groups are independent."],
          warnings,
        };
      }
      if (answers.comparisonDesign === "case-control") {
        return {
          calculatorId: "case-control",
          title: "Use Case-Control / Odds Ratio",
          explanation: "Participants are sampled by outcome status, so exposure prevalence and odds ratio drive the calculation.",
          assumptions: ["Unmatched case-control design.", "Control exposure prevalence can be estimated."],
          warnings,
        };
      }
      return {
        calculatorId: "two-proportions",
        title: "Use Two Independent Proportions",
        explanation: "Two independent groups are being compared on a binary event or response rate.",
        assumptions: ["Independent binary outcomes.", "Superiority comparison by default."],
        warnings,
      };
    }

    if (answers.trialObjective === "noninferiority") {
      return {
        calculatorId: "noninferiority-means",
        title: "Use Non-Inferiority Mean",
        explanation: "The study is designed to rule out an unacceptable loss on a continuous endpoint.",
        assumptions: ["Continuous outcome.", "One-sided non-inferiority margin is clinically justified."],
        warnings,
      };
    }
    if (answers.trialObjective === "equivalence") {
      return {
        calculatorId: "equivalence-means",
        title: "Use Equivalence Mean",
        explanation: "The study is designed to show the mean difference lies within a symmetric equivalence margin.",
        assumptions: ["Continuous outcome.", "Two one-sided tests framework."],
        warnings,
      };
    }
    return {
      calculatorId: "two-means",
      title: "Use Two Independent Means",
      explanation: "Two independent groups are being compared on a continuous outcome under a superiority objective.",
      assumptions: ["Independent groups.", "Common SD can be estimated."],
      warnings,
    };
  }

  return undefined;
}

function initialValues(calculator: Calculator) {
  return Object.fromEntries(calculator.variables.map((variable) => [variable.key, variable.default]));
}

function formatNumber(value?: number) {
  if (!value) return "—";
  return value.toLocaleString("en-US");
}

function hashSeed(seed: string) {
  let hash = 1779033703 ^ seed.length;
  for (let index = 0; index < seed.length; index += 1) {
    hash = Math.imul(hash ^ seed.charCodeAt(index), 3432918353);
    hash = (hash << 13) | (hash >>> 19);
  }
  return () => {
    hash = Math.imul(hash ^ (hash >>> 16), 2246822507);
    hash = Math.imul(hash ^ (hash >>> 13), 3266489909);
    return (hash ^= hash >>> 16) >>> 0;
  };
}

function seededRandom(seed: string) {
  const nextSeed = hashSeed(seed);
  let state = nextSeed();
  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle<T>(items: T[], random: () => number) {
  const next = [...items];
  for (let index = next.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [next[index], next[swapIndex]] = [next[swapIndex], next[index]];
  }
  return next;
}

function parseGroups(rawGroups: string) {
  const groups = rawGroups
    .split(/[\n,]+/)
    .map((group) => group.trim())
    .filter(Boolean);
  return groups.length >= 2 ? groups : ["Group A", "Group B"];
}

function makeBalancedPool(groups: string[], count: number) {
  return Array.from({ length: count }, (_, index) => groups[index % groups.length]);
}

function generateRandomisation(
  subjectCount: number,
  groups: string[],
  method: RandomisationMethod,
  blockSize: number,
  seed: string,
): RandomisationAssignment[] {
  const random = seededRandom(seed || "studysize-studio");

  if (method === "block") {
    const normalisedBlockSize = Math.max(groups.length, Math.round(blockSize));
    const assignments: RandomisationAssignment[] = [];
    let block = 1;

    while (assignments.length < subjectCount) {
      const remaining = subjectCount - assignments.length;
      const currentSize = Math.min(normalisedBlockSize, remaining);
      const blockPool = shuffle(makeBalancedPool(groups, currentSize), random);
      blockPool.forEach((group) => {
        assignments.push({ subject: assignments.length + 1, group, block });
      });
      block += 1;
    }

    return assignments;
  }

  return shuffle(makeBalancedPool(groups, subjectCount), random).map((group, index) => ({
    subject: index + 1,
    group,
  }));
}

const randomisationBestPractice = [
  "Define the randomisation unit before generating the sequence: individual participant, cluster, eye, lesion, or another unit.",
  "Generate the allocation sequence before enrolment using a documented method, seed, date, study title, groups, and allocation ratio.",
  "Keep the sequence concealed from recruiters and outcome assessors whenever possible. Use a central randomisation service, pharmacy, database, or sequentially numbered opaque sealed envelopes.",
  "Randomise only after eligibility is confirmed and informed consent is complete.",
  "Use blocked randomisation when balance over time matters; keep block sizes confidential and consider variable block sizes for open-label trials.",
  "Use stratified randomisation when key prognostic variables must be balanced, but avoid too many strata for the sample size.",
  "Do not replace, skip, or reassign allocations after the sequence is generated. Record withdrawals and protocol deviations separately.",
  "Preserve an audit trail: who generated the list, who held it, who assigned participants, timestamps, and any emergency unblinding.",
  "Report the sequence generation method, allocation concealment mechanism, and implementation roles in the protocol and manuscript.",
];

function makePdf(title: string, lines: string[]) {
  const escaped = lines.map((line) => line.replace(/[^\x20-\x7e]/g, "-").replace(/[()\\]/g, "\\$&"));
  const perPage = 39;
  const chunks = Array.from({ length: Math.ceil(escaped.length / perPage) }, (_, index) =>
    escaped.slice(index * perPage, index * perPage + perPage),
  );
  const objects = ["<< /Type /Catalog /Pages 2 0 R >>", "", "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>"];
  const pageObjectIds: number[] = [];

  chunks.forEach((chunk, pageIndex) => {
    const pageObjectId = objects.length + 1;
    const contentObjectId = objects.length + 2;
    pageObjectIds.push(pageObjectId);
    const text = [
      `BT /F1 18 Tf 54 770 Td (${title}) Tj`,
      `/F1 9 Tf 0 -18 Td (Page ${pageIndex + 1} of ${chunks.length}) Tj`,
      "/F1 10 Tf 0 -22 Td",
    ];
    chunk.forEach((line) => text.push(`(${line}) Tj 0 -15 Td`));
    text.push("ET");
    const stream = text.join("\n");
    objects.push(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 3 0 R >> >> /Contents ${contentObjectId} 0 R >>`,
      `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`,
    );
  });

  objects[1] = `<< /Type /Pages /Kids [${pageObjectIds.map((id) => `${id} 0 R`).join(" ")}] /Count ${pageObjectIds.length} >>`;
  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  objects.forEach((object, index) => {
    offsets.push(pdf.length);
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });
  const xref = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  offsets.slice(1).forEach((offset) => {
    pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
  });
  pdf += `trailer << /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return new Blob([pdf], { type: "application/pdf" });
}

export function SampleSizeApp() {
  const [mode, setMode] = useState<AppMode>("finder");
  const [activeCategory, setActiveCategory] = useState("All");
  const [activeId, setActiveId] = useState(calculators[0].id);
  const [decisionAnswers, setDecisionAnswers] = useState<DecisionAnswers>({});
  const [randomSubjectCount, setRandomSubjectCount] = useState(60);
  const [randomGroups, setRandomGroups] = useState("Intervention, Control");
  const [randomMethod, setRandomMethod] = useState<RandomisationMethod>("block");
  const [randomBlockSize, setRandomBlockSize] = useState(4);
  const [randomSeed, setRandomSeed] = useState("STUDY-2026");
  const [valuesByCalculator, setValuesByCalculator] = useState<Record<string, Values>>(() =>
    Object.fromEntries(calculators.map((calculator) => [calculator.id, initialValues(calculator)])),
  );
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [status, setStatus] = useState("");

  useEffect(() => {
    const saved = window.localStorage.getItem("studysize-scenarios");
    if (saved) setScenarios(JSON.parse(saved));
  }, []);

  const calculator = calculators.find((item) => item.id === activeId) ?? calculators[0];
  const values = valuesByCalculator[calculator.id] ?? initialValues(calculator);
  const result = useMemo(() => calculator.compute(values), [calculator, values]);
  const filtered = calculators.filter((item) => activeCategory === "All" || item.category === activeCategory);
  const currentDecisionQuestion = getCurrentDecisionQuestion(decisionAnswers);
  const recommendation = decisionResult(decisionAnswers);
  const randomisedGroups = useMemo(() => parseGroups(randomGroups), [randomGroups]);
  const randomisationAssignments = useMemo(
    () =>
      generateRandomisation(
        randomSubjectCount,
        randomisedGroups,
        randomMethod,
        randomBlockSize,
        randomSeed,
      ),
    [randomSubjectCount, randomisedGroups, randomMethod, randomBlockSize, randomSeed],
  );
  const randomisationCounts = randomisationAssignments.reduce<Record<string, number>>((counts, assignment) => {
    counts[assignment.group] = (counts[assignment.group] ?? 0) + 1;
    return counts;
  }, {});
  const decisionPath = decisionOrder
    .filter((id) => decisionAnswers[id])
    .map((id) => {
      const question = decisionQuestions[id];
      const answer = question.options.find((option) => option.value === decisionAnswers[id]);
      return { question: question.prompt, answer: answer?.label ?? decisionAnswers[id] };
    });

  function updateValue(key: string, value: number) {
    setValuesByCalculator((current) => ({
      ...current,
      [calculator.id]: {
        ...values,
        [key]: value,
      },
    }));
  }

  function saveScenario() {
    const scenario: Scenario = {
      id: crypto.randomUUID(),
      calculatorId: calculator.id,
      calculatorTitle: calculator.title,
      values,
      result,
      createdAt: new Date().toISOString(),
    };
    const next = [scenario, ...scenarios].slice(0, 12);
    setScenarios(next);
    window.localStorage.setItem("studysize-scenarios", JSON.stringify(next));
    setStatus("Scenario saved");
  }

  function loadScenario(scenario: Scenario) {
    setActiveId(scenario.calculatorId);
    setActiveCategory(calculators.find((item) => item.id === scenario.calculatorId)?.category ?? "All");
    setValuesByCalculator((current) => ({ ...current, [scenario.calculatorId]: scenario.values }));
    setStatus("Scenario loaded");
  }

  function downloadPdf() {
    const lines = [
      `Calculator: ${calculator.title}`,
      `Purpose: ${calculator.purpose}`,
      `Required total: ${formatNumber(result.total ?? result.primary)}`,
      `Adjusted total: ${formatNumber(result.adjustedTotal)}`,
      ...calculator.variables.map((variable) => `${variable.label}: ${values[variable.key]}${variable.suffix ?? ""}`),
      `Formula: ${calculator.formula}`,
      ...result.details,
      ...calculator.assumptions.map((item) => `Assumption: ${item}`),
      ...calculator.references.map((item) => `Reference: ${item}`),
    ];
    const url = URL.createObjectURL(makePdf("StudySize Studio Result", lines));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${calculator.id}-sample-size.pdf`;
    anchor.click();
    URL.revokeObjectURL(url);
    setStatus("PDF downloaded");
  }

  function downloadRandomisationPdf() {
    const visibleAssignments = randomisationAssignments.map((assignment) =>
      `Subject ${assignment.subject}: ${assignment.group}${assignment.block ? ` (block ${assignment.block})` : ""}`,
    );
    const lines = [
      `Randomisation method: ${randomMethod === "block" ? "Permuted block randomisation" : "Simple balanced randomisation"}`,
      `Subjects: ${randomSubjectCount}`,
      `Groups: ${randomisedGroups.join(", ")}`,
      `Seed: ${randomSeed || "studysize-studio"}`,
      randomMethod === "block" ? `Block size: ${Math.max(randomisedGroups.length, Math.round(randomBlockSize))}` : "Block size: Not used",
      "Allocation counts:",
      ...Object.entries(randomisationCounts).map(([group, count]) => `${group}: ${count}`),
      "Assignments:",
      ...visibleAssignments,
      "Best-practice notes:",
      ...randomisationBestPractice,
    ];
    const url = URL.createObjectURL(makePdf("StudySize Studio Randomisation", lines));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "studysize-randomisation.pdf";
    anchor.click();
    URL.revokeObjectURL(url);
    setStatus("Randomisation PDF downloaded");
  }

  function answerDecision(questionId: string, value: string) {
    const index = decisionOrder.indexOf(questionId);
    setDecisionAnswers((current) => {
      const next: DecisionAnswers = {};
      decisionOrder.slice(0, index).forEach((id) => {
        if (current[id]) next[id] = current[id];
      });
      next[questionId] = value;
      return next;
    });
  }

  function goBackDecision() {
    const answered = decisionOrder.filter((id) => decisionAnswers[id]);
    const last = answered.at(-1);
    if (!last) return;
    setDecisionAnswers((current) => {
      const next = { ...current };
      delete next[last];
      return next;
    });
  }

  function useRecommendedCalculator(calculatorId: string) {
    const nextCalculator = calculators.find((item) => item.id === calculatorId);
    if (!nextCalculator) return;
    setActiveId(nextCalculator.id);
    setActiveCategory(nextCalculator.category);
    setMode("calculator");
    setStatus("Calculator selected from decision tree");
  }

  return (
    <main className="app-shell">
      <section className="masthead" aria-labelledby="app-title">
        <div>
          <p className="eyebrow">Sample size calculators</p>
          <h1 id="app-title">StudySize Studio</h1>
          <p className="byline">By: Christopher Ryalino (c) 2026.</p>
          <p>
            Live calculators for researchers and clinicians, with exact inputs beside slider controls,
            visible assumptions, citations, dropout adjustment, and saved planning scenarios.
          </p>
        </div>
        <div className="hero-metrics" aria-label="Catalog summary">
          <span><strong>{calculators.length}</strong> designs</span>
          <span><strong>{categories.length - 1}</strong> families</span>
          <span><strong>Guided</strong> tree</span>
        </div>
      </section>

      <nav className="mode-tabs" aria-label="Main app modes">
        <button className={mode === "finder" ? "active" : ""} type="button" onClick={() => setMode("finder")}>
          Find my calculator
        </button>
        <button className={mode === "calculator" ? "active" : ""} type="button" onClick={() => setMode("calculator")}>
          Calculator catalog
        </button>
        <button className={mode === "randomiser" ? "active" : ""} type="button" onClick={() => setMode("randomiser")}>
          Randomiser
        </button>
      </nav>

      <section className="workspace">
        <aside className="catalog" aria-label="Study design catalog">
          <div className="category-tabs" role="tablist" aria-label="Filter study designs">
            {categories.map((category) => (
              <button
                className={activeCategory === category ? "active" : ""}
                key={category}
                onClick={() => setActiveCategory(category)}
                type="button"
              >
                {category}
              </button>
            ))}
          </div>
          <div className="design-list">
            {filtered.map((item) => (
              <button
                className={item.id === calculator.id ? "design-card selected" : "design-card"}
                key={item.id}
                onClick={() => setActiveId(item.id)}
                type="button"
              >
                <span>{item.category}</span>
                <strong>{item.title}</strong>
                <small>{item.purpose}</small>
              </button>
            ))}
          </div>
        </aside>

        {mode === "finder" ? (
          <section className="finder-panel" aria-labelledby="finder-title">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">Decision support</p>
                <h2 id="finder-title">Find my calculator</h2>
                <p>
                  Answer a few study-design questions and the app will suggest the closest calculator,
                  explain why, and flag when statistical review is important.
                </p>
              </div>
              <div className="actions">
                <button type="button" onClick={goBackDecision} disabled={decisionPath.length === 0}>
                  Back
                </button>
                <button type="button" onClick={() => setDecisionAnswers({})}>
                  Reset
                </button>
              </div>
            </div>

            <div className="decision-body">
              <div className="decision-card">
                {currentDecisionQuestion ? (
                  <>
                    <span>Question {decisionPath.length + 1}</span>
                    <h3>{currentDecisionQuestion.prompt}</h3>
                    <p>{currentDecisionQuestion.helper}</p>
                    <div className="choice-grid">
                      {currentDecisionQuestion.options.map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => answerDecision(currentDecisionQuestion.id, option.value)}
                        >
                          <strong>{option.label}</strong>
                          <small>{option.description}</small>
                        </button>
                      ))}
                    </div>
                  </>
                ) : recommendation ? (
                  <>
                    <span>Recommendation</span>
                    <h3>{recommendation.title}</h3>
                    <p>{recommendation.explanation}</p>
                    <div className="recommendation-grid">
                      <article>
                        <strong>Assumptions to check</strong>
                        <ul>{recommendation.assumptions.map((item) => <li key={item}>{item}</li>)}</ul>
                      </article>
                      <article>
                        <strong>Warning flags</strong>
                        {recommendation.warnings.length === 0 ? (
                          <p>No major warning flags based on these answers.</p>
                        ) : (
                          <ul>{recommendation.warnings.map((item) => <li key={item}>{item}</li>)}</ul>
                        )}
                      </article>
                    </div>
                    {recommendation.calculatorId && (
                      <button
                        className="use-calculator"
                        type="button"
                        onClick={() => useRecommendedCalculator(recommendation.calculatorId!)}
                      >
                        Use this calculator
                      </button>
                    )}
                  </>
                ) : null}
              </div>

              <aside className="path-card" aria-label="Decision path">
                <span>Decision path</span>
                {decisionPath.length === 0 ? (
                  <p>No answers yet.</p>
                ) : (
                  <ol>
                    {decisionPath.map((step) => (
                      <li key={`${step.question}-${step.answer}`}>
                        <strong>{step.answer}</strong>
                        <small>{step.question}</small>
                      </li>
                    ))}
                  </ol>
                )}
              </aside>
            </div>
          </section>
        ) : mode === "randomiser" ? (
          <section className="randomiser-panel" aria-labelledby="randomiser-title">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">Allocation sequence</p>
                <h2 id="randomiser-title">Subject randomiser</h2>
                <p>
                  Generate a documented allocation sequence for standard individual randomisation,
                  then export the settings, sequence, and best-practice notes as a PDF.
                </p>
              </div>
              <div className="actions">
                <button type="button" onClick={downloadRandomisationPdf}>Download PDF</button>
              </div>
            </div>

            <div className="randomiser-grid">
              <section className="randomiser-controls" aria-label="Randomiser settings">
                <label className="control">
                  <span>
                    <strong>Number of subjects</strong>
                    <small>Total number of randomisation slots to generate.</small>
                  </span>
                  <div className="input-row">
                    <input
                      aria-label="Number of subjects slider"
                      max={500}
                      min={2}
                      onChange={(event) => setRandomSubjectCount(Number(event.target.value))}
                      step={1}
                      type="range"
                      value={randomSubjectCount}
                    />
                    <div className="number-wrap">
                      <input
                        aria-label="Number of subjects"
                        max={500}
                        min={2}
                        onChange={(event) => setRandomSubjectCount(Number(event.target.value))}
                        step={1}
                        type="number"
                        value={randomSubjectCount}
                      />
                    </div>
                  </div>
                </label>

                <label className="control">
                  <span>
                    <strong>Groups</strong>
                    <small>Separate treatment arms with commas or line breaks.</small>
                  </span>
                  <textarea
                    aria-label="Randomisation groups"
                    onChange={(event) => setRandomGroups(event.target.value)}
                    rows={3}
                    value={randomGroups}
                  />
                </label>

                <label className="control">
                  <span>
                    <strong>Method</strong>
                    <small>Blocked randomisation helps preserve balance during recruitment.</small>
                  </span>
                  <select
                    aria-label="Randomisation method"
                    onChange={(event) => setRandomMethod(event.target.value as RandomisationMethod)}
                    value={randomMethod}
                  >
                    <option value="block">Permuted block</option>
                    <option value="simple">Simple balanced</option>
                  </select>
                </label>

                <label className="control">
                  <span>
                    <strong>Block size</strong>
                    <small>Used only for permuted blocks; keep it concealed in open-label trials.</small>
                  </span>
                  <div className="input-row">
                    <input
                      aria-label="Block size slider"
                      disabled={randomMethod !== "block"}
                      max={24}
                      min={randomisedGroups.length}
                      onChange={(event) => setRandomBlockSize(Number(event.target.value))}
                      step={1}
                      type="range"
                      value={Math.max(randomisedGroups.length, randomBlockSize)}
                    />
                    <div className="number-wrap">
                      <input
                        aria-label="Block size"
                        disabled={randomMethod !== "block"}
                        max={24}
                        min={randomisedGroups.length}
                        onChange={(event) => setRandomBlockSize(Number(event.target.value))}
                        step={1}
                        type="number"
                        value={Math.max(randomisedGroups.length, randomBlockSize)}
                      />
                    </div>
                  </div>
                </label>

                <label className="control">
                  <span>
                    <strong>Seed</strong>
                    <small>Record this in the randomisation file to reproduce the sequence.</small>
                  </span>
                  <input
                    aria-label="Randomisation seed"
                    onChange={(event) => setRandomSeed(event.target.value)}
                    type="text"
                    value={randomSeed}
                  />
                </label>
              </section>

              <section className="allocation-card" aria-label="Generated allocation">
                <div className="allocation-head">
                  <div>
                    <span>Generated sequence</span>
                    <strong>{randomSubjectCount} subjects</strong>
                  </div>
                  <div className="allocation-counts">
                    {Object.entries(randomisationCounts).map(([group, count]) => (
                      <span key={group}>{group}: {count}</span>
                    ))}
                  </div>
                </div>
                <div className="allocation-table" role="table" aria-label="Randomisation allocation table">
                  <div className="allocation-row heading" role="row">
                    <span>Subject</span>
                    <span>Assignment</span>
                    <span>Block</span>
                  </div>
                  {randomisationAssignments.slice(0, 120).map((assignment) => (
                    <div className="allocation-row" key={assignment.subject} role="row">
                      <span>{assignment.subject}</span>
                      <strong>{assignment.group}</strong>
                      <span>{assignment.block ?? "—"}</span>
                    </div>
                  ))}
                </div>
                {randomisationAssignments.length > 120 && (
                  <p className="table-note">Showing the first 120 assignments. The PDF includes the full sequence.</p>
                )}
              </section>
            </div>

            <section className="best-practice" aria-labelledby="best-practice-title">
              <div>
                <p className="eyebrow">Best practice</p>
                <h3 id="best-practice-title">How to conduct randomisation properly</h3>
                <p>
                  Randomisation is not only the sequence. Good practice also requires allocation
                  concealment, documented roles, and a clear audit trail from consent through assignment.
                </p>
              </div>
              <ol>
                {randomisationBestPractice.map((item) => <li key={item}>{item}</li>)}
              </ol>
            </section>
          </section>
        ) : (
          <section className="calculator-panel" aria-labelledby="calculator-title">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">{calculator.category}</p>
                <h2 id="calculator-title">{calculator.title}</h2>
                <p>{calculator.purpose}</p>
              </div>
              <div className="actions">
                <button type="button" onClick={saveScenario}>Save scenario</button>
                <button type="button" onClick={downloadPdf}>Download PDF</button>
              </div>
            </div>

            <div className="inputs-grid">
              {calculator.variables.map((variable) => (
                <label className="control" key={variable.key}>
                  <span>
                    <strong>{variable.label}</strong>
                    <small>{variable.help}</small>
                  </span>
                  <div className="input-row">
                    {variable.slider && (
                      <input
                        aria-label={`${variable.label} slider`}
                        max={variable.max}
                        min={variable.min}
                        onChange={(event) => updateValue(variable.key, Number(event.target.value))}
                        step={variable.step}
                        type="range"
                        value={values[variable.key]}
                      />
                    )}
                    <div className="number-wrap">
                      <input
                        aria-label={variable.label}
                        max={variable.max}
                        min={variable.min}
                        onChange={(event) => updateValue(variable.key, Number(event.target.value))}
                        step={variable.step}
                        type="number"
                        value={values[variable.key]}
                      />
                      <em>{variable.suffix}</em>
                    </div>
                  </div>
                </label>
              ))}
            </div>

            <div className="evidence">
              <article>
                <h3>Formula</h3>
                <p>{calculator.formula}</p>
              </article>
              <article>
                <h3>Assumptions</h3>
                <ul>{calculator.assumptions.map((item) => <li key={item}>{item}</li>)}</ul>
              </article>
              <article>
                <h3>References</h3>
                <ul>{calculator.references.map((item) => <li key={item}>{item}</li>)}</ul>
              </article>
            </div>
          </section>
        )}

        {mode === "randomiser" ? (
          <aside className="results" aria-label="Randomiser summary">
            <div className="result-card primary">
              <span>Randomisation slots</span>
              <strong>{formatNumber(randomSubjectCount)}</strong>
              <small>{randomisedGroups.length} allocation groups</small>
            </div>
            <div className="result-card">
              <span>Method</span>
              <strong>{randomMethod === "block" ? "Blocked" : "Simple"}</strong>
              <small>{randomMethod === "block" ? `Block size ${Math.max(randomisedGroups.length, randomBlockSize)}` : "Balanced shuffled sequence"}</small>
            </div>
            <div className="result-card">
              <span>Allocation counts</span>
              <ul>{Object.entries(randomisationCounts).map(([group, count]) => <li key={group}>{group}: {count}</li>)}</ul>
            </div>
            <div className="result-card">
              <span>Documentation</span>
              <ul>
                <li>Seed: {randomSeed || "studysize-studio"}</li>
                <li>Export the PDF before enrolment.</li>
                <li>Keep the sequence concealed from recruiters.</li>
              </ul>
            </div>
          </aside>
        ) : (
          <aside className="results" aria-label="Live result">
            <div className="result-card primary">
              <span>Required sample size</span>
              <strong>{formatNumber(result.total ?? result.primary)}</strong>
              <small>Total before dropout adjustment</small>
            </div>
            <div className="result-card">
              <span>Adjusted total</span>
              <strong>{formatNumber(result.adjustedTotal)}</strong>
              <small>Includes expected dropout or missing data</small>
            </div>
            <div className="result-card">
              <span>Planning notes</span>
              <ul>{result.details.map((detail) => <li key={detail}>{detail}</li>)}</ul>
            </div>
            <div className="saved">
              <div className="saved-head">
                <span>Saved scenarios</span>
                <small>{status}</small>
              </div>
              {scenarios.length === 0 ? (
                <p>No saved scenarios yet.</p>
              ) : (
                scenarios.map((scenario) => (
                  <button key={scenario.id} type="button" onClick={() => loadScenario(scenario)}>
                    <strong>{scenario.calculatorTitle}</strong>
                    <span>{formatNumber(scenario.result.adjustedTotal)} adjusted</span>
                  </button>
                ))
              )}
            </div>
          </aside>
        )}
      </section>
    </main>
  );
}
