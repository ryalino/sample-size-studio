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
type ReferenceFormat = "vancouver" | "harvard";
type ZTableRow = {
  context: string;
  probability: string;
  z: string;
};
type QuestionFramework = "pico" | "peco" | "pird" | "pico-qual" | "prognostic";
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
type AppMode =
  | "finder"
  | "calculator"
  | "randomiser"
  | "blinding"
  | "scenario"
  | "checklist"
  | "flowcharts"
  | "framework"
  | "question"
  | "outcomes"
  | "variables"
  | "eligibility"
  | "bias"
  | "analysis-plan"
  | "ethics"
  | "timeline"
  | "data-plan"
  | "protocol-check";
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
type FlowTemplateKey = "consort" | "strobe-cohort" | "strobe-case-control" | "strobe-cross-sectional" | "prisma" | "stard" | "generic";
type FlowNode = {
  id: string;
  label: string;
  x: number;
  y: number;
  tone?: "primary" | "secondary" | "warning";
};
type FlowConnector = {
  from: string;
  to: string;
};
type FlowTemplate = {
  key: FlowTemplateKey;
  title: string;
  guideline: string;
  description: string;
  nodes: FlowNode[];
  connectors: FlowConnector[];
  defaultCounts: Record<string, string>;
  defaultNotes: Record<string, string>;
};
type PreparedFlowNode = FlowNode & {
  height: number;
};
type DerivedFlowCounts = {
  counts: Record<string, string>;
  derivedIds: Set<string>;
};
type FrameworkBox = {
  id: string;
  title: string;
  variables: string[];
  x: number;
  y: number;
  width: number;
  tone: "primary" | "secondary" | "warning" | "neutral";
};

type PresetFieldProps = {
  label: string;
  value: string;
  options: string[];
  language: Language;
  onChange: (value: string) => void;
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
  "Find my study size calculator": "Temukan kalkulator besar studi saya",
  "Find my calculator": "Temukan kalkulator saya",
  "Calculator catalog": "Katalog kalkulator",
  "Sample Size": "Besar Sampel",
  "Randomiser": "Randomisasi",
  "Randomisation": "Randomisasi",
  "Flow Charts": "Diagram Alur",
  "Figure Generator": "Pembuat Gambar",
  "Reporting flowcharts": "Diagram alur pelaporan",
  "Conceptual Framework": "Kerangka Konseptual",
  "Conceptual framework builder": "Pembuat kerangka konseptual",
  "Translate study variables into a publication-ready conceptual framework figure with directional relationships.": "Ubah variabel studi menjadi gambar kerangka konseptual siap publikasi dengan hubungan terarah.",
  "Framework settings": "Pengaturan kerangka",
  "Framework title": "Judul kerangka",
  "Independent variables": "Variabel independen",
  "Dependent variables": "Variabel dependen",
  "Confounding variables": "Variabel perancu",
  "Mediators": "Mediator",
  "Moderators / effect modifiers": "Moderator / pengubah efek",
  "Covariates / adjustment variables": "Kovariat / variabel penyesuaian",
  "Enter one variable per line.": "Masukkan satu variabel per baris.",
  "Optional. These are drawn as variables affecting both exposure and outcome.": "Opsional. Ini digambar sebagai variabel yang memengaruhi pajanan dan luaran.",
  "Optional. These sit on the pathway between exposure and outcome.": "Opsional. Ini ditempatkan pada jalur antara pajanan dan luaran.",
  "Optional. These modify the strength or direction of the main relationship.": "Opsional. Ini mengubah kekuatan atau arah hubungan utama.",
  "Optional. These are shown as variables controlled for in analysis.": "Opsional. Ini ditampilkan sebagai variabel yang dikendalikan dalam analisis.",
  "Framework PNG downloaded": "PNG kerangka diunduh",
  "Framework preview": "Pratinjau kerangka",
  "Conceptual frameworks are planning figures. Review the direction of each relationship against theory, temporality, and domain evidence before using the figure in a protocol or manuscript.": "Kerangka konseptual adalah gambar perencanaan. Tinjau arah setiap hubungan berdasarkan teori, temporalitas, dan bukti bidang terkait sebelum memakai gambar dalam protokol atau manuskrip.",
  "Flow chart builder": "Pembuat diagram alur",
  "Create publication-ready participant and review flow charts from structured counts, exclusion reasons, and reporting-guideline templates.": "Buat diagram alur peserta dan tinjauan yang siap publikasi dari jumlah terstruktur, alasan eksklusi, dan templat pedoman pelaporan.",
  "Flow chart settings": "Pengaturan diagram alur",
  "Template": "Templat",
  "Figure title": "Judul gambar",
  "Box counts and exclusion reasons": "Jumlah kotak dan alasan eksklusi",
  "Download PNG": "Unduh PNG",
  "Flow chart PNG downloaded": "PNG diagram alur diunduh",
  "Preview": "Pratinjau",
  "Figure guidance": "Panduan gambar",
  "Enter the exact n for each box. Use the reason field for exclusions, losses, non-eligibility, missing records, or analysis omissions. Review the final figure against the relevant reporting guideline before submission.": "Masukkan n yang tepat untuk setiap kotak. Gunakan kolom alasan untuk eksklusi, kehilangan tindak lanjut, ketidaklayakan, rekam yang hilang, atau pengeluaran dari analisis. Tinjau gambar akhir terhadap pedoman pelaporan yang relevan sebelum pengiriman.",
  "Use anonymised aggregate counts only; do not enter identifiable participant information.": "Gunakan jumlah agregat anonim saja; jangan masukkan informasi peserta yang dapat diidentifikasi.",
  "Reasons / notes": "Alasan / catatan",
  "Flow chart type": "Jenis diagram alur",
  "Number of arms/groups": "Jumlah lengan/kelompok",
  "Arm/group labels": "Label lengan/kelompok",
  "Enter one label per line. The app will use the first labels according to the selected number of arms.": "Masukkan satu label per baris. Aplikasi akan memakai label pertama sesuai jumlah lengan yang dipilih.",
  "Arm conversion is available for CONSORT, STROBE cohort, and generic participant flows. PRISMA, STARD, case-control, and cross-sectional diagrams keep their guideline-specific structure.": "Konversi lengan tersedia untuk CONSORT, kohort STROBE, dan alur peserta generik. Diagram PRISMA, STARD, kasus-kontrol, dan potong lintang mempertahankan struktur khusus pedomannya.",
  "Auto-calculated from the previous box minus the red-box count.": "Dihitung otomatis dari kotak sebelumnya dikurangi jumlah pada kotak merah.",
  "Open relevant checklist": "Buka daftar periksa terkait",
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
  "Randomise": "Randomisasi",
  "New randomisation sequence generated": "Urutan randomisasi baru dibuat",
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
  "Formula symbols": "Simbol dalam rumus",
  "Open Z value table": "Buka tabel nilai Z",
  "Z value table": "Tabel nilai Z",
  "Common Z values": "Nilai Z yang sering digunakan",
  "Close Z value table": "Tutup tabel nilai Z",
  "Planning context": "Konteks perencanaan",
  "Probability": "Probabilitas",
  "Z value": "Nilai Z",
  "Assumptions": "Asumsi",
  "References": "Referensi",
  "Reference style": "Gaya referensi",
  "Vancouver": "Vancouver",
  "Harvard": "Harvard",
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
  "Protocol wording disclaimer": "Peringatan narasi protokol",
  "This wording is a drafting aid only. Review and revise it against your final protocol, local ethics requirements, statistical review, and supervisor or collaborator feedback before use.": "Narasi ini hanya alat bantu draf. Tinjau dan revisi sesuai protokol final, persyaratan etik lokal, telaah statistik, serta masukan pembimbing atau kolaborator sebelum digunakan.",
  "Legal disclaimer: StudySize Studio provides educational planning support and does not provide medical, legal, ethical, regulatory, or statistical consultancy. Users remain responsible for verifying all wording, assumptions, calculations, and references before using them in protocols, manuscripts, grant applications, or submissions.": "Peringatan hukum: StudySize Studio menyediakan bantuan perencanaan edukatif dan tidak memberikan konsultasi medis, hukum, etik, regulatori, atau statistik. Pengguna tetap bertanggung jawab untuk memverifikasi semua narasi, asumsi, perhitungan, dan referensi sebelum digunakan dalam protokol, manuskrip, aplikasi hibah, atau pengajuan.",
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
  "StudySize Studio version 1.43 © Ryalino, 2026.": "StudySize Studio versi 1.43 © Ryalino, 2026.",
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
  "Reference mean group 1": "Rerata kelompok 1 dari studi referensi",
  "Reference mean group 2": "Rerata kelompok 2 dari studi referensi",
  "Mean outcome in the first reference group.": "Rerata luaran kelompok 1 pada studi referensi.",
  "Mean outcome in the second reference group.": "Rerata luaran kelompok 2 pada studi referensi.",
  "SD group 1": "SD kelompok 1 dari studi referensi",
  "SD group 2": "SD kelompok 2 dari studi referensi",
  "Standard deviation in the first reference group.": "Simpangan baku kelompok 1 pada studi referensi.",
  "Standard deviation in the second reference group.": "Simpangan baku kelompok 2 pada studi referensi.",
  "Allocation ratio": "Rasio alokasi",
  "Treatment participants per control participant.": "Peserta perlakuan per peserta kontrol.",
  "Alpha": "Alfa",
  "Type I error rate.": "Tingkat kesalahan tipe I.",
  "Power": "Power",
  "Chance of detecting the target effect.": "Peluang mendeteksi efek target.",
  "Dropout": "Dropout",
  "Expected unusable or lost participants.": "Peserta yang diperkirakan tidak dapat digunakan atau hilang.",
  "Two-sided test with equal variance approximation.": "Uji dua sisi dengan aproksimasi varians sama.",
  "Pooled SD is estimated from the two reference-group SDs.": "SD gabungan diperkirakan dari dua SD kelompok referensi.",
  "Normal outcome or sufficiently large samples.": "Luaran normal atau sampel cukup besar.",
  "Paired / Before-After Mean": "Rerata Berpasangan / Sebelum-Sesudah",
  "Detect a mean change in paired measurements.": "Mendeteksi perubahan rerata pada pengukuran berpasangan.",
  "Reference mean before": "Rerata sebelum dari studi referensi",
  "Reference mean after": "Rerata sesudah dari studi referensi",
  "Mean before intervention or exposure.": "Rerata sebelum intervensi atau pajanan pada studi referensi.",
  "Mean after intervention or exposure.": "Rerata sesudah intervensi atau pajanan pada studi referensi.",
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
  "Exposed risk": "Risiko terpajan",
  "Outcome risk among exposed participants.": "Risiko luaran pada peserta terpajan.",
  "Exposed:unexposed": "Terpajan:tidak terpajan",
  "Exposed participants per unexposed participant.": "Peserta terpajan per peserta tidak terpajan.",
  "Independent exposed and unexposed groups.": "Kelompok terpajan dan tidak terpajan independen.",
  "Approximate two-sided test for the risk difference implied by the two entered risks.": "Uji dua sisi aproksimasi untuk perbedaan risiko yang tersirat dari dua risiko yang dimasukkan.",
  "Case-Control / Odds Ratio": "Kasus-Kontrol / Odds Ratio",
  "Detect an odds ratio using expected control exposure prevalence.": "Mendeteksi odds ratio menggunakan prevalensi pajanan kontrol yang diharapkan.",
  "Control exposure": "Pajanan kontrol",
  "Exposure prevalence among controls.": "Prevalensi pajanan pada kontrol.",
  "Case exposure": "Pajanan kasus",
  "Exposure prevalence among cases.": "Prevalensi pajanan pada kasus.",
  "Controls per case": "Kontrol per kasus",
  "Number of controls for each case.": "Jumlah kontrol untuk setiap kasus.",
  "Unmatched case-control design.": "Desain kasus-kontrol tidak berpasangan.",
  "Exposure is binary and measured independently.": "Pajanan bersifat biner dan diukur secara independen.",
  "Non-Inferiority Mean": "Rerata Non-Inferioritas",
  "Compare a mean outcome against a non-inferiority margin.": "Membandingkan luaran rerata terhadap margin non-inferioritas.",
  "NI margin": "Margin NI",
  "Largest acceptable loss in original units.": "Kehilangan terbesar yang masih dapat diterima dalam satuan asli.",
  "Reference SD group 1": "SD kelompok 1 dari studi referensi",
  "Reference SD group 2": "SD kelompok 2 dari studi referensi",
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
  "Plan for detecting the expected model R².": "Merencanakan deteksi R² model yang diharapkan.",
  "Expected R²": "R² yang diharapkan",
  "Expected variance explained by the model.": "Varians yang diharapkan dapat dijelaskan oleh model.",
  "Predictors": "Prediktor",
  "Number of tested predictors.": "Jumlah prediktor yang diuji.",
  "Planning approximation for omnibus regression signal.": "Aproksimasi perencanaan untuk sinyal regresi omnibus.",
  "The app converts expected R² to Cohen's f² internally.": "Aplikasi mengonversi R² yang diharapkan menjadi f² Cohen secara internal.",
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
  "The planned outcome is continuous, so the regression calculator uses predictors and expected model R2, then converts R2 to Cohen's f2 internally.": "Luaran yang direncanakan kontinu, sehingga kalkulator regresi menggunakan prediktor dan R2 model yang diharapkan, lalu mengonversi R2 menjadi f2 Cohen secara internal.",
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
  "Group means and SDs can be estimated from a reference study.": "Rerata dan SD kelompok dapat diperkirakan dari studi referensi.",
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
  "Find my study size calculator": "Vind mijn steekproefgroottecalculator",
  "Find my calculator": "Kies mijn calculator",
  "Calculator catalog": "Calculatorcatalogus",
  "Sample Size": "Steekproefgrootte",
  "Randomiser": "Randomisator",
  "Randomisation": "Randomisatie",
  "Flow Charts": "Stroomdiagrammen",
  "Figure Generator": "Figuurgenerator",
  "Reporting flowcharts": "Rapportagestroomdiagrammen",
  "Conceptual Framework": "Conceptueel Kader",
  "Conceptual framework builder": "Bouwer voor conceptueel kader",
  "Translate study variables into a publication-ready conceptual framework figure with directional relationships.": "Zet studievariabelen om in een publicatieklare figuur van een conceptueel kader met richtinggevende relaties.",
  "Framework settings": "Instellingen voor kader",
  "Framework title": "Kadertitel",
  "Independent variables": "Onafhankelijke variabelen",
  "Dependent variables": "Afhankelijke variabelen",
  "Confounding variables": "Confounders",
  "Mediators": "Mediatoren",
  "Moderators / effect modifiers": "Moderatoren / effectmodificatoren",
  "Covariates / adjustment variables": "Covariaten / correctievariabelen",
  "Enter one variable per line.": "Voer een variabele per regel in.",
  "Optional. These are drawn as variables affecting both exposure and outcome.": "Optioneel. Deze worden getekend als variabelen die zowel blootstelling als uitkomst beinvloeden.",
  "Optional. These sit on the pathway between exposure and outcome.": "Optioneel. Deze liggen op het pad tussen blootstelling en uitkomst.",
  "Optional. These modify the strength or direction of the main relationship.": "Optioneel. Deze veranderen de sterkte of richting van de hoofdrelatie.",
  "Optional. These are shown as variables controlled for in analysis.": "Optioneel. Deze worden weergegeven als variabelen waarvoor in de analyse wordt gecorrigeerd.",
  "Framework PNG downloaded": "PNG van kader gedownload",
  "Framework preview": "Voorbeeld van kader",
  "Conceptual frameworks are planning figures. Review the direction of each relationship against theory, temporality, and domain evidence before using the figure in a protocol or manuscript.": "Conceptuele kaders zijn planningsfiguren. Controleer de richting van elke relatie aan theorie, tijdsvolgorde en domeinbewijs voordat u de figuur in een protocol of manuscript gebruikt.",
  "Flow chart builder": "Stroomdiagrambouwer",
  "Create publication-ready participant and review flow charts from structured counts, exclusion reasons, and reporting-guideline templates.": "Maak publicatieklare deelnemers- en reviewstroomdiagrammen met gestructureerde aantallen, exclusieredenen en templates van rapportagerichtlijnen.",
  "Flow chart settings": "Instellingen voor stroomdiagram",
  "Template": "Template",
  "Figure title": "Figuurtitel",
  "Box counts and exclusion reasons": "Aantallen per vak en exclusieredenen",
  "Download PNG": "PNG downloaden",
  "Flow chart PNG downloaded": "PNG van stroomdiagram gedownload",
  "Preview": "Voorbeeld",
  "Figure guidance": "Figuuradvies",
  "Enter the exact n for each box. Use the reason field for exclusions, losses, non-eligibility, missing records, or analysis omissions. Review the final figure against the relevant reporting guideline before submission.": "Voer de exacte n in voor elk vak. Gebruik het redenveld voor exclusies, uitval, niet-geschiktheid, ontbrekende dossiers of weglatingen uit de analyse. Controleer de figuur voor indiening aan de hand van de relevante rapportagerichtlijn.",
  "Use anonymised aggregate counts only; do not enter identifiable participant information.": "Gebruik alleen geanonimiseerde geaggregeerde aantallen; voer geen identificeerbare deelnemergegevens in.",
  "Reasons / notes": "Redenen / notities",
  "Flow chart type": "Type stroomdiagram",
  "Number of arms/groups": "Aantal armen/groepen",
  "Arm/group labels": "Labels voor armen/groepen",
  "Enter one label per line. The app will use the first labels according to the selected number of arms.": "Voer een label per regel in. De app gebruikt de eerste labels volgens het gekozen aantal armen.",
  "Arm conversion is available for CONSORT, STROBE cohort, and generic participant flows. PRISMA, STARD, case-control, and cross-sectional diagrams keep their guideline-specific structure.": "Armconversie is beschikbaar voor CONSORT, STROBE-cohort en algemene deelnemersstromen. PRISMA-, STARD-, case-control- en cross-sectionele diagrammen behouden hun richtlijnspecifieke structuur.",
  "Auto-calculated from the previous box minus the red-box count.": "Automatisch berekend als het vorige vak minus het aantal in het rode vak.",
  "Open relevant checklist": "Relevante checklist openen",
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
  "Randomise": "Randomiseren",
  "New randomisation sequence generated": "Nieuwe randomisatiereeks gegenereerd",
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
  "Formula symbols": "Symbolen in de formule",
  "Open Z value table": "Z-waardetabel openen",
  "Z value table": "Z-waardetabel",
  "Common Z values": "Veelgebruikte Z-waarden",
  "Close Z value table": "Z-waardetabel sluiten",
  "Planning context": "Planningscontext",
  "Probability": "Kans",
  "Z value": "Z-waarde",
  "Assumptions": "Aannames",
  "References": "Referenties",
  "Reference style": "Referentiestijl",
  "Vancouver": "Vancouver",
  "Harvard": "Harvard",
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
  "Protocol wording disclaimer": "Disclaimer bij protocoltekst",
  "This wording is a drafting aid only. Review and revise it against your final protocol, local ethics requirements, statistical review, and supervisor or collaborator feedback before use.": "Deze tekst is alleen bedoeld als hulpmiddel voor een concept. Controleer en pas de tekst aan op basis van uw definitieve protocol, lokale ethische vereisten, statistische beoordeling en feedback van supervisor of samenwerkingspartners voordat u deze gebruikt.",
  "Legal disclaimer: StudySize Studio provides educational planning support and does not provide medical, legal, ethical, regulatory, or statistical consultancy. Users remain responsible for verifying all wording, assumptions, calculations, and references before using them in protocols, manuscripts, grant applications, or submissions.": "Juridische disclaimer: StudySize Studio biedt educatieve ondersteuning bij onderzoeksplanning en verstrekt geen medisch, juridisch, ethisch, regulatoir of statistisch advies. Gebruikers blijven verantwoordelijk voor het controleren van alle tekst, aannames, berekeningen en referenties voordat zij deze gebruiken in protocollen, manuscripten, subsidieaanvragen of indieningen.",
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
  "StudySize Studio version 1.43 © Ryalino, 2026.": "StudySize Studio versie 1.43 © Ryalino, 2026.",
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
  "Reference mean group 1": "Gemiddelde van groep 1 uit referentiestudie",
  "Reference mean group 2": "Gemiddelde van groep 2 uit referentiestudie",
  "Mean outcome in the first reference group.": "Gemiddelde uitkomst in de eerste referentiegroep.",
  "Mean outcome in the second reference group.": "Gemiddelde uitkomst in de tweede referentiegroep.",
  "SD group 1": "SD groep 1",
  "SD group 2": "SD groep 2",
  "Standard deviation in the first reference group.": "Standaarddeviatie in de eerste referentiegroep.",
  "Standard deviation in the second reference group.": "Standaarddeviatie in de tweede referentiegroep.",
  "Allocation ratio": "Allocatieratio",
  "Alpha": "Alfa",
  "Power": "Power",
  "Dropout": "Uitval",
  "Reference mean before": "Gemiddelde vóór interventie uit referentiestudie",
  "Reference mean after": "Gemiddelde na interventie uit referentiestudie",
  "Mean before intervention or exposure.": "Gemiddelde voor interventie of blootstelling.",
  "Mean after intervention or exposure.": "Gemiddelde na interventie of blootstelling.",
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
  "Exposed risk": "Risico bij blootgestelden",
  "Outcome risk among exposed participants.": "Uitkomstrisico bij blootgestelde deelnemers.",
  "Case exposure": "Blootstelling bij cases",
  "Exposure prevalence among cases.": "Blootstellingsprevalentie bij cases.",
  "Reference SD group 1": "SD van groep 1 uit referentiestudie",
  "Reference SD group 2": "SD van groep 2 uit referentiestudie",
  "Pooled SD is estimated from the two reference-group SDs.": "De gepoolde SD wordt geschat uit de twee SD's van de referentiegroepen.",
  "Approximate two-sided test for the risk difference implied by the two entered risks.": "Benaderende tweezijdige toets voor het risicoverschil dat uit de twee ingevoerde risico's volgt.",
  "Plan for detecting the expected model R².": "Plannen voor het aantonen van de verwachte model-R².",
  "Expected R²": "Verwachte R²",
  "Expected variance explained by the model.": "Verwachte verklaarde variantie door het model.",
  "The app converts expected R² to Cohen's f² internally.": "De app zet de verwachte R² intern om naar Cohens f².",
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

Object.assign(indonesianText, {
  "Your one-stop solution for medical research": "Solusi terpadu untuk persiapan penelitian medis",
  "Find my study size calculator": "Cari kalkulator besar sampel",
  "Find my calculator": "Cari kalkulator",
  "Sample Size": "Besar Sampel",
  "Randomisation": "Randomisasi",
  "Flow Charts": "Diagram Alur Penelitian",
  "Figure Generator": "Pembuat Gambar",
  "Reporting flowcharts": "Diagram alur pelaporan",
  "Conceptual Framework": "Kerangka Konseptual",
  "Conceptual framework builder": "Penyusun kerangka konseptual",
  "Translate study variables into a publication-ready conceptual framework figure with directional relationships.": "Susun variabel penelitian menjadi gambar kerangka konseptual siap publikasi dengan arah hubungan yang jelas.",
  "Framework settings": "Pengaturan kerangka konseptual",
  "Framework title": "Judul kerangka konseptual",
  "Confounding variables": "Variabel perancu",
  "Covariates / adjustment variables": "Kovariat / variabel penyesuaian",
  "Enter one variable per line.": "Tulis satu variabel per baris.",
  "Optional. These are drawn as variables affecting both exposure and outcome.": "Opsional. Variabel ini ditampilkan sebagai faktor yang memengaruhi pajanan dan luaran.",
  "Optional. These sit on the pathway between exposure and outcome.": "Opsional. Variabel ini berada pada jalur kausal antara pajanan dan luaran.",
  "Optional. These modify the strength or direction of the main relationship.": "Opsional. Variabel ini mengubah kekuatan atau arah hubungan utama.",
  "Optional. These are shown as variables controlled for in analysis.": "Opsional. Variabel ini ditampilkan sebagai faktor yang dikontrol dalam analisis.",
  "Conceptual frameworks are planning figures. Review the direction of each relationship against theory, temporality, and domain evidence before using the figure in a protocol or manuscript.": "Kerangka konseptual adalah gambar perencanaan penelitian. Periksa kembali arah setiap hubungan berdasarkan teori, urutan waktu, dan bukti di bidang terkait sebelum digunakan dalam protokol atau manuskrip.",
  "Create publication-ready participant and review flow charts from structured counts, exclusion reasons, and reporting-guideline templates.": "Buat diagram alur peserta atau tinjauan literatur yang siap publikasi dari jumlah kasus, alasan eksklusi, dan templat pedoman pelaporan.",
  "Template": "Templat",
  "Box counts and exclusion reasons": "Jumlah pada setiap kotak dan alasan eksklusi",
  "Figure guidance": "Panduan penyusunan gambar",
  "Enter the exact n for each box. Use the reason field for exclusions, losses, non-eligibility, missing records, or analysis omissions. Review the final figure against the relevant reporting guideline before submission.": "Masukkan nilai n yang tepat untuk setiap kotak. Gunakan kolom alasan untuk eksklusi, loss to follow-up, tidak memenuhi kriteria, rekam medis/data yang tidak tersedia, atau tidak disertakan dalam analisis. Periksa kembali gambar akhir dengan pedoman pelaporan yang sesuai sebelum naskah dikirim.",
  "Use anonymised aggregate counts only; do not enter identifiable participant information.": "Gunakan data agregat yang sudah dianonimkan saja; jangan memasukkan informasi yang dapat mengidentifikasi peserta.",
  "Number of arms/groups": "Jumlah lengan/kelompok",
  "Arm/group labels": "Label lengan/kelompok",
  "Enter one label per line. The app will use the first labels according to the selected number of arms.": "Tulis satu label per baris. Aplikasi akan menggunakan label sesuai jumlah lengan yang dipilih.",
  "Answer a few study-design questions and the app will suggest the closest calculator, explain why, and flag when statistical review is important.": "Jawab beberapa pertanyaan tentang desain penelitian; aplikasi akan menyarankan kalkulator yang paling sesuai, menjelaskan alasannya, dan memberi tanda bila diperlukan telaah statistik.",
  "Assumptions to check": "Asumsi yang perlu ditinjau",
  "Warning flags": "Catatan kehati-hatian",
  "No major warning flags based on these answers.": "Tidak ada catatan kehati-hatian utama berdasarkan jawaban ini.",
  "Subject randomiser": "Randomisasi subjek penelitian",
  "Generate a documented allocation sequence for standard individual randomisation, then export the settings, sequence, and best-practice notes as a PDF.": "Buat daftar alokasi untuk randomisasi individu standar, lengkap dengan dokumentasi metode, urutan, dan catatan praktik baik dalam PDF.",
  "Randomiser settings": "Pengaturan randomisasi",
  "Total number of randomisation slots to generate.": "Jumlah alokasi yang akan dibuat.",
  "Separate treatment arms with commas or line breaks.": "Pisahkan lengan perlakuan dengan koma atau baris baru.",
  "Blocked randomisation helps preserve balance during recruitment.": "Randomisasi blok membantu menjaga keseimbangan jumlah peserta selama perekrutan.",
  "Permuted block": "Blok permutasi",
  "Simple balanced": "Acak seimbang sederhana",
  "Record this in the randomisation file to reproduce the sequence.": "Catat nilai ini dalam berkas randomisasi agar urutan dapat direproduksi.",
  "Generated allocation": "Hasil alokasi",
  "Generated sequence": "Daftar alokasi",
  "Best practice": "Praktik terbaik",
  "How to conduct randomisation properly": "Cara melakukan randomisasi yang baik",
  "Randomisation is not only the sequence. Good practice also requires allocation concealment, documented roles, and a clear audit trail from consent through assignment.": "Randomisasi bukan sekadar membuat urutan alokasi. Praktik yang baik juga memerlukan penyembunyian alokasi, pembagian peran yang terdokumentasi, dan jejak audit yang jelas sejak informed consent sampai penetapan kelompok.",
  "Blinding and allocation concealment guide": "Panduan pembutaan dan penyembunyian alokasi",
  "The allocation sequence should be protected before assignment, and blinding should be planned around who can influence enrolment, treatment, assessment, or analysis.": "Urutan alokasi harus terlindungi sebelum penetapan kelompok, dan pembutaan perlu direncanakan dengan mempertimbangkan siapa yang dapat memengaruhi perekrutan, intervensi, penilaian luaran, atau analisis.",
  "Saved assumption sets": "Set asumsi yang tersimpan",
  "Save scenarios from the calculator catalog to compare assumptions and adjusted sample sizes here.": "Simpan skenario dari katalog kalkulator untuk membandingkan asumsi dan besar sampel setelah penyesuaian di halaman ini.",
  "Reporting support": "Bantuan pelaporan",
  "Select the study or report type and use the checklist prompts to prepare a more complete manuscript, protocol, or project report.": "Pilih jenis studi atau laporan, lalu gunakan butir daftar periksa untuk menyiapkan manuskrip, protokol, atau laporan proyek yang lebih lengkap.",
  "Reporting checklists improve transparency, reduce avoidable omissions, and help readers, reviewers, and editors assess whether the study methods and results are complete enough to interpret and reproduce. They should be used from protocol planning through manuscript submission, not only at the final writing stage.": "Daftar periksa pelaporan membantu meningkatkan transparansi, mencegah informasi penting terlewat, dan memudahkan pembaca, reviewer, serta editor menilai apakah metode dan hasil penelitian sudah cukup lengkap untuk ditafsirkan dan direplikasi. Idealnya daftar periksa digunakan sejak penyusunan protokol, bukan baru pada tahap akhir penulisan manuskrip.",
  "The Method section should at least describe the following:": "Bagian Metode sekurang-kurangnya perlu menjelaskan hal berikut:",
  "Copy wording for your protocol": "Salin narasi untuk protokol",
  "Protocol wording": "Narasi protokol",
  "Copy wording": "Salin narasi",
  "Reference mean group 1": "Rerata kelompok 1 dari studi referensi",
  "Reference mean group 2": "Rerata kelompok 2 dari studi referensi",
  "Mean outcome in the first reference group.": "Rerata luaran kelompok 1 pada studi referensi.",
  "Mean outcome in the second reference group.": "Rerata luaran kelompok 2 pada studi referensi.",
  "SD group 1": "SD kelompok 1 dari studi referensi",
  "SD group 2": "SD kelompok 2 dari studi referensi",
  "Standard deviation in the first reference group.": "Simpangan baku kelompok 1 pada studi referensi.",
  "Standard deviation in the second reference group.": "Simpangan baku kelompok 2 pada studi referensi.",
  "Reference mean before": "Rerata sebelum dari studi referensi",
  "Reference mean after": "Rerata sesudah dari studi referensi",
  "Mean before intervention or exposure.": "Rerata sebelum intervensi atau pajanan pada studi referensi.",
  "Mean after intervention or exposure.": "Rerata sesudah intervensi atau pajanan pada studi referensi.",
  "Reference SD group 1": "SD kelompok 1 dari studi referensi",
  "Reference SD group 2": "SD kelompok 2 dari studi referensi",
  "Expected R²": "R² yang diharapkan",
  "StudySize Studio version 1.43 © Ryalino, 2026.": "StudySize Studio versi 1.43 © Ryalino, 2026.",
  "Randomised trial": "Uji klinis acak",
  "CONSORT for trial reports; SPIRIT for trial protocols.": "CONSORT untuk laporan uji klinis; SPIRIT untuk protokol uji klinis.",
  "Study protocol": "Protokol penelitian",
  "SPIRIT for clinical trial protocols; PRISMA-P for review protocols.": "SPIRIT untuk protokol uji klinis; PRISMA-P untuk protokol tinjauan sistematis.",
  "Quality improvement": "Peningkatan mutu layanan",
  "SQUIRE for healthcare improvement studies.": "SQUIRE untuk studi peningkatan mutu layanan kesehatan.",
  "Trial design and allocation ratio": "Desain uji klinis dan rasio alokasi",
  "Eligibility criteria and settings": "Kriteria kelayakan dan lokasi/setting penelitian",
  "Harms and protocol deviations": "Kejadian merugikan dan penyimpangan protokol",
  "Study size rationale": "Dasar penentuan besar sampel",
  "Limitations and generalisability": "Keterbatasan dan generalisasi hasil",
  "Ethics and dissemination": "Etik dan diseminasi",
  "Define the randomisation unit before generating the sequence: individual participant, cluster, eye, lesion, or another unit.": "Tentukan unit randomisasi sebelum membuat daftar alokasi, misalnya peserta, klaster, mata, lesi, atau unit lain.",
  "Generate the allocation sequence before enrolment using a documented method, seed, date, study title, groups, and allocation ratio.": "Buat daftar alokasi sebelum perekrutan menggunakan metode yang terdokumentasi, termasuk seed, tanggal, judul penelitian, kelompok, dan rasio alokasi.",
  "Keep the sequence concealed from recruiters and outcome assessors whenever possible. Use a central randomisation service, pharmacy, database, or sequentially numbered opaque sealed envelopes.": "Sembunyikan daftar alokasi dari perekrut dan penilai luaran bila memungkinkan. Gunakan randomisasi terpusat, farmasi penelitian, basis data aman, atau amplop tertutup buram bernomor urut.",
  "Randomise only after eligibility is confirmed and informed consent is complete.": "Lakukan randomisasi hanya setelah kelayakan dipastikan dan informed consent selesai.",
  "Use blocked randomisation when balance over time matters; keep block sizes confidential and consider variable block sizes for open-label trials.": "Gunakan randomisasi blok bila keseimbangan jumlah peserta selama perekrutan penting; rahasiakan ukuran blok dan pertimbangkan ukuran blok bervariasi pada studi label terbuka.",
  "Preserve an audit trail: who generated the list, who held it, who assigned participants, timestamps, and any emergency unblinding.": "Simpan jejak audit yang memuat siapa yang membuat daftar, siapa yang menyimpan, siapa yang menetapkan peserta, waktu penetapan, dan setiap pembukaan blinding darurat.",
  "Decide who must be blinded: participants, clinicians, outcome assessors, data analysts, or adjudication committee.": "Tentukan pihak yang harus dibutakan: peserta, klinisi, penilai luaran, analis data, atau komite adjudikasi.",
  "Use allocation concealment until assignment: central randomisation, pharmacy-controlled allocation, secure database release, or sequentially numbered opaque sealed envelopes.": "Pertahankan penyembunyian alokasi sampai penetapan kelompok, misalnya melalui randomisasi terpusat, alokasi oleh farmasi, basis data aman, atau amplop tertutup buram bernomor urut.",
  "For sealed envelopes, use tamper-evident opaque envelopes, identical size and weight, sequential numbering, signatures across seals, and a log of opening date/time.": "Bila menggunakan amplop, gunakan amplop buram anti-buka paksa dengan ukuran dan berat seragam, bernomor urut, ditandatangani melintasi segel, dan disertai log tanggal/jam pembukaan.",
  "Document emergency unblinding criteria before recruitment starts and keep every unblinding event in the audit file.": "Tetapkan kriteria pembukaan blinding darurat sebelum perekrutan dimulai dan simpan setiap kejadian tersebut dalam berkas audit penelitian.",
  "For open-label studies, blind outcome assessment and data analysis when possible.": "Pada studi label terbuka, butakan penilai luaran dan analis data bila memungkinkan.",
  "Blinding inputs": "Isian pembutaan",
  "Mask participants to allocation.": "Peserta tidak mengetahui alokasi.",
  "Mask care providers or interventionists to allocation.": "Pemberi layanan atau pelaksana intervensi tidak mengetahui alokasi.",
  "Mask outcome assessors to allocation.": "Penilai luaran tidak mengetahui alokasi.",
  "Mask data analysts to allocation.": "Analis data tidak mengetahui alokasi.",
  "Open-label": "Label terbuka",
  "Single-blinded": "Buta tunggal",
  "Double-blinded": "Buta ganda",
  "Triple-blinded": "Buta tripel",
  "Allocation concealment": "Penyembunyian alokasi",
  "Allocation concealment method": "Metode penyembunyian alokasi",
  "Sequence holder": "Penyimpan daftar alokasi",
  "Study pharmacy": "Farmasi penelitian",
  "Classify blinding from the parties masked to allocation and generate manuscript wording that can be reviewed against CONSORT expectations.": "Klasifikasikan pembutaan berdasarkan pihak yang tidak mengetahui alokasi, lalu buat narasi manuskrip yang dapat ditinjau kembali sesuai prinsip CONSORT.",
  "CONSORT randomised trial flow diagram": "Diagram alur uji klinis acak CONSORT",
  "Participant progress through enrolment, allocation, follow-up, and analysis.": "Alur peserta melalui skrining, alokasi, follow-up, dan analisis.",
  "Assessed for eligibility": "Dinilai kelayakannya",
  "Excluded": "Dieksklusi",
  "Randomised": "Dirandomisasi",
  "Allocated to group A": "Dialokasikan ke kelompok A",
  "Allocated to group B": "Dialokasikan ke kelompok B",
  "Lost to follow-up / discontinued group A": "Loss to follow-up / menghentikan intervensi kelompok A",
  "Lost to follow-up / discontinued group B": "Loss to follow-up / menghentikan intervensi kelompok B",
  "Analysed group A": "Dianalisis kelompok A",
  "Analysed group B": "Dianalisis kelompok B",
  "STROBE cohort study flow diagram": "Diagram alur studi kohort STROBE",
  "Cohort assembly, eligibility, exposure groups, follow-up, and analysis.": "Pembentukan kohort, kelayakan, kelompok pajanan, follow-up, dan analisis.",
  "Source population / records screened": "Populasi sumber / rekam yang disaring",
  "Not eligible / excluded": "Tidak memenuhi kriteria / dieksklusi",
  "Eligible cohort": "Kohort yang memenuhi kriteria",
  "Exposed group": "Kelompok terpajan",
  "Unexposed group": "Kelompok tidak terpajan",
  "Lost or missing outcome in exposed": "Loss to follow-up atau luaran hilang pada kelompok terpajan",
  "Lost or missing outcome in unexposed": "Loss to follow-up atau luaran hilang pada kelompok tidak terpajan",
  "Analysed exposed": "Dianalisis kelompok terpajan",
  "Analysed unexposed": "Dianalisis kelompok tidak terpajan",
  "STROBE case-control study flow diagram": "Diagram alur studi kasus-kontrol STROBE",
  "Selection of cases and controls, exclusions, and final analysed samples.": "Pemilihan kasus dan kontrol, eksklusi, dan sampel akhir yang dianalisis.",
  "Potential cases identified": "Calon kasus teridentifikasi",
  "Potential controls identified": "Calon kontrol teridentifikasi",
  "Cases excluded": "Kasus dieksklusi",
  "Controls excluded": "Kontrol dieksklusi",
  "Eligible cases": "Kasus memenuhi kriteria",
  "Eligible controls": "Kontrol memenuhi kriteria",
  "Cases analysed": "Kasus dianalisis",
  "Controls analysed": "Kontrol dianalisis",
  "STROBE cross-sectional study flow diagram": "Diagram alur studi potong lintang STROBE",
  "Sampling frame, eligibility, response, complete data, and final analysis.": "Kerangka sampel, kelayakan, respons, kelengkapan data, dan analisis akhir.",
  "Invited / sampled": "Diundang / masuk sampel",
  "Not eligible": "Tidak memenuhi kriteria",
  "Eligible": "Memenuhi kriteria",
  "Non-response": "Non-respons",
  "Responded / assessed": "Merespons / dinilai",
  "Incomplete or missing key data": "Data utama tidak lengkap atau hilang",
  "Included in analysis": "Disertakan dalam analisis",
  "PRISMA study selection flow diagram": "Diagram alur seleksi studi PRISMA",
  "Records identified, screened, excluded, assessed, and included in review.": "Rekam diidentifikasi, disaring, dieksklusi, dinilai, dan disertakan dalam tinjauan.",
  "Records identified": "Rekam teridentifikasi",
  "Duplicate records removed": "Duplikasi rekam dihapus",
  "Records screened": "Rekam disaring",
  "Records excluded": "Rekam dieksklusi",
  "Reports sought / assessed for eligibility": "Laporan dicari / dinilai kelayakannya",
  "Reports excluded with reasons": "Laporan dieksklusi dengan alasan",
  "Studies included in review": "Studi disertakan dalam tinjauan",
  "STARD diagnostic accuracy flow diagram": "Diagram alur akurasi diagnostik STARD",
  "Participant flow through eligibility, index test, reference standard, and analysis.": "Alur peserta melalui kelayakan, tes indeks, standar referensi, dan analisis.",
  "Potentially eligible participants": "Peserta yang berpotensi memenuhi kriteria",
  "Excluded before testing": "Dieksklusi sebelum pemeriksaan",
  "Received index test": "Menjalani tes indeks",
  "Did not receive index test": "Tidak menjalani tes indeks",
  "Received reference standard": "Menjalani standar referensi",
  "No reference standard / uninterpretable": "Tanpa standar referensi / tidak dapat diinterpretasi",
  "Included in diagnostic accuracy analysis": "Disertakan dalam analisis akurasi diagnostik",
  "Generic participant flow diagram": "Diagram alur peserta umum",
  "Flexible participant flow for pilot, feasibility, audit, service evaluation, or local reporting.": "Alur peserta fleksibel untuk studi pilot, studi kelayakan, audit, evaluasi layanan, atau laporan lokal.",
  "Identified / approached": "Diidentifikasi / dihubungi",
  "Excluded / declined": "Dieksklusi / menolak",
  "Enrolled / included": "Direkrut / disertakan",
  "Completed follow-up or data collection": "Menyelesaikan follow-up atau pengumpulan data",
  "Missing data / withdrawn": "Data hilang / mengundurkan diri",
  "Analysed": "Dianalisis",
  "Reasons for exclusion": "Alasan eksklusi",
  "Reasons": "Alasan",
  "Eligibility exclusions": "Alasan tidak memenuhi kriteria",
  "Missing-data reasons": "Alasan data hilang",
  "Sources": "Sumber",
  "Screening reasons": "Alasan pada tahap skrining",
  "Full-text exclusion reasons": "Alasan eksklusi teks lengkap",
  "Lost or missing outcome in ": "Luaran hilang atau tidak tersedia pada ",
  "Missing data / withdrawn in ": "Data hilang / mengundurkan diri pada ",
  "Allocated to ": "Dialokasikan ke ",
  "Lost to follow-up / discontinued ": "Loss to follow-up / menghentikan intervensi ",
  "Analysed ": "Dianalisis ",
});

Object.assign(dutchText, {
  "Your one-stop solution for medical research": "Eén platform voor medisch-wetenschappelijk onderzoek",
  "Sample size calculators": "Steekproefgrootteberekeningen",
  "Find my study size calculator": "Kies mijn steekproefgroottecalculator",
  "Find my calculator": "Kies calculator",
  "Calculator catalog": "Calculatorcatalogus",
  "Sample Size": "Steekproefgrootte",
  "Randomiser": "Randomisatie",
  "Randomisation": "Randomisatie",
  "Figure Generator": "Figuurgenerator",
  "Reporting flowcharts": "Rapportagestroomdiagrammen",
  "Conceptual Framework": "Conceptueel kader",
  "Conceptual framework builder": "Bouwer voor conceptueel kader",
  "Translate study variables into a publication-ready conceptual framework figure with directional relationships.": "Zet onderzoeksvariabelen om in een publicatieklare figuur van het conceptuele kader, met duidelijke richting van de relaties.",
  "Framework settings": "Instellingen voor het conceptuele kader",
  "Framework title": "Titel van het conceptuele kader",
  "Confounding variables": "Confounders",
  "Covariates / adjustment variables": "Covariaten / correctievariabelen",
  "Enter one variable per line.": "Vul één variabele per regel in.",
  "Optional. These are drawn as variables affecting both exposure and outcome.": "Optioneel. Deze variabelen worden weergegeven als factoren die zowel de blootstelling als de uitkomst beïnvloeden.",
  "Optional. These sit on the pathway between exposure and outcome.": "Optioneel. Deze variabelen liggen op het causale pad tussen blootstelling en uitkomst.",
  "Optional. These modify the strength or direction of the main relationship.": "Optioneel. Deze variabelen wijzigen de sterkte of richting van het hoofdverband.",
  "Optional. These are shown as variables controlled for in analysis.": "Optioneel. Deze variabelen worden weergegeven als factoren waarvoor in de analyse wordt gecorrigeerd.",
  "Conceptual frameworks are planning figures. Review the direction of each relationship against theory, temporality, and domain evidence before using the figure in a protocol or manuscript.": "Conceptuele kaders zijn planningsfiguren. Controleer de richting van elk verband aan de hand van theorie, temporele volgorde en vakinhoudelijke literatuur voordat u de figuur in een protocol of manuscript gebruikt.",
  "Flow chart builder": "Stroomdiagramgenerator",
  "Create publication-ready participant and review flow charts from structured counts, exclusion reasons, and reporting-guideline templates.": "Maak publicatieklare deelnemers- en reviewstroomdiagrammen op basis van aantallen, exclusieredenen en sjablonen voor rapportagerichtlijnen.",
  "Template": "Sjabloon",
  "Box counts and exclusion reasons": "Aantallen per vak en exclusieredenen",
  "Figure guidance": "Toelichting bij de figuur",
  "Enter the exact n for each box. Use the reason field for exclusions, losses, non-eligibility, missing records, or analysis omissions. Review the final figure against the relevant reporting guideline before submission.": "Vul voor elk vak de exacte n in. Gebruik het redenveld voor exclusies, uitval, niet-voldoen aan inclusiecriteria, ontbrekende dossiers of niet-meegenomen analyses. Controleer de uiteindelijke figuur vóór indiening aan de hand van de relevante rapportagerichtlijn.",
  "Use anonymised aggregate counts only; do not enter identifiable participant information.": "Gebruik uitsluitend geanonimiseerde geaggregeerde aantallen; voer geen herleidbare deelnemergegevens in.",
  "Arm conversion is available for CONSORT, STROBE cohort, and generic participant flows. PRISMA, STARD, case-control, and cross-sectional diagrams keep their guideline-specific structure.": "Omzetten naar meerdere armen is beschikbaar voor CONSORT, STROBE-cohort en algemene deelnemersstromen. PRISMA-, STARD-, case-control- en cross-sectionele diagrammen behouden hun richtlijnspecifieke structuur.",
  "Study Design": "Studiedesign",
  "Answer a few study-design questions and the app will suggest the closest calculator, explain why, and flag when statistical review is important.": "Beantwoord enkele vragen over het studiedesign. De app stelt de best passende calculator voor, licht de keuze toe en geeft aan wanneer statistische beoordeling verstandig is.",
  "Assumptions to check": "Te controleren uitgangspunten",
  "Warning flags": "Aandachtspunten",
  "No major warning flags based on these answers.": "Op basis van deze antwoorden zijn er geen grote aandachtspunten.",
  "Subject randomiser": "Randomisatie van deelnemers",
  "Generate a documented allocation sequence for standard individual randomisation, then export the settings, sequence, and best-practice notes as a PDF.": "Genereer een gedocumenteerde allocatiereeks voor standaard individuele randomisatie en exporteer de instellingen, reeks en aandachtspunten voor goede onderzoekspraktijk als PDF.",
  "Log template PDF": "PDF-logsjabloon",
  "Randomiser settings": "Randomisatie-instellingen",
  "Total number of randomisation slots to generate.": "Totaal aantal te genereren allocaties.",
  "Separate treatment arms with commas or line breaks.": "Scheid behandelarmen met komma's of regeleinden.",
  "Blocked randomisation helps preserve balance during recruitment.": "Blokrandomisatie helpt de balans tussen groepen tijdens inclusie te behouden.",
  "Permuted block": "Gepermuteerde blokken",
  "Simple balanced": "Eenvoudig gebalanceerd",
  "Generated allocation": "Gegenereerde toewijzing",
  "Generated sequence": "Gegenereerde allocatiereeks",
  "Best practice": "Goede onderzoekspraktijk",
  "How to conduct randomisation properly": "Randomisatie zorgvuldig uitvoeren",
  "Randomisation is not only the sequence. Good practice also requires allocation concealment, documented roles, and a clear audit trail from consent through assignment.": "Randomisatie is meer dan alleen een reeks. Goede onderzoekspraktijk vraagt ook om afscherming van de toewijzing, duidelijk gedocumenteerde rollen en een controleerbaar spoor van informed consent tot toewijzing.",
  "Blinding and allocation concealment guide": "Gids voor blindering en afscherming van toewijzing",
  "The allocation sequence should be protected before assignment, and blinding should be planned around who can influence enrolment, treatment, assessment, or analysis.": "De allocatiereeks moet vóór toewijzing worden afgeschermd. Plan blindering op basis van wie inclusie, behandeling, uitkomstbeoordeling of analyse kan beïnvloeden.",
  "Saved assumption sets": "Opgeslagen uitgangspunten",
  "Save scenarios from the calculator catalog to compare assumptions and adjusted sample sizes here.": "Sla scenario's op vanuit de calculatorcatalogus om hier uitgangspunten en gecorrigeerde steekproefgroottes te vergelijken.",
  "Base n": "Ongecorrigeerde n",
  "Adjusted n": "Gecorrigeerde n",
  "Reporting support": "Ondersteuning bij rapportage",
  "Select the study or report type and use the checklist prompts to prepare a more complete manuscript, protocol, or project report.": "Selecteer het type studie of rapport en gebruik de checklistvragen om een vollediger manuscript, protocol of projectrapport voor te bereiden.",
  "Reporting checklists improve transparency, reduce avoidable omissions, and help readers, reviewers, and editors assess whether the study methods and results are complete enough to interpret and reproduce. They should be used from protocol planning through manuscript submission, not only at the final writing stage.": "Rapportagechecklists vergroten de transparantie, voorkomen dat essentiële informatie ontbreekt en helpen lezers, reviewers en redacteuren beoordelen of methoden en resultaten volledig genoeg zijn voor interpretatie en reproduceerbaarheid. Gebruik ze bij voorkeur al bij het protocol, niet pas bij de laatste versie van het manuscript.",
  "Open guideline resource": "Richtlijn openen",
  "The Method section should at least describe the following:": "De methodesectie moet ten minste het volgende beschrijven:",
  "Protocol wording": "Protocoltekst",
  "Open wording popup": "Protocoltekst openen",
  "Reference mean group 1": "Gemiddelde van groep 1 uit referentiestudie",
  "Reference mean group 2": "Gemiddelde van groep 2 uit referentiestudie",
  "Mean outcome in the first reference group.": "Gemiddelde uitkomst in de eerste referentiegroep.",
  "Mean outcome in the second reference group.": "Gemiddelde uitkomst in de tweede referentiegroep.",
  "SD group 1": "SD van groep 1 uit referentiestudie",
  "SD group 2": "SD van groep 2 uit referentiestudie",
  "Standard deviation in the first reference group.": "Standaarddeviatie van groep 1 in de referentiestudie.",
  "Standard deviation in the second reference group.": "Standaarddeviatie van groep 2 in de referentiestudie.",
  "Reference mean before": "Gemiddelde vóór interventie uit referentiestudie",
  "Reference mean after": "Gemiddelde na interventie uit referentiestudie",
  "Mean before intervention or exposure.": "Gemiddelde vóór interventie of blootstelling.",
  "Mean after intervention or exposure.": "Gemiddelde na interventie of blootstelling.",
  "Expected R²": "Verwachte R²",
  "Expected variance explained by the model.": "Verwacht percentage verklaarde variantie door het model.",
  "Reference SD group 1": "SD van groep 1 uit referentiestudie",
  "Reference SD group 2": "SD van groep 2 uit referentiestudie",
  "StudySize Studio version 1.43 © Ryalino, 2026.": "StudySize Studio versie 1.43 © Ryalino, 2026.",
  "Randomised trial": "Gerandomiseerde trial",
  "CONSORT for trial reports; SPIRIT for trial protocols.": "CONSORT voor trialrapportages; SPIRIT voor trialprotocollen.",
  "Study protocol": "Onderzoeksprotocol",
  "Quality improvement": "Kwaliteitsverbetering in de zorg",
  "SQUIRE for healthcare improvement studies.": "SQUIRE voor studies naar kwaliteitsverbetering in de zorg.",
  "Trial design and allocation ratio": "Trialdesign en allocatieratio",
  "Eligibility criteria and settings": "In- en exclusiecriteria en setting",
  "Sequence generation and allocation concealment": "Genereren van de allocatiereeks en afscherming van toewijzing",
  "Primary/secondary outcomes": "Primaire/secundaire uitkomstmaten",
  "Harms and protocol deviations": "Schade, ongewenste voorvallen en protocolafwijkingen",
  "Study size rationale": "Onderbouwing van de steekproefgrootte",
  "Limitations and generalisability": "Beperkingen en generaliseerbaarheid",
  "Define the randomisation unit before generating the sequence: individual participant, cluster, eye, lesion, or another unit.": "Definieer de randomisatie-eenheid voordat de allocatiereeks wordt gemaakt, bijvoorbeeld deelnemer, cluster, oog, laesie of een andere eenheid.",
  "Generate the allocation sequence before enrolment using a documented method, seed, date, study title, groups, and allocation ratio.": "Maak de allocatiereeks vóór inclusie met een gedocumenteerde methode, seed, datum, studietitel, groepen en allocatieratio.",
  "Keep the sequence concealed from recruiters and outcome assessors whenever possible. Use a central randomisation service, pharmacy, database, or sequentially numbered opaque sealed envelopes.": "Scherm de reeks waar mogelijk af voor personen die includeren en voor uitkomstbeoordelaars. Gebruik centrale randomisatie, een studieapotheek, een beveiligde database of opeenvolgend genummerde, ondoorzichtige en verzegelde enveloppen.",
  "Randomise only after eligibility is confirmed and informed consent is complete.": "Randomiseer pas nadat geschiktheid is bevestigd en informed consent is verkregen.",
  "Use blocked randomisation when balance over time matters; keep block sizes confidential and consider variable block sizes for open-label trials.": "Gebruik blokrandomisatie wanneer balans gedurende de inclusie belangrijk is; houd blokgroottes vertrouwelijk en overweeg variabele blokgroottes bij open-label trials.",
  "Use stratified randomisation when key prognostic variables must be balanced, but avoid too many strata for the sample size.": "Gebruik gestratificeerde randomisatie wanneer belangrijke prognostische variabelen in balans moeten zijn, maar vermijd te veel strata in verhouding tot de steekproefgrootte.",
  "Do not replace, skip, or reassign allocations after the sequence is generated. Record withdrawals and protocol deviations separately.": "Vervang, sla of wijzig toewijzingen niet nadat de reeks is gegenereerd. Registreer terugtrekkingen en protocolafwijkingen apart.",
  "Preserve an audit trail: who generated the list, who held it, who assigned participants, timestamps, and any emergency unblinding.": "Bewaar een audittrail met wie de lijst heeft gemaakt, wie deze beheerde, wie deelnemers heeft toegewezen, tijdstippen en eventuele noodontblindering.",
  "Report the sequence generation method, allocation concealment mechanism, and implementation roles in the protocol and manuscript.": "Rapporteer de methode voor het genereren van de reeks, het mechanisme voor afscherming van de toewijzing en de uitvoerende rollen in protocol en manuscript.",
  "Decide who must be blinded: participants, clinicians, outcome assessors, data analysts, or adjudication committee.": "Bepaal wie geblindeerd moet zijn: deelnemers, behandelaars, uitkomstbeoordelaars, data-analisten of adjudicatiecommissie.",
  "Separate roles so the person generating the sequence is not the person recruiting participants.": "Scheid rollen zodat degene die de reeks genereert niet ook deelnemers includeert.",
  "Use allocation concealment until assignment: central randomisation, pharmacy-controlled allocation, secure database release, or sequentially numbered opaque sealed envelopes.": "Houd de toewijzing afgeschermd tot het moment van allocatie, bijvoorbeeld via centrale randomisatie, allocatie door de studieapotheek, vrijgave uit een beveiligde database of opeenvolgend genummerde, ondoorzichtige en verzegelde enveloppen.",
  "Document emergency unblinding criteria before recruitment starts and keep every unblinding event in the audit file.": "Leg criteria voor noodontblindering vast vóór de start van de inclusie en documenteer elke ontblindering in het studiedossier.",
  "For open-label studies, blind outcome assessment and data analysis when possible.": "Blindeer bij open-label studies waar mogelijk de uitkomstbeoordeling en data-analyse.",
  "Blinding inputs": "Invoer voor blindering",
  "Mask participants to allocation.": "Deelnemers zijn geblindeerd voor de toewijzing.",
  "Mask care providers or interventionists to allocation.": "Behandelaars of interventionisten zijn geblindeerd voor de toewijzing.",
  "Mask outcome assessors to allocation.": "Uitkomstbeoordelaars zijn geblindeerd voor de toewijzing.",
  "Mask data analysts to allocation.": "Data-analisten zijn geblindeerd voor de toewijzing.",
  "Allocation concealment": "Afscherming van toewijzing",
  "Allocation concealment method": "Methode voor afscherming van toewijzing",
  "Open list or no allocation concealment": "Open lijst of geen afscherming van toewijzing",
  "Blinding classification": "Classificatie van blindering",
  "Classify blinding from the parties masked to allocation and generate manuscript wording that can be reviewed against CONSORT expectations.": "Classificeer de blindering op basis van de partijen die de toewijzing niet kennen en genereer manuscripttekst die aan CONSORT kan worden getoetst.",
  "No party is blinded to allocation.": "Geen enkele partij is geblindeerd voor de toewijzing.",
  "All participants": "Alle deelnemers",
  "CONSORT randomised trial flow diagram": "CONSORT-stroomdiagram voor gerandomiseerde trials",
  "Participant progress through enrolment, allocation, follow-up, and analysis.": "Deelnemersstroom door inclusie, allocatie, follow-up en analyse.",
  "Assessed for eligibility": "Beoordeeld op geschiktheid",
  "Excluded": "Geëxcludeerd",
  "Randomised": "Gerandomiseerd",
  "Allocated to group A": "Toegewezen aan groep A",
  "Allocated to group B": "Toegewezen aan groep B",
  "Lost to follow-up / discontinued group A": "Uitval tijdens follow-up / gestopt in groep A",
  "Lost to follow-up / discontinued group B": "Uitval tijdens follow-up / gestopt in groep B",
  "Analysed group A": "Geanalyseerd in groep A",
  "Analysed group B": "Geanalyseerd in groep B",
  "STROBE cohort study flow diagram": "STROBE-stroomdiagram voor cohortstudies",
  "Cohort assembly, eligibility, exposure groups, follow-up, and analysis.": "Samenstelling van het cohort, geschiktheid, blootstellingsgroepen, follow-up en analyse.",
  "Source population / records screened": "Bronpopulatie / gescreende dossiers",
  "Not eligible / excluded": "Niet geschikt / geëxcludeerd",
  "Eligible cohort": "Geschikt cohort",
  "Exposed group": "Blootgestelde groep",
  "Unexposed group": "Niet-blootgestelde groep",
  "Lost or missing outcome in exposed": "Uitval of ontbrekende uitkomst bij blootgestelden",
  "Lost or missing outcome in unexposed": "Uitval of ontbrekende uitkomst bij niet-blootgestelden",
  "Analysed exposed": "Blootgestelden geanalyseerd",
  "Analysed unexposed": "Niet-blootgestelden geanalyseerd",
  "STROBE case-control study flow diagram": "STROBE-stroomdiagram voor case-controlstudies",
  "Selection of cases and controls, exclusions, and final analysed samples.": "Selectie van cases en controles, exclusies en uiteindelijke geanalyseerde steekproeven.",
  "Potential cases identified": "Mogelijke cases geïdentificeerd",
  "Potential controls identified": "Mogelijke controles geïdentificeerd",
  "Cases excluded": "Cases geëxcludeerd",
  "Controls excluded": "Controles geëxcludeerd",
  "Eligible cases": "Geschikte cases",
  "Eligible controls": "Geschikte controles",
  "Cases analysed": "Cases geanalyseerd",
  "Controls analysed": "Controles geanalyseerd",
  "STROBE cross-sectional study flow diagram": "STROBE-stroomdiagram voor cross-sectionele studies",
  "Sampling frame, eligibility, response, complete data, and final analysis.": "Steekproefkader, geschiktheid, respons, volledige gegevens en uiteindelijke analyse.",
  "Invited / sampled": "Uitgenodigd / geselecteerd",
  "Not eligible": "Niet geschikt",
  "Eligible": "Geschikt",
  "Non-response": "Non-respons",
  "Responded / assessed": "Gereageerd / beoordeeld",
  "Incomplete or missing key data": "Onvolledige of ontbrekende kerngegevens",
  "Included in analysis": "Opgenomen in de analyse",
  "PRISMA study selection flow diagram": "PRISMA-stroomdiagram voor studieselectie",
  "Records identified, screened, excluded, assessed, and included in review.": "Records geïdentificeerd, gescreend, geëxcludeerd, beoordeeld en opgenomen in de review.",
  "Records identified": "Records geïdentificeerd",
  "Duplicate records removed": "Duplicaten verwijderd",
  "Records screened": "Records gescreend",
  "Records excluded": "Records geëxcludeerd",
  "Reports sought / assessed for eligibility": "Rapporten gezocht / beoordeeld op geschiktheid",
  "Reports excluded with reasons": "Rapporten geëxcludeerd met reden",
  "Studies included in review": "Studies opgenomen in de review",
  "STARD diagnostic accuracy flow diagram": "STARD-stroomdiagram voor diagnostische accuratesse",
  "Participant flow through eligibility, index test, reference standard, and analysis.": "Deelnemersstroom door geschiktheid, indextest, referentiestandaard en analyse.",
  "Potentially eligible participants": "Mogelijk geschikte deelnemers",
  "Excluded before testing": "Geëxcludeerd vóór testen",
  "Received index test": "Indextest ondergaan",
  "Did not receive index test": "Geen indextest ondergaan",
  "Received reference standard": "Referentiestandaard ondergaan",
  "No reference standard / uninterpretable": "Geen referentiestandaard / niet interpreteerbaar",
  "Included in diagnostic accuracy analysis": "Opgenomen in analyse van diagnostische accuratesse",
  "Generic participant flow diagram": "Algemeen deelnemersstroomdiagram",
  "Flexible participant flow for pilot, feasibility, audit, service evaluation, or local reporting.": "Flexibele deelnemersstroom voor pilotstudies, haalbaarheidsstudies, audits, zorgevaluaties of lokale rapportages.",
  "Identified / approached": "Geïdentificeerd / benaderd",
  "Excluded / declined": "Geëxcludeerd / geweigerd",
  "Enrolled / included": "Geïncludeerd / opgenomen",
  "Completed follow-up or data collection": "Follow-up of dataverzameling voltooid",
  "Missing data / withdrawn": "Ontbrekende gegevens / teruggetrokken",
  "Analysed": "Geanalyseerd",
  "Reasons for exclusion": "Redenen voor exclusie",
  "Reasons": "Redenen",
  "Eligibility exclusions": "Exclusies wegens ongeschiktheid",
  "Missing-data reasons": "Redenen voor ontbrekende gegevens",
  "Sources": "Bronnen",
  "Screening reasons": "Redenen bij screening",
  "Full-text exclusion reasons": "Redenen voor exclusie na volledige tekst",
  "Lost or missing outcome in ": "Uitval of ontbrekende uitkomst bij ",
  "Missing data / withdrawn in ": "Ontbrekende gegevens / teruggetrokken in ",
  "Allocated to ": "Toegewezen aan ",
  "Lost to follow-up / discontinued ": "Uitval tijdens follow-up / gestopt in ",
  "Analysed ": "Geanalyseerd in ",
});

Object.assign(indonesianText, {
  "Protocol Builder": "Penyusun Protokol",
  "Study Question": "Pertanyaan Studi",
  "Outcomes": "Luaran",
  "Variables": "Variabel",
  "Eligibility": "Kriteria Subjek",
  "Bias Planner": "Rencana Kendali Bias",
  "Analysis Plan": "Rencana Analisis",
  "Ethics": "Etik",
  "Timeline": "Linimasa",
  "Data Plan": "Rencana Data",
  "Protocol Check": "Cek Protokol",
  "Protocol preparation": "Persiapan protokol",
  "Build the core protocol elements before sample-size calculation, randomisation, reporting, and figures.": "Susun elemen inti protokol sebelum menghitung besar sampel, randomisasi, pelaporan, dan pembuatan gambar.",
  "Copy section": "Salin bagian",
  "Download template": "Unduh templat",
  "Research question builder": "Penyusun pertanyaan penelitian",
  "Use a structured PICO/PECO frame so the objective, population, comparison, and outcome stay aligned.": "Gunakan kerangka PICO/PECO agar tujuan, populasi, pembanding, dan luaran tetap selaras.",
  "Population": "Populasi",
  "Exposure / intervention": "Pajanan / intervensi",
  "Comparator": "Pembanding",
  "Primary outcome": "Luaran primer",
  "Study setting": "Setting penelitian",
  "Draft question": "Draf pertanyaan",
  "This generated question is only a recommendation; the concept, scope, and wording may still need revision with supervisors, statisticians, or content experts.": "Pertanyaan yang dibuat aplikasi hanya berupa rekomendasi; konsep, ruang lingkup, dan redaksinya mungkin masih perlu disesuaikan bersama pembimbing, statistikawan, atau pakar bidang terkait.",
  "Primary outcome planner": "Perencana luaran primer",
  "Define the endpoint in operational terms before choosing a calculator or statistical test.": "Definisikan endpoint secara operasional sebelum memilih kalkulator atau uji statistik.",
  "Outcome name": "Nama luaran",
  "Outcome type": "Jenis luaran",
  "Measurement time point": "Waktu pengukuran",
  "Measurement instrument": "Instrumen pengukuran",
  "Clinically meaningful difference": "Perbedaan bermakna klinis",
  "Outcome statement": "Pernyataan luaran",
  "Variable dictionary": "Kamus variabel",
  "Create a clean data-collection map with variable names, types, sources, and coding notes.": "Buat peta pengumpulan data yang rapi berisi nama variabel, tipe, sumber, dan catatan pengkodean.",
  "Variable names": "Nama variabel",
  "Variable type": "Tipe variabel",
  "Data source": "Sumber data",
  "Coding notes": "Catatan pengkodean",
  "Data dictionary": "Kamus data",
  "Eligibility criteria builder": "Penyusun kriteria kelayakan",
  "Separate inclusion and exclusion criteria so screening decisions are reproducible.": "Pisahkan kriteria inklusi dan eksklusi agar keputusan skrining dapat direproduksi.",
  "Inclusion criteria": "Kriteria inklusi",
  "Exclusion criteria": "Kriteria eksklusi",
  "Recruitment setting": "Tempat rekrutmen",
  "Screening statement": "Pernyataan skrining",
  "Bias risk planner": "Perencana risiko bias",
  "Plan practical safeguards for selection, measurement, confounding, attrition, and reporting bias.": "Rencanakan perlindungan praktis terhadap bias seleksi, pengukuran, perancu, attrition, dan pelaporan.",
  "Main bias concerns": "Kekhawatiran bias utama",
  "Planned safeguards": "Langkah pengendalian",
  "Bias mitigation statement": "Pernyataan pengendalian bias",
  "Statistical analysis plan builder": "Penyusun rencana analisis statistik",
  "Draft a concise SAP paragraph linked to the primary outcome and adjustment set.": "Susun paragraf SAP yang ringkas dan selaras dengan luaran primer serta variabel penyesuaian.",
  "Primary analysis": "Analisis primer",
  "Effect measure": "Ukuran efek",
  "Adjustment variables": "Variabel penyesuaian",
  "Missing-data approach": "Pendekatan data hilang",
  "SAP wording": "Narasi SAP",
  "Ethics and consent helper": "Bantuan etik dan persetujuan",
  "Prepare ethics-facing language for consent, confidentiality, risks, and dissemination.": "Siapkan bahasa untuk komite etik tentang persetujuan, kerahasiaan, risiko, dan diseminasi.",
  "Consent approach": "Pendekatan persetujuan",
  "Confidentiality plan": "Rencana kerahasiaan",
  "Participant risks": "Risiko bagi peserta",
  "Dissemination plan": "Rencana diseminasi",
  "Ethics wording": "Narasi etik",
  "Ethics and registration workflow": "Alur etik dan registrasi",
  "Prepare the complete protocol, participant-facing documents, data plan, and analysis plan before submission.": "Siapkan protokol lengkap, dokumen untuk peserta, rencana data, dan rencana analisis sebelum pengajuan.",
  "Submit to the relevant IRB or ethics committee and wait for approval before recruitment or data collection.": "Ajukan ke IRB atau komite etik yang relevan dan tunggu persetujuan sebelum rekrutmen atau pengumpulan data.",
  "Register interventional clinical trials in an appropriate public registry before the first participant is enrolled.": "Daftarkan uji klinis intervensi pada registri publik yang sesuai sebelum peserta pertama direkrut.",
  "Register systematic reviews in PROSPERO when eligible, ideally before screening starts.": "Daftarkan tinjauan sistematis di PROSPERO bila memenuhi syarat, idealnya sebelum penyaringan dimulai.",
  "Store or publish the complete protocol in a durable repository to improve transparency and reduce selective reporting.": "Simpan atau publikasikan protokol lengkap di repositori yang tahan lama untuk meningkatkan transparansi dan mengurangi pelaporan selektif.",
  "Registry resources": "Sumber registri",
  "US Clinical Trial Registration": "Registrasi Uji Klinis Amerika Serikat",
  "UK Clinical Study Registry (ISRCTN)": "Registri Studi Klinis Inggris (ISRCTN)",
  "Dutch CCMO": "CCMO Belanda",
  "Indonesian Clinical Research Registry (Ina-CRR)": "Indonesian Clinical Research Registry (Ina-CRR)",
  "WHO-recommended Registry Network": "Jaringan Registri yang Direkomendasikan WHO",
  "Open Science Framework": "Open Science Framework",
  "PROSPERO (for Systematic Reviews)": "PROSPERO (untuk Tinjauan Sistematis)",
  "Study timeline planner": "Perencana linimasa studi",
  "Turn target dates into a simple milestone plan for protocol, approval, recruitment, analysis, and reporting.": "Ubah target tanggal menjadi rencana tonggak untuk protokol, persetujuan, rekrutmen, analisis, dan pelaporan.",
  "Start date": "Tanggal mulai",
  "Months for ethics approval": "Bulan untuk persetujuan etik",
  "Months for recruitment": "Bulan untuk rekrutmen",
  "Months for analysis and writing": "Bulan untuk analisis dan penulisan",
  "Milestone plan": "Rencana tonggak",
  "Data management plan helper": "Bantuan rencana manajemen data",
  "Define storage, access, quality checks, backup, and retention before data collection starts.": "Definisikan penyimpanan, akses, pemeriksaan mutu, cadangan, dan retensi sebelum pengumpulan data dimulai.",
  "Choose a common option or select Others to type a local plan.": "Pilih opsi yang umum digunakan atau pilih Lainnya untuk menulis rencana lokal.",
  "Storage location": "Lokasi penyimpanan",
  "Access control": "Kontrol akses",
  "Quality checks": "Pemeriksaan mutu",
  "Retention period": "Masa retensi",
  "Others": "Lainnya",
  "Type your plan": "Tulis rencana Anda",
  "Institutional secure drive or approved research database": "Drive institusi yang aman atau basis data penelitian yang disetujui",
  "REDCap or equivalent electronic data capture platform": "REDCap atau platform pengumpulan data elektronik sejenis",
  "Encrypted institutional cloud storage": "Penyimpanan cloud institusi yang terenkripsi",
  "Locked cabinet for paper forms plus encrypted digital archive": "Lemari terkunci untuk formulir kertas dan arsip digital terenkripsi",
  "Role-based access for named study team members": "Akses berbasis peran untuk anggota tim studi yang tercantum",
  "Principal investigator and data manager only": "Hanya peneliti utama dan manajer data",
  "Password-protected files with access log": "Berkas terlindung kata sandi dengan log akses",
  "De-identified analysis dataset for statisticians": "Dataset analisis tanpa identitas untuk statistikawan",
  "Range checks, duplicate checks, source-data verification, and query log": "Pemeriksaan rentang, duplikasi, verifikasi data sumber, dan log query",
  "Double data entry for key variables": "Entri data ganda untuk variabel kunci",
  "Weekly missing-data and outlier review": "Tinjauan mingguan untuk data hilang dan pencilan",
  "Pilot testing of case report forms before recruitment": "Uji coba formulir laporan kasus sebelum rekrutmen",
  "At least 5 years after publication or according to institutional policy": "Sekurang-kurangnya 5 tahun setelah publikasi atau sesuai kebijakan institusi",
  "At least 10 years after study completion": "Sekurang-kurangnya 10 tahun setelah studi selesai",
  "As required by IRB, sponsor, or national regulation": "Sesuai ketentuan komite etik, sponsor, atau regulasi nasional",
  "Permanent repository for de-identified protocol and analysis materials": "Repositori permanen untuk protokol dan bahan analisis tanpa identitas",
  "Protocol transparency note": "Catatan transparansi protokol",
  "For transparency, consider publishing the full protocol or storing it in a durable repository before data collection begins.": "Untuk transparansi, pertimbangkan mempublikasikan protokol lengkap atau menyimpannya di repositori yang tahan lama sebelum pengumpulan data dimulai.",
  "Data management wording": "Narasi manajemen data",
  "Protocol completeness checker": "Pemeriksa kelengkapan protokol",
  "Tick completed sections to identify gaps before supervisor, ethics, or grant review.": "Centang bagian yang sudah selesai untuk menemukan kekurangan sebelum telaah pembimbing, etik, atau hibah.",
  "Completeness": "Kelengkapan",
  "Recommended next step": "Langkah berikutnya",
  "Study question and objective": "Pertanyaan dan tujuan penelitian",
  "Primary and secondary outcomes": "Luaran primer dan sekunder",
  "Eligibility criteria and recruitment setting": "Kriteria kelayakan dan tempat rekrutmen",
  "Sample-size rationale": "Dasar perhitungan besar sampel",
  "Statistical analysis plan": "Rencana analisis statistik",
  "Ethics, consent, and confidentiality": "Etik, persetujuan, dan kerahasiaan",
  "Data management plan": "Rencana manajemen data",
  "Reporting checklist selected": "Daftar periksa pelaporan sudah dipilih",
  "Protocol finalisation": "Finalisasi protokol",
  "Ethics approval target": "Target persetujuan etik",
  "Recruitment completion target": "Target selesai rekrutmen",
  "Analysis and writing target": "Target analisis dan penulisan",
  "StudySize Studio version 1.43 © Ryalino, 2026.": "StudySize Studio versi 1.43 © Ryalino, 2026.",
});

Object.assign(dutchText, {
  "Protocol Builder": "Protocolbouwer",
  "Study Question": "Onderzoeksvraag",
  "Outcomes": "Uitkomsten",
  "Variables": "Variabelen",
  "Eligibility": "Geschiktheid",
  "Bias Planner": "Biasplan",
  "Analysis Plan": "Analyseplan",
  "Ethics": "Ethiek",
  "Timeline": "Tijdlijn",
  "Data Plan": "Dataplan",
  "Protocol Check": "Protocolcheck",
  "Protocol preparation": "Protocolvoorbereiding",
  "Build the core protocol elements before sample-size calculation, randomisation, reporting, and figures.": "Werk de kernelementen van het protocol uit vóór steekproefgrootteberekening, randomisatie, rapportage en figuren.",
  "Copy section": "Sectie kopiëren",
  "Download template": "Template downloaden",
  "Research question builder": "Onderzoeksvraag opstellen",
  "Use a structured PICO/PECO frame so the objective, population, comparison, and outcome stay aligned.": "Gebruik een PICO/PECO-structuur zodat doel, populatie, vergelijking en uitkomst op elkaar aansluiten.",
  "Population": "Populatie",
  "Exposure / intervention": "Blootstelling / interventie",
  "Comparator": "Vergelijking",
  "Primary outcome": "Primaire uitkomst",
  "Study setting": "Onderzoekssetting",
  "Draft question": "Conceptvraag",
  "This generated question is only a recommendation; the concept, scope, and wording may still need revision with supervisors, statisticians, or content experts.": "Deze gegenereerde vraag is alleen een aanbeveling; concept, afbakening en formulering kunnen nog aanpassing vragen met begeleiders, statistici of inhoudelijke experts.",
  "Primary outcome planner": "Planner voor primaire uitkomst",
  "Define the endpoint in operational terms before choosing a calculator or statistical test.": "Definieer het eindpunt operationeel voordat u een calculator of statistische toets kiest.",
  "Outcome name": "Naam van de uitkomst",
  "Outcome type": "Type uitkomst",
  "Measurement time point": "Meetmoment",
  "Measurement instrument": "Meetinstrument",
  "Clinically meaningful difference": "Klinisch relevant verschil",
  "Outcome statement": "Uitkomstformulering",
  "Variable dictionary": "Variabelenwoordenboek",
  "Create a clean data-collection map with variable names, types, sources, and coding notes.": "Maak een overzichtelijke dataverzamelingskaart met variabelen, typen, bronnen en coderingsafspraken.",
  "Variable names": "Variabelennamen",
  "Variable type": "Variabeletype",
  "Data source": "Databron",
  "Coding notes": "Coderingsnotities",
  "Data dictionary": "Data dictionary",
  "Eligibility criteria builder": "Criteria voor geschiktheid",
  "Separate inclusion and exclusion criteria so screening decisions are reproducible.": "Scheid inclusie- en exclusiecriteria zodat screeningsbeslissingen reproduceerbaar zijn.",
  "Inclusion criteria": "Inclusiecriteria",
  "Exclusion criteria": "Exclusiecriteria",
  "Recruitment setting": "Recruitmentsetting",
  "Screening statement": "Screeningtekst",
  "Bias risk planner": "Planner voor risico op bias",
  "Plan practical safeguards for selection, measurement, confounding, attrition, and reporting bias.": "Plan praktische maatregelen tegen selectiebias, meetbias, confounding, uitvalbias en rapportagebias.",
  "Main bias concerns": "Belangrijkste biasrisico's",
  "Planned safeguards": "Geplande beheersmaatregelen",
  "Bias mitigation statement": "Tekst over biasbeperking",
  "Statistical analysis plan builder": "Bouwer voor statistisch analyseplan",
  "Draft a concise SAP paragraph linked to the primary outcome and adjustment set.": "Schrijf een compacte SAP-paragraaf die aansluit bij de primaire uitkomst en correctievariabelen.",
  "Primary analysis": "Primaire analyse",
  "Effect measure": "Effectmaat",
  "Adjustment variables": "Correctievariabelen",
  "Missing-data approach": "Aanpak ontbrekende data",
  "SAP wording": "SAP-tekst",
  "Ethics and consent helper": "Hulp voor ethiek en toestemming",
  "Prepare ethics-facing language for consent, confidentiality, risks, and dissemination.": "Bereid tekst voor de ethische commissie voor over toestemming, vertrouwelijkheid, risico's en verspreiding.",
  "Consent approach": "Toestemmingsprocedure",
  "Confidentiality plan": "Plan voor vertrouwelijkheid",
  "Participant risks": "Risico's voor deelnemers",
  "Dissemination plan": "Disseminatieplan",
  "Ethics wording": "Ethiektekst",
  "Ethics and registration workflow": "Workflow voor ethiek en registratie",
  "Prepare the complete protocol, participant-facing documents, data plan, and analysis plan before submission.": "Bereid het volledige protocol, deelnemersinformatie, datamanagementplan en analyseplan voor voordat u indient.",
  "Submit to the relevant IRB or ethics committee and wait for approval before recruitment or data collection.": "Dien in bij de relevante METC/IRB of ethische commissie en wacht op goedkeuring vóór inclusie of dataverzameling.",
  "Register interventional clinical trials in an appropriate public registry before the first participant is enrolled.": "Registreer interventionele klinische trials in een passend openbaar register vóór inclusie van de eerste deelnemer.",
  "Register systematic reviews in PROSPERO when eligible, ideally before screening starts.": "Registreer systematische reviews in PROSPERO wanneer ze daarvoor in aanmerking komen, bij voorkeur vóór de start van screening.",
  "Store or publish the complete protocol in a durable repository to improve transparency and reduce selective reporting.": "Bewaar of publiceer het volledige protocol in een duurzame repository om transparantie te vergroten en selectieve rapportage te beperken.",
  "Registry resources": "Registratiebronnen",
  "US Clinical Trial Registration": "Registratie voor klinische trials in de VS",
  "UK Clinical Study Registry (ISRCTN)": "UK Clinical Study Registry (ISRCTN)",
  "Dutch CCMO": "Nederlandse CCMO",
  "Indonesian Clinical Research Registry (Ina-CRR)": "Indonesian Clinical Research Registry (Ina-CRR)",
  "WHO-recommended Registry Network": "Door de WHO aanbevolen registratienetwerk",
  "Open Science Framework": "Open Science Framework",
  "PROSPERO (for Systematic Reviews)": "PROSPERO (voor systematische reviews)",
  "Study timeline planner": "Planner voor studietijdlijn",
  "Turn target dates into a simple milestone plan for protocol, approval, recruitment, analysis, and reporting.": "Zet streefdata om in een mijlpalenplan voor protocol, goedkeuring, inclusie, analyse en rapportage.",
  "Start date": "Startdatum",
  "Months for ethics approval": "Maanden voor ethische goedkeuring",
  "Months for recruitment": "Maanden voor inclusie",
  "Months for analysis and writing": "Maanden voor analyse en schrijven",
  "Milestone plan": "Mijlpalenplan",
  "Data management plan helper": "Hulp voor datamanagementplan",
  "Define storage, access, quality checks, backup, and retention before data collection starts.": "Leg opslag, toegang, kwaliteitscontroles, back-up en bewaartermijn vast vóór dataverzameling.",
  "Choose a common option or select Others to type a local plan.": "Kies een veelgebruikte optie of selecteer Anders om een lokaal plan te typen.",
  "Storage location": "Opslaglocatie",
  "Access control": "Toegangsbeheer",
  "Quality checks": "Kwaliteitscontroles",
  "Retention period": "Bewaartermijn",
  "Others": "Anders",
  "Type your plan": "Typ uw plan",
  "Institutional secure drive or approved research database": "Beveiligde institutionele schijf of goedgekeurde onderzoeksdatabase",
  "REDCap or equivalent electronic data capture platform": "REDCap of vergelijkbaar elektronisch dataverzamelingsplatform",
  "Encrypted institutional cloud storage": "Versleutelde institutionele cloudopslag",
  "Locked cabinet for paper forms plus encrypted digital archive": "Afsluitbare kast voor papieren formulieren plus versleuteld digitaal archief",
  "Role-based access for named study team members": "Rolgebaseerde toegang voor benoemde leden van het studieteam",
  "Principal investigator and data manager only": "Alleen hoofdonderzoeker en datamanager",
  "Password-protected files with access log": "Met wachtwoord beveiligde bestanden met toegangslog",
  "De-identified analysis dataset for statisticians": "Gede-identificeerde analysedataset voor statistici",
  "Range checks, duplicate checks, source-data verification, and query log": "Bereikcontroles, duplicaatcontroles, brongegevensverificatie en querylog",
  "Double data entry for key variables": "Dubbele data-invoer voor kernvariabelen",
  "Weekly missing-data and outlier review": "Wekelijkse controle van ontbrekende data en uitschieters",
  "Pilot testing of case report forms before recruitment": "Pilottesten van case report forms vóór inclusie",
  "At least 5 years after publication or according to institutional policy": "Minimaal 5 jaar na publicatie of volgens institutioneel beleid",
  "At least 10 years after study completion": "Minimaal 10 jaar na afronding van de studie",
  "As required by IRB, sponsor, or national regulation": "Zoals vereist door METC/IRB, sponsor of nationale regelgeving",
  "Permanent repository for de-identified protocol and analysis materials": "Permanente repository voor gede-identificeerde protocol- en analysematerialen",
  "Protocol transparency note": "Notitie over protocoltransparantie",
  "For transparency, consider publishing the full protocol or storing it in a durable repository before data collection begins.": "Overweeg voor transparantie om het volledige protocol te publiceren of in een duurzame repository op te slaan voordat dataverzameling begint.",
  "Data management wording": "Datamanagementtekst",
  "Protocol completeness checker": "Controle op protocolvolledigheid",
  "Tick completed sections to identify gaps before supervisor, ethics, or grant review.": "Vink afgeronde onderdelen aan om lacunes te vinden vóór beoordeling door supervisor, ethische commissie of subsidieverstrekker.",
  "Completeness": "Volledigheid",
  "Recommended next step": "Aanbevolen vervolgstap",
  "Study question and objective": "Onderzoeksvraag en doelstelling",
  "Primary and secondary outcomes": "Primaire en secundaire uitkomsten",
  "Eligibility criteria and recruitment setting": "Geschiktheidscriteria en inclusiesetting",
  "Sample-size rationale": "Onderbouwing van de steekproefgrootte",
  "Statistical analysis plan": "Statistisch analyseplan",
  "Ethics, consent, and confidentiality": "Ethiek, toestemming en vertrouwelijkheid",
  "Data management plan": "Datamanagementplan",
  "Reporting checklist selected": "Rapportagechecklist geselecteerd",
  "Protocol finalisation": "Protocol afronden",
  "Ethics approval target": "Streefdatum ethische goedkeuring",
  "Recruitment completion target": "Streefdatum einde inclusie",
  "Analysis and writing target": "Streefdatum analyse en schrijven",
  "StudySize Studio version 1.43 © Ryalino, 2026.": "StudySize Studio versie 1.43 © Ryalino, 2026.",
});

Object.assign(indonesianText, {
  "Non-Inferiority Proportion": "Proporsi Non-Inferioritas",
  "Plan a binary-outcome non-inferiority trial using an absolute risk-difference margin.": "Merencanakan uji non-inferioritas dengan luaran biner menggunakan margin selisih risiko absolut.",
  "Control event rate": "Angka kejadian kontrol",
  "Expected event, response, or success rate in control.": "Angka kejadian, respons, atau keberhasilan yang diharapkan pada kontrol.",
  "Experimental event rate": "Angka kejadian eksperimental",
  "Expected event, response, or success rate in experimental treatment.": "Angka kejadian, respons, atau keberhasilan yang diharapkan pada terapi eksperimental.",
  "NI risk-difference margin": "Margin selisih risiko NI",
  "Largest acceptable absolute loss in percentage points.": "Kehilangan absolut terbesar yang masih dapat diterima dalam poin persentase.",
  "One-sided non-inferiority test on the absolute risk-difference scale.": "Uji non-inferioritas satu sisi pada skala selisih risiko absolut.",
  "Higher event rates are assumed beneficial; reverse the endpoint direction before using if lower rates are beneficial.": "Angka kejadian yang lebih tinggi dianggap menguntungkan; balik arah endpoint sebelum memakai kalkulator bila angka yang lebih rendah justru lebih baik.",
  "Margin must be prespecified and clinically justified.": "Margin harus ditetapkan sebelumnya dan dijustifikasi secara klinis.",
  "Equivalence Proportion": "Proporsi Ekivalensi",
  "Plan a binary-outcome equivalence trial using a symmetric absolute risk-difference margin.": "Merencanakan uji ekivalensi dengan luaran biner menggunakan margin selisih risiko absolut yang simetris.",
  "Group A event rate": "Angka kejadian kelompok A",
  "Expected event, response, or success rate in group A.": "Angka kejadian, respons, atau keberhasilan yang diharapkan pada kelompok A.",
  "Group B event rate": "Angka kejadian kelompok B",
  "Expected event, response, or success rate in group B.": "Angka kejadian, respons, atau keberhasilan yang diharapkan pada kelompok B.",
  "Equivalence risk-difference margin": "Margin selisih risiko ekivalensi",
  "Maximum acceptable absolute difference in either direction.": "Perbedaan absolut maksimum yang masih dapat diterima pada kedua arah.",
  "Two one-sided tests approximation on the absolute risk-difference scale.": "Aproksimasi dua uji satu sisi pada skala selisih risiko absolut.",
  "Expected difference must lie within the equivalence margin.": "Perbedaan yang diharapkan harus berada dalam margin ekivalensi.",
  "Use Non-Inferiority Proportion": "Gunakan Proporsi Non-Inferioritas",
  "The trial compares binary event rates and is designed to rule out an unacceptable absolute risk-difference loss.": "Uji ini membandingkan angka kejadian biner dan dirancang untuk menyingkirkan kehilangan selisih risiko absolut yang tidak dapat diterima.",
  "One-sided non-inferiority margin is clinically justified.": "Margin non-inferioritas satu sisi dijustifikasi secara klinis.",
  "Endpoint direction is defined so the margin represents an acceptable loss.": "Arah endpoint ditetapkan sehingga margin merepresentasikan kehilangan yang masih dapat diterima.",
  "Use Equivalence Proportion": "Gunakan Proporsi Ekivalensi",
  "The trial compares binary event rates and is designed to show the absolute risk difference lies within a symmetric equivalence margin.": "Uji ini membandingkan angka kejadian biner dan dirancang untuk menunjukkan selisih risiko absolut berada dalam margin ekivalensi simetris.",
  "Equivalence margin is clinically justified before recruitment.": "Margin ekivalensi dijustifikasi secara klinis sebelum rekrutmen.",
  "Two independent groups are being compared on a binary event or response rate under a superiority objective.": "Dua kelompok independen dibandingkan pada angka kejadian atau respons biner dengan objektif superiority.",
  "Superiority comparison.": "Perbandingan superiority.",
});

Object.assign(dutchText, {
  "Non-Inferiority Proportion": "Non-inferioriteitsproportie",
  "Plan a binary-outcome non-inferiority trial using an absolute risk-difference margin.": "Plan een non-inferioriteitstrial met een binaire uitkomst op basis van een absolute risicoverschilmarge.",
  "Control event rate": "Controle-eventpercentage",
  "Expected event, response, or success rate in control.": "Verwacht event-, respons- of succespercentage in de controlegroep.",
  "Experimental event rate": "Experimenteel eventpercentage",
  "Expected event, response, or success rate in experimental treatment.": "Verwacht event-, respons- of succespercentage in de experimentele behandelgroep.",
  "NI risk-difference margin": "NI-risicoverschilmarge",
  "Largest acceptable absolute loss in percentage points.": "Grootste aanvaardbare absolute verlies in procentpunten.",
  "One-sided non-inferiority test on the absolute risk-difference scale.": "Eenzijdige non-inferioriteitstoets op de absolute risicoverschilschaal.",
  "Higher event rates are assumed beneficial; reverse the endpoint direction before using if lower rates are beneficial.": "Hogere eventpercentages worden als gunstig beschouwd; keer de eindpuntrichting om als lagere percentages gunstig zijn.",
  "Margin must be prespecified and clinically justified.": "De marge moet vooraf zijn vastgelegd en klinisch onderbouwd.",
  "Equivalence Proportion": "Equivalentieproportie",
  "Plan a binary-outcome equivalence trial using a symmetric absolute risk-difference margin.": "Plan een equivalentietrial met een binaire uitkomst op basis van een symmetrische absolute risicoverschilmarge.",
  "Group A event rate": "Eventpercentage groep A",
  "Expected event, response, or success rate in group A.": "Verwacht event-, respons- of succespercentage in groep A.",
  "Group B event rate": "Eventpercentage groep B",
  "Expected event, response, or success rate in group B.": "Verwacht event-, respons- of succespercentage in groep B.",
  "Equivalence risk-difference margin": "Equivalentie-risicoverschilmarge",
  "Maximum acceptable absolute difference in either direction.": "Maximaal aanvaardbaar absoluut verschil in beide richtingen.",
  "Two one-sided tests approximation on the absolute risk-difference scale.": "Benadering met twee eenzijdige toetsen op de absolute risicoverschilschaal.",
  "Expected difference must lie within the equivalence margin.": "Het verwachte verschil moet binnen de equivalentiemarge liggen.",
  "Use Non-Inferiority Proportion": "Gebruik Non-inferioriteitsproportie",
  "The trial compares binary event rates and is designed to rule out an unacceptable absolute risk-difference loss.": "De trial vergelijkt binaire eventpercentages en is ontworpen om een onaanvaardbaar absoluut risicoverschilverlies uit te sluiten.",
  "One-sided non-inferiority margin is clinically justified.": "De eenzijdige non-inferioriteitsmarge is klinisch onderbouwd.",
  "Endpoint direction is defined so the margin represents an acceptable loss.": "De eindpuntrichting is zo gedefinieerd dat de marge een aanvaardbaar verlies weergeeft.",
  "Use Equivalence Proportion": "Gebruik Equivalentieproportie",
  "The trial compares binary event rates and is designed to show the absolute risk difference lies within a symmetric equivalence margin.": "De trial vergelijkt binaire eventpercentages en is ontworpen om aan te tonen dat het absolute risicoverschil binnen een symmetrische equivalentiemarge ligt.",
  "Equivalence margin is clinically justified before recruitment.": "De equivalentiemarge is klinisch onderbouwd vóór de start van inclusie.",
  "Two independent groups are being compared on a binary event or response rate under a superiority objective.": "Twee onafhankelijke groepen worden vergeleken op een binair event- of responspercentage met een superioriteitsdoel.",
  "Superiority comparison.": "Superioriteitsvergelijking.",
});

Object.assign(indonesianText, {
  "Question framework": "Kerangka pertanyaan",
  "Choose the framework that best matches the study design before writing the question.": "Pilih kerangka yang paling sesuai dengan desain studi sebelum menyusun pertanyaan.",
  "PICO": "PICO",
  "Intervention/comparison question, including RCTs and quasi-experimental studies.": "Pertanyaan intervensi/perbandingan, termasuk RCT dan studi kuasi-eksperimental.",
  "PECO": "PECO",
  "Exposure and outcome question for observational research.": "Pertanyaan pajanan dan luaran untuk penelitian observasional.",
  "PIRD": "PIRD",
  "Diagnostic accuracy question using an index test and reference standard.": "Pertanyaan akurasi diagnostik dengan tes indeks dan standar referensi.",
  "PICo": "PICo",
  "Qualitative question focused on participants, phenomenon of interest, and context.": "Pertanyaan kualitatif yang berfokus pada partisipan, fenomena minat, dan konteks.",
  "Prognostic": "Prognostik",
  "Prognostic factor, model, or prediction question with an outcome and time horizon.": "Pertanyaan faktor prognostik, model, atau prediksi dengan luaran dan horizon waktu.",
  "Intervention": "Intervensi",
  "Outcome": "Luaran",
  "Exposure": "Pajanan",
  "Comparator/control": "Pembanding/kontrol",
  "Index test": "Tes indeks",
  "Reference standard": "Standar referensi",
  "Target condition": "Kondisi target",
  "Participants": "Partisipan",
  "Interest / phenomenon": "Minat / fenomena",
  "Context": "Konteks",
  "Prognostic factor/model": "Faktor/model prognostik",
  "Time horizon": "Horizon waktu",
  "Copy question": "Salin pertanyaan",
  "Use for sample size decision tree": "Gunakan untuk alur besar sampel",
  "Started from your research question": "Dimulai dari pertanyaan penelitian Anda",
  "Please confirm the remaining design details before choosing a formula.": "Konfirmasi detail desain yang tersisa sebelum memilih rumus.",
  "The qualitative PICo framework does not map directly to a standard quantitative sample-size formula. The tree will show where statistical review or qualitative sampling justification is needed.": "Kerangka PICo kualitatif tidak langsung terhubung dengan rumus besar sampel kuantitatif standar. Alur akan menunjukkan kapan telaah statistik atau justifikasi sampling kualitatif diperlukan.",
});

Object.assign(dutchText, {
  "Question framework": "Vraagkader",
  "Choose the framework that best matches the study design before writing the question.": "Kies eerst het kader dat het best past bij het studiedesign voordat u de vraag formuleert.",
  "PICO": "PICO",
  "Intervention/comparison question, including RCTs and quasi-experimental studies.": "Interventie- of vergelijkingsvraag, inclusief RCT's en quasi-experimentele studies.",
  "PECO": "PECO",
  "Exposure and outcome question for observational research.": "Blootstellings- en uitkomstvraag voor observationeel onderzoek.",
  "PIRD": "PIRD",
  "Diagnostic accuracy question using an index test and reference standard.": "Diagnostische accuratessevraag met een indextest en referentiestandaard.",
  "PICo": "PICo",
  "Qualitative question focused on participants, phenomenon of interest, and context.": "Kwalitatieve vraag gericht op deelnemers, fenomeen van interesse en context.",
  "Prognostic": "Prognostisch",
  "Prognostic factor, model, or prediction question with an outcome and time horizon.": "Vraag over prognostische factor, model of voorspelling met uitkomst en tijdshorizon.",
  "Intervention": "Interventie",
  "Outcome": "Uitkomst",
  "Exposure": "Blootstelling",
  "Comparator/control": "Vergelijking/controle",
  "Index test": "Indextest",
  "Reference standard": "Referentiestandaard",
  "Target condition": "Doelaandoening",
  "Participants": "Deelnemers",
  "Interest / phenomenon": "Interesse / fenomeen",
  "Context": "Context",
  "Prognostic factor/model": "Prognostische factor/model",
  "Time horizon": "Tijdshorizon",
  "Copy question": "Vraag kopiëren",
  "Use for sample size decision tree": "Gebruiken voor beslisboom steekproefgrootte",
  "Started from your research question": "Gestart vanuit uw onderzoeksvraag",
  "Please confirm the remaining design details before choosing a formula.": "Bevestig de resterende ontwerpdetails voordat u een formule kiest.",
  "The qualitative PICo framework does not map directly to a standard quantitative sample-size formula. The tree will show where statistical review or qualitative sampling justification is needed.": "Het kwalitatieve PICo-kader sluit niet rechtstreeks aan op een standaard kwantitatieve steekproefgrootteformule. De beslisboom laat zien waar statistische beoordeling of kwalitatieve steekproefonderbouwing nodig is.",
});

const pct = (value: number) => value / 100;
const ceil = (value: number) => Math.max(1, Math.ceil(value));
const dropoutInflation = (n: number, dropout: number) => ceil(n / (1 - pct(dropout)));
const appVersion = "1.43";

Object.assign(indonesianText, {
  "Report Bug": "Laporkan masalah",
  "Beta Feedback": "Umpan balik beta",
  "Bug report": "Laporan masalah",
  "Beta feedback": "Umpan balik beta",
  "Use this structured form during beta testing. Copy or download the report and send it to the StudySize Studio team. Do not include names, medical record numbers, dates of birth, or other patient-identifiable information.": "Gunakan formulir terstruktur ini selama uji beta. Salin atau unduh laporan lalu kirimkan ke tim StudySize Studio. Jangan mencantumkan nama, nomor rekam medis, tanggal lahir, atau informasi lain yang dapat mengidentifikasi pasien.",
  "Your feedback helps identify confusing wording, calculation concerns, mobile usability problems, and missing research-planning features.": "Umpan balik Anda membantu menemukan istilah yang membingungkan, masalah perhitungan, kendala penggunaan di ponsel, dan fitur perencanaan riset yang masih perlu ditambahkan.",
  "Name (optional)": "Nama (opsional)",
  "Email (optional)": "Email (opsional)",
  "User role": "Peran pengguna",
  "Country / institution type": "Negara / jenis institusi",
  "Page or tool affected": "Halaman atau alat yang terdampak",
  "What were you trying to do?": "Apa yang sedang Anda coba lakukan?",
  "What happened?": "Apa yang terjadi?",
  "What did you expect to happen?": "Apa yang Anda harapkan terjadi?",
  "Steps to reproduce": "Langkah untuk mereproduksi",
  "Severity": "Tingkat keparahan",
  "Screenshot (optional)": "Tangkapan layar (opsional)",
  "Browser and device": "Browser dan perangkat",
  "Report date/time": "Tanggal/waktu laporan",
  "App version": "Versi aplikasi",
  "Calculation-related details": "Detail terkait perhitungan",
  "Calculator name": "Nama kalkulator",
  "Input values": "Nilai input",
  "Output shown": "Hasil yang tampil",
  "Expected output or reference": "Hasil yang diharapkan atau referensi",
  "Privacy confirmation": "Konfirmasi privasi",
  "I confirm this report does not include patient-identifiable information.": "Saya mengonfirmasi laporan ini tidak memuat informasi yang dapat mengidentifikasi pasien.",
  "Copy report": "Salin laporan",
  "Download report": "Unduh laporan",
  "Bug report copied": "Laporan masalah disalin",
  "Feedback copied": "Umpan balik disalin",
  "Overall ease of use": "Kemudahan penggunaan secara keseluruhan",
  "Tools used": "Alat yang digunakan",
  "Calculator recommendation was understandable": "Rekomendasi kalkulator mudah dipahami",
  "Formula and parameter explanations helped me": "Penjelasan rumus dan parameter membantu saya",
  "I trusted the result": "Saya percaya pada hasilnya",
  "I would use this in protocol preparation": "Saya akan menggunakannya dalam penyusunan protokol",
  "Permission to contact for follow-up": "Kesediaan dihubungi untuk tindak lanjut",
  "Anything confusing or missing?": "Apa yang membingungkan atau belum tersedia?",
  "Suggested features": "Saran fitur",
  "Likert scale": "Skala Likert",
  "Use the 1 to 5 scale instead of yes/no answers.": "Gunakan skala 1 sampai 5, bukan jawaban ya/tidak.",
  "Strongly disagree": "Sangat tidak setuju",
  "Disagree": "Tidak setuju",
  "Neutral": "Netral",
  "Agree": "Setuju",
  "Strongly agree": "Sangat setuju",
  "Not applicable": "Tidak berlaku",
});

Object.assign(dutchText, {
  "Report Bug": "Probleem melden",
  "Beta Feedback": "Beta-feedback",
  "Bug report": "Probleemrapport",
  "Beta feedback": "Beta-feedback",
  "Use this structured form during beta testing. Copy or download the report and send it to the StudySize Studio team. Do not include names, medical record numbers, dates of birth, or other patient-identifiable information.": "Gebruik dit gestructureerde formulier tijdens de betatest. Kopieer of download het rapport en stuur het naar het StudySize Studio-team. Vermeld geen namen, patiëntnummers, geboortedata of andere herleidbare patiëntgegevens.",
  "Your feedback helps identify confusing wording, calculation concerns, mobile usability problems, and missing research-planning features.": "Uw feedback helpt om onduidelijke formuleringen, mogelijke rekenproblemen, mobiele gebruiksproblemen en ontbrekende functies voor onderzoeksplanning te vinden.",
  "Name (optional)": "Naam (optioneel)",
  "Email (optional)": "E-mail (optioneel)",
  "User role": "Rol van gebruiker",
  "Country / institution type": "Land / type instelling",
  "Page or tool affected": "Betrokken pagina of functie",
  "What were you trying to do?": "Wat probeerde u te doen?",
  "What happened?": "Wat gebeurde er?",
  "What did you expect to happen?": "Wat had u verwacht?",
  "Steps to reproduce": "Stappen om het probleem te reproduceren",
  "Severity": "Ernst",
  "Screenshot (optional)": "Screenshot (optioneel)",
  "Browser and device": "Browser en apparaat",
  "Report date/time": "Datum/tijd van melding",
  "App version": "App-versie",
  "Calculation-related details": "Details over de berekening",
  "Calculator name": "Naam van calculator",
  "Input values": "Ingevoerde waarden",
  "Output shown": "Getoonde uitkomst",
  "Expected output or reference": "Verwachte uitkomst of referentie",
  "Privacy confirmation": "Privacybevestiging",
  "I confirm this report does not include patient-identifiable information.": "Ik bevestig dat dit rapport geen herleidbare patiëntgegevens bevat.",
  "Copy report": "Rapport kopiëren",
  "Download report": "Rapport downloaden",
  "Bug report copied": "Probleemrapport gekopieerd",
  "Feedback copied": "Feedback gekopieerd",
  "Overall ease of use": "Algemene gebruiksvriendelijkheid",
  "Tools used": "Gebruikte functies",
  "Calculator recommendation was understandable": "De calculatoraanbeveling was begrijpelijk",
  "Formula and parameter explanations helped me": "De uitleg van formule en parameters hielp mij",
  "I trusted the result": "Ik vertrouwde de uitkomst",
  "I would use this in protocol preparation": "Ik zou dit gebruiken bij protocolvoorbereiding",
  "Permission to contact for follow-up": "Toestemming voor contact over vervolgvragen",
  "Anything confusing or missing?": "Wat was onduidelijk of ontbrak?",
  "Suggested features": "Suggesties voor functies",
  "Likert scale": "Likertschaal",
  "Use the 1 to 5 scale instead of yes/no answers.": "Gebruik de schaal van 1 tot 5 in plaats van ja/nee-antwoorden.",
  "Strongly disagree": "Helemaal oneens",
  "Disagree": "Oneens",
  "Neutral": "Neutraal",
  "Agree": "Eens",
  "Strongly agree": "Helemaal eens",
  "Not applicable": "Niet van toepassing",
});

const dataPlanPresets = {
  storageLocation: [
    "Institutional secure drive or approved research database",
    "REDCap or equivalent electronic data capture platform",
    "Encrypted institutional cloud storage",
    "Locked cabinet for paper forms plus encrypted digital archive",
  ],
  accessControl: [
    "Role-based access for named study team members",
    "Principal investigator and data manager only",
    "Password-protected files with access log",
    "De-identified analysis dataset for statisticians",
  ],
  qualityChecks: [
    "Range checks, duplicate checks, source-data verification, and query log",
    "Double data entry for key variables",
    "Weekly missing-data and outlier review",
    "Pilot testing of case report forms before recruitment",
  ],
  retentionPeriod: [
    "At least 5 years after publication or according to institutional policy",
    "At least 10 years after study completion",
    "As required by IRB, sponsor, or national regulation",
    "Permanent repository for de-identified protocol and analysis materials",
  ],
};

const ethicsWorkflowLinks = [
  ["US Clinical Trial Registration", "https://register.clinicaltrials.gov/"],
  ["UK Clinical Study Registry (ISRCTN)", "https://www.isrctn.com/"],
  ["Dutch CCMO", "https://portaal.onderzoekmetmensen.nl/en/auth/login"],
  ["Indonesian Clinical Research Registry (Ina-CRR)", "https://ina-crr.id/"],
  ["WHO-recommended Registry Network", "http://who.int/tools/clinical-trials-registry-platform/network/primary-registries"],
  ["Open Science Framework", "https://osf.io/"],
  ["PROSPERO (for Systematic Reviews)", "https://www.crd.york.ac.uk/prospero/"],
];

const ethicsWorkflowSteps = [
  "Prepare the complete protocol, participant-facing documents, data plan, and analysis plan before submission.",
  "Submit to the relevant IRB or ethics committee and wait for approval before recruitment or data collection.",
  "Register interventional clinical trials in an appropriate public registry before the first participant is enrolled.",
  "Register systematic reviews in PROSPERO when eligible, ideally before screening starts.",
  "Store or publish the complete protocol in a durable repository to improve transparency and reduce selective reporting.",
];

const referenceCitations: Record<string, { vancouver: string; harvard: string }> = {
  "Cochran WG. Sampling Techniques.": {
    vancouver: "Cochran WG. Sampling techniques. 3rd ed. New York: John Wiley & Sons; 1977.",
    harvard: "Cochran, W.G. (1977) Sampling techniques. 3rd edn. New York: John Wiley & Sons.",
  },
  "Lwanga SK, Lemeshow S. Sample Size Determination in Health Studies.": {
    vancouver: "Lwanga SK, Lemeshow S. Sample size determination in health studies: a practical manual. Geneva: World Health Organization; 1991.",
    harvard: "Lwanga, S.K. and Lemeshow, S. (1991) Sample size determination in health studies: a practical manual. Geneva: World Health Organization.",
  },
  "Julious SA. Sample Sizes for Clinical Trials.": {
    vancouver: "Julious SA. Sample sizes for clinical trials. Boca Raton: CRC Press; 2009.",
    harvard: "Julious, S.A. (2009) Sample sizes for clinical trials. Boca Raton: CRC Press.",
  },
  "Chow SC, Shao J, Wang H, Lokhnygina Y. Sample Size Calculations in Clinical Research.": {
    vancouver: "Chow SC, Shao J, Wang H, Lokhnygina Y. Sample size calculations in clinical research. 3rd ed. Boca Raton: CRC Press; 2018.",
    harvard: "Chow, S.C., Shao, J., Wang, H. and Lokhnygina, Y. (2018) Sample size calculations in clinical research. 3rd edn. Boca Raton: CRC Press.",
  },
  "Chow SC et al. Sample Size Calculations in Clinical Research.": {
    vancouver: "Chow SC, Shao J, Wang H, Lokhnygina Y. Sample size calculations in clinical research. 3rd ed. Boca Raton: CRC Press; 2018.",
    harvard: "Chow, S.C., Shao, J., Wang, H. and Lokhnygina, Y. (2018) Sample size calculations in clinical research. 3rd edn. Boca Raton: CRC Press.",
  },
  "Machin D et al. Sample Size Tables for Clinical Studies.": {
    vancouver: "Machin D, Campbell MJ, Tan SB, Tan SH. Sample size tables for clinical studies. 3rd ed. Chichester: Wiley-Blackwell; 2009.",
    harvard: "Machin, D., Campbell, M.J., Tan, S.B. and Tan, S.H. (2009) Sample size tables for clinical studies. 3rd edn. Chichester: Wiley-Blackwell.",
  },
  "Fleiss JL, Levin B, Paik MC. Statistical Methods for Rates and Proportions.": {
    vancouver: "Fleiss JL, Levin B, Paik MC. Statistical methods for rates and proportions. 3rd ed. Hoboken: John Wiley & Sons; 2003.",
    harvard: "Fleiss, J.L., Levin, B. and Paik, M.C. (2003) Statistical methods for rates and proportions. 3rd edn. Hoboken: John Wiley & Sons.",
  },
  "Fleiss JL et al. Statistical Methods for Rates and Proportions.": {
    vancouver: "Fleiss JL, Levin B, Paik MC. Statistical methods for rates and proportions. 3rd ed. Hoboken: John Wiley & Sons; 2003.",
    harvard: "Fleiss, J.L., Levin, B. and Paik, M.C. (2003) Statistical methods for rates and proportions. 3rd edn. Hoboken: John Wiley & Sons.",
  },
  "Cohen J. Statistical Power Analysis for the Behavioral Sciences.": {
    vancouver: "Cohen J. Statistical power analysis for the behavioral sciences. 2nd ed. Hillsdale: Lawrence Erlbaum Associates; 1988.",
    harvard: "Cohen, J. (1988) Statistical power analysis for the behavioral sciences. 2nd edn. Hillsdale: Lawrence Erlbaum Associates.",
  },
  "Buderer NMF. Statistical methodology: I. Incorporating prevalence into sample size calculations for sensitivity and specificity.": {
    vancouver: "Buderer NMF. Statistical methodology: I. Incorporating the prevalence of disease into the sample size calculation for sensitivity and specificity. Acad Emerg Med. 1996;3(9):895-900.",
    harvard: "Buderer, N.M.F. (1996) 'Statistical methodology: I. Incorporating the prevalence of disease into the sample size calculation for sensitivity and specificity', Academic Emergency Medicine, 3(9), pp. 895-900.",
  },
  "Flahault A et al. Sample size calculation should be performed for design accuracy in diagnostic test studies.": {
    vancouver: "Flahault A, Cadilhac M, Thomas G. Sample size calculation should be performed for design accuracy in diagnostic test studies. J Clin Epidemiol. 2005;58(8):859-862.",
    harvard: "Flahault, A., Cadilhac, M. and Thomas, G. (2005) 'Sample size calculation should be performed for design accuracy in diagnostic test studies', Journal of Clinical Epidemiology, 58(8), pp. 859-862.",
  },
  "Flahault A et al. Diagnostic test sample size methodology.": {
    vancouver: "Flahault A, Cadilhac M, Thomas G. Sample size calculation should be performed for design accuracy in diagnostic test studies. J Clin Epidemiol. 2005;58(8):859-862.",
    harvard: "Flahault, A., Cadilhac, M. and Thomas, G. (2005) 'Sample size calculation should be performed for design accuracy in diagnostic test studies', Journal of Clinical Epidemiology, 58(8), pp. 859-862.",
  },
  "Kelsey JL et al. Methods in Observational Epidemiology.": {
    vancouver: "Kelsey JL, Whittemore AS, Evans AS, Thompson WD. Methods in observational epidemiology. 2nd ed. New York: Oxford University Press; 1996.",
    harvard: "Kelsey, J.L., Whittemore, A.S., Evans, A.S. and Thompson, W.D. (1996) Methods in observational epidemiology. 2nd edn. New York: Oxford University Press.",
  },
  "Schlesselman JJ. Case-Control Studies.": {
    vancouver: "Schlesselman JJ. Case-control studies: design, conduct, analysis. New York: Oxford University Press; 1982.",
    harvard: "Schlesselman, J.J. (1982) Case-control studies: design, conduct, analysis. New York: Oxford University Press.",
  },
  "ICH E9 Statistical Principles for Clinical Trials.": {
    vancouver: "International Council for Harmonisation. ICH E9: statistical principles for clinical trials. Geneva: ICH; 1998.",
    harvard: "International Council for Harmonisation (1998) ICH E9: statistical principles for clinical trials. Geneva: ICH.",
  },
  "Donner A, Klar N. Design and Analysis of Cluster Randomization Trials.": {
    vancouver: "Donner A, Klar N. Design and analysis of cluster randomization trials in health research. London: Arnold; 2000.",
    harvard: "Donner, A. and Klar, N. (2000) Design and analysis of cluster randomization trials in health research. London: Arnold.",
  },
  "Hayes RJ, Moulton LH. Cluster Randomised Trials.": {
    vancouver: "Hayes RJ, Moulton LH. Cluster randomised trials. 2nd ed. Boca Raton: CRC Press; 2017.",
    harvard: "Hayes, R.J. and Moulton, L.H. (2017) Cluster randomised trials. 2nd edn. Boca Raton: CRC Press.",
  },
  "Schoenfeld DA. Sample-size formula for the proportional-hazards regression model.": {
    vancouver: "Schoenfeld DA. Sample-size formula for the proportional-hazards regression model. Biometrics. 1983;39(2):499-503.",
    harvard: "Schoenfeld, D.A. (1983) 'Sample-size formula for the proportional-hazards regression model', Biometrics, 39(2), pp. 499-503.",
  },
  "Freedman LS. Tables of the number of patients required in clinical trials using the logrank test.": {
    vancouver: "Freedman LS. Tables of the number of patients required in clinical trials using the logrank test. Stat Med. 1982;1(2):121-129.",
    harvard: "Freedman, L.S. (1982) 'Tables of the number of patients required in clinical trials using the logrank test', Statistics in Medicine, 1(2), pp. 121-129.",
  },
  "Green SB. How many subjects does it take to do a regression analysis?": {
    vancouver: "Green SB. How many subjects does it take to do a regression analysis? Multivariate Behav Res. 1991;26(3):499-510.",
    harvard: "Green, S.B. (1991) 'How many subjects does it take to do a regression analysis?', Multivariate Behavioral Research, 26(3), pp. 499-510.",
  },
  "Peduzzi P et al. A simulation study of the number of events per variable in logistic regression analysis.": {
    vancouver: "Peduzzi P, Concato J, Kemper E, Holford TR, Feinstein AR. A simulation study of the number of events per variable in logistic regression analysis. J Clin Epidemiol. 1996;49(12):1373-1379.",
    harvard: "Peduzzi, P., Concato, J., Kemper, E., Holford, T.R. and Feinstein, A.R. (1996) 'A simulation study of the number of events per variable in logistic regression analysis', Journal of Clinical Epidemiology, 49(12), pp. 1373-1379.",
  },
  "Riley RD et al. Minimum sample size for developing a multivariable prediction model.": {
    vancouver: "Riley RD, Snell KIE, Ensor J, Burke DL, Harrell FE Jr, Moons KGM, et al. Minimum sample size for developing a multivariable prediction model: PART II - binary and time-to-event outcomes. Stat Med. 2019;38(7):1276-1296.",
    harvard: "Riley, R.D. et al. (2019) 'Minimum sample size for developing a multivariable prediction model: PART II - binary and time-to-event outcomes', Statistics in Medicine, 38(7), pp. 1276-1296.",
  },
  "Blackwelder WC. Proving the null hypothesis in clinical trials.": {
    vancouver: "Blackwelder WC. Proving the null hypothesis in clinical trials. Control Clin Trials. 1982;3(4):345-353.",
    harvard: "Blackwelder, W.C. (1982) 'Proving the null hypothesis in clinical trials', Controlled Clinical Trials, 3(4), pp. 345-353.",
  },
  "Farrington CP, Manning G. Test statistics and sample size formulae for comparative binomial trials with null hypothesis of non-zero risk difference or non-unity relative risk.": {
    vancouver: "Farrington CP, Manning G. Test statistics and sample size formulae for comparative binomial trials with null hypothesis of non-zero risk difference or non-unity relative risk. Stat Med. 1990;9(12):1447-1454.",
    harvard: "Farrington, C.P. and Manning, G. (1990) 'Test statistics and sample size formulae for comparative binomial trials with null hypothesis of non-zero risk difference or non-unity relative risk', Statistics in Medicine, 9(12), pp. 1447-1454.",
  },
};

function formatCalculatorReference(reference: string, format: ReferenceFormat) {
  return referenceCitations[reference]?.[format] ?? reference;
}

function PresetField({ label, value, options, language, onChange }: PresetFieldProps) {
  const isPreset = options.includes(value);
  return (
    <label className="control compact-control">
      <span>
        <strong>{t(label, language)}</strong>
        <small>{t("Choose a common option or select Others to type a local plan.", language)}</small>
      </span>
      <select
        aria-label={t(label, language)}
        value={isPreset ? value : "Others"}
        onChange={(event) => onChange(event.target.value === "Others" ? "" : event.target.value)}
      >
        {options.map((option) => (
          <option key={option} value={option}>{t(option, language)}</option>
        ))}
        <option value="Others">{t("Others", language)}</option>
      </select>
      {!isPreset && (
        <input
          aria-label={`${t(label, language)} ${t("Others", language)}`}
          placeholder={t("Type your plan", language)}
          type="text"
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
      )}
    </label>
  );
}

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

function binaryMarginSampleSize(
  pControl: number,
  pExperimental: number,
  margin: number,
  allocationRatio: number,
  alpha: number,
  power: number,
  objective: "noninferiority" | "equivalence",
) {
  const ratio = Math.max(0.01, allocationRatio);
  const expectedDifference = pExperimental - pControl;
  const distanceToMargin = objective === "noninferiority" ? expectedDifference + margin : margin - Math.abs(expectedDifference);
  if (distanceToMargin <= 1e-9) {
    return { control: Number.POSITIVE_INFINITY, experimental: Number.POSITIVE_INFINITY, total: Number.POSITIVE_INFINITY, distanceToMargin };
  }
  const variance = pControl * (1 - pControl) + (pExperimental * (1 - pExperimental)) / ratio;
  const control = ((zAlpha(alpha, 1) + zPower(power)) ** 2 * variance) / distanceToMargin ** 2;
  const controlN = ceil(control);
  const experimentalN = ceil(controlN * ratio);
  return { control: controlN, experimental: experimentalN, total: controlN + experimentalN, distanceToMargin };
}

const languageOptions: { code: Language; label: string; flag: string; aria: string }[] = [
  { code: "en", label: "English", flag: "🇬🇧", aria: "Switch to English" },
  { code: "id", label: "Bahasa Indonesia", flag: "🇮🇩", aria: "Ganti ke Bahasa Indonesia" },
  { code: "nl", label: "Nederlands", flag: "🇳🇱", aria: "Schakel naar Nederlands" },
];

const questionFrameworkOptions: { value: QuestionFramework; label: string; description: string }[] = [
  { value: "pico", label: "PICO", description: "Intervention/comparison question, including RCTs and quasi-experimental studies." },
  { value: "peco", label: "PECO", description: "Exposure and outcome question for observational research." },
  { value: "pird", label: "PIRD", description: "Diagnostic accuracy question using an index test and reference standard." },
  { value: "pico-qual", label: "PICo", description: "Qualitative question focused on participants, phenomenon of interest, and context." },
  { value: "prognostic", label: "Prognostic", description: "Prognostic factor, model, or prediction question with an outcome and time horizon." },
];

const zTableRows: ZTableRow[] = [
  { context: "Two-sided alpha 10% / 90% confidence", probability: "0.950", z: "1.645" },
  { context: "Two-sided alpha 5% / 95% confidence", probability: "0.975", z: "1.960" },
  { context: "Two-sided alpha 1% / 99% confidence", probability: "0.995", z: "2.576" },
  { context: "One-sided alpha 5%", probability: "0.950", z: "1.645" },
  { context: "One-sided alpha 2.5%", probability: "0.975", z: "1.960" },
  { context: "Power 80% / beta 20%", probability: "0.800", z: "0.842" },
  { context: "Power 90% / beta 10%", probability: "0.900", z: "1.282" },
  { context: "Power 95% / beta 5%", probability: "0.950", z: "1.645" },
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
      help: "Alpha (α), the Type I error rate used to obtain Zα or Zα/2.",
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
      help: "Power (1-β), the chance of detecting the target effect; it determines Zβ.",
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
  "two-means.mean1": {
    en: "Enter the mean reported for one group in a reference study, pilot study, or credible dataset. There is no standard value; use the same outcome scale as your planned study.",
    id: "Masukkan rerata yang dilaporkan untuk salah satu kelompok pada studi referensi, studi pilot, atau dataset yang kredibel. Tidak ada nilai standar; gunakan skala luaran yang sama dengan studi yang direncanakan.",
    nl: "Voer het gemiddelde in dat voor een groep is gerapporteerd in een referentiestudie, pilotstudie of betrouwbare dataset. Er is geen standaardwaarde; gebruik dezelfde uitkomstschaal als in uw geplande studie.",
  },
  "two-means.mean2": {
    en: "Enter the mean reported for the other group. The app calculates the absolute mean difference automatically, so users do not need to subtract the means manually.",
    id: "Masukkan rerata yang dilaporkan untuk kelompok lain. Aplikasi menghitung selisih rerata absolut secara otomatis, sehingga pengguna tidak perlu mengurangkan rerata secara manual.",
    nl: "Voer het gemiddelde in dat voor de andere groep is gerapporteerd. De app berekent automatisch het absolute gemiddelde verschil, zodat gebruikers dit niet handmatig hoeven af te trekken.",
  },
  "two-means.sd1": {
    en: "Enter the SD reported for group 1 in the reference source. The app uses group 1 and group 2 SDs to estimate a pooled SD; there is no universal standard SD.",
    id: "Masukkan SD yang dilaporkan untuk kelompok 1 pada sumber referensi. Aplikasi menggunakan SD kelompok 1 dan 2 untuk memperkirakan SD gabungan; tidak ada SD standar universal.",
    nl: "Voer de SD in die voor groep 1 in de referentiebron is gerapporteerd. De app gebruikt de SD's van groep 1 en 2 om een gepoolde SD te schatten; er is geen universele standaard-SD.",
  },
  "two-means.sd2": {
    en: "Enter the SD reported for group 2. If only one SD is available, enter the same SD in both groups or use the larger SD as a conservative sensitivity scenario.",
    id: "Masukkan SD yang dilaporkan untuk kelompok 2. Bila hanya satu SD tersedia, masukkan SD yang sama pada kedua kelompok atau gunakan SD yang lebih besar sebagai skenario sensitivitas konservatif.",
    nl: "Voer de SD in die voor groep 2 is gerapporteerd. Als slechts een SD beschikbaar is, vul dezelfde SD voor beide groepen in of gebruik de hogere SD als conservatief gevoeligheidsscenario.",
  },
  "paired-mean.meanBefore": {
    en: "Enter the baseline or pre-intervention mean from paired reference data. There is no standard value; use a population and measurement scale close to your study.",
    id: "Masukkan rerata awal atau pra-intervensi dari data referensi berpasangan. Tidak ada nilai standar; gunakan populasi dan skala pengukuran yang dekat dengan studi Anda.",
    nl: "Voer het baseline- of pre-interventiegemiddelde uit gepaarde referentiegegevens in. Er is geen standaardwaarde; gebruik een populatie en meetschaal die dicht bij uw studie liggen.",
  },
  "paired-mean.meanAfter": {
    en: "Enter the follow-up or post-intervention mean from paired reference data. The app calculates the mean change automatically.",
    id: "Masukkan rerata follow-up atau pasca-intervensi dari data referensi berpasangan. Aplikasi menghitung perubahan rerata secara otomatis.",
    nl: "Voer het follow-up- of post-interventiegemiddelde uit gepaarde referentiegegevens in. De app berekent de gemiddelde verandering automatisch.",
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
  "noninferiority-proportions.pControl": {
    en: "Control event rate is the expected event, response, or success rate in the standard-care group. Use the endpoint direction defined in the protocol.",
    id: "Angka kejadian kontrol adalah kejadian, respons, atau keberhasilan yang diharapkan pada kelompok standar. Gunakan arah endpoint sesuai protokol.",
    nl: "Het controle-eventpercentage is het verwachte event-, respons- of succespercentage in de standaardzorggroep. Gebruik de eindpuntrichting zoals in het protocol vastgelegd.",
  },
  "noninferiority-proportions.pExperimental": {
    en: "Experimental event rate is the expected rate in the new treatment group. The app compares this with control on the absolute risk-difference scale.",
    id: "Angka kejadian eksperimental adalah angka yang diharapkan pada kelompok terapi baru. Aplikasi membandingkannya dengan kontrol pada skala selisih risiko absolut.",
    nl: "Het experimentele eventpercentage is het verwachte percentage in de nieuwe behandelgroep. De app vergelijkt dit met controle op de absolute risicoverschilschaal.",
  },
  "noninferiority-proportions.margin": {
    en: "This is the largest acceptable absolute loss in percentage points. It must be prespecified and clinically justified; no universal standard margin exists.",
    id: "Ini adalah kehilangan absolut terbesar yang masih dapat diterima dalam poin persentase. Nilai ini harus ditetapkan sebelumnya dan dijustifikasi secara klinis; tidak ada margin standar universal.",
    nl: "Dit is het grootste aanvaardbare absolute verlies in procentpunten. Deze marge moet vooraf worden vastgelegd en klinisch onderbouwd; er bestaat geen universele standaardmarge.",
  },
  "equivalence-proportions.pGroupA": {
    en: "Group A event rate is one expected binary endpoint rate. Use the same endpoint direction and definition as planned for analysis.",
    id: "Angka kejadian kelompok A adalah salah satu angka endpoint biner yang diharapkan. Gunakan arah dan definisi endpoint yang sama dengan rencana analisis.",
    nl: "Het eventpercentage in groep A is een van de verwachte binaire eindpuntpercentages. Gebruik dezelfde eindpuntrichting en definitie als in de geplande analyse.",
  },
  "equivalence-proportions.pGroupB": {
    en: "Group B event rate is the expected comparator rate. Equivalence is hardest to show when the expected rates are close to the margin boundary.",
    id: "Angka kejadian kelompok B adalah angka pembanding yang diharapkan. Ekivalensi paling sulit dibuktikan bila angka yang diharapkan mendekati batas margin.",
    nl: "Het eventpercentage in groep B is het verwachte vergelijkingspercentage. Equivalentie is het moeilijkst aan te tonen wanneer de verwachte percentages dicht bij de margegrens liggen.",
  },
  "equivalence-proportions.margin": {
    en: "This symmetric margin is the maximum acceptable absolute difference in either direction. It must be clinically justified before the trial starts.",
    id: "Margin simetris ini adalah perbedaan absolut maksimum yang masih dapat diterima pada kedua arah. Nilai ini harus dijustifikasi secara klinis sebelum uji dimulai.",
    nl: "Deze symmetrische marge is het maximaal aanvaardbare absolute verschil in beide richtingen. De marge moet klinisch worden onderbouwd voordat de trial start.",
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
  "cohort-rr.p1": {
    en: "Exposed risk is the expected outcome risk among exposed participants. Use a reference cohort when possible; the app calculates the risk ratio and absolute risk difference.",
    id: "Risiko terpajan adalah risiko luaran yang diperkirakan pada peserta terpajan. Gunakan kohort referensi bila memungkinkan; aplikasi menghitung rasio risiko dan perbedaan risiko absolut.",
    nl: "Het risico bij blootgestelden is het verwachte uitkomstrisico bij blootgestelde deelnemers. Gebruik waar mogelijk een referentiecohort; de app berekent de risicoratio en het absolute risicoverschil.",
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
  "case-control.p1": {
    en: "Case exposure is the expected exposure prevalence among cases. Use a previous case-control study or pilot data; the app calculates the odds ratio.",
    id: "Pajanan kasus adalah prevalensi pajanan yang diperkirakan pada kasus. Gunakan studi kasus-kontrol sebelumnya atau data pilot; aplikasi menghitung odds ratio.",
    nl: "Casusblootstelling is de verwachte blootstellingsprevalentie bij cases. Gebruik een eerdere case-controlstudie of pilotgegevens; de app berekent de oddsratio.",
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
  "noninferiority-means.sd1": {
    en: "Enter the SD from one reference group for the continuous endpoint. The app estimates the pooled SD; use previous trials on the same endpoint and population when possible.",
    id: "Masukkan SD dari salah satu kelompok referensi untuk endpoint kontinu. Aplikasi memperkirakan SD gabungan; gunakan uji sebelumnya dengan endpoint dan populasi yang sama bila memungkinkan.",
    nl: "Voer de SD van een referentiegroep voor het continue eindpunt in. De app schat de gepoolde SD; gebruik waar mogelijk eerdere trials met hetzelfde eindpunt en dezelfde populatie.",
  },
  "noninferiority-means.sd2": {
    en: "Enter the SD from the second reference group. If only one SD is published, repeat that SD in both fields and test a larger SD in sensitivity analysis.",
    id: "Masukkan SD dari kelompok referensi kedua. Bila hanya satu SD yang dipublikasikan, ulangi SD tersebut pada kedua kolom dan uji SD yang lebih besar dalam analisis sensitivitas.",
    nl: "Voer de SD van de tweede referentiegroep in. Als slechts een SD is gepubliceerd, herhaal die SD in beide velden en test een hogere SD in een gevoeligheidsanalyse.",
  },
  "equivalence-means.margin": {
    en: "The equivalence margin is the maximum difference considered practically the same in either direction. It must be prespecified and clinically justified.",
    id: "Margin ekuivalensi adalah perbedaan maksimum yang dianggap praktis sama pada kedua arah. Nilai ini harus ditetapkan sebelumnya dan dijustifikasi secara klinis.",
    nl: "De equivalentiemarge is het maximale verschil dat in beide richtingen praktisch gelijk wordt geacht. Deze moet vooraf zijn vastgelegd en klinisch onderbouwd.",
  },
  "equivalence-means.sd1": {
    en: "Enter the SD from one reference group on the same measurement scale. The app estimates a pooled SD for the equivalence calculation.",
    id: "Masukkan SD dari salah satu kelompok referensi pada skala pengukuran yang sama. Aplikasi memperkirakan SD gabungan untuk perhitungan ekuivalensi.",
    nl: "Voer de SD van een referentiegroep op dezelfde meetschaal in. De app schat een gepoolde SD voor de equivalentieberekening.",
  },
  "equivalence-means.sd2": {
    en: "Enter the SD from the second reference group. There is no standard value; use comparable studies and run sensitivity checks if uncertainty is large.",
    id: "Masukkan SD dari kelompok referensi kedua. Tidak ada nilai standar; gunakan studi yang sebanding dan lakukan uji sensitivitas bila ketidakpastian besar.",
    nl: "Voer de SD van de tweede referentiegroep in. Er is geen standaardwaarde; gebruik vergelijkbare studies en voer gevoeligheidsanalyses uit bij grote onzekerheid.",
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
  "linear-regression.r2": {
    en: "Expected R2 is the percentage of outcome variance explained by the full model. Use prior studies when available; rough Cohen equivalents are about 2% small, 13% medium, and 26% large.",
    id: "R2 yang diharapkan adalah persentase varians luaran yang dijelaskan oleh model penuh. Gunakan studi sebelumnya bila tersedia; padanan kasar Cohen sekitar 2% kecil, 13% sedang, dan 26% besar.",
    nl: "Verwachte R2 is het percentage uitkomstvariantie dat door het volledige model wordt verklaard. Gebruik eerdere studies waar mogelijk; grove Cohen-equivalenten zijn ongeveer 2% klein, 13% middelgroot en 26% groot.",
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

Object.assign(parameterGuidanceText, {
  "common.alpha": {
    ...parameterGuidanceText["common.alpha"],
    id: "Alfa adalah peluang kesalahan tipe I yang direncanakan, umumnya untuk uji dua sisi. Nilai 5% lazim pada studi superioritas; studi non-inferioritas sering menggunakan alfa satu sisi 2,5%.",
    nl: "Alfa is de vooraf gekozen kans op een type-I-fout, meestal tweezijdig. 5% is gebruikelijk bij superioriteitsstudies; non-inferioriteitsstudies gebruiken vaak een eenzijdige alfa van 2,5%.",
  },
  "common.power": {
    ...parameterGuidanceText["common.power"],
    id: "Power adalah peluang mendeteksi efek yang direncanakan bila efek tersebut memang ada. Nilai 80% lazim digunakan; 90% sering dipilih untuk studi konfirmatori atau studi dengan konsekuensi klinis besar.",
    nl: "Power is de kans om het geplande effect aan te tonen als dat effect werkelijk bestaat. 80% is gebruikelijk; 90% wordt vaak gekozen voor confirmatoire studies of studies met grotere klinische consequenties.",
  },
  "common.dropout": {
    ...parameterGuidanceText["common.dropout"],
    id: "Nilai ini menambah besar sampel untuk mengantisipasi loss to follow-up, non-respons, data hilang, atau data yang tidak dapat dievaluasi. Gunakan angka dari studi pilot atau penelitian terdahulu; 10-20% sering dipakai bila belum ada kepastian.",
    nl: "Deze waarde verhoogt de berekende steekproefgrootte om rekening te houden met uitval, non-respons, ontbrekende gegevens of niet-beoordeelbare metingen. Gebruik cijfers uit een pilot of eerdere studie; bij onzekerheid is 10-20% vaak redelijk.",
  },
  "common.confidence": {
    ...parameterGuidanceText["common.confidence"],
    id: "Tingkat kepercayaan menentukan cakupan jangka panjang dari estimasi interval. Nilai 95% merupakan standar umum dalam publikasi ilmiah; 90% atau 99% sebaiknya dijelaskan berdasarkan konteks penelitian.",
    nl: "Het betrouwbaarheidsniveau bepaalt de langetermijndekking van de intervalschatting. 95% is de gebruikelijke wetenschappelijke standaard; 90% of 99% moet vanuit de onderzoekscontext worden onderbouwd.",
  },
  "common.ratio": {
    ...parameterGuidanceText["common.ratio"],
    id: "Rasio alokasi membandingkan jumlah peserta antarkelompok. Rasio 1:1 biasanya paling efisien secara statistik; rasio tidak seimbang dapat dipilih karena alasan kelayakan, biaya, keamanan, atau etik.",
    nl: "De allocatieratio beschrijft de verhouding tussen groepsgroottes. Een 1:1-ratio is meestal statistisch het meest efficiënt; ongelijke ratio's kunnen nodig zijn vanwege haalbaarheid, kosten, veiligheid of ethische overwegingen.",
  },
  "prevalence.margin": {
    ...parameterGuidanceText["prevalence.margin"],
    id: "Margin of error adalah setengah lebar interval kepercayaan yang diinginkan di sekitar proporsi. Margin 5 poin persentase sering digunakan; margin yang lebih sempit membutuhkan sampel jauh lebih besar.",
    nl: "De foutmarge is de gewenste halve breedte van het betrouwbaarheidsinterval rond de proportie. 5 procentpunten is vaak gebruikelijk; smallere marges vragen duidelijk grotere steekproeven.",
  },
  "single-mean.sd": {
    ...parameterGuidanceText["single-mean.sd"],
    id: "Simpangan baku menggambarkan variasi luaran kontinu. Tidak ada nilai standar universal; gunakan studi pilot, registri, atau publikasi dengan populasi dan skala ukur yang sebanding.",
    nl: "De standaarddeviatie beschrijft de spreiding van de continue uitkomst. Er is geen universele standaardwaarde; gebruik een pilotstudie, register of publicatie met een vergelijkbare populatie en meetschaal.",
  },
  "single-mean.margin": {
    ...parameterGuidanceText["single-mean.margin"],
    id: "Ini adalah besar kesalahan yang masih dapat diterima di sekitar estimasi rerata, dalam satuan pengukuran asli. Pilih nilai yang masih bermakna secara klinis atau ilmiah.",
    nl: "Dit is de aanvaardbare fout rond het geschatte gemiddelde, uitgedrukt in de oorspronkelijke meeteenheid. Kies een waarde die klinisch of wetenschappelijk nog relevant is.",
  },
  "two-means.mean1": {
    ...parameterGuidanceText["two-means.mean1"],
    id: "Masukkan rerata salah satu kelompok dari studi referensi, studi pilot, atau dataset yang kredibel. Tidak ada nilai standar; gunakan skala luaran yang sama dengan rencana penelitian.",
    nl: "Vul het gemiddelde van één groep in uit een referentiestudie, pilotstudie of betrouwbare dataset. Er is geen standaardwaarde; gebruik dezelfde uitkomstschaal als in uw geplande studie.",
  },
  "two-means.mean2": {
    ...parameterGuidanceText["two-means.mean2"],
    id: "Masukkan rerata kelompok pembanding. Aplikasi akan menghitung selisih rerata absolut secara otomatis, sehingga pengguna tidak perlu menghitungnya sendiri.",
    nl: "Vul het gemiddelde van de vergelijkingsgroep in. De app berekent automatisch het absolute gemiddelde verschil, zodat gebruikers dit niet zelf hoeven uit te rekenen.",
  },
  "two-means.sd1": {
    ...parameterGuidanceText["two-means.sd1"],
    id: "Masukkan SD kelompok 1 dari sumber referensi. Aplikasi menggunakan SD kelompok 1 dan kelompok 2 untuk menghitung perkiraan SD gabungan; tidak ada SD standar universal.",
    nl: "Vul de SD van groep 1 uit de referentiebron in. De app gebruikt de SD's van groep 1 en 2 om de gepoolde SD te schatten; er is geen universele standaard-SD.",
  },
  "two-means.sd2": {
    ...parameterGuidanceText["two-means.sd2"],
    id: "Masukkan SD kelompok 2. Bila hanya satu SD yang tersedia, masukkan nilai yang sama pada kedua kolom, atau gunakan SD yang lebih besar sebagai skenario sensitivitas konservatif.",
    nl: "Vul de SD van groep 2 in. Als slechts één SD beschikbaar is, vul dan dezelfde waarde in beide velden in, of gebruik een hogere SD als conservatief gevoeligheidsscenario.",
  },
  "paired-mean.meanBefore": {
    ...parameterGuidanceText["paired-mean.meanBefore"],
    id: "Masukkan rerata awal atau sebelum intervensi dari data berpasangan. Tidak ada nilai standar; pilih populasi dan skala pengukuran yang paling mendekati penelitian Anda.",
    nl: "Vul het gemiddelde bij baseline of vóór de interventie in uit gepaarde gegevens. Er is geen standaardwaarde; kies een populatie en meetschaal die zo goed mogelijk aansluiten bij uw studie.",
  },
  "paired-mean.meanAfter": {
    ...parameterGuidanceText["paired-mean.meanAfter"],
    id: "Masukkan rerata setelah intervensi atau saat follow-up dari data berpasangan. Aplikasi akan menghitung perubahan rerata secara otomatis.",
    nl: "Vul het gemiddelde na de interventie of tijdens follow-up in uit gepaarde gegevens. De app berekent de gemiddelde verandering automatisch.",
  },
  "paired-mean.sdDiff": {
    ...parameterGuidanceText["paired-mean.sdDiff"],
    id: "Ini adalah SD dari selisih nilai berpasangan, bukan SD awal. Nilainya sering lebih kecil daripada SD luaran mentah; gunakan data pilot berpasangan bila tersedia.",
    nl: "Dit is de SD van de gepaarde verschillen, niet de baseline-SD. Deze is vaak kleiner dan de ruwe SD van de uitkomst; gebruik waar mogelijk gepaarde pilotgegevens.",
  },
  "two-proportions.p1": {
    ...parameterGuidanceText["two-proportions.p1"],
    id: "Proporsi kontrol adalah angka kejadian, respons, atau risiko yang diperkirakan pada kelompok pembanding. Gunakan estimasi lokal atau publikasi terbaru karena nilai ini sangat memengaruhi besar sampel.",
    nl: "De controleproportie is het verwachte gebeurtenis-, respons- of risicopercentage in de vergelijkingsgroep. Gebruik bij voorkeur een lokale of recente schatting, omdat deze waarde de steekproefgrootte sterk beïnvloedt.",
  },
  "two-proportions.p2": {
    ...parameterGuidanceText["two-proportions.p2"],
    id: "Proporsi perlakuan adalah angka kejadian atau respons yang diharapkan pada kelompok intervensi. Selisih absolut yang bermakna secara klinis dari kelompok kontrol sebaiknya menjadi dasar pemilihan nilai.",
    nl: "De behandelproportie is het verwachte percentage in de interventiegroep. Laat vooral het klinisch relevante absolute verschil met de controlegroep de keuze bepalen.",
  },
  "cohort-rr.p0": {
    ...parameterGuidanceText["cohort-rr.p0"],
    id: "Risiko pada kelompok tidak terpajan adalah risiko luaran yang diperkirakan pada kelompok referensi. Sebaiknya nilai ini berasal dari kohort serupa, surveilans, atau data lokal.",
    nl: "Het risico bij niet-blootgestelden is het verwachte uitkomstrisico in de referentiegroep. Baseer dit bij voorkeur op vergelijkbare cohorten, surveillancegegevens of lokale data.",
  },
  "cohort-rr.p1": {
    ...parameterGuidanceText["cohort-rr.p1"],
    id: "Risiko pada kelompok terpajan adalah risiko luaran yang diperkirakan pada peserta terpajan. Aplikasi akan menghitung rasio risiko dan selisih risiko absolut dari dua risiko yang dimasukkan.",
    nl: "Het risico bij blootgestelden is het verwachte uitkomstrisico bij blootgestelde deelnemers. De app berekent hieruit de risicoratio en het absolute risicoverschil.",
  },
  "case-control.p0": {
    ...parameterGuidanceText["case-control.p0"],
    id: "Pajanan pada kontrol adalah prevalensi pajanan yang diperkirakan pada kelompok kontrol. Nilai ini menjadi dasar untuk memperkirakan perbedaan pajanan antara kasus dan kontrol.",
    nl: "Controleblootstelling is de verwachte blootstellingsprevalentie bij controles. Deze waarde vormt de basis voor het verschil in blootstelling tussen cases en controles.",
  },
  "case-control.p1": {
    ...parameterGuidanceText["case-control.p1"],
    id: "Pajanan pada kasus adalah prevalensi pajanan yang diperkirakan pada kelompok kasus. Gunakan studi kasus-kontrol terdahulu atau data pilot; aplikasi akan menghitung odds ratio.",
    nl: "Casusblootstelling is de verwachte blootstellingsprevalentie bij cases. Gebruik een eerdere case-controlstudie of pilotgegevens; de app berekent de oddsratio.",
  },
  "noninferiority-means.margin": {
    ...parameterGuidanceText["noninferiority-means.margin"],
    id: "Margin non-inferioritas adalah penurunan efek terbesar yang masih dapat diterima dibanding kontrol. Nilai ini harus ditetapkan dan dibenarkan secara klinis sebelum perhitungan; tidak ada nilai standar umum.",
    nl: "De non-inferioriteitsmarge is het grootste verlies ten opzichte van controle dat nog acceptabel wordt geacht. Deze marge moet vóór de berekening klinisch worden onderbouwd; er is geen algemene standaardwaarde.",
  },
  "equivalence-means.margin": {
    ...parameterGuidanceText["equivalence-means.margin"],
    id: "Margin ekivalensi adalah batas perbedaan maksimum yang masih dianggap setara secara klinis atau praktis pada kedua arah. Nilai ini harus ditetapkan sebelumnya dan dijustifikasi.",
    nl: "De equivalentiemarge is het maximale verschil dat in beide richtingen nog als klinisch of praktisch gelijkwaardig wordt beschouwd. Deze moet vooraf worden vastgelegd en onderbouwd.",
  },
  "cluster-crt.p1": {
    ...parameterGuidanceText["cluster-crt.p1"],
    id: "Proporsi kontrol adalah angka kejadian atau respons yang diperkirakan pada klaster kontrol. Gunakan data dari setting klaster yang serupa bila tersedia.",
    nl: "De controleproportie is het verwachte gebeurtenis- of responspercentage in controleclusters. Gebruik waar mogelijk gegevens uit een vergelijkbare clustercontext.",
  },
  "cluster-crt.clusterSize": {
    ...parameterGuidanceText["cluster-crt.clusterSize"],
    id: "Ukuran klaster adalah rata-rata jumlah peserta dalam setiap klaster. Ukuran klaster yang sangat tidak seimbang menurunkan efisiensi; lakukan analisis sensitivitas bila variasinya besar.",
    nl: "Clustergrootte is het gemiddelde aantal deelnemers per cluster. Sterk ongelijke clusters verlagen de efficiëntie; voer gevoeligheidsanalyses uit wanneer de variatie groot is.",
  },
  "linear-regression.r2": {
    ...parameterGuidanceText["linear-regression.r2"],
    id: "R2 yang diharapkan adalah persentase variasi luaran yang dijelaskan oleh model penuh. Gunakan studi terdahulu bila tersedia; padanan kasar Cohen adalah sekitar 2% kecil, 13% sedang, dan 26% besar.",
    nl: "De verwachte R2 is het percentage uitkomstvariatie dat door het volledige model wordt verklaard. Gebruik eerdere studies waar mogelijk; grove Cohen-equivalenten zijn ongeveer 2% klein, 13% middelgroot en 26% groot.",
  },
  "logistic-regression.predictors": {
    ...parameterGuidanceText["logistic-regression.predictors"],
    id: "Prediktor berarti kandidat prediktor atau derajat kebebasan model. Pada model prediksi, hitung semua parameter yang direncanakan, termasuk kategori, bentuk nonlinier, dan interaksi.",
    nl: "Predictoren zijn kandidaat-predictoren of vrijheidsgraden in het model. Tel bij predictiemodellen alle geplande parameters mee, inclusief categorieën, niet-lineaire termen en interacties.",
  },
  "logistic-regression.eventsPerPredictor": {
    ...parameterGuidanceText["logistic-regression.eventsPerPredictor"],
    id: "Events per predictor adalah aturan praktis untuk stabilitas model. Nilai 10 sering digunakan secara tradisional; 15-20 lebih konservatif, dan metode formal Riley/van Smeden lebih dianjurkan untuk model prediksi final.",
    nl: "Events per predictor is een vuistregel voor modelstabiliteit. 10 is traditioneel gebruikt; 15-20 is conservatiever, en formele Riley/van Smeden-methoden hebben de voorkeur voor definitieve predictiemodellen.",
  },
});

function parameterGuidance(calculatorId: string, variableKey: string, language: Language) {
  const guidance = parameterGuidanceText[`${calculatorId}.${variableKey}`] ?? parameterGuidanceText[`common.${variableKey}`];
  return guidance?.[language] ?? guidance?.en ?? "";
}

function formulaLines(formula: string) {
  return formula.split(";").map((line) => line.trim()).filter(Boolean);
}

function formulaUsesZ(formula: string) {
  return /\bZ|Z[αβ]/.test(formula);
}

function localNote(language: Language, en: string, id: string, nl: string) {
  if (language === "id") return id;
  if (language === "nl") return nl;
  return en;
}

function formulaSymbolNotes(calculatorId: string, language: Language) {
  const commonZ = [
    localNote(language, "Z or Zα/2 is the standard normal critical value for the selected confidence level or alpha.", "Z atau Zα/2 adalah nilai kritis normal baku untuk tingkat kepercayaan atau alfa yang dipilih.", "Z of Zα/2 is de standaardnormale kritieke waarde voor het gekozen betrouwbaarheidsniveau of alfa."),
  ];
  const commonPowerNotes = [
    localNote(language, "Zβ is determined by power; β is the Type II error rate, so power = 1 - β.", "Zβ ditentukan oleh power; β adalah tingkat kesalahan tipe II, sehingga power = 1 - β.", "Zβ wordt bepaald door power; β is de type-II-foutkans, dus power = 1 - β."),
  ];
  const notes: Record<string, string[]> = {
    prevalence: [
      ...commonZ,
      localNote(language, "p is the expected proportion and d is the margin of error.", "p adalah proporsi yang diharapkan dan d adalah margin of error.", "p is de verwachte proportie en d is de foutmarge."),
    ],
    "single-mean": [
      ...commonZ,
      localNote(language, "σ is the expected standard deviation and d is the margin of error in the original measurement unit.", "σ adalah simpangan baku yang diharapkan dan d adalah margin of error dalam satuan pengukuran asli.", "σ is de verwachte standaarddeviatie en d is de foutmarge in de oorspronkelijke meeteenheid."),
    ],
    "two-means": [
      ...commonZ,
      ...commonPowerNotes,
      localNote(language, "Δ is the absolute mean difference calculated from the two entered reference means.", "Δ adalah selisih rerata absolut yang dihitung dari dua rerata referensi yang dimasukkan.", "Δ is het absolute gemiddelde verschil, berekend uit de twee ingevulde referentiegemiddelden."),
      localNote(language, "SDpooled is estimated from SD1 and SD2; r is the allocation ratio, meaning treatment participants per control participant.", "SDpooled dihitung dari SD1 dan SD2; r adalah rasio alokasi, yaitu jumlah peserta perlakuan per peserta kontrol.", "SDpooled wordt geschat uit SD1 en SD2; r is de allocatieratio, het aantal behandelgroepdeelnemers per controlegroepdeelnemer."),
    ],
    "paired-mean": [
      ...commonZ,
      ...commonPowerNotes,
      localNote(language, "Δ is the absolute within-person mean change; SDdifference is the standard deviation of paired differences.", "Δ adalah perubahan rerata absolut dalam orang yang sama; SDdifference adalah simpangan baku dari selisih berpasangan.", "Δ is de absolute gemiddelde verandering binnen dezelfde persoon; SDdifference is de standaarddeviatie van de gepaarde verschillen."),
    ],
    "two-proportions": [
      ...commonZ,
      ...commonPowerNotes,
      localNote(language, "p1 and p2 are the two entered proportions; q1 = 1 - p1 and q2 = 1 - p2.", "p1 dan p2 adalah dua proporsi yang dimasukkan; q1 = 1 - p1 dan q2 = 1 - p2.", "p1 en p2 zijn de twee ingevulde proporties; q1 = 1 - p1 en q2 = 1 - p2."),
      localNote(language, "p̄ and q̄ are the pooled event and non-event proportions; r is the treatment-to-control allocation ratio.", "p̄ dan q̄ adalah proporsi kejadian dan non-kejadian gabungan; r adalah rasio alokasi perlakuan terhadap kontrol.", "p̄ en q̄ zijn de gepoolde event- en non-eventproporties; r is de behandel-controle-allocatieratio."),
    ],
    "noninferiority-proportions": [
      ...commonZ,
      ...commonPowerNotes,
      localNote(language, "pC is the control event proportion and pE is the experimental event proportion; qC = 1 - pC and qE = 1 - pE.", "pC adalah proporsi kejadian kontrol dan pE adalah proporsi kejadian eksperimental; qC = 1 - pC dan qE = 1 - pE.", "pC is de controle-eventproportie en pE is de experimentele eventproportie; qC = 1 - pC en qE = 1 - pE."),
      localNote(language, "M is the non-inferiority margin on the absolute risk-difference scale; Δ is pE - pC; r is the experimental-to-control allocation ratio.", "M adalah margin non-inferioritas pada skala selisih risiko absolut; Δ adalah pE - pC; r adalah rasio alokasi eksperimental terhadap kontrol.", "M is de non-inferioriteitsmarge op de absolute risicoverschilschaal; Δ is pE - pC; r is de experimenteel-controle-allocatieratio."),
    ],
    "equivalence-proportions": [
      ...commonZ,
      ...commonPowerNotes,
      localNote(language, "pA and pB are the expected event proportions in the two groups; qA = 1 - pA and qB = 1 - pB.", "pA dan pB adalah proporsi kejadian yang diharapkan pada dua kelompok; qA = 1 - pA dan qB = 1 - pB.", "pA en pB zijn de verwachte eventproporties in de twee groepen; qA = 1 - pA en qB = 1 - pB."),
      localNote(language, "M is the symmetric equivalence margin on the absolute risk-difference scale; Δ is pB - pA; r is the group B-to-group A allocation ratio.", "M adalah margin ekivalensi simetris pada skala selisih risiko absolut; Δ adalah pB - pA; r adalah rasio alokasi kelompok B terhadap kelompok A.", "M is de symmetrische equivalentiemarge op de absolute risicoverschilschaal; Δ is pB - pA; r is de groep-B-groep-A-allocatieratio."),
    ],
    "one-proportion-test": [
      ...commonZ,
      ...commonPowerNotes,
      localNote(language, "p0 is the benchmark proportion and p1 is the target proportion; q0 = 1 - p0 and q1 = 1 - p1.", "p0 adalah proporsi pembanding dan p1 adalah proporsi target; q0 = 1 - p0 dan q1 = 1 - p1.", "p0 is de benchmarkproportie en p1 is de doelproportie; q0 = 1 - p0 en q1 = 1 - p1."),
    ],
    correlation: [
      ...commonZ,
      ...commonPowerNotes,
      localNote(language, "r is the expected Pearson correlation entered by the user; atanh(r) is Fisher's z transformation.", "r adalah korelasi Pearson yang diharapkan dan dimasukkan oleh pengguna; atanh(r) adalah transformasi z Fisher.", "r is de verwachte Pearson-correlatie die de gebruiker invult; atanh(r) is Fisher's z-transformatie."),
    ],
    "diagnostic-sensitivity": [
      ...commonZ,
      localNote(language, "Se is expected sensitivity, d is the precision margin, and prevalence converts diseased participants into total recruited participants.", "Se adalah sensitivitas yang diharapkan, d adalah margin presisi, dan prevalensi mengubah jumlah peserta sakit menjadi total peserta yang perlu direkrut.", "Se is de verwachte sensitiviteit, d is de precisiemarge, en prevalentie zet benodigde zieken om naar totaal te rekruteren deelnemers."),
    ],
    "diagnostic-specificity": [
      ...commonZ,
      localNote(language, "Sp is expected specificity, d is the precision margin, and 1 - prevalence is the expected non-disease fraction.", "Sp adalah spesifisitas yang diharapkan, d adalah margin presisi, dan 1 - prevalensi adalah fraksi tanpa penyakit yang diharapkan.", "Sp is de verwachte specificiteit, d is de precisiemarge, en 1 - prevalentie is de verwachte fractie zonder ziekte."),
    ],
    "cohort-rr": [
      ...commonZ,
      ...commonPowerNotes,
      localNote(language, "RR is calculated as exposed risk divided by unexposed risk; the sample size then uses the two independent proportions approach.", "RR dihitung sebagai risiko terpajan dibagi risiko tidak terpajan; besar sampel kemudian memakai pendekatan dua proporsi independen.", "RR wordt berekend als risico bij blootgestelden gedeeld door risico bij niet-blootgestelden; de steekproefgrootte gebruikt daarna de methode voor twee onafhankelijke proporties."),
    ],
    "case-control": [
      ...commonZ,
      ...commonPowerNotes,
      localNote(language, "OR is calculated from the exposure odds in cases and controls; the sample size then uses the two independent proportions approach.", "OR dihitung dari odds pajanan pada kasus dan kontrol; besar sampel kemudian memakai pendekatan dua proporsi independen.", "OR wordt berekend uit de blootstellingsodds bij cases en controles; de steekproefgrootte gebruikt daarna de methode voor twee onafhankelijke proporties."),
    ],
    "noninferiority-means": [
      ...commonZ,
      ...commonPowerNotes,
      localNote(language, "SDpooled is estimated from SD1 and SD2; r is the experimental-to-control allocation ratio; margin is the largest clinically acceptable loss.", "SDpooled dihitung dari SD1 dan SD2; r adalah rasio alokasi eksperimental terhadap kontrol; margin adalah penurunan terbesar yang masih dapat diterima secara klinis.", "SDpooled wordt geschat uit SD1 en SD2; r is de experimenteel-controle-allocatieratio; margin is het grootste klinisch aanvaardbare verlies."),
    ],
    "equivalence-means": [
      ...commonZ,
      ...commonPowerNotes,
      localNote(language, "TOST means two one-sided tests; SDpooled is estimated from SD1 and SD2; margin is the symmetric equivalence boundary.", "TOST berarti two one-sided tests; SDpooled dihitung dari SD1 dan SD2; margin adalah batas ekivalensi simetris.", "TOST betekent two one-sided tests; SDpooled wordt geschat uit SD1 en SD2; margin is de symmetrische equivalentiegrens."),
    ],
    "cluster-crt": [
      localNote(language, "m is average cluster size, ICC is the intracluster correlation coefficient, and the design effect inflates the individual-level sample size.", "m adalah rerata ukuran klaster, ICC adalah koefisien korelasi intraklaster, dan design effect meningkatkan besar sampel tingkat individu.", "m is de gemiddelde clustergrootte, ICC is de intracluster-correlatiecoëfficiënt, en het design effect verhoogt de individuele steekproefgrootte."),
      ...commonZ,
      ...commonPowerNotes,
    ],
    survival: [
      ...commonZ,
      ...commonPowerNotes,
      localNote(language, "HR is the hazard ratio, ln(HR) is its natural logarithm, and the allocation fraction product reflects the event split between groups.", "HR adalah hazard ratio, ln(HR) adalah logaritma naturalnya, dan allocation fraction product mencerminkan pembagian kejadian antar kelompok.", "HR is de hazardratio, ln(HR) is de natuurlijke logaritme daarvan, en het allocatiefract product weerspiegelt de eventverdeling tussen groepen."),
    ],
    "linear-regression": [
      ...commonZ,
      ...commonPowerNotes,
      localNote(language, "R² is the expected explained variance; f² = R² / (1 - R²); predictors are the planned model terms or degrees of freedom.", "R² adalah variasi yang diharapkan dapat dijelaskan; f² = R² / (1 - R²); prediktor adalah istilah model atau derajat kebebasan yang direncanakan.", "R² is de verwachte verklaarde variantie; f² = R² / (1 - R²); predictoren zijn de geplande modeltermen of vrijheidsgraden."),
    ],
    "logistic-regression": [
      localNote(language, "Events are participants with the outcome; events-per-predictor is the planned stability rule; total n is obtained by dividing required events by the expected event rate.", "Events adalah peserta yang mengalami luaran; events-per-predictor adalah aturan stabilitas yang direncanakan; total n diperoleh dengan membagi jumlah events yang dibutuhkan dengan angka kejadian yang diharapkan.", "Events zijn deelnemers met de uitkomst; events-per-predictor is de gekozen stabiliteitsregel; totaal n ontstaat door benodigde events te delen door het verwachte eventpercentage."),
    ],
  };
  return notes[calculatorId] ?? [];
}

function formulaVariableNote(calculatorId: string, variableKey: string, language: Language) {
  const notes: Record<string, [string, string, string]> = {
    "prevalence.p": ["Formula symbol: p, the expected proportion.", "Simbol rumus: p, proporsi yang diharapkan.", "Formulesymbool: p, de verwachte proportie."],
    "prevalence.margin": ["Formula symbol: d, the desired precision or margin of error.", "Simbol rumus: d, presisi atau margin of error yang diinginkan.", "Formulesymbool: d, de gewenste precisie of foutmarge."],
    "prevalence.confidence": ["This determines the Z value used in the formula.", "Nilai ini menentukan nilai Z yang digunakan dalam rumus.", "Deze waarde bepaalt de Z-waarde in de formule."],
    "single-mean.sd": ["Formula symbol: σ, the expected standard deviation.", "Simbol rumus: σ, simpangan baku yang diharapkan.", "Formulesymbool: σ, de verwachte standaarddeviatie."],
    "single-mean.margin": ["Formula symbol: d, the target half-width of the confidence interval.", "Simbol rumus: d, setengah lebar interval kepercayaan yang ditargetkan.", "Formulesymbool: d, de beoogde halve breedte van het betrouwbaarheidsinterval."],
    "single-mean.confidence": ["This determines the Z value used in the formula.", "Nilai ini menentukan nilai Z yang digunakan dalam rumus.", "Deze waarde bepaalt de Z-waarde in de formule."],
    "two-means.mean1": ["Used with group 2 mean to calculate Δ.", "Digunakan bersama rerata kelompok 2 untuk menghitung Δ.", "Wordt samen met gemiddelde groep 2 gebruikt om Δ te berekenen."],
    "two-means.mean2": ["Used with group 1 mean to calculate Δ.", "Digunakan bersama rerata kelompok 1 untuk menghitung Δ.", "Wordt samen met gemiddelde groep 1 gebruikt om Δ te berekenen."],
    "two-means.sd1": ["Used with SD2 to estimate SDpooled.", "Digunakan bersama SD2 untuk memperkirakan SDpooled.", "Wordt samen met SD2 gebruikt om SDpooled te schatten."],
    "two-means.sd2": ["Used with SD1 to estimate SDpooled.", "Digunakan bersama SD1 untuk memperkirakan SDpooled.", "Wordt samen met SD1 gebruikt om SDpooled te schatten."],
    "two-means.ratio": ["Formula symbol: r, treatment participants per control participant.", "Simbol rumus: r, jumlah peserta perlakuan per peserta kontrol.", "Formulesymbool: r, behandelgroepdeelnemers per controlegroepdeelnemer."],
    "paired-mean.meanBefore": ["Used with the after mean to calculate Δ.", "Digunakan bersama rerata sesudah untuk menghitung Δ.", "Wordt samen met het nametinggemiddelde gebruikt om Δ te berekenen."],
    "paired-mean.meanAfter": ["Used with the before mean to calculate Δ.", "Digunakan bersama rerata sebelum untuk menghitung Δ.", "Wordt samen met het voormetinggemiddelde gebruikt om Δ te berekenen."],
    "paired-mean.sdDiff": ["Formula symbol: SDdifference, the SD of paired changes.", "Simbol rumus: SDdifference, simpangan baku perubahan berpasangan.", "Formulesymbool: SDdifference, de SD van gepaarde veranderingen."],
    "two-proportions.p1": ["Formula symbol: p1; q1 is calculated as 1 - p1.", "Simbol rumus: p1; q1 dihitung sebagai 1 - p1.", "Formulesymbool: p1; q1 wordt berekend als 1 - p1."],
    "two-proportions.p2": ["Formula symbol: p2; q2 is calculated as 1 - p2.", "Simbol rumus: p2; q2 dihitung sebagai 1 - p2.", "Formulesymbool: p2; q2 wordt berekend als 1 - p2."],
    "two-proportions.ratio": ["Formula symbol: r, treatment participants per control participant.", "Simbol rumus: r, jumlah peserta perlakuan per peserta kontrol.", "Formulesymbool: r, behandelgroepdeelnemers per controlegroepdeelnemer."],
    "noninferiority-proportions.pControl": ["Formula symbol: pC, the expected control event proportion.", "Simbol rumus: pC, proporsi kejadian kontrol yang diharapkan.", "Formulesymbool: pC, de verwachte controle-eventproportie."],
    "noninferiority-proportions.pExperimental": ["Formula symbol: pE, the expected experimental event proportion.", "Simbol rumus: pE, proporsi kejadian eksperimental yang diharapkan.", "Formulesymbool: pE, de verwachte experimentele eventproportie."],
    "noninferiority-proportions.margin": ["Formula symbol: M, the largest acceptable absolute risk-difference loss.", "Simbol rumus: M, penurunan selisih risiko absolut terbesar yang masih dapat diterima.", "Formulesymbool: M, het grootste aanvaardbare absolute risicoverschilverlies."],
    "noninferiority-proportions.ratio": ["Formula symbol: r, experimental participants per control participant.", "Simbol rumus: r, jumlah peserta eksperimental per peserta kontrol.", "Formulesymbool: r, experimentele deelnemers per controledeelnemer."],
    "equivalence-proportions.pGroupA": ["Formula symbol: pA, the expected event proportion in group A.", "Simbol rumus: pA, proporsi kejadian yang diharapkan pada kelompok A.", "Formulesymbool: pA, de verwachte eventproportie in groep A."],
    "equivalence-proportions.pGroupB": ["Formula symbol: pB, the expected event proportion in group B.", "Simbol rumus: pB, proporsi kejadian yang diharapkan pada kelompok B.", "Formulesymbool: pB, de verwachte eventproportie in groep B."],
    "equivalence-proportions.margin": ["Formula symbol: M, the symmetric equivalence boundary for the absolute risk difference.", "Simbol rumus: M, batas ekivalensi simetris untuk selisih risiko absolut.", "Formulesymbool: M, de symmetrische equivalentiegrens voor het absolute risicoverschil."],
    "equivalence-proportions.ratio": ["Formula symbol: r, group B participants per group A participant.", "Simbol rumus: r, jumlah peserta kelompok B per peserta kelompok A.", "Formulesymbool: r, deelnemers in groep B per deelnemer in groep A."],
    "one-proportion-test.p0": ["Formula symbol: p0; q0 is calculated as 1 - p0.", "Simbol rumus: p0; q0 dihitung sebagai 1 - p0.", "Formulesymbool: p0; q0 wordt berekend als 1 - p0."],
    "one-proportion-test.p1": ["Formula symbol: p1; q1 is calculated as 1 - p1.", "Simbol rumus: p1; q1 dihitung sebagai 1 - p1.", "Formulesymbool: p1; q1 wordt berekend als 1 - p1."],
    "correlation.rho": ["Formula symbol: r, the expected Pearson correlation.", "Simbol rumus: r, korelasi Pearson yang diharapkan.", "Formulesymbool: r, de verwachte Pearson-correlatie."],
    "diagnostic-sensitivity.sensitivity": ["Formula symbol: Se, expected sensitivity.", "Simbol rumus: Se, sensitivitas yang diharapkan.", "Formulesymbool: Se, de verwachte sensitiviteit."],
    "diagnostic-sensitivity.margin": ["Formula symbol: d, the precision margin around sensitivity.", "Simbol rumus: d, margin presisi di sekitar sensitivitas.", "Formulesymbool: d, de precisiemarge rond sensitiviteit."],
    "diagnostic-sensitivity.prevalence": ["Used to convert diseased n into total recruited n.", "Digunakan untuk mengubah n peserta sakit menjadi total n yang perlu direkrut.", "Wordt gebruikt om benodigde zieken om te zetten naar totaal te rekruteren n."],
    "diagnostic-specificity.specificity": ["Formula symbol: Sp, expected specificity.", "Simbol rumus: Sp, spesifisitas yang diharapkan.", "Formulesymbool: Sp, de verwachte specificiteit."],
    "diagnostic-specificity.margin": ["Formula symbol: d, the precision margin around specificity.", "Simbol rumus: d, margin presisi di sekitar spesifisitas.", "Formulesymbool: d, de precisiemarge rond specificiteit."],
    "diagnostic-specificity.prevalence": ["Used as 1 - prevalence to convert non-diseased n into total recruited n.", "Digunakan sebagai 1 - prevalensi untuk mengubah n tanpa penyakit menjadi total n yang perlu direkrut.", "Wordt gebruikt als 1 - prevalentie om benodigde niet-zieken om te zetten naar totaal te rekruteren n."],
    "cohort-rr.p0": ["Formula term: unexposed risk, used as the denominator for RR.", "Istilah rumus: risiko tidak terpajan, digunakan sebagai penyebut RR.", "Formuleterm: risico bij niet-blootgestelden, gebruikt als noemer voor RR."],
    "cohort-rr.p1": ["Formula term: exposed risk, used as the numerator for RR.", "Istilah rumus: risiko terpajan, digunakan sebagai pembilang RR.", "Formuleterm: risico bij blootgestelden, gebruikt als teller voor RR."],
    "case-control.p0": ["Formula term: p_control, exposure prevalence among controls.", "Istilah rumus: p_control, prevalensi pajanan pada kontrol.", "Formuleterm: p_control, blootstellingsprevalentie bij controles."],
    "case-control.p1": ["Formula term: p_case, exposure prevalence among cases.", "Istilah rumus: p_case, prevalensi pajanan pada kasus.", "Formuleterm: p_case, blootstellingsprevalentie bij cases."],
    "noninferiority-means.margin": ["Formula term: margin, the largest clinically acceptable loss.", "Istilah rumus: margin, penurunan terbesar yang masih dapat diterima secara klinis.", "Formuleterm: margin, het grootste klinisch aanvaardbare verlies."],
    "equivalence-means.margin": ["Formula term: margin, the symmetric equivalence boundary.", "Istilah rumus: margin, batas ekivalensi simetris.", "Formuleterm: margin, de symmetrische equivalentiegrens."],
    "cluster-crt.clusterSize": ["Formula symbol: m, average cluster size.", "Simbol rumus: m, rerata ukuran klaster.", "Formulesymbool: m, de gemiddelde clustergrootte."],
    "cluster-crt.icc": ["Formula symbol: ICC, the intracluster correlation coefficient.", "Simbol rumus: ICC, koefisien korelasi intraklaster.", "Formulesymbool: ICC, de intracluster-correlatiecoëfficiënt."],
    "survival.hr": ["Formula symbol: HR; ln(HR) is used in the event calculation.", "Simbol rumus: HR; ln(HR) digunakan dalam perhitungan jumlah kejadian.", "Formulesymbool: HR; ln(HR) wordt gebruikt in de eventberekening."],
    "survival.eventRate": ["Used to convert required events into total participants.", "Digunakan untuk mengubah jumlah kejadian yang dibutuhkan menjadi total peserta.", "Wordt gebruikt om benodigde events om te zetten naar totaal aantal deelnemers."],
    "survival.ratio": ["Used to calculate the allocation fraction product.", "Digunakan untuk menghitung allocation fraction product.", "Wordt gebruikt om het allocatiefract product te berekenen."],
    "linear-regression.r2": ["Formula symbols: R² and f², where f² = R² / (1 - R²).", "Simbol rumus: R² dan f², dengan f² = R² / (1 - R²).", "Formulesymbolen: R² en f², waarbij f² = R² / (1 - R²)."],
    "linear-regression.predictors": ["Formula term: predictors, the planned model terms or degrees of freedom.", "Istilah rumus: prediktor, istilah model atau derajat kebebasan yang direncanakan.", "Formuleterm: predictoren, de geplande modeltermen of vrijheidsgraden."],
    "logistic-regression.predictors": ["Used to calculate the required number of events.", "Digunakan untuk menghitung jumlah kejadian yang dibutuhkan.", "Wordt gebruikt om het benodigde aantal events te berekenen."],
    "logistic-regression.eventsPerPredictor": ["Formula term: events-per-predictor, the chosen stability rule.", "Istilah rumus: events-per-predictor, aturan stabilitas yang dipilih.", "Formuleterm: events-per-predictor, de gekozen stabiliteitsregel."],
    "logistic-regression.eventRate": ["Used to convert events into total sample size.", "Digunakan untuk mengubah jumlah kejadian menjadi total besar sampel.", "Wordt gebruikt om events om te zetten naar totale steekproefgrootte."],
  };
  const common: Record<string, [string, string, string]> = {
    alpha: ["Formula symbol: α; this determines Zα or Zα/2.", "Simbol rumus: α; nilai ini menentukan Zα atau Zα/2.", "Formulesymbool: α; deze waarde bepaalt Zα of Zα/2."],
    power: ["Formula term: power = 1 - β; this determines Zβ.", "Istilah rumus: power = 1 - β; nilai ini menentukan Zβ.", "Formuleterm: power = 1 - β; deze waarde bepaalt Zβ."],
    ratio: ["Formula symbol: r, the allocation ratio.", "Simbol rumus: r, rasio alokasi.", "Formulesymbool: r, de allocatieratio."],
    confidence: ["This determines the Z value used in the formula.", "Nilai ini menentukan nilai Z yang digunakan dalam rumus.", "Deze waarde bepaalt de Z-waarde in de formule."],
  };
  const entry = notes[`${calculatorId}.${variableKey}`] ?? common[variableKey];
  return entry ? localNote(language, entry[0], entry[1], entry[2]) : "";
}

function approximatePooledSd(sd1: number, sd2: number) {
  return Math.sqrt((sd1 ** 2 + sd2 ** 2) / 2);
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
      { key: "mean1", label: "Reference mean group 1", min: -500, max: 500, step: 0.5, default: 50, help: "Mean outcome in the first reference group.", slider: false },
      { key: "mean2", label: "Reference mean group 2", min: -500, max: 500, step: 0.5, default: 58, help: "Mean outcome in the second reference group.", slider: false },
      { key: "sd1", label: "SD group 1", min: 1, max: 100, step: 1, default: 20, help: "Standard deviation in the first reference group.", slider: false },
      { key: "sd2", label: "SD group 2", min: 1, max: 100, step: 1, default: 20, help: "Standard deviation in the second reference group.", slider: false },
      { key: "ratio", label: "Allocation ratio", min: 0.5, max: 3, step: 0.1, default: 1, help: "Treatment participants per control participant.", slider: true },
      ...commonPower(),
    ],
    formula: "Δ = |mean2 - mean1|; pooled SD ≈ √[(SD1² + SD2²) / 2]; n_control = (1 + 1/r)(Zα/2 + Zβ)²SDpooled² / Δ²",
    assumptions: ["Two-sided test with equal variance approximation.", "Pooled SD is estimated from the two reference-group SDs.", "Normal outcome or sufficiently large samples."],
    references: ["Julious SA. Sample Sizes for Clinical Trials.", "Chow SC, Shao J, Wang H, Lokhnygina Y. Sample Size Calculations in Clinical Research."],
    compute: (v) => {
      const delta = Math.abs(v.mean2 - v.mean1);
      const pooledSd = approximatePooledSd(v.sd1, v.sd2);
      if (delta < 1e-9) {
        return {
          primary: Number.POSITIVE_INFINITY,
          total: Number.POSITIVE_INFINITY,
          adjustedTotal: Number.POSITIVE_INFINITY,
          details: ["The two reference means are equal; enter a clinically meaningful difference to estimate sample size."],
        };
      }
      const base = ((1 + 1 / v.ratio) * (zAlpha(v.alpha) + zPower(v.power)) ** 2 * pooledSd ** 2) / delta ** 2;
      const control = ceil(base);
      const treatment = ceil(control * v.ratio);
      const total = control + treatment;
      return { primary: total, perGroup: control, total, adjustedTotal: dropoutInflation(total, v.dropout), details: [`Control n = ${control}; treatment n = ${treatment}`, `Calculated mean difference = ${delta.toFixed(2)}`, `Calculated pooled SD = ${pooledSd.toFixed(2)}`, `Standardized effect = ${(delta / pooledSd).toFixed(2)}`] };
    },
  },
  {
    id: "paired-mean",
    category: "Comparative",
    title: "Paired / Before-After Mean",
    purpose: "Detect a mean change in paired measurements.",
    variables: [
      { key: "meanBefore", label: "Reference mean before", min: -500, max: 500, step: 0.5, default: 50, help: "Mean before intervention or exposure.", slider: false },
      { key: "meanAfter", label: "Reference mean after", min: -500, max: 500, step: 0.5, default: 55, help: "Mean after intervention or exposure.", slider: false },
      { key: "sdDiff", label: "SD of differences", min: 1, max: 100, step: 1, default: 15, help: "Standard deviation of within-person differences.", slider: false },
      ...commonPower(),
    ],
    formula: "Δ = |mean after - mean before|; n = ((Zα/2 + Zβ)SDdifference / Δ)²",
    assumptions: ["Continuous paired difference outcome.", "Two-sided paired t-test planning approximation."],
    references: ["Julious SA. Sample Sizes for Clinical Trials.", "Machin D et al. Sample Size Tables for Clinical Studies."],
    compute: (v) => {
      const delta = Math.abs(v.meanAfter - v.meanBefore);
      if (delta < 1e-9) {
        return {
          primary: Number.POSITIVE_INFINITY,
          total: Number.POSITIVE_INFINITY,
          adjustedTotal: Number.POSITIVE_INFINITY,
          details: ["The before and after means are equal; enter a clinically meaningful change to estimate sample size."],
        };
      }
      const n = ceil(((zAlpha(v.alpha) + zPower(v.power)) * v.sdDiff / delta) ** 2);
      return { primary: n, total: n, adjustedTotal: dropoutInflation(n, v.dropout), details: [`Calculated mean change = ${delta.toFixed(2)}`, `Standardized paired effect = ${(delta / v.sdDiff).toFixed(2)}`, "Each participant contributes both measurements."] };
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
    id: "noninferiority-proportions",
    category: "Advanced Trials",
    title: "Non-Inferiority Proportion",
    purpose: "Plan a binary-outcome non-inferiority trial using an absolute risk-difference margin.",
    variables: [
      { key: "pControl", label: "Control event rate", min: 1, max: 95, step: 1, default: 80, suffix: "%", help: "Expected event, response, or success rate in control.", slider: true },
      { key: "pExperimental", label: "Experimental event rate", min: 1, max: 95, step: 1, default: 78, suffix: "%", help: "Expected event, response, or success rate in experimental treatment.", slider: true },
      { key: "margin", label: "NI risk-difference margin", min: 1, max: 30, step: 0.5, default: 10, suffix: " pp", help: "Largest acceptable absolute loss in percentage points.", slider: true },
      { key: "ratio", label: "Allocation ratio", min: 0.5, max: 3, step: 0.1, default: 1, help: "Experimental participants per control participant.", slider: true },
      ...commonPower(2.5, 80, 10),
    ],
    formula: "Δ = pE - pC; n_control ≈ (Zα + Zβ)²[pC(1-pC) + pE(1-pE)/r] / (Δ + M)²; n_experimental = r×n_control",
    assumptions: ["One-sided non-inferiority test on the absolute risk-difference scale.", "Higher event rates are assumed beneficial; reverse the endpoint direction before using if lower rates are beneficial.", "Margin must be prespecified and clinically justified."],
    references: ["Blackwelder WC. Proving the null hypothesis in clinical trials.", "Farrington CP, Manning G. Test statistics and sample size formulae for comparative binomial trials with null hypothesis of non-zero risk difference or non-unity relative risk."],
    compute: (v) => {
      const pControl = pct(v.pControl);
      const pExperimental = pct(v.pExperimental);
      const margin = pct(v.margin);
      const { control, experimental, total, distanceToMargin } = binaryMarginSampleSize(pControl, pExperimental, margin, v.ratio, v.alpha, v.power, "noninferiority");
      if (!Number.isFinite(total)) {
        return {
          primary: Number.POSITIVE_INFINITY,
          total: Number.POSITIVE_INFINITY,
          adjustedTotal: Number.POSITIVE_INFINITY,
          details: ["Expected experimental performance is outside the non-inferiority margin; revise the event rates or margin."],
        };
      }
      return {
        primary: total,
        perGroup: control,
        total,
        adjustedTotal: dropoutInflation(total, v.dropout),
        details: [`Control n = ${control}; experimental n = ${experimental}`, `Expected risk difference = ${(v.pExperimental - v.pControl).toFixed(1)} percentage points`, `Distance to NI margin = ${(distanceToMargin * 100).toFixed(1)} percentage points`],
      };
    },
  },
  {
    id: "equivalence-proportions",
    category: "Advanced Trials",
    title: "Equivalence Proportion",
    purpose: "Plan a binary-outcome equivalence trial using a symmetric absolute risk-difference margin.",
    variables: [
      { key: "pGroupA", label: "Group A event rate", min: 1, max: 95, step: 1, default: 80, suffix: "%", help: "Expected event, response, or success rate in group A.", slider: true },
      { key: "pGroupB", label: "Group B event rate", min: 1, max: 95, step: 1, default: 80, suffix: "%", help: "Expected event, response, or success rate in group B.", slider: true },
      { key: "margin", label: "Equivalence risk-difference margin", min: 1, max: 30, step: 0.5, default: 10, suffix: " pp", help: "Maximum acceptable absolute difference in either direction.", slider: true },
      { key: "ratio", label: "Allocation ratio", min: 0.5, max: 3, step: 0.1, default: 1, help: "Group B participants per group A participant.", slider: true },
      ...commonPower(5, 80, 10),
    ],
    formula: "Δ = pB - pA; n_groupA ≈ (Zα + Zβ)²[pA(1-pA) + pB(1-pB)/r] / (M - |Δ|)²; n_groupB = r×n_groupA",
    assumptions: ["Two one-sided tests approximation on the absolute risk-difference scale.", "Expected difference must lie within the equivalence margin.", "Margin must be prespecified and clinically justified."],
    references: ["Blackwelder WC. Proving the null hypothesis in clinical trials.", "Farrington CP, Manning G. Test statistics and sample size formulae for comparative binomial trials with null hypothesis of non-zero risk difference or non-unity relative risk."],
    compute: (v) => {
      const pGroupA = pct(v.pGroupA);
      const pGroupB = pct(v.pGroupB);
      const margin = pct(v.margin);
      const { control: groupA, experimental: groupB, total, distanceToMargin } = binaryMarginSampleSize(pGroupA, pGroupB, margin, v.ratio, v.alpha, v.power, "equivalence");
      if (!Number.isFinite(total)) {
        return {
          primary: Number.POSITIVE_INFINITY,
          total: Number.POSITIVE_INFINITY,
          adjustedTotal: Number.POSITIVE_INFINITY,
          details: ["Expected group difference is outside the equivalence margin; revise the event rates or margin."],
        };
      }
      return {
        primary: total,
        perGroup: groupA,
        total,
        adjustedTotal: dropoutInflation(total, v.dropout),
        details: [`Group A n = ${groupA}; group B n = ${groupB}`, `Expected risk difference = ${(v.pGroupB - v.pGroupA).toFixed(1)} percentage points`, `Distance to equivalence boundary = ${(distanceToMargin * 100).toFixed(1)} percentage points`],
      };
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
      { key: "p1", label: "Exposed risk", min: 1, max: 95, step: 1, default: 27, suffix: "%", help: "Outcome risk among exposed participants.", slider: true },
      { key: "ratio", label: "Exposed:unexposed", min: 0.5, max: 3, step: 0.1, default: 1, help: "Exposed participants per unexposed participant.", slider: true },
      ...commonPower(),
    ],
    formula: "RR = exposed risk / unexposed risk; then uses independent-proportions planning.",
    assumptions: ["Independent exposed and unexposed groups.", "Approximate two-sided test for the risk difference implied by the two entered risks."],
    references: ["Fleiss JL et al. Statistical Methods for Rates and Proportions.", "Kelsey JL et al. Methods in Observational Epidemiology."],
    compute: (v) => {
      const unexposedRisk = pct(v.p0);
      const exposedRisk = pct(v.p1);
      if (Math.abs(exposedRisk - unexposedRisk) < 1e-9) {
        return {
          primary: Number.POSITIVE_INFINITY,
          total: Number.POSITIVE_INFINITY,
          adjustedTotal: Number.POSITIVE_INFINITY,
          details: ["Exposed and unexposed risks are equal; enter a clinically meaningful risk difference to estimate sample size."],
        };
      }
      const { control, treatment, total } = twoProportionSampleSize(unexposedRisk, exposedRisk, v.ratio, v.alpha, v.power);
      return {
        primary: total,
        perGroup: control,
        total,
        adjustedTotal: dropoutInflation(total, v.dropout),
        details: [`Unexposed n = ${control}; exposed n = ${treatment}`, `Calculated risk ratio = ${(exposedRisk / unexposedRisk).toFixed(2)}`, `Absolute risk difference = ${Math.abs(v.p1 - v.p0).toFixed(1)} percentage points`],
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
      { key: "p1", label: "Case exposure", min: 1, max: 95, step: 1, default: 40, suffix: "%", help: "Exposure prevalence among cases.", slider: true },
      { key: "ratio", label: "Controls per case", min: 1, max: 4, step: 0.25, default: 1, help: "Number of controls for each case.", slider: true },
      ...commonPower(),
    ],
    formula: "OR = [p_case/(1-p_case)] / [p_control/(1-p_control)]; then two-proportions planning.",
    assumptions: ["Unmatched case-control design.", "Exposure is binary and measured independently."],
    references: ["Schlesselman JJ. Case-Control Studies.", "Kelsey JL et al. Methods in Observational Epidemiology."],
    compute: (v) => {
      const controlExposure = pct(v.p0);
      const caseExposure = pct(v.p1);
      if (Math.abs(caseExposure - controlExposure) < 1e-9) {
        return {
          primary: Number.POSITIVE_INFINITY,
          total: Number.POSITIVE_INFINITY,
          adjustedTotal: Number.POSITIVE_INFINITY,
          details: ["Case and control exposure prevalences are equal; enter a clinically meaningful exposure difference to estimate sample size."],
        };
      }
      const { control: cases, treatment: controls, total } = twoProportionSampleSize(caseExposure, controlExposure, v.ratio, v.alpha, v.power);
      return {
        primary: total,
        perGroup: cases,
        total,
        adjustedTotal: dropoutInflation(total, v.dropout),
        details: [`Cases n = ${cases}; controls n = ${controls}`, `Calculated odds ratio = ${((caseExposure / (1 - caseExposure)) / (controlExposure / (1 - controlExposure))).toFixed(2)}`, `Absolute exposure difference = ${Math.abs(v.p1 - v.p0).toFixed(1)} percentage points`],
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
      { key: "sd1", label: "Reference SD group 1", min: 1, max: 100, step: 1, default: 15, help: "Standard deviation in the first reference group.", slider: false },
      { key: "sd2", label: "Reference SD group 2", min: 1, max: 100, step: 1, default: 15, help: "Standard deviation in the second reference group.", slider: false },
      { key: "ratio", label: "Allocation ratio", min: 0.5, max: 3, step: 0.1, default: 1, help: "Experimental participants per control participant.", slider: true },
      ...commonPower(2.5, 80, 10),
    ],
    formula: "pooled SD ≈ √[(SD1² + SD2²) / 2]; n_control = (1 + 1/r)(Zα + Zβ)²SDpooled² / margin²",
    assumptions: ["One-sided non-inferiority framework.", "Pooled SD is estimated from the two reference-group SDs.", "True difference is planned as zero unless a stricter effect is specified externally."],
    references: ["Chow SC et al. Sample Size Calculations in Clinical Research.", "ICH E9 Statistical Principles for Clinical Trials."],
    compute: (v) => {
      const pooledSd = approximatePooledSd(v.sd1, v.sd2);
      const base = ((1 + 1 / v.ratio) * (zAlpha(v.alpha, 1) + zPower(v.power)) ** 2 * pooledSd ** 2) / v.margin ** 2;
      const control = ceil(base);
      const experimental = ceil(control * v.ratio);
      const total = control + experimental;
      return { primary: total, perGroup: control, total, adjustedTotal: dropoutInflation(total, v.dropout), details: [`Control n = ${control}; experimental n = ${experimental}`, `Calculated pooled SD = ${pooledSd.toFixed(2)}`, `Margin/pooled SD = ${(v.margin / pooledSd).toFixed(2)}`] };
    },
  },
  {
    id: "equivalence-means",
    category: "Advanced Trials",
    title: "Equivalence Mean",
    purpose: "Plan a two one-sided tests equivalence study for a mean outcome.",
    variables: [
      { key: "margin", label: "Equivalence margin", min: 1, max: 30, step: 0.5, default: 5, help: "Symmetric acceptable difference.", slider: true },
      { key: "sd1", label: "Reference SD group 1", min: 1, max: 100, step: 1, default: 15, help: "Standard deviation in the first reference group.", slider: false },
      { key: "sd2", label: "Reference SD group 2", min: 1, max: 100, step: 1, default: 15, help: "Standard deviation in the second reference group.", slider: false },
      { key: "ratio", label: "Allocation ratio", min: 0.5, max: 3, step: 0.1, default: 1, help: "Group B participants per group A participant.", slider: true },
      ...commonPower(5, 80, 10),
    ],
    formula: "Approximate TOST: pooled SD ≈ √[(SD1² + SD2²) / 2]; n_control = (1 + 1/r)(Zα + Zβ)²SDpooled² / margin²",
    assumptions: ["Two one-sided tests approximation.", "Pooled SD is estimated from the two reference-group SDs.", "True mean difference planned at zero."],
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
    purpose: "Plan for detecting the expected model R².",
    variables: [
      { key: "r2", label: "Expected R²", min: 1, max: 50, step: 1, default: 13, suffix: "%", help: "Expected variance explained by the model.", slider: true },
      { key: "predictors", label: "Predictors", min: 1, max: 25, step: 1, default: 5, help: "Number of tested predictors.", slider: true },
      ...commonPower(),
    ],
    formula: "f² = R² / (1 - R²); approximate n = (Zα/2 + Zβ)² / f² + predictors + 1",
    assumptions: ["Planning approximation for omnibus regression signal.", "The app converts expected R² to Cohen's f² internally.", "Use simulation for complex predictor distributions."],
    references: ["Cohen J. Statistical Power Analysis for the Behavioral Sciences.", "Green SB. How many subjects does it take to do a regression analysis?"],
    compute: (v) => {
      const r2 = Math.min(0.95, pct(v.r2));
      const f2 = r2 / (1 - r2);
      const n = ceil((zAlpha(v.alpha) + zPower(v.power)) ** 2 / f2 + v.predictors + 1);
      return { primary: n, total: n, adjustedTotal: dropoutInflation(n, v.dropout), details: [`Predictors included = ${v.predictors}`, `Expected R² = ${v.r2}%`, `Calculated Cohen f² = ${f2.toFixed(2)}`] };
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
    if (
      answers.comparisonOutcome === "binary" &&
      answers.comparisonStructure === "independent" &&
      answers.comparisonDesign === "trial" &&
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
          explanation: "The planned outcome is continuous, so the regression calculator uses predictors and expected model R2, then converts R2 to Cohen's f2 internally.",
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
      if (answers.trialObjective === "noninferiority") {
        return {
          calculatorId: "noninferiority-proportions",
          title: "Use Non-Inferiority Proportion",
          explanation: "The trial compares binary event rates and is designed to rule out an unacceptable absolute risk-difference loss.",
          assumptions: ["Independent binary outcomes.", "One-sided non-inferiority margin is clinically justified.", "Endpoint direction is defined so the margin represents an acceptable loss."],
          warnings,
        };
      }
      if (answers.trialObjective === "equivalence") {
        return {
          calculatorId: "equivalence-proportions",
          title: "Use Equivalence Proportion",
          explanation: "The trial compares binary event rates and is designed to show the absolute risk difference lies within a symmetric equivalence margin.",
          assumptions: ["Independent binary outcomes.", "Two one-sided tests framework.", "Equivalence margin is clinically justified before recruitment."],
          warnings,
        };
      }
      return {
        calculatorId: "two-proportions",
        title: "Use Two Independent Proportions",
        explanation: "Two independent groups are being compared on a binary event or response rate under a superiority objective.",
        assumptions: ["Independent binary outcomes.", "Superiority comparison."],
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
      assumptions: ["Independent groups.", "Group means and SDs can be estimated from a reference study."],
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

function parseGroups(rawGroups: string, language: Language = "en") {
  const groups = rawGroups
    .split(/[\n,]+/)
    .map((group) => group.trim())
    .filter(Boolean);
  if (groups.length >= 2) return groups;
  if (language === "id") return ["Kelompok A", "Kelompok B"];
  if (language === "nl") return ["Groep A", "Groep B"];
  return ["Group A", "Group B"];
}

function parseStrata(rawStrata: string, language: Language = "en") {
  const strata = rawStrata
    .split(/[\n,]+/)
    .map((stratum) => stratum.trim())
    .filter(Boolean);
  return strata.length ? strata : [defaultRandomStrata(language)];
}

function defaultRandomGroups(language: Language) {
  if (language === "id") return "Intervensi, Kontrol";
  if (language === "nl") return "Interventie, Controle";
  return "Intervention, Control";
}

function defaultRandomStrata(language: Language) {
  if (language === "id") return "Semua peserta";
  if (language === "nl") return "Alle deelnemers";
  return "All participants";
}

function defaultArmLabels(language: Language) {
  if (language === "id") return "Kelompok A\nKelompok B\nKelompok C\nKelompok D";
  if (language === "nl") return "Groep A\nGroep B\nGroep C\nGroep D";
  return "Group A\nGroup B\nGroup C\nGroup D";
}

function defaultFrameworkText(language: Language) {
  if (language === "id") {
    return {
      title: "Kerangka konseptual",
      independent: "Pajanan / intervensi",
      dependent: "Luaran utama",
      confounders: "Usia\nJenis kelamin\nKomorbiditas",
    };
  }
  if (language === "nl") {
    return {
      title: "Conceptueel kader",
      independent: "Blootstelling / interventie",
      dependent: "Primaire uitkomst",
      confounders: "Leeftijd\nGeslacht\nComorbiditeit",
    };
  }
  return {
    title: "Conceptual framework",
    independent: "Exposure / intervention",
    dependent: "Primary outcome",
    confounders: "Age\nSex\nComorbidity",
  };
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

function makeRandomSeed() {
  const timestamp = new Date().toISOString().replace(/[-:.TZ]/g, "").slice(0, 14);
  const bytes = new Uint32Array(1);
  window.crypto?.getRandomValues(bytes);
  const suffix = (bytes[0] || Math.floor(Math.random() * 0xffffffff)).toString(36).toUpperCase().padStart(7, "0");
  return `STUDY-${timestamp}-${suffix}`;
}

const flowTemplates: FlowTemplate[] = [
  {
    key: "consort",
    title: "CONSORT randomised trial flow diagram",
    guideline: "CONSORT",
    description: "Participant progress through enrolment, allocation, follow-up, and analysis.",
    nodes: [
      { id: "assessed", label: "Assessed for eligibility", x: 360, y: 70, tone: "primary" },
      { id: "excluded", label: "Excluded", x: 665, y: 70, tone: "warning" },
      { id: "randomised", label: "Randomised", x: 360, y: 190, tone: "primary" },
      { id: "allocatedA", label: "Allocated to group A", x: 155, y: 330 },
      { id: "allocatedB", label: "Allocated to group B", x: 565, y: 330 },
      { id: "followA", label: "Lost to follow-up / discontinued group A", x: 155, y: 470, tone: "warning" },
      { id: "followB", label: "Lost to follow-up / discontinued group B", x: 565, y: 470, tone: "warning" },
      { id: "analysedA", label: "Analysed group A", x: 155, y: 610, tone: "secondary" },
      { id: "analysedB", label: "Analysed group B", x: 565, y: 610, tone: "secondary" },
    ],
    connectors: [
      { from: "assessed", to: "randomised" },
      { from: "assessed", to: "excluded" },
      { from: "randomised", to: "allocatedA" },
      { from: "randomised", to: "allocatedB" },
      { from: "allocatedA", to: "followA" },
      { from: "allocatedB", to: "followB" },
      { from: "followA", to: "analysedA" },
      { from: "followB", to: "analysedB" },
    ],
    defaultCounts: { assessed: "", excluded: "", randomised: "", allocatedA: "", allocatedB: "", followA: "", followB: "", analysedA: "", analysedB: "" },
    defaultNotes: { excluded: "Reasons for exclusion", followA: "Reasons", followB: "Reasons" },
  },
  {
    key: "strobe-cohort",
    title: "STROBE cohort study flow diagram",
    guideline: "STROBE",
    description: "Cohort assembly, eligibility, exposure groups, follow-up, and analysis.",
    nodes: [
      { id: "source", label: "Source population / records screened", x: 360, y: 70, tone: "primary" },
      { id: "ineligible", label: "Not eligible / excluded", x: 665, y: 70, tone: "warning" },
      { id: "eligible", label: "Eligible cohort", x: 360, y: 190, tone: "primary" },
      { id: "exposed", label: "Exposed group", x: 155, y: 330 },
      { id: "unexposed", label: "Unexposed group", x: 565, y: 330 },
      { id: "lostExposed", label: "Lost or missing outcome in exposed", x: 155, y: 470, tone: "warning" },
      { id: "lostUnexposed", label: "Lost or missing outcome in unexposed", x: 565, y: 470, tone: "warning" },
      { id: "analysedExposed", label: "Analysed exposed", x: 155, y: 610, tone: "secondary" },
      { id: "analysedUnexposed", label: "Analysed unexposed", x: 565, y: 610, tone: "secondary" },
    ],
    connectors: [
      { from: "source", to: "eligible" },
      { from: "source", to: "ineligible" },
      { from: "eligible", to: "exposed" },
      { from: "eligible", to: "unexposed" },
      { from: "exposed", to: "lostExposed" },
      { from: "unexposed", to: "lostUnexposed" },
      { from: "lostExposed", to: "analysedExposed" },
      { from: "lostUnexposed", to: "analysedUnexposed" },
    ],
    defaultCounts: { source: "", ineligible: "", eligible: "", exposed: "", unexposed: "", lostExposed: "", lostUnexposed: "", analysedExposed: "", analysedUnexposed: "" },
    defaultNotes: { ineligible: "Eligibility exclusions", lostExposed: "Reasons", lostUnexposed: "Reasons" },
  },
  {
    key: "strobe-case-control",
    title: "STROBE case-control study flow diagram",
    guideline: "STROBE",
    description: "Selection of cases and controls, exclusions, and final analysed samples.",
    nodes: [
      { id: "caseSource", label: "Potential cases identified", x: 155, y: 90, tone: "primary" },
      { id: "controlSource", label: "Potential controls identified", x: 565, y: 90, tone: "primary" },
      { id: "caseExcluded", label: "Cases excluded", x: 155, y: 230, tone: "warning" },
      { id: "controlExcluded", label: "Controls excluded", x: 565, y: 230, tone: "warning" },
      { id: "cases", label: "Eligible cases", x: 155, y: 370 },
      { id: "controls", label: "Eligible controls", x: 565, y: 370 },
      { id: "analysedCases", label: "Cases analysed", x: 155, y: 520, tone: "secondary" },
      { id: "analysedControls", label: "Controls analysed", x: 565, y: 520, tone: "secondary" },
    ],
    connectors: [
      { from: "caseSource", to: "caseExcluded" },
      { from: "controlSource", to: "controlExcluded" },
      { from: "caseExcluded", to: "cases" },
      { from: "controlExcluded", to: "controls" },
      { from: "cases", to: "analysedCases" },
      { from: "controls", to: "analysedControls" },
    ],
    defaultCounts: { caseSource: "", controlSource: "", caseExcluded: "", controlExcluded: "", cases: "", controls: "", analysedCases: "", analysedControls: "" },
    defaultNotes: { caseExcluded: "Reasons", controlExcluded: "Reasons" },
  },
  {
    key: "strobe-cross-sectional",
    title: "STROBE cross-sectional study flow diagram",
    guideline: "STROBE",
    description: "Sampling frame, eligibility, response, complete data, and final analysis.",
    nodes: [
      { id: "invited", label: "Invited / sampled", x: 360, y: 70, tone: "primary" },
      { id: "notEligible", label: "Not eligible", x: 665, y: 70, tone: "warning" },
      { id: "eligible", label: "Eligible", x: 360, y: 190 },
      { id: "nonResponse", label: "Non-response", x: 665, y: 190, tone: "warning" },
      { id: "responded", label: "Responded / assessed", x: 360, y: 330 },
      { id: "incomplete", label: "Incomplete or missing key data", x: 665, y: 330, tone: "warning" },
      { id: "analysed", label: "Included in analysis", x: 360, y: 470, tone: "secondary" },
    ],
    connectors: [
      { from: "invited", to: "eligible" },
      { from: "invited", to: "notEligible" },
      { from: "eligible", to: "responded" },
      { from: "eligible", to: "nonResponse" },
      { from: "responded", to: "analysed" },
      { from: "responded", to: "incomplete" },
    ],
    defaultCounts: { invited: "", notEligible: "", eligible: "", nonResponse: "", responded: "", incomplete: "", analysed: "" },
    defaultNotes: { notEligible: "Reasons", nonResponse: "Reasons", incomplete: "Missing-data reasons" },
  },
  {
    key: "prisma",
    title: "PRISMA study selection flow diagram",
    guideline: "PRISMA",
    description: "Records identified, screened, excluded, assessed, and included in review.",
    nodes: [
      { id: "identified", label: "Records identified", x: 360, y: 60, tone: "primary" },
      { id: "duplicates", label: "Duplicate records removed", x: 665, y: 60, tone: "warning" },
      { id: "screened", label: "Records screened", x: 360, y: 180 },
      { id: "excluded", label: "Records excluded", x: 665, y: 180, tone: "warning" },
      { id: "fullText", label: "Reports sought / assessed for eligibility", x: 360, y: 320 },
      { id: "fullTextExcluded", label: "Reports excluded with reasons", x: 665, y: 320, tone: "warning" },
      { id: "included", label: "Studies included in review", x: 360, y: 470, tone: "secondary" },
    ],
    connectors: [
      { from: "identified", to: "screened" },
      { from: "identified", to: "duplicates" },
      { from: "screened", to: "fullText" },
      { from: "screened", to: "excluded" },
      { from: "fullText", to: "included" },
      { from: "fullText", to: "fullTextExcluded" },
    ],
    defaultCounts: { identified: "", duplicates: "", screened: "", excluded: "", fullText: "", fullTextExcluded: "", included: "" },
    defaultNotes: { duplicates: "Sources", excluded: "Screening reasons", fullTextExcluded: "Full-text exclusion reasons" },
  },
  {
    key: "stard",
    title: "STARD diagnostic accuracy flow diagram",
    guideline: "STARD",
    description: "Participant flow through eligibility, index test, reference standard, and analysis.",
    nodes: [
      { id: "eligible", label: "Potentially eligible participants", x: 360, y: 70, tone: "primary" },
      { id: "excluded", label: "Excluded before testing", x: 665, y: 70, tone: "warning" },
      { id: "indexTest", label: "Received index test", x: 360, y: 200 },
      { id: "noIndex", label: "Did not receive index test", x: 665, y: 200, tone: "warning" },
      { id: "reference", label: "Received reference standard", x: 360, y: 340 },
      { id: "noReference", label: "No reference standard / uninterpretable", x: 665, y: 340, tone: "warning" },
      { id: "analysis", label: "Included in diagnostic accuracy analysis", x: 360, y: 490, tone: "secondary" },
    ],
    connectors: [
      { from: "eligible", to: "indexTest" },
      { from: "eligible", to: "excluded" },
      { from: "indexTest", to: "reference" },
      { from: "indexTest", to: "noIndex" },
      { from: "reference", to: "analysis" },
      { from: "reference", to: "noReference" },
    ],
    defaultCounts: { eligible: "", excluded: "", indexTest: "", noIndex: "", reference: "", noReference: "", analysis: "" },
    defaultNotes: { excluded: "Reasons", noIndex: "Reasons", noReference: "Reasons" },
  },
  {
    key: "generic",
    title: "Generic participant flow diagram",
    guideline: "General reporting",
    description: "Flexible participant flow for pilot, feasibility, audit, service evaluation, or local reporting.",
    nodes: [
      { id: "identified", label: "Identified / approached", x: 360, y: 70, tone: "primary" },
      { id: "excluded", label: "Excluded / declined", x: 665, y: 70, tone: "warning" },
      { id: "enrolled", label: "Enrolled / included", x: 360, y: 210 },
      { id: "completed", label: "Completed follow-up or data collection", x: 360, y: 360 },
      { id: "missing", label: "Missing data / withdrawn", x: 665, y: 360, tone: "warning" },
      { id: "analysed", label: "Analysed", x: 360, y: 510, tone: "secondary" },
    ],
    connectors: [
      { from: "identified", to: "enrolled" },
      { from: "identified", to: "excluded" },
      { from: "enrolled", to: "completed" },
      { from: "completed", to: "analysed" },
      { from: "completed", to: "missing" },
    ],
    defaultCounts: { identified: "", excluded: "", enrolled: "", completed: "", missing: "", analysed: "" },
    defaultNotes: { excluded: "Reasons", missing: "Reasons" },
  },
];

const flowChecklistLinks: Record<FlowTemplateKey, string> = {
  consort: "https://www.equator-network.org/reporting-guidelines/consort/",
  "strobe-cohort": "https://www.equator-network.org/reporting-guidelines/strobe/",
  "strobe-case-control": "https://www.equator-network.org/reporting-guidelines/strobe/",
  "strobe-cross-sectional": "https://www.equator-network.org/reporting-guidelines/strobe/",
  prisma: "https://www.equator-network.org/reporting-guidelines/prisma/",
  stard: "https://www.equator-network.org/reporting-guidelines/stard/",
  generic: "https://www.equator-network.org/",
};

function flowTemplateByKey(key: FlowTemplateKey) {
  return flowTemplates.find((template) => template.key === key) ?? flowTemplates[0];
}

function translateFlowLabel(label: string, language: Language) {
  const dynamicPrefixes = [
    "Lost or missing outcome in ",
    "Missing data / withdrawn in ",
    "Allocated to ",
    "Lost to follow-up / discontinued ",
    "Analysed ",
  ];
  const prefix = dynamicPrefixes.find((item) => label.startsWith(item));
  if (!prefix) return t(label, language);
  return `${t(prefix, language)}${label.slice(prefix.length)}`;
}

function localiseFlowTemplate(template: FlowTemplate, language: Language): FlowTemplate {
  return {
    ...template,
    title: t(template.title, language),
    description: t(template.description, language),
    nodes: template.nodes.map((node) => ({ ...node, label: translateFlowLabel(node.label, language) })),
    defaultNotes: Object.fromEntries(
      Object.entries(template.defaultNotes).map(([key, value]) => [key, t(value, language)]),
    ),
  };
}

function parseFlowCount(value?: string) {
  if (!value?.trim()) return undefined;
  const normalised = value.replace(/,/g, "").trim();
  if (!/^\d+(\.\d+)?$/.test(normalised)) return undefined;
  return Number(normalised);
}

function formatFlowCount(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(2).replace(/\.?0+$/, "");
}

function deriveFlowCounts(template: FlowTemplate, counts: Record<string, string>): DerivedFlowCounts {
  const nodesById = Object.fromEntries(template.nodes.map((node) => [node.id, node]));
  const nextCounts = { ...counts };
  const derivedIds = new Set<string>();
  const connectorsBySource = template.connectors.reduce<Record<string, FlowConnector[]>>((groups, connector) => {
    groups[connector.from] = [...(groups[connector.from] ?? []), connector];
    return groups;
  }, {});

  const applyDerivedCount = (targetId: string, sourceId: string, warningIds: string[]) => {
    const sourceValue = parseFlowCount(nextCounts[sourceId]);
    const warningValues = warningIds.map((warningId) => parseFlowCount(nextCounts[warningId]));
    if (sourceValue === undefined || warningValues.some((value) => value === undefined)) return;
    const derived = Math.max(0, sourceValue - warningValues.reduce((sum, value) => sum + (value ?? 0), 0));
    nextCounts[targetId] = formatFlowCount(derived);
    derivedIds.add(targetId);
  };

  Object.entries(connectorsBySource).forEach(([sourceId, connectors]) => {
    const warningTargets = connectors.map((connector) => nodesById[connector.to]).filter((node) => node?.tone === "warning");
    const continuedTargets = connectors.map((connector) => nodesById[connector.to]).filter((node) => node && node.tone !== "warning");
    if (!warningTargets.length || !continuedTargets.length) return;
    continuedTargets.forEach((target) => applyDerivedCount(target.id, sourceId, warningTargets.map((node) => node.id)));
  });

  template.nodes
    .filter((node) => node.tone === "warning")
    .forEach((warningNode) => {
      const incoming = template.connectors.find((connector) => connector.to === warningNode.id);
      const outgoing = template.connectors
        .filter((connector) => connector.from === warningNode.id)
        .map((connector) => nodesById[connector.to])
        .filter((node) => node && node.tone !== "warning");
      if (!incoming || outgoing.length === 0) return;
      outgoing.forEach((target) => applyDerivedCount(target.id, incoming.from, [warningNode.id]));
    });

  return { counts: nextCounts, derivedIds };
}

function supportsFlowArms(key: FlowTemplateKey) {
  return key === "consort" || key === "strobe-cohort" || key === "generic";
}

function parseFlowArmLabels(rawLabels: string, armCount: number, language: Language = "en") {
  const labels = rawLabels
    .split(/\n+/)
    .map((label) => label.trim())
    .filter(Boolean);
  return Array.from({ length: armCount }, (_, index) => {
    if (labels[index]) return labels[index];
    if (language === "id") return `Lengan ${index + 1}`;
    if (language === "nl") return `Arm ${index + 1}`;
    return `Arm ${index + 1}`;
  });
}

function flowArmXPositions(armCount: number) {
  const gap = 35;
  const totalWidth = armCount * flowBox.width + (armCount - 1) * gap;
  const canvasWidth = Math.max(1000, totalWidth + 80);
  const start = (canvasWidth - totalWidth) / 2;
  return {
    canvasWidth,
    positions: Array.from({ length: armCount }, (_, index) => start + index * (flowBox.width + gap)),
  };
}

function armFlowTemplate(template: FlowTemplate, armCount: number, armLabels: string[]) {
  if (!supportsFlowArms(template.key)) return template;

  const { canvasWidth, positions } = flowArmXPositions(armCount);
  const centerX = canvasWidth / 2 - flowBox.width / 2;
  const exclusionX = Math.min(canvasWidth - flowBox.width - 40, centerX + 330);
  const armNodes = armLabels.flatMap((label, index) => {
    const suffix = index + 1;
    const x = positions[index];
    if (template.key === "strobe-cohort") {
      return [
        { id: `arm${suffix}`, label, x, y: 330 },
        { id: `lostArm${suffix}`, label: `Lost or missing outcome in ${label}`, x, y: 470, tone: "warning" as const },
        { id: `analysedArm${suffix}`, label: `Analysed ${label}`, x, y: 610, tone: "secondary" as const },
      ];
    }
    if (template.key === "generic") {
      return [
        { id: `arm${suffix}`, label, x, y: 350 },
        { id: `missingArm${suffix}`, label: `Missing data / withdrawn in ${label}`, x, y: 490, tone: "warning" as const },
        { id: `analysedArm${suffix}`, label: `Analysed ${label}`, x, y: 630, tone: "secondary" as const },
      ];
    }
    return [
      { id: `allocatedArm${suffix}`, label: `Allocated to ${label}`, x, y: 330 },
      { id: `followArm${suffix}`, label: `Lost to follow-up / discontinued ${label}`, x, y: 470, tone: "warning" as const },
      { id: `analysedArm${suffix}`, label: `Analysed ${label}`, x, y: 610, tone: "secondary" as const },
    ];
  });

  if (template.key === "strobe-cohort") {
    const connectors = [
      { from: "source", to: "eligible" },
      { from: "source", to: "ineligible" },
      ...armLabels.flatMap((_, index) => {
        const suffix = index + 1;
        return [
          { from: "eligible", to: `arm${suffix}` },
          { from: `arm${suffix}`, to: `lostArm${suffix}` },
          { from: `lostArm${suffix}`, to: `analysedArm${suffix}` },
        ];
      }),
    ];
    const defaultCounts = Object.fromEntries([
      ["source", ""],
      ["ineligible", ""],
      ["eligible", ""],
      ...armLabels.flatMap((_, index) => {
        const suffix = index + 1;
        return [[`arm${suffix}`, ""], [`lostArm${suffix}`, ""], [`analysedArm${suffix}`, ""]];
      }),
    ]);
    const defaultNotes = Object.fromEntries([
      ["ineligible", "Eligibility exclusions"],
      ...armLabels.map((_, index) => [`lostArm${index + 1}`, "Reasons"]),
    ]);
    return {
      ...template,
      nodes: [
        { id: "source", label: "Source population / records screened", x: centerX, y: 70, tone: "primary" as const },
        { id: "ineligible", label: "Not eligible / excluded", x: exclusionX, y: 70, tone: "warning" as const },
        { id: "eligible", label: "Eligible cohort", x: centerX, y: 190, tone: "primary" as const },
        ...armNodes,
      ],
      connectors,
      defaultCounts,
      defaultNotes,
    };
  }

  if (template.key === "generic") {
    const connectors = [
      { from: "identified", to: "enrolled" },
      { from: "identified", to: "excluded" },
      ...armLabels.flatMap((_, index) => {
        const suffix = index + 1;
        return [
          { from: "enrolled", to: `arm${suffix}` },
          { from: `arm${suffix}`, to: `missingArm${suffix}` },
          { from: `missingArm${suffix}`, to: `analysedArm${suffix}` },
        ];
      }),
    ];
    const defaultCounts = Object.fromEntries([
      ["identified", ""],
      ["excluded", ""],
      ["enrolled", ""],
      ...armLabels.flatMap((_, index) => {
        const suffix = index + 1;
        return [[`arm${suffix}`, ""], [`missingArm${suffix}`, ""], [`analysedArm${suffix}`, ""]];
      }),
    ]);
    const defaultNotes = Object.fromEntries([
      ["excluded", "Reasons"],
      ...armLabels.map((_, index) => [`missingArm${index + 1}`, "Reasons"]),
    ]);
    return {
      ...template,
      nodes: [
        { id: "identified", label: "Identified / approached", x: centerX, y: 70, tone: "primary" as const },
        { id: "excluded", label: "Excluded / declined", x: exclusionX, y: 70, tone: "warning" as const },
        { id: "enrolled", label: "Enrolled / included", x: centerX, y: 210 },
        ...armNodes,
      ],
      connectors,
      defaultCounts,
      defaultNotes,
    };
  }

  const connectors = [
    { from: "assessed", to: "randomised" },
    { from: "assessed", to: "excluded" },
    ...armLabels.flatMap((_, index) => {
      const suffix = index + 1;
      return [
        { from: "randomised", to: `allocatedArm${suffix}` },
        { from: `allocatedArm${suffix}`, to: `followArm${suffix}` },
        { from: `followArm${suffix}`, to: `analysedArm${suffix}` },
      ];
    }),
  ];
  const defaultCounts = Object.fromEntries([
    ["assessed", ""],
    ["excluded", ""],
    ["randomised", ""],
    ...armLabels.flatMap((_, index) => {
      const suffix = index + 1;
      return [[`allocatedArm${suffix}`, ""], [`followArm${suffix}`, ""], [`analysedArm${suffix}`, ""]];
    }),
  ]);
  const defaultNotes = Object.fromEntries([
    ["excluded", "Reasons for exclusion"],
    ...armLabels.map((_, index) => [`followArm${index + 1}`, "Reasons"]),
  ]);

  return {
    ...template,
    nodes: [
      { id: "assessed", label: "Assessed for eligibility", x: centerX, y: 70, tone: "primary" as const },
      { id: "excluded", label: "Excluded", x: exclusionX, y: 70, tone: "warning" as const },
      { id: "randomised", label: "Randomised", x: centerX, y: 190, tone: "primary" as const },
      ...armNodes,
    ],
    connectors,
    defaultCounts,
    defaultNotes,
  };
}

function wrapSvgLines(text: string, maxLength: number) {
  const words = text.trim().split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = "";
  words.forEach((word) => {
    const next = line ? `${line} ${word}` : word;
    if (next.length > maxLength && line) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  });
  if (line) lines.push(line);
  return lines.length ? lines : [""];
}

function escapeXml(text: string) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function flowNodeText(node: FlowNode, counts: Record<string, string>, notes: Record<string, string>) {
  const count = counts[node.id]?.trim();
  const note = notes[node.id]?.trim();
  return [node.label, count ? `n = ${count}` : "", note ?? ""].filter(Boolean).join("\n");
}

const flowBox = { width: 250, minHeight: 92, lineHeight: 15, textTop: 25 };

function flowNodeLines(node: FlowNode, counts: Record<string, string>, notes: Record<string, string>) {
  return flowNodeText(node, counts, notes)
    .split("\n")
    .flatMap((line) => wrapSvgLines(line, 28));
}

function flowNodeHeight(node: FlowNode, counts: Record<string, string>, notes: Record<string, string>) {
  const lines = flowNodeLines(node, counts, notes);
  return Math.max(flowBox.minHeight, flowBox.textTop + lines.length * flowBox.lineHeight + 16);
}

function prepareFlowNodes(template: FlowTemplate, counts: Record<string, string>, notes: Record<string, string>) {
  const rows = [...new Set(template.nodes.map((node) => node.y))].sort((a, b) => a - b);
  let currentY = Math.min(...rows, 70);
  const prepared: PreparedFlowNode[] = [];

  rows.forEach((rowY) => {
    const rowNodes = template.nodes.filter((node) => node.y === rowY);
    const rowHeight = Math.max(...rowNodes.map((node) => flowNodeHeight(node, counts, notes)));
    rowNodes.forEach((node) => {
      prepared.push({ ...node, y: currentY, height: rowHeight });
    });
    currentY += rowHeight + 48;
  });

  return prepared;
}

function flowNodeCenter(node: PreparedFlowNode) {
  return {
    x: node.x + flowBox.width / 2,
    y: node.y + node.height / 2,
  };
}

function flowNodeFill(tone?: FlowNode["tone"]) {
  if (tone === "primary") return "#dff7ef";
  if (tone === "warning") return "#ffe8e4";
  if (tone === "secondary") return "#e7f0ff";
  return "#ffffff";
}

function flowNodeStroke(tone?: FlowNode["tone"]) {
  if (tone === "primary") return "#0f9f9a";
  if (tone === "warning") return "#f47b65";
  if (tone === "secondary") return "#4b77d9";
  return "#d7deea";
}

function flowCanvasWidth(nodes: PreparedFlowNode[]) {
  return Math.max(1000, Math.max(...nodes.map((node) => node.x + flowBox.width)) + 40);
}

function flowCanvasHeight(nodes: PreparedFlowNode[]) {
  return Math.max(660, Math.max(...nodes.map((node) => node.y + node.height)) + 90);
}

function flowConnectorPoints(from: PreparedFlowNode, to: PreparedFlowNode) {
  const startCenter = flowNodeCenter(from);
  const endCenter = flowNodeCenter(to);
  const dx = endCenter.x - startCenter.x;
  const dy = endCenter.y - startCenter.y;
  const distance = Math.hypot(dx, dy) || 1;
  const unitX = dx / distance;
  const unitY = dy / distance;
  const sourceScale = Math.min(
    Math.abs(dx) < 0.001 ? Number.POSITIVE_INFINITY : flowBox.width / 2 / Math.abs(dx),
    Math.abs(dy) < 0.001 ? Number.POSITIVE_INFINITY : from.height / 2 / Math.abs(dy),
  );
  const targetScale = Math.min(
    Math.abs(dx) < 0.001 ? Number.POSITIVE_INFINITY : flowBox.width / 2 / Math.abs(dx),
    Math.abs(dy) < 0.001 ? Number.POSITIVE_INFINITY : to.height / 2 / Math.abs(dy),
  );
  const sourceEdge = {
    x: startCenter.x + dx * sourceScale,
    y: startCenter.y + dy * sourceScale,
  };
  const targetEdge = {
    x: endCenter.x - dx * targetScale,
    y: endCenter.y - dy * targetScale,
  };

  return {
    x1: sourceEdge.x + unitX * 10,
    y1: sourceEdge.y + unitY * 10,
    x2: targetEdge.x - unitX * 13,
    y2: targetEdge.y - unitY * 13,
  };
}

function FlowChartFigure({
  counts,
  notes,
  template,
  title,
}: {
  counts: Record<string, string>;
  notes: Record<string, string>;
  template: FlowTemplate;
  title: string;
}) {
  const preparedNodes = prepareFlowNodes(template, counts, notes);
  const width = flowCanvasWidth(preparedNodes);
  const height = flowCanvasHeight(preparedNodes);
  const nodesById = Object.fromEntries(preparedNodes.map((node) => [node.id, node]));

  return (
    <svg className="flowchart-svg" role="img" aria-label={title} viewBox={`0 0 ${width} ${height}`}>
      <defs>
        <marker id="flow-arrow" markerHeight="10" markerWidth="10" orient="auto" refX="9" refY="3">
          <path d="M0,0 L0,6 L9,3 z" fill="#32415f" />
        </marker>
      </defs>
      <rect width={width} height={height} fill="#fbfcff" rx="18" />
      <text x={width / 2} y="34" textAnchor="middle" fill="#172033" fontSize="22" fontWeight="800">
        {title}
      </text>
      {template.connectors.map((connector) => {
        const from = nodesById[connector.from];
        const to = nodesById[connector.to];
        if (!from || !to) return null;
        const { x1, x2, y1, y2 } = flowConnectorPoints(from, to);

        return (
          <line
            key={`${connector.from}-${connector.to}`}
            markerEnd="url(#flow-arrow)"
            stroke="#32415f"
            strokeWidth="2.5"
            x1={x1}
            x2={x2}
            y1={y1}
            y2={y2}
          />
        );
      })}
      {preparedNodes.map((node) => {
        const lines = flowNodeLines(node, counts, notes);
        const startY = node.y + flowBox.textTop;

        return (
          <g key={node.id}>
            <rect
              fill={flowNodeFill(node.tone)}
              height={node.height}
              rx="8"
              stroke={flowNodeStroke(node.tone)}
              strokeWidth="2"
              width={flowBox.width}
              x={node.x}
              y={node.y}
            />
            {lines.map((line, index) => (
              <text
                fill={index === 0 ? "#172033" : "#43516f"}
                fontSize={index === 0 ? 14 : 13}
                fontWeight={index === 0 ? 800 : 600}
                key={`${node.id}-${line}-${index}`}
                textAnchor="middle"
                x={node.x + flowBox.width / 2}
                y={startY + index * 15}
              >
                {line}
              </text>
            ))}
          </g>
        );
      })}
      <text x={width / 2} y={height - 24} textAnchor="middle" fill="#6b7690" fontSize="12">
        StudySize Studio flow chart generator
      </text>
    </svg>
  );
}

function buildFlowChartSvg(template: FlowTemplate, title: string, counts: Record<string, string>, notes: Record<string, string>) {
  const preparedNodes = prepareFlowNodes(template, counts, notes);
  const width = flowCanvasWidth(preparedNodes);
  const height = flowCanvasHeight(preparedNodes);
  const nodesById = Object.fromEntries(preparedNodes.map((node) => [node.id, node]));
  const connectors = template.connectors
    .map((connector) => {
      const from = nodesById[connector.from];
      const to = nodesById[connector.to];
      if (!from || !to) return "";
      const { x1, x2, y1, y2 } = flowConnectorPoints(from, to);
      return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#32415f" stroke-width="2.5" marker-end="url(#flow-arrow)" />`;
    })
    .join("");
  const nodes = preparedNodes
    .map((node) => {
      const lines = flowNodeLines(node, counts, notes);
      const text = lines
        .map((line, index) => {
          const fill = index === 0 ? "#172033" : "#43516f";
          const fontSize = index === 0 ? 14 : 13;
          const fontWeight = index === 0 ? 800 : 600;
          return `<text x="${node.x + flowBox.width / 2}" y="${node.y + flowBox.textTop + index * flowBox.lineHeight}" text-anchor="middle" fill="${fill}" font-size="${fontSize}" font-weight="${fontWeight}">${escapeXml(line)}</text>`;
        })
        .join("");
      return `<g><rect x="${node.x}" y="${node.y}" width="${flowBox.width}" height="${node.height}" rx="8" fill="${flowNodeFill(node.tone)}" stroke="${flowNodeStroke(node.tone)}" stroke-width="2" />${text}</g>`;
    })
    .join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <defs><marker id="flow-arrow" markerHeight="10" markerWidth="10" orient="auto" refX="9" refY="3"><path d="M0,0 L0,6 L9,3 z" fill="#32415f" /></marker></defs>
    <rect width="${width}" height="${height}" fill="#fbfcff" rx="18" />
    <text x="${width / 2}" y="34" text-anchor="middle" fill="#172033" font-family="Arial, sans-serif" font-size="22" font-weight="800">${escapeXml(title)}</text>
    <g font-family="Arial, sans-serif">${connectors}${nodes}</g>
    <text x="${width / 2}" y="${height - 24}" text-anchor="middle" fill="#6b7690" font-family="Arial, sans-serif" font-size="12">StudySize Studio flow chart generator</text>
  </svg>`;
}

function parseFrameworkVariables(value: string, fallback: string[]) {
  const variables = value
    .split(/\n+/)
    .map((item) => item.trim())
    .filter(Boolean);
  return variables.length ? variables : fallback;
}

function frameworkBoxHeight(box: FrameworkBox) {
  const variableLines = box.variables.flatMap((variable) => wrapSvgLines(variable, 28));
  return Math.max(100, 48 + variableLines.length * 17 + 18);
}

function frameworkFill(tone: FrameworkBox["tone"]) {
  if (tone === "primary") return "#dff7ef";
  if (tone === "secondary") return "#e7f0ff";
  if (tone === "warning") return "#ffe8e4";
  return "#ffffff";
}

function frameworkStroke(tone: FrameworkBox["tone"]) {
  if (tone === "primary") return "#0f9f9a";
  if (tone === "secondary") return "#4b77d9";
  if (tone === "warning") return "#f47b65";
  return "#d7deea";
}

function frameworkConnector(from: FrameworkBox, to: FrameworkBox) {
  const fromHeight = frameworkBoxHeight(from);
  const toHeight = frameworkBoxHeight(to);
  const start = { x: from.x + from.width / 2, y: from.y + fromHeight / 2 };
  const end = { x: to.x + to.width / 2, y: to.y + toHeight / 2 };
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const distance = Math.hypot(dx, dy) || 1;
  const unitX = dx / distance;
  const unitY = dy / distance;
  const sourceScale = Math.min(
    Math.abs(dx) < 0.001 ? Number.POSITIVE_INFINITY : from.width / 2 / Math.abs(dx),
    Math.abs(dy) < 0.001 ? Number.POSITIVE_INFINITY : fromHeight / 2 / Math.abs(dy),
  );
  const targetScale = Math.min(
    Math.abs(dx) < 0.001 ? Number.POSITIVE_INFINITY : to.width / 2 / Math.abs(dx),
    Math.abs(dy) < 0.001 ? Number.POSITIVE_INFINITY : toHeight / 2 / Math.abs(dy),
  );
  return {
    x1: start.x + dx * sourceScale + unitX * 9,
    y1: start.y + dy * sourceScale + unitY * 9,
    x2: end.x - dx * targetScale - unitX * 14,
    y2: end.y - dy * targetScale - unitY * 14,
  };
}

function frameworkBoxes(
  independentVariables: string[],
  dependentVariables: string[],
  confoundingVariables: string[],
  mediatorVariables: string[],
  moderatorVariables: string[],
  covariateVariables: string[],
  language: Language,
) {
  const boxes: FrameworkBox[] = [
    { id: "independent", title: t("Independent variables", language), variables: independentVariables, x: 70, y: 235, width: 250, tone: "primary" },
    { id: "dependent", title: t("Dependent variables", language), variables: dependentVariables, x: 690, y: 235, width: 250, tone: "secondary" },
  ];
  if (mediatorVariables.length) {
    boxes.push({ id: "mediators", title: t("Mediators", language), variables: mediatorVariables, x: 380, y: 235, width: 250, tone: "neutral" });
  }
  if (confoundingVariables.length) {
    boxes.push({ id: "confounders", title: t("Confounding variables", language), variables: confoundingVariables, x: 380, y: 70, width: 250, tone: "warning" });
  }
  if (moderatorVariables.length) {
    boxes.push({ id: "moderators", title: t("Moderators / effect modifiers", language), variables: moderatorVariables, x: 380, y: 405, width: 250, tone: "neutral" });
  }
  if (covariateVariables.length) {
    boxes.push({ id: "covariates", title: t("Covariates / adjustment variables", language), variables: covariateVariables, x: 70, y: 405, width: 250, tone: "neutral" });
  }
  return boxes;
}

function frameworkCanvasHeight(boxes: FrameworkBox[]) {
  return Math.max(610, Math.max(...boxes.map((box) => box.y + frameworkBoxHeight(box))) + 80);
}

function FrameworkFigure({
  confoundingVariables,
  covariateVariables,
  dependentVariables,
  independentVariables,
  mediatorVariables,
  moderatorVariables,
  title,
  language,
}: {
  confoundingVariables: string[];
  covariateVariables: string[];
  dependentVariables: string[];
  independentVariables: string[];
  mediatorVariables: string[];
  moderatorVariables: string[];
  title: string;
  language: Language;
}) {
  const boxes = frameworkBoxes(independentVariables, dependentVariables, confoundingVariables, mediatorVariables, moderatorVariables, covariateVariables, language);
  const boxesById = Object.fromEntries(boxes.map((box) => [box.id, box]));
  const height = frameworkCanvasHeight(boxes);
  const connectors = [
    boxesById.mediators
      ? ["independent", "mediators", false]
      : ["independent", "dependent", false],
    boxesById.mediators ? ["mediators", "dependent", false] : undefined,
    boxesById.confounders ? ["confounders", "independent", false] : undefined,
    boxesById.confounders ? ["confounders", "dependent", false] : undefined,
    boxesById.moderators ? ["moderators", boxesById.mediators ? "mediators" : "dependent", true] : undefined,
    boxesById.covariates ? ["covariates", "dependent", true] : undefined,
  ].filter(Boolean) as [string, string, boolean][];

  return (
    <svg className="framework-svg" role="img" aria-label={title} viewBox={`0 0 1010 ${height}`}>
      <defs>
        <marker id="framework-arrow" markerHeight="10" markerWidth="10" orient="auto" refX="9" refY="3">
          <path d="M0,0 L0,6 L9,3 z" fill="#32415f" />
        </marker>
      </defs>
      <rect width="1010" height={height} fill="#fbfcff" rx="18" />
      <text x="505" y="36" textAnchor="middle" fill="#172033" fontSize="22" fontWeight="800">{title}</text>
      {connectors.map(([fromId, toId, dashed]) => {
        const from = boxesById[fromId];
        const to = boxesById[toId];
        if (!from || !to) return null;
        const line = frameworkConnector(from, to);
        return (
          <line
            key={`${fromId}-${toId}`}
            markerEnd="url(#framework-arrow)"
            stroke="#32415f"
            strokeDasharray={dashed ? "8 7" : undefined}
            strokeWidth="2.5"
            {...line}
          />
        );
      })}
      {boxes.map((box) => {
        const height = frameworkBoxHeight(box);
        const lines = box.variables.flatMap((variable) => wrapSvgLines(variable, 28));
        return (
          <g key={box.id}>
            <rect fill={frameworkFill(box.tone)} height={height} rx="8" stroke={frameworkStroke(box.tone)} strokeWidth="2" width={box.width} x={box.x} y={box.y} />
            <text x={box.x + box.width / 2} y={box.y + 25} textAnchor="middle" fill="#172033" fontSize="14" fontWeight="800">
              {box.title}
            </text>
            {lines.map((line, index) => (
              <text key={`${box.id}-${line}-${index}`} x={box.x + box.width / 2} y={box.y + 52 + index * 17} textAnchor="middle" fill="#43516f" fontSize="13" fontWeight="600">
                {line}
              </text>
            ))}
          </g>
        );
      })}
      <text x="505" y={height - 24} textAnchor="middle" fill="#6b7690" fontSize="12">StudySize Studio conceptual framework generator</text>
    </svg>
  );
}

function buildFrameworkSvg(
  title: string,
  independentVariables: string[],
  dependentVariables: string[],
  confoundingVariables: string[],
  mediatorVariables: string[],
  moderatorVariables: string[],
  covariateVariables: string[],
  language: Language,
) {
  const boxes = frameworkBoxes(independentVariables, dependentVariables, confoundingVariables, mediatorVariables, moderatorVariables, covariateVariables, language);
  const boxesById = Object.fromEntries(boxes.map((box) => [box.id, box]));
  const height = frameworkCanvasHeight(boxes);
  const connectors = [
    boxesById.mediators ? ["independent", "mediators", false] : ["independent", "dependent", false],
    boxesById.mediators ? ["mediators", "dependent", false] : undefined,
    boxesById.confounders ? ["confounders", "independent", false] : undefined,
    boxesById.confounders ? ["confounders", "dependent", false] : undefined,
    boxesById.moderators ? ["moderators", boxesById.mediators ? "mediators" : "dependent", true] : undefined,
    boxesById.covariates ? ["covariates", "dependent", true] : undefined,
  ].filter(Boolean) as [string, string, boolean][];
  const connectorMarkup = connectors
    .map(([fromId, toId, dashed]) => {
      const from = boxesById[fromId];
      const to = boxesById[toId];
      if (!from || !to) return "";
      const line = frameworkConnector(from, to);
      return `<line x1="${line.x1}" y1="${line.y1}" x2="${line.x2}" y2="${line.y2}" stroke="#32415f" stroke-width="2.5" ${dashed ? 'stroke-dasharray="8 7"' : ""} marker-end="url(#framework-arrow)" />`;
    })
    .join("");
  const boxMarkup = boxes
    .map((box) => {
      const boxHeight = frameworkBoxHeight(box);
      const lines = box.variables.flatMap((variable) => wrapSvgLines(variable, 28));
      const text = [
        `<text x="${box.x + box.width / 2}" y="${box.y + 25}" text-anchor="middle" fill="#172033" font-size="14" font-weight="800">${escapeXml(box.title)}</text>`,
        ...lines.map((line, index) => `<text x="${box.x + box.width / 2}" y="${box.y + 52 + index * 17}" text-anchor="middle" fill="#43516f" font-size="13" font-weight="600">${escapeXml(line)}</text>`),
      ].join("");
      return `<g><rect x="${box.x}" y="${box.y}" width="${box.width}" height="${boxHeight}" rx="8" fill="${frameworkFill(box.tone)}" stroke="${frameworkStroke(box.tone)}" stroke-width="2" />${text}</g>`;
    })
    .join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1010" height="${height}" viewBox="0 0 1010 ${height}">
    <defs><marker id="framework-arrow" markerHeight="10" markerWidth="10" orient="auto" refX="9" refY="3"><path d="M0,0 L0,6 L9,3 z" fill="#32415f" /></marker></defs>
    <rect width="1010" height="${height}" fill="#fbfcff" rx="18" />
    <text x="505" y="36" text-anchor="middle" fill="#172033" font-family="Arial, sans-serif" font-size="22" font-weight="800">${escapeXml(title)}</text>
    <g font-family="Arial, sans-serif">${connectorMarkup}${boxMarkup}</g>
    <text x="505" y="${height - 24}" text-anchor="middle" fill="#6b7690" font-family="Arial, sans-serif" font-size="12">StudySize Studio conceptual framework generator</text>
  </svg>`;
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
  const [questionFramework, setQuestionFramework] = useState<QuestionFramework>("pico");
  const [studyPopulation, setStudyPopulation] = useState("adult surgical patients");
  const [studyExposure, setStudyExposure] = useState("perioperative intervention");
  const [studyComparator, setStudyComparator] = useState("standard care");
  const [studyPrimaryOutcome, setStudyPrimaryOutcome] = useState("postoperative complication within 30 days");
  const [studySetting, setStudySetting] = useState("tertiary hospital");
  const [outcomeName, setOutcomeName] = useState("postoperative complication");
  const [outcomeType, setOutcomeType] = useState("binary");
  const [outcomeTimepoint, setOutcomeTimepoint] = useState("30 days after surgery");
  const [outcomeInstrument, setOutcomeInstrument] = useState("standardised case report form and medical record review");
  const [outcomeDifference, setOutcomeDifference] = useState("a clinically meaningful absolute difference of 10 percentage points");
  const [variableNames, setVariableNames] = useState("age\nsex\nASA physical status\nintervention group\nprimary outcome");
  const [variableType, setVariableType] = useState("mixed continuous, categorical, and binary variables");
  const [dataSource, setDataSource] = useState("case report forms and hospital electronic medical records");
  const [codingNotes, setCodingNotes] = useState("Use prespecified numeric codes for categorical variables and retain raw continuous values where possible.");
  const [inclusionCriteria, setInclusionCriteria] = useState("Adults aged 18 years or older\nScheduled for eligible procedure\nAble to provide informed consent");
  const [exclusionCriteria, setExclusionCriteria] = useState("Emergency surgery\nPregnancy\nPrevious enrolment in this study");
  const [recruitmentSetting, setRecruitmentSetting] = useState("preoperative clinic and inpatient surgical wards");
  const [biasConcerns, setBiasConcerns] = useState("selection bias\nmeasurement bias\nconfounding\nmissing outcome data");
  const [biasSafeguards, setBiasSafeguards] = useState("consecutive screening\nstandardised outcome definitions\nprespecified adjustment variables\ncomplete follow-up procedures");
  const [primaryAnalysis, setPrimaryAnalysis] = useState("compare the primary outcome between study groups using an appropriate regression model");
  const [effectMeasure, setEffectMeasure] = useState("risk ratio or adjusted odds ratio with 95% confidence interval");
  const [adjustmentVariables, setAdjustmentVariables] = useState("age\nsex\nbaseline severity\nimportant prognostic factors");
  const [missingDataApproach, setMissingDataApproach] = useState("describe missingness, compare complete and incomplete cases, and use multiple imputation if missing data are substantial");
  const [consentApproach, setConsentApproach] = useState("written informed consent before enrolment");
  const [confidentialityPlan, setConfidentialityPlan] = useState("coded study identifiers, password-protected files, and access limited to authorised study personnel");
  const [participantRisks, setParticipantRisks] = useState("minimal additional risk beyond routine care");
  const [disseminationPlan, setDisseminationPlan] = useState("publication in a peer-reviewed journal and presentation at scientific meetings");
  const [timelineStart, setTimelineStart] = useState("2026-08-01");
  const [ethicsMonths, setEthicsMonths] = useState(2);
  const [recruitmentMonths, setRecruitmentMonths] = useState(8);
  const [analysisMonths, setAnalysisMonths] = useState(3);
  const [storageLocation, setStorageLocation] = useState("Institutional secure drive or approved research database");
  const [accessControl, setAccessControl] = useState("Role-based access for named study team members");
  const [qualityChecks, setQualityChecks] = useState("Range checks, duplicate checks, source-data verification, and query log");
  const [retentionPeriod, setRetentionPeriod] = useState("At least 5 years after publication or according to institutional policy");
  const [protocolChecks, setProtocolChecks] = useState<Record<string, boolean>>({
    question: true,
    outcomes: false,
    eligibility: false,
    sampleSize: false,
    analysis: false,
    ethics: false,
    data: false,
    reporting: false,
  });
  const [activeCategory, setActiveCategory] = useState("All");
  const [activeId, setActiveId] = useState(calculators[0].id);
  const [referenceFormat, setReferenceFormat] = useState<ReferenceFormat>("vancouver");
  const [decisionAnswers, setDecisionAnswers] = useState<DecisionAnswers>({});
  const [decisionHandoff, setDecisionHandoff] = useState("");
  const [randomSubjectCount, setRandomSubjectCount] = useState(60);
  const [randomGroups, setRandomGroups] = useState(() => defaultRandomGroups(language));
  const [randomStrata, setRandomStrata] = useState(() => defaultRandomStrata(language));
  const [randomMethod, setRandomMethod] = useState<RandomisationMethod>("simple");
  const [randomBlockSize, setRandomBlockSize] = useState(4);
  const [randomSeed, setRandomSeed] = useState("STUDY-2026");
  const [flowTemplateKey, setFlowTemplateKey] = useState<FlowTemplateKey>("consort");
  const [flowArmCount, setFlowArmCount] = useState(2);
  const [flowArmLabels, setFlowArmLabels] = useState(() => defaultArmLabels(language));
  const [flowTitle, setFlowTitle] = useState("");
  const [flowCounts, setFlowCounts] = useState<Record<string, string>>(flowTemplates[0].defaultCounts);
  const [flowNotes, setFlowNotes] = useState<Record<string, string>>({});
  const [frameworkTitle, setFrameworkTitle] = useState(() => defaultFrameworkText(language).title);
  const [independentVariables, setIndependentVariables] = useState(() => defaultFrameworkText(language).independent);
  const [dependentVariables, setDependentVariables] = useState(() => defaultFrameworkText(language).dependent);
  const [confoundingVariables, setConfoundingVariables] = useState(() => defaultFrameworkText(language).confounders);
  const [mediatorVariables, setMediatorVariables] = useState("");
  const [moderatorVariables, setModeratorVariables] = useState("");
  const [covariateVariables, setCovariateVariables] = useState("");
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
  const [showZTableModal, setShowZTableModal] = useState(false);
  const [showBugModal, setShowBugModal] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [reportTimestamp, setReportTimestamp] = useState("");
  const [browserDevice, setBrowserDevice] = useState("");
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
  const sampleSizeModes: AppMode[] = ["finder", "calculator", "scenario"];
  const figureModes: AppMode[] = ["flowcharts", "framework"];
  const protocolModes: AppMode[] = ["question", "outcomes", "variables", "eligibility", "bias", "analysis-plan", "ethics", "timeline", "data-plan", "protocol-check"];
  const activeMainMode = sampleSizeModes.includes(mode)
    ? "sample-size"
    : figureModes.includes(mode)
      ? "figures"
      : protocolModes.includes(mode)
        ? "protocol"
        : mode;

  function openMainMode(nextMode: "checklist" | "sample-size" | "randomiser" | "blinding" | "figures" | "protocol") {
    if (nextMode === "sample-size") {
      setMode(sampleSizeModes.includes(mode) ? mode : "finder");
      return;
    }
    if (nextMode === "figures") {
      setMode(figureModes.includes(mode) ? mode : "flowcharts");
      return;
    }
    if (nextMode === "protocol") {
      setMode(protocolModes.includes(mode) ? mode : "question");
      return;
    }
    setMode(nextMode);
  }

  useEffect(() => {
    document.documentElement.lang = language;
    window.localStorage.setItem("studysize-language", language);
  }, [language]);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch(() => undefined);
  }, []);

  useEffect(() => {
    setReportTimestamp(new Date().toISOString());
    setBrowserDevice(window.navigator.userAgent);
  }, []);

  const calculator = calculators.find((item) => item.id === activeId) ?? calculators[0];
  const flowArmNames = useMemo(() => parseFlowArmLabels(flowArmLabels, flowArmCount, language), [flowArmCount, flowArmLabels, language]);
  const baseFlowTemplate = flowTemplateByKey(flowTemplateKey);
  const rawFlowTemplate = useMemo(
    () => armFlowTemplate(baseFlowTemplate, flowArmCount, flowArmNames),
    [baseFlowTemplate, flowArmCount, flowArmNames],
  );
  const flowTemplate = useMemo(() => localiseFlowTemplate(rawFlowTemplate, language), [rawFlowTemplate, language]);
  const flowFigureTitle = flowTitle || flowTemplate.title;
  const rawEffectiveFlowCounts = useMemo(() => ({ ...flowTemplate.defaultCounts, ...flowCounts }), [flowCounts, flowTemplate]);
  const derivedFlowCounts = useMemo(() => deriveFlowCounts(flowTemplate, rawEffectiveFlowCounts), [flowTemplate, rawEffectiveFlowCounts]);
  const effectiveFlowCounts = derivedFlowCounts.counts;
  const effectiveFlowNotes = useMemo(() => ({ ...flowTemplate.defaultNotes, ...flowNotes }), [flowNotes, flowTemplate]);
  const frameworkIndependent = useMemo(() => parseFrameworkVariables(independentVariables, [t("Independent variables", language)]), [independentVariables, language]);
  const frameworkDependent = useMemo(() => parseFrameworkVariables(dependentVariables, [t("Dependent variables", language)]), [dependentVariables, language]);
  const frameworkConfounders = useMemo(() => parseFrameworkVariables(confoundingVariables, []), [confoundingVariables]);
  const frameworkMediators = useMemo(() => parseFrameworkVariables(mediatorVariables, []), [mediatorVariables]);
  const frameworkModerators = useMemo(() => parseFrameworkVariables(moderatorVariables, []), [moderatorVariables]);
  const frameworkCovariates = useMemo(() => parseFrameworkVariables(covariateVariables, []), [covariateVariables]);
  const values = valuesByCalculator[calculator.id] ?? initialValues(calculator);
  const result = useMemo(() => calculator.compute(values), [calculator, values]);
  const activeFormulaLines = formulaLines(calculator.formula);
  const activeFormulaSymbols = formulaSymbolNotes(calculator.id, language);
  const activeFormulaUsesZ = formulaUsesZ(calculator.formula);
  const filtered = calculators.filter((item) =>
    activeCategory === "All" || (activeCategory === "Most used" ? mostUsedCalculatorIds.has(item.id) : item.category === activeCategory),
  );
  const planningAssumptionsText = calculator.variables
    .map((variable) => `${t(variable.label, language)} ${values[variable.key]}${variable.suffix ?? ""}`)
    .join("; ");
  const currentDecisionQuestion = getCurrentDecisionQuestion(decisionAnswers);
  const recommendation = decisionResult(decisionAnswers);
  const randomisedGroups = useMemo(() => parseGroups(randomGroups, language), [randomGroups, language]);
  const randomisationStrata = useMemo(() => parseStrata(randomStrata, language), [randomStrata, language]);
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
  const isUnstratifiedRandomisation =
    randomisationStrata.length === 1 &&
    languageOptions.some((option) => randomisationStrata[0] === defaultRandomStrata(option.code));
  const stratumDescription =
    isUnstratifiedRandomisation
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
          `Randomisasi dilakukan sebelum perekrutan dimulai dengan metode ${randomisationMethodName} ${stratumDescription}. Peserta yang memenuhi kriteria dialokasikan ke ${randomisedGroups.join(" atau ")} mengikuti daftar alokasi yang telah dibuat.`,
          randomMethod === "block"
            ? `Ukuran blok adalah ${effectiveBlockSize}; informasi ini sebaiknya tidak dibuka kepada personel yang melakukan perekrutan agar alokasi berikutnya tidak dapat diprediksi.`
            : "Daftar dibuat sebagai urutan acak seimbang untuk menjaga distribusi alokasi yang sebanding antarkelompok.",
          `Daftar randomisasi memuat ${randomSubjectCount} slot alokasi dan dibuat dengan seed terdokumentasi "${randomSeed || "studysize-studio"}", sehingga proses pembuatan daftar dapat diaudit bila diperlukan.`,
          "Alokasi sebaiknya dibuka hanya setelah kelayakan peserta dipastikan dan informed consent selesai, dengan penyembunyian alokasi dipertahankan sampai saat penetapan kelompok.",
        ].join(" ")
      : language === "nl"
        ? [
            `Randomisatie wordt vóór de start van de inclusie uitgevoerd met ${randomisationMethodName} ${stratumDescription}. Deelnemers die aan de criteria voldoen, worden volgens de gegenereerde allocatiereeks toegewezen aan ${randomisedGroups.join(" of ")}.`,
            randomMethod === "block"
              ? `De blokgrootte is ${effectiveBlockSize}; deze informatie blijft afgeschermd voor personen die deelnemers includeren, zodat toekomstige toewijzingen niet voorspelbaar zijn.`
              : "De reeks wordt gegenereerd als een gebalanceerd gerandomiseerde lijst om een vergelijkbare verdeling over de groepen te ondersteunen.",
            `De randomisatielijst bevat ${randomSubjectCount} allocaties en wordt gegenereerd met de gedocumenteerde seed "${randomSeed || "studysize-studio"}", zodat het genereren van de reeks indien nodig controleerbaar is.`,
            "Toewijzing wordt pas vrijgegeven nadat geschiktheid is bevestigd en informed consent is verkregen; de toewijzing blijft tot dat moment afgeschermd.",
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
        ? `Studi ini menggunakan desain label terbuka karena peserta tidak dibutakan terhadap alokasi intervensi.${blindedRoleSentence} Meskipun demikian, risiko bias seleksi tetap perlu dikendalikan melalui penyembunyian alokasi dengan ${t(concealmentMethodLabels[concealmentMethod], language).toLowerCase()}. Daftar alokasi dipegang oleh ${t(sequenceHolderLabels[sequenceHolder], language).toLowerCase()} dan baru dibuka setelah kelayakan serta informed consent peserta dikonfirmasi.`
        : `Studi ini direncanakan sebagai studi ${t(blindingClassification, language).toLowerCase()}, dengan pembutaan terhadap alokasi intervensi diterapkan pada ${translatedBlindedRoles.join(", ")}. Untuk menurunkan risiko bias seleksi, penyembunyian alokasi dipertahankan menggunakan ${t(concealmentMethodLabels[concealmentMethod], language).toLowerCase()}, dan daftar alokasi dipegang oleh ${t(sequenceHolderLabels[sequenceHolder], language).toLowerCase()} sampai kelayakan serta informed consent peserta dikonfirmasi. Prosedur pembukaan blinding darurat, bila diperlukan, harus ditetapkan sebelumnya dan setiap kejadian harus dicatat dalam berkas penelitian.`
      : language === "nl"
        ? blindingClassification === "Open-label"
          ? `Deze studie wordt uitgevoerd als open-label studie, omdat deelnemers niet worden geblindeerd voor de interventietoewijzing.${blindedRoleSentence} Het risico op selectiebias wordt desondanks beperkt door de toewijzing af te schermen via ${t(concealmentMethodLabels[concealmentMethod], language).toLowerCase()}. De allocatiereeks wordt beheerd door ${t(sequenceHolderLabels[sequenceHolder], language).toLowerCase()} en pas vrijgegeven nadat geschiktheid is bevestigd en informed consent is verkregen.`
          : `Deze studie wordt opgezet als een ${t(blindingClassification, language).toLowerCase()} studie, waarbij ${translatedBlindedRoles.join(", ")} geblindeerd blijven voor de interventietoewijzing. Om selectiebias te beperken, blijft de toewijzing afgeschermd via ${t(concealmentMethodLabels[concealmentMethod], language).toLowerCase()}, en wordt de allocatiereeks beheerd door ${t(sequenceHolderLabels[sequenceHolder], language).toLowerCase()} totdat geschiktheid is bevestigd en informed consent is verkregen. Procedures voor noodontblindering worden vooraf vastgelegd; elke ontblindering wordt in het studiedossier gedocumenteerd.`
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
          `Besar sampel dihitung untuk desain ${t(calculator.title, language).toLowerCase()} dengan bantuan StudySize Studio.`,
          `Perencanaan didasarkan pada parameter berikut: ${planningAssumptionsText}.`,
          `Estimasi ini menggunakan pendekatan ${calculator.formula}. Asumsi utama yang perlu diperhatikan adalah: ${calculator.assumptions.map((item) => t(item, language)).join(" ")}`,
          `Berdasarkan asumsi tersebut, diperlukan minimal ${formatNumber(result.total ?? result.primary)} peserta atau observasi sebelum penyesuaian untuk dropout, data hilang, atau data yang tidak dapat dievaluasi.`,
          `Setelah memperhitungkan kehilangan data yang diperkirakan, besar sampel final yang direncanakan adalah ${formatNumber(result.adjustedTotal)}.`,
        ].join(" ")
      : language === "nl"
        ? [
            `De steekproefgrootte is berekend voor een ${t(calculator.title, language).toLowerCase()} design met StudySize Studio.`,
            `De berekening was gebaseerd op de volgende planningsparameters: ${planningAssumptionsText}.`,
            `De schatting is gebaseerd op de benadering ${calculator.formula}. De belangrijkste aannames voor interpretatie zijn: ${calculator.assumptions.map((item) => t(item, language)).join(" ")}`,
            `Onder deze aannames zijn minimaal ${formatNumber(result.total ?? result.primary)} deelnemers of observaties nodig vóór correctie voor uitval, ontbrekende gegevens of niet-evalueerbare metingen.`,
            `Na correctie voor het verwachte verlies aan bruikbare gegevens bedraagt de geplande finale steekproefgrootte ${formatNumber(result.adjustedTotal)}.`,
          ].join(" ")
      : [
          `Sample size was estimated for a ${calculator.title.toLowerCase()} design using StudySize Studio.`,
          `The calculation was based on the following planning parameters: ${planningAssumptionsText}.`,
          `This estimate uses the ${calculator.formula} approach; the main interpretive assumptions are: ${calculator.assumptions.join(" ")}`,
          `Under these assumptions, a minimum of ${formatNumber(result.total ?? result.primary)} participants or observations is required before accounting for dropout, missing data, or non-evaluable measurements.`,
          `After adjustment for the anticipated loss of usable data, the planned final sample size is ${formatNumber(result.adjustedTotal)}.`,
        ].join(" ");
  const listFromText = (text: string) => text.split(/\n|,/).map((item) => item.trim()).filter(Boolean);
  const formatList = (items: string[]) => {
    if (items.length <= 1) return items[0] ?? "";
    return `${items.slice(0, -1).join(", ")}${language === "id" ? ", dan " : language === "nl" ? " en " : ", and "}${items.at(-1)}`;
  };
  const addMonths = (dateText: string, months: number) => {
    const date = new Date(`${dateText}T00:00:00`);
    if (Number.isNaN(date.getTime())) return dateText;
    date.setMonth(date.getMonth() + months);
    return date.toISOString().slice(0, 10);
  };
  const questionFieldRows: [string, string, (next: string) => void][] =
    questionFramework === "pico"
      ? [
          ["Population", studyPopulation, setStudyPopulation],
          ["Intervention", studyExposure, setStudyExposure],
          ["Comparator", studyComparator, setStudyComparator],
          ["Outcome", studyPrimaryOutcome, setStudyPrimaryOutcome],
          ["Study setting", studySetting, setStudySetting],
        ]
      : questionFramework === "peco"
        ? [
            ["Population", studyPopulation, setStudyPopulation],
            ["Exposure", studyExposure, setStudyExposure],
            ["Comparator/control", studyComparator, setStudyComparator],
            ["Outcome", studyPrimaryOutcome, setStudyPrimaryOutcome],
            ["Study setting", studySetting, setStudySetting],
          ]
        : questionFramework === "pird"
          ? [
              ["Population", studyPopulation, setStudyPopulation],
              ["Index test", studyExposure, setStudyExposure],
              ["Reference standard", studyComparator, setStudyComparator],
              ["Target condition", studyPrimaryOutcome, setStudyPrimaryOutcome],
              ["Study setting", studySetting, setStudySetting],
            ]
          : questionFramework === "pico-qual"
            ? [
                ["Participants", studyPopulation, setStudyPopulation],
                ["Interest / phenomenon", studyExposure, setStudyExposure],
                ["Context", studySetting, setStudySetting],
              ]
            : [
                ["Population", studyPopulation, setStudyPopulation],
                ["Prognostic factor/model", studyExposure, setStudyExposure],
                ["Outcome", studyPrimaryOutcome, setStudyPrimaryOutcome],
                ["Time horizon", studyComparator, setStudyComparator],
                ["Study setting", studySetting, setStudySetting],
              ];
  const questionWording = (() => {
    if (questionFramework === "pico") {
      return language === "id"
        ? `Pada ${studyPopulation} di ${studySetting}, apakah ${studyExposure}, dibandingkan dengan ${studyComparator}, memengaruhi ${studyPrimaryOutcome}?`
        : language === "nl"
          ? `Heeft ${studyExposure}, vergeleken met ${studyComparator}, bij ${studyPopulation} in ${studySetting} invloed op ${studyPrimaryOutcome}?`
          : `Among ${studyPopulation} in ${studySetting}, does ${studyExposure}, compared with ${studyComparator}, affect ${studyPrimaryOutcome}?`;
    }
    if (questionFramework === "peco") {
      return language === "id"
        ? `Pada ${studyPopulation} di ${studySetting}, apakah ${studyExposure}, dibandingkan dengan ${studyComparator}, berhubungan dengan ${studyPrimaryOutcome}?`
        : language === "nl"
          ? `Is ${studyExposure}, vergeleken met ${studyComparator}, bij ${studyPopulation} in ${studySetting} geassocieerd met ${studyPrimaryOutcome}?`
          : `Among ${studyPopulation} in ${studySetting}, is ${studyExposure}, compared with ${studyComparator}, associated with ${studyPrimaryOutcome}?`;
    }
    if (questionFramework === "pird") {
      return language === "id"
        ? `Pada ${studyPopulation} di ${studySetting}, seberapa akurat ${studyExposure} dibandingkan dengan ${studyComparator} untuk mendeteksi ${studyPrimaryOutcome}?`
        : language === "nl"
          ? `Hoe accuraat is ${studyExposure}, vergeleken met ${studyComparator}, voor het vaststellen van ${studyPrimaryOutcome} bij ${studyPopulation} in ${studySetting}?`
          : `Among ${studyPopulation} in ${studySetting}, how accurate is ${studyExposure}, compared with ${studyComparator}, for detecting ${studyPrimaryOutcome}?`;
    }
    if (questionFramework === "pico-qual") {
      return language === "id"
        ? `Bagaimana ${studyPopulation} mengalami atau memaknai ${studyExposure} dalam konteks ${studySetting}?`
        : language === "nl"
          ? `Hoe ervaren of begrijpen ${studyPopulation} ${studyExposure} binnen de context van ${studySetting}?`
          : `How do ${studyPopulation} experience or understand ${studyExposure} within the context of ${studySetting}?`;
    }
    return language === "id"
      ? `Pada ${studyPopulation} di ${studySetting}, apakah ${studyExposure} memprediksi ${studyPrimaryOutcome} dalam ${studyComparator}?`
      : language === "nl"
        ? `Voorspelt ${studyExposure} ${studyPrimaryOutcome} binnen ${studyComparator} bij ${studyPopulation} in ${studySetting}?`
        : `Among ${studyPopulation} in ${studySetting}, does ${studyExposure} predict ${studyPrimaryOutcome} over ${studyComparator}?`;
  })();
  const outcomeWording =
    language === "id"
      ? `Luaran primer penelitian adalah ${outcomeName}, yang didefinisikan sebagai luaran ${outcomeType} dan dinilai pada ${outcomeTimepoint} menggunakan ${outcomeInstrument}. Perbedaan yang dianggap bermakna secara klinis adalah ${outcomeDifference}; definisi ini sebaiknya digunakan secara konsisten dalam protokol, perhitungan besar sampel, dan rencana analisis.`
      : language === "nl"
        ? `De primaire uitkomst is ${outcomeName}, gedefinieerd als een ${outcomeType} uitkomst en gemeten op ${outcomeTimepoint} met ${outcomeInstrument}. Het klinisch relevante verschil is ${outcomeDifference}; deze definitie moet consequent terugkomen in protocol, steekproefgrootteberekening en analyseplan.`
        : `The primary outcome is ${outcomeName}, defined as a ${outcomeType} outcome assessed at ${outcomeTimepoint} using ${outcomeInstrument}. The clinically meaningful difference is ${outcomeDifference}; this definition should be used consistently in the protocol, sample-size calculation, and statistical analysis plan.`;
  const variableRows = listFromText(variableNames).map((name) => [name, variableType, dataSource, codingNotes]);
  const variableDictionaryText = [
    `${t("Data dictionary", language)}:`,
    ...variableRows.map((row) => `${row[0]} | ${row[1]} | ${row[2]} | ${row[3]}`),
  ].join("\n");
  const eligibilityWording =
    language === "id"
      ? `Peserta akan direkrut dari ${recruitmentSetting}. Kriteria inklusi meliputi ${formatList(listFromText(inclusionCriteria))}. Peserta dikeluarkan bila memenuhi kriteria berikut: ${formatList(listFromText(exclusionCriteria))}. Kriteria ini perlu diterapkan secara berurutan dan dicatat dalam log skrining.`
      : language === "nl"
        ? `Deelnemers worden geworven in ${recruitmentSetting}. Inclusiecriteria zijn ${formatList(listFromText(inclusionCriteria))}. Deelnemers worden uitgesloten bij ${formatList(listFromText(exclusionCriteria))}. Deze criteria moeten consequent worden toegepast en vastgelegd in een screeningslog.`
        : `Participants will be recruited from ${recruitmentSetting}. Inclusion criteria are ${formatList(listFromText(inclusionCriteria))}. Participants will be excluded when any of the following criteria are present: ${formatList(listFromText(exclusionCriteria))}. These criteria should be applied consistently and recorded in a screening log.`;
  const biasWording =
    language === "id"
      ? `Risiko bias utama yang diantisipasi adalah ${formatList(listFromText(biasConcerns))}. Untuk mengurangi risiko tersebut, penelitian akan menggunakan ${formatList(listFromText(biasSafeguards))}. Setiap deviasi dari prosedur ini perlu dicatat dan dipertimbangkan saat interpretasi hasil.`
      : language === "nl"
        ? `De belangrijkste verwachte bronnen van bias zijn ${formatList(listFromText(biasConcerns))}. Om deze risico's te beperken gebruikt de studie ${formatList(listFromText(biasSafeguards))}. Afwijkingen van deze procedures moeten worden vastgelegd en meegewogen bij de interpretatie.`
        : `The main anticipated risks of bias are ${formatList(listFromText(biasConcerns))}. To mitigate these risks, the study will use ${formatList(listFromText(biasSafeguards))}. Deviations from these procedures should be documented and considered when interpreting the results.`;
  const sapWording =
    language === "id"
      ? `Analisis primer akan ${primaryAnalysis}. Efek akan dilaporkan sebagai ${effectMeasure}. Bila relevan, model akan disesuaikan untuk ${formatList(listFromText(adjustmentVariables))}. Data hilang akan ditangani dengan pendekatan berikut: ${missingDataApproach}.`
      : language === "nl"
        ? `De primaire analyse zal ${primaryAnalysis}. Het effect wordt gerapporteerd als ${effectMeasure}. Indien relevant wordt gecorrigeerd voor ${formatList(listFromText(adjustmentVariables))}. Ontbrekende data worden behandeld volgens deze aanpak: ${missingDataApproach}.`
        : `The primary analysis will ${primaryAnalysis}. Effects will be reported as ${effectMeasure}. Where appropriate, the model will adjust for ${formatList(listFromText(adjustmentVariables))}. Missing data will be handled as follows: ${missingDataApproach}.`;
  const ethicsWording =
    language === "id"
      ? `Penelitian akan dilakukan setelah persetujuan etik diperoleh. Persetujuan peserta menggunakan ${consentApproach}. Kerahasiaan data dijaga melalui ${confidentialityPlan}. Risiko bagi peserta diperkirakan ${participantRisks}, dan hasil penelitian akan didiseminasikan melalui ${disseminationPlan}.`
      : language === "nl"
        ? `De studie wordt uitgevoerd na goedkeuring door de ethische commissie. Toestemming wordt verkregen via ${consentApproach}. Vertrouwelijkheid wordt gewaarborgd door ${confidentialityPlan}. De risico's voor deelnemers worden ingeschat als ${participantRisks}, en de resultaten worden verspreid via ${disseminationPlan}.`
        : `The study will be conducted after ethics approval has been obtained. Participant consent will use ${consentApproach}. Confidentiality will be protected through ${confidentialityPlan}. Participant risks are expected to be ${participantRisks}, and findings will be disseminated through ${disseminationPlan}.`;
  const timelineRows = [
    [t("Protocol finalisation", language), timelineStart],
    [t("Ethics approval target", language), addMonths(timelineStart, ethicsMonths)],
    [t("Recruitment completion target", language), addMonths(timelineStart, ethicsMonths + recruitmentMonths)],
    [t("Analysis and writing target", language), addMonths(timelineStart, ethicsMonths + recruitmentMonths + analysisMonths)],
  ];
  const timelineText = timelineRows.map(([label, value]) => `${label}: ${value}`).join("\n");
  const dataPlanWording =
    language === "id"
      ? `Data penelitian akan disimpan di ${storageLocation}. Akses dibatasi melalui ${accessControl}. Mutu data dipantau dengan ${qualityChecks}. Data akan disimpan selama ${retentionPeriod}, sesuai kebijakan institusi dan persetujuan etik.`
      : language === "nl"
        ? `Studiedata worden opgeslagen in ${storageLocation}. Toegang wordt beperkt via ${accessControl}. Datakwaliteit wordt bewaakt met ${qualityChecks}. Data worden bewaard gedurende ${retentionPeriod}, conform institutioneel beleid en ethische goedkeuring.`
        : `Study data will be stored in ${storageLocation}. Access will be restricted through ${accessControl}. Data quality will be monitored using ${qualityChecks}. Data will be retained for ${retentionPeriod}, consistent with institutional policy and ethics approval.`;
  const protocolCheckItems = [
    ["question", "Study question and objective"],
    ["outcomes", "Primary and secondary outcomes"],
    ["eligibility", "Eligibility criteria and recruitment setting"],
    ["sampleSize", "Sample-size rationale"],
    ["analysis", "Statistical analysis plan"],
    ["ethics", "Ethics, consent, and confidentiality"],
    ["data", "Data management plan"],
    ["reporting", "Reporting checklist selected"],
  ];
  const protocolCompletion = Math.round(
    (protocolCheckItems.filter(([key]) => protocolChecks[key]).length / protocolCheckItems.length) * 100,
  );
  const protocolNextStep =
    protocolCompletion === 100
      ? language === "id"
        ? "Protokol tampak siap untuk telaah pembimbing, komite etik, atau peer review; lakukan satu pemeriksaan akhir untuk memastikan desain, besar sampel, luaran, dan analisis saling konsisten."
        : language === "nl"
          ? "Het protocol lijkt klaar voor beoordeling door supervisor, ethische commissie of peer review; voer nog één consistentiecontrole uit tussen design, steekproefgrootte, uitkomsten en analyse."
          : "The protocol appears ready for supervisor, ethics, or peer review; perform one final consistency check across design, sample size, outcomes, and analysis."
      : language === "id"
        ? `Prioritaskan bagian yang belum lengkap: ${protocolCheckItems.filter(([key]) => !protocolChecks[key]).map(([, label]) => t(label, language)).join(", ")}.`
        : language === "nl"
          ? `Geef prioriteit aan de onvolledige onderdelen: ${protocolCheckItems.filter(([key]) => !protocolChecks[key]).map(([, label]) => t(label, language)).join(", ")}.`
          : `Prioritise the incomplete sections: ${protocolCheckItems.filter(([key]) => !protocolChecks[key]).map(([, label]) => label).join(", ")}.`;
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
      ...calculator.references.map((item) => `Reference: ${formatCalculatorReference(item, referenceFormat)}`),
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

  function randomiseSequence() {
    setRandomSeed(makeRandomSeed());
    setStatus(t("New randomisation sequence generated", language));
  }

  function selectFlowTemplate(key: FlowTemplateKey) {
    const nextTemplate = flowTemplateByKey(key);
    const nextFlowTemplate = armFlowTemplate(nextTemplate, flowArmCount, flowArmNames);
    setFlowTemplateKey(key);
    setFlowTitle("");
    setFlowCounts(nextFlowTemplate.defaultCounts);
    setFlowNotes({});
  }

  function updateFlowCount(nodeId: string, value: string) {
    setFlowCounts((current) => ({ ...current, [nodeId]: value }));
  }

  function updateFlowNote(nodeId: string, value: string) {
    setFlowNotes((current) => ({ ...current, [nodeId]: value }));
  }

  function downloadFlowChartPng() {
    const svg = buildFlowChartSvg(flowTemplate, flowFigureTitle, effectiveFlowCounts, effectiveFlowNotes);
    const svgBlob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
    const svgUrl = URL.createObjectURL(svgBlob);
    const image = new Image();

    image.onload = () => {
      const scale = 2;
      const canvas = document.createElement("canvas");
      canvas.width = image.width * scale;
      canvas.height = image.height * scale;
      const context = canvas.getContext("2d");
      if (!context) return;
      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(svgUrl);
      const pngUrl = canvas.toDataURL("image/png");
      const anchor = document.createElement("a");
      anchor.href = pngUrl;
      anchor.download = `${flowTemplate.key}-flow-chart.png`;
      anchor.click();
      setStatus(t("Flow chart PNG downloaded", language));
    };

    image.src = svgUrl;
  }

  function downloadFrameworkPng() {
    const svg = buildFrameworkSvg(
      frameworkTitle,
      frameworkIndependent,
      frameworkDependent,
      frameworkConfounders,
      frameworkMediators,
      frameworkModerators,
      frameworkCovariates,
      language,
    );
    const svgBlob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
    const svgUrl = URL.createObjectURL(svgBlob);
    const image = new Image();

    image.onload = () => {
      const scale = 2;
      const canvas = document.createElement("canvas");
      canvas.width = image.width * scale;
      canvas.height = image.height * scale;
      const context = canvas.getContext("2d");
      if (!context) return;
      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(svgUrl);
      const pngUrl = canvas.toDataURL("image/png");
      const anchor = document.createElement("a");
      anchor.href = pngUrl;
      anchor.download = "conceptual-framework.png";
      anchor.click();
      setStatus(t("Framework PNG downloaded", language));
    };

    image.src = svgUrl;
  }

  function answerDecision(questionId: string, value: string) {
    const index = decisionOrder.indexOf(questionId);
    setDecisionHandoff("");
    setDecisionAnswers((current) => {
      const next: DecisionAnswers = {};
      decisionOrder.slice(0, index).forEach((id) => {
        if (current[id]) next[id] = current[id];
      });
      next[questionId] = value;
      return next;
    });
  }

  function useQuestionForDecisionTree() {
    const seededAnswers: Record<QuestionFramework, DecisionAnswers> = {
      pico: { goal: "compare" },
      peco: { goal: "association" },
      pird: { goal: "diagnostic" },
      "pico-qual": { goal: "compare", comparisonOutcome: "binary", comparisonStructure: "paired", complexity: "yes" },
      prognostic: { goal: "modeling" },
    };
    const frameworkLabel = questionFrameworkOptions.find((option) => option.value === questionFramework)?.label ?? "research question";
    setDecisionAnswers(seededAnswers[questionFramework]);
    setDecisionHandoff(
      questionFramework === "pico-qual"
        ? t("The qualitative PICo framework does not map directly to a standard quantitative sample-size formula. The tree will show where statistical review or qualitative sampling justification is needed.", language)
        : `${t("Started from your research question", language)} (${t(frameworkLabel, language)}). ${t("Please confirm the remaining design details before choosing a formula.", language)}`,
    );
    setMode("finder");
  }

  function goBackDecision() {
    const answered = decisionOrder.filter((id) => decisionAnswers[id]);
    const last = answered.at(-1);
    if (!last) return;
    setDecisionHandoff("");
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

  function formReportText(form: HTMLFormElement, title: string) {
    const fields = Array.from(form.querySelectorAll("input, textarea, select")) as Array<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>;
    const lines = [
      title,
      `Generated: ${new Date().toISOString()}`,
      `StudySize Studio version: ${appVersion}`,
      "",
    ];

    fields.forEach((field) => {
      if (!field.name) return;
      const label = field.getAttribute("data-label") ?? field.name;
      let value = "";

      if (field instanceof HTMLInputElement && field.type === "checkbox") {
        value = field.checked ? "Confirmed" : "Not confirmed";
      } else if (field instanceof HTMLInputElement && field.type === "file") {
        value = Array.from(field.files ?? []).map((file) => `${file.name} (${file.size} bytes)`).join(", ");
      } else {
        value = field.value.trim();
      }

      lines.push(`${label}: ${value || "Not provided"}`);
    });

    return lines.join("\n");
  }

  function downloadTextFile(filename: string, text: string) {
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  function copyFormReport(event: { currentTarget: HTMLButtonElement }, title: string, message: string) {
    const form = event.currentTarget.form;
    if (!form) return;
    if (!form.reportValidity()) return;
    copyGeneratedWording(formReportText(form, t(title, language)), message);
  }

  function downloadFormReport(event: { currentTarget: HTMLButtonElement }, title: string, filename: string) {
    const form = event.currentTarget.form;
    if (!form) return;
    if (!form.reportValidity()) return;
    downloadTextFile(filename, formReportText(form, t(title, language)));
  }

  function downloadProtocolTemplate() {
    const lines = [
      "Study question:",
      questionWording,
      "",
      "Primary outcome:",
      outcomeWording,
      "",
      "Eligibility:",
      eligibilityWording,
      "",
      "Bias mitigation:",
      biasWording,
      "",
      "Statistical analysis plan:",
      sapWording,
      "",
      "Ethics:",
      ethicsWording,
      "",
      "Ethics and registration workflow:",
      ...ethicsWorkflowSteps.map((step, index) => `${index + 1}. ${step}`),
      "",
      "Registry resources:",
      ...ethicsWorkflowLinks.map(([label, href]) => `${label}: ${href}`),
      "",
      "Timeline:",
      timelineText,
      "",
      "Data management:",
      dataPlanWording,
      "",
      "Protocol transparency:",
      "For transparency, consider publishing the full protocol or storing it in a durable repository before data collection begins.",
      "",
      "Variable dictionary:",
      ...tableLines(["Variable", "Type", "Source", "Coding"], variableRows, [20, 22, 28, 30]),
    ];
    const url = URL.createObjectURL(makeTablePdf("StudySize Studio Protocol Builder", lines));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "studysize-protocol-builder-template.pdf";
    anchor.click();
    URL.revokeObjectURL(url);
    setStatus(t("PDF downloaded", language));
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

  function changeLanguage(nextLanguage: Language) {
    if (nextLanguage === language) return;

    const groupDefaults = languageOptions.map((option) => defaultRandomGroups(option.code));
    const strataDefaults = languageOptions.map((option) => defaultRandomStrata(option.code));
    const armDefaults = languageOptions.map((option) => defaultArmLabels(option.code));
    const frameworkDefaults = languageOptions.map((option) => defaultFrameworkText(option.code));
    const nextFrameworkDefaults = defaultFrameworkText(nextLanguage);

    setLanguage(nextLanguage);
    setRandomGroups((current) => (groupDefaults.includes(current) ? defaultRandomGroups(nextLanguage) : current));
    setRandomStrata((current) => (strataDefaults.includes(current) ? defaultRandomStrata(nextLanguage) : current));
    setFlowArmLabels((current) => (armDefaults.includes(current) ? defaultArmLabels(nextLanguage) : current));
    setFrameworkTitle((current) => (frameworkDefaults.some((defaults) => defaults.title === current) ? nextFrameworkDefaults.title : current));
    setIndependentVariables((current) => (frameworkDefaults.some((defaults) => defaults.independent === current) ? nextFrameworkDefaults.independent : current));
    setDependentVariables((current) => (frameworkDefaults.some((defaults) => defaults.dependent === current) ? nextFrameworkDefaults.dependent : current));
    setConfoundingVariables((current) => (frameworkDefaults.some((defaults) => defaults.confounders === current) ? nextFrameworkDefaults.confounders : current));
  }

  return (
    <main className="app-shell">
      <div className="top-right-tools">
        <div className="language-switcher" aria-label={t("Language selector", language)}>
          {languageOptions.map((option) => (
            <button
              aria-label={option.aria}
              className={language === option.code ? "active" : ""}
              key={option.code}
              type="button"
              onClick={() => changeLanguage(option.code)}
              title={option.label}
            >
              <span aria-hidden="true">{option.flag}</span>
            </button>
          ))}
        </div>
        <div className="beta-actions" aria-label="Beta testing actions">
          <button type="button" onClick={() => setShowBugModal(true)}>
            {t("Report Bug", language)}
          </button>
          <button type="button" onClick={() => setShowFeedbackModal(true)}>
            {t("Beta Feedback", language)}
          </button>
        </div>
      </div>
      <section className="masthead" aria-labelledby="app-title">
        <div className="masthead-brand">
          <img src="/studysize-logo.png" alt="" aria-hidden="true" className="masthead-logo" />
          <div>
            <p className="eyebrow">{t("Your one-stop solution for medical research", language)}</p>
            <h1 id="app-title">StudySize Studio</h1>
            <button className="citation-button" type="button" onClick={() => setShowCitationModal(true)}>
              {t("How to cite us", language)}
            </button>
          </div>
        </div>
      </section>

      <nav className="mode-tabs" aria-label={t("Main app modes", language)}>
        <button className={activeMainMode === "checklist" ? "active" : ""} type="button" onClick={() => openMainMode("checklist")}>
          {t("Study Design", language)}
        </button>
        <button className={activeMainMode === "sample-size" ? "active" : ""} type="button" onClick={() => openMainMode("sample-size")}>
          {t("Sample Size", language)}
        </button>
        <button className={activeMainMode === "randomiser" ? "active" : ""} type="button" onClick={() => openMainMode("randomiser")}>
          {t("Randomisation", language)}
        </button>
        <button className={activeMainMode === "blinding" ? "active" : ""} type="button" onClick={() => openMainMode("blinding")}>
          {t("Blinding", language)}
        </button>
        <button className={activeMainMode === "figures" ? "active" : ""} type="button" onClick={() => openMainMode("figures")}>
          {t("Figure Generator", language)}
        </button>
        <button className={activeMainMode === "protocol" ? "active" : ""} type="button" onClick={() => openMainMode("protocol")}>
          {t("Protocol Builder", language)}
        </button>
      </nav>

      {activeMainMode === "sample-size" && (
        <nav className="mode-tabs sub-mode-tabs" aria-label={t("Sample Size", language)}>
          <button className={mode === "finder" ? "active" : ""} type="button" onClick={() => setMode("finder")}>
            {t("Find my calculator", language)}
          </button>
          <button className={mode === "calculator" ? "active" : ""} type="button" onClick={() => setMode("calculator")}>
            {t("Calculator catalog", language)}
          </button>
          <button className={mode === "scenario" ? "active" : ""} type="button" onClick={() => setMode("scenario")}>
            {t("Scenario Comparison", language)}
          </button>
        </nav>
      )}

      {activeMainMode === "protocol" && (
        <nav className="mode-tabs sub-mode-tabs protocol-sub-tabs" aria-label={t("Protocol Builder", language)}>
          {[
            ["question", "Study Question"],
            ["outcomes", "Outcomes"],
            ["variables", "Variables"],
            ["eligibility", "Eligibility"],
            ["bias", "Bias Planner"],
            ["analysis-plan", "Analysis Plan"],
            ["ethics", "Ethics"],
            ["timeline", "Timeline"],
            ["data-plan", "Data Plan"],
            ["protocol-check", "Protocol Check"],
          ].map(([nextMode, label]) => (
            <button className={mode === nextMode ? "active" : ""} key={nextMode} type="button" onClick={() => setMode(nextMode as AppMode)}>
              {t(label, language)}
            </button>
          ))}
        </nav>
      )}

      {activeMainMode === "figures" && (
        <nav className="mode-tabs sub-mode-tabs" aria-label={t("Figure Generator", language)}>
          <button className={mode === "flowcharts" ? "active" : ""} type="button" onClick={() => setMode("flowcharts")}>
            {t("Reporting flowcharts", language)}
          </button>
          <button className={mode === "framework" ? "active" : ""} type="button" onClick={() => setMode("framework")}>
            {t("Conceptual Framework", language)}
          </button>
        </nav>
      )}

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
                <h2 id="finder-title">{t("Find my study size calculator", language)}</h2>
                <p>
                  {t("Answer a few study-design questions and the app will suggest the closest calculator, explain why, and flag when statistical review is important.", language)}
                </p>
              </div>
              <div className="actions">
                <button type="button" onClick={goBackDecision} disabled={decisionPath.length === 0}>
                  {t("Back", language)}
                </button>
                <button type="button" onClick={() => {
                  setDecisionAnswers({});
                  setDecisionHandoff("");
                }}>
                  {t("Reset", language)}
                </button>
              </div>
            </div>

            <div className="decision-body">
              <div className="decision-card">
                {decisionHandoff && (
                  <div className="handoff-note" role="status">
                    {decisionHandoff}
                  </div>
                )}
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
        ) : protocolModes.includes(mode) ? (
          <section className="protocol-panel" aria-labelledby="protocol-builder-title">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">{t("Protocol preparation", language)}</p>
                <h2 id="protocol-builder-title">{t("Protocol Builder", language)}</h2>
                <p>{t("Build the core protocol elements before sample-size calculation, randomisation, reporting, and figures.", language)}</p>
              </div>
              <div className="actions">
                <button type="button" onClick={downloadProtocolTemplate}>{t("Download template", language)}</button>
              </div>
            </div>

            {mode === "question" && (
              <div className="protocol-grid">
                <section className="protocol-controls" aria-label={t("Research question builder", language)}>
                  <div className="protocol-intro">
                    <span>{t("Study Question", language)}</span>
                    <h3>{t("Research question builder", language)}</h3>
                    <p>{t("Choose the framework that best matches the study design before writing the question.", language)}</p>
                  </div>
                  <label className="control compact-control">
                    <span>
                      <strong>{t("Question framework", language)}</strong>
                      <small>{t(questionFrameworkOptions.find((option) => option.value === questionFramework)?.description ?? "", language)}</small>
                    </span>
                    <select
                      aria-label={t("Question framework", language)}
                      value={questionFramework}
                      onChange={(event) => setQuestionFramework(event.target.value as QuestionFramework)}
                    >
                      {questionFrameworkOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {t(option.label, language)}
                        </option>
                      ))}
                    </select>
                  </label>
                  {questionFieldRows.map(([label, value, setter]) => (
                    <label className="control compact-control" key={label as string}>
                      <strong>{t(label as string, language)}</strong>
                      <input type="text" value={value} onChange={(event) => setter(event.target.value)} />
                    </label>
                  ))}
                </section>
                <aside className="protocol-output">
                  <span>{t("Draft question", language)}</span>
                  <p>{questionWording}</p>
                  <small className="protocol-disclaimer">
                    {t("This generated question is only a recommendation; the concept, scope, and wording may still need revision with supervisors, statisticians, or content experts.", language)}
                  </small>
                  <div className="copy-actions">
                    <button type="button" onClick={() => copyGeneratedWording(questionWording, "Protocol wording copied")}>{t("Copy question", language)}</button>
                    <button type="button" onClick={useQuestionForDecisionTree}>{t("Use for sample size decision tree", language)}</button>
                  </div>
                </aside>
              </div>
            )}

            {mode === "outcomes" && (
              <div className="protocol-grid">
                <section className="protocol-controls">
                  <div className="protocol-intro">
                    <span>{t("Outcomes", language)}</span>
                    <h3>{t("Primary outcome planner", language)}</h3>
                    <p>{t("Define the endpoint in operational terms before choosing a calculator or statistical test.", language)}</p>
                  </div>
                  {[
                    ["Outcome name", outcomeName, setOutcomeName],
                    ["Outcome type", outcomeType, setOutcomeType],
                    ["Measurement time point", outcomeTimepoint, setOutcomeTimepoint],
                    ["Measurement instrument", outcomeInstrument, setOutcomeInstrument],
                    ["Clinically meaningful difference", outcomeDifference, setOutcomeDifference],
                  ].map(([label, value, setter]) => (
                    <label className="control compact-control" key={label as string}>
                      <strong>{t(label as string, language)}</strong>
                      <input type="text" value={value as string} onChange={(event) => (setter as (next: string) => void)(event.target.value)} />
                    </label>
                  ))}
                </section>
                <aside className="protocol-output">
                  <span>{t("Outcome statement", language)}</span>
                  <p>{outcomeWording}</p>
                  <button type="button" onClick={() => copyGeneratedWording(outcomeWording, "Protocol wording copied")}>{t("Copy section", language)}</button>
                </aside>
              </div>
            )}

            {mode === "variables" && (
              <div className="protocol-grid">
                <section className="protocol-controls">
                  <div className="protocol-intro">
                    <span>{t("Variables", language)}</span>
                    <h3>{t("Variable dictionary", language)}</h3>
                    <p>{t("Create a clean data-collection map with variable names, types, sources, and coding notes.", language)}</p>
                  </div>
                  <label className="control compact-control">
                    <strong>{t("Variable names", language)}</strong>
                    <textarea rows={6} value={variableNames} onChange={(event) => setVariableNames(event.target.value)} />
                  </label>
                  {[
                    ["Variable type", variableType, setVariableType],
                    ["Data source", dataSource, setDataSource],
                    ["Coding notes", codingNotes, setCodingNotes],
                  ].map(([label, value, setter]) => (
                    <label className="control compact-control" key={label as string}>
                      <strong>{t(label as string, language)}</strong>
                      <input type="text" value={value as string} onChange={(event) => (setter as (next: string) => void)(event.target.value)} />
                    </label>
                  ))}
                </section>
                <aside className="protocol-output">
                  <span>{t("Data dictionary", language)}</span>
                  <div className="mini-table" role="table">
                    {variableRows.map(([name, type, source]) => (
                      <div key={name} role="row">
                        <strong>{name}</strong>
                        <span>{type}</span>
                        <small>{source}</small>
                      </div>
                    ))}
                  </div>
                  <button type="button" onClick={() => copyGeneratedWording(variableDictionaryText, "Protocol wording copied")}>{t("Copy section", language)}</button>
                </aside>
              </div>
            )}

            {mode === "eligibility" && (
              <div className="protocol-grid">
                <section className="protocol-controls">
                  <div className="protocol-intro">
                    <span>{t("Eligibility", language)}</span>
                    <h3>{t("Eligibility criteria builder", language)}</h3>
                    <p>{t("Separate inclusion and exclusion criteria so screening decisions are reproducible.", language)}</p>
                  </div>
                  <label className="control compact-control">
                    <strong>{t("Inclusion criteria", language)}</strong>
                    <textarea rows={5} value={inclusionCriteria} onChange={(event) => setInclusionCriteria(event.target.value)} />
                  </label>
                  <label className="control compact-control">
                    <strong>{t("Exclusion criteria", language)}</strong>
                    <textarea rows={5} value={exclusionCriteria} onChange={(event) => setExclusionCriteria(event.target.value)} />
                  </label>
                  <label className="control compact-control">
                    <strong>{t("Recruitment setting", language)}</strong>
                    <input type="text" value={recruitmentSetting} onChange={(event) => setRecruitmentSetting(event.target.value)} />
                  </label>
                </section>
                <aside className="protocol-output">
                  <span>{t("Screening statement", language)}</span>
                  <p>{eligibilityWording}</p>
                  <button type="button" onClick={() => copyGeneratedWording(eligibilityWording, "Protocol wording copied")}>{t("Copy section", language)}</button>
                </aside>
              </div>
            )}

            {mode === "bias" && (
              <div className="protocol-grid">
                <section className="protocol-controls">
                  <div className="protocol-intro">
                    <span>{t("Bias Planner", language)}</span>
                    <h3>{t("Bias risk planner", language)}</h3>
                    <p>{t("Plan practical safeguards for selection, measurement, confounding, attrition, and reporting bias.", language)}</p>
                  </div>
                  <label className="control compact-control">
                    <strong>{t("Main bias concerns", language)}</strong>
                    <textarea rows={6} value={biasConcerns} onChange={(event) => setBiasConcerns(event.target.value)} />
                  </label>
                  <label className="control compact-control">
                    <strong>{t("Planned safeguards", language)}</strong>
                    <textarea rows={6} value={biasSafeguards} onChange={(event) => setBiasSafeguards(event.target.value)} />
                  </label>
                </section>
                <aside className="protocol-output">
                  <span>{t("Bias mitigation statement", language)}</span>
                  <p>{biasWording}</p>
                  <button type="button" onClick={() => copyGeneratedWording(biasWording, "Protocol wording copied")}>{t("Copy section", language)}</button>
                </aside>
              </div>
            )}

            {mode === "analysis-plan" && (
              <div className="protocol-grid">
                <section className="protocol-controls">
                  <div className="protocol-intro">
                    <span>{t("Analysis Plan", language)}</span>
                    <h3>{t("Statistical analysis plan builder", language)}</h3>
                    <p>{t("Draft a concise SAP paragraph linked to the primary outcome and adjustment set.", language)}</p>
                  </div>
                  {[
                    ["Primary analysis", primaryAnalysis, setPrimaryAnalysis],
                    ["Effect measure", effectMeasure, setEffectMeasure],
                    ["Adjustment variables", adjustmentVariables, setAdjustmentVariables],
                    ["Missing-data approach", missingDataApproach, setMissingDataApproach],
                  ].map(([label, value, setter]) => (
                    <label className="control compact-control" key={label as string}>
                      <strong>{t(label as string, language)}</strong>
                      {label === "Adjustment variables" ? (
                        <textarea rows={5} value={value as string} onChange={(event) => (setter as (next: string) => void)(event.target.value)} />
                      ) : (
                        <input type="text" value={value as string} onChange={(event) => (setter as (next: string) => void)(event.target.value)} />
                      )}
                    </label>
                  ))}
                </section>
                <aside className="protocol-output">
                  <span>{t("SAP wording", language)}</span>
                  <p>{sapWording}</p>
                  <button type="button" onClick={() => copyGeneratedWording(sapWording, "Protocol wording copied")}>{t("Copy section", language)}</button>
                </aside>
              </div>
            )}

            {mode === "ethics" && (
              <div className="protocol-grid">
                <section className="protocol-controls">
                  <div className="protocol-intro">
                    <span>{t("Ethics", language)}</span>
                    <h3>{t("Ethics and consent helper", language)}</h3>
                    <p>{t("Prepare ethics-facing language for consent, confidentiality, risks, and dissemination.", language)}</p>
                  </div>
                  {[
                    ["Consent approach", consentApproach, setConsentApproach],
                    ["Confidentiality plan", confidentialityPlan, setConfidentialityPlan],
                    ["Participant risks", participantRisks, setParticipantRisks],
                    ["Dissemination plan", disseminationPlan, setDisseminationPlan],
                  ].map(([label, value, setter]) => (
                    <label className="control compact-control" key={label as string}>
                      <strong>{t(label as string, language)}</strong>
                      <input type="text" value={value as string} onChange={(event) => (setter as (next: string) => void)(event.target.value)} />
                    </label>
                  ))}
                </section>
                <aside className="protocol-output">
                  <span>{t("Ethics wording", language)}</span>
                  <p>{ethicsWording}</p>
                  <button type="button" onClick={() => copyGeneratedWording(ethicsWording, "Protocol wording copied")}>{t("Copy section", language)}</button>
                </aside>
                <section className="protocol-wide-card" aria-label={t("Ethics and registration workflow", language)}>
                  <div>
                    <span>{t("Ethics and registration workflow", language)}</span>
                    <h3>{t("Registry resources", language)}</h3>
                  </div>
                  <ol>
                    {ethicsWorkflowSteps.map((step) => <li key={step}>{t(step, language)}</li>)}
                  </ol>
                  <div className="registry-links">
                    {ethicsWorkflowLinks.map(([label, href]) => (
                      <a className="resource-button" href={href} key={label} target="_blank" rel="noreferrer">
                        {t(label, language)}
                      </a>
                    ))}
                  </div>
                </section>
              </div>
            )}

            {mode === "timeline" && (
              <div className="protocol-grid">
                <section className="protocol-controls">
                  <div className="protocol-intro">
                    <span>{t("Timeline", language)}</span>
                    <h3>{t("Study timeline planner", language)}</h3>
                    <p>{t("Turn target dates into a simple milestone plan for protocol, approval, recruitment, analysis, and reporting.", language)}</p>
                  </div>
                  <label className="control compact-control">
                    <strong>{t("Start date", language)}</strong>
                    <input type="date" value={timelineStart} onChange={(event) => setTimelineStart(event.target.value)} />
                  </label>
                  {[
                    ["Months for ethics approval", ethicsMonths, setEthicsMonths],
                    ["Months for recruitment", recruitmentMonths, setRecruitmentMonths],
                    ["Months for analysis and writing", analysisMonths, setAnalysisMonths],
                  ].map(([label, value, setter]) => (
                    <label className="control compact-control" key={label as string}>
                      <strong>{t(label as string, language)}</strong>
                      <div className="input-row">
                        <input type="range" min={1} max={36} step={1} value={value as number} onChange={(event) => (setter as (next: number) => void)(Number(event.target.value))} />
                        <div className="number-wrap">
                          <input type="number" min={1} max={36} step={1} value={value as number} onChange={(event) => (setter as (next: number) => void)(Number(event.target.value))} />
                        </div>
                      </div>
                    </label>
                  ))}
                </section>
                <aside className="protocol-output">
                  <span>{t("Milestone plan", language)}</span>
                  <div className="mini-table" role="table">
                    {timelineRows.map(([label, value]) => (
                      <div key={label} role="row">
                        <strong>{label}</strong>
                        <span>{value}</span>
                      </div>
                    ))}
                  </div>
                  <button type="button" onClick={() => copyGeneratedWording(timelineText, "Protocol wording copied")}>{t("Copy section", language)}</button>
                </aside>
              </div>
            )}

            {mode === "data-plan" && (
              <div className="protocol-grid">
                <section className="protocol-controls">
                  <div className="protocol-intro">
                    <span>{t("Data Plan", language)}</span>
                    <h3>{t("Data management plan helper", language)}</h3>
                    <p>{t("Define storage, access, quality checks, backup, and retention before data collection starts.", language)}</p>
                  </div>
                  <PresetField label="Storage location" value={storageLocation} options={dataPlanPresets.storageLocation} language={language} onChange={setStorageLocation} />
                  <PresetField label="Access control" value={accessControl} options={dataPlanPresets.accessControl} language={language} onChange={setAccessControl} />
                  <PresetField label="Quality checks" value={qualityChecks} options={dataPlanPresets.qualityChecks} language={language} onChange={setQualityChecks} />
                  <PresetField label="Retention period" value={retentionPeriod} options={dataPlanPresets.retentionPeriod} language={language} onChange={setRetentionPeriod} />
                </section>
                <aside className="protocol-output">
                  <span>{t("Data management wording", language)}</span>
                  <p>{dataPlanWording}</p>
                  <div className="protocol-note">
                    <strong>{t("Protocol transparency note", language)}</strong>
                    <small>{t("For transparency, consider publishing the full protocol or storing it in a durable repository before data collection begins.", language)}</small>
                  </div>
                  <button type="button" onClick={() => copyGeneratedWording(dataPlanWording, "Protocol wording copied")}>{t("Copy section", language)}</button>
                </aside>
              </div>
            )}

            {mode === "protocol-check" && (
              <div className="protocol-grid">
                <section className="protocol-controls">
                  <div className="protocol-intro">
                    <span>{t("Protocol Check", language)}</span>
                    <h3>{t("Protocol completeness checker", language)}</h3>
                    <p>{t("Tick completed sections to identify gaps before supervisor, ethics, or grant review.", language)}</p>
                  </div>
                  <div className="checklist-controls">
                    {protocolCheckItems.map(([key, label]) => (
                      <label key={key}>
                        <input
                          type="checkbox"
                          checked={Boolean(protocolChecks[key])}
                          onChange={(event) => setProtocolChecks((current) => ({ ...current, [key]: event.target.checked }))}
                        />
                        <span>{t(label, language)}</span>
                      </label>
                    ))}
                  </div>
                </section>
                <aside className="protocol-output">
                  <span>{t("Completeness", language)}</span>
                  <strong className="completion-score">{protocolCompletion}%</strong>
                  <small>{t("Recommended next step", language)}</small>
                  <p>{protocolNextStep}</p>
                  <button type="button" onClick={() => copyGeneratedWording(`${protocolCompletion}%\n${protocolNextStep}`, "Protocol wording copied")}>{t("Copy section", language)}</button>
                </aside>
              </div>
            )}
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
                <button type="button" onClick={randomiseSequence}>{t("Randomise", language)}</button>
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
                    <option value="simple">{t("Simple balanced", language)}</option>
                    <option value="block">{t("Permuted block", language)}</option>
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
        ) : mode === "flowcharts" ? (
          <section className="flowcharts-panel" aria-labelledby="flowcharts-title">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">{t("Figure guidance", language)}</p>
                <h2 id="flowcharts-title">{t("Flow chart builder", language)}</h2>
                <p>
                  {t("Create publication-ready participant and review flow charts from structured counts, exclusion reasons, and reporting-guideline templates.", language)}
                </p>
              </div>
              <div className="actions">
                <a className="subtle-link-button" href={flowChecklistLinks[flowTemplate.key]} target="_blank" rel="noreferrer">
                  {t("Open relevant checklist", language)}
                </a>
                <button type="button" onClick={downloadFlowChartPng}>{t("Download PNG", language)}</button>
              </div>
            </div>

            <div className="flowchart-workbench">
              <section className="flowchart-controls" aria-label={t("Flow chart settings", language)}>
                <label className="control">
                  <span>
                    <strong>{t("Flow chart type", language)}</strong>
                    <small>{t("Template", language)}</small>
                  </span>
                  <select
                    aria-label={t("Template", language)}
                    onChange={(event) => selectFlowTemplate(event.target.value as FlowTemplateKey)}
                    value={flowTemplateKey}
                  >
                    {flowTemplates.map((template) => (
                      <option key={template.key} value={template.key}>{t(template.title, language)}</option>
                    ))}
                  </select>
                </label>

                <label className="control">
                  <span>
                    <strong>{t("Figure title", language)}</strong>
                    <small>{flowTemplate.description}</small>
                  </span>
                  <input
                    aria-label={t("Figure title", language)}
                    onChange={(event) => setFlowTitle(event.target.value)}
                    type="text"
                    value={flowFigureTitle}
                  />
                </label>

                <label className="control">
                  <span>
                    <strong>{t("Number of arms/groups", language)}</strong>
                    <small>{t("Arm conversion is available for CONSORT, STROBE cohort, and generic participant flows. PRISMA, STARD, case-control, and cross-sectional diagrams keep their guideline-specific structure.", language)}</small>
                  </span>
                  <div className="input-row">
                    <input
                      aria-label={t("Number of arms/groups", language)}
                      disabled={!supportsFlowArms(flowTemplateKey)}
                      max={4}
                      min={1}
                      onChange={(event) => setFlowArmCount(Number(event.target.value))}
                      step={1}
                      type="range"
                      value={flowArmCount}
                    />
                    <div className="number-wrap">
                      <input
                        aria-label={t("Number of arms/groups", language)}
                        disabled={!supportsFlowArms(flowTemplateKey)}
                        max={4}
                        min={1}
                        onChange={(event) => setFlowArmCount(Number(event.target.value))}
                        step={1}
                        type="number"
                        value={flowArmCount}
                      />
                    </div>
                  </div>
                </label>

                <label className="control">
                  <span>
                    <strong>{t("Arm/group labels", language)}</strong>
                    <small>{t("Enter one label per line. The app will use the first labels according to the selected number of arms.", language)}</small>
                  </span>
                  <textarea
                    aria-label={t("Arm/group labels", language)}
                    disabled={!supportsFlowArms(flowTemplateKey)}
                    onChange={(event) => setFlowArmLabels(event.target.value)}
                    rows={4}
                    value={flowArmLabels}
                  />
                </label>

                <div className="flowchart-fieldset">
                  <span>{t("Box counts and exclusion reasons", language)}</span>
                  {flowTemplate.nodes.map((node) => {
                    const isDerivedCount = derivedFlowCounts.derivedIds.has(node.id);

                    return (
                      <div className="flowchart-node-input" key={node.id}>
                        <strong>{node.label}</strong>
                        <div className="flowchart-node-grid">
                          <label>
                            <span>n</span>
                            <input
                              aria-label={`${node.label} n`}
                              className={isDerivedCount ? "auto-count" : undefined}
                              inputMode="numeric"
                              onChange={(event) => updateFlowCount(node.id, event.target.value)}
                              readOnly={isDerivedCount}
                              type="text"
                              value={effectiveFlowCounts[node.id] ?? ""}
                            />
                            {isDerivedCount && <small>{t("Auto-calculated from the previous box minus the red-box count.", language)}</small>}
                          </label>
                          <label>
                            <span>{t("Reasons / notes", language)}</span>
                            <textarea
                              aria-label={`${node.label} ${t("Reasons / notes", language)}`}
                              onChange={(event) => updateFlowNote(node.id, event.target.value)}
                              rows={3}
                              value={effectiveFlowNotes[node.id] ?? ""}
                            />
                          </label>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>

              <section className="flowchart-preview-card" aria-label={t("Preview", language)}>
                <div className="allocation-head">
                  <div>
                    <span>{t("Preview", language)}</span>
                    <strong>{flowTemplate.guideline}</strong>
                  </div>
                  <div className="allocation-counts">
                    <span>{flowTemplate.nodes.length} boxes</span>
                  </div>
                </div>
                <div className="flowchart-preview">
                  <FlowChartFigure counts={effectiveFlowCounts} notes={effectiveFlowNotes} template={flowTemplate} title={flowFigureTitle} />
                </div>
                <div className="flowchart-guidance">
                  <p>{t("Enter the exact n for each box. Use the reason field for exclusions, losses, non-eligibility, missing records, or analysis omissions. Review the final figure against the relevant reporting guideline before submission.", language)}</p>
                  <p>{t("Use anonymised aggregate counts only; do not enter identifiable participant information.", language)}</p>
                </div>
              </section>
            </div>
          </section>
        ) : mode === "framework" ? (
          <section className="framework-panel" aria-labelledby="framework-title">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">{t("Figure guidance", language)}</p>
                <h2 id="framework-title">{t("Conceptual framework builder", language)}</h2>
                <p>
                  {t("Translate study variables into a publication-ready conceptual framework figure with directional relationships.", language)}
                </p>
              </div>
              <div className="actions">
                <button type="button" onClick={downloadFrameworkPng}>{t("Download PNG", language)}</button>
              </div>
            </div>

            <div className="framework-workbench">
              <section className="framework-controls" aria-label={t("Framework settings", language)}>
                <label className="control">
                  <span>
                    <strong>{t("Framework title", language)}</strong>
                    <small>{t("Conceptual frameworks are planning figures. Review the direction of each relationship against theory, temporality, and domain evidence before using the figure in a protocol or manuscript.", language)}</small>
                  </span>
                  <input
                    aria-label={t("Framework title", language)}
                    onChange={(event) => setFrameworkTitle(event.target.value)}
                    type="text"
                    value={frameworkTitle}
                  />
                </label>

                <div className="framework-input-grid">
                  <label className="control">
                    <span>
                      <strong>{t("Independent variables", language)}</strong>
                      <small>{t("Enter one variable per line.", language)}</small>
                    </span>
                    <textarea aria-label={t("Independent variables", language)} onChange={(event) => setIndependentVariables(event.target.value)} rows={4} value={independentVariables} />
                  </label>
                  <label className="control">
                    <span>
                      <strong>{t("Dependent variables", language)}</strong>
                      <small>{t("Enter one variable per line.", language)}</small>
                    </span>
                    <textarea aria-label={t("Dependent variables", language)} onChange={(event) => setDependentVariables(event.target.value)} rows={4} value={dependentVariables} />
                  </label>
                  <label className="control">
                    <span>
                      <strong>{t("Confounding variables", language)}</strong>
                      <small>{t("Optional. These are drawn as variables affecting both exposure and outcome.", language)}</small>
                    </span>
                    <textarea aria-label={t("Confounding variables", language)} onChange={(event) => setConfoundingVariables(event.target.value)} rows={4} value={confoundingVariables} />
                  </label>
                  <label className="control">
                    <span>
                      <strong>{t("Mediators", language)}</strong>
                      <small>{t("Optional. These sit on the pathway between exposure and outcome.", language)}</small>
                    </span>
                    <textarea aria-label={t("Mediators", language)} onChange={(event) => setMediatorVariables(event.target.value)} rows={4} value={mediatorVariables} />
                  </label>
                  <label className="control">
                    <span>
                      <strong>{t("Moderators / effect modifiers", language)}</strong>
                      <small>{t("Optional. These modify the strength or direction of the main relationship.", language)}</small>
                    </span>
                    <textarea aria-label={t("Moderators / effect modifiers", language)} onChange={(event) => setModeratorVariables(event.target.value)} rows={4} value={moderatorVariables} />
                  </label>
                  <label className="control">
                    <span>
                      <strong>{t("Covariates / adjustment variables", language)}</strong>
                      <small>{t("Optional. These are shown as variables controlled for in analysis.", language)}</small>
                    </span>
                    <textarea aria-label={t("Covariates / adjustment variables", language)} onChange={(event) => setCovariateVariables(event.target.value)} rows={4} value={covariateVariables} />
                  </label>
                </div>
              </section>

              <section className="framework-preview-card" aria-label={t("Framework preview", language)}>
                <div className="allocation-head">
                  <div>
                    <span>{t("Framework preview", language)}</span>
                    <strong>{t("Conceptual Framework", language)}</strong>
                  </div>
                </div>
                <div className="framework-preview">
                  <FrameworkFigure
                    confoundingVariables={frameworkConfounders}
                    covariateVariables={frameworkCovariates}
                    dependentVariables={frameworkDependent}
                    independentVariables={frameworkIndependent}
                    mediatorVariables={frameworkMediators}
                    moderatorVariables={frameworkModerators}
                    title={frameworkTitle}
                    language={language}
                  />
                </div>
                <div className="flowchart-guidance">
                  <p>{t("Conceptual frameworks are planning figures. Review the direction of each relationship against theory, temporality, and domain evidence before using the figure in a protocol or manuscript.", language)}</p>
                </div>
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
                const formulaNote = formulaVariableNote(calculator.id, variable.key, language);

                return (
                  <label className="control" key={variable.key}>
                    <span>
                      <strong>{t(variable.label, language)}</strong>
                      <small>{t(variable.help, language)}</small>
                      {formulaNote && <small className="formula-variable-note">{formulaNote}</small>}
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
                <div className="formula-lines" aria-label={t("Formula", language)}>
                  {activeFormulaLines.map((line) => (
                    <code className="formula-line" key={line}>{line}</code>
                  ))}
                </div>
                {activeFormulaUsesZ && (
                  <button className="subtle-button z-table-button" type="button" onClick={() => setShowZTableModal(true)}>
                    {t("Open Z value table", language)}
                  </button>
                )}
                {activeFormulaSymbols.length > 0 && (
                  <div className="formula-symbols">
                    <strong>{t("Formula symbols", language)}</strong>
                    <ul>{activeFormulaSymbols.map((item) => <li key={item}>{item}</li>)}</ul>
                  </div>
                )}
              </article>
              <article>
                <h3>{t("Assumptions", language)}</h3>
                <ul>{calculator.assumptions.map((item) => <li key={item}>{t(item, language)}</li>)}</ul>
              </article>
              <article>
                <div className="reference-head">
                  <h3>{t("References", language)}</h3>
                  <div className="reference-toggle" aria-label={t("Reference style", language)}>
                    <button
                      className={referenceFormat === "vancouver" ? "active" : ""}
                      type="button"
                      onClick={() => setReferenceFormat("vancouver")}
                    >
                      {t("Vancouver", language)}
                    </button>
                    <button
                      className={referenceFormat === "harvard" ? "active" : ""}
                      type="button"
                      onClick={() => setReferenceFormat("harvard")}
                    >
                      {t("Harvard", language)}
                    </button>
                  </div>
                </div>
                <ol>{calculator.references.map((item) => <li key={item}>{formatCalculatorReference(item, referenceFormat)}</li>)}</ol>
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

      <footer className="app-footer"><strong>{t("StudySize Studio version 1.43 © Ryalino, 2026.", language)}</strong></footer>

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

      {showBugModal && (
        <div className="modal-backdrop" role="presentation" onClick={() => setShowBugModal(false)}>
          <section
            aria-labelledby="bug-report-title"
            aria-modal="true"
            className="citation-modal feedback-modal"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
          >
            <div className="modal-head">
              <div>
                <p className="eyebrow">{t("Bug report", language)}</p>
                <h2 id="bug-report-title">{t("Report Bug", language)}</h2>
              </div>
              <button aria-label={t("Close", language)} type="button" onClick={() => setShowBugModal(false)}>
                {t("Close", language)}
              </button>
            </div>
            <p className="modal-copy">
              {t("Use this structured form during beta testing. Copy or download the report and send it to the StudySize Studio team. Do not include names, medical record numbers, dates of birth, or other patient-identifiable information.", language)}
            </p>
            <form className="feedback-form">
              <div className="feedback-grid">
                <label>
                  <span>{t("Name (optional)", language)}</span>
                  <input name="name" data-label={t("Name (optional)", language)} />
                </label>
                <label>
                  <span>{t("Email (optional)", language)}</span>
                  <input name="email" data-label={t("Email (optional)", language)} type="email" />
                </label>
                <label>
                  <span>{t("User role", language)}</span>
                  <select name="user-role" data-label={t("User role", language)}>
                    <option>Junior researcher</option>
                    <option>Clinician</option>
                    <option>Statistician / methodologist</option>
                    <option>Supervisor / educator</option>
                    <option>Other</option>
                  </select>
                </label>
                <label>
                  <span>{t("Country / institution type", language)}</span>
                  <input name="country-institution" data-label={t("Country / institution type", language)} />
                </label>
                <label>
                  <span>{t("Page or tool affected", language)}</span>
                  <select name="affected-tool" data-label={t("Page or tool affected", language)}>
                    <option>Study Design</option>
                    <option>Find my study size calculator</option>
                    <option>Calculator catalog</option>
                    <option>Scenario Comparison</option>
                    <option>Randomisation</option>
                    <option>Blinding</option>
                    <option>Figure Generator</option>
                    <option>Protocol Builder</option>
                    <option>Language / mobile layout</option>
                    <option>Other</option>
                  </select>
                </label>
                <label>
                  <span>{t("Severity", language)}</span>
                  <select name="severity" data-label={t("Severity", language)}>
                    <option>Minor wording or display issue</option>
                    <option>Confusing guidance</option>
                    <option>Blocks use of a feature</option>
                    <option>Possible wrong calculation or logic</option>
                  </select>
                </label>
              </div>
              <label>
                <span>{t("What were you trying to do?", language)}</span>
                <textarea name="trying-to-do" data-label={t("What were you trying to do?", language)} rows={3} />
              </label>
              <label>
                <span>{t("What happened?", language)}</span>
                <textarea name="what-happened" data-label={t("What happened?", language)} rows={3} />
              </label>
              <label>
                <span>{t("What did you expect to happen?", language)}</span>
                <textarea name="expected" data-label={t("What did you expect to happen?", language)} rows={3} />
              </label>
              <label>
                <span>{t("Steps to reproduce", language)}</span>
                <textarea name="steps-to-reproduce" data-label={t("Steps to reproduce", language)} rows={4} />
              </label>
              <fieldset className="feedback-fieldset">
                <legend>{t("Calculation-related details", language)}</legend>
                <div className="feedback-grid">
                  <label>
                    <span>{t("Calculator name", language)}</span>
                    <input name="calculator-name" data-label={t("Calculator name", language)} />
                  </label>
                  <label>
                    <span>{t("Input values", language)}</span>
                    <textarea name="input-values" data-label={t("Input values", language)} rows={3} />
                  </label>
                  <label>
                    <span>{t("Output shown", language)}</span>
                    <textarea name="output-shown" data-label={t("Output shown", language)} rows={3} />
                  </label>
                  <label>
                    <span>{t("Expected output or reference", language)}</span>
                    <textarea name="expected-output" data-label={t("Expected output or reference", language)} rows={3} />
                  </label>
                </div>
              </fieldset>
              <div className="feedback-grid">
                <label>
                  <span>{t("Screenshot (optional)", language)}</span>
                  <input name="screenshot" data-label={t("Screenshot (optional)", language)} type="file" accept="image/*,.pdf" />
                </label>
                <label>
                  <span>{t("Browser and device", language)}</span>
                  <textarea name="browser-device" data-label={t("Browser and device", language)} rows={3} value={browserDevice} onChange={(event) => setBrowserDevice(event.target.value)} />
                </label>
                <label>
                  <span>{t("Report date/time", language)}</span>
                  <input name="report-date-time" data-label={t("Report date/time", language)} value={reportTimestamp} onChange={(event) => setReportTimestamp(event.target.value)} />
                </label>
                <label>
                  <span>{t("App version", language)}</span>
                  <input name="app-version" data-label={t("App version", language)} value={appVersion} readOnly />
                </label>
              </div>
              <label className="privacy-check">
                <input name="privacy-confirmation" data-label={t("Privacy confirmation", language)} type="checkbox" required />
                <span>{t("I confirm this report does not include patient-identifiable information.", language)}</span>
              </label>
              <div className="copy-actions">
                <button type="button" onClick={(event) => copyFormReport(event, "Bug report", "Bug report copied")}>
                  {t("Copy report", language)}
                </button>
                <button type="button" onClick={(event) => downloadFormReport(event, "Bug report", "studysize-bug-report.txt")}>
                  {t("Download report", language)}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {showFeedbackModal && (
        <div className="modal-backdrop" role="presentation" onClick={() => setShowFeedbackModal(false)}>
          <section
            aria-labelledby="beta-feedback-title"
            aria-modal="true"
            className="citation-modal feedback-modal"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
          >
            <div className="modal-head">
              <div>
                <p className="eyebrow">{t("Beta feedback", language)}</p>
                <h2 id="beta-feedback-title">{t("Beta Feedback", language)}</h2>
              </div>
              <button aria-label={t("Close", language)} type="button" onClick={() => setShowFeedbackModal(false)}>
                {t("Close", language)}
              </button>
            </div>
            <p className="modal-copy">
              {t("Your feedback helps identify confusing wording, calculation concerns, mobile usability problems, and missing research-planning features.", language)}
            </p>
            <p className="likert-note"><strong>{t("Likert scale", language)}:</strong> {t("Use the 1 to 5 scale instead of yes/no answers.", language)}</p>
            <form className="feedback-form">
              <div className="feedback-grid">
                <label>
                  <span>{t("Name (optional)", language)}</span>
                  <input name="name" data-label={t("Name (optional)", language)} />
                </label>
                <label>
                  <span>{t("Email (optional)", language)}</span>
                  <input name="email" data-label={t("Email (optional)", language)} type="email" />
                </label>
                <label>
                  <span>{t("User role", language)}</span>
                  <select name="user-role" data-label={t("User role", language)}>
                    <option>Junior researcher</option>
                    <option>Clinician</option>
                    <option>Statistician / methodologist</option>
                    <option>Supervisor / educator</option>
                    <option>Other</option>
                  </select>
                </label>
                <label>
                  <span>{t("Country / institution type", language)}</span>
                  <input name="country-institution" data-label={t("Country / institution type", language)} />
                </label>
              </div>
              <label>
                <span>{t("Tools used", language)}</span>
                <textarea name="tools-used" data-label={t("Tools used", language)} rows={3} placeholder="Calculator catalog, Randomisation, Blinding, Figure Generator..." />
              </label>
              <div className="feedback-grid">
                {[
                  "Overall ease of use",
                  "Calculator recommendation was understandable",
                  "Formula and parameter explanations helped me",
                  "I trusted the result",
                  "I would use this in protocol preparation",
                  "Permission to contact for follow-up",
                ].map((label) => (
                  <label key={label}>
                    <span>{t(label, language)}</span>
                    <select name={label.toLowerCase().replaceAll(" ", "-")} data-label={t(label, language)}>
                      <option>1 - {t("Strongly disagree", language)}</option>
                      <option>2 - {t("Disagree", language)}</option>
                      <option>3 - {t("Neutral", language)}</option>
                      <option>4 - {t("Agree", language)}</option>
                      <option>5 - {t("Strongly agree", language)}</option>
                      <option>{t("Not applicable", language)}</option>
                    </select>
                  </label>
                ))}
              </div>
              <label>
                <span>{t("Anything confusing or missing?", language)}</span>
                <textarea name="confusing-or-missing" data-label={t("Anything confusing or missing?", language)} rows={4} />
              </label>
              <label>
                <span>{t("Suggested features", language)}</span>
                <textarea name="suggested-features" data-label={t("Suggested features", language)} rows={4} />
              </label>
              <div className="feedback-grid">
                <label>
                  <span>{t("Browser and device", language)}</span>
                  <textarea name="browser-device" data-label={t("Browser and device", language)} rows={3} value={browserDevice} onChange={(event) => setBrowserDevice(event.target.value)} />
                </label>
                <label>
                  <span>{t("Report date/time", language)}</span>
                  <input name="report-date-time" data-label={t("Report date/time", language)} value={reportTimestamp} onChange={(event) => setReportTimestamp(event.target.value)} />
                </label>
                <label>
                  <span>{t("App version", language)}</span>
                  <input name="app-version" data-label={t("App version", language)} value={appVersion} readOnly />
                </label>
              </div>
              <label className="privacy-check">
                <input name="privacy-confirmation" data-label={t("Privacy confirmation", language)} type="checkbox" required />
                <span>{t("I confirm this report does not include patient-identifiable information.", language)}</span>
              </label>
              <div className="copy-actions">
                <button type="button" onClick={(event) => copyFormReport(event, "Beta feedback", "Feedback copied")}>
                  {t("Copy report", language)}
                </button>
                <button type="button" onClick={(event) => downloadFormReport(event, "Beta feedback", "studysize-beta-feedback.txt")}>
                  {t("Download report", language)}
                </button>
              </div>
            </form>
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

      {showZTableModal && (
        <div className="modal-backdrop" role="presentation" onClick={() => setShowZTableModal(false)}>
          <section
            aria-labelledby="z-table-title"
            aria-modal="true"
            className="citation-modal z-table-modal"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
          >
            <div className="modal-head">
              <div>
                <p className="eyebrow">{t("Common Z values", language)}</p>
                <h2 id="z-table-title">{t("Z value table", language)}</h2>
              </div>
              <button aria-label={t("Close Z value table", language)} type="button" onClick={() => setShowZTableModal(false)}>
                {t("Close", language)}
              </button>
            </div>
            <div className="z-table-wrap">
              <table className="z-table">
                <thead>
                  <tr>
                    <th>{t("Planning context", language)}</th>
                    <th>{t("Probability", language)}</th>
                    <th>{t("Z value", language)}</th>
                  </tr>
                </thead>
                <tbody>
                  {zTableRows.map((row) => (
                    <tr key={`${row.context}-${row.z}`}>
                      <td>{row.context}</td>
                      <td>{row.probability}</td>
                      <td>{row.z}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
            <div className="protocol-modal-disclaimer" role="note">
              <strong>{t("Protocol wording disclaimer", language)}</strong>
              <p>{t("This wording is a drafting aid only. Review and revise it against your final protocol, local ethics requirements, statistical review, and supervisor or collaborator feedback before use.", language)}</p>
              <p>{t("Legal disclaimer: StudySize Studio provides educational planning support and does not provide medical, legal, ethical, regulatory, or statistical consultancy. Users remain responsible for verifying all wording, assumptions, calculations, and references before using them in protocols, manuscripts, grant applications, or submissions.", language)}</p>
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
