export default function LoadingScreen() {
  return (
    <div className="fixed inset-0 bg-dark-900 flex items-center justify-center z-50">
      <div className="flex flex-col items-center gap-4">
        {/* Logo */}
        <div className="w-16 h-16 relative">
          <div className="absolute inset-0 bg-primary-500 rounded-lg animate-ping opacity-75" />
          <div className="relative bg-primary-500 rounded-lg w-full h-full flex items-center justify-center">
            <svg
              className="w-10 h-10 text-primary-foreground"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
          </div>
        </div>

        {/* Text */}
        <div className="text-center">
          <h2 className="text-xl font-semibold text-foreground">Monitor</h2>
          <p className="text-sm text-muted-foreground mt-1">Loading...</p>
        </div>

        {/* Progress bar */}
        <div className="w-48 h-1 bg-dark-600 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-primary-500 to-purple-500 rounded-full animate-progress" />
        </div>
      </div>
    </div>
  );
}
