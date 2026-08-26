import { createClient } from "@/lib/supabase/server";

export default async function HomePage() {
  const supabase = await createClient();

  const { data: objects, error } = await supabase
    .from("celestial_objects")
    .select("id, name_en, name_ko")
    .limit(5);

  if (error) {
    return <div>Supabase 연결 오류: {error.message}</div>;
  }

  return (
    <main>
      <h1>AstroLog</h1>

      {objects.map(object => (
        <p key={object.id}>
          {object.name_en} / {object.name_ko}
        </p>
      ))}
    </main>
  );
}
