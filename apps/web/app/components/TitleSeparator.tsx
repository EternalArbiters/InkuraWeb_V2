export default function TitleSeparator({ className = "mt-6" }: { className?: string }) {
  return <div className={`h-px ${className}`} style={{ background: "var(--ink-border)" }} />;
}
