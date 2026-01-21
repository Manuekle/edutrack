interface HeadingProps {
  title: string;
  description: string;
}

export const Heading: React.FC<HeadingProps> = ({ title, description }) => {
  return (
    <div>
      <h2 className="sm:text-3xl text-2xl font-semibold tracking-card">{title}</h2>
      <p className="text-xs text-muted-foreground">{description}</p>
    </div>
  );
};
