import { LogOut } from "lucide-react";
import { clearToken } from "../api/client";
import { useAuth } from "../hooks/useAuth";

export default function Navbar() {
  const { data: user } = useAuth();
  return (
    <header className="navbar">
      <div>
        <strong>Academic Timetable Optimizer</strong>
        <span>{user ? `${user.full_name} / ${user.role}` : "SmartSchedule Institute"}</span>
      </div>
      <button
        className="iconButton"
        title="Sign out"
        onClick={() => {
          clearToken();
          location.href = "/login";
        }}
      >
        <LogOut size={18} />
      </button>
    </header>
  );
}
