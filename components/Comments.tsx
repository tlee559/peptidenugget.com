"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { hueFor } from "@/lib/catalog";
import styles from "./Comments.module.css";

/**
 * Discussion under a tier board.
 *
 * Every comment here is written by a real visitor. There is no seeded or
 * sample content: a thread that opens with invented people agreeing with each
 * other is a fabricated endorsement, and on a page carrying affiliate links
 * that is both illegal and the fastest way to lose the credibility the board
 * runs on. The empty state below is built to earn the first real comment
 * instead, and the host prompt is badged as coming from the site.
 */

type Comment = {
  id: string;
  parent_id: string | null;
  author: string;
  body: string;
  likes: number;
  is_host: boolean;
  created_at: string;
};

/* Avatars are generated, not uploaded — initials on a colour derived from the
   name, so the same person is the same colour every time without us storing
   an image or asking for one. */
function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function Avatar({ name, host }: { name: string; host?: boolean }) {
  if (host) {
    return (
      <span className={`${styles.avatar} ${styles.avatarHost}`} aria-hidden="true">
        PN
      </span>
    );
  }
  const h = hueFor(name);
  return (
    <span
      className={styles.avatar}
      style={{ background: `hsl(${h} 42% 30%)`, color: `hsl(${h} 75% 82%)` }}
      aria-hidden="true"
    >
      {initials(name)}
    </span>
  );
}

function ago(iso: string): string {
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 45) return "just now";
  if (s < 3600) return `${Math.round(s / 60)}m`;
  if (s < 86400) return `${Math.round(s / 3600)}h`;
  if (s < 604800) return `${Math.round(s / 86400)}d`;
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

const NAME_KEY = "pn.comment.name";
const LIKED_KEY = "pn.comment.liked";

export default function Comments({
  categoryKey,
  boardLabel,
}: {
  categoryKey: string;
  boardLabel: string;
}) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  /* Backend not reachable (migration not run, Supabase down). Render nothing
     at all rather than a composer that rejects everything typed into it. */
  const [unavailable, setUnavailable] = useState(false);
  const [name, setName] = useState("");
  const [body, setBody] = useState("");
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyBody, setReplyBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [notice, setNotice] = useState("");
  const [liked, setLiked] = useState<Set<string>>(new Set());
  const honeypot = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      setName(localStorage.getItem(NAME_KEY) || "");
      setLiked(new Set(JSON.parse(localStorage.getItem(LIKED_KEY) || "[]")));
    } catch {
      /* private mode — non-fatal, the fields just start empty */
    }
  }, []);

  const load = useCallback(async () => {
    try {
      const r = await fetch(`/api/comments?category=${encodeURIComponent(categoryKey)}`);
      const j = await r.json();
      if (j.unavailable) setUnavailable(true);
      setComments(Array.isArray(j.comments) ? j.comments : []);
    } catch {
      setUnavailable(true);
      setComments([]);
    } finally {
      setLoading(false);
    }
  }, [categoryKey]);

  useEffect(() => {
    load();
  }, [load]);

  async function post(text: string, parentId: string | null) {
    if (busy) return;
    setErr("");
    setNotice("");
    if (name.trim().length < 2) return setErr("Add a name so people know who they're replying to.");
    if (text.trim().length < 2) return setErr("Write a comment first.");

    setBusy(true);
    try {
      const r = await fetch("/api/comments", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          category: categoryKey,
          author: name.trim(),
          body: text.trim(),
          parentId,
          website: honeypot.current?.value || "",
        }),
      });
      const j = await r.json();
      if (!r.ok) {
        setErr(j.error || "Could not post that.");
        return;
      }
      try {
        localStorage.setItem(NAME_KEY, name.trim());
      } catch {
        /* non-fatal */
      }
      if (j.held) {
        setNotice(j.message);
      } else if (j.comment) {
        setComments((c) => [...c, j.comment as Comment]);
      }
      if (parentId) {
        setReplyBody("");
        setReplyTo(null);
      } else {
        setBody("");
      }
    } catch {
      setErr("Network error — try again.");
    } finally {
      setBusy(false);
    }
  }

  async function like(id: string) {
    if (liked.has(id)) return;
    setComments((c) => c.map((x) => (x.id === id ? { ...x, likes: x.likes + 1 } : x)));
    const next = new Set(liked).add(id);
    setLiked(next);
    try {
      localStorage.setItem(LIKED_KEY, JSON.stringify([...next]));
    } catch {
      /* non-fatal */
    }
    try {
      await fetch("/api/comments", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id }),
      });
    } catch {
      /* the optimistic bump stands; a lost like is not worth a rollback */
    }
  }

  const roots = comments.filter((c) => !c.parent_id);
  const repliesOf = (id: string) => comments.filter((c) => c.parent_id === id);

  function Row({ c, isReply }: { c: Comment; isReply?: boolean }) {
    return (
      <li className={isReply ? styles.reply : styles.item}>
        <Avatar name={c.author} host={c.is_host} />
        <div className={styles.bubbleWrap}>
          <div className={styles.bubble}>
            <span className={styles.author}>
              {c.author}
              {c.is_host && <span className={styles.hostTag}>Host</span>}
            </span>
            <p className={styles.body}>{c.body}</p>
          </div>
          <div className={styles.actions}>
            <button
              type="button"
              className={`${styles.action} ${liked.has(c.id) ? styles.actionOn : ""}`}
              onClick={() => like(c.id)}
            >
              Like{c.likes > 0 ? ` · ${c.likes}` : ""}
            </button>
            {!isReply && (
              <button
                type="button"
                className={styles.action}
                onClick={() => {
                  setReplyTo(replyTo === c.id ? null : c.id);
                  setReplyBody("");
                }}
              >
                Reply
              </button>
            )}
            <time className={styles.time} dateTime={c.created_at}>
              {ago(c.created_at)}
            </time>
          </div>

          {!isReply && repliesOf(c.id).length > 0 && (
            <ul className={styles.replies}>
              {repliesOf(c.id).map((r) => (
                <Row key={r.id} c={r} isReply />
              ))}
            </ul>
          )}

          {!isReply && replyTo === c.id && (
            <div className={styles.replyBox}>
              <textarea
                className={styles.replyInput}
                value={replyBody}
                onChange={(e) => setReplyBody(e.target.value)}
                placeholder={`Reply to ${c.author}…`}
                rows={2}
                maxLength={2000}
              />
              <button
                type="button"
                className={styles.postBtn}
                disabled={busy}
                onClick={() => post(replyBody, c.id)}
              >
                {busy ? "Posting…" : "Reply"}
              </button>
            </div>
          )}
        </div>
      </li>
    );
  }

  if (unavailable) return null;

  return (
    <section className={styles.wrap} aria-label={`Discussion about the ${boardLabel} board`}>
      <div className={styles.head}>
        <h2 className={styles.h}>Discussion</h2>
        <span className={styles.count}>
          {loading ? "…" : `${comments.length} comment${comments.length === 1 ? "" : "s"}`}
        </span>
      </div>

      <div className={styles.composer}>
        <Avatar name={name || "?"} />
        <div className={styles.composerFields}>
          <input
            className={styles.nameInput}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            maxLength={40}
            aria-label="Your name"
          />
          <textarea
            className={styles.bodyInput}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder={`Where did we get the ${boardLabel} order wrong?`}
            rows={3}
            maxLength={2000}
            aria-label="Your comment"
          />
          {/* Honeypot: off-screen, never focusable, bots fill it. */}
          <input
            ref={honeypot}
            className={styles.hp}
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
            name="website"
          />
          {err && <p className={styles.err}>{err}</p>}
          {notice && <p className={styles.notice}>{notice}</p>}
          <div className={styles.composerFoot}>
            <button
              type="button"
              className={styles.postBtn}
              disabled={busy}
              onClick={() => post(body, null)}
            >
              {busy ? "Posting…" : "Post comment"}
            </button>
            <span className={styles.fine}>
              Opinions on ranking, price and sourcing welcome. Anything describing a personal
              health outcome is held for review.
            </span>
          </div>
        </div>
      </div>

      {loading ? (
        <p className={styles.empty}>Loading discussion…</p>
      ) : roots.length === 0 ? (
        <div className={styles.emptyState}>
          <p className={styles.emptyLead}>No comments yet — be the first.</p>
          <p className={styles.empty}>
            The board opens in popularity order, which is a sales figure, not an argument. If you
            think something is ranked too high, too low, or overpriced, say so and say why.
          </p>
        </div>
      ) : (
        <ul className={styles.list}>
          {roots.map((c) => (
            <Row key={c.id} c={c} />
          ))}
        </ul>
      )}
    </section>
  );
}
