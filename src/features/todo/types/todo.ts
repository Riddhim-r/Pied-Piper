export type TodoList = {
  name: string
  createdAt: string
  updatedAt: string
}

export type TodoTask = {
  id: string
  title: string
  isCompleted: boolean
  sortOrder: number
  createdAt: string
  completedAt: string | null
}

export type TodoState = {
  list: TodoList | null
  tasks: TodoTask[]
}
