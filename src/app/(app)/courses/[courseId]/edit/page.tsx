import Link from "next/link";
import { Button } from "@/components/ui";
import { CourseForm } from "@/features/courses/CourseForm";
import { TeeSetForm } from "@/features/courses/TeeSetForm";
import { deleteCourse } from "@/features/courses/actions";
import { getCourse } from "@/features/courses/service";
import type { HoleCount } from "@/features/courses/schema";
import styles from "../../courses.module.css";
import editStyles from "./edit.module.css";

export const metadata = { title: "Edit course" };

const EditCoursePage = async ({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) => {
  const { courseId } = await params;
  const course = await getCourse(courseId);
  const holeNumbers = course.holes.map((h) => h.holeNumber);

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>{course.name}</h1>
        <Link href="/courses" className={styles.rowLink}>
          Done
        </Link>
      </header>

      <CourseForm
        mode="edit"
        courseId={course.id}
        initialName={course.name}
        initialHoleCount={course.holeCount as HoleCount}
        initialPars={course.holes.map((h) => h.par)}
      />

      <section className={editStyles.section}>
        <h2 className={editStyles.sectionTitle}>Tee sets</h2>
        <p className={editStyles.sectionHint}>
          Optional. Add the tees you play and their yardages.
        </p>
        {course.teeSets.map((teeSet) => (
          <TeeSetForm
            key={teeSet.id}
            courseId={course.id}
            holeNumbers={holeNumbers}
            teeSet={teeSet}
          />
        ))}
        <TeeSetForm courseId={course.id} holeNumbers={holeNumbers} />
      </section>

      <section className={editStyles.danger}>
        <form action={deleteCourse}>
          <input type="hidden" name="courseId" value={course.id} />
          <Button type="submit" variant="ghost">
            Delete this course
          </Button>
        </form>
      </section>
    </div>
  );
};

export default EditCoursePage;
