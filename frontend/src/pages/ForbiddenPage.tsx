import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export default function ForbiddenPage() {
  const { data: user } = useAuth();
  const home = user?.role === "teacher" ? "/my-schedule" : "/";
  return (
    <section className="panel">
      <h1>Access restricted</h1>
      <p>This page is not available for your role.</p>
      <Link className="button" to={home}>Go to your home page</Link>
    </section>
  );
}
