"use client"

export function FloatingElements() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Floating Particles */}
      {[...Array(20)].map((_, i) => (
        <div
          key={i}
          className="absolute w-2 h-2 bg-emerald-400/30 rounded-full animate-float"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 5}s`,
            animationDuration: `${3 + Math.random() * 4}s`,
          }}
        />
      ))}

      {/* Large Floating Orbs */}
      <div
        className="absolute top-20 left-10 w-64 h-64 bg-gradient-to-br from-emerald-500/10 to-transparent rounded-full blur-3xl animate-float"
        style={{ animationDuration: "8s" }}
      ></div>
      <div
        className="absolute bottom-20 right-10 w-96 h-96 bg-gradient-to-br from-cyan-500/10 to-transparent rounded-full blur-3xl animate-float"
        style={{ animationDuration: "12s", animationDelay: "2s" }}
      ></div>
      <div
        className="absolute top-1/2 left-1/2 w-48 h-48 bg-gradient-to-br from-teal-500/10 to-transparent rounded-full blur-3xl animate-float"
        style={{ animationDuration: "10s", animationDelay: "4s" }}
      ></div>
    </div>
  )
}
