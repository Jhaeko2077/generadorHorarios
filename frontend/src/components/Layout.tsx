import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";

export default function Layout() {
  return (
    <>
      <Navbar />
      <main className="shell">
        <Sidebar />
        <div className="content">
          <Outlet />
        </div>
      </main>
    </>
  );
}
