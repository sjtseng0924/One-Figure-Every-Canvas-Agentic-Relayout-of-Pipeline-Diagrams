const TEASERS = [
  {
    title: "Paper-to-slide pipeline",
    folder: "CVPR2024",
    ref: "ref.jpg",
    outputs: [
      ["16:9", "teacher_16_9.png"],
      ["4:3", "teacher_4_3.png"],
      ["1:1", "teacher_1_1.png"],
      ["3:4", "teacher_3_4.png"],
      ["9:16", "teacher_9_16.png"]
    ]
  },
  {
    title: "Dense architecture diagram",
    folder: "ECCV23",
    ref: "ref.jpeg",
    outputs: [
      ["4:1", "ECCV2024-00023_4_1.png"],
      ["3:2", "ECCV2024-00023_3_2.png"],
      ["1:1", "ECCV2024-00023_1_1.png"],
      ["2:3", "ECCV2024-00023_2_3.png"],
      ["7:24", "ECCV2024-00023_7_24.png"]
    ]
  },
  {
    title: "Multi-stage reasoning flow",
    folder: "ICLR10",
    ref: "ref.jpeg",
    outputs: [
      ["10:3", "ICLR2026-00010_10_3.png"],
      ["17:12", "ICLR2026-00010_17_12.png"],
      ["1:1", "ICLR2026-00010_1_1.png"],
      ["2:3", "ICLR2026-00010_2_3.png"],
      ["1:2", "ICLR2026-00010_1_2.png"]
    ]
  },
  {
    title: "Long-form visual pipeline",
    folder: "NeurIPS5",
    ref: "ref.jpeg",
    outputs: [
      ["16:9", "NeurIPS2025-00005_16_9.png"],
      ["3:2", "NeurIPS2025-00005_3_2.png"],
      ["1:1", "NeurIPS2025-00005_1_1.png"],
      ["2:3", "NeurIPS2025-00005_2_3.png"],
      ["9:16", "NeurIPS2025-00005_9_16.png"]
    ]
  }
];

const CASES = [
  { id: "ECCV2024-00042", difficulty: "easy" },
  { id: "ECCV2024-00048", difficulty: "easy" },
  { id: "ECCV2024-00002", difficulty: "medium" },
  { id: "ECCV2024-00026", difficulty: "medium" },
  { id: "ICCV2025-00015", difficulty: "medium" },
  { id: "ICLR2026-00005-3", difficulty: "medium" },
  { id: "ECCV2024-00024", difficulty: "hard" },
  { id: "ECCV2024-00025", difficulty: "hard" },
  { id: "ICLR2026-00008", difficulty: "hard" },
  { id: "CVPR2025-00023", difficulty: "hard" }
];

const BASELINES = [
  { value: "autofigure", label: "AutoFigure-Edit" },
  { value: "gpt", label: "GPT Image 2.0" },
  { value: "nanobanana", label: "Nano Banana Pro" },
  { value: "paperbanana", label: "PaperBanana" }
];

const RATIOS = [
  { key: "1_1", label: "1:1" },
  { key: "3_2", label: "3:2" },
  { key: "16_9", label: "16:9" },
  { key: "2_3", label: "2:3" },
  { key: "9_16", label: "9:16" },
  { key: "2.39_1", label: "2.39:1", special: true, baseline: false },
  { key: "1_4", label: "1:4", special: true, baseline: false }
];

const BASELINE_ISSUES = {
  paperbanana: [
    ["Relationship Preservation", "Extra edges are frequently generated."],
    ["Hallucination-free Rate", "May introduce content inconsistent with the original figure."],
    ["Style Similarity", "Text-only input often causes large style deviations from the original."],
    ["Layout Quality", "Some portrait targets become rotated landscape diagrams."]
  ],
  autofigure: [
    ["Relationship Preservation", "SVG parsing can struggle to represent flowchart relationships reliably."],
    ["Layout Quality", "Some portrait targets become rotated landscape diagrams."]
  ],
  gpt: [
    ["Hallucination-free Rate", "Hard flowcharts may duplicate components or produce incorrect fine-grained blocks."],
    ["Layout Quality", "Often stretches or compresses the source image instead of performing true relayout."]
  ],
  nanobanana: [
    ["Relationship Preservation", "Large-ratio changes often cause severe relationship errors."],
    ["Hallucination-free Rate", "Hard flowcharts may duplicate, omit, or alter fine-grained blocks."],
    ["Layout Quality", "Similar ratios can reuse the original layout and leave large empty margins."]
  ]
};

let currentIndex = 0;
let currentBaseline = "autofigure";
let currentTeaser = 0;

function imageWithFallback(paths, className, alt) {
  const wrapper = document.createElement("div");
  const img = document.createElement("img");
  const missing = document.createElement("div");
  img.className = className;
  img.alt = alt;
  img.loading = "lazy";
  missing.className = "missing";
  missing.textContent = "Image unavailable";
  wrapper.appendChild(img);
  wrapper.appendChild(missing);
  let index = 0;
  function tryNext() {
    if (index >= paths.length) {
      img.style.display = "none";
      missing.style.display = "flex";
      return;
    }
    img.src = paths[index];
    index += 1;
  }
  img.onload = () => {
    img.style.display = "block";
    missing.style.display = "none";
  };
  img.onerror = tryNext;
  tryNext();
  return { wrapper, img };
}

function teaserPath(item, file) {
  return `static/images/teaser/${item.folder}/${file}`;
}

function oursPath(caseId, ratio) {
  return `static/images/data_comp/ours/${caseId}/${ratio}.jpg`;
}

function baselinePath(method, caseId, ratio) {
  return `static/images/data_comp/${method}/${caseId}/${ratio}.jpg`;
}

function originalPaths(caseId) {
  return [
    `static/images/data_comp/original_graph/${caseId}.jpeg`,
    `static/images/data_comp/original_graph/${caseId}.jpg`
  ];
}

function renderTeasers() {
  const grid = document.getElementById("teaserGrid");
  if (!grid) return;
  const item = TEASERS[currentTeaser];
  const tabs = document.getElementById("teaserTabs");
  tabs.innerHTML = "";
  TEASERS.forEach((example, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `teaser-tab${index === currentTeaser ? " active" : ""}`;
    button.textContent = `Example ${index + 1}`;
    button.title = example.title;
    button.setAttribute("role", "tab");
    button.setAttribute("aria-selected", String(index === currentTeaser));
    button.setAttribute("aria-controls", "teaserGrid");
    button.tabIndex = index === currentTeaser ? 0 : -1;
    button.addEventListener("click", () => selectTeaser(index));
    button.addEventListener("keydown", (event) => {
      if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
      event.preventDefault();
      const next = event.key === "Home" ? 0 : event.key === "End" ? TEASERS.length - 1 :
        (index + (event.key === "ArrowRight" ? 1 : -1) + TEASERS.length) % TEASERS.length;
      selectTeaser(next);
      tabs.children[next].focus();
    });
    tabs.appendChild(button);
  });
  grid.setAttribute("role", "tabpanel");
  grid.setAttribute("aria-label", item.title);
  grid.innerHTML = "";
  const images = [["Reference", item.ref], ...item.outputs.map(([ratio, file]) => [`Ours · ${ratio}`, file])];
  [images.slice(0, 3), images.slice(3)].forEach((entries) => {
    const row = document.createElement("div");
    row.className = "teaser-row";
    entries.forEach(([label, file]) => {
      const figure = document.createElement("figure");
      figure.className = "teaser-figure";
      figure.innerHTML = `<figcaption>${label}</figcaption><img src="${teaserPath(item, file)}" alt="${item.title}: ${label}" decoding="async">`;
      row.appendChild(figure);
    });
    grid.appendChild(row);
  });
  const caption = document.createElement("p");
  caption.className = "teaser-caption";
  caption.innerHTML = `<strong>${item.title}.</strong> The same diagram structure, adapted to five target aspect ratios.`;
  grid.appendChild(caption);
  grid.querySelectorAll("img").forEach((img) => {
    img.addEventListener("load", fitTeaserImages);
  });
  fitTeaserImages();
}

function fitTeaserImages() {
  const grid = document.getElementById("teaserGrid");
  const images = [...grid.querySelectorAll("img")];
  if (!images.length || images.some((img) => !img.naturalWidth)) return;
  const width = grid.clientWidth;
  const mobile = window.innerWidth <= 480;
  const gap = window.innerWidth <= 800 ? 10 : 18;
  const maxHeight = mobile ? 100 : window.innerWidth <= 800 ? 120 : 166;
  const rowRatios = [...grid.querySelectorAll(".teaser-row")].map((row) =>
    [...row.querySelectorAll("img")].reduce((sum, img) => sum + img.naturalWidth / img.naturalHeight, 0)
  );
  const height = Math.min(maxHeight, mobile
    ? (width - 2) / Math.max(...images.map((img) => img.naturalWidth / img.naturalHeight))
    : (width - 2 * gap - 6) / Math.max(...rowRatios));
  images.forEach((img) => {
    img.style.height = `${height}px`;
    img.style.width = `${height * img.naturalWidth / img.naturalHeight}px`;
  });
}

function selectTeaser(index) {
  currentTeaser = (index + TEASERS.length) % TEASERS.length;
  renderTeasers();
}

function createRatioCard(label, src, hoverSrc = "", special = false) {
  const card = document.createElement("article");
  card.className = `ratio-card${hoverSrc ? " hover-swap" : ""}${special ? " special" : ""}`;
  card.tabIndex = hoverSrc ? 0 : -1;
  const holder = document.createElement("div");
  holder.className = "image-holder";
  const loaded = imageWithFallback([src], "result-image", `${label} result`);
  holder.append(...loaded.wrapper.childNodes);
  if (hoverSrc) {
    const hint = document.createElement("span");
    hint.className = "comparison-hint";
    hint.textContent = selectedBaselineLabel();
    card.title = "Compare with Ours";
    holder.appendChild(hint);
    const showOurs = () => {
      loaded.img.src = hoverSrc;
      hint.textContent = "Viewing Ours";
      hint.classList.add("is-ours");
    };
    const showBaseline = () => {
      loaded.img.src = src;
      hint.textContent = selectedBaselineLabel();
      hint.classList.remove("is-ours");
    };
    card.addEventListener("mouseenter", showOurs);
    card.addEventListener("focus", showOurs);
    card.addEventListener("mouseleave", showBaseline);
    card.addEventListener("blur", showBaseline);
    card.addEventListener("click", () => {
      if (loaded.img.getAttribute("src") === hoverSrc) showBaseline();
      else showOurs();
    });
    card.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        card.click();
      }
    });
  }
  card.innerHTML = `<h5>${label}</h5>`;
  card.appendChild(holder);
  return card;
}

function selectedBaselineLabel() {
  return BASELINES.find((item) => item.value === currentBaseline).label;
}

function renderTabs() {
  const tabs = document.getElementById("caseTabs");
  if (!tabs) return;
  tabs.innerHTML = "";
  CASES.forEach((item, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `case-tab${index === currentIndex ? " active" : ""}`;
    button.textContent = String(index + 1);
    button.title = item.id;
    button.addEventListener("click", () => {
      currentIndex = index;
      renderExplorer();
    });
    tabs.appendChild(button);
  });
}

function renderOriginal(caseId) {
  const frame = document.getElementById("originalFrame");
  frame.innerHTML = "";
  const loaded = imageWithFallback(originalPaths(caseId), "original-image", `${caseId} original figure`);
  frame.append(...loaded.wrapper.childNodes);
}

function renderOurs(caseId) {
  const grid = document.getElementById("oursGrid");
  grid.innerHTML = "";
  RATIOS.forEach((ratio) => {
    grid.appendChild(createRatioCard(ratio.label, oursPath(caseId, ratio.key), "", ratio.special));
  });
}

function renderBaseline(caseId) {
  const grid = document.getElementById("baselineGrid");
  const title = document.getElementById("baselineTitle");
  const issues = document.getElementById("baselineIssues");
  const selected = BASELINES.find((item) => item.value === currentBaseline);
  grid.innerHTML = "";
  title.textContent = selected.label;
  issues.innerHTML = `<ul>${BASELINE_ISSUES[currentBaseline].map(([metric, text]) => `<li><b>${metric}:</b> ${text}</li>`).join("")}</ul>`;
  RATIOS.filter((ratio) => ratio.baseline !== false).forEach((ratio) => {
    grid.appendChild(
      createRatioCard(
        ratio.label,
        baselinePath(currentBaseline, caseId, ratio.key),
        oursPath(caseId, ratio.key),
        ratio.special
      )
    );
  });
}

function sourceName(id) {
  const match = id.match(/^[A-Z]+/);
  return `${match ? match[0] : "Paper"} source diagram`;
}

function renderExplorer() {
  const item = CASES[currentIndex];
  const title = document.getElementById("caseTitle");
  const meta = document.getElementById("caseMeta");
  const badge = document.getElementById("difficultyBadge");
  title.textContent = `Flowchart ${currentIndex + 1}`;
  meta.textContent = `${sourceName(item.id)} · ${item.id}`;
  badge.textContent = item.difficulty;
  badge.className = `difficulty-badge ${item.difficulty}`;
  renderTabs();
  renderOriginal(item.id);
  renderOurs(item.id);
  renderBaseline(item.id);
}

function setupBaselineSelect() {
  const select = document.getElementById("baselineSelect");
  if (!select) return;
  BASELINES.forEach((baseline) => {
    const option = document.createElement("option");
    option.value = baseline.value;
    option.textContent = baseline.label;
    select.appendChild(option);
  });
  select.value = currentBaseline;
  select.addEventListener("change", (event) => {
    currentBaseline = event.target.value;
    renderBaseline(CASES[currentIndex].id);
  });
}

function copyBibTeX() {
  const bibtexElement = document.getElementById("bibtex-code");
  const button = document.querySelector(".copy-bibtex-btn");
  const copyText = button.querySelector(".copy-text");
  navigator.clipboard.writeText(bibtexElement.textContent).then(() => {
    button.classList.add("copied");
    copyText.textContent = "Copied";
    setTimeout(() => {
      button.classList.remove("copied");
      copyText.textContent = "Copy";
    }, 1600);
  });
}

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: "smooth" });
}

window.addEventListener("scroll", () => {
  const scrollButton = document.querySelector(".scroll-to-top");
  if (window.scrollY > 360) {
    scrollButton.classList.add("visible");
  } else {
    scrollButton.classList.remove("visible");
  }
});

document.addEventListener("DOMContentLoaded", () => {
  renderTeasers();
  document.getElementById("teaserPrev").addEventListener("click", () => selectTeaser(currentTeaser - 1));
  document.getElementById("teaserNext").addEventListener("click", () => selectTeaser(currentTeaser + 1));
  setupBaselineSelect();
  renderExplorer();
  new ResizeObserver(fitTeaserImages).observe(document.getElementById("teaserGrid"));
});
