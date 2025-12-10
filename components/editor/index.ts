/**
 * OVR Rich Text Editor
 * 
 * A Plate.js-based rich text editor with MS Word-like experience.
 * 
 * Features:
 * - Floating toolbar on text selection (bold, italic, underline, link, lists)
 * - Fixed mini toolbar when editing (headings, formatting)
 * - Clean preview mode when not editing
 * - Keyboard shortcuts (Ctrl+B, Ctrl+I, Ctrl+U, Ctrl+K)
 * - Markdown shortcuts (**, __, #, -, etc.)
 * 
 * @example
 * ```tsx
 * import { RichTextEditor, RichTextPreview, type EditorValue } from '@/components/editor';
 * 
 * // In a form
 * const [value, setValue] = useState<EditorValue>();
 * <RichTextEditor
 *   value={value}
 *   onChange={setValue}
 *   placeholder="Enter description..."
 *   minHeight={200}
 * />
 * 
 * // Display only
 * <RichTextPreview value={savedValue} emptyText="No description provided" />
 * ```
 */

// Main components
export { RichTextEditor } from './RichTextEditor';
export type { RichTextEditorProps } from './RichTextEditor';
export { RichTextPreview } from './RichTextPreview';

// Types
export type { EditorValue, TElement, TText } from './plate-types';
export { createEmptyValue, isEmptyValue } from './plate-types';

// Utilities
export {
    serializeToPlainText,
    getCharacterCount,
    getWordCount,
    truncateToPlainText,
    deserializeFromPlainText,
    deserializeFromHTML,
    deserializeFromMarkdown,
} from './utils';
