import { requireUser } from "@/lib/auth/requireUser";

export default async function NewObservationPage({ searchParams }) {
  const params = await searchParams;

  const objectId = params?.object;

  const nextPath = objectId ? `/observations/new?object=${objectId}` : "/observations/new";

  const user = await requireUser(nextPath);

  return (
    <main>
      {/* 기존 관측 등록 페이지 내용 */}

      <p>로그인 사용자: {user.email}</p>
    </main>
  );
}
