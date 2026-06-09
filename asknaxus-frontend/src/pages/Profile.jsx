import {
  Building2,
  Mail,
  ShieldCheck,
  UserCircle,
  Users,
} from "lucide-react";

import DashboardLayout from "../components/DashboardLayout";
import { useAuth } from "../context/AuthContext";

import "../styles/profile.css";

const Profile = () => {
  const { user } = useAuth();

  const organization =
    user?.organization?.name ||
    user?.organizationId?.name ||
    "AskNexus Workspace";

  return (
    <DashboardLayout
      title="Profile"
      subtitle="View your AskNexus account and workspace access details."
    >
      <section className="profile-page">
        <div className="profile-hero">
          <div className="profile-avatar-large">
            {user?.fullName?.charAt(0)?.toUpperCase() || "U"}
          </div>

          <div>
            <h2>{user?.fullName || "User"}</h2>
            <p>{user?.email || "No email available"}</p>

            <div className="profile-badges">
              <span>{user?.role || "user"}</span>
              <span>{user?.department || "general"}</span>
            </div>
          </div>
        </div>

        <div className="profile-grid">
          <article className="profile-info-card">
            <UserCircle size={26} />
            <div>
              <p>Full Name</p>
              <h3>{user?.fullName || "N/A"}</h3>
            </div>
          </article>

          <article className="profile-info-card">
            <Mail size={26} />
            <div>
              <p>Email</p>
              <h3>{user?.email || "N/A"}</h3>
            </div>
          </article>

          <article className="profile-info-card">
            <ShieldCheck size={26} />
            <div>
              <p>Role</p>
              <h3>{user?.role || "N/A"}</h3>
            </div>
          </article>

          <article className="profile-info-card">
            <Users size={26} />
            <div>
              <p>Department</p>
              <h3>{user?.department || "N/A"}</h3>
            </div>
          </article>

          <article className="profile-info-card wide">
            <Building2 size={26} />
            <div>
              <p>Organization</p>
              <h3>{organization}</h3>
            </div>
          </article>
        </div>

        <div className="access-note">
          <h3>Your Access</h3>

          <p>
            Your AskNexus access is controlled by your role and department.
            Admin users can upload and manage documents. Employee and customer
            users can ask questions from documents allowed for their role.
          </p>
        </div>
      </section>
    </DashboardLayout>
  );
};

export default Profile;