/* scenes.js
   Hardwired content library for World Jockey (Wings-of-Desire mode).
   This file is intentionally "data-only" so you can swap it out later.
*/

(() => {
  "use strict";

  // Public globals consumed by gpt.js
  window.SCENE_ORDER = [
    { id: "berlin_library", label: "BERLIN_LIBRARY" },
    { id: "ubahn_platform", label: "UBAHN_PLATFORM" }
  ];

  window.SCENES = {
    berlin_library: {
      meta: {
        id: "berlin_library",
        label: "BERLIN_LIBRARY",
        title: "Berlin Library — Winter Afternoon",
        cols: 8,
        rows: 6,
        baseline:
          "A reading room in winter. Coats steam faintly near radiators that never quite win. Pages turn with the soft friction of paper against impatience. Outside: gray light, tramlines, the city holding its breath."
      },

      // Characters replace entities. UI uses: id, label, icon, position, adjacentTo.
      // Engine may also use: location, innerWeather, motifs, sensitivity.
      characters: [
        {
          id: "woman_reading",
          label: "The Woman in the Reading Room",
          icon: "📚",
          position: { x: 2, y: 1 },
          adjacentTo: ["librarian", "student_cold", "old_man_coat"],
          location: "reading room",
          innerWeather: "controlled, tired, luminous",
          motifs: ["paper dust", "ink smell", "unreturned letter", "cold fingers", "a name half-swallowed"],
          sensitivity: "high"
        },
        {
          id: "librarian",
          label: "The Librarian",
          icon: "🗂️",
          position: { x: 4, y: 2 },
          adjacentTo: ["woman_reading", "man_waiting", "child_corner"],
          location: "front desk",
          innerWeather: "watchful, worn, quietly kind",
          motifs: ["stamp ink", "catalog cards", "whispered rules", "the weight of keys", "the slow clock"],
          sensitivity: "medium"
        },
        {
          id: "student_cold",
          label: "The Student with Red Ears",
          icon: "🎒",
          position: { x: 1, y: 3 },
          adjacentTo: ["woman_reading", "old_man_coat", "child_corner"],
          location: "periodicals",
          innerWeather: "restless, embarrassed, alert",
          motifs: ["red ears", "wet scarf", "margin notes", "future exams", "someone else’s laughter"],
          sensitivity: "medium"
        },
        {
          id: "old_man_coat",
          label: "The Old Man with a Heavy Coat",
          icon: "🧥",
          position: { x: 5, y: 1 },
          adjacentTo: ["woman_reading", "student_cold", "man_waiting"],
          location: "near window",
          innerWeather: "slow, dignified, brittle",
          motifs: ["heavy coat", "bread crust", "war photos", "aching knees", "a city that changed names"],
          sensitivity: "high"
        },
        {
          id: "man_waiting",
          label: "The Man Waiting for Someone",
          icon: "⏳",
          position: { x: 6, y: 4 },
          adjacentTo: ["librarian", "old_man_coat"],
          location: "entrance benches",
          innerWeather: "held-in, hopeful, bruised",
          motifs: ["door draft", "glove leather", "a missed appointment", "a phone that won’t ring", "polite smiling"],
          sensitivity: "high"
        },
        {
          id: "child_corner",
          label: "The Child in the Corner",
          icon: "🧸",
          position: { x: 2, y: 5 },
          adjacentTo: ["librarian", "student_cold"],
          location: "children’s shelves",
          innerWeather: "observant, sealed, imaginative",
          motifs: ["paper animals", "shoe scuff", "a parent’s coat hem", "quiet cartoons", "counting tiles"],
          sensitivity: "low"
        }
      ],

      // Seeds shown in the SEEDS panel (short, previewable)
      seeds: {
        woman_reading: {
          THOUGHTS: "I try to read, but the sentences keep turning into my life.",
          FEARS: "I’m afraid the smallest mistake will become the whole story.",
          LONGING: "I want to be touched by ordinary kindness and not flinch."
        },
        librarian: {
          THOUGHTS: "The building remembers every borrowed thing, even the people.",
          FEARS: "What if my patience is only another kind of fatigue?",
          LONGING: "I want the room to soften—just once—without anyone asking."
        },
        student_cold: {
          THOUGHTS: "I outline the world in the margins so it can’t surprise me.",
          FEARS: "I’m scared everyone can see I don’t know what I’m doing.",
          LONGING: "I want to arrive somewhere and feel it count as ‘home.’"
        },
        old_man_coat: {
          THOUGHTS: "I measure time by what the city forgets to say out loud.",
          FEARS: "I fear becoming an object: coat, cane, silence, no name.",
          LONGING: "I want one clear afternoon without the past leaning in."
        },
        man_waiting: {
          THOUGHTS: "Waiting is a craft: you practice being casual while you ache.",
          FEARS: "I fear the door will open and it will be someone else forever.",
          LONGING: "I want the world to answer me in a human voice."
        },
        child_corner: {
          THOUGHTS: "The shelves are cities and the carpet is an ocean.",
          FEARS: "I’m afraid of the loud grown-up world leaking in.",
          LONGING: "I want the missing person to come back from wherever."
        }
      },

      // Hardwired monologues: 2 variants per activation per character (enough to test interface)
      monologues: {
        woman_reading: {
          THOUGHTS: [
            "I try to read, but the sentences keep turning into my life. The paper has a faint dust smell, like the inside of a drawer that stays closed for years. I underline nothing. I don’t want evidence. The room is full of quiet labor—people working at being calm. Somewhere a chair complains softly. I think about how a city can be made of rules and still feel like weather. My fingers are cold and I keep rubbing the pad of my thumb against the page as if warmth could be printed there. A name comes up in me and I swallow it. I tell myself I am only here for facts, for order, for the comfort of numbered shelves. But the more I look, the more I see that every book is an alibi: proof that someone else also felt too much and survived by arranging it into lines.",
            "The light in the reading room is gray but disciplined. It doesn’t flatter anything; it simply insists on being present. I watch dust drift in it and think: even what is weightless has a trajectory. I came here to disappear into a subject, into a chapter, into other people’s careful explanations. Instead, I keep returning to the same private questions—why I didn’t write back, why I let a conversation end the way it did, why silence can feel like punishment even when you choose it. I listen to pages turning. It’s a sound like restrained applause. I imagine every person here carrying a small sealed envelope in their chest, addressed to nobody, and still waiting to be opened."
          ],
          FEARS: [
            "I’m afraid the smallest mistake will become the whole story. A wrong word. A delayed reply. A glance held too long. I feel it in my stomach first, a tightening that pretends to be hunger. My hands tremble slightly when I turn a page and I hide it by moving slowly. I look up and catch myself thinking that everyone can see through me, as if my thoughts are written in the air like breath. The radiator clicks and it sounds like a verdict. I tell myself: be normal, be quiet, take up less space. But fear has its own gravity. It pulls every detail toward it—the scuffed floor, the stamp ink on the librarian’s fingers, the draft at the door—until the room feels like a test I didn’t study for.",
            "The fear is not dramatic. It’s administrative. It’s the fear of forms that can’t be corrected, of a file that won’t be reopened once it’s closed. I imagine my life as a stack of papers with one page missing and I can’t remember where I left it. The room is so quiet that the smallest sound becomes guilt. I catch myself holding my breath. I think about calling someone and I can’t. I think about apologizing and I don’t know for what. I watch other people’s faces and wonder what they are hiding so skillfully. It occurs to me that maybe what I’m afraid of is not punishment but exposure—being seen accurately, without my own edits."
          ],
          LONGING: [
            "I want to be touched by ordinary kindness and not flinch. Not romance, not rescue—just a simple hand on the shoulder that doesn’t ask anything. I watch a person across the room adjust their scarf and the gesture looks like care. I envy the ease of it. My mind keeps returning to small rooms from childhood: a kitchen with warm light, a chair that belonged to someone reliable. The smell of paper dust becomes suddenly comforting, like proof that time can accumulate without meaning harm. I imagine writing a letter that begins, I’m sorry I vanished, and ends, I’m here. I don’t send it. But even the thought of it loosens something in my chest, like a window unlatched.",
            "Longing is an ache with good manners. It waits until nobody is watching. I sit here among shelves of other people’s endurance and I want to belong to the world as easily as my coat belongs to me. I want conversation that doesn’t feel like strategy. I want to say my name without it sounding like a confession. Outside, the city keeps moving—trams, boots, gray breath—and inside this room I want a single clear human moment: someone meeting my eyes and not turning away, as if my tiredness were understandable, as if I didn’t have to earn tenderness by being exceptional."
          ]
        },

        librarian: {
          THOUGHTS: [
            "The building remembers every borrowed thing, even the people. I can tell who has been here by the way they step—quick and guilty, or slow like they’re carrying weather inside them. My keys pull on my pocket as if they want to return to the lock. The clock above the desk moves like a patient animal. I stamp due dates and feel the small violence of it: time assigned, time reclaimed. Sometimes I imagine the catalog cards are a second city, quieter than the one outside, where everything has an index and nothing is lost—except the reasons people came in. I watch them read. It’s the most intimate public act I know.",
            "I spend my day translating need into procedure. A whisper becomes a request; a request becomes a rule. I try not to notice how often people touch their faces here, as if checking they’re still present. The room smells of paper and wool. I listen to chairs, to pages, to the sighs people think are silent. When a book returns late, I don’t care about the date. I care about the fact that someone kept it close, as if it were a talisman. I wonder if the city would be kinder if we treated each other like library books: handled carefully, forgiven when overdue."
          ],
          FEARS: [
            "What if my patience is only another kind of fatigue? I can’t tell anymore. Some days I feel like a lamp left on in an empty room, doing my job faithfully, lighting nothing. I watch people avoid each other’s eyes and I feel an old fear: that we are all becoming experts at solitude. A child drops a book and I flinch, not at the sound, but at what it means—how easily attention breaks. I think about my own life outside this desk and it feels like a corridor with too many doors, all of them half-open, none of them inviting.",
            "I fear the rules will outlast the reasons. That one day the gestures will remain—stamp, shush, return—while the human need for quiet disappears, replaced by noise that can’t be turned down. Sometimes someone asks me where a book is and I feel a flash of shame because I don’t know. It’s a small ignorance but it opens onto a bigger one: I don’t know what anyone will do with the pages they take home. I don’t know what they are trying to repair in themselves. I only know how to keep order, and order is not the same thing as care."
          ],
          LONGING: [
            "I want the room to soften—just once—without anyone asking. I want to see one person help another without embarrassment, the way strangers used to in stories. I want a warmth that isn’t mechanical, not the radiator, not the forced cheer of holidays. Sometimes I imagine a moment when the whole library exhales together, as if permission were granted to be human. I look at the heavy coats, the wet scarves, the tired hands. I want to take the ache from them the way you take a sharp object from a child: gently, without scolding.",
            "There are days I long for a simple conversation that doesn’t end in a transaction. Not ‘Do you have this title?’ but ‘How are you surviving the week?’ I want someone to notice my hands are ink-stained and not treat it as trivial. I want to be forgiven for being quiet. The city outside is all momentum and edges. Here, among shelves, we practice being still. I sometimes think stillness is the closest thing we have to mercy."
          ]
        },

        student_cold: {
          THOUGHTS: [
            "I outline the world in the margins so it can’t surprise me. It’s a habit: headings, subheadings, little arrows that pretend life is a clean argument. My ears are red from the cold and I keep rubbing them, embarrassed, as if anyone cares. I read a paragraph three times and each time it says something different. That’s the problem with text: it keeps changing depending on who you are when you meet it. I take notes quickly, like speed will save me. But my mind keeps drifting to the sound of trams outside, to the idea that other people are living without footnotes, just walking into their futures without citations.",
            "The library makes me feel both safe and accused. The silence is clean enough that my thoughts look messy by comparison. I stare at a sentence and think: I should understand this. I should be the kind of person for whom understanding is easy. Instead, I keep noticing small things—wet scarf fibers, paper cuts, the way light rests on the table—like my attention refuses to stay obedient. I write in the margins anyway. I tell myself it’s thinking. Maybe it’s just panic that learned to look scholarly."
          ],
          FEARS: [
            "I’m scared everyone can see I don’t know what I’m doing. It’s not just the subject. It’s everything: how to stand, how to speak, how to look like I belong in this city and not like I arrived yesterday. I hear my own breathing too loud. I imagine the librarian’s eyes on the back of my neck, measuring my incompetence. When someone turns a page sharply, it feels like a reprimand. I keep checking the clock, as if time could be negotiated. Fear makes me want to disappear and also makes me want to be caught, just so the waiting ends.",
            "The fear arrives as a blush before it becomes a thought. I can feel heat in my face and I don’t even know why. Maybe I’m afraid of failing. Maybe I’m afraid of succeeding and then being expected to keep succeeding forever. I look at older people and I think: they survived something, they have evidence. I have only potential, which is another way of saying nothing. My notes look childish. My handwriting betrays me. I press harder with the pen, as if intensity can manufacture authority."
          ],
          LONGING: [
            "I want to arrive somewhere and feel it count as ‘home.’ Not a room I rent, not a chair I borrow—home as a feeling that doesn’t have to be defended. I watch a child in the corner build a small world from books and I envy the certainty of play. I want a person to say my name like it matters, not like a roll call. I want warmth that doesn’t come from pretending. Outside, Berlin is cold in a way that feels philosophical. Inside, I’m cold in a way that feels personal.",
            "Sometimes I long for a teacher who doesn’t humiliate me with kindness. Someone who can see my confusion and not translate it into judgment. I long for a day when my future exams are not the sun I orbit. I keep thinking about a kitchen I haven’t been in for years, the sound of a kettle, the simple economy of being cared for. It’s embarrassing to want this much. But wanting is what keeps my body from turning into a machine."
          ]
        },

        old_man_coat: {
          THOUGHTS: [
            "I measure time by what the city forgets to say out loud. Names change, borders move, the buildings remain and pretend they were always innocent. My coat is too heavy but it keeps me upright, like a promise I made long ago. I sit by the window and watch the light fail politely. In the glass I see my own face overlaying the street, and it looks like an old photograph trying to stay relevant. I think about bread crusts, about the way hunger teaches you to respect small things. I think about books: how they outlast the hands that held them, how they keep talking when we can’t.",
            "The library is one of the few places where age feels like an advantage. Silence does not hurry me. I read slowly and the words come into focus like a street after snow. I think about the young—how they look as if time is theirs by right. I don’t blame them. I used to feel that too. My knees ache in a way that has no metaphysics, only weather and history. Still, I like being among books. They do not ask me to explain myself."
          ],
          FEARS: [
            "I fear becoming an object: coat, cane, silence, no name. People look past you when you are old, not cruelly—efficiently. As if the world is editing for speed. I feel the draft at the door and it reminds me of corridors that smelled of disinfectant and decision. I hear a page turn and I think: that is what will happen to me. One day someone will close the file. The city will keep moving. My fears are ordinary, but they feel large because I carry them alone.",
            "There is a fear that comes with survival: the fear that you were spared by accident, and that your life is a clerical error that will be corrected. I watch the student with red ears and I want to warn him, and I also want to protect him from my own bitterness. The coat on my shoulders is heavy with more than cloth. Sometimes I imagine taking it off and leaving it on a chair, walking out lighter. But the fear follows. It is not in the coat. It is in me."
          ],
          LONGING: [
            "I want one clear afternoon without the past leaning in. Just a table, a book, a quiet that isn’t haunted. I want to look at the city and see only what is present: wet tramlines, gray sky, someone laughing. I want my body to stop reminding me of history with every step. I want to be spoken to as if I still have a future, even if it’s small. A future can be small. A cup of coffee. A conversation. A good sentence. That would be enough.",
            "Longing at my age is mostly a longing for ease. Ease in the joints, ease in the heart. I long for my wife’s hands, not in a romantic way, in a practical way—the way hands help you return to yourself. I long for the city to be less sharp, for winter to stop proving its point. I sit among books because they are patient companions. They do not pity me. They simply remain."
          ]
        },

        man_waiting: {
          THOUGHTS: [
            "Waiting is a craft: you practice being casual while you ache. I sit near the entrance benches so I can see the door without staring at it. The draft comes in each time it opens, a small punishment. I keep checking my watch and pretending it’s for the time, not for hope. Around me, people read like they have permission to live their lives privately. I envy that. My mind rehearses explanations—traffic, illness, misunderstanding—because explanations are softer than rejection. I listen for footsteps that will be the right rhythm. Every wrong rhythm feels like a verdict.",
            "I tell myself that patience is dignity. That I am a good person for waiting. But the longer I sit here, the more I feel like a prop in someone else’s scene. The librarian stamps books with calm authority. The old man looks out the window as if he has already forgiven the world. I try to borrow some of their steadiness. I think about how many conversations begin with ‘Sorry I’m late’ and end with nothing. I think about the door. I think about the door. I think about the door."
          ],
          FEARS: [
            "I fear the door will open and it will be someone else forever. Not a stranger, not an enemy—just the wrong person, carrying the wrong future. The fear is precise: it has a shape, a timetable. It sits in my throat like a coin I can’t swallow. I keep smiling at nobody because I don’t know what to do with my face. The cold air from outside makes my eyes water and I’m grateful for the excuse. I imagine the person I’m waiting for choosing not to come and I can’t decide which hurts more: the choice or the silence.",
            "There is a fear that I am always the one who waits. That my role is to be the patient shadow of other people’s decisions. I hate that thought because it feels true. I remember times I left someone waiting and I feel a flash of shame, as if punishment is finally arriving. The library is polite about suffering—it keeps it quiet. That makes it worse. I want the fear to be loud so it can end. Instead it stays refined, like a well-dressed illness."
          ],
          LONGING: [
            "I want the world to answer me in a human voice. Not the voice of announcements, not the voice of rules, not the voice in my head that keeps negotiating with disappointment. I want a person to come through the door and look at me as if I’m real. I want to stop performing indifference. I want to feel chosen without having to ask for it. I think about writing a note: I waited, I tried, I’m tired. But I don’t want to be dramatic. I want to be held in the simple way people hold each other when they finally arrive.",
            "Longing makes me generous and dangerous at the same time. I imagine an apology that fixes everything, a small laugh that resets the day. I imagine warmth, not from radiators but from proximity. I imagine walking out together into the gray Berlin afternoon as if the city were less heavy. I know this is fantasy. But fantasy is what keeps my spine straight on this bench. If the person never comes, I want at least to have believed in them cleanly, without bitterness."
          ]
        },

        child_corner: {
          THOUGHTS: [
            "The shelves are cities and the carpet is an ocean. I can make a whole country from picture books if I stack them right. Grown-ups walk like they’re carrying invisible bags. They don’t see the places between things. I count the tiles. I count again. The numbers behave. That’s why I like them. I hear the librarian’s keys and it sounds like a small animal. I think about my own shoes and how they scuff the floor, leaving a mark that isn’t important but proves I was here.",
            "I don’t read the words yet the way grown-ups do. I read the pictures. The pictures are honest. A bear is a bear. A house is a house. In the big room, the grown-ups look at paper like it can save them. Maybe it can. I watch a student make angry marks in a notebook and I think: he is trying to build a bridge out of ink. I sit very still because stillness makes me invisible, and invisibility is sometimes the safest superpower."
          ],
          FEARS: [
            "I’m afraid of the loud grown-up world leaking in. I’m afraid of voices that suddenly get sharp. The library is quiet like a blanket. If it tears, I don’t know what happens. I look at the door and I imagine it swallowing people. I imagine my parent forgetting me for a second too long. I don’t cry because crying is noisy and noise makes you noticeable. I hold my breath the way you hold a small animal: gently, so it doesn’t run away.",
            "Sometimes fear is just a picture I can’t erase. I picture the wrong coat leaving without me. I picture footsteps that don’t stop. I picture a hand not reaching back. I try to fix it by counting tiles and making rules in my head: if I count to fifty, everything will be fine. I count anyway. The numbers are kind. They don’t lie. But the fear doesn’t listen to them. The fear listens to the door."
          ],
          LONGING: [
            "I want the missing person to come back from wherever. I don’t know where people go when they leave a room. It seems like they go into a story without me. I want a hand to find my shoulder, warm through fabric. I want a voice that says my name like it’s a good thing. I want to show someone the world I built from books and have them pretend it matters. Outside, the city is cold. Inside, I’m trying to make a small warm place that can’t be taken away.",
            "Longing feels like staring at a picture of summer in winter. I want a snack. I want a laugh. I want my parent’s coat hem right where it should be, close enough that I can touch it without moving. I want to go home, but I also want to stay here because here the air is softer. I don’t know how to choose. I just keep building my little country from books and hoping someone will visit it kindly."
          ]
        }
      },

      // Autoplay probabilities (engine can use these)
      ambientBehaviors: [
        { character: "woman_reading", activation: "THOUGHTS", probability: 0.20 },
        { character: "librarian", activation: "THOUGHTS", probability: 0.20 },
        { character: "student_cold", activation: "FEARS", probability: 0.20 },
        { character: "old_man_coat", activation: "LONGING", probability: 0.15 },
        { character: "man_waiting", activation: "FEARS", probability: 0.15 },
        { character: "child_corner", activation: "THOUGHTS", probability: 0.10 }
      ]
    },

    // A second scene stub so the dropdown works; we’ll expand later.
    ubahn_platform: {
      meta: {
        id: "ubahn_platform",
        label: "UBAHN_PLATFORM",
        title: "U-Bahn Platform — Draft and Fluorescent Light",
        cols: 8,
        rows: 6,
        baseline:
          "A platform under fluorescent light. Trains arrive like decisions. The air is metallic. People stand with practiced distance, each one surrounded by an invisible weather system."
      },
      characters: [
        {
          id: "platform_woman",
          label: "The Woman with the Plastic Bag",
          icon: "🛍️",
          position: { x: 2, y: 2 },
          adjacentTo: ["platform_man"],
          location: "platform",
          innerWeather: "guarded, practical",
          motifs: ["plastic bag", "advertising posters", "train wind", "coins in pocket"],
          sensitivity: "medium"
        },
        {
          id: "platform_man",
          label: "The Man Reading the Map",
          icon: "🗺️",
          position: { x: 5, y: 3 },
          adjacentTo: ["platform_woman"],
          location: "platform",
          innerWeather: "uncertain, focused",
          motifs: ["folded map", "wrong stop", "announcement voice", "shoe soles"],
          sensitivity: "medium"
        }
      ],
      seeds: {
        platform_woman: {
          THOUGHTS: "I carry what I need and pretend it isn’t heavy.",
          FEARS: "I’m afraid the train will take me somewhere I can’t undo.",
          LONGING: "I want one person to recognize me without asking."
        },
        platform_man: {
          THOUGHTS: "I study routes like they can explain a life.",
          FEARS: "I fear arriving and not being wanted there.",
          LONGING: "I want a direction that feels like forgiveness."
        }
      },
      monologues: {
        platform_woman: {
          THOUGHTS: [
            "I carry what I need and pretend it isn’t heavy. The plastic bag cuts into my fingers through the glove. The posters on the wall promise happiness in bright colors, and the floor smells like metal and winter. I tell myself I’m only going one stop. Only one. But the trains come like they know my secret: that movement is how I cope. I watch people’s shoes. I watch the yellow line. I watch the map I don’t need. The platform is a place where nobody belongs, which makes it easier to stand here without shame.",
            "Fluorescent light makes everyone look honest in a cruel way. It reveals tiredness without compassion. I listen to the announcement voice and think how strange it is that the city speaks to us like children. Stand back. Mind the gap. As if the gap were only on the tracks. I shift the bag in my hand. I try to remember what it feels like to arrive somewhere and not immediately plan my exit."
          ],
          FEARS: [
            "I’m afraid the train will take me somewhere I can’t undo. Not physically—Berlin is only Berlin—but internally, as if one wrong direction could change the whole day into something I can’t recover. I rehearse what I’ll do if I miss my stop. I rehearse what I’ll do if someone follows me. The fear is a small animal in my chest. When the wind of the arriving train hits my face, I feel exposed, as if the air itself can read me.",
            "Sometimes fear is the sound before the train arrives: that distant rush, like trouble approaching. I grip the bag harder. My thoughts become narrow and practical—keys, ticket, distance. I tell myself I’m fine. I tell myself it’s just a platform. But the platform feels like a test of nerves, and I’m tired of being examined by ordinary life."
          ],
          LONGING: [
            "I want one person to recognize me without asking. Not my name, not my history—just the shape of me, the tiredness, the effort. The train doors open and faces appear briefly like photographs. I wonder if I have ever been that visible to someone. I want to step into the carriage and feel that I’m going toward something, not just away. The wind smells like oil and cold. Even so, I imagine warmth as a destination.",
            "Longing is the moment when the train is stopped and everything is possible for a breath. I look at the tracks and think about lines—how they promise direction. I want direction too. I want to stop bracing for impact. I want to take my seat and let the city carry me without my constant supervision, like being held."
          ]
        },
        platform_man: {
          THOUGHTS: [
            "I study routes like they can explain a life. The map folds wrong in my hands, refusing to become neat. The lines intersect and I imagine my own choices like that—points where I could have gone another way and didn’t. The platform is loud in a quiet way: shoes, breath, the buzz of light. I trace the route again. If I can find the right stop, maybe the day will behave.",
            "Maps are stories with the emotion removed. They show where you can go, not why you would want to. I look at station names and they feel like spells. Outside, the city moves above us, indifferent. Down here, we wait in a bright cave. I tell myself I like the clarity of systems. But my hands shake slightly, and the paper records it."
          ],
          FEARS: [
            "I fear arriving and not being wanted there. I fear being late and having to apologize with my whole body. The announcement voice says something I miss, and I feel a spike of panic like electricity. I reread the map as if rereading could change reality. The platform woman shifts her bag and I envy her certainty. My fear is a fog: it makes every sign harder to read.",
            "The fear is not that I’ll get lost. It’s that getting lost will reveal what I am: someone without a place that fits. The platform is full of people who know where they’re going. I pretend I’m one of them. I stand with my feet planted like confidence. Inside, I’m counting mistakes that haven’t happened yet."
          ],
          LONGING: [
            "I want a direction that feels like forgiveness. Not a correct route—something kinder. I want to step onto the train and feel that the city is not an argument I have to win. I want a seat where I can rest my head without guarding it. The map in my hands is thin and stubborn. I fold it anyway, slowly, as if gentleness might teach it to cooperate.",
            "Longing is the desire to stop translating everything into danger. I watch the tracks and think: a train arrives whether I deserve it or not. That seems like mercy. I want someone to say, ‘It’s fine, you’re early, you’re safe,’ without irony. I want to arrive and have my presence make sense."
          ]
        }
      },
      ambientBehaviors: [
        { character: "platform_man", activation: "THOUGHTS", probability: 0.45 },
        { character: "platform_woman", activation: "FEARS", probability: 0.35 },
        { character: "platform_woman", activation: "LONGING", probability: 0.20 }
      ]
    }
  };

})();