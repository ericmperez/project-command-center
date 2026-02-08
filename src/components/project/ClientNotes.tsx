'use client';

import { useState, useEffect } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Save, FileText } from 'lucide-react';

interface ClientNotesProps {
  notes: string;
  onChange: (notes: string) => void;
  onSave?: () => void;
  readonly?: boolean;
}

export function ClientNotes({ notes, onChange, onSave, readonly = false }: ClientNotesProps) {
  const [localNotes, setLocalNotes] = useState(notes);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    setLocalNotes(notes);
    setHasChanges(false);
  }, [notes]);

  const handleChange = (value: string) => {
    setLocalNotes(value);
    setHasChanges(value !== notes);
    onChange(value);
  };

  const handleSave = () => {
    setHasChanges(false);
    onSave?.();
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium text-zinc-400">
          <FileText className="w-4 h-4" />
          Client Notes & Requirements
        </div>
        {hasChanges && onSave && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSave}
            className="text-emerald-400 hover:text-emerald-300 hover:bg-emerald-950/50 h-7"
          >
            <Save className="w-3 h-3 mr-1" />
            Save
          </Button>
        )}
      </div>

      <Textarea
        value={localNotes}
        onChange={(e) => handleChange(e.target.value)}
        placeholder={
          readonly
            ? 'No client notes yet...'
            : 'Document client requirements, expectations, and important details here...'
        }
        readOnly={readonly}
        className={`
          min-h-[150px] resize-y
          bg-zinc-800 border-zinc-700 text-zinc-100
          placeholder:text-zinc-500
          ${readonly ? 'cursor-default' : ''}
        `}
      />

      {!readonly && (
        <p className="text-[11px] text-zinc-600">
          Tip: Use this space to track client requirements, feedback, and important decisions.
        </p>
      )}
    </div>
  );
}
