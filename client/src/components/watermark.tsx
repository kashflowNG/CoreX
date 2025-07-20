export default function Watermark() {
  return (
    <div className="fixed inset-0 pointer-events-none z-40 overflow-hidden">
      <div className="absolute inset-0 opacity-[0.15] text-gray-500 dark:text-gray-400">
        {/* Create a grid of watermarks with proper spacing */}
        {Array.from({ length: 8 }).map((_, rowIndex) =>
          Array.from({ length: 3 }).map((_, colIndex) => (
            <div
              key={`${rowIndex}-${colIndex}`}
              className="absolute text-base font-medium select-none whitespace-nowrap"
              style={{
                left: `${(colIndex * 60) + 15}%`,
                top: `${(rowIndex * 18) + 8}%`,
                transform: 'rotate(-25deg)',
                transformOrigin: 'center',
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