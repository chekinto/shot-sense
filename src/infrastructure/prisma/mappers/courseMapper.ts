import type {
  CourseHole as PrismaCourseHole,
  GolfCourse as PrismaGolfCourse,
  TeeHoleYardage as PrismaTeeHoleYardage,
  TeeSet as PrismaTeeSet,
} from "@prisma/client";
import type { Course, CourseSummary } from "@/features/courses/types";

type CourseWithRelations = PrismaGolfCourse & {
  holes: PrismaCourseHole[];
  teeSets: (PrismaTeeSet & { yardages: PrismaTeeHoleYardage[] })[];
};

/** Prisma course (+ holes, tee sets, yardages) -> application course. */
export const toCourse = (row: CourseWithRelations): Course => {
  const holeNumberById = new Map(row.holes.map((h) => [h.id, h.holeNumber]));

  return {
    id: row.id,
    name: row.name,
    holeCount: row.holeCount,
    holes: [...row.holes]
      .sort((a, b) => a.holeNumber - b.holeNumber)
      .map((h) => ({ holeNumber: h.holeNumber, par: h.par })),
    teeSets: [...row.teeSets]
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((tee) => ({
        id: tee.id,
        name: tee.name,
        yardages: tee.yardages
          .map((y) => ({
            holeNumber: holeNumberById.get(y.courseHoleId) ?? 0,
            yardage: y.yardage,
          }))
          .filter((y) => y.holeNumber > 0)
          .sort((a, b) => a.holeNumber - b.holeNumber),
      })),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
};

type CourseSummaryRow = PrismaGolfCourse & { _count: { teeSets: number } };

export const toCourseSummary = (row: CourseSummaryRow): CourseSummary => ({
  id: row.id,
  name: row.name,
  holeCount: row.holeCount,
  teeSetCount: row._count.teeSets,
  updatedAt: row.updatedAt,
});
