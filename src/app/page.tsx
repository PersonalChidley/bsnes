import { EmulatorShell } from "@/components/EmulatorShell";
import Link from "next/link";

export default function Home() {
  return (
    <main>
      <nav className="topbar" aria-label="Project">
        <Link className="wordmark" href="/">
          bsnes<span>/web</span>
        </Link>
        <a href="https://github.com/PersonalChidley/bsnes">Source</a>
      </nav>
      <EmulatorShell />
      <footer>
        <p>
          An experimental browser frontend for bsnes. The emulator remains
          licensed under GPLv3.
        </p>
      </footer>
    </main>
  );
}
