import mentalManifestJson from "../data/courses/mental.manifest.json";
import {
  COURSE_MANIFEST_SCHEMA_VERSION,
  type CourseManifest,
  type CourseManifestValidationResult,
} from "../types/courseManifest";

const COURSE_MANIFESTS: Record<string, CourseManifest> = {
  mental: mentalManifestJson as CourseManifest,
};

function findDuplicates(values: string[]): string[] {
  const seen = new Set<string>();
  const duplicates = new Set<string>();
  values.forEach((value) => {
    if (seen.has(value)) duplicates.add(value);
    seen.add(value);
  });
  return [...duplicates].sort();
}

function findCycle(nodes: Array<{ id: string; prerequisites: string[] }>): string[] | null {
  const graph = new Map(nodes.map((node) => [node.id, node.prerequisites]));
  const visiting = new Set<string>();
  const visited = new Set<string>();
  const path: string[] = [];

  function visit(id: string): string[] | null {
    if (visiting.has(id)) {
      const cycleStart = path.indexOf(id);
      return [...path.slice(cycleStart), id];
    }
    if (visited.has(id)) return null;

    visiting.add(id);
    path.push(id);
    for (const prerequisite of graph.get(id) ?? []) {
      const cycle = visit(prerequisite);
      if (cycle) return cycle;
    }
    path.pop();
    visiting.delete(id);
    visited.add(id);
    return null;
  }

  for (const node of nodes) {
    const cycle = visit(node.id);
    if (cycle) return cycle;
  }
  return null;
}

export function validateCourseManifest(
  manifest: CourseManifest,
  inventoryLessonIds?: ReadonlySet<string>
): CourseManifestValidationResult {
  const errors: string[] = [];
  if (manifest.schema_version !== COURSE_MANIFEST_SCHEMA_VERSION) {
    errors.push(`unsupported schema_version: ${String(manifest.schema_version)}`);
  }
  if (!manifest.curriculum_version.trim()) errors.push("curriculum_version is required");
  if (!manifest.course_id.trim()) errors.push("course_id is required");
  if (manifest.progression_policy.support_window_size < 1) {
    errors.push("support_window_size must be positive");
  }
  if (
    manifest.progression_policy.max_support_actions < 0 ||
    manifest.progression_policy.max_support_actions >=
      manifest.progression_policy.support_window_size
  ) {
    errors.push("max_support_actions must be lower than support_window_size");
  }

  const unitIds = manifest.units.map((unit) => unit.unit_id);
  const skillIds = manifest.skills.map((skill) => skill.skill_id);
  const lessonIds = manifest.lessons.map((lesson) => lesson.lesson_id);
  findDuplicates(unitIds).forEach((id) => errors.push(`duplicate unit_id: ${id}`));
  findDuplicates(skillIds).forEach((id) => errors.push(`duplicate skill_id: ${id}`));
  findDuplicates(lessonIds).forEach((id) => errors.push(`duplicate lesson_id: ${id}`));

  const unitSet = new Set(unitIds);
  const skillSet = new Set(skillIds);
  const lessonSet = new Set(lessonIds);
  const lessonById = new Map(manifest.lessons.map((lesson) => [lesson.lesson_id, lesson]));

  manifest.units.forEach((unit) => {
    unit.prerequisite_unit_ids.forEach((id) => {
      if (!unitSet.has(id)) errors.push(`unit ${unit.unit_id} references unknown prerequisite ${id}`);
    });
    unit.skill_ids.forEach((id) => {
      if (!skillSet.has(id)) errors.push(`unit ${unit.unit_id} references unknown skill ${id}`);
    });
    [...unit.core_lesson_ids, ...unit.mastery_lesson_ids].forEach((id) => {
      if (!lessonSet.has(id)) errors.push(`unit ${unit.unit_id} references unknown lesson ${id}`);
      const lesson = lessonById.get(id);
      if (lesson && lesson.unit_id !== unit.unit_id) {
        errors.push(`lesson ${id} belongs to ${lesson.unit_id}, not ${unit.unit_id}`);
      }
    });
    unit.core_lesson_ids.forEach((id) => {
      if (lessonById.get(id)?.lane !== "core") errors.push(`core lesson ${id} has the wrong lane`);
    });
    unit.mastery_lesson_ids.forEach((id) => {
      if (lessonById.get(id)?.lane !== "mastery") errors.push(`mastery lesson ${id} has the wrong lane`);
    });
  });

  manifest.skills.forEach((skill) => {
    skill.prerequisite_skill_ids.forEach((id) => {
      if (!skillSet.has(id)) errors.push(`skill ${skill.skill_id} references unknown prerequisite ${id}`);
    });
  });

  manifest.lessons.forEach((lesson) => {
    if (!unitSet.has(lesson.unit_id)) {
      errors.push(`lesson ${lesson.lesson_id} references unknown unit ${lesson.unit_id}`);
    }
    lesson.skill_ids.forEach((id) => {
      if (!skillSet.has(id)) errors.push(`lesson ${lesson.lesson_id} references unknown skill ${id}`);
    });
    if (inventoryLessonIds && !inventoryLessonIds.has(lesson.lesson_id)) {
      errors.push(`lesson ${lesson.lesson_id} is missing from runtime inventory`);
    }
  });

  const unitCycle = findCycle(
    manifest.units.map((unit) => ({ id: unit.unit_id, prerequisites: unit.prerequisite_unit_ids }))
  );
  if (unitCycle) errors.push(`unit dependency cycle: ${unitCycle.join(" -> ")}`);
  const skillCycle = findCycle(
    manifest.skills.map((skill) => ({
      id: skill.skill_id,
      prerequisites: skill.prerequisite_skill_ids,
    }))
  );
  if (skillCycle) errors.push(`skill dependency cycle: ${skillCycle.join(" -> ")}`);

  return { valid: errors.length === 0, errors };
}

export function getCourseManifest(courseId: string): CourseManifest | null {
  const manifest = COURSE_MANIFESTS[courseId] ?? null;
  if (!manifest) return null;
  const validation = validateCourseManifest(manifest);
  if (!validation.valid) {
    throw new Error(`Invalid course manifest ${courseId}: ${validation.errors.join("; ")}`);
  }
  return manifest;
}

export function getCourseCoreLessonIds(manifest: CourseManifest): string[] {
  return manifest.units.flatMap((unit) => unit.core_lesson_ids);
}

export function getCourseMasteryLessonIds(manifest: CourseManifest): string[] {
  return manifest.units.flatMap((unit) => unit.mastery_lesson_ids);
}
