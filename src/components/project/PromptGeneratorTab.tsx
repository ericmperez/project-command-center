'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Copy, Check, Sparkles, FileText } from 'lucide-react';
import { generatePrompts } from '@/lib/prompt-generator';
import type { Project, ProjectFormData } from '@/lib/types';

interface PromptGeneratorTabProps {
  project: Project;
  formData: ProjectFormData;
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleCopy}
      className="h-7 px-2.5 text-xs border-zinc-700 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200"
    >
      {copied ? (
        <>
          <Check className="w-3 h-3 mr-1 text-emerald-400" />
          <span className="text-emerald-400">Copied!</span>
        </>
      ) : (
        <>
          <Copy className="w-3 h-3 mr-1" />
          Copy
        </>
      )}
    </Button>
  );
}

export function PromptGeneratorTab({ project, formData }: PromptGeneratorTabProps) {
  // Build a merged project object using the latest form data for prompt generation
  const mergedProject: Project = {
    ...project,
    title: formData.title,
    description: formData.description || null,
    github_repo: formData.github_repo || null,
    client_name: formData.client_name || null,
    client_notes: formData.client_notes || null,
    next_steps: formData.next_steps || null,
  };

  const prompts = generatePrompts(mergedProject);

  if (prompts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-zinc-500">
        <FileText className="w-8 h-8 mb-3 text-zinc-600" />
        <p className="text-sm font-medium mb-1">No prompts yet</p>
        <p className="text-xs text-zinc-600 text-center">
          Add next steps in the Session Notes tab to generate prompts.
        </p>
      </div>
    );
  }

  // Separate task prompts from the full context prompt
  const taskPrompts = prompts.slice(0, -1);
  const fullContextPrompt = prompts[prompts.length - 1];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm font-medium text-zinc-400">
        <Sparkles className="w-4 h-4" />
        Generated Prompts
      </div>

      {/* Task prompts */}
      {taskPrompts.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider">
            Individual Tasks
          </p>
          {taskPrompts.map((p, i) => (
            <div
              key={i}
              className="flex items-start justify-between gap-3 p-3 rounded-lg bg-zinc-800/50 border border-zinc-800"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm text-zinc-300 font-medium mb-1.5">{p.label}</p>
                <pre className="text-xs text-zinc-500 whitespace-pre-wrap font-mono leading-relaxed">
                  {p.prompt}
                </pre>
              </div>
              <CopyButton text={p.prompt} />
            </div>
          ))}
        </div>
      )}

      {/* Full context prompt */}
      {fullContextPrompt && (
        <div className="space-y-2">
          <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider">
            Full Context
          </p>
          <div className="flex items-start justify-between gap-3 p-3 rounded-lg bg-zinc-800/50 border border-blue-500/20">
            <div className="flex-1 min-w-0">
              <p className="text-sm text-blue-400 font-medium mb-1.5">
                {fullContextPrompt.label}
              </p>
              <pre className="text-xs text-zinc-500 whitespace-pre-wrap font-mono leading-relaxed">
                {fullContextPrompt.prompt}
              </pre>
            </div>
            <CopyButton text={fullContextPrompt.prompt} />
          </div>
        </div>
      )}
    </div>
  );
}
