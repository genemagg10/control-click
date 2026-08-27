---
title: "One Life, Written Down Once"
description: >-
  Building a personal operating system with Claude, a curiosity-driven
  experiment, and the fork in the road that made it fascinating: I chose a
  wiki over RAG, and here is why.
date: 2026-08-27 12:00:00 -0700
---

For the last few months I've been building a thing I call **Life-Journal**. It isn't a
product, and it isn't for sale. It's a personal operating system for one person, me,
trying to live one integrated life across a lot of different realms: husband, father, the
family I come from, friends, the house, the community, the business, my coaching practice,
the technologist who can't help but build things, and the self underneath all of it.

The premise was simple and a little stubborn. I write. I already keep a journal. What I
wanted was for that writing to *do something*, to quietly keep the rest of my life
organized without me having to say the unnecessary parts twice. As I put it to Claude early
in the design conversations:

> "My goal is to be as integrated in my life as possible. Every realm potentially overlaps
> with another one, and I'm relying on this system to unify my awareness and efforts across
> each realm and each day."

This post is about how that got built, what I learned, and where it's going, and the
decision at the center of it that I most enjoyed thinking through:
**I chose a wiki over RAG.** More on that below, because it's the part I had the most fun with.

*Updated 2026-08-03: there's now a **v2**, and it changed what the system is for rather than what
it does. [Skip to it](#v2-what-am-i-not-seeing-yet) if you've read this before.*

---

## The shape of the thing

Here's the whole system in one picture. It's worth a slow look, because almost every idea in
this post is somewhere on it.

![Life-Journal system architecture]({{ '/assets/blog/lifejournal-architecture.svg' | relative_url }})

Three properties are worth calling out before anything else, because they're the spine:

1. **The git repo is the only datastore.** Every fact in my life-system is a file (Markdown,
   YAML, JSON) versioned in git. There's no database. There's no vendor to outlive. The
   assistant's entire edit history is `git log`. If Anthropic vanished tomorrow, or Vercel
   did, or I got bored of the whole thing, I'd still have a folder of readable text files
   that make complete sense on their own.

2. **Derivation is pure and computed at read time.** Due dates, trends, gaps, the day's
   agenda, each realm's summary, none of it is stored. It's all computed from the files when
   a page loads. A stored status goes stale silently the day after you write it. A computed
   one can't.

3. **Every write into the store is governed.** The daily pipeline writes through validated
   operations with ownership enforcement. The app writes through GitHub's Contents API with
   compare-and-swap. I can write anything, anywhere. Nothing else writes at all.

The daily rhythm is a scheduled job. Around 4:30 in the morning a GitHub Action wakes up,
applies any structural changes I approved the day before, fetches my calendars, ingests
whatever I journaled, hands each entry to a model with the full context of my life, gets back
a list of *operations*, applies them under strict ownership rules, regenerates the "Today"
view, runs 31 validation check groups, and commits. On Sundays a second job reads the whole
week at once and writes a synthesis, a coach's read on how the week actually went.

The models are tiered to the weight of the job: a cheap model classifies calendar titles
(cached forever, so a weekly meeting is forty events and *one* classification), a mid-tier
model turns journal entries into operations, and the highest-judgment model in the house does
the Sunday synthesis. It's a cost architecture as much as a quality one.

---

## The two axes

The brief was a grid: *"each realm and each day."* So the architecture took that literally.
There are two orthogonal ways to read the same underlying files:

- **The day axis** (`agenda.ts`) answers *"What is asking for me today?"*: overdue things,
  today's things, this week, the focus list, and the standing commitments, pulled from
  projects, the house, the trust, the calendar, and the seasons of the year.
- **The role axis** (`realm.ts`) answers *"What is the state of this realm?"*: work, people,
  events, goals, trends, and gaps, assembled the same way for every realm so they all read
  alike.

Because both read the same modules, the daily view, the realm page, and the Sunday review
*cannot disagree with each other.* And the day axis computes something I've come to love:
**convergences**, a piece of work filed to two roles at once, a date where several realms
land together, a season declaring a role important while nothing is queued against it. They're
always computed from data, never inferred, because a fabricated connection in a system built
to unify awareness is worse than no connection at all.

That last sentence turned out to be a design principle I'd reuse over and over.

---

## The fork I found most fascinating: a wiki, not RAG

Here's the fork in the road. When you build a system that reads your life and needs to
"remember" it, there are broadly two ways to give a language model that memory.

**The RAG way**: retrieval-augmented generation. You take everything (every journal entry,
every fact, every note), embed it into a vector database, and at generation time you retrieve
the handful of chunks most semantically similar to whatever you're currently working on, and
feed those to the model. The memory is one big undifferentiated corpus plus a similarity
search. Nothing is curated. The structure, such as it is, emerges at query time.

**The wiki way**: the one I chose. The raw journal stays sacred and verbatim, but the
*signal* in it gets continuously curated into structured, human-readable pages: one wiki per
realm, typed data stores for money and the house, dashboards for interpretation. The memory
isn't a corpus you search, it's an institutional memory you can *read*. When the model needs
context, you hand it the relevant curated pages, not the nearest embeddings.

I want to be honest about why I picked the wiki, because it wasn't purely a performance call.

**I picked it partly because I wanted to learn it.** Building a curation layer (deciding what
signal routes where, how a realm page assembles itself, how a fact becomes a wiki line with
provenance attached) is a genuinely harder and more interesting problem than standing up a
vector store and calling `retrieve()`. I wanted to build the harder thing. I wanted to
understand, in my hands, what it takes to turn a stream of writing into an organized,
self-maintaining knowledge base. That's a builder's reason, not an architect's, and I'm not
going to pretend otherwise.

**And I picked it because I wanted it to be human-readable.** This is the reason I'd actually
defend to a stranger. A vector database is not something you can open and understand. It's
opaque by construction. But the entire point of this system is captured in its tagline: *one
life, written down once, read many ways.* If the memory of my own life is a black box I can't
inspect, edit, or trust, I've missed the point. With a wiki I can open any page and see my
life at a glance. I can correct it. I can watch it fill in, and I can watch it *fail* to fill
in, which turns out to matter. The `friends` realm started completely empty, and that
emptiness was itself the finding: nothing in my journal had ever referred to a friendship. A
vector store would have hidden that. A blank wiki page couldn't.

Let me lay the tradeoff out plainly, because it's a real one:

| | **Wiki (what I chose)** | **RAG / vector store** |
|---|---|---|
| **Legibility** | You can read, browse, and audit the whole memory | Opaque; you can't read a vector |
| **Editability** | Human-owned; I correct facts directly | You'd re-embed; no clean ownership model |
| **Provenance** | Every assistant line is stamped `(journal:YYYY-MM-DD)` | Retrieved chunks, weakly attributed |
| **Surfacing gaps** | An empty page *is* a signal | Absence is invisible |
| **Infra** | Text files in git; nothing to maintain | A vector DB, embeddings that drift with model changes |
| **Curation** | Lossy; a fact routed nowhere is invisible | Nothing is discarded; everything is retrievable |
| **Scaling** | Pages grow; you still hit context limits eventually | Retrieval was *designed* for the context-limit problem |
| **Structure** | Rigid taxonomy; cross-cutting facts are awkward | No taxonomy to get wrong |
| **Recall** | Keyword/structured lookup | Semantic recall can find non-obvious connections |

Look at the two halves of that table and you'll see what makes this fork so interesting: **the
wiki's strengths and RAG's strengths sit on opposite sides.** Curation is lossy: every routing
decision decides where a fact will, or won't, be found later. And the wiki doesn't escape the
context-window problem so much as defer it: as my life accumulates, I can't hand the whole wiki
to a model any more than I could hand it the whole corpus, so at some point you *retrieve* the
relevant subset anyway, and structured retrieval over human-readable pages is, if you squint,
RAG wearing friendlier clothes. Which is exactly why the two feel less like rivals and more like
two ends of the same idea.

This is the part of the experiment I'm most curious about. A few months in, the legibility has
already delighted me more than once: opening my own life-memory to read it, edit it, and notice
its holes is exactly the experience I set out to build. And the open question, what happens at
a few thousand entries, is the fun kind. My hunch is that the answer becomes *both*: a curated
wiki for the parts a human wants to read, and retrieval underneath for the parts a model needs
to find. Discovering which, by living in it, is the whole point.

---

## What I learned building it

A few things surprised me enough to write down.

**"Never invent a fact" is a whole architecture, not a rule.** The most load-bearing decision
in the system is that the assistant never fabricates. Unknowns stay as a visible `⟨CONFIRM⟩`
placeholder; money is tracked in integer cents and `null` never quietly becomes zero;
approximations ("a couple grand") are never hardened into figures. This sounds like a policy,
but it turned into schemas, validators, prompt contracts, and tests, because the whole thing
only works if I *trust it enough to journal honestly.* The moment it invents something, I stop
telling it the truth, and then it has nothing real to organize.

**Computed beats stored, almost always.** Every time I was tempted to cache a status, it would
have gone stale. Keeping derivation pure (no I/O, no clock, fully tested functions that
recompute on every read) is more work up front and eliminates an entire category of bug where
the displayed state quietly diverges from reality.

**Proposals are the pressure-release valve.** The assistant can fill in a blank, but it can't
*restructure*: it can't add a realm, rename a payee, or create a goal on its own. Those come
back to me as proposals I accept or decline. That single boundary is what lets the automation
be aggressive about the small stuff without ever running away with the big stuff.

**The calendar taught me the value of refusing features.** The system deliberately has *no*
plan-versus-actual view, because a calendar feed records what was *scheduled*, not what
*happened*: a cancelled meeting and one that ran three hours are identical in the file.
Building that comparison would mean inventing a distinction the data can't support. Half of
good design here was choosing what *not* to build.


---

## v2: "What am I not seeing yet?" {#v2-what-am-i-not-seeing-yet}

*Added August 2026.*

Everything above describes a system that was working. Entries came in, the wiki stayed current,
the plate told me what the day wanted. It did what I asked.

And then I noticed I'd asked for the wrong thing.

What I had built was a very good filing system with a coach bolted on. Every morning it answered
**"what should I do?"**, competently, with real data behind it. But the question I actually
wanted answered, the one that made me start this in the first place, was different:

> **What am I not seeing yet?**

Those are not the same question, and a system optimized for the first will never accidentally
answer the second. Filing is about retrieval. Awareness is about synthesis. I had built the
former and been quietly disappointed it wasn't doing the latter.

### What was actually missing

I wrote up three long documents trying to describe the gap, handed them to Claude alongside the
running codebase, and asked it to reconcile them rather than pick a side. The most useful thing
that came back wasn't a plan, it was a diagnosis:

> This is not a failed architecture. It is a strong operating architecture whose deeper product
> meaning is distributed across prompts, prose, and reports rather than represented explicitly.

That landed. The system *knew* things about me. It just had no way to say **how** it knew them,
how sure it was, or what would change its mind. Every insight was a sentence in a report. There
was no difference, structurally, between something I had told it and something it had inferred,
and that difference is the whole ballgame when the subject is a person.

So v2 didn't replace anything. It added the layer underneath: evidence, claims with an origin,
confidence that means something, a slow-changing model of identity, and a concept I'd been
circling for months without a name.

### The Next Adjacent

Borrowed from Kevin Kelly's *adjacent possible*, and it's the idea the whole thing now organizes
around. Growth isn't a climb toward a finished version of yourself. Every experience unlocks
possibilities that couldn't be seen from where you were standing before. So the question is never
"how do I reach the end state", it's **what has just become reachable?**

Which gave me the loop the system now runs on:

```
Identity  →  Awareness  →  Next Adjacent  →  Experience  →  Identity
```

Who am I becoming; what's true right now; what's the smallest meaningful step; what actually
happened; and around again, slowly.

### The parts I'd defend in an argument

**Almost all of it is refusals.** The Next Adjacent generator surfaces *at most one* possibility a
week, and most weeks none. That's not a limitation, it's the feature. A system that finds
something insightful to say every single week has taught you to stop reading it.

**Nothing the system infers about me can ever become "confirmed."** That level requires me to say
it. No amount of accumulated evidence promotes an inference into a declaration, because that's
the difference between a system that understands you and one that decides who you are.

**Identity moves at the speed of seasons.** One journal entry produces a signal, never a
conclusion. Six observations inside a single week reach only "some evidence", a durable read
needs evidence spanning about two months. An intense fortnight is not a personality.

**Four different things get called "a contradiction,"** and only one is mine to resolve. If I
loved coaching in 2024 and I'm worn out by it now, that isn't an inconsistency, it's a life
moving. Reading a trajectory as a contradiction would tell me my life doesn't add up when it's
merely alive. The system sorts those apart before it ever brings me one.

**A declined question is not a rejected patch.** Declining to answer something today says nothing
about whether it was worth asking. Declining an *opportunity*, though, is a real judgement, and
that one the system should learn from. Different acts, different consequences, and collapsing
them would have been the easy mistake.

### The thing I got wrong, and what it taught me

Early on I asked why the system was so timid, why every gap sat there as a placeholder waiting
for me to fill it in, when the whole point was that it should be synthesizing.

The answer turned out to be a conflation I'd built in without noticing. Two completely different
kinds of blank were wearing the same marker. *What's my wife's dress size*, no amount of
reflection produces that; asking is the only honest move. *What does growth mean in this part of
my life*, the system has months of my own writing bearing on that, and leaving it blank isn't
caution, it's refusing to do the job.

So the rule now is: **never ask me a question the system could answer and let me correct.** An
inferable gap arrives as a candidate with its evidence attached, not a blank.

That has a cost I accepted deliberately: the system records what it infers about me *without*
asking first, which means a wrong read can sit there unnoticed until I look. The trade only works
because correcting one has to be trivial: one button, and "that's just not true of me" is a
complete answer requiring nothing else. And a correction sticks to the *topic*, not the sentence,
so the same wrong idea can't come back next week wearing different words.

### What v2 taught me about building with AI

The most valuable thing Claude did across this wasn't writing code. It was **refusing to build
the thing I asked for until the thing underneath was defined.** Twice it stopped and said, in
effect: you've asked me to store this, but deriving it first will tell us what the store needs to
hold. Both times that was right, and both times deriving first immediately surfaced a bug in my
thinking rather than in the code.

The second lesson is that **the guardrails are the product.** Most of what v2 added isn't
capability, it's restraint, expressed as code rather than good intentions. Thresholds that can't
be bypassed. A schema with no field for a character verdict, so one can't be written. A
contradiction type that offers three answers because two would force a winner. It's much easier
to write "the system should be careful about X" in a design document than to make X structurally
impossible, and only one of those survives contact with a Tuesday.

*v2 is running. The first weekly synthesis under the new model hasn't happened yet, and I expect
the first identity read to be thin, mostly "not enough to say." Which is, I think, exactly what
it should say.*

---

## Where it's going

The current system runs in the cloud: entries pass through Notion, the pipeline runs on GitHub
Actions, and the reasoning happens through the Claude API. The next chapter I'm sketching is a
**native, on-device app**: capture by voice through Siri, transcription on-device, and the
journal-to-operations routing done by an on-device model, with the data synced privately
through iCloud rather than sitting on third-party servers.

And here's the delightful part, the reason I opened this whole post with the wiki-versus-RAG
question: **the migration brings that decision back around.** An on-device model has a context
window a fraction the size of a frontier model's. You can't hand it the full picture the way the
cloud pipeline does today. You fetch only the realms and records a given entry plausibly touches,
which is to say, *you retrieve.* The wiki and retrieval, which looked like a fork, turn out to
want to live together.

So the idea comes full circle, and I love where it lands. It was never really "wiki *or* RAG." It
was "which one *first*, and where does the other one live." What I'm excited to build next is the
wiki staying the human-readable heart of the thing, with retrieval growing up underneath it as
the plumbing that lets a smaller model reach into a larger life. Human-legible on top;
machine-efficient below. I didn't have to choose between them, I just got to choose which one to
build by hand first, and I'm glad it was the one I can read.

There's a second idea I'm having fun chasing in the native version, and it's the same instinct in
different clothes. Today my life-memory is legible because it's *files I can read.* On-device, I
want to push that one step further, out into the apps I already live in. A dedicated "Life
Journal" folder in Apple Notes, a "Life Journal" list in Reminders, my calendar: let *those* be
the raw repositories, and let the app be the lens that reads them, files them into spheres, and
surfaces them in context. Tick a task off in Reminders and it closes in the app; jot something in
the folder and it turns up as journal signal. I love the idea of the app *cooperating* with the
operating system instead of becoming one more place I have to keep in step.

The rule of thumb I've landed on is *source of truth by layer*: let the system apps own the raw,
human-owned input (a note, a reminder, an event) and let the app's own store own everything
curated and structured, the wiki and the ledgers and the filing, because that's where ownership
and provenance live. Raw stays accessible and portable; curated stays legible and mine. It's the
same thread running through the whole project: keep the thing readable and yours, and hand the
machine only the parts it's genuinely better at.

*More soon, once the on-device version is real enough to play with.*

---

*Life-Journal is a personal project: a single-user system, private by design, not a product.
This post is part of an occasional Ctrl-Click series on building software that's small,
legible, and yours.*
