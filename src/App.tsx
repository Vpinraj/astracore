import { useState } from 'react';
import { AppProvider } from './context/AppContext';
import { ThemeProvider } from './theme/ThemeContext';
import { Sidebar } from './components/Sidebar';
import type { TabType } from './components/Sidebar';
import { Header } from './components/Header';
import { Overview } from './components/Overview';
import { SubsidiaryGrid } from './components/SubsidiaryGrid';
import { SubsidiaryDetail } from './components/SubsidiaryDetail';
import { AgentBoard } from './components/AgentBoard';
import { TaskTerminal } from './components/TaskTerminal';
import { DirectorAgent } from './components/DirectorAgent';
import type { Subsidiary } from './types';

function DashboardLayout() {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [selectedSubsidiary, setSelectedSubsidiary] = useState<Subsidiary | null>(null);

  // Helper to change tabs and reset subsidiary sub-view if needed
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
      case 'agents':
        return <AgentBoard />;
      case 'terminal':
        return <TaskTerminal />;
      default:
        return <Overview />;
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-zinc-950 text-zinc-100 font-sans select-none transition-colors duration-300">
      {/* Sidebar Navigation — desktop full sidebar, mobile as a drawer overlay */}
      <Sidebar activeTab={activeTab} setActiveTab={handleTabChange} />

      {/* Main Panel Content Area */}
      <main className="flex-1 flex flex-col h-full overflow-hidden bg-gradient-to-tr from-zinc-950 via-zinc-900/90 to-purple-950/10 transition-colors duration-300 min-w-0">
        {/* Top Scrollable wrapper */}
        <div className="flex-1 overflow-y-auto px-4 md:px-8 py-4 md:py-6 pt-16 md:pt-6">
          {/* Global Header Metrics */}
          <Header />

          {/* Current Tab Screen View */}
          <div className="pb-24 md:pb-16 animate-in fade-in duration-300">
            {renderTabContent()}
          </div>
        </div>
      </main>

      {/* Floating AI Director Voice & Text Assistant */}
      <DirectorAgent />
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AppProvider>
        <DashboardLayout />
      </AppProvider>
    </ThemeProvider>
  );
}

export default App;
