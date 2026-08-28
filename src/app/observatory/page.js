import { requireUser } from "@/lib/auth/requireUser";

export default async function ObservatoryPage() {
  const user = await requireUser("/observatory");

  return <main className="observatory-page">{/* 기존 My Observatory 내용 */}</main>;
}
