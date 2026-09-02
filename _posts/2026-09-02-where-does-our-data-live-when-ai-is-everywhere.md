---
title: "Where Does Our Data Live When AI Is Everywhere?"
description: >-
  AI memory started inside apps, moved into repositories, and is now being
  pulled through agent harnesses. The real question is continuity: who owns
  the context, and can you take it with you?
date: 2026-09-02 00:30:00 -0700
---

I thought I was asking a storage question.

Where should my AI data live? In ChatGPT? Claude? A folder on my computer? A private GitHub repository? Inside whichever agent harness I happen to be excited about this week?

Storage is only the visible part. The real question is **continuity**.

If I spend months teaching an AI how I work, what I care about, how my business operates, and which assumptions it should never make, who owns that accumulated understanding? Can I carry it to another model? Can I inspect it? Correct it? Still use it if one company changes its product, raises its price, or disappears?

Put more simply: is the AI remembering me, or am I building a memory that AI can use?

Those sound similar. They lead to very different systems.

![Four phases of AI memory: app, repository, harness, and a user-owned data layer]({{ '/assets/blog/ai-memory-phases.svg' | relative_url }})

## Phase one: memory lived inside the app

For most people, personal AI began in a chat window. Conversation history came first. Then account-level memory: preferences, recurring facts, custom instructions, project spaces.

That was a real upgrade. An AI that knows your business or writing style beats one that wakes up blank every morning.

It also created a new kind of lock-in. The context belonged to the experience. Switch providers and you export, paste, rebuild, or introduce yourself again to a machine you had supposedly been working with for months.

We made the model smarter. Our continuity stayed trapped inside an interface.

## Phase two: the repository became the memory

AI-assisted development changed the shape of this for me.

Once coding agents entered the picture, important context moved out of the chat and into the project. The repository held the code, and it also started holding instructions, architecture decisions, plans, conventions, and docs the agent needed to do good work.

A model could read `README.md`, follow standing guidance, make a change, and commit. Open the same repo with a different model tomorrow and continue.

The chat stopped being the source of truth. The files did. The model became a temporary worker arriving at a shared job site.

That is one reason Markdown matters so much in AI workflows. A person can read it. A model can read it. Git can diff it. It does not become unusable because one company goes away. JSON and YAML are better for rigid records. Markdown is better for meaning that still needs a human voice.

The combination started to look less like documentation and more like portable memory.

## Phase three: the harness became the environment

Then came the harnesses.

Tools such as Clawdbot, Hermes, Grok Bot, and whatever arrives next do more than wrap a chat box around a model. They manage the environment: tools, skills, permissions, standing instructions, caches, projects, and sometimes whole teams of specialized agents.

I wrote recently that [a model on its own is a brilliant amnesiac](/blog/grok-bot-and-the-multi-agent-team/). A harness is what gives that brilliance a place to work. It can choose which model handles a task, load the right guidance, expose the right files, and coordinate specialists. Suddenly the provider matters less.

But that makes the data question more urgent, not less.

If my instructions, history, and working knowledge live inside one harness, I have only moved the lock-in up one layer. I escaped the model provider and built the same trap somewhere else.

The harness should be replaceable too.

That leads to a principle I am increasingly convinced of:

> Your AI should not own your memory. You should own a memory your AI can borrow.

## Git is not GitHub, and local-first is not local-only

When I say my data lives in GitHub, I may mean three different things:

- The data is stored as ordinary files.
- Git records the history of those files.
- GitHub hosts a remote copy and gives tools a way to access it.

Those layers are useful together. They are not the same thing.

Git is a format and a history system. GitHub is a service. A local folder is a copy on one machine. A backup is another copy with a recovery purpose. A harness is an interface and an operator. A model is compute.

![A stack that keeps replaceable models and harnesses above selective projections, git history, readable files, and protected raw sources]({{ '/assets/blog/data-layers-stack.svg' | relative_url }})

Once those responsibilities are separated, the architecture gets easier to reason about.

For a software project, a private GitHub repository may be an excellent canonical home. For the most personal parts of a life, the answer may be different. Highly sensitive records may belong in an encrypted local store, with carefully chosen projections made available to cloud tools. The model rarely needs every fact. It needs the right context for the task.

Local-first does not mean one precious laptop holding the only copy of your life. That is not privacy. That is a future hard-drive tragedy.

Local-first means the system remains coherent, readable, and useful without needing permission from a particular service. It can still sync, back up, and use powerful cloud models. The service is just not the only place where the truth exists.

## Then this collided with Life-Journal

I have been building a personal operating system called [Life-Journal](/blog/one-life-written-down-once/). The premise was simple: write one journal entry, then let the system maintain useful context across the rest of my life.

![Life-Journal system architecture]({{ '/assets/blog/lifejournal-architecture.svg' | relative_url }})

The journal feeds human-readable wikis. Those pages track roles, projects, people, commitments, and patterns. The same material can produce a daily view, a role-based view, or a weekly synthesis. I chose a wiki over a vector database because I wanted the memory of my own life to be something I could open, read, edit, and challenge.

At the time, I thought I was making a decision about my journal.

Now I think I was accidentally designing the same data layer that agent harnesses need.

The collision got obvious when I imagined a chief-of-staff agent directing specialists across work and life. A coding agent might need technical preferences. A business agent might need to understand Growing Light Montessori School. A family assistant might need calendar context. A coaching agent might need goals and recent reflections.

None of those agents should maintain its own separate Gene database. That way lies duplicated facts, contradictions, and a great deal of me repeating myself to robots.

They need shared context with boundaries.

The life system should own the durable knowledge. Each agent should receive the portion it needs, for the period it needs it, with clear permission to read, propose, or write.

That is not just a personal journal architecture. It is a personal data architecture.

## Wiki and database, layered

People and models benefit from readable summaries. Software benefits from predictable structure. Trying to force everything into one format usually makes one side miserable.

The best shape I have found is layered:

- **Markdown** for explanations, narratives, decisions, identity, and curated knowledge.
- **YAML or JSON** for records that need consistent fields, validation, dates, relationships, or automation.
- **Raw source material** preserved separately: journal entries, transcripts, calendar imports, documents.
- **Computed views** generated from the source, rather than stored as competing versions of the truth.

A person can audit the Markdown. An agent can read it. Git can show exactly what changed. Structured records exist because some facts need rules. A due date should be a date. A dollar amount should not become "about a few thousand" because a model felt poetic that morning.

Human-readable and machine-reliable are not competing goals. They belong in different layers.

## Folders by object, not by every role you play

My first instinct was folders for every realm of life: family, work, coaching, home, health, community. Familiar. Also fragile. One fact often belongs in several places. Copy it seven times and you get seven future disagreements.

The more durable structure is based on what a thing *is*:

- People
- Projects
- Organizations
- Events
- Places
- Assets
- Knowledge
- Systems
- Goals

Store a thing once. Connect it to the roles, contexts, and views where it matters.

Husband, father, coach, business owner, and community member are not necessarily storage folders. They are lenses. The objects are relatively stable. The views can evolve. That is a better bargain than rebuilding the filing cabinet every time my understanding of myself changes.

## Where I think this goes next

Account memory. Repository memory. Harness memory. The next phase is a **user-owned data layer** beneath all of them.

It will probably be local-first, synchronized, versioned, and selectively available. It will mix readable documents with structured records. It will preserve provenance, so the system knows whether something came from me, a calendar, a bank statement, or an AI inference. It will treat permission as part of the data model.

Most importantly, it will separate facts from interpretations.

An agent may infer that I am overcommitted. It should show me the evidence. It should not silently rewrite my identity. A new model may be better at synthesis than the old one. It should read the same underlying record without requiring me to start from an empty prompt.

Eventually the interface may become almost incidental. Chat window, terminal harness, phone dashboard, or an agent that has not been invented yet. Those are windows into the system. They are not the system itself.

## The practical answer, for now

I do not think there is one perfect place where all AI data should live today. My working answer:

1. Keep durable knowledge in open, human-readable formats.
2. Use structured files where automation needs guarantees.
3. Use git for history and accountability.
4. Use a remote host such as GitHub for sync and collaboration when sensitivity permits it.
5. Keep raw personal source material protected and expose only what a tool needs.
6. Treat models and harnesses as replaceable workers, not permanent owners of context.
7. Generate views from the source instead of maintaining multiple competing truths.

That is not a finished standard. We are still early enough that everyone is inventing parts of this independently, usually in a collection of Markdown files with names like `CONTEXT-FINAL-v3.md`.

But the direction feels clear.

The most valuable part of an AI relationship is not the conversation happening right now. It is the continuity that makes the next conversation better. If that continuity matters, it should not exist only inside somebody else's product.

Control-click on the AI interface and look underneath. The model is only one option in the menu. Your data, your history, your permissions, and your ability to leave are the parts that determine whether the system actually belongs to you.

That is where I started with Life-Journal, almost by accident. One life, written down once, read many ways.

Now I am wondering whether the same principle should apply to everything.

If you are wrestling with the same questions for your business systems, your team agents, or your own personal context, [come say hi](https://calendar.app.google/QtYaUwA72XbuKN468). That is exactly the kind of problem I like thinking through.
