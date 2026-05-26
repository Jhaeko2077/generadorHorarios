export default function ErrorMessage({ error }: { error: unknown }) {
  return <div className="notice danger">{error instanceof Error ? error.message : "Something went wrong"}</div>;
}
