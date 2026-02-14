import type { Project, GeneratedPrompt } from './types';

function repoUrl(githubRepo: string): string {
  return `https://github.com/${githubRepo}`;
}

export function generatePrompts(project: Project): GeneratedPrompt[] {
  const prompts: GeneratedPrompt[] = [];
  const repo = project.github_repo;
  const repoLine = repo ? `Repository: ${repoUrl(repo)}` : '';

  // Individual task prompts from next_steps (one per line)
  if (project.next_steps) {
    const lines = project.next_steps
      .split('\n')
      .map((l) => l.replace(/^[-*•]\s*/, '').trim())
      .filter(Boolean);

    for (const line of lines) {
      const parts = [
        `Project: ${project.title}`,
        repoLine,
        '',
        `Task: ${line}`,
      ].filter(Boolean);

      prompts.push({
        label: line.length > 60 ? line.slice(0, 57) + '...' : line,
        prompt: parts.join('\n'),
      });
    }
  }

  // Full context prompt combining everything
  const sections: string[] = [
    `Project: ${project.title}`,
  ];

  if (repoLine) sections.push(repoLine);

  if (project.description) {
    sections.push('', `Description: ${project.description}`);
  }

  if (project.client_name) {
    sections.push('', `Client: ${project.client_name}`);
  }

  if (project.client_notes) {
    sections.push('', `Notes:\n${project.client_notes}`);
  }

  if (project.next_steps) {
    sections.push('', `Tasks:\n${project.next_steps}`);
  }

  sections.push('', 'Please review the repository and implement the tasks listed above.');

  prompts.push({
    label: 'Full Context',
    prompt: sections.join('\n'),
  });

  return prompts;
}
