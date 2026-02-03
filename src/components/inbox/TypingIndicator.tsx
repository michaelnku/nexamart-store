export default function TypingIndicator() {
  return (
    <div className="flex items-end gap-2">
      <div className="rounded-2xl bg-muted px-3 py-2">
        <div className="flex items-center gap-1">
          <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/60 [animation-delay:0ms]" />
          <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/60 [animation-delay:120ms]" />
          <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/60 [animation-delay:240ms]" />
        </div>
      </div>
    </div>
  );
}
