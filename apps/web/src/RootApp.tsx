import { useState, type CSSProperties } from "react";
import adventureBackground from "../../../resources/assets/home/adventure_background.webp";
import challengesIcon from "../../../resources/assets/home/icon_challenges.webp";
import createLiveIcon from "../../../resources/assets/home/icon_create_live.webp";
import joinLiveIcon from "../../../resources/assets/home/icon_join_live.webp";
import practiceIcon from "../../../resources/assets/home/icon_practice.webp";
import pipHero from "../../../resources/assets/home/pip_hero.webp";
import { PracticeMode } from "./App.js";
import { useCatalog } from "./catalog.js";
import { CampaignMode } from "./campaign/CampaignMode.js";
import { useI18n } from "./i18n.js";
import { LiveStudent, LiveTeacher } from "./live/LiveClassroom.js";

type Experience = "home" | "practice" | "challenges" | "teacher" | "student";

const homeCards = [
  { experience: "practice", tone: "practice", categoryKey: "home.solo", titleKey: "live.practiceTitle", bodyKey: "home.practiceBody", image: practiceIcon },
  { experience: "challenges", tone: "challenges", categoryKey: "home.solo", titleKey: "campaign.homeTitle", bodyKey: "home.challengesBody", image: challengesIcon },
  { experience: "teacher", tone: "teacher", categoryKey: "home.class", titleKey: "live.create", bodyKey: "home.createBody", image: createLiveIcon },
  { experience: "student", tone: "student", categoryKey: "home.class", titleKey: "live.join", bodyKey: "home.joinBody", image: joinLiveIcon },
] as const;

function Brand() {
  return <a className="brand" href="#" aria-label="Kodergarden"><span className="brand-mark">K</span><span>Koder<strong>garden</strong></span></a>;
}

export function RootApp() {
  const { locale, setLocale, t } = useI18n();
  const catalog = useCatalog();
  const [experience, setExperience] = useState<Experience>(() => {
    if (sessionStorage.getItem("kodergarden.live.participant")) return "student";
    if (sessionStorage.getItem("kodergarden.live.teacherTab") && localStorage.getItem("kodergarden.live.teacher")) return "teacher";
    return "home";
  });
  const language = <select className="language-select" aria-label={t("home.languageLabel")} value={locale} onChange={(event) => setLocale(event.target.value as "en" | "es")}><option value="en">{t("language.english")}</option><option value="es">{t("language.spanish")}</option></select>;

  if (catalog.loading && catalog.campaigns.length === 0) return <main className="catalog-state"><h1>{t("catalog.loading")}</h1></main>;
  if (catalog.error && catalog.campaigns.length === 0) return <main className="catalog-state"><h1>{t("catalog.unavailable")}</h1><p>{catalog.error}</p><button className="live-primary" onClick={catalog.retry}>{t("catalog.retry")}</button></main>;
  const foundations = catalog.campaigns.find((campaign) => campaign.kind === "guided");
  if (!foundations) return <main className="catalog-state"><h1>{t("catalog.unavailable")}</h1></main>;
  if (experience === "practice") return <PracticeMode challenges={foundations.challenges} onBack={() => setExperience("home")} />;
  if (experience === "challenges") return <CampaignMode campaigns={catalog.campaigns} onBack={() => setExperience("home")} />;
  if (experience === "teacher") return <LiveTeacher onBack={() => setExperience("home")} />;
  if (experience === "student") return <LiveStudent onBack={() => setExperience("home")} />;

  return (
    <main className="adventure-home" style={{ "--adventure-background": `url(${adventureBackground})` } as CSSProperties}>
      <header className="adventure-header">
        <Brand />
        <div className="adventure-header__actions">
          {language}
        </div>
      </header>
      <section className="adventure-hero" aria-labelledby="home-title">
        <div className="adventure-hero__copy">
          <h1 id="home-title">{t("home.greeting")}</h1>
          <p>{t("home.prompt")}</p>
        </div>
        <div className="adventure-hero__scene" aria-hidden="true">
          <div className="pip-group">
            <div className="pip-speech"><strong>{t("home.speechLead")}</strong><span>{t("home.speechBody")}</span></div>
            <img className="pip-hero" src={pipHero} alt="" />
          </div>
          <div className="code-stack">
            <span className="code-block code-block--move">➜ <b>{t("home.block.move")}</b></span>
            <span className="code-block code-block--repeat">⟳ <b>{t("home.block.repeat")}</b></span>
            <span className="code-block code-block--condition">◆ <b>{t("home.block.condition")}</b></span>
            <span className="code-block code-block--run">⚑ <b>{t("home.block.run")}</b></span>
          </div>
        </div>
      </section>
      <section className="adventure-grid" aria-label={t("home.experiencesLabel")}>
        {homeCards.map((card) => (
          <button key={card.experience} className={`adventure-card adventure-card--${card.tone}`} onClick={() => setExperience(card.experience)} aria-label={`${t(card.titleKey)}. ${t(card.bodyKey)}`}>
            <span className="adventure-card__category"><span aria-hidden="true">{card.categoryKey === "home.solo" ? "●" : "●●"}</span>{t(card.categoryKey)}</span>
            <span className="adventure-card__illustration"><img src={card.image} alt="" aria-hidden="true" /></span>
            <strong className="adventure-card__title">{t(card.titleKey)}</strong>
            <span className="adventure-card__description">{t(card.bodyKey)}</span>
          </button>
        ))}
      </section>
    </main>
  );
}
