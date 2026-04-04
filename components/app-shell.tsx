import Link from "next/link";
import type { PropsWithChildren } from "react";

export function AppShell({ children }: PropsWithChildren) {
  return (
    <div className="shell">
      <header className="topbar">
        <Link href="/" className="brand">
          LocalTube
        </Link>
        <nav className="topnav">
          <Link href="/">Home</Link>
          <Link href="/shorts">Shorts</Link>
          <Link href="/watch-later">Watch later</Link>
          <Link href="/studio/upload">Studio</Link>
          <Link href="/studio/sleep-lab">Sleep Lab</Link>
          <Link href="/studio/sleep-library">Sleep Library</Link>
        </nav>
      </header>
      <main className="page">{children}</main>
    </div>
  );
}
