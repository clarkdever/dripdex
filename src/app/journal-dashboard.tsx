import Link from "next/link";

import type { PrivateJournalQueueViewModel } from "../domain/journal/journal-queue";

type PrivateJournalQueuePageProps = {
  viewModel: PrivateJournalQueueViewModel;
};

export function PrivateJournalQueuePage({ viewModel }: PrivateJournalQueuePageProps) {
  return (
    <main className="journal-shell">
      <section className="journal-device" aria-labelledby="journal-title">
        <header className="device-header journal-device__header">
          <div className="device-brand">
            <span className="device-lens" aria-hidden="true" />
            <div>
              <span>Hill Country DripDex</span>
              <strong>Private Field Journal</strong>
            </div>
          </div>
          <div className="journal-owner-tools" aria-label="Owner access and view mode">
            <div className="device-lights" aria-hidden="true">
              <span />
              <span />
              <span />
            </div>
            <div className="journal-mode" role="group" aria-label="View mode">
              <button aria-pressed={false} disabled type="button">
                {viewModel.mode.publicLabel}
              </button>
              <button aria-pressed={viewModel.mode.active === "private"} disabled type="button">
                {viewModel.mode.privateLabel}
              </button>
            </div>
          </div>
        </header>

        <div className="journal-screen">
          <section className="journal-hero" aria-labelledby="journal-title">
            <div>
              <p>Owner Queue</p>
              <h1 id="journal-title">{viewModel.title}</h1>
              <span>{viewModel.subtitle}</span>
            </div>
            <strong>{viewModel.stats.find((stat) => stat.id === "to_check")?.value ?? 0} To Check</strong>
          </section>

          <section className="journal-summary" aria-label="Private journal summary">
            {viewModel.stats.map((stat) => (
              <article key={stat.id} aria-label={`${stat.label}: ${stat.value}`}>
                <strong>{stat.value}</strong>
                <span>{stat.label}</span>
              </article>
            ))}
          </section>

          <section className="journal-section" aria-labelledby="journal-queue-heading">
            <div className="journal-section__heading">
              <h2 id="journal-queue-heading">Needs Your Eye</h2>
              <span>Fixture queue</span>
            </div>
            <div className="journal-queue-list">
              {viewModel.queueItems.map((item) => (
                <article
                  key={item.id}
                  aria-label={item.title}
                  className={`journal-queue-item journal-queue-item--${item.kind}`}
                >
                  <span className="journal-queue-item__icon" aria-hidden="true">
                    {item.initials}
                  </span>
                  <div className="journal-queue-item__copy">
                    <strong>{item.title}</strong>
                    <span>{item.summary}</span>
                    <div className="journal-queue-item__meta">
                      <span>{item.reviewState}</span>
                      <span>{item.preview.label}</span>
                      <span>{item.preview.description}</span>
                    </div>
                  </div>
                  <Link className="journal-queue-item__action" href={item.href}>
                    {item.actionLabel}
                  </Link>
                </article>
              ))}
            </div>
          </section>

          <section className="journal-section" aria-labelledby="journal-activity-heading">
            <div className="journal-section__heading">
              <h2 id="journal-activity-heading">Recent Field Activity</h2>
              <span>Private log</span>
            </div>
            <div className="journal-activity-list">
              {viewModel.recentActivity.map((activity) => (
                <article key={activity.id}>
                  <span aria-hidden="true" />
                  <div>
                    <strong>{activity.title}</strong>
                    <p>{activity.summary}</p>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <nav className="journal-bottom-nav" aria-label="Private journal navigation">
            {viewModel.navigation.map((item) => (
              <button key={item.id} aria-pressed={item.active} disabled type="button">
                {item.label}
              </button>
            ))}
          </nav>
        </div>
      </section>
    </main>
  );
}
