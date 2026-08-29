import Link from "next/link";
import { CourseForm } from "@/features/courses/CourseForm";
import styles from "../courses.module.css";

export const metadata = { title: "Add course" };

const NewCoursePage = () => (
  <div className={styles.page}>
    <header className={styles.header}>
      <h1 className={styles.title}>Add course</h1>
      <Link href="/courses" className={styles.rowLink}>
        Cancel
      </Link>
    </header>
    <CourseForm mode="create" />
  </div>
);

export default NewCoursePage;
