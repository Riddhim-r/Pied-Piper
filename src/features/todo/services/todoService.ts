import { desktopApi } from '../../../lib/desktopApi'
import type { TodoState } from '../types/todo'

export const getTodoState = async () => {
  return desktopApi.getTodoState() as Promise<TodoState>
}

export const createTodoList = async (name: string) => {
  return desktopApi.createTodoList({ name })
}

export const addTodoTask = async (title: string) => {
  return desktopApi.addTodoTask({ title })
}

export const setTodoTaskCompleted = async (taskId: string, isCompleted: boolean) => {
  return desktopApi.setTodoTaskCompleted(taskId, isCompleted)
}

export const deleteTodoList = async () => {
  return desktopApi.deleteTodoList()
}
