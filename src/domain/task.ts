export const TASK_CATEGORIES = [
  'Trabajo',
  'Estudio',
  'Personal',
  'Salud',
  'Otros',
] as const;

export const TASK_PRIORITIES = [
  'low',
  'medium',
  'high',
] as const;

export type TaskCategory = (typeof TASK_CATEGORIES)[number];
export type TaskPriority = (typeof TASK_PRIORITIES)[number];

export interface Task {
  id: string;
  title: string;
  description: string;
  category: TaskCategory;
  priority: TaskPriority;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTaskInput {
  title: string;
  description: string;
  category: TaskCategory;
  priority: TaskPriority;
}

export type UpdateTaskInput = CreateTaskInput;

export type TaskStatusFilter = 'all' | 'pending' | 'completed';
export type TaskPriorityFilter = 'all' | TaskPriority;

export interface TaskFilters {
  status: TaskStatusFilter;
  priority: TaskPriorityFilter;
  search: string;
}
