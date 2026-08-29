import styles from "./page.module.css";

export const metadata = { title: "Offline" };

const OfflinePage = () => {
  return (
    <main className={styles.main}>
      <div className={styles.box}>
        <h1>You&rsquo;re offline</h1>
        <p>
          Shot Sense keeps your active round on this device. Reconnect to sync it
          — nothing is lost.
        </p>
      </div>
    </main>
  );
};

export default OfflinePage;
