import { PageHeader } from "@/components/PageHeader";
import { WeekForm } from "@/components/WeekForm";

export default function NuevaSemanaPage() {
  return (
    <div>
      <PageHeader title="Nueva semana" description="Crear semana con estructura base" />
      <WeekForm />
    </div>
  );
}
