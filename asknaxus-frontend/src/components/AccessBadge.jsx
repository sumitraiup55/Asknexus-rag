import { Crown, MessageCircle, ShieldCheck } from "lucide-react";

const AccessBadge = ({ user, compact = false }) => {
  const role = user?.role || "employee";

  const isAdmin = role === "admin" || role === "super_admin";

  if (isAdmin) {
    return (
      <div className={compact ? "access-badge compact admin" : "access-badge admin"}>
        <Crown size={15} />
        <span>Admin Access</span>
      </div>
    );
  }

  return (
    <div className={compact ? "access-badge compact user" : "access-badge user"}>
      <MessageCircle size={15} />
      <span>AI Chat Access</span>
    </div>
  );
};

export const RoleInfoBadge = ({ user }) => {
  const role = user?.role || "employee";

  return (
    <div className="role-info-badge">
      <ShieldCheck size={16} />
      <span>{role.replace("_", " ")}</span>
    </div>
  );
};

export default AccessBadge;