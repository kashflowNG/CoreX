export default function Watermark() {
  return (
    <div className="fixed inset-0 pointer-events-none z-40 overflow-hidden">
      <div className="absolute inset-0 opacity-[0.12] text-gray-500 dark:text-gray-400">
        {/* Create a grid of watermarks */}
        {Array.from({ length: 15 }).map((_, rowIndex) =>
          Array.from({ length: 8 }).map((_, colIndex) => (
            <div
              key={`${rowIndex}-${colIndex}`}
              className="absolute text-lg font-semibold transform rotate-[-25deg] select-none whitespace-nowrap"
              style={{
                left: `${(colIndex * 30) - 10}%`,
                top: `${(rowIndex * 10) - 5}%`,
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