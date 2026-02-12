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
        position: { x: 1, y: 2 },
        sensitivity: "medium",
        adjacentTo: ["old_man", "librarian"]
      },

      {
        id: "librarian",
        label: "Librarian at Desk",
        icon: "📚",
        position: { x: 3, y: 3 },
        sensitivity: "low",
        adjacentTo: ["student", "man_in_hat"]
      },

      {
        id: "man_in_hat",
        label: "Man in Hat (Standing)",
        icon: "🧢",
        position: { x: 5, y: 2 },
        sensitivity: "medium",
        adjacentTo: ["old_man", "young_woman", "librarian"]
      }

    ],

    /* Ambient autoplay behavior */
    ambientBehaviors: [
      { character: "old_man", activation: "THOUGHTS", probability: 3 },
      { character: "young_woman", activation: "LONGING", probability: 2 },
      { character: "student", activation: "FEARS", probability: 2 },
      { character: "librarian", activation: "THOUGHTS", probability: 1 },
      { character: "man_in_hat", activation: "THOUGHTS", probability: 1 }
    ],

    /* Short fallback seeds (used if no full monologue present) */
    seeds: {
      old_man: {
        THOUGHTS: "The print is smaller than it used to be.",
        FEARS: "What if I forget this page tomorrow?",
        LONGING: "I want one more year of clarity."
      }
    },

    /* Full monologues */
    monologues: {

      old_man: {

        THOUGHTS: [
`The print is smaller than it used to be.
Or perhaps my hands tremble more than I admit.

This coat has followed me through winters
that felt permanent.
I smooth the page, hold it nearer the window.
The words still come, but they arrive more slowly now.`,

`I remember when I could read for hours
without lifting my head.
Now the letters shimmer at the edges,
like distant figures in fog.

Still — the argument unfolds.
I can follow it.
I am still here.`,

`The margins are generous.
Someone once wrote notes in this book,
decades ago.
I trace their faded pencil lines
as if they were a conversation
I am just now finishing.`
        ],

        FEARS: [
`If I lose this thread of thought,
will it return?

There are days when I reach for a name
and it remains just beyond my fingers,
like a coin dropped into deep water.`,

`The body leans forward without permission.
The neck bows.
I feel myself folding inward,
as if already preparing
to disappear quietly from the room.`,

`What if one morning the words refuse me?
What if the page is only pattern,
and not meaning?`
        ],

        LONGING: [
`I would like one more year of clear mornings.
One more season of steady hands.

I would like to finish this book
and begin another.`,

`To sit here again next winter,
coat heavy on my shoulders,
light angled just so —
and feel that the world
still requires my attention.`,

`Not immortality.
Only continuation.
A few more afternoons
where the words gather themselves
into sense.`
        ]
      },

      young_woman: {

        THOUGHTS: [
`He turns the pages so carefully.
As if the paper might bruise.`,

`The light near the window is warmer.
I always choose it.
It feels like sitting inside a held breath.`,

`I wonder what he reads.
Philosophy, perhaps.
Something about time.`
        ],

        FEARS: [
`I am afraid of becoming ordinary.
Of one day looking up
and finding the years have closed around me.`,

`Sometimes I feel the future narrowing.
Like a corridor.`,

`I pretend I am calm.
But the quiet here amplifies everything.`
        ],

        LONGING: [
`I want to leave this city.
Or stay.
Or choose something without hesitation.`,

`I want to love someone
who notices the way I look at books.`,

`I want my thoughts to matter
to someone besides myself.`
        ]
      },

      student: {

        THOUGHTS: [
`If I finish this chapter,
I might understand the next.`,

`Everyone here looks composed.
I feel like a forgery among originals.`,

`The old man reads without rushing.
I envy that steadiness.`
        ],

        FEARS: [
`What if I fail quietly?
What if no one notices?`,

`The exam feels larger than the room.`,

`I measure myself constantly
and always come up short.`
        ],

        LONGING: [
`I want to surprise myself.`,

`I want the work to feel inevitable,
not forced.`,

`I want to sit here one day
without anxiety humming in my ears.`
        ]
      },

      librarian: {

        THOUGHTS: [
`The room regulates itself.
Breathing in paper and dust.`,

`Every book returns eventually.`,

`Silence is a kind of architecture.`
        ],

        FEARS: [
`I fear disorder more than noise.`,

`One missing volume can disturb the whole system.`,

`I sometimes worry
that no one notices the care behind the calm.`
        ],

        LONGING: [
`I would like to read during my shift.
Just once, without interruption.`,

`To choose a book
and forget the desk entirely.`,

`To be a reader here,
instead of its guardian.`
        ]
      },

      man_in_hat: {

        THOUGHTS: [
`I came in to warm up.
Then I stayed.

The quiet is a kind of permission:
to stand still,
to let the mind speak without consequence.`,

`People read like they’re hiding.
Or like they’re waiting.

I can’t decide which one I am.`,

`I watch the old man’s hands.
How carefully he holds the book.
As if the object were the last stable thing in the world.`
        ],

        FEARS: [
`I’m afraid someone will recognize me
as unfinished.

As if my life is a draft
and everyone else is already published.`,

`I fear I will leave here
and immediately forget
why I came.

That whatever I intended to change
will dissolve into habit.`,

`The quiet is dangerous.
It makes room for all the thoughts
I normally outrun.`
        ],

        LONGING: [
`I want to choose a direction
and not second-guess it all day.

A job, a city, a person.
One thing I can say yes to
without bargaining.`,

`I want to feel forgiven
without having to confess.`,

`I want to be less restless.
Or better at using restlessness
as a tool instead of a wound.`
        ]
      }

    }

  }

};