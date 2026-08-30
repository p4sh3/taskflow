import type { Task } from './task.ts';

export interface TaskRepository {
  getAll(): Task[];
  save(task: Task): void;
  delete(id: string): void;
  replaceAll(tasks: Task[]): void;
}
