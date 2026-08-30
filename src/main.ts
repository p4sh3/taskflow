import './style.css';
import { TaskService } from './application/task-service.ts';
import { LocalStorageTaskRepository } from './infrastructure/local-storage-task-repository.ts';
import { TaskView } from './presentation/task-view.ts';

const repository = new LocalStorageTaskRepository();
const service = new TaskService(repository);
new TaskView(service);
