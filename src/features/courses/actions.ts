"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/features/auth/session";
import {
  courseRepository,
  CourseNotFoundError,
  DuplicateTeeSetNameError,
} from "@/infrastructure/prisma/repositories/courseRepository";
import { courseInputSchema, teeSetInputSchema } from "./schema";

export interface CourseFormState {
  error?: string;
  fieldErrors?: Record<string, string>;
  savedAt?: number;
}

const firstIssues = (
  issues: { path: PropertyKey[]; message: string }[],
): Record<string, string> => {
  const out: Record<string, string> = {};
  for (const issue of issues) {
    const key = String(issue.path[0] ?? "form");
    out[key] ??= issue.message;
  }
  return out;
};

const parseJsonField = <T,>(value: FormDataEntryValue | null, fallback: T): T => {
  if (typeof value !== "string") return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
};

const readCourseInput = (formData: FormData) =>
  courseInputSchema.safeParse({
    name: formData.get("name"),
    holeCount: Number(formData.get("holeCount")),
    pars: parseJsonField<number[]>(formData.get("pars"), []),
  });

export const createCourse = async (
  _prev: CourseFormState,
  formData: FormData,
): Promise<CourseFormState> => {
  const user = await requireUser();
  const parsed = readCourseInput(formData);
  if (!parsed.success) {
    return { fieldErrors: firstIssues(parsed.error.issues) };
  }

  const course = await courseRepository.create(user.id, parsed.data);
  revalidatePath("/courses");
  redirect(`/courses/${course.id}/edit`);
};

export const updateCourseDetails = async (
  _prev: CourseFormState,
  formData: FormData,
): Promise<CourseFormState> => {
  const user = await requireUser();
  const courseId = String(formData.get("courseId") ?? "");
  const parsed = readCourseInput(formData);
  if (!parsed.success) {
    return { fieldErrors: firstIssues(parsed.error.issues) };
  }

  try {
    await courseRepository.updateDetails(user.id, courseId, parsed.data);
  } catch (error) {
    if (error instanceof CourseNotFoundError) return { error: error.message };
    throw error;
  }
  revalidatePath("/courses");
  revalidatePath(`/courses/${courseId}/edit`);
  return { savedAt: Date.now() };
};

export const deleteCourse = async (formData: FormData): Promise<void> => {
  const user = await requireUser();
  const courseId = String(formData.get("courseId") ?? "");
  try {
    await courseRepository.remove(user.id, courseId);
  } catch (error) {
    if (!(error instanceof CourseNotFoundError)) throw error;
  }
  revalidatePath("/courses");
  redirect("/courses");
};

const readTeeSetInput = (formData: FormData) =>
  teeSetInputSchema.safeParse({
    name: formData.get("teeName"),
    yardages: parseJsonField<{ holeNumber: number; yardage: number | null }[]>(
      formData.get("yardages"),
      [],
    ),
  });

export const saveTeeSet = async (
  _prev: CourseFormState,
  formData: FormData,
): Promise<CourseFormState> => {
  const user = await requireUser();
  const courseId = String(formData.get("courseId") ?? "");
  const teeSetId = String(formData.get("teeSetId") ?? "");
  const parsed = readTeeSetInput(formData);
  if (!parsed.success) {
    return { fieldErrors: firstIssues(parsed.error.issues) };
  }

  try {
    if (teeSetId) {
      await courseRepository.updateTeeSet(user.id, courseId, teeSetId, parsed.data);
    } else {
      await courseRepository.addTeeSet(user.id, courseId, parsed.data);
    }
  } catch (error) {
    if (error instanceof DuplicateTeeSetNameError) {
      return { fieldErrors: { name: error.message } };
    }
    if (error instanceof CourseNotFoundError) return { error: error.message };
    throw error;
  }
  revalidatePath(`/courses/${courseId}/edit`);
  return { savedAt: Date.now() };
};

export const deleteTeeSet = async (formData: FormData): Promise<void> => {
  const user = await requireUser();
  const courseId = String(formData.get("courseId") ?? "");
  const teeSetId = String(formData.get("teeSetId") ?? "");
  try {
    await courseRepository.removeTeeSet(user.id, courseId, teeSetId);
  } catch (error) {
    if (!(error instanceof CourseNotFoundError)) throw error;
  }
  revalidatePath(`/courses/${courseId}/edit`);
};
