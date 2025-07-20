export default function Watermark() {
  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      <div className="absolute inset-0 opacity-[0.02] text-gray-500 dark:text-gray-400">
        {/* Create a grid of watermarks */}
        {Array.from({ length: 20 }).map((_, rowIndex) =>
          Array.from({ length: 10 }).map((_, colIndex) => (
            <div
              key={`${rowIndex}-${colIndex}`}
              className="absolute text-xl font-bold transform rotate-[-25deg] select-none"
              style={{
                left: `${(colIndex * 25) - 5}%`,
                top: `${(rowIndex * 8) - 2}%`,
                transform: 'rotate(-25deg)',
              }}
            >
              LIVE PREVIEW by NerochazeDev
            </div>
          ))
        )}
      </div>
    </div>
  );
}