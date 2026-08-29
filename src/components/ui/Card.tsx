import type { ElementType, ReactNode } from "react";
import styles from "./Card.module.css";

interface CardProps {
  as?: ElementType;
  children: ReactNode;
  className?: string;
}

export const Card = ({ as: Tag = "div", children, className }: CardProps) => (
  <Tag className={`${styles.card} ${className ?? ""}`}>{children}</Tag>
);
