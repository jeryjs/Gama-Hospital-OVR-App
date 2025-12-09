/**
 * @fileoverview Checklist Utilities
 * 
 * Type-safe JSON serialization/deserialization for action checklists
 * Ensures data integrity and provides helper functions
 */

export interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
  completedAt?: string | null;
  completedBy?: number | null;
}

/**
 * Parse checklist from JSON string
 * Validates structure and returns typed array
 * 
 * @param json - JSON string from database
 * @returns Validated checklist items
 * @throws Error if JSON is invalid or malformed
 * 
 * @example
 * const items = parseChecklist(dbRecord.checklist);
 * items.forEach(item => console.log(item.text, item.completed));
 */
export function parseChecklist(json: string | null | undefined): ChecklistItem[] {
  if (!json || json.trim().length === 0) {
    return [];
  }

  try {
    const parsed = JSON.parse(json);

    if (!Array.isArray(parsed)) {
      throw new Error('Checklist must be an array');
    }

    // Validate each item
    return parsed.map((item, index) => {
      if (!item || typeof item !== 'object') {
        throw new Error(`Invalid checklist item at index ${index}`);
      }

      if (!item.id || typeof item.id !== 'string') {
        throw new Error(`Checklist item ${index} missing valid id`);
      }

      if (!item.text || typeof item.text !== 'string') {
        throw new Error(`Checklist item ${index} missing valid text`);
      }

      if (typeof item.completed !== 'boolean') {
        throw new Error(`Checklist item ${index} missing valid completed status`);
      }

      return {
        id: item.id,
        text: item.text,
        completed: item.completed,
        completedAt: item.completedAt || null,
        completedBy: item.completedBy || null,
      };
    });
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to parse checklist: ${error.message}`);
    }
    throw new Error('Failed to parse checklist');
  }
}

/**
 * Serialize checklist to JSON string
 * 
 * @param items - Checklist items
 * @returns JSON string for database storage
 * 
 * @example
 * const json = stringifyChecklist([
 *   { id: '1', text: 'Review findings', completed: true },
 *   { id: '2', text: 'Submit report', completed: false }
 * ]);
 */
export function stringifyChecklist(items: ChecklistItem[]): string {
  return JSON.stringify(items);
}

/**
 * Check if all checklist items are completed
 * 
 * @param json - JSON string from database
 * @returns true if all items are completed
 */
export function isChecklistComplete(json: string | null | undefined): boolean {
  const items = parseChecklist(json);
  
  if (items.length === 0) {
    return false; // Empty checklist = not complete
  }

  return items.every(item => item.completed);
}

/**
 * Toggle a specific checklist item
 * Returns updated JSON string
 * 
 * @param json - Current checklist JSON
 * @param itemId - ID of item to toggle
 * @param userId - ID of user performing the toggle
 * @returns Updated JSON string
 * 
 * @example
 * const updated = toggleChecklistItem(
 *   dbRecord.checklist,
 *   'item-123',
 *   currentUser.id
 * );
 */
export function toggleChecklistItem(
  json: string | null | undefined,
  itemId: string,
  userId?: number
): string {
  const items = parseChecklist(json);

  const updated = items.map(item => {
    if (item.id === itemId) {
      const newCompleted = !item.completed;
      return {
        ...item,
        completed: newCompleted,
        completedAt: newCompleted ? new Date().toISOString() : null,
        completedBy: newCompleted ? (userId || null) : null,
      };
    }
    return item;
  });

  return stringifyChecklist(updated);
}

/**
 * Update specific checklist item
 * 
 * @param json - Current checklist JSON
 * @param itemId - ID of item to update
 * @param updates - Partial updates to apply
 * @returns Updated JSON string
 */
export function updateChecklistItem(
  json: string | null | undefined,
  itemId: string,
  updates: Partial<ChecklistItem>
): string {
  const items = parseChecklist(json);

  const updated = items.map(item => {
    if (item.id === itemId) {
      return { ...item, ...updates };
    }
    return item;
  });

  return stringifyChecklist(updated);
}

/**
 * Get completion percentage
 * 
 * @param json - Checklist JSON
 * @returns Percentage completed (0-100)
 */
export function getChecklistProgress(json: string | null | undefined): number {
  const items = parseChecklist(json);
  
  if (items.length === 0) {
    return 0;
  }

  const completed = items.filter(item => item.completed).length;
  return Math.round((completed / items.length) * 100);
}

/**
 * Create a new checklist from text array
 * Generates unique IDs for each item
 * 
 * @param texts - Array of checklist item texts
 * @returns JSON string ready for database
 * 
 * @example
 * const checklist = createChecklist([
 *   'Complete investigation',
 *   'Submit findings',
 *   'Review with team'
 * ]);
 */
export function createChecklist(texts: string[]): string {
  const items: ChecklistItem[] = texts.map((text, index) => ({
    id: `item-${Date.now()}-${index}`,
    text: text.trim(),
    completed: false,
    completedAt: null,
    completedBy: null,
  }));

  return stringifyChecklist(items);
}
