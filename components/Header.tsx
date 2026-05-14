import Link from "next/link";
import Image from "next/image";
import { SignedIn, SignedOut, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
import styles from "./Header.module.css";

export function Header() {
  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <Link href="/" className={styles.brand}>
          <Image src="/logo.jpg" alt="StoryShorts" width={40} height={40} className={styles.brandImage} />
          <strong className={styles.brandName}>StoryShorts</strong>
        </Link>

        <nav className={styles.nav}>
          <Link href="/catalog" className={styles.navLink}>
            Browse
          </Link>
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