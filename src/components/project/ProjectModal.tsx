'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Trash2, Github, User, FileText, ArrowRight, Target } from 'lucide-react';
import { GitHubWidget } from './GitHubWidget';
import { SessionNotesTab } from './SessionNotesTab';
import { PromptGeneratorTab } from './PromptGeneratorTab';
import { ChecklistTab } from './ChecklistTab';
import { TimeTrackingTab } from './TimeTrackingTab';
import { MeetingsTab } from './MeetingsTab';
import { ActiveTimerBadge } from './ActiveTimerBadge';
import { useChecklist, type XpChangeCallback } from '@/hooks/useChecklist';
import { useTimeTracking } from '@/hooks/useTimeTracking';
import { useMeetings } from '@/hooks/useMeetings';
import type { Project, ProjectFormData, ProjectType } from '@/lib/types';

interface ProjectModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: Project | null;
  onSave: (data: ProjectFormData) => Promise<void>;
  onDelete?: () => Promise<void>;
  onXpChange?: XpChangeCallback;
}

const defaultFormData: ProjectFormData = {
  title: '',
  description: '',
  project_type: 'personal',
  github_repo: '',
  client_name: '',
  client_notes: '',
  next_steps: '',
  target_completion_date: '',
};

export function ProjectModal({
  open,
  onOpenChange,
  project,
  onSave,
  onDelete,
  onXpChange,
}: ProjectModalProps) {
  const [formData, setFormData] = useState<ProjectFormData>(defaultFormData);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const isEditing = !!project;
  const projectId = project?.id || null;

  // Hooks for new features
  const checklist = useChecklist(isEditing ? projectId : null, onXpChange);
  const timeTracking = useTimeTracking(isEditing ? projectId : null, open && isEditing);
  const meetings = useMeetings(isEditing ? projectId : null);

  // Reset form when project changes
  useEffect(() => {
    if (project) {
      setFormData({
        title: project.title,
        description: project.description || '',
        project_type: project.project_type,
        github_repo: project.github_repo || '',
        client_name: project.client_name || '',
        client_notes: project.client_notes || '',
        next_steps: project.next_steps || '',
        target_completion_date: project.target_completion_date
          ? new Date(project.target_completion_date).toISOString().split('T')[0]
          : '',
      });
    } else {
      setFormData(defaultFormData);
    }
  }, [project, open]);

  const handleSave = async () => {
    if (!formData.title.trim()) return;

    setSaving(true);
    try {
      await onSave(formData);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!onDelete) return;

    setDeleting(true);
    try {
      await onDelete();
    } finally {
      setDeleting(false);
    }
  };

  const updateField = <K extends keyof ProjectFormData>(
    field: K,
    value: ProjectFormData[K]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-zinc-900 border-zinc-800 text-zinc-100 max-h-[90vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <DialogTitle className="text-lg font-semibold">
              {isEditing ? 'Edit Project' : 'New Project'}
            </DialogTitle>
            {isEditing && (
              <ActiveTimerBadge
                formattedElapsed={timeTracking.formattedElapsed}
                isTracking={timeTracking.isTracking}
              />
            )}
          </div>
        </DialogHeader>

        {isEditing ? (
          <EditingTabs
            project={project}
            formData={formData}
            updateField={updateField}
            checklist={checklist}
            timeTracking={timeTracking}
            meetings={meetings}
          />
        ) : (
          <CreateForm formData={formData} updateField={updateField} />
        )}

        <DialogFooter className="flex justify-between items-center">
          <div>
            {isEditing && onDelete && (
              <Button
                variant="ghost"
                onClick={handleDelete}
                disabled={deleting}
                className="text-red-400 hover:text-red-300 hover:bg-red-950/50"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                {deleting ? 'Deleting...' : 'Delete'}
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="border-zinc-700 text-zinc-400 hover:bg-zinc-800"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving || !formData.title.trim()}
              className="bg-zinc-100 text-zinc-900 hover:bg-zinc-200"
            >
              {saving ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Project'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Tabbed layout for editing existing projects
function EditingTabs({
  project,
  formData,
  updateField,
  checklist,
  timeTracking,
  meetings,
}: {
  project: Project;
  formData: ProjectFormData;
  updateField: <K extends keyof ProjectFormData>(field: K, value: ProjectFormData[K]) => void;
  checklist: ReturnType<typeof useChecklist>;
  timeTracking: ReturnType<typeof useTimeTracking>;
  meetings: ReturnType<typeof useMeetings>;
}) {
  const showMeetings = project.project_type === 'client';

  return (
    <Tabs defaultValue="details" className="flex-1 min-h-0 flex flex-col">
      <TabsList className="bg-zinc-800 border border-zinc-700 w-full justify-start flex-wrap h-auto gap-0">
        <TabsTrigger
          value="details"
          className="data-[state=active]:bg-zinc-700 data-[state=active]:text-zinc-100 text-zinc-400"
        >
          Details
        </TabsTrigger>
        <TabsTrigger
          value="checklist"
          className="data-[state=active]:bg-zinc-700 data-[state=active]:text-zinc-100 text-zinc-400"
        >
          Checklist
          {checklist.totalCount > 0 && (
            <span className="ml-1.5 text-[10px] text-zinc-500">
              {checklist.completedCount}/{checklist.totalCount}
            </span>
          )}
        </TabsTrigger>
        <TabsTrigger
          value="time"
          className="data-[state=active]:bg-zinc-700 data-[state=active]:text-zinc-100 text-zinc-400"
        >
          Time
        </TabsTrigger>
        {showMeetings && (
          <TabsTrigger
            value="meetings"
            className="data-[state=active]:bg-zinc-700 data-[state=active]:text-zinc-100 text-zinc-400"
          >
            Meetings
            {meetings.upcomingMeetings.length > 0 && (
              <span className="ml-1.5 text-[10px] text-blue-400">
                {meetings.upcomingMeetings.length}
              </span>
            )}
          </TabsTrigger>
        )}
        <TabsTrigger
          value="notes"
          className="data-[state=active]:bg-zinc-700 data-[state=active]:text-zinc-100 text-zinc-400"
        >
          Notes
        </TabsTrigger>
        <TabsTrigger
          value="prompts"
          className="data-[state=active]:bg-zinc-700 data-[state=active]:text-zinc-100 text-zinc-400"
        >
          Prompts
        </TabsTrigger>
      </TabsList>

      <TabsContent value="details" className="flex-1 overflow-y-auto mt-4">
        <DetailsFields project={project} formData={formData} updateField={updateField} />
      </TabsContent>

      <TabsContent value="checklist" className="flex-1 overflow-y-auto mt-4">
        <ChecklistTab
          items={checklist.items}
          completionPercentage={checklist.completionPercentage}
          completedCount={checklist.completedCount}
          totalCount={checklist.totalCount}
          loading={checklist.loading}
          githubRepo={project.github_repo}
          onAddItem={checklist.addItem}
          onToggleItem={checklist.toggleItem}
          onDeleteItem={checklist.deleteItem}
          onSyncGitHub={checklist.syncGitHubIssues}
        />
      </TabsContent>

      <TabsContent value="time" className="flex-1 overflow-y-auto mt-4">
        <TimeTrackingTab
          sessions={timeTracking.sessions}
          totalTime={timeTracking.totalTime}
          formattedTotal={timeTracking.formattedTotal}
          formattedAvg={timeTracking.formattedAvg}
          loading={timeTracking.loading}
          isTracking={timeTracking.isTracking}
          formattedElapsed={timeTracking.formattedElapsed}
        />
      </TabsContent>

      {showMeetings && (
        <TabsContent value="meetings" className="flex-1 overflow-y-auto mt-4">
          <MeetingsTab
            meetings={meetings.meetings}
            upcomingMeetings={meetings.upcomingMeetings}
            pastMeetings={meetings.pastMeetings}
            loading={meetings.loading}
            clientName={project.client_name}
            githubRepo={project.github_repo}
            checklistItems={checklist.items}
            onAddMeeting={meetings.addMeeting}
            onUpdateMeeting={meetings.updateMeeting}
            onDeleteMeeting={meetings.deleteMeeting}
            onGetMeetingPrep={meetings.getMeetingPrep}
          />
        </TabsContent>
      )}

      <TabsContent value="notes" className="flex-1 overflow-y-auto mt-4">
        <SessionNotesTab formData={formData} onUpdateField={updateField} />
      </TabsContent>

      <TabsContent value="prompts" className="flex-1 overflow-y-auto mt-4">
        <PromptGeneratorTab project={project} formData={formData} />
      </TabsContent>
    </Tabs>
  );
}

// Details tab fields (also used as the full create form)
function DetailsFields({
  project,
  formData,
  updateField,
}: {
  project?: Project | null;
  formData: ProjectFormData;
  updateField: <K extends keyof ProjectFormData>(field: K, value: ProjectFormData[K]) => void;
}) {
  const isEditing = !!project;

  return (
    <div className="space-y-6">
      {/* Basic Info */}
      <div className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-zinc-400">
            Project Title
          </label>
          <Input
            value={formData.title}
            onChange={(e) => updateField('title', e.target.value)}
            placeholder="My Awesome Project"
            className="bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-500"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-zinc-400">
            Project Type
          </label>
          <Select
            value={formData.project_type}
            onValueChange={(v) => updateField('project_type', v as ProjectType)}
          >
            <SelectTrigger className="bg-zinc-800 border-zinc-700 text-zinc-100">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-zinc-800 border-zinc-700">
              <SelectItem value="personal" className="text-zinc-100">
                Personal
              </SelectItem>
              <SelectItem value="client" className="text-zinc-100">
                Client
              </SelectItem>
              <SelectItem value="coding" className="text-zinc-100">
                Coding
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-zinc-400">
            Description
          </label>
          <Textarea
            value={formData.description}
            onChange={(e) => updateField('description', e.target.value)}
            placeholder="Brief description of the project..."
            className="bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-500 min-h-[80px]"
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-zinc-500" />
            <label className="text-sm font-medium text-zinc-400">
              Target Completion Date
            </label>
          </div>
          <Input
            type="date"
            value={formData.target_completion_date}
            onChange={(e) => updateField('target_completion_date', e.target.value)}
            className="bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-500"
          />
        </div>
      </div>

      <Separator className="bg-zinc-800" />

      {/* GitHub Integration */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm font-medium text-zinc-400">
          <Github className="w-4 h-4" />
          GitHub Integration
        </div>

        <div className="space-y-2">
          <label className="text-sm text-zinc-500">
            Repository (e.g., username/repo)
          </label>
          <Input
            value={formData.github_repo}
            onChange={(e) => updateField('github_repo', e.target.value)}
            placeholder="ericmperez/my-project"
            className="bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-500"
          />
        </div>

        {isEditing && project!.github_repo && (
          <GitHubWidget project={project!} />
        )}
      </div>

      <Separator className="bg-zinc-800" />

      {/* Client Info */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm font-medium text-zinc-400">
          <User className="w-4 h-4" />
          Client Information
        </div>

        <div className="space-y-2">
          <label className="text-sm text-zinc-500">Client Name</label>
          <Input
            value={formData.client_name}
            onChange={(e) => updateField('client_name', e.target.value)}
            placeholder="Client or company name"
            className="bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-500"
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-zinc-500" />
            <label className="text-sm text-zinc-500">
              Client Notes & Requirements
            </label>
          </div>
          <Textarea
            value={formData.client_notes}
            onChange={(e) => updateField('client_notes', e.target.value)}
            placeholder="What does the client want? Key requirements, expectations..."
            className="bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-500 min-h-[100px]"
          />
        </div>
      </div>

      <Separator className="bg-zinc-800" />

      {/* Next Steps */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm font-medium text-zinc-400">
          <ArrowRight className="w-4 h-4" />
          Next Steps
        </div>

        <Textarea
          value={formData.next_steps}
          onChange={(e) => updateField('next_steps', e.target.value)}
          placeholder="What should you work on next session? Tasks to complete..."
          className="bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-500 min-h-[80px]"
        />
      </div>
    </div>
  );
}

// Simple create form (no tabs)
function CreateForm({
  formData,
  updateField,
}: {
  formData: ProjectFormData;
  updateField: <K extends keyof ProjectFormData>(field: K, value: ProjectFormData[K]) => void;
}) {
  return (
    <div className="py-4 overflow-y-auto flex-1">
      <DetailsFields formData={formData} updateField={updateField} />
    </div>
  );
}
