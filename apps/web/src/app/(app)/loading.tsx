export default function AppLoading() {
  return (
    <div className="flex flex-1 items-center justify-center">
      <div
        className="h-6 w-6 rounded-full border-2 border-t-transparent animate-spin"
        style={{ borderColor: "var(--color-border)", borderTopColor: "transparent" }}
      />
    </div>
  );
}
