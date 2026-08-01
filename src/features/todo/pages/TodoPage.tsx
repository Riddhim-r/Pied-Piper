import { type FormEvent, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import ConfirmDialog from '../../../components/ConfirmDialog'
import PageHeader from '../../../components/PageHeader'
import TopNav from '../../../components/TopNav'
import {
  addTodoTask,
  createTodoList,
  deleteTodoList,
  getTodoState,
  setTodoTaskCompleted,
} from '../services/todoService'
import type { TodoState } from '../types/todo'

const emptyState: TodoState = {
  list: null,
  tasks: [],
}

const getErrorMessage = (error: unknown, fallback: string) => {
  return error instanceof Error ? error.message : fallback
}

const TodoPage = () => {
  const [todoState, setTodoState] = useState<TodoState>(emptyState)
  const [listName, setListName] = useState('')
  const [taskTitle, setTaskTitle] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [busyTaskId, setBusyTaskId] = useState<string | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [error, setError] = useState('')

  const loadTodo = async () => {
    setIsLoading(true)

    try {
      setTodoState(await getTodoState())
      setError('')
    } catch (loadError) {
      console.error(loadError)
      setError(getErrorMessage(loadError, 'Unable to load the Todo list.'))
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadTodo()
  }, [])

  const handleCreateList = async (event: FormEvent) => {
    event.preventDefault()
    const trimmedName = listName.trim()
    if (!trimmedName) {
      setError('List name is required.')
      return
    }

    setIsSaving(true)
    setError('')

    try {
      await createTodoList(trimmedName)
      setListName('')
      await loadTodo()
    } catch (createError) {
      console.error(createError)
      setError(getErrorMessage(createError, 'Could not create the Todo list.'))
    } finally {
      setIsSaving(false)
    }
  }

  const handleAddTask = async (event: FormEvent) => {
    event.preventDefault()
    const trimmedTitle = taskTitle.trim()
    if (!trimmedTitle) {
      setError('Task is required.')
      return
    }

    setIsSaving(true)
    setError('')

    try {
      await addTodoTask(trimmedTitle)
      setTaskTitle('')
      await loadTodo()
    } catch (addError) {
      console.error(addError)
      setError(getErrorMessage(addError, 'Could not add the task.'))
    } finally {
      setIsSaving(false)
    }
  }

  const toggleTask = async (taskId: string, isCompleted: boolean) => {
    setBusyTaskId(taskId)
    setError('')

    try {
      await setTodoTaskCompleted(taskId, isCompleted)
      await loadTodo()
    } catch (toggleError) {
      console.error(toggleError)
      setError(getErrorMessage(toggleError, 'Could not update the task.'))
    } finally {
      setBusyTaskId(null)
    }
  }

  const confirmDeleteList = async () => {
    setIsSaving(true)
    setError('')

    try {
      await deleteTodoList()
      setShowDeleteConfirm(false)
      await loadTodo()
    } catch (deleteError) {
      console.error(deleteError)
      setShowDeleteConfirm(false)
      setError(getErrorMessage(deleteError, 'Could not delete the Todo list.'))
    } finally {
      setIsSaving(false)
    }
  }

  const completedCount = todoState.tasks.filter((task) => task.isCompleted).length
  const canDeleteList =
    todoState.list !== null &&
    todoState.tasks.length > 0 &&
    completedCount === todoState.tasks.length

  return (
    <div className="page">
      <TopNav
        title="Pied Piper"
        subtitle="Todo"
        rightSlot={
          <Link className="btn ghost" to="/dashboard">
            Back
          </Link>
        }
      />

      <div className="content">
        <ConfirmDialog
          open={showDeleteConfirm}
          title="Delete Completed List?"
          message="The list and all of its completed tasks will be removed permanently. You can then create a new list."
          confirmText="Delete List"
          cancelText="Cancel"
          onCancel={() => setShowDeleteConfirm(false)}
          onConfirm={confirmDeleteList}
        />

        {isLoading ? <div className="card">Loading Todo...</div> : null}

        {!isLoading && !todoState.list ? (
          <>
            <PageHeader
              title="Todo"
              description="Create one focused list. A second list cannot be created until this one is finished and deleted."
            />

            <form className="card form-grid" onSubmit={handleCreateList}>
              <label className="field">
                <span>List name</span>
                <input
                  data-global-create
                  value={listName}
                  onChange={(event) => setListName(event.target.value)}
                  placeholder="Things to finish this week"
                  maxLength={120}
                  autoFocus
                />
              </label>

              {error ? <p className="error">{error}</p> : null}

              <div className="form-actions">
                <button className="btn primary" type="submit" disabled={isSaving}>
                  {isSaving ? 'Creating...' : 'Create List'}
                </button>
              </div>
            </form>
          </>
        ) : null}

        {!isLoading && todoState.list ? (
          <>
            <PageHeader
              title={todoState.list.name}
              description="Completed tasks automatically move below the unfinished tasks."
              actionSlot={
                <button
                  className="btn danger"
                  type="button"
                  disabled={!canDeleteList || isSaving}
                  title={
                    canDeleteList
                      ? 'Delete this completed list'
                      : 'Complete every task before deleting the list'
                  }
                  onClick={() => setShowDeleteConfirm(true)}
                >
                  Delete List
                </button>
              }
            />

            <div className="card todo-summary">
              <strong>
                {completedCount} of {todoState.tasks.length} completed
              </strong>
              {!canDeleteList ? (
                <span className="muted">Finish every task to unlock Delete List.</span>
              ) : (
                <span className="muted">This list is ready to be deleted.</span>
              )}
            </div>

            <form className="card todo-composer" onSubmit={handleAddTask}>
              <label className="field">
                <span>New task</span>
                <input
                  data-global-create
                  value={taskTitle}
                  onChange={(event) => setTaskTitle(event.target.value)}
                  placeholder="Add the next thing to do"
                  maxLength={240}
                />
              </label>
              <button className="btn primary" type="submit" disabled={isSaving}>
                {isSaving ? 'Adding...' : 'Add Task'}
              </button>
            </form>

            {error ? <p className="error">{error}</p> : null}

            {todoState.tasks.length === 0 ? (
              <div className="card empty-state">
                <h3>No tasks yet</h3>
                <p>Add the first task to begin this list.</p>
              </div>
            ) : (
              <div className="stack">
                {todoState.tasks.map((task) => (
                  <label
                    className={`card todo-task${task.isCompleted ? ' completed' : ''}`}
                    key={task.id}
                  >
                    <input
                      type="checkbox"
                      checked={task.isCompleted}
                      disabled={busyTaskId !== null}
                      onChange={(event) => toggleTask(task.id, event.target.checked)}
                    />
                    <span>{task.title}</span>
                  </label>
                ))}
              </div>
            )}
          </>
        ) : null}
      </div>
    </div>
  )
}

export default TodoPage
