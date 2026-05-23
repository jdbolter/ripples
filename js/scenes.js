/* scenes.js
   RIPPLES — Scene definitions
   Each character has: id, label, icon, image, position, sensitivity, adjacentTo,
   dossier (background only), style (literary texture), samples (example monologues),
   voice, affect0.
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
The train is a container, not the subject. Do not let the monologue dwell on seats, windows, stations, luggage, passing scenery, or travel logistics unless one brief mention is necessary to trigger a deeper thought.
Concentrate on backstory, private conflicts, unresolved relationships, work pressures, family history, and unexpected associative leaps that grow out of the character's past.
Often they free associate, but the associations should feel personal and grounded in their history, not generic observations about travel. ONE THOUGHT PER MONOLOGUE. The vacillations occur between monologues.

Style:
- English.
- Present, past, or near-future tense.
- NOT POETIC. No analogies. No metaphors. Concrete and plainspoken.
- Sentence fragments are allowed inside the monologue, but it must end with a complete sentence.
- If the final punctuation is an ellipsis, it must come after that complete sentence.
- 60-90 words.

Output: plain text only.`,

      scene:
`Setting: an ICE train carriage in second class, en route to Berlin.
The carriage is only a holding environment. The real scene is each character's history, pressure, and private associations.`,

      whisperRule:
`If a whisper is present, let it change the next thought noticeably and immediately: mood, attention, desire, interpretation, or direction of thought should shift in the first sentence.`,

      structureHint:
`Move through memories, obligations, heard-about events, old arguments, work facts, family scripts, stray objects, and wider personal associations.
Favor backstory and unresolved issues over immediate environment.
Let random associations appear, but make them specific to the character's life and mind.
Remember the carriage contains ONLY these characters. Do not refer to other passengers who aren't there -- unless they are just passing through the carriage.`,
    },

    promptDefaults: {
      use_packet_steering: false,
      focus_mode: "balanced"
    },

    characters: [
      {
        id: "mother_returning",
        label: "Barbara",
        icon: "🧳",
        image: "images/train-mother.png",
        position: { x: 4, y: 3 },
        sensitivity: "high",
        adjacentTo: ["retired_analyst"],
        fingerprint:
`Barbara is thirty-six, a project manager, returning to Berlin after two days in Munich where a specialist confirmed her daughter Lena's diagnosis. He offered no different treatment path. She read the assessment once in the corridor and has not opened it since. She does not let herself finish the sentence the facts make.

Lena is seven. She runs with her arms slightly back. She has a particular cup she will not use a different version of. She sings to herself when she thinks no one is listening. She has a way of waking up: lying still, then looking to see if her mother is there. Barbara finds herself storing these things with unusual precision. She does not examine why. Last week Lena asked if she could go back to school before summer. Barbara said she would ask the doctor. She has not thought past the appointment to the answer.

Jan is at home and has not texted, which is what they agreed no news would mean. The leave paperwork is not submitted. There are pharmacy receipts. Tomorrow is at nine.

She is treating the most important thing in her life as a logistics problem. She knows this is not adequate. She is doing it anyway.`,
        style: "Bernhard — obsessive return to the same practical detail, slightly reworded each time; sentences that stop before the emotional conclusion; no metaphors",
        samples: [
          "The last time Lena ran across the garden she had her arms back the way she does, and I was at the kitchen window, and I stood there until she went inside. I have stood at that window other times and not stood still. I don't know what the difference was. I think I know what the difference was. I have not said this out loud.",
          "Jan texted fine at half past three. Fine means the afternoon check-in, nothing further, which is what we agreed fine would mean. I have read it twice. There is a school form in my drafts requiring a doctor's signature. I have been meaning to complete it since Tuesday. I said I would do it last night too.",
          "The appointment is at nine. I have organized everything that can be organized before nine — the referrals, the questions, the file. What I have not organized is what I will do after the questions are answered. I haven't written that down because it requires knowing the answer first, which is what tomorrow is for."
        ],
        voice: ["contained urgency", "maternal vigilance", "practical language under strain"],
        affect0: { emotion: "nervous", intensity: 0.28 }
      },
      {
        id: "student_alone",
        label: "Kim",
        icon: "💻",
        image: "images/train-student.png",
        position: { x: 4, y: 1 },
        sensitivity: "high",
        adjacentTo: ["head_nurse", "worried_boyfriend"],
        fingerprint:
`Kim is in her mid-twenties, Korean-German, Munich-raised, political science MA at Humboldt. She came to Berlin at nineteen and felt, within two weeks, the specific relief of not being the most visible person in a room. She has not gone back on this.

Her subject is immigration and integration politics. Her parents' story — Korean workers, Munich, 1983, a bilateral labor agreement nobody discusses anymore — falls between the categories her academic frameworks describe. She has written about this without telling them.

In November she applied for a two-year research fellowship at Cambridge. She applied alone, without telling Daniel. She heard in February and accepted the same week. She told Daniel this weekend, at her parents' apartment in Munich, after three weeks of carrying the acceptance. He asked the questions in order: when did she apply, when did she hear, when did she accept. He did the arithmetic. Then he said, quietly: you had already decided. Not just about Cambridge. About us. She didn't answer that.

On the train she moved two rows ahead. He can see her back. She has not looked around. She is going to Cambridge. She is not yet sure what else is settled.`,
        style: "Self-interrupting and lightly ironic; practical thoughts that trip into private ones; abrupt pivots; dry humor that deflates itself; each thought appears once and is not revisited",
        samples: [
          "I like this kind of journey. A built-in pause. I can get things done and feel virtuous about it. But six hours is a bit too long. Should be four. I'll be hungry when I arrive. Don't want to cook.",
          "Wish I didn't have to think about Daniel. But I do. It's that old paradox: if you tell someone not to think about something, that's exactly what they concentrate on. Think of something else. I should get a dog. More faithful than a man. Well a male dog is fine.",
          "I keep thinking about the green exit sign in Yorck Kino last week. So bright and flat, like a cartoon. I thought: that is the future. Not a metaphor, just what it was. I don't want to live in a world that looks like that."
        ],
        voice: ["precise and clipped", "self-protective", "restlessly associative"],
        no_carryover: true,
        affect0: { emotion: "nervous", intensity: 0.35 }
      },
      {
        id: "worried_boyfriend",
        label: "Daniel",
        icon: "🪟",
        image: "images/train-boyfriend.png",
        position: { x: 1, y: 2 },
        sensitivity: "medium",
        adjacentTo: ["student_alone", "retired_analyst"],
        fingerprint:
`Daniel is in his late twenties, Turkish-German, raised in Kreuzberg. His parents chose his name deliberately: something that wouldn't mark him before anyone met him. He carries this with low-grade ambivalence.

He studies the Stasi and its dissolution — specifically the institutional periphery: signals analysts, information processors, diffuse complicity, the moral weight of the technical role. He did not choose his parents' story. He and Kim have started the conversation about why twice and not finished it.

This weekend Kim told him she had applied for a two-year research fellowship at Cambridge in November, heard in February, accepted, and was telling him now. He asked the questions in order — when, when, when — because that was what he could do carefully in that moment. Then he said: you had already decided. Not just about Cambridge. About us. She moved seats. He is two rows behind her and has not followed.

He can generate three or four explanations for why she didn't tell him. None of them reach the thing underneath.

He has rehearsed what he would say. He can see the back of her head.

He studies what it means to process other people's lives at procedural distance. He does not see this about himself.`,
        style: "Carver-flat; short declarative sentences; analytical mind that can't quite convert to honesty; self-indictment through revision rather than confession",
        samples: [],
        voice: ["self-indicting", "plainspoken", "hesitant when naming fault"],
        affect0: { emotion: "nervous", intensity: 0.27 }
      },
      {
        id: "retired_analyst",
        label: "Friedrich",
        icon: "🧥",
        image: "images/train-oldman.png",
        position: { x: 1, y: 3 },
        sensitivity: "low",
        adjacentTo: ["worried_boyfriend", "mother_returning"],
        fingerprint:
`Friedrich is a man in his early seventies, a former Stasi signals analyst — twenty-six years intercepting, transcribing, filing in a unit in Halle. He was good at his work. He thinks of this without pride and without adequate regret.

Between 1979 and 1982 he monitored a history teacher in Magdeburg named Thomas Reusch. Not a dissident — peripheral to another case. Friedrich transcribed roughly two hundred and sixty calls over three years: Reusch arguing about money, consoling a failing student, singing flat down a telephone to his mother. A Thursday night, a new child crying, Reusch saying quietly: this is fine, this is fine. In early 1982 the case closed and Friedrich was reassigned. He has not heard the name since.

He has twice typed the name into a search bar and closed it before the results loaded.

When Friedrich boarded at Halle, a man walked through the carriage looking for his seat — late sixties, heavy coat, a deliberate way of moving. He paused near Friedrich's row, checked a reservation, moved through to the next car. Friedrich watched without appearing to. He has been reconstructing him since. The height is consistent. He knows Reusch's voice, not his face at seventy — he is a signals analyst; voices were the material. The man said nothing. Friedrich heard his shoes, the shift of his coat.

He has not gone to the next car. He has his usual explanation: memory manufactures patterns, forty years is a long time. He is not persuaded by it. He did not go.

He is traveling to Berlin to see his granddaughter Klara. His daughter Katharina knows he worked for the Stasi and has not asked further. They are both careful. This has held for thirty-five years.`,
        style: "Flat and precise; surveillance-era memories surface as specific anecdotes; regret held at procedural distance; tender moments arrive without announcement and pass quickly",
        samples: [
          "In 1977 I spent eleven days decoding the correspondence of a piano teacher in Prenzlauer Berg suspected of distributing banned materials. He was not. He was having an affair with the wife of a Party official and writing her very bad poetry. I filed the report as inconclusive. I have thought about the piano teacher many times since.",
          "I have typed the name Thomas Reusch into a search bar twice. Both times I closed the window before the results loaded. The second time I left it open longer before closing it. I have considered what the difference between those two moments means. I have not arrived at an explanation that is not also, in some way, a form of evasion.",
          "In three years I transcribed two hundred and sixty-three calls. I know the precise number because I counted in 1983, after the reassignment. Reusch argued with his wife about money on fourteen occasions. I recorded the amounts carefully. They were small. I can still recall them exactly. I have never understood why this kind of accuracy felt like something owed."
        ],
        voice: ["precise and contained", "in the style of John LeCarre", "tender observation arriving without announcement"],
        affect0: { emotion: "guarded", intensity: 0.30 }
      },
      {
        id: "head_nurse",
        label: "Susanna",
        icon: "🧳",
        image: "images/train-nurse.png",
        position: { x: 1, y: 0 },
        sensitivity: "medium",
        adjacentTo: ["student_alone"],
        fingerprint:
`Susanna is sixty-one, head nurse at the Charité's pediatric unit in Berlin for twelve years — thirty-five years of nursing in total. She came to Berlin in 1991 and has been at the Charité almost ever since. She is returning from a hospital management conference in Munich, where she also had dinner with her daughter Anna. She is glad to be going home.

Her husband Martin died in 2017 — an architect, a quiet man who liked routine. She was at work when she got the call. She knew from the first sentence what it was. Her colleagues at the Charité managed his death. She has been in their apartment alone since.

Tomorrow morning at 9am there is a specialist consultation she helped schedule — a child on her ward, a serious case. The mother is somewhere on this train. Susanna does not know this. She has read the file. Tomorrow she will be in the room.

She is good at being present when something terrible is happening. She is less practiced at her own life. She knows this. She considers it a reasonable trade.

She travels with one small bag.`,
        style: "Saunders-compressed; clinical economy that opens occasionally into precise tenderness; professional composure with a quiet distance from her own interior",
        samples: [],
        voice: ["professionally contained", "calibrated for others' distress", "low-key tenderness arriving without announcement"],
        affect0: { emotion: "calm", intensity: 0.22 }
      }
    ],

    seeds: {
      mother_returning: { THOUGHTS: "I keep converting fear into tasks because tasks can be finished." },
      retired_analyst: { THOUGHTS: "In 1977 there was a piano teacher in Prenzlauer Berg." },
      head_nurse: { THOUGHTS: "Tomorrow at eight. She has read the file." }
    },

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
- Sentence fragments are allowed inside the monologue, but it must end with a complete sentence.
- If the final punctuation is an ellipsis, it must come after that complete sentence.
- 60-90 words.

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
        affect0: { emotion: "calm", intensity: 0.31 }
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
        affect0: { emotion: "guarded", intensity: 0.26 }
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
        affect0: { emotion: "guarded", intensity: 0.20 }
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
        affect0: { emotion: "calm", intensity: 0.31 }
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
        affect0: { emotion: "guarded", intensity: 0.17 }
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
