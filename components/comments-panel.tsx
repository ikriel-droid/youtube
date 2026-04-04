"use client";

import { useState } from "react";

import { formatDate } from "@/lib/format";
import type { CommentRecord } from "@/lib/types";

interface CommentsPanelProps {
  videoId: string;
  initialComments: CommentRecord[];
}

export function CommentsPanel({ videoId, initialComments }: CommentsPanelProps) {
  const [comments, setComments] = useState(initialComments);
  const [author, setAuthor] = useState("");
  const [body, setBody] = useState("");
  const [status, setStatus] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setStatus("");

    const response = await fetch(`/api/videos/${videoId}/comments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ author, body })
    });

    if (!response.ok) {
      setStatus(await extractError(response, "Comment failed."));
      setSubmitting(false);
      return;
    }

    const payload = (await response.json()) as { comment: CommentRecord };
    setComments((current) => [payload.comment, ...current]);
    setAuthor("");
    setBody("");
    setStatus("Comment posted.");
    setSubmitting(false);
  }

  return (
    <section className="panel">
      <div className="panelHeader">
        <h2>Comments</h2>
        <span>{comments.length}</span>
      </div>

      <form className="commentForm" onSubmit={handleSubmit}>
        <input
          value={author}
          onChange={(event) => setAuthor(event.target.value)}
          placeholder="Your name"
          maxLength={40}
          required
        />
        <textarea
          value={body}
          onChange={(event) => setBody(event.target.value)}
          placeholder="Write something useful"
          maxLength={300}
          required
          rows={4}
        />
        <div className="inlineActions">
          <button className="primaryButton" type="submit" disabled={submitting}>
            {submitting ? "Posting..." : "Post Comment"}
          </button>
          {status ? <p className="statusText">{status}</p> : null}
        </div>
      </form>

      <div className="stack">
        {comments.map((comment) => (
          <article key={comment.id} className="commentCard">
            <div className="commentHead">
              <strong>{comment.author}</strong>
              <span>{formatDate(comment.createdAt)}</span>
            </div>
            <p>{comment.body}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

async function extractError(response: Response, fallback: string) {
  try {
    const payload = (await response.json()) as { error?: string };
    return payload.error || fallback;
  } catch {
    return fallback;
  }
}
