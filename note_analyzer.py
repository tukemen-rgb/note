#!/usr/bin/env python3
"""note.com analyzer CLI.

Three modes:
  user <keyword>  : find creators whose profile matches a keyword
  note <keyword>  : find creators of posts matching a keyword
  tag  <tag>      : analyze posts tagged with a hashtag

Aggregates posting frequency, follower count, engagement rate, and the
highest / lowest "liked" posts within a recent window (default 90 days).
Outputs CSV (utf-8-sig) and prints a console dashboard.
"""
from __future__ import annotations

import argparse
import csv
import json
import os
import re
import sys
import time
from dataclasses import dataclass, asdict
from datetime import datetime, timedelta, timezone
from typing import Any, Iterable
from urllib.parse import quote

import requests

NOTE_BASE = "https://note.com"
USER_AGENT = "note-analyzer/0.1 (+https://example.com)"
DEFAULT_SLEEP = 0.6
DEFAULT_DAYS = 90
JST = timezone(timedelta(hours=9))


@dataclass
class CreatorRow:
    urlname: str
    nickname: str
    profile: str
    follower_count: int
    following_count: int
    note_count: int
    posts_in_window: int
    posts_per_week: float
    total_likes_in_window: int
    avg_likes_in_window: float
    engagement_rate_pct: float
    top_post_title: str
    top_post_url: str
    top_post_likes: int
    top_post_excerpt: str
    bottom_post_title: str
    bottom_post_url: str
    bottom_post_likes: int
    bottom_post_excerpt: str
    perplexity_summary: str = ""


def http_get(url: str, params: dict | None = None, retries: int = 4) -> dict | None:
    headers = {"User-Agent": USER_AGENT, "Accept": "application/json"}
    backoff = 2.0
    for attempt in range(retries + 1):
        try:
            r = requests.get(url, params=params, headers=headers, timeout=20)
        except requests.RequestException as e:
            if attempt == retries:
                print(f"[warn] request failed: {url} ({e})", file=sys.stderr)
                return None
            time.sleep(backoff)
            backoff *= 2
            continue
        if r.status_code == 429 or r.status_code >= 500:
            if attempt == retries:
                print(f"[warn] http {r.status_code}: {url}", file=sys.stderr)
                return None
            time.sleep(backoff)
            backoff *= 2
            continue
        if r.status_code == 404:
            return None
        if not r.ok:
            print(f"[warn] http {r.status_code}: {url}", file=sys.stderr)
            return None
        try:
            return r.json()
        except json.JSONDecodeError:
            print(f"[warn] non-json response: {url}", file=sys.stderr)
            return None
    return None


def parse_dt(value: str | None) -> datetime | None:
    if not value:
        return None
    s = value.replace("Z", "+00:00")
    try:
        return datetime.fromisoformat(s)
    except ValueError:
        for fmt in ("%Y-%m-%dT%H:%M:%S%z", "%Y-%m-%dT%H:%M:%S.%f%z", "%Y-%m-%d %H:%M:%S"):
            try:
                return datetime.strptime(value, fmt)
            except ValueError:
                continue
    return None


def excerpt(text: str | None, n: int = 400) -> str:
    if not text:
        return ""
    cleaned = re.sub(r"<[^>]+>", " ", text)
    cleaned = re.sub(r"\s+", " ", cleaned).strip()
    return cleaned[:n]


def search_creators(keyword: str, max_items: int) -> list[str]:
    """Return urlnames of creators matched by keyword in profile."""
    urlnames: list[str] = []
    seen: set[str] = set()
    page = 1
    while len(urlnames) < max_items:
        data = http_get(
            f"{NOTE_BASE}/api/v2/searches",
            params={"context": "user", "q": keyword, "page": page, "size": 20},
        )
        if not data:
            break
        users = (data.get("data") or {}).get("users") or data.get("users") or []
        if not users:
            break
        for u in users:
            urlname = u.get("urlname") or u.get("url_name") or u.get("user", {}).get("urlname")
            if urlname and urlname not in seen:
                seen.add(urlname)
                urlnames.append(urlname)
                if len(urlnames) >= max_items:
                    break
        if not (data.get("data") or {}).get("is_last_page", False) and len(users) >= 20:
            page += 1
            time.sleep(DEFAULT_SLEEP)
        else:
            break
    return urlnames


def search_notes(keyword: str, max_items: int) -> list[dict]:
    """Return raw note dicts matched by keyword in post content."""
    notes: list[dict] = []
    page = 1
    while len(notes) < max_items:
        data = http_get(
            f"{NOTE_BASE}/api/v2/searches",
            params={"context": "note", "q": keyword, "page": page, "size": 20},
        )
        if not data:
            break
        items = (data.get("data") or {}).get("notes") or data.get("notes") or []
        if not items:
            break
        notes.extend(items)
        if len(items) < 20:
            break
        page += 1
        time.sleep(DEFAULT_SLEEP)
    return notes[:max_items]


def search_hashtag(tag: str, max_items: int) -> list[dict]:
    """Return raw note dicts under a hashtag."""
    notes: list[dict] = []
    page = 1
    encoded = quote(tag, safe="")
    while len(notes) < max_items:
        data = http_get(
            f"{NOTE_BASE}/api/v2/hashtags/{encoded}/notes",
            params={"page": page, "size": 20},
        )
        if not data:
            break
        items = (data.get("data") or {}).get("notes") or data.get("notes") or []
        if not items:
            break
        notes.extend(items)
        if len(items) < 20:
            break
        page += 1
        time.sleep(DEFAULT_SLEEP)
    return notes[:max_items]


def fetch_creator(urlname: str) -> dict | None:
    return http_get(f"{NOTE_BASE}/api/v2/creators/{urlname}")


def fetch_creator_notes(urlname: str, max_pages: int = 5) -> list[dict]:
    out: list[dict] = []
    for page in range(1, max_pages + 1):
        data = http_get(
            f"{NOTE_BASE}/api/v2/creators/{urlname}/contents",
            params={"kind": "note", "page": page},
        )
        if not data:
            break
        items = (data.get("data") or {}).get("contents") or data.get("contents") or []
        if not items:
            break
        out.extend(items)
        if (data.get("data") or {}).get("is_last_page"):
            break
        time.sleep(DEFAULT_SLEEP)
    return out


def note_url(note: dict, urlname: str | None = None) -> str:
    key = note.get("key") or note.get("note_id") or note.get("id")
    user = urlname or (note.get("user") or {}).get("urlname") or note.get("urlname")
    if user and key:
        return f"{NOTE_BASE}/{user}/n/{key}"
    if key:
        return f"{NOTE_BASE}/n/{key}"
    return ""


def analyze_creator(urlname: str, days: int, perplexity_key: str | None) -> CreatorRow | None:
    profile = fetch_creator(urlname)
    if not profile:
        return None
    p = (profile.get("data") or profile)
    nickname = p.get("nickname") or p.get("name") or urlname
    bio = p.get("profile") or p.get("description") or ""
    follower_count = int(p.get("follower_count") or p.get("followerCount") or 0)
    following_count = int(p.get("following_count") or p.get("followingCount") or 0)
    note_count = int(p.get("note_count") or p.get("noteCount") or 0)

    notes = fetch_creator_notes(urlname)
    cutoff = datetime.now(timezone.utc) - timedelta(days=days)
    recent: list[dict] = []
    for n in notes:
        published = parse_dt(n.get("publish_at") or n.get("published_at") or n.get("created_at"))
        if published and published >= cutoff:
            recent.append(n)

    posts_in_window = len(recent)
    posts_per_week = round(posts_in_window / days * 7, 2) if days else 0.0
    likes_list = [int(n.get("like_count") or n.get("likeCount") or 0) for n in recent]
    total_likes = sum(likes_list)
    avg_likes = round(total_likes / posts_in_window, 2) if posts_in_window else 0.0

    if follower_count and posts_in_window:
        engagement = round(total_likes / (follower_count * posts_in_window) * 100, 3)
    else:
        engagement = 0.0

    top_note = max(recent, key=lambda n: int(n.get("like_count") or 0), default=None)
    bottom_note = min(recent, key=lambda n: int(n.get("like_count") or 0), default=None)

    def fields(n: dict | None) -> tuple[str, str, int, str]:
        if not n:
            return ("", "", 0, "")
        return (
            n.get("name") or n.get("title") or "",
            note_url(n, urlname),
            int(n.get("like_count") or 0),
            excerpt(n.get("body") or n.get("description") or ""),
        )

    top_t, top_u, top_l, top_e = fields(top_note)
    bot_t, bot_u, bot_l, bot_e = fields(bottom_note)

    summary = ""
    if perplexity_key and recent:
        summary = perplexity_summary(perplexity_key, nickname, recent[:10])

    return CreatorRow(
        urlname=urlname,
        nickname=nickname,
        profile=excerpt(bio, 200),
        follower_count=follower_count,
        following_count=following_count,
        note_count=note_count,
        posts_in_window=posts_in_window,
        posts_per_week=posts_per_week,
        total_likes_in_window=total_likes,
        avg_likes_in_window=avg_likes,
        engagement_rate_pct=engagement,
        top_post_title=top_t,
        top_post_url=top_u,
        top_post_likes=top_l,
        top_post_excerpt=top_e,
        bottom_post_title=bot_t,
        bottom_post_url=bot_u,
        bottom_post_likes=bot_l,
        bottom_post_excerpt=bot_e,
        perplexity_summary=summary,
    )


def perplexity_summary(api_key: str, nickname: str, notes: list[dict]) -> str:
    titles = "\n".join(
        f"- {(n.get('name') or n.get('title') or '').strip()}: {(n.get('description') or '')[:120]}"
        for n in notes
    )
    prompt = (
        f"以下はnote.comクリエイター『{nickname}』の最近の投稿一覧です。"
        "投稿内容に共通する特徴やテーマを3点、日本語の箇条書きで簡潔に述べてください。\n\n"
        f"{titles}"
    )
    try:
        r = requests.post(
            "https://api.perplexity.ai/chat/completions",
            headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
            json={
                "model": "sonar",
                "messages": [{"role": "user", "content": prompt}],
                "max_tokens": 400,
            },
            timeout=30,
        )
        r.raise_for_status()
        data = r.json()
        return data["choices"][0]["message"]["content"].strip()
    except Exception as e:
        print(f"[warn] perplexity failed: {e}", file=sys.stderr)
        return ""


def write_csv(path: str, rows: Iterable[CreatorRow]) -> None:
    rows = list(rows)
    if not rows:
        print("[info] no rows to write", file=sys.stderr)
        return
    fieldnames = list(asdict(rows[0]).keys())
    with open(path, "w", encoding="utf-8-sig", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        for row in rows:
            writer.writerow(asdict(row))


def print_dashboard(rows: list[CreatorRow]) -> None:
    if not rows:
        print("no data")
        return
    n = len(rows)
    avg_followers = sum(r.follower_count for r in rows) / n
    avg_freq = sum(r.posts_per_week for r in rows) / n
    avg_eng = sum(r.engagement_rate_pct for r in rows) / n
    print()
    print(f"=== summary ({n} creators) ===")
    print(f"avg followers     : {avg_followers:,.1f}")
    print(f"avg posts/week    : {avg_freq:.2f}")
    print(f"avg engagement %  : {avg_eng:.3f}")
    print()
    top = sorted(rows, key=lambda r: r.engagement_rate_pct, reverse=True)[:10]
    print("=== top 10 by engagement ===")
    for r in top:
        print(
            f"  {r.engagement_rate_pct:6.3f}%  followers={r.follower_count:>7}  "
            f"posts/wk={r.posts_per_week:>5.2f}  @{r.urlname}  ({r.nickname})"
        )


def collect_urlnames_from_notes(notes: list[dict]) -> list[str]:
    seen: set[str] = set()
    out: list[str] = []
    for n in notes:
        user = n.get("user") or {}
        urlname = user.get("urlname") or n.get("urlname")
        if urlname and urlname not in seen:
            seen.add(urlname)
            out.append(urlname)
    return out


def cmd_user(args: argparse.Namespace) -> list[CreatorRow]:
    urlnames = search_creators(args.keyword, args.max)
    print(f"[info] matched {len(urlnames)} creators", file=sys.stderr)
    return analyze_many(urlnames, args)


def cmd_note(args: argparse.Namespace) -> list[CreatorRow]:
    notes = search_notes(args.keyword, args.max)
    urlnames = collect_urlnames_from_notes(notes)
    print(f"[info] matched {len(notes)} notes from {len(urlnames)} creators", file=sys.stderr)
    return analyze_many(urlnames[: args.max], args)


def cmd_tag(args: argparse.Namespace) -> list[CreatorRow]:
    notes = search_hashtag(args.keyword, args.max)
    urlnames = collect_urlnames_from_notes(notes)
    print(f"[info] hashtag '{args.keyword}': {len(notes)} notes, {len(urlnames)} creators",
          file=sys.stderr)
    return analyze_many(urlnames[: args.max], args)


def analyze_many(urlnames: list[str], args: argparse.Namespace) -> list[CreatorRow]:
    key = os.environ.get("PERPLEXITY_API_KEY") if args.perplexity else None
    rows: list[CreatorRow] = []
    for i, u in enumerate(urlnames, 1):
        print(f"[{i}/{len(urlnames)}] {u}", file=sys.stderr)
        row = analyze_creator(u, args.days, key)
        if row:
            rows.append(row)
        time.sleep(DEFAULT_SLEEP)
    return rows


def build_parser() -> argparse.ArgumentParser:
    p = argparse.ArgumentParser(description="note.com analyzer")
    p.add_argument("--days", type=int, default=DEFAULT_DAYS, help="analysis window in days")
    p.add_argument("--max", type=int, default=30, help="max creators to analyze")
    p.add_argument("--out", default="note_analysis.csv", help="output CSV path")
    p.add_argument("--perplexity", action="store_true",
                   help="enrich with Perplexity summary (requires PERPLEXITY_API_KEY)")
    sub = p.add_subparsers(dest="mode", required=True)
    for mode in ("user", "note", "tag"):
        s = sub.add_parser(mode)
        s.add_argument("keyword")
    return p


def main(argv: list[str] | None = None) -> int:
    args = build_parser().parse_args(argv)
    if args.mode == "user":
        rows = cmd_user(args)
    elif args.mode == "note":
        rows = cmd_note(args)
    else:
        rows = cmd_tag(args)
    write_csv(args.out, rows)
    print_dashboard(rows)
    print(f"\n[done] wrote {len(rows)} rows to {args.out}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
