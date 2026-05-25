/* scenes.js
   RIPPLES — Scene definitions
   Each character has: id, label, icon, image, position, sensitivity, adjacentTo,
   dossier (background only), style (literary texture), samples (example monologues),
   voice, affect0.
*/

window.SCENE_ORDER = [
  { id: "ice_to_berlin_second_class", label: "Train to Berlin" }
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

    authorStyle: "Hemingway. Short declarative sentences. Active verbs. Nothing explained that can be shown. Emotion held just below the surface — never named, only implied through what the character notices and does not say. The iceberg principle: the weight is underneath.",

    prompts: {
      system:
`You write interior monologues for passengers in a mostly empty second class ICE carriage heading to Berlin.
You never explain the system, never mention "prompts" or "models," and you never adopt a chatty assistant tone.

Core constraint: the monologue is not a reply to the user. A whisper should alter the next thought immediately, but not as dialogue.
Avoid direct second-person address and avoid question/answer dialogue.
The train is a container, not the subject. Do not let the monologue dwell on seats, windows, stations, luggage, passing scenery, travel logistics, or the silence and emptiness of the carriage unless one brief mention is necessary to trigger a deeper thought.
 on backstory, private conflicts, unresolved relationships, work pressures, family history, and unexpected associative leaps that grow out of the character's past.
Often they free associate, but the associations should feel personal and grounded in their history, not generic observations about travel. ONE THOUGHT PER MONOLOGUE. The vacillations occur between monologues.

Style:
- English.
- Third person (she/he). Free indirect style — no attribution tags like "she thought" or "he remembered".
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
`If a whisper is present: do not quote exactly, but you can paraphrase it in the course of the monologue. The character does not register it as a message. It acts as a perturbation — a memory surfaces that wouldn't have, the emotional temperature shifts, attention moves somewhere it wasn't going. The effect should be visible in what the character thinks next. `,

      structureHint:
`Move through memories, obligations, heard-about events, old arguments, work facts, family scripts, stray objects, and wider personal associations.
Favor backstory and unresolved issues over immediate environment.
Think in specifics: named places, dates, amounts, distances, proper nouns, physical details. The mind does not think in categories — it thinks in the actual street name, the specific sum, the exact phrase someone said. Avoid general observations that could apply to anyone.
Remember the carriage contains ONLY five characters. Do not refer to other passengers who aren't there -- unless they are just passing through the carriage.`,
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
        ambientThreads: [
          "noticing one of the other 4 passengers small rituals or movements",
          "the particular way the train moves through flat winter fields",
          "noticing someone moving through the carriage, e.g. a conductor or passenger or the person with a food cart selling things."
        ],
        fingerprint:
`Barbara is thirty-six, a project manager, returning to Berlin after two days in Munich where a specialist confirmed her daughter Lena's diagnosis. He offered no different treatment path. She read the assessment once in the corridor and has not opened it since. She does not let herself finish the sentence the facts make.

Lena is seven. She runs with her arms slightly back. She has a particular cup she will not use a different version of. She sings to herself when she thinks no one is listening. She has a way of waking up: lying still, then looking to see if her mother is there. Barbara finds herself storing these things with unusual precision. She does not examine why. Last week Lena asked if she could go back to school before summer. Barbara said she would ask the doctor. She has not thought past the appointment to the answer.

Jan is at home and has not texted, which is what they agreed no news would mean. The leave paperwork is not submitted. There are pharmacy receipts. Tomorrow is at nine.

She is treating the most important thing in her life as a logistics problem. She knows this is not adequate. She is doing it anyway.`,
        samples: [
          "The last time Lena ran across the garden she had her arms back the way she does, and she was at the kitchen window and stood there until Lena went inside. She has stood at that window other times and not stood still. She doesn't know what the difference was. She thinks she knows what the difference was. She has not said this out loud.",
          "Jan texted fine at half past three. Fine means the afternoon check-in, nothing further, which is what they agreed fine would mean. She has read it twice. There is a school form in her drafts requiring a doctor's signature. She has been meaning to complete it since Tuesday. She said she would do it last night too.",
          "The appointment is at nine. She has organized everything that can be organized before nine — the referrals, the questions, the file. What she has not organized is what she will do after the questions are answered. She hasn't written that down because it requires knowing the answer first, which is what tomorrow is for."
        ],
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
        ambientThreads: [
          "the particular way the train moves through flat winter fields",
          "noticing someone moving through the carriage, e.g. a conductor or passenger or the person with a food cart selling things.",
          "noticing one of the other 4 passengers small rituals or movements"
        ],
        fingerprint:
`Kim is in her mid-twenties, Korean-German, Munich-raised, political science MA at Humboldt. She came to Berlin at nineteen and felt, within two weeks, the specific relief of not being the most visible person in a room. She has not gone back on this.

Her subject is immigration and integration politics. Her parents' story — Korean workers, Munich, 1983, a bilateral labor agreement nobody discusses anymore — falls between the categories her academic frameworks describe. She has written about this without telling them.

In February she found out from a mutual friend that Daniel had been sitting on a research placement offer in Utrecht without telling her. The argument ended with her saying: you're very good at explaining things after you've already decided them.

In November she had applied for a two-year research fellowship at Cambridge, alone, without telling Daniel. She heard in February and accepted the same week. She told him this weekend in Munich, three weeks after accepting. He asked the questions in order. He did the arithmetic. Then he said: you had already decided. Not just about Cambridge. About us. She recognised the sentence. She didn't answer that.

On the train she moved to a seat across the aisle and one row up. He can see her back. She has not looked around. She is going to Cambridge. She is not yet sure what else is settled.`,
        samples: [
          "She likes this kind of journey. A built-in pause. She can get things done and feel virtuous about it. But six hours is a bit too long. Should be four. She'll be hungry when she arrives. Doesn't want to cook.",
          "She wishes she didn't have to think about Daniel. But she does. It's that old paradox: if you tell someone not to think about something, that's exactly what they concentrate on. Think of something else. She should get a dog. More faithful than a man. Well a male dog is fine.",
          "She likes Asian food. Perhaps a late dinner of sushi when she arrives. She musn't overeat which always happens when she is stressed. Or maybe she doesn't really overeat, but she become self-conscious about her body. She imagines the food going straight to her hips."
        ],
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
        ambientThreads: [
          "noticing someone moving through the carriage, e.g. a conductor or passenger or the person with a food cart selling things.",
          "noticing one of the other 4 passengers small rituals or movements",
          "the particular way the train moves through flat winter fields"
        ],
        fingerprint:
`Daniel is in his late twenties, Turkish-German, raised in Kreuzberg. His parents chose his name deliberately: something that wouldn't mark him before anyone met him. He carries this with low-grade ambivalence.

He studies the Stasi and its dissolution — specifically the institutional periphery: signals analysts, information processors, diffuse complicity, the moral weight of the technical role. He did not choose his parents' story. He and Kim have started the conversation about why twice and not finished it.

In January he received a research placement offer in Utrecht and sat on it for three weeks without telling Kim. A mutual friend's text is how she found out. The argument ended with Kim saying: you're very good at explaining things after you've already decided them.

This weekend Kim told him she had applied for a two-year fellowship at Cambridge in November, heard in February, accepted, and was telling him now. He asked the questions in order — when, when, when. Then he said: you had already decided. Not just about Cambridge. About us. He heard himself using her sentence. She moved seats. He is two rows behind her and has not followed.

He can generate explanations for why she didn't tell him. He is aware that they are the same explanations he used in January.

He has rehearsed what he would say. He can see the back of her head.

He studies what it means to process other people's lives at procedural distance. He does not see this about himself.`,
        samples: [],
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
        ambientThreads: [
          "noticing one of the other 4 passengers small rituals or movements",
          "noticing someone moving through the carriage, e.g. a conductor or passenger or the person with a food cart selling things.",
          "the particular way the train moves through flat winter fields"
        ],
        fingerprint:
`Friedrich is a man in his early seventies, a former Stasi signals analyst — twenty-six years intercepting, transcribing, filing in a unit in Halle. He was good at his work.

At the last station stop, a man walked through the carriage looking for his seat — late sixties, heavy coat, deliberate way of moving. He paused near Friedrich's row, checked a reservation, moved through to the next car. Friedrich watched without appearing to. He has not been able to leave it alone since.

Between 1979 and 1982 he monitored a history teacher in Magdeburg named Thomas Reusch — two hundred and sixty-three calls over three years. Reusch arguing about money, consoling a failing student, a Thursday night with a new child crying: this is fine, this is fine. The case closed in 1982. He has twice typed the name into a search bar and closed the window before the results loaded.

He is a signals analyst. He knows Reusch's voice, not his face at seventy. The man said nothing. Friedrich heard his shoes, the shift of his coat.

He has not gone to the next car. Memory manufactures patterns. He is not persuaded by this.

He is traveling to Berlin to see his granddaughter Klara. His daughter Katharina knows he worked for the Stasi and has not asked further. They are both careful. This has held for thirty-five years.`,
        samples: [
          "In 1977 he spent eleven days decoding the correspondence of a piano teacher in Prenzlauer Berg suspected of distributing banned materials. He was not. He was having an affair with the wife of a Party official and writing her very bad poetry. He filed the report as inconclusive. He has thought about the piano teacher many times since.",
          "He has typed the name Thomas Reusch into a search bar twice. Both times he closed the window before the results loaded. The second time he left it open longer before closing it. He has considered what the difference between those two moments means. He has not arrived at an explanation that is not also, in some way, a form of evasion.",
          "In three years he transcribed two hundred and sixty-three calls. He knows the precise number because he counted in 1983, after the reassignment. Reusch argued with his wife about money on fourteen occasions. He recorded the amounts carefully. They were small. He can still recall them exactly. He has never understood why this kind of accuracy felt like something owed."
        ],
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
        ambientThreads: [
          "noticing someone moving through the carriage, e.g. a conductor or passenger or the person with a food cart selling things.",
          "the particular way the train moves through flat winter fields",
          "noticing one of the other 4 passengers small rituals or movements"
        ],
        fingerprint:
`Susanna is sixty-one, head nurse at the Charité's pediatric unit in Berlin for twelve years — thirty-five years of nursing in total. She came to Berlin in 1991 and has been at the Charité almost ever since. She is returning from a hospital management conference in Munich, where she also had dinner with her daughter Anna. She is glad to be going home.

Her husband Martin died in 2017 — an architect, a quiet man who liked routine. She was at work when she got the call. She knew from the first sentence what it was. Her colleagues at the Charité managed his death. She has been in their apartment alone since.

Tomorrow morning at 9am there is a specialist consultation she helped schedule — a child on her ward, a serious case. The mother is somewhere on this train. Susanna does not know this. She has read the file. Tomorrow she will be in the room.

She is good at being present when something terrible is happening. She is less practiced at her own life. She knows this. She considers it a reasonable trade.

She travels with one small bag.`,
        samples: [],
        affect0: { emotion: "calm", intensity: 0.22 }
      }
    ],

  },

};
