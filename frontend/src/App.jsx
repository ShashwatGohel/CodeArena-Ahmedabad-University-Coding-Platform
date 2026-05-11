import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './components/LandingPage';
import Login from './pages/Auth/Login';
import Signup from './pages/Auth/Signup';
import StudentDashboard from './pages/Student/StudentDashboard';
import StudentSubjectDashboard from './pages/Student/StudentSubjectDashboard';
import StudentArena from './pages/Student/StudentArena';
import EndedContests from './pages/Student/EndedContests';
import ProblemSolve from './pages/Student/ProblemSolve';
import SubjectList from './pages/Faculty/SubjectList';
import SubjectDashboard from './pages/Faculty/SubjectDashboard';
import ContestMonitor from './pages/Faculty/ContestMonitor';
import EndedContestsFaculty from './pages/Faculty/EndedContestsFaculty';
import UpcomingContestsFaculty from './pages/Faculty/UpcomingContestsFaculty';
import StudentAnalyticsFaculty from './pages/Faculty/StudentAnalyticsFaculty';
import ForgotPassword from './pages/Auth/ForgotPassword';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/student/dashboard" element={<StudentDashboard />} />
        <Route path="/student/subject/:id" element={<StudentSubjectDashboard />} />
        <Route path="/student/ended-contests" element={<EndedContests />} />
        <Route path="/student/contest/:id/arena" element={<StudentArena />} />
        <Route path="/student/contest/:id/problem/:problemId" element={<ProblemSolve />} />
        <Route path="/faculty/dashboard" element={<SubjectList />} />
        <Route path="/faculty/subject/:id" element={<SubjectDashboard />} />
        <Route path="/faculty/ended-contests" element={<EndedContestsFaculty />} />
        <Route path="/faculty/upcoming-contests" element={<UpcomingContestsFaculty />} />
        <Route path="/faculty/student-analytics" element={<StudentAnalyticsFaculty />} />
        <Route path="/faculty/contest/:id/monitor" element={<ContestMonitor />} />
      </Routes>
    </Router>
  );
}

export default App;
