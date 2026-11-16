import GlassCard from './GlassCard'

const servicePaths = {
  shirt: <path d="M8 4 4 6 2 11l4 2 2-3v10h8V10l2 3 4-2-2-5-4-2a4 4 0 0 1-8 0Z" />,
  cap: <path d="M4 14a8 8 0 0 1 16 0M4 14h16c1.5 0 2 1 2 2-3 1-6 1-9 0H4v-2Zm8-8v8" />,
  jacket: <path d="m8 3-4 3-2 12 4 1 1-6v8h10v-8l1 6 4-1-2-12-4-3-4 4-4-4Zm4 4v14M8 3l4 4 4-4" />,
}

function ServiceCard({ type, title, description }) {
  return (
    <GlassCard as="article" className="about-service">
      <svg aria-hidden="true" className="about-icon" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24">
        {servicePaths[type]}
      </svg>
      <h3>{title}</h3>
      <p>{description}</p>
    </GlassCard>
  )
}

export default ServiceCard
