import type { Artifact, Project, Session, Space, Task } from "./types";

export interface ResearchSpaceGroup {
  project: Project;
  projectSpace?: Space;
  topics: Space[];
}

export function groupResearchSpaces(spaces: Space[], projects: Project[]) {
  const personal = spaces.filter((space) => space.type === "PERSONAL");
  const projectSpaces = spaces.filter((space) => space.type === "PROJECT");
  const topics = spaces.filter((space) => space.type === "TOPIC");
  const projectIds = new Set(
    [...projectSpaces, ...topics].map((space) => space.projectId),
  );

  return {
    personal,
    projects: projects
      .filter((project) => projectIds.has(project.id))
      .map((project) => ({
        project,
        projectSpace: projectSpaces.find(
          (space) => space.projectId === project.id,
        ),
        topics: topics.filter((space) => space.projectId === project.id),
      })),
  };
}

export function collectChatFiles(
  artifacts: Artifact[],
  task?: Task,
  session?: Session,
  canReadReference: (id: string) => boolean = () => true,
) {
  const outputs = artifacts.filter((artifact) =>
    task
      ? artifact.taskId === task.id
      : !!session && artifact.sessionId === session.id,
  );
  const referenceIds = [
    ...(session?.contextIds ?? []),
    ...(task?.contextIds ?? []),
    ...outputs.flatMap((artifact) => artifact.references),
  ].filter(
    (id, index, values) =>
      values.indexOf(id) === index && canReadReference(id),
  );

  return { outputs, referenceIds };
}

export function resolveWorkspaceSession(
  sessions: Session[],
  requestedSessionId: string | null,
  task?: Task,
) {
  if (requestedSessionId) {
    const requested = sessions.find(
      (session) =>
        session.id === requestedSessionId &&
        (!task || task.sessionIds.includes(session.id)),
    );
    if (requested) return requested;
  }
  return task
    ? sessions.find((session) => task.sessionIds.includes(session.id))
    : undefined;
}

export function isSpaceSwitchable(space: Space) {
  return space.status === "ACTIVE";
}
