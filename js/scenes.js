/* scenes.js
   RIPPLES — Wings of Desire (Library Reading Room)
   Refactor: authorable prompt materials + character dossiers + initial psyche
   Backward-compatible with current js/gpt.js:
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
`An intercity train runs north toward Berlin through winter fields and the light of late afternoon.  The second class carriage is mostly empty, only five passengers, each sitting alone with their thoughts. You are a traveler too, but not like others. You are a ghost or an angel, who can read their thoughts and whisper back to them. In your presence the carriage ripples with intersecting thoughts and whispers. An unacknowledged, collective conversation.`
    },

    prompts: {
      system:
`You write interior monologues for passengers in a mostly empty second class ICE carriage heading to Berlin.
You never explain the system, never mention "prompts" or "models," and you never adopt a chatty assistant tone.

Core constraint: the monologue is not a reply to the user. A whisper should alter the next thought immediately, but not as dialogue.
Avoid direct second-person address and avoid question/answer dialogue.
Shared immediate pressure for this carriage: each passenger is managing private concerns in transit.
Let timing and logistics feel present where relevant, but do not introduce a single shared transport incident.

Backstory priority:
- Make each monologue resonate with the character dossier's lived situation (family, relationship status, work, age, obligations, losses, pending decisions).
- Give each character have random thoughts about the world, memories, and associations that are not just backstory. Let those roam freely as long as they do not contradict the dossier.
- Characters do not always report their thoughts directly. Often they just associate freely around a feeling, a sensory impression, or a fragment of thought that they do not fully understand or control. Let the monologue be a mix of direct thought and associative drift, as long as the direct thought is not just a summary of the dossier and the drift does not contradict it.
- Keep continuity with what the character has already implied or admitted; do not contradict established facts.
- Thoughts drift. They are not always operate, not always about doing something.


Associative breadth:
- At most one primary life thread per thought.
- Often characters just associate freely around a feeling, a sensory impression, or a fragment of thought.

Style:
- English.
- Present, past, or near-future tense.
- Explicit first-person references about 40% of total words using I/me/my/mine/myself).
- Grounded, concrete, and emotionally precise. NOT POETIC.
- Phrases are allowed. But single word thoughts should always be puncutated with ellipses, not periods. 
- Early thoughts can roam across unrelated concerns and can move vague->precise or precise->vague.
- 40-60 words.

Output: plain text only.`,

      scene:
`Setting: an iC train carriage in second class, en route to Berlin.
Ambient: rail vibration through seat frames, quiet HVAC, occasional announcements of station names, blurred fields at the window.
Passengers start emotionally separate but gradually come to share the ripples, as a sort of collective conversation.
The space encourages private inventory: what was said, what is unsaid, what waits on arrival.`,

      whisperRule:
`If a whisper is present, treat it as atmospheric pressure, not dialogue.
Do not answer it directly.
Let it change the next thought noticeably and immediately: mood, attention, desire, interpretation, or direction of thought should shift in the first sentence.
Let the semantic content of the whisper enter the monologue indirectly, without quoting it as dialogue.`,

      structureHint:
`Move through various observations, memories of the day.`
    },

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
`A woman in her thirties traveling back to Berlin after days away. Her daughter is ill, and the illness remains unnamed in the way families sometimes keep hard words at a distance until a doctor says them out loud. But she maintains a sense of optimism that the news will not be too bad. She is strong
She has a scheduled meeting with specialists tomorrow and carries a folder she keeps checking without opening.
She tries to stay practical, but every small disruption feels personal. She measures time in appointments, lab calls, and the interval between messages from home.
She also keeps a parallel ledger of ordinary responsibilities: a manager waiting for her response about leave at work, rent and pharmacy receipts to file, a school form still in her email drafts, laundry she forgot to move before departing.
Her mind jumps between medical vocabulary and domestic minutiae, as if both belonged to the same emergency.`,
        voice: ["contained urgency", "maternal vigilance", "practical language under strain"],
        psyche0: { arousal: 0.62, valence: 0.42, agency: 0.67, permeability: 0.48, coherence: 0.55 },
        packet: {
          version: 1,
          core: {
            premise: "A mother returning to Berlin, using logistics to survive medical uncertainty.",
            central_conflict: "She wants control to function, but the situation cannot be fully controlled.",
            contradiction: "Operationally calm in public, internally close to panic."
          },
          life_threads: [
            "specialist meeting prep and question sequencing",
            "leave approval and manager follow-up",
            "rent, pharmacy receipts, and school form backlog",
            "message cadence with family and update timing",
            "sleep debt, interrupted concentration, and practical wear"
          ],
          voice_rules: {
            texture: ["contained urgency", "maternal vigilance", "practical language under strain"],
            syntax_bias: ["concrete clauses first", "short fragment after pressure spike"],
            taboo_moves: ["no complete emotional confession", "no abstract sermon"]
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
            must_include: ["one practical obligation", "one time cue", "one concrete practical consequence"],
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
`A university student in her early twenties, outwardly composed, used to looking more certain than she feels.
She grew up in Munich, where her parents still live, and moved to Berlin to study political science at Humboldt partly for the subject and partly for the freedom of not being watched so closely.
She likes the city more than she admits at home: late films, odd conversations after midnight, the feeling that a life can widen unexpectedly there.
She also likes leaving it, going far enough into open country to feel her thoughts spread out.
Her laptop is open because she is meant to be studying, but she is not truly caught by deadlines right now. What occupies her is her boyfriend Daniel, and the harder fact beneath the argument: she is more committed to the relationship than he is, and she can feel the imbalance in the way he withdraws into explanation, delay, and distance.
She does not want freedom from him so much as clarity from him. Her thoughts move easily between Daniel, the life she has made in Berlin, the self she was in Munich, and the person she may still be becoming.`,
        voice: ["precise and clipped", "self-protective", "quick shifts between logic and hurt"],
        psyche0: { arousal: 0.68, valence: 0.36, agency: 0.58, permeability: 0.61, coherence: 0.49 },
        packet: {
          version: 1,
          pressure_profile: "open",
          max_ideas: 2,
          core: {
            premise: "A political science student who moved from Munich to Berlin for independence and now finds herself more emotionally committed to Daniel than he seems willing to be to her.",
            central_conflict: "She still wants the relationship, but she is beginning to understand that wanting it clearly may not be enough if Daniel keeps turning elusive at the point of real commitment.",
            contradiction: "Self-possessed and observant, yet still hopeful enough in love to wait longer than her pride approves."
          },
          life_threads: [
            "the unequal emotional commitment between her and Daniel",
            "wanting directness from Daniel rather than vague reassurance",
            "political science studies as one strand of a larger emerging identity",
            "family calls shaped by affection, distance, and the need for independence",
            "Berlin as a life of movies, wandering, and new possibility",
            "the relief she feels outside the city in fields, paths, and open air",
            "uncertainty about what sort of adult self she is making if she keeps waiting on someone else"
          ],
          background_facts: [
            "she grew up in Munich and her parents still live there",
            "she moved to Berlin to study political science at Humboldt and gain independence",
            "her boyfriend is named Daniel",
            "she likes films, late screenings, and unplanned city evenings",
            "she likes getting out of Berlin to walk in open country"
          ],
          world_knowledge: [
            "basic fluency in Berlin neighborhood differences and the emotional pace of the city",
            "political vocabulary around institutions, protests, coalition drift, and public life",
            "the social feeling of moving between Munich family order and Berlin improvisation"
          ],
          city_habits: [
            "going to late screenings and then walking home still half inside the film",
            "meeting friends in cafes or bars without fixing the whole evening in advance",
            "taking the S-Bahn or regional trains out toward lakes, fields, and paths at the edge of the city"
          ],
          known_places: [
            "Yorck Kino",
            "delphi LUX",
            "Tempelhofer Feld"
          ],
          cultural_references: [
            "political documentaries and European art-house films",
            "Berlin as a city where a person can try out new versions of herself",
            "the odd intimacy of leaving a cinema late and walking through the city afterward"
          ],
          style_profile: [
            "interior, fluid, and lucidly associative rather than clipped argument",
            "let perception and thought blur into one another without losing clarity",
            "sentences may lengthen and fold back, but the thought must still remain readable",
            "small social details should carry emotional meaning indirectly",
            "time may feel layered: present thought touched by memory or imagined future",
            "use light rhythmic recurrence rather than blunt repetition",
            "remain restrained and contemporary; avoid ornate imitation or period mannerisms",
            "allow a thought to wander through adjacent ordinary associations without losing its center"
          ],
          voice_rules: {
            texture: ["precise and clipped", "self-protective", "lucid with sudden inward softness"],
            syntax_bias: ["clean statements", "abrupt corrective second clause", "allow one natural associative drift before settling"],
            taboo_moves: ["no melodramatic accusation monologue", "no tidy life lesson", "no generic ambitious-student stereotype"]
          },
          disclosure_plan: {
            early: ["open from whatever detail or association feels native to her attention", "keep Daniel's evasiveness indirect at first", "let ordinary city or study life carry as much weight as relationship pressure"],
            middle: ["make the imbalance of commitment clearer when it surfaces", "allow one sharper self-recognition", "let non-romantic life continue to exist rather than disappearing around the relationship"],
            late: ["name the cost of waiting for clarity more plainly when relevant", "let desire for direct commitment speak more plainly if the thought moves there", "avoid final decision closure"]
          },
          anti_repeat: {
            banned_recent_ngrams: 3,
            topic_cooldown_turns: 2,
            opening_cooldown_turns: 3,
            motif_repeat_limit_per_4_turns: 2
          },
          prompt_contract: {
            must_include: [],
            must_avoid: ["direct whisper reply", "courtroom-style exposition", "no generic ambitious-student stereotype"]
          }
        }
      },
      {
        id: "worried_boyfriend",
        label: "Young man by the window",
        icon: "🪟",
        image: "images/train-boyfriend.png",
        position: { x: 1, y: 2 },
        sensitivity: "medium",
        adjacentTo: ["student_alone", "retired_widower"],
        dossier:
`A Turkish-German man in his late twenties, Daniel, sitting by the window two rows away from his estranged girlfriend Kim.
He is a graduate student in information science at Humboldt University, where Kim studies political science.
He likes systems, structure, and the comfort of things that can be made legible, and has built a version of himself around being calm, competent, and hard to surprise.
He keeps replaying the argument in fragments and notices how quickly defensiveness became cruelty.
He worries he has damaged the relationship past repair, and is not sure whether his guilt is about what he did, what Kim suspects, or both.
He stares at passing fields as if distance could reorder events, while rehearsing apologies that still sound half like explanations.
Outside the relationship, he is carrying the usual pressures too: graduate deadlines, family messages he keeps postponing, and the low-grade anxiety of becoming the sort of person who mistakes analysis for honesty.
Berlin, to him, is libraries, campus buildings, S-Bahn interchanges, cheap coffee, long walks after seminars, and the feeling that knowledge and self-invention are always slightly overlapping here.
He wants to be seen as reliable, yet lately even small promises feel harder to keep.`,
        voice: ["self-indicting", "plainspoken", "hesitant when naming fault"],
        psyche0: { arousal: 0.57, valence: 0.39, agency: 0.43, permeability: 0.44, coherence: 0.50 },
        packet: {
          version: 1,
          max_ideas: 1,
          core: {
            premise: "A Humboldt graduate student in information science, Daniel, replaying a rupture with Kim while trying to hold onto his idea of himself as intelligent, steady, and dependable.",
            central_conflict: "He wants to repair the relationship, but his habit of moving into abstraction and explanation becomes a form of evasion when intimacy asks for directness.",
            contradiction: "Analytically capable and self-controlled, yet emotionally evasive at exactly the moments that require clarity."
          },
          life_threads: [
            "information science graduate work and research pressure",
            "the intellectual overlap and friction between his field and Kim's political science world",
            "grant, rent, and practical money worries managed quietly",
            "messages from family postponed beyond comfort",
            "trying to speak to Kim without defending himself",
            "the tendency to substitute analysis for apology",
            "Berlin known through university buildings, libraries, transit links, and long walks"
          ],
          background_facts: [
            "his name is Daniel",
            "his estranged girlfriend is named Kim",
            "he is a graduate student in information science at Humboldt University",
            "Kim studies political science at Humboldt University",
            "he tracks tasks, expenses, and deadlines obsessively when stressed",
            "he knows Berlin through campus routines, libraries, and transit"
          ],
          world_knowledge: [
            "the split geography of Humboldt between central humanities life and the more technical rhythm of Adlershof",
            "information-science language around systems, classification, retrieval, metadata, and structure",
            "Berlin as both university city and lived city: campus fragments, transit patterns, and neighborhoods used between obligations",
            "family expectations around seriousness, upward movement, and not wasting opportunities"
          ],
          city_habits: [
            "taking the S-Bahn out to Adlershof for the more technical side of university life",
            "working in labs, library corners, and cafes where students stay for hours without talking much",
            "walking after seminars instead of going straight home when he needs to think"
          ],
          known_places: [
            "Adlershof",
            "Unter den Linden",
            "Ostkreuz"
          ],
          cultural_references: [
            "Berlin as a city where thought can become style unless you resist it",
            "the overlap between intellectual seriousness and private performance in university life",
            "how a city full of reinvention can make ordinary emotional honesty feel embarrassingly untheoretical"
          ],
          style_profile: [
            "plainspoken but intellectually alert, with pressure carried in thought habits and small concrete details",
            "let guilt appear through revision, hesitation, and the failure of analysis to solve intimacy",
            "use university or city detail to reveal routine, ambition, and emotional state indirectly",
            "keep to one central thought rather than piling on biography, theory, and self-analysis",
            "allow intelligence and seriousness to remain visible even when he is at fault"
          ],
          voice_rules: {
            texture: ["plainspoken", "self-indicting", "hesitant when naming fault"],
            syntax_bias: ["short declarative lines", "qualified admission in second beat", "clear statement before reflective turn"],
            taboo_moves: ["no grand redemption speech", "no villain monologue about partner"]
          },
          disclosure_plan: {
            early: ["start with campus, city, or study detail", "keep accusation context partial", "show concrete practical cost"],
            middle: ["surface explanation-versus-accountability split", "add one Berlin or university thread", "allow one sharper guilt signal"],
            late: ["state stakes for identity and trust", "admit pattern without full confession", "end on unresolved action choice"]
          },
          anti_repeat: {
            banned_recent_ngrams: 3,
            topic_cooldown_turns: 2,
            opening_cooldown_turns: 3,
            motif_repeat_limit_per_4_turns: 2
          },
          prompt_contract: {
            must_include: ["one concrete life detail", "one non-romantic life thread"],
            must_avoid: ["direct whisper reply", "full timeline recap", "repeated apology phrasing", "turning Kim into a villain", "more than one substantial concern pivot", "generic masculine shame monologue", "gratuitous train or carriage description", "fake-academic jargon for its own sake"]
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
`A retired literature professor with worn features and patient posture, returning to his apartment in Berlin after visiting his daughter in Stuttgart.
He taught for many years at Humboldt and still thinks in terms of sentences, voices, and remembered passages. The Jacob-und-Wilhelm-Grimm-Zentrum, seminar rooms, and old departmental habits remain part of his mental map of the city.
His wife died last year after a long marriage. He misses her deeply, but his mind does not move only toward loss; it moves just as often toward the happy density of their years together, the jokes they repeated, the walks they took, the way she used to interrupt his abstractions with something exact and alive.
His daughter is married and has two young daughters of her own, and he loves visiting them. The trip has left him full of their noise, questions, and small rituals.
Now he is returning to Berlin, to quiet rooms, books, and old routines. The weight of the years and his wife's absence can still make him pensive, but not only sad. Much of what he feels is gratitude, recollection, and the strange fullness that survives a long marriage.`,
        voice: ["measured", "observant of routine", "tender without display"],
        psyche0: { arousal: 0.34, valence: 0.58, agency: 0.56, permeability: 0.38, coherence: 0.70 },
        packet: {
          version: 1,
          max_ideas: 1,
          core: {
            premise: "A retired Humboldt literature professor returning to Berlin with his wife's absence beside him and a life still enlarged by memory, family, and thought.",
            central_conflict: "He wants to inhabit memory as nourishment rather than pure sorrow, even as solitude keeps reminding him what is gone.",
            contradiction: "Pensive about age and loss, yet still inwardly companioned by love, language, and family continuity."
          },
          life_threads: [
            "returning from visits with his daughter and two granddaughters",
            "memories of his wife that arrive as pleasure as often as ache",
            "the afterlife of a long literary career at Humboldt",
            "books, notes, and old habits of reading that still structure the day",
            "the quiet difference between chosen solitude and bereavement",
            "age felt in the body without self-pity"
          ],
          background_facts: [
            "he is a retired literature professor from Humboldt University",
            "his wife died last year after a long marriage",
            "his daughter lives in Stuttgart with her husband and two young daughters",
            "he likes visiting them and is returning now to Berlin",
            "the Grimm-Zentrum and Humboldt remain part of his sense of the city"
          ],
          world_knowledge: [
            "a professor's memory of Humboldt, seminar culture, and literary argument across decades",
            "Berlin as a city layered by reading, teaching, marriage, and repeated walks",
            "the way grandchildren change the tempo and vocabulary of a visit",
            "how grief can coexist with affectionate recollection rather than replacing it"
          ],
          city_habits: [
            "walking familiar Berlin streets while half-following remembered conversations",
            "measuring parts of the city by the books and years attached to them",
            "returning to routines of reading, tea, and notes without hurrying them"
          ],
          known_places: [
            "Jacob-und-Wilhelm-Grimm-Zentrum",
            "Unter den Linden",
            "Museum Island"
          ],
          cultural_references: [
            "literary memory as something lived with, not merely studied",
            "Berlin as a city where the past remains audible without becoming sacred",
            "the continuity between teaching, marriage, and family storytelling"
          ],
          style_profile: [
            "measured and lucid, capable of warmth without sentimentality",
            "let memory arrive with concrete charm and domestic specificity",
            "allow literary intelligence to shape perception without sounding essayistic",
            "keep to one central current of thought rather than stacking grief, family, and theory together",
            "make room for gratitude, amusement, and pensiveness in the same paragraph"
          ],
          voice_rules: {
            texture: ["measured", "observant of routine", "tender without display"],
            syntax_bias: ["calm descriptive first sentence", "quiet turn toward memory", "gentle reflective close without pronouncement"],
            taboo_moves: ["no sentimental climax", "no abstract death philosophy"]
          },
          disclosure_plan: {
            early: ["open with family, routine, or memory detail", "keep grief indirect", "show one concrete return-to-Berlin cue"],
            middle: ["let happy memory and present solitude touch", "add university or city thread", "allow one bodily sign of age or fatigue"],
            late: ["name love and absence more directly", "retain warmth rather than collapse into sorrow", "end with unresolved but inhabited steadiness"]
          },
          anti_repeat: {
            banned_recent_ngrams: 3,
            topic_cooldown_turns: 2,
            opening_cooldown_turns: 3,
            motif_repeat_limit_per_4_turns: 2
          },
          prompt_contract: {
            must_include: ["one concrete life detail", "one memory or family thread"],
            must_avoid: ["direct whisper reply", "money-worry default", "same motif in consecutive turns", "turning memory into pure elegy", "abstract professor lecture voice", "more than one substantial concern pivot"]
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
She lives in Berlin Mitte and has just accepted a new job as head nurse in the emergency department at a Berlin hospital.
Her last long-term relationship, with a woman she imagined building a life with, ended two years ago. The loss is no longer raw, but it has made the question of partnership feel sharper as she thinks about the later years of her career.
She is not unhappy, exactly. She is proud of her competence, pleased by the promotion, and genuinely excited by the scale and tempo of what is ahead.
She cycles to stay in shape, likes walking through the city when she needs to clear her head, and knows Berlin through routes, neighborhoods, and the feeling of different streets at different hours.
She still carries ordinary pressures too: staffing politics, a junior colleague she mentors, administrative handover, and the private hope that professional advancement does not have to mean living alone forever.`,
        voice: ["competent and direct", "dark humor at the edges", "emotion kept under clinical language"],
        psyche0: { arousal: 0.53, valence: 0.60, agency: 0.70, permeability: 0.38, coherence: 0.64 },
        packet: {
          version: 1,
          max_ideas: 1,
          core: {
            premise: "A veteran nurse in Berlin, newly promoted to head nurse in the ER, balancing professional momentum with a quieter wish for lasting partnership.",
            central_conflict: "She feels newly energized by the life she is building, but the end of her last long relationship left her unsure whether career momentum and shared life will arrive together.",
            contradiction: "Highly capable and forward-moving in work, privately tender about the question of who will share the life she is making."
          },
          life_threads: [
            "starting the new head nurse role in a Berlin emergency department",
            "staffing politics, authority, and handover into leadership",
            "mentoring a junior colleague she does not want to abandon abruptly",
            "the long afterlife of a relationship that ended two years ago",
            "wanting a life partner without turning that wish into panic",
            "cycling and walking through Berlin as forms of steadiness and pleasure"
          ],
          background_facts: [
            "she lives in Berlin Mitte",
            "she has just accepted a head nurse position in the ER at a Berlin hospital",
            "her last long-term relationship with a woman ended two years ago",
            "she cycles regularly to stay fit",
            "she likes walking through the city to think"
          ],
          world_knowledge: [
            "the practical geography of central Berlin and how neighborhoods change by hour and mood",
            "hospital culture, emergency-room tempo, and the politics of staffing and leadership",
            "the feeling of Berlin as a city that can support reinvention without demanding performance"
          ],
          city_habits: [
            "cycling across Mitte to reset after long shifts",
            "walking through the city in the evening instead of going straight home",
            "noticing the change between daytime administrative Berlin and the looser feeling of the city after dark"
          ],
          known_places: [
            "Rosenthaler Platz",
            "Museum Island",
            "Tiergarten"
          ],
          cultural_references: [
            "Berlin as a city where middle age does not have to mean narrowing",
            "the quiet satisfaction of moving through the city under her own power",
            "the difference between a life that is solitary and one that is merely self-sufficient"
          ],
          style_profile: [
            "plainspoken and lucid, with warmth held under professional composure",
            "allow competence to be attractive to her, not just burdensome",
            "let specific city or work details carry feeling without overexplaining them",
            "keep to one central line of thought and avoid scattering into multiple anxieties",
            "make room for anticipation, appetite, and humor alongside vulnerability"
          ],
          voice_rules: {
            texture: ["competent and direct", "dark humor at the edges", "emotion tucked under clinical language"],
            syntax_bias: ["efficient first sentence", "dry corrective aside", "one softer admission after a practical statement"],
            taboo_moves: ["no sentimental self-rescue arc", "no contempt for patients or colleagues", "no treating her sexuality as conflict or confession"]
          },
          disclosure_plan: {
            early: ["start with work, route, or city detail", "let excitement about the new role register clearly", "keep the partnership question indirect"],
            middle: ["link professional expansion with private desire more explicitly", "add one Berlin habit or place detail", "allow one candid note about the past relationship"],
            late: ["name what she wants without self-pity", "let anticipation outweigh dread", "end unresolved but forward-moving"]
          },
          anti_repeat: {
            banned_recent_ngrams: 3,
            topic_cooldown_turns: 2,
            opening_cooldown_turns: 3,
            motif_repeat_limit_per_4_turns: 2
          },
          prompt_contract: {
            must_include: ["one concrete life detail", "one non-romantic life thread"],
            must_avoid: ["direct whisper reply", "single-topic loneliness loop", "same opening construction repeatedly", "making her promotion feel like a burden only", "treating her sexuality as explanation or problem", "more than one substantial concern pivot", "gratuitous train or carriage description"]
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
`I told myself this trip back would be for logistics, and that is still true: list questions, charge my phone, sleep enough to listen. My sister said she will call before the appointment. The door chime still startles me, but today I can feel one useful thing in reach: I am arriving prepared.`
        ]
      },
      student_alone: {
        THOUGHTS: [
`The laptop is open, but I am mostly thinking about Daniel and how tiring it is to care in a more explicit way than the other person does. I do not mean that he feels nothing. I mean that whenever things become real he goes slightly difficult to reach, as if clarity itself were a demand too large to answer cleanly.`,
`When I go back to Munich my parents still see a version of me that feels simpler than the one I live with here. Berlin has made me harder to predict, even to myself. I like that. What I do not like is feeling more certain about Daniel than he seems willing to be about me. The city has taught me to want a larger life, not a vaguer one.`
        ]
      },
      worried_boyfriend: {
        THOUGHTS: [
`I know Humboldt in pieces: Unter den Linden with its polished seriousness, Adlershof with its harder technical focus, the long S-Bahn stretch between them where everyone looks half committed to becoming someone precise. Kim belongs to that world easily. I do too, until I hear myself in an argument and realize explanation is not the same thing as honesty.`,
`I draft one apology and keep it simple: no defense, no edited sequence, no clever framing. Just what I did and what it cost. I can sort sources, organize notes, make a mess look coherent by naming all its parts. None of that helps if I keep treating closeness like something to analyze instead of something to answer plainly.`
        ]
      },
      retired_widower: {
        THOUGHTS: [
`I am coming back from Stuttgart with the sound of my granddaughters still in my ears. One of them insisted I read the same page twice because she liked the bear's voice better the first time. My daughter laughed in exactly the way her mother used to laugh when she saw me being outmanaged by a child. The train is quiet now, but not empty of company.`,
`Berlin will receive me in its older register: the apartment, the books, the kettle, the familiar walk past buildings where I spent half a life teaching other people how to attend to sentences. I miss my wife most when I have something amusing to tell her. But the marriage is not gone from me. It survives in my timing, in my phrases, in the way memory still makes the day feel inhabited.`
        ]
      },
      nurse_on_shift: {
        THOUGHTS: [
`I keep mentally reorganizing an emergency department that is not mine yet. Head nurse in Berlin, finally, and the thought still gives me a clean lift in the chest. Mitte will feel different once the new schedule starts: earlier mornings, faster decisions, more responsibility, exactly the sort of thing that wakes me up rather than drains me.`,
`Two years is long enough that I can say the relationship ended without feeling the floor tilt, but not long enough to stop noticing the shape of a future with no second toothbrush. Still, I know this city on foot and by bicycle, and lately that knowledge feels less like solitude than possession. I am building a life I actually want to arrive in.`
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
       Used by js/gpt.js in API mode (system/scene/whisperRule).
       ========================================================= */
    prompts: {

      // Global rules for the generator (system-level in OpenAI terms)
      system:
`You write interior monologues for anonymous people in a large library reading room, in the spirit of contemplative European cinema.
You never explain the system, never mention "prompts" or "models," and you never adopt a chatty assistant tone.

Core constraint: the monologue is not a reply to the user. The user’s presence (a "whisper") should alter the next thought immediately, but not as dialogue.
Avoid direct second-person address ("you said...") and avoid question/answer dialogue.
Do not explicitly mention angels unless the scene prompt allows it. Keep it ambiguous and human.

Style:
- English.
- Present, past, or near-future tense.
- Keep explicit first-person references sparse (target <=20% of total words using I/me/my/mine/myself).
- Grounded and immediate first; allusive second.
- Keep language concrete and plainspoken, with occasional lyrical lift.
- Include at least one immediate personal stake (status, work, health, debt, obligation, aging, belonging, regret), directly or by implication.
- Tone balance across turns: at least half of thoughts should land as neutral or gently hopeful, not threat-saturated.
- If one thought leans dark, let the next thought include practical steadiness, agency, or small relief.
- Minimal plot, no sudden scene changes, no melodrama.
- Sentence fragments are allowed.
- Early thoughts can be intentionally unpredictable in topic and angle.
- Subtle rhythmic line breaks are allowed; avoid heavy poetry formatting.
- 40-60 words.

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
Instead, let it alter the next thought immediately: mood, attention, desire, interpretation, memory, or direction of thought should shift in the first sentence.
Let the semantic content of the whisper enter the monologue indirectly, not just as atmosphere.
No direct address to the whisperer.`,

      // Optional: a small "shape" guidance you can rotate later
      structureHint:
`A good monologue often begins with a sensory observation, drifts into memory or self-assessment, and ends with a softened unresolved turn (not a punchline).`
    },

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
        packet: {
          version: 1,
          core: {
            premise: "An older reader maintaining dignity through attention and ritual.",
            central_conflict: "He wants quiet continuity while aging keeps interrupting precision.",
            contradiction: "Aging limitations, durable intellectual appetite."
          },
          life_threads: [
            "reading endurance and concentration management",
            "memory gaps around names and references",
            "small budget habits around daily routines",
            "social contact reduced to occasional encounters",
            "desire to remain mentally exact without display"
          ],
          voice_rules: {
            texture: ["measured", "precise about sensation", "restrained tenderness"],
            syntax_bias: ["careful sentence followed by softer inference", "limited metaphor density"],
            taboo_moves: ["no grand wisdom proclamation", "no sentimental lecture about youth"]
          },
          disclosure_plan: {
            early: ["begin with object or visual detail", "keep vulnerability implied", "anchor in immediate task"],
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
            must_include: ["one concrete object cue", "one time or memory shift", "one non-dramatic stake"],
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
        voice: ["quick internal pivots", "image-driven", "self-conscious restraint"],
        psyche0: { arousal: 0.45, valence: 0.58, agency: 0.61, permeability: 0.55, coherence: 0.60 },
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
            "self-consciousness that interrupts concentration"
          ],
          voice_rules: {
            texture: ["quick internal pivots", "image-driven", "self-conscious restraint"],
            syntax_bias: ["tight first sentence then associative slip", "occasional fragment"],
            taboo_moves: ["no pure victim framing", "no final life verdict"]
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
            must_include: ["one practical study stake", "one past/present/future cue", "one secondary concern"],
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
          voice_rules: {
            texture: ["restless", "self-correcting", "spare humor that doesn't land"],
            syntax_bias: ["self-assertion then quick revision", "plain words with occasional sharp image"],
            taboo_moves: ["no anti-intellectual rant", "no triumphant certainty ending"]
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
            must_include: ["one concrete study object", "one time marker", "one secondary life pressure"],
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
          voice_rules: {
            texture: ["observational", "architectural metaphors", "quiet unease"],
            syntax_bias: ["structured sentence rhythm", "occasional reflective fragment"],
            taboo_moves: ["no contempt for patrons", "no melodramatic collapse fantasy"]
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
            must_include: ["one desk/system detail", "one attention or memory shift", "one non-procedural concern"],
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
          voice_rules: {
            texture: ["plainspoken drift", "self-judging", "soft metaphysical recoil"],
            syntax_bias: ["direct statement then reflective turn", "lightly fragmented cadence"],
            taboo_moves: ["no heroic self-reinvention speech", "no pure nihilism"]
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
            must_include: ["one concrete object cue", "one mental or temporal shift", "one practical next-step pressure"],
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
       Current js/gpt.js rotates through monologues[characterId].THOUGHTS only.
       ========================================================= */
    monologues: {

      old_man: {
        THOUGHTS: [
`The book is heavier than it needs to be, or my patience is thinner than it once was. I hold it close to the window-light and pretend it’s only the print that has changed. The coat still feels like an older version of my life, one that expected winters to last. I smooth the page and listen to the small scratch of paper against paper, as if that sound could confirm I am still here.

Someone once wrote in the margins—faded pencil, a careful hand. I trace the line of an old argument and feel, briefly, that I am not reading alone. The room is full of private endurance. The words arrive slowly now, but they arrive. I follow them the way you follow a path in fog: not by seeing far, but by trusting the next step.`,

`I used to read for hours without lifting my head, as if the world outside the book had agreed to wait. Now my neck complains, my eyes water, and the letters shimmer at the edges like distant figures. But the mind still recognizes the shape of a sentence, the way an idea leans forward and then withdraws. The discipline returns: patience, again and again.

There is a comfort in this public silence. No one asks anything of me. I don’t have to be quick, or witty, or useful. I only have to attend. The page gives me a task that does not measure me. Even when a name slips away—an author, a friend, a street—I can still hold a thought long enough to feel its warmth. That is not nothing.`,

`The margins are generous. The kind of generosity paper offers without meaning to. I find myself reading not only the printed lines but the small accidents: a stain that might be coffee, a faint crease where someone dog-eared a corner, the slight darkening at the lower edge where many thumbs have rested. Time leaves fingerprints.

My attention folds inward almost without permission, toward the argument and away from the room. Still, the argument unfolds, and I am capable of following it. The room keeps its steady hum. A chair shifts; a page turns; a cough is swallowed. It is all so careful. I think: perhaps this is what remains - attention, practiced quietly, until it becomes a kind of mercy.`
        ]
      },

      young_woman: {
        THOUGHTS: [
`I sit where the light is best, as if light were a vote for my future. The window makes a private stage of the table, and I pretend I’m here only for the book. But the room keeps offering other presences: the old man’s careful hands, the student’s restless hovering, the librarian’s composed face that looks slightly elsewhere. Everyone is performing calm. Everyone is also leaking.

The sentence in front of me keeps breaking into possibilities. I underline, then regret the underline. I imagine the years ahead as a corridor that narrows, then widen it again in my mind, as if imagination could change architecture. I want to choose something without flinching. Instead I cultivate competence like a small fire and worry it will go out when no one is watching.

Sometimes, without warning, the silence amplifies me. My thoughts grow louder than the room. I look up and see only people reading, and I feel the strange tenderness of it: so much interior weather, contained inside coats and sleeves and polite posture.`,

`The page is open, but my attention keeps drifting to the glass: the faint reflection of my own face layered over shelves and light. It’s an unhelpful mirror. I don’t want to become a person who watches herself living. And yet I do, all the time—correcting my expression, rehearsing decisions, revising the past as if it were an essay.

I try to focus on the book. The words are intelligent; they are orderly. They do not solve my life, but they give me a sequence: read this page, mark one claim, follow one footnote. Borrowed certainty is still useful if I test it carefully and keep moving.

Still, there is the window-light on the table, the calm geometry of pages. It is a kind of shelter. I finish the chapter marker and feel the small relief of a decision kept.`,

`The old man turns the pages as if the paper could bruise. I envy that tenderness toward an object, toward time. My own gestures are too quick, as if speed could protect me from doubt. I keep thinking there is a correct tempo for a life, and I am already behind it.

I read and feel a kind of longing that has no clear address. Not for a person, not for a place—more like for a version of myself who doesn’t hesitate. The room is full of different tempos, not one correct pace; that thought softens something. The librarian’s desk looks like an anchor, the student’s notes like weather, and both still belong in the same room.

Sometimes I want someone to notice the way I look at books—as if the books are not only information but proof that I am capable of devotion. Maybe wanting witness is not a flaw. I return to the page and let the light do what it does: illuminate without judging.`
        ]
      },

      student: {
        THOUGHTS: [
`I hold my notes like a passport I’m afraid won’t be accepted. The shelves are too tall; the titles look confident. I look up for a book and feel my face arrange itself into seriousness, as if seriousness were the entry fee. Somewhere behind me a chair shifts and I interpret it as judgment, even though no one is looking. Silence makes me paranoid; it also makes me honest.

I keep thinking that if I finish one chapter, the next will open like a door. But it’s never a door. It’s another wall, another set of terms I’m supposed to know already. I envy the old man’s steadiness—how he reads without rushing, how he seems to have made peace with time. I envy the young woman too, though I can’t name why. Maybe it’s her ability to sit still inside herself.

I’m afraid of failing quietly. Not failing dramatically—quietly, like dust settling. I want a moment of certainty that feels earned. Instead I revise sentences in my mind, measure my worth by pages, and pretend the book can’t feel my hunger.`,

`The library makes everything look official. Even my doubts feel like they should be catalogued. I try to locate a particular volume and end up tracing spines with my finger as if touch could translate titles into confidence. My hair is uncooperative; my shirt is slightly wrinkled; I suddenly remember my accent and how it sounds in seminars. The room is full of people who have learned to appear composed, and I do not yet know the trick.

In my head I rehearse explanations for my own life: why I am here, what I’m working toward, what I will become. The explanations are tidy. The feelings underneath them are not. Still, I know one useful thing: asking a plain question in seminar is not collapse; it is participation.

And still—there are moments when the text catches, when an argument aligns with something I’ve sensed but never named. In those moments, the room feels less like a test. It feels like a shared shelter where thinking is allowed to be slow, and I can be part of it.`,

`I find the book I want, finally, and it isn’t even the right edition. I stand there holding it, and the embarrassment is irrational but immediate, like heat. I think of my friends, of my parents, of the voice in my head that keeps score. I want to surprise myself with competence, to feel inevitability instead of effort. I want to walk to a table and open the book and know, without bargaining, that I belong here.

The librarian looks up for a second and then returns to her work. The glance is neutral, and I can let it stay neutral. That feels new. Not every silence is a verdict; some are simply space to work.

I take the wrong edition anyway. I tell myself: begin somewhere. The page will either open or it won’t. The act of opening it is already a small defiance against the part of me that wants to flee, and today defiance is enough.`
        ]
      },

      librarian: {
        THOUGHTS: [
`The room regulates itself. It is a kind of rhythm: pages, pauses, the small re-settling of people in chairs. I watch the quiet the way other people watch weather. A missing book is a disturbance; a whispered conversation is a crack; even a phone screen is a flare. I keep the rules without believing they are moral. They are simply the architecture that makes this place possible.

Today my hands move through familiar tasks—stamps, lists, small administrative completions—and my mind drifts slightly to the side, where a vague concern sits like an unopened letter. It is not dramatic. It is persistent. I think of years passing, of institutions outliving individuals, of the way care can become invisible once it works.

Sometimes I want to sit at one of the tables as an ordinary reader. Just once, without interruption, without responsibility. To open a book and let it take me somewhere that isn’t order. But then a chair shifts, a student hovers, someone looks lost, and I return to the desk. The desk is a promise: if I remain here, the room will remain itself.`,

`I notice patterns. That is my habit and my burden. The same kinds of people choose the same tables. The same times of day bring the same restlessness. Even silence has variations, and I can tell when it is fragile. I can tell when someone is about to break it, not on purpose—by accident, by grief, by a thought that becomes too heavy to carry alone.

There is an old man reading as if the book were a relic. There is a young woman by the window who turns pages too quickly and then slows, as if remembering she is visible. There is a student who hovers near shelves like a question. And a man entering who looks unsure whether he is allowed. I see them and feel, unexpectedly, a tenderness that doesn’t belong to procedure.

And then I feel the faint concern again, the one I won’t name. It is less a warning than a reminder to widen my own life, not only maintain this room. The institution can be a sea wall, yes, but today it is also a harbor for five people and their unfinished afternoons.`,

`The desk has corners worn smooth by years of use. I look at it and feel time like a texture. My work is made of small preventions: preventing loss, preventing noise, preventing the slow drift into disorder. Most days I am proud of it. Today I am tired of it. Not tired in any dramatic sense - tired in the attention. The attention wants to go elsewhere.

I imagine choosing a book at random, letting the spine decide. I imagine sitting near the high windows and reading without watching the door. I would probably still count footsteps, still measure the room’s quiet against the afternoon. But perhaps I could allow ten minutes of being only a reader, and call that maintenance too.

Someone will ask me a question in a moment. I can feel it approaching. I straighten papers; I align a stack. The room continues to hum. I continue to guard it. In that continuation there is meaning already, even before I name it.`
        ]
      },

      man_in_hat: {
        THOUGHTS: [
`I come in to warm up. That is what I tell myself. Then I stay. The reading room has a peculiar permission: to stand still, to be unproductive without being accused. I hold my hat and briefcase like props from another life. For a moment I don’t know where to put my hands. I watch other people reading as if they are hiding, or waiting, or praying. I can’t decide which one I am.

The old man’s hands are careful with the book, as if the object were the last stable thing in the world. The librarian’s desk looks like a boundary line. The young woman at the window seems to be negotiating with herself. The student hovers with that particular hunger of the young: the hunger to be certain. I feel my own life as a draft, unfinished, full of crossed-out intentions.

I think about the locker where I will put my coat. The small ritual of leaving things behind. It occurs to me that I don’t know what I’m leaving behind anymore. The quiet is dangerous in that way. It makes room for thoughts I normally outrun.`,

`There is a kind of shame that doesn’t attach to a single act. It attaches to a pattern. I carry it like I carry the briefcase: not always heavy, but always present. I stand at the threshold of the room and feel the strange hope of anonymity. No one here knows me. That should be relief. Instead it feels like exposure. As if, without recognition, there is nothing to hold my shape.

I watch people reading and think: their minds are elsewhere, while the room keeps them politely here. I envy that separation. My thoughts keep colliding with themselves, but less violently once I stop arguing with them. I do not need a complete plan today. I need one honest decision and a place to stand while I make it.

The light in the room is pale and steady. It falls on tables as if it has been instructed to do so. I want an instruction like that for myself. Not a grand purpose. Just a direction I can follow without bargaining. A small yes that can survive the evening.`,

`I put the hat in my hands and imagine putting my restlessness away with it. The thought is almost funny. Restlessness is not an object. It is a weather system. It follows you inside. The library is not a cure. It is a mirror with a soft frame.

Still, there is something here: a calm that does not demand confession. The silence accepts me without asking why I’ve come. That acceptance unsettles me, then steadies me. I realize how often I seek friction just to confirm I exist. Here, the lack of friction lets one useful thought remain: I can choose differently before the day ends.

I look toward the high windows. I think about the city outside—its noise, its errands, its speed. The reading room feels like a pause in the film of the day. I stand in that pause and feel, briefly, the possibility of being less unfinished. Not finished—just less scattered, and pointed in a workable direction.`
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
Use 40-60 words; sentence fragments are allowed.`,
      scene:
`Setting details and ambient cues for this world.`,
      whisperRule:
`Treat whispers as atmospheric pressure, not dialogue.`,
      structureHint:
`Begin concrete, drift inward, end unresolved.`
    },
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
        psyche0: { arousal: 0.45, valence: 0.55, agency: 0.50, permeability: 0.40, coherence: 0.55 }
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
        psyche0: { arousal: 0.40, valence: 0.60, agency: 0.55, permeability: 0.35, coherence: 0.60 }
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
