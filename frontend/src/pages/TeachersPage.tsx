import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import {
  createTeacherAvailability,
  deleteTeacherAvailability,
  getTeacherAvailability,
  listTeachers,
  updateTeacherAvailability,
  updateTeacherProfile
} from "../api/teachers";
import ErrorMessage from "../components/ErrorMessage";
import FormField from "../components/FormField";
import Loading from "../components/Loading";
import type { AvailabilityBlock, TeacherProfile } from "../types/teacher";
import { dayOptions, shifts } from "../utils/constants";

const employmentTypes = ["part_time", "full_time", "extended_availability"];
const academicRoles = ["theory_teacher", "lab_teacher", "workshop_teacher", "coordinator", "mixed", "computer_lab"];
const availabilityTypes = ["preferred", "available", "discouraged", "unavailable"];

const emptyAvailabilityForm = {
  day_of_week: "monday",
  start_time: "18:00",
  end_time: "20:00",
  availability_type: "available",
  max_hours_in_range: "",
  reason: ""
};

type ProfileForm = Record<string, string | number | boolean>;

export default function TeachersPage() {
  const qc = useQueryClient();
  const teachers = useQuery({ queryKey: ["admin-teachers"], queryFn: listTeachers });
  const [selectedId, setSelectedId] = useState("");
  const selectedTeacher = useMemo(
    () => teachers.data?.find((teacher) => teacher.id === selectedId) ?? teachers.data?.[0],
    [teachers.data, selectedId]
  );

  useEffect(() => {
    if (!selectedId && teachers.data?.length) setSelectedId(teachers.data[0].id);
  }, [selectedId, teachers.data]);

  if (teachers.isLoading) return <Loading />;
  if (teachers.error) return <ErrorMessage error={teachers.error} />;

  return (
    <div>
      <h1>Docentes</h1>
      <div className="notice">
        Gestiona perfiles y disponibilidad docente. Las franjas marcadas como no disponibles son restricciones duras para OR-Tools.
      </div>
      <TeachersTable teachers={teachers.data || []} selectedId={selectedTeacher?.id || ""} onSelect={setSelectedId} />
      {selectedTeacher && (
        <div className="twoColumn">
          <ProfileEditor teacher={selectedTeacher} onSaved={() => qc.invalidateQueries({ queryKey: ["admin-teachers"] })} />
          <AvailabilityEditor teacher={selectedTeacher} />
        </div>
      )}
    </div>
  );
}

function TeachersTable({
  teachers,
  selectedId,
  onSelect
}: {
  teachers: TeacherProfile[];
  selectedId: string;
  onSelect: (teacherId: string) => void;
}) {
  if (!teachers.length) return <div className="notice">Todavia no hay docentes registrados.</div>;
  return (
    <div className="tableWrap">
      <table>
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Email</th>
            <th>Codigo</th>
            <th>Contrato</th>
            <th>Rol academico</th>
            <th>Max. semanal</th>
            <th>Max. diario</th>
            <th>Consecutivos</th>
            <th>Turno preferido</th>
            <th>Teoria</th>
            <th>Labs</th>
            <th>Talleres</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {teachers.map((teacher) => (
            <tr key={teacher.id} className={teacher.id === selectedId ? "selectedRow" : ""}>
              <td>{teacher.user.full_name}</td>
              <td>{teacher.user.email}</td>
              <td>{teacher.teacher_code || ""}</td>
              <td>{teacher.employment_type}</td>
              <td>{teacher.academic_role}</td>
              <td>{teacher.max_weekly_hours}</td>
              <td>{teacher.max_daily_hours}</td>
              <td>{teacher.max_consecutive_blocks}</td>
              <td>{teacher.preferred_shift}</td>
              <td>{yesNo(teacher.can_teach_theory)}</td>
              <td>{yesNo(teacher.can_teach_labs)}</td>
              <td>{yesNo(teacher.can_teach_workshops)}</td>
              <td>{teacher.user.is_active ? "Activo" : "Inactivo"}</td>
              <td>
                <button className="small" onClick={() => onSelect(teacher.id)}>
                  Editar
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ProfileEditor({ teacher, onSaved }: { teacher: TeacherProfile; onSaved: () => void }) {
  const [form, setForm] = useState<ProfileForm>(() => profileToForm(teacher));
  const [message, setMessage] = useState("");
  const mutation = useMutation({
    mutationFn: (payload: Partial<TeacherProfile>) => updateTeacherProfile(teacher.id, payload),
    onSuccess: () => {
      setMessage("Perfil docente guardado.");
      onSaved();
    }
  });

  useEffect(() => {
    setForm(profileToForm(teacher));
    setMessage("");
  }, [teacher]);

  const set = (name: string, value: string | number | boolean) => setForm((prev) => ({ ...prev, [name]: value }));

  return (
    <section className="panel">
      <h2>Perfil de {teacher.user.full_name}</h2>
      <form
        className="formGrid"
        onSubmit={(event) => {
          event.preventDefault();
          mutation.mutate(formToProfilePayload(form));
        }}
      >
        <FormField label="Codigo docente" name="teacher_code" value={form.teacher_code ?? ""} onChange={set} />
        <FormField label="Tipo de contrato" name="employment_type" options={employmentTypes} value={form.employment_type} onChange={set} />
        <FormField label="Rol academico" name="academic_role" options={academicRoles} value={form.academic_role} onChange={set} />
        <FormField label="Horas max. semana" name="max_weekly_hours" type="number" value={form.max_weekly_hours} onChange={set} />
        <FormField label="Horas min. semana" name="min_weekly_hours" type="number" value={form.min_weekly_hours} onChange={set} />
        <FormField label="Horas max. dia" name="max_daily_hours" type="number" value={form.max_daily_hours} onChange={set} />
        <FormField label="Bloques consecutivos" name="max_consecutive_blocks" type="number" value={form.max_consecutive_blocks} onChange={set} />
        <FormField label="Turno preferido" name="preferred_shift" options={shifts} value={form.preferred_shift} onChange={set} />
        <FormField label="Puede teoria" name="can_teach_theory" type="checkbox" value={form.can_teach_theory} onChange={set} />
        <FormField label="Puede laboratorios" name="can_teach_labs" type="checkbox" value={form.can_teach_labs} onChange={set} />
        <FormField label="Puede talleres" name="can_teach_workshops" type="checkbox" value={form.can_teach_workshops} onChange={set} />
        <FormField label="Puede online" name="can_teach_online" type="checkbox" value={form.can_teach_online} onChange={set} />
        <FormField label="Disponible para reemplazo" name="is_available_for_substitution" type="checkbox" value={form.is_available_for_substitution} onChange={set} />
        <FormField label="Notas" name="notes" value={form.notes ?? ""} onChange={set} />
        <button>Guardar perfil</button>
      </form>
      {message && <div className="notice">{message}</div>}
      {mutation.error && <ErrorMessage error={mutation.error} />}
    </section>
  );
}

function AvailabilityEditor({ teacher }: { teacher: TeacherProfile }) {
  const qc = useQueryClient();
  const query = useQuery({
    queryKey: ["admin-teacher-availability", teacher.id],
    queryFn: () => getTeacherAvailability(teacher.id)
  });
  const [form, setForm] = useState<ProfileForm>(emptyAvailabilityForm);
  const [editing, setEditing] = useState<AvailabilityBlock | null>(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    setForm(emptyAvailabilityForm);
    setEditing(null);
    setMessage("");
  }, [teacher.id]);

  const save = useMutation({
    mutationFn: (payload: Partial<AvailabilityBlock>) =>
      editing
        ? updateTeacherAvailability(teacher.id, editing.id, payload)
        : createTeacherAvailability(teacher.id, payload),
    onSuccess: async () => {
      setMessage(editing ? "Bloque actualizado." : "Bloque creado.");
      setEditing(null);
      setForm(emptyAvailabilityForm);
      await qc.invalidateQueries({ queryKey: ["admin-teacher-availability", teacher.id] });
    }
  });

  const del = useMutation({
    mutationFn: (block: AvailabilityBlock) => deleteTeacherAvailability(teacher.id, block.id),
    onSuccess: async () => {
      setMessage("Bloque eliminado.");
      await qc.invalidateQueries({ queryKey: ["admin-teacher-availability", teacher.id] });
    }
  });

  const set = (name: string, value: string | number | boolean) => setForm((prev) => ({ ...prev, [name]: value }));
  const payload = {
    ...form,
    max_hours_in_range: form.max_hours_in_range === "" ? null : Number(form.max_hours_in_range)
  };

  return (
    <section className="panel">
      <h2>Disponibilidad de {teacher.user.full_name}</h2>
      <div className="notice">
        preferred = mejor horario; available = permitido; discouraged = permitido pero evitado; unavailable = prohibido.
      </div>
      <form
        className="formGrid"
        onSubmit={(event) => {
          event.preventDefault();
          save.mutate(payload as Partial<AvailabilityBlock>);
        }}
      >
        <FormField label="Dia" name="day_of_week" options={dayOptions} value={form.day_of_week} onChange={set} />
        <FormField label="Inicio" name="start_time" type="time" value={form.start_time} onChange={set} />
        <FormField label="Fin" name="end_time" type="time" value={form.end_time} onChange={set} />
        <FormField label="Tipo" name="availability_type" options={availabilityTypes} value={form.availability_type} onChange={set} />
        <FormField label="Max. horas en rango" name="max_hours_in_range" type="number" value={form.max_hours_in_range} onChange={set} />
        <FormField label="Motivo" name="reason" value={form.reason} onChange={set} />
        <button>{editing ? "Guardar bloque" : "Agregar bloque"}</button>
        {editing && (
          <button type="button" className="secondary" onClick={() => { setEditing(null); setForm(emptyAvailabilityForm); }}>
            Cancelar
          </button>
        )}
      </form>
      {message && <div className="notice">{message}</div>}
      {(query.error || save.error || del.error) && <ErrorMessage error={query.error || save.error || del.error} />}
      {query.isLoading ? (
        <Loading />
      ) : (
        <div className="tableWrap">
          <table>
            <thead>
              <tr>
                <th>Dia</th>
                <th>Inicio</th>
                <th>Fin</th>
                <th>Tipo</th>
                <th>Max. horas</th>
                <th>Motivo</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {(query.data || []).map((block) => (
                <tr key={block.id}>
                  <td>{block.day_of_week}</td>
                  <td>{formatTime(block.start_time)}</td>
                  <td>{formatTime(block.end_time)}</td>
                  <td>{block.availability_type}</td>
                  <td>{block.max_hours_in_range ?? ""}</td>
                  <td>{block.reason ?? ""}</td>
                  <td>
                    <div className="rowActions">
                      <button className="small" onClick={() => { setEditing(block); setForm(blockToForm(block)); }}>
                        Editar
                      </button>
                      <button className="small dangerButton" onClick={() => confirm("Eliminar este bloque?") && del.mutate(block)}>
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function profileToForm(teacher: TeacherProfile): ProfileForm {
  return {
    teacher_code: teacher.teacher_code || "",
    employment_type: teacher.employment_type,
    academic_role: teacher.academic_role,
    max_weekly_hours: teacher.max_weekly_hours,
    min_weekly_hours: teacher.min_weekly_hours,
    max_daily_hours: teacher.max_daily_hours,
    max_consecutive_blocks: teacher.max_consecutive_blocks,
    preferred_shift: teacher.preferred_shift,
    can_teach_theory: teacher.can_teach_theory,
    can_teach_labs: teacher.can_teach_labs,
    can_teach_workshops: teacher.can_teach_workshops,
    can_teach_online: teacher.can_teach_online,
    is_available_for_substitution: teacher.is_available_for_substitution,
    notes: teacher.notes || ""
  };
}

function formToProfilePayload(form: ProfileForm): Partial<TeacherProfile> {
  return {
    teacher_code: String(form.teacher_code || ""),
    employment_type: String(form.employment_type),
    academic_role: String(form.academic_role),
    max_weekly_hours: Number(form.max_weekly_hours),
    min_weekly_hours: Number(form.min_weekly_hours),
    max_daily_hours: Number(form.max_daily_hours),
    max_consecutive_blocks: Number(form.max_consecutive_blocks),
    preferred_shift: String(form.preferred_shift),
    can_teach_theory: Boolean(form.can_teach_theory),
    can_teach_labs: Boolean(form.can_teach_labs),
    can_teach_workshops: Boolean(form.can_teach_workshops),
    can_teach_online: Boolean(form.can_teach_online),
    is_available_for_substitution: Boolean(form.is_available_for_substitution),
    notes: String(form.notes || "")
  };
}

function blockToForm(block: AvailabilityBlock): ProfileForm {
  return {
    day_of_week: block.day_of_week,
    start_time: formatTime(block.start_time),
    end_time: formatTime(block.end_time),
    availability_type: block.availability_type,
    max_hours_in_range: block.max_hours_in_range ?? "",
    reason: block.reason ?? ""
  };
}

function formatTime(value: string) {
  return value.slice(0, 5);
}

function yesNo(value: boolean) {
  return value ? "Si" : "No";
}
