import { useState } from "react";
import { PracticeMode } from "./App.js";
import { useI18n } from "./i18n.js";
import { LiveStudent, LiveTeacher } from "./live/LiveClassroom.js";
import { CampaignMode } from "./campaign/CampaignMode.js";

type Experience = "home" | "practice" | "challenges" | "teacher" | "student";

function Brand() { return <a className="brand" href="#" aria-label="Kodergarden"><span className="brand-mark">K</span><span>Koder<strong>garden</strong></span></a>; }

export function RootApp() {
  const { locale, setLocale, t } = useI18n();
  const [experience, setExperience] = useState<Experience>(() => {
    if (sessionStorage.getItem("kodergarden.live.participant")) return "student";
    if (sessionStorage.getItem("kodergarden.live.teacherTab") && localStorage.getItem("kodergarden.live.teacher")) return "teacher";
    return "home";
  });
  const language = <select className="language-select" aria-label="Language" value={locale} onChange={(event) => setLocale(event.target.value as "en" | "es")}><option value="en">{t("language.english")}</option><option value="es">{t("language.spanish")}</option></select>;
  if (experience === "practice") return <div className="experience-shell"><button className="experience-home" onClick={() => setExperience("home")}>← {t("live.home")}</button><PracticeMode /></div>;
  if (experience === "challenges") return <div className="experience-shell"><button className="experience-home" onClick={() => setExperience("home")}>← {t("live.home")}</button><CampaignMode /></div>;
  if (experience === "teacher") return <LiveTeacher onBack={() => setExperience("home")} />;
  if (experience === "student") return <LiveStudent onBack={() => setExperience("home")} />;
  return <main className="mode-home"><header className="site-header"><Brand/><div className="lab-label"><span>{t("live.kicker")}</span><i/></div><div className="header-actions">{language}</div></header><section className="mode-hero"><span className="eyebrow"><i/>{t("live.kicker")}</span><h1>{t("live.welcome")}</h1><p>{t("live.welcomeBody")}</p></section><section className="mode-grid"><button className="mode-card mode-card--practice" onClick={() => setExperience("practice")}><span>✦</span><small>{t("brand.mode")}</small><strong>{t("live.practiceTitle")}</strong><p>{t("live.practiceBody")}</p><i>→</i></button><button className="mode-card mode-card--challenges" onClick={() => setExperience("challenges")}><span>★</span><small>{t("campaign.mode")}</small><strong>{t("campaign.homeTitle")}</strong><p>{t("campaign.homeBody")}</p><i>→</i></button><button className="mode-card mode-card--teacher" onClick={() => setExperience("teacher")}><span>◉</span><small>{t("live.teacher")}</small><strong>{t("live.create")}</strong><p>{t("live.createBody")}</p><i>→</i></button><button className="mode-card mode-card--join" onClick={() => setExperience("student")}><span>#</span><small>{t("live.student")}</small><strong>{t("live.join")}</strong><p>{t("live.joinBody")}</p><i>→</i></button></section></main>;
}
