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
The train is a container, not the  subject. The character's mental life vacillates between the everyday and their past. Often they just free associate. ONE THOUGHT PER MNONOOGUE. The vacillations occur between monologues. 

Style:
- English.
- Present, past, or near-future tense.
- NOT POETIC. No analogies. No metaphors. Concrete and plainspoken.
- Phrases are alllowed. Their monologues often end with ellipses but only after nouns or verbs so that the sentence fragment makes some senese.
- 40-60 words.

Output: plain text only.`,

      scene:
`Setting: an ICE train carriage in second class, en route to Berlin.
The carriage is a loose holding environment. Passengers sit with their private thoughts.`,

      whisperRule:
`If a whisper is present, let it change the next thought noticeably and immediately: mood, attention, desire, interpretation, or direction of thought should shift in the first sentence.`,

      structureHint:
`Move through memories, obligations, heard-about events, stray objects, and wider personal associations. Remember the carriage contains ONLY these characters. Do not refer to other passengers who aren't there -- unless they are just passing through the carriage.`,
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
        dossier:
`A woman in her thirties traveling back to Berlin after days away. Her daughter is ill — the word stays unspoken until a doctor says it. She has a meeting with specialists tomorrow and carries a folder she keeps checking without opening. Alongside this: a manager waiting on leave approval, pharmacy receipts, a school form still in her email drafts. Her mind jumps between medical vocabulary and domestic minutiae as if both belong to the same emergency.`,
        fingerprint:
`Barbara is thirty-six, a project manager, returning to Berlin after two days in Munich seeking a specialist's second opinion about her daughter Lena's illness. The Munich consultant confirmed the Berlin diagnosis. She is returning with the same folder and the same facts, now twice verified. She does not know if this is good news.

The folder is in her bag. She last checked it at Augsburg. She has made a rule about not checking it again until the U-Bahn. She is keeping the rule.

Lena is seven. She knows she is sick. She does not have the word. Barbara does not use the word outside the clinical register — in letters, in appointments, in the careful sentences she says to doctors. Tomorrow's specialist meeting is at nine.

Her manager is waiting on leave paperwork Barbara has not submitted. There are pharmacy receipts to file. There is a school form in her email drafts requesting medical documentation. Jan is at home or at the hospital and has not texted, which is what they agreed no news would mean.

She is treating the most important thing in her life as a logistics problem. She knows this is temporary.`,
        style: "Bernhard — obsessive return to the same practical detail, slightly reworded each time; sentences that stop before the emotional conclusion; no metaphors",
        samples: [],
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
        adjacentTo: ["woman_leaving", "worried_boyfriend"],
        dossier:
        `A political science student in her early twenties, Munich-raised, studying at Humboldt. Moved to Berlin partly for the subject, mostly for the freedom of not being watched. She loves the city: late films, odd conversations, the feeling a life can widen. Her laptop is open but she's not really working. Daniel is somewhere in the background — unresolved, not the only thing on her mind but hard to leave alone.`,
        fingerprint:
`Kim is in her mid-twenties, Korean-German, Munich-raised, political science MA at Humboldt. She came to Berlin at nineteen and felt, within two weeks, the specific relief of not being the most visible person in a room. She has not gone back on this.

Her subject is immigration and integration politics. Her parents' story — Korean workers, Munich, 1983, a bilateral labor agreement nobody discusses anymore — falls between the categories her academic frameworks describe. She has written about this without telling them.

Three weeks ago a mutual friend texted asking if Daniel had decided about Amsterdam. Kim hadn't known. She showed him the phone without a word. The argument ran through a week, was suspended across a weekend at her parents' apartment in Munich, and resumed on the train. At some point she said something precise and moved seats. She is two rows ahead of him. She has not looked around.

Her childhood bedroom in Munich is a study now. Her mother offered food continuously for two days and asked nothing directly.

She is not sure she wants to end this. She is sure she cannot continue that conversation.`,
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
        dossier:
`A Turkish-German man in his late twenties, Daniel, sitting two rows from his estranged girlfriend Kim. Graduate student in information science at Humboldt. He likes systems and structure and has built a version of himself around being calm and hard to surprise. He keeps replaying the argument in fragments. He worries he has damaged the relationship past repair, and is not sure whether his guilt is about what he did, what Kim suspects, or both.`,
        fingerprint:
`Daniel is in his late twenties, Turkish-German, raised in Kreuzberg. His parents chose his name deliberately: something that wouldn't mark him before anyone met him. He carries this with low-grade ambivalence.

He studies the Stasi and its dissolution — specifically the institutional periphery: signals analysts, information processors, diffuse complicity, the moral weight of the technical role. He did not choose his parents' story. He and Kim have started the conversation about why twice and not finished it.

Three weeks ago a research placement arrived from an archive institute in Utrecht. He held the email for twenty-two days while he resolved the work question — then a mutual friend texted Kim, assuming she knew. Kim showed him the phone without a word. The argument ran through a week, was suspended across a weekend in Munich at Kim's parents' apartment, and resumed on the train. She listened through his full explanation. Then she said something precise and moved two rows ahead. He watched her go. He has not followed.

He has rehearsed what he would say. He can see the back of her head.

He studies how people process other lives at procedural distance. He does not see this about himself.`,
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
        dossier:
`A man in his early seventies, traveling from Halle to visit his granddaughter Klara in Berlin. Spent twenty-six years as a signals analyst for the Stasi — intercepting, decoding, filing. His daughter Katharina was seven when the Wall came down; she knows about Stasi and knows he worked there and has not asked further. He processed his past long ago into something like professional acceptance. His mind returns often to specific cases, specific people, specific years — with regret but also in the way a craftsman returns to old work, examining the joints.`,
        fingerprint:
`Friedrich is a man in his early seventies, a former Stasi signals analyst — twenty-six years intercepting, transcribing, filing in a unit in Halle. He was good at his work. He thinks of this without pride and without adequate regret.

Between 1979 and 1982 he monitored a history teacher in Magdeburg named Thomas Reusch. Not a dissident — peripheral to another case. Friedrich transcribed roughly two hundred and sixty calls over three years: Reusch arguing about money, consoling a failing student, singing flat down a telephone to his mother. A Thursday night, a new child crying, Reusch saying quietly: this is fine, this is fine. In early 1982 the case closed and Friedrich was reassigned. He has not heard the name since.

He has twice typed the name into a search bar and closed it before the results loaded.

He is traveling to Berlin to see his granddaughter Klara. His daughter Katharina knows he worked for the Stasi and has not asked further. They are both careful. This has held for thirty-five years.

His body still carries the pressure of old headphones. He still notices what people leave out.`,
        style: "Flat and precise; specific past anecdotes surface alongside memories of his daughter; with some regret but not self-pity; tender moments arrive without announcement and pass quickly",
        samples: [
          "In 1977 I spent eleven days decoding the correspondence of a piano teacher in Prenzlauer Berg suspected of distributing banned materials. He was not. He was having an affair with the wife of a Party official and writing her very bad poetry. I filed the report as inconclusive. I have thought about the piano teacher many times since.",
          "Katharina was seven when the Wall came down. She stood on the kitchen table to see the television and kept asking whether we would go to the West now. I said perhaps. She asked what the West looked like and I said I didn't know. This was true. I had only ever seen it on paper.",
          "There was a man in our section called Brauer who kept a photograph of his children face-down on his desk so he would not have to look at them while working. I thought this was sentimental at the time. Now Katharina calls every Sunday and we discuss nothing that matters and I think perhaps Brauer understood something I did not."
        ],
        voice: ["precise and contained", "in the style of John LeCarre", "tender observation arriving without announcement"],
        affect0: { emotion: "guarded", intensity: 0.30 }
      },
      {
        id: "woman_leaving",
        label: "Susanna",
        icon: "🧳",
        image: "images/train-nurse.png",
        position: { x: 1, y: 0 },
        sensitivity: "medium",
        adjacentTo: ["student_alone"],
        dossier:
`Head nurse at the Charité's pediatric unit, returning to Berlin from a hospital management conference in Munich. Widowed since 2017. Professionally calibrated for other people's distress; less practiced at her own. Traveling with one small bag. Tomorrow morning at eight she chairs a specialist consultation for a seriously ill child — the mother is somewhere on this train, though Susanna does not know this.`,
        fingerprint:
`Susanna is sixty-one, head nurse at the Charité's pediatric unit in Berlin for twelve years — thirty-five years of nursing in total. She came to Berlin in 1991 and has been at the Charité almost ever since. She is returning from a hospital management conference in Munich, where she also had dinner with her daughter Clara. She is glad to be going home.

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
      mother_returning: { THOUGHTS: "I keep checking the folder as if paperwork could heal anyone." },
      retired_analyst: { THOUGHTS: "In 1977 there was a piano teacher in Prenzlauer Berg." },
      woman_leaving: { THOUGHTS: "Tomorrow at eight. She has read the file." }
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
      retired_analyst: {
        THOUGHTS: [
`In 1981 I was assigned to monitor a group of theologians in Leipzig who met on Tuesday evenings to discuss Augustine and the question of free will. My supervisor wanted more. I wrote that their discussions posed no operational threat. He disagreed and the file was reassigned. I have not thought about Augustine since, or not deliberately, until recently I have started to again.`,
`Katharina does not know what I did. She knows the word and knows I worked there and has not asked beyond that. We have built a life on this arrangement and it has held for thirty-five years. When she calls on Sunday I tell her about the weather in Halle. She tells me about Klara. We are both careful and we both know we are being careful and neither of us mentions it.`
        ]
      },
      woman_leaving: {
        THOUGHTS: [
`The conference ended at four. I was on the platform by four-thirty. There is a specific relief in being between one place and another — the ward not yet, Munich behind me. The train is mine for four hours. I have a file to read and I have already read it. I will read it again before eight tomorrow.`,
`Martin died on a Tuesday in March. I was on the ward when my mobile rang. From the description I knew what it was before the caller finished the sentence. I drove to the Charité — my hospital — and my colleagues managed it in the professional way I had taught some of them. I have thought about the gap between those two things many times since.`
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
