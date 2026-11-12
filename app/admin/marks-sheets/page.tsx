import { unstable_noStore as noStore } from "next/cache";
import {
  getClasses,
  getDb,
  getCurrentAcademicSession,
  getClassSubjects,
  invalidateDbCache,
} from "@/lib/db/store";
import MarksFillingSheetClient from "@/components/marks/MarksFillingSheetClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminMarksFillingSheetsPage({
  searchParams,
}: {
  searchParams: Promise<{ classId?: string }>;
}) {
  noStore();
  invalidateDbCache();
  const db = await getDb();
  const classes = await getClasses();
  const currentSession = await getCurrentAcademicSession();
  const params = await searchParams;

  const allClassSubjects = [];
  for (const cls of classes) {
    const cs = await getClassSubjects(cls.id);
    allClassSubjects.push(...cs);
  }

  return (
    <MarksFillingSheetClient
      classes={classes}
      students={db.students.filter((s) => s.isActive)}
      classSubjects={allClassSubjects}
      sessionLabel={currentSession.name}
      isAdmin={true}
      initialClassId={params.classId || classes[0]?.id}
    />
  );
}
