import "server-only";
import { notFound } from "next/navigation";
import { requireUser } from "@/features/auth/session";
import { courseRepository } from "@/infrastructure/prisma/repositories/courseRepository";
import type { Course, CourseSummary } from "./types";

export const listCourses = async (): Promise<CourseSummary[]> => {
  const user = await requireUser();
  return courseRepository.listByUser(user.id);
};

export const getCourse = async (courseId: string): Promise<Course> => {
  const user = await requireUser();
  const course = await courseRepository.findById(user.id, courseId);
  if (!course) notFound();
  return course;
};
