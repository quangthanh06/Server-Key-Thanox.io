import './Card.css';

interface CardProps {
  title: string;
  tag?: string;
  children: React.ReactNode;
}

export function Card({ title, tag, children }: CardProps) {
  return (
    <div className="pk-card">
      <div className="pk-card-header">
        {tag && <span className="pk-card-tag">{tag}</span>}
        <span className="pk-card-title">{title}</span>
      </div>
      {children}
    </div>
  );
}
