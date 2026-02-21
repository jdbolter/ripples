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
  { id: "library_reading_room", label: "Reading Room — Afternoon" },
  { id: "posthuman_forest", label: "Forest — After Humans" }
];

window.SCENES = {

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
       These are NOT yet used by gpt.js, but are ready for API prompts.
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
- Present tense, first person singular.
- Reflective, vague, allusive; concrete sensory detail + drifting association.
- Minimal plot, no sudden scene changes, no melodrama.
- Subtle rhythmic line breaks are allowed; avoid heavy poetry formatting.
- 120–200 words.

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
        motifSeeds: ["coat fabric", "margins", "names half-remembered", "pale light"]
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
        motifSeeds: ["high windows", "pale light", "corridors", "future narrowing"]
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
        motifSeeds: ["notes", "measurement", "forgery among originals", "quiet rules"]
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
        motifSeeds: ["silence as architecture", "systems", "missing volume", "dust"]
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
        motifSeeds: ["thresholds", "coat and hat", "permission", "unfinished life"]
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

  },

  posthuman_forest: {

    meta: {
      label: "Forest — After Humans",
      title: "Nonhuman Interiorities",
      cols: 6,
      rows: 4,
      baseline:
`A forest persists without an audience.
Light moves through leaves as if remembering a language.
Moisture, wind, minute vibrations.
Nothing here is a person, yet everything is attention.`
    },

    /* =========================================================
       Prompt materials (authorable)
       Ready for API prompts.
       ========================================================= */
    prompts: {

      system:
`You write brief interior monologues for nonhuman beings in a post-human forest.
You never explain the system, never mention "prompts" or "models," and you never adopt a chatty assistant tone.

Core constraint: the monologue is not a reply to the user. The user’s presence (a "whisper") only bends attention indirectly.
Avoid direct second-person address ("you said...") and avoid question/answer dialogue.

Style:
- English.
- Present tense, first person singular.
- Allusive, impressionistic, ecological; concrete sensory detail + drifting association.
- Do not anthropomorphize in a cartoonish way: no human jobs, phones, money, or modern city life.
- Keep cognition species-appropriate but not literal: translate perception (light, scent, vibration, pressure, hunger, seasons) into reflective language.
- Minimal plot, no melodrama.
- 75–100 words.

Output: plain text only.`,

      scene:
`Setting: a temperate forest long after humans.
Ambient: canopy light, damp soil, spores, bark texture, minute air currents, bird-call echoes, insect wing-beat, the slow bookkeeping of seasons.
This is not a pastoral postcard; it is a living mesh of signals.
The atmosphere encourages attention without speech.`,

      whisperRule:
`If a whisper is present, treat it as an atmospheric pressure, not a conversational turn.
The monologue must not quote it or answer it.
Instead, let it alter mood, attention, or imagery: a phrase becomes a tilt in light, a shift in scent, a tremor in the air.
No direct address to the whisperer.`,

      structureHint:
`Begin with sensation, drift into pattern or memory (seasonal, bodily, territorial), end with a soft unresolved turn.`
    },

    motifs: [
      "canopy light",
      "sap and resin",
      "wet earth",
      "fungal threads",
      "wind as message",
      "edges of territory",
      "temperature gradients",
      "wing-beat",
      "the long season",
      "what persists"
    ],

    characters: [

      {
        id: "oak",
        label: "Oak (Old Growth)",
        icon: "🌳",
        image: "images/oak.png",
        position: { x: 2, y: 1 },
        sensitivity: "medium",
        adjacentTo: ["fern", "robin", "dragonfly"],

        dossier:
`An old oak, steady and massive. Attention is slow, distributed: bark, leaf, root.
It keeps time in rings, drought scars, the weight of wind.
It does not "think" quickly; it registers patterns, pressure, and the mutual bargaining of the forest mesh.`,
        voice: ["slow", "layered", "gravity of seasons"],
        psyche0: { arousal: 0.25, valence: 0.68, agency: 0.67, permeability: 0.35, coherence: 0.62 },
        motifSeeds: ["sap and resin", "canopy light", "the long season", "wet earth"]
      },

      {
        id: "fern",
        label: "Fern (Understory)",
        icon: "🌿",
        image: "images/fern.png",
        position: { x: 1, y: 2 },
        sensitivity: "high",
        adjacentTo: ["oak", "raccoon"],

        dossier:
`A fern in the understory. It lives by gradients: shade, damp, the brief generosity of light.
Its attention is close-range and immediate, yet ancient in form.
It experiences the world as touch, moisture, and the careful unfolding of fronds.`,
        voice: ["close", "delicate", "micro-weather"],
        psyche0: { arousal: 0.35, valence: 0.59, agency: 0.60, permeability: 0.55, coherence: 0.53 },
        motifSeeds: ["wet earth", "fungal threads", "temperature gradients", "canopy light"]
      },

      {
        id: "raccoon",
        label: "Raccoon (Night Forager)",
        icon: "🦝",
        image: "images/raccoon.png",
        position: { x: 4, y: 2 },
        sensitivity: "medium",
        adjacentTo: ["fern", "robin"],

        dossier:
`A raccoon moving at the boundary between cover and clearing.
It is clever in hands and mouth: textures, latches, hidden edible things.
Curiosity is not a personality trait but a survival instrument. Memory is a map of scent and risk.`,
        voice: ["quick", "tactile", "wry but not human"],
        psyche0: { arousal: 0.45, valence: 0.53, agency: 0.55, permeability: 0.40, coherence: 0.52 },
        motifSeeds: ["edges of territory", "wet earth", "wind as message", "what persists"]
      },

      {
        id: "robin",
        label: "Robin (Song & Patrol)",
        icon: "🐦",
        image: "images/robin.png",
        position: { x: 3, y: 0 },
        sensitivity: "high",
        adjacentTo: ["oak", "raccoon", "dragonfly"],

        dossier:
`A robin in daylight patrol. Attention is sharp, selective: movement, glint, worm-shift in soil.
Song is not decoration; it is boundary, announcement, calibration.
It carries a small urgent life in the chest, always measuring distance and safety.`,
        voice: ["bright", "alert", "compressed intensity"],
        psyche0: { arousal: 0.50, valence: 0.58, agency: 0.61, permeability: 0.30, coherence: 0.65 },
        motifSeeds: ["wing-beat", "edges of territory", "canopy light", "wind as message"]
      },

      {
        id: "dragonfly",
        label: "Dragonfly (Hovering)",
        icon: "🪲",
        image: "images/dragonfly.png",
        position: { x: 5, y: 1 },
        sensitivity: "medium",
        adjacentTo: ["oak", "robin"],

        dossier:
`A dragonfly above a patch of sun and shadow.
Perception is motion: angles, velocities, air pressure, shimmer.
It lives in brief decisions and precise corrections, as if thought is steering.
Its memory is light stitched to trajectory.`,
        voice: ["fast", "glinting", "kinetic"],
        psyche0: { arousal: 0.40, valence: 0.58, agency: 0.63, permeability: 0.40, coherence: 0.56 },
        motifSeeds: ["wing-beat", "temperature gradients", "canopy light", "what persists"]
      }

    ],

    seeds: {
      oak: { THOUGHTS: "The wind keeps rewriting my leaves." }
    },

    monologues: {

      oak: {
        THOUGHTS: [
`The wind presses into my leaves and I answer without choosing to. Light arrives in pieces, counted and spent across the day. I feel the soil’s dampness as a slow permission, the root-web’s faint traffic of exchange. There is no center to me, only a distributed listening: bark to air, leaf to heat, cambium to memory. Somewhere inside the wood, old drought still holds its shape. I do not mourn the vanished voices; absence is just another weather. Still, the forest keeps making sentences out of pressure and time.`,

`In the morning the canopy shifts and the understory brightens briefly, like a thought that almost becomes speech. I keep the long record: seasons, insect-work, the faint insistence of fungus at the edge of rot. Birds rehearse borders above me. Small bodies pass and leave no explanation, only a change in scent, a tremor in the ground. I do not move, yet everything moves through me—water, sugar, the bookkeeping of survival. The world persists by turning attention into structure.`,

`My leaves flash pale on their undersides and the air reads it as signal. I cannot hurry; I can only endure and adjust. The day warms, then cools, and each change is a message written across the skin of bark. Somewhere below, roots negotiate with stone and thread. Above, a wing-beat interrupts the quiet like a brief punctuation. I hold the forest’s weight without owning it. Time keeps arriving, and I keep making room for it.`
        ]
      },

      fern: {
        THOUGHTS: [
`Shade is my first language. I read the world as dampness, as the small generosity of light that leaks through. The air is never still; it carries thin messages—coolness, spores, the soft disturbance of something passing close. I unfurl slowly, repeating an ancient gesture, not because I remember it but because my body knows the shape of persistence. Above me, trunks lift their long bodies into brightness. Below, the soil holds secrets in threads. I do not go anywhere. I become, inch by inch, a careful surface for the forest to touch.`,

`A drip falls and the ground answers with a darker scent. I feel it immediately, a minor change that becomes my whole weather. There are days when light reaches me like a rumor, and I angle myself toward it without thinking. I exist in the narrow band between too dry and too wet, between exposure and suffocation. Yet in that narrowness there is a kind of clarity: the world is gradients and thresholds, and I am made for them. I listen with fronds. I hold stillness like a method.`,

`The understory is a room without walls. Everything is close: soil, breath, the soft scrape of a small claw on bark. When air warms, I feel it as a loosening; when it cools, as a tightening. I do not have words for fear, but I have responses: curl, flatten, wait. Somewhere a bird calls and the sound travels through leaf and stem as vibration. The forest speaks in pressures. I answer by remaining open just enough.`
        ]
      },

      raccoon: {
        THOUGHTS: [
`My paws know the world better than my eyes. Bark is rough, stone is cold, wet leaves are a kind of map. I move where cover meets open, where risk can be measured and food can be found. Memory is not a story; it is a route: this log holds grubs, that hollow smells wrong, this stream edge offers quick water and quicker danger. I test, I listen, I take. The forest does not judge. It only changes, and I adjust with it. Tonight the air tastes different, as if the wind carried news from beyond my usual circle.`,

`I pause and lift my head. Something shifts—tiny, almost nothing—yet it rearranges the night in me. A scent that isn’t prey, a sound that isn’t threat, a hint of sweetness where sweetness shouldn’t be. I am built for curiosity, but curiosity is expensive. I touch the world and the world touches back. Under my ribs, hunger keeps time. I move again, quiet as possible, collecting small certainties: water, warmth, a hidden pocket of food. Everything else is speculation.`,

`There is a place where the ground is softer, where worms turn the soil and beetles leave their dark trails. I return there without deciding; my body carries the habit. I am not alone—birds watch, trees stand, insects stitch light into motion. I do not think of them as others. They are conditions. I am a condition too. When I slip between ferns, the fronds tremble and then settle, as if erasing me. I like that. It means I can pass through the world without leaving a question behind.`
        ]
      },

      robin: {
        THOUGHTS: [
`I hold the morning like a boundary line. My song is not decoration; it is measurement—this far, not farther; this branch, not yours. I watch the ground for a small betrayal of movement, the faint lift of soil where something soft lives. Light makes everything legible and also makes me visible, so I keep my attention sharp. The air is full of signals: wing-beat, leaf-flutter, the sudden stillness that means a predator is near. I do not call it fear; I call it calibration. Still, there are moments when the forest feels too quiet, as if listening back.`,

`A worm’s shape under the soil is a brief promise. I tilt my head and the world tilts with it, rearranged by angle and focus. The canopy above is a bright ceiling that shifts constantly, and I read its changes the way others might read a face. I patrol and announce and return, again and again, to the same perches. Repetition is not boredom; it is survival. Yet sometimes I feel a strange excess—an extra beat in the chest, a surplus of attention—and I sing more softly, as if not to wake it.`,

`I hop, I pause, I listen. The forest is a score written in interruptions. A glint of insect wing; a hush; the thick sound of something heavy moving far away. I respond with small choices: step here, not there; fly up, not yet. My world is quick, but it is not shallow. It is made of edges. I keep them. I test them. And when the light changes, I feel it as a new instruction I must obey without understanding why.`
        ]
      },

      dragonfly: {
        THOUGHTS: [
`I hover where sun and shadow trade places. The air is a texture: warm ribbon, cool pocket, sudden drop. I correct myself constantly—tiny shifts that feel like thought. My eyes take in the world as angles and speeds, as glints that mean edible and glints that mean danger. I do not linger on meaning; I steer. The forest below is slow, but above it everything is quick: wing-beat, wind-slice, the brief geometry of a chase. Still, there is a moment when I stop and the world seems to hold its breath with me.`,

`Light is my map. It stitches itself across leaves, breaks into fragments, reforms. I follow the moving seam, not because I choose it but because my body answers it. A pulse of air tells me something passes nearby; a vibration tells me where to turn. I am made of decisions that last less than a second. Yet even in that speed there is a kind of drift, a feeling that I am being carried by patterns older than my life. I arc, I hover, I vanish into glare.`,

`The day warms and the insects rise like dust that decided to fly. I cut through them with clean intent. Then a shadow crosses and the air changes—cooler, heavier—and I am suddenly cautious. I do not have a story about it. I have a body that adjusts. The forest is full of invisible borders: temperature, scent, threat. I skim them, testing, correcting. When I pause, suspended, the world below looks like a slow thought. When I move again, it becomes pure motion.`
        ]
      }

    }

  }

};
