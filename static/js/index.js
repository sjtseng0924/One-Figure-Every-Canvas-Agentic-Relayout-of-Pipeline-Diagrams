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
  return `static/images/experiment_result/ours/${caseId}/${ratio}.jpg`;
}

function baselinePath(method, caseId, ratio) {
  return `static/images/experiment_result/${method}/${caseId}/${ratio}.jpg`;
}

function originalPaths(caseId) {
  return [
    `static/images/experiment_result/original_graph/${caseId}.jpeg`,
    `static/images/experiment_result/original_graph/${caseId}.jpg`
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
    card.addEventListener("focus", () => {
      if (card.matches(":focus-visible")) showOurs();
    });
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
  renderChoices("baselineTabs", BASELINES.map((baseline) => ({ id: baseline.value, label: baseline.label })), currentBaseline, (id) => {
    currentBaseline = id;
    setupBaselineSelect();
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

function renderChoices(containerId, choices, selectedId, onSelect) {
  const container = document.getElementById(containerId);
  container.replaceChildren();
  choices.forEach((choice) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `choice-tab${choice.id === selectedId ? " active" : ""}`;
    button.textContent = choice.label;
    button.setAttribute("aria-pressed", String(choice.id === selectedId));
    button.addEventListener("click", () => {
      onSelect(choice.id);
      [...container.children].find((item) => item.textContent === choice.label)?.focus({ preventScroll: true });
    });
    container.appendChild(button);
  });
}

const RESEARCH_TABLES = {
  benchmark: {
    title: "Quantitative comparison on FlowchartRelayoutBench",
    note: "100 flowcharts, five target aspect ratios. Correctness is a pass rate (%); Layout and Style are average ranks (lower is better). Overall prioritizes Content Fidelity.",
    rows: [
      ["Nano Banana Pro", [49.8, 69.4, 41.4, 2.85, 1.35, 71.10]],
      ["GPT Image 2.0", [50.2, 75.4, 40.2, 3.17, 2.08, 71.10]],
      ["PaperBanana", [38.4, 18.6, 11.2, 2.14, 4.34, 39.05]],
      ["AutoFigure-Edit", [41.8, 41.4, 24.8, 3.63, 4.16, 47.90]],
      ["Ours", [74.2, 90.6, 68.6, 2.66, 2.98, 81.85]]
    ]
  },
  ablation: {
    title: "Quantitative ablation on 30 flowcharts",
    note: "The same 30 flowcharts and evaluation protocol are used for all variants. Layout, Style, and Overall are ranked jointly within this ablation and are not directly comparable with the main benchmark.",
    rows: [
      ["Direct Prompt Parse Stage", [53.3, 60.0, 33.3, 5.00, 7.67, 50.74]],
      ["Direct Prompt Layout Stage", [70.0, 93.3, 66.7, 4.07, 5.03, 69.26]],
      ["Direct VLM-to-XML (Gemini 3.1 Pro)", [43.3, 50.0, 33.3, 5.23, 6.87, 41.11]],
      ["Direct VLM-to-XML (GPT-5.5)", [33.3, 80.0, 30.0, 4.97, 7.77, 49.63]],
      ["w/o All Critic Agents", [60.0, 80.0, 46.7, 4.60, 5.50, 61.85]],
      ["w/o Parse Critic", [73.3, 80.0, 60.0, 4.83, 3.83, 63.33]],
      ["w/o Layout Critic", [66.7, 83.3, 60.0, 4.77, 4.40, 60.00]],
      ["w/o Style Stage", [73.3, 93.3, 70.0, 4.33, 2.53, 76.30]],
      ["w/ Graphviz (DOT) Layout", [43.3, 36.7, 20.0, 6.77, 9.67, 35.19]],
      ["Ours", [76.7, 96.7, 76.7, 3.90, 1.73, 87.04]]
    ]
  },
  qwen: {
    title: "Transfer to an open-weight VLM",
    note: "Qwen3.6-27B replaces Gemini while the pipeline remains unchanged. XML Fail. and correctness are percentages; Layout and Style are average ranks. Overall is computed within this three-method comparison and is not comparable with other tables.",
    xml: true,
    rows: [
      ["Direct VLM-to-XML (Qwen3.6-27B)", [16.0, 8.0, 12.0, 0.0, 2.36, 2.28, 38.0]],
      ["Direct I2I (Qwen-Image-Edit-2511)", [0.0, 24.0, 8.0, 8.0, 2.16, 2.20, 40.0]],
      ["Ours (Qwen3.6-27B)", [0.0, 20.0, 52.0, 20.0, 1.40, 1.44, 90.0]]
    ]
  }
};

function renderResearchTable(id, config) {
  const headers = [
    ...(config.xml ? [{ label: "XML Fail.", lower: true, decimals: 1 }] : []),
    { label: "Relationship", decimals: 1 },
    { label: "Hallu.-free", decimals: 1 },
    { label: "Content", decimals: 1 },
    { label: "Layout", lower: true, decimals: 2 },
    { label: "Style", lower: true, decimals: 2 },
    { label: "Overall", decimals: config.xml ? 1 : 2 }
  ];
  const ranks = headers.map((header, column) =>
    [...new Set(config.rows.map((row) => row[1][column]))].sort((a, b) => header.lower ? a - b : b - a)
  );
  const container = document.getElementById(id);
  container.className = "table-block";
  container.innerHTML = `
    <div class="table-scroll" tabindex="0" role="region" aria-label="${config.title}">
      <table class="research-table" aria-describedby="${id}Note">
        <caption>${config.title}</caption>
        <thead>
          <tr class="metric-groups"><th></th>${config.xml ? '<th scope="col">Validity</th>' : ""}<th colspan="3" scope="colgroup">Correctness (%)</th><th colspan="2" scope="colgroup">Visual Quality</th><th scope="col">Score</th></tr>
          <tr><th scope="col">Method</th>${headers.map((header) => `<th scope="col">${header.label} <span aria-label="${header.lower ? "lower is better" : "higher is better"}">${header.lower ? "&darr;" : "&uarr;"}</span></th>`).join("")}</tr>
        </thead>
        <tbody>${config.rows.map(([name, values]) => `
          <tr class="${name.startsWith("Ours") ? "ours-row" : ""}">
            <th scope="row">${name}</th>
            ${values.map((value, column) => {
              const rank = ranks[column].indexOf(value);
              return `<td class="${rank === 0 ? "best" : rank === 1 ? "second" : ""}">${value.toFixed(headers[column].decimals)}</td>`;
            }).join("")}
          </tr>`).join("")}
        </tbody>
      </table>
    </div>
    <div class="table-footnote"><p id="${id}Note">${config.note}</p><div class="table-legend"><span class="best">Best</span><span class="second">Second</span></div></div>
  `;
}

const ABLATIONS = [
  {
    id: "direct_prompt_layout", label: "Direct Prompting", title: "Direct Prompt Layout Stage",
    description: "Direct prompting leaves substantial unused space and excessively shrinks components. Our method uses the available canvas more effectively while preserving component sizes and clear connector flow.",
    images: [["Original", "original.jpeg"], ["Direct Prompt Layout", "gemini-layout_red.png"], ["Ours", "ours.png"]]
  },
  {
    id: "parse", label: "Parse Critic", title: "The Role of the Parse Critic",
    description: "Without the Parse Critic, incorrect shape types and mismatched connector attachment points remain uncorrected. Iterative feedback improves component geometry and edge anchoring.",
    images: [["Original", "original.jpeg"], ["Without Parse Critic", "wo_critic.png"], ["With Parse Critic", "w_critic.png"]]
  },
  {
    id: "style", label: "Style Stage", title: "Reconstructing the Original Appearance",
    description: "Removing the Style Stage introduces mismatched colors, simplified containers, inconsistent connector styles, and typography differences. Style reconstruction improves visual correspondence while retaining structure.",
    images: [["Original", "original.png"], ["Without Style Stage", "wo_style.png"], ["With Style Stage", "w_style.png"]]
  },
  {
    id: "layout", label: "Layout Critic", title: "Refining the Target-Canvas Layout",
    description: "The single-pass result has weaker space utilization and less natural arrow routing. Deterministic and visual feedback improves placement, compactness, and readability while preserving connectivity.",
    images: [["Original", "original.png"], ["Without Layout Critic", "wo_critic.png"], ["With Layout Critic", "w_critic.png"]]
  },
  {
    id: "graphiz", label: "Graphviz", title: "Beyond Topology-Driven Graph Layout",
    description: "Graphviz DOT leaves unused space and can lose relationships involving containers. Our Layout Stage accounts for the target canvas while maintaining those structural relationships.",
    images: [["Original", "original.jpeg"], ["Graphviz DOT", "graphviz_red.png"], ["Ours", "ours.png"]]
  }
];

function renderFigureComparison(containerId, entries) {
  const container = document.getElementById(containerId);
  container.replaceChildren();
  entries.forEach(([label, src]) => {
    const figure = document.createElement("figure");
    figure.className = "comparison-figure";
    const caption = document.createElement("figcaption");
    caption.textContent = label;
    if (label.startsWith("Ours") || label.startsWith("With ")) figure.classList.add("ours-figure");
    const button = document.createElement("button");
    button.type = "button";
    button.className = "image-zoom";
    button.title = `Enlarge ${label}`;
    button.setAttribute("aria-haspopup", "dialog");
    const img = document.createElement("img");
    img.src = src;
    img.alt = label;
    img.loading = "lazy";
    button.appendChild(img);
    figure.append(caption, button);
    container.appendChild(figure);
  });
}

function renderAblation(id = ABLATIONS[0].id) {
  const item = ABLATIONS.find((entry) => entry.id === id);
  renderChoices("ablationTabs", ABLATIONS, id, renderAblation);
  document.getElementById("ablationTitle").textContent = item.title;
  document.getElementById("ablationDescription").textContent = item.description;
  renderFigureComparison("ablationGallery", item.images.map(([label, file]) =>
    [label, `static/images/ablation/${item.id}/${file}`]));
}

function renderStyleTransfer(id = "case1") {
  renderChoices("styleTabs", [{ id: "case1", label: "Example 1" }, { id: "case2", label: "Example 2" }], id, renderStyleTransfer);
  renderFigureComparison("styleGallery", [
    ["Original Diagram", `static/images/style_transfer/${id}_original.png`],
    ["Style Reference", `static/images/style_transfer/${id}_style_ref.png`],
    ["Ours / Style Transfer", `static/images/style_transfer/${id}_style_transferred.${id === "case1" ? "jpg" : "png"}`]
  ]);
}

function setupResearchSections() {
  Object.entries(RESEARCH_TABLES).forEach(([key, config]) => renderResearchTable(`${key}Table`, config));
  renderAblation();
  renderStyleTransfer();
  renderFigureComparison("qwenGallery", [
    ["Original / Target 1:1", "static/images/opensource_result/Qwen/original.jpeg"],
    ["Direct XML / Qwen3.6-27B", "static/images/opensource_result/Qwen/general-qwen.png"],
    ["Qwen-Image-Edit-2511", "static/images/opensource_result/Qwen/qwen-image-edit.png"],
    ["Ours / Qwen3.6-27B", "static/images/opensource_result/Qwen/ours.png"]
  ]);
  const dialog = document.getElementById("figureDialog");
  document.addEventListener("click", (event) => {
    const button = event.target.closest(".image-zoom");
    if (!button) return;
    const source = button.querySelector("img");
    const expanded = document.getElementById("expandedFigure");
    expanded.src = source.src;
    expanded.alt = source.alt;
    document.getElementById("figureDialogTitle").textContent = source.alt;
    dialog.showModal();
  });
  document.getElementById("closeFigure").addEventListener("click", () => dialog.close());
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) dialog.close();
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
  setupResearchSections();
  new ResizeObserver(fitTeaserImages).observe(document.getElementById("teaserGrid"));
});
