import Link from "next/link";
import Image from "next/image";
import { SignedIn, SignedOut, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
import styles from "./Header.module.css";

export function Header() {
  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <Link href="/" className={styles.brand}>
          <Image src="/logo.jpg" alt="StoryShorts logo" width={42} height={42} className={styles.brandImage} />
          <span>
            <strong>StoryShorts</strong>
            <small>cinematic audio fiction</small>
          </span>
        </Link>

        <nav className={styles.nav}>
          <Link href="/catalog">Catalog</Link>
          <Link href="/subscribe">Subscribe</Link>
        </nav>

        <div className={styles.actions}>
          <SignedOut>
            <SignInButton mode="modal">
              <button type="button" className="buttonGhost">
                Sign in
              </button>
            </SignInButton>
            <SignUpButton mode="modal">
              <button type="button" className="buttonPrimary">
                Join
              </button>
            </SignUpButton>
          </SignedOut>
          <SignedIn>
            <Link href="/player" className="buttonGhost">
              Player
            </Link>
            <UserButton afterSignOutUrl="/" />
          </SignedIn>
        </div>
      </div>
    </header>
  );
}
