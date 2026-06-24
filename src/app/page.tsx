import { redirect } from "next/navigation";

// トップは「さがす」画面へ
export default function Home() {
  redirect("/discover");
}
