import { useState, useEffect } from 'react';
import { Provider } from 'react-redux';
import { store } from './store';
import { useAppDispatch } from './store/hooks';
import { fetchStateRequest, tickRequest } from './store/slices/coreSlice';
import { ThemeProvider } from './theme/ThemeContext';
import { Sidebar } from './components/Sidebar';
import type { TabType } from './components/Sidebar';
import { Header } from './components/Header';
import { Overview } from './components/Overview';
import { SubsidiaryGrid } from './components/SubsidiaryGrid';
import { SubsidiaryDetail } from './components/SubsidiaryDetail';
import { AgentBoard } from './components/AgentBoard';
import { TaskTerminal } from './components/TaskTerminal';
import { TaskBoard } from './components/TaskBoard';
import { QuestionBoard } from './components/QuestionBoard';
import { AgentChatWindow } from './components/AgentChatWindow';

import { LeadCRM } from './components/LeadCRM';
import { EmployeeDirectory } from './components/EmployeeDirectory';
import { OrgTree } from './components/OrgTree';
import { CatalogBoard } from './components/CatalogBoard';
import { RoleRegistry } from './components/RoleRegistry';
import { BalanceSheet } from './components/BalanceSheet';
import type { Subsidiary } from './types';

function DashboardLayout() {
  const dispatch = useAppDispatch();
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [selectedSubsidiary, setSelectedSubsidiary] = useState<Subsidiary | null>(null);
  const [teamSubTab, setTeamSubTab] = useState<'directory' | 'org'>('directory');
  const [agentsSubTab, setAgentsSubTab] = useState<'agents' | 'blueprints'>('agents');

  useEffect(() => {
    // Initial fetch to populate UI
    dispatch(fetchStateRequest());

    // Start simulation tick loop
    const interval = setInterval(() => {
      dispatch(tickRequest());
    }, 2000);

    return () => clearInterval(interval);
  }, [dispatch]);

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    if (tab !== 'subsidiaries') {
      setSelectedSubsidiary(null);
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return <Overview />;
      case 'subsidiaries':
        if (selectedSubsidiary) {
          return (
            <SubsidiaryDetail
              subsidiary={selectedSubsidiary}
              onClose={() => setSelectedSubsidiary(null)}
            />
          );
        }
        return <SubsidiaryGrid onViewDetails={setSelectedSubsidiary} />;
      case 'transactions':
        return <BalanceSheet />;
      case 'agents':
        return (
          <div className="space-y-5">
            {/* Sub-tab toggle */}
            <div className="flex items-center gap-1 bg-zinc-900/60 border border-zinc-800/60 rounded-xl p-1 w-fit">
              <button
                onClick={() => setAgentsSubTab('agents')}
                className={`text-xs font-semibold px-4 py-2 rounded-lg transition-all ${
                  agentsSubTab === 'agents'
                    ? 'bg-purple-600/30 text-purple-400 border border-purple-600/40'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                👥 Agent Squad
              </button>
              <button
                onClick={() => setAgentsSubTab('blueprints')}
                className={`text-xs font-semibold px-4 py-2 rounded-lg transition-all ${
                  agentsSubTab === 'blueprints'
                    ? 'bg-indigo-600/30 text-indigo-400 border border-indigo-600/40'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                📜 Role Blueprints
              </button>
            </div>
            {agentsSubTab === 'agents' ? <AgentBoard /> : <RoleRegistry />}
          </div>
        );
      case 'tasks':
        return <TaskBoard />;
      case 'catalog':
        return <CatalogBoard />;
      case 'questions':
        return <QuestionBoard />;
      case 'terminal':
        return <TaskTerminal />;
      case 'leads':
        return <LeadCRM />;
      case 'team':
        return (
          <div className="space-y-5">
            {/* Sub-tab toggle */}
            <div className="flex items-center gap-1 bg-zinc-900/60 border border-zinc-800/60 rounded-xl p-1 w-fit">
              <button
                onClick={() => setTeamSubTab('directory')}
                className={`text-xs font-semibold px-4 py-2 rounded-lg transition-all ${
                  teamSubTab === 'directory'
                    ? 'bg-amber-600/30 text-amber-400 border border-amber-600/40'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                👥 Directory
              </button>
              <button
                onClick={() => setTeamSubTab('org')}
                className={`text-xs font-semibold px-4 py-2 rounded-lg transition-all ${
                  teamSubTab === 'org'
                    ? 'bg-indigo-600/30 text-indigo-400 border border-indigo-600/40'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                🌳 Org Tree
              </button>
            </div>
            {teamSubTab === 'directory' ? <EmployeeDirectory /> : <OrgTree />}
          </div>
        );
      default:
        return <Overview />;
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-zinc-950 text-zinc-100 font-sans select-none transition-colors duration-300">
      <Sidebar activeTab={activeTab} setActiveTab={handleTabChange} />

      <main className="flex-1 flex flex-col h-full overflow-hidden bg-gradient-to-tr from-zinc-950 via-zinc-900/90 to-purple-950/10 transition-colors duration-300 min-w-0">
        <div className="flex-1 overflow-y-auto px-4 md:px-8 py-4 md:py-6 pt-16 md:pt-6">
          <Header showMetrics={activeTab === 'overview'} />
          <div className="pb-24 md:pb-16 animate-in fade-in duration-300">
            {renderTabContent()}
          </div>
        </div>
      </main>

      <AgentChatWindow />
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <Provider store={store}>
        <DashboardLayout />
      </Provider>
    </ThemeProvider>
  );
}

export default App;
