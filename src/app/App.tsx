import type { ReactNode } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import GlobalKeyboardShortcuts from '../components/GlobalKeyboardShortcuts'
import { AiPromptsPage } from '../features/ai-prompts'
import { DashboardPage } from '../features/dashboard'
import { EncyclopediaPage, EncyclopediaTopicPage } from '../features/encyclopedia'
import { HelpbookPage } from '../features/helpbook'
import { NotesPage } from '../features/notes'
import { RecycleBinCategoryPage, RecycleBinPage } from '../features/recycle-bin'
import { SettingsPage } from '../features/settings'
import { SettingsProvider } from '../features/settings/context/SettingsContext'
import { TodoPage } from '../features/todo'
import { isLoggedIn } from '../lib/sessionAuth'
import LoginPage from '../pages/LoginPage'
import NotFound from '../pages/NotFound'

type RequireLoginProps = {
  children: ReactNode
}

const RequireLogin = ({ children }: RequireLoginProps) => {
  if (!isLoggedIn()) {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}

const App = () => {
  return (
    <SettingsProvider>
      <GlobalKeyboardShortcuts />
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route
          path="/dashboard"
          element={
            <RequireLogin>
              <DashboardPage />
            </RequireLogin>
          }
        />
        <Route
          path="/helpbook"
          element={
            <RequireLogin>
              <HelpbookPage />
            </RequireLogin>
          }
        />
        <Route
          path="/ai-prompts"
          element={
            <RequireLogin>
              <AiPromptsPage />
            </RequireLogin>
          }
        />
        <Route
          path="/notes/*"
          element={
            <RequireLogin>
              <NotesPage />
            </RequireLogin>
          }
        />
        <Route
          path="/encyclopedia"
          element={
            <RequireLogin>
              <EncyclopediaPage />
            </RequireLogin>
          }
        />
        <Route
          path="/encyclopedia/:topicId"
          element={
            <RequireLogin>
              <EncyclopediaTopicPage />
            </RequireLogin>
          }
        />
        <Route
          path="/todo"
          element={
            <RequireLogin>
              <TodoPage />
            </RequireLogin>
          }
        />
        <Route
          path="/recycle-bin"
          element={
            <RequireLogin>
              <RecycleBinPage />
            </RequireLogin>
          }
        />
        <Route
          path="/recycle-bin/:categoryId"
          element={
            <RequireLogin>
              <RecycleBinCategoryPage />
            </RequireLogin>
          }
        />
        <Route
          path="/settings"
          element={
            <RequireLogin>
              <SettingsPage />
            </RequireLogin>
          }
        />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </SettingsProvider>
  )
}

export default App
