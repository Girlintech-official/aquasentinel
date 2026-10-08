"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

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
  unusual_behaviour: string;
  fish_count: number;
  observed_at: string;
};

type RiskAssessment = {
  id: number;
  pond_id: number;
  risk_level: string;
  risk_score: number;
  contributing_factors: string;
  ml_anomaly: boolean;
  ml_anomaly_score: number | null;
  assessed_at: string;
};

type Alert = {
  id: number;
  pond_id: number;
  risk_assessment_id: number | null;
  alert_level: string;
  message: string;
  sent_at: string;
};

export default function Home() {
  const router = useRouter();

  const [water, setWater] =
    useState<WaterReading | null>(null);

  const [fish, setFish] =
    useState<FishObservation | null>(null);

  const [risk, setRisk] =
    useState<RiskAssessment | null>(null);

  const [alerts, setAlerts] =
    useState<Alert[]>([]);

  const [notificationsOpen, setNotificationsOpen] =
    useState(false);

  const [readAlertIds, setReadAlertIds] =
    useState<number[]>([]);

  /*
   * Alert language.
   *
   * The language setting changes the alert labels and
   * keeps the original alert.message intact so detailed
   * risk factors from the backend are never lost.
   */
  type AlertLanguage =
    | "English"
    | "Twi"
    | "Dagbani"
    | "Hausa";

  const [alertLanguage, setAlertLanguage] =
    useState<AlertLanguage>("English");

  const [greeting, setGreeting] =
    useState("Good afternoon.");

  const [menuOpen, setMenuOpen] =
    useState(false);

  /*
   * Tracks alert IDs between polling cycles.
   *
   * null means the dashboard has not completed
   * its first alert check yet.
   */
  const previousAlertIds =
    useRef<number[] | null>(null);

  /*
   * Tracks the latest risk assessment ID so that
   * a new risk assessment can create a notification
   * even when the backend /alerts endpoint has not
   * created an alert yet.
   */
  const previousRiskId =
    useRef<number | null>(null);

  /*
   * Browser audio context.
   */
  const audioContextRef =
    useRef<AudioContext | null>(null);

  /*
   * Authentication
   */
  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem(
        "aquasentinel_token"
      );

      if (!token) {
        router.replace("/login");
      }
    };

    checkAuth();

    window.addEventListener(
      "storage",
      checkAuth
    );

    return () => {
      window.removeEventListener(
        "storage",
        checkAuth
      );
    };
  }, [router]);

  /*
   * Greeting
   */
  useEffect(() => {
    function updateGreeting() {
      const hour = new Date().getHours();

      setGreeting(
        hour < 12
          ? "Good morning."
          : hour < 17
          ? "Good afternoon."
          : "Good evening."
      );
    }

    updateGreeting();

    const greetingInterval =
      setInterval(
        updateGreeting,
        60000
      );

    return () =>
      clearInterval(
        greetingInterval
      );
  }, []);

  /*
   * Load previously read notifications.
   */
  useEffect(() => {
    try {
      const stored =
        localStorage.getItem(
          "aquasentinel_read_alerts"
        );

      if (stored) {
        const parsed =
          JSON.parse(stored);

        if (Array.isArray(parsed)) {
          setReadAlertIds(parsed);
        }
      }
    } catch (error) {
      console.error(
        "Could not load notification state:",
        error
      );
    }
  }, []);

  /*
   * Enable browser audio after the user
   * interacts with the dashboard.
   */
  useEffect(() => {
    const enableAudio = () => {
      if (
        typeof window === "undefined"
      ) {
        return;
      }

      const AudioContextClass =
        window.AudioContext ||
        (
          window as typeof window & {
            webkitAudioContext?: typeof AudioContext;
          }
        ).webkitAudioContext;

      if (!AudioContextClass) {
        return;
      }

      if (
        !audioContextRef.current
      ) {
        audioContextRef.current =
          new AudioContextClass();
      }

      if (
        audioContextRef.current.state ===
        "suspended"
      ) {
        audioContextRef.current
          .resume()
          .catch(() => {});
      }
    };

    window.addEventListener(
      "click",
      enableAudio,
      { once: true }
    );

    return () => {
      window.removeEventListener(
        "click",
        enableAudio
      );
    };
  }, []);

  /*
   * Audible alert.
   *
   * Moderate / Medium = 2 beeps
   * High / Critical = 3 beeps
   */
  const playAlertSound = (
    level: string
  ) => {
    if (
      typeof window === "undefined"
    ) {
      return;
    }

    const AudioContextClass =
      window.AudioContext ||
      (
        window as typeof window & {
          webkitAudioContext?: typeof AudioContext;
        }
      ).webkitAudioContext;

    if (!AudioContextClass) {
      return;
    }

    if (
      !audioContextRef.current
    ) {
      audioContextRef.current =
        new AudioContextClass();
    }

    const audioContext =
      audioContextRef.current;

    if (
      audioContext.state ===
      "suspended"
    ) {
      audioContext
        .resume()
        .catch(() => {});
    }

    const normalizedLevel =
      level.toLowerCase().trim();

    const isHigh =
      normalizedLevel === "high" ||
      normalizedLevel === "critical";

    const beepCount =
      isHigh ? 3 : 2;

    const frequency =
      isHigh ? 880 : 660;

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
        frequency;

      const startTime =
        audioContext.currentTime +
        i * 0.18;

      const endTime =
        startTime + 0.11;

      gainNode.gain.setValueAtTime(
        0.0001,
        startTime
      );

      gainNode.gain.exponentialRampToValueAtTime(
        0.18,
        startTime + 0.01
      );

      gainNode.gain.exponentialRampToValueAtTime(
        0.0001,
        endTime
      );

      oscillator.connect(
        gainNode
      );

      gainNode.connect(
        audioContext.destination
      );

      oscillator.start(
        startTime
      );

      oscillator.stop(
        endTime
      );
    }
  };

  /*
   * Dashboard data + notification monitoring.
   */
  useEffect(() => {
    async function loadData() {
      try {
        const token =
          localStorage.getItem(
            "aquasentinel_token"
          );

        if (!token) {
          console.error(
            "No token found"
          );
          return;
        }

        const headers: HeadersInit = {
          Authorization: `Bearer ${token}`,
        };

        const [
          waterRes,
          fishRes,
          riskRes,
          alertsRes,
        ] = await Promise.all([
          fetch(
            "https://aquasentinel-api-q232.onrender.com/water-readings",
            { headers }
          ),

          fetch(
            "https://aquasentinel-api-q232.onrender.com/fish-observations",
            { headers }
          ),

          fetch(
            "https://aquasentinel-api-q232.onrender.com/risk-assessments",
            { headers }
          ),

          fetch(
            "https://aquasentinel-api-q232.onrender.com/alerts",
            { headers }
          ),
        ]);

        const waterData =
          await waterRes.json();

        const fishData =
          await fishRes.json();

        const riskData =
          await riskRes.json();

        const alertsData =
          alertsRes.ok
            ? await alertsRes.json()
            : [];

        /*
         * Get latest risk assessment.
         */
        const latestRisk: RiskAssessment | null =
          Array.isArray(riskData)
            ? riskData[0] || null
            : null;

        /*
         * Update dashboard data.
         */
        setWater(
          Array.isArray(waterData)
            ? waterData[0] || null
            : null
        );

        setFish(
          Array.isArray(fishData)
            ? fishData[0] || null
            : null
        );

        setRisk(latestRisk);

        /*
         * Start with real backend alerts.
         */
        let nextAlerts: Alert[] =
          Array.isArray(alertsData)
            ? alertsData
            : [];

        /*
         * ------------------------------------------------
         * IMPORTANT NOTIFICATION FIX
         * ------------------------------------------------
         *
         * If the latest risk is Moderate/Medium/High/
         * Critical but the backend has not yet created
         * an alert for that risk assessment, create a
         * temporary dashboard notification.
         *
         * The ID is negative so it cannot collide with
         * a real database alert ID.
         */
        if (latestRisk) {
          const normalizedRisk =
            latestRisk.risk_level
              .toLowerCase()
              .trim();

          const isRiskAlert =
            normalizedRisk ===
              "moderate" ||
            normalizedRisk ===
              "medium" ||
            normalizedRisk ===
              "high" ||
            normalizedRisk ===
              "critical";

          const alreadyHasRiskAlert =
            nextAlerts.some(
              (alert) =>
                alert.risk_assessment_id ===
                latestRisk.id
            );

          if (
            isRiskAlert &&
            !alreadyHasRiskAlert
          ) {
            const localRiskAlert: Alert =
              {
                /*
                 * Stable ID for this specific
                 * risk assessment.
                 */
                id: -latestRisk.id,

                pond_id:
                  latestRisk.pond_id,

                risk_assessment_id:
                  latestRisk.id,

                alert_level:
                  latestRisk.risk_level,

                message:
                  latestRisk.contributing_factors ||
                  `AquaSentinel detected ${latestRisk.risk_level.toLowerCase()} risk conditions.`,

                sent_at:
                  latestRisk.assessed_at,
              };

            nextAlerts = [
              localRiskAlert,
              ...nextAlerts,
            ];
          }
        }

        /*
         * Remove duplicate alert IDs.
         */
        const uniqueAlerts =
          Array.from(
            new Map(
              nextAlerts.map(
                (alert) => [
                  alert.id,
                  alert,
                ]
              )
            ).values()
          );

        /*
         * Newest notifications first.
         */
        uniqueAlerts.sort(
          (a, b) =>
            new Date(
              b.sent_at
            ).getTime() -
            new Date(
              a.sent_at
            ).getTime()
        );

        nextAlerts =
          uniqueAlerts;

        /*
         * IDs currently returned by the
         * notification system.
         */
        const nextAlertIds =
          nextAlerts.map(
            (alert) => alert.id
          );

        /*
         * ------------------------------------------------
         * SOUND DETECTION
         * ------------------------------------------------
         *
         * We only make a sound after the first
         * dashboard load.
         *
         * Existing alerts on page load do NOT beep.
         */
        if (
          previousAlertIds.current !==
          null
        ) {
          const newAlerts =
            nextAlerts.filter(
              (alert) =>
                !previousAlertIds.current!.includes(
                  alert.id
                )
            );

          const newRiskAlerts =
            newAlerts.filter(
              (alert) => {
                const level =
                  alert.alert_level
                    .toLowerCase()
                    .trim();

                return (
                  level ===
                    "moderate" ||
                  level ===
                    "medium" ||
                  level ===
                    "high" ||
                  level ===
                    "critical"
                );
              }
            );

          if (
            newRiskAlerts.length >
            0
          ) {
            /*
             * High/Critical gets priority.
             */
            const highestPriorityAlert =
              newRiskAlerts.find(
                (alert) => {
                  const level =
                    alert.alert_level
                      .toLowerCase()
                      .trim();

                  return (
                    level ===
                      "high" ||
                    level ===
                      "critical"
                  );
                }
              ) ||
              newRiskAlerts[0];

            playAlertSound(
              highestPriorityAlert.alert_level
            );
          }
        }

        /*
         * Remember IDs for the next
         * 10-second check.
         */
        previousAlertIds.current =
          nextAlertIds;

        /*
         * Update notifications.
         *
         * THIS is what makes the red number
         * appear on the bell.
         */
        setAlerts(nextAlerts);

        /*
         * Remember the latest risk assessment.
         */
        if (latestRisk) {
          previousRiskId.current =
            latestRisk.id;
        }
      } catch (error) {
        console.error(
          "AquaSentinel data error:",
          error
        );
      }
    }

    /*
     * Initial load.
     */
    loadData();

    /*
     * Check every 10 seconds.
     */
    const interval =
      setInterval(
        loadData,
        10000
      );

    return () =>
      clearInterval(
        interval
      );
  }, []);

  /*
   * Load the user's preferred alert language.
   */
  useEffect(() => {
    try {
      const savedLanguage =
        localStorage.getItem(
          "aquasentinel_alert_language"
        ) as AlertLanguage | null;

      if (
        savedLanguage === "English" ||
        savedLanguage === "Twi" ||
        savedLanguage === "Dagbani" ||
        savedLanguage === "Hausa"
      ) {
        setAlertLanguage(savedLanguage);
      }
    } catch (error) {
      console.error(
        "Could not load alert language:",
        error
      );
    }
  }, []);

  /*
   * Change and persist the alert language.
   */
  const changeAlertLanguage = (
    language: AlertLanguage
  ) => {
    setAlertLanguage(language);

    try {
      localStorage.setItem(
        "aquasentinel_alert_language",
        language
      );
    } catch (error) {
      console.error(
        "Could not save alert language:",
        error
      );
    }
  };

  /*
   * Localized alert presentation.
   *
   * IMPORTANT: alert.message is deliberately preserved.
   * It contains the detailed contributing factors returned
   * by the risk engine, including any sensor values or
   * explanations. We only translate the surrounding alert
   * labels here instead of replacing the technical details
   * with a generic sentence.
   *
   * Dagbani: "barina" is a verified dictionary term for
   * danger/risk. We do not fabricate a full Dagbani
   * sentence until the wording is verified by a speaker.
   */
  const getAlertPresentation = (
    alert: Alert
  ) => {
    const normalizedLevel =
      alert.alert_level
        .toLowerCase()
        .trim();

    const levelLabels: Record<
      AlertLanguage,
      Record<string, string>
    > = {
      English: {
        critical: "Critical risk",
        high: "High risk",
        moderate: "Moderate risk",
        medium: "Moderate risk",
      },
      Twi: {
        critical: "Asiane kɛse paa",
        high: "Asiane kɛse",
        moderate: "Asiane kakra",
        medium: "Asiane kakra",
      },
      Hausa: {
        critical: "Babban haɗari",
        high: "Babban haɗari",
        moderate: "Matsakaicin haɗari",
        medium: "Matsakaicin haɗari",
      },
      Dagbani: {
        critical: "Barina",
        high: "Barina",
        moderate: "Barina",
        medium: "Barina",
      },
    };

    const detailLabels: Record<
      AlertLanguage,
      string
    > = {
      English: "Details",
      Twi: "Nkyerɛkyerɛmu",
      Dagbani: "Details",
      Hausa: "Cikakkun bayanai",
    };

    const localizedLevel =
      levelLabels[alertLanguage][
        normalizedLevel
      ] ||
      levelLabels.English[
        normalizedLevel
      ] ||
      alert.alert_level;

    return {
      localizedLevel,
      detailLabel:
        detailLabels[alertLanguage],
      message: alert.message,
    };
  };

  /*
   * Current risk level.
   */
  const riskLevel =
    risk?.risk_level || "Low";

  /*
   * Risk styling.
   */
  const riskStyles = {
    Low: {
      badge:
        "bg-emerald-400/10 text-emerald-300 border-emerald-400/20",

      glow:
        "shadow-[0_0_50px_rgba(52,211,153,0.08)]",

      icon: "✓",

      message:
        "Conditions look healthy",
    },

    Moderate: {
      badge:
        "bg-amber-400/10 text-amber-300 border-amber-400/20",

      glow:
        "shadow-[0_0_50px_rgba(251,191,36,0.08)]",

      icon: "!",

      message:
        "Potential stress detected",
    },

    High: {
      badge:
        "bg-red-400/10 text-red-300 border-red-400/20",

      glow:
        "shadow-[0_0_50px_rgba(248,113,113,0.10)]",

      icon: "!",

      message:
        "Potentially harmful conditions detected",
    },
  };

  const currentRisk =
    riskStyles[
      riskLevel as keyof typeof riskStyles
    ] || riskStyles.Low;

  /*
   * ONLY Moderate/Medium/High/Critical
   * are counted as notification alerts.
   */
  const unreadAlerts =
    alerts.filter(
      (alert) => {
        const level =
          alert.alert_level
            .toLowerCase()
            .trim();

        const isRiskAlert =
          level === "moderate" ||
          level === "medium" ||
          level === "high" ||
          level === "critical";

        return (
          isRiskAlert &&
          !readAlertIds.includes(
            alert.id
          )
        );
      }
    );

  /*
   * Mark one alert as read.
   */
  const markAlertAsRead = (
    alertId: number
  ) => {
    setReadAlertIds(
      (current) => {
        const updated =
          current.includes(
            alertId
          )
            ? current
            : [
                ...current,
                alertId,
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

  /*
   * Mark all current risk alerts as read.
   */
  const markAllAlertsAsRead =
    () => {
      setReadAlertIds(
        (current) => {
          const riskAlertIds =
            alerts
              .filter(
                (alert) => {
                  const level =
                    alert.alert_level
                      .toLowerCase()
                      .trim();

                  return (
                    level ===
                      "moderate" ||
                    level ===
                      "medium" ||
                    level ===
                      "high" ||
                    level ===
                      "critical"
                  );
                }
              )
              .map(
                (alert) =>
                  alert.id
              );

          const updated =
            Array.from(
              new Set([
                ...current,
                ...riskAlertIds,
              ])
            );

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

  /*
   * Alert badge styling.
   */
  const alertLevelClass = (
    level: string
  ) => {
    const normalized =
      level
        .toLowerCase()
        .trim();

    if (
      normalized ===
        "critical" ||
      normalized ===
        "high"
    ) {
      return "border-red-400/20 bg-red-400/10 text-red-300";
    }

    if (
      normalized ===
        "moderate" ||
      normalized ===
        "medium"
    ) {
      return "border-amber-400/20 bg-amber-400/10 text-amber-300";
    }

    return "border-[#27e0d0]/20 bg-[#27e0d0]/10 text-[#27e0d0]";
  };

  return (
    <main className="min-h-screen bg-[#022b30] text-white">

      {/* Ambient background */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">

        <div className="absolute -left-40 -top-40 h-96 w-96 rounded-full bg-[#00b8a9]/10 blur-3xl" />

        <div className="absolute right-0 top-1/3 h-96 w-96 rounded-full bg-[#27e0d0]/5 blur-3xl" />

      </div>

      <div className="relative flex min-h-screen">

        {/* Desktop Sidebar */}
        <aside className="hidden w-64 shrink-0 border-r border-white/5 bg-[#071d23]/90 px-5 py-7 lg:block">

          <div className="mb-12">

            <Image
              src="/logo.jpg"
              alt="AquaSentinel Labs"
              width={420}
              height={130}
              priority
              className="h-auto w-full max-w-[210px]"
            />

          </div>

          <nav className="space-y-2">

            <p className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-600">
              Overview
            </p>

            <Link
              href="/"
              className="flex w-full items-center gap-3 rounded-xl bg-[#00b8a9]/10 px-3 py-3 text-sm font-medium text-[#27e0d0]"
            >
              <span>◉</span>
              Dashboard
            </Link>

            <Link
              href="/ponds"
              className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm text-slate-400 transition hover:bg-white/5 hover:text-white"
            >
              <span>◌</span>
              Ponds
            </Link>

            <Link
              href="/insights"
              className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm text-slate-400 transition hover:bg-white/5 hover:text-white"
            >
              <span>⌁</span>
              Insights
            </Link>

            <p className="mb-3 mt-8 px-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-600">
              Monitoring
            </p>

            <Link
              href="/alerts"
              className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm text-slate-400 transition hover:bg-white/5 hover:text-white"
            >
              <span>◈</span>
              Alerts
            </Link>

            <Link
              href="/history"
              className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm text-slate-400 transition hover:bg-white/5 hover:text-white"
            >
              <span>◷</span>
              History
            </Link>

          </nav>

          <div className="mt-16 rounded-2xl border border-[#00b8a9]/10 bg-[#00b8a9]/5 p-4">

            <div className="mb-2 flex items-center gap-2">

              <span className="h-2 w-2 animate-pulse rounded-full bg-[#27e0d0]" />

              <span className="text-xs font-medium text-[#27e0d0]">
                SENTINEL ACTIVE
              </span>

            </div>

            <p className="text-xs leading-5 text-slate-500">
              Continuous monitoring is active for your aquaculture environment.
            </p>

          </div>

        </aside>

        {/* Main */}
        <section className="flex-1 px-5 py-7 sm:px-8 lg:px-10">

          {/* Top bar */}
          <header className="mb-6 flex items-center justify-between">

            {/* Mobile logo + hamburger */}
            <div className="flex items-center gap-3 lg:hidden">

              <button
                onClick={() =>
                  setMenuOpen(
                    !menuOpen
                  )
                }
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-xl text-white transition hover:bg-white/10"
                aria-label="Toggle navigation menu"
              >
                {menuOpen
                  ? "✕"
                  : "☰"}
              </button>

              <Image
                src="/logo.jpg"
                alt="AquaSentinel Labs"
                width={420}
                height={130}
                priority
                className="h-auto w-[150px] sm:w-[180px]"
              />

            </div>

            {/* Farm information */}
            <div className="ml-auto flex items-center gap-3">

              {/* Notifications */}
              <div className="relative">

                <button
                  type="button"
                  onClick={() =>
                    setNotificationsOpen(
                      !notificationsOpen
                    )
                  }
                  className="relative flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-lg text-slate-300 transition hover:border-[#27e0d0]/20 hover:bg-[#27e0d0]/10 hover:text-[#27e0d0]"
                  aria-label="Open notifications"
                  aria-expanded={
                    notificationsOpen
                  }
                  title="Notifications"
                >

                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    className="h-5 w-5"
                    aria-hidden="true"
                  >

                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15 17H9m10-2.5c-1.2-1.1-2-2.7-2-4.5V8a5 5 0 0 0-10 0v2c0 1.8-.8 3.4-2 4.5-.5.5-.1 1.5.6 1.5h12.8c.7 0 1.1-1 .6-1.5ZM10 20h4"
                    />

                  </svg>

                  {/* RED UNREAD COUNT */}
                  {unreadAlerts.length >
                    0 && (
                    <span className="absolute -right-1 -top-1 flex min-h-5 min-w-5 items-center justify-center rounded-full border-2 border-[#071d23] bg-red-400 px-1 text-[9px] font-bold text-white">
                      {unreadAlerts.length >
                      9
                        ? "9+"
                        : unreadAlerts.length}
                    </span>
                  )}

                </button>

                {notificationsOpen && (
                  <div className="absolute right-0 top-12 z-50 w-[min(92vw,380px)] overflow-hidden rounded-2xl border border-white/10 bg-[#071d23] shadow-2xl">

                    <div className="flex items-center justify-between border-b border-white/5 px-4 py-4">

                      <div>

                        <p className="text-sm font-semibold text-white">
                          Notifications
                        </p>

                        {/* Alert language selector */}
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {([
                            "English",
                            "Twi",
                            "Dagbani",
                            "Hausa",
                          ] as AlertLanguage[]).map(
                            (language) => (
                              <button
                                key={language}
                                type="button"
                                onClick={() =>
                                  changeAlertLanguage(
                                    language
                                  )
                                }
                                className={`rounded-lg px-2.5 py-1 text-[10px] font-medium transition ${
                                  alertLanguage ===
                                  language
                                    ? "bg-[#27e0d0]/15 text-[#27e0d0]"
                                    : "bg-white/[0.03] text-slate-500 hover:bg-white/[0.06] hover:text-white"
                                }`}
                              >
                                {language}
                              </button>
                            )
                          )}
                        </div>

                        <p className="mt-2 text-xs text-slate-500">

                          {unreadAlerts.length >
                          0
                            ? `${unreadAlerts.length} unread alert${
                                unreadAlerts.length ===
                                1
                                  ? ""
                                  : "s"
                              }`
                            : "You're all caught up"}

                        </p>

                      </div>

                      {unreadAlerts.length >
                        0 && (
                        <button
                          type="button"
                          onClick={
                            markAllAlertsAsRead
                          }
                          className="text-xs font-medium text-[#27e0d0] transition hover:text-white"
                        >
                          Mark all read
                        </button>
                      )}

                    </div>

                    <div className="max-h-[420px] overflow-y-auto">

                      {alerts.filter(
                        (alert) => {
                          const level =
                            alert.alert_level
                              .toLowerCase()
                              .trim();

                          return (
                            level ===
                              "moderate" ||
                            level ===
                              "medium" ||
                            level ===
                              "high" ||
                            level ===
                              "critical"
                          );
                        }
                      ).length ===
                      0 ? (
                        <div className="px-5 py-8 text-center">

                          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-[#27e0d0]/10 text-[#27e0d0]">
                            ✓
                          </div>

                          <p className="mt-3 text-sm font-medium text-slate-300">
                            No alerts
                          </p>

                          <p className="mt-1 text-xs leading-5 text-slate-500">
                            AquaSentinel has not recorded any active risk alerts for your account.
                          </p>

                        </div>
                      ) : (

                        alerts
                          .filter(
                            (alert) => {
                              const level =
                                alert.alert_level
                                  .toLowerCase()
                                  .trim();

                              return (
                                level ===
                                  "moderate" ||
                                level ===
                                  "medium" ||
                                level ===
                                  "high" ||
                                level ===
                                  "critical"
                              );
                            }
                          )
                          .slice(
                            0,
                            8
                          )
                          .map(
                            (
                              alert
                            ) => {

                              const isUnread =
                                !readAlertIds.includes(
                                  alert.id
                                );

                              return (
                                <button
                                  key={
                                    alert.id
                                  }
                                  type="button"
                                  onClick={() =>
                                    markAlertAsRead(
                                      alert.id
                                    )
                                  }
                                  className={`w-full border-b border-white/5 px-4 py-4 text-left transition hover:bg-white/[0.03] ${
                                    isUnread
                                      ? "bg-white/[0.02]"
                                      : ""
                                  }`}
                                >

                                  <div className="flex items-start gap-3">

                                    <span
                                      className={`mt-0.5 rounded-full border px-2 py-1 text-[9px] font-semibold uppercase ${alertLevelClass(
                                        alert.alert_level
                                      )}`}
                                    >
                                      {
                                        alert.alert_level
                                      }
                                    </span>

                                    {isUnread && (
                                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#27e0d0]" />
                                    )}

                                    <div className="min-w-0 flex-1">

                                      {(() => {
                                        const presentation =
                                          getAlertPresentation(
                                            alert
                                          );

                                        return (
                                          <>
                                            <p className="text-xs font-medium text-slate-300">
                                              {presentation.localizedLevel}
                                              {" · "}
                                              Pond{" "}
                                              {alert.pond_id}
                                            </p>

                                            <p className="mt-1 text-[10px] font-medium uppercase tracking-[0.12em] text-slate-600">
                                              {presentation.detailLabel}
                                            </p>

                                            <p className="mt-1 text-sm leading-5 text-slate-400">
                                              {presentation.message}
                                            </p>
                                          </>
                                        );
                                      })()}

                                      <p className="mt-2 text-[10px] text-slate-600">
                                        {new Date(
                                          alert.sent_at
                                        ).toLocaleString()}
                                      </p>

                                    </div>

                                  </div>

                                </button>
                              );
                            }
                          )
                      )}

                    </div>

                    <div className="border-t border-white/5 p-3">

                      <Link
                        href="/alerts"
                        onClick={() =>
                          setNotificationsOpen(
                            false
                          )
                        }
                        className="flex w-full items-center justify-center rounded-xl bg-white/[0.03] px-4 py-3 text-xs font-medium text-slate-400 transition hover:bg-white/[0.06] hover:text-white"
                      >
                        View all alerts →
                      </Link>

                    </div>

                  </div>
                )}

              </div>

              <div className="hidden text-right sm:block">

                <p className="text-sm font-medium">
                  Saha Aqua Farm
                </p>

                <p className="text-xs text-slate-500">
                  Gurugu, Tamale
                </p>

              </div>

              <button
                onClick={() => {
                  localStorage.removeItem(
                    "aquasentinel_token"
                  );

                  router.replace(
                    "/login"
                  );
                }}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-[#27e0d0]/20 bg-[#27e0d0]/10 text-sm font-semibold text-[#27e0d0]"
                title="Logout"
              >
                S
              </button>

            </div>

          </header>

          {/* Mobile navigation */}
          {menuOpen && (
            <div className="mb-8 rounded-2xl border border-white/10 bg-[#071d23] p-3 shadow-2xl lg:hidden">

              <nav className="space-y-1">

                <Link
                  href="/"
                  onClick={() =>
                    setMenuOpen(
                      false
                    )
                  }
                  className="flex items-center gap-3 rounded-xl bg-[#00b8a9]/10 px-4 py-3 text-sm font-medium text-[#27e0d0]"
                >
                  <span>◉</span>
                  Dashboard
                </Link>

                <Link
                  href="/ponds"
                  onClick={() =>
                    setMenuOpen(
                      false
                    )
                  }
                  className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm text-slate-400 transition hover:bg-white/5 hover:text-white"
                >
                  <span>◌</span>
                  Ponds
                </Link>

                <Link
                  href="/insights"
                  onClick={() =>
                    setMenuOpen(
                      false
                    )
                  }
                  className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm text-slate-400 transition hover:bg-white/5 hover:text-white"
                >
                  <span>⌁</span>
                  Insights
                </Link>

                <div className="my-2 border-t border-white/5" />

                <Link
                  href="/alerts"
                  onClick={() =>
                    setMenuOpen(
                      false
                    )
                  }
                  className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm text-slate-400 transition hover:bg-white/5 hover:text-white"
                >
                  <span>◈</span>
                  Alerts
                </Link>

                <Link
                  href="/history"
                  onClick={() =>
                    setMenuOpen(
                      false
                    )
                  }
                  className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm text-slate-400 transition hover:bg-white/5 hover:text-white"
                >
                  <span>◷</span>
                  History
                </Link>

              </nav>

              <div className="mt-4 rounded-xl border border-[#00b8a9]/10 bg-[#00b8a9]/5 p-4">

                <div className="flex items-center gap-2">

                  <span className="h-2 w-2 animate-pulse rounded-full bg-[#27e0d0]" />

                  <span className="text-xs font-medium text-[#27e0d0]">
                    SENTINEL ACTIVE
                  </span>

                </div>

                <p className="mt-2 text-xs leading-5 text-slate-500">
                  Continuous monitoring is active.
                </p>

              </div>

            </div>
          )}

          {/* Hero */}
          <div className="mb-9">

            <p className="mb-2 text-sm font-medium text-[#27e0d0]">
              EARLY-WARNING INTELLIGENCE
            </p>

            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              {greeting}
            </h1>

            <p className="mt-2 max-w-xl text-sm leading-6 text-slate-400">
              Your ponds are being monitored continuously. Here is the latest picture of your aquaculture environment.
            </p>

          </div>

          {/* Metrics */}
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

            <MetricCard
              label="Temperature"
              value={
                water
                  ? `${water.temperature}°`
                  : "--"
              }
              unit="C"
              detail="Water temperature"
              icon="◉"
            />

            <MetricCard
              label="pH Balance"
              value={
                water
                  ? water.ph.toString()
                  : "--"
              }
              unit=""
              detail="Water acidity"
              icon="◌"
            />

            <MetricCard
              label="Dissolved Oxygen"
              value={
                water
                  ? water.dissolved_oxygen.toString()
                  : "--"
              }
              unit="mg/L"
              detail="Available oxygen"
              icon="≈"
            />

            <MetricCard
              label="Fish Activity"
              value={
                fish
                  ? fish.activity_level
                  : "--"
              }
              unit=""
              detail="Behaviour signal"
              icon="◇"
            />

          </section>

          {/* Fish Behaviour */}
          <section className="mt-5">

            <div className="rounded-3xl border border-white/5 bg-[#06434a] p-7">

              <div className="flex items-start justify-between">

                <div>

                  <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
                    Fish Behaviour
                  </p>

                  <h2 className="mt-2 text-xl font-semibold">
                    Behavioural signals
                  </h2>

                  <p className="mt-2 max-w-xl text-sm text-slate-500">
                    Biological signals provide another layer of insight beyond water quality measurements.
                  </p>

                </div>

                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#27e0d0]/10 text-lg text-[#27e0d0]">
                  ◉
                </div>

              </div>

              <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

                <div className="rounded-2xl bg-white/[0.03] p-5">

                  <p className="text-xs uppercase tracking-[0.12em] text-slate-500">
                    Activity
                  </p>

                  <p className="mt-3 text-lg font-semibold">
                    {fish?.activity_level ||
                      "--"}
                  </p>

                </div>

                <div className="rounded-2xl bg-white/[0.03] p-5">

                  <p className="text-xs uppercase tracking-[0.12em] text-slate-500">
                    Feeding response
                  </p>

                  <p className="mt-3 text-lg font-semibold">
                    {fish?.feeding_response ||
                      "--"}
                  </p>

                </div>

                <div className="rounded-2xl bg-white/[0.03] p-5">

                  <p className="text-xs uppercase tracking-[0.12em] text-slate-500">
                    Fish population
                  </p>

                  <p className="mt-3 text-lg font-semibold">
                    {fish?.fish_count ??
                      "--"}
                  </p>

                </div>

                <div className="rounded-2xl bg-white/[0.03] p-5">

                  <p className="text-xs uppercase tracking-[0.12em] text-slate-500">
                    Unusual behaviour
                  </p>

                  <p className="mt-3 text-lg font-semibold">
                    {fish?.unusual_behaviour ||
                      "--"}
                  </p>

                </div>

              </div>

              <div className="mt-5 flex items-center justify-between border-t border-white/5 pt-5">

                <p className="text-xs text-slate-500">
                  Latest observation
                </p>

                <p className="text-xs text-slate-400">
                  {fish?.observed_at
                    ? new Date(
                        fish.observed_at
                      ).toLocaleTimeString(
                        [],
                        {
                          hour: "2-digit",
                          minute: "2-digit",
                        }
                      )
                    : "--"}
                </p>

              </div>

            </div>

          </section>

          {/* Risk + status */}
          <section className="mt-5 grid gap-5 xl:grid-cols-[1.5fr_1fr]">

            {/* Risk */}
            <div
              className={`rounded-3xl border border-white/5 bg-[#06434a] p-7 ${currentRisk.glow}`}
            >

              <div className="mb-8 flex items-start justify-between">

                <div>

                  <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
                    Sentinel Assessment
                  </p>

                  <h2 className="mt-2 text-xl font-semibold">
                    Current pond risk
                  </h2>

                </div>

                <div
                  className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${currentRisk.badge}`}
                >
                  {riskLevel.toUpperCase()}
                </div>

              </div>

              {/* AI / ML Intelligence */}
              <section className="mt-5">

                <div className="rounded-3xl border border-[#27e0d0]/10 bg-[#06434a] p-7">

                  <div className="flex items-start justify-between">

                    <div>

                      <p className="text-xs font-medium uppercase tracking-[0.18em] text-[#27e0d0]">
                        AI / ML INTELLIGENCE
                      </p>

                      <h2 className="mt-2 text-xl font-semibold">
                        Anomaly detection
                      </h2>

                      <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">
                        AquaSentinel uses machine learning to identify water-quality patterns that differ from the pond's observed baseline.
                      </p>

                    </div>

                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#27e0d0]/10 text-[#27e0d0]">
                      AI
                    </div>

                  </div>

                  <div className="mt-7 grid gap-4 sm:grid-cols-2">

                    {/* ML Detection */}
                    <div className="rounded-2xl bg-white/[0.03] p-5">

                      <p className="text-xs uppercase tracking-[0.12em] text-slate-500">
                        ML anomaly detection
                      </p>

                      <div className="mt-4 flex items-center gap-3">

                        <div
                          className={`flex h-10 w-10 items-center justify-center rounded-full ${
                            risk?.ml_anomaly
                              ? "bg-red-400/10 text-red-300"
                              : "bg-emerald-400/10 text-emerald-300"
                          }`}
                        >
                          {risk?.ml_anomaly
                            ? "!"
                            : "✓"}
                        </div>

                        <div>

                          <p className="text-lg font-semibold">
                            {risk?.ml_anomaly
                              ? "Anomaly detected"
                              : "Normal pattern"}
                          </p>

                          <p className="mt-1 text-xs text-slate-500">
                            {risk?.ml_anomaly
                              ? "The model detected an unusual water-quality pattern."
                              : "The model found no significant anomaly in the latest reading."}
                          </p>

                        </div>

                      </div>

                    </div>

                    {/* ML Score */}
                    <div className="rounded-2xl bg-white/[0.03] p-5">

                      <p className="text-xs uppercase tracking-[0.12em] text-slate-500">
                        Anomaly score
                      </p>

                      <p className="mt-4 text-3xl font-semibold">
                        {risk?.ml_anomaly_score !==
                          null &&
                        risk?.ml_anomaly_score !==
                          undefined
                          ? risk.ml_anomaly_score.toFixed(
                              4
                            )
                          : "--"}
                      </p>

                      <p className="mt-2 text-xs leading-5 text-slate-500">
                        Lower values indicate observations that are more unusual relative to the model's learned baseline.
                      </p>

                    </div>

                  </div>

                  {/* AI explanation */}
                  <div className="mt-5 rounded-2xl border border-[#27e0d0]/10 bg-[#27e0d0]/5 p-5">

                    <p className="text-xs uppercase tracking-[0.12em] text-[#27e0d0]">
                      How Sentinel is reasoning
                    </p>

                    <p className="mt-3 text-sm leading-6 text-slate-400">
                      The machine-learning model evaluates temperature, pH and dissolved oxygen together to identify patterns that differ from healthy observations. This signal is combined with rule-based and trend analysis to produce the final risk score.
                    </p>

                  </div>

                </div>

              </section>

              {/* Risk score */}
              <div className="flex items-end justify-between">

                <div>

                  <p className="text-xs uppercase tracking-[0.16em] text-slate-500">
                    Risk score
                  </p>

                  <p className="mt-2 text-5xl font-semibold tracking-tight">
                    {risk?.risk_score ??
                      0}
                  </p>

                </div>

                <div className="text-right">

                  <p className="text-xs uppercase tracking-[0.16em] text-slate-500">
                    Last assessed
                  </p>

                  <p className="mt-2 text-sm text-slate-400">
                    {risk?.assessed_at
                      ? new Date(
                          risk.assessed_at
                        ).toLocaleTimeString(
                          [],
                          {
                            hour: "2-digit",
                            minute: "2-digit",
                          }
                        )
                      : "--"}
                  </p>

                </div>

              </div>

              {/* Risk intensity */}
              <div className="mt-6">

                <div className="h-2 overflow-hidden rounded-full bg-white/5">

                  <div
                    className={`h-full rounded-full transition-all duration-700 ${
                      riskLevel ===
                      "High"
                        ? "bg-red-400"
                        : riskLevel ===
                          "Moderate"
                        ? "bg-amber-400"
                        : "bg-emerald-400"
                    }`}
                    style={{
                      width: `${Math.min(
                        risk?.risk_score ??
                          0,
                        100
                      )}%`,
                    }}
                  />

                </div>

                <p className="mt-2 text-xs text-slate-500">
                  Risk intensity
                </p>

              </div>

              {/* Attention banner */}
              {riskLevel !==
                "Low" && (
                <div
                  className={`mt-6 rounded-2xl border px-5 py-4 ${
                    riskLevel ===
                    "High"
                      ? "border-red-400/20 bg-red-400/10"
                      : "border-amber-400/20 bg-amber-400/10"
                  }`}
                >

                  <div className="flex items-start gap-3">

                    <div
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full font-bold ${
                        riskLevel ===
                        "High"
                          ? "bg-red-400/10 text-red-300"
                          : "bg-amber-400/10 text-amber-300"
                      }`}
                    >
                      !
                    </div>

                    <div>

                      <p className="font-semibold">
                        {riskLevel ===
                        "High"
                          ? "Potentially harmful conditions detected"
                          : "Potential stress detected"}
                      </p>

                      <p className="mt-1 text-sm text-slate-400">
                        {risk?.contributing_factors ||
                          "AquaSentinel has detected conditions that may require closer monitoring."}
                      </p>

                    </div>

                  </div>

                </div>
              )}

              {/* Sentinel factors */}
              <div className="mt-5 rounded-2xl bg-white/[0.03] p-4">

                <p className="text-xs uppercase tracking-[0.16em] text-slate-500">
                  Sentinel factors
                </p>

                <p className="mt-2 text-sm leading-6 text-slate-300">
                  {risk?.contributing_factors ||
                    "No significant stress signals detected."}
                </p>

              </div>

              {/* Risk interpretation */}
              <div className="mt-5 flex items-center gap-3">

                <div
                  className={`flex h-9 w-9 items-center justify-center rounded-full ${currentRisk.badge}`}
                >
                  {currentRisk.icon}
                </div>

                <div>

                  <p className="text-sm font-medium">
                    {currentRisk.message}
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    Based on current water and fish behaviour signals.
                  </p>

                </div>

              </div>

            </div>

            {/* Sentinel status */}
            <div className="rounded-3xl border border-white/5 bg-[#06434a] p-7">

              <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
                Sentinel Status
              </p>

              <div className="mt-8 flex items-center gap-5">

                <div className="relative flex h-20 w-20 items-center justify-center rounded-full border border-[#27e0d0]/20 bg-[#27e0d0]/5">

                  <div className="absolute h-12 w-12 animate-pulse rounded-full bg-[#27e0d0]/10" />

                  <div className="h-3 w-3 rounded-full bg-[#27e0d0] shadow-[0_0_20px_rgba(39,224,208,0.8)]" />

                </div>

                <div>

                  <h2 className="text-2xl font-semibold">
                    Monitoring
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    System operating normally
                  </p>

                </div>

              </div>

              <div className="mt-8 border-t border-white/5 pt-5">

                <div className="flex items-center justify-between text-sm">

                  <span className="text-slate-500">
                    Monitoring interval
                  </span>

                  <span className="font-medium">
                    10 seconds
                  </span>

                </div>

                <div className="mt-4 flex items-center justify-between text-sm">

                  <span className="text-slate-500">
                    Active pond
                  </span>

                  <span className="font-medium">
                    Pond 1
                  </span>

                </div>

              </div>

            </div>

          </section>

          {/* Bottom cards */}
          <section className="mt-5 grid gap-5 md:grid-cols-2">

            <div className="rounded-3xl border border-white/5 bg-[#06434a] p-7">

              <div className="flex items-center justify-between">

                <div>

                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                    Fish Behaviour
                  </p>

                  <h2 className="mt-2 text-lg font-semibold">
                    Behaviour signal
                  </h2>

                </div>

                <div className="rounded-full bg-emerald-400/10 px-3 py-1 text-xs text-emerald-300">
                  {fish?.activity_level ||
                    "Unknown"}
                </div>

              </div>

              <div className="mt-8 grid grid-cols-2 gap-3">

                <div className="rounded-2xl bg-white/[0.03] p-4">

                  <p className="text-xs text-slate-500">
                    Activity
                  </p>

                  <p className="mt-2 text-sm font-medium">
                    {fish?.activity_level ||
                      "--"}
                  </p>

                </div>

                <div className="rounded-2xl bg-white/[0.03] p-4">

                  <p className="text-xs text-slate-500">
                    Feeding response
                  </p>

                  <p className="mt-2 text-sm font-medium">
                    {fish?.feeding_response ||
                      "--"}
                  </p>

                </div>

              </div>

            </div>

            <div className="rounded-3xl border border-white/5 bg-[#06434a] p-7">

              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                Risk Factors
              </p>

              <h2 className="mt-2 text-lg font-semibold">
                What is influencing the score?
              </h2>

              <div className="mt-6 rounded-2xl bg-white/[0.03] p-4">

                <p className="text-sm leading-6 text-slate-400">
                  {risk?.contributing_factors ||
                    "No contributing factors detected."}
                </p>

              </div>

            </div>

          </section>

          <footer className="mt-10 border-t border-white/5 pt-6 text-xs text-slate-600">
            AquaSentinel • Multimodal Early-Warning Intelligence for African Aquaculture
          </footer>

        </section>

      </div>

    </main>
  );
}

function MetricCard({
  label,
  value,
  unit,
  detail,
  icon,
}: {
  label: string;
  value: string;
  unit: string;
  detail: string;
  icon: string;
}) {
  return (
    <div className="group rounded-3xl border border-white/5 bg-[#06434a] p-6 transition duration-300 hover:-translate-y-1 hover:border-[#27e0d0]/20 hover:shadow-[0_15px_50px_rgba(0,0,0,0.2)]">

      <div className="flex items-start justify-between">

        <div>

          <p className="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">
            {label}
          </p>

          <div className="mt-4 flex items-baseline gap-2">

            <span className="text-3xl font-semibold tracking-tight">
              {value}
            </span>

            {unit && (
              <span className="text-xs text-slate-500">
                {unit}
              </span>
            )}

          </div>

          <p className="mt-2 text-xs text-slate-600">
            {detail}
          </p>

        </div>

        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#27e0d0]/5 text-[#27e0d0] transition group-hover:bg-[#27e0d0]/10">
          {icon}
        </div>

      </div>

    </div>
  );
}