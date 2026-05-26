import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { registerTeacher } from "../api/auth";
import FormField from "../components/FormField";

export default function RegisterTeacherPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    password: "",
    employment_type: "part_time",
    academic_role: "theory_teacher",
    max_weekly_hours: 10,
    max_daily_hours: 4,
    max_consecutive_blocks: 2,
    preferred_shift: "morning",
    can_teach_theory: true,
    can_teach_labs: false,
    can_teach_workshops: false
  });
  const set = (name: string, value: string | number | boolean) => setForm((prev) => ({ ...prev, [name]: value }));
  return (
    <div className="authPage">
      <form
        className="authPanel wide"
        onSubmit={async (event) => {
          event.preventDefault();
          await registerTeacher(form);
          navigate("/login");
        }}
      >
        <h1>Teacher registration</h1>
        <FormField label="Full name" name="full_name" value={form.full_name} onChange={set} />
        <FormField label="Email" name="email" value={form.email} onChange={set} />
        <FormField label="Password" name="password" type="password" value={form.password} onChange={set} />
        <FormField label="Employment" name="employment_type" value={form.employment_type} options={["part_time", "full_time", "extended_availability"]} onChange={set} />
        <FormField label="Role" name="academic_role" value={form.academic_role} options={["theory_teacher", "lab_teacher", "workshop_teacher", "coordinator", "mixed", "computer_lab"]} onChange={set} />
        <FormField label="Max weekly hours" name="max_weekly_hours" type="number" value={form.max_weekly_hours} onChange={set} />
        <FormField label="Max daily hours" name="max_daily_hours" type="number" value={form.max_daily_hours} onChange={set} />
        <FormField label="Max consecutive blocks" name="max_consecutive_blocks" type="number" value={form.max_consecutive_blocks} onChange={set} />
        <button>Create teacher account</button>
        <Link to="/login">Back to login</Link>
      </form>
    </div>
  );
}
