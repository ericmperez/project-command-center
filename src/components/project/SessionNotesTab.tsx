'use client';

import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { User, FileText, ArrowRight } from 'lucide-react';
import type { ProjectFormData } from '@/lib/types';

interface SessionNotesTabProps {
  formData: ProjectFormData;
  onUpdateField: <K extends keyof ProjectFormData>(field: K, value: ProjectFormData[K]) => void;
}

export function SessionNotesTab({ formData, onUpdateField }: SessionNotesTabProps) {
  return (
    <div className="space-y-6">
      {/* Client Info */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm font-medium text-zinc-400">
          <User className="w-4 h-4" />
          Client
        </div>
        <Input
          value={formData.client_name}
          onChange={(e) => onUpdateField('client_name', e.target.value)}
          placeholder="Client or company name"
          className="bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-500"
        />
      </div>

      {/* Client Notes */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm font-medium text-zinc-400">
          <FileText className="w-4 h-4" />
          Session Notes
        </div>
        <Textarea
          value={formData.client_notes}
          onChange={(e) => onUpdateField('client_notes', e.target.value)}
          placeholder={"What was discussed? Key decisions, requirements, feedback...\n\nExample:\n- Client wants dark mode by next week\n- API rate limiting is a concern\n- Approved the new dashboard layout"}
          className="bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-500 min-h-[160px]"
        />
      </div>

      {/* Next Steps */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm font-medium text-zinc-400">
          <ArrowRight className="w-4 h-4" />
          Next Steps
        </div>
        <Textarea
          value={formData.next_steps}
          onChange={(e) => onUpdateField('next_steps', e.target.value)}
          placeholder={"One task per line — each becomes a copyable Claude Code prompt.\n\nExample:\n- Add dark mode toggle to the settings page\n- Implement rate limiting middleware for the API\n- Write tests for the new dashboard components"}
          className="bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-500 min-h-[140px]"
        />
        <p className="text-xs text-zinc-600">
          Each line becomes its own prompt in the Prompts tab.
        </p>
      </div>
    </div>
  );
}
