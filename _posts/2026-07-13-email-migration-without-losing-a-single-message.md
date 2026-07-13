---
title: "How to migrate your business email without losing a single message"
description: >-
  A calm, staged approach to email migration — the checklist I use to move
  businesses between Google Workspace, Microsoft 365, and legacy hosts with
  zero data loss and no missed mail.
---

Email migrations have a reputation problem. Ask a business owner about the last time their company changed email providers and you'll usually hear a story involving lost messages, a weekend of downtime, or a consultant who disappeared halfway through. It doesn't have to be that way. A migration done right is boring — mail keeps flowing, history comes along, and nobody notices until they log in somewhere new.

Here's the approach I use when moving businesses between Google Workspace, Microsoft 365, and legacy hosts. It's less about tools and more about sequence.

## Audit before you touch anything

Most migration disasters start with an incomplete picture of the current setup. Before any data moves, map out:

- **Every domain that receives mail** — including the old ones people forgot about that still forward somewhere.
- **Every mailbox, alias, and group** — and who actually uses them. Most businesses discover mailboxes nobody has opened in years.
- **Forwarding rules and integrations** — the CRM that BCCs itself into deals, the scanner that emails PDFs, the billing system that sends receipts from your domain.
- **Current DNS records** — MX, SPF, DKIM, DMARC. Screenshot everything before changing anything.

The audit usually takes longer than the migration itself. That's the point.

## Stage the cutover — never flip everything at once

The safest migration runs both systems in parallel for a window:

1. **Provision the new environment first.** Create every mailbox, alias, and group in the destination before any DNS changes. Verify logins work.
2. **Sync historical mail early.** Bulk-copy old mail days before cutover, then run a delta sync at the end. This turns the risky part of the migration into a non-event.
3. **Move MX records with a low TTL.** Drop your DNS TTL to 5 minutes a day ahead, so the cutover propagates fast — and so a rollback would too.
4. **Keep the old system readable for 30 days.** Don't cancel the old provider on day one. If anything was missed, it's still there.

## Authentication is not optional

A migration is the best moment to fix deliverability, because you're already in the DNS. Three records determine whether your mail lands in inboxes or spam folders:

- **SPF** — lists which servers may send as your domain. One record, no more than 10 DNS lookups.
- **DKIM** — cryptographically signs your outgoing mail. Enable it in the new provider before cutover, not after.
- **DMARC** — tells receiving servers what to do with mail that fails the other two, and sends you reports about who's sending as your domain. Start with `p=none` and monitor before enforcing.

If your business skips this step, your first week on the new system will be spent asking clients to check their spam folders.

## Verify like you don't trust yourself

After cutover, confirm the boring things explicitly:

- Send and receive a test message on **every** mailbox — not just the owner's.
- Check that aliases and groups deliver.
- Confirm the scanner, the CRM, the invoicing tool, and every other machine that sends mail still works. These break silently.
- Search the migrated history for the oldest message and a known attachment. If both are there, the sync did its job.

## When to bring someone in

If your business has one domain and three mailboxes, you can likely follow the provider's own migration guide and do fine. Bring in help when there are multiple domains, years of history, compliance requirements, or machines sending mail on your behalf — the failure modes multiply, and the fix for a botched migration costs more than doing it carefully once.

That's what I do at Ctrl+Click: staged cutovers with rollback plans, full data preservation, and post-migration verification — for businesses around the Bay Area and remotely. If a migration is on your horizon, [schedule a discussion](https://calendar.app.google/QtYaUwA72XbuKN468) and we'll map out your audit together.

Control-click on your email setup: there are more options in there than you think.
