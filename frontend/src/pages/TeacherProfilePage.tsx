import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { myProfile, updateMyProfile } from "../api/teachers";
import ErrorMessage from "../components/ErrorMessage";
import FormField from "../components/FormField";
import Loading from "../components/Loading";
import { shifts } from "../utils/constants";

const employmentTypes = ["part_time", "full_time", "extended_availability"];
const academicRoles = ["theory_teacher", "lab_teacher", "workshop_teacher", "coordinator", "mixed", "computer_lab"];

export default function TeacherProfilePage() {
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ["me-profile"], queryFn: myProfile });
  const [form, setForm] = useState<Record<string, string | number | boolean>>({});
  const [message, setMessage] = useState("");
  const mutation = useMutation({
    mutationFn: updateMyProfile,
    onSuccess: async () => {
      setMessage("Profile saved.");
      await queryClient.invalidateQueries({ queryKey: ["me-profile"] });
    }
  });

  useEffect(() => {
    if (query.data) {
      setForm({
        teacher_code: query.data.teacher_code || "",
        employment_type: query.data.employment_type,
        academic_role: query.data.academic_role,
        max_weekly_hours: query.data.max_weekly_hours,
        min_weekly_hours: query.data.min_weekly_hours,
        max_daily_hours: query.data.max_daily_hours,
        max_consecutive_blocks: query.data.max_consecutive_blocks,
        preferred_shift: query.data.preferred_shift,
        can_teach_theory: query.data.can_teach_theory,
        can_teach_labs: query.data.can_teach_labs,
        can_teach_workshops: query.data.can_teach_workshops,
        can_teach_online: query.data.can_teach_online,
        is_available_for_substitution: query.data.is_available_for_substitution,
        notes: query.data.notes || ""
      });
    }
  }, [query.data]);

  if (query.isLoading) return <Loading />;
  if (query.error) return <ErrorMessage error={query.error} />;

  const set = (name: string, value: string | number | boolean) => setForm((prev) => ({ ...prev, [name]: value }));

  return (
    <div>
      <h1>Teacher Profile</h1>
      <section className="panel">
        <p><strong>{query.data?.user.full_name}</strong> / {query.data?.user.email}</p>
      </section>
      <form
        className="panel formGrid"
        onSubmit={(event) => {
          event.preventDefault();
          mutation.mutate(form as any);
        }}
      >
        <FormField label="Teacher code" name="teacher_code" value={form.teacher_code ?? ""} onChange={set} />
        <FormField label="Employment" name="employment_type" options={employmentTypes} value={form.employment_type ?? "part_time"} onChange={set} />
        <FormField label="Academic role" name="academic_role" options={academicRoles} value={form.academic_role ?? "theory_teacher"} onChange={set} />
        <FormField label="Max weekly hours" name="max_weekly_hours" type="number" value={form.max_weekly_hours ?? 8} onChange={set} />
        <FormField label="Min weekly hours" name="min_weekly_hours" type="number" value={form.min_weekly_hours ?? 0} onChange={set} />
        <FormField label="Max daily hours" name="max_daily_hours" type="number" value={form.max_daily_hours ?? 4} onChange={set} />
        <FormField label="Max consecutive blocks" name="max_consecutive_blocks" type="number" value={form.max_consecutive_blocks ?? 2} onChange={set} />
        <FormField label="Preferred shift" name="preferred_shift" options={shifts} value={form.preferred_shift ?? "any"} onChange={set} />
        <FormField label="Can teach theory" name="can_teach_theory" type="checkbox" value={form.can_teach_theory ?? false} onChange={set} />
        <FormField label="Can teach labs" name="can_teach_labs" type="checkbox" value={form.can_teach_labs ?? false} onChange={set} />
        <FormField label="Can teach workshops" name="can_teach_workshops" type="checkbox" value={form.can_teach_workshops ?? false} onChange={set} />
        <FormField label="Can teach online" name="can_teach_online" type="checkbox" value={form.can_teach_online ?? false} onChange={set} />
        <FormField label="Available for substitution" name="is_available_for_substitution" type="checkbox" value={form.is_available_for_substitution ?? false} onChange={set} />
        <FormField label="Notes" name="notes" value={form.notes ?? ""} onChange={set} />
        <button>Save profile</button>
      </form>
      {message && <div className="notice">{message}</div>}
      {mutation.error && <ErrorMessage error={mutation.error} />}
    </div>
  );
}
