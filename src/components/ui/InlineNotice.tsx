import type { ReactNode } from "react";
import styles from "./InlineNotice.module.css";

interface InlineNoticeProps {
  tone?: "info" | "error";
  children: ReactNode;
}

export const InlineNotice = ({ tone = "info", children }: InlineNoticeProps) => (
  <p
    className={`${styles.notice} ${styles[tone]}`}
    role={tone === "error" ? "alert" : "status"}
  >
    {children}
  </p>
);
