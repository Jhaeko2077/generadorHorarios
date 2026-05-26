import { NavLink } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

const adminLinks = [
  ["/", "Dashboard"],
  ["/admin/academic-terms", "Terms"],
  ["/admin/programs", "Programs"],
  ["/admin/cycles", "Cycles"],
  ["/admin/sections", "Sections"],
  ["/admin/courses", "Courses"],
  ["/admin/rooms", "Rooms"],
  ["/admin/time-slots", "Time Slots"],
  ["/admin/course-offerings", "Offerings"],
  ["/manual-locks", "Manual Locks"],
  ["/generate", "Generate"],
  ["/schedules/section", "By Section"],
  ["/schedules/teacher", "By Teacher"],
  ["/schedules/room", "By Room"],
  ["/conflicts", "Conflicts"],
  ["/recommendations", "Recommendations"],
  ["/audit", "Audit Logs"]
];

const teacherLinks = [
  ["/my-schedule", "My Schedule"],
  ["/teacher/profile", "Teacher Profile"],
  ["/teacher/availability", "Availability"]
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
