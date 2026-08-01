import { Link } from "react-router-dom";
import TopNav from '../../../components/TopNav'
import LogoutButton from '../../../components/LogoutButton'
import PageHeader from '../../../components/PageHeader'

const DashboardPage = () => {
  return (
    <div className="page">
      <TopNav
        title="Pied Piper"
        subtitle="Bread-winner workspace"
        rightSlot={<LogoutButton />}
      />
      <div className="content">
        <PageHeader
          title="Dashboard"
          description="Manage your personal knowledge and productivity tools."
        />

        <div className="grid">
          <Link to="/helpbook" className="card link-card">
            <h3>Helpbook</h3>
            <p>Maintain the great library of solutions.</p>
          </Link>
          <Link to="/ai-prompts" className="card link-card">
            <h3>AI Prompt Vault</h3>
            <p>Maintain reusable prompts for every situation.</p>
          </Link>
          <Link to="/notes" className="card link-card">
            <h3>Notes for Noobs</h3>
            <p>Open the personal notebook workspace.</p>
          </Link>
          <Link to="/encyclopedia" className="card link-card">
            <h3>Encyclopedia</h3>
            <p>Organize useful links inside topics.</p>
          </Link>
          <Link to="/todo" className="card link-card">
            <h3>Todo</h3>
            <p>Maintain one focused task list.</p>
          </Link>
          <Link to="/recycle-bin" className="card link-card">
            <h3>Recycle Bin</h3>
            <p>Review deleted knowledge items.</p>
          </Link>
          <Link to="/settings" className="card link-card">
            <h3>Settings</h3>
            <p>Manage application and database preferences.</p>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage
