"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { profile, projects } from "@/content/portfolio";
import { complete, runCommand, type TerminalLine } from "@/lib/terminal.mjs";
import { useSettings } from "@/components/os/OsSettings";
import { hiddenApps, type AppId } from "./registry";

/** When the page loaded, for `neofetch` uptime. */
const PAGE_START = Date.now();
const PROMPT_USER = profile.name.split(" ")[0].toLowerCase();
const QUICK = ["help", "whoami", "ls projects", "skills", "neofetch", "contact", "sudo hire-me"];

type Entry = { id: number; input?: string; line?: TerminalLine };

export default function TerminalApp({ onOpen, onClose }: { onOpen: (id: AppId, resource?: string) => void; onClose?: () => void }) {
  const { settings, update } = useSettings();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [input, setInput] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [cursor, setCursor] = useState(-1);
  const nextId = useRef(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const screen = useRef<HTMLDivElement>(null);
  const id = () => nextId.current++;

  useEffect(() => { inputRef.current?.focus({ preventScroll: true }); }, []);
  useEffect(() => { screen.current?.scrollTo({ top: screen.current.scrollHeight }); }, [entries]);

  const print = (lines: TerminalLine[]) => setEntries(list => [...list, ...lines.map(line => ({ id: id(), line }))]);

  const submit = (command: string) => {
    const trimmed = command.trim();
    setEntries(list => [...list, { id: id(), input: command }]);
    setInput("");
    setCursor(-1);
    if (!trimmed) return;
    const nextHistory = [...history, trimmed].slice(-50);
    setHistory(nextHistory);
    const result = runCommand(trimmed, { profile, projects, history: nextHistory, theme: settings.theme, now: new Date(), startedAt: PAGE_START, hiddenApps });
    if (result.effect?.type === "clear") { setEntries([]); return; }
    print(result.lines);
    const effect = result.effect;
    if (!effect) return;
    // Let the output render first, then act (feels like the command "did" something).
    setTimeout(() => {
      if (effect.type === "open") onOpen(effect.app, effect.resource);
      else if (effect.type === "link") window.open(effect.href, "_blank", "noopener,noreferrer");
      else if (effect.type === "theme") update({ type: "theme", value: effect.value });
      else if (effect.type === "close") onClose?.();
    }, 350);
  };

  const onKey = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") { event.preventDefault(); submit(input); }
    else if (event.key === "ArrowUp" && history.length) {
      event.preventDefault();
      const next = cursor < 0 ? history.length - 1 : Math.max(0, cursor - 1);
      setCursor(next); setInput(history[next]);
    } else if (event.key === "ArrowDown" && cursor >= 0) {
      event.preventDefault();
      const next = cursor + 1;
      if (next >= history.length) { setCursor(-1); setInput(""); } else { setCursor(next); setInput(history[next]); }
    } else if (event.key === "Tab") {
      event.preventDefault();
      const result = complete(input, { profile, projects, history, theme: settings.theme, now: new Date(), startedAt: PAGE_START, hiddenApps });
      setInput(result.value);
      if (result.options.length) print([{ text: result.options.join("   "), tone: "muted" }]);
    } else if (event.key.toLowerCase() === "l" && event.ctrlKey) { event.preventDefault(); setEntries([]); }
    else if (event.key.toLowerCase() === "c" && event.ctrlKey && !window.getSelection()?.toString()) {
      event.preventDefault();
      setEntries(list => [...list, { id: id(), input: input + "^C" }]);
      setInput("");
    }
  };

  const prompt = <span className="term-prompt"><span className="term-user">{PROMPT_USER}@dhruvos</span>:<span className="term-path">~</span>$</span>;

  return (
    <div className="terminal-app" onMouseUp={() => { if (!window.getSelection()?.toString()) inputRef.current?.focus({ preventScroll: true }); }}>
      <div className="term-quick" aria-label="Quick commands">
        {QUICK.map(command => <button key={command} onClick={() => submit(command)}>{command}</button>)}
      </div>
      <div ref={screen} className="term-screen" role="log" aria-live="polite" aria-label="Terminal output">
        <p className="term-line tone-accent">DhruvOS Terminal [Version 2.0]</p>
        <p className="term-line tone-muted">Type <button className="term-cmd" onClick={() => submit("help")}>help</button> to get started, or click a command above.</p>
        <p className="term-line">&nbsp;</p>
        {entries.map(entry => entry.input !== undefined ? (
          <p key={entry.id} className="term-line term-echo">{prompt} {entry.input}</p>
        ) : entry.line ? (
          <p key={entry.id} className={"term-line" + (entry.line.tone ? " tone-" + entry.line.tone : "")}>
            {entry.line.href ? <a href={entry.line.href} target={entry.line.href.startsWith("mailto:") ? undefined : "_blank"} rel="noopener noreferrer">{entry.line.text}</a>
              : entry.line.command ? <button className="term-cmd" onClick={() => submit(entry.line!.command!)} title={"Run: " + entry.line.command}>{entry.line.text}</button>
              : entry.line.text}
          </p>
        ) : null)}
        <label className="term-input-row">
          {prompt}
          <input ref={inputRef} value={input} onChange={event => { setInput(event.target.value); setCursor(-1); }} onKeyDown={onKey}
            aria-label="Terminal command" autoComplete="off" autoCapitalize="off" spellCheck={false} />
        </label>
      </div>
    </div>
  );
}
