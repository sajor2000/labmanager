import { redirect } from "next/navigation";

export default function HomePage() {
  // Redirect to the overview page
  redirect("/overview");
}