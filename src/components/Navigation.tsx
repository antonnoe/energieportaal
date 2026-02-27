import { useToolState } from '../context/ToolStateContext';

const TABS = [
  { id: 'snel' as const, label: 'Snel advies', emoji: '⚡' },
  { id: 'expert' as const, label: 'Expertmodus', emoji: '🔬' },
  { id: 'subsidie' as const, label: 'Subsidie/finance', emoji: '💶' },
];

export function Navigation() {
  const { toolState, setActiveTab } = useToolState();

  return (
    <nav className="sticky top-0 z-10 bg-white shadow-sm">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-center gap-3 py-3 border-b border-gray-100">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold"
            style={{ backgroundColor: '#800000' }}
          >
            EP
          </div>
          <span className="font-heading font-bold text-lg" style={{ color: '#800000' }}>
            EnergiePortaal
          </span>
        </div>

        {/* Tabs */}
        <div className="flex gap-0 overflow-x-auto">
          {TABS.map((tab) => {
            const isActive = toolState.activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={[
                  'flex-1 min-w-0 py-3 px-2 text-sm font-medium transition-colors whitespace-nowrap',
                  'border-b-2 focus:outline-none',
                  isActive
                    ? 'border-[#800000] text-[#800000]'
                    : 'border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-300',
                ].join(' ')}
                aria-selected={isActive}
                role="tab"
              >
                <span className="mr-1">{tab.emoji}</span>
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
