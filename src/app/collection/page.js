import { requireUser } from "@/lib/auth/requireUser";

export default async function CollectionPage() {
  const user = await requireUser("/collection");

  return <main className="collection-page">{/* 기존 Collection 내용 */}</main>;
}
