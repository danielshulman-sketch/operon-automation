"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Plus, Trash2, Download, Copy } from "lucide-react";

type FeedItem = {
  title: string;
  link: string;
  description: string;
  pubDate: string;
};

const emptyItem = (): FeedItem => ({
  title: "",
  link: "",
  description: "",
  pubDate: new Date().toISOString(),
});

export default function RSSGeneratorPage() {
  const [title, setTitle] = useState("My Blog Feed");
  const [description, setDescription] = useState("Latest updates from my site.");
  const [siteUrl, setSiteUrl] = useState("https://example.com");
  const [feedPath, setFeedPath] = useState("/rss.xml");
  const [items, setItems] = useState<FeedItem[]>([emptyItem()]);
  const [xmlOutput, setXmlOutput] = useState("");
  const [loading, setLoading] = useState(false);

  const updateItem = (index: number, key: keyof FeedItem, value: string) => {
    const next = [...items];
    next[index] = { ...next[index], [key]: value };
    setItems(next);
  };

  const addItem = () => setItems((prev) => [...prev, emptyItem()]);
  const removeItem = (index: number) =>
    setItems((prev) => prev.filter((_, itemIndex) => itemIndex !== index));

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/rss/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          siteUrl,
          feedPath,
          items,
        }),
      });

      const text = await res.text();
      if (!res.ok) {
        throw new Error(text || "Failed to generate feed");
      }

      setXmlOutput(text);
      toast.success("RSS feed generated");
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to generate RSS feed";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!xmlOutput) return;
    await navigator.clipboard.writeText(xmlOutput);
    toast.success("RSS XML copied");
  };

  const handleDownload = () => {
    if (!xmlOutput) return;
    const blob = new Blob([xmlOutput], { type: "application/rss+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "feed.xml";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-8 space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">RSS Generator</h2>
        <p className="text-muted-foreground mt-1">
          Create RSS 2.0 feed XML from your content and download it as `feed.xml`.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Feed Details</CardTitle>
          <CardDescription>Set channel metadata for your RSS feed.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label>Feed Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Site Updates" />
          </div>
          <div className="grid gap-2">
            <Label>Feed Description</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>Site URL</Label>
              <Input value={siteUrl} onChange={(e) => setSiteUrl(e.target.value)} placeholder="https://example.com" />
            </div>
            <div className="grid gap-2">
              <Label>Feed Path</Label>
              <Input value={feedPath} onChange={(e) => setFeedPath(e.target.value)} placeholder="/rss.xml" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Feed Items</CardTitle>
          <CardDescription>Add entries that should appear in the feed.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {items.map((item, index) => (
            <div key={index} className="rounded-md border p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">Item {index + 1}</p>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => removeItem(index)}
                  disabled={items.length === 1}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
              <Input
                placeholder="Item title"
                value={item.title}
                onChange={(e) => updateItem(index, "title", e.target.value)}
              />
              <Input
                placeholder="https://example.com/post"
                value={item.link}
                onChange={(e) => updateItem(index, "link", e.target.value)}
              />
              <Textarea
                placeholder="Optional item description"
                value={item.description}
                onChange={(e) => updateItem(index, "description", e.target.value)}
              />
              <Input
                type="datetime-local"
                value={item.pubDate ? item.pubDate.slice(0, 16) : ""}
                onChange={(e) => {
                  const value = e.target.value;
                  updateItem(
                    index,
                    "pubDate",
                    value ? new Date(value).toISOString() : new Date().toISOString()
                  );
                }}
              />
            </div>
          ))}

          <div className="flex gap-2">
            <Button variant="outline" onClick={addItem}>
              <Plus className="w-4 h-4 mr-2" />
              Add Item
            </Button>
            <Button onClick={handleGenerate} disabled={loading}>
              {loading ? "Generating..." : "Generate RSS XML"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Generated XML</CardTitle>
          <CardDescription>Copy or download your feed file.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleCopy} disabled={!xmlOutput}>
              <Copy className="w-4 h-4 mr-2" />
              Copy XML
            </Button>
            <Button variant="outline" onClick={handleDownload} disabled={!xmlOutput}>
              <Download className="w-4 h-4 mr-2" />
              Download feed.xml
            </Button>
          </div>
          <Textarea value={xmlOutput} readOnly className="min-h-[280px] font-mono text-xs" />
        </CardContent>
      </Card>
    </div>
  );
}
