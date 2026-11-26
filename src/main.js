import laws from "./data/laws.json";
import cards from "./data/cards.json";
import generatedLawCards from "./data/labor-standards-act.generated.json";
import generatedSafetyLawCards from "./data/occupational-safety-and-health-act.generated.json";
import questions from "./data/questions.json";
import "./style.css";
import { initFlashcards } from "./flashcards.js";

const app = document.querySelector("#app");

const escapeHtml = (value) =>
  String(value).replace(/[&<>"']/g, (character) => {
    const entities = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;",
    };
    return entities[character];
  });

const isFullArticleCard = (card) =>
  card.cardType === "article" &&
  typeof card.articleText === "string" &&
  card.articleText.trim().length > 0;

// Prefer the XML-generated records while preserving the original cards.json.
const articleCards = [
  ...generatedLawCards,
  ...generatedSafetyLawCards,
  ...cards.filter(isFullArticleCard),
].filter(
  (card, index, source) =>
    source.findIndex(
      (candidate) =>
        candidate.id === card.id ||
        (candidate.lawId === card.lawId && candidate.article === card.article),
    ) === index,
);

const lawCards = laws
  .map((law, index) => {
    const cardCount = articleCards.filter((card) => card.lawId === law.id).length;
    const questionCount = questions.filter(
      (question) => question.lawId === law.id,
    ).length;

    return `
      <a class="law-card" href="#flashcards?law=${encodeURIComponent(law.id)}" aria-label="進入${escapeHtml(law.name)}字卡">
        <div class="law-card__top">
          <span class="law-card__number">${String(index + 1).padStart(2, "0")}</span>
          <span class="law-card__icon" aria-hidden="true">${["§", "↗", "✳", "◉", "▤", "⇄", "⌂"][index % 7]}</span>
        </div>
        <h3>${escapeHtml(law.name)}</h3>
        <div class="law-card__meta">
          <span>字卡 ${cardCount} 張</span>
          <span class="meta-dot" aria-hidden="true"></span>
          <span>題目 ${questionCount} 題</span>
        </div>
      </a>
    `;

  })
  .join("");

app.innerHTML = `
  <header class="site-header">
    <a class="brand" href="#top" aria-label="勞工法令互動學習平台首頁">
      <span class="brand__mark" aria-hidden="true">勞</span>
      <span class="brand__text">
        <strong>勞工法令互動學習平台</strong>
        <small>LABOR LAW LEARNING</small>
      </span>
    </a>
    <nav class="top-nav" aria-label="主要導覽">
      <a href="#laws">法令分類</a>
      <a href="#flashcards">字卡學習</a>
      <a href="#progress">學習進度</a>
    </nav>
    <span class="header-note"><span class="status-dot"></span> 個人學習空間</span>
  </header>

  <main id="top">
    <div id="homePage">
    <section class="hero page-shell" aria-labelledby="hero-title">
      <div class="hero__copy">
        <h1 class="hero__title" id="hero-title">讓複雜的法令，<br /><span>變得簡單好學。</span></h1>
        <p class="hero__description">
          從法條記憶到題目練習，用清楚的分類和短回合複習，建立自己的勞動法令知識。
        </p>
        <div class="hero__actions">
          <a class="button button--primary" href="#flashcards">
            開始字卡學習 <span aria-hidden="true">↓</span>
          </a>
          <a class="text-link" href="#study">看看學習方式 <span aria-hidden="true">↘</span></a>
        </div>
        <div class="hero__caption">
          <span class="caption-spark" aria-hidden="true">✳</span>
          先回想，再翻面。每天累積一點熟悉。
        </div>
      </div>

      <aside class="overview-card" aria-label="目前題庫總覽">
        <div class="overview-card__heading">
          <span>你的學習題庫</span>
          <span class="overview-card__badge">第一批資料</span>
        </div>
        <div class="overview-card__stats">
          <div class="stat">
          <span class="stat__value">${articleCards.length}</span>
            <span class="stat__label">張法令字卡</span>
          </div>
          <div class="stat-divider"></div>
          <div class="stat">
            <span class="stat__value">${questions.length}</span>
            <span class="stat__label">道練習題目</span>
          </div>
        </div>
        <div class="overview-card__footer">
          <span class="tiny-bars" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></span>
          題庫會隨著學習內容逐步增加
        </div>
        <div class="overview-doodle" aria-hidden="true">§</div>
      </aside>
      <span class="hero__decoration hero__decoration--one" aria-hidden="true"></span>
      <span class="hero__decoration hero__decoration--two" aria-hidden="true"></span>
    </section>

    <section class="section page-shell" id="laws" aria-labelledby="laws-title">
      <div class="section-heading">
        <div>
          <p class="section-kicker">CHOOSE A LAW</p>
          <h2 id="laws-title">從哪一部法令開始？</h2>
          <p class="section-description">選擇想學習的分類，循序熟悉重要法規。</p>
        </div>
        <span class="section-count"><strong>${laws.length}</strong> 個學習分類</span>
      </div>
      <div class="law-grid">
        ${lawCards}
      </div>
    </section>

    <section class="section section--compact page-shell" id="study" aria-labelledby="study-title">
      <div class="section-heading">
        <div>
          <p class="section-kicker">YOUR STUDY TOOLS</p>
          <h2 id="study-title">選擇一種學習方式</h2>
          <p class="section-description">熟記、練習、回顧，逐步建立穩固的法令概念。</p>
        </div>
      </div>
      <div class="feature-grid">
        <article class="feature-card feature-card--featured">
          <span class="feature-icon feature-icon--orange" aria-hidden="true">↻</span>
          <div class="feature-card__body">
            <span class="feature-label">記憶練習</span>
            <h3>字卡學習</h3>
            <p>從問題開始回想，再查看法條依據與白話說明。</p>
          </div>
          <span class="coming-soon">即將推出</span>
        </article>
        <article class="feature-card">
          <span class="feature-icon feature-icon--peach" aria-hidden="true">✓</span>
          <div class="feature-card__body">
            <span class="feature-label">檢視理解</span>
            <h3>選擇題練習</h3>
            <p>透過四選一題目，檢查自己是否掌握法令重點。</p>
          </div>
          <span class="coming-soon">即將推出</span>
        </article>
        <article class="feature-card">
          <span class="feature-icon feature-icon--sand" aria-hidden="true">⤴</span>
          <div class="feature-card__body">
            <span class="feature-label">加強記憶</span>
            <h3>錯題複習</h3>
            <p>回顧答錯的題目，讓容易混淆的概念更清楚。</p>
          </div>
          <span class="coming-soon">即將推出</span>
        </article>
      </div>
    </section>

    <section class="progress-section page-shell" id="progress" aria-labelledby="progress-title">
      <div class="progress-card">
        <div class="progress-card__copy">
          <p class="section-kicker">YOUR LEARNING JOURNEY</p>
          <h2 id="progress-title">學習進度，從這裡開始累積。</h2>
          <p>完成字卡與練習後，這裡將呈現你的學習紀錄。</p>
        </div>
        <div class="progress-placeholder" aria-label="學習進度統計預留區">
          <div class="progress-placeholder__ring"><span>—<small>尚未開始</small></span></div>
          <div class="progress-placeholder__labels">
            <span><i class="legend-dot legend-dot--done"></i> 已熟悉 <b>—</b></span>
            <span><i class="legend-dot legend-dot--todo"></i> 待複習 <b>—</b></span>
          </div>
        </div>
        <span class="progress-decoration" aria-hidden="true">✳</span>
      </div>
    </section>
    </div>
    <section id="flashcardsPage" class="flashcards-page" hidden></section>
  </main>

  <footer class="site-footer page-shell">
    <span>勞工法令互動學習平台</span>
    <span>以官方法規資料為學習依據・持續整理中</span>
  </footer>
`;


const flashcardsPage = app.querySelector("#flashcardsPage");
const flashcardController = initFlashcards({
  root: flashcardsPage,
  laws,
  cards: articleCards,
});

function updatePageRoute() {
  const showFlashcards = window.location.hash.startsWith("#flashcards");
  app.querySelector("#homePage").hidden = showFlashcards;
  flashcardsPage.hidden = !showFlashcards;

  if (showFlashcards) {
    const routeQuery = window.location.hash.split("?")[1] ?? "";
    const selectedLawId = new URLSearchParams(routeQuery).get("law");
    flashcardController.setLaw(selectedLawId);
    window.requestAnimationFrame(() => {
      flashcardsPage.scrollIntoView({ block: "start" });
    });
  }
}

window.addEventListener("hashchange", updatePageRoute);
updatePageRoute();
