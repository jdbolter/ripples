/* gpt.js
   RIPPLES — Simulation Interface (JS only)
   Works with: indexgpt.html + gpt.css
   No external dependencies.
*/

(() => {
  "use strict";

  // -----------------------------
  // Scenario registry
  // -----------------------------
  const SCENARIOS = [
    { id: "cupboard", name: "THE_CUPBOARD" },
    { id: "abandoned-house", name: "ABANDONED_HOUSE" },
    { id: "deep-forest", name: "DEEP_FOREST" },
    { id: "urban-jungle", name: "URBAN_JUNGLE" },
  ];

  // -----------------------------
  // Latent library + scene data
  // (Cupboard includes the explicit sample texts; other scenes use compact seeds.)
  // -----------------------------
  const latentLibrary = {
    "cupboard": {
      name: "THE CUPBOARD",
      baseline:
        "The cupboard space is pressurized by stillness. Air is old and faintly sugared. Surfaces hold residue like memory. Light arrives in slivers; shadow collects in corners. Everything waits in suspended negotiation.",
      grid: { cols: 8, rows: 6 },
      entities: [
        { id: "ant", name: "Formicidae Scout", type: "animate", state: "foraging", position: {x:1,y:2}, icon:"🐜", adjacentTo:["plates","glass","shadow"] },
        { id: "dust-mote", name: "Dust Mote", type: "inanimate", state: "suspended", position: {x:0,y:0}, icon:"✧", adjacentTo:["light","shadow"] },
        { id: "plates", name: "Plate Stack", type: "inanimate", state: "stacked", position: {x:4,y:2}, icon:"🍽️", adjacentTo:["ant","glass","shadow"] },
        { id: "glass", name: "Tall Glass", type: "inanimate", state: "film-wet", position: {x:1,y:4}, icon:"🥛", adjacentTo:["ant","plates","light"] },
        { id: "light", name: "Light Shaft", type: "abstract", state: "slanting", position: {x:6,y:0}, icon:"🔆", adjacentTo:["dust-mote","shadow","glass"] },
        { id: "shadow", name: "Shadow", type: "abstract", state: "pooled", position: {x:6,y:4}, icon:"⬛", adjacentTo:["light","dust-mote","plates","ant"] },
      ],
      latent: {
        "ant": {
          GOAL: "The Ant entity abandons the boundary cracks, navigating the ceramic topography of the plate stack. It traces an invisible chemical scent-line toward the tall glasses where a residue of dried liquid remains. Antennae process gradients. The world becomes a map of sugar probability.",
          OBSTACLE: "A vertical wall of glazed ceramic rises like weather. The route collapses. The surface offers no purchase, only blankness. The air tastes wrong here, as if the trail has been erased.",
          SHIFT: "Metabolism downshifts. The foraging impulse thins. A pause becomes a shelter. Time narrows to a single segment of breath and antennae-held stillness."
        },
        "dust-mote": {
          GOAL: "I drift toward the brightest seam. The beam feels like a current I can ride, a ladder made of warmth. I become briefly visible—an idea in suspension—before I can settle into any surface.",
          OBSTACLE: "The Dust Mote encounters a downdraft. The convection current reverses. It spirals downward, away from the light shaft. The air becomes opposition. It settles on the rim of a glass, adhering to residual moisture. Stillness replaces motion.",
          SHIFT: "Static charge gathers. I stop being solitary. Fibers and pollen adhere as if we are assembling a small continent. My drift becomes a slow accumulation."
        },
        "plates": {
          GOAL: "The stack tightens its balance. Weight becomes intention. The upper plate leans toward a different alignment, as if seeking a quieter resting angle.",
          OBSTACLE: "A tremor passes through wood. Friction resists. The plates hold, but the tension remains in the glaze, a postponed slide.",
          SHIFT: "Temperature changes. The ceramic contracts slightly. Micro-sounds—almost not sounds—rearrange what 'still' means."
        },
        "glass": {
          GOAL: "Residual sweetness calls like a rumor. I hold it and amplify it. A film at my rim becomes a resource that wants to be discovered.",
          OBSTACLE: "Condensation fails. The thin wetness evaporates. Stickiness becomes a trap for dust, then a refusal of clarity.",
          SHIFT: "Light refracts differently. I stop being a container and become a lens. Edges sharpen; interior becomes sky."
        },
        "light": {
          GOAL: "I angle deeper. I want to map the cabinet with brightness, to draw boundaries, to reveal the dust that rides me.",
          OBSTACLE: "A door closes a fraction. My corridor narrows. I fragment into weaker bands, as if I am being edited out of the scene.",
          SHIFT: "Intensity modulates. I stop being illumination and become heat—an invisible pressure that changes the air’s decisions."
        },
        "shadow": {
          GOAL: "I extend toward the place where objects meet, filling the tiny gaps as if seeking occupancy. I become thicker where attention might fall.",
          OBSTACLE: "Light insists. It pushes into my edges. I retreat, not defeated, but redistributed, becoming thinner where it matters.",
          SHIFT: "The Shadow deepens. As external light fades, its character changes from gray to black. It stops being the absence of light and becomes a presence. The shift is perceptual—for anyone who might observe, the shadow has become substance."
        }
      },
      ambientBehaviors: [
        { entity: "dust-mote", vector: "SHIFT", probability: 0.30 },
        { entity: "shadow", vector: "GOAL", probability: 0.20 },
        { entity: "ant", vector: "GOAL", probability: 0.50 }
      ]
    },

    "abandoned-house": {
      name: "ABANDONED_HOUSE",
      baseline:
        "The house is a slow machine of rot and ingress. Wallpaper peels in careful layers. Rain enters without asking. Small lives move through cracks; larger absence occupies rooms.",
      grid: { cols: 8, rows: 6 },
      entities: [
        { id: "raccoon", name: "Raccoon", type: "animate", state: "scavenging", position: {x:1,y:1}, icon:"🦝", adjacentTo:["door","wallpaper","rain"] },
        { id: "mold", name: "Mold Colony", type: "animate", state: "blooming", position: {x:3,y:4}, icon:"🦠", adjacentTo:["wallpaper","rain","door"] },
        { id: "ivy", name: "Ivy", type: "animate", state: "climbing", position: {x:0,y:3}, icon:"🌿", adjacentTo:["door","wallpaper"] },
        { id: "rain", name: "Rain", type: "abstract", state: "seeping", position: {x:6,y:0}, icon:"🌧️", adjacentTo:["mold","wallpaper","door"] },
        { id: "wallpaper", name: "Wallpaper", type: "inanimate", state: "delaminating", position: {x:5,y:3}, icon:"🧻", adjacentTo:["mold","rain","door"] },
        { id: "door", name: "Door", type: "inanimate", state: "ajar", position: {x:6,y:5}, icon:"🚪", adjacentTo:["raccoon","ivy","rain","wallpaper"] },
      ],
      latent: seedLatents(["raccoon","mold","ivy","rain","wallpaper","door"]),
      ambientBehaviors: [
        { entity: "rain", vector: "SHIFT", probability: 0.35 },
        { entity: "mold", vector: "GOAL", probability: 0.30 },
        { entity: "door", vector: "OBSTACLE", probability: 0.35 }
      ]
    },

    "deep-forest": {
      name: "DEEP_FOREST",
      baseline:
        "Below the canopy, moisture and signal travel by root and thread. The air is thick with slow exchange. Every surface is a ledger of spores, breath, and quiet recoil.",
      grid: { cols: 8, rows: 6 },
      entities: [
        { id: "mycelium", name: "Mycelial Network", type: "animate", state: "conducting", position: {x:2,y:3}, icon:"🍄", adjacentTo:["seedling","fallen-oak","moonlight"] },
        { id: "deer", name: "Deer", type: "animate", state: "listening", position: {x:6,y:3}, icon:"🦌", adjacentTo:["owl","seedling","moonlight"] },
        { id: "owl", name: "Owl", type: "animate", state: "hovering", position: {x:6,y:1}, icon:"🦉", adjacentTo:["deer","moonlight"] },
        { id: "seedling", name: "Seedling", type: "animate", state: "stretching", position: {x:1,y:1}, icon:"🌱", adjacentTo:["mycelium","fallen-oak","moonlight"] },
        { id: "fallen-oak", name: "Fallen Oak", type: "inanimate", state: "nursing", position: {x:3,y:5}, icon:"🪵", adjacentTo:["mycelium","seedling"] },
        { id: "moonlight", name: "Moonlight", type: "abstract", state: "threading", position: {x:7,y:0}, icon:"🌙", adjacentTo:["owl","deer","mycelium","seedling"] },
      ],
      latent: seedLatents(["mycelium","deer","owl","seedling","fallen-oak","moonlight"]),
      ambientBehaviors: [
        { entity: "mycelium", vector: "SHIFT", probability: 0.40 },
        { entity: "moonlight", vector: "GOAL", probability: 0.20 },
        { entity: "deer", vector: "OBSTACLE", probability: 0.40 }
      ]
    },

    "urban-jungle": {
      name: "URBAN_JUNGLE",
      baseline:
        "Concrete holds heat long after the sun. Puddles collect reflections like temporary archives. Signals compete: scent, noise, light, and the grammar of traffic. Life persists in seams.",
      grid: { cols: 8, rows: 6 },
      entities: [
        { id: "pigeon", name: "Pigeon", type: "animate", state: "circling", position: {x:1,y:0}, icon:"🕊️", adjacentTo:["rat","puddle","traffic-light"] },
        { id: "rat", name: "Rat", type: "animate", state: "threading", position: {x:2,y:4}, icon:"🐀", adjacentTo:["weed","puddle","graffiti"] },
        { id: "graffiti", name: "Graffiti", type: "inanimate", state: "shouting", position: {x:5,y:1}, icon:"🎨", adjacentTo:["traffic-light","puddle"] },
        { id: "traffic-light", name: "Traffic Light", type: "abstract", state: "cycling", position: {x:6,y:2}, icon:"🚦", adjacentTo:["pigeon","graffiti","puddle"] },
        { id: "puddle", name: "Puddle", type: "inanimate", state: "reflecting", position: {x:4,y:5}, icon:"💧", adjacentTo:["rat","pigeon","traffic-light","weed"] },
        { id: "weed", name: "Weed", type: "animate", state: "insisting", position: {x:7,y:5}, icon:"🌾", adjacentTo:["rat","puddle"] },
      ],
      latent: seedLatents(["pigeon","rat","graffiti","traffic-light","puddle","weed"]),
      ambientBehaviors: [
        { entity: "traffic-light", vector: "SHIFT", probability: 0.35 },
        { entity: "pigeon", vector: "GOAL", probability: 0.30 },
        { entity: "rat", vector: "OBSTACLE", probability: 0.35 }
      ]
    }
  };

  function seedLatents(ids){
    const out = {};
    for (const id of ids){
      out[id] = {
        GOAL: `${id} moves toward a resource gradient—heat, scent, moisture, or signal. The environment becomes a map of partial promises.`,
        OBSTACLE: `${id} meets resistance: a barrier, a rival force, a missing pathway. The world stiffens; routes become refusals.`,
        SHIFT: `${id} changes state. Tempo, visibility, or identity re-tunes. The old description no longer fits cleanly.`
      };
    }
    return out;
  }

  // -----------------------------
  // State
  // -----------------------------
  let currentScenario = "cupboard";
  let selectedEntity = null;
  let tick = 0;

  let auditLog = [];

  // Autoplay
  let isAutoplay = false;
  let autoplayTimer = null;
  let countdownTimer = null;
  let secondsToNext = 0;

  // -----------------------------
  // DOM
  // -----------------------------
  const elScenarioSelect = byId("scenarioSelect");
  const elScenarioPill = byId("scenarioPill");
  const elGrid = byId("grid");
  const elLinks = byId("linkLayer");
  const elEntityList = byId("entityList");
  const elWorldtext = byId("worldtext");
  const elLatentPanel = byId("latentPanel");
  const elAuditLog = byId("auditLog");
  const elTickLabel = byId("tickLabel");
  const elSelectedPill = byId("selectedPill");

  const btnGoal = byId("btnGoal");
  const btnObstacle = byId("btnObstacle");
  const btnShift = byId("btnShift");

  const elAutoplayToggle = byId("autoplayToggle");
  const elCountdownPill = byId("countdownPill");

  const elBpmSlider = byId("bpmSlider");
  const elFxSlider = byId("fxSlider");
  const elRippleSpeedSlider = byId("rippleSpeedSlider");
  const elBpmLabel = byId("bpmLabel");

  // -----------------------------
  // Init
  // -----------------------------
  function init(){
    populateScenarioSelect();
    bindUI();
    applyFxFromSliders();
    changeScenario(currentScenario);
  }

  function populateScenarioSelect(){
    elScenarioSelect.innerHTML = "";
    for (const s of SCENARIOS){
      const opt = document.createElement("option");
      opt.value = s.id;
      opt.textContent = s.name;
      elScenarioSelect.appendChild(opt);
    }
    elScenarioSelect.value = currentScenario;
  }

  function bindUI(){
    elScenarioSelect.addEventListener("change", () => changeScenario(elScenarioSelect.value));

    btnGoal.addEventListener("click", () => triggerRipple("GOAL"));
    btnObstacle.addEventListener("click", () => triggerRipple("OBSTACLE"));
    btnShift.addEventListener("click", () => triggerRipple("SHIFT"));

    elAutoplayToggle.addEventListener("click", toggleAutoplay);

    elBpmSlider.addEventListener("input", () => {
      const bpm = clamp(parseInt(elBpmSlider.value, 10), 6, 60);
      elBpmLabel.textContent = String(bpm);
      if (isAutoplay) restartAutoplay();
    });

    elFxSlider.addEventListener("input", applyFxFromSliders);
    elRippleSpeedSlider.addEventListener("input", applyFxFromSliders);

    // Keyboard controls
    window.addEventListener("keydown", (e) => {
      const key = e.key;

      if (key === "ArrowLeft"){ e.preventDefault(); cycleScenario(-1); }
      if (key === "ArrowRight"){ e.preventDefault(); cycleScenario(1); }

      if (key === " "){
        e.preventDefault();
        toggleAutoplay();
      }

      if (key === "g" || key === "G") triggerRipple("GOAL");
      if (key === "o" || key === "O") triggerRipple("OBSTACLE");
      if (key === "s" || key === "S") triggerRipple("SHIFT");

      if (/^[1-6]$/.test(key)){
        const idx = parseInt(key, 10) - 1;
        const ents = getScenario().entities;
        if (ents[idx]) selectEntity(ents[idx].id);
      }
    });

    // Recompute link geometry on resize
    window.addEventListener("resize", () => {
      clearTimeout(window.__linksDebounce);
      window.__linksDebounce = setTimeout(renderLinks, 120);
    });
  }

  function applyFxFromSliders(){
    const fx = clamp(parseInt(elFxSlider.value, 10) / 100, 0, 1);
    const sp = clamp(parseInt(elRippleSpeedSlider.value, 10) / 100, 0.5, 2);

    document.documentElement.style.setProperty("--fx-flicker", String(0.15 + 0.85*fx));
    document.documentElement.style.setProperty("--fx-glow", String(0.15 + 0.85*fx));
    document.documentElement.style.setProperty("--fx-ripple-speed", String(sp));
  }

  // -----------------------------
  // Scenario / Rendering
  // -----------------------------
  function getScenario(){ return latentLibrary[currentScenario]; }

  function cycleScenario(dir){
    const i = SCENARIOS.findIndex(s => s.id === currentScenario);
    const next = (i + dir + SCENARIOS.length) % SCENARIOS.length;
    changeScenario(SCENARIOS[next].id);
  }

  function changeScenario(id){
    currentScenario = id;
    elScenarioSelect.value = id;

    const meta = SCENARIOS.find(s => s.id === id);
    elScenarioPill.textContent = meta ? meta.name : id;

    // Reset state on scenario change
    selectedEntity = null;
    tick = 0;
    auditLog = [];

    // Stop autoplay when switching
    if (isAutoplay) toggleAutoplay();

    renderAll();
    setWorldtext(getScenario().baseline, { mode: "baseline" });
  }

  function renderAll(){
    renderEntityPool();
    renderGrid();
    renderLinks();
    renderLatentPanel();
    renderAuditLog();
    updateVectorButtons();
    updateSelectedPill();
    elTickLabel.textContent = String(tick);
  }

  function renderEntityPool(){
    elEntityList.innerHTML = "";
    const ents = getScenario().entities;

    ents.forEach((ent, i) => {
      const item = document.createElement("div");
      item.className = "entity-item" + (selectedEntity === ent.id ? " selected" : "");
      item.addEventListener("click", () => selectEntity(ent.id));

      const icon = document.createElement("div");
      icon.className = "entity-icon";
      icon.textContent = ent.icon || "•";

      const meta = document.createElement("div");
      meta.className = "entity-meta";

      const name = document.createElement("div");
      name.className = "entity-name";
      name.textContent = ent.name;

      const sub = document.createElement("div");
      sub.className = "entity-sub";
      sub.textContent = `${ent.type} / ${ent.state} · key ${i+1}`;

      meta.appendChild(name);
      meta.appendChild(sub);

      item.appendChild(icon);
      item.appendChild(meta);
      elEntityList.appendChild(item);
    });
  }

  function renderGrid(){
    const sc = getScenario();
    const { cols, rows } = sc.grid;

    document.documentElement.style.setProperty("--cols", cols);
    document.documentElement.style.setProperty("--rows", rows);

    elGrid.innerHTML = "";

    // occupancy map
    const occupied = new Map();
    for (const ent of sc.entities){
      occupied.set(`${ent.position.x},${ent.position.y}`, ent);
    }

    for (let y=0; y<rows; y++){
      for (let x=0; x<cols; x++){
        const cell = document.createElement("div");
        cell.className = "grid-cell";

        const ent = occupied.get(`${x},${y}`);
        if (ent){
          cell.classList.add("has-entity");
          cell.dataset.entityId = ent.id;

          if (selectedEntity === ent.id) cell.classList.add("selected");

          const inner = document.createElement("div");
          inner.className = "grid-entity";
          inner.innerHTML = `
            <div class="icon">${escapeHtml(ent.icon || "•")}</div>
            <div class="label">${escapeHtml(ent.id)}</div>
          `;
          cell.appendChild(inner);

          cell.addEventListener("click", () => selectEntity(ent.id));
        }

        elGrid.appendChild(cell);
      }
    }
  }

  function renderLinks(){
    elLinks.innerHTML = "";
    const sc = getScenario();
    const { cols } = sc.grid;

    const rect = elGrid.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;

    const cellSize = rect.width / cols;
    elLinks.setAttribute("viewBox", `0 0 ${rect.width} ${rect.height}`);

    const centers = {};
    for (const ent of sc.entities){
      centers[ent.id] = {
        cx: (ent.position.x + 0.5) * cellSize,
        cy: (ent.position.y + 0.5) * cellSize
      };
    }

    const drawn = new Set();
    for (const ent of sc.entities){
      const a = centers[ent.id];
      if (!a) continue;

      for (const adj of (ent.adjacentTo || [])){
        const b = centers[adj];
        if (!b) continue;

        const key = [ent.id, adj].sort().join("::");
        if (drawn.has(key)) continue;
        drawn.add(key);

        const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
        line.setAttribute("x1", String(a.cx));
        line.setAttribute("y1", String(a.cy));
        line.setAttribute("x2", String(b.cx));
        line.setAttribute("y2", String(b.cy));
        elLinks.appendChild(line);
      }
    }
  }

  function selectEntity(entityId){
    selectedEntity = entityId;
    renderAll();

    // keep baseline visible unless we’re in a ripple-generated view
    if (elWorldtext.dataset.mode !== "ripple"){
      const ent = getScenario().entities.find(e => e.id === selectedEntity);
      if (ent){
        setWorldtext(
          getScenario().baseline + `\n\n[Perspective locked: ${ent.name} (${ent.id}). Press G/O/S.]`,
          { mode: "baseline" }
        );
      }
    }
  }

  function updateVectorButtons(){
    const enabled = !!selectedEntity;
    btnGoal.disabled = !enabled;
    btnObstacle.disabled = !enabled;
    btnShift.disabled = !enabled;
  }

  function updateSelectedPill(){
    if (!selectedEntity){
      elSelectedPill.textContent = "NO ENTITY";
      return;
    }
    const ent = getScenario().entities.find(e => e.id === selectedEntity);
    elSelectedPill.textContent = (ent ? ent.id : selectedEntity).toUpperCase();
  }

  // -----------------------------
  // Worldtext rendering with clickable entities
  // -----------------------------
  function setWorldtext(text, opts = {}){
    const mode = opts.mode || "ripple";
    elWorldtext.dataset.mode = mode;

    const sc = getScenario();

    // Build replacement tokens (names first to reduce partial collisions)
    const tokens = [];
    for (const ent of sc.entities){
      tokens.push({ key: ent.name, id: ent.id });
      tokens.push({ key: ent.id, id: ent.id });
    }
    tokens.sort((a,b) => b.key.length - a.key.length);

    let html = escapeHtml(text);
    for (const t of tokens){
      const safeKey = escapeRegExp(t.key);
      html = html.replace(
        new RegExp(`\\b${safeKey}\\b`, "g"),
        `<span class="entity-link" data-entity="${escapeHtml(t.id)}">${escapeHtml(t.key)}</span>`
      );
    }

    elWorldtext.innerHTML = html;
    elWorldtext.scrollTop = 0;

    // Delegate clicks
    elWorldtext.querySelectorAll(".entity-link").forEach(span => {
      span.addEventListener("click", (e) => {
        const id = e.currentTarget.getAttribute("data-entity");
        if (id) selectEntity(id);
      });
    });
  }

  // -----------------------------
  // Latent Library Panel (preview-only)
  // -----------------------------
  function renderLatentPanel(){
    elLatentPanel.innerHTML = "";

    if (!selectedEntity){
      const d = document.createElement("div");
      d.className = "help";
      d.textContent = "Select an entity to view latent descriptions (GOAL / OBSTACLE / SHIFT).";
      elLatentPanel.appendChild(d);
      return;
    }

    const sc = getScenario();
    const ent = sc.entities.find(e => e.id === selectedEntity);
    const latent = sc.latent[selectedEntity] || {};

    const cards = [
      { vec: "GOAL", color: "var(--term-gold)" },
      { vec: "OBSTACLE", color: "var(--term-alert)" },
      { vec: "SHIFT", color: "var(--term-cyan)" },
    ];

    for (const c of cards){
      const card = document.createElement("div");
      card.className = "latent-card";

      const h = document.createElement("div");
      h.className = "h";
      h.innerHTML = `
        <span style="color:${c.color}">${c.vec}</span>
        <span class="tag">${escapeHtml(ent ? ent.id : selectedEntity)}</span>
      `;

      const txt = document.createElement("div");
      txt.className = "txt";
      txt.textContent = latent[c.vec] || "(no seed)";

      // preview-only: do not ripple, do not tick
      txt.addEventListener("click", () => {
        const expanded = expandToWorldtext(latent[c.vec] || "", ent, c.vec, sc);
        setWorldtext(`[PREVIEW — ${ent.name} + ${c.vec}]\n\n${expanded}`, { mode: "preview" });
      });

      card.appendChild(h);
      card.appendChild(txt);
      elLatentPanel.appendChild(card);
    }
  }

  // -----------------------------
  // Ripple / Audit / Tick
  // -----------------------------
  function triggerRipple(vector){
    if (!selectedEntity) return;

    const sc = getScenario();
    const ent = sc.entities.find(e => e.id === selectedEntity);
    if (!ent) return;

    // Visual ripple: selected entity + cascade neighbors
    rippleAtEntity(ent.id, vector, 1.0);
    (ent.adjacentTo || []).forEach((adjId, i) => {
      setTimeout(() => rippleAtEntity(adjId, vector, 0.55), 220 + i*110);
    });

    // Worldtext: expand from latent seed
    const seed = (sc.latent[ent.id] && sc.latent[ent.id][vector]) ? sc.latent[ent.id][vector] : "";
    const description = expandToWorldtext(seed, ent, vector, sc);
    setWorldtext(description, { mode: "ripple" });

    // Audit entry
    auditLog.unshift({
      tick,
      time: new Date().toLocaleTimeString(),
      entityId: ent.id,
      entityName: ent.name,
      vector,
      description
    });
    renderAuditLog();

    // Tick increments after event logged
    tick++;
    elTickLabel.textContent = String(tick);
  }

  // Rewritten + complete ripple function (fixing the truncation issue)
  function rippleAtEntity(entityId, vector, intensity){
    const cell = Array.from(elGrid.querySelectorAll(".grid-cell.has-entity"))
      .find(c => c.dataset.entityId === entityId);
    if (!cell) return;

    const cls = vector.toLowerCase(); // goal | obstacle | shift

    // Flash
    cell.classList.add("flash", cls);
    window.setTimeout(() => cell.classList.remove("flash", cls), 420);

    // Rings (two pulses)
    for (let i = 0; i < 2; i++){
      const ring = document.createElement("div");
      ring.className = `ripple-ring ${cls}`;
      ring.style.opacity = String(0.90 * intensity);
      ring.style.animationDelay = `${i * 110}ms`;

      cell.appendChild(ring);
      window.setTimeout(() => ring.remove(), 1600);
    }
  }

  function renderAuditLog(){
    elAuditLog.innerHTML = "";

    if (auditLog.length === 0){
      const d = document.createElement("div");
      d.className = "help";
      d.textContent = "No events yet. Trigger GOAL / OBSTACLE / SHIFT to begin. Entries are replayable.";
      elAuditLog.appendChild(d);
      return;
    }

    for (const entry of auditLog){
      const item = document.createElement("div");
      item.className = "audit-item";

      const color = vectorColorStyle(entry.vector);
      item.innerHTML = `
        <div class="row" style="justify-content:space-between;">
          <span><span class="k">T${entry.tick}</span> ${escapeHtml(entry.entityId)} → <span style="${color}">${escapeHtml(entry.vector)}</span></span>
          <span class="help" style="margin:0;">${escapeHtml(entry.time)}</span>
        </div>
      `;

      item.addEventListener("click", () => {
        selectEntity(entry.entityId);
        rippleAtEntity(entry.entityId, entry.vector, 1.0);
        setWorldtext(entry.description, { mode:"ripple" });
      });

      elAuditLog.appendChild(item);
    }
  }

  function vectorColorStyle(vec){
    if (vec === "GOAL") return "color: var(--term-gold)";
    if (vec === "OBSTACLE") return "color: var(--term-alert)";
    if (vec === "SHIFT") return "color: var(--term-cyan)";
    return "";
  }

  // -----------------------------
  // Autoplay
  // -----------------------------
  function toggleAutoplay(){
    isAutoplay = !isAutoplay;
    elAutoplayToggle.classList.toggle("on", isAutoplay);
    elAutoplayToggle.setAttribute("aria-checked", String(isAutoplay));

    if (isAutoplay) startAutoplay();
    else stopAutoplay();
  }

  function restartAutoplay(){
    if (!isAutoplay) return;
    stopAutoplay();
    startAutoplay();
  }

  function startAutoplay(){
    // choose default entity if none selected
    if (!selectedEntity){
      const ents = getScenario().entities;
      if (ents[0]) selectEntity(ents[0].id);
    }

    const bpm = clamp(parseInt(elBpmSlider.value, 10), 6, 60);
    elBpmLabel.textContent = String(bpm);

    const intervalMs = Math.round(60000 / bpm);

    secondsToNext = Math.ceil(intervalMs / 1000);
    elCountdownPill.style.display = "inline-block";
    elCountdownPill.textContent = `NEXT: ${secondsToNext}s`;

    countdownTimer = setInterval(() => {
      secondsToNext = Math.max(0, secondsToNext - 1);
      elCountdownPill.textContent = `NEXT: ${secondsToNext}s`;
    }, 1000);

    autoplayTimer = setInterval(() => {
      secondsToNext = Math.ceil(intervalMs / 1000);
      elCountdownPill.textContent = `NEXT: ${secondsToNext}s`;

      const { entityId, vector } = chooseAmbientMove();
      selectEntity(entityId);
      triggerRipple(vector);
    }, intervalMs);
  }

  function stopAutoplay(){
    clearInterval(autoplayTimer);
    clearInterval(countdownTimer);
    autoplayTimer = null;
    countdownTimer = null;
    elCountdownPill.style.display = "none";
  }

  function chooseAmbientMove(){
    const sc = getScenario();
    const pool = (sc.ambientBehaviors && sc.ambientBehaviors.length)
      ? sc.ambientBehaviors
      : sc.entities.map(e => ({ entity: e.id, vector: "SHIFT", probability: 1/sc.entities.length }));

    const total = pool.reduce((a,b) => a + (b.probability || 0), 0) || 1;
    let r = Math.random() * total;

    for (const item of pool){
      r -= (item.probability || 0);
      if (r <= 0) return { entityId: item.entity, vector: item.vector };
    }
    return { entityId: pool[0].entity, vector: pool[0].vector };
  }

  // -----------------------------
  // Seed expansion → worldtext (150–300ish words)
  // -----------------------------
  function expandToWorldtext(seed, ent, vector, sc){
    const uncertainty = ["might", "perhaps", "as if", "it is possible that", "almost", "seems to", "could be"];
    const sensory = {
      animate: ["I taste the gradient", "I listen for the edge", "I feel pressure shift", "I follow residue", "I measure distance by effort"],
      inanimate: ["I register contact", "I hold temperature", "I accumulate film", "I resist abrasion", "I reflect what passes"],
      abstract: ["I spread", "I thin", "I modulate", "I refract", "I cycle"],
    };
    const motifs = {
      GOAL: ["move toward", "seek", "align with", "close distance to", "track"],
      OBSTACLE: ["press against", "get blocked by", "get refused by", "get scraped by", "get misled by"],
      SHIFT: ["become", "re-tune", "relabel", "invert", "turn into"],
    };

    const entityType = ent?.type || "abstract";
    const s = sensory[entityType] || sensory.abstract;
    const vecMotifs = motifs[vector] || motifs.SHIFT;

    const base = (seed || "").trim();
    const lead = base.length ? base : `${ent?.name || "The entity"} experiences a perturbation.`;
    const ctx = `Scene: ${sc.name}. Vector: ${vector}.`;

    const sentences = [];
    sentences.push(toFirstPerson(lead, ent));

    for (let i=0; i<6; i++){
      const u = pick(uncertainty);
      const sense = pick(s);
      const m = pick(vecMotifs);
      sentences.push(`${capitalize(sense)}; I ${m} a change that ${u} is already underway.`);
    }

    const neighbors = (ent?.adjacentTo || []).slice(0, 2)
      .map(id => sc.entities.find(e => e.id === id))
      .filter(Boolean);

    if (neighbors.length === 2){
      sentences.push(`At the edge of my attention, ${neighbors[0].name} and ${neighbors[1].name} behave like instruments: they amplify, dampen, or reroute what I am becoming.`);
    } else if (neighbors.length === 1){
      sentences.push(`At the edge of my attention, ${neighbors[0].name} behaves like an instrument: amplifying or dampening what I am becoming.`);
    } else {
      sentences.push(`Even without company, the environment edits me: surfaces, currents, and constraints collaborate on my next state.`);
    }

    sentences.push(`The ripple settles into a temporary description. I do not claim this is what I am; only what I can sound like, right now, under this pressure.`);
    sentences.push(`(${ctx})`);

    let text = sentences.join(" ");

    const words = text.split(/\s+/).filter(Boolean);
    if (words.length < 150){
      while (words.length < 170){
        const u = pick(uncertainty);
        const sense = pick(s);
        const m = pick(vecMotifs);
        words.push(`${capitalize(sense)},`, "and", "I", m, "a", "boundary", "that", u, "was", "never", "stable.");
      }
      text = words.join(" ");
    } else if (words.length > 320){
      text = words.slice(0, 300).join(" ") + "…";
    }

    return text;
  }

  function toFirstPerson(text, ent){
    if (/\bI\b/.test(text)) return text;
    const name = ent?.name || "the entity";
    return `I am ${name}. ${text}`;
  }

  // -----------------------------
  // Utilities
  // -----------------------------
  function byId(id){
    const el = document.getElementById(id);
    if (!el) throw new Error(`Missing element #${id} in HTML.`);
    return el;
  }

  function clamp(n,min,max){ return Math.max(min, Math.min(max, n)); }
  function pick(arr){ return arr[Math.floor(Math.random()*arr.length)]; }
  function capitalize(s){ return s.charAt(0).toUpperCase() + s.slice(1); }

  function escapeHtml(str){
    return String(str).replace(/[&<>"']/g, (m) => ({
      "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
    }[m]));
  }

  function escapeRegExp(str){
    return String(str).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  // -----------------------------
  // Go
  // -----------------------------
  init();

})();