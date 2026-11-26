import "./flashcards.css";

const FAVORITES_KEY = "labor-law-learning:favorites:v1";

const escapeHtml = (value) =>
  String(value ?? "").replace(/[&<>"']/g, (character) => {
    const entities = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;",
    };
    return entities[character];
  });

function renderArticleParagraphs(articleText) {
  let paragraphNumber = 0;
  let isInsideClause = false;

  return String(articleText ?? "")
    .split(/\r?\n/)
    .map((line) => {
      if (!line) {
        return '<span class="flashcard-paragraph-spacer" aria-hidden="true"></span>';
      }

      const clause = line.match(/^([一二三四五六七八九十百千]+、)(.*)$/);
      if (clause) {
        isInsideClause = true;
        return `<span class="flashcard-paragraph flashcard-paragraph--clause"><span class="flashcard-paragraph-number">${escapeHtml(clause[1])}</span><span class="flashcard-paragraph-content">${escapeHtml(clause[2])}</span></span>`;
      }

      const subitem = line.match(/^（([一二三四五六七八九十百千]+)）(.*)$/);
      if (subitem && isInsideClause) {
        return `<span class="flashcard-paragraph flashcard-paragraph--subitem"><span class="flashcard-paragraph-number">（${escapeHtml(subitem[1])}）</span><span class="flashcard-paragraph-content">${escapeHtml(subitem[2])}</span></span>`;
      }

      isInsideClause = false;
      paragraphNumber += 1;
      return `<span class="flashcard-paragraph flashcard-paragraph--item"><span class="flashcard-paragraph-number">${paragraphNumber}</span><span class="flashcard-paragraph-content">${escapeHtml(line)}</span></span>`;
    })
    .join("");
}

function readFavorites() {
  try {
    const saved = JSON.parse(localStorage.getItem(FAVORITES_KEY) ?? "[]");
    return new Set(Array.isArray(saved) ? saved : []);
  } catch {
    return new Set();
  }
}

function isFullArticleCard(card) {
  const type = card.cardType ?? card.type;
  const hasText =
    typeof card.articleText === "string" && card.articleText.trim().length > 0;
  const hasTitle =
    typeof card.articleTitle === "string" && card.articleTitle.trim().length > 0;

  if (type === "question" || type === "quiz") return false;
  if (["article", "full-article", "law-article"].includes(type)) {
    return hasText;
  }

  return hasText && hasTitle && !card.question && !card.answer;
}

export function initFlashcards({ root, laws, cards }) {
  const articleCards = cards.filter(isFullArticleCard);
  const state = {
    lawId: "all",
    onlyFavorites: false,
    favoriteIds: readFavorites(),
    currentIndex: 0,
    isFlipped: false,
  };

  root.innerHTML = `
    <section class="study-page page-shell" aria-labelledby="study-title">
      <a class="study-back-link" href="#top"><span aria-hidden="true">←</span> 返回首頁</a>
      <div class="study-heading">
        <div>
          <p class="section-kicker">FLASHCARD STUDY</p>
          <h1 id="study-title">互動式法令字卡</h1>
          <p class="section-description">正面只提示法令名稱與條號，翻面閱讀完整法條原文。</p>
        </div>
        <div class="study-total" id="studyTotal" aria-live="polite"></div>
      </div>

      <div class="study-filters">
        <label class="filter-label" for="lawFilter">選擇法令分類</label>
        <select id="lawFilter" class="law-filter">
          <option value="all">全部法令</option>
          ${laws.map((law) => `<option value="${escapeHtml(law.id)}">${escapeHtml(law.name)}</option>`).join("")}
        </select>
        <button class="favorite-filter" id="favoriteFilter" type="button" aria-pressed="false">
          <span aria-hidden="true">☆</span>
          <span id="favoriteFilterLabel">只看收藏</span>
          <span class="favorite-filter__count" id="favoriteCount">0</span>
        </button>
      </div>

      <div class="study-progress-row">
        <span id="cardProgress" aria-live="polite">0 / 0</span>
        <div class="study-progress-track" role="progressbar" aria-label="目前分類字卡進度" aria-valuemin="0" aria-valuemax="0" aria-valuenow="0">
          <span id="studyProgressBar"></span>
        </div>
        <span id="categoryCardCount">0 張字卡</span>
      </div>

      <div class="flashcard-list-block" aria-labelledby="flashcardListTitle">
        <div class="flashcard-list-heading">
          <h2 id="flashcardListTitle">本分類字卡</h2>
          <span id="flashcardListCount"></span>
        </div>
        <div id="flashcardList" class="flashcard-list"></div>
      </div>
      <div id="flashcardContent"></div>
    </section>
  `;

  const lawFilter = root.querySelector("#lawFilter");
  const favoriteFilter = root.querySelector("#favoriteFilter");
  const content = root.querySelector("#flashcardContent");

  function getVisibleCards() {
    return articleCards.filter((card) => {
      const matchesLaw = state.lawId === "all" || card.lawId === state.lawId;
      const matchesFavorite =
        !state.onlyFavorites || state.favoriteIds.has(card.id);
      return matchesLaw && matchesFavorite;
    });
  }

  function saveFavorites() {
    try {
      localStorage.setItem(
        FAVORITES_KEY,
        JSON.stringify([...state.favoriteIds]),
      );
    } catch {
      // 若瀏覽器不允許 localStorage，收藏仍會保留在目前頁面的狀態中。
    }
  }

  function render() {
    const visibleCards = getVisibleCards();
    const card = visibleCards[state.currentIndex] ?? null;
    const total = visibleCards.length;
    const current = card ? state.currentIndex + 1 : 0;
    const progressPercent = total ? (current / total) * 100 : 0;
    const visibleFavoriteCount = articleCards.filter((item) =>
      state.favoriteIds.has(item.id),
    ).length;
    root.querySelector("#flashcardListCount").textContent = `${total} 張`;
    root.querySelector("#flashcardList").innerHTML = visibleCards
      .map((item, index) => `
        <button class="flashcard-list-item" type="button" data-action="select-card" data-card-index="${index}" aria-current="${index === state.currentIndex}">
          <span class="flashcard-list-item__article">${escapeHtml(item.lawName)}</span>
          <span class="flashcard-list-item__question">${escapeHtml(item.article)}</span>
        </button>
      `)
      .join("");

    root.querySelector("#studyTotal").textContent = `共 ${total} 張`;
    root.querySelector("#favoriteCount").textContent =
      String(visibleFavoriteCount);
    root.querySelector("#favoriteFilter").setAttribute(
      "aria-pressed",
      String(state.onlyFavorites),
    );
    root.querySelector("#favoriteFilterLabel").textContent = state.onlyFavorites
      ? "顯示全部字卡"
      : "只看收藏";
    root.querySelector("#favoriteFilter").querySelector("[aria-hidden]").textContent =
      state.onlyFavorites ? "★" : "☆";
    root.querySelector("#cardProgress").textContent = `${current} / ${total}`;
    root.querySelector("#categoryCardCount").textContent = `${total} 張字卡`;
    const progressbar = root.querySelector('[role="progressbar"]');
    progressbar.setAttribute("aria-valuemax", String(total));
    progressbar.setAttribute("aria-valuenow", String(current));
    root.querySelector("#studyProgressBar").style.width = `${progressPercent}%`;

    if (!card) {
      const message = state.onlyFavorites
        ? "目前沒有已收藏的整條法規字卡。"
          : articleCards.length === 0
          ? "目前沒有符合整條法規格式的資料；問答型字卡不會顯示在此頁。"
          : "這個法令分類目前沒有整條法規字卡。";
      content.innerHTML = `
        <div class="study-empty">
          <span class="study-empty__icon" aria-hidden="true">§</span>
          <h2>目前沒有可顯示的整條法規字卡</h2>
          <p>${message}</p>
          ${state.onlyFavorites ? '<button class="button button--primary" type="button" data-action="show-all">瀏覽全部字卡</button>' : ""}
        </div>
      `;
      return;
    }

    const isFavorite = state.favoriteIds.has(card.id);
    const lawName = laws.find((law) => law.id === card.lawId)?.name ?? card.lawName;

    content.innerHTML = `
      <article class="study-card-area">
        <div class="study-card-topline">
          <span class="study-card-law">${escapeHtml(lawName)} <span aria-hidden="true">/</span> ${escapeHtml(card.article)}</span>
          <button
            class="favorite-button ${isFavorite ? "is-favorite" : ""}"
            type="button"
            data-action="toggle-favorite"
            aria-pressed="${isFavorite}"
            aria-label="${isFavorite ? "取消收藏" : "收藏這張字卡"}"
          >
            <span aria-hidden="true">${isFavorite ? "★" : "☆"}</span>
            <span>${isFavorite ? "已收藏" : "收藏字卡"}</span>
          </button>
        </div>

        <button
          class="flashcard-stage ${state.isFlipped ? "is-flipped" : ""}"
          type="button"
          data-action="flip"
          aria-pressed="${state.isFlipped}"
          aria-label="${escapeHtml(lawName)} ${escapeHtml(card.articleTitle ?? card.article)}，點擊翻面閱讀法條原文"
        >
          <span class="flashcard-stage__inner">
            <span class="flashcard-face flashcard-face--front" aria-hidden="${state.isFlipped}">
              <span class="flashcard-law-name">${escapeHtml(lawName)}</span>
              <span class="flashcard-article">${escapeHtml(card.article)}</span>
            </span>
            <span class="flashcard-face flashcard-face--back" aria-hidden="${!state.isFlipped}">
              <span class="flashcard-face__top">
                <span class="flashcard-index">ANSWER ${String(current).padStart(2, "0")}</span>
                <span class="flashcard-side-label">法條原文</span>
              </span>
              <span class="flashcard-article-text">${renderArticleParagraphs(card.articleText)}</span>
              <span class="flashcard-flip-hint"><span aria-hidden="true">↻</span> 點擊卡片返回提示</span>
            </span>
          </span>
        </button>

        <div class="study-card-footer">
          <a class="source-link" href="${escapeHtml(card.sourceUrl)}" target="_blank" rel="noopener noreferrer">
            查看官方法規來源 <span aria-hidden="true">↗</span>
          </a>
          <span>法規版本：${escapeHtml(card.lawVersion)}</span>
        </div>

        <div class="study-card-controls" aria-label="字卡導覽">
          <button class="control-button control-button--secondary" type="button" data-action="previous" ${current <= 1 ? "disabled" : ""}>
            <span aria-hidden="true">←</span> 上一條
          </button>
          <span class="control-progress">${current} <i>/</i> ${total}</span>
          <button class="control-button control-button--primary" type="button" data-action="next" ${current >= total ? "disabled" : ""}>
            下一條 <span aria-hidden="true">→</span>
          </button>
        </div>
      </article>
    `;
  }

  lawFilter.addEventListener("change", () => {
    state.lawId = lawFilter.value;
    state.currentIndex = 0;
    state.isFlipped = false;
    render();
  });

  root.addEventListener("click", (event) => {
    const action = event.target.closest("[data-action]")?.dataset.action;
    if (!action) return;

    if (action === "flip") {
      state.isFlipped = !state.isFlipped;
      const stage = content.querySelector(".flashcard-stage");
      stage.classList.toggle("is-flipped", state.isFlipped);
      stage.setAttribute("aria-pressed", String(state.isFlipped));
      stage.querySelector(".flashcard-face--front").setAttribute(
        "aria-hidden",
        String(state.isFlipped),
      );
      stage.querySelector(".flashcard-face--back").setAttribute(
        "aria-hidden",
        String(!state.isFlipped),
      );
      return;
    } else if (action === "select-card") {
      const selectedIndex = Number(event.target.closest("[data-card-index]")?.dataset.cardIndex);
      if (Number.isInteger(selectedIndex) && selectedIndex >= 0 && selectedIndex < getVisibleCards().length) {
        state.currentIndex = selectedIndex;
        state.isFlipped = false;
      }
    } else if (action === "toggle-favorite") {
      const card = getVisibleCards()[state.currentIndex];
      if (!card) return;
      if (state.favoriteIds.has(card.id)) {
        state.favoriteIds.delete(card.id);
      } else {
        state.favoriteIds.add(card.id);
      }
      saveFavorites();
    } else if (action === "toggle-favorite-view") {
      state.onlyFavorites = !state.onlyFavorites;
      state.currentIndex = 0;
      state.isFlipped = false;
    } else if (action === "previous" && state.currentIndex > 0) {
      state.currentIndex -= 1;
      state.isFlipped = false;
    } else if (
      action === "next" &&
      state.currentIndex < getVisibleCards().length - 1
    ) {
      state.currentIndex += 1;
      state.isFlipped = false;
    } else if (action === "show-all") {
      state.onlyFavorites = false;
      state.currentIndex = 0;
      state.isFlipped = false;
    }

    render();
  });

  favoriteFilter.addEventListener("click", () => {
    state.onlyFavorites = !state.onlyFavorites;
    state.currentIndex = 0;
    state.isFlipped = false;
    render();
  });

  render();

  return {
    setLaw(lawId) {
      state.lawId = laws.some((law) => law.id === lawId) ? lawId : "all";
      lawFilter.value = state.lawId;
      state.currentIndex = 0;
      state.isFlipped = false;
      render();
    },
  };
}






