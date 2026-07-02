import { db } from '@/db';
import { departments } from '@/db/schema';
import { inArray } from 'drizzle-orm';

export type DepartmentUnitLabels = {
  department: string | null;
  unit: string | null;
};

export async function getDepartmentUnitLabels(
  departmentId: number | null | undefined,
  unitId: number | null | undefined
): Promise<DepartmentUnitLabels> {
  const ids = [departmentId, unitId].filter(
    (id): id is number => typeof id === 'number' && Number.isInteger(id) && id > 0
  );

  if (ids.length === 0) {
    return { department: null, unit: null };
  }

  const rows = await db
    .select({ id: departments.id, name: departments.name })
    .from(departments)
    .where(inArray(departments.id, [...new Set(ids)]));

  const nameById = new Map(rows.map((row) => [row.id, row.name]));

  return {
    department: departmentId ? nameById.get(departmentId) ?? null : null,
    unit: unitId ? nameById.get(unitId) ?? null : null,
  };
}

export async function getDepartmentUnitLabelMap(userRows: Array<{
  departmentId?: number | null;
  unitId?: number | null;
}>): Promise<Map<number, string>> {
  const ids = userRows.flatMap((row) => [row.departmentId, row.unitId]).filter(
    (id): id is number => typeof id === 'number' && Number.isInteger(id) && id > 0
  );

  if (ids.length === 0) {
    return new Map();
  }

  const rows = await db
    .select({ id: departments.id, name: departments.name })
    .from(departments)
    .where(inArray(departments.id, [...new Set(ids)]));

  return new Map(rows.map((row) => [row.id, row.name]));
}
