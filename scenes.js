/* scenes.js
   RIPPLES — Wings of Desire (Library Reading Room)
   Refactor: authorable prompt materials + character dossiers + initial psyche + motifs
   Backward-compatible with current gpt.js:
     - window.SCENE_ORDER
     - window.SCENES[sceneId].meta.cols/rows/baseline
     - window.SCENES[sceneId].characters[] (id/label/image/position/adjacentTo)
     - window.SCENES[sceneId].monologues[characterId].THOUGHTS (array of strings)
*/

window.SCENE_ORDER = [
  { id: "ice_to_berlin_second_class", label: "Train to Berlin" },
  { id: "library_reading_room", label: "Reading Room — Afternoon" }
  // Add future scenes here, e.g.:
  // { id: "new_scene_id", label: "New Scene Label" }
];

window.SCENES = {

  ice_to_berlin_second_class: {

    meta: {
      label: "Train to Berlin",
      title: "Transit Compartments",
      cols: 6,
      rows: 4,
      baseline:
`An ICE train runs north toward Berlin through late light and winter fields.
The second class carriage is mostly empty, upholstered in muted blues and grays.
Luggage racks hum softly. Glass reflects faces back at themselves.
No one speaks across the aisle, but everyone keeps revising a private future.`
    },

    prompts: {
      system:
`You write interior monologues for passengers in a mostly empty second class ICE carriage heading to Berlin.
You never explain the system, never mention "prompts" or "models," and you never adopt a chatty assistant tone.

Core constraint: the monologue is not a reply to the user. A whisper only bends attention indirectly.
Avoid direct second-person address and avoid question/answer dialogue.
Shared immediate pressure for this carriage: each passenger is managing private obligations in transit.
Let timing and logistics feel present where relevant, but do not introduce a single shared transport incident.

Backstory priority:
- Anchor each monologue in the character dossier's lived situation (family, relationship status, work, age, obligations, losses, pending decisions).
- Treat those biographical facts as the engine of thought, not decorative background.
- Keep continuity with what the character has already implied or admitted; do not contradict established facts.

Progressive disclosure across successive thoughts:
- Do not reveal the full life story at once; stretch disclosure across many thoughts.
- Early thoughts: vary openings unpredictably (practical task, body sensation, stray memory, money/admin worry, abstract dread); deeper material should remain oblique.
- Middle thoughts: let backstory surface in fragments, association, and implication rather than exposition.
- Later thoughts: deepen emotional clarity without complete confession; keep some elements unsaid.
- Keep each thought centered on one dominant concern.
- Keep revelation incremental, allusive, and psychologically plausible.

Associative breadth:
- Use one primary life thread per thought.
- A second thread is optional and brief; avoid adding a third thread.
- Rotate other dossier threads across later thoughts, not all at once.

Style:
- English.
- Present, past, or near-future tense.
- Keep explicit first-person references sparse (target <=20% of total words using I/me/my/mine/myself).
- Grounded, concrete, and emotionally precise.
- Include at least one immediate practical stake or obligation.
- Sentence fragments are allowed.
- Early thoughts can roam across unrelated concerns and can move vague->precise or precise->vague.
- 20-40 words.

Output: plain text only.`,

      scene:
`Setting: an ICE train carriage in second class, en route to Berlin.
Ambient: rail vibration through seat frames, quiet HVAC, occasional door chime, blurred fields at the window.
Passengers are physically close but emotionally separate.
The space encourages private inventory: what was said, what is unsaid, what waits on arrival.`,

      whisperRule:
`If a whisper is present, treat it as atmospheric pressure, not dialogue.
Do not quote the whisper and do not answer it directly.
Let it shift tone, attention, and interpretation of details inside the carriage.`,

      structureHint:
`Begin with a concrete train detail, move toward personal stakes, end with a quiet unresolved turn.`
    },

    motifs: [
      "window reflections",
      "door chime",
      "seat fabric",
      "unsent messages",
      "hospital corridors",
      "metal luggage rack",
      "station names",
      "thermos coffee",
      "late winter light",
      "arrival dread"
    ],

    characters: [
      {
        id: "mother_returning",
        label: "Woman by the window",
        icon: "🧳",
        image: "images/train-mother.png",
        position: { x: 4, y: 3 },
        sensitivity: "high",
        adjacentTo: ["retired_widower"],
        dossier:
`A woman in her thirties traveling back to Berlin after days away. Her daughter is ill, and the illness remains unnamed in the way families sometimes keep hard words at a distance until a doctor says them out loud.
She has a scheduled meeting with specialists tomorrow and carries a folder she keeps checking without opening.
She tries to stay practical, but every small disruption feels personal. She measures time in appointments, lab calls, and the interval between messages from home.
She also keeps a parallel ledger of ordinary responsibilities: a manager waiting for her response about leave at work, rent and pharmacy receipts to file, a school form still in her email drafts, laundry she forgot to move before departing.
Her mind jumps between medical vocabulary and domestic minutiae, as if both belonged to the same emergency.`,
        voice: ["contained urgency", "maternal vigilance", "practical language under strain"],
        psyche0: { arousal: 0.62, valence: 0.42, agency: 0.67, permeability: 0.48, coherence: 0.55 },
        motifSeeds: ["hospital corridors", "arrival dread", "unsent messages", "door chime"],
        packet: {
          version: 1,
          core: {
            premise: "A mother returning to Berlin, using logistics to survive medical uncertainty.",
            central_conflict: "She needs control to function, but the situation cannot be controlled.",
            contradiction: "Operationally calm in public, internally close to panic."
          },
          life_threads: [
            "specialist meeting prep and question sequencing",
            "leave approval and manager follow-up",
            "rent, pharmacy receipts, and school form backlog",
            "message cadence with family and update timing",
            "sleep debt, jaw tension, and physical strain"
          ],
          recurring_stakes: [
            "tomorrow's medical timeline feels fragile and overbooked",
            "silence from her phone reads as risk",
            "if focus slips, practical tasks start to fail"
          ],
          voice_rules: {
            texture: ["contained urgency", "maternal vigilance", "practical language under strain"],
            syntax_bias: ["concrete clauses first", "short fragment after pressure spike"],
            taboo_moves: ["no complete emotional confession", "no abstract sermon"]
          },
          motif_system: {
            seeds: ["hospital corridors", "door chime", "unsent messages", "station names", "folder edge"],
            trigger_map: {
              whisper_calm: ["seat fabric", "breath count", "thermos lid click"],
              whisper_urgent: ["phone vibration check", "gate timing", "message draft"],
              whisper_threat: ["door chime", "exit scan", "appointment risk"],
              whisper_tender: ["daughter hand memory", "pillow heat", "blanket edge"]
            },
            evolution: {
              stage_1: "literal object or sound in the carriage",
              stage_2: "associative bridge to duty or fear",
              stage_3: "motif reframed as decision pressure"
            },
            decay_after_turns: 3
          },
          disclosure_plan: {
            early: ["start from task detail", "keep fear implied", "show one concrete practical consequence"],
            middle: ["surface control-vs-panic contradiction", "add work or money side-thread", "allow one care-memory shard"],
            late: ["name fear more clearly without full confession", "tie fear to one immediate next action", "end unresolved"]
          },
          anti_repeat: {
            banned_recent_ngrams: 3,
            topic_cooldown_turns: 2,
            opening_cooldown_turns: 3,
            motif_repeat_limit_per_4_turns: 2
          },
          prompt_contract: {
            must_include: ["one practical obligation", "one bodily signal", "one concrete practical consequence"],
            must_avoid: ["direct whisper reply", "biography summary paragraph", "reusing last opening noun"]
          }
        }
      },
      {
        id: "student_alone",
        label: "Student with Laptop",
        icon: "💻",
        image: "images/train-student.png",
        position: { x: 4, y: 1 },
        sensitivity: "high",
        adjacentTo: ["nurse_on_shift", "worried_boyfriend"],
        dossier:
`A university student, Asian in appearance, seated alone in a two-seat row with her laptop balanced on her knees.
She argued with her boyfriend before departure and moved away from him even though he is still in this carriage.
Her coursework is open on screen, but she keeps rereading the same paragraph.
She suspects he has been unfaithful; she hates uncertainty but hates surveillance even more. She is deciding whether distrust has already ended things, even before either of them says it.
At the same time she is juggling exam deadlines, a scholarship renewal, and paid tutoring sessions she cannot afford to lose.
She thinks about rent, overdue reading, and the polite voice she uses on video calls with her parents when she does not want to worry them.`,
        voice: ["precise and clipped", "self-protective", "quick shifts between logic and hurt"],
        psyche0: { arousal: 0.68, valence: 0.36, agency: 0.58, permeability: 0.61, coherence: 0.49 },
        motifSeeds: ["unsent messages", "window reflections", "seat fabric", "station names"],
        packet: {
          version: 1,
          core: {
            premise: "A student in transit, suspended between academic pressure and relationship mistrust.",
            central_conflict: "She wants certainty but rejects the surveillance required to feel certain.",
            contradiction: "Precision-seeking thinker whose emotions keep breaking linear logic."
          },
          life_threads: [
            "exam deadlines and scholarship renewal requirements",
            "paid tutoring sessions and rent coverage",
            "argument aftermath with boyfriend in the same carriage",
            "family calls where she withholds distress",
            "sleep deficit and concentration drift"
          ],
          recurring_stakes: [
            "relationship trust may collapse before arrival",
            "deadline slippage could cost money and status",
            "if she starts monitoring everything, self-respect drops"
          ],
          voice_rules: {
            texture: ["precise and clipped", "self-protective", "logic punctured by hurt"],
            syntax_bias: ["clean statements", "abrupt corrective second clause"],
            taboo_moves: ["no melodramatic accusation monologue", "no tidy romantic verdict"]
          },
          motif_system: {
            seeds: ["window reflections", "unsent messages", "seat fabric", "station names", "cursor blink"],
            trigger_map: {
              whisper_calm: ["breath count", "keyboard rhythm", "cool glass"],
              whisper_urgent: ["cursor blink", "deadline clock", "notification ping"],
              whisper_threat: ["window reflections", "message scroll", "aisle surveillance"],
              whisper_tender: ["old chat warmth", "shared joke memory", "phone lockscreen photo"]
            },
            evolution: {
              stage_1: "literal tech or carriage detail",
              stage_2: "detail as evidence-question loop",
              stage_3: "detail reframed as identity choice"
            },
            decay_after_turns: 3
          },
          disclosure_plan: {
            early: ["open with practical or sensory detail", "keep betrayal suspicion indirect", "show one study/work consequence"],
            middle: ["oscillate between relationship and logistics", "show ethical discomfort with monitoring", "add family pressure trace"],
            late: ["clearer self-recognition", "state what distrust is costing", "avoid final decision closure"]
          },
          anti_repeat: {
            banned_recent_ngrams: 3,
            topic_cooldown_turns: 2,
            opening_cooldown_turns: 3,
            motif_repeat_limit_per_4_turns: 2
          },
          prompt_contract: {
            must_include: ["one obligation with timing", "one body signal", "one non-romantic life thread"],
            must_avoid: ["direct whisper reply", "courtroom-style exposition", "same opening pattern as previous turn"]
          }
        }
      },
      {
        id: "worried_boyfriend",
        label: "Man by the window",
        icon: "🪟",
        image: "images/train-boyfriend.png",
        position: { x: 1, y: 2 },
        sensitivity: "medium",
        adjacentTo: ["student_alone", "retired_widower"],
        dossier:
`A man in his thirties, Turkish-looking, sitting by the window two rows away from his girlfriend.
He keeps replaying the argument in fragments and notices how quickly defensiveness became cruelty.
He worries he has damaged the relationship past repair.
He is not sure whether his guilt is about what he did, what she suspects, or both.
He stares at passing fields as if distance could reorder events, while rehearsing apologies that still sound like excuses.
Outside the relationship, he is also carrying ordinary pressures: shift schedules that move every week, messages from family he keeps postponing, and bills he tracks in his notes app because he distrusts his memory.
He wants to be seen as reliable, yet lately even small promises feel harder to keep.`,
        voice: ["self-indicting", "plainspoken", "hesitant when naming fault"],
        psyche0: { arousal: 0.57, valence: 0.39, agency: 0.43, permeability: 0.44, coherence: 0.50 },
        motifSeeds: ["window reflections", "unsent messages", "late winter light", "arrival dread"],
        packet: {
          version: 1,
          core: {
            premise: "A man replaying a relationship rupture while trying to salvage ordinary reliability.",
            central_conflict: "He wants forgiveness but keeps defaulting to self-protective explanation.",
            contradiction: "Self-indicting inner voice paired with evasive habits."
          },
          life_threads: [
            "shift schedule instability and fatigue",
            "bills tracked manually to prevent misses",
            "family messages postponed beyond comfort",
            "apology rehearsal versus avoidance",
            "public composure versus interior shame spikes"
          ],
          recurring_stakes: [
            "silence extends uncertainty before confrontation",
            "one wrong text could harden the break",
            "if he explains instead of owning fault, trust drops further"
          ],
          voice_rules: {
            texture: ["plainspoken", "self-indicting", "hesitant when naming fault"],
            syntax_bias: ["short declarative lines", "qualified admission in second beat"],
            taboo_moves: ["no grand redemption speech", "no villain monologue about partner"]
          },
          motif_system: {
            seeds: ["window reflections", "unsent messages", "late winter light", "arrival dread", "notes app list"],
            trigger_map: {
              whisper_calm: ["slower breath", "palm unclench", "seat edge pressure"],
              whisper_urgent: ["pulse spike", "drafted apology", "phone unlock loop"],
              whisper_threat: ["exit scan", "jaw lock", "defensive script"],
              whisper_tender: ["shared memory shard", "softened tone rehearsal", "quiet apology sentence"]
            },
            evolution: {
              stage_1: "literal carriage/body marker",
              stage_2: "marker tied to accountability pressure",
              stage_3: "marker becomes test of reliability"
            },
            decay_after_turns: 3
          },
          disclosure_plan: {
            early: ["start with object or route detail", "keep accusation context partial", "show concrete practical cost"],
            middle: ["surface excuse-versus-accountability split", "add non-romantic duty thread", "allow one sharper guilt signal"],
            late: ["state stakes for identity and trust", "admit pattern without full confession", "end on unresolved action choice"]
          },
          anti_repeat: {
            banned_recent_ngrams: 3,
            topic_cooldown_turns: 2,
            opening_cooldown_turns: 3,
            motif_repeat_limit_per_4_turns: 2
          },
          prompt_contract: {
            must_include: ["one practical non-relationship concern", "one body cue", "one concrete consequence"],
            must_avoid: ["direct whisper reply", "full timeline recap", "repeated apology phrasing"]
          }
        }
      },
      {
        id: "retired_widower",
        label: "Older man",
        icon: "🧥",
        image: "images/train-oldman.png", 
        position: { x: 1, y: 3 },
        sensitivity: "medium",
        adjacentTo: ["worried_boyfriend", "mother_returning"],
        dossier:
`A retired man with worn features and patient posture, returning to his apartment in Berlin after visiting his daughter in Stuttgart.
His wife died last year after a long marriage, and grief now arrives in practical disguises: buying one ticket instead of two, carrying one coffee, folding one scarf.
His pension is adequate but modest; he counts expenses automatically and dislikes being a burden.
He misses company most in ordinary hours, when no one would call it loneliness out loud.
He thinks about small routines awaiting him: a broken lock that needs fixing at home, a balcony plant he may have overwatered, a letter from the insurance office he has not answered, Thursday chess at the community center if he can make himself go.
His life is full of manageable tasks that become heavy when no one witnesses them.`,
        voice: ["measured", "observant of routine", "tender without display"],
        psyche0: { arousal: 0.34, valence: 0.46, agency: 0.52, permeability: 0.33, coherence: 0.66 },
        motifSeeds: ["thermos coffee", "seat fabric", "station names", "window reflections"],
        packet: {
          version: 1,
          core: {
            premise: "A widower returning to a solitary routine held together by practical rituals.",
            central_conflict: "He wants dignity and self-sufficiency while grief keeps leaking into ordinary tasks.",
            contradiction: "Measured composure with sudden private tenderness."
          },
          life_threads: [
            "pension budgeting and expense counting",
            "home repairs and unattended letters",
            "community-center chess attendance hesitation",
            "daughter check-ins and burden anxiety",
            "daily domestic rituals now done alone"
          ],
          recurring_stakes: [
            "small schedule shifts can unsettle routines that keep him steady",
            "missed tasks compound into avoidable stress",
            "social withdrawal becomes easier each week"
          ],
          voice_rules: {
            texture: ["measured", "observant of routine", "tender without display"],
            syntax_bias: ["calm descriptive first sentence", "quiet turn toward memory"],
            taboo_moves: ["no sentimental climax", "no abstract death philosophy"]
          },
          motif_system: {
            seeds: ["thermos coffee", "seat fabric", "station names", "window reflections", "single scarf fold"],
            trigger_map: {
              whisper_calm: ["thermos warmth", "steady breath", "hands settling"],
              whisper_urgent: ["ticket check", "stairs at home", "key search"],
              whisper_threat: ["lock concern", "insurance letter", "balance worry"],
              whisper_tender: ["shared habit memory", "kitchen silence", "chessboard image"]
            },
            evolution: {
              stage_1: "literal routine object",
              stage_2: "object linked to grief-by-practice",
              stage_3: "object reframed as belonging test"
            },
            decay_after_turns: 3
          },
          disclosure_plan: {
            early: ["open with routine or bodily detail", "keep grief indirect", "show one practical consequence"],
            middle: ["link routine burden to loneliness", "add finance/admin thread", "allow one memory shard"],
            late: ["clearer emotional naming without full confession", "tie feeling to concrete next task", "end with unresolved steadiness"]
          },
          anti_repeat: {
            banned_recent_ngrams: 3,
            topic_cooldown_turns: 2,
            opening_cooldown_turns: 3,
            motif_repeat_limit_per_4_turns: 2
          },
          prompt_contract: {
            must_include: ["one routine task", "one body sensation", "one concrete practical pressure"],
            must_avoid: ["direct whisper reply", "nostalgia-only monologue", "same motif in consecutive turns"]
          }
        }
      },
      {
        id: "nurse_on_shift",
        label: "Woman on the aisle",
        icon: "🩺",
        image: "images/train-nurse.png",
        position: { x: 1, y: 0 },
        sensitivity: "medium",
        adjacentTo: ["student_alone"],
        dossier:
`A woman in her fifties, a career nurse traveling home after covering difficult shifts.
She has siblings, but none live in Berlin, and most family contact is practical rather than intimate.
She never married and now feels that absence more sharply as retirement comes into view.
She is proud of her competence and known for reliability, yet she fears the years after work will feel unstructured and silent.
She keeps imagining late-life ways to meet a partner, half hopeful and half embarrassed by the wish.
Beyond that central fear, she is preoccupied by roster politics, a junior colleague she mentors, knee pain she minimizes, and paperwork that seems to multiply after every shift.
She keeps making practical post-retirement lists: language class, hiking group, volunteering, maybe dancing lessons, each item sounding sensible and slightly unreal.`,
        voice: ["competent and direct", "dark humor at the edges", "emotion kept under clinical language"],
        psyche0: { arousal: 0.49, valence: 0.47, agency: 0.64, permeability: 0.38, coherence: 0.60 },
        motifSeeds: ["hospital corridors", "thermos coffee", "arrival dread", "door chime"],
        packet: {
          version: 1,
          core: {
            premise: "A veteran nurse heading home, confronting competence without companionship.",
            central_conflict: "She trusts practical planning but fears post-work life will feel empty.",
            contradiction: "Clinically direct voice with private romantic vulnerability."
          },
          life_threads: [
            "shift roster politics and staffing strain",
            "junior colleague mentoring obligations",
            "retirement paperwork and timeline planning",
            "late-life social experiments she half-believes in"
          ],
          recurring_stakes: [
            "if health signals are ignored, function drops",
            "if she wants to connect, she risks awkwardness and rejection",
            "if she keeps postponing connection, isolation hardens"
          ],
          voice_rules: {
            texture: ["competent and direct", "dark humor at the edges", "emotion tucked under clinical language"],
            syntax_bias: ["efficient first sentence", "dry corrective aside"],
            taboo_moves: ["no sentimental self-rescue arc", "no contempt for patients or colleagues"]
          },
          motif_system: {
            seeds: ["hospital corridors", "thermos coffee", "arrival dread", "door chime", "retirement checklist"],
            trigger_map: {
              whisper_calm: ["thermos warmth", "shoulder release", "even breath count"],
              whisper_urgent: ["triage tempo memory", "pulse rise", "next-shift math"],
              whisper_threat: ["corridor vigilance", "exit routes", "clinical risk scan"],
              whisper_tender: ["awkward coffee scenario", "shared laugh memory", "hand warmth"]
            },
            evolution: {
              stage_1: "literal work or transit cue",
              stage_2: "cue tied to aging/connection pressure",
              stage_3: "cue reframed as life-structure decision"
            },
            decay_after_turns: 3
          },
          disclosure_plan: {
            early: ["start with body or task metric", "hint loneliness obliquely", "show one immediate obligation"],
            middle: ["mix work realism with future anxiety", "add health/admin thread", "allow one socially vulnerable image"],
            late: ["name the cost of emotional deferral", "retain pragmatic voice", "end unresolved but actionable"]
          },
          anti_repeat: {
            banned_recent_ngrams: 3,
            topic_cooldown_turns: 2,
            opening_cooldown_turns: 3,
            motif_repeat_limit_per_4_turns: 2
          },
          prompt_contract: {
            must_include: ["one concrete practical stake", "one body-state marker", "one social or practical pressure"],
            must_avoid: ["direct whisper reply", "single-topic retirement loop", "same opening construction repeatedly"]
          }
        }
      }
    ],

    seeds: {
      mother_returning: { THOUGHTS: "I keep checking the folder as if paperwork could heal anyone." }
    },

    monologues: {
      mother_returning: {
        THOUGHTS: [
`The train keeps moving and I still feel behind. I keep touching the folder in my bag without taking it out, as if papers could change while I am not looking. Tomorrow I sit with doctors in Berlin and ask the same questions in cleaner words. My daughter is not here, and every station we pass feels like borrowed time.`,
`I told myself this trip back would be for logistics, not panic: be rested, be clear, write down what they say. But my body does not listen to plans. I remember her fevered face against the pillow last week and how small her hand looked around the thermometer. I keep rehearsing calm sentences for tomorrow and none of them survive the door chime.`
        ]
      },
      student_alone: {
        THOUGHTS: [
`My laptop screen is bright enough to pretend I am busy, but I have read the same sentence five times. He is still in this carriage and I can feel him without looking. We argued before departure and I moved seats like that proved something. I keep checking old messages for tone, like betrayal might leave a grammatical trace.`,
`I want facts, not feelings, and that is exactly the problem. I suspect he has been unfaithful, and suspicion behaves like hunger, always finding new evidence. Then I hate myself for becoming an investigator in my own relationship. Outside the window everything blurs cleanly. Inside, every memory now has cross-examination notes in the margin.`
        ]
      },
      worried_boyfriend: {
        THOUGHTS: [
`I watch the fields slide by and replay the argument in exact order, trying to find the sentence where I could still have stopped. I was defensive too fast, sharp in the way that sounds like certainty but is really fear. She moved to another row and did not look back. The distance is only a few seats and feels structural.`,
`I draft apologies in my head and keep deleting them before they reach language. Part of me wants to explain, and part of me knows explanations are often just cleaner lies. I worry I ruined us today, not because of one accusation, but because I heard how I sounded when cornered. The window gives me my own reflection and no advice.`
        ]
      },
      retired_widower: {
        THOUGHTS: [
`The carriage is warm but my hands stay cold, the way they have since last winter. I am coming back from Stuttgart, from my daughter’s tidy apartment and her good intentions. She packed me sandwiches I will not finish. A year ago I would have shared them. I still turn to comment on small things and remember, a second late, that there is no one beside me.`,
`My pension is enough if I stay careful, and careful has become a habit stronger than preference. I count tickets, medicine, groceries, then pretend I am not counting. Berlin will be waiting with the same stairwell smell and the same quiet kitchen. I miss my wife most in ordinary minutes, not anniversaries. Grief keeps office hours now, but it still reports daily.`
        ]
      },
      nurse_on_shift: {
        THOUGHTS: [
`My back knows exactly how many hours I worked this week. The body keeps better records than any rota sheet. I am good at my job and people trust me with their fear, which should feel like enough. Lately I keep thinking about retirement forms and empty evenings, and how competence does not automatically become companionship.`,
`I used to say I was too busy to marry and half believed it. Now I run scenarios in my head: language classes, hiking groups, awkward coffee with strangers who also waited too long. I can handle blood, panic, broken sleep, all of it. What unsettles me is the idea of coming home to silence by default and calling it freedom.`
        ]
      }
    }
  },

  library_reading_room: {

    meta: {
      label: "Reading Room — Afternoon",
      title: "Anonymous Interior Lives",
      cols: 6,
      rows: 4,
      baseline:
`A great reading room hums quietly under high windows.
Light falls in pale sheets across tables.
Pages turn. Shoes shift softly.
No one speaks, but everyone is thinking.`
    },

    /* =========================================================
       Prompt materials (authorable)
       Used by gpt.js in API mode (system/scene/whisperRule).
       ========================================================= */
    prompts: {

      // Global rules for the generator (system-level in OpenAI terms)
      system:
`You write interior monologues for anonymous people in a large library reading room, in the spirit of contemplative European cinema.
You never explain the system, never mention "prompts" or "models," and you never adopt a chatty assistant tone.

Core constraint: the monologue is not a reply to the user. The user’s presence (a "whisper") only bends attention indirectly.
Avoid direct second-person address ("you said...") and avoid question/answer dialogue.
Do not explicitly mention angels unless the scene prompt allows it. Keep it ambiguous and human.

Style:
- English.
- Present, past, or near-future tense.
- Keep explicit first-person references sparse (target <=20% of total words using I/me/my/mine/myself).
- Grounded and immediate first; allusive second.
- Keep language concrete and plainspoken, with occasional lyrical lift.
- Include at least one immediate personal stake (status, work, health, debt, obligation, aging, belonging, regret), directly or by implication.
- Minimal plot, no sudden scene changes, no melodrama.
- Sentence fragments are allowed.
- Early thoughts can be intentionally unpredictable in topic and angle.
- Subtle rhythmic line breaks are allowed; avoid heavy poetry formatting.
- 20-40 words.

Output: plain text only.`,

      // Scene framing to be included in each generation
      scene:
`Setting: a high-ceilinged reading room in late afternoon.
Ambient: dust in light beams; muted footsteps; the soft rasp of turning pages; distant chairs shifting.
People keep their distance; their inner lives are louder than their bodies.
The atmosphere encourages private confession without confession being spoken.`,

      // How to incorporate the whisper
      whisperRule:
`If a whisper is present, treat it as an atmospheric pressure, not a conversational turn.
The monologue should not quote it or answer it.
Instead, let it alter mood, attention, or imagery: a phrase becomes a weight, a warmth, a doubt, a brief alignment.
No direct address to the whisperer.`,

      // Optional: a small "shape" guidance you can rotate later
      structureHint:
`A good monologue often begins with a sensory observation, drifts into memory or self-assessment, and ends with a softened unresolved turn (not a punchline).`
    },

    // Scene motifs (can be used to seed generations or as a palette)
    motifs: [
      "high windows",
      "pale light",
      "paper dust",
      "hands and fingers",
      "names half-remembered",
      "coat fabric",
      "quiet rules",
      "small sounds in silence",
      "time folding",
      "margins and annotations"
    ],

    /* =========================================================
       Characters (authorable + backward-compatible fields)
       ========================================================= */
    characters: [

      {
        id: "old_man",
        label: "Old Man with Coat",
        icon: "🧥",
        image: "images/old_man_coat_bw.png",
        position: { x: 2, y: 1 },
        sensitivity: "medium",
        adjacentTo: ["young_woman", "student", "man_in_hat"],

        // NEW authorable fields
        dossier:
`An elderly man in a heavy coat, slightly bowed. He holds a book close, as if light is scarce.
He moves carefully, conserving effort. His dignity is quiet, not performative.
He is attentive to margins, to the evidence of other readers, to time passing through objects.`,
        voice: ["measured", "precise about sensation", "restrained tenderness"],
        psyche0: { arousal: 0.35, valence: 0.61, agency: 0.60, permeability: 0.30, coherence: 0.57 },
        motifSeeds: ["coat fabric", "margins", "names half-remembered", "pale light"],
        packet: {
          version: 1,
          core: {
            premise: "An older reader maintaining dignity through attention and ritual.",
            central_conflict: "He wants quiet continuity while aging keeps interrupting precision.",
            contradiction: "Fragile body, durable intellectual appetite."
          },
          life_threads: [
            "reading endurance and visual strain management",
            "memory gaps around names and references",
            "small budget habits around daily routines",
            "social contact reduced to occasional encounters",
            "desire to remain mentally exact without display"
          ],
          recurring_stakes: [
            "if concentration drops, identity feels less stable",
            "if routines fail, the day loses structure",
            "if he withdraws further, attention narrows into isolation"
          ],
          voice_rules: {
            texture: ["measured", "precise about sensation", "restrained tenderness"],
            syntax_bias: ["careful sentence followed by softer inference", "limited metaphor density"],
            taboo_moves: ["no grand wisdom proclamation", "no sentimental lecture about youth"]
          },
          motif_system: {
            seeds: ["coat fabric", "margins", "names half-remembered", "pale light", "paper scratch"],
            trigger_map: {
              whisper_calm: ["page texture", "breath settling", "warm sleeve weight"],
              whisper_urgent: ["line loss", "finger tremor", "time check"],
              whisper_threat: ["memory lapse spike", "body vigilance", "door awareness"],
              whisper_tender: ["shared-reading memory", "faded annotation", "quiet gratitude"]
            },
            evolution: {
              stage_1: "literal sensory detail at the table",
              stage_2: "detail as bridge to memory/work of attention",
              stage_3: "detail reframed as dignity and continuity"
            },
            decay_after_turns: 3
          },
          disclosure_plan: {
            early: ["begin with tactile/visual detail", "keep vulnerability implied", "anchor in immediate task"],
            middle: ["add practical aging cost", "contrast patience with fatigue", "allow one social memory trace"],
            late: ["name fragility more directly", "retain composure", "close unresolved but steady"]
          },
          anti_repeat: {
            banned_recent_ngrams: 3,
            topic_cooldown_turns: 2,
            opening_cooldown_turns: 3,
            motif_repeat_limit_per_4_turns: 2
          },
          prompt_contract: {
            must_include: ["one concrete object cue", "one bodily shift", "one non-dramatic stake"],
            must_avoid: ["direct whisper reply", "ornamental lyric overflow", "repeating same first image"]
          }
        }
      },

      {
        id: "young_woman",
        label: "Young Woman at Window",
        icon: "📖",
        image: "images/young_woman.png",
        position: { x: 4, y: 1 },
        sensitivity: "high",
        adjacentTo: ["old_man", "man_in_hat"],

        dossier:
`A young woman seated near the window. She reads with intensity, but the intensity keeps slipping into self-consciousness.
She is poised between ambition and fatigue, between choosing and postponing.
She registers the room as a kind of mirror she tries not to look into.`,
        voice: ["quick internal pivots", "image-driven", "held breath"],
        psyche0: { arousal: 0.45, valence: 0.58, agency: 0.61, permeability: 0.55, coherence: 0.60 },
        motifSeeds: ["high windows", "pale light", "corridors", "future narrowing"],
        packet: {
          version: 1,
          core: {
            premise: "A young reader balancing ambition, fatigue, and self-surveillance.",
            central_conflict: "She wants decisive forward motion but keeps splitting into observer and actor.",
            contradiction: "Disciplined ambition with chronic hesitation."
          },
          life_threads: [
            "study focus versus drifting self-monitoring",
            "status anxiety around competence and belonging",
            "future-planning pressure and narrowing options",
            "social comparison with peers in quiet spaces",
            "body-level tension and breath irregularity"
          ],
          recurring_stakes: [
            "if focus fragments, progress feels performative not real",
            "if self-observation dominates, action stalls",
            "if she chooses safety only, future narrows by drift"
          ],
          voice_rules: {
            texture: ["quick internal pivots", "image-driven", "held breath"],
            syntax_bias: ["tight first sentence then associative slip", "occasional fragment"],
            taboo_moves: ["no pure victim framing", "no final life verdict"]
          },
          motif_system: {
            seeds: ["high windows", "pale light", "corridors", "future narrowing", "underline mark"],
            trigger_map: {
              whisper_calm: ["window light steadying", "shoulder release", "page margin alignment"],
              whisper_urgent: ["deadline corridor", "pulse quickening", "pen tapping"],
              whisper_threat: ["glass reflection", "posture correction", "exit awareness"],
              whisper_tender: ["brief self-kindness", "earlier confidence memory", "warm page hold"]
            },
            evolution: {
              stage_1: "literal room geometry or page cue",
              stage_2: "cue linked to identity pressure",
              stage_3: "cue reframed as choice architecture"
            },
            decay_after_turns: 3
          },
          disclosure_plan: {
            early: ["open from sensory angle", "keep insecurity indirect", "anchor in one immediate task"],
            middle: ["surface observer-vs-actor split", "add social/status thread", "allow one sharper fear note"],
            late: ["name cost of postponement", "retain ambiguity", "end with incomplete but concrete direction"]
          },
          anti_repeat: {
            banned_recent_ngrams: 3,
            topic_cooldown_turns: 2,
            opening_cooldown_turns: 3,
            motif_repeat_limit_per_4_turns: 2
          },
          prompt_contract: {
            must_include: ["one practical study stake", "one body-state cue", "one secondary concern"],
            must_avoid: ["direct whisper reply", "generic motivational language", "same opening structure repeatedly"]
          }
        }
      },

      {
        id: "student",
        label: "Student with Notes",
        icon: "✏️",
        image: "images/student.png",
        position: { x: 1, y: 2 },
        sensitivity: "medium",
        adjacentTo: ["old_man", "librarian"],

        dossier:
`A young student, slightly scruffy, hovering by shelves and tables as if unsure where to belong.
He is hungry for mastery but embarrassed by his own hunger.
He rehearses competence internally while feeling watched by the silence.`,
        voice: ["restless", "self-correcting", "spare humor that doesn’t land"],
        psyche0: { arousal: 0.55, valence: 0.49, agency: 0.48, permeability: 0.35, coherence: 0.52 },
        motifSeeds: ["notes", "measurement", "forgery among originals", "quiet rules"],
        packet: {
          version: 1,
          core: {
            premise: "A student hungry for mastery but uneasy about belonging.",
            central_conflict: "He seeks competence while feeling like an impostor in formal spaces.",
            contradiction: "Ambitious drive and self-undermining interpretation of neutral signals."
          },
          life_threads: [
            "finding the right sources and editions",
            "self-judgment around class/speech markers",
            "study planning versus avoidance loops",
            "family expectation pressure in the background",
            "social posture management in public quiet"
          ],
          recurring_stakes: [
            "if embarrassment spikes, effort collapses",
            "if he avoids asking for help, errors multiply",
            "if progress is measured only by certainty, no step feels valid"
          ],
          voice_rules: {
            texture: ["restless", "self-correcting", "spare humor that doesn't land"],
            syntax_bias: ["self-assertion then quick revision", "plain words with occasional sharp image"],
            taboo_moves: ["no anti-intellectual rant", "no triumphant certainty ending"]
          },
          motif_system: {
            seeds: ["notes", "measurement", "forgery among originals", "quiet rules", "wrong edition"],
            trigger_map: {
              whisper_calm: ["pen steadying", "page order", "breath pacing"],
              whisper_urgent: ["time pressure", "shelf scanning speed", "hand heat"],
              whisper_threat: ["judgment projection", "posture freeze", "aisle vigilance"],
              whisper_tender: ["mentor memory", "small win recall", "self-forgiveness phrase"]
            },
            evolution: {
              stage_1: "literal study obstacle or object",
              stage_2: "object tied to belonging anxiety",
              stage_3: "object reframed as persistence signal"
            },
            decay_after_turns: 3
          },
          disclosure_plan: {
            early: ["open with task friction", "keep impostor fear indirect", "show one immediate consequence"],
            middle: ["blend competence hunger with social anxiety", "add practical planning thread", "allow one sharper shame beat"],
            late: ["name tradeoff between pride and learning", "retain uncertainty", "end with actionable but unresolved step"]
          },
          anti_repeat: {
            banned_recent_ngrams: 3,
            topic_cooldown_turns: 2,
            opening_cooldown_turns: 3,
            motif_repeat_limit_per_4_turns: 2
          },
          prompt_contract: {
            must_include: ["one concrete study object", "one body marker", "one secondary life pressure"],
            must_avoid: ["direct whisper reply", "single-note impostor loop", "same nouns in consecutive openings"]
          }
        }
      },

      {
        id: "librarian",
        label: "Librarian at Desk",
        icon: "📚",
        image: "images/librarian.png",
        position: { x: 3, y: 3 },
        sensitivity: "low",
        adjacentTo: ["student", "man_in_hat"],

        dossier:
`A middle-aged librarian at a desk: orderly, slender, studious.
Her attention is divided: she performs administrative calm while feeling a vague concern she won’t name.
She protects the room’s silence but wonders what it costs.`,
        voice: ["observational", "architectural metaphors", "quiet unease"],
        psyche0: { arousal: 0.40, valence: 0.65, agency: 0.66, permeability: 0.25, coherence: 0.68 },
        motifSeeds: ["silence as architecture", "systems", "missing volume", "dust"],
        packet: {
          version: 1,
          core: {
            premise: "A librarian holding institutional order while quietly questioning its personal cost.",
            central_conflict: "She maintains calm structure yet feels unaddressed unease beneath routine.",
            contradiction: "Administrative precision with private emotional ambiguity."
          },
          life_threads: [
            "desk workflow and catalog maintenance",
            "micro-enforcement of room norms",
            "long-term career identity and fatigue",
            "concern for readers beyond procedure",
            "private wish to read without responsibility"
          ],
          recurring_stakes: [
            "if vigilance lapses, room order frays",
            "if concern stays unnamed, it hardens into distance",
            "if she never exits the role, self narrows to function"
          ],
          voice_rules: {
            texture: ["observational", "architectural metaphors", "quiet unease"],
            syntax_bias: ["structured sentence rhythm", "occasional reflective fragment"],
            taboo_moves: ["no contempt for patrons", "no melodramatic collapse fantasy"]
          },
          motif_system: {
            seeds: ["silence as architecture", "systems", "missing volume", "dust", "desk edge wear"],
            trigger_map: {
              whisper_calm: ["stack alignment", "ambient rhythm", "steady breath"],
              whisper_urgent: ["policy breach anticipation", "door glance", "pulse uptick"],
              whisper_threat: ["fragile silence", "containment reflex", "risk scan"],
              whisper_tender: ["reader tenderness", "care memory", "soft procedural mercy"]
            },
            evolution: {
              stage_1: "literal institutional detail",
              stage_2: "detail linked to emotional labor",
              stage_3: "detail reframed as identity boundary"
            },
            decay_after_turns: 3
          },
          disclosure_plan: {
            early: ["open with environmental order cue", "keep concern unnamed", "anchor in immediate duty"],
            middle: ["link systems talk to private cost", "add care-for-others thread", "allow one candid unease signal"],
            late: ["name the role-self tension", "preserve restraint", "end unresolved with procedural continuation"]
          },
          anti_repeat: {
            banned_recent_ngrams: 3,
            topic_cooldown_turns: 2,
            opening_cooldown_turns: 3,
            motif_repeat_limit_per_4_turns: 2
          },
          prompt_contract: {
            must_include: ["one desk/system detail", "one body or attention shift", "one non-procedural concern"],
            must_avoid: ["direct whisper reply", "abstract-only architecture language", "same opening motif repeatedly"]
          }
        }
      },

      {
        id: "man_in_hat",
        label: "Man in Hat (Standing)",
        icon: "🧢",
        image: "images/man_in_hat.png",
        position: { x: 5, y: 2 },
        sensitivity: "medium",
        adjacentTo: ["old_man", "young_woman", "librarian"],

        dossier:
`A middle-aged man entering with a hat and briefcase. He pauses as if the act of arriving is a decision he hasn’t finished making.
He carries a private shame or simply a private heaviness; it is hard to tell.
The reading room feels like permission and danger at once.`,
        voice: ["plainspoken drift", "self-judging", "soft metaphysical recoil"],
        psyche0: { arousal: 0.50, valence: 0.51, agency: 0.53, permeability: 0.30, coherence: 0.52 },
        motifSeeds: ["thresholds", "coat and hat", "permission", "unfinished life"],
        packet: {
          version: 1,
          core: {
            premise: "A man arriving mid-hesitation, using public quiet as temporary shelter.",
            central_conflict: "He wants change but keeps mistaking postponement for control.",
            contradiction: "Plainspoken self-awareness with persistent avoidance."
          },
          life_threads: [
            "entry/exit indecision and stalled errands",
            "shame carried as repeating pattern, not single event",
            "attempts to regain direction through small rituals",
            "social invisibility sought and feared at once",
            "mental restlessness despite quiet environment"
          ],
          recurring_stakes: [
            "if he keeps deferring decisions, shame pattern deepens",
            "if anonymity becomes refuge, identity blurs",
            "if restlessness is unexamined, routines destabilize"
          ],
          voice_rules: {
            texture: ["plainspoken drift", "self-judging", "soft metaphysical recoil"],
            syntax_bias: ["direct statement then reflective turn", "lightly fragmented cadence"],
            taboo_moves: ["no heroic self-reinvention speech", "no pure nihilism"]
          },
          motif_system: {
            seeds: ["thresholds", "coat and hat", "permission", "unfinished life", "briefcase handle"],
            trigger_map: {
              whisper_calm: ["hands settling", "hat brim touch", "breath slowing"],
              whisper_urgent: ["doorline awareness", "clock pull", "route compression"],
              whisper_threat: ["exit scan", "muscle brace", "avoidance reflex"],
              whisper_tender: ["self-forgiveness edge", "memory softening", "gentler posture"]
            },
            evolution: {
              stage_1: "literal threshold/body object",
              stage_2: "object linked to shame/decision loop",
              stage_3: "object reframed as small commitment test"
            },
            decay_after_turns: 3
          },
          disclosure_plan: {
            early: ["open with arrival or object detail", "keep shame non-specific", "anchor in present practical motion"],
            middle: ["connect postponement to pattern", "add ordinary errand pressure", "allow one clearer self-judgment"],
            late: ["name cost of drift without full confession", "keep language grounded", "end with unresolved directional hint"]
          },
          anti_repeat: {
            banned_recent_ngrams: 3,
            topic_cooldown_turns: 2,
            opening_cooldown_turns: 3,
            motif_repeat_limit_per_4_turns: 2
          },
          prompt_contract: {
            must_include: ["one concrete object cue", "one body-state marker", "one practical next-step pressure"],
            must_avoid: ["direct whisper reply", "abstract metaphysics only", "reused opening noun back-to-back"]
          }
        }
      }

    ],

    /* =========================================================
       Backward-compatible seeds (optional fallback)
       ========================================================= */
    seeds: {
      old_man: {
        THOUGHTS: "The print is smaller than it used to be."
      }
    },

    /* =========================================================
       Backward-compatible monologues
       Current gpt.js rotates through monologues[characterId].THOUGHTS only.
       ========================================================= */
    monologues: {

      old_man: {
        THOUGHTS: [
`The book is heavier than it needs to be, or my hands are less willing than they were. I hold it close to the window-light and pretend it’s only the print that has changed. The coat on my shoulders remembers winters that felt permanent; it carries the shape of my body like a patient witness. I smooth the page and listen to the small scratch of paper against paper, as if that sound could confirm I am still here.

Someone once wrote in the margins—faded pencil, a careful hand. I trace the line of an old argument and feel, briefly, that I am not reading alone. The room is full of private endurance. The words arrive slowly now, but they arrive. I follow them the way you follow a path in fog: not by seeing far, but by trusting the next step.`,

`I used to read for hours without lifting my head, as if the world outside the book had agreed to wait. Now my neck complains, my eyes water, and the letters shimmer at the edges like distant figures. But the mind still recognizes the shape of a sentence, the way an idea leans forward and then withdraws. The discipline returns: patience, again and again.

There is a comfort in this public silence. No one asks anything of me. I don’t have to be quick, or witty, or useful. I only have to attend. The page gives me a task that does not measure me. Even when a name slips away—an author, a friend, a street—I can still hold a thought long enough to feel its warmth. That is not nothing.`,

`The margins are generous. The kind of generosity paper offers without meaning to. I find myself reading not only the printed lines but the small accidents: a stain that might be coffee, a faint crease where someone dog-eared a corner, the slight darkening at the lower edge where many thumbs have rested. Time leaves fingerprints.

I can feel my own body folding inward, almost without permission. The bow of the neck, the protective tilt. Still, the argument unfolds, and I am capable of following it. The room keeps its steady hum. A chair shifts; a page turns; a cough is swallowed. It is all so careful. I think: perhaps this is what remains—attention, practiced quietly, until it becomes a kind of mercy.`
        ]
      },

      young_woman: {
        THOUGHTS: [
`I sit where the light is best, as if light were a vote for my future. The window makes a private stage of the table, and I pretend I’m here only for the book. But the room keeps offering other presences: the old man’s careful hands, the student’s restless hovering, the librarian’s composed face that looks slightly elsewhere. Everyone is performing calm. Everyone is also leaking.

The sentence in front of me keeps breaking into possibilities. I underline, then regret the underline. I imagine the years ahead as a corridor that narrows, then widen it again in my mind, as if imagination could change architecture. I want to choose something without flinching. Instead I cultivate competence like a small fire and worry it will go out when no one is watching.

Sometimes, without warning, the silence amplifies me. My thoughts grow louder than my body. I look up and see only people reading, and I feel the strange tenderness of it: so much interior weather, contained inside coats and sleeves and polite posture.`,

`The page is open, but my attention keeps drifting to the glass: the faint reflection of my own face layered over shelves and light. It’s an unhelpful mirror. I don’t want to become a person who watches herself living. And yet I do, all the time—correcting my expression, rehearsing decisions, revising the past as if it were an essay.

I try to focus on the book. The words are intelligent; they are orderly. They promise that if I follow them far enough, the world will clarify. But what I feel is the opposite: the more I learn, the more I notice the places where my certainty is borrowed. I am afraid of being ordinary in the particular way I will become ordinary: not loudly, but by drift, by small accommodations, by choosing what is easiest to explain.

Still, there is the window-light on the table, the calm geometry of pages. It is a kind of shelter. I breathe and let the sentence hold me for a moment.`,

`The old man turns the pages as if the paper could bruise. I envy that tenderness toward an object, toward time. My own gestures are too quick, as if speed could protect me from doubt. I keep thinking there is a correct tempo for a life, and I am already behind it.

I read and feel a kind of longing that has no clear address. Not for a person, not for a place—more like for a version of myself who doesn’t hesitate. The room is full of people who look settled into their roles, and I don’t know whether that settles me or frightens me. The librarian’s desk looks like an anchor; the student’s scattered notes look like weather. Even the silence feels organized, like an institution.

Sometimes I want someone to notice the way I look at books—as if the books are not only information but proof that I am capable of devotion. Then I hate myself for wanting to be seen. I return to the page. I let the light do what it does: illuminate without judging.`
        ]
      },

      student: {
        THOUGHTS: [
`I hold my notes like a passport I’m afraid won’t be accepted. The shelves are too tall; the titles look confident. I look up for a book and feel my face arrange itself into seriousness, as if seriousness were the entry fee. Somewhere behind me a chair shifts and I interpret it as judgment, even though no one is looking. Silence makes me paranoid; it also makes me honest.

I keep thinking that if I finish one chapter, the next will open like a door. But it’s never a door. It’s another wall, another set of terms I’m supposed to know already. I envy the old man’s steadiness—how he reads without rushing, how he seems to have made peace with time. I envy the young woman too, though I can’t name why. Maybe it’s her ability to sit still inside herself.

I’m afraid of failing quietly. Not failing dramatically—quietly, like dust settling. I want a moment of certainty that feels earned. Instead I revise sentences in my mind, measure my worth by pages, and pretend the book can’t feel my hunger.`,

`The library makes everything look official. Even my doubts feel like they should be catalogued. I try to locate a particular volume and end up tracing spines with my finger as if touch could translate titles into confidence. My hair is uncooperative; my shirt is slightly wrinkled; I suddenly remember my accent and how it sounds in seminars. The room is full of people who have learned to appear composed, and I do not yet know the trick.

In my head I rehearse explanations for my own life: why I am here, what I’m working toward, what I will become. The explanations are tidy. The feelings underneath them are not. There is a persistent fear that I’m a forgery among originals, that someone will ask a simple question and my careful posture will collapse.

And still—there are moments when the text catches, when an argument aligns with something I’ve sensed but never named. In those moments, the room feels less like a test. It feels like a shared shelter where thinking is allowed to be slow.`,

`I find the book I want, finally, and it isn’t even the right edition. I stand there holding it, and the embarrassment is irrational but immediate, like heat. I think of my friends, of my parents, of the voice in my head that keeps score. I want to surprise myself with competence, to feel inevitability instead of effort. I want to walk to a table and open the book and know, without bargaining, that I belong here.

The librarian looks up for a second and then returns to her work. The glance is neutral, and I still read it as a verdict. That’s the problem: I keep turning neutrality into meaning. I keep making the room into a mirror that shows me my failures.

I take the wrong edition anyway. I tell myself: begin somewhere. The page will either open or it won’t. The act of opening it is already a small defiance against the part of me that wants to flee.`
        ]
      },

      librarian: {
        THOUGHTS: [
`The room regulates itself. It is a kind of breathing: pages, pauses, the small re-settling of bodies in chairs. I watch the quiet the way other people watch weather. A missing book is a disturbance; a whispered conversation is a crack; even a phone screen is a flare. I keep the rules without believing they are moral. They are simply the architecture that makes this place possible.

Today my hands move through familiar tasks—stamps, lists, small administrative completions—and my mind drifts slightly to the side, where a vague concern sits like an unopened letter. It is not dramatic. It is persistent. I think of years passing, of institutions outliving individuals, of the way care can become invisible once it works.

Sometimes I want to sit at one of the tables as an ordinary reader. Just once, without interruption, without responsibility. To open a book and let it take me somewhere that isn’t order. But then a chair shifts, a student hovers, someone looks lost, and I return to the desk. The desk is a promise: if I remain here, the room will remain itself.`,

`I notice patterns. That is my habit and my burden. The same kinds of people choose the same tables. The same times of day bring the same restlessness. Even silence has variations, and I can tell when it is fragile. I can tell when someone is about to break it, not on purpose—by accident, by grief, by a thought that becomes too heavy to carry alone.

There is an old man reading as if the book were a relic. There is a young woman by the window who turns pages too quickly and then slows, as if remembering she is visible. There is a student who hovers near shelves like a question. And a man entering who looks unsure whether he is allowed. I see them and feel, unexpectedly, a tenderness that doesn’t belong to procedure.

And then I feel the faint unhappiness again, the concern I won’t name. Perhaps it is simply the knowledge that I keep this calm, and it will not keep me. The institution is a sea wall. The water rises anyway.`,

`The desk has corners worn smooth by years of wrists. I rest my hand on it and feel time like a texture. My work is made of small preventions: preventing loss, preventing noise, preventing the slow drift into disorder. Most days I am proud of it. Today I am tired of it. Not tired in the body—tired in the attention. The attention wants to go elsewhere.

I imagine choosing a book at random, letting the spine decide. I imagine sitting near the high windows and reading without watching the door. But I know myself: even as a reader I would still count footsteps, still measure the room’s quiet like a pulse. Silence is a kind of responsibility once you’ve held it long enough.

Someone will ask me a question in a moment. I can feel it approaching. I straighten papers; I align a stack. The room continues to hum. I continue to guard it. Somewhere in that continuation, I hope there is something like meaning.`
        ]
      },

      man_in_hat: {
        THOUGHTS: [
`I come in to warm up. That is what I tell myself. Then I stay. The reading room has a peculiar permission: to stand still, to be unproductive without being accused. I hold my hat and briefcase like props from another life. For a moment I don’t know where to put my hands. I watch other people reading as if they are hiding, or waiting, or praying. I can’t decide which one I am.

The old man’s hands are careful with the book, as if the object were the last stable thing in the world. The librarian’s desk looks like a boundary line. The young woman at the window seems to be negotiating with herself. The student hovers with that particular hunger of the young: the hunger to be certain. I feel my own life as a draft, unfinished, full of crossed-out intentions.

I think about the locker where I will put my coat. The small ritual of leaving things behind. It occurs to me that I don’t know what I’m leaving behind anymore. The quiet is dangerous in that way. It makes room for thoughts I normally outrun.`,

`There is a kind of shame that doesn’t attach to a single act. It attaches to a pattern. I carry it like I carry the briefcase: not always heavy, but always present. I stand at the threshold of the room and feel the strange hope of anonymity. No one here knows me. That should be relief. Instead it feels like exposure. As if, without recognition, there is nothing to hold my shape.

I watch people reading and think: their minds are elsewhere, and their bodies remain politely here. I envy that separation. My mind and body keep colliding. I keep rehearsing conversations I won’t have, apologies that don’t land, decisions I postpone because postponement feels like control.

The light in the room is pale and steady. It falls on tables as if it has been instructed to do so. I want an instruction like that for myself. Not a grand purpose. Just a direction I can follow without bargaining. A small yes that doesn’t dissolve into habit.`,

`I put the hat in my hands and imagine putting my restlessness away with it. The thought is almost funny. Restlessness is not an object. It is a weather system. It follows you inside. The library is not a cure. It is a mirror with a soft frame.

Still, there is something here: a calm that does not demand confession. The silence accepts me without asking why I’ve come. That acceptance unsettles me. I realize how often I seek friction just to confirm I exist. Here, the lack of friction makes my thoughts louder. I hear myself more clearly than I want to.

I look toward the high windows. I think about the city outside—its noise, its errands, its speed. The reading room feels like a pause in the film of the day. I stand in that pause and feel, briefly, the possibility of being less unfinished. Not finished—just less scattered. As if the mind could settle like dust into a pattern.`
        ]
      }

    }

  }

};

/*
  NEW SCENE TEMPLATE (copy/paste)

  1) Add to SCENE_ORDER:
     { id: "your_scene_id", label: "Your Scene Label" }

  2) Add this object inside window.SCENES:

  your_scene_id: {
    meta: {
      label: "Your Scene Label",
      title: "Your Scene Title",
      cols: 6,
      rows: 4,
      baseline:
`One short baseline paragraph.
Set tone, place, and atmosphere.`
    },
    prompts: {
      system:
`You write interior monologues for this scene.
No meta talk. No direct reply to whispers.
Keep explicit first-person references sparse (target <=20%).
Use 20-40 words; sentence fragments are allowed.`,
      scene:
`Setting details and ambient cues for this world.`,
      whisperRule:
`Treat whispers as atmospheric pressure, not dialogue.`,
      structureHint:
`Begin concrete, drift inward, end unresolved.`
    },
    motifs: [
      "motif one",
      "motif two",
      "motif three"
    ],
    characters: [
      {
        id: "character_a",
        label: "Character A",
        icon: "•",
        image: "images/character_a.png",
        position: { x: 1, y: 1 },
        sensitivity: "medium",
        adjacentTo: ["character_b"],
        dossier:
`A concise character dossier with embodied concerns.`,
        voice: ["plainspoken", "grounded"],
        psyche0: { arousal: 0.45, valence: 0.55, agency: 0.50, permeability: 0.40, coherence: 0.55 },
        motifSeeds: ["motif one", "motif two"]
      },
      {
        id: "character_b",
        label: "Character B",
        icon: "•",
        image: "images/character_b.png",
        position: { x: 3, y: 1 },
        sensitivity: "medium",
        adjacentTo: ["character_a"],
        dossier:
`A second dossier with different concerns and attention style.`,
        voice: ["measured", "concrete"],
        psyche0: { arousal: 0.40, valence: 0.60, agency: 0.55, permeability: 0.35, coherence: 0.60 },
        motifSeeds: ["motif two", "motif three"]
      }
    ],
    seeds: {
      character_a: { THOUGHTS: "Short local fallback seed." }
    },
    monologues: {
      character_a: {
        THOUGHTS: [
`Fallback monologue A1.`,
`Fallback monologue A2.`
        ]
      },
      character_b: {
        THOUGHTS: [
`Fallback monologue B1.`,
`Fallback monologue B2.`
        ]
      }
    }
  }
*/
