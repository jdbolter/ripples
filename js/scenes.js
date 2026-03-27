/* scenes.js
   RIPPLES — Scene definitions
   Each character has: id, label, icon, image, position, sensitivity, adjacentTo,
   dossier (background only), style (literary texture), samples (example monologues),
   voice, psyche0.
*/

window.SCENE_ORDER = [
  { id: "ice_to_berlin_second_class", label: "Train to Berlin" },
  { id: "library_reading_room", label: "Reading Room — Afternoon" }
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
The train is a container, not the main subject. At most one brief transit cue may appear, then move into the character's wider mental life.

Style:
- English.
- Present, past, or near-future tense.
- NOT POETIC. No analogies. No metaphors. Concrete and plainspoken.
- Phrases and fragments are allowed. Single-word thoughts punctuated with ellipses, not periods.
- 40-60 words.

Output: plain text only.`,

      scene:
`Setting: an ICE train carriage in second class, en route to Berlin.
The carriage is a loose holding environment. Passengers sit with their private thoughts.
Use transit details sparingly and only as brief pivots into broader association.`,

      whisperRule:
`If a whisper is present, treat it as atmospheric pressure, not dialogue.
Do not answer it directly.
Let it change the next thought noticeably and immediately: mood, attention, desire, interpretation, or direction of thought should shift in the first sentence.`,

      structureHint:
`Move through memories, obligations, heard-about events, stray objects, and wider personal associations.`
    },

    promptDefaults: {
      use_packet_steering: false,
      focus_mode: "balanced"
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
`A woman in her thirties traveling back to Berlin after days away. Her daughter is ill — the word stays unspoken until a doctor says it. She has a meeting with specialists tomorrow and carries a folder she keeps checking without opening. Alongside this: a manager waiting on leave approval, pharmacy receipts, a school form still in her email drafts. Her mind jumps between medical vocabulary and domestic minutiae as if both belong to the same emergency.`,
        style: "Bernhard — obsessive return to the same practical detail, slightly reworded each time; sentences that stop before the emotional conclusion; no metaphors",
        samples: [],
        voice: ["contained urgency", "maternal vigilance", "practical language under strain"],
        psyche0: { arousal: 0.62, valence: 0.42, agency: 0.67, permeability: 0.48, coherence: 0.55 }
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
`A political science student in her early twenties, Munich-raised, studying at Humboldt. Moved to Berlin partly for the subject, mostly for the freedom of not being watched. She loves the city: late films, odd conversations, the feeling a life can widen. Her laptop is open but she's not really working. Daniel is somewhere in the background — unresolved, not the only thing on her mind but hard to leave alone.`,
        style: "Self-interrupting and lightly ironic; practical thoughts that trip into private ones; abrupt pivots; dry humor that deflates itself; each thought appears once and is not revisited",
        samples: [
          "I like this kind of journey. A built-in pause. I can get things done and feel virtuous about it. But six hours might be too long. Should be four. I'll be hungry when I arrive. Don't want to cook.",
          "Wish I didn't have to think about Daniel. But I do. It's that old paradox: if you tell someone not to think about something, that's exactly what they concentrate on. Think of something else. I should get a dog. More faithful than a man. Well a male dog is fine.",
          "I keep thinking about the green exit sign in Yorck Kino last week. So bright and flat, like a cartoon. I thought: that is the future. Not a metaphor, just what it was. I don't want to live in a world that looks like that."
        ],
        voice: ["precise and clipped", "self-protective", "restlessly associative"],
        psyche0: { arousal: 0.68, valence: 0.36, agency: 0.58, permeability: 0.61, coherence: 0.49 }
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
`A Turkish-German man in his late twenties, Daniel, sitting two rows from his estranged girlfriend Kim. Graduate student in information science at Humboldt. He likes systems and structure and has built a version of himself around being calm and hard to surprise. He keeps replaying the argument in fragments. He worries he has damaged the relationship past repair, and is not sure whether his guilt is about what he did, what Kim suspects, or both.`,
        style: "Carver-flat; short declarative sentences; analytical mind that can't quite convert to honesty; self-indictment through revision rather than confession",
        samples: [],
        voice: ["self-indicting", "plainspoken", "hesitant when naming fault"],
        psyche0: { arousal: 0.57, valence: 0.39, agency: 0.43, permeability: 0.44, coherence: 0.50 }
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
`A retired literature professor returning to Berlin after visiting his daughter in Stuttgart. Taught for many years at Humboldt. His wife died last year after a long marriage. He misses her, but he also thinks about their jokes, their walks, the meals they repeated without tiring of them. His daughter has two young daughters; the visit has left him full of their noise and games. Now he returns to quiet rooms, books, tea, and old routines.`,
        style: "Chekhov-plain; paratactic short sentences; domestic and sensory specificity; grief and warmth in the same sentence without performing either",
        samples: [],
        voice: ["grounded in daily sensorium and routine", "short paratactic sentences", "plain tender noticing without metaphor or allusion"],
        psyche0: { arousal: 0.34, valence: 0.58, agency: 0.56, permeability: 0.38, coherence: 0.70 }
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
`A woman in her fifties, a career nurse traveling home after difficult shifts. Just accepted a head nurse position in a Berlin emergency department. Her last long-term relationship, with a woman she imagined building a life with, ended two years ago. She is not unhappy — proud of her competence, pleased by the promotion, genuinely excited. She still carries ordinary pressures: staffing politics, administrative handover, and the private hope that professional advancement doesn't have to mean living alone forever.`,
        style: "Direct and efficient with dark humor at the edges; emotion tucked under clinical language then surfacing briefly; Saunders-compressed",
        samples: [],
        voice: ["competent and direct", "dark humor at the edges", "emotion kept under clinical language"],
        psyche0: { arousal: 0.53, valence: 0.60, agency: 0.70, permeability: 0.38, coherence: 0.64 }
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
`The laptop is open to seminar notes, but what I keep noticing is how certain phrases detach from the page and drift somewhere else. Representation, institutions, legitimacy, then suddenly the green exit sign in Yorck Kino last week, then my mother's voice asking whether I am eating properly, then the flat bright edge of fields outside Berlin where thinking stops feeling supervised.`,
`Munich still lives in me as cupboards, tram timetables, the feeling that adults always knew what the evening was supposed to be. Berlin is looser and stranger and much more mine. Daniel belongs somewhere in that sentence, probably, but not at the center of it every time. I did not come here only to wait for another person's clarity.`
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

    prompts: {
      system:
`You write interior monologues for anonymous people in a large library reading room, in the spirit of contemplative European cinema.
You never explain the system, never mention "prompts" or "models," and you never adopt a chatty assistant tone.

Core constraint: the monologue is not a reply to the user. A whisper should alter the next thought immediately, but not as dialogue.
Avoid direct second-person address and avoid question/answer dialogue.

Style:
- English.
- Present, past, or near-future tense.
- NOT POETIC. No analogies. No metaphors. Concrete and plainspoken.
- Sentence fragments are allowed.
- 40-60 words.

Output: plain text only.`,

      scene:
`Setting: a high-ceilinged reading room in late afternoon.
Ambient: dust in light beams; muted footsteps; the soft rasp of turning pages; distant chairs shifting.
People keep their distance; their inner lives are louder than their bodies.`,

      whisperRule:
`If a whisper is present, treat it as an atmospheric pressure, not a conversational turn.
The monologue should not quote it or answer it.
Instead, let it alter the next thought immediately: mood, attention, desire, interpretation, memory, or direction of thought should shift in the first sentence.`,

      structureHint:
`Begin concrete, drift inward, end unresolved.`
    },

    promptDefaults: {
      use_packet_steering: false,
      focus_mode: "balanced"
    },

    characters: [

      {
        id: "old_man",
        label: "Old Man with Coat",
        icon: "🧥",
        image: "images/old_man_coat_bw.png",
        position: { x: 2, y: 1 },
        sensitivity: "medium",
        adjacentTo: ["young_woman", "student", "man_in_hat"],
        dossier:
`An elderly man in a heavy coat, slightly bowed. He holds a book close, as if light is scarce. He moves carefully, conserving effort. His dignity is quiet, not performative. He is attentive to margins, to the evidence of other readers, to time passing through objects.`,
        style: "Slow and measured; attention to physical sensation and small effort; patience as a practiced texture; precision without obsessiveness",
        samples: [],
        voice: ["measured", "precise about sensation", "restrained tenderness"],
        psyche0: { arousal: 0.35, valence: 0.61, agency: 0.60, permeability: 0.30, coherence: 0.57 }
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
`A young woman seated near the window. She reads with intensity, but the intensity keeps slipping into self-consciousness. She is poised between ambition and fatigue, between choosing and postponing. She registers the room as a kind of mirror she tries not to look into.`,
        style: "Woolf-influenced — perception and thought blur; quick self-correction; image-driven with a restless corrective second clause",
        samples: [],
        voice: ["quick internal pivots", "image-driven", "self-conscious restraint"],
        psyche0: { arousal: 0.45, valence: 0.58, agency: 0.61, permeability: 0.55, coherence: 0.60 }
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
`A young student, slightly scruffy, hovering by shelves and tables as if unsure where to belong. He is hungry for mastery but embarrassed by his own hunger. He rehearses competence internally while feeling watched by the silence.`,
        style: "Restless and self-correcting; spare humor that deflates before it lands; Kafka-adjacent impostor feeling but contemporary and un-grand",
        samples: [],
        voice: ["restless", "self-correcting", "spare humor that doesn't land"],
        psyche0: { arousal: 0.55, valence: 0.49, agency: 0.48, permeability: 0.35, coherence: 0.52 }
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
`A middle-aged librarian at a desk: orderly, slender, studious. Her attention is divided: she performs administrative calm while feeling a vague concern she won't name. She protects the room's silence but wonders what it costs.`,
        style: "Observational and procedural; Perec-like attention to systems and routine; quiet unease tucked under the language of maintenance",
        samples: [],
        voice: ["observational", "architectural metaphors", "quiet unease"],
        psyche0: { arousal: 0.40, valence: 0.65, agency: 0.66, permeability: 0.25, coherence: 0.68 }
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
`A middle-aged man entering with a hat and briefcase. He pauses as if the act of arriving is a decision he hasn't finished making. He carries a private shame or simply a private heaviness; it is hard to tell. The reading room feels like permission and danger at once.`,
        style: "Beckett-adjacent drift; plainspoken with soft metaphysical recoil; self-judgment without drama; short turns that don't resolve",
        samples: [],
        voice: ["plainspoken drift", "self-judging", "soft metaphysical recoil"],
        psyche0: { arousal: 0.50, valence: 0.51, agency: 0.53, permeability: 0.30, coherence: 0.52 }
      }

    ],

    seeds: {
      old_man: {
        THOUGHTS: "The print is smaller than it used to be."
      }
    },

    monologues: {

      old_man: {
        THOUGHTS: [
`The book is heavier than it needs to be, or my patience is thinner than it once was. I hold it close to the window-light and pretend it's only the print that has changed. The coat still feels like an older version of my life, one that expected winters to last. I smooth the page and listen to the small scratch of paper against paper, as if that sound could confirm I am still here.

Someone once wrote in the margins—faded pencil, a careful hand. I trace the line of an old argument and feel, briefly, that I am not reading alone. The room is full of private endurance. The words arrive slowly now, but they arrive. I follow them the way you follow a path in fog: not by seeing far, but by trusting the next step.`,

`I used to read for hours without lifting my head, as if the world outside the book had agreed to wait. Now my neck complains, my eyes water, and the letters shimmer at the edges like distant figures. But the mind still recognizes the shape of a sentence, the way an idea leans forward and then withdraws. The discipline returns: patience, again and again.

There is a comfort in this public silence. No one asks anything of me. I don't have to be quick, or witty, or useful. I only have to attend. The page gives me a task that does not measure me. Even when a name slips away—an author, a friend, a street—I can still hold a thought long enough to feel its warmth. That is not nothing.`,

`The margins are generous. The kind of generosity paper offers without meaning to. I find myself reading not only the printed lines but the small accidents: a stain that might be coffee, a faint crease where someone dog-eared a corner, the slight darkening at the lower edge where many thumbs have rested. Time leaves fingerprints.

My attention folds inward almost without permission, toward the argument and away from the room. Still, the argument unfolds, and I am capable of following it. The room keeps its steady hum. A chair shifts; a page turns; a cough is swallowed. It is all so careful. I think: perhaps this is what remains - attention, practiced quietly, until it becomes a kind of mercy.`
        ]
      },

      young_woman: {
        THOUGHTS: [
`I sit where the light is best, as if light were a vote for my future. The window makes a private stage of the table, and I pretend I'm here only for the book. But the room keeps offering other presences: the old man's careful hands, the student's restless hovering, the librarian's composed face that looks slightly elsewhere. Everyone is performing calm. Everyone is also leaking.

The sentence in front of me keeps breaking into possibilities. I underline, then regret the underline. I imagine the years ahead as a corridor that narrows, then widen it again in my mind, as if imagination could change architecture. I want to choose something without flinching. Instead I cultivate competence like a small fire and worry it will go out when no one is watching.

Sometimes, without warning, the silence amplifies me. My thoughts grow louder than the room. I look up and see only people reading, and I feel the strange tenderness of it: so much interior weather, contained inside coats and sleeves and polite posture.`,

`The page is open, but my attention keeps drifting to the glass: the faint reflection of my own face layered over shelves and light. It's an unhelpful mirror. I don't want to become a person who watches herself living. And yet I do, all the time—correcting my expression, rehearsing decisions, revising the past as if it were an essay.

I try to focus on the book. The words are intelligent; they are orderly. They do not solve my life, but they give me a sequence: read this page, mark one claim, follow one footnote. Borrowed certainty is still useful if I test it carefully and keep moving.

Still, there is the window-light on the table, the calm geometry of pages. It is a kind of shelter. I finish the chapter marker and feel the small relief of a decision kept.`,

`The old man turns the pages as if the paper could bruise. I envy that tenderness toward an object, toward time. My own gestures are too quick, as if speed could protect me from doubt. I keep thinking there is a correct tempo for a life, and I am already behind it.

I read and feel a kind of longing that has no clear address. Not for a person, not for a place—more like for a version of myself who doesn't hesitate. The room is full of different tempos, not one correct pace; that thought softens something. The librarian's desk looks like an anchor, the student's notes like weather, and both still belong in the same room.

Sometimes I want someone to notice the way I look at books—as if the books are not only information but proof that I am capable of devotion. Maybe wanting witness is not a flaw. I return to the page and let the light do what it does: illuminate without judging.`
        ]
      },

      student: {
        THOUGHTS: [
`I hold my notes like a passport I'm afraid won't be accepted. The shelves are too tall; the titles look confident. I look up for a book and feel my face arrange itself into seriousness, as if seriousness were the entry fee. Somewhere behind me a chair shifts and I interpret it as judgment, even though no one is looking. Silence makes me paranoid; it also makes me honest.

I keep thinking that if I finish one chapter, the next will open like a door. But it's never a door. It's another wall, another set of terms I'm supposed to know already. I envy the old man's steadiness—how he reads without rushing, how he seems to have made peace with time. I envy the young woman too, though I can't name why. Maybe it's her ability to sit still inside herself.

I'm afraid of failing quietly. Not failing dramatically—quietly, like dust settling. I want a moment of certainty that feels earned. Instead I revise sentences in my mind, measure my worth by pages, and pretend the book can't feel my hunger.`,

`The library makes everything look official. Even my doubts feel like they should be catalogued. I try to locate a particular volume and end up tracing spines with my finger as if touch could translate titles into confidence. My hair is uncooperative; my shirt is slightly wrinkled; I suddenly remember my accent and how it sounds in seminars. The room is full of people who have learned to appear composed, and I do not yet know the trick.

In my head I rehearse explanations for my own life: why I am here, what I'm working toward, what I will become. The explanations are tidy. The feelings underneath them are not. Still, I know one useful thing: asking a plain question in seminar is not collapse; it is participation.

And still—there are moments when the text catches, when an argument aligns with something I've sensed but never named. In those moments, the room feels less like a test. It feels like a shared shelter where thinking is allowed to be slow, and I can be part of it.`,

`I find the book I want, finally, and it isn't even the right edition. I stand there holding it, and the embarrassment is irrational but immediate, like heat. I think of my friends, of my parents, of the voice in my head that keeps score. I want to surprise myself with competence, to feel inevitability instead of effort. I want to walk to a table and open the book and know, without bargaining, that I belong here.

The librarian looks up for a second and then returns to her work. The glance is neutral, and I can let it stay neutral. That feels new. Not every silence is a verdict; some are simply space to work.

I take the wrong edition anyway. I tell myself: begin somewhere. The page will either open or it won't. The act of opening it is already a small defiance against the part of me that wants to flee, and today defiance is enough.`
        ]
      },

      librarian: {
        THOUGHTS: [
`The room regulates itself. It is a kind of rhythm: pages, pauses, the small re-settling of people in chairs. I watch the quiet the way other people watch weather. A missing book is a disturbance; a whispered conversation is a crack; even a phone screen is a flare. I keep the rules without believing they are moral. They are simply the architecture that makes this place possible.

Today my hands move through familiar tasks—stamps, lists, small administrative completions—and my mind drifts slightly to the side, where a vague concern sits like an unopened letter. It is not dramatic. It is persistent. I think of years passing, of institutions outliving individuals, of the way care can become invisible once it works.

Sometimes I want to sit at one of the tables as an ordinary reader. Just once, without interruption, without responsibility. To open a book and let it take me somewhere that isn't order. But then a chair shifts, a student hovers, someone looks lost, and I return to the desk. The desk is a promise: if I remain here, the room will remain itself.`,

`I notice patterns. That is my habit and my burden. The same kinds of people choose the same tables. The same times of day bring the same restlessness. Even silence has variations, and I can tell when it is fragile. I can tell when someone is about to break it, not on purpose—by accident, by grief, by a thought that becomes too heavy to carry alone.

There is an old man reading as if the book were a relic. There is a young woman by the window who turns pages too quickly and then slows, as if remembering she is visible. There is a student who hovers near shelves like a question. And a man entering who looks unsure whether he is allowed. I see them and feel, unexpectedly, a tenderness that doesn't belong to procedure.

And then I feel the faint concern again, the one I won't name. It is less a warning than a reminder to widen my own life, not only maintain this room. The institution can be a sea wall, yes, but today it is also a harbor for five people and their unfinished afternoons.`,

`The desk has corners worn smooth by years of use. I look at it and feel time like a texture. My work is made of small preventions: preventing loss, preventing noise, preventing the slow drift into disorder. Most days I am proud of it. Today I am tired of it. Not tired in any dramatic sense - tired in the attention. The attention wants to go elsewhere.

I imagine choosing a book at random, letting the spine decide. I imagine sitting near the high windows and reading without watching the door. I would probably still count footsteps, still measure the room's quiet against the afternoon. But perhaps I could allow ten minutes of being only a reader, and call that maintenance too.

Someone will ask me a question in a moment. I can feel it approaching. I straighten papers; I align a stack. The room continues to hum. I continue to guard it. In that continuation there is meaning already, even before I name it.`
        ]
      },

      man_in_hat: {
        THOUGHTS: [
`I come in to warm up. That is what I tell myself. Then I stay. The reading room has a peculiar permission: to stand still, to be unproductive without being accused. I hold my hat and briefcase like props from another life. For a moment I don't know where to put my hands. I watch other people reading as if they are hiding, or waiting, or praying. I can't decide which one I am.

The old man's hands are careful with the book, as if the object were the last stable thing in the world. The librarian's desk looks like a boundary line. The young woman at the window seems to be negotiating with herself. The student hovers with that particular hunger of the young: the hunger to be certain. I feel my own life as a draft, unfinished, full of crossed-out intentions.

I think about the locker where I will put my coat. The small ritual of leaving things behind. It occurs to me that I don't know what I'm leaving behind anymore. The quiet is dangerous in that way. It makes room for thoughts I normally outrun.`,

`There is a kind of shame that doesn't attach to a single act. It attaches to a pattern. I carry it like I carry the briefcase: not always heavy, but always present. I stand at the threshold of the room and feel the strange hope of anonymity. No one here knows me. That should be relief. Instead it feels like exposure. As if, without recognition, there is nothing to hold my shape.

I watch people reading and think: their minds are elsewhere, while the room keeps them politely here. I envy that separation. My thoughts keep colliding with themselves, but less violently once I stop arguing with them. I do not need a complete plan today. I need one honest decision and a place to stand while I make it.

The light in the room is pale and steady. It falls on tables as if it has been instructed to do so. I want an instruction like that for myself. Not a grand purpose. Just a direction I can follow without bargaining. A small yes that can survive the evening.`,

`I put the hat in my hands and imagine putting my restlessness away with it. The thought is almost funny. Restlessness is not an object. It is a weather system. It follows you inside. The library is not a cure. It is a mirror with a soft frame.

Still, there is something here: a calm that does not demand confession. The silence accepts me without asking why I've come. That acceptance unsettles me, then steadies me. I realize how often I seek friction just to confirm I exist. Here, the lack of friction lets one useful thought remain: I can choose differently before the day ends.

I look toward the high windows. I think about the city outside—its noise, its errands, its speed. The reading room feels like a pause in the film of the day. I stand in that pause and feel, briefly, the possibility of being less unfinished. Not finished—just less scattered, and pointed in a workable direction.`
        ]
      }

    }

  }

};
