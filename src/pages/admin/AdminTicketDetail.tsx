import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";

/**
 * Legacy detail route — preserves bookmarks/links by redirecting to the
 * new 3-panel inbox (`/admin/tickets?id=…`).
 */
const AdminTicketDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  useEffect(() => {
    if (id) navigate(`/admin/tickets?id=${id}`, { replace: true });
    else navigate("/admin/tickets", { replace: true });
  }, [id, navigate]);
  return null;
};

export default AdminTicketDetail;
