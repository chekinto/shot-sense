import "server-only";
import { prisma } from "../client";
import { toCourse, toCourseSummary } from "../mappers/courseMapper";
import type { CourseInput, TeeSetInput } from "@/features/courses/schema";
import type { Course, CourseSummary } from "@/features/courses/types";

const courseInclude = {
  holes: true,
  teeSets: { include: { yardages: true } },
} as const;

/** Raised when a course does not exist or is not owned by the acting user. */
export class CourseNotFoundError extends Error {
  constructor() {
    super("Course not found");
    this.name = "CourseNotFoundError";
  }
}

/** Raised on a duplicate tee-set name within a course. */
export class DuplicateTeeSetNameError extends Error {
  constructor() {
    super("A tee set with that name already exists");
    this.name = "DuplicateTeeSetNameError";
  }
}

const assertOwned = async (userId: string, courseId: string): Promise<void> => {
  const owned = await prisma.golfCourse.findFirst({
    where: { id: courseId, userId },
    select: { id: true },
  });
  if (!owned) throw new CourseNotFoundError();
};

const loadCourse = async (courseId: string): Promise<Course> => {
  const row = await prisma.golfCourse.findUniqueOrThrow({
    where: { id: courseId },
    include: courseInclude,
  });
  return toCourse(row);
};

/** Map hole numbers to their `course_holes.id` for the given course. */
const holeIdByNumber = async (
  courseId: string,
): Promise<Map<number, string>> => {
  const holes = await prisma.courseHole.findMany({
    where: { courseId },
    select: { id: true, holeNumber: true },
  });
  return new Map(holes.map((h) => [h.holeNumber, h.id]));
};

const isUniqueViolation = (error: unknown): boolean =>
  typeof error === "object" &&
  error !== null &&
  "code" in error &&
  (error as { code?: string }).code === "P2002";

/**
 * §100 — course repository. Every method takes the authenticated user id and
 * scopes to it; writes assert ownership first.
 */
export const courseRepository = {
  async listByUser(userId: string): Promise<CourseSummary[]> {
    const rows = await prisma.golfCourse.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      include: { _count: { select: { teeSets: true } } },
    });
    return rows.map(toCourseSummary);
  },

  async findById(userId: string, courseId: string): Promise<Course | null> {
    const row = await prisma.golfCourse.findFirst({
      where: { id: courseId, userId },
      include: courseInclude,
    });
    return row ? toCourse(row) : null;
  },

  async create(userId: string, input: CourseInput): Promise<Course> {
    const row = await prisma.golfCourse.create({
      data: {
        userId,
        name: input.name,
        holeCount: input.holeCount,
        holes: {
          create: input.pars.map((par, index) => ({
            holeNumber: index + 1,
            par,
          })),
        },
      },
      include: courseInclude,
    });
    return toCourse(row);
  },

  /** Updates name and per-hole par. Hole count is fixed after creation. */
  async updateDetails(
    userId: string,
    courseId: string,
    input: CourseInput,
  ): Promise<Course> {
    await assertOwned(userId, courseId);
    await prisma.$transaction([
      prisma.golfCourse.update({
        where: { id: courseId },
        data: { name: input.name },
      }),
      ...input.pars.map((par, index) =>
        prisma.courseHole.update({
          where: {
            courseId_holeNumber: { courseId, holeNumber: index + 1 },
          },
          data: { par },
        }),
      ),
    ]);
    return loadCourse(courseId);
  },

  async remove(userId: string, courseId: string): Promise<void> {
    await assertOwned(userId, courseId);
    await prisma.golfCourse.delete({ where: { id: courseId } });
  },

  async addTeeSet(
    userId: string,
    courseId: string,
    input: TeeSetInput,
  ): Promise<Course> {
    await assertOwned(userId, courseId);
    const holeIds = await holeIdByNumber(courseId);
    try {
      await prisma.teeSet.create({
        data: {
          courseId,
          name: input.name,
          yardages: {
            create: input.yardages
              .filter((y) => y.yardage !== null)
              .flatMap((y) => {
                const courseHoleId = holeIds.get(y.holeNumber);
                return courseHoleId
                  ? [{ courseHoleId, yardage: y.yardage as number }]
                  : [];
              }),
          },
        },
      });
    } catch (error) {
      if (isUniqueViolation(error)) throw new DuplicateTeeSetNameError();
      throw error;
    }
    return loadCourse(courseId);
  },

  async updateTeeSet(
    userId: string,
    courseId: string,
    teeSetId: string,
    input: TeeSetInput,
  ): Promise<Course> {
    await assertOwned(userId, courseId);
    const holeIds = await holeIdByNumber(courseId);
    const yardageRows = input.yardages
      .filter((y) => y.yardage !== null)
      .flatMap((y) => {
        const courseHoleId = holeIds.get(y.holeNumber);
        return courseHoleId
          ? [{ courseHoleId, yardage: y.yardage as number }]
          : [];
      });

    try {
      await prisma.$transaction([
        prisma.teeSet.update({
          where: { id: teeSetId, courseId },
          data: { name: input.name },
        }),
        prisma.teeHoleYardage.deleteMany({ where: { teeSetId } }),
        prisma.teeHoleYardage.createMany({
          data: yardageRows.map((row) => ({ ...row, teeSetId })),
        }),
      ]);
    } catch (error) {
      if (isUniqueViolation(error)) throw new DuplicateTeeSetNameError();
      throw error;
    }
    return loadCourse(courseId);
  },

  async removeTeeSet(
    userId: string,
    courseId: string,
    teeSetId: string,
  ): Promise<Course> {
    await assertOwned(userId, courseId);
    await prisma.teeSet.delete({ where: { id: teeSetId, courseId } });
    return loadCourse(courseId);
  },
};

export type CourseRepository = typeof courseRepository;
