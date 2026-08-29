import Link from "next/link";
import { Card } from "@/components/ui";
import { listCourses } from "@/features/courses/service";
import styles from "./courses.module.css";

export const metadata = { title: "Courses" };

const CoursesPage = async () => {
  const courses = await listCourses();

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Courses</h1>
        <Link href="/courses/new" className={styles.add}>
          Add course
        </Link>
      </header>

      {courses.length === 0 ? (
        <Card>
          <p className={styles.empty}>
            No courses yet. Add one once and reuse it for every round there.
          </p>
        </Card>
      ) : (
        <ul className={styles.list}>
          {courses.map((course) => (
            <li key={course.id}>
              <Link
                href={`/courses/${course.id}/edit`}
                className={styles.rowLink}
              >
                <Card>
                  <span className={styles.name}>{course.name}</span>
                  <span className={styles.meta}>
                    {course.holeCount} holes
                    {course.teeSetCount > 0
                      ? ` · ${course.teeSetCount} tee${course.teeSetCount === 1 ? "" : "s"}`
                      : ""}
                  </span>
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default CoursesPage;
