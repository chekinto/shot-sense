/**
 * Application course shapes — plain, framework- and Prisma-independent. Prisma
 * rows are converted at the mapper boundary.
 */

export interface CourseHole {
  holeNumber: number;
  par: number;
}

export interface TeeHoleYardage {
  holeNumber: number;
  yardage: number;
}

export interface TeeSet {
  id: string;
  name: string;
  /** Sparse — only holes with a recorded yardage (§15, yardage optional). */
  yardages: TeeHoleYardage[];
}

export interface Course {
  id: string;
  name: string;
  holeCount: number;
  /** Sorted by `holeNumber`, contiguous 1..holeCount. */
  holes: CourseHole[];
  teeSets: TeeSet[];
  createdAt: Date;
  updatedAt: Date;
}

/** Row shape for the course list (§113). */
export interface CourseSummary {
  id: string;
  name: string;
  holeCount: number;
  teeSetCount: number;
  updatedAt: Date;
}

export const totalPar = (holes: CourseHole[]): number =>
  holes.reduce((sum, hole) => sum + hole.par, 0);
