import type { Task } from '../domain/task.ts';
import type { TaskRepository } from '../domain/task-repository.ts';

const STORAGE_KEY = 'taskflow:tasks:v1';

export class LocalStorageTaskRepository implements TaskRepository {
  getAll(): Task[] {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];

    try {
      const parsed: unknown = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed.filter(this.isTask);
    } catch {
      return [];
    }
  }

  save(task: Task): void {
    const tasks = this.getAll();
    const index = tasks.findIndex((current) => current.id === task.id);

    if (index === -1) tasks.push(task);
    else tasks[index] = task;

    this.persist(tasks);
  }

  delete(id: string): void {
    this.persist(this.getAll().filter((task) => task.id !== id));
  }

  replaceAll(tasks: Task[]): void {
    this.persist(tasks);
  }

  private persist(tasks: Task[]): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  }

  private isTask(value: unknown): value is Task {
    if (typeof value !== 'object' || value === null) return false;
    const item = value as Record<string, unknown>;
    return (
      typeof item.id === 'string' &&
      typeof item.title === 'string' &&
      typeof item.description === 'string' &&
      typeof item.category === 'string' &&
      typeof item.priority === 'string' &&
      typeof item.completed === 'boolean' &&
      typeof item.createdAt === 'string' &&
      typeof item.updatedAt === 'string'
    );
  }
}
