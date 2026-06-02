import { Route, Routes } from "react-router-dom";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import AcademicTermsPage from "./pages/AcademicTermsPage";
import AuditLogsPage from "./pages/AuditLogsPage";
import ConflictsPage from "./pages/ConflictsPage";
import CourseOfferingsPage from "./pages/CourseOfferingsPage";
import CoursesPage from "./pages/CoursesPage";
import CyclesPage from "./pages/CyclesPage";
import DashboardPage from "./pages/DashboardPage";
import ForbiddenPage from "./pages/ForbiddenPage";
import GenerateSchedulePage from "./pages/GenerateSchedulePage";
import LoginPage from "./pages/LoginPage";
import ManualLocksPage from "./pages/ManualLocksPage";
import MySchedulePage from "./pages/MySchedulePage";
import ProgramsPage from "./pages/ProgramsPage";
import RecommendationsPage from "./pages/RecommendationsPage";
import RegisterTeacherPage from "./pages/RegisterTeacherPage";
import RoomsPage from "./pages/RoomsPage";
import ScheduleByRoomPage from "./pages/ScheduleByRoomPage";
import ScheduleBySectionPage from "./pages/ScheduleBySectionPage";
import ScheduleByTeacherPage from "./pages/ScheduleByTeacherPage";
import ScheduleRunDetailPage from "./pages/ScheduleRunDetailPage";
import SectionsPage from "./pages/SectionsPage";
import TeacherAvailabilityPage from "./pages/TeacherAvailabilityPage";
import TeachersPage from "./pages/TeachersPage";
import TeacherProfilePage from "./pages/TeacherProfilePage";
import TimeSlotsPage from "./pages/TimeSlotsPage";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterTeacherPage />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route path="/forbidden" element={<ForbiddenPage />} />
        </Route>
      </Route>
      <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
        <Route element={<Layout />}>
          <Route index element={<DashboardPage />} />
          <Route path="/admin/teachers" element={<TeachersPage />} />
          <Route path="/admin/academic-terms" element={<AcademicTermsPage />} />
          <Route path="/admin/programs" element={<ProgramsPage />} />
          <Route path="/admin/cycles" element={<CyclesPage />} />
          <Route path="/admin/sections" element={<SectionsPage />} />
          <Route path="/admin/courses" element={<CoursesPage />} />
          <Route path="/admin/rooms" element={<RoomsPage />} />
          <Route path="/admin/time-slots" element={<TimeSlotsPage />} />
          <Route path="/admin/course-offerings" element={<CourseOfferingsPage />} />
          <Route path="/manual-locks" element={<ManualLocksPage />} />
          <Route path="/generate" element={<GenerateSchedulePage />} />
          <Route path="/schedules/section" element={<ScheduleBySectionPage />} />
          <Route path="/schedules/teacher" element={<ScheduleByTeacherPage />} />
          <Route path="/schedules/room" element={<ScheduleByRoomPage />} />
          <Route path="/conflicts" element={<ConflictsPage />} />
          <Route path="/recommendations" element={<RecommendationsPage />} />
          <Route path="/audit" element={<AuditLogsPage />} />
        </Route>
      </Route>
      <Route element={<ProtectedRoute allowedRoles={["admin", "teacher"]} />}>
        <Route element={<Layout />}>
          <Route path="/teacher/profile" element={<TeacherProfilePage />} />
          <Route path="/teacher/availability" element={<TeacherAvailabilityPage />} />
          <Route path="/my-schedule" element={<MySchedulePage />} />
          <Route path="/schedule-runs/:id" element={<ScheduleRunDetailPage />} />
        </Route>
      </Route>
    </Routes>
  );
}
