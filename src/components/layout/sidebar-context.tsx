'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import type { ReactNode } from 'react';

type SidebarMode = 'full' | 'icon';
export type DemoRole = 'researcher' | 'lead' | 'manager' | 'admin';

interface SidebarContextType {
  mode: SidebarMode;
  setMode: (mode: SidebarMode) => void;
  collapsed: boolean;
  toggleCollapsed: () => void;
  currentSpace: string;
  setCurrentSpace: (space: string) => void;
  role: DemoRole;
  setRole: (role: DemoRole) => void;
  projectId: string;
  setProjectId: (id: string) => void;
}

const SidebarContext = createContext<SidebarContextType>({
  mode: 'full',
  setMode: () => {},
  collapsed: false,
  toggleCollapsed: () => {},
  currentSpace: 'read',
  setCurrentSpace: () => {},
  role: 'researcher',
  setRole: () => {},
  projectId: 'PROJ-CCUS-01',
  setProjectId: () => {},
});

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<SidebarMode>('full');
  const [collapsed, setCollapsed] = useState(false);
  const [currentSpace, setCurrentSpace] = useState('read');
  const [role, setRoleState] = useState<DemoRole>('researcher');
  const [projectId, setProjectIdState] = useState('PROJ-CCUS-01');
  const setProjectId = useCallback((id: string) => {
    localStorage.setItem('ai4s-current-project', id);
    setProjectIdState(id);
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem('ai4s-demo-role');
    if (saved === 'researcher' || saved === 'lead' || saved === 'manager') setRoleState(saved);
    if (saved === 'admin') setRoleState('manager');
    const project = localStorage.getItem('ai4s-current-project');
    if (project) setProjectIdState(project);
    if (window.innerWidth <= 1280) setCollapsed(true);
  }, []);

  const setRole = useCallback((next: DemoRole) => {
    localStorage.setItem('ai4s-demo-role', next);
    setRoleState(next);
  }, []);

  const toggleCollapsed = useCallback(() => setCollapsed((c) => !c), []);

  return (
    <SidebarContext.Provider
      value={{ mode, setMode, collapsed, toggleCollapsed, currentSpace, setCurrentSpace, role, setRole, projectId, setProjectId }}
    >
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  return useContext(SidebarContext);
}
