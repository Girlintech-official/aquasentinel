"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type AlertLanguage = "English" | "Twi" | "Dagbani" | "Hausa";

type WaterReading = {
  id: number;
  sensor_id: number;
  temperature: number;
  ph: number;
  dissolved_oxygen: number;
  recorded_at: string;
};

type FishObservation = {
  id: number;
  pond_id: number;
  activity_level: string;
  feeding_response: string;
  unusual_behaviour: boolean;
  fish_count: number;
  observed_at: string;
};

type RiskAssessment = {
  id: number;
  pond_id: number;
  risk_level: string;
  risk_score: number;
  contributing_factors: string[] | string | null;
  ml_anomaly: boolean;
  ml_anomaly_score: number | null;
  assessed_at: string;
};

type Alert = {
  id: number;
  pond_id: number;
  risk_assessment_id: number;
  alert_level: string;
  message: string;
  sent_at: string;
};

type RiskLevel = "Low" | "Moderate" | "Medium" | "High" | "Critical";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ||
  "https://aquasentinel-api-q232.onrender.com";

/* =========================================================
   LANGUAGE TRANSLATIONS
   ========================================================= */

const translations = {
  English: {
    nav: {
      dashboard: "Dashboard",
      ponds: "Ponds",
      insights: "Insights",
      alerts: "Alerts",
      history: "History",
    },

    common: {
      dashboard: "Dashboard",
      loading: "Loading...",
      noData: "No data available",
      normal: "Normal",
      low: "Low",
      moderate: "Moderate",
      medium: "Medium",
      high: "High",
      critical: "Critical",
      attentionRequired: "Attention Required",
      healthy: "Healthy",
      active: "Active",
      detected: "Detected",
      none: "None",
      latest: "Latest",
      current: "Current",
      score: "Score",
      status: "Status",
      details: "Details",
      alert: "Alert",
      alerts: "Alerts",
      pond: "Pond",
    },

    hero: {
      badge: "EARLY-WARNING INTELLIGENCE",
      title: "Good evening",
      monitoring:
        "Sentinel is continuously monitoring your aquaculture environment.",
      farm: "Saha Aqua Farm",
      location: "Gurugu, Tamale",
    },

    metrics: {
      temperature: "Temperature",
      ph: "pH Balance",
      oxygen: "Dissolved Oxygen",
      fishActivity: "Fish Activity",
      optimal: "Within expected range",
      attention: "Requires attention",
    },

    fish: {
      title: "Fish Behaviour",
      activity: "Activity Level",
      feeding: "Feeding Response",
      unusual: "Unusual Behaviour",
      fishCount: "Fish Count",
      normal: "Normal",
      observed: "Observed",
      noneObserved: "None observed",
      monitoring:
        "Sentinel is monitoring fish behaviour for early signs of stress.",
    },

    risk: {
      title: "Risk Intelligence",
      subtitle:
        "Sentinel's current assessment of your pond conditions.",
      riskLevel: "Risk Level",
      riskScore: "Risk Score",
      contributingFactors: "Contributing Factors",
      noFactors:
        "No significant contributing factors detected.",
      attention:
        "Sentinel has detected a condition that may require your attention.",
      healthy:
        "Current pond conditions are within the expected operating range.",
      reasoningTitle: "How Sentinel is reasoning",
      reasoning:
        "Sentinel combines water-quality readings, fish behaviour and machine-learning anomaly detection to identify conditions that may require attention.",
      statusTitle: "Sentinel Status",
      statusHealthy:
        "Your pond currently appears to be within the expected range.",
      statusAttention:
        "Sentinel has identified a condition that should be reviewed.",
    },

    ml: {
      title: "AI / ML INTELLIGENCE",
      anomalyDetection: "Anomaly Detection",
      anomalyDetected: "Anomaly detected",
      noAnomaly: "No anomaly detected",
      anomalyScore: "Anomaly Score",
      explanation:
        "The machine-learning model compares current pond conditions with observed patterns to identify unusual combinations of readings.",
    },

    alerts: {
      title: "Alerts",
      unread: "unread",
      markRead: "Mark as read",
      markAllRead: "Mark all as read",
      noAlerts: "No alerts at the moment.",
      notification: "Notification",
      riskAlert: "Risk Alert",

      temperatureHigh:
        "Water temperature is higher than the recommended range.",
      temperatureLow:
        "Water temperature is lower than the recommended range.",
      phHigh:
        "pH level is higher than the recommended range.",
      phLow:
        "pH level is lower than the recommended range.",
      oxygenHigh:
        "Dissolved oxygen is higher than the expected operating range.",
      oxygenLow:
        "Dissolved oxygen is lower than the recommended range.",
      unusualFishBehaviour:
        "Unusual fish behaviour has been detected.",
      poorFeeding:
        "Fish feeding response appears to be lower than expected.",
      anomaly:
        "An unusual pattern has been detected in the pond data.",
      attention: "The pond requires attention.",
      normal:
        "Pond conditions are currently within the expected range.",

      /* VOICE */
      readAloud: "Read alert aloud",
      stopVoice: "Stop voice",
      voiceUnavailable:
        "A voice for this language is not available on this device.",
      voiceUnsupported:
        "Voice reading is not supported by this browser.",
      voiceError:
        "Unable to read this alert aloud.",
    },

    factors: {
      temperature: "Temperature",
      ph: "pH",
      dissolved_oxygen: "Dissolved oxygen",
      fish_activity: "Fish activity",
      feeding_response: "Feeding response",
      unusual_behaviour: "Unusual behaviour",
      ml_anomaly: "Machine-learning anomaly",
      water_quality: "Water quality",
    },

    voice: {
      prefix: "AquaSentinel alert.",
      detected: "risk detected in",
      action:
        "Please check the pond conditions and take corrective action.",
    },

    footer:
      "AquaSentinel • Multimodal Early-Warning Intelligence for African Aquaculture",
  },

  Twi: {
    nav: {
      dashboard: "Dashboard",
      ponds: "Atare",
      insights: "Nimdeɛ",
      alerts: "Kɔkɔbɔ",
      history: "Abakɔsɛm",
    },

    common: {
      dashboard: "Dashboard",
      loading: "Ɛresoa...",
      noData: "Data biara nni hɔ",
      normal: "Ɛyɛ sɛnea ɛsɛ",
      low: "Ɔhaw Ketewa",
      moderate: "Ɔhaw Kakra",
      medium: "Ɔhaw Mfinimfini",
      high: "Ɔhaw Kɛse",
      critical: "Ɔhaw Kɛse Pa Ara",
      attentionRequired: "Ɛhia sɛ wodi ho dwuma",
      healthy: "Ɛyɛ den",
      active: "Ɛreyɛ adwuma",
      detected: "Wɔahu",
      none: "Biara nni hɔ",
      latest: "Nea etwa to",
      current: "Mprempren",
      score: "Nkyerɛkyerɛ",
      status: "Gyinabea",
      details: "Nkyerɛkyerɛmu",
      alert: "Kɔkɔbɔ",
      alerts: "Kɔkɔbɔ",
      pond: "Atare",
    },

    hero: {
      badge: "NKƆKƆBƆ A ƐBA NTƐM",
      title: "Maadwo",
      monitoring:
        "Sentinel rehwehwɛ w’atarɛ mu tebea no bere nyinaa.",
      farm: "Saha Aqua Farm",
      location: "Gurugu, Tamale",
    },

    metrics: {
      temperature: "Nsuo Hyew",
      ph: "pH Gyinaesi",
      oxygen: "Oxygen a ɛwɔ Nsuo mu",
      fishActivity: "Mpataa Nneyɛe",
      optimal: "Ɛwɔ baabi a ɛsɛ",
      attention: "Ɛhia sɛ wodi ho dwuma",
    },

    fish: {
      title: "Mpataa Nneyɛe",
      activity: "Nneyɛe Dodow",
      feeding: "Aduan Ho Mmuae",
      unusual: "Nneyɛe a Ɛnte Sɛnea Ɛsɛ",
      fishCount: "Mpataa Dodow",
      normal: "Ɛyɛ sɛnea ɛsɛ",
      observed: "Wɔahu",
      noneObserved: "Wɔnhu biara",
      monitoring:
        "Sentinel rehwehwɛ mpataa nneyɛe de ahu nsɛnkyerɛnne a ɛkyerɛ sɛ wɔrebrɛ.",
    },

    risk: {
      title: "Ɔhaw Nimdeɛ",
      subtitle:
        "Sentinel hwɛbea a ɛwɔ w’atarɛ ho mprempren.",
      riskLevel: "Ɔhaw Gyinabea",
      riskScore: "Ɔhaw Nkyerɛkyerɛ",
      contributingFactors: "Nneɛma a Ɛde Ɔhaw No Ba",
      noFactors:
        "Wɔnhu ade titiriw biara a ɛde ɔhaw ba.",
      attention:
        "Sentinel ahu tebea bi a ebia ɛsɛ sɛ wodi ho dwuma.",
      healthy:
        "Mprempren atare no tebea no wɔ baabi a ɛsɛ.",
      reasoningTitle: "Sɛn na Sentinel resusuw ho",
      reasoning:
        "Sentinel de nsuo no su, mpataa nneyɛe ne machine-learning nhwehwɛmu bom de hu tebea a ebia ɛhia sɛ wodi ho dwuma.",
      statusTitle: "Sentinel Gyinabea",
      statusHealthy:
        "Mprempren, ɛte sɛ nea w’atarɛ no tebea no yɛ papa.",
      statusAttention:
        "Sentinel ahu tebea bi a ɛsɛ sɛ wohwɛ mu.",
    },

    ml: {
      title: "AI / ML NIMDEƐ",
      anomalyDetection:
        "Nsakrae a Ɛnte Sɛnea Ɛsɛ",
      anomalyDetected: "Wɔahu nsakrae bi",
      noAnomaly: "Wɔnhu nsakrae biara",
      anomalyScore: "Nsakrae Nkyerɛkyerɛ",
      explanation:
        "Machine-learning model no de mprempren atare no tebea toto nsɛm a wɔahu dedaw ho de hu nsɛm a ɛnte sɛnea ɛsɛ.",
    },

    alerts: {
      title: "Kɔkɔbɔ",
      unread: "a wɔnhyɛɛ no nkenkan",
      markRead: "Hyɛ sɛ wɔakan",
      markAllRead: "Hyɛ ne nyinaa sɛ wɔakan",
      noAlerts: "Kɔkɔbɔ biara nni hɔ mprempren.",
      notification: "Amanneɛbɔ",
      riskAlert: "Ɔhaw Kɔkɔbɔ",
      temperatureHigh:
        "Nsuo no ayɛ hyew sen sɛnea ɛsɛ.",
      temperatureLow:
        "Nsuo no ayɛ nwini sen sɛnea ɛsɛ.",
      phHigh:
        "pH no akɔ soro sen sɛnea ɛsɛ.",
      phLow:
        "pH no akɔ fam sen sɛnea ɛsɛ.",
      oxygenHigh:
        "Oxygen a ɛwɔ nsuo no mu no akɔ soro sen sɛnea wɔhwɛ kwan.",
      oxygenLow:
        "Oxygen a ɛwɔ nsuo no mu no akɔ fam sen sɛnea ɛsɛ.",
      unusualFishBehaviour:
        "Wɔahu mpataa nneyɛe bi a ɛnte sɛnea ɛsɛ.",
      poorFeeding:
        "Mpataa no aduan ho mmuae no sua sen sɛnea ɛsɛ.",
      anomaly:
        "Wɔahu nsakrae bi a ɛnte sɛnea ɛsɛ wɔ atare no mu nsɛm mu.",
      attention:
        "Ɛsɛ sɛ wodi atare no ho dwuma.",
      normal:
        "Mprempren atare no tebea no wɔ baabi a ɛsɛ.",

      readAloud: "Kenkan kɔkɔbɔ no kyerɛ me",
      stopVoice: "Gyae nne no",
      voiceUnavailable:
        "Nne a ɛwɔ saa kasa yi mu nni saa afiri yi so.",
      voiceUnsupported:
        "Saa browser yi ntumi nkenkan kɔkɔbɔ no wɔ nne so.",
      voiceError:
        "Yentumi nkenkan kɔkɔbɔ yi wɔ nne so.",
    },

    factors: {
      temperature: "Nsuo hyew",
      ph: "pH",
      dissolved_oxygen:
        "Oxygen a ɛwɔ nsuo mu",
      fish_activity: "Mpataa nneyɛe",
      feeding_response:
        "Aduan ho mmuae",
      unusual_behaviour:
        "Nneyɛe a ɛnte sɛnea ɛsɛ",
      ml_anomaly:
        "Machine-learning nsakrae",
      water_quality: "Nsuo no su",
    },

    voice: {
      prefix: "AquaSentinel kɔkɔbɔ.",
      detected:
        "Wɔahu ɔhaw wɔ",
      action:
        "Yɛsrɛ wo, hwɛ ɔtare no mu nsɛm na yɛ nea ɛsɛ sɛ woyɛ.",
    },

    footer:
      "AquaSentinel • Nsuo ne Mpataa Nneyɛe Ho Kɔkɔbɔ Ntɛm ma Afrika Mpataa Yɛnkurom",
  },

  Hausa: {
    nav: {
      dashboard: "Dashboard",
      ponds: "Rijiyoyi",
      insights: "Fahimta",
      alerts: "Gargadi",
      history: "Tarihi",
    },

    common: {
      dashboard: "Dashboard",
      loading: "Ana lodawa...",
      noData: "Babu bayanai",
      normal: "Al'ada",
      low: "Ƙaramin Haɗari",
      moderate: "Haɗari Matsakaici",
      medium: "Haɗari Matsakaici",
      high: "Babban Haɗari",
      critical: "Haɗari Mai Tsanani",
      attentionRequired:
        "Ana Bukatar Kulawa",
      healthy: "Lafiya",
      active: "Aiki",
      detected: "An gano",
      none: "Babu",
      latest: "Na baya-bayan nan",
      current: "Yanzu",
      score: "Maki",
      status: "Matsayi",
      details: "Cikakkun Bayanai",
      alert: "Gargaɗi",
      alerts: "Gargadi",
      pond: "Rijiya",
    },

    hero: {
      badge: "FASAHA TA GARGADI DA WURI",
      title: "Barka da yamma",
      monitoring:
        "Sentinel na sa ido kan yanayin ruwan kiwon kifinka a kowane lokaci.",
      farm: "Saha Aqua Farm",
      location: "Gurugu, Tamale",
    },

    metrics: {
      temperature: "Zafin Ruwa",
      ph: "Ma'aunin pH",
      oxygen:
        "Oxygen da ke cikin Ruwa",
      fishActivity: "Ayyukan Kifi",
      optimal:
        "Yana cikin iyakar da ta dace",
      attention: "Ana bukatar kulawa",
    },

    fish: {
      title: "Halayen Kifi",
      activity: "Matsayin Aiki",
      feeding:
        "Martanin Cin Abinci",
      unusual:
        "Halin da ba na al'ada ba",
      fishCount: "Adadin Kifi",
      normal: "Al'ada",
      observed: "An lura",
      noneObserved:
        "Ba a lura da shi ba",
      monitoring:
        "Sentinel na sa ido kan halayen kifi domin gano alamun damuwa da wuri.",
    },

    risk: {
      title: "Bayanan Haɗari",
      subtitle:
        "Binciken Sentinel na halin ruwan rijiyarka a yanzu.",
      riskLevel: "Matsayin Haɗari",
      riskScore: "Makin Haɗari",
      contributingFactors:
        "Abubuwan da ke haifar da Haɗarin",
      noFactors:
        "Ba a gano wani muhimmin abu da ke haifar da haɗari ba.",
      attention:
        "Sentinel ya gano wani yanayi da zai iya bukatar kulawa.",
      healthy:
        "A halin yanzu yanayin ruwan yana cikin iyakar da ta dace.",
      reasoningTitle:
        "Yadda Sentinel ke nazari",
      reasoning:
        "Sentinel na haɗa bayanan ingancin ruwa, halayen kifi da machine-learning domin gano yanayin da zai iya bukatar kulawa.",
      statusTitle:
        "Matsayin Sentinel",
      statusHealthy:
        "A halin yanzu ruwan rijiyar yana cikin yanayin da ake tsammani.",
      statusAttention:
        "Sentinel ya gano wani yanayi da ya kamata a duba.",
    },

    ml: {
      title: "AI / ML INTELLIGENCE",
      anomalyDetection:
        "Gano Yanayin da ba na Al'ada ba",
      anomalyDetected:
        "An gano yanayin da ba na Al'ada ba",
      noAnomaly:
        "Ba a gano wani yanayi da ba na Al'ada ba",
      anomalyScore:
        "Makin Yanayin",
      explanation:
        "Tsarin machine-learning yana kwatanta bayanan yanzu da tsarin bayanan da aka gani domin gano abubuwan da ba su saba ba.",
    },

    alerts: {
      title: "Gargadi",
      unread: "ba a karanta ba",
      markRead:
        "Alama an karanta",
      markAllRead:
        "Alama duka an karanta",
      noAlerts:
        "Babu gargadi a yanzu.",
      notification: "Sanarwa",
      riskAlert:
        "Gargadin Haɗari",
      temperatureHigh:
        "Zafin ruwan ya fi yadda ya kamata.",
      temperatureLow:
        "Zafin ruwan ya yi ƙasa da yadda ya kamata.",
      phHigh:
        "Matsayin pH ya fi yadda ya kamata.",
      phLow:
        "Matsayin pH ya yi ƙasa da yadda ya kamata.",
      oxygenHigh:
        "Oxygen da ke cikin ruwan ya fi abin da ake tsammani.",
      oxygenLow:
        "Oxygen da ke cikin ruwan ya yi ƙasa da yadda ya kamata.",
      unusualFishBehaviour:
        "An gano halin kifi da ba na al'ada ba.",
      poorFeeding:
        "Martanin kifin ga abinci ya yi ƙasa da yadda ake tsammani.",
      anomaly:
        "An gano wani yanayi da ba na al'ada ba a bayanan rijiya.",
      attention:
        "Ana bukatar kulawa da rijiya.",
      normal:
        "A halin yanzu yanayin ruwan rijiya yana cikin iyakar da ta dace.",

      readAloud:
        "Karanta gargadin da murya",
      stopVoice:
        "Dakatar da murya",
      voiceUnavailable:
        "Ba a samun muryar wannan harshe a wannan na'urar.",
      voiceUnsupported:
        "Wannan browser ba ya tallafawa karanta gargadi da murya.",
      voiceError:
        "An kasa karanta wannan gargadi da murya.",
    },

    factors: {
      temperature: "Zafin ruwa",
      ph: "pH",
      dissolved_oxygen:
        "Oxygen da ke cikin ruwa",
      fish_activity:
        "Ayyukan kifi",
      feeding_response:
        "Martanin cin abinci",
      unusual_behaviour:
        "Halin da ba na al'ada ba",
      ml_anomaly:
        "Machine-learning ya gano yanayi",
      water_quality:
        "Ingancin ruwa",
    },

    voice: {
      prefix:
        "Sanarwar AquaSentinel.",
      detected:
        "An gano haɗari a",
      action:
        "Da fatan za a duba yanayin ruwan tafkin sannan a dauki matakin da ya dace.",
    },

    footer:
      "AquaSentinel • Fasahar Gargadi ta Farko don Kiwo Kifi a Afirka",
  },

  Dagbani: {
    nav: {
      dashboard: "Dashboard",
      ponds: "Nɔɔŋu",
      insights: "Din' beni",
      alerts: "Kukɔli",
      history: "History",
    },

    common: {
      dashboard: "Dashboard",
      loading: "A yi mali...",
      noData: "Data ka ni",
      normal: "vien'yela",
      low: "Kaɣila biela",
      moderate: "Kaɣila biela pam",
      medium: "Kaɣila din' sahi",
      high: "Kaɣila Kpema",
      critical: "Kaɣila Kpema Pam",
      attentionRequired:
        "niŋmi zaŋsim",
      healthy: "Alaafei",
      active: "Di yulinda",
      detected: "Di nyela",
      none: "cheli kani",
      latest: "Din na kuli yɔli kana",
      current: "Pun'pɔŋɔ dini",
      score: "Din' nye shem",
      status: "Yuli",
      details: "N-yɛli",
      alert: "Kukɔli",
      alerts: "Kukɔya",
      pond: "Nɔɔŋu",
    },

    hero: {
      badge:
        "KUKƆLI DIN' KAN'NA YɔM",
      title: "N-yɛli",
      monitoring:
        "Sentinel ni nyɛ nɔɔŋu maa yɛl'Sheli.",
      farm: "Saha Aqua Farm",
      location: "Gurugu, Tamale",
    },

    metrics: {
      temperature: "Biisim ni Maasim",
      ph: "pH",
      oxygen:
        "Oxygen din be nɔɔŋu ni",
      fishActivity:
        "Zahim maa yɛla",
      optimal:
        "Binshehu kani",
      attention:
        "Yulima!",
    },

    fish: {
      title: "Zahim maa yɛla",
      activity:
        "yɛla",
      feeding:
        "Dihibu yɛla",
      unusual:
        "N-yɛli din mali yɛli maa",
      fishCount:
        "Zahim kalinsi",
      normal: "Dɛdɛ",
      observed:
        "Wɔ nyɛli",
      noneObserved:
        "yɛl'shɛli kani",
      monitoring:
        "Sentinel ni nyɛ bihi n-yɛli ka o nyɛli yɛli din niŋ ka bihi maa brɛ.",
    },

    risk: {
      title:
        "Kaɣila Nimdi",
      subtitle:
        "Sentinel ni nyɛ nɔɔŋu maa yuli naa.",
      riskLevel:
        "Kaɣila Yuli",
      riskScore:
        "Kaɣila Nɔɔŋu",
      contributingFactors:
        "N-yɛli din nyɛ ka kaɣila maa",
      noFactors:
        "Wɔ ka nyɛli n-yɛli din nyɛ ka kaɣila maa.",
      attention:
        "Sentinel nyɛli yɛli din niŋ ka a niŋdi pam.",
      healthy:
        "Nɔɔŋu maa yuli ni be baŋa din mali.",
      reasoningTitle:
        "Sɛnti Sentinel ni dihi yɛlima",
      reasoning:
        "Sentinel ni bohi nɔɔŋu yuli, bihi n-yɛli ne machine-learning ka o nyɛli yɛli din niŋ ka a niŋdi pam.",
      statusTitle:
        "Sentinel Yuli",
      statusHealthy:
        "Nɔɔŋu maa yuli ni be baŋa din mali.",
      statusAttention:
        "Sentinel nyɛli yɛli din niŋ ka a yɛli pam.",
    },

    ml: {
      title: "AI / ML NIMDI",
      anomalyDetection:
        "Yɛli din mali yɛli maa",
      anomalyDetected:
        "Wɔ nyɛli yɛli din mali",
      noAnomaly:
        "Wɔ ka nyɛli yɛli din mali",
      anomalyScore:
        "Yɛli Nɔɔŋu",
      explanation:
        "Machine-learning ni bohi nɔɔŋu maa naa yuli ne yɛli din kaŋa ka o nyɛli yɛli din mali.",
    },

    alerts: {
      title: "Kukɔli",
      unread:
        "Din na bi karim",
      markRead:
        "Wuhumi ni a karimya",
      markAllRead:
        "Wuhumi ni a karim di zaa",
      noAlerts:
        "kukɔli shɛli na kani.",
      notification:
        "Yɛlli",
      riskAlert:
        "Kaɣila kukɔli",
      temperatureHigh:
        "Pond maa kom maa bii ya pam.",
      temperatureLow:
        "Pond maa kom maa biisim bɛ tiŋa.",
      phHigh:
        "pH maa duya pam.",
      phLow:
        "pH maa bɛ tiŋa.",
      oxygenHigh:
        "Oxygen maa duya pam.",
      oxygenLow:
        "Oxygen din be Pond maa ni bɛ tiŋa.",
      unusualFishBehaviour:
        "Zaɣima maa niŋsim bɛ kon'koba zuŋɔ.",
      poorFeeding:
        "Zaɣima maa be diri vien'yela.",
      anomaly:
        "ŋɔ n yɛri yɛlli din mali Pond maa.",
      attention:
        "niŋmi zaha pam niŋ Pond maa ni.",
      normal:
        "Binsheɣu kam chɛni vien'yela.",

      readAloud:
        "Karigimi kukɔli n yɛlima.",
      stopVoice:
        "Cheli yɛlibu",
      voiceUnavailable:
        "yɛltoha tɔɣsira maa ka ni. ",
      voiceUnsupported:
        "Browser maa ku tooi tɔɣsi yɛltoha maa ka a wum",
      voiceError:
        "Binsheɣu mali yɛltoha tɔɣsira maa.",
    },

    factors: {
      temperature: "Biism ni Maasim",
      ph: "pH",
      dissolved_oxygen:
        "Oxygen din be nɔɔŋu ni",
      fish_activity:
        "Zahim maa yɛla",
      feeding_response:
        "Dihibu yɛla",
      unusual_behaviour:
        "Yɛla beni",
      ml_anomaly:
        "ML n-yɛli",
      water_quality:
        "Nɔɔŋu kom yeltoha",
    },

    voice: {
      prefix:
        "AquaSentinel kukɔli.",
      detected:
        "kaɣila din bɛni",
      action:
        "niŋmi zaha pam niŋ Pond maa ni.",
    },

    footer:
      "AquaSentinel •Africa Zaɣim wumsibu Kukɔli Din Kan'na Yɔm.",
  },
} as const;

/* =========================================================
   HELPERS
   ========================================================= */

const normalizeRiskLevel = (
  level?: string
): RiskLevel => {
  const normalized = (
    level || "low"
  )
    .toLowerCase()
    .trim();

  if (normalized === "critical")
    return "Critical";

  if (normalized === "high")
    return "High";

  if (normalized === "moderate")
    return "Moderate";

  if (normalized === "medium")
    return "Medium";

  return "Low";
};

const getRiskPercentage = (
  level: RiskLevel
) => {
  switch (level) {
    case "Critical":
      return 100;
    case "High":
      return 80;
    case "Moderate":
      return 55;
    case "Medium":
      return 55;
    default:
      return 20;
  }
};

const getRiskScore = (
  score?: number | null
) => {
  if (
    score === null ||
    score === undefined ||
    Number.isNaN(score)
  ) {
    return 0;
  }

  if (score <= 1) {
    return Math.round(score * 100);
  }

  return Math.min(
    100,
    Math.round(score)
  );
};

const getRiskColorClass = (
  level: RiskLevel
) => {
  switch (level) {
    case "Critical":
      return "border-red-500/40 bg-red-500/10 text-red-300";

    case "High":
      return "border-red-400/30 bg-red-400/10 text-red-300";

    case "Moderate":
    case "Medium":
      return "border-amber-400/30 bg-amber-400/10 text-amber-300";

    default:
      return "border-teal-400/30 bg-teal-400/10 text-teal-300";
  }
};

const getRiskDotClass = (
  level: RiskLevel
) => {
  switch (level) {
    case "Critical":
    case "High":
      return "bg-red-400";

    case "Moderate":
    case "Medium":
      return "bg-amber-400";

    default:
      return "bg-teal-400";
  }
};

const getAlertLevelClass = (
  level?: string
) => {
  const normalized = (
    level || ""
  ).toLowerCase();

  if (
    normalized === "critical" ||
    normalized === "high"
  ) {
    return "border-red-400/30 bg-red-500/10";
  }

  if (
    normalized === "moderate" ||
    normalized === "medium"
  ) {
    return "border-amber-400/30 bg-amber-500/10";
  }

  return "border-teal-400/30 bg-teal-500/10";
};

const getFactorTranslationKey = (
  factor: string
): keyof typeof translations.English.factors | null => {
  const value = factor.toLowerCase();

  if (value.includes("temperature"))
    return "temperature";

  if (
    value.includes("dissolved") ||
    value.includes("oxygen")
  ) {
    return "dissolved_oxygen";
  }

  if (value.includes("ph"))
    return "ph";

  if (
    value.includes("fish") &&
    value.includes("activity")
  ) {
    return "fish_activity";
  }

  if (value.includes("feeding"))
    return "feeding_response";

  if (
    value.includes("unusual") &&
    value.includes("behaviour")
  ) {
    return "unusual_behaviour";
  }

  if (
    value.includes("unusual") &&
    value.includes("behavior")
  ) {
    return "unusual_behaviour";
  }

  if (
    value.includes("anomaly") ||
    value.includes("machine")
  ) {
    return "ml_anomaly";
  }

  if (value.includes("water"))
    return "water_quality";

  return null;
};

/* =========================================================
   ALERT TRANSLATION
   ========================================================= */

const translateAlertMessage = (
  message: string,
  language: AlertLanguage
) => {
  const t =
    translations[language].alerts;

  if (!message) {
    return t.attention;
  }

  if (language === "English") {
    return message;
  }

  const lower =
    message.toLowerCase();

  if (
    lower.includes("temperature") &&
    (
      lower.includes("high") ||
      lower.includes("above") ||
      lower.includes("higher")
    )
  ) {
    return t.temperatureHigh;
  }

  if (
    lower.includes("temperature") &&
    (
      lower.includes("low") ||
      lower.includes("below") ||
      lower.includes("lower")
    )
  ) {
    return t.temperatureLow;
  }

  if (
    lower.includes("ph") &&
    (
      lower.includes("high") ||
      lower.includes("above") ||
      lower.includes("higher")
    )
  ) {
    return t.phHigh;
  }

  if (
    lower.includes("ph") &&
    (
      lower.includes("low") ||
      lower.includes("below") ||
      lower.includes("lower")
    )
  ) {
    return t.phLow;
  }

  if (
    lower.includes("dissolved oxygen") &&
    (
      lower.includes("high") ||
      lower.includes("above") ||
      lower.includes("higher")
    )
  ) {
    return t.oxygenHigh;
  }

  if (
    lower.includes("dissolved oxygen") &&
    (
      lower.includes("low") ||
      lower.includes("below") ||
      lower.includes("lower")
    )
  ) {
    return t.oxygenLow;
  }

  if (
    lower.includes(
      "unusual fish behaviour"
    ) ||
    lower.includes(
      "unusual fish behavior"
    )
  ) {
    return t.unusualFishBehaviour;
  }

  if (
    lower.includes("feeding") &&
    (
      lower.includes("low") ||
      lower.includes("poor") ||
      lower.includes("reduced")
    )
  ) {
    return t.poorFeeding;
  }

  if (
    lower.includes("anomaly") ||
    lower.includes("unusual pattern")
  ) {
    return t.anomaly;
  }

  if (
    lower.includes("attention") ||
    lower.includes("requires attention")
  ) {
    return t.attention;
  }

  return t.attention;
};

/* =========================================================
   TIME / DATE
   ========================================================= */

const getTimeGreeting = (
  language: AlertLanguage
): string => {
  const hour =
    new Date().getHours();

  if (language === "English") {
    if (hour < 12)
      return "Good morning";

    if (hour < 18)
      return "Good afternoon";

    return "Good evening";
  }

  if (language === "Twi") {
    if (hour < 12)
      return "Maakye";

    if (hour < 18)
      return "Maaha";

    return "Maadwo";
  }

  if (language === "Hausa") {
    if (hour < 12)
      return "Barka da safe";

    if (hour < 18)
      return "Barka da rana";

    return "Barka da yamma";
  }

  if (hour < 12)
    return "Dasiba";

  if (hour < 18)
    return "Antire";

  return "Aniwunla";
};

const formatDate = (
  date: string | undefined,
  language: AlertLanguage
) => {
  if (!date) return "";

  try {
    const localeMap: Record<
      AlertLanguage,
      string
    > = {
      English: "en-GH",
      Twi: "ak-GH",
      Hausa: "ha-GH",
      Dagbani: "en-GH",
    };

    return new Intl.DateTimeFormat(
      localeMap[language],
      {
        day: "numeric",
        month: "short",
        hour: "numeric",
        minute: "2-digit",
      }
    ).format(new Date(date));
  } catch {
    return "";
  }
};

/* =========================================================
   VOICE LANGUAGE CONFIGURATION
   ========================================================= */

/*
 * These are the language codes we ask the browser to use.
 *
 * IMPORTANT:
 * We intentionally do NOT include English as a fallback
 * for Twi, Dagbani or Hausa.
 *
 * If the device does not have a matching voice, AquaSentinel
 * will tell the user that voice is unavailable rather than
 * speaking the alert in English.
 */
const speechLanguageMap: Record<
  AlertLanguage,
  string[]
> = {
  English: [
    "en-GH",
    "en-GB",
    "en-US",
    "en",
  ],

  Twi: [
    "ak-GH",
    "ak",
  ],

  Hausa: [
    "ha-GH",
    "ha-NG",
    "ha",
  ],

  Dagbani: [
    "dag-GH",
    "dag",
  ],
};

const findVoiceForLanguage = (
  voices: SpeechSynthesisVoice[],
  language: AlertLanguage
) => {
  const preferredLanguages =
    speechLanguageMap[language];

  /*
   * Exact match first.
   */
  for (
    const preferred of preferredLanguages
  ) {
    const exact = voices.find(
      (voice) =>
        voice.lang.toLowerCase() ===
        preferred.toLowerCase()
    );

    if (exact) {
      return exact;
    }
  }

  /*
   * Then try language prefix.
   *
   * Example:
   * en-GH -> en
   * ha-NG -> ha
   */
  for (
    const preferred of preferredLanguages
  ) {
    const prefix =
      preferred
        .toLowerCase()
        .split("-")[0];

    const matchingVoice =
      voices.find((voice) =>
        voice.lang
          .toLowerCase()
          .startsWith(`${prefix}-`)
      ) ||
      voices.find(
        (voice) =>
          voice.lang
            .toLowerCase() === prefix
      );

    if (matchingVoice) {
      return matchingVoice;
    }
  }

  return null;
};

/* =========================================================
   DASHBOARD
   ========================================================= */

export default function Home() {
  const router = useRouter();

  const [water, setWater] =
    useState<WaterReading | null>(
      null
    );

  const [fish, setFish] =
    useState<FishObservation | null>(
      null
    );

  const [risk, setRisk] =
    useState<RiskAssessment | null>(
      null
    );

  const [alerts, setAlerts] =
    useState<Alert[]>([]);

  const [
    notificationsOpen,
    setNotificationsOpen,
  ] = useState(false);

  const [
    readAlertIds,
    setReadAlertIds,
  ] = useState<number[]>([]);

  const [
    alertLanguage,
    setAlertLanguage,
  ] = useState<AlertLanguage>(
    "English"
  );

  const [
    menuOpen,
    setMenuOpen,
  ] = useState(false);

  const [
    loading,
    setLoading,
  ] = useState(true);

  /* =======================================================
     VOICE STATE
     ======================================================= */

  const [
    availableVoices,
    setAvailableVoices,
  ] = useState<
    SpeechSynthesisVoice[]
  >([]);

  const [
    speakingAlertId,
    setSpeakingAlertId,
  ] = useState<number | null>(
    null
  );

  const [
    voiceStatus,
    setVoiceStatus,
  ] = useState<string | null>(
    null
  );

  const previousAlertIds =
    useRef<Set<number>>(
      new Set()
    );

  const audioContextRef =
    useRef<AudioContext | null>(
      null
    );

  const speechSynthesisRef =
    useRef<SpeechSynthesis | null>(
      null
    );

  const t =
    translations[alertLanguage];

  /* =======================================================
     AUTHENTICATION
     ======================================================= */

  useEffect(() => {
    const token =
      localStorage.getItem(
        "aquasentinel_token"
      );

    if (!token) {
      router.push("/login");
    }
  }, [router]);

  /* =======================================================
     LANGUAGE PREFERENCE
     ======================================================= */

  useEffect(() => {
    const savedLanguage =
      localStorage.getItem(
        "aquasentinel_alert_language"
      ) as AlertLanguage | null;

    if (
      savedLanguage &&
      [
        "English",
        "Twi",
        "Dagbani",
        "Hausa",
      ].includes(savedLanguage)
    ) {
      setAlertLanguage(
        savedLanguage
      );
    }

    const savedReadAlerts =
      localStorage.getItem(
        "aquasentinel_read_alerts"
      );

    if (savedReadAlerts) {
      try {
        setReadAlertIds(
          JSON.parse(savedReadAlerts)
        );
      } catch {
        setReadAlertIds([]);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(
      "aquasentinel_alert_language",
      alertLanguage
    );

    /*
     * Stop any current speech when the farmer
     * changes language.
     *
     * This prevents an English alert from
     * continuing while another language is selected.
     */
    if (
      typeof window !== "undefined" &&
      "speechSynthesis" in window
    ) {
      window.speechSynthesis.cancel();
      setSpeakingAlertId(null);
    }

    setVoiceStatus(null);
  }, [alertLanguage]);

  /* =======================================================
     VOICE INITIALIZATION
     ======================================================= */

  useEffect(() => {
    if (
      typeof window === "undefined" ||
      !("speechSynthesis" in window)
    ) {
      return;
    }

    speechSynthesisRef.current =
      window.speechSynthesis;

    const loadVoices = () => {
      const voices =
        window.speechSynthesis.getVoices();

      setAvailableVoices(voices);
    };

    loadVoices();

    window.speechSynthesis.addEventListener(
      "voiceschanged",
      loadVoices
    );

    return () => {
      window.speechSynthesis.removeEventListener(
        "voiceschanged",
        loadVoices
      );

      window.speechSynthesis.cancel();
    };
  }, []);

  /* =======================================================
     AUDIO ALERT SOUND
     ======================================================= */

  const initializeAudio = () => {
    if (!audioContextRef.current) {
      const AudioContextClass =
        window.AudioContext ||
        (
          window as typeof window & {
            webkitAudioContext?: typeof AudioContext;
          }
        ).webkitAudioContext;

      if (AudioContextClass) {
        audioContextRef.current =
          new AudioContextClass();
      }
    }

    if (
      audioContextRef.current &&
      audioContextRef.current.state ===
        "suspended"
    ) {
      audioContextRef.current.resume();
    }
  };

  const playAlertSound = (
    level: string
  ) => {
    const audioContext =
      audioContextRef.current;

    if (!audioContext) return;

    const normalized =
      level.toLowerCase();

    const beepCount =
      normalized === "critical" ||
      normalized === "high"
        ? 3
        : normalized === "moderate" ||
          normalized === "medium"
        ? 2
        : 1;

    for (
      let i = 0;
      i < beepCount;
      i++
    ) {
      const oscillator =
        audioContext.createOscillator();

      const gainNode =
        audioContext.createGain();

      oscillator.type = "sine";

      oscillator.frequency.value =
        normalized === "critical" ||
        normalized === "high"
          ? 880
          : 660;

      gainNode.gain.value =
        0.04;

      oscillator.connect(
        gainNode
      );

      gainNode.connect(
        audioContext.destination
      );

      const startTime =
        audioContext.currentTime +
        i * 0.18;

      oscillator.start(
        startTime
      );

      oscillator.stop(
        startTime + 0.1
      );
    }
  };

  /* =======================================================
     DATA FETCHING
     ======================================================= */

  useEffect(() => {
    let mounted = true;

    const fetchDashboardData =
      async () => {
        const token =
          localStorage.getItem(
            "aquasentinel_token"
          );

        if (!token) return;

        try {
          const headers = {
            Authorization: `Bearer ${token}`,
          };

          const [
            waterResponse,
            fishResponse,
            riskResponse,
            alertsResponse,
          ] = await Promise.all([
            fetch(
              `${API_BASE}/water-readings`,
              { headers }
            ),

            fetch(
              `${API_BASE}/fish-observations`,
              { headers }
            ),

            fetch(
              `${API_BASE}/risk-assessments`,
              { headers }
            ),

            fetch(
              `${API_BASE}/alerts`,
              { headers }
            ),
          ]);

          if (
            waterResponse.status ===
              401 ||
            fishResponse.status ===
              401 ||
            riskResponse.status ===
              401 ||
            alertsResponse.status ===
              401
          ) {
            localStorage.removeItem(
              "aquasentinel_token"
            );

            router.push("/login");
            return;
          }

          const waterData =
            waterResponse.ok
              ? await waterResponse.json()
              : [];

          const fishData =
            fishResponse.ok
              ? await fishResponse.json()
              : [];

          const riskData =
            riskResponse.ok
              ? await riskResponse.json()
              : [];

          const alertData =
            alertsResponse.ok
              ? await alertsResponse.json()
              : [];

          if (!mounted) return;

          const latestWater =
            Array.isArray(waterData)
              ? [...waterData].sort(
                  (a, b) =>
                    new Date(
                      b.recorded_at
                    ).getTime() -
                    new Date(
                      a.recorded_at
                    ).getTime()
                )[0]
              : null;

          const latestFish =
            Array.isArray(fishData)
              ? [...fishData].sort(
                  (a, b) =>
                    new Date(
                      b.observed_at
                    ).getTime() -
                    new Date(
                      a.observed_at
                    ).getTime()
                )[0]
              : null;

          const latestRisk =
            Array.isArray(riskData)
              ? [...riskData].sort(
                  (a, b) =>
                    new Date(
                      b.assessed_at
                    ).getTime() -
                    new Date(
                      a.assessed_at
                    ).getTime()
                )[0]
              : null;

          setWater(
            latestWater || null
          );

          setFish(
            latestFish || null
          );

          setRisk(
            latestRisk || null
          );

          let backendAlerts: Alert[] =
            Array.isArray(alertData)
              ? alertData
              : [];

          /*
           * Temporary dashboard alert when
           * backend has not created one yet.
           */
          if (
            latestRisk &&
            [
              "moderate",
              "medium",
              "high",
              "critical",
            ].includes(
              String(
                latestRisk.risk_level
              ).toLowerCase()
            )
          ) {
            const existingRiskAlert =
              backendAlerts.find(
                (alert) =>
                  alert.risk_assessment_id ===
                  latestRisk.id
              );

            if (
              !existingRiskAlert
            ) {
              const temporaryAlert: Alert =
                {
                  id: -latestRisk.id,
                  pond_id:
                    latestRisk.pond_id,
                  risk_assessment_id:
                    latestRisk.id,
                  alert_level:
                    latestRisk.risk_level,
                  message:
                    latestRisk.contributing_factors
                      ? Array.isArray(
                          latestRisk.contributing_factors
                        )
                        ? latestRisk.contributing_factors.join(
                            ". "
                          )
                        : String(
                            latestRisk.contributing_factors
                          )
                      : "Attention required.",
                  sent_at:
                    latestRisk.assessed_at,
                };

              backendAlerts = [
                temporaryAlert,
                ...backendAlerts,
              ];
            }
          }

          backendAlerts =
            backendAlerts.sort(
              (a, b) =>
                new Date(
                  b.sent_at
                ).getTime() -
                new Date(
                  a.sent_at
                ).getTime()
            );

          setAlerts(
            backendAlerts
          );

          /*
           * Notify only when a genuinely new
           * alert appears.
           */
          const currentIds =
            new Set(
              backendAlerts.map(
                (alert) =>
                  alert.id
              )
            );

          const newAlerts =
            backendAlerts.filter(
              (alert) =>
                !previousAlertIds.current.has(
                  alert.id
                )
            );

          if (
            previousAlertIds.current
              .size > 0
          ) {
            const seriousNewAlert =
              newAlerts.find(
                (alert) => {
                  const level =
                    alert.alert_level.toLowerCase();

                  return [
                    "moderate",
                    "medium",
                    "high",
                    "critical",
                  ].includes(level);
                }
              );

            if (
              seriousNewAlert
            ) {
              playAlertSound(
                seriousNewAlert.alert_level
              );
            }
          }

          previousAlertIds.current =
            currentIds;
        } catch (error) {
          console.error(
            "Failed to load dashboard data:",
            error
          );
        } finally {
          if (mounted) {
            setLoading(false);
          }
        }
      };

    fetchDashboardData();

    const interval =
      setInterval(
        fetchDashboardData,
        10000
      );

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [router]);

  /* =======================================================
     LANGUAGE-AWARE VALUES
     ======================================================= */

  const localizedRisk =
    useMemo(() => {
      return normalizeRiskLevel(
        risk?.risk_level
      );
    }, [risk?.risk_level]);

  const localizedRiskLabel =
    t.common[
      localizedRisk.toLowerCase() as
        | "low"
        | "moderate"
        | "medium"
        | "high"
        | "critical"
    ];

  const localizedFactors =
    useMemo(() => {
      if (
        !risk?.contributing_factors
      ) {
        return [];
      }

      const rawFactors =
        Array.isArray(
          risk.contributing_factors
        )
          ? risk.contributing_factors
          : String(
              risk.contributing_factors
            ).split(",");

      return rawFactors
        .map((factor) => {
          const key =
            getFactorTranslationKey(
              String(factor).trim()
            );

          return key
            ? t.factors[key]
            : String(
                factor
              ).trim();
        })
        .filter(Boolean);
    }, [
      risk?.contributing_factors,
      alertLanguage,
    ]);

  const unreadAlerts =
    alerts.filter(
      (alert) =>
        !readAlertIds.includes(
          alert.id
        )
    );

  /* =======================================================
     ALERT PRESENTATION
     ======================================================= */

  const getAlertPresentation = (
    alert: Alert
  ) => {
    const riskLevel =
      normalizeRiskLevel(
        alert.alert_level
      );

    return {
      riskLevel,

      riskLabel:
        t.common[
          riskLevel.toLowerCase() as
            | "low"
            | "moderate"
            | "medium"
            | "high"
            | "critical"
        ],

      alertLabel:
        t.alerts.riskAlert,

      pondLabel:
        t.common.pond,

      detailsLabel:
        t.common.details,

      message:
        translateAlertMessage(
          alert.message,
          alertLanguage
        ),

      date: formatDate(
        alert.sent_at,
        alertLanguage
      ),
    };
  };

  /* =======================================================
     VOICE TEXT
     ======================================================= */

  /*
   * THIS is the exact text that will be spoken.
   *
   * It deliberately contains ONLY:
   *
   * 1. Alert identification
   * 2. Risk level
   * 3. Pond
   * 4. Detected issue
   * 5. Recommended action
   *
   * It does NOT include dashboard navigation,
   * metrics, headings, dates or unrelated information.
   */
  const getVoiceText = (
    alert: Alert,
    language: AlertLanguage
  ): string => {
    const presentation =
      getAlertPresentation(
        alert
      );

    const voice =
      translations[
        language
      ].voice;

    const pondName =
      `${translations[language].common.pond} ${
        alert.pond_id
      }`;

    return [
      voice.prefix,

      `${presentation.riskLabel} ${voice.detected} ${pondName}.`,

      presentation.message,

      voice.action,
    ]
      .filter(Boolean)
      .join(" ");
  };

  /* =======================================================
     TEXT TO SPEECH
     ======================================================= */

  const stopSpeaking = () => {
    if (
      typeof window !== "undefined" &&
      "speechSynthesis" in window
    ) {
      window.speechSynthesis.cancel();
    }

    setSpeakingAlertId(null);
  };

  const speakAlert = (
    alert: Alert
  ) => {
    if (
      typeof window ===
        "undefined" ||
      !("speechSynthesis" in window)
    ) {
      setVoiceStatus(
        t.alerts.voiceUnsupported
      );

      return;
    }

    const speech =
      window.speechSynthesis;

    /*
     * If this alert is already being spoken,
     * clicking the button stops it.
     */
    if (
      speakingAlertId ===
      alert.id
    ) {
      stopSpeaking();
      return;
    }

    speech.cancel();

    const voice =
      findVoiceForLanguage(
        availableVoices,
        alertLanguage
      );

    /*
     * IMPORTANT:
     *
     * We DO NOT fall back to English
     * when Twi, Dagbani or Hausa has
     * no available voice.
     */
    if (!voice) {
      setSpeakingAlertId(null);

      setVoiceStatus(
        t.alerts.voiceUnavailable
      );

      return;
    }

    const voiceText =
      getVoiceText(
        alert,
        alertLanguage
      );

    const utterance =
      new SpeechSynthesisUtterance(
        voiceText
      );

    utterance.voice = voice;

    utterance.lang =
      voice.lang;

    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.volume = 1;

    utterance.onstart = () => {
      setSpeakingAlertId(
        alert.id
      );

      setVoiceStatus(null);
    };

    utterance.onend = () => {
      setSpeakingAlertId(
        null
      );
    };

    utterance.onerror = (
      event
    ) => {
      console.error(
        "Speech synthesis error:",
        event
      );

      setSpeakingAlertId(
        null
      );

      setVoiceStatus(
        t.alerts.voiceError
      );
    };

    speech.speak(
      utterance
    );
  };

  /* =======================================================
     ALERT ACTIONS
     ======================================================= */

  const markAlertAsRead = (
    id: number
  ) => {
    setReadAlertIds(
      (previous) => {
        if (
          previous.includes(id)
        ) {
          return previous;
        }

        const updated = [
          ...previous,
          id,
        ];

        localStorage.setItem(
          "aquasentinel_read_alerts",
          JSON.stringify(
            updated
          )
        );

        return updated;
      }
    );
  };

  const markAllAlertsAsRead =
    () => {
      const allIds =
        alerts.map(
          (alert) =>
            alert.id
        );

      setReadAlertIds(
        allIds
      );

      localStorage.setItem(
        "aquasentinel_read_alerts",
        JSON.stringify(
          allIds
        )
      );
    };

  /* =======================================================
     METRICS
     ======================================================= */

  const temperature =
    water?.temperature ??
    null;

  const ph =
    water?.ph ?? null;

  const oxygen =
    water?.dissolved_oxygen ??
    null;

  const activity =
    fish?.activity_level ??
    null;

  const temperatureAttention =
    temperature !== null &&
    (
      temperature < 24 ||
      temperature > 30
    );

  const phAttention =
    ph !== null &&
    (
      ph < 6.8 ||
      ph > 8
    );

  const oxygenAttention =
    oxygen !== null &&
    (
      oxygen < 5 ||
      oxygen > 8
    );

  const riskPercentage =
    getRiskPercentage(
      localizedRisk
    );

  const numericalRiskScore =
    getRiskScore(
      risk?.risk_score
    );

  const hasAttention =
    localizedRisk !==
    "Low";

  const anomalyDetected =
    Boolean(
      risk?.ml_anomaly
    );

  /* =======================================================
     RENDER
     ======================================================= */

  return (
    <main
      className="min-h-screen text-white"
      style={{
        background:
          "#022b30",
      }}
      onClick={
        initializeAudio
      }
    >
      <div className="flex min-h-screen">

        {/* =================================================
            DESKTOP SIDEBAR
            ================================================= */}

        <aside className="hidden w-64 shrink-0 border-r border-white/10 bg-[#01252a] lg:flex lg:flex-col">
          <div className="flex h-full flex-col">

            <div className="flex items-center gap-3 px-6 py-6">
              <Image
                src="/logo.jpg"
                alt="AquaSentinel Labs"
                width={42}
                height={42}
                className="rounded-xl object-cover"
              />

              <div>
                <p className="text-sm font-bold">
                  AquaSentinel
                </p>

                <p className="text-[10px] uppercase tracking-[0.2em] text-teal-300">
                  Labs
                </p>
              </div>
            </div>

            <nav className="mt-6 flex-1 px-4">
              <div className="space-y-2">

                <SidebarLink
                  href="/"
                  label={
                    t.nav.dashboard
                  }
                  active
                  icon="dashboard"
                />

                <SidebarLink
                  href="/ponds"
                  label={
                    t.nav.ponds
                  }
                  icon="pond"
                />

                <SidebarLink
                  href="/insights"
                  label={
                    t.nav.insights
                  }
                  icon="insight"
                />

                <SidebarLink
                  href="/alerts"
                  label={
                    t.nav.alerts
                  }
                  icon="alert"
                />

                <SidebarLink
                  href="/history"
                  label={
                    t.nav.history
                  }
                  icon="history"
                />

              </div>
            </nav>

            <div className="border-t border-white/10 p-5">
              <div className="rounded-2xl bg-white/5 p-4">

                <p className="text-xs font-semibold">
                  {t.hero.farm}
                </p>

                <p className="mt-1 text-xs text-white/45">
                  {t.hero.location}
                </p>

                <div className="mt-4 flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-teal-400" />

                  <span className="text-[11px] text-teal-300">
                    {t.common.active}
                  </span>
                </div>

              </div>
            </div>

          </div>
        </aside>

        {/* =================================================
            MAIN CONTENT
            ================================================= */}

        <div className="min-w-0 flex-1">

          {/* =================================================
              TOP BAR
              ================================================= */}

          <header className="sticky top-0 z-40 border-b border-white/10 bg-[#022b30]/95 backdrop-blur-xl">

            <div className="flex h-20 items-center justify-between px-4 sm:px-6 lg:px-8">

              {/* MOBILE BRAND */}

              <div className="flex items-center gap-3 lg:hidden">

                <Image
                  src="/logo.jpg"
                  alt="AquaSentinel Labs"
                  width={38}
                  height={38}
                  className="rounded-xl object-cover"
                />

                <div>
                  <p className="text-sm font-bold">
                    AquaSentinel
                  </p>

                  <p className="text-[9px] uppercase tracking-[0.18em] text-teal-300">
                    Labs
                  </p>
                </div>

              </div>

              {/* DESKTOP TITLE */}

              <div className="hidden lg:block">

                <p className="text-xs uppercase tracking-[0.2em] text-white/35">
                  {t.nav.dashboard}
                </p>

                <p className="mt-1 text-sm text-white/70">
                  {t.hero.farm} •{" "}
                  {t.hero.location}
                </p>

              </div>

              <div className="flex items-center gap-3">

                {/* LANGUAGE SELECTOR */}

                <select
                  value={
                    alertLanguage
                  }
                  onChange={(
                    event
                  ) => {
                    setAlertLanguage(
                      event.target
                        .value as AlertLanguage
                    );
                  }}
                  className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white outline-none transition focus:border-teal-400/50"
                  onClick={(
                    event
                  ) =>
                    event.stopPropagation()
                  }
                >
                  <option
                    value="English"
                    className="bg-[#022b30]"
                  >
                    English
                  </option>

                  <option
                    value="Twi"
                    className="bg-[#022b30]"
                  >
                    Twi
                  </option>

                  <option
                    value="Dagbani"
                    className="bg-[#022b30]"
                  >
                    Dagbani
                  </option>

                  <option
                    value="Hausa"
                    className="bg-[#022b30]"
                  >
                    Hausa
                  </option>
                </select>

                {/* NOTIFICATION BUTTON */}

                <div className="relative">

                  <button
                    onClick={(
                      event
                    ) => {
                      event.stopPropagation();

                      initializeAudio();

                      setNotificationsOpen(
                        !notificationsOpen
                      );
                    }}
                    className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 transition hover:bg-white/10"
                    aria-label={
                      t.alerts.title
                    }
                  >

                    <svg
                      width="19"
                      height="19"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="text-white/80"
                    >
                      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
                      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                    </svg>

                    {unreadAlerts.length >
                      0 && (
                      <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold">
                        {unreadAlerts.length >
                        9
                          ? "9+"
                          : unreadAlerts.length}
                      </span>
                    )}

                  </button>

                  {/* NOTIFICATION PANEL */}

                  {notificationsOpen && (
                    <div
                      className="absolute right-0 top-14 z-50 w-[min(380px,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-white/10 bg-[#07343a] shadow-2xl"
                      onClick={(
                        event
                      ) =>
                        event.stopPropagation()
                      }
                    >

                      <div className="flex items-center justify-between border-b border-white/10 px-4 py-4">

                        <div>

                          <p className="text-sm font-semibold">
                            {t.alerts.title}
                          </p>

                          <p className="mt-1 text-[11px] text-white/40">
                            {
                              unreadAlerts.length
                            }{" "}
                            {
                              t.alerts.unread
                            }
                          </p>

                        </div>

                        {alerts.length >
                          0 && (
                          <button
                            onClick={
                              markAllAlertsAsRead
                            }
                            className="text-[10px] font-medium text-teal-300 hover:text-teal-200"
                          >
                            {
                              t.alerts
                                .markAllRead
                            }
                          </button>
                        )}

                      </div>

                      <div className="max-h-[420px] overflow-y-auto">

                        {alerts.length ===
                        0 ? (
                          <div className="px-5 py-10 text-center">

                            <p className="text-sm text-white/50">
                              {
                                t.alerts
                                  .noAlerts
                              }
                            </p>

                          </div>
                        ) : (
                          alerts.map(
                            (
                              alert
                            ) => {
                              const presentation =
                                getAlertPresentation(
                                  alert
                                );

                              const isRead =
                                readAlertIds.includes(
                                  alert.id
                                );

                              const isSpeaking =
                                speakingAlertId ===
                                alert.id;

                              return (
                                <div
                                  key={
                                    alert.id
                                  }
                                  onClick={() =>
                                    markAlertAsRead(
                                      alert.id
                                    )
                                  }
                                  className={`border-b border-white/5 p-4 transition hover:bg-white/5 ${
                                    !isRead
                                      ? "bg-white/[0.035]"
                                      : ""
                                  }`}
                                >

                                  <div className="flex gap-3">

                                    <span
                                      className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${getRiskDotClass(
                                        presentation.riskLevel
                                      )}`}
                                    />

                                    <div className="min-w-0 flex-1">

                                      <div className="flex items-start justify-between gap-3">

                                        <p className="text-xs font-semibold">
                                          {
                                            presentation.riskLabel
                                          }
                                        </p>

                                        {!isRead && (
                                          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-teal-300" />
                                        )}

                                      </div>

                                      <p className="mt-1 text-xs leading-5 text-white/65">
                                        {
                                          presentation.message
                                        }
                                      </p>

                                      <div className="mt-3 flex items-center justify-between gap-3">

                                        <p className="text-[10px] text-white/30">
                                          {
                                            presentation.date
                                          }
                                        </p>

                                        <button
                                          onClick={(
                                            event
                                          ) => {
                                            event.stopPropagation();

                                            speakAlert(
                                              alert
                                            );
                                          }}
                                          className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[10px] font-medium transition ${
                                            isSpeaking
                                              ? "border-red-400/30 bg-red-400/10 text-red-300"
                                              : "border-teal-400/20 bg-teal-400/5 text-teal-300 hover:bg-teal-400/10"
                                          }`}
                                          aria-label={
                                            isSpeaking
                                              ? t
                                                  .alerts
                                                  .stopVoice
                                              : t
                                                  .alerts
                                                  .readAloud
                                          }
                                        >

                                          {isSpeaking ? (
                                            <>
                                              <svg
                                                width="13"
                                                height="13"
                                                viewBox="0 0 24 24"
                                                fill="currentColor"
                                              >
                                                <rect
                                                  x="6"
                                                  y="6"
                                                  width="12"
                                                  height="12"
                                                  rx="1"
                                                />
                                              </svg>

                                              {
                                                t
                                                  .alerts
                                                  .stopVoice
                                              }
                                            </>
                                          ) : (
                                            <>
                                              <svg
                                                width="13"
                                                height="13"
                                                viewBox="0 0 24 24"
                                                fill="none"
                                                stroke="currentColor"
                                                strokeWidth="1.8"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                              >
                                                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                                                <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
                                                <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                                              </svg>

                                              {
                                                t
                                                  .alerts
                                                  .readAloud
                                              }
                                            </>
                                          )}

                                        </button>

                                      </div>

                                      {!isRead && (
                                        <button
                                          onClick={(
                                            event
                                          ) => {
                                            event.stopPropagation();

                                            markAlertAsRead(
                                              alert.id
                                            );
                                          }}
                                          className="mt-2 text-[10px] font-medium text-white/40 hover:text-white/70"
                                        >
                                          {
                                            t
                                              .alerts
                                              .markRead
                                          }
                                        </button>
                                      )}

                                    </div>

                                  </div>

                                </div>
                              );
                            }
                          )
                        )}

                      </div>

                    </div>
                  )}

                </div>

                {/* FARM USER */}

                <div className="hidden items-center gap-3 sm:flex">

                  <div className="text-right">

                    <p className="text-xs font-semibold">
                      {t.hero.farm}
                    </p>

                    <p className="text-[10px] text-white/35">
                      {t.hero.location}
                    </p>

                  </div>

                  <button
                    onClick={() => {
                      localStorage.removeItem(
                        "aquasentinel_token"
                      );

                      router.push(
                        "/login"
                      );
                    }}
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-teal-500 text-xs font-bold text-[#022b30]"
                  >
                    S
                  </button>

                </div>

                {/* MOBILE HAMBURGER */}

                <button
                  onClick={(
                    event
                  ) => {
                    event.stopPropagation();

                    setMenuOpen(
                      !menuOpen
                    );
                  }}
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-lg lg:hidden"
                  aria-label="Menu"
                >
                  {menuOpen
                    ? "✕"
                    : "☰"}
                </button>

              </div>
            </div>

            {/* MOBILE MENU */}

            {menuOpen && (
              <div className="border-t border-white/10 bg-[#01252a] px-4 py-4 lg:hidden">

                <div className="space-y-2">

                  <MobileNavLink
                    href="/"
                    label={
                      t.nav.dashboard
                    }
                    active
                    onClick={() =>
                      setMenuOpen(
                        false
                      )
                    }
                  />

                  <MobileNavLink
                    href="/ponds"
                    label={
                      t.nav.ponds
                    }
                    onClick={() =>
                      setMenuOpen(
                        false
                      )
                    }
                  />

                  <MobileNavLink
                    href="/insights"
                    label={
                      t.nav.insights
                    }
                    onClick={() =>
                      setMenuOpen(
                        false
                      )
                    }
                  />

                  <MobileNavLink
                    href="/alerts"
                    label={
                      t.nav.alerts
                    }
                    onClick={() =>
                      setMenuOpen(
                        false
                      )
                    }
                  />

                  <MobileNavLink
                    href="/history"
                    label={
                      t.nav.history
                    }
                    onClick={() =>
                      setMenuOpen(
                        false
                      )
                    }
                  />

                </div>

              </div>
            )}

          </header>

          {/* =================================================
              CONTENT
              ================================================= */}

          <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">

            {/* HERO */}

            <section className="mb-8">

              <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">

                <div>

                  <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-teal-400/20 bg-teal-400/5 px-3 py-1.5">

                    <span className="h-1.5 w-1.5 rounded-full bg-teal-300" />

                    <span className="text-[10px] font-semibold tracking-[0.16em] text-teal-300">
                      {
                        t.hero.badge
                      }
                    </span>

                  </div>

                  <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                    {
                      getTimeGreeting(
                        alertLanguage
                      )
                    }
                  </h1>

                  <p className="mt-3 max-w-2xl text-sm leading-6 text-white/45">
                    {
                      t.hero.monitoring
                    }
                  </p>

                </div>

                <div className="rounded-2xl border border-white/10 bg-white/[0.035] px-4 py-3">

                  <p className="text-[10px] uppercase tracking-[0.15em] text-white/30">
                    {t.common.status}
                  </p>

                  <div className="mt-2 flex items-center gap-2">

                    <span className="h-2 w-2 rounded-full bg-teal-400" />

                    <span className="text-xs font-medium text-teal-300">
                      {t.common.active}
                    </span>

                  </div>

                </div>

              </div>

            </section>

            {/* METRICS */}

            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

              <MetricCard
                title={
                  t.metrics.temperature
                }
                value={
                  temperature !==
                  null
                    ? `${temperature.toFixed(
                        1
                      )}°C`
                    : "--"
                }
                subtitle={
                  temperatureAttention
                    ? t.metrics.attention
                    : t.metrics.optimal
                }
                attention={
                  temperatureAttention
                }
                icon="temperature"
              />

              <MetricCard
                title={
                  t.metrics.ph
                }
                value={
                  ph !== null
                    ? ph.toFixed(
                        1
                      )
                    : "--"
                }
                subtitle={
                  phAttention
                    ? t.metrics.attention
                    : t.metrics.optimal
                }
                attention={
                  phAttention
                }
                icon="ph"
              />

              <MetricCard
                title={
                  t.metrics.oxygen
                }
                value={
                  oxygen !==
                  null
                    ? `${oxygen.toFixed(
                        1
                      )}`
                    : "--"
                }
                subtitle={
                  oxygenAttention
                    ? t.metrics.attention
                    : t.metrics.optimal
                }
                attention={
                  oxygenAttention
                }
                icon="oxygen"
              />

              <MetricCard
                title={
                  t.metrics.fishActivity
                }
                value={
                  activity ||
                  "--"
                }
                subtitle={
                  fish?.unusual_behaviour
                    ? t.metrics.attention
                    : t.metrics.optimal
                }
                attention={Boolean(
                  fish?.unusual_behaviour
                )}
                icon="fish"
              />

            </section>

            {/* MAIN GRID */}

            <section className="mt-6 grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">

              {/* FISH BEHAVIOUR */}

              <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-5 sm:p-6">

                <div className="flex items-start justify-between">

                  <div>

                    <p className="text-sm font-semibold">
                      {t.fish.title}
                    </p>

                    <p className="mt-1 text-xs text-white/35">
                      {
                        t.fish
                          .monitoring
                      }
                    </p>

                  </div>

                  <div className="rounded-xl bg-teal-400/10 p-2 text-teal-300">

                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.7"
                    >
                      <path d="M3 12s3.5-5 9-5 9 5 9 5-3.5 5-9 5-9-5-9-5Z" />
                      <circle
                        cx="12"
                        cy="12"
                        r="2"
                      />
                    </svg>

                  </div>

                </div>

                <div className="mt-6 grid gap-3 sm:grid-cols-2">

                  <InfoBox
                    label={
                      t.fish.activity
                    }
                    value={
                      fish?.activity_level ||
                      "--"
                    }
                  />

                  <InfoBox
                    label={
                      t.fish.feeding
                    }
                    value={
                      fish?.feeding_response ||
                      "--"
                    }
                  />

                  <InfoBox
                    label={
                      t.fish.unusual
                    }
                    value={
                      fish?.unusual_behaviour
                        ? t.fish.observed
                        : t.fish.noneObserved
                    }
                    danger={Boolean(
                      fish?.unusual_behaviour
                    )}
                  />

                  <InfoBox
                    label={
                      t.fish.fishCount
                    }
                    value={
                      fish?.fish_count !==
                      undefined
                        ? String(
                            fish.fish_count
                          )
                        : "--"
                    }
                  />

                </div>

              </div>

              {/* RISK */}

              <div
                className={`rounded-3xl border p-5 sm:p-6 ${getRiskColorClass(
                  localizedRisk
                )}`}
              >

                <div className="flex items-start justify-between">

                  <div>

                    <p className="text-sm font-semibold text-white">
                      {t.risk.title}
                    </p>

                    <p className="mt-1 text-xs leading-5 text-white/45">
                      {
                        t.risk.subtitle
                      }
                    </p>

                  </div>

                  <div
                    className={`rounded-xl px-3 py-2 text-xs font-semibold ${getRiskColorClass(
                      localizedRisk
                    )}`}
                  >
                    {
                      localizedRiskLabel
                    }
                  </div>

                </div>

                <div className="mt-6">

                  <div className="flex items-end justify-between">

                    <div>

                      <p className="text-[10px] uppercase tracking-[0.15em] text-white/35">
                        {
                          t.risk
                            .riskScore
                        }
                      </p>

                      <p className="mt-1 text-4xl font-semibold">
                        {
                          numericalRiskScore
                        }

                        <span className="text-lg text-white/30">
                          /100
                        </span>
                      </p>

                    </div>

                    <p className="text-xs text-white/40">
                      {
                        localizedRiskLabel
                      }
                    </p>

                  </div>

                  <div className="mt-4 h-2 overflow-hidden rounded-full bg-black/20">

                    <div
                      className={`h-full rounded-full transition-all duration-700 ${
                        localizedRisk ===
                          "High" ||
                        localizedRisk ===
                          "Critical"
                          ? "bg-red-400"
                          : localizedRisk ===
                              "Moderate" ||
                            localizedRisk ===
                              "Medium"
                          ? "bg-amber-400"
                          : "bg-teal-400"
                      }`}
                      style={{
                        width: `${Math.max(
                          numericalRiskScore,
                          riskPercentage
                        )}%`,
                      }}
                    />

                  </div>

                </div>

                {hasAttention && (
                  <div className="mt-5 rounded-2xl border border-red-400/20 bg-red-500/10 p-4">

                    <div className="flex gap-3">

                      <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-red-400" />

                      <div>

                        <p className="text-xs font-semibold text-red-300">
                          {
                            t.common
                              .attentionRequired
                          }
                        </p>

                        <p className="mt-1 text-xs leading-5 text-white/55">
                          {
                            t.risk
                              .attention
                          }
                        </p>

                      </div>

                    </div>

                  </div>
                )}

                <div className="mt-6">

                  <p className="text-[10px] uppercase tracking-[0.15em] text-white/35">
                    {
                      t.risk
                        .contributingFactors
                    }
                  </p>

                  <div className="mt-3 flex flex-wrap gap-2">

                    {localizedFactors.length ===
                    0 ? (
                      <span className="text-xs text-white/40">
                        {
                          t.risk
                            .noFactors
                        }
                      </span>
                    ) : (
                      localizedFactors.map(
                        (
                          factor,
                          index
                        ) => (
                          <span
                            key={`${factor}-${index}`}
                            className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] text-white/65"
                          >
                            {factor}
                          </span>
                        )
                      )
                    )}

                  </div>

                </div>

              </div>

            </section>

            {/* AI / ML */}

            <section className="mt-6 rounded-3xl border border-teal-400/15 bg-[#07343a] p-5 sm:p-6">

              <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">

                <div className="max-w-2xl">

                  <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-teal-300/20 bg-teal-300/5 px-3 py-1.5">

                    <span className="h-1.5 w-1.5 rounded-full bg-teal-300" />

                    <span className="text-[10px] font-semibold tracking-[0.16em] text-teal-300">
                      {t.ml.title}
                    </span>

                  </div>

                  <h2 className="text-lg font-semibold">
                    {
                      t.ml
                        .anomalyDetection
                    }
                  </h2>

                  <p className="mt-2 text-xs leading-6 text-white/45">
                    {
                      t.ml.explanation
                    }
                  </p>

                </div>

                <div className="min-w-[220px] rounded-2xl border border-white/10 bg-black/10 p-4">

                  <div className="flex items-center justify-between">

                    <p className="text-xs text-white/45">
                      {
                        t.ml
                          .anomalyDetection
                      }
                    </p>

                    <span
                      className={`h-2.5 w-2.5 rounded-full ${
                        anomalyDetected
                          ? "bg-amber-400"
                          : "bg-teal-400"
                      }`}
                    />

                  </div>

                  <p className="mt-3 text-sm font-semibold">
                    {anomalyDetected
                      ? t.ml
                          .anomalyDetected
                      : t.ml
                          .noAnomaly}
                  </p>

                  <div className="mt-4">

                    <div className="flex justify-between text-[10px] text-white/35">

                      <span>
                        {
                          t.ml
                            .anomalyScore
                        }
                      </span>

                      <span>
                        {risk?.ml_anomaly_score !==
                          null &&
                        risk?.ml_anomaly_score !==
                          undefined
                          ? risk.ml_anomaly_score.toFixed(
                              3
                            )
                          : "--"}
                      </span>

                    </div>

                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-black/20">

                      <div
                        className={`h-full rounded-full ${
                          anomalyDetected
                            ? "bg-amber-400"
                            : "bg-teal-400"
                        }`}
                        style={{
                          width:
                            anomalyDetected
                              ? "75%"
                              : "15%",
                        }}
                      />

                    </div>

                  </div>

                </div>

              </div>

            </section>

            {/* REASONING + STATUS */}

            <section className="mt-6 grid gap-6 lg:grid-cols-2">

              <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-5 sm:p-6">

                <p className="text-sm font-semibold">
                  {
                    t.risk
                      .reasoningTitle
                  }
                </p>

                <p className="mt-3 text-sm leading-7 text-white/45">
                  {
                    t.risk.reasoning
                  }
                </p>

                <div className="mt-5 grid gap-3 sm:grid-cols-3">

                  <ReasoningStep
                    number="01"
                    title={
                      alertLanguage ===
                      "English"
                        ? "Observe"
                        : alertLanguage ===
                          "Twi"
                        ? "Hwɛ"
                        : alertLanguage ===
                          "Hausa"
                        ? "Duba"
                        : "Nyɛ"
                    }
                  />

                  <ReasoningStep
                    number="02"
                    title={
                      alertLanguage ===
                      "English"
                        ? "Analyze"
                        : alertLanguage ===
                          "Twi"
                        ? "Hwehwɛ mu"
                        : alertLanguage ===
                          "Hausa"
                        ? "Nazari"
                        : "Hwehwɛ"
                    }
                  />

                  <ReasoningStep
                    number="03"
                    title={
                      alertLanguage ===
                      "English"
                        ? "Recommend"
                        : alertLanguage ===
                          "Twi"
                        ? "Ma afotu"
                        : alertLanguage ===
                          "Hausa"
                        ? "Ba da shawara"
                        : "Ma afotu"
                    }
                  />

                </div>

              </div>

              <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-5 sm:p-6">

                <div className="flex items-start justify-between">

                  <div>

                    <p className="text-sm font-semibold">
                      {
                        t.risk
                          .statusTitle
                      }
                    </p>

                    <p className="mt-1 text-xs text-white/35">
                      {
                        t.common
                          .current
                      }
                    </p>

                  </div>

                  <span
                    className={`h-3 w-3 rounded-full ${getRiskDotClass(
                      localizedRisk
                    )}`}
                  />

                </div>

                <div className="mt-6">

                  <p className="text-2xl font-semibold">
                    {
                      localizedRiskLabel
                    }
                  </p>

                  <p className="mt-3 text-sm leading-6 text-white/45">
                    {hasAttention
                      ? t.risk
                          .statusAttention
                      : t.risk
                          .statusHealthy}
                  </p>

                </div>

                <div className="mt-6 border-t border-white/10 pt-5">

                  <div className="flex items-center justify-between">

                    <span className="text-xs text-white/35">
                      {
                        t.common
                          .status
                      }
                    </span>

                    <span className="flex items-center gap-2 text-xs text-teal-300">

                      <span className="h-1.5 w-1.5 rounded-full bg-teal-400" />

                      {
                        t.common
                          .active
                      }

                    </span>

                  </div>

                </div>

              </div>

            </section>

            {/* ALERT LIST */}

            <section className="mt-6 rounded-3xl border border-white/10 bg-white/[0.035] p-5 sm:p-6">

              <div className="flex items-center justify-between">

                <div>

                  <p className="text-sm font-semibold">
                    {
                      t.alerts
                        .title
                    }
                  </p>

                  <p className="mt-1 text-xs text-white/35">
                    {
                      unreadAlerts.length
                    }{" "}
                    {
                      t.alerts
                        .unread
                    }
                  </p>

                </div>

                {alerts.length >
                  0 && (
                  <button
                    onClick={
                      markAllAlertsAsRead
                    }
                    className="text-xs text-teal-300 hover:text-teal-200"
                  >
                    {
                      t.alerts
                        .markAllRead
                    }
                  </button>
                )}

              </div>

              {/* VOICE STATUS */}

              {voiceStatus && (
                <div className="mt-4 flex items-start justify-between gap-3 rounded-xl border border-amber-400/20 bg-amber-400/5 px-4 py-3">

                  <div className="flex items-start gap-2">

                    <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-amber-400" />

                    <p className="text-[11px] leading-5 text-amber-200/80">
                      {
                        voiceStatus
                      }
                    </p>

                  </div>

                  <button
                    onClick={() =>
                      setVoiceStatus(
                        null
                      )
                    }
                    className="text-xs text-white/40 hover:text-white"
                  >
                    ✕
                  </button>

                </div>
              )}

              <div className="mt-5 space-y-3">

                {alerts.length ===
                0 ? (
                  <div className="rounded-2xl border border-white/5 bg-white/[0.02] px-5 py-8 text-center">

                    <p className="text-sm text-white/40">
                      {
                        t.alerts
                          .noAlerts
                      }
                    </p>

                  </div>
                ) : (
                  alerts
                    .slice(0, 5)
                    .map(
                      (alert) => {
                        const presentation =
                          getAlertPresentation(
                            alert
                          );

                        const isRead =
                          readAlertIds.includes(
                            alert.id
                          );

                        const isSpeaking =
                          speakingAlertId ===
                          alert.id;

                        return (
                          <div
                            key={
                              alert.id
                            }
                            className={`rounded-2xl border p-4 ${getAlertLevelClass(
                              alert.alert_level
                            )} ${
                              isRead
                                ? "opacity-60"
                                : ""
                            }`}
                          >

                            <div className="flex gap-3">

                              <span
                                className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${getRiskDotClass(
                                  presentation.riskLevel
                                )}`}
                              />

                              <div className="min-w-0 flex-1">

                                <div className="flex flex-wrap items-center justify-between gap-2">

                                  <p className="text-xs font-semibold">
                                    {
                                      presentation.riskLabel
                                    }
                                  </p>

                                  <span className="text-[10px] text-white/30">
                                    {
                                      presentation.date
                                    }
                                  </span>

                                </div>

                                <p className="mt-2 text-sm leading-6 text-white/65">
                                  {
                                    presentation.message
                                  }
                                </p>

                                <div className="mt-4 flex flex-wrap items-center justify-between gap-3">

                                  <div className="flex items-center gap-2">

                                    {!isRead && (
                                      <button
                                        onClick={() =>
                                          markAlertAsRead(
                                            alert.id
                                          )
                                        }
                                        className="text-[10px] font-medium text-teal-300 hover:text-teal-200"
                                      >
                                        {
                                          t
                                            .alerts
                                            .markRead
                                        }
                                      </button>
                                    )}

                                  </div>

                                  <button
                                    onClick={() =>
                                      speakAlert(
                                        alert
                                      )
                                    }
                                    className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-[10px] font-medium transition ${
                                      isSpeaking
                                        ? "border-red-400/30 bg-red-400/10 text-red-300"
                                        : "border-teal-400/20 bg-teal-400/5 text-teal-300 hover:bg-teal-400/10"
                                    }`}
                                    aria-label={
                                      isSpeaking
                                        ? t
                                            .alerts
                                            .stopVoice
                                        : t
                                            .alerts
                                            .readAloud
                                    }
                                  >

                                    {isSpeaking ? (
                                      <>
                                        <svg
                                          width="14"
                                          height="14"
                                          viewBox="0 0 24 24"
                                          fill="currentColor"
                                        >
                                          <rect
                                            x="6"
                                            y="6"
                                            width="12"
                                            height="12"
                                            rx="1"
                                          />
                                        </svg>

                                        {
                                          t
                                            .alerts
                                            .stopVoice
                                        }
                                      </>
                                    ) : (
                                      <>
                                        <svg
                                          width="14"
                                          height="14"
                                          viewBox="0 0 24 24"
                                          fill="none"
                                          stroke="currentColor"
                                          strokeWidth="1.8"
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                        >
                                          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                                          <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
                                          <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                                        </svg>

                                        {
                                          t
                                            .alerts
                                            .readAloud
                                        }
                                      </>
                                    )}

                                  </button>

                                </div>

                              </div>

                            </div>

                          </div>
                        );
                      }
                    )
                )}

              </div>

            </section>

            {/* FOOTER */}

            <footer className="mt-10 border-t border-white/10 py-6 text-center">

              <p className="text-[10px] text-white/25">
                {t.footer}
              </p>

            </footer>

          </div>

        </div>

      </div>

      {/* LOADING OVERLAY */}

      {loading && (
        <div className="pointer-events-none fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-full border border-white/10 bg-[#07343a] px-4 py-2 shadow-xl">

          <span className="h-2 w-2 animate-pulse rounded-full bg-teal-400" />

          <span className="text-[10px] text-white/50">
            {
              t.common
                .loading
            }
          </span>

        </div>
      )}

    </main>
  );
}

/* =========================================================
   COMPONENTS
   ========================================================= */

function SidebarLink({
  href,
  label,
  active = false,
  icon,
}: {
  href: string;
  label: string;
  active?: boolean;
  icon: string;
}) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 rounded-xl px-4 py-3 text-xs transition ${
        active
          ? "bg-teal-400/10 text-teal-300"
          : "text-white/45 hover:bg-white/5 hover:text-white"
      }`}
    >
      <NavIcon
        icon={icon}
      />

      <span>
        {label}
      </span>
    </Link>
  );
}

function MobileNavLink({
  href,
  label,
  active = false,
  onClick,
}: {
  href: string;
  label: string;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`block rounded-xl px-4 py-3 text-sm ${
        active
          ? "bg-teal-400/10 text-teal-300"
          : "text-white/55 hover:bg-white/5 hover:text-white"
      }`}
    >
      {label}
    </Link>
  );
}

function NavIcon({
  icon,
}: {
  icon: string;
}) {
  const common = {
    width: 17,
    height: 17,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.7,
    strokeLinecap:
      "round" as const,
    strokeLinejoin:
      "round" as const,
  };

  if (icon === "pond") {
    return (
      <svg {...common}>
        <path d="M3 12c3-5 6-5 9 0s6 5 9 0" />
        <path d="M3 17c3-5 6-5 9 0s6 5 9 0" />
      </svg>
    );
  }

  if (icon === "insight") {
    return (
      <svg {...common}>
        <path d="M4 19V5" />
        <path d="M4 19h16" />
        <path d="m7 15 4-4 3 2 5-6" />
      </svg>
    );
  }

  if (icon === "alert") {
    return (
      <svg {...common}>
        <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      </svg>
    );
  }

  if (icon === "history") {
    return (
      <svg {...common}>
        <path d="M3 12a9 9 0 1 0 3-6.7" />
        <path d="M3 4v5h5" />
        <path d="M12 7v5l3 2" />
      </svg>
    );
  }

  return (
    <svg {...common}>
      <rect
        x="3"
        y="3"
        width="7"
        height="7"
        rx="1"
      />

      <rect
        x="14"
        y="3"
        width="7"
        height="7"
        rx="1"
      />

      <rect
        x="3"
        y="14"
        width="7"
        height="7"
        rx="1"
      />

      <rect
        x="14"
        y="14"
        width="7"
        height="7"
        rx="1"
      />
    </svg>
  );
}

function MetricCard({
  title,
  value,
  subtitle,
  attention = false,
  icon,
}: {
  title: string;
  value: string;
  subtitle: string;
  attention?: boolean;
  icon: string;
}) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-5">

      <div className="flex items-start justify-between">

        <p className="text-xs text-white/40">
          {title}
        </p>

        <span
          className={`rounded-xl p-2 ${
            attention
              ? "bg-amber-400/10 text-amber-300"
              : "bg-teal-400/10 text-teal-300"
          }`}
        >
          {icon ===
            "temperature" &&
            "°"}

          {icon ===
            "ph" &&
            "pH"}

          {icon ===
            "oxygen" &&
            "O₂"}

          {icon ===
            "fish" &&
            "🐟"}
        </span>

      </div>

      <p className="mt-5 text-2xl font-semibold tracking-tight">
        {value}
      </p>

      <div className="mt-3 flex items-center gap-2">

        <span
          className={`h-1.5 w-1.5 rounded-full ${
            attention
              ? "bg-amber-400"
              : "bg-teal-400"
          }`}
        />

        <span
          className={`text-[10px] ${
            attention
              ? "text-amber-300"
              : "text-white/35"
          }`}
        >
          {subtitle}
        </span>

      </div>

    </div>
  );
}

function InfoBox({
  label,
  value,
  danger = false,
}: {
  label: string;
  value: string;
  danger?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-white/5 bg-black/10 p-4">

      <p className="text-[10px] uppercase tracking-[0.12em] text-white/30">
        {label}
      </p>

      <p
        className={`mt-2 text-sm font-medium ${
          danger
            ? "text-red-300"
            : "text-white/75"
        }`}
      >
        {value}
      </p>

    </div>
  );
}

function ReasoningStep({
  number,
  title,
}: {
  number: string;
  title: string;
}) {
  return (
    <div className="rounded-2xl border border-white/5 bg-black/10 p-4">

      <p className="text-[10px] font-semibold text-teal-300">
        {number}
      </p>

      <p className="mt-2 text-xs font-medium text-white/70">
        {title}
      </p>

    </div>
  );
}