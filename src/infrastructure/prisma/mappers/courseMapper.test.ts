import { toCourse, toCourseSummary } from "./courseMapper";

const base = {
  id: "course-1",
  userId: "user-1",
  name: "East Herts",
  holeCount: 18,
  createdAt: new Date("2026-01-01"),
  updatedAt: new Date("2026-02-01"),
};

describe("toCourse", () => {
  it("sorts holes and resolves tee yardages by hole number", () => {
    const course = toCourse({
      ...base,
      holes: [
        { id: "h2", courseId: "course-1", holeNumber: 2, par: 3 },
        { id: "h1", courseId: "course-1", holeNumber: 1, par: 4 },
      ],
      teeSets: [
        {
          id: "t1",
          courseId: "course-1",
          name: "White",
          createdAt: new Date(),
          updatedAt: new Date(),
          yardages: [
            { id: "y1", teeSetId: "t1", courseHoleId: "h1", yardage: 410 },
            { id: "y2", teeSetId: "t1", courseHoleId: "h2", yardage: 165 },
          ],
        },
      ],
    });

    expect(course.holes).toEqual([
      { holeNumber: 1, par: 4 },
      { holeNumber: 2, par: 3 },
    ]);
    expect(course.teeSets[0]?.yardages).toEqual([
      { holeNumber: 1, yardage: 410 },
      { holeNumber: 2, yardage: 165 },
    ]);
  });

  it("drops yardages whose course hole is missing", () => {
    const course = toCourse({
      ...base,
      holes: [{ id: "h1", courseId: "course-1", holeNumber: 1, par: 4 }],
      teeSets: [
        {
          id: "t1",
          courseId: "course-1",
          name: "White",
          createdAt: new Date(),
          updatedAt: new Date(),
          yardages: [
            { id: "y9", teeSetId: "t1", courseHoleId: "ghost", yardage: 999 },
          ],
        },
      ],
    });
    expect(course.teeSets[0]?.yardages).toEqual([]);
  });
});

describe("toCourseSummary", () => {
  it("exposes the tee set count", () => {
    expect(
      toCourseSummary({ ...base, _count: { teeSets: 3 } }),
    ).toMatchObject({ id: "course-1", holeCount: 18, teeSetCount: 3 });
  });
});
