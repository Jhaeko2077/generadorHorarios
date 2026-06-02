import { NavLink } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

const adminLinks = [
  ["/", "Panel"],
  ["/admin/teachers", "Docentes"],
  ["/admin/academic-terms", "Periodos"],
  ["/admin/programs", "Programas"],
  ["/admin/cycles", "Ciclos"],
  ["/admin/sections", "Secciones"],
  ["/admin/courses", "Cursos"],
  ["/admin/rooms", "Aulas"],
  ["/admin/time-slots", "Bloques horarios"],
  ["/admin/course-offerings", "Asignaciones"],
  ["/manual-locks", "Bloqueos manuales"],
  ["/generate", "Generar horario"],
  ["/schedules/section", "Por seccion"],
  ["/schedules/teacher", "Por docente"],
  ["/schedules/room", "Por aula"],
  ["/conflicts", "Diagnosticos"],
  ["/recommendations", "Recomendaciones"],
  ["/audit", "Auditoria"]
];

const teacherLinks = [
  ["/my-schedule", "Mi horario"],
  ["/teacher/profile", "Mi perfil"],
  ["/teacher/availability", "Mi disponibilidad"]
];

export default function Sidebar() {
  const { data: user } = useAuth();
  const links = user?.role === "admin" ? adminLinks : teacherLinks;
  return (
    <aside className="sidebar">
      {links.map(([to, label]) => (
        <NavLink key={to} to={to}>
          {label}
        </NavLink>
      ))}
    </aside>
  );
}
