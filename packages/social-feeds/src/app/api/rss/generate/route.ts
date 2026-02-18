import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

type RSSItemInput = {
  title: string;
  link: string;
  description?: string;
  guid?: string;
  pubDate?: string;
};

type RSSPayload = {
  title: string;
  description: string;
  siteUrl: string;
  language?: string;
  feedPath?: string;
  items: RSSItemInput[];
};

const escapeXml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");

const toRssXml = (payload: RSSPayload) => {
  const language = payload.language?.trim() || "en-US";
  const feedPath = payload.feedPath?.trim() || "/rss.xml";
  const feedUrl = new URL(feedPath, payload.siteUrl).toString();

  const itemsXml = payload.items
    .map((item) => {
      const title = escapeXml(item.title.trim());
      const link = escapeXml(item.link.trim());
      const description = escapeXml((item.description || "").trim());
      const guid = escapeXml((item.guid || item.link).trim());
      const parsedDate = item.pubDate ? new Date(item.pubDate) : new Date();
      const pubDate = Number.isNaN(parsedDate.getTime())
        ? new Date().toUTCString()
        : parsedDate.toUTCString();
      return [
        "<item>",
        `<title>${title}</title>`,
        `<link>${link}</link>`,
        `<description>${description}</description>`,
        `<guid>${guid}</guid>`,
        `<pubDate>${pubDate}</pubDate>`,
        "</item>",
      ].join("");
    })
    .join("");

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0">',
    "<channel>",
    `<title>${escapeXml(payload.title.trim())}</title>`,
    `<link>${escapeXml(payload.siteUrl.trim())}</link>`,
    `<description>${escapeXml(payload.description.trim())}</description>`,
    `<language>${escapeXml(language)}</language>`,
    `<atom:link href="${escapeXml(feedUrl)}" rel="self" type="application/rss+xml" xmlns:atom="http://www.w3.org/2005/Atom" />`,
    itemsXml,
    "</channel>",
    "</rss>",
  ].join("");
};

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await req.json()) as RSSPayload;
    const items = Array.isArray(body.items) ? body.items : [];

    if (!body.title || !body.description || !body.siteUrl) {
      return NextResponse.json(
        { error: "title, description, and siteUrl are required" },
        { status: 400 }
      );
    }

    if (items.length === 0) {
      return NextResponse.json(
        { error: "At least one RSS item is required" },
        { status: 400 }
      );
    }

    for (const item of items) {
      if (!item.title || !item.link) {
        return NextResponse.json(
          { error: "Each item needs title and link" },
          { status: 400 }
        );
      }
      try {
        new URL(item.link);
      } catch {
        return NextResponse.json(
          { error: `Invalid item link: ${item.link}` },
          { status: 400 }
        );
      }
    }

    try {
      new URL(body.siteUrl);
    } catch {
      return NextResponse.json(
        { error: "siteUrl must be a valid absolute URL" },
        { status: 400 }
      );
    }

    const xml = toRssXml({
      ...body,
      items,
    });

    return new NextResponse(xml, {
      headers: {
        "Content-Type": "application/rss+xml; charset=utf-8",
        "Content-Disposition": 'inline; filename="feed.xml"',
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to generate RSS feed";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
