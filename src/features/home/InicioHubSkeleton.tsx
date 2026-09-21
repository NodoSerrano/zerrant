export function InicioHubSkeleton() {
  return (
    <div
      className="flex flex-col gap-6"
      role="status"
      aria-label="Cargando inicio"
      data-testid="inicio-hub-skeleton"
    >
      <h1 className="font-display text-[22px] font-bold text-text-primary">Inicio</h1>

      <section className="flex flex-col gap-3" aria-labelledby="inicio-eventos-heading-skeleton">
        <h2
          id="inicio-eventos-heading-skeleton"
          className="font-display text-[15px] font-semibold text-text-primary"
        >
          Próximos eventos
        </h2>
        <div className="flex flex-col gap-3">
          <div
            data-skeleton="card"
            className="h-[88px] rounded-[20px] bg-surface-inset/80 border border-border animate-pulse"
          />
          <div
            data-skeleton="card"
            className="h-[88px] rounded-[20px] bg-surface-inset/80 border border-border animate-pulse"
          />
        </div>
      </section>

      <section className="flex flex-col gap-3" aria-labelledby="inicio-cumples-heading-skeleton">
        <h2
          id="inicio-cumples-heading-skeleton"
          className="font-display text-[15px] font-semibold text-text-primary"
        >
          Próximos cumpleaños
        </h2>
        <div className="flex flex-col gap-3">
          <div
            data-skeleton="card"
            className="h-[72px] rounded-[20px] bg-surface-inset/80 border border-border animate-pulse"
          />
          <div
            data-skeleton="card"
            className="h-[72px] rounded-[20px] bg-surface-inset/80 border border-border animate-pulse"
          />
        </div>
      </section>

      <span className="sr-only">Cargando contenido de inicio…</span>
    </div>
  );
}
