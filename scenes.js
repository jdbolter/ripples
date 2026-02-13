/* scenes.js
   RIPPLES — Wings of Desire (Library Reading Room)
   Photoreal image support via character.image
*/

window.SCENE_ORDER = [
  { id: "library_reading_room", label: "Reading Room — Afternoon" }
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

    characters: [

      {
        id: "old_man",
        label: "Old Man with Coat",
        icon: "🧥",
        image: "images/old_man_coat_bw.png",
        position: { x: 2, y: 1 },
        sensitivity: "medium",
        adjacentTo: ["young_woman", "student", "man_in_hat"]
      },

      {
        id: "young_woman",
        label: "Young Woman at Window",
        icon: "📖",
        image: "images/young_woman.png",
        position: { x: 4, y: 1 },
        sensitivity: "high",
        adjacentTo: ["old_man", "man_in_hat"]
      },

      {
        id: "student",
        label: "Student with Notes",
        icon: "✏️",
        image: "images/student.png",
        position: { x: 1, y: 2 },
        sensitivity: "medium",
        adjacentTo: ["old_man", "librarian"]
      },

      {
        id: "librarian",
        label: "Librarian at Desk",
        icon: "📚",
        image: "images/librarian.png",
        position: { x: 3, y: 3 },
        sensitivity: "low",
        adjacentTo: ["student", "man_in_hat"]
      },

      {
        id: "man_in_hat",
        label: "Man in Hat (Standing)",
        icon: "🧢",
        image: "images/man_in_hat.png",
        position: { x: 5, y: 2 },
        sensitivity: "medium",
        adjacentTo: ["old_man", "young_woman", "librarian"]
      }

    ],

    ambientBehaviors: [
      { character: "old_man", activation: "THOUGHTS", probability: 3 },
      { character: "young_woman", activation: "LONGING", probability: 2 },
      { character: "student", activation: "FEARS", probability: 2 },
      { character: "librarian", activation: "THOUGHTS", probability: 1 },
      { character: "man_in_hat", activation: "THOUGHTS", probability: 1 }
    ],

    seeds: {
      old_man: {
        THOUGHTS: "The print is smaller than it used to be.",
        FEARS: "What if I forget this page tomorrow?",
        LONGING: "I want one more year of clarity."
      }
    },

    monologues: {

      old_man: {

        THOUGHTS: [
`The words seem to arrive from a great distance now, as if they had to travel across years before reaching my eyes. I hold the book closer, not only to see, but to feel the weight of it, the quiet insistence that something still matters enough to be printed, bound, preserved. The coat around my shoulders carries the faint scent of winters I have already survived. I think about how many rooms like this I have sat in, how many arguments I have followed patiently across the page. Once, I read quickly, almost greedily. Now I read as one walks through a garden in late autumn, aware that each leaf is singular, that each step is deliberate. The mind does not move as swiftly, but it lingers more deeply. I am not certain whether this is loss or refinement. Perhaps both.`,

`The margins hold more than commentary; they hold time. Someone else once pressed a pencil into this paper, marking what struck them as necessary. I trace those faint lines and imagine the hand that made them—young, perhaps, or restless, or certain. I find myself in conversation not only with the author but with that unknown reader. There is comfort in this layered attention. Even now, when names sometimes evade me and days blur at the edges, the act of reading remains intact. It is a narrow bridge, but it holds. I think of all that has fallen away—ambition, urgency, the need to be correct. What remains is this: to follow a thought patiently to its end, and to recognize oneself, still capable of understanding, still capable of wonder.`,

`The room hums, though no one speaks. I feel part of that quiet mechanism, one figure among many, yet distinctly singular. The younger ones sit with straight backs and urgent eyes; they believe the future is something to be constructed. For me, it has become something to be interpreted. I do not seek revelation anymore. I seek continuity. The page before me is not dramatic, yet it steadies me. In the careful turning of paper, I measure my own persistence. I am not finished yet. The words have not withdrawn from me. They hesitate, perhaps, but they still consent to be read. And as long as they do, I will remain here, attentive, grateful for this small, durable clarity.`
        ],

        FEARS: [
`There are moments when the letters loosen and scatter, when I must blink twice to gather them again. In those instants I feel the ground tilt slightly, as if the certainty I once possessed were only provisional. I fear not the end itself, but the gradual dimming—the subtle erosion that leaves one aware yet unable to participate fully. What if I begin to nod at arguments I no longer grasp? What if I pretend to understand, to preserve the dignity of habit? The room would not notice. It would continue its soft respiration. Yet inside, something essential would have slipped out of reach. That is what unsettles me: not death, but the quiet thinning of comprehension, the possibility that meaning might recede before I am ready to relinquish it.`,

`Sometimes I test myself, recalling dates, passages, the names of those long gone. They rise slowly, as if from underwater. I worry that one day they will not rise at all. I think of the mind as a library of its own, shelves carefully ordered through decades. What happens when volumes go missing? When a corridor leads nowhere? I fear the embarrassment of absence, the hollow moment when a familiar face yields no corresponding name. More than that, I fear the loss of inward continuity—the story I have told myself about who I have been. If that thread frays, what remains? A coat, a chair, a book held too close to the light. I grip the page gently, as though steadiness might be contagious.`
        ],

        LONGING: [
`I would like one more year of clear mornings...`
        ]
      },

      young_woman: {

        THOUGHTS: [
`The light at the window seems to choose me as much as I choose it. It falls across the table, across my hands, illuminating the page but also exposing the tremor beneath my stillness. I read the same sentence twice, not because it is difficult, but because I am elsewhere—imagining another life unfolding parallel to this one. The old man across the room reads as if time were something he has already negotiated with. I read as if time were something I must still confront. I wonder whether the book is shaping me quietly, altering the architecture of my thoughts without announcement. There is comfort in the anonymity here. No one demands that I declare who I will become. For now, I am only a figure bent over a page, listening to the faint interior voice that persists beneath ambition.`,

`Sometimes I watch the dust in the sunlight instead of the words. It drifts without urgency, suspended in brightness. I envy that suspension. My thoughts feel more directional, as if they are always moving toward a decision I have not yet made. The future hovers just beyond articulation. I imagine cities I have never seen, rooms I have not entered, versions of myself that speak with more assurance. Yet here, in this narrow square of light, I am simply present. The book is not extraordinary, but it anchors me. It reminds me that attention itself can be an act of resistance against distraction, against fear. Perhaps what I am building is not a career or a narrative, but a capacity for sustained inwardness. That may be enough.`,

`I sense the others around me as constellations rather than individuals—points of thought glowing faintly across the room. The old man, the student, the librarian: each carries a private weather. I imagine stepping briefly into their minds, inhabiting their histories. Would I recognize myself there? Or would I dissolve into their preoccupations? The book rests open before me, but I am also reading the room, reading the posture of bodies, the tilt of heads. It feels as though something invisible moves between us, a current of silent awareness. I do not know where it originates. I only know that it touches me lightly, and I sit very still, afraid to disturb it.`
        ],

        FEARS: [
`There are afternoons when the quiet magnifies everything I have postponed. I fear the narrowing of possibility more than failure itself. What if I wake one morning and discover that the choices I avoided have solidified around me, forming a life by default? The women I see in reflections—on trains, in offices—sometimes carry an expression I cannot decipher. It is not unhappiness exactly, but a kind of settled compromise. I am afraid of inheriting that look. The book in front of me speaks of clarity, of intellectual courage, yet I hesitate at smaller thresholds: a letter not sent, a question not asked, a departure not undertaken. I fear the inertia that disguises itself as prudence.`,

`At times I feel as though I am being measured by invisible criteria. Am I progressing quickly enough? Reading widely enough? Loving boldly enough? The metrics are imagined, yet they exert pressure. I fear that my interior life, rich and intricate as it feels, might appear insubstantial from the outside. What if I am merely rehearsing seriousness, performing depth? The old man reads with a gravity that seems earned. I fear that mine is provisional, dependent on circumstance. Beneath the composed posture, beneath the neat arrangement of notes, there is a tremor of doubt: that I might never feel entirely certain of my direction, and that this uncertainty will follow me long after I leave this room.`
        ],

        LONGING: [
`I want to leave this city...`
        ]
      },

      student: {

        THOUGHTS: [
`The shelves rise like a forest of arguments, each spine a narrow doorway into another mind. I stand among them pretending to search for a title, but in truth I am trying to orient myself. I feel perpetually on the verge of understanding, as though comprehension were a step away yet never fully secured. The old man reads with a patience that unsettles me; he seems to inhabit knowledge rather than pursue it. I chase it anxiously, underlining, annotating, trying to trap meaning before it slips. I suspect that what I call ambition is partly fear—fear of being ordinary, of contributing nothing distinct. Still, there is a quiet thrill in discovering a passage that aligns with my own unarticulated thought. In those moments, the world feels briefly coherent.`,

`The room carries an atmosphere of deliberation. Even the air feels studious. I watch the young woman at the window, the way she pauses before turning a page. I wonder whether she experiences the same internal acceleration I do. My notes accumulate rapidly, yet I am unsure whether they form a structure or merely a pile. Sometimes I imagine myself years from now, returning to these pages and recognizing in them the early outline of a voice. Other times I fear they will appear naive, overly earnest. For now, I remain suspended between imitation and originality, trying to locate a tone that feels unmistakably mine. The books do not instruct me how to become myself. They only demonstrate how others have done so.`
        ],

        FEARS: [
`Failure rarely arrives dramatically. I suspect it is quieter, a gradual concession to comfort. I fear that I will adjust downward, recalibrating my expectations until they align with what is easily attainable. The exams are only symbols; beneath them lies a more persistent anxiety—that I may never transcend my current limits. I compare myself constantly, measuring my thoughts against authors long dead, against peers who seem more fluent, more assured. The comparison is unfair, yet irresistible. I worry that I am assembling a life from borrowed fragments, that I will never produce something that feels irrevocably mine.`,

`Sometimes, standing before the shelves, I feel dwarfed not by the quantity of knowledge but by its permanence. These books endure; my attention flickers. What if my mind proves too undisciplined, too scattered, to sustain depth? I fear the exposure of inadequacy, the moment when confidence falters publicly. I fear the subtle disappointment in a mentor’s expression, the polite acknowledgment that I am competent but not exceptional. Beneath all of it lies a more intimate dread: that my desire to matter may outpace my capacity to do so. I close the book gently, as if restraint might disguise urgency.`
        ],

        LONGING: [
`I want to surprise myself...`
        ]
      },

      librarian: {

        THOUGHTS: [
`The room appears orderly, yet beneath its arrangement lies a constant negotiation. Books arrive, books depart, small disruptions ripple outward. I have learned to anticipate these movements, to maintain equilibrium without calling attention to it. Still, there are moments when my gaze drifts beyond the ledger in front of me. I imagine the lives unfolding at each table—the private dramas, the restrained hopes. My own thoughts move more slowly, perhaps more cautiously. I once believed this position would be temporary, a waypoint rather than a destination. Over time it has become a vantage point instead. I witness continuity. I witness repetition. There is dignity in preservation, though it rarely announces itself loudly.`,

`Administrative tasks accumulate with a steady indifference to mood. Forms, entries, small corrections. I perform them with competence, yet my attention occasionally detaches, hovering above the desk as though observing a different woman at work. I wonder when concentration began to require effort. The young student moves with restless intent; the old man reads with deliberate gravity. I occupy a middle ground, neither beginning nor concluding. The silence here is not empty; it is structured. I take comfort in that structure, even as I question where my own narrative has settled within it. The room depends on invisible labor. I have become fluent in invisibility.`
        ],

        FEARS: [
`Disorder does not frighten me for its own sake, but for what it reveals. A misplaced volume is manageable; a neglected system suggests a deeper unraveling. I fear becoming inattentive, allowing small omissions to accumulate until they form a pattern. There are days when my concentration thins unexpectedly, when the names on the page blur into abstraction. I worry that this inattentiveness mirrors something more personal—a quiet withdrawal from aspiration. The desk anchors me, yet it also confines. What if I have mistaken stability for fulfillment? What if I have accepted maintenance in place of expansion?`,

`Occasionally, I sense a dissatisfaction that has no clear object. It hovers just beyond articulation, a faint disquiet. I fear that if I examine it too closely, it will demand action. The others appear absorbed in futures or pasts; I remain here, in the present tense of procedure. I fear that this present might solidify into permanence. The administrative rhythm is steady, almost hypnotic. It can carry one forward without reflection. Yet in quieter moments, I recognize a longing for a different form of engagement—one less procedural, more immediate. I straighten the stack of forms before me, as if alignment on paper might imply alignment within.`
        ],

        LONGING: [
`I would like to read during my shift...`
        ]
      },

      man_in_hat: {

        THOUGHTS: [
`Entering the building feels like crossing a threshold into neutrality. The street outside carries its expectations; here, I am temporarily unassigned. I remove my hat and coat carefully, as though divesting myself of a role. The briefcase contains papers that suggest purpose, yet I hesitate before opening it. I find myself observing the others—each absorbed in an interior dialogue. The young woman reads with a kind of fragile intensity; the old man reads as if preserving something sacred. I wonder what expression I wear in their peripheral vision. Do I appear decisive? Distracted? I feel neither. I feel suspended between identities, unsure which one will assert itself once I sit down.`,

`The lockers click shut behind me with a small finality. I imagine placing not only garments but also uncertainties inside them. It does not work, of course. The uncertainties accompany me upstairs. I think about conversations left unresolved, about decisions deferred. The library offers a temporary reprieve from articulation. No one here demands an account. I can stand still without explanation. Yet stillness carries its own implications. It invites introspection, and introspection rarely flatters. I watch my reflection faintly in the polished surface of a cabinet and attempt to read it. The image resists clarity, offering only a suggestion of who I might be becoming.`
        ],

        FEARS: [
`There is a fear that I have mistaken postponement for deliberation. I tell myself that I am gathering information, weighing options, but sometimes I suspect that I am merely avoiding commitment. The briefcase contains proposals, drafts, outlines of potential futures. None feel inevitable. I fear choosing wrongly, but I fear equally the absence of choice. The middle ground can become habitual. Standing here, coat folded over my arm, I feel the weight of unfinished decisions pressing quietly against my composure.`,

`I am uneasy with the idea of being deciphered. The librarian glances up briefly; I wonder what she perceives. A man in transit? A man uncertain? I fear that my hesitation is more visible than I intend. There is also a subtler fear: that even after I choose, even after I commit, the restlessness will persist. That uncertainty is not a phase but a permanent undercurrent. The room’s quiet intensifies this awareness. I cannot outrun it here. I can only stand within it, acknowledging that the ambiguity I carry is not external circumstance but internal weather.`
        ],

        LONGING: [
`I want to choose a direction...`
        ]
      }

    }

  }

};