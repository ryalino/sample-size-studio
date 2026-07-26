"use client";

import { useEffect, useMemo, useState } from "react";

type Values = Record<string, number>;
type Language = "en" | "id" | "nl";
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
type AppMode = "finder" | "calculator" | "randomiser" | "blinding" | "scenario" | "checklist";
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
type ConcealmentMethod = "central" | "pharmacy" | "envelopes" | "open";
type SequenceHolder = "statistician" | "pharmacy" | "system" | "investigator";
type RandomisationAssignment = {
  subject: number;
  group: string;
  stratum?: string;
  block?: number;
};
type ChecklistKey =
  | "trial"
  | "observational"
  | "systematic-review"
  | "diagnostic"
  | "protocol"
  | "case-report"
  | "qualitative"
  | "quality-improvement"
  | "economic"
  | "prediction-model"
  | "arrive"
  | "entreq"
  | "srqr"
  | "stard"
  | "remark"
  | "moose"
  | "equator-library";
type ChecklistTreeAnswers = Record<string, boolean>;
type ChecklistTreeQuestion = {
  id: string;
  prompt: string;
  yes?: string | ChecklistKey;
  no?: string | ChecklistKey;
};

const indonesianText: Record<string, string> = {
  "Language selector": "Pemilih bahasa",
  "Sample size calculators": "Kalkulator besar sampel",
  "Your one-stop solution for medical research": "Solusi terpadu untuk penelitian medis",
  "How to cite us": "Cara mengutip kami",
  "Your one-stop solution for research preparation.": "Solusi terpadu untuk persiapan penelitian.",
  "Catalog summary": "Ringkasan katalog",
  "designs": "desain",
  "families": "keluarga",
  "Guided": "Terpandu",
  "tree": "alur",
  "Main app modes": "Mode utama aplikasi",
  "Find my calculator": "Temukan kalkulator saya",
  "Calculator catalog": "Katalog kalkulator",
  "Randomiser": "Randomisasi",
  "Scenario Comparison": "Perbandingan skenario",
  "Study Design": "Desain Studi",
  "Reporting Checklist Helper": "Bantuan daftar periksa pelaporan",
  "Study design catalog": "Katalog desain studi",
  "Filter study designs": "Saring desain studi",
  "Decision support": "Bantuan keputusan",
  "Answer a few study-design questions and the app will suggest the closest calculator, explain why, and flag when statistical review is important.": "Jawab beberapa pertanyaan desain studi, lalu aplikasi akan menyarankan kalkulator yang paling sesuai, menjelaskan alasannya, dan menandai kapan tinjauan statistik penting.",
  "Back": "Kembali",
  "Reset": "Atur ulang",
  "Question": "Pertanyaan",
  "Recommendation": "Rekomendasi",
  "Assumptions to check": "Asumsi yang perlu diperiksa",
  "Warning flags": "Tanda peringatan",
  "No major warning flags based on these answers.": "Tidak ada tanda peringatan besar berdasarkan jawaban ini.",
  "Use this calculator": "Gunakan kalkulator ini",
  "Decision path": "Alur keputusan",
  "No answers yet.": "Belum ada jawaban.",
  "Allocation sequence": "Urutan alokasi",
  "Subject randomiser": "Randomisasi subjek",
  "Generate a documented allocation sequence for standard individual randomisation, then export the settings, sequence, and best-practice notes as a PDF.": "Buat urutan alokasi terdokumentasi untuk randomisasi individu standar, lalu ekspor pengaturan, urutan, dan catatan praktik baik sebagai PDF.",
  "Download PDF": "Unduh PDF",
  "Log template PDF": "PDF templat log",
  "Randomiser settings": "Pengaturan randomisasi",
  "Number of subjects": "Jumlah subjek",
  "Total number of randomisation slots to generate.": "Total slot randomisasi yang akan dibuat.",
  "Number of subjects slider": "Penggeser jumlah subjek",
  "Groups": "Kelompok",
  "Separate treatment arms with commas or line breaks.": "Pisahkan lengan perlakuan dengan koma atau baris baru.",
  "Randomisation groups": "Kelompok randomisasi",
  "Strata": "Strata",
  "Optional. Separate sites or prognostic strata with commas or line breaks.": "Opsional. Pisahkan lokasi atau strata prognostik dengan koma atau baris baru.",
  "Randomisation strata": "Strata randomisasi",
  "Method": "Metode",
  "Blocked randomisation helps preserve balance during recruitment.": "Randomisasi blok membantu menjaga keseimbangan selama rekrutmen.",
  "Randomisation method": "Metode randomisasi",
  "Permuted block": "Blok permutasi",
  "Simple balanced": "Seimbang sederhana",
  "Block size": "Ukuran blok",
  "Used only for permuted blocks; keep it concealed in open-label trials.": "Digunakan hanya untuk blok permutasi; rahasiakan pada uji label terbuka.",
  "Block size slider": "Penggeser ukuran blok",
  "Seed": "Seed",
  "Record this in the randomisation file to reproduce the sequence.": "Catat ini dalam file randomisasi agar urutan dapat direproduksi.",
  "Randomisation seed": "Seed randomisasi",
  "Generated allocation": "Alokasi yang dibuat",
  "Generated sequence": "Urutan yang dibuat",
  "subjects": "subjek",
  "Subject": "Subjek",
  "Assignment": "Alokasi",
  "Stratum": "Stratum",
  "Block": "Blok",
  "Showing the first 120 assignments. The PDF includes the full sequence.": "Menampilkan 120 alokasi pertama. PDF memuat urutan lengkap.",
  "Best practice": "Praktik baik",
  "How to conduct randomisation properly": "Cara melakukan randomisasi dengan benar",
  "Randomisation is not only the sequence. Good practice also requires allocation concealment, documented roles, and a clear audit trail from consent through assignment.": "Randomisasi bukan hanya urutan. Praktik baik juga memerlukan penyembunyian alokasi, peran terdokumentasi, dan jejak audit yang jelas sejak persetujuan hingga alokasi.",
  "Blinding": "Pembutaan",
  "Blinding and allocation concealment guide": "Panduan pembutaan dan penyembunyian alokasi",
  "The allocation sequence should be protected before assignment, and blinding should be planned around who can influence enrolment, treatment, assessment, or analysis.": "Urutan alokasi harus dilindungi sebelum penetapan, dan pembutaan harus direncanakan berdasarkan siapa yang dapat memengaruhi rekrutmen, perlakuan, penilaian, atau analisis.",
  "Planning assistant": "Asisten perencanaan",
  "Compare saved sample-size scenarios by base sample size, adjusted sample size, and the assumption set used for planning.": "Bandingkan skenario besar sampel tersimpan berdasarkan besar sampel awal, besar sampel yang disesuaikan, dan asumsi yang digunakan untuk perencanaan.",
  "Scenario comparison": "Perbandingan skenario",
  "Saved assumption sets": "Set asumsi tersimpan",
  "Save scenarios from the calculator catalog to compare assumptions and adjusted sample sizes here.": "Simpan skenario dari katalog kalkulator untuk membandingkan asumsi dan besar sampel yang disesuaikan di sini.",
  "Calculator": "Kalkulator",
  "Base n": "n awal",
  "Adjusted n": "n disesuaikan",
  "Reporting support": "Bantuan pelaporan",
  "Select the study or report type and use the checklist prompts to prepare a more complete manuscript, protocol, or project report.": "Pilih jenis studi atau laporan dan gunakan petunjuk daftar periksa untuk menyiapkan manuskrip, protokol, atau laporan proyek yang lebih lengkap.",
  "EQUATOR decision tree": "Alur keputusan EQUATOR",
  "Find your study design": "Temukan desain studi Anda",
  "Find the reporting checklist": "Temukan daftar periksa pelaporan",
  "Answer the yes/no prompts adapted from the EQUATOR Network decision tree to select the most relevant checklist.": "Jawab pertanyaan ya/tidak yang diadaptasi dari alur keputusan EQUATOR Network untuk memilih daftar periksa yang paling relevan.",
  "Reporting checklist": "Daftar periksa pelaporan",
  "Reporting checklists improve transparency, reduce avoidable omissions, and help readers, reviewers, and editors assess whether the study methods and results are complete enough to interpret and reproduce. They should be used from protocol planning through manuscript submission, not only at the final writing stage.": "Daftar periksa pelaporan meningkatkan transparansi, mengurangi kelalaian yang dapat dihindari, dan membantu pembaca, penelaah, serta editor menilai apakah metode dan hasil studi cukup lengkap untuk ditafsirkan dan direproduksi. Daftar periksa sebaiknya digunakan sejak perencanaan protokol hingga pengiriman manuskrip, bukan hanya pada tahap penulisan akhir.",
  "Answered checklist tree questions": "Pertanyaan alur daftar periksa yang sudah dijawab",
  "Yes": "Ya",
  "No": "Tidak",
  "Suggested checklist": "Daftar periksa yang disarankan",
  "Reset tree": "Atur ulang alur",
  "Reporting checklist helper": "Bantuan daftar periksa pelaporan",
  "Study/report type": "Jenis studi/laporan",
  "Reporting checklist type": "Jenis daftar periksa pelaporan",
  "Open guideline resource": "Buka sumber pedoman",
  "The Method section should at least describe the following:": "Bagian Metode setidaknya harus menjelaskan hal berikut:",
  "Save scenario": "Simpan skenario",
  "Formula": "Rumus",
  "Assumptions": "Asumsi",
  "References": "Referensi",
  "Randomiser summary": "Ringkasan randomisasi",
  "Randomisation slots": "Slot randomisasi",
  "allocation groups": "kelompok alokasi",
  "Blocked": "Blok",
  "Simple": "Sederhana",
  "Balanced shuffled sequence": "Urutan acak yang seimbang",
  "Allocation counts": "Jumlah alokasi",
  "Documentation": "Dokumentasi",
  "Export the PDF before enrolment.": "Ekspor PDF sebelum rekrutmen.",
  "Keep the sequence concealed from recruiters.": "Rahasiakan urutan dari perekrut.",
  "Live result": "Hasil langsung",
  "Required sample size": "Besar sampel yang dibutuhkan",
  "Total before dropout adjustment": "Total sebelum penyesuaian dropout",
  "Adjusted total": "Total disesuaikan",
  "Includes expected dropout or missing data": "Termasuk dropout atau data hilang yang diperkirakan",
  "Planning notes": "Catatan perencanaan",
  "Protocol wording": "Kalimat protokol",
  "Open wording popup": "Buka jendela kalimat",
  "Saved scenarios": "Skenario tersimpan",
  "No saved scenarios yet.": "Belum ada skenario tersimpan.",
  "adjusted": "disesuaikan",
  "Citation": "Kutipan",
  "Close": "Tutup",
  "Close citation dialog": "Tutup dialog kutipan",
  "Copy wording for your protocol": "Salin kalimat untuk protokol Anda",
  "Close protocol wording dialog": "Tutup dialog kalimat protokol",
  "Protocol wording text": "Teks kalimat protokol",
  "Copy wording": "Salin kalimat",
  "Copy citation": "Salin sitasi",
  "Citation copied": "Sitasi disalin",
  "Clear scenarios": "Hapus skenario",
  "Scenarios cleared": "Skenario dihapus",
  "StudySize Studio version 1.23 © Ryalino, 2026.": "StudySize Studio versi 1.23 © Ryalino, 2026.",
  "Scenario saved": "Skenario disimpan",
  "Scenario is ready": "Skenario siap",
  "This scenario is now available in the Scenario Comparison bar, where you can compare it with other saved planning scenarios.": "Skenario ini sekarang tersedia di menu Perbandingan Skenario, tempat Anda dapat membandingkannya dengan skenario perencanaan tersimpan lainnya.",
  "Open Scenario Comparison": "Buka Perbandingan Skenario",
  "Scenario loaded": "Skenario dimuat",
  "PDF downloaded": "PDF diunduh",
  "Randomisation PDF downloaded": "PDF randomisasi diunduh",
  "Randomisation log PDF downloaded": "PDF log randomisasi diunduh",
  "Calculator selected from decision tree": "Kalkulator dipilih dari alur keputusan",
  "Protocol wording copied": "Kalimat protokol disalin",
  "Checklist tree reset": "Alur daftar periksa diatur ulang",
  "All": "Semua",
  "Most used": "Paling sering digunakan",
  "Descriptive": "Deskriptif",
  "Comparative": "Komparatif",
  "Association": "Asosiasi",
  "Diagnostic": "Diagnostik",
  "Epidemiology": "Epidemiologi",
  "Advanced Trials": "Uji klinis lanjutan",
  "Modeling": "Pemodelan",
};

Object.assign(indonesianText, {
  "Prevalence / Single Proportion": "Prevalensi / Proporsi Tunggal",
  "Estimate a population proportion with a target margin of error.": "Memperkirakan proporsi populasi dengan margin kesalahan target.",
  "Expected proportion": "Proporsi yang diharapkan",
  "Best estimate of prevalence.": "Perkiraan prevalensi terbaik.",
  "Margin of error": "Margin kesalahan",
  "Half-width of the confidence interval.": "Setengah lebar interval kepercayaan.",
  "Confidence": "Kepercayaan",
  "Confidence level for the estimate.": "Tingkat kepercayaan untuk estimasi.",
  "Non-response": "Non-respons",
  "Expected missing or unusable records.": "Catatan yang diperkirakan hilang atau tidak dapat digunakan.",
  "Large-sample Wald interval planning.": "Perencanaan interval Wald sampel besar.",
  "Use 50% when prevalence is unknown for a conservative estimate.": "Gunakan 50% bila prevalensi tidak diketahui untuk estimasi konservatif.",
  "Single Mean": "Rerata Tunggal",
  "Estimate a mean with a target margin of error.": "Memperkirakan rerata dengan margin kesalahan target.",
  "Standard deviation": "Simpangan baku",
  "Expected standard deviation.": "Simpangan baku yang diharapkan.",
  "Target half-width in original units.": "Setengah lebar target dalam satuan asli.",
  "Expected missing measurements.": "Pengukuran yang diperkirakan hilang.",
  "Continuous outcome with planning SD supplied from prior data.": "Luaran kontinu dengan SD perencanaan dari data sebelumnya.",
  "Normal approximation for the confidence interval.": "Aproksimasi normal untuk interval kepercayaan.",
  "Two Independent Means": "Dua Rerata Independen",
  "Compare two independent groups on a continuous outcome.": "Membandingkan dua kelompok independen pada luaran kontinu.",
  "Mean difference": "Perbedaan rerata",
  "Smallest difference worth detecting.": "Perbedaan terkecil yang layak dideteksi.",
  "Common SD": "SD bersama",
  "Expected within-group standard deviation.": "Simpangan baku dalam kelompok yang diharapkan.",
  "Allocation ratio": "Rasio alokasi",
  "Treatment participants per control participant.": "Peserta perlakuan per peserta kontrol.",
  "Alpha": "Alfa",
  "Type I error rate.": "Tingkat kesalahan tipe I.",
  "Power": "Power",
  "Chance of detecting the target effect.": "Peluang mendeteksi efek target.",
  "Dropout": "Dropout",
  "Expected unusable or lost participants.": "Peserta yang diperkirakan tidak dapat digunakan atau hilang.",
  "Two-sided test with equal variance approximation.": "Uji dua sisi dengan aproksimasi varians sama.",
  "Normal outcome or sufficiently large samples.": "Luaran normal atau sampel cukup besar.",
  "Paired / Before-After Mean": "Rerata Berpasangan / Sebelum-Sesudah",
  "Detect a mean change in paired measurements.": "Mendeteksi perubahan rerata pada pengukuran berpasangan.",
  "Mean change": "Perubahan rerata",
  "Smallest paired change worth detecting.": "Perubahan berpasangan terkecil yang layak dideteksi.",
  "SD of differences": "SD selisih",
  "Standard deviation of within-person differences.": "Simpangan baku selisih dalam individu.",
  "Continuous paired difference outcome.": "Luaran selisih berpasangan yang kontinu.",
  "Two-sided paired t-test planning approximation.": "Aproksimasi perencanaan uji t berpasangan dua sisi.",
  "Two Independent Proportions": "Dua Proporsi Independen",
  "Compare event risks or response rates between two groups.": "Membandingkan risiko kejadian atau tingkat respons antara dua kelompok.",
  "Control proportion": "Proporsi kontrol",
  "Expected event or response rate in control.": "Tingkat kejadian atau respons yang diharapkan pada kontrol.",
  "Treatment proportion": "Proporsi perlakuan",
  "Expected event or response rate in treatment.": "Tingkat kejadian atau respons yang diharapkan pada perlakuan.",
  "Independent binary outcomes.": "Luaran biner independen.",
  "One Proportion vs Benchmark": "Satu Proporsi vs Tolok Ukur",
  "Test whether a single proportion differs from a fixed benchmark.": "Menguji apakah satu proporsi berbeda dari tolok ukur tetap.",
  "Benchmark": "Tolok ukur",
  "Null or historical proportion.": "Proporsi nol atau historis.",
  "Target proportion": "Proporsi target",
  "Expected true proportion.": "Proporsi sebenarnya yang diharapkan.",
  "One-sample z-test approximation.": "Aproksimasi uji z satu sampel.",
  "Two-sided alternative.": "Alternatif dua sisi.",
  "Correlation": "Korelasi",
  "Detect a non-zero Pearson correlation.": "Mendeteksi korelasi Pearson yang tidak nol.",
  "Expected correlation": "Korelasi yang diharapkan",
  "Smallest correlation worth detecting.": "Korelasi terkecil yang layak dideteksi.",
  "Fisher z transformation.": "Transformasi z Fisher.",
  "Bivariate normal planning approximation.": "Aproksimasi perencanaan normal bivariat.",
  "Diagnostic Sensitivity": "Sensitivitas Diagnostik",
  "Estimate sensitivity with a target confidence interval width.": "Memperkirakan sensitivitas dengan lebar interval kepercayaan target.",
  "Sensitivity": "Sensitivitas",
  "Expected sensitivity among diseased participants.": "Sensitivitas yang diharapkan pada peserta dengan penyakit.",
  "Precision around sensitivity.": "Presisi di sekitar sensitivitas.",
  "Disease prevalence": "Prevalensi penyakit",
  "Expected prevalence in the recruited population.": "Prevalensi yang diharapkan pada populasi yang direkrut.",
  "Confidence level.": "Tingkat kepercayaan.",
  "Non-evaluable": "Tidak dapat dievaluasi",
  "Expected participants without usable index/reference results.": "Peserta yang diperkirakan tidak memiliki hasil indeks/referensi yang dapat digunakan.",
  "Sensitivity estimated among diseased participants.": "Sensitivitas diperkirakan pada peserta dengan penyakit.",
  "Reference standard classification is assumed correct.": "Klasifikasi standar referensi dianggap benar.",
  "Diagnostic Specificity": "Spesifisitas Diagnostik",
  "Estimate specificity with a target confidence interval width.": "Memperkirakan spesifisitas dengan lebar interval kepercayaan target.",
  "Specificity": "Spesifisitas",
  "Expected specificity among non-diseased participants.": "Spesifisitas yang diharapkan pada peserta tanpa penyakit.",
  "Precision around specificity.": "Presisi di sekitar spesifisitas.",
  "Expected unusable test results.": "Hasil tes yang diperkirakan tidak dapat digunakan.",
  "Specificity estimated among non-diseased participants.": "Spesifisitas diperkirakan pada peserta tanpa penyakit.",
  "Cohort / Risk Ratio": "Kohort / Rasio Risiko",
  "Compare exposed and unexposed groups in a cohort study.": "Membandingkan kelompok terpajan dan tidak terpajan dalam studi kohort.",
  "Unexposed risk": "Risiko tidak terpajan",
  "Outcome risk among unexposed participants.": "Risiko luaran pada peserta tidak terpajan.",
  "Risk ratio": "Rasio risiko",
  "Target exposed/unexposed risk ratio.": "Rasio risiko terpajan/tidak terpajan target.",
  "Exposed:unexposed": "Terpajan:tidak terpajan",
  "Exposed participants per unexposed participant.": "Peserta terpajan per peserta tidak terpajan.",
  "Independent exposed and unexposed groups.": "Kelompok terpajan dan tidak terpajan independen.",
  "Approximate two-sided test for risk difference implied by the target RR.": "Uji dua sisi aproksimasi untuk perbedaan risiko yang tersirat oleh RR target.",
  "Case-Control / Odds Ratio": "Kasus-Kontrol / Odds Ratio",
  "Detect an odds ratio using expected control exposure prevalence.": "Mendeteksi odds ratio menggunakan prevalensi pajanan kontrol yang diharapkan.",
  "Control exposure": "Pajanan kontrol",
  "Exposure prevalence among controls.": "Prevalensi pajanan pada kontrol.",
  "Odds ratio": "Odds ratio",
  "Target odds ratio.": "Odds ratio target.",
  "Controls per case": "Kontrol per kasus",
  "Number of controls for each case.": "Jumlah kontrol untuk setiap kasus.",
  "Unmatched case-control design.": "Desain kasus-kontrol tidak berpasangan.",
  "Exposure is binary and measured independently.": "Pajanan bersifat biner dan diukur secara independen.",
  "Non-Inferiority Mean": "Rerata Non-Inferioritas",
  "Compare a mean outcome against a non-inferiority margin.": "Membandingkan luaran rerata terhadap margin non-inferioritas.",
  "NI margin": "Margin NI",
  "Largest acceptable loss in original units.": "Kehilangan terbesar yang masih dapat diterima dalam satuan asli.",
  "Experimental participants per control participant.": "Peserta eksperimental per peserta kontrol.",
  "One-sided non-inferiority framework.": "Kerangka non-inferioritas satu sisi.",
  "True difference is planned as zero unless a stricter effect is specified externally.": "Perbedaan sebenarnya direncanakan nol kecuali efek yang lebih ketat ditentukan secara eksternal.",
  "Equivalence Mean": "Rerata Ekivalensi",
  "Plan a two one-sided tests equivalence study for a mean outcome.": "Merencanakan studi ekivalensi dua uji satu sisi untuk luaran rerata.",
  "Equivalence margin": "Margin ekivalensi",
  "Symmetric acceptable difference.": "Perbedaan simetris yang dapat diterima.",
  "Group B participants per group A participant.": "Peserta kelompok B per peserta kelompok A.",
  "Two one-sided tests approximation.": "Aproksimasi dua uji satu sisi.",
  "True mean difference planned at zero.": "Perbedaan rerata sebenarnya direncanakan nol.",
  "Cluster Randomized Trial": "Uji Acak Klaster",
  "Adjust an individual-level comparison for clustering.": "Menyesuaikan perbandingan tingkat individu untuk pengelompokan.",
  "Intervention proportion": "Proporsi intervensi",
  "Intervention event or response rate.": "Tingkat kejadian atau respons intervensi.",
  "Cluster size": "Ukuran klaster",
  "Average participants per cluster.": "Rata-rata peserta per klaster.",
  "Intracluster correlation coefficient.": "Koefisien korelasi intraklaster.",
  "Equal cluster sizes approximation.": "Aproksimasi ukuran klaster sama.",
  "Binary endpoint with two-arm cluster allocation.": "Endpoint biner dengan alokasi klaster dua lengan.",
  "Survival / Time-to-Event": "Survival / Waktu-ke-Kejadian",
  "Estimate required events and participants for a log-rank comparison.": "Memperkirakan jumlah kejadian dan peserta untuk perbandingan log-rank.",
  "Hazard ratio": "Hazard ratio",
  "Target hazard ratio for treatment vs control.": "Hazard ratio target untuk perlakuan vs kontrol.",
  "Overall event rate": "Tingkat kejadian keseluruhan",
  "Expected proportion with observed events by analysis.": "Proporsi yang diharapkan mengalami kejadian teramati saat analisis.",
  "Proportional hazards.": "Hazard proporsional.",
  "Log-rank test with approximately uniform information accrual.": "Uji log-rank dengan akrual informasi yang kira-kira seragam.",
  "Multiple Linear Regression": "Regresi Linear Berganda",
  "Plan for detecting model R² using Cohen's f² effect size.": "Merencanakan deteksi R² model menggunakan ukuran efek f² Cohen.",
  "Effect size f²": "Ukuran efek f²",
  "Small=.02, medium=.15, large=.35.": "Kecil=.02, sedang=.15, besar=.35.",
  "Predictors": "Prediktor",
  "Number of tested predictors.": "Jumlah prediktor yang diuji.",
  "Planning approximation for omnibus regression signal.": "Aproksimasi perencanaan untuk sinyal regresi omnibus.",
  "Use simulation for complex predictor distributions.": "Gunakan simulasi untuk distribusi prediktor yang kompleks.",
  "Logistic Regression Events": "Kejadian Regresi Logistik",
  "Plan minimum events for a multivariable logistic model.": "Merencanakan kejadian minimum untuk model logistik multivariabel.",
  "Events per predictor": "Kejadian per prediktor",
  "Conservative modeling target.": "Target pemodelan konservatif.",
  "Outcome event rate": "Tingkat kejadian luaran",
  "Expected outcome prevalence.": "Prevalensi luaran yang diharapkan.",
  "Missing data": "Data hilang",
  "Expected incomplete records.": "Catatan tidak lengkap yang diperkirakan.",
  "Rule-of-thumb planning for model stability.": "Perencanaan aturan praktis untuk stabilitas model.",
  "Prefer Riley/van Smeden style calculations for final prediction model protocols.": "Utamakan perhitungan gaya Riley/van Smeden untuk protokol model prediksi final.",
});

Object.assign(indonesianText, {
  "What is the main purpose of the study?": "Apa tujuan utama studi?",
  "Choose the analysis goal that best matches the primary objective.": "Pilih tujuan analisis yang paling sesuai dengan objektif utama.",
  "Estimate one quantity": "Memperkirakan satu besaran",
  "Prevalence, rate, proportion, or mean with a target precision.": "Prevalensi, angka, proporsi, atau rerata dengan presisi target.",
  "Compare groups": "Membandingkan kelompok",
  "Treatment vs control, exposed vs unexposed, or before vs after.": "Perlakuan vs kontrol, terpajan vs tidak terpajan, atau sebelum vs sesudah.",
  "Study association": "Mempelajari asosiasi",
  "Correlation, risk ratio, odds ratio, or hazard ratio.": "Korelasi, rasio risiko, odds ratio, atau hazard ratio.",
  "Diagnostic accuracy": "Akurasi diagnostik",
  "Sensitivity or specificity of a test against a reference standard.": "Sensitivitas atau spesifisitas tes terhadap standar referensi.",
  "Prediction/modeling": "Prediksi/pemodelan",
  "Regression or prediction model sample size planning.": "Perencanaan besar sampel untuk regresi atau model prediksi.",
  "What are you estimating?": "Apa yang Anda estimasi?",
  "This determines whether the app plans around a proportion or a continuous mean.": "Ini menentukan apakah aplikasi merencanakan berdasarkan proporsi atau rerata kontinu.",
  "Proportion or prevalence": "Proporsi atau prevalensi",
  "A percentage such as prevalence, response, positivity, or coverage.": "Persentase seperti prevalensi, respons, positivitas, atau cakupan.",
  "Mean value": "Nilai rerata",
  "A continuous measurement such as score, blood pressure, or biomarker level.": "Pengukuran kontinu seperti skor, tekanan darah, atau kadar biomarker.",
  "What type of primary outcome are you comparing?": "Jenis luaran utama apa yang dibandingkan?",
  "Pick the outcome scale used for the primary sample size calculation.": "Pilih skala luaran yang digunakan untuk perhitungan besar sampel utama.",
  "Binary": "Biner",
  "Event/no event, response/no response, disease/no disease.": "Kejadian/tidak, respons/tidak, penyakit/tidak.",
  "Continuous": "Kontinu",
  "A numeric measurement summarized by means and standard deviations.": "Pengukuran numerik yang diringkas dengan rerata dan simpangan baku.",
  "Time-to-event": "Waktu-ke-kejadian",
  "Time until event, censoring, hazard ratio, or log-rank comparison.": "Waktu hingga kejadian, sensor, hazard ratio, atau perbandingan log-rank.",
  "How are the observations arranged?": "Bagaimana observasi disusun?",
  "This helps separate independent, paired, clustered, and benchmark comparisons.": "Ini membantu membedakan perbandingan independen, berpasangan, berklaster, dan tolok ukur.",
  "Two independent groups": "Dua kelompok independen",
  "Different people in each group.": "Orang berbeda di setiap kelompok.",
  "Paired or before-after": "Berpasangan atau sebelum-sesudah",
  "Same people measured twice or matched pairs.": "Orang yang sama diukur dua kali atau pasangan yang dicocokkan.",
  "Clustered groups": "Kelompok berklaster",
  "People are nested in clinics, schools, wards, practices, or communities.": "Orang berada dalam klinik, sekolah, bangsal, praktik, atau komunitas.",
  "One group vs benchmark": "Satu kelompok vs tolok ukur",
  "A single group compared with a fixed historical or target value.": "Satu kelompok dibandingkan dengan nilai historis atau target tetap.",
  "What best describes the group comparison?": "Apa yang paling menggambarkan perbandingan kelompok?",
  "Use the design as planned, not necessarily the later statistical model.": "Gunakan desain yang direncanakan, bukan harus model statistik akhirnya.",
  "Trial or experiment": "Uji coba atau eksperimen",
  "Groups are assigned by protocol or intervention.": "Kelompok ditetapkan oleh protokol atau intervensi.",
  "Cohort/exposure groups": "Kelompok kohort/pajanan",
  "Exposed and unexposed groups are followed for outcome risk.": "Kelompok terpajan dan tidak terpajan diikuti untuk risiko luaran.",
  "Case-control": "Kasus-kontrol",
  "Participants are sampled by outcome status, then exposure is compared.": "Peserta diambil berdasarkan status luaran, lalu pajanan dibandingkan.",
  "What is the trial objective?": "Apa tujuan uji klinis?",
  "Most studies are superiority; choose non-inferiority or equivalence only when that is the protocol objective.": "Sebagian besar studi bersifat superiority; pilih non-inferioritas atau ekivalensi hanya bila itu objektif protokol.",
  "Superiority": "Superiority",
  "Show one group differs from or is better than another.": "Menunjukkan satu kelompok berbeda dari atau lebih baik daripada kelompok lain.",
  "Non-inferiority": "Non-inferioritas",
  "Show a new approach is not unacceptably worse.": "Menunjukkan pendekatan baru tidak lebih buruk secara tidak dapat diterima.",
  "Equivalence": "Ekivalensi",
  "Show groups are similar within a symmetric margin.": "Menunjukkan kelompok serupa dalam margin simetris.",
  "What association measure best matches your question?": "Ukuran asosiasi apa yang paling sesuai dengan pertanyaan Anda?",
  "When in doubt, choose the measure named in the protocol or primary paper objective.": "Jika ragu, pilih ukuran yang disebut dalam protokol atau objektif utama artikel.",
  "Outcome risk compared between exposed and unexposed groups.": "Risiko luaran dibandingkan antara kelompok terpajan dan tidak terpajan.",
  "Exposure odds compared between cases and controls.": "Odds pajanan dibandingkan antara kasus dan kontrol.",
  "Time-to-event association or survival comparison.": "Asosiasi waktu-ke-kejadian atau perbandingan survival.",
  "Which diagnostic accuracy target is primary?": "Target akurasi diagnostik mana yang utama?",
  "If both sensitivity and specificity are co-primary, calculate both and use the larger total.": "Jika sensitivitas dan spesifisitas sama-sama primer, hitung keduanya dan gunakan total yang lebih besar.",
  "Precision among participants who truly have the condition.": "Presisi pada peserta yang benar-benar memiliki kondisi.",
  "Precision among participants who truly do not have the condition.": "Presisi pada peserta yang benar-benar tidak memiliki kondisi.",
  "What kind of model are you planning?": "Model seperti apa yang Anda rencanakan?",
  "These are pragmatic planning tools; final prediction model protocols often need specialist methods.": "Ini adalah alat perencanaan pragmatis; protokol model prediksi final sering memerlukan metode khusus.",
  "Linear regression": "Regresi linear",
  "Continuous outcome with predictors.": "Luaran kontinu dengan prediktor.",
  "Logistic regression": "Regresi logistik",
  "Binary outcome or event/no-event model.": "Luaran biner atau model kejadian/tidak.",
  "Does the design include advanced features?": "Apakah desain mencakup fitur lanjutan?",
  "Examples: adaptive design, repeated longitudinal outcomes, rare events, competing risks, complex survey sampling, Bayesian design, dose finding, mediation, or more than two arms.": "Contoh: desain adaptif, luaran longitudinal berulang, kejadian jarang, risiko bersaing, sampling survei kompleks, desain Bayesian, pencarian dosis, mediasi, atau lebih dari dua lengan.",
  "A standard design is a reasonable starting point.": "Desain standar adalah titik awal yang masuk akal.",
  "Use the recommendation as a starting point and request statistical review.": "Gunakan rekomendasi sebagai titik awal dan minta tinjauan statistik.",
  "Use Single Mean": "Gunakan Rerata Tunggal",
  "You are estimating one continuous quantity with target precision, so the planning driver is SD and margin of error.": "Anda memperkirakan satu besaran kontinu dengan presisi target, sehingga penggerak perencanaan adalah SD dan margin kesalahan.",
  "Primary goal is estimation rather than a hypothesis test.": "Tujuan utama adalah estimasi, bukan uji hipotesis.",
  "Use Prevalence / Single Proportion": "Gunakan Prevalensi / Proporsi Tunggal",
  "You are estimating one percentage or prevalence with target precision, so the proportion CI formula is the right starting point.": "Anda memperkirakan satu persentase atau prevalensi dengan presisi target, sehingga rumus CI proporsi adalah titik awal yang tepat.",
  "Binary or proportion outcome.": "Luaran biner atau proporsi.",
  "Primary goal is confidence interval precision.": "Tujuan utama adalah presisi interval kepercayaan.",
  "Use Diagnostic Specificity": "Gunakan Spesifisitas Diagnostik",
  "Specificity is estimated among people without the condition, then inflated by the expected non-disease fraction.": "Spesifisitas diperkirakan pada orang tanpa kondisi, lalu dinaikkan berdasarkan fraksi tanpa penyakit yang diharapkan.",
  "Reference standard is available.": "Standar referensi tersedia.",
  "Specificity is the primary accuracy target.": "Spesifisitas adalah target akurasi utama.",
  "Use Diagnostic Sensitivity": "Gunakan Sensitivitas Diagnostik",
  "Sensitivity is estimated among people with the condition, then inflated by the expected prevalence.": "Sensitivitas diperkirakan pada orang dengan kondisi, lalu dinaikkan berdasarkan prevalensi yang diharapkan.",
  "Sensitivity is the primary accuracy target.": "Sensitivitas adalah target akurasi utama.",
  "Use Multiple Linear Regression": "Gunakan Regresi Linear Berganda",
  "The planned outcome is continuous, so the regression calculator uses predictors and Cohen's f2 effect size.": "Luaran yang direncanakan kontinu, sehingga kalkulator regresi menggunakan prediktor dan ukuran efek f2 Cohen.",
  "Approximate omnibus model planning.": "Perencanaan model omnibus aproksimasi.",
  "Use Logistic Regression Events": "Gunakan Kejadian Regresi Logistik",
  "The planned outcome is binary, so sample size is driven by expected events and model degrees of freedom.": "Luaran yang direncanakan biner, sehingga besar sampel ditentukan oleh kejadian yang diharapkan dan derajat kebebasan model.",
  "Event rate estimate is available.": "Estimasi tingkat kejadian tersedia.",
  "Saved scenario comparison": "Perbandingan skenario tersimpan",
  "Randomisation allocation table": "Tabel alokasi randomisasi",
  "All participants": "Semua peserta",
  "Use Correlation": "Gunakan Korelasi",
  "The question is about association between two continuous variables measured on the same participants.": "Pertanyaannya tentang asosiasi antara dua variabel kontinu yang diukur pada peserta yang sama.",
  "Pearson correlation is the target measure.": "Korelasi Pearson adalah ukuran target.",
  "No group allocation is being compared.": "Tidak ada alokasi kelompok yang dibandingkan.",
  "Use Cohort / Risk Ratio": "Gunakan Kohort / Rasio Risiko",
  "The study compares outcome risk between exposed and unexposed groups.": "Studi membandingkan risiko luaran antara kelompok terpajan dan tidak terpajan.",
  "Exposure groups are observed or assembled before outcome assessment.": "Kelompok pajanan diamati atau dibentuk sebelum penilaian luaran.",
  "Risk ratio is the primary effect measure.": "Rasio risiko adalah ukuran efek utama.",
  "Use Case-Control / Odds Ratio": "Gunakan Kasus-Kontrol / Odds Ratio",
  "The study samples cases and controls, then compares exposure odds.": "Studi mengambil sampel kasus dan kontrol, lalu membandingkan odds pajanan.",
  "Control exposure prevalence can be estimated.": "Prevalensi pajanan kontrol dapat diperkirakan.",
  "Use Survival / Time-to-Event": "Gunakan Survival / Waktu-ke-Kejadian",
  "The target association is a hazard ratio, so planning is driven by required events.": "Asosiasi target adalah hazard ratio, sehingga perencanaan ditentukan oleh jumlah kejadian yang dibutuhkan.",
  "Expected event rate by analysis is available.": "Tingkat kejadian yang diharapkan saat analisis tersedia.",
  "The primary comparison uses time until event, so the log-rank/event-based calculator is the correct starting point.": "Perbandingan utama menggunakan waktu hingga kejadian, sehingga kalkulator berbasis log-rank/kejadian adalah titik awal yang tepat.",
  "Use Cluster Randomized Trial": "Gunakan Uji Acak Klaster",
  "Participants are nested within clusters, so the individual-level sample size needs a design-effect adjustment.": "Peserta berada dalam klaster, sehingga besar sampel tingkat individu memerlukan penyesuaian efek desain.",
  "Average cluster size and ICC can be estimated.": "Ukuran klaster rata-rata dan ICC dapat diperkirakan.",
  "Cluster sizes are not extremely unequal.": "Ukuran klaster tidak sangat tidak seimbang.",
  "Cluster studies are sensitive to ICC assumptions; run sensitivity scenarios.": "Studi klaster sensitif terhadap asumsi ICC; jalankan skenario sensitivitas.",
  "Use Paired / Before-After Mean": "Gunakan Rerata Berpasangan / Sebelum-Sesudah",
  "The same participants or matched pairs contribute paired continuous measurements.": "Peserta yang sama atau pasangan yang dicocokkan memberikan pengukuran kontinu berpasangan.",
  "Paired differences are the primary outcome.": "Selisih berpasangan adalah luaran utama.",
  "SD of differences can be estimated.": "SD selisih dapat diperkirakan.",
  "Start With Two Independent Proportions": "Mulai dengan Dua Proporsi Independen",
  "The current app does not yet include a paired binary formula, so this is only a conservative orientation point.": "Aplikasi ini belum menyertakan rumus biner berpasangan, sehingga ini hanya titik orientasi konservatif.",
  "Pairing/matching should be handled in a specialist calculation.": "Pemasangan/pencocokan sebaiknya ditangani dalam perhitungan khusus.",
  "Paired binary outcomes usually need McNemar or matched-pair methods; request statistical review.": "Luaran biner berpasangan biasanya memerlukan metode McNemar atau pasangan cocok; minta tinjauan statistik.",
  "Use One Proportion vs Benchmark": "Gunakan Satu Proporsi vs Tolok Ukur",
  "A single binary proportion is being tested against a fixed historical or target value.": "Satu proporsi biner diuji terhadap nilai historis atau target tetap.",
  "Benchmark is fixed.": "Tolok ukur bersifat tetap.",
  "One sample contributes the new proportion.": "Satu sampel memberikan proporsi baru.",
  "Start With Single Mean": "Mulai dengan Rerata Tunggal",
  "The current app estimates one mean precisely; testing a single mean against a benchmark can be added as a dedicated calculator.": "Aplikasi ini memperkirakan satu rerata secara presisi; pengujian satu rerata terhadap tolok ukur dapat ditambahkan sebagai kalkulator khusus.",
  "Benchmark is fixed.": "Tolok ukur bersifat tetap.",
  "For a formal one-sample mean hypothesis test, confirm the exact formula before protocol use.": "Untuk uji hipotesis rerata satu sampel formal, konfirmasi rumus yang tepat sebelum digunakan dalam protokol.",
  "Use Two Independent Proportions": "Gunakan Dua Proporsi Independen",
  "Two independent groups are being compared on a binary event or response rate.": "Dua kelompok independen dibandingkan pada kejadian biner atau tingkat respons.",
  "Superiority comparison by default.": "Perbandingan superiority secara default.",
  "Use Non-Inferiority Mean": "Gunakan Rerata Non-Inferioritas",
  "The study is designed to rule out an unacceptable loss on a continuous endpoint.": "Studi dirancang untuk menyingkirkan kerugian yang tidak dapat diterima pada endpoint kontinu.",
  "One-sided non-inferiority margin is clinically justified.": "Margin non-inferioritas satu sisi dibenarkan secara klinis.",
  "Use Equivalence Mean": "Gunakan Rerata Ekivalensi",
  "The study is designed to show the mean difference lies within a symmetric equivalence margin.": "Studi dirancang untuk menunjukkan perbedaan rerata berada dalam margin ekivalensi simetris.",
  "Two one-sided tests framework.": "Kerangka dua uji satu sisi.",
  "Use Two Independent Means": "Gunakan Dua Rerata Independen",
  "Two independent groups are being compared on a continuous outcome under a superiority objective.": "Dua kelompok independen dibandingkan pada luaran kontinu dengan objektif superiority.",
  "Independent groups.": "Kelompok independen.",
  "Common SD can be estimated.": "SD bersama dapat diperkirakan.",
  "Advanced design features can make closed-form sample size formulas misleading. Use this calculator as orientation, then get statistical review.": "Fitur desain lanjutan dapat membuat rumus besar sampel bentuk tertutup menyesatkan. Gunakan kalkulator ini sebagai orientasi, lalu dapatkan tinjauan statistik.",
  "For clinical prediction model development, consider minimum sample size methods beyond simple rules.": "Untuk pengembangan model prediksi klinis, pertimbangkan metode besar sampel minimum di luar aturan sederhana.",
  "For final prediction model protocols, consider Riley-style minimum sample size methods.": "Untuk protokol model prediksi final, pertimbangkan metode besar sampel minimum gaya Riley.",
});

Object.assign(indonesianText, {
  "Randomised trial": "Uji acak",
  "CONSORT for trial reports; SPIRIT for trial protocols.": "CONSORT untuk laporan uji; SPIRIT untuk protokol uji.",
  "Observational study": "Studi observasional",
  "STROBE for cohort, case-control, and cross-sectional studies.": "STROBE untuk studi kohort, kasus-kontrol, dan potong lintang.",
  "Systematic review": "Tinjauan sistematis",
  "PRISMA for systematic reviews and meta-analyses.": "PRISMA untuk tinjauan sistematis dan meta-analisis.",
  "Diagnostic/prognostic accuracy": "Akurasi diagnostik/prognostik",
  "STARD for diagnostic accuracy; TRIPOD for prediction models.": "STARD untuk akurasi diagnostik; TRIPOD untuk model prediksi.",
  "Study protocol": "Protokol studi",
  "SPIRIT for clinical trial protocols; PRISMA-P for review protocols.": "SPIRIT untuk protokol uji klinis; PRISMA-P untuk protokol tinjauan.",
  "Case report": "Laporan kasus",
  "CARE for clinical case reports.": "CARE untuk laporan kasus klinis.",
  "Qualitative research": "Penelitian kualitatif",
  "COREQ or SRQR for qualitative studies.": "COREQ atau SRQR untuk studi kualitatif.",
  "Quality improvement": "Peningkatan mutu",
  "SQUIRE for healthcare improvement studies.": "SQUIRE untuk studi peningkatan layanan kesehatan.",
  "Economic evaluation": "Evaluasi ekonomi",
  "CHEERS for health economic evaluations.": "CHEERS untuk evaluasi ekonomi kesehatan.",
  "Prediction model": "Model prediksi",
  "TRIPOD for prediction model development and validation.": "TRIPOD untuk pengembangan dan validasi model prediksi.",
  "Animal research / ARRIVE": "Penelitian hewan / ARRIVE",
  "Animal research": "Penelitian hewan",
  "ARRIVE for in vivo animal experiments.": "ARRIVE untuk eksperimen in vivo pada hewan.",
  "Qualitative evidence synthesis / ENTREQ": "Sintesis bukti kualitatif / ENTREQ",
  "Qualitative evidence synthesis": "Sintesis bukti kualitatif",
  "ENTREQ for syntheses of qualitative research.": "ENTREQ untuk sintesis penelitian kualitatif.",
  "Qualitative research / SRQR": "Penelitian kualitatif / SRQR",
  "SRQR for qualitative research reports.": "SRQR untuk laporan penelitian kualitatif.",
  "Diagnostic accuracy / STARD": "Akurasi diagnostik / STARD",
  "Diagnostic accuracy study": "Studi akurasi diagnostik",
  "STARD for diagnostic accuracy studies.": "STARD untuk studi akurasi diagnostik.",
  "Prognostic marker / REMARK": "Penanda prognostik / REMARK",
  "Prognostic tumour marker study": "Studi penanda tumor prognostik",
  "REMARK for tumour marker prognostic studies.": "REMARK untuk studi prognostik penanda tumor.",
  "Observational meta-analysis / MOOSE": "Meta-analisis observasional / MOOSE",
  "Meta-analysis of observational studies": "Meta-analisis studi observasional",
  "MOOSE for meta-analyses of observational studies.": "MOOSE untuk meta-analisis studi observasional.",
  "Search EQUATOR library": "Cari pustaka EQUATOR",
  "No single common checklist was identified; search the EQUATOR library for a design-specific checklist.": "Tidak ada satu daftar periksa umum yang teridentifikasi; cari pustaka EQUATOR untuk daftar periksa spesifik desain.",
  "Trial design and allocation ratio": "Desain uji dan rasio alokasi",
  "Eligibility criteria and settings": "Kriteria kelayakan dan tempat penelitian",
  "Interventions with enough detail to replicate": "Intervensi dengan detail yang cukup untuk direplikasi",
  "Sequence generation and allocation concealment": "Pembuatan urutan dan penyembunyian alokasi",
  "Blinding and outcome assessment": "Pembutaan dan penilaian luaran",
  "Primary/secondary outcomes": "Luaran primer/sekunder",
  "Sample size justification": "Justifikasi besar sampel",
  "Participant flow": "Alur peserta",
  "Harms and protocol deviations": "Efek merugikan dan deviasi protokol",
  "Study design in title/abstract": "Desain studi dalam judul/abstrak",
  "Setting and dates": "Tempat dan tanggal",
  "Participants and eligibility": "Peserta dan kelayakan",
  "Variables and data sources": "Variabel dan sumber data",
  "Bias handling": "Penanganan bias",
  "Study size rationale": "Rasional ukuran studi",
  "Statistical methods": "Metode statistik",
  "Descriptive data and missing data": "Data deskriptif dan data hilang",
  "Limitations and generalisability": "Keterbatasan dan generalisasi",
  "Protocol registration": "Registrasi protokol",
  "Eligibility criteria": "Kriteria kelayakan",
  "Information sources and search strategy": "Sumber informasi dan strategi pencarian",
  "Selection process": "Proses seleksi",
  "Data collection process": "Proses pengumpulan data",
  "Risk of bias assessment": "Penilaian risiko bias",
  "Synthesis methods": "Metode sintesis",
  "Study selection flow": "Alur seleksi studi",
  "Certainty of evidence": "Kepastian bukti",
  "Clinical role of the index test": "Peran klinis tes indeks",
  "Reference standard": "Standar referensi",
  "Participant sampling": "Pengambilan sampel peserta",
  "Eligibility and setting": "Kelayakan dan tempat",
  "Blinding between index and reference tests": "Pembutaan antara tes indeks dan referensi",
  "Indeterminate/missing results": "Hasil tidak pasti/hilang",
  "Accuracy estimates with precision": "Estimasi akurasi dengan presisi",
  "Model specification when prediction is involved": "Spesifikasi model bila prediksi terlibat",
  "Define the randomisation unit before generating the sequence: individual participant, cluster, eye, lesion, or another unit.": "Tentukan unit randomisasi sebelum membuat urutan: peserta individu, klaster, mata, lesi, atau unit lain.",
  "Generate the allocation sequence before enrolment using a documented method, seed, date, study title, groups, and allocation ratio.": "Buat urutan alokasi sebelum rekrutmen menggunakan metode, seed, tanggal, judul studi, kelompok, dan rasio alokasi yang terdokumentasi.",
  "Keep the sequence concealed from recruiters and outcome assessors whenever possible. Use a central randomisation service, pharmacy, database, or sequentially numbered opaque sealed envelopes.": "Rahasiakan urutan dari perekrut dan penilai luaran bila memungkinkan. Gunakan layanan randomisasi terpusat, farmasi, basis data, atau amplop buram tertutup bernomor berurutan.",
  "Randomise only after eligibility is confirmed and informed consent is complete.": "Lakukan randomisasi hanya setelah kelayakan dikonfirmasi dan persetujuan tindakan selesai.",
  "Use blocked randomisation when balance over time matters; keep block sizes confidential and consider variable block sizes for open-label trials.": "Gunakan randomisasi blok bila keseimbangan dari waktu ke waktu penting; rahasiakan ukuran blok dan pertimbangkan ukuran blok bervariasi untuk uji label terbuka.",
  "Use stratified randomisation when key prognostic variables must be balanced, but avoid too many strata for the sample size.": "Gunakan randomisasi berstrata bila variabel prognostik utama harus seimbang, tetapi hindari terlalu banyak strata untuk besar sampel.",
  "Do not replace, skip, or reassign allocations after the sequence is generated. Record withdrawals and protocol deviations separately.": "Jangan mengganti, melewati, atau menetapkan ulang alokasi setelah urutan dibuat. Catat pengunduran diri dan deviasi protokol secara terpisah.",
  "Preserve an audit trail: who generated the list, who held it, who assigned participants, timestamps, and any emergency unblinding.": "Simpan jejak audit: siapa yang membuat daftar, siapa yang menyimpannya, siapa yang menetapkan peserta, cap waktu, dan pembukaan pembutaan darurat apa pun.",
  "Report the sequence generation method, allocation concealment mechanism, and implementation roles in the protocol and manuscript.": "Laporkan metode pembuatan urutan, mekanisme penyembunyian alokasi, dan peran implementasi dalam protokol dan manuskrip.",
  "Decide who must be blinded: participants, clinicians, outcome assessors, data analysts, or adjudication committee.": "Tentukan siapa yang harus dibutakan: peserta, klinisi, penilai luaran, analis data, atau komite adjudikasi.",
  "Separate roles so the person generating the sequence is not the person recruiting participants.": "Pisahkan peran agar orang yang membuat urutan bukan orang yang merekrut peserta.",
  "Use allocation concealment until assignment: central randomisation, pharmacy-controlled allocation, secure database release, or sequentially numbered opaque sealed envelopes.": "Gunakan penyembunyian alokasi hingga penetapan: randomisasi terpusat, alokasi yang dikendalikan farmasi, rilis basis data aman, atau amplop buram tertutup bernomor berurutan.",
  "For sealed envelopes, use tamper-evident opaque envelopes, identical size and weight, sequential numbering, signatures across seals, and a log of opening date/time.": "Untuk amplop tertutup, gunakan amplop buram anti-rusak, ukuran dan berat identik, penomoran berurutan, tanda tangan melintasi segel, dan log tanggal/waktu pembukaan.",
  "Document emergency unblinding criteria before recruitment starts and keep every unblinding event in the audit file.": "Dokumentasikan kriteria pembukaan pembutaan darurat sebelum rekrutmen dimulai dan simpan setiap kejadian pembukaan pembutaan dalam file audit.",
  "For open-label studies, blind outcome assessment and data analysis when possible.": "Untuk studi label terbuka, butakan penilaian luaran dan analisis data bila memungkinkan.",
  "Was the research on humans?": "Apakah penelitian dilakukan pada manusia?",
  "Was your research on animals in the lab?": "Apakah penelitian Anda dilakukan pada hewan di laboratorium?",
  "Did your research generate quantitative data?": "Apakah penelitian Anda menghasilkan data kuantitatif?",
  "Did you pool the results of previous studies in a review?": "Apakah Anda menggabungkan hasil studi sebelumnya dalam sebuah tinjauan?",
  "Did you combine and analyse the results of previous studies?": "Apakah Anda menggabungkan dan menganalisis hasil studi sebelumnya?",
  "Is it a review of observational cohort, case-control, or cross-sectional studies?": "Apakah ini tinjauan studi kohort observasional, kasus-kontrol, atau potong lintang?",
  "Was your study a randomized trial comparing two or more health interventions?": "Apakah studi Anda uji acak yang membandingkan dua atau lebih intervensi kesehatan?",
  "Do you describe a clinical case or a series of cases?": "Apakah Anda mendeskripsikan kasus klinis atau seri kasus?",
  "Did your study explore the relationship between exposure to risk or protective factors and outcomes?": "Apakah studi Anda mengeksplorasi hubungan antara pajanan terhadap faktor risiko atau protektif dan luaran?",
  "Did you compare the accuracy of a new or alternative diagnostic test against an established reference standard?": "Apakah Anda membandingkan akurasi tes diagnostik baru atau alternatif terhadap standar referensi yang sudah mapan?",
  "Did the study evaluate the prognostic value of one or more biomarkers?": "Apakah studi mengevaluasi nilai prognostik satu atau lebih biomarker?",
  "Did the research develop, validate, or update a general prediction model for diagnosis or prognosis?": "Apakah penelitian mengembangkan, memvalidasi, atau memperbarui model prediksi umum untuk diagnosis atau prognosis?",
});

function t(text: string, language: Language) {
  if (language === "id") return indonesianText[text] ?? text;
  if (language === "nl") return dutchText[text] ?? text;
  return text;
}

const dutchText: Record<string, string> = {
  "Language selector": "Taalkiezer",
  "Sample size calculators": "Steekproefgrootte-calculators",
  "Your one-stop solution for medical research": "Uw alles-in-een oplossing voor medisch onderzoek",
  "How to cite us": "Hoe citeert u ons",
  "Your one-stop solution for research preparation.": "Uw alles-in-een oplossing voor onderzoeksvoorbereiding.",
  "Catalog summary": "Catalogusoverzicht",
  "designs": "ontwerpen",
  "families": "families",
  "Guided": "Begeleide",
  "tree": "beslisboom",
  "Main app modes": "Hoofdmodi van de app",
  "Find my calculator": "Vind mijn calculator",
  "Calculator catalog": "Calculatorcatalogus",
  "Randomiser": "Randomisator",
  "Scenario Comparison": "Scenariovergelijking",
  "Study Design": "Studiedesign",
  "Reporting Checklist Helper": "Hulp bij rapportagechecklists",
  "Study design catalog": "Catalogus met studiedesigns",
  "Filter study designs": "Filter studiedesigns",
  "Decision support": "Beslisondersteuning",
  "Answer a few study-design questions and the app will suggest the closest calculator, explain why, and flag when statistical review is important.": "Beantwoord enkele vragen over het studiedesign; de app stelt de best passende calculator voor, legt uit waarom en geeft aan wanneer statistische beoordeling belangrijk is.",
  "Back": "Terug",
  "Reset": "Opnieuw",
  "Question": "Vraag",
  "Recommendation": "Aanbeveling",
  "Assumptions to check": "Te controleren aannames",
  "Warning flags": "Waarschuwingen",
  "No major warning flags based on these answers.": "Geen grote waarschuwingen op basis van deze antwoorden.",
  "Use this calculator": "Gebruik deze calculator",
  "Decision path": "Beslispad",
  "No answers yet.": "Nog geen antwoorden.",
  "Allocation sequence": "Allocatiereeks",
  "Subject randomiser": "Deelnemer-randomisator",
  "Generate a documented allocation sequence for standard individual randomisation, then export the settings, sequence, and best-practice notes as a PDF.": "Genereer een gedocumenteerde allocatiereeks voor standaard individuele randomisatie en exporteer instellingen, reeks en best-practice-notities als PDF.",
  "Download PDF": "PDF downloaden",
  "Log template PDF": "Logsjabloon PDF",
  "Randomiser settings": "Randomisatie-instellingen",
  "Number of subjects": "Aantal deelnemers",
  "Total number of randomisation slots to generate.": "Totaal aantal te genereren randomisatieslots.",
  "Number of subjects slider": "Schuifregelaar aantal deelnemers",
  "Groups": "Groepen",
  "Separate treatment arms with commas or line breaks.": "Scheid behandelarmen met komma's of regeleinden.",
  "Randomisation groups": "Randomisatiegroepen",
  "Strata": "Strata",
  "Optional. Separate sites or prognostic strata with commas or line breaks.": "Optioneel. Scheid centra of prognostische strata met komma's of regeleinden.",
  "Randomisation strata": "Randomisatiestrata",
  "Method": "Methode",
  "Blocked randomisation helps preserve balance during recruitment.": "Blokrandomisatie helpt balans tijdens inclusie te behouden.",
  "Randomisation method": "Randomisatiemethode",
  "Permuted block": "Gepermuteerd blok",
  "Simple balanced": "Eenvoudig gebalanceerd",
  "Block size": "Blokgrootte",
  "Used only for permuted blocks; keep it concealed in open-label trials.": "Alleen gebruikt voor gepermuteerde blokken; houd dit verborgen in open-label studies.",
  "Seed": "Seed",
  "Record this in the randomisation file to reproduce the sequence.": "Leg dit vast in het randomisatiebestand om de reeks te reproduceren.",
  "Generated allocation": "Gegenereerde allocatie",
  "Generated sequence": "Gegenereerde reeks",
  "subjects": "deelnemers",
  "Subject": "Deelnemer",
  "Assignment": "Toewijzing",
  "Stratum": "Stratum",
  "Block": "Blok",
  "Best practice": "Best practice",
  "How to conduct randomisation properly": "Randomisatie correct uitvoeren",
  "Planning assistant": "Planningsassistent",
  "Scenario comparison": "Scenariovergelijking",
  "Saved assumption sets": "Opgeslagen aannamesets",
  "Calculator": "Calculator",
  "Base n": "Basis n",
  "Adjusted n": "Aangepaste n",
  "Reporting support": "Rapportageondersteuning",
  "EQUATOR decision tree": "EQUATOR-beslisboom",
  "Find your study design": "Vind uw studiedesign",
  "Find the reporting checklist": "Vind de rapportagechecklist",
  "Reporting checklist": "Rapportagechecklist",
  "Reporting checklists improve transparency, reduce avoidable omissions, and help readers, reviewers, and editors assess whether the study methods and results are complete enough to interpret and reproduce. They should be used from protocol planning through manuscript submission, not only at the final writing stage.": "Rapportagechecklists verbeteren transparantie, verminderen vermijdbare omissies en helpen lezers, reviewers en redacteuren beoordelen of de methoden en resultaten volledig genoeg zijn om te interpreteren en te reproduceren. Ze horen vanaf protocolplanning tot en met manuscriptindiening te worden gebruikt, niet pas in de laatste schrijffase.",
  "Yes": "Ja",
  "No": "Nee",
  "Suggested checklist": "Voorgestelde checklist",
  "Reset tree": "Boom resetten",
  "Reporting checklist helper": "Hulp bij rapportagechecklists",
  "Study/report type": "Type studie/rapport",
  "Reporting checklist type": "Type rapportagechecklist",
  "Open guideline resource": "Richtlijnbron openen",
  "The Method section should at least describe the following:": "De methodesectie moet ten minste het volgende beschrijven:",
  "Save scenario": "Scenario opslaan",
  "Formula": "Formule",
  "Assumptions": "Aannames",
  "References": "Referenties",
  "Randomiser summary": "Randomisatieoverzicht",
  "Randomisation slots": "Randomisatieslots",
  "allocation groups": "allocatiegroepen",
  "Blocked": "Geblokkeerd",
  "Simple": "Eenvoudig",
  "Balanced shuffled sequence": "Gebalanceerde geschudde reeks",
  "Allocation counts": "Allocatieaantallen",
  "Documentation": "Documentatie",
  "Live result": "Live resultaat",
  "Required sample size": "Benodigde steekproefgrootte",
  "Total before dropout adjustment": "Totaal voor uitvalcorrectie",
  "Adjusted total": "Aangepast totaal",
  "Includes expected dropout or missing data": "Inclusief verwachte uitval of ontbrekende gegevens",
  "Planning notes": "Planningsnotities",
  "Protocol wording": "Protocoltekst",
  "Open wording popup": "Protocoltekst openen",
  "Saved scenarios": "Opgeslagen scenario's",
  "No saved scenarios yet.": "Nog geen opgeslagen scenario's.",
  "adjusted": "aangepast",
  "Citation": "Citatie",
  "Close": "Sluiten",
  "Copy wording for your protocol": "Kopieer tekst voor uw protocol",
  "Copy wording": "Tekst kopiëren",
  "Copy citation": "Citatie kopiëren",
  "Citation copied": "Citatie gekopieerd",
  "Clear scenarios": "Scenario's wissen",
  "Scenarios cleared": "Scenario's gewist",
  "StudySize Studio version 1.23 © Ryalino, 2026.": "StudySize Studio versie 1.23 © Ryalino, 2026.",
  "Scenario is ready": "Scenario is klaar",
  "This scenario is now available in the Scenario Comparison bar, where you can compare it with other saved planning scenarios.": "Dit scenario is nu beschikbaar in de balk Scenariovergelijking, waar u het kunt vergelijken met andere opgeslagen planningsscenario's.",
  "Open Scenario Comparison": "Scenariovergelijking openen",
  "All": "Alle",
  "Most used": "Meest gebruikt",
  "Descriptive": "Beschrijvend",
  "Comparative": "Vergelijkend",
  "Association": "Associatie",
  "Diagnostic": "Diagnostisch",
  "Epidemiology": "Epidemiologie",
  "Advanced Trials": "Geavanceerde trials",
  "Modeling": "Modellering",
  "Prevalence / Single Proportion": "Prevalentie / enkele proportie",
  "Single Mean": "Enkel gemiddelde",
  "Two Independent Means": "Twee onafhankelijke gemiddelden",
  "Paired / Before-After Mean": "Gepaarde / voor-na gemiddelde",
  "Two Independent Proportions": "Twee onafhankelijke proporties",
  "One Proportion vs Benchmark": "Eén proportie versus benchmark",
  "Correlation": "Correlatie",
  "Diagnostic Sensitivity": "Diagnostische sensitiviteit",
  "Diagnostic Specificity": "Diagnostische specificiteit",
  "Cohort / Risk Ratio": "Cohort / risicoratio",
  "Case-Control / Odds Ratio": "Case-control / oddsratio",
  "Non-Inferiority Mean": "Non-inferioriteitsgemiddelde",
  "Equivalence Mean": "Equivalentiegemiddelde",
  "Cluster Randomized Trial": "Clustergerandomiseerde trial",
  "Survival / Time-to-Event": "Overleving / tijd-tot-event",
  "Multiple Linear Regression": "Meervoudige lineaire regressie",
  "Logistic Regression Events": "Logistische regressie-events",
  "Expected proportion": "Verwachte proportie",
  "Margin of error": "Foutmarge",
  "Confidence": "Betrouwbaarheid",
  "Non-response": "Non-respons",
  "Standard deviation": "Standaarddeviatie",
  "Mean difference": "Gemiddeld verschil",
  "Common SD": "Gemeenschappelijke SD",
  "Allocation ratio": "Allocatieratio",
  "Alpha": "Alfa",
  "Power": "Power",
  "Dropout": "Uitval",
  "Mean change": "Gemiddelde verandering",
  "SD of differences": "SD van verschillen",
  "Control proportion": "Controleproportie",
  "Treatment proportion": "Behandelproportie",
  "Benchmark": "Benchmark",
  "Target proportion": "Doelproportie",
  "Expected correlation": "Verwachte correlatie",
  "Sensitivity": "Sensitiviteit",
  "Specificity": "Specificiteit",
  "Disease prevalence": "Ziekteprevalentie",
  "Non-evaluable": "Niet-evalueerbaar",
  "Risk ratio": "Risicoratio",
  "Odds ratio": "Oddsratio",
  "Predictors": "Predictoren",
  "Missing data": "Ontbrekende gegevens",
  "What is the main purpose of the study?": "Wat is het hoofddoel van de studie?",
  "Choose the analysis goal that best matches the primary objective.": "Kies het analysedoel dat het best past bij de primaire doelstelling.",
  "Estimate one quantity": "Eén grootheid schatten",
  "Prevalence, rate, proportion, or mean with a target precision.": "Prevalentie, percentage, proportie of gemiddelde met een gewenste precisie.",
  "Compare groups": "Groepen vergelijken",
  "Treatment vs control, exposed vs unexposed, or before vs after.": "Behandeling versus controle, blootgesteld versus niet-blootgesteld, of voor versus na.",
  "Study association": "Associatie onderzoeken",
  "Correlation, risk ratio, odds ratio, or hazard ratio.": "Correlatie, risicoratio, oddsratio of hazardratio.",
  "Diagnostic accuracy": "Diagnostische accuratesse",
  "Sensitivity or specificity of a test against a reference standard.": "Sensitiviteit of specificiteit van een test ten opzichte van een referentiestandaard.",
  "Prediction/modeling": "Predictie/modellering",
  "Regression or prediction model sample size planning.": "Steekproefplanning voor regressie- of predictiemodellen.",
  "What are you estimating?": "Wat wilt u schatten?",
  "Proportion or prevalence": "Proportie of prevalentie",
  "Mean value": "Gemiddelde waarde",
  "What type of primary outcome are you comparing?": "Welk type primaire uitkomst vergelijkt u?",
  "Binary": "Binair",
  "Continuous": "Continu",
  "Time-to-event": "Tijd-tot-event",
  "How are the observations arranged?": "Hoe zijn de observaties georganiseerd?",
  "Two independent groups": "Twee onafhankelijke groepen",
  "Paired or before-after": "Gepaarde of voor-na metingen",
  "Clustered groups": "Geclusterde groepen",
  "One group vs benchmark": "Eén groep versus benchmark",
  "What best describes the group comparison?": "Wat beschrijft de groepsvergelijking het best?",
  "Trial or experiment": "Trial of experiment",
  "Cohort/exposure groups": "Cohort-/blootstellingsgroepen",
  "Case-control": "Case-control",
  "What is the trial objective?": "Wat is het doel van de trial?",
  "Superiority": "Superioriteit",
  "Non-inferiority": "Non-inferioriteit",
  "Equivalence": "Equivalentie",
  "What association measure best matches your question?": "Welke associatiemaat past het best bij uw vraag?",
  "Linear regression": "Lineaire regressie",
  "Logistic regression": "Logistische regressie",
  "Randomised trial": "Gerandomiseerde trial",
  "Observational study": "Observationele studie",
  "Systematic review": "Systematische review",
  "Diagnostic/prognostic accuracy": "Diagnostische/prognostische accuratesse",
  "Study protocol": "Studieprotocol",
  "Case report": "Casusrapport",
  "Qualitative research": "Kwalitatief onderzoek",
  "Quality improvement": "Kwaliteitsverbetering",
  "Economic evaluation": "Economische evaluatie",
  "Prediction model": "Predictiemodel",
  "Animal research / ARRIVE": "Dieronderzoek / ARRIVE",
  "Search EQUATOR library": "EQUATOR-bibliotheek zoeken",
};

Object.assign(indonesianText, {
  "Copied": "Disalin",
  "Randomisation wording": "Kalimat randomisasi",
  "Copy randomisation wording": "Salin kalimat randomisasi",
  "Review and revise this wording before using it in a manuscript.": "Tinjau dan sesuaikan kalimat ini sebelum digunakan dalam manuskrip.",
  "Blinding setup": "Pengaturan pembutaan",
  "Blinding inputs": "Input pembutaan",
  "Who was blinded?": "Siapa yang dibutakan?",
  "Mask participants to allocation.": "Buta peserta terhadap alokasi.",
  "Mask care providers or interventionists to allocation.": "Buta pemberi layanan atau pelaksana intervensi terhadap alokasi.",
  "Mask outcome assessors to allocation.": "Buta penilai luaran terhadap alokasi.",
  "Mask data analysts to allocation.": "Buta analis data terhadap alokasi.",
  "Participants": "Peserta",
  "Care providers": "Pemberi layanan",
  "Outcome assessors": "Penilai luaran",
  "Data analysts": "Analis data",
  "Allocation concealment method": "Metode penyembunyian alokasi",
  "Sequence holder": "Pemegang urutan",
  "Central randomisation or secure database": "Randomisasi sentral atau basis data aman",
  "Pharmacy-controlled allocation": "Alokasi dikendalikan farmasi",
  "Sequentially numbered opaque sealed envelopes": "Amplop buram tersegel bernomor urut",
  "Open list or no allocation concealment": "Daftar terbuka atau tanpa penyembunyian alokasi",
  "Independent statistician": "Statistikawan independen",
  "Study pharmacy": "Farmasi studi",
  "Secure randomisation system": "Sistem randomisasi aman",
  "Principal investigator": "Peneliti utama",
  "Blinding classification": "Klasifikasi pembutaan",
  "Classification rule": "Aturan klasifikasi",
  "Open-label": "Label terbuka",
  "Single-blinded": "Buta tunggal",
  "Double-blinded": "Buta ganda",
  "Triple-blinded": "Buta tiga pihak",
  "Participants are not blinded; any blinded researcher, outcome-assessor, or data-analysis role should be reported separately.": "Peserta tidak dibutakan; setiap pembutaan pada peneliti, penilai luaran, atau analis data harus dilaporkan terpisah.",
  "Participants are blinded; researchers, investigators, and data collectors are not blinded.": "Peserta dibutakan; peneliti, investigator, dan pengumpul data tidak dibutakan.",
  "Participants and researchers, investigators, or data collectors are blinded; data analysts are not blinded.": "Peserta dan peneliti, investigator, atau pengumpul data dibutakan; analis data tidak dibutakan.",
  "Participants, researchers, investigators or data collectors, and data analysts are blinded.": "Peserta, peneliti, investigator atau pengumpul data, serta analis data dibutakan.",
  "Blinded roles": "Peran yang dibutakan",
  "No party is blinded to allocation.": "Tidak ada pihak yang dibutakan terhadap alokasi.",
  "Allocation concealment": "Penyembunyian alokasi",
  "Blinding wording": "Kalimat pembutaan",
  "Copy blinding wording": "Salin kalimat pembutaan",
  "Randomisation wording copied": "Kalimat randomisasi disalin",
  "Blinding wording copied": "Kalimat pembutaan disalin",
  "Classify blinding from the parties masked to allocation and generate manuscript wording that can be reviewed against CONSORT expectations.": "Klasifikasikan pembutaan dari pihak yang disamarkan terhadap alokasi dan buat kalimat manuskrip yang dapat ditinjau sesuai ekspektasi CONSORT.",
  "Mask the parties who should not know the allocation before outcome interpretation or analysis.": "Pilih pihak yang tidak boleh mengetahui alokasi sebelum interpretasi luaran atau analisis.",
  "Choose how the sequence is protected before assignment.": "Pilih bagaimana urutan dilindungi sebelum alokasi.",
  "Document who generated, stored, and released the sequence.": "Dokumentasikan siapa yang membuat, menyimpan, dan membuka urutan.",
});

Object.assign(dutchText, {
  "Copied": "Gekopieerd",
  "Answer the yes/no prompts adapted from the EQUATOR Network decision tree to select the most relevant checklist.": "Beantwoord de ja/nee-vragen die zijn aangepast van de beslisboom van het EQUATOR Network om de meest relevante checklist te selecteren.",
  "Answered checklist tree questions": "Beantwoorde vragen in de checklistbeslisboom",
  "Blinding": "Blindering",
  "Blinding and allocation concealment guide": "Gids voor blindering en allocatieconcealment",
  "Block size slider": "Schuifregelaar voor blokgrootte",
  "Calculator selected from decision tree": "Calculator geselecteerd via de beslisboom",
  "Checklist tree reset": "Checklistbeslisboom opnieuw ingesteld",
  "Close citation dialog": "Citatievenster sluiten",
  "Close protocol wording dialog": "Protocoltekstvenster sluiten",
  "Compare saved sample-size scenarios by base sample size, adjusted sample size, and the assumption set used for planning.": "Vergelijk opgeslagen steekproefgrootte-scenario's op basis van basissteekproefgrootte, aangepaste steekproefgrootte en de aannameset die voor de planning is gebruikt.",
  "Diagnostic accuracy / STARD": "Diagnostische accuratesse / STARD",
  "Export the PDF before enrolment.": "Exporteer de PDF vóór inclusie.",
  "Keep the sequence concealed from recruiters.": "Houd de reeks verborgen voor personen die deelnemers includeren.",
  "Observational meta-analysis / MOOSE": "Observationele meta-analyse / MOOSE",
  "PDF downloaded": "PDF gedownload",
  "Prognostic marker / REMARK": "Prognostische marker / REMARK",
  "Protocol wording copied": "Protocoltekst gekopieerd",
  "Protocol wording text": "Protocoltekst",
  "Qualitative evidence synthesis / ENTREQ": "Kwalitatieve bewijssynthese / ENTREQ",
  "Qualitative research / SRQR": "Kwalitatief onderzoek / SRQR",
  "Randomisation PDF downloaded": "Randomisatie-PDF gedownload",
  "Randomisation allocation table": "Randomisatie-allocatietabel",
  "Randomisation is not only the sequence. Good practice also requires allocation concealment, documented roles, and a clear audit trail from consent through assignment.": "Randomisatie is niet alleen de reeks. Goede praktijk vereist ook allocatieconcealment, gedocumenteerde rollen en een duidelijk auditspoor van toestemming tot toewijzing.",
  "Randomisation log PDF downloaded": "Randomisatielog-PDF gedownload",
  "Randomisation seed": "Randomisatie-seed",
  "Randomisation wording": "Randomisatietekst",
  "Save scenarios from the calculator catalog to compare assumptions and adjusted sample sizes here.": "Sla scenario's op vanuit de calculatorcatalogus om aannames en aangepaste steekproefgroottes hier te vergelijken.",
  "Saved scenario comparison": "Vergelijking van opgeslagen scenario's",
  "Scenario loaded": "Scenario geladen",
  "Scenario saved": "Scenario opgeslagen",
  "Select the study or report type and use the checklist prompts to prepare a more complete manuscript, protocol, or project report.": "Selecteer het studie- of rapporttype en gebruik de checklistvragen om een vollediger manuscript, protocol of projectrapport voor te bereiden.",
  "Showing the first 120 assignments. The PDF includes the full sequence.": "De eerste 120 toewijzingen worden getoond. De PDF bevat de volledige reeks.",
  "The allocation sequence should be protected before assignment, and blinding should be planned around who can influence enrolment, treatment, assessment, or analysis.": "De allocatiereeks moet vóór toewijzing worden beschermd, en blindering moet worden gepland rond wie inclusie, behandeling, beoordeling of analyse kan beïnvloeden.",
  "Copy randomisation wording": "Randomisatietekst kopiëren",
  "Review and revise this wording before using it in a manuscript.": "Controleer en pas deze tekst aan voordat u deze in een manuscript gebruikt.",
  "Blinding setup": "Blindering instellen",
  "Blinding inputs": "Blindering invoer",
  "Who was blinded?": "Wie werd geblindeerd?",
  "Mask participants to allocation.": "Blindeer deelnemers voor allocatie.",
  "Mask care providers or interventionists to allocation.": "Blindeer zorgverleners of interventionisten voor allocatie.",
  "Mask outcome assessors to allocation.": "Blindeer uitkomstbeoordelaars voor allocatie.",
  "Mask data analysts to allocation.": "Blindeer data-analisten voor allocatie.",
  "Participants": "Deelnemers",
  "Care providers": "Zorgverleners",
  "Outcome assessors": "Uitkomstbeoordelaars",
  "Data analysts": "Data-analisten",
  "Allocation concealment method": "Methode voor allocatieconcealment",
  "Sequence holder": "Beheerder van de reeks",
  "Central randomisation or secure database": "Centrale randomisatie of beveiligde database",
  "Pharmacy-controlled allocation": "Apotheekgestuurde allocatie",
  "Sequentially numbered opaque sealed envelopes": "Opeenvolgend genummerde ondoorzichtige verzegelde enveloppen",
  "Open list or no allocation concealment": "Open lijst of geen allocatieconcealment",
  "Independent statistician": "Onafhankelijke statisticus",
  "Study pharmacy": "Studieapotheek",
  "Secure randomisation system": "Beveiligd randomisatiesysteem",
  "Principal investigator": "Hoofdonderzoeker",
  "Blinding classification": "Blinderingclassificatie",
  "Classification rule": "Classificatieregel",
  "Open-label": "Open-label",
  "Single-blinded": "Enkelblind",
  "Double-blinded": "Dubbelblind",
  "Triple-blinded": "Tripelblind",
  "Participants are not blinded; any blinded researcher, outcome-assessor, or data-analysis role should be reported separately.": "Deelnemers zijn niet geblindeerd; elke geblindeerde rol van onderzoeker, uitkomstbeoordelaar of data-analyse moet afzonderlijk worden gerapporteerd.",
  "Participants are blinded; researchers, investigators, and data collectors are not blinded.": "Deelnemers zijn geblindeerd; onderzoekers, investigator en dataverzamelaars zijn niet geblindeerd.",
  "Participants and researchers, investigators, or data collectors are blinded; data analysts are not blinded.": "Deelnemers en onderzoekers, investigator of dataverzamelaars zijn geblindeerd; data-analisten zijn niet geblindeerd.",
  "Participants, researchers, investigators or data collectors, and data analysts are blinded.": "Deelnemers, onderzoekers, investigator of dataverzamelaars, en data-analisten zijn geblindeerd.",
  "Blinded roles": "Geblindeerde rollen",
  "No party is blinded to allocation.": "Geen partij is geblindeerd voor allocatie.",
  "Allocation concealment": "Allocatieconcealment",
  "Blinding wording": "Blinderingstekst",
  "Copy blinding wording": "Blinderingstekst kopiëren",
  "Randomisation wording copied": "Randomisatietekst gekopieerd",
  "Blinding wording copied": "Blinderingstekst gekopieerd",
  "Classify blinding from the parties masked to allocation and generate manuscript wording that can be reviewed against CONSORT expectations.": "Classificeer blindering op basis van de partijen die gemaskeerd zijn voor allocatie en genereer manuscripttekst die aan CONSORT kan worden getoetst.",
  "Mask the parties who should not know the allocation before outcome interpretation or analysis.": "Selecteer de partijen die de allocatie niet mogen kennen vóór interpretatie van uitkomsten of analyse.",
  "Choose how the sequence is protected before assignment.": "Kies hoe de reeks vóór toewijzing wordt beschermd.",
  "Document who generated, stored, and released the sequence.": "Documenteer wie de reeks heeft gegenereerd, opgeslagen en vrijgegeven.",
});

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

function twoProportionSampleSize(pControl: number, pTreatment: number, allocationRatio: number, alpha: number, power: number) {
  const ratio = Math.max(0.01, allocationRatio);
  const pooled = (pControl + ratio * pTreatment) / (1 + ratio);
  const difference = Math.abs(pTreatment - pControl);
  if (difference < 1e-9) return { control: Number.POSITIVE_INFINITY, treatment: Number.POSITIVE_INFINITY, total: Number.POSITIVE_INFINITY };
  const control =
    ((zAlpha(alpha) * Math.sqrt((1 + 1 / ratio) * pooled * (1 - pooled)) +
      zPower(power) * Math.sqrt(pControl * (1 - pControl) + (pTreatment * (1 - pTreatment)) / ratio)) ** 2) /
    difference ** 2;
  const controlN = ceil(control);
  const treatmentN = ceil(controlN * ratio);
  return { control: controlN, treatment: treatmentN, total: controlN + treatmentN };
}

const languageOptions: { code: Language; label: string; flag: string; aria: string }[] = [
  { code: "en", label: "English", flag: "🇬🇧", aria: "Switch to English" },
  { code: "id", label: "Bahasa Indonesia", flag: "🇮🇩", aria: "Ganti ke Bahasa Indonesia" },
  { code: "nl", label: "Nederlands", flag: "🇳🇱", aria: "Schakel naar Nederlands" },
];

const decisionOptionIcons: Record<string, string> = {
  estimate: "📏",
  compare: "⚖️",
  association: "🔗",
  diagnostic: "🩺",
  modeling: "📈",
  proportion: "%",
  mean: "x̄",
  binary: "0/1",
  continuous: "∑",
  survival: "⏱",
  independent: "⇄",
  paired: "↔",
  clustered: "▦",
  benchmark: "🎯",
  trial: "🧪",
  cohort: "👥",
  caseControl: "🔍",
  superiority: "↑",
  noninferiority: "≥",
  equivalence: "≈",
  rr: "RR",
  or: "OR",
  hr: "HR",
  sensitivity: "Se",
  specificity: "Sp",
  linear: "ƒ",
  logistic: "logit",
  standard: "✓",
  advanced: "⚠",
};

function decisionIcon(value: string) {
  return decisionOptionIcons[value] ?? "•";
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

const parameterGuidanceText: Record<string, Partial<Record<Language, string>>> = {
  "common.alpha": {
    en: "Alpha is the planned Type I error rate, usually two-sided. A 5% alpha is standard for superiority studies; non-inferiority commonly uses a one-sided 2.5%.",
    id: "Alfa adalah tingkat kesalahan tipe I yang direncanakan, biasanya dua sisi. Nilai 5% lazim untuk studi superioritas; non-inferioritas sering memakai satu sisi 2,5%.",
    nl: "Alfa is de geplande type-I-foutkans, meestal tweezijdig. 5% is standaard voor superioriteitsstudies; non-inferioriteit gebruikt vaak eenzijdig 2,5%.",
  },
  "common.power": {
    en: "Power is the probability of detecting the planned effect if it is real. 80% is common; 90% is often chosen for pivotal or higher-stakes studies.",
    id: "Power adalah peluang mendeteksi efek yang direncanakan bila efek itu benar ada. Nilai 80% lazim; 90% sering dipilih untuk studi penting atau berisiko tinggi.",
    nl: "Power is de kans om het geplande effect te vinden als het werkelijk bestaat. 80% is gebruikelijk; 90% wordt vaak gekozen voor doorslaggevende of risicovolle studies.",
  },
  "common.dropout": {
    en: "This inflates the calculated sample size for loss to follow-up, non-response, missing data, or non-evaluable records. Use pilot or prior-study rates; 10-20% is common when uncertain.",
    id: "Parameter ini menambah besar sampel untuk kehilangan tindak lanjut, non-respons, data hilang, atau data yang tidak dapat dievaluasi. Gunakan data pilot atau studi sebelumnya; 10-20% lazim bila belum pasti.",
    nl: "Dit verhoogt de berekende steekproefgrootte voor uitval, non-respons, ontbrekende gegevens of niet-beoordeelbare dossiers. Gebruik pilot- of eerdere studiecijfers; 10-20% is gebruikelijk bij onzekerheid.",
  },
  "common.confidence": {
    en: "Confidence sets the long-run coverage of the interval estimate. 95% is the usual scientific standard; 90% or 99% should be justified by the study context.",
    id: "Kepercayaan menentukan cakupan jangka panjang dari estimasi interval. 95% adalah standar ilmiah umum; 90% atau 99% perlu dijustifikasi sesuai konteks studi.",
    nl: "Betrouwbaarheid bepaalt de langetermijndekking van de intervalschatting. 95% is de gebruikelijke wetenschappelijke standaard; 90% of 99% vraagt contextuele onderbouwing.",
  },
  "common.ratio": {
    en: "Allocation ratio compares group sizes. A 1:1 ratio is statistically efficient; unequal ratios are used for feasibility, cost, safety, or ethical reasons.",
    id: "Rasio alokasi membandingkan ukuran kelompok. Rasio 1:1 paling efisien secara statistik; rasio tidak seimbang digunakan karena alasan kelayakan, biaya, keamanan, atau etik.",
    nl: "De allocatieratio vergelijkt groepsgroottes. Een 1:1-ratio is statistisch efficient; ongelijke ratio's worden gebruikt om haalbaarheid, kosten, veiligheid of ethische redenen.",
  },
  "prevalence.p": {
    en: "This is the expected prevalence or proportion in the target population. If no reliable estimate exists, 50% is conventionally used because it gives the largest conservative sample size.",
    id: "Ini adalah prevalensi atau proporsi yang diperkirakan pada populasi target. Bila tidak ada estimasi yang andal, 50% lazim digunakan karena menghasilkan besar sampel konservatif terbesar.",
    nl: "Dit is de verwachte prevalentie of proportie in de doelpopulatie. Als er geen betrouwbare schatting is, wordt 50% vaak gebruikt omdat dit de grootste conservatieve steekproef oplevert.",
  },
  "prevalence.margin": {
    en: "Margin of error is the desired half-width of the confidence interval around the proportion. A 5 percentage-point margin is common; narrower margins require substantially larger samples.",
    id: "Batas galat adalah setengah lebar interval kepercayaan yang diinginkan di sekitar proporsi. Margin 5 poin persentase lazim; margin lebih sempit memerlukan sampel jauh lebih besar.",
    nl: "De foutmarge is de gewenste halve breedte van het betrouwbaarheidsinterval rond de proportie. 5 procentpunten is gebruikelijk; smallere marges vragen veel grotere steekproeven.",
  },
  "single-mean.sd": {
    en: "The standard deviation describes expected spread of the continuous outcome. There is no universal standard value; use a pilot study, registry, or comparable publication.",
    id: "Simpangan baku menggambarkan sebaran luaran kontinu yang diperkirakan. Tidak ada nilai standar universal; gunakan studi pilot, registri, atau publikasi yang sebanding.",
    nl: "De standaarddeviatie beschrijft de verwachte spreiding van de continue uitkomst. Er is geen universele standaardwaarde; gebruik een pilotstudie, register of vergelijkbare publicatie.",
  },
  "single-mean.margin": {
    en: "This is the acceptable error around the estimated mean in original measurement units. Choose the smallest difference that would still be clinically or scientifically meaningful.",
    id: "Ini adalah galat yang dapat diterima di sekitar rerata dalam satuan pengukuran asli. Pilih selisih terkecil yang masih bermakna secara klinis atau ilmiah.",
    nl: "Dit is de aanvaardbare fout rond het geschatte gemiddelde in de oorspronkelijke meeteenheid. Kies het kleinste verschil dat klinisch of wetenschappelijk nog betekenisvol is.",
  },
  "two-means.delta": {
    en: "Mean difference is the smallest between-group difference the study should detect. It should be clinically important, not merely statistically convenient.",
    id: "Selisih rerata adalah perbedaan antarkelompok terkecil yang ingin dideteksi studi. Nilai ini harus bermakna secara klinis, bukan hanya mudah secara statistik.",
    nl: "Het gemiddelde verschil is het kleinste groepsverschil dat de studie moet aantonen. Het hoort klinisch relevant te zijn, niet alleen statistisch handig.",
  },
  "two-means.sd": {
    en: "Common SD is the expected within-group variability. Use prior data on the same scale; when groups differ, use a pooled or conservative larger SD.",
    id: "SD bersama adalah variasi dalam kelompok yang diperkirakan. Gunakan data terdahulu pada skala yang sama; bila kelompok berbeda, gunakan SD gabungan atau SD lebih besar yang konservatif.",
    nl: "De gezamenlijke SD is de verwachte variatie binnen groepen. Gebruik eerdere gegevens op dezelfde schaal; bij verschillende groepen gebruikt u een gepoolde of conservatief hogere SD.",
  },
  "paired-mean.delta": {
    en: "Mean change is the smallest within-person or matched-pair change worth detecting. It should come from the minimally important change or a justified scientific target.",
    id: "Perubahan rerata adalah perubahan dalam individu atau pasangan yang paling kecil tetapi layak dideteksi. Nilai ini sebaiknya berasal dari perubahan minimal penting atau target ilmiah yang beralasan.",
    nl: "De gemiddelde verandering is de kleinste binnen-persoons- of gematchte verandering die detectie waard is. Baseer dit op de minimale belangrijke verandering of een onderbouwd wetenschappelijk doel.",
  },
  "paired-mean.sdDiff": {
    en: "This is the SD of paired differences, not the baseline SD. It is often smaller than the raw outcome SD; use paired pilot data whenever possible.",
    id: "Ini adalah SD dari selisih berpasangan, bukan SD awal. Nilainya sering lebih kecil daripada SD luaran mentah; gunakan data pilot berpasangan bila memungkinkan.",
    nl: "Dit is de SD van gepaarde verschillen, niet de baseline-SD. Deze is vaak kleiner dan de ruwe uitkomst-SD; gebruik waar mogelijk gepaarde pilotgegevens.",
  },
  "two-proportions.p1": {
    en: "Control proportion is the expected event, response, or risk in the comparison group. Use the best local or recent estimate because this strongly affects sample size.",
    id: "Proporsi kontrol adalah kejadian, respons, atau risiko yang diperkirakan pada kelompok pembanding. Gunakan estimasi lokal atau terbaru terbaik karena sangat memengaruhi besar sampel.",
    nl: "De controleproportie is de verwachte gebeurtenis, respons of kans in de vergelijkingsgroep. Gebruik de beste lokale of recente schatting omdat dit de steekproefgrootte sterk beinvloedt.",
  },
  "two-proportions.p2": {
    en: "Treatment proportion is the expected rate in the intervention group. The clinically meaningful absolute difference from control should drive the choice.",
    id: "Proporsi perlakuan adalah angka yang diperkirakan pada kelompok intervensi. Selisih absolut yang bermakna klinis dari kontrol harus menjadi dasar pemilihan nilai.",
    nl: "De behandelproportie is het verwachte percentage in de interventiegroep. Het klinisch relevante absolute verschil met controle moet de keuze sturen.",
  },
  "one-proportion-test.p0": {
    en: "Benchmark is the fixed null, historical, or target proportion. It should come from a standard, registry, previous study, or protocol-defined threshold.",
    id: "Benchmark adalah proporsi nol, historis, atau target yang dianggap tetap. Nilai ini sebaiknya berasal dari standar, registri, studi sebelumnya, atau ambang yang ditetapkan protokol.",
    nl: "De benchmark is de vaste nul-, historische of doelproportie. Baseer deze op een standaard, register, eerdere studie of protocolgedefinieerde drempel.",
  },
  "one-proportion-test.p1": {
    en: "Target proportion is the true proportion the study is powered to detect. Choose a value that would change interpretation or practice.",
    id: "Proporsi target adalah proporsi sebenarnya yang ingin dideteksi dengan power studi. Pilih nilai yang dapat mengubah interpretasi atau praktik.",
    nl: "De doelproportie is de werkelijke proportie waarop de studie gepowerd is. Kies een waarde die interpretatie of praktijk zou veranderen.",
  },
  "correlation.rho": {
    en: "Expected correlation is the smallest Pearson correlation worth detecting. Cohen's rough benchmarks are 0.10 small, 0.30 moderate, and 0.50 large.",
    id: "Korelasi yang diharapkan adalah korelasi Pearson terkecil yang layak dideteksi. Patokan kasar Cohen: 0,10 kecil, 0,30 sedang, dan 0,50 besar.",
    nl: "De verwachte correlatie is de kleinste Pearson-correlatie die detectie waard is. Cohens grove richtlijnen zijn 0,10 klein, 0,30 matig en 0,50 groot.",
  },
  "diagnostic-sensitivity.sensitivity": {
    en: "Sensitivity is the probability that the index test is positive among participants who truly have the condition. Values of 80-90% are common planning targets, but disease risk should guide the target.",
    id: "Sensitivitas adalah peluang tes indeks positif pada peserta yang benar-benar memiliki kondisi. Target 80-90% lazim dalam perencanaan, tetapi risiko penyakit harus memandu target.",
    nl: "Sensitiviteit is de kans dat de indextest positief is bij deelnemers die de aandoening werkelijk hebben. 80-90% is vaak een planningsdoel, maar ziekterisico moet het doel sturen.",
  },
  "diagnostic-sensitivity.margin": {
    en: "This is the acceptable precision around sensitivity. Margins of 5-10 percentage points are common; serious diagnostic consequences usually require tighter precision.",
    id: "Ini adalah presisi yang dapat diterima di sekitar sensitivitas. Margin 5-10 poin persentase lazim; konsekuensi diagnostik serius biasanya memerlukan presisi lebih ketat.",
    nl: "Dit is de aanvaardbare precisie rond sensitiviteit. Marges van 5-10 procentpunten zijn gebruikelijk; ernstige diagnostische gevolgen vragen meestal smallere marges.",
  },
  "diagnostic-sensitivity.prevalence": {
    en: "Disease prevalence determines how many screened participants are needed to obtain enough diseased participants. Use the expected prevalence in the recruited setting, not the general population if different.",
    id: "Prevalensi penyakit menentukan berapa peserta yang perlu direkrut untuk memperoleh cukup peserta dengan penyakit. Gunakan prevalensi pada setting rekrutmen, bukan populasi umum bila berbeda.",
    nl: "Ziekteprevalentie bepaalt hoeveel gescreende deelnemers nodig zijn om genoeg zieke deelnemers te verkrijgen. Gebruik de prevalentie in de wervingssetting, niet de algemene populatie als die verschilt.",
  },
  "diagnostic-specificity.specificity": {
    en: "Specificity is the probability that the index test is negative among participants without the condition. High specificity targets are often needed when false positives are harmful or costly.",
    id: "Spesifisitas adalah peluang tes indeks negatif pada peserta tanpa kondisi. Target spesifisitas tinggi sering diperlukan bila positif palsu berbahaya atau mahal.",
    nl: "Specificiteit is de kans dat de indextest negatief is bij deelnemers zonder de aandoening. Hoge specificiteitsdoelen zijn vaak nodig als fout-positieven schadelijk of kostbaar zijn.",
  },
  "diagnostic-specificity.margin": {
    en: "This is the acceptable precision around specificity. Margins of 5-10 percentage points are common, with tighter margins for screening or high-impact decisions.",
    id: "Ini adalah presisi yang dapat diterima di sekitar spesifisitas. Margin 5-10 poin persentase lazim, dengan margin lebih ketat untuk skrining atau keputusan berdampak besar.",
    nl: "Dit is de aanvaardbare precisie rond specificiteit. Marges van 5-10 procentpunten zijn gebruikelijk, met smallere marges voor screening of beslissingen met grote gevolgen.",
  },
  "diagnostic-specificity.prevalence": {
    en: "Prevalence determines the non-diseased fraction available for estimating specificity. Lower prevalence usually makes specificity easier to estimate than sensitivity.",
    id: "Prevalensi menentukan fraksi tanpa penyakit yang tersedia untuk memperkirakan spesifisitas. Prevalensi rendah biasanya membuat spesifisitas lebih mudah diestimasi daripada sensitivitas.",
    nl: "Prevalentie bepaalt de niet-zieke fractie die beschikbaar is om specificiteit te schatten. Bij lage prevalentie is specificiteit meestal makkelijker te schatten dan sensitiviteit.",
  },
  "cohort-rr.p0": {
    en: "Unexposed risk is the expected outcome risk in the reference group. It should come from similar cohorts or surveillance data.",
    id: "Risiko tidak terpajan adalah risiko luaran yang diperkirakan pada kelompok rujukan. Nilai ini sebaiknya berasal dari kohort serupa atau data surveilans.",
    nl: "Het risico bij niet-blootgestelden is het verwachte uitkomstrisico in de referentiegroep. Baseer dit op vergelijkbare cohorten of surveillancegegevens.",
  },
  "cohort-rr.rr": {
    en: "Risk ratio is the expected exposed/unexposed risk contrast. RR = 1 means no association; choose the smallest clinically meaningful departure from 1.",
    id: "Rasio risiko adalah kontras risiko terpajan/tidak terpajan yang diharapkan. RR = 1 berarti tidak ada asosiasi; pilih penyimpangan terkecil dari 1 yang bermakna klinis.",
    nl: "De risicoratio is het verwachte risico-contrast blootgesteld/niet-blootgesteld. RR = 1 betekent geen associatie; kies de kleinste klinisch relevante afwijking van 1.",
  },
  "cohort-rr.ratio": {
    en: "This is the number of exposed participants per unexposed participant. 1:1 is efficient, but observational cohorts often use the naturally available exposure distribution.",
    id: "Ini adalah jumlah peserta terpajan per peserta tidak terpajan. Rasio 1:1 efisien, tetapi kohort observasional sering mengikuti distribusi pajanan yang tersedia.",
    nl: "Dit is het aantal blootgestelde deelnemers per niet-blootgestelde deelnemer. 1:1 is efficient, maar observationele cohorten volgen vaak de beschikbare blootstellingsverdeling.",
  },
  "case-control.p0": {
    en: "Control exposure is the expected exposure prevalence among controls. This is the anchor for translating the odds ratio into case exposure.",
    id: "Pajanan kontrol adalah prevalensi pajanan yang diperkirakan pada kontrol. Ini menjadi dasar untuk menerjemahkan odds ratio menjadi pajanan pada kasus.",
    nl: "Controleblootstelling is de verwachte blootstellingsprevalentie bij controles. Dit is het anker om de oddsratio naar casusblootstelling te vertalen.",
  },
  "case-control.or": {
    en: "Odds ratio is the planned exposure contrast between cases and controls. OR = 1 means no association; use the smallest important OR.",
    id: "Odds ratio adalah kontras pajanan yang direncanakan antara kasus dan kontrol. OR = 1 berarti tidak ada asosiasi; gunakan OR terkecil yang penting.",
    nl: "De oddsratio is het geplande blootstellingscontrast tussen cases en controles. OR = 1 betekent geen associatie; gebruik de kleinste belangrijke OR.",
  },
  "case-control.ratio": {
    en: "Controls per case can improve power when cases are limited. Gains become modest beyond about 4 controls per case, so 1:1 to 1:4 is typical.",
    id: "Kontrol per kasus dapat meningkatkan power bila jumlah kasus terbatas. Keuntungan menjadi kecil setelah sekitar 4 kontrol per kasus, sehingga 1:1 hingga 1:4 lazim.",
    nl: "Controles per case kunnen de power verhogen als cases schaars zijn. De winst wordt beperkt na ongeveer 4 controles per case; 1:1 tot 1:4 is gebruikelijk.",
  },
  "noninferiority-means.margin": {
    en: "The non-inferiority margin is the largest acceptable loss versus control. It must be clinically justified before calculation; there is no generic standard value.",
    id: "Margin non-inferioritas adalah kehilangan terbesar yang masih dapat diterima dibanding kontrol. Nilai ini harus dijustifikasi secara klinis sebelum perhitungan; tidak ada standar generik.",
    nl: "De non-inferioriteitsmarge is het grootste aanvaardbare verlies ten opzichte van controle. Deze moet klinisch onderbouwd zijn voor de berekening; er is geen algemene standaardwaarde.",
  },
  "noninferiority-means.sd": {
    en: "Common SD is the expected within-group variability of the continuous endpoint. Use previous trials on the same endpoint and population when possible.",
    id: "SD bersama adalah variasi dalam kelompok yang diperkirakan pada endpoint kontinu. Gunakan uji sebelumnya dengan endpoint dan populasi yang sama bila memungkinkan.",
    nl: "De gezamenlijke SD is de verwachte variatie binnen groepen voor het continue eindpunt. Gebruik waar mogelijk eerdere trials met hetzelfde eindpunt en dezelfde populatie.",
  },
  "equivalence-means.margin": {
    en: "The equivalence margin is the maximum difference considered practically the same in either direction. It must be prespecified and clinically justified.",
    id: "Margin ekuivalensi adalah perbedaan maksimum yang dianggap praktis sama pada kedua arah. Nilai ini harus ditetapkan sebelumnya dan dijustifikasi secara klinis.",
    nl: "De equivalentiemarge is het maximale verschil dat in beide richtingen praktisch gelijk wordt geacht. Deze moet vooraf zijn vastgelegd en klinisch onderbouwd.",
  },
  "equivalence-means.sd": {
    en: "Common SD is the expected variability in both groups. Use the same measurement scale and population as the planned equivalence endpoint.",
    id: "SD bersama adalah variasi yang diperkirakan pada kedua kelompok. Gunakan skala pengukuran dan populasi yang sama dengan endpoint ekuivalensi yang direncanakan.",
    nl: "De gezamenlijke SD is de verwachte variatie in beide groepen. Gebruik dezelfde meetschaal en populatie als het geplande equivalentie-eindpunt.",
  },
  "cluster-crt.p1": {
    en: "Control proportion is the expected event or response rate in control clusters. Use cluster-level setting data when available.",
    id: "Proporsi kontrol adalah angka kejadian atau respons yang diperkirakan pada klaster kontrol. Gunakan data setting tingkat klaster bila tersedia.",
    nl: "De controleproportie is het verwachte gebeurtenis- of responspercentage in controleclusters. Gebruik settinggegevens op clusterniveau als die beschikbaar zijn.",
  },
  "cluster-crt.p2": {
    en: "Intervention proportion is the expected rate after the cluster-level intervention. The absolute difference should be realistic for the intervention and implementation setting.",
    id: "Proporsi intervensi adalah angka yang diperkirakan setelah intervensi tingkat klaster. Selisih absolut harus realistis untuk intervensi dan setting implementasi.",
    nl: "De interventieproportie is het verwachte percentage na de interventie op clusterniveau. Het absolute verschil moet realistisch zijn voor interventie en implementatiesetting.",
  },
  "cluster-crt.clusterSize": {
    en: "Cluster size is the average number of participants per cluster. Unequal clusters reduce efficiency, so run sensitivity checks if sizes vary widely.",
    id: "Ukuran klaster adalah rata-rata jumlah peserta per klaster. Klaster yang tidak seimbang menurunkan efisiensi, jadi lakukan skenario sensitivitas bila ukurannya sangat bervariasi.",
    nl: "Clustergrootte is het gemiddelde aantal deelnemers per cluster. Ongelijke clusters verlagen de efficientie; voer gevoeligheidsanalyses uit bij grote variatie.",
  },
  "cluster-crt.icc": {
    en: "ICC measures similarity of participants within the same cluster. Even small ICC values can greatly increase sample size; 0.01-0.05 is common in many health-service settings.",
    id: "ICC mengukur kemiripan peserta dalam klaster yang sama. Bahkan ICC kecil dapat sangat meningkatkan besar sampel; 0,01-0,05 lazim pada banyak setting layanan kesehatan.",
    nl: "ICC meet de gelijkenis van deelnemers binnen hetzelfde cluster. Zelfs kleine ICC's kunnen de steekproef sterk vergroten; 0,01-0,05 is gebruikelijk in veel zorgsettings.",
  },
  "survival.hr": {
    en: "Hazard ratio is the planned treatment/control hazard contrast over time. HR below 1 favors treatment in this calculator; choose the smallest clinically important effect.",
    id: "Hazard ratio adalah kontras hazard perlakuan/kontrol yang direncanakan sepanjang waktu. HR di bawah 1 menguntungkan perlakuan pada kalkulator ini; pilih efek terkecil yang penting secara klinis.",
    nl: "De hazardratio is het geplande hazardcontrast behandeling/controle over de tijd. In deze calculator wijst HR onder 1 op voordeel voor behandeling; kies het kleinste klinisch belangrijke effect.",
  },
  "survival.eventRate": {
    en: "Overall event rate is the proportion expected to have the event by analysis. This links required events to total sample size; use expected follow-up and censoring patterns.",
    id: "Angka kejadian keseluruhan adalah proporsi yang diperkirakan mengalami kejadian saat analisis. Nilai ini menghubungkan jumlah kejadian yang diperlukan dengan total sampel; gunakan perkiraan follow-up dan sensor.",
    nl: "Het totale eventpercentage is het verwachte aandeel met een event bij analyse. Dit koppelt benodigde events aan totale steekproefgrootte; gebruik verwachte follow-up en censuurpatronen.",
  },
  "linear-regression.f2": {
    en: "Cohen's f2 expresses explained variance relative to unexplained variance. Rough standards are 0.02 small, 0.15 medium, and 0.35 large.",
    id: "Cohen f2 menyatakan varians yang dijelaskan relatif terhadap varians yang tidak dijelaskan. Patokan kasar: 0,02 kecil, 0,15 sedang, dan 0,35 besar.",
    nl: "Cohens f2 drukt verklaarde variantie uit ten opzichte van onverklaarde variantie. Grove richtlijnen zijn 0,02 klein, 0,15 middelgroot en 0,35 groot.",
  },
  "linear-regression.predictors": {
    en: "Predictors are the tested covariates or degrees of freedom in the model. Count dummy variables, nonlinear terms, and planned interaction terms when relevant.",
    id: "Prediktor adalah kovariat atau derajat kebebasan yang diuji dalam model. Hitung variabel dummy, bentuk nonlinier, dan interaksi yang direncanakan bila relevan.",
    nl: "Predictoren zijn de geteste covariaten of vrijheidsgraden in het model. Tel dummyvariabelen, niet-lineaire termen en geplande interacties mee waar relevant.",
  },
  "logistic-regression.predictors": {
    en: "Predictors means candidate predictors or model degrees of freedom. Prediction models should count all planned parameters, including categories and nonlinear terms.",
    id: "Prediktor berarti kandidat prediktor atau derajat kebebasan model. Model prediksi harus menghitung semua parameter yang direncanakan, termasuk kategori dan bentuk nonlinier.",
    nl: "Predictoren betekent kandidaat-predictoren of vrijheidsgraden van het model. Voorspelmodellen moeten alle geplande parameters tellen, inclusief categorieen en niet-lineaire termen.",
  },
  "logistic-regression.eventsPerPredictor": {
    en: "Events per predictor is a stability rule of thumb. 10 has been traditional; 15-20 is more conservative, and formal Riley/van Smeden methods are preferred for final prediction models.",
    id: "Kejadian per prediktor adalah aturan praktis untuk stabilitas model. Nilai 10 tradisional; 15-20 lebih konservatif, dan metode formal Riley/van Smeden lebih disukai untuk model prediksi akhir.",
    nl: "Events per predictor is een vuistregel voor stabiliteit. 10 is traditioneel; 15-20 is conservatiever, en formele Riley/van Smeden-methoden hebben de voorkeur voor definitieve voorspelmodellen.",
  },
  "logistic-regression.eventRate": {
    en: "Outcome event rate converts the required number of events into total sample size. Use the expected event prevalence in the intended study population.",
    id: "Angka kejadian luaran mengubah jumlah kejadian yang diperlukan menjadi total besar sampel. Gunakan prevalensi kejadian yang diperkirakan pada populasi studi.",
    nl: "Het uitkomst-eventpercentage zet het benodigde aantal events om naar totale steekproefgrootte. Gebruik de verwachte eventprevalentie in de beoogde studiepopulatie.",
  },
};

function parameterGuidance(calculatorId: string, variableKey: string, language: Language) {
  const guidance = parameterGuidanceText[`${calculatorId}.${variableKey}`] ?? parameterGuidanceText[`common.${variableKey}`];
  return guidance?.[language] ?? guidance?.en ?? "";
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
    formula: "n_control = [Zα/2√((1+1/r)p̄q̄) + Zβ√(p1q1 + p2q2/r)]² / (p2-p1)²; n_treatment = r×n_control",
    assumptions: ["Two-sided z-test approximation.", "Independent binary outcomes."],
    references: ["Fleiss JL, Levin B, Paik MC. Statistical Methods for Rates and Proportions.", "Chow SC et al. Sample Size Calculations in Clinical Research."],
    compute: (v) => {
      const p1 = pct(v.p1);
      const p2 = pct(v.p2);
      if (Math.abs(p2 - p1) < 1e-9) {
        return {
          primary: Number.POSITIVE_INFINITY,
          total: Number.POSITIVE_INFINITY,
          adjustedTotal: Number.POSITIVE_INFINITY,
          details: ["Control and treatment proportions are equal; choose a clinically meaningful difference to estimate sample size."],
        };
      }
      const { control, treatment, total } = twoProportionSampleSize(p1, p2, v.ratio, v.alpha, v.power);
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
      if (Math.abs(p1 - p0) < 1e-9) {
        return {
          primary: Number.POSITIVE_INFINITY,
          total: Number.POSITIVE_INFINITY,
          adjustedTotal: Number.POSITIVE_INFINITY,
          details: ["Target proportion equals the benchmark; choose a clinically meaningful difference to estimate sample size."],
        };
      }
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
      const unexposedRisk = pct(v.p0);
      const exposedRisk = Math.min(0.98, unexposedRisk * v.rr);
      if (Math.abs(exposedRisk - unexposedRisk) < 1e-9) {
        return {
          primary: Number.POSITIVE_INFINITY,
          total: Number.POSITIVE_INFINITY,
          adjustedTotal: Number.POSITIVE_INFINITY,
          details: ["Risk ratio is 1.0, so no risk difference is available for sample size planning."],
        };
      }
      const { control, treatment, total } = twoProportionSampleSize(unexposedRisk, exposedRisk, v.ratio, v.alpha, v.power);
      return {
        primary: total,
        perGroup: control,
        total,
        adjustedTotal: dropoutInflation(total, v.dropout),
        details: [`Unexposed n = ${control}; exposed n = ${treatment}`, `Implied exposed risk = ${(exposedRisk * 100).toFixed(1)}%`],
      };
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
      const controlExposure = pct(v.p0);
      const caseExposure = (v.or * controlExposure) / (1 - controlExposure + v.or * controlExposure);
      if (Math.abs(caseExposure - controlExposure) < 1e-9) {
        return {
          primary: Number.POSITIVE_INFINITY,
          total: Number.POSITIVE_INFINITY,
          adjustedTotal: Number.POSITIVE_INFINITY,
          details: ["Odds ratio is 1.0, so no exposure difference is available for sample size planning."],
        };
      }
      const { control: cases, treatment: controls, total } = twoProportionSampleSize(caseExposure, controlExposure, v.ratio, v.alpha, v.power);
      return {
        primary: total,
        perGroup: cases,
        total,
        adjustedTotal: dropoutInflation(total, v.dropout),
        details: [`Cases n = ${cases}; controls n = ${controls}`, `Implied case exposure = ${(caseExposure * 100).toFixed(1)}%`],
      };
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

const mostUsedCalculatorIds = new Set([
  "two-proportions",
  "prevalence",
  "diagnostic-sensitivity",
  "diagnostic-specificity",
  "survival",
  "two-means",
  "case-control",
  "one-proportion-test",
  "paired-mean",
  "cohort-rr",
  "equivalence-means",
]);

const categories = ["All", "Most used", ...Array.from(new Set(calculators.map((calculator) => calculator.category)))];

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
  if (!Number.isFinite(value)) return "Not estimable";
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

function parseStrata(rawStrata: string) {
  const strata = rawStrata
    .split(/[\n,]+/)
    .map((stratum) => stratum.trim())
    .filter(Boolean);
  return strata.length ? strata : ["All participants"];
}

function makeBalancedPool(groups: string[], count: number) {
  return Array.from({ length: count }, (_, index) => groups[index % groups.length]);
}

function normaliseBlockSize(blockSize: number, groupCount: number) {
  const groups = Math.max(1, groupCount);
  const requested = Math.max(groups, Math.round(blockSize));
  return Math.ceil(requested / groups) * groups;
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
    const normalisedBlockSize = normaliseBlockSize(blockSize, groups.length);
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

function generateStratifiedRandomisation(
  subjectCount: number,
  groups: string[],
  strata: string[],
  method: RandomisationMethod,
  blockSize: number,
  seed: string,
) {
  let subject = 1;
  return strata.flatMap((stratum, stratumIndex) => {
    const base = Math.floor(subjectCount / strata.length);
    const remainder = subjectCount % strata.length;
    const stratumCount = base + (stratumIndex < remainder ? 1 : 0);
    const assignments = generateRandomisation(stratumCount, groups, method, blockSize, `${seed}-${stratum}`);
    return assignments.map((assignment) => ({
      ...assignment,
      subject: subject++,
      stratum,
    }));
  });
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

const blindingGuide = [
  "Decide who must be blinded: participants, clinicians, outcome assessors, data analysts, or adjudication committee.",
  "Separate roles so the person generating the sequence is not the person recruiting participants.",
  "Use allocation concealment until assignment: central randomisation, pharmacy-controlled allocation, secure database release, or sequentially numbered opaque sealed envelopes.",
  "For sealed envelopes, use tamper-evident opaque envelopes, identical size and weight, sequential numbering, signatures across seals, and a log of opening date/time.",
  "Document emergency unblinding criteria before recruitment starts and keep every unblinding event in the audit file.",
  "For open-label studies, blind outcome assessment and data analysis when possible.",
];

const concealmentMethodLabels: Record<ConcealmentMethod, string> = {
  central: "Central randomisation or secure database",
  pharmacy: "Pharmacy-controlled allocation",
  envelopes: "Sequentially numbered opaque sealed envelopes",
  open: "Open list or no allocation concealment",
};

const sequenceHolderLabels: Record<SequenceHolder, string> = {
  statistician: "Independent statistician",
  pharmacy: "Study pharmacy",
  system: "Secure randomisation system",
  investigator: "Principal investigator",
};

const checklistGuides: Record<ChecklistKey, { title: string; guideline: string; link: string; items: string[] }> = {
  trial: {
    title: "Randomised trial",
    guideline: "CONSORT for trial reports; SPIRIT for trial protocols.",
    link: "https://www.consort-spirit.org/",
    items: ["Trial design and allocation ratio", "Eligibility criteria and settings", "Interventions with enough detail to replicate", "Sequence generation and allocation concealment", "Blinding and outcome assessment", "Primary/secondary outcomes", "Sample size justification", "Participant flow", "Harms and protocol deviations"],
  },
  observational: {
    title: "Observational study",
    guideline: "STROBE for cohort, case-control, and cross-sectional studies.",
    link: "https://www.strobe-statement.org/",
    items: ["Study design in title/abstract", "Setting and dates", "Participants and eligibility", "Variables and data sources", "Bias handling", "Study size rationale", "Statistical methods", "Descriptive data and missing data", "Limitations and generalisability"],
  },
  "systematic-review": {
    title: "Systematic review",
    guideline: "PRISMA for systematic reviews and meta-analyses.",
    link: "https://www.prisma-statement.org/",
    items: ["Protocol registration", "Eligibility criteria", "Information sources and search strategy", "Selection process", "Data collection process", "Risk of bias assessment", "Synthesis methods", "Study selection flow", "Certainty of evidence"],
  },
  diagnostic: {
    title: "Diagnostic/prognostic accuracy",
    guideline: "STARD for diagnostic accuracy; TRIPOD for prediction models.",
    link: "https://www.equator-network.org/library/",
    items: ["Clinical role of the index test", "Reference standard", "Participant sampling", "Eligibility and setting", "Blinding between index and reference tests", "Indeterminate/missing results", "Accuracy estimates with precision", "Model specification when prediction is involved"],
  },
  protocol: {
    title: "Study protocol",
    guideline: "SPIRIT for clinical trial protocols; PRISMA-P for review protocols.",
    link: "https://www.equator-network.org/library/",
    items: ["Administrative details", "Rationale and objectives", "Eligibility criteria", "Interventions/exposures", "Outcomes", "Sample size", "Recruitment plan", "Randomisation/blinding if applicable", "Data management and monitoring", "Ethics and dissemination"],
  },
  "case-report": {
    title: "Case report",
    guideline: "CARE for clinical case reports.",
    link: "https://www.care-statement.org/",
    items: ["Patient information", "Clinical findings", "Timeline", "Diagnostic assessment", "Therapeutic intervention", "Follow-up and outcomes", "Patient perspective", "Informed consent"],
  },
  qualitative: {
    title: "Qualitative research",
    guideline: "COREQ or SRQR for qualitative studies.",
    link: "https://bmjopen.bmj.com/content/bmjopen/15/10/e104236/DC2/embed/inline-supplementary-material-2.pdf?download=true",
    items: ["Research team and reflexivity", "Study design and theoretical framework", "Sampling strategy", "Setting and participants", "Data collection", "Data analysis", "Themes and quotations", "Trustworthiness and limitations"],
  },
  "quality-improvement": {
    title: "Quality improvement",
    guideline: "SQUIRE for healthcare improvement studies.",
    link: "https://www.equator-network.org/library/",
    items: ["Local problem", "Available knowledge", "Rationale", "Intervention description", "Study of the intervention", "Measures", "Context", "Results over time", "Sustainability and limitations"],
  },
  economic: {
    title: "Economic evaluation",
    guideline: "CHEERS for health economic evaluations.",
    link: "https://www.equator-network.org/library/",
    items: ["Perspective", "Comparators", "Time horizon", "Discount rate", "Choice of outcomes", "Measurement and valuation", "Resource costs", "Analytical methods", "Uncertainty and heterogeneity"],
  },
  "prediction-model": {
    title: "Prediction model",
    guideline: "TRIPOD for prediction model development and validation.",
    link: "https://www.tripod-statement.org/",
    items: ["Source of data", "Participants", "Outcome definition", "Predictor handling", "Sample size rationale", "Missing data", "Model development", "Performance measures", "Internal/external validation", "Model presentation"],
  },
  arrive: {
    title: "Animal research",
    guideline: "ARRIVE for in vivo animal experiments.",
    link: "https://arriveguidelines.org/",
    items: ["Study design and experimental unit", "Animal species, strain, sex, and age", "Housing and husbandry", "Sample size rationale", "Randomisation and blinding", "Experimental procedures", "Outcome measures", "Statistical methods", "Ethical statement"],
  },
  entreq: {
    title: "Qualitative evidence synthesis",
    guideline: "ENTREQ for syntheses of qualitative research.",
    link: "https://www.equator-network.org/reporting-guidelines/entreq/",
    items: ["Aim and synthesis approach", "Search strategy", "Study screening and selection", "Appraisal approach", "Data extraction", "Coding and theme development", "Synthesis findings", "Researcher reflexivity", "Limitations"],
  },
  srqr: {
    title: "Qualitative research",
    guideline: "SRQR for qualitative research reports.",
    link: "https://bmjopen.bmj.com/content/bmjopen/15/10/e104236/DC2/embed/inline-supplementary-material-2.pdf?download=true",
    items: ["Qualitative approach and research paradigm", "Researcher characteristics and reflexivity", "Context and setting", "Sampling strategy", "Ethical issues", "Data collection methods", "Data processing and analysis", "Techniques to enhance trustworthiness", "Synthesis and interpretation"],
  },
  stard: {
    title: "Diagnostic accuracy study",
    guideline: "STARD for diagnostic accuracy studies.",
    link: "https://www.equator-network.org/reporting-guidelines/stard/",
    items: ["Clinical role of the index test", "Eligibility criteria and sampling", "Index test and reference standard", "Test operator training", "Blinding between tests", "Indeterminate or missing results", "Accuracy estimates with precision", "Adverse events if relevant"],
  },
  remark: {
    title: "Prognostic tumour marker study",
    guideline: "REMARK for tumour marker prognostic studies.",
    link: "https://www.equator-network.org/reporting-guidelines/remark/",
    items: ["Patient population and treatments", "Specimen characteristics", "Assay methods", "Marker prespecification", "Clinical endpoints", "Statistical analysis plan", "Missing data handling", "Prognostic estimates and uncertainty"],
  },
  moose: {
    title: "Meta-analysis of observational studies",
    guideline: "MOOSE for meta-analyses of observational studies.",
    link: "https://www.equator-network.org/reporting-guidelines/meta-analysis-of-observational-studies-in-epidemiology-a-proposal-for-reporting-meta-analysis-of-observational-studies-in-epidemiology-moose-group/",
    items: ["Background and rationale", "Search strategy", "Eligibility criteria", "Data extraction", "Assessment of study quality and bias", "Quantitative synthesis methods", "Heterogeneity assessment", "Sensitivity analyses", "Limitations"],
  },
  "equator-library": {
    title: "Search EQUATOR library",
    guideline: "No single common checklist was identified; search the EQUATOR library for a design-specific checklist.",
    link: "https://www.equator-network.org/library/",
    items: ["Study design name", "Health area or specialty", "Population or material studied", "Primary outcome or objective", "Analysis approach", "Existing protocol or registry entry", "Any discipline-specific reporting requirements"],
  },
};

const checklistTreeQuestions: Record<string, ChecklistTreeQuestion> = {
  humans: {
    id: "humans",
    prompt: "Was the research on humans?",
    yes: "quantitative",
    no: "animals",
  },
  animals: {
    id: "animals",
    prompt: "Was your research on animals in the lab?",
    yes: "arrive",
    no: "equator-library",
  },
  quantitative: {
    id: "quantitative",
    prompt: "Did your research generate quantitative data?",
    yes: "combinedReview",
    no: "qualReview",
  },
  qualReview: {
    id: "qualReview",
    prompt: "Did you pool the results of previous studies in a review?",
    yes: "entreq",
    no: "caseSeries",
  },
  combinedReview: {
    id: "combinedReview",
    prompt: "Did you combine and analyse the results of previous studies?",
    yes: "observationalReview",
    no: "randomizedTrial",
  },
  observationalReview: {
    id: "observationalReview",
    prompt: "Is it a review of observational cohort, case-control, or cross-sectional studies?",
    yes: "moose",
    no: "systematic-review",
  },
  randomizedTrial: {
    id: "randomizedTrial",
    prompt: "Was your study a randomized trial comparing two or more health interventions?",
    yes: "trial",
    no: "caseSeries",
  },
  caseSeries: {
    id: "caseSeries",
    prompt: "Do you describe a clinical case or a series of cases?",
    yes: "case-report",
    no: "exposureOutcome",
  },
  exposureOutcome: {
    id: "exposureOutcome",
    prompt: "Did your study explore the relationship between exposure to risk or protective factors and outcomes?",
    yes: "observational",
    no: "diagnosticAccuracy",
  },
  diagnosticAccuracy: {
    id: "diagnosticAccuracy",
    prompt: "Did you compare the accuracy of a new or alternative diagnostic test against an established reference standard?",
    yes: "stard",
    no: "biomarker",
  },
  biomarker: {
    id: "biomarker",
    prompt: "Did the study evaluate the prognostic value of one or more biomarkers?",
    yes: "remark",
    no: "prediction",
  },
  prediction: {
    id: "prediction",
    prompt: "Did the research develop, validate, or update a general prediction model for diagnosis or prognosis?",
    yes: "prediction-model",
    no: "srqr",
  },
};

function makePdf(title: string, lines: string[]) {
  const escaped = lines.map((line) => line.replace(/[^\x20-\x7e]/g, "-").replace(/[()\\]/g, "\\$&"));
  const perPage = 39;
  return makeTextPdf(title, escaped, 10, 15, "Helvetica", perPage, 88);
}

function makeTablePdf(title: string, lines: string[]) {
  const escaped = lines.map((line) => line.replace(/[^\x20-\x7e]/g, "-").replace(/[()\\]/g, "\\$&"));
  return makeTextPdf(title, escaped, 7, 10, "Courier", 68, 106);
}

function wrapPdfLines(lines: string[], maxChars: number) {
  return lines.flatMap((line) => {
    if (line.length <= maxChars) return [line];
    const wrapped: string[] = [];
    let remaining = line;
    const indent = line.match(/^\d+\.\s/) ? "   " : "";

    while (remaining.length > maxChars) {
      const breakAt = remaining.lastIndexOf(" ", maxChars);
      const sliceAt = breakAt > Math.floor(maxChars * 0.6) ? breakAt : maxChars;
      wrapped.push(remaining.slice(0, sliceAt));
      remaining = `${indent}${remaining.slice(sliceAt).trimStart()}`;
    }
    wrapped.push(remaining);
    return wrapped;
  });
}

function makeTextPdf(title: string, escapedLines: string[], fontSize: number, lineHeight: number, font: string, perPage: number, maxChars: number) {
  const wrappedLines = wrapPdfLines(escapedLines, maxChars);
  const chunks = Array.from({ length: Math.ceil(wrappedLines.length / perPage) }, (_, index) =>
    wrappedLines.slice(index * perPage, index * perPage + perPage),
  );
  const objects = ["<< /Type /Catalog /Pages 2 0 R >>", "", `<< /Type /Font /Subtype /Type1 /BaseFont /${font} >>`];
  const pageObjectIds: number[] = [];

  chunks.forEach((chunk, pageIndex) => {
    const pageObjectId = objects.length + 1;
    const contentObjectId = objects.length + 2;
    pageObjectIds.push(pageObjectId);
    const text = [
      `BT /F1 18 Tf 54 770 Td (${title}) Tj`,
      `/F1 9 Tf 0 -18 Td (Page ${pageIndex + 1} of ${chunks.length}) Tj`,
      `/F1 ${fontSize} Tf 0 -22 Td`,
    ];
    chunk.forEach((line) => text.push(`(${line}) Tj 0 -${lineHeight} Td`));
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

function tableLines(headers: string[], rows: string[][], widths: number[]) {
  const fit = (value: string, width: number) => {
    const normalised = value.replace(/[^\x20-\x7e]/g, "-");
    return normalised.length > width ? `${normalised.slice(0, Math.max(0, width - 1))}.` : normalised.padEnd(width, " ");
  };
  const renderRow = (cells: string[]) => cells.map((cell, index) => fit(cell, widths[index])).join(" | ");
  return [
    renderRow(headers),
    widths.map((width) => "-".repeat(width)).join("-|-"),
    ...rows.map(renderRow),
  ];
}

export function SampleSizeApp() {
  const [language, setLanguage] = useState<Language>(() => {
    if (typeof window === "undefined") return "en";
    const saved = window.localStorage.getItem("studysize-language");
    return saved === "id" || saved === "nl" || saved === "en" ? saved : "en";
  });
  const [mode, setMode] = useState<AppMode>("finder");
  const [activeCategory, setActiveCategory] = useState("All");
  const [activeId, setActiveId] = useState(calculators[0].id);
  const [decisionAnswers, setDecisionAnswers] = useState<DecisionAnswers>({});
  const [randomSubjectCount, setRandomSubjectCount] = useState(60);
  const [randomGroups, setRandomGroups] = useState("Intervention, Control");
  const [randomStrata, setRandomStrata] = useState("All participants");
  const [randomMethod, setRandomMethod] = useState<RandomisationMethod>("simple");
  const [randomBlockSize, setRandomBlockSize] = useState(4);
  const [randomSeed, setRandomSeed] = useState("STUDY-2026");
  const [blindParticipants, setBlindParticipants] = useState(false);
  const [blindCareProviders, setBlindCareProviders] = useState(false);
  const [blindOutcomeAssessors, setBlindOutcomeAssessors] = useState(true);
  const [blindDataAnalysts, setBlindDataAnalysts] = useState(true);
  const [concealmentMethod, setConcealmentMethod] = useState<ConcealmentMethod>("central");
  const [sequenceHolder, setSequenceHolder] = useState<SequenceHolder>("statistician");
  const [checklistType, setChecklistType] = useState<ChecklistKey>("trial");
  const [checklistTreeAnswers, setChecklistTreeAnswers] = useState<ChecklistTreeAnswers>({});
  const [showCitationModal, setShowCitationModal] = useState(false);
  const [showProtocolModal, setShowProtocolModal] = useState(false);
  const [showScenarioModal, setShowScenarioModal] = useState(false);
  const [valuesByCalculator, setValuesByCalculator] = useState<Record<string, Values>>(() =>
    Object.fromEntries(calculators.map((calculator) => [calculator.id, initialValues(calculator)])),
  );
  const [scenarios, setScenarios] = useState<Scenario[]>(() => {
    if (typeof window === "undefined") return [];
    const saved = window.localStorage.getItem("studysize-scenarios");
    return saved ? JSON.parse(saved) : [];
  });
  const [status, setStatus] = useState("");
  const [copiedNotice, setCopiedNotice] = useState("");

  useEffect(() => {
    document.documentElement.lang = language;
    window.localStorage.setItem("studysize-language", language);
  }, [language]);

  const calculator = calculators.find((item) => item.id === activeId) ?? calculators[0];
  const values = valuesByCalculator[calculator.id] ?? initialValues(calculator);
  const result = useMemo(() => calculator.compute(values), [calculator, values]);
  const filtered = calculators.filter((item) =>
    activeCategory === "All" || (activeCategory === "Most used" ? mostUsedCalculatorIds.has(item.id) : item.category === activeCategory),
  );
  const planningAssumptionsText = calculator.variables
    .map((variable) => `${t(variable.label, language)} ${values[variable.key]}${variable.suffix ?? ""}`)
    .join("; ");
  const currentDecisionQuestion = getCurrentDecisionQuestion(decisionAnswers);
  const recommendation = decisionResult(decisionAnswers);
  const randomisedGroups = useMemo(() => parseGroups(randomGroups), [randomGroups]);
  const randomisationStrata = useMemo(() => parseStrata(randomStrata), [randomStrata]);
  const effectiveBlockSize = normaliseBlockSize(randomBlockSize, randomisedGroups.length);
  const randomisationAssignments = useMemo(
    () =>
      generateStratifiedRandomisation(
        randomSubjectCount,
        randomisedGroups,
        randomisationStrata,
        randomMethod,
        effectiveBlockSize,
        randomSeed,
      ),
    [randomSubjectCount, randomisedGroups, randomisationStrata, randomMethod, effectiveBlockSize, randomSeed],
  );
  const randomisationCounts = randomisationAssignments.reduce<Record<string, number>>((counts, assignment) => {
    counts[assignment.group] = (counts[assignment.group] ?? 0) + 1;
    return counts;
  }, {});
  const randomisationMethodName =
    randomMethod === "block"
      ? language === "id"
        ? "randomisasi blok permutasi"
        : language === "nl"
          ? "gepermuteerde blokrandomisatie"
          : "permuted block randomisation"
      : language === "id"
        ? "randomisasi seimbang sederhana"
        : language === "nl"
          ? "eenvoudige gebalanceerde randomisatie"
          : "simple balanced randomisation";
  const stratumDescription =
    randomisationStrata.length === 1 && randomisationStrata[0] === "All participants"
      ? language === "id"
        ? "tanpa stratifikasi"
        : language === "nl"
          ? "zonder stratificatie"
          : "without stratification"
      : language === "id"
        ? `distratifikasi berdasarkan ${randomisationStrata.join(", ")}`
        : language === "nl"
          ? `gestratificeerd naar ${randomisationStrata.join(", ")}`
          : `stratified by ${randomisationStrata.join(", ")}`;
  const blindedRoleLabels = [
    blindParticipants ? "Participants" : "",
    blindCareProviders ? "Care providers" : "",
    blindOutcomeAssessors ? "Outcome assessors" : "",
    blindDataAnalysts ? "Data analysts" : "",
  ].filter(Boolean);
  const translatedBlindedRoles = blindedRoleLabels.map((role) => t(role, language).toLowerCase());
  const researcherLayerBlinded = blindCareProviders || blindOutcomeAssessors;
  const blindingClassification =
    !blindParticipants
      ? "Open-label"
      : !researcherLayerBlinded
        ? "Single-blinded"
        : blindDataAnalysts
          ? "Triple-blinded"
          : "Double-blinded";
  const blindingClassificationDetail =
    blindingClassification === "Open-label"
      ? "Participants are not blinded; any blinded researcher, outcome-assessor, or data-analysis role should be reported separately."
      : blindingClassification === "Single-blinded"
        ? "Participants are blinded; researchers, investigators, and data collectors are not blinded."
        : blindingClassification === "Double-blinded"
          ? "Participants and researchers, investigators, or data collectors are blinded; data analysts are not blinded."
          : "Participants, researchers, investigators or data collectors, and data analysts are blinded.";
  const blindedRoleSentence =
    translatedBlindedRoles.length === 0
      ? ""
      : language === "id"
        ? ` Pihak berikut tetap dibutakan terhadap alokasi perlakuan dan harus dilaporkan secara eksplisit: ${translatedBlindedRoles.join(", ")}.`
        : language === "nl"
          ? ` De volgende partijen blijven geblindeerd voor behandelallocatie en moeten expliciet worden gerapporteerd: ${translatedBlindedRoles.join(", ")}.`
          : ` The following parties remain blinded to treatment allocation and should be reported explicitly: ${translatedBlindedRoles.join(", ")}.`;
  const randomisationWording =
    language === "id"
      ? [
          `Randomisasi akan dilakukan sebelum rekrutmen dimulai dengan menggunakan ${randomisationMethodName} ${stratumDescription}, dan peserta akan dialokasikan ke ${randomisedGroups.join(" atau ")} sesuai urutan yang telah dibuat.`,
          randomMethod === "block"
            ? `Ukuran blok yang digunakan adalah ${effectiveBlockSize}; informasi ini sebaiknya tidak diketahui oleh personel yang terlibat dalam rekrutmen agar alokasi berikutnya tidak dapat diprediksi.`
            : "Urutan dibuat sebagai urutan acak seimbang untuk mempertahankan distribusi alokasi yang sebanding antar kelompok.",
          `Daftar randomisasi berisi ${randomSubjectCount} slot dan dibuat dengan seed terdokumentasi "${randomSeed || "studysize-studio"}", sehingga proses pembuatan urutan dapat diaudit bila diperlukan.`,
          "Alokasi sebaiknya dibuka hanya setelah kriteria kelayakan terpenuhi dan persetujuan tindakan selesai, dengan penyembunyian alokasi dipertahankan sampai peserta ditetapkan ke kelompok studi.",
        ].join(" ")
      : language === "nl"
        ? [
            `Randomisatie wordt vóór de start van de inclusie uitgevoerd met ${randomisationMethodName} ${stratumDescription}, waarna deelnemers volgens de gegenereerde reeks worden toegewezen aan ${randomisedGroups.join(" of ")}.`,
            randomMethod === "block"
              ? `De toegepaste blokgrootte is ${effectiveBlockSize}; deze informatie dient verborgen te blijven voor personen die deelnemers includeren, zodat toekomstige toewijzingen niet voorspelbaar worden.`
              : "De reeks wordt gegenereerd als een gebalanceerde geschudde reeks om een vergelijkbare verdeling over de groepen te ondersteunen.",
            `De randomisatielijst bevat ${randomSubjectCount} slots en wordt gegenereerd met de gedocumenteerde seed "${randomSeed || "studysize-studio"}", zodat het genereren van de reeks indien nodig kan worden gecontroleerd.`,
            "Toewijzing dient pas te worden vrijgegeven nadat geschiktheid is bevestigd en geïnformeerde toestemming is afgerond, waarbij allocatieconcealment tot het moment van toewijzing behouden blijft.",
          ].join(" ")
        : [
            `Randomisation will be performed before recruitment using ${randomisationMethodName} ${stratumDescription}, with participants assigned to ${randomisedGroups.join(" or ")} according to the generated allocation sequence.`,
            randomMethod === "block"
              ? `A block size of ${effectiveBlockSize} will be used; this information should remain concealed from personnel involved in recruitment to prevent prediction of future assignments.`
              : "The sequence will be generated as a balanced shuffled list to support comparable allocation across study groups.",
            `The randomisation list will contain ${randomSubjectCount} allocation slots and will be generated with the documented seed "${randomSeed || "studysize-studio"}", allowing the sequence-generation process to be audited if required.`,
            "Allocation should be released only after eligibility has been confirmed and informed consent has been completed, with allocation concealment maintained until the point of assignment.",
          ].join(" ");
  const blindingWording =
    language === "id"
      ? blindingClassification === "Open-label"
        ? `Studi ini akan menggunakan desain label terbuka karena peserta tidak dibutakan terhadap alokasi intervensi.${blindedRoleSentence} Meskipun demikian, risiko bias seleksi tetap harus dikendalikan melalui penyembunyian alokasi menggunakan ${t(concealmentMethodLabels[concealmentMethod], language).toLowerCase()}. Urutan alokasi akan dipegang oleh ${t(sequenceHolderLabels[sequenceHolder], language).toLowerCase()} dan hanya dibuka setelah kelayakan serta persetujuan peserta dikonfirmasi.`
        : `Studi ini direncanakan sebagai studi ${t(blindingClassification, language).toLowerCase()}, dengan pembutaan terhadap alokasi intervensi diterapkan pada ${translatedBlindedRoles.join(", ")}. Untuk mengurangi risiko bias seleksi, penyembunyian alokasi akan dipertahankan menggunakan ${t(concealmentMethodLabels[concealmentMethod], language).toLowerCase()}, dan urutan alokasi akan dipegang oleh ${t(sequenceHolderLabels[sequenceHolder], language).toLowerCase()} sampai kelayakan serta persetujuan peserta dikonfirmasi. Prosedur pembukaan pembutaan darurat, bila diperlukan, harus ditetapkan sebelumnya dan setiap kejadian pembukaan pembutaan harus dicatat dalam berkas studi.`
      : language === "nl"
        ? blindingClassification === "Open-label"
          ? `Deze studie wordt uitgevoerd als een open-label studie, omdat deelnemers niet worden geblindeerd voor de interventietoewijzing.${blindedRoleSentence} Het risico op selectiebias dient desondanks te worden beperkt door allocatieconcealment met ${t(concealmentMethodLabels[concealmentMethod], language).toLowerCase()}. De allocatiereeks wordt beheerd door ${t(sequenceHolderLabels[sequenceHolder], language).toLowerCase()} en wordt pas vrijgegeven nadat geschiktheid en geïnformeerde toestemming zijn bevestigd.`
          : `Deze studie wordt opgezet als een ${t(blindingClassification, language).toLowerCase()} studie, waarbij ${translatedBlindedRoles.join(", ")} geblindeerd blijven voor de interventietoewijzing. Om selectiebias te beperken, wordt allocatieconcealment behouden met ${t(concealmentMethodLabels[concealmentMethod], language).toLowerCase()}, en wordt de allocatiereeks beheerd door ${t(sequenceHolderLabels[sequenceHolder], language).toLowerCase()} totdat geschiktheid en geïnformeerde toestemming zijn bevestigd. Procedures voor noodontblindering moeten vooraf worden vastgelegd, en elke ontblindering dient in het studiedossier te worden gedocumenteerd.`
        : blindingClassification === "Open-label"
          ? `This study will be conducted as an open-label study because participants will not be blinded to intervention allocation.${blindedRoleSentence} Nevertheless, selection bias should be limited by maintaining allocation concealment through ${concealmentMethodLabels[concealmentMethod].toLowerCase()}. The allocation sequence will be held by ${sequenceHolderLabels[sequenceHolder].toLowerCase()} and released only after eligibility and informed consent have been confirmed.`
          : `This study is planned as a ${blindingClassification.toLowerCase()} study, with ${translatedBlindedRoles.join(", ")} blinded to intervention allocation. To reduce the risk of selection bias, allocation concealment will be maintained using ${t(concealmentMethodLabels[concealmentMethod], language).toLowerCase()}, and the allocation sequence will be held by ${t(sequenceHolderLabels[sequenceHolder], language).toLowerCase()} until eligibility and informed consent have been confirmed. Emergency unblinding procedures should be prespecified, and any unblinding events should be documented in the study file.`;
  const decisionPath = decisionOrder
    .filter((id) => decisionAnswers[id])
    .map((id) => {
      const question = decisionQuestions[id];
      const answer = question.options.find((option) => option.value === decisionAnswers[id]);
      return { question: question.prompt, answer: answer?.label ?? decisionAnswers[id] };
    });
  const checklist = checklistGuides[checklistType];
  const checklistTreePath = useMemo(() => {
    const path: { question: ChecklistTreeQuestion; answer: boolean }[] = [];
    let currentId = "humans";
    const visited = new Set<string>();

    while (currentId && checklistTreeQuestions[currentId] && checklistTreeAnswers[currentId] !== undefined && !visited.has(currentId)) {
      visited.add(currentId);
      const question = checklistTreeQuestions[currentId];
      const answer = checklistTreeAnswers[currentId];
      path.push({ question, answer });
      const next = answer ? question.yes : question.no;
      if (!next || checklistGuides[next as ChecklistKey]) break;
      currentId = next;
    }

    return path;
  }, [checklistTreeAnswers]);
  const currentChecklistTreeQuestion = useMemo(() => {
    let currentId = "humans";
    const visited = new Set<string>();

    while (currentId && checklistTreeQuestions[currentId] && !visited.has(currentId)) {
      visited.add(currentId);
      const question = checklistTreeQuestions[currentId];
      const answer = checklistTreeAnswers[currentId];
      if (answer === undefined) return question;
      const next = answer ? question.yes : question.no;
      if (!next || checklistGuides[next as ChecklistKey]) return undefined;
      currentId = next;
    }

    return undefined;
  }, [checklistTreeAnswers]);
  const protocolText =
    language === "id"
      ? [
          `Perhitungan besar sampel dilakukan untuk desain ${t(calculator.title, language).toLowerCase()} dengan bantuan StudySize Studio.`,
          `Perencanaan didasarkan pada parameter berikut: ${planningAssumptionsText}.`,
          `Dengan asumsi tersebut, jumlah sampel minimum yang dibutuhkan adalah ${formatNumber(result.total ?? result.primary)} sebelum memperhitungkan dropout, data hilang, atau data yang tidak dapat dievaluasi.`,
          `Setelah penyesuaian terhadap kehilangan data yang diperkirakan, jumlah sampel yang direncanakan menjadi ${formatNumber(result.adjustedTotal)}.`,
          `Estimasi ini menggunakan pendekatan ${calculator.formula}; asumsi interpretasi utama adalah: ${calculator.assumptions.map((item) => t(item, language)).join(" ")}`,
        ].join(" ")
      : language === "nl"
        ? [
            `De steekproefgrootte werd berekend voor een ${t(calculator.title, language).toLowerCase()} ontwerp met behulp van StudySize Studio.`,
            `De berekening was gebaseerd op de volgende planningsparameters: ${planningAssumptionsText}.`,
            `Onder deze aannames zijn minimaal ${formatNumber(result.total ?? result.primary)} deelnemers of observaties nodig vóór correctie voor uitval, ontbrekende gegevens of niet-evalueerbare metingen.`,
            `Na correctie voor het verwachte verlies aan bruikbare gegevens bedraagt de geplande steekproefgrootte ${formatNumber(result.adjustedTotal)}.`,
            `De schatting is gebaseerd op de benadering ${calculator.formula}; de belangrijkste interpretatieve aannames zijn: ${calculator.assumptions.map((item) => t(item, language)).join(" ")}`,
          ].join(" ")
      : [
          `Sample size was estimated for a ${calculator.title.toLowerCase()} design using StudySize Studio.`,
          `The calculation was based on the following planning parameters: ${planningAssumptionsText}.`,
          `Under these assumptions, a minimum of ${formatNumber(result.total ?? result.primary)} participants or observations is required before accounting for dropout, missing data, or non-evaluable measurements.`,
          `After adjustment for the anticipated loss of usable data, the planned sample size is ${formatNumber(result.adjustedTotal)}.`,
          `This estimate uses the ${calculator.formula} approach; the main interpretive assumptions are: ${calculator.assumptions.join(" ")}`,
        ].join(" ");
  const citationFormats = [
    {
      label: "Vancouver",
      text: "Ryalino C. StudySize Studio [Internet]. 2026 [cited 2026 Jul 26]. Available from: https://sample-size-studio.ryalino.workers.dev",
    },
    {
      label: "PubMed/NLM",
      text: "Ryalino C. StudySize Studio [Internet]. 2026 [cited 2026 Jul 26]. Available from: https://sample-size-studio.ryalino.workers.dev",
    },
    {
      label: "MLA",
      text: "Ryalino, Christopher. StudySize Studio. 2026, https://sample-size-studio.ryalino.workers.dev. Accessed 26 July 2026.",
    },
    {
      label: "AMA",
      text: "Ryalino C. StudySize Studio. Published 2026. Accessed July 26, 2026. https://sample-size-studio.ryalino.workers.dev",
    },
    {
      label: "Harvard/APA",
      text: "Ryalino, C. (2026). StudySize Studio [Web application]. https://sample-size-studio.ryalino.workers.dev",
    },
  ];

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
    setStatus(t("Scenario saved", language));
    setShowScenarioModal(true);
  }

  function loadScenario(scenario: Scenario) {
    setActiveId(scenario.calculatorId);
    setActiveCategory(calculators.find((item) => item.id === scenario.calculatorId)?.category ?? "All");
    setValuesByCalculator((current) => ({ ...current, [scenario.calculatorId]: scenario.values }));
    setStatus(t("Scenario loaded", language));
  }

  function clearScenarios() {
    setScenarios([]);
    window.localStorage.removeItem("studysize-scenarios");
    setStatus(t("Scenarios cleared", language));
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
    setStatus(t("PDF downloaded", language));
  }

  function downloadRandomisationPdf() {
    const settingsRows = [
      ["Randomisation method", randomMethod === "block" ? "Permuted block randomisation" : "Simple balanced randomisation"],
      ["Subjects", String(randomSubjectCount)],
      ["Groups", randomisedGroups.join(", ")],
      ["Strata", randomisationStrata.join(", ")],
      ["Seed", randomSeed || "studysize-studio"],
      ["Block size", randomMethod === "block" ? String(effectiveBlockSize) : "Not used"],
    ];
    const countRows = Object.entries(randomisationCounts).map(([group, count]) => [group, String(count)]);
    const assignmentRows = randomisationAssignments.map((assignment) =>
      [
        String(assignment.subject),
        assignment.stratum ?? "All participants",
        assignment.group,
        assignment.block ? String(assignment.block) : "-",
      ],
    );
    const lines = [
      "Randomisation settings:",
      ...tableLines(["Setting", "Value"], settingsRows, [24, 74]),
      "",
      "Allocation counts:",
      ...tableLines(["Group", "Count"], countRows, [34, 10]),
      "",
      "Assignments:",
      ...tableLines(["Subject", "Stratum", "Group", "Block"], assignmentRows, [8, 30, 26, 7]),
      "",
      "Best-practice notes:",
      ...randomisationBestPractice.map((item, index) => `${index + 1}. ${item}`),
    ];
    const url = URL.createObjectURL(makeTablePdf("StudySize Studio Randomisation", lines));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "studysize-randomisation.pdf";
    anchor.click();
    URL.revokeObjectURL(url);
    setStatus(t("Randomisation PDF downloaded", language));
  }

  function downloadRandomisationLogPdf() {
    const recommendedRows = [
      ["1", "Screening ID"],
      ["2", "Study subject ID"],
      ["3", "Stratum"],
      ["4", "Eligibility confirmed"],
      ["5", "Consent completed"],
      ["6", "Randomisation date/time"],
      ["7", "Allocation"],
      ["8", "Person assigning allocation"],
      ["9", "Concealment method used"],
      ["10", "Envelope/database/randomisation code number"],
      ["11", "Protocol deviation notes"],
      ["12", "Withdrawal or replacement notes"],
      ["13", "Emergency unblinding date/time and reason"],
    ];
    const templateRows = randomisationAssignments.slice(0, 80).map((assignment) => [
      String(assignment.subject),
      assignment.stratum ?? "All participants",
      assignment.group,
      "___",
      "___",
      "___",
      "___",
      "___",
      "___",
    ]);
    const lines = [
      "Randomisation log template:",
      "",
      "Recommended columns:",
      ...tableLines(["No.", "Column"], recommendedRows, [4, 48]),
      "",
      "Template rows:",
      ...tableLines(
        ["Subject", "Stratum", "Allocation", "Eligible", "Consent", "Date/time", "Assigner", "Conceal", "Notes"],
        templateRows,
        [7, 18, 16, 8, 7, 10, 10, 10, 9],
      ),
      "",
      "Best-practice reminders:",
      ...randomisationBestPractice.map((item, index) => `${index + 1}. ${item}`),
    ];
    const url = URL.createObjectURL(makeTablePdf("StudySize Studio Randomisation Log", lines));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "studysize-randomisation-log-template.pdf";
    anchor.click();
    URL.revokeObjectURL(url);
    setStatus(t("Randomisation log PDF downloaded", language));
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

  function selectRecommendedCalculator(calculatorId: string) {
    const nextCalculator = calculators.find((item) => item.id === calculatorId);
    if (!nextCalculator) return;
    setActiveId(nextCalculator.id);
    setActiveCategory(nextCalculator.category);
    setMode("calculator");
    setStatus(t("Calculator selected from decision tree", language));
  }

  function copyProtocolWording() {
    void navigator.clipboard?.writeText(protocolText);
    setStatus(t("Protocol wording copied", language));
    showCopiedToast();
  }

  function copyCitation(text: string) {
    void navigator.clipboard?.writeText(text);
    setStatus(t("Citation copied", language));
    showCopiedToast();
  }

  function copyGeneratedWording(text: string, message: string) {
    void navigator.clipboard?.writeText(text);
    setStatus(t(message, language));
    showCopiedToast();
  }

  function showCopiedToast() {
    setCopiedNotice(t("Copied", language));
    window.setTimeout(() => setCopiedNotice(""), 1500);
  }

  function answerChecklistTree(questionId: string, answer: boolean) {
    const orderedPath = [...checklistTreePath.map((item) => item.question.id), questionId];
    const nextAnswers = Object.fromEntries(
      orderedPath
        .filter((id, index) => orderedPath.indexOf(id) === index)
        .map((id) => [id, id === questionId ? answer : checklistTreeAnswers[id]]),
    ) as ChecklistTreeAnswers;
    const question = checklistTreeQuestions[questionId];
    const next = answer ? question.yes : question.no;

    setChecklistTreeAnswers(nextAnswers);
    if (next && checklistGuides[next as ChecklistKey]) {
      setChecklistType(next as ChecklistKey);
      setStatus(`${t(checklistGuides[next as ChecklistKey].title, language)} ${
        language === "id" ? "dipilih" : language === "nl" ? "checklist geselecteerd" : "checklist selected"
      }`);
    }
  }

  function resetChecklistTree() {
    setChecklistTreeAnswers({});
    setStatus(t("Checklist tree reset", language));
  }

  return (
    <main className="app-shell">
      <div className="language-switcher" aria-label={t("Language selector", language)}>
        {languageOptions.map((option) => (
          <button
            aria-label={option.aria}
            className={language === option.code ? "active" : ""}
            key={option.code}
            type="button"
            onClick={() => setLanguage(option.code)}
            title={option.label}
          >
            <span aria-hidden="true">{option.flag}</span>
          </button>
        ))}
      </div>
      <section className="masthead" aria-labelledby="app-title">
        <div>
          <p className="eyebrow">{t("Your one-stop solution for medical research", language)}</p>
          <h1 id="app-title">StudySize Studio</h1>
          <button className="citation-button" type="button" onClick={() => setShowCitationModal(true)}>
            {t("How to cite us", language)}
          </button>
        </div>
      </section>

      <nav className="mode-tabs" aria-label={t("Main app modes", language)}>
        <button className={mode === "checklist" ? "active" : ""} type="button" onClick={() => setMode("checklist")}>
          {t("Study Design", language)}
        </button>
        <button className={mode === "finder" ? "active" : ""} type="button" onClick={() => setMode("finder")}>
          {t("Find my calculator", language)}
        </button>
        <button className={mode === "calculator" ? "active" : ""} type="button" onClick={() => setMode("calculator")}>
          {t("Calculator catalog", language)}
        </button>
        <button className={mode === "randomiser" ? "active" : ""} type="button" onClick={() => setMode("randomiser")}>
          {t("Randomiser", language)}
        </button>
        <button className={mode === "blinding" ? "active" : ""} type="button" onClick={() => setMode("blinding")}>
          {t("Blinding", language)}
        </button>
        <button className={mode === "scenario" ? "active" : ""} type="button" onClick={() => setMode("scenario")}>
          {t("Scenario Comparison", language)}
        </button>
      </nav>

      <section className={`workspace ${mode}-workspace`}>
        {mode === "calculator" && (
          <aside className="catalog" aria-label={t("Study design catalog", language)}>
            <div className="category-tabs" role="tablist" aria-label={t("Filter study designs", language)}>
              {categories.map((category) => (
                <button
                  className={activeCategory === category ? "active" : ""}
                  key={category}
                  onClick={() => setActiveCategory(category)}
                  type="button"
                >
                  {t(category, language)}
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
                  <span>{t(item.category, language)}</span>
                  <strong>{t(item.title, language)}</strong>
                  <small>{t(item.purpose, language)}</small>
                </button>
              ))}
            </div>
          </aside>
        )}

        {mode === "finder" ? (
          <section className="finder-panel" aria-labelledby="finder-title">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">{t("Decision support", language)}</p>
                <h2 id="finder-title">{t("Find my calculator", language)}</h2>
                <p>
                  {t("Answer a few study-design questions and the app will suggest the closest calculator, explain why, and flag when statistical review is important.", language)}
                </p>
              </div>
              <div className="actions">
                <button type="button" onClick={goBackDecision} disabled={decisionPath.length === 0}>
                  {t("Back", language)}
                </button>
                <button type="button" onClick={() => setDecisionAnswers({})}>
                  {t("Reset", language)}
                </button>
              </div>
            </div>

            <div className="decision-body">
              <div className="decision-card">
                {currentDecisionQuestion ? (
                  <>
                    <span>{t("Question", language)} {decisionPath.length + 1}</span>
                    <h3>{t(currentDecisionQuestion.prompt, language)}</h3>
                    <p>{t(currentDecisionQuestion.helper, language)}</p>
                    <div className="choice-grid">
                      {currentDecisionQuestion.options.map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => answerDecision(currentDecisionQuestion.id, option.value)}
                        >
                          <span className="choice-icon" aria-hidden="true">{decisionIcon(option.value)}</span>
                          <strong>{t(option.label, language)}</strong>
                          <small>{t(option.description, language)}</small>
                        </button>
                      ))}
                    </div>
                  </>
                ) : recommendation ? (
                  <>
                    <span>{t("Recommendation", language)}</span>
                    <h3>{t(recommendation.title, language)}</h3>
                    <p>{t(recommendation.explanation, language)}</p>
                    <div className="recommendation-grid">
                      <article>
                        <strong>{t("Assumptions to check", language)}</strong>
                        <ul>{recommendation.assumptions.map((item) => <li key={item}>{t(item, language)}</li>)}</ul>
                      </article>
                      <article>
                        <strong>{t("Warning flags", language)}</strong>
                        {recommendation.warnings.length === 0 ? (
                          <p>{t("No major warning flags based on these answers.", language)}</p>
                        ) : (
                          <ul>{recommendation.warnings.map((item) => <li key={item}>{t(item, language)}</li>)}</ul>
                        )}
                      </article>
                    </div>
                    {recommendation.calculatorId && (
                      <button
                        className="use-calculator"
                        type="button"
                        onClick={() => selectRecommendedCalculator(recommendation.calculatorId!)}
                      >
                        {t("Use this calculator", language)}
                      </button>
                    )}
                  </>
                ) : null}
              </div>

              <aside className="path-card" aria-label={t("Decision path", language)}>
                <span>{t("Decision path", language)}</span>
                {decisionPath.length === 0 ? (
                  <p>{t("No answers yet.", language)}</p>
                ) : (
                  <ol>
                    {decisionPath.map((step) => (
                      <li key={`${step.question}-${step.answer}`}>
                        <strong>{t(step.answer, language)}</strong>
                        <small>{t(step.question, language)}</small>
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
                <p className="eyebrow">{t("Allocation sequence", language)}</p>
                <h2 id="randomiser-title">{t("Subject randomiser", language)}</h2>
                <p>
                  {t("Generate a documented allocation sequence for standard individual randomisation, then export the settings, sequence, and best-practice notes as a PDF.", language)}
                </p>
              </div>
              <div className="actions">
                <button type="button" onClick={downloadRandomisationPdf}>{t("Download PDF", language)}</button>
                <button type="button" onClick={downloadRandomisationLogPdf}>{t("Log template PDF", language)}</button>
              </div>
            </div>

            <div className="randomiser-grid">
              <section className="randomiser-controls" aria-label={t("Randomiser settings", language)}>
                <label className="control">
                  <span>
                    <strong>{t("Number of subjects", language)}</strong>
                    <small>{t("Total number of randomisation slots to generate.", language)}</small>
                  </span>
                  <div className="input-row">
                    <input
                      aria-label={t("Number of subjects slider", language)}
                      max={500}
                      min={2}
                      onChange={(event) => setRandomSubjectCount(Number(event.target.value))}
                      step={1}
                      type="range"
                      value={randomSubjectCount}
                    />
                    <div className="number-wrap">
                      <input
                        aria-label={t("Number of subjects", language)}
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
                    <strong>{t("Groups", language)}</strong>
                    <small>{t("Separate treatment arms with commas or line breaks.", language)}</small>
                  </span>
                  <textarea
                    aria-label={t("Randomisation groups", language)}
                    onChange={(event) => setRandomGroups(event.target.value)}
                    rows={3}
                    value={randomGroups}
                  />
                </label>

                <label className="control">
                  <span>
                    <strong>{t("Strata", language)}</strong>
                    <small>{t("Optional. Separate sites or prognostic strata with commas or line breaks.", language)}</small>
                  </span>
                  <textarea
                    aria-label={t("Randomisation strata", language)}
                    onChange={(event) => setRandomStrata(event.target.value)}
                    rows={3}
                    value={randomStrata}
                  />
                </label>

                <label className="control">
                  <span>
                    <strong>{t("Method", language)}</strong>
                    <small>{t("Blocked randomisation helps preserve balance during recruitment.", language)}</small>
                  </span>
                  <select
                    aria-label={t("Randomisation method", language)}
                    onChange={(event) => setRandomMethod(event.target.value as RandomisationMethod)}
                    value={randomMethod}
                  >
                    <option value="block">{t("Permuted block", language)}</option>
                    <option value="simple">{t("Simple balanced", language)}</option>
                  </select>
                </label>

                <label className="control">
                  <span>
                    <strong>{t("Block size", language)}</strong>
                    <small>{t("Used only for permuted blocks; keep it concealed in open-label trials.", language)}</small>
                  </span>
                  <div className="input-row">
                    <input
                      aria-label={t("Block size slider", language)}
                      disabled={randomMethod !== "block"}
                      max={24}
                      min={randomisedGroups.length}
                      onChange={(event) => setRandomBlockSize(Number(event.target.value))}
                      step={1}
                      type="range"
                      value={effectiveBlockSize}
                    />
                    <div className="number-wrap">
                      <input
                        aria-label={t("Block size", language)}
                        disabled={randomMethod !== "block"}
                        max={24}
                        min={randomisedGroups.length}
                        onChange={(event) => setRandomBlockSize(Number(event.target.value))}
                        step={1}
                        type="number"
                        value={effectiveBlockSize}
                      />
                    </div>
                  </div>
                </label>

                <label className="control">
                  <span>
                    <strong>{t("Seed", language)}</strong>
                    <small>{t("Record this in the randomisation file to reproduce the sequence.", language)}</small>
                  </span>
                  <input
                    aria-label={t("Randomisation seed", language)}
                    onChange={(event) => setRandomSeed(event.target.value)}
                    type="text"
                    value={randomSeed}
                  />
                </label>
              </section>

              <section className="allocation-card" aria-label={t("Generated allocation", language)}>
                <div className="allocation-head">
                  <div>
                    <span>{t("Generated sequence", language)}</span>
                    <strong>{randomSubjectCount} {t("subjects", language)}</strong>
                  </div>
                  <div className="allocation-counts">
                    {Object.entries(randomisationCounts).map(([group, count]) => (
                      <span key={group}>{group}: {count}</span>
                    ))}
                  </div>
                </div>
                <div className="allocation-table" role="table" aria-label={t("Randomisation allocation table", language)}>
                  <div className="allocation-row heading" role="row">
                    <span>{t("Subject", language)}</span>
                    <span>{t("Assignment", language)}</span>
                    <span>{t("Stratum", language)}</span>
                    <span>{t("Block", language)}</span>
                  </div>
                  {randomisationAssignments.slice(0, 120).map((assignment) => (
                    <div className="allocation-row" key={assignment.subject} role="row">
                      <span>{assignment.subject}</span>
                      <strong>{assignment.group}</strong>
                      <span>{t(assignment.stratum ?? "All participants", language)}</span>
                      <span>{assignment.block ?? "—"}</span>
                    </div>
                  ))}
                </div>
                {randomisationAssignments.length > 120 && (
                  <p className="table-note">{t("Showing the first 120 assignments. The PDF includes the full sequence.", language)}</p>
                )}
              </section>
            </div>

            <section className="best-practice" aria-labelledby="best-practice-title">
              <div>
                <p className="eyebrow">{t("Best practice", language)}</p>
                <h3 id="best-practice-title">{t("How to conduct randomisation properly", language)}</h3>
                <p>
                  {t("Randomisation is not only the sequence. Good practice also requires allocation concealment, documented roles, and a clear audit trail from consent through assignment.", language)}
                </p>
              </div>
              <ol>
                {randomisationBestPractice.map((item) => <li key={item}>{t(item, language)}</li>)}
              </ol>
            </section>

          </section>
        ) : mode === "blinding" ? (
          <section className="blinding-panel" aria-labelledby="blinding-page-title">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">{t("Blinding setup", language)}</p>
                <h2 id="blinding-page-title">{t("Blinding", language)}</h2>
                <p>
                  {t("Classify blinding from the parties masked to allocation and generate manuscript wording that can be reviewed against CONSORT expectations.", language)}
                </p>
              </div>
            </div>

            <div className="blinding-grid">
              <section className="best-practice blinding-guide compact-guide" aria-labelledby="blinding-guide-title">
                <div>
                  <p className="eyebrow">{t("Blinding", language)}</p>
                  <h3 id="blinding-guide-title">{t("Blinding and allocation concealment guide", language)}</h3>
                  <p>
                    {t("The allocation sequence should be protected before assignment, and blinding should be planned around who can influence enrolment, treatment, assessment, or analysis.", language)}
                  </p>
                </div>
                <ol>
                  {blindingGuide.map((item) => <li key={item}>{t(item, language)}</li>)}
                </ol>
              </section>

              <section className="randomiser-controls blinding-controls" aria-label={t("Blinding inputs", language)}>
                <div className="control checkbox-control">
                  <span>
                    <strong>{t("Who was blinded?", language)}</strong>
                    <small>{t("Mask the parties who should not know the allocation before outcome interpretation or analysis.", language)}</small>
                  </span>
                  <div className="checkbox-grid">
                    <label className="check-option">
                      <input checked={blindParticipants} onChange={(event) => setBlindParticipants(event.target.checked)} type="checkbox" />
                      <span>
                        <strong>{t("Participants", language)}</strong>
                        <small>{t("Mask participants to allocation.", language)}</small>
                      </span>
                    </label>
                    <label className="check-option">
                      <input checked={blindCareProviders} onChange={(event) => setBlindCareProviders(event.target.checked)} type="checkbox" />
                      <span>
                        <strong>{t("Care providers", language)}</strong>
                        <small>{t("Mask care providers or interventionists to allocation.", language)}</small>
                      </span>
                    </label>
                    <label className="check-option">
                      <input checked={blindOutcomeAssessors} onChange={(event) => setBlindOutcomeAssessors(event.target.checked)} type="checkbox" />
                      <span>
                        <strong>{t("Outcome assessors", language)}</strong>
                        <small>{t("Mask outcome assessors to allocation.", language)}</small>
                      </span>
                    </label>
                    <label className="check-option">
                      <input checked={blindDataAnalysts} onChange={(event) => setBlindDataAnalysts(event.target.checked)} type="checkbox" />
                      <span>
                        <strong>{t("Data analysts", language)}</strong>
                        <small>{t("Mask data analysts to allocation.", language)}</small>
                      </span>
                    </label>
                  </div>
                </div>

                <label className="control">
                  <span>
                    <strong>{t("Allocation concealment method", language)}</strong>
                    <small>{t("Choose how the sequence is protected before assignment.", language)}</small>
                  </span>
                  <select
                    aria-label={t("Allocation concealment method", language)}
                    onChange={(event) => setConcealmentMethod(event.target.value as ConcealmentMethod)}
                    value={concealmentMethod}
                  >
                    <option value="central">{t(concealmentMethodLabels.central, language)}</option>
                    <option value="pharmacy">{t(concealmentMethodLabels.pharmacy, language)}</option>
                    <option value="envelopes">{t(concealmentMethodLabels.envelopes, language)}</option>
                    <option value="open">{t(concealmentMethodLabels.open, language)}</option>
                  </select>
                </label>

                <label className="control">
                  <span>
                    <strong>{t("Sequence holder", language)}</strong>
                    <small>{t("Document who generated, stored, and released the sequence.", language)}</small>
                  </span>
                  <select
                    aria-label={t("Sequence holder", language)}
                    onChange={(event) => setSequenceHolder(event.target.value as SequenceHolder)}
                    value={sequenceHolder}
                  >
                    <option value="statistician">{t(sequenceHolderLabels.statistician, language)}</option>
                    <option value="pharmacy">{t(sequenceHolderLabels.pharmacy, language)}</option>
                    <option value="system">{t(sequenceHolderLabels.system, language)}</option>
                    <option value="investigator">{t(sequenceHolderLabels.investigator, language)}</option>
                  </select>
                </label>
              </section>
            </div>
          </section>
        ) : mode === "scenario" ? (
          <section className="scenario-panel" aria-labelledby="scenario-title">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">{t("Planning assistant", language)}</p>
                <h2 id="scenario-title">{t("Scenario Comparison", language)}</h2>
                <p>
                  {t("Compare saved sample-size scenarios by base sample size, adjusted sample size, and the assumption set used for planning.", language)}
                </p>
              </div>
              <div className="actions">
                <button type="button" onClick={clearScenarios} disabled={scenarios.length === 0}>
                  {t("Clear scenarios", language)}
                </button>
              </div>
            </div>

            <div className="research-grid">
              <section className="tool-card wide" aria-labelledby="comparison-title">
                <span>{t("Scenario comparison", language)}</span>
                <h3 id="comparison-title">{t("Saved assumption sets", language)}</h3>
                {scenarios.length === 0 ? (
                  <p>{t("Save scenarios from the calculator catalog to compare assumptions and adjusted sample sizes here.", language)}</p>
                ) : (
                  <div className="scenario-table" role="table" aria-label={t("Saved scenario comparison", language)}>
                    <div className="scenario-row heading" role="row">
                      <span>{t("Calculator", language)}</span>
                      <span>{t("Base n", language)}</span>
                      <span>{t("Adjusted n", language)}</span>
                    </div>
                    {scenarios.map((scenario) => (
                      <button
                        className="scenario-row"
                        key={scenario.id}
                        type="button"
                        onClick={() => {
                          loadScenario(scenario);
                          setMode("calculator");
                        }}
                      >
                        <strong>{t(scenario.calculatorTitle, language)}</strong>
                        <span>{formatNumber(scenario.result.total ?? scenario.result.primary)}</span>
                        <span>{formatNumber(scenario.result.adjustedTotal)}</span>
                      </button>
                    ))}
                  </div>
                )}
              </section>
            </div>
          </section>
        ) : mode === "checklist" ? (
          <section className="checklist-panel" aria-labelledby="checklist-page-title">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">{t("Reporting support", language)}</p>
                <h2 id="checklist-page-title">{t("Study Design", language)}</h2>
                <p>
                  {t("Select the study or report type and use the checklist prompts to prepare a more complete manuscript, protocol, or project report.", language)}
                </p>
                <p>
                  {t("Reporting checklists improve transparency, reduce avoidable omissions, and help readers, reviewers, and editors assess whether the study methods and results are complete enough to interpret and reproduce. They should be used from protocol planning through manuscript submission, not only at the final writing stage.", language)}
                </p>
              </div>
            </div>

            <div className="research-grid">
              <section className="tool-card checklist-tree-card" aria-labelledby="checklist-tree-title">
                <span>{t("Find your study design", language)}</span>
                <h3 id="checklist-tree-title">{t("Find your study design", language)}</h3>
                <p>
                  {t("Answer the yes/no prompts adapted from the EQUATOR Network decision tree to select the most relevant checklist.", language)}
                </p>
                {checklistTreePath.length > 0 && (
                  <ol className="checklist-path" aria-label={t("Answered checklist tree questions", language)}>
                    {checklistTreePath.map((item) => (
                      <li key={item.question.id}>
                        <span>{t(item.question.prompt, language)}</span>
                        <strong>{item.answer ? t("Yes", language) : t("No", language)}</strong>
                      </li>
                    ))}
                  </ol>
                )}
                {currentChecklistTreeQuestion ? (
                  <div className="tree-question">
                    <strong>{t(currentChecklistTreeQuestion.prompt, language)}</strong>
                    <div className="tree-actions">
                      <button type="button" onClick={() => answerChecklistTree(currentChecklistTreeQuestion.id, true)}>
                        {t("Yes", language)}
                      </button>
                      <button type="button" onClick={() => answerChecklistTree(currentChecklistTreeQuestion.id, false)}>
                        {t("No", language)}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="tree-result" aria-live="polite">
                    <span>{t("Suggested checklist", language)}</span>
                    <strong>{t(checklist.title, language)}</strong>
                    <p>{t(checklist.guideline, language)}</p>
                  </div>
                )}
                <button className="subtle-button" type="button" onClick={resetChecklistTree}>
                  {t("Reset tree", language)}
                </button>
              </section>

              <section className="tool-card checklist-tool" aria-labelledby="checklist-title">
                <span>{t("Reporting checklist", language)}</span>
                <h3 id="checklist-title">{t(checklist.title, language)}</h3>
                <label>
                  <strong>{t("Study/report type", language)}</strong>
                  <select
                    aria-label={t("Reporting checklist type", language)}
                    onChange={(event) => setChecklistType(event.target.value as ChecklistKey)}
                    value={checklistType}
                  >
                    <option value="trial">{t("Randomised trial", language)}</option>
                    <option value="observational">{t("Observational study", language)}</option>
                    <option value="systematic-review">{t("Systematic review", language)}</option>
                    <option value="diagnostic">{t("Diagnostic/prognostic accuracy", language)}</option>
                    <option value="protocol">{t("Study protocol", language)}</option>
                    <option value="case-report">{t("Case report", language)}</option>
                    <option value="qualitative">{t("Qualitative research", language)}</option>
                    <option value="quality-improvement">{t("Quality improvement", language)}</option>
                    <option value="economic">{t("Economic evaluation", language)}</option>
                    <option value="prediction-model">{t("Prediction model", language)}</option>
                    <option value="arrive">{t("Animal research / ARRIVE", language)}</option>
                    <option value="entreq">{t("Qualitative evidence synthesis / ENTREQ", language)}</option>
                    <option value="srqr">{t("Qualitative research / SRQR", language)}</option>
                    <option value="stard">{t("Diagnostic accuracy / STARD", language)}</option>
                    <option value="remark">{t("Prognostic marker / REMARK", language)}</option>
                    <option value="moose">{t("Observational meta-analysis / MOOSE", language)}</option>
                    <option value="equator-library">{t("Search EQUATOR library", language)}</option>
                  </select>
                </label>
                <p>{t(checklist.guideline, language)}</p>
                <a className="resource-button" href={checklist.link} target="_blank" rel="noreferrer">{t("Open guideline resource", language)}</a>
                <p className="method-lead">{t("The Method section should at least describe the following:", language)}</p>
                <ul>
                  {checklist.items.map((item) => <li key={item}>{t(item, language)}</li>)}
                </ul>
              </section>
            </div>
          </section>
        ) : (
          <section className="calculator-panel" aria-labelledby="calculator-title">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">{t(calculator.category, language)}</p>
                <h2 id="calculator-title">{t(calculator.title, language)}</h2>
                <p>{t(calculator.purpose, language)}</p>
              </div>
              <div className="actions">
                <button type="button" onClick={saveScenario}>{t("Save scenario", language)}</button>
                <button type="button" onClick={downloadPdf}>{t("Download PDF", language)}</button>
              </div>
            </div>

            <div className="inputs-grid">
              {calculator.variables.map((variable) => {
                const guidance = parameterGuidance(calculator.id, variable.key, language);

                return (
                  <label className="control" key={variable.key}>
                    <span>
                      <strong>{t(variable.label, language)}</strong>
                      <small>{t(variable.help, language)}</small>
                      {guidance && <small className="parameter-guidance">{guidance}</small>}
                    </span>
                    <div className="input-row">
                      {variable.slider && (
                        <input
                          aria-label={`${t(variable.label, language)} slider`}
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
                          aria-label={t(variable.label, language)}
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
                );
              })}
            </div>

            <div className="evidence">
              <article>
                <h3>{t("Formula", language)}</h3>
                <p>{calculator.formula}</p>
              </article>
              <article>
                <h3>{t("Assumptions", language)}</h3>
                <ul>{calculator.assumptions.map((item) => <li key={item}>{t(item, language)}</li>)}</ul>
              </article>
              <article>
                <h3>{t("References", language)}</h3>
                <ul>{calculator.references.map((item) => <li key={item}>{item}</li>)}</ul>
              </article>
            </div>
          </section>
        )}

        {mode === "randomiser" ? (
          <aside className="results" aria-label={t("Randomiser summary", language)}>
            <div className="result-card primary">
              <span>{t("Randomisation slots", language)}</span>
              <strong>{formatNumber(randomSubjectCount)}</strong>
              <small>{randomisedGroups.length} {t("allocation groups", language)}</small>
            </div>
            <div className="result-card">
              <span>{t("Method", language)}</span>
              <strong>{randomMethod === "block" ? t("Blocked", language) : t("Simple", language)}</strong>
              <small>{randomMethod === "block" ? `${t("Block size", language)} ${effectiveBlockSize}` : t("Balanced shuffled sequence", language)}</small>
            </div>
            <div className="result-card">
              <span>{t("Allocation counts", language)}</span>
              <ul>{Object.entries(randomisationCounts).map(([group, count]) => <li key={group}>{group}: {count}</li>)}</ul>
            </div>
            <div className="result-card">
              <span>{t("Documentation", language)}</span>
              <ul>
                <li>Seed: {randomSeed || "studysize-studio"}</li>
                <li>{t("Export the PDF before enrolment.", language)}</li>
                <li>{t("Keep the sequence concealed from recruiters.", language)}</li>
              </ul>
            </div>
            <div className="result-card wording-card">
              <span>{t("Randomisation wording", language)}</span>
              <p>{randomisationWording}</p>
              <small>{t("Review and revise this wording before using it in a manuscript.", language)}</small>
              <button
                type="button"
                onClick={() => copyGeneratedWording(randomisationWording, "Randomisation wording copied")}
              >
                {t("Copy randomisation wording", language)}
              </button>
            </div>
          </aside>
        ) : mode === "blinding" ? (
          <aside className="results" aria-label={t("Blinding classification", language)}>
            <div className="result-card primary blinding-classification">
              <span>{t("Blinding classification", language)}</span>
              <strong>{t(blindingClassification, language)}</strong>
              <small>
                {t(blindingClassificationDetail, language)}
              </small>
            </div>
            <div className="result-card">
              <span>{t("Classification rule", language)}</span>
              <p>{t(blindingClassificationDetail, language)}</p>
            </div>
            <div className="result-card">
              <span>{t("Blinded roles", language)}</span>
              {blindedRoleLabels.length === 0 ? (
                <p>{t("No party is blinded to allocation.", language)}</p>
              ) : (
                <ul>{blindedRoleLabels.map((role) => <li key={role}>{t(role, language)}</li>)}</ul>
              )}
            </div>
            <div className="result-card adjusted concealment-card">
              <span>{t("Allocation concealment", language)}</span>
              <strong>{t(concealmentMethodLabels[concealmentMethod], language)}</strong>
              <small>{t(sequenceHolderLabels[sequenceHolder], language)}</small>
            </div>
            <div className="result-card wording-card">
              <span>{t("Blinding wording", language)}</span>
              <p>{blindingWording}</p>
              <small>{t("Review and revise this wording before using it in a manuscript.", language)}</small>
              <button
                type="button"
                onClick={() => copyGeneratedWording(blindingWording, "Blinding wording copied")}
              >
                {t("Copy blinding wording", language)}
              </button>
            </div>
          </aside>
        ) : mode === "calculator" ? (
          <aside className="results" aria-label={t("Live result", language)}>
            <div className="result-card primary">
              <span>{t("Required sample size", language)}</span>
              <strong>{formatNumber(result.total ?? result.primary)}</strong>
              <small>{t("Total before dropout adjustment", language)}</small>
            </div>
            <div className="result-card adjusted">
              <span>{t("Adjusted total", language)}</span>
              <strong>{formatNumber(result.adjustedTotal)}</strong>
              <small>{t("Includes expected dropout or missing data", language)}</small>
            </div>
            <div className="result-card">
              <span>{t("Planning notes", language)}</span>
              <ul>{result.details.map((detail) => <li key={detail}>{t(detail, language)}</li>)}</ul>
            </div>
            <div className="result-card protocol-card">
              <span>{t("Protocol wording", language)}</span>
              <p>{protocolText}</p>
              <button type="button" onClick={() => setShowProtocolModal(true)}>{t("Open wording popup", language)}</button>
            </div>
            <div className="saved">
              <div className="saved-head">
                <span>{t("Saved scenarios", language)}</span>
                <small>{status}</small>
              </div>
              {scenarios.length === 0 ? (
                <p>{t("No saved scenarios yet.", language)}</p>
              ) : (
                scenarios.map((scenario) => (
                  <button key={scenario.id} type="button" onClick={() => loadScenario(scenario)}>
                    <strong>{t(scenario.calculatorTitle, language)}</strong>
                    <span>{formatNumber(scenario.result.adjustedTotal)} {t("adjusted", language)}</span>
                  </button>
                ))
              )}
            </div>
          </aside>
        ) : null}
      </section>

      <footer className="app-footer"><strong>{t("StudySize Studio version 1.23 © Ryalino, 2026.", language)}</strong></footer>

      {copiedNotice && (
        <div className="copy-toast" role="status" aria-live="polite">
          {copiedNotice}
        </div>
      )}

      {showCitationModal && (
        <div className="modal-backdrop" role="presentation" onClick={() => setShowCitationModal(false)}>
          <section
            aria-labelledby="citation-title"
            aria-modal="true"
            className="citation-modal"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
          >
            <div className="modal-head">
              <div>
                <p className="eyebrow">{t("Citation", language)}</p>
                <h2 id="citation-title">{t("How to cite us", language)}</h2>
              </div>
              <button aria-label={t("Close citation dialog", language)} type="button" onClick={() => setShowCitationModal(false)}>
                {t("Close", language)}
              </button>
            </div>
            <div className="citation-list">
              {citationFormats.map((citation) => (
                <article key={citation.label}>
                  <div className="citation-item-head">
                    <strong>{citation.label}</strong>
                    <button type="button" onClick={() => copyCitation(citation.text)}>
                      {t("Copy citation", language)}
                    </button>
                  </div>
                  <p>{citation.text}</p>
                </article>
              ))}
            </div>
          </section>
        </div>
      )}

      {showScenarioModal && (
        <div className="modal-backdrop" role="presentation" onClick={() => setShowScenarioModal(false)}>
          <section
            aria-labelledby="scenario-modal-title"
            aria-modal="true"
            className="citation-modal scenario-modal"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
          >
            <div className="modal-head">
              <div>
                <p className="eyebrow">{t("Saved scenarios", language)}</p>
                <h2 id="scenario-modal-title">{t("Scenario is ready", language)}</h2>
              </div>
              <button aria-label={t("Close", language)} type="button" onClick={() => setShowScenarioModal(false)}>
                {t("Close", language)}
              </button>
            </div>
            <p className="modal-copy">
              {t("This scenario is now available in the Scenario Comparison bar, where you can compare it with other saved planning scenarios.", language)}
            </p>
            <div className="copy-actions">
              <button
                type="button"
                onClick={() => {
                  setShowScenarioModal(false);
                  setMode("scenario");
                }}
              >
                {t("Open Scenario Comparison", language)}
              </button>
            </div>
          </section>
        </div>
      )}

      {showProtocolModal && (
        <div className="modal-backdrop" role="presentation" onClick={() => setShowProtocolModal(false)}>
          <section
            aria-labelledby="protocol-modal-title"
            aria-modal="true"
            className="citation-modal protocol-modal"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
          >
            <div className="modal-head">
              <div>
                <p className="eyebrow">{t("Protocol wording", language)}</p>
                <h2 id="protocol-modal-title">{t("Copy wording for your protocol", language)}</h2>
              </div>
              <button aria-label={t("Close protocol wording dialog", language)} type="button" onClick={() => setShowProtocolModal(false)}>
                {t("Close", language)}
              </button>
            </div>
            <textarea
              aria-label={t("Protocol wording text", language)}
              className="protocol-copy-box"
              readOnly
              value={protocolText}
            />
            <div className="copy-actions">
              <button type="button" onClick={copyProtocolWording}>{t("Copy wording", language)}</button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
