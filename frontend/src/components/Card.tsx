import './Card.css';

interface CardProps {
  title: string;
  tag?: string;
  children: React.ReactNode;
}

export function Card({ title, tag, children }: CardProps) {
  return (
    <div className="card">
      <div className="card-title">
        {tag && <span className="tag">{tag}</span>}
        {title}
      </div>
      {children}
    </div>
  );
}
