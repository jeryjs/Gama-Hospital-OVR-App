# Rich Text Editor - Integration Guide

This document describes how to integrate the Plate.js-based rich text editor into OVR app forms.

## Quick Start

```tsx
import { RichTextEditor, RichTextPreview, type EditorValue } from "@/components/editor";
```

## Usage Examples

### 1. Investigation Findings Fields

```tsx
// In InvestigationManagement.tsx or similar
import { RichTextEditor, type EditorValue } from "@/components/editor";

function InvestigationForm() {
	const [findings, setFindings] = useState<EditorValue>();
	const [rootCause, setRootCause] = useState<EditorValue>();

	return (
		<>
			<FormLabel>Investigation Findings</FormLabel>
			<RichTextEditor value={findings} onChange={setFindings} placeholder='Document your investigation findings...' minHeight={200} maxHeight={400} />

			<FormLabel>Root Cause Analysis</FormLabel>
			<RichTextEditor value={rootCause} onChange={setRootCause} placeholder='Describe the root cause...' minHeight={150} />
		</>
	);
}
```

### 2. Corrective Action Descriptions

```tsx
// In CorrectiveActionsManagement.tsx
import { RichTextEditor, type EditorValue } from "@/components/editor";

interface CorrectiveAction {
	id: string;
	description: EditorValue; // Changed from string to EditorValue
	// ...other fields
}

function CorrectiveActionForm({ action }: { action?: CorrectiveAction }) {
	const [description, setDescription] = useState<EditorValue>(action?.description || undefined);

	return <RichTextEditor value={description} onChange={setDescription} placeholder='Describe the corrective action to be taken...' minHeight={150} />;
}
```

### 3. Incident Descriptions

```tsx
// In OccurrenceDetailsSection.tsx
import { RichTextEditor, type EditorValue } from "@/components/editor";

function IncidentDescriptionField() {
	const { control } = useFormContext();

	return (
		<Controller
			name='description'
			control={control}
			render={({ field }) => (
				<RichTextEditor
					value={field.value}
					onChange={field.onChange}
					placeholder='Describe what happened in detail...'
					minHeight={200}
					maxHeight={500}
				/>
			)}
		/>
	);
}
```

### 4. QI Feedback

```tsx
// In QIFeedbackSection.tsx
import { RichTextEditor, RichTextPreview, type EditorValue } from "@/components/editor";

function QIFeedback({ feedback, isEditing }: { feedback?: EditorValue; isEditing: boolean }) {
	const [value, setValue] = useState<EditorValue>(feedback);

	if (!isEditing) {
		return <RichTextPreview value={feedback} emptyText='No QI feedback provided yet' />;
	}

	return <RichTextEditor value={value} onChange={setValue} placeholder='Enter QI review feedback...' minHeight={150} />;
}
```

### 5. Display-Only (Read Mode)

```tsx
// When displaying saved content
import { RichTextPreview } from "@/components/editor";

function IncidentDetails({ incident }) {
	return (
		<Card>
			<CardContent>
				<Typography variant='h6'>Description</Typography>
				<RichTextPreview value={incident.description} emptyText='No description provided' />
			</CardContent>
		</Card>
	);
}
```

## Database Integration

### Storing EditorValue

The `EditorValue` type is a JSON-compatible array structure. Store it as JSONB in PostgreSQL:

```sql
-- In your schema
description JSONB,
findings JSONB,
```

```typescript
// In Drizzle schema
import { jsonb } from "drizzle-orm/pg-core";

export const incidents = pgTable("incidents", {
	// ...
	description: jsonb("description"), // Store EditorValue directly
});
```

### Search Indexing

Use the serialize utility to create searchable text:

```typescript
import { serializeToPlainText } from "@/components/editor";

// When saving an incident
const searchableText = serializeToPlainText(editorValue);

// Store searchableText in a separate column for full-text search
```

### Migration from Plain Text

```typescript
import { deserializeFromPlainText } from "@/components/editor";

// When migrating existing data
const editorValue = deserializeFromPlainText(existingPlainText);
```

## Props Reference

### RichTextEditor

| Prop        | Type                         | Default           | Description               |
| ----------- | ---------------------------- | ----------------- | ------------------------- |
| value       | EditorValue                  | undefined         | Editor content value      |
| onChange    | (value: EditorValue) => void | undefined         | Change handler            |
| placeholder | string                       | "Start typing..." | Placeholder text          |
| readOnly    | boolean                      | false             | Disable editing           |
| minHeight   | number \| string             | 150               | Minimum editor height     |
| maxHeight   | number \| string             | 400               | Maximum editor height     |
| autoFocus   | boolean                      | false             | Focus on mount            |
| disabled    | boolean                      | false             | Disable editor completely |

### RichTextPreview

| Prop      | Type        | Default      | Description           |
| --------- | ----------- | ------------ | --------------------- |
| value     | EditorValue | undefined    | Content to display    |
| emptyText | string      | "No content" | Text shown when empty |

## Keyboard Shortcuts

- **Ctrl+B** - Bold
- **Ctrl+I** - Italic
- **Ctrl+U** - Underline
- **Ctrl+K** - Insert link

## Markdown Shortcuts

Type these at the start of a line:

- `# ` - Heading 1
- `## ` - Heading 2
- `### ` - Heading 3
- `> ` - Blockquote
- `- ` or `* ` - Bullet list
- `1. ` - Numbered list

Wrap text with:

- `**text**` - Bold
- `*text*` - Italic
