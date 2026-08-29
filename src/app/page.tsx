import Link from "next/link";
import styles from "./page.module.css";

const Home = () => {
  return (
    <main className={styles.main}>
      <div className={styles.hero}>
        <p className={styles.kicker}>Shot Sense</p>
        <h1 className={styles.headline}>
          Understand where your score is really going.
        </h1>
        <p className={styles.sub}>
          Record a round in a few taps. Leave every round knowing which shots you
          can get back and what to work on next.
        </p>
        <div className={styles.ctas}>
          <Link href="/signup" className={styles.primary}>
            Start tracking your game
          </Link>
          <Link href="/login" className={styles.secondary}>
            Log in
          </Link>
        </div>
      </div>
    </main>
  );
};

export default Home;
