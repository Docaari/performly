import { redirect } from "next/navigation";

export default function Home() {
  // O aplicativo Performly MVP usa o Dashboard como porta de entrada nativa
  redirect("/dashboard");
}
