type Props = {
  label: string;
  name: string;
  type?: string;
  value: string | number | boolean;
  options?: string[];
  onChange: (name: string, value: string | number | boolean) => void;
};

export default function FormField({ label, name, type = "text", value, options, onChange }: Props) {
  if (type === "checkbox") {
    return (
      <label className="field checkbox">
        <input type="checkbox" checked={Boolean(value)} onChange={(event) => onChange(name, event.target.checked)} />
        {label}
      </label>
    );
  }
  return (
    <label className="field">
      <span>{label}</span>
      {options ? (
        <select value={String(value ?? "")} onChange={(event) => onChange(name, event.target.value)}>
          {options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      ) : (
        <input
          type={type}
          value={String(value ?? "")}
          onChange={(event) => onChange(name, type === "number" ? Number(event.target.value) : event.target.value)}
        />
      )}
    </label>
  );
}
